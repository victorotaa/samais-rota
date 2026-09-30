// Trilha do comercial ROTA (Samais Gestão em Saúde) — composta em código,
// determinística, na grade de 120 BPM (batida = 0,5 s).
//
// Adaptada do compositor do filme do SAMU CoPilot OS (mesmo motor de síntese,
// mesmo sidechain, mesma reverberação, loudness em duas passadas). A diferença:
// aqui a fonte de verdade é o roteiro.json — cenas, falas e marcos. Nenhum tempo de
// cena é digitado neste arquivo; se a montagem muda, a trilha acompanha.
//
// É NOSSA: nenhum sample de terceiro na música. Os únicos arquivos externos são os
// efeitos de corte (whoosh, impacto, clique, pop, brilho, riser), da biblioteca que
// acompanha a HyperFrames, sob a Pixabay Content License (uso comercial, sem
// atribuição) — ver assets/sfx/CREDITS.md. Eles saem numa PISTA SEPARADA
// (assets/audio/sfx.wav), para a composição equilibrar efeito e música à parte.
//
// Tom: ré maior (e a relativa si menor no vão). Confiança, calor, oportunidade —
// nunca emergência: sem sirene, sem monitor.
//   s1  piano solo + pad; o motivo de três notas repetidas ("SEG · QUA · SEX");
//       o coração de bumbo entra quando o vídeo entra.
//   s2–s3  o pulso: baixo no contratempo, arpejo em semicolcheias, sidechain.
//       D · A · Bm · G, depois Bm · G · D · A. Cada corte, uma pancada pequena.
//   s4  O VÃO: a música PARA seca no corte; silêncio digital até o impacto sob
//       "Mas não entregou quem opera."; depois pedal de si, relógio, a segunda
//       menor (fá♯ + sol) e a pancada escura no "suspenso".
//   s5  tensão subindo: Bm · G · Em · A, filtro abrindo, riser até o corte.
//   s6  a virada: groove cheio em ré maior, mais brilhante; um acento por cartão.
//   s7  o sistema: pulso limpo, arpejo com eco, cliques nos toques da tela.
//   s8  resolve: o motivo do s1 volta harmonizado, cresce sob "Tecnologia à frente
//       da saúde pública.", acorde final de ré na assinatura, e só o pad até o fim.
//
//   node trilha/compor.mjs → assets/audio/trilha.wav (48 kHz, estéreo, 24 bits,
//                            já abaixada sob cada fala, ~-20 LUFS, ≤ -1 dBTP)
//                            assets/audio/sfx.wav   (só os efeitos, ≤ -3 dBTP)
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
const TAU = 2 * Math.PI;
const ALVO_LUFS = -20, TETO_TP = -1, TETO_SFX = -3;

// ── Tempos: a mesma fonte de verdade do vídeo ──────────────────────────────
const CENA = Object.fromEntries(ROT.cenas.map((c) => [c.id, c]));
const T = (id, dt = 0) => CENA[id].t0 + dt;
const FIM = (id, dt = 0) => CENA[id].t1 + dt;
const MARCO = ROT.marcos;
for (const c of ROT.cenas) for (const t of [c.t0, c.t1])
  if (Math.abs(t / BATIDA - Math.round(t / BATIDA)) > 1e-6) console.warn(`⚠ ${c.id} tem corte fora da grade: ${t}s`);
if (Math.abs(FIM(ROT.cenas.at(-1).id) - DUR) > 1e-6) throw new Error('a última cena não termina em roteiro.duracao');
const [SIL0, SIL1] = MARCO.silencio;       // o vão: silêncio digital de verdade
const iSIL0 = Math.round(SIL0 * SR), iSIL1 = Math.round(SIL1 * SR);
// as falas: t e a duração da voz no andamento em que ela vai tocar
const FALAS = ROT.locucao.map((l) => {
  const d = ROT.duracao_voz_1x[l.id]; if (!(d > 0)) throw new Error(`sem duração para a fala ${l.id}`);
  return { id: l.id, t0: l.t, t1: l.t + d / ROT.andamento_voz };
});
const cenaDe = (t) => ROT.cenas.find((c) => t >= c.t0 && t < c.t1)?.id ?? ROT.cenas.at(-1).id;

// ── Utilitários ─────────────────────────────────────────────────────────────
let sem = 2463534242 >>> 0;
const ruido = () => { sem ^= sem << 13; sem >>>= 0; sem ^= sem >>> 17; sem ^= sem << 5; sem >>>= 0; return (sem / 4294967296) * 2 - 1; };
const pista = () => [new Float32Array(N), new Float32Array(N)];
// Janela de escrita: tudo o que nasce antes do vão só escreve até SIL0 — a cauda
// de nenhuma nota, reverberação ou eco atravessa o silêncio.
let J0 = 0, J1 = N;
const faixa = (t0, t1, fn) => { const a = [J0, J1]; J0 = Math.round(t0 * SR); J1 = Math.min(N, Math.round(t1 * SR)); fn(); [J0, J1] = a; };
const soma = (p, i, l, r) => { if (i >= J0 && i < J1) { p[0][i] += l; p[1][i] += r; } };
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

