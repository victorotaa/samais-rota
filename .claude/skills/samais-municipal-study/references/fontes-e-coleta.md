# Fontes e coleta (FASES 0 a 2)

Como levantar o alvo antes de qualquer conta. Vale para SAMU, UPA, hospital e transporte sanitário; o que é só do
transporte está em `modo-transporte-sanitario.md`.

**Sumário:** 1. Raio-x primeiro · 2. Briefing do ente · 3. Coleta por API · 4. Varredura por bloco · 5. Carga secundária ·
6. Gasto de hoje (TCE estadual ou portal do ente: pago; PNCP: contratado) · 7. Editais pelo item · 8. Vínculo e quem decide · 9. Procedência e convergência · 10. Rede

---

## 1. Raio-x primeiro (Ota, 11/10/2026)

*"Com esses mapeamentos estamos 'adiantando' muitos estudos futuros, aumentando nossa precisão."* Se a UF do alvo tem
raio-x (lista em `samais-os/inteligencia/raio-x.json`), `samais-os/inteligencia/<pasta>/` já traz: a central que atende o
município (≈), frota e tripulação lidas no CNES, rede do SUS da área, SICONFI, custeio FNS pago, contratos do PNCP, a
janela de contratação (`oportunidades.json`), `gestao-lida.json`, `contratos-fora-do-pncp.json`, `adm-terceiro.json`,
`frota-desativada.json` e `decisores.json`.

- **Releia no CNES as unidades do alvo:** o raio-x é foto datada.
- Gaste a varredura no que ele não alcança: portal municipal, TCE e briefing.
- O ≈ do raio-x continua ≈ até a leitura da SES ou do instrumento.

## 2. Briefing do ente (FASE 0)

Antes de varrer, veja se há levantamento respondido em `samais-os/briefings/<slug>.json`. Dado que o ente informou vale
mais que estimativa.

```
node scripts/briefing-dossie.mjs <slug> --stdout   # no samais-os: o briefing completo, com o que cada resposta alimenta
```

Cada pergunta declara `porque` (o bloco da Fórmula Mestre que ela serve):

| Do briefing | Alimenta |
|---|---|
| população · atendimentos · chamadas 192 | dimensionamento e conferência interna da régua |
| frota (com as PARADAS) · bases e equipe | frota disponível do ente (o teto) e postos × FC 4,5 |
| pisos · CCT · adicionais · benefícios · absenteísmo | bloco de pessoal |
| **horas obrigatórias de NEP** | rubrica que quase ficou de fora em Canoas (R$ 229 mil/mês) |
| suprimento · oxigênio · combustível · manutenção · RSS · EPI | não-pessoal |
| **ISS do município** | tributo sobre faturamento: muda o preço |
| **metas com glosa** | receita variável disfarçada de fixa |
| **prazo de pagamento** | capital de giro até o primeiro recebimento |
| custo atual · contrapartida · repasse federal | Cenário A |
| **modelo pretendido** | caminho de precificação (regra do CEO: nunca assumir; com OS/OSC, perguntar) |
| cedidos · almoxarifado central · combustível da garagem | custos invisíveis do Cenário A (declarado × 1,38 ≈ real) |

Regras de uso:
- `procedencia: verificado` entra como ✓; `premissa` entra como ≈ (premissa declarada).
- `estado: "nao-existe"` é **achado**, não lacuna ("o município não mede tempo-resposta" é argumento).
- `estado: "a-levantar"` vira pendência explícita (○), nunca número inventado.
- O que estiver `restrito` não entra em peça nenhuma.

Sem briefing, siga com o público e **mande o levantamento** em paralelo (painel, seção "Enviar um levantamento"; a
resposta cai em `briefings/<slug>.json`). Com pouco tempo, as **15 perguntas `essencial`** são as que travam o cálculo.
Ao fechar, registre o que ficou sem resposta: é o que se cobra na próxima rodada.

