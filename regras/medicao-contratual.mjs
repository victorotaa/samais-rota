/* ═══════════════════════════════════════════════════════════════════
   ROTA · medição contratual mensal (km) — núcleo puro.

   O modelo de remuneração da Samais no transporte sanitário (Ota,
   20/10/2026; samais-os/inteligencia/transporte-sanitario/
   remuneracao-e-apoio.md §6) é um Custo Operacional mensal global com:
     · franquia mensal de km aferida pelo ROTA-OS;
     · banco de km trimestral, com prazo, cujo saldo nunca vira dinheiro;
     · km excedente pago só quando autorizado por OS no ROTA-OS.
   Este módulo emite a medição que o fiscal do ente confere. Ela mede
   QUANTIDADE (km), nunca preço: nenhum valor em R$ entra ou sai daqui,
   porque a composição do preço não entra no sistema.

   Puro: sem banco, sem rede, sem relógio e sem import de node:. A
   competência vem do chamador; a API usa o relógio de Brasília
   (api/relogio.mjs) só para dizer se ela está aberta ou fechada.
   Especificação: RF-09 em docs/ROTA-SPEC.md. Testes:
   testes/medicao-contratual.test.mjs.

   Privacidade: a medição se faz pelo código da viagem. Nenhum dado do
   paciente entra, nem o CNS, porque o código basta. Entrada com chave
   "cpf" é recusada (decisão de 16/10/2026; §6.3, "Dado pessoal").

   Cláusulas citadas abaixo como "§6.1 …" e "§6.3 …": as linhas do
   modelo e da tabela de riscos de medição da pesquisa.
   ═══════════════════════════════════════════════════════════════════ */
import {chaveComCpf, competenciaValida, dataValida, competenciaDe} from './integracao-11165.mjs';

/* §6.3 "Medida divergente": tolerância de 2% (TS-27). É o padrão; o
   contrato pode escrever outra. */
export const TOLERANCIA_PADRAO = 0.02;
/* §6.1 "banco de km trimestral": o trimestre é o civil (jan–mar, abr–jun,
   jul–set, out–dez) ou contado do mês de início do contrato. O contrato
   escolhe; não há padrão. */
export const REGRAS_BANCO = Object.freeze(['trimestre_civil', 'inicio_contrato']);

export const NOTA_SEM_PRECO = 'Medição de quantidade (km), sem valor: a composição do Custo Operacional não entra no ROTA-OS.';
export const NOTA_COMPENSACAO = 'Hodômetro com o manifesto do embarque substitui o GPS; a correção, se o registro do GPS aparecer, se compensa na competência seguinte (§6.3, Falha do GPS).';

export class MedicaoInvalida extends Error{
  constructor(campo, esperado){
    super(`${campo}: ${esperado}`);
    this.name = 'MedicaoInvalida';
    this.campo = campo;
  }
}
const invalida = (campo, esperado) => { throw new MedicaoInvalida(campo, esperado) };

/* ─── aritmética ────────────────────────────────────────────────────
   Por dentro, metros inteiros: soma e comparação exatas, sem o ruído do
   ponto flutuante (0,1 + 0,2). A saída volta em km. A tolerância vira
   pontos-base inteiros (2% = 200). */
const BP = 10000;
const metros = km => Math.round(km * 1000);
const emKm = m => m / 1000;
const trecho = (de, ate, a, b) => Math.max(0, Math.min(ate, b) - Math.max(de, a));

/* ─── competências ──────────────────────────────────────────────────── */
const indice = c => { const [a, m] = c.split('-').map(Number); return a * 12 + (m - 1) };
const deIndice = i => `${Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, '0')}`;
export const somarMeses = (c, n) => deIndice(indice(c) + n);
const mesesEntre = (de, ate) => indice(ate) - indice(de);

