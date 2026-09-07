-- ═══════════════════════════════════════════════════════════════════
-- ROTA — Fase 2 · esquema do backend
-- Gestão de transporte sanitário eletivo · Samais Gestão em Saúde
--
-- Base: docs/ROTA-SPEC.md §7, revisto por docs/REVISAO-ROTA-APP.md.
-- Multi-tenant por `base_id` com row-level security: o isolamento entre
-- contratos vive no BANCO, não na aplicação. Um erro de filtro na tela não
-- pode vazar paciente de outro município.
--
-- Aplicar em PostgreSQL 15+ (Supabase/Neon/RDS) em REGIÃO BRASIL — dado
-- sensível de saúde, LGPD art. 11. Depois deste arquivo, aplicar
-- migrations/0001_auditoria_hash_chain.sql.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ─── Domínios tipados ───────────────────────────────────────────────
-- Revisão M/A2: regra de negócio nunca decide por texto livre. O que o
-- protótipo resolvia com regex ("hemodi|radio") é enum aqui.

create type tratamento_tipo as enum (
  'hemodialise','radioterapia','quimioterapia','consulta','exame','fisioterapia','outro'
);
create type necessidade_tipo as enum (
  'nenhuma','cadeirante','maca','menor','obeso'
);
create type veiculo_classe as enum ('van','micro','ambulancia','embarcacao');
create type viagem_status as enum ('programada','concluida','cancelada');
create type origem_autorizacao as enum ('tfd','regulacao');
create type documento_tipo as enum ('manifesto','folha_embarque','relatorio_mensal');

-- ─── Base (unidade de contrato) ─────────────────────────────────────

create table bases (
  id             uuid primary key default gen_random_uuid(),
  municipio      text not null,
  uf             char(2) not null,
  contratante    text not null,
  contrato_ref   text,
  -- Revisão A4: o custo por km é parâmetro do contrato, não número mágico
  custo_km       numeric(8,2) not null default 0.90,
  custo_km_fonte text not null default 'parâmetro da base · definido no contrato',
  -- Revisão A5/A1: janela de suspensão da Port. 11.164 em dias
  janela_suspensao_dias int not null default 90,
  ativa          boolean not null default true,
  created_at     timestamptz not null default now()
);

-- O gestor é identificado aqui; o vínculo com o provedor de identidade fica
-- em auth_uid. Não amarrar a tabela a auth.users mantém o schema portável
-- entre Supabase, Neon e RDS — a spec §9 deixa o provedor em aberto.
create table gestores (
  id         uuid primary key default gen_random_uuid(),
  auth_uid   uuid unique,
  base_id    uuid not null references bases(id) on delete restrict,
  nome       text not null,
  email      text not null unique,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);
create index on gestores(base_id);

-- ─── Destinos e distância ───────────────────────────────────────────
-- A distância é o que qualifica o cofinanciamento; nunca estimar.

create table destinos (
  id            uuid primary key default gen_random_uuid(),
  base_id       uuid not null references bases(id) on delete cascade,
  nome          text not null,
  municipio     text not null,
  uf            char(2) not null,
  km            numeric(7,1) not null check (km >= 0),
  km_fonte      text not null,          -- base rodoviária oficial consultada
  km_verificado_em date,
  created_at    timestamptz not null default now()
);
create index on destinos(base_id);

-- ─── Pacientes e autorização ────────────────────────────────────────

create table pacientes (
  id             uuid primary key default gen_random_uuid(),
  base_id        uuid not null references bases(id) on delete cascade,
  nome           text not null,
  cns            text not null,
  nascimento     date not null,
  municipio      text not null,
  ponto_embarque text not null,
  tratamento     tratamento_tipo not null,
  especialidade  text,                  -- rótulo livre; NUNCA usado em regra
  destino_id     uuid not null references destinos(id) on delete restrict,
  recorrencia    text[] not null default '{}',   -- {seg,ter,qua,qui,sex}
  acompanhante   boolean not null default false,
  necessidade    necessidade_tipo not null default 'nenhuma',
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (base_id, cns)
);
create index on pacientes(base_id);

create table autorizacoes (
  id            uuid primary key default gen_random_uuid(),
  base_id       uuid not null references bases(id) on delete cascade,
  paciente_id   uuid not null references pacientes(id) on delete cascade,
  origem        origem_autorizacao not null,
  processo_ref  text not null,
  validade      date not null,
  created_at    timestamptz not null default now()
);
create index on autorizacoes(paciente_id);

-- ─── Frota ──────────────────────────────────────────────────────────

create table veiculos (
  id             uuid primary key default gen_random_uuid(),
  base_id        uuid not null references bases(id) on delete cascade,
  identificacao  text not null,          -- ROTA-01
  placa          text not null,
  classe         veiculo_classe not null,
  descricao      text not null,
  lotacao        int not null check (lotacao > 0),
  condutor       text,
  assistente     text,
  hodometro      int not null default 0,
  rev_intervalo_km int not null default 10000,
  prox_rev_km    int not null,
  -- RN-07: veículo federal tem 60 dias para entrar no CNES
  cnes_num       text,
  cnes_prazo     date,
  origem         text,                   -- 'Caminhos da Saúde (federal)' etc.
  ativo          boolean not null default true,
  created_at     timestamptz not null default now(),
  unique (base_id, identificacao)
);
create index on veiculos(base_id);

