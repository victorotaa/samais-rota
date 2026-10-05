// Trilha do FILME DE INVESTIDORES do ROTA (Samais Gestão em Saúde) — composta em
// código, determinística, na grade de 120 BPM (batida = 0,5 s).
//
// O motor é o do comercial ROTA v4 (filme/v4, aprovado), que veio do filme do SAMU
// CoPilot OS: a mesma síntese, o mesmo sidechain, a mesma reverberação (Freeverb), o
// eco pingue-pongue, a "cola" no barramento, o limitador com antecipação, a loudness
// em duas passadas e o abaixamento sob cada fala. O ARRANJO é novo, escrito para este
// filme. Fonte de verdade: roteiro.json — cenas, falas e marcos. Nenhum tempo absoluto
// é digitado aqui: tudo é "cena + batidas" ou "marco". Os acentos MUSICAIS caem na
// semicolcheia mais próxima do marco (≤ 62 ms, para não sair do groove); os EFEITOS
// caem no marco exato.
//
// É NOSSA: nenhum sample de terceiro na música. Os únicos arquivos externos são os
// efeitos de corte (whoosh, impacto, clique, pop, brilho, ping, sino), da biblioteca
// que acompanha a HyperFrames, sob a Pixabay Content License (uso comercial, sem
// atribuição) — ver assets/sfx/CREDITS.md. Eles saem numa PISTA SEPARADA
// (assets/audio/sfx.wav), para a composição equilibrar efeito e música à parte.
//
// Tom: ré maior (si menor no gargalo). Pitch de investimento: confiança, calor,
// acabamento premium — nunca emergência médica: sem sirene, sem monitor, sem coração.
//   s1  noite sobre a cidade: pad, o motivo ao piano (lá–ré–mi–fá♯, "5-1-2-3"),
//       o pulso grave crescendo; a subida discreta até o corte.
//   s2  o logo: ré maior aberto, e na varredura de luz o brilho e os sinos; o groove
//       suave começa no compasso seguinte.
//   s3  o groove confiante (bumbo, baixo no contratempo, arpejo em semicolcheias,
//       sidechain); toques no gov e no mapa, sinos nos 3.300; na perspectiva, o
//       acento claro; no "bi", o contador (um tique por décimo que vira no número);
//       a dominante e a virada de tons atravessam o corte de s4 e...
//   s4  ...no GARGALO a dominante cai em si menor (cadência de engano) e o groove
//       para seco: impacto, pedal de si, o relógio; a pancada escura no "seis";
//       no regulador a virada: a reconstrução até o corte.
//   s5  propósito: ré · lá/dó♯ · si m · sol · mi m7 · lá; tom em cada marco.
//   s6  o pulso tecnológico: arpejo em colcheias com eco pontuado, blips de sino;
//       o console entra (plataforma), o clique (painel), os sinos sobem no mergulho
//       (farol) e a dominante resolve no "mercado local"; a virada para no corte.
//   s7  o negócio: um tempo de ar e o impacto fundo sob "o custo"; piano em 3-3-2,
//       pad, bateria contida que cresce; um golpe limpo por número; três sinos nas
//       três cotas, dois nas duas.
//   s8  o retorno: groove que clareia, um tique por batida (os meses) até o payback,
//       que é a chegada harmônica (lá → ré) com prato, sinos e brilho.
//   s9  a garantia: sol(add9) sustentado, quase sem percussão.
//   s10 o convite: o hino em ré com o motivo do s1 harmonizado; o acorde final na
//       assinatura; depois só o pad, apagando até o silêncio digital em duracao − 0,1 s.
//
// Sob a voz: 9–12 dB conforme a densidade do trecho (12 no groove), ataque 0,15 s,
// soltura 0,35 s; entre falas a menos de 0,7 s a música sobe só até a metade; e a
// presença (≈ 2,2 kHz) desce mais 3 dB enquanto a voz fala.
//
//   node trilha/compor.mjs → assets/audio/trilha.wav (48 kHz, estéreo, 24 bits,
//                            já abaixada sob cada fala, −20 LUFS, ≤ −1 dBTP)
//                            assets/audio/sfx.wav   (só os efeitos, −23 LUFS, ≤ −3 dBTP)
//                            assets/sfx/*.mp3 + CREDITS.md (os efeitos usados)
//
// Determinismo: ruído por xorshift com semente fixa; nada de Math.random nem Date.
import { writeFileSync, readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(resolve(RAIZ, 'package.json'));
const FFMPEG = process.env.FFMPEG || require('@ffmpeg-installer/ffmpeg').path;
const FFPROBE = process.env.FFPROBE || require('@ffprobe-installer/ffprobe').path;
const ROT = JSON.parse(readFileSync(resolve(RAIZ, 'roteiro.json'), 'utf8'));
const SR = 48000;
const DUR = ROT.duracao;
const N = Math.round(SR * DUR);
const BATIDA = 60 / ROT.bpm;               // 0,5 s a 120 BPM
const B = BATIDA, C = 4 * BATIDA;          // batida e compasso
const TAU = 2 * Math.PI;
const ALVO_LUFS = -20, TETO_TP = -1;       // a música
const ALVO_SFX = -23, TETO_SFX = -3;       // o stem de efeitos (o da v4 saiu a −26 e ficou fraco)
const SILENCIO_FINAL = 0.1;                // os últimos 0,1 s: zero digital

// ── Tempos: a mesma fonte de verdade do vídeo ──────────────────────────────
const CENA = Object.fromEntries(ROT.cenas.map((c) => [c.id, c]));
const T = (id, dt = 0) => CENA[id].t0 + dt;
const FIM = (id, dt = 0) => CENA[id].t1 + dt;
const MARCO = ROT.marcos;
const Q = (t) => Math.round(t / (B / 4)) * (B / 4);            // a semicolcheia mais próxima
const M = (nome) => { const t = MARCO[nome]; if (typeof t !== 'number') throw new Error(`marco ausente no roteiro: ${nome}`); return Q(t); };
// marcos de ornamento: se sumirem do roteiro, o acento some junto (com aviso), sem quebrar
const AUSENTES = new Set();
const MO = (nome) => { const t = MARCO[nome]; if (typeof t === 'number') return Q(t); AUSENTES.add(nome); return null; };
const marco = (nome, fn) => { const t = MARCO[nome]; if (typeof t === 'number') fn(Q(t), t); else AUSENTES.add(nome); };
for (const c of ROT.cenas) for (const t of [c.t0, c.t1])
  if (Math.abs(t / BATIDA - Math.round(t / BATIDA)) > 1e-6) console.warn(`⚠ ${c.id} tem corte fora da grade: ${t}s`);
if (Math.abs(FIM(ROT.cenas.at(-1).id) - DUR) > 1e-6) throw new Error('a última cena não termina em roteiro.duracao');
// as falas: t e a duração da voz no andamento em que ela vai tocar
const FALAS = ROT.locucao.map((l) => {
  const d = ROT.duracao_voz_1x[l.id]; if (!(d > 0)) throw new Error(`sem duração para a fala ${l.id}`);
  return { id: l.id, t0: l.t, t1: l.t + d / ROT.andamento_voz };
}).sort((a, b) => a.t0 - b.t0);
const cenaDe = (t) => ROT.cenas.find((c) => t >= c.t0 && t < c.t1)?.id ?? ROT.cenas.at(-1).id;

// ── Utilitários ─────────────────────────────────────────────────────────────
let sem = 2463534242 >>> 0;
const ruido = () => { sem ^= sem << 13; sem >>>= 0; sem ^= sem >>> 17; sem ^= sem << 5; sem >>>= 0; return (sem / 4294967296) * 2 - 1; };
const pista = () => [new Float32Array(N), new Float32Array(N)];
// Janela de escrita: o que nasce num bloco só escreve até o fim dele, com uma rampa
// curta (sem estalo) — a cauda de nenhuma nota atravessa o GARGALO nem a PARADA.
let J0 = 0, J1 = N, JF = 0;
const faixa = (t0, t1, fn, rampa = 0.006) => {
  const a = [J0, J1, JF]; J0 = Math.round(t0 * SR); J1 = Math.min(N, Math.round(t1 * SR)); JF = Math.round(rampa * SR); fn(); [J0, J1, JF] = a;
};
const soma = (p, i, l, r) => {
  if (i < J0 || i >= J1) return;
  if (i >= J1 - JF) { const g = 0.5 - 0.5 * Math.cos(Math.PI * (J1 - i) / JF); l *= g; r *= g; }
  p[0][i] += l; p[1][i] += r;
};
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const polyblep = (t, dt) => { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; };
const serra = (fase, dt) => 2 * fase - 1 - polyblep(fase, dt);
const db = (x) => Math.pow(10, x / 20);
const suave = (p) => { p = Math.max(0, Math.min(1, p)); return p * p * (3 - 2 * p); };

// filtro de estado variável (topologia TPT): lp / bp / hp
class SVF {
  constructor() { this.ic1 = 0; this.ic2 = 0; this.lp = 0; this.bp = 0; this.hp = 0; this.set(1000, 0.707); }
  set(fc, q) { const g = Math.tan(Math.PI * Math.min(fc, SR * 0.45) / SR); this.k = 1 / q; this.a1 = 1 / (1 + g * (g + this.k)); this.a2 = g * this.a1; this.a3 = g * this.a2; }
  proc(x) { const v3 = x - this.ic2, v1 = this.a1 * this.ic1 + this.a2 * v3, v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1; this.ic2 = 2 * v2 - this.ic2; this.lp = v2; this.bp = v1; this.hp = x - this.k * v1 - v2; return v2; }
}

// ── Pistas ──────────────────────────────────────────────────────────────────
const P = { bateria: pista(), baixo: pista(), pad: pista(), arpejo: pista(), piano: pista(), fx: pista(), rev: pista(), eco: pista() };
const S = pista();                           // o stem de efeitos (sfx.wav)
const bombas = [];                           // tempos de bumbo (para o sidechain)
const CORTES = [];                           // onde a cauda da reverberação / do eco é cortada

// ── Instrumentos (os do motor da v4) ────────────────────────────────────────
function bumbo(t, amp = 1, bomba = true) {
  if (bomba) bombas.push(t);
  const i0 = Math.round(t * SR), len = Math.round(0.5 * SR); let fase = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR, f = 43 + 150 * Math.exp(-u / 0.03);
    fase += f / SR;
    const env = Math.min(1, u / 0.0012) * Math.exp(-u / 0.23);
    let x = Math.sin(TAU * fase) * env + 0.3 * ruido() * Math.exp(-u / 0.0022);
    x = Math.tanh(1.7 * x) / Math.tanh(1.7);
    soma(P.bateria, i0 + n, x * amp, x * amp);
  }
}
function palma(t, amp = 1) {
  const i0 = Math.round(t * SR), len = Math.round(0.4 * SR), bp = new SVF(); bp.set(1500, 0.8);
  for (let n = 0; n < len; n++) {
    const u = n / SR; let env = 0;
    for (const [d, k] of [[0, 0.007], [0.011, 0.007], [0.022, 0.13]]) if (u >= d) env += Math.exp(-(u - d) / k);
    bp.proc(ruido()); const x = bp.bp * env * 0.9 * amp;
    soma(P.bateria, i0 + n, x, x); soma(P.rev, i0 + n, x * 0.35, x * 0.35);
  }
}
function chimbal(t, amp = 1, aberto = false) {
  const dec = aberto ? 0.16 : 0.03, i0 = Math.round(t * SR), len = Math.round(dec * 7 * SR), f = new SVF(); f.set(7800, 0.7);
  for (let n = 0; n < len; n++) { f.proc(ruido()); const x = f.hp * Math.exp(-n / SR / dec) * 0.5 * amp; soma(P.bateria, i0 + n, x * 0.85, x * 1.15); }
}
function prato(t, amp = 1) {
  const i0 = Math.round(t * SR), len = Math.round(2.6 * SR), f = new SVF(); f.set(5200, 0.6); const g = new SVF(); g.set(9000, 3);
  for (let n = 0; n < len; n++) {
    const u = n / SR; f.proc(ruido()); g.proc(ruido());
    const x = (f.hp * 0.6 + g.bp * 0.25) * Math.exp(-u / 0.75) * Math.min(1, u / 0.002) * amp;
    soma(P.bateria, i0 + n, x * 0.9, x * 1.1); soma(P.rev, i0 + n, x * 0.3, x * 0.3);
  }
}
function tambor(t, amp = 1, f0 = 110) {
  const i0 = Math.round(t * SR), len = Math.round(0.6 * SR); let ph = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR, f = f0 * (0.7 + 0.3 * Math.exp(-u / 0.06)); ph = (ph + f / SR) % 1;
    const x = (Math.sin(TAU * ph) * Math.exp(-u / 0.2) + 0.2 * ruido() * Math.exp(-u / 0.01)) * amp;
    soma(P.bateria, i0 + n, x * 0.95, x * 1.05); soma(P.rev, i0 + n, x * 0.25, x * 0.25);
  }
}
function baixo(t, dur, m, amp = 1) {
  const i0 = Math.round(t * SR), len = Math.round((dur + 0.06) * SR), f = hz(m), lp = new SVF(); let fs = 0, fq = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR; fs = (fs + f / SR) % 1; fq = (fq + f / SR) % 1;
    if (n % 16 === 0) lp.set(170 + 1100 * Math.exp(-u / 0.07), 1.25);
    const osc = 0.55 * serra(fs, f / SR) + 0.75 * Math.sin(TAU * fq);
    const env = Math.min(1, u / 0.003) * (u < dur ? 1 : Math.max(0, 1 - (u - dur) / 0.06)) * (0.75 + 0.25 * Math.exp(-u / 0.1));
    const x = Math.tanh(1.3 * lp.proc(osc)) * env * amp;
    soma(P.baixo, i0 + n, x, x);
  }
}
// pad de serras desafinadas (supersaw), aberto em estéreo
function pad(t0, t1, notas, amp, o = {}) {
  const at = o.ataque ?? 0.5, so = o.soltura ?? 1.2, corte = o.corte ?? 2400;
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0 + so) * SR);
  const DES = [-13, -6, 0, 6, 13], PAN = [-0.85, -0.4, 0, 0.4, 0.85];
  const vozes = [];
  for (const m of notas) for (let k = 0; k < 5; k++) vozes.push({ f: hz(m) * Math.pow(2, DES[k] / 1200), fase: ((m * 7 + k * 13) % 17) / 17, pan: PAN[k] });
  const fl = new SVF(), fr = new SVF(); fl.set(corte, 0.7); fr.set(corte, 0.7);
  const norm = 1 / Math.sqrt(vozes.length);
  for (let n = 0; n < len; n++) {
    const u = n / SR; let l = 0, r = 0;
    for (const v of vozes) { v.fase = (v.fase + v.f / SR) % 1; const s = serra(v.fase, v.f / SR); l += s * (1 - v.pan) * 0.5; r += s * (1 + v.pan) * 0.5; }
    if (o.abre && n % 32 === 0) { const c = corte * Math.pow(o.abre, Math.min(1, u / (t1 - t0))); fl.set(c, 0.7); fr.set(c, 0.7); }
    const cresce = o.cresce ? db(-o.cresce * (1 - Math.min(1, u / (t1 - t0)))) : 1;   // crescendo: começa o.cresce dB abaixo
    const env = Math.min(1, u / at) * (u < t1 - t0 ? 1 : Math.max(0, 1 - (u - (t1 - t0)) / so)) * cresce;
    const xl = fl.proc(l) * env * amp * norm, xr = fr.proc(r) * env * amp * norm;
    soma(o.pista || P.pad, i0 + n, xl, xr); soma(P.rev, i0 + n, xl * (o.rev ?? 0.25), xr * (o.rev ?? 0.25));
  }
}
function pluck(t, m, amp = 1, o = {}) {
  const i0 = Math.round(t * SR), len = Math.round(0.55 * SR), f = hz(m), lp = new SVF(); let a = 0, b = 0.37;
  const eco = o.eco ?? 0.5;
  for (let n = 0; n < len; n++) {
    const u = n / SR; a = (a + f / SR) % 1; b = (b + f * 1.005 / SR) % 1;
    if (n % 16 === 0) lp.set(420 + 4800 * Math.exp(-u / 0.055), 1.15);
    const env = Math.min(1, u / 0.002) * Math.exp(-u / 0.17);
    const x = lp.proc(0.5 * serra(a, f / SR) + 0.5 * serra(b, f * 1.005 / SR)) * env * amp;
    soma(P.arpejo, i0 + n, x, x); soma(P.eco, i0 + n, x * eco, x * eco); soma(P.rev, i0 + n, x * 0.18, x * 0.18);
  }
}
// piano: aditivo, seis parciais levemente inarmônicos que decaem mais rápido quanto
// mais agudos, e o martelo num sopro de ruído. `sus` alonga a ressonância (o acorde final).
function piano(t, m, amp = 1, dur = 1.4, sus = 1) {
  const i0 = Math.round(t * SR), len = Math.round(dur * SR), f0 = hz(m), pan = Math.max(-0.5, Math.min(0.5, (m - 66) / 24));
  const parc = [1, 2, 3, 4, 5, 6].map((k) => ({ f: f0 * k * Math.sqrt(1 + 0.0004 * k * k), a: Math.pow(k, -1.4), tau: 0.9 * sus / (1 + 0.6 * (k - 1)), ph: (k * 0.13) % 1 }));
  const hp = new SVF(); hp.set(2500, 0.7);
  for (let n = 0; n < len; n++) {
    const u = n / SR; let x = 0;
    for (const p of parc) { p.ph = (p.ph + p.f / SR) % 1; x += Math.sin(TAU * p.ph) * p.a * Math.exp(-u / p.tau); }
    hp.proc(ruido()); x += hp.hp * 0.2 * Math.exp(-u / 0.004);
    x *= Math.min(1, u / 0.003) * Math.min(1, (dur - u) / 0.12) * amp * 0.5;
    soma(P.piano, i0 + n, x * (1 - pan), x * (1 + pan)); soma(P.rev, i0 + n, x * 0.32, x * 0.32); soma(P.eco, i0 + n, x * 0.1, x * 0.1);
  }
}
const acordePiano = (t, notas, amp, dur, sus) => notas.forEach((m, k) => piano(t + k * 0.012, m, amp, dur, sus));
// pedal grave: seno na tônica, serra filtrada uma oitava acima, respirando devagar
function pedal(t0, t1, m, amp) {
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), lp = new SVF(); let a = 0, b = 0, c = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR, tt = t0 + u;
    a = (a + hz(m) / SR) % 1; b = (b + hz(m + 12) / SR) % 1; c = (c + hz(m + 19) / SR) % 1;
    if (n % 64 === 0) lp.set(200 + 120 * Math.sin(TAU * 0.11 * tt), 0.9);
    const env = Math.min(1, u / 0.9) * Math.min(1, (t1 - t0 - u) / 0.6);
    const x = (0.75 * Math.sin(TAU * a) + lp.proc(serra(b, hz(m + 12) / SR)) * 0.9 + 0.18 * Math.sin(TAU * c)) * env * amp;
    soma(P.baixo, i0 + n, x, x);
  }
}
// tique curto (relógio, contador, os meses): f define a cor
function tique(t, amp = 1, f = 2500) {
  const i0 = Math.round(t * SR), len = Math.round(0.03 * SR), bp = new SVF(); bp.set(f * 1.32, 2.2); let ph = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR; ph = (ph + f / SR) % 1; bp.proc(ruido());
    const x = (bp.bp * 1.3 + 0.35 * Math.sin(TAU * ph)) * Math.exp(-u / 0.006) * amp;
    soma(P.bateria, i0 + n, x * 0.9, x * 1.1); soma(P.rev, i0 + n, x * 0.15, x * 0.15);
  }
}
function impacto(t, amp = 1) {   // sub que despenca + estouro de ruído
  const i0 = Math.round(t * SR), len = Math.round(2.4 * SR), lp = new SVF(); lp.set(1700, 0.7); let ph = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR, f = 27 + 62 * Math.exp(-u / 0.16); ph = (ph + f / SR) % 1;
    const sub = Math.sin(TAU * ph) * Math.exp(-u / 0.85) * Math.min(1, u / 0.002);
    lp.proc(ruido()); const nz = lp.lp * Math.exp(-u / 0.11) * 0.9;
    const x = Math.tanh(1.25 * (sub + nz)) * amp;
    soma(P.fx, i0 + n, x, x); soma(P.rev, i0 + n, nz * amp * 0.5, nz * amp * 0.5);
  }
}
function subida(t0, t1, amp = 1) {   // riser: ruído com banda que sobe + serra que sobe
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), bp = new SVF(); let ph = 0;
  for (let n = 0; n < len; n++) {
    const u = n / len; if (n % 32 === 0) bp.set(220 * Math.pow(7000 / 220, u), 2.2);
    bp.proc(ruido()); const f = hz(50 + 24 * u); ph = (ph + f / SR) % 1;
    const env = Math.pow(u, 2.3) * amp;
    const x = (bp.bp * 1.4 + 0.12 * serra(ph, f / SR)) * env;
    const w = 0.25 * Math.sin(u * 38);
    soma(P.fx, i0 + n, x * (1 + w), x * (1 - w));
  }
}
function brilho(t0, dur, notas, amp = 1) {   // cintilância aguda
  const i0 = Math.round(t0 * SR), len = Math.round(dur * SR);
  const vs = notas.map((m, k) => ({ f: hz(m), ph: k * 0.21, trem: 5 + k * 1.3 }));
  for (let n = 0; n < len; n++) {
    const u = n / SR; let x = 0;
    for (const v of vs) { v.ph = (v.ph + v.f / SR) % 1; x += Math.sin(TAU * v.ph) * (0.6 + 0.4 * Math.sin(TAU * v.trem * u)); }
    const env = Math.min(1, u / 0.6) * Math.min(1, (dur - u) / 1.2) * amp / vs.length;
    soma(P.pad, i0 + n, x * env * 0.9, x * env * 1.1); soma(P.rev, i0 + n, x * env * 0.5, x * env * 0.5);
  }
}