// ── Instrumentos (os do compositor do SAMU CoPilot OS) ──────────────────────
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
// o coração: bumbo macio, filtrado, em duas batidas (tum-tum) — a segunda na semicolcheia
function coracao(t, amp = 1) {
  const bate = (t0, a, f0) => {
    const i0 = Math.round(t0 * SR), len = Math.round(0.4 * SR), lp = new SVF(); lp.set(150, 0.7); let fase = 0;
    for (let n = 0; n < len; n++) {
      const u = n / SR, f = f0 * (0.6 + 0.4 * Math.exp(-u / 0.05)); fase += f / SR;
      const env = Math.min(1, u / 0.005) * Math.exp(-u / 0.085);
      const x = lp.proc(Math.sin(TAU * fase) * env) * 1.6;
      soma(P.bateria, i0 + n, x * a * amp, x * a * amp);
    }
  };
  bate(t, 1, 68); bate(t + BATIDA / 2, 0.5, 78);
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
    const cresce = o.cresce ? db(o.cresce * (1 - Math.min(1, u / (t1 - t0)))) : 1;   // crescendo: começa o.cresce dB abaixo
    const env = Math.min(1, u / at) * (u < t1 - t0 ? 1 : Math.max(0, 1 - (u - (t1 - t0)) / so)) * cresce;
    const xl = fl.proc(l) * env * amp * norm, xr = fr.proc(r) * env * amp * norm;
    soma(o.pista || P.pad, i0 + n, xl, xr); soma(P.rev, i0 + n, xl * (o.rev ?? 0.25), xr * (o.rev ?? 0.25));
  }
}
function pluck(t, m, amp = 1) {
  const i0 = Math.round(t * SR), len = Math.round(0.55 * SR), f = hz(m), lp = new SVF(); let a = 0, b = 0.37;
  for (let n = 0; n < len; n++) {
    const u = n / SR; a = (a + f / SR) % 1; b = (b + f * 1.005 / SR) % 1;
    if (n % 16 === 0) lp.set(420 + 4800 * Math.exp(-u / 0.055), 1.15);
    const env = Math.min(1, u / 0.002) * Math.exp(-u / 0.17);
    const x = lp.proc(0.5 * serra(a, f / SR) + 0.5 * serra(b, f * 1.005 / SR)) * env * amp;
    soma(P.arpejo, i0 + n, x, x); soma(P.eco, i0 + n, x * 0.5, x * 0.5); soma(P.rev, i0 + n, x * 0.18, x * 0.18);
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
// pedal grave (o vão): seno na tônica, serra filtrada uma oitava acima, respirando devagar
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
// o relógio: tique curto (tic mais agudo, tac mais grave)
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

// ── Efeitos da biblioteca (Pixabay Content License) → stem separado ────────
const ORIGEM_SFX = resolve(RAIZ, 'node_modules/hyperframes/dist/skills/media-use/audio/assets/sfx');
const DESTINO_SFX = resolve(RAIZ, 'assets/sfx');
mkdirSync(DESTINO_SFX, { recursive: true });
const cacheSfx = {};
// Onde fica o GOLPE dentro de cada arquivo (medido: 30% do pico do envelope, ou o
// ápice nos whooshes). sfx(nome, t) põe esse ponto exatamente em t.
const GOLPE = { 'whoosh-cinematic': 2.54, 'whoosh': 0.16, 'whoosh-short': 0.16, 'impact-bass-1': 0.04, 'impact-bass-2': 0.02, 'click-soft': 0.05,
  'riser': 4.0, 'pop': 0.115, 'sparkle': 0.02, 'click': 0.05, 'ping': 0.32, 'chime': 0.41 };
// os impactos da biblioteca são estrondos de ~2 s a 0 dB RMS: a cauda sai antes
const CAUDA = { 'impact-bass-1': 1.4, 'impact-bass-2': 1.4 };
function sfx(nome, alvo, amp = 1, o = {}) {
  const golpe = GOLPE[nome] ?? 0, t = alvo - golpe, cauda = o.cauda ?? CAUDA[nome];
  if (!cacheSfx[nome]) {
    copyFileSync(resolve(ORIGEM_SFX, nome + '.mp3'), resolve(DESTINO_SFX, nome + '.mp3'));
    const raw = execFileSync(FFMPEG, ['-v', 'error', '-i', resolve(DESTINO_SFX, nome + '.mp3'), '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 });
    cacheSfx[nome] = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
  }
  const s = cacheSfx[nome], i0 = Math.round(t * SR);
  let fim = s.length / 2;
  if (cauda) fim = Math.min(fim, Math.round((golpe + cauda) * SR));
  if (o.ate) fim = Math.min(fim, Math.round((o.ate - t) * SR));   // corte seco num instante (o riser no corte)
  const fade = Math.round((o.ate ? 0.02 : 0.3) * SR);
  for (let n = 0; n < fim; n++) {
    const g = (cauda || o.ate) ? Math.min(1, (fim - n) / fade) : 1;
    soma(S, i0 + n, s[2 * n] * amp * g, s[2 * n + 1] * amp * g);
  }
}

// ── Harmonia: ré maior ──────────────────────────────────────────────────────
const AC = {
  D:  { baixo: 38, pad: [62, 66, 69], arp: [74, 78, 81, 86], pno: [50, 57, 62, 66] },
  A:  { baixo: 33, pad: [61, 64, 69], arp: [73, 76, 81, 85], pno: [45, 52, 57, 61] },
  Bm: { baixo: 35, pad: [62, 66, 71], arp: [74, 78, 83, 86], pno: [47, 54, 59, 62] },
  G:  { baixo: 31, pad: [62, 67, 71], arp: [74, 79, 83, 86], pno: [43, 50, 55, 59] },
  Em: { baixo: 40, pad: [64, 67, 71], arp: [76, 79, 83, 88], pno: [40, 47, 52, 55] },
  DF: { baixo: 42, pad: [62, 66, 69], arp: [74, 78, 81, 86], pno: [42, 50, 57, 62] },   // D/F♯
};
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];

// groove genérico: uma seção que recomeça o compasso no próprio corte
function groove(t0, t1, prog, o) {
  const nb = Math.round((t1 - t0) / BATIDA);
  for (let k = 0; k < nb; k++) {
    const tb = t0 + k * BATIDA, b = k % 4, bar = Math.floor(k / 4);
    if (o.bumbo !== null) bumbo(tb, db(o.bumbo));
    if (o.palma !== undefined && bar >= (o.palmaDesde ?? 0) && (b === 1 || b === 3)) palma(tb, db(o.palma));
    chimbal(tb + BATIDA / 2, db(o.chimbal), !!o.aberto);
    if (o.semi !== undefined && bar >= (o.semiDesde ?? 0)) { chimbal(tb + BATIDA / 4, db(o.semi)); chimbal(tb + 3 * BATIDA / 4, db(o.semi)); }
  }
  for (let c = 0; t0 + c * 4 * BATIDA < t1 - 1e-6; c++) {
    const a = t0 + c * 4 * BATIDA, b = Math.min(a + 4 * BATIDA, t1), ac = AC[prog[c % prog.length]];
    const cresce = o.cresce ? (a - t0) / (t1 - t0) : 0;                // 0 → 1 ao longo da seção
    for (let k = 0; a + k * BATIDA / 2 < b - 1e-6; k++) {               // baixo em colcheias
      const t = a + k * BATIDA / 2;
      if (k % 2 === 1 || o.baixoCheio) baixo(t, 0.2, ac.baixo + (k === 7 && o.oitava ? 12 : 0), db(o.baixo + (k % 2 === 0 ? -2 : 0)));
    }
    pad(a, b, ac.pad, db(o.pad + 2 * cresce), { ataque: 0.08, soltura: 0.35, corte: o.corte * (1 + 0.6 * cresce), rev: 0.22 });
    if (o.arp !== undefined) for (let k = 0; a + k * BATIDA / 4 < b - 1e-6; k++) {
      if (o.arpColcheia && k % 2 === 1) continue;
      const t = a + k * BATIDA / 4, sobe = o.arpOitava && k >= 8 ? 12 : 0;
      pluck(t, ac.arp[ARP[k % 8]] + sobe, db(o.arp + 1.5 * cresce + (k % 4 === 0 ? 2 : 0)));
    }
  }
}

// ════════════════════════════════════════════════════════════════════════
//  ANTES DO VÃO (s1–s3): tudo aqui escreve só até SIL0
// ════════════════════════════════════════════════════════════════════════
faixa(0, SIL0, () => {
  // ── s1 · Abertura: piano solo + pad, o motivo "SEG · QUA · SEX" ──────────
  const s1 = T('s1'), s2 = T('s2');
  const c1 = [['D', 0, 4], ['Bm', 4, 6], ['G', 6, 8], ['A', 8, s2 - s1]];
  for (const [ac, a, b] of c1) {
    const A = AC[ac];
    pad(s1 + a, s1 + b, A.pno, db(-17), { ataque: a === 0 ? 2.5 : 0.5, soltura: 0.6, corte: 1000 + 60 * a, rev: 0.4 });
    for (let k = 0; a + k * BATIDA < b - 1e-6; k++)                    // mão esquerda: semínimas quebradas
      piano(s1 + a + k * BATIDA, A.pno[[0, 1, 2, 1][k % 4]], db(k % 4 === 0 ? -14 : -17), 1.6);
  }
  // mão direita: três notas repetidas, como os três dias da semana
  for (const [t, m, a, d] of [[1.5, 69, -10, 0.6], [2.0, 69, -11, 0.6], [2.5, 69, -11.5, 0.6], [3.0, 66, -11, 2.4],
    [5.5, 71, -10.5, 0.6], [6.0, 71, -11, 0.6], [6.5, 71, -11.5, 0.6], [7.0, 69, -11, 1.9], [8.5, 73, -13, 0.8]]) piano(s1 + t, m, db(a + 2), d, 1.3);
  // o coração entra com o vídeo, a 60 bpm, ganhando corpo até o corte
  for (let t = 4; t < s2 - s1 - 1e-6; t += 2 * BATIDA) coracao(s1 + t, db(-16 + 1.2 * (t - 4)));
  subida(s2 - 1.0, s2, db(-20));

  // ── s2 · O programa existe: o pulso entra (D · A · Bm · G) ────────────────
  const s3 = T('s3');
  prato(s2, db(-14)); impacto(s2, db(-15));
  groove(s2, s3, ['D', 'A', 'Bm', 'G'], { bumbo: -8, palma: -13, palmaDesde: 2, chimbal: -20, semi: -30, semiDesde: 2,
    baixo: -6, pad: -13, corte: 1700, arp: -13.5, cresce: true });
  sfx('whoosh', s2, db(-12));

  // ── s3 · O repasse é contínuo: mais cheio (Bm · G · D · A · A) ────────────
  prato(s3, db(-12)); tambor(s3, db(-11), 90);
  groove(s3, SIL0, ['Bm', 'G', 'D', 'A', 'A'], { bumbo: -6, palma: -11, chimbal: -17, semi: -26, baixo: -5, oitava: true,
    pad: -11.5, corte: 2300, arp: -11.5, arpOitava: true, cresce: true });
  sfx('whoosh', s3, db(-12));
  // a virada até o vão: quatro tons subindo e a subida — e aí, nada
  for (let k = 0; k < 4; k++) tambor(SIL0 - 1 + k * BATIDA / 2, db(-14 + 1.5 * k), 80 + 15 * k);
  subida(SIL0 - 2, SIL0, db(-15));
});

// ════════════════════════════════════════════════════════════════════════
//  DEPOIS DO VÃO (s4–s8): nada escreve antes de SIL1
// ════════════════════════════════════════════════════════════════════════
faixa(SIL1, DUR, () => {
  // ── s4 · O vão: impacto sob a fala, pedal de si, relógio, a segunda menor ──
  const s5 = T('s5'), SUSP = MARCO.suspenso;
  impacto(MARCO.impacto_vao, db(-5)); acordePiano(MARCO.impacto_vao, [23, 35], db(-8), 4.5, 2.2);
  sfx('impact-bass-1', MARCO.impacto_vao, db(-13), { cauda: 1.6 });
  pedal(MARCO.impacto_vao, s5 + 0.4, 35, db(-15));                          // si grave
  pad(MARCO.impacto_vao + 1, s5, [47, 54], db(-19), { ataque: 2.5, soltura: 0.4, corte: 700, rev: 0.4 });
  pad(MARCO.impacto_vao + 1, s5, [66, 67], db(-21), { ataque: 3.0, soltura: 0.4, corte: 1200, abre: 1.6, rev: 0.45 });   // fá♯ + sol: a segunda
  for (let k = 1; MARCO.impacto_vao + k * BATIDA < s5 - 1e-6; k++)        // o relógio: tic-tac na batida
    tique(MARCO.impacto_vao + k * BATIDA, db(k % 2 ? -26 : -24), k % 2 ? 1900 : 2500);
  // "suspenso": a pancada mais escura — si + dó no grave, o tambor e o estrondo
  impacto(SUSP, db(-7)); acordePiano(SUSP, [35, 36, 47], db(-9), 2.6, 1.6); tambor(SUSP, db(-11), 55);
  sfx('impact-bass-2', SUSP, db(-19), { cauda: 1.0 });

  // ── s5 · Poucos operadores: a tensão sobe (Bm · G · Em · A) até o corte ────
  const s6 = T('s6');
  const c5 = ['Bm', 'G', 'Em', 'A'];
  for (let c = 0; s5 + c * 4 * BATIDA < s6 - 1e-6; c++) {
    const a = s5 + c * 4 * BATIDA, b = Math.min(a + 4 * BATIDA, s6), A = AC[c5[c % 4]], p = (a - s5) / (s6 - s5);
    pad(a, b, A.pad, db(-16 + 4 * p), { ataque: 0.3, soltura: 0.1, corte: 900 * Math.pow(3.2, p), abre: 1.3, rev: 0.3 });
    for (let k = 0; a + k * BATIDA / 2 < b - 1e-6; k++) {                   // baixo pulsando em colcheias, crescendo
      const t = a + k * BATIDA / 2; baixo(t, 0.18, A.baixo, db(-15 + 9 * (t - s5) / (s6 - s5)));
    }
    if (c >= 1) for (let k = 0; a + k * BATIDA / 4 < b - 1e-6; k++) {        // arpejo: colcheias, depois semicolcheias
      if (c === 1 && k % 2 === 1) continue;
      const t = a + k * BATIDA / 4; pluck(t, A.arp[ARP[k % 8]], db(-16 + 5 * (t - s5) / (s6 - s5) + (k % 4 === 0 ? 2 : 0)));
    }
  }
  for (let k = 0; s5 + k * BATIDA < s6 - 1e-6; k++) {
    const t = s5 + k * BATIDA, meio = t < s5 + 8 * BATIDA;
    if (!meio || k % 2 === 0) bumbo(t, db(meio ? -11 : -8));
    tique(t, db(-27 + 4 * (t - s5) / (s6 - s5)), k % 2 ? 1900 : 2500); tique(t + BATIDA / 2, db(-31 + 4 * (t - s5) / (s6 - s5)), 2200);
    if (t >= s6 - 2 * BATIDA) bumbo(t + BATIDA / 2, db(-9));
  }
  for (let k = 0; k < 8; k++) palma(s6 - 1 + k * BATIDA / 4, db(-22 + 1.6 * k));   // rufar
  subida(s6 - 3, s6, db(-12));
  sfx('riser', s6, db(-13), { ate: s6 });

  // ── s6 · A Samais: a virada — groove cheio, ré maior, mais brilho ──────────
  const s7 = T('s7');
  impacto(s6, db(-6)); prato(s6, db(-8));
  sfx('impact-bass-1', s6, db(-15), { cauda: 1.0 });
  groove(s6, s7, ['D', 'A', 'Bm', 'G'], { bumbo: -5, palma: -9, chimbal: -15, aberto: true, semi: -24, baixo: -4, baixoCheio: true, oitava: true,
    pad: -10, corte: 3400, arp: -9.5, arpOitava: true });
  brilho(s6 + 0.2, s7 - s6 - 0.2, [86, 90, 93], db(-27));
  for (const nome of ['samu', 'transferencia', 'regulacao']) {           // um acento por cartão
    const t = MARCO[nome];
    tambor(t, db(-11), 100);
    sfx('whoosh-short', t, db(-13)); sfx('impact-bass-1', t, db(-21), { cauda: 0.6 });
  }
  sfx('sparkle', MARCO.atestados, db(-12)); sfx('ping', MARCO.atestados, db(-18));
  brilho(MARCO.atestados, 2.4, [90, 93, 98], db(-24));

  // ── s7 · O sistema: pulso limpo e tecnológico (D · Bm · G · A) ─────────────
  const s8 = T('s8');
  prato(s7, db(-11));
  sfx('whoosh', s7, db(-12));
  groove(s7, s8 - BATIDA, ['D', 'Bm', 'G', 'A'], { bumbo: -6, palma: -13, chimbal: -18, semi: -22, baixo: -5, baixoCheio: true,
    pad: -13.5, corte: 2000, arp: -10, arpOitava: true });
  // o último tempo respira: sem bumbo, só pad, um arpejo descendo e a subida curta
  pad(s8 - BATIDA, s8, AC.A.pad, db(-14), { ataque: 0.02, soltura: 0.4, corte: 1600, rev: 0.4 });
  for (let k = 0; k < 4; k++) pluck(s8 - BATIDA + k * BATIDA / 4, AC.A.arp[3 - k], db(-13));
  subida(s8 - 1, s8, db(-19));
  sfx('whoosh-short', MARCO.app_entra, db(-15)); sfx('pop', MARCO.app_entra + 0.1, db(-17));
  for (const t of MARCO.cliques) { sfx('click', t, db(-10)); sfx('pop', t + 0.12, db(-19)); }
  { const t = MARCO.comprovacao_em_dia;                                 // a comprovação em dia: o destaque
    sfx('ping', t, db(-14)); sfx('sparkle', t, db(-15)); sfx('chime', t + 0.1, db(-17));
    prato(t, db(-15)); brilho(t, 2.6, [86, 90, 93, 98], db(-23)); }

  // ── s8 · Fecho: o motivo volta harmonizado; acorde final na assinatura ─────
  const ASS = MARCO.assinatura;
  sfx('whoosh-short', s8, db(-16));
  const c8 = [['G', 0, 4], ['DF', 4, 8], ['Em', 8, 12], ['A', 12, (ASS - s8) / BATIDA]];   // em batidas desde s8
  for (const [ac, a, b] of c8) {
    const A = AC[ac], ta = s8 + a * BATIDA, tb = s8 + b * BATIDA, swell = ac === 'Em' || ac === 'A';
    pad(ta, tb, A.pad.concat(A.baixo + 24), db(swell ? -13 : -16), { ataque: swell ? 0.6 : 0.4, soltura: 0.3, corte: swell ? 1500 : 1200,
      abre: swell ? 1.8 : 0, cresce: swell ? 5 : 0, rev: 0.4 });
    baixo(ta, tb - ta - 0.05, A.baixo, db(swell ? -11 : -14));
    for (let k = 0; ta + k * BATIDA < tb - 1e-6; k++) piano(ta + k * BATIDA, A.pno[[0, 1, 2, 1][k % 4]], db(k % 4 === 0 ? -15 : -18), 1.6);
  }
  // o motivo do s1, agora em terças e sextas
  for (const [b, notas, a, d] of [[3, [66, 69], -10, 0.6], [4, [62, 69], -10.5, 0.6], [5, [62, 69], -11, 0.6], [6, [62, 66], -10.5, 2.4],
    [11, [67, 71], -10, 0.6], [12, [64, 71], -10.5, 0.6], [13, [64, 71], -11, 0.6], [14, [61, 64, 69], -10, 1.9]])
    acordePiano(s8 + b * BATIDA, notas, db(a), d, 1.3);
  for (let t = s8 + 4 * BATIDA; t < ASS - 1e-6; t += 2 * BATIDA) coracao(t, db(-17 + 0.8 * (t - s8 - 2)));   // o coração volta
  subida(ASS - 1.5, ASS, db(-16));
  // a assinatura: ré maior, largo, ressoando — e depois só o pad, apagando
  impacto(ASS, db(-10)); prato(ASS, db(-13)); bumbo(ASS, db(-7), false);
  acordePiano(ASS, [38, 45, 50, 57, 62, 66, 69, 74], db(-12), DUR - ASS - 0.5, 3.2);
  baixo(ASS, 3.5, 26, db(-12));
  pad(ASS, DUR - 2.2, [50, 57, 62, 66, 69], db(-13), { ataque: 0.05, soltura: 2.0, corte: 2600, rev: 0.5 });
  brilho(ASS + 0.4, DUR - ASS - 2.5, [86, 90, 93], db(-26));
  sfx('sparkle', ASS, db(-13)); sfx('impact-bass-1', ASS, db(-19), { cauda: 1.2 });
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
// reverberação (Freeverb) e eco pingue-pongue; o estado é ZERADO no vão, para a
// cauda do que tocou antes não voltar por baixo da fala
function freeverb(inp, sala = 0.86, amort = 0.24) {
  const esc = SR / 44100, combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225], out = pista();
  for (let c = 0; c < 2; c++) {
    const off = c ? 23 : 0, x = inp[c], y = out[c];
    const cb = combs.map((d) => ({ b: new Float32Array(Math.round((d + off) * esc)), i: 0, f: 0 }));
    const ap = aps.map((d) => ({ b: new Float32Array(Math.round((d + off) * esc)), i: 0 }));
    for (let n = 0; n < N; n++) {
      if (n === iSIL0) { for (const k of cb) { k.b.fill(0); k.f = 0; } for (const a of ap) a.b.fill(0); }
      const e = x[n] * 0.015; let acc = 0;
      for (const k of cb) { const o = k.b[k.i]; k.f = o * (1 - amort) + k.f * amort; k.b[k.i] = e + k.f * sala; if (++k.i >= k.b.length) k.i = 0; acc += o; }
      for (const a of ap) { const bo = a.b[a.i], o = -acc + bo; a.b[a.i] = acc + bo * 0.5; if (++a.i >= a.b.length) a.i = 0; acc = o; }
      y[n] = acc;
    }
  }
  return out;
}
function pinguePongue(inp, tempo = 0.375, fb = 0.36) {
  const d = Math.round(tempo * SR), out = pista(), bl = new Float32Array(d), br = new Float32Array(d); let i = 0, fl = 0, fr = 0;
  for (let n = 0; n < N; n++) {
    if (n === iSIL0) { bl.fill(0); br.fill(0); fl = 0; fr = 0; }
    const dl = bl[i], dr = br[i]; out[0][n] = dl; out[1][n] = dr;
    fl = fl * 0.35 + dr * 0.65; fr = fr * 0.35 + dl * 0.65;
    bl[i] = (inp[0][n] + inp[1][n]) * 0.5 + fl * fb; br[i] = fr * fb;
    if (++i >= d) i = 0;
  }
  return out;
}
const REV = freeverb(P.rev), ECO = pinguePongue(P.eco);
let L = new Float32Array(N), R = new Float32Array(N);
for (let n = 0; n < N; n++) {
  const r = respira[n];
  for (let c = 0; c < 2; c++) {
    const x = P.bateria[c][n] + P.baixo[c][n] * r + P.pad[c][n] * (0.45 + 0.55 * r) + P.arpejo[c][n] * (0.7 + 0.3 * r)
      + P.piano[c][n] + P.fx[c][n] + REV[c][n] * 5 + ECO[c][n] * 0.9;
    (c ? R : L)[n] = Math.tanh(x * 0.9) / 0.9;                          // "cola" suave no barramento
  }
}
// O VÃO: a música para seca em SIL0 (6 ms de rampa, só para não estalar) e fica em
// zero digital até SIL1. O fim: o pad apaga até o último quadro.
{
  const r0 = Math.round((SIL0 - 0.006) * SR);
  for (let n = r0; n < iSIL0; n++) { const g = 0.5 + 0.5 * Math.cos(Math.PI * (n - r0) / (iSIL0 - r0)); L[n] *= g; R[n] *= g; }
  for (let n = iSIL0; n < iSIL1; n++) { L[n] = 0; R[n] = 0; }
  const f0 = Math.round((DUR - 3.2) * SR), f1 = N - Math.round(0.05 * SR);
  for (let n = f0; n < N; n++) { const g = n >= f1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (n - f0) / (f1 - f0)); L[n] *= g; R[n] *= g; }
}

// ── Abaixar sob a voz: 9–12 dB por fala, ataque 0,15 s, soltura 0,35 s ────────
// Seção cheia (groove) abaixa 12 dB; seção rala (piano, vão, fecho) 9; a subida 10,5.
const FUNDO = { s1: 9, s2: 12, s3: 12, s4: 9, s5: 10.5, s6: 12, s7: 12, s8: 9 };
const ATQ = 0.15, SOLT = 0.35;
const duck = new Float32Array(N).fill(1);
console.log('abaixamento sob a locução (ataque 0,15 s · soltura 0,35 s)');
for (const f of FALAS) {
  const prof = FUNDO[cenaDe((f.t0 + f.t1) / 2)] ?? 10.5, alvo = db(-prof);
  const a0 = f.t0 - ATQ, r1 = f.t1 + SOLT;
  for (let n = Math.max(0, Math.round(a0 * SR)); n < Math.min(N, Math.round(r1 * SR)); n++) {
    const t = n / SR;
    const v = t < f.t0 ? 1 + (alvo - 1) * suave((t - a0) / ATQ) : t <= f.t1 ? alvo : alvo + (1 - alvo) * suave((t - f.t1) / SOLT);
    duck[n] = Math.min(duck[n], v);
  }
  console.log(`  ${f.id.padEnd(5)} ${f.t0.toFixed(2).padStart(6)}–${f.t1.toFixed(2).padEnd(6)} ${cenaDe((f.t0 + f.t1) / 2)}  −${prof} dB`);
}
for (let n = 0; n < N; n++) { L[n] *= duck[n]; R[n] *= duck[n]; }

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
  return { I: +js.input_i, TP: +js.input_tp };
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
const m0 = medir(wav24([L, R]));
let gDb = ALVO_LUFS - m0.I, teto = -1.6, trilha, mt;
for (let it = 0; it < 5; it++) {
  trilha = ganhoLimitado([L, R], db(gDb), db(teto));
  mt = medir(wav24(trilha));
  console.log(`  passada ${it + 1}: ganho ${gDb.toFixed(2)} dB, teto ${teto.toFixed(2)} dBFS → ${mt.I.toFixed(2)} LUFS, ${mt.TP.toFixed(2)} dBTP`);
  if (Math.abs(mt.I - ALVO_LUFS) <= 0.2 && mt.TP <= TETO_TP - 0.05) break;
  gDb += ALVO_LUFS - mt.I;
  if (mt.TP > TETO_TP - 0.05) teto -= mt.TP - (TETO_TP - 0.15);
}
for (let n = iSIL0; n < iSIL1; n++) { trilha[0][n] = 0; trilha[1][n] = 0; }   // garantia: zero digital no vão

// o stem de efeitos: o mesmo ganho que a música levou (o equilíbrio desenhado aqui
// continua valendo), e então o teto de -3 dBTP
let sfxOut = [S[0], S[1]].map((c) => { const o = new Float32Array(N); const g = db(gDb); for (let n = 0; n < N; n++) o[n] = c[n] * g; return o; });
let ms = medir(wav24(sfxOut));
for (let it = 0; it < 4 && ms.TP > TETO_SFX - 0.3; it++) {
  const g = db(TETO_SFX - 0.5 - ms.TP); for (const c of sfxOut) for (let n = 0; n < N; n++) c[n] *= g;
  ms = medir(wav24(sfxOut));
}

// ── Saídas ──────────────────────────────────────────────────────────────────
mkdirSync(resolve(RAIZ, 'assets/audio'), { recursive: true });
const arqTrilha = resolve(RAIZ, 'assets/audio/trilha.wav'), arqSfx = resolve(RAIZ, 'assets/audio/sfx.wav');
writeFileSync(arqTrilha, wav24(trilha)); writeFileSync(arqSfx, wav24(sfxOut));
const usados = Object.keys(cacheSfx).sort();
writeFileSync(resolve(DESTINO_SFX, 'CREDITS.md'), `# Efeitos sonoros (SFX) — créditos

Os efeitos de corte do comercial ROTA vêm da biblioteca que acompanha a HyperFrames
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
const rms = (p, a, b) => { let s = 0, k = 0; for (let n = Math.round(a * SR); n < Math.min(N, Math.round(b * SR)); n++) { s += p[0][n] ** 2 + p[1][n] ** 2; k += 2; } return k ? 10 * Math.log10(s / k + 1e-12) : -120; };
const f1 = (x) => (x < -99 ? '   —' : x.toFixed(1).padStart(6));
console.log('\nRMS por cena (dBFS). Pistas antes da mixagem; trilha/sfx como saem nos arquivos');
console.log('cena        ' + ['bateria', 'baixo', 'pad', 'arpejo', 'piano', 'fx'].map((s) => s.padStart(8)).join('') + '   trilha     sfx');
for (const c of ROT.cenas) {
  const cols = ['bateria', 'baixo', 'pad', 'arpejo', 'piano', 'fx'].map((k) => f1(rms(P[k], c.t0, c.t1)).padStart(8)).join('');
  console.log(`${c.id} ${c.t0.toFixed(1).padStart(4)}–${c.t1.toFixed(1).padEnd(5)}${cols}  ${f1(rms(trilha, c.t0, c.t1))}  ${f1(rms(sfxOut, c.t0, c.t1))}`);
}
const dur = (arq) => +execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=duration,sample_rate,channels', '-of', 'csv=p=0', arq], { encoding: 'utf8' }).trim().split(',').at(-1);
const info = (arq) => execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=sample_rate,channels,duration', '-of', 'csv=p=0', arq], { encoding: 'utf8' }).trim();
// o vão, relido do arquivo gravado
const lido = readFileSync(arqTrilha); let picoVao = 0, somaVao = 0;
for (let i = iSIL0; i < iSIL1; i++) for (let c = 0; c < 2; c++) { const v = lido.readIntLE(44 + (i * 2 + c) * 3, 3); picoVao = Math.max(picoVao, Math.abs(v)); somaVao += (v / 8388608) ** 2; }
const rmsVao = 10 * Math.log10(somaVao / (2 * (iSIL1 - iSIL0)) + 1e-30);
console.log(`\ntrilha → ${arqTrilha}  [${info(arqTrilha)}] (${dur(arqTrilha)} s; roteiro ${DUR} s)`);
console.log(`   antes do ganho ${m0.I.toFixed(1)} LUFS → ${mt.I.toFixed(1)} LUFS integrada · pico verdadeiro ${mt.TP.toFixed(1)} dBTP`);
console.log(`sfx    → ${arqSfx}  [${info(arqSfx)}] (${dur(arqSfx)} s) · ${ms.I.toFixed(1)} LUFS · pico verdadeiro ${ms.TP.toFixed(1)} dBTP`);
console.log(`o vão ${SIL0}–${SIL1} s: ${picoVao === 0 ? 'silêncio digital (todas as amostras = 0)' : `pico ${(20 * Math.log10(picoVao / 8388608)).toFixed(1)} dBFS, RMS ${rmsVao.toFixed(1)} dBFS`}`);
console.log(`efeitos copiados para assets/sfx: ${usados.join(', ')}`);
if (Math.abs(dur(arqTrilha) - DUR) > 1e-3 || Math.abs(dur(arqSfx) - DUR) > 1e-3) throw new Error('duração errada');
if (picoVao !== 0 && rmsVao > -70) throw new Error('o vão não está em silêncio');
if (mt.TP > TETO_TP || ms.TP > TETO_SFX) throw new Error('pico verdadeiro acima do teto');