create table abastecimentos (
  id          uuid primary key default gen_random_uuid(),
  base_id     uuid not null references bases(id) on delete cascade,
  veiculo_id  uuid not null references veiculos(id) on delete restrict,
  data        date not null,
  litros      numeric(8,2) not null check (litros > 0),
  km_desde_ultimo int not null check (km_desde_ultimo >= 0),
  valor       numeric(10,2) not null check (valor >= 0),
  gestor_id   uuid references gestores(id),
  created_at  timestamptz not null default now()
);
create index on abastecimentos(base_id, data);

create table manutencoes (
  id         uuid primary key default gen_random_uuid(),
  base_id    uuid not null references bases(id) on delete cascade,
  veiculo_id uuid not null references veiculos(id) on delete restrict,
  data       date not null,
  km         int not null,
  tipo       text not null,
  valor      numeric(10,2),
  descricao  text,
  created_at timestamptz not null default now()
);
create index on manutencoes(base_id, data);

-- ─── Viagens ────────────────────────────────────────────────────────

create table viagens (
  id           uuid primary key default gen_random_uuid(),
  base_id      uuid not null references bases(id) on delete cascade,
  -- Revisão M6: chave estável derivada do conteúdo, não da ordem de geração
  chave        text not null,            -- 2026-07-06:destino:veiculo
  sequencia    int not null default 1,   -- >1 quando dividida por lotação
  data         date not null,
  hora         time not null,
  destino_id   uuid not null references destinos(id) on delete restrict,
  veiculo_id   uuid not null references veiculos(id) on delete restrict,
  km_previsto  numeric(7,1) not null,
  status       viagem_status not null default 'programada',
  created_at   timestamptz not null default now(),
  unique (base_id, chave, sequencia)
);
create index on viagens(base_id, data);

create table viagem_pacientes (
  viagem_id    uuid not null references viagens(id) on delete cascade,
  paciente_id  uuid not null references pacientes(id) on delete restrict,
  acompanhante boolean not null default false,
  -- assentos ocupados por este paciente (1 + acompanhante)
  assentos     int generated always as (1 + case when acompanhante then 1 else 0 end) stored,
  primary key (viagem_id, paciente_id)
);

-- ─── Baixa: a unidade de comprovação é o PACIENTE-DESLOCAMENTO ──────
-- Revisão B2: a portaria remunera o deslocamento de cada paciente em
-- radioterapia/hemodiálise acima de 50 km, não a viagem. Contar viagens
-- infla a comprovação e é o que suspende repasse em auditoria.

create table baixas (
  viagem_id   uuid primary key references viagens(id) on delete cascade,
  base_id     uuid not null references bases(id) on delete cascade,
  data        date not null,            -- data real do registro (RN-08)
  km_rodado   numeric(7,1) not null check (km_rodado > 0),
  litros      numeric(8,2) not null default 0 check (litros >= 0),
  diarias     int not null default 0 check (diarias >= 0),
  gestor_id   uuid not null references gestores(id),
  created_at  timestamptz not null default now()
);
create index on baixas(base_id, data);

create table embarques (
  viagem_id      uuid not null references viagens(id) on delete cascade,
  paciente_id    uuid not null references pacientes(id) on delete restrict,
  presente_ida   boolean not null default false,
  presente_volta boolean not null default false,
  falta_motivo   text,
  primary key (viagem_id, paciente_id)
);

-- ─── Documentos emitidos (numeração sequencial por base) ────────────

create table documentos (
  id             bigserial primary key,
  base_id        uuid not null references bases(id) on delete cascade,
  tipo           documento_tipo not null,
  num_sequencial int not null,
  viagem_id      uuid references viagens(id) on delete set null,
  competencia    date,                   -- mês de referência do relatório
  emitido_em     timestamptz not null default now(),
  emitido_por    uuid not null references gestores(id),
  unique (base_id, tipo, num_sequencial)
);

-- ─── Auditoria (append-only; cadeia de hash em 0001) ───────────────

create table auditoria (
  id          bigserial primary key,
  base_id     uuid not null references bases(id) on delete cascade,
  gestor_id   uuid references gestores(id),
  acao        text not null,
  entidade    text not null,
  entidade_id text,
  payload     jsonb,
  hash_anterior text,
  created_at  timestamptz not null default now()
);
create index on auditoria(base_id, id);

-- ═══════════════════════════════════════════════════════════════════
-- Elegibilidade federal — no banco, não na tela
-- Port. GM/MS 11.164 e 11.179/2026: hemodiálise ou radioterapia,
-- deslocamento > 50 km e ≤ 500 km.
-- ═══════════════════════════════════════════════════════════════════

