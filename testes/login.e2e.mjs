/* ═══════════════════════════════════════════════════════════════════
   Login de ponta a ponta — api/auth.mjs contra o banco de verdade.

   Os testes de api/auth.mjs provam a criptografia; as asserções SQL
   provam o isolamento. Este prova a costura: que a política de acesso
   e o estado gravado concordam, inclusive nos casos que só existem
   quando as duas metades se encontram — reuso de código TOTP, bloqueio
   por tentativa, troca de senha derrubando sessão viva.

   Precisa de um Postgres com schema e migrações aplicados:
     DATABASE_URL=postgres://... node testes/login.e2e.mjs
   Sem DATABASE_URL, encerra sem falhar — `npm test` continua offline.

   Roda tudo em transação e desfaz no fim.
   ═══════════════════════════════════════════════════════════════════ */
import pg from 'pg';
import {
  hashSenha, conferirSenha, segredoTotp, totp, conferirTotp,
  novaSessao, hashToken, codigosRecuperacao, conferirRecuperacao,
  atrasoDeTentativa, bloqueadoAte
} from '../api/auth.mjs';

const url = process.env.DATABASE_URL;
if(!url){
  console.log('\n  DATABASE_URL ausente — teste de login pulado.\n');
  process.exit(0);
}

let passou = 0, falhou = 0;
const ok = (nome, cond, d) => cond
  ? (passou++, console.log('  ok   ·', nome))
  : (falhou++, console.log('  FALHA·', nome, d !== undefined ? '→ ' + JSON.stringify(d) : ''));
const eq = (nome, a, b) => ok(nome, JSON.stringify(a) === JSON.stringify(b), {obtido: a, esperado: b});

const cli = new pg.Client({connectionString: url});
await cli.connect();
await cli.query('begin');

const BASE_A = '11111111-1111-1111-1111-111111111111';
const BASE_B = '22222222-2222-2222-2222-222222222222';
const G_A    = 'aaaaaaaa-0000-0000-0000-00000000000a';
const G_B    = 'bbbbbbbb-0000-0000-0000-00000000000b';
const SENHA  = 'Rota!Micro-04-Amanhecer';
const EMAIL  = 'gestora@floriano.pi.gov.br';
const barato = {N: 1 << 12, r: 8, p: 1, tamanho: 32};

