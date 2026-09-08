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
                'supabase/migrations/0002_autenticacao.sql','supabase/migrations/0003_forcar_rls.sql'])
  await cli.query(fs.readFileSync(path.join(raiz, f), 'utf8'));
console.log('\n── schema e migrações aplicam em base limpa ──');
ok('quatro arquivos aplicados sem erro', true);
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
     'acomp,aut,cns,dest,id,mun,nasc,necKey,nome,ponto,rec,tratKey');
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
