# Revisão completa — ROTA · console de despacho (`rota-app.html`)

| | |
|---|---|
| **Alvo** | `rota-app.html` · https://samais-rota.vercel.app/rota-app.html · commit `927da76` |
| **Referência** | `docs/ROTA-SPEC.md` v1.0 · `CLAUDE.md` do repositório |
| **Método** | Leitura integral do código (845 linhas, 49 KB de JS) · walkthrough automatizado com Playwright em 12 larguras (1440→320) · fluxo completo logado: painel → programação → baixa → regenerar → impressos → impressão → tema claro → mobile · medição de contraste WCAG · inspeção do deploy |
| **Data** | ago/2026 |
| **Uso** | Interno Samais |

---

## 0 · Veredito em um parágrafo

O protótipo cumpre o que a spec promete para a Fase 1: é uma peça de demonstração completa, coerente com a identidade Samais, que percorre a esteira inteira (cadastro → programação → impresso → baixa → painel → relatório) sem erro de JavaScript, sem rolagem horizontal em nenhuma largura e com impressos A4 que saem corretos. **Não é implantável como sistema de produção, e a própria spec diz isso.** O que esta revisão acrescenta são **quatro defeitos que contradizem a tese central do produto** — "o papel é cidadão de primeira classe" e "o registro conferido é o documento que sustenta o repasse" — e que precisam ser corrigidos **antes** de o protótipo ser mostrado a uma secretaria, porque um técnico atento os encontra em cinco minutos.

---

## 1 · O que está certo — e não pode se perder na Fase 2

- **A esteira está inteira.** Seis módulos (RF-01 a RF-07) funcionam encadeados; o estado é consistente entre telas; o roteador é simples e previsível (`render()`, L462).
- **"Papel primeiro" está materializado.** Manifesto semanal, folha de embarque/reembarque com tique e assinatura, relatório mensal — em A4 absoluto, margens de 14 mm, `break-inside:avoid` nos blocos. Impressão verificada: sai limpa.
- **As regras regulatórias estão no código, não só no texto.** RN-05 (elegibilidade >50 km ≤500 km), RN-07 (prazo CNES de 60 dias com alerta), RN-08 (farol de suspensão), RN-03 (maca → ambulância), RN-01 (acompanhante ocupa assento). Isso é o argumento comercial da spec, e está demonstrável.
- **Zero dependência externa de script.** Nenhum `<script src>`, nenhum CDN, nenhuma biblioteca de gráfico — SVG e CSS puros, como manda o `CLAUDE.md`. Isso torna o arquivo auditável e o deploy trivial.
- **Acessibilidade de movimento respeitada.** `prefers-reduced-motion` desliga animações e count-ups (L370, L841).
- **Mobile funciona.** Sidebar vira gaveta com scrim, topbar reduz, tabelas rolam dentro do próprio contêiner sem arrastar a página (verificado em 390 e 320 px).
- **Tema claro existe e persiste** (`localStorage`, L822/L842) — e o contraste do texto principal passa AA nos dois temas.

---

## 2 · Achados por severidade

Cada item traz **onde** (linha), **evidência** (o que o teste mostrou), **efeito** e **correção**.

### 2.1 · Bloqueantes — **corrigidos** (PR seguinte a esta revisão)

> Os quatro itens abaixo foram corrigidos e verificados por walkthrough automatizado: a baixa grava km = 777 / L = 55 / diárias = 3 exatamente como digitado e recusa km vazio; o relatório passa a contar paciente-deslocamento (3 realizados · 8 programados no seed, contra 6 "viagens elegíveis" antes); Ctrl+P fora de Impressos imprime um aviso com o caminho certo e nunca o último papel; o toast some na impressão. O texto original fica como registro do que estava errado e por quê.

**B1 · A baixa descarta o que o gestor digita.**
- Onde: `confirmBaixa()`, L789–791; `fld()`, L810.
- Evidência: digitei km = 777, combustível = 55 L, diárias = 3 e confirmei. Gravado: `{km:16, litros:1, diarias:3}`. Só as diárias sobrevivem, porque só esse campo tem `id` (`bx-diarias`). Km e litros são recalculados por fórmula (`v.km*2` e `Math.round(v.km/9)`) e o valor digitado é ignorado.
- Efeito: **o único ato humano do sistema — transcrever a prancheta — não é gravado.** Um técnico de secretaria que testar a baixa com um número diferente do previsto vê o sistema "corrigir" o que ele lançou. Isso contradiz a tese "papel primeiro" na frente do cliente.
- Correção: dar `id` aos três campos em `darBaixa()` e ler os valores em `confirmBaixa()`; manter a fórmula apenas como **sugestão pré-preenchida**, nunca como substituto. Validar: km > 0, litros ≥ 0.

