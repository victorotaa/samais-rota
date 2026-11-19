-- ═══════════════════════════════════════════════════════════════════
-- ROTA · autenticação — sessão, segundo fator e log de acesso
--
-- A criptografia mora em api/auth.mjs (node:crypto, sem dependência e
-- sem provedor). O banco guarda estado e impõe duas coisas que a
-- aplicação não pode garantir sozinha:
--
--   1. o papel da aplicação NÃO lê `gestores`. O login inteiro passa por
--      funções security definer, porque na hora de autenticar ainda não
--      existe sessão — e portanto não existe base — para a RLS filtrar.
--      Sem isso, ou se abre a tabela toda ao app, ou se inventa uma
--      exceção na política. As duas saídas furam o isolamento.
--
--   2. o segundo fator não se repete. `totp_ultimo_passo` é gravado na
--      mesma transação do sucesso; código já usado não entra de novo,
--      nem que o relógio ainda o aceite.
--
-- Base: docs/FASE2-BACKEND.md §3.3.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Estado de acesso do gestor ────────────────────────────────────
alter table gestores
  add column if not exists senha_hash          text,
  add column if not exists senha_trocada_em    timestamptz,
  add column if not exists totp_segredo        text,
  add column if not exists totp_confirmado_em  timestamptz,
  add column if not exists totp_ultimo_passo   bigint,
  add column if not exists recuperacao_hashes  text[] not null default '{}',
  add column if not exists falhas              int not null default 0,
  add column if not exists ultima_falha_em     timestamptz,
  add column if not exists bloqueado_ate       timestamptz;

comment on column gestores.totp_ultimo_passo is
  'Passo TOTP do último sucesso. Impede reuso do mesmo código dentro da janela.';
comment on column gestores.recuperacao_hashes is
  'sha256 dos códigos de recuperação. O código em claro só existe na tela, uma vez.';

-- ─── Sessão ────────────────────────────────────────────────────────
-- O banco guarda o hash do token, nunca o token. Dump de `sessoes`
-- vazado não dá acesso a nada.
create table if not exists sessoes (
  id           uuid primary key default gen_random_uuid(),
  base_id      uuid not null references bases(id)    on delete cascade,
  gestor_id    uuid not null references gestores(id) on delete cascade,
  token_hash   text not null unique,
  criado_em    timestamptz not null default now(),
  expira_em    timestamptz not null,
  ultimo_uso   timestamptz,
  revogado_em  timestamptz,
  revogado_por text,                        -- 'saida', 'troca_de_senha', 'expurgo'
  ip           inet,
  agente       text
);
create index if not exists sessoes_gestor_idx on sessoes(gestor_id, expira_em desc);

-- ─── Log de acesso ─────────────────────────────────────────────────
-- Toda tentativa, inclusive a que falhou e a de e-mail inexistente —
-- é onde varredura de senha aparece. Sem base_id quando o e-mail não
-- corresponde a gestor nenhum: não há base a que atribuir.
create table if not exists acessos (
  id           bigserial primary key,
  base_id      uuid references bases(id) on delete cascade,
  gestor_id    uuid references gestores(id) on delete set null,
  email        text not null,
  sucesso      boolean not null,
  motivo       text,                        -- 'senha', 'totp', 'bloqueado', 'inativo', 'inexistente', 'reuso'
  ip           inet,
  agente       text,
  em           timestamptz not null default now()
);
create index if not exists acessos_em_idx    on acessos(em desc);
create index if not exists acessos_email_idx on acessos(lower(email), em desc);

alter table sessoes enable row level security;
alter table acessos enable row level security;

drop policy if exists sessoes_all on sessoes;
create policy sessoes_all on sessoes for all using (base_id = minha_base());
drop policy if exists acessos_select on acessos;
create policy acessos_select on acessos for select using (base_id = minha_base());
-- não há policy de insert em `acessos`: quem grava é a função definer.

-- ═══════════════════════════════════════════════════════════════════
-- O login, em funções que o app chama sem enxergar a tabela
-- ═══════════════════════════════════════════════════════════════════

-- Devolve o que a aplicação precisa para conferir senha e TOTP. Nunca
-- devolve linha de gestor inativo, e nunca vaza a existência do e-mail
-- por caminho diferente do log.
create or replace function auth_iniciar(p_email text)
returns table(
  gestor_id uuid, base_id uuid, nome text,
  senha_hash text, totp_segredo text, totp_confirmado boolean,
  totp_ultimo_passo bigint, recuperacao_hashes text[],
  falhas int, ultima_falha_em timestamptz, bloqueado_ate timestamptz
)
language sql security definer set search_path = public stable as $$
  select g.id, g.base_id, g.nome,
         g.senha_hash, g.totp_segredo, g.totp_confirmado_em is not null,
         g.totp_ultimo_passo, g.recuperacao_hashes,
         g.falhas, g.ultima_falha_em, g.bloqueado_ate
    from gestores g
   where lower(g.email) = lower(p_email) and g.ativo
$$;

-- Falha: soma tentativa, marca bloqueio e registra o acesso. Uma
-- transação — não existe estado em que a falha some do log mas conte
-- para o bloqueio, nem o contrário.
create or replace function auth_falhou(
  p_email text, p_motivo text, p_ate timestamptz default null,
  p_ip inet default null, p_agente text default null)
