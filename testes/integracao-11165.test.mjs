/* ═══════════════════════════════════════════════════════════════════
   Integração da Portaria 11.165 na API — o núcleo sem banco.

   api/integracao-11165.mjs monta, a partir de linhas já lidas do banco,
   o que a API devolve: competências fechadas e farol da base, pré-remessa
   BPA-I (o que entra, o que fica de fora e por quê), o CSV, o painel de
   conformidade e a recusa de CPF. As regras são as do módulo
   regras/portaria-11165.mjs; aqui se testa a costura, sem rede, sem
   banco e sem relógio.

   Identificadores sintéticos. Nenhum CPF: o teste só confere que a
   coluna sai vazia.

   Rodar: node testes/integracao-11165.test.mjs
   ═══════════════════════════════════════════════════════════════════ */
let passou = 0, falhou = 0;
const ok = (nome, cond, d) => cond
  ? (passou++, console.log('  ok   ·', nome))
  : (falhou++, console.log('  FALHA·', nome, d !== undefined ? '→ ' + JSON.stringify(d) : ''));
const eq = (nome, a, b) => ok(nome, JSON.stringify(a) === JSON.stringify(b), {obtido: a, esperado: b});

let I = null, relogio = null;
try{
  I = await import('../api/integracao-11165.mjs');
  relogio = await import('../api/relogio.mjs');
}catch(e){
  ok('api/integracao-11165.mjs e api/relogio.mjs carregam', false, e.code || e.message);
  console.log(`\n✗ ${passou} asserção(ões) passaram, ${falhou} falharam\n`);
  process.exit(1);
}

/* ─────────────────────────────────────────────────── relógio */
console.log('\n── relógio de Brasília ──');
eq('às 23h30 de Brasília ainda é o mesmo dia (o UTC já virou)',
   relogio.hojeBrasilia(new Date('2026-10-16T02:30:00Z')), '2026-10-15');
eq('à meia-noite de Brasília vira o dia', relogio.hojeBrasilia(new Date('2026-10-16T03:00:00Z')), '2026-10-16');

/* ─────────────────────────────────────────────────── CPF */
console.log('\n── CPF em lugar nenhum ──');
eq('chave cpf na raiz', I.chaveComCpf({nome: 'X', cpf: 'nao-e-cpf'}), 'cpf');
eq('em qualquer caixa e em qualquer profundidade', I.chaveComCpf({aut: {CPF: 'x'}}), 'aut.CPF');
eq('dentro de lista', I.chaveComCpf({lista: [{a: 1}, {cpfPaciente: 1}]}), 'lista.1.cpfPaciente');
eq('a palavra no VALOR não é chave', I.chaveComCpf({obs: 'sem cpf aqui'}), null);
eq('corpo vazio passa', I.chaveComCpf(null), null);

/* ─────────────────────────────────────────────────── datas */
console.log('\n── competências e datas ──');
ok('competência AAAA-MM', I.competenciaValida('2026-08') && !I.competenciaValida('2026-13') && !I.competenciaValida('2026-8'));
ok('data de calendário de verdade', I.dataValida('2026-02-28') && !I.dataValida('2026-02-30') && !I.dataValida('28/02/2026'));
eq('competências fechadas desde o início até o mês anterior a hoje',
   I.competenciasFechadas({inicio: '2026-06', hoje: '2026-10-16'}), ['2026-06', '2026-07', '2026-08', '2026-09']);
eq('atravessa o ano', I.competenciasFechadas({inicio: '2025-11', hoje: '2026-02-01'}), ['2025-11', '2025-12', '2026-01']);
eq('início no mês corrente: nenhuma fechada', I.competenciasFechadas({inicio: '2026-10', hoje: '2026-10-16'}), []);
eq('idade na data: véspera do aniversário', I.idadeEm('1958-03-12', '2026-03-11'), 67);
eq('idade na data: no aniversário', I.idadeEm('1958-03-12', '2026-03-12'), 68);
eq('sem nascimento, idade desconhecida (não zero)', I.idadeEm(null, '2026-03-12'), null);
eq('dias corridos entre duas datas', I.diasEntre('2026-08-10', '2026-10-16'), 67);
eq('semana de segunda a domingo: a segunda', I.semanaDe('2026-08-03'), '2026-08-03');
eq('o domingo fica na mesma semana', I.semanaDe('2026-08-09'), '2026-08-03');
eq('a segunda seguinte abre outra', I.semanaDe('2026-08-10'), '2026-08-10');

