// Audit du Benchmark : chaque personnage contre un autre de même classe et même rôle, au CP plus élevé.
import fs from 'fs';
import { loadApp, bibleFiles } from './harness.mjs';
const { win, A } = await loadApp();
const chars = [];
for (const b of bibleFiles()) {
  try { const c = win.__applyLoadedProfile(JSON.parse(fs.readFileSync(b.file)), b.name, b.region, true); if (c) { c.role = A.detectCharacterRole(c); chars.push(c); } } catch (e) {}
}
const issues = {}; const add = (k, m) => (issues[k] = issues[k] || []).push(m);
let n = 0;
for (const p of chars) {
  const peers = chars.filter(t => t !== p && t.className === p.className && t.role === p.role && (t.cp || 0) > (p.cp || 0));
  const t = peers.sort((a, b) => a.cp - b.cp)[0];
  if (!t) continue;
  n++;
  let res;
  try { res = win.__computeDynamicGapsAndPlan(p, t, null, null, true); } catch (e) { add('throw', `${p.name}→${t.name}: ${e.stack.split('\n').slice(0, 2).join(' | ')}`); continue; }
  const { gaps, plan, rows } = res;
  Object.entries(rows).forEach(([k, r]) => {
    if (![r.delta, r.gapCp, r.cost].every(Number.isFinite)) add('nan-row', `${p.name}→${t.name} ${k} ${JSON.stringify(r)}`);
    if (r.buy < -1e-9) add('buy-neg', `${p.name} ${k} ${r.buy}`);
    if (r.buy > 0.05 && r.cost === 0 && r.fromGpd) add('buy-free', `${p.name} ${k} buy ${r.buy.toFixed(2)} sans coût`);
    if (!r.fromGpd && r.cost > 0 && r.buy > 0) add('estimated-in-plan', `${p.role} ${p.className} ${k}`);
  });
  const sumBuy = Object.values(rows).reduce((s, r) => s + (r.buy > 0 && r.cost > 0 ? r.buy : 0), 0);
  const totGap = Object.values(rows).reduce((s, r) => s + (r.gapCp || 0), 0);
  const cpGap = (t.cp || 0) - (p.cp || 0);
  // Cohérence : somme des écarts par système vs écart réel de CP
  const ratio = cpGap > 20 ? totGap / cpGap : null;
  if (ratio !== null && (ratio < 0.6 || ratio > 1.5)) add('cp-sum', `${p.role} ${p.className} ${p.name}(${Math.round(p.cp)})→${t.name}(${Math.round(t.cp)}) écart réel ${Math.round(cpGap)} vs somme ${Math.round(totGap)}`);
  plan.forEach(s => { if (/NaN|Infinity|undefined/.test(JSON.stringify(s))) add('plan-nan', `${p.name} ${JSON.stringify(s)}`); });
}
for (const [k, v] of Object.entries(issues)) { console.log(`\n## ${k} — ${v.length}`); v.slice(0, 12).forEach(x => console.log('  ' + x)); }
console.log('paires', n);
process.exit(0);
