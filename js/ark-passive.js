// Onglet 4 : simulateur Ark Passive.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- 4b. SIMULATEUR ARK PASSIVE T4 (ÉVOLUTION / ÉCLAIRAGE / BOND) ---
// Modèle du jeu : chaque arbre est une partie du Battle Point (type 5 Évolution, 6 Éclairage, 7 Bond) qui vaut
// « valeur par point × points dépensés » en 0,01 %, multiplicateur 1 + valeur ÷ 10 000 (vérifié sur les 70 profils :
// DPS 75 / 70 / 20, support 160 / 72 / 20 par point). L'Évolution ne compte que ses paliers 1 à 4 (100 points) :
// les 40 points du palier 0 sont des stats de combat (Crit / Spécialisation / Célérité), dans la partie stats de combat.
// Les nœuds choisis ne changent pas le CP. Le support porte ces parties sur sa branche buff.
const ARK_TREES = [
  { key: 'evolution', type: 5, max: 100 },
  { key: 'enlightenment', type: 6, max: 100 },
  { key: 'leap', type: 7, max: 70 }
];

const arkPassiveState = {
  model: null,
  sim: { evolution: 0, enlightenment: 0, leap: 0 },
  lastResult: null
};

/**
 * Ark Passive réel d'un personnage, lu sur son Battle Point : par arbre, points dépensés et valeur par point
 * (celle du profil, sinon la table du jeu du mode du Battle Point). CP de base = CP raid, part du CP portée
 * par ces parties (DPS : tout le CP ; support : branche buff). null sans Battle Point lisible.
 */
function arkPassiveModel(c) {
  if (!c) return null;
  const parts = battlePointPartsOf(c);
  const t1 = parts.find(p => p.type === 1);
  if (!t1 || !(t1.value > 0)) return null;
  const raw = c.rawProfile || {};
  const bp = raw.battlePoint || (raw.loadout && raw.loadout.battlePoint) || {};
  const isSupport = typeof bp.isSupport === 'boolean' ? bp.isSupport : c.role === 'support';
  const cp = raidCombatPowerOf(c) || c.cp;
  if (!(cp > 0)) return null;
  let share = 1;
  if (isSupport) {
    const br = supportBpBranches(c);
    if (!br) return null;
    share = br.A / (br.A + br.D);
  }
  const trees = {};
  ARK_TREES.forEach(t => {
    const part = parts.find(p => p.type === t.type);
    const spent = part && Number.isFinite(part.pointsSpent) ? part.pointsSpent : 0;
    const table = isSupport
      ? (bpSupportTable && bpSupportTable[t.type] && bpSupportTable[t.type][0] && bpSupportTable[t.type][0][0])
      : (arkGridBp && arkGridBp.arkPassive && arkGridBp.arkPassive[t.type]);
    const rate = part && spent > 0 && part.value > 0 ? part.value / spent : table;
    trees[t.key] = { spent, rate: rate || 0, max: Math.max(t.max, spent), value: part ? part.value || 0 : 0 };
  });
  return { cp, share, isSupport, trees };
}

/**
 * CP projeté pour une répartition de points : la part des parties Ark Passive (tout le CP d'un DPS, la branche buff
 * d'un support) est multipliée par le rapport des multiplicateurs simulés et actuels. Par arbre : part du CP qu'il
 * porte (CP perdu à 0 point) et écart au profil.
 */
function calcArkPassive(model, sim) {
  const mult = v => 1 + v / 1e4;
  const base = model.cp * model.share;
  const out = { trees: {}, isSupport: model.isSupport };
  let ratio = 1, prodSim = 1, prodMax = 1;
  ARK_TREES.forEach(t => {
    const tr = model.trees[t.key];
    const pts = Math.max(0, Math.min(tr.max, sim[t.key]));
    const vSim = tr.rate * pts, vCur = tr.value;
    ratio *= mult(vSim) / mult(vCur);
    prodSim *= mult(vSim);
    prodMax *= mult(tr.rate * tr.max) / mult(vCur);
    out.trees[t.key] = { pts, max: tr.max, rate: tr.rate, value: vSim, diff: base * (mult(vSim) / mult(vCur) - 1) };
  });
  const projectedCp = model.cp + base * (ratio - 1);
  // Part de chaque arbre dans le CP projeté : ce qu'on perdrait à 0 point
  const projBase = base * ratio;
  ARK_TREES.forEach(t => { const r = out.trees[t.key]; r.cp = projBase * (1 - 1 / mult(r.value)); });
  out.projectedCp = projectedCp;
  out.diffCp = projectedCp - model.cp;
  out.globalMult = (prodSim - 1) * 100;
  out.totalAllocated = ARK_TREES.reduce((s, t) => s + out.trees[t.key].pts, 0);
  out.pointsCap = ARK_TREES.reduce((s, t) => s + model.trees[t.key].max, 0);
  out.maxCp = model.cp + base * (prodMax - 1);
  return out;
}