**B2 · A viagem inteira vira "elegível federal" se um único paciente for.**
- Onde: `viagemElegivel()`, L393; contagem no relatório, L721–722; modal do relatório, L798.
- Evidência: V04 (Radioterapia + **Quimioterapia**) e V08 (Radioterapia + Radioterapia + **Neurologia infantil**) aparecem como "elegível federal · >50 km". O relatório mensal conta **viagens** elegíveis.
- Efeito: o cofinanciamento das Portarias 11.164/11.179 remunera o **deslocamento do paciente** em radioterapia ou hemodiálise — não a viagem. Contar viagens infla a comprovação e, em auditoria, é exatamente o tipo de erro que suspende repasse. O documento que a spec chama de "o que fatura" está superestimando.
- Correção: a unidade de comprovação passa a ser **paciente-deslocamento elegível**. O relatório mostra "deslocamentos elegíveis: N (de M pacientes transportados)". A viagem pode continuar recebendo uma marca "contém elegíveis", nunca "é elegível".

**B3 · Imprimir de qualquer tela que não seja Impressos sai em branco.**
- Onde: `#print-root` vazio até `renderPaper()` rodar (L257, L717); `@media print` esconde `#app` (L277).
- Evidência: Ctrl+P no Painel → página branca. Confirmado em emulação de impressão.
- Efeito: o gestor que tentar imprimir o painel ou a lista de pacientes (comportamento natural) recebe folha em branco e conclui que "a impressão não funciona".
- Correção: ou popular `#print-root` com a tela corrente quando não houver papel ativo, ou — mais simples e coerente com a spec — mostrar um aviso na impressão ("Impressos saem pela aba Impressos") em vez de nada.

**B4 · O toast sai impresso.**
- Onde: `toast()`, L815 — `div` com `position:fixed` anexada ao `body`, sem classe e sem regra em `@media print`.
- Evidência: "Baixa registrada · 3 presença(s)" apareceu no rodapé da folha impressa. `imprimirEmbarque()` (L768) dispara `window.print()` 140 ms após renderizar, dentro da janela de 1,9 s do toast.
- Efeito: folha oficial de embarque impressa com um balão de notificação em cima.
- Correção: dar classe `.toast` e `display:none` em `@media print`; ou não disparar toast antes de imprimir.

### 2.2 · Altos — **corrigidos**

> Os cinco itens abaixo foram corrigidos e verificados. O farol passa a medir data (5 / 45 / 75 dias produzem verde / âmbar / vermelho); tratamento e necessidade viraram campos tipados, e "Radiologia" deixou de ser contada como radioterapia; a alocação escolhe por perfil de trajeto **e** capacidade, com quebra automática — quarenta pacientes extras num destino geram quatro viagens de 24/24, 24/24, 24/24 e 10/24, nenhuma acima da lotação; o custo passa a somar só o combustível do período mais km × custo/km declarado em `CONFIG`; e a ocupação separa programada (39%) de realizada (35%), com só a realizada no relatório. O texto original fica como registro.
>
> **Um achado durante a correção:** alocar só por capacidade mandava as viagens de 252 km para a van de sete lugares, porque cabia. O código original tinha uma intenção não declarada — trajeto intermunicipal vai de micro-ônibus, que é onde há assistente a bordo. A regra final preserva essa preferência por perfil de trajeto e usa a capacidade como filtro, não como critério.

### 2.2-bis · Altos — texto original do achado

**A1 · O farol de suspensão não mede dias.**
- Onde: `farolRepasse()`, L569–571.
- Evidência: "dias" é a diferença entre índices de dia da semana (0–4). O painel mostra "1/90" e nunca chegará a 30, 60 ou 90. Sem registro nenhum, vira 99.
- Efeito: a RN-08 — a regra mais importante para o dinheiro — está apenas encenada. Na demo passa; num piloto com datas reais, o farol fica verde para sempre.
- Correção: datas reais (`Date`) nos lançamentos; `dias = hoje − último registro comprovado`. É a primeira coisa a fazer quando a semana deixar de ser fixa.