/* §6.1 "banco de km trimestral … com prazo": em que trimestre cai a
   competência, que mês dele é, e qual o primeiro mês medido (o do
   trimestre ou, se o contrato começou no meio dele, o do contrato). */
export function trimestreDe({competencia, banco_trimestral, inicio_contrato = null}){
  const i = indice(competencia);
  const ancora = banco_trimestral === 'trimestre_civil'
    ? i - (i % 3)
    : i - (mesesEntre(inicio_contrato, competencia) % 3);
  const inicio = deIndice(ancora);
  return {
    inicio, fim: deIndice(ancora + 2), mes: i - ancora + 1, ultimo: i === ancora + 2,
    primeiro_medido: inicio_contrato && indice(inicio_contrato) > ancora ? inicio_contrato : inicio
  };
}

/* ─── parâmetros do contrato ────────────────────────────────────────
   Tudo vem do contrato; o código não traz franquia nenhuma. */
export function validarContrato(c){
  if(!c || typeof c !== 'object' || Array.isArray(c)) invalida('contrato', 'objeto com os parâmetros do contrato');
  const cpf = chaveComCpf(c);
  if(cpf) invalida(`contrato.${cpf}`, 'o ROTA-OS não recebe CPF');
  const f = c.franquia_km_mensal;
  if(typeof f !== 'number' || !Number.isFinite(f) || f <= 0)
    invalida('contrato.franquia_km_mensal', 'km > 0, do contrato (não há franquia padrão)');
  const t = c.tolerancia_gps_hodometro ?? TOLERANCIA_PADRAO;
  if(typeof t !== 'number' || !Number.isFinite(t) || t < 0 || t >= 1 || Math.abs(t * BP - Math.round(t * BP)) > 1e-6)
    invalida('contrato.tolerancia_gps_hodometro', 'fração de 0 a 1 com até quatro casas (0,02 = 2%)');
  if(!REGRAS_BANCO.includes(c.banco_trimestral))
    invalida('contrato.banco_trimestral', "'trimestre_civil' ou 'inicio_contrato'");
  const inicio = c.inicio_contrato ?? null;
  if(inicio !== null && !competenciaValida(inicio)) invalida('contrato.inicio_contrato', 'competência AAAA-MM ou nulo');
  if(c.banco_trimestral === 'inicio_contrato' && inicio === null)
    invalida('contrato.inicio_contrato', "obrigatório quando o banco conta o trimestre do início do contrato");
  return Object.freeze({franquia_km_mensal: f, tolerancia_gps_hodometro: t,
    banco_trimestral: c.banco_trimestral, inicio_contrato: inicio});
}

/* Configuração documentada da API (docs/medicao-contratos.exemplo.json):
   {"bases": {"<base_id>": {…parâmetros, "fonte": "contrato e cláusula"}}}.
   Sem entrada para a base: null (parâmetros a configurar). Na API o início
   do contrato é obrigatório: sem ele, o encadeamento do banco creditaria
   franquia de meses em que não havia contrato. */
export function contratoDaConfiguracao({configuracao, base_id}){
  if(!configuracao || typeof configuracao !== 'object' || !configuracao.bases || typeof configuracao.bases !== 'object')
    invalida('configuracao', 'objeto com "bases"');
  const c = Object.prototype.hasOwnProperty.call(configuracao.bases, base_id) ? configuracao.bases[base_id] : null;
  if(!c) return null;
  const contrato = validarContrato(c);
  if(!contrato.inicio_contrato) invalida(`bases.${base_id}.inicio_contrato`, 'obrigatório na configuração da API');
  const fonte = typeof c.fonte === 'string' && c.fonte.trim() ? c.fonte.trim() : null;
  return {contrato, fonte};
}

/* ─── viagem ────────────────────────────────────────────────────────
   Só os campos da medição saem daqui: o que mais vier na entrada
   (nome, CNS, rota) é descartado e nunca chega à saída. */
