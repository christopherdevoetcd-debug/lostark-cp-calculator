// Détails du Benchmark : astrogemmes, gravures, attaque de base, stats de combat, arme, armures.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

function extractAstrogemsStats(charObj, isSupport, isEn) {
  if (!charObj) return [];
  
  // 1. Récupération des parts battlePoint (type 31/32)
  let bpParts = [];
  if (Array.isArray(charObj.astrogems) && charObj.astrogems.length > 0) {
    bpParts = charObj.astrogems;
  } else if (charObj.battlePoint && Array.isArray(charObj.battlePoint.parts)) {
    bpParts = charObj.battlePoint.parts.filter(p => p.type === 31 || p.type === 32);
  } else if (charObj.rawProfile && charObj.rawProfile.battlePoint && Array.isArray(charObj.rawProfile.battlePoint.parts)) {
    bpParts = charObj.rawProfile.battlePoint.parts.filter(p => p.type === 31 || p.type === 32);
  } else if (charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.battlePoint && Array.isArray(charObj.rawProfile.loadout.battlePoint.parts)) {
    bpParts = charObj.rawProfile.loadout.battlePoint.parts.filter(p => p.type === 31 || p.type === 32);
  } else if (charObj.rawProfile && charObj.rawProfile.loadouts && charObj.rawProfile.loadouts[0] && charObj.rawProfile.loadouts[0].battlePoint && Array.isArray(charObj.rawProfile.loadouts[0].battlePoint.parts)) {
    bpParts = charObj.rawProfile.loadouts[0].battlePoint.parts.filter(p => p.type === 31 || p.type === 32);
  } else if (charObj.loadout && charObj.loadout.battlePoint && Array.isArray(charObj.loadout.battlePoint.parts)) {
    bpParts = charObj.loadout.battlePoint.parts.filter(p => p.type === 31 || p.type === 32);
  }

  // 2. Niveaux cumulés depuis arkGridCores
  const totals = {};
  const cores = charObj.arkGridCores 
    || (charObj.loadout && charObj.loadout.arkGridCores) 
    || (charObj.rawProfile && charObj.rawProfile.arkGridCores) 
    || (charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.arkGridCores) 
    || [];
  if (Array.isArray(cores)) {
    for (const core of cores) {
      for (const gem of (core.gems || [])) {
        for (const opt of (gem.opts || [])) {
          totals[opt.id] = (totals[opt.id] || 0) + (opt.level || 0);
        }
      }
    }
  }

  const ids = isSupport ? [2011, 2012, 2013] : [2001, 2002, 2003];

  if (bpParts.length > 0) {
    return ids.map(id => {
      const def = (typeof BIBLE_ARK_GRID_SUBSTATS !== 'undefined' && BIBLE_ARK_GRID_SUBSTATS[id]) || {};
      const part = bpParts.find(p => p.id === id);
      const valPct = part && part.value !== undefined ? (part.value / 100) : 0;
      const lvl = (part && part.totalLevel) || totals[id] || 0;
      const name = isEn ? (def.en || `Substat #${id}`) : (def.fr || `Sous-stat #${id}`);
      return {
        id,
        name,
        fullName: def.fullName || name,
        valPct: Number(valPct.toFixed(2)),
        level: lvl,
        isSupport
      };
    });
  }

  // 3. Fallback profil cible / benchmark si données brutes absentes
  let totalBonusPct = 0;
  const charSys = resolveTargetSystems(charObj, isEn);
  if (charSys && charSys.arkGridAstrogems && typeof charSys.arkGridAstrogems.bonusPct === 'number') {
    totalBonusPct = charSys.arkGridAstrogems.bonusPct;
  } else {
    totalBonusPct = isSupport ? 4.50 : 5.80;
  }

  if (isSupport) {
    const p11 = Number((totalBonusPct * 0.30).toFixed(2));
    const p12 = Number((totalBonusPct * 0.40).toFixed(2));
    const p13 = Number((totalBonusPct - p11 - p12).toFixed(2));
    return [
      { id: 2011, name: isEn ? "Ally Damage Enh." : "Amélioration Dégâts Alliés", valPct: p11, level: Math.round(p11 * 18), isSupport: true },
      { id: 2012, name: isEn ? "Brand Power" : "Puissance de Marque", valPct: p12, level: Math.round(p12 * 7), isSupport: true },
      { id: 2013, name: isEn ? "Ally Attack Enh." : "Amélioration AP Allié", valPct: p13, level: Math.round(p13 * 8), isSupport: true }
    ];
  } else {
    const p01 = Number((totalBonusPct * 0.22).toFixed(2));
    const p02 = Number((totalBonusPct * 0.41).toFixed(2));
    const p03 = Number((totalBonusPct - p01 - p02).toFixed(2));
    return [
      { id: 2001, name: isEn ? "Attack Power" : "Puissance d'Attaque", valPct: p01, level: Math.round(p01 * 28), isSupport: false },
      { id: 2002, name: isEn ? "Additional Damage" : "Dégâts Additionnels", valPct: p02, level: Math.round(p02 * 17), isSupport: false },
      { id: 2003, name: isEn ? "Boss Damage" : "Dégâts aux Boss", valPct: p03, level: Math.round(p03 * 13), isSupport: false }
    ];
  }
}

function computeAstrogemsLineCps(playerStats, targetStats, cpImpact) {
  if (!Array.isArray(playerStats) || !Array.isArray(targetStats) || targetStats.length === 0) {
    return { lineCps: {}, totalCp: 0 };
  }

  const rawDeltas = [];
  let totalDelta = 0;

  for (let i = 0; i < targetStats.length; i++) {
    const tStat = targetStats[i];
    const pStat = playerStats.find(p => p.id === tStat.id) || { valPct: 0 };
    const diff = Math.max(0, Number((tStat.valPct - pStat.valPct).toFixed(2)));
    rawDeltas.push({ id: tStat.id, diff });
    totalDelta += diff;
  }

  const lineCps = {};
  if (totalDelta <= 0.001 || cpImpact <= 0) {
    for (const d of rawDeltas) {
      lineCps[d.id] = 0;
    }
    return { lineCps, totalCp: 0 };
  }

  let distributedCp = 0;
  const tempAllocations = [];

  for (let i = 0; i < rawDeltas.length; i++) {
    const d = rawDeltas[i];
    const share = d.diff / totalDelta;
    const lineCp = Math.round(share * cpImpact);
    lineCps[d.id] = lineCp;
    distributedCp += lineCp;
    tempAllocations.push({ id: d.id, cp: lineCp });
  }

  // Réconciliation stricte pour garantir 100% de parité (somme == cpImpact)
  if (distributedCp !== cpImpact) {
    const diff = cpImpact - distributedCp;
    // Absorber la différence sur la stat ayant reçu le plus de CP pour minimiser l'impact visuel
    const maxItem = tempAllocations.reduce((best, cur) => cur.cp > (best ? best.cp : -1) ? cur : best, null);
    if (maxItem) {
      lineCps[maxItem.id] = Math.max(0, lineCps[maxItem.id] + diff);
    }
  }

  return { lineCps, totalCp: cpImpact };
}

