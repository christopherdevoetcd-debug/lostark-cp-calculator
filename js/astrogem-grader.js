// Évaluateur d'astrogemmes (module de Loseii).
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- MODULE ÉVALUATEUR & GRADER DE GEMMES ASTRALES (ARK GRID / LOSEII) ---



const astrogemState = {
  baseCost: 8,
  willpowerLevel: 5,
  orderLevel: 5,
  effect1: 'brand',
  effect1Level: 5,
  effect2: 'ally_dmg',
  effect2Level: 5
};

// Clés de l'évaluateur → noms d'effets de astrogem.js
const ASTRO_EFFECT_LOSEII = { atk_power: 'Attack Power', add_dmg: 'Additional Damage', boss_dmg: 'Boss Damage',
  ally_dmg: 'Ally Damage Enh.', brand: 'Brand Power', ally_ap: 'Ally Attack Enh.' };

const signedPct = v => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(2)}%`;

function evaluateAstrogem(config, role) {
  const isSupport = role === 'support';
  const effectiveCost = config.baseCost - config.willpowerLevel;
  const levelSum = config.willpowerLevel + config.orderLevel + config.effect1Level + config.effect2Level;

  const isEn = isEnLang();
  let rarity = isEn ? 'Legendary' : 'Légendaire';
  let rarityClass = 'legendary';
  if (levelSum >= 19) {
    rarity = isEn ? 'Ancient' : 'Ancien';
    rarityClass = 'ancient';
  } else if (levelSum >= 16) {
    rarity = isEn ? 'Relic' : 'Relique';
    rarityClass = 'relic';
  }

  let grade = 0;
  let realGain = 0;
  let realGainText = '';
  let isRainbow = false;

  if (!isSupport) {
    const d = ASTROGEM_DATA.dps;
    function getDpsEffScore(eff, lvl) {
      if (eff === 'atk_power') return lvl * d.atkPerLvl;
      if (eff === 'add_dmg') return lvl * d.addPerLvl;
      if (eff === 'boss_dmg') return lvl * d.bossPerLvl;
      return 0;
    }
    const eff1Score = getDpsEffScore(config.effect1, config.effect1Level);
    const eff2Score = getDpsEffScore(config.effect2, config.effect2Level);
    const orderScore = (config.orderLevel - 4) * d.orderPerPoint;
    const wpCredit = d.wpCredit[effectiveCost] !== undefined ? d.wpCredit[effectiveCost] : 0;
    const val = eff1Score + eff2Score + orderScore + wpCredit;

    grade = 100 * (val - d.bounds.min) / (d.anchor - d.bounds.min);
    grade = Math.round(Math.max(0, Math.min(110, grade)) * 10) / 10;

    const rawD = eff1Score + eff2Score + orderScore;
    realGain = (Math.exp(rawD / 100) - 1) * 100;
    realGainText = `${signedPct(realGain)} DPS`;

    const top2 = config.baseCost === 8 ? ['add_dmg', 'atk_power'] : (config.baseCost === 9 ? ['boss_dmg', 'atk_power'] : ['boss_dmg', 'add_dmg']);
    isRainbow = config.willpowerLevel === 5 && config.orderLevel === 5 && config.effect1Level === 5 && config.effect2Level === 5 &&
      top2.includes(config.effect1) && top2.includes(config.effect2);

  } else {
    const s = ASTROGEM_DATA.support;
    function getSupEffScore(eff, lvl) {
      if (eff === 'ally_ap') return lvl * s.allyApPerLvl;
      if (eff === 'brand') return lvl * s.brandPerLvl;
      if (eff === 'ally_dmg') return lvl * s.allyDmgPerLvl;
      return 0;
    }
    const eff1Score = getSupEffScore(config.effect1, config.effect1Level);
    const eff2Score = getSupEffScore(config.effect2, config.effect2Level);
    const wpCredit = s.wpCredit[effectiveCost] !== undefined ? s.wpCredit[effectiveCost] : 0;
    const val = eff1Score + eff2Score + s.orderPerPoint * config.orderLevel + wpCredit;

    grade = 100 * (val - s.bounds.min) / (s.anchor - s.bounds.min);
    grade = Math.round(Math.max(0, Math.min(110, grade)) * 10) / 10;

    // Buff de chaque allié (unité du GPD), ordre 0,0769 ÷ 3 par point (SUPPORT_SCORING de Loseii)
    const allyBuff = eff1Score + eff2Score + config.orderLevel * 0.0769 / 3;
    realGainText = `${signedPct(allyBuff)} Buff`;

    const top2 = config.baseCost === 8 ? ['brand', 'ally_dmg'] : (config.baseCost === 9 ? ['ally_ap', 'ally_dmg'] : ['ally_ap', 'brand']);
    isRainbow = config.willpowerLevel === 5 && config.orderLevel === 5 && config.effect1Level === 5 && config.effect2Level === 5 &&
      top2.includes(config.effect1) && top2.includes(config.effect2);
  }

  // Modèle de Loseii (astrogem.js, chargé pour le GPD) quand il est là : note, gain et échelle de rangs de son évaluateur
  const AG = window.Astrogem;
  let ladder = null;
  if (AG && AG.grade && AG.supportGrade && AG.rankFromGrade) {
    const cfg = { baseCost: config.baseCost, willpowerLevel: config.willpowerLevel, orderLevel: config.orderLevel,
      effect1: ASTRO_EFFECT_LOSEII[config.effect1], effect1Level: config.effect1Level,
      effect2: ASTRO_EFFECT_LOSEII[config.effect2], effect2Level: config.effect2Level };
    try {
      if (!AG.validateConfig || AG.validateConfig(cfg).valid) {
        grade = isSupport ? AG.supportGrade(cfg) : AG.grade(cfg);
        realGainText = isSupport ? `${signedPct(AG.supportDamage(cfg))} Buff` : `${signedPct(AG.damagePercent(cfg))} DPS`;
        ladder = isSupport ? AG.SUPPORT_RANK_LADDER : AG.RANK_LADDER;
      }
    } catch (e) { /* repli sur le calcul interne */ }
  }
  // Échelle de Loseii (RANK_LADDER / SUPPORT_RANK_LADDER)
  ladder = ladder || [
    ["S+", isSupport ? 94.6 : 96.1], ["S", 93.3], ["S-", 90.0],
    ["A+", 86.7], ["A", 83.3], ["A-", 80.0],
    ["B+", 76.7], ["B", 73.3], ["B-", 70.0],
    ["C+", 66.7], ["C", 63.3], ["C-", 60.0],
    ["D+", 56.7], ["D", 53.3], ["D-", 50.0],
    ["F+", 33.3], ["F", 16.7], ["F-", 0]
  ];
  let rank = "F-";
  for (const [r, cut] of ladder) {
    if (grade >= cut) { rank = r; break; }
  }

  let rankClass = 'rank-f';
  if (rank.startsWith('S+')) rankClass = 'rank-s-plus';
  else if (rank.startsWith('S')) rankClass = 'rank-s';
  else if (rank.startsWith('A')) rankClass = 'rank-a';
  else if (rank.startsWith('B')) rankClass = 'rank-b';
  else if (rank.startsWith('C')) rankClass = 'rank-c';
  else if (rank.startsWith('D')) rankClass = 'rank-d';

  let viabilityText = '';
  let viabilitySub = '';
  let costClass = 'optimal';
  if (effectiveCost <= 3) {
    viabilityText = isEn ? 'Optimal (17p)' : 'Optimal (17p)';
    viabilitySub = isEn ? 'Core pillar for 17-point threshold' : 'Pilier de cœur à 17 points';
    costClass = 'optimal';
  } else if (effectiveCost <= 5) {
    viabilityText = isEn ? 'Viable (17p)' : 'Viable (17p)';
    viabilitySub = isEn ? 'Fits into a 17-point core' : 'S\'insère dans un cœur 17 pts';
    costClass = 'standard';
  } else {
    viabilityText = isEn ? 'Too Heavy' : 'Trop Lourd';
    viabilitySub = isEn ? 'Penalizes the 17-point threshold' : 'Pénalise le palier 17 points';
    costClass = 'expensive';
  }

  let explanation = '';
  if (grade >= 96) {
    explanation = isEn
      ? `Top grade (Tier ${rank}, ${rarity}). With an effective cost of ${effectiveCost} point(s) and optimized major lines, this gem is worth keeping to maximize Ark Grid major passives.`
      : `Note maximale (Rang ${rank}, ${rarity}). Avec un coût effectif de ${effectiveCost} point(s) et des lignes majeures optimisées, cette gemme est à garder pour maximiser les passifs majeurs de l'Ark Grid.`;
  } else if (grade >= 80) {
    explanation = isEn
      ? `Strong Relic gem (Tier ${rank}). Powerful synergies and its effective cost (${effectiveCost} pts) seamlessly fit into the 17-point core grid.`
      : `Gemme Relique solide (Rang ${rank}). Les synergies sont puissantes et son coût effectif (${effectiveCost} pts) s'intègre parfaitement dans la grille 17 points.`;
  } else if (grade >= 65) {
    explanation = isEn
      ? `Viable transition gem (Tier ${rank}). Usable temporarily while waiting for a Relic drop with higher secondary roll values.`
      : `Gemme de transition viable (Rang ${rank}). Utilisable temporairement en attendant un tirage Relique avec de meilleurs jets d'effets secondaires.`;
  } else {
    explanation = isEn
      ? `Sub-optimal gem below efficiency thresholds (Tier ${rank}, Sum ${levelSum}). Effective cost of ${effectiveCost} is too heavy. Recommendation: Save as 3-gem fusion fodder or recycle.`
      : `Gemme en dessous des seuils de rentabilité (Rang ${rank}, Somme ${levelSum}). Coût effectif de ${effectiveCost} trop lourd. Recommandation : Conserver pour la fusion de 3 gemmes (fodder) ou recycler.`;
  }

  return {
    grade,
    rank,
    rankClass,
    rarity,
    rarityClass,
    levelSum,
    effectiveCost,
    costClass,
    realGainText,
    viabilityText,
    viabilitySub,
    isRainbow,
    explanation
  };
}