// ── Instrumentos novos deste filme ──────────────────────────────────────────
// pulso grave: seno afinado na fundamental do acorde (com um sopro de queda de
// afinação e um pouco de saturação, para existir também em alto-falante pequeno)
function pulso(t, m, amp = 1, dec = 0.2) {
  const i0 = Math.round(t * SR), len = Math.round(dec * 6 * SR), f = hz(m), lp = new SVF(); lp.set(280, 0.7); let ph = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR; ph = (ph + f * (1 + 0.6 * Math.exp(-u / 0.015)) / SR) % 1;
    const env = Math.min(1, u / 0.006) * Math.exp(-u / dec);
    const x = lp.proc(Math.tanh(1.8 * Math.sin(TAU * ph)) / Math.tanh(1.8)) * env * amp;
    soma(P.baixo, i0 + n, x, x);
  }
}
// sino de vidro: FM de razão 3,5 (inarmônico, cristalino), índice que decai rápido
function sino(t, m, amp = 1, dur = 2.0, o = {}) {
  const i0 = Math.round(t * SR), len = Math.round(dur * SR), f = hz(m), eco = o.eco ?? 0.3;
  const pan = o.pan ?? Math.max(-0.6, Math.min(0.6, (m - 84) / 12)), lim = Math.min(1, 1600 / f);   // sem rebatimento nas notas altas
  let pc = 0, pm = 0, p2 = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR; pc = (pc + f / SR) % 1; pm = (pm + 3.5 * f / SR) % 1; p2 = (p2 + 2 * f / SR) % 1;
    const ind = (1.4 * Math.exp(-u / 0.1) + 0.2) * lim;
    const env = Math.min(1, u / 0.0015) * Math.exp(-u / (o.dec ?? 0.6)) * Math.min(1, (dur - u) / 0.08);
    const x = (Math.sin(TAU * pc + ind * Math.sin(TAU * pm)) + 0.2 * Math.sin(TAU * p2) * Math.exp(-u / 0.25)) * env * amp * 0.35;
    soma(P.piano, i0 + n, x * (1 - pan), x * (1 + pan)); soma(P.rev, i0 + n, x * 0.35, x * 0.35); soma(P.eco, i0 + n, x * eco, x * eco);
  }
}
// caixa: corpo de dois senos + esteira de ruído (o hino e as viradas)
function caixa(t, amp = 1, o = {}) {
  const i0 = Math.round(t * SR), len = Math.round(0.45 * SR), bp = new SVF(), hp = new SVF(); bp.set(3000, 0.7); hp.set(5500, 0.7); let p1 = 0, p2 = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR; p1 = (p1 + 190 * (1 + 0.25 * Math.exp(-u / 0.008)) / SR) % 1; p2 = (p2 + 335 / SR) % 1;
    const corpo = (0.75 * Math.sin(TAU * p1) + 0.35 * Math.sin(TAU * p2)) * Math.exp(-u / 0.05);
    const nz = ruido(); bp.proc(nz); hp.proc(nz);
    const esteira = (bp.bp * 0.9 + hp.hp * 0.45) * Math.exp(-u / (o.dec ?? 0.12));
    const x = Math.tanh(1.5 * (corpo * 0.7 + esteira)) * Math.min(1, u / 0.0007) * amp * 0.8;
    soma(P.bateria, i0 + n, x * 0.96, x * 1.04); soma(P.rev, i0 + n, x * (o.rev ?? 0.35), x * (o.rev ?? 0.35));
  }
}
// aro: a baqueta no aro (a bateria contida do s7)
function aro(t, amp = 1) {
  const i0 = Math.round(t * SR), len = Math.round(0.1 * SR), bp = new SVF(); bp.set(1900, 2.5); let p = 0;
  for (let n = 0; n < len; n++) {
    const u = n / SR; p = (p + 760 / SR) % 1; bp.proc(ruido());
    const x = (bp.bp * 1.6 * Math.exp(-u / 0.01) + 0.45 * Math.sin(TAU * p) * Math.exp(-u / 0.018)) * Math.min(1, u / 0.0004) * amp;
    soma(P.bateria, i0 + n, x * 1.05, x * 0.95); soma(P.rev, i0 + n, x * 0.3, x * 0.3);
  }
}
// prato ao contrário: chiado agudo crescendo até t1, onde corta seco (4 ms)
function reverso(t0, t1, amp = 1) {
  const i0 = Math.round(t0 * SR), len = Math.round((t1 - t0) * SR), F = Math.round(0.004 * SR), k = 5, den = Math.exp(k) - 1;
  const fl = [new SVF(), new SVF()], fr = [new SVF(), new SVF()];
  fl[0].set(3800, 0.7); fr[0].set(3800, 0.7); fl[1].set(8000, 1.4); fr[1].set(8000, 1.4);
  for (let n = 0; n < len; n++) {
    const env = (Math.exp(k * n / len) - 1) / den * Math.min(1, (len - n) / F) * amp;
    const a = ruido(), b = ruido(); fl[0].proc(a); fl[1].proc(a); fr[0].proc(b); fr[1].proc(b);
    const xl = (fl[0].hp * 0.55 + fl[1].bp * 0.5) * env, xr = (fr[0].hp * 0.55 + fr[1].bp * 0.5) * env;
    soma(P.fx, i0 + n, xl, xr); soma(P.rev, i0 + n, xl * 0.15, xr * 0.15);
  }
}

