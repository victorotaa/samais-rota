---
name: handoff-generator
description: Gera um prompt de handoff autocontido e pronto para copiar/colar sempre que Ota pedir para "mandar isso pro Cowork", "mandar pro Code", "abrir em outra sessão", "handoff", ou quando uma tarefa em andamento exigir execução em outro ambiente (Claude Code, Claude Cowork, Claude Desktop, outra conversa, outra ferramenta de IA). Use SEMPRE que a conversa acumular contexto suficiente (decisões, dados, destino de arquivo, IDs, doutrina) que precisaria ser reconstruído manualmente do zero em outro ambiente — não espere o pedido explícito de "handoff" se o padrão da conversa (tarefa grande, multi-step, destino externo) já sinalizar a necessidade. Também dispara quando Ota disser algo como "gosto de velocidade, deixa pronto pra colar".
---

# Handoff Generator

Gera um prompt único, autocontido e executável, para ser colado em outro
ambiente de execução (Claude Cowork, Claude Code, outra conversa do
claude.ai, ou outra plataforma de IA generativa) — sem que o destinatário
precise pedir esclarecimentos antes de agir.

## Por que esta skill existe

Identificado como atrito recorrente na auditoria de fluxo de Ota: o
primeiro prompt de um projeto novo em ambiente separado (ex. Claude Code)
frequentemente falha por falta de contexto, obrigando reconstrução manual
de doutrina, IDs, credenciais de acesso e histórico de decisões. Esta
skill elimina esse atrito, produzindo o pacote de handoff automaticamente
a partir do que já foi decidido na conversa atual.

## Quando usar

- Ota pede explicitamente para mandar algo para Cowork, Code, ou outra
  sessão/plataforma.
- A conversa atual acumulou um volume de contexto (doutrina, decisões,
  IDs de arquivo/pasta, especificações) que seria caro reconstruir de
  memória em outro lugar.
- Uma tarefa é claramente mais adequada para execução autônoma multi-step
  (Cowork) ou para ambiente de código (Claude Code) do que para
  continuar no chat atual.
- Ota sinaliza preferência por velocidade/execução direta ("pronto pra
  colar", "quero que ele já execute").

## Como gerar o handoff

1. **Reunir o contexto real da conversa** — não inventar. Extrair:
   - Quem é o executor-alvo (persona: "Você é Jarvis, conselheiro de
     Victor Ota...") e o projeto/domínio relevante (Samais ou pessoal).
   - A tarefa exata, em termos de ação verificável ("redigir X e
     fazer upload em Y", não "ajudar com X").
   - Todo dado concreto necessário: IDs de pasta/arquivo, URLs, nomes
     exatos, formatos esperados, docs-irmãos já existentes para
     manter padrão de estilo.
   - Doutrina permanente relevante (ver memória / Projeto Samais):
     taxonomia de gestão, padrão FRIO, BDI decomposto, cânone visual,
     cânone de vídeo — incluir apenas o que for pertinente à tarefa,
     não tudo.
   - Se algo necessário não está disponível na conversa, usar
     `conversation_search`/`recent_chats` para recuperar antes de
     escrever o prompt — nunca deixar lacuna para o destinatário
     preencher com suposição.

2. **Estruturar o prompt de handoff** neste formato:
   ```
   [Persona/contexto: quem o executor está ajudando e em que projeto]

   ## Tarefa
   [ação exata, verificável, com critério de "pronto"]

   ## Contexto necessário
   [IDs, URLs, docs-irmãos, formato esperado, doutrina aplicável]

   ## Execução
   [passos numerados, incluindo onde/como entregar o resultado]
   [última linha: autorização explícita para executar sem
   perguntas adicionais, quando o contexto já foi validado por Ota]
   ```

3. **Entregar como arquivo `.md`** via `create_file` +
   `present_files` (nunca só inline no chat) — Ota confirmou preferir
   copiar/colar um bloco pronto a reconstruir manualmente.

4. **Nomear o arquivo de forma específica**: `handoff-<destino>-<tarefa
   curta>.md` (ex. `handoff-cowork-doc-juridico.md`) — nunca genérico
   (`handoff.md`, `prompt.md`), para evitar colisão em
   `/mnt/user-data/outputs` e permitir rastreio posterior.

## Princípios (não negociáveis)

- **Nunca incluir placeholders.** Se um dado necessário (ID de pasta,
  nome de arquivo, credencial de acesso) não está disponível, buscar
  antes de gerar — nunca entregar `<COLOQUE_AQUI>`.
- **Sempre ancorar em fatos reais da conversa/memória**, nunca
  fabricar doutrina ou dados que pareçam plausíveis.
- **Autorização explícita no final do prompt** quando o contexto já
  foi validado por Ota, para que o executor-alvo não pare para
  perguntar e perca a velocidade que Ota busca.
- **Escopo mínimo necessário**: incluir apenas a doutrina/contexto
  relevante à tarefa específica, não despejar todo o conhecimento
  disponível — isso economiza tokens no ambiente de destino.
