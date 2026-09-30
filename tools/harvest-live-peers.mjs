// Constitue le réservoir de vrais joueurs pour le Benchmark (data/live-peers.json).
//
// lostark.bible n'expose aucune liste de joueurs par CP : la seule source de noms réels est
// le classement des raids (fonction distante SvelteKit `leaderboardsSearch`). Ce script parcourt
// les boss T4 × difficultés × patchs, garde nom / classe / spé / iLvl / région de chaque joueur,
// puis répartit un échantillon par classe, rôle et tranche d'iLvl.
//
// Les chiffres affichés dans l'application restent en direct : elle recharge la fiche de chaque
// candidat au moment de proposer une comparaison. Ce fichier ne sert qu'à trouver des noms.
//
// Usage : node tools/harvest-live-peers.mjs   (Node 18+, relancer ~1 fois par semaine)

import { writeFileSync } from 'node:fs';

const BASE = 'https://lostark.bible';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUT = new URL('../data/live-peers.json', import.meta.url);

// Raids réellement joués en ce moment (les anciens raids T4 n'ont presque plus d'entrées) :
// Armoche, Kazeros, Serca (Serca + Corvus Tul Rak) et la Cathédrale (Arcenos).
const BOSSES = [
  'Armoche, Sentinel of the Abyss', 'Abyss Lord Kazeros', 'Death Incarnate Kazeros',
  'Witch of Agony, Serca', 'Corvus Tul Rak',
  'Arcenos, Vanguard of Fanaticism', 'Archbishop Arcenos'
];
// Normal/Hard/Nightmare pour Armoche, Kazeros et Serca ; Level 1-3 pour la Cathédrale (combinaisons vides ignorées)
const DIFFICULTIES = ['Normal', 'Hard', 'Nightmare', 'Level 1', 'Level 2', 'Level 3'];
const PATCHES = ['current', 'sep26', 'jun26'];

// Spés support (le reste est DPS)
const SUPPORT_SPECS = new Set(['Blessed Aura', 'Desperate Salvation', 'Full Bloom', 'Liberator', 'Knight of Light']);

const BAND = 5;          // largeur d'une tranche d'iLvl
const PER_BAND = 4;      // joueurs gardés par classe, rôle et tranche
const PAUSE_MS = 400;    // politesse envers lostark.bible

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json, text/html, */*' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// L'identifiant de la fonction distante change à chaque mise à jour du site : on le relit dans le bundle.
async function findRemoteId() {
  const app = await get(`${BASE}/_app/immutable/entry/${(await get(`${BASE}/leaderboards`)).match(/entry\/(app\.[A-Za-z0-9_-]+\.js)/)[1]}`);
  const nodes = [...new Set(app.match(/nodes\/[0-9]+\.[A-Za-z0-9_-]+\.js/g) || [])];
  for (const n of nodes) {
    const js = await get(`${BASE}/_app/immutable/${n}`);
    const m = js.match(/`([a-z0-9]+)\/leaderboardsSearch`/);
    if (m) return m[1];
  }
  throw new Error('leaderboardsSearch introuvable dans le bundle de lostark.bible');
}

// Format devalue de SvelteKit : tableau plat où objets et tableaux référencent des indices.
function unflatten(values) {
  const cache = new Map();
  const hydrate = (i) => {
    if (i < 0) return undefined;
    if (cache.has(i)) return cache.get(i);
    const v = values[i];
    if (Array.isArray(v)) {
      const out = []; cache.set(i, out);
      v.forEach(j => out.push(hydrate(j)));
      return out;
    }
    if (v && typeof v === 'object') {
      const out = {}; cache.set(i, out);
      for (const [k, j] of Object.entries(v)) out[k] = hydrate(j);
      return out;
    }
    return v;
  };
  return hydrate(0);
}

async function search(remoteId, boss, difficulty, patch) {
  const payload = Buffer.from(JSON.stringify([['__skrao', 1], { boss: 2, difficulty: 3, patch: 4 }, boss, difficulty, patch])).toString('base64');
  const body = JSON.parse(await get(`${BASE}/_app/remote/${remoteId}/leaderboardsSearch?payload=${encodeURIComponent(payload)}`));
  if (body.type !== 'result' || !body.data) return [];
  // La réponse est enveloppée : { _: { timestamp, encounters }, q: … }
  const root = unflatten(JSON.parse(body.data));
  const result = root && root._ ? root._ : root;
  return (result && result.encounters) || [];
}

const classKey = (c) => (c || '').toLowerCase().replace(/[^a-z]/g, '');

async function main() {
  const remoteId = await findRemoteId();
  console.log('leaderboardsSearch id:', remoteId);

  const players = new Map(); // nom|région -> joueur (iLvl le plus récent vu)
  let queries = 0;
  for (const boss of BOSSES) {
    for (const difficulty of DIFFICULTIES) {
      for (const patch of PATCHES) {
        let encounters = [];
        try { encounters = await search(remoteId, boss, difficulty, patch); } catch (e) { /* combinaison inexistante */ }
        queries++;
        for (const enc of encounters) {
          for (const p of enc.players || []) {
            if (!p || !p.name || !p.class) continue;
            // Joueurs anonymisés : le classement affiche le nom de la classe à la place du pseudo
            if (classKey(p.name) === classKey(p.class)) continue;
            const key = `${p.name}|${enc.region}`;
            const ilvl = Number(parseFloat(p.gearScore).toFixed(2));
            const prev = players.get(key);
            if (!prev || (enc.timestamp || 0) > prev.seen) {
              players.set(key, {
                name: p.name, region: enc.region, className: p.class, spec: p.spec || '',
                role: SUPPORT_SPECS.has(p.spec) ? 'support' : 'dps', ilvl, seen: enc.timestamp || 0
              });
            }
          }
        }
        await sleep(PAUSE_MS);
      }
    }
    console.log(`${boss}: ${players.size} joueurs uniques (${queries} requêtes)`);
  }

  // Échantillon : par classe et rôle, PER_BAND joueurs par tranche de BAND iLvl (les plus récents d'abord)
  const pool = {};
  const groups = new Map();
  for (const p of players.values()) {
    const k = `${classKey(p.className)}|${p.role}|${Math.floor(p.ilvl / BAND)}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  for (const [k, list] of groups) {
    const cls = k.split('|')[0];
    list.sort((a, b) => b.seen - a.seen);
    pool[cls] = (pool[cls] || []).concat(list.slice(0, PER_BAND).map(({ seen, ...rest }) => rest));
  }
  for (const cls of Object.keys(pool)) pool[cls].sort((a, b) => a.ilvl - b.ilvl);

  const out = { generatedAt: new Date().toISOString(), source: 'lostark.bible raid leaderboards', classes: pool };
  writeFileSync(OUT, JSON.stringify(out));
  const summary = Object.entries(pool).map(([c, l]) => `${c}:${l.length}`).join(' ');
  console.log(`\n${Object.keys(pool).length} classes — ${summary}`);
}

main().catch(e => { console.error(e); process.exit(1); });
