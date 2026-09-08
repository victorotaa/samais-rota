/* ═══════════════════════════════════════════════════════════════════
   ROTA · autenticação — senha, segundo fator e sessão.

   Tudo aqui é `node:crypto`: nenhuma dependência, nenhum provedor.
   Trocar Supabase por Neon ou RDS não muda uma linha deste arquivo —
   o que muda é de onde vêm as linhas de `gestores` e `sessoes`.

   O módulo é puro de propósito: não abre conexão, não lê ambiente, não
   sabe o que é HTTP. Recebe dados, devolve decisão. É o que torna a
   política de acesso verificável sem subir nada.

   Base: docs/FASE2-BACKEND.md §3.3 · ROTA-SPEC §10.
   ═══════════════════════════════════════════════════════════════════ */
import crypto from 'node:crypto';

/* ─── Senha ────────────────────────────────────────────────────────
   scrypt com os parâmetros gravados junto do hash. Quando o custo
   subir, hash antigo continua conferindo e é reescrito no próximo
   acesso bem-sucedido — por isso `precisaRehash`.                    */

export const CUSTO_PADRAO = {N: 1 << 15, r: 8, p: 1, tamanho: 32};

export function hashSenha(senha, custo = CUSTO_PADRAO){
  const sal = crypto.randomBytes(16);
  const chave = crypto.scryptSync(senha.normalize('NFKC'), sal, custo.tamanho,
    {N: custo.N, r: custo.r, p: custo.p, maxmem: 256 * 1024 * 1024});
  return `scrypt$${custo.N}$${custo.r}$${custo.p}$${sal.toString('base64')}$${chave.toString('base64')}`;
}

export function conferirSenha(senha, guardado){
  if(typeof guardado !== 'string') return false;
  const partes = guardado.split('$');
  if(partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const [, N, r, p, salB64, chaveB64] = partes;
  const sal = Buffer.from(salB64, 'base64');
  const esperada = Buffer.from(chaveB64, 'base64');
  let obtida;
  try{
    obtida = crypto.scryptSync(senha.normalize('NFKC'), sal, esperada.length,
      {N: +N, r: +r, p: +p, maxmem: 256 * 1024 * 1024});
  }catch{ return false }
  return obtida.length === esperada.length && crypto.timingSafeEqual(obtida, esperada);
}

export function precisaRehash(guardado, custo = CUSTO_PADRAO){
  const partes = String(guardado || '').split('$');
  if(partes.length !== 6 || partes[0] !== 'scrypt') return true;
  return +partes[1] < custo.N || +partes[2] < custo.r || +partes[3] < custo.p;
}

/* Força mínima. Não é teatro de complexidade: comprimento manda, e o
   que se recusa é o previsível — repetição, sequência, e o que o
   próprio contexto entrega (nome, e-mail, município da base).        */
const SEQUENCIAS = ['0123456789','abcdefghijklmnopqrstuvwxyz','qwertyuiop','asdfghjkl'];

export function forcaSenha(senha, contexto = {}){
  const problemas = [];
  const s = String(senha || '').normalize('NFKC');
  if(s.length < 12) problemas.push('mínimo de 12 caracteres');
  if(/^(.)\1*$/.test(s) && s.length) problemas.push('caractere repetido');
  const baixa = s.toLowerCase();
  for(const seq of SEQUENCIAS){
    for(let i = 0; i + 6 <= seq.length; i++){
      if(baixa.includes(seq.slice(i, i + 6))) { problemas.push('sequência previsível'); i = seq.length }
    }
  }
  for(const [campo, valor] of Object.entries(contexto)){
    const v = String(valor || '').toLowerCase().split(/[@\s.]+/).filter(x => x.length >= 4);
    if(v.some(x => baixa.includes(x))) problemas.push(`não pode conter ${campo}`);
  }
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter(re => re.test(s)).length;
  if(classes < 3) problemas.push('use ao menos três entre minúscula, maiúscula, número e símbolo');
  return {aceita: problemas.length === 0, problemas: [...new Set(problemas)]};
}

/* ─── Base32 (RFC 4648) — é o alfabeto que os aplicativos leem ──── */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Codificar(buf){
  let bits = 0, valor = 0, saida = '';
  for(const byte of buf){
    valor = (valor << 8) | byte; bits += 8;
    while(bits >= 5){ saida += B32[(valor >>> (bits - 5)) & 31]; bits -= 5 }
  }
  if(bits > 0) saida += B32[(valor << (5 - bits)) & 31];
  while(saida.length % 8) saida += '=';
  return saida;
}

export function base32Decodificar(texto){
  let bits = 0, valor = 0; const saida = [];
  for(const ch of String(texto).toUpperCase().replace(/=+$/,'').replace(/\s/g,'')){
    const i = B32.indexOf(ch);
    if(i < 0) throw new Error('base32 inválida');
    valor = (valor << 5) | i; bits += 5;
    if(bits >= 8){ saida.push((valor >>> (bits - 8)) & 255); bits -= 8 }
  }
  return Buffer.from(saida);
}

/* ─── Segundo fator: TOTP (RFC 6238 sobre HOTP, RFC 4226) ────────── */

export const PASSO = 30;          // segundos por código
export const DIGITOS = 6;
export const JANELA = 1;          // ±1 passo: relógio do celular atrasa

export function segredoTotp(bytes = 20){
  return base32Codificar(crypto.randomBytes(bytes));
}

export function hotp(segredoBuf, contador, digitos = DIGITOS, algoritmo = 'sha1'){
  const c = Buffer.alloc(8);
  c.writeBigUInt64BE(BigInt(contador));
  const mac = crypto.createHmac(algoritmo, segredoBuf).update(c).digest();
  const off = mac[mac.length - 1] & 0x0f;
  const bin = ((mac[off] & 0x7f) << 24) | (mac[off+1] << 16) | (mac[off+2] << 8) | mac[off+3];
  return String(bin % 10 ** digitos).padStart(digitos, '0');
}

export function passoAtual(agoraMs = Date.now(), passo = PASSO){
  return Math.floor(agoraMs / 1000 / passo);
}

export function totp(segredoB32, {agoraMs = Date.now(), digitos = DIGITOS, passo = PASSO, algoritmo = 'sha1'} = {}){
  return hotp(base32Decodificar(segredoB32), passoAtual(agoraMs, passo), digitos, algoritmo);
}

/* Confere e devolve o passo usado. Quem chama **precisa** gravar esse
   passo em `gestores.totp_ultimo_passo`: sem isso, quem vê o código
   por cima do ombro reusa ele nos 30 segundos seguintes.             */
export function conferirTotp(segredoB32, codigo, {
  agoraMs = Date.now(), digitos = DIGITOS, passo = PASSO,
  janela = JANELA, ultimoPasso = null, algoritmo = 'sha1'
} = {}){
  const limpo = String(codigo || '').replace(/\D/g, '');
  if(limpo.length !== digitos) return {ok: false, motivo: 'formato'};
  const buf = base32Decodificar(segredoB32);
  const atual = passoAtual(agoraMs, passo);
  for(let d = -janela; d <= janela; d++){
    const c = atual + d;
    if(c < 0) continue;
    const esperado = Buffer.from(hotp(buf, c, digitos, algoritmo));
    const veio = Buffer.from(limpo);
    if(veio.length === esperado.length && crypto.timingSafeEqual(veio, esperado)){
      if(ultimoPasso !== null && c <= ultimoPasso) return {ok: false, motivo: 'reuso'};
      return {ok: true, passo: c};
    }
  }
  return {ok: false, motivo: 'invalido'};
}

export function uriOtpauth({segredo, gestor, base = 'Samais ROTA', digitos = DIGITOS, passo = PASSO}){
  const rotulo = encodeURIComponent(`${base}:${gestor}`);
  const q = new URLSearchParams({secret: segredo, issuer: base, algorithm: 'SHA1',
    digits: String(digitos), period: String(passo)});
  return `otpauth://totp/${rotulo}?${q}`;
}

/* Códigos de recuperação: o gestor perde o celular no meio do mês e a
   viagem de amanhã não espera suporte. Guarda-se só o hash.          */
export function codigosRecuperacao(quantos = 8){
  const codigos = [], hashes = [];
  for(let i = 0; i < quantos; i++){
    const c = crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g).join('-');
    codigos.push(c);
    hashes.push(crypto.createHash('sha256').update(c).digest('hex'));
  }
  return {codigos, hashes};
}