**A2 · Regras de negócio decididas por regex em texto livre.**
- Onde: L392 (`/hemodi|radio/i` sobre `trat`), L417–418 (`/ambul/i` sobre `nec`).
- Efeito: "Maca" sem a palavra "ambulância" vai para o micro-ônibus; "Radiologia" (exame) seria contado como radioterapia. Em dado vindo de cadastro humano isso quebra silenciosamente.
- Correção: campos tipados — `tratamento ∈ {hemodialise, radioterapia, quimioterapia, consulta, …}` e `necessidade ∈ {nenhuma, cadeirante, maca, menor}` — já previstos no modelo de dados da spec (§7).

**A3 · Lotação estourada não divide a viagem.**
- Onde: L421–422 — se os assentos excedem a van, vai para o micro-ônibus; se excedem o micro-ônibus, **nada acontece** e a viagem sai com ocupação acima de 100%.
- Evidência: não ocorre no seed (nenhuma viagem >100%), mas o caminho existe e a alocação usa índices fixos (`veiculos[0]`, `[1]`, `[2]`) — qualquer mudança na ordem da frota quebra a programação.
- Correção: alocação por **tipo e capacidade**, com quebra em N viagens quando exceder; nunca por índice.

**A4 · Custo estimado mistura períodos e usa número mágico.**
- Onde: L480 e L728 — `custo = soma de TODOS os abastecimentos + km da semana × 0,90`.
- Efeito: abastecimentos são somados sem filtro de semana; o `0,90` (R$/km de "operação") não está documentado em lugar nenhum. O KPI "Custo estimado" — parte da tríade exigida pela portaria (RN-06) — não é reproduzível.
- Correção: custo = combustível **do período** + (km do período × custo variável por km declarado em configuração da base). O valor por km vem do modelo de custo da Samais, e deve ser visível ao gestor.

**A5 · "Taxa de ocupação" é a programada, não a realizada.**
- Onde: L478 e L729 — `assentos/lot` sobre viagens **programadas**, incluindo as não concluídas.
- Efeito: a portaria pede taxa de ocupação como mecanismo de gestão de frota; o que importa é quem **embarcou** (presentes ÷ lotação). Hoje uma viagem com 8 programados e 5 presentes conta 8.
- Correção: duas métricas com nome distinto — "ocupação programada" (planejamento) e "ocupação realizada" (comprovação). Só a segunda vai ao relatório.

### 2.3 · Médios — dívida que a Fase 2 herda se não for tratada

**M1 · HTML montado por concatenação com escape parcial.**
- Onde: 11 `innerHTML`; `esc()` (L452) aplicada a alguns campos e não a outros (`cns`, `placa`, `id`, `data`, `cnesPrazo`, nomes de destino passam sem escape); `fld()` (L810) injeta `value="…"` sem escape; `esc()` não trata aspas, então não protege atributos.
- Efeito hoje: nenhum — o seed é fixo. Efeito na Fase 2: **XSS armazenado** no primeiro nome de paciente com `<` ou `"` vindo do banco.
- Correção: um único caminho de render que escape tudo por padrão (template literal com função `h()` que escapa; ou `textContent` + `createElement`). Não corrigir campo a campo.

**M2 · 20 `onclick` inline com IDs interpolados.**
- Efeito: impede qualquer Content-Security-Policy sem `'unsafe-inline'` — a Fase 2 (dado sensível de saúde, LGPD) precisa de CSP. Também acopla markup a nomes globais.
- Correção: delegação de eventos no `main` com `data-action` / `data-id`.

**M3 · Navegação e modal sem semântica de acessibilidade.**
- Itens do menu são `<a>` **sem `href`** (L321–327): não têm papel de botão, não ativam com Enter/Space.
- Modal (L812) sem `role="dialog"`, sem `aria-modal`, sem gestão de foco; **Esc não fecha** (só clique no fundo, L814). Confirmado no teste.
- Botão hambúrguer sem `aria-label`; três campos do login com `<label>` sem `for`.
- Correção: `<button>` no menu; `role="dialog" aria-modal="true"`, foco no primeiro campo ao abrir, Esc fecha, foco volta ao disparador.

