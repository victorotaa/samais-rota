/* ═══════════════════════════════════════════════════════════════════
   FonteAPI — a segunda implementação do contrato de dados.

   Contrato com uma implementação só não é contrato: é o formato
   acidental de quem escreveu primeiro. Este teste exercita a FonteAPI
   com um `fetch` de mentira e cobra dela exatamente o que a FonteSeed
   entrega — mesmas chaves, mesmos rótulos derivados, mesma semântica —
   além do que só ela tem: token, tradução de presença em embarque, e
   erro que não vira sucesso silencioso.

   Rodar: node testes/fonte-api.test.mjs
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as regras11165 from '../regras/portaria-11165.mjs';
import * as costura11165 from '../regras/integracao-11165.mjs';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(raiz, '..', 'rota-app.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
/* a norma entra pelo contexto, como o import() entrega no navegador */
const ctx = vm.createContext({console, performance, Date, Math, JSON, Promise,
  NORMA_11165: {regras: regras11165, costura: costura11165}});
vm.runInContext(script, ctx, {filename: 'rota-app.html'});
const {FonteAPI, FonteSeed, Dados, SEED} = ctx.ROTA;

let passou = 0, falhou = 0;
const ok = (nome, cond, d) => cond
  ? (passou++, console.log('  ok   ·', nome))
  : (falhou++, console.log('  FALHA·', nome, d !== undefined ? '→ ' + JSON.stringify(d) : ''));
const eq = (nome, a, b) => ok(nome, JSON.stringify(a) === JSON.stringify(b), {obtido: a, esperado: b});

/* fetch de mentira: guarda o que foi pedido e devolve o que for combinado */
function stub(respostas){
  const chamadas = [];
  const buscar = (url, op) => {
    chamadas.push({url, metodo: op.method, cab: op.headers,
                   corpo: op.body ? JSON.parse(op.body) : undefined});
    const r = respostas.shift() || {status: 200, json: {}};
    const cab = r.cabecalhos || {};
    return Promise.resolve({
      ok: r.status < 400, status: r.status,
      headers: {get: n => cab[Object.keys(cab).find(k => k.toLowerCase() === n.toLowerCase())] ?? null},
      json: () => Promise.resolve(r.json),
      text: () => Promise.resolve(r.texto ?? JSON.stringify(r.json))
    });
  };
  return {buscar, chamadas};
}

const CARGA = {
  destinos: {'d1': {nome: 'Teresina — oncologia', km: 252, tipo: 'Intermunicipal >50km'}},
  pacientes: [{id: 'p1', nome: 'Maria', cns: '700', nasc: '1971-07-27', mun: 'Floriano',
               ponto: 'UBS', tratKey: 'radioterapia', dest: 'd1', rec: ['seg'], acomp: true,
               necKey: 'nenhuma', aut: {proc: 'TFD-2026/0142', val: '2026-12-31'}}],
  veiculos: [{id: 'ROTA-02', placa: 'QLF-2B45', classe: 'micro', tipo: 'Micro-ônibus',
              lot: 24, hod: 61900, revCada: 10000, proxRev: 70000, mot: 'Antônio'}],
  abastecimentos: [{vid: 'ROTA-02', data: '2026-07-06', litros: 78, km: 520, valor: 452.4}],
  lancamentos: {}, config: {custoKmVariavel: 0.9, custoKmFonte: 'contrato'}
};

/* ─────────────────────────────────────────────────────── requisição */
console.log('\n── requisição ──');
{
  const {buscar, chamadas} = stub([{status: 200, json: CARGA}]);
  const f = new FonteAPI({buscar, token: 'tok-123'});
  await f.carregar();
  eq('vai ao caminho certo', [chamadas[0].metodo, chamadas[0].url], ['GET', '/api/carregar']);
  eq('leva o token no Bearer', chamadas[0].cab.Authorization, 'Bearer tok-123');
  ok('e não manda Content-Type sem corpo', !chamadas[0].cab['Content-Type']);
}
{
  const {buscar, chamadas} = stub([{status: 200, json: {}}]);
  await new FonteAPI({buscar}).salvarPaciente({nome: 'X'});
  ok('sem sessão, não inventa Authorization', !chamadas[0].cab.Authorization);
  eq('e declara JSON quando tem corpo', chamadas[0].cab['Content-Type'], 'application/json');
}