## 3. Coleta por API, antes de qualquer busca web

A busca dá pista; a API dá ✓ com URL e data. No `samais-estudos`:

```
node scripts/coletar-dados.mjs <cod_ibge_7>                  # população, densidade, CNPJ, receita, função/subfunção, CNES, paridade
node scripts/coletar-cenario-a-tce.mjs <municipio> --pncp    # o que o município PAGA hoje (TCE-SP) + contratos no PNCP
node scripts/coletar-cenario-a-nucleogov.mjs <host> <acao> <anos> <saida.json>   # o pago por ação em portal Núcleo GOV (GO)
node scripts/conferir-dados.mjs <slug> --vcm <valor>         # valida e roda a conferência
```

O coletor de TCE é de SP. Em outra UF, a fonte é o TCE daquele estado (ou o portal do ente); o TCU não é fonte de gasto
municipal. Saída de `dados/` fica fora do ar (`.vercelignore`). Roteiro completo: `samais-estudos/referencias/
protocolo-varredura.md`, `catalogo-fontes-api.md`, `fontes-dados-publicos.md` e `camada-dados.md`.

## 4. Varredura por bloco

Registrar fonte e data em cada bloco.

| Bloco | Buscar | Extrair |
|---|---|---|
| Demografia e território | IBGE (população, área, densidade, urbanização) | por município-membro em consórcio, em tabela comparativa; todo dado IBGE/DATASUS com a data de extração (base 2022 = "estimativa 2024") |
| Rede de saúde | CNES, secretaria, macrorregião | só a **rede do SUS**: públicos com leito SUS (inteiros), filantrópicos e privados contratados (parte SUS, em parcelas separadas); hospital de referência regional |
| SAMU hoje | CNES (tipo 42), PNCP, portal, imprensa | existe? quem opera? frota ativa **e desativada há até 18 meses** (`samais-os/scripts/raiox/frota-desativada.mjs <UF>`), central própria ou compartilhada, habilitação e qualificação |
| Epidemiologia | SIM/SIH (DATASUS) | causas de óbito, causas externas, perfil de demanda |
| Político-institucional | diário oficial, portal, TSE | prefeito, secretário de saúde, consórcio, presidente e secretário-executivo (ver §8) |
| Orçamento | SICONFI, SIOPS, CAUC, FNS | receita, % em saúde, situação CAUC, custeio federal **pago** (uma linha de fato) |

## 5. Carga secundária: a transferência que a estatística não mostra

Obrigatório em todo estudo de SAMU. O "atendimento" que o ente informa é a ocorrência **primária**; a transferência
inter-hospitalar passa pela CRU e tira a viatura de circulação por **horas**.

- SIH/SUS (TabNet): internações por município de **residência** × de **internação**; a diferença é o fluxo de saída
  (`samais-os/scripts/raiox/sih-fluxo.mjs`).
- PNCP e portal pelo objeto: `remoção` · `transporte de pacientes` · `transferência` · `ambulância`.
- CNES: unidades tipo A/B/D e a mantenedora.
- Perguntar ao ente: transferências/mês **separadas** dos atendimentos, tempo de ocupação, destinos e distância, quem
  aciona (192, central de leitos, complexo regulador).

Sem o dado, **lacuna declarada, nunca zero**. A conta (viatura-hora) está em `calculo-custo-construido.md` §5. Roteiro:
`samais-estudos/referencias/custo-invisivel-transferencia.md`.

## 6. Gasto de hoje: TCE estadual ou portal do ente (pago); PNCP, contrato e edital (contratado) (Ota, 09/10/2026)

*"Esses estudos são como raio-x."* Todo estudo traz o que o ente gasta **hoje**, os contratos atuais e anteriores com
valor, e o modelo de gestão de cada um: **própria** (folha), **mista** ou **terceirizada**. Fundação do próprio Estado que
opera por contrato com a Secretaria é **gestão própria** (Ota, 20/10/2026), com o contrato citado e o link.

