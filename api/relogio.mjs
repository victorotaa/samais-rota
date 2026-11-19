/* ═══════════════════════════════════════════════════════════════════
   ROTA · relógio da casa: o de Brasília (America/Sao_Paulo).

   `new Date().toISOString().slice(0, 10)` dá o dia em UTC, e das 21h à
   meia-noite de Brasília o UTC já está no dia seguinte: um prazo de CNES
   ou um farol calculados nesse intervalo sairiam com a data de amanhã.
   Aqui o dia vem do fuso de Brasília, pelo Intl, sem depender do TZ da
   máquina (Vercel e Actions rodam em UTC). Molde: samais-os
   scripts/lib/relogio.mjs.
   ═══════════════════════════════════════════════════════════════════ */
export const FUSO = 'America/Sao_Paulo';

const FMT = new Intl.DateTimeFormat('en-CA', {timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit'});

/** AAAA-MM-DD do dia em Brasília, do instante dado ou de agora. */
export function hojeBrasilia(instante = new Date()){
  const p = {};
  for(const x of FMT.formatToParts(instante)) p[x.type] = x.value;
  return `${p.year}-${p.month}-${p.day}`;
}