const kmOuNulo = (v, campo) => {
  if(v === null || v === undefined) return null;
  if(typeof v !== 'number' || !Number.isFinite(v) || v < 0) invalida(campo, 'km ≥ 0 ou nulo');
  return v;
};
const simNaoOuNulo = (v, campo) => {
  if(v === null || v === undefined) return null;
  if(typeof v !== 'boolean') invalida(campo, 'verdadeiro, falso ou nulo');
  return v;
};

function validarViagem(v, i, {de, ate}){
  const campo = `viagens[${i}]`;
  if(!v || typeof v !== 'object' || Array.isArray(v)) invalida(campo, 'objeto');
  if(typeof v.id !== 'string' || !v.id.trim()) invalida(`${campo}.id`, 'código da viagem (texto não vazio)');
  if(!dataValida(v.data)) invalida(`${campo}.data`, 'data AAAA-MM-DD');
  const c = competenciaDe(v.data);
  if(c < de || c > ate) invalida(`${campo}.data`, de === ate ? `fora da competência ${de}` : `fora de ${de} a ${ate}`);
  const hora = v.hora ?? null;
  if(hora !== null && !(typeof hora === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(hora)))
    invalida(`${campo}.hora`, 'HH:MM ou nulo');
  return {
    id: v.id.trim(), data: v.data, hora,
    km_gps: kmOuNulo(v.km_gps, `${campo}.km_gps`),
    km_hodometro: kmOuNulo(v.km_hodometro, `${campo}.km_hodometro`),
    falha_gps: simNaoOuNulo(v.falha_gps, `${campo}.falha_gps`),
    os_excedente: simNaoOuNulo(v.os_excedente, `${campo}.os_excedente`),
    embarque_registrado: simNaoOuNulo(v.embarque_registrado, `${campo}.embarque_registrado`)
  };
}

function validarViagens(viagens, janela){
  if(!Array.isArray(viagens)) invalida('viagens', 'lista (vazia se não houve viagem)');
  const lista = viagens.map((v, i) => validarViagem(v, i, janela));
  const vistos = new Set();
  lista.forEach((v, i) => {
    if(vistos.has(v.id)) invalida(`viagens[${i}].id`, `código repetido (${v.id})`);
    vistos.add(v.id);
  });
  return lista;
}

/* ─── km de uma viagem ──────────────────────────────────────────────
   §6.3 "Onde começa o km": o km é o do ciclo base → base registrado pelo
   GPS do ROTA-OS. §6.3 "Falta e cancelamento": no excedente, só o km
   realizado; a medição nunca usa o km previsto. */
function medir(v, toleranciaBp){
  /* §6.3 "Medida divergente": o GPS é a fonte; o hodômetro, a conferência. */
  if(v.falha_gps !== true && v.km_gps !== null){
    const g = metros(v.km_gps);
    const h = v.km_hodometro === null ? null : metros(v.km_hodometro);
    let divergencia = null;
    if(h !== null){
      /* §6.3 "Medida divergente": acima da tolerância (base: o GPS, que é a
         fonte), a viagem vai à lista para justificar; o km continua o do GPS. */
      const d = Math.abs(g - h);
      divergencia = {
        diferenca_m: d,
        percentual: g === 0 ? (d > 0 ? null : 0) : Math.round(d * BP / g) / 100,
        acima: g === 0 ? d > 0 : d * BP > toleranciaBp * g
      };
    }
    return {fonte: 'gps', m: g, divergencia, substituicao: null, a_conferir: null};
  }
  /* §6.3 "Falha do GPS": hodômetro + manifesto com o embarque registrado
     substituem; compensação na competência seguinte. GPS sem registro conta
     como falha. */
  const substituicao = v.falha_gps === true ? 'falha_gps' : 'gps_sem_registro';
  if(v.km_hodometro !== null && v.embarque_registrado === true)
    return {fonte: 'hodometro', m: metros(v.km_hodometro), divergencia: null, substituicao, a_conferir: null};
  /* Sem as duas provas, o km fica a conferir: fora do apurado e nunca zero. */
  const a_conferir = v.km_hodometro === null ? 'sem_gps_e_sem_hodometro'
    : v.embarque_registrado === false ? 'hodometro_sem_embarque_registrado' : 'embarque_a_conferir';
  return {fonte: null, m: null, divergencia: null, substituicao, a_conferir};
}