| Campo do coletor | O que diz | Trava |
|---|---|---|
| `acoes_samu_<ano>` | a ação orçamentária própria do SAMU, folha incluída, mês a mês | único caso em que o TCE separa o SAMU (Carapicuíba, ação 2048). **Conferir a regularidade mensal** (Jandira: a folha migrou de ação). Lista vazia = SAMU em ação genérica, **não custo zero** |
| `historico_contratos` | nº do contrato citado no pagamento, por ano | **o pagamento diz se o contrato está vivo** (Itapevi: o 90/2020 parou; citar contrato parado reprovou o portão) |
| `candidatas_os_<ano>` | credor com nome de OS | **candidato**, nunca atribuição: só vira "contrato do SAMU" lido o **objeto** (Itapevi: R$ 11,6 mi eram CIS e dois PS; o SAMU era só o 45/2026) |
| `-pncp.json` | contratos do órgão por objeto, valor global, vigência | **registro duplo existe** (First Medical 43 e 49/2024: o TCE paga só o 49) |

- **Sempre "valor pago", nunca "empenhado"** (lição Bragança). O envelope da função Saúde não é o SAMU.
- **Contratado nunca como pago:** valor de contrato do PNCP vai rotulado "contratado, não pago".
- **Custo por pessoa medido transporta, com selo ≈:** folha da ação própria ÷ pessoas do CNES no mesmo município
  (Carapicuíba: R$ 4.879/mês) × quadro do CNES do alvo estima a folha que o TCE não separa. Declarar os erros de sinal.
- **Sem contrato no PNCP ≠ sem contrato** (19/10/2026): diga "sem contrato publicado no PNCP" e confirme no portal do
  ente antes de afirmar na peça.

Runbook: `samais-estudos/referencias/cenario-a-custo-atual.md` (Passo 0).

### 6.1 O pago por rubrica, e o consórcio (20–21/10/2026)

- **O pago se lê por rubrica, não só o total:**
  - folha e encargos;
  - **hora extra** (serviço extraordinário, 3.1.90.16);
  - **contratação por tempo determinado** (elemento 04);
  - **sentenças e precatórios trabalhistas** (elemento 91, quantos processos);
  - custeio, aluguel e investimento.

  A hora extra e o temporário dizem se a escala fecha com o quadro, e a sentença diz se o passivo já está correndo.
- **O ritmo de hoje:** o último ano inteiro, sem investimento e sem aluguel (o aluguel é do ente), ÷ 12. O ano corrente vai
  ao lado, contra o mesmo período do ano anterior. O resto a pagar fica fora do número do ano, e isso se declara.
- **Consórcio:**
  - a despesa do consórcio vem no arquivo do município-sede (filtre a entidade);
  - a receita dele não aparece no dado aberto do TCE, então o rateio se mede do lado de quem paga, credor = CNPJ do
    consórcio;
  - **as linhas do próprio consórcio saem da soma**, porque a folha dele tem ele mesmo como credor. No CIRUSPAR, sem esse
    corte, o rateio ia de R$ 33,5 mi a R$ 71 mi.
- **Onde o TCE abre o pago:**
  - o coletor implantado é o do TCE-PR: `samais-os/scripts/raiox/gasto-pago-tce.mjs PR`, sobre o Portal Informação para
    Todos, Download de Dados, `{ano}_{ibge6}_Despesa.zip`;
  - o mapa UF a UF do que é equivalente está no catálogo (`samais-estudos/referencias/catalogo-fontes-api.md`, §15, em
    revisão em 21/10/2026). Equivalentes em PE, SP, PB, CE e MA; parcial no ES e no RJ; o resto, bloqueado na origem ou
    sem dado aberto (○, nunca zero).
- **LGPD:** o histórico do empenho traz nome de reclamante e de ordenador. Nenhum nome sai do cache; vira contagem.

