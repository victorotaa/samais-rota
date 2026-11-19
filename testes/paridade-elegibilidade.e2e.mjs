/* ═══════════════════════════════════════════════════════════════════
   Paridade · elegibilidade da Portaria 11.165 no módulo e no banco.

   A regra mora em regras/portaria-11165.mjs (fonte única). O banco
   espelha só a elegibilidade federal — elegibilidade_federal(), na
   migração 0004 — porque a view de deslocamentos e o relatório dependem
   dela. Regra escrita duas vezes sem teste diverge em silêncio; este
   teste é o que impede.

     1. os casos do grupo de elegibilidade do JSON rodam nos dois lados:
        mesmo status, mesmas regras violadas, mesmas pendências — e o
        status igual ao esperado do caso;
     2. a grade inteira das combinações de fronteira, nos dois lados.

   Precisa de um Postgres com schema e migrações 0001…0004 aplicados:
     DATABASE_URL=postgres://... node testes/paridade-elegibilidade.e2e.mjs
   Sem DATABASE_URL, encerra sem falhar. Só lê: não grava nada.
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import pg from 'pg';
import {elegibilidade11165} from '../regras/portaria-11165.mjs';

const url = process.env.DATABASE_URL;
if(!url){ console.log('\n  DATABASE_URL ausente — teste de paridade pulado.\n'); process.exit(0) }

const raiz = path.dirname(fileURLToPath(import.meta.url));
const casos = JSON.parse(fs.readFileSync(path.join(raiz, 'casos', 'portaria-11165-casos.json'), 'utf8'));

let passou = 0, falhou = 0;
const ok = (nome, cond, d) => cond
  ? (passou++, console.log('  ok   ·', nome))
  : (falhou++, console.log('  FALHA·', nome, d !== undefined ? '→ ' + JSON.stringify(d) : ''));

/* entrada no formato do módulo → linha plana do banco */
const plana = (e, ord) => ({
  ord,
  modalidade: e.modalidade ?? null,
  residencia_ibge: e.residencia?.ibge ?? null,
  residencia_uf: e.residencia?.uf ?? null,
  servico_ibge: e.servico?.municipio_ibge ?? null,
  servico_uf: e.servico?.uf ?? null,
  habilitacao: e.servico?.habilitacao_conferida ?? null,
  km: e.distancia_km ?? null,
  agendamento: e.agendamento_confirmado ?? null
});

/* uma consulta só para o lote inteiro: o banco recebe as entradas em
   JSON e devolve, por ordem, a saída da função e a do booleano */
const SQL = `
  select x.ord, el.status, el.regras_violadas, el.pendencias,
         elegivel_federal(x.modalidade, x.residencia_ibge, x.residencia_uf, x.servico_ibge,
                          x.servico_uf, x.habilitacao, x.km, x.agendamento) as elegivel
    from jsonb_to_recordset($1::jsonb) as x(ord int, modalidade text, residencia_ibge text,
         residencia_uf text, servico_ibge text, servico_uf text, habilitacao boolean,
         km numeric, agendamento boolean)
    cross join lateral elegibilidade_federal(x.modalidade, x.residencia_ibge, x.residencia_uf,
         x.servico_ibge, x.servico_uf, x.habilitacao, x.km, x.agendamento) el
   order by x.ord`;

const cli = new pg.Client({connectionString: url});
await cli.connect();

async function noBanco(entradas){
  const {rows} = await cli.query(SQL, [JSON.stringify(entradas.map(plana))]);
  return rows;
}
const recorte = r => ({status: r.status, regras_violadas: r.regras_violadas, pendencias: r.pendencias});

try{
  /* ─── 1. casos do JSON ─────────────────────────────────────────── */
  const grupo = casos.grupos.find(g => g.funcao === 'elegibilidade11165');
  console.log('\n── ' + grupo.secao + ' · módulo × banco ──');
  const doBanco = await noBanco(grupo.casos.map(c => c.entrada));
  grupo.casos.forEach((c, i) => {
    const m = recorte(elegibilidade11165(c.entrada));
    const b = recorte(doBanco[i]);
    ok(`${c.id} · ${c.nome}`,
       JSON.stringify(m) === JSON.stringify(b) && m.status === c.esperado.status &&
       doBanco[i].elegivel === (m.status === 'elegivel'),
       {modulo: m, banco: b, esperado: c.esperado.status});
  });

  /* ─── 2. a grade das fronteiras ────────────────────────────────── */
  console.log('\n── grade de fronteira · módulo × banco ──');
  const grade = [];
  for(const modalidade of ['radioterapia', 'hemodialise', 'quimioterapia', null])
  for(const distancia_km of [null, 0, 49.9, 50, 50.1, 252, 500, 500.1, 600])
  for(const [ri, si] of [['9900001','9900002'], ['9900001','9900001'], [null,'9900002'], ['9900001',null]])
  for(const [ru, su] of [['ZA','ZA'], ['ZA','ZB'], [null,'ZA'], ['ZA',null]])
  for(const habilitacao_conferida of [true, false, null])
  for(const agendamento_confirmado of [true, false, null])
    grade.push({modalidade, distancia_km, agendamento_confirmado,
      residencia: {ibge: ri, uf: ru}, servico: {municipio_ibge: si, uf: su, habilitacao_conferida}});

  const gradeBanco = await noBanco(grade);
  const divergentes = [];
  const contagem = {elegivel: 0, inelegivel: 0, pendente: 0};
  grade.forEach((e, i) => {
    const m = recorte(elegibilidade11165(e)), b = recorte(gradeBanco[i]);
    contagem[m.status]++;
    if(JSON.stringify(m) !== JSON.stringify(b) || gradeBanco[i].elegivel !== (m.status === 'elegivel'))
      divergentes.push({entrada: e, modulo: m, banco: b});
  });
  ok(`${grade.length} combinações, nenhuma divergência`, divergentes.length === 0,
     divergentes.slice(0, 3));
  ok('a grade exercita os três estados',
     contagem.elegivel > 0 && contagem.inelegivel > 0 && contagem.pendente > 0, contagem);
}finally{
  await cli.end();
}

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
