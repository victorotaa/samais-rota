---
name: samais-municipal-study
description: >
  Executa varredura completa e produz estudo de caso/precificação municipal para prospecção comercial da Samais Gestão em Saúde.
  Use SEMPRE que Victor (ou outro membro da equipe Samais) sinalizar uma cidade-alvo, município, consórcio intermunicipal
  ou região para avaliação de oportunidade de contrato SAMU, UPA, Hospital ou demais serviços. Triggers explícitos:
  "cidade alvo", "município alvo", "estudo de caso", "estudo de precificação", "varredura", "prospecção [cidade]",
  "oportunidade comercial [cidade/região]", ou qualquer menção a uma cidade/município seguida de contexto de negociação.
  O output é sempre um HTML single-file completo em dark mode Samais, estruturado em Partes numeradas, com cenários
  Mínimo/Base/Amplo, composição de preço em BDI decomposto (nunca "lucro"), e personalização visual por imagens do
  município-alvo. Referência viva: estudo Consórcio 33 Municípios / CRU Sorriso-MT.
---

# Samais — Skill: Estudo Municipal / Precificação

## Propósito

Sempre que um município ou consórcio entra no radar comercial da Samais, produzir um **dossiê estratégico e comercial completo** antes de qualquer reunião ou manifestação formal. Este skill codifica o protocolo-padrão: varredura de dados, curadoria visual, cruzamento analítico, composição de preço em BDI decomposto, e geração de HTML de apresentação em identidade visual Samais (dark mode) estruturado em Partes numeradas.

O output é **HTML single-file**, autossuficiente, funcionando como material de apresentação ao cliente e inteligência interna da equipe comercial.

---

## Protocolo de Execução

### FASE 1 — Qualificação do Alvo

Antes de pesquisar, confirme ou extraia do contexto:

1. **Alvo** — município isolado, lista de municípios, ou consórcio intermunicipal (nome exato + UFs)
2. **Serviço de interesse** — SAMU 192 / UPA / Hospital / mão de obra / combinação
3. **Gatilho do interesse** — licitação iminente, edital publicado, contato espontâneo, indicação política, formação de consórcio, renovação
4. **Operador atual** — Samais já opera? Concorrente? Prefeitura direta? Não existe ainda?
5. **CRU / Sede** — quando consórcio, qual município sedia a Central de Regulação?

Se faltar (1), (2) ou (3), **perguntar antes de prosseguir**. Não iniciar pesquisa cega.

---

### FASE 2 — Varredura (web_search + image_search obrigatórios)

Registrar fonte e data para cada bloco.

#### 2.1 Perfil Demográfico e Geográfico
- `[município] [UF] IBGE população 2024 censo`
- `[município] [UF] IDH PIB per capita área`
- Extrair: população, área (km²), densidade, IDH, PIB per capita, taxa de urbanização, distribuição rural/urbana
- **Para consórcios:** repetir por município-membro e consolidar em tabela comparativa

#### 2.2 Infraestrutura de Saúde
- `[município] hospitais UPA leitos CNES saúde`
- `[município] [UF] rede de atenção saúde secretaria macrorregião`
- Extrair: hospitais (público/privado/filantrópico), leitos SUS, leitos/mil hab (referência: 2,0/mil), UPAs, cobertura APS, hospital regional de referência (chave em consórcios)

#### 2.3 Status Atual do SAMU
- `SAMU [município] [UF] 192 cobertura`
- `SAMU [município] licitação contrato gestão operador`
- `SAMU [município] [UF] frota USB USA motolância central regulação`
- Extrair: SAMU existe? Operador (prefeitura/OS/empresa)? Frota atual? Central própria ou compartilhada? Habilitação federal?

#### 2.4 Perfil Epidemiológico e de Urgência
- `[município] [UF] mortalidade causas óbito SIM DATASUS`
- `[município] acidentes trânsito rodoviário internações`
- Extrair: principais causas de mortalidade, mortalidade por causas externas, perfil de demanda APH estimado

