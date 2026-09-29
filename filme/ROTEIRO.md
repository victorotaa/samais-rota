# ROTA · filme publicitário

**Formato** 1920×1080 · 30 fps · ~82 s · som com narração · montagem v3 sobre vídeo real
**Público** investidor e intermediário
**Voz** Sterling (`dc382508-c8bd-443c-8cb2-46e57b8d2e6f`) · engine **ElevenLabs** — decidido por teste de escuta em 29/09; MiniMax é a reserva, Seed Speech está vetada

## A tese, em uma frase

O governo criou o programa e o repasse, **mas não entregou a estrutura que executa**. Esse vão é o mercado: grande porque o repasse é nacional e contínuo, pouco disputado porque operar exige atestado que quase ninguém tem. E a Samais entrega a operação **com o sistema que gere a frota e os pacientes** — tecnologia à frente da saúde pública.

O filme abre e fecha na pessoa que depende do transporte. São dois respiros curtos, não um bloco: constatação, sem apelo.

## Regras desta peça

- Nenhum valor de investimento — nada de cotas, aporte, payback ou percentual.
- **Nenhuma data como urgência.** A portaria entra como o fato que criou o repasse, não como relógio correndo.
- **Nunca afirmar que a falta de transporte interrompe o tratamento.** Quem faz hemodiálise chega de qualquer maneira, porque não chegar pode matar — vai por meio próprio, e o custo cai sobre ele. O que o transporte muda é quem carrega o peso de chegar, não a existência do tratamento.
- **Pessoas, na régua do CoPilot.** Gente em rotina calma: sendo recebida, regulação na mesa, equipe conferindo prancheta, reencontro. Nunca maca, sirene, urgência ou paciente identificável em sofrimento.
- Sem campo de contato, sem "fale conosco".
- Todo plano gerado leva o selo `IMAGEM ILUSTRATIVA`. A base vem do banco Higgsfield da casa (gerações CoPilot/Manduri), não do `rota.mp4`.

## Idioma — pt-BR, e como travar

A API não expõe parâmetro de idioma. O português brasileiro se garante por engine e por texto:
- Números **por extenso**: "três mil e trezentos", nunca "3.300".
- Cada take **abre com palavra nasal** — "São", "Não", "Três" —, porque o começo da frase fixa a língua.
- Takes curtos, para que um desvio não se propague.
- Siglas fonetizadas: **SAMÚ**, sem tônica no SÁ.
- Evitar construções idênticas ao espanhol, que é o que puxa o sotaque.

---

## Decupagem

### 00 · Abertura · 0–7 s

**Imagem** Cena gerada A — estrada vazia ao amanhecer, câmera baixa. Tipografia mono `SEG · QUA · SEX` acendendo em sequência, em ouro.

**Narração** *(nova)* "Três vezes por semana, o mesmo trajeto. Para quem faz hemodiálise, chegar ao tratamento é parte do tratamento."

**SFX** Silêncio, depois um drone grave subindo.

**Fonte** `rota-proposta/index.html` — *"três vezes por semana, indefinidamente"* e *"essa previsibilidade é parte do tratamento"*.

---

### 01 · O programa existe · 7–15 s

**Imagem** Corte seco em `frota-frente.jpg`: o micro-ônibus do programa, "Agora tem Especialistas · Caminhos da Saúde", "SUS · Ministério da Saúde", "Novo PAC".

**Tipografia** Canto inferior, mono 10 px: `CAMINHOS DA SAÚDE · NOVO PAC · MINISTÉRIO DA SAÚDE`

**Narração** ✓ gravada — "São três mil e trezentos veículos. Um bilhão e quatrocentos milhões de reais, em frota comprada pela União."

**SFX** Clique seco no corte.

**Fonte** `assets/noticia-3300.jpg` (gov.br); `samais-rota/index.html:687`.

---

### 02 · O repasse é contínuo · 15–25 s

**Imagem** Hyperlapse das três fotos da frota, cortes de 4 frames com escala 1,00 → 1,08. Fecha em close da lateral "Pacientes Eletivos".

**Tipografia** Contador subindo a `3.300` em ouro, mono tabular. Abaixo: `R$ 1,4 BI EM FROTA`

**Narração** ✓ gravada — "E não é só a frota. A União criou o repasse federal que paga a operação, mês a mês, enquanto houver comprovação de uso."