// ── Efeitos da biblioteca (Pixabay Content License) → stem separado ────────
const ORIGEM_SFX = resolve(RAIZ, 'node_modules/hyperframes/dist/skills/media-use/audio/assets/sfx');
const DESTINO_SFX = resolve(RAIZ, 'assets/sfx');
mkdirSync(DESTINO_SFX, { recursive: true });
const cacheSfx = {}, usosSfx = [];
// Onde fica o GOLPE dentro de cada arquivo (medido: 30% do pico do envelope, ou o
// ápice nos whooshes; o riser da biblioteca culmina aos 4,0 s e depois se apaga).
// sfx(nome, t) põe esse ponto exatamente em t.
const GOLPE = { 'whoosh-cinematic': 2.54, 'whoosh': 0.16, 'whoosh-short': 0.16, 'impact-bass-1': 0.04, 'impact-bass-2': 0.02, 'click-soft': 0.05,
  'riser': 4.0, 'pop': 0.115, 'sparkle': 0.02, 'click': 0.05, 'ping': 0.32, 'chime': 0.41 };
// os impactos da biblioteca são "808" de ~2 s a −3 dB RMS, varrendo até 15 Hz: a cauda sai antes
const CAUDA = { 'impact-bass-1': 1.4, 'impact-bass-2': 1.4, 'whoosh-cinematic': 1.2 };
// O stem de efeitos NÃO passa pela janela dos blocos musicais (a cauda de um efeito
// não é cortada pelo gargalo nem pela parada).
function sfx(nome, alvo, ganhoDb = 0, o = {}) {
  const golpe = GOLPE[nome] ?? 0, t = alvo - golpe, cauda = o.cauda ?? CAUDA[nome], amp = db(ganhoDb);
  if (!cacheSfx[nome]) {
    copyFileSync(resolve(ORIGEM_SFX, nome + '.mp3'), resolve(DESTINO_SFX, nome + '.mp3'));
    const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', resolve(DESTINO_SFX, nome + '.mp3'), '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
    cacheSfx[nome] = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  }
  usosSfx.push({ nome, t: alvo, ganhoDb });
  const s = cacheSfx[nome], i0 = Math.round(t * SR);
  let fim = s.length / 2;
  if (cauda) fim = Math.min(fim, Math.round((golpe + cauda) * SR));
  if (o.ate) fim = Math.min(fim, Math.round((o.ate - t) * SR));   // corte seco num instante
  const fade = Math.round((o.ate ? 0.02 : 0.3) * SR);
  for (let n = 0; n < fim; n++) {
    const i = i0 + n; if (i < 0 || i >= N) continue;
    const g = (cauda || o.ate) ? Math.min(1, (fim - n) / fade) : 1;
    S[0][i] += s[2 * n] * amp * g; S[1][i] += s[2 * n + 1] * amp * g;
  }
}

// ── Harmonia: ré maior ──────────────────────────────────────────────────────
const AC = {
  D:     { baixo: 38, pad: [62, 66, 69], arp: [74, 78, 81, 86], pno: [50, 57, 62, 66] },
  Dadd9: { baixo: 38, pad: [57, 64, 66], arp: [74, 76, 78, 81], pno: [50, 57, 64, 66] },
  DF:    { baixo: 42, pad: [62, 66, 69], arp: [74, 78, 81, 86], pno: [42, 50, 57, 62] },   // ré/fá♯
  A:     { baixo: 33, pad: [61, 64, 69], arp: [73, 76, 81, 85], pno: [45, 52, 57, 61] },
  AC:    { baixo: 37, pad: [61, 64, 69], arp: [73, 76, 81, 85], pno: [49, 57, 61, 64] },   // lá/dó♯
  Asus:  { baixo: 33, pad: [62, 64, 69], arp: [74, 76, 81, 86], pno: [45, 52, 57, 62] },
  Bm:    { baixo: 35, pad: [62, 66, 71], arp: [74, 78, 83, 86], pno: [47, 54, 59, 62] },
  G:     { baixo: 31, pad: [62, 67, 71], arp: [74, 79, 83, 86], pno: [43, 50, 55, 59] },
  Gmaj7: { baixo: 31, pad: [62, 66, 71], arp: [74, 78, 83, 86], pno: [43, 50, 54, 59] },
  Gadd9: { baixo: 31, pad: [62, 69, 71], arp: [74, 79, 81, 83], pno: [43, 50, 57, 59] },
  Em7:   { baixo: 40, pad: [62, 67, 71], arp: [74, 76, 79, 83], pno: [40, 47, 50, 55] },
};
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];       // semicolcheias: sobe e desce
const ARP8 = [0, 2, 1, 3];                  // colcheias: tônica, quinta, terça, oitava
// sequência de acordes a partir de t0, em batidas → [{ ac, A, a, b }] (cortada em t1)
function seq(t0, lista, t1 = Infinity) {
  const out = []; let t = t0;
  for (const [ac, nb] of lista) {
    if (t >= t1 - 1e-6) break;
    if (!AC[ac]) throw new Error(`acorde desconhecido: ${ac}`);
    const b = Math.min(t + nb * B, t1); out.push({ ac, A: AC[ac], a: t, b }); t = b;
  }
  return out;
}
const acordeEm = (cs, t) => (cs.find((c) => t >= c.a - 1e-6 && t < c.b - 1e-6) ?? cs.at(-1)).A;

