// Benchmark : vrais joueurs proposés.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

// --- Profils proposés : vrais joueurs de la même classe, CP légèrement supérieur ---
// Les noms viennent de data/live-peers.json (classements de raid lostark.bible, tools/harvest-live-peers.mjs) ;
// CP et iLvl viennent toujours de la fiche chargée en direct.
const SUGGESTED_PEER_COUNT = 3;
const SUGGESTED_PEER_MAX_PROBES = 20;  // fiches chargées au plus pour en trouver 3 au-dessus
const suggestedPeersState = { pool: null, poolPromise: null, byPlayer: {} };

function loadLivePeerPool() {
  if (suggestedPeersState.pool) return Promise.resolve(suggestedPeersState.pool);
  if (!suggestedPeersState.poolPromise) {
    suggestedPeersState.poolPromise = fetch('data/live-peers.json', { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => (suggestedPeersState.pool = (j && j.classes) || {}))
      .catch(() => (suggestedPeersState.pool = {}));
  }
  return suggestedPeersState.poolPromise;
}

// Noms d'une même spé selon la source (lostark.bible, Maxroll, anciens noms de l'appli)
const SPEC_ALIASES = { 'supreme art': 'energy overflow', 'tactical bullet': 'enhanced weapon', 'asura destruction': "asura's path",
  "berserker's technique": 'berserker technique', 'knight of light': 'shining knight' };
function specKey(spec) {
  const k = (spec || '').toLowerCase().trim();
  return SPEC_ALIASES[k] || k;
}

function suggestedPeersKey(player) {
  return `${(player.name || '').toLowerCase()}|${Math.round(player.cp || 0)}|${player.role || ''}`;
}

async function findSuggestedPeers(player) {
  const pool = await loadLivePeerPool();
  const cls = normalizeClassName(player.className || '').toLowerCase().replace(/[^a-z]/g, '');
  const role = player.role || 'dps';
  const pName = (player.name || '').toLowerCase().trim();
  const pIlvl = player.ilvl || 1700;
  const pCp = player.cp || 0;
  const pSpec = specKey(getCharacterSpecName(player));
  const specKnown = !!pSpec && !['standard', 'standard t4', 'unknown'].includes(pSpec);
  const regMatch = /\((CE|NA|NAE|NAW|SA)\)/i.exec(player.server || '');
  const pRegion = (player.region || (regMatch && regMatch[1]) || 'CE').toUpperCase().replace(/^NA[EW]$/, 'NA');

  // Classement des candidats. Le CP suit l'iLvl : d'abord la fenêtre [-8 ; +10], puis plus haut,
  // en dernier plus bas ; à l'intérieur, iLvl le plus proche et même région. Même spé d'abord (même gameplay,
  // autres gravures et stats) ; la spé du réservoir date du raid relevé, elle est revérifiée sur la fiche.
  // La fenêtre descend à -8 car l'iLvl du réservoir date du raid relevé : les joueurs ont progressé depuis.
  const candidates = (pool[cls] || [])
    .filter(c => c.role === role && c.name.toLowerCase() !== pName)
    .map(c => {
      const d = c.ilvl - pIlvl;
      const group = d >= -8 && d <= 10 ? 0 : (d > 10 ? 1 : 2);
      let score = group * 1000 + Math.abs(d);
      if (specKnown && specKey(c.spec) !== pSpec) score += 10000;
      if ((c.region || '').toUpperCase() !== pRegion) score += 2;
      return { ...c, score };
    })
    .sort((a, b) => a.score - b.score);

  const above = [];       // même spé (ou spé inconnue)
  const otherSpec = [];   // autre spé : seulement si aucun joueur de la même spé n'est trouvé
  let probed = 0;
  // 2 fiches à la fois : au-delà, lostark.bible refuse une partie des requêtes simultanées.
  // Une seconde tentative après une courte pause rattrape les refus ponctuels.
  const fetchPeer = async (c) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const b = await fetchLiveBibleBenchmark(c.name, c.region || 'AUTO', role);
        if (b) return b;
      } catch (e) { /* nouvelle tentative */ }
      await new Promise(r => setTimeout(r, 600));
    }
    return null;
  };
  for (let i = 0; i < candidates.length && probed < SUGGESTED_PEER_MAX_PROBES && above.length < SUGGESTED_PEER_COUNT + 2; i += 2) {
    const batch = candidates.slice(i, i + 2);
    probed += batch.length;
    const results = await Promise.all(batch.map(fetchPeer));
    results.forEach(b => {
      if (!b || !b.isLive) return;
      if (normalizeClassName(b.className || '').toLowerCase().replace(/[^a-z]/g, '') !== cls) return;
      if ((b.role || role) !== role || (b.name || '').toLowerCase() === pName) return;
      if (hasMixedRaidProfile(b, role) || hasIncompleteBattlePoint(b, role)) return;
      if ((b.cp || 0) <= pCp) return;
      if (specKnown && specKey(getCharacterSpecName(b)) !== pSpec) otherSpec.push(b);
      else above.push(b);
    });
  }
  // Les plus proches au-dessus : faible écart de CP, puis iLvl proche
  const byGap = (a, b) => ((a.cp - pCp) - (b.cp - pCp)) || (Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
  const sameSpecFound = above.length > 0;
  const peers = (sameSpecFound ? above : otherSpec).sort(byGap).slice(0, SUGGESTED_PEER_COUNT);

  // Disponibles aussi dans le menu des références et pour l'auto-match
  if (!benchmarkState.searchedTargets) benchmarkState.searchedTargets = [];
  peers.forEach(b => {
    benchmarkState.searchedTargets = benchmarkState.searchedTargets.filter(t => t.id !== b.id);
    benchmarkState.searchedTargets.push(b);
  });
  return { peers, probed, poolSize: candidates.length, spec: specKnown ? getCharacterSpecName(player) : '', otherSpec: specKnown && !sameSpecFound && peers.length > 0 };
}

