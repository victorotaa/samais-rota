-- ═══════════════════════════════════════════════════════════════════
-- ROTA · migração 0004 — Portaria GM/MS nº 11.165/2026 (com a 11.164/2026)
--
-- Desenho: docs/PORTARIA-11165-INTEGRACAO.md. Regras: regras/portaria-11165.mjs
-- (fonte única). Especificação: samais-os/produtos/rota/portaria-11165.md.
--
-- O que muda no banco:
--   1. a elegibilidade federal deixa de medir da BASE ao destino e passa a
--      medir do MUNICÍPIO DE RESIDÊNCIA ao MUNICÍPIO SEDE DO SERVIÇO, com
--      ente diverso, hemodiálise na mesma UF, serviço habilitado e
--      agendamento confirmado — em três estados, como o módulo;
--   2. dados novos: residência do paciente, serviço de referência,
--      distâncias de município a município, agendamento confirmado, doação
--      e renovação do veículo, pactuação da base e remessas BPA-I;
--   3. CPF em lugar nenhum (decisão do Ota, 16/10/2026): o faturamento do
--      ente completa o CPF; `verificar_sem_cpf()` acusa coluna que aparecer.
--
-- Lacuna nunca vira zero: dado ausente fica nulo e a regra devolve
-- 'pendente'. Aplicar DEPOIS da 0003. Idempotente.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Paciente: município de residência ─────────────────────────────
alter table pacientes
  add column if not exists municipio_residencia_ibge char(7)
    check (municipio_residencia_ibge ~ '^[0-9]{7}$'),
  add column if not exists uf_residencia char(2)
    check (uf_residencia ~ '^[A-Z]{2}$');
comment on column pacientes.municipio_residencia_ibge is
  'IBGE (7 dígitos) do município de residência: origem da distância da Port. 11.165 (arts. 15 e 16). Nulo = a levantar → elegibilidade pendente.';

-- ─── Destino = serviço de referência ───────────────────────────────
alter table destinos
  add column if not exists municipio_ibge char(7) check (municipio_ibge ~ '^[0-9]{7}$'),
  add column if not exists cnes char(7) check (cnes ~ '^[0-9]{7}$'),
  add column if not exists habilitacao_conferida boolean,
  add column if not exists habilitacao_codigo text,
  add column if not exists modalidades tratamento_tipo[] not null default '{}';
comment on column destinos.municipio_ibge is
  'IBGE do município sede do serviço: destino da distância que decide a elegibilidade.';
comment on column destinos.habilitacao_conferida is
  'Habilitação do serviço conferida (radioterapia; hemodiálise 15.04). Nulo = não conferida → pendente (RE-06).';
comment on column destinos.km is
  'Distância operacional da BASE ao destino (rota, km previsto). NÃO decide elegibilidade desde a 0004.';

-- ─── Distâncias de município a município ───────────────────────────
-- Matriz oficial é lacuna (L5): cada base registra o que leu e de onde.
create table if not exists distancias_municipais (
  base_id       uuid not null references bases(id) on delete cascade,
  origem_ibge   char(7) not null check (origem_ibge  ~ '^[0-9]{7}$'),
  destino_ibge  char(7) not null check (destino_ibge ~ '^[0-9]{7}$'),
  km            numeric(7,1) check (km >= 0),          -- nulo = a levantar
  fonte         text,
  lido_em       date,
  atualizado_em timestamptz not null default now(),
  primary key (base_id, origem_ibge, destino_ibge),
  constraint distancia_com_procedencia check (km is null or (fonte is not null and lido_em is not null))
);

-- ─── Agendamento confirmado do tratamento (art. 13 §3º) ────────────
create table if not exists agendamentos (
  id          uuid primary key default gen_random_uuid(),
  base_id     uuid not null references bases(id) on delete cascade,
  paciente_id uuid not null references pacientes(id) on delete cascade,
  destino_id  uuid not null references destinos(id) on delete restrict,
  data        date not null,
  confirmado  boolean,                    -- nulo = sem resposta do serviço → pendente
  etapa       text check (etapa in ('planejamento','tratamento')),   -- radioterapia, art. 15 p.ú.
  protocolo   text,
  atualizado_em timestamptz not null default now(),
  unique (paciente_id, destino_id, data)
);
create index if not exists agendamentos_base_data_idx on agendamentos(base_id, data);

