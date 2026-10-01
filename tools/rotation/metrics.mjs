// Analyse de rotation d'un joueur sur un combat LOA Logs (prototype, phase 1).
// Module pur (sans Node) : réutilisable tel quel dans le navigateur.
//
// Données : skillCastLog de chaque compétence = utilisations (timestamp, last = dernier coup)
// et leurs coups (dégâts, crit, dos / face, buffs et debuffs actifs au moment du coup).
// Temps en ms depuis le début du combat.

// Groupes de buffs du jeu (uniqueGroup), mêmes règles que LOA Logs (src-tauri/src/data.rs).
export const SUPPORT_AP_GROUPS = new Set([101204, 101105, 314004, 480030]); // Barde, Paladin, Artiste, Valkyrie
export const SUPPORT_IDENTITY_GROUPS = new Set([211400, 368000, 310501, 480018]);
export const SUPPORT_BRAND_GROUPS = new Set([210230]);
export const HAT_BUFFS = new Set([362600, 212305, 319503, 319504, 485100, 362601, 212306, 319506, 485101]);
export const SUPPORT_SPECS = new Set(['Blessed Aura', 'Desperate Salvation', 'Full Bloom', 'Liberator']);

export const DOWNTIME_GAP_MS = 4000; // moins de la moitié du raid frappe pendant plus de 4 s : boss absent, non ciblable ou mécanique
export const DOWNTIME_BIN_MS = 500;
export const IDLE_TOLERANCE_MS = 1500; // battement normal entre deux compétences (déplacement, animation après le dernier coup)
export const SHARED_PAUSE_MIN_MS = 5000;
export const SHARED_PAUSE_MAX_COVER = 0.25; // un autre DPS « en pause » : des coups sur moins de 25 % du trou
export const BIG_SKILL_MIN_SHARE = 0.03;
export const BIG_SKILL_MIN_INTERVAL_MS = 15000;

const DMG_FLAG = 1;

export function isSupport(player) {
  return SUPPORT_SPECS.has(player.spec);
}

export function classifyBuffs(encounter) {
  const ap = new Set(), identity = new Set(), brand = new Set(), hat = new Set();
  for (const [id, b] of Object.entries(encounter.buffs || {})) {
    const n = +id;
    if (HAT_BUFFS.has(n)) { hat.add(n); continue; }
    if (b.buffCategory !== 'supportbuff' || !(b.buffType & DMG_FLAG)) continue;
    if (SUPPORT_AP_GROUPS.has(b.uniqueGroup)) ap.add(n);
    else if (SUPPORT_IDENTITY_GROUPS.has(b.uniqueGroup)) identity.add(n);
  }
  for (const [id, b] of Object.entries(encounter.debuffs || {})) {
    if (SUPPORT_BRAND_GROUPS.has(b.uniqueGroup) && (b.buffType & DMG_FLAG)) brand.add(+id);
  }
  return { ap, identity, brand, hat };
}

function castWindows(player) {
  const w = [];
  for (const s of Object.values(player.skills)) {
    for (const c of s.skillCastLog || []) w.push([c.timestamp, Math.max(c.last || c.timestamp, c.timestamp)]);
  }
  return w.sort((a, b) => a[0] - b[0]);
}

function hitWindows(player) {
  const w = [];
  for (const s of Object.values(player.skills)) {
    for (const c of s.skillCastLog || []) for (const h of c.hits || []) if (h.damage > 0) w.push([h.timestamp, h.timestamp]);
  }
  return w.sort((a, b) => a[0] - b[0]);
}

