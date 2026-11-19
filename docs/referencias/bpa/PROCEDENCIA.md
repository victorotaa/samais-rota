# Procedência das cópias do layout do BPA Magnético (≈)

| | |
|---|---|
| **Data** | 20/10/2026 (relógio de Brasília); leitura das cópias em 19/10/2026 |
| **Autorização** | Ota, 20/10/2026: "vamos versionar o layout do BPA" |
| **Uso** | interno; base do gravador do ROTA-OS (lacuna L1) e das regras da linha final do BPA-I |

Procedência: **✓** lido na fonte oficial · **≈** cópia de terceiro ou derivado, com a regra declarada · **○** a levantar.

## 1 · Os arquivos desta pasta

| Arquivo | Origem (cópia de terceiro, commit fixado) | Bytes | SHA-256 (calculado em 20/10 com `sha256sum`) |
|---|---|---|---|
| `Layout_Exportacao_BPA-copia-publica.pdf` | [alexfernandocagnin-ux/DownloadSistemas @72a5359da1, `static/manuals/bpa-layout.pdf`](https://github.com/alexfernandocagnin-ux/DownloadSistemas/blob/72a5359da1/static/manuals/bpa-layout.pdf) | 313.580 | `f318bc0359b378e8455280f87dec0ad8c016bcf853d640f2f83353e5648f9f1f` |
| `BPA_LEIAME-copia-publica.txt` | [RenatoKR/SIASUS @4c032280cf, `bpa/BPA_LEIAME.txt`](https://github.com/RenatoKR/SIASUS/blob/4c032280cf/bpa/BPA_LEIAME.txt) | 67.204 | `0172e38945c4a9a69ec5a8385231f44e0d808de46a496e492121b0f1c3032941` |
| `bpa-layout.md` | transcrição campo a campo do PDF acima, feita aqui | — | — |

Metadados do PDF (`pdfinfo`): título interno "Layout_Exportacao_BPA.xlsx", produtor "Microsoft: Print To PDF", criado
em 08/07/2026 15:09 UTC, 6 páginas A4 paisagem, sem criptografia, sem JavaScript, sem formulário.

## 2 · O original oficial

O índice HTTPS do SIA ✓ ([sia.datasus.gov.br/versao/listar_ftp_bpa.php](https://sia.datasus.gov.br/versao/listar_ftp_bpa.php),
visto em 19/10/2026) lista, todos de 09/07/2026:

| Arquivo oficial | Tamanho no índice |
|---|---|
| `Layout_Exportacao_BPA.pdf` | 306,2 KB |
| `BPA_LEIAME.txt` | 66,6 KB |
| `BPAMAG0500.exe` (BPA Magnético 05.00) | 7,4 MB |

Os links do índice apontam para o FTP do DATASUS (`arpoador.datasus.gov.br/siasus/BPA/`), que a sessão não alcança. O
bloqueio não foi contornado.

## 3 · Por que é ≈ e não ✓

1. **As duas cópias são de terceiros** (repositórios de conta individual que espelham instaladores e manuais do SIA),
   não do DATASUS.
2. **A identidade do PDF com o original é inferida, não provada.** 313.580 bytes = 306,2 KiB, exatamente o tamanho do
   índice oficial, e a data interna (08/07/2026) fica um dia antes da data do arquivo oficial. Nenhum hash oficial
   foi publicado para comparar.
3. **O LEIAME copiado está defasado.** Tem 67.204 bytes (65,6 KiB) contra 66,6 KB no índice, para na versão 04.11
   (23/01/2026) e não cita a 05.00 nem o `prd_sem_cpf`. Serve para a história das críticas (CPF na exportação na
   v04.00; "não é permitido informar, ao mesmo tempo, o CNS e o CPF" nas v04.06 e 04.07; situação de rua na v04.08;
   sexo "I" na v04.11), não para a versão vigente.
4. **A própria cópia do layout tem sinais de edição incompleta**: dois campos com o número 38 (`prd_cpf_pcnte` e
   `prd_situacao_rua`) e o sexo com padrão "M ou F" sem o "I" que o LEIAME já aceita desde 01/2026.

## 4 · Divergência registrada: posições 350–353

| Posição | Esta cópia (≈) | `bpa-go` v1.2.1 ([viggosistemas/bpa-go](https://github.com/viggosistemas/bpa-go), sem licença; contraprova, código não embarcado) |
|---|---|---|
| 350 | `prd_situacao_rua` | reservado |
| 351 | `prd_sem_cpf` (desde a competência 07/2026) | `prd_sit_rua` |
| 352–353 | CR+LF | reservado |
| fim da linha | 353 bytes | 355 bytes |

As posições 001–349 coincidem. O `bpa-go` diz ter sido conferido contra um arquivo do BPA Magnético de um município
(competência 08/2026); a cópia diz o contrário nas quatro posições finais. Nenhuma das duas leituras é ✓.

## 5 · Como fechar (≈ → ✓)

1. **Hash contra o original.** Pedir ao faturamento do ente-piloto o `Layout_Exportacao_BPA.pdf` baixado do DATASUS
   (ou do instalador do BPA Magnético 05.00), rodar `sha256sum` e comparar com
   `f318bc0359b378e8455280f87dec0ad8c016bcf853d640f2f83353e5648f9f1f`. Igual: a transcrição vira ✓ e esta nota
   registra a data e quem forneceu (setor, nunca pessoa). Diferente: versionar o oficial ao lado, refazer
   `bpa-layout.md` e rodar de novo os casos BP do `testes/casos/portaria-11165-casos.json`.
2. **Importação de prova.** Gerar um arquivo sintético (CNS de teste gerados por algoritmo, nenhum CPF real; o CPF de
   teste fica só na máquina isolada e nunca entra no repositório), com linhas de 353 bytes e o campo de controle
   calculado, e importá-lo no `BPAMAG0500.exe` numa máquina Windows isolada, com o instalador obtido do DATASUS pelo
   faturamento do ente ou conferido por hash. O importador decide as posições 350–353; o resultado (aceito, ou a
   crítica com o número) entra nesta nota.
3. **Até lá**, o gravador de largura fixa do ROTA-OS não congela as posições 350–353, e a regra RE-18
   (`prd_sem_cpf`) fica marcada ≈ nos casos.

---

*Onde gestão se mede em vidas.*