// groove: a seção recomeça o compasso no próprio corte.
//   o.bumbo (dB; o.bumboMeio = só 1 e 3) · o.palma / o.caixa / o.aro (2 e 4; …Desde)
//   o.chimbal (contratempo; o.aberto(t)) · o.semi (semicolcheias; o.semiDesde)
//   o.baixo (contratempo; o.baixoCheio = todas as colcheias; o.oitava no fim do compasso)
//   o.pad, o.corte → o.corteFim · o.arp (o.arpRitmo(t) 8|16, o.arpOitava(t), o.arpEco)
//   o.cresce (dB ao longo da seção) · o.bateriaAte (a bateria para antes do fim)
function groove(t0, t1, acordes, o) {
  const fn = (v, t) => (typeof v === 'function' ? v(t) : v);
  const pr = (t) => Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  const cr = (t) => (o.cresce ?? 0) * pr(t);
  const tb1 = o.bateriaAte ?? t1;
  for (let k = 0; t0 + k * B < tb1 - 1e-6; k++) {
    const tb = t0 + k * B, b = k % 4, c = cr(tb);
    if (o.bumbo !== undefined && (!o.bumboMeio || b % 2 === 0)) bumbo(tb, db(o.bumbo + c));
    if (b === 1 || b === 3) {
      if (o.palma !== undefined && tb >= (o.palmaDesde ?? t0)) palma(tb, db(o.palma + c));
      if (o.caixa !== undefined && tb >= (o.caixaDesde ?? t0)) caixa(tb, db(o.caixa + c));
      if (o.aro !== undefined) aro(tb, db(o.aro + c));
    }
    if (o.chimbal !== undefined) chimbal(tb + B / 2, db(o.chimbal + c), !!fn(o.aberto, tb));
    if (o.semi !== undefined && tb >= (o.semiDesde ?? t0)) { chimbal(tb + B / 4, db(o.semi + c)); chimbal(tb + 3 * B / 4, db(o.semi + c)); }
  }
  for (const { A, a, b } of acordes) {
    const c = cr(a);
    if (o.baixo !== undefined) for (let k = 0; a + k * B / 2 < b - 1e-6; k++) {               // baixo em colcheias
      const t = a + k * B / 2;
      if (k % 2 === 1 || o.baixoCheio) baixo(t, 0.2, A.baixo + (k === 7 && o.oitava ? 12 : 0), db(o.baixo + c + (k % 2 === 0 ? -2 : 0)));
    }
    if (o.pad !== undefined) pad(a, b, A.pad, db(o.pad + c), { ataque: 0.08, soltura: 0.35, corte: o.corte + ((o.corteFim ?? o.corte) - o.corte) * pr(a), rev: 0.22 });
    if (o.arp !== undefined) for (let k = 0; a + k * B / 4 < b - 1e-6; k++) {
      const t = a + k * B / 4, ritmo = fn(o.arpRitmo, t) ?? 16;
      if (t < (o.arpDesde ?? t0) - 1e-6 || (ritmo === 8 && k % 2 === 1)) continue;
      const nota = ritmo === 8 ? A.arp[ARP8[(k / 2) % 4]] : A.arp[ARP[k % 8]];
      const sobe = fn(o.arpOitava, t) && k >= 8 ? 12 : 0;
      pluck(t, nota + sobe, db(o.arp + c + (k % 4 === 0 ? 2 : 0)), { eco: o.arpEco });
    }
  }
}

// ── Densidade: quanto a música desce sob a voz em cada trecho (dB) ──────────
// Seção cheia (groove) 12 dB; rala (piano, gargalo, garantia) 9; transição 10,5.
const DENS = [];
const densidade = (t0, t1, d) => DENS.push([t0, t1, d]);

// marcos que viram acento: onde o marco cai e onde a música bate
const QUANT = [];
for (const [nome, t] of Object.entries(MARCO)) if (typeof t === 'number') QUANT.push([nome, t, Q(t)]);

// ════════════════════════════════════════════════════════════════════════
//  BLOCO 1 (s1–s3): tudo aqui escreve só até o GARGALO
// ════════════════════════════════════════════════════════════════════════
const DROP = M('gargalo');                  // a dominante cai em si menor; o groove para seco
const PARADA = T('s7');                     // o corte de s7: um tempo de ar antes do "custo"
CORTES.push({ t: DROP, rev: true, eco: true }, { t: PARADA, rev: false, eco: true });

faixa(0, DROP, () => {
  // ── s1 · Abertura: noite sobre a cidade ──────────────────────────────────
  {
    const t0 = T('s1'), t1 = FIM('s1');
    densidade(t0, t1, 9);
    const cs = seq(t0, [['Dadd9', 8], ['Bm', 4], ['Gmaj7', 4], ['Asus', 3], ['A', 1]], t1);
    for (const { A, a, b } of cs) {
      pad(a, b, A.pno, db(-18), { ataque: a === t0 ? 2.5 : 0.6, soltura: 0.7, corte: 900 + 60 * (a - t0), rev: 0.45 });
      if (b - a >= 2 * B) acordePiano(a, [A.pno[0] - 12, A.pno[0]], db(-17), Math.min(2.6, b - a + 0.5), 1.4);   // a oitava grave de cada acorde
    }
    // o motivo: lá–ré–mi–fá♯ subindo (5-1-2-3); a resposta, que pousa no si do sol;
    // a cadência lá–ré–dó♯ (o sus4 resolvendo) que entrega ao ré do logo
    for (const [bt, m, a, d] of [[1, 69, -10, 0.6], [2, 74, -10.5, 0.6], [3, 76, -10.5, 0.6], [4, 78, -9.5, 2.2],
      [9, 69, -10.5, 0.6], [10, 74, -11, 0.6], [11, 76, -11, 0.6], [12, 71, -10, 2.0],
      [17, 69, -11, 0.6], [18, 74, -11, 0.6], [19, 73, -10.5, 1.0]]) piano(t0 + bt * B, m, db(a), d, 1.3);
    // o pulso grave: mínimas a partir do 2º compasso, semínimas no 4º, crescendo até o corte
    for (let k = 4; t0 + k * B < t1 - 1e-6; k += k < 12 ? 2 : 1) {
      const t = t0 + k * B; pulso(t, acordeEm(cs, t).baixo, db(-26 + 11 * (t - t0) / (t1 - t0)));
    }
    subida(t1 - 2, t1, db(-21)); reverso(t1 - 2 * B, t1, db(-23));
  }

  // ── s2 · A Samais: o ré aberto, a luz do logo, o groove suave ─────────────
  {
    const t0 = T('s2'), t1 = FIM('s2');
    densidade(t0, t0 + C, 10.5); densidade(t0 + C, t1, 12);
    acordePiano(t0, [38, 45, 50, 57, 62, 66, 69, 74, 78], db(-13), 4.2, 2.0);              // ré largo, fá♯ no topo (o alvo do motivo)
    pad(t0, t0 + C, [50, 57, 62, 66, 69, 74], db(-15), { ataque: 0.35, soltura: 1.0, corte: 1100, abre: 2.4, rev: 0.45 });
    baixo(t0, C - 0.1, 38, db(-12)); pulso(t0, 38, db(-13)); prato(t0, db(-20));
    marco('logo', (t, tx) => {                                                               // a varredura de luz no logo
      brilho(t, 2.8, [86, 90, 93, 98], db(-22));
      [81, 86, 90, 93].forEach((m, k) => sino(t + k * B / 4, m, db(-15 - k), 1.8));
      sfx('sparkle', tx, -11);
    });
    const g0 = t0 + C;                                                                       // o groove suave: um compasso depois
    groove(g0, t1, seq(g0, [['AC', 4], ['Bm', 4], ['G', 2]], t1), { bumbo: -11, bumboMeio: true, chimbal: -22, semi: -32,
      baixo: -8, pad: -14, corte: 1500, corteFim: 1900, arp: -15, arpRitmo: 8, cresce: 2 });
    reverso(t1 - 2 * B, t1, db(-21));
    sfx('whoosh-cinematic', t0, -13);                     // o mergulho da noite no logo
  }

  // ── s3 · Prioridade federal: o groove confiante ───────────────────────────
  {
    const t0 = T('s3'), PERSP = MO('perspectiva') ?? t0 + 5 * C;
    densidade(t0, DROP, 12);
    const cs = seq(t0, [['D', 4], ['Bm', 4], ['G', 4], ['A', 4], ['D', 4], ['G', 4], ['A', 5]], DROP);
    prato(t0, db(-12));
    groove(t0, DROP, cs, { bumbo: -6, palma: -11, palmaDesde: t0 + C, chimbal: -17, aberto: (t) => t >= PERSP, semi: -27, semiDesde: t0 + 2 * C,
      baixo: -5, oitava: true, pad: -13, corte: 2000, corteFim: 3200, arp: -12.5, arpRitmo: 16, arpOitava: (t) => t >= PERSP, cresce: 2 });
    marco('gov', (t, tx) => { tambor(t, db(-12), 118); impacto(t, db(-22)); sfx('impact-bass-1', tx, -26, { cauda: 0.6 }); });   // o recorte do gov.br
    marco('mapa', (t, tx) => { tambor(t, db(-12), 95); impacto(t, db(-22)); sfx('whoosh-short', tx, -14); sfx('impact-bass-2', tx, -24, { cauda: 0.7 }); });
    marco('tres_mil', (t, tx) => {                                                           // os 3.300 acendendo
      sino(t, 81, db(-17), 1.4); sino(t + B / 4, 86, db(-18), 1.4); brilho(t, 2.4, [88, 93], db(-27));
      sfx('pop', tx, -10);
    });
    marco('perspectiva', (t, tx) => {                                                        // o acento claro (e o arpejo sobe, o chimbal abre)
      prato(t, db(-12)); brilho(t, 2.4, [86, 90, 93], db(-23));
      [81, 86, 90].forEach((m, k) => sino(t + k * B / 4, m, db(-14 - k), 1.6));
      sfx('whoosh-short', tx, -14); sfx('sparkle', tx, -16);
    });
    // o contador do R$ 1,2 bi: um tique a cada décimo que vira no número (12 décimos
    // em power2.out, 3 batidas a partir do marco "bi"), e o sino quando ele pousa
    marco('bi', (t, tx) => {
      const CONTA = 3 * B;
      for (let k = 1; k <= 12; k++) { const p = 1 - Math.cbrt(1 - (k - 0.5) / 12); tique(tx + p * CONTA, db(-19 + 3 * k / 12), 2300 + 150 * k); }
      sino(Q(tx + CONTA), 86, db(-14), 1.8); sino(Q(tx + CONTA), 93, db(-17), 1.8);
      sfx('ping', tx, -2);
    });
    // a virada: tons em semicolcheias atravessando o corte de s4, o prato ao contrário
    const s4 = T('s4');
    for (let k = 0; s4 + k * B / 4 < DROP - 1e-6; k++) tambor(s4 + k * B / 4, db(-15 + 1.3 * k), 150 - 17 * k);
    reverso(DROP - 3 * B, DROP, db(-18));
    sfx('whoosh', t0, -11);
  }
}, 0.004);

