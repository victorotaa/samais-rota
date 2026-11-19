/* ═══════════════════════════════════════════════════════════════════
   Medição contratual mensal (km) — o núcleo, sem banco e sem relógio.

   regras/medicao-contratual.mjs mede o mês do contrato de transporte
   sanitário: franquia, banco trimestral, excedente com OS (paga) e sem
   OS (glosa), divergência GPS × hodômetro e falha de GPS. Modelo: Ota,
   20/10/2026 (samais-os/inteligencia/transporte-sanitario/
   remuneracao-e-apoio.md §6). Quantidade, nunca preço.

   Códigos de viagem sintéticos (V-…). Nenhum dado de paciente; nenhum
   CPF — só a recusa dele.

   Rodar: node testes/medicao-contratual.test.mjs
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passou = 0, falhou = 0;
const ok = (nome, cond, d) => cond
  ? (passou++, console.log('  ok   ·', nome))
  : (falhou++, console.log('  FALHA·', nome, d !== undefined ? '→ ' + JSON.stringify(d) : ''));
const eq = (nome, a, b) => ok(nome, JSON.stringify(a) === JSON.stringify(b), {obtido: a, esperado: b});

let M = null;
try{
  M = await import('../regras/medicao-contratual.mjs');
}catch(e){
  ok('regras/medicao-contratual.mjs carrega', false, e.code || e.message);
  console.log(`\n✗ ${passou} asserção(ões) passaram, ${falhou} falharam\n`);
  process.exit(1);
}

/* Contrato sintético: 1.000 km de franquia por mês, trimestre civil. */
const C = Object.freeze({franquia_km_mensal: 1000, banco_trimestral: 'trimestre_civil', inicio_contrato: '2026-01'});
/* Viagem medida pelo GPS, conferida pelo hodômetro igual. */
const V = (id, data, km, extra = {}) => ({id, data, km_gps: km, km_hodometro: km, ...extra});
const medir = (competencia, viagens, saldo_anterior_km = 0, contrato = C) =>
  M.medicaoContratual({competencia, contrato, viagens, saldo_anterior_km});
const conferencias = m => Object.values(m.totais.conferencias).every(Boolean);
const lanca = (fn) => { try{ fn(); return null }catch(e){ return e } };
const recusa = (nome, fn, campo) => {
  const e = lanca(fn);
  ok(nome, e instanceof M.MedicaoInvalida && e.campo === campo, e ? {campo: e.campo, msg: e.message} : 'não recusou');
};

/* ─────────────────────────────────────────────────── trimestre */
console.log('\n── trimestre do banco ──');
eq('civil: fevereiro é o 2º mês de jan–mar',
   M.trimestreDe({competencia: '2026-02', banco_trimestral: 'trimestre_civil'}),
   {inicio: '2026-01', fim: '2026-03', mes: 2, ultimo: false, primeiro_medido: '2026-01'});
eq('civil: dezembro fecha out–dez',
   [M.trimestreDe({competencia: '2026-12', banco_trimestral: 'trimestre_civil'}).inicio,
    M.trimestreDe({competencia: '2026-12', banco_trimestral: 'trimestre_civil'}).ultimo], ['2026-10', true]);
eq('civil com contrato iniciado no meio: o primeiro mês medido é o do contrato',
   M.trimestreDe({competencia: '2026-12', banco_trimestral: 'trimestre_civil', inicio_contrato: '2026-11'}).primeiro_medido,
   '2026-11');
eq('do início do contrato: fev, mar e abr formam o 1º trimestre',
   M.trimestreDe({competencia: '2026-04', banco_trimestral: 'inicio_contrato', inicio_contrato: '2026-02'}),
   {inicio: '2026-02', fim: '2026-04', mes: 3, ultimo: true, primeiro_medido: '2026-02'});
eq('e maio abre o 2º',
   M.trimestreDe({competencia: '2026-05', banco_trimestral: 'inicio_contrato', inicio_contrato: '2026-02'}).inicio,
   '2026-05');
eq('atravessa o ano: nov, dez e jan',
   M.trimestreDe({competencia: '2027-01', banco_trimestral: 'inicio_contrato', inicio_contrato: '2026-11'}),
   {inicio: '2026-11', fim: '2027-01', mes: 3, ultimo: true, primeiro_medido: '2026-11'});