function buildAstrogemsBreakdownHtml(player, target, cpImpact, isEn) {
  const isSupport = player.role === 'support' || (player.className && ['Paladin', 'Bard', 'Artist'].some(s => (player.className || '').toLowerCase().includes(s.toLowerCase())));
  const pStats = extractAstrogemsStats(player, isSupport, isEn);
  const tStats = extractAstrogemsStats(target, isSupport, isEn);

  const { lineCps } = computeAstrogemsLineCps(pStats, tStats, cpImpact);

  const pTotalPct = pStats.reduce((sum, s) => sum + s.valPct, 0);
  const tTotalPct = tStats.reduce((sum, s) => sum + s.valPct, 0);
  const cpPerPct = (player && player.cp && player.cp > 1000) ? (player.cp / 100) : 38;

  // Badges Joueur avec pillule d'avance si le joueur dépasse la cible
  const pSubstatsHtml = pStats.map(s => {
    const tStat = tStats.find(t => t.id === s.id) || { valPct: 0, level: 0 };
    const leadPct = Number((s.valPct - tStat.valPct).toFixed(2));
    const leadCp = leadPct > 0.05 ? Math.round(leadPct * cpPerPct) : 0;
    const leadBadge = leadCp > 0 
      ? `<span class="line-cp-pill" style="background: rgba(156, 180, 198, 0.2); border-color: rgba(156, 180, 198, 0.4); color: #9CB4C6;">+${leadCp} CP (${isEn ? 'Lead' : 'Avance'})</span>` 
      : '';
    return `
        <div class="acc-line-badge high">
          <span>${escapeHtml(s.name)} (+${s.valPct.toFixed(2)}%)</span>
          ${leadBadge}
          <span class="acc-line-tier-tag">${isEn ? 'Lvl' : 'Niv.'} ${s.level}</span>
        </div>
      `;
  }).join('');

  // Badges Cible avec pillule de gain individuel de CP
  const tSubstatsHtml = tStats.map(s => {
    const lineCp = lineCps[s.id] || 0;
    const cpBadge = lineCp > 0 ? `<span class="line-cp-pill">+${lineCp} CP</span>` : '';
    return `
        <div class="acc-line-badge high">
          <span>${escapeHtml(s.name)} (+${s.valPct.toFixed(2)}%)</span>
          ${cpBadge}
          <span class="acc-line-tier-tag">${isEn ? 'Lvl' : 'Niv.'} ${s.level}</span>
        </div>
      `;
  }).join('');

  // Lignes du tableau comparatif
  const tableRowsHtml = tStats.map(tStat => {
    const pStat = pStats.find(p => p.id === tStat.id) || { valPct: 0, level: 0 };
    const lineCp = lineCps[tStat.id] || 0;
    const leadPct = Number((pStat.valPct - tStat.valPct).toFixed(2));
    const leadCp = leadPct > 0.05 ? Math.round(leadPct * cpPerPct) : 0;

    let cpCell = '<span style="color:var(--text-muted);">= 0 CP</span>';
    if (lineCp > 0) {
      cpCell = `<strong style="color:#8CC084;">+${lineCp} CP</strong>`;
    } else if (leadCp > 0) {
      cpCell = `<span style="color:#9CB4C6; font-weight:600;">+${leadCp} CP (${isEn ? 'Lead' : 'Avance'})</span>`;
    }

    return `
        <tr>
          <td><strong>${escapeHtml(tStat.name)}</strong></td>
          <td>+${pStat.valPct.toFixed(2)}% (${isEn ? 'Lvl' : 'Niv.'} ${pStat.level})</td>
          <td>+${tStat.valPct.toFixed(2)}% (${isEn ? 'Lvl' : 'Niv.'} ${tStat.level})</td>
          <td class="col-cp-gain" style="text-align:right;">${cpCell}</td>
        </tr>
      `;
  }).join('');

  // Formulation du verdict personnalisé
  let highestStat = null;
  let maxCp = -1;
  tStats.forEach(tStat => {
    const cp = lineCps[tStat.id] || 0;
    if (cp > maxCp) {
      maxCp = cp;
      highestStat = { ...tStat, cp };
    }
  });

  let verdictText = '';
  if (cpImpact <= 0) {
    verdictText = isEn
      ? "Astrogem substats are fully optimized and aligned with benchmark reference."
      : "Sous-statistiques d'astrogemmes optimisées et alignées avec la référence.";
  } else if (highestStat && highestStat.cp > 0) {
    verdictText = isEn
      ? `Top Priority: Increase ${highestStat.name} tier (+${highestStat.cp} CP) on your Ark Grid cores (aim for Lvl ${highestStat.level}) to bridge most of the gap (+${cpImpact} CP).`
      : `Priorité n°1 : Augmenter le palier de ${highestStat.name} (+${highestStat.cp} CP) sur vos cœurs d'Ark Grid (viser Niv. ${highestStat.level}) pour combler l'essentiel de l'écart (+${cpImpact} CP).`;
  } else {
    verdictText = isEn
      ? `Evenly refine your Ark Grid astrogem levels to bridge the +${cpImpact} CP delta.`
      : `Ajuster harmonieusement les niveaux d'astrogemmes d'Ark Grid pour combler les +${cpImpact} CP.`;
  }

  return `
      <div class="acc-breakdown-panel astrogems-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'Ark Grid Astrogems & Substats Breakdown' : 'Détail des Astrogemmes & Sous-statistiques d\'Ark Grid'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(224, 164, 58, 0.15); border-color: rgba(224, 164, 58, 0.35); color: #E0A43A;">
              ${cpImpact > 0 ? `+${cpImpact} CP ${isEn ? 'gap' : 'd\'écart global'}` : (isEn ? 'Optimized parity' : 'Parité optimale')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn 
              ? 'Detailed side-by-side comparison of offensive and support substats across all 24 astrogem slots to bridge the CP gap.'
              : 'Comparaison détaillée des sous-statistiques offensives et support réparties sur les 24 emplacements d\'astrogemmes pour combler l\'écart de CP.'}
          </div>
        </div>

        <div class="astrogems-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card astrogems-card player-card ${cpImpact > 0 ? 'has-gap' : 'parity'}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${isEn ? 'Your Astrogems' : 'Vos Astrogemmes'}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(224, 164, 58, 0.2); color: #F0C77A; margin-left: 6px;">
                  ${isEn ? 'Ark Grid (24 Slots)' : 'Grille d\'Ark (24 Slots)'}
                </span>
              </div>
              <span class="acc-piece-gain-pill neutral">
                +${pTotalPct.toFixed(2)}% Total
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl player">${isEn ? 'Equipped Astrogem Substats' : 'Sous-statistiques d\'Astrogemmes Actives'}</span>
                ${pSubstatsHtml}
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card astrogems-card target-card parity">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence BiS'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(140, 192, 132, 0.2); color: #8CC084; margin-left: 6px;">
                  ${isEn ? 'Target Reference' : 'Référence Cible'}
                </span>
              </div>
              <span class="acc-piece-gain-pill ${cpImpact > 0 ? 'gap' : 'neutral'}">
                ${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl target">${isEn ? 'Target Astrogem Substats' : 'Sous-statistiques Cible'}</span>
                ${tSubstatsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé des Gains par Sous-statistique -->
        <div class="astrogems-compare-table-wrap">
          <div class="astrogems-compare-table-title">
            <span></span>
            <strong>${isEn ? 'Individual CP Contribution by Astrogem Substat' : 'Décomposition Détaillée des Gains de CP par Sous-statistique d\'Astrogemme'}</strong>
          </div>
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Astrogem Substat' : 'Sous-statistique d\'Astrogemme'}</th>
                <th>${isEn ? 'Your Character' : 'Votre Personnage'}</th>
                <th>${isEn ? 'Benchmark Target' : 'Référence Cible'}</th>
                <th style="text-align:right;">${isEn ? 'CP Delta' : 'Gain en CP'}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Total Astrogems System Gap' : 'Gain Total du Système Astrogemmes'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="astrogems-verdict-banner">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            <strong>${isEn ? 'Optimization Recommendation:' : 'Recommandation d\'Optimisation :'}</strong>
            <span>${escapeHtml(verdictText)}</span>
          </div>
        </div>
      </div>
    `;
}

