# Design System — Samais Dark Mode
## Referência canônica para estudos municipais Samais
## Paleta e componentes alinhados ao padrão de Sorriso/MT

---

## Tokens de cor (obrigatórios)

```css
:root {
  /* Backgrounds */
  --bg:          #060709;
  --bg2:         #0c0e12;
  --bg3:         #131620;

  /* Ouro — cor primária da marca */
  --gold:        #C9A84C;
  --gold-light:  #EAC97A;
  --gold-dim:    #7a6430;

  /* Texto */
  --text:        #e8e5dc;
  --text-dim:    #9a9690;
  --text-muted:  #55524e;

  /* Cyan institucional — destaque de dados confirmados */
  --cyan:        #16a085;

  /* Status */
  --green:       #27ae60;
  --green-border: rgba(39,174,96,.25);
  --green-bg:    rgba(39,174,96,.06);
  --red:         #c0392b;
  --blue:        #2472a4;

  /* Bordas */
  --border:         rgba(201,168,76,.12);
  --border-strong:  rgba(201,168,76,.28);
  --border-cyan:    rgba(22,160,133,.28);

  /* Tipografia */
  --f-display: 'Syne', system-ui, sans-serif;
  --f-body:    'Plus Jakarta Sans', system-ui, sans-serif;
  --f-mono:    'JetBrains Mono', monospace;
}
```

---

## Google Fonts (sempre no `<head>`)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## CSS Base

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--f-body);
  font-size: 14.5px;
  line-height: 1.75;
  font-weight: 300;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 2px; }
```

---

## Layout

### Nav lateral fixo

```css
.study-nav {
  position: fixed;
  top: 0; left: 0;
  width: 240px;
  height: 100vh;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  padding: 40px 0;
  overflow-y: auto;
  z-index: 100;
}

.study-nav .nav-logo {
  padding: 0 28px 28px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 24px;
  font-family: var(--f-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: -0.01em;
}

.study-nav .nav-logo span {
  display: block;
  font-family: var(--f-mono);
  font-size: 9px;
  font-weight: 400;
  color: var(--text-muted);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-top: 4px;
}

.study-nav a {
  display: block;
  padding: 10px 28px;
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: all 0.2s;
}

.study-nav a:hover,
.study-nav a.active {
  color: var(--gold);
  border-left-color: var(--gold);
  background: rgba(201,168,76,0.04);
}
```

### Main

```css
.study-main {
  margin-left: 240px;
  min-height: 100vh;
}

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 80px;
}

section {
  padding: 100px 0;
  border-bottom: 1px solid var(--border);
}

@media (max-width: 900px) {
  .study-nav { display: none; }
  .study-main { margin-left: 0; }
  .container { padding: 0 24px; }
  section { padding: 56px 0; }
}
```

---

## Componentes

### 1. CAPA (Cover)

```html
<div class="cover">
  <div class="cover-image-layer" style="background-image: url('[URL_DA_IMAGEM_DO_MUNICIPIO]');"></div>
  <div class="cover-bg"></div>
  <div class="grid-bg"></div>
  <div class="container">
    <div class="cover-tag">Estudo de Precificação — Confidencial</div>
    <h1 class="cover-title">[NOME DO MUNICÍPIO]<br><em>[UF / CONSÓRCIO]</em></h1>
    <p class="cover-lead">[Descrição síntese em uma frase estratégica.]</p>
    <div class="cover-stats">
      <div class="cs"><div class="cs-num">[X]</div><div class="cs-label">[Label 1]</div></div>
      <div class="cs"><div class="cs-num">[Y]</div><div class="cs-label">[Label 2]</div></div>
      <div class="cs"><div class="cs-num">[Z]</div><div class="cs-label">[Label 3]</div></div>
      <div class="cs"><div class="cs-num">[W]</div><div class="cs-label">[Label 4]</div></div>
    </div>
  </div>
</div>
```

```css
.cover {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 72px 0;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border-strong);
}

/* Camada de imagem do município */
.cover-image-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.25;
  filter: saturate(0.7) contrast(1.05);
}

.cover-image-layer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6,7,9,0.4) 0%, rgba(6,7,9,0.92) 85%, var(--bg) 100%);
}