/* ─────────────────────────────────────────────────── dentro da franquia */
console.log('\n── mês dentro da franquia ──');
{
  const m = medir('2026-01', [V('V-01', '2026-01-05', 300), V('V-02', '2026-01-12', 400)]);
  eq('apura 700 km, todos dentro da franquia', [m.km_apurado, m.franquia.dentro_km, m.excedente.total_km], [700, 700, 0]);
  eq('os 300 km não usados vão ao banco e seguem no trimestre',
     [m.franquia.nao_usada_km, m.banco.credito_km, m.banco.saldo_final_km, m.banco.segue_para_proxima_km,
      m.banco.expira_na_virada_km], [300, 300, 300, 300, 0]);
  ok('o saldo nunca vira dinheiro', m.banco.vira_dinheiro === false);
  ok('as contas fecham', conferencias(m), m.totais.conferencias);
}
{
  const m = medir('2026-01', [V('V-01', '2026-01-05', 1000)]);
  eq('exatamente a franquia: nada ao banco, nada excedente',
     [m.franquia.dentro_km, m.banco.credito_km, m.excedente.total_km], [1000, 0, 0]);
}

/* ─────────────────────────────────────────────────── acima da franquia */
console.log('\n── mês acima da franquia, com OS e sem OS ──');
{
  const m = medir('2026-02', [
    V('V-11', '2026-02-24', 150),                             // OS não registrada
    V('V-10', '2026-02-17', 250, {os_excedente: true}),       // OS autorizada
    V('V-08', '2026-02-03', 600),
    V('V-09', '2026-02-10', 300)
  ]);
  eq('1.300 km: 1.000 na franquia, 300 excedentes', [m.km_apurado, m.franquia.dentro_km, m.excedente.total_km],
     [1300, 1000, 300]);
  eq('a franquia acaba no meio da viagem de 17/02 (ordem cronológica)',
     m.viagens.find(v => v.viagem === 'V-10').alocacao,
     {franquia_km: 100, banco_km: 0, excedente_autorizado_km: 150, excedente_sem_os_km: 0});
  eq('com OS, o excedente se paga', [m.excedente.autorizado_km, m.excedente.autorizadas],
     [150, [{viagem: 'V-10', data: '2026-02-17', km: 150}]]);
  eq('sem OS registrada, se glosa, e diz por quê', [m.excedente.sem_os_km, m.excedente.sem_os],
     [150, [{viagem: 'V-11', data: '2026-02-24', km: 150, os: 'os_nao_registrada'}]]);
  eq('as viagens saem em ordem cronológica', m.viagens.map(v => v.viagem), ['V-08', 'V-09', 'V-10', 'V-11']);
  ok('as contas fecham', conferencias(m), m.totais.conferencias);
}
{
  const m = medir('2026-02', [V('V-20', '2026-02-02', 900), V('V-21', '2026-02-09', 300, {os_excedente: false})]);
  eq('OS negada: o excedente é glosado como "sem_os"', [m.excedente.sem_os_km, m.excedente.sem_os[0].os], [200, 'sem_os']);
}
{
  /* mesma data: a hora decide; sem hora, vem antes; empate pelo código */
  const m = medir('2026-02', [
    V('V-33', '2026-02-05', 400, {hora: '14:00', os_excedente: true}),
    V('V-32', '2026-02-05', 400, {hora: '06:00'}),
    V('V-31', '2026-02-05', 400)
  ]);
  eq('no mesmo dia, a hora ordena e a OS da última viagem cobre o excedente',
     [m.viagens.map(v => v.viagem), m.excedente.autorizado_km, m.excedente.sem_os_km], [['V-31', 'V-32', 'V-33'], 200, 0]);
  const embaralhada = medir('2026-02', [
    V('V-31', '2026-02-05', 400),
    V('V-33', '2026-02-05', 400, {hora: '14:00', os_excedente: true}),
    V('V-32', '2026-02-05', 400, {hora: '06:00'})
  ]);
  eq('a ordem de entrada não muda a medição', embaralhada, m);
}