/* ─────────────────────────────────────────────────── farol */
console.log('\n── farol da base por competência ──');
const R = (competencia, linhas_enviadas) => ({competencia, linhas_enviadas, enviada_em: null, informado_por: 'faturamento'});
{
  const f = I.farolDaBase({inicio_incentivo: '2026-06', hoje: '2026-10-16',
    remessas: [R('2026-06', 41), R('2026-07', 44), R('2026-08', 0), R('2026-09', 0)]});
  eq('dois meses seguidos sem registro: risco, o próximo suspende',
     [f.farol.estado, f.farol.meses_sem_registro, f.farol.alerta], ['risco', 2, true]);
  eq('e devolve as quatro competências fechadas', f.competencias.map(c => c.competencia),
     ['2026-06', '2026-07', '2026-08', '2026-09']);
}
{
  const f = I.farolDaBase({inicio_incentivo: '2026-06', hoje: '2026-10-16',
    remessas: [R('2026-06', 41), R('2026-07', 44), R('2026-08', 0)]});
  eq('competência não informada entra nula, não zero', f.competencias[3].linhas_enviadas, null);
  eq('e o farol fica a conferir', f.farol.estado, 'a_conferir');
}
{
  const f = I.farolDaBase({inicio_incentivo: '2026-06', hoje: '2026-10-16',
    remessas: [R('2026-05', 0), R('2026-06', 3), R('2026-07', 0), R('2026-08', 0), R('2026-09', 0)]});
  eq('remessa anterior ao início não conta; três sem registro suspendem',
     [f.farol.estado, f.competencias.length], ['suspenso', 4]);
}
{
  const f = I.farolDaBase({inicio_incentivo: null, hoje: '2026-10-16', remessas: [R('2026-09', 10)]});
  eq('sem início do incentivo, o farol não inventa contagem',
     [f.farol.estado, f.farol.meses_sem_registro, f.farol.motivo], ['a_conferir', null, 'inicio_incentivo_a_levantar']);
}

/* ─────────────────────────────────────────────────── pré-remessa */
console.log('\n── pré-remessa BPA-I ──');
/* deslocamento elegível, comprovado, no território, com CNES executante */
const D = (o) => ({
  viagem_id: 'VIA-SINT', data: '2026-08-03', paciente_id: 'PAC-SINT-01', cns: '700 0000 0000 0001',
  nascimento: '1960-01-01', tratamento: 'hemodialise', residencia_ibge: '9900001', residencia_uf: 'ZA',
  servico_ibge: '9900002', servico_uf: 'ZA', habilitacao_conferida: true, distancia_km: 80,
  agendamento_confirmado: true, etapa: null, presente_ida: true, presente_volta: true,
  cnes_executante: '0000001', elegibilidade: 'elegivel', ...o});
const RT = {tratamento: 'radioterapia', servico_ibge: '9900003', distancia_km: 252};
const deslocamentos = [
  D({viagem_id: 'V1', data: '2026-08-03'}), D({viagem_id: 'V2', data: '2026-08-04'}),
  D({viagem_id: 'V3', data: '2026-08-05'}), D({viagem_id: 'V4', data: '2026-08-06'}),           // 4ª da semana
  D({viagem_id: 'V5', data: '2026-08-10', presente_volta: false}),                              // não voltou
  D({...RT, paciente_id: 'PAC-SINT-02', cns: '700000000000002', viagem_id: 'V6', data: '2026-08-03', etapa: 'planejamento'}),
  D({...RT, paciente_id: 'PAC-SINT-02', cns: '700000000000002', viagem_id: 'V7', data: '2026-08-04', etapa: 'tratamento'}),
  D({...RT, paciente_id: 'PAC-SINT-02', cns: '700000000000002', viagem_id: 'V8', data: '2026-08-05', etapa: 'tratamento'}),
  D({...RT, paciente_id: 'PAC-SINT-02', cns: '700000000000002', viagem_id: 'V9', data: '2026-08-06', etapa: null}),
  D({...RT, paciente_id: 'PAC-SINT-03', agendamento_confirmado: false, elegibilidade: 'inelegivel'}),
  D({...RT, paciente_id: 'PAC-SINT-04', distancia_km: null, elegibilidade: 'pendente', etapa: 'planejamento'}),
  D({...RT, paciente_id: 'PAC-SINT-05', residencia_ibge: '9900005', etapa: 'planejamento'}),
  D({paciente_id: 'PAC-SINT-06', cnes_executante: null}),
  D({...RT, paciente_id: 'PAC-SINT-07', nascimento: null, etapa: 'planejamento'}),
  D({paciente_id: 'PAC-SINT-08', elegibilidade: 'pendente'}),                                    // banco ≠ módulo
  D({paciente_id: 'PAC-SINT-09', data: '2026-09-01'})                                            // outra competência
];
const pre = I.preRemessaBPAI({competencia: '2026-08', deslocamentos,
  pactuacao: {deliberacao_cib: 'CIB-SINT-001', municipios_abrangidos: ['9900001']}});

