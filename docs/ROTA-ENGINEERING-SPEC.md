# ROTA — Especificação de Engenharia
### Guia para o desenvolvedor que vai materializar o ROTA · Samais Gestão em Saúde

| | |
|---|---|
| **Versão** | 1.0 · jul/2026 |
| **Status** | Base de implementação — a construir |
| **Complementa** | `docs/ROTA-SPEC.md` (spec de **produto**, v1.0) — este documento é a camada de **engenharia** |
| **Protótipo de referência** | `rota-app.html` · https://samais-rota.vercel.app/rota-app.html |
| **Dono do produto** | Victor (Samais) |
| **Confidencial** | Uso interno Samais |

> Este documento **não repete** os requisitos funcionais (RF-01…RF-08) nem as regras de
> negócio (RN-01…RN-10) — eles vivem em `ROTA-SPEC.md` e são a fonte da verdade do
> comportamento. Aqui está **como construir**: decisão de arquitetura, stack, modelo de
> dados executável, superfície de API, conformidade em código, segurança e faseamento.
> O protótipo `rota-app.html` é a **referência visual e de fluxo** — a UI final deve
> reproduzir suas telas, não reinventá-las.

---

## 1 · A pergunta que este documento responde primeiro

Antes de escrever a primeira linha do backend, uma decisão precisa estar fechada: **o
ROTA deve ser um módulo do PEP OS, ou um produto separado?** A Samais já tem dois
produtos vivos no mesmo cliente (o município SUS), e o ROTA seria o terceiro. Construir
sem responder isto é como abrir fundação sem saber se é casa ou prédio.

A recomendação está na §2. O resto do documento (stack, dados, API) **decorre dela**.

---

## 2 · Decisão de arquitetura — ROTA junto ou separado do PEP OS

### 2.1 · O portfólio Samais hoje (fatos)

Cruzamento feito com as specs internas `[Samais]Specs-PEP-OS.md`,
`[Samais]Specs-CoPilot-OS.md` e `[Samais]Dossie-PEP-OS.md` (vault Obsidian no Drive).

| Produto | O que é | Maturidade | Stack declarada |
|---|---|---|---|
| **SAMU CoPilot OS** | Inteligência clínico-operacional da central 192 (regulação de urgência) | **Em produção**, 130+ municípios; dataset proprietário APH-BR | NestJS + Prisma + PostgreSQL 16 · React/Vite/Tailwind · FastAPI (IA) · GCP `southamerica-east1` · microsserviços · multi-tenant `municipalityId` |
| **PEP OS** | Prontuário Eletrônico municipal, FHIR-nativo, certificável SBIS NGS2, integrado à RNDS | **Spec aprovada, pré-implementação** (Sprint 1 = bootstrap) | NestJS + **Java/Kotlin Spring Boot** (núcleo clínico) · HAPI FHIR R4 · React/Next 14 · React Native/Expo · PostgreSQL 15 + RLS · Keycloak · K8s AWS `sa-east-1` · monorepo Turborepo `samais/pep-os` |
| **ROTA** | Gestão fina de transporte sanitário **eletivo** (viagens, frota, manifestos, comprovação de repasse) | **Protótipo HTML entregue** (`rota-app.html`); backend a construir | — (a decidir aqui) |

Dois fatos estruturais saltam do cruzamento:

1. **Os dois produtos existentes já NÃO compartilham uma stack única.** CoPilot é GCP +
   Prisma + microsserviços; PEP é AWS + Spring/HAPI + monolito modular. O que eles
   **de fato** compartilham é uma **fundação de três camadas**, explicitada no próprio
   dossiê: **(a)** o *design system* Samais (Syne/Inter/JetBrains Mono, `#0A0A0A`/`#B8954E`),
   **(b)** a *Camada Samais de IA* + o dataset *APH-BR*, e **(c)** o padrão de *tenancy por
   município/consórcio* e os *contratos FHIR/handoff*. A integração entre eles é por
   **handoff/FHIR, não por banco comum**. Essa já é a doutrina de arquitetura da casa:
   **produtos verticais, credenciados de forma independente, sobre fundação compartilhada.**

