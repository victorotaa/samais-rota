# Layout de exportação do BPA Magnético · transcrição campo a campo (≈)

| | |
|---|---|
| **Data** | 20/10/2026 (relógio de Brasília) |
| **Fonte** | `Layout_Exportacao_BPA-copia-publica.pdf` (nesta pasta): cópia pública, de terceiro, do `Layout_Exportacao_BPA.pdf` que o DATASUS lista em 09/07/2026 para o BPA Magnético 05.00. Procedência, hash e como fechar: [`PROCEDENCIA.md`](PROCEDENCIA.md) |
| **Conferência** | texto extraído do PDF (`pdftotext -layout`) idêntico, espaço a espaço, ao texto lido em 19/10; posições recalculadas por script: os campos são contíguos e somam 132 (cabeçalho), 50 (BPA-C) e 353 (BPA-I) bytes com CR+LF |
| **Uso** | interno; especificação do gravador do ROTA-OS (lacuna L1) e das regras RE-14 a RE-18 de `regras/portaria-11165.mjs` |

**Tudo aqui é ≈**: a cópia é de terceiro e a identidade com o original do DATASUS foi inferida por tamanho (313.580
bytes = 306,2 KiB, o tamanho do índice oficial) e data (gerada em 08/07/2026, um dia antes da data do índice), não por
hash. Vale até a comparação com o arquivo oficial (`PROCEDENCIA.md`, "Como fechar"). Nomes de campo como estão na cópia,
inclusive a grafia mista (`prd-` e `prd_`, maiúsculas iniciais normalizadas para minúsculas). "Obr." é a coluna
"Obrigatória" da cópia (X); campo sem marca não é obrigatório pelo layout, mas pode ser exigido pelo procedimento
(SIGTAP), como o CPF nos dois códigos do transporte.

Convenções da cópia: campo NUM só com números, zeros à esquerda; ALFA com brancos à direita até o tamanho; datas
AAAAMMDD; competência AAAAMM; fim de linha CR (CHR 13) + LF (CHR 10), arquivo texto ASCII.

## 1 · Cabeçalho (linha 01), 130 posições + CR+LF

| Seq | Campo | Posição | Tam | Tipo | Obr. | Padrão | Observação (≈ cópia) |
|---|---|---|---|---|---|---|---|
| 1 | `cbc-hdr` | 001–002 | 2 | NUM |  | 01 | Indicador de linha do header |
| 2 | `cbc-hdr` | 003–007 | 5 | ALFA |  | #BPA# | Indicador de início do cabeçalho |
| 3 | `cbc-mvm` | 008–013 | 6 | NUM |  | brancos | Ano e mês de processamento da produção; AAAAMM; só números |
| 4 | `cbc-lin` | 014–019 | 6 | NUM |  | zeros | Número de linhas do BPA gravadas; zeros à esquerda |
| 5 | `cbc-flh` | 020–025 | 6 | NUM |  | zeros | Quantidade de folhas de BPA gravadas; zeros à esquerda |
| 6 | `cbc-smt-vrf` | 026–029 | 4 | NUM |  | zeros | Campo de controle, domínio [1111..2221]; cálculo em §4 |
| 7 | `cbc-rsp` | 030–059 | 30 | ALFA |  | brancos | Nome do órgão de origem responsável pela informação; brancos à direita |
| 8 | `cbc-sgl` | 060–065 | 6 | ALFA |  | brancos | Sigla do órgão de origem responsável pela digitação; brancos à direita |
| 9 | `cbc-cgccpf` | 066–079 | 14 | NUM |  | zeros | CNPJ/CPF do prestador ou do órgão público responsável, conforme a Receita Federal; zeros à esquerda |
| 10 | `cbc-dst` | 080–119 | 40 | ALFA |  | brancos | Nome do órgão de saúde destino do arquivo; brancos à direita |
| 11 | `cbc-dst-in` | 120 | 1 | ALFA |  | M/E | Indicador do órgão destino: E estadual, M municipal |
| 12 | `cbc_versao` | 121–130 | 10 | ALFA |  | — | Versão do sistema, informação livre (letras e números); brancos à direita |
| 13 | `cbc-fim` | 131–132 | 2 | — |  | — | CR (CHR 13) + LF (CHR 10): fim do cabeçalho |

