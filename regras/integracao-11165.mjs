/* ═══════════════════════════════════════════════════════════════════
   ROTA · integração da Portaria GM/MS 11.165/2026 — núcleo puro (costura).

   Desenho: docs/PORTARIA-11165-INTEGRACAO.md. As REGRAS são as de
   regras/portaria-11165.mjs (fonte única); este arquivo só costura:
   recebe linhas já lidas (do banco, na API; da sessão, no console em
   demonstração) e monta o que se devolve. Sem banco, sem rede, sem
   relógio, sem import de node: — "hoje" vem do chamador.
   Mora em regras/ (etapa 2) para o console carregar o MESMO código no
   navegador; api/integracao-11165.mjs só reexporta. Testes:
   testes/integracao-11165.test.mjs.

   CPF em lugar nenhum (decisão do Ota, 16/10/2026): a pré-remessa sai
   com o CNS e a coluna do CPF vazia. O faturamento do ente preenche o
   CPF e ele SUBSTITUI o CNS na linha final: um documento por paciente
   (≈ layout BPA v05.00, cópia pública lida em 19/10/2026; Ota, 20/10:
   "a troca pode ser feita para CPF"). Layout: docs/referencias/bpa/.
   ═══════════════════════════════════════════════════════════════════ */
import {
  elegibilidade11165, validarLinhaBPAI, frequenciaHD, etapasRadioterapia, farolProducao,
  prazoCNES, prazoOperacao, veiculoElegivelIncentivo, baseAptaIncentivo, renovacao, municipioAbrangido
} from './portaria-11165.mjs';

/* ─── CPF ───────────────────────────────────────────────────────────
   Caminho da primeira chave com "cpf" no nome (qualquer caixa, qualquer
   profundidade), ou null. A API recusa o corpo inteiro com 400. */
export function chaveComCpf(valor, caminho = ''){
  if(!valor || typeof valor !== 'object') return null;
  for(const [k, v] of Object.entries(valor)){
    const aqui = caminho ? `${caminho}.${k}` : k;
    if(/cpf/i.test(k)) return aqui;
    const dentro = chaveComCpf(v, aqui);
    if(dentro) return dentro;
  }
  return null;
}

/* ─── datas de calendário ───────────────────────────────────────────
   Aritmética em UTC só como régua de contar dias sobre datas já
   escritas (AAAA-MM-DD); nada aqui lê o relógio. */
const paraDia = iso => { const [a, m, d] = iso.split('-').map(Number); return Date.UTC(a, m - 1, d) / 864e5 };
const deDia = n => { const t = new Date(n * 864e5), p = x => String(x).padStart(2, '0');
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())}` };

export const competenciaValida = c => typeof c === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(c);
export function dataValida(d){
  if(typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  return deDia(paraDia(d)) === d;
}
export const competenciaDe = data => data.slice(0, 7);
export const diasEntre = (de, ate) => paraDia(ate) - paraDia(de);

function proximaCompetencia(c){
  const [a, m] = c.split('-').map(Number);
  return m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, '0')}`;
}

/* Competências fechadas: do início do incentivo até o mês anterior ao de
   hoje, inclusive. O mês corrente ainda está aberto. */
export function competenciasFechadas({inicio, hoje}){
  const lista = [], corrente = competenciaDe(hoje);
  for(let c = inicio; c < corrente; c = proximaCompetencia(c)) lista.push(c);
  return lista;
}

export function idadeEm(nascimento, data){
  if(!nascimento || !data) return null;
  const [an, mn, dn] = nascimento.split('-').map(Number), [a, m, d] = data.split('-').map(Number);
  return a - an - ((m < mn || (m === mn && d < dn)) ? 1 : 0);
}

/* Segunda-feira da semana (segunda a domingo ≈, especificação RE-09). */
export function semanaDe(data){
  const n = paraDia(data), diaSemana = (new Date(n * 864e5).getUTCDay() + 6) % 7;   // 0 = segunda
  return deDia(n - diaSemana);
}

/* ─── farol de produção da base (RC-05, RC-06; art. 21 §2º) ─────────
   Monta a lista completa das competências fechadas desde o início do
   incentivo. Competência sem remessa informada entra com linhas nulas —
   sem informação não é zero — e o módulo decide. */
export function farolDaBase({inicio_incentivo, remessas, hoje}){
  const porCompetencia = new Map((remessas || []).map(r => [r.competencia, r]));
  if(!inicio_incentivo){
    return {competencias: [],
      farol: {meses_sem_registro: null, estado: 'a_conferir', alerta: false, motivo: 'inicio_incentivo_a_levantar'}};
  }
  const competencias = competenciasFechadas({inicio: inicio_incentivo, hoje}).map(c => {
    const r = porCompetencia.get(c);
    return {competencia: c, linhas_enviadas: r ? (r.linhas_enviadas ?? null) : null,
      enviada_em: r?.enviada_em ?? null, informado_por: r?.informado_por ?? null};
  });
  const farol = farolProducao({inicio_incentivo,
    competencias_fechadas: competencias.map(c => ({competencia: c.competencia, linhas_bpai_enviadas: c.linhas_enviadas}))});
  return {competencias, farol};
}