// ════════════════════════════════════════════════════════════════════════
//  BLOCO 2 (s4–s6): do GARGALO até a PARADA
// ════════════════════════════════════════════════════════════════════════
faixa(DROP, PARADA, () => {
  // ── s4 · O gargalo: a queda, o pedal de si, o relógio ─────────────────────
  {
    const s5 = T('s5'), REG = MO('regulador');
    const R0 = REG == null ? s5 - 6 * B : Math.max(DROP + 8 * B, Math.min(s5 - 4 * B, Math.ceil(REG / B - 1e-9) * B));   // a reconstrução: na batida depois do regulador
    densidade(T('s4'), R0, 9); densidade(R0, s5, 10.5);
    impacto(DROP, db(-6)); acordePiano(DROP, [23, 35, 42], db(-10), 4.0, 2.0);
    pedal(DROP, R0 + 2 * B + 0.2, 35, db(-17));                                              // si grave
    pad(DROP + B, R0 + 2 * B, [47, 54, 62], db(-20), { ataque: 2.5, soltura: 0.5, corte: 700, abre: 1.8, rev: 0.4 });
    pad(DROP + 3 * B, R0, [66, 73], db(-24), { ataque: 3.0, soltura: 1.0, corte: 1500, rev: 0.5 });   // fá♯ + dó♯: o ar tenso, sem drama
    for (let k = 1; DROP + k * B < R0 - 1e-6; k++) tique(DROP + k * B, db(k % 2 ? -25 : -23), k % 2 ? 1900 : 2500);   // o relógio
    // "seis": a pancada escura; duas batidas depois, um sino só ("a Samais é uma delas")
    marco('seis', (t, tx) => {
      impacto(t, db(-8)); acordePiano(t, [23, 35, 38], db(-11), 2.6, 1.6); tambor(t, db(-11), 55);
      sino(t + 2 * B, 78, db(-19), 2.2);
      sfx('impact-bass-2', tx, -16, { cauda: 1.0 });
    });
    // o regulador: a virada começa (o prato ao contrário pousa no marco, um sino)
    marco('regulador', (t, tx) => { reverso(t - 2 * B, t, db(-21)); sino(t, 81, db(-18), 1.8); sfx('whoosh-short', tx, -17); });
    // a reconstrução: bumbo, baixo pulsando, a dominante, o rufo, a subida
    const A0 = R0 + 2 * B;                                                                   // a dominante entra
    for (const [t, a] of [[R0, -13], [A0, -11], [A0 + B, -10], [A0 + 2 * B, -9], [A0 + 3 * B, -8]]) bumbo(t, db(a));
    for (let t = R0; t < A0 - 1e-6; t += B / 2) baixo(t, 0.18, 35, db(-15 + 3 * (t - R0) / (A0 - R0)));
    for (let t = A0; t < s5 - 1e-6; t += B / 2) baixo(t, 0.18, 33, db(-11 + 4 * (t - A0) / (s5 - A0)));
    pad(A0, A0 + 2 * B, AC.Asus.pad, db(-17), { ataque: 0.3, soltura: 0.05, corte: 1200, abre: 1.4, rev: 0.35 });
    pad(A0 + 2 * B, s5, AC.A.pad, db(-15), { ataque: 0.05, soltura: 0.05, corte: 1700, abre: 1.5, rev: 0.35 });
    for (let t = A0; t < s5 - 1e-6; t += B / 4) {
      const k = Math.round((t - A0) / (B / 4)), A = t < A0 + 2 * B ? AC.Asus : AC.A;
      if (t < A0 + 2 * B && k % 2 === 1) continue;                                          // colcheias, depois semicolcheias
      pluck(t, A.arp[t < A0 + 2 * B ? ARP8[(k / 2) % 4] : ARP[k % 8]], db(-18 + 5 * (t - A0) / (s5 - A0) + (k % 4 === 0 ? 2 : 0)));
    }
    for (let t = R0; t < s5 - 1e-6; t += B / 2) tique(t, db(-24 + 4 * (t - R0) / (s5 - R0)), 2200);
    for (let k = 0; k < 8; k++) caixa(s5 - B * 2 + k * B / 4, db(-27 + 1.6 * k), { rev: 0.25 });   // rufo
    subida(R0 + B, s5, db(-15)); reverso(s5 - 2 * B, s5, db(-17));
    sfx('impact-bass-1', MARCO.gargalo, -12, { cauda: 1.6 });
  }

  // ── s5 · Oito atestados · SAMU 192: propósito ─────────────────────────────
  {
    const t0 = T('s5'), t1 = FIM('s5');
    densidade(t0, t0 + C, 10.5); densidade(t0 + C, t1, 12);
    const cs = seq(t0, [['D', 4], ['AC', 4], ['Bm', 4], ['G', 4], ['Em7', 4], ['Asus', 2], ['A', 2]], t1);
    prato(t0, db(-13));
    groove(t0, t1, cs, { bumbo: -8, palma: -13, palmaDesde: t0 + 2 * C, chimbal: -19, semi: -29, semiDesde: t0 + 3 * C,
      baixo: -6.5, pad: -13, corte: 1500, corteFim: 2800, arp: -14, arpRitmo: (t) => (t < t0 + 2 * C ? 8 : 16), cresce: 3 });
    for (const [nome, f] of [['oito', 100], ['samu', 110], ['veiculo_governo', 125]]) marco(nome, (t, tx) => {   // tom + um toque de piano
      const A = acordeEm(cs, t);
      tambor(t, db(-10), f); acordePiano(t, A.arp.slice(0, 3).map((m) => m - 12), db(-12), 0.9, 0.8);
      sfx('whoosh-short', tx, -12);
      if (nome === 'veiculo_governo') sfx('impact-bass-1', tx, -25, { cauda: 0.5 });
    });
    reverso(t1 - 2 * B, t1, db(-16));
    for (let k = 0; k < 4; k++) tambor(t1 - B + k * B / 4, db(-14 + 1.3 * k), 140 - 15 * k);
  }

  // ── s6 · Pronta: o pulso tecnológico ──────────────────────────────────────
  {
    const t0 = T('s6'), t1 = FIM('s6'), MERC = MO('mercado_local') ?? t0 + 4 * C;
    densidade(t0, t1, 12);
    const cs = seq(t0, [['D', 4], ['Bm', 4], ['G', 4], ['Asus', 2], ['A', 2], ['D', 4], ['A', 2]], t1);
    // o ré que resolve: o primeiro a partir do "mercado local" (a dominante vem antes)
    const RES = (cs.find((c) => c.ac === 'D' && c.a >= MERC - 1e-6) ?? cs.find((c) => c.a >= MERC - 1e-6))?.a ?? t1;
    prato(t0, db(-10));
    groove(t0, t1, cs, { bumbo: -5.5, palma: -10.5, chimbal: -17, aberto: (t) => Math.round((t - t0) / B) % 4 === 3, semi: -25, baixo: -4.5, baixoCheio: true, oitava: true,
      pad: -12.5, corte: 2600, corteFim: 3400, arp: -11.5, arpRitmo: 8, arpEco: 0.95, arpOitava: (t) => t >= RES, cresce: 1.5 });
    for (const { A, a, b } of cs) for (const d of [3, 6, 11, 14]) {                          // blips: o "dado" passando
      const t = a + d * B / 4; if (t >= b - 1e-6) continue;
      let m = A.arp[d % 4] + 12; if (m > 93) m -= 12;
      sino(t, m, db(-25), 0.35, { dec: 0.1, eco: 0.6 });
    }
    marco('plataforma', (t, tx) => {                                                         // o console entra
      sino(t, 86, db(-13), 0.9); sino(t + B / 4, 93, db(-15), 0.9); aro(t, db(-11));
      sfx('whoosh', tx, -13);
    });
    marco('painel', (t, tx) => {                                                             // o clique no menu
      aro(t, db(-10)); sino(t, 90, db(-15), 0.5, { dec: 0.12 });
      sfx('click', tx, -3); sfx('whoosh-short', tx + 0.05, -17);
    });
    // o farol: a câmera mergulha e os sinos sobem até o ré do "mercado local"
    const SUBIDA = Math.min(RES - B / 2, MO('farol') ?? RES - B / 2);
    const RUN = [69, 74, 78, 81, 86, 90, 93], nRun = Math.min(RUN.length, Math.round((RES - SUBIDA) / (B / 8)));   // fusas subindo até o ré
    for (let k = 0; k < nRun; k++) sino(RES - (nRun - k) * B / 8, RUN[RUN.length - nRun + k], db(-17 + 0.3 * k), 1.0);
    reverso(SUBIDA - B, RES, db(-18)); prato(RES, db(-12.5)); brilho(RES, 2.6, [86, 90, 93], db(-23)); sino(RES, 86, db(-14), 2.0);
    if (MARCO.farol != null) sfx('whoosh-short', MARCO.farol, -14);
    for (let k = 0; k < 4; k++) caixa(t1 - B + k * B / 4, db(-17 + 1.5 * k), { rev: 0.25 });   // a virada que não chega: PARADA
    sfx('whoosh', t0, -13);
    const tMerc = MARCO.mercado_local ?? RES; sfx('sparkle', tMerc, -15); sfx('chime', tMerc, 2);
  }
}, 0.008);

