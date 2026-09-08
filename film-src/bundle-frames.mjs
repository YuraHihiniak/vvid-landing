#!/usr/bin/env node
// Склеивает кадры в бинарные бандлы + манифест с оффсетами (один fetch на бандл, байтовый прогресс).
// node bundle-frames.mjs <src-dir(webp|jpg)> <out-dir> [perBundle=30]
import fs from 'node:fs'; import path from 'node:path';
const [src, out, per = 30] = process.argv.slice(2);
if (!src || !out) { console.error('usage: node bundle-frames.mjs <src> <out> [perBundle]'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const files = fs.readdirSync(src).filter(f => /\.(webp|jpe?g)$/i.test(f)).sort();
if (!files.length) { console.error('no frames in', src); process.exit(1); }
const type = /\.webp$/i.test(files[0]) ? 'image/webp' : 'image/jpeg';
const manifest = { type, frames: files.length, bundles: [] };
const perBundle = +per;
for (let b = 0; b * perBundle < files.length; b++) {
  const chunk = files.slice(b * perBundle, (b + 1) * perBundle);
  const bufs = chunk.map(f => fs.readFileSync(path.join(src, f)));
  const sizes = bufs.map(x => x.length);
  const name = `film-${String(b).padStart(2, '0')}.bin`;
  fs.writeFileSync(path.join(out, name), Buffer.concat(bufs));
  manifest.bundles.push({ url: name, first: b * perBundle, sizes, bytes: sizes.reduce((a, c) => a + c, 0) });
}
manifest.totalBytes = manifest.bundles.reduce((a, c) => a + c.bytes, 0);
fs.writeFileSync(path.join(out, 'film.json'), JSON.stringify(manifest));
console.log(`${files.length} кадров → ${manifest.bundles.length} бандлов, ${(manifest.totalBytes / 1048576).toFixed(2)} MiB → ${out}`);