2. **Nem PEP OS nem CoPilot OS modelam o domínio do transporte eletivo.** Confirmado nas
   duas specs: não existe entidade de Viagem, Rota, Manifesto, Frota-eletiva,
   baixa de km/combustível/presença, nem a comprovação de **repasse federal de transporte**
   (Portarias 11.164/11.179/2026 — regulatoriamente distinta do faturamento clínico
   BPA/AIH/APAC/CMD que o PEP modela). O único "deslocamento" que existe é a viatura de
   urgência do SAMU (`Dispatch.vehicleType: USA|USB|MOTOLANCIA`), que é despacho reativo,
   não transporte agendado recorrente.

### 2.2 · Mapa de sobreposição (ROTA × plataforma existente)

| Domínio do ROTA | PEP OS | CoPilot OS | Veredito para o ROTA |
|---|---|---|---|
| Identidade/cadastro do paciente por **CNS/CADSUS** | **Forte** — módulo 2.1 (dedup, sync CADSUS, `Cidadao` persistente) | Fraco — paciente é efêmero, embutido na ocorrência | **Reusar padrão do PEP** (paciente recorrente é o que o ROTA precisa) |
| **Multi-tenant por município/consórcio** | **Forte** — shared DB + `tenant_id` + RLS Postgres; tenant = município **ou** consórcio | Forte — `municipalityId` | **Reusar** — é exatamente o modelo `base_id` do ROTA |
| **Auth / RBAC / MFA** | Forte — Keycloak + RBAC/ABAC | Forte — JWT + RBAC + MFA | **Reusar padrão** (ver ADR-002) |
| **Assinatura + trilha de auditoria imutável** | Forte — `DocumentoClinico` assinado ICP-Brasil, hash encadeado | Forte — cadeia de custódia QLDB, SHA-256 | **Reusar conceito** (audit_log encadeado; ICP quando faturar) |
| **Geração de PDF/impressos** | Forte — PDF PAdES assinado | Médio — export assinado | **Reusar infra**, impressos do ROTA são novos |
| **Faturamento/registro SUS** | Forte — BPA/AIH/APAC/CMD, envio RNDS | — | **Fundação reusável; repasse de transporte é novo** |
| **Frota/veículos** | Inexistente | **Médio** — `vehicleId`/`vehicleType`, `GET /vehicles`, telemetria MQTT | CoPilot é o parente mais próximo, mas urgência ≠ eletivo |
| **Programação/viagem recorrente** (hemodiálise 3×/sem) | Inexistente | Inexistente (despacho é em segundos) | **100% novo — é o coração do ROTA** |
| **Manifesto/embarque/baixa km-combustível** | Inexistente | Inexistente | **100% novo** |
| **Comprovação de repasse de transporte** (Port. 11.164/11.179) | Inexistente (modela faturamento clínico, não de transporte) | Inexistente | **100% novo** |

**Leitura:** ~40% do ROTA é **plataforma horizontal** que a casa já sabe fazer
(identidade/CNS, tenancy município/consórcio, auth, assinatura+auditoria, PDF). Os outros
~60% são **domínio vertical de logística de transporte** que **não existe em lugar nenhum**
da Samais e é regulatoriamente próprio.

### 2.3 · Recomendação

> **ROTA = produto separado, verticalizado em transporte, construído sobre a Fundação
> Samais compartilhada. Não fundir como módulo do PEP OS; não construir 100% standalone.**

É exatamente o encaixe que a Samais **já pratica** entre CoPilot OS e PEP OS. O ROTA é o
terceiro vértice do mesmo padrão. Concretamente:

- **Repositório próprio** (`samais-rota`, este repo), deploy próprio, ciclo de release
  próprio, narrativa comercial própria.
- **Consome a fundação compartilhada** — não a reimplementa: design system, padrão de
  tenancy município/consórcio, auth/RBAC, assinatura+auditoria, geração de PDF, e os
  **contratos FHIR** para, no futuro, conversar com o PEP OS.
- **Integra por handoff/FHIR**, nunca por banco compartilhado. Um paciente de hemodiálise
  que existe no PEP OS como `Cidadao` pode ser referenciado no ROTA por CNS; a comprovação
  de deslocamento que o ROTA produz pode, na Fase 3, ser exportada ao PEP OS / sistemas SUS.