**M4 · IDs SVG duplicados.**
- Onde: `gDefs()` (L582) é repetido em cada gráfico → vários `<linearGradient id="gGold">` no mesmo DOM. Confirmado: `gGold`, `gArea` duplicados.
- Efeito: funciona por sorte (o navegador usa o primeiro); é HTML inválido e quebra ao exportar SVG.
- Correção: definir os gradientes uma vez, no `<svg>` oculto do topo, junto do `#glassDistort`.

**M5 · Contraste reprovado em rótulos.**
- Medido: `--dim` sobre fundo — **2,25:1 no claro, 2,98:1 no escuro** (falha AA, mínimo 4,5:1). Usado em `.sb-sec`, `.crumb`, `.sublbl`, `.login-note` — rótulos pequenos em mono, que são justamente os mais difíceis de ler. `--gold-soft` no claro: 2,97:1 — é a cor do número central do donut e dos links.
- Correção: escurecer `--dim` no claro para ≈ `#6E675B` (o `--muted`, que passa com 4,75:1) e clarear no escuro para ≈ `#8A8377`; no tema claro, número central do donut em `--gold-deep`.

**M6 · Regeneração de programação reatribui IDs.**
- Onde: `gerarProgramacao()` zera `_seq` e recria `V01…` por ordem de iteração (L409–411); `lancamentos` é indexado por esse ID e não é limpo.
- Evidência: no seed atual os IDs saem estáveis (ordem determinística) e os 6 lançamentos sobrevivem. **Risco latente**: adicionar um paciente na segunda-feira desloca todos os IDs e os lançamentos passam a apontar para viagens erradas.
- Correção: ID derivado de conteúdo (`dia+destino+veículo`) ou persistente; nunca sequencial por iteração.

**M7 · Refração declarada, nunca usada.**
- `.refract` (L63) não aparece em nenhum elemento. A spec (RF-08) e o `CLAUDE.md` prometem refração no desktop; ou aplica-se `.refract` ao sidebar/topbar, ou remove-se a regra e a promessa.

### 2.4 · Baixos — higiene

- **L1** · Datas fixas: `HOJE='qua'`, `SEMANA='06–10/jul/2026'` (L369), "Emitido em 09/jul/2026" no manifesto (L757). Aceitável na demo; documentar como tal na tela.
- **L2** · `dot-frota` fixo em "1" no HTML (L324); só `dot-lanc` é atualizado (L816).
- **L3** · Login com senha pré-preenchida `••••••••` (L306). Em demo pública, dá a impressão de credencial real; trocar por campo vazio + texto "demo: qualquer senha".
- **L4** · `favicon` ausente (404 no console).
- **L5** · Tabelas com `min-width:560px` + `overflow-x:auto` (L183–184). Não gera rolagem de página (verificado), mas é a exceção que o `CLAUDE.md` só admite para papel A4. Para o app é defensável; registrar a decisão.
- **L6** · `paperEmbarque()` cai em `viagens[0]` se o ID não existir (L760) — imprime a viagem errada em silêncio em vez de avisar.

---

## 3 · Revisão de front

**Layout e identidade.** Fiel ao sistema visual do repositório: tokens, Syne/Inter/JetBrains Mono, vidro líquido no sidebar, topbar e cartões, brilho ambiente radial fixo. Hierarquia tipográfica limpa. Os seis KPIs e os sete gráficos leem bem em 1440 e reflowam em 1024 e 768 sem quebra.

**Mobile (390/360/320).** Gaveta lateral com scrim funciona; topbar esconde o que não cabe; sem rolagem horizontal de página em nenhuma largura. Único ponto: cartões de viagem na Programação ficam longos — considerar colapsar a lista de pacientes por padrão em telas estreitas.

**Impressos.** O melhor módulo do protótipo. A4 real (210 mm), margens 14 mm via `@page`, quebras de bloco corretas, nota LGPD em cada documento. Dois defeitos já listados (B3, B4).

**Tema claro.** Consistente, agradável, e o texto principal passa AA. Rótulos em `--dim` e o número do donut em `--gold-soft` reprovam (M5).