/* ─────────────────────────────────────────────────── banco no trimestre */
console.log('\n── banco atravessando o trimestre e expirando na virada ──');
{
  const jan = medir('2026-01', [V('V-01', '2026-01-05', 700)]);
  const fev = medir('2026-02', [V('V-02', '2026-02-05', 1200)], jan.banco.segue_para_proxima_km);
  eq('janeiro deixa 300 km no banco', jan.banco.segue_para_proxima_km, 300);
  eq('fevereiro usa 200 do banco: nada excedente, 100 seguem',
     [fev.franquia.dentro_km, fev.banco.uso_km, fev.excedente.total_km, fev.banco.segue_para_proxima_km], [1000, 200, 0, 100]);
  eq('e a viagem diz de onde veio cada km', fev.viagens[0].alocacao,
     {franquia_km: 1000, banco_km: 200, excedente_autorizado_km: 0, excedente_sem_os_km: 0});
  const mar = medir('2026-03', [V('V-03', '2026-03-05', 800)], fev.banco.segue_para_proxima_km);
  eq('março, último mês: 300 de saldo expiram na virada e nada segue',
     [mar.banco.saldo_final_km, mar.banco.expira_na_virada_km, mar.banco.segue_para_proxima_km, mar.banco.expira_ao_fim_de],
     [300, 300, 0, '2026-03']);
  const abr = medir('2026-04', [V('V-04', '2026-04-05', 1100)], mar.banco.segue_para_proxima_km);
  eq('abril abre o trimestre sem saldo: os 100 km acima da franquia são excedentes',
     [abr.banco.saldo_anterior_km, abr.banco.uso_km, abr.excedente.sem_os_km], [0, 0, 100]);
  recusa('saldo trazido para a primeira competência do trimestre é recusado (expirou na virada)',
     () => medir('2026-04', [], 300), 'saldo_anterior_km');
  recusa('saldo maior do que a franquia dos meses anteriores do trimestre é recusado',
     () => medir('2026-02', [], 1000.001), 'saldo_anterior_km');
  ok('saldo igual à franquia de um mês passa no 2º mês', !lanca(() => medir('2026-02', [], 1000)));
  for(const m of [jan, fev, mar, abr]) ok(`as contas fecham em ${m.competencia}`, conferencias(m), m.totais.conferencias);
}
{
  const m = medir('2026-02', [V('V-40', '2026-02-05', 1500), V('V-41', '2026-02-20', 100, {os_excedente: true})], 300);
  eq('banco menor que o excedente: usa o saldo todo e o resto é excedente',
     [m.banco.uso_km, m.banco.saldo_final_km, m.excedente.sem_os_km, m.excedente.autorizado_km], [300, 0, 200, 100]);
  ok('as contas fecham', conferencias(m), m.totais.conferencias);
}
{
  /* o encadeamento lê as viagens do trimestre e chega ao mesmo saldo */
  const viagens = [V('V-01', '2026-01-05', 700), V('V-02', '2026-02-05', 1200), V('V-03', '2026-03-05', 800)];
  const m = M.medicaoDaCompetencia({competencia: '2026-03', contrato: C, viagens});
  eq('encadeada, março traz 100 km de fevereiro', [m.banco.saldo_anterior_km, m.banco.expira_na_virada_km], [100, 300]);
  eq('e mostra como o saldo se formou', m.encadeamento.map(e => [e.competencia, e.segue_para_proxima_km]),
     [['2026-01', 300], ['2026-02', 100], ['2026-03', 0]]);
  eq('a mesma medição de março feita mês a mês',
     (({encadeamento, ...resto}) => resto)(m),
     medir('2026-03', [viagens[2]], 100));
  const abr = M.medicaoDaCompetencia({competencia: '2026-04', contrato: C, viagens: [V('V-04', '2026-04-05', 900)]});
  eq('abril encadeado começa do zero', [abr.encadeamento.length, abr.banco.saldo_anterior_km, abr.banco.segue_para_proxima_km],
     [1, 0, 100]);
  recusa('viagem fora da janela do trimestre é recusada',
     () => M.medicaoDaCompetencia({competencia: '2026-04', contrato: C, viagens: [V('V-03', '2026-03-05', 800)]}),
     'viagens[0].data');
  const novembro = M.medicaoDaCompetencia({competencia: '2026-12',
    contrato: {...C, inicio_contrato: '2026-11'}, viagens: [V('V-50', '2026-11-10', 400)]});
  eq('contrato iniciado em novembro (trimestre civil): outubro não credita franquia',
     [novembro.encadeamento.map(e => e.competencia), novembro.banco.saldo_anterior_km], [['2026-11', '2026-12'], 600]);
}