## 2 · BPA-C, consolidado (linha 02), 48 posições + CR+LF

| Seq | Campo | Posição | Tam | Tipo | Obr. | Padrão | Observação (≈ cópia) |
|---|---|---|---|---|---|---|---|
| 1 | `prd-ident` | 001–002 | 2 | NUM |  | 02 | Identificação de linha de produção BPA-C |
| 2 | `prd-cnes` | 003–009 | 7 | NUM | X | brancos | Código do CNES; a última posição é o dígito verificador; zeros à esquerda |
| 3 | `prd-cmp` | 010–015 | 6 | NUM | X | brancos | Competência de realização do procedimento; AAAAMM |
| 4 | `prd_cbo` | 016–021 | 6 | ALFA |  | brancos | CBO do profissional (Classificação Brasileira de Ocupações) |
| 5 | `prd-flh` | 022–024 | 3 | NUM | X | zeros | Número da folha do BPA, domínio [001..999] |
| 6 | `prd-seq` | 025–026 | 2 | NUM |  | zeros | Sequencial da linha na folha, domínio [01..20] |
| 7 | `prd-pa` | 027–036 | 10 | NUM |  | zeros | Código do procedimento; a última posição é o dígito verificador |
| 8 | `prd-ldade` | 037–039 | 3 | NUM |  | zeros | Idade (0 a 130 anos) |
| 9 | `prd-qt` | 040–045 | 6 | NUM |  | zeros | Quantidade de procedimentos produzidos |
| 10 | `prd-org` | 046–048 | 3 | ALFA |  | — | Origem: BPA (SIA/SUS), PNI, SIE (SIGAE), SIB (SIGAB), MIN (materno-infantil), PAC, SCL (SISCOLO), EXT (outros sistemas) |
| 11 | `prd-fim` | 049–050 | 2 | — |  | — | CR + LF |

## 3 · BPA-I, individualizado (linha 03), 351 posições + CR+LF

