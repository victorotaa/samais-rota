/* ═══════════════════════════════════════════════════════════════════
   ROTA · regras da Portaria GM/MS nº 11.165/2026 (operação) lida com a
   Portaria GM/MS nº 11.164/2026 (financiamento; altera a 8.516/2025).

   Especificação, matriz artigo → campo e lacunas:
     samais-os/produtos/rota/portaria-11165.md
   Casos (dado, não código): testes/casos/portaria-11165-casos.json

   Fontes lidas no texto oficial em 16/10/2026:
     11.165 — DOU 12/05/2026, ed. 87, s. 1, p. 123
     11.164 — DOU 12/05/2026, ed. 87, s. 1, p. 115
     SAES/MS 4.904/2026 (códigos CNES dos veículos) · Lei 12.732/2012
     SIGTAP 10/2026: 08.03.01.015-0 e 08.03.01.016-8
   (A 11.179/2026 é outra norma: CNES e nefrologia. Não é o transporte.)

   ES module puro: sem DOM, sem rede, sem relógio. "hoje" vem do chamador,
   que em produção usa o relógio de Brasília (America/Sao_Paulo).
   Cada função recebe UM objeto — a forma da `entrada` dos casos.

   Lacuna nunca vira zero: dado ausente devolve 'pendente' / 'a_conferir',
   nunca 'inelegivel' nem 0 km.

   ⚠️ DIVERGÊNCIAS QUE O CONSOLE (rota-app.html) AINDA TEM — este módulo
   ainda NÃO está ligado a ele; a integração depende de decisão do Ota:
   1. Distância. O console decide com `DESTINOS[p.dest].km` (base → destino;
      rota-app.html `elegivelFederal`; supabase/schema.sql `elegivel_federal`
      sobre `destinos.km`). A norma mede do MUNICÍPIO DE RESIDÊNCIA ao
      MUNICÍPIO SEDE DO SERVIÇO (11.165 arts. 15 e 16; 11.164 art. 23 §§2º
      e 4º), exige ente federativo diverso (Lei 12.732 arts. 2º-A §3º e
      2º-B §3º) e, na hemodiálise, a mesma UF (11.164 art. 23 caput).
   2. Farol. O console conta DIAS desde a última baixa interna, em janela
      de 90 dias com cortes 30/60 (`diasSemRegistro`/`farolRepasse`;
      `bases.janela_suspensao_dias`). A norma conta COMPETÊNCIAS sem
      nenhum registro BPA-I enviado ao SIA: 3 suspendem, 6 excluem
      (11.165 art. 21 §2º). Baixa interna sem remessa não comprova nada.
   3. O console não tem agendamento confirmado (art. 13 §3º), código
      SIGTAP, BPA-I, veículo elegível ao incentivo (art. 14) nem o prazo
      CNES calculado da data de recebimento (art. 11 III).
   ═══════════════════════════════════════════════════════════════════ */

export const PROCEDIMENTO = Object.freeze({
  radioterapia: '08.03.01.015-0',
  hemodialise:  '08.03.01.016-8'
});
export const PARAMETROS = Object.freeze({
  kmMinimoExclusivo: 50,      // 11.165 art. 1º §1º I e II: "acima de cinquenta quilômetros"
  kmMaximoInclusivo: 500,     // 11.164 art. 23 caput (8.516): "raio máximo de até quinhentos"
  quantidadeMaximaBPAI: 12,   // SIGTAP 10/2026, "Quantidade Máxima: 12"
  idadeMaxima: 130            // SIGTAP 10/2026
});
/* Limite superior inclusivo de cada faixa (11.164 Anexo IV = Anexo V da
   8.516). Os vãos decimais (50–51, 100–101, 150–151…) caem na faixa de
   cima — regra derivada, declarada na especificação (§1.5). */
const FAIXAS = Object.freeze({
  hemodialise:  [[100, 2], [150, 3], [500, 4]],
  radioterapia: [[200, 2], [300, 3], [400, 4], [500, 5]]
});

const MODALIDADES = Object.keys(PROCEDIMENTO);
const ausente = v => v === null || v === undefined;
const numero = v => typeof v === 'number' && Number.isFinite(v);

/* Faixa de financiamento pela distância (11.164 Anexo IV). Fora de
   > 50 e ≤ 500 km não há faixa. */