#### 2.5 Contexto Político-Institucional
- `prefeito [município] [UF] 2025 2026`
- `secretário saúde [município] [UF]`
- `[município] consórcio intermunicipal saúde`
- `[UF] governador secretário estadual saúde`
- Extrair: prefeito (partido, mandato), secretário de saúde, consórcios, alinhamento com governo estadual/federal

#### 2.6 Capacidade Orçamentária e Cofinanciamento
- `[município] [UF] FPM repasse federal saúde`
- `[município] SIOPS gasto saúde per capita`
- `[município] CAUC situação fiscal`
- `portaria SAMU cofinanciamento federal [ano vigente]`
- Extrair: receita total, % gasto em saúde (mínimo 15%), gasto per capita, situação CAUC, habilitação para cofinanciamento federal SAMU (50%)

#### 2.7 Análise Competitiva e Licitatória
- `licitação SAMU [município] [UF] edital pregão PNCP`
- `OS organização social saúde [UF] contratos`
- Extrair: editais publicados, vencedores anteriores, valores praticados, modalidade, vigências

#### 2.8 **CURADORIA VISUAL**

Executar `image_search` para cada município-alvo:

1. `[município] [UF] vista aérea drone` → **cover-hero** (capa)
2. `[município] [UF] centro cidade praça` → **context-card** (seção de território)
3. `[município] [UF] hospital saúde` → **infra-visual** (seção de infraestrutura)
4. `[município] [UF] paisagem região` → **part-divider** (entre Partes)

**Para consórcios:** priorizar o município-sede da CRU. Usar vistas gerais da região para os dividers.

**Linguagem Samais / SAMU** (imagens permanentes da marca — usar como pontuação visual):
- `ambulância SAMU atendimento emergência` → seção de frota
- `central de regulação médica operadores` → seção da CRU
- `paramédicos APH atendimento cena` → seção de capacitação/diferenciais
- `motolância SAMU urbana` → quando motolância estiver na proposta

Selecionar **3–5 imagens principais** por estudo. Para cada uma, registrar URL da fonte. Preferência: Unsplash/Pexels (uso livre comercial) sobre imagens de portais municipais (risco de direito autoral).

**Fallback obrigatório:** toda zona de imagem deve ter gradiente ouro/preto como fallback quando a busca falhar, mantendo a coesão visual.

---

### FASE 3 — Análise, Cruzamento e Composição Comercial

#### 3.1 Score de Atratividade (0–10 por critério, ponderado)

| Critério | Peso | Como avaliar |
|---|---|---|
| Porte populacional | 20% | <50k=3 / 50–200k=7 / >200k=10 |
| Fragilidade do SAMU atual | 25% | Sem SAMU=10 / prefeitura direta=8 / OS fraca=6 / concorrente forte=3 |
| Capacidade orçamentária | 20% | Gasto saúde per capita + CAUC regular |
| Janela política | 15% | 1º mandato / alinhamento federal = nota maior |
| Licitação / edital iminente | 20% | Edital publicado=10 / previsto=7 / sem info=4 |

Resultado em gauge SVG (0–10) na seção de Sumário Executivo.

#### 3.2 Dimensionamento em 3 Cenários

Seguir benchmarks em `/references/benchmarks-samu.md`. Sempre produzir **trio**:

| Cenário | Lógica |
|---|---|
| **Mínimo Regulatório** | Cobertura mínima exigida pela PNAU — base de comparação |
| **Base Operacional ★** | Recomendação Samais — equilíbrio cobertura/custo/cofinanciamento |
| **Cobertura Ampliada** | Ideal técnico — útil para projeção de expansão futura |

Cada cenário entrega: frota (USB / USA / motolância), bases, colaboradores estimados, custo operacional mensal.

#### 3.3 Composição do Valor Contratual (BDI decomposto — 35%)

**REGRA CRÍTICA: Nunca declarar "lucro", "margem" ou "lucratividade"** em nenhuma superfície da proposta. Sempre apresentar como **"Composição do Valor Contratual"** ou **"Encargos e Provisões Contratuais"**.