function resetArkPassiveSim() {
  const m = arkPassiveState.model;
  ARK_TREES.forEach(t => { arkPassiveState.sim[t.key] = m ? m.trees[t.key].spent : 0; });
}

function updateArkPassiveView() {
  if (!dom.tabArkPassivePane) return;
  const isEn = isEnLang();
  const curChar = getCurrentActiveCharacter();
  const charKey = curChar ? (curChar.id || curChar.name) : null;
  // Nouveau personnage : modèle relu et points remis à ceux du profil
  if (!arkPassiveState.model || arkPassiveState.model.charKey !== charKey) {
    const m = arkPassiveModel(curChar);
    arkPassiveState.model = m ? Object.assign(m, { charKey }) : null;
    resetArkPassiveSim();
  }
  const model = arkPassiveState.model;
  if (dom.arkCharName) dom.arkCharName.textContent = curChar ? curChar.name : (isEn ? 'No character' : 'Aucun personnage');
  if (dom.arkCharStats) {
    dom.arkCharStats.textContent = model
      ? `${(curChar.ilvl || state.currentIlvl).toFixed(2)} iLvl • ${formatNumber(Math.round(model.cp))} CP`
      : '—';
  }
  const sim = arkPassiveState.sim;
  const ui = {
    evolution: { slider: dom.sliderArkEvoPoints, num: dom.numArkEvoPoints, disp: dom.dispArkEvoPoints, badge: dom.arkEvoTierBadge, mult: dom.dispArkEvoMult, cp: dom.dispArkEvoCp },
    enlightenment: { slider: dom.sliderArkEnlightPoints, num: dom.numArkEnlightPoints, disp: dom.dispArkEnlightPoints, badge: dom.arkEnlightTierBadge, mult: dom.dispArkEnlightMult, cp: dom.dispArkEnlightCp },
    leap: { slider: dom.sliderArkLeapPoints, num: dom.numArkLeapPoints, disp: dom.dispArkLeapPoints, badge: dom.arkLeapTierBadge, mult: dom.dispArkLeapMult, cp: dom.dispArkLeapCp }
  };
  const setText = (el, txt) => { if (el) el.textContent = txt; };
  if (dom.btnApplyArkToSim) dom.btnApplyArkToSim.disabled = !model;

  if (!model) {
    arkPassiveState.lastResult = null;
    Object.values(ui).forEach(u => {
      [u.slider, u.num].forEach(el => { if (el) el.disabled = true; });
      setText(u.disp, '—'); setText(u.badge, '—'); setText(u.mult, '—'); setText(u.cp, '—');
    });
    ['arkResTotalCp', 'arkResDiffCp', 'arkResGlobalMult', 'arkResBuffDetail', 'arkResTotalPoints', 'arkResPointsCap', 'arkResEfficiency', 'arkResAdviceText']
      .forEach(k => setText(dom[k], '—'));
    setText(dom.arkSummaryRoleBadge, isEn ? 'Game Battle Point' : 'Battle Point du jeu');
    setText(dom.arkAnalysisText, isEn
      ? 'Import a character: the simulator reads its Ark Passive points and their value on the game Battle Point of its profile.'
      : 'Importez un personnage : le simulateur lit ses points d\'Ark Passive et leur valeur sur le Battle Point du jeu de son profil.');
    updateAstrogemGraderView();
    return;
  }

  const res = calcArkPassive(model, sim);
  arkPassiveState.lastResult = res;
  const fmtPct = v => `${(v / 100).toFixed(2)}%`;
  const signed = v => `${v >= 0 ? '+' : '−'}${formatNumber(Math.abs(Math.round(v)))}`;
  setText(dom.arkSummaryRoleBadge, model.isSupport
    ? (isEn ? 'Support Battle Point (buff branch)' : 'Battle Point support (branche buff)')
    : (isEn ? 'DPS Battle Point' : 'Battle Point DPS'));

  ARK_TREES.forEach(t => {
    const u = ui[t.key], r = res.trees[t.key], tr = model.trees[t.key];
    [u.slider, u.num].forEach(el => { if (el) { el.disabled = false; el.max = r.max; el.value = r.pts; } });
    setText(u.disp, `${r.pts} / ${r.max} pts`);
    setText(u.badge, isEn
      ? `${tr.rate.toFixed(0)} BP / point${t.key === 'evolution' ? ' (tiers 1-4)' : ''}`
      : `${tr.rate.toFixed(0)} BP / point${t.key === 'evolution' ? ' (paliers 1 à 4)' : ''}`);
    setText(u.mult, `+${fmtPct(r.value)}`);
    if (u.cp) {
      const d = Math.round(r.diff);
      u.cp.innerHTML = d !== 0
        ? `${formatNumber(Math.round(r.cp))} CP <span class="tree-delta-pill ${d > 0 ? 'pos' : 'neg'}">(${signed(d)} CP)</span>`
        : `${formatNumber(Math.round(r.cp))} CP`;
    }
  });

  setText(dom.arkResTotalCp, `${formatNumber(Math.round(res.projectedCp))} CP`);
  setText(dom.arkResDiffCp, isEn ? `${signed(res.diffCp)} CP vs current profile` : `${signed(res.diffCp)} CP vs profil actuel`);
  setText(dom.arkResGlobalMult, `+${res.globalMult.toFixed(2)}%`);
  setText(dom.arkResBuffDetail, ARK_TREES.map(t => `×${(1 + res.trees[t.key].value / 1e4).toFixed(2)}`).join(' · ')
    + (model.isSupport ? (isEn ? ` on ${Math.round(model.share * 100)}% of CP` : ` sur ${Math.round(model.share * 100)} % du CP`) : ''));
  setText(dom.arkResTotalPoints, `${res.totalAllocated} Pts`);
  setText(dom.arkResPointsCap, isEn
    ? `Max ${res.pointsCap} pts (+ 40 Evolution tier 0 combat-stat points)`
    : `Max ${res.pointsCap} pts (+ 40 pts de stats au palier 0 d'Évolution)`);
  const missing = Math.max(0, res.maxCp - res.projectedCp);
  setText(dom.arkResEfficiency, missing >= 0.5 ? `+${formatNumber(Math.round(missing))} CP` : (isEn ? 'Maxed' : 'Au maximum'));
  setText(dom.arkResAdviceText, isEn ? 'left to gain at max points' : 'à gagner au maximum des points');

  const lines = ARK_TREES.filter(t => res.trees[t.key].pts < res.trees[t.key].max).map(t => {
    const r = res.trees[t.key];
    const name = { evolution: isEn ? 'Evolution' : 'Évolution', enlightenment: isEn ? 'Enlightenment' : 'Éclairage', leap: isEn ? 'Leap' : 'Bond' }[t.key];
    return `${name} ${r.max - r.pts} pts`;
  });
  const rule = isEn
    ? `The game Battle Point counts every point spent (${ARK_TREES.map(t => model.trees[t.key].rate.toFixed(0)).join(' / ')} per point, in 0.01%), whatever the nodes chosen; Evolution only counts tiers 1 to 4.`
    : `Le Battle Point du jeu compte chaque point dépensé (${ARK_TREES.map(t => model.trees[t.key].rate.toFixed(0)).join(' / ')} par point, en 0,01 %), quels que soient les nœuds choisis ; l'Évolution ne compte que ses paliers 1 à 4.`;
  setText(dom.arkAnalysisText, lines.length
    ? (isEn ? `Points not spent: ${lines.join(', ')}. ` : `Points non dépensés : ${lines.join(', ')}. `) + rule
    : (isEn ? 'All Ark Passive points are spent. ' : 'Tous les points d\'Ark Passive sont dépensés. ') + rule);

  updateAstrogemGraderView();
}