| Seq | Campo | Posição | Tam | Tipo | Obr. | Padrão | Observação (≈ cópia) |
|---|---|---|---|---|---|---|---|
| 1 | `prd-ident` | 001–002 | 2 | NUM |  | 03 | Identificação de linha de produção BPA-I |
| 2 | `prd-cnes` | 003–009 | 7 | NUM | X | brancos | Código do CNES; a última posição é o dígito verificador; zeros à esquerda |
| 3 | `prd-cmp` | 010–015 | 6 | NUM | X | brancos | Competência de realização do procedimento; AAAAMM |
| 4 | `prd_cnsmed` | 016–030 | 15 | NUM | X | brancos | CNS do profissional com dígito verificador válido |
| 5 | `prd_cbo` | 031–036 | 6 | ALFA | X | brancos | CBO do profissional |
| 6 | `prd_dtaten` | 037–044 | 8 | NUM |  | brancos | Data de atendimento; AAAAMMDD |
| 7 | `prd-flh` | 045–047 | 3 | NUM | X | zeros | Número da folha do BPA, domínio [001..999] |
| 8 | `prd-seq` | 048–049 | 2 | NUM |  | zeros | Sequencial da linha na folha, domínio [01..99] |
| 9 | `prd-pa` | 050–059 | 10 | NUM |  | zeros | Código do procedimento; a última posição é o dígito verificador |
| 10 | `prd-cnspac` | 060–074 | 15 | NUM |  | brancos | CNS do paciente com dígito verificador válido; obrigatório quando o procedimento exigir |
| 11 | `prd-sexo` | 075 | 1 | ALFA |  | M ou F | Sexo do paciente: M masculino, F feminino (a cópia não lista "I"; o LEIAME v04.11 o inclui) |
| 12 | `prd-ibge` | 076–081 | 6 | NUM |  | brancos | Código IBGE do município de residência (6 dígitos) |
| 13 | `prd-cid` | 082–085 | 4 | ALFA |  | brancos | CID-10 |
| 14 | `prd-ldade` | 086–088 | 3 | NUM |  | zeros | Idade (0 a 130 anos) |
| 15 | `prd-qt` | 089–094 | 6 | NUM |  | zeros | Quantidade de procedimentos produzidos |
| 16 | `prd-caten` | 095–096 | 2 | NUM |  | brancos | Caráter do atendimento |
| 17 | `prd-naut` | 097–109 | 13 | NUM |  | brancos | Número da autorização do estabelecimento |
| 18 | `prd-org` | 110–112 | 3 | ALFA |  | — | Origem: BPA, PNI, SIE, SIB, MIN, PAC, SCL, EXT (outros sistemas) |
| 19 | `prd-nmpac` | 113–142 | 30 | ALFA |  | brancos | Nome completo do paciente; brancos à direita |
| 20 | `prd-dtnasc` | 143–150 | 8 | NUM |  | brancos | Data de nascimento; AAAAMMDD |
| 21 | `prd-raca` | 151–152 | 2 | NUM | X | brancos | Raça/cor: 01 branca, 02 preta, 03 parda, 04 amarela, 05 indígena, 99 sem informação |
| 22 | `prd-etnia` | 153–156 | 4 | NUM |  | brancos | Etnia (Portaria SAS 508/2010, Anexo I); só se raça/cor = 05 |
| 23 | `prd-nac` | 157–159 | 3 | NUM |  | brancos | Nacionalidade |
| 24 | `prd_srv` | 160–162 | 3 | NUM |  | brancos | Código do serviço; obrigatório quando o procedimento exigir |
| 25 | `prd_clf` | 163–165 | 3 | NUM |  | brancos | Código da classificação; obrigatório quando o procedimento exigir |
| 26 | `prd_equipe_Seq` | 166–173 | 8 | NUM |  | brancos | Código da sequência da equipe |
| 27 | `prd_equipe_Area` | 174–177 | 4 | NUM |  | brancos | Código da área da equipe |
| 28 | `prd_cnpj` | 178–191 | 14 | NUM |  | brancos | CNPJ da empresa que fez a manutenção ou adaptação da OPM |
| 29 | `prd_cep_pcnte` | 192–199 | 8 | NUM |  | brancos | CEP do paciente |
| 30 | `prd_lograd_pcnte` | 200–202 | 3 | NUM |  | brancos | Código do logradouro do paciente |
| 31 | `prd_end_pcnte` | 203–232 | 30 | ALFA |  | brancos | Endereço do paciente |
| 32 | `prd_compl_pcnte` | 233–242 | 10 | ALFA |  | brancos | Complemento do endereço |
| 33 | `prd_num_pcnte` | 243–247 | 5 | ALFA |  | SN / 00 | Número do endereço |
| 34 | `prd_bairro_pcnte` | 248–277 | 30 | ALFA |  | brancos | Bairro |
| 35 | `prd_ddtel_pcnte` | 278–288 | 11 | NUM |  | brancos | Telefone do paciente |
| 36 | `prd_email_pcnte` | 289–328 | 40 | ALFA |  | brancos | E-mail do paciente |
| 37 | `prd_ine` | 329–338 | 10 | NUM | X | brancos | Identificação Nacional de Equipes; a partir da competência 08/2015 |
| 38 | `prd_cpf_pcnte` | 339–349 | 11 | NUM |  | brancos | CPF do indivíduo; obrigatório quando o procedimento exigir |
| 38 (sic) | `prd_situacao_rua` | 350 | 1 | ALFA |  | N ou S | Pessoa em situação de rua: N ou S; branco sem informação; válido a partir da competência 12/2024 |
| 39 | `prd_sem_cpf` | 351 | 1 | ALFA |  | N ou S | Pessoa sem CPF/registro civil: N ou S; branco sem informação; válido a partir da competência 07/2026 |
| 40 | `prd-fim` | 352–353 | 2 | — |  | — | CR + LF |

Observações da própria cópia, ao pé do layout:

1. "O campo não pode ser editado pelo usuário" (o campo de controle do cabeçalho).
2. "Deve-se identificar o paciente por apenas um documento: ou o CPF ou o CNS. Sendo assim, se informado o CPF, não
   informar o CNS e vice-versa."