Ver `/references/composicao-preco.md` para tabelas prontas, justificativas por linha e textos de apresentação.

Decomposição-padrão dos 35% sobre CDO (Custo Direto Operacional):

| Componente | % sobre CDO |
|---|---|
| Tributos sobre faturamento (PIS/COFINS + ISS + IR/CSLL) | 13,5% |
| Despesas administrativas e de gestão corporativa | 8,0% |
| Tecnologia, sistemas e inovação operacional (CoPilot OS) | 5,0% |
| Reserva técnica operacional (frota, equipamentos, contingências) | 3,0% |
| Capacitação continuada e desenvolvimento técnico | 2,0% |
| Contingências, seguros e garantias contratuais | 2,5% |
| Remuneração empresarial | 4,0% |
| **Total BDI apresentado** | **38,0%** |
| *Floor de negociação* | *37,5%* |

**Fórmula:**
```
Valor Contratual = CDO × 1,35
CDO = Frota + Pessoal + Insumos + Combustível + Manutenção + Overhead Operacional
```

**Cofinanciamento federal SAMU (quando aplicável):**
- 50% federal (portaria MS vigente) + 50% local (estado + município/consórcio)
- Apresentar o valor local líquido separadamente — é o número que fecha com o prefeito

#### 3.4 Argumento de Fechamento (padrão Sorriso)

Toda proposta termina com **custo per capita/mês** após cofinanciamento federal:
```
R$ [X],XX / habitante / mês
```
Esse é "o número que fecha com o prefeito". Apresentar com comparativos (café, pão francês, imposto municipal) quando couber.

#### 3.5 Diagnóstico Narrativo

Parágrafo síntese (5–8 linhas) com: situação atual, principal vulnerabilidade, posicionamento Samais, alertas de risco.

---

### FASE 4 — Geração dos dois HTMLs

Ler **antes de escrever qualquer código:**
- `/references/design-system.md` — tokens, componentes, CSS base
- `/references/composicao-preco.md` — tabelas e textos de BDI prontos

**Todo estudo gera DOIS arquivos distintos, com audiências opostas.**

---

#### OUTPUT A — Proposta Comercial Externa (`-proposta-[municipio].html`)

Documento entregável ao ente público (prefeito, secretário de saúde, presidente de consórcio).
**Linguagem propositiva, prospectiva e institucional. Zero linguagem de risco, zero análise interna.**

Seções do OUTPUT A (ordem obrigatória):

- **CAPA** — cover-hero com imagem do município, título em Syne, 4 cover-stats em linha, tag cyan "Proposta Técnica e Comercial"
- **APRESENTAÇÃO SAMAIS** — quem somos, portfólio de contratos, diferenciais (CoPilot OS como destaque principal), escala nacional
- **PARTE I — O Território e Sua Saúde** — demografia, infraestrutura hospitalar, perfil de demanda APH. Tom: "entendemos sua realidade"
- **PARTE II — A Solução Samais para [Município/Região]** — dimensionamento proposto (Cenário Base ★ com Mínimo e Ampliado como referência), distribuição de bases, frota, equipe. Tom: "aqui está o que entregamos"
- **PARTE III — O Financiamento que Viabiliza** — cofinanciamento federal 50%, normativas, custo efetivo para o município. Tom: "isso é mais acessível do que parece"
- **PARTE IV — Composição do Valor Contratual** — tabela BDI decomposto, memória de cálculo, valor mensal/anual/5 anos, argumento per capita/mês
- **PARTE V — Tecnologia e Inovação: Samais CoPilot OS** — seção dedicada ao produto de IA, diferenciais vs. operação direta ou concorrentes, impacto em tempo-resposta e qualidade regulatória
- **PARTE VI — Por Que a Samais** — capacidade técnica, método, tecnologia (CoPilot OS) e modelo de transição, apoiada nos **atestados reais de SAMU 192, transferência inter-hospitalar e regulação** (cases Ourinhos e CISNORPI — este é o serviço que casa com esta skill). **Descrever cada case só com o que o atestado documenta — nunca fabricar operação/frota/escala não comprovada.**
- **FECHO** — pela tese/valor. **Sem campo de contato** (nem reunião, e-mail, telefone, formulário): a Samais só é rastreável por contato de saída dela
- **RODAPÉ** — "samais · gestão + saúde" + data + versão (SEM "confidencial")

