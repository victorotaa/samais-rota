/* ═══════════════════════════════════════════════════════════════════
   Testes da autenticação — sem navegador, sem banco, sem rede.

   O segundo fator é conferido contra os vetores oficiais da RFC 6238
   (apêndice B) e da RFC 4226, e a base32 contra os da RFC 4648. Não é
   auto-consistência: se a implementação estivesse errada de um jeito
   coerente, esses vetores acusariam.

   Rodar: node testes/auth.test.mjs
   ═══════════════════════════════════════════════════════════════════ */
import {
  hashSenha, conferirSenha, precisaRehash, forcaSenha,
  base32Codificar, base32Decodificar,
  hotp, totp, conferirTotp, segredoTotp, uriOtpauth,
  codigosRecuperacao, conferirRecuperacao,
  novaSessao, hashToken, sessaoValida,
  atrasoDeTentativa, bloqueadoAte
} from '../api/auth.mjs';

let passou = 0, falhou = 0;
const ok = (nome, cond, d) => cond
  ? (passou++, console.log('  ok   ·', nome))
  : (falhou++, console.log('  FALHA·', nome, d !== undefined ? '→ ' + JSON.stringify(d) : ''));
const eq = (nome, a, b) => ok(nome, JSON.stringify(a) === JSON.stringify(b), {obtido: a, esperado: b});

/* ─────────────────────────────────────────────── base32 (RFC 4648) */
console.log('\n── base32 · vetores da RFC 4648 ──');
for(const [claro, esperado] of [
  ['', ''], ['f','MY======'], ['fo','MZXQ===='], ['foo','MZXW6==='],
  ['foob','MZXW6YQ='], ['fooba','MZXW6YTB'], ['foobar','MZXW6YTBOI======']
]) eq(`codifica ${JSON.stringify(claro)}`, base32Codificar(Buffer.from(claro)), esperado);
eq('decodifica de volta', base32Decodificar('MZXW6YTBOI======').toString(), 'foobar');
ok('recusa alfabeto inválido', (()=>{try{base32Decodificar('1!8');return false}catch{return true}})());

/* ────────────────────────────────────────────────── HOTP (RFC 4226) */
console.log('\n── HOTP · vetores da RFC 4226 ──');
const SEED = Buffer.from('12345678901234567890');
const RFC4226 = ['755224','287082','359152','969429','338314','254676','287922','162583','399871','520489'];
RFC4226.forEach((esperado, contador) =>
  eq(`contador ${contador}`, hotp(SEED, contador, 6), esperado));

/* ────────────────────────────────────────────────── TOTP (RFC 6238) */
console.log('\n── TOTP · vetores da RFC 6238, apêndice B ──');
const b32sha1 = base32Codificar(SEED);
for(const [t, esperado] of [
  [59,'94287082'], [1111111109,'07081804'], [1111111111,'14050471'],
  [1234567890,'89005924'], [2000000000,'69279037'], [20000000000,'65353130']
]) eq(`T=${t}`, totp(b32sha1, {agoraMs: t * 1000, digitos: 8}), esperado);

const b32sha256 = base32Codificar(Buffer.from('12345678901234567890123456789012'));
for(const [t, esperado] of [[59,'46119246'], [1111111109,'68084774'], [20000000000,'77737706']])
  eq(`T=${t} sha256`, totp(b32sha256, {agoraMs: t * 1000, digitos: 8, algoritmo: 'sha256'}), esperado);

/* ─────────────────────────────────────── política do segundo fator */
console.log('\n── segundo fator · janela, reuso e formato ──');
const seg = segredoTotp();
const agora = 1_800_000_000_000;
const codigoAgora = totp(seg, {agoraMs: agora});
ok('aceita o código do passo atual', conferirTotp(seg, codigoAgora, {agoraMs: agora}).ok);
ok('aceita o do passo anterior (relógio atrasado)',
   conferirTotp(seg, totp(seg, {agoraMs: agora - 30_000}), {agoraMs: agora}).ok);
ok('aceita o do passo seguinte (relógio adiantado)',
   conferirTotp(seg, totp(seg, {agoraMs: agora + 30_000}), {agoraMs: agora}).ok);
ok('recusa fora da janela',
   !conferirTotp(seg, totp(seg, {agoraMs: agora - 120_000}), {agoraMs: agora}).ok);
eq('recusa código de tamanho errado',
   conferirTotp(seg, '1234', {agoraMs: agora}).motivo, 'formato');
eq('recusa código de outro segredo',
   conferirTotp(seg, totp(segredoTotp(), {agoraMs: agora}), {agoraMs: agora}).motivo, 'invalido');

const usado = conferirTotp(seg, codigoAgora, {agoraMs: agora});
eq('recusa o mesmo código duas vezes (reuso)',
   conferirTotp(seg, codigoAgora, {agoraMs: agora, ultimoPasso: usado.passo}).motivo, 'reuso');
