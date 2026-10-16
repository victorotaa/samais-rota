/* ═══════════════════════════════════════════════════════════════════
   ROTA · API.

   `node:http` puro: sem framework, sem middleware de terceiro. A
   superfície é pequena de propósito — um endpoint por agregado, e a
   carga inteira do console num só GET, porque é assim que a tela usa.

   Três invariantes, e nenhuma delas mora num handler:

     1. quem filtra por base é o banco (api/db.mjs);
     2. toda escrita audita na mesma transação;
     3. nada entra sem sessão, exceto o próprio login e a saúde.

   Subir:  DATABASE_URL=postgres://... node api/servidor.mjs
   ═══════════════════════════════════════════════════════════════════ */
import http from 'node:http';
import {
  conferirSenha, precisaRehash, hashSenha, conferirTotp, conferirRecuperacao,
  novaSessao, hashToken, bloqueadoAte
} from './auth.mjs';
import {abrir, fechar, semSessao, comGestor, auditar, resumir, conferirConexao} from './db.mjs';
import {elegibilidade11165} from '../regras/portaria-11165.mjs';
import {
  chaveComCpf, competenciaValida, dataValida, entradaElegibilidade, farolDaBase,
  preRemessaBPAI, csvPreBPAI, conformidade, diasEntre
} from './integracao-11165.mjs';
import {hojeBrasilia} from './relogio.mjs';

const LIMITE_CORPO = 256 * 1024;     // manifesto de dia cheio cabe folgado

/* ─── mapeamento: banco → vocabulário do console ───────────────────
   O console fala 'tratKey', 'dest', 'lot', 'hod'. O banco fala
   'tratamento', 'destino_id', 'lotacao', 'hodometro'. A tradução vive
   aqui, num lugar só, e é o que permite trocar a fonte do front sem
   reescrever tela nenhuma.                                           */

/* `date` já chega como texto AAAA-MM-DD (api/db.mjs): nada de
   toISOString(), que troca o dia conforme o fuso da máquina. */
const iso = d => d;

/* `tipo` é rótulo de tela pela km da base ao destino; NÃO decide
   elegibilidade (essa sai de `elegibilidade`, de município a município). */
function paraDestino(r){
  return {nome: r.nome, km: Number(r.km), tipo: Number(r.km) > 50 ? 'Intermunicipal >50km' : 'Local',
    ibge: r.municipio_ibge ?? null, uf: r.uf ?? null, cnes: r.cnes ?? null,
    habilitacaoConferida: r.habilitacao_conferida ?? null, habilitacaoCodigo: r.habilitacao_codigo ?? null,
    modalidades: r.modalidades || []};
}

/* A elegibilidade do paciente vem do MÓDULO (fonte única), com o serviço
   do destino dele, a distância de município a município e o próximo
   agendamento a partir de hoje. Sem agendamento à frente: pendente. */
function paraPaciente(r){
  return {
    id: r.id, nome: r.nome, cns: r.cns, nasc: iso(r.nascimento), mun: r.municipio,
    ponto: r.ponto_embarque, tratKey: r.tratamento, esp: r.especialidade || undefined,
    dest: r.destino_id, rec: r.recorrencia || [], acomp: r.acompanhante,
    necKey: r.necessidade,
    aut: r.processo_ref ? {proc: r.processo_ref, val: iso(r.validade), origem: r.origem} : null,
    munIbge: r.municipio_residencia_ibge ?? null, ufRes: r.uf_residencia ?? null,
    elegibilidade: elegibilidade11165(entradaElegibilidade({
      tratamento: r.tratamento, residencia_ibge: r.municipio_residencia_ibge, residencia_uf: r.uf_residencia,
      servico_ibge: r.servico_ibge, servico_uf: r.servico_uf, habilitacao_conferida: r.habilitacao_conferida,
      distancia_km: r.distancia_km, agendamento_confirmado: r.ag_confirmado})),
    proxAgendamento: r.ag_data ? {data: r.ag_data, confirmado: r.ag_confirmado, etapa: r.ag_etapa} : null
  };
}

function paraVeiculo(r, portaria){
  return {
    id: r.identificacao, uuid: r.id, placa: r.placa, classe: r.classe, tipo: r.descricao,
    lot: r.lotacao, hod: r.hodometro, revCada: r.rev_intervalo_km, proxRev: r.prox_rev_km,
    mot: r.condutor, assist: r.assistente || undefined,
    cnes: r.cnes_num, cnesPrazo: r.cnes_prazo ? iso(r.cnes_prazo) : undefined,
    origem: r.origem || undefined,
    doadoMs: r.doado_ms ?? null, termoDoacao: r.termo_doacao_ref ?? null,
    finalidadeDoacao: r.finalidade_doacao ?? null, dataRecebimento: r.data_recebimento ?? null,
    prorrogacao: !!r.prorrogacao, cnesEstabelecimento: r.cnes_estabelecimento ?? null,
    cnesInscritoEm: r.cnes_inscrito_em ?? null,
    primeiraViagemConcluida: r.primeira_viagem_efetiva ?? null,
    primeiraViagemFonte: r.primeira_viagem_concluida ? 'registrada' : r.primeira_viagem_efetiva ? 'primeira_baixa' : null,
    emplacadoEm: r.emplacado_em ?? null, disponibilidade12m: r.disponibilidade_12m ?? null, laudo: r.laudo ?? null,
    ...(portaria ? {portaria} : {})
  };
}

function paraPactuacao(r){
  return {deliberacaoCib: r?.deliberacao_cib ?? null, deliberacaoCibData: r?.deliberacao_cib_data ?? null,
    estruturaGestao: r?.estrutura_gestao_registrada ?? null, municipiosAbrangidos: r?.municipios_abrangidos || [],
    inicioIncentivo: r?.inicio_incentivo ? r.inicio_incentivo.slice(0, 7) : null};
}
/* a mesma pactuação no vocabulário do módulo */
const pactuacaoInterna = r => r ? {...r, inicio_incentivo: r.inicio_incentivo ? r.inicio_incentivo.slice(0, 7) : null} : null;

/* ─── leituras compartilhadas ──────────────────────────────────────
   Arrays de enum e de char voltam como texto cru no driver: o cast
   para text[] fica na consulta.                                      */
