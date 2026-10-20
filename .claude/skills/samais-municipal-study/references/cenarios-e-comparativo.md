# Cenários, comparativo de gasto e diagnóstico (FASE 3b)

Os dois cenários da Fórmula Mestre, o trio de cobertura dentro da proposta, o comparativo de gasto e a leitura interna
(score e diagnóstico). Base: `samais-estudos/FORMULA-MESTRE.md` e `samais-estudos/referencias/cenario-a-custo-atual.md`.

---

## 1. Cenário A × Cenário B

| | O que é | Fonte |
|---|---|---|
| **A, custo real atual** | o que o ente **paga** hoje (nunca empenhado), atribuído ao serviço **pelo objeto** do contrato, com os invisíveis somados: cedidos, almoxarifado central, combustível da garagem, a exposição trabalhista da transferência | TCE estadual, portal do ente, PNCP, CNES, briefing |
| **B, proposta** | o **Custo Operacional construído** (`calculo-custo-construido.md`) | parâmetros da casa + dados do alvo |

O Artefato 1 traz o Cenário A nas **cinco camadas** (modelo: `samais-estudos/estudos-internos/osasco-sp.md`).

## 2. O trio de cobertura dentro do Cenário B

Sempre três, cada um com frota (USB, USA, motolância, ambulancha), bases, postos, Custo Operacional mensal, per capita e
densidade de frota (viaturas por 100 mil hab.):

| Cenário | Lógica (com a regra de 19/10/2026: a frota do ente é o teto) |
|---|---|
| **Mínimo Regulatório** | o mínimo da norma pela população, com a frota do ente; base de comparação |
| **Base Operacional ★** | recomendação Samais: a frota do ente operando até o máximo da norma, a parada acima dele em reserva técnica |
| **Cobertura Ampliada** | o que a Base não alcança (reforço de motolância, viaturas para chegar ao mínimo onde falta) como **aditivo**, fora do custo-base |

**Consórcio:** dimensionamento e composição unificados; perfis demográfico e de saúde por município-membro em tabela
comparativa.

No SAMU vale o gatilho de fase 2 (Smart Growth, `parametros-base.md` §5a). No transporte sanitário **não há fase**: o
trio é de cobertura escolhida antes de assinar (`modo-transporte-sanitario.md`).

## 3. Comparativo de gasto: hoje × Custo Operacional proposto (Ota, 19/10/2026)

**A peça compara gasto, nunca equipe.** No Artefato 1, a tabela de quatro linhas (modelo:
`samais-estudos/estudos-internos/itapevi-sp.md` §7.2):

| Linha | Fonte | Selo |
|---|---|---|
| **Medido**: contratos ativos + ação própria do serviço | TCE (pago) e contrato | ✓ |
| **Estimado**: folha que o TCE não separa (custo por pessoa × CNES) + invisíveis (× 1,38 só sobre a folha) | TCE + CNES | ≈ |
| **Editais publicados**: teto × homologado, unidade a unidade | PNCP, item | ✓ |
| **Proposta**: Custo Operacional, per capita e a razão proposta ÷ estimado | estudo | — |

- **Onde o gasto de hoje é maior,** a diferença é **economia para o município**, consequência de operar dentro da norma,
  nunca corte de serviço, e vem junto do ganho de qualidade (cobertura, tempo-resposta, escala sem ruptura).
- **Onde é menor** (lição Manaus: frota que não roda 24 h), o delta se explica pelo serviço a mais, não se esconde.
- **Sem gasto de hoje lido, não há comparativo** (○).
- **Nunca "somos X% mais baratos".** A frase sustentável é "cabe dentro do que o município já destina", com a fonte e a
  data de captura na própria página.

**Destino do comparativo.** A página cliente recebe valor público com nº de contrato e data **com a ressalva de escopo, ou
não recebe** (Osasco: o contrato atende a diretoria de urgência inteira, com UPAs). Quando a distância decide a reunião
contra nós (Itapevi: proposta ≈ 2,3× o custo real estimado, porque o mercado vende FC 2,1–2,5 e escala estatutária, e nós
vendemos a norma), **não vai à página**: vai à mesa e à decisão de escopo (cenário só-norma e Smart Growth). A decisão de
levar o número à página é do Ota, com essa leitura na mão. Bloco de página: `samais-estudos/referencias/
apresentacao-html.md`, "Comparativo com o gasto atual".

## 4. Custeio federal: fato de uma linha, e o que falta habilitar é oportunidade

- O custeio federal **pago** (FNS) entra como **uma linha de fato**, sem percentual, sem "quem paga", sem tripartite e sem
  "custeio ÷ 0,5" na peça.
- **Custeio a habilitar ou qualificar é oportunidade** para a operação (unidades não habilitadas ou não qualificadas).
- O precedente de Ourinhos só em contexto paulista.

## 5. Score de atratividade (interno)

Nota 0–10 ponderada. Vai ao Artefato 1 e ao `score` do `status.json`; **nunca à página cliente** (o índice é interno).

| Critério | Peso | Como avaliar |
|---|---|---|
| Porte populacional | 20% | < 50 mil = 3 · 50–200 mil = 7 · > 200 mil = 10 |
| Fragilidade da operação atual | 25% | sem SAMU = 10 · prefeitura direta = 8 · OS fraca = 6 · concorrente forte = 3 |
| Capacidade orçamentária | 20% | gasto em saúde per capita + CAUC regular |
| Janela política | 15% | 1º mandato, alinhamento = nota maior |
| Licitação ou edital | 20% | publicado = 10 · previsto = 7 · sem informação = 4 |

O score do transporte sanitário tem critérios próprios (`modo-transporte-sanitario.md` §6).

## 6. Diagnóstico narrativo (interno)

Parágrafo de 5 a 8 linhas no Artefato 1: situação atual, principal vulnerabilidade, posicionamento Samais, riscos. A
abordagem do estudo é a de sempre (Ota, 11/10/2026): *"erros, falhas e oportunidade, com preço"*; a camada de mercado
(o que já se paga, orçamento, rede do SUS, contratos ativos "contratado, não pago", quem contrata) mora no Cenário A.