export function conferirRecuperacao(codigo, hashes){
  const h = crypto.createHash('sha256')
    .update(String(codigo || '').toUpperCase().trim()).digest('hex');
  const i = hashes.indexOf(h);
  return i < 0 ? {ok: false} : {ok: true, indice: i, restantes: hashes.filter((_, j) => j !== i)};
}

/* ─── Sessão ───────────────────────────────────────────────────────
   O token vai para o cliente; o banco guarda só o hash. Vazar o dump
   de `sessoes` não dá acesso a nada.                                 */

export const SESSAO_HORAS = 12;   // uma jornada; não se herda o turno alheio

export function novaSessao({horas = SESSAO_HORAS, agoraMs = Date.now()} = {}){
  const token = crypto.randomBytes(32).toString('base64url');
  return {
    token,
    hash: crypto.createHash('sha256').update(token).digest('hex'),
    expiraEm: new Date(agoraMs + horas * 3600_000)
  };
}

export function hashToken(token){
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

export function sessaoValida(sessao, agoraMs = Date.now()){
  if(!sessao) return {ok: false, motivo: 'inexistente'};
  if(sessao.revogado_em) return {ok: false, motivo: 'revogada'};
  if(new Date(sessao.expira_em).getTime() <= agoraMs) return {ok: false, motivo: 'expirada'};
  return {ok: true};
}

/* ─── Bloqueio por tentativa ───────────────────────────────────────
   Atraso crescente em vez de bloqueio seco: cinco erros de digitação
   não podem tirar a gestora do sistema no dia do embarque.           */

export const TENTATIVAS_ATE_ATRASO = 3;
export const ATRASO_MAX_MIN = 15;

export function atrasoDeTentativa(falhas){
  if(falhas < TENTATIVAS_ATE_ATRASO) return 0;
  const min = Math.min(2 ** (falhas - TENTATIVAS_ATE_ATRASO), ATRASO_MAX_MIN);
  return min * 60_000;
}

export function bloqueadoAte(falhas, ultimaFalhaMs){
  const atraso = atrasoDeTentativa(falhas);
  return atraso ? new Date(ultimaFalhaMs + atraso) : null;
}