/* Ordem cronológica: data, hora (sem hora vem antes no dia) e código. */
const chaveOrdem = x => `${x.v.data} ${x.v.hora ?? ''}`;
const cronologica = (a, b) => chaveOrdem(a) < chaveOrdem(b) ? -1 : chaveOrdem(a) > chaveOrdem(b) ? 1
  : a.v.id < b.v.id ? -1 : a.v.id > b.v.id ? 1 : 0;

/* ─── medição da competência ────────────────────────────────────────
   Entrada:
     competencia          'AAAA-MM'
     contrato             {franquia_km_mensal, tolerancia_gps_hodometro?,
                           banco_trimestral, inicio_contrato?}
     viagens              [{id, data, hora?, km_gps, km_hodometro,
                            falha_gps, os_excedente, embarque_registrado}]
     saldo_anterior_km    saldo do banco trazido do mês anterior (≥ 0)
   O km de cada viagem entra, em ordem cronológica, primeiro na franquia,
   depois no banco e só então no excedente. */
export function medicaoContratual({competencia, contrato, viagens, saldo_anterior_km = 0} = {}){
  const cpf = chaveComCpf({contrato, viagens});
  if(cpf) invalida(cpf, 'o ROTA-OS não recebe CPF (§6.3, Dado pessoal: medição por código da viagem)');
  if(!competenciaValida(competencia)) invalida('competencia', 'AAAA-MM');
  const k = validarContrato(contrato);
  if(k.inicio_contrato && competencia < k.inicio_contrato)
    invalida('competencia', `anterior ao início do contrato (${k.inicio_contrato})`);
  const lista = validarViagens(viagens, {de: competencia, ate: competencia});
  const tri = trimestreDe({competencia, ...k});

  /* §6.1 banco "com prazo": o saldo nasce da franquia não usada nos meses
     anteriores do mesmo trimestre. Na primeira competência do trimestre (ou
     do contrato) não há saldo: o anterior expirou na virada. */
  if(typeof saldo_anterior_km !== 'number' || !Number.isFinite(saldo_anterior_km) || saldo_anterior_km < 0)
    invalida('saldo_anterior_km', 'km ≥ 0');
  const F = metros(k.franquia_km_mensal), S = metros(saldo_anterior_km);
  const mesesAntes = mesesEntre(tri.primeiro_medido, competencia);
  if(S > mesesAntes * F)
    invalida('saldo_anterior_km', mesesAntes === 0
      ? 'a primeira competência do trimestre (ou do contrato) começa sem saldo: o anterior expirou na virada (§6.1)'
      : `no máximo ${emKm(mesesAntes * F)} km, a franquia dos meses anteriores do trimestre`);

  const toleranciaBp = Math.round(k.tolerancia_gps_hodometro * BP);
  const medidas = lista.map(v => ({v, ...medir(v, toleranciaBp),
    franquia: 0, banco: 0, autorizado: 0, sem_os: 0}));

  /* §6.1 "Franquia mensal de km" e banco trimestral; §6.1 "Km excedente: só
     o km acima da franquia, autorizado por OS no ROTA-OS"; §6.3 "Desvio e
     percurso interno": quem autoriza é a OS do ROTA-OS. Sem OS, glosa. */
  let acumulado = 0;
  for(const x of medidas.filter(x => x.m !== null).sort(cronologica)){
    const de = acumulado, ate = acumulado + x.m;
    x.franquia = trecho(de, ate, 0, F);
    x.banco = trecho(de, ate, F, F + S);
    const excedente = trecho(de, ate, F + S, Infinity);
    x.autorizado = x.v.os_excedente === true ? excedente : 0;
    x.sem_os = excedente - x.autorizado;
    acumulado = ate;
  }

  const soma = (f, l = medidas) => l.reduce((a, x) => a + f(x), 0);
  const A = soma(x => x.m ?? 0);
  const dentro = soma(x => x.franquia), uso = soma(x => x.banco);
  const autorizado = soma(x => x.autorizado), semOs = soma(x => x.sem_os);
  const gps = soma(x => x.fonte === 'gps' ? x.m : 0), hod = soma(x => x.fonte === 'hodometro' ? x.m : 0);

  /* §6.1: o saldo do banco expira ao fim do trimestre e não vira crédito em
     dinheiro: no último mês, o que sobra expira; nos outros, segue. */
  const credito = Math.max(F - A, 0);
  const saldoFinal = S + credito - uso;
  const expira = tri.ultimo ? saldoFinal : 0;

  const ordem = [...medidas].sort(cronologica);
  const excedidas = ordem.filter(x => x.autorizado || x.sem_os);
  return {
    competencia,
    unidade: 'km',
    nota: NOTA_SEM_PRECO,
    parametros: {
      franquia_km_mensal: emKm(F), tolerancia_gps_hodometro: k.tolerancia_gps_hodometro,
      banco_trimestral: k.banco_trimestral, inicio_contrato: k.inicio_contrato,
      trimestre: {inicio: tri.inicio, fim: tri.fim, mes: tri.mes, primeiro_medido: tri.primeiro_medido}
    },
    km_apurado: emKm(A),
    franquia: {km_mensal: emKm(F), dentro_km: emKm(dentro), nao_usada_km: emKm(credito)},
    banco: {
      saldo_anterior_km: emKm(S), credito_km: emKm(credito), uso_km: emKm(uso),
      saldo_final_km: emKm(saldoFinal), segue_para_proxima_km: emKm(saldoFinal - expira),
      expira_na_virada_km: emKm(expira), expira_ao_fim_de: tri.fim, vira_dinheiro: false
    },
    excedente: {
      total_km: emKm(autorizado + semOs),
      autorizado_km: emKm(autorizado),
      sem_os_km: emKm(semOs),
      autorizadas: excedidas.filter(x => x.autorizado).map(x => ({viagem: x.v.id, data: x.v.data, km: emKm(x.autorizado)})),
      sem_os: excedidas.filter(x => x.sem_os).map(x => ({viagem: x.v.id, data: x.v.data, km: emKm(x.sem_os),
        os: x.v.os_excedente === false ? 'sem_os' : 'os_nao_registrada'}))
    },
    divergencias: ordem.filter(x => x.divergencia?.acima).map(x => ({
      viagem: x.v.id, data: x.v.data, km_gps: x.v.km_gps, km_hodometro: x.v.km_hodometro,
      diferenca_km: emKm(x.divergencia.diferenca_m), percentual: x.divergencia.percentual,
      tolerancia_percentual: toleranciaBp / 100
    })),
    substituidas_por_hodometro: ordem.filter(x => x.fonte === 'hodometro').map(x => ({
      viagem: x.v.id, data: x.v.data, km_hodometro: x.v.km_hodometro, motivo: x.substituicao, nota: NOTA_COMPENSACAO
    })),
    a_conferir: ordem.filter(x => x.a_conferir).map(x => ({viagem: x.v.id, data: x.v.data, motivo: x.a_conferir,
      gps: x.substituicao, nota: 'fora do apurado até a conferência; conferida, se compensa na competência seguinte (§6.3, Falha do GPS)'})),
    sem_conferencia_hodometro: ordem.filter(x => x.fonte === 'gps' && x.v.km_hodometro === null).map(x => x.v.id),
    viagens: ordem.map(x => ({
      viagem: x.v.id, data: x.v.data, hora: x.v.hora,
      fonte: x.fonte, km_apurado: x.m === null ? null : emKm(x.m),
      km_gps: x.v.km_gps, km_hodometro: x.v.km_hodometro,
      divergencia: x.divergencia ? {percentual: x.divergencia.percentual, acima_da_tolerancia: x.divergencia.acima} : null,
      substituida_por_hodometro: x.fonte === 'hodometro' ? x.substituicao : null,
      a_conferir: x.a_conferir,
      os_excedente: x.v.os_excedente,
      alocacao: {franquia_km: emKm(x.franquia), banco_km: emKm(x.banco),
        excedente_autorizado_km: emKm(x.autorizado), excedente_sem_os_km: emKm(x.sem_os)}
    })),
    totais: {
      viagens: medidas.length,
      viagens_medidas: medidas.filter(x => x.m !== null).length,
      viagens_a_conferir: medidas.filter(x => x.m === null).length,
      viagens_substituidas_por_hodometro: medidas.filter(x => x.fonte === 'hodometro').length,
      viagens_com_divergencia: medidas.filter(x => x.divergencia?.acima).length,
      km_gps: emKm(gps), km_hodometro_substituto: emKm(hod), km_apurado: emKm(A),
      dentro_franquia_km: emKm(dentro), uso_banco_km: emKm(uso),
      excedente_autorizado_km: emKm(autorizado), excedente_sem_os_km: emKm(semOs),
      /* As contas que o fiscal refaz. Cada lado sai de uma soma diferente. */
      conferencias: {
        apurado_igual_gps_mais_hodometro_substituto: A === gps + hod,
        apurado_igual_franquia_banco_excedente: A === dentro + uso + autorizado + semOs,
        franquia_usada_igual_menor_entre_apurado_e_franquia: dentro === Math.min(A, F),
        saldo_final_igual_anterior_mais_credito_menos_uso: saldoFinal === S + (F - dentro) - uso,
        uso_do_banco_ate_o_saldo_anterior: uso <= S
      }
    }
  };
}