**Regras absolutas do OUTPUT A:**
- ❌ Nenhuma menção a risco, alerta, resistência, ameaça, concorrente, desvantagem, limitação
- ❌ Nenhuma análise política interna (mapa de influência, partido, histórico de irregularidades)
- ❌ Nenhuma nota metodológica ou alerta de dado estimado visível ao leitor externo
- ❌ Nenhum dado negativo sobre o ente público (déficit, inadimplência, fraqueza orçamentária)
- ❌ Nenhuma seção de "análise competitiva" ou "contexto licitatório"
- ✅ Tom sempre: parceiro estratégico, especialista, confiável, inovador
- ✅ Cada seção responde à pergunta implícita do prefeito: "Por que contratar a Samais?"

---

#### OUTPUT B — Dossiê Estratégico Interno (`-dossie-[municipio].html`)

Documento de uso exclusivo interno Samais (equipe comercial, diretoria).
Contém toda a inteligência de prospecção que **não pode ir ao cliente**.

Seções do OUTPUT B (ordem obrigatória):

- **CAPA** — idêntica ao OUTPUT A com tag "USO INTERNO · CONFIDENCIAL"
- **SUMÁRIO EXECUTIVO INTERNO** — gauge de score + diagnóstico rápido em bullets + verdict Go/Atenção/No-Go + valor síntese
- **PARTE I — Território e Contexto Regional** — completo, incluindo notas metodológicas e dados estimados sinalizados
- **PARTE II — Infraestrutura e Diagnóstico SAMU** — completo, com alertas de dados não confirmados
- **PARTE III — Perfil Epidemiológico** — completo
- **PARTE IV — Dimensionamento** — completo com memória de cálculo e alertas metodológicos
- **PARTE V — Financiamento Federal** — completo com análise de risco fiscal do município
- **PARTE VI — Composição do Valor Contratual** — completo com BDI decomposto e estratégia de negociação
- **PARTE VII — Contexto Político-Institucional** — completo: prefeito, partido, mandato, mapa de influência e decisão, sequência de abordagem recomendada, riscos políticos
- **PARTE VIII — Análise Competitiva e Licitatória** — completo: operadores identificados, histórico de editais, portas de entrada, riscos competitivos
- **PARTE IX — Recomendação Estratégica Interna** — verdict + justificativa + próximos passos táticos + riscos críticos
- **RODAPÉ** — "USO INTERNO EXCLUSIVO SAMAIS · CONFIDENCIAL" + data + versão

---

#### Instruções de geração (ambos os outputs)

- Paleta obrigatória: `#C9A84C` / `#EAC97A` (ouro), `#16a085` (cyan institucional), `#060709` (bg), `#131620` (bg3)
- Fontes: Syne (display), Plus Jakarta Sans (corpo), JetBrains Mono (dados e eyebrows)
- Nav lateral fixo com scroll spy, destacando Parte ativa
- Cover-stats em linha (4 números grandes + labels em Mono)
- Cenários em grid de 3 colunas, **Base Operacional com badge "★ RECOMENDADO"** em dourado
- Boxes coloridos: `box-cyan` (destaque institucional), `box-gold` (síntese estratégica), `box-green` (validação fiscal)
- Tabelas com header em Mono dourado + linhas alternadas
- Zonas de imagem com overlay escuro e fallback em gradiente
- Dados ausentes: no OUTPUT A — omitir ou usar "a confirmar em diagnóstico de campo"; no OUTPUT B — marcar com `.data-missing`
- OUTPUT A não tem nav-item "Análise Competitiva", "Contexto Político" nem "Recomendação"
- OUTPUT B mantém estrutura completa com todas as seções