eq('entram só os elegíveis, comprovados e financiáveis', pre.linhas.map(l => l.viagem),
   ['V1', 'V2', 'V3', 'V6', 'V7']);
eq('a outra competência não entra nem conta', pre.total_deslocamentos, 15);
eq('o que ficou de fora, por motivo', pre.fora, {total: 10, motivos: {
  'RE-09:excedente_semanal': 1, 'nao_comprovado': 1, 'RE-11:excedente': 1, 'RE-11:etapa_a_informar': 1,
  'inelegivel:RE-07': 1, 'pendente:RE-03': 1, 'RC-12:fora_dos_municipios_abrangidos': 1,
  'cnes_executante_a_levantar': 1, 'linha_invalida:RE-15': 1, 'divergencia_modulo_banco': 1}});
eq('a linha da hemodiálise', pre.linhas[0], {
  competencia: '2026-08', cnes_estabelecimento_executante: '0000001', procedimento_sigtap: '08.03.01.016-8',
  cns_paciente: '700000000000001', [I.CABECALHO_CPF]: '', municipio_residencia_ibge: '9900001',
  data_deslocamento: '2026-08-03', quantidade: 1, modalidade: 'hemodialise', viagem: 'V1',
  pendencias: ['RE-14', 'RC-08']});
eq('a da radioterapia leva o código dela', pre.linhas[3].procedimento_sigtap, '08.03.01.015-0');
ok('nenhuma linha leva CPF', pre.linhas.every(l => l[I.CABECALHO_CPF] === ''));
ok('a falta de CPF é pendência POR LINHA, nunca motivo de exclusão',
   pre.linhas.every(l => (l.pendencias || []).includes('RE-14')) && !Object.keys(pre.fora.motivos).some(m => /RE-14/.test(m)));
eq('o aviso diz que o faturamento preenche o CPF no lugar do CNS', pre.avisos['RE-14:cpf_a_preencher_pelo_faturamento'], 5);
ok('o aviso antigo ("completar") saiu', !('cpf_a_completar_pelo_faturamento_do_ente' in pre.avisos));
{
  /* O ROTA-OS nunca declara "sem CPF" nem situação de rua por ninguém: mesmo que a
     linha do banco traga esses campos, eles não chegam à pré-remessa. */
  const sujo = I.preRemessaBPAI({competencia: '2026-08', pactuacao: null,
    deslocamentos: [D({prd_sem_cpf: 'S', prd_situacao_rua: 'S', sem_cpf: true, situacao_rua: true})]});
  const chaves = sujo.linhas.flatMap(l => Object.keys(l));
  eq('a linha suja ainda entra (o campo é ignorado, não vira erro)', sujo.linhas.length, 1);
  ok('nenhuma linha da pré-remessa tem prd_sem_cpf nem situação de rua',
     !chaves.some(k => /sem_cpf|situacao_rua/i.test(k)), chaves);
  ok('nem o cabeçalho do CSV', !I.COLUNAS_PRE_BPAI.some(c => /sem_cpf|situacao_rua|sem cpf|situação de rua/i.test(c)));
  const csvSujo = I.csvPreBPAI(sujo.linhas).split('\r\n').filter(Boolean);
  eq('e a coluna do CPF sai vazia', csvSujo[1].split(';')[4], '');
  ok('nenhum S solto no fim da linha do CSV', !/;S$/.test(csvSujo[1]));
}
{
  const sem = I.preRemessaBPAI({competencia: '2026-08', deslocamentos: [D({})], pactuacao: null});
  eq('sem pactuação, o território fica a conferir mas não derruba a linha',
     [sem.linhas.length, sem.avisos['RC-12:a_conferir']], [1, 1]);
}

/* ─────────────────────────────────────────────────── CSV */
console.log('\n── CSV ──');
const csv = I.csvPreBPAI(pre.linhas);
const linhas = csv.split('\r\n').filter(Boolean);
eq('cabeçalho fixo, separador ;', linhas[0],
   'competencia;cnes_estabelecimento_executante;procedimento_sigtap;cns_paciente;' +
   'CPF a preencher pelo faturamento do ente, que substitui o CNS na linha final (um documento por paciente, ' +
   'layout BPA v05.00);municipio_residencia_ibge;data_deslocamento;' +
   'quantidade;modalidade;viagem');