const SQL_DESTINOS = `select id, nome, km, municipio_ibge, uf, cnes, habilitacao_conferida, habilitacao_codigo,
                             modalidades::text[] as modalidades from destinos`;

async function lerPacientes(cli, hoje, id = null){
  const {rows} = await cli.query(
    `select p.*, a.processo_ref, a.validade, a.origem,
            d.municipio_ibge as servico_ibge, d.uf as servico_uf, d.habilitacao_conferida,
            dm.km as distancia_km, ag.data as ag_data, ag.confirmado as ag_confirmado, ag.etapa as ag_etapa
       from pacientes p
       join destinos d on d.id = p.destino_id
       left join lateral (
         select processo_ref, validade, origem from autorizacoes
          where paciente_id = p.id order by validade desc limit 1) a on true
       left join distancias_municipais dm
              on dm.base_id = p.base_id and dm.origem_ibge = p.municipio_residencia_ibge
             and dm.destino_ibge = d.municipio_ibge
       left join lateral (
         select data, confirmado, etapa from agendamentos
          where paciente_id = p.id and destino_id = p.destino_id and data >= $1::date
          order by data limit 1) ag on true
      where ($2::uuid is null and p.ativo) or p.id = $2::uuid
      order by p.nome`, [hoje, id]);
  return rows;
}

/* A primeira viagem concluída (art. 10 §3º) é a registrada ou, sem ela,
   a primeira baixa do veículo a partir do recebimento. */
async function lerVeiculos(cli, identificacao = null){
  const {rows} = await cli.query(
    `select v.*, coalesce(v.primeira_viagem_concluida,
              (select min(b.data) from baixas b join viagens vi on vi.id = b.viagem_id
                where vi.veiculo_id = v.id
                  and (v.data_recebimento is null or b.data >= v.data_recebimento))) as primeira_viagem_efetiva
       from veiculos v
      where ($1::text is null and v.ativo) or v.identificacao = $1
      order by v.identificacao`, [identificacao]);
  return rows;
}

async function lerPactuacao(cli){
  const {rows} = await cli.query(
    `select deliberacao_cib, deliberacao_cib_data, estrutura_gestao_registrada,
            municipios_abrangidos::text[] as municipios_abrangidos, inicio_incentivo from base_pactuacao`);
  return rows[0] || null;
}

const paraConformidade = v => ({...v, primeira_viagem_concluida: v.primeira_viagem_efetiva});

/* ─── carga do console ─────────────────────────────────────────────
   Nenhuma consulta traz `where base_id` — é a RLS que recorta. Uma
   consulta a mais aqui não vaza nada; uma consulta esquecida também
   não.                                                               */
async function carregar(cli, hoje){
  /* uma consulta de cada vez: é UMA transação, e portanto UMA conexão.
     Disparar em paralelo no mesmo cliente serializa do mesmo jeito, só
     que por baixo e com aviso de depreciação do driver. */
  const base = await cli.query('select custo_km, custo_km_fonte, municipio, uf, janela_suspensao_dias from bases');
  const destinos = await cli.query(SQL_DESTINOS + ' order by km');
  const pacientes = await lerPacientes(cli, hoje);
  const veiculos = await lerVeiculos(cli);
  const pactuacao = await lerPactuacao(cli);
  const conf = conformidade({hoje, pactuacao: pactuacaoInterna(pactuacao), veiculos: veiculos.map(paraConformidade)});
  const abastecimentos = await cli.query(
    `select v.identificacao as vid, a.data, a.litros, a.km_desde_ultimo as km, a.valor
       from abastecimentos a join veiculos v on v.id = a.veiculo_id
      order by a.data`);
  const baixas = await cli.query('select viagem_id, data, km_rodado, litros, diarias from baixas');

  const cfg = base.rows[0] || {};
  const lancamentos = {};
  for(const b of baixas.rows){
    lancamentos[b.viagem_id] = {
      concluida: true, km: Number(b.km_rodado), litros: Number(b.litros),
      diarias: b.diarias, data: iso(b.data)
    };
  }

  return {
    destinos: Object.fromEntries(destinos.rows.map(r => [r.id, paraDestino(r)])),
    pacientes: pacientes.map(paraPaciente),
    veiculos: veiculos.map((r, i) => paraVeiculo(r, portariaDoVeiculo(conf.veiculos[i]))),
    abastecimentos: abastecimentos.rows.map(r => ({
      vid: r.vid, data: iso(r.data), litros: Number(r.litros), km: r.km, valor: Number(r.valor)})),
    lancamentos,
    config: {
      custoKmVariavel: Number(cfg.custo_km ?? 0.9),
      custoKmFonte: cfg.custo_km_fonte || 'parâmetro da base · definido no contrato',
      municipio: cfg.municipio, uf: cfg.uf,
      /* operacional: o farol de conformidade é por competência (/api/farol-producao) */
      janelaSuspensaoDias: cfg.janela_suspensao_dias,
      pactuacao: paraPactuacao(pactuacao),
      baseApta: conf.base_apta,
      hoje
    }
  };
}

const portariaDoVeiculo = c => ({incentivo: c.incentivo, cnes: c.cnes, operacao: c.operacao, renovacao: c.renovacao});

/* ─── rotas ────────────────────────────────────────────────────────  */

const rotas = [];
const rota = (metodo, padrao, aberta, fn) => rotas.push({metodo, padrao, aberta, fn});

rota('GET', /^\/api\/saude$/, true, async () => ({ok: true}));

/* Login. O caminho é sempre o mesmo, dê certo ou não: e-mail
   inexistente, senha errada e segundo fator errado consomem o mesmo
   trabalho e devolvem a mesma mensagem. Distinguir aqui é entregar
   lista de gestores a quem tentar. */