/* ────────────────────────────────────────────── mesmo contrato da seed */
console.log('\n── mesmo contrato da FonteSeed ──');
{
  const {buscar} = stub([{status: 200, json: JSON.parse(JSON.stringify(CARGA))}]);
  const daApi = await new FonteAPI({buscar}).carregar();
  const daSeed = new FonteSeed(SEED).carregar();
  /* o rótulo de 'nenhuma' é o que a tela escolheu; o teste cobra o mesmo
     dos dois lados em vez de fixar a string aqui */
  const necLabelEsperado = daSeed.pacientes.find(p => p.necKey === 'nenhuma').nec;
  eq('as duas devolvem as mesmas chaves',
     Object.keys(daApi).sort(), Object.keys(daSeed).sort());
  eq('a API também deriva os rótulos', daApi.pacientes[0].trat, 'Radioterapia');
  eq('inclusive o de necessidade', daApi.pacientes[0].nec, necLabelEsperado);
  ok('lancamentos nunca vem indefinido', daApi.lancamentos && typeof daApi.lancamentos === 'object');
}

/* ──────────────────────── contrato da Portaria 11.165 (etapa 1) ──
   Desde a migração 0004 a carga da API leva, DENTRO das mesmas seis
   chaves, o que a norma pede (docs/PORTARIA-11165-INTEGRACAO.md §5):
   elegibilidade do paciente vinda do módulo, serviço no destino, doação
   e prazos no veículo, pactuação e base apta na configuração. A FonteAPI
   não pode perder nada disso no caminho, e as chaves de cima continuam
   as da FonteSeed. Ligar na tela é a etapa 2 (desenho §8).           */
console.log('\n── contrato da Portaria 11.165 ──');
{
  const ELEG = {status: 'pendente', regras_violadas: [], pendencias: ['RE-07'], procedimento: null, faixa: null};
  const PORTARIA = {incentivo: {estado: 'elegivel', motivo: null},
    cnes: {limite: '2026-07-19', dias_restantes: null, estado: 'cumprido'},
    operacao: {limite: '2026-07-19', dias_restantes: null, estado: 'cumprido'},
    renovacao: {estado: 'nao', criterios: []}};
  const carga = JSON.parse(JSON.stringify(CARGA));
  Object.assign(carga.pacientes[0], {munIbge: '9900001', ufRes: 'ZA', elegibilidade: ELEG, proxAgendamento: null});
  Object.assign(carga.destinos.d1, {ibge: '9900003', uf: 'ZA', cnes: '0000002', habilitacaoConferida: true,
    habilitacaoCodigo: null, modalidades: ['radioterapia']});
  Object.assign(carga.veiculos[0], {doadoMs: true, finalidadeDoacao: 'radioterapia', dataRecebimento: '2026-05-20',
    cnesEstabelecimento: '0000001', portaria: PORTARIA});
  Object.assign(carga.config, {pactuacao: {deliberacaoCib: 'CIB-SINT-001', estruturaGestao: true,
    municipiosAbrangidos: ['9900001'], inicioIncentivo: '2026-06', deliberacaoCibData: null},
    baseApta: {estado: 'apta', faltam: []}, hoje: '2026-10-16'});

  const {buscar} = stub([{status: 200, json: carga}]);
  const d = await new FonteAPI({buscar, token: 't'}).carregar();
  eq('as chaves de cima continuam as da FonteSeed',
     Object.keys(d).sort(), Object.keys(new FonteSeed(SEED).carregar()).sort());
  eq('a elegibilidade do módulo chega intacta', d.pacientes[0].elegibilidade, ELEG);
  eq('e a residência do paciente', [d.pacientes[0].munIbge, d.pacientes[0].ufRes], ['9900001', 'ZA']);
  eq('o destino leva o serviço', [d.destinos.d1.ibge, d.destinos.d1.habilitacaoConferida], ['9900003', true]);
  eq('o veículo leva a doação e o painel da portaria', d.veiculos[0].portaria, PORTARIA);
  eq('a configuração leva pactuação e base apta', [d.config.pactuacao.inicioIncentivo, d.config.baseApta.estado],
     ['2026-06', 'apta']);
  ok('nenhuma chave de CPF no contrato', !/cpf/i.test(JSON.stringify(Object.keys(d.pacientes[0]))));
}

