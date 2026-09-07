-- ═══════════════════════════════════════════════════════════════════
-- ROTA · prova de isolamento e de auditoria
--
-- Não é teste unitário: é a demonstração de que as duas garantias que a
-- spec §10 exige valem no BANCO, e não só na tela.
--   1. Um gestor não enxerga nem grava em base que não é a dele (RLS).
--   2. A auditoria é append-only, e adulteração é detectável mesmo por quem
--      tiver privilégio para desligar o gatilho.
--
-- Como rodar, num Postgres 16 limpo:
--   createdb rota
--   psql -d rota -v ON_ERROR_STOP=1 -f supabase/schema.sql
--   psql -d rota -v ON_ERROR_STOP=1 -f supabase/migrations/0001_auditoria_hash_chain.sql
--   psql -d rota -f supabase/testes/rls_e_auditoria.sql
--
-- Esperado: 2 / 0 / erro de policy / 1 · elegíveis 1 e 1 · ocupação 13% e 8%
-- · cadeia íntegra (vazio) · UPDATE e DELETE proibidos · adulteração forçada
-- devolvendo o id 1.
-- ═══════════════════════════════════════════════════════════════════

\set ON_ERROR_STOP off
-- duas bases, dois gestores, dois pacientes
insert into bases (id,municipio,uf,contratante) values
  ('11111111-1111-1111-1111-111111111111','Floriano','PI','Prefeitura de Floriano'),
  ('22222222-2222-2222-2222-222222222222','Caico','RN','Prefeitura de Caico');
insert into gestores (id,base_id,nome,email) values
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Gestora Floriano','f@ex.br'),
  ('bbbbbbbb-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Gestor Caico','c@ex.br');
insert into destinos (id,base_id,nome,municipio,uf,km,km_fonte) values
  ('dddddddd-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Teresina - oncologia','Teresina','PI',252,'DNIT'),
  ('dddddddd-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Clinica local','Floriano','PI',8,'DNIT'),
  ('dddddddd-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','Natal - oncologia','Natal','RN',280,'DNIT');
insert into pacientes (id,base_id,nome,cns,nascimento,municipio,ponto_embarque,tratamento,destino_id,acompanhante) values
  ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Paciente Floriano','700','1960-01-01','Floriano','UBS','radioterapia','dddddddd-0000-0000-0000-000000000001',true),
  ('cccccccc-0000-0000-0000-000000000009','11111111-1111-1111-1111-111111111111','Quimio Floriano','701','1960-01-01','Floriano','UBS','quimioterapia','dddddddd-0000-0000-0000-000000000001',false),
  ('cccccccc-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Paciente Caico','800','1960-01-01','Caico','UBS','hemodialise','dddddddd-0000-0000-0000-000000000003',false);

\echo '--- RLS: gestor de Floriano ve quantos pacientes? (esperado 2)'
create role app nologin; grant all on all tables in schema public to app; grant usage on schema public to app;
set role app;
select set_config('rota.gestor_id','aaaaaaaa-0000-0000-0000-000000000001',false);
select count(*) as pacientes_visiveis from pacientes;
\echo '--- tenta ler paciente da outra base pelo id (esperado 0)'
select count(*) as vazamento from pacientes where id='cccccccc-0000-0000-0000-000000000002';
\echo '--- tenta gravar paciente NA OUTRA base (esperado erro de policy)'
insert into pacientes (base_id,nome,cns,nascimento,municipio,ponto_embarque,tratamento,destino_id)
values ('22222222-2222-2222-2222-222222222222','Invasor','999','1960-01-01','X','Y','consulta','dddddddd-0000-0000-0000-000000000003');
\echo '--- gestor de Caico ve quantos? (esperado 1)'
select set_config('rota.gestor_id','bbbbbbbb-0000-0000-0000-000000000002',false);
select count(*) as pacientes_visiveis from pacientes;
reset role;
\set ON_ERROR_STOP off
-- viagem mista: 1 radioterapia (elegivel, 252km) + 1 quimioterapia (nao elegivel), mesmo veiculo
insert into veiculos (id,base_id,identificacao,placa,classe,descricao,lotacao,prox_rev_km)
 values ('eeeeeeee-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','ROTA-02','QLF-2B45','micro','Micro-onibus',24,70000);
insert into viagens (id,base_id,chave,data,hora,destino_id,veiculo_id,km_previsto)
 values ('ffffffff-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','2026-07-06:ter:ROTA-02','2026-07-06','05:00','dddddddd-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001',504);
insert into viagem_pacientes (viagem_id,paciente_id,acompanhante) values
 ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001',true),
 ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000009',false);
-- so o elegivel embarcou e voltou
insert into embarques (viagem_id,paciente_id,presente_ida,presente_volta) values
 ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001',true,true),
 ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000009',false,false);

\echo '=== B2 no banco: a viagem e mista; a contagem e por paciente ==='
select tratamento, km, elegivel, comprovado from deslocamentos order by tratamento;
\echo '--- deslocamentos elegiveis programados / comprovados (esperado 1 / 1) ---'
select count(*) filter (where elegivel) as elegiveis_programados,
       count(*) filter (where elegivel and comprovado) as elegiveis_comprovados,
       count(*) as viagens_contadas_pelo_metodo_antigo_seria_1 from deslocamentos;

\echo '=== A5: ocupacao programada x realizada (3 assentos programados, 2 realizados de 24) ==='
select assentos_programados, assentos_realizados, lotacao,
       round(assentos_programados*100.0/lotacao) as ocup_programada,
       round(assentos_realizados*100.0/lotacao) as ocup_realizada from ocupacao_viagem;

\echo '=== Auditoria: append encadeado ==='
insert into auditoria (base_id,gestor_id,acao,entidade,entidade_id,payload) values
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001','baixa','viagem','ffffffff-0000-0000-0000-000000000001','{"km":504}'),
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001','emissao','documento','1','{"tipo":"relatorio"}');
select id, acao, left(hash_anterior,8) as hash_ant, left(hash_atual,8) as hash_at from auditoria order by id;
\echo '--- cadeia integra? (NULL = sim) ---'
select * from verificar_cadeia_auditoria('11111111-1111-1111-1111-111111111111');
\echo '--- UPDATE na auditoria (esperado: proibido) ---'
update auditoria set acao='adulterado' where id=1;
\echo '--- DELETE na auditoria (esperado: proibido) ---'
delete from auditoria where id=1;
\echo '--- adulteracao forcada (desligando o gatilho) e nova verificacao ---'
alter table auditoria disable trigger trg_auditoria_no_update;
update auditoria set acao='adulterado' where id=1;
alter table auditoria enable trigger trg_auditoria_no_update;
select * from verificar_cadeia_auditoria('11111111-1111-1111-1111-111111111111');
