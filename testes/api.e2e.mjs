/* ═══════════════════════════════════════════════════════════════════
   API de ponta a ponta — servidor de verdade, banco de verdade.

   Cria um banco próprio, aplica schema e migrações do zero (o que já
   prova que eles aplicam em base limpa), sobe a API numa porta efêmera,
   fala HTTP com ela e derruba tudo no fim.

   O que mais importa aqui não é o caminho feliz: é o que a API recusa.
   Sessão de um município não pode ler, escrever nem descobrir a
   existência do dado de outro — e a recusa tem de vir do banco, não de
   um `if` no handler.

     DATABASE_URL=postgres://... node testes/api.e2e.mjs
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';
import {hashSenha, segredoTotp, totp} from '../api/auth.mjs';

const url = process.env.DATABASE_URL;
if(!url){ console.log('\n  DATABASE_URL ausente — teste da API pulado.\n'); process.exit(0) }

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passou = 0, falhou = 0;
const ok = (nome, cond, d) => cond
  ? (passou++, console.log('  ok   ·', nome))
  : (falhou++, console.log('  FALHA·', nome, d !== undefined ? '→ ' + JSON.stringify(d) : ''));
const eq = (nome, a, b) => ok(nome, JSON.stringify(a) === JSON.stringify(b), {obtido: a, esperado: b});

/* ─── banco descartável ────────────────────────────────────────────── */
const nome = 'rota_api_' + Math.random().toString(36).slice(2, 8);
const admUrl = new URL(url); admUrl.pathname = '/postgres';
const adm = new pg.Client({connectionString: admUrl.toString()});
await adm.connect();
await adm.query(`create database ${nome}`);
const testeUrl = new URL(url); testeUrl.pathname = '/' + nome;

const cli = new pg.Client({connectionString: testeUrl.toString()});
await cli.connect();
for(const f of ['supabase/schema.sql','supabase/migrations/0001_auditoria_hash_chain.sql',
                'supabase/migrations/0002_autenticacao.sql','supabase/migrations/0003_forcar_rls.sql',
                'supabase/migrations/0004_portaria_11165.sql'])
  await cli.query(fs.readFileSync(path.join(raiz, f), 'utf8'));
console.log('\n── schema e migrações aplicam em base limpa ──');
ok('schema e quatro migrações aplicados sem erro', true);
const {rows: deriva} = await cli.query('select * from verificar_isolamento()');
eq('nenhuma tabela fora do padrão de isolamento', deriva, []);

/* ─── fixtures: dois municípios ────────────────────────────────────── */
const A = {base: null, gestor: null, email: 'gestora@floriano.pi.gov.br'};
const B = {base: null, gestor: null, email: 'gestor@caico.rn.gov.br'};
const SENHA = 'Rota!Micro-04-Amanhecer';
const barato = {N: 1 << 12, r: 8, p: 1, tamanho: 32};
A.segredo = segredoTotp();

for(const [m, mun, uf] of [[A,'Floriano','PI'], [B,'Caico','RN']]){
  const {rows} = await cli.query(
    `insert into bases (municipio,uf,contratante,custo_km) values ($1,$2,$3,0.9) returning id`,
    [mun, uf, 'Prefeitura de ' + mun]);
  m.base = rows[0].id;
  const g = await cli.query(
    `insert into gestores (base_id,nome,email,senha_hash,totp_segredo,totp_confirmado_em)
     values ($1,$2,$3,$4,$5,$6) returning id`,
    [m.base, 'Gestor ' + mun, m.email, hashSenha(SENHA, barato),
     m === A ? A.segredo : null, m === A ? new Date() : null]);
  m.gestor = g.rows[0].id;
  const d = await cli.query(
    `insert into destinos (base_id,nome,municipio,uf,km,km_fonte) values
       ($1,$2,$3,$4,252,'DNIT'), ($1,$5,$3,$4,8,'DNIT') returning id`,
    [m.base, `Capital de ${uf} — oncologia`, mun, uf, 'Clínica de diálise']);
  m.destinoLonge = d.rows[0].id; m.destinoPerto = d.rows[1].id;
  const v = await cli.query(
    `insert into veiculos (base_id,identificacao,placa,classe,descricao,lotacao,prox_rev_km,condutor)
     values ($1,$2,$3,'micro','Micro-ônibus',24,70000,'Condutor') returning id`,
    [m.base, m === A ? 'ROTA-02' : 'CAICO-01', m === A ? 'QLF-2B45' : 'QRN-9Z88']);
  m.veiculo = v.rows[0].id;
  const p = await cli.query(
    `insert into pacientes (base_id,nome,cns,nascimento,municipio,ponto_embarque,tratamento,destino_id,recorrencia,acompanhante)
     values ($1,$2,$3,'1958-03-12',$4,'UBS Centro','radioterapia',$5,'{seg,qua,sex}',true) returning id`,
    [m.base, `Paciente de ${mun}`, m === A ? '700111' : '800222', mun, m.destinoLonge]);
  m.paciente = p.rows[0].id;
}

