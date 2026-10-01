// Références de rotation par spé et par boss, tirées de tous les raids de la base LOA Logs.
// Seules des distributions (quantiles tous les 5 %) sont écrites, aucun nom de joueur.
// Usage : node tools/rotation/build-ref.mjs [--db encounters.db] [--out fichier.json] [--days 120]
// --days : seulement les combats des N derniers jours avant le plus récent (les façons de jouer changent avec les patchs).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { openDb, raidIds, loadEncounter } from './db.mjs';
import { analyzeEncounter, toQuantiles } from './metrics.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg('--out', path.join(HERE, '..', 'samples', 'rotation-ref.json'));
const skillMeta = JSON.parse(readFileSync(path.join(HERE, '..', '..', 'data', 'rotation-skills.json'), 'utf8')).skills;

const db = openDb(arg('--db'));
const DAYS = +arg('--days', 120);
const latest = db.prepare('SELECT MAX(fight_start) AS t FROM encounter_preview').get().t;
const since = latest - DAYS * 86400000;
const ids = raidIds(db).filter(id => db.prepare('SELECT fight_start FROM encounter_preview WHERE id = ?').get(id).fight_start >= since);
const groups = new Map();
const bucket = key => {
  if (!groups.has(key)) groups.set(key, { n: 0, activity: [], fullBuffRate: [], apRate: [], positionalRate: [], positionalShare: [], skills: new Map() });
  return groups.get(key);
};

const t0 = Date.now();
let players = 0;
for (const [i, id] of ids.entries()) {
  let enc;
  try { enc = loadEncounter(db, id); } catch { continue; }
  const { players: rows } = analyzeEncounter(enc, { skillMeta });
  for (const a of rows) {
    if (!a.spec || a.spec === 'Unknown' || a.skills.reduce((t, s) => t + s.casts, 0) < 20) continue;
    players++;
    for (const key of [`${a.spec}|${enc.boss}`, `${a.spec}|*`]) {
      const g = bucket(key);
      g.n++;
      g.activity.push(a.activity);
      if (a.apRate) { g.apRate.push(a.apRate); g.fullBuffRate.push(a.fullBuffRate); }
      g.positionalShare.push(a.positionalShare ?? 0);
      if (a.positionalRate != null) g.positionalRate.push(a.positionalRate);
      for (const s of a.skills) {
        if (!s.casts) continue;
        if (!g.skills.has(s.id)) g.skills.set(s.id, { name: s.name, users: 0, cpm: [], share: [], minIv: [] });
        const k = g.skills.get(s.id);
        k.users++; k.cpm.push(s.cpm); k.share.push(s.share);
        if (s.minIntervalMs != null) k.minIv.push(s.minIntervalMs);
      }
    }
  }
  if ((i + 1) % 250 === 0) console.log(`${i + 1}/${ids.length} combats…`);
}

const median = v => toQuantiles(v)?.[10] ?? null;
const out = {};
for (const [key, g] of groups) {
  const skills = {};
  for (const [id, k] of g.skills) {
    const usage = k.users / g.n;
    if (usage < 0.1) continue;
    skills[id] = { name: k.name, usage: +usage.toFixed(3), shareMedian: +median(k.share).toFixed(4), cpm: toQuantiles(k.cpm), minIntervalMedianMs: median(k.minIv) };
  }
  out[key] = {
    n: g.n, activity: toQuantiles(g.activity), apRate: toQuantiles(g.apRate), fullBuffRate: toQuantiles(g.fullBuffRate),
    positionalRate: toQuantiles(g.positionalRate), positionalShareMedian: median(g.positionalShare), skills,
  };
}
writeFileSync(OUT, JSON.stringify({ built: new Date().toISOString(), since: new Date(since).toISOString().slice(0, 10), encounters: ids.length, players, refs: out }));
console.log(`${ids.length} combats, ${players} joueurs, ${groups.size} groupes spé|boss → ${path.relative(process.cwd(), OUT)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