### 2.4 · Por que não fundir no PEP OS (as três razões que decidem)

1. **Cadência.** O PEP OS carrega uma superfície de conformidade altíssima (NGS2, RNDS,
   dezenas de portarias clínicas, certificação SBIS de ~24 meses) e está **pré-código**.
   Acoplar o ROTA a esse ciclo mataria a única vantagem de tempo do ROTA: a **janela de 60
   dias** após o município receber o veículo federal (RN-07). O ROTA precisa ir a uma
   licitação em semanas, não esperar o núcleo clínico certificar.
2. **Superfície regulatória distinta.** O PEP prova produção clínica (BPA/CMD → SISAB/RNDS).
   O ROTA prova **deslocamento** (Portarias 11.164/11.179 → farol de repasse, elegibilidade
   >50 km). São instrumentos diferentes; misturá-los polui os dois modelos de dados.
3. **Base de prova e narrativa comercial diferentes.** O PEP/CoPilot ancoram-se na
   credencial real de **SAMU** (atestados Ourinhos, CISNORPI; dataset APH-BR). O ROTA
   **não tem case de transporte** — sua prova é o **sistema (demo) + a lei pública**
   (regra do `CLAUDE.md`). Não se deve carregar a credencial de um serviço para o outro.
   Produtos separados mantêm essa disciplina limpa.

### 2.5 · Por que não construir 100% standalone

Reimplementar tenancy município/consórcio, auth, assinatura, auditoria e PDF do zero
seria **duplicar a espinha dorsal** que o PEP já especificou e o CoPilot já roda em
produção — e divergir dela criaria dois jeitos Samais de fazer a mesma coisa. A economia
está em **extrair a fundação como pacotes compartilhados** (§3.3) e o ROTA consumi-los.

### 2.6 · Consequência para a stack

Adotar a **linhagem do CoPilot OS** (o produto Samais que **já roda**), não a do PEP:
**NestJS + Prisma + PostgreSQL + React/Vite/Tailwind**. Razão: o ROTA é um app de
**CRUD + logística + relatórios**, não um motor de regras clínicas — não precisa do peso
Java/Spring + HAPI FHIR do núcleo do PEP. Do PEP, adota-se o **padrão de tenancy
(shared-DB + `base_id` + RLS)**, idêntico ao que o ROTA já desenhou. É a combinação mais
leve e mais rápida de colocar em pé, e reaproveita times/conhecimento que a casa já tem.

---

## 3 · Stack e decisões (ADRs)

### 3.1 · Stack recomendada

| Camada | Escolha | Nota |
|---|---|---|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind (tokens Samais) | Espelha o CoPilot OS. Migrar o `rota-app.html` para componentes; **preservar o design system e as telas do protótipo** |
| **Estado (front)** | Zustand + React Query | Leve; o estado do protótipo já é orientado a "store" |
| **Backend** | NestJS (Node 20 + TypeScript) | Mesma linhagem do CoPilot; um serviço só (monolito modular), **não** microsserviços |
| **ORM** | Prisma | Schema em `prisma/schema.prisma`; migrations versionadas |
| **Banco** | PostgreSQL 15+ (gerenciado, região BR) | Supabase / Neon / RDS `sa-east-1`. RLS por `base_id` (§5) |
| **Auth** | Ver ADR-002 | Supabase Auth no MVP; caminho para Keycloak/SSO do ente |
| **PDF** | Renderização server-side do A4 (ver §8) | Manifesto, folha de embarque, relatório mensal |
| **Deploy** | Vercel (front + API routes finas) **ou** container único (front estático + API Nest) | Alinhar com o time; Vercel já é o padrão do repo |
| **Observabilidade** | Sentry + logs estruturados | OpenTelemetry quando escalar |

### 3.2 · ADRs

- **ADR-001 · Produto separado sobre fundação compartilhada.** Ver §2. *Decidido.*
- **ADR-002 · Autenticação: Supabase Auth no MVP, com abstração para SSO do ente.**
  Um perfil (gestor local), e-mail+senha+2FA, sessão por base (§3 da spec de produto).
  Encapsular atrás de uma interface `AuthProvider` para, na Fase 3, plugar Keycloak/Gov.br
  do ente sem reescrever telas. *Decidido, revisável.*