rota('POST', /^\/api\/sessao$/, true, async (ctx) => {
  const {email, senha, codigo, recuperacao} = ctx.corpo || {};
  const negar = {status: 401, corpo: {erro: 'credenciais inválidas'}};
  if(!email || !senha) return negar;

  return semSessao(async (cli) => {
    const {rows} = await cli.query('select * from auth_iniciar($1)', [email]);
    const g = rows[0];

    if(!g){
      await cli.query('select auth_falhou($1,$2,null,$3,$4)',
        [email, 'inexistente', ctx.ip, ctx.agente]);
      return negar;
    }
    if(g.bloqueado_ate && new Date(g.bloqueado_ate) > new Date()){
      await cli.query('select auth_falhou($1,$2,$3,$4,$5)',
        [email, 'bloqueado', g.bloqueado_ate, ctx.ip, ctx.agente]);
      return {status: 429, corpo: {erro: 'muitas tentativas', ate: g.bloqueado_ate}};
    }

    const falhar = async (motivo) => {
      const ate = bloqueadoAte(g.falhas + 1, Date.now());
      await cli.query('select auth_falhou($1,$2,$3,$4,$5)', [email, motivo, ate, ctx.ip, ctx.agente]);
      return negar;
    };

    if(!g.senha_hash || !conferirSenha(senha, g.senha_hash)) return falhar('senha');

    let passo = null, restantes = null;
    if(g.totp_confirmado){
      if(recuperacao){
        const r = conferirRecuperacao(recuperacao, g.recuperacao_hashes || []);
        if(!r.ok) return falhar('totp');
        restantes = r.restantes;
      }else{
        const r = conferirTotp(g.totp_segredo, codigo, {ultimoPasso: g.totp_ultimo_passo});
        if(!r.ok) return falhar(r.motivo === 'reuso' ? 'reuso' : 'totp');
        passo = r.passo;
      }
    }

    const s = novaSessao();
    await cli.query('select auth_entrou($1,$2,$3,$4,$5,$6,$7)',
      [g.gestor_id, s.hash, s.expiraEm, passo, restantes, ctx.ip, ctx.agente]);

    /* custo do scrypt subiu desde o último acesso: reescreve agora, que
       é a única hora em que a senha em claro está à mão. */
    if(precisaRehash(g.senha_hash))
      await cli.query('select auth_trocar_senha($1,$2,$3)', [g.gestor_id, hashSenha(senha), s.hash]);

    return {corpo: {token: s.token, expiraEm: s.expiraEm,
      gestor: {id: g.gestor_id, nome: g.nome}, base: g.base_id,
      segundoFator: g.totp_confirmado}};
  });
});

rota('DELETE', /^\/api\/sessao$/, false, async (ctx) => {
  await semSessao(cli => cli.query('select auth_sair($1)', [ctx.tokenHash]));
  return {corpo: {ok: true}};
});

rota('GET', /^\/api\/carregar$/, false, async (ctx) => {
  const hoje = hojeDe(ctx);
  return {corpo: await comGestor(ctx.sessao, cli => carregar(cli, hoje))};
});

/* Paciente: cria ou atualiza, com a autorização junto — no console os
   dois são uma tela só, e separar em dois endpoints deixaria paciente
   sem autorização se o segundo falhasse. */
rota('POST', /^\/api\/pacientes$/, false, async (ctx) => {
  const p = ctx.corpo || {};
  if(!p.nome || !p.cns || !p.dest || !p.tratKey)
    return {status: 422, corpo: {erro: 'nome, cns, dest e tratKey são obrigatórios'}};
  /* município de residência (IBGE) e UF: a origem da distância da
     Portaria 11.165. Ausente fica nulo — elegibilidade pendente. */
  const munIbge = p.munIbge === undefined ? null : validar('munIbge', 'ibge', p.munIbge);
  const ufRes = p.ufRes === undefined ? null : validar('ufRes', 'ufOuNulo', p.ufRes);

  return comGestor(ctx.sessao, async (cli, s) => {
    const vals = [s.baseId, p.nome, p.cns, p.nasc, p.mun, p.ponto, p.tratKey,
                  p.esp || null, p.dest, p.rec || [], !!p.acomp, p.necKey || 'nenhuma', munIbge, ufRes];
    let r;
    if(p.id){
      r = await cli.query(
        `update pacientes set nome=$2, cns=$3, nascimento=$4, municipio=$5, ponto_embarque=$6,
                tratamento=$7, especialidade=$8, destino_id=$9, recorrencia=$10,
                acompanhante=$11, necessidade=$12, municipio_residencia_ibge=$13, uf_residencia=$14
           where id=$1 returning *`, [p.id, ...vals.slice(1)]);
      if(!r.rowCount) return {status: 404, corpo: {erro: 'paciente não encontrado nesta base'}};
    }else{
      r = await cli.query(
        `insert into pacientes (base_id,nome,cns,nascimento,municipio,ponto_embarque,
            tratamento,especialidade,destino_id,recorrencia,acompanhante,necessidade,
            municipio_residencia_ibge,uf_residencia)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *`, vals);
    }
    const salvo = r.rows[0];

    if(p.aut && p.aut.proc && p.aut.val){
      await cli.query(
        `insert into autorizacoes (base_id,paciente_id,origem,processo_ref,validade)
         values ($1,$2,$3,$4,$5)`,
        [s.baseId, salvo.id, p.aut.origem || 'tfd', p.aut.proc, p.aut.val]);
    }

    await auditar(cli, {...s, acao: p.id ? 'atualizacao' : 'cadastro',
      entidade: 'paciente', entidadeId: salvo.id, payload: resumir(p)});
    const rows = await lerPacientes(cli, hojeBrasilia(), salvo.id);
    return {corpo: paraPaciente(rows[0])};
  });
});