// ════════════════════════════════════════════════════════════════════════
//  BLOCO 3 (s7–s10): da PARADA ao fim
// ════════════════════════════════════════════════════════════════════════
const ASS = M('assinatura');
const CONV = MO('convite') ?? T('s10') + B;                // o hino pousa aqui (a anacruse é o corte de s10)
const TAG = typeof MARCO.tagline === 'number' ? MARCO.tagline : ASS + 5 * B;   // dali em diante, só o pad
faixa(PARADA, DUR, () => {
  // ── s7 · O negócio: um tempo de ar, o impacto fundo, a construção elegante ─
  {
    const t0 = T('s7'), t1 = FIM('s7'), CUSTO = M('custo');
    const b2 = t0 + C, D1 = b2 + C, D2 = b2 + 3 * C, D3 = b2 + 5 * C;   // construção · bateria contida · contratempo · cheio
    densidade(t0, D1, 9); densidade(D1, t1, 12);
    impacto(CUSTO, db(-6)); acordePiano(CUSTO, [26, 38, 45], db(-9), 3.6, 2.0); pedal(CUSTO, b2 + 2 * B, 26, db(-16));
    pulso(CUSTO + 3 * B, 38, db(-12)); tambor(CUSTO + 3 * B, db(-15), 62);                  // o tremor de "é mensurável"
    sfx('impact-bass-2', MARCO.custo, -12, { cauda: 1.4 });
    const cs = seq(b2, [['Bm', 4], ['G', 4], ['A', 4], ['DF', 4], ['G', 4], ['Em7', 4], ['Asus', 2], ['A', 3]], t1);
    for (const { A, a, b } of cs) {
      const p = (a - b2) / (t1 - b2), voz = [...new Set([A.pno[0] + 12, ...A.pad])].sort((x, y) => x - y);
      for (const [d, dur, ac] of [[0, 0.7, 0], [3, 0.7, -2], [6, 0.5, -3]]) {               // piano em 3-3-2 (colcheias)
        const t = a + d * B / 2; if (t < b - 1e-6) acordePiano(t, voz, db(-17 + 4 * p + ac), dur + 0.3, 0.9);
      }
      acordePiano(a, [A.pno[0] - 12, A.pno[0]], db(-18 + 2 * p), Math.min(2.2, b - a + 0.2), 1.3);   // mão esquerda
      pad(a, b, A.pad, db(-16 + 4 * p), { ataque: a === b2 ? 1.2 : 0.15, soltura: 0.4, corte: 1300 + 1600 * p, rev: 0.35 });
      if (a < D2 - 1e-6) baixo(a, b - a - 0.05, A.baixo, db(-12));
      else for (let k = 0; a + k * B / 2 < b - 1e-6; k++) {
        const t = a + k * B / 2; if (k % 2 === 1 || t >= D3) baixo(t, 0.2, A.baixo, db(-7 + 2 * (t - D2) / (t1 - D2) + (k % 2 ? 0 : -2)));
      }
      if (a >= D2 - 1e-6) for (let k = 0; a + k * B / 4 < b - 1e-6; k++) {                   // arpejo: colcheias, depois semicolcheias
        const t = a + k * B / 4, oito = t < D3; if (oito && k % 2 === 1) continue;
        pluck(t, oito ? A.arp[ARP8[(k / 2) % 4]] : A.arp[ARP[k % 8]], db((oito ? -16 : -13) + (k % 4 === 0 ? 2 : 0)));
      }
    }
    for (let k = 0; D1 + k * B < t1 - 1e-6; k++) {                                           // a bateria contida, que cresce
      const tb = D1 + k * B, b = k % 4, cheio = tb >= D3, p = (tb - D1) / (t1 - D1);
      if (cheio || b % 2 === 0) bumbo(tb, db(cheio ? -7 : -10));
      if (b === 1 || b === 3) { if (cheio) palma(tb, db(-12)); else aro(tb, db(-15)); }
      chimbal(tb + B / 2, db(-24 + 6 * p));
      if (tb >= D2) { chimbal(tb + B / 4, db(-31 + 4 * p)); chimbal(tb + 3 * B / 4, db(-31 + 4 * p)); }
    }
    // um golpe limpo por número: bumbo, tom, o acorde no piano, um sopro de prato
    const golpe = (t, forte = 0) => {
      const A = acordeEm(cs, t);
      bumbo(t, db(-8 + forte), false); tambor(t, db(-12 + forte), 88); impacto(t, db(-22 + forte)); prato(t, db(-22 + forte));
      acordePiano(t, [A.pno[0], A.pno[0] + 12, ...A.pad], db(-12 + forte), 1.1, 1.0);
    };
    marco('vinte_e_um', (t, tx) => { golpe(t); sfx('whoosh-short', tx, -14); sfx('impact-bass-1', tx, -22, { cauda: 0.6 }); });
    marco('quinze', (t, tx) => { golpe(t); sfx('click', tx, -6); sfx('impact-bass-1', tx, -24, { cauda: 0.5 }); });
    marco('seis_mi', (t, tx) => {                                                            // a oferta: o golpe mais claro
      golpe(t, 2); brilho(t, 2.4, [86, 90, 93], db(-24));
      sfx('whoosh-short', tx, -12); sfx('impact-bass-1', tx, -19, { cauda: 0.8 }); sfx('sparkle', tx, -16);
    });
    marco('cotas', (t, tx) => {                                                              // três cotas: um sino por fatia que acende
      golpe(t, -1); [86, 90, 93].forEach((m, k) => sino(t + k * B / 4, m, db(-15), 1.4));
      for (let k = 0; k < 3; k++) sfx('pop', tx + k * B / 4, -9 - k);
    });
    marco('duas_cotas', (t, tx) => {                                                         // ...ou duas
      golpe(t, -3); [90, 86].forEach((m, k) => sino(t + k * B / 2, m, db(-16), 1.4));
      sfx('whoosh-short', tx, -15); sfx('pop', tx + 0.1, -10);
    });
    // a chegada no s8: caixa em colcheias, depois semicolcheias; a subida
    for (let t = t1 - 3 * B; t < t1 - 1e-6; t += t < t1 - B - 1e-6 ? B / 2 : B / 4) caixa(t, db(-22 + 9 * (t - (t1 - 3 * B)) / (3 * B)), { rev: 0.3 });
    subida(t1 - 4 * B, t1, db(-15)); reverso(t1 - 2 * B, t1, db(-16));
  }

  // ── s8 · O retorno: mês a mês, clareando ──────────────────────────────────
  {
    const t0 = T('s8'), t1 = FIM('s8'), PAY = MO('payback') ?? t0 + 5 * C, fimG = t1 - B;
    densidade(t0, t1, 12);
    // a harmonia anda em ré · lá · si m · sol, e o compasso do payback é a chegada: lá → RÉ
    const nComp = Math.ceil((t1 - t0) / C - 1e-9), kPay = Math.floor((PAY - t0) / C + 1e-9), roda = ['D', 'A', 'Bm', 'G'], depois = ['G', 'Bm'];
    const lista = Array.from({ length: nComp }, (_, k) => [k === nComp - 1 ? 'A' : k === kPay ? 'D' : k === kPay - 1 ? 'A' : k < kPay ? roda[k % 4] : depois[(k - kPay - 1) % 2], 4]);
    const cs = seq(t0, lista, t1);
    prato(t0, db(-9));
    groove(t0, fimG, cs.filter((c) => c.a < fimG - 1e-6), { bumbo: -5.5, palma: -11, chimbal: -17, aberto: (t) => t >= PAY, semi: -26.5,
      baixo: -4.5, oitava: true, pad: -12.5, corte: 2000, corteFim: 3600, arp: -12, arpRitmo: 16, arpOitava: (t) => t >= PAY, cresce: 1.5 });
    const MES = MO('mensal') ?? t0;
    for (let t = Math.ceil(MES / B - 1e-9) * B; t < PAY - 1e-6; t += B) {                    // um tique por batida: os meses, até o payback
      const p = (t - MES) / (PAY - MES); tique(t, db(-24 + 3 * p), 1800 * Math.pow(2, 0.9 * p));
    }
    sino(MES, 86, db(-19), 1.2);
    prato(PAY, db(-11)); impacto(PAY, db(-16)); tambor(PAY, db(-12), 100);                   // o payback (o stem de efeitos leva o brilho no quadro exato)
    [86, 90, 93, 98].forEach((m, k) => sino(PAY + k * B / 4, m, db(-13.5 - k), 2.0));
    brilho(PAY, 3.2, [86, 90, 93, 98], db(-22));
    pad(fimG, t1 + B, AC.A.pad, db(-15), { ataque: 0.05, soltura: 0.6, corte: 1800, rev: 0.45 });   // assenta
    reverso(t1 - 2 * B, t1, db(-22));
    sfx('whoosh', t0, -14);
    const tPay = MARCO.payback ?? PAY; sfx('ping', tPay, -1); sfx('sparkle', tPay, -12); sfx('chime', tPay + 0.1, 2);
  }

  // ── s9 · A garantia: calma ────────────────────────────────────────────────
  {
    const t0 = T('s9'), SUS = CONV - 3 * B;
    densidade(t0, T('s10'), 10.5);
    pad(t0, SUS, [55, 62, 69, 71], db(-14), { ataque: 0.5, soltura: 0.8, corte: 1500, rev: 0.5 });   // sol(add9)
    acordePiano(t0, [31, 43, 50, 57, 59, 62], db(-12), 3.6, 1.8);
    baixo(t0, SUS - t0 - 0.1, 31, db(-13));
    for (let k = 1; t0 + k * B < SUS - 1e-6; k++) piano(t0 + k * B, [55, 62, 69, 71, 74, 71, 69, 62][k % 8], db(k % 4 === 0 ? -16 : -18.5), 1.4);
    for (let t = t0; t < SUS - 1e-6; t += 2 * B) pulso(t, 43, db(-18));
    marco('garantia', (t, tx) => { sino(t, 86, db(-18), 2.0); sino(t + B, 91, db(-20), 2.0); sfx('chime', tx, -1); });
    pad(SUS, CONV, AC.Asus.pad.concat(57), db(-14), { ataque: 0.3, soltura: 0.05, corte: 1400, abre: 2.2, cresce: 6, rev: 0.4 });   // o sus4 crescendo
    baixo(SUS, CONV - SUS - 0.05, 33, db(-12));
    subida(SUS, CONV, db(-18)); reverso(CONV - 2 * B, CONV, db(-15));
  }

  // ── s10 · O convite: o hino, o motivo harmonizado, a assinatura ───────────
  {
    const t0 = T('s10');
    densidade(t0, ASS, 12); densidade(ASS, DUR, 9);
    for (let k = 0; t0 + k * B / 4 < CONV - 1e-6; k++) caixa(t0 + k * B / 4, db(-16 + 1.5 * k), { rev: 0.3 });   // a anacruse no corte
    const cs = seq(CONV, [['D', 4], ['Gmaj7', 4], ['Asus', 2], ['A', 2]], ASS);
    prato(CONV, db(-8));
    const fimBat = CONV + 10 * B, FIM_VOZ = Math.max(...FALAS.map((f) => f.t1));
    prato(Math.ceil(FIM_VOZ / B - 1e-9) * B, db(-17));                                        // a voz termina: o hino abre
    groove(CONV, ASS, cs, { bumbo: -8.5, caixa: -13, chimbal: -21, semi: -28.5, baixo: -7, baixoCheio: true, pad: -13.5, corte: 2800, corteFim: 3600,
      arp: -15.5, arpRitmo: 16, arpOitava: true, bateriaAte: fimBat, cresce: 3 });   // cresce sob a voz; abre quando ela termina
    bumbo(fimBat, db(-8.5));
    for (let k = 1; k <= 4; k++) tambor(fimBat + k * B / 4, db(-14.5 + 1.2 * k), 150 - 18 * k);   // a virada que entrega a assinatura
    // o motivo do s1, agora harmonizado: sobe até o fá♯ sobre sol(maj7), desce, o sus4, o dó♯
    for (const [bt, notas, d] of [[1, [62, 66, 69], 0.6], [2, [66, 69, 74], 0.6], [3, [69, 74, 76], 0.6], [4, [71, 74, 78], 1.9],
      [6, [67, 71, 76], 0.6], [7, [67, 71, 74], 0.6], [8, [64, 69, 74], 1.9], [10, [64, 69, 73], 1.1]]) {
      const t = CONV + bt * B, sobVoz = t < FIM_VOZ;
      acordePiano(t, notas, db(sobVoz ? -12 : -11), d + 0.4, 1.2);
      sino(t, notas.at(-1) + 12, db(sobVoz ? -19.5 : -19), 1.4);
    }
    // a assinatura: ré maior largo, ressoando; depois só o pad
    impacto(ASS, db(-14)); prato(ASS, db(-15)); bumbo(ASS, db(-10), false);
    acordePiano(ASS, [38, 45, 50, 57, 62, 66, 69, 74, 78], db(-13), TAG - ASS + 0.6, 3.2);
    baixo(ASS, 2.6, 38, db(-13.5));
    pad(ASS, DUR, [50, 57, 62, 66, 69, 74], db(-16.5), { ataque: 0.05, soltura: 0.1, corte: 2400, abre: 0.45, rev: 0.5 });
    brilho(ASS + 1.5 * B, TAG - ASS, [86, 90, 93], db(-26));                                  // a luz varrendo a assinatura
    sfx('whoosh', t0, -15);
    sfx('impact-bass-1', MARCO.assinatura, -15, { cauda: 1.2 }); sfx('sparkle', MARCO.assinatura, -12);
  }
});

