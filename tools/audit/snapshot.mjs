// Comparaison avant / après des bancs d'audit (voir README.md du dossier).
//   --save-baseline : enregistre les chiffres du banc comme référence (tools/audit/baseline-<banc>.json, ignoré par Git :
//                     il dépend des profils du cache local).
//   --compare       : compare à la référence, résume ce qui a bougé et sort en code 1 si un chiffre a changé.
// Instantané = { entité (personnage, paire du Benchmark) : objet de valeurs } ; les tableaux d'objets à `id` sont
// indexés par leur id, pour qu'un ajout ou un retrait de ligne ne décale pas les autres.
import fs from 'fs';

export const flags = { save: process.argv.includes('--save-baseline'), compare: process.argv.includes('--compare') };
export const positional = process.argv.slice(2).filter(a => !a.startsWith('--'));

const fileOf = bench => new URL(`./baseline-${bench}.json`, import.meta.url);
const EPS = 1e-9;

function flatten(v, prefix, out) {
  if (Array.isArray(v)) {
    const byId = v.length && v.every(x => x && typeof x === 'object' && 'id' in x);
    v.forEach((x, i) => flatten(x, `${prefix}[${byId ? x.id : i}]`, out));
  } else if (v && typeof v === 'object') {
    Object.entries(v).forEach(([k, x]) => flatten(x, prefix ? `${prefix}.${k}` : k, out));
  } else {
    out[prefix] = v === undefined ? null : v;
  }
  return out;
}

// Clé de regroupement : chiffres des ids remplacés (dyn_gems_7_8 et dyn_gems_8_9 vont ensemble)
const groupKey = path => path.replace(/\[([^\]]*)\]/g, (_, id) => `[${id.replace(/\d+/g, '#')}]`);
const pct = x => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(2)} %`;
const show = v => (typeof v === 'number' ? String(+v.toPrecision(6)) : JSON.stringify(v));

function compare(base, cur) {
  const groups = {};
  const entities = new Set([...Object.keys(base), ...Object.keys(cur)]);
  let total = 0, changed = 0;
  const entityLines = [];
  for (const e of entities) {
    if (!(e in base)) { entityLines.push(`+ ${e} (nouveau)`); changed++; continue; }
    if (!(e in cur)) { entityLines.push(`- ${e} (disparu)`); changed++; continue; }
    const a = flatten(base[e], '', {}), b = flatten(cur[e], '', {});
    for (const path of new Set([...Object.keys(a), ...Object.keys(b)])) {
      total++;
      const g = groups[groupKey(path)] = groups[groupKey(path)] || { num: [], other: [], added: [], removed: [] };
      if (!(path in a)) { g.added.push(`${e}: ${show(b[path])}`); changed++; continue; }
      if (!(path in b)) { g.removed.push(`${e}: ${show(a[path])}`); changed++; continue; }
      const x = a[path], y = b[path];
      if (typeof x === 'number' && typeof y === 'number') {
        if (Math.abs(y - x) <= EPS * Math.max(1, Math.abs(x))) continue;
        g.num.push({ e, x, y, rel: x !== 0 ? (y - x) / Math.abs(x) : null });
        changed++;
      } else if (x !== y) {
        g.other.push(`${e}: ${show(x)} → ${show(y)}`);
        changed++;
      }
    }
  }
  return { groups, total, changed, entityLines };
}

/**
 * À appeler en fin de banc avec l'instantané. Renvoie le code de sortie (1 = différences ou référence absente).
 */
export function finishSnapshot(bench, snap) {
  snap = JSON.parse(JSON.stringify(snap)); // mêmes valeurs que la référence relue (undefined retiré)
  const file = fileOf(bench);
  if (flags.save) {
    fs.writeFileSync(file, JSON.stringify({ savedAt: new Date().toISOString(), snap }));
    console.log(`\nRéférence enregistrée : tools/audit/baseline-${bench}.json (${Object.keys(snap).length} entrées)`);
    return 0;
  }
  if (!flags.compare) return 0;
  if (!fs.existsSync(file)) {
    console.log(`\nPas de référence pour « ${bench} » : lancer d'abord avec --save-baseline (avant la modification).`);
    return 1;
  }
  const base = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { groups, total, changed, entityLines } = compare(base.snap, snap);
  console.log(`\n=== Comparaison à la référence « ${bench} » du ${base.savedAt} ===`);
  if (!changed) {
    console.log(`Identique : ${total} valeurs, ${Object.keys(snap).length} entrées.`);
    return 0;
  }
  entityLines.forEach(l => console.log(l));
  for (const [key, g] of Object.entries(groups).sort()) {
    if (g.num.length) {
      const rels = g.num.filter(n => n.rel !== null).map(n => n.rel).sort((p, q) => p - q);
      const range = rels.length ? `${pct(rels[0])} … ${pct(rels[rels.length - 1])}, médiane ${pct(rels[rels.length >> 1])}` : 'depuis 0';
      const big = g.num.slice().sort((p, q) => Math.abs(q.rel || 1) - Math.abs(p.rel || 1)).slice(0, 2)
        .map(n => `${n.e} ${show(n.x)} → ${show(n.y)}`).join(' ; ');
      console.log(`~ ${key} — ${g.num.length} × (${range}) ; ex. ${big}`);
    }
    if (g.other.length) console.log(`~ ${key} — ${g.other.length} × ; ${g.other.slice(0, 3).join(' ; ')}${g.other.length > 3 ? ' …' : ''}`);
    if (g.added.length) console.log(`+ ${key} — ${g.added.length} × ; ${g.added.slice(0, 3).join(' ; ')}${g.added.length > 3 ? ' …' : ''}`);
    if (g.removed.length) console.log(`- ${key} — ${g.removed.length} × ; ${g.removed.slice(0, 3).join(' ; ')}${g.removed.length > 3 ? ' …' : ''}`);
  }
  console.log(`\n${changed} différence(s) sur ${total} valeurs. Si elles sont voulues : relancer avec --save-baseline.`);
  return 1;
}