rota('POST', /^\/api\/abastecimentos$/, false, async (ctx) => {
  const a = ctx.corpo || {};
  if(!a.vid || !a.data || !(a.litros > 0))
    return {status: 422, corpo: {erro: 'vid, data e litros são obrigatórios'}};

  return comGestor(ctx.sessao, async (cli, s) => {
    const v = await cli.query('select id from veiculos where identificacao = $1', [a.vid]);
    if(!v.rowCount) return {status: 404, corpo: {erro: 'veículo não encontrado nesta base'}};
    const {rows} = await cli.query(
      `insert into abastecimentos (base_id, veiculo_id, data, litros, km_desde_ultimo, valor, gestor_id)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [s.baseId, v.rows[0].id, a.data, a.litros, a.km || 0, a.valor || 0, s.gestorId]);
    await auditar(cli, {...s, acao: 'abastecimento', entidade: 'abastecimento',
      entidadeId: rows[0].id, payload: {vid: a.vid, litros: a.litros, km: a.km, valor: a.valor}});
    return {corpo: {vid: a.vid, data: iso(rows[0].data), litros: Number(rows[0].litros),
      km: rows[0].km_desde_ultimo, valor: Number(rows[0].valor), id: rows[0].id}};
  });
});

/* Baixa: km, litros, diárias e a lista de quem de fato embarcou. É a
   escrita que sustenta a comprovação — por isso o embarque vem junto,
   na mesma transação, e não numa chamada seguinte que pode não vir. */
rota('POST', /^\/api\/viagens\/([0-9a-f-]{36})\/baixa$/, false, async (ctx) => {
  const viagemId = ctx.params[0];
  const b = ctx.corpo || {};
  if(!(b.km > 0)) return {status: 422, corpo: {erro: 'km rodado é obrigatório'}};

  return comGestor(ctx.sessao, async (cli, s) => {
    const v = await cli.query('select id, data from viagens where id = $1', [viagemId]);
    if(!v.rowCount) return {status: 404, corpo: {erro: 'viagem não encontrada nesta base'}};

    const {rows} = await cli.query(
      `insert into baixas (viagem_id, base_id, data, km_rodado, litros, diarias, gestor_id)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (viagem_id) do update set data = excluded.data, km_rodado = excluded.km_rodado,
            litros = excluded.litros, diarias = excluded.diarias, gestor_id = excluded.gestor_id
       returning *`,
      [viagemId, s.baseId, b.data || v.rows[0].data, b.km, b.litros || 0, b.diarias || 0, s.gestorId]);

    for(const e of (b.embarques || [])){
      await cli.query(
        `insert into embarques (viagem_id, paciente_id, presente_ida, presente_volta, falta_motivo)
         values ($1,$2,$3,$4,$5)
         on conflict (viagem_id, paciente_id) do update set presente_ida = excluded.presente_ida,
              presente_volta = excluded.presente_volta, falta_motivo = excluded.falta_motivo`,
        [viagemId, e.paciente, !!e.ida, !!e.volta, e.motivo || null]);
    }
    await cli.query(`update viagens set status = 'concluida' where id = $1`, [viagemId]);
    await auditar(cli, {...s, acao: 'baixa', entidade: 'viagem', entidadeId: viagemId,
      payload: {km: b.km, litros: b.litros, diarias: b.diarias, embarques: (b.embarques || []).length}});

    const oc = await cli.query(
      `select lotacao, assentos_programados::int as assentos_programados,
              assentos_realizados::int as assentos_realizados
         from ocupacao_viagem where viagem_id = $1`, [viagemId]);
    return {corpo: {concluida: true, km: Number(rows[0].km_rodado), litros: Number(rows[0].litros),
      diarias: rows[0].diarias, data: iso(rows[0].data), ocupacao: oc.rows[0] || null}};
  });
});

/* Programação da semana: substitui as viagens programadas do período.
   Nunca toca em viagem que já tem baixa — comprovação registrada não se
   reescreve por reprogramação. */
rota('PUT', /^\/api\/programacao$/, false, async (ctx) => {
  const {de, ate, viagens} = ctx.corpo || {};
  if(!de || !ate || !Array.isArray(viagens))
    return {status: 422, corpo: {erro: 'de, ate e viagens são obrigatórios'}};

  return comGestor(ctx.sessao, async (cli, s) => {
    const apagadas = await cli.query(
      `delete from viagens where data between $1 and $2 and status = 'programada'
         and not exists (select 1 from baixas b where b.viagem_id = viagens.id)
       returning id`, [de, ate]);

    const criadas = [];
    for(const v of viagens){
      const {rows} = await cli.query(
        `insert into viagens (base_id, chave, sequencia, data, hora, destino_id, veiculo_id, km_previsto)
         values ($1,$2,$3,$4,$5,$6,(select id from veiculos where identificacao = $7),$8)
         on conflict (base_id, chave, sequencia) do update set hora = excluded.hora,
              km_previsto = excluded.km_previsto
         returning id`,
        [s.baseId, v.chave, v.sequencia || 1, v.data, v.hora, v.destino, v.veiculo, v.km]);
      const id = rows[0].id;
      for(const p of (v.pacientes || []))
        await cli.query(
          `insert into viagem_pacientes (viagem_id, paciente_id, acompanhante) values ($1,$2,$3)
           on conflict (viagem_id, paciente_id) do update set acompanhante = excluded.acompanhante`,
          [id, p.id || p, !!p.acomp]);
      criadas.push({chave: v.chave, sequencia: v.sequencia || 1, id});
    }
    await auditar(cli, {...s, acao: 'programacao', entidade: 'periodo', entidadeId: `${de}..${ate}`,
      payload: {apagadas: apagadas.rowCount, criadas: criadas.length}});
    return {corpo: {viagens: criadas}};
  });
});

/* Emissão de documento: o número é do banco, sequencial por base e por
   tipo, e a unicidade impede que dois gestores emitam o mesmo. */
rota('POST', /^\/api\/documentos$/, false, async (ctx) => {
  const {tipo, viagem, competencia} = ctx.corpo || {};
  if(!['manifesto','folha_embarque','relatorio_mensal'].includes(tipo))
    return {status: 422, corpo: {erro: 'tipo inválido'}};

  return comGestor(ctx.sessao, async (cli, s) => {
    const {rows: n} = await cli.query('select proximo_documento($1,$2) as num', [s.baseId, tipo]);
    const {rows} = await cli.query(
      `insert into documentos (base_id, tipo, num_sequencial, viagem_id, competencia, emitido_por)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [s.baseId, tipo, n[0].num, viagem || null, competencia || null, s.gestorId]);
    await auditar(cli, {...s, acao: 'emissao', entidade: 'documento', entidadeId: rows[0].id,
      payload: {tipo, num: rows[0].num_sequencial, viagem: viagem || null}});
    return {corpo: {id: rows[0].id, tipo, numero: rows[0].num_sequencial,
      emitidoEm: rows[0].emitido_em}};
  });
});

/* Relatório mensal: sai da view de deslocamentos, que conta por
   paciente e não por viagem. */