eq('uma linha por paciente-deslocamento', linhas.length, 1 + 5);
eq('a coluna do CPF sai vazia', linhas[1].split(';')[4], '');
eq('linha completa', linhas[1], '2026-08;0000001;08.03.01.016-8;700000000000001;;9900001;2026-08-03;1;hemodialise;V1');
ok('nenhum nome de paciente no arquivo', !/PAC-SINT/.test(csv));
eq('valor com separador vai entre aspas',
   I.csvPreBPAI([{...pre.linhas[0], viagem: 'a;b"c'}]).split('\r\n')[1].split(';').slice(-2).join(';'),
   '"a;b""c"');

/* ─────────────────────────────────────────────────── conformidade */
console.log('\n── painel de conformidade ──');
const V = (o) => ({identificacao: 'VEI-SINT-01', classe: 'micro', doado_ms: true, finalidade_doacao: 'radioterapia',
  data_recebimento: '2026-05-20', prorrogacao: false, cnes_inscrito_em: '2026-06-10',
  primeira_viagem_concluida: '2026-07-06', emplacado_em: '2026-05-15', hodometro: 12000,
  disponibilidade_12m: 0.95, laudo: false, ...o});
const PACT = {deliberacao_cib: 'CIB-SINT-001', estrutura_gestao_registrada: true};
{
  const c = I.conformidade({hoje: '2026-10-16', pactuacao: PACT, veiculos: [V({})]});
  eq('base apta com veículo elegível, CNES cumprido, estrutura e CIB', c.base_apta, {estado: 'apta', faltam: []});
  eq('o veículo, regra por regra',
     [c.veiculos[0].id, c.veiculos[0].incentivo.estado, c.veiculos[0].cnes.estado,
      c.veiculos[0].operacao.estado, c.veiculos[0].renovacao.estado],
     ['VEI-SINT-01', 'elegivel', 'cumprido', 'cumprido', 'nao']);
  eq('o limite do CNES é calculado do recebimento, não digitado', c.veiculos[0].cnes.limite, '2026-07-19');
}
{
  const c = I.conformidade({hoje: '2026-10-16', pactuacao: {...PACT, deliberacao_cib: null}, veiculos: [V({})]});
  eq('sem deliberação CIB, pendente e diz o que falta', c.base_apta, {estado: 'pendente', faltam: ['deliberacao_cib']});
}
{
  const c = I.conformidade({hoje: '2026-10-16', pactuacao: null,
    veiculos: [V({classe: 'ambulancia', doado_ms: false})]});
  eq('só ambulância: o incentivo não se aplica a este contrato', c.base_apta.estado, 'nao_aplicavel');
}
{
  const c = I.conformidade({hoje: '2026-10-16', pactuacao: PACT,
    veiculos: [V({data_recebimento: null, cnes_inscrito_em: null, doado_ms: null})]});
  eq('sem data de recebimento e sem origem conferida: a conferir, nunca vencido',
     [c.veiculos[0].cnes.estado, c.veiculos[0].incentivo.estado, c.base_apta.estado],
     ['a_conferir', 'pendente', 'pendente']);
}

/* ──────────────────────── a mesma costura no console (etapa 2) ──
   O console gera a pré-remessa da demonstração pelo MESMO código da API
   (sem duplicar regra). Para o navegador carregar, a costura mora em
   regras/ (estático no deploy; api/ vira função no Vercel) e não importa
   nada de node:. A API reexporta: é a mesma função, não uma cópia.     */
console.log('\n── a costura carrega no navegador ──');
{
  const fs = await import('node:fs');
  let C = null;
  try{ C = await import('../regras/integracao-11165.mjs') }catch(e){ ok('regras/integracao-11165.mjs carrega', false, e.code || e.message) }
  if(C){
    const fonte = fs.readFileSync(new URL('../regras/integracao-11165.mjs', import.meta.url), 'utf8');
    ok('sem import de node: (roda no navegador)', !/from\s+['"]node:/.test(fonte) && !/import\(\s*['"]node:/.test(fonte));
    ok('a API reexporta a mesma função (não é cópia)',
       ['preRemessaBPAI', 'csvPreBPAI', 'farolDaBase', 'conformidade', 'competenciasFechadas', 'chaveComCpf']
         .every(n => typeof C[n] === 'function' && C[n] === I[n]));
  }
}

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
