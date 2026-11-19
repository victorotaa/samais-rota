/* ═══════════════════════════════════════════════════════════════════
   ROTA · integração da Portaria 11.165 na API.

   O núcleo puro mora em regras/integracao-11165.mjs desde a etapa 2: o
   console (rota-app.html) carrega o MESMO código no navegador para a
   demonstração, e api/ não é servido como estático (no Vercel vira
   função). Aqui só se reexporta — mesma função, não cópia; o teste
   testes/integracao-11165.test.mjs cobra a identidade.
   ═══════════════════════════════════════════════════════════════════ */
export * from '../regras/integracao-11165.mjs';