/* ─────────────────────────────────────────────────── divergência */
console.log('\n── divergência GPS × hodômetro ──');
{
  const m = medir('2026-01', [
    V('V-60', '2026-01-02', 100, {km_hodometro: 102}),     // 2,00%: no limite, dentro
    V('V-61', '2026-01-03', 100, {km_hodometro: 102.1}),   // 2,10%: acima
    V('V-62', '2026-01-04', 100, {km_hodometro: 97.9}),    // 2,10% abaixo: acima
    V('V-63', '2026-01-05', 250, {km_hodometro: 254}),     // 1,60%: dentro
    V('V-64', '2026-01-06', 80, {km_hodometro: null})      // sem conferência
  ]);
  eq('só acima de 2% vira divergência, para cima ou para baixo', m.divergencias.map(d => [d.viagem, d.percentual]),
     [['V-61', 2.1], ['V-62', 2.1]]);
  eq('exatamente 2% fica dentro da tolerância', m.viagens.find(v => v.viagem === 'V-60').divergencia,
     {percentual: 2, acima_da_tolerancia: false});
  eq('a divergência traz a viagem, as duas medidas e a diferença', m.divergencias[0],
     {viagem: 'V-61', data: '2026-01-03', km_gps: 100, km_hodometro: 102.1, diferenca_km: 2.1, percentual: 2.1,
      tolerancia_percentual: 2});
  eq('o km continua o do GPS, que é a fonte', [m.viagens.find(v => v.viagem === 'V-61').km_apurado, m.km_apurado],
     [100, 630]);
  eq('GPS sem hodômetro: medido, e listado como sem conferência', m.sem_conferencia_hodometro, ['V-64']);
  const largo = medir('2026-01', [V('V-61', '2026-01-03', 100, {km_hodometro: 104})],
    0, {...C, tolerancia_gps_hodometro: 0.05});
  eq('o contrato pode escrever outra tolerância (5%)', largo.divergencias, []);
  const zero = medir('2026-01', [V('V-65', '2026-01-03', 0, {km_hodometro: 12})]);
  eq('GPS zerado com hodômetro rodado é divergência, sem percentual inventado',
     [zero.divergencias[0].viagem, zero.divergencias[0].percentual], ['V-65', null]);
}

/* ─────────────────────────────────────────────────── falha de GPS */
console.log('\n── falha de GPS ──');
{
  const m = medir('2026-01', [
    V('V-70', '2026-01-02', null, {falha_gps: true, km_hodometro: 180, embarque_registrado: true}),
    V('V-71', '2026-01-03', 50, {falha_gps: true, km_hodometro: 180, embarque_registrado: true}),
    {id: 'V-72', data: '2026-01-04', km_gps: null, km_hodometro: 120, embarque_registrado: true},
    V('V-73', '2026-01-05', null, {falha_gps: true, km_hodometro: 90, embarque_registrado: false}),
    V('V-74', '2026-01-06', null, {falha_gps: true, km_hodometro: 90}),
    V('V-75', '2026-01-07', null, {falha_gps: true, km_hodometro: null, embarque_registrado: true}),
    V('V-76', '2026-01-08', 200)
  ]);
  eq('hodômetro com embarque registrado substitui o GPS, com marcação',
     m.substituidas_por_hodometro.map(s => [s.viagem, s.km_hodometro, s.motivo]),
     [['V-70', 180, 'falha_gps'], ['V-71', 180, 'falha_gps'], ['V-72', 120, 'gps_sem_registro']]);
  ok('e avisa da compensação na competência seguinte', /competência seguinte/.test(m.substituidas_por_hodometro[0].nota));
  eq('trecho parcial do GPS com falha declarada não vale: vale o hodômetro',
     [m.viagens.find(v => v.viagem === 'V-71').fonte, m.viagens.find(v => v.viagem === 'V-71').km_apurado], ['hodometro', 180]);
  eq('sem embarque registrado, sem embarque informado ou sem hodômetro: a conferir, com o motivo',
     m.a_conferir.map(a => [a.viagem, a.motivo]),
     [['V-73', 'hodometro_sem_embarque_registrado'], ['V-74', 'embarque_a_conferir'], ['V-75', 'sem_gps_e_sem_hodometro']]);
  eq('a conferir fica fora do apurado e nunca vira zero',
     [m.viagens.find(v => v.viagem === 'V-73').km_apurado, m.km_apurado, m.totais.viagens_a_conferir], [null, 680, 3]);
  eq('os totais separam GPS e hodômetro substituto', [m.totais.km_gps, m.totais.km_hodometro_substituto], [200, 480]);
  ok('as contas fecham', conferencias(m), m.totais.conferencias);
}