/* ─────────────────────────────────────── presença vira embarque */
console.log('\n── baixa ──');
{
  const {buscar, chamadas} = stub([{status: 200,
    json: {concluida: true, km: 504, litros: 78, diarias: 1, data: '2026-07-06',
           ocupacao: {lotacao: 24, assentos_programados: 3, assentos_realizados: 2}}}]);
  const gravado = await new FonteAPI({buscar, token: 't'}).salvarBaixa('v-1',
    {km: 504, litros: 78, diarias: 1, data: '2026-07-06', presentes: [1, 2], faltas: [3]});
  eq('vai por POST na viagem', [chamadas[0].metodo, chamadas[0].url],
     ['POST', '/api/viagens/v-1/baixa']);
  eq('presente vira embarque com ida e volta',
     chamadas[0].corpo.embarques,
     [{paciente: 1, ida: true, volta: true}, {paciente: 2, ida: true, volta: true},
      {paciente: 3, ida: false, volta: false}]);
  eq('e a tela recebe de volta o que ela entende',
     [gravado.concluida, gravado.km, gravado.presentes, gravado.faltas],
     [true, 504, [1, 2], [3]]);
  eq('com a ocupação realizada que o banco calculou', gravado.ocupacao.assentos_realizados, 2);
}

/* ───────────────────────────────────────────────── programação */
console.log('\n── programação ──');
{
  const {buscar, chamadas} = stub([{status: 200, json: {viagens: []}}]);
  await new FonteAPI({buscar, token: 't'}).salvarProgramacao([
    {chave: 'a', data: '2026-07-06'}, {chave: 'b', data: '2026-07-10'}]);
  eq('o período sai da primeira e da última',
     [chamadas[0].corpo.de, chamadas[0].corpo.ate], ['2026-07-06', '2026-07-10']);
  const vazio = stub([]);
  await new FonteAPI({buscar: vazio.buscar}).salvarProgramacao([]);
  eq('programação vazia não vira requisição', vazio.chamadas.length, 0);
}

/* ────────────────────────────────────────────────────────── erro */
console.log('\n── erro ──');
{
  const {buscar} = stub([{status: 401, json: {erro: 'sessão inválida ou expirada'}}]);
  let e = null;
  try{ await new FonteAPI({buscar, token: 'velho'}).carregar() }catch(x){ e = x }
  eq('401 vira erro com status', [!!e, e && e.status], [true, 401]);
}
{
  const {buscar} = stub([{status: 422, json: {erro: 'nome, cns, dest e tratKey são obrigatórios'}}]);
  let e = null;
  try{ await new FonteAPI({buscar, token: 't'}).salvarPaciente({}) }catch(x){ e = x }
  eq('e a mensagem do servidor chega à tela', e && e.message,
     'nome, cns, dest e tratKey são obrigatórios');
}
{
  const {buscar} = stub([{status: 500, json: null}]);
  let e = null;
  try{ await new FonteAPI({buscar, token: 't'}).carregar() }catch(x){ e = x }
  ok('erro sem corpo ainda é erro, não sucesso vazio', !!e && e.status === 500);
}