function renderSuggestedPeers(player, target) {
  const box = document.getElementById('benchSuggestedPeers');
  if (!box || !player) return;
  const isEn = isEnglishLang();
  const st = suggestedPeersState.byPlayer[suggestedPeersKey(player)];
  const title = `<div class="bench-suggested-title">${isEn ? 'Suggested players — same class and spec, slightly higher CP' : 'Joueurs proposés — même classe et même spé, CP légèrement supérieur'}</div>`;
  if (!st || st.loading) {
    box.innerHTML = `${title}<div class="bench-suggested-note">${isEn ? 'Searching live profiles on lostark.bible…' : 'Recherche de profils en direct sur lostark.bible…'}</div>`;
    return;
  }
  if (!st.peers.length) {
    box.innerHTML = `${title}<div class="bench-suggested-note">${isEn
        ? `No player of this class and spec with a higher CP was found among ${st.probed} live profiles checked. Use the search bar to pick one.`
        : `Aucun joueur de cette classe et de cette spé avec un CP supérieur parmi les ${st.probed} profils vérifiés en direct. Utilise la barre de recherche.`}</div>`;
    return;
  }
  const pCp = player.cp || 0;
  const cards = st.peers.map(b => {
    const sel = target && target.id === b.id;
    return `<button type="button" class="bench-suggested-peer${sel ? ' active' : ''}" data-peer-id="${escapeHtml(b.id)}" aria-pressed="${sel ? 'true' : 'false'}">
          <span class="bsp-name">${escapeHtml(b.name)}</span>
          <span class="bsp-meta">${escapeHtml(b.spec || '')} · ${b.ilvl.toFixed(2)}</span>
          <span class="bsp-cp">${formatNumber(Math.round(b.cp))} CP <span class="bsp-delta">+${formatNumber(Math.round(b.cp - pCp))}</span></span>
        </button>`;
  }).join('');
  const note = st.otherSpec
    ? `<div class="bench-suggested-note">${isEn
          ? `No ${escapeHtml(st.spec)} player above your CP among ${st.probed} live profiles checked: these players use the other spec (different engravings and stats).`
          : `Aucun joueur ${escapeHtml(st.spec)} au-dessus de ton CP parmi les ${st.probed} profils vérifiés en direct : ces joueurs jouent l'autre spé (gravures et stats différentes).`}</div>`
    : st.peers.length < SUGGESTED_PEER_COUNT
    ? `<div class="bench-suggested-note">${isEn
          ? `Only ${st.peers.length} player(s) above your CP among ${st.probed} live profiles checked.`
          : `Seulement ${st.peers.length} joueur(s) au-dessus de ton CP parmi les ${st.probed} profils vérifiés en direct.`}</div>`
    : '';
  box.innerHTML = `${title}<div class="bench-suggested-list">${cards}</div>${note}`;
  box.querySelectorAll('.bench-suggested-peer').forEach(btn => {
    btn.addEventListener('click', () => {
      const peer = st.peers.find(b => b.id === btn.dataset.peerId);
      if (!peer) return;
      benchmarkState.userPickedTarget = true;
      benchmarkState.customTarget = peer;
      benchmarkState.currentTargetId = peer.id;
      renderBenchmarkTab();
    });
  });
}

// Lance la recherche une fois par personnage ; la référence par défaut devient le premier profil
// proposé tant que l'utilisateur n'a pas choisi lui-même.
function ensureSuggestedPeers(player) {
  const key = suggestedPeersKey(player);
  if (suggestedPeersState.byPlayer[key]) return suggestedPeersState.byPlayer[key];
  const st = { loading: true, peers: [], probed: 0 };
  suggestedPeersState.byPlayer[key] = st;
  findSuggestedPeers(player)
    .then(res => Object.assign(st, res))
    .catch(() => {})
    .finally(() => {
      st.loading = false;
      if (st.peers.length && !benchmarkState.userPickedTarget) {
        benchmarkState.customTarget = st.peers[0];
        benchmarkState.currentTargetId = st.peers[0].id;
      }
      const active = getCurrentActiveCharacter();
      if (active && suggestedPeersKey(active) === key) renderBenchmarkTab();
    });
  return st;
}
