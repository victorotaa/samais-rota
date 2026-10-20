# Cálculo: frota, equipe e Custo Operacional construído (FASE 3a)

O Custo Operacional sai **construído de baixo para cima**, nunca de régua fixa (Ota, 19/10/2026: *"não trabalharemos com
números de estimativa dentro de um valor fixo como 5,20 ... deve ser evitado em todos os cálculos futuros, incluindo de
transporte sanitário, de administração hospitalar"*). Método completo: `samais-estudos/FORMULA-MESTRE.md` e
`samais-estudos/referencias/parametros-base.md`. Transporte sanitário tem conta própria: `modo-transporte-sanitario.md`.

**Sumário:** 1. Frota disponível (o teto) · 2. Testes de escala · 3. Equipe pela norma · 4. A conta do custo · 5. Carga
secundária em viatura-hora · 6. Faixa de validade e régua de conferência · 7. Normas e referências do SAMU

---

## 1. Frota disponível do ente: o teto, nenhuma viatura nova (Ota, 19/10/2026)

*"Não temos condições, pelo menos neste momento, de adicionar novas viaturas."*

1. **Frota disponível** = viaturas públicas do SAMU que o ente tem ou teve: ativas no CNES, **com ou sem equipe** (quem
   tripula é a Samais), mais as **desativadas no CNES há até 18 meses** por motivo que conta (desatualização do cadastro,
   reforma, vigilância sanitária, "outros"; ⚠️ estado a confirmar em diligência). Ficam fora: encerramento das
   atividades, cadastro indevido, mudança de município, alteração de atividade. Recadastro não conta duas vezes.
   Fonte: `samais-os/scripts/raiox/frota-desativada.mjs <UF>`.
2. **Opera até o máximo da norma** (1 USB a cada 100 mil hab., 1 USA a cada 400 mil) e **nenhuma viatura que roda hoje sai
   da rua**. Só a viatura **parada** acima do máximo vira **reserva técnica, com custo de manutenção**. Motolância e
   ambulancha operam todas.
3. **Geografia complexa replica a operação de hoje**, como estimativa declarada: sede na Amazônia Legal, ambulancha na
   frota ou densidade da área abaixo da média do Brasil (23,86 hab/km²). Frase da peça: *"havendo excedente de
   ambulâncias, a operação pode rodar com superávit de frota, elevando a qualidade do serviço e reduzindo o
   tempo-resposta"*.
4. **Alta densidade (> 500 hab/km², ≈ critério da casa) também replica**; a motolância opera toda e o reforço de frota é
   **aditivo**, oportunidade fora do custo-base.
5. **Abaixo do mínimo da norma** (1 USB a cada 150 mil, 1 USA a cada 450 mil) é **lacuna declarada** ("faltam X USB e Y USA;
   inclusão só por aditivo"), nunca custo. Sem frota do ente lida, o custo fica ○.
6. **A folha do ente é diagnóstico** da operação de hoje (lição Manaus), nunca o teto da proposta.
7. Frota: **recuperação das viaturas paradas do ente**, nunca "reserva locada".

## 2. Os dois testes de escala (lição Manaus, 21/08/2026)

Rodar antes dos cenários (`samais-estudos/referencias/protocolo-varredura.md`, passo 11):

1. **Densidade de frota:** `viaturas ÷ pop × 100.000`. Per capita e densidade andam juntos no estudo interno: per capita
   sozinho compara municípios de densidades diferentes e engana. Conferência interna: `R$/hab ≈ 1,63 + 1,96 × densidade`.
2. **Cadastro × frota tripulada:** `headcount ÷ Σ(viaturas × postos)` dá o FC implícito. Cobertura abaixo de ~90% quer
   dizer que o CNES é teto, não operação (Manaus: R$ 9,11/hab contra R$ 5,30/hab).

## 3. Equipe pela norma, mesmo com excedente hoje (Ota, 19/10/2026)

- O Cenário B **nunca herda o quadro de hoje**: tripulação do art. 6º por viatura, sala de regulação pelo Anexo I, escala
  24/7 × **FC 4,5** e gestão mínima (PT GM/MS 1.010/2012). Postos da norma, nunca cabeças da folha.
- **FC 24/7 ≈ 4,5, nunca 2,2** (lição Taboão, 148 × 80). Posto de 12 h diurno: 2,25. Encargos e FC são multiplicativos.
- A peça **não compara equipe** (quadro de hoje × proposto); compara **gasto** (ver `cenarios-e-comparativo.md`).
- **Qualidade não é a variável de ajuste:** escala coberta, habilitação e qualificação seguem inteiras.

## 4. A conta do custo

```
Custo Operacional = pessoas (postos da norma × FC × custo da pessoa)
                  + frota e insumos por viatura + globais da central + operação complementar
                  + custos das bases + gestão + indiretos
custo da pessoa   = (piso × paridade da UF + insalubridade + noturno) × (1 + encargos) + benefícios + passivo
```

- **Parâmetros num lugar só:** `samais-os/doutrina/parametros-custo.json` (espelho de `parametros-base.md` §2–4, §9,
  §12, §13), lido por `samais-os/scripts/raiox/lib/custo-construido.mjs`. Muda o `.md`, muda o `.json` no mesmo commit.
- **Piso por função:** CCT lida da UF; sem ela, CCT-PA × **fator de paridade** da UF (`parametros-base.md` §12), marcado ≈
  em toda linha derivada. Nunca inventar piso; nunca usar a tabela CCT-SP (ajustada, não medida) como âncora.
- **Encargos 68,24%** já carregam aviso prévio, multa do FGTS e rescisão (Grupo C): **a rescisão não entra de novo**.
  Entram: rotatividade extra 2% da folha, reclamatórias 5%, horas extras de operação (fração declarada de turnos que
  estouram). **Adicional carrega encargos** (penosidade e insalubridade antes do 1,6824). A jornada escalada de 44,00 h
  só existe no **pool** com folgas rotativas, e isso vai declarado.
- **Operação complementar é nossa** (Ota, 20/10/2026): uniforme e EPI, NEP/NEU (coordenador e um instrutor a cada 150
  profissionais, 12 h/ano fora do plantão como extra), SESMT, saúde ocupacional, higienização e rouparia, rádio e
  rastreamento, resíduos de saúde e o que o termo de referência exigir (`parametros-custo.json › operacao_complementar`).
- **Bases:** aluguel ou compra do imóvel da central e das bases é **do ente e fica fora**; energia, água, internet,
  telefone e limpeza entram (`custos_base`, parâmetro nacional; o TR do alvo só confere).
- **Escopo de co-gestão** (Ota, 09/10/2026: *"Combustível é da Samais, fazemos a co-gestão de tudo. Menos compra/locação
  de imóveis."*): combustível em toda unidade (na USA e na VIR, somar pelo `parametros-base.md` §10.1 com km declarado ≈);
  toda linha que a página promete existe no custo (manutenção em **cada** unidade). Fora: imóvel e aquisição de frota.
- **Tecnologia é rubrica:** a sustentação do CoPilot OS ou do ROTA-OS (equipe de TI pelo contrato inteiro) entra no custo;
  não muda o preço, muda o residual (`parametros-base.md` §5b).
- **Indiretos:** overhead 7% + operacional 2% (1% TI, 1% imprevistos; Ota, 20/10/2026), sem contar duas vezes.
- **Sem margem, BDI nem tributo:** o Custo Operacional é custo. O preço e a composição vivem no anexo
  (`composicao-e-anexo.md`).
- Peso da folha esperado com frota e imóvel do ente: 75–79% (a faixa de 55–70% vale quando a operadora fornece a viatura).

## 5. Carga secundária em viatura-hora

```
viatura-horas/mês     = transferências/mês × tempo médio de ocupação (h)
viaturas equivalentes = viatura-horas ÷ 730
```

60 transferências/mês a 5 h = 300 viatura-horas = 0,41 viatura em tempo integral. Vale também para o **médico regulador**.

- **Sem o dado, tabela de sensibilidade ancorada em transferências/mês, nunca em % da frota** (19/08/2026): motolância
  fora da frota-hora; usar a linha USB; cada município na sua régua; linha acima de ~60% da frota-hora é impossível com
  aquela frota, e isso é achado.
- Frase de lacuna: *"volume de transferências não informado; tratado como zero, o que é conservador para o preço e
  arriscado para a operação — validar antes de assinar."*
- **Medir cria a prova:** a viatura-hora que dimensiona documenta jornada estourada (horas extras, intrajornada,
  interjornada, noturno prorrogado). Num cenário de 20 viagens longas/mês, a exposição chega a 17,5% do custo direto.
- **O destino do número é o Cenário A do ente, não o nosso custo** (Ota, 19/08/2026): medir e conferir contra o residual
  sempre; virar linha de custo só se o residual cair abaixo de ~5%. A reserva técnica sai mais barata que o passivo.
- **Na peça cliente:** horas e viaturas equivalentes, **nunca reais**.

## 6. Faixa de validade e régua de conferência (19/10/2026)

- **Acima de ~1,5 milhão de habitantes na área**, o Custo Operacional é **pela norma**: custeio federal de referência
  (habilitado e qualificado) ÷ 0,5 (PT 1.010/2012, art. 40), marcado "pela norma". Sem custeio de referência, ○.
  Nunca o teto da régua (Belém saiu com R$ 18,4 mi/mês; pela norma, R$ 5,0 mi).
- **R$ 5,20/hab/mês é só conferência interna** (`regua_conferencia`). Se citado, só como "Custo Operacional · ≈ estimativa
  Samais (cálculo sobre os contratos da Samais)". "Métrica de Ouro" é jargão interno e não vai a terceiro.
- Abaixo de ~200 mil habitantes a central não se divide e a régua é piso.

## 7. Normas e referências do SAMU

**Frota pela população** (PT 1.864/2003 e 1.010/2012; `parametros-custo.json › norma_frota`): mínimo = pop ÷ 150 mil
(USB) e ÷ 450 mil (USA); máximo = pop ÷ 100 mil e ÷ 400 mil. A norma dá **piso e teto da operação**, não a frota a
contratar: a frota é a do ente (§1). ⚠️ Texto consolidado (PRC nº 3/2017, Anexo III) não lido; a razão por densidade não
foi localizada (○).

**Tempo-resposta e KPIs** (referenciais do MS e da literatura APH; ≈ onde não lidos):

| Indicador | Meta | Crítico |
|---|---|---|
| Tempo-resposta urbano | ≤ 8 min | > 15 min |
| Tempo-resposta rural | ≤ 20 min | > 35 min |
| Despacho em < 4 min | ≥ 90% | < 65% |
| Regulação médica | 100% das chamadas | chamada sem regulação |
| Ociosidade da frota | 15–25% | < 10% ou > 40% |

Raio de cobertura ≈: USB urbana ~5 km; rural ~25–35 km. Motolância só em área urbana de tráfego intenso.
Demanda típica ≈: 0,08–0,12 chamadas/hab./ano (pequenos rurais), 0,12–0,18 (médios), 0,18–0,30 (grandes centros);
clínica 55–60%, trauma 25–30%, psiquiátrica/social 8–12%, obstétrica 2–4%.

**Marco normativo** (conferido por busca em 25/09/2026; ⚠️ o que a busca não confirmou):
- **PNAU:** PT GM/MS 1.600/2011 (reformulou a política e instituiu a RUE; a original, 1.863/2003, foi revogada).
- **SAMU 192:** PT GM/MS 1.010/2012 (PRC nº 3/2017, Anexo III). Custeio e habilitação: PRC nº 6/2017, valores da
  **PT GM/MS 958/2023** (lida em 12/10/2026 ✓): USB habilitada R$ 17.062,50/mês; habilitada e qualificada R$ 28.494,70;
  USA habilitada R$ 50.050; Amazônia Legal +30% (USB habilitada R$ 22.181,25).
- **Habilitação de serviços:** PT GM/MS 3.966/2021 ⚠️ não reconferida.
- **Regulação:** PT GM/MS 9.262/2025 (PNR-SUS), que revogou o Anexo XXVI da PRC nº 2/2017.
- **CFM:** Res. 2.110/2014 (APH móvel e regulador); a 2.077/2014 é do pronto-socorro.
- **COFEN:** Res. 713/2022 (SBV: técnico + condutor; SIV: enfermeiro; SAV: enfermeiro + médico + condutor).
- **Condutor:** CTB arts. 143 e 145/145-A + Res. CONTRAN 1.020/2025 (renovação a cada 5 anos). CNH D para van de 15+1.
- **Médico regulador:** CRM ativo + capacitação em regulação de urgência (PT 2.048/2002). ⚠️ Não existe RQE "em APH";
  o RQE possível é Medicina de Emergência.
- **NR-32** (saúde e segurança em serviços de saúde) e **NR-4** (SESMT, grau de risco 3).
