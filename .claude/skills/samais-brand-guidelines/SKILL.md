---
name: samais-brand-guidelines
description: Aplica a identidade visual institucional da Samais Gestão em Saúde (dark-luxury, Syne/Inter/JetBrains Mono, navy-black e dourado) a qualquer artefato visual — dossiês HTML, apresentações, PDFs, documentos, teasers, propostas, slides, gráficos e peças de marketing. Use SEMPRE que o entregável for da Samais ou mencionar Samais, SAMU, dossiê, estudo municipal, proposta comercial, teaser, apresentação institucional, ou quando Ota pedir "padrão Samais", "identidade Samais" ou "dark-luxury". Também vale para revisar/corrigir peças existentes fora do padrão.
license: MIT (fork de anthropics/skills brand-guidelines, adaptado para Samais)
---

# Samais — Identidade Visual Institucional

## Visão geral

Sistema de design institucional da Samais Gestão em Saúde. Estética
dark-luxury editorial: profundidade, sobriedade e autoridade técnica.
Distinta da paleta operacional de campo do SAMU (navy/vermelho/branco) —
esta identidade é para peças INSTITUCIONAIS (dossiês, propostas,
apresentações a secretarias e investidores), não para material operacional
de ambulância/uniforme.

**Keywords**: Samais, dossiê, dark-luxury, identidade institucional,
proposta, teaser, estudo municipal, apresentação, branding saúde.

## Tokens de cor

**Base (fundos):**
- Fundo primário: `#04060C` (navy-black profundo) — variável CSS `--bg`
- Fundo elevado/cards: `#0A0E18` a `#0D1220`
- Bordas sutis: `rgba(212,168,87,.14)` ou `rgba(255,255,255,.06)`

**Acento (autoridade):**
- Dourado Samais: `#D4A857` — variável CSS `--gold` — títulos-chave,
  números de destaque, linhas divisórias, ícones
- Dourado atenuado: `rgba(212,168,87,.55)` para labels e kickers

**Texto:**
- Primário sobre escuro: `#EDEAE2` (off-white quente)
- Secundário: `#9A968C` a `#B0AEA5`
- Nunca branco puro `#FFFFFF` em blocos longos de texto

**Semânticas (usar com parcimônia):**
- Alerta/risco: âmbar `#DD8D0C` (fundo `rgba(221,141,12,.12)`)
- Crítico: `#C20D2F`
- Positivo/validado: verde sóbrio `#5F8C6A`

## Tipografia

- **Display/Títulos**: Syne (600–800) — headlines, números de seção,
  dados de impacto. Fallback: Arial Black.
- **Corpo**: Inter (400/500) — parágrafos, tabelas, UI. Fallback: Arial.
- **Dados/Labels técnicos**: JetBrains Mono (400/500) — valores
  monetários, métricas, códigos de lei, IDs, eixos de gráfico.
  Fallback: Courier New.
- Import padrão (HTML):
  `https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap`

## Regras de aplicação

1. **Hierarquia**: kicker em caps pequenas douradas → título Syne grande
   → deck/parágrafo de abertura em Inter com line-height generoso (1.6+).
2. **Dados sempre em JetBrains Mono** — valores em R$, percentuais, BDI,
   populações, frotas. Nunca dados em Syne.
3. **Dourado é escasso**: no máximo ~10% da superfície visual. Se tudo é
   dourado, nada é. Uso: números-chave, uma linha divisória, ícones de
   seção.
4. **Documentos de audiência EXTERNA** (secretarias, prefeitos, órgãos de
   controle): aplicar padrão FRIO — neutro, factual, sem advocacy — a
   identidade visual permanece, mas sem linguagem persuasiva interna e
   sem expor metodologia de cálculo proprietária.
5. **Separação de camadas em dossiês**: camada FACTUAL (edital, lei,
   dados) visualmente distinta da camada de INTERPRETAÇÃO ESTRATÉGICA
   (ex: blocos com borda âmbar para interpretação). Nunca fundir.
6. **Precificação**: sempre BDI decomposto por rubrica em tabela mono;
   nunca a palavra "lucro" ou "taxa de administração".
7. **Cenários**: Mínimo / Base / Amplo, sempre nesta ordem, em cards ou
   colunas comparáveis.
8. **Gráficos** (Chart.js/Recharts): fundo transparente, grid
   `rgba(255,255,255,.05)`, série principal em `#D4A857`, séries
   secundárias em tons de cinza-quente; labels em JetBrains Mono.

## Aplicação por tipo de artefato

- **HTML single-file (dossiês/estudos)**: dark mode obrigatório,
  navegação lateral fixa em desktop, seções numeradas (00, 01, 02...),
  responsivo até 380px.
- **Slides/PPTX**: fundo `#04060C`, um conceito por slide, número de
  destaque em Syne + dourado, corpo mínimo.
- **PDF/impresso**: manter dark-luxury em capas e divisórias; miolo pode
  invertido (fundo claro `#FAF9F5`, texto `#141413`, acentos dourados)
  para legibilidade de impressão.
- **Docs Word/relatórios FRIO**: sóbrio, tipografia Inter, dourado apenas
  em elementos estruturais (linhas, numeração).

## O que NUNCA fazer

- Misturar a paleta institucional com a paleta operacional SAMU
  (vermelho vivo) na mesma peça.
- Usar brasões municipais em peças de vídeo/institucionais.
- Gradientes coloridos, neon, glassmorphism genérico de template.
- Emojis em documentos institucionais.