## 4 · Campo de controle do cabeçalho (`cbc-smt-vrf`, posições 026–029)

Texto da cópia: "1) Somar o código de todos os procedimentos + quantidade. 2) Obter o resto da divisão do resultado
acima por 1111. 3) Somar 1111 ao resto da divisão acima."

```
cbc-smt-vrf = ( Σ (prd-pa + prd-qt), sobre todas as linhas BPA-C e BPA-I ) mod 1111  +  1111      domínio [1111..2221]
```

`prd-pa` entra como o número de 10 dígitos (com o verificador; ex.: 08.03.01.016-8 → 0803010168) e `prd-qt` como
inteiro. Que a soma cobre as linhas dos dois tipos é leitura (≈) da expressão "todos os procedimentos"; o `bpa-go`
(contraprova, sem licença, não embarcado) faz a mesma conta. Quatro dígitos sem zeros à esquerda, porque o mínimo é 1111.

## 5 · O que o layout muda no ROTA-OS (≈)

| Campo (posição) | Layout (≈ cópia) | ROTA-OS |
|---|---|---|
| `prd-cnspac` (060–074) | CNS do paciente, quando o procedimento exigir | a pré-remessa leva o CNS; na linha final ele **sai** quando o faturamento põe o CPF |
| `prd_cpf_pcnte` (339–349) | CPF, quando o procedimento exigir; **um documento só** | 08.03.01.015-0 e 08.03.01.016-8 exigem CPF (SIGTAP ✓): o faturamento do ente **substitui** o CNS pelo CPF (RE-14, RE-16). O ROTA-OS não guarda CPF |
| `prd_situacao_rua` (350) | N, S ou branco, desde 12/2024 | o ROTA-OS nunca preenche |
| `prd_sem_cpf` (351) | N, S ou branco, desde a competência 07/2026 | o ROTA-OS nunca preenche (declarar "sem CPF" por inferência seria falso); na linha final, "S" sem CPF só vale de 2026-07 em diante (RE-18) |
| `prd-sexo` (075) | M ou F na cópia; "I" desde a v04.11 (LEIAME, 01/2026) | a linha final aceita M, F e I (RE-17) |
| `prd_cnsmed` (016–030), `prd_cbo` (031–036) | obrigatórios | quem é o "profissional" numa linha de transporte: lacuna L15 |
| `prd_ine` (329–338) | obrigatório desde 08/2015 | equipe no transporte: lacuna L16 |
| `prd-org` (110–112) | EXT = outros sistemas | origem do arquivo gerado fora do BPA Magnético: lacuna L17 |
| `prd-qt` (089–094) | quantidade | máximo 12 (SIGTAP ✓); unidade de contagem: lacuna L2 |
| `prd-ibge` (076–081) | município de residência em **6** dígitos | o ROTA-OS guarda e exporta o IBGE de **7** dígitos (com o verificador); o gravador corta o 7º (≈) |
| CEP, endereço, telefone, e-mail (192–328) | sem marca de obrigatório | em branco por minimização (≈) |

## 6 · Divergência nas posições 350–353 (aberta)

| Posição | Esta cópia (≈) | `bpa-go` v1.2.1 (≈, sem licença; contraprova) |
|---|---|---|
| 350 | `prd_situacao_rua` | reservado (branco) |
| 351 | `prd_sem_cpf` | `prd_sit_rua` (padrão "N") |
| 352–353 | CR+LF | reservado |
| 354–355 | — | CR+LF |
| Tamanho da linha | 353 bytes | 355 bytes |

As posições 001–349 coincidem nas duas fontes. Só o importador do BPA Magnético 05.00 diz qual leitura vale; até lá o
gravador do ROTA-OS não congela 350–353 (`PROCEDENCIA.md`, "Como fechar"). A própria cópia numera dois campos como 38
(`prd_cpf_pcnte` e `prd_situacao_rua`), o que sugere que a situação de rua foi inserida depois sem renumerar.

---

*Onde gestão se mede em vidas.*