/* ─────────────────────────────────────────────────── sem viagem */
console.log('\n── competência sem viagem ──');
{
  const m = medir('2026-03', [], 400);
  eq('nenhuma viagem: zero apurado, a franquia inteira ao banco',
     [m.km_apurado, m.totais.viagens, m.banco.credito_km, m.banco.saldo_final_km], [0, 0, 1000, 1400]);
  eq('e, no último mês do trimestre, tudo expira na virada', [m.banco.expira_na_virada_km, m.banco.segue_para_proxima_km],
     [1400, 0]);
  eq('listas vazias, não ausentes', [m.viagens, m.divergencias, m.a_conferir, m.excedente.sem_os], [[], [], [], []]);
  ok('as contas fecham', conferencias(m), m.totais.conferencias);
}

/* ─────────────────────────────────────────────────── privacidade e preço */
console.log('\n── privacidade e quantidade sem preço ──');
{
  const m = medir('2026-01', [{...V('V-80', '2026-01-02', 100), cns: '700000000000001', nome: 'PAC-SINT-80'}]);
  ok('nada do paciente que vier na entrada chega à saída', !/700000000|PAC-SINT/.test(JSON.stringify(m)));
  const chaves = [];
  (function andar(o){ if(o && typeof o === 'object') for(const [k, v] of Object.entries(o)){ chaves.push(k); andar(v) } })(m);
  ok('nenhuma chave de dinheiro ou de composição de preço na saída',
     !chaves.some(k => /valor|preco|preço|custo|reais|lucro|margem|bdi/i.test(k)), chaves.filter(k => /valor|preco|custo/i.test(k)));
  ok('e nenhum R$ no texto', !/R\$/.test(JSON.stringify(m)));
  ok('a nota declara que a medição é de quantidade', /sem valor/.test(m.nota) && m.unidade === 'km');
  recusa('chave "cpf" numa viagem é recusada', () => medir('2026-01', [{...V('V-81', '2026-01-02', 10), CPF_paciente: 'x'}]),
     'viagens.0.CPF_paciente');
  recusa('e no contrato', () => medir('2026-01', [], 0, {...C, cpf_fiscal: 'x'}), 'contrato.cpf_fiscal');
  const entrada = Object.freeze([Object.freeze(V('V-82', '2026-01-02', 100))]);
  ok('não altera a entrada', !lanca(() => medir('2026-01', entrada)));
}

/* ─────────────────────────────────────────────────── configuração */
console.log('\n── configuração da API ──');
{
  const configuracao = {bases: {'base-a': {...C, fonte: 'Contrato SINT-01, cláusula 7'}, 'base-b': {franquia_km_mensal: 500}}};
  const a = M.contratoDaConfiguracao({configuracao, base_id: 'base-a'});
  eq('lê os parâmetros e a fonte da base', [a.contrato.franquia_km_mensal, a.contrato.tolerancia_gps_hodometro, a.fonte],
     [1000, 0.02, 'Contrato SINT-01, cláusula 7']);
  eq('base sem entrada: parâmetros a configurar (null)', M.contratoDaConfiguracao({configuracao, base_id: 'base-z'}), null);
  eq('nome de propriedade herdada não vale como base', M.contratoDaConfiguracao({configuracao, base_id: 'toString'}), null);
  recusa('entrada incompleta é recusada', () => M.contratoDaConfiguracao({configuracao, base_id: 'base-b'}),
     'contrato.banco_trimestral');
  recusa('na API, o início do contrato é obrigatório',
     () => M.contratoDaConfiguracao({configuracao: {bases: {x: {franquia_km_mensal: 500, banco_trimestral: 'trimestre_civil'}}},
       base_id: 'x'}), 'bases.x.inicio_contrato');
  recusa('configuração sem "bases" é recusada', () => M.contratoDaConfiguracao({configuracao: {}, base_id: 'x'}), 'configuracao');
  const exemplo = JSON.parse(fs.readFileSync(path.join(raiz, 'docs', 'medicao-contratos.exemplo.json'), 'utf8'));
  const doExemplo = M.contratoDaConfiguracao({configuracao: exemplo, base_id: '00000000-0000-0000-0000-000000000000'});
  eq('o exemplo documentado em docs/ é uma configuração válida',
     [doExemplo?.contrato.banco_trimestral, doExemplo?.contrato.inicio_contrato], ['trimestre_civil', '2026-11']);
  ok('e não traz valor em R$', !/R\$|valor|preco|custo/i.test(JSON.stringify(exemplo.bases)));
}

