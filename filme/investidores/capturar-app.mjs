// Grava o console ROTA de verdade (rota-app.html do próprio repo) para o comercial.
// Cada tela sai como sequência de quadros com os gráficos se construindo
// (arco, linha, barra, contador, linhas da tabela), e vira assets/app/<tela>.mp4.
// As caixas das regiões (cards e itens do menu) vão para assets/app/caixas.json:
// a câmera do index.html mira nelas, nunca em número digitado.
//
// Fontes: a página pede Google Fonts; aqui a requisição é respondida com os
// arquivos do npm (@fontsource), para a tela sair na fonte certa sem rede.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright');
const ffmpeg = require('@ffmpeg-installer/ffmpeg').path;

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(AQUI, '../..');
const NM = path.join(AQUI, 'node_modules');
const QUADROS = 48;          // 42 de construção (1,4 s) + 6 de pausa
const TELAS = [
  { v: 'painel' },
  { v: 'programacao' },
  { v: 'impressos', modo: 'embarque' },
  { v: 'frota' },
  { v: 'impressos', modo: 'relatorio', nome: 'relatorio' },
];

const tipo = (f) => f.endsWith('.css') ? 'text/css' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.svg') ? 'image/svg+xml'
  : f.endsWith('.woff2') ? 'font/woff2' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8';
const srv = http.createServer((q, r) => {
  const f = path.join(REPO, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404).end(); return; }
  r.writeHead(200, { 'Content-Type': tipo(f) }); r.end(fs.readFileSync(f));
});

const face = (fam, peso, arq, faixa = 'normal') =>
  `@font-face{font-family:'${fam}';font-style:${faixa};font-weight:${peso};font-display:block;src:url('https://fontes.local/${arq}') format('woff2')}`;
const CSS_FONTES = [
  face('Syne', '400 800', '@fontsource-variable/syne/files/syne-latin-wght-normal.woff2'),
  ...[300, 400, 500, 600, 700].map((p) => face('Inter', p, `@fontsource/inter/files/inter-latin-${p}-normal.woff2`)),
  ...[400, 500, 600].map((p) => face('JetBrains Mono', p, `@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${p}-normal.woff2`)),
].join('\n');