rota('GET', /^\/api\/relatorio\/(\d{4})-(\d{2})$/, false, async (ctx) => {
  const [ano, mes] = ctx.params;
  return {corpo: await comGestor(ctx.sessao, async (cli) => {
    const {rows} = await cli.query(
      `select (count(*) filter (where elegivel))::int as elegiveis,
              (count(*) filter (where elegivel and comprovado))::int as comprovados,
              count(*)::int as deslocamentos,
              (count(distinct viagem_id))::int as viagens
         from deslocamentos
        where date_trunc('month', data) = make_date($1,$2,1)`, [+ano, +mes]);
    return {competencia: `${ano}-${mes}`, ...rows[0]};
  })};
});

/* ═══════════════════════════════════════════════════════════════════
   Portaria GM/MS 11.165/2026 — docs/PORTARIA-11165-INTEGRACAO.md

   As regras são as de regras/portaria-11165.mjs (fonte única); a costura
   está em api/integracao-11165.mjs. Aqui: ler, validar o formato (422),
   gravar sob RLS e auditar na mesma transação. CPF não entra (400, no
   servidor, antes de tudo).
   ═══════════════════════════════════════════════════════════════════ */

const TRATAMENTOS = ['hemodialise','radioterapia','quimioterapia','consulta','exame','fisioterapia','outro'];
const ehIbge = v => typeof v === 'string' && /^\d{7}$/.test(v);
const TIPOS = {
  bool:        v => v === null || typeof v === 'boolean' ? v : falha('verdadeiro, falso ou nulo'),
  sim:         v => typeof v === 'boolean' ? v : falha('verdadeiro ou falso'),
  texto:       v => v === null ? null : typeof v === 'string' ? (v.trim() || null) : falha('texto ou nulo'),
  data:        v => v === null || dataValida(v) ? v : falha('data AAAA-MM-DD ou nulo'),
  dataSim:     v => dataValida(v) ? v : falha('data AAAA-MM-DD'),
  ibge:        v => v === null || ehIbge(v) ? v : falha('código IBGE de 7 dígitos ou nulo'),
  ibgeSim:     v => ehIbge(v) ? v : falha('código IBGE de 7 dígitos'),
  uf:          v => typeof v === 'string' && /^[A-Z]{2}$/.test(v) ? v : falha('UF de duas letras maiúsculas'),
  ufOuNulo:    v => v === null ? null : TIPOS.uf(v),
  cnes:        v => v === null || (typeof v === 'string' && /^\d{7}$/.test(v)) ? v : falha('CNES de 7 dígitos ou nulo'),
  fracao:      v => v === null || (typeof v === 'number' && v >= 0 && v <= 1) ? v : falha('fração de 0 a 1 ou nulo'),
  km:          v => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0) ? v : falha('km ≥ 0 ou nulo'),
  inteiro:     v => Number.isInteger(v) && v >= 0 ? v : falha('inteiro ≥ 0'),
  inteiroOuNulo: v => v === null ? null : TIPOS.inteiro(v),
  ibges:       v => Array.isArray(v) && v.every(ehIbge) ? v : falha('lista de códigos IBGE de 7 dígitos'),
  modalidades: v => Array.isArray(v) && v.every(x => TRATAMENTOS.includes(x)) ? v : falha('lista de tratamentos'),
  competencia: v => v === null ? null : competenciaValida(v) ? v + '-01' : falha('competência AAAA-MM ou nulo'),
  uuid:        v => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v) ? v : falha('identificador'),
  finalidade:  v => v === null || ['radioterapia','hemodialise','outros'].includes(v) ? v
                    : falha('radioterapia, hemodialise, outros ou nulo'),
  etapa:       v => v === null || ['planejamento','tratamento'].includes(v) ? v : falha('planejamento, tratamento ou nulo')
};
function falha(esperado){ throw Object.assign(new Error(esperado), {esperado}) }
function validar(campo, tipo, valor){
  try{ return TIPOS[tipo](valor) }
  catch(e){ throw Object.assign(new Error(`${campo}: esperado ${e.esperado || e.message}`), {status: 422}) }
}
/* Só as chaves presentes no corpo, validadas: [coluna, valor]. Nome de
   coluna sai do mapa, nunca do corpo. */
function presentes(corpo, mapa){
  const out = [];
  for(const [chave, [coluna, tipo]] of Object.entries(mapa))
    if(corpo && Object.prototype.hasOwnProperty.call(corpo, chave)) out.push([coluna, validar(chave, tipo, corpo[chave])]);
  if(!out.length) throw Object.assign(new Error('nenhum campo reconhecido no corpo'), {status: 422});
  return out;
}
function hojeDe(ctx){
  const h = ctx.query?.get('hoje');
  if(h === null || h === undefined) return hojeBrasilia();
  return validar('hoje', 'dataSim', h);
}

/* ─── serviço de referência (destino) ────────────────────────────── */
const MAPA_SERVICO = {ibge: ['municipio_ibge', 'ibge'], uf: ['uf', 'uf'], cnes: ['cnes', 'cnes'],
  habilitacaoConferida: ['habilitacao_conferida', 'bool'], habilitacaoCodigo: ['habilitacao_codigo', 'texto'],
  modalidades: ['modalidades', 'modalidades']};

rota('PUT', /^\/api\/destinos\/([0-9a-f-]{36})\/servico$/, false, async (ctx) => {
  const campos = presentes(ctx.corpo, MAPA_SERVICO);
  return comGestor(ctx.sessao, async (cli, s) => {
    const r = await cli.query(
      `update destinos set ${campos.map(([c], i) => `${c} = $${i + 2}`).join(', ')} where id = $1 returning id`,
      [ctx.params[0], ...campos.map(([, v]) => v)]);
    if(!r.rowCount) return {status: 404, corpo: {erro: 'destino não encontrado nesta base'}};
    await auditar(cli, {...s, acao: 'servico', entidade: 'destino', entidadeId: ctx.params[0], payload: resumir(ctx.corpo)});
    const {rows} = await cli.query(SQL_DESTINOS + ' where id = $1', [ctx.params[0]]);
    return {corpo: {id: rows[0].id, ...paraDestino(rows[0])}};
  });
});

/* ─── distâncias de município a município ────────────────────────── */
const paraDistancia = r => ({origem: r.origem_ibge, destino: r.destino_ibge, km: r.km, fonte: r.fonte, lidoEm: r.lido_em});

