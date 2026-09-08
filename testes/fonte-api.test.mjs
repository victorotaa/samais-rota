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

const raiz = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(raiz, '..', 'rota-app.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx = vm.createContext({console, performance, Date, Math, JSON, Promise});
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
    return Promise.resolve({
      ok: r.status < 400, status: r.status,
      json: () => Promise.resolve(r.json)
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

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