/* ─────────────────────────────────────────────────── entradas inválidas */
console.log('\n── entradas inválidas ──');
recusa('competência fora do formato', () => medir('2026-1', []), 'competencia');
recusa('mês 13', () => medir('2026-13', []), 'competencia');
recusa('competência anterior ao início do contrato', () => medir('2025-12', []), 'competencia');
recusa('sem contrato', () => M.medicaoContratual({competencia: '2026-01', viagens: []}), 'contrato');
recusa('franquia zero', () => medir('2026-01', [], 0, {...C, franquia_km_mensal: 0}), 'contrato.franquia_km_mensal');
recusa('franquia em texto', () => medir('2026-01', [], 0, {...C, franquia_km_mensal: '1000'}), 'contrato.franquia_km_mensal');
recusa('franquia ausente (não há padrão)', () => medir('2026-01', [], 0, {banco_trimestral: 'trimestre_civil'}),
   'contrato.franquia_km_mensal');
recusa('tolerância de 100%', () => medir('2026-01', [], 0, {...C, tolerancia_gps_hodometro: 1}), 'contrato.tolerancia_gps_hodometro');
recusa('tolerância negativa', () => medir('2026-01', [], 0, {...C, tolerancia_gps_hodometro: -0.01}),
   'contrato.tolerancia_gps_hodometro');
recusa('tolerância com mais de quatro casas', () => medir('2026-01', [], 0, {...C, tolerancia_gps_hodometro: 0.00001}),
   'contrato.tolerancia_gps_hodometro');
recusa('regra do banco desconhecida', () => medir('2026-01', [], 0, {...C, banco_trimestral: 'mensal'}), 'contrato.banco_trimestral');
recusa('trimestre do contrato sem início do contrato',
   () => medir('2026-01', [], 0, {franquia_km_mensal: 1000, banco_trimestral: 'inicio_contrato'}), 'contrato.inicio_contrato');
recusa('início do contrato fora do formato', () => medir('2026-01', [], 0, {...C, inicio_contrato: '01/2026'}),
   'contrato.inicio_contrato');
recusa('viagens que não são lista', () => medir('2026-01', null), 'viagens');
recusa('viagem sem código', () => medir('2026-01', [{data: '2026-01-02', km_gps: 10}]), 'viagens[0].id');
recusa('data inexistente', () => medir('2026-02', [V('V-90', '2026-02-30', 10)]), 'viagens[0].data');
recusa('viagem de outra competência', () => medir('2026-02', [V('V-91', '2026-03-01', 10)]), 'viagens[0].data');
recusa('hora fora do formato', () => medir('2026-01', [V('V-92', '2026-01-02', 10, {hora: '6h'})]), 'viagens[0].hora');
recusa('km negativo', () => medir('2026-01', [V('V-93', '2026-01-02', -1)]), 'viagens[0].km_gps');
recusa('km em texto', () => medir('2026-01', [V('V-94', '2026-01-02', 10, {km_hodometro: '10'})]), 'viagens[0].km_hodometro');
recusa('km infinito', () => medir('2026-01', [V('V-95', '2026-01-02', Infinity)]), 'viagens[0].km_gps');
recusa('falha de GPS que não é booleana', () => medir('2026-01', [V('V-96', '2026-01-02', 10, {falha_gps: 'sim'})]),
   'viagens[0].falha_gps');
recusa('OS que não é booleana', () => medir('2026-01', [V('V-97', '2026-01-02', 10, {os_excedente: 1})]),
   'viagens[0].os_excedente');
recusa('código de viagem repetido', () => medir('2026-01', [V('V-98', '2026-01-02', 10), V('V-98', '2026-01-03', 10)]),
   'viagens[1].id');
recusa('saldo negativo', () => medir('2026-02', [], -1), 'saldo_anterior_km');
recusa('saldo em texto', () => medir('2026-02', [], '100'), 'saldo_anterior_km');

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