**Animações.** Count-up, arco de donut, linha desenhando, barras — todas com `requestAnimationFrame` e desligadas sob `prefers-reduced-motion`. Sóbrias, dentro da doutrina.

**Acessibilidade.** É a área mais fraca (M3, M5): menu não operável por teclado, modal sem semântica, contraste de rótulos. Nada disso é caro de corrigir, e tudo isso aparece em qualquer avaliação de conformidade que um ente público venha a exigir.

---

## 4 · Revisão de código

**Estrutura.** Um arquivo, um escopo global, funções nomeadas por módulo, estado em variáveis globais (`pacientes`, `veiculos`, `viagens`, `lancamentos`). Para protótipo é a escolha certa — lê-se de cima a baixo. Para Fase 2 não sobrevive: o estado precisa virar um objeto único com funções puras de derivação (programação, KPIs, relatório), para que o mesmo código rode contra seed e contra API.

**Segurança.** Hoje o risco é zero porque não há entrada externa. A Fase 2 introduz entrada externa em todos os campos, e o código atual tem os três clássicos: `innerHTML` com escape parcial (M1), `onclick` inline (M2) e ausência de CSP. **Tratar M1 e M2 antes de ligar o backend**, não depois.

**Regras de negócio.** As regras certas estão implementadas — mas três delas (B2, A1, A5) com a unidade errada: viagem em vez de paciente-deslocamento, índice de dia em vez de data, programado em vez de realizado. São erros de **modelagem**, não de código, e é por isso que precisam ser resolvidos agora: a Fase 2 vai herdar o modelo.

**Testabilidade.** Zero testes, e a estrutura atual não permite testar sem navegador. Ao separar derivação de render (acima), `gerarProgramacao`, `viagemElegivel`, `farolRepasse` e o cálculo do relatório viram funções puras testáveis com Node — e são exatamente as que carregam risco regulatório.

**Tamanho.** 49 KB de JS inline é o limite do confortável para single-file. Manter single-file na Fase 1.5; na Fase 2, separar em módulos ES.

---

## 5 · Infra e deploy

| Item | Situação | Ação |
|---|---|---|
| Hospedagem | Vercel, projeto `samais-rota`, git-linked (bot comenta nos PRs) | — |
| `vercel.json` | **Ausente.** Nenhum header de segurança, nenhum `noindex`, nenhuma CSP | Criar. Base pronta em `samais-copilot/rota-proposta/vercel.json` (HSTS, nosniff, frame-ancestors, Referrer-Policy, `X-Robots-Tag: noindex`) |
| Indexação | Demo pública com tela de login e dados com formato de CNS, indexável por buscador | `noindex` **hoje** — antes de qualquer outra coisa desta tabela |
| CSP | Impossível com os 20 `onclick` inline | Depois de M2 |
| `package.json` | **Gitignorado** — dependências e scripts de build invisíveis no repositório | Versionar. Um repositório que não mostra suas dependências não passa em diligência |
| Fontes | Google Fonts, externo | Aceitável para o console do gestor (online por definição). Auto-hospedar se a Fase 2 exigir CSP estrita |
| Vídeo | `assets/rota.mp4`, 11 MB no repositório | Aceitável; considerar Git LFS se crescer |
| Offline | Sem service worker, sem cache | Coerente com a spec (papel é o offline). Manter assim |
| Backend | Nenhum | Fase 2 — ver §6 |

**Páginas irmãs no mesmo deploy.** `municipios.html` e `transporte.html` ainda carregavam o link do gov.br que cai em "Conteúdo Restrito" — **corrigido nesta revisão**, pelo mesmo padrão aplicado ao `index.html`. `transporte.html` faz **hotlink de três ativos em `cloudfront.net`** (duas imagens e um MP4 gerados por IA): vão sumir quando aquele CDN expirar, e o `CLAUDE.md` proíbe hotlink. Não consegui baixá-los desta sessão (egress bloqueado); precisam ser trazidos para `assets/` a partir da sua máquina. Sobram em `transporte.html` dois links para o portal do CONASS (notícia com URL datada) e um para o ato normativo na BVS — o segundo é o formato que a regra de links admite; os dois primeiros merecem virar citação no texto. `monitoramento.html` é um radar interno com onze domínios de prefeituras e ministérios públicos; como é ferramenta de prospecção e não peça de cliente, os links são o conteúdo — manter, mas revisar periodicamente.