function populateAstrogemEffects() {
  const pool = ASTROGEM_DATA.pools[astrogemState.baseCost] || ASTROGEM_DATA.pools[8];
  if (!pool.includes(astrogemState.effect1)) astrogemState.effect1 = pool[0];
  if (!pool.includes(astrogemState.effect2) || astrogemState.effect2 === astrogemState.effect1) {
    astrogemState.effect2 = pool.find(e => e !== astrogemState.effect1) || pool[1];
  }

  const isEn = isEnLang();
  const effDict = ASTROGEM_DATA.effectLabels[isEn ? 'en' : 'fr'] || ASTROGEM_DATA.effectLabels.fr;
  if (dom.astroEffect1) {
    dom.astroEffect1.innerHTML = pool.map(e => `<option value="${e}" ${e === astrogemState.effect1 ? 'selected' : ''}>${effDict[e] || e}</option>`).join('');
  }
  if (dom.astroEffect2) {
    const pool2 = pool.filter(e => e !== astrogemState.effect1);
    dom.astroEffect2.innerHTML = pool2.map(e => `<option value="${e}" ${e === astrogemState.effect2 ? 'selected' : ''}>${effDict[e] || e}</option>`).join('');
  }
}

function updateAstrogemGraderView() {
  const role = state.role || 'support';
  const isSupport = role === 'support';
  const isEn = isEnLang();

  if (dom.astroRoleBadge) {
    dom.astroRoleBadge.textContent = isSupport
      ? (isEn ? 'T4 Support (Party Buff)' : 'Support T4 (Buff Groupe)')
      : (isEn ? 'T4 DPS (Solo Damage)' : 'DPS T4 (Dégâts Personnels)');
    dom.astroRoleBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
  }

  if (dom.astroGainLabel) {
    dom.astroGainLabel.textContent = isSupport
      ? (isEn ? 'Buff Gain per Ally' : 'Gain de buff par allié')
      : (isEn ? 'True Solo DPS Gain' : 'Gain Réel DPS Perso');
  }
  if (dom.astroGainSub) {
    dom.astroGainSub.textContent = isSupport
      ? (isEn ? 'Net contribution per ally' : 'Contribution nette par allié')
      : (isEn ? 'Raw damage multiplier' : 'Multiplicateur brut de dégâts');
  }

  // Changement de rôle : effets de départ = les deux effets utiles du rôle pour ce coût
  if (astrogemState.role !== role) {
    astrogemState.role = role;
    const useful = isSupport ? ['ally_ap', 'brand', 'ally_dmg'] : ['boss_dmg', 'add_dmg', 'atk_power'];
    const pool = (ASTROGEM_DATA.pools[astrogemState.baseCost] || []).filter(e => useful.includes(e));
    if (pool.length >= 2) { astrogemState.effect1 = pool[0]; astrogemState.effect2 = pool[1]; }
  }
  populateAstrogemEffects();

  if (dom.astroBaseCost) dom.astroBaseCost.value = astrogemState.baseCost.toString();
  if (dom.astroWpLevel) dom.astroWpLevel.value = astrogemState.willpowerLevel.toString();
  if (dom.dispAstroWpLevel) dom.dispAstroWpLevel.textContent = isEn ? `Level ${astrogemState.willpowerLevel}` : `Niveau ${astrogemState.willpowerLevel}`;

  if (dom.astroOrderLevel) dom.astroOrderLevel.value = astrogemState.orderLevel.toString();
  if (dom.dispAstroOrderLevel) dom.dispAstroOrderLevel.textContent = isEn ? `Level ${astrogemState.orderLevel}` : `Niveau ${astrogemState.orderLevel}`;

  if (dom.astroEff1Level) dom.astroEff1Level.value = astrogemState.effect1Level.toString();
  if (dom.dispAstroEff1Level) dom.dispAstroEff1Level.textContent = isEn ? `Lv. ${astrogemState.effect1Level}` : `Niv. ${astrogemState.effect1Level}`;

  if (dom.astroEff2Level) dom.astroEff2Level.value = astrogemState.effect2Level.toString();
  if (dom.dispAstroEff2Level) dom.dispAstroEff2Level.textContent = isEn ? `Lv. ${astrogemState.effect2Level}` : `Niv. ${astrogemState.effect2Level}`;

  const res = evaluateAstrogem(astrogemState, role);

  if (dom.dispAstroEffectiveCost) {
    dom.dispAstroEffectiveCost.textContent = isEn ? `Cost ${res.effectiveCost} (${res.viabilityText})` : `Coût ${res.effectiveCost} (${res.viabilityText})`;
    dom.dispAstroEffectiveCost.className = `gem-effective-cost ${res.costClass}`;
  }

  if (dom.astroGradeVal) {
    dom.astroGradeVal.innerHTML = `${res.grade.toFixed(1)} <span class="denom">/ 100</span>`;
  }

  if (dom.astroRankPill) {
    dom.astroRankPill.textContent = res.rank;
    dom.astroRankPill.className = `gem-rank-pill ${res.rankClass}`;
  }

  if (dom.astroTierBadge) {
    dom.astroTierBadge.textContent = `${res.rarity} (${res.levelSum}/20)`;
    dom.astroTierBadge.className = `gem-tier-badge ${res.rarityClass}`;
  }

  if (dom.astroScoreHero) {
    dom.astroScoreHero.classList.toggle('rainbow', res.isRainbow);
  }
  if (dom.astroRainbowLabel) {
    dom.astroRainbowLabel.style.display = res.isRainbow ? 'block' : 'none';
  }

  if (dom.astroGainVal) dom.astroGainVal.textContent = res.realGainText;
  if (dom.astroRarityVal) dom.astroRarityVal.textContent = res.rarity;
  if (dom.astroRaritySub) dom.astroRaritySub.textContent = isEn ? `Sum of 4 lines: ${res.levelSum}/20` : `Somme des 4 lignes : ${res.levelSum}/20`;
  if (dom.astroCostVal) {
    dom.astroCostVal.textContent = `${res.effectiveCost} Point${res.effectiveCost > 1 ? 's' : ''}`;
    dom.astroCostVal.style.color = res.costClass === 'optimal' ? '#8CC084' : (res.costClass === 'standard' ? '#E0A43A' : '#E07A63');
  }
  if (dom.astroViabilityVal) {
    dom.astroViabilityVal.textContent = res.viabilityText;
    dom.astroViabilityVal.style.color = res.costClass === 'optimal' ? '#8CC084' : (res.costClass === 'standard' ? '#E0A43A' : '#E07A63');
  }
  if (dom.astroViabilitySub) dom.astroViabilitySub.textContent = res.viabilitySub;
  if (dom.astroAnalysisText) dom.astroAnalysisText.textContent = res.explanation;
}

