// Monta o que o index.html não escreve à mão: os contornos dos 27 estados
// (@svg-maps/brazil) dentro de <g id="mapa-estados">. Idempotente.
import fs from 'node:fs';
const svg = fs.readFileSync(new URL('./node_modules/@svg-maps/brazil/brazil.svg', import.meta.url), 'utf8');
const paths = [...svg.matchAll(/<path[\s\S]*?id="([a-z]+)"[\s\S]*?d="([^"]+)"[\s\S]*?\/>/g)].map(([, id, d]) => `<path id="${id}" d="${d}"/>`);
const f = new URL('./index.html', import.meta.url);
const html = fs.readFileSync(f, 'utf8').replace(/<g id="mapa-estados">[\s\S]*?<\/g>/, `<g id="mapa-estados"><!-- mapa · montar.mjs -->${paths.join('')}</g>`);
fs.writeFileSync(f, html);
console.log('estados', paths.length);