try{
  await cli.query(`insert into bases (id,municipio,uf,contratante) values
    ($1,'Floriano','PI','Prefeitura de Floriano'), ($2,'Caico','RN','Prefeitura de Caico')`, [BASE_A, BASE_B]);

  const segredo = segredoTotp();
  const {codigos, hashes} = codigosRecuperacao();
  await cli.query(`insert into gestores (id,base_id,nome,email,senha_hash,totp_segredo,totp_confirmado_em,recuperacao_hashes)
    values ($1,$2,'Gestora Floriano',$3,$4,$5,now(),$6)`,
    [G_A, BASE_A, EMAIL, hashSenha(SENHA, barato), segredo, hashes]);
  await cli.query(`insert into gestores (id,base_id,nome,email,senha_hash) values
    ($1,$2,'Gestor Caico','gestor@caico.rn.gov.br',$3)`, [G_B, BASE_B, hashSenha(SENHA, barato)]);

  /* ─── entrada bem-sucedida ─────────────────────────────────────── */
  console.log('\n── entrada ──');
  let {rows} = await cli.query('select * from auth_iniciar($1)', [EMAIL]);
  eq('auth_iniciar acha o gestor ativo', rows.length, 1);
  const g = rows[0];
  eq('e devolve a base dele', g.base_id, BASE_A);
  ok('senha confere', conferirSenha(SENHA, g.senha_hash));
  ok('senha errada não confere', !conferirSenha(SENHA + 'x', g.senha_hash));

  const agora = Date.now();
  const codigo = totp(g.totp_segredo, {agoraMs: agora});
  const t1 = conferirTotp(g.totp_segredo, codigo, {agoraMs: agora, ultimoPasso: g.totp_ultimo_passo});
  ok('segundo fator confere', t1.ok);

  const s1 = novaSessao({agoraMs: agora});
  const {rows: r1} = await cli.query('select auth_entrou($1,$2,$3,$4,null,$5,$6) as sessao',
    [G_A, s1.hash, s1.expiraEm, t1.passo, '203.0.113.10', 'Firefox/ROTA']);
  ok('sessão aberta', !!r1[0].sessao);

  const {rows: r2} = await cli.query('select * from auth_sessao($1)', [s1.hash]);
  eq('token resolve em gestor e base', [r2[0].gestor_id, r2[0].base_id], [G_A, BASE_A]);
  ok('o banco guardou o hash, não o token',
     (await cli.query('select count(*) n from sessoes where token_hash = $1', [s1.token])).rows[0].n === '0');

  /* ─── reuso do código do segundo fator ─────────────────────────── */
  console.log('\n── reuso do código ──');
  const {rows: r3} = await cli.query('select * from auth_iniciar($1)', [EMAIL]);
  eq('o passo usado ficou gravado', String(r3[0].totp_ultimo_passo), String(t1.passo));
  eq('o mesmo código não entra de novo',
     conferirTotp(segredo, codigo, {agoraMs: agora, ultimoPasso: r3[0].totp_ultimo_passo}).motivo, 'reuso');
  ok('o código do passo seguinte entra',
     conferirTotp(segredo, totp(segredo, {agoraMs: agora + 30_000}),
       {agoraMs: agora + 30_000, ultimoPasso: r3[0].totp_ultimo_passo}).ok);

  /* ─── falha e bloqueio progressivo ─────────────────────────────── */
  console.log('\n── tentativa e bloqueio ──');
  for(let i = 1; i <= 4; i++){
    const {rows: r} = await cli.query('select falhas from gestores where id = $1', [G_A]);
    const ate = bloqueadoAte(r[0].falhas + 1, Date.now());
    await cli.query('select auth_falhou($1,$2,$3,$4,$5)', [EMAIL, 'senha', ate, '203.0.113.10', 'curl']);
  }
  const {rows: r4} = await cli.query('select * from auth_iniciar($1)', [EMAIL]);
  eq('quatro falhas contadas', r4[0].falhas, 4);
  ok('bloqueio marcado no futuro', new Date(r4[0].bloqueado_ate) > new Date());
  eq('e o atraso é o da política', atrasoDeTentativa(4) / 60000, 2);

  const {rows: r5} = await cli.query(
    `select count(*) n from acessos where email = $1 and not sucesso`, [EMAIL]);
  eq('toda falha foi ao log', r5[0].n, '4');

  const {rows: r6} = await cli.query('select * from auth_iniciar($1)', ['ninguem@exemplo.br']);
  eq('e-mail inexistente não devolve linha', r6.length, 0);
  await cli.query('select auth_falhou($1,null,null,null,null)', ['ninguem@exemplo.br']);
  const {rows: r7} = await cli.query(
    `select base_id, motivo from acessos where email = 'ninguem@exemplo.br'`);
  eq('mas vai ao log, sem base', [r7[0].base_id, r7[0].motivo], [null, 'inexistente']);

  /* ─── sucesso zera o contador ──────────────────────────────────── */
  const s2 = novaSessao();
  const passo2 = conferirTotp(segredo, totp(segredo, {agoraMs: agora + 60_000}),
    {agoraMs: agora + 60_000, ultimoPasso: r4[0].totp_ultimo_passo}).passo;
  await cli.query('select auth_entrou($1,$2,$3,$4,null,null,null)', [G_A, s2.hash, s2.expiraEm, passo2]);
  const {rows: r8} = await cli.query('select * from auth_iniciar($1)', [EMAIL]);
  eq('entrar zera falhas e bloqueio', [r8[0].falhas, r8[0].bloqueado_ate], [0, null]);

  /* ─── código de recuperação ────────────────────────────────────── */
  console.log('\n── recuperação ──');
  const uso = conferirRecuperacao(codigos[2], r8[0].recuperacao_hashes);
  ok('código de recuperação vale', uso.ok);
  const s3 = novaSessao();
  await cli.query('select auth_entrou($1,$2,$3,null,$4,null,null)',
    [G_A, s3.hash, s3.expiraEm, uso.restantes]);
  const {rows: r9} = await cli.query('select * from auth_iniciar($1)', [EMAIL]);
  eq('e é queimado no banco', r9[0].recuperacao_hashes.length, 7);
  ok('não serve de novo', !conferirRecuperacao(codigos[2], r9[0].recuperacao_hashes).ok);

  /* ─── saída e troca de senha ───────────────────────────────────── */
  console.log('\n── saída e troca de senha ──');
  const {rows: rA} = await cli.query('select auth_sair($1) n', [s1.hash]);
  eq('saída revoga uma sessão', rA[0].n, 1);
  eq('token revogado não resolve mais', (await cli.query('select * from auth_sessao($1)', [s1.hash])).rows.length, 0);
  eq('sair de novo não revoga nada', (await cli.query('select auth_sair($1) n', [s1.hash])).rows[0].n, 0);

  const {rows: rB} = await cli.query('select auth_trocar_senha($1,$2,$3) n',
    [G_A, hashSenha('Outra!Senha-Do-Rota-26', barato), s3.hash]);
  eq('troca de senha derruba as outras sessões', rB[0].n, 1);
  ok('a sessão atual sobrevive', (await cli.query('select * from auth_sessao($1)', [s3.hash])).rows.length === 1);
  ok('a antiga não', (await cli.query('select * from auth_sessao($1)', [s2.hash])).rows.length === 0);
  const {rows: rC} = await cli.query('select * from auth_iniciar($1)', [EMAIL]);
  ok('a senha nova confere', conferirSenha('Outra!Senha-Do-Rota-26', rC[0].senha_hash));
  ok('a antiga não', !conferirSenha(SENHA, rC[0].senha_hash));

  /* ─── sessão expirada e gestor inativo ─────────────────────────── */
  console.log('\n── sessão morta ──');
  const s4 = novaSessao();
  await cli.query(`insert into sessoes (base_id,gestor_id,token_hash,expira_em)
                   values ($1,$2,$3, now() - interval '1 hour')`, [BASE_A, G_A, s4.hash]);
  eq('sessão expirada não resolve', (await cli.query('select * from auth_sessao($1)', [s4.hash])).rows.length, 0);

  const s5 = novaSessao();
  await cli.query(`insert into sessoes (base_id,gestor_id,token_hash,expira_em)
                   values ($1,$2,$3, now() + interval '1 hour')`, [BASE_B, G_B, s5.hash]);
  await cli.query('update gestores set ativo = false where id = $1', [G_B]);
  eq('sessão de gestor desativado morre junto',
     (await cli.query('select * from auth_sessao($1)', [s5.hash])).rows.length, 0);
  eq('e ele não consegue iniciar',
     (await cli.query('select * from auth_iniciar($1)', ['gestor@caico.rn.gov.br'])).rows.length, 0);
  await cli.query('update gestores set ativo = true where id = $1', [G_B]);

  /* ─── isolamento das tabelas de acesso ─────────────────────────── */
  console.log('\n── isolamento ──');
  await cli.query(`do $$ begin
      if not exists (select 1 from pg_roles where rolname='rota_app') then create role rota_app nologin; end if;
    end $$`);
  await cli.query('grant usage on schema public to rota_app');
  await cli.query('grant select, insert, update, delete on sessoes to rota_app');
  await cli.query('grant select on acessos to rota_app');
  await cli.query('set local role rota_app');
  await cli.query(`select set_config('rota.gestor_id', $1, true)`, [G_A]);
  const {rows: rD} = await cli.query('select count(*) n from sessoes');
  ok('gestora de Floriano só enxerga sessão da própria base', +rD[0].n > 0);
  const {rows: rE} = await cli.query('select count(*) n from sessoes where base_id = $1', [BASE_B]);
  eq('e nenhuma da outra', rE[0].n, '0');
  const {rows: rF} = await cli.query('select count(*) n from acessos where base_id is null');
  eq('log de e-mail inexistente não vaza para a base', rF[0].n, '0');
  let leu = true;
  await cli.query('savepoint tenta_ler');
  try{ await cli.query('select senha_hash from gestores limit 1') }
  catch{ leu = false; await cli.query('rollback to savepoint tenta_ler') }
  ok('o papel da aplicação não lê hash de senha direto', !leu);
  await cli.query('reset role');

  /* ─── expurgo ──────────────────────────────────────────────────── */
  console.log('\n── retenção ──');
  await cli.query('update bases set retencao_meses = 1 where id = $1', [BASE_A]);
  await cli.query(`update sessoes set criado_em = now() - interval '2 months', revogado_em = now()
                   where base_id = $1`, [BASE_A]);
  await cli.query(`update acessos set em = now() - interval '2 months' where base_id = $1`, [BASE_A]);
  const {rows: rG} = await cli.query('select * from expurgar_acesso($1)', [BASE_A]);
  ok('expurgo remove sessão morta e log vencido',
     rG[0].sessoes_removidas > 0 && rG[0].acessos_removidos > 0);
  const {rows: rH} = await cli.query('select count(*) n from pacientes');
  eq('e não toca em dado assistencial', rH[0].n, '0');

}finally{
  await cli.query('rollback');
  await cli.end();
}

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