-- ─── Veículo: doação, prazos e renovação ───────────────────────────
alter table veiculos
  add column if not exists doado_ms boolean,
  add column if not exists termo_doacao_ref text,
  add column if not exists finalidade_doacao text
    check (finalidade_doacao in ('radioterapia','hemodialise','outros')),
  add column if not exists data_recebimento date,
  add column if not exists prorrogacao boolean not null default false,
  add column if not exists cnes_estabelecimento char(7) check (cnes_estabelecimento ~ '^[0-9]{7}$'),
  add column if not exists cnes_inscrito_em date,
  add column if not exists primeira_viagem_concluida date,
  add column if not exists emplacado_em date,
  add column if not exists disponibilidade_12m numeric(4,3)
    check (disponibilidade_12m >= 0 and disponibilidade_12m <= 1),
  add column if not exists laudo boolean;
comment on column veiculos.cnes_prazo is
  'Legado: prazo digitado. Desde a 0004 o prazo do CNES é calculado de data_recebimento (+60 dias, art. 11 III).';
comment on column veiculos.primeira_viagem_concluida is
  'Marco do art. 10 §3º. Vazio: a API lê a primeira baixa do veículo a partir do recebimento.';

-- ─── Pactuação da base (art. 14 p.ú.; art. 25, 4º item) ────────────
-- Tabela própria, 1:1 com bases: abrir UPDATE em `bases` daria ao gestor
-- o custo por km, a retenção e o contratante junto.
create table if not exists base_pactuacao (
  base_id                     uuid primary key references bases(id) on delete cascade,
  deliberacao_cib             text,                 -- nulo = a levantar
  deliberacao_cib_data        date,
  estrutura_gestao_registrada boolean,
  municipios_abrangidos       char(7)[] not null default '{}'
    check (array_to_string(municipios_abrangidos, ',') ~ '^([0-9]{7}(,[0-9]{7})*)?$'),
  inicio_incentivo            date check (inicio_incentivo = date_trunc('month', inicio_incentivo)::date),
  atualizado_em               timestamptz not null default now()
);

-- ─── Remessas BPA-I informadas pelo faturamento (art. 21) ──────────
-- Quem envia ao SIA é o faturamento do ente; o ROTA registra o que foi
-- enviado. Competência sem informação: linhas nulas (a conferir), nunca 0.
create table if not exists remessas_bpa (
  id              uuid primary key default gen_random_uuid(),
  base_id         uuid not null references bases(id) on delete cascade,
  competencia     date not null check (competencia = date_trunc('month', competencia)::date),
  linhas_enviadas int check (linhas_enviadas >= 0),
  enviada_em      date,
  informado_por   text not null,          -- setor ou instituição (ex.: faturamento da SMS)
  gestor_id       uuid not null references gestores(id),
  registrado_em   timestamptz not null default now(),
  unique (base_id, competencia),
  constraint remessa_enviada_tem_data check (coalesce(linhas_enviadas, 0) = 0 or enviada_em is not null)
);

-- ═══════════════════════════════════════════════════════════════════
-- Elegibilidade federal — espelho de elegibilidade11165 (regras/portaria-11165.mjs)
-- Mesma ordem de regras, mesmos três estados. A paridade é testada em
-- testes/paridade-elegibilidade.e2e.mjs; não altere um lado sem o outro.
--   RE-01 modalidade — 11.165 art. 1º §1º I e II
--   RE-02 ente diverso — Lei 12.732 arts. 2º-A §3º e 2º-B §3º
--   RE-03 > 50 km de município a município — 11.165 arts. 1º §1º, 15, 16
--   RE-04 ≤ 500 km — 11.164 art. 23 caput
--   RE-05 hemodiálise na mesma UF — 11.164 art. 23 caput
--   RE-06 serviço habilitado — 11.165 art. 1º §1º I; art. 16 I
--   RE-07 agendamento confirmado — 11.165 art. 13 §3º
-- ═══════════════════════════════════════════════════════════════════
drop view if exists deslocamentos;