rota('GET', /^\/api\/distancias$/, false, async (ctx) => ({corpo: await comGestor(ctx.sessao, async (cli) =>
  (await cli.query('select * from distancias_municipais order by origem_ibge, destino_ibge')).rows.map(paraDistancia))}));

rota('PUT', /^\/api\/distancias$/, false, async (ctx) => {
  const c = ctx.corpo || {};
  const origem = validar('origem', 'ibgeSim', c.origem), destino = validar('destino', 'ibgeSim', c.destino);
  const km = validar('km', 'km', c.km ?? null), fonte = validar('fonte', 'texto', c.fonte ?? null);
  const lidoEm = validar('lidoEm', 'data', c.lidoEm ?? null);
  if(km !== null && (!fonte || !lidoEm))
    return {status: 422, corpo: {erro: 'km precisa de fonte e data de leitura: sem procedência não há número'}};
  return comGestor(ctx.sessao, async (cli, s) => {
    const {rows} = await cli.query(
      `insert into distancias_municipais (base_id, origem_ibge, destino_ibge, km, fonte, lido_em)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (base_id, origem_ibge, destino_ibge) do update
          set km = excluded.km, fonte = excluded.fonte, lido_em = excluded.lido_em, atualizado_em = now()
       returning *`, [s.baseId, origem, destino, km, fonte, lidoEm]);
    await auditar(cli, {...s, acao: 'distancia', entidade: 'distancia', entidadeId: `${origem}->${destino}`,
      payload: {origem, destino, km, fonte}});
    return {corpo: paraDistancia(rows[0])};
  });
});

/* ─── agendamento confirmado do tratamento (art. 13 §3º) ─────────── */
const paraAgendamento = r => ({id: r.id, paciente: r.paciente_id, destino: r.destino_id, data: r.data,
  confirmado: r.confirmado, etapa: r.etapa, protocolo: r.protocolo});

rota('GET', /^\/api\/agendamentos$/, false, async (ctx) => {
  const de = ctx.query.get('de'), ate = ctx.query.get('ate');
  if(de !== null) validar('de', 'dataSim', de);
  if(ate !== null) validar('ate', 'dataSim', ate);
  return {corpo: await comGestor(ctx.sessao, async (cli) => (await cli.query(
    `select * from agendamentos where ($1::date is null or data >= $1) and ($2::date is null or data <= $2)
      order by data, paciente_id`, [de, ate])).rows.map(paraAgendamento))};
});

rota('POST', /^\/api\/agendamentos$/, false, async (ctx) => {
  const c = ctx.corpo || {};
  const paciente = validar('paciente', 'uuid', c.paciente), destino = validar('destino', 'uuid', c.destino);
  const data = validar('data', 'dataSim', c.data);
  const confirmado = validar('confirmado', 'bool', c.confirmado ?? null);
  const etapa = validar('etapa', 'etapa', c.etapa ?? null), protocolo = validar('protocolo', 'texto', c.protocolo ?? null);
  return comGestor(ctx.sessao, async (cli, s) => {
    const visivel = await cli.query(
      `select (select count(*) from pacientes where id = $1)::int as p, (select count(*) from destinos where id = $2)::int as d`,
      [paciente, destino]);
    if(!visivel.rows[0].p || !visivel.rows[0].d)
      return {status: 404, corpo: {erro: 'paciente ou destino não encontrado nesta base'}};
    const {rows} = await cli.query(
      `insert into agendamentos (base_id, paciente_id, destino_id, data, confirmado, etapa, protocolo)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (paciente_id, destino_id, data) do update
          set confirmado = excluded.confirmado, etapa = excluded.etapa, protocolo = excluded.protocolo,
              atualizado_em = now()
       returning *`, [s.baseId, paciente, destino, data, confirmado, etapa, protocolo]);
    await auditar(cli, {...s, acao: 'agendamento', entidade: 'agendamento', entidadeId: rows[0].id,
      payload: {paciente, destino, data, confirmado, etapa}});
    return {corpo: paraAgendamento(rows[0])};
  });
});

/* ─── veículo: doação, prazos e renovação ────────────────────────── */
const MAPA_VEICULO = {doadoMs: ['doado_ms', 'bool'], termoDoacao: ['termo_doacao_ref', 'texto'],
  finalidadeDoacao: ['finalidade_doacao', 'finalidade'], dataRecebimento: ['data_recebimento', 'data'],
  prorrogacao: ['prorrogacao', 'sim'], cnesEstabelecimento: ['cnes_estabelecimento', 'cnes'],
  cnesInscritoEm: ['cnes_inscrito_em', 'data'], primeiraViagemConcluida: ['primeira_viagem_concluida', 'data'],
  emplacadoEm: ['emplacado_em', 'data'], disponibilidade12m: ['disponibilidade_12m', 'fracao'],
  laudo: ['laudo', 'bool'], hodometro: ['hodometro', 'inteiro']};

rota('PUT', /^\/api\/veiculos\/([^/]+)\/portaria$/, false, async (ctx) => {
  const ident = decodeURIComponent(ctx.params[0]);
  const campos = presentes(ctx.corpo, MAPA_VEICULO);
  const hoje = hojeDe(ctx);
  return comGestor(ctx.sessao, async (cli, s) => {
    const r = await cli.query(
      `update veiculos set ${campos.map(([c], i) => `${c} = $${i + 2}`).join(', ')}
        where identificacao = $1 returning id`, [ident, ...campos.map(([, v]) => v)]);
    if(!r.rowCount) return {status: 404, corpo: {erro: 'veículo não encontrado nesta base'}};
    await auditar(cli, {...s, acao: 'veiculo_portaria', entidade: 'veiculo', entidadeId: r.rows[0].id,
      payload: resumir(ctx.corpo)});
    const [v] = await lerVeiculos(cli, ident);
    const c = conformidade({hoje, pactuacao: null, veiculos: [paraConformidade(v)]}).veiculos[0];
    return {corpo: paraVeiculo(v, portariaDoVeiculo(c))};
  });
});