function extractCharacterEngravings(c, isEn = false) {
  if (!c) return [];
  const pId = (c.id || c.name || '').toLowerCase();
  const canon = null;

  const allBpParts = (c.rawProfile && c.rawProfile.battlePoint && c.rawProfile.battlePoint.parts)
    || (c.battlePoint && c.battlePoint.parts)
    || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.battlePoint && c.rawProfile.loadout.battlePoint.parts)
    || (c.rawProfile && c.rawProfile.loadouts && c.rawProfile.loadouts[0] && c.rawProfile.loadouts[0].battlePoint && c.rawProfile.loadouts[0].battlePoint.parts)
    || (c.loadout && c.loadout.battlePoint && c.loadout.battlePoint.parts)
    || (canon && canon.rawProfile && canon.rawProfile.battlePoint && canon.rawProfile.battlePoint.parts)
    || (canon && canon.battlePoint && canon.battlePoint.parts)
    || [];

  const engParts = allBpParts.filter(p => p.type === 10 || p.type === 11 || (p.grade && p.grade.includes('engrave')));
  if (engParts.length > 0) {
    return engParts.map(p => {
      const rawName = (typeof BIBLE_ENGRAVINGS !== 'undefined' && BIBLE_ENGRAVINGS[p.id]) || `Gravure #${p.id}`;
      let name = rawName;
      if (isEn) {
        const m = rawName.match(/^([^(]+)/);
        if (m) name = m[1].trim();
      } else {
        const mFr = rawName.match(/\(([^)]+)\)/);
        if (mFr) name = mFr[1].trim();
        else {
          const mEn = rawName.match(/^([^(]+)/);
          if (mEn) name = mEn[1].trim();
        }
      }
      return {
        id: p.id,
        name,
        rawName,
        valuePct: Number(((p.value || 0) / 100).toFixed(2)),
        stonePoints: p.stonePoints || 0
      };
    });
  }

  // Fallback 1: via c.items ou canon.items
  const gravureItems = (Array.isArray(c.items) && c.items.filter(i => i.cat === 'Gravures').length > 0)
    ? c.items.filter(i => i.cat === 'Gravures')
    : ((canon && Array.isArray(canon.items) && canon.items.filter(i => i.cat === 'Gravures').length > 0)
        ? canon.items.filter(i => i.cat === 'Gravures')
        : []);

  if (gravureItems.length > 0) {
    return gravureItems.map(gi => {
      const valPct = parseFloat((gi.val || gi.mult || '20').replace(/[^0-9.]/g, '')) || 20.0;
      const stoneMatch = (gi.label || '').match(/Pierre \+(\d+)|Stone \+(\d+)/i);
      const stonePoints = stoneMatch ? parseInt(stoneMatch[1] || stoneMatch[2], 10) : 0;
      let name = (gi.label || '').replace(/—.*$/, '').trim();
      const cleanName = name.replace(/\s*\((?:Pierre|Stone)[^)]*\)/i, '').replace(/\s*\([^)]*\)/g, '').trim();
      let engId = null;
      let matchedStr = null;

      if (typeof BIBLE_ENGRAVINGS !== 'undefined') {
        for (const [idKey, strName] of Object.entries(BIBLE_ENGRAVINGS)) {
          const mEn = strName.match(/^([^(]+)/);
          const mFr = strName.match(/\(([^)]+)\)/);
          const en = mEn ? mEn[1].trim().toLowerCase() : strName.toLowerCase();
          const fr = mFr ? mFr[1].trim().toLowerCase() : '';
          if ((fr && fr === cleanName.toLowerCase()) || en === cleanName.toLowerCase()) {
            engId = Number(idKey);
            matchedStr = strName;
            break;
          }
        }
      }

      if (matchedStr) {
        const mEn = matchedStr.match(/^([^(]+)/);
        const mFr = matchedStr.match(/\(([^)]+)\)/);
        if (isEn) {
          name = mEn ? mEn[1].trim() : cleanName;
        } else {
          name = mFr ? mFr[1].trim() : (mEn ? mEn[1].trim() : cleanName);
        }
      } else {
        name = isEn ? translateEngravingToEnglish(cleanName) : cleanName;
      }

      return {
        id: engId || name.toLowerCase(),
        name,
        rawName: gi.label,
        valuePct: Number(valPct.toFixed(2)),
        stonePoints
      };
    });
  }

  // Fallback 2: via c.engravings ou canon.engravings
  const rawEngs = (c.engravings && c.engravings.length)
    ? c.engravings
    : ((canon && canon.engravings && canon.engravings.length)
        ? canon.engravings
        : (c.rawProfile && c.rawProfile.loadouts && c.rawProfile.loadouts[0]?.engravings));

  if (Array.isArray(rawEngs) && rawEngs.length > 0) {
    return rawEngs.map(e => {
      const rawName = (typeof BIBLE_ENGRAVINGS !== 'undefined' && BIBLE_ENGRAVINGS[e.id]) || `Gravure #${e.id}`;
      let name = rawName;
      if (isEn) {
        const m = rawName.match(/^([^(]+)/);
        if (m) name = m[1].trim();
        else name = translateEngravingToEnglish(rawName);
      } else {
        const mFr = rawName.match(/\(([^)]+)\)/);
        if (mFr) name = mFr[1].trim();
        else {
          const mEn = rawName.match(/^([^(]+)/);
          if (mEn) name = mEn[1].trim();
        }
      }
      return {
        id: e.id,
        name,
        rawName,
        valuePct: 20.0,
        stonePoints: 0
      };
    });
  }

  // Fallback Universel : 5 Gravures Reliques T4 avec Pierre de Naissance
  const specName = getCharacterSpecName(c) || (isEn ? 'Class Engraving' : 'Gravure de Classe');
  const isSupport = c.role === 'support' || ['paladin', 'bard', 'artist'].some(s => (c.className || '').toLowerCase().includes(s));
  const cIlvl = c.ilvl || 1750;
  const stoneBonus = cIlvl >= 1770 ? 4.24 : 1.94;
  const stonePts = cIlvl >= 1770 ? 4 : 2;

  if (isSupport) {
    return [
      { id: 101, name: `${specName} 3`, rawName: `${specName} 3`, valuePct: 20.00, stonePoints: 0 },
      { id: 102, name: isEn ? "Expert 3" : "Expert 3", rawName: "Expert", valuePct: 20.00, stonePoints: 0 },
      { id: 103, name: isEn ? "Awakening 3" : "Éveil 3", rawName: "Éveil", valuePct: 20.00, stonePoints: 0 },
      { id: 104, name: isEn ? "Drops of Ether 3" : "Gouttes d'éther 3", rawName: "Gouttes d'éther", valuePct: 20.00, stonePoints: stonePts },
      { id: 105, name: isEn ? "Vital Point Hit 3" : "Frappe vitale 3", rawName: "Frappe vitale", valuePct: Number((20.00 + stoneBonus).toFixed(2)), stonePoints: stonePts + 1 }
    ];
  }
  return [
    { id: 201, name: `${specName} 3`, rawName: `${specName} 3`, valuePct: 20.00, stonePoints: 0 },
    { id: 202, name: isEn ? "Grudge 3" : "Rancune 3", rawName: "Rancune", valuePct: 20.00, stonePoints: 0 },
    { id: 203, name: isEn ? "Keen Blunt Weapon 3" : "Arme affûtée 3", rawName: "Arme affûtée", valuePct: 20.00, stonePoints: 0 },
    { id: 204, name: isEn ? "Raid Captain 3" : "Capitaine de raid 3", rawName: "Capitaine de raid", valuePct: 20.00, stonePoints: stonePts },
    { id: 205, name: isEn ? "Adrenaline 3" : "Adrénaline 3", rawName: "Adrénaline", valuePct: Number((20.00 + stoneBonus).toFixed(2)), stonePoints: stonePts + 1 }
  ];
}

function extractCharacterBaseAtkDetails(c, isEn = false) {
  if (!c) return { mainStatName: isEn ? 'Strength' : 'Force', mainStat: 627038, baseAtk: 162736, weaponPower: 218877, ilvl: 1750 };
  const pId = (c.id || c.name || '').toLowerCase();
  const canon = null;

  const allBpParts = (c.rawProfile && c.rawProfile.battlePoint && c.rawProfile.battlePoint.parts)
    || (c.battlePoint && c.battlePoint.parts)
    || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.battlePoint && c.rawProfile.loadout.battlePoint.parts)
    || (c.rawProfile && c.rawProfile.loadouts && c.rawProfile.loadouts[0] && c.rawProfile.loadouts[0].battlePoint && c.rawProfile.loadouts[0].battlePoint.parts)
    || (c.loadout && c.loadout.battlePoint && c.loadout.battlePoint.parts)
    || (canon && canon.rawProfile && canon.rawProfile.battlePoint && canon.rawProfile.battlePoint.parts)
    || (canon && canon.battlePoint && canon.battlePoint.parts)
    || [];

  const t1 = allBpParts.find(p => p.type === 1);
  const ilvl = c.ilvl || (canon && canon.ilvl) || 1750;
  const className = c.className || (canon && canon.className) || '';
  const mainStatName = getMainStatName(className, isEn);

  let mainStat = 0;
  let baseAtk = 0;
  let weaponPower = 0;

  if (t1) {
    mainStat = t1.mainStat || 0;
    baseAtk = t1.baseAttackPower || 0;
    weaponPower = t1.weaponPower || 0;
  }

  if (!mainStat) {
    mainStat = c.mainStat || (canon && canon.mainStat) || (ilvl >= 1770 ? 735000 : (ilvl >= 1750 ? 627038 : 580000));
  }
  if (!baseAtk) {
    baseAtk = c.baseAtk || (canon && canon.baseAtk) || (ilvl >= 1770 ? 185000 : (ilvl >= 1750 ? 162736 : 150000));
  }
  if (!weaponPower) {
    weaponPower = c.weaponPower || (canon && canon.weaponPower) || Math.round((baseAtk * baseAtk * 6) / Math.max(1, mainStat));
  }

  return {
    mainStatName,
    mainStat: Math.round(mainStat),
    baseAtk: Math.round(baseAtk),
    weaponPower: Math.round(weaponPower),
    ilvl
  };
}

function extractCharacterCombatStatsDetails(c, isEn = false) {
  if (!c) return { totalPts: 2386, bonusPct: 95.44, swift: 1820, specStat: 566, crit: 0, role: 'support' };
  const pId = (c.id || c.name || '').toLowerCase();
  const canon = null;

  const allBpParts = (c.rawProfile && c.rawProfile.battlePoint && c.rawProfile.battlePoint.parts)
    || (c.battlePoint && c.battlePoint.parts)
    || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.battlePoint && c.rawProfile.loadout.battlePoint.parts)
    || (c.rawProfile && c.rawProfile.loadouts && c.rawProfile.loadouts[0] && c.rawProfile.loadouts[0].battlePoint && c.rawProfile.loadouts[0].battlePoint.parts)
    || (c.loadout && c.loadout.battlePoint && c.loadout.battlePoint.parts)
    || (canon && canon.rawProfile && canon.rawProfile.battlePoint && canon.rawProfile.battlePoint.parts)
    || (canon && canon.battlePoint && canon.battlePoint.parts)
    || [];

  const t26 = allBpParts.find(p => p.type === 26 || p.total);
  const role = c.role || (canon && canon.role) || (['paladin', 'bard', 'artist', 'valkyrie'].some(s => (c.className || '').toLowerCase().includes(s)) ? 'support' : 'dps');
  const spec = (c.spec || (canon && canon.spec) || '').toLowerCase();
  const ilvl = c.ilvl || (canon && canon.ilvl) || 1750;

  let totalPts = t26 && t26.total ? t26.total : 0;
  if (!totalPts && t26 && t26.value) {
    totalPts = (role === 'support') ? Math.round(t26.value / 4) : Math.round(t26.value / 3);
  }
  if (!totalPts) {
    totalPts = ilvl >= 1770 ? 2495 : (ilvl >= 1750 ? 2386 : 2280);
  }
  const bonusPct = (role === 'support')
    ? Number(((totalPts / 2500) * 100).toFixed(2))
    : Number((totalPts * 0.03).toFixed(2));

  let swift = 0;
  let specStat = 0;
  let crit = 0;

  const items = c.items || (canon && canon.items) || (c.loadout && c.loadout.items) || [];
  let foundSwift = 0, foundSpec = 0, foundCrit = 0;
  if (Array.isArray(items)) {
    items.forEach(it => {
      if (it && it.data && Array.isArray(it.data.stats)) {
        it.data.stats.forEach(st => {
          if (st.index === 15) foundCrit += st.value || 0;
          else if (st.index === 16) foundSpec += st.value || 0;
          else if (st.index === 17) foundSwift += st.value || 0;
        });
      }
    });
  }

  if (foundSwift + foundSpec + foundCrit > 1000) {
    swift = foundSwift;
    specStat = foundSpec;
    crit = foundCrit;
  } else {
    if (role === 'support') {
      swift = Math.round(totalPts * 0.763);
      specStat = totalPts - swift;
      crit = 0;
    } else if (spec.includes('executioner') || spec.includes('igniter') || spec.includes('surge') || spec.includes('brawler') || spec.includes('asura')) {
      specStat = Math.round(totalPts * 0.74);
      crit = totalPts - specStat;
      swift = 0;
    } else {
      swift = Math.round(totalPts * 0.65);
      crit = totalPts - swift;
      specStat = 0;
    }
  }

  return {
    totalPts: Math.round(totalPts),
    bonusPct,
    swift: Math.round(swift),
    specStat: Math.round(specStat),
    crit: Math.round(crit),
    role
  };
}