### 6.2 Gestão lida: cadastro não é gestão (Ota, 20/10/2026)

*"No registro do Cadastro Nacional, o CNES, algumas receitas não são lidas ou eles estão com dados desatualizados. Então é
necessário ter uma gestão lida (...). Observar sinais como greve, levantamento de decisores e coisas do tipo. Isso vale para
o país inteiro."*

- **O vínculo e a lotação do CNES são retrato declarado,** nunca a folha. A gestão do alvo se lê:
  - no **instrumento**: estatuto, contrato ou contrato de programa, acordo coletivo, edital de concurso ou de processo
    seletivo;
  - no **pago por rubrica** (§6.1);
  - nos **sinais**: greve, paralisação, inadimplência do rateio, audiência pública, TAC, MP, TCE;
  - nos **decisores** (§8).

  Onde o CNES diverge do lido, vale o lido, com a divergência descrita.
- **Na UF com raio-x, leia antes** `inteligencia/<pasta>/gestao-lida.json`, `sinais-lidos.json` e a seção de gestão lida do
  `fatos.md`. Em 21/10/2026, 209 das 211 centrais do país tinham a gestão lida registrada. As duas sem registro (Vilhena,
  RO, e São Pedro da Aldeia, RJ) são centrais em implantação, sem operador, lidas no `fatos.md`.
- **Prova (CIRUSPAR, Pato Branco, 20/10/2026):** o CNES declarava 5 temporários e 98,4% de efetivos ou CLT. O TCE-PR mostrou:
  - R$ 3,40 mi pagos a temporários em 2025;
  - hora extra de 15% da despesa;
  - despesa +14%, contra o repasse dos municípios −3,9%.

  A imprensa e o sindicato mostraram uma greve dos médicos em 2026, e o gasto de hoje ficou acima do Custo Operacional. A
  leitura "estável, sem janela, custeio bom" estava errada.

## 7. Editais publicados: régua de mercado pelo item (09/10/2026)

- Busca: `pncp.gov.br/api/search/?q=<termo>&tipos_documento=edital&ufs=<UF>`. **A busca não traz valor.**
- Valor: `pncp.gov.br/api/consulta/v1/orgaos/<cnpj>/compras/<ano>/<seq>` (`valorTotalEstimado`,
  `valorTotalHomologado`). O caminho antigo `/api/pncp/v1/.../compras` responde 301.
- Escopo: `pncp.gov.br/api/pncp/v1/orgaos/<cnpj>/compras/<ano>/<seq>/itens`. **É o item que diz o que o valor compra**
  (Boa Esperança do Sul, Pregão 71/2024: R$ 95.223/mês por **uma** USB, só mão de obra).
- **Unidade com unidade, escopo com escopo.** Mão de obra não se compara com operação completa; edital que junta remoção
  ou outras unidades fica fora. Teto × homologado do próprio ente mostra quanto a disputa desceu.
- Referência de outro território entra **só na Fonte, como método**, nunca em painel, título ou cartão.

## 8. Vínculo e quem decide (16/10/2026)

- **Consórcio ≠ região de saúde ≠ área da central ≠ quem paga ≠ mantenedora no CNES.** Nenhum se deduz do outro
  (AMVAPA: 19 consorciados, a CRU cobre 17). Na UF com raio-x, rode antes
  `node scripts/raiox/vinculo-oculto.mjs <UF>` (samais-os) e leia `adm-terceiro.json`.
- **Contrato ativo, total ou parcial** (só médicos, só mão de obra, locação de viatura, parte da área) entra com quem
  administra, quem opera e **o link direto ao documento oficial** (PNCP, diário oficial, portal do ente, TCE).
- **Decisores:** prefeito(a) e secretário(a) de saúde da sede; com consórcio, presidente e secretário-executivo nomeado em
  ato; com o Estado, o secretário de Estado. Quando importa: coordenador da central, diretor técnico, gestores da
  contratada (QSA). Fonte de cada um: `inteligencia/<pasta>/decisores.json` (formato em `scripts/raiox/CONTRATO.md`), com
  fonte oficial, data e mandato conferido.