- **ADR-003 · Monolito modular, não microsserviços.** O PEP OS decidiu o mesmo ("equipe de
  4 não suporta microsserviços"). O ROTA é menor ainda. Um serviço NestJS com módulos
  (`pacientes`, `programacao`, `frota`, `impressos`, `lancamentos`, `painel`, `relatorios`).
- **ADR-004 · `base_id` = tenant, isolamento por RLS no banco (não por filtro na app).**
  Critério de aceite nº 1 da spec de produto exige isolamento **por RLS**. *Decidido.*
- **ADR-005 · Paper-first: o backend nunca assume conexão no campo.** A baixa é sempre
  assíncrona e idempotente (§7). *Decidido — é tese de produto.*
- **ADR-006 · Contratos FHIR só na fronteira de integração (Fase 3).** O core do ROTA usa
  seu próprio modelo relacional (§5). Mapeamento para FHIR (`Patient` por CNS, futura
  exportação de comprovação) fica isolado num adaptador, reusando `packages/fhir-types`
  da fundação Samais quando existir. Não FHIRizar o núcleo. *Decidido.*

### 3.3 · A fronteira compartilhada (o que o ROTA reusa vs. constrói)

Enquanto a Samais não publicar os pacotes de fundação, o ROTA implementa versões locais
**com a mesma interface**, para extração futura sem reescrita.

| Pacote de fundação | ROTA **reusa** (não reescreve) | ROTA **constrói novo** |
|---|---|---|
| `@samais/design-system` | tokens, tipografia, liquid glass, componentes base | telas específicas (manifesto, painel de frota) |
| `@samais/tenancy` | resolução de tenant, RLS helpers, contexto `base_id` | — |
| `@samais/auth` | provider, RBAC, 2FA, sessão | perfil "gestor local" |
| `@samais/pdf-sign` | pipeline PDF + (futuro) assinatura ICP | layouts A4 do ROTA |
| `@samais/audit` | `audit_log` encadeado, hash | eventos do domínio transporte |
| `@samais/fhir-types` (Fase 3) | tipos FHIR BR, `Patient`/CNS | adaptador de comprovação de transporte |
| **Domínio transporte** | — | **tudo: Viagem, Frota, Manifesto, baixa, repasse (§5)** |

---

## 4 · Arquitetura de alto nível

```
┌───────────────────────────────────────────────────────────┐
│  Front (React/Vite)  — telas do rota-app.html componentizadas │
│  Zustand + React Query · design system Samais                │
└───────────────┬───────────────────────────────────────────┘
                │  HTTPS (JWT, base_id no claim)
┌───────────────▼───────────────────────────────────────────┐
│  API NestJS (monolito modular)                              │
│  módulos: pacientes · programacao · frota · impressos ·     │
│           lancamentos · painel · relatorios · auth          │
│  middleware: tenant-context (seta base_id na conexão p/ RLS)│
│  serviços transversais: pdf, audit, conformidade(RN)        │
└───────────────┬───────────────────────────────────────────┘
                │  Prisma (SET app.base_id por request)
┌───────────────▼───────────────────────────────────────────┐
│  PostgreSQL (região BR) · RLS por base_id · audit_log       │
└───────────────────────────────────────────────────────────┘
                │  (Fase 3, opcional, por handoff/FHIR)
        ┌───────▼────────┐        ┌──────────────────┐
        │ CADSUS (CNS)   │        │ PEP OS / SUS      │
        │ via ente       │        │ (exporta prova)   │
        └────────────────┘        └──────────────────┘
```

Nenhum acesso a banco de outro produto Samais. Integração externa é sempre por API/FHIR
e sempre pela credencial do **ente público**, nunca da Samais isolada (regra do produto).

---

## 5 · Modelo de dados (executável)

Evolui o §7 da spec de produto para DDL. Toda tabela leva `base_id` + colunas de auditoria
(`created_at, updated_at, created_by, updated_by`). Chaves: `bigint identity` ou `uuid` —
padronize `uuid` (`gen_random_uuid()`), compatível com Supabase.

```sql
-- Tenants (contratos)
create table bases (
  id            uuid primary key default gen_random_uuid(),
  municipio     text not null,
  uf            char(2) not null,
  contratante   text not null,            -- prefeitura | consórcio | secretaria estadual
  contrato_ref  text,
  created_at    timestamptz not null default now()
);

-- Operadores (único perfil: gestor local)
create table gestores (
  id            uuid primary key default gen_random_uuid(),
  base_id       uuid not null references bases(id),
  nome          text not null,
  email         citext not null unique,
  ativo         boolean not null default true,
  -- credencial e 2FA delegados ao AuthProvider (ADR-002); aqui só o vínculo à base
  created_at    timestamptz not null default now()
);

-- Destinos de tratamento
create table destinos (
  id            uuid primary key default gen_random_uuid(),
  base_id       uuid not null references bases(id),
  nome          text not null,
  municipio     text not null,
  km            numeric(6,1) not null,     -- distância à base; alimenta elegibilidade >50km
  tipo          text not null              -- radioterapia | hemodialise | outro
);

-- Pacientes (recorrentes)
create table pacientes (
  id             uuid primary key default gen_random_uuid(),
  base_id        uuid not null references bases(id),
  nome           text not null,
  cns            varchar(15),              -- Cartão Nacional de Saúde
  nascimento     date,
  municipio      text,
  ponto_embarque text,
  tratamento     text,                     -- radioterapia | hemodialise | outro
  destino_id     uuid references destinos(id),
  recorrencia    smallint[] not null default '{}',  -- dias da semana (0=dom..6=sab)
  acompanhante   boolean not null default false,     -- ocupa assento (RN-01)
  necessidade    text,                     -- cadeirante | maca | menor_responsavel | null
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Autorização regulatória (a lista nasce na regulação, nunca na Samais)
create table autorizacoes (
  id                uuid primary key default gen_random_uuid(),
  base_id           uuid not null references bases(id),
  paciente_id       uuid not null references pacientes(id),
  processo_ref      text not null,         -- nº processo TFD/regulação
  origem            text not null,         -- TFD | regulacao
  validade          date,
  distancia_km      numeric(6,1),
  elegivel_federal  boolean generated always as
                      (distancia_km > 50 and distancia_km <= 500) stored  -- RN-05
);

-- Frota
create table veiculos (
  id               uuid primary key default gen_random_uuid(),
  base_id          uuid not null references bases(id),
  ident            text not null,          -- apelido operacional
  placa            varchar(8) not null,
  tipo             text not null,          -- van | micro_onibus | onibus | ambulancia | carro
  lotacao          smallint not null,      -- assentos (van 15, micro-ônibus 29...)
  condutor         text,                   -- motorista fixo (operacional, sem login)
  assistente       text,                   -- em ônibus/micro-ônibus
  hodometro        integer not null default 0,
  rev_intervalo_km integer,                -- intervalo de revisão
  prox_rev_km      integer,                -- odômetro-alvo da próxima revisão (RN-04)
  cnes_num         text,                   -- inscrição CNES do veículo (RN-07)
  cnes_prazo       date,                   -- data-limite (recebimento + 60 dias)
  recebido_em      date                    -- recebimento do veículo federal
);

-- Viagens (geradas da recorrência)
create table viagens (
  id            uuid primary key default gen_random_uuid(),
  base_id       uuid not null references bases(id),
  data          date not null,
  hora          time,
  destino_id    uuid not null references destinos(id),
  veiculo_id    uuid not null references veiculos(id),
  km_previsto   numeric(6,1),
  km_rodado     numeric(6,1),              -- preenchido na baixa
  status        text not null default 'programada', -- programada|concluida|cancelada
  created_at    timestamptz not null default now()
);

-- Pacientes por viagem (lotação = pacientes + acompanhantes)
create table viagem_pax (
  viagem_id     uuid not null references viagens(id) on delete cascade,
  paciente_id   uuid not null references pacientes(id),
  acompanhante  boolean not null default false,
  primary key (viagem_id, paciente_id)
);

-- Baixa de embarque/reembarque (papel → sistema, assíncrono)
create table embarques (
  viagem_id     uuid not null references viagens(id) on delete cascade,
  paciente_id   uuid not null references pacientes(id),
  presente_ida  boolean,
  presente_volta boolean,
  falta_motivo  text,
  primary key (viagem_id, paciente_id)
);

-- Abastecimentos (consumo km/l calculado na app)
create table abastecimentos (
  id               uuid primary key default gen_random_uuid(),
  base_id          uuid not null references bases(id),
  veiculo_id       uuid not null references veiculos(id),
  data             date not null,
  litros           numeric(6,2) not null,
  km_desde_ultimo  integer,
  valor            numeric(10,2)
);

-- Manutenções/revisões
create table manutencoes (
  id            uuid primary key default gen_random_uuid(),
  base_id       uuid not null references bases(id),
  veiculo_id    uuid not null references veiculos(id),
  data          date not null,
  km            integer,
  tipo          text,
  valor         numeric(10,2),
  descricao     text
);

-- Documentos emitidos (numeração sequencial por base)
create table documentos (
  id             uuid primary key default gen_random_uuid(),
  base_id        uuid not null references bases(id),
  tipo           text not null,           -- manifesto | folha | relatorio
  num_sequencial bigint not null,         -- sequência por base (ver §8)
  viagem_id      uuid references viagens(id),
  competencia    date,                    -- p/ relatório mensal
  emitido_em     timestamptz not null default now(),
  emitido_por    uuid references gestores(id),
  unique (base_id, tipo, num_sequencial)
);

-- Trilha imutável (dinheiro público exige)
create table audit_log (
  id            bigint generated always as identity primary key,
  base_id       uuid not null,
  gestor_id     uuid,
  acao          text not null,            -- create|update|delete|print|baixa
  entidade      text not null,
  entidade_id   uuid,
  ts            timestamptz not null default now(),
  payload       jsonb,
  prev_hash     bytea,                    -- encadeamento (conceito do PEP/CoPilot)
  hash          bytea
);
```

Notas de implementação:

- **`autorizacoes.elegivel_federal` é coluna gerada** — RN-05 vira invariante do banco,
  não lógica solta na app. `citext`/`gen_random_uuid` exigem `create extension citext;` e
  `pgcrypto` (presentes no Supabase).
- **Lotação (RN-01):** `count(viagem_pax) + count(acompanhante=true) ≤ veiculo.lotacao` —
  validar no serviço de programação e por `check`/trigger.
- **Maca → ambulância (RN-03):** o gerador de programação separa `paciente.necessidade='maca'`
  para viagem com `veiculo.tipo='ambulancia'`; nunca aloca maca em veículo comum.

---

## 6 · Multi-tenant e RLS (o item mais crítico de segurança)

Critério de aceite nº 1 da spec de produto: o gestor enxerga só a sua base **por RLS, não
por filtro na aplicação**. Padrão (idêntico ao PEP OS):

```sql
alter table pacientes enable row level security;   -- repetir p/ TODAS as tabelas com base_id
create policy tenant_isolation on pacientes
  using (base_id = current_setting('app.base_id')::uuid);
-- idem para gestores, destinos, autorizacoes, veiculos, viagens, viagem_pax,
-- embarques, abastecimentos, manutencoes, documentos, audit_log.
```

No NestJS, um **middleware de tenant-context** roda em cada request autenticado e executa
`SET app.base_id = $baseIdDoJWT` na conexão Prisma **antes** de qualquer query (Prisma:
`$executeRaw` no início da transação, ou extensão de client por request). O `base_id`
**vem do claim do JWT**, nunca de parâmetro do cliente. Um teste de segurança obrigatório
(critério de aceite): autenticado na base A, nenhuma query retorna linha da base B, mesmo
forjando IDs.

---

## 7 · Paper-first, baixa assíncrona e idempotência

O campo (motorista/assistente) trabalha na **prancheta impressa**; o sistema recebe a
baixa depois, pelo gestor (ADR-005). Implicações de engenharia:

- **Nada no fluxo de campo chama a API.** O backend só é tocado por: gestor cadastra,
  gestor programa, gestor imprime, gestor dá baixa.
- **Baixa idempotente:** relançar a baixa de uma viagem (correção) não duplica efeitos —
  `upsert` em `embarques` por `(viagem_id, paciente_id)`; recalcular `viagens.km_rodado`
  a partir do último valor lançado, não somando.
- **Ordem livre:** o gestor pode dar baixa de viagens de dias anteriores em qualquer ordem
  (fila de pendências, RF-05). Nenhuma baixa depende de outra.
- **Sem estado de campo no servidor:** não existe "check-in em tempo real" (RN-02, decisão
  de produto — fora de escopo). Não construir websocket de embarque.

---

## 8 · Impressos e PDF (A4 absoluto)

Três documentos (RF-04, RF-07): **manifesto geral semanal por veículo**, **folha de
embarque/reembarque por viagem**, **relatório mensal de comprovação**.

- **A4 absoluto 210×297 mm, margens 14 mm, sem responsividade** (regra do produto e do
  `CLAUDE.md`: no mobile o papel rola horizontalmente no contêiner — é a única exceção à
  regra "mobile sem scroll horizontal").
- **Numeração sequencial por base** (`documentos.num_sequencial`): gerar dentro de uma
  transação com `select ... for update` no maior número da base+tipo, ou uma sequence por
  base. **Auditável** — o número impresso é prova.
- **Render server-side** (não confiar no `window.print` do cliente para o documento de
  prova): HTML→PDF headless (Playwright/Chromium já disponível no ambiente, ou Puppeteer),
  reusando o layout A4 do protótipo. Cada emissão grava linha em `documentos` + `audit_log`
  (`acao='print'`).
- **Nota LGPD de descarte** impressa no rodapé (RN-10): o papel carrega dado de saúde;
  descarte seguro após a baixa. A retenção digital espelha o descarte físico.
- **Assinatura ICP-Brasil**: não obrigatória no MVP; entra quando o relatório mensal virar
  peça de faturamento formal (reusar `@samais/pdf-sign` — PAdES, como no PEP OS).

---

## 9 · Conformidade regulatória em código (RN → implementação)

O diferencial comercial do ROTA é **materializar em software o que a portaria exige**. Cada
regra vira código verificável, não texto:

| Regra | Implementação |
|---|---|
| **RN-05 · elegibilidade >50 km e ≤500 km** | Coluna gerada em `autorizacoes` (§5) + flag por viagem no painel. Radioterapia/hemodiálise (Port. 11.164/11.179). |
| **RN-06 · tríade obrigatória (km, custo, ocupação)** | KPIs de primeira classe no painel; nenhum fechamento mensal sem os três. |
| **RN-07 · CNES em 60 dias** | `veiculos.cnes_prazo = recebido_em + 60`; alerta no painel quando faltarem ≤ N dias; bloqueia "verde" no farol sem `cnes_num`. |
| **RN-08 · 3 meses sem registro → suspensão** | **Farol de repasse**: verde < 30 dias sem registro comprovado, âmbar 30–60, vermelho > 60. Calculado por base a partir da última viagem com baixa. É o alerta de maior valor do painel. |
| **RN-04 · revisão ≤ 2.000 km** | `prox_rev_km - hodometro ≤ 2000` → alerta na frota. |
| **RN-09 · faltas recorrentes → regulação** | Relatório de faltas por paciente; a liberação da vaga é ação do gestor junto à regulação (fora do sistema). |

O **relatório mensal de comprovação** (RF-07) é o artefato que fecha o ciclo: viagens
totais e elegíveis, km, ocupação, custo, faltas — o documento que sustenta o repasse e a
fatura. É o deliverable de maior peso do backend.

---

## 10 · Segurança e LGPD (dado sensível de saúde)

- **Residência de dados em região Brasil** (obrigatório) — Supabase `sa-east-1` / Neon BR
  / RDS SP. Mesma exigência do PEP (LGPD art. 33).
- **Criptografia em trânsito e repouso**; CNS e nome ilegíveis em repouso (critério de
  aceite nº 6). Considerar cifra em coluna para PII se o gerenciado não cobrir repouso.
- **RLS como perímetro primário** (§6) — isolamento no banco.
- **`audit_log` encadeado desde o dia 1** (hash com `prev_hash`, conceito herdado do
  PEP/CoPilot) — todo lançamento com autor + timestamp; imutável.
- **Minimização de campos**: só o necessário à operação e à prova. Sem telemetria de campo,
  sem GPS no MVP.
- **Encarregado (DPO) nomeado antes da produção; RIPD na implantação.**
- **Retenção espelha o descarte físico** das pranchetas.

---

## 11 · Integrações (Fase 3, por handoff)

- **CADSUS/CNS**: consulta de paciente por CNS — **sempre pela credencial do ente público**,
  nunca da Samais isolada. Isolar num adaptador; no MVP o cadastro é **manual** a partir da
  lista da regulação (RF-01).
- **PEP OS / sistemas SUS**: exportação da comprovação de deslocamento. Fazer via
  **contrato FHIR** (ADR-006), reusando `@samais/fhir-types`. Um paciente que já existe no
  PEP OS é referenciado por CNS — não se duplica cadastro; **handoff, não banco comum.**
- **Texto integral das Portarias 11.164/11.179**: validar os anexos (valores unitários,
  mecânica exata de registro) **antes** de codar o export ao SUS — hoje é pendência de
  fonte (ver skill `samais-transporte-study`).

---

## 12 · Faseamento de engenharia

Alinhado ao §9 da spec de produto, em linguagem de sprint.

- **Fase 1 — Protótipo (entregue).** `rota-app.html`, estado em memória, todas as telas.
  É a referência visual e o instrumento de venda.
- **Fase 1.5 — Conformidade na demo (sem backend).** CNES+prazo na frota; autorização/
  elegibilidade no paciente; farol de suspensão no painel; relatório mensal; diária/casa
  de apoio por viagem. Ainda no HTML.
- **Fase 2 — Backend mínimo (quando a 1ª licitação estiver próxima):**
  1. Bootstrap: repo já existe; add `api/` (NestJS) + `prisma/`; Postgres BR; CI.
  2. Schema (§5) + RLS (§6) + `audit_log` encadeado.
  3. Auth (ADR-002) + tenant-context middleware. **Teste de isolamento entre bases.**
  4. Migrar telas do protótipo de seed → API (o estado do front já é compatível).
  5. PDF server-side + numeração sequencial (§8).
  6. Farol de repasse e elegibilidade como invariantes (§9).
- **Fase 3 — Integrações (pós-contrato):** CADSUS via ente; export FHIR ao SUS/PEP OS;
  perfil leitura para secretaria; assinatura ICP no relatório mensal.

**Critérios de aceite técnicos** = os 6 do §10 da spec de produto. O nº 1 (isolamento por
RLS) e o nº 5 (tudo no `audit_log`) são **bloqueadores de release**.

---

## 13 · Onboarding do desenvolvedor (primeiros passos)

1. **Ler, nesta ordem:** `CLAUDE.md` (identidade e regras invioláveis) →
   `.claude/skills/samais-html-presentation/SKILL.md` → `docs/ROTA-SPEC.md` (produto) →
   este documento (engenharia). Sem carregar a identidade Samais, não começar (governança).
2. **Rodar o protótipo** `rota-app.html` e percorrer a esteira completa (cadastro →
   programação → impressão → baixa → painel → relatório). É o contrato de comportamento.
3. **Fase 2, passo 1:** subir Postgres BR, aplicar o schema (§5) + RLS (§6), semear uma
   base de teste, e **escrever primeiro o teste de isolamento entre bases** — é o critério
   que não pode falhar.
4. **Nunca** introduzir: campos de contato em qualquer material/tela; case de transporte
   fabricado; scroll horizontal no mobile fora do A4; tokens dark dentro de dobra light.
   São regras do `CLAUDE.md`, auditadas.

---

## 14 · Decisões em aberto (para o Victor)

1. **Deploy do backend:** Vercel (API routes finas, já é o padrão do repo) **ou** container
   NestJS dedicado? Recomendo Vercel no MVP pela continuidade; migrar se a lógica crescer.
2. **Auth gerenciada (Supabase) vs. Keycloak desde já?** Recomendo Supabase no MVP
   (velocidade), com abstração `AuthProvider` para plugar o SSO do ente na Fase 3.
3. **Extrair a fundação Samais (`@samais/*`) agora ou local-first?** Enquanto a casa não
   publica os pacotes, implementar local com a mesma interface e extrair depois. Vale
   alinhar com o time do PEP/CoPilot para convergir os contratos (design system, tenancy,
   fhir-types) e não criar um terceiro dialeto.

---

*Onde gestão se mede em vidas.*