/* ─────────────────────────────────────────────── sessão */
console.log('\n── sessão ──');
{
  const {buscar, chamadas} = stub([
    {status: 200, json: {token: 'novo-token', base: 'b1'}},
    {status: 200, json: CARGA},
    {status: 200, json: {ok: true}}]);
  const f = new FonteAPI({buscar});
  await f.entrar('gestora@floriano.pi.gov.br', 'senha', '123456');
  eq('entrar guarda o token', f.token, 'novo-token');
  ok('a senha vai no corpo, nunca na URL',
     chamadas[0].corpo.senha === 'senha' && !chamadas[0].url.includes('senha'));
  await f.carregar();
  eq('e a chamada seguinte já vai autenticada', chamadas[1].cab.Authorization, 'Bearer novo-token');
  await f.sair();
  eq('sair esquece o token', f.token, null);
}

/* ──────────────────────────────────── Dados aceita fonte assíncrona */
console.log('\n── Dados com fonte assíncrona ──');
{
  const {buscar} = stub([{status: 200, json: JSON.parse(JSON.stringify(CARGA))}]);
  let chamou = false;
  await Dados.abrir(new FonteAPI({buscar, token: 't'}), () => { chamou = true });
  ok('o callback só dispara depois da carga', chamou);
  eq('e o estado da sessão foi aplicado', ctx.ROTA.estado().pacientes[0].nome, 'Maria');
  eq('inclusive o custo por km vindo do contrato', ctx.ROTA.estado().config.custoKmVariavel, 0.9);
}
{
  /* e a fonte síncrona segue funcionando igual — é o caminho de hoje */
  let chamou = false;
  const r = Dados.abrir(new FonteSeed(SEED), () => { chamou = true });
  ok('com o seed, o callback é imediato', chamou);
  eq('e abrir continua devolvendo Dados', r === Dados, true);
  eq('com o seed carregado', ctx.ROTA.estado().pacientes.length, 10);
}

/* ═══════════════════════ etapa 2 · métodos novos do contrato ═══════
   Desenho §8.5: as duas fontes têm os mesmos métodos, com o mesmo
   formato de retorno. A FonteAPI vai ao endpoint certo (api/servidor.mjs
   §5 do desenho); a FonteSeed devolve as mesmas chaves que a API, calculadas
   pelos mesmos módulos (regras/ e a costura).                          */
const METODOS = ['carregar', 'salvarPaciente', 'salvarAbastecimento', 'salvarBaixa', 'salvarProgramacao',
  'agendamentos', 'salvarAgendamento', 'distancias', 'salvarDistancia', 'salvarServico',
  'salvarVeiculoPortaria', 'salvarPactuacao', 'remessas', 'salvarRemessa',
  'farolProducao', 'conformidade', 'preBpaI', 'preBpaICsv'];
console.log('\n── métodos novos: as duas fontes ──');
eq('a FonteSeed tem todos os métodos do contrato', METODOS.filter(m => typeof FonteSeed.prototype[m] !== 'function'), []);
eq('a FonteAPI também', METODOS.filter(m => typeof FonteAPI.prototype[m] !== 'function'), []);