export function faixaDistancia({modalidade, km}){
  const tabela = FAIXAS[modalidade];
  if(!tabela || !numero(km)) return {faixa: null};
  if(km <= PARAMETROS.kmMinimoExclusivo || km > PARAMETROS.kmMaximoInclusivo) return {faixa: null};
  for(const [teto, faixa] of tabela) if(km <= teto) return {faixa};
  return {faixa: null};
}

/* Procedimento SIGTAP da modalidade (11.165 arts. 18 a 20). */
export function procedimentoSigtap({modalidade}){
  return {procedimento: PROCEDIMENTO[modalidade] || null};
}

/* Elegibilidade ao transporte da portaria, em três estados.
   RE-01 modalidade — 11.165 art. 1º §1º I e II
   RE-02 ente diverso — Lei 12.732 arts. 2º-A §3º e 2º-B §3º; 11.165 art. 13
   RE-03 > 50 km de município a município — 11.165 art. 1º §1º; arts. 15 e 16
   RE-04 ≤ 500 km — 11.164 art. 23 caput (aplicado às duas modalidades: derivado)
   RE-05 hemodiálise na mesma UF — 11.164 art. 23 caput, "âmbito estadual"
   RE-06 serviço habilitado (radioterapia: art. 1º §1º I; hemodiálise 15.04: art. 16 I)
   RE-07 tratamento agendado e confirmado — 11.165 art. 13 §3º */
export function elegibilidade11165(d){
  const violadas = [], pendencias = [];
  const res = d.residencia || {}, srv = d.servico || {};

  if(!MODALIDADES.includes(d.modalidade)) violadas.push('RE-01');

  if(ausente(res.ibge) || ausente(srv.municipio_ibge)) pendencias.push('RE-02');
  else if(res.ibge === srv.municipio_ibge) violadas.push('RE-02');

  if(!numero(d.distancia_km)) pendencias.push('RE-03');
  else if(d.distancia_km <= PARAMETROS.kmMinimoExclusivo) violadas.push('RE-03');

  if(numero(d.distancia_km) && d.distancia_km > PARAMETROS.kmMaximoInclusivo) violadas.push('RE-04');

  if(d.modalidade === 'hemodialise'){
    if(ausente(res.uf) || ausente(srv.uf)) pendencias.push('RE-05');
    else if(res.uf !== srv.uf) violadas.push('RE-05');
  }

  if(srv.habilitacao_conferida === false) violadas.push('RE-06');
  else if(srv.habilitacao_conferida !== true) pendencias.push('RE-06');

  if(d.agendamento_confirmado === false) violadas.push('RE-07');
  else if(d.agendamento_confirmado !== true) pendencias.push('RE-07');

  const status = violadas.length ? 'inelegivel' : pendencias.length ? 'pendente' : 'elegivel';
  const elegivel = status === 'elegivel';
  return {
    status,
    regras_violadas: violadas,
    pendencias,
    procedimento: elegivel ? PROCEDIMENTO[d.modalidade] : null,
    faixa: elegivel ? faixaDistancia({modalidade: d.modalidade, km: d.distancia_km}).faixa : null
  };
}

/* Uma linha do BPA-I antes de ir ao faturamento do ente.
   RE-12 código certo para a modalidade — 11.165 arts. 18 a 20; SIGTAP
   RE-13 quantidade ≤ 12 — SIGTAP (a unidade de contagem é lacuna L2)
   RE-14 CPF presente — SIGTAP, atributo "Obrigatório CPF"
   RE-15 idade 0 a 130 — SIGTAP
   RC-08 registro do art. 27 completo — 11.165 art. 27
   O CNS e os demais campos dependem do layout vigente do BPA (lacuna L1). */
export function validarLinhaBPAI(l){
  const erros = [];
  if(!l.procedimento || l.procedimento !== PROCEDIMENTO[l.modalidade]) erros.push('RE-12');
  if(!numero(l.quantidade) || l.quantidade < 1 || l.quantidade > PARAMETROS.quantidadeMaximaBPAI) erros.push('RE-13');
  if(l.cpf_presente !== true) erros.push('RE-14');
  if(!numero(l.idade) || l.idade < 0 || l.idade > PARAMETROS.idadeMaxima) erros.push('RE-15');
  if(l.registro_art27_completo !== true) erros.push('RC-08');
  return {valida: erros.length === 0, erros};
}