---

### FASE 5 — Entrega

1. Salvar os dois arquivos:
   - `samais-proposta-[municipio]-[YYYY-MM].html` → OUTPUT A (externo)
   - `samais-dossie-[municipio]-[YYYY-MM].html` → OUTPUT B (interno)
2. Chamar `present_files` com ambos, apresentando o OUTPUT A primeiro
3. Resumir em chat (nunca no OUTPUT A) em no máximo 6 bullets:
   - Score de atratividade e verdict Go / Atenção / No-Go
   - Cenário recomendado (frota + custo operacional mensal)
   - Valor contratual (mensal + anual + 5 anos) e custo per capita pós-cofinanciamento
   - Principal porta de entrada e sequência de abordagem
   - 2–3 riscos críticos que a equipe comercial precisa monitorar
   - Próximo passo sugerido (reunião com quem, via qual canal)


---

### FASE 6 — Deploy Netlify e Mensagem para Diretoria

#### 6.1 Preparação do nome do projeto

Gerar slug Netlify a partir do nome do município/consórcio/região:
- Apenas letras minúsculas, hífens, sem acentos ou caracteres especiais
- Máximo 60 caracteres
- Padrão: `samais-[regiao-ou-municipio]`
- Exemplos: `samais-vale-do-jurumirim`, `samais-sorriso-mt`, `samais-consorcio-norte-mt`

#### 6.2 Deploy via API Netlify

**Requer:** `NETLIFY_AUTH_TOKEN` — solicitar ao Victor antes de executar a FASE 6, caso não esteja no contexto.

Executar o seguinte fluxo em Python/bash:

```python
import requests, zipfile, os, json, time

NETLIFY_TOKEN = os.environ.get("NETLIFY_AUTH_TOKEN")  # ou pegar do contexto
SITE_SLUG = "samais-[regiao]"  # slug gerado na 6.1
HTML_PATH = "/mnt/user-data/outputs/samais-proposta-[municipio]-[YYYY-MM].html"

headers = {
    "Authorization": f"Bearer {NETLIFY_TOKEN}",
    "Content-Type": "application/json"
}

# 1. Criar o site com nome personalizado
site_payload = {
    "name": SITE_SLUG,
    "custom_domain": None
}
r = requests.post("https://api.netlify.com/api/v1/sites", 
                  json=site_payload, headers=headers)
site = r.json()
site_id = site["id"]
site_url = site.get("ssl_url") or site.get("url")

# Se o site já existir com esse nome, buscar pelo slug:
# r = requests.get(f"https://api.netlify.com/api/v1/sites?name={SITE_SLUG}", headers=headers)
# site_id = r.json()[0]["id"]

# 2. Fazer o deploy do HTML como index.html
with open(HTML_PATH, 'rb') as f:
    html_content = f.read()

# Calcular SHA1 do arquivo
import hashlib
sha1 = hashlib.sha1(html_content).hexdigest()

# Criar deploy com file digest
deploy_payload = {
    "files": {"index.html": sha1},
    "async": False
}
r = requests.post(f"https://api.netlify.com/api/v1/sites/{site_id}/deploys",
                  json=deploy_payload, headers=headers)
deploy = r.json()
deploy_id = deploy["id"]

# 3. Upload do arquivo
upload_headers = {
    "Authorization": f"Bearer {NETLIFY_TOKEN}",
    "Content-Type": "text/html"
}
requests.put(
    f"https://api.netlify.com/api/v1/deploys/{deploy_id}/files/index.html",
    data=html_content,
    headers=upload_headers
)

# 4. Aguardar processamento
time.sleep(5)
print(f"Deploy concluído: {site_url}")
```

Se o site_slug já estiver em uso por outro projeto da Samais, tentar `samais-[regiao]-[ano]` como fallback.