await new Promise((r) => srv.listen(8410, r));
const nav = await chromium.launch();
const pg = await nav.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await pg.route('https://fonts.googleapis.com/**', (rt) => rt.fulfill({ contentType: 'text/css', body: CSS_FONTES }));
await pg.route('https://fonts.gstatic.com/**', (rt) => rt.abort());
await pg.route('https://fontes.local/**', (rt) => {
  const rel = decodeURIComponent(new URL(rt.request().url()).pathname.slice(1));
  rt.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(path.join(NM, rel)) });
});
await pg.goto('http://127.0.0.1:8410/rota-app.html', { waitUntil: 'load' });
await pg.waitForTimeout(500);
await pg.click('#lg-enter');
await pg.waitForTimeout(1200);
await pg.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
await pg.evaluate(() => document.fonts.ready);
const faltam = await pg.evaluate(() => ['800 20px Syne', '400 20px Inter', '600 20px Inter', '500 12px "JetBrains Mono"']
  .filter((f) => ![...document.fonts].some((ff) => ff.status === 'loaded' && f.includes(ff.family.replace(/["']/g, '')))));
if (faltam.length) { console.error('fontes não carregadas:', faltam); process.exit(1); }

const caixas = {};
for (const tela of TELAS) {
  const a = await pg.$(`[data-view="${tela.v}"]`);
  if (a) { await a.click(); await pg.waitForTimeout(800); }
  if (tela.modo) {
    const b = await pg.$(`[data-act="modo-impresso"][data-arg="${tela.modo}"]`);
    if (b) { await b.click(); await pg.waitForTimeout(800); }
  }
  await pg.evaluate(() => window.scrollTo(0, 0));
  // o que se constrói na tela: o mesmo vocabulário do rota-app (data-len, line-draw, bar, fill, cv)
  await pg.evaluate((v) => {
    const r = document.querySelector('#v-' + v) || document;
    const $$ = (s) => [...r.querySelectorAll(s)];
    window.__A = {
      ar: $$('[data-len]').map((e) => ({ e, l: +e.getAttribute('data-len'), f: +e.getAttribute('data-frac') })),
      ln: $$('.line-draw').map((e) => ({ e, l: e.getTotalLength() })),
      ba: $$('.bar[data-h]').map((e) => ({ e, h: +e.getAttribute('data-h') })),
      wi: $$('.fill[data-w],.seg-a[data-w],.seg-b[data-w]').map((e) => ({ e, w: +e.getAttribute('data-w') })),
      nu: $$('.cv').map((e) => ({ e, to: +e.getAttribute('data-to'), d: +e.getAttribute('data-dec') || 0, p: e.getAttribute('data-pre') || '' })),
      tr: $$('tbody tr, .row'),
    };
  }, tela.v);
  const nome = tela.nome || tela.v;
  const dir = path.join(AQUI, 'captura', nome);
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < QUADROS; i++) {
    const p = Math.min(i / 42, 1);
    await pg.evaluate((p) => {
      const e = 1 - Math.pow(1 - p, 3), A = window.__A;
      A.ar.forEach((o) => { o.e.style.strokeDashoffset = o.l * (1 - o.f * e); });
      A.ln.forEach((o) => { o.e.style.strokeDasharray = o.l; o.e.style.strokeDashoffset = o.l * (1 - e); });
      A.ba.forEach((o) => { o.e.style.height = (o.h * e) + '%'; });
      A.wi.forEach((o) => { o.e.style.width = (o.w * e) + '%'; });
      A.nu.forEach((o) => { o.e.textContent = o.p + (o.to * e).toLocaleString('pt-BR', { minimumFractionDigits: o.d, maximumFractionDigits: o.d }); });
      A.tr.forEach((t, k) => { const q = Math.max(0, Math.min(1, (p * 1.4 - k * 0.07) / 0.34)), g = 1 - Math.pow(1 - q, 3);
        t.style.opacity = g; t.style.transform = 'translateY(' + (14 * (1 - g)) + 'px)'; });
    }, p);
    await pg.screenshot({ path: path.join(dir, String(i).padStart(3, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  // caixas: cards visíveis da tela (com o começo do texto, para achar pelo nome) e os itens do menu
  caixas[nome] = await pg.evaluate((v) => {
    const r = document.querySelector('#v-' + v) || document.body;
    const bx = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
    const cards = [...r.querySelectorAll('.card, .paper, .kpi, table')].filter((e) => {
      const b = e.getBoundingClientRect(); return b.width > 60 && b.height > 30 && b.top < 1080 && b.bottom > 0;
    }).map((e) => ({ cls: e.className && e.className.baseVal === undefined ? e.className : e.tagName, txt: e.innerText.replace(/\s+/g, ' ').trim().slice(0, 70), caixa: bx(e) }));
    const menu = Object.fromEntries([...document.querySelectorAll('[data-view]')].map((e) => [e.getAttribute('data-view'), bx(e)]));
    return { cards, menu };
  }, tela.v);
  execFileSync(ffmpeg, ['-y', '-v', 'error', '-framerate', '30', '-i', path.join(dir, '%03d.jpg'),
    '-vf', 'tpad=stop_mode=clone:stop_duration=6', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-g', '15', '-keyint_min', '15', '-sc_threshold', '0', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart',
    path.join(AQUI, 'assets/app', nome + '.mp4')], { stdio: 'inherit' });
  console.log('tela', nome, QUADROS, 'quadros ·', caixas[nome].cards.length, 'cards');
}
fs.writeFileSync(path.join(AQUI, 'assets/app/caixas.json'), JSON.stringify(caixas, null, 1));
await nav.close(); srv.close();
