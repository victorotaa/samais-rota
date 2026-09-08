-- ═══════════════════════════════════════════════════════════════════
-- ROTA · asserções do banco — pass/fail, para rodar em CI
--
-- A prova em rls_e_auditoria.sql demonstra e imprime; esta aqui decide.
-- Cada garantia vira um `assert`: se qualquer uma cair, o psql sai com
-- código diferente de zero e o CI fica vermelho. É a diferença entre
-- documentar a garantia e defendê-la.
--
--   psql -v ON_ERROR_STOP=1 -f supabase/testes/assercoes.sql
--
-- Roda em transação e desfaz tudo no fim: pode rodar quantas vezes
-- quiser no mesmo banco.
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

-- ─── fixtures ──────────────────────────────────────────────────────
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
insert into veiculos (id,base_id,identificacao,placa,classe,descricao,lotacao,prox_rev_km) values
  ('eeeeeeee-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','ROTA-02','QLF-2B45','micro','Micro-onibus',24,70000);
insert into viagens (id,base_id,chave,data,hora,destino_id,veiculo_id,km_previsto) values
  ('ffffffff-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','2026-07-06:ter:ROTA-02','2026-07-06','05:00','dddddddd-0000-0000-0000-000000000001','eeeeeeee-0000-0000-0000-000000000001',504);
insert into viagem_pacientes (viagem_id,paciente_id,acompanhante) values
  ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001',true),
  ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000009',false);
insert into embarques (viagem_id,paciente_id,presente_ida,presente_volta) values
  ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001',true,true),
  ('ffffffff-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000009',false,false);

-- ─── 1. Elegibilidade federal é do banco, não da tela ──────────────
do $$
begin
  assert     elegivel_federal('radioterapia', 252), 'radioterapia a 252 km deveria ser elegivel';
  assert     elegivel_federal('hemodialise',  51),  'hemodialise a 51 km deveria ser elegivel';
  assert not elegivel_federal('radioterapia', 50),  'o piso e ESTRITAMENTE maior que 50 km';
  assert not elegivel_federal('radioterapia', 501), 'o teto e 500 km';
  assert not elegivel_federal('quimioterapia',252), 'quimioterapia nao entra na portaria';
  assert not elegivel_federal('consulta',     252), 'consulta nao entra na portaria';
  raise notice 'ok · elegibilidade nos seis cantos';
end $$;

-- ─── 2. Isolamento por contrato (RLS), sob papel sem bypass ────────
do $$
declare n int;
begin
  set local role rota_app;
  perform set_config('rota.gestor_id','aaaaaaaa-0000-0000-0000-000000000001', true);

  select count(*) into n from pacientes;
  assert n = 2, format('gestora de Floriano deveria ver 2 pacientes, viu %s', n);

  select count(*) into n from pacientes where id = 'cccccccc-0000-0000-0000-000000000002';
  assert n = 0, 'vazou paciente da outra base consultando pelo id';

  select count(*) into n from viagens;
  assert n = 1, format('deveria ver 1 viagem da propria base, viu %s', n);

  perform set_config('rota.gestor_id','bbbbbbbb-0000-0000-0000-000000000002', true);
  select count(*) into n from pacientes;
  assert n = 1, format('gestor de Caico deveria ver 1 paciente, viu %s', n);

  reset role;
  raise notice 'ok · leitura isolada por base';
end $$;

do $$
begin
  set local role rota_app;
  perform set_config('rota.gestor_id','aaaaaaaa-0000-0000-0000-000000000001', true);
  begin
    insert into pacientes (base_id,nome,cns,nascimento,municipio,ponto_embarque,tratamento,destino_id)
    values ('22222222-2222-2222-2222-222222222222','Invasor','999','1960-01-01','X','Y','consulta','dddddddd-0000-0000-0000-000000000003');
    reset role;
    assert false, 'RLS deveria ter recusado gravacao em base alheia';
  exception when insufficient_privilege then
    null;   -- 42501: era exatamente o esperado
  end;
  reset role;
  raise notice 'ok · escrita em base alheia recusada pelo banco';
end $$;

-- ─── 3. A unidade de comprovação é o paciente-deslocamento ─────────
do $$
declare prog int; comp int; total int;
begin
  select count(*) filter (where elegivel),
         count(*) filter (where elegivel and comprovado),
         count(*)
    into prog, comp, total
    from deslocamentos;
  assert total = 2, format('a viagem mista tem 2 deslocamentos, veio %s', total);
  assert prog  = 1, format('so 1 dos 2 e elegivel, veio %s', prog);
  assert comp  = 1, format('so 1 embarcou e voltou, veio %s', comp);
  raise notice 'ok · contagem por paciente, nao por viagem';
end $$;