---

## 6 · Guia de implantação

A spec já dá o roteiro em fases. O que falta é o **como**, base a base. Este guia assume a Fase 1.5 concluída (defeitos B1–B4 e A1–A5 corrigidos) e serve tanto para o piloto com dado real quanto para a Fase 2.

### 6.1 · Pré-requisitos por base — sem isto, não instalar

| Insumo | Quem entrega | Formato |
|---|---|---|
| Lista de pacientes autorizados | Central de Regulação / comissão de TFD | Nome, CNS, nascimento, tratamento, destino, recorrência, acompanhante, necessidade, **nº do processo e validade** |
| Distância oficial município → cada destino | Secretaria, em base rodoviária | km, com fonte — define elegibilidade e não pode ser estimada |
| Frota | Secretaria (cedida) ou Samais | Placa, tipo, lotação, hodômetro, intervalo de revisão, **nº CNES ou data de recebimento** (para o prazo de 60 dias) |
| Motoristas e assistentes | Samais | Nome, veículo fixo |
| Regime de custeio | Contrato | Custo variável por km declarado (substitui o `0,90` do código) |
| Encarregado LGPD e RIPD | Samais | Antes do primeiro dado real — exigência da spec §8 |

### 6.2 · Semana 0 — instalação

1. Publicar o console com `vercel.json` (headers + `noindex`) e URL própria da base.
2. Cadastrar destinos com distância oficial; cadastrar frota com CNES; cadastrar pacientes a partir da lista da regulação. **Nada é digitado de memória** — cada linha vem de documento.
3. Gerar a programação da primeira semana e conferir com o gestor viagem a viagem: veículo certo, lotação, maca em ambulância, elegibilidade por paciente.
4. Imprimir o manifesto e afixar no ponto de guarda; imprimir as folhas de embarque da semana.

### 6.3 · Semana 1 — operação-sombra

- A operação roda **só no papel**: motorista e assistente conferem embarque e reembarque na folha, anotam km e abastecimento.
- O gestor **não dá baixa ainda**. No fim da semana, compara as folhas com o que o sistema previu. Toda divergência (paciente que não estava na lista, destino diferente, km fora do previsto) vira correção de cadastro.
- Critério para avançar: **zero divergência de cadastro** na segunda semana de sombra.

### 6.4 · Semana 2 em diante — baixa diária

- Prancheta devolvida → baixa no mesmo dia (presenças, faltas, km, litros, diárias). O farol de suspensão passa a ter data real.
- Toda sexta: painel da semana revisado com o gestor; faltas recorrentes reportadas à regulação (RN-09).
- Todo abastecimento lançado no dia; anomalia de consumo (km/l fora da faixa do veículo) investigada na semana.

### 6.5 · Mês 1 — primeira prestação de contas

- Relatório mensal de comprovação gerado do sistema, **com a unidade certa** (paciente-deslocamento elegível), assinado pelo gestor e entregue à secretaria.
- Conferência cruzada: total de deslocamentos elegíveis no relatório = soma das folhas de embarque arquivadas. Se não bater, o relatório não sai.
- Folhas do mês arquivadas até a conferência; descarte seguro depois (RN-10).

### 6.6 · Treinamento

| Público | Duração | Conteúdo |
|---|---|---|
| Gestor local | 4 h presenciais + 1 h remota na semana 2 | Cadastro por CNS; programação e conferência; impressos; baixa; leitura do painel e do farol; relatório mensal; o que é dado sensível e como descartar |
| Motoristas e assistentes | 45 min | A folha: tique de embarque na saída, de reembarque no retorno, assinatura, km e abastecimento. **Nenhum paciente fica no destino sem registro.** Devolução da prancheta |
| Secretaria | 30 min | O que o relatório mensal comprova, como conferir contra as folhas, o que suspende o repasse |

### 6.7 · Testes de aceite — mapeados aos critérios da spec §10

