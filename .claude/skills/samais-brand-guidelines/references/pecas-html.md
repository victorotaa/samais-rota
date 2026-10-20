# Peças HTML: deck, apresentação, estudo, dossiê, landing, template

> Absorve a antiga skill `samais-html-presentation` (repositório `samais-rota`) e o sistema visual do
> `samais-rota/CLAUDE.md`, ancorados em `doutrina/padrao-dobras.md` e `doutrina/samais.css`. Onde o `samais-rota`
> divergia da doutrina do `samais-os`, vale o `samais-os` (ver `HISTORICO.md`). Referências vivas: a apresentação ao
> MS (`samais-copilot/apresentacao-ms/index.html`), o ROTA (`samais-rota`, `samais-rota.vercel.app`) e a LP do CoPilot
> (`samais-copilot/lp/index.html`).

## Sumário

1. Quando usar
2. Estrutura: dobras, anatomia, âncoras, ritmo, virada
3. Navegação e espaçamento
4. Dobras full-bleed (técnica)
5. Movimento
6. Autossuficiência e hospedagem
7. Voz e texto
8. Cases e atestados
9. Imagem
10. Efeito e componente de UI de fora (21st.dev)
11. Verificação e publicação

## 1. Quando usar

Todo pedido de estudo, apresentação, deck, one-pager, landing ou template HTML da Samais, e a revisão de um existente.
Governa **peça longa de rolagem**. Não governa slide, painel do OS nem formulário (para esses, o núcleo da skill e os
componentes do `samais.css`).

## 2. Estrutura

- **Uma dobra, uma ideia, uma âncora visual.** Duas ideias são duas dobras. Texto corrido empilhado não é dobra.
- Seções numeradas `01…N`. Cabeçalho de seção: eyebrow mono + título Syne à esquerda (alinhado ao topo), rótulo mono
  à direita.
- **Âncoras** (escolher uma por dobra):

| Âncora | Quando | Erro comum |
|---|---|---|
| Banda de imagem com parallax | abertura e fechamento; onde a peça precisa respirar | usar no meio, quebrando um raciocínio |
| Grade de cartões (3 ou 4) | itens paralelos e comparáveis | listar 6 |
| Bloco de princípios (ícone + título + frase) | regras que se sustentam sozinhas | virar cartão quando a ordem importa |
| Tabela | quando a comparação é o conteúdo | usar para o que é texto |
| Gráfico em SVG | quando o número tem forma | gráfico de um número só |

- **Ritmo:** peça toda escura cansa. Alternar `.fold` e `.fold-alt` e usar as duas dobras invertidas (`.fold-light`,
  `.fold-gold`; tokens em `tokens-e-tipografia.md`). Referência para 11 dobras: escuro · alt · **ouro** · escuro · alt ·
  **creme** · escuro · alt · **creme** · escuro · alt. Nunca duas dobras iguais em sequência.
- **A virada:** entre a dobra do problema e a da solução, uma dobra sem âncora, só tipografia, no ouro: Syne 700 em
  tamanho de manchete, até 20ch, uma ou duas palavras enfatizadas. Uma por peça.
- Footer: tagline *"Onde gestão se mede em vidas."* em itálico + paginação mono (componente `.rodape` no OS).

## 3. Navegação e espaçamento

- Barra **fixa no topo**, em vidro, com a marca e âncoras por seção; no mobile colapsa para `SA+` + menu. A seção
  corrente fica em ouro, por `IntersectionObserver` com `rootMargin:'-45% 0px -50% 0px'`.
- `scroll-margin-top` nas âncoras, para a barra não cobrir o eyebrow.
- Respiro entre dobras: **104px no desktop, 60px no mobile** (`padrao-dobras.md`).
- Armadilha conhecida (`samais-rota`): quando a classe `.wrap` zera o padding, o respiro vertical precisa de seletor
  específico (`section.wrap{padding-block:…}`); `section{padding}` sozinho não pega.

