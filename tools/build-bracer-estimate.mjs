// Brassard T4 (완갑, raid Belgardin) : table de projection en attendant les tables du jeu.
// Le flux Maxroll ne contient pas encore le brassard (vérifié le 2026-10-01). Quand il l'aura, remplacer ce script
// par une lecture directe du flux dans tools/fetch-maxroll-honing.mjs (recette et table itemLevel du brassard).
//
// Chaque valeur porte sa source (`src`) :
//  - 'official' : note des développeurs Stove (GMNote 1225) : taux de réussite par tranche, coût du niveau 1,
//    déblocages de rareté (한계 해방) ;
//  - 'inven'    : relevé du brassard +21 publié (Inven #3790814) : stat principale 52 381, puissance d'arme 21 726,
//    Vitalité 4 600, PA de base +5 980 et +2,0 % ;
//  - 'estimate' : estimation communautaire KR (simulateurs Inven 4821/110391 et Arca 178285665) : stats = courbe des
//    pièces Serka (armures pour la stat principale et la Vitalité, arme pour la puissance d'arme) recalée sur le relevé +21 ;
//    coûts = recette Serka (moitié arme, moitié armure) recalée sur le coût officiel du niveau 1.
//    Le modèle brut des simulateurs (sans recalage) donne 1 200 or au niveau 1 contre 5 200 officiels : seule la forme
//    de la courbe est gardée. Règle d'artisan supposée identique aux autres recettes T4 (+10 % du taux par échec,
//    plafond = taux de base, jauge pleine à 215 %), non publiée pour le brassard.
//
// Usage : node tools/build-bracer-estimate.mjs [stats.json local]   → écrit data/bracer-t4.json
import { readFileSync, writeFileSync } from 'node:fs';

const FEED = 'https://assets-ng.maxroll.gg/laplanner/game/stats.json';
const OUT = new URL('../data/bracer-t4.json', import.meta.url);
const SRC = {
  official: 'https://m-lostark.game.onstove.com/News/GMNote/Views/1225',
  inven: 'https://www.inven.co.kr/board/lostark/6271/3790814',
  estimate: ['https://www.inven.co.kr/board/lostark/4821/110391', 'https://arca.live/b/lostark/178285665'],
  apStep: 'https://www.inven.co.kr/board/lostark/4821/110391',
  raid: 'https://www.loa.kakao.gg/guides/로스트아크-완갑-효율-공략-10강20강25강-강화-우선순위와-준비-재료',
  limitItem: 'https://lostark.inven.co.kr/dataninfo/item/?code=52810002'
};

const stats = process.argv[2]
  ? JSON.parse(readFileSync(process.argv[2], 'utf8'))
  : await (async () => {
    const res = await fetch(FEED, { headers: { 'User-Agent': 'lostark-cp-calculator' } });
    if (!res.ok) throw new Error(`Flux Maxroll : HTTP ${res.status}`);
    return res.json();
  })();

// Courbes Serka (mêmes objets que tools/fetch-maxroll-honing.mjs) : +N = iLvl 1675 + 5N
const SERKA = { weapon: '12159000', armor: ['12159011', '12159012', '12159013', '12159014', '12159015'] };
const statAt = (item, ilvl, id) => {
  const row = stats.itemLevel[`${item}#${ilvl}`];
  const s = row && row.find(x => x.stat === id);
  if (!s) throw new Error(`Stat ${id} absente pour ${item}#${ilvl}`);
  return s.value;
};
const curve = l => {
  const ilvl = 1675 + 5 * l;
  const avg = id => SERKA.armor.reduce((s, it) => s + statAt(it, ilvl, id), 0) / SERKA.armor.length;
  return { ms: avg(3), vit: avg(6), wp: statAt(SERKA.weapon, ilvl, 151) };
};