-- A assinatura antiga media da BASE ao destino: a régua errada. Não se
-- apaga porque a 0003 a nomeia no GRANT (a cadeia 0001…0004 precisa poder
-- rodar de novo); fica como lápide que recusa ser usada.
create or replace function elegivel_federal(p_tratamento tratamento_tipo, p_km numeric)
returns boolean language plpgsql volatile as $$
begin
  raise exception 'elegivel_federal(tratamento, km) media da base ao destino e foi aposentada na 0004: '
    'use elegivel_federal(modalidade, residencia_ibge, residencia_uf, servico_ibge, servico_uf, '
    'habilitacao_conferida, distancia_km, agendamento_confirmado)';
end $$;

create or replace function elegibilidade_federal(
  p_modalidade text, p_residencia_ibge text, p_residencia_uf text,
  p_servico_ibge text, p_servico_uf text, p_habilitacao_conferida boolean,
  p_distancia_km numeric, p_agendamento_confirmado boolean,
  out status text, out regras_violadas text[], out pendencias text[])
language plpgsql immutable as $$
declare
  km_ok boolean := p_distancia_km is not null and p_distancia_km <> 'NaN'::numeric;
begin
  regras_violadas := '{}';
  pendencias := '{}';

  if p_modalidade is null or p_modalidade not in ('radioterapia','hemodialise') then
    regras_violadas := regras_violadas || 'RE-01'::text;
  end if;

  if p_residencia_ibge is null or p_servico_ibge is null then
    pendencias := pendencias || 'RE-02'::text;
  elsif p_residencia_ibge = p_servico_ibge then
    regras_violadas := regras_violadas || 'RE-02'::text;
  end if;

  if not km_ok then
    pendencias := pendencias || 'RE-03'::text;
  elsif p_distancia_km <= 50 then
    regras_violadas := regras_violadas || 'RE-03'::text;
  end if;

  if km_ok and p_distancia_km > 500 then
    regras_violadas := regras_violadas || 'RE-04'::text;
  end if;

  if p_modalidade = 'hemodialise' then
    if p_residencia_uf is null or p_servico_uf is null then
      pendencias := pendencias || 'RE-05'::text;
    elsif p_residencia_uf <> p_servico_uf then
      regras_violadas := regras_violadas || 'RE-05'::text;
    end if;
  end if;

  if p_habilitacao_conferida is false then
    regras_violadas := regras_violadas || 'RE-06'::text;
  elsif p_habilitacao_conferida is null then
    pendencias := pendencias || 'RE-06'::text;
  end if;

  if p_agendamento_confirmado is false then
    regras_violadas := regras_violadas || 'RE-07'::text;
  elsif p_agendamento_confirmado is null then
    pendencias := pendencias || 'RE-07'::text;
  end if;

  status := case when cardinality(regras_violadas) > 0 then 'inelegivel'
                 when cardinality(pendencias) > 0 then 'pendente'
                 else 'elegivel' end;
end $$;

create or replace function elegivel_federal(
  p_modalidade text, p_residencia_ibge text, p_residencia_uf text,
  p_servico_ibge text, p_servico_uf text, p_habilitacao_conferida boolean,
  p_distancia_km numeric, p_agendamento_confirmado boolean)
returns boolean language sql immutable as $$
  select (elegibilidade_federal(p_modalidade, p_residencia_ibge, p_residencia_uf, p_servico_ibge,
          p_servico_uf, p_habilitacao_conferida, p_distancia_km, p_agendamento_confirmado)).status = 'elegivel'
$$;