## 4. Dobras full-bleed (técnica, do `samais-rota`)

- A cor da dobra ocupa 100vw por `::before` (`left:50%; margin-left:-50vw; width:100vw; z-index:-1`); o conteúdo fica
  na coluna central.
- A dobra leva `z-index:0` e o canvas escuro mora no `html`. Se o `body` tiver fundo opaco, ele cobre o `::before`
  negativo e voltam as margens pretas. (O `samais.css` pinta `html` e `body`; numa peça com dobra full-bleed, confira na
  tela.)
- **Contraste da dobra light:** um seletor mais específico do tema escuro (ex.: `.sec-head .lede{color:var(--text-2)}`)
  vence o genérico `.fold-light p`. Criar override explícito por classe (`.fold-light .lede`) e conferir a dobra em
  screenshot (AA ≥ 4,5:1).

## 5. Movimento

Cinco comportamentos, e nenhum a mais (`padrao-dobras.md`):

1. **Revelação ao rolar:** `opacity 0→1` + `translateY(26px→0)`, 800ms, `cubic-bezier(.16,1,.3,1)`; em grade,
   escalonar 70ms por item (na dobra light, as linhas da tabela entram escalonadas).
2. **Parallax nas bandas:** 9% a 11%, limitado a 16% da altura do contêiner, via `requestAnimationFrame`.
3. **Contagem de número:** 1,6s, desaceleração cúbica, ao entrar em tela.
4. **Desenho do gráfico:** traço por `stroke-dashoffset`, barra por `scaleX` (com `transform-box:fill-box`), donut que
   varre.
5. **Capa animada**, quando a tese cabe em desenho: a metáfora em SVG se desenha **uma vez** e para;
   `preserveAspectRatio="xMidYMid meet"`.

Tudo atrás de `IntersectionObserver` com `unobserve` (anima uma vez), sob uma classe de ativação (`.js-anim`, só com JS e
sem `prefers-reduced-motion`) para nunca esconder conteúdo, e tudo desligado sob `prefers-reduced-motion`. Proibido:
dissolve, swirl, push, transição "de PowerPoint", efeito lupa, animação em laço.

## 6. Autossuficiência e hospedagem

- **Peça institucional não faz requisição externa** (fonte, imagem, script): abre por `file://`, de pen drive, sem rede.
  Fontes em base64 (subset `latin`); imagens a ~1400px, JPEG 76 progressivo, em base64 (~30 KB cada). Peça completa:
  ~450–600 KB. Conferir: nenhum `src=` ou `href=` com `http`.
- **Hospedar:** conferir o CSP antes. Fonte e imagem embutidas pedem `data:` em `font-src` e `img-src`; script inline
  pede o hash `sha256` do próprio script (o `samais-rota` tem `scripts/csp-hash.mjs`); `connect-src 'none'`. Servir o
  `dist` com os headers reais antes de publicar.
- Imagem hospedada pelo próprio repositório (Vercel), nunca hotlink do Drive: o Drive recusa o Referer da página.
  Download grande do Drive sai em base64 no disco: `jq -r '.content' | base64 -d`.
- Deploy dos repositórios `samais-*`: Vercel, time `samais` (`npx vercel --prod --scope samais`). No `samais-os`,
  publicar é mergear (regras de Git do `CLAUDE.md`).

## 7. Voz e texto

- Primeira pessoa do singular **ou** impessoal técnico; evitar o plural "nós".
- Público investidor: sem jargão nem sigla (moat, TAM, SKU, BDI, SPE, ATC, CDO, PMO, TMS…); português claro.
- Palavras vetadas: "humanizado", "excelência", "acolhimento".
- Audiência externa: padrão frio (`doutrina/padrao-frio.md`); vocabulário de preço e procedência pelo `CLAUDE.md`.
- Tagline sempre como fecho.
- **Sem campo de contato:** nada de e-mail, telefone, WhatsApp, formulário, `mailto` ou "fale conosco". A Samais só é
  rastreável por contato de saída dela; a peça fecha com a tese ou com link para produto ou demo.