create or replace function elegivel_federal(p_tratamento tratamento_tipo, p_km numeric)
returns boolean language sql immutable as $$
  select p_tratamento in ('hemodialise','radioterapia') and p_km > 50 and p_km <= 500
$$;

-- Um registro por paciente-deslocamento, com a marca de elegibilidade e de
-- comprovação. É desta view que sai o relatório mensal.
create or replace view deslocamentos as
select
  v.base_id,
  v.id                     as viagem_id,
  v.data,
  vp.paciente_id,
  p.tratamento,
  d.km,
  elegivel_federal(p.tratamento, d.km)                        as elegivel,
  coalesce(e.presente_ida and e.presente_volta, false)          as comprovado,
  vp.assentos,
  vl.lotacao
from viagens v
join viagem_pacientes vp on vp.viagem_id = v.id
join pacientes p         on p.id = vp.paciente_id
join destinos  d         on d.id = v.destino_id
join veiculos  vl        on vl.id = v.veiculo_id
left join embarques e    on e.viagem_id = v.id and e.paciente_id = vp.paciente_id;

-- Ocupação: PROGRAMADA é planejamento, REALIZADA é comprovação (revisão A5).
-- Só a realizada vai ao relatório — a portaria pede quem de fato embarcou.
create or replace view ocupacao_viagem as
select
  v.base_id, v.id as viagem_id, v.data, vl.lotacao,
  sum(vp.assentos)                                                    as assentos_programados,
  sum(case when coalesce(e.presente_ida,false) then vp.assentos else 0 end) as assentos_realizados
from viagens v
join veiculos vl on vl.id = v.veiculo_id
join viagem_pacientes vp on vp.viagem_id = v.id
left join embarques e on e.viagem_id = v.id and e.paciente_id = vp.paciente_id
group by v.base_id, v.id, v.data, vl.lotacao;

-- ═══════════════════════════════════════════════════════════════════
-- Row-level security — o isolamento por contrato vive aqui
-- ═══════════════════════════════════════════════════════════════════

alter table bases            enable row level security;
alter table gestores         enable row level security;
alter table destinos         enable row level security;
alter table pacientes        enable row level security;
alter table autorizacoes     enable row level security;
alter table veiculos         enable row level security;
alter table abastecimentos   enable row level security;
alter table manutencoes      enable row level security;
alter table viagens          enable row level security;
alter table viagem_pacientes enable row level security;
alter table baixas           enable row level security;
alter table embarques        enable row level security;
alter table documentos       enable row level security;
alter table auditoria        enable row level security;

-- Quem é o gestor da requisição. A API abre a transação com
--   select set_config('rota.gestor_id', '<uuid>', true);
-- No Supabase, trocar o corpo por:
--   select id from gestores where auth_uid = auth.uid() and ativo
create or replace function gestor_atual() returns uuid
language sql stable as $$
  select nullif(current_setting('rota.gestor_id', true), '')::uuid
$$;

create or replace function minha_base() returns uuid
language sql stable security definer set search_path = public as
$$ select base_id from gestores where id = gestor_atual() and ativo $$;

create policy base_select      on bases          for select using (id = minha_base());
create policy gestores_select  on gestores       for select using (base_id = minha_base());
create policy destinos_all     on destinos       for all    using (base_id = minha_base());
create policy pacientes_all    on pacientes      for all    using (base_id = minha_base());
create policy autorizacoes_all on autorizacoes   for all    using (base_id = minha_base());
create policy veiculos_all     on veiculos       for all    using (base_id = minha_base());
create policy abastec_all      on abastecimentos for all    using (base_id = minha_base());
create policy manut_all        on manutencoes    for all    using (base_id = minha_base());
create policy viagens_all      on viagens        for all    using (base_id = minha_base());
create policy baixas_all       on baixas         for all    using (base_id = minha_base());
create policy documentos_all   on documentos     for all    using (base_id = minha_base());

-- Tabelas de ligação não têm base_id: herdam o isolamento da viagem.
create policy viagem_pac_all on viagem_pacientes for all
  using (exists (select 1 from viagens v where v.id = viagem_id and v.base_id = minha_base()));
create policy embarques_all on embarques for all
  using (exists (select 1 from viagens v where v.id = viagem_id and v.base_id = minha_base()));

-- Auditoria: escreve na própria base, lê a própria base, nunca altera.
create policy auditoria_insert on auditoria for insert with check (base_id = minha_base());
create policy auditoria_select on auditoria for select using (base_id = minha_base());

-- ═══════════════════════════════════════════════════════════════════
-- Numeração sequencial de documento, por base e tipo (RF-04, Fase 2)
-- ═══════════════════════════════════════════════════════════════════

create or replace function proximo_documento(p_base uuid, p_tipo documento_tipo)
returns int language sql security definer set search_path = public as $$
  select coalesce(max(num_sequencial), 0) + 1
    from documentos where base_id = p_base and tipo = p_tipo
$$;
