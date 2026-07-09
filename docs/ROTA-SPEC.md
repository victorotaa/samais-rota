# ROTA — Especificação do Sistema
### Gestão de Transporte Sanitário · Samais Gestão em Saúde

| | |
|---|---|
| **Versão** | 1.0 · jul/2026 |
| **Status** | Especificação aprovada para protótipo; base para a fase 2 (backend) |
| **Protótipo** | `rota-app.html` · https://samais-rota.vercel.app/rota-app.html |
| **Dono do produto** | Victor (Samais) |
| **Confidencial** | Uso interno Samais |

---

## 1 · Visão

Sistema de gestão fina da operação de transporte sanitário eletivo (transporte de
pacientes) operada pela Samais como **empresa privada contratada pelo ente público**
(prefeitura, consórcio ou secretaria estadual). O ente é o dono do serviço; a Samais
operacionaliza com gestão — mesma lógica do SAMU, porém mais simples.

O sistema existe para três finalidades, nesta ordem:

1. **Controle operacional** — quem viaja, em qual veículo, quem embarcou e quem
   voltou; km, combustível, revisões, faltas e presenças.
2. **Prova e prestação de contas** — o registro conferido é o documento que sustenta
   o repasse federal (Portarias GM/MS 11.164/2026 e 11.179/2026) e a fatura ao
   contratante. Elimina a "vaga fantasma".
3. **Argumento comercial** — chegar à licitação com o mecanismo de gestão de frota
   que a portaria **exige** já pronto e demonstrável.

**Tese central:** o papel é cidadão de primeira classe. A ponta (motorista/assistente)
trabalha com prancheta impressa; o sistema recebe a baixa depois, pelo gestor.
A operação nunca depende de conexão no campo.

---

## 2 · Âncoras regulatórias

| Norma | O que define | Impacto no sistema |
|---|---|---|
| Portaria SAS/MS **55/1999** (TFD) | Transporte + diárias p/ paciente e acompanhante; médico solicita, comissão do gestor autoriza | A lista de pacientes **nasce na regulação**, nunca na Samais; campos de nº de processo/autorização |
| Portaria GM/MS **4.279/2010** | Transporte sanitário eletivo = sistema logístico das Redes de Atenção | Enquadramento institucional do serviço |
| Portaria GM/MS **8.516/2025** | Financiamento de radioterapia (Agora Tem Especialistas) | Base do componente de transporte |
| Portaria GM/MS **11.164/2026** e **11.179/2026** | Transporte p/ radioterapia e hemodiálise **>50 km** (teto 500 km), paciente + acompanhante; custeio federal fixo e variável (combustível, manutenção, seguro, RH) | Ver regras RN-05 a RN-08 abaixo — são requisitos de conformidade |

**Exigências das portarias de 2026 que o sistema materializa:**
- Veículo inscrito no **CNES** em até **60 dias** do recebimento.
- **Mecanismo de gestão de frota obrigatório**: quilometragem, custo operacional e
  taxa de ocupação.
- **Comprovação de uso** nos sistemas do SUS; **3 meses sem registro → repasse suspenso**.

---

## 3 · Perfis e acesso

**Um único perfil operador: o Gestor Local.** Cada cidade/região é um contrato (uma
**base**); cada gestor enxerga somente a sua base. Não existe coordenador central no
sistema — o report consolidado fica com o contratante e com a Samais por fora.

| Papel | Acesso ao sistema | Função |
|---|---|---|
| **Gestor local Samais** | Total (na sua base) | Cadastra, programa, imprime, dá baixa, gera relatórios |
| Motorista | **Nenhum** — prancheta | Conduz; em unidade simples faz o tique de embarque/reembarque; reporta km e abastecimento no papel |
| Assistente local | **Nenhum** — prancheta | Em ônibus/micro-ônibus: chamada de embarque/reembarque |
| Secretaria / auditoria | Futuro: leitura | Recebe o relatório mensal (PDF) |

Autenticação (fase 2): e-mail + senha forte, 2FA; sessão por base; log de acesso.

---

## 4 · Fluxo operacional (esteira)

```
Regulação/Secretaria           Gestor local (sistema)           Ponta (papel)
────────────────────           ──────────────────────           ─────────────
autoriza paciente  ──────────▶ 1. cadastro (manual, por CNS)
                               2. programação da semana
                               3. imprime manifesto + folhas ──▶ 4. embarque: tique ida
                                                                 5. reembarque: tique volta
                                                                 6. km + abastecimento anotados
                               7. baixa no sistema ◀──────────── prancheta devolvida
                               8. dashboard e relatório mensal
secretaria recebe ◀─────────── 9. PDF de prestação de contas
```

---

## 5 · Requisitos funcionais

### RF-01 · Pacientes
- Cadastro **manual** pelo gestor a partir da lista autorizada pela regulação
  (integração CADSUS: fora de escopo — fase futura, via credencial do ente).
- Campos: nome, CNS, nascimento, município, ponto de embarque, tratamento, destino,
  **recorrência semanal** (dias), acompanhante (S/N — ocupa assento), necessidade
  especial (cadeirante, maca/ambulância, menor c/ responsável).