## 8. Cases e atestados

- Atestados de capacidade técnica da empresa, conferidos em 12/10/2026: **CISNORPI** e **Ourinhos** (SAMU 192,
  transferência inter-hospitalar, regulação). Usar em material de SAMU, urgência, regulação e na tese de investidor.
- Case sempre em pretérito ("operou", "entregou") + "atestado disponível para verificação formal". Descrever só o que
  o documento sustenta; nunca fabricar narrativa operacional.
- O PDF do atestado de Ourinhos traz dado pessoal: não se publica nem se linka. Os recortes e o precedente de Ourinhos
  só entram em contexto paulista (`CLAUDE.md`).
- **Transporte sanitário não tem case:** a prova é o sistema ROTA (demo) + a lei (portarias, IBGE); a credencial de SAMU
  não se transporta para outro serviço.
- Não citar o Hospital Dr. Anísio Figueiredo nem a Santa Casa de Goioerê (`samais-rota/CLAUDE.md`).

## 9. Imagem

- **Princípio da Realidade vale para foto:** não usar foto de operação que não se pode comprovar. Sem imagem própria
  verificada, gerar grafismo abstrato e excluir no prompt pessoa, veículo, texto, número, bandeira, logotipo e fronteira
  de mapa. Toda imagem gerada leva `README.md` na pasta (modelo: `samais-copilot/docs/img/README.md`).
- Banco aprovado e vetos: `doutrina/imagens/README.md` (cópias WebP ≤ 1600px). Vetado: cena clínica ou dramática
  (sirene, sangue, reanimação, vítima), paciente identificável, estética policial, logo de terceiro.
- Superfície de foto não refrata nem leva vidro por cima; overlay escuro que cai para o fundo na base; `loading="lazy"`
  fora da primeira dobra; `alt` descritivo; `width`/`height` declarados.
- Aperto de mãos (parceria): sutil, baixa opacidade, sob vidro escuro, reservado ao fechamento.
- **Evidência:** print de fonte pública oficial (ex.: gov.br) junto à afirmação que embasa, em moldura de vidro com
  cabeçalho "Fonte oficial" e link.

## 10. Efeito e componente de UI de fora (21st.dev)

Regra de `regras-completas.md` (Ota, 15/10/2026):

1. O código vem pelo MCP do 21st (chave em segredo do ambiente, `API_KEY_21ST`, nunca no git, no bundle ou na
   conversa; plano gratuito: 2 retiradas por dia, escolher pela busca e pela prévia e mostrar ao Ota antes de gastar)
   ou pelo repositório aberto da biblioteca de origem (preferido quando existe).
2. Licença conferida por componente antes de copiar: MIT, Apache ou equivalente entra, com o aviso de licença no
   arquivo; AGPL ou GPL não entra; sem licença declarada, não entra.
3. Portado, não instalado: reescrito em CSS e JS puros, com os tokens do `samais.css`, sem CDN fora da allowlist, com
   `prefers-reduced-motion`.
4. A identidade manda sobre o efeito: dado não refrata; nada de neon, gradiente colorido ou vidro de template; ouro
   escasso.
5. Em raio-x, o CSS do efeito vai escopado no gerador, nunca em `css/samais.css` nem em `js/samais.js`.

Precedente: a página da UMMES (`samais-estudos/estudos/ummes-sp.html`), padrão em
`samais-estudos/referencias/apresentacao-html.md`, "Padrão de estudo v2".

## 11. Verificação e publicação

- Renderizar em navegador (Playwright headless) em 1440, 768 e 390px e ler a página, não o código; medir o DOM quando
  houver dúvida de espaçamento.
- `scroll-behavior:smooth` engana teste de rolagem: desligar no teste, ou usar screenshot de elemento.
- Rodar a lista de [checklist-contraste-mobile.md](checklist-contraste-mobile.md) antes de aprovar.