/* ─── elegibilidade: linha do banco → entrada do módulo ─────────────── */
export function entradaElegibilidade(r){
  return {
    modalidade: r.tratamento,
    residencia: {ibge: r.residencia_ibge ?? null, uf: r.residencia_uf ?? null},
    servico: {municipio_ibge: r.servico_ibge ?? null, uf: r.servico_uf ?? null,
              habilitacao_conferida: r.habilitacao_conferida ?? null},
    distancia_km: r.distancia_km === null || r.distancia_km === undefined ? null : Number(r.distancia_km),
    agendamento_confirmado: r.agendamento_confirmado ?? null
  };
}

/* ─── pré-remessa BPA-I ─────────────────────────────────────────────
   Uma linha por paciente-deslocamento da competência que seja, nesta
   ordem: elegível (módulo, e igual ao banco — D8), comprovado (ida e
   volta), do território da base (RC-12 "fora" sai), financiável (RE-09
   na hemodiálise por semana; RE-11 na radioterapia por paciente na
   competência ≈ L4), com CNES do estabelecimento executante (L10) e com
   linha válida (RE-12, RE-13, RE-15).
   RE-14 (CPF) é do faturamento do ente, que troca o CNS pelo CPF na
   linha final (D1); RC-08 (registro do art. 27) depende do itinerário
   pactuado, ainda não modelado (M20): os dois viram PENDÊNCIA da linha
   (`pendencias`) e aviso no total, nunca motivo de exclusão.
   O ROTA-OS nunca preenche prd_sem_cpf (pos. 351) nem situação de rua
   (pos. 350): a linha é montada campo a campo, e esses campos não
   existem nela.
   TODO (L1): gravador de largura fixa a partir do layout versionado (≈)
   em docs/referencias/bpa/. Este CSV é insumo de conferência do
   faturamento, não arquivo de importação. */
export const CABECALHO_CPF = 'CPF a preencher pelo faturamento do ente, que substitui o CNS na linha final (um documento por paciente, layout BPA v05.00)';
export const COLUNAS_PRE_BPAI = Object.freeze([
  'competencia', 'cnes_estabelecimento_executante', 'procedimento_sigtap', 'cns_paciente', CABECALHO_CPF,
  'municipio_residencia_ibge', 'data_deslocamento', 'quantidade', 'modalidade', 'viagem'
]);
export const LEIAUTE = 'CSV pré-BPA-I ROTA v1 · não é o arquivo de importação do BPA Magnético (layout v05.00 versionado ≈; gravador: lacuna L1)';
const QUANTIDADE_POR_LINHA = 1;   // 1 ida e volta = 1 (≈, lacuna L2)
const ACEITOS_NA_LINHA = new Set(['RE-14', 'RC-08']);