/* ─── pactuação da base (art. 14 p.ú.; art. 25, 4º item) ─────────── */
const MAPA_PACTUACAO = {deliberacaoCib: ['deliberacao_cib', 'texto'], deliberacaoCibData: ['deliberacao_cib_data', 'data'],
  estruturaGestao: ['estrutura_gestao_registrada', 'bool'], municipiosAbrangidos: ['municipios_abrangidos', 'ibges'],
  inicioIncentivo: ['inicio_incentivo', 'competencia']};

rota('PUT', /^\/api\/base\/pactuacao$/, false, async (ctx) => {
  const campos = presentes(ctx.corpo, MAPA_PACTUACAO);
  return comGestor(ctx.sessao, async (cli, s) => {
    const cols = campos.map(([c]) => c);
    await cli.query(
      `insert into base_pactuacao (base_id, ${cols.join(', ')})
       values ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')})
       on conflict (base_id) do update
          set ${cols.map(c => `${c} = excluded.${c}`).join(', ')}, atualizado_em = now()`,
      [s.baseId, ...campos.map(([, v]) => v)]);
    await auditar(cli, {...s, acao: 'pactuacao', entidade: 'base', entidadeId: s.baseId, payload: resumir(ctx.corpo)});
    return {corpo: paraPactuacao(await lerPactuacao(cli))};
  });
});

/* ─── remessas BPA-I informadas pelo faturamento (art. 21) ───────── */
const paraRemessa = r => ({competencia: r.competencia, linhas: r.linhas_enviadas, enviadaEm: r.enviada_em,
  informadoPor: r.informado_por, registradoEm: r.registrado_em});
const SQL_REMESSAS = `select to_char(competencia, 'YYYY-MM') as competencia, linhas_enviadas, enviada_em,
                             informado_por, registrado_em from remessas_bpa`;

rota('GET', /^\/api\/remessas-bpa$/, false, async (ctx) => ({corpo: await comGestor(ctx.sessao, async (cli) =>
  (await cli.query(SQL_REMESSAS + ' order by competencia')).rows.map(paraRemessa))}));

/* Zero linhas se informa como 0; competência não informada fica sem
   linha aqui e entra NULA no farol — sem informação não é zero. */
rota('POST', /^\/api\/remessas-bpa$/, false, async (ctx) => {
  const c = ctx.corpo || {};
  if(!competenciaValida(c.competencia)) return {status: 422, corpo: {erro: 'competencia: esperado AAAA-MM'}};
  const linhas = validar('linhas', 'inteiroOuNulo', c.linhas ?? null);
  const enviadaEm = validar('enviadaEm', 'data', c.enviadaEm ?? null);
  const informadoPor = validar('informadoPor', 'texto', c.informadoPor ?? null);
  if(!informadoPor) return {status: 422, corpo: {erro: 'informadoPor: setor ou instituição que informou a remessa'}};
  if(linhas > 0 && !enviadaEm) return {status: 422, corpo: {erro: 'remessa com linhas precisa da data de envio'}};
  return comGestor(ctx.sessao, async (cli, s) => {
    await cli.query(
      `insert into remessas_bpa (base_id, competencia, linhas_enviadas, enviada_em, informado_por, gestor_id)
       values ($1, $2::date, $3, $4, $5, $6)
       on conflict (base_id, competencia) do update
          set linhas_enviadas = excluded.linhas_enviadas, enviada_em = excluded.enviada_em,
              informado_por = excluded.informado_por, gestor_id = excluded.gestor_id, registrado_em = now()`,
      [s.baseId, c.competencia + '-01', linhas, enviadaEm, informadoPor, s.gestorId]);
    await auditar(cli, {...s, acao: 'remessa_bpa', entidade: 'competencia', entidadeId: c.competencia,
      payload: {competencia: c.competencia, linhas, enviadaEm}});
    const {rows} = await cli.query(SQL_REMESSAS + ' where competencia = $1::date', [c.competencia + '-01']);
    return {corpo: paraRemessa(rows[0])};
  });
});

/* ─── farol de produção por competência (art. 21 §2º) ────────────── */
rota('GET', /^\/api\/farol-producao$/, false, async (ctx) => {
  const hoje = hojeDe(ctx);
  return {corpo: await comGestor(ctx.sessao, async (cli) => {
    const pact = pactuacaoInterna(await lerPactuacao(cli));
    const conf = conformidade({hoje, pactuacao: pact, veiculos: (await lerVeiculos(cli)).map(paraConformidade)});
    const remessas = (await cli.query(SQL_REMESSAS)).rows;
    const {competencias, farol} = farolDaBase({inicio_incentivo: pact?.inicio_incentivo ?? null, remessas, hoje});
    const {rows} = await cli.query('select max(data) as ultima from baixas');
    const ultima = rows[0].ultima;
    return {
      hoje, inicio_incentivo: pact?.inicio_incentivo ?? null,
      aplicavel: conf.base_apta.estado === 'apta', base_apta: conf.base_apta,
      competencias, farol,
      operacional: {ultima_baixa: ultima, dias_sem_baixa: ultima ? diasEntre(ultima, hoje) : null,
        nota: 'informação operacional: baixa interna não comprova produção; o farol conta remessas BPA-I (art. 21 §2º)'}
    };
  })};
});

/* ─── painel de conformidade da base ─────────────────────────────── */
rota('GET', /^\/api\/conformidade$/, false, async (ctx) => {
  const hoje = hojeDe(ctx);
  return {corpo: await comGestor(ctx.sessao, async (cli) => {
    const pact = await lerPactuacao(cli);
    const conf = conformidade({hoje, pactuacao: pactuacaoInterna(pact), veiculos: (await lerVeiculos(cli)).map(paraConformidade)});
    return {hoje, pactuacao: paraPactuacao(pact), veiculos: conf.veiculos, base_apta: conf.base_apta};
  })};
});

/* ─── pré-remessa BPA-I (conferência em JSON; arquivo em CSV) ────────
   A conferência só conta: não carrega dado pessoal. O CSV é o único
   canal nominal de saída (CNS, sem nome, sem CPF) e cada geração entra
   na trilha. TODO (L1): leiaute oficial do BPA Magnético. */
const slug = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