**URL final esperada:** `https://samais-[regiao].netlify.app`

#### 6.3 Renomear projeto existente (quando já houver site no Netlify)

Quando Victor indicar que já existe um site (ex: `samais-jurimin`) e quiser renomear para o nome correto do consórcio/região:

```python
# Atualizar o nome do site existente
SITE_ID = "[id do site existente]"
r = requests.patch(
    f"https://api.netlify.com/api/v1/sites/{SITE_ID}",
    json={"name": SITE_SLUG},
    headers=headers
)
```

#### 6.4 Geração da mensagem para André

Após o deploy bem-sucedido, gerar mensagem via `message_compose_v1` com:

- **Tipo:** WhatsApp (textMessage) ou e-mail, conforme indicado por Victor
- **Tom:** direto, confiante, institucional — entre colegas de diretoria, não entre fornecedor e cliente
- **Estrutura obrigatória:**
  1. Contexto em 1 linha (qual região/município)
  2. Link do estudo (URL Netlify)
  3. Destaque do valor contratual do Cenário Base
  4. 1 frase sobre CoPilot OS como diferencial
  5. Call-to-action claro (reunião, validação, próximo passo)

**Template de mensagem (WhatsApp):**
```
André, seguem os dados da proposta [Município/Região].

Estudo completo: [URL Netlify]

Cenário Base: R$ [X.XXX.XXX]/mês · R$ [XX,X]M/ano
Custo efetivo pós-cofinanciamento federal: R$ [X,XX]/habitante/mês

A proposta já inclui o posicionamento do CoPilot OS como diferencial — única plataforma de IA para regulação SAMU com dataset proprietário no Brasil.

Quando você tiver visto, posso agendar com a equipe para [próximo passo sugerido]?
```

**Template de e-mail (quando mais formal):**
- Assunto: `Samais · Estudo [Região] — Proposta Técnica e Comercial`
- Corpo: expandir o WhatsApp com introdução de 2 linhas sobre o contexto e encerrar com assinatura Samais

#### 6.5 Checklist da FASE 6

- [ ] Slug Netlify gerado e sem caracteres especiais
- [ ] Site criado/renomeado com nome correto no Netlify
- [ ] OUTPUT A (proposta externa) deployado como `index.html`
- [ ] URL confirmada e acessível: `https://samais-[regiao].netlify.app`
- [ ] Mensagem gerada com `message_compose_v1`
- [ ] Link e valor contratual do Cenário Base presentes na mensagem
- [ ] CoPilot OS mencionado na mensagem como diferencial

---

## Notas Operacionais

- **Dados ausentes:** no OUTPUT B — marcar com `.data-missing` referenciando DATASUS/CNES/SIOPS. No OUTPUT A — omitir ou usar linguagem de convite ao diagnóstico de campo (ex: "a detalhar em visita técnica"). Nunca inventar em nenhum dos dois.
- **Markup:** **SEMPRE 35% sobre CDO**, SEMPRE decomposto em BDI. Nunca declarar "lucro".
- **Consórcios:** dimensionamento e BDI unificados; perfis demográfico e de saúde em tabela comparativa por município-membro.
- **Imagens:** Unsplash/Pexels prioritários. Toda zona com fallback em gradiente.
- **Datação:** todo dado IBGE/DATASUS com data de extração. Base 2022 = "estimativa 2024".
- **Linguagem Samais:** SAMU — a marca se comunica com imagens de ambulância, central de regulação, APH em cena. Usar com parcimônia, como pontuação visual, não decoração.

---

## Referências Internas

- `/references/design-system.md` — sistema de design dark mode Samais (tokens, componentes, image zones, CSS pronto)
- `/references/benchmarks-samu.md` — custo/USB, custo/USA, dimensionamento por população, KPIs
- `/references/composicao-preco.md` — BDI decomposto pronto, textos de justificativa, comparativos de mercado
- `/references/checklist-licitacao.md` — análise de editais, habilitação, red flags