// ════════════════════════════════════════════════════════════════════════
//  MIXAGEM
// ════════════════════════════════════════════════════════════════════════
// sidechain: o pad, o baixo e o arpejo "respiram" com o bumbo
const respira = new Float32Array(N).fill(1);
for (const tb of bombas) {
  const i0 = Math.round(tb * SR);
  for (let n = 0; n < 0.45 * SR && i0 + n < N; n++) respira[i0 + n] = Math.min(respira[i0 + n], 1 - 0.62 * Math.exp(-n / SR / 0.1));
}
// reverberação (Freeverb) e eco pingue-pongue. Nos CORTES o estado é zerado (com 12 ms
// de rampa no retorno), para a cauda do groove não passar por baixo da queda.
const rampaCortes = (ts) => {
  const g = new Float32Array(N).fill(1), F = Math.round(0.012 * SR), zera = new Set();
  for (const t of ts) { const i = Math.round(t * SR); zera.add(i); for (let n = Math.max(0, i - F); n < i; n++) g[n] = Math.min(g[n], (i - n) / F); }
  return { g, zera };
};
function freeverb(inp, cortes, sala = 0.86, amort = 0.24) {
  const esc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225], out = pista(), { g, zera } = rampaCortes(cortes);
  for (let c = 0; c < 2; c++) {
    const off = c ? 23 : 0, x = inp[c], y = out[c];
    const cb = combs.map((d) => ({ b: new Float32Array(Math.round((d + off) * esc)), i: 0, f: 0 }));
    const ap = aps.map((d) => ({ b: new Float32Array(Math.round((d + off) * esc)), i: 0 }));
    for (let n = 0; n < N; n++) {
      if (zera.has(n)) { for (const k of cb) { k.b.fill(0); k.f = 0; } for (const a of ap) a.b.fill(0); }
      const e = x[n] * 0.015; let acc = 0;
      for (const k of cb) { const o = k.b[k.i]; k.f = o * (1 - amort) + k.f * amort; k.b[k.i] = e + k.f * sala; if (++k.i >= k.b.length) k.i = 0; acc += o; }
      for (const a of ap) { const bo = a.b[a.i], o = -acc + bo; a.b[a.i] = acc + bo * 0.5; if (++a.i >= a.b.length) a.i = 0; acc = o; }
      y[n] = acc * g[n];
    }
  }
  return out;
}
function pinguePongue(inp, cortes, tempo = 0.375, fb = 0.36) {   // colcheia pontuada a 120 BPM
  const d = Math.round(tempo * SR), out = pista(), bl = new Float32Array(d), br = new Float32Array(d), { g, zera } = rampaCortes(cortes); let i = 0, fl = 0, fr = 0;
  for (let n = 0; n < N; n++) {
    if (zera.has(n)) { bl.fill(0); br.fill(0); fl = 0; fr = 0; }
    const dl = bl[i], dr = br[i]; out[0][n] = dl * g[n]; out[1][n] = dr * g[n];
    fl = fl * 0.35 + dr * 0.65; fr = fr * 0.35 + dl * 0.65;
    bl[i] = (inp[0][n] + inp[1][n]) * 0.5 + fl * fb; br[i] = fr * fb;
    if (++i >= d) i = 0;
  }
  return out;
}
const REV = freeverb(P.rev, CORTES.filter((c) => c.rev).map((c) => c.t)), ECO = pinguePongue(P.eco, CORTES.filter((c) => c.eco).map((c) => c.t));
let L = new Float32Array(N), R = new Float32Array(N);
{
  const hl = new SVF(), hr = new SVF(); hl.set(25, 0.707); hr.set(25, 0.707);      // nada abaixo de 25 Hz: só come margem
  for (let n = 0; n < N; n++) {
    const r = respira[n], x = [0, 0];
    for (let c = 0; c < 2; c++) x[c] = P.bateria[c][n] + P.baixo[c][n] * r + P.pad[c][n] * (0.45 + 0.55 * r) + P.arpejo[c][n] * (0.7 + 0.3 * r)
      + P.piano[c][n] + P.fx[c][n] + REV[c][n] * 5 + ECO[c][n] * 0.9;
    hl.proc(x[0]); hr.proc(x[1]);
    L[n] = Math.tanh(hl.hp * 0.9) / 0.9; R[n] = Math.tanh(hr.hp * 0.9) / 0.9;     // "cola" suave no barramento
  }
}
// O fim: a partir do cartão da tagline só o pad, apagando; zero digital nos últimos 0,1 s.
const iFim = Math.round((DUR - SILENCIO_FINAL) * SR);
{
  const f0 = Math.round(TAG * SR);
  for (let n = f0; n < N; n++) {
    const p = (n - f0) / (iFim - f0);
    const g = n >= iFim ? 0 : db(-30 * Math.pow(p, 1.5)) * (p > 0.9 ? 0.5 + 0.5 * Math.cos(Math.PI * (p - 0.9) / 0.1) : 1);
    L[n] *= g; R[n] *= g;
  }
}
// a queda, medida no arranjo (antes do abaixamento sob a voz)
const rms = (p, a, b) => { let s = 0, k = 0; for (let n = Math.max(0, Math.round(a * SR)); n < Math.min(N, Math.round(b * SR)); n++) { s += p[0][n] ** 2 + p[1][n] ** 2; k += 2; } return k ? 10 * Math.log10(s / k + 1e-12) : -120; };
const JAN_ANTES = [DROP - 3 * B, DROP], JAN_DEPOIS = [DROP + 3 * B, Math.min(MO('seis') ?? DUR, DROP + 7 * B)];   // depois: passado o 1º segundo do impacto, antes do "seis"
const quedaArranjo = { antes: rms([L, R], ...JAN_ANTES), depois: rms([L, R], ...JAN_DEPOIS),
  bateriaAntes: rms(P.bateria, ...JAN_ANTES), bateriaDepois: rms(P.bateria, ...JAN_DEPOIS) };

// ── Abaixar sob a voz: 9–12 dB por fala, ataque 0,15 s, soltura 0,35 s ────────
// A profundidade segue a densidade do trecho (suavizada em 0,5 s). Entre duas falas
// separadas por menos de 0,7 s a música sobe só até a metade (sem "soluço").
const ATQ = 0.15, SOLT = 0.35, VAO_CURTO = 0.7;
const ativ = new Float32Array(N);
for (const f of FALAS) {
  const a0 = f.t0 - ATQ, r1 = f.t1 + SOLT;
  for (let n = Math.max(0, Math.round(a0 * SR)); n < Math.min(N, Math.round(r1 * SR)); n++) {
    const t = n / SR, v = t < f.t0 ? suave((t - a0) / ATQ) : t <= f.t1 ? 1 : 1 - suave((t - f.t1) / SOLT);
    if (v > ativ[n]) ativ[n] = v;
  }
}
const vaosCurtos = [];
for (let k = 0; k + 1 < FALAS.length; k++) {
  const g0 = FALAS[k].t1, g1 = FALAS[k + 1].t0;
  if (g1 - g0 < VAO_CURTO) { vaosCurtos.push(`${FALAS[k].id}→${FALAS[k + 1].id} (${(g1 - g0).toFixed(2)} s)`);
    for (let n = Math.round(g0 * SR); n < Math.round(g1 * SR); n++) ativ[n] = Math.max(ativ[n], 0.5); }
}
const prof = new Float32Array(N);
{
  const passo = 480, nb = Math.ceil(N / passo), bruto = new Float64Array(nb);           // blocos de 10 ms
  for (let j = 0; j < nb; j++) { const t = j * passo / SR; let d = 10.5; for (const [a, b, v] of DENS) if (t >= a && t < b) d = v; bruto[j] = d; }
  const W = 25;                                                                          // média móvel de ±0,25 s
  for (let j = 0; j < nb; j++) { let s = 0, k = 0; for (let i = Math.max(0, j - W); i <= Math.min(nb - 1, j + W); i++) { s += bruto[i]; k++; }
    const v = s / k; for (let n = j * passo; n < Math.min(N, (j + 1) * passo); n++) prof[n] = v; }
}
console.log('abaixamento sob a locução (ataque 0,15 s · soltura 0,35 s; profundidade pela densidade do trecho)');
for (const f of FALAS) {
  let s = 0, k = 0; for (let n = Math.round(f.t0 * SR); n < Math.min(N, Math.round(f.t1 * SR)); n += 480) { s += prof[n]; k++; }
  console.log(`  ${f.id.padEnd(5)} ${f.t0.toFixed(2).padStart(6)}–${f.t1.toFixed(2).padEnd(6)} ${cenaDe((f.t0 + f.t1) / 2).padEnd(4)} −${(s / k).toFixed(1)} dB`);
}
if (vaosCurtos.length) console.log(`  vãos curtos (a música sobe só até a metade): ${vaosCurtos.join(' · ')}`);
// e o vão da voz: sob cada fala, a faixa de presença (≈ 2,2 kHz, larga) desce mais 3 dB —
// a música continua inteira, mas sai da frente das consoantes (equalizador de pico, y = x − (1 − G)·k·bp)
const VAO_VOZ_DB = 3;
{
  const fl = new SVF(), fr = new SVF(); fl.set(2200, 0.7); fr.set(2200, 0.7);
  for (let n = 0; n < N; n++) {
    const g = db(-prof[n] * ativ[n]), c = (1 - db(-VAO_VOZ_DB * ativ[n])) * fl.k;
    fl.proc(L[n]); fr.proc(R[n]);
    L[n] = (L[n] - c * fl.bp) * g; R[n] = (R[n] - c * fr.bp) * g;
  }
}
console.log(`  e sob a voz, a presença (2,2 kHz, larga) desce mais ${VAO_VOZ_DB} dB`);

