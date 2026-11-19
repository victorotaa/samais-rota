-- ═══════════════════════════════════════════════════════════════════
-- ROTA · asserções da Portaria GM/MS 11.165/2026 no banco (migração 0004)
--
-- O que a 0004 promete e o CI cobra:
--   1. nenhuma coluna com CPF, em tabela nenhuma (decisão do Ota,
--      16/10/2026) — e a conferência acusa quando aparece;
--   2. a distância que decide é a de município a município, não a da
--      base ao destino; sem distância, pendente — nunca 0 km;
--   3. lacuna não vira zero também nas restrições das tabelas novas;
--   4. as tabelas novas ficam isoladas por contrato (RLS forçada).
--
--   psql -v ON_ERROR_STOP=1 -f supabase/testes/assercoes_11165.sql
--
-- Identificadores sintéticos (IBGE 99xxxxx). Roda em transação e desfaz.
-- ═══════════════════════════════════════════════════════════════════
\set ON_ERROR_STOP on
begin;

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'rota_app') then
    create role rota_app nologin;
  end if;
end $$;
grant usage on schema public to rota_app;
grant select, insert, update, delete on all tables in schema public to rota_app;
grant usage, select on all sequences in schema public to rota_app;

-- ─── 1. CPF em lugar nenhum ────────────────────────────────────────
do $$
declare fora text; n int;
begin
  select string_agg(tabela || '.' || coluna, ', ') into fora from verificar_sem_cpf();
  assert fora is null, format('coluna com CPF no esquema: %s', fora);

  -- a conferência precisa acusar quando aparece, em qualquer caixa
  create table public._sonda_cpf ("Paciente_CPF" text);
  select count(*) into n from verificar_sem_cpf() where tabela = '_sonda_cpf';
  assert n = 1, 'verificar_sem_cpf deveria acusar coluna com cpf no nome';
  drop table public._sonda_cpf;
  raise notice 'ok · nenhuma coluna com CPF, e a conferencia acusa quando aparece';
end $$;

-- ─── fixtures ──────────────────────────────────────────────────────
insert into bases (id,municipio,uf,contratante) values
  ('11111111-1111-1111-1111-111111111111','Floriano','PI','Prefeitura de Floriano'),
  ('22222222-2222-2222-2222-222222222222','Caico','RN','Prefeitura de Caico');
insert into gestores (id,base_id,nome,email) values
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Gestora Floriano','f@ex.br'),
  ('bbbbbbbb-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','Gestor Caico','c@ex.br');
-- D1: perto da base (8 km), mas o serviço fica em outro município a 252 km da residência
-- D2: longe da base (252 km), mas a distância de município a município não foi levantada
insert into destinos (id,base_id,nome,municipio,uf,km,km_fonte,municipio_ibge,habilitacao_conferida) values
  ('dddddddd-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Servico A','Sintetico A','PI',8,'DNIT','9900003',true),
  ('dddddddd-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Servico B','Sintetico B','PI',252,'DNIT','9900004',true),
  ('dddddddd-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','Servico C','Sintetico C','RN',280,'DNIT','9900203',true);
insert into pacientes (id,base_id,nome,cns,nascimento,municipio,ponto_embarque,tratamento,destino_id,municipio_residencia_ibge,uf_residencia) values
  ('cccccccc-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','PAC-SINT-A','900001','1960-01-01','Sintetico','UBS','radioterapia','dddddddd-0000-0000-0000-000000000001','9900001','PI'),
  ('cccccccc-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','PAC-SINT-B','900002','1960-01-01','Sintetico','UBS','radioterapia','dddddddd-0000-0000-0000-000000000002','9900001','PI'),
  ('cccccccc-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','PAC-SINT-C','900003','1960-01-01','Sintetico','UBS','hemodialise','dddddddd-0000-0000-0000-000000000003','9900201','RN');
insert into veiculos (id,base_id,identificacao,placa,classe,descricao,lotacao,prox_rev_km) values
  ('eeeeeeee-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','VEI-SINT-01','SNT-0A01','van','Van',15,70000),
  ('eeeeeeee-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','VEI-SINT-02','SNT-0A02','van','Van',15,70000);
insert into distancias_municipais (base_id,origem_ibge,destino_ibge,km,fonte,lido_em) values
  ('11111111-1111-1111-1111-111111111111','9900001','9900003',252,'SINT · matriz de teste','2026-10-16'),
  ('22222222-2222-2222-2222-222222222222','9900201','9900203',90,'SINT · matriz de teste','2026-10-16');
