---
name: samais-safe-deploy
description: Use para publicar com segurança uma mudança da Samais (PR de código, doutrina, painel, estudo ou espelho de skill) - guarda, build à mão, confidencialidade, merge e conferência do conteúdo no ar. Não use para a captação agendada (radar e notícias), que tem rotina própria e já merge pela guarda.
---
<!-- Espelho gerado de victorotaa/samais-os@897ab4d em 2026-11-04 por scripts/sincronizar-skills.mjs. Não edite aqui: edite .claude/skills/samais-safe-deploy/ no samais-os e sincronize. Os caminhos citados são do samais-os. -->
# Publicação segura Samais

Reescrita em 04/11/2026 (Ota liberou). Substitui a versão de 26/10, que dizia "não faça merge por padrão" e contradizia as
rotinas e "publicar é mergear". **Publicar é mergear na `main`**; esta skill diz quando se mergeia sozinho, quando se espera o
Ota e o que se confere antes e depois. Base: `CLAUDE.md` (Git e build), `doutrina/regras/git-regra-protege-cerebro.md`,
`doutrina/sessoes-paralelas.md` §11 e `doutrina/regras/build-pacote-publicavel.md`.

## Escopo: três casos, três regras de merge

| Caso | Merge |
|---|---|
| **Captação agendada** (`captacao.mjs radar` e `noticias`) | Fora desta skill. A rotina abre o PR, roda a guarda e mergeia no mesmo disparo. |
| **Mudança de rotina** (dado regerado, texto, espelho de skill sem mudança de comportamento, o que a tarefa já mandou mergear) | Guarda saiu 0 e o build à mão passou: **mergeia sem perguntar**, squash. |
| **Mudança que altera regra** (portão, hook, `guarda-*`/`conferir-*`, doutrina, parâmetro de custo, peça que vai a terceiro, domínio, segredo, permissão) | **Prepara o PR e espera o Ota.** Peça a terceiro ainda passa pelo portão (opus, esforço máximo) por lote. Sem frase de liberação, não se mexe em portão publicado. |

Na dúvida sobre o caso, é o terceiro.

## Antes do merge

1. **Contexto:** repositório, branch, base `main` (PR aberto antes da troca de padrão não foi redirecionado), arquivos
   autorizados e, se houver, o projeto Vercel. Fetch antes de tocar.
2. **Diff e confidencialidade:** nenhum segredo, binário de vídeo, derivado (`dashboard/`, `data.json`, `.cache/`), `bastidor.md`,
   `interpretacao.md`, composição de preço nem dado pessoal. Peça externa em padrão frio.
3. **Guarda:** `git fetch origin && node scripts/guarda-merge.mjs`. Saiu 0 → segue. Saiu 1 → `git rebase origin/main`, push,
   guarda de novo; se continuar 1, não mergeia e relata o que ela acusou.
4. **Build à mão** (Actions sem crédito): `SAMAIS_SEM_MIDIA=1 VERCEL_ENV=preview node scripts/build-dashboard.mjs`, mais os
   conferidores da área (`conferir-*`). Registre falha e aviso; o build reescreve cópias versionadas, restaure com
   `git checkout --`.
5. **Checks do GitHub Actions vermelhos em ~3 s, sem log, são falta de crédito da conta:** não investigue, não re-rode, não espere.
   Vale o que você rodou à mão. Check da Vercel é outra coisa: deploy de preview com erro é falha de verdade.

## Merge

- Squash, com `expectedHeadSha` de 40 caracteres (`git rev-parse HEAD`). Branch de rotina volta a partir da `main` depois.
- Nunca altere domínio, permissão, segredo, workflow ou estudo já publicado sem escopo aprovado pelo Ota.

## Depois do merge

1. Ache o deploy do commit: `READY` e alias de produção. `BUILDING` ou `QUEUED` não é publicado.
2. **Confira o conteúdo no ar**, não só o status: busque a página com `?v=N`, ache um trecho da mudança e, em estudo, confirme que
   `/anexos/<estudo>-memoria-financeira` dá 404 e que a página abre sem `.html`.
3. Relatório curto: commit, PR, o que rodou e o resultado, horário de Brasília da conferência, URL canônica, ressalvas.
   O que não se conseguiu conferir (rede, deploy sem acesso) sai como **○ a levantar**, nunca como "ok".

## Espelhos
Mudança de skill ou hook que desce para os repositórios irmãos segue `scripts/sincronizar-skills.mjs --todos` (e `--conferir`
para medir a deriva) e a mesma regra de merge acima, um PR por repositório. Esta skill é canônica no `samais-os` e não está
na lista de destinos até o Ota decidir quais repositórios a recebem.