export function preRemessaBPAI({competencia, deslocamentos, pactuacao}){
  const daCompetencia = (deslocamentos || [])
    .filter(d => d.data && competenciaDe(d.data) === competencia)
    .sort((a, b) => (a.paciente_id + '|' + a.data + '|' + a.viagem_id) < (b.paciente_id + '|' + b.data + '|' + b.viagem_id) ? -1 : 1);

  const linhas = [], motivos = {}, avisos = {};
  const fora = m => { motivos[m] = (motivos[m] || 0) + 1 };
  const avisar = m => { avisos[m] = (avisos[m] || 0) + 1 };
  const semanaHD = new Map();     // paciente|semana → deslocamentos financiáveis contados
  const etapasRT = new Map();     // paciente → idas e voltas da competência
  const base = {deliberacao_cib: pactuacao?.deliberacao_cib ?? null,
                municipios_abrangidos: pactuacao?.municipios_abrangidos || []};

  for(const d of daCompetencia){
    const el = elegibilidade11165(entradaElegibilidade(d));
    if(d.elegibilidade !== undefined && d.elegibilidade !== el.status){ fora('divergencia_modulo_banco'); continue }
    if(el.status !== 'elegivel'){
      fora(`${el.status}:${(el.regras_violadas.length ? el.regras_violadas : el.pendencias).join('+')}`);
      continue;
    }
    if(!(d.presente_ida && d.presente_volta)){ fora('nao_comprovado'); continue }

    const territorio = municipioAbrangido({paciente: {municipio_residencia_ibge: d.residencia_ibge}, base}).estado;
    if(territorio === 'fora'){ fora('RC-12:fora_dos_municipios_abrangidos'); continue }
    if(territorio === 'a_conferir') avisar('RC-12:a_conferir');

    if(d.tratamento === 'hemodialise'){
      const chave = d.paciente_id + '|' + semanaDe(d.data), n = (semanaHD.get(chave) || 0) + 1;
      semanaHD.set(chave, n);
      if(frequenciaHD({idas: n, voltas: n}).excedente_idas > 0){ fora('RE-09:excedente_semanal'); continue }
    }else{
      const antes = etapasRT.get(d.paciente_id) || [], depois = [...antes, {etapa: d.etapa ?? null}];
      etapasRT.set(d.paciente_id, depois);
      const a = etapasRadioterapia({idas_e_voltas: antes}), b = etapasRadioterapia({idas_e_voltas: depois});
      if(b.financiaveis === a.financiaveis){
        fora(b.pendentes > a.pendentes ? 'RE-11:etapa_a_informar' : 'RE-11:excedente');
        continue;
      }
    }

    if(!d.cnes_executante){ fora('cnes_executante_a_levantar'); continue }

    const cns = String(d.cns || '').replace(/\D/g, '');
    const validacao = validarLinhaBPAI({modalidade: d.tratamento, procedimento: el.procedimento,
      quantidade: QUANTIDADE_POR_LINHA, cns_presente: cns !== '', cpf_presente: false,
      idade: idadeEm(d.nascimento, d.data), registro_art27_completo: false});
    const erros = validacao.erros.filter(e => !ACEITOS_NA_LINHA.has(e));
    const pendencias = validacao.erros.filter(e => ACEITOS_NA_LINHA.has(e));
    if(erros.length){ fora('linha_invalida:' + erros.join('+')); continue }

    linhas.push({
      competencia,
      cnes_estabelecimento_executante: String(d.cnes_executante).trim(),
      procedimento_sigtap: el.procedimento,
      cns_paciente: cns,
      [CABECALHO_CPF]: '',
      municipio_residencia_ibge: d.residencia_ibge,
      data_deslocamento: d.data,
      quantidade: QUANTIDADE_POR_LINHA,
      modalidade: d.tratamento,
      viagem: d.viagem_id,
      pendencias
    });
  }

  if(linhas.length){
    avisos['RE-14:cpf_a_preencher_pelo_faturamento'] = linhas.filter(l => l.pendencias.includes('RE-14')).length;
    avisos['RC-08:itinerario_pactuado_nao_modelado'] = linhas.length;
  }
  const totalFora = Object.values(motivos).reduce((a, n) => a + n, 0);
  return {competencia, leiaute: LEIAUTE, colunas: COLUNAS_PRE_BPAI, total_deslocamentos: daCompetencia.length,
    linhas, fora: {total: totalFora, motivos}, avisos};
}

const celula = v => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
export function csvPreBPAI(linhas){
  const corpo = (linhas || []).map(l => COLUNAS_PRE_BPAI.map(c => celula(l[c])).join(';'));
  return [COLUNAS_PRE_BPAI.join(';'), ...corpo].join('\r\n') + '\r\n';
}

/* ─── painel de conformidade da base (RC-01 a RC-04, RC-09) ──────────
   `base_suspensa` (portaria de suspensão do custeio, art. 12 §2º) não é
   modelado: vai indefinido, e a renovação nunca sai "bloqueada" por
   suposição. */
export function conformidade({hoje, pactuacao, veiculos}){
  const lista = (veiculos || []).map(v => ({
    id: v.identificacao,
    classe: v.classe,
    incentivo: veiculoElegivelIncentivo({classe: v.classe, doado_ms: v.doado_ms ?? null,
      finalidade_doacao: v.finalidade_doacao ?? null}),
    cnes: prazoCNES({hoje, veiculo: {data_recebimento: v.data_recebimento ?? null,
      cnes_inscrito_em: v.cnes_inscrito_em ?? null}}),
    operacao: prazoOperacao({hoje, veiculo: {data_recebimento: v.data_recebimento ?? null,
      prorrogacao: !!v.prorrogacao, primeira_viagem_concluida: v.primeira_viagem_concluida ?? null}}),
    renovacao: renovacao({hoje, veiculo: {emplacado_em: v.emplacado_em ?? null,
      hodometro: v.hodometro === null || v.hodometro === undefined ? null : Number(v.hodometro),
      disponibilidade_12m: v.disponibilidade_12m === null || v.disponibilidade_12m === undefined
        ? null : Number(v.disponibilidade_12m),
      laudo: v.laudo ?? null}})
  }));
  const base_apta = baseAptaIncentivo({
    veiculos: lista.map(v => ({estado_incentivo: v.incentivo.estado, cnes: v.cnes.estado})),
    estrutura_gestao_registrada: pactuacao?.estrutura_gestao_registrada ?? null,
    deliberacao_cib: pactuacao?.deliberacao_cib ?? null
  });
  return {veiculos: lista, base_apta};
}
