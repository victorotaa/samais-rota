/* ═══════════════════════════════════════════════════════════════════
   ROTA · acesso ao banco.

   Uma regra governa este arquivo: **a API não filtra por base**. Quem
   filtra é o banco. Toda transação abre declarando quem é o gestor, e a
   RLS decide o que ele enxerga. Se um handler esquecer o `where`, o
   isolamento continua de pé — foi para isso que ele foi posto lá.

   O provedor entra por `DATABASE_URL` e não aparece em mais lugar
   nenhum: Supabase, Neon e RDS-SP servem igual.
   ═══════════════════════════════════════════════════════════════════ */
import pg from 'pg';

/* numeric volta como string por padrão no pg — em dinheiro isso é
   virtude, em km e litros é ruído. Converte-se aqui, uma vez. */
pg.types.setTypeParser(1700, v => v === null ? null : parseFloat(v));

let pool = null;

export function abrir(url = process.env.DATABASE_URL){
  if(!url) throw new Error('DATABASE_URL ausente');
  pool = pool || new pg.Pool({
    connectionString: url,
    max: Number(process.env.PG_POOL || 10),
    idleTimeoutMillis: 30_000,
    statement_timeout: 15_000,
    application_name: 'rota-api'
  });
  return pool;
}

export async function fechar(){ if(pool){ await pool.end(); pool = null } }

/* Transação sem gestor: só o login passa por aqui, e só chama função
   security definer. Nenhuma leitura de tabela sob RLS. */
export async function semSessao(fn){
  const cli = await abrir().connect();
  try{
    await cli.query('begin');
    const r = await fn(cli);
    await cli.query('commit');
    return r;
  }catch(e){
    await cli.query('rollback').catch(() => {});
    throw e;
  }finally{ cli.release() }
}

/* Transação de gestor. O set_config é local à transação: nenhuma
   requisição herda a identidade da anterior pelo pool. */
export async function comGestor({gestorId, baseId}, fn){
  const cli = await abrir().connect();
  try{
    await cli.query('begin');
    await cli.query(`select set_config('rota.gestor_id', $1, true)`, [gestorId]);
    const r = await fn(cli, {gestorId, baseId});
    await cli.query('commit');
    return r;
  }catch(e){
    await cli.query('rollback').catch(() => {});
    throw e;
  }finally{ cli.release() }
}

/* ─── Auditoria ────────────────────────────────────────────────────
   Grava na MESMA transação da escrita: ou os dois acontecem, ou nenhum.

   O que se grava é a referência e o que mudou — não o valor do dado
   pessoal. A trilha é append-only por construção: se o nome e o CNS do
   paciente fossem copiados para cá, um pedido de correção ou de exclusão
   não teria como ser honrado, porque esta tabela recusa UPDATE e DELETE
   de propósito. Minimização não é zelo excessivo aqui: é o que mantém as
   duas garantias compatíveis.                                        */
const PROIBIDOS = new Set(['nome','cns','nascimento','ponto','ponto_embarque','email','telefone','senha','token']);

export function resumir(objeto){
  const campos = Object.keys(objeto || {}).filter(k => !PROIBIDOS.has(k));
  const seguro = {};
  for(const k of campos){
    const v = objeto[k];
    seguro[k] = (v && typeof v === 'object') ? Array.isArray(v) ? v.length : '{...}' : v;
  }
  return {campos: Object.keys(objeto || {}).sort(), valores: seguro};
}

export async function auditar(cli, {baseId, gestorId, acao, entidade, entidadeId, payload}){
  await cli.query(
    `insert into auditoria (base_id, gestor_id, acao, entidade, entidade_id, payload)
     values ($1,$2,$3,$4,$5,$6)`,
    [baseId, gestorId, acao, entidade, entidadeId == null ? null : String(entidadeId),
     payload === undefined ? null : JSON.stringify(payload)]);
}

/* ─── Guarda de conexão ────────────────────────────────────────────
   A RLS não se aplica ao dono da tabela nem a superusuário. Uma string
   de conexão de dono — que é o padrão que Supabase e Neon entregam —
   desliga o isolamento inteiro sem erro nenhum: as consultas seguem
   funcionando, só que enxergando todos os municípios.

   Isso aconteceu aqui, na primeira vez em que a API subiu. Por isso a
   API não sobe com papel assim. Não há variável de ambiente para
   contornar: se houvesse, seria ela que estaria em produção.          */
export async function conferirConexao(){
  const cli = await abrir().connect();
  try{
    const {rows} = await cli.query(`
      select current_user as papel,
             current_setting('is_superuser') = 'on' as superusuario,
             coalesce((select rolbypassrls from pg_roles where rolname = current_user), false) as bypassrls`);
    const {papel, superusuario, bypassrls} = rows[0];
    if(superusuario || bypassrls){
      throw new Error(
        `a API não sobe com o papel "${papel}": ${superusuario ? 'é superusuário' : 'tem BYPASSRLS'} ` +
        `e portanto passa por cima da RLS. Crie o papel de aplicação:\n` +
        `  create role rota_api login password '...' in role rota_app;\n` +
        `e aponte DATABASE_URL para ele.`);
    }
    const deriva = await cli.query('select * from verificar_isolamento()').catch(() => null);
    if(deriva && deriva.rowCount){
      throw new Error('isolamento inconsistente no schema: ' +
        deriva.rows.map(r => `${r.tabela} (${r.problema})`).join(', '));
    }
    return {papel};
  }finally{ cli.release() }
}