console.log('\n── métodos novos: a FonteAPI vai ao endpoint certo ──');
async function chamada(fn, resposta = {status: 200, json: {}}){
  const {buscar, chamadas} = stub([resposta]);
  const r = await fn(new FonteAPI({buscar, token: 't'}));
  return {c: chamadas[0], r};
}
{
  const {c} = await chamada(f => f.agendamentos({de: '2026-10-12', ate: '2026-10-16'}), {status: 200, json: []});
  eq('agendamentos do período', [c.metodo, c.url], ['GET', '/api/agendamentos?de=2026-10-12&ate=2026-10-16']);
}
{
  const ag = {paciente: 'p1', destino: 'd1', data: '2026-10-14', confirmado: null, etapa: 'tratamento', protocolo: 'AG-1'};
  const {c} = await chamada(f => f.salvarAgendamento(ag));
  eq('salvar agendamento (confirmado nulo = sem resposta, vai nulo)', [c.metodo, c.url, c.corpo], ['POST', '/api/agendamentos', ag]);
}
{
  const {c} = await chamada(f => f.distancias(), {status: 200, json: []});
  eq('distâncias', [c.metodo, c.url], ['GET', '/api/distancias']);
  const d = {origem: '9900001', destino: '9900003', km: null, fonte: null, lidoEm: null};
  const s2 = await chamada(f => f.salvarDistancia(d));
  eq('salvar distância (km nulo = a levantar, vai nulo)', [s2.c.metodo, s2.c.url, s2.c.corpo], ['PUT', '/api/distancias', d]);
}
{
  const {c} = await chamada(f => f.salvarServico('0b1c-uuid', {habilitacaoConferida: true}));
  eq('salvar serviço do destino', [c.metodo, c.url, c.corpo], ['PUT', '/api/destinos/0b1c-uuid/servico', {habilitacaoConferida: true}]);
}
{
  const {c} = await chamada(f => f.salvarVeiculoPortaria('ROTA 02', {cnesInscritoEm: '2026-07-30'}));
  eq('salvar doação do veículo (identificação codificada na URL)', [c.metodo, c.url], ['PUT', '/api/veiculos/ROTA%2002/portaria']);
}
{
  const {c} = await chamada(f => f.salvarPactuacao({estruturaGestao: true}));
  eq('salvar pactuação', [c.metodo, c.url, c.corpo], ['PUT', '/api/base/pactuacao', {estruturaGestao: true}]);
}
{
  const {c} = await chamada(f => f.remessas(), {status: 200, json: []});
  eq('remessas', [c.metodo, c.url], ['GET', '/api/remessas-bpa']);
  const rm = {competencia: '2026-09', linhas: 0, enviadaEm: null, informadoPor: 'faturamento da SMS'};
  const s2 = await chamada(f => f.salvarRemessa(rm));
  eq('informar remessa (zero é zero)', [s2.c.metodo, s2.c.url, s2.c.corpo], ['POST', '/api/remessas-bpa', rm]);
}
{
  const {c} = await chamada(f => f.farolProducao({hoje: '2026-10-14'}));
  eq('farol com data simulada', [c.metodo, c.url], ['GET', '/api/farol-producao?hoje=2026-10-14']);
  const s2 = await chamada(f => f.farolProducao());
  eq('farol sem data: o servidor usa o relógio de Brasília', s2.c.url, '/api/farol-producao');
  const s3 = await chamada(f => f.conformidade({hoje: '2026-10-14'}));
  eq('conformidade', [s3.c.metodo, s3.c.url], ['GET', '/api/conformidade?hoje=2026-10-14']);
}
{
  const {c} = await chamada(f => f.preBpaI('2026-09'));
  eq('conferência da pré-remessa', [c.metodo, c.url], ['GET', '/api/bpa-i/2026-09']);
  const csv = 'competencia;x\r\n';
  const s2 = await chamada(f => f.preBpaICsv('2026-09'), {status: 200, texto: csv, cabecalhos: {
    'Content-Type': 'text/csv; charset=utf-8', 'X-Rota-Linhas': '3',
    'Content-Disposition': 'attachment; filename="pre-bpa-i_caico-rn_2026-09.csv"'}});
  eq('o CSV chega como texto, com o nome do servidor', [s2.c.url, s2.r.csv, s2.r.nome, s2.r.linhas],
     ['/api/bpa-i/2026-09.csv', csv, 'pre-bpa-i_caico-rn_2026-09.csv', 3]);
  const {buscar, chamadas} = stub([]);
  let e = null;
  try{ await new FonteAPI({buscar, token: 't'}).preBpaI('2026-13') }catch(x){ e = x }
  ok('competência inválida não vira requisição', !!e && chamadas.length === 0);
}

console.log('\n── CPF em lugar nenhum, também no cliente ──');
{
  const {buscar, chamadas} = stub([]);
  let e = null;
  try{ await new FonteAPI({buscar, token: 't'}).salvarRemessa({competencia: '2026-09', linhas: 1, paciente: {Cpf: 'x'}}) }catch(x){ e = x }
  ok('a FonteAPI recusa corpo com chave de CPF antes de sair', !!e && chamadas.length === 0 && /CPF/.test(e.message));
  let e2 = null;
  try{ await new FonteAPI({buscar, token: 't'}).salvarPaciente({nome: 'X', cpf: 'x'}) }catch(x){ e2 = x }
  ok('inclusive no cadastro de paciente', !!e2 && chamadas.length === 0);
  let e3 = null;
  try{ new FonteSeed(SEED).salvarAgendamento({paciente: 1, cpf_paciente: 'x'}) }catch(x){ e3 = x }
  ok('e a FonteSeed também', !!e3 && /CPF/.test(e3.message));
}

