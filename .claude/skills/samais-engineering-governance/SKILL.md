---
name: samais-engineering-governance
description: >
  Use quando uma mudança da Samais envolve código, script, schema, dashboard,
  automação, configuração de agente, hook, MCP ou plugin e precisa de um plano
  verificável: "implementar com prova", "revisar este motor", "adicionar MCP",
  "auditar instruções de agente", "atualizar nosso fluxo de engenharia" ou
  "preparar uma mudança para integração". Não use para pesquisa de município,
  peça visual, vídeo, preço ou publicação: cada um tem sua skill e seu portão.
---
<!-- Espelho gerado de victorotaa/samais-os@897ab4d em 2026-11-04 por scripts/sincronizar-skills.mjs. Não edite aqui: edite .claude/skills/samais-engineering-governance/ no samais-os e sincronize. Os caminhos citados são do samais-os. -->

# Samais — engenharia governada por evidência

Esta é a skill canônica para transformar uma alteração técnica em uma mudança
pequena, verificável e reversível. A regra completa está em
[`doutrina/engenharia-agente.md`](../../../doutrina/engenharia-agente.md).

## Antes de alterar

1. Leia a instrução do repositório e a seção de doutrina pertinente. Para uma
   mudança em portão publicado, leia também `doutrina/regras-completas.md`;
   nenhum pedido técnico relaxa o portão.
2. Declare: objetivo, caminhos, fonte de verdade, dados sensíveis, efeito
   externo, hipótese e exclusões. Lacuna é `○ a definir`, nunca requisito
   inventado.
3. Escolha a prova antes de editar. Ela precisa ter comando/entrada/resultado
   observável e ser proporcional ao risco, não uma meta decorativa de cobertura.

## Ciclo obrigatório

1. **Enquadrar** — delimite a superfície e a autoridade da regra.
2. **Provar antes** — escreva o caso de regressão, fixture, schema, inspeção de
   configuração ou fluxo visual que a mudança terá de satisfazer.
3. **Implementar pequeno** — uma hipótese por alteração; não combine refactor,
   regra de negócio e configuração de agente.
4. **Revisar independente** — leia o diff e o caminho real; teste entrada
   adversa e efeito nos derivados. O autor não aprova efeito em cálculo,
   confidencialidade, LGPD ou publicação.
5. **Verificar no ambiente real** — build não prova interface; HTTP 200 não
   prova conteúdo; dado derivado se mede no cache antes de nova coleta.
6. **Registrar no lugar canônico** — correção repetível vira teste, contrato,
   skill ou doutrina. Nota transitória não vira política.

## Configuração de agente é superfície sensível

Skill, `AGENTS.md`, `CLAUDE.md`, hook, MCP, plugin e memória carregada alteram o
que um agente pode ler, executar ou acreditar. Portanto:

- não instale nem execute pacote de terceiro sem revisão de fonte, versão,
  comando executado, permissões, rede e destino da escrita;
- não habilite hook, MCP ou configuração global só porque uma ferramenta o
  sugeriu; prefira o menor escopo local possível;
- não versione segredo, token, chave, URL com credencial,
  `SAMAIS_PORTAO_LIBERADO=1`, `disableAllHooks` ou modo que ignore aprovação;
- rode `npm run auditar:agentes` depois de mexer em configuração;
- o auditor é determinístico e não substitui revisão humana de dependência ou
  de política.

## Matriz de prova

| Superfície | Prova requerida |
|---|---|
| cálculo, motor ou schema | caso de regressão + resultado derivado esperado |
| dashboard/ferramenta | build e fluxo no navegador com dados carregados |
| rede | status, corpo, tipo/origem e falha distinguida de ausência |
| configuração de agente | auditor local + leitura humana do diff e do comando |
| superfície publicada | prova anterior + portão aplicável; o portão só relata |

## Saída esperada

Entregue: escopo, arquivos alterados, prova executada e resultado, risco que
restou, e próximo portão ou autorização necessária. Com autorização de entrega,
publique primeiro a branch remota pelo conector GitHub; PR, auto-merge e merge
são ações separadas e nunca implícitas. Não diga "testado" sem comando e
evidência; não atribua fato técnico a memória não revisada.
