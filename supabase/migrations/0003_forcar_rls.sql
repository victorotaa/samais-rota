-- ═══════════════════════════════════════════════════════════════════
-- ROTA · a RLS não vale para o dono da tabela
--
-- Descoberto quando a API subiu pela primeira vez: conectada com o
-- papel dono do banco — que é o que a maioria das strings de conexão
-- entrega por padrão, no Supabase e no Neon —, a sessão de Floriano
-- leu e EDITOU paciente de Caicó. Nenhuma política falhou: o Postgres
-- simplesmente não aplica RLS ao dono nem a superusuário.
--
-- As provas anteriores não pegaram porque rodavam `set role rota_app`
-- antes de consultar. Provavam a política; não provavam a conexão.
--
-- Duas defesas, e as duas são necessárias:
--
--   1. `force row level security` nas tabelas que carregam dado de
--      saúde — passa a valer também para o dono;
--   2. a API se recusa a subir com papel superusuário ou com BYPASSRLS
--      (api/db.mjs), porque contra superusuário não existe force.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Forçado: onde mora o dado do paciente ─────────────────────────
alter table destinos          force row level security;
alter table pacientes         force row level security;
alter table autorizacoes      force row level security;
alter table veiculos          force row level security;
alter table abastecimentos    force row level security;
alter table manutencoes       force row level security;
alter table viagens           force row level security;
alter table viagem_pacientes  force row level security;
alter table baixas            force row level security;
alter table embarques         force row level security;
alter table documentos        force row level security;

-- ─── Não forçado, e por quê ────────────────────────────────────────
-- `bases`, `gestores`, `sessoes`, `acessos` e `auditoria` continuam com
-- RLS ligada (a política vale para o papel da aplicação) mas SEM force,
-- porque as funções security definer precisam atravessá-las quando
-- ainda não há sessão — é o caso do login inteiro — ou quando a
-- operação é do operador do banco e não de um gestor:
--
--   auth_iniciar / auth_falhou / auth_entrou / auth_sessao   → gestores, sessoes, acessos
--   expurgar_acesso                                          → bases
--   verificar_cadeia_auditoria                               → auditoria
--
-- Forçar essas cinco não aumentaria a proteção do dado assistencial e
-- quebraria a verificação da cadeia de hash de um jeito silencioso: a
-- função passaria a não ver linha nenhuma e responderia "íntegra".

-- ─── Papel da aplicação ────────────────────────────────────────────
-- Sem login: é papel de privilégio, não de conexão. O usuário que a API
-- usa recebe este papel por herança, e é criado no provisionamento com
-- senha própria:
--
--   create role rota_api login password '...' in role rota_app;
--
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'rota_app') then
    create role rota_app nologin;
  end if;
end $$;

grant usage on schema public to rota_app;
grant select, insert, update, delete on
  bases, destinos, pacientes, autorizacoes, veiculos, abastecimentos,
  manutencoes, viagens, viagem_pacientes, baixas, embarques, documentos, sessoes
  to rota_app;
-- As views rodam com o privilégio do DONO por padrão no Postgres, o que
-- as tornaria uma porta lateral em volta da RLS. security_invoker faz
-- valer a política de quem consulta, que é o ponto inteiro delas.
alter view deslocamentos    set (security_invoker = true);
alter view ocupacao_viagem  set (security_invoker = true);
grant select on deslocamentos, ocupacao_viagem to rota_app;

grant select, insert on auditoria to rota_app;   -- append-only também no privilégio
grant select on acessos to rota_app;
revoke all on gestores from rota_app;            -- só pelas funções de login
grant usage, select on all sequences in schema public to rota_app;
grant execute on function
  elegivel_federal(tratamento_tipo, numeric), proximo_documento(uuid, documento_tipo),
  gestor_atual(), minha_base(),
  auth_iniciar(text), auth_falhou(text, text, timestamptz, inet, text),
  auth_entrou(uuid, text, timestamptz, bigint, text[], inet, text),
  auth_sessao(text), auth_sair(text, text), auth_trocar_senha(uuid, text, text)
  to rota_app;

-- ═══════════════════════════════════════════════════════════════════
-- Conferência de deriva: uma tabela nova sem RLS é um vazamento
-- esperando data. Esta função lista o que está fora do padrão, e o CI
-- exige lista vazia.
-- ═══════════════════════════════════════════════════════════════════
create or replace function verificar_isolamento()
returns table(tabela name, problema text)
language sql stable as $$
  with esperado_sem_force(t) as (
    values ('bases'::name), ('gestores'), ('sessoes'), ('acessos'), ('auditoria')
  )
  select c.relname,
         case
           when not c.relrowsecurity then 'RLS desligada'
           when not c.relforcerowsecurity and c.relname not in (select t from esperado_sem_force)
             then 'RLS não forçada — o dono da conexão passa por cima'
           when not exists (select 1 from pg_policies p
                             where p.schemaname = 'public' and p.tablename = c.relname)
             then 'sem política'
         end
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname not in ('schema_migrations')
     and (
       not c.relrowsecurity
       or (not c.relforcerowsecurity and c.relname not in (select t from esperado_sem_force))
       or not exists (select 1 from pg_policies p
                       where p.schemaname = 'public' and p.tablename = c.relname)
     )
$$;