- **Autorização vinculada** (regulatório): nº do processo TFD/regulação, validade,
  distância ao destino → elegibilidade >50 km calculada automaticamente (RN-05).
- Ficha do paciente: dados + viagens da semana.

### RF-02 · Programação
- Geração automática das viagens da semana a partir das recorrências.
- Alocação: veículo + motorista (+ assistente quando ônibus/micro-ônibus) + assentos
  (paciente + acompanhante contam lotação).
- Separação automática de casos de maca → ambulância (RN-03).
- Filtro por dia; regeneração; status por viagem (programada / hoje / concluída).

### RF-03 · Frota
- Veículos: identificação, placa, tipo, lotação, condutor fixo, hodômetro,
  **nº CNES + data-limite de inscrição (60 dias)** com alerta (RN-07).
- Revisões: intervalo por km; alerta ao gestor quando faltarem ≤ 2.000 km (RN-04).
- Abastecimentos: data, litros, km desde o último, valor → consumo km/l calculado;
  sinalização de anomalia de consumo.
- Detalhe do veículo: consumo médio, barra até a revisão, histórico.

### RF-04 · Impressos (A4)
- **Manifesto geral semanal por veículo**: placa · rota · destino · horários; afixado
  no ponto de guarda dos veículos; emitido pelo gestor.
- **Folha de embarque/reembarque por viagem**: lista numerada com CNS, acompanhante,
  ☐ embarque, ☐ reembarque, assinatura por linha; rodapé com totais, km previsto e
  linha do conferente.
- Formato: **A4 absoluto (210×297 mm), margens de impressão 14 mm**, sem
  responsividade aplicada à folha (no mobile, rolagem horizontal do papel).
  Numeração sequencial de documento (fase 2). Nota LGPD de descarte impressa.

### RF-05 · Lançamentos (baixa)
- Fila de viagens pendentes de baixa (dia corrente e anteriores).
- Baixa por viagem: presenças/faltas por paciente, km rodado, combustível.
- Regra "papel primeiro": a baixa é sempre posterior e assíncrona ao campo.

### RF-06 · Painel (dashboard do gestor)
- KPIs da semana: viagens (concluídas/programadas), **taxa de ocupação**, presenças/
  faltas, **km rodado**, consumo km/l, **custo estimado** — os três em negrito são a
  tríade exigida pela portaria (RN-06).
- Infográficos (SVG/CSS puro, padrão Samais): donut de ocupação, curva acumulada de
  km, medidor de consumo, barras por dia, composição por destino, split
  presenças×faltas.
- Alertas: revisão próxima, faltas na semana, **risco de suspensão de repasse**
  (dias sem registro — RN-08), prazo CNES.

### RF-07 · Relatórios
- **Relatório mensal de comprovação** (PDF/A4): viagens totais e **elegíveis
  (>50 km)**, km, ocupação, custo, faltas — o documento que a secretaria usa para
  manter o repasse e que a Samais usa para faturar.
- Entregue ao contratante pelo gestor; sem acesso direto do contratante na fase 2.

### RF-08 · Tema e identidade
- Dark (padrão) e **light mode** (dobra ledger Samais), com persistência.
- Identidade Samais integral: tokens, Syne/Inter/JetBrains Mono, liquid glass
  (refração `feDisplacementMap` no desktop, fallback blur, off no mobile),
  animações de entrada com `prefers-reduced-motion` respeitado.

---

## 6 · Regras de negócio

| # | Regra |
|---|---|
| **RN-01** | Acompanhante autorizado ocupa assento e conta na lotação. |
| **RN-02** | Nenhum paciente permanece no destino sem registro: reembarque é conferido no papel e lançado na baixa. (Sem rastreio em tempo real — decisão de produto.) |
| **RN-03** | Necessidade "maca" → viagem separada em ambulância; nunca em veículo comum. |
| **RN-04** | Alerta de revisão quando faltarem ≤ 2.000 km para o intervalo do veículo. |
| **RN-05** | Elegibilidade a cofinanciamento federal: destino a **>50 km e ≤500 km** do município de residência, tratamento radioterapia/hemodiálise (Port. 11.164/11.179). Flag automática por viagem. |
| **RN-06** | Km, custo operacional e taxa de ocupação são registros obrigatórios (mecanismo de gestão de frota exigido pela portaria). |
| **RN-07** | Veículo federal recebido deve ter CNES registrado em até 60 dias; o sistema acompanha o prazo. |
| **RN-08** | 3 meses sem registro de uso → repasse suspenso. Farol: verde <30 dias, âmbar 30–60, vermelho >60 sem registro comprovado. |
| **RN-09** | Faltas recorrentes são reportadas à regulação para liberar a vaga. |
| **RN-10** | Impressos com dado de saúde: uso restrito, descarte seguro após a baixa (LGPD). |

---

## 7 · Modelo de dados (fase 2)

Multi-tenant por `base_id` com **row-level security** — isolamento por contrato no
banco, não na aplicação.