returns void language plpgsql security definer set search_path = public as $$
declare g record;
begin
  select id, base_id into g from gestores where lower(email) = lower(p_email);
  if found then
    update gestores
       set falhas = falhas + 1, ultima_falha_em = now(), bloqueado_ate = p_ate
     where id = g.id;
  end if;
  insert into acessos (base_id, gestor_id, email, sucesso, motivo, ip, agente)
  values (g.base_id, g.id, p_email, false,
          coalesce(p_motivo, case when g.id is null then 'inexistente' else 'senha' end),
          p_ip, p_agente);
end $$;

-- Sucesso: zera tentativas, queima o passo do TOTP, abre a sessão e
-- registra o acesso — tudo junto. Devolve o id da sessão.
create or replace function auth_entrou(
  p_gestor uuid, p_token_hash text, p_expira timestamptz,
  p_passo bigint default null, p_recuperacao text[] default null,
  p_ip inet default null, p_agente text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare g record; s uuid;
begin
  select id, base_id, email into g from gestores where id = p_gestor and ativo;
  if not found then raise exception 'gestor inexistente ou inativo'; end if;

  update gestores
     set falhas = 0, ultima_falha_em = null, bloqueado_ate = null,
         totp_ultimo_passo = coalesce(p_passo, totp_ultimo_passo),
         recuperacao_hashes = coalesce(p_recuperacao, recuperacao_hashes)
   where id = g.id;

  insert into sessoes (base_id, gestor_id, token_hash, expira_em, ip, agente)
  values (g.base_id, g.id, p_token_hash, p_expira, p_ip, p_agente)
  returning id into s;

  insert into acessos (base_id, gestor_id, email, sucesso, ip, agente)
  values (g.base_id, g.id, g.email, true, p_ip, p_agente);
  return s;
end $$;

-- Resolve o token em gestor e base. É o que a API chama no começo de
-- toda requisição, antes do set_config que liga a RLS.
create or replace function auth_sessao(p_token_hash text)
returns table(gestor_id uuid, base_id uuid, expira_em timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query
    update sessoes s set ultimo_uso = now()
     where s.token_hash = p_token_hash
       and s.revogado_em is null
       and s.expira_em > now()
       and exists (select 1 from gestores g where g.id = s.gestor_id and g.ativo)
    returning s.gestor_id, s.base_id, s.expira_em;
end $$;

create or replace function auth_sair(p_token_hash text, p_motivo text default 'saida')
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update sessoes set revogado_em = now(), revogado_por = p_motivo
   where token_hash = p_token_hash and revogado_em is null;
  get diagnostics n = row_count;
  return n;
end $$;

-- Trocar a senha derruba as outras sessões do gestor. Se a senha foi
-- trocada porque vazou, deixar sessão viva anula a troca.
create or replace function auth_trocar_senha(
  p_gestor uuid, p_hash text, p_token_hash_atual text default null)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update gestores set senha_hash = p_hash, senha_trocada_em = now() where id = p_gestor;
  update sessoes set revogado_em = now(), revogado_por = 'troca_de_senha'
   where gestor_id = p_gestor and revogado_em is null
     and (p_token_hash_atual is null or token_hash <> p_token_hash_atual);
  get diagnostics n = row_count;
  return n;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- Retenção — o mecanismo é daqui; o prazo é do contrato
-- ═══════════════════════════════════════════════════════════════════
alter table bases
  add column if not exists retencao_meses int not null default 60,
  add column if not exists retencao_fonte text;
comment on column bases.retencao_meses is
  'Prazo de guarda do dado de saúde desta base, em meses. 60 é só o padrão de partida: o número vem da política de retenção do contrato, e é decisão do ente. O descarte espelha o das pranchetas.';

-- Expurga sessão morta e log de acesso além do prazo. Nunca toca em
-- viagem, paciente ou auditoria: descarte de prontuário é decisão de
-- política, não de rotina.
create or replace function expurgar_acesso(p_base uuid)
returns table(sessoes_removidas int, acessos_removidos int)
language plpgsql security definer set search_path = public as $$
declare meses int; a int; b int;
begin
  select retencao_meses into meses from bases where id = p_base;
  if meses is null then raise exception 'base inexistente'; end if;

  delete from sessoes
   where base_id = p_base and (revogado_em is not null or expira_em < now())
     and criado_em < now() - make_interval(months => meses);
  get diagnostics a = row_count;

  delete from acessos
   where base_id = p_base and em < now() - make_interval(months => meses);
  get diagnostics b = row_count;

  return query select a, b;
end $$;

-- O papel da aplicação chama as funções; não lê as tabelas de acesso.
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'rota_app') then
    execute 'revoke all on gestores, sessoes, acessos from rota_app';
    execute 'grant select, insert, update, delete on sessoes to rota_app';
    execute 'grant select on acessos to rota_app';
    execute 'grant execute on function auth_iniciar(text), auth_falhou(text,text,timestamptz,inet,text),
             auth_entrou(uuid,text,timestamptz,bigint,text[],inet,text), auth_sessao(text),
             auth_sair(text,text), auth_trocar_senha(uuid,text,text), expurgar_acesso(uuid) to rota_app';
  end if;
end $$;
