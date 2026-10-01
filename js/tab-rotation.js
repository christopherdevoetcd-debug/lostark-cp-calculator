// Onglet Analyse de rotation : combats de la base locale de LOA Logs (encounters.db), choisie par l'utilisateur.
// Le fichier est lu dans un worker (js/rotation/sqlite-worker.js, SQLite en WebAssembly), jamais envoyé. Calculs et
// conseils : modules de js/rotation (metrics.js, coach.js), les mêmes que l'outil en ligne de commande tools/rotation.
// Références par spé et par boss : data/rotation-ref.json (node tools/rotation/build-ref.mjs).
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

const ROT_MAX_ADVICE = 5; // au-delà, trop d'un coup : les plus importants d'abord, le build à part
const ROT_DAY_LIMIT = 50;

const rot = {
  worker: null, seq: 0, pending: new Map(),
  info: null, raids: null, dayFilter: '', busy: '', error: '',
  analysis: null, selected: null,
  mods: null, refData: null, skillData: null,
};

function rotUrl(path) {
  return new URL(path, document.baseURI).href;
}

function rotCall(type, extra = {}) {
  if (!rot.worker) {
    rot.worker = new Worker(rotUrl('js/rotation/sqlite-worker.js'), { type: 'module' });
    rot.worker.onmessage = ({ data }) => {
      const p = rot.pending.get(data.id);
      if (!p) return;
      rot.pending.delete(data.id);
      data.ok ? p.resolve(data.result) : p.reject(new Error(data.error));
    };
    rot.worker.onerror = e => {
      for (const p of rot.pending.values()) p.reject(new Error(e.message || 'worker'));
      rot.pending.clear();
    };
  }
  const id = ++rot.seq;
  return new Promise((resolve, reject) => {
    rot.pending.set(id, { resolve, reject });
    rot.worker.postMessage({ id, type, ...extra });
  });
}

// Modules de calcul, références et tables des compétences : chargés à la première ouverture d'une base.
async function rotLoadShared() {
  if (!rot.mods) {
    const [metrics, coach] = await Promise.all([import(rotUrl('js/rotation/metrics.js')), import(rotUrl('js/rotation/coach.js'))]);
    rot.mods = { metrics, coach };
  }
  if (!rot.refData || !rot.skillData) {
    const [refs, skills] = await Promise.all([
      fetch(rotUrl('data/rotation-ref.json')).then(r => (r.ok ? r.json() : null)),
      fetch(rotUrl('data/rotation-skills.json')).then(r => (r.ok ? r.json() : null)),
    ]);
    rot.refData = refs;
    rot.skillData = skills;
  }
}

function rotErrorText(msg) {
  if (msg === 'not-sqlite') return trLang('Ce fichier n\'est pas une base SQLite : choisis encounters.db dans le dossier de LOA Logs.', 'This file is not an SQLite database: choose encounters.db in the LOA Logs folder.');
  if (msg === 'not-loalogs') return trLang('Cette base n\'est pas celle de LOA Logs (tables des combats absentes).', 'This database is not a LOA Logs database (fight tables missing).');
  if (msg === 'file-changed') return trLang('Le fichier a changé depuis que tu l\'as choisi (LOA Logs a enregistré un combat) : choisis-le à nouveau.', 'The file changed since you picked it (LOA Logs saved a fight): pick it again.');
  return trLang(`Lecture impossible : ${msg}`, `Could not read the file: ${msg}`);
}

async function rotOpenFile(file) {
  rot.info = null; rot.raids = null; rot.analysis = null; rot.selected = null; rot.error = '';
  rot.busy = 'open';
  renderRotationTab();
  try {
    const [info] = await Promise.all([rotCall('open', { file }), rotLoadShared()]);
    rot.info = { ...info, name: file.name };
    rot.busy = '';
    await rotListRaids();
  } catch (e) {
    rot.busy = '';
    rot.error = rotErrorText(e.message);
    renderRotationTab();
  }
}

async function rotListRaids() {
  if (!rot.info) return;
  const opts = { limit: 10 };
  if (rot.dayFilter) {
    const [y, m, d] = rot.dayFilter.split('-').map(Number);
    opts.from = new Date(y, m - 1, d).getTime();
    opts.to = new Date(y, m - 1, d + 1).getTime();
    opts.limit = ROT_DAY_LIMIT;
  }
  rot.busy = 'list';
  rot.error = '';
  renderRotationTab();
  try {
    rot.raids = await rotCall('list', { opts });
  } catch (e) {
    rot.error = rotErrorText(e.message);
  }
  rot.busy = '';
  renderRotationTab();
}