- **Partido ao lado do nome** (Ota, 19/10/2026: *"é impreterível"*): sigla pelo TSE (✓, ou ≈ quando presumida); "não
  consta no TSE" para quem não tem candidatura nem cargo partidário; nunca suposição. Na peça: **Nome (PSD), cargo**.
  - **Onde ler:** os dados abertos do TSE, `cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_<ano>.zip`
    (2018 a 2026, o CSV da UF) e `orgao_partidario/orgao_partidario.zip` (cargo em diretório municipal, com vigência).
    O DivulgaCandContas pode negar acesso nesta rede.
  - **"Não consta no TSE"** só depois de procurar nas cinco eleições e nos órgãos partidários.
  - **Gestor de consórcio** (diretor-geral, coordenador): nome e cargo em fonte oficial do próprio consórcio (edital,
    carta de serviços, ata) e, de preferência, em uma segunda fonte (Câmara, imprensa).
- **Fora de toda peça:** CPF (nem em arquivo do repositório), dado sensível, boato, contato pessoal. Contato, influência,
  relações e porta de entrada vivem só em `frentes/<slug>/bastidor.md`.
- **Um dado só com o raio-x (Ota, 21/10/2026):** o decisor, o contrato, o edital, o pago e o sinal que o estudo lê entram na
  camada do raio-x da UF, que é a fonte dos anexos (`scripts/estudo-anexos-raiox.mjs`):
  - `decisores.json`, com a central e o município;
  - `gestao-lida.json` e `contratos-fora-do-pncp.json`;
  - `gasto-pago-tce.json`;
  - `sinais-lidos.json`, com o título como publicado, fonte, data e link, sem a nota de campo.

  Contrato ativo é o vigente pela data; com pagamento recente no TCE, vivo. Edital entra com o link do PNCP e o valor
  estimado, nunca como contratado.

## 9. Procedência e convergência

- ✓ lido · ≈ derivado (regra declarada) · ○ a levantar. **Lacuna nunca vira zero; premissa nunca vira fato.**
- **A verdade é convergência (Ota, 20/10/2026):** ✓ só quando fontes independentes convergem (diário oficial, portal do
  órgão, TSE, Receita, TCE, PNCP, CNES, veículos de imprensa diferentes). Fonte única ou fontes que divergem ficam ≈, com a
  divergência descrita e a leitura da realidade declarada.
- **Duas leituras da mesma fonte também se cruzam** (21/10/2026). No PR, o pago lido à mão por ação e o do coletor
  convergiram em Guarapuava, Umuarama e Londrina, e divergiram por recorte em Ponta Grossa (6% a 9%) e em Foz do Iguaçu (7%).
  Onde divergem, nenhum dos dois números vira ✓ até conferir o recorte.
- Nenhuma conclusão sai de um silêncio da fonte.
- **Arquivo citável escrito à mão não leva palavra vetada** (`samais-os/scripts/raiox/lib/exibivel.mjs` → `VETO_PUBLICO`),
  nem em outro sentido. "Remuneração" no sentido de salário vira "salários" ou "vencimentos"; "interpretação" vira
  "leitura". O motor recusa gravar a UF inteira (`✗ guarda: ... nada gravado`): foi o caso de DF, SP, MG e BA em
  21/10/2026.

## 10. Rede

- Não usar `r.jina.ai` nem `api.firecrawl.dev`; nunca desligar TLS. CNES e PNCP pedem `User-Agent` + `Referer` de
  navegador.
- Bloqueio se mede em `$HTTPS_PROXY/__agentproxy/status` antes de concluir; 403 ou desafio, skill `leitura-resiliente`.
  Fonte não obtida vira lacuna declarada. Allowlist: `samais-estudos/referencias/allowlist-rede.md`.
