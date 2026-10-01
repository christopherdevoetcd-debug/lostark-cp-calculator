// Audit automatique : chaque personnage en cache passe par le vrai chemin d'import, puis contrôles d'invariants.
import fs from 'fs';
import { loadApp, bibleFiles, CACHE } from './harness.mjs';
const sample = JSON.parse(fs.readFileSync(new URL('./sample.json', import.meta.url)));
const expect = {};
sample.forEach(s => { expect[`${s.region}_${s.name}`] = s; });
const { win, logs, A } = await loadApp();
const loseiiDps = JSON.parse(fs.readFileSync(CACHE + '/loseii/rows-dps.json')).rows;
const loseiiSup = JSON.parse(fs.readFileSync(CACHE + '/loseii/rows.json')).rows;
const report = [];
const only = process.argv[2];
for (const b of bibleFiles()) {
  if (only && b.name !== only) continue;
  const issues = [];
  const add = (sev, code, msg) => issues.push({ sev, code, msg });
  const exp = expect[`${b.region}_${b.name}`] || {};
  let c;
  try {
    const json = JSON.parse(fs.readFileSync(b.file));
    c = win.__applyLoadedProfile(json, b.name, b.region, true);
  } catch (e) { report.push({ name: b.name, issues: [{ sev: 'ERR', code: 'import-throw', msg: e.message }] }); continue; }
  if (!c) { report.push({ name: b.name, issues: [{ sev: 'ERR', code: 'import-null', msg: 'profil non importé' }] }); continue; }
  const role = A.detectCharacterRole(c);
  const isSup = role === 'support';
  const raw = c.rawProfile || {};
  const bp = raw.battlePoint || (raw.loadout && raw.loadout.battlePoint) || {};
  const out = { name: b.name, region: b.region, cls: c.className, role, expRole: exp.role, ilvl: c.ilvl, cp: c.cp || c.inGameScore,
    bpSupport: bp.isSupport, rebuilt: !!bp.rebuiltSupport, issues, rows: [] };
  if (exp.role && exp.role !== '?' && exp.role !== role) add('HIGH', 'role-mismatch', `rôle ${role}, classement ${exp.role}`);
  if (typeof bp.isSupport === 'boolean' && bp.isSupport !== isSup) add('MED', 'bp-mode', `Battle Point en mode ${bp.isSupport ? 'support' : 'dps'} pour un ${role}`);
  if (A.hasMixedRaidProfile(c, role)) add('MED', 'mixed', 'profil mélangé');
  if (A.hasIncompleteBattlePoint(c, role)) add('INFO', 'bp-incomplete', 'Battle Point incomplet ' + A.battlePointCoherence(c, role).toFixed(2));
  if (!(raw.raidCombatPower > 0)) add('MED', 'no-raid-cp', 'pas de CP raid');

  // --- GPD ---
  let rows = [];
  try { rows = A.getDynamicGpdTable(c, role, true); } catch (e) { add('ERR', 'gpd-throw', e.stack.split('\n').slice(0, 3).join(' | ')); }
  out.rows = rows.map(r => ({ id: r.id, gain: r.gainVal, cost: r.cost, ratio: r.ratioVal, tier: r.tier, name: r.name }));
  rows.forEach(r => {
    if (!Number.isFinite(r.gainVal) || !Number.isFinite(r.cost)) add('HIGH', 'nan', `${r.id} gain ${r.gainVal} coût ${r.cost}`);
    const maxGain = isSup ? 2.5 : 6;
    if (r.gainVal > maxGain && !/gems_|relic_/.test(r.id)) add('MED', 'gain-high', `${r.id} +${r.gainVal}% pour ${r.cost} g`);
    if (r.cost < 5000 && r.id !== 'dyn_karma') add('MED', 'cost-low', `${r.id} ${r.cost} g`);
  });
  const ids = new Set(rows.map(r => r.id));
  const sys = A.extractPlayerSystems(c, true);
  // Chemins de repli (anciens barèmes) : à signaler
  try {
    if (A.honingDpsGain(c, 'weapon', sys.weapon.isSerka, isSup) === null && ids.has('dyn_weapon')) add('HIGH', 'fallback-weapon', 'gain arme sur ancien barème');
    if (A.honingDpsGain(c, 'armor', sys.armors.isSerka, isSup) === null && ids.has('dyn_armor')) add('HIGH', 'fallback-armor', 'gain armures sur ancien barème');
  } catch (e) { add('ERR', 'honing-throw', e.message); }
  if (!A.realGemLevels(c)) add('HIGH', 'fallback-gems', 'gemmes non lues (ancien barème)');
  if (!A.astrogemGridBand(c, isSup)) add('MED', 'no-astro', 'astrogemmes non notées');
  if (!A.braceletGpdStep(c, isSup) && !ids.has('dyn_brac')) add('LOW', 'no-brac-row', 'pas de ligne bracelet');
  if (!A.getAbilityStone(c)) add('LOW', 'no-stone', 'pierre non lue');
  if (!isSup && !ids.has('dyn_quality')) { const q = A.weaponQualityUpgrade(c); const qq = (A.battlePointPartsOf(c).find(p => p.type === 4) || {}).quality; if (q === null && qq !== 100) add('LOW', 'no-quality', 'pas de ligne qualité (' + qq + ')'); }
  const acc = A.evaluateCharacterAccessories(c, isSup, true);
  if (!acc.slotLines) add('HIGH', 'no-acc', 'bijoux non lus');
  // Cœurs : table Battle Point ou ancien barème
  const coreIds = A.getArkGridCoreIds(c);
  rows.filter(r => r.id.startsWith('dyn_core_')).forEach(r => {
    const k = r.id.replace('dyn_core_', ''); const core = coreIds[k];
    if (!isSup && !(core && A.arkGridBp && A.arkGridBp.dps[core.id]) && !(core && String(core.id).startsWith('673121'))) add('MED', 'fallback-core', `${k} id ${core && core.id} hors table`);
  });
  // Comparaison avec les lignes de référence de Loseii (même pas, autre personnage : ordre de grandeur)
  const ref = isSup ? loseiiSup : loseiiDps;
  rows.forEach(r => {
    let lr = null;
    if (r.id === 'dyn_weapon' || r.id === 'dyn_armor') {
      const ser = r.id === 'dyn_weapon' ? 'weapon' : 'armor';
      const m = r.name.match(/\+(\d+)/); const to = m && +m[1];
      lr = ref.find(x => x.series === ser && x.label === `+${to - 1} → +${to}`);
    }
    if (lr && lr.damage > 0 && sys[r.id === 'dyn_weapon' ? 'weapon' : 'armors'].isSerka) {
      const g = r.gain / lr.damage, k = r.cost / lr.gold;
      if (g > 2 || g < 0.5) add('MED', 'vs-loseii-gain', `${r.id} gain ${r.gain} vs Loseii ${lr.damage.toFixed(2)}`);
      out.rows.find(x => x.id === r.id).loseii = { gain: lr.damage, gold: lr.gold, costRatio: +k.toFixed(2) };
    }
  });
  // --- Smart Advisor : lignes perdues ---
  try {
    const master = A.buildMasterGpdData(c, isSup, true);
    const mids = new Set(master.map(m => m.id));
    rows.forEach(r => { if (!mids.has(r.id)) add('MED', 'advisor-drop', `${r.id} absent du Smart Advisor`); });
    if (master.length && rows.length && master[0].id !== rows[0].id) add('LOW', 'advisor-order', `1er GPD ${rows[0].id}, 1er Advisor ${master[0].id}`);
  } catch (e) { add('ERR', 'advisor-throw', e.message); }
  // --- Feuille de route : chaque objectif atteignable, étapes valides ---
  try {
    const master = A.buildMasterGpdData(c, isSup, true);
    for (const goal of (isSup ? [0.5, 2] : [100, 500])) {
      const road = A.buildGpdRoadmap(c, isSup, true, master, goal);
      road.plan.forEach(r => { if (!(r.cost > 0) || !(r.dmgGain > 0) || !Number.isFinite(r.rate)) add('HIGH', 'road-step', `${r.id} ${r.cost} ${r.dmgGain}`); });
      const ark = new Set(road.plan.filter(r => r.category === 'arkGrid').map(r => r.chain));
      if (ark.size > 1) add('HIGH', 'road-ark-both', [...ark].join(','));
      if (!road.reached) add('LOW', 'road-unreached', `objectif ${goal} : ${road.cum.toFixed(2)} en ${road.plan.length} étapes`);
      out['road' + goal] = { n: road.plan.length, gold: Math.round(road.gold), cum: +road.cum.toFixed(2) };
    }
  } catch (e) { add('ERR', 'road-throw', e.stack.split('\n').slice(0, 2).join(' | ')); }
  // --- Fiche et cartes ---
  try {
    A.updateActiveCharacterCard(c.id, c);
    const t = id => { const el = win.document.getElementById(id); return el ? el.textContent.trim() : null; };
    out.cards = { acc: [t('scoreAccGrade'), t('scoreAccPct')], brac: [t('scoreBrGrade'), t('scoreBrScore'), t('scoreBrPct')], astro: [t('scoreAgGrade'), t('scoreAgScore'), t('scoreAgPct')] };
    const g = A.astrogemGridBand(c, isSup);
    if (g && Math.abs(parseFloat(out.cards.astro[1]) - g.mean) > 0.06) add('MED', 'astro-card', `carte ${out.cards.astro[1]} vs GPD ${g.mean.toFixed(1)}`);
    const bb = A.braceletBandOf(c, isSup);
    if (bb && out.cards.brac[1] !== bb.score.toFixed(1)) add('MED', 'brac-card', `carte ${out.cards.brac[1]} vs GPD ${bb.score.toFixed(1)}`);
    const pieces = A.buildPieceByPieceData(c, isSup, true);
    const pb = pieces.find(p => /Bracelet/.test(p.name));
    if (bb && pb && !pb.ladder.includes(bb.score.toFixed(1))) add('MED', 'brac-piece', `pièce ${pb.ladder} vs ${bb.score.toFixed(1)}`);
  } catch (e) { add('ERR', 'card-throw', e.stack.split('\n').slice(0, 2).join(' | ')); }
  report.push(out);
}
fs.writeFileSync(new URL('./report.json', import.meta.url), JSON.stringify(report, null, 1));
const byCode = {};
report.forEach(r => r.issues.forEach(i => { (byCode[i.sev + ' ' + i.code] = byCode[i.sev + ' ' + i.code] || []).push(`${r.name}(${r.cls || '?'}/${r.role || '?'}): ${i.msg}`); }));
for (const [k, v] of Object.entries(byCode).sort()) { console.log(`\n## ${k} — ${v.length}`); v.slice(0, 8).forEach(x => console.log('  ' + x)); }
console.log('\npersos', report.length, 'logs page', logs.filter(l => l[0] !== 'jsdomError').slice(0, 5));
process.exit(0);