/* ─── medição encadeada no trimestre ────────────────────────────────
   O saldo trazido não precisa ser digitado: sai das viagens dos meses
   anteriores do trimestre, medidas pela mesma regra, desde o primeiro mês
   medido (o do trimestre ou o do contrato). `viagens` cobre essa janela. */
export function medicaoDaCompetencia({competencia, contrato, viagens} = {}){
  const cpf = chaveComCpf({contrato, viagens});
  if(cpf) invalida(cpf, 'o ROTA-OS não recebe CPF (§6.3, Dado pessoal: medição por código da viagem)');
  if(!competenciaValida(competencia)) invalida('competencia', 'AAAA-MM');
  const k = validarContrato(contrato);
  if(k.inicio_contrato && competencia < k.inicio_contrato)
    invalida('competencia', `anterior ao início do contrato (${k.inicio_contrato})`);
  const tri = trimestreDe({competencia, ...k});
  validarViagens(viagens, {de: tri.primeiro_medido, ate: competencia});

  const encadeamento = [];
  let saldo = 0, medicao = null;
  for(let c = tri.primeiro_medido; c <= competencia; c = somarMeses(c, 1)){
    medicao = medicaoContratual({competencia: c, contrato: k, saldo_anterior_km: saldo,
      viagens: viagens.filter(v => competenciaDe(v.data) === c)});
    encadeamento.push({competencia: c, km_apurado: medicao.km_apurado, credito_km: medicao.banco.credito_km,
      uso_km: medicao.banco.uso_km, saldo_final_km: medicao.banco.saldo_final_km,
      segue_para_proxima_km: medicao.banco.segue_para_proxima_km});
    saldo = medicao.banco.segue_para_proxima_km;
  }
  return {...medicao, encadeamento};
}