// ════════════════════════════════════════════════════════════════════════
//  LOUDNESS em duas passadas: mede → ganho + limitador → mede de novo
// ════════════════════════════════════════════════════════════════════════
function wav24(canais) {
  const n = canais[0].length, nc = canais.length, buf = Buffer.alloc(44 + n * 3 * nc);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 3 * nc, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(nc, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 3 * nc, 28); buf.writeUInt16LE(3 * nc, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(n * 3 * nc, 40);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) {
    let v = Math.round(canais[c][i] * 8388607); v = v > 8388607 ? 8388607 : v < -8388608 ? -8388608 : v;
    if (v < 0) v += 16777216; buf[o++] = v & 255; buf[o++] = (v >> 8) & 255; buf[o++] = (v >> 16) & 255;
  }
  return buf;
}
const medir = (wav) => {   // loudness integrada e pico verdadeiro (o relatório do loudnorm vai no stderr)
  const e = spawnSync(FFMPEG, ['-hide_banner', '-f', 'wav', '-i', 'pipe:0', '-af', `loudnorm=I=${ALVO_LUFS}:TP=${TETO_TP}:LRA=20:print_format=json`, '-f', 'null', '-'],
    { input: wav, encoding: 'utf8', maxBuffer: 1 << 26 }).stderr;
  const js = JSON.parse(e.slice(e.lastIndexOf('{'), e.lastIndexOf('}') + 1));
  return { I: +js.input_i, TP: +js.input_tp, LRA: +js.input_lra };
};
// ganho + limitador com antecipação (mínimo exato na janela de 4 ms, soltura 80 ms)
function ganhoLimitado(canais, ganho, teto) {
  const LA = Math.round(0.004 * SR), g = new Float32Array(N), out = canais.map(() => new Float32Array(N));
  for (let n = 0; n < N; n++) { let a = 0; for (const c of canais) a = Math.max(a, Math.abs(c[n])); a *= ganho; g[n] = a > teto ? teto / a : 1; }
  const fila = new Int32Array(N); let h = 0, t = 0, s = 1; const rel = Math.exp(-1 / (0.08 * SR));
  for (let n = 0, j = 0; n < N; n++) {
    for (; j <= Math.min(N - 1, n + LA); j++) { while (t > h && g[fila[t - 1]] >= g[j]) t--; fila[t++] = j; }
    while (fila[h] < n) h++;
    const v = g[fila[h]]; s = v < s ? v : v + (s - v) * rel;
    for (let c = 0; c < canais.length; c++) out[c][n] = canais[c][n] * ganho * s;
  }
  return out;
}
// normaliza para `alvo` LUFS com o pico verdadeiro abaixo de `tp` (ganho e teto ajustados juntos)
function normalizar(canais, alvo, tp, rotulo) {
  const m0 = medir(wav24(canais));
  let gDb = alvo - m0.I, teto = tp - 0.6, out, m;
  for (let it = 0; it < 6; it++) {
    out = ganhoLimitado(canais, db(gDb), db(teto));
    for (const c of out) c.fill(0, iFim);                                                 // zero digital no fim, sempre
    m = medir(wav24(out));
    console.log(`  ${rotulo} passada ${it + 1}: ganho ${gDb.toFixed(2)} dB, teto ${teto.toFixed(2)} dBFS → ${m.I.toFixed(2)} LUFS, ${m.TP.toFixed(2)} dBTP`);
    if (Math.abs(m.I - alvo) <= 0.2 && m.TP <= tp - 0.05) break;
    gDb += alvo - m.I;
    if (m.TP > tp - 0.05) teto -= m.TP - (tp - 0.15);
  }
  return { out, m0, m };
}
console.log('\nloudness');
const { out: trilha, m0, m: mt } = normalizar([L, R], ALVO_LUFS, TETO_TP, 'trilha');
// o stem de efeitos: passa-alta em 30 Hz (o rabo infrassônico dos "808" não serve a
// ninguém e come margem), depois −23 LUFS integrada com teto de −3 dBTP
const sfxHP = S.map((c) => { const f = new SVF(); f.set(30, 0.707); const o = new Float32Array(N); for (let n = 0; n < N; n++) { f.proc(c[n]); o[n] = f.hp; } return o; });
const { out: sfxOut, m: ms } = normalizar(sfxHP, ALVO_SFX, TETO_SFX, 'sfx   ');

// ── Saídas ──────────────────────────────────────────────────────────────────
mkdirSync(resolve(RAIZ, 'assets/audio'), { recursive: true });
const arqTrilha = resolve(RAIZ, 'assets/audio/trilha.wav'), arqSfx = resolve(RAIZ, 'assets/audio/sfx.wav');
writeFileSync(arqTrilha, wav24(trilha)); writeFileSync(arqSfx, wav24(sfxOut));
const usados = Object.keys(cacheSfx).sort();
writeFileSync(resolve(DESTINO_SFX, 'CREDITS.md'), `# Efeitos sonoros (SFX) — créditos

Os efeitos de corte do filme de investidores do ROTA vêm da biblioteca que acompanha a HyperFrames
(\`hyperframes/dist/skills/media-use/audio/assets/sfx\`), de origem [Pixabay](https://pixabay.com/sound-effects/),
sob a [Pixabay Content License](https://pixabay.com/service/license-summary/): uso comercial e não comercial,
modificação e redistribuição como parte de obra derivada, sem exigência de atribuição (dada aqui por transparência).

A **música** (\`assets/audio/trilha.wav\`) é nossa, sintetizada em \`trilha/compor.mjs\`: nenhum sample de terceiro.
Estes arquivos entram só no stem de efeitos (\`assets/audio/sfx.wav\`).

## Arquivos usados

${usados.map((n) => `- \`${n}.mp3\``).join('\n')}

Copiados por \`node trilha/compor.mjs\`; não edite à mão.
`);

// ── Diagnóstico: sem ouvido, o equilíbrio se mede ─────────────────────────────
const f1 = (x) => (x < -99 ? '   —' : x.toFixed(1).padStart(6));
console.log('\nmarcos → acento musical (semicolcheia mais próxima; os efeitos caem no marco exato)');
console.log('  ' + QUANT.map(([n, t, q]) => `${n} ${t}${Math.abs(q - t) > 1e-9 ? `→${q} (${((q - t) * 1000).toFixed(0)} ms)` : ''}`).join(' · '));
console.log('\nRMS por cena (dBFS). Pistas antes da mixagem; trilha/sfx como saem nos arquivos');
console.log('cena         ' + ['bateria', 'baixo', 'pad', 'arpejo', 'piano', 'fx'].map((s) => s.padStart(8)).join('') + '   trilha     sfx');
for (const c of ROT.cenas) {
  const cols = ['bateria', 'baixo', 'pad', 'arpejo', 'piano', 'fx'].map((k) => f1(rms(P[k], c.t0, c.t1)).padStart(8)).join('');
  console.log(`${c.id.padEnd(3)} ${c.t0.toFixed(1).padStart(5)}–${c.t1.toFixed(1).padEnd(5)}${cols}  ${f1(rms(trilha, c.t0, c.t1))}  ${f1(rms(sfxOut, c.t0, c.t1))}`);
}
const dur = (arq) => +execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arq], { encoding: 'utf8' }).trim();
const info = (arq) => execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=sample_rate,channels', '-of', 'csv=p=0', arq], { encoding: 'utf8' }).trim();
// o fim, relido do arquivo gravado: os últimos 0,1 s têm de ser zero
const lido = readFileSync(arqTrilha); let picoFim = 0;
for (let i = iFim; i < N; i++) for (let c = 0; c < 2; c++) picoFim = Math.max(picoFim, Math.abs(lido.readIntLE(44 + (i * 2 + c) * 3, 3)));
const quedaFinal = { antes: rms(trilha, ...JAN_ANTES), depois: rms(trilha, ...JAN_DEPOIS) };
console.log(`\ntrilha → ${arqTrilha}  [${info(arqTrilha)}] ${dur(arqTrilha)} s (roteiro ${DUR} s)`);
console.log(`   antes do ganho ${m0.I.toFixed(1)} LUFS → ${mt.I.toFixed(1)} LUFS integrada · pico verdadeiro ${mt.TP.toFixed(1)} dBTP · LRA ${mt.LRA.toFixed(1)} LU`);
console.log(`sfx    → ${arqSfx}  [${info(arqSfx)}] ${dur(arqSfx)} s · ${ms.I.toFixed(1)} LUFS · pico verdadeiro ${ms.TP.toFixed(1)} dBTP`);
console.log(`a queda no gargalo (${DROP} s): arranjo ${quedaArranjo.antes.toFixed(1)} → ${quedaArranjo.depois.toFixed(1)} dBFS (${(quedaArranjo.depois - quedaArranjo.antes).toFixed(1)} dB; bateria ${quedaArranjo.bateriaAntes.toFixed(1)} → ${quedaArranjo.bateriaDepois.toFixed(1)}) · no arquivo ${quedaFinal.antes.toFixed(1)} → ${quedaFinal.depois.toFixed(1)} dBFS`);
console.log(`   janelas: antes ${JAN_ANTES.join('–')} s · depois ${JAN_DEPOIS.join('–')} s`);
console.log(`o fim ${(DUR - SILENCIO_FINAL).toFixed(1)}–${DUR} s: ${picoFim === 0 ? 'silêncio digital (todas as amostras = 0)' : `pico ${(20 * Math.log10(picoFim / 8388608)).toFixed(1)} dBFS`}`);
console.log(`efeitos (${usosSfx.length} disparos) copiados para assets/sfx: ${usados.join(', ')}`);
if (AUSENTES.size) console.warn(`⚠ marcos ausentes no roteiro (acentos omitidos): ${[...AUSENTES].join(', ')}`);
if (Math.abs(dur(arqTrilha) - DUR) > 1e-3 || Math.abs(dur(arqSfx) - DUR) > 1e-3) throw new Error('duração errada');
if (picoFim !== 0) throw new Error('o fim não está em silêncio digital');
if (mt.TP > TETO_TP || ms.TP > TETO_SFX) throw new Error('pico verdadeiro acima do teto');
if (quedaArranjo.depois > quedaArranjo.antes - 6) throw new Error('o gargalo não cai');