insert into viagens (id,base_id,chave,data,hora,destino_id,veiculo_id,km_previsto) values
  ('ffffffff-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','A','2026-08-03','05:00','dddddddd-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001',16),
  ('ffffffff-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','B','2026-08-03','05:00','dddddddd-0000-0000-0000-000000000002','eeeeeeee-0000-0000-0000-000000000001',504),
  ('ffffffff-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222','C','2026-08-03','05:00','dddddddd-0000-0000-0000-000000000003','eeeeeeee-0000-0000-0000-000000000002',560);
insert into viagem_pacientes (viagem_id,paciente_id) values
  ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001'),
  ('ffffffff-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000002'),
  ('ffffffff-0000-0000-0000-000000000003','cccccccc-0000-0000-0000-000000000003');
insert into agendamentos (base_id,paciente_id,destino_id,data,confirmado,etapa) values
  ('11111111-1111-1111-1111-111111111111','cccccccc-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001','2026-08-03',true,'planejamento'),
  ('11111111-1111-1111-1111-111111111111','cccccccc-0000-0000-0000-000000000002','dddddddd-0000-0000-0000-000000000002','2026-08-03',true,'planejamento'),
  ('22222222-2222-2222-2222-222222222222','cccccccc-0000-0000-0000-000000000003','dddddddd-0000-0000-0000-000000000003','2026-08-03',null,null);
insert into remessas_bpa (base_id,competencia,linhas_enviadas,enviada_em,informado_por,gestor_id) values
  ('11111111-1111-1111-1111-111111111111','2026-07-01',41,'2026-08-08','faturamento da SMS (sintetico)','aaaaaaaa-0000-0000-0000-000000000001'),
  ('22222222-2222-2222-2222-222222222222','2026-07-01',12,'2026-08-09','faturamento da SMS (sintetico)','bbbbbbbb-0000-0000-0000-000000000002');
insert into base_pactuacao (base_id,deliberacao_cib,estrutura_gestao_registrada,municipios_abrangidos,inicio_incentivo) values
  ('11111111-1111-1111-1111-111111111111','CIB-SINT-001',true,'{9900001}','2026-06-01'),
  ('22222222-2222-2222-2222-222222222222',null,null,'{}',null);

-- ─── 2. A distância que decide é de município a município ──────────
do $$
declare r record;
begin
  select * into r from deslocamentos where paciente_id = 'cccccccc-0000-0000-0000-000000000001';
  assert r.elegibilidade = 'elegivel' and r.elegivel,
    format('servico a 8 km da base mas a 252 km da residencia e elegivel: %s', row_to_json(r));
  assert r.distancia_km = 252, 'a distancia exposta e a de municipio a municipio';

  select * into r from deslocamentos where paciente_id = 'cccccccc-0000-0000-0000-000000000002';
  assert r.elegibilidade = 'pendente' and not r.elegivel,
    format('servico a 252 km da base sem distancia municipal levantada fica pendente: %s', row_to_json(r));
  assert r.pendencias = '{RE-03}', format('a pendencia e a distancia (RE-03): %s', r.pendencias);
  assert r.distancia_km is null, 'distancia nao levantada continua nula, nunca 0 km';

  select * into r from deslocamentos where paciente_id = 'cccccccc-0000-0000-0000-000000000003';
  assert r.elegibilidade = 'pendente' and r.pendencias = '{RE-07}',
    format('agendamento sem resposta do servico deixa pendente (RE-07): %s', row_to_json(r));
  raise notice 'ok · distancia de municipio a municipio decide; sem ela, pendente';
end $$;

do $$
declare recusou boolean := false;
begin
  begin
    perform elegivel_federal('radioterapia'::tratamento_tipo, 252);
  exception when others then
    recusou := sqlerrm like '%aposentada%';
  end;
  assert recusou, 'a assinatura antiga (base -> destino) nao pode mais responder';
  raise notice 'ok · a regua antiga (km da base ao destino) recusa ser usada';
end $$;