/* A paciente de Floriano cumpre a Portaria 11.165 em julho: reside em
   9900001, o serviço fica em 9900003 a 252 km de município a município
   (lido), habilitado, e a sessão de 06/07 está confirmada. Identificadores
   IBGE sintéticos (99xxxxx). */
await cli.query(`update pacientes set municipio_residencia_ibge = '9900001', uf_residencia = 'PI' where id = $1`, [A.paciente]);
await cli.query(`update destinos set municipio_ibge = '9900003', habilitacao_conferida = true where id = $1`, [A.destinoLonge]);
await cli.query(`insert into distancias_municipais (base_id,origem_ibge,destino_ibge,km,fonte,lido_em)
                 values ($1,'9900001','9900003',252,'SINT · matriz de teste','2026-10-16')`, [A.base]);
await cli.query(`insert into agendamentos (base_id,paciente_id,destino_id,data,confirmado,etapa)
                 values ($1,$2,$3,'2026-07-06',true,'planejamento')`, [A.base, A.paciente, A.destinoLonge]);

/* ─── a API recusa conexão de dono ─────────────────────────────────── */
console.log('\n── guarda de conexão ──');
process.env.DATABASE_URL = testeUrl.toString();   // usuário dono/superusuário
const {subir, fechar} = await import('../api/servidor.mjs');
let recusou = null;
try{ await subir(0) }catch(e){ recusou = e.message }
ok('não sobe com papel que passa por cima da RLS', !!recusou && /superusuário|BYPASSRLS/.test(recusou), recusou);
ok('e diz como criar o papel certo', !!recusou && recusou.includes('create role rota_api'));
await fechar();

/* ─── sobe com o papel da aplicação ────────────────────────────────── */
const papel = 'rota_api_' + Math.random().toString(36).slice(2, 8);
/* com senha: o container do CI autentica por scram, e papel sem senha
   não conecta por TCP — foi assim que este teste ficou vermelho na
   primeira vez que rodou fora daqui */
const segredoPapel = 'p' + Math.random().toString(36).slice(2, 12);
await adm.query(`create role ${papel} login password '${segredoPapel}' in role rota_app`);
const apiUrl = new URL(testeUrl); apiUrl.username = papel; apiUrl.password = segredoPapel;
process.env.DATABASE_URL = apiUrl.toString();

/* CPF em lugar nenhum: com uma coluna dessas no esquema, a API não sobe */
await cli.query('alter table pacientes add column sonda_cpf text');
let recusouCpf = null;
try{ await subir(0) }catch(e){ recusouCpf = e.message }
ok('não sobe com coluna de CPF no esquema', !!recusouCpf && /CPF/.test(recusouCpf) && recusouCpf.includes('pacientes.sonda_cpf'), recusouCpf);
await fechar();
await cli.query('alter table pacientes drop column sonda_cpf');

const srv = await subir(0);
const porta = srv.address().port;
const raizApi = `http://127.0.0.1:${porta}`;