/* Hemodiálise: até 3 idas e 3 voltas por paciente por semana (11.165
   art. 16 parágrafo único). O excedente roda, mas não é financiável. */
export function frequenciaHD({idas, voltas}){
  return {
    excedente_idas:   Math.max(0, (idas   || 0) - 3),
    excedente_voltas: Math.max(0, (voltas || 0) - 3)
  };
}

/* Acompanhantes por viagem (11.165 art. 16 parágrafo único): na
   hemodiálise, até 10% do total de pacientes da viagem. Arredondamento
   para baixo (derivado, conservador): divisão inteira, sem ponto
   flutuante. Na radioterapia não há teto (art. 15 parágrafo único). */
export function acompanhantesViagem({modalidade, pacientes, acompanhantes}){
  if(modalidade !== 'hemodialise') return {limite: null, excedente: 0};
  const limite = Math.floor((pacientes || 0) / 10);
  return {limite, excedente: Math.max(0, (acompanhantes || 0) - limite)};
}

/* Radioterapia: é financiável 1 ida e volta de planejamento e 1 de
   tratamento por pessoa (11.165 art. 15 parágrafo único). O transporte
   diário do tratamento roda e fica como excedente operacional (quantas
   linhas de BPA-I por paciente é a lacuna L4). Etapa ausente é pendente,
   nunca vira tratamento. */
export function etapasRadioterapia({idas_e_voltas}){
  let planejamento = 0, tratamento = 0, pendentes = 0;
  for(const iv of (idas_e_voltas || [])){
    if(iv.etapa === 'planejamento') planejamento++;
    else if(iv.etapa === 'tratamento') tratamento++;
    else pendentes++;
  }
  const financiaveis = Math.min(planejamento, 1) + Math.min(tratamento, 1);
  return {financiaveis, excedentes: planejamento + tratamento - financiaveis, pendentes};
}

/* Farol de produção, por competência (11.165 art. 21 §2º): sem NENHUM
   registro enviado pelo gestor por três meses seguidos, o incentivo é
   suspenso até a retomada; por seis meses, é excluído.
   - Conta só competências fechadas a partir do início do incentivo.
   - "Com registro" = remessa BPA-I enviada com ≥ 1 linha (RC-05); baixa
     interna sem remessa não conta.
   - Competência sem informação (null) não vira zero: se ela impede saber
     a sequência atual, o estado é 'a_conferir'; e ela nunca soma para
     a exclusão.
   - Cortes 1 = atenção e 2 = risco (o alerta antes do 3º mês) e a
     persistência da exclusão após a retomada são regras derivadas. */
export function farolProducao({inicio_incentivo, competencias_fechadas}){
  const lista = (competencias_fechadas || [])
    .filter(c => !inicio_incentivo || c.competencia >= inicio_incentivo)
    .sort((a, b) => a.competencia < b.competencia ? -1 : a.competencia > b.competencia ? 1 : 0);
  if(!lista.length) return {meses_sem_registro: 0, estado: 'sem_competencia_fechada', alerta: false};

  let sequencia = 0, excluido = false;
  for(const c of lista){
    if(ausente(c.linhas_bpai_enviadas)) sequencia = 0;          // incerteza não soma para sanção
    else if(c.linhas_bpai_enviadas > 0) sequencia = 0;
    else if(++sequencia >= 6) excluido = true;
  }

  let meses = 0;
  for(let i = lista.length - 1; i >= 0; i--){
    const n = lista[i].linhas_bpai_enviadas;
    if(ausente(n)) return {meses_sem_registro: null, estado: excluido ? 'excluido' : 'a_conferir', alerta: true};
    if(n > 0) break;
    meses++;
  }

  const estado = excluido ? 'excluido'
    : meses === 0 ? 'em_dia'
    : meses === 1 ? 'atencao'
    : meses === 2 ? 'risco'
    : meses < 6 ? 'suspenso' : 'excluido';
  return {meses_sem_registro: meses, estado, alerta: excluido || meses >= 2};
}

/* ─── datas: aritmética de calendário em UTC só como régua de contar
   dias sobre datas já escritas (AAAA-MM-DD); nada aqui lê o relógio. */