-- ─── 4. Ocupação programada ≠ realizada ────────────────────────────
do $$
declare p int; r int; lot int;
begin
  select assentos_programados, assentos_realizados, lotacao into p, r, lot from ocupacao_viagem;
  assert p = 3, format('3 assentos programados (1 paciente + acompanhante + 1), veio %s', p);
  assert r = 2, format('2 assentos realizados, veio %s', r);
  assert p <> r, 'programada e realizada precisam ser grandezas distintas';
  assert lot = 24, 'lotacao do micro-onibus';
  raise notice 'ok · ocupacao programada 3/24 e realizada 2/24';
end $$;

-- ─── 5. Numeração de documento é sequencial por base e por tipo ────
do $$
declare n int;
begin
  n := proximo_documento('11111111-1111-1111-1111-111111111111','manifesto');
  assert n = 1, format('primeiro manifesto deveria ser 1, veio %s', n);
  insert into documentos (base_id,tipo,num_sequencial,emitido_por)
    values ('11111111-1111-1111-1111-111111111111','manifesto',n,'aaaaaaaa-0000-0000-0000-000000000001');

  n := proximo_documento('11111111-1111-1111-1111-111111111111','manifesto');
  assert n = 2, format('segundo manifesto deveria ser 2, veio %s', n);

  n := proximo_documento('11111111-1111-1111-1111-111111111111','relatorio_mensal');
  assert n = 1, 'a serie e por tipo: relatorio comeca do 1';

  n := proximo_documento('22222222-2222-2222-2222-222222222222','manifesto');
  assert n = 1, 'a serie e por base: Caico comeca do 1';

  -- a corrida entre dois gestores nao pode gerar dois documentos com o mesmo numero
  begin
    insert into documentos (base_id,tipo,num_sequencial,emitido_por)
      values ('11111111-1111-1111-1111-111111111111','manifesto',1,'aaaaaaaa-0000-0000-0000-000000000001');
    assert false, 'numero repetido deveria violar a unicidade';
  exception when unique_violation then
    null;
  end;
  raise notice 'ok · numeracao sequencial por base e por tipo, sem repetir';
end $$;

-- ─── 6. Auditoria: encadeada, append-only, adulteração detectável ──
insert into auditoria (base_id,gestor_id,acao,entidade,entidade_id,payload) values
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001','baixa','viagem','ffffffff-0000-0000-0000-000000000001','{"km":504}'),
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001','emissao','documento','1','{"tipo":"relatorio"}');

do $$
declare n int; adulterado bigint;
begin
  select count(*) into n from auditoria where hash_atual is not null;
  assert n = 2, 'toda linha de auditoria carrega hash';

  select count(*) into n from auditoria a
    where a.id > (select min(id) from auditoria) and a.hash_anterior is null;
  assert n = 0, 'a partir da segunda, toda linha aponta para a anterior';

  select primeiro_id_adulterado into adulterado
    from verificar_cadeia_auditoria('11111111-1111-1111-1111-111111111111');
  assert adulterado is null, format('cadeia deveria estar integra, acusou id %s', adulterado);

  begin
    update auditoria set acao = 'adulterado' where id = (select min(id) from auditoria);
    assert false, 'UPDATE na auditoria deveria ser proibido';
  exception when others then
    assert sqlerrm like '%append-only%', format('erro inesperado no UPDATE: %s', sqlerrm);
  end;

  begin
    delete from auditoria where id = (select min(id) from auditoria);
    assert false, 'DELETE na auditoria deveria ser proibido';
  exception when others then
    assert sqlerrm like '%append-only%', format('erro inesperado no DELETE: %s', sqlerrm);
  end;
  raise notice 'ok · auditoria encadeada e append-only';
end $$;

-- adulteração forçada por quem tem privilégio de dono: precisa ser detectada
alter table auditoria disable trigger trg_auditoria_no_update;
update auditoria set acao = 'adulterado' where id = (select min(id) from auditoria);
alter table auditoria enable trigger trg_auditoria_no_update;

do $$
declare adulterado bigint; menor bigint;
begin
  select min(id) into menor from auditoria;
  select primeiro_id_adulterado into adulterado
    from verificar_cadeia_auditoria('11111111-1111-1111-1111-111111111111');
  assert adulterado = menor,
    format('a verificacao deveria acusar o id %s, devolveu %s', menor, adulterado);
  raise notice 'ok · adulteracao forcada e detectada, e aponta a primeira linha';
end $$;

-- ─── 7. Deriva de isolamento ──────────────────────────────────────
-- Tabela nova sem RLS, sem política ou sem force é vazamento esperando
-- data. Só roda se a migração 0003 estiver aplicada.
do $$
declare fora text;
begin
  if to_regprocedure('verificar_isolamento()') is null then
    raise notice 'ok · (0003 nao aplicada; conferencia de deriva pulada)';
    return;
  end if;
  select string_agg(tabela || ' (' || problema || ')', ', ') into fora from verificar_isolamento();
  assert fora is null, format('tabelas fora do padrao de isolamento: %s', fora);
  raise notice 'ok · nenhuma tabela fora do padrao de isolamento';
end $$;

rollback;
\echo ''
\echo '  Todas as asserções do banco passaram.'
