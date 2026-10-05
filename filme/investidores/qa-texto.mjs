// Confere a tipografia do comercial: NENHUMA PALAVRA ÓRFÃ e nenhuma linha que
// estoure o próprio espaço — medido na fonte real, não contado em caracteres.
//
// Mesma regra de samais-os/scripts/conferir-orfas.mjs (órfã = última linha com 1
// ou 2 palavras, num bloco de 5+ palavras e mais de uma linha), adaptada ao vídeo:
// aqui o texto vive dentro de cenas que o runtime esconde e de palavras que a
// timeline desloca. Por isso a medição
//   · força todas as cenas visíveis,
//   · leva a timeline ao fim de cada cena (peso variável e afins no estado final),
//   · agrupa as palavras por offsetTop — que ignora transform, então uma palavra
//     no meio de uma animação não parece estar em outra linha.
//
//   node qa-texto.mjs            (sai 1 se achar órfã ou estouro)
// Regra do ROTA (samais-rota/CLAUDE.md): título partido à mão em linhas leva
// pelo menos duas palavras em cada linha.
//
// playwright-core do projeto; sem ele, o Playwright global da máquina
const { chromium } = await import('playwright-core').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'));
import { resolve } from 'node:path';

const arquivo = resolve(process.argv[2] || 'index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium' });
const pag = await navegador.newPage({ viewport: { width: 1920, height: 1080 } });
await pag.goto('file://' + arquivo, { waitUntil: 'load' });
await pag.evaluate(() => document.fonts.ready);
await pag.waitForTimeout(600);

const achados = await pag.evaluate(() => {
  const st = document.createElement('style');
  st.textContent = '.scene{visibility:visible!important;display:block!important;opacity:1!important}';
  document.head.appendChild(st);
  const tl = window.__timelines.main;
  const saida = [];
  // posição de layout acumulada pela cadeia de offsetParent: ignora transform,
  // então palavra em plena animação (ou dentro da máscara) fica na linha certa
  const abs = (el) => { let x = 0, y = 0; for (let e = el; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return { x, y }; };
  for (const cena of document.querySelectorAll('.scene.clip')) {
    const fim = +cena.dataset.start + +cena.dataset.duration;
    tl.seek(Math.max(0, fim - 0.3), false);
    for (const bloco of cena.querySelectorAll('.h1,.h2,.h3,.sub,.grande,.tagline')) {
      const id = cena.id + ' ' + (bloco.id || bloco.className.split(' ')[0]);
      // 1 · cada linha composta à mão cabe no quadro (folga de 48 px)
      for (const l of bloco.querySelectorAll('.l')) {
        const { x } = abs(l), larg = Math.max(l.scrollWidth, l.offsetWidth);
        const range = document.createRange(); range.selectNodeContents(l);
        const w = range.getBoundingClientRect().width / (l.getBoundingClientRect().width / l.offsetWidth || 1);
        const x0 = x + (l.offsetWidth - Math.min(w, larg)) * (getComputedStyle(l).textAlign === 'center' || getComputedStyle(bloco).textAlign === 'center' ? 0.5 : 0);
        if (x0 < 48 || x0 + w > 1920 - 48 || l.scrollWidth > l.clientWidth + 1)
          saida.push(`ESTOURO ${id}: “${l.textContent.trim()}” ocupa ${Math.round(w)}px a partir de x ${Math.round(x0)}`);
      }
      // 1b · título partido em linhas: pelo menos duas palavras por linha
      const ls = [...bloco.querySelectorAll(':scope > .l, :scope .l')];
      if (ls.length > 1) for (const l of ls) { const n = l.textContent.trim().split(/\s+/).length; if (n < 2) saida.push(`LINHA DE UMA PALAVRA ${id}: “${l.textContent.trim()}”`); }
      // 2 · órfã: última linha com 1–2 palavras num bloco de 5+ palavras
      const ws = [...bloco.querySelectorAll('.w')];
      if (!ws.length) continue;
      const linhas = [];
      for (const w of ws) {
        const top = abs(w).y;
        let l = linhas.find((x) => Math.abs(x.top - top) <= 8);
        if (!l) linhas.push(l = { top, n: 0, txt: [] });
        l.n++; l.txt.push(w.textContent.trim());
      }
      linhas.sort((a, b) => a.top - b.top);
      const ult = linhas[linhas.length - 1];
      const resumo = linhas.map((l) => l.txt.join(' ')).join(' ⏎ ');
      if (linhas.length > 1 && ws.length >= 5 && ult.n <= 2) saida.push(`ÓRFÃ   ${id}: “${resumo}”`);
      else saida.push(`ok     ${id}: ${linhas.length} linha(s) · “${resumo}”`);
    }
  }
  return saida;
});
await navegador.close();
const ruins = achados.filter((a) => !a.startsWith('ok'));
console.log(achados.join('\n'));
console.log(ruins.length ? `\n✗ ${ruins.length} problema(s) de composição` : '\n✓ nenhuma órfã, nenhum estouro');
process.exit(ruins.length ? 1 : 0);