**SFX** Um clique por corte, na cadência do contador.

---

### 03 · O vão · 25–35 s

**Imagem** O veículo **parado**, enquadramento estático — o único plano imóvel do filme. Vinheta fechando.

**Tipografia** Em máscara: **"Mas não entregou quem opera."** — Syne, ouro na segunda metade.

**Narração** ✓ gravadas — "Mas não entregou quem opera." … "Veículo parado não transporta paciente. E repasse sem comprovação é suspenso."

**SFX** **O som some por 400 ms antes da frase.** É a pontuação do filme. Volta com um impacto grave.

**Fonte** Três meses sem registro e o repasse é suspenso — `docs/ROTA-SPEC.md` §2.

---

### 04 · O gargalo vira mercado · 35–47 s

**Imagem** Cena gerada B — rodovia em movimento, câmera lateral.

**Tipografia** `OPERAR EXIGE ATESTADO` → **≈ 6** em ouro, grande → `OPERADORES COM ATESTADO NO PAÍS`, com a fonte ao pé em mono 9 px.

**Narração** *(refazer)* "No país inteiro existem poucas empresas capazes de operar dentro do que os editais exigem."

**SFX** Whoosh na entrada do número. Cama tonal sustentando.

**Fonte** `samais-rota/index.html:759`. A voz suaviza, a tela sustenta.

---

### 05 · A Samais é uma delas · 47–55 s

**Imagem** `noticia-3300.jpg` entrando por máscara — **cortado acima da linha "Publicado em"**, para não exibir data.

**Tipografia** **8** em ouro, grande → `ATESTADOS DE CAPACIDADE TÉCNICA` → linha fina: `SAMU 192 · TRANSFERÊNCIA INTER-HOSPITALAR · REGULAÇÃO` → fonte: `CISNORPI · OURINHOS`

**Narração** *(refazer)* "A Samais é uma delas. Uma série de atestados em SAMÚ, transferência inter-hospitalar e regulação."

**SFX** Clique seco em cada palavra da linha fina.

**Fonte** `samais-rota/index.html:1172`.

---

### 06 · O sistema · 55–69 s

**Imagem** Captura **real** do `rota-app.html` rodando: painel → programação → impressos. O zoom fecha no cartão **"Comprovação de uso · repasse federal — Em dia"**, com o farol de suspensão da Portaria 11.164 e a janela de 90 dias. É a tese do filme rodando na tela, e é o clímax.

**Tipografia** Selo mono: `ROTA · CONSOLE DE GESTÃO`. Quatro palavras em sequência: `PROGRAMAÇÃO` · `EMBARQUE` · `QUILOMETRAGEM` · `COMPROVAÇÃO`

**Narração** ✓ gravadas — "A Samais entrega a operação completa." … "E entrega, junto, o sistema que faz a gestão da frota e dos pacientes. Programação, embarque, quilometragem, comprovação."

**SFX** Cama tonal sobe. Um clique por palavra.

---

### 07 · Fecho · 69–78 s

**Imagem** Cena gerada C — estrada ao entardecer, câmera afastando. `SEG · QUA · SEX` acende inteiro. Fade para preto, logo Samais em ouro.

**Tipografia** **"Tecnologia à frente da saúde pública."** — Syne, entrando por máscara. Abaixo, mono: `SAMAIS · GESTÃO EM SAÚDE`

**Narração** *(nova)* "Para que o paciente chegue ao tratamento." · ✓ "Tecnologia à frente da saúde pública." · ✓ "Samais. Gestão em saúde."

**SFX** Drone resolvendo numa nota só. Silêncio no último segundo.

**Fonte da fala nova** É o próprio H1 de `rota-proposta/index.html` — copy da casa, já aprovada em outro material. Fecha o anel com a abertura.

---

## Montagem v3 — base em vídeo

A v1 e a v2 eram fotos com tipografia; ficaram estáticas. A v3 monta o filme **sobre vídeo em movimento** do banco Higgsfield e põe o motion graphics numa camada transparente por cima.

