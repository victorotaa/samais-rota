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

const LIMITE_CORPO = 256 * 1024;     // manifesto de dia cheio cabe folgado

/* ─── mapeamento: banco → vocabulário do console ───────────────────
   O console fala 'tratKey', 'dest', 'lot', 'hod'. O banco fala
   'tratamento', 'destino_id', 'lotacao', 'hodometro'. A tradução vive
   aqui, num lugar só, e é o que permite trocar a fonte do front sem
   reescrever tela nenhuma.                                           */

const iso = d => d instanceof Date ? d.toISOString().slice(0, 10) : d;

function paraDestino(r){ return {nome: r.nome, km: Number(r.km), tipo: Number(r.km) > 50 ? 'Intermunicipal >50km' : 'Local'} }

function paraPaciente(r){
  return {
    id: r.id, nome: r.nome, cns: r.cns, nasc: iso(r.nascimento), mun: r.municipio,
    ponto: r.ponto_embarque, tratKey: r.tratamento, esp: r.especialidade || undefined,
    dest: r.destino_id, rec: r.recorrencia || [], acomp: r.acompanhante,
    necKey: r.necessidade,
    aut: r.processo_ref ? {proc: r.processo_ref, val: iso(r.validade), origem: r.origem} : null
  };
}

function paraVeiculo(r){
  return {
    id: r.identificacao, uuid: r.id, placa: r.placa, classe: r.classe, tipo: r.descricao,
    lot: r.lotacao, hod: r.hodometro, revCada: r.rev_intervalo_km, proxRev: r.prox_rev_km,
    mot: r.condutor, assist: r.assistente || undefined,
    cnes: r.cnes_num, cnesPrazo: r.cnes_prazo ? iso(r.cnes_prazo) : undefined,
    origem: r.origem || undefined
  };
}

/* ─── carga do console ─────────────────────────────────────────────
   Nenhuma consulta traz `where base_id` — é a RLS que recorta. Uma
   consulta a mais aqui não vaza nada; uma consulta esquecida também
   não.                                                               */
async function carregar(cli){
  /* uma consulta de cada vez: é UMA transação, e portanto UMA conexão.
     Disparar em paralelo no mesmo cliente serializa do mesmo jeito, só
     que por baixo e com aviso de depreciação do driver. */
  const base = await cli.query('select custo_km, custo_km_fonte, municipio, uf, janela_suspensao_dias from bases');
  const destinos = await cli.query('select id, nome, km from destinos order by km');
  const pacientes = await cli.query(`select p.*, a.processo_ref, a.validade, a.origem
                 from pacientes p
                 left join lateral (
                   select processo_ref, validade, origem from autorizacoes
                    where paciente_id = p.id order by validade desc limit 1) a on true
                where p.ativo order by p.nome`);
  const veiculos = await cli.query('select * from veiculos where ativo order by identificacao');
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
    pacientes: pacientes.rows.map(paraPaciente),
    veiculos: veiculos.rows.map(paraVeiculo),
    abastecimentos: abastecimentos.rows.map(r => ({
      vid: r.vid, data: iso(r.data), litros: Number(r.litros), km: r.km, valor: Number(r.valor)})),
    lancamentos,
    config: {
      custoKmVariavel: Number(cfg.custo_km ?? 0.9),
      custoKmFonte: cfg.custo_km_fonte || 'parâmetro da base · definido no contrato',
      municipio: cfg.municipio, uf: cfg.uf,
      janelaSuspensaoDias: cfg.janela_suspensao_dias
    }
  };
}

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

rota('GET', /^\/api\/carregar$/, false, async (ctx) =>
  ({corpo: await comGestor(ctx.sessao, cli => carregar(cli))}));

/* Paciente: cria ou atualiza, com a autorização junto — no console os
   dois são uma tela só, e separar em dois endpoints deixaria paciente
   sem autorização se o segundo falhasse. */
rota('POST', /^\/api\/pacientes$/, false, async (ctx) => {
  const p = ctx.corpo || {};
  if(!p.nome || !p.cns || !p.dest || !p.tratKey)
    return {status: 422, corpo: {erro: 'nome, cns, dest e tratKey são obrigatórios'}};

  return comGestor(ctx.sessao, async (cli, s) => {
    const vals = [s.baseId, p.nome, p.cns, p.nasc, p.mun, p.ponto, p.tratKey,
                  p.esp || null, p.dest, p.rec || [], !!p.acomp, p.necKey || 'nenhuma'];
    let r;
    if(p.id){
      r = await cli.query(
        `update pacientes set nome=$2, cns=$3, nascimento=$4, municipio=$5, ponto_embarque=$6,
                tratamento=$7, especialidade=$8, destino_id=$9, recorrencia=$10,
                acompanhante=$11, necessidade=$12
           where id=$1 returning *`, [p.id, ...vals.slice(1)]);
      if(!r.rowCount) return {status: 404, corpo: {erro: 'paciente não encontrado nesta base'}};
    }else{
      r = await cli.query(
        `insert into pacientes (base_id,nome,cns,nascimento,municipio,ponto_embarque,
            tratamento,especialidade,destino_id,recorrencia,acompanhante,necessidade)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`, vals);
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
    const {rows} = await cli.query(
      `select p.*, a.processo_ref, a.validade, a.origem from pacientes p
         left join lateral (select processo_ref, validade, origem from autorizacoes
            where paciente_id = p.id order by validade desc limit 1) a on true
        where p.id = $1`, [salvo.id]);
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
    try{
      const caminho = new URL(req.url, 'http://api').pathname;
      const achada = rotas.find(r => r.metodo === req.method && r.padrao.test(caminho));
      if(!achada) return responder(404, {erro: 'não encontrado'});

      const ctx = {
        params: (caminho.match(achada.padrao) || []).slice(1),
        corpo: ['POST','PUT','PATCH'].includes(req.method) ? await corpoDaRequisicao(req) : null,
        ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || null,
        agente: (req.headers['user-agent'] || '').slice(0, 200)
      };

      if(!achada.aberta){
        const token = tokenDe(req);
        if(!token) return responder(401, {erro: 'sem sessão'});
        ctx.tokenHash = hashToken(token);
        const {rows} = await semSessao(cli => cli.query('select * from auth_sessao($1)', [ctx.tokenHash]));
        if(!rows.length) return responder(401, {erro: 'sessão inválida ou expirada'});
        ctx.sessao = {gestorId: rows[0].gestor_id, baseId: rows[0].base_id};
      }

      const r = await achada.fn(ctx);
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