ok('mas aceita o do passo seguinte depois do reuso',
   conferirTotp(seg, totp(seg, {agoraMs: agora + 30_000}), {agoraMs: agora + 30_000, ultimoPasso: usado.passo}).ok);

const uri = uriOtpauth({segredo: seg, gestor: 'gestora@floriano.pi.gov.br'});
ok('URI otpauth traz emissor, segredo e período',
   uri.startsWith('otpauth://totp/') && uri.includes('issuer=Samais') && uri.includes(`secret=${seg}`) && uri.includes('period=30'));

/* ────────────────────────────────────────────────────────── senha */
console.log('\n── senha · scrypt ──');
const barato = {N: 1 << 12, r: 8, p: 1, tamanho: 32};
const guardado = hashSenha('Transporte#Floriano-2026', barato);
ok('formato traz algoritmo e parâmetros', /^scrypt\$4096\$8\$1\$/.test(guardado));
ok('confere a senha certa', conferirSenha('Transporte#Floriano-2026', guardado));
ok('recusa a senha errada', !conferirSenha('Transporte#Floriano-2025', guardado));
ok('recusa hash corrompido', !conferirSenha('x', 'scrypt$1$2$3'));
ok('recusa hash de outro esquema', !conferirSenha('x', 'bcrypt$abc'));
ok('dois hashes da mesma senha diferem (sal por hash)',
   hashSenha('Transporte#Floriano-2026', barato) !== guardado);
ok('custo abaixo do padrão pede rehash', precisaRehash(guardado));
ok('custo no padrão não pede rehash', !precisaRehash(hashSenha('Transporte#Floriano-2026')));

console.log('\n── senha · força mínima ──');
ok('recusa curta',            !forcaSenha('Abc#123').aceita);
ok('recusa repetição',        !forcaSenha('aaaaaaaaaaaaaaaa').aceita);
ok('recusa sequência',        !forcaSenha('Abcdefghij#1').aceita);
ok('recusa uma só classe',    !forcaSenha('transportesanitario').aceita);
ok('recusa nome do gestor',   !forcaSenha('Gestora-Floriano-1', {nome: 'Gestora Floriano'}).aceita);
ok('recusa e-mail',           !forcaSenha('gestora#Samais2026', {email: 'gestora@floriano.pi.gov.br'}).aceita);
ok('aceita senha razoável',    forcaSenha('Rota!Micro-04-Amanhecer', {nome: 'Gestora Floriano'}).aceita);

/* ──────────────────────────────────────── códigos de recuperação */
console.log('\n── códigos de recuperação ──');
const {codigos, hashes} = codigosRecuperacao();
eq('gera oito', codigos.length, 8);
ok('guarda só hash', hashes.every(h => /^[0-9a-f]{64}$/.test(h)) && !hashes.some(h => codigos.includes(h)));
const usoR = conferirRecuperacao(codigos[3], hashes);
ok('aceita um código válido', usoR.ok && usoR.indice === 3);
eq('e o queima', usoR.restantes.length, 7);
ok('o queimado não serve de novo', !conferirRecuperacao(codigos[3], usoR.restantes).ok);
ok('recusa código inventado', !conferirRecuperacao('AAAAA-BBBBB', hashes).ok);

/* ───────────────────────────────────────────────────────── sessão */
console.log('\n── sessão ──');
const t0 = 1_800_000_000_000;
const s = novaSessao({agoraMs: t0});
ok('token com entropia suficiente', s.token.length >= 43);
eq('banco guarda o hash, não o token', s.hash, hashToken(s.token));
ok('token não sai do hash', !s.hash.includes(s.token));
ok('vale dentro da jornada',
   sessaoValida({expira_em: s.expiraEm}, t0 + 11 * 3600_000).ok);
eq('expira depois dela',
   sessaoValida({expira_em: s.expiraEm}, t0 + 13 * 3600_000).motivo, 'expirada');
eq('revogada não vale',
   sessaoValida({expira_em: s.expiraEm, revogado_em: new Date(t0)}, t0 + 1000).motivo, 'revogada');
eq('inexistente não vale', sessaoValida(null).motivo, 'inexistente');
ok('dois tokens nunca coincidem', novaSessao().token !== novaSessao().token);

/* ──────────────────────────────────────────── atraso por tentativa */
console.log('\n── tentativa ──');
eq('erro de digitação não atrasa', [0,1,2].map(atrasoDeTentativa), [0,0,0]);
eq('a partir da terceira, dobra', [3,4,5].map(n => atrasoDeTentativa(n) / 60000), [1,2,4]);
eq('teto de 15 minutos', atrasoDeTentativa(30) / 60000, 15);
ok('sem falha, sem bloqueio', bloqueadoAte(1, t0) === null);
eq('com falhas, devolve o instante de liberação',
   bloqueadoAte(4, t0).toISOString(), new Date(t0 + 120000).toISOString());

console.log(`\n${falhou ? '✗' : '✓'} ${passou} asserção(ões) passaram${falhou ? `, ${falhou} falharam` : ''}\n`);
process.exit(falhou ? 1 : 0);
