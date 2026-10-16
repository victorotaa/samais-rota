/* ═══════════════════════════════════════════════════════════════════
   Testes das regras da Portaria GM/MS 11.165/2026 (com a 11.164/2026)
   — sem navegador, sem dependência.

   Os casos são DADO, não código: testes/casos/portaria-11165-casos.json,
   cópia fiel de samais-os/produtos/rota/portaria-11165-casos.json, onde
   mora a especificação (portaria-11165.md). Para cada grupo, chama a
   função `grupo.funcao` de regras/portaria-11165.mjs com a entrada do
   caso e compara só as chaves presentes em `esperado` (convenção do meta).

   Rodar: node testes/portaria-11165.test.mjs
   ═══════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const raiz = path.dirname(fileURLToPath(import.meta.url));
const casos = JSON.parse(fs.readFileSync(path.join(raiz, 'casos', 'portaria-11165-casos.json'), 'utf8'));

let passou=0, falhou=0;
function ok(nome, cond, detalhe){
  if(cond){passou++; console.log('  ok   ·', nome)}
  else{falhou++; console.log('  FALHA·', nome, detalhe!==undefined?('→ '+JSON.stringify(detalhe)):'')}
}
function eq(nome,a,b){ ok(nome, JSON.stringify(a)===JSON.stringify(b), {obtido:a,esperado:b}) }

/* Só as chaves do esperado, na ordem do esperado: o caso diz o que importa. */
function recorte(obtido, esperado){
  const r = {};
  for(const k of Object.keys(esperado)) r[k] = (obtido && k in obtido) ? obtido[k] : undefined;
  return r;
}

/* Cada função recebe a entrada inteira do caso. As que precisam de "hoje"
   o leem da entrada — nunca do relógio da máquina. */
let regras = null;
try{
  regras = await import('../regras/portaria-11165.mjs');
}catch(e){
  console.log('\n── carga do módulo ──');
  ok('regras/portaria-11165.mjs carrega', false, e.code || e.message);
}

for(const grupo of casos.grupos){
  console.log('\n── '+grupo.secao+' ──');
  const fn = regras && regras[grupo.funcao];
  if(typeof fn !== 'function'){
    for(const c of grupo.casos) ok(c.id+' · '+c.nome, false, 'função ausente: '+grupo.funcao);
    continue;
  }
  for(const c of grupo.casos){
    let obtido;
    try{ obtido = fn(c.entrada) }
    catch(e){ ok(c.id+' · '+c.nome, false, 'lançou: '+e.message); continue }
    eq(c.id+' · '+c.nome, recorte(obtido, c.esperado), c.esperado);
  }
}

const total = casos.grupos.reduce((s,g)=>s+g.casos.length, 0);
console.log('\n'+(falhou?'✗ '+falhou+' falha(s), ':'✓ ')+passou+' asserção(ões) passaram · '+total+' casos no JSON\n');
process.exit(falhou?1:0);
