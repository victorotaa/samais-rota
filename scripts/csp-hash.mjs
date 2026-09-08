#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════
   Confere (ou atualiza) os hashes de script inline do CSP no vercel.json.

   O header vale para /(.*) — todas as páginas. Toda página com <script>
   inline precisa do seu hash na lista, e o hash muda a cada byte do
   script. Hash defasado não dá erro visível: a página abre e o
   JavaScript simplesmente não roda.

     node scripts/csp-hash.mjs           confere e sai 1 se divergir
     node scripts/csp-hash.mjs --write   grava a lista correta

   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gravar = process.argv.includes('--write');

/* Só bloco executável entra no cálculo. Bloco de dados
   (type="application/json") não é script para o CSP. */
const EXECUTAVEL = /^(?:text\/javascript|module|application\/javascript)$/i;

function scriptsInline(html){
  const achados = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while((m = re.exec(html)) !== null){
    const attrs = m[1], corpo = m[2];
    if(/\bsrc\s*=/i.test(attrs)) continue;
    const tipo = (attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1];
    if(tipo && !EXECUTAVEL.test(tipo)) continue;
    achados.push(corpo);
  }
  return achados;
}

const paginas = fs.readdirSync(raiz).filter(f => f.endsWith('.html')).sort();
const hashes = [];
const mapa = [];
for(const pagina of paginas){
  const html = fs.readFileSync(path.join(raiz, pagina), 'utf8');
  for(const corpo of scriptsInline(html)){
    const h = 'sha256-' + crypto.createHash('sha256').update(corpo, 'utf8').digest('base64');
    if(!hashes.includes(h)) hashes.push(h);
    mapa.push({pagina, hash: h});
  }
}

const caminhoVercel = path.join(raiz, 'vercel.json');
const bruto = fs.readFileSync(caminhoVercel, 'utf8');
const conf = JSON.parse(bruto);
const header = conf.headers
  .flatMap(h => h.headers)
  .find(h => h.key.toLowerCase() === 'content-security-policy');
if(!header){ console.error('CSP ausente do vercel.json'); process.exit(1) }

const atuais = (header.value.match(/'sha256-[A-Za-z0-9+/=]+'/g) || []).map(s => s.slice(1, -1));
const faltando = hashes.filter(h => !atuais.includes(h));
const sobrando = atuais.filter(h => !hashes.includes(h));

for(const {pagina, hash} of mapa){
  const marca = atuais.includes(hash) ? 'ok  ' : 'FALTA';
  console.log(`  ${marca} · ${pagina.padEnd(20)} ${hash}`);
}
for(const h of sobrando) console.log(`  SOBRA · ${' '.repeat(20)} ${h}`);

if(!faltando.length && !sobrando.length){
  console.log(`\n  CSP em dia · ${hashes.length} hash(es), ${paginas.length} páginas conferidas`);
  process.exit(0);
}

if(!gravar){
  console.error(`\n  CSP defasado · ${faltando.length} faltando, ${sobrando.length} sobrando`);
  console.error('  Rode: node scripts/csp-hash.mjs --write');
  process.exit(1);
}

const lista = hashes.map(h => `'${h}'`).join(' ');
header.value = header.value.replace(
  /script-src 'self'[^;]*/,
  `script-src 'self' ${lista}`
);
fs.writeFileSync(caminhoVercel, JSON.stringify(conf, null, 2) + '\n');
console.log(`\n  vercel.json atualizado · ${hashes.length} hash(es)`);