-- Um registro por paciente-deslocamento, agora com as ENTRADAS da regra
-- (residência, serviço, distância municipal, agendamento do dia) e a
-- SAÍDA (elegibilidade em três estados). É desta view que saem o
-- relatório mensal e a pré-remessa BPA-I.
create view deslocamentos with (security_invoker = true) as
select
  v.base_id,
  v.id                         as viagem_id,
  v.data,
  v.veiculo_id,
  v.destino_id,
  vp.paciente_id,
  p.tratamento,
  p.municipio_residencia_ibge  as residencia_ibge,
  p.uf_residencia              as residencia_uf,
  d.municipio_ibge             as servico_ibge,
  d.uf                         as servico_uf,
  d.habilitacao_conferida,
  dm.km                        as distancia_km,
  ag.confirmado                as agendamento_confirmado,
  ag.etapa,
  el.status                    as elegibilidade,
  el.regras_violadas,
  el.pendencias,
  el.status = 'elegivel'       as elegivel,
  coalesce(e.presente_ida and e.presente_volta, false) as comprovado,
  coalesce(e.presente_ida, false)   as presente_ida,
  coalesce(e.presente_volta, false) as presente_volta,
  vp.acompanhante,
  vp.assentos,
  vl.lotacao
from viagens v
join viagem_pacientes vp on vp.viagem_id = v.id
join pacientes p         on p.id = vp.paciente_id
join destinos  d         on d.id = v.destino_id
join veiculos  vl        on vl.id = v.veiculo_id
left join distancias_municipais dm
       on dm.base_id = v.base_id
      and dm.origem_ibge = p.municipio_residencia_ibge
      and dm.destino_ibge = d.municipio_ibge
left join agendamentos ag
       on ag.paciente_id = vp.paciente_id and ag.destino_id = v.destino_id and ag.data = v.data
left join embarques e    on e.viagem_id = v.id and e.paciente_id = vp.paciente_id
cross join lateral elegibilidade_federal(
  p.tratamento::text, p.municipio_residencia_ibge, p.uf_residencia,
  d.municipio_ibge, d.uf, d.habilitacao_conferida, dm.km, ag.confirmado) el;

-- ═══════════════════════════════════════════════════════════════════
-- CPF em lugar nenhum. Lista qualquer coluna do esquema public com "cpf"
-- no nome, em qualquer caixa. O CI exige lista vazia e a API não sobe
-- se vier preenchida.
-- ═══════════════════════════════════════════════════════════════════
create or replace function verificar_sem_cpf()
returns table(tabela name, coluna name)
language sql stable as $$
  select c.relname, a.attname
    from pg_attribute a
    join pg_class c     on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r','v','m','p','f')
     and a.attnum > 0 and not a.attisdropped
     and a.attname ilike '%cpf%'
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Isolamento por contrato nas tabelas novas: ligada, FORÇADA e com
-- política (verificar_isolamento() da 0003 cobra as três).
-- ═══════════════════════════════════════════════════════════════════
alter table distancias_municipais enable row level security;
alter table agendamentos          enable row level security;
alter table base_pactuacao        enable row level security;
alter table remessas_bpa          enable row level security;
alter table distancias_municipais force row level security;
alter table agendamentos          force row level security;
alter table base_pactuacao        force row level security;
alter table remessas_bpa          force row level security;

drop policy if exists distancias_all on distancias_municipais;
create policy distancias_all on distancias_municipais for all using (base_id = minha_base());
drop policy if exists agendamentos_all on agendamentos;
create policy agendamentos_all on agendamentos for all using (base_id = minha_base());
drop policy if exists pactuacao_all on base_pactuacao;
create policy pactuacao_all on base_pactuacao for all using (base_id = minha_base());
drop policy if exists remessas_all on remessas_bpa;
create policy remessas_all on remessas_bpa for all using (base_id = minha_base());

do $$ begin
  if exists (select 1 from pg_roles where rolname = 'rota_app') then
    execute 'grant select, insert, update, delete on
               distancias_municipais, agendamentos, base_pactuacao, remessas_bpa to rota_app';
    execute 'grant select on deslocamentos to rota_app';
    execute 'grant execute on function
               elegibilidade_federal(text,text,text,text,text,boolean,numeric,boolean),
               elegivel_federal(text,text,text,text,text,boolean,numeric,boolean),
               verificar_sem_cpf() to rota_app';
  end if;
end $$;
