# Portão, publicação e entrega (FASES 5 e 6)

---

## 1. Antes do portão (o autor confere)

- [ ] Todo número com procedência (✓ · ≈ · ○); nenhuma lacuna virou zero; nenhuma premissa como fato; ✓ só com fontes
      que convergem.
- [ ] O valor final rotulado **Custo Operacional**, construído (não régua); acima de ~1,5 mi hab., pela norma.
- [ ] Nada da composição na página (BDI, CDO, margem, remuneração, FC, preço por viatura, score, "lucro").
- [ ] Contratado nunca como pago; contrato citado só se vigente (pagamento recente); "sem contrato publicado no PNCP"
      confirmado no portal do ente.
- [ ] Comparativo de gasto (nunca de equipe), com a ressalva de escopo, ou fora da página.
- [ ] Decisores com fonte, data e partido; nenhum CPF, dado sensível ou contato pessoal.
- [ ] Consórcio, região, área da central, quem paga e mantenedora conferidos no instrumento, com link.
- [ ] Oportunidade só do território; Ourinhos só em contexto paulista; atestado só no que o documento sustenta.
- [ ] Transporte: 11.164 + 11.165 (nunca 11.179); sem R$ por veículo; distância medida antes de citar repasse.
- [ ] Teto de ~1.200 palavras (limite 1.875); `conferir-orfas.mjs`, `conferir-imagens.mjs` e
      `conferir-scroll-horizontal.mjs` verdes (samais-estudos).
- [ ] Mudou o preço: o valor antigo não sobrou em nenhum dos cinco lugares (página, cartão da home, markdown interno,
      anexo, `status.json`).

## 2. O portão (Ota, 08/10/2026)

- Nada vai a terceiro sem o portão: **opus em esforço `max`, por lote** (`samais-os/doutrina/orquestracao-multiagente.md`).
- Correção que o portão pediu **volta ao portão** num reenvio estreito: só o diff e o que conferir. Reaproveitar o mesmo
  agente (`SendMessage`) custa uma fração de um portão novo.
- Estudo municipal já publicado **fica como está**; regra nova vale para os estudos novos.
- **Portão publicado não se afrouxa** (20/10/2026): `scripts/guarda-*` e `conferir-*` já na `main` e a guarda de
  confidencialidade do build não se editam para passar uma peça (o hook `.claude/hooks/portao.mjs` barra; só o Ota
  libera). **Portão vermelho: quem se corrige é a peça.**

## 3. Publicação: publicar é mergear na `main` do samais-estudos

- O site é a raiz do repositório `samais-estudos`, na Vercel. **Commit e PR não publicam nada** (Osasco ficou fora do ar
  por parar no push).
- Antes: `git fetch origin && node scripts/guarda-merge.mjs`; a base do PR é a `main`.
- Actions sem crédito: workflows de CI desligados até 01/11/2026. Não investigar nem comentar check de Actions; rodar a
  guarda à mão (`samais-os/doutrina/sessoes-paralelas.md` §11).
- Markdown dentro de `estudos/` nunca é peça cliente (`.vercelignore` bloqueia `/estudos/*.md`).

**Depois do deploy, conferir por CONTEÚDO, nunca por HTTP 200:**
- [ ] a home lista o estudo novo, com o valor correto;
- [ ] a página abre **sem** `.html` (o `cleanUrls` foi lido);
- [ ] `/anexos/<slug>-memoria-financeira` dá **404** (se abrir, vazou, e é urgente);
- [ ] testar com `?v=N` no fim da URL (o cache mascara sucesso).

Se o domínio estiver fora da allowlist da sessão, dizer isso e passar o link mesmo assim, pedindo a conferência dos itens
acima; nunca afirmar que está no ar tendo visto só o status do deploy.

## 4. Entrega

1. **Passar a URL na conversa, sempre:** `https://samais-estudos.vercel.app/estudos/<slug>` e a home. "Mergeado, deploy
   verde" não é entregar.
2. Resumo em chat, até 6 linhas: Custo Operacional mensal · per capita · escopo · o achado que decide · a maior pendência
   · o próximo passo.
3. **Registrar a frente no samais-os** (`frentes/<slug>/status.json`, válido contra `frentes/_schema/status.schema.json`):
   `valor_contratual_mensal` **saído do estudo** (o cenário em negociação; o outro em `proximo_passo`), o arquivo citado
   em `gatilho`, `estudo_url` (sem `.html`) e `estudo_titulo_conferido` (o `<title>` como o servidor devolveu; conferir com
   `node scripts/conferir-estudos-frentes.mjs`). O `status.json` é camada citável: bastidor político e nomes de contato
   vivem em `frentes/<slug>/bastidor.md`; o factual em `fatos.md`; a leitura estratégica em `interpretacao.md`. Modelo:
   `frentes/_schema/_template-frente/`. Antes de mergear no samais-os: `git fetch origin && node scripts/guarda-merge.mjs`
   e `SAMAIS_SEM_MIDIA=1 VERCEL_ENV=preview node scripts/build-dashboard.mjs`.
4. **PR mergeado:** reiniciar o branch de trabalho a partir da `main` e empurrar com `--force-with-lease`; trabalho novo
   vai em PR novo, nunca no PR já mergeado.
5. Salvar o andamento em disco, commitar pequeno e entregar relatório curto (doutrina de orquestração).