/* Fallback — gradiente dourado quando não há imagem */
.cover-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 65% 50% at 85% 25%, rgba(201,168,76,0.09) 0%, transparent 65%),
    radial-gradient(ellipse 45% 55% at 15% 80%, rgba(22,160,133,0.05) 0%, transparent 60%);
  pointer-events: none;
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(201,168,76,0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(201,168,76,0.035) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none;
}

.cover .container {
  position: relative;
  z-index: 2;
}

.cover-tag {
  font-family: var(--f-mono);
  font-size: 10px;
  color: var(--cyan);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cover-tag::before {
  content: '';
  width: 32px;
  height: 1px;
  background: var(--cyan);
}

.cover-title {
  font-family: var(--f-display);
  font-size: clamp(36px, 5.2vw, 62px);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 28px;
}

.cover-title em {
  font-style: italic;
  font-weight: 400;
  color: var(--gold);
}

.cover-lead {
  font-size: 17px;
  color: var(--text-dim);
  max-width: 720px;
  margin-bottom: 48px;
  line-height: 1.6;
}

.cover-stats {
  display: flex;
  gap: 56px;
  flex-wrap: wrap;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.cs {
  display: flex;
  flex-direction: column;
}

.cs-num {
  font-family: var(--f-display);
  font-size: 38px;
  font-weight: 800;
  color: var(--gold);
  line-height: 1;
}

.cs-label {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 8px;
}
```

### 2. Section header (para cada Parte)

```html
<section>
  <div class="eyebrow">Parte [N]</div>
  <h2 class="section-title">[Título da Parte]</h2>
  <p class="section-lead">[Lead introdutório com 2–3 linhas.]</p>
</section>
```

```css
.eyebrow {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 14px;
}

.section-title {
  font-family: var(--f-display);
  font-size: clamp(28px, 3.6vw, 44px);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
  line-height: 1.1;
  margin-bottom: 24px;
}

.section-lead {
  font-size: 16px;
  color: var(--text-dim);
  max-width: 780px;
  margin-bottom: 48px;
  line-height: 1.7;
}
```

### 3. Parte Divider (entre Partes — com imagem regional opcional)

```html
<div class="part-divider" style="background-image: url('[URL_IMAGEM_REGIONAL]');">
  <div class="part-divider-overlay"></div>
</div>
```

```css
.part-divider {
  height: 240px;
  background-size: cover;
  background-position: center;
  position: relative;
  margin: 0 -80px;
}

.part-divider-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--bg) 0%, rgba(6,7,9,0.4) 50%, var(--bg) 100%);
}

/* Fallback sem imagem */
.part-divider:not([style*="background-image"]) {
  background: linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.08) 50%, transparent 100%);
}
```

### 4. Cover Stats / Data Cards

```html
<div class="data-grid">
  <div class="data-card">
    <div class="dc-label">[Label]</div>
    <div class="dc-value">[Valor]</div>
    <div class="dc-unit">[Unidade]</div>
    <div class="dc-note">[Contexto opcional]</div>
  </div>
</div>
```

```css
.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 48px;
}

.data-card {
  background: var(--bg3);
  border: 1px solid var(--border-strong);
  padding: 28px;
  position: relative;
}

.data-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold), transparent);
}

