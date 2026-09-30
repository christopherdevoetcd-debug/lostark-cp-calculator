// Recettes d'affinage T4 (Aegir 1640 et Serka 1675) tirées du flux du planificateur Maxroll,
// les tables qu'utilise leur propre calculateur d'amélioration (même source que loseii.com).
// Usage : node tools/fetch-maxroll-honing.mjs   → écrit data/honing-t4.json
// À relancer après un patch qui touche l'affinage, puis redéployer.
import { writeFileSync } from 'node:fs';

const FEED = 'https://assets-ng.maxroll.gg/laplanner/game/stats.json';
const OUT = new URL('../data/honing-t4.json', import.meta.url);

// Matériaux du jeu → slug de l'API de prix (functions/api/market/prices.js)
const MAT_SLUGS = {
  66102006: 'destiny-destruction-stone',
  66102106: 'destiny-guardian-stone',
  66102007: 'destiny-crystallized-destruction-stone',
  66102107: 'destiny-crystallized-guardian-stone',
  6861012: 'abidos-fusion-material',
  6861013: 'superior-abidos-fusion-material',
  66110225: 'destiny-leapstone',
  66110226: 'great-destiny-leapstone'
};
const BREATH_SLUGS = { 66111131: 'lavas-breath', 66111132: 'glaciers-breath' };
// Recette commune : arme / armure de chaque palier
const TRACKS = {
  aegir: { weapon: '410500', armor: '410501' },
  serka: { weapon: '411100', armor: '411101' }
};

const res = await fetch(FEED, { headers: { 'User-Agent': 'lostark-cp-calculator' } });
if (!res.ok) throw new Error(`Flux Maxroll : HTTP ${res.status}`);
const stats = await res.json();
const common = stats.enhanceCommon;
const quality = stats.itemQuality;

// Matériaux par niveau : portés par l'objet (itemQuality), qui renvoie vers sa recette commune
function matsFor(commonKey) {
  const all = Object.values(quality).filter(q => q && q.common === commonKey && q.mats);
  if (!all.length) throw new Error(`Aucun objet pour la recette ${commonKey}`);
  const ref = JSON.stringify(all[0].mats);
  // Toutes les pièces d'une même recette doivent coûter pareil, sinon la table ne tient pas
  if (all.some(q => JSON.stringify(q.mats) !== ref)) throw new Error(`Matériaux différents selon la pièce pour ${commonKey}`);
  const out = {};
  for (const [id, n] of Object.entries(all[0].mats)) {
    const slug = MAT_SLUGS[id];
    if (!slug) throw new Error(`Matériau inconnu ${id} dans ${commonKey}`);
    out[slug] = n;
  }
  return out;
}

const data = { source: FEED, generatedAt: new Date().toISOString(), note: 'lvl N = passage de +N à +N+1 ; taux en 0,01 %', tracks: {} };
for (const [track, pieces] of Object.entries(TRACKS)) {
  data.tracks[track] = {};
  for (const [piece, group] of Object.entries(pieces)) {
    const levels = {};
    for (let lvl = 10; lvl <= 24; lvl++) {
      const key = `${group}#${101 + lvl}`;
      const r = common[key];
      if (!r) throw new Error(`Recette absente : ${key}`);
      const breath = (r.additive || [])[0];
      levels[lvl] = {
        success: r.success,
        failBonus: r.failBonus,
        failMax: r.failMax,
        threshold: r.threshold,
        gold: (r.money && r.money['2']) || 0,
        shards: (r.money && r.money['18']) || 0,
        mats: matsFor(key),
        breath: breath ? { slug: BREATH_SLUGS[breath.id], rate: breath.rate, max: breath.max } : null
      };
    }
    data.tracks[track][piece] = levels;
  }
}

writeFileSync(OUT, JSON.stringify(data, null, 1));
console.log(`data/honing-t4.json écrit (${Object.keys(data.tracks).join(', ')})`);
