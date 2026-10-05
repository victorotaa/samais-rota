// Baixa o que não mora no git: B-roll (broll.json) e locução (voz.json), e
// entrega a locução em WAV no andamento de roteiro.json. Precisa do CDN do
// Higgsfield (d8j0ntlcm91z4.cloudfront.net) e de ffmpeg no PATH.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const ler = (f) => JSON.parse(fs.readFileSync(new URL(f, import.meta.url)));
const broll = ler('./broll.json'), voz = ler('./voz.json'), rot = ler('./roteiro.json');
fs.mkdirSync('assets/broll', { recursive: true }); fs.mkdirSync('assets/voz/orig', { recursive: true });
const baixar = async (url, destino) => {
  const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`);
  fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
};
const jobs = [];
for (const [nome, b] of Object.entries(broll)) if (b.url) jobs.push(baixar(b.url, `assets/broll/${nome}.mp4`));
for (const [id, arq] of Object.entries(voz)) if (/^i\d/.test(id)) jobs.push(baixar(voz.base + arq, `assets/voz/orig/${id}.mp3`));
await Promise.all(jobs);
for (const l of rot.locucao) {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', `assets/voz/orig/${l.id}.mp3`, '-af', `atempo=${rot.andamento_voz}`, '-ar', '48000', '-ac', '2', `assets/voz/${l.id}.wav`]);
}
console.log('broll', Object.keys(broll).length - 1, '· voz', rot.locucao.length);