function buildBaseAtkBreakdownHtml(player, target, cpImpact, isEn) {
  const p = extractCharacterBaseAtkDetails(player, isEn);
  const t = extractCharacterBaseAtkDetails(target, isEn);
  const pSys = extractPlayerSystems(player, isEn);
  const tSys = resolveTargetSystems(target, isEn);

  const pPct = (pSys.baseAttackStat && pSys.baseAttackStat.bonusPct) ? pSys.baseAttackStat.bonusPct : 32.55;
  const tPct = (tSys.baseAttackStat && tSys.baseAttackStat.bonusPct) ? tSys.baseAttackStat.bonusPct : 35.17;
  const deltaPct = Number((tPct - pPct).toFixed(2));

  const dMainStat = t.mainStat - p.mainStat;
  const dWp = t.weaponPower - p.weaponPower;
  const dBaseAtk = t.baseAtk - p.baseAtk;

  const isSupport = player.role === 'support' || (player.className && ['Paladin', 'Bard', 'Artist'].some(s => (player.className || '').toLowerCase().includes(s.toLowerCase())));
  const mainStatName = p.mainStatName;

  return `
      <div class="acc-breakdown-panel baseatk-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'Main Stat & Base Attack Power (Base AP) Breakdown' : 'Détail de la Stat Principale & Puissance d\'Attaque de Base (Base AP)'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(224, 164, 58, 0.15); border-color: rgba(224, 164, 58, 0.35); color: #E0A43A;">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaPct.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (isEn ? 'Optimized parity' : 'Parité optimale')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? 'Comprehensive comparison of Main Stat (Str/Dex/Int) and Weapon Power, the two mathematical foundations that dictate your Base AP and support buff power.'
              : 'Comparaison détaillée de la Stat Principale (Force/Dex/Int) et de la Puissance d\'Arme, les deux piliers mathématiques qui déterminent votre Attaque de Base et l\'efficacité de vos buffs.'}
          </div>
        </div>

        <!-- Bannière Pédagogique : Définition & Formule -->
        <div class="stats-educational-banner baseatk">
          <span class="edu-icon"></span>
          <div class="edu-content">
            <strong>${isEn ? 'Understanding Main Stat & Base Attack Power (Base AP)' : 'Comprendre la Stat Principale & l\'Attaque de Base (Base AP)'}</strong>
            <div>
              ${isEn
                ? `In Lost Ark, your <strong>Base Attack Power (Base AP)</strong> is computed using the official formula: <code>Base AP = &radic;(Main Stat &times; Weapon Power / 6)</code>.<br>`
                : `Dans Lost Ark, la <strong>Puissance d'Attaque de Base (Base AP)</strong> découle de la formule officielle : <code>Base AP = &radic;(Stat Principale &times; Puissance d'Arme / 6)</code>.<br>`
              }
              ${isSupport
                ? (isEn
                  ? `<strong>For Supports (${escapeHtml(player.className || 'Support')}):</strong> Base AP is <strong>central</strong>. Your party attack buffs (<em>Heavenly Blessings</em>, <em>Wrath of God</em>) transfer <strong>15% of your Base AP directly to party members</strong> (on top of a flat +6% Atk Power bonus). A higher Base AP directly makes your DPS teammates hit harder.`
                  : `<strong>En Support (${escapeHtml(player.className || 'Support')}) :</strong> Le Base AP est <strong>capital</strong>. Vos compétences de buff d'attaque (<em>Bénédiction céleste</em>, <em>Colère de Dieu</em>) transfèrent <strong>15% de votre Attaque de Base directement à vos alliés</strong> (en plus du bonus fixe de +6% de PA). Un Base AP plus élevé augmente directement les dégâts de vos DPS en raid.`)
                : (isEn
                  ? `<strong>For DPS Classes:</strong> Base AP is the core scalar for all your skill damage formulas before engravings, set multipliers, and gems are compounded.`
                  : `<strong>En Rôle DPS :</strong> Le Base AP constitue le socle multiplicateur fondamental sur lequel tous les dégâts de vos compétences sont calculés avant les gravures et les gemmes.`)
              }
            </div>
          </div>
        </div>

        <!-- Cartes Face-à-Face Joueur vs Cible -->
        <div class="astrogems-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card astrogems-card player-card ${cpImpact > 0 ? 'has-gap' : 'parity'}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #E0A43A; margin-left: 6px;">
                  ${(player.ilvl || 1750).toFixed(2)} iLvl
                </span>
              </div>
              <span class="acc-piece-gain-pill neutral">
                +${pPct.toFixed(2)}% Mult.
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${escapeHtml(mainStatName)}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(p.mainStat)}</span>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Weapon Power' : 'Puissance d\'Arme'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(p.weaponPower)}</span>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Base Attack Power (AP)' : 'Puissance d\'Attaque Base (AP)'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#E0A43A;">${formatNumber(p.baseAtk)} AP</span>
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card astrogems-card target-card parity">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence BiS'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(140, 192, 132, 0.2); color: #8CC084; margin-left: 6px;">
                  ${(target && target.ilvl ? target.ilvl.toFixed(2) : '1759.17')} iLvl
                </span>
              </div>
              <span class="acc-piece-gain-pill ${cpImpact > 0 ? 'gap' : 'neutral'}">
                ${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${escapeHtml(mainStatName)}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(t.mainStat)}</span>
                  ${dMainStat > 0 ? `<span class="line-cp-pill">+${formatNumber(dMainStat)}</span>` : ''}
                </div>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Weapon Power' : 'Puissance d\'Arme'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(t.weaponPower)}</span>
                  ${dWp > 0 ? `<span class="line-cp-pill">+${formatNumber(dWp)}</span>` : ''}
                </div>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Base Attack Power (AP)' : 'Puissance d\'Attaque Base (AP)'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">${formatNumber(t.baseAtk)} AP</span>
                  ${dBaseAtk > 0 ? `<span class="line-cp-pill">+${formatNumber(dBaseAtk)} AP</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé -->
        <div class="astrogems-compare-table-wrap" style="margin-top: 14px;">
          <div class="astrogems-compare-table-title">
            <span></span>
            <strong>${isEn ? 'Mathematical Breakdown: Main Stat & Weapon Power' : 'Décomposition Mathématique : Stat Principale & Puissance d\'Arme'}</strong>
          </div>
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Metric / Component' : 'Métrique / Composant'}</th>
                <th>${isEn ? 'Your Character' : 'Votre Personnage'}</th>
                <th>${isEn ? 'Benchmark Target' : 'Référence Cible'}</th>
                <th style="text-align:right;">${isEn ? 'Delta / Impact' : 'Écart / Impact'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${escapeHtml(mainStatName)}</strong></td>
                <td>${formatNumber(p.mainStat)}</td>
                <td>${formatNumber(t.mainStat)}</td>
                <td class="col-cp-gain">${dMainStat > 0 ? `+${formatNumber(dMainStat)} pts` : `${formatNumber(dMainStat)} pts`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Weapon Power' : 'Puissance d\'Arme'}</strong></td>
                <td>${formatNumber(p.weaponPower)}</td>
                <td>${formatNumber(t.weaponPower)}</td>
                <td class="col-cp-gain">${dWp > 0 ? `+${formatNumber(dWp)} pts` : `${formatNumber(dWp)} pts`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Base Attack Power (AP)' : 'Puissance d\'Attaque de Base'}</strong></td>
                <td><strong>${formatNumber(p.baseAtk)} AP</strong></td>
                <td><strong style="color:#8CC084;">${formatNumber(t.baseAtk)} AP</strong></td>
                <td class="col-cp-gain"><strong>${dBaseAtk > 0 ? `+${formatNumber(dBaseAtk)} AP` : `${formatNumber(dBaseAtk)} AP`}</strong></td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Lost Ark Multiplier Score' : 'Multiplicateur Battre Point'}</strong></td>
                <td>+${pPct.toFixed(2)}%</td>
                <td>+${tPct.toFixed(2)}%</td>
                <td class="col-cp-gain">+${deltaPct.toFixed(2)}%</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Combat Power Impact (Compounding Formula)' : 'Impact Total sur le Combat Power'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 4 Leviers & Facteurs d'Écart -->
        <div style="margin-top: 14px;">
          <div style="font-size:14px; font-weight:700; color:#E8E6DC; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span></span> <span>${isEn ? 'Where does this +' + cpImpact + ' CP difference come from?' : 'D\'où vient cette différence de +' + cpImpact + ' CP ?'}</span>
          </div>
          <div class="stats-factor-grid">
            <div class="stats-factor-card">
              <strong>${isEn ? 'Armor & Honing ilvl' : 'Affinage & Pièces d\'Armure'}</strong>
              <span>${isEn ? 'Each T4 gear tier (Head, Chest, Pants, Shoulders, Gloves) gives an exponential jump in Main Stat.' : 'Chaque niveau d\'armure T4 (Torse, Jambes, Épaules, etc.) et affinage avancé apporte une forte augmentation de Force/Dex/Int.'}</span>
            </div>
            <div class="stats-factor-card">
              <strong>${isEn ? 'Weapon ilvl & Quality' : 'Arme T4 & Qualité'}</strong>
              <span>${isEn ? 'Weapon honing rank and Quality (95-100) are the primary sources of Weapon Power scaling Base AP.' : 'Le niveau d\'affinage d\'arme et une qualité 95-100 sont le moteur principal de la Puissance d\'Arme alimentant le Base AP.'}</span>
            </div>
            <div class="stats-factor-card">
              <strong>${isEn ? 'T4 Advanced Honing (+40)' : 'Affinage Avancé T4 (+40)'}</strong>
              <span>${isEn ? 'Advanced Honing tiers (+10 to +40) add large amounts of flat Main Stat and Weapon Power directly into every piece.' : 'Les paliers d\'Affinage Avancé (+10 à +40) injectent directement des bonus massifs de Stat Principale et de Puissance d\'Arme sur chaque pièce.'}</span>
            </div>
            <div class="stats-factor-card">
              <strong>${isEn ? 'Roster & Permanent Potions' : 'Potions Codex & Expédition'}</strong>
              <span>${isEn ? 'Stat potions from Adventurer\'s Tomes, Una Tasks, and Towers yield ~2,500-4,000 permanent Main Stat.' : 'Les potions permanentes des Tomes d\'Aventurier, Réputations Una et Tours offrent plusieurs milliers de points de Main Stat.'}</span>
            </div>
          </div>
        </div>

        <!-- Recommandation Finale -->
        <div class="astrogems-verdict-banner" style="margin-top:14px; border-left-color:#E0A43A;">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            <strong style="color:#E0A43A;">${isEn ? 'Optimization Recommendation:' : 'Recommandation d\'Optimisation :'}</strong>
            <span>${isEn
              ? `To bridge the +${cpImpact} CP gap: prioritize honing your T4 weapon (each tier above +20 gives an exponential leap in Weapon Power), advance your T4 armor levels to increase your Main Stat pool, complete remaining Advanced Honing tiers (+40), and collect missing permanent stat potions from your Codex (Alt+D).`
              : `Pour combler les +${cpImpact} CP de retard : prioriser l'affinage de votre Arme T4 (chaque palier au-dessus de +20 apporte un saut exponentiel de Puissance d'Arme), monter vos pièces d'armure T4 (source majeure de Stat Principale), compléter les paliers d'Affinage Avancé (+40), et récupérer les potions permanentes de statistiques manquantes dans votre Codex (Alt+D).`}</span>
          </div>
        </div>
      </div>
    `;
}