function mergeWindows(windows, joinGapMs) {
  const out = [];
  for (const [a, b] of windows) {
    const last = out[out.length - 1];
    if (last && a - last[1] <= joinGapMs) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

function overlap(a, b, intervals) {
  let t = 0;
  for (const [x, y] of intervals) t += Math.max(0, Math.min(b, y) - Math.max(a, x));
  return t;
}

// Périodes où personne dans le raid ne fait rien : boss absent, non ciblable, cinématique.
// Périodes où moins de la moitié du raid inflige des dégâts : boss absent, non ciblable, cinématique ou mécanique.
// Fondé sur les coups, pas sur les compétences lancées : un support qui buffe ou une compétence dans le vide
// pendant une phase sans boss ne compte pas (vérifié sur la G2 de la Cathédrale, ~13 s sans dégâts vers 7:40).
export function raidDowntime(encounter) {
  const bins = Math.ceil(encounter.timelineMs / DOWNTIME_BIN_MS) + 1;
  const active = new Uint8Array(bins);
  const players = encounter.players.filter(p => Object.values(p.skills).some(s => s.skillCastLog?.length));
  for (const p of players) {
    const seen = new Uint8Array(bins);
    for (const [a, b] of mergeWindows(hitWindows(p), IDLE_TOLERANCE_MS)) {
      for (let i = Math.floor(a / DOWNTIME_BIN_MS); i <= Math.min(bins - 1, Math.floor((b + IDLE_TOLERANCE_MS) / DOWNTIME_BIN_MS)); i++) seen[i] = 1;
    }
    for (let i = 0; i < bins; i++) active[i] += seen[i];
  }
  const need = Math.max(1, Math.ceil(players.length / 2));
  const down = [];
  let start = null;
  for (let i = 0; i <= bins; i++) {
    const quiet = i < bins && active[i] < need;
    if (quiet && start == null) start = i;
    if (!quiet && start != null) {
      if ((i - start) * DOWNTIME_BIN_MS > DOWNTIME_GAP_MS) down.push([start * DOWNTIME_BIN_MS, Math.min(encounter.timelineMs, i * DOWNTIME_BIN_MS)]);
      start = null;
    }
  }
  return down;
}

// Temps à terre (deathInfo : instant absolu de la mort, durée). Les morts après la fin du combat ne comptent pas.
function deathWindows(encounter, player) {
  return (player.damageStats.deathInfo || [])
    .map(d => [d.deathTime - encounter.fightStart, d.deathTime - encounter.fightStart + (d.deadFor || 0)])
    .filter(([a]) => a >= 0 && a < encounter.timelineMs)
    .map(([a, b]) => [a, Math.min(b, encounter.timelineMs)]);
}

export function quantile(sorted, q) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

export function analyzePlayer(encounter, player, { skillMeta = {}, buffSets = classifyBuffs(encounter), downtime = raidDowntime(encounter), otherDps = dpsHitWindows(encounter) } = {}) {
  const durationMs = encounter.timelineMs;
  const downMs = downtime.reduce((t, [a, b]) => t + b - a, 0);
  const availableMs = Math.max(1, durationMs - downMs);
  const minutes = availableMs / 60000;

  // Temps sans action : écarts entre deux utilisations, hors périodes mortes du raid, au-delà du battement normal.
  const dead = deathWindows(encounter, player);
  const deadMs = dead.reduce((t, [a, b]) => t + b - a - overlap(a, b, downtime), 0);
  const excluded = mergeWindows([...downtime, ...dead].sort((x, y) => x[0] - y[0]), 0);
  const windows = mergeWindows(castWindows(player), 0);
  const gaps = [];
  let prev = 0;
  for (const [a, b] of [...windows, [durationMs, durationMs]]) {
    const raw = a - prev;
    const eff = raw - overlap(prev, a, excluded);
    if (eff > IDLE_TOLERANCE_MS) gaps.push({ from: prev, to: a, lostMs: eff - IDLE_TOLERANCE_MS });
    prev = Math.max(prev, b);
  }
  // Pause partagée : d'autres DPS sans dégâts au même moment (mécanique qui désigne certains joueurs, ex. Kazeros).
  // Il en faut au moins 2 (les 2 autres DPS d'un raid à 4), sur un trou d'au moins 5 s : plus court ou avec un
  // seul autre DPS, la coïncidence est fréquente (corrélation de l'activité avec DPS ÷ CP 0,58 → 0,50).
  const others = (otherDps || []).filter(o => o.name !== player.name);
  const need = Math.min(others.length, Math.max(2, Math.ceil(others.length / 3)));
  for (const g of gaps) {
    const span = g.to - g.from;
    g.pausedWith = others.filter(o => overlap(g.from, g.to, o.windows) < SHARED_PAUSE_MAX_COVER * span).map(o => o.name);
    g.shared = need >= 2 && span >= SHARED_PAUSE_MIN_MS && g.pausedWith.length >= need;
  }
  const lostMs = gaps.filter(g => !g.shared).reduce((t, g) => t + g.lostMs, 0);
  const sharedPauseMs = gaps.filter(g => g.shared).reduce((t, g) => t + g.lostMs, 0);

  const totalDamage = player.damageStats.damageDealt || Object.values(player.skills).reduce((t, s) => t + (s.totalDamage || 0), 0);
  const skills = [];
  const acc = { hitDmg: 0, ap: 0, brand: 0, identity: 0, hat: 0, full: 0, posDmg: 0, posOk: 0, bigDmg: 0, bigFull: 0 };

  for (const s of Object.values(player.skills)) {
    const casts = s.skillCastLog || [];
    if (!s.totalDamage && !casts.length) continue;
    const meta = skillMeta[s.id] || skillMeta[s.id - (s.id % 10)] || null;
    const mask = meta ? meta.dm : 0;
    const times = casts.map(c => c.timestamp).sort((a, b) => a - b);
    const iv = times.slice(1).map((t, i) => t - times[i]).sort((a, b) => a - b);
    const k = { hitDmg: 0, ap: 0, brand: 0, identity: 0, hat: 0, full: 0, posOk: 0 };
    for (const c of casts) for (const h of c.hits || []) {
      const d = h.damage || 0;
      const buffs = h.buffedBy || [], debuffs = h.debuffedBy || [];
      const hasAp = buffs.some(b => buffSets.ap.has(b));
      const hasBrand = debuffs.some(b => buffSets.brand.has(b));
      k.hitDmg += d;
      if (hasAp) k.ap += d;
      if (hasBrand) k.brand += d;
      if (hasAp && hasBrand) k.full += d;
      if (buffs.some(b => buffSets.identity.has(b))) k.identity += d;
      if (buffs.some(b => buffSets.hat.has(b))) k.hat += d;
      if ((mask & 1 && h.backAttack) || (mask & 2 && h.frontAttack)) k.posOk += d;
    }
    const share = totalDamage ? (s.totalDamage || 0) / totalDamage : 0;
    const medianIv = quantile(iv, 0.5);
    const big = share >= BIG_SKILL_MIN_SHARE && medianIv != null && medianIv >= BIG_SKILL_MIN_INTERVAL_MS;
    skills.push({
      // Sans journal d'utilisations (dégâts sur la durée, objets) : pas d'utilisations à compter.
      id: s.id, name: s.name, damage: s.totalDamage || 0, share, casts: casts.length,
      cpm: casts.length / minutes, medianIntervalMs: medianIv, minIntervalMs: iv[0] ?? null,
      positional: mask ? (mask === 1 ? 'back' : mask === 2 ? 'front' : 'any') : null,
      positionalRate: mask && k.hitDmg ? k.posOk / k.hitDmg : null,
      apRate: k.hitDmg ? k.ap / k.hitDmg : null, fullBuffRate: k.hitDmg ? k.full / k.hitDmg : null,
      isHyperAwakening: !!s.isHyperAwakening, big, firstCasts: times.slice(0, 3),
    });
    for (const f of ['hitDmg', 'ap', 'brand', 'identity', 'hat', 'full']) acc[f] += k[f];
    if (mask) { acc.posDmg += k.hitDmg; acc.posOk += k.posOk; }
    if (big) { acc.bigDmg += k.hitDmg; acc.bigFull += k.full; }
  }
  skills.sort((a, b) => b.damage - a.damage);

  const opener = Object.values(player.skills)
    .flatMap(s => (s.skillCastLog || []).map(c => ({ t: c.timestamp, name: s.name, id: s.id })))
    .sort((a, b) => a.t - b.t).slice(0, 12);

  const r = (x, y) => (y ? x / y : null);
  return {
    name: player.name, className: player.className, spec: player.spec, support: isSupport(player),
    supportCoverage: isSupport(player) && player.supportCoverage?.ap != null ? player.supportCoverage : null,
    combatPower: player.combatPower, dps: player.damageStats.dps || Math.round(totalDamage / (durationMs / 1000)),
    durationMs, downtimeMs: downMs, availableMs,
    deadMs, lostMs, sharedPauseMs, activity: 1 - lostMs / Math.max(1, availableMs - deadMs - sharedPauseMs),
    longestGaps: gaps.sort((a, b) => b.lostMs - a.lostMs).slice(0, 6),
    deaths: player.damageStats.deaths || 0,
    apRate: r(acc.ap, acc.hitDmg), brandRate: r(acc.brand, acc.hitDmg), identityRate: r(acc.identity, acc.hitDmg),
    hatRate: r(acc.hat, acc.hitDmg), fullBuffRate: r(acc.full, acc.hitDmg),
    bigSkillFullBuffRate: r(acc.bigFull, acc.bigDmg),
    positionalShare: r(acc.posDmg, acc.hitDmg), positionalRate: r(acc.posOk, acc.posDmg),
    skills, opener,
  };
}

// Coups des DPS (fenêtres fusionnées), pour repérer les pauses partagées.
export function dpsHitWindows(encounter) {
  return encounter.players.filter(p => !isSupport(p))
    .map(p => ({ name: p.name, windows: mergeWindows(hitWindows(p), IDLE_TOLERANCE_MS) }));
}

export function analyzeEncounter(encounter, opts = {}) {
  const buffSets = classifyBuffs(encounter);
  const downtime = raidDowntime(encounter);
  const otherDps = dpsHitWindows(encounter);
  return {
    downtime,
    players: encounter.players.map(p => analyzePlayer(encounter, p, { ...opts, buffSets, downtime, otherDps })),
  };
}

// ---------- Références (même spé, même boss) et note d'exécution ----------

export const QUANTILE_STEPS = 20; // quantiles tous les 5 %

export function toQuantiles(values) {
  const v = values.filter(x => x != null && Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  return Array.from({ length: QUANTILE_STEPS + 1 }, (_, i) => +quantile(v, i / QUANTILE_STEPS).toFixed(5));
}

// Rang (0-100) d'une valeur dans la distribution de référence.
export function percentileRank(q, x) {
  if (!q || x == null) return null;
  if (x <= q[0]) return 0;
  if (x >= q[q.length - 1]) return 100;
  for (let i = 1; i < q.length; i++) {
    if (x <= q[i]) {
      const span = q[i] - q[i - 1];
      const f = span > 0 ? (x - q[i - 1]) / span : 0.5;
      return Math.round(((i - 1 + f) / (q.length - 1)) * 100);
    }
  }
  return 100;
}

export const SCORE_WEIGHTS = { activity: 30, skills: 35, buffs: 20, positional: 15 };
// Supports : couverture de leur groupe (part des dégâts des DPS sous chaque buff). Poids proches de la corrélation
// de chaque critère avec le rDPS donné ÷ dégâts du groupe (803 supports, 2026-10-02) : identité 0,61, PA 0,50,
// Marque 0,50, activité 0,34, T 0,25.
export const SUPPORT_SCORE_WEIGHTS = { ap: 30, brand: 25, identity: 25, hat: 10, activity: 10 };
export const REF_MIN_SAMPLES = 8;
export const KEY_SKILL_MIN_SHARE = 0.03;
export const KEY_SKILL_MIN_USAGE = 0.6; // compétence jouée par au moins 60 % des joueurs de la spé (sinon choix de build)
export const POSITIONAL_MIN_SHARE = 0.2;

export function pickReference(refs, spec, boss) {
  const exact = refs?.[`${spec}|${boss}`];
  if (exact && exact.n >= REF_MIN_SAMPLES) return { ref: exact, scope: 'boss' };
  const all = refs?.[`${spec}|*`];
  if (all && all.n >= REF_MIN_SAMPLES) return { ref: all, scope: 'spec' };
  return { ref: null, scope: null };
}

function weighted(parts, weights) {
  let tw = 0, total = 0;
  for (const [k, wk] of Object.entries(weights)) if (parts[k] != null) { tw += wk; total += wk * parts[k]; }
  return tw ? Math.round(total / tw) : null;
}

export function scoreSupport(a, ref) {
  // Couverture absente : groupe sans DPS ou avec deux supports (LOA Logs ne la calcule pas).
  if (!ref?.support || !a.supportCoverage) return null;
  const parts = { activity: percentileRank(ref.activity, a.activity) };
  for (const k of ['ap', 'brand', 'identity', 'hat']) parts[k] = percentileRank(ref.support[k], a.supportCoverage[k]);
  // Compétences : à titre indicatif (hors note), toutes celles que la spé joue, quelle que soit leur part des dégâts.
  const skillScores = [];
  for (const [id, rs] of Object.entries(ref.skills || {})) {
    if ((rs.usage ?? 0) < KEY_SKILL_MIN_USAGE || (rs.cpm?.[10] ?? 0) < 0.5) continue;
    const mine = a.skills.find(x => String(x.id) === id);
    skillScores.push(mine
      ? { id: +id, name: rs.name, cpm: mine.cpm, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], rank: percentileRank(rs.cpm, mine.cpm), weight: 0 }
      : { id: +id, name: rs.name, absent: true, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], weight: 0 });
  }
  return { score: weighted(parts, SUPPORT_SCORE_WEIGHTS), parts, skillScores };
}

export function scorePlayer(a, ref) {
  if (!ref) return null;
  if (a.support) return scoreSupport(a, ref);
  const parts = {};
  parts.activity = percentileRank(ref.activity, a.activity);

  // Compétences clés de la spé (≥ 3 % des dégâts en médiane chez ceux qui la jouent) : utilisations par minute,
  // pondérées par leur part. Une compétence absente du build n'est pas notée (affichée à part).
  let w = 0, s = 0;
  const skillScores = [];
  for (const [id, rs] of Object.entries(ref.skills || {})) {
    if ((rs.shareMedian ?? 0) < KEY_SKILL_MIN_SHARE) continue;
    if ((rs.usage ?? 0) < KEY_SKILL_MIN_USAGE) continue;
    const mine = a.skills.find(x => String(x.id) === id);
    if (!mine) { skillScores.push({ id: +id, name: rs.name, absent: true, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], weight: rs.shareMedian }); continue; }
    const rank = percentileRank(rs.cpm, mine.cpm);
    skillScores.push({ id: +id, name: rs.name, cpm: mine.cpm, refCpmMedian: rs.cpm[10], refCpmP90: rs.cpm[18], rank, weight: rs.shareMedian });
    w += rs.shareMedian; s += rs.shareMedian * rank;
  }
  parts.skills = w ? Math.round(s / w) : null;

  // Buffs : seulement si un support a donné son buff de PA pendant le combat (sinon rien à aligner).
  // Un support ne s'aligne pas sur son propre buff : critère réservé aux DPS.
  parts.buffs = !a.support && a.apRate ? percentileRank(ref.fullBuffRate, a.fullBuffRate) : null;

  parts.positional = (ref.positionalShareMedian ?? 0) >= POSITIONAL_MIN_SHARE ? percentileRank(ref.positionalRate, a.positionalRate) : null;

  return { score: weighted(parts, SCORE_WEIGHTS), parts, skillScores: skillScores.sort((x, y) => y.weight - x.weight) };
}
