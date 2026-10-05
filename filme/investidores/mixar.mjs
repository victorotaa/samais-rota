// Mixagem final do filme: o vídeo do render, copiado sem reencode, com o áudio
// somado a partir dos stems ATUAIS — exatamente como o HyperFrames soma (amix sem
// normalização, dropout_transition=0), com os tempos, durações e volumes dos
// <audio> do index.html. Depois, loudness em duas passadas (−16 LUFS, TP −1,5),
// como o render-sandbox.sh da v4.
//
//   node mixar.mjs renders/bruto.mp4 renders/rota-investidores.mp4
//
// Por que existe: a trilha é composta em código (trilha/compor.mjs) e pode mudar
// depois do render. A imagem não depende do áudio, então refazer a mixagem não
// pede refazer os 6.780 quadros.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const [entrada, saida] = process.argv.slice(2);
if (!entrada || !saida) { console.error('uso: node mixar.mjs <render.mp4> <saida.mp4>'); process.exit(2); }
const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const DUR = +html.match(/id="main"[^>]*data-duration="([\d.]+)"/)[1];
const atr = (tag, nome) => tag.match(new RegExp(`${nome}="([^"]*)"`))?.[1];
const faixas = [...html.matchAll(/<audio\b[^>]*>/g)].map(([tag]) => ({
  id: atr(tag, 'id'), src: atr(tag, 'src'),
  t0: +atr(tag, 'data-start'), d: +atr(tag, 'data-duration'), vol: +(atr(tag, 'data-volume') ?? 1),
}));
for (const f of faixas) if (!fs.existsSync(f.src)) throw new Error(`faixa ausente: ${f.src}`);

const entradas = ['-hide_banner', '-y', '-i', entrada, ...faixas.flatMap((f) => ['-i', f.src])];
const ramos = faixas.map((f, i) => {
  const ms = Math.round(f.t0 * 1000);
  return `[${i + 1}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,atrim=0:${f.d},asetpts=PTS-STARTPTS,adelay=${ms}|${ms},apad,atrim=0:${DUR},volume=${f.vol}[a${i}]`;
});
// soma exata: toda faixa dura o filme inteiro (apad sem fim, cortado em DUR), então o amix divide sempre pelo
// mesmo N e o volume=N desfaz a divisão. (O ffmpeg do @ffmpeg-installer é de 2018 e
// não tem o normalize=0 do amix — este é o mesmo caminho de reserva do HyperFrames.)
const soma = `${ramos.join(';')};${faixas.map((_, i) => `[a${i}]`).join('')}amix=inputs=${faixas.length}:duration=longest:dropout_transition=0,volume=${faixas.length}`;
const ffmpeg = (extra) => {
  const r = spawnSync('ffmpeg', [...entradas, ...extra], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(r.stderr.slice(-2000));
  return r.stderr;
};

// passada 1: medir
const log = ffmpeg(['-filter_complex', `${soma},loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json[m]`, '-map', '[m]', '-f', 'null', '-']);
const m = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));
console.log(`soma medida: I ${m.input_i} LUFS · TP ${m.input_tp} dBTP · LRA ${m.input_lra} LU`);

// passada 2: aplicar (linear) e montar com o vídeo copiado
const ln = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
ffmpeg(['-filter_complex', `${soma},${ln},aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo[mix]`, '-map', '0:v:0', '-map', '[mix]',
  '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-t', String(DUR), saida]);
console.log(`faixas: ${faixas.map((f) => `${f.id}${f.vol !== 1 ? ` ×${f.vol}` : ''}`).join(' · ')}`);
console.log(`→ ${saida}`);