function extractCharacterWeaponDetails(char, isEn) {
  const sys = extractPlayerSystems(char, isEn);
  const wep = sys.weapon || {};
  const allBpParts = (char.rawProfile && char.rawProfile.battlePoint && char.rawProfile.battlePoint.parts)
    || (char.battlePoint && char.battlePoint.parts)
    || (char.rawProfile && char.rawProfile.loadout && char.rawProfile.loadout.battlePoint && char.rawProfile.loadout.battlePoint.parts)
    || (char.loadout && char.loadout.battlePoint && char.loadout.battlePoint.parts)
    || [];
  const t1Part = allBpParts.find(p => p.type === 1);
  const weaponPower = t1Part ? (t1Part.weaponPower || 0) : (char.weaponPower || 0);

  const wLvl = wep.wLvl !== undefined ? wep.wLvl : 18;
  const effWLvl = wep.effWLvl !== undefined ? wep.effWLvl : wLvl;
  const isSerka = !!wep.isSerka;
  const quality = wep.quality !== undefined ? wep.quality : 90;
  const qualityVal = wep.qualityVal !== undefined ? wep.qualityVal : (10 + quality * 0.196);
  const bonusPct = wep.bonusPct || 35.0;
  const adv = char.advHoning !== undefined ? char.advHoning : 40;
  const ilvlPiece = isSerka ? (1655 + wLvl * 5 + adv * 0.5) : (1610 + wLvl * 5 + adv * 0.5);

  return {
    wLvl,
    effWLvl,
    isSerka,
    quality,
    qualityVal,
    weaponPower,
    bonusPct,
    adv,
    ilvlPiece
  };
}

