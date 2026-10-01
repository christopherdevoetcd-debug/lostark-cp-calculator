// Noms des cœurs de la Grille d'Ark, tirés de la table des objets du planificateur Maxroll (noms du jeu, client anglais).
// Réécrit le dictionnaire BIBLE_CORES de calculator.js (ID du cœur → « Order Sun Core: Ominous »).
// Usage : node tools/fetch-maxroll-names.mjs [items.json local]   (sans argument : téléchargé, ~11 Mo)
// À relancer après un patch qui ajoute ou renomme des cœurs, puis redéployer.
import { readFileSync, writeFileSync } from 'node:fs';

const FEED = 'https://assets-ng.maxroll.gg/laplanner/game/items.json';
const CALC = new URL('../calculator.js', import.meta.url);

const local = process.argv[2];
const items = local
  ? JSON.parse(readFileSync(local, 'utf8'))
  : await (await fetch(FEED, { headers: { 'User-Agent': 'lostark-cp-calculator' } })).json();

const CORE_NAME = /^(Order|Chaos) (Sun|Moon|Star) Core: /;
const cores = {};
for (const [id, it] of Object.entries(items)) {
  if (/^673\d{6}$/.test(id) && it && CORE_NAME.test(it.name || '')) cores[id] = it.name;
}
if (Object.keys(cores).length < 1000) throw new Error(`Seulement ${Object.keys(cores).length} cœurs trouvés : format du flux changé ?`);

const src = readFileSync(CALC, 'utf8');
const re = /const BIBLE_CORES = \{.*?\};/;
if (!re.test(src)) throw new Error('BIBLE_CORES introuvable dans calculator.js');
const sorted = Object.fromEntries(Object.entries(cores).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(CALC, src.replace(re, () => `const BIBLE_CORES = ${JSON.stringify(sorted)};`));
console.log(`BIBLE_CORES réécrit : ${Object.keys(sorted).length} cœurs (source ${local || FEED})`);