const chamar = async (metodo, caminho, {token, corpo} = {}) => {
  const r = await fetch(raizApi + caminho, {
    method: metodo,
    headers: {...(token ? {Authorization: 'Bearer ' + token} : {}),
              ...(corpo ? {'Content-Type': 'application/json'} : {})},
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  let json = null; try{ json = await r.json() }catch{}
  return {status: r.status, corpo: json, headers: r.headers};
};

try{
  /* ─── portaria ───────────────────────────────────────────────────── */
  console.log('\n── portaria ──');
  eq('saúde responde sem sessão', (await chamar('GET','/api/saude')).status, 200);
  eq('carregar sem token é 401', (await chamar('GET','/api/carregar')).status, 401);
  eq('token inventado é 401', (await chamar('GET','/api/carregar',{token:'nao-existe'})).status, 401);
  eq('rota inexistente é 404', (await chamar('GET','/api/nada')).status, 404);

  const semSegundo = await chamar('POST','/api/sessao',{corpo:{email:A.email, senha:SENHA}});
  eq('login sem o segundo fator é recusado', semSegundo.status, 401);
  const senhaErrada = await chamar('POST','/api/sessao',
    {corpo:{email:A.email, senha:'errada!!', codigo: totp(A.segredo)}});
  eq('senha errada é recusada', senhaErrada.status, 401);
  const inexistente = await chamar('POST','/api/sessao',{corpo:{email:'ninguem@x.br', senha:SENHA}});
  eq('e-mail inexistente devolve a MESMA resposta que senha errada',
     [inexistente.status, inexistente.corpo], [senhaErrada.status, senhaErrada.corpo]);

  const entrada = await chamar('POST','/api/sessao',
    {corpo:{email:A.email, senha:SENHA, codigo: totp(A.segredo)}});
  eq('login completo entra', entrada.status, 200);
  const tokenA = entrada.corpo.token;
  ok('devolve token e base', !!tokenA && entrada.corpo.base === A.base);
  ok('não vaza hash de senha nem segredo do TOTP',
     !JSON.stringify(entrada.corpo).match(/scrypt|[A-Z2-7]{32}/));

  const reuso = await chamar('POST','/api/sessao',
    {corpo:{email:A.email, senha:SENHA, codigo: totp(A.segredo)}});
  eq('o mesmo código não entra duas vezes', reuso.status, 401);

  const entradaB = await chamar('POST','/api/sessao',{corpo:{email:B.email, senha:SENHA}});
  eq('gestor sem segundo fator configurado entra só com senha', entradaB.status, 200);
  const tokenB = entradaB.corpo.token;

  /* ─── carga ──────────────────────────────────────────────────────── */
  console.log('\n── carga do console ──');
  const carga = await chamar('GET','/api/carregar',{token:tokenA});
  eq('contrato da fonte é honrado',
     Object.keys(carga.corpo).sort(),
     ['abastecimentos','config','destinos','lancamentos','pacientes','veiculos']);
  eq('destinos vêm chaveados', Object.keys(carga.corpo.destinos).length, 2);
  eq('paciente vem no vocabulário do console',
     Object.keys(carga.corpo.pacientes[0]).sort().join(','),
     'acomp,aut,cns,dest,elegibilidade,id,mun,munIbge,nasc,necKey,nome,ponto,proxAgendamento,rec,tratKey,ufRes');
  eq('veículo idem', carga.corpo.veiculos[0].id, 'ROTA-02');
  eq('custo por km vem da base, não do código', carga.corpo.config.custoKmVariavel, 0.9);

  /* ─── isolamento ─────────────────────────────────────────────────── */
  console.log('\n── isolamento entre municípios ──');
  const cargaB = await chamar('GET','/api/carregar',{token:tokenB});
  eq('cada sessão carrega só a sua base', [carga.corpo.pacientes.length, cargaB.corpo.pacientes.length], [1,1]);
  ok('e não é o mesmo paciente', carga.corpo.pacientes[0].id !== cargaB.corpo.pacientes[0].id);
  eq('nem o mesmo veículo', cargaB.corpo.veiculos[0].id, 'CAICO-01');

  const invasao = await chamar('POST','/api/pacientes',
    {token: tokenA, corpo: {id: B.paciente, nome:'Sequestrado', cns:'800222',
      nasc:'1958-03-12', mun:'Floriano', ponto:'UBS', tratKey:'radioterapia', dest:A.destinoLonge}});
  eq('editar paciente de outra base dá 404, não 200', invasao.status, 404);
  const aindaLa = await cli.query('select nome from pacientes where id = $1', [B.paciente]);
  eq('e o paciente do outro município continua intacto', aindaLa.rows[0].nome, 'Paciente de Caico');

  const veiculoAlheio = await chamar('POST','/api/abastecimentos',
    {token: tokenA, corpo: {vid:'CAICO-01', data:'2026-07-06', litros: 78, km: 520, valor: 452.4}});
  eq('abastecer veículo de outra base dá 404', veiculoAlheio.status, 404);

  /* ─── escrita ────────────────────────────────────────────────────── */
  console.log('\n── escrita ──');
  const novo = await chamar('POST','/api/pacientes',
    {token: tokenA, corpo: {nome:'Antônia Pereira da Costa', cns:'700 8041 2233 4501',
      nasc:'1958-03-12', mun:'Floriano', ponto:'UBS Centro', tratKey:'hemodialise',
      dest: A.destinoPerto, rec:['seg','qua','sex'], acomp:false, necKey:'cadeirante',
      aut:{proc:'TFD-2026/0140', val:'2026-12-31'}}});
  eq('paciente criado', novo.status, 200);
  eq('com a autorização junto', novo.corpo.aut.proc, 'TFD-2026/0140');
  eq('e o rótulo de necessidade preservado', novo.corpo.necKey, 'cadeirante');

  const ab = await chamar('POST','/api/abastecimentos',
    {token: tokenA, corpo: {vid:'ROTA-02', data:'2026-07-06', litros:78, km:520, valor:452.4}});
  eq('abastecimento gravado', [ab.status, ab.corpo.vid], [200, 'ROTA-02']);

  const prog = await chamar('PUT','/api/programacao', {token: tokenA, corpo: {
    de: '2026-07-06', ate: '2026-07-10',
    viagens: [{chave:'2026-07-06:teresina:ROTA-02', data:'2026-07-06', hora:'05:00',
      destino: A.destinoLonge, veiculo:'ROTA-02', km: 504,
      pacientes: [{id: A.paciente, acomp: true}]}]}});
  eq('programação gravada', prog.status, 200);
  const viagemId = prog.corpo.viagens[0].id;

  const baixa = await chamar('POST', `/api/viagens/${viagemId}/baixa`, {token: tokenA, corpo: {
    km: 504, litros: 78, diarias: 1, data: '2026-07-06',
    embarques: [{paciente: A.paciente, ida: true, volta: true}]}});
  eq('baixa registrada', baixa.status, 200);
  eq('e devolve a ocupação realizada',
     [baixa.corpo.ocupacao.assentos_programados, baixa.corpo.ocupacao.assentos_realizados], [2, 2]);

  const rel = await chamar('GET','/api/relatorio/2026-07',{token:tokenA});
  eq('relatório conta por paciente-deslocamento',
     [rel.corpo.elegiveis, rel.corpo.comprovados, rel.corpo.viagens], [1,1,1]);

  const doc1 = await chamar('POST','/api/documentos',{token:tokenA, corpo:{tipo:'manifesto', viagem: viagemId}});
  const doc2 = await chamar('POST','/api/documentos',{token:tokenA, corpo:{tipo:'manifesto'}});
  eq('numeração sequencial por base', [doc1.corpo.numero, doc2.corpo.numero], [1,2]);
  const docB = await chamar('POST','/api/documentos',{token:tokenB, corpo:{tipo:'manifesto'}});
  eq('e a do outro município começa do 1', docB.corpo.numero, 1);
  eq('tipo inválido é 422', (await chamar('POST','/api/documentos',{token:tokenA,corpo:{tipo:'x'}})).status, 422);

  /* ─── auditoria ──────────────────────────────────────────────────── */
  console.log('\n── auditoria ──');
  const {rows: aud} = await cli.query(
    `select acao, entidade, payload from auditoria where base_id = $1 order by id`, [A.base]);
  eq('toda escrita deixou rastro',
     aud.map(r => r.acao), ['cadastro','abastecimento','programacao','baixa','emissao','emissao']);
  const cadastro = aud[0].payload;
  ok('a trilha registra os campos tocados', cadastro.campos.includes('nome'));
  ok('mas não copia nome nem CNS para uma tabela que não aceita correção',
     !JSON.stringify(cadastro.valores).includes('Antônia') &&
     !JSON.stringify(cadastro.valores).includes('700 8041'));
  const {rows: cadeia} = await cli.query('select * from verificar_cadeia_auditoria($1)', [A.base]);
  eq('e a cadeia está íntegra', cadeia[0].primeiro_id_adulterado, null);

  /* ═══ Portaria GM/MS 11.165/2026 ════════════════════════════════════
     Desenho: docs/PORTARIA-11165-INTEGRACAO.md. Identificadores sintéticos
     (IBGE 99xxxxx, CNES 000000x); nenhum CPF — só a recusa dele.        */
  const H = '?hoje=2026-10-16';
  const contar = async (sql, args) => Number((await cli.query(sql, args)).rows[0].n);

  console.log('\n── Portaria 11.165 · CPF em lugar nenhum ──');
  {
    const pacientesAntes = await contar('select count(*) n from pacientes where base_id = $1', [A.base]);
    const audAntes = await contar('select count(*) n from auditoria where base_id = $1', [A.base]);
    const comCpf = await chamar('POST','/api/pacientes', {token: tokenA, corpo: {nome:'PAC-SINT-CPF', cns:'700000000009999',
      nasc:'1960-01-01', mun:'Floriano', ponto:'UBS', tratKey:'radioterapia', dest:A.destinoLonge, cpf:'nao-e-cpf'}});
    eq('paciente com chave cpf é recusado com 400', comCpf.status, 400);
    ok('e a mensagem diz por quê', /CPF/.test(comCpf.corpo?.erro || ''), comCpf.corpo);
    eq('em qualquer caixa e profundidade',
       (await chamar('POST','/api/remessas-bpa',{token:tokenA, corpo:{competencia:'2026-06', faturamento:{Cpf_Responsavel:'x'}}})).status, 400);
    eq('também na consulta', (await chamar('GET','/api/carregar?cpf=1',{token:tokenA})).status, 400);
    eq('e antes do login', (await chamar('POST','/api/sessao',{corpo:{email:A.email, senha:SENHA, CPF:'x'}})).status, 400);
    eq('nada foi gravado', await contar('select count(*) n from pacientes where base_id = $1', [A.base]), pacientesAntes);
    eq('nem auditado', await contar('select count(*) n from auditoria where base_id = $1', [A.base]), audAntes);
  }

  console.log('\n── Portaria 11.165 · dados da norma ──');
  const pact = await chamar('PUT','/api/base/pactuacao', {token: tokenA, corpo: {deliberacaoCib:'CIB-SINT-001',
    deliberacaoCibData:'2026-05-30', estruturaGestao:true, municipiosAbrangidos:['9900001'], inicioIncentivo:'2026-06'}});
  eq('pactuação da base gravada', [pact.status, pact.corpo.inicioIncentivo, pact.corpo.municipiosAbrangidos],
     [200, '2026-06', ['9900001']]);
  eq('IBGE fora do formato é 422', (await chamar('PUT','/api/base/pactuacao',
     {token: tokenA, corpo: {municipiosAbrangidos:['123']}})).status, 422);
  eq('competência de início fora do formato é 422', (await chamar('PUT','/api/base/pactuacao',
     {token: tokenA, corpo: {inicioIncentivo:'2026-6'}})).status, 422);

  const serv = await chamar('PUT', `/api/destinos/${A.destinoPerto}/servico`, {token: tokenA, corpo: {ibge:'9900002',
    uf:'PI', cnes:'0000002', habilitacaoConferida:true, habilitacaoCodigo:'15.04', modalidades:['hemodialise']}});
  eq('serviço de referência gravado', [serv.status, serv.corpo.ibge, serv.corpo.habilitacaoConferida, serv.corpo.modalidades],
     [200, '9900002', true, ['hemodialise']]);
  eq('modalidade fora do domínio é 422', (await chamar('PUT', `/api/destinos/${A.destinoPerto}/servico`,
     {token: tokenA, corpo: {modalidades:['magia']}})).status, 422);

  const dist = await chamar('PUT','/api/distancias', {token: tokenA, corpo: {origem:'9900001', destino:'9900002',
    km: 80, fonte:'SINT · matriz de teste', lidoEm:'2026-10-16'}});
  eq('distância de município a município gravada', [dist.status, dist.corpo.km], [200, 80]);
  const aLevantar = await chamar('PUT','/api/distancias', {token: tokenA, corpo: {origem:'9900009', destino:'9900003', km: null}});
  eq('distância a levantar entra nula, nunca 0', [aLevantar.status, aLevantar.corpo.km], [200, null]);
  eq('km sem fonte é 422 (sem procedência não há número)', (await chamar('PUT','/api/distancias',
     {token: tokenA, corpo: {origem:'9900001', destino:'9900004', km: 100}})).status, 422);
  eq('e a lista devolve as três da base', (await chamar('GET','/api/distancias',{token:tokenA})).corpo.length, 3);

  const vei = await chamar('PUT','/api/veiculos/ROTA-02/portaria', {token: tokenA, corpo: {doadoMs:true,
    termoDoacao:'TD-SINT-01', finalidadeDoacao:'radioterapia', dataRecebimento:'2026-05-20', cnesEstabelecimento:'0000001',
    cnesInscritoEm:'2026-06-10', emplacadoEm:'2026-05-15', disponibilidade12m:0.95, laudo:false}});
  eq('dados da doação do veículo gravados', [vei.status, vei.corpo.id, vei.corpo.finalidadeDoacao, vei.corpo.cnesEstabelecimento],
     [200, 'ROTA-02', 'radioterapia', '0000001']);
  eq('data inexistente é 422', (await chamar('PUT','/api/veiculos/ROTA-02/portaria',
     {token: tokenA, corpo: {dataRecebimento:'2026-02-30'}})).status, 422);
  eq('veículo de outra base é 404', (await chamar('PUT','/api/veiculos/CAICO-01/portaria',
     {token: tokenA, corpo: {laudo:true}})).status, 404);

  const P = async (nome, tratKey, dest, munIbge) => (await chamar('POST','/api/pacientes', {token: tokenA, corpo: {
    nome, cns: '700 0000 0000 ' + nome.slice(-4), nasc:'1958-03-12', mun:'Floriano', ponto:'UBS Centro', tratKey, dest,
    munIbge, ufRes:'PI', rec:['seg'], acomp:false}})).corpo;
  const P1 = await P('PAC-SINT-1001', 'hemodialise', A.destinoPerto, '9900001');
  const P2 = await P('PAC-SINT-1002', 'radioterapia', A.destinoLonge, '9900001');
  const P3 = await P('PAC-SINT-1003', 'radioterapia', A.destinoLonge, '9900001');
  const P4 = await P('PAC-SINT-1004', 'radioterapia', A.destinoLonge, '9900009');
  eq('paciente leva o município de residência', [P1.munIbge, P1.ufRes], ['9900001', 'PI']);
  eq('sem agendamento à frente, fica pendente pelo agendamento (RE-07)',
     [P1.elegibilidade.status, P1.elegibilidade.pendencias], ['pendente', ['RE-07']]);
  eq('sem distância levantada, pendente também pela distância — nunca 0 km',
     [P4.elegibilidade.status, P4.elegibilidade.pendencias], ['pendente', ['RE-03', 'RE-07']]);
  eq('IBGE de residência fora do formato é 422', (await chamar('POST','/api/pacientes', {token: tokenA, corpo: {
    nome:'X', cns:'1', nasc:'1960-01-01', mun:'X', ponto:'X', tratKey:'consulta', dest:A.destinoPerto, munIbge:'99'}})).status, 422);

  const AG = (paciente, dest, data, confirmado, etapa) => chamar('POST','/api/agendamentos',
    {token: tokenA, corpo: {paciente, destino: dest, data, confirmado, etapa}});
  for(const d of ['2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-10'])
    await AG(P1.id, A.destinoPerto, d, true);
  await AG(P2.id, A.destinoLonge, '2026-08-03', true, 'planejamento');
  await AG(P2.id, A.destinoLonge, '2026-08-04', true, 'tratamento');
  const ag = await AG(P2.id, A.destinoLonge, '2026-08-05', true, 'tratamento');
  await AG(P4.id, A.destinoLonge, '2026-08-03', true, 'planejamento');
  eq('agendamento confirmado gravado', [ag.status, ag.corpo.confirmado, ag.corpo.etapa], [200, true, 'tratamento']);
  eq('etapa fora do domínio é 422', (await AG(P2.id, A.destinoLonge, '2026-08-07', true, 'consulta')).status, 422);
  eq('confirmação que não é booleana nem nula é 422', (await AG(P2.id, A.destinoLonge, '2026-08-07', 'sim')).status, 422);
  eq('agendamentos do período', (await chamar('GET','/api/agendamentos?de=2026-08-01&ate=2026-08-31',{token:tokenA})).corpo.length, 9);

  const carga11165 = (await chamar('GET','/api/carregar?hoje=2026-08-01',{token:tokenA})).corpo;
  const p1c = carga11165.pacientes.find(p => p.id === P1.id);
  eq('com a sessão confirmada à frente, a carga devolve o paciente elegível, com código e faixa',
     [p1c.elegibilidade.status, p1c.elegibilidade.procedimento, p1c.elegibilidade.faixa, p1c.proxAgendamento.data],
     ['elegivel', '08.03.01.016-8', 2, '2026-08-03']);
  eq('o destino leva o serviço', [carga11165.destinos[A.destinoPerto].ibge, carga11165.destinos[A.destinoPerto].cnes],
     ['9900002', '0000002']);
  const rota02 = carga11165.veiculos.find(v => v.id === 'ROTA-02');
  eq('o veículo leva a doação e o painel da portaria',
     [rota02.doadoMs, rota02.dataRecebimento, rota02.portaria.incentivo.estado, rota02.portaria.cnes.estado],
     [true, '2026-05-20', 'elegivel', 'cumprido']);
  eq('a configuração leva a pactuação e a base apta',
     [carga11165.config.pactuacao.deliberacaoCib, carga11165.config.baseApta.estado, carga11165.config.hoje],
     ['CIB-SINT-001', 'apta', '2026-08-01']);
  eq('hoje inválido é 422', (await chamar('GET','/api/carregar?hoje=16/10/2026',{token:tokenA})).status, 422);

  console.log('\n── Portaria 11.165 · pré-remessa BPA-I ──');
  const viagem = (chave, data, destino, pacientes) => ({chave, data, hora:'05:00', destino, veiculo:'ROTA-02', km: 160,
    pacientes: pacientes.map(p => ({id: p.id, acomp: false}))});
  const prog8 = await chamar('PUT','/api/programacao', {token: tokenA, corpo: {de:'2026-08-03', ate:'2026-08-10', viagens: [
    viagem('hd-03','2026-08-03',A.destinoPerto,[P1]), viagem('hd-04','2026-08-04',A.destinoPerto,[P1]),
    viagem('hd-05','2026-08-05',A.destinoPerto,[P1]), viagem('hd-06','2026-08-06',A.destinoPerto,[P1]),
    viagem('hd-10','2026-08-10',A.destinoPerto,[P1]),
    viagem('rt-03','2026-08-03',A.destinoLonge,[P2,P3,P4]), viagem('rt-04','2026-08-04',A.destinoLonge,[P2]),
    viagem('rt-05','2026-08-05',A.destinoLonge,[P2])]}});
  eq('programação de agosto gravada', [prog8.status, prog8.corpo.viagens.length], [200, 8]);
  for(const v of prog8.corpo.viagens){
    const pax = v.chave === 'rt-03' ? [P2, P3, P4] : v.chave.startsWith('rt') ? [P2] : [P1];
    await chamar('POST', `/api/viagens/${v.id}/baixa`, {token: tokenA, corpo: {km: 160, data: v.chave === 'hd-10' ? '2026-08-10' : undefined,
      embarques: pax.map(p => ({paciente: p.id, ida: true, volta: v.chave !== 'hd-10'}))}});
  }

  const conf = await chamar('GET','/api/bpa-i/2026-08',{token:tokenA});
  eq('a conferência conta o que entra', [conf.status, conf.corpo.linhas, conf.corpo.total_deslocamentos], [200, 5, 10]);
  /* a ordem dos pacientes segue o uuid sorteado: compara-se sem ordem */
  const ordenado = o => Object.fromEntries(Object.entries(o).sort());
  eq('e o que ficou de fora, por motivo', [conf.corpo.fora.total, ordenado(conf.corpo.fora.motivos)], [5, ordenado({
    'RE-09:excedente_semanal': 1, 'nao_comprovado': 1, 'RE-11:excedente': 1, 'pendente:RE-07': 1, 'pendente:RE-03': 1})]);
  eq('avisa que o faturamento preenche o CPF no lugar do CNS', conf.corpo.avisos['RE-14:cpf_a_preencher_pelo_faturamento'], 5);
  ok('declara que não é o leiaute oficial', /lacuna L1/.test(conf.corpo.leiaute));
  ok('a conferência não carrega dado pessoal', !/700000000|PAC-SINT/.test(JSON.stringify(conf.corpo)));

  const rCsv = await fetch(raizApi + '/api/bpa-i/2026-08.csv', {headers: {Authorization: 'Bearer ' + tokenA}});
  const csv = await rCsv.text();
  const linhasCsv = csv.split('\r\n').filter(Boolean);
  eq('o CSV sai como CSV', rCsv.headers.get('content-type'), 'text/csv; charset=utf-8');
  eq('nomeado por base e competência', rCsv.headers.get('content-disposition'),
     'attachment; filename="pre-bpa-i_floriano-pi_2026-08.csv"');
  eq('com as contagens no cabeçalho HTTP', [rCsv.headers.get('x-rota-linhas'), rCsv.headers.get('x-rota-fora')], ['5', '5']);
  eq('cabeçalho + 5 linhas', linhasCsv.length, 6);
  ok('a coluna do CPF vem rotulada e vazia em todas as linhas',
     linhasCsv[0].split(';')[4] === 'CPF a preencher pelo faturamento do ente, que substitui o CNS na linha final (um documento por paciente, layout BPA v05.00)' &&
     linhasCsv.slice(1).every(l => l.split(';')[4] === ''));
  eq('a linha da hemodiálise de 03/08: CNES do veículo, CNS só dígitos, residência',
     (linhasCsv.find(l => l.includes(';2026-08-03;') && l.includes(';hemodialise;')) || '').split(';').slice(0, 9),
     ['2026-08', '0000001', '08.03.01.016-8', '700000000001001', '', '9900001', '2026-08-03', '1', 'hemodialise']);
  ok('sem nome de paciente no arquivo', !/PAC-SINT/.test(csv));
  eq('a outra base não vê nada de Floriano', (await chamar('GET','/api/bpa-i/2026-08',{token:tokenB})).corpo.linhas, 0);
  eq('competência inválida é 422', (await chamar('GET','/api/bpa-i/2026-13',{token:tokenA})).status, 422);
  const {rows: exp} = await cli.query(`select payload from auditoria where base_id = $1 and acao = 'exportacao_bpa_i'`, [A.base]);
  eq('a geração do arquivo entra na trilha, com as contagens', [exp.length, exp[0]?.payload.linhas, exp[0]?.payload.fora], [1, 5, 5]);
  ok('e sem CNS na trilha', !/700000000/.test(JSON.stringify(exp)));

  console.log('\n── Portaria 11.165 · remessas e farol por competência ──');
  const REM = (competencia, linhas, enviadaEm) => chamar('POST','/api/remessas-bpa',
    {token: tokenA, corpo: {competencia, linhas, enviadaEm, informadoPor: 'faturamento da SMS (sintético)'}});
  eq('remessa informada', (await REM('2026-06', 41, '2026-07-08')).status, 200);
  await REM('2026-07', 44, '2026-08-08');
  await REM('2026-08', 0, null);
  let farol = (await chamar('GET','/api/farol-producao' + H, {token: tokenA})).corpo;
  eq('setembro não informado: a conferir, nunca zero',
     [farol.farol.estado, farol.competencias.map(c => c.linhas_enviadas)], ['a_conferir', [41, 44, 0, null]]);
  await REM('2026-09', 0, null);
  farol = (await chamar('GET','/api/farol-producao' + H, {token: tokenA})).corpo;
  eq('dois meses sem registro: risco, o próximo suspende',
     [farol.farol.estado, farol.farol.meses_sem_registro, farol.farol.alerta, farol.aplicavel], ['risco', 2, true, true]);
  eq('dias sem baixa ficam só como informação operacional',
     [farol.operacional.ultima_baixa, farol.operacional.dias_sem_baixa], ['2026-08-10', 67]);
  const correcao = await REM('2026-08', 5, '2026-09-08');
  eq('a correção da remessa substitui a anterior', correcao.corpo.linhas, 5);
  farol = (await chamar('GET','/api/farol-producao' + H, {token: tokenA})).corpo;
  eq('e o farol volta para atenção', [farol.farol.estado, farol.farol.meses_sem_registro], ['atencao', 1]);
  eq('linhas enviadas sem data de envio é 422', (await REM('2026-10', 3, null)).status, 422);
  eq('competência fora do formato é 422', (await REM('2026/09', 0, null)).status, 422);
  eq('sem quem informou é 422', (await chamar('POST','/api/remessas-bpa',
     {token: tokenA, corpo: {competencia:'2026-10', linhas: 0}})).status, 422);
  eq('a lista das remessas', (await chamar('GET','/api/remessas-bpa',{token:tokenA})).corpo.map(r => r.competencia),
     ['2026-06', '2026-07', '2026-08', '2026-09']);
  const farolB = (await chamar('GET','/api/farol-producao' + H, {token: tokenB})).corpo;
  eq('Caicó sem pactuação: não aplicável e sem contagem inventada',
     [farolB.aplicavel, farolB.farol.estado, farolB.farol.motivo], [false, 'a_conferir', 'inicio_incentivo_a_levantar']);
  eq('nem vê as remessas de Floriano', (await chamar('GET','/api/remessas-bpa',{token:tokenB})).corpo.length, 0);

  console.log('\n── Portaria 11.165 · painel de conformidade ──');
  const cf = (await chamar('GET','/api/conformidade' + H, {token: tokenA})).corpo;
  eq('base apta ao incentivo', cf.base_apta, {estado: 'apta', faltam: []});
  const c02 = cf.veiculos.find(v => v.id === 'ROTA-02');
  eq('prazos do veículo calculados do recebimento',
     [c02.cnes.estado, c02.cnes.limite, c02.operacao.estado, c02.operacao.limite, c02.renovacao.estado],
     ['cumprido', '2026-07-19', 'cumprido', '2026-07-19', 'nao']);
  const cfB = (await chamar('GET','/api/conformidade' + H, {token: tokenB})).corpo;
  eq('Caicó, com veículo sem origem conferida: pendente, e diz o que falta', cfB.base_apta,
     {estado: 'pendente', faltam: ['veiculo_elegivel']});

  console.log('\n── Portaria 11.165 · isolamento das rotas novas ──');
  eq('serviço de outra base é 404', (await chamar('PUT', `/api/destinos/${A.destinoPerto}/servico`,
     {token: tokenB, corpo: {habilitacaoConferida:false}})).status, 404);
  eq('agendar paciente de outra base é 404', (await chamar('POST','/api/agendamentos',
     {token: tokenB, corpo: {paciente: P1.id, destino: A.destinoPerto, data: '2026-08-11', confirmado: true}})).status, 404);
  eq('distâncias de Floriano não aparecem para Caicó', (await chamar('GET','/api/distancias',{token:tokenB})).corpo.length, 0);
  const servA = await cli.query('select habilitacao_conferida from destinos where id = $1', [A.destinoPerto]);
  eq('e o serviço de Floriano continua como estava', servA.rows[0].habilitacao_conferida, true);

  console.log('\n── Portaria 11.165 · trilha ──');
  const {rows: trilha} = await cli.query(`select acao, payload from auditoria where base_id = $1 order by id`, [A.base]);
  const acoes = new Set(trilha.map(r => r.acao));
  ok('toda escrita nova deixou rastro',
     ['pactuacao','servico','distancia','veiculo_portaria','agendamento','remessa_bpa','exportacao_bpa_i'].every(a => acoes.has(a)),
     [...acoes]);
  ok('a trilha não copia quem informou a remessa', !JSON.stringify(trilha).includes('faturamento da SMS'));
  const {rows: cadeia11165} = await cli.query('select * from verificar_cadeia_auditoria($1)', [A.base]);
  eq('e a cadeia continua íntegra', cadeia11165[0].primeiro_id_adulterado, null);

  /* ─── escrita falha não deixa meia-escrita ───────────────────────── */
  console.log('\n── transação ──');
  const antes = (await cli.query('select count(*) n from pacientes where base_id = $1', [A.base])).rows[0].n;
  const quebrado = await chamar('POST','/api/pacientes',
    {token: tokenA, corpo: {nome:'Sem destino válido', cns:'999', nasc:'1958-03-12',
      mun:'Floriano', ponto:'UBS', tratKey:'radioterapia', dest:'00000000-0000-0000-0000-000000000000'}});
  ok('destino inexistente falha', quebrado.status >= 400);
  const depois = (await cli.query('select count(*) n from pacientes where base_id = $1', [A.base])).rows[0].n;
  eq('e não sobra paciente pela metade', depois, antes);
  ok('a mensagem de erro não conta a estrutura do banco',
     !/violates|constraint|relation|policy|select|insert/i.test(JSON.stringify(quebrado.corpo)),
     quebrado.corpo);

  /* ─── cabeçalhos e saída ─────────────────────────────────────────── */
  console.log('\n── cabeçalhos e saída ──');
  const h = (await chamar('GET','/api/saude')).headers;
  eq('nada de cache', h.get('cache-control'), 'no-store');
  eq('nosniff', h.get('x-content-type-options'), 'nosniff');
  ok('sem CORS aberto', !h.get('access-control-allow-origin'));

  eq('saída revoga', (await chamar('DELETE','/api/sessao',{token:tokenA})).status, 200);
  eq('e o token não vale mais', (await chamar('GET','/api/carregar',{token:tokenA})).status, 401);

}finally{
  srv.close(); await fechar(); await cli.end();
  await adm.query(`drop database ${nome} with (force)`);
  await adm.query(`drop role if exists ${papel}`).catch(() => {});
  await adm.end();
}

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