function initAstrogemGraderEvents() {
  if (dom.astroBaseCost) {
    dom.astroBaseCost.addEventListener('change', (e) => {
      astrogemState.baseCost = parseInt(e.target.value, 10) || 8;
      populateAstrogemEffects();
      updateAstrogemGraderView();
    });
  }

  if (dom.astroWpLevel) {
    dom.astroWpLevel.addEventListener('input', (e) => {
      astrogemState.willpowerLevel = parseInt(e.target.value, 10) || 5;
      updateAstrogemGraderView();
    });
  }

  if (dom.astroOrderLevel) {
    dom.astroOrderLevel.addEventListener('input', (e) => {
      astrogemState.orderLevel = parseInt(e.target.value, 10) || 5;
      updateAstrogemGraderView();
    });
  }

  if (dom.astroEffect1) {
    dom.astroEffect1.addEventListener('change', (e) => {
      astrogemState.effect1 = e.target.value;
      populateAstrogemEffects();
      updateAstrogemGraderView();
    });
  }

  if (dom.astroEff1Level) {
    dom.astroEff1Level.addEventListener('input', (e) => {
      astrogemState.effect1Level = parseInt(e.target.value, 10) || 5;
      updateAstrogemGraderView();
    });
  }

  if (dom.astroEffect2) {
    dom.astroEffect2.addEventListener('change', (e) => {
      astrogemState.effect2 = e.target.value;
      updateAstrogemGraderView();
    });
  }

  if (dom.astroEff2Level) {
    dom.astroEff2Level.addEventListener('input', (e) => {
      astrogemState.effect2Level = parseInt(e.target.value, 10) || 5;
      updateAstrogemGraderView();
    });
  }

  function setPresetActive(activeBtn) {
    [dom.btnAstroPresetPerfect8, dom.btnAstroPresetRelic9, dom.btnAstroPresetRelic10, dom.btnAstroPresetFodder].forEach(b => {
      if (b) b.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
  }

  if (dom.btnAstroPresetPerfect8) {
    dom.btnAstroPresetPerfect8.addEventListener('click', () => {
      const isSup = state.role === 'support';
      astrogemState.baseCost = 8;
      astrogemState.willpowerLevel = 5;
      astrogemState.orderLevel = 5;
      astrogemState.effect1 = isSup ? 'brand' : 'add_dmg';
      astrogemState.effect1Level = 5;
      astrogemState.effect2 = isSup ? 'ally_dmg' : 'atk_power';
      astrogemState.effect2Level = 5;
      setPresetActive(dom.btnAstroPresetPerfect8);
      updateAstrogemGraderView();
    });
  }

  if (dom.btnAstroPresetRelic9) {
    dom.btnAstroPresetRelic9.addEventListener('click', () => {
      astrogemState.baseCost = 9;
      astrogemState.willpowerLevel = 5;
      astrogemState.orderLevel = 4;
      astrogemState.effect1 = 'ally_ap';
      astrogemState.effect1Level = 5;
      astrogemState.effect2 = 'ally_dmg';
      astrogemState.effect2Level = 4;
      setPresetActive(dom.btnAstroPresetRelic9);
      updateAstrogemGraderView();
    });
  }

  if (dom.btnAstroPresetRelic10) {
    dom.btnAstroPresetRelic10.addEventListener('click', () => {
      astrogemState.baseCost = 10;
      astrogemState.willpowerLevel = 5;
      astrogemState.orderLevel = 4;
      astrogemState.effect1 = 'boss_dmg';
      astrogemState.effect1Level = 5;
      astrogemState.effect2 = 'add_dmg';
      astrogemState.effect2Level = 4;
      setPresetActive(dom.btnAstroPresetRelic10);
      updateAstrogemGraderView();
    });
  }

  if (dom.btnAstroPresetFodder) {
    dom.btnAstroPresetFodder.addEventListener('click', () => {
      astrogemState.baseCost = 10;
      astrogemState.willpowerLevel = 2;
      astrogemState.orderLevel = 2;
      astrogemState.effect1 = 'boss_dmg';
      astrogemState.effect1Level = 2;
      astrogemState.effect2 = 'add_dmg';
      astrogemState.effect2Level = 2;
      setPresetActive(dom.btnAstroPresetFodder);
      updateAstrogemGraderView();
    });
  }

  updateAstrogemGraderView();
}