rota('GET', /^\/api\/bpa-i\/([^/]+?)(\.csv)?$/, false, async (ctx) => {
  const [competencia, ext] = ctx.params;
  if(!competenciaValida(competencia)) return {status: 422, corpo: {erro: 'competência: esperado AAAA-MM'}};
  return comGestor(ctx.sessao, async (cli, s) => {
    const {rows} = await cli.query(
      `select d.viagem_id, d.data, d.paciente_id, p.cns, p.nascimento, d.tratamento::text as tratamento,
              d.residencia_ibge, d.residencia_uf, d.servico_ibge, d.servico_uf, d.habilitacao_conferida,
              d.distancia_km, d.agendamento_confirmado, d.etapa, d.presente_ida, d.presente_volta,
              vl.cnes_estabelecimento as cnes_executante, d.elegibilidade
         from deslocamentos d
         join pacientes p on p.id = d.paciente_id
         join veiculos vl on vl.id = d.veiculo_id
        where d.data >= $1::date and d.data < ($1::date + interval '1 month')`, [competencia + '-01']);
    const pact = pactuacaoInterna(await lerPactuacao(cli));
    const pre = preRemessaBPAI({competencia, deslocamentos: rows, pactuacao: pact});
    const divergentes = pre.fora.motivos.divergencia_modulo_banco;
    if(divergentes) console.error(`[rota-api] ${divergentes} deslocamento(s) com elegibilidade divergente entre módulo e banco`);

    if(!ext){
      return {corpo: {competencia, leiaute: pre.leiaute, colunas: pre.colunas,
        total_deslocamentos: pre.total_deslocamentos, linhas: pre.linhas.length, fora: pre.fora, avisos: pre.avisos,
        pendente_de_leiaute: 'arquivo oficial do BPA Magnético a gerar quando o leiaute vigente for obtido (lacuna L1)'}};
    }
    const {rows: b} = await cli.query('select municipio, uf from bases');
    await auditar(cli, {...s, acao: 'exportacao_bpa_i', entidade: 'competencia', entidadeId: competencia,
      payload: {formato: 'csv', linhas: pre.linhas.length, fora: pre.fora.total}});
    return {
      bruto: csvPreBPAI(pre.linhas),
      cabecalhos: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pre-bpa-i_${slug(b[0]?.municipio)}-${slug(b[0]?.uf)}_${competencia}.csv"`,
        'X-Rota-Linhas': String(pre.linhas.length),
        'X-Rota-Fora': String(pre.fora.total)
      }
    };
  });
});

/* ─── servidor ─────────────────────────────────────────────────────  */

const CABECALHOS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
  /* sem Access-Control-Allow-Origin: a API é de mesma origem do console.
     CORS aberto aqui seria entregar sessão de gestor a qualquer página. */
};

function corpoDaRequisicao(req){
  return new Promise((resolve, reject) => {
    let bruto = '', tamanho = 0;
    req.on('data', p => {
      tamanho += p.length;
      if(tamanho > LIMITE_CORPO){ reject(Object.assign(new Error('corpo grande demais'), {status: 413})); req.destroy(); return }
      bruto += p;
    });
    req.on('end', () => {
      if(!bruto) return resolve(null);
      try{ resolve(JSON.parse(bruto)) }
      catch{ reject(Object.assign(new Error('JSON inválido'), {status: 400})) }
    });
    req.on('error', reject);
  });
}

function tokenDe(req){
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function criarServidor(){
  return http.createServer(async (req, res) => {
    const responder = (status, corpo) =>
      res.writeHead(status, CABECALHOS).end(JSON.stringify(corpo));
    const responderBruto = (status, bruto, cabecalhos) =>
      res.writeHead(status, {...CABECALHOS, ...cabecalhos}).end(bruto);
    try{
      const endereco = new URL(req.url, 'http://api');
      const caminho = endereco.pathname;
      const achada = rotas.find(r => r.metodo === req.method && r.padrao.test(caminho));
      if(!achada) return responder(404, {erro: 'não encontrado'});

      const ctx = {
        params: (caminho.match(achada.padrao) || []).slice(1),
        query: endereco.searchParams,
        corpo: ['POST','PUT','PATCH'].includes(req.method) ? await corpoDaRequisicao(req) : null,
        ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || null,
        agente: (req.headers['user-agent'] || '').slice(0, 200)
      };

      /* CPF em lugar nenhum (decisão do Ota, 16/10/2026): o faturamento do
         ente completa o CPF; aqui ele não entra — nem no login, nem na
         consulta. Recusa antes de qualquer leitura ou escrita, e o valor
         não é ecoado nem registrado. */
      const cpf = chaveComCpf(ctx.corpo) || chaveComCpf(Object.fromEntries(endereco.searchParams));
      if(cpf) return responder(400, {erro: `o ROTA-OS não recebe CPF (campo "${cpf}"): ` +
        'a pré-remessa sai com a coluna vazia e o faturamento do ente a completa'});

      if(!achada.aberta){
        const token = tokenDe(req);
        if(!token) return responder(401, {erro: 'sem sessão'});
        ctx.tokenHash = hashToken(token);
        const {rows} = await semSessao(cli => cli.query('select * from auth_sessao($1)', [ctx.tokenHash]));
        if(!rows.length) return responder(401, {erro: 'sessão inválida ou expirada'});
        ctx.sessao = {gestorId: rows[0].gestor_id, baseId: rows[0].base_id};
      }

      const r = await achada.fn(ctx);
      if(r.bruto !== undefined) return responderBruto(r.status || 200, r.bruto, r.cabecalhos);
      return responder(r.status || 200, r.corpo);
    }catch(e){
      /* o erro do banco não vai ao cliente: mensagem de RLS ou de
         constraint conta a estrutura para quem não deveria conhecê-la. */
      const status = e.status || 500;
      if(status >= 500) console.error('[rota-api]', e.message);
      return responder(status, {erro: status >= 500 ? 'erro interno' : e.message});
    }
  });
}

export async function subir(porta = process.env.PORT || 3000){
  abrir();
  await conferirConexao();
  const srv = criarServidor();
  await new Promise(r => srv.listen(porta, r));
  return srv;
}

export {fechar};

if(import.meta.url === `file://${process.argv[1]}`){
  const srv = await subir();
  const {port} = srv.address();
  console.log(`ROTA · API em http://localhost:${port}`);
  for(const s of ['SIGINT','SIGTERM'])
    process.on(s, async () => { srv.close(); await fechar(); process.exit(0) });
}
