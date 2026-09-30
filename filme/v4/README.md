# ROTA · comercial v4 (HyperFrames)

84,5 s · 1920×1080 · 30 fps · HTML → MP4 determinístico. Mesma régua do comercial
do CoPilot (samais-os · `produtos/samu-copilot-os/video-comercial`): tokens de
movimento, câmera que não para, tipografia cinética, chicote com borrão, mergulho
de zoom, clarão e tremor nos impactos, trilha composta em código na grade de 120 BPM.

## v4b — aprovada pelo Ota (30/09/2026)

✓ *"Ficou ótimo."* Render local (HyperFrames, quadros de vídeo em PNG), −16 LUFS, 84,5 s,
77.672.285 bytes. Arquivo no Higgsfield (media `480907df-ef75-45d1-8ef5-131e705738ae`).
Pendente, a pedido do Ota: upscale dos cinco clipes de 720p (os três do ônibus e os dois
de Belém) para 1080p.

## O que mudou da v3 (pedido do Ota, 29/09/2026)

| Pedido | Resposta |
|---|---|
| "mesmos vídeos trocando roupas de personagens" | Cada família de B-roll num bloco só: **ônibus** (mesmas pessoas, quadro `a9b36748`), **Manduri** (a mesma pintura, giroflex apagado), **Belém** (a mesma equipe, cadeia `03bd0016 → 29a7856a`). Nunca se intercalam. |
| "vídeos sendo repetidos no começo" | Nenhum plano entra duas vezes. A foto da frota entra uma vez, no vão. |
| "pouco motion de informações" | Os números viram grafismo: o trajeto da hemodiálise (SEG · QUA · SEX), o mapa dos 3.300, o repasse mês a mês, os 3 meses sem registro e o carimbo de suspensão, os ≈ 6 operadores, o zoom na Samais, o console de verdade com a câmera mergulhando palavra por palavra. |
| "Gere takes que forem necessários" | 3 takes novos (Kling 3.0, 5 s, quadros derivados do mesmo ônibus): o ônibus na avenida, o embarque na porta de casa com o tablet, a chegada à clínica. |

## A peça, cena a cena

| Cena | Tempo | Imagem | Locução |
|---|---|---|---|
| 01 | 0–9 | o fio desenha o trajeto casa → clínica, SEG · QUA · SEX, 312 deslocamentos por ano · depois o ônibus na avenida | "Três vezes por semana…" |
| 02 | 9–17,5 | o mapa do Brasil acende os 3.300 · R$ 1,4 bi · recorte gov.br (sem a data) | "São três mil e trezentos veículos…" |
| 03 | 17,5–26,5 | 12 meses: o repasse cai, o uso se comprova | "E não é só a frota…" |
| 04 | 26,5–36 | silêncio · a frota parada, "Mas não entregou / quem opera." digitado · 3 meses sem registro · REPASSE SUSPENSO | "Mas não entregou quem opera." · "Veículo parado…" |
| 05 | 36–43 | os pontos apagam, sobram ≈ 6 operadores | "No país inteiro…" |
| 06 | 43–53,5 | zoom na Samais · SAMU (Manduri) · Transferência inter-hospitalar (Manduri) · Regulação (Belém) · 8 atestados | "A Samais é uma delas…" |
| 07 | 53,5–70 | o embarque com o tablet · o console em 3D: Programação · Embarque · Quilometragem · Comprovação · o relatório para a Secretaria | "A Samais entrega a operação completa…" |
| 08 | 70–84,5 | a chegada à clínica · "Tecnologia à frente da saúde pública." · Samais \| ROTA · *Onde gestão se mede em vidas.* | "Para que o paciente…" · "Samais. Gestão em saúde." |

## Rodar

```bash
npm ci && ./preparar.sh          # GSAP, runtime, fontes do npm, marca e tokens (doutrina/)
node baixar.mjs                  # B-roll (broll.json) e locução (voz.json) do CDN do Higgsfield, voz a 1,1×
node capturar-app.mjs            # grava o rota-app.html do repo: 5 telas + caixas.json
node trilha/compor.mjs           # trilha e efeitos, lidos de roteiro.json (−20 LUFS, silêncio real no vão)
npx hyperframes lint .           # gate
node qa-texto.mjs                # gate: nenhuma órfã, nenhuma linha estourando, 2+ palavras por linha
npx hyperframes snapshot . --at 12,35,60   # quadros sem render
npx hyperframes render . -o renders/rota.mp4 -f 30
```

Numa máquina limpa, tudo numa chamada: `UPLOAD_URL=… bash render-sandbox.sh`.

- **Fonte única de tempos:** `roteiro.json`. O `index.html` e a trilha leem dali.
- **Binários fora do git:** B-roll, locução, gravação do console, trilha e render.
- **Honestidade:** selo "imagens ilustrativas" em toda tomada gerada · SAMU sem
  acento na tela · nenhum valor de investimento, nenhuma data como urgência,
  nenhum contato · nunca se afirma que a falta de transporte interrompe o tratamento.
