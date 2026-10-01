// Récolte séquentielle et espacée (6 s) d'un échantillon de profils lostark.bible, avec cache local.
import fs from 'fs';
import path from 'path';
const HERE = path.dirname(new URL(import.meta.url).pathname);
const REPO = path.resolve(HERE, '../..');
process.chdir(HERE);
fs.mkdirSync('cache/bible', { recursive: true });
const peers = JSON.parse(fs.readFileSync(REPO + '/data/live-peers.json')).classes;
const sample = [];
for (const [cls, list] of Object.entries(peers)) {
  const sorted = [...list].sort((a, b) => a.ilvl - b.ilvl);
  const dps = sorted.filter(x => x.role === 'dps'), sup = sorted.filter(x => x.role === 'support');
  const pick = (arr, n) => { if (!arr.length) return []; if (n === 1) return [arr[Math.floor(arr.length / 2)]];
    return [arr[Math.floor(arr.length * 0.2)], arr[Math.floor(arr.length * 0.8)]]; };
  if (sup.length) { sample.push(...pick(sup, 2)); sample.push(...pick(dps, 1)); }
  else sample.push(...pick(dps, 2));
}
// Personnages en plus : node fetch-sample.mjs CE:Nom1 NA:Nom2
for (const a of process.argv.slice(2)) { const [region, name] = a.split(':'); sample.push({ name, region, className: '?', role: '?', ilvl: 0 }); }
fs.writeFileSync('sample.json', JSON.stringify(sample, null, 1));
const sleep = ms => new Promise(r => setTimeout(r, ms));
let n = 0;
for (const p of sample) {
  const file = `cache/bible/${p.region}_${p.name}.json`;
  if (fs.existsSync(file)) continue;
  let url = `https://lostark.bible/character/${p.region}/${encodeURIComponent(p.name)}/__data.json`;
  try {
    let res = await fetch(url, { headers: { 'User-Agent': 'lostark-cp-calculator audit (low rate)' } });
    let json = res.ok ? await res.json() : null;
    if (json && json.type === 'redirect' && json.location) {
      await sleep(6000);
      res = await fetch(`https://lostark.bible${json.location}/__data.json`);
      json = res.ok ? await res.json() : null;
    }
    if (json) fs.writeFileSync(file, JSON.stringify(json));
    console.log(++n, p.name, p.region, res.status);
    if (res.status === 429 || res.status === 403) { console.log('STOP: limité par le serveur'); break; }
  } catch (e) { console.log('ERR', p.name, e.message); }
  await sleep(6000);
}
console.log('done', sample.length);