// gpdDelta : écart chiffré comme le GPD (% DPS ou % Buff), remplace l'ancien score multiplicateur
function buildWeaponBreakdownHtml(player, target, cpImpact, isEn, gpdDelta) {
  const p = extractCharacterWeaponDetails(player, isEn);
  const t = extractCharacterWeaponDetails(target, isEn);
  const fromGpd = typeof gpdDelta === 'number';
  const gpdUnit = player.role === 'support' ? 'Buff' : 'DPS';
  const deltaPct = fromGpd ? gpdDelta : Number((t.bonusPct - p.bonusPct).toFixed(2));
  const dWp = t.weaponPower - p.weaponPower;
  const dLvl = t.effWLvl - p.effWLvl;

  const pTierLabel = p.isSerka ? (isEn ? 'Serka Tier 2 (Adv. Ancient)' : 'Serka Palier 2 (Ancien Avancé)') : (isEn ? 'Aegir Tier 1 (Ancient)' : 'Aegir Palier 1 (Ancien)');
  const tTierLabel = t.isSerka ? (isEn ? 'Serka Tier 2 (Adv. Ancient)' : 'Serka Palier 2 (Ancien Avancé)') : (isEn ? 'Aegir Tier 1 (Ancient)' : 'Aegir Palier 1 (Ancien)');

  return `
      <div class="acc-breakdown-panel weapon-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'T4 Weapon Honing, Quality & Gear Tier Breakdown' : 'Détail de l\'Affinage de l\'Arme T4, Qualité & Palier d\'Équipement'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(224, 122, 99, 0.15); border-color: rgba(224, 122, 99, 0.35); color: #E07A63;">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaPct.toFixed(2)}% ${fromGpd ? gpdUnit : (isEn ? 'gap' : 'd\'écart')})` : (isEn ? 'Player Advantage / Parity' : 'Avance Joueur / Parité')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? 'Detailed comparison of weapon honing rank, quality additional damage, base weapon power, and Tier 1 (Aegir) vs Tier 2 (Serka Shadow Raid) gear transfer mechanics.'
              : 'Comparaison détaillée du niveau d\'affinage d\'arme, des dégâts additionnels de qualité, de la Puissance d\'Arme brute et des mécaniques de transfert Aegir (Palier 1) vers Serka (Palier 2).'}
          </div>
        </div>

        <!-- Bannière Pédagogique : Transfert de Stuff Serka & Décalage d\'Affinage -->
        <div class="stats-educational-banner baseatk" style="border-left-color: #E0A43A;">
          <span class="edu-icon"></span>
          <div class="edu-content">
            <strong>${isEn ? 'Understanding T4 Weapon Tiers: Aegir (Tier 1) vs Serka (Tier 2)' : 'Comprendre les Paliers d\'Arme T4 : Aegir (Palier 1) vs Serka (Palier 2)'}</strong>
            <div>
              ${isEn
                ? `The <strong>Serka Shadow Raid</strong> introduces <strong>Tier 2 Advanced Ancient Equipment</strong>. When transferring an Aegir weapon (+20 to +25) to Serka gear, the raw honing number drops by <strong>9 levels</strong>, while preserving and expanding its base item level (+45 base iLvl leap):<br>
                  • <strong>Serka Weapon +15</strong> has a base item level of <strong>1750 iLvl</strong> (with +40 Adv. Honing), which is mathematically equivalent to an <strong>Aegir Weapon +24</strong>.<br>
                  • A Serka weapon provides a tremendous leap in <strong>Weapon Power (+30,000+ WP)</strong>, directly inflating your Base AP and raid damage.`
                : `Le <strong>Raid Shadow Serka</strong> introduit le palier d'équipement <strong>T4 Palier 2 (Ancien Avancé)</strong>. Lors du transfert d'une arme Aegir (+20 à +25) vers le stuff Serka, le chiffre brut d'affinage diminue de <strong>9 crans</strong> tout en augmentant la puissance réelle (+45 iLvl de base) :<br>
                  • Une <strong>Arme Serka +15</strong> atteint un niveau d'objet de <strong>1750 iLvl</strong> (avec Affinage Avancé +40), ce qui équivaut mathématiquement à une arme <strong>Aegir +24</strong>.<br>
                  • Le passage à l'arme Serka injecte un saut massif de <strong>Puissance d'Arme (+30 000+ WP)</strong>, augmentant exponentiellement votre Attaque de Base et votre Combat Power.`
              }
            </div>
          </div>
        </div>

        <!-- Cartes Face-à-Face Joueur vs Cible -->
        <div class="astrogems-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card astrogems-card player-card ${cpImpact > 0 ? 'has-gap' : 'parity'}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #E0A43A; margin-left: 6px;">
                  ${p.ilvlPiece.toFixed(0)} iLvl Arme
                </span>
              </div>
              ${fromGpd ? '' : `<span class="acc-piece-gain-pill neutral">
                +${p.bonusPct.toFixed(2)}% Mult.
              </span>`}
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${isEn ? 'Gear Tier' : 'Palier de Stuff'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">${pTierLabel}</span>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Honing Rank' : 'Niveau d\'Affinage'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">+${p.wLvl} ${p.isSerka ? `(Éq. +${p.effWLvl})` : ''}</span>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Quality' : 'Qualité d\'Arme'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">Qualité ${p.quality} (+${p.qualityVal.toFixed(2)}% Dégâts)</span>
              </div>
              <div class="acc-line-badge low">
                <span><strong>${isEn ? 'Weapon Power' : 'Puissance d\'Arme'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#E0A43A;">${formatNumber(p.weaponPower)} WP</span>
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card astrogems-card target-card parity">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(140, 192, 132, 0.2); color: #8CC084; margin-left: 6px;">
                  ${t.ilvlPiece.toFixed(0)} iLvl Arme
                </span>
              </div>
              <span class="acc-piece-gain-pill ${cpImpact > 0 ? 'gap' : 'neutral'}">
                ${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${isEn ? 'Gear Tier' : 'Palier de Stuff'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">${tTierLabel}</span>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Honing Rank' : 'Niveau d\'Affinage'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">+${t.wLvl} ${t.isSerka ? `(Éq. +${t.effWLvl})` : ''}</span>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Quality' : 'Qualité d\'Arme'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">Qualité ${t.quality} (+${t.qualityVal.toFixed(2)}% Dégâts)</span>
              </div>
              <div class="acc-line-badge low">
                <span><strong>${isEn ? 'Weapon Power' : 'Puissance d\'Arme'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">${formatNumber(t.weaponPower)} WP</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé -->
        <div class="astrogems-table-container">
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Weapon Metric' : 'Métrique d\'Arme'}</th>
                <th>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</th>
                <th>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence'))}</th>
                <th class="col-cp-gain">${isEn ? 'Comparative Delta' : 'Écart Comparatif'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${isEn ? 'Gear Tier & Set' : 'Palier de Stuff & Set'}</strong></td>
                <td>${pTierLabel}</td>
                <td><strong style="color:#8CC084;">${tTierLabel}</strong></td>
                <td class="col-cp-gain">${t.isSerka && !p.isSerka ? (isEn ? 'Tier 2 Serka Shift' : 'Transfert Serka Palier 2') : (isEn ? 'Same Tier' : 'Même Palier')}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Effective Honing Level' : 'Niveau d\'Affinage Équivalent'}</strong></td>
                <td>+${p.effWLvl} ${p.isSerka ? `(Affiché +${p.wLvl})` : ''}</td>
                <td><strong style="color:#8CC084;">+${t.effWLvl} ${t.isSerka ? `(Affiché +${t.wLvl})` : ''}</strong></td>
                <td class="col-cp-gain">${dLvl > 0 ? `+${dLvl} crans d'écart` : (dLvl < 0 ? `${dLvl} crans` : '= 0')}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Raw Weapon Power' : 'Puissance d\'Arme Brute'}</strong></td>
                <td>${formatNumber(p.weaponPower)} WP</td>
                <td><strong style="color:#8CC084;">${formatNumber(t.weaponPower)} WP</strong></td>
                <td class="col-cp-gain"><strong>${dWp > 0 ? `+${formatNumber(dWp)} WP` : `${formatNumber(dWp)} WP`}</strong></td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Weapon Quality Dmg' : 'Dégâts de Qualité'}</strong></td>
                <td>Qualité ${p.quality} (+${p.qualityVal.toFixed(2)}%)</td>
                <td>Qualité ${t.quality} (+${t.qualityVal.toFixed(2)}%)</td>
                <td class="col-cp-gain">${(t.qualityVal - p.qualityVal) >= 0 ? `+${(t.qualityVal - p.qualityVal).toFixed(2)}%` : `${(t.qualityVal - p.qualityVal).toFixed(2)}%`}</td>
              </tr>
              <tr>
                <td><strong>${fromGpd ? (gpdUnit === 'Buff' ? (isEn ? 'Gap priced like the GPD (honing)' : 'Écart chiffré comme le GPD (affinage)') : (isEn ? 'Gap priced like the GPD (honing + quality)' : 'Écart chiffré comme le GPD (affinage + qualité)')) : (isEn ? 'Total Weapon System Score' : 'Score Multiplicateur d\'Arme')}</strong></td>
                <td>${fromGpd ? '—' : `+${p.bonusPct.toFixed(2)}%`}</td>
                <td><strong style="color:#8CC084;">${fromGpd ? '—' : `+${t.bonusPct.toFixed(2)}%`}</strong></td>
                <td class="col-cp-gain">${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)}%${fromGpd ? ` ${gpdUnit}` : ''}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Combat Power Impact' : 'Impact sur le Combat Power'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Recommandation Finale -->
        <div class="astrogems-verdict-banner" style="margin-top:14px; border-left-color:#E07A63;">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            <strong style="color:#E07A63;">${isEn ? 'Optimization Recommendation:' : 'Recommandation d\'Optimisation :'}</strong>
            <span>${isEn
              ? `To bridge this +${cpImpact} CP gap: prioritize advancing to the Serka Shadow Raid (Hard 1730+ / Nightmare 1740+) to craft and transfer your weapon into Tier 2 Advanced Ancient (+45 base iLvl leap and +30k+ Weapon Power). If already in Serka, hone your weapon beyond +15.`
              : `Pour combler ce retard de +${cpImpact} CP : prioriser l'accès au Raid Shadow Serka (Hard 1730+ / Nightmare 1740+) pour forger et transférer votre arme vers le palier Ancien Avancé (gain immédiat de +45 iLvl de base et +30k+ de Puissance d'Arme). Si déjà transféré, continuer l'affinage au-delà de +15.`}</span>
          </div>
        </div>
      </div>
    `;
}

function extractCharacterArmorsDetails(char, isEn) {
  const sys = extractPlayerSystems(char, isEn);
  const arm = sys.armors || {};
  const allBpParts = (char.rawProfile && char.rawProfile.battlePoint && char.rawProfile.battlePoint.parts)
    || (char.battlePoint && char.battlePoint.parts)
    || (char.rawProfile && char.rawProfile.loadout && char.rawProfile.loadout.battlePoint && char.rawProfile.loadout.battlePoint.parts)
    || (char.loadout && char.loadout.battlePoint && char.loadout.battlePoint.parts)
    || [];
  const t1Part = allBpParts.find(p => p.type === 1);
  const t2Part = allBpParts.find(p => p.type === 2);
  const mainStat = t1Part ? (t1Part.mainStat || 0) : (char.mainStat || 0);
  const maxHp = t2Part ? (t2Part.maxHp || 0) : (char.maxHp || 0);
  const mainStatName = getMainStatName(char.className || '', isEn);

  const avgArmor = arm.avgArmor !== undefined ? arm.avgArmor : 18;
  const effAvgArmor = arm.effAvgArmor !== undefined ? arm.effAvgArmor : avgArmor;
  const isSerka = !!arm.isSerka;
  const serkaArmorCount = arm.serkaArmorCount !== undefined ? arm.serkaArmorCount : (isSerka ? 5 : 0);
  const bonusPct = arm.bonusPct || 17.0;
  const adv = char.advHoning !== undefined ? char.advHoning : 40;
  const ilvlPiece = isSerka ? (1655 + avgArmor * 5 + adv * 0.5) : (1610 + avgArmor * 5 + adv * 0.5);

  return {
    avgArmor,
    effAvgArmor,
    isSerka,
    serkaArmorCount,
    mainStat,
    maxHp,
    mainStatName,
    bonusPct,
    adv,
    ilvlPiece
  };
}

// gpdDelta : écart chiffré comme le GPD (% DPS ou % Buff), remplace l'ancien score multiplicateur
function buildArmorsBreakdownHtml(player, target, cpImpact, isEn, gpdDelta) {
  const p = extractCharacterArmorsDetails(player, isEn);
  const t = extractCharacterArmorsDetails(target, isEn);
  const fromGpd = typeof gpdDelta === 'number';
  const gpdUnit = player.role === 'support' ? 'Buff' : 'DPS';
  const deltaPct = fromGpd ? gpdDelta : Number((t.bonusPct - p.bonusPct).toFixed(2));
  const dMainStat = t.mainStat - p.mainStat;
  const dLvl = t.effAvgArmor - p.effAvgArmor;

  const pTierLabel = p.isSerka ? (isEn ? `Serka Tier 2 (${p.serkaArmorCount}/5 Adv. Ancient)` : `Serka Palier 2 (${p.serkaArmorCount}/5 Ancien Avancé)`) : (isEn ? 'Aegir Tier 1 (Ancient)' : 'Aegir Palier 1 (Ancien)');
  const tTierLabel = t.isSerka ? (isEn ? `Serka Tier 2 (${t.serkaArmorCount}/5 Adv. Ancient)` : `Serka Palier 2 (${t.serkaArmorCount}/5 Ancien Avancé)`) : (isEn ? 'Aegir Tier 1 (Ancient)' : 'Aegir Palier 1 (Ancien)');

  return `
      <div class="acc-breakdown-panel armors-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'T4 Armors Honing, Main Stat & Gear Tier Breakdown' : 'Détail de l\'Affinage des Armures T4, Stat Principale & Palier d\'Équipement'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(232, 230, 220, 0.15); border-color: rgba(232, 230, 220, 0.35); color: #E0A43A;">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaPct.toFixed(2)}% ${fromGpd ? gpdUnit : (isEn ? 'gap' : 'd\'écart')})` : (isEn ? 'Player Advantage / Parity' : 'Avance Joueur / Parité')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? 'Comprehensive comparison of the 5 armor pieces (Head, Shoulders, Chest, Pants, Gloves), Main Stat contributions, and Tier 1 (Aegir) vs Tier 2 (Serka) gear transfer mechanics.'
              : 'Comparaison détaillée des 5 pièces d\'armure (Casque, Épaulières, Torse, Pantalon, Gants), de l\'apport en Stat Principale et des mécaniques de transfert Aegir (Palier 1) vers Serka (Palier 2).'}
          </div>
        </div>

        <!-- Bannière Pédagogique : Armures Serka & Stat Principale -->
        <div class="stats-educational-banner baseatk" style="border-left-color: #E0A43A;">
          <span class="edu-icon"></span>
          <div class="edu-content">
            <strong>${isEn ? 'Understanding T4 Armors: The Bedrock of Your Main Stat' : 'Comprendre les Armures T4 : Le Socle de votre Stat Principale'}</strong>
            <div>
              ${isEn
                ? `In Lost Ark T4, the 5 armor pieces supply the overwhelming majority of your <strong>Main Stat (${escapeHtml(p.mainStatName)})</strong> and Max HP.<br>
                  • Transferring to the <strong>Serka Shadow Raid set</strong> advances your gear by <strong>+9 equivalent honing levels</strong> (+45 base iLvl).<br>
                  • <strong>Serka Armors +12</strong> reach <strong>1735 iLvl</strong> (with +40 Adv. Honing), providing far greater Main Stat than Aegir +18/+19 armors (1720-1725 iLvl).`
                : `Dans Lost Ark T4, les 5 pièces d'armure fournissent l'immense majorité de votre <strong>Stat Principale (${escapeHtml(p.mainStatName)})</strong> et de vos Points de Vie Max.<br>
                  • Le transfert vers le set du <strong>Raid Shadow Serka</strong> décale votre équipement de <strong>+9 crans d'affinage équivalents</strong> (+45 iLvl de base).<br>
                  • Des <strong>Armures Serka +12</strong> atteignent <strong>1735 iLvl</strong> (avec Affinage Avancé +40), octroyant des dizaines de milliers de points de Stat Principale de plus que des armures Aegir +18/+19 (1720-1725 iLvl).`
              }
            </div>
          </div>
        </div>

        <!-- Cartes Face-à-Face Joueur vs Cible -->
        <div class="astrogems-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card astrogems-card player-card ${cpImpact > 0 ? 'has-gap' : 'parity'}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #E0A43A; margin-left: 6px;">
                  ${p.ilvlPiece.toFixed(0)} iLvl Armures
                </span>
              </div>
              ${fromGpd ? '' : `<span class="acc-piece-gain-pill neutral">
                +${p.bonusPct.toFixed(2)}% Mult.
              </span>`}
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${isEn ? 'Gear Tier' : 'Palier de Stuff'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">${pTierLabel}</span>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Avg Honing' : 'Affinage Moyen'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">+${p.avgArmor} ${p.isSerka ? `(Éq. +${p.effAvgArmor})` : ''}</span>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${escapeHtml(p.mainStatName)}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(p.mainStat)}</span>
              </div>
              <div class="acc-line-badge low">
                <span><strong>${isEn ? 'Max HP' : 'PV Maximum'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#E0A43A;">${formatNumber(p.maxHp)}</span>
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card astrogems-card target-card parity">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(140, 192, 132, 0.2); color: #8CC084; margin-left: 6px;">
                  ${t.ilvlPiece.toFixed(0)} iLvl Armures
                </span>
              </div>
              <span class="acc-piece-gain-pill ${cpImpact > 0 ? 'gap' : 'neutral'}">
                ${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${isEn ? 'Gear Tier' : 'Palier de Stuff'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">${tTierLabel}</span>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Avg Honing' : 'Affinage Moyen'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">+${t.avgArmor} ${t.isSerka ? `(Éq. +${t.effAvgArmor})` : ''}</span>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${escapeHtml(t.mainStatName)}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">${formatNumber(t.mainStat)}</span>
              </div>
              <div class="acc-line-badge low">
                <span><strong>${isEn ? 'Max HP' : 'PV Maximum'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">${formatNumber(t.maxHp)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé -->
        <div class="astrogems-table-container">
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Armor Metric' : 'Métrique d\'Armure'}</th>
                <th>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</th>
                <th>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence'))}</th>
                <th class="col-cp-gain">${isEn ? 'Comparative Delta' : 'Écart Comparatif'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${isEn ? 'Gear Tier & Set' : 'Palier de Stuff & Set'}</strong></td>
                <td>${pTierLabel}</td>
                <td><strong style="color:#8CC084;">${tTierLabel}</strong></td>
                <td class="col-cp-gain">${t.isSerka && !p.isSerka ? (isEn ? 'Tier 2 Serka Shift' : 'Transfert Serka Palier 2') : (isEn ? 'Same Tier' : 'Même Palier')}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Effective Honing Level' : 'Niveau d\'Affinage Équivalent'}</strong></td>
                <td>+${p.effAvgArmor} ${p.isSerka ? `(Affiché +${p.avgArmor})` : ''}</td>
                <td><strong style="color:#8CC084;">+${t.effAvgArmor} ${t.isSerka ? `(Affiché +${t.avgArmor})` : ''}</strong></td>
                <td class="col-cp-gain">${dLvl > 0 ? `+${dLvl} crans d'écart` : (dLvl < 0 ? `${dLvl} crans` : '= 0')}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Main Stat' : 'Stat Principale'} (${escapeHtml(p.mainStatName)})</strong></td>
                <td>${formatNumber(p.mainStat)}</td>
                <td><strong style="color:#8CC084;">${formatNumber(t.mainStat)}</strong></td>
                <td class="col-cp-gain"><strong>${dMainStat > 0 ? `+${formatNumber(dMainStat)} pts` : `${formatNumber(dMainStat)} pts`}</strong></td>
              </tr>
              <tr>
                <td><strong>${fromGpd ? (isEn ? 'Gap priced like the GPD (item level table)' : 'Écart chiffré comme le GPD (table des niveaux d\'objet)') : (isEn ? 'Total Armor System Score' : 'Score Multiplicateur d\'Armure')}</strong></td>
                <td>${fromGpd ? '—' : `+${p.bonusPct.toFixed(2)}%`}</td>
                <td><strong style="color:#8CC084;">${fromGpd ? '—' : `+${t.bonusPct.toFixed(2)}%`}</strong></td>
                <td class="col-cp-gain">${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)}%${fromGpd ? ` ${gpdUnit}` : ''}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Combat Power Impact' : 'Impact sur le Combat Power'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Recommandation Finale -->
        <div class="astrogems-verdict-banner" style="margin-top:14px; border-left-color:#E0A43A;">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            <strong style="color:#E0A43A;">${isEn ? 'Optimization Recommendation:' : 'Recommandation d\'Optimisation :'}</strong>
            <span>${isEn
              ? `To bridge this +${cpImpact} CP gap: hone your Aegir armors toward +20 to qualify for the Serka raid transfer, or craft Serka armors (Hard/Nightmare) for large Main Stat gains. Completing Advanced Honing (+40) also heavily inflates your defensive and main stat pool.`
              : `Pour combler ce retard de +${cpImpact} CP : monter vos armures Aegir vers le palier +20 pour préparer le transfert Serka, ou forger les pièces d'armure Serka (Hard/Nightmare) pour débloquer des gains massifs de Stat Principale. Finaliser l'Affinage Avancé (+40) renforce aussi fortement vos caractéristiques.`}</span>
          </div>
        </div>
      </div>
    `;
}


function buildCombatStatsBreakdownHtml(player, target, cpImpact, isEn) {
  const p = extractCharacterCombatStatsDetails(player, isEn);
  const t = extractCharacterCombatStatsDetails(target, isEn);
  const pSys = extractPlayerSystems(player, isEn);
  const tSys = resolveTargetSystems(target, isEn);

  const pPct = (pSys.combatStats && pSys.combatStats.bonusPct) ? pSys.combatStats.bonusPct : 95.44;
  const tPct = (tSys.combatStats && tSys.combatStats.bonusPct) ? tSys.combatStats.bonusPct : 99.68;
  const deltaPct = Number((tPct - pPct).toFixed(2));
  const deltaPts = t.totalPts - p.totalPts;

  return `
      <div class="acc-breakdown-panel combatstats-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'Combat Stats Breakdown (Crit / Spec / Swiftness)' : 'Détail des Caractéristiques de Combat (Crit / Spé / Rapide)'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(140, 192, 132, 0.15); border-color: rgba(140, 192, 132, 0.35); color: #8CC084;">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaPct.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (isEn ? 'Optimized parity' : 'Parité optimale')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? 'Detailed breakdown of your total combat stat points (' + formatNumber(p.totalPts) + ' vs ' + formatNumber(t.totalPts) + ' pts), explaining why there is a gap and how accessory qualities and bracelet rolls dictate performance.'
              : 'Décomposition détaillée de vos points de caractéristiques de combat (' + formatNumber(p.totalPts) + ' vs ' + formatNumber(t.totalPts) + ' pts), expliquant pourquoi il y a un écart et comment la qualité des bijoux et le bracelet gouvernent ces chiffres.'}
          </div>
        </div>

        <!-- Bannière Pédagogique : Différence essentielle entre Combat Stats et Main Stat -->
        <div class="stats-educational-banner combatstats">
          <span class="edu-icon"></span>
          <div class="edu-content">
            <strong>${isEn ? 'Crucial Distinction: Combat Stats vs Main Stat' : 'Distinction Fondamentale : Caractéristiques de Combat vs Stat Principale'}</strong>
            <div>
              ${isEn
                ? `<strong>Main Stat (Str/Dex/Int):</strong> Directly increases raw Attack Power and damage scaling.<br>
                   <strong>Combat Stats (Crit/Spec/Swift):</strong> Do NOT increase raw weapon attack; instead, they amplify <strong>mechanical gameplay percentages</strong>:
                   <ul style="margin:6px 0 0 16px; padding:0;">
                     <li><strong>Swiftness:</strong> Increases Attack/Move Speed and provides strong <strong>Cooldown Reduction (CDR %)</strong>. For Supports, this is mandatory to sustain 100% uptime on identity auras, shields, and attack buffs.</li>
                     <li><strong>Specialization:</strong> Speeds up Identity Gauge gain (Piety for Paladin) and directly scales Identity Aura buff efficiency.</li>
                     <li><strong>Crit Rate:</strong> Increases the probability of landing critical strikes (critical for DPS).</li>
                   </ul>`
                : `<strong>Stat Principale (Force / Dex / Int) :</strong> Augmente la Puissance d'Attaque brute en points (Base AP).<br>
                   <strong>Caractéristiques de Combat (Crit / Spé / Rapide) :</strong> N'augmentent pas l'attaque brute de l'arme, mais amplifient des <strong>pourcentages mécaniques de gameplay</strong> :
                   <ul style="margin:6px 0 0 16px; padding:0;">
                     <li><strong>Rapidité (Swiftness) :</strong> Vitesse d'attaque, vitesse de déplacement, et surtout <strong>Réduction du Temps de Recharge (CDR %)</strong>. En Support, c'est indispensable pour maintenir 100% d'uptime sur l'Aura de Bénédiction, la marque et les buffs d'attaque.</li>
                     <li><strong>Spécialisation (Specialization) :</strong> Accélère le remplissage de la jauge d'identité (Piété pour Paladin) et amplifie le bonus de dégâts accordé par l'Aura.</li>
                     <li><strong>Critique (Crit Rate) :</strong> Augmente le taux de coup critique (vital pour les DPS).</li>
                   </ul>`
              }
            </div>
          </div>
        </div>

        <!-- Cartes Face-à-Face Joueur vs Cible -->
        <div class="astrogems-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card astrogems-card player-card ${cpImpact > 0 ? 'has-gap' : 'parity'}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #E0A43A; margin-left: 6px;">
                  ${formatNumber(p.totalPts)} pts
                </span>
              </div>
              <span class="acc-piece-gain-pill neutral">
                +${pPct.toFixed(2)}% Mult.
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${isEn ? 'Swiftness' : 'Rapidité'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(p.swift)} pts</span>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Specialization' : 'Spécialisation'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(p.specStat)} pts</span>
              </div>
              ${p.crit > 0 ? `
                <div class="acc-line-badge low">
                  <span><strong>${isEn ? 'Crit' : 'Critique'}</strong></span>
                  <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(p.crit)} pts</span>
                </div>
              ` : ''}
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Total Combat Stat Points' : 'Total Points de Combat'}</strong></span>
                <span style="font-family:var(--font-mono); font-weight:700; color:#E0A43A;">${formatNumber(p.totalPts)} pts</span>
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card astrogems-card target-card parity">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence BiS'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(140, 192, 132, 0.2); color: #8CC084; margin-left: 6px;">
                  ${formatNumber(t.totalPts)} pts
                </span>
              </div>
              <span class="acc-piece-gain-pill ${cpImpact > 0 ? 'gap' : 'neutral'}">
                ${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-line-badge high">
                <span><strong>${isEn ? 'Swiftness' : 'Rapidité'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(t.swift)} pts</span>
                  ${t.swift > p.swift ? `<span class="line-cp-pill">+${t.swift - p.swift}</span>` : ''}
                </div>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${isEn ? 'Specialization' : 'Spécialisation'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(t.specStat)} pts</span>
                  ${t.specStat > p.specStat ? `<span class="line-cp-pill">+${t.specStat - p.specStat}</span>` : ''}
                </div>
              </div>
              ${t.crit > 0 ? `
                <div class="acc-line-badge low">
                  <span><strong>${isEn ? 'Crit' : 'Critique'}</strong></span>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-family:var(--font-mono); font-weight:700;">${formatNumber(t.crit)} pts</span>
                    ${t.crit > p.crit ? `<span class="line-cp-pill">+${t.crit - p.crit}</span>` : ''}
                  </div>
                </div>
              ` : ''}
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Total Combat Stat Points' : 'Total Points de Combat'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">${formatNumber(t.totalPts)} pts</span>
                  ${deltaPts > 0 ? `<span class="line-cp-pill">+${deltaPts} pts</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé -->
        <div class="astrogems-compare-table-wrap" style="margin-top: 14px;">
          <div class="astrogems-compare-table-title">
            <span></span>
            <strong>${isEn ? 'Comparative Breakdown: Combat Stat Points' : 'Décomposition Détaillée : Points de Caractéristiques de Combat'}</strong>
          </div>
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Combat Stat Metric' : 'Statistique de Combat'}</th>
                <th>${isEn ? 'Your Character' : 'Votre Personnage'}</th>
                <th>${isEn ? 'Benchmark Target' : 'Référence Cible'}</th>
                <th style="text-align:right;">${isEn ? 'Point Delta' : 'Écart en Points'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${isEn ? 'Swiftness (CDR & Speed)' : 'Rapidité (CDR & Vitesse)'}</strong></td>
                <td>${formatNumber(p.swift)} pts</td>
                <td>${formatNumber(t.swift)} pts</td>
                <td class="col-cp-gain">${t.swift >= p.swift ? `+${t.swift - p.swift} pts` : `${t.swift - p.swift} pts`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Specialization (Identity & Aura)' : 'Spécialisation (Identité & Aura)'}</strong></td>
                <td>${formatNumber(p.specStat)} pts</td>
                <td>${formatNumber(t.specStat)} pts</td>
                <td class="col-cp-gain">${t.specStat >= p.specStat ? `+${t.specStat - p.specStat} pts` : `${t.specStat - p.specStat} pts`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Total Combined Points' : 'Total Points Combinés'}</strong></td>
                <td><strong>${formatNumber(p.totalPts)} pts</strong></td>
                <td><strong style="color:#8CC084;">${formatNumber(t.totalPts)} pts</strong></td>
                <td class="col-cp-gain"><strong>${deltaPts > 0 ? `+${deltaPts} pts` : `${deltaPts} pts`}</strong></td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Lost Ark Multiplier Score' : 'Multiplicateur Battre Point'}</strong></td>
                <td>+${pPct.toFixed(2)}%</td>
                <td>+${tPct.toFixed(2)}%</td>
                <td class="col-cp-gain">+${deltaPct.toFixed(2)}%</td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Combat Power Impact (Point Differential Contribution)' : 'Gain de Combat Power (Impact de l\'Écart de Points)'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- 3 Raisons de l'écart de points -->
        <div style="margin-top: 14px;">
          <div style="font-size:14px; font-weight:700; color:#E8E6DC; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span></span> <span>${isEn ? 'Why does the reference profile have +' + deltaPts + ' more Combat Stat points?' : 'Pourquoi la référence a-t-elle +' + deltaPts + ' points de Combat Stats en plus ?'}</span>
          </div>
          <div class="stats-factor-grid">
            <div class="stats-factor-card">
              <strong>${isEn ? 'T4 Accessory Quality (Neck/Ear/Ring)' : 'Qualité des 5 Bijoux T4 (Collier/Boucles/Anneaux)'}</strong>
              <span>${isEn ? 'Accessory stats directly scale with Quality (0-100). High quality (90-100) vs mid quality (65-75) yields ~70-110 extra combat stat points across all 5 pieces.' : 'Les stats des bijoux sont indexées sur la Qualité (0-100). Des bijoux qualité 90-100 vs qualité 65-75 apportent ~70 à 110 points de combat stat en plus sur les 5 bijoux.'}</span>
            </div>
            <div class="stats-factor-card">
              <strong>${isEn ? 'T4 Bracelet Stat Rolls' : 'Rolls de Stats sur Bracelet T4'}</strong>
              <span>${isEn ? 'A top-tier bracelet with double high combat stat rolls (+100 to +120 Swift/Spec) provides an immediate +40-60 point lead over a bracelet with mid rolls.' : 'Un bracelet avec double roll de stats de combat élevées (+100 à +120 Rapide/Spé) creuse une avance immédiate de 40 à 60 points sur un bracelet moyen.'}</span>
            </div>
            <div class="stats-factor-card">
              <strong>${isEn ? 'Permanent Stat Potions (Codex)' : 'Potions de Combat Permanentes (Codex)'}</strong>
              <span>${isEn ? 'Adventurer\'s Tome completion (80-90% brackets), Giant Hearts, and Una reputations grant ~30-50 permanent combat stat points across your roster.' : 'Les Tomes d\'Aventurier (paliers 80-90%), Cœurs de Géants et réputations offrent ~30 à 50 points de combat stats permanents sur le compte.'}</span>
            </div>
          </div>
        </div>

        <!-- Recommandation Finale -->
        <div class="astrogems-verdict-banner" style="margin-top:14px; border-left-color:#8CC084;">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            <strong style="color:#8CC084;">${isEn ? 'Optimization Recommendation:' : 'Recommandation d\'Optimisation :'}</strong>
            <span>${isEn
              ? `To bridge the +${cpImpact} CP gap: prioritize acquiring high-quality (85-100) T4 accessories on your main stats (Swiftness/Spec), roll a bracelet with dual high combat stat lines, and verify missing permanent combat stat potions in your Codex (Alt+D).`
              : `Pour combler les +${cpImpact} CP d'écart : viser des bijoux T4 de haute qualité (85 à 100) sur vos stats maîtresses (Rapidité / Spécialisation), chercher un bracelet avec double roll de stats de combat élevées, et vérifier les potions permanentes de combat stats non validées dans votre Codex (Alt+D).`}</span>
          </div>
        </div>
      </div>
    `;
}