| Tempo | Plano | O que mostra |
|---|---|---|
| 0,0–4,6 | `aereo_noite` | cidade à noite, aéreo |
| 4,6–9,2 | `onibus_A` | micro-ônibus em movimento |
| 9,2–12,6 | foto `frota` | frota do programa, zoom lento |
| 12,6–17,8 | `onibus_B` | micro-ônibus em movimento |
| 17,8–22,7 | `praca_igreja` | veículo no município |
| 22,7–27,6 | `rua_arborizada` | veículo em rua arborizada |
| 27,6–37,5 | foto `frota` estática | o vão: único plano imóvel |
| 37,5–41,2 | `reg_mesa` | regulação: equipe na mesa |
| 41,2–44,9 | `reg_alerta` | regulação: tela, triagem |
| 44,9–49,3 | `saida_base` | saída da base |
| 49,3–53,7 | `estrada` | deslocamento na estrada |
| 53,7–67,6 | console `rota-app.html` | navegação real: painel → programação → impressos → frota → comprovação |
| 67,6–70,9 | `recebidos` | pacientes sendo recebidos |
| 70,9–74,2 | `maos` | cuidado, mãos |
| 74,2–77,4 | `reencontro` | reencontro |
| 77,4–81,9 | preto | tagline muda |

Fontes da montagem em `filme/v3/`: `overlay.html` + `overlay.js` (motion, `seek(t)` determinístico), `timeline.js` e `plano.json` (tempos a partir da duração real de cada fala), `cap_app.cjs` (captura do console quadro a quadro), `render_ov.cjs` (camada transparente em PNG), `monta.py` (base de vídeo, composição, SFX sintetizados, mix e loudnorm).

## As três cenas geradas (v1, substituídas)

Só atmosfera, sem pessoa, sem viatura caracterizada, sem marca Samais aplicada. Cada uma leva o selo `IMAGEM ILUSTRATIVA` em mono 10 px.

| | Cena | Onde |
|---|---|---|
| A | Estrada vazia ao amanhecer, câmera baixa | 00 |
| B | Rodovia em movimento, câmera lateral | 04 |
| C | Estrada ao entardecer, câmera afastando | 07 |

Método: gerar o frame inicial, **derivar o frame final a partir dele**, aprovar os dois, e só então animar em Kling 3.0.

## Material real

| Arquivo | O que é | Onde |
|---|---|---|
| `rota-proposta/img/frota-frente.jpg` | micro-ônibus do programa federal | 01, 02, 03 |
| `rota-proposta/img/frota-lado.jpg` | lateral "Pacientes Eletivos" | 02 |
| `rota-proposta/img/frota-traseira.jpg` | traseira | 02 |
| `assets/noticia-3300.jpg` | recorte gov.br, cortado acima da data | 05 |
| `rota-app.html` | o console, gravado ao vivo | 06 |

**Fora:** `assets/central-regulacao.jpg` — gerada por IA, texto ilegível nas telas, equipe uniformizada; vetada pela regra 6b da marca.
**Em avaliação:** `assets/viaturas.jpg` — real, mas **espelhada** (precisa de `hflip`) e material SAMU, que a doutrina não quer como prova de transporte.

## Narração — estado

| # | Fala | Estado |
|---|---|---|
| 00a | "Três vezes por semana, o mesmo trajeto…" | **gerar** |
| 01 | "São três mil e trezentos veículos…" | ✓ |
| 02 | "E não é só a frota…" | ✓ |
| 03a | "Mas não entregou quem opera." | ✓ |
| 03b | "Veículo parado não transporta paciente…" | ✓ |
| 04 | "No país inteiro existem poucas empresas…" | **regravar** |
| 05 | "A Samais é uma delas. Uma série de atestados em SAMÚ…" | **regravar** |
| 06a | "A Samais entrega a operação completa." | ✓ |
| 06b | "E entrega, junto, o sistema…" | ✓ |
| 07a | "Para que o paciente chegue ao tratamento." | **gerar** |
| 07b | "Tecnologia à frente da saúde pública." | ✓ |
| 07c | "Samais. Gestão em saúde." | ✓ |

## Conferência antes de entregar

- [ ] 1920×1080 · 30 fps · ~82 s · abaixo de 25 MB
- [ ] Todo texto inteiro na tela, contraste legível, corte no transiente
- [ ] Números conferidos: três mil e trezentos · um bilhão e quatrocentos milhões · ≈ 6 · 8
- [ ] Sem valor de investimento, sem data como urgência, sem CTA de contato
- [ ] Nenhuma afirmação de tratamento interrompido
- [ ] Pessoas só em rotina calma; selo `IMAGEM ILUSTRATIVA` em todo plano gerado