// Relevé +21 (Inven #3790814)
const ANCHOR_LVL = 21;
const ANCHOR = { mainStat: 52381, weaponPower: 21726, vitality: 4600, flatAp: 5980, apPct: 2 };
const c21 = curve(ANCHOR_LVL);
const levels = [];
for (let l = 0; l <= 25; l++) {
  const c = curve(l);
  const isAnchor = l === ANCHOR_LVL;
  levels.push({
    mainStat: isAnchor ? ANCHOR.mainStat : Math.round(ANCHOR.mainStat * c.ms / c21.ms),
    weaponPower: isAnchor ? ANCHOR.weaponPower : Math.round(ANCHOR.weaponPower * c.wp / c21.wp),
    vitality: isAnchor ? ANCHOR.vitality : Math.round(ANCHOR.vitality * c.vit / c21.vit),
    // PA fixe : suit la PA de base des pièces, √(stat × puissance d'arme)
    flatAp: isAnchor ? ANCHOR.flatAp : Math.round(ANCHOR.flatAp * Math.sqrt(c.ms * c.wp / (c21.ms * c21.wp))),
    // % de PA : +1 % à +10, +2 % à +20 (2,0 % au relevé +21)
    apPct: l >= 20 ? 2 : l >= 10 ? 1 : 0,
    src: isAnchor ? 'inven' : 'estimate'
  });
}

// Coût d'un essai (niveau N = passage de +N à +N+1). Niveau 0 : note officielle (« 1단계 »).
const OFFICIAL_STEP0 = {
  gold: 5200, silver: 80000, shards: 14500,
  mats: {
    'destiny-crystallized-destruction-stone': 600,
    'destiny-crystallized-guardian-stone': 1800,
    'great-destiny-leapstone': 30,
    'superior-abidos-fusion-material': 22
  }
};
// Taux officiels par tranche (en 0,01 %) : +1 à +5 15 %, +6 à +10 10 %, +11 à +15 5 %, +16 à +20 3 %, +21 à +25 1,5 %
const successAt = l => (l < 5 ? 1500 : l < 10 ? 1000 : l < 15 ? 500 : l < 20 ? 300 : 150);
const recipeAt = l => {
  const key = g => `${g}#${101 + l}`;
  const mats = g => {
    const q = Object.values(stats.itemQuality).find(x => x && x.common === key(g) && x.mats);
    if (!q) throw new Error(`Matériaux absents pour ${key(g)}`);
    return q.mats;
  };
  const W = stats.enhanceCommon[key('411100')], A = stats.enhanceCommon[key('411101')];
  const mw = mats('411100'), ma = mats('411101');
  return {
    gold: (W.money[2] + A.money[2]) / 2,
    silver: (W.money[1] + A.money[1]) / 2,
    shards: (W.money[18] + A.money[18]) / 2,
    'destiny-crystallized-destruction-stone': mw[66102007],
    'destiny-crystallized-guardian-stone': ma[66102107],
    'great-destiny-leapstone': (mw[66110226] + ma[66110226]) / 2,
    'superior-abidos-fusion-material': (mw[6861013] + ma[6861013]) / 2
  };
};
const r0 = recipeAt(0);
const steps = [];
for (let l = 0; l < 25; l++) {
  const r = recipeAt(l);
  const scale = k => (l === 0 ? 1 : r[k] / r0[k]);
  const p = successAt(l);
  steps.push({
    success: p, failBonus: p / 10, failMax: p, threshold: 21500,
    gold: Math.round(OFFICIAL_STEP0.gold * scale('gold')),
    silver: Math.round(OFFICIAL_STEP0.silver * scale('silver')),
    shards: Math.round(OFFICIAL_STEP0.shards * scale('shards')),
    mats: Object.fromEntries(Object.entries(OFFICIAL_STEP0.mats).map(([k, n]) => [k, Math.round(n * scale(k))])),
    src: l === 0 ? 'official' : 'estimate'
  });
}

const data = {
  generatedAt: new Date().toISOString(),
  sources: SRC,
  note: 'levels[N] = brassard +N ; steps[N] = passage de +N à +N+1, taux en 0,01 % ; src = official | inven | estimate',
  anchorLevel: ANCHOR_LVL,
  // Multiplicateurs de la stat principale du brassard (Inven #3790814) : avatars +8 %, ranch du familier +1 %
  mainStatMult: 1.09,
  // Le brassard ne donne ni iLvl, ni qualité, ni points d'Ark Passive (note officielle)
  limitBreak: {
    10: { grade: 'legendary', remnant: 200, deathHand: 100 },
    15: { grade: 'relic', remnant: 240, deathHand: 120 },
    20: { grade: 'ancient', remnant: null, deathHand: 150 }
  },
  raidGates: { normal: 1750, hard: 1770, nightmare: 1780 },
  levels,
  steps
};
writeFileSync(OUT, JSON.stringify(data, null, 1));
console.log(`data/bracer-t4.json écrit (+0 → +25, ancre +${ANCHOR_LVL})`);
