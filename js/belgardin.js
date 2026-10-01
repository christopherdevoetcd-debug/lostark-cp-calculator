// Brassard T4 (Belgardin) : table de projection et onglet.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// === Brassard T4 (완갑, raid Belgardin) : projection, en attendant les tables du jeu ===
// data/bracer-t4.json (tools/build-bracer-estimate.mjs) : chaque valeur porte sa source (official = note Stove 1225,
// inven = relevé +21, estimate = estimation communautaire KR). Le brassard ne donne ni iLvl, ni qualité, ni points
// d'Ark Passive : il n'entre ni dans l'iLvl du personnage, ni dans le GPD tant que les tables du jeu manquent.
let bracerT4 = null;
async function loadBracerT4() {
  try {
    const res = await fetch('data/bracer-t4.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bracerT4 = await res.json();
    updateBelgardinView();
  } catch (e) {
    console.warn('[BRASSARD] Table du brassard indisponible :', e.message);
  }
}

// Stats du brassard à +level (0 à 25) : stat principale, puissance d'arme, Vitalité, PA fixe, % de PA, source
function calcBracerStats(level) {
  const l = bracerT4 && bracerT4.levels[level];
  return l ? Object.assign({ level }, l) : null;
}

// Attaque du personnage avec le brassard à +level (-1 = sans brassard). Inven #3790814 :
// PA de base = (√(stat × puissance d'arme ÷ 6) + PA fixe) × (1 + % de PA) ; stat du brassard × 1,09 (avatars, ranch),
// puissance d'arme × (1 + % boucles + Karma) comme celle de l'arme.
function bracerAttackState(ctx, apPool, level) {
  const s = level >= 0 ? calcBracerStats(level) : null;
  // Multiplicateur mesuré sur le profil (comme les armures), sinon celui du post Inven (× 1,09)
  const mm = ctx.msMult > 1 ? ctx.msMult : (bracerT4 && bracerT4.mainStatMult) || 1;
  const st = {
    wp: ctx.wp + (s ? s.weaponPower * ctx.wpAmp : 0),
    ms: ctx.ms + (s ? s.mainStat * mm : 0),
    flat: s ? s.flatAp : 0,
    apPct: apPool + (s ? s.apPct / 100 : 0),
    vit: ctx.vit + (s ? s.vitality : 0)
  };
  st.atk = (Math.sqrt(st.wp * st.ms / 6) + st.flat) * (1 + st.apPct);
  return st;
}

/**
 * Ressources pour monter le brassard de +fromLevel à +toLevel : essais attendus par étape (recipeStepCost, taux officiels,
 * règle d'artisan des recettes T4), or, argent, fragments, matériaux, valeur en or au marché (matériaux + or, comme le
 * GPD), et déblocages de rareté franchis. estimate = au moins une étape hors du niveau 1 officiel.
 */
function getBracerHoningCumulativeCost(fromLevel, toLevel) {
  if (!bracerT4 || !(fromLevel >= 0) || !(toLevel <= 25) || fromLevel > toLevel) return null;
  const out = { gold: 0, silver: 0, shards: 0, mats: {}, value: 0, taps: 0, estimate: false, limitBreaks: [] };
  for (let l = fromLevel; l < toLevel; l++) {
    const st = bracerT4.steps[l];
    if (!st) return null;
    const r = recipeStepCost(st);
    out.taps += r.taps;
    out.value += r.cost;
    out.gold += st.gold * r.taps;
    out.silver += st.silver * r.taps;
    out.shards += st.shards * r.taps;
    Object.entries(st.mats).forEach(([slug, n]) => { out.mats[slug] = (out.mats[slug] || 0) + n * r.taps; });
    if (st.src !== 'official') out.estimate = true;
  }
  Object.entries(bracerT4.limitBreak || {}).forEach(([lv, lb]) => {
    // Rareté affichée = après déblocage : un brassard +10 Légendaire a passé le déblocage de +10
    if (fromLevel < +lv && +lv <= toLevel) out.limitBreaks.push(Object.assign({ level: +lv }, lb));
  });
  return out;
}

/**
 * Effet du brassard sur le personnage importé, de +fromLevel (-1 = sans brassard) à +level.
 * DPS : dégâts = 100 × ln(rapport des PA de base), CP = CP × (rapport − 1) (partie type 1 = PA de base × 2,88).
 * Support : buff par supportContribution (canal ap), CP = branche buff × (rapport − 1) + branche défense × (rapport de
 * Vitalité − 1). PV max proportionnels à la Vitalité. null sans personnage lisible ou sans table.
 */
function simulateBracerImpact(charObj, level, isSupport, fromLevel = -1) {
  const ctx = gearStatContext(charObj);
  const p1 = battlePointPartsOf(charObj).find(p => p.type === 1);
  if (!bracerT4 || !ctx || !p1 || !(level >= 0 && level <= 25) || !(fromLevel >= -1 && fromLevel <= level)) return null;
  const apPool = (p1.attackPowerMultiplier || 0) / 100;
  const a = bracerAttackState(ctx, apPool, fromLevel), b = bracerAttackState(ctx, apPool, level);
  const ratio = b.atk / a.atk;
  const vitRatio = a.vit > 0 ? b.vit / a.vit : 1;
  const cp = (charObj.rawProfile && charObj.rawProfile.raidCombatPower) || charObj.cp;
  const levelsUsed = [level, fromLevel].filter(l => l >= 0).map(calcBracerStats);
  const out = {
    level, fromLevel, stats: calcBracerStats(level),
    statsEstimate: levelsUsed.some(s => s.src === 'estimate'),
    hpGainPct: (vitRatio - 1) * 100,
    costs: getBracerHoningCumulativeCost(Math.max(0, fromLevel), level),
    dpsGainPct: null, allyBuffPct: null, cpGain: null
  };
  if (!isSupport) {
    out.dpsGainPct = 100 * Math.log(ratio);
    out.cpGain = cp > 0 ? cp * (ratio - 1) : null;
  } else {
    const inp = supportInputs(charObj);
    out.allyBuffPct = 100 * Math.log(supportContribution(inp, b.wp, b.ms, inp.gemAvg, b.apPct, b.flat) /
      supportContribution(inp, a.wp, a.ms, inp.gemAvg, a.apPct, a.flat));
    const br = supportBpBranches(charObj);
    out.cpGain = br ? br.A * (ratio - 1) + br.D * (vitRatio - 1) : null;
  }
  return out;
}

// === ONGLET PROJECTION BELGARDIN (brassard T4) ===
// Projection sur le personnage importé (simulateBracerImpact). Données officielles et relevé +21 signalés comme tels,
// le reste porte le badge « Estimation communautaire KR ». Pas de ligne GPD tant que les tables du jeu manquent.
const belgState = { level: 10, from: 0 };
const BRACER_GRADES = [
  { min: 20, key: 'ancient', fr: 'Ancien', en: 'Ancient' },
  { min: 15, key: 'relic', fr: 'Relique', en: 'Relic' },
  { min: 10, key: 'legendary', fr: 'Légendaire', en: 'Legendary' },
  { min: 0, key: 'heroic', fr: 'Héroïque', en: 'Heroic' }
];
const bracerGradeOf = level => BRACER_GRADES.find(g => level >= g.min);

function initBelgardinTab() {
  const range = document.getElementById('belgLevel');
  if (!range) return;
  range.addEventListener('input', e => { belgState.level = parseInt(e.target.value, 10) || 0; updateBelgardinView(); });
  document.querySelectorAll('[data-belg-level]').forEach(btn => btn.addEventListener('click', () => {
    belgState.level = parseInt(btn.getAttribute('data-belg-level'), 10) || 0;
    updateBelgardinView();
  }));
  const from = document.getElementById('belgFrom');
  if (from) from.addEventListener('change', e => { belgState.from = parseInt(e.target.value, 10); updateBelgardinView(); });
}

function updateBelgardinView() {
  const results = document.getElementById('belgResults');
  if (!results) return;
  const isEn = isEnLang();
  const isSupport = state.role === 'support';
  const charObj = getCurrentActiveCharacter();
  const fmt = (v, d = 0) => Number(v).toLocaleString(isEn ? 'en-US' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const signed = (v, d = 2) => `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v), d)}`;
  const estBadge = `<span class="belg-src belg-src-est">${isEn ? 'KR community estimate (Inven/Arca)' : 'Estimation communautaire KR (Inven/Arca)'}</span>`;
  const officialBadge = `<span class="belg-src belg-src-off">${isEn ? 'Official (Stove)' : 'Officiel (Stove)'}</span>`;
  const anchorBadge = `<span class="belg-src belg-src-off">${isEn ? 'Published +21 bracer (Inven)' : 'Brassard +21 publié (Inven)'}</span>`;

  const level = Math.min(25, Math.max(0, belgState.level));
  if (belgState.from > level) belgState.from = level === 0 ? -1 : 0;
  const range = document.getElementById('belgLevel');
  if (range) range.value = String(level);
  const out = document.getElementById('belgLevelOut');
  if (out) out.textContent = `+${level}`;
  const grade = bracerGradeOf(level);
  const gradeEl = document.getElementById('belgGrade');
  if (gradeEl) {
    gradeEl.textContent = (window.i18n && window.i18n.t(`bracer_${grade.key}`)) || (isEn ? grade.en : grade.fr);
    gradeEl.className = `belg-grade belg-grade-${grade.key}`;
  }
  document.querySelectorAll('[data-belg-level]').forEach(btn => btn.classList.toggle('active', parseInt(btn.getAttribute('data-belg-level'), 10) === level));
  const fromSel = document.getElementById('belgFrom');
  if (fromSel) {
    const opts = [-1].concat(Array.from({ length: level }, (_, i) => i)).concat(level === 0 ? [0] : []);
    fromSel.innerHTML = opts.map(l => `<option value="${l}"${l === belgState.from ? ' selected' : ''}>${l < 0
        ? (isEn ? 'No bracer' : 'Sans brassard')
        : l === 0 ? (isEn ? '+0 (given on the first Gate 2 clear)' : '+0 (offert au premier clear de la porte 2)') : `+${l}`}</option>`).join('');
  }

  if (!bracerT4) {
    results.innerHTML = `<p class="belg-empty">${isEn ? 'Loading the bracer table…' : 'Chargement de la table du brassard…'}</p>`;
    return;
  }
  const sim = charObj ? simulateBracerImpact(charObj, level, isSupport, belgState.from) : null;
  const stats = calcBracerStats(level);

  // 1. Résultats
  let html = '';
  if (!sim) {
    html += `<p class="belg-empty">${isEn
        ? 'Import a character to project the bracer on its real stats (weapon power, main stat, attack power multiplier, Combat Power).'
        : 'Importe un personnage pour projeter le brassard sur ses vraies stats (puissance d\'arme, stat principale, % de PA, Combat Power).'}</p>`;
  } else {
    const fromTxt = sim.fromLevel < 0 ? (isEn ? 'no bracer' : 'sans brassard') : `+${sim.fromLevel}`;
    const card = (label, value, sub) => `<div class="belg-card"><span class="belg-card-label">${label}</span><span class="belg-card-value">${value}</span>${sub ? `<span class="belg-card-sub">${sub}</span>` : ''}</div>`;
    const cpCard = sim.cpGain === null ? '' : card(isEn ? 'Combat Power' : 'Combat Power', `${signed(sim.cpGain, 0)} CP`,
      isEn ? `in-game CP ${fmt(charObj.rawProfile.raidCombatPower || charObj.cp, 0)}` : `CP en jeu ${fmt(charObj.rawProfile.raidCombatPower || charObj.cp, 0)}`);
    html += `<div class="belg-cards">`;
    if (!isSupport) {
      html += card(isEn ? 'Damage' : 'Dégâts', `${signed(sim.dpsGainPct)} %`, isEn ? 'personal damage, base attack ratio' : 'dégâts personnels, rapport des PA de base') + cpCard;
    } else {
      html += card(isEn ? 'Ally buff' : 'Buff allié', `${signed(sim.allyBuffPct)} %`, isEn ? 'damage of each ally (GPD scale)' : 'dégâts de chaque allié (échelle du GPD)')
        + card(isEn ? 'Max HP' : 'PV max', `${signed(sim.hpGainPct)} %`, isEn ? 'Vitality of the bracer' : 'Vitalité du brassard') + cpCard;
    }
    html += `</div><p class="belg-note">${isEn ? `From ${fromTxt} to +${level}.` : `De ${fromTxt} à +${level}.`} ${sim.statsEstimate ? estBadge : anchorBadge}</p>`;
  }

  // 2. Stats du brassard au niveau choisi
  const ctxB = charObj ? gearStatContext(charObj) : null;
  const measured = !!(ctxB && ctxB.msMult > 1);
  const mm = measured ? ctxB.msMult : (bracerT4.mainStatMult || 1);
  const mmTxt = measured ? (isEn ? 'measured on the profile, like the armors' : 'mesuré sur le profil, comme les armures') : (isEn ? 'avatars and pet ranch, Inven' : 'avatars et ranch, Inven');
  html += `<table class="market-table belg-table"><thead><tr><th>${isEn ? `Bracer +${level}` : `Brassard +${level}`}</th><th>${isEn ? 'Value' : 'Valeur'}</th></tr></thead><tbody>
      <tr><td>${isEn ? 'Main stat' : 'Stat principale'} <span class="belg-dim">(× ${fmt(mm, 3)}, ${mmTxt})</span></td><td class="market-num">${fmt(stats.mainStat)}</td></tr>
      <tr><td>${isEn ? 'Weapon power' : "Puissance d'arme"} <span class="belg-dim">(× ${isEn ? 'earrings and Karma' : 'boucles et Karma'})</span></td><td class="market-num">${fmt(stats.weaponPower)}</td></tr>
      <tr><td>${isEn ? 'Vitality' : 'Vitalité'}</td><td class="market-num">${fmt(stats.vitality)}</td></tr>
      <tr><td>${isEn ? 'Base attack power (flat)' : 'PA de base (fixe)'}</td><td class="market-num">+${fmt(stats.flatAp)}</td></tr>
      <tr><td>${isEn ? 'Base attack power' : 'PA de base'}</td><td class="market-num">+${fmt(stats.apPct, 1)} %</td></tr>
    </tbody></table>
    <p class="belg-note">${stats.src === 'inven' ? anchorBadge : estBadge} ${isEn
      ? 'No item level, quality or Ark Passive points: the character\'s item level stays the average of its 6 pieces.'
      : "Ni iLvl, ni qualité, ni points d'Ark Passive : l'iLvl du personnage reste la moyenne de ses 6 pièces."}</p>`;
  results.innerHTML = html;

  // 3. Plan de stockage
  const costsEl = document.getElementById('belgCosts');
  const fromCost = Math.max(0, belgState.from);
  const cost = getBracerHoningCumulativeCost(fromCost, level);
  if (costsEl) {
    let c = '';
    if (!cost || level === fromCost) {
      c += `<p class="belg-empty">${isEn ? 'No honing between these two levels.' : 'Aucun affinage entre ces deux niveaux.'}</p>`;
    } else {
      const matName = slug => {
        for (const g of MARKET_PRICE_GROUPS) { const it = g.items.find(x => x[0] === slug); if (it) return it[1]; }
        return marketSlugLabel(slug);
      };
      const row = (label, n, cls = '') => `<tr${cls ? ` class="${cls}"` : ''}><td>${label}</td><td class="market-num">${n}</td></tr>`;
      c += `<table class="market-table belg-table"><thead><tr><th>${isEn ? `+${fromCost} → +${level}, expected` : `+${fromCost} → +${level}, moyenne attendue`}</th><th>${isEn ? 'Amount' : 'Quantité'}</th></tr></thead><tbody>`;
      c += row(isEn ? 'Attempts' : 'Essais', fmt(cost.taps, 1));
      c += row(isEn ? 'Gold' : 'Or', fmt(Math.round(cost.gold)));
      c += row(isEn ? 'Silver' : 'Argent', fmt(Math.round(cost.silver)));
      c += row(isEn ? 'Destiny shards' : 'Fragments de destin', fmt(Math.round(cost.shards)));
      Object.entries(cost.mats).forEach(([slug, n]) => { c += row(escapeHtml(matName(slug)), fmt(Math.round(n))); });
      cost.limitBreaks.forEach(lb => {
        const g = bracerGradeOf(lb.level);
        const alt = lb.remnant
          ? (isEn ? `${lb.remnant} Remnants (Normal) or ${lb.deathHand} Hands of Death (Hard / Nightmare)` : `${lb.remnant} 사령의 잔영 (Normal) ou ${lb.deathHand} 죽음의 손 (Hard / Nightmare)`)
          : (isEn ? `${lb.deathHand} Hands of Death only (Hard / Nightmare)` : `${lb.deathHand} 죽음의 손 uniquement (Hard / Nightmare)`);
        c += row(`${isEn ? 'Limit break' : 'Déblocage'} +${lb.level} → ${isEn ? g.en : g.fr} ${officialBadge}`, alt, 'belg-lb-row');
      });
      c += row(`<strong>${isEn ? 'Market value (gold + materials)' : 'Valeur au marché (or + matériaux)'}</strong>`, `<strong>${fmt(Math.round(cost.value))}</strong>`);
      c += `</tbody></table>`;
      c += `<p class="belg-note">${cost.estimate ? estBadge : officialBadge} ${isEn
          ? 'Level 1 cost is official; the other levels follow the Serka recipe (half weapon, half armor) scaled on it. Official success rates, artisan rule of the other T4 recipes (not published for the bracer). Breaths not counted, shards and silver outside the market value, as in the GPD.'
          : "Coût du niveau 1 officiel ; les autres niveaux suivent la recette Serka (moitié arme, moitié armure) recalée dessus. Taux de réussite officiels, règle d'artisan des autres recettes T4 (non publiée pour le brassard). Souffles non comptés, fragments et argent hors valeur au marché, comme dans le GPD."}</p>`;
    }
    // Taux officiels
    const rates = [[1, 5, 15], [6, 10, 10], [11, 15, 5], [16, 20, 3], [21, 25, 1.5]];
    c += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Success rate' : 'Taux de réussite'} ${officialBadge}</th><th></th></tr></thead><tbody>
        ${rates.map(([a, b, p]) => `<tr><td>+${a} → +${b}</td><td class="market-num">${fmt(p, p % 1 ? 1 : 0)} %</td></tr>`).join('')}
      </tbody></table>`;
    costsEl.innerHTML = c;
  }

  // 4. Arbitrage : or par % sur les grandes tranches (estimation, hors GPD)
  const insight = document.getElementById('belgInsight');
  if (insight) {
    let h = `<h3>${isEn ? 'Gold per gain, by tier' : 'Or par gain, par tranche'} ${estBadge}</h3>`;
    if (!charObj) {
      h += `<p class="belg-empty">${isEn ? 'Import a character to price each tier.' : 'Importe un personnage pour chiffrer chaque tranche.'}</p>`;
    } else {
      const unit = isSupport ? (isEn ? 'Gold / 0.01% buff' : 'Or / 0,01 % de buff') : (isEn ? 'Gold / 1% damage' : 'Or / 1 % de dégâts');
      const tiers = [[0, 10], [10, 15], [15, 20], [20, 25]];
      h += `<table class="market-table belg-table"><thead><tr><th>${isEn ? 'Tier' : 'Tranche'}</th><th>${isSupport ? (isEn ? 'Buff' : 'Buff') : (isEn ? 'Damage' : 'Dégâts')}</th><th>CP</th><th>${isEn ? 'Market value' : 'Valeur au marché'}</th><th>${unit}</th></tr></thead><tbody>`;
      tiers.forEach(([a, b]) => {
        const s = simulateBracerImpact(charObj, b, isSupport, a);
        if (!s || !s.costs) return;
        const gain = isSupport ? s.allyBuffPct : s.dpsGainPct;
        const ratio = gain > 0 ? s.costs.value / (isSupport ? gain / 0.01 : gain) : null;
        h += `<tr><td>+${a} → +${b}</td><td class="market-num">${signed(gain)} %</td><td class="market-num">${s.cpGain === null ? '—' : signed(s.cpGain, 0)}</td>
            <td class="market-num">${fmt(Math.round(s.costs.value))}</td><td class="market-num">${ratio === null ? '—' : fmt(Math.round(ratio))}</td></tr>`;
      });
      h += `</tbody></table>`;
      h += `<p class="belg-note">${isEn
          ? 'Projection only: the bracer is not in the Smart Advisor or the GPD until the game tables are published (Maxroll feed). Limit break materials are raid drops, not priced.'
          : "Projection seulement : le brassard n'entre ni dans le Smart Advisor ni dans le GPD tant que les tables du jeu ne sont pas publiées (flux Maxroll). Les matériaux de déblocage viennent du raid, non chiffrés."}</p>`;
    }
    h += `<p class="belg-note">${isEn
        ? 'KR community figures for comparison: +6.21 % damage at +10 and +19.05 % at +25 (kakao.gg guide), at least +6.37 % for +10 on a 1800 character (Inven #3954479, about 1.6 M gold in all: 363 k gold, 122 k guardian and 40 k destruction crystals, half our estimate). They do not say from which state they count; our low levels are estimated, so the +0 → +10 tier is the least reliable.'
        : "Repères de la communauté KR : +6,21 % de dégâts à +10 et +19,05 % à +25 (guide kakao.gg), au moins +6,37 % pour +10 sur un personnage 1800 (Inven #3954479, environ 1,6 M d'or en tout : 363 k d'or, 122 k pierres de gardien et 40 k de destruction cristallisées, moitié moins que notre estimation). Ils ne disent pas depuis quel état ils comptent ; nos niveaux bas sont estimés, la tranche +0 → +10 est donc la moins sûre."}</p>`;
    insight.innerHTML = h;
  }
}