| # | Critério da spec | Como testar | Aceite |
|---|---|---|---|
| 1 | Gestor enxerga só a sua base | Dois gestores, duas bases; cada um tenta acessar a outra pela URL e pela API | Bloqueado no banco (RLS), não só na tela |
| 2 | Esteira completa | Cadastro → programação → impressão → baixa → painel → relatório em uma base, sem tocar em outra | Todos os passos registrados no `audit_log` |
| 3 | Impressos idênticos ao protótipo | Imprimir manifesto, folha e relatório em A4 | Margens 14 mm, blocos sem quebra, sem toast, sem página em branco |
| 4 | Farol muda de estado | Simular último registro há 10, 45 e 75 dias | Verde / âmbar / vermelho |
| 5 | Audit log | Cada baixa, cadastro e emissão de documento | Autor, timestamp, entidade, payload; trilha imutável |
| 6 | Dado ilegível em repouso | Ler o banco sem a chave | Campos sensíveis cifrados |
| **7** | **Baixa grava o digitado** | Digitar km e litros diferentes do previsto | **Gravado o que foi digitado** — critério novo, deste documento |
| **8** | **Comprovação por paciente** | Viagem mista (elegível + não elegível) | **Relatório conta só os elegíveis** — critério novo |

### 6.8 · Go / no-go para a Fase 2

Só abrir o backend quando: B1–B4 corrigidos · A1–A5 corrigidos · M1 e M2 corrigidos (senão o backend nasce inseguro) · modelo de dados da spec §7 revisado com a unidade "paciente-deslocamento" · encarregado LGPD nomeado · região Brasil confirmada no provedor.

**Reuso disponível.** O repositório `samais-copilot` já tem `supabase/schema.sql` e `supabase/migrations/0001_audit_hash_chain.sql` — um `audit_log` com cadeia de hash, que é exatamente o requisito "trilha imutável" da spec §8. Vale adaptar em vez de reescrever.

---

## 7 · Backlog priorizado

| Prioridade | Item | Esforço | Fase |
|---|---|---|---|
| 1 | `vercel.json` com headers e `noindex` | 30 min | agora |
| 2 | B1 · baixa grava o digitado | 1 h | 1.5 |
| 3 | B2 · comprovação por paciente-deslocamento | 3 h | 1.5 |
| 4 | B3 · impressão fora de Impressos | 1 h | 1.5 |
| 5 | B4 · toast fora da impressão | 15 min | 1.5 |
| 6 | A1 · farol com datas reais | 2 h | 1.5 |
| 7 | A2 · campos tipados (tratamento, necessidade) | 2 h | 1.5 |
| 8 | A4 · custo por período + km configurável | 1 h | 1.5 |
| 9 | A5 · ocupação programada × realizada | 1 h | 1.5 |
| 10 | A3 · alocação por capacidade com quebra de viagem | 4 h | 1.5 |
| 11 | M5 · contraste dos rótulos nos dois temas | 30 min | 1.5 |
| 12 | M3 · menu em `<button>`, modal com `role`, Esc, foco | 2 h | 1.5 |
| 13 | M4 · gradientes SVG definidos uma vez | 15 min | 1.5 |
| 14 | M1 · render com escape por padrão | 4 h | antes da 2 |
| 15 | M2 · delegação de eventos, sem `onclick` inline | 3 h | antes da 2 |
| 16 | M6 · IDs de viagem por conteúdo | 1 h | antes da 2 |
| 17 | Separar derivação de render + testes em Node | 1 dia | antes da 2 |
| 18 | `package.json` versionado | 5 min | agora |
| 19 | `transporte.html` · trazer os ativos do cloudfront para `assets/` | 30 min | agora, da sua máquina |
| 20 | M7, L1–L6 | 1 h | quando couber |

Total estimado da Fase 1.5: **cerca de três dias de trabalho**, com o protótipo passando a sustentar uma demonstração a técnico de secretaria sem ressalva.

---

## 8 · O que não foi verificado

- **A URL publicada.** O egress desta sessão bloqueia `*.vercel.app`; a revisão foi feita sobre o código servido localmente. Headers reais do Vercel não foram inspecionados — a ausência de `vercel.json` no repositório é o que fundamenta a recomendação.
- **`package.json`.** Gitignorado; scripts e dependências de deploy não foram auditados.
- **Reprodução de vídeo** nas páginas irmãs: o Chromium do ambiente não decodifica H.264.
- **Contraste sobre vidro.** As medições são de cor sobre fundo sólido; sobre o vidro translúcido o contraste real varia com o que está atrás — verificar visualmente após corrigir M5.

---

*Onde gestão se mede em vidas.*