async function rotAnalyze(encounterId) {
  rot.busy = 'analyze';
  rot.error = '';
  rot.analysis = null;
  renderRotationTab();
  try {
    const res = await rotCall('analyze', { encounterId });
    const { pickReference, scorePlayer } = rot.mods.metrics;
    const refs = rot.refData?.refs || null;
    for (const a of res.players) {
      const { ref, scope } = pickReference(refs, a.spec, res.encounter.boss);
      a.ref = ref;
      a.reference = ref ? { scope, n: ref.n } : null;
      a.score = scorePlayer(a, ref);
    }
    rot.analysis = res;
    const local = res.players.find(p => p.name === res.encounter.localPlayer);
    rot.selected = (local || res.players[0])?.name || null;
  } catch (e) {
    rot.error = rotErrorText(e.message);
  }
  rot.busy = '';
  renderRotationTab();
  const el = document.getElementById('rotAnalysis');
  if (el && rot.analysis) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- Formats ----------

function rotNum(x, d = 1) {
  if (x == null || !Number.isFinite(x)) return '—';
  return x.toLocaleString(isEnLang() ? 'en-US' : 'fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function rotPct(x, d = 1) {
  if (x == null || !Number.isFinite(x)) return '—';
  return isEnLang() ? `${rotNum(x * 100, d)}%` : `${rotNum(x * 100, d)} %`;
}
function rotClock(ms) {
  return `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
}
function rotDate(t) {
  return new Date(t).toLocaleString(isEnLang() ? 'en-GB' : 'fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function rotDifficulty(d) {
  if (isEnLang()) return d;
  return { Normal: 'Normal', Hard: 'Difficile', Nightmare: 'Cauchemar', 'Level 1': 'Niveau 1', 'Level 2': 'Niveau 2', 'Level 3': 'Niveau 3' }[d] || d;
}

// ---------- Rendu ----------

function renderRotationTab() {
  const pane = document.getElementById('tab-rotation');
  if (!pane) return;
  const info = document.getElementById('rotFileInfo');
  if (info) {
    if (rot.busy === 'open') info.textContent = trLang('Ouverture…', 'Opening…');
    else if (rot.info) {
      const range = rot.info.first ? ` · ${new Date(rot.info.first).toLocaleDateString(isEnLang() ? 'en-GB' : 'fr-FR')} → ${new Date(rot.info.last).toLocaleDateString(isEnLang() ? 'en-GB' : 'fr-FR')}` : '';
      info.textContent = `${rot.info.name} · ${rotNum(rot.info.size / 1048576, 0)} ${trLang('Mo', 'MB')} · ${rot.info.encounters} ${trLang('combats', 'fights')}${range}`;
    } else info.textContent = '';
  }
  const raidsPanel = document.getElementById('rotRaidsPanel');
  if (raidsPanel) raidsPanel.hidden = !rot.info;
  const dateInput = document.getElementById('rotDate');
  if (dateInput && dateInput.value !== rot.dayFilter) dateInput.value = rot.dayFilter;
  const latest = document.getElementById('rotLatest');
  if (latest) latest.classList.toggle('active', !rot.dayFilter);

  const raidsEl = document.getElementById('rotRaids');
  if (raidsEl) raidsEl.innerHTML = rotRaidsHtml();
  const an = document.getElementById('rotAnalysis');
  if (an) an.innerHTML = rotAnalysisHtml();
}

function rotRaidsHtml() {
  if (rot.busy === 'list') return `<p class="belg-empty">${trLang('Recherche des raids…', 'Looking for raids…')}</p>`;
  if (!rot.raids) return '';
  if (!rot.raids.length) {
    return `<p class="belg-empty">${rot.dayFilter
      ? trLang('Aucun raid réussi ce jour-là (combats de plus de 2 minutes, hors solo et matchmaking).', 'No cleared raid that day (fights over 2 minutes, solo and matchmaking excluded).')
      : trLang('Aucun raid réussi dans cette base.', 'No cleared raid in this database.')}</p>`;
  }
  const current = rot.analysis?.encounter.id;
  const rows = rot.raids.map(r => `
    <tr class="rot-raid-row${r.id === current ? ' active' : ''}" data-rot-encounter="${r.id}" tabindex="0">
      <td class="market-num">${escapeHtml(rotDate(r.fight_start))}</td>
      <td>${escapeHtml(r.current_boss)}</td>
      <td>${escapeHtml(rotDifficulty(r.difficulty))}</td>
      <td class="market-num">${rotClock(r.duration)}</td>
      <td>${escapeHtml(r.local_player || '')}</td>
    </tr>`).join('');
  return `<div class="table-container"><table class="market-table rot-table">
    <thead><tr><th>${trLang('Date', 'Date')}</th><th>${trLang('Boss', 'Boss')}</th><th>${trLang('Difficulté', 'Difficulty')}</th><th>${trLang('Durée', 'Duration')}</th><th>${trLang('Ton personnage', 'Your character')}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    ${rot.dayFilter && rot.raids.length >= ROT_DAY_LIMIT ? `<p class="belg-note">${trLang(`Les ${ROT_DAY_LIMIT} plus récents de ce jour.`, `The ${ROT_DAY_LIMIT} most recent of that day.`)}</p>` : ''}`;
}

function rotAnalysisHtml() {
  if (rot.error) return `<div class="belg-panel"><p class="rot-error">${escapeHtml(rot.error)}</p></div>`;
  if (rot.busy === 'analyze') return `<div class="belg-panel"><p class="belg-empty">${trLang('Analyse du combat…', 'Analysing the fight…')}</p></div>`;
  const res = rot.analysis;
  if (!res) return '';
  const e = res.encounter;
  const downMs = res.downtime.reduce((t, [a, b]) => t + b - a, 0);
  const bible = e.bibleId ? ` · <a href="https://lostark.bible/logs/${encodeURIComponent(e.bibleId)}" target="_blank" rel="noopener">lostark.bible</a>` : '';
  const rows = res.players.map(a => {
    const sc = a.score?.score;
    return `<tr class="rot-player-row${a.name === rot.selected ? ' active' : ''}" data-rot-player="${escapeHtml(a.name)}" tabindex="0">
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.className)} <span class="rot-dim">${escapeHtml(a.spec || '')}</span></td>
      <td class="market-num">${a.combatPower ? rotNum(a.combatPower, 0) : '—'}</td>
      <td class="market-num">${rotNum(a.dps / 1e6, 0)} M</td>
      <td class="market-num">${rotPct(a.activity)}</td>
      <td class="market-num">${a.support ? `<span class="rot-dim">${trLang('support', 'support')}</span>` : rotPct(a.fullBuffRate)}</td>
      <td class="market-num">${a.positionalShare >= 0.05 ? rotPct(a.positionalRate) : '—'}</td>
      <td class="market-num rot-score-cell">${sc != null ? sc : '—'}</td>
    </tr>`;
  }).join('');
  const player = res.players.find(p => p.name === rot.selected);
  return `<div class="belg-panel">
      <h3>${escapeHtml(e.boss)} <span class="rot-dim">${escapeHtml(rotDifficulty(e.difficulty))} · ${rotClock(e.timelineMs)} · ${escapeHtml(rotDate(e.fightStart))}${bible}</span></h3>
      <p class="belg-note">${trLang(`Phases où moins de la moitié du raid frappe (boss absent, mécanique) : ${rotClock(downMs)}, retirées du temps jouable.`, `Phases where less than half the raid deals damage (boss away, mechanic): ${rotClock(downMs)}, removed from the playable time.`)}</p>
      <div class="table-container"><table class="market-table rot-table">
        <thead><tr><th>${trLang('Joueur', 'Player')}</th><th>${trLang('Classe / spé', 'Class / spec')}</th><th>CP</th><th>DPS</th>
          <th title="${trLang('Part du temps jouable passée à lancer des compétences', 'Share of the playable time spent using skills')}">${trLang('Activité', 'Activity')}</th>
          <th title="${trLang('Part des dégâts faits avec le buff d\'attaque et la Marque du support', 'Share of damage dealt with both the support attack buff and Brand')}">${trLang('PA + Marque', 'AP + Brand')}</th>
          <th>${trLang('Placement', 'Positioning')}</th><th>${trLang('Note', 'Score')}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      <p class="belg-note">${trLang('Clique sur un joueur pour voir sa note et ses conseils.', 'Click a player to see their score and advice.')}</p>
    </div>
    ${player ? rotPlayerHtml(player, e) : ''}`;
}

function rotScopeText(a) {
  const r = a.reference;
  return r.scope === 'boss'
    ? trLang(`rang parmi ${r.n} logs de ${a.spec} sur ce boss`, `rank among ${r.n} ${a.spec} logs on this boss`)
    : trLang(`rang parmi ${r.n} logs de ${a.spec}, tous boss (pas assez sur celui-ci)`, `rank among ${r.n} ${a.spec} logs, all bosses (not enough on this one)`);
}

function rotPartsHtml(a) {
  const p = a.score.parts;
  const labels = a.support
    ? [['ap', trLang('Buff d\'attaque', 'Attack buff')], ['brand', trLang('Marque', 'Brand')], ['identity', trLang('Identité', 'Identity')], ['hat', 'T'], ['activity', trLang('Activité', 'Activity')]]
    : [['activity', trLang('Activité', 'Activity')], ['skills', trLang('Compétences', 'Skills')], ['buffs', trLang('Buffs', 'Buffs')], ['positional', trLang('Placement', 'Positioning')]];
  return labels.map(([k, l]) => `<div class="belg-card"><span class="belg-card-label">${l}</span><span class="belg-card-value rot-part">${p[k] ?? '—'}</span></div>`).join('');
}

function rotPlayerHtml(a, enc) {
  const lang = isEnLang() ? 'en' : 'fr';
  let head;
  if (a.score && a.score.score != null) {
    head = `<div class="rot-score-row">
        <div class="rot-score"><span class="rot-score-value">${a.score.score}</span><span class="rot-dim">/ 100</span></div>
        <div class="rot-score-text">${trLang('Note d\'exécution : ', 'Execution score: ')}${escapeHtml(rotScopeText(a))}.
          <span class="rot-dim">${trLang('50 = la médiane de ta spé. La note ne dépend pas de ton équipement : elle compare ta façon de jouer.', '50 = your spec median. The score does not depend on your gear: it compares how you play.')}</span></div>
      </div>
      <div class="belg-cards rot-parts">${rotPartsHtml(a)}</div>`;
  } else if (a.support && a.ref && !a.supportCoverage) {
    head = `<p class="belg-empty">${trLang('Pas de note : la couverture du groupe n\'est pas calculée (groupe sans DPS ou avec deux supports).', 'No score: party coverage is not computed (party without DPS or with two supports).')}</p>`;
  } else {
    head = `<p class="belg-empty">${trLang(`Pas encore assez de logs de référence pour ${escapeHtml(a.spec || '?')} (il en faut au moins 8) : pas de note ni de conseils comparés. Les mesures ci-dessous restent valables.`, `Not enough reference logs for ${escapeHtml(a.spec || '?')} yet (at least 8 needed): no score or compared advice. The measures below still apply.`)}</p>`;
  }

  const advice = a.ref ? rot.mods.coach.coachPlayer(a, a.ref, rot.refData?.builds?.[a.spec], { lang, arkPassiveNames: rot.skillData?.arkPassive || {}, skillMeta: rot.skillData?.skills || {} }) : [];
  const main = advice.filter(c => c.kind !== 'build');
  const shown = [...main.slice(0, ROT_MAX_ADVICE), ...advice.filter(c => c.kind === 'build')];
  let adviceHtml = '';
  if (a.ref) {
    adviceHtml = shown.length
      ? shown.map((c, i) => rotAdviceHtml(c, i)).join('') + (main.length > ROT_MAX_ADVICE ? `<p class="belg-note">${rotMoreText(main.length - ROT_MAX_ADVICE)}</p>` : '')
      : `<p class="belg-empty">${trLang('Rien ne ressort : tu joues comme les meilleurs de ta spé sur ce boss.', 'Nothing stands out: you play like the best of your spec on this boss.')}</p>`;
  }

  return `<div class="belg-panel rot-player">
      <h3>${escapeHtml(a.name)} <span class="rot-dim">${escapeHtml(a.className)} · ${escapeHtml(a.spec || '')}</span></h3>
      ${head}
      ${a.ref ? `<h4 class="rot-h4">${trLang('Comment progresser', 'How to improve')}</h4>${adviceHtml}` : ''}
      <details class="rot-details"><summary>${trLang('Détail des mesures', 'Measure details')}</summary>${rotMeasuresHtml(a)}</details>
    </div>`;
}

function rotMoreText(n) {
  return n === 1
    ? trLang('…et 1 point moins important : commence par ceux-là.', '…and 1 smaller point: work on these first.')
    : trLang(`…et ${n} points moins importants : commence par ceux-là.`, `…and ${n} smaller points: work on these first.`);
}

function rotAdviceHtml(c, i) {
  const gain = c.gainPct != null ? `<span class="rot-gain">≈ +${rotNum(c.gainPct)}${isEnLang() ? '%' : ' %'} ${trLang('de dégâts', 'damage')}</span>` : '';
  const how = c.how.length ? `<ul class="rot-how">${c.how.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul>` : '';
  const moments = c.moments.length ? `<ul class="rot-moments">${c.moments.map(m => `<li>${escapeHtml(m.text)}</li>`).join('')}</ul>` : '';
  return `<div class="rot-advice${c.kind === 'build' ? ' rot-advice-build' : ''}">
      <div class="rot-advice-title"><span class="rot-advice-num">${i + 1}</span>${escapeHtml(c.title)}${gain}</div>
      <p>${escapeHtml(c.what)}</p>
      <p class="rot-why">${escapeHtml(c.why)}</p>
      ${how}${moments}
    </div>`;
}

function rotMeasuresHtml(a) {
  const parts = [];
  parts.push(`<p>${trLang(`Temps perdu : ${rotClock(a.lostMs)} sur ${rotClock(a.availableMs - a.deadMs)} jouables (activité ${rotPct(a.activity)})${a.deadMs >= 1000 ? `, ${rotClock(a.deadMs)} à terre` : ''}.`, `Lost time: ${rotClock(a.lostMs)} out of ${rotClock(a.availableMs - a.deadMs)} playable (activity ${rotPct(a.activity)})${a.deadMs >= 1000 ? `, ${rotClock(a.deadMs)} dead` : ''}.`)}
    ${a.sharedPauseMs >= 1000 ? trLang(`Pauses partagées avec d'autres DPS (mécanique probable, non comptées) : ${rotClock(a.sharedPauseMs)}.`, `Pauses shared with other DPS (likely a mechanic, not counted): ${rotClock(a.sharedPauseMs)}.`) : ''}</p>`);
  const gaps = a.longestGaps.filter(g => g.lostMs >= 2000);
  if (gaps.length) parts.push(`<ul class="rot-moments">${gaps.map(g => `<li>${rotClock(g.from)} → ${rotClock(g.to)}${trLang(' : ', ': ')}${rotNum(g.lostMs / 1000)} s ${trLang('sans compétence', 'without a skill')}${g.shared ? ` <span class="rot-dim">(${trLang('pause partagée : ', 'shared pause: ')}${escapeHtml(g.pausedWith.join(', '))})</span>` : ''}</li>`).join('')}</ul>`);
  if (a.supportCoverage) {
    const c = a.supportCoverage, rs = a.ref?.support;
    const med = k => (rs?.[k] ? ` <span class="rot-dim">(${trLang('médiane', 'median')} ${rotPct(rs[k][10])}, ${trLang('top 10 %', 'top 10%')} ${rotPct(rs[k][18])})</span>` : '');
    parts.push(`<p>${trLang('Couverture du groupe (part des dégâts des DPS sous ton buff) :', 'Party coverage (share of DPS damage under your buff):')}</p>
      <ul class="rot-moments"><li>${trLang('Buff d\'attaque', 'Attack buff')} ${rotPct(c.ap)}${med('ap')}</li><li>${trLang('Marque', 'Brand')} ${rotPct(c.brand)}${med('brand')}</li><li>${trLang('Identité', 'Identity')} ${rotPct(c.identity)}${med('identity')}</li><li>T ${rotPct(c.hat)}${med('hat')}</li></ul>`);
  } else if (!a.support) {
    parts.push(`<p>${trLang(`Buffs : buff d'attaque du support sur ${rotPct(a.apRate)} de tes dégâts, Marque ${rotPct(a.brandRate)}, les deux ${rotPct(a.fullBuffRate)}, identité ${rotPct(a.identityRate)}, T ${rotPct(a.hatRate)}.`, `Buffs: support attack buff on ${rotPct(a.apRate)} of your damage, Brand ${rotPct(a.brandRate)}, both ${rotPct(a.fullBuffRate)}, identity ${rotPct(a.identityRate)}, T ${rotPct(a.hatRate)}.`)}</p>`);
  }
  if (a.positionalShare >= 0.05) parts.push(`<p>${trLang(`Placement : ${rotPct(a.positionalRate)} des dégâts des compétences à placement du bon côté (${rotPct(a.positionalShare)} de tes dégâts).`, `Positioning: ${rotPct(a.positionalRate)} of positional skill damage from the right side (${rotPct(a.positionalShare)} of your damage).`)}</p>`);

  const scored = new Map((a.score?.skillScores || []).map(s => [s.id, s]));
  const skills = a.skills.filter(s => (a.support ? s.casts > 0 && (scored.has(s.id) || s.share >= 0.02) : s.share >= 0.005 || scored.has(s.id)));
  const rows = skills.map(s => {
    const sc = scored.get(s.id);
    return `<tr><td>${escapeHtml(s.name)}</td><td class="market-num">${rotPct(s.share)}</td><td class="market-num">${s.casts}</td><td class="market-num">${rotNum(s.cpm)}</td>
      <td class="market-num">${sc ? `${rotNum(sc.refCpmMedian)} / ${rotNum(sc.refCpmP90)}` : ''}</td><td class="market-num">${sc?.rank ?? ''}</td>
      <td class="market-num">${s.positional ? rotPct(s.positionalRate) : ''}</td><td class="market-num">${rotPct(s.fullBuffRate)}</td></tr>`;
  }).join('');
  const absent = (a.score?.skillScores || []).filter(s => s.absent)
    .map(s => `<li>${escapeHtml(s.name)}${trLang(' : ', ': ')}${trLang(`absente, jouée par la plupart des ${escapeHtml(a.spec)} (${rotNum(s.refCpmMedian)} /min en médiane)`, `missing, played by most ${escapeHtml(a.spec)} players (${rotNum(s.refCpmMedian)}/min median)`)}</li>`).join('');
  parts.push(`<div class="table-container"><table class="market-table rot-table rot-skills">
    <thead><tr><th>${trLang('Compétence', 'Skill')}</th><th>${trLang('Dégâts', 'Damage')}</th><th>${trLang('Util.', 'Uses')}</th><th>/min</th>
      <th title="${trLang('Utilisations par minute de la spé : médiane / meilleurs (90e centile)', 'Spec uses per minute: median / best (90th percentile)')}">${trLang('Réf. /min', 'Ref. /min')}</th><th>${trLang('Rang', 'Rank')}</th>
      <th>${trLang('Placement', 'Positioning')}</th><th>${trLang('PA + Marque', 'AP + Brand')}</th></tr></thead>
    <tbody>${rows}</tbody></table></div>${absent ? `<ul class="rot-moments">${absent}</ul>` : ''}`);
  parts.push(`<p class="belg-note">${trLang('Ouverture : ', 'Opener: ')}${a.opener.map(o => `${escapeHtml(o.name)} (${rotNum(o.t / 1000)} s)`).join(' → ')}</p>`);
  if (rot.refData) parts.push(`<p class="belg-note">${trLang(`Références : ${rot.refData.encounters} combats et ${rot.refData.players} joueurs depuis le ${rot.refData.since}, enregistrés par LOA Logs. Les rangs comparent aux joueurs de la même spé.`, `References: ${rot.refData.encounters} fights and ${rot.refData.players} players since ${rot.refData.since}, recorded by LOA Logs. Ranks compare with players of the same spec.`)}</p>`);
  return parts.join('');
}

function initRotationTab() {
  const input = document.getElementById('rotFile');
  if (!input) return;
  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    if (f) rotOpenFile(f);
    input.value = ''; // rechoisir le même fichier (modifié par LOA Logs) relance la lecture
  });
  document.getElementById('rotLatest')?.addEventListener('click', () => { rot.dayFilter = ''; rotListRaids(); });
  document.getElementById('rotDate')?.addEventListener('change', e => { rot.dayFilter = e.target.value || ''; rotListRaids(); });
  const pane = document.getElementById('tab-rotation');
  const pick = (target, attr, fn) => {
    const row = target.closest(`[${attr}]`);
    if (row) fn(row.getAttribute(attr));
  };
  pane.addEventListener('click', e => {
    if (rot.busy) return;
    pick(e.target, 'data-rot-encounter', id => rotAnalyze(+id));
    pick(e.target, 'data-rot-player', name => { rot.selected = name; renderRotationTab(); });
  });
  pane.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || rot.busy) return;
    pick(e.target, 'data-rot-encounter', id => rotAnalyze(+id));
    pick(e.target, 'data-rot-player', name => { rot.selected = name; renderRotationTab(); });
  });
}