console.log('\n── métodos novos: a FonteSeed devolve o formato da API ──');
{
  /* as chaves que a API devolve (api/servidor.mjs; cobertas em testes/api.e2e.mjs) */
  const CHAVES = {
    farolProducao: ['aplicavel', 'base_apta', 'competencias', 'farol', 'hoje', 'inicio_incentivo', 'operacional'],
    conformidade: ['base_apta', 'hoje', 'pactuacao', 'veiculos'],
    preBpaI: ['avisos', 'colunas', 'competencia', 'fora', 'leiaute', 'linhas', 'pendente_de_leiaute', 'total_deslocamentos'],
    remessa: ['competencia', 'enviadaEm', 'informadoPor', 'linhas', 'registradoEm'],
    agendamento: ['confirmado', 'data', 'destino', 'etapa', 'id', 'paciente', 'protocolo'],
    distancia: ['destino', 'fonte', 'km', 'lidoEm', 'origem'],
    pactuacao: ['deliberacaoCib', 'deliberacaoCibData', 'estruturaGestao', 'inicioIncentivo', 'municipiosAbrangidos'],
    portaria: ['cnes', 'incentivo', 'operacao', 'renovacao']
  };
  const chaves = o => Object.keys(o).sort();
  Dados.abrir(new FonteSeed(SEED));
  ctx.ROTA.regras.gerarProgramacao();
  const f = Dados.fonte, hoje = ctx.ROTA.regras.hojeISO();
  eq('farol de produção', chaves(f.farolProducao({hoje})), CHAVES.farolProducao);
  eq('conformidade', chaves(f.conformidade({hoje})), CHAVES.conformidade);
  eq('conformidade: a pactuação no vocabulário do console', chaves(f.conformidade({hoje}).pactuacao), CHAVES.pactuacao);
  eq('conferência da pré-remessa', chaves(f.preBpaI('2026-10')), CHAVES.preBpaI);
  eq('remessa informada', chaves(f.remessas()[0]), CHAVES.remessa);
  eq('remessa recém-informada', chaves(f.salvarRemessa({competencia: '2026-09', linhas: 0, enviadaEm: null, informadoPor: 'faturamento'})), CHAVES.remessa);
  eq('agendamento', chaves(f.agendamentos({})[0]), CHAVES.agendamento);
  eq('distância', chaves(f.distancias()[0]), CHAVES.distancia);
  eq('pactuação salva', chaves(f.salvarPactuacao({estruturaGestao: true})), CHAVES.pactuacao);
  eq('veículo salvo traz o painel da portaria', chaves(f.salvarVeiculoPortaria('ROTA-02', {laudo: null}).portaria), CHAVES.portaria);
  const csv = f.preBpaICsv('2026-10');
  eq('o CSV da demonstração tem nome, texto e contagem', chaves(csv), ['csv', 'linhas', 'nome']);
  eq('e é o mesmo código da costura: cabeçalho idêntico',
     csv.csv.split('\r\n')[0], costura11165.csvPreBPAI([]).split('\r\n')[0]);
  ok('a carga da FonteSeed continua com as seis chaves (as tabelas da norma ficam fora)',
     chaves(f.carregar()).join() === 'abastecimentos,config,destinos,lancamentos,pacientes,veiculos');
  let e = null;
  try{ f.preBpaI('julho') }catch(x){ e = x }
  ok('competência inválida também é recusada na demonstração', !!e);
  let e2 = null;
  try{ f.salvarDistancia({origem: '9922001', destino: '9922004', km: 140, fonte: null, lidoEm: null}) }catch(x){ e2 = x }
  ok('km sem fonte e data de leitura é recusado, como na API', !!e2);
}

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