function initArkPassiveEvents() {
  const bind = (key, slider, num) => {
    const set = v => {
      const m = arkPassiveState.model;
      const max = m ? m.trees[key].max : 0;
      arkPassiveState.sim[key] = Math.min(max, Math.max(0, parseInt(v, 10) || 0));
      updateArkPassiveView();
    };
    if (slider) slider.addEventListener('input', e => set(e.target.value));
    if (num) num.addEventListener('change', e => set(e.target.value));
  };
  bind('evolution', dom.sliderArkEvoPoints, dom.numArkEvoPoints);
  bind('enlightenment', dom.sliderArkEnlightPoints, dom.numArkEnlightPoints);
  bind('leap', dom.sliderArkLeapPoints, dom.numArkLeapPoints);

  if (dom.btnArkResetCurrent) {
    dom.btnArkResetCurrent.addEventListener('click', () => { resetArkPassiveSim(); updateArkPassiveView(); });
  }
  if (dom.btnArkPresetMax) {
    dom.btnArkPresetMax.addEventListener('click', () => {
      const m = arkPassiveState.model;
      if (m) ARK_TREES.forEach(t => { arkPassiveState.sim[t.key] = m.trees[t.key].max; });
      updateArkPassiveView();
    });
  }

  // Injecter dans le Prédicteur
  if (dom.btnApplyArkToSim) {
    dom.btnApplyArkToSim.addEventListener('click', () => {
      if (!arkPassiveState.lastResult) return;
      const newCp = Math.round(arkPassiveState.lastResult.projectedCp);
      state.currentCp = newCp;
      if (dom.numCurrentCp) dom.numCurrentCp.value = newCp;
      if (dom.sliderCurrentCp) dom.sliderCurrentCp.value = newCp;

      dom.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-predictor'));
      dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === 'tab-predictor'));

      updatePredictorView();
      updateActiveCharacterCard(activeCharacterId);

      const origHtml = dom.btnApplyArkToSim.innerHTML;
      dom.btnApplyArkToSim.innerHTML = `<span>${isEnLang() ? 'CP applied' : 'CP injecté'} (${formatNumber(newCp)} CP).</span>`;
      setTimeout(() => { dom.btnApplyArkToSim.innerHTML = origHtml; }, 2000);
    });
  }
}