function paraDia(iso){
  const [a, m, d] = iso.split('-').map(Number);
  return Date.UTC(a, m - 1, d) / 864e5;
}
function deDia(n){
  const t = new Date(n * 864e5), p = x => String(x).padStart(2, '0');
  return t.getUTCFullYear() + '-' + p(t.getUTCMonth() + 1) + '-' + p(t.getUTCDate());
}
const ALERTA_DIAS = 15;

function prazo({hoje, inicio, dias, cumpridoEm}){
  if(ausente(inicio)) return {limite: null, dias_restantes: null, estado: 'a_conferir'};
  const limite = paraDia(inicio) + dias;
  if(!ausente(cumpridoEm)){
    return {limite: deDia(limite), dias_restantes: null,
            estado: paraDia(cumpridoEm) <= limite ? 'cumprido' : 'cumprido_fora_do_prazo'};
  }
  const restantes = limite - paraDia(hoje);
  return {limite: deDia(limite), dias_restantes: restantes,
          estado: restantes < 0 ? 'vencido' : restantes <= ALERTA_DIAS ? 'atencao' : 'no_prazo'};
}

/* CNES do veículo em até 60 dias do recebimento, no estabelecimento da
   SES, da SMS ou da central de regulação (11.165 art. 11 III e art. 14
   parágrafo único I; SAES/MS 4.904/2026 art. 2º). Dias corridos, limite
   inclusive (derivado). Sem data de recebimento: a conferir — nunca o
   prazo digitado à mão. */
export function prazoCNES({hoje, veiculo}){
  return prazo({hoje, inicio: veiculo.data_recebimento, dias: 60, cumpridoEm: veiculo.cnes_inscrito_em});
}

/* Veículo em pleno funcionamento em até 60 dias do recebimento,
   prorrogáveis por mais 30 (11.165 art. 10 §3º e art. 11 §1º); sob pena
   de revogação da doação e suspensão do custeio. Marco: 1ª viagem concluída. */
export function prazoOperacao({hoje, veiculo}){
  return prazo({hoje, inicio: veiculo.data_recebimento, dias: 60 + (veiculo.prorrogacao ? 30 : 0),
                cumpridoEm: veiculo.primeira_viagem_concluida});
}

/* Incentivo de custeio só para van e micro-ônibus concedidos pelo MS
   (11.165 art. 14 parágrafo único); só os da cota radioterapia e
   hemodiálise têm custeio federal (NT Conjunta SAES/SE 153/2026). A
   ambulância tipo A e a embarcação operam, mas não entram. */
export function veiculoElegivelIncentivo({classe, doado_ms, finalidade_doacao}){
  if(classe !== 'van' && classe !== 'micro') return {estado: 'nao_elegivel', motivo: 'classe'};
  if(doado_ms === false) return {estado: 'nao_elegivel', motivo: 'origem'};
  if(doado_ms !== true) return {estado: 'pendente', motivo: 'origem'};
  if(finalidade_doacao === 'outros') return {estado: 'nao_elegivel', motivo: 'finalidade'};
  if(!MODALIDADES.includes(finalidade_doacao)) return {estado: 'pendente', motivo: 'finalidade'};
  return {estado: 'elegivel', motivo: null};
}

/* A base está apta ao incentivo quando cumpre os três critérios do
   art. 14 parágrafo único: I CNES do veículo; II estrutura de gestão do
   transporte; III deliberação CIB. Sem veículo elegível, o farol do
   repasse é "não aplicável a este contrato". */
export function baseAptaIncentivo({veiculos, estrutura_gestao_registrada, deliberacao_cib}){
  const lista = veiculos || [];
  const elegiveis = lista.filter(v => v.estado_incentivo === 'elegivel');
  if(!elegiveis.length){
    return lista.some(v => v.estado_incentivo === 'pendente')
      ? {estado: 'pendente', faltam: ['veiculo_elegivel']}
      : {estado: 'nao_aplicavel', faltam: []};
  }
  const faltam = [];
  if(!elegiveis.some(v => v.cnes === 'cumprido' || v.cnes === 'cumprido_fora_do_prazo')) faltam.push('cnes_veiculo');
  if(estrutura_gestao_registrada !== true) faltam.push('estrutura_gestao');
  if(ausente(deliberacao_cib)) faltam.push('deliberacao_cib');
  return {estado: faltam.length ? 'pendente' : 'apta', faltam};
}