-- ─── 3. Lacuna não vira zero, também nas restrições ────────────────
do $$
declare
  falhou boolean;
  tentativas text[] := array[
    $q$insert into distancias_municipais (base_id,origem_ibge,destino_ibge,km) values ('11111111-1111-1111-1111-111111111111','9900001','9900009',100)$q$,
    $q$insert into remessas_bpa (base_id,competencia,linhas_enviadas,informado_por,gestor_id) values ('11111111-1111-1111-1111-111111111111','2026-08-01',10,'faturamento','aaaaaaaa-0000-0000-0000-000000000001')$q$,
    $q$insert into remessas_bpa (base_id,competencia,linhas_enviadas,enviada_em,informado_por,gestor_id) values ('11111111-1111-1111-1111-111111111111','2026-08-15',3,'2026-09-05','faturamento','aaaaaaaa-0000-0000-0000-000000000001')$q$,
    $q$insert into remessas_bpa (base_id,competencia,linhas_enviadas,enviada_em,informado_por,gestor_id) values ('11111111-1111-1111-1111-111111111111','2026-08-01',-1,'2026-09-05','faturamento','aaaaaaaa-0000-0000-0000-000000000001')$q$,
    $q$update pacientes set municipio_residencia_ibge = '12345' where id = 'cccccccc-0000-0000-0000-000000000001'$q$,
    $q$update destinos set cnes = 'SINT-01' where id = 'dddddddd-0000-0000-0000-000000000001'$q$,
    $q$update base_pactuacao set municipios_abrangidos = '{9900001,123}' where base_id = '11111111-1111-1111-1111-111111111111'$q$,
    $q$update base_pactuacao set inicio_incentivo = '2026-06-10' where base_id = '11111111-1111-1111-1111-111111111111'$q$,
    $q$update veiculos set disponibilidade_12m = 1.5 where id = 'eeeeeeee-0000-0000-0000-000000000001'$q$,
    $q$update veiculos set finalidade_doacao = 'qualquer' where id = 'eeeeeeee-0000-0000-0000-000000000001'$q$,
    $q$update agendamentos set etapa = 'consulta' where paciente_id = 'cccccccc-0000-0000-0000-000000000001'$q$,
    $q$insert into agendamentos (base_id,paciente_id,destino_id,data,confirmado) values ('11111111-1111-1111-1111-111111111111','cccccccc-0000-0000-0000-000000000001','dddddddd-0000-0000-0000-000000000001','2026-08-03',false)$q$
  ];
  q text;
begin
  foreach q in array tentativas loop
    falhou := false;
    begin
      execute q;
    exception when check_violation or unique_violation then
      falhou := true;
    end;
    assert falhou, format('deveria ter sido recusado: %s', q);
  end loop;

  -- o que É permitido: a lacuna declarada
  insert into distancias_municipais (base_id,origem_ibge,destino_ibge,km)
    values ('11111111-1111-1111-1111-111111111111','9900001','9900004',null);
  insert into remessas_bpa (base_id,competencia,linhas_enviadas,informado_por,gestor_id)
    values ('11111111-1111-1111-1111-111111111111','2026-08-01',null,'faturamento','aaaaaaaa-0000-0000-0000-000000000001');
  insert into remessas_bpa (base_id,competencia,linhas_enviadas,informado_por,gestor_id)
    values ('11111111-1111-1111-1111-111111111111','2026-09-01',0,'faturamento','aaaaaaaa-0000-0000-0000-000000000001');
  raise notice 'ok · % formas de transformar lacuna em numero recusadas; a lacuna declarada passa', array_length(tentativas, 1);
end $$;

-- ─── 4. Tabelas novas isoladas por contrato ────────────────────────
do $$
declare n int;
begin
  set local role rota_app;
  perform set_config('rota.gestor_id','aaaaaaaa-0000-0000-0000-000000000001', true);

  select count(*) into n from remessas_bpa;          assert n = 3, format('Floriano ve as 3 remessas dela, viu %s', n);
  select count(*) into n from agendamentos;          assert n = 2, format('Floriano ve 2 agendamentos, viu %s', n);
  select count(*) into n from distancias_municipais; assert n = 2, format('Floriano ve 2 distancias, viu %s', n);
  select count(*) into n from base_pactuacao;        assert n = 1, format('Floriano ve so a propria pactuacao, viu %s', n);
  select count(*) into n from deslocamentos;         assert n = 2, format('e so os proprios deslocamentos, viu %s', n);

  update base_pactuacao set deliberacao_cib = 'invasao' where base_id = '22222222-2222-2222-2222-222222222222';
  get diagnostics n = row_count;
  assert n = 0, 'nao altera a pactuacao de outra base';

  begin
    insert into remessas_bpa (base_id,competencia,linhas_enviadas,enviada_em,informado_por,gestor_id)
      values ('22222222-2222-2222-2222-222222222222','2026-08-01',5,'2026-09-05','x','aaaaaaaa-0000-0000-0000-000000000001');
    reset role;
    assert false, 'RLS deveria ter recusado remessa na base alheia';
  exception when insufficient_privilege then null;
  end;
  reset role;
  raise notice 'ok · remessas, agendamentos, distancias e pactuacao isolados por base';
end $$;

do $$
declare opc text[];
begin
  select reloptions into opc from pg_class where relname = 'deslocamentos';
  assert 'security_invoker=true' = any(opc), 'a view recriada precisa continuar security_invoker';
  raise notice 'ok · view de deslocamentos continua sob a politica de quem consulta';
end $$;

rollback;
\echo ''
\echo '  Asserções da Portaria 11.165 passaram.'