```
bases          (id, municipio, uf, contratante, contrato_ref)
gestores       (id, base_id, nome, email, hash, 2fa)
pacientes      (id, base_id, nome, cns, nascimento, municipio, ponto_embarque,
                tratamento, destino_id, recorrencia[], acompanhante, necessidade)
autorizacoes   (id, paciente_id, processo_ref, origem[TFD|regulacao], validade,
                distancia_km, elegivel_federal)
destinos       (id, base_id, nome, municipio, km, tipo)
veiculos       (id, base_id, ident, placa, tipo, lotacao, condutor, assistente,
                hodometro, rev_intervalo_km, prox_rev_km, cnes_num, cnes_prazo)
viagens        (id, base_id, data, hora, destino_id, veiculo_id, km_previsto,
                status[programada|concluida|cancelada])
viagem_pax     (viagem_id, paciente_id, acompanhante)
embarques      (viagem_id, paciente_id, presente_ida, presente_volta, falta_motivo)
abastecimentos (id, veiculo_id, data, litros, km_desde_ultimo, valor)
manutencoes    (id, veiculo_id, data, km, tipo, valor, descricao)
documentos     (id, base_id, tipo[manifesto|folha|relatorio], num_sequencial,
                viagem_id?, emitido_em, emitido_por)
audit_log      (id, base_id, gestor_id, acao, entidade, entidade_id, ts, payload)
```

---

## 8 · Requisitos não-funcionais

- **LGPD** (dado sensível de saúde): minimização de campos; criptografia em trânsito
  e repouso; hospedagem **em região Brasil**; log de acesso; política de retenção e
  descarte espelhando o descarte físico das pranchetas; encarregado nomeado antes da
  produção; RIPD na implantação.
- **Resiliência de campo**: nenhuma função operacional de ponta depende de conexão
  (papel primário). Starlink entra no escopo de operação, não do software.
- **Auditabilidade**: todo lançamento com autor, timestamp e trilha imutável
  (`audit_log`) — dinheiro público exige.
- **Simplicidade**: um perfil, uma base por sessão, telas diretas. O gestor local não
  é usuário técnico.
- **Idioma**: 100% português; sem jargão nas telas.
- **Verificação visual**: Playwright 1440/768/390 antes de cada publicação (doutrina
  do repo).

---

## 9 · Arquitetura e fases

**Fase 1 — Protótipo (entregue).** `rota-app.html` single-file, dados fictícios,
estado em memória, front completo dos módulos RF-01…RF-08 (exceto itens regulatórios
de RF-01/RF-03/RF-06 marcados abaixo). Peça de demonstração e alinhamento.

**Fase 1.5 — Conformidade na demo (próximo passo, sem backend).**
CNES + prazo 60 dias na frota · autorização/elegibilidade no paciente · farol de
risco de suspensão no painel · relatório mensal consolidado · registro de
diária/casa de apoio vinculado à viagem.

**Fase 2 — Backend mínimo (quando a 1ª licitação estiver próxima).**
- PostgreSQL gerenciado em região BR (Supabase/Neon/RDS-SP) com RLS por base.
- API fina (Next API routes no Vercel ou Supabase) + Auth (e-mail/senha + 2FA).
- Front atual convertido de seed → API (estrutura de estado já compatível).
- Geração de PDF server-side (manifesto, folha, relatório mensal) com numeração
  sequencial em `documentos`.
- `audit_log` desde o primeiro dia.

**Fase 3 — Integrações (pós-contrato).**
- Export/registro nos sistemas do SUS conforme mecanismo detalhado nas Portarias
  11.164/11.179 (validar texto integral antes de codar).
- Consulta CADSUS via credencial do ente público (nunca da Samais isolada).
- Perfil leitura para secretaria; telemetria/GPS de frota (opcional).

**Fora de escopo (decisões de produto):** rastreio "ninguém fica pra trás" em tempo
real; perfil coordenador central; acesso de motorista/assistente ao sistema;
integração CADSUS direta na fase atual.

---

## 10 · Critérios de aceite (fase 2)

1. Gestor autentica e enxerga somente a sua base (verificado por RLS, não por filtro).
2. Fluxo completo esteira: cadastro → programação → impressão → baixa → dashboard →
   relatório mensal, sem tocar em outra base.
3. Impressos idênticos ao protótipo (A4 absoluto, margens 14 mm).
4. Farol de suspensão muda de estado conforme dias sem registro (teste com datas
   simuladas).
5. Todo lançamento aparece no `audit_log` com autor e timestamp.
6. Dados sensíveis ilegíveis em repouso (criptografia verificada).

---

## 11 · Glossário

- **Base**: unidade de contrato (município/região) operada por um gestor local.
- **Baixa**: lançamento no sistema, pelo gestor, do que foi conferido no papel.
- **Manifesto**: escala impressa semanal por veículo, afixada no ponto de guarda.
- **Folha de embarque**: lista por viagem com tique ida/volta e assinatura.
- **TFD**: Tratamento Fora do Domicílio (Portaria SAS/MS 55/1999).
- **Elegível federal**: viagem >50 km e ≤500 km p/ radioterapia/hemodiálise
  (Portarias 11.164/11.179/2026).

---

*Onde gestão se mede em vidas.*