/* Uso secundário (11.165 art. 4º §1º): não comprometer os prioritários
   (I), mesma rota ou percurso compatível (II), planejado, autorizado
   pelo gestor e registrado (III); e nunca atrasar, cancelar ou reduzir a
   capacidade dos prioritários (§2º). Autorização no dia da viagem ou
   antes conta como prévia (derivado). */
export function usoSecundario({data_viagem, secundarios, prioritarios_atrasados_ou_cancelados}){
  const motivos = new Set(), lista = secundarios || [];
  for(const s of lista){
    if(ausente(s.autorizado_em) || ausente(data_viagem) || paraDia(s.autorizado_em) > paraDia(data_viagem))
      motivos.add('sem_autorizacao_previa');
    if(s.itinerario_compativel !== true) motivos.add('itinerario_incompativel');
  }
  if(lista.length && (prioritarios_atrasados_ou_cancelados || 0) > 0) motivos.add('prejuizo_ao_prioritario');
  const ordem = ['sem_autorizacao_previa', 'itinerario_incompativel', 'prejuizo_ao_prioritario'];
  const m = ordem.filter(x => motivos.has(x));
  return {estado: m.length ? 'nao_conforme' : 'conforme', motivos: m};
}

/* Renovação de frota (11.165 art. 12): I idade ≥ 5 anos do emplacamento;
   II ≥ 300.000 km; III disponibilidade < 70% em 12 meses, verificada por
   laudo. §1º: atingir não obriga trocar, abre a elegibilidade. §2º: ente
   com portaria de suspensão do custeio não renova. */
export function renovacao({hoje, veiculo, base_suspensa}){
  const v = veiculo || {}, criterios = [];
  let desconhecido = false;
  if(ausente(v.emplacado_em)) desconhecido = true;
  else{
    const [a, m, d] = v.emplacado_em.split('-').map(Number);
    if(paraDia(hoje) >= Date.UTC(a + 5, m - 1, d) / 864e5) criterios.push('idade');
  }
  if(!numero(v.hodometro)) desconhecido = true;
  else if(v.hodometro >= 300000) criterios.push('km');
  if(!numero(v.disponibilidade_12m)) desconhecido = true;
  else if(v.disponibilidade_12m < 0.70) criterios.push('disponibilidade');

  if(base_suspensa === true) return {estado: 'bloqueado', criterios};
  if(criterios.includes('idade') || criterios.includes('km')) return {estado: 'elegivel_renovacao', criterios};
  if(criterios.includes('disponibilidade'))
    return {estado: v.laudo === true ? 'elegivel_renovacao' : 'pendente', criterios};
  return {estado: desconhecido ? 'a_conferir' : 'nao', criterios};
}

/* Operador regional (11.165 art. 25, 4º item, alínea b): o custeio dos
   municípios envolvidos fica com o município ou consórcio que opera, nos
   termos da pactuação na CIB. Fora dos abrangidos, não é desta base. */
export function municipioAbrangido({paciente, base}){
  if(!base || ausente(base.deliberacao_cib)) return {estado: 'a_conferir'};
  const ibge = paciente && paciente.municipio_residencia_ibge;
  if(ausente(ibge)) return {estado: 'a_conferir'};
  return {estado: (base.municipios_abrangidos || []).includes(ibge) ? 'dentro' : 'fora'};
}

/* Registro individualizado por paciente e por deslocamento, com a
   finalidade da viagem, a compatibilidade com os itinerários prioritários
   e o aproveitamento da capacidade da frota (11.165 art. 27). A lista
   mínima de campos é derivada (COSEMS-SC NT 011/2026 §13). */
const CAMPOS_ART27 = ['paciente', 'municipio_residencia_ibge', 'modalidade', 'finalidade', 'servico_cnes',
  'data', 'viagem', 'veiculo', 'itinerario', 'presente_ida', 'presente_volta', 'assentos', 'lotacao'];
export function registroArt27(d){
  const faltam = CAMPOS_ART27.filter(k => ausente(d[k]));
  return {estado: faltam.length ? 'incompleto' : 'completo', faltam};
}