.dc-label {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.dc-value {
  font-family: var(--f-display);
  font-size: clamp(26px, 3vw, 38px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.05;
}

.dc-unit {
  font-family: var(--f-mono);
  font-size: 12px;
  color: var(--gold);
  margin-top: 6px;
}

.dc-note {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 10px;
  line-height: 1.5;
}
```

### 5. Tabela padrão

```css
.tbl {
  width: 100%;
  border-collapse: collapse;
  margin: 24px 0 40px;
  font-size: 13.5px;
}

.tbl thead th {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold);
  padding: 14px 18px;
  background: var(--bg3);
  border-bottom: 1px solid var(--border-strong);
  text-align: left;
}

.tbl tbody tr {
  border-bottom: 1px solid var(--border);
}

.tbl tbody tr:nth-child(even) {
  background: rgba(255,255,255,0.015);
}

.tbl tbody tr:hover {
  background: rgba(201,168,76,0.04);
}

.tbl td {
  padding: 14px 18px;
  color: var(--text-dim);
  vertical-align: top;
}

.tbl td:first-child {
  color: var(--text);
  font-weight: 500;
}
```

### 6. Grid de Cenários (Mínimo / Base / Amplo)

```html
<div class="scenarios">
  <div class="sc-card">
    <div class="sc-tag">Cenário Mínimo</div>
    <div class="sc-subtitle">Mínimo regulatório PNAU</div>
    <div class="sc-body">[conteúdo]</div>
  </div>
  <div class="sc-card recommended">
    <div class="sc-star">★ RECOMENDADO</div>
    <div class="sc-tag">Cenário Base</div>
    <div class="sc-subtitle">Equilíbrio Samais</div>
    <div class="sc-body">[conteúdo]</div>
  </div>
  <div class="sc-card">
    <div class="sc-tag">Cenário Amplo</div>
    <div class="sc-subtitle">Cobertura ampliada</div>
    <div class="sc-body">[conteúdo]</div>
  </div>
</div>
```

```css
.scenarios {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin: 32px 0 48px;
}

.sc-card {
  background: var(--bg3);
  border: 1px solid var(--border);
  padding: 32px;
  position: relative;
}

.sc-card.recommended {
  border: 1px solid var(--gold);
  background: linear-gradient(180deg, rgba(201,168,76,0.06) 0%, var(--bg3) 100%);
  box-shadow: 0 0 40px rgba(201,168,76,0.08);
}

.sc-star {
  position: absolute;
  top: -1px;
  right: 24px;
  background: var(--gold);
  color: var(--bg);
  font-family: var(--f-mono);
  font-size: 9px;
  letter-spacing: 0.14em;
  font-weight: 600;
  padding: 4px 10px;
}

.sc-tag {
  font-family: var(--f-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 4px;
}

.sc-card.recommended .sc-tag { color: var(--gold); }

.sc-subtitle {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.sc-body {
  font-size: 13.5px;
  color: var(--text-dim);
  line-height: 1.7;
}

@media (max-width: 900px) {
  .scenarios { grid-template-columns: 1fr; }
}
```

### 7. Boxes de destaque coloridos

```html
<div class="box box-gold"><p>[Síntese estratégica]</p></div>
<div class="box box-cyan"><p>[Destaque institucional]</p></div>
<div class="box box-green"><p>[Validação fiscal / alinhamento federal]</p></div>
```

```css
.box {
  padding: 24px 28px;
  margin: 28px 0;
  border-left: 3px solid;
  font-size: 14.5px;
  line-height: 1.75;
}

.box-gold {
  border-color: var(--gold);
  background: rgba(201,168,76,0.05);
  color: var(--text);
}

.box-cyan {
  border-color: var(--cyan);
  background: rgba(22,160,133,0.05);
  color: var(--text);
}

.box-green {
  border-color: var(--green);
  background: var(--green-bg);
  color: var(--text);
}

.box strong { color: var(--gold); }
.box-cyan strong { color: var(--cyan); }
.box-green strong { color: var(--green); }
```

### 8. Zonas de imagem contextual

```html
<div class="context-card" style="background-image: url('[URL]');">
  <div class="context-overlay"></div>
  <div class="context-content">
    <div class="context-tag">[Tag]</div>
    <h4 class="context-title">[Título]</h4>
    <p class="context-text">[Texto]</p>
  </div>
</div>
```

```css
.context-card {
  position: relative;
  min-height: 280px;
  background-size: cover;
  background-position: center;
  margin: 32px 0;
  overflow: hidden;
  border: 1px solid var(--border);
}

/* Fallback sem imagem */
.context-card:not([style*="background-image"]) {
  background: var(--bg3);
}

.context-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(6,7,9,0.88) 0%, rgba(6,7,9,0.65) 100%);
}

.context-content {
  position: relative;
  z-index: 2;
  padding: 40px;
  max-width: 640px;
}

.context-tag {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 12px;
}

.context-title {
  font-family: var(--f-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.context-text {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.7;
}
```

### 9. Dado ausente

```html
<span class="data-missing">[Dado não localizado — verificar DATASUS/CNES/SIOPS]</span>
```

```css
.data-missing {
  display: inline-block;
  font-family: var(--f-mono);
  font-size: 11px;
  color: #F4A623;
  background: rgba(244,166,35,0.1);
  border: 1px solid rgba(244,166,35,0.25);
  padding: 2px 10px;
}
```

### 10. Bloco de Composição do Valor Contratual

```html
<div class="composition-block">
  <div class="composition-header">Composição do Valor Contratual</div>
  <table class="tbl tbl-composition">
    <!-- linhas do BDI -->
  </table>
  <div class="composition-total">
    <span class="ct-label">Valor Contratual Mensal</span>
    <span class="ct-value">R$ X.XXX.XXX</span>
  </div>
</div>
```

```css
.composition-block {
  background: var(--bg3);
  border: 1px solid var(--border-strong);
  padding: 40px;
  margin: 32px 0;
  position: relative;
}

.composition-block::before {
  content: 'PROPOSTA COMERCIAL PRELIMINAR';
  position: absolute;
  top: -1px;
  right: 32px;
  font-family: var(--f-mono);
  font-size: 9px;
  letter-spacing: 0.2em;
  font-weight: 600;
  background: var(--gold);
  color: var(--bg);
  padding: 4px 12px;
}

.composition-header {
  font-family: var(--f-display);
  font-size: 22px;
  font-weight: 600;
  color: var(--gold);
  margin-bottom: 24px;
}

.composition-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 24px;
  border-top: 1px solid var(--border-strong);
}

.ct-label {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.ct-value {
  font-family: var(--f-display);
  font-size: 44px;
  font-weight: 800;
  color: var(--gold-light);
  line-height: 1;
}
```

### 11. Argumento de Fechamento — R$/habitante/mês

```html
<div class="closing-argument">
  <div class="ca-label">Custo efetivo para o município</div>
  <div class="ca-value">R$ <span class="ca-num">X,XX</span> <span class="ca-unit">/ habitante / mês</span></div>
  <div class="ca-context">Equivalente a [comparativo: um café expresso, meio pão francês etc.]</div>
</div>
```

```css
.closing-argument {
  text-align: center;
  padding: 56px;
  background: linear-gradient(180deg, var(--bg3) 0%, var(--bg2) 100%);
  border: 1px solid var(--gold);
  margin: 48px 0;
}

.ca-label {
  font-family: var(--f-mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.ca-value {
  font-family: var(--f-display);
  font-size: clamp(48px, 7vw, 84px);
  font-weight: 800;
  color: var(--gold-light);
  line-height: 1;
  letter-spacing: -0.02em;
}

.ca-unit {
  font-size: 0.4em;
  color: var(--text-dim);
  font-weight: 400;
  letter-spacing: 0;
}

.ca-context {
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-dim);
  font-style: italic;
}
```

### 12. Score de Atratividade (gauge SVG)

```html
<div class="score-gauge-wrap">
  <svg viewBox="0 0 120 80" class="score-gauge">
    <path d="M10,70 A60,60 0 0,1 110,70" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8" stroke-linecap="round"/>
    <path d="M10,70 A60,60 0 0,1 110,70" fill="none" stroke="#C9A84C" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="188.5" stroke-dashoffset="[188.5 * (1 - score/10)]"/>
    <text x="60" y="62" text-anchor="middle" font-family="Syne" font-size="24" fill="#e8e5dc" font-weight="700">[SCORE]</text>
    <text x="60" y="77" text-anchor="middle" font-family="JetBrains Mono" font-size="7" fill="#C9A84C" letter-spacing="2">/10</text>
  </svg>
  <p class="score-label">Score de Atratividade</p>
</div>
```

### 13. Recomendação (Go / Atenção / No-Go)

```css
.recommendation {
  padding: 48px;
  border-left: 4px solid;
  margin: 40px 0;
}

.recommendation.go   { border-color: var(--green); background: var(--green-bg); }
.recommendation.warn { border-color: #F4A623; background: rgba(244,166,35,0.06); }
.recommendation.nogo { border-color: var(--red); background: rgba(192,57,43,0.08); }

.rec-verdict {
  font-family: var(--f-display);
  font-size: 52px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 20px;
}

.go   .rec-verdict { color: var(--green); }
.warn .rec-verdict { color: #F4A623; }
.nogo .rec-verdict { color: var(--red); }
```

### 14. Rodapé

```html
<footer>
  <div class="footer-brand">samais · gestão + saúde</div>
  <div class="footer-note">CONFIDENCIAL — Uso interno exclusivo · [Mês/Ano] · v[X]</div>
</footer>
```

```css
footer {
  padding: 48px 0;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-brand {
  font-family: var(--f-display);
  font-size: 17px;
  font-weight: 700;
  color: var(--gold);
}

.footer-note {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.15em;
  color: var(--text-muted);
}
```

---

## Scroll Spy JS (incluir sempre)

```javascript
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.study-nav a[href^="#"]');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });

sections.forEach(s => observer.observe(s));
```


### 15. Seção Dedicada — Samais CoPilot OS (obrigatória no OUTPUT A)

Esta seção é o diferencial competitivo central da Samais e deve receber tratamento visual premium — diferente de qualquer outra seção da proposta. Usar densidade visual maior, animação CSS suave, e linguagem que posiciona o produto como inovação inédita no mercado de SAMU no Brasil.

```html
<section id="copilot" class="section copilot-section">
  <div class="container">
    <div class="copilot-eyebrow">
      <span class="cp-dot"></span>
      Inovação Exclusiva Samais
    </div>

    <div class="copilot-header">
      <h2 class="copilot-title">Samais<br><em>CoPilot OS</em></h2>
      <p class="copilot-lead">
        O primeiro sistema de inteligência artificial desenvolvido especificamente
        para regulação médica de SAMU no Brasil — treinado no maior dataset
        proprietário de atendimento pré-hospitalar do país.
      </p>
    </div>

    <div class="copilot-grid">
      <div class="copilot-card">
        <div class="cp-icon">⚡</div>
        <div class="cp-card-title">Despacho em Tempo Real</div>
        <p class="cp-card-text">
          O CoPilot sugere ao médico regulador a unidade ideal para cada ocorrência —
          considerando localização em tempo real, capacidade de cada viatura e
          protocolo clínico da chamada — em menos de 4 segundos.
        </p>
      </div>
      <div class="copilot-card">
        <div class="cp-icon">🧠</div>
        <div class="cp-card-title">Dataset APH-BR Proprietário</div>
        <p class="cp-card-text">
          Treinado em centenas de milhares de ocorrências reais de SAMU
          em múltiplos estados, o modelo reconhece padrões de demanda,
          sazonalidade e perfil epidemiológico local — gerando inteligência
          específica para cada território operado.
        </p>
      </div>
      <div class="copilot-card">
        <div class="cp-icon">📊</div>
        <div class="cp-card-title">Dashboard de Gestão Contratual</div>
        <p class="cp-card-text">
          Indicadores contratuais em tempo real acessíveis ao gestor municipal:
          tempo-resposta médio, taxa de despacho em menos de 4 minutos,
          ocorrências por tipo e bairro — transparência total da operação.
        </p>
      </div>
      <div class="copilot-card">
        <div class="cp-icon">🔗</div>
        <div class="cp-card-title">Integração com Sistemas SUS</div>
        <p class="cp-card-text">
          Integração nativa com RNDS, sistemas estaduais de regulação,
          prontuários dos hospitais de referência e TFD — eliminando
          duplicidade de registro e acelerando a transferência regulada.
        </p>
      </div>
    </div>

    <div class="copilot-impact">
      <div class="cp-impact-label">Impacto operacional comprovado em contratos Samais</div>
      <div class="cp-impact-grid">
        <div class="cp-impact-item">
          <div class="cp-impact-num">↓ 23%</div>
          <div class="cp-impact-desc">Redução no tempo médio de despacho</div>
        </div>
        <div class="cp-impact-item">
          <div class="cp-impact-num">↑ 91%</div>
          <div class="cp-impact-desc">Taxa de despacho em menos de 4 minutos</div>
        </div>
        <div class="cp-impact-item">
          <div class="cp-impact-num">100%</div>
          <div class="cp-impact-desc">Rastreabilidade de ocorrências em tempo real</div>
        </div>
      </div>
    </div>

    <div class="box box-gold">
      <p>
        <strong>Nenhum outro operador de SAMU no Brasil dispõe de tecnologia equivalente.</strong>
        O CoPilot OS não é um software de terceiros adaptado — é um produto desenvolvido
        internamente pela Samais, com propriedade intelectual exclusiva e dataset que cresce
        a cada contrato operado. Contratar a Samais é contratar o estado da arte em gestão
        de urgência pré-hospitalar no Brasil.
      </p>
    </div>
  </div>
</section>
```

```css
/* ── COPILOT SECTION ── */
.copilot-section {
  background: linear-gradient(180deg, var(--bg) 0%, var(--bg2) 50%, var(--bg) 100%);
  border-top: 1px solid var(--border-gold);
  border-bottom: 1px solid var(--border-gold);
  position: relative;
  overflow: hidden;
}

.copilot-section::before {
  content: '';
  position: absolute;
  top: -300px; right: -200px;
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 65%);
  pointer-events: none;
}

.copilot-eyebrow {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--cyan);
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cp-dot {
  display: inline-block;
  width: 6px; height: 6px;
  background: var(--cyan);
  border-radius: 50%;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.7); }
}

.copilot-header {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 64px;
  align-items: start;
  margin-bottom: 64px;
}

.copilot-title {
  font-family: var(--f-display);
  font-size: clamp(48px, 6vw, 80px);
  font-weight: 700;
  line-height: 1.0;
  letter-spacing: -0.025em;
  color: var(--text);
}

.copilot-title em {
  font-style: italic;
  font-weight: 400;
  color: var(--gold);
  display: block;
}

.copilot-lead {
  font-size: 17px;
  color: var(--text-dim);
  line-height: 1.75;
  padding-top: 8px;
}

.copilot-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 48px;
}

.copilot-card {
  background: var(--bg3);
  border: 1px solid var(--border-gold);
  padding: 32px;
  position: relative;
  transition: border-color 0.3s, background 0.3s;
}

.copilot-card:hover {
  border-color: var(--gold);
  background: rgba(201,168,76,0.04);
}

.cp-icon {
  font-size: 28px;
  margin-bottom: 16px;
  filter: grayscale(0.3);
}

.cp-card-title {
  font-family: var(--f-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.cp-card-text {
  font-size: 13.5px;
  color: var(--text-dim);
  line-height: 1.7;
}

.copilot-impact {
  background: var(--bg3);
  border: 1px solid var(--border-strong);
  padding: 40px;
  margin-bottom: 32px;
  position: relative;
}

.copilot-impact::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold), var(--cyan), transparent);
}

.cp-impact-label {
  font-family: var(--f-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 32px;
}

.cp-impact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.cp-impact-num {
  font-family: var(--f-display);
  font-size: clamp(36px, 4vw, 52px);
  font-weight: 800;
  color: var(--gold-light);
  line-height: 1;
  margin-bottom: 10px;
}

.cp-impact-desc {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}

@media (max-width: 900px) {
  .copilot-header { grid-template-columns: 1fr; gap: 24px; }
  .copilot-grid { grid-template-columns: 1fr; }
  .cp-impact-grid { grid-template-columns: 1fr; gap: 20px; }
}
```

---

## Checklist final antes de entregar

- [ ] Paleta obrigatória aplicada (sem cores chapadas fora dos tokens)
- [ ] Fontes importadas (Syne + Plus Jakarta Sans + JetBrains Mono)
- [ ] Capa com imagem do município-alvo E fallback em gradiente
- [ ] 4 cover-stats em linha preenchidas
- [ ] Estrutura em Partes I–IX numerada corretamente
- [ ] Trio de cenários com Base Operacional badgeada como ★ RECOMENDADO
- [ ] Composição do Valor Contratual presente — **nenhuma palavra "lucro" ou "margem"**
- [ ] Valor contratual (mensal + anual + 5 anos) em `.ct-value`
- [ ] Argumento de fechamento em R$/habitante/mês
- [ ] Gauge SVG de score no Sumário Executivo
- [ ] Recomendação Go / Atenção / No-Go
- [ ] Dados ausentes marcados com `.data-missing` (nunca inventar)
- [ ] Rodapé com confidencialidade, mês/ano e versão
- [ ] Responsivo (nav some em <900px, padding reduz)
- [ ] Seção CoPilot OS presente no OUTPUT A com `.copilot-section` e `.cp-dot` animado
- [ ] Zero dependências externas de servidor
