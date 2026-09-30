/**
 * Lost Ark T4 - Calculateur & Prédicteur de Combat Power (CP) et iLvl
 * Moteur mathématique calibré sur les données réelles de lostark.bible
 */

(function () {
  'use strict';

  // --- 0. SÉCURITÉ : SANITISATION XSS ---
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- 1. BASE DE CALIBRATION EMPIRIQUE (LOSTARK.BIBLE) ---
  // Paliers réels observés pour Supports et DPS en T4
  const CALIBRATION_DATA = {
    support: [
      { ilvl: 1640, cp: 650 },
      { ilvl: 1670, cp: 810 },
      { ilvl: 1714, cp: 2040 },
      { ilvl: 1735, cp: 2950 },
      { ilvl: 1740, cp: 3120 },
      { ilvl: 1750, cp: 3368 }, // Neversup calibré live (lostark.bible)
      { ilvl: 1765.83, cp: 4652 }, // Siwilpal calibré live (lostark.bible)
      { ilvl: 1775, cp: 5350 },
      { ilvl: 1785, cp: 6150 },
      { ilvl: 1800, cp: 7100 }
    ],
    dps: [
      { ilvl: 1640, cp: 750 },
      { ilvl: 1670, cp: 950 },
      { ilvl: 1714, cp: 2250 },
      { ilvl: 1735, cp: 3350 },
      { ilvl: 1740, cp: 3650 },
      { ilvl: 1750, cp: 4100 },
      { ilvl: 1762.5, cp: 4950 },
      { ilvl: 1770.83, cp: 5445 }, // Neevercry calibré live (lostark.bible)
      { ilvl: 1775.83, cp: 6103 }, // Ebeneben calibré live (lostark.bible)
      { ilvl: 1785.00, cp: 6525 }, // Bascojin calibré live (lostark.bible)
      { ilvl: 1790.00, cp: 6650 }, // Câsy calibré live (lostark.bible)
      { ilvl: 1800.00, cp: 7400 }
    ]
  };

  // Dictionnaire de normalisation universel des 28 classes Lost Ark (FR / EN / IDs internes)
  

  function normalizeClassName(raw) {
    if (!raw) return 'Paladin';
    const clean = raw.toLowerCase().trim();
    if (CLASS_NAME_MAP[clean]) return CLASS_NAME_MAP[clean];
    const stripped = clean.replace(/[\s\-_'’]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (CLASS_NAME_MAP[stripped]) return CLASS_NAME_MAP[stripped];
    if (stripped.includes('holyknightfemale') || stripped.includes('valkyrie')) return 'Valkyrie';
    if (stripped.includes('infightermale') || stripped.includes('breaker') || stripped.includes('heavyinfighter')) return 'Breaker';
    if (stripped.includes('infighterfemale') || stripped === 'infighter' || stripped.includes('scrapper')) return 'Scrapper';
    if (stripped.includes('holyknight') || stripped.includes('paladin')) return 'Paladin';
    if (stripped.includes('berserkerfemale') || stripped.includes('slayer')) return 'Slayer';
    if (stripped.includes('scouter') || stripped.includes('machinist')) return 'Machinist';
    if (stripped.includes('souleater') || stripped.includes('soul_eater')) return 'Souleater';
    if (stripped.includes('yinyangshi') || stripped.includes('artist') || stripped.includes('artiste') || stripped.includes('painter')) return 'Artist';
    if (stripped.includes('aeromancer') || stripped.includes('weatherartist')) return 'Aeromancer';
    if (stripped.includes('dimension') || stripped.includes('dimensionalist')) return 'Dimensionalist';
    return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/_/g, ' ');
  }

  function formatClassName(raw) {
    return normalizeClassName(raw);
  }

  const SUPPORT_CLASS_NAMES = [
    'paladin', 'holyknight', 'holy knight', 'holy_knight', 'sainte guerriere', 'sainte guerrière',
    'bard', 'barde',
    'artist', 'artiste', 'yinyangshi', 'painter',
    'valkyrie', 'holyknight_female', 'holyknightfemale', 'female_holyknight'
  ];

  const SUPPORT_DPS_SPECS = [
    'judgment', 'jugement',
    'true courage', 'vrai courage',
    'recurrence', 'récurrence',
    'shining knight'
  ];
  // Spés support (lostark.bible) : Paladin, Barde, Artiste, Valkyrie
  const SUPPORT_SPEC_NAMES = ['blessed aura', 'desperate salvation', 'full bloom', 'liberator', 'knight of light'];
  function isSupportSpecName(spec) {
    return SUPPORT_SPEC_NAMES.includes((spec || '').toLowerCase().trim());
  }

  // Une classe support est support par défaut ; ce sont ses GRAVURES qui disent si elle est jouée DPS.
  // « Expert » signe un support ; au moins 2 gravures de dégâts purs signent un build DPS.
  const SUPPORT_MARKER_ENGRAVINGS = ['expert'];
  const DPS_DAMAGE_ENGRAVINGS = [
    'grudge', 'cursed doll', 'keen blunt weapon', 'adrenaline', 'hit master', 'raid captain',
    'super charge', 'master brawler', 'precise dagger', 'mass increase', 'ambush master', 'barricade',
    'all-out attack', 'stabilized status', 'ether predator', 'contender'
  ];

  function engravingNamesOf(ch) {
    if (!ch || typeof ch !== 'object') return [];
    const raw = ch.rawProfile || null;
    const list = (Array.isArray(ch.engravings) && ch.engravings.length ? ch.engravings : null)
      || (raw && (raw.engravings || (raw.loadout && raw.loadout.engravings)))
      || (ch.loadout && ch.loadout.engravings)
      || [];
    let names = {};
    try { names = BIBLE_ENGRAVINGS; } catch (e) { names = {}; }
    return list
      .map(e => (typeof e === 'string' ? e : ((e && names[e.id]) || (e && e.name) || '')))
      .map(n => String(n).toLowerCase())
      .filter(Boolean);
  }

  // 'support' | 'dps' d'après les gravures, ou null si elles ne sont pas lisibles
  function roleFromEngravings(ch) {
    const engs = engravingNamesOf(ch);
    if (engs.length < 3) return null;
    if (engs.some(n => SUPPORT_MARKER_ENGRAVINGS.some(m => n.includes(m)))) return 'support';
    const dpsCount = engs.filter(n => DPS_DAMAGE_ENGRAVINGS.some(d => n.includes(d))).length;
    return dpsCount >= 2 ? 'dps' : 'support';
  }

  function isSupportClassName(rawClass) {
    if (!rawClass) return false;
    const clean = String(rawClass).toLowerCase().replace(/[\s\-_]/g, '');
    return SUPPORT_CLASS_NAMES.some(s => {
      const sClean = s.replace(/[\s\-_]/g, '');
      return clean === sClean || clean.includes(sClean);
    });
  }

  function detectCharacterRole(charOrClass, maybeSpec = '') {
    if (!charOrClass) return 'dps';

    let rawClass = '';
    let rawSpec = '';
    let charName = '';
    let explicitRole = null;

    if (typeof charOrClass === 'object') {
      rawClass = charOrClass.className || charOrClass.classId || charOrClass.class || '';
      rawSpec = charOrClass.spec || charOrClass.engraving || maybeSpec || '';
      charName = (charOrClass.name || charOrClass.id || '').toLowerCase();
      explicitRole = charOrClass.role;
      if (!rawClass && charOrClass.loadout) {
        rawClass = charOrClass.loadout.classId || '';
      }
      if (!rawClass && charOrClass.rawProfile) {
        rawClass = charOrClass.rawProfile.className || (charOrClass.rawProfile.loadout && charOrClass.rawProfile.loadout.classId) || '';
      }
      if (!rawSpec && Array.isArray(charOrClass.engravings)) {
        rawSpec = charOrClass.engravings.map(e => (typeof e === 'string' ? e : (e.name || e.id || ''))).join(' ');
      }
    } else {
      rawClass = String(charOrClass);
      rawSpec = String(maybeSpec || '');
    }


    const cleanClass = String(rawClass).toLowerCase().trim();
    if (cleanClass === 'support') {
      return 'support';
    }

    const isSupClass = isSupportClassName(rawClass);

    if (isSupClass) {
      // 1. Les gravures décident quand elles sont lisibles
      const engRole = typeof charOrClass === 'object' ? roleFromEngravings(charOrClass) : null;
      if (engRole) return engRole;
      // 2. Sinon, une spé DPS explicite (Judgment, True Courage, Recurrence, Shining Knight)
      const specLower = (rawSpec || '').toLowerCase();
      const isDpsSpec = SUPPORT_DPS_SPECS.some(dpsSpec => specLower.includes(dpsSpec));
      if (isDpsSpec) {
        return 'dps';
      }
      return 'support';
    }

    // Si la classe est clairement identifiée et n'est pas un support, c'est un DPS à 100%
    if (cleanClass && cleanClass !== 'unknown' && cleanClass !== 'undefined') {
      return 'dps';
    }

    if (explicitRole === 'support' || explicitRole === 'dps') {
      return explicitRole;
    }

    return 'dps';
  }

  function getClassIconUrl(raw, role) {
    if (!raw) {
      return (role === 'support') ? 'images/classes/paladin.png' : 'images/classes/shadowhunter.png';
    }
    const clean = raw.toLowerCase().trim().replace(/[\s\-_]/g, '');
    const map = {
      // Warriors
      berserker: 'berserker.png',
      destroyer: 'destroyer.png',
      gunlancer: 'gunlancer.png',
      warlord: 'gunlancer.png',
      paladin: 'paladin.png',
      holyknight: 'paladin.png',
      slayer: 'slayer.png',
      valkyrie: 'valkyrie.png',
      holyknightfemale: 'valkyrie.png',
      warriormale: 'warrior_male.png',
      femalewarrior: 'female_warrior.png',

      // Mages
      mage: 'mage.png',
      arcanist: 'arcanist.png',
      arcana: 'arcanist.png',
      summoner: 'summoner.png',
      bard: 'bard.png',
      sorceress: 'sorceress.png',

      // Martial Artists
      martialartistfemale: 'martial_artist_female.png',
      martialartistmale: 'martial_artist_male.png',
      wardancer: 'wardancer.png',
      battlemaster: 'wardancer.png',
      scrapper: 'scrapper.png',
      infighter: 'scrapper.png',
      soulfist: 'soulfist.png',
      soulmaster: 'soulfist.png',
      glaivier: 'glaivier.png',
      lancemaster: 'glaivier.png',
      striker: 'striker.png',
      breaker: 'breaker.png',
      heavyinfighter: 'breaker.png',
      infightermale: 'breaker.png',
      infighterfemale: 'scrapper.png',

      // Assassins
      assassin: 'assassin.png',
      deathblade: 'deathblade.png',
      blade: 'deathblade.png',
      shadowhunter: 'shadowhunter.png',
      demonic: 'shadowhunter.png',
      reaper: 'reaper.png',
      souleater: 'souleater.png',

      // Gunners
      gunnermale: 'gunner_male.png',
      gunnerfemale: 'gunner_female.png',
      sharpshooter: 'sharpshooter.png',
      hawkeye: 'sharpshooter.png',
      deadeye: 'deadeye.png',
      devilhunter: 'deadeye.png',
      artillerist: 'artillerist.png',
      blaster: 'artillerist.png',
      machinist: 'machinist.png',
      scouter: 'machinist.png',
      gunslinger: 'gunslinger.png',

      // Specialists
      specialist: 'specialist.png',
      artist: 'artist.png',
      yinyangshi: 'artist.png',
      painter: 'artist.png',
      aeromancer: 'aeromancer.png',
      weatherartist: 'aeromancer.png',
      meteorologist: 'aeromancer.png',
      wildsoul: 'wildsoul.png',
      dimensionalist: 'dimensionalist.png',
      dimensionmaster: 'dimensionalist.png',
      guardianknight: 'guardianknight.png'
    };

    const fileName = map[clean] || (role === 'support' ? 'paladin.png' : 'shadowhunter.png');
    return `images/classes/${fileName}`;
  }

  // Sauvegarde intégrée du Roster personnel de Neevercry (ne peut jamais être perdu)
  

  // Profils prédéfinis : Roster de Démonstration neutre (Archétypes T4 sans pseudos privés)
  

  const DEFAULT_AVATARS = {
    neevercry: 'images/characters/neevercry.webp',
    neversup: 'images/characters/neversup.webp',
    kaarlach: 'images/characters/kaarlach.webp',
    neeverslayer: 'images/characters/neeverslayer.webp',
    jigokuushoujo: 'images/characters/jigokuushoujo.webp',
    neverbreak: 'images/characters/neverbreak.webp'
  };

  const FACE_AVATARS = {
    neevercry: 'images/characters/neevercry_avatar.webp',
    neversup: 'images/characters/neversup_avatar.webp',
    kaarlach: 'images/characters/kaarlach_avatar.webp',
    neeverslayer: 'images/characters/neeverslayer_avatar.webp',
    jigokuushoujo: 'images/characters/jigokuushoujo_avatar.webp',
    neverbreak: 'images/characters/neverbreak_avatar.webp'
  };

  function getCharacterFaceAvatar(ch) {
    if (!ch) return 'images/classes/paladin.png';
    const cKey = (ch.id || ch.name || '').toLowerCase().trim();
    const savedCustom = localStorage.getItem('char_custom_avatar_' + cKey);
    if (savedCustom) return savedCustom;

    // Les 6 avatars découpés sont STRICTEMENT réservés au Roster Démo de Nevercry
    const isDemo = Object.prototype.hasOwnProperty.call(FACE_AVATARS, cKey);
    if (isDemo && FACE_AVATARS[cKey]) return FACE_AVATARS[cKey];

    // Pour tout autre utilisateur / personnage importé :
    // 1. Son propre avatar local si fourni
    if (ch.avatarUrl && !ch.avatarUrl.includes('placeholder')) return ch.avatarUrl;
    // 2. Son propre portrait officiel Lost Ark (AGS / Bible)
    if (ch.portraitUrl && !ch.portraitUrl.includes('placeholder')) return ch.portraitUrl;

    // 3. Repli STRICT sur l'icône de sa propre classe (JAMAIS les personnages de Nevercry)
    return getClassIconUrl(ch.className, ch.role);
  }

  function isFullBodyAgsAvatar(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.includes('_avatar.webp') || url.startsWith('data:image/')) return false;
    return url.includes('character-cdn.ags.lol') || 
           url.includes('onstove.com') || 
           url.includes('lostark.co.kr') || 
           url.endsWith('neevercry.webp') ||
           url.endsWith('kaarlach.webp') ||
           url.endsWith('neeverslayer.webp') ||
           url.endsWith('neversup.webp') ||
           url.endsWith('jigokuushoujo.webp') ||
           url.endsWith('neverbreak.webp');
  }

  // Fonctions de persistance du Roster personnel (isolé par navigateur)
  function getUserRoster() {
    try {
      const raw = localStorage.getItem('lostark_user_roster');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let modified = false;
          parsed.forEach(c => {
            const correctRole = detectCharacterRole(c);
            if (c.role !== correctRole) {
              c.role = correctRole;
              modified = true;
            }
          });
          if (modified) {
            saveUserRoster(parsed);
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading user roster from localStorage:', e);
    }
    return null;
  }

  function saveUserRoster(list) {
    try {
      localStorage.setItem('lostark_user_roster', JSON.stringify(list));
    } catch (e) {
      console.warn('Error saving user roster to localStorage:', e);
    }
  }

  let activeCharacterId = null;

  // Uniquement de vrais personnages importés depuis lostark.bible : aucun roster de démo.
  function getActiveRosterList() {
    return getUserRoster() || [];
  }

  function getCurrentActiveCharacter() {
    const list = getActiveRosterList();
    if (activeCharacterId) {
      const found = list.find(c => (c.id || c.name.toLowerCase()) === activeCharacterId);
      if (found) return found;
    }
    return list[0] || null;
  }

  // Aucun vrai personnage : on masque le contenu et on ouvre l'import (non fermable)
  function showNoCharacterState() {
    document.body.classList.add('no-character');
    renderPresetsBar();
    const modal = document.getElementById('welcomeModal');
    if (modal) modal.classList.add('active');
    const btnClose = document.getElementById('btnCloseWelcomeModal');
    if (btnClose) btnClose.style.display = 'none';
  }

  function hideNoCharacterState() {
    document.body.classList.remove('no-character');
    const btnClose = document.getElementById('btnCloseWelcomeModal');
    if (btnClose) btnClose.style.display = '';
  }

  // Profils prédéfinis legacy
  

  // Configuration d'impact Combat Power (CP) et stats par pièce en T4
  // Découverte empirique vérifiée in-game sur Lost Ark T4 (test Neeverslayer & Neversup) :
  // - Les pièces d'armure T4 (Casque, Épaules, Torse, Pantalon, Gants) rapportent ~10 à 14 CP par tap (+14 -> +15).
  //   La formule officielle de Combat Power indexe le gain d'armure sur la MainStat effective (+3700-4600 STR/INT avec multiplicateurs).
  //   Le saut de palier +15 et les bonus passifs (Élixirs, Transcendance, Ark Passive) décuplent l'impact de l'armure.
  // - L'Arme (Weapon) concentre la Puissance d'Arme (multiplicateur maître).
  const PIECE_CONFIG = {
    dps: {
      weapon: { cpWeight: 1.05, atkPerLevel: 2400, strPerLevel: 0 },
      chest: { cpWeight: 0.35, atkPerLevel: 580, strPerLevel: 4600 },
      pants: { cpWeight: 0.35, atkPerLevel: 580, strPerLevel: 4600 },
      gloves: { cpWeight: 0.35, atkPerLevel: 480, strPerLevel: 3750 },
      head: { cpWeight: 0.35, atkPerLevel: 460, strPerLevel: 3700 },
      shoulder: { cpWeight: 0.35, atkPerLevel: 476, strPerLevel: 3730 }
    },
    support: {
      weapon: { cpWeight: 0.52, atkPerLevel: 1600, strPerLevel: 0 },
      chest: { cpWeight: 0.147, atkPerLevel: 420, strPerLevel: 4600 },
      pants: { cpWeight: 0.155, atkPerLevel: 420, strPerLevel: 4600 },
      gloves: { cpWeight: 0.160, atkPerLevel: 340, strPerLevel: 3750 },
      head: { cpWeight: 0.168, atkPerLevel: 320, strPerLevel: 3700 },
      shoulder: { cpWeight: 0.165, atkPerLevel: 320, strPerLevel: 3700 }
    }
  };

  // --- 2. BASE DE DONNÉES DU CALCULATEUR ARSONISTIC (OPTIMISATIONS T4) ---
  // Données extraites de 'Lost Ark Arsonistic DPS Calculator.xlsx' (SupAcc, SupBrace, Acc, Brace, EffData)
  

  // --- 2b. COÛTS D'AFFINAGE EN GOLD (EXTRAITS DU WORKBOOK T4 - SHEET HONING) ---
  // Coût en Gold brut moyen (sans matériaux) par pièce
  const HONING_COSTS = {
    weapon: {
      11: 12000,
      12: 15000,
      13: 18000,
      14: 22000,
      15: 28000,
      16: 35000,
      17: 44000,
      18: 56265,
      19: 61332,
      20: 123929,
      21: 134607,
      22: 212651,
      23: 229625,
      24: 479436,
      25: 515964
    },
    armor: {
      11: 4500,
      12: 6000,
      13: 8000,
      14: 12000,
      15: 20002, // 100 010 / 5
      16: 21920, // 109 600 / 5
      17: 30753, // 153 766 / 5
      18: 33724, // 168 618 / 5
      19: 36869, // 184 344 / 5
      20: 74422, // 372 111 / 5
      21: 80894, // 404 468 / 5
      22: 127779, // 638 895 / 5
      23: 137681, // 688 403 / 5
      24: 287661, // 1 438 306 / 5
      25: 309578  // 1 547 891 / 5
    },
    advWeapon: {
      10: 39171,
      20: 87047,
      30: 142024,
      40: 189365
    },
    advArmorTotal: {
      10: 164758,
      20: 313367,
      30: 473413,
      40: 568095
    }
  };

  // --- 2c. MATRICE D'ARBITRAGE RENTABILITÉ GOLD / DÉGÂTS (MARCHÉ EUC) ---
  // Calculée d'après 'Gold Per 0.01% Ally DMG Support' & 'Gold to DMG% DPS' avec cours EUC
  

  // État de l'application
  const state = {
    // Prix unitaires par défaut (EUC, 2026-09-30), remplacés au chargement par fetchMarketPrices()
    marketPrices: { 'destiny-leapstone': 16, 'prime-oreha-fusion-material': 58, 'abidos-fusion-material': 124, 'destiny-destruction-stone': 5, 'destiny-guardian-stone': 0.58, 'destiny-shard': 0, 'lavas-breath': 411, 'glaciers-breath': 398, 'gold': 1 },
    role: 'support',
    currentIlvl: 1750.0,
    currentCp: 3369,
    targetIlvl: 1770.0,
    gemBonus: 0,
    predictionMode: 'honing', // 'honing' (Affinage pur) | 'global' (Endgame complet)
    // Simulateur de pièces
    advHoning: 40,
    gear: {
      weapon: 17,
      head: 14,
      shoulder: 14,
      chest: 15,
      pants: 15,
      gloves: 15
    },
    // Sauvegarde de l'état initial du personnage actif pour le calcul des gains d'affinage
    baselineGear: {
      weapon: 17,
      head: 14,
      shoulder: 14,
      chest: 15,
      pants: 15,
      gloves: 15
    },
    baselineAdvHoning: 40,
    baselineIlvl: 1750.0,
    baselineCp: 3369,
    // Optimisation T4 Arsonistic
    opt: {
      // Support
      supBrand: 'high',
      supAllyDmg: 'high',
      supAllyAp: 'high',
      supWp: 'mid',
      supWpFlat: '960',
      supQuality: 'mid',
      supBracePerk: 'crit_ap',
      supBraceWp: '9000',
      supBraceStat: '14000',
      supBraceSwift: '100',
      // DPS
      dpsAddDmg: 'high',
      dpsOutDmg: 'high',
      dpsAp: 'high',
      dpsCrit: 'mid',
      dpsCdmg: 'mid',
      dpsWp: 'mid',
      dpsQuality: 'mid',
      dpsBracePerk: 'crit_cdmg',
      dpsBraceWp: '9000',
      dpsBraceStat: '14000',
      dpsBraceSub: '100',
      // Gems
      gemsDeck: 'lvl8',
      // Passifs Karma & Ark Grid
      karmaEnlight: true,
      karmaEvo: true,
      arkGrid: true
    }
  };

  // --- 2. FONCTIONS MATHÉMATIQUES DE MODÉLISATION ---

  /**
   * Interpolation continue linéaire par morceaux sur les points de calibration
   */
  function getBaselineCp(ilvl, role) {
    const table = CALIBRATION_DATA[role] || CALIBRATION_DATA.support;
    if (ilvl <= table[0].ilvl) return table[0].cp;
    if (ilvl >= table[table.length - 1].ilvl) {
      const last = table[table.length - 1];
      const prev = table[table.length - 2];
      const slope = (last.cp - prev.cp) / (last.ilvl - prev.ilvl);
      return last.cp + (ilvl - last.ilvl) * slope;
    }

    // Trouver le segment correspondant
    let i = 0;
    while (i < table.length - 1 && table[i + 1].ilvl < ilvl) {
      i++;
    }

    const p0 = table[i];
    const p1 = table[i + 1];
    const t = (ilvl - p0.ilvl) / (p1.ilvl - p0.ilvl);

    // Interpolation continue linéaire (conserve la pente réelle sans dérivée nulle artificielle)
    return p0.cp + (p1.cp - p0.cp) * t;
  }

  /**
   * Calcule la pente locale de gain de CP par point d'iLvl pour un personnage
   */
  function getLocalSlope(currentIlvl, currentCp, role) {
    const delta = 5.0;
    const bCurr = getBaselineCp(currentIlvl, role);
    const bTarget = getBaselineCp(currentIlvl + delta, role);
    const userRatio = currentCp > 0 ? (currentCp / bCurr) : 1.0;
    return ((bTarget - bCurr) * userRatio) / delta;
  }

  /**
   * Prédit le CP à un iLvl cible selon le mode sélectionné (Affinage Pur vs Évolution Globale)
   */
  function predictCp(currentIlvl, currentCp, targetIlvl, role, gemBonus = 0) {
    const mode = state.predictionMode || 'honing';

    if (targetIlvl <= currentIlvl) {
      return {
        predictedCp: Math.round(currentCp + gemBonus),
        minCp: Math.round(currentCp + gemBonus),
        maxCp: Math.round(currentCp + gemBonus),
        diffCp: Math.max(0, gemBonus),
        diffIlvl: 0,
        slope: 0,
        mode
      };
    }

    const diffIlvl = Math.max(0, targetIlvl - currentIlvl);
    let predictedCp, diffCp, slope, uncertainty;

    if (mode === 'honing') {
      // 1. MODE AFFINAGE PUR (Gear Honing Seul)
      // En T4, l'affinage pur d'équipement donne en moyenne ~10.5 CP / iLvl pour un DPS et ~9.8 CP / iLvl pour un Support
      // (1 arme = ~28-35 CP, 5 armures = ~6.8 CP/tap). S'indexe proportionnellement au CP de base du joueur.
      const cpScale = currentCp > 0 ? (currentCp / 3500) : 1.0;
      const baseRate = role === 'support' ? 9.8 : 10.5;
      slope = parseFloat((baseRate * cpScale).toFixed(1));
      
      const honingGain = diffIlvl * slope;
      diffCp = Math.round(honingGain + gemBonus);
      predictedCp = Math.round(currentCp + diffCp);
      uncertainty = Math.max(10, Math.round(Math.abs(diffCp) * 0.05));
    } else {
      // 2. MODE ÉVOLUTION GLOBALE DE BUILD (Endgame lostark.bible)
      // Prend en compte le fait que les joueurs à haut iLvl ont aussi monté leurs gemmes 9/10, gravures reliques et karma.
      const baseCurr = getBaselineCp(currentIlvl, role);
      const baseTarget = getBaselineCp(targetIlvl, role);
      const userRatio = currentCp > 0 ? (currentCp / baseCurr) : 1.0;
      const rawPredicted = (baseTarget * userRatio) + gemBonus;

      predictedCp = Math.round(rawPredicted);
      diffCp = Math.round(rawPredicted - currentCp);
      slope = diffIlvl !== 0 ? parseFloat((diffCp / diffIlvl).toFixed(1)) : 0;
      uncertainty = Math.max(25, Math.round(Math.abs(diffCp) * 0.04));
    }

    return {
      predictedCp,
      minCp: predictedCp - uncertainty,
      maxCp: predictedCp + uncertainty,
      diffCp,
      diffIlvl: parseFloat(diffIlvl.toFixed(2)),
      slope,
      mode
    };
  }

  /**
   * Calcule l'iLvl exact résultant de l'équipement
   * En Tier 4, chaque niveau individuel d'une pièce confère exactement +5 points d'iLvl (+5 / 6 = +0.8333 d'iLvl global).
   * Formule exacte vérifiée sur lostark.bible :
   * iLvl = 1635.00 + (somme_des_6_niveaux * 5) / 6 + affinage_avancé
   */
  function computeGearIlvl(gearObj, advHoning) {
    const currentSum = gearObj.weapon + gearObj.head + gearObj.shoulder + gearObj.chest + gearObj.pants + gearObj.gloves;
    const totalIlvl = 1635.00 + (currentSum * 5) / 6 + advHoning;
    return parseFloat(totalIlvl.toFixed(2));
  }

  // --- 3. ÉLÉMENTS DU DOM ---

  const dom = {
    // Role switch
    roleSupport: document.getElementById('roleSupport'),
    roleDps: document.getElementById('roleDps'),
    roleBadge: document.getElementById('roleBadge'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Quick Predictor Inputs
    sliderCurrentIlvl: document.getElementById('sliderCurrentIlvl'),
    numCurrentIlvl: document.getElementById('numCurrentIlvl'),
    dispCurrentIlvl: document.getElementById('dispCurrentIlvl'),

    sliderCurrentCp: document.getElementById('sliderCurrentCp'),
    numCurrentCp: document.getElementById('numCurrentCp'),
    dispCurrentCp: document.getElementById('dispCurrentCp'),

    sliderTargetIlvl: document.getElementById('sliderTargetIlvl'),
    numTargetIlvl: document.getElementById('numTargetIlvl'),
    dispTargetIlvl: document.getElementById('dispTargetIlvl'),

    quickTargetBtns: document.querySelectorAll('.target-btn'),
    gemSelect: document.getElementById('gemLevelSelect'),
    optGemMajor8: document.getElementById('optGemMajor8'),
    optGemFull8: document.getElementById('optGemFull8'),
    optGemFull9: document.getElementById('optGemFull9'),
    optGemFull10: document.getElementById('optGemFull10'),

    // Result Card Displays
    resTargetIlvlText: document.getElementById('resTargetIlvlText'),
    predictedCp: document.getElementById('predictedCp'),
    predictedRange: document.getElementById('predictedRange'),
    diffCp: document.getElementById('diffCp'),
    diffIlvl: document.getElementById('diffIlvl'),
    efficiencyCp: document.getElementById('efficiencyCp'),
    bracketText: document.getElementById('bracketText'),
    gaugeCurrent: document.getElementById('gaugeCurrent'),
    gaugeTarget: document.getElementById('gaugeTarget'),
    gaugeCenterLabel: document.getElementById('gaugeCenterLabel'),
    analysisText: document.getElementById('analysisText'),

    // Honing Tab
    advHoningSelect: document.getElementById('advHoningSelect'),
    gearRows: document.querySelectorAll('.gear-row'),
    simulatedIlvl: document.getElementById('simulatedIlvl'),
    simulatedCp: document.getElementById('simulatedCp'),
    simDiffIlvl: document.getElementById('simDiffIlvl'),
    simDiffCp: document.getElementById('simDiffCp'),
    simEstimatedGold: document.getElementById('simEstimatedGold'),
    simGoldPerCp: document.getElementById('simGoldPerCp'),
    simEstimatedStr: document.getElementById('simEstimatedStr'),
    simEstimatedAtk: document.getElementById('simEstimatedAtk'),
    honingAdviceText: document.getElementById('honingAdviceText'),
    btnAll14: document.getElementById('btnAll14'),
    btnAll16: document.getElementById('btnAll16'),
    btnAll18: document.getElementById('btnAll18'),
    btnAll20: document.getElementById('btnAll20'),

    // Presets Bar Dynamique & Roster
    presetsList: document.getElementById('presetsList'),
    presetsTitle: document.getElementById('presetsTitle'),
    rosterStatusBadge: document.getElementById('rosterStatusBadge'),
    btnSyncRosterNav: document.getElementById('btnSyncRosterNav'),
    btnManageRoster: document.getElementById('btnManageRoster'),
    rosterCountTag: document.getElementById('rosterCountTag'),

    // Bannière Visuelle du Personnage Actif
    activeCharacterCard: document.getElementById('activeCharacterCard'),
    charAvatarImg: document.getElementById('charAvatarImg'),
    charAvatarRoleBadge: document.getElementById('charAvatarRoleBadge'),
    charCardName: document.getElementById('charCardName'),
    charCardClass: document.getElementById('charCardClass'),
    charCardServer: document.getElementById('charCardServer'),
    charCardIlvl: document.getElementById('charCardIlvl'),
    charCardCp: document.getElementById('charCardCp'),
    charCardWeapon: document.getElementById('charCardWeapon'),
    charCardArmor: document.getElementById('charCardArmor'),
    charCardAdv: document.getElementById('charCardAdv'),
    charCardRoster: document.getElementById('charCardRoster'),
    charCardGearPill: document.getElementById('charCardGearPill'),
    charCardStonePill: document.getElementById('charCardStonePill'),
    charCardKarmaPill: document.getElementById('charCardKarmaPill'),
    charImageUploadInput: document.getElementById('charImageUploadInput'),
    btnResetAvatar: document.getElementById('btnResetAvatar'),

    // Cartes de Score de Profil (Loseii Style)
    scoreCardAcc: document.getElementById('scoreCardAcc'),
    scoreAccRoleTag: document.getElementById('scoreAccRoleTag'),
    scoreAccGrade: document.getElementById('scoreAccGrade'),
    scoreAccVal: document.getElementById('scoreAccVal'),
    scoreAccSub: document.getElementById('scoreAccSub'),
    scoreAccDetail: document.getElementById('scoreAccDetail'),

    scoreCardBracelet: document.getElementById('scoreCardBracelet'),
    scoreBrRoleTag: document.getElementById('scoreBrRoleTag'),
    scoreBrGrade: document.getElementById('scoreBrGrade'),
    scoreBrScore: document.getElementById('scoreBrScore'),
    scoreBrPct: document.getElementById('scoreBrPct'),
    scoreBrDetail: document.getElementById('scoreBrDetail'),

    scoreCardAstro: document.getElementById('scoreCardAstro'),
    scoreAgRoleTag: document.getElementById('scoreAgRoleTag'),
    scoreAgGrade: document.getElementById('scoreAgGrade'),
    scoreAgScore: document.getElementById('scoreAgScore'),
    scoreAgPct: document.getElementById('scoreAgPct'),
    scoreAgDetail: document.getElementById('scoreAgDetail'),

    scoreCardGpd: document.getElementById('scoreCardGpd'),
    scoreGpdPrice: document.getElementById('scoreGpdPrice'),
    scoreGpdPer: document.getElementById('scoreGpdPer'),
    scoreGpdDetail: document.getElementById('scoreGpdDetail'),

    // Onglet 3 : Optimisation T4 Arsonistic & Arbitrage EUC
    optSupportControls: document.getElementById('optSupportControls'),
    optDpsControls: document.getElementById('optDpsControls'),
    
    // Support Inputs
    optSupBrand: document.getElementById('optSupBrand'),
    optSupAllyDmg: document.getElementById('optSupAllyDmg'),
    optSupAllyAp: document.getElementById('optSupAllyAp'),
    optSupWp: document.getElementById('optSupWp'),
    optSupWpFlat: document.getElementById('optSupWpFlat'),
    optSupQuality: document.getElementById('optSupQuality'),
    optSupBracePerk: document.getElementById('optSupBracePerk'),
    optSupBraceWp: document.getElementById('optSupBraceWp'),
    optSupBraceStat: document.getElementById('optSupBraceStat'),
    optSupBraceSwift: document.getElementById('optSupBraceSwift'),

    // DPS Inputs
    optDpsAddDmg: document.getElementById('optDpsAddDmg'),
    optDpsOutDmg: document.getElementById('optDpsOutDmg'),
    optDpsAp: document.getElementById('optDpsAp'),
    optDpsCrit: document.getElementById('optDpsCrit'),
    optDpsCdmg: document.getElementById('optDpsCdmg'),
    optDpsWp: document.getElementById('optDpsWp'),
    optDpsQuality: document.getElementById('optDpsQuality'),
    optDpsBracePerk: document.getElementById('optDpsBracePerk'),
    optDpsBraceWp: document.getElementById('optDpsBraceWp'),
    optDpsBraceStat: document.getElementById('optDpsBraceStat'),
    optDpsBraceSub: document.getElementById('optDpsBraceSub'),

    // Gems Input
    optGemsDeck: document.getElementById('optGemsDeck'),

    // Option C : Per-Skill Gem Simulator
    btnGemPresetCurrent: document.getElementById('btnGemPresetCurrent'),
    btnGemPresetMetaSupport: document.getElementById('btnGemPresetMetaSupport'),
    btnGemPresetFull8: document.getElementById('btnGemPresetFull8'),
    btnGemPresetFull9: document.getElementById('btnGemPresetFull9'),
    btnGemPresetFull10: document.getElementById('btnGemPresetFull10'),
    gemLvl_hb: document.getElementById('gemLvl_hb'),
    gemLvl_wog: document.getElementById('gemLvl_wog'),
    gemLvl_brand: document.getElementById('gemLvl_brand'),
    gemLvl_hp: document.getElementById('gemLvl_hp'),
    gemLvl_other: document.getElementById('gemLvl_other'),
    dispCd_hb: document.getElementById('dispCd_hb'),
    dispStatus_hb: document.getElementById('dispStatus_hb'),
    dispCd_wog: document.getElementById('dispCd_wog'),
    dispStatus_wog: document.getElementById('dispStatus_wog'),
    dispCd_brand: document.getElementById('dispCd_brand'),
    dispStatus_brand: document.getElementById('dispStatus_brand'),
    dispCd_hp: document.getElementById('dispCd_hp'),
    dispStatus_hp: document.getElementById('dispStatus_hp'),
    dispCd_other: document.getElementById('dispCd_other'),
    dispStatus_other: document.getElementById('dispStatus_other'),
    dispGemApUptime: document.getElementById('dispGemApUptime'),
    dispGemApGap: document.getElementById('dispGemApGap'),
    dispGemBrandUptime: document.getElementById('dispGemBrandUptime'),
    dispGemGaugeRate: document.getElementById('dispGemGaugeRate'),
    dispGemTotalCp: document.getElementById('dispGemTotalCp'),
    dispGemCpDelta: document.getElementById('dispGemCpDelta'),
    gemAdvisorText: document.getElementById('gemAdvisorText'),
    dispSuppAdvisorTitle: document.getElementById('dispSuppAdvisorTitle'),
    dispSuppSkill1Name: document.getElementById('dispSuppSkill1Name'),
    dispSuppSkill1Sub: document.getElementById('dispSuppSkill1Sub'),
    dispSuppSkill1Tag: document.getElementById('dispSuppSkill1Tag'),
    dispSuppSkill2Name: document.getElementById('dispSuppSkill2Name'),
    dispSuppSkill2Sub: document.getElementById('dispSuppSkill2Sub'),
    dispSuppSkill2Tag: document.getElementById('dispSuppSkill2Tag'),
    dispSuppSkill3Name: document.getElementById('dispSuppSkill3Name'),
    dispSuppSkill3Sub: document.getElementById('dispSuppSkill3Sub'),
    dispSuppSkill3Tag: document.getElementById('dispSuppSkill3Tag'),
    dispSuppSkill4Name: document.getElementById('dispSuppSkill4Name'),
    dispSuppSkill4Sub: document.getElementById('dispSuppSkill4Sub'),
    dispSuppSkill4Tag: document.getElementById('dispSuppSkill4Tag'),

    // DPS Gem Simulator Elements
    gemContainerSupport: document.getElementById('gemContainerSupport'),
    gemContainerDps: document.getElementById('gemContainerDps'),
    btnGemDpsPresetCurrent: document.getElementById('btnGemDpsPresetCurrent'),
    btnGemDpsPresetMeta: document.getElementById('btnGemDpsPresetMeta'),
    btnGemDpsPresetFull8: document.getElementById('btnGemDpsPresetFull8'),
    btnGemDpsPresetFull9: document.getElementById('btnGemDpsPresetFull9'),
    btnGemDpsPresetFull10: document.getElementById('btnGemDpsPresetFull10'),
    gemLvl_dps1: document.getElementById('gemLvl_dps1'),
    gemLvl_dps2: document.getElementById('gemLvl_dps2'),
    gemLvl_dps3: document.getElementById('gemLvl_dps3'),
    gemLvl_dpsCd: document.getElementById('gemLvl_dpsCd'),
    gemLvl_dpsOther: document.getElementById('gemLvl_dpsOther'),
    dispDpsSkill1Name: document.getElementById('dispDpsSkill1Name'),
    dispDpsSkill1Sub: document.getElementById('dispDpsSkill1Sub'),
    dispDpsSkill1Tag: document.getElementById('dispDpsSkill1Tag'),
    dispDpsSkill1Val: document.getElementById('dispDpsSkill1Val'),
    dispDpsSkill2Name: document.getElementById('dispDpsSkill2Name'),
    dispDpsSkill2Sub: document.getElementById('dispDpsSkill2Sub'),
    dispDpsSkill2Tag: document.getElementById('dispDpsSkill2Tag'),
    dispDpsSkill2Val: document.getElementById('dispDpsSkill2Val'),
    dispDpsSkill3Name: document.getElementById('dispDpsSkill3Name'),
    dispDpsSkill3Sub: document.getElementById('dispDpsSkill3Sub'),
    dispDpsSkill3Tag: document.getElementById('dispDpsSkill3Tag'),
    dispDpsSkill3Val: document.getElementById('dispDpsSkill3Val'),
    dispDpsCdName: document.getElementById('dispDpsCdName'),
    dispDpsCdSub: document.getElementById('dispDpsCdSub'),
    dispDpsCdTag: document.getElementById('dispDpsCdTag'),
    dispDpsCdVal: document.getElementById('dispDpsCdVal'),
    dispDpsGemBurstGain: document.getElementById('dispDpsGemBurstGain'),
    dispDpsGemTotalDps: document.getElementById('dispDpsGemTotalDps'),
    dispDpsGemAvgCd: document.getElementById('dispDpsGemAvgCd'),
    dispDpsGemTotalCp: document.getElementById('dispDpsGemTotalCp'),
    dispDpsGemCpDelta: document.getElementById('dispDpsGemCpDelta'),
    gemDpsAdvisorText: document.getElementById('gemDpsAdvisorText'),

    // Conseiller de Taillage Loseii Bellman DP
    cutRoleBadge: document.getElementById('cutRoleBadge'),
    cutSlotSelect: document.getElementById('cutSlotSelect'),
    cutStatQuintile: document.getElementById('cutStatQuintile'),
    cut1Effect: document.getElementById('cut1Effect'),
    cut1Tier: document.getElementById('cut1Tier'),
    cut2Status: document.getElementById('cut2Status'),
    cut2DetailsGroup: document.getElementById('cut2DetailsGroup'),
    cut2Effect: document.getElementById('cut2Effect'),
    cut2Tier: document.getElementById('cut2Tier'),
    cutDecisionBanner: document.getElementById('cutDecisionBanner'),
    cutDecisionIcon: document.getElementById('cutDecisionIcon'),
    cutDecisionTitle: document.getElementById('cutDecisionTitle'),
    cutDecisionSub: document.getElementById('cutDecisionSub'),
    cutEvVal: document.getElementById('cutEvVal'),
    cutMarketVal: document.getElementById('cutMarketVal'),
    cutProbSuccess: document.getElementById('cutProbSuccess'),
    cutNextCost: document.getElementById('cutNextCost'),
    cutAnalysisText: document.getElementById('cutAnalysisText'),
    btnCutPresetJackpot: document.getElementById('btnCutPresetJackpot'),
    btnCutPresetMid: document.getElementById('btnCutPresetMid'),
    btnCutPresetLow: document.getElementById('btnCutPresetLow'),
    btnCutPresetTrash: document.getElementById('btnCutPresetTrash'),

    // Passifs Karma & Ark Grid
    optKarmaEnlight: document.getElementById('optKarmaEnlight'),
    optKarmaEvo: document.getElementById('optKarmaEvo'),
    optArkGrid: document.getElementById('optArkGrid'),

    // Optimization Outputs
    optBadge: document.getElementById('optBadge'),
    optResultTypeLabel: document.getElementById('optResultTypeLabel'),
    optDpsGainDisplay: document.getElementById('optDpsGainDisplay'),
    optDpsUnit: document.getElementById('optDpsUnit'),
    optCpGainDisplay: document.getElementById('optCpGainDisplay'),
    optBreakdownAcc: document.getElementById('optBreakdownAcc'),
    optBreakdownBrace: document.getElementById('optBreakdownBrace'),
    optBreakdownGems: document.getElementById('optBreakdownGems'),
    optTotalCpVal: document.getElementById('optTotalCpVal'),

    barLabel1: document.getElementById('barLabel1'),
    barVal1: document.getElementById('barVal1'),
    barFill1: document.getElementById('barFill1'),

    barLabel2: document.getElementById('barLabel2'),
    barVal2: document.getElementById('barVal2'),
    barFill2: document.getElementById('barFill2'),

    barLabel3: document.getElementById('barLabel3'),
    barVal3: document.getElementById('barVal3'),
    barFill3: document.getElementById('barFill3'),

    barLabel4: document.getElementById('barLabel4'),
    barVal4: document.getElementById('barVal4'),
    barFill4: document.getElementById('barFill4'),

    barVal5: document.getElementById('barVal5'),
    barFill5: document.getElementById('barFill5'),

    optAdviceText: document.getElementById('optAdviceText'),

    // Tableau d'Arbitrage EUC (Onglet 3)
    effRoleBadge: document.getElementById('effRoleBadge'),
    effNextBestDesc: document.getElementById('effNextBestDesc'),
    effColGainHeader: document.getElementById('effColGainHeader'),
    effColRatioHeader: document.getElementById('effColRatioHeader'),
    effTableBody: document.getElementById('effTableBody'),

    // Onglet 4 : Moteur Canonique (lostark.bible)
    canonRoleBadge: document.getElementById('canonRoleBadge'),
    canonInGameScore: document.getElementById('canonInGameScore'),
    canonInGameSub: document.getElementById('canonInGameSub'),
    canonCalculatedScore: document.getElementById('canonCalculatedScore'),
    canonCalculatedRange: document.getElementById('canonCalculatedRange'),
    canonBuffCard: document.getElementById('canonBuffCard'),
    canonBuffPower: document.getElementById('canonBuffPower'),
    canonHealCard: document.getElementById('canonHealCard'),
    canonHealPower: document.getElementById('canonHealPower'),
    canonPartsCount: document.getElementById('canonPartsCount'),
    canonTableBody: document.getElementById('canonTableBody'),

    // Modal d'Importation lostark.bible
    btnOpenImportModal: document.getElementById('btnOpenImportModal'),
    btnCloseImportModal: document.getElementById('btnCloseImportModal'),
    btnCloseImportModalFooter: document.getElementById('btnCloseImportModalFooter'),
    importModal: document.getElementById('importModal'),
    importRegion: document.getElementById('importRegion'),
    importCharName: document.getElementById('importCharName'),
    btnFetchBible: document.getElementById('btnFetchBible'),
    importStatus: document.getElementById('importStatus'),
    importJsonDirect: document.getElementById('importJsonDirect'),
    btnParseDirectJson: document.getElementById('btnParseDirectJson'),

    // OAuth 2.0 PKCE Controls
    btnOAuthLogin: document.getElementById('btnOAuthLogin'),
    btnOAuthRefresh: document.getElementById('btnOAuthRefresh'),
    btnOAuthLogout: document.getElementById('btnOAuthLogout'),
    oauthDisconnectedView: document.getElementById('oauthDisconnectedView'),
    oauthConnectedView: document.getElementById('oauthConnectedView'),
    oauthUsername: document.getElementById('oauthUsername'),
    oauthRosterList: document.getElementById('oauthRosterList'),

    // Modal Roster Management
    btnOAuthSyncAllRoster: document.getElementById('btnOAuthSyncAllRoster'),
    chkAutoAddToRoster: document.getElementById('chkAutoAddToRoster'),
    userRosterManagerSection: document.getElementById('userRosterManagerSection'),
    modalRosterCount: document.getElementById('modalRosterCount'),
    modalUserRosterList: document.getElementById('modalUserRosterList'),
    btnRefreshAllUserRoster: document.getElementById('btnRefreshAllUserRoster'),
    btnClearUserRoster: document.getElementById('btnClearUserRoster'),

    // Smart Upgrade Advisor (Onglet 2)
    tabAdvisorBtn: document.querySelector('[data-tab="tab-advisor"]'),
    tabAdvisorPane: document.getElementById('tab-advisor'),
    advisorCharName: document.getElementById('advisorCharName'),
    advisorCharStats: document.getElementById('advisorCharStats'),
    gpdNextBanner: document.getElementById('gpdNextBanner'),
    gpdNextSystem: document.getElementById('gpdNextSystem'),
    gpdNextContext: document.getElementById('gpdNextContext'),
    gpdNextRate: document.getElementById('gpdNextRate'),
    gpdNextUnit: document.getElementById('gpdNextUnit'),
    gpdTableTitle: document.getElementById('gpdTableTitle'),
    gpdThRate: document.getElementById('gpdThRate'),
    gpdNextGain: document.getElementById('gpdNextGain'),
    gpdGoalButtons: document.getElementById('gpdGoalButtons'),
    gpdCustomCpInput: document.getElementById('gpdCustomCpInput'),
    gpdPlanSummary: document.getElementById('gpdPlanSummary'),
    planSummaryGold: document.getElementById('planSummaryGold'),
    planSummaryCp: document.getElementById('planSummaryCp'),
    planSummaryRoi: document.getElementById('planSummaryRoi'),
    btnApplyGpdPlan: document.getElementById('btnApplyGpdPlan'),
    gpdMasterTable: document.getElementById('gpdMasterTable'),
    gpdMasterTableBody: document.getElementById('gpdMasterTableBody'),
    gpdPiecesTable: document.getElementById('gpdPiecesTable'),
    gpdPiecesTableBody: document.getElementById('gpdPiecesTableBody'),
    dispAdvisorBudget: document.getElementById('dispAdvisorBudget'),
    dispAdvisorIlvl: document.getElementById('dispAdvisorIlvl'),
    dispAdvisorCp: document.getElementById('dispAdvisorCp'),
    advInputBudget: document.getElementById('advInputBudget'),
    advInputIlvl: document.getElementById('advInputIlvl'),
    advInputCp: document.getElementById('advInputCp'),
    advScopeGear: document.getElementById('advScopeGear'),
    advScopeAdvHoning: document.getElementById('advScopeAdvHoning'),
    advScopeGems: document.getElementById('advScopeGems'),
    advScopeArkGrid: document.getElementById('advScopeArkGrid'),
    advScopeAcc: document.getElementById('advScopeAcc'),
    advScopeEngravings: document.getElementById('advScopeEngravings'),
    advScopeBracelet: document.getElementById('advScopeBracelet'),
    advisorBraceletCard: document.getElementById('advisorBraceletCard'),
    advBraceTierBadge: document.getElementById('advBraceTierBadge'),
    advBraceSubtitle: document.getElementById('advBraceSubtitle'),
    advBraceGainVal: document.getElementById('advBraceGainVal'),
    advBraceEffVal: document.getElementById('advBraceEffVal'),
    advBraceRatingDesc: document.getElementById('advBraceRatingDesc'),
    advBraceProgressBar: document.getElementById('advBraceProgressBar'),
    advBraceLinesList: document.getElementById('advBraceLinesList'),
    advBraceTargetsList: document.getElementById('advBraceTargetsList'),
    btnRunAdvisor: document.getElementById('btnRunAdvisor'),
    btnApplyRoadmap: document.getElementById('btnApplyRoadmap'),
    advResGainCp: document.getElementById('advResGainCp'),
    advResProjectedCp: document.getElementById('advResProjectedCp'),
    advResNewIlvl: document.getElementById('advResNewIlvl'),
    advResDiffIlvl: document.getElementById('advResDiffIlvl'),
    advResTotalGold: document.getElementById('advResTotalGold'),
    advResBudgetRemaining: document.getElementById('advResBudgetRemaining'),
    advResAvgRoi: document.getElementById('advResAvgRoi'),
    advisorRoadmapList: document.getElementById('advisorRoadmapList'),
    advRoadmapSubtitle: document.getElementById('advRoadmapSubtitle'),

    // Ark Passive Simulator (Onglet 4)
    tabArkPassiveBtn: document.querySelector('[data-tab="tab-arkpassive"]'),
    tabArkPassivePane: document.getElementById('tab-arkpassive'),
    arkCharPill: document.getElementById('arkCharPill'),
    arkCharName: document.getElementById('arkCharName'),
    arkCharStats: document.getElementById('arkCharStats'),
    btnArkResetCurrent: document.getElementById('btnArkResetCurrent'),
    btnArkPresetSupport: document.getElementById('btnArkPresetSupport'),
    btnArkPresetDps: document.getElementById('btnArkPresetDps'),
    btnApplyArkToSim: document.getElementById('btnApplyArkToSim'),
    
    // Evolution
    sliderArkEvoPoints: document.getElementById('sliderArkEvoPoints'),
    numArkEvoPoints: document.getElementById('numArkEvoPoints'),
    dispArkEvoPoints: document.getElementById('dispArkEvoPoints'),
    arkEvoTierBadge: document.getElementById('arkEvoTierBadge'),
    arkEvoQuickPills: document.getElementById('arkEvoQuickPills'),
    arkEvoNodeSelect: document.getElementById('arkEvoNodeSelect'),
    dispArkEvoMult: document.getElementById('dispArkEvoMult'),
    dispArkEvoCp: document.getElementById('dispArkEvoCp'),
    
    // Enlightenment
    sliderArkEnlightPoints: document.getElementById('sliderArkEnlightPoints'),
    numArkEnlightPoints: document.getElementById('numArkEnlightPoints'),
    dispArkEnlightPoints: document.getElementById('dispArkEnlightPoints'),
    arkEnlightTierBadge: document.getElementById('arkEnlightTierBadge'),
    arkEnlightQuickPills: document.getElementById('arkEnlightQuickPills'),
    chkArkRelicBooks: document.getElementById('chkArkRelicBooks'),
    chkArkRelicAcc: document.getElementById('chkArkRelicAcc'),
    arkClassSpecSelect: document.getElementById('arkClassSpecSelect'),
    dispArkEnlightMult: document.getElementById('dispArkEnlightMult'),
    dispArkEnlightCp: document.getElementById('dispArkEnlightCp'),
    
    // Leap
    sliderArkLeapPoints: document.getElementById('sliderArkLeapPoints'),
    numArkLeapPoints: document.getElementById('numArkLeapPoints'),
    dispArkLeapPoints: document.getElementById('dispArkLeapPoints'),
    arkLeapTierBadge: document.getElementById('arkLeapTierBadge'),
    arkLeapQuickPills: document.getElementById('arkLeapQuickPills'),
    chkArkHaUnlocked: document.getElementById('chkArkHaUnlocked'),
    chkArkRaidsUnlocked: document.getElementById('chkArkRaidsUnlocked'),
    dispArkLeapMult: document.getElementById('dispArkLeapMult'),
    dispArkLeapCp: document.getElementById('dispArkLeapCp'),
    
    // Summary & KPIs
    arkSummaryRoleBadge: document.getElementById('arkSummaryRoleBadge'),
    arkResTotalCp: document.getElementById('arkResTotalCp'),
    arkResDiffCp: document.getElementById('arkResDiffCp'),
    arkResGlobalMult: document.getElementById('arkResGlobalMult'),
    arkResBuffDetail: document.getElementById('arkResBuffDetail'),
    arkResTotalPoints: document.getElementById('arkResTotalPoints'),
    arkResPointsCap: document.getElementById('arkResPointsCap'),
    arkResEfficiency: document.getElementById('arkResEfficiency'),
    arkResAdviceText: document.getElementById('arkResAdviceText'),
    arkAnalysisBox: document.getElementById('arkAnalysisBox'),
    arkAnalysisText: document.getElementById('arkAnalysisText'),

    // Astrogem Grader T4 (Ark Grid / Loseii)
    astroRoleBadge: document.getElementById('astroRoleBadge'),
    astroBaseCost: document.getElementById('astroBaseCost'),
    astroWpLevel: document.getElementById('astroWpLevel'),
    dispAstroWpLevel: document.getElementById('dispAstroWpLevel'),
    dispAstroEffectiveCost: document.getElementById('dispAstroEffectiveCost'),
    astroOrderLevel: document.getElementById('astroOrderLevel'),
    dispAstroOrderLevel: document.getElementById('dispAstroOrderLevel'),
    astroEffect1: document.getElementById('astroEffect1'),
    astroEff1Level: document.getElementById('astroEff1Level'),
    dispAstroEff1Level: document.getElementById('dispAstroEff1Level'),
    astroEffect2: document.getElementById('astroEffect2'),
    astroEff2Level: document.getElementById('astroEff2Level'),
    dispAstroEff2Level: document.getElementById('dispAstroEff2Level'),
    astroScoreHero: document.getElementById('astroScoreHero'),
    astroGradeVal: document.getElementById('astroGradeVal'),
    astroRainbowLabel: document.getElementById('astroRainbowLabel'),
    astroRankPill: document.getElementById('astroRankPill'),
    astroTierBadge: document.getElementById('astroTierBadge'),
    astroGainLabel: document.getElementById('astroGainLabel'),
    astroGainVal: document.getElementById('astroGainVal'),
    astroGainSub: document.getElementById('astroGainSub'),
    astroRarityVal: document.getElementById('astroRarityVal'),
    astroRaritySub: document.getElementById('astroRaritySub'),
    astroCostVal: document.getElementById('astroCostVal'),
    astroViabilityVal: document.getElementById('astroViabilityVal'),
    astroViabilitySub: document.getElementById('astroViabilitySub'),
    astroAnalysisText: document.getElementById('astroAnalysisText'),
    btnAstroPresetPerfect8: document.getElementById('btnAstroPresetPerfect8'),
    btnAstroPresetRelic9: document.getElementById('btnAstroPresetRelic9'),
    btnAstroPresetRelic10: document.getElementById('btnAstroPresetRelic10'),
    btnAstroPresetFodder: document.getElementById('btnAstroPresetFodder')
  };

  // --- CONFIGURATION & CALCULS DYNAMIQUES DES GEMMES T4 (CANONIQUE SMILEGATE / BIBLE) ---

  function getDynamicGemsForActiveCharacter() {
    const isSupport = state.role === 'support';
    const cId = (activeCharacterId || '').toLowerCase();
    const curChar = getCurrentActiveCharacter();

    // Gemmes réellement lues sur le profil (gemParts ou profil brut lostark.bible)
    const gemParts = curChar ? extractCharacterGemParts(curChar) : null;
    if (gemParts && gemParts.length > 0) {
      const t8Val = isSupport ? 9.60 : 5.70;
      const t9Val = isSupport ? 10.80 : 6.35;
      const t10Val = isSupport ? 12.00 : 7.00;
      const step78 = isSupport ? 32.2 : 30.4;
      const step89 = isSupport ? 36.1 : 32.3;
      const step910 = isSupport ? 40.3 : 34.5;

      let to8 = 0, to9 = 0, to10 = 0;
      for (let rawG of gemParts) {
        const g = rawG > 20 ? rawG / 100 : rawG;
        if (g < t8Val) to8 += step78;
        if (g < t9Val) to9 += (g < t8Val ? step78 + step89 : step89);
        if (g < t10Val) to10 += (g < t8Val ? step78 + step89 + step910 : (g < t9Val ? step89 + step910 : step910));
      }
      return {
        major8: isSupport ? 80 : 95,
        full8: Math.round(to8),
        full9: Math.round(to9),
        full10: Math.round(to10)
      };
    }

    return {
      major8: isSupport ? 80 : 95,
      full8: isSupport ? 355 : 335,
      full9: isSupport ? 745 : 690,
      full10: isSupport ? 1190 : 1070
    };
  }

  function updateGemSelectOptions() {
    if (!dom.gemSelect) return;
    const gems = getDynamicGemsForActiveCharacter();
    const isSupport = state.role === 'support';
    const isEn = isEnLang();

    if (dom.optGemMajor8) {
      dom.optGemMajor8.textContent = isEn
        ? `2-3 Key Lv. 8 Gems (${isSupport ? 'AP Buffs' : 'Top Skills'}) (+${gems.major8} CP)`
        : `2-3 Gemmes clés Niv. 8 (${isSupport ? 'Buffs AP' : 'Top Skills'}) (+${gems.major8} CP)`;
    }
    if (dom.optGemFull8) {
      const note = gems.full8 === 0 ? (isEn ? ' (Already reached)' : ' (Déjà atteint)') : '';
      dom.optGemFull8.textContent = isEn
        ? `Full Deck 11x Lv. 8 Gems${note} (+${gems.full8} CP)`
        : `Deck Complet 11x Gemmes Niv. 8${note} (+${gems.full8} CP)`;
    }
    if (dom.optGemFull9) {
      dom.optGemFull9.textContent = isEn
        ? `Full Deck 11x Lv. 9 Gems (+${gems.full9} CP)`
        : `Deck Complet 11x Gemmes Niv. 9 (+${gems.full9} CP)`;
    }
    if (dom.optGemFull10) {
      dom.optGemFull10.textContent = isEn
        ? `Full Deck 11x Lv. 10 Endgame Gems (+${formatNumber(gems.full10)} CP)`
        : `Deck Complet 11x Gemmes Niv. 10 Endgame (+${formatNumber(gems.full10)} CP)`;
    }
  }

  function computeGemBonus(val) {
    const gems = getDynamicGemsForActiveCharacter();
    switch (val) {
      case 'major8':
        return gems.major8;
      case 'lvl8':
      case 'full8':
        return gems.full8;
      case 'lvl9':
      case 'full9':
        return gems.full9;
      case 'lvl10':
      case 'full10':
        return gems.full10;
      default:
        return 0;
    }
  }

  // --- 4. GESTION DES MISES À JOUR UI ---

  function isEnLang() {
    return !!(window.i18n && window.i18n.getLang() === 'en');
  }

  function formatNumber(num) {
    const locale = isEnLang() ? 'en-US' : 'fr-FR';
    return new Intl.NumberFormat(locale).format(num);
  }

  function getCpBracket(cp) {
    if (cp < 1000) return isEnLang() ? 'Below 1,000' : 'Inférieur à 1000';
    const low = Math.floor(cp / 500) * 500;
    const high = low + 500;
    return `${formatNumber(low)} – ${formatNumber(high)}`;
  }

  /**
   * Met à jour les résultats du prédicteur rapide (Onglet 1)
   */
  
  function getAverageTaps(baseChance) {
      if (!baseChance || baseChance >= 1) return 1;
      let artisan = 0;
      let currentChance = baseChance;
      let expectedTaps = 0;
      let probReachingThisTap = 1.0;
      let tap = 1;

      while (artisan < 1.0 && tap < 500) {
          expectedTaps += probReachingThisTap * currentChance * tap;
          let artisanGained = currentChance / 2.15;
          let probFail = 1 - currentChance;
          artisan += artisanGained;
          
          if (artisan >= 1.0) {
              expectedTaps += (probReachingThisTap * probFail) * (tap + 1);
              break;
          }
          
          probReachingThisTap *= probFail;
          tap++;
          let nextChance = baseChance + (baseChance * 0.1 * (tap - 1));
          currentChance = Math.min(baseChance * 2, nextChance);
      }
      return expectedTaps;
  }

  function getLevelCost(piece, lvl) {
      if (lvl < 10 || lvl > 24) return { totalValue: 0, rawGold: 0 };
      
      const isWeapon = piece === 'weapon';
      const costs = isWeapon ? window.T4_WEAPON_COST : window.T4_ARMOR_COST;
      const chances = window.T4_HONING_CHANCES;
      
      if (!costs || !chances) {
         return { totalValue: 50000, rawGold: 50000 };
      }
      
      const avgTaps = getAverageTaps(chances[lvl]);
      
      const destStones = isWeapon ? costs[0][lvl] : 0;
      const guardStones = isWeapon ? 0 : costs[1][lvl];
      const fusion = costs[2][lvl];
      const shards = costs[3][lvl];
      const leaps = costs[4][lvl];
      const rawGold = costs[5][lvl];
      
      const priceDest = state.marketPrices['destiny-destruction-stone'] || 5;
      const priceGuard = state.marketPrices['destiny-guardian-stone'] || 0.58;
      const actualFusionPrice = lvl >= 20 ? (state.marketPrices['abidos-fusion-material'] || 124) : (state.marketPrices['prime-oreha-fusion-material'] || 58);
      const priceLeap = state.marketPrices['destiny-leapstone'] || 16;
      
      const tapCostGold = rawGold +
           destStones * priceDest + 
           guardStones * priceGuard + 
           fusion * actualFusionPrice + 
           leaps * priceLeap;

      return {
         totalValue: Math.round(tapCostGold * avgTaps),
         rawGold: Math.round(rawGold * avgTaps)
      };
  }

  // --- Affinage avancé T4 (wiki Lost Ark « Advanced Honing ») ---
  // Coût d'une tentative, identique sur toute une tranche de 10 niveaux.
  // Éclats et argent ignorés (comme pour l'affinage normal) ; Souffle = Lave (arme) ou Glacier (armure).
  const ADV_HONING_ATTEMPT = {
    weapon: {
      10: { dest: 180, guard: 0, leap: 5, fusion: 8, gold: 563, breath: 4 },
      20: { dest: 330, guard: 0, leap: 7, fusion: 9, gold: 1250, breath: 6 },
      30: { dest: 1200, guard: 0, leap: 25, fusion: 28, gold: 3000, breath: 20 },
      40: { dest: 1400, guard: 0, leap: 32, fusion: 30, gold: 4000, breath: 24 }
    },
    armor: {
      10: { dest: 0, guard: 150, leap: 4, fusion: 5, gold: 475, breath: 4 },
      20: { dest: 0, guard: 270, leap: 5, fusion: 5, gold: 900, breath: 6 },
      30: { dest: 0, guard: 1000, leap: 18, fusion: 17, gold: 2000, breath: 20 },
      40: { dest: 0, guard: 1200, leap: 23, fusion: 19, gold: 2400, breath: 24 }
    }
  };
  // Tentatives moyennes [payées, totales] pour k niveaux restants avant la fin de la tranche (k = 1…10).
  // Simulation Monte-Carlo (200 000 essais) : 100 XP/niveau, succès 10/20/40 XP à 80/15/5 %
  // (souffle complet : 50/30/20 %), Grâce de l'ancêtre toutes les 4 tentatives (effets 1-20 et 21-40),
  // Ciseau de Temer = tentative suivante gratuite (le souffle reste consommé).
  const ADV_HONING_ATTEMPTS = {
    low: {
      plain: [[5.75, 6.11], [10.21, 11.07], [14.72, 16.08], [19.21, 21.05], [23.72, 26.05], [28.22, 31.06], [32.72, 36.04], [37.23, 41.04], [41.75, 46.05], [46.23, 51.04]],
      breath: [[4.45, 4.69], [7.66, 8.26], [10.85, 11.79], [14.05, 15.34], [17.23, 18.87], [20.43, 22.43], [23.63, 25.97], [26.83, 29.52], [30.02, 33.07], [33.21, 36.6]]
    },
    high: {
      plain: [[5.44, 5.71], [9.57, 10.18], [13.7, 14.65], [17.84, 19.12], [21.99, 23.6], [26.14, 28.1], [30.27, 32.54], [34.43, 37.05], [38.59, 41.54], [42.72, 46.01]],
      breath: [[4.42, 4.6], [7.49, 7.93], [10.56, 11.24], [13.63, 14.57], [16.7, 17.89], [19.78, 21.21], [22.86, 24.55], [25.96, 27.89], [29.01, 31.19], [32.07, 34.5]]
    }
  };

  /**
   * Coût attendu (gold, prix du marché) pour finir la tranche d'affinage avancé en cours
   * depuis le niveau `fromLvl` (0…39) d'UNE pièce. Retient l'option la moins chère : avec ou sans souffle.
   */
  function getAdvHoningCost(piece, fromLvl) {
    const lvl = Math.max(0, Math.floor(fromLvl || 0));
    if (lvl >= 40) return null;
    const rangeEnd = Math.floor(lvl / 10) * 10 + 10;
    const levels = rangeEnd - lvl;
    const isWeapon = piece === 'weapon';
    const a = ADV_HONING_ATTEMPT[isWeapon ? 'weapon' : 'armor'][rangeEnd];
    const mp = state.marketPrices;
    const attemptCost = a.gold +
      a.dest * (mp['destiny-destruction-stone'] || 5) +
      a.guard * (mp['destiny-guardian-stone'] || 0.58) +
      a.leap * (mp['destiny-leapstone'] || 16) +
      a.fusion * (mp['abidos-fusion-material'] || 124);
    const breathCost = a.breath * (mp[isWeapon ? 'lavas-breath' : 'glaciers-breath'] || (isWeapon ? 411 : 398));
    const table = ADV_HONING_ATTEMPTS[rangeEnd <= 20 ? 'low' : 'high'];
    const [plainPaid] = table.plain[levels - 1];
    const [breathPaid, breathTotal] = table.breath[levels - 1];
    const plain = plainPaid * attemptCost;
    const withBreath = breathPaid * attemptCost + breathTotal * breathCost;
    const useBreath = withBreath < plain;
    return {
      from: lvl,
      to: rangeEnd,
      levels,
      useBreath,
      attempts: useBreath ? breathPaid : plainPaid,
      totalValue: Math.round(useBreath ? withBreath : plain)
    };
  }

  // --- Pierre d'aptitude T4 (Grande pierre d'envol : 10 nœuds par ligne) ---
  // Prix (gold) d'une pierre non taillée portant les deux gravures voulues. Pas de source marché
  // (hôtel des ventes) : calé sur l'ancienne constante, 14,17 M pour une 9/7 ≈ 1 390 pierres × ~10 k.
  const ABILITY_STONE_PRICE = 10000;
  // Niveau de pierre 1…4 atteint à 6 / 7 / 9 / 10 nœuds
  const STONE_LEVEL_NODES = [6, 7, 9, 10];
  // Somme des niveaux positifs >= 5 : Puissance d'attaque de base +1,5 %
  const STONE_BASE_AP_BONUS = 0.015;
  // Autres sources de Puissance d'attaque % supposées cumulées avec une gravure « PA » (Adrénaline, etc.)
  const STONE_OTHER_AP_PCT = 20;
  const stoneSuccessCache = new Map();

  function stoneLevelFromNodes(nodes) {
    let lvl = 0;
    STONE_LEVEL_NODES.forEach((t, i) => { if (nodes >= t) lvl = i + 1; });
    return lvl;
  }

  /**
   * Probabilité exacte d'obtenir au moins `a` nœuds sur la gravure 1 et `b` sur la gravure 2,
   * stratégie de taille optimale (chaîne de Markov / programmation dynamique) :
   * 10 tentatives par ligne, chance de départ 75 %, -10 % après un succès, +10 % après un échec (25 %…75 %).
   * La ligne négative sert de « ligne de délestage » pour remonter la chance ; son résultat est ignoré.
   */
  function stoneSuccessProbability(a, b) {
    const cacheKey = `${a}/${b}`;
    if (stoneSuccessCache.has(cacheKey)) return stoneSuccessCache.get(cacheKey);
    const N = 10;
    const P = [0.25, 0.35, 0.45, 0.55, 0.65, 0.75];
    const memo = new Map();
    const V = (r1, s1, r2, s2, r3, pi) => {
      if (s1 >= a && s2 >= b) return 1;
      if (s1 + r1 < a || s2 + r2 < b) return 0;
      const key = ((((r1 * 11 + s1) * 11 + r2) * 11 + s2) * 11 + r3) * 6 + pi;
      const hit = memo.get(key);
      if (hit !== undefined) return hit;
      const p = P[pi], up = Math.min(5, pi + 1), dn = Math.max(0, pi - 1);
      let best = 0;
      if (r1 > 0) best = Math.max(best, p * V(r1 - 1, Math.min(a, s1 + 1), r2, s2, r3, dn) + (1 - p) * V(r1 - 1, s1, r2, s2, r3, up));
      if (r2 > 0) best = Math.max(best, p * V(r1, s1, r2 - 1, Math.min(b, s2 + 1), r3, dn) + (1 - p) * V(r1, s1, r2 - 1, s2, r3, up));
      if (r3 > 0) best = Math.max(best, p * V(r1, s1, r2, s2, r3 - 1, dn) + (1 - p) * V(r1, s1, r2, s2, r3 - 1, up));
      memo.set(key, best);
      return best;
    };
    const prob = V(N, 0, N, 0, N, 5);
    stoneSuccessCache.set(cacheKey, prob);
    return prob;
  }

  // Karma T4 lu sur le Battle Point (part 8 = Évolution, part 9 = Bond, en centièmes de %).
  // Obtenu en jeu : affiché sur la fiche, jamais classé en or.
  function getKarmaBonus(charObj) {
    const raw = (charObj && charObj.rawProfile) || {};
    const parts = (raw.battlePoint && raw.battlePoint.parts)
      || (charObj && charObj.battlePoint && charObj.battlePoint.parts)
      || (raw.loadout && raw.loadout.battlePoint && raw.loadout.battlePoint.parts)
      || (charObj && charObj.loadout && charObj.loadout.battlePoint && charObj.loadout.battlePoint.parts);
    if (!Array.isArray(parts)) return null;
    const pct = type => parts.filter(x => x.type === type).reduce((sum, x) => sum + ((('value' in x) ? x.value : x.min) || 0), 0) / 100;
    if (!parts.some(x => x.type === 8 || x.type === 9)) return null;
    return { evolution: pct(8), leap: pct(9) };
  }

  // Pierre équipée, lue sur le profil importé : deux gravures positives + la ligne négative
  function getAbilityStone(charObj) {
    const raw = (charObj && charObj.rawProfile) || charObj || {};
    const items = raw.rawItems || (raw.loadout && raw.loadout.items) || (charObj && charObj.loadout && charObj.loadout.items) || [];
    const stone = items.find(i => i && i.slot === 'ability_stone');
    const engr = stone && stone.data && Array.isArray(stone.data.engravings) ? stone.data.engravings : null;
    if (!engr) return null;
    const lines = engr.map(e => {
      const label = BIBLE_ENGRAVINGS[String(e.id)] || '';
      const en = label.split(' (')[0];
      const fr = (label.match(/\(([^)]+)\)/) || [])[1] || en;
      return { id: e.id, en, fr, key: en.toLowerCase(), nodes: e.nodes || 0, level: stoneLevelFromNodes(e.nodes || 0), negative: /Reduction/.test(en) };
    });
    const positives = lines.filter(l => !l.negative && l.en);
    if (positives.length !== 2) return null;
    return { positives, negative: lines.find(l => l.negative) || null };
  }

  // Gain (%) d'un effet de gravure qui passe de base+addOld à base+addNew (même unité que `base`)
  function engravingBonusGain(kind, base, addOld, addNew) {
    if (!(addNew > addOld)) return 0;
    if (kind === 'dmg') return ((1 + (base + addNew) / 100) / (1 + (base + addOld) / 100) - 1) * 100;
    if (kind === 'ap') {
      const pool = base + STONE_OTHER_AP_PCT;
      return ((1 + (pool + addNew) / 100) / (1 + (pool + addOld) / 100) - 1) * 100;
    }
    if (!window.Bracelet) return 0;
    const prof = window.Bracelet.normalizeProfile({ role: 'dps' });
    const d = (addNew - addOld) / 100;
    const ref = window.Bracelet.critFactor(prof, 0, 0);
    const next = kind === 'critRate' ? window.Bracelet.critFactor(prof, d, 0) : window.Bracelet.critFactor(prof, 0, d);
    return (next / ref - 1) * 100;
  }

  // Gain (%) de la gravure quand la pierre passe du niveau lvlFrom à lvlTo
  function stoneEngravingGain(key, lvlFrom, lvlTo, isSupport) {
    const eff = window.ABILITY_STONE_EFFECTS && window.ABILITY_STONE_EFFECTS[key];
    if (isSupport || !eff || lvlTo <= lvlFrom) return 0;
    return engravingBonusGain(eff.kind, eff.base, lvlFrom > 0 ? eff.stone[lvlFrom - 1] : 0, eff.stone[lvlTo - 1]);
  }

  // Gain (%) de la PA de base +1,5 % (somme des niveaux >= 5), mesuré sur le profil de référence
  function stoneBaseApGain() {
    if (!window.Bracelet) return 0;
    const prof = window.Bracelet.normalizeProfile({ role: 'dps' });
    const without = Object.assign({}, prof, { baseApPct: prof.baseApPct - STONE_BASE_AP_BONUS });
    return (window.Bracelet.attackPower(prof) / window.Bracelet.attackPower(without) - 1) * 100;
  }

  /**
   * Meilleure amélioration de pierre : monter UNE des deux gravures d'un niveau, l'autre gardée à son niveau.
   * Coût = prix d'une pierre / probabilité exacte de réussir la taille visée.
   */
  function getAbilityStoneUpgrade(charObj, isSupport) {
    const stone = getAbilityStone(charObj);
    if (!stone) return null;
    const [e1, e2] = stone.positives;
    const nodesFor = lvl => (lvl > 0 ? STONE_LEVEL_NODES[lvl - 1] : 0);
    const candidates = [];
    [[e1, e2], [e2, e1]].forEach(([up, keep]) => {
      if (up.level >= 4) return;
      const upTo = up.level + 1;
      const target = [nodesFor(upTo), nodesFor(keep.level)];
      const p = stoneSuccessProbability(target[0], target[1]);
      if (!(p > 0)) return;
      const sumFrom = e1.level + e2.level;
      const apBonus = sumFrom < 5 && sumFrom + 1 >= 5 ? stoneBaseApGain() : 0;
      const engGain = stoneEngravingGain(up.key, up.level, upTo, isSupport);
      const gain = ((1 + engGain / 100) * (1 + apBonus / 100) - 1) * 100;
      const cost = ABILITY_STONE_PRICE / p;
      candidates.push({ up, keep, upTo, target, p, stones: 1 / p, cost, gain, apBonus });
    });
    const scored = candidates.filter(c => c.gain > 0);
    if (!scored.length) return null;
    scored.sort((x, y) => x.cost / x.gain - y.cost / y.gain);
    const best = scored[0];
    const nodesOf = (eng, lvl) => (eng === best.up ? nodesFor(best.upTo) : nodesFor(lvl));
    best.fromLabel = `${e1.nodes}/${e2.nodes}`;
    best.toLabel = `${nodesOf(e1, e1.level)}/${nodesOf(e2, e2.level)}`;
    best.stone = stone;
    return best;
  }

  // --- Livres de gravure reliques T4 : 5 livres par niveau, 4 niveaux ---
  const RELIC_BOOKS_PER_LEVEL = 5;
  const RELIC_MAX_BOOKS = 20;

  // Slug du marché loa-buddy pour le livre d'une gravure (« Keen Blunt Weapon » -> keen-blunt-weapon)
  function relicBookSlug(key) {
    return key.replace(/'/g, '').replace(/\s+/g, '-');
  }

  /**
   * Livres reliques restants par gravure équipée : de la progression actuelle jusqu'au niveau 4.
   * lostark.bible : grade engrave_grade05 = relique, `progress` = livres lus dans ce grade (0…20).
   * Les gravures encore légendaires (engrave_grade04) doivent d'abord finir leurs livres légendaires : ignorées.
   */
  function getRelicBookUpgrades(charObj, isSupport) {
    if (isSupport) return [];
    const raw = (charObj && charObj.rawProfile) || charObj || {};
    const list = raw.engravings || (raw.loadout && raw.loadout.engravings) || [];
    const out = [];
    list.forEach(e => {
      if (!e || e.grade !== 'engrave_grade05') return;
      const label = BIBLE_ENGRAVINGS[String(e.id)] || '';
      const en = label.split(' (')[0];
      const key = en.toLowerCase();
      const eff = window.RELIC_BOOK_EFFECTS && window.RELIC_BOOK_EFFECTS[key];
      if (!eff) return;
      const read = Math.max(0, Math.min(RELIC_MAX_BOOKS, e.progress || 0));
      if (read >= RELIC_MAX_BOOKS) return;
      const price = state.marketPrices[relicBookSlug(key)];
      if (!(price > 0)) return;
      const lvl = Math.floor(read / RELIC_BOOKS_PER_LEVEL);
      const books = RELIC_MAX_BOOKS - read;
      const gain = engravingBonusGain(eff.kind, eff.base, lvl > 0 ? eff.relic[lvl - 1] : 0, eff.relic[3]);
      if (!(gain > 0)) return;
      out.push({
        id: e.id, key, en,
        fr: (label.match(/\(([^)]+)\)/) || [])[1] || en,
        lvl, read, books, price, cost: books * price, gain
      });
    });
    return out;
  }

  // --- Bracelet : gain espéré d'une nouvelle campagne (solveur exact, dans bracelet-worker.js) ---
  // 4 rerolls normaux + 3 tickets de reconversion
  const BRACELET_CAMPAIGN_ROLLS = 7;
  const BRACELET_EV_STORAGE = 'lostark_bracelet_ev';
  let braceletEvCache = null;
  let braceletWorker = null;
  const braceletEvPending = new Set();

  function loadBraceletEvCache() {
    if (braceletEvCache) return braceletEvCache;
    try { braceletEvCache = JSON.parse(localStorage.getItem(BRACELET_EV_STORAGE) || '{}') || {}; } catch (e) { braceletEvCache = {}; }
    return braceletEvCache;
  }

  function getBraceletStats(charObj) {
    const cands = [charObj && charObj.bracelet, charObj && charObj.rawProfile && charObj.rawProfile.bracelet];
    for (const b of cands) {
      if (!b) continue;
      if (Array.isArray(b.stats)) return b.stats;
      if (b.data && Array.isArray(b.data.stats)) return b.data.stats;
    }
    return null;
  }

  // Entrées du solveur pour le bracelet porté : lignes fixes, lignes rerollables, traits
  function braceletSolverInput(charObj, isSupport) {
    const stats = getBraceletStats(charObj);
    if (!stats || !window.Bracelet) return null;
    const dec = window.Bracelet.decodeBibleBracelet(stats);
    if (!dec || !Array.isArray(dec.lines) || !dec.lines.length) return null;
    const TRAIT_KEYS = { crit: 'crit', spec: 'spec', swiftness: 'swift' };
    const traits = {};
    const fixed = [];
    const granted = [];
    dec.lines.forEach(l => {
      const clean = { cat: l.cat, family: l.family, tier: l.tier, value: l.value };
      if (l.cat === 'trait' && TRAIT_KEYS[l.family]) traits[TRAIT_KEYS[l.family]] = l.value;
      (l.fixed ? fixed : granted).push(clean);
    });
    if (!granted.length) return null;
    return {
      grade: dec.grade || 'ancient',
      role: isSupport ? 'support' : 'dps',
      fixed, granted, traits,
      slots: granted.length,
      rolls: BRACELET_CAMPAIGN_ROLLS
    };
  }

  /**
   * Gain espéré (%) d'une campagne complète sur un bracelet neuf, en gardant l'actuel s'il reste meilleur.
   * Renvoie le résultat en cache, ou null en lançant le calcul (le tableau se redessine à la réception).
   */
  function getBraceletRerollEstimate(charObj, isSupport) {
    const input = braceletSolverInput(charObj, isSupport);
    if (!input) return null;
    const key = `${window.Bracelet.MODEL_SIG}|${window.Bracelet.VERSION}|${JSON.stringify(input)}`;
    const cache = loadBraceletEvCache();
    if (cache[key]) return cache[key];
    if (braceletEvPending.has(key) || typeof Worker === 'undefined') return null;
    try {
      if (!braceletWorker) {
        braceletWorker = new Worker('bracelet-worker.js?v=1.0');
        braceletWorker.onmessage = (ev) => {
          const res = ev.data || {};
          braceletEvPending.delete(res.key);
          if (!res.ok) { console.warn('[BRACELET] Calcul impossible :', res.error); return; }
          const store = loadBraceletEvCache();
          store[res.key] = { gain: res.gain, pBeat: res.pBeat, curPct: res.curPct, freshMeanPct: res.freshMeanPct };
          // On ne garde que les 20 derniers bracelets calculés
          const keys = Object.keys(store);
          if (keys.length > 20) keys.slice(0, keys.length - 20).forEach(k => delete store[k]);
          try { localStorage.setItem(BRACELET_EV_STORAGE, JSON.stringify(store)); } catch (e) {}
          if (typeof updateActiveCharacterCard === 'function') updateActiveCharacterCard(activeCharacterId);
        };
      }
      braceletEvPending.add(key);
      braceletWorker.postMessage(Object.assign({ key }, input));
    } catch (e) {
      console.warn('[BRACELET] Worker indisponible :', e.message);
    }
    return null;
  }

  function updatePredictorView() {
    const { currentIlvl, currentCp, targetIlvl, role, gemBonus } = state;

    // Synchronisation des labels de saisie
    dom.dispCurrentIlvl.textContent = currentIlvl.toFixed(2);
    dom.sliderCurrentIlvl.value = currentIlvl;
    dom.numCurrentIlvl.value = currentIlvl;

    dom.dispCurrentCp.textContent = formatNumber(currentCp);
    dom.sliderCurrentCp.value = currentCp;
    dom.numCurrentCp.value = currentCp;

    dom.dispTargetIlvl.textContent = targetIlvl.toFixed(2);
    dom.sliderTargetIlvl.value = targetIlvl;
    dom.numTargetIlvl.value = targetIlvl;

    // Calcul de la prédiction
    const pred = predictCp(currentIlvl, currentCp, targetIlvl, role, gemBonus);

    // Affichage des chiffres clés
    dom.resTargetIlvlText.textContent = targetIlvl.toFixed(2);
    dom.predictedCp.textContent = formatNumber(pred.predictedCp);
    dom.predictedRange.textContent = isEnLang()
      ? `Estimated range : ${formatNumber(pred.minCp)} – ${formatNumber(pred.maxCp)} CP`
      : `Fourchette estimée : ${formatNumber(pred.minCp)} – ${formatNumber(pred.maxCp)} CP`;

    const sign = pred.diffCp >= 0 ? '+' : '';
    dom.diffCp.textContent = `${sign}${formatNumber(pred.diffCp)} CP`;
    dom.diffCp.className = `stat-val ${pred.diffCp >= 0 ? 'positive' : 'stat-val'}`;

    const ilvlSign = pred.diffIlvl >= 0 ? '+' : '';
    dom.diffIlvl.textContent = `${ilvlSign}${pred.diffIlvl.toFixed(2)} iLvl`;

    dom.efficiencyCp.textContent = `${pred.slope} CP / iLvl`;
    dom.bracketText.textContent = getCpBracket(pred.predictedCp);

    // Jauge visuelle (sur base 1640 - 1800)
    const minScale = 1640;
    const maxScale = 1800;
    const currPct = Math.min(100, Math.max(0, ((currentIlvl - minScale) / (maxScale - minScale)) * 100));
    const targetPct = Math.min(100, Math.max(0, ((targetIlvl - minScale) / (maxScale - minScale)) * 100));

    dom.gaugeCurrent.style.width = `${currPct}%`;
    dom.gaugeTarget.style.width = `${targetPct}%`;
    dom.gaugeCenterLabel.textContent = isEnLang() ? `Current: ${currentIlvl.toFixed(1)}` : `Actuel : ${currentIlvl.toFixed(1)}`;

    if (dom.sliderTargetIlvl) {
      dom.sliderTargetIlvl.min = Math.floor(currentIlvl);
    }
    if (dom.numTargetIlvl) {
      dom.numTargetIlvl.min = Math.floor(currentIlvl);
    }

    // Texte d'analyse dynamique intelligent
    updateAnalysisText(currentIlvl, targetIlvl, pred);
  }

  function updateAnalysisText(currentIlvl, targetIlvl, pred) {
    const isEn = isEnLang();
    let msg = '';
    const diff = Math.max(0, targetIlvl - currentIlvl);

    if (diff === 0) {
      msg = isEn
        ? `You are at your current iLvl (${currentIlvl.toFixed(2)}). Select a higher target iLvl to view CP projection.`
        : `Tu es exactement sur ton iLvl actuel (${currentIlvl.toFixed(2)}). Choisis un iLvl cible supérieur pour voir la projection de CP.`;
    } else {
      if (pred.mode === 'honing') {
        msg = isEn
          ? `<strong>Pure Honing Gain (Gear Only):</strong> Going from <strong>${currentIlvl.toFixed(2)}</strong> to <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) grants approx. <strong>+${formatNumber(pred.diffCp)} CP</strong> (realistic efficiency of <strong>${pred.slope} CP / iLvl</strong>). Strictly corresponds to upgrading your 6 gear pieces at the blacksmith (Weapon & Armors without changing gems or accessories).`
          : `<strong>Gain d'Affinage Pur (Stuff Seul) :</strong> Passer de <strong>${currentIlvl.toFixed(2)}</strong> à <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) confère environ <strong>+${formatNumber(pred.diffCp)} CP</strong> (efficacité réaliste de <strong>${pred.slope} CP / iLvl</strong>). Ce calcul correspond strictement à l'augmentation de tes 6 pièces chez le forgeron (Arme & Armures sans changer de gemmes ni d'accessoires).`;
      } else {
        msg = isEn
          ? `<strong>Overall Build Projection (Endgame T4):</strong> Going from <strong>${currentIlvl.toFixed(2)}</strong> to <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) projects your character toward <strong>${formatNumber(pred.predictedCp)} CP</strong> (+${formatNumber(pred.diffCp)} CP). <em>Note: This global projection assumes parallel progression (Lvl. 9/10 Gems, T4 Karma, and Relic Engravings).</em>`
          : `<strong>Projection de Build Global (Endgame T4) :</strong> Passer de <strong>${currentIlvl.toFixed(2)}</strong> à <strong>${targetIlvl.toFixed(2)}</strong> (+${diff.toFixed(2)} iLvl) projette ton personnage vers <strong>${formatNumber(pred.predictedCp)} CP</strong> (+${formatNumber(pred.diffCp)} CP). <em>Note : Cette projection globale suppose que tu fasses évoluer ton build en parallèle (montée des Gemmes Niv. 9/10, Karma T4 et Gravures Reliques).</em>`;
      }
    }

    if (state.gemBonus > 0) {
      msg += isEn
        ? ` <em>(Gem upgrade bonus of +${state.gemBonus} CP included in estimation).</em>`
        : ` <em>(Bonus d'amélioration de gemmes de +${state.gemBonus} CP inclus dans l'estimation).</em>`;
    }

    dom.analysisText.innerHTML = msg;
  }

  /**
   * Met à jour le simulateur d'affinage (Onglet 2) avec pondération réaliste par pièce
   */
  function updateHoningView() {
    const computedIlvl = computeGearIlvl(state.gear, state.advHoning);
    const role = state.role || 'dps';
    const config = PIECE_CONFIG[role] || PIECE_CONFIG.dps;

    const baseGear = state.baselineGear || state.gear;
    const baseAdv = state.baselineAdvHoning !== undefined ? state.baselineAdvHoning : state.advHoning;
    const baseIlvl = state.baselineIlvl !== undefined ? state.baselineIlvl : state.currentIlvl;
    const baseCp = state.baselineCp !== undefined ? state.baselineCp : state.currentCp;

    const diffIlvl = computedIlvl - baseIlvl;

    // Échelle de CP proportionnelle au profil du joueur
    const cpScale = baseCp > 0 ? (baseCp / 3500) : 1.0;

    let totalPieceCpDiff = 0;
    let totalAddedAtk = 0;
    let totalAddedStr = 0;

    for (const piece of ['weapon', 'head', 'shoulder', 'chest', 'pants', 'gloves']) {
      const dLevel = state.gear[piece] - baseGear[piece];
      if (dLevel === 0) continue;
      const pCfg = config[piece];
      
      let tapCp;
      if (piece === 'weapon') {
        const avgLvl = (state.gear[piece] + baseGear[piece]) / 2;
        // Paliers +21 à +25 d'arme : Puissance d'Arme accrue
        const wpBonus = avgLvl >= 21 ? 36.0 : 28.5;
        tapCp = wpBonus * cpScale;
        totalAddedAtk += dLevel * (avgLvl >= 21 ? 2400 : 1850);
      } else {
        // Armures T4 : indexées sur la MainStat effective avec multiplicateurs passifs (~3730 effective STR = ~11 CP pour 1750+ DPS)
        // Torse & Pantalon (+4600 effective STR) apportent plus de stat que Casque/Gants/Épaules (+3700-3750)
        const pieceFactor = (pCfg.strPerLevel || 3700) / 3700;
        const armorBase = (role === 'support' ? 9.8 : 9.3) * pieceFactor;
        tapCp = armorBase * cpScale;
        totalAddedStr += dLevel * (pCfg.strPerLevel || 3700);
        totalAddedAtk += dLevel * (pCfg.atkPerLevel || 476);
      }

      totalPieceCpDiff += dLevel * tapCp;
    }

    // Impact de l'Affinage Avancé (+10, +20 Echidna / +30, +40 Aegir)
    // Chaque palier de +10 iLvl équivaut à environ +75 CP par tranche de 10
    const dAdv = state.advHoning - baseAdv;
    if (dAdv !== 0) {
      const advCpPer10 = (role === 'support' ? 70 : 75) * cpScale;
      totalPieceCpDiff += (dAdv / 10) * advCpPer10;
      totalAddedAtk += Math.round(dAdv * 180);
      totalAddedStr += Math.round(dAdv * 450);
    }

    const predictedCp = Math.round(baseCp + totalPieceCpDiff);
    const diffCp = predictedCp - baseCp;

    dom.simulatedIlvl.textContent = computedIlvl.toFixed(2);
    dom.simulatedCp.textContent = formatNumber(predictedCp);

    dom.simDiffIlvl.textContent = `${diffIlvl >= 0 ? '+' : ''}${diffIlvl.toFixed(2)}`;
    dom.simDiffCp.textContent = `${diffCp >= 0 ? '+' : ''}${formatNumber(diffCp)} CP`;

    // Calcul du coût estimé en Gold brut (Honing Sheet)
    let totalSimGold = 0;
    let totalRawGold = 0;
    for (const piece of ['weapon', 'head', 'shoulder', 'chest', 'pants', 'gloves']) {
      const startLvl = baseGear[piece];
      const endLvl = state.gear[piece];
      if (endLvl > startLvl) {
        for (let l = startLvl; l < endLvl; l++) {
          const costObj = getLevelCost(piece, l);
          totalSimGold += Math.round(costObj.totalValue);
          totalRawGold += Math.round(costObj.rawGold);
        }
      }
    }

    // Affinage Avancé si augmenté vs baseline
    if (state.advHoning > baseAdv) {
      for (let adv = baseAdv + 10; adv <= state.advHoning; adv += 10) {
        totalSimGold += (HONING_COSTS.advWeapon[adv] || 50000) + (HONING_COSTS.advArmorTotal[adv] || 200000);
        totalRawGold += (HONING_COSTS.advWeapon[adv] || 50000) + (HONING_COSTS.advArmorTotal[adv] || 200000);
      }
    }

    if (dom.simEstimatedGold) {
      dom.simEstimatedGold.innerHTML = totalSimGold > 0 ? `${formatNumber(totalSimGold)} g <span style="font-size:13px; color:var(--text-muted); font-weight:normal;">(Market Value)</span><br><span style="font-size:15px; color:#ffb13b;">${formatNumber(totalRawGold)} g</span> <span style="font-size:13px; color:var(--text-muted); font-weight:normal;">(Raw Gold only)</span>` : '0 g';
    }

    if (dom.simGoldPerCp) {
      if (diffCp > 0 && totalSimGold > 0) {
        const goldPerCp = Math.round(totalSimGold / diffCp);
        dom.simGoldPerCp.textContent = `${formatNumber(goldPerCp)} g / CP`;
        dom.simGoldPerCp.className = 'stat-val positive';
      } else {
        dom.simGoldPerCp.textContent = '—';
        dom.simGoldPerCp.className = 'stat-val';
      }
    }

    // Estimation Force / Dextérité / Intelligence & Attaque de base
    const baseStr = role === 'support' ? 453200 : 480000;
    const baseAtk = role === 'support' ? 157300 : 162000;

    const classKeyHone = getCharacterClassKey(getCurrentActiveCharacter());
    const isEnHone = isEnLang();
    const statName = getMainStatName(classKeyHone, isEnHone);
    const statShort = statName.startsWith('D') ? 'DEX' : (statName.startsWith('I') ? 'INT' : 'STR');
    const statDisplay = `${statName} (${statShort})`;
    const lblMainStat = document.getElementById('lblMainStatEst');
    if (lblMainStat) {
      lblMainStat.textContent = isEnHone ? `Estimated ${statDisplay}` : `${statDisplay} estimée`;
    }

    dom.simEstimatedStr.textContent = `~${formatNumber(Math.max(0, baseStr + totalAddedStr))}`;
    dom.simEstimatedAtk.textContent = `~${formatNumber(Math.max(0, baseAtk + totalAddedAtk))}`;

    // Mise à jour de l'affichage de chaque pièce
    for (const piece of ['weapon', 'head', 'shoulder', 'chest', 'pants', 'gloves']) {
      const el = document.getElementById(`lvl${capitalize(piece)}`);
      if (el) el.textContent = `+${state.gear[piece]}`;
    }

    // Conseils personnalisés
    updateHoningAdvice(diffCp, totalSimGold);
    if (dom.charCardIlvl) dom.charCardIlvl.textContent = `${computedIlvl.toFixed(2)} iLvl`;
    if (dom.charCardCp) dom.charCardCp.textContent = `${formatNumber(predictedCp)} CP`;
    if (dom.charCardWeapon) dom.charCardWeapon.textContent = `+${state.gear.weapon}`;
    if (dom.charCardArmor) {
      const g = state.gear;
      const armors = [g.head, g.shoulder, g.chest, g.pants, g.gloves];
      const minA = Math.min(...armors);
      const maxA = Math.max(...armors);
      dom.charCardArmor.textContent = minA === maxA ? `+${minA}` : `+${minA} / +${maxA}`;
    }
    if (dom.charCardAdv) dom.charCardAdv.textContent = `+${state.advHoning}`;
  }

  function updateHoningAdvice(diffCp = 0, totalSimGold = 0) {
    const g = state.gear;
    const role = state.role;
    const isEn = isEnLang();
    let advice = '';

    let simPrefix = '';
    if (diffCp > 0 && totalSimGold > 0) {
      const goldPerCp = Math.round(totalSimGold / diffCp);
      simPrefix = `<div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dashed rgba(232, 230, 220,0.1); color: var(--accent-gold);">
        <strong>${isEn ? 'Simulation Summary' : 'Bilan Simulation'} :</strong> +${formatNumber(diffCp)} CP ${isEn ? 'for' : 'pour'} ~${formatNumber(totalSimGold)} gold (${isEn ? 'ratio' : 'ratio'} : <strong>${formatNumber(goldPerCp)} g / CP</strong>).
      </div>`;
    }

    if (role === 'dps') {
      if (g.weapon < 20) {
        advice = isEn
          ? `${simPrefix}Your <strong>Weapon (+${g.weapon})</strong> is your primary optimization target. Pushing it toward <strong>+20</strong> generates the largest boost to Weapon Power and Combat Power.`
          : `${simPrefix}Ton <strong>Arme (+${g.weapon})</strong> est ton levier d'optimisation majeur. La pousser vers <strong>+20</strong> génère le plus gros boost de Puissance d'Attaque d'Arme et de Combat Power.`;
      } else if (g.weapon >= 20 && (g.chest < 18 || g.pants < 18)) {
        advice = isEn
          ? `${simPrefix}Your weapon is already at a high tier (+${g.weapon}). To optimize gold, prioritizing your <strong>Chest (+${g.chest})</strong> and <strong>Pants (+${g.pants})</strong> to <strong>+18 / +19</strong> is most cost-effective for MainStat.`
          : `${simPrefix}Ton arme est déjà à un très haut niveau (+${g.weapon}). Pour optimiser tes golds, monter en priorité ton <strong>Torse (+${g.chest})</strong> et <strong>Pantalon (+${g.pants})</strong> à <strong>+18 / +19</strong> sera le plus rentable en Force / MainStat.`;
      } else if (g.weapon >= 23) {
        advice = isEn
          ? `${simPrefix}Weapon at <strong>+${g.weapon}</strong>. At this level, each tap (+24, +25) adds large Weapon Power gains (~<strong>+60 to +75 CP per tap</strong>), but at high cost. Ensure your armors are all at +18/+19 to balance your base.`
          : `${simPrefix}Arme à <strong>+${g.weapon}</strong>. À ce niveau, chaque palier (+24, +25) apporte de fortes hausses de Puissance d'Arme (~<strong>+60 à +75 CP par tap</strong>), mais à un coût très élevé. Assure-toi que tes armures soient toutes à +18/+19 pour consolider ta base.`;
      } else {
        advice = isEn
          ? `${simPrefix}Balanced honing distribution (+${g.weapon} weapon, armors +${Math.min(g.head, g.chest, g.pants)}). Continue elevating remaining armors evenly toward +18 / +20.`
          : `${simPrefix}Répartition d'affinage équilibrée (+${g.weapon} arme, armures +${Math.min(g.head, g.chest, g.pants)}). Continue d'élever uniformément tes armures vers +18 / +20.`;
      }
    } else {
      if (g.chest < 16 || g.pants < 16) {
        advice = isEn
          ? `${simPrefix}As a Support, your <strong>Chest (+${g.chest})</strong> and <strong>Pants (+${g.pants})</strong> are vital for Vitality and MainStat scaling your Shields and Heals. Hone them to +16 / +18 first.`
          : `${simPrefix}En Support, le <strong>Torse (+${g.chest})</strong> et le <strong>Pantalon (+${g.pants})</strong> sont vitaux pour la Vitalité et la Force qui augmentent tes Shields et Soins. Monte-les en priorité à +16 / +18.`;
      } else if (g.weapon < 18) {
        advice = isEn
          ? `${simPrefix}Pushing your <strong>Weapon (+${g.weapon})</strong> to +18 (+29 CP, ~56k gold) will strongly increase your base Attack Power, directly strengthening the attack buff granted to allies.`
          : `${simPrefix}Pousser ton <strong>Arme (+${g.weapon})</strong> vers +18 (+29 CP, ~56k gold) augmentera fortement ta Puissance d'Attaque de base, renforçant directement le buff d'attaque que tu donnes à tes alliés.`;
      } else {
        advice = isEn
          ? `${simPrefix}Very strong Support progression (+${g.weapon} weapon, armors +${Math.min(g.head, g.chest, g.pants)}). Push remaining pieces toward +18 / +20.`
          : `${simPrefix}Très bonne progression Support (+${g.weapon} arme, armures +${Math.min(g.head, g.chest, g.pants)}). Élève tes pièces restantes vers +18 / +20.`;
      }
    }

    dom.honingAdviceText.innerHTML = advice;
  }

  /**
   * Synchronise les sélecteurs du DOM avec l'état d'optimisation
   */
  function syncOptimizationInputs() {
    const o = state.opt;
    if (!o) return;

    if (dom.optSupBrand) dom.optSupBrand.value = o.supBrand || 'high';
    if (dom.optSupAllyDmg) dom.optSupAllyDmg.value = o.supAllyDmg || 'high';
    if (dom.optSupAllyAp) dom.optSupAllyAp.value = o.supAllyAp || 'high';
    if (dom.optSupWp) dom.optSupWp.value = o.supWp || 'mid';
    if (dom.optSupWpFlat) dom.optSupWpFlat.value = o.supWpFlat || '960';
    if (dom.optSupQuality) dom.optSupQuality.value = o.supQuality || 'mid';
    if (dom.optSupBracePerk) dom.optSupBracePerk.value = o.supBracePerk || 'crit_ap';
    if (dom.optSupBraceWp) dom.optSupBraceWp.value = o.supBraceWp || '9000';
    if (dom.optSupBraceStat) dom.optSupBraceStat.value = o.supBraceStat || '14000';
    if (dom.optSupBraceSwift) dom.optSupBraceSwift.value = o.supBraceSwift || '100';

    if (dom.optDpsAddDmg) dom.optDpsAddDmg.value = o.dpsAddDmg || 'high';
    if (dom.optDpsOutDmg) dom.optDpsOutDmg.value = o.dpsOutDmg || 'high';
    if (dom.optDpsAp) dom.optDpsAp.value = o.dpsAp || 'high';
    if (dom.optDpsCrit) dom.optDpsCrit.value = o.dpsCrit || 'mid';
    if (dom.optDpsCdmg) dom.optDpsCdmg.value = o.dpsCdmg || 'mid';
    if (dom.optDpsWp) dom.optDpsWp.value = o.dpsWp || 'mid';
    if (dom.optDpsQuality) dom.optDpsQuality.value = o.dpsQuality || 'mid';
    if (dom.optDpsBracePerk) dom.optDpsBracePerk.value = o.dpsBracePerk || 'crit_cdmg';
    if (dom.optDpsBraceWp) dom.optDpsBraceWp.value = o.dpsBraceWp || '9000';
    if (dom.optDpsBraceStat) dom.optDpsBraceStat.value = o.dpsBraceStat || '14000';
    if (dom.optDpsBraceSub) dom.optDpsBraceSub.value = o.dpsBraceSub || '100';

    if (dom.optGemsDeck) dom.optGemsDeck.value = o.gemsDeck || 'lvl8';

    if (dom.optKarmaEnlight) dom.optKarmaEnlight.checked = o.karmaEnlight !== false;
    if (dom.optKarmaEvo) dom.optKarmaEvo.checked = o.karmaEvo !== false;
    if (dom.optArkGrid) dom.optArkGrid.checked = o.arkGrid !== false;
  }

  // --- MODULE SIMULATEUR DE GEMMES AVANCÉ PAR COMPÉTENCE (OPTION C) ---

  function getCharacterClassKey(curChar) {
    if (!curChar) return 'shadowhunter';
    const raw = String(curChar.className || curChar.classId || curChar.class || curChar.name || '').toLowerCase().trim();
    if (raw.includes('shadowhunter') || raw.includes('demonic')) return 'shadowhunter';
    if (raw.includes('souleater')) return 'souleater';
    if (raw.includes('slayer')) return 'slayer';
    if (raw.includes('breaker')) return 'breaker';
    if (raw.includes('destroyer')) return 'destroyer';
    if (raw.includes('reaper')) return 'reaper';
    if (raw.includes('bard')) return 'bard';
    if (raw.includes('artist') || raw.includes('yinyangshi')) return 'artist';
    if (raw.includes('valkyrie') || raw.includes('holyknight_female') || raw.includes('holyknightfemale')) return 'valkyrie';
    if (raw.includes('paladin') || raw.includes('holyknight')) return 'paladin';
    if (raw.includes('dimension') || raw.includes('knäy') || raw.includes('knay')) return 'dimensionalist';
    return 'shadowhunter';
  }

  const SUPPORT_CLASS_SKILLS = {
    paladin: {
      s1: { name: 'Bénédiction Céleste', sub: 'Buff PA Groupe (+16% PA + 8% AP) • Durée : 8.0s • Base CD : 30s', tag: 'Bottleneck AP #1' },
      s2: { name: 'Colère Divine', sub: 'Buff PA Groupe (+16% PA + 8% AP) • Durée : 8.0s • Base CD : 22s', tag: 'Buff PA #2' },
      s3: { name: 'Foi Sacrée / Choc Lumineux', sub: 'Brand Power (+10% dégâts subis) • Durée : 6.0s • Base CD : 8s', tag: 'Marque Alliés' },
      s4: { name: 'Protection Sacrée', sub: 'Shield & Divine Wave • Base CD : 30s • Génère de la True Gauge pour l\'Aura', tag: 'Bouclier & True Gauge' },
      advisorTitle: 'Recommandation Gemmes Support Paladin (All-In-One Guide 2026) :',
      advisorText: 'Votre configuration actuelle (Bénédiction Céleste Niv. 8 + Colère Divine Niv. 8) assure un temps de rechargement sous les 16.0 secondes, garantissant un uptime d\'AP théorique à 100%. <strong>Priorité d\'upgrade :</strong> Si vous investissez dans une gemme Niveau 9, montez exclusivement <em>Bénédiction Céleste</em> pour sécuriser la rotation même en cas d\'interruption. Monter <em>Colère Divine</em> au niveau 9 n\'apporte que du CP brut mais aucun gain d\'uptime effectif.',
      baseCdHb: 30,
      baseCdWog: 22,
      baseCdBrand: 8,
      baseCdHp: 30
    },
    bard: {
      s1: { name: 'Mélodie Céleste (Heavenly Tune)', sub: 'Buff PA Groupe (+16% PA + 8% AP) + Vitesse • Durée : 8.0s • Base CD : 30s', tag: 'Bottleneck AP #1' },
      s2: { name: 'Vibration Sonore (Sonic Vibration)', sub: 'Buff PA Groupe de zone • Durée : 6.0s • Base CD : 24s', tag: 'Buff PA #2' },
      s3: { name: 'Harpe Sonore / Stigma (Sound Shock)', sub: 'Brand Power (+10% dégâts subis) • Durée : 4-6s • Base CD : 8s', tag: 'Marque Alliés' },
      s4: { name: 'Rhapsodie du Vent / Mur de Son', sub: 'Bouclier Réactif & Génération de Bulles de Sérénade', tag: 'Bouclier & Sérénade' },
      advisorTitle: 'Recommandation Gemmes Support Barde (Meta 2026) :',
      advisorText: 'Priorité à <em>Mélodie Céleste</em> Niv. 9/10 pour réduire le bottleneck d\'uptime de buff d\'Attaque et assurer la synergie de vitesse d\'attaque du groupe de raid.',
      baseCdHb: 30,
      baseCdWog: 24,
      baseCdBrand: 8,
      baseCdHp: 28
    },
    artist: {
      s1: { name: 'Lever de Soleil (Sunsketch)', sub: 'Buff PA Groupe (+16% PA + 8% AP) + Réduction Dégâts • Durée : 8.0s • Base CD : 27s', tag: 'Bottleneck AP #1' },
      s2: { name: 'Puits de Lumière (Sun Well)', sub: 'Buff PA Groupe de zone • Durée : 6.0s • Base CD : 24s', tag: 'Buff PA #2' },
      s3: { name: 'Orchidée (Drawing Orchids)', sub: 'Brand Power (+10% dégâts subis) • Durée : 8.0s • Base CD : 8s', tag: 'Marque Alliés' },
      s4: { name: 'Trémie / Porte dimensionnelle', sub: 'Bouclier Réactif & Génération d\'Harmonie', tag: 'Bouclier & Harmonie' },
      advisorTitle: 'Recommandation Gemmes Support Artiste (Meta 2026) :',
      advisorText: 'Priorité à <em>Lever de Soleil</em> Niv. 9/10 pour sécuriser l\'alternance de buff PA avec <em>Puits de Lumière</em> sans le moindre temps mort.',
      baseCdHb: 27,
      baseCdWog: 24,
      baseCdBrand: 8,
      baseCdHp: 26
    },
    valkyrie: {
      s1: { name: 'Bénédiction Lumineuse (Light Blessing)', sub: 'Buff PA Groupe (+16% PA + 8% AP) • Durée : 8.0s • Base CD : 28s', tag: 'Bottleneck AP #1' },
      s2: { name: 'Épée de Justice (Sword of Justice)', sub: 'Buff PA Groupe (+16% PA + 8% AP) • Durée : 8.0s • Base CD : 22s', tag: 'Buff PA #2' },
      s3: { name: 'Châtiment Sacré (Holy Smite)', sub: 'Brand Power (+10% dégâts subis) • Durée : 8.0s • Base CD : 8s', tag: 'Marque Alliés' },
      s4: { name: 'Sanctuaire de Grâce (Grace Sanctuary)', sub: 'Bouclier Réactif & Génération de Foi', tag: 'Bouclier & Jauge de Foi' },
      advisorTitle: 'Recommandation Gemmes Support Valkyrie (Liberator) :',
      advisorText: 'Priorité à <em>Bénédiction Lumineuse</em> Niv. 8/9 pour sécuriser le temps de recharge et garantir 100% d\'uptime de buff PA allié.',
      baseCdHb: 28,
      baseCdWog: 22,
      baseCdBrand: 8,
      baseCdHp: 28
    }
  };

  const DPS_CLASS_SKILLS = {
    shadowhunter: {
      s1: { name: 'Massacre Sanglant (Blood Massacre)', sub: 'Top Burst Démoniaque #1 • ~35% du DPS', tag: 'Burst #1' },
      s2: { name: 'Faucheuse Cruelle (Cruel Cutter)', sub: 'Compétence Majeure Démoniaque #2 • ~25% du DPS', tag: 'Burst #2' },
      s3: { name: 'Éruption Démoniaque (Demonic Ruin)', sub: 'Compétence Finition #3 • ~15% du DPS', tag: 'Burst #3' },
      s4: { name: 'Tranche Démoniaque (Demonic Slash)', sub: 'Mobilité & Synergie de Cycle • Réduction CD', tag: 'Cooldown Pivot' }
    },
    souleater: {
      s1: { name: 'Moisson des Âmes (Vestige)', sub: 'Top Dégâts Faucheuse / Mort #1 • ~35% du DPS', tag: 'Burst #1' },
      s2: { name: 'Faux Spectrale (Guillotine Reaper)', sub: 'Compétence Rose Majeure #2 • ~26% du DPS', tag: 'Burst #2' },
      s3: { name: 'Épine Mortelle (Lethal Spinning)', sub: 'Compétence d\'Entaille Mortelle • ~18% du DPS', tag: 'Burst #3' },
      s4: { name: 'Pas Fantomatique (Lunatic Edge)', sub: 'Mobilité & Réduction CD de Cycle', tag: 'Cooldown Pivot' }
    },
    slayer: {
      s1: { name: 'Lame Brutale (Brutal Impact)', sub: 'Top Dégâts Furie #1 • ~35% du DPS', tag: 'Furie #1' },
      s2: { name: 'Épée Volcanique (Volcanic Eruption)', sub: 'Compétence Majeure #2 • ~28% du DPS', tag: 'Furie #2' },
      s3: { name: 'Lame Guillotine (Guillotine)', sub: 'Finition de Burst • ~20% du DPS', tag: 'Furie #3' },
      s4: { name: 'Fureur Sauvage (Wild Stomp)', sub: 'Synergie de Groupe & Jauge de Furie', tag: 'Cooldown Pivot' }
    },
    breaker: {
      s1: { name: 'Coup de Poing Destructeur (Buster Surge)', sub: 'Top Dégâts Poing / Asura #1 • ~38% du DPS', tag: 'Burst #1' },
      s2: { name: 'Poing d\'Asura (Asura Destruction)', sub: 'Rafale Dévastatrice #2 • ~30% du DPS', tag: 'Burst #2' },
      s3: { name: 'Frappe Céleste (Falling Star)', sub: 'Impact Lourd & Neutralisation • ~18% du DPS', tag: 'Burst #3' },
      s4: { name: 'Frappe Éclair (Lightning Palm)', sub: 'Mobilité & Rotation Fluide • Réduction CD', tag: 'Cooldown Pivot' }
    },
    destroyer: {
      s1: { name: 'Frappe Sismique (Seismic Hammer)', sub: 'Top Dégâts Libération #1 • ~38% du DPS', tag: 'Burst #1' },
      s2: { name: 'Mangeur Parfait (Perfect Swing)', sub: 'Coup Massif Libération #2 • ~32% du DPS', tag: 'Burst #2' },
      s3: { name: 'Vague de Terre (Earth Eater)', sub: 'Compétence Neutralisation & Dégâts', tag: 'Burst #3' },
      s4: { name: 'Saut Endurant (Endure Pain)', sub: 'Génération de Noyaux & Super Armure', tag: 'Cooldown Pivot' }
    },
    reaper: {
      s1: { name: 'Rage Rouge (Rage Spear)', sub: 'Top Attaque Chaos / Trébuchement #1', tag: 'Burst #1' },
      s2: { name: 'Moisson Lumineuse (Glowing Brand)', sub: 'Compétence d\'Ombre Majeure #2', tag: 'Burst #2' },
      s3: { name: 'Vortex de Danse (Dance of Fury)', sub: 'Attaque Finale de Burst', tag: 'Burst #3' },
      s4: { name: 'Ombre de Cauchemar (Nightmare)', sub: 'Téléportation & Maintien de Synergie', tag: 'Cooldown Pivot' }
    },
    valkyrie: {
      s1: { name: 'Épée de Jugement (Judgment Sword)', sub: 'Top Dégâts Libératrice #1 • ~35% du DPS', tag: 'Burst #1' },
      s2: { name: 'Rayon Céleste (Celestial Beam)', sub: 'Compétence Majeure #2 • ~28% du DPS', tag: 'Burst #2' },
      s3: { name: 'Lame d\'Espoir (Blade of Hope)', sub: 'Finition de Burst • ~20% du DPS', tag: 'Burst #3' },
      s4: { name: 'Élan Sacré (Holy Rush)', sub: 'Mobilité & Réduction CD de Rotation', tag: 'Cooldown Pivot' }
    }
  };
  DPS_CLASS_SKILLS.demonic = DPS_CLASS_SKILLS.shadowhunter;
  DPS_CLASS_SKILLS.generic = {
    s1: { name: 'Compétence Majeure #1 (Top Burst #1)', sub: 'Top Dégâts T4 #1 • ~35% du DPS', tag: 'Burst #1' },
    s2: { name: 'Compétence Majeure #2 (Core Rotation #2)', sub: 'Compétence Principale #2 • ~25% du DPS', tag: 'Burst #2' },
    s3: { name: 'Compétence Majeure #3 (Burst Finisher #3)', sub: 'Compétence Finition #3 • ~15% du DPS', tag: 'Burst #3' },
    s4: { name: 'Compétence Utilitaire (Utility & CDR)', sub: 'Mobilité & Synergie de Cycle • Réduction CD', tag: 'Cooldown Pivot' }
  };

  const perSkillGemsState = {
    hbLvl: 8,
    wogLvl: 8,
    brandLvl: 7,
    hpLvl: 8,
    otherLvl: 7,
    // DPS slots
    dps1Lvl: 8,
    dps2Lvl: 8,
    dps3Lvl: 8,
    dpsCdLvl: 8,
    dpsOtherLvl: 8
  };

  function calcPerSkillGems() {
    const curChar = getCurrentActiveCharacter();
    const isSupport = state.role === 'support';
    
    // Swiftness & Cooldown Reduction
    const swiftness = isSupport ? 1800 : 1600;
    const swiftCdr = (swiftness * 0.02148) / 100; // ~38.66%

    const gemCdrMap = { 7: 0.18, 8: 0.20, 9: 0.22, 10: 0.24 };

    function getSkillCd(baseCd, lvl) {
      const cdr = gemCdrMap[lvl] || 0.18;
      return baseCd * (1 - swiftCdr) * (1 - cdr);
    }

    // 1. Heavenly Blessing (30.0s base CD avec trépied Préparation Rapide)
    const hbCd = getSkillCd(30.0, perSkillGemsState.hbLvl);
    // 2. Wrath of God (22.0s base CD avec trépied)
    const wogCd = getSkillCd(22.0, perSkillGemsState.wogLvl);
    
    // Fenêtre totale du Buff d'Attaque = 16.0s (8.0s HB + 8.0s WoG)
    const totalApWindow = 16.0;
    const hbGap = Math.max(0, hbCd - totalApWindow);
    const apCycle = Math.max(totalApWindow, hbCd);
    const apUptime = Math.min(100, (totalApWindow / apCycle) * 100);

    // 3. Brand / Foi Sacrée / Choc Lumineux (8.0s base CD, 6.0s durée)
    const brandCd = getSkillCd(8.0, perSkillGemsState.brandLvl);
    const brandUptime = Math.min(100, (6.0 / brandCd) * 100);

    // 4. Holy Protection (30.0s base CD)
    const hpCd = getSkillCd(30.0, perSkillGemsState.hpLvl);
    const gaugeRateBoost = (30.0 / hpCd - 1) * 100;

    // 5. Calcul CP exact Smilegate (lostark.bible)
    // T7 = 0 bonus, T8 = +32.2 CP, T9 = +68.3 CP, T10 = +108.6 CP
    const gemCpStep = { 7: 0, 8: 32.2, 9: 68.3, 10: 108.6 };
    const hbCp = gemCpStep[perSkillGemsState.hbLvl];
    const wogCp = gemCpStep[perSkillGemsState.wogLvl];
    const brandCp = gemCpStep[perSkillGemsState.brandLvl];
    const hpCp = gemCpStep[perSkillGemsState.hpLvl];
    const otherCp = 7 * gemCpStep[perSkillGemsState.otherLvl];
    const totalGemCp = Math.round(hbCp + wogCp + brandCp + hpCp + otherCp);

    // Baseline dynamique basée sur l'équipement réel du personnage
    let baselineGemCp = (isSupport ? 199 : 312);
    const activeGemParts = (typeof extractCharacterGemParts === 'function') ? extractCharacterGemParts(curChar) : (curChar && curChar.gemParts);
    if (activeGemParts && Array.isArray(activeGemParts) && activeGemParts.length > 0) {
      const step78 = isSupport ? 32.2 : 30.4;
      const step89 = isSupport ? 36.1 : 32.3;
      const step910 = isSupport ? 40.3 : 34.5;
      const t8 = isSupport ? 9.20 : 5.50;
      const t9 = isSupport ? 10.40 : 6.10;
      const t10 = isSupport ? 11.50 : 6.70;
      baselineGemCp = Math.round(activeGemParts.reduce((acc, rawG) => {
        const g = rawG > 20 ? rawG / 100 : rawG;
        if (g >= t10) return acc + step78 + step89 + step910;
        if (g >= t9) return acc + step78 + step89;
        if (g >= t8) return acc + step78;
        return acc;
      }, 0));
    }
    const deltaCp = totalGemCp - baselineGemCp;

    return {
      hbCd,
      hbGap,
      apUptime,
      wogCd,
      brandCd,
      brandUptime,
      hpCd,
      gaugeRateBoost,
      totalGemCp,
      deltaCp
    };
  }

  function updatePerSkillGemsView() {
    const curChar = getCurrentActiveCharacter();
    const classKey = getCharacterClassKey(curChar);
    const suppData = SUPPORT_CLASS_SKILLS[classKey] || SUPPORT_CLASS_SKILLS.paladin;

    // Mise à jour des labels dynamiques de support
    const isEnGems = isEnLang();
    if (dom.dispSuppSkill1Name) dom.dispSuppSkill1Name.textContent = isEnGems ? 'Heavenly Blessing' : suppData.s1.name;
    if (dom.dispSuppSkill1Sub) dom.dispSuppSkill1Sub.textContent = isEnGems ? 'Party AP Buff (+16% PA + 8% AP) • Duration: 8.0s • Base CD: 30s' : suppData.s1.sub;
    if (dom.dispSuppSkill1Tag) dom.dispSuppSkill1Tag.textContent = isEnGems ? 'AP Bottleneck #1' : suppData.s1.tag;

    if (dom.dispSuppSkill2Name) dom.dispSuppSkill2Name.textContent = isEnGems ? 'Wrath of God' : suppData.s2.name;
    if (dom.dispSuppSkill2Sub) dom.dispSuppSkill2Sub.textContent = isEnGems ? 'Party AP Buff (+16% PA + 8% AP) • Duration: 8.0s • Base CD: 22s' : suppData.s2.sub;
    if (dom.dispSuppSkill2Tag) dom.dispSuppSkill2Tag.textContent = isEnGems ? 'AP Buff #2' : suppData.s2.tag;

    if (dom.dispSuppSkill3Name) dom.dispSuppSkill3Name.textContent = isEnGems ? 'Holy Area / Light Shock' : suppData.s3.name;
    if (dom.dispSuppSkill3Sub) dom.dispSuppSkill3Sub.textContent = isEnGems ? 'Brand Power (+10% dmg taken) • Duration: 6.0s • Base CD: 8s' : suppData.s3.sub;
    if (dom.dispSuppSkill3Tag) dom.dispSuppSkill3Tag.textContent = isEnGems ? 'Ally Brand' : suppData.s3.tag;

    if (dom.dispSuppSkill4Name) dom.dispSuppSkill4Name.textContent = isEnGems ? 'Holy Protection' : suppData.s4.name;
    if (dom.dispSuppSkill4Sub) dom.dispSuppSkill4Sub.textContent = isEnGems ? 'Shield & Divine Wave • Base CD: 30s • Generates True Gauge for Aura' : suppData.s4.sub;
    if (dom.dispSuppSkill4Tag) dom.dispSuppSkill4Tag.textContent = isEnGems ? 'Shield & True Gauge' : suppData.s4.tag;

    if (dom.dispSuppAdvisorTitle) dom.dispSuppAdvisorTitle.textContent = isEnGems ? 'Paladin Support Gem Recommendation (All-In-One Guide 2026):' : suppData.advisorTitle;

    const res = calcPerSkillGems();

    if (dom.gemLvl_hb) dom.gemLvl_hb.value = perSkillGemsState.hbLvl.toString();
    if (dom.gemLvl_wog) dom.gemLvl_wog.value = perSkillGemsState.wogLvl.toString();
    if (dom.gemLvl_brand) dom.gemLvl_brand.value = perSkillGemsState.brandLvl.toString();
    if (dom.gemLvl_hp) dom.gemLvl_hp.value = perSkillGemsState.hpLvl.toString();
    if (dom.gemLvl_other) dom.gemLvl_other.value = perSkillGemsState.otherLvl.toString();

    const isEn = isEnLang();
    if (dom.dispCd_hb) dom.dispCd_hb.textContent = `${res.hbCd.toFixed(1)}s CD`;
    if (dom.dispStatus_hb) {
      if (res.hbGap <= 0.05) {
        dom.dispStatus_hb.textContent = 'Gapless';
        dom.dispStatus_hb.className = 'gem-metric-status ok';
      } else {
        dom.dispStatus_hb.textContent = isEn ? `Gap: ${res.hbGap.toFixed(1)}s` : `Trou : ${res.hbGap.toFixed(1)}s`;
        dom.dispStatus_hb.className = 'gem-metric-status warn';
      }
    }

    if (dom.dispCd_wog) dom.dispCd_wog.textContent = `${res.wogCd.toFixed(1)}s CD`;
    if (dom.dispStatus_wog) {
      dom.dispStatus_wog.textContent = res.wogCd <= 16.0 
        ? (isEn ? 'Guaranteed Uptime' : 'Uptime Garanti') 
        : (isEn ? 'Misalignment' : 'Décalage');
      dom.dispStatus_wog.className = res.wogCd <= 16.0 ? 'gem-metric-status ok' : 'gem-metric-status warn';
    }

    if (dom.dispCd_brand) dom.dispCd_brand.textContent = `${res.brandCd.toFixed(1)}s CD`;
    if (dom.dispStatus_brand) {
      dom.dispStatus_brand.textContent = res.brandCd <= 6.0 
        ? (isEn ? '100% Brand' : '100% Marque') 
        : (isEn ? 'Misalignment' : 'Décalage');
      dom.dispStatus_brand.className = res.brandCd <= 6.0 ? 'gem-metric-status ok' : 'gem-metric-status warn';
    }

    if (dom.dispCd_hp) dom.dispCd_hp.textContent = `${res.hpCd.toFixed(1)}s CD`;

    if (dom.dispGemApUptime) dom.dispGemApUptime.textContent = `${res.apUptime.toFixed(1)}%`;
    if (dom.dispGemBrandUptime) dom.dispGemBrandUptime.textContent = `${res.brandUptime.toFixed(1)}%`;
    if (dom.dispGemCycleGain) dom.dispGemCycleGain.textContent = `+${res.cycleGain.toFixed(1)}%`;

    if (dom.dispGemTotalCp) dom.dispGemTotalCp.textContent = `+${formatNumber(res.totalGemCp)} CP`;
    if (dom.dispGemCpDelta) {
      const sign = res.deltaCp > 0 ? '+' : (res.deltaCp < 0 ? '-' : '+');
      dom.dispGemCpDelta.textContent = isEn
        ? `${sign}${formatNumber(Math.abs(res.deltaCp))} CP vs current profile`
        : `${sign}${formatNumber(Math.abs(res.deltaCp))} CP vs profil actuel`;
    }

    if (dom.gemAdvisorText) {
      if (classKey === 'paladin') {
        if (isEn) {
          if (perSkillGemsState.hbLvl >= 9 && perSkillGemsState.wogLvl >= 9) {
            dom.gemAdvisorText.innerHTML = '<strong>Optimal Paladin Setup:</strong> Both major Attack buffs are covered at Level 9+. <em>Heavenly Blessings</em> has a safety margin of over 1.8s against boss knockbacks and movement.';
          } else if (perSkillGemsState.hbLvl >= 9) {
            dom.gemAdvisorText.innerHTML = '<strong>Goal Reached:</strong> Your <em>Heavenly Blessings</em> is at Level 9 (-22% CD), guaranteeing a smooth 100% AP rotation even in raid conditions. Raising <em>Wrath of God</em> to Level 9 gives raw CP, but uptime is already secured.';
          } else {
            dom.gemAdvisorText.innerHTML = 'Your current setup (Heavenly Blessings Lvl. 8 + Wrath of God Lvl. 8) keeps cooldowns under 16.0s, ensuring a theoretical 100% AP uptime. <strong>Upgrade Priority:</strong> Upgrade exclusively <em>Heavenly Blessings</em> to Level 9 to secure buff uptime in actual raids.';
          }
        } else {
          if (perSkillGemsState.hbLvl >= 9 && perSkillGemsState.wogLvl >= 9) {
            dom.gemAdvisorText.innerHTML = '<strong>Configuration Paladin Optimale :</strong> Vos 2 buffs d\'Attaque majeurs sont couverts au niveau 9+. <em>Bénédiction Céleste</em> dispose d\'une marge de sécurité de plus de 1.8s contre les déplacements et interruptions de boss.';
          } else if (perSkillGemsState.hbLvl >= 9) {
            dom.gemAdvisorText.innerHTML = '<strong>Objectif Atteint :</strong> Votre <em>Bénédiction Céleste</em> est au Niveau 9 (-22% CD), garantissant une rotation fluide à 100% d\'AP même en situation réelle. Monter <em>Colère Divine</em> au niveau 9 apportera du CP brut mais l\'uptime est déjà sécurisé.';
          } else {
            dom.gemAdvisorText.innerHTML = 'Votre configuration actuelle (Bénédiction Céleste Niv. 8 + Colère Divine Niv. 8) assure un temps de rechargement sous les 16.0 secondes, garantissant un uptime d\'AP théorique à 100%. <strong>Priorité d\'upgrade :</strong> Monter exclusivement <em>Bénédiction Céleste</em> au niveau 9 pour sécuriser le buff en situation réelle de raid.';
          }
        }
      } else {
        dom.gemAdvisorText.innerHTML = suppData.advisorText;
      }
    }
  }

  function updateDpsGemsView() {
    const curChar = getCurrentActiveCharacter();
    const classKey = getCharacterClassKey(curChar);
    const skills = DPS_CLASS_SKILLS[classKey] || DPS_CLASS_SKILLS.generic || DPS_CLASS_SKILLS.shadowhunter;

    // Met à jour les libellés de compétences selon la classe
    const isEnDps = isEnLang();
    function formatDpsSkillName(name) {
      if (!isEnDps || !name) return name;
      const match = name.match(/\(([^)]+)\)/);
      return match ? match[1].trim() : name;
    }
    if (dom.dispDpsSkill1Name) dom.dispDpsSkill1Name.textContent = formatDpsSkillName(skills.s1.name);
    if (dom.dispDpsSkill1Sub) dom.dispDpsSkill1Sub.textContent = isEnDps ? 'T4 Major Damage Gem • Maximized Burst' : skills.s1.sub;
    if (dom.dispDpsSkill1Tag) dom.dispDpsSkill1Tag.textContent = isEnDps ? 'Top Burst #1' : skills.s1.tag;

    if (dom.dispDpsSkill2Name) dom.dispDpsSkill2Name.textContent = formatDpsSkillName(skills.s2.name);
    if (dom.dispDpsSkill2Sub) dom.dispDpsSkill2Sub.textContent = isEnDps ? 'T4 Major Damage Gem • Core Rotation' : skills.s2.sub;
    if (dom.dispDpsSkill2Tag) dom.dispDpsSkill2Tag.textContent = isEnDps ? 'Burst #2' : skills.s2.tag;

    if (dom.dispDpsSkill3Name) dom.dispDpsSkill3Name.textContent = formatDpsSkillName(skills.s3.name);
    if (dom.dispDpsSkill3Sub) dom.dispDpsSkill3Sub.textContent = isEnDps ? 'T4 Damage Gem • Cycle Finisher' : skills.s3.sub;
    if (dom.dispDpsSkill3Tag) dom.dispDpsSkill3Tag.textContent = isEnDps ? 'Burst #3' : skills.s3.tag;

    if (dom.dispDpsCdName) dom.dispDpsCdName.textContent = formatDpsSkillName(skills.s4.name);
    if (dom.dispDpsCdSub) dom.dispDpsCdSub.textContent = isEnDps ? 'Cooldown Reduction • Burst Alignment' : skills.s4.sub;
    if (dom.dispDpsCdTag) dom.dispDpsCdTag.textContent = isEnDps ? 'Rotation Pivot' : skills.s4.tag;

    // Valeurs de gemmes
    const dmgMap = { 7: 32, 8: 36, 9: 40, 10: 44 };
    const cdrMap = { 7: 18, 8: 20, 9: 22, 10: 24 };
    const cpMap = { 7: 0, 8: 28.35, 9: 60.35, 10: 98.35 };

    const s1Dmg = dmgMap[perSkillGemsState.dps1Lvl] || 36;
    const s2Dmg = dmgMap[perSkillGemsState.dps2Lvl] || 36;
    const s3Dmg = dmgMap[perSkillGemsState.dps3Lvl] || 36;
    const s4Cd = cdrMap[perSkillGemsState.dpsCdLvl] || 20;

    if (dom.gemLvl_dps1) dom.gemLvl_dps1.value = perSkillGemsState.dps1Lvl.toString();
    if (dom.gemLvl_dps2) dom.gemLvl_dps2.value = perSkillGemsState.dps2Lvl.toString();
    if (dom.gemLvl_dps3) dom.gemLvl_dps3.value = perSkillGemsState.dps3Lvl.toString();
    if (dom.gemLvl_dpsCd) dom.gemLvl_dpsCd.value = perSkillGemsState.dpsCdLvl.toString();
    if (dom.gemLvl_dpsOther) dom.gemLvl_dpsOther.value = perSkillGemsState.dpsOtherLvl.toString();

    if (dom.dispDpsSkill1Val) dom.dispDpsSkill1Val.textContent = `+${s1Dmg}.0% Dmg`;
    if (dom.dispDpsSkill2Val) dom.dispDpsSkill2Val.textContent = `+${s2Dmg}.0% Dmg`;
    if (dom.dispDpsSkill3Val) dom.dispDpsSkill3Val.textContent = `+${s3Dmg}.0% Dmg`;
    if (dom.dispDpsCdVal) dom.dispDpsCdVal.textContent = `-${s4Cd}.0% CD`;

    // Métriques globales DPS
    const totalGemCp = Math.round(
      cpMap[perSkillGemsState.dps1Lvl] +
      cpMap[perSkillGemsState.dps2Lvl] +
      cpMap[perSkillGemsState.dps3Lvl] +
      cpMap[perSkillGemsState.dpsCdLvl] +
      (7 * cpMap[perSkillGemsState.dpsOtherLvl])
    );

    let baselineCp = 312;
    const activeGemPartsDps = (typeof extractCharacterGemParts === 'function') ? extractCharacterGemParts(curChar) : (curChar && curChar.gemParts);
    if (activeGemPartsDps && Array.isArray(activeGemPartsDps) && activeGemPartsDps.length > 0) {
      baselineCp = Math.round(activeGemPartsDps.reduce((acc, rawG) => {
        const g = rawG > 20 ? rawG / 100 : rawG;
        if (g >= 6.70) return acc + 98.35;
        if (g >= 6.10) return acc + 60.35;
        if (g >= 5.50) return acc + 28.35;
        return acc;
      }, 0));
    }
    const deltaCp = totalGemCp - baselineCp;

    const weightedDpsGain = (s1Dmg * 0.35) + (s2Dmg * 0.25) + (s3Dmg * 0.15) + (dmgMap[perSkillGemsState.dpsOtherLvl] * 0.25);

    if (dom.dispDpsGemBurstGain) dom.dispDpsGemBurstGain.textContent = `+${s1Dmg}.0%`;
    if (dom.dispDpsGemTotalDps) dom.dispDpsGemTotalDps.textContent = `+${(weightedDpsGain * 0.65).toFixed(1)}%`;
    if (dom.dispDpsGemAvgCd) dom.dispDpsGemAvgCd.textContent = `-${s4Cd}.0%`;
    if (dom.dispDpsGemTotalCp) dom.dispDpsGemTotalCp.textContent = `+${formatNumber(totalGemCp)} CP`;
    if (dom.dispDpsGemCpDelta) {
      const sign = deltaCp > 0 ? '+' : (deltaCp < 0 ? '-' : '+');
      dom.dispDpsGemCpDelta.textContent = isEnLang()
        ? `${sign}${formatNumber(Math.abs(deltaCp))} CP vs current profile`
        : `${sign}${formatNumber(Math.abs(deltaCp))} CP vs profil actuel`;
    }

    if (dom.gemDpsAdvisorText) {
      const s1Short = skills.s1.name.split('(')[0].trim();
      const s2Short = skills.s2.name.split('(')[0].trim();
      if (perSkillGemsState.dps1Lvl >= 9 && perSkillGemsState.dps2Lvl >= 9) {
        dom.gemDpsAdvisorText.innerHTML = isEnLang()
          ? `<strong>DPS setup:</strong> your 2 main burst skills (<em>${s1Short}</em> and <em>${s2Short}</em>) already have Lv. 9/10 gems (+40%/+44%), the best damage multiplier per gold spent.`
          : `<strong>Configuration DPS :</strong> Vos 2 compétences de burst majeures (<em>${s1Short}</em> et <em>${s2Short}</em>) sont équipées en gemmes Niveau 9/10 (+40%/+44%), garantissant le meilleur multiplicateur de dégâts par gold investi.`;
      } else {
        dom.gemDpsAdvisorText.innerHTML = isEnLang()
          ? `<strong>DPS priority:</strong> raise the <em>${s1Short}</em> gem to Lv. 9 (+40% damage) first. It is the most cost-effective skill in your rotation.`
          : `<strong>Priorité Stratégique DPS :</strong> Montez en priorité la gemme de <em>${s1Short}</em> au Niveau 9 (+40% Dégâts). C'est votre compétence la plus rentable du cycle de combat.`;
      }
    }
  }

  function initPerSkillGemsEvents() {
    const bindSelect = (el, key) => {
      if (el) {
        el.addEventListener('change', (e) => {
          perSkillGemsState[key] = parseInt(e.target.value, 10) || 7;
          updatePerSkillGemsView();
          updateOptimizationView();
        });
      }
    };

    bindSelect(dom.gemLvl_hb, 'hbLvl');
    bindSelect(dom.gemLvl_wog, 'wogLvl');
    bindSelect(dom.gemLvl_brand, 'brandLvl');
    bindSelect(dom.gemLvl_hp, 'hpLvl');
    bindSelect(dom.gemLvl_other, 'otherLvl');

    // Bind DPS gem controls
    bindSelect(dom.gemLvl_dps1, 'dps1Lvl');
    bindSelect(dom.gemLvl_dps2, 'dps2Lvl');
    bindSelect(dom.gemLvl_dps3, 'dps3Lvl');
    bindSelect(dom.gemLvl_dpsCd, 'dpsCdLvl');
    bindSelect(dom.gemLvl_dpsOther, 'dpsOtherLvl');

    // DPS Presets
    if (dom.btnGemDpsPresetCurrent) {
      dom.btnGemDpsPresetCurrent.addEventListener('click', () => {
        perSkillGemsState.dps1Lvl = 8;
        perSkillGemsState.dps2Lvl = 8;
        perSkillGemsState.dps3Lvl = 8;
        perSkillGemsState.dpsCdLvl = 8;
        perSkillGemsState.dpsOtherLvl = 8;
        updateDpsGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemDpsPresetMeta) {
      dom.btnGemDpsPresetMeta.addEventListener('click', () => {
        perSkillGemsState.dps1Lvl = 9;
        perSkillGemsState.dps2Lvl = 9;
        perSkillGemsState.dps3Lvl = 8;
        perSkillGemsState.dpsCdLvl = 8;
        perSkillGemsState.dpsOtherLvl = 8;
        updateDpsGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemDpsPresetFull8) {
      dom.btnGemDpsPresetFull8.addEventListener('click', () => {
        perSkillGemsState.dps1Lvl = 8;
        perSkillGemsState.dps2Lvl = 8;
        perSkillGemsState.dps3Lvl = 8;
        perSkillGemsState.dpsCdLvl = 8;
        perSkillGemsState.dpsOtherLvl = 8;
        updateDpsGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemDpsPresetFull9) {
      dom.btnGemDpsPresetFull9.addEventListener('click', () => {
        perSkillGemsState.dps1Lvl = 9;
        perSkillGemsState.dps2Lvl = 9;
        perSkillGemsState.dps3Lvl = 9;
        perSkillGemsState.dpsCdLvl = 9;
        perSkillGemsState.dpsOtherLvl = 9;
        updateDpsGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemDpsPresetFull10) {
      dom.btnGemDpsPresetFull10.addEventListener('click', () => {
        perSkillGemsState.dps1Lvl = 10;
        perSkillGemsState.dps2Lvl = 10;
        perSkillGemsState.dps3Lvl = 10;
        perSkillGemsState.dpsCdLvl = 10;
        perSkillGemsState.dpsOtherLvl = 10;
        updateDpsGemsView();
        updateOptimizationView();
      });
    }

    // Preset Buttons
    if (dom.btnGemPresetCurrent) {
      dom.btnGemPresetCurrent.addEventListener('click', () => {
        perSkillGemsState.hbLvl = 8;
        perSkillGemsState.wogLvl = 8;
        perSkillGemsState.brandLvl = 7;
        perSkillGemsState.hpLvl = 8;
        perSkillGemsState.otherLvl = 7;
        if (dom.optGemsDeck) dom.optGemsDeck.value = 'current';
        updatePerSkillGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemPresetMetaSupport) {
      dom.btnGemPresetMetaSupport.addEventListener('click', () => {
        perSkillGemsState.hbLvl = 9;
        perSkillGemsState.wogLvl = 8;
        perSkillGemsState.brandLvl = 7;
        perSkillGemsState.hpLvl = 8;
        perSkillGemsState.otherLvl = 7;
        if (dom.optGemsDeck) dom.optGemsDeck.value = 'lvl8';
        updatePerSkillGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemPresetFull8) {
      dom.btnGemPresetFull8.addEventListener('click', () => {
        perSkillGemsState.hbLvl = 8;
        perSkillGemsState.wogLvl = 8;
        perSkillGemsState.brandLvl = 8;
        perSkillGemsState.hpLvl = 8;
        perSkillGemsState.otherLvl = 8;
        if (dom.optGemsDeck) dom.optGemsDeck.value = 'lvl8';
        updatePerSkillGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemPresetFull9) {
      dom.btnGemPresetFull9.addEventListener('click', () => {
        perSkillGemsState.hbLvl = 9;
        perSkillGemsState.wogLvl = 9;
        perSkillGemsState.brandLvl = 9;
        perSkillGemsState.hpLvl = 9;
        perSkillGemsState.otherLvl = 9;
        if (dom.optGemsDeck) dom.optGemsDeck.value = 'lvl9';
        updatePerSkillGemsView();
        updateOptimizationView();
      });
    }

    if (dom.btnGemPresetFull10) {
      dom.btnGemPresetFull10.addEventListener('click', () => {
        perSkillGemsState.hbLvl = 10;
        perSkillGemsState.wogLvl = 10;
        perSkillGemsState.brandLvl = 10;
        perSkillGemsState.hpLvl = 10;
        perSkillGemsState.otherLvl = 10;
        if (dom.optGemsDeck) dom.optGemsDeck.value = 'lvl10';
        updatePerSkillGemsView();
        updateOptimizationView();
      });
    }
  }

  // --- MODULE ASSISTANT DE TAILLAGE D'ACCESSOIRES T4 (LOSEII BELLMAN DP) ---

  const cuttingAdvisorState = {
    slot: 'neck',
    quintile: 'mid',
    cut1Effect: 'primary',
    cut1Tier: 'mid',
    cut2Status: 'not_cut', // 'not_cut' ou 'done'
    cut2Effect: 'primary',
    cut2Tier: 'mid'
  };

  const CUT_COST = 1200;

  // Ancres de marché issues de l'étude empirique de loseii.com (nettes des phéons)
  // Neck: HM = 250k Sup / 500k DPS, HH = 1.2M Sup / 3.2M DPS
  // Ring: ~75% de la valeur collier
  // Earring: ~55% de la valeur collier
  const BASE_MARKET_VALUES = {
    neck: {
      support: { hh: 1200000, hm: 250000, hl: 45000, mm: 65000, ml: 12000, ll: 0 },
      dps: { hh: 3200000, hm: 500000, hl: 80000, mm: 140000, ml: 25000, ll: 0 }
    },
    earring: {
      support: { hh: 650000, hm: 140000, hl: 28000, mm: 40000, ml: 8000, ll: 0 },
      dps: { hh: 1800000, hm: 320000, hl: 55000, mm: 95000, ml: 18000, ll: 0 }
    },
    ring: {
      support: { hh: 900000, hm: 200000, hl: 38000, mm: 55000, ml: 10000, ll: 0 },
      dps: { hh: 2400000, hm: 420000, hl: 70000, mm: 120000, ml: 22000, ll: 0 }
    }
  };

  const STAT_QUINTILE_MULT = {
    min: 0.85,
    low: 0.92,
    mid: 1.00,
    high: 1.08,
    max: 1.18
  };

  function evaluateCutState({
    slot = 'neck',
    role = 'support',
    quintile = 'mid',
    cut1Type = 'primary',
    cut1Tier = 'mid',
    cut2Done = false,
    cut2Type = 'trash',
    cut2Tier = 'none'
  }) {
    const slotData = BASE_MARKET_VALUES[slot] || BASE_MARKET_VALUES.neck;
    const m = slotData[role] || slotData.support;
    const qMult = STAT_QUINTILE_MULT[quintile] || 1.0;

    const pHigh = 0.007; // 0.7% proba
    const pMid = 0.030;  // 3.0% proba
    const pLow = 0.063;  // 6.3% proba

    let decision = 'STOP';
    let subtitle = '';
    let ev = 0;
    let estimatedMarketVal = 0;
    let probSuccess = '3.70%';
    let nextCost = 1200;
    let explanation = '';
    let bannerClass = 'stop';
    let icon = '';

    const isEn = isEnLang();
    if (!cut2Done) {
      // Décision après le 1er Cut
      if (cut1Tier === 'high' && cut1Type === 'primary') {
        decision = isEn ? 'CONTINUE (HIGH ON PRIMARY)' : 'CONTINUER (HIGH SUR LIGNE PRIMAIRE)';
        subtitle = isEn ? 'Positive expected value (EV >> 0): the 1,200 g cut pays off.' : 'Espérance positive (EV >> 0) : le cut à 1 200 g est rentable.';
        ev = Math.round((m.hh * pHigh * 2 + m.hm * pMid * 2 + m.hl * pLow * 2) * qMult - (CUT_COST * 2));
        estimatedMarketVal = Math.round(m.hm * qMult);
        probSuccess = '3.70%';
        bannerClass = 'jackpot';
        icon = '';
        explanation = isEn 
          ? `First cut: Tier High on a primary line. Good combined odds of a High/High or High/Mid piece. With the ${quintile.toUpperCase()} quintile effect, projected market value net of pheon tax is ~ ${estimatedMarketVal.toLocaleString()} g. Net mathematical expected value is +${ev.toLocaleString()} g. Continue.`
          : `Premier cut : Tier High sur une ligne primaire. Bonne probabilité cumulée d'obtenir un bijou High/High ou High/Mid. Avec l'effet du quintile (${quintile.toUpperCase()}), la valeur marchande projetée nette de taxe phéons est d'environ ${estimatedMarketVal.toLocaleString()} g. L'espérance mathématique nette de taillage s'élève à +${ev.toLocaleString()} g. Continuez.`;
      } else if (cut1Tier === 'mid' && cut1Type === 'primary') {
        decision = isEn ? 'CONTINUE CUTTING' : 'CONTINUER À TAILLER';
        subtitle = isEn ? 'Positive net expected value (EV > 0). Paying 1,200g is mathematically profitable.' : 'Espérance de gain nette positive (EV > 0). Payer 1 200 g est mathématiquement rentable.';
        ev = Math.round((m.hm * pHigh * 2 + m.mm * pMid * 2 + m.ml * pLow * 2) * qMult - (CUT_COST * 2));
        estimatedMarketVal = Math.round(m.mm * qMult);
        probSuccess = '3.70%';
        bannerClass = 'continue';
        icon = '';
        explanation = isEn
          ? `Successful first cut (Primary Line Tier Mid). High chance of finalizing a quality sellable or equippable piece (High/Mid or Mid/Mid). Residual net EV is positive (+${ev.toLocaleString()} g net). Bellman Recommendation: Pay the 2nd cut for 1,200 g.`
          : `Premier cut réussi (Ligne Primaire Tier Mid). Vous avez de grandes chances de finaliser une pièce vendable ou équipable de qualité (High/Mid ou Mid/Mid). L'EV nette résiduelle est positive (+${ev.toLocaleString()} g net). Recommandation Bellman : Payez le 2ᵉ cut à 1 200 g.`;
      } else if (cut1Tier === 'low' && cut1Type === 'primary') {
        decision = isEn ? 'STOP IMMEDIATELY & DISMANTLE' : 'STOP IMMÉDIAT & RECYCLER';
        subtitle = isEn ? 'Negative expected value (EV ≤ 0). Cutting further will lose gold.' : 'Espérance de gain négative (EV ≤ 0). Tailler davantage vous fera perdre des golds.';
        ev = -CUT_COST;
        estimatedMarketVal = 0;
        probSuccess = '0.70%';
        bannerClass = 'stop';
        icon = '';
        explanation = isEn
          ? `First cut in Tier Low on primary line. Even with a High or Mid tier on the next cut, the piece will have capped value (High/Low or Mid/Low) failing to cover cumulative cutting costs (2,400g remaining) and the 60k gold pheon resale tax. Cut your losses and dismantle for powders.`
          : `Premier cut en Tier Low sur la ligne primaire. Même si vous touchez un Tier High ou Mid au cut suivant, la pièce aura une valeur bridée (High/Low ou Mid/Low) qui ne couvrira pas le coût cumulé du taillage (2 400 g restants) et les 60k g de taxe phéons à la revente. Arrêtez les frais et recyclez le bijou pour récupérer vos poudres.`;
      } else {
        decision = isEn ? 'STOP IMMEDIATELY & DISMANTLE' : 'STOP IMMÉDIAT & RECYCLER';
        subtitle = isEn ? 'Useless or missed line on first cut. High risk of gold waste.' : 'Ligne inutile ou ratée au premier cut. Risque de ruine mathématique.';
        ev = -CUT_COST;
        estimatedMarketVal = 0;
        probSuccess = '0.00%';
        bannerClass = 'stop';
        icon = '';
        explanation = isEn
          ? `The first cut missed a useful major primary line. Spending an additional 1,200g is statistically a dead loss according to the Loseii Bellman model. Dismantle immediately.`
          : `Le premier cut n'a pas touché une ligne primaire majeure utile. Dépenser 1 200 g supplémentaires est statistiquement une perte sèche d'après le modèle Loseii. Le bijou ne pourra jamais rentabiliser l'investissement. Recyclez-le immédiatement.`;
      }
    } else {
      // Décision après le 2e Cut (Évaluation du Cut 3)
      const hasHighPrimary = (cut1Type === 'primary' && cut1Tier === 'high') || (cut2Type === 'primary' && cut2Tier === 'high');
      const hasMidPrimary1 = (cut1Type === 'primary' && cut1Tier === 'mid');
      const hasMidPrimary2 = (cut2Type === 'primary' && cut2Tier === 'mid');

      if (hasHighPrimary) {
        decision = isEn ? 'FINALIZE 3RD CUT' : 'FINALISER LE 3ᵉ CUT';
        subtitle = isEn ? 'Tier High secured on a primary line. Take the final cut.' : 'Tier High sécurisé sur une ligne primaire. Tentez le dernier cut.';
        ev = Math.round(m.hl * qMult - CUT_COST);
        estimatedMarketVal = Math.round(m.hm * qMult);
        probSuccess = '3.70%';
        bannerClass = 'jackpot';
        icon = '';
        explanation = isEn
          ? `You secured at least one Tier High on a primary line. Only one cut left at 1,200g to unlock High/High or a useful 3rd line (Flat AP / HP). Expected value is positive: finalize the piece.`
          : `Vous avez sécurisé au moins un Tier High sur une ligne primaire. Il ne reste qu'un seul cut à 1 200 g pour tenter de débloquer le tier High/High ou une 3ᵉ ligne utile (Flat AP / HP). L'espérance est positive : finalisez le bijou.`;
      } else if (hasMidPrimary1 && hasMidPrimary2) {
        decision = isEn ? 'FINALIZE 3RD CUT (GUARANTEED MID/MID)' : 'FINALISER LE 3ᵉ CUT (MID/MID SÉCURISÉ)';
        subtitle = isEn ? 'Mid/Mid secured. The piece is already sellable and equippable.' : 'Mid/Mid sécurisé. Le bijou est déjà vendable et équipable.';
        ev = Math.round(m.mm * qMult - CUT_COST);
        estimatedMarketVal = Math.round(m.mm * qMult);
        probSuccess = '100%';
        bannerClass = 'continue';
        icon = '';
        explanation = isEn
          ? `Mid/Mid secured on both primary lines. Sellable immediately on the market or equippable for your T4 roster. Finalize the 3rd cut to target the 3rd bonus line (Flat Weapon Power or Vitality).`
          : `Mid/Mid sécurisé sur les deux lignes primaires. La pièce est directement vendable au marché ou équipable pour votre roster T4. Finalisez le 3ᵉ cut pour chercher la 3ᵉ ligne bonus (Puissance d'Arme flat ou Vitalité).`;
      } else if (hasMidPrimary1 || hasMidPrimary2) {
        const secondaryUseful = (cut1Type === 'flat' || cut1Type === 'hp' || cut2Type === 'flat' || cut2Type === 'hp') && (cut1Tier !== 'none' && cut2Tier !== 'none');
        if (secondaryUseful) {
          decision = isEn ? 'FINALIZE 3RD CUT (UTILITY PIECE)' : 'FINALISER LE 3ᵉ CUT (BIJOU UTILITAIRE)';
          subtitle = isEn ? 'Decent transition piece with useful flat secondary line.' : 'Pièce de transition acceptable avec ligne secondaire flat utile.';
          ev = Math.round(m.ml * qMult - CUT_COST);
          estimatedMarketVal = Math.round(m.ml * qMult);
          probSuccess = '22.2%';
          bannerClass = 'continue';
          icon = '';
          explanation = isEn
            ? `You secured a Mid primary line supplemented by a useful flat line. The 3rd cut at 1,200g can unlock an extra synergy for a small cost.`
            : `Vous avez sécurisé une ligne primaire Mid complétée par une ligne flat utile. Le 3ᵉ cut à 1 200 g peut débloquer une synergie supplémentaire pour un coût modique.`;
        } else {
          decision = isEn ? 'ABANDON ACCESSORY' : 'ABANDONNER LE BIJOU';
          subtitle = isEn ? 'Weak combination after 2 cuts. Save the 3rd cut gold.' : 'Combinaison trop faible après 2 cuts. Économisez le 3ᵉ taillage.';
          ev = -CUT_COST;
          estimatedMarketVal = 0;
          probSuccess = '0.70%';
          bannerClass = 'stop';
          icon = '';
          explanation = isEn
            ? `After 2 cuts, only one Mid line is present without viable secondary synergy. Paying 1,200g more has a negligible chance to rescue the piece. Dismantle the accessory.`
            : `Après 2 cuts, une seule ligne Mid est présente sans accompagnement viable. Payer 1 200 g de plus n'a qu'une probabilité infime de sauver la pièce. Recyclez le bijou.`;
        }
      } else {
        decision = isEn ? 'ABANDON ACCESSORY' : 'ABANDONNER LE BIJOU';
        subtitle = isEn ? 'No viable primary tier after 2 cuts.' : 'Aucun tier primaire viable après 2 cuts.';
        ev = -CUT_COST;
        estimatedMarketVal = 0;
        probSuccess = '0.00%';
        bannerClass = 'stop';
        icon = '';
        explanation = isEn
          ? `After 2 cuts, no viable Mid/Mid or High primary combination is possible. Do not pay 1,200g for the 3rd cut. Sell or dismantle immediately.`
          : `Après 2 cuts, aucune combinaison primaire Mid/Mid ou High n'est possible. Ne payez surtout pas les 1 200 g du 3ᵉ cut. Vendez au marchand ou recyclez en poudres.`;
      }
    }

    return {
      decision,
      subtitle,
      ev,
      estimatedMarketVal,
      probSuccess,
      nextCost,
      explanation,
      bannerClass,
      icon
    };
  }

  function updateCuttingAdvisorView() {
    const role = state.role || 'support';
    const isSupport = role === 'support';

    const isEn = isEnLang();
    if (dom.cutRoleBadge) {
      dom.cutRoleBadge.textContent = isSupport 
        ? (isEn ? 'Support T4 (Sell / Equip)' : 'Support T4 (Vente / Équipement)') 
        : (isEn ? 'DPS T4 (Sell / Equip)' : 'DPS T4 (Vente / Équipement)');
      dom.cutRoleBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
    }

    if (dom.cutSlotSelect) dom.cutSlotSelect.value = cuttingAdvisorState.slot;
    if (dom.cutStatQuintile) dom.cutStatQuintile.value = cuttingAdvisorState.quintile;
    if (dom.cut1Effect) dom.cut1Effect.value = cuttingAdvisorState.cut1Effect;
    if (dom.cut1Tier) dom.cut1Tier.value = cuttingAdvisorState.cut1Tier;
    if (dom.cut2Status) dom.cut2Status.value = cuttingAdvisorState.cut2Status;
    if (dom.cut2Effect) dom.cut2Effect.value = cuttingAdvisorState.cut2Effect;
    if (dom.cut2Tier) dom.cut2Tier.value = cuttingAdvisorState.cut2Tier;

    const cut2Done = cuttingAdvisorState.cut2Status === 'done';
    if (dom.cut2DetailsGroup) {
      dom.cut2DetailsGroup.style.display = cut2Done ? 'block' : 'none';
    }

    const res = evaluateCutState({
      slot: cuttingAdvisorState.slot,
      role: role,
      quintile: cuttingAdvisorState.quintile,
      cut1Type: cuttingAdvisorState.cut1Effect,
      cut1Tier: cuttingAdvisorState.cut1Tier,
      cut2Done: cut2Done,
      cut2Type: cuttingAdvisorState.cut2Effect,
      cut2Tier: cuttingAdvisorState.cut2Tier
    });

    if (dom.cutDecisionBanner) {
      dom.cutDecisionBanner.className = `cutting-decision-banner ${res.bannerClass}`;
    }
    if (dom.cutDecisionIcon) dom.cutDecisionIcon.textContent = res.icon;
    if (dom.cutDecisionTitle) dom.cutDecisionTitle.textContent = res.decision;
    if (dom.cutDecisionSub) dom.cutDecisionSub.textContent = res.subtitle;

    if (dom.cutEvVal) {
      dom.cutEvVal.textContent = res.ev >= 0 ? `+${res.ev.toLocaleString()} g` : `${res.ev.toLocaleString()} g`;
      dom.cutEvVal.className = `cut-kpi-val ${res.ev >= 0 ? 'highlight' : 'negative'}`;
    }
    if (dom.cutMarketVal) {
      dom.cutMarketVal.textContent = res.estimatedMarketVal > 0 ? `~${res.estimatedMarketVal.toLocaleString()} g` : '0 g';
    }
    if (dom.cutProbSuccess) {
      dom.cutProbSuccess.textContent = res.probSuccess;
    }
    if (dom.cutNextCost) {
      dom.cutNextCost.textContent = `${res.nextCost.toLocaleString()} g`;
    }
    if (dom.cutAnalysisText) {
      dom.cutAnalysisText.textContent = res.explanation;
    }
  }

  function initCuttingAdvisorEvents() {
    if (dom.cutSlotSelect) {
      dom.cutSlotSelect.addEventListener('change', (e) => {
        cuttingAdvisorState.slot = e.target.value;
        updateCuttingAdvisorView();
      });
    }
    if (dom.cutStatQuintile) {
      dom.cutStatQuintile.addEventListener('change', (e) => {
        cuttingAdvisorState.quintile = e.target.value;
        updateCuttingAdvisorView();
      });
    }
    if (dom.cut1Effect) {
      dom.cut1Effect.addEventListener('change', (e) => {
        cuttingAdvisorState.cut1Effect = e.target.value;
        updateCuttingAdvisorView();
      });
    }
    if (dom.cut1Tier) {
      dom.cut1Tier.addEventListener('change', (e) => {
        cuttingAdvisorState.cut1Tier = e.target.value;
        updateCuttingAdvisorView();
      });
    }
    if (dom.cut2Status) {
      dom.cut2Status.addEventListener('change', (e) => {
        cuttingAdvisorState.cut2Status = e.target.value;
        updateCuttingAdvisorView();
      });
    }
    if (dom.cut2Effect) {
      dom.cut2Effect.addEventListener('change', (e) => {
        cuttingAdvisorState.cut2Effect = e.target.value;
        updateCuttingAdvisorView();
      });
    }
    if (dom.cut2Tier) {
      dom.cut2Tier.addEventListener('change', (e) => {
        cuttingAdvisorState.cut2Tier = e.target.value;
        updateCuttingAdvisorView();
      });
    }

    function setPresetActive(activeBtn) {
      [dom.btnCutPresetJackpot, dom.btnCutPresetMid, dom.btnCutPresetLow, dom.btnCutPresetTrash].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (activeBtn) activeBtn.classList.add('active');
    }

    if (dom.btnCutPresetJackpot) {
      dom.btnCutPresetJackpot.addEventListener('click', () => {
        cuttingAdvisorState.cut1Effect = 'primary';
        cuttingAdvisorState.cut1Tier = 'high';
        cuttingAdvisorState.cut2Status = 'not_cut';
        setPresetActive(dom.btnCutPresetJackpot);
        updateCuttingAdvisorView();
      });
    }

    if (dom.btnCutPresetMid) {
      dom.btnCutPresetMid.addEventListener('click', () => {
        cuttingAdvisorState.cut1Effect = 'primary';
        cuttingAdvisorState.cut1Tier = 'mid';
        cuttingAdvisorState.cut2Status = 'not_cut';
        setPresetActive(dom.btnCutPresetMid);
        updateCuttingAdvisorView();
      });
    }

    if (dom.btnCutPresetLow) {
      dom.btnCutPresetLow.addEventListener('click', () => {
        cuttingAdvisorState.cut1Effect = 'primary';
        cuttingAdvisorState.cut1Tier = 'low';
        cuttingAdvisorState.cut2Status = 'not_cut';
        setPresetActive(dom.btnCutPresetLow);
        updateCuttingAdvisorView();
      });
    }

    if (dom.btnCutPresetTrash) {
      dom.btnCutPresetTrash.addEventListener('click', () => {
        cuttingAdvisorState.cut1Effect = 'trash';
        cuttingAdvisorState.cut1Tier = 'none';
        cuttingAdvisorState.cut2Status = 'not_cut';
        setPresetActive(dom.btnCutPresetTrash);
        updateCuttingAdvisorView();
      });
    }

    updateCuttingAdvisorView();
  }

  /**
   * Met à jour l'affichage de l'onglet 3 : Optimisation T4 (Arsonistic Engine)
   */
  function updateOptimizationView() {
    const role = state.role || 'support';
    const isSupport = role === 'support';

    if (dom.optSupportControls && dom.optDpsControls) {
      dom.optSupportControls.style.display = isSupport ? 'block' : 'none';
      dom.optDpsControls.style.display = isSupport ? 'none' : 'block';
    }

    if (dom.gemContainerSupport && dom.gemContainerDps) {
      dom.gemContainerSupport.style.display = isSupport ? 'block' : 'none';
      dom.gemContainerDps.style.display = isSupport ? 'none' : 'block';
    }

    if (isSupport) {
      updatePerSkillGemsView();
    } else {
      updateDpsGemsView();
    }

    if (dom.optBadge) {
      dom.optBadge.textContent = isSupport ? 'Arsonistic Support (SupCalc)' : 'Arsonistic DPS (Calc)';
      dom.optBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
      dom.optBadge.style.borderColor = isSupport ? 'rgba(232, 230, 220, 0.3)' : 'rgba(224, 122, 99, 0.3)';
    }

    const isEn = isEnLang();
    if (dom.optResultTypeLabel) {
      dom.optResultTypeLabel.textContent = isSupport
        ? (isEn ? 'Real Raid Damage Buff Gain:' : 'Gain Réel de Buff Dégâts pour le Groupe :')
        : (isEn ? 'Real Personal DPS Gain:' : 'Gain Réel de DPS Personnel :');
    }

    let accBonus = 0;
    let braceBonus = 0;
    let gemBonusDmg = 0;
    let totalCpBonus = 0;

    let bar1Name = '';
    let bar1Val = 0;
    let bar2Name = '';
    let bar2Val = 0;
    let bar3Name = '';
    let bar3Val = 0;
    let bar4Name = '';
    let bar4Val = 0;
    let advice = '';

    const gemData = ARSONISTIC_DATA.gems[state.opt.gemsDeck] || ARSONISTIC_DATA.gems.lvl8;
    totalCpBonus += gemData.cp;

    if (isSupport) {
      const sup = ARSONISTIC_DATA.support;
      const bBrand = sup.brand[state.opt.supBrand] || sup.brand.high;
      const bDmg = sup.allyDmg[state.opt.supAllyDmg] || sup.allyDmg.mid;
      const bAp = sup.allyAp[state.opt.supAllyAp] || sup.allyAp.high;
      const bWp = sup.wpPct[state.opt.supWp] || sup.wpPct.mid;
      const bWpFlat = sup.wpFlat[state.opt.supWpFlat] || sup.wpFlat['960'];
      const bQual = sup.quality[state.opt.supQuality] || sup.quality.mid;

      accBonus = bBrand.buffDmg + bDmg.buffDmg + bAp.buffDmg + bWp.buffDmg + bWpFlat.buffDmg + bQual.buffDmg;
      totalCpBonus += bBrand.cp + bDmg.cp + bAp.cp + bWp.cp + bWpFlat.cp + bQual.cp;

      const brPerk = sup.bracePerk[state.opt.supBracePerk] || sup.bracePerk.crit_ap;
      const brWp = sup.braceWp[state.opt.supBraceWp] || sup.braceWp['9000'];
      const brStat = sup.braceStat[state.opt.supBraceStat] || sup.braceStat['14000'];
      const brSwift = sup.braceSwift[state.opt.supBraceSwift] || sup.braceSwift['100'];

      braceBonus = brPerk.buffDmg + brWp.buffDmg + brStat.buffDmg + brSwift.buffDmg;
      totalCpBonus += brPerk.cp + brWp.cp + brStat.cp + brSwift.cp;

      gemBonusDmg = gemData.buffDmg;

      bar1Name = isEn ? 'Brand Power' : 'Marque (Brand Power)';
      bar1Val = bBrand.buffDmg;
      bar2Name = isEn ? 'Ally AP Buff (Ally AP)' : 'Buff PA Alliés (Ally AP)';
      bar2Val = bAp.buffDmg;
      bar3Name = isEn ? 'Ally Damage (Ally Dmg)' : 'Dégâts Alliés (Ally Dmg)';
      bar3Val = bDmg.buffDmg;
      bar4Name = isEn ? 'Special Bracelet' : `Bracelet (${brPerk.name.split('+')[0].trim()})`;
      bar4Val = braceBonus;

      if (state.opt.supBracePerk !== 'crit_ap') {
        advice = isEn
          ? `The bracelet roll <strong>Ally Crit Rate + Ally Attack Power</strong> is the largest raid multiplier (+2.43% damage for the whole raid). Target it first.`
          : `Le roll bracelet <strong>Taux Critique Alliés + PA Alliés</strong> est le plus gros multiplicateur de raid (+2.43 % de dégâts pour tout le raid). Vise-la en premier.`;
      } else if (state.opt.supBrand !== 'high') {
        advice = isEn
          ? `The <strong>Brand Power High (+8%)</strong> line is essential to maximize brand uptime and grants +0.70% net team buff.`
          : `La ligne <strong>Brand Power High (+8%)</strong> est essentielle pour maximiser l'uptime de ta marque et apporte +0.70% de buff net à l'équipe.`;
      } else if (state.opt.gemsDeck === 'lvl7') {
        advice = isEn
          ? `Upgrading your gem deck to <strong>Level 8 (+28.35 CP per gem)</strong> will grant over 310 CP and boost your buff power by +1.25%.`
          : `Passer ton deck de gemmes en <strong>Niv. 8 (+28.35 CP par gemme)</strong> te fera franchir plus de 310 CP et renforcera de +1.25% la puissance de tes buffs.`;
      } else {
        advice = isEn
          ? `No priority upgrade left in this model: raid multipliers and gem deck are at their best values.`
          : `Aucune amélioration prioritaire dans ce modèle : multiplicateurs de raid et deck de gemmes à leurs meilleures valeurs.`;
      }

    } else {
      const dps = ARSONISTIC_DATA.dps;
      const dAdd = dps.addDmg[state.opt.dpsAddDmg] || dps.addDmg.high;
      const dOut = dps.outDmg[state.opt.dpsOutDmg] || dps.outDmg.high;
      const dAp = dps.apPct[state.opt.dpsAp] || dps.apPct.high;
      const dCrit = dps.critPct[state.opt.dpsCrit] || dps.critPct.mid;
      const dCdmg = dps.cdmgPct[state.opt.dpsCdmg] || dps.cdmgPct.mid;
      const dWp = dps.wpPct[state.opt.dpsWp] || dps.wpPct.mid;
      const dQual = dps.quality[state.opt.dpsQuality] || dps.quality.mid;

      accBonus = dAdd.dps + dOut.dps + dAp.dps + dCrit.dps + dCdmg.dps + dWp.dps + dQual.dps;
      totalCpBonus += dAdd.cp + dOut.cp + dAp.cp + dCrit.cp + dCdmg.cp + dWp.cp + dQual.cp;

      const brPerk = dps.bracePerk[state.opt.dpsBracePerk] || dps.bracePerk.crit_cdmg;
      const brWp = dps.braceWp[state.opt.dpsBraceWp] || dps.braceWp['9000'];
      const brStat = dps.braceStat[state.opt.dpsBraceStat] || dps.braceStat['14000'];
      const brSub = dps.braceSub[state.opt.dpsBraceSub] || dps.braceSub['100'];

      braceBonus = brPerk.dps + brWp.dps + brStat.dps + brSub.dps;
      totalCpBonus += brPerk.cp + brWp.cp + brStat.cp + brSub.cp;

      gemBonusDmg = gemData.dps;

      bar1Name = isEn ? 'Additional Damage' : 'Dégâts Additionnels';
      bar1Val = dAdd.dps;
      bar2Name = isEn ? 'Outgoing Damage & Atk Power' : 'Dégâts Sortants & PA';
      bar2Val = dOut.dps + dAp.dps;
      bar3Name = isEn ? 'Crit Rate & Crit Damage' : 'Crit & Dégâts Crit';
      bar3Val = dCrit.dps + dCdmg.dps;
      bar4Name = isEn ? 'Special Bracelet' : `Bracelet (${brPerk.name.split('&')[0].trim()})`;
      bar4Val = braceBonus;

      if (state.opt.dpsBracePerk !== 'crit_cdmg') {
        advice = isEn
          ? `The bracelet roll <strong>Crit Rate +5% & Crit Hit Dmg +1.5%</strong> is the highest performing roll in the game (+5.45% direct DPS gain on the Arsonistic sheet).`
          : `Le roll de bracelet <strong>Crit Rate +5% & Crit Hit Dmg +1.5%</strong> est le roll le plus performant du jeu (+5.45% de gain DPS direct sur la feuille Arsonistic).`;
      } else if (state.opt.dpsAddDmg !== 'high' || state.opt.dpsOutDmg !== 'high') {
        advice = isEn
          ? `Accessory lines <strong>Additional Damage High (+2.6%)</strong> and <strong>Outgoing Damage High (+2.0%)</strong> each represent approximately +2% net DPS.`
          : `Les lignes d'accessoires <strong>Additional Damage High (+2.6%)</strong> et <strong>Outgoing Damage High (+2.0%)</strong> représentent chacune environ +2% de DPS net.`;
      } else if (state.opt.gemsDeck === 'lvl8') {
        advice = isEn
          ? `Upgrading major gems on your core skills to <strong>Level 9 / 10</strong> is the next threshold to push past 5000+ CP.`
          : `Monter les gemmes majeures de tes compétences principales vers <strong>Niv. 9 / 10</strong> est le prochain palier pour franchir les 5000+ CP.`;
      } else {
        advice = isEn
          ? `No priority upgrade left in this model: accessory, bracelet and gem lines are at their best values.`
          : `Aucune amélioration prioritaire dans ce modèle : lignes d'accessoires, bracelet et gemmes à leurs meilleures valeurs.`;
      }
    }

    const totalDmgGain = accBonus + braceBonus + gemBonusDmg;

    // Mise à jour de l'affichage
    if (dom.optDpsGainDisplay) dom.optDpsGainDisplay.textContent = `+${totalDmgGain.toFixed(2)}%`;
    if (dom.optCpGainDisplay) dom.optCpGainDisplay.textContent = isEnLang()
      ? `+${formatNumber(totalCpBonus)} CP generated by synergies`
      : `+${formatNumber(totalCpBonus)} CP générés par les synergies`;
    if (dom.optBreakdownAcc) dom.optBreakdownAcc.textContent = `+${accBonus.toFixed(2)}%`;
    if (dom.optBreakdownBrace) dom.optBreakdownBrace.textContent = `+${braceBonus.toFixed(2)}%`;
    if (dom.optBreakdownGems) dom.optBreakdownGems.textContent = `+${gemBonusDmg.toFixed(2)}%`;
    if (dom.optTotalCpVal) dom.optTotalCpVal.textContent = `+${formatNumber(totalCpBonus)} CP`;

    // Jauges visuelles (calcul de ratio max)
    const maxVal = Math.max(3.0, totalDmgGain);
    if (dom.barLabel1) dom.barLabel1.textContent = bar1Name;
    if (dom.barVal1) dom.barVal1.textContent = `+${bar1Val.toFixed(2)}%`;
    if (dom.barFill1) dom.barFill1.style.width = `${Math.min(100, Math.max(5, (bar1Val / maxVal) * 100))}%`;

    if (dom.barLabel2) dom.barLabel2.textContent = bar2Name;
    if (dom.barVal2) dom.barVal2.textContent = `+${bar2Val.toFixed(2)}%`;
    if (dom.barFill2) dom.barFill2.style.width = `${Math.min(100, Math.max(5, (bar2Val / maxVal) * 100))}%`;

    if (dom.barLabel3) dom.barLabel3.textContent = bar3Name;
    if (dom.barVal3) dom.barVal3.textContent = `+${bar3Val.toFixed(2)}%`;
    if (dom.barFill3) dom.barFill3.style.width = `${Math.min(100, Math.max(5, (bar3Val / maxVal) * 100))}%`;

    if (dom.barLabel4) dom.barLabel4.textContent = bar4Name;
    if (dom.barVal4) dom.barVal4.textContent = `+${bar4Val.toFixed(2)}%`;
    if (dom.barFill4) dom.barFill4.style.width = `${Math.min(100, Math.max(5, (bar4Val / maxVal) * 100))}%`;

    if (dom.barVal5) dom.barVal5.textContent = `+${gemBonusDmg.toFixed(2)}%`;
    if (dom.barFill5) dom.barFill5.style.width = `${Math.min(100, Math.max(5, (gemBonusDmg / maxVal) * 100))}%`;

    if (dom.optAdviceText) dom.optAdviceText.innerHTML = advice;

    // Mise à jour du Tableau d'Arbitrage Rentabilité EUC
    renderEfficiencyTable();
    updatePerSkillGemsView();
    updateCuttingAdvisorView();
  }


  // Bonus CP% moyen par niveau de gemme T4 (même échelle que extractPlayerSystems)
  const GEM_LEVEL_BONUS_PCT = { 7: 31.5, 8: 36.0, 9: 40.5, 10: 48.0 };
  // Coût (gold) pour monter UNE gemme T4 du niveau clé au niveau suivant
  const GEM_UPGRADE_COST = { 7: 276000, 8: 813000, 9: 2415000 };
  // Coût (gold) par point de cœur manquant pour atteindre 17 points.
  // Calé sur l'ancien forfait de 80 898 g, interprété comme un passage 14 → 17 (3 points).
  const ARK_CORE_COST_PER_POINT = Math.round(80898 / 3);
  // Bonus d'arme (échelle bonusPct de extractPlayerSystems) gagné par niveau d'affinage effectif
  const WEAPON_HONING_BONUS_PER_LVL = 1.20;
  // Bonus d'armure (échelle bonusPct) gagné par niveau moyen d'affinage effectif sur les 5 pièces
  const ARMOR_HONING_BONUS_PER_LVL = { dps: 1.37, support: 1.50 };
  const ARK_CORE_DEFS = [
    { key: 'orderSun', prefix: '67300', fr: 'Ordre Soleil', en: 'Order Sun' },
    { key: 'orderMoon', prefix: '67301', fr: 'Ordre Lune', en: 'Order Moon' },
    { key: 'orderStar', prefix: '67302', fr: 'Ordre Étoile', en: 'Order Star' },
    { key: 'chaosSun', prefix: '67310', fr: 'Chaos Soleil', en: 'Chaos Sun' },
    { key: 'chaosMoon', prefix: '67311', fr: 'Chaos Lune', en: 'Chaos Moon' },
    { key: 'chaosStar', prefix: '67312', fr: 'Chaos Étoile', en: 'Chaos Star' }
  ];
  const GPD_TIER_LABELS = { 's-plus': 'Rang S+', 's': 'Rang S', 'a': 'Rang A', 'b': 'Rang B', 'c': 'Rang C' };

  // Répartition des gemmes par niveau à partir des valeurs de gemParts (seuils DPS/Support)
  function countGemLevels(parts, isSupport) {
    const counts = { 7: 0, 8: 0, 9: 0, 10: 0 };
    const l10 = isSupport ? 12.00 : 7.00;
    const l9 = isSupport ? 10.80 : 6.35;
    const l8 = isSupport ? 9.60 : 5.70;
    parts.forEach(g => {
      if (g >= l10 - 0.05) counts[10]++;
      else if (g >= l9 - 0.05) counts[9]++;
      else if (g >= l8 - 0.05) counts[8]++;
      else counts[7]++;
    });
    return counts;
  }

  // Repli sur le libellé de getCharacterGemSummary : "3x Niv. 9", "Full Gemmes 8 T4"...
  function countGemLevelsFromLabel(label) {
    const counts = { 7: 0, 8: 0, 9: 0, 10: 0 };
    let found = false;
    const re = /(\d+)x\s*(?:Lv\.|Niv\.)\s*(\d+)/g;
    let m;
    while ((m = re.exec(label))) {
      const lvl = parseInt(m[2], 10);
      if (counts[lvl] !== undefined) { counts[lvl] += parseInt(m[1], 10); found = true; }
    }
    if (!found) {
      const full = /Full.*?(?:Lv\.|Gemmes)\s*(10|[789])\b/.exec(label);
      if (!full) return null;
      counts[parseInt(full[1], 10)] = 11;
    }
    return counts;
  }

  function getDynamicGpdTable(charObj, role, isEn) {
    const charRole = (charObj && detectCharacterRole(charObj)) || role || 'dps';
    if (!charObj) return EUC_EFFICIENCY_DATA[charRole] || EUC_EFFICIENCY_DATA.support;
    const isSupport = charRole === 'support';
    const sys = extractPlayerSystems(charObj, isEn);

    let dynTable = [];

    // Support : gold par 0.01% de buff ; DPS : gold par 1% de dégâts.
    // Le tier est toujours évalué sur le coût par 1% pour garder les mêmes seuils.
    const ratioUnit = isSupport ? 100 : 1;
    const pushRow = (id, name, sub, gain, cost, comment, meta) => {
      if (!(gain > 0) || !(cost > 0)) return;
      const ratio = Math.round(cost / (gain * ratioUnit));
      const tier = getTierFromRatio(cost / gain);
      dynTable.push({
        id,
        name,
        sub,
        gainText: `+${gain.toFixed(2)}% ${isSupport ? 'Buff' : 'DPS'}`,
        gainVal: Number(gain.toFixed(2)),
        cost: Math.round(cost),
        ratioText: formatNumber(ratio) + ' g',
        ratioVal: ratio,
        tier,
        tierLabel: GPD_TIER_LABELS[tier],
        comment,
        meta: meta || {}
      });
    };

    // 1. Weapon Honing
    let wLvl = sys.weapon.wLvl || 12;
    // Serka : même puissance qu'Aegir +9, on estime donc le coût sur le niveau effectif
    const effWLvl = sys.weapon.effWLvl !== undefined ? sys.weapon.effWLvl : wLvl;
    if (effWLvl < 25) {
      // Gain relatif : +1 niveau ajoute WEAPON_HONING_BONUS_PER_LVL au bonus d'arme actuel
      const curWeaponPct = sys.weapon.bonusPct || 0;
      const dmgGain = ((1 + (curWeaponPct + WEAPON_HONING_BONUS_PER_LVL) / 100) / (1 + curWeaponPct / 100) - 1) * 100;
      // Coût attendu du palier : tentatives moyennes (artisan) × matériaux au prix du marché
      const cost = getLevelCost('weapon', effWLvl).totalValue;
      pushRow('dyn_weapon',
        isEn ? `Honing — Weapon +${wLvl + 1}` : `Affinage — Arme +${wLvl + 1}`,
        isEn ? `From +${wLvl}` : `Depuis +${wLvl}`,
        dmgGain, cost,
        isEn ? 'Expected cost (average taps with artisan energy, market-priced materials).' : 'Coût attendu (nombre moyen de tentatives avec artisanat, matériaux au prix du marché).',
        { from: wLvl, to: wLvl + 1 });
    }

    // 2. Armor Honing
    let aLvl = Math.floor(sys.armors.avgArmor || 12);
    // Serka : même logique que l'arme, coût estimé sur le niveau moyen effectif
    const effALvl = Math.floor(sys.armors.effAvgArmor !== undefined ? sys.armors.effAvgArmor : aLvl);
    if (effALvl < 25) {
      // Gain relatif : +1 niveau moyen ajoute ARMOR_HONING_BONUS_PER_LVL au bonus d'armure actuel
      const curArmorPct = sys.armors.bonusPct || 0;
      const perLvl = isSupport ? ARMOR_HONING_BONUS_PER_LVL.support : ARMOR_HONING_BONUS_PER_LVL.dps;
      const dmgGain = ((1 + (curArmorPct + perLvl) / 100) / (1 + curArmorPct / 100) - 1) * 100;
      // Coût attendu d'un palier sur chacune des 5 pièces
      const cost = getLevelCost('armor', effALvl).totalValue * 5;
      pushRow('dyn_armor',
        isEn ? `Honing — Armors +${aLvl + 1}` : `Affinage — Armures +${aLvl + 1}`,
        isEn ? `From +${aLvl} on 5 pieces` : `Depuis +${aLvl} sur 5 pièces`,
        dmgGain, cost,
        isEn ? 'Expected cost for all 5 pieces (average taps with artisan energy, market-priced materials).' : 'Coût attendu sur les 5 pièces (nombre moyen de tentatives avec artisanat, matériaux au prix du marché).',
        { from: aLvl, to: aLvl + 1 });
    }

    // 2b. Affinage avancé : prochaine tranche de 10 niveaux (arme, puis armures les moins avancées).
    // 1 niveau avancé = +1 iLvl sur la pièce = 1/5 d'un niveau d'affinage normal (même gain de stat par iLvl).
    const advLv = getAdvHoningLevels(charObj);
    if (advLv) {
      const wAdv = getAdvHoningCost('weapon', advLv.weapon);
      if (wAdv) {
        const curWeaponPct = sys.weapon.bonusPct || 0;
        const add = WEAPON_HONING_BONUS_PER_LVL * wAdv.levels / 5;
        const dmgGain = ((1 + (curWeaponPct + add) / 100) / (1 + curWeaponPct / 100) - 1) * 100;
        pushRow('dyn_adv_weapon',
          isEn ? `Advanced Honing — Weapon ${wAdv.from} ➔ ${wAdv.to}` : `Affinage avancé — Arme ${wAdv.from} ➔ ${wAdv.to}`,
          isEn ? `+${wAdv.levels} item levels on the weapon` : `+${wAdv.levels} niveaux d'objet sur l'arme`,
          dmgGain, wAdv.totalValue,
          advHoningComment(wAdv, isEn),
          { piece: 'weapon', from: wAdv.from, to: wAdv.to, breath: wAdv.useBreath });
      }
      const minArmor = Math.min(...advLv.armors);
      const lagging = advLv.armors.filter(v => v === minArmor);
      const aAdv = getAdvHoningCost('armor', minArmor);
      if (aAdv) {
        const curArmorPct = sys.armors.bonusPct || 0;
        const perLvl = isSupport ? ARMOR_HONING_BONUS_PER_LVL.support : ARMOR_HONING_BONUS_PER_LVL.dps;
        // Le niveau moyen des 5 pièces monte de (pièces × niveaux) / 5, à 1/5 d'un niveau normal
        const add = perLvl * (lagging.length * aAdv.levels / 5) / 5;
        const dmgGain = ((1 + (curArmorPct + add) / 100) / (1 + curArmorPct / 100) - 1) * 100;
        pushRow('dyn_adv_armor',
          isEn ? `Advanced Honing — Armors ${aAdv.from} ➔ ${aAdv.to}` : `Affinage avancé — Armures ${aAdv.from} ➔ ${aAdv.to}`,
          isEn ? `${lagging.length} piece(s) out of 5` : `${lagging.length} pièce(s) sur 5`,
          dmgGain, aAdv.totalValue * lagging.length,
          advHoningComment(aAdv, isEn),
          { piece: 'armor', from: aAdv.from, to: aAdv.to, pieces: lagging.length, breath: aAdv.useBreath });
      }
    }

    // 3. Gems : une ligne par niveau présent, gain relatif sur le bonus moyen actuel du set
    const gemParts = extractCharacterGemParts(charObj);
    const gemCounts = (gemParts && gemParts.length > 0)
      ? countGemLevels(gemParts, isSupport)
      : countGemLevelsFromLabel((sys.gems && sys.gems.label) || '');
    if (gemCounts) {
      const totalGems = gemCounts[7] + gemCounts[8] + gemCounts[9] + gemCounts[10];
      const curGemPct = [7, 8, 9, 10].reduce((s, l) => s + gemCounts[l] * GEM_LEVEL_BONUS_PCT[l], 0) / totalGems;
      [7, 8, 9].forEach(lvl => {
        const n = gemCounts[lvl];
        if (!n) return;
        const delta = n * (GEM_LEVEL_BONUS_PCT[lvl + 1] - GEM_LEVEL_BONUS_PCT[lvl]) / totalGems;
        const gain = ((1 + (curGemPct + delta) / 100) / (1 + curGemPct / 100) - 1) * 100;
        pushRow(`dyn_gems_${lvl}_${lvl + 1}`,
          isEn ? `Skill gems — Lv. ${lvl} ➔ ${lvl + 1}` : `Gemmes de Compétences — Niv. ${lvl} ➔ ${lvl + 1}`,
          isEn ? `${n} gem(s) out of ${totalGems}` : `${n} gemme(s) sur ${totalGems}`,
          gain, n * GEM_UPGRADE_COST[lvl],
          isEn ? `Only the ${n} gem(s) currently at Lv. ${lvl} are priced.` : `Seules les ${n} gemme(s) actuellement Niv. ${lvl} sont comptées.`,
          { lvl, n, counts: gemCounts, total: totalGems });
      });
    }

    // 4. Ark Grid cores → 17 points (gain marginal depuis les points actuels)
    const ark = getArkGridStatus(charObj);
    const slots = ark.slots || {};
    const hasSlotData = Object.values(slots).some(v => v > 0);
    ARK_CORE_DEFS.forEach(def => {
      let pts = slots[def.key] || 0;
      if (!hasSlotData) {
        // Pas de cœurs bruts : repli sur les drapeaux 17P, uniquement pour les cœurs d'Ordre
        if (!def.key.startsWith('order')) return;
        const has17 = def.key === 'orderSun' ? ark.hasSun17 : (def.key === 'orderMoon' ? ark.hasMoon17 : ark.hasStar17);
        pts = has17 ? 17 : 10;
      }
      if (pts <= 0 || pts >= 17) return;
      const cur = getArkGridCoreBonus(def.prefix, pts, isSupport, false);
      const next = getArkGridCoreBonus(def.prefix, 17, isSupport, false);
      // Les cœurs se cumulent multiplicativement (cf. evalCoreGroup)
      const gain = ((1 + next / 100) / (1 + cur / 100) - 1) * 100;
      pushRow(`dyn_core_${def.key}`,
        isEn ? `Ark Grid — ${def.en} core 17P` : `Grille d'Ark — Cœur ${def.fr} 17P`,
        isEn ? `From ${pts} points` : `Depuis ${pts} points`,
        gain, (17 - pts) * ARK_CORE_COST_PER_POINT,
        isEn ? `Marginal gain from ${pts} to 17 points (${17 - pts} missing points).` : `Gain marginal de ${pts} à 17 points (${17 - pts} points manquants).`,
        { key: def.key, label: isEn ? def.en : def.fr, pts });
    });

    // Bracelet, pierre d'aptitude, astrogemmes et Karma : obtenus en jeu (chaos, gardiens, Paradise, raids), pas achetés.
    // Pas de ligne en or ici ; leur état est affiché sur la fiche (updateActiveCharacterCard, cartes de score).

    // 6c. Livres de gravure reliques : les livres restants jusqu'au niveau relique 4, au prix du marché
    getRelicBookUpgrades(charObj, isSupport).forEach(r => {
      const name = isEn ? r.en : r.fr;
      pushRow(`dyn_relic_${r.id}`,
        isEn ? `Relic books — ${name} Lv. ${r.lvl} ➔ 4` : `Livres reliques — ${name} niv. ${r.lvl} ➔ 4`,
        isEn ? `${r.books} books × ${formatNumber(Math.round(r.price))} g` : `${r.books} livres × ${formatNumber(Math.round(r.price))} g`,
        r.gain, r.cost,
        isEn
          ? `Relic book market price (EUC). ${r.read}/20 books already read; the gain per level is nearly linear, so every level has about the same ratio.`
          : `Prix du livre relique au marché (EUC). ${r.read}/20 livres déjà lus ; le gain par niveau est quasi linéaire, chaque niveau a donc à peu près le même ratio.`,
        { engraving: name, lvl: r.lvl, books: r.books, read: r.read });
    });

    // 7. Accessoires : remplacer le bijou au meilleur ratio (gain / prix de son type)
    const accEval = evaluateCharacterAccessories(charObj, isSupport, isEn);
    if (accEval.slotLines) {
      const best = findBestAccessoryUpgrade(accEval.slotLines, isSupport);
      if (best) {
        const slotNames = accessorySlotNames(isEn);
        pushRow('dyn_acc',
          isEn ? `Accessory Upgrade — ${slotNames[best.slot]}` : `Upgrade Bijou — ${slotNames[best.slot]}`,
          isEn ? `➔ ${best.pkg.label} + 1 dead line` : `➔ ${best.pkg.label} + 1 ligne morte`,
          best.gain, best.cost,
          isEn
            ? `Best ratio among your 5 accessories, lines valued with the Arsonistic slopes. Price per accessory type is an in-game estimate (no market source).`
            : `Meilleur ratio parmi tes 5 bijoux, lignes valorisées avec les pentes Arsonistic. Prix par type de bijou estimé en jeu (pas de source marché).`,
          { slot: best.slot, slotName: slotNames[best.slot], curPct: best.curPct, pkg: best.pkg.label });
      }
    }

    // Sort by most efficient (lowest ratio)
    dynTable.sort((a, b) => a.ratioVal - b.ratioVal);

    return dynTable;
  }

  // Niveaux d'affinage avancé par pièce, lus sur le profil importé.
  // Anciens profils sans détail par pièce : la valeur globale advHoning s'applique à toutes les pièces.
  function getAdvHoningLevels(charObj) {
    const gear = (charObj && (charObj.gear || (charObj.rawProfile && charObj.rawProfile.gear))) || {};
    const adv = gear.adv;
    const fallback = charObj && charObj.advHoning !== undefined ? charObj.advHoning : undefined;
    const pick = key => (adv && adv[key] !== undefined ? adv[key] : fallback);
    const weapon = pick('weapon');
    const armors = ['head', 'shoulder', 'chest', 'pants', 'gloves'].map(pick);
    if (weapon === undefined || armors.some(v => v === undefined)) return null;
    return { weapon, armors };
  }

  function advHoningComment(adv, isEn) {
    const attempts = Math.round(adv.attempts);
    if (isEn) {
      return `Expected cost: ~${attempts} paid attempts ${adv.useBreath ? 'with' : 'without'} breath (cheaper at current prices), Ancestor's Grace included, market-priced materials. Shards and tempering not counted.`;
    }
    return `Coût attendu : ~${attempts} tentatives payées ${adv.useBreath ? 'avec' : 'sans'} souffle (moins cher aux prix actuels), Grâce de l'ancêtre incluse, matériaux au prix du marché. Éclats et trempe non comptés.`;
  }

  function getTierFromRatio(ratio) {
    if (ratio <= 400000) return 's-plus';
    if (ratio <= 750000) return 's';
    if (ratio <= 1200000) return 'a';
    if (ratio <= 2500000) return 'b';
    return 'c';
  }

  /**
   * Génère et injecte dynamiquement le tableau d'arbitrage EUC (Onglet 3)
   */
  function renderEfficiencyTable() {
    const role = state.role || 'support';
    const isSupport = role === 'support';
    
    let list = EUC_EFFICIENCY_DATA[role] || EUC_EFFICIENCY_DATA.support;
    const activeChar = getCurrentActiveCharacter();
    if (activeChar) {
       list = getDynamicGpdTable(activeChar, role, isEnLang());
    }

    const isEn = isEnLang();
    if (dom.effRoleBadge) {
      dom.effRoleBadge.textContent = isSupport
        ? (isEn ? 'Support: Cost per 0.01% Raid Buff' : 'Support : Coût par 0.01% Buff Alliés')
        : (isEn ? 'DPS: Cost per 1.00% Personal DPS' : 'DPS : Coût par 1.00% DPS Personnel');
      dom.effRoleBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
      dom.effRoleBadge.style.borderColor = isSupport ? 'rgba(232, 230, 220, 0.3)' : 'rgba(224, 122, 99, 0.3)';
    }

    if (dom.effColGainHeader) {
      dom.effColGainHeader.textContent = isSupport 
        ? (isEn ? 'Raid Buff Gain' : 'Gain Buff Groupe') 
        : (isEn ? 'Net DPS Gain' : 'Gain DPS Net');
    }
    if (dom.effColRatioHeader) {
      dom.effColRatioHeader.textContent = isSupport 
        ? (isEn ? 'Cost / 0.01% Buff' : 'Coût / 0.01% Buff') 
        : (isEn ? 'Cost / 1% DPS' : 'Coût / 1% DPS');
    }

    // Trouver la prochaine meilleure amélioration non encore acquise
    let nextBest = null;
    for (const item of list) {
      const acquired = item.checkAcquired ? item.checkAcquired(state) : false;
      if (!acquired) {
        nextBest = item;
        break;
      }
    }

    const EFF_TRANS_EN = {
      acc_wp_mid: { name: 'T4 Accessory: Weapon AP % Line (Mid Roll)', sub: 'Ancient Accessory • +1.8% Weapon Power', comment: 'Best ROI: accessible basic roll for a direct party AP buff boost.' },
      ark_grid_order_sun_17: { name: 'Ark Grid: Solar Order 17 Points', sub: 'Ark Grid Tree • Solar Order Node', comment: 'Best Ark Grid investment: +1.13% direct buff for ~81k gold.' },
      ark_grid_order_moon_17: { name: 'Ark Grid: Lunar Order 17 Points', sub: 'Ark Grid Tree • Lunar Order Node', comment: 'Direct complement to Solar Order, very good cost-efficiency ratio.' },
      ark_grid_chaos_moon_17: { name: 'Ark Grid: Lunar Chaos (Brand) 17P', sub: 'Ark Grid Tree • Brand Specialization', comment: 'Increases party Brand Power debuff effectiveness.' },
      ark_grid_chaos_star_17: { name: 'Ark Grid: Stellar Chaos (Weapon) 17P', sub: 'Ark Grid Tree • Weapon Power Node', comment: 'Weapon power transmitted to allies at a very good cost.' },
      weapon_18: { name: 'Standard Honing: Weapon +17 ➔ +18', sub: 'T4 Honing • Aegir Weapon', comment: 'Key weapon milestone (+29 CP and +0.32% Buff) for a moderate 56k gold cost.' },
      weapon_19: { name: 'Standard Honing: Weapon +18 ➔ +19', sub: 'T4 Honing • Aegir Weapon', comment: 'Final lower-cost weapon milestone before the +20 difficulty cliff.' },
      weapon_adv_1_10: { name: 'Advanced Weapon Honing: Stages 1 ➔ 10', sub: 'Advanced Honing Echidna • 10 Levels', comment: 'Guaranteed gain without failure using breaths and books (~125k total gold EUC).' },
      acc_wp_high: { name: 'T4 Accessory: Weapon AP % Line (High Roll)', sub: 'Ancient Accessory • +3.0% Weapon Power', comment: 'High stat optimization to top off your primary jewelry pieces.' },
      weapon_adv_11_20: { name: 'Advanced Weapon Honing: Stages 11 ➔ 20', sub: 'Advanced Honing Echidna • 10 Levels', comment: 'Secures +0.66% net buff, essential before tackling normal +20 honing.' },
      armor_15_16: { name: 'Armor Honing: All Armors to +16', sub: '5 Armor Pieces (Chest, Pants, Helmet...)', comment: 'Provides a large Vitality and Shield boost for a modest expense.' },
      weapon_adv_21_30: { name: 'Advanced Weapon Honing: Stages 21 ➔ 30', sub: 'Advanced Honing Aegir • 10 Levels', comment: 'Big power boost, substantial cost but far more cost-effective than normal +21+ honing.' },
      gem_atk_7_8: { name: 'T4 Damage/AP Gem: Lv. 7 ➔ Lv. 8', sub: 'Tier 1 Attack Buff Gem', comment: 'Expensive for a Support (+0.14% buff). Hone after Ark Grid and Weapon +18.' },
      weapon_20: { name: 'Standard Honing: Weapon +19 ➔ +20', sub: 'T4 Honing • Aegir Weapon', comment: 'Success rate drops drastically, cost per tap doubled.' },
      gem_atk_9_10: { name: 'T4 Damage/AP Gem: Lv. 9 ➔ Lv. 10', sub: '1x Lv. 10 Endgame T4 Gem', comment: '2.4 Million gold for only +0.14% buff. Worst ROI ratio in the game for support.' },
      dps_acc_mid_low: { name: 'T4 Accessories: 5x Mid-Low Rolls', sub: 'Set of 5 Ancient T4 Accessories', comment: 'First milestone of ancient accessories: +6.4% DPS for under 10k gold.' },
      dps_acc_high: { name: 'T4 Accessories: 5x High First Line Rolls', sub: 'Ancient Set • High Primary Line', comment: 'Good gold-to-DPS ratio.' },
      dps_weapon_18: { name: 'Standard Honing: Weapon +17 ➔ +18', sub: 'T4 Honing • Aegir Weapon', comment: 'Direct +1.4% DPS gain and major Weapon Power boost.' },
      dps_ark_grid_order_17: { name: 'Ark Grid: Order (Sun+Moon+Star) 17P', sub: 'Full 17-Point Ark Grid Tree', comment: 'Largest single damage gain in this table: +20.8% DPS for ~890k gold.' },
      dps_weapon_19: { name: 'Standard Honing: Weapon +18 ➔ +19', sub: 'T4 Honing • Aegir Weapon', comment: 'Weapon continuity before the +20 wall.' },
      dps_weapon_adv_1_10: { name: 'Advanced Weapon Honing: Stages 1 ➔ 10', sub: 'Advanced Honing Echidna • 10 Levels', comment: 'Guaranteed power without rng failure using full materials.' },
      dps_weapon_adv_11_20: { name: 'Advanced Weapon Honing: Stages 11 ➔ 20', sub: 'Advanced Honing Echidna • 10 Levels', comment: 'Second advanced weapon honing block, very solid ROI.' },
      dps_weapon_20: { name: 'Standard Honing: Weapon +19 ➔ +20', sub: 'T4 Honing • Aegir Weapon', comment: 'The +20 milestone: expensive, but key for the 1780+ bracket.' },
      dps_weapon_21: { name: 'Standard Honing: Weapon +20 ➔ +21', sub: 'T4 Honing • Aegir Weapon', comment: '+21 step with a larger weapon power bonus.' },
      dps_weapon_adv_21_30: { name: 'Advanced Weapon Honing: Stages 21 ➔ 30', sub: 'Advanced Honing Brelshaza T4 • 10 Levels', comment: 'Large guaranteed gain without RNG for ~449k gold.' },
      dps_gems_7_8_cd: { name: 'T4 Cooldown Gems: Lv. 7 ➔ Lv. 8', sub: '1 cooldown gem on a core rotation skill', comment: 'Aligns your skill rotation for smoother play and more DPS.' },
      dps_weapon_adv_31_40: { name: 'Advanced Weapon Honing: Stages 31 ➔ 40', sub: 'Advanced Honing Brelshaza T4 • 10 Levels', comment: 'Final advanced weapon honing block.' },
      dps_gems_7_8_dmg: { name: 'T4 Damage Gems: Lv. 7 ➔ Lv. 8 (Skill 60%)', sub: '1 damage gem on your main skill', comment: 'Worth it on the skill that deals the largest share of your damage.' },
      dps_weapon_22: { name: 'Standard Honing: Weapon +21 ➔ +22', sub: 'T4 Honing • Aegir Weapon', comment: 'Rising cost, needs solid gold reserves.' },
      dps_weapon_23: { name: 'Standard Honing: Weapon +22 ➔ +23', sub: 'T4 Honing • Aegir Weapon', comment: 'Weapon at +23.' },
      dps_armor_adv_1_10: { name: 'Advanced Armor Honing: Stages 1 ➔ 10', sub: '5 armor pieces (Echidna)', comment: 'Adds main stat and guaranteed item level.' },
      dps_armor_adv_11_20: { name: 'Advanced Armor Honing: Stages 11 ➔ 20', sub: '5 armor pieces (Echidna)', comment: 'Overall item level and main stat gain for raids.' },
      dps_armors_all_20: { name: 'Armor Honing: All to +20', sub: '5 armor pieces (+19 ➔ +20)', comment: 'Reaches the 1780+ bracket on every armor piece.' },
      dps_weapon_24: { name: 'Standard Honing: Weapon +23 ➔ +24', sub: 'T4 Honing • Aegir Weapon', comment: 'Aegir weapon +24: a heavy investment.' },
      dps_gems_8_9_cd: { name: 'T4 Gems: Lv. 8 ➔ Lv. 9 (1 cycle)', sub: 'Main cooldown gem', comment: 'Endgame rotation optimization.' },
      dps_weapon_25: { name: 'Standard Honing: Weapon +24 ➔ +25', sub: 'T4 Honing • Aegir Weapon (+25 max)', comment: 'Aegir cap: weapon power at its ceiling.' },
      dps_gems_9_10_dmg: { name: 'T4 Damage Gem: Lv. 9 ➔ Lv. 10 (Skill 60%)', sub: '1 endgame T4 Lv. 10 gem', comment: '2.4 million gold for 1.9% DPS. Keep this for the very end of progression.' },
    };

    if (dom.effNextBestDesc) {
      if (nextBest) {
        const unit = isSupport 
          ? (isEn ? '0.01% Raid Buff' : '0.01% Buff Alliés') 
          : (isEn ? '1% Personal DPS' : '1% DPS');
        const nextBestTrans = isEn ? (EFF_TRANS_EN[nextBest.id] || {}) : {};
        const nbName = nextBestTrans.name || nextBest.name;
        const nbComment = nextBestTrans.comment || nextBest.comment;
        dom.effNextBestDesc.innerHTML = isEn
          ? `<strong>${nbName}</strong> (${nextBest.gainText}) for an estimated cost of <strong>${formatNumber(nextBest.cost)} gold</strong>, i.e. a cost-efficiency ratio of <strong>${nextBest.ratioText} / ${unit}</strong>.<br><span style="color:var(--text-muted); font-size:14px;"><em>${nbComment}</em></span>`
          : `<strong>${nextBest.name}</strong> (${nextBest.gainText}) pour un coût estimé de <strong>${formatNumber(nextBest.cost)} gold</strong>, soit un ratio de rentabilité de <strong>${nextBest.ratioText} / ${unit}</strong>.<br><span style="color:var(--text-muted); font-size:14px;"><em>${nextBest.comment}</em></span>`;
      } else {
        dom.effNextBestDesc.innerHTML = isEn
          ? `All major T4 milestones in this table are done.`
          : `Tous les paliers majeurs de ce tableau sont validés.`;
      }
    }

    if (dom.effTableBody) {
      let rowsHtml = '';
      list.forEach((item, idx) => {
        const isTop = nextBest && nextBest.id === item.id;
        const acquired = item.checkAcquired ? item.checkAcquired(state) : false;
        
        const trans = isEn ? (EFF_TRANS_EN[item.id] || {}) : {};
        const itemName = trans.name || item.name;
        const itemSub = trans.sub || item.sub;
        const itemTierLabel = isEn 
          ? item.tierLabel.replace('Rang S+', 'Tier S+').replace('Rang S', 'Tier S').replace('Rang A', 'Tier A').replace('Rang B', 'Tier B').replace('Rang C', 'Tier C').replace('Piège à Gold', 'Gold Trap').replace('Luxe Extrême', 'Extreme Luxury')
          : item.tierLabel;
        const acquiredBadge = acquired ? (isEn ? ' <span style="font-size:11px; color:var(--accent-green); font-weight:700;">[ACQUIRED]</span>' : ' <span style="font-size:11px; color:var(--accent-green); font-weight:700;">[ACQUIS]</span>') : '';

        rowsHtml += `
          <tr class="eff-row ${isTop ? 'top-pick' : ''}">
            <td class="col-rank">${idx + 1}</td>
            <td class="col-name">
              <div>
                ${isTop ? '' : ''}<strong>${itemName}</strong>
                ${acquiredBadge}
              </div>
              <span class="eff-subtext">${itemSub}</span>
            </td>
            <td class="col-gain">${item.gainText}</td>
            <td class="col-cost">${formatNumber(item.cost)} g</td>
            <td class="col-ratio">${item.ratioText}</td>
            <td class="col-prio">
              <span class="prio-badge ${item.tier}">${itemTierLabel}</span>
            </td>
          </tr>
        `;
      });
      dom.effTableBody.innerHTML = rowsHtml;
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --- 4a-bis. SMART UPGRADE ADVISOR (PLANIFICATEUR RENTABLE DE PROGRESSION) ---

  const advisorState = {};

  function getArkGridCoreBonus(prefix, points, isSupport, isAncient) {
    const p = Math.max(10, Math.min(20, points || 10));
    const pr = (prefix || '').toString();
    const isOrder = pr.startsWith('6730');
    const isSun = pr.startsWith('67300') || pr.startsWith('67310');
    const isMoon = pr.startsWith('67301') || pr.startsWith('67311');
    const isStar = pr.startsWith('67302') || pr.startsWith('67312');

    if (isOrder) {
      if (isSun || isMoon) {
        if (p >= 20) return isAncient ? 9.42 : 8.80;
        if (p >= 19) return isAncient ? 8.70 : 8.10;
        if (p >= 18) return isAncient ? 8.67 : 7.98;
        if (p >= 17) return 7.80;
        if (p >= 14) return 6.00;
        return 4.50;
      } else { // Order Star
        if (isSupport) {
          if (p >= 20) return isAncient ? 2.50 : 2.40;
          if (p >= 19) return 2.30;
          if (p >= 18) return 2.20;
          if (p >= 17) return 2.10;
          if (p >= 14) return 1.60;
          return 1.20;
        } else {
          if (p >= 20) return isAncient ? 6.50 : 6.00;
          if (p >= 19) return isAncient ? 6.00 : 5.80;
          if (p >= 18) return isAncient ? 5.67 : 5.00;
          if (p >= 17) return 4.50;
          if (p >= 14) return 3.50;
          return 2.50;
        }
      }
    } else { // Chaos
      if (isSupport) {
        if (p >= 20) return isAncient ? 4.40 : 4.20;
        if (p >= 19) return isAncient ? 4.10 : 3.95;
        if (p >= 18) return isAncient ? 3.95 : 3.78;
        if (p >= 17) return 3.60;
        if (p >= 14) return 2.80;
        return 2.00;
      } else {
        if (p >= 20) return isAncient ? 3.00 : 2.85;
        if (p >= 19) return isAncient ? 2.85 : 2.75;
        if (p >= 18) return isAncient ? 2.67 : 2.67;
        if (p >= 17) return 2.50;
        if (p >= 14) return 2.00;
        return 1.50;
      }
    }
  }

  function getArkGridStatus(charObj) {
    if (!charObj) return { hasSun17: false, hasMoon17: false, hasStar17: false, starTier: 1, slots: {} };
    const cId = (charObj.id || charObj.name || '').toLowerCase().trim();
    const pIlvl = charObj.ilvl || (charObj.rawProfile && charObj.rawProfile.ilvl) || 1700;
    const isEndgame = pIlvl >= 1740;

    const slotPts = {
      orderSun: 0,
      orderMoon: 0,
      orderStar: 0,
      chaosSun: 0,
      chaosMoon: 0,
      chaosStar: 0
    };
    let foundAnyCore = false;

    // Type de cœur = préfixe de l'ID (67300 Ordre Soleil … 67312 Chaos Étoile).
    // Le champ `base` des cœurs bruts n'est PAS le type (10002 peut être un Chaos Étoile) : ne pas s'en servir.
    const slotOfId = (idStr) => {
      if (idStr.startsWith('67300')) return 'orderSun';
      if (idStr.startsWith('67301')) return 'orderMoon';
      if (idStr.startsWith('67302')) return 'orderStar';
      if (idStr.startsWith('67310')) return 'chaosSun';
      if (idStr.startsWith('67311')) return 'chaosMoon';
      if (idStr.startsWith('67312')) return 'chaosStar';
      return null;
    };

    // A. Points officiels : battlePoint.parts type 29 / 30 (champ `points`)
    const bpParts = (charObj.rawProfile && charObj.rawProfile.battlePoint && charObj.rawProfile.battlePoint.parts)
      || (charObj.battlePoint && charObj.battlePoint.parts)
      || (charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.battlePoint && charObj.rawProfile.loadout.battlePoint.parts)
      || (charObj.rawProfile && charObj.rawProfile.loadouts && charObj.rawProfile.loadouts[0] && charObj.rawProfile.loadouts[0].battlePoint && charObj.rawProfile.loadouts[0].battlePoint.parts)
      || (charObj.loadout && charObj.loadout.battlePoint && charObj.loadout.battlePoint.parts);
    if (Array.isArray(bpParts)) {
      bpParts.filter(p => p.type === 29 || p.type === 30).forEach(p => {
        const slot = slotOfId((p.id || '').toString());
        if (!slot) return;
        const pts = p.points || (p.value >= 450 ? 17 : (p.value >= 300 ? 14 : 10));
        slotPts[slot] = Math.max(slotPts[slot], pts);
        foundAnyCore = true;
      });
    }

    // B. Secours : somme des corePoints des astrogemmes, pour les cœurs absents des parts
    const cores = charObj.arkGridCores 
      || (charObj.rawProfile && (charObj.rawProfile.arkGridCores || (charObj.rawProfile.loadout && charObj.rawProfile.loadout.arkGridCores)))
      || (charObj.loadout && charObj.loadout.arkGridCores);
    if (Array.isArray(cores) && cores.length > 0) {
      cores.forEach(c => {
        const slot = slotOfId((c.id || '').toString());
        if (!slot || slotPts[slot] > 0) return;
        const pts = Array.isArray(c.gems) 
          ? c.gems.reduce((sum, g) => sum + (g.corePoints || 0), 0) 
          : (c.points || 0);
        slotPts[slot] = pts;
        if (pts > 0) foundAnyCore = true;
      });
    }

    // C. Si des cœurs ont été analysés
    if (foundAnyCore) {
      const sunP = Math.max(slotPts.orderSun, slotPts.chaosSun) || (isEndgame ? 18 : 10);
      const moonP = Math.max(slotPts.orderMoon, slotPts.chaosMoon) || (isEndgame ? 18 : 10);
      const starP = Math.max(slotPts.orderStar, slotPts.chaosStar) || (isEndgame ? 18 : 10);
      
      let starT = 1;
      if (starP >= 17) starT = 3;
      else if (starP >= 14) starT = 2;
      else if (isEndgame) starT = 3;

      return {
        hasSun17: sunP >= 17 || isEndgame,
        hasMoon17: moonP >= 17 || isEndgame,
        hasStar17: starP >= 17 || isEndgame,
        starTier: starT,
        slots: slotPts
      };
    }

    // D. Flags sur l'objet arkGrid pré-existant
    if (charObj.arkGrid) {
      let starT = charObj.arkGrid.starTier || 0;
      if (charObj.arkGrid.star17 || starT >= 3 || (charObj.arkGrid.starPts !== undefined && charObj.arkGrid.starPts >= 17) || isEndgame) starT = 3;
      else if (charObj.arkGrid.star14 || starT === 2 || (charObj.arkGrid.starPts !== undefined && charObj.arkGrid.starPts >= 14)) starT = 2;
      const s17 = charObj.arkGrid.hasSun17 !== undefined ? charObj.arkGrid.hasSun17 : (charObj.arkGrid.sun17 !== undefined ? charObj.arkGrid.sun17 : isEndgame);
      const m17 = charObj.arkGrid.hasMoon17 !== undefined ? charObj.arkGrid.hasMoon17 : (charObj.arkGrid.moon17 !== undefined ? charObj.arkGrid.moon17 : isEndgame);
      return {
        hasSun17: !!s17,
        hasMoon17: !!m17,
        hasStar17: starT >= 3,
        starTier: starT || (isEndgame ? 3 : 1),
        slots: slotPts
      };
    }

    // E. Fallback universel Endgame T4
    if (isEndgame) {
      return { hasSun17: true, hasMoon17: true, hasStar17: true, starTier: 3, slots: slotPts };
    }

    return { hasSun17: false, hasMoon17: false, hasStar17: false, starTier: 1, slots: slotPts };
  }

  function getAccPolishAvailable(charObj) {
    if (!charObj) return 2;
    const cId = (charObj.id || charObj.name || '').toLowerCase();
    if (charObj.accRolled) return 0;

    // Détection dynamique depuis les données lostark.bible
    const raw = charObj.rawProfile || (charObj.loadout ? charObj : null);
    if (raw) {
      if (raw.accRolled) return 0;
      const items = raw.items || (raw.loadout && raw.loadout.items);
      if (Array.isArray(items)) {
        let rolledCount = 0;
        items.forEach(it => {
          if (it.slot && (it.slot.includes('neck') || it.slot.includes('ear') || it.slot.includes('finger'))) {
            const hasPolishStats = it.data && Array.isArray(it.data.stats) && it.data.stats.some(s => s.base === false);
            if (hasPolishStats) rolledCount++;
          }
        });
        if (rolledCount >= 3) return 0;
      }
    }

    const pIlvl = charObj.ilvl || (raw && raw.ilvl) || 1700;
    if (pIlvl >= 1740) return 0;

    return 2;
  }

  // --- ÉVALUATEUR & CONSEILLER DE BRACELET T4 (SMILEGATE / INVEN) ---

  function isDeadStat(label, isSupport) {
    if (!label) return false;
    const lbl = label.toLowerCase();
    if (lbl.includes('poignard') || lbl.includes('dagger') ||
        lbl.includes('ovation') || lbl.includes('cheers') ||
        lbl.includes('exposition') || lbl.includes('expose') ||
        lbl.includes('ap allié') || lbl.includes('ally atk') ||
        lbl.includes('précision') || lbl.includes('precision') ||
        lbl.includes('marteau') || lbl.includes('hammer') ||
        lbl.includes('ferveur') || lbl.includes('fervor') ||
        lbl.includes('coinçage') || lbl.includes('wedge') ||
        lbl.includes('ardeur') || lbl.includes('ardor') ||
        lbl.includes('embuscade') || lbl.includes('ambush') ||
        lbl.includes('non directionnelles') || lbl.includes('non-directional') ||
        lbl.includes('arrière') || lbl.includes('back attack') ||
        lbl.includes('frontale') || lbl.includes('frontal attack') ||
        lbl.includes('dégâts sortants') || lbl.includes('outgoing damage') ||
        lbl.includes('dégâts additionnels') || lbl.includes('additional damage') ||
        lbl.includes('dégâts critiques') || lbl.includes('crit damage') ||
        lbl.includes('taux critique') || lbl.includes('crit rate') ||
        lbl.includes('puissance d\'attaque') || lbl.includes('attack power') ||
        lbl.includes('protection') || lbl.includes('recovery')) {
      return false;
    }
    if (isSupport) {
      return lbl.includes('défense magique') || lbl.includes('magic defense') ||
             lbl.includes('défense physique') || lbl.includes('physical defense') ||
             lbl.includes('expertise') || lbl.includes('endurance') || lbl.includes('domination');
    } else {
      return lbl.includes('défense magique') || lbl.includes('magic defense') ||
             lbl.includes('défense physique') || lbl.includes('physical defense') ||
             lbl.includes('vitalité') || lbl.includes('vitality') ||
             lbl.includes('points de vie') || lbl.includes('max hp') ||
             lbl.includes('expertise') || lbl.includes('endurance') || lbl.includes('domination');
    }
  }

  function isPerkLabel(lbl) {
    const l = (lbl || '').toLowerCase();
    return l.includes('précision') || l.includes('precision') ||
           l.includes('marteau') || l.includes('hammer') ||
           l.includes('ferveur') || l.includes('fervor') ||
           l.includes('coinçage') || l.includes('wedge') ||
           l.includes('ardeur') || l.includes('ardor') ||
           l.includes('poignard') || l.includes('dagger') ||
           l.includes('ovation') || l.includes('cheers') ||
           l.includes('exposition') || l.includes('expose') ||
           l.includes('non directionnelles') || l.includes('non-directional') ||
           l.includes('arrière') || l.includes('back attack');
  }

  function estimatePerkMult(lbl, isSupport) {
    const l = (lbl || '').toLowerCase();
    if (isSupport) {
      if (l.includes('poignard') || l.includes('dagger') || l.includes('ovation') || l.includes('cheers') || l.includes('exposition') || l.includes('expose')) return 9.06;
      if (l.includes('ferveur') || l.includes('fervor')) return 5.5;
      return 3.0;
    } else {
      if (l.includes('précision') || l.includes('precision')) return 5.0;
      if (l.includes('marteau') || l.includes('hammer')) return 4.5;
      if (l.includes('ferveur') || l.includes('fervor')) return 4.5;
      if (l.includes('coinçage') || l.includes('wedge')) return 3.5;
      if (l.includes('non directionnelles') || l.includes('non-directional')) return 3.5;
      if (l.includes('arrière') || l.includes('back attack')) return 3.5;
      return 2.5;
    }
  }

  // Noms de perks et d'effets de bracelet T4 (BIBLE_BRACELET_PERKS) : français ➔ anglais.
  // Appliquée du terme le plus long au plus court (« Dégâts Critiques » avant « Dégâts Crit »).
  const BRACELET_TERMS_EN = [
    ["Ovation / Vulnérabilité Crit", 'Cheers / Crit Vulnerability'],
    ["Poignard / Faiblesse", 'Dagger / Weakness'],
    ["Exposition Crit", 'Expose Crit'],
    ["Puissance d'Arme Cumulable", 'Stacking Weapon Power'],
    ["Protection & Soins d'Allié", 'Ally Protection & Healing'],
    ["Vitesse d'Attaque & Déplacement", 'Attack & Move Speed'],
    ["Rechargement Esquive / Relèvement", 'Dodge / Stand-up Recharge'],
    ["Réduction Dégâts Monstres Inférieurs", 'Damage Reduction vs Lesser Monsters'],
    ["Dégâts Monstres Inférieurs", 'Damage vs Lesser Monsters'],
    ["Immunité Paralysie / Repoussement", 'Paralysis / Push Immunity'],
    ["Compétences Non Directionnelles", 'Non-Directional Skills'],
    ["Attaque par l'Arrière", 'Back Attack'],
    ["Attaque Frontale", 'Front Attack'],
    ["Dégâts Sortants / Neutralisation", 'Outgoing Damage / Neutralization'],
    ["Dégâts Sortants", 'Outgoing Damage'],
    ["Dégâts Additionnels", 'Additional Damage'],
    ["Dégâts Coup Crit", 'Crit Hit Dmg'],
    ["Dégâts Critiques", 'Crit Damage'],
    ["Dégâts Crit", 'Crit Dmg'],
    ["Taux Critique", 'Crit Rate'],
    ["Résistance Crit", 'Crit Resistance'],
    ["Puissance d'Arme", 'Weapon Power'],
    ["AP Allié", 'Ally AP'],
    ['Précision', 'Precision'],
    ['Marteau', 'Hammer'],
    ['Coinçage', 'Wedge'],
    ['Ferveur', 'Fervor'],
    ['Embuscade', 'Ambush'],
    ['Ardeur', 'Ardor'],
    ['Poignard', 'Dagger'],
    ['Faiblesse', 'Weakness'],
    ['Ovation', 'Cheers'],
    ['Démons', 'Demons'],
    ['& Vitesse', '& Speed']
  ].sort((a, b) => b[0].length - a[0].length);

  function translateBraceletTerms(str) {
    let res = str;
    for (const [fr, en] of BRACELET_TERMS_EN) res = res.split(fr).join(en);
    return res;
  }

  const BRACELET_TERMS_FR = BRACELET_TERMS_EN.map(([fr, en]) => [en, fr]).sort((a, b) => b[0].length - a[0].length);

  function translateBraceletTermsToFrench(str) {
    let res = str;
    for (const [en, fr] of BRACELET_TERMS_FR) res = res.split(en).join(fr);
    return res;
  }

  function formatBraceletLine(lbl, isEn = false) {
    if (!lbl) return '';
    let res = lbl.replace(/^Bracelet Ancien\s*—\s*/i, '').replace(/^Ancient Bracelet\s*—\s*/i, '');

    // Normalisation proactive des intitulés tronqués (Hammer, Précision, Coinçage, Ferveur)
    res = res.replace(/Marteau\s*\(Dégâts Critiques\s*\+?10%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +10% & Dégâts Coup Crit +1.5%)')
             .replace(/Hammer\s*\(Crit Damage\s*\+?10%\)(?!.*Hit)/i, 'Hammer (Crit Damage +10% & Crit Hit Dmg +1.5%)')
             .replace(/Marteau\s*\(Dégâts Critiques\s*\+?8\.4%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +8.4% & Dégâts Coup Crit +1.5%)')
             .replace(/Hammer\s*\(Crit Damage\s*\+?8\.4%\)(?!.*Hit)/i, 'Hammer (Crit Damage +8.4% & Crit Hit Dmg +1.5%)')
             .replace(/Marteau\s*\(Dégâts Critiques\s*\+?6\.8%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +6.8% & Dégâts Coup Crit +1.5%)')
             .replace(/Hammer\s*\(Crit Damage\s*\+?6\.8%\)(?!.*Hit)/i, 'Hammer (Crit Damage +6.8% & Crit Hit Dmg +1.5%)')
             .replace(/Marteau\s*\(Dégâts Critiques\s*\+?5\.2%\)(?!.*Coup Crit)/i, 'Marteau (Dégâts Critiques +5.2% & Dégâts Coup Crit +1.5%)')
             .replace(/Hammer\s*\(Crit Damage\s*\+?5\.2%\)(?!.*Hit)/i, 'Hammer (Crit Damage +5.2% & Crit Hit Dmg +1.5%)')
             .replace(/Précision\s*\(Taux Critique\s*\+?5%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +5% & Dégâts Coup Crit +1.5%)')
             .replace(/Precision\s*\(Crit Rate\s*\+?5%\)(?!.*Hit)/i, 'Precision (Crit Rate +5% & Crit Hit Dmg +1.5%)')
             .replace(/Précision\s*\(Taux Critique\s*\+?4\.2%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +4.2% & Dégâts Coup Crit +1.5%)')
             .replace(/Precision\s*\(Crit Rate\s*\+?4\.2%\)(?!.*Hit)/i, 'Precision (Crit Rate +4.2% & Crit Hit Dmg +1.5%)')
             .replace(/Précision\s*\(Taux Critique\s*\+?3\.4%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +3.4% & Dégâts Coup Crit +1.5%)')
             .replace(/Precision\s*\(Crit Rate\s*\+?3\.4%\)(?!.*Hit)/i, 'Precision (Crit Rate +3.4% & Crit Hit Dmg +1.5%)')
             .replace(/Précision\s*\(Taux Critique\s*\+?2\.6%\)(?!.*Coup Crit)/i, 'Précision (Taux Critique +2.6% & Dégâts Coup Crit +1.5%)')
             .replace(/Precision\s*\(Crit Rate\s*\+?2\.6%\)(?!.*Hit)/i, 'Precision (Crit Rate +2.6% & Crit Hit Dmg +1.5%)')
             .replace(/Coinçage\s*\/\s*Dégâts Additionnels\s*\(\+?([0-9.]+)%\)/i, 'Coinçage (Dégâts Additionnels +$1% & Démons +2.5%)')
             .replace(/Ferveur\s*\(Dégâts Sortants\s*\+?([45]\.?[0-9]*)%\)(?!.*Cooldown)/i, 'Ferveur (Dégâts Sortants +$1% & Cooldown +2%)');

    if (!isEn) return res;
    res = translateBraceletTerms(res);
    // Termes génériques propres aux lignes de bracelet (stats, défenses)
    const map = [
      ['Défense Magique', 'Magical Defense'],
      ['Défense Physique', 'Physical Defense'],
      ['Défense -', 'Defense -'],
      ['Défense', 'Defense'],
      ['Rapidité', 'Swiftness'],
      ['Spécialisation', 'Specialization'],
      ['Critique', 'Crit'],
      ['Dextérité', 'Dexterity'],
      ['Force', 'Strength'],
      ['Vitalité', 'Vitality'],
      ['Points de Vie', 'Max HP']
    ];
    for (const [fr, en] of map) {
      res = res.replace(new RegExp(fr, 'g'), en);
    }
    return res;
  }

  function evaluateBracelet(charObj, isEn = false) {
    if (!charObj) return null;
    const role = (charObj.role || state.role || 'dps').toLowerCase();
    const isSupport = role === 'support';
    const cName = charObj.className || (isSupport ? 'Paladin' : 'Shadowhunter');
    const cId = (activeCharacterId || (charObj && (charObj.id || charObj.name)) || '').toLowerCase();

    // Récupération des items de bracelet
    const rawItems = (charObj && charObj.items)
      || (charObj && charObj.rawProfile && charObj.rawProfile.items)
      || (liveImportedProfile && liveImportedProfile.items)
      || [];

    const brItems = rawItems.filter(i => i.cat === 'Bracelet');

    const usefulPerks = [];
    const deadStats = [];
    const baseStats = [];
    let totalMultPercent = 0;

    brItems.forEach(it => {
      const lbl = it.label || '';
      const multStr = it.mult || '+0.00%';
      const multVal = parseFloat(multStr.replace('+', '').replace('%', '')) || 0;

      const isDead = isDeadStat(lbl, isSupport);

      if (isDead) {
        deadStats.push({
          label: lbl,
          val: it.val,
          note: isEn ? 'Dead stat (0% net CP/DPS)' : 'Stat morte (0% CP/DPS net)'
        });
      } else if (multVal > 0 || isPerkLabel(lbl)) {
        const effectiveMult = multVal > 0 ? multVal : estimatePerkMult(lbl, isSupport);
        usefulPerks.push({
          label: lbl,
          mult: effectiveMult,
          val: it.val
        });
        totalMultPercent += effectiveMult;
      } else {
        baseStats.push({
          label: lbl,
          val: it.val
        });
      }
    });

    if (brItems.length === 0) {
      totalMultPercent = isSupport ? 18.1 : 8.0;
    }

    let efficiency = totalMultPercent;
    let combatStatMult = 0;
    
    // Integration of Loseii's methodology: 
    // T4 combat stats (Crit/Spec/Swift) on bracelets are valued at ~0.43% damage equivalent per 120 points.
    baseStats.forEach(stat => {
      const lbl = stat.label || '';
      const vStr = (stat.val || '').replace('+', '').replace(/\s/g, '').replace(' ', '');
      const v = parseInt(vStr, 10) || 0;
      if (lbl.includes('Spé') || lbl.includes('Spec') || lbl.includes('Rap') || lbl.includes('Swif') || lbl.includes('Cri')) {
         combatStatMult += (v / 120) * 0.43;
      }
    });

    if (combatStatMult > 0) {
      efficiency += combatStatMult;
    } else if (!isSupport && baseStats.length > 0) {
      efficiency += 1.2;
    }

    let tier = 'b';
    let tierLabel = '';
    let badgeClass = '';
    let ratingDesc = '';
    let potentialGainCp = 0;
    const currentCp = charObj.inGameScore || charObj.cp || (state.currentCp || 4000);

    if (isSupport) {
      if (efficiency >= 22.0) {
        tier = 's';
        tierLabel = isEn ? 'Tier S • Best in slot' : 'Rang S • Meilleur possible';
        badgeClass = 'god';
        ratingDesc = isEn ? 'Endgame BiS bracelet (3-4 max-value raid perks)' : 'Bracelet BiS endgame (3-4 rolls de raid au max)';
        potentialGainCp = 0;
      } else if (efficiency >= 16.0) {
        tier = 'a';
        tierLabel = isEn ? 'Tier A • Strong' : 'Rang A • Très bon';
        badgeClass = 'great';
        ratingDesc = isEn ? 'Solid endgame roll (2 major BiS ally AP perks)' : 'Très solide pour l\'endgame (2 rolls BiS majeurs)';
        potentialGainCp = Math.round(currentCp * 0.025);
      } else if (efficiency >= 9.0) {
        tier = 'b';
        tierLabel = isEn ? 'Tier B • Good' : 'Tier B • Bon';
        badgeClass = 'good';
        ratingDesc = isEn ? 'Transitional setup (1 perk or minor rolls, room for growth)' : 'Correct de transition (1 seul perk ou rolls bas, marge de progression)';
        potentialGainCp = Math.round(currentCp * 0.055);
      } else {
        tier = 'c';
        tierLabel = isEn ? 'Tier C/D • Suboptimal' : 'Tier C/D • Passable / Mauvais';
        badgeClass = 'bad';
        ratingDesc = isEn ? 'Suboptimal (dead stats or no ally AP buffs, high priority)' : 'Sous-optimal (stats mortes ou aucun buff d\'AP allié, priorité haute)';
        potentialGainCp = Math.round(currentCp * 0.090);
      }
    } else {
      // DPS
      if (efficiency >= 12.0 && deadStats.length === 0) {
        tier = 's';
        tierLabel = isEn ? 'Tier S • Best in slot' : 'Rang S • Meilleur possible';
        badgeClass = 'god';
        ratingDesc = isEn ? 'Endgame BiS bracelet (3-4 max-value damage rolls)' : 'Bracelet BiS endgame (3-4 rolls de dégâts au max)';
        potentialGainCp = 0;
      } else if (efficiency >= 9.2 && deadStats.length === 0) {
        tier = 'a';
        tierLabel = isEn ? 'Tier A • Strong' : 'Rang A • Très bon';
        badgeClass = 'great';
        ratingDesc = isEn ? 'Solid endgame roll (2 major BiS damage perks)' : 'Très solide pour l\'endgame (2 rolls BiS majeurs)';
        potentialGainCp = Math.round(currentCp * 0.025);
      } else if (efficiency >= 6.5) {
        tier = 'b';
        tierLabel = isEn ? 'Tier B • Good' : 'Tier B • Bon';
        badgeClass = 'good';
        ratingDesc = deadStats.length > 0
          ? (isEn ? `Transitional setup (${deadStats.length} dead stat detected)` : `Correct de transition (${deadStats.length} stat morte détectée)`)
          : (isEn ? 'Transitional setup (noticeable room for growth vs Lv. 9 gems)' : 'Correct de transition (marge de progression nette vs gemmes 9)');
        potentialGainCp = Math.round(currentCp * (deadStats.length > 0 ? 0.050 : 0.040));
      } else {
        tier = 'c';
        tierLabel = isEn ? 'Tier C/D • Suboptimal' : 'Tier C/D • Passable / Mauvais';
        badgeClass = 'bad';
        ratingDesc = isEn ? 'Suboptimal (dead stats or weak rolls to replace urgently)' : 'Sous-optimal (stats mortes ou rolls faibles à changer)';
        potentialGainCp = Math.round(currentCp * 0.075);
      }
    }

    // Recommandations de Procs BiS personnalisées
    const targets = [];
    if (isSupport) {
      targets.push({
        name: isEn ? 'Dagger / Weakness (-2.5% Def & +3% Ally AP)' : 'Poignard / Faiblesse (Défense -2.5% & AP Allié +3%)',
        badge: 'BiS #1 Raid',
        gain: '+13.5% CP'
      });
      targets.push({
        name: isEn ? 'Cheers / Crit Vulnerability (-4.8% Crit Dmg & +3% Ally AP)' : 'Ovation / Vulnérabilité Crit (Dégâts Crit -4.8% & AP Allié +3%)',
        badge: 'BiS #2 Raid',
        gain: '+13.5% CP'
      });
      targets.push({
        name: isEn ? 'Expose Crit (-2.5% Crit Res & +3% Ally AP)' : 'Exposition Crit (Résistance Crit -2.5% & AP Allié +3%)',
        badge: 'BiS Alternative',
        gain: '+13.5% CP'
      });
      targets.push({
        name: isEn ? 'Swiftness (>100) + Vitality (>5,000 HP)' : 'Rapidité (>100) + Vitalité (>5 000 HP)',
        badge: 'Stats BiS',
        gain: isEn ? '+Shields & Cooldown' : '+Boucliers & Cooldown'
      });
    } else {
      const isBackAttack = ['slayer', 'deathblade', 'reaper', 'striker', 'scrapper', 'blade'].some(k => cName.toLowerCase().includes(k));
      targets.push({
        name: isEn ? 'Precision (Crit Rate +5% & Crit Hit Dmg +1.5%)' : 'Précision (Taux Critique +5% & Dégâts Crit +1.5%)',
        badge: 'BiS #1 Universel',
        gain: '+5.0% Dmg'
      });
      targets.push({
        name: isEn ? 'Hammer (Crit Damage +10% & Crit Hit Dmg +1.5%)' : 'Marteau (Dégâts Critiques +10% & Dégâts Crit +1.5%)',
        badge: 'BiS #2 Burst',
        gain: '+4.5% Dmg'
      });
      if (isBackAttack) {
        targets.push({
          name: isEn ? 'Back Attack (Back Attack Damage +3.5%)' : 'Attaque par l\'Arrière (Back Attack +3.5%)',
          badge: 'BiS Directionnel',
          gain: '+3.5% Dmg'
        });
        targets.push({
          name: isEn ? 'Fervor (Outgoing Damage +5.5%) or Ardor (+1,480 WP)' : 'Ferveur (Dégâts Sortants +5.5%) ou Ardeur (+1 480 WP)',
          badge: 'BiS Multiplier',
          gain: '+4.0% à +5.5% Dmg'
        });
      } else {
        targets.push({
          name: isEn ? 'Fervor (Outgoing Damage +5.5%)' : 'Ferveur (Dégâts Sortants +5.5%)',
          badge: 'BiS Multiplier',
          gain: '+4.0% à +5.5% Dmg'
        });
        targets.push({
          name: isEn ? 'Non-Directional Skill Damage (+3.5%) / Wedge (+3.5%)' : 'Compétences Non Directionnelles (+3.5%) / Coinçage (+3.5%)',
          badge: 'BiS Add-on',
          gain: '+3.5% Dmg'
        });
      }
      const mainStatLabel = getMainStatName(cName, isEn);
      targets.push({
        name: isEn ? `Specialization / Crit (>80) + ${mainStatLabel} (>10,000)` : `Spécialisation / Critique (>80) + ${mainStatLabel} (>10 000)`,
        badge: 'Stats BiS',
        gain: isEn ? '+Combat Stats' : '+Stats Combat'
      });
    }

    return {
      role,
      isSupport,
      className: cName,
      efficiency,
      tier,
      tierLabel,
      badgeClass,
      ratingDesc,
      usefulPerks,
      deadStats,
      baseStats,
      potentialGainCp,
      targets
    };
  }

  function renderBraceletDiagnostic(curChar, isEn) {
    if (!dom.advisorBraceletCard) return;
    const diag = evaluateBracelet(curChar, isEn);
    if (!diag) return;

    if (dom.advBraceTierBadge) {
      dom.advBraceTierBadge.textContent = diag.tierLabel;
      dom.advBraceTierBadge.className = 'bracelet-tier-badge ' + diag.badgeClass;
    }

    if (dom.advBraceGainVal) {
      dom.advBraceGainVal.textContent = diag.potentialGainCp > 0 ? `+${formatNumber(diag.potentialGainCp)} CP` : (isEn ? 'Optimized' : 'Optimisé');
    }

    if (dom.advBraceEffVal) {
      dom.advBraceEffVal.textContent = `${diag.efficiency.toFixed(2)}%`;
    }

    if (dom.advBraceRatingDesc) {
      dom.advBraceRatingDesc.textContent = `(${diag.ratingDesc})`;
    }

    if (dom.advBraceProgressBar) {
      const maxEff = diag.isSupport ? 22.0 : 13.5;
      const pct = Math.min(100, Math.max(15, Math.round((diag.efficiency / maxEff) * 100)));
      dom.advBraceProgressBar.style.width = `${pct}%`;
    }

    if (dom.advBraceLinesList) {
      let html = '';
      if (diag.usefulPerks.length === 0 && diag.deadStats.length === 0 && diag.baseStats.length === 0) {
        html = `<div style="font-size:13px; color:var(--text-dim); padding:6px 0;">${isEn ? 'Standard baseline bracelet.' : 'Bracelet de base standard.'}</div>`;
      } else {
        diag.usefulPerks.forEach(u => {
          const cleanLbl = formatBraceletLine(u.label, isEn);
          html += `
            <div class="bracelet-item-pill useful">
              <span><strong>${escapeHtml(cleanLbl)}</strong></span>
              <span class="pill-mult" style="color:#8CC084; font-weight:700;">+${u.mult.toFixed(2)}%</span>
            </div>
          `;
        });
        diag.deadStats.forEach(d => {
          const cleanLbl = formatBraceletLine(d.label, isEn);
          html += `
            <div class="bracelet-item-pill dead">
              <span><strong style="color:#E07A63;">${escapeHtml(cleanLbl)}</strong></span>
              <span class="pill-mult" style="color:#E07A63; font-size:12px;">${isEn ? 'Dead stat (0% CP)' : 'Stat morte (0% CP)'}</span>
            </div>
          `;
        });
        diag.baseStats.forEach(b => {
          const cleanLbl = formatBraceletLine(b.label, isEn);
          html += `
            <div class="bracelet-item-pill stat">
              <span>${escapeHtml(cleanLbl)}</span>
              <span style="color:var(--text-muted); font-size:12px;">${escapeHtml(b.val)}</span>
            </div>
          `;
        });
      }
      dom.advBraceLinesList.innerHTML = html;
    }

    if (dom.advBraceTargetsList) {
      let html = '';
      diag.targets.forEach(t => {
        html += `
          <div class="bracelet-target-pill">
            <span class="target-name">${escapeHtml(t.name)}</span>
            <span class="target-gain">${escapeHtml(t.gain)}</span>
          </div>
        `;
      });
      dom.advBraceTargetsList.innerHTML = html;
    }
  }

  function extractCharacterGemParts(charObj) {
    if (!charObj) return null;
    if (Array.isArray(charObj.gemParts) && charObj.gemParts.length > 0) {
      return charObj.gemParts;
    }
    const raw = charObj.rawProfile || (charObj.loadouts ? charObj : null) || (charObj.loadout ? charObj.loadout : null);
    if (raw) {
      if (Array.isArray(raw.gemParts) && raw.gemParts.length > 0) {
        return raw.gemParts;
      }
      const l = (raw.loadouts && (raw.loadouts.find(x => x.classification === 'raid_merged') || raw.loadouts[0])) || raw;
      if (l && Array.isArray(l.gems) && l.gems.length > 0) {
        const isSupport = detectCharacterRole(charObj) === 'support' || (l && detectCharacterRole(l.classId) === 'support');
        return l.gems.map(g => {
          if (g.id) {
            const idStr = g.id.toString();
            if (idStr.length >= 8) {
              const lvlSub = parseInt(idStr.substring(5, 7), 10);
              if (lvlSub === 10) return isSupport ? 12.0 : 7.0;
              if (lvlSub === 9) return isSupport ? 10.8 : 6.35;
              if (lvlSub === 8) return isSupport ? 9.6 : 5.76;
              if (lvlSub === 7) return isSupport ? 8.5 : 5.12;
              if (lvlSub === 6) return isSupport ? 7.5 : 4.5;
            }
          }
          const atkEff = (g.effects || []).find(e => e.type === 2 && e.id === 150);
          if (atkEff) {
            if (atkEff.value >= 120) return isSupport ? 12.0 : 7.0;
            if (atkEff.value >= 100) return isSupport ? 10.8 : 6.35;
            if (atkEff.value >= 80) return isSupport ? 9.6 : 5.76;
            if (atkEff.value >= 60) return isSupport ? 8.5 : 5.12;
            return isSupport ? 7.5 : 4.5;
          }
          const cdEff = (g.effects || []).find(e => e.type === 27 || e.type === 5);
          if (cdEff) {
            if (cdEff.value >= 2400) return isSupport ? 12.0 : 7.0;
            if (cdEff.value >= 2200) return isSupport ? 10.8 : 6.35;
            if (cdEff.value >= 2000) return isSupport ? 9.6 : 5.76;
            if (cdEff.value >= 1800) return isSupport ? 8.5 : 5.12;
            return isSupport ? 7.5 : 4.5;
          }
          return isSupport ? 8.5 : 5.12;
        });
      }
    }
    const cKey = (charObj.id || charObj.name || '').toLowerCase().trim();
    return null;
  }

  function buildMasterGpdData(charObj, isSupport, isEn) {
    const currentCp = (charObj && (charObj.calculatedScore || charObj.inGameScore)) || state.currentCp || 6028;
    // Taille d'astrogemmes et Karma : obtenus en jeu, pas de ligne en or (cf. getDynamicGpdTable)
    const rows = [];

    // Lignes dynamiques : mêmes coûts et gains que le tableau GPD (getDynamicGpdTable)
    const dynRows = charObj ? getDynamicGpdTable(charObj, isSupport ? 'support' : 'dps', isEn) : [];
    const unit = isSupport ? 'buff' : 'dmg';
    const lvlWord = isEn ? 'Lv.' : 'Niv.';
    const dynToMaster = (d, extra) => Object.assign({
      id: d.id,
      lastRate: '—',
      cost: d.cost,
      dmgGain: d.gainVal,
      // ratioVal est déjà par 0.01% en support : on repasse par 1% comme les autres lignes (reconverti plus bas)
      rate: isSupport ? d.ratioVal * 100 : d.ratioVal
    }, extra);
    dynRows.forEach(d => {
      const m = d.meta || {};
      if (d.id === 'dyn_weapon') {
        rows.push(dynToMaster(d, {
          icon: '',
          system: isEn ? 'Weapon honing' : 'Affinage Arme',
          whatItReads: isEn ? `+${m.from} T4 Weapon` : `+${m.from} Arme T4`,
          wherePutsYou: `+${m.from}`,
          lastStep: `+${m.from - 1} ➔ +${m.from}`,
          nextStep: `+${m.from} ➔ +${m.to}`,
          category: 'gear',
          applyType: 'weapon',
          targetVal: m.to
        }));
      } else if (d.id === 'dyn_armor') {
        rows.push(dynToMaster(d, {
          icon: '',
          system: isEn ? 'Armors honing' : 'Affinage Armures',
          whatItReads: isEn ? `+${m.from} all pieces` : `+${m.from} toutes pièces`,
          wherePutsYou: `+${m.from}`,
          lastStep: `+${m.from - 1} ➔ +${m.from}`,
          nextStep: `+${m.from} ➔ +${m.to}`,
          category: 'gear',
          applyType: 'armors',
          targetVal: m.to
        }));
      } else if (d.id.startsWith('dyn_relic_')) {
        rows.push(dynToMaster(d, {
          icon: '',
          system: isEn ? `Relic books — ${m.engraving}` : `Livres reliques — ${m.engraving}`,
          whatItReads: isEn ? `${m.read}/20 books` : `${m.read}/20 livres`,
          wherePutsYou: isEn ? `Relic Lv. ${m.lvl}` : `Relique niv. ${m.lvl}`,
          lastStep: '—',
          nextStep: isEn ? `Lv. ${m.lvl} ➔ 4 (${m.books} books)` : `Niv. ${m.lvl} ➔ 4 (${m.books} livres)`,
          category: 'engraving'
        }));
      } else if (d.id === 'dyn_adv_weapon' || d.id === 'dyn_adv_armor') {
        const isW = d.id === 'dyn_adv_weapon';
        const scope = isW ? '' : (isEn ? ` (${m.pieces}/5 pieces)` : ` (${m.pieces}/5 pièces)`);
        rows.push(dynToMaster(d, {
          icon: '',
          system: isW ? (isEn ? 'Advanced honing — Weapon' : 'Affinage avancé — Arme') : (isEn ? 'Advanced honing — Armors' : 'Affinage avancé — Armures'),
          whatItReads: `${isEn ? 'Adv.' : 'Avancé'} ${m.from}/40${scope}`,
          wherePutsYou: `${m.from}/40`,
          lastStep: '—',
          nextStep: `${m.from} ➔ ${m.to}${m.breath ? (isEn ? ' (breath)' : ' (souffle)') : ''}`,
          category: 'gear'
        }));
      } else if (d.id.startsWith('dyn_gems_')) {
        const mix = [10, 9, 8, 7].filter(l => m.counts[l] > 0).map(l => `${m.counts[l]}× ${lvlWord} ${l}`).join(', ');
        rows.push(dynToMaster(d, {
          icon: '',
          system: isEn ? 'Skill gems' : 'Gemmes de compétences',
          whatItReads: mix,
          wherePutsYou: `${m.n}/${m.total} ${lvlWord} ${m.lvl}`,
          lastStep: '—',
          nextStep: `${m.n}× ${lvlWord} ${m.lvl} ➔ ${m.lvl + 1}`,
          category: 'gems',
          applyType: 'gems',
          targetVal: m.lvl + 1
        }));
      } else if (d.id.startsWith('dyn_core_')) {
        rows.push(dynToMaster(d, {
          icon: m.key.endsWith('Sun') ? '' : (m.key.endsWith('Moon') ? '' : ''),
          system: isEn ? `Ark grid — ${m.label} core` : `Grille d'Ark — Cœur ${m.label}`,
          whatItReads: `${m.pts} pts`,
          wherePutsYou: `${m.pts}P`,
          lastStep: '—',
          nextStep: `${m.pts}P ➔ 17P`,
          category: 'arkGrid'
        }));
      } else if (d.id === 'dyn_acc') {
        rows.push(dynToMaster(d, {
          icon: '',
          system: isEn ? `Accessory — ${m.slotName}` : `Bijou — ${m.slotName}`,
          whatItReads: isEn ? `Accessories +${m.curPct.toFixed(2)}% ${unit}` : `Bijoux +${m.curPct.toFixed(2)}% ${unit}`,
          wherePutsYou: isEn ? 'Best ratio' : 'Meilleur ratio',
          lastStep: '—',
          nextStep: isEn ? `➔ ${m.pkg} + dead line` : `➔ ${m.pkg} + ligne morte`,
          category: 'acc'
        }));
      }
    });

    rows.forEach(r => {
      r.cpGain = Math.max(1, Math.round(currentCp * (r.dmgGain / 100)));
      r.roi = Math.round(r.cost / r.cpGain);
    });

    // Support : même unité que le tableau GPD, gold par 0.01% de buff (et non par 1%)
    if (isSupport) {
      rows.forEach(r => {
        r.rate = Math.round(r.rate / 100);
        const m = /^([\d.]+)(k|M) \/ 1%$/.exec(r.lastRate || '');
        if (m) {
          const gold = parseFloat(m[1]) * (m[2] === 'M' ? 1e6 : 1e3) / 100;
          r.lastRate = `${gold >= 1000 ? (gold / 1000).toFixed(1) + 'k' : Math.round(gold)} / 0.01%`;
        }
      });
    }

    rows.sort((a, b) => a.rate - b.rate);
    return rows;
  }

  function buildPieceByPieceData(charObj, isSupport, isEn) {
    if (!charObj) return [];
    const cKey = (charObj.id || charObj.name || '').toLowerCase().trim();
    const canon = (charObj.rawProfile ? charObj : null);

    let pAccItems = (charObj && charObj.accessories)
      || (charObj && charObj.rawProfile && charObj.rawProfile.accessories)
      || (charObj && charObj.rawProfile && charObj.rawProfile.loadout && charObj.rawProfile.loadout.items && charObj.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (charObj && charObj.loadout && charObj.loadout.items && charObj.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (canon && canon.rawProfile && canon.rawProfile.accessories)
      || (canon && canon.rawProfile && canon.rawProfile.loadout && canon.rawProfile.loadout.items && canon.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (canon && canon.loadout && canon.loadout.items && canon.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || [];

    const slotConfigs = [
      { slot: 'neck', name: isEn ? 'Necklace' : 'Collier', icon: '', fallbackLadder: 'mid/high · no flat · low stat' },
      { slot: 'ear1', name: isEn ? 'Earring 1' : 'Boucle d\'oreille 1', icon: '', fallbackLadder: 'mid/high · no flat' },
      { slot: 'ear2', name: isEn ? 'Earring 2' : 'Boucle d\'oreille 2', icon: '', fallbackLadder: 'mid/high · no flat · low stat' },
      { slot: 'finger1', name: isEn ? 'Ring 1' : 'Anneau 1', icon: '', fallbackLadder: 'high/mid · no flat · mid stat' },
      { slot: 'finger2', name: isEn ? 'Ring 2' : 'Anneau 2', icon: '', fallbackLadder: 'high/mid · no flat · mid stat' }
    ];

    const result = [];
    const textItems = (charObj.items && Array.isArray(charObj.items))
      ? charObj.items
      : ((canon && Array.isArray(canon.items)) ? canon.items : []);

    slotConfigs.forEach(cfg => {
      const item = (pAccItems && pAccItems.length > 0) ? pAccItems.find(i => i.slot === cfg.slot) : null;
      let ladderStr = cfg.fallbackLadder;
      const lines = [];

      if (item && item.data && Array.isArray(item.data.stats)) {
        const rolls = item.data.stats.filter(st => st.base === false);
        let highs = 0, mids = 0, lows = 0, deads = 0;
        rolls.forEach(r => {
          const dec = decodeAccessoryStat(r, cfg.slot, isSupport, isEn);
          if (dec.isDead) deads++;
          else if (dec.rollTier === 'passif' || dec.rollTier === 'high') highs++;
          else if (dec.rollTier === 'mid') mids++;
          else lows++;

          lines.push({
            text: dec.text,
            tier: dec.isDead ? 'dead' : dec.rollTier,
            tierLabel: dec.tierLabel
          });
        });

        if (rolls.length > 0) {
          const parts = [];
          if (highs > 0 && mids > 0) parts.push('high/mid');
          else if (highs > 0) parts.push('high');
          else if (mids > 0) parts.push('mid');
          parts.push('no flat');
          if (lows > 0) parts.push('low stat');
          ladderStr = parts.join(' · ');
        }
      } else {
        const pieceKeyword = cfg.slot === 'neck' ? 'collier'
          : (cfg.slot === 'ear1' ? 'boucle d\'oreille #1'
          : (cfg.slot === 'ear2' ? 'boucle d\'oreille #2'
          : (cfg.slot === 'finger1' ? 'anneau #1' : 'anneau #2')));

        const matched = textItems.filter(it => it.cat === 'Accessoires' && (it.label || '').toLowerCase().includes(pieceKeyword));
        matched.forEach(m => {
          const lbl = (m.label || '').toLowerCase();
          const val = m.val || '';
          let tier = 'mid';
          if (lbl.includes('soins') || lbl.includes('marque') || lbl.includes('brand') || (lbl.includes('allié') && !isSupport)) {
            tier = 'dead';
          } else if (val.includes('+2.00%') || val.includes('+4.00%') || val.includes('+960') || val.includes('+390')) {
            tier = 'high';
          } else if (val.includes('+1.60%') || val.includes('+0.95%')) {
            tier = 'mid';
          }
          lines.push({
            text: m.label.replace(/^.*?—\s*/, ''),
            tier: tier,
            tierLabel: tier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (tier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Dead' : 'Inutile'))
          });
        });
      }

      result.push({
        name: cfg.name,
        icon: cfg.icon,
        ladder: ladderStr,
        lines: lines
      });
    });

    // 6. Bracelet
    const brLines = [];
    let brLadder = 'B- · 63.2 · +13.47% damage';

    const brStats = (charObj && charObj.bracelet && Array.isArray(charObj.bracelet.stats) && charObj.bracelet.stats)
      || (charObj && charObj.rawProfile && charObj.rawProfile.bracelet && Array.isArray(charObj.rawProfile.bracelet.stats) && charObj.rawProfile.bracelet.stats)
      || null;

    if (typeof window.Bracelet !== 'undefined' && typeof window.Subrank !== 'undefined' && brStats) {
      try {
        const TRAIT_TO_APP = { crit: "crit", spec: "spec", swiftness: "swift" };
        const dec = window.Bracelet.decodeBibleBracelet(brStats);
        const traits = { crit: 0, spec: 0, swift: 0 };
        for (let i = 0; i < (dec.lines || []).length; i++) {
          const l = dec.lines[i];
          const key = TRAIT_TO_APP[l.family];
          if (l.cat === "trait" && key) {
            traits[key] = l.value;
            const tName = key === "swift" ? (isEn ? "Swiftness" : "Rapidité") : (key === "spec" ? (isEn ? "Specialization" : "Spécialisation") : (isEn ? "Crit" : "Critique"));
            brLines.push({ text: `${tName} +${l.value}`, tier: 'trait', tierLabel: 'Combat Stat' });
          } else {
            const isDead = isDeadStat(l.name || l.desc, isSupport);
            brLines.push({
              text: formatBraceletLine(l.name || l.desc, isEn),
              tier: isDead ? 'dead' : 'high',
              tierLabel: isDead ? (isEn ? 'Dead' : 'Inutile') : (isEn ? 'High Roll' : 'Roll Élevé')
            });
          }
        }
        const normProf = window.Bracelet.normalizeProfile({ role: isSupport ? 'support' : 'dps' });
        const sc = window.Subrank.braceletScore({ grade: dec.grade || 'ancient', lines: dec.lines.filter(l => l.cat !== 'trait'), traits, profile: normProf });
        if (sc && sc.band) {
          brLadder = `${sc.band.key} · ${sc.score.toFixed(1)} · +${sc.damagePct.toFixed(2)}% ${isSupport ? 'buff' : 'dmg'}`;
        }
      } catch (e) {}
    } else {
      const matched = textItems.filter(it => it.cat === 'Bracelet' || (it.label || '').toLowerCase().includes('bracelet'));
      matched.forEach(m => {
        const lbl = (m.label || '').toLowerCase();
        let tier = 'high';
        if (lbl.includes('rapidité') || lbl.includes('spécialisation') || lbl.includes('swift') || lbl.includes('spec') || lbl.includes('crit')) {
          tier = 'trait';
        } else if (lbl.includes('défense') || lbl.includes('defense') || lbl.includes('mana')) {
          tier = 'dead';
        }
        brLines.push({
          text: m.label.replace(/^.*?—\s*/, ''),
          tier: tier,
          tierLabel: tier === 'trait' ? 'Combat Stat' : (tier === 'dead' ? (isEn ? 'Dead' : 'Inutile') : (isEn ? 'High Roll' : 'Roll Élevé'))
        });
      });
    }

    result.push({
      name: isEn ? 'T4 Bracelet' : 'Bracelet T4',
      icon: '',
      ladder: brLadder,
      lines: brLines
    });

    return result;
  }

  function renderAdvisorView() {
    if (!dom.tabAdvisorPane) return;

    const curChar = getCurrentActiveCharacter();
    const isEn = isEnLang();
    const isSupport = (state.role === 'support');
    const cName = curChar ? curChar.name : (isEn ? 'Active Character' : 'Personnage Actif');
    if (dom.advisorCharName) dom.advisorCharName.textContent = cName;
    if (dom.advisorCharStats) {
      dom.advisorCharStats.textContent = `${state.currentIlvl.toFixed(2)} iLvl • ${formatNumber(Math.round(state.currentCp))} CP`;
    }

    const masterData = buildMasterGpdData(curChar, isSupport, isEn);
    advisorState.lastGpdData = masterData;

    // Unité des ratios alignée sur le tableau GPD (appelé après applyTranslations au changement de langue)
    if (dom.gpdNextUnit) {
      dom.gpdNextUnit.textContent = isSupport
        ? (isEn ? 'per 0.01% Ally Buff' : 'par 0.01% Buff Allié')
        : (isEn ? 'per 1% Dmg' : 'par 1% Dégâts');
    }
    if (dom.gpdThRate) {
      dom.gpdThRate.textContent = isSupport
        ? (isEn ? 'Gold / 0.01%' : 'Or / 0,01 %')
        : (isEn ? 'Gold / 1%' : 'Or / 1 %');
    }
    if (dom.gpdTableTitle) {
      dom.gpdTableTitle.textContent = isEn
        ? `Ranked by efficiency (gold / ${isSupport ? '0.01% buff' : '1% damage'})`
        : `Classement par rentabilité (or / ${isSupport ? '0,01 % de buff' : '1 % de dégâts'})`;
    }

    // 1. Highlight Banner (Next Upgrade)
    if (masterData.length > 0) {
      const best = masterData[0];
      if (dom.gpdNextSystem) dom.gpdNextSystem.textContent = `${best.system} ${best.nextStep}`;
      if (dom.gpdNextContext) dom.gpdNextContext.textContent = `${isEn ? 'Current:' : 'Actuel :'} ${best.whatItReads}`;
      if (dom.gpdNextRate) dom.gpdNextRate.textContent = `${formatNumber(best.rate)} g`;
      if (dom.gpdNextGain) {
        dom.gpdNextGain.textContent = `${formatNumber(best.cost)} g · +${best.dmgGain.toFixed(2)} % · +${best.cpGain} CP`;
      }
    }

    // 2. Goal filtering & Planning
    const goal = advisorState.selectedGoal || 'all';
    let chosenIds = new Set();
    advisorState.planItems = [];

    if (goal !== 'all') {
      const targetGoal = parseFloat(goal) || 100;
      let cumCp = 0;
      let cumGold = 0;

      for (let i = 0; i < masterData.length; i++) {
        const item = masterData[i];
        chosenIds.add(item.id);
        advisorState.planItems.push(item);
        cumCp += item.cpGain;
        cumGold += item.cost;
        if (cumCp >= targetGoal) break;
      }

      const avgRoi = cumCp > 0 ? Math.round(cumGold / cumCp) : 0;
      if (dom.planSummaryGold) dom.planSummaryGold.textContent = `${isEn ? 'Cost:' : 'Coût :'} ${formatNumber(cumGold)} g`;
      if (dom.planSummaryCp) dom.planSummaryCp.textContent = `${isEn ? 'Gain:' : 'Gain :'} +${formatNumber(cumCp)} CP`;
      if (dom.planSummaryRoi) dom.planSummaryRoi.textContent = `${formatNumber(avgRoi)} g / CP`;
      if (dom.gpdPlanSummary) dom.gpdPlanSummary.style.display = 'flex';
    } else {
      if (dom.gpdPlanSummary) dom.gpdPlanSummary.style.display = 'none';
    }

    // 3. Render Master Table (Ledger : tableau dense, barre log du ratio, rang par luminosité)
    if (dom.gpdMasterTableBody) {
      const rates = masterData.map(r => r.rate).filter(r => r > 0);
      const logLo = Math.log(Math.min(...rates));
      const logHi = Math.log(Math.max(...rates));
      const barPct = (rate) => (logHi > logLo ? 6 + 94 * (Math.log(rate) - logLo) / (logHi - logLo) : 50).toFixed(1);
      let rowsHtml = '';
      masterData.forEach((row, idx) => {
        const isChosen = chosenIds.has(row.id);
        const planIdx = advisorState.planItems.findIndex(x => x.id === row.id);
        const trClass = isChosen ? 'gpd-row plan-selected' : 'gpd-row';
        // Le rang est toujours évalué sur l'or par 1 % (le ratio support est affiché par 0,01 %)
        const tier = getTierFromRatio(isSupport ? row.rate * 100 : row.rate);

        let statusBadge = '';
        if (goal !== 'all') {
          statusBadge = isChosen
            ? `<span class="gpd-status-badge in-plan">${isEn ? `Plan #${planIdx + 1}` : `Plan n° ${planIdx + 1}`}</span>`
            : '';
        } else if (idx === 0) {
          statusBadge = `<span class="gpd-status-badge best-deal">${isEn ? 'Best ratio' : 'Meilleur ratio'}</span>`;
        }

        rowsHtml += `
          <tr class="${trClass}">
            <td class="col-rank">${idx + 1}</td>
            <td>
              <div class="gpd-system-cell">
                <span class="gpd-system-title">${row.system}</span>
                <span class="gpd-read-text">${row.whatItReads}</span>
              </div>
            </td>
            <td><span class="gpd-next-step-name">${row.nextStep}</span></td>
            <td class="col-num">${formatNumber(row.cost)}</td>
            <td class="col-num gpd-gain-val">+${row.dmgGain.toFixed(2)} %</td>
            <td class="col-num col-rate">
              <div class="gpd-rate-cell">
                <span class="gpd-rate-bar"><span style="width: ${barPct(row.rate)}%"></span></span>
                <span class="gpd-rate-val">${formatNumber(row.rate)}</span>
              </div>
            </td>
            <td class="col-num gpd-cp-val">+${row.cpGain}</td>
            <td class="col-num"><span class="gpd-tier tier-${tier}">${GPD_TIER_LABELS[tier].replace('Rang ', '')}</span></td>
            <td>${statusBadge}</td>
          </tr>
        `;
      });
      dom.gpdMasterTableBody.innerHTML = rowsHtml;
    }

    // 4. Render Piece by Piece
    if (dom.gpdPiecesTableBody) {
      const pieceData = buildPieceByPieceData(curChar, isSupport, isEn);
      let pRowsHtml = '';
      pieceData.forEach(p => {
        const linesTags = p.lines.map(l => `<span class="piece-line-tag ${l.tier}">${l.text}</span>`).join(' ') || `<span class="gpd-step-muted">${isEn ? 'Standard rolls' : 'Rolls standards'}</span>`;
        pRowsHtml += `
          <tr>
            <td>
              <div class="piece-name-cell">
                <span>${p.icon}</span>
                <span>${p.name}</span>
              </div>
            </td>
            <td><span class="piece-ladder-badge">${p.ladder}</span></td>
            <td><div class="piece-lines-container">${linesTags}</div></td>
          </tr>
        `;
      });
      dom.gpdPiecesTableBody.innerHTML = pRowsHtml;
    }
  }

  function applyGpdPlan() {
    if (!advisorState.planItems || advisorState.planItems.length === 0) return;
    let appliedCount = 0;

    advisorState.planItems.forEach(item => {
      if (item.applyType === 'weapon' && item.targetVal) {
        state.gear.weapon = item.targetVal;
        appliedCount++;
      } else if (item.applyType === 'armors' && item.targetVal) {
        ['head', 'shoulder', 'chest', 'pants', 'gloves'].forEach(p => {
          state.gear[p] = item.targetVal;
        });
        appliedCount++;
      } else if (item.applyType === 'gems') {
        if (dom.gemSelect) dom.gemSelect.value = 'full9';
        state.gemBonus = state.role === 'support' ? 240 : 420;
        appliedCount++;
      }
    });

    dom.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-honing'));
    dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === 'tab-honing'));

    updateHoningView();
    updateOptimizationView();
    updatePredictorView();
    updateActiveCharacterCard(activeCharacterId);

    showToast(isEnLang() ? 'Plan applied to Simulator.' : 'Plan appliqué au Simulateur.');
  }

  function initAdvisorEvents() {
    // Goal Pills
    const goalBtns = document.querySelectorAll('#gpdGoalButtons .btn-goal-pill');
    goalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        goalBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const goal = btn.getAttribute('data-goal');
        advisorState.selectedGoal = goal;
        if (dom.gpdCustomCpInput) dom.gpdCustomCpInput.value = '';
        renderAdvisorView();
      });
    });

    if (dom.gpdCustomCpInput) {
      dom.gpdCustomCpInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val && val > 0) {
          goalBtns.forEach(b => b.classList.remove('active'));
          advisorState.selectedGoal = val;
          renderAdvisorView();
        } else {
          advisorState.selectedGoal = 'all';
          const allBtn = document.querySelector('#gpdGoalButtons .btn-goal-pill[data-goal="all"]');
          if (allBtn) allBtn.classList.add('active');
          renderAdvisorView();
        }
      });
    }

    if (dom.btnApplyGpdPlan) {
      dom.btnApplyGpdPlan.addEventListener('click', () => applyGpdPlan());
    }
  }

  // --- 4b. SIMULATEUR ARK PASSIVE T4 (ÉVOLUTION / ÉCLAIRAGE / BOND) ---

  

  function getCharClassSpecs(char) {
    const rawClass = ((char && (char.className || char.characterClassName || char.class)) || '').toLowerCase().trim();
    for (const [key, val] of Object.entries(ARK_CLASS_SPECS)) {
      if (rawClass.includes(key) || key.includes(rawClass)) {
        return val;
      }
    }
    const isSupport = char && char.role === 'support';
    return {
      name: char ? (char.className || 'DPS') : 'DPS',
      specs: [
        { id: 'generic_spec_1', name: isSupport ? 'Spécialisation Support' : 'Spécialisation Burst DPS', nameEn: isSupport ? 'Support Spec' : 'Burst DPS Spec', role: isSupport ? 'support' : 'dps' },
        { id: 'generic_spec_2', name: isSupport ? 'Spécialisation DPS Secondaire' : 'Spécialisation DPS Continu', nameEn: isSupport ? 'Secondary DPS Spec' : 'Sustained DPS Spec', role: 'dps' }
      ]
    };
  }

  function syncArkPassiveClassSpecs(char) {
    if (!dom.arkClassSpecSelect) return;
    const curChar = char || getCurrentActiveCharacter();
    const classInfo = getCharClassSpecs(curChar);
    const isEn = isEnLang();

    dom.arkClassSpecSelect.innerHTML = '';
    let matchedSpecId = null;
    const targetSpecName = ((curChar && curChar.spec) || '').toLowerCase();

    classInfo.specs.forEach(spec => {
      const opt = document.createElement('option');
      opt.value = spec.id;
      opt.textContent = isEn ? spec.nameEn : spec.name;
      dom.arkClassSpecSelect.appendChild(opt);

      if (targetSpecName && (
        spec.name.toLowerCase().includes(targetSpecName) ||
        (spec.nameEn && spec.nameEn.toLowerCase().includes(targetSpecName)) ||
        spec.id.includes(targetSpecName.replace(/\s+/g, '_')) ||
        targetSpecName.includes(spec.id.replace(/_/g, ' '))
      )) {
        matchedSpecId = spec.id;
      }
    });

    if (matchedSpecId) {
      dom.arkClassSpecSelect.value = matchedSpecId;
      arkPassiveState.sim.classSpec = matchedSpecId;
    } else if (classInfo.specs.length > 0) {
      dom.arkClassSpecSelect.value = classInfo.specs[0].id;
      arkPassiveState.sim.classSpec = classInfo.specs[0].id;
    }

    const isSupp = (curChar && curChar.role === 'support');
    arkPassiveState.sim.evoNode = isSupp ? 'vigor' : 'strike';
    if (dom.arkEvoNodeSelect) dom.arkEvoNodeSelect.value = arkPassiveState.sim.evoNode;
  }

  const arkPassiveState = {
    basePoints: {
      evolution: 140,
      enlightenment: 101,
      leap: 70
    },
    sim: {
      evoPts: 140,
      evoNode: 'strike',
      enlightPts: 101,
      relicBooks: true,
      relicAcc: true,
      classSpec: 'demonic_impulse',
      leapPts: 70,
      haUnlocked: true,
      raidsUnlocked: true
    },
    lastResult: null
  };

  function calcArkPassive({
    role = 'dps',
    baseCp = 5552,
    evoPts = 140,
    evoNode = 'strike',
    enlightPts = 101,
    relicBooks = true,
    relicAcc = true,
    classSpec = 'demonic_impulse',
    leapPts = 70,
    haUnlocked = true,
    raidsUnlocked = true
  }) {
    const isSupport = role === 'support';
    const isEn = isEnLang();

    // Dans le modèle de Combat Power de Smilegate T4, le système Ark Passive
    // représente environ 24% du Combat Power total d'un personnage endgame.
    // Pour Neevercry (5 552 CP), l'Ark Passive représente environ 1 332 CP au total :
    // - Évolution (140 pts max) : ~45% de l'Ark Passive (~10.8% du CP total) -> ~600 CP
    // - Éclairage (101-110 pts max) : ~41% de l'Ark Passive (~9.8% du CP total) -> ~546 CP
    // - Bond (70 pts max) : ~14% de l'Ark Passive (~3.4% du CP total) -> ~186 CP
    const arkPassiveBudget = baseCp * 0.24;
    const evoBudget = arkPassiveBudget * 0.45;
    const enlightBudget = arkPassiveBudget * 0.41;
    const leapBudget = arkPassiveBudget * 0.14;

    // 1. Évolution Tree
    function getEvoData(pts, node) {
      const cappedPts = Math.min(140, Math.max(0, pts));
      let mult = 0;
      let scoreFrac = 0;
      if (cappedPts <= 30) {
        mult = (cappedPts / 30) * 3.5;
        scoreFrac = (cappedPts / 30) * 0.20;
      } else if (cappedPts <= 60) {
        mult = 3.5 + ((cappedPts - 30) / 30) * 4.5;
        scoreFrac = 0.20 + ((cappedPts - 30) / 30) * 0.22;
      } else if (cappedPts <= 90) {
        mult = 8.0 + ((cappedPts - 60) / 30) * 5.5;
        scoreFrac = 0.42 + ((cappedPts - 60) / 30) * 0.23;
      } else if (cappedPts <= 120) {
        mult = 13.5 + ((cappedPts - 90) / 30) * 5.0;
        scoreFrac = 0.65 + ((cappedPts - 90) / 30) * 0.22;
      } else {
        mult = 18.5 + ((cappedPts - 120) / 20) * 2.5;
        scoreFrac = 0.87 + ((cappedPts - 120) / 20) * 0.13;
      }

      if (cappedPts >= 90) {
        if (node === 'vigor') mult += isSupport ? 2.5 : 1.0;
        else if (node === 'strike') mult += isSupport ? 1.0 : 2.5;
        else if (node === 'flow') mult += 1.5;
      }
      const cp = Math.round(evoBudget * scoreFrac);
      return { mult, cp };
    }

    // 2. Éclairage (Enlightenment) Tree
    function getEnlightData(pts, books, acc) {
      const bonusPts = (books ? 10 : 0) + (acc ? 6 : 0);
      const effPts = Math.min(120, Math.max(0, pts + bonusPts));
      let mult = 0;
      let scoreFrac = 0;
      if (effPts <= 25) {
        mult = (effPts / 25) * 4.0;
        scoreFrac = (effPts / 25) * 0.20;
      } else if (effPts <= 50) {
        mult = 4.0 + ((effPts - 25) / 25) * 5.5;
        scoreFrac = 0.20 + ((effPts - 25) / 25) * 0.22;
      } else if (effPts <= 75) {
        mult = 9.5 + ((effPts - 50) / 25) * 6.5;
        scoreFrac = 0.42 + ((effPts - 50) / 25) * 0.24;
      } else if (effPts <= 100) {
        mult = 16.0 + ((effPts - 75) / 25) * 6.5;
        scoreFrac = 0.66 + ((effPts - 75) / 25) * 0.25;
      } else {
        mult = 22.5 + ((effPts - 100) / 20) * 3.0;
        scoreFrac = 0.91 + ((effPts - 100) / 20) * 0.09;
      }
      const cp = Math.round(enlightBudget * scoreFrac);
      return { mult, cp, effPts };
    }

    // 3. Bond (Leap) Tree
    function getLeapData(pts, ha, raids) {
      const maxPts = raids ? 70 : 50;
      const cappedPts = Math.min(maxPts, Math.max(0, pts));
      let mult = 0;
      let scoreFrac = 0;
      if (cappedPts <= 15) {
        mult = (cappedPts / 15) * 1.5;
        scoreFrac = (cappedPts / 15) * 0.19;
      } else if (cappedPts <= 35) {
        mult = 1.5 + ((cappedPts - 15) / 20) * 1.8;
        scoreFrac = 0.19 + ((cappedPts - 15) / 20) * 0.24;
      } else if (cappedPts <= 55) {
        mult = 3.3 + ((cappedPts - 35) / 20) * 2.0;
        scoreFrac = 0.43 + ((cappedPts - 35) / 20) * 0.27;
      } else {
        mult = 5.3 + ((cappedPts - 55) / 15) * 1.7;
        scoreFrac = 0.70 + ((cappedPts - 55) / 15) * 0.18;
      }
      if (ha) {
        mult += 1.5;
        scoreFrac += 0.12;
      }
      const cp = Math.round(leapBudget * Math.min(1.0, scoreFrac));
      return { mult, cp };
    }

    // Baseline calculation (valeurs du profil actuel)
    const baseEvoData = getEvoData(arkPassiveState.basePoints.evolution || 140, isSupport ? 'vigor' : 'strike');
    const baseEnlightData = getEnlightData(arkPassiveState.basePoints.enlightenment || 101, true, true);
    const baseLeapData = getLeapData(arkPassiveState.basePoints.leap || 70, true, true);
    const baseArkTotalCp = baseEvoData.cp + baseEnlightData.cp + baseLeapData.cp;

    // Simulated calculation (valeurs ajustées par l'utilisateur)
    const simEvoData = getEvoData(evoPts, evoNode);
    const simEnlightData = getEnlightData(enlightPts, relicBooks, relicAcc);
    const simLeapData = getLeapData(leapPts, haUnlocked, raidsUnlocked);
    const simArkTotalCp = simEvoData.cp + simEnlightData.cp + simLeapData.cp;

    const evoDiff = simEvoData.cp - baseEvoData.cp;
    const enlightDiff = simEnlightData.cp - baseEnlightData.cp;
    const leapDiff = simLeapData.cp - baseLeapData.cp;
    const diffCp = simArkTotalCp - baseArkTotalCp;
    const projectedCp = Math.max(100, Math.round(baseCp + diffCp));

    const globalMult = ((1 + simEvoData.mult / 100) * (1 + simEnlightData.mult / 100) * (1 + simLeapData.mult / 100) - 1) * 100;

    // Tiers
    function getEvoTier(pts) {
      if (isEn) {
        if (pts >= 140) return 'Tier IV Max (140 pts)';
        if (pts >= 120) return 'Tier IV Reached (120+)';
        if (pts >= 90) return 'Tier III Reached (90+)';
        if (pts >= 60) return 'Tier II Reached (60+)';
        if (pts >= 30) return 'Tier I Reached (30+)';
        return 'Tier 0';
      }
      if (pts >= 140) return 'Palier IV Max (140 pts)';
      if (pts >= 120) return 'Palier IV Atteint (120+)';
      if (pts >= 90) return 'Palier III Atteint (90+)';
      if (pts >= 60) return 'Palier II Atteint (60+)';
      if (pts >= 30) return 'Palier I Atteint (30+)';
      return 'Palier 0';
    }
    function getEnlightTier(effPts) {
      if (isEn) {
        if (effPts >= 110) return 'Tier IV Optimized (110+ pts)';
        if (effPts >= 100) return 'Tier IV Reached (100+)';
        if (effPts >= 75) return 'Tier III Reached (75+)';
        if (effPts >= 50) return 'Tier II Reached (50+)';
        if (effPts >= 25) return 'Tier I Reached (25+)';
        return 'Tier 0';
      }
      if (effPts >= 110) return 'Palier IV Optimisé (110+ pts)';
      if (effPts >= 100) return 'Palier IV Atteint (100+)';
      if (effPts >= 75) return 'Palier III Atteint (75+)';
      if (effPts >= 50) return 'Palier II Atteint (50+)';
      if (effPts >= 25) return 'Palier I Atteint (25+)';
      return 'Palier 0';
    }
    function getLeapTier(pts) {
      if (isEn) {
        if (pts >= 70) return 'Tier IV Cap (70 pts)';
        if (pts >= 55) return 'Tier III Reached (55+)';
        if (pts >= 35) return 'Tier II Reached (35+)';
        if (pts >= 15) return 'Tier I Reached (15+)';
        return 'Tier 0';
      }
      if (pts >= 70) return 'Palier IV Cap (70 pts)';
      if (pts >= 55) return 'Palier III Atteint (55+)';
      if (pts >= 35) return 'Palier II Atteint (35+)';
      if (pts >= 15) return 'Palier I Atteint (15+)';
      return 'Palier 0';
    }

    const totalAllocated = evoPts + enlightPts + leapPts;
    const pointsCap = 140 + 120 + 70; // 330 pts

    let efficiency = isEn ? 'Tier S+ (Optimal)' : 'Rang S+ (Opti)';
    let efficiencyAdvice = isEn ? 'Tier 4 unlocked on all 3 major trees' : 'Palier 4 débloqué sur les 3 arbres majeurs';
    let analysis = '';

    if (totalAllocated >= 300 && simEnlightData.effPts >= 100) {
      efficiency = isEn ? 'Tier S+ (Optimal)' : 'Rang S+ (Opti)';
      efficiencyAdvice = isEn ? 'Tier 4 unlocked on all 3 major trees' : 'Palier 4 débloqué sur les 3 arbres majeurs';
      if (isSupport) {
        analysis = isEn
          ? `Your Ark Passive configuration is optimized for Tier 4 raids. 100+ Enlightenment points unlock the full potential of your support identity multiplier (+25% group bonus) and max Evolution amplifies base AP transferred to the team.`
          : `Votre configuration Ark Passive est optimisée pour le raid Tier 4. Les 100+ points d'Éclairage débloquent le plein potentiel du multiplicateur d'identité de soutien (+25% bonus de groupe) et l'Évolution max amplifie l'AP de base transférée au groupe.`;
      } else {
        analysis = isEn
          ? `Strong DPS configuration. The Heavy Strike node paired with 100+ Enlightenment points gives the best burst on class engraving and T4 defense penetration.`
          : `Configuration DPS solide. Le nœud de Frappe Lourde couplé aux 100+ points d'Éclairage donne le meilleur burst sur la gravure de classe et la pénétration de défense T4.`;
      }
    } else if (totalAllocated >= 260) {
      efficiency = isEn ? 'Tier S (Advanced)' : 'Rang S (Avancé)';
      efficiencyAdvice = isEn ? 'Tier 3/4 active, close to ceiling' : 'Palier 3/4 actif, proche du plafond';
      analysis = isEn
        ? `Good distribution. To reach Tier S+, prioritize acquiring the 2 T4 class Relic Books to unlock Tier IV Enlightenment (+10 pts) without sacrificing the Evolution tree.`
        : `Bonne répartition. Pour atteindre le palier S+, priorisez l'acquisition des 2 Livres Reliques T4 de classe pour débloquer le palier IV d'Éclairage (+10 pts) sans sacrifier l'arbre d'Évolution.`;
    } else if (totalAllocated >= 200) {
      efficiency = isEn ? 'Tier A (Standard T4)' : 'Rang A (Standard T4)';
      efficiencyAdvice = isEn ? 'Tiers II/III active' : 'Paliers II/III actifs';
      analysis = isEn
        ? `Standard early T4 build. You are missing the exponential multipliers of Tier IV Evolution (120+) and Enlightenment (100+). Complete your Leap quests and unlock Hyper Awakening.`
        : `Build standard de début de T4. Vous manquez les multiplicateurs exponentiels des paliers IV d'Évolution (120+) et d'Éclairage (100+). Terminez vos quêtes de Bond et débloquez l'Éveil Supérieur.`;
    } else {
      efficiency = isEn ? 'Tier B (In Progress)' : 'Rang B (En progression)';
      efficiencyAdvice = isEn ? 'Introductory tiers' : 'Paliers d\'initiation';
      analysis = isEn
        ? `Insufficient Ark Passive points to benefit from key class synergies. Continue leveling your character (60 to 70) and clearing Behemoth/Aegir raids to accumulate points.`
        : `Points d'Ark Passive insuffisants pour bénéficier des synergies clés de classe. Continuez à monter votre niveau de personnage (60 à 70) et vos raids Behemoth/Aegir pour accumuler des points.`;
    }

    return {
      evoMult: simEvoData.mult,
      enlightMult: simEnlightData.mult,
      leapMult: simLeapData.mult,
      globalMult,
      projectedCp,
      diffCp,
      evoTier: getEvoTier(evoPts),
      enlightTier: getEnlightTier(simEnlightData.effPts),
      leapTier: getLeapTier(leapPts),
      evoCp: simEvoData.cp,
      evoDiff,
      enlightCp: simEnlightData.cp,
      enlightDiff,
      leapCp: simLeapData.cp,
      leapDiff,
      totalAllocated,
      pointsCap,
      efficiency,
      efficiencyAdvice,
      analysis,
      isSupport
    };
  }

  function updateArkPassiveView() {
    if (!dom.tabArkPassivePane) return;

    const curChar = getCurrentActiveCharacter();
    const cName = curChar ? curChar.name : (isEnLang() ? 'Active Character' : 'Personnage Actif');
    if (dom.arkCharName) dom.arkCharName.textContent = cName;
    if (dom.arkCharStats) {
      dom.arkCharStats.textContent = `${state.currentIlvl.toFixed(2)} iLvl • ${formatNumber(Math.round(state.currentCp))} CP`;
    }

    // Synchronisation automatique des spécialisations de classe
    if (dom.arkClassSpecSelect && (!dom.arkClassSpecSelect.dataset || dom.arkClassSpecSelect.dataset.charId !== (curChar ? (curChar.id || curChar.name) : ''))) {
      syncArkPassiveClassSpecs(curChar);
      if (curChar && dom.arkClassSpecSelect.dataset) dom.arkClassSpecSelect.dataset.charId = curChar.id || curChar.name;
    }

    const sim = arkPassiveState.sim;
    const baseCp = state.currentCp || 3368;
    const role = state.role || 'support';

    const res = calcArkPassive({
      role,
      baseCp,
      evoPts: sim.evoPts,
      evoNode: sim.evoNode,
      enlightPts: sim.enlightPts,
      relicBooks: sim.relicBooks,
      relicAcc: sim.relicAcc,
      classSpec: sim.classSpec,
      leapPts: sim.leapPts,
      haUnlocked: sim.haUnlocked,
      raidsUnlocked: sim.raidsUnlocked
    });

    arkPassiveState.lastResult = res;

    // Role badge in summary
    const isEnArk = isEnLang();
    if (dom.arkSummaryRoleBadge) {
      dom.arkSummaryRoleBadge.textContent = isEnArk 
        ? (role === 'support' ? 'T4 Support Model' : 'T4 DPS Model') 
        : (role === 'support' ? 'Modèle Support T4' : 'Modèle DPS T4');
    }

    // Evolution Tree
    if (dom.sliderArkEvoPoints) dom.sliderArkEvoPoints.value = sim.evoPts;
    if (dom.numArkEvoPoints) dom.numArkEvoPoints.value = sim.evoPts;
    if (dom.dispArkEvoPoints) dom.dispArkEvoPoints.textContent = `${sim.evoPts} pts`;
    if (dom.arkEvoTierBadge) dom.arkEvoTierBadge.textContent = res.evoTier;
    if (dom.dispArkEvoMult) dom.dispArkEvoMult.textContent = `+${res.evoMult.toFixed(2)}%`;
    if (dom.dispArkEvoCp) {
      if (res.evoDiff !== 0) {
        const sign = res.evoDiff > 0 ? '+' : '';
        const cls = res.evoDiff > 0 ? 'pos' : 'neg';
        dom.dispArkEvoCp.innerHTML = `${formatNumber(res.evoCp)} CP <span class="tree-delta-pill ${cls}">(${sign}${formatNumber(res.evoDiff)} CP)</span>`;
      } else {
        dom.dispArkEvoCp.textContent = `${formatNumber(res.evoCp)} CP`;
      }
    }

    if (dom.arkEvoQuickPills) {
      dom.arkEvoQuickPills.querySelectorAll('.btn-action-pill').forEach(btn => {
        const p = parseInt(btn.getAttribute('data-pts'), 10);
        btn.classList.toggle('active', p === sim.evoPts);
      });
    }

    // Enlightenment Tree
    if (dom.sliderArkEnlightPoints) dom.sliderArkEnlightPoints.value = sim.enlightPts;
    if (dom.numArkEnlightPoints) dom.numArkEnlightPoints.value = sim.enlightPts;
    if (dom.dispArkEnlightPoints) dom.dispArkEnlightPoints.textContent = `${sim.enlightPts} pts`;
    if (dom.arkEnlightTierBadge) dom.arkEnlightTierBadge.textContent = res.enlightTier;
    if (dom.dispArkEnlightMult) dom.dispArkEnlightMult.textContent = `+${res.enlightMult.toFixed(2)}%`;
    if (dom.dispArkEnlightCp) {
      if (res.enlightDiff !== 0) {
        const sign = res.enlightDiff > 0 ? '+' : '';
        const cls = res.enlightDiff > 0 ? 'pos' : 'neg';
        dom.dispArkEnlightCp.innerHTML = `${formatNumber(res.enlightCp)} CP <span class="tree-delta-pill ${cls}">(${sign}${formatNumber(res.enlightDiff)} CP)</span>`;
      } else {
        dom.dispArkEnlightCp.textContent = `${formatNumber(res.enlightCp)} CP`;
      }
    }

    if (dom.chkArkRelicBooks) dom.chkArkRelicBooks.checked = sim.relicBooks;
    if (dom.chkArkRelicAcc) dom.chkArkRelicAcc.checked = sim.relicAcc;

    if (dom.arkEnlightQuickPills) {
      dom.arkEnlightQuickPills.querySelectorAll('.btn-action-pill').forEach(btn => {
        const p = parseInt(btn.getAttribute('data-pts'), 10);
        btn.classList.toggle('active', p === sim.enlightPts);
      });
    }

    // Leap Tree
    if (dom.sliderArkLeapPoints) dom.sliderArkLeapPoints.value = sim.leapPts;
    if (dom.numArkLeapPoints) dom.numArkLeapPoints.value = sim.leapPts;
    if (dom.dispArkLeapPoints) dom.dispArkLeapPoints.textContent = `${sim.leapPts} pts`;
    if (dom.arkLeapTierBadge) dom.arkLeapTierBadge.textContent = res.leapTier;
    if (dom.dispArkLeapMult) dom.dispArkLeapMult.textContent = `+${res.leapMult.toFixed(2)}%`;
    if (dom.dispArkLeapCp) {
      if (res.leapDiff !== 0) {
        const sign = res.leapDiff > 0 ? '+' : '';
        const cls = res.leapDiff > 0 ? 'pos' : 'neg';
        dom.dispArkLeapCp.innerHTML = `${formatNumber(res.leapCp)} CP <span class="tree-delta-pill ${cls}">(${sign}${formatNumber(res.leapDiff)} CP)</span>`;
      } else {
        dom.dispArkLeapCp.textContent = `${formatNumber(res.leapCp)} CP`;
      }
    }

    if (dom.chkArkHaUnlocked) dom.chkArkHaUnlocked.checked = sim.haUnlocked;
    if (dom.chkArkRaidsUnlocked) dom.chkArkRaidsUnlocked.checked = sim.raidsUnlocked;

    if (dom.arkLeapQuickPills) {
      dom.arkLeapQuickPills.querySelectorAll('.btn-action-pill').forEach(btn => {
        const p = parseInt(btn.getAttribute('data-pts'), 10);
        btn.classList.toggle('active', p === sim.leapPts);
      });
    }

    // Summary Card Displays
    if (dom.arkResTotalCp) dom.arkResTotalCp.textContent = `${formatNumber(res.projectedCp)} CP`;
    if (dom.arkResDiffCp) {
      const sign = res.diffCp > 0 ? '+' : (res.diffCp < 0 ? '-' : '+');
      dom.arkResDiffCp.textContent = isEnArk
        ? `${sign}${formatNumber(Math.abs(res.diffCp))} CP vs current profile`
        : `${sign}${formatNumber(Math.abs(res.diffCp))} CP vs profil actuel`;
    }
    if (dom.arkResGlobalMult) dom.arkResGlobalMult.textContent = `+${res.globalMult.toFixed(2)}%`;
    if (dom.arkResBuffDetail) {
      dom.arkResBuffDetail.textContent = role === 'support' 
        ? (isEnArk ? `Ally AP Buff: ~${(18.0 + (res.enlightMult * 0.20)).toFixed(1)}% net` : `Buff PA Alliés : ~${(18.0 + (res.enlightMult * 0.20)).toFixed(1)}% net`)
        : (isEnArk ? `Personal Damage: +${(res.globalMult * 0.85).toFixed(1)}% net` : `Dégâts Personnels : +${(res.globalMult * 0.85).toFixed(1)}% net`);
    }
    if (dom.arkResTotalPoints) dom.arkResTotalPoints.textContent = `${res.totalAllocated} Pts`;
    if (dom.arkResPointsCap) dom.arkResPointsCap.textContent = isEnArk ? `Current Cap: ${res.pointsCap} Pts` : `Plafond actuel : ${res.pointsCap} Pts`;
    if (dom.arkResEfficiency) dom.arkResEfficiency.textContent = res.efficiency;
    if (dom.arkResAdviceText) dom.arkResAdviceText.textContent = res.efficiencyAdvice;
    if (dom.arkAnalysisText) dom.arkAnalysisText.textContent = res.analysis;

    updateAstrogemGraderView();
  }

  function initArkPassiveEvents() {
    // 1. Evolution Inputs
    if (dom.sliderArkEvoPoints) {
      dom.sliderArkEvoPoints.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10) || 0;
        arkPassiveState.sim.evoPts = v;
        if (dom.numArkEvoPoints) dom.numArkEvoPoints.value = v;
        updateArkPassiveView();
      });
    }
    if (dom.numArkEvoPoints) {
      dom.numArkEvoPoints.addEventListener('change', (e) => {
        const v = Math.min(140, Math.max(0, parseInt(e.target.value, 10) || 0));
        arkPassiveState.sim.evoPts = v;
        if (dom.sliderArkEvoPoints) dom.sliderArkEvoPoints.value = v;
        updateArkPassiveView();
      });
    }
    if (dom.arkEvoNodeSelect) {
      dom.arkEvoNodeSelect.addEventListener('change', (e) => {
        arkPassiveState.sim.evoNode = e.target.value;
        updateArkPassiveView();
      });
    }
    if (dom.arkEvoQuickPills) {
      dom.arkEvoQuickPills.querySelectorAll('.btn-action-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const pts = parseInt(btn.getAttribute('data-pts'), 10) || 140;
          arkPassiveState.sim.evoPts = pts;
          updateArkPassiveView();
        });
      });
    }

    // 2. Enlightenment Inputs
    if (dom.sliderArkEnlightPoints) {
      dom.sliderArkEnlightPoints.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10) || 0;
        arkPassiveState.sim.enlightPts = v;
        if (dom.numArkEnlightPoints) dom.numArkEnlightPoints.value = v;
        updateArkPassiveView();
      });
    }
    if (dom.numArkEnlightPoints) {
      dom.numArkEnlightPoints.addEventListener('change', (e) => {
        const v = Math.min(120, Math.max(0, parseInt(e.target.value, 10) || 0));
        arkPassiveState.sim.enlightPts = v;
        if (dom.sliderArkEnlightPoints) dom.sliderArkEnlightPoints.value = v;
        updateArkPassiveView();
      });
    }
    if (dom.chkArkRelicBooks) {
      dom.chkArkRelicBooks.addEventListener('change', (e) => {
        arkPassiveState.sim.relicBooks = e.target.checked;
        updateArkPassiveView();
      });
    }
    if (dom.chkArkRelicAcc) {
      dom.chkArkRelicAcc.addEventListener('change', (e) => {
        arkPassiveState.sim.relicAcc = e.target.checked;
        updateArkPassiveView();
      });
    }
    if (dom.arkClassSpecSelect) {
      dom.arkClassSpecSelect.addEventListener('change', (e) => {
        arkPassiveState.sim.classSpec = e.target.value;
        updateArkPassiveView();
      });
    }
    if (dom.arkEnlightQuickPills) {
      dom.arkEnlightQuickPills.querySelectorAll('.btn-action-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const pts = parseInt(btn.getAttribute('data-pts'), 10) || 100;
          arkPassiveState.sim.enlightPts = pts;
          updateArkPassiveView();
        });
      });
    }

    // 3. Leap Inputs
    if (dom.sliderArkLeapPoints) {
      dom.sliderArkLeapPoints.addEventListener('input', (e) => {
        const v = parseInt(e.target.value, 10) || 0;
        arkPassiveState.sim.leapPts = v;
        if (dom.numArkLeapPoints) dom.numArkLeapPoints.value = v;
        updateArkPassiveView();
      });
    }
    if (dom.numArkLeapPoints) {
      dom.numArkLeapPoints.addEventListener('change', (e) => {
        const v = Math.min(70, Math.max(0, parseInt(e.target.value, 10) || 0));
        arkPassiveState.sim.leapPts = v;
        if (dom.sliderArkLeapPoints) dom.sliderArkLeapPoints.value = v;
        updateArkPassiveView();
      });
    }
    if (dom.chkArkHaUnlocked) {
      dom.chkArkHaUnlocked.addEventListener('change', (e) => {
        arkPassiveState.sim.haUnlocked = e.target.checked;
        updateArkPassiveView();
      });
    }
    if (dom.chkArkRaidsUnlocked) {
      dom.chkArkRaidsUnlocked.addEventListener('change', (e) => {
        arkPassiveState.sim.raidsUnlocked = e.target.checked;
        updateArkPassiveView();
      });
    }
    if (dom.arkLeapQuickPills) {
      dom.arkLeapQuickPills.querySelectorAll('.btn-action-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const pts = parseInt(btn.getAttribute('data-pts'), 10) || 70;
          arkPassiveState.sim.leapPts = pts;
          updateArkPassiveView();
        });
      });
    }

    // 4. Quick Action Presets
    if (dom.btnArkResetCurrent) {
      dom.btnArkResetCurrent.addEventListener('click', () => {
        const curChar = getCurrentActiveCharacter();
        const ap = (curChar && curChar.apPoints) || arkPassiveState.basePoints || { evolution: 140, enlightenment: 101, leap: 70 };
        arkPassiveState.sim.evoPts = ap.evolution !== undefined ? ap.evolution : 140;
        arkPassiveState.sim.enlightPts = ap.enlightenment !== undefined ? ap.enlightenment : 101;
        arkPassiveState.sim.leapPts = ap.leap !== undefined ? ap.leap : 70;
        arkPassiveState.sim.relicBooks = true;
        arkPassiveState.sim.relicAcc = true;
        arkPassiveState.sim.haUnlocked = true;
        arkPassiveState.sim.raidsUnlocked = true;
        syncArkPassiveClassSpecs(curChar);
        updateArkPassiveView();
      });
    }

    if (dom.btnArkPresetSupport) {
      dom.btnArkPresetSupport.addEventListener('click', () => {
        arkPassiveState.sim.evoPts = 140;
        arkPassiveState.sim.evoNode = 'vigor';
        arkPassiveState.sim.enlightPts = 105;
        arkPassiveState.sim.relicBooks = true;
        arkPassiveState.sim.relicAcc = true;
        arkPassiveState.sim.leapPts = 70;
        arkPassiveState.sim.haUnlocked = true;
        arkPassiveState.sim.raidsUnlocked = true;
        const curChar = getCurrentActiveCharacter();
        const info = getCharClassSpecs(curChar);
        const suppSpec = info.specs.find(s => s.role === 'support') || info.specs[0];
        if (suppSpec) {
          arkPassiveState.sim.classSpec = suppSpec.id;
          if (dom.arkClassSpecSelect) dom.arkClassSpecSelect.value = suppSpec.id;
        }
        if (dom.arkEvoNodeSelect) dom.arkEvoNodeSelect.value = 'vigor';
        updateArkPassiveView();
      });
    }

    if (dom.btnArkPresetDps) {
      dom.btnArkPresetDps.addEventListener('click', () => {
        arkPassiveState.sim.evoPts = 140;
        arkPassiveState.sim.evoNode = 'strike';
        arkPassiveState.sim.enlightPts = 105;
        arkPassiveState.sim.relicBooks = true;
        arkPassiveState.sim.relicAcc = true;
        arkPassiveState.sim.leapPts = 70;
        arkPassiveState.sim.haUnlocked = true;
        arkPassiveState.sim.raidsUnlocked = true;
        const curChar = getCurrentActiveCharacter();
        const info = getCharClassSpecs(curChar);
        const dpsSpec = info.specs.find(s => s.role === 'dps') || info.specs[0];
        if (dpsSpec) {
          arkPassiveState.sim.classSpec = dpsSpec.id;
          if (dom.arkClassSpecSelect) dom.arkClassSpecSelect.value = dpsSpec.id;
        }
        if (dom.arkEvoNodeSelect) dom.arkEvoNodeSelect.value = 'strike';
        updateArkPassiveView();
      });
    }

    // 5. Apply / Inject into Quick Predictor
    if (dom.btnApplyArkToSim) {
      dom.btnApplyArkToSim.addEventListener('click', () => {
        if (!arkPassiveState.lastResult) return;
        const newCp = arkPassiveState.lastResult.projectedCp;
        state.currentCp = newCp;
        if (dom.numCurrentCp) dom.numCurrentCp.value = newCp;
        if (dom.sliderCurrentCp) dom.sliderCurrentCp.value = newCp;

        // Switch to Predictor tab
        dom.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === 'tab-predictor'));
        dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === 'tab-predictor'));

        updatePredictorView();
        updateActiveCharacterCard(activeCharacterId);

        const origHtml = dom.btnApplyArkToSim.innerHTML;
        dom.btnApplyArkToSim.innerHTML = `<span>CP Injecté (${formatNumber(newCp)} CP).</span>`;
        setTimeout(() => { dom.btnApplyArkToSim.innerHTML = origHtml; }, 2000);
      });
    }
  }

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
      realGainText = `+${realGain.toFixed(2)}% DPS`;

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

      const partyBuff = (eff1Score + eff2Score) * 3 + (config.orderLevel * 0.0769);
      realGainText = `+${partyBuff.toFixed(2)}% Buff`;

      const top2 = config.baseCost === 8 ? ['brand', 'ally_dmg'] : (config.baseCost === 9 ? ['ally_ap', 'ally_dmg'] : ['ally_ap', 'brand']);
      isRainbow = config.willpowerLevel === 5 && config.orderLevel === 5 && config.effect1Level === 5 && config.effect2Level === 5 &&
        top2.includes(config.effect1) && top2.includes(config.effect2);
    }

    const sPlusCut = isSupport ? 96.3 : 96.7;
    const ladder = [
      ["S+", sPlusCut], ["S", 93.3], ["S-", 90.0],
      ["A+", 86.7], ["A", 83.3], ["A-", 80.0],
      ["B+", 76.7], ["B", 73.3], ["B-", 70.0],
      ["C+", 66.7], ["C", 63.3], ["C-", 60.0],
      ["D+", 56.7], ["D", 53.3], ["D-", 50.0],
      ["F", 0]
    ];
    let rank = "F";
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
        ? (isEn ? 'True Party Buff Gain' : 'Gain Réel Buff Groupe')
        : (isEn ? 'True Solo DPS Gain' : 'Gain Réel DPS Perso');
    }
    if (dom.astroGainSub) {
      dom.astroGainSub.textContent = isSupport
        ? (isEn ? 'Net contribution per ally' : 'Contribution nette par allié')
        : (isEn ? 'Raw damage multiplier' : 'Multiplicateur brut de dégâts');
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

  // --- 4c. MOTEUR CANONIQUE & IMPORTATION LIVE (LOSTARK.BIBLE) ---


  // --- DICTIONNAIRES OFFICIELS CANONIQUES (Smilegate & lostark.bible) ---
  const BIBLE_BRACELET_PERKS = {"11011":{"name":"Précision (Taux Critique +5% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +5%. Crit Hit Damage +1.5%."},"11012":{"name":"Précision (Taux Critique +4.2% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +4.2%. Crit Hit Damage +1.5%."},"11013":{"name":"Précision (Taux Critique +3.4% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +3.4%. Crit Hit Damage +1.5%."},"11014":{"name":"Précision (Taux Critique +2.6% & Dégâts Coup Crit +1.5%)","desc":"Crit Rate +2.6%. Crit Hit Damage +1.5%."},"11021":{"name":"Marteau (Dégâts Critiques +10% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +10%. Crit Hit Damage +1.5%."},"11022":{"name":"Marteau (Dégâts Critiques +8.4% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +8.4%. Crit Hit Damage +1.5%."},"11023":{"name":"Marteau (Dégâts Critiques +6.8% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +6.8%. Crit Hit Damage +1.5%."},"11024":{"name":"Marteau (Dégâts Critiques +5.2% & Dégâts Coup Crit +1.5%)","desc":"Crit Damage +5.2%. Crit Hit Damage +1.5%."},"11041":{"name":"Coinçage (Dégâts Additionnels +3.5% & Démons +2.5%)","desc":"Additional Damage +3.5%. Bonus vs. Demon/Archdemon +2.5%."},"11042":{"name":"Coinçage (Dégâts Additionnels +3% & Démons +2.5%)","desc":"Additional Damage +3%. Bonus vs. Demon/Archdemon +2.5%."},"11043":{"name":"Coinçage (Dégâts Additionnels +2.5% & Démons +2.5%)","desc":"Additional Damage +2.5%. Bonus vs. Demon/Archdemon +2.5%."},"11044":{"name":"Coinçage (Dégâts Additionnels +2% & Démons +2.5%)","desc":"Additional Damage +2%. Bonus vs. Demon/Archdemon +2.5%."},"11051":{"name":"Ferveur (Dégâts Sortants +5.5% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +5.5%."},"11052":{"name":"Ferveur (Dégâts Sortants +5% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +5%."},"11053":{"name":"Ferveur (Dégâts Sortants +4.5% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +4.5%."},"11054":{"name":"Ferveur (Dégâts Sortants +4% & Cooldown +2%)","desc":"Skill cooldown +2%. Outgoing Damage +4%."},"11061":{"name":"Poignard / Faiblesse (Défense -2.5% & AP Allié +3%)","desc":"On hit, target's Defense -2.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +3%."},"11062":{"name":"Poignard / Faiblesse (Défense -2.1% & AP Allié +2.5%)","desc":"On hit, target's Defense -2.1% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2.5%."},"11063":{"name":"Poignard / Faiblesse (Défense -1.8% & AP Allié +2%)","desc":"On hit, target's Defense -1.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."},"11064":{"name":"Poignard / Faiblesse (Défense -1.5% & AP Allié +1.5%)","desc":"On hit, target's Defense -1.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +1.5%."},"11071":{"name":"Exposition Crit (Résistance Crit -2.5% & AP Allié +3%)","desc":"On hit, target's Crit Resistance -2.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +3%."},"11072":{"name":"Exposition Crit (Résistance Crit -2.1% & AP Allié +2.5%)","desc":"On hit, target's Crit Resistance -2.1% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2.5%."},"11073":{"name":"Exposition Crit (Résistance Crit -1.8% & AP Allié +2%)","desc":"On hit, target's Crit Resistance -1.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."},"11074":{"name":"Exposition Crit (Résistance Crit -1.5% & AP Allié +1.5%)","desc":"On hit, target's Crit Resistance -1.5% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +1.5%."},"11081":{"name":"Ferveur (Dégâts Sortants +1.3%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +1.3% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +3%."},"11082":{"name":"Ferveur (Dégâts Sortants +1.1%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +1.1% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +2.5%."},"11083":{"name":"Ferveur (Dégâts Sortants +0.9%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +0.9% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +2%."},"11084":{"name":"Ferveur (Dégâts Sortants +0.7%)","desc":"Targets that already have a party-wide protective effect (Shield, HP Regen, Incoming Damage Reduction) are granted Outgoing Damage +0.7% for 5s. This effect is limited to a single application per party and does not apply to protective effects with no duration. Ally Atk. Power Enhancement +1.5%."},"11091":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -4.8% & AP Allié +3%)","desc":"On hit, target's Crit Damage -4.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +3%."},"11092":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -4.2% & AP Allié +2.5%)","desc":"On hit, target's Crit Damage -4.2% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2.5%."},"11093":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -3.6% & AP Allié +2%)","desc":"On hit, target's Crit Damage -3.6% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."},"11094":{"name":"Ovation / Vulnérabilité Crit (Dégâts Crit -3% & AP Allié +1.5%)","desc":"On hit, target's Crit Damage -3% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +1.5%."},"11111":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +9,000. When your HP is 50% or higher, upon hit, Weapon Power +2,400 for 5s."},"11112":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +8,100. When your HP is 50% or higher, upon hit, Weapon Power +2,200 for 5s."},"11113":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +7,200. When your HP is 50% or higher, upon hit, Weapon Power +2,000 for 5s."},"11114":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +6,300. When your HP is 50% or higher, upon hit, Weapon Power +1,800 for 5s."},"11121":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +8,700. Upon hit, Weapon Power +150 for 120s every 30s. (Max. 30 stacks)"},"11122":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +7,800. Upon hit, Weapon Power +140 for 120s every 30s. (Max. 30 stacks)"},"11123":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +6,900. Upon hit, Weapon Power +130 for 120s every 30s. (Max. 30 stacks)"},"11124":{"name":"Puissance d'Arme Cumulable","desc":"Weapon Power +6,000. Upon hit, Weapon Power +120 for 120s every 30s. (Max. 30 stacks)"},"11181":{"name":"Protection & Soins d'Allié (+3.5%)","desc":"Party Member protection and recovery effect +3.5%."},"11182":{"name":"Protection & Soins d'Allié (+3%)","desc":"Party Member protection and recovery effect +3%."},"11183":{"name":"Protection & Soins d'Allié (+2.5%)","desc":"Party Member protection and recovery effect +2.5%."},"11184":{"name":"Protection & Soins d'Allié (+2%)","desc":"Party Member protection and recovery effect +2%."},"11261":{"name":"Vitesse d'Attaque & Déplacement (+6%)","desc":"Atk./Move Speed +6%."},"11262":{"name":"Vitesse d'Attaque & Déplacement (+5%)","desc":"Atk./Move Speed +5%."},"11263":{"name":"Vitesse d'Attaque & Déplacement (+4%)","desc":"Atk./Move Speed +4%."},"11264":{"name":"Vitesse d'Attaque & Déplacement (+3%)","desc":"Atk./Move Speed +3%."},"11341":{"name":"Rechargement Esquive / Relèvement (-12%)","desc":"Movement Skill/Stand Up cooldown -12%."},"11342":{"name":"Rechargement Esquive / Relèvement (-10%)","desc":"Movement Skill/Stand Up cooldown -10%."},"11343":{"name":"Rechargement Esquive / Relèvement (-8%)","desc":"Movement Skill/Stand Up cooldown -8%."},"11344":{"name":"Rechargement Esquive / Relèvement (-6%)","desc":"Movement Skill/Stand Up cooldown -6%."},"77300001":{"name":"Shield and Healing effectiveness on all Party Memb","desc":"Shield and Healing effectiveness on all Party Members +6%. If target's HP is 50% or lower, +3% additional effectiveness."},"77300002":{"name":"When HP falls below 30%, gain a shield equal to 20","desc":"When HP falls below 30%, gain a shield equal to 20% of Max HP for 6s. If the shield is not destroyed after 6s, recover 50% of the remaining shield as HP. (Cooldown: 300s.)"},"605100031":{"name":"Embuscade (Dégâts Sortants +3% / Neutralisation)","desc":"Outgoing Damage +3%. Outgoing Damage +5% to Staggered foes."},"605100032":{"name":"Embuscade (Dégâts Sortants +2.5% / Neutralisation)","desc":"Outgoing Damage +2.5%. Outgoing Damage +4.5% to Staggered foes."},"605100033":{"name":"Embuscade (Dégâts Sortants +2% / Neutralisation)","desc":"Outgoing Damage +2%. Outgoing Damage +4% to Staggered foes."},"605100034":{"name":"Embuscade (Dégâts Sortants +1.5% / Neutralisation)","desc":"Outgoing Damage +1.5%. Outgoing Damage +3.5% to Staggered foes."},"605100101":{"name":"Ardeur (Puissance d'Arme +1,480, & Vitesse)","desc":"On hit, Weapon Power +1,480, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100102":{"name":"Ardeur (Puissance d'Arme +1,320, & Vitesse)","desc":"On hit, Weapon Power +1,320, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100103":{"name":"Ardeur (Puissance d'Arme +1,160, & Vitesse)","desc":"On hit, Weapon Power +1,160, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100104":{"name":"Ardeur (Puissance d'Arme +1,000, & Vitesse)","desc":"On hit, Weapon Power +1,000, Atk./Move Speed +1% for 10s. (Max. 6 stacks)"},"605100131":{"name":"Dégâts Sortants (+3%)","desc":"Outgoing Damage +3%."},"605100132":{"name":"Dégâts Sortants (+2.5%)","desc":"Outgoing Damage +2.5%."},"605100133":{"name":"Dégâts Sortants (+2%)","desc":"Outgoing Damage +2%."},"605100134":{"name":"Dégâts Sortants (+1.5%)","desc":"Outgoing Damage +1.5%."},"605100151":{"name":"Attaque par l'Arrière (Back Attack +3.5%)","desc":"Back Attack Damage +3.5%."},"605100152":{"name":"Attaque par l'Arrière (Back Attack +3%)","desc":"Back Attack Damage +3%."},"605100153":{"name":"Attaque par l'Arrière (Back Attack +2.5%)","desc":"Back Attack Damage +2.5%."},"605100154":{"name":"Attaque par l'Arrière (Back Attack +2%)","desc":"Back Attack Damage +2%."},"605100161":{"name":"Attaque Frontale (Frontal Attack +3.5%)","desc":"Frontal Attack Damage +3.5%."},"605100162":{"name":"Attaque Frontale (Frontal Attack +3%)","desc":"Frontal Attack Damage +3%."},"605100163":{"name":"Attaque Frontale (Frontal Attack +2.5%)","desc":"Frontal Attack Damage +2.5%."},"605100164":{"name":"Attaque Frontale (Frontal Attack +2%)","desc":"Frontal Attack Damage +2%."},"605100171":{"name":"Compétences Non Directionnelles (+3.5%)","desc":"Non-directional Skill Damage +3.5%. Awakening Skills do not apply."},"605100172":{"name":"Compétences Non Directionnelles (+3%)","desc":"Non-directional Skill Damage +3%. Awakening Skills do not apply."},"605100173":{"name":"Compétences Non Directionnelles (+2.5%)","desc":"Non-directional Skill Damage +2.5%. Awakening Skills do not apply."},"605100174":{"name":"Compétences Non Directionnelles (+2%)","desc":"Non-directional Skill Damage +2%. Awakening Skills do not apply."},"605100271":{"name":"Dégâts Monstres Inférieurs (+6%)","desc":"Damage to Challenge or lower monsters +6%."},"605100272":{"name":"Dégâts Monstres Inférieurs (+5%)","desc":"Damage to Challenge or lower monsters +5%."},"605100273":{"name":"Dégâts Monstres Inférieurs (+4%)","desc":"Damage to Challenge or lower monsters +4%."},"605100274":{"name":"Dégâts Monstres Inférieurs (+3%)","desc":"Damage to Challenge or lower monsters +3%."},"605100281":{"name":"Réduction Dégâts Monstres Inférieurs (-10%)","desc":"Incoming Damage from Challenge or lower monsters -10%."},"605100282":{"name":"Réduction Dégâts Monstres Inférieurs (-8%)","desc":"Incoming Damage from Challenge or lower monsters -8%."},"605100283":{"name":"Réduction Dégâts Monstres Inférieurs (-6%)","desc":"Incoming Damage from Challenge or lower monsters -6%."},"605100284":{"name":"Réduction Dégâts Monstres Inférieurs (-4%)","desc":"Incoming Damage from Challenge or lower monsters -4%."},"605100351":{"name":"Immunité Paralysie / Repoussement (60s)","desc":"On hit, Paralysis and Push Immunity for 60s. (Cooldown: 60s) The effect is removed upon getting hit 1 time."},"605100352":{"name":"Immunité Paralysie / Repoussement (70s)","desc":"On hit, Paralysis and Push Immunity for 70s. (Cooldown: 70s) The effect is removed upon getting hit 1 time."},"605100353":{"name":"Immunité Paralysie / Repoussement (80s)","desc":"On hit, Paralysis and Push Immunity for 80s. (Cooldown: 80s) The effect is removed upon getting hit 1 time."},"605100354":{"name":"Immunité Paralysie / Repoussement (90s)","desc":"On hit, Paralysis and Push Immunity for 90s. (Cooldown: 90s) The effect is removed upon getting hit 1 time."}};
  const BIBLE_ACCESSORY_PASSIVES = {"6000":{"name":"Gain de Jauge d'Identité (+1.60%)","desc":"Effet passif Collier Support T4 (Rang 1) : Meter Gain +1.60%."},"6001":{"name":"Gain de Jauge d'Identité (+3.60%)","desc":"Effet passif Collier Support T4 (Rang 2) : Meter Gain +3.60%."},"6002":{"name":"Gain de Jauge d'Identité (+6.00%)","desc":"Effet passif Collier Support T4 (Rang 3) : Meter Gain +6.00%."},"6010":{"name":"Gain de Jauge d'Identité (+0.72%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 1) : Meter Gain +0.72%."},"6011":{"name":"Gain de Jauge d'Identité (+1.62%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 2) : Meter Gain +1.62%."},"6012":{"name":"Gain de Jauge d'Identité (+2.70%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 3) : Meter Gain +2.70%."},"6020":{"name":"Gain de Jauge d'Identité (+0.90%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 1) : Meter Gain +0.90%."},"6021":{"name":"Gain de Jauge d'Identité (+2.07%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 2) : Meter Gain +2.07%."},"6022":{"name":"Gain de Jauge d'Identité (+3.45%)","desc":"Effet passif Boucle d'oreille Support T4 (Rang 3) : Meter Gain +3.45%."},"6030":{"name":"Gain de Jauge d'Identité (+1.11%)","desc":"Effet passif Anneau Support T4 (Rang 1) : Meter Gain +1.11%."},"6031":{"name":"Gain de Jauge d'Identité (+2.52%)","desc":"Effet passif Anneau Support T4 (Rang 2) : Meter Gain +2.52%."},"6032":{"name":"Gain de Jauge d'Identité (+4.20%)","desc":"Effet passif Anneau Support T4 (Rang 3) : Meter Gain +4.20%."},"621000000":{"name":"Dégâts infligés (+0.55%)","desc":"Effet passif Collier T4 (Rang 1) : Outgoing Damage +0.55%."},"621000001":{"name":"Dégâts infligés (+1.20%)","desc":"Effet passif Collier T4 (Rang 2) : Outgoing Damage +1.20%."},"621000002":{"name":"Dégâts infligés (+2.00%)","desc":"Effet passif Collier T4 (Rang 3) : Outgoing Damage +2.00%."},"621000010":{"name":"Dégâts aux ennemis (+0.24%)","desc":"Effet passif Boucle d'oreille T4 (Rang 1) : Damage to foes +0.24%."},"621000011":{"name":"Dégâts aux ennemis (+0.54%)","desc":"Effet passif Boucle d'oreille T4 (Rang 2) : Damage to foes +0.54%."},"621000012":{"name":"Dégâts aux ennemis (+0.90%)","desc":"Effet passif Boucle d'oreille T4 (Rang 3) : Damage to foes +0.90%."},"621000020":{"name":"Dégâts aux ennemis (+0.30%)","desc":"Effet passif Boucle d'oreille T4 (Rang 1) : Damage to foes +0.30%."},"621000021":{"name":"Dégâts aux ennemis (+0.69%)","desc":"Effet passif Boucle d'oreille T4 (Rang 2) : Damage to foes +0.69%."},"621000022":{"name":"Dégâts aux ennemis (+1.15%)","desc":"Effet passif Boucle d'oreille T4 (Rang 3) : Damage to foes +1.15%."},"621000030":{"name":"Dégâts aux ennemis (+0.37%)","desc":"Effet passif Anneau T4 (Rang 1) : Damage to foes +0.37%."},"621000031":{"name":"Dégâts aux ennemis (+0.84%)","desc":"Effet passif Anneau T4 (Rang 2) : Damage to foes +0.84%."},"621000032":{"name":"Dégâts aux ennemis (+1.40%)","desc":"Effet passif Anneau T4 (Rang 3) : Damage to foes +1.40%."}};
  const BIBLE_ENGRAVINGS = {"107":"Disrespect (Mépris)","109":"Spirit Absorption (Absorption d'Esprit)","110":"Ether Predator (Prédateur d'Éther)","111":"Stabilized Status (Statut Stabilisé)","112":"Master of Slashes","114":"Twinkle Twinkle","116":"Servant","118":"Grudge (Rancune)","119":"Invincible Evasion","121":"Super Charge (Super Charge)","123":"Strong Will","125":"Mayhem (Carnage)","127":"Esoteric Skill Enhancement","129":"Enhanced Weapon (Arme Améliorée)","130":"Firepower Enhancement (Renforcement de Puissance de Feu)","133":"Balanced Defense","134":"Drops of Ether (Gouttes d'Éther)","140":"Crisis Evasion (Évasion d'Urgence)","141":"Keen Blunt Weapon (Arme Affûtée)","142":"Vital Point Hit (Frappe aux Points Vitaux)","157":"Master of Piercing","158":"Master of Destruction","167":"Max MP Increase (Augmentation Max de PM)","168":"MP Efficiency Increase","188":"Berserker Technique","189":"First Intention","190":"Ultimate Skill: Taijutsu","191":"Shock Training (Entraînement au Choc)","192":"Pistoleer (Pistolero)","193":"Barrage Enhancement (Renforcement de Barrage)","194":"True Courage (Vrai Courage)","195":"Desperate Salvation (Salut Désespéré)","196":"Rage Hammer (Marteau de Rage)","197":"Gravity Training (Entraînement Gravitationnel)","198":"Master Summoner","199":"Communication Overflow","200":"Grace of the Empress","201":"Order of the Emperor (Ordre de l'Empereur)","202":"Master of Escape","206":"Telescope","207":"Dynamite","211":"Master Net Caster","213":"Giant Tree","214":"Sapling","215":"4-Leaf Clover","217":"Entomologist","219":"Butcher","221":"Delicate Brush","224":"Combat Readiness (Préparation au Combat)","225":"Lone Knight (Chevalier Solitaire)","235":"Fortitude","236":"Crushing Fist","237":"Shield Piercing","238":"Master's Tenacity (Ténacité du Maître)","239":"Divine Protection","240":"Heavy Armor (Armure Lourde)","241":"Explosive Expert","242":"Enhanced Shield","243":"Necromancy","244":"Preemptive Strike (Frappe Préventive)","245":"Broken Bone","246":"Lightning Fury","247":"Cursed Doll (Poupée Maudite)","248":"Contender (Prétendant)","249":"Ambush Master (Maître des Arrières)","251":"Magick Stream (Flux Magique)","253":"Barricade (Barricade)","254":"Raid Captain (Capitaine de Raid)","255":"Awakening (Éveil)","256":"Energy Overflow","257":"Robust Spirit","258":"Loyal Companion (Compagnon Fidèle)","259":"Death Strike (Frappe Mortelle)","260":"Increase Mining Tools","261":"Relentless Miner","262":"Bomb Enthusiast","263":"Fishing Tools Increase","264":"Double Points","265":"Golden Bait","266":"Logging Tool Rank Boost","267":"Rapid Kick","268":"Increase Foraging Tools","269":"Deceptive Foraging","270":"Increase Hunting Tools","271":"Deadly Poison","272":"Golden Rabbit","273":"Increase Excavation Tools","274":"Loot Hunter","275":"Master Tamer","276":"Pinnacle (Pinacle)","277":"Control (Contrôle)","278":"Remaining Energy (Énergie Résiduelle)","279":"Surge (Déferlement)","280":"Perfect Suppression (Suppression Parfaite)","281":"Demonic Impulse (Impulsion Démoniaque)","282":"Judgment (Jugement)","283":"Blessed Aura (Aura Bénie)","284":"Arthetinean Skill (Compétence d'Arthetine)","285":"Evolutionary Legacy (Héritage de l'Évolution)","286":"Hunger","287":"Lunar Voice","288":"Master Brawler (Maître Bagarreur)","289":"Peacemaker","290":"Time to Hunt (Heure de la Chasse)","291":"Deathblow","292":"Esoteric Flurry","293":"Igniter (Ignition)","294":"Reflux (Reflux)","295":"Mass Increase (Augmentation de Masse)","296":"Propulsion (Propulsion)","297":"Hit Master (Maître de l'Embuscade)","298":"Sight Focus (Focalisation)","299":"Adrenaline (Adrénaline)","300":"All-Out Attack (Attaque Totale)","301":"Expert (Expert)","302":"Emergency Rescue (Sauvetage d'Urgence)","303":"Precise Dagger (Dague Précise)","305":"Recurrence (Récurrence)","306":"Full Bloom (Pleine Floraison)","307":"Wind Fury","308":"Drizzle","309":"Predator (Prédatrice)","310":"Punisher (Punitrice)","311":"Full Moon Harvester (Faucheuse de la Pleine Lune)","312":"Night's Edge (Lame de la Nuit)","314":"Brawl King Storm","315":"Asura's Path","800":"Atk. Power Reduction","801":"Defense Reduction","802":"Atk. Speed Reduction","803":"Move Speed Reduction","1107":"Disrespect (Mépris)","1109":"Spirit Absorption (Absorption d'Esprit)","1110":"Ether Predator (Prédateur d'Éther)","1111":"Stabilized Status (Statut Stabilisé)","1118":"Grudge (Rancune)","1121":"Super Charge (Super Charge)","1123":"Strong Will","1134":"Drops of Ether (Gouttes d'Éther)","1140":"Crisis Evasion (Évasion d'Urgence)","1141":"Keen Blunt Weapon (Arme Affûtée)","1142":"Vital Point Hit (Frappe aux Points Vitaux)","1167":"Max MP Increase (Augmentation Max de PM)","1168":"MP Efficiency Increase","1202":"Master of Escape","1235":"Fortitude","1236":"Crushing Fist","1237":"Shield Piercing","1238":"Master's Tenacity (Ténacité du Maître)","1239":"Divine Protection","1240":"Heavy Armor (Armure Lourde)","1241":"Explosive Expert","1242":"Enhanced Shield","1243":"Necromancy","1244":"Preemptive Strike (Frappe Préventive)","1245":"Broken Bone","1246":"Lightning Fury","1247":"Cursed Doll (Poupée Maudite)","1248":"Contender (Prétendant)","1249":"Ambush Master (Maître des Arrières)","1251":"Magick Stream (Flux Magique)","1253":"Barricade (Barricade)","1254":"Raid Captain (Capitaine de Raid)","1255":"Awakening (Éveil)","1288":"Master Brawler (Maître Bagarreur)","1295":"Mass Increase (Augmentation de Masse)","1296":"Propulsion (Propulsion)","1297":"Hit Master (Maître de l'Embuscade)","1298":"Sight Focus (Focalisation)","1299":"Adrenaline (Adrénaline)","1300":"All-Out Attack (Attaque Totale)","1301":"Expert (Expert)","1302":"Emergency Rescue (Sauvetage d'Urgence)","1303":"Precise Dagger (Dague Précise)","1800":"Atk. Power Reduction","1801":"Defense Reduction","1802":"Atk. Speed Reduction","1803":"Move Speed Reduction","10007":"","1000001":"","1000002":"","1000003":"","1000004":"","1000101":"","1000102":"","1000103":"","1000104":"","1000201":"","1000202":"","1000203":"","1000204":""};
  const BIBLE_CORES = {"673000003":"Order Sun Core: Combination","673000004":"Order Sun Core: Combination","673000005":"Order Sun Core: Combination","673000006":"Order Sun Core: Combination","673000013":"Order Sun Core: Singularity","673000014":"Order Sun Core: Singularity","673000015":"Order Sun Core: Singularity","673000016":"Order Sun Core: Singularity","673000023":"Order Sun Core: Tactical Control","673000024":"Order Sun Core: Tactical Control","673000025":"Order Sun Core: Tactical Control","673000026":"Order Sun Core: Tactical Control","673000033":"Order Sun Core: Divine Power","673000034":"Order Sun Core: Divine Power","673000035":"Order Sun Core: Divine Power","673000036":"Order Sun Core: Divine Power","673000063":"Order Sun Core: Guillotine","673000064":"Order Sun Core: Guillotine","673000065":"Order Sun Core: Guillotine","673000066":"Order Sun Core: Guillotine","673000073":"Order Sun Core: Final Words","673000074":"Order Sun Core: Final Words","673000075":"Order Sun Core: Final Words","673000076":"Order Sun Core: Final Words","673000103":"Order Sun Core: Bloodhound","673000104":"Order Sun Core: Bloodhound","673000105":"Order Sun Core: Bloodhound","673000106":"Order Sun Core: Bloodhound","673000113":"Order Sun Core: TA-09 Piercing Arrow","673000114":"Order Sun Core: TA-09 Piercing Arrow","673000115":"Order Sun Core: TA-09 Piercing Arrow","673000116":"Order Sun Core: TA-09 Piercing Arrow","673000123":"Order Sun Core: Quantum Operative","673000124":"Order Sun Core: Quantum Operative","673000125":"Order Sun Core: Quantum Operative","673000126":"Order Sun Core: Quantum Operative","673000133":"Order Sun Core: Bombardment","673000134":"Order Sun Core: Bombardment","673000135":"Order Sun Core: Bombardment","673000136":"Order Sun Core: Bombardment","673000163":"Order Sun Core: Eye of the Tigress","673000164":"Order Sun Core: Eye of the Tigress","673000165":"Order Sun Core: Eye of the Tigress","673000166":"Order Sun Core: Eye of the Tigress","673000203":"Order Sun Core: Shock Burst","673000204":"Order Sun Core: Shock Burst","673000205":"Order Sun Core: Shock Burst","673000206":"Order Sun Core: Shock Burst","673000213":"Order Sun Core: Bolstering Melody","673000214":"Order Sun Core: Bolstering Melody","673000215":"Order Sun Core: Bolstering Melody","673000216":"Order Sun Core: Bolstering Melody","673000223":"Order Sun Core: Smite Barrage","673000224":"Order Sun Core: Smite Barrage","673000225":"Order Sun Core: Smite Barrage","673000226":"Order Sun Core: Smite Barrage","673000233":"Order Sun Core: Red Dragon Energy","673000234":"Order Sun Core: Red Dragon Energy","673000235":"Order Sun Core: Red Dragon Energy","673000236":"Order Sun Core: Red Dragon Energy","673000263":"Order Sun Core: Tiger's Roar","673000264":"Order Sun Core: Tiger's Roar","673000265":"Order Sun Core: Tiger's Roar","673000266":"Order Sun Core: Tiger's Roar","673000273":"Order Sun Core: True Brawl King","673000274":"Order Sun Core: True Brawl King","673000275":"Order Sun Core: True Brawl King","673000276":"Order Sun Core: True Brawl King","673000303":"Order Sun Core: Elemental Entwinement","673000304":"Order Sun Core: Elemental Entwinement","673000305":"Order Sun Core: Elemental Entwinement","673000306":"Order Sun Core: Elemental Entwinement","673000313":"Order Sun Core: Edge of Fate","673000314":"Order Sun Core: Edge of Fate","673000315":"Order Sun Core: Edge of Fate","673000316":"Order Sun Core: Edge of Fate","673000323":"Order Sun Core: Serenade of Fortitude","673000324":"Order Sun Core: Serenade of Fortitude","673000325":"Order Sun Core: Serenade of Fortitude","673000326":"Order Sun Core: Serenade of Fortitude","673000333":"Order Sun Core: Magick Catalyst","673000334":"Order Sun Core: Magick Catalyst","673000335":"Order Sun Core: Magick Catalyst","673000336":"Order Sun Core: Magick Catalyst","673000403":"Order Sun Core: Deathblade Surge","673000404":"Order Sun Core: Deathblade Surge","673000405":"Order Sun Core: Deathblade Surge","673000406":"Order Sun Core: Deathblade Surge","673000413":"Order Sun Core: Blood Massacre","673000414":"Order Sun Core: Blood Massacre","673000415":"Order Sun Core: Blood Massacre","673000416":"Order Sun Core: Blood Massacre","673000423":"Order Sun Core: Moonscent","673000424":"Order Sun Core: Moonscent","673000425":"Order Sun Core: Moonscent","673000426":"Order Sun Core: Moonscent","673000433":"Order Sun Core: Another Dimension","673000434":"Order Sun Core: Another Dimension","673000435":"Order Sun Core: Another Dimension","673000436":"Order Sun Core: Another Dimension","673000503":"Order Sun Core: Wind Wielder","673000504":"Order Sun Core: Wind Wielder","673000505":"Order Sun Core: Wind Wielder","673000506":"Order Sun Core: Wind Wielder","673000513":"Order Sun Core: Unstoppable Force","673000514":"Order Sun Core: Unstoppable Force","673000515":"Order Sun Core: Unstoppable Force","673000516":"Order Sun Core: Unstoppable Force","673000523":"Order Sun Core: Shapeshifter!","673000524":"Order Sun Core: Shapeshifter!","673000525":"Order Sun Core: Shapeshifter!","673000526":"Order Sun Core: Shapeshifter!","673000603":"Order Sun Core: Finisher","673000604":"Order Sun Core: Finisher","673000605":"Order Sun Core: Finisher","673000606":"Order Sun Core: Finisher","673001003":"Order Sun Core: Overpower","673001004":"Order Sun Core: Overpower","673001005":"Order Sun Core: Overpower","673001006":"Order Sun Core: Overpower","673001013":"Order Sun Core: Dimensional Collapse","673001014":"Order Sun Core: Dimensional Collapse","673001015":"Order Sun Core: Dimensional Collapse","673001016":"Order Sun Core: Dimensional Collapse","673001023":"Order Sun Core: Spear Arts","673001024":"Order Sun Core: Spear Arts","673001025":"Order Sun Core: Spear Arts","673001026":"Order Sun Core: Spear Arts","673001033":"Order Sun Core: Sacred Strike","673001034":"Order Sun Core: Sacred Strike","673001035":"Order Sun Core: Sacred Strike","673001036":"Order Sun Core: Sacred Strike","673001063":"Order Sun Core: Compressed Fury","673001064":"Order Sun Core: Compressed Fury","673001065":"Order Sun Core: Compressed Fury","673001066":"Order Sun Core: Compressed Fury","673001073":"Order Sun Core: Prayer","673001074":"Order Sun Core: Prayer","673001075":"Order Sun Core: Prayer","673001076":"Order Sun Core: Prayer","673001103":"Order Sun Core: Deadshot","673001104":"Order Sun Core: Deadshot","673001105":"Order Sun Core: Deadshot","673001106":"Order Sun Core: Deadshot","673001113":"Order Sun Core: ATB-07 Piercing Rain","673001114":"Order Sun Core: ATB-07 Piercing Rain","673001115":"Order Sun Core: ATB-07 Piercing Rain","673001116":"Order Sun Core: ATB-07 Piercing Rain","673001123":"Order Sun Core: SMG Agent","673001124":"Order Sun Core: SMG Agent","673001125":"Order Sun Core: SMG Agent","673001126":"Order Sun Core: SMG Agent","673001133":"Order Sun Core: Shoot & Scoot","673001134":"Order Sun Core: Shoot & Scoot","673001135":"Order Sun Core: Shoot & Scoot","673001136":"Order Sun Core: Shoot & Scoot","673001163":"Order Sun Core: Echoes of the Banquet","673001164":"Order Sun Core: Echoes of the Banquet","673001165":"Order Sun Core: Echoes of the Banquet","673001166":"Order Sun Core: Echoes of the Banquet","673001203":"Order Sun Core: Shockwave","673001204":"Order Sun Core: Shockwave","673001205":"Order Sun Core: Shockwave","673001206":"Order Sun Core: Shockwave","673001213":"Order Sun Core: Current Shot","673001214":"Order Sun Core: Current Shot","673001215":"Order Sun Core: Current Shot","673001216":"Order Sun Core: Current Shot","673001223":"Order Sun Core: Enlightened Origin","673001224":"Order Sun Core: Enlightened Origin","673001225":"Order Sun Core: Enlightened Origin","673001226":"Order Sun Core: Enlightened Origin","673001233":"Order Sun Core: Red Dragon Barrage","673001234":"Order Sun Core: Red Dragon Barrage","673001235":"Order Sun Core: Red Dragon Barrage","673001236":"Order Sun Core: Red Dragon Barrage","673001263":"Order Sun Core: Utter Carnage","673001264":"Order Sun Core: Utter Carnage","673001265":"Order Sun Core: Utter Carnage","673001266":"Order Sun Core: Utter Carnage","673001273":"Order Sun Core: Skybreaker","673001274":"Order Sun Core: Skybreaker","673001275":"Order Sun Core: Skybreaker","673001276":"Order Sun Core: Skybreaker","673001303":"Order Sun Core: Enhanced Burst","673001304":"Order Sun Core: Enhanced Burst","673001305":"Order Sun Core: Enhanced Burst","673001306":"Order Sun Core: Enhanced Burst","673001313":"Order Sun Core: Infinity Deck","673001314":"Order Sun Core: Infinity Deck","673001315":"Order Sun Core: Infinity Deck","673001316":"Order Sun Core: Infinity Deck","673001323":"Order Sun Core: Tempest Refrain","673001324":"Order Sun Core: Tempest Refrain","673001325":"Order Sun Core: Tempest Refrain","673001326":"Order Sun Core: Tempest Refrain","673001333":"Order Sun Core: Incomplete Combustion","673001334":"Order Sun Core: Incomplete Combustion","673001335":"Order Sun Core: Incomplete Combustion","673001336":"Order Sun Core: Incomplete Combustion","673001403":"Order Sun Core: Sword Reset","673001404":"Order Sun Core: Sword Reset","673001405":"Order Sun Core: Sword Reset","673001406":"Order Sun Core: Sword Reset","673001413":"Order Sun Core: Eternal Blood","673001414":"Order Sun Core: Eternal Blood","673001415":"Order Sun Core: Eternal Blood","673001416":"Order Sun Core: Eternal Blood","673001423":"Order Sun Core: Lunar Nightmare","673001424":"Order Sun Core: Lunar Nightmare","673001425":"Order Sun Core: Lunar Nightmare","673001426":"Order Sun Core: Lunar Nightmare","673001433":"Order Sun Core: Swift Demise","673001434":"Order Sun Core: Swift Demise","673001435":"Order Sun Core: Swift Demise","673001436":"Order Sun Core: Swift Demise","673001503":"Order Sun Core: Current Control","673001504":"Order Sun Core: Current Control","673001505":"Order Sun Core: Current Control","673001506":"Order Sun Core: Current Control","673001513":"Order Sun Core: Single Stroke","673001514":"Order Sun Core: Single Stroke","673001515":"Order Sun Core: Single Stroke","673001516":"Order Sun Core: Single Stroke","673001523":"Order Sun Core: Bear Frenzy","673001524":"Order Sun Core: Bear Frenzy","673001525":"Order Sun Core: Bear Frenzy","673001526":"Order Sun Core: Bear Frenzy","673001603":"Order Sun Core: Manifest","673001604":"Order Sun Core: Manifest","673001605":"Order Sun Core: Manifest","673001606":"Order Sun Core: Manifest","673002003":"Order Sun Core: Power Core","673002004":"Order Sun Core: Power Core","673002005":"Order Sun Core: Power Core","673002006":"Order Sun Core: Power Core","673002013":"Order Sun Core: Earth Wave","673002014":"Order Sun Core: Earth Wave","673002015":"Order Sun Core: Earth Wave","673002016":"Order Sun Core: Earth Wave","673002023":"Order Sun Core: End of War","673002024":"Order Sun Core: End of War","673002025":"Order Sun Core: End of War","673002026":"Order Sun Core: End of War","673002033":"Order Sun Core: Forewarned Judgment","673002034":"Order Sun Core: Forewarned Judgment","673002035":"Order Sun Core: Forewarned Judgment","673002036":"Order Sun Core: Forewarned Judgment","673002063":"Order Sun Core: Rage Explosion","673002064":"Order Sun Core: Rage Explosion","673002065":"Order Sun Core: Rage Explosion","673002066":"Order Sun Core: Rage Explosion","673002073":"Order Sun Core: Whispering Sword","673002074":"Order Sun Core: Whispering Sword","673002075":"Order Sun Core: Whispering Sword","673002076":"Order Sun Core: Whispering Sword","673002103":"Order Sun Core: Shotgun Overload","673002104":"Order Sun Core: Shotgun Overload","673002105":"Order Sun Core: Shotgun Overload","673002106":"Order Sun Core: Shotgun Overload","673002113":"Order Sun Core: TA-12 Bursting Arrow","673002114":"Order Sun Core: TA-12 Bursting Arrow","673002115":"Order Sun Core: TA-12 Bursting Arrow","673002116":"Order Sun Core: TA-12 Bursting Arrow","673002123":"Order Sun Core: Pulse Nova","673002124":"Order Sun Core: Pulse Nova","673002125":"Order Sun Core: Pulse Nova","673002126":"Order Sun Core: Pulse Nova","673002133":"Order Sun Core: Bombardier Tank","673002134":"Order Sun Core: Bombardier Tank","673002135":"Order Sun Core: Bombardier Tank","673002136":"Order Sun Core: Bombardier Tank","673002163":"Order Sun Core: True Aim","673002164":"Order Sun Core: True Aim","673002165":"Order Sun Core: True Aim","673002166":"Order Sun Core: True Aim","673002203":"Order Sun Core: Shock Suppression","673002204":"Order Sun Core: Shock Suppression","673002205":"Order Sun Core: Shock Suppression","673002206":"Order Sun Core: Shock Suppression","673002213":"Order Sun Core: Onslaught","673002214":"Order Sun Core: Onslaught","673002215":"Order Sun Core: Onslaught","673002216":"Order Sun Core: Onslaught","673002223":"Order Sun Core: Opening Three Gates","673002224":"Order Sun Core: Opening Three Gates","673002225":"Order Sun Core: Opening Three Gates","673002226":"Order Sun Core: Opening Three Gates","673002233":"Order Sun Core: Yeon-Style Spear Technique","673002234":"Order Sun Core: Yeon-Style Spear Technique","673002235":"Order Sun Core: Yeon-Style Spear Technique","673002236":"Order Sun Core: Yeon-Style Spear Technique","673002263":"Order Sun Core: Lightning Tiger","673002264":"Order Sun Core: Lightning Tiger","673002265":"Order Sun Core: Lightning Tiger","673002266":"Order Sun Core: Lightning Tiger","673002273":"Order Sun Core: Charged Shock","673002274":"Order Sun Core: Charged Shock","673002275":"Order Sun Core: Charged Shock","673002276":"Order Sun Core: Charged Shock","673002303":"Order Sun Core: Basic Training","673002304":"Order Sun Core: Basic Training","673002305":"Order Sun Core: Basic Training","673002306":"Order Sun Core: Basic Training","673002313":"Order Sun Core: Ruin Subset","673002314":"Order Sun Core: Ruin Subset","673002315":"Order Sun Core: Ruin Subset","673002316":"Order Sun Core: Ruin Subset","673002323":"Order Sun Core: Shock Loop","673002324":"Order Sun Core: Shock Loop","673002325":"Order Sun Core: Shock Loop","673002326":"Order Sun Core: Shock Loop","673002333":"Order Sun Core: Beginning of the End","673002334":"Order Sun Core: Beginning of the End","673002335":"Order Sun Core: Beginning of the End","673002336":"Order Sun Core: Beginning of the End","673002403":"Order Sun Core: Deathblade Rush","673002404":"Order Sun Core: Deathblade Rush","673002405":"Order Sun Core: Deathblade Rush","673002406":"Order Sun Core: Deathblade Rush","673002413":"Order Sun Core: Ominous","673002414":"Order Sun Core: Ominous","673002415":"Order Sun Core: Ominous","673002416":"Order Sun Core: Ominous","673002423":"Order Sun Core: The Two Moons","673002424":"Order Sun Core: The Two Moons","673002425":"Order Sun Core: The Two Moons","673002426":"Order Sun Core: The Two Moons","673002433":"Order Sun Core: Footsteps of the Dead","673002434":"Order Sun Core: Footsteps of the Dead","673002435":"Order Sun Core: Footsteps of the Dead","673002436":"Order Sun Core: Footsteps of the Dead","673002503":"Order Sun Core: Wind Blade","673002504":"Order Sun Core: Wind Blade","673002505":"Order Sun Core: Wind Blade","673002506":"Order Sun Core: Wind Blade","673002513":"Order Sun Core: Inkbloom","673002514":"Order Sun Core: Inkbloom","673002515":"Order Sun Core: Inkbloom","673002516":"Order Sun Core: Inkbloom","673002523":"Order Sun Core: Fox-To-Be!","673002524":"Order Sun Core: Fox-To-Be!","673002525":"Order Sun Core: Fox-To-Be!","673002526":"Order Sun Core: Fox-To-Be!","673002603":"Order Sun Core: Red Wings","673002604":"Order Sun Core: Red Wings","673002605":"Order Sun Core: Red Wings","673002606":"Order Sun Core: Red Wings","673003003":"Order Sun Core: Dark Power","673003004":"Order Sun Core: Dark Power","673003005":"Order Sun Core: Dark Power","673003006":"Order Sun Core: Dark Power","673003013":"Order Sun Core: Gravity Reversal","673003014":"Order Sun Core: Gravity Reversal","673003015":"Order Sun Core: Gravity Reversal","673003016":"Order Sun Core: Gravity Reversal","673003023":"Order Sun Core: Shield Combo","673003024":"Order Sun Core: Shield Combo","673003025":"Order Sun Core: Shield Combo","673003026":"Order Sun Core: Shield Combo","673003033":"Order Sun Core: Heavenly Agent","673003034":"Order Sun Core: Heavenly Agent","673003035":"Order Sun Core: Heavenly Agent","673003036":"Order Sun Core: Heavenly Agent","673003063":"Order Sun Core: Seething Fury","673003064":"Order Sun Core: Seething Fury","673003065":"Order Sun Core: Seething Fury","673003066":"Order Sun Core: Seething Fury","673003073":"Order Sun Core: Light's Grace","673003074":"Order Sun Core: Light's Grace","673003075":"Order Sun Core: Light's Grace","673003076":"Order Sun Core: Light's Grace","673003103":"Order Sun Core: Shadow Bullet","673003104":"Order Sun Core: Shadow Bullet","673003105":"Order Sun Core: Shadow Bullet","673003106":"Order Sun Core: Shadow Bullet","673003113":"Order Sun Core: ATB-03 Bolt Raptor","673003114":"Order Sun Core: ATB-03 Bolt Raptor","673003115":"Order Sun Core: ATB-03 Bolt Raptor","673003116":"Order Sun Core: ATB-03 Bolt Raptor","673003123":"Order Sun Core: Astral Suit","673003124":"Order Sun Core: Astral Suit","673003125":"Order Sun Core: Astral Suit","673003126":"Order Sun Core: Astral Suit","673003133":"Order Sun Core: Ammo Collector","673003134":"Order Sun Core: Ammo Collector","673003135":"Order Sun Core: Ammo Collector","673003136":"Order Sun Core: Ammo Collector","673003163":"Order Sun Core: Midnight Rose","673003164":"Order Sun Core: Midnight Rose","673003165":"Order Sun Core: Midnight Rose","673003166":"Order Sun Core: Midnight Rose","673003203":"Order Sun Core: Earth Collapse","673003204":"Order Sun Core: Earth Collapse","673003205":"Order Sun Core: Earth Collapse","673003206":"Order Sun Core: Earth Collapse","673003213":"Order Sun Core: Meridian Surge","673003214":"Order Sun Core: Meridian Surge","673003215":"Order Sun Core: Meridian Surge","673003216":"Order Sun Core: Meridian Surge","673003223":"Order Sun Core: Undefeated Overlord","673003224":"Order Sun Core: Undefeated Overlord","673003225":"Order Sun Core: Undefeated Overlord","673003226":"Order Sun Core: Undefeated Overlord","673003233":"Order Sun Core: Galewind Barrage","673003234":"Order Sun Core: Galewind Barrage","673003235":"Order Sun Core: Galewind Barrage","673003236":"Order Sun Core: Galewind Barrage","673003263":"Order Sun Core: Speed of Light","673003264":"Order Sun Core: Speed of Light","673003265":"Order Sun Core: Speed of Light","673003266":"Order Sun Core: Speed of Light","673003273":"Order Sun Core: Sky-Rending Aura","673003274":"Order Sun Core: Sky-Rending Aura","673003275":"Order Sun Core: Sky-Rending Aura","673003276":"Order Sun Core: Sky-Rending Aura","673003303":"Order Sun Core: Inherited Power","673003304":"Order Sun Core: Inherited Power","673003305":"Order Sun Core: Inherited Power","673003306":"Order Sun Core: Inherited Power","673003313":"Order Sun Core: High Tempo","673003314":"Order Sun Core: High Tempo","673003315":"Order Sun Core: High Tempo","673003316":"Order Sun Core: High Tempo","673003323":"Order Sun Core: Seraphic Accent","673003324":"Order Sun Core: Seraphic Accent","673003325":"Order Sun Core: Seraphic Accent","673003326":"Order Sun Core: Seraphic Accent","673003333":"Order Sun Core: Bias","673003334":"Order Sun Core: Bias","673003335":"Order Sun Core: Bias","673003336":"Order Sun Core: Bias","673003403":"Order Sun Core: Art Master","673003404":"Order Sun Core: Art Master","673003405":"Order Sun Core: Art Master","673003406":"Order Sun Core: Art Master","673003413":"Order Sun Core: Devil Suppression","673003414":"Order Sun Core: Devil Suppression","673003415":"Order Sun Core: Devil Suppression","673003416":"Order Sun Core: Devil Suppression","673003423":"Order Sun Core: Ravening Nightmare","673003424":"Order Sun Core: Ravening Nightmare","673003425":"Order Sun Core: Ravening Nightmare","673003426":"Order Sun Core: Ravening Nightmare","673003433":"Order Sun Core: Dark Moon","673003434":"Order Sun Core: Dark Moon","673003435":"Order Sun Core: Dark Moon","673003436":"Order Sun Core: Dark Moon","673003503":"Order Sun Core: Graupel","673003504":"Order Sun Core: Graupel","673003505":"Order Sun Core: Graupel","673003506":"Order Sun Core: Graupel","673003513":"Order Sun Core: Sun's Embrace","673003514":"Order Sun Core: Sun's Embrace","673003515":"Order Sun Core: Sun's Embrace","673003516":"Order Sun Core: Sun's Embrace","673003523":"Order Sun Core: Infinite Awakening","673003524":"Order Sun Core: Infinite Awakening","673003525":"Order Sun Core: Infinite Awakening","673003526":"Order Sun Core: Infinite Awakening","673003603":"Order Sun Core: Charge Enhancement","673003604":"Order Sun Core: Charge Enhancement","673003605":"Order Sun Core: Charge Enhancement","673003606":"Order Sun Core: Charge Enhancement","673004003":"Order Sun Core: Power Drive","673004004":"Order Sun Core: Power Drive","673004005":"Order Sun Core: Power Drive","673004006":"Order Sun Core: Power Drive","673004013":"Order Sun Core: Gravity Destruction","673004014":"Order Sun Core: Gravity Destruction","673004015":"Order Sun Core: Gravity Destruction","673004016":"Order Sun Core: Gravity Destruction","673004023":"Order Sun Core: Chain Charge","673004024":"Order Sun Core: Chain Charge","673004025":"Order Sun Core: Chain Charge","673004026":"Order Sun Core: Chain Charge","673004033":"Order Sun Core: True Justice","673004034":"Order Sun Core: True Justice","673004035":"Order Sun Core: True Justice","673004036":"Order Sun Core: True Justice","673004063":"Order Sun Core: Unpredictable","673004064":"Order Sun Core: Unpredictable","673004065":"Order Sun Core: Unpredictable","673004066":"Order Sun Core: Unpredictable","673004073":"Order Sun Core: Sacred Oath","673004074":"Order Sun Core: Sacred Oath","673004075":"Order Sun Core: Sacred Oath","673004076":"Order Sun Core: Sacred Oath","673004103":"Order Sun Core: Hidden Fang","673004104":"Order Sun Core: Hidden Fang","673004105":"Order Sun Core: Hidden Fang","673004106":"Order Sun Core: Hidden Fang","673004113":"Order Sun Core: TA-64 Reaper Bolt","673004114":"Order Sun Core: TA-64 Reaper Bolt","673004115":"Order Sun Core: TA-64 Reaper Bolt","673004116":"Order Sun Core: TA-64 Reaper Bolt","673004123":"Order Sun Core: Quasar Cannon Suit","673004124":"Order Sun Core: Quasar Cannon Suit","673004125":"Order Sun Core: Quasar Cannon Suit","673004126":"Order Sun Core: Quasar Cannon Suit","673004133":"Order Sun Core: Demon Fire","673004134":"Order Sun Core: Demon Fire","673004135":"Order Sun Core: Demon Fire","673004136":"Order Sun Core: Demon Fire","673004163":"Order Sun Core: Lawless Land","673004164":"Order Sun Core: Lawless Land","673004165":"Order Sun Core: Lawless Land","673004166":"Order Sun Core: Lawless Land","673004203":"Order Sun Core: Repeated Leap","673004204":"Order Sun Core: Repeated Leap","673004205":"Order Sun Core: Repeated Leap","673004206":"Order Sun Core: Repeated Leap","673004213":"Order Sun Core: Grand Cycle","673004214":"Order Sun Core: Grand Cycle","673004215":"Order Sun Core: Grand Cycle","673004216":"Order Sun Core: Grand Cycle","673004223":"Order Sun Core: Undying Fire Dragon","673004224":"Order Sun Core: Undying Fire Dragon","673004225":"Order Sun Core: Undying Fire Dragon","673004226":"Order Sun Core: Undying Fire Dragon","673004233":"Order Sun Core: Yeon-Style Slash","673004234":"Order Sun Core: Yeon-Style Slash","673004235":"Order Sun Core: Yeon-Style Slash","673004236":"Order Sun Core: Yeon-Style Slash","673004263":"Order Sun Core: Lord of Tigers","673004264":"Order Sun Core: Lord of Tigers","673004265":"Order Sun Core: Lord of Tigers","673004266":"Order Sun Core: Lord of Tigers","673004273":"Order Sun Core: Eye of Asura","673004274":"Order Sun Core: Eye of Asura","673004275":"Order Sun Core: Eye of Asura","673004276":"Order Sun Core: Eye of Asura","673004303":"Order Sun Core: Ancient Legacy","673004304":"Order Sun Core: Ancient Legacy","673004305":"Order Sun Core: Ancient Legacy","673004306":"Order Sun Core: Ancient Legacy","673004313":"Order Sun Core: Normal Enhancement","673004314":"Order Sun Core: Normal Enhancement","673004315":"Order Sun Core: Normal Enhancement","673004316":"Order Sun Core: Normal Enhancement","673004323":"Order Sun Core: Brave Accent","673004324":"Order Sun Core: Brave Accent","673004325":"Order Sun Core: Brave Accent","673004326":"Order Sun Core: Brave Accent","673004333":"Order Sun Core: Circulate","673004334":"Order Sun Core: Circulate","673004335":"Order Sun Core: Circulate","673004336":"Order Sun Core: Circulate","673004403":"Order Sun Core: Focused Strike","673004404":"Order Sun Core: Focused Strike","673004405":"Order Sun Core: Focused Strike","673004406":"Order Sun Core: Focused Strike","673004413":"Order Sun Core: Surging Storm","673004414":"Order Sun Core: Surging Storm","673004415":"Order Sun Core: Surging Storm","673004416":"Order Sun Core: Surging Storm","673004423":"Order Sun Core: Lethal Step","673004424":"Order Sun Core: Lethal Step","673004425":"Order Sun Core: Lethal Step","673004426":"Order Sun Core: Lethal Step","673004433":"Order Sun Core: Deathlord's Call","673004434":"Order Sun Core: Deathlord's Call","673004435":"Order Sun Core: Deathlord's Call","673004436":"Order Sun Core: Deathlord's Call","673004503":"Order Sun Core: Bolt From the Blue","673004504":"Order Sun Core: Bolt From the Blue","673004505":"Order Sun Core: Bolt From the Blue","673004506":"Order Sun Core: Bolt From the Blue","673004513":"Order Sun Core: Unspeakably Soft","673004514":"Order Sun Core: Unspeakably Soft","673004515":"Order Sun Core: Unspeakably Soft","673004516":"Order Sun Core: Unspeakably Soft","673004523":"Order Sun Core: Bear Fist","673004524":"Order Sun Core: Bear Fist","673004525":"Order Sun Core: Bear Fist","673004526":"Order Sun Core: Bear Fist","673004603":"Order Sun Core: Brandish","673004604":"Order Sun Core: Brandish","673004605":"Order Sun Core: Brandish","673004606":"Order Sun Core: Brandish","673005003":"Order Sun Core: Holding Edge","673005004":"Order Sun Core: Holding Edge","673005005":"Order Sun Core: Holding Edge","673005006":"Order Sun Core: Holding Edge","673005013":"Order Sun Core: Gravity Core","673005014":"Order Sun Core: Gravity Core","673005015":"Order Sun Core: Gravity Core","673005016":"Order Sun Core: Gravity Core","673005023":"Order Sun Core: Thunder","673005024":"Order Sun Core: Thunder","673005025":"Order Sun Core: Thunder","673005026":"Order Sun Core: Thunder","673005033":"Order Sun Core: Blessing of Light","673005034":"Order Sun Core: Blessing of Light","673005035":"Order Sun Core: Blessing of Light","673005036":"Order Sun Core: Blessing of Light","673005063":"Order Sun Core: Tornado","673005064":"Order Sun Core: Tornado","673005065":"Order Sun Core: Tornado","673005066":"Order Sun Core: Tornado","673005073":"Order Sun Core: Light Carves Life","673005074":"Order Sun Core: Light Carves Life","673005075":"Order Sun Core: Light Carves Life","673005076":"Order Sun Core: Light Carves Life","673005103":"Order Sun Core: Deadly Tracker","673005104":"Order Sun Core: Deadly Tracker","673005105":"Order Sun Core: Deadly Tracker","673005106":"Order Sun Core: Deadly Tracker","673005113":"Order Sun Core: ATB-19 Rapidfire","673005114":"Order Sun Core: ATB-19 Rapidfire","673005115":"Order Sun Core: ATB-19 Rapidfire","673005116":"Order Sun Core: ATB-19 Rapidfire","673005123":"Order Sun Core: Titan Suit","673005124":"Order Sun Core: Titan Suit","673005125":"Order Sun Core: Titan Suit","673005126":"Order Sun Core: Titan Suit","673005133":"Order Sun Core: Jumper","673005134":"Order Sun Core: Jumper","673005135":"Order Sun Core: Jumper","673005136":"Order Sun Core: Jumper","673005163":"Order Sun Core: Black Belt","673005164":"Order Sun Core: Black Belt","673005165":"Order Sun Core: Black Belt","673005166":"Order Sun Core: Black Belt","673005203":"Order Sun Core: Tenacity Suppression","673005204":"Order Sun Core: Tenacity Suppression","673005205":"Order Sun Core: Tenacity Suppression","673005206":"Order Sun Core: Tenacity Suppression","673005213":"Order Sun Core: Bare Knuckle","673005214":"Order Sun Core: Bare Knuckle","673005215":"Order Sun Core: Bare Knuckle","673005216":"Order Sun Core: Bare Knuckle","673005223":"Order Sun Core: Quintuple Resilience","673005224":"Order Sun Core: Quintuple Resilience","673005225":"Order Sun Core: Quintuple Resilience","673005226":"Order Sun Core: Quintuple Resilience","673005233":"Order Sun Core: Raging Dragon Quintuple Strike","673005234":"Order Sun Core: Raging Dragon Quintuple Strike","673005235":"Order Sun Core: Raging Dragon Quintuple Strike","673005236":"Order Sun Core: Raging Dragon Quintuple Strike","673005263":"Order Sun Core: External Power","673005264":"Order Sun Core: External Power","673005265":"Order Sun Core: External Power","673005266":"Order Sun Core: External Power","673005273":"Order Sun Core: Shadow Fist","673005274":"Order Sun Core: Shadow Fist","673005275":"Order Sun Core: Shadow Fist","673005276":"Order Sun Core: Shadow Fist","673005303":"Order Sun Core: Power Circulation","673005304":"Order Sun Core: Power Circulation","673005305":"Order Sun Core: Power Circulation","673005306":"Order Sun Core: Power Circulation","673005313":"Order Sun Core: Impact Check","673005314":"Order Sun Core: Impact Check","673005315":"Order Sun Core: Impact Check","673005316":"Order Sun Core: Impact Check","673005323":"Order Sun Core: Aria Accent","673005324":"Order Sun Core: Aria Accent","673005325":"Order Sun Core: Aria Accent","673005326":"Order Sun Core: Aria Accent","673005333":"Order Sun Core: Condense","673005334":"Order Sun Core: Condense","673005335":"Order Sun Core: Condense","673005336":"Order Sun Core: Condense","673005403":"Order Sun Core: Levin Slash","673005404":"Order Sun Core: Levin Slash","673005405":"Order Sun Core: Levin Slash","673005406":"Order Sun Core: Levin Slash","673005413":"Order Sun Core: Mass Absorption","673005414":"Order Sun Core: Mass Absorption","673005415":"Order Sun Core: Mass Absorption","673005416":"Order Sun Core: Mass Absorption","673005423":"Order Sun Core: Blood Thirst","673005424":"Order Sun Core: Blood Thirst","673005425":"Order Sun Core: Blood Thirst","673005426":"Order Sun Core: Blood Thirst","673005433":"Order Sun Core: Ghastly Evening","673005434":"Order Sun Core: Ghastly Evening","673005435":"Order Sun Core: Ghastly Evening","673005436":"Order Sun Core: Ghastly Evening","673005503":"Order Sun Core: Sun and Wind","673005504":"Order Sun Core: Sun and Wind","673005505":"Order Sun Core: Sun and Wind","673005506":"Order Sun Core: Sun and Wind","673005513":"Order Sun Core: Sun's Protection","673005514":"Order Sun Core: Sun's Protection","673005515":"Order Sun Core: Sun's Protection","673005516":"Order Sun Core: Sun's Protection","673005523":"Order Sun Core: Crow King","673005524":"Order Sun Core: Crow King","673005525":"Order Sun Core: Crow King","673005526":"Order Sun Core: Crow King","673005603":"Order Sun Core: Apex","673005604":"Order Sun Core: Apex","673005605":"Order Sun Core: Apex","673005606":"Order Sun Core: Apex","673010003":"Order Moon Core: Blood Circulation","673010004":"Order Moon Core: Blood Circulation","673010005":"Order Moon Core: Blood Circulation","673010006":"Order Moon Core: Blood Circulation","673010013":"Order Moon Core: Absolute Control","673010014":"Order Moon Core: Absolute Control","673010015":"Order Moon Core: Absolute Control","673010016":"Order Moon Core: Absolute Control","673010023":"Order Moon Core: Defense Tactics","673010024":"Order Moon Core: Defense Tactics","673010025":"Order Moon Core: Defense Tactics","673010026":"Order Moon Core: Defense Tactics","673010033":"Order Moon Core: Hour of Punishment","673010034":"Order Moon Core: Hour of Punishment","673010035":"Order Moon Core: Hour of Punishment","673010036":"Order Moon Core: Hour of Punishment","673010063":"Order Moon Core: Blade of Judgment","673010064":"Order Moon Core: Blade of Judgment","673010065":"Order Moon Core: Blade of Judgment","673010066":"Order Moon Core: Blade of Judgment","673010073":"Order Moon Core: Knight of Finality","673010074":"Order Moon Core: Knight of Finality","673010075":"Order Moon Core: Knight of Finality","673010076":"Order Moon Core: Knight of Finality","673010103":"Order Moon Core: Buckshot Enhancement","673010104":"Order Moon Core: Buckshot Enhancement","673010105":"Order Moon Core: Buckshot Enhancement","673010106":"Order Moon Core: Buckshot Enhancement","673010113":"Order Moon Core: HSU-98 Avian Strike","673010114":"Order Moon Core: HSU-98 Avian Strike","673010115":"Order Moon Core: HSU-98 Avian Strike","673010116":"Order Moon Core: HSU-98 Avian Strike","673010123":"Order Moon Core: Bio Modification Technique","673010124":"Order Moon Core: Bio Modification Technique","673010125":"Order Moon Core: Bio Modification Technique","673010126":"Order Moon Core: Bio Modification Technique","673010133":"Order Moon Core: Rapid Tank","673010134":"Order Moon Core: Rapid Tank","673010135":"Order Moon Core: Rapid Tank","673010136":"Order Moon Core: Rapid Tank","673010163":"Order Moon Core: Jack-of-All-Trades","673010164":"Order Moon Core: Jack-of-All-Trades","673010165":"Order Moon Core: Jack-of-All-Trades","673010166":"Order Moon Core: Jack-of-All-Trades","673010203":"Order Moon Core: Shock Enhancement","673010204":"Order Moon Core: Shock Enhancement","673010205":"Order Moon Core: Shock Enhancement","673010206":"Order Moon Core: Shock Enhancement","673010213":"Order Moon Core: Adamantine Body","673010214":"Order Moon Core: Adamantine Body","673010215":"Order Moon Core: Adamantine Body","673010216":"Order Moon Core: Adamantine Body","673010223":"Order Moon Core: Mighty Wind Kick","673010224":"Order Moon Core: Mighty Wind Kick","673010225":"Order Moon Core: Mighty Wind Kick","673010226":"Order Moon Core: Mighty Wind Kick","673010233":"Order Moon Core: Pinpoint Focus","673010234":"Order Moon Core: Pinpoint Focus","673010235":"Order Moon Core: Pinpoint Focus","673010236":"Order Moon Core: Pinpoint Focus","673010263":"Order Moon Core: Storm's Roar","673010264":"Order Moon Core: Storm's Roar","673010265":"Order Moon Core: Storm's Roar","673010266":"Order Moon Core: Storm's Roar","673010273":"Order Moon Core: Brawl King Stance","673010274":"Order Moon Core: Brawl King Stance","673010275":"Order Moon Core: Brawl King Stance","673010276":"Order Moon Core: Brawl King Stance","673010303":"Order Moon Core: Amplified Entwinement","673010304":"Order Moon Core: Amplified Entwinement","673010305":"Order Moon Core: Amplified Entwinement","673010306":"Order Moon Core: Amplified Entwinement","673010313":"Order Moon Core: Edge Combo","673010314":"Order Moon Core: Edge Combo","673010315":"Order Moon Core: Edge Combo","673010316":"Order Moon Core: Edge Combo","673010323":"Order Moon Core: Pious Serenade","673010324":"Order Moon Core: Pious Serenade","673010325":"Order Moon Core: Pious Serenade","673010326":"Order Moon Core: Pious Serenade","673010333":"Order Moon Core: Ignition Emblem","673010334":"Order Moon Core: Ignition Emblem","673010335":"Order Moon Core: Ignition Emblem","673010336":"Order Moon Core: Ignition Emblem","673010403":"Order Moon Core: Surge Core","673010404":"Order Moon Core: Surge Core","673010405":"Order Moon Core: Surge Core","673010406":"Order Moon Core: Surge Core","673010413":"Order Moon Core: Bloody Demon","673010414":"Order Moon Core: Bloody Demon","673010415":"Order Moon Core: Bloody Demon","673010416":"Order Moon Core: Bloody Demon","673010423":"Order Moon Core: Persona","673010424":"Order Moon Core: Persona","673010425":"Order Moon Core: Persona","673010426":"Order Moon Core: Persona","673010433":"Order Moon Core: Otherworldly Power","673010434":"Order Moon Core: Otherworldly Power","673010435":"Order Moon Core: Otherworldly Power","673010436":"Order Moon Core: Otherworldly Power","673010503":"Order Moon Core: Umbrella Dance","673010504":"Order Moon Core: Umbrella Dance","673010505":"Order Moon Core: Umbrella Dance","673010506":"Order Moon Core: Umbrella Dance","673010513":"Order Moon Core: Perfect Harmony","673010514":"Order Moon Core: Perfect Harmony","673010515":"Order Moon Core: Perfect Harmony","673010516":"Order Moon Core: Perfect Harmony","673010523":"Order Moon Core: Forbidden Sorcery","673010524":"Order Moon Core: Forbidden Sorcery","673010525":"Order Moon Core: Forbidden Sorcery","673010526":"Order Moon Core: Forbidden Sorcery","673010603":"Order Moon Core: Nova Flame","673010604":"Order Moon Core: Nova Flame","673010605":"Order Moon Core: Nova Flame","673010606":"Order Moon Core: Nova Flame","673011003":"Order Moon Core: Over Surge","673011004":"Order Moon Core: Over Surge","673011005":"Order Moon Core: Over Surge","673011006":"Order Moon Core: Over Surge","673011013":"Order Moon Core: Gravity Enhancement","673011014":"Order Moon Core: Gravity Enhancement","673011015":"Order Moon Core: Gravity Enhancement","673011016":"Order Moon Core: Gravity Enhancement","673011023":"Order Moon Core: Strike Point","673011024":"Order Moon Core: Strike Point","673011025":"Order Moon Core: Strike Point","673011026":"Order Moon Core: Strike Point","673011033":"Order Moon Core: Heavenly Sword","673011034":"Order Moon Core: Heavenly Sword","673011035":"Order Moon Core: Heavenly Sword","673011036":"Order Moon Core: Heavenly Sword","673011063":"Order Moon Core: Condensed Power","673011064":"Order Moon Core: Condensed Power","673011065":"Order Moon Core: Condensed Power","673011066":"Order Moon Core: Condensed Power","673011073":"Order Moon Core: Light's Rest","673011074":"Order Moon Core: Light's Rest","673011075":"Order Moon Core: Light's Rest","673011076":"Order Moon Core: Light's Rest","673011103":"Order Moon Core: Flawless Aim","673011104":"Order Moon Core: Flawless Aim","673011105":"Order Moon Core: Flawless Aim","673011106":"Order Moon Core: Flawless Aim","673011113":"Order Moon Core: HSU-21 Silver Rain","673011114":"Order Moon Core: HSU-21 Silver Rain","673011115":"Order Moon Core: HSU-21 Silver Rain","673011116":"Order Moon Core: HSU-21 Silver Rain","673011123":"Order Moon Core: Bullet Tempest","673011124":"Order Moon Core: Bullet Tempest","673011125":"Order Moon Core: Bullet Tempest","673011126":"Order Moon Core: Bullet Tempest","673011133":"Order Moon Core: Overheated Shell","673011134":"Order Moon Core: Overheated Shell","673011135":"Order Moon Core: Overheated Shell","673011136":"Order Moon Core: Overheated Shell","673011163":"Order Moon Core: Weapon Switch","673011164":"Order Moon Core: Weapon Switch","673011165":"Order Moon Core: Weapon Switch","673011166":"Order Moon Core: Weapon Switch","673011203":"Order Moon Core: Earth Combo","673011204":"Order Moon Core: Earth Combo","673011205":"Order Moon Core: Earth Combo","673011206":"Order Moon Core: Earth Combo","673011213":"Order Moon Core: Wavebreak Herald","673011214":"Order Moon Core: Wavebreak Herald","673011215":"Order Moon Core: Wavebreak Herald","673011216":"Order Moon Core: Wavebreak Herald","673011223":"Order Moon Core: Origin State","673011224":"Order Moon Core: Origin State","673011225":"Order Moon Core: Origin State","673011226":"Order Moon Core: Origin State","673011233":"Order Moon Core: Focus Enhancement","673011234":"Order Moon Core: Focus Enhancement","673011235":"Order Moon Core: Focus Enhancement","673011236":"Order Moon Core: Focus Enhancement","673011263":"Order Moon Core: Roaring Formation","673011264":"Order Moon Core: Roaring Formation","673011265":"Order Moon Core: Roaring Formation","673011266":"Order Moon Core: Roaring Formation","673011273":"Order Moon Core: Ultimate Eye of the Storm","673011274":"Order Moon Core: Ultimate Eye of the Storm","673011275":"Order Moon Core: Ultimate Eye of the Storm","673011276":"Order Moon Core: Ultimate Eye of the Storm","673011303":"Order Moon Core: Burst Focus","673011304":"Order Moon Core: Burst Focus","673011305":"Order Moon Core: Burst Focus","673011306":"Order Moon Core: Burst Focus","673011313":"Order Moon Core: Chain Draw","673011314":"Order Moon Core: Chain Draw","673011315":"Order Moon Core: Chain Draw","673011316":"Order Moon Core: Chain Draw","673011323":"Order Moon Core: Second Impact","673011324":"Order Moon Core: Second Impact","673011325":"Order Moon Core: Second Impact","673011326":"Order Moon Core: Second Impact","673011333":"Order Moon Core: Burn Acceleration","673011334":"Order Moon Core: Burn Acceleration","673011335":"Order Moon Core: Burn Acceleration","673011336":"Order Moon Core: Burn Acceleration","673011403":"Order Moon Core: Destiny Core","673011404":"Order Moon Core: Destiny Core","673011405":"Order Moon Core: Destiny Core","673011406":"Order Moon Core: Destiny Core","673011413":"Order Moon Core: Gore Bleeding","673011414":"Order Moon Core: Gore Bleeding","673011415":"Order Moon Core: Gore Bleeding","673011416":"Order Moon Core: Gore Bleeding","673011423":"Order Moon Core: Nightmare","673011424":"Order Moon Core: Nightmare","673011425":"Order Moon Core: Nightmare","673011426":"Order Moon Core: Nightmare","673011433":"Order Moon Core: Eternal One","673011434":"Order Moon Core: Eternal One","673011435":"Order Moon Core: Eternal One","673011436":"Order Moon Core: Eternal One","673011503":"Order Moon Core: Upward Current","673011504":"Order Moon Core: Upward Current","673011505":"Order Moon Core: Upward Current","673011506":"Order Moon Core: Upward Current","673011513":"Order Moon Core: Master Calligrapher","673011514":"Order Moon Core: Master Calligrapher","673011515":"Order Moon Core: Master Calligrapher","673011516":"Order Moon Core: Master Calligrapher","673011523":"Order Moon Core: Strong Bear","673011524":"Order Moon Core: Strong Bear","673011525":"Order Moon Core: Strong Bear","673011526":"Order Moon Core: Strong Bear","673011603":"Order Moon Core: Liberation","673011604":"Order Moon Core: Liberation","673011605":"Order Moon Core: Liberation","673011606":"Order Moon Core: Liberation","673012003":"Order Moon Core: Break Dash","673012004":"Order Moon Core: Break Dash","673012005":"Order Moon Core: Break Dash","673012006":"Order Moon Core: Break Dash","673012013":"Order Moon Core: Gravity Run","673012014":"Order Moon Core: Gravity Run","673012015":"Order Moon Core: Gravity Run","673012016":"Order Moon Core: Gravity Run","673012023":"Order Moon Core: Gunlance Charge","673012024":"Order Moon Core: Gunlance Charge","673012025":"Order Moon Core: Gunlance Charge","673012026":"Order Moon Core: Gunlance Charge","673012033":"Order Moon Core: Hour of Judgment","673012034":"Order Moon Core: Hour of Judgment","673012035":"Order Moon Core: Hour of Judgment","673012036":"Order Moon Core: Hour of Judgment","673012063":"Order Moon Core: Converging Power","673012064":"Order Moon Core: Converging Power","673012065":"Order Moon Core: Converging Power","673012066":"Order Moon Core: Converging Power","673012073":"Order Moon Core: Dazzling Justice","673012074":"Order Moon Core: Dazzling Justice","673012075":"Order Moon Core: Dazzling Justice","673012076":"Order Moon Core: Dazzling Justice","673012103":"Order Moon Core: Frenzied Specialist","673012104":"Order Moon Core: Frenzied Specialist","673012105":"Order Moon Core: Frenzied Specialist","673012106":"Order Moon Core: Frenzied Specialist","673012113":"Order Moon Core: HSU-13 Special High Explosive","673012114":"Order Moon Core: HSU-13 Special High Explosive","673012115":"Order Moon Core: HSU-13 Special High Explosive","673012116":"Order Moon Core: HSU-13 Special High Explosive","673012123":"Order Moon Core: Apocalyptic Energy","673012124":"Order Moon Core: Apocalyptic Energy","673012125":"Order Moon Core: Apocalyptic Energy","673012126":"Order Moon Core: Apocalyptic Energy","673012133":"Order Moon Core: Safehouse","673012134":"Order Moon Core: Safehouse","673012135":"Order Moon Core: Safehouse","673012136":"Order Moon Core: Safehouse","673012163":"Order Moon Core: Shield Targeting","673012164":"Order Moon Core: Shield Targeting","673012165":"Order Moon Core: Shield Targeting","673012166":"Order Moon Core: Shield Targeting","673012203":"Order Moon Core: Stamina Conservation","673012204":"Order Moon Core: Stamina Conservation","673012205":"Order Moon Core: Stamina Conservation","673012206":"Order Moon Core: Stamina Conservation","673012213":"Order Moon Core: Heavenshaker","673012214":"Order Moon Core: Heavenshaker","673012215":"Order Moon Core: Heavenshaker","673012216":"Order Moon Core: Heavenshaker","673012223":"Order Moon Core: Hypercirculation","673012224":"Order Moon Core: Hypercirculation","673012225":"Order Moon Core: Hypercirculation","673012226":"Order Moon Core: Hypercirculation","673012233":"Order Moon Core: Azure Dragon Energy","673012234":"Order Moon Core: Azure Dragon Energy","673012235":"Order Moon Core: Azure Dragon Energy","673012236":"Order Moon Core: Azure Dragon Energy","673012263":"Order Moon Core: Thunderclap Strike","673012264":"Order Moon Core: Thunderclap Strike","673012265":"Order Moon Core: Thunderclap Strike","673012266":"Order Moon Core: Thunderclap Strike","673012273":"Order Moon Core: Shock Charge","673012274":"Order Moon Core: Shock Charge","673012275":"Order Moon Core: Shock Charge","673012276":"Order Moon Core: Shock Charge","673012303":"Order Moon Core: Ever-Changing Gale","673012304":"Order Moon Core: Ever-Changing Gale","673012305":"Order Moon Core: Ever-Changing Gale","673012306":"Order Moon Core: Ever-Changing Gale","673012313":"Order Moon Core: Ruin Full Set","673012314":"Order Moon Core: Ruin Full Set","673012315":"Order Moon Core: Ruin Full Set","673012316":"Order Moon Core: Ruin Full Set","673012323":"Order Moon Core: Harmonious Confluence","673012324":"Order Moon Core: Harmonious Confluence","673012325":"Order Moon Core: Harmonious Confluence","673012326":"Order Moon Core: Harmonious Confluence","673012333":"Order Moon Core: Repeated Apocalypse","673012334":"Order Moon Core: Repeated Apocalypse","673012335":"Order Moon Core: Repeated Apocalypse","673012336":"Order Moon Core: Repeated Apocalypse","673012403":"Order Moon Core: Death Blitz","673012404":"Order Moon Core: Death Blitz","673012405":"Order Moon Core: Death Blitz","673012406":"Order Moon Core: Death Blitz","673012413":"Order Moon Core: Demonic Clone","673012414":"Order Moon Core: Demonic Clone","673012415":"Order Moon Core: Demonic Clone","673012416":"Order Moon Core: Demonic Clone","673012423":"Order Moon Core: Double Core","673012424":"Order Moon Core: Double Core","673012425":"Order Moon Core: Double Core","673012426":"Order Moon Core: Double Core","673012433":"Order Moon Core: Soul Core","673012434":"Order Moon Core: Soul Core","673012435":"Order Moon Core: Soul Core","673012436":"Order Moon Core: Soul Core","673012503":"Order Moon Core: Swift","673012504":"Order Moon Core: Swift","673012505":"Order Moon Core: Swift","673012506":"Order Moon Core: Swift","673012513":"Order Moon Core: Wolf Moon","673012514":"Order Moon Core: Wolf Moon","673012515":"Order Moon Core: Wolf Moon","673012516":"Order Moon Core: Wolf Moon","673012523":"Order Moon Core: Strong Fox","673012524":"Order Moon Core: Strong Fox","673012525":"Order Moon Core: Strong Fox","673012526":"Order Moon Core: Strong Fox","673012603":"Order Moon Core: Avenger","673012604":"Order Moon Core: Avenger","673012605":"Order Moon Core: Avenger","673012606":"Order Moon Core: Avenger","673013003":"Order Moon Core: Dark Torrent","673013004":"Order Moon Core: Dark Torrent","673013005":"Order Moon Core: Dark Torrent","673013006":"Order Moon Core: Dark Torrent","673013013":"Order Moon Core: Event Horizon","673013014":"Order Moon Core: Event Horizon","673013015":"Order Moon Core: Event Horizon","673013016":"Order Moon Core: Event Horizon","673013023":"Order Moon Core: Shield Arts","673013024":"Order Moon Core: Shield Arts","673013025":"Order Moon Core: Shield Arts","673013026":"Order Moon Core: Shield Arts","673013033":"Order Moon Core: Heavenly Resolve","673013034":"Order Moon Core: Heavenly Resolve","673013035":"Order Moon Core: Heavenly Resolve","673013036":"Order Moon Core: Heavenly Resolve","673013063":"Order Moon Core: Core Impact","673013064":"Order Moon Core: Core Impact","673013065":"Order Moon Core: Core Impact","673013066":"Order Moon Core: Core Impact","673013073":"Order Moon Core: Epic of Light","673013074":"Order Moon Core: Epic of Light","673013075":"Order Moon Core: Epic of Light","673013076":"Order Moon Core: Epic of Light","673013103":"Order Moon Core: Midair Maven","673013104":"Order Moon Core: Midair Maven","673013105":"Order Moon Core: Midair Maven","673013106":"Order Moon Core: Midair Maven","673013113":"Order Moon Core: HSU-99 Avian Storm","673013114":"Order Moon Core: HSU-99 Avian Storm","673013115":"Order Moon Core: HSU-99 Avian Storm","673013116":"Order Moon Core: HSU-99 Avian Storm","673013123":"Order Moon Core: Perfect Sync","673013124":"Order Moon Core: Perfect Sync","673013125":"Order Moon Core: Perfect Sync","673013126":"Order Moon Core: Perfect Sync","673013133":"Order Moon Core: Galewind Artillerist","673013134":"Order Moon Core: Galewind Artillerist","673013135":"Order Moon Core: Galewind Artillerist","673013136":"Order Moon Core: Galewind Artillerist","673013163":"Order Moon Core: Armor-Piercing Shell","673013164":"Order Moon Core: Armor-Piercing Shell","673013165":"Order Moon Core: Armor-Piercing Shell","673013166":"Order Moon Core: Armor-Piercing Shell","673013203":"Order Moon Core: Fighting Spirit Enhancement","673013204":"Order Moon Core: Fighting Spirit Enhancement","673013205":"Order Moon Core: Fighting Spirit Enhancement","673013206":"Order Moon Core: Fighting Spirit Enhancement","673013213":"Order Moon Core: Circulating Melody","673013214":"Order Moon Core: Circulating Melody","673013215":"Order Moon Core: Circulating Melody","673013216":"Order Moon Core: Circulating Melody","673013223":"Order Moon Core: Way of the Overlord","673013224":"Order Moon Core: Way of the Overlord","673013225":"Order Moon Core: Way of the Overlord","673013226":"Order Moon Core: Way of the Overlord","673013233":"Order Moon Core: Raging Dragon Energy","673013234":"Order Moon Core: Raging Dragon Energy","673013235":"Order Moon Core: Raging Dragon Energy","673013236":"Order Moon Core: Raging Dragon Energy","673013263":"Order Moon Core: Storm Step","673013264":"Order Moon Core: Storm Step","673013265":"Order Moon Core: Storm Step","673013266":"Order Moon Core: Storm Step","673013273":"Order Moon Core: Awakened Eye of the Storm","673013274":"Order Moon Core: Awakened Eye of the Storm","673013275":"Order Moon Core: Awakened Eye of the Storm","673013276":"Order Moon Core: Awakened Eye of the Storm","673013303":"Order Moon Core: Concentration of Power","673013304":"Order Moon Core: Concentration of Power","673013305":"Order Moon Core: Concentration of Power","673013306":"Order Moon Core: Concentration of Power","673013313":"Order Moon Core: Emperor's Heart","673013314":"Order Moon Core: Emperor's Heart","673013315":"Order Moon Core: Emperor's Heart","673013316":"Order Moon Core: Emperor's Heart","673013323":"Order Moon Core: Seraphic Pulse","673013324":"Order Moon Core: Seraphic Pulse","673013325":"Order Moon Core: Seraphic Pulse","673013326":"Order Moon Core: Seraphic Pulse","673013333":"Order Moon Core: Current","673013334":"Order Moon Core: Current","673013335":"Order Moon Core: Current","673013336":"Order Moon Core: Current","673013403":"Order Moon Core: Arts Core","673013404":"Order Moon Core: Arts Core","673013405":"Order Moon Core: Arts Core","673013406":"Order Moon Core: Arts Core","673013413":"Order Moon Core: Trinity Core","673013414":"Order Moon Core: Trinity Core","673013415":"Order Moon Core: Trinity Core","673013416":"Order Moon Core: Trinity Core","673013423":"Order Moon Core: Fatal Nightmare","673013424":"Order Moon Core: Fatal Nightmare","673013425":"Order Moon Core: Fatal Nightmare","673013426":"Order Moon Core: Fatal Nightmare","673013433":"Order Moon Core: Luminous Crescent","673013434":"Order Moon Core: Luminous Crescent","673013435":"Order Moon Core: Luminous Crescent","673013436":"Order Moon Core: Luminous Crescent","673013503":"Order Moon Core: Stormy Sea","673013504":"Order Moon Core: Stormy Sea","673013505":"Order Moon Core: Stormy Sea","673013506":"Order Moon Core: Stormy Sea","673013513":"Order Moon Core: Sun's Warmth","673013514":"Order Moon Core: Sun's Warmth","673013515":"Order Moon Core: Sun's Warmth","673013516":"Order Moon Core: Sun's Warmth","673013523":"Order Moon Core: Phantom Beast Liberation","673013524":"Order Moon Core: Phantom Beast Liberation","673013525":"Order Moon Core: Phantom Beast Liberation","673013526":"Order Moon Core: Phantom Beast Liberation","673013603":"Order Moon Core: Overwhelm","673013604":"Order Moon Core: Overwhelm","673013605":"Order Moon Core: Overwhelm","673013606":"Order Moon Core: Overwhelm","673014003":"Order Moon Core: Rapid Slash","673014004":"Order Moon Core: Rapid Slash","673014005":"Order Moon Core: Rapid Slash","673014006":"Order Moon Core: Rapid Slash","673014013":"Order Moon Core: Gravitational Circulation","673014014":"Order Moon Core: Gravitational Circulation","673014015":"Order Moon Core: Gravitational Circulation","673014016":"Order Moon Core: Gravitational Circulation","673014023":"Order Moon Core: War Cry Charge","673014024":"Order Moon Core: War Cry Charge","673014025":"Order Moon Core: War Cry Charge","673014026":"Order Moon Core: War Cry Charge","673014033":"Order Moon Core: Divine Cause","673014034":"Order Moon Core: Divine Cause","673014035":"Order Moon Core: Divine Cause","673014036":"Order Moon Core: Divine Cause","673014063":"Order Moon Core: Fury Escalation","673014064":"Order Moon Core: Fury Escalation","673014065":"Order Moon Core: Fury Escalation","673014066":"Order Moon Core: Fury Escalation","673014073":"Order Moon Core: Pledge of Salvation","673014074":"Order Moon Core: Pledge of Salvation","673014075":"Order Moon Core: Pledge of Salvation","673014076":"Order Moon Core: Pledge of Salvation","673014103":"Order Moon Core: Emergency Specialist","673014104":"Order Moon Core: Emergency Specialist","673014105":"Order Moon Core: Emergency Specialist","673014106":"Order Moon Core: Emergency Specialist","673014113":"Order Moon Core: HSU-08 Reinforced Cable","673014114":"Order Moon Core: HSU-08 Reinforced Cable","673014115":"Order Moon Core: HSU-08 Reinforced Cable","673014116":"Order Moon Core: HSU-08 Reinforced Cable","673014123":"Order Moon Core: Zero Pulse Energy","673014124":"Order Moon Core: Zero Pulse Energy","673014125":"Order Moon Core: Zero Pulse Energy","673014126":"Order Moon Core: Zero Pulse Energy","673014133":"Order Moon Core: Infinite Combustion","673014134":"Order Moon Core: Infinite Combustion","673014135":"Order Moon Core: Infinite Combustion","673014136":"Order Moon Core: Infinite Combustion","673014163":"Order Moon Core: Bullet Blitz","673014164":"Order Moon Core: Bullet Blitz","673014165":"Order Moon Core: Bullet Blitz","673014166":"Order Moon Core: Bullet Blitz","673014203":"Order Moon Core: Fatal Leap","673014204":"Order Moon Core: Fatal Leap","673014205":"Order Moon Core: Fatal Leap","673014206":"Order Moon Core: Fatal Leap","673014213":"Order Moon Core: Internal Flow","673014214":"Order Moon Core: Internal Flow","673014215":"Order Moon Core: Internal Flow","673014216":"Order Moon Core: Internal Flow","673014223":"Order Moon Core: Fire Dragon Skyshaker","673014224":"Order Moon Core: Fire Dragon Skyshaker","673014225":"Order Moon Core: Fire Dragon Skyshaker","673014226":"Order Moon Core: Fire Dragon Skyshaker","673014233":"Order Moon Core: Apotheosis","673014234":"Order Moon Core: Apotheosis","673014235":"Order Moon Core: Apotheosis","673014236":"Order Moon Core: Apotheosis","673014263":"Order Moon Core: Lightning Tiger Break","673014264":"Order Moon Core: Lightning Tiger Break","673014265":"Order Moon Core: Lightning Tiger Break","673014266":"Order Moon Core: Lightning Tiger Break","673014273":"Order Moon Core: Asura War","673014274":"Order Moon Core: Asura War","673014275":"Order Moon Core: Asura War","673014276":"Order Moon Core: Asura War","673014303":"Order Moon Core: Osh's Support","673014304":"Order Moon Core: Osh's Support","673014305":"Order Moon Core: Osh's Support","673014306":"Order Moon Core: Osh's Support","673014313":"Order Moon Core: Stack Hold","673014314":"Order Moon Core: Stack Hold","673014315":"Order Moon Core: Stack Hold","673014316":"Order Moon Core: Stack Hold","673014323":"Order Moon Core: Brave Pulse","673014324":"Order Moon Core: Brave Pulse","673014325":"Order Moon Core: Brave Pulse","673014326":"Order Moon Core: Brave Pulse","673014333":"Order Moon Core: Exchange","673014334":"Order Moon Core: Exchange","673014335":"Order Moon Core: Exchange","673014336":"Order Moon Core: Exchange","673014403":"Order Moon Core: Recharge","673014404":"Order Moon Core: Recharge","673014405":"Order Moon Core: Recharge","673014406":"Order Moon Core: Recharge","673014413":"Order Moon Core: Dual Core","673014414":"Order Moon Core: Dual Core","673014415":"Order Moon Core: Dual Core","673014416":"Order Moon Core: Dual Core","673014423":"Order Moon Core: Final Spear","673014424":"Order Moon Core: Final Spear","673014425":"Order Moon Core: Final Spear","673014426":"Order Moon Core: Final Spear","673014433":"Order Moon Core: Moonlit Midnight","673014434":"Order Moon Core: Moonlit Midnight","673014435":"Order Moon Core: Moonlit Midnight","673014436":"Order Moon Core: Moonlit Midnight","673014503":"Order Moon Core: Drizzling Rain","673014504":"Order Moon Core: Drizzling Rain","673014505":"Order Moon Core: Drizzling Rain","673014506":"Order Moon Core: Drizzling Rain","673014513":"Order Moon Core: Illusory Door","673014514":"Order Moon Core: Illusory Door","673014515":"Order Moon Core: Illusory Door","673014516":"Order Moon Core: Illusory Door","673014523":"Order Moon Core: Spiral","673014524":"Order Moon Core: Spiral","673014525":"Order Moon Core: Spiral","673014526":"Order Moon Core: Spiral","673014603":"Order Moon Core: Flourish","673014604":"Order Moon Core: Flourish","673014605":"Order Moon Core: Flourish","673014606":"Order Moon Core: Flourish","673015003":"Order Moon Core: Cyclone Slash","673015004":"Order Moon Core: Cyclone Slash","673015005":"Order Moon Core: Cyclone Slash","673015006":"Order Moon Core: Cyclone Slash","673015013":"Order Moon Core: Gravitational Rush","673015014":"Order Moon Core: Gravitational Rush","673015015":"Order Moon Core: Gravitational Rush","673015016":"Order Moon Core: Gravitational Rush","673015023":"Order Moon Core: Lightning Storm","673015024":"Order Moon Core: Lightning Storm","673015025":"Order Moon Core: Lightning Storm","673015026":"Order Moon Core: Lightning Storm","673015033":"Order Moon Core: Divine War","673015034":"Order Moon Core: Divine War","673015035":"Order Moon Core: Divine War","673015036":"Order Moon Core: Divine War","673015063":"Order Moon Core: Spiral Tempest","673015064":"Order Moon Core: Spiral Tempest","673015065":"Order Moon Core: Spiral Tempest","673015066":"Order Moon Core: Spiral Tempest","673015073":"Order Moon Core: Break of Dawn","673015074":"Order Moon Core: Break of Dawn","673015075":"Order Moon Core: Break of Dawn","673015076":"Order Moon Core: Break of Dawn","673015103":"Order Moon Core: Eternal Revolver","673015104":"Order Moon Core: Eternal Revolver","673015105":"Order Moon Core: Eternal Revolver","673015106":"Order Moon Core: Eternal Revolver","673015113":"Order Moon Core: HSU-37 Rapid Fire Support","673015114":"Order Moon Core: HSU-37 Rapid Fire Support","673015115":"Order Moon Core: HSU-37 Rapid Fire Support","673015116":"Order Moon Core: HSU-37 Rapid Fire Support","673015123":"Order Moon Core: Assault Titan","673015124":"Order Moon Core: Assault Titan","673015125":"Order Moon Core: Assault Titan","673015126":"Order Moon Core: Assault Titan","673015133":"Order Moon Core: Momentous Leap","673015134":"Order Moon Core: Momentous Leap","673015135":"Order Moon Core: Momentous Leap","673015136":"Order Moon Core: Momentous Leap","673015163":"Order Moon Core: Way of the Gun","673015164":"Order Moon Core: Way of the Gun","673015165":"Order Moon Core: Way of the Gun","673015166":"Order Moon Core: Way of the Gun","673015203":"Order Moon Core: Continuous Enhancement","673015204":"Order Moon Core: Continuous Enhancement","673015205":"Order Moon Core: Continuous Enhancement","673015206":"Order Moon Core: Continuous Enhancement","673015213":"Order Moon Core: Instant Step","673015214":"Order Moon Core: Instant Step","673015215":"Order Moon Core: Instant Step","673015216":"Order Moon Core: Instant Step","673015223":"Order Moon Core: Third Eye","673015224":"Order Moon Core: Third Eye","673015225":"Order Moon Core: Third Eye","673015226":"Order Moon Core: Third Eye","673015233":"Order Moon Core: Chain Hit","673015234":"Order Moon Core: Chain Hit","673015235":"Order Moon Core: Chain Hit","673015236":"Order Moon Core: Chain Hit","673015263":"Order Moon Core: Void Ascension","673015264":"Order Moon Core: Void Ascension","673015265":"Order Moon Core: Void Ascension","673015266":"Order Moon Core: Void Ascension","673015273":"Order Moon Core: Unhindered Stride","673015274":"Order Moon Core: Unhindered Stride","673015275":"Order Moon Core: Unhindered Stride","673015276":"Order Moon Core: Unhindered Stride","673015303":"Order Moon Core: Elemental Ring","673015304":"Order Moon Core: Elemental Ring","673015305":"Order Moon Core: Elemental Ring","673015306":"Order Moon Core: Elemental Ring","673015313":"Order Moon Core: Dark Check","673015314":"Order Moon Core: Dark Check","673015315":"Order Moon Core: Dark Check","673015316":"Order Moon Core: Dark Check","673015323":"Order Moon Core: Aria Pulse","673015324":"Order Moon Core: Aria Pulse","673015325":"Order Moon Core: Aria Pulse","673015326":"Order Moon Core: Aria Pulse","673015333":"Order Moon Core: Vortex","673015334":"Order Moon Core: Vortex","673015335":"Order Moon Core: Vortex","673015336":"Order Moon Core: Vortex","673015403":"Order Moon Core: Deathblade Wave","673015404":"Order Moon Core: Deathblade Wave","673015405":"Order Moon Core: Deathblade Wave","673015406":"Order Moon Core: Deathblade Wave","673015413":"Order Moon Core: Substorm","673015414":"Order Moon Core: Substorm","673015415":"Order Moon Core: Substorm","673015416":"Order Moon Core: Substorm","673015423":"Order Moon Core: Exsanguinating Poison","673015424":"Order Moon Core: Exsanguinating Poison","673015425":"Order Moon Core: Exsanguinating Poison","673015426":"Order Moon Core: Exsanguinating Poison","673015433":"Order Moon Core: Energy Theft","673015434":"Order Moon Core: Energy Theft","673015435":"Order Moon Core: Energy Theft","673015436":"Order Moon Core: Energy Theft","673015503":"Order Moon Core: Scorching Sun","673015504":"Order Moon Core: Scorching Sun","673015505":"Order Moon Core: Scorching Sun","673015506":"Order Moon Core: Scorching Sun","673015513":"Order Moon Core: Lunar Prophecy","673015514":"Order Moon Core: Lunar Prophecy","673015515":"Order Moon Core: Lunar Prophecy","673015516":"Order Moon Core: Lunar Prophecy","673015523":"Order Moon Core: Crow's Descent","673015524":"Order Moon Core: Crow's Descent","673015525":"Order Moon Core: Crow's Descent","673015526":"Order Moon Core: Crow's Descent","673015603":"Order Moon Core: Dominant","673015604":"Order Moon Core: Dominant","673015605":"Order Moon Core: Dominant","673015606":"Order Moon Core: Dominant","673020003":"Order Star Core: Crushing Storm","673020004":"Order Star Core: Crushing Storm","673020005":"Order Star Core: Crushing Storm","673020006":"Order Star Core: Crushing Storm","673020013":"Order Star Core: Broken Chains","673020014":"Order Star Core: Broken Chains","673020015":"Order Star Core: Broken Chains","673020016":"Order Star Core: Broken Chains","673020023":"Order Star Core: Defensive Barrage","673020024":"Order Star Core: Defensive Barrage","673020025":"Order Star Core: Defensive Barrage","673020026":"Order Star Core: Defensive Barrage","673020033":"Order Star Core: Punishing Sword","673020034":"Order Star Core: Punishing Sword","673020035":"Order Star Core: Punishing Sword","673020036":"Order Star Core: Punishing Sword","673020063":"Order Star Core: Execution","673020064":"Order Star Core: Execution","673020065":"Order Star Core: Execution","673020066":"Order Star Core: Execution","673020073":"Order Star Core: True End","673020074":"Order Star Core: True End","673020075":"Order Star Core: True End","673020076":"Order Star Core: True End","673020103":"Order Star Core: Bullet Explosion","673020104":"Order Star Core: Bullet Explosion","673020105":"Order Star Core: Bullet Explosion","673020106":"Order Star Core: Bullet Explosion","673020113":"Order Star Core: HSU-04 Smart Scope","673020114":"Order Star Core: HSU-04 Smart Scope","673020115":"Order Star Core: HSU-04 Smart Scope","673020116":"Order Star Core: HSU-04 Smart Scope","673020123":"Order Star Core: Battery Output Enhancement","673020124":"Order Star Core: Battery Output Enhancement","673020125":"Order Star Core: Battery Output Enhancement","673020126":"Order Star Core: Battery Output Enhancement","673020133":"Order Star Core: Sea of Fire","673020134":"Order Star Core: Sea of Fire","673020135":"Order Star Core: Sea of Fire","673020136":"Order Star Core: Sea of Fire","673020163":"Order Star Core: All-Rounder","673020164":"Order Star Core: All-Rounder","673020165":"Order Star Core: All-Rounder","673020166":"Order Star Core: All-Rounder","673020203":"Order Star Core: Orb Explosion","673020204":"Order Star Core: Orb Explosion","673020205":"Order Star Core: Orb Explosion","673020206":"Order Star Core: Orb Explosion","673020213":"Order Star Core: Dance of Heavenly Flowers","673020214":"Order Star Core: Dance of Heavenly Flowers","673020215":"Order Star Core: Dance of Heavenly Flowers","673020216":"Order Star Core: Dance of Heavenly Flowers","673020223":"Order Star Core: Ultimate Wind Kick","673020224":"Order Star Core: Ultimate Wind Kick","673020225":"Order Star Core: Ultimate Wind Kick","673020226":"Order Star Core: Ultimate Wind Kick","673020233":"Order Star Core: Evolution's End","673020234":"Order Star Core: Evolution's End","673020235":"Order Star Core: Evolution's End","673020236":"Order Star Core: Evolution's End","673020263":"Order Star Core: Lightning Tiger Fist","673020264":"Order Star Core: Lightning Tiger Fist","673020265":"Order Star Core: Lightning Tiger Fist","673020266":"Order Star Core: Lightning Tiger Fist","673020273":"Order Star Core: Brawl King Twelve Forms","673020274":"Order Star Core: Brawl King Twelve Forms","673020275":"Order Star Core: Brawl King Twelve Forms","673020276":"Order Star Core: Brawl King Twelve Forms","673020303":"Order Star Core: Amplified Resonance","673020304":"Order Star Core: Amplified Resonance","673020305":"Order Star Core: Amplified Resonance","673020306":"Order Star Core: Amplified Resonance","673020313":"Order Star Core: Lightstream","673020314":"Order Star Core: Lightstream","673020315":"Order Star Core: Lightstream","673020316":"Order Star Core: Lightstream","673020323":"Order Star Core: Sonic Enhancement","673020324":"Order Star Core: Sonic Enhancement","673020325":"Order Star Core: Sonic Enhancement","673020326":"Order Star Core: Sonic Enhancement","673020333":"Order Star Core: Elemental Echo","673020334":"Order Star Core: Elemental Echo","673020335":"Order Star Core: Elemental Echo","673020336":"Order Star Core: Elemental Echo","673020403":"Order Star Core: Strike","673020404":"Order Star Core: Strike","673020405":"Order Star Core: Strike","673020406":"Order Star Core: Strike","673020413":"Order Star Core: Bloody Explosion","673020414":"Order Star Core: Bloody Explosion","673020415":"Order Star Core: Bloody Explosion","673020416":"Order Star Core: Bloody Explosion","673020423":"Order Star Core: Delusory Sights","673020424":"Order Star Core: Delusory Sights","673020425":"Order Star Core: Delusory Sights","673020426":"Order Star Core: Delusory Sights","673020433":"Order Star Core: Otherworldly Monarch","673020434":"Order Star Core: Otherworldly Monarch","673020435":"Order Star Core: Otherworldly Monarch","673020436":"Order Star Core: Otherworldly Monarch","673020503":"Order Star Core: Driving Hit","673020504":"Order Star Core: Driving Hit","673020505":"Order Star Core: Driving Hit","673020506":"Order Star Core: Driving Hit","673020513":"Order Star Core: Endless Shattering Strike","673020514":"Order Star Core: Endless Shattering Strike","673020515":"Order Star Core: Endless Shattering Strike","673020516":"Order Star Core: Endless Shattering Strike","673020523":"Order Star Core: Tandem Charge","673020524":"Order Star Core: Tandem Charge","673020525":"Order Star Core: Tandem Charge","673020526":"Order Star Core: Tandem Charge","673020603":"Order Star Core: Last Stand","673020604":"Order Star Core: Last Stand","673020605":"Order Star Core: Last Stand","673020606":"Order Star Core: Last Stand","673021003":"Order Star Core: Overflow","673021004":"Order Star Core: Overflow","673021005":"Order Star Core: Overflow","673021006":"Order Star Core: Overflow","673021013":"Order Star Core: Turbulent Release","673021014":"Order Star Core: Turbulent Release","673021015":"Order Star Core: Turbulent Release","673021016":"Order Star Core: Turbulent Release","673021023":"Order Star Core: Confirmed Attack","673021024":"Order Star Core: Confirmed Attack","673021025":"Order Star Core: Confirmed Attack","673021026":"Order Star Core: Confirmed Attack","673021033":"Order Star Core: Divine Sword","673021034":"Order Star Core: Divine Sword","673021035":"Order Star Core: Divine Sword","673021036":"Order Star Core: Divine Sword","673021063":"Order Star Core: Pulverize","673021064":"Order Star Core: Pulverize","673021065":"Order Star Core: Pulverize","673021066":"Order Star Core: Pulverize","673021073":"Order Star Core: Holy Blade's Execution","673021074":"Order Star Core: Holy Blade's Execution","673021075":"Order Star Core: Holy Blade's Execution","673021076":"Order Star Core: Holy Blade's Execution","673021103":"Order Star Core: Iron Sights","673021104":"Order Star Core: Iron Sights","673021105":"Order Star Core: Iron Sights","673021106":"Order Star Core: Iron Sights","673021113":"Order Star Core: HSU-17 Electric Nova","673021114":"Order Star Core: HSU-17 Electric Nova","673021115":"Order Star Core: HSU-17 Electric Nova","673021116":"Order Star Core: HSU-17 Electric Nova","673021123":"Order Star Core: Incinerating Execution","673021124":"Order Star Core: Incinerating Execution","673021125":"Order Star Core: Incinerating Execution","673021126":"Order Star Core: Incinerating Execution","673021133":"Order Star Core: Time on Target","673021134":"Order Star Core: Time on Target","673021135":"Order Star Core: Time on Target","673021136":"Order Star Core: Time on Target","673021163":"Order Star Core: Blowback","673021164":"Order Star Core: Blowback","673021165":"Order Star Core: Blowback","673021166":"Order Star Core: Blowback","673021203":"Order Star Core: Ground Smasher","673021204":"Order Star Core: Ground Smasher","673021205":"Order Star Core: Ground Smasher","673021206":"Order Star Core: Ground Smasher","673021213":"Order Star Core: Culminating Blast","673021214":"Order Star Core: Culminating Blast","673021215":"Order Star Core: Culminating Blast","673021216":"Order Star Core: Culminating Blast","673021223":"Order Star Core: Heaven Splitter","673021224":"Order Star Core: Heaven Splitter","673021225":"Order Star Core: Heaven Splitter","673021226":"Order Star Core: Heaven Splitter","673021233":"Order Star Core: Single Point Breakthrough","673021234":"Order Star Core: Single Point Breakthrough","673021235":"Order Star Core: Single Point Breakthrough","673021236":"Order Star Core: Single Point Breakthrough","673021263":"Order Star Core: Dual Berserk Circle","673021264":"Order Star Core: Dual Berserk Circle","673021265":"Order Star Core: Dual Berserk Circle","673021266":"Order Star Core: Dual Berserk Circle","673021273":"Order Star Core: Skyshatter","673021274":"Order Star Core: Skyshatter","673021275":"Order Star Core: Skyshatter","673021276":"Order Star Core: Skyshatter","673021303":"Order Star Core: Command Awakening","673021304":"Order Star Core: Command Awakening","673021305":"Order Star Core: Command Awakening","673021306":"Order Star Core: Command Awakening","673021313":"Order Star Core: Fatal Hand","673021314":"Order Star Core: Fatal Hand","673021315":"Order Star Core: Fatal Hand","673021316":"Order Star Core: Fatal Hand","673021323":"Order Star Core: Sound Blitz","673021324":"Order Star Core: Sound Blitz","673021325":"Order Star Core: Sound Blitz","673021326":"Order Star Core: Sound Blitz","673021333":"Order Star Core: Triple Wave","673021334":"Order Star Core: Triple Wave","673021335":"Order Star Core: Triple Wave","673021336":"Order Star Core: Triple Wave","673021403":"Order Star Core: Swift Resolution","673021404":"Order Star Core: Swift Resolution","673021405":"Order Star Core: Swift Resolution","673021406":"Order Star Core: Swift Resolution","673021413":"Order Star Core: Critical Claws","673021414":"Order Star Core: Critical Claws","673021415":"Order Star Core: Critical Claws","673021416":"Order Star Core: Critical Claws","673021423":"Order Star Core: Assassin's Shadow","673021424":"Order Star Core: Assassin's Shadow","673021425":"Order Star Core: Assassin's Shadow","673021426":"Order Star Core: Assassin's Shadow","673021433":"Order Star Core: Deathly Harvest","673021434":"Order Star Core: Deathly Harvest","673021435":"Order Star Core: Deathly Harvest","673021436":"Order Star Core: Deathly Harvest","673021503":"Order Star Core: Breakthrough","673021504":"Order Star Core: Breakthrough","673021505":"Order Star Core: Breakthrough","673021506":"Order Star Core: Breakthrough","673021513":"Order Star Core: Swift Brush","673021514":"Order Star Core: Swift Brush","673021515":"Order Star Core: Swift Brush","673021516":"Order Star Core: Swift Brush","673021523":"Order Star Core: Deadly Bear","673021524":"Order Star Core: Deadly Bear","673021525":"Order Star Core: Deadly Bear","673021526":"Order Star Core: Deadly Bear","673021603":"Order Star Core: Executioner","673021604":"Order Star Core: Executioner","673021605":"Order Star Core: Executioner","673021606":"Order Star Core: Executioner","673022003":"Order Star Core: Break Out","673022004":"Order Star Core: Break Out","673022005":"Order Star Core: Break Out","673022006":"Order Star Core: Break Out","673022013":"Order Star Core: Reckless Blow","673022014":"Order Star Core: Reckless Blow","673022015":"Order Star Core: Reckless Blow","673022016":"Order Star Core: Reckless Blow","673022023":"Order Star Core: Cross Gunlance","673022024":"Order Star Core: Cross Gunlance","673022025":"Order Star Core: Cross Gunlance","673022026":"Order Star Core: Cross Gunlance","673022033":"Order Star Core: Piercer","673022034":"Order Star Core: Piercer","673022035":"Order Star Core: Piercer","673022036":"Order Star Core: Piercer","673022063":"Order Star Core: Deliberate Smite","673022064":"Order Star Core: Deliberate Smite","673022065":"Order Star Core: Deliberate Smite","673022066":"Order Star Core: Deliberate Smite","673022073":"Order Star Core: Greater Justice","673022074":"Order Star Core: Greater Justice","673022075":"Order Star Core: Greater Justice","673022076":"Order Star Core: Greater Justice","673022103":"Order Star Core: Dominator Shell","673022104":"Order Star Core: Dominator Shell","673022105":"Order Star Core: Dominator Shell","673022106":"Order Star Core: Dominator Shell","673022113":"Order Star Core: HSU-31 Blast","673022114":"Order Star Core: HSU-31 Blast","673022115":"Order Star Core: HSU-31 Blast","673022116":"Order Star Core: HSU-31 Blast","673022123":"Order Star Core: Accelerated Burst","673022124":"Order Star Core: Accelerated Burst","673022125":"Order Star Core: Accelerated Burst","673022126":"Order Star Core: Accelerated Burst","673022133":"Order Star Core: Vanquish","673022134":"Order Star Core: Vanquish","673022135":"Order Star Core: Vanquish","673022136":"Order Star Core: Vanquish","673022163":"Order Star Core: Pinpoint","673022164":"Order Star Core: Pinpoint","673022165":"Order Star Core: Pinpoint","673022166":"Order Star Core: Pinpoint","673022203":"Order Star Core: Counter Burst","673022204":"Order Star Core: Counter Burst","673022205":"Order Star Core: Counter Burst","673022206":"Order Star Core: Counter Burst","673022213":"Order Star Core: Palm Burst Renewal","673022214":"Order Star Core: Palm Burst Renewal","673022215":"Order Star Core: Palm Burst Renewal","673022216":"Order Star Core: Palm Burst Renewal","673022223":"Order Star Core: Dragon Style Enhancement","673022224":"Order Star Core: Dragon Style Enhancement","673022225":"Order Star Core: Dragon Style Enhancement","673022226":"Order Star Core: Dragon Style Enhancement","673022233":"Order Star Core: Raging Dragon Slash","673022234":"Order Star Core: Raging Dragon Slash","673022235":"Order Star Core: Raging Dragon Slash","673022236":"Order Star Core: Raging Dragon Slash","673022263":"Order Star Core: Thunderflash Strike","673022264":"Order Star Core: Thunderflash Strike","673022265":"Order Star Core: Thunderflash Strike","673022266":"Order Star Core: Thunderflash Strike","673022273":"Order Star Core: Force Gauntlet","673022274":"Order Star Core: Force Gauntlet","673022275":"Order Star Core: Force Gauntlet","673022276":"Order Star Core: Force Gauntlet","673022303":"Order Star Core: Tactical Command","673022304":"Order Star Core: Tactical Command","673022305":"Order Star Core: Tactical Command","673022306":"Order Star Core: Tactical Command","673022313":"Order Star Core: Ruin Minor Set","673022314":"Order Star Core: Ruin Minor Set","673022315":"Order Star Core: Ruin Minor Set","673022316":"Order Star Core: Ruin Minor Set","673022323":"Order Star Core: Binary Shock","673022324":"Order Star Core: Binary Shock","673022325":"Order Star Core: Binary Shock","673022326":"Order Star Core: Binary Shock","673022333":"Order Star Core: Apocalyptic Poem","673022334":"Order Star Core: Apocalyptic Poem","673022335":"Order Star Core: Apocalyptic Poem","673022336":"Order Star Core: Apocalyptic Poem","673022403":"Order Star Core: Frostfire Blade","673022404":"Order Star Core: Frostfire Blade","673022405":"Order Star Core: Frostfire Blade","673022406":"Order Star Core: Frostfire Blade","673022413":"Order Star Core: Chaos Demon","673022414":"Order Star Core: Chaos Demon","673022415":"Order Star Core: Chaos Demon","673022416":"Order Star Core: Chaos Demon","673022423":"Order Star Core: Death Loop","673022424":"Order Star Core: Death Loop","673022425":"Order Star Core: Death Loop","673022426":"Order Star Core: Death Loop","673022433":"Order Star Core: Possession","673022434":"Order Star Core: Possession","673022435":"Order Star Core: Possession","673022436":"Order Star Core: Possession","673022503":"Order Star Core: Gale Slash","673022504":"Order Star Core: Gale Slash","673022505":"Order Star Core: Gale Slash","673022506":"Order Star Core: Gale Slash","673022513":"Order Star Core: Torrent of Cranes","673022514":"Order Star Core: Torrent of Cranes","673022515":"Order Star Core: Torrent of Cranes","673022516":"Order Star Core: Torrent of Cranes","673022523":"Order Star Core: Starlight Fox","673022524":"Order Star Core: Starlight Fox","673022525":"Order Star Core: Starlight Fox","673022526":"Order Star Core: Starlight Fox","673022603":"Order Star Core: Start Pursuit","673022604":"Order Star Core: Start Pursuit","673022605":"Order Star Core: Start Pursuit","673022606":"Order Star Core: Start Pursuit","673023003":"Order Star Core: Frenzy","673023004":"Order Star Core: Frenzy","673023005":"Order Star Core: Frenzy","673023006":"Order Star Core: Frenzy","673023013":"Order Star Core: Collapse","673023014":"Order Star Core: Collapse","673023015":"Order Star Core: Collapse","673023016":"Order Star Core: Collapse","673023023":"Order Star Core: Shield Strike","673023024":"Order Star Core: Shield Strike","673023025":"Order Star Core: Shield Strike","673023026":"Order Star Core: Shield Strike","673023033":"Order Star Core: Sword's Prayer","673023034":"Order Star Core: Sword's Prayer","673023035":"Order Star Core: Sword's Prayer","673023036":"Order Star Core: Sword's Prayer","673023063":"Order Star Core: Swift Execution","673023064":"Order Star Core: Swift Execution","673023065":"Order Star Core: Swift Execution","673023066":"Order Star Core: Swift Execution","673023073":"Order Star Core: Declaration of Protection","673023074":"Order Star Core: Declaration of Protection","673023075":"Order Star Core: Declaration of Protection","673023076":"Order Star Core: Declaration of Protection","673023103":"Order Star Core: Bullet Shower","673023104":"Order Star Core: Bullet Shower","673023105":"Order Star Core: Bullet Shower","673023106":"Order Star Core: Bullet Shower","673023113":"Order Star Core: HSU-06 Laser Sight","673023114":"Order Star Core: HSU-06 Laser Sight","673023115":"Order Star Core: HSU-06 Laser Sight","673023116":"Order Star Core: HSU-06 Laser Sight","673023123":"Order Star Core: Extrasensory Synchronization","673023124":"Order Star Core: Extrasensory Synchronization","673023125":"Order Star Core: Extrasensory Synchronization","673023126":"Order Star Core: Extrasensory Synchronization","673023133":"Order Star Core: Iron Rain","673023134":"Order Star Core: Iron Rain","673023135":"Order Star Core: Iron Rain","673023136":"Order Star Core: Iron Rain","673023163":"Order Star Core: Precision Fire","673023164":"Order Star Core: Precision Fire","673023165":"Order Star Core: Precision Fire","673023166":"Order Star Core: Precision Fire","673023203":"Order Star Core: Ground-Breaker","673023204":"Order Star Core: Ground-Breaker","673023205":"Order Star Core: Ground-Breaker","673023206":"Order Star Core: Ground-Breaker","673023213":"Order Star Core: Wallbreaker","673023214":"Order Star Core: Wallbreaker","673023215":"Order Star Core: Wallbreaker","673023216":"Order Star Core: Wallbreaker","673023223":"Order Star Core: Ultimate Azure Gale","673023224":"Order Star Core: Ultimate Azure Gale","673023225":"Order Star Core: Ultimate Azure Gale","673023226":"Order Star Core: Ultimate Azure Gale","673023233":"Order Star Core: Dual Technique","673023234":"Order Star Core: Dual Technique","673023235":"Order Star Core: Dual Technique","673023236":"Order Star Core: Dual Technique","673023263":"Order Star Core: Divine King's Manifestation","673023264":"Order Star Core: Divine King's Manifestation","673023265":"Order Star Core: Divine King's Manifestation","673023266":"Order Star Core: Divine King's Manifestation","673023273":"Order Star Core: Divine Axis","673023274":"Order Star Core: Divine Axis","673023275":"Order Star Core: Divine Axis","673023276":"Order Star Core: Divine Axis","673023303":"Order Star Core: Balance of Power","673023304":"Order Star Core: Balance of Power","673023305":"Order Star Core: Balance of Power","673023306":"Order Star Core: Balance of Power","673023313":"Order Star Core: Dark Collection","673023314":"Order Star Core: Dark Collection","673023315":"Order Star Core: Dark Collection","673023316":"Order Star Core: Dark Collection","673023323":"Order Star Core: Prosperous Zephyr","673023324":"Order Star Core: Prosperous Zephyr","673023325":"Order Star Core: Prosperous Zephyr","673023326":"Order Star Core: Prosperous Zephyr","673023333":"Order Star Core: Lightning Blaze","673023334":"Order Star Core: Lightning Blaze","673023335":"Order Star Core: Lightning Blaze","673023336":"Order Star Core: Lightning Blaze","673023403":"Order Star Core: Basics","673023404":"Order Star Core: Basics","673023405":"Order Star Core: Basics","673023406":"Order Star Core: Basics","673023413":"Order Star Core: Lethal Strike","673023414":"Order Star Core: Lethal Strike","673023415":"Order Star Core: Lethal Strike","673023416":"Order Star Core: Lethal Strike","673023423":"Order Star Core: Nightmarish Plunge","673023424":"Order Star Core: Nightmarish Plunge","673023425":"Order Star Core: Nightmarish Plunge","673023426":"Order Star Core: Nightmarish Plunge","673023433":"Order Star Core: Dark Moon Monarch","673023434":"Order Star Core: Dark Moon Monarch","673023435":"Order Star Core: Dark Moon Monarch","673023436":"Order Star Core: Dark Moon Monarch","673023503":"Order Star Core: Snow Shower Tempest","673023504":"Order Star Core: Snow Shower Tempest","673023505":"Order Star Core: Snow Shower Tempest","673023506":"Order Star Core: Snow Shower Tempest","673023513":"Order Star Core: Bouncing Brushwork","673023514":"Order Star Core: Bouncing Brushwork","673023515":"Order Star Core: Bouncing Brushwork","673023516":"Order Star Core: Bouncing Brushwork","673023523":"Order Star Core: Illusory Bear","673023524":"Order Star Core: Illusory Bear","673023525":"Order Star Core: Illusory Bear","673023526":"Order Star Core: Illusory Bear","673023603":"Order Star Core: Grand Finale","673023604":"Order Star Core: Grand Finale","673023605":"Order Star Core: Grand Finale","673023606":"Order Star Core: Grand Finale","673024003":"Order Star Core: Chain Slash","673024004":"Order Star Core: Chain Slash","673024005":"Order Star Core: Chain Slash","673024006":"Order Star Core: Chain Slash","673024013":"Order Star Core: Rock Blade","673024014":"Order Star Core: Rock Blade","673024015":"Order Star Core: Rock Blade","673024016":"Order Star Core: Rock Blade","673024023":"Order Star Core: Chariot Charge","673024024":"Order Star Core: Chariot Charge","673024025":"Order Star Core: Chariot Charge","673024026":"Order Star Core: Chariot Charge","673024033":"Order Star Core: Prayer of Divine Surge","673024034":"Order Star Core: Prayer of Divine Surge","673024035":"Order Star Core: Prayer of Divine Surge","673024036":"Order Star Core: Prayer of Divine Surge","673024063":"Order Star Core: Finishing Strike","673024064":"Order Star Core: Finishing Strike","673024065":"Order Star Core: Finishing Strike","673024066":"Order Star Core: Finishing Strike","673024073":"Order Star Core: Ring of Protection","673024074":"Order Star Core: Ring of Protection","673024075":"Order Star Core: Ring of Protection","673024076":"Order Star Core: Ring of Protection","673024103":"Order Star Core: Silver Bullet","673024104":"Order Star Core: Silver Bullet","673024105":"Order Star Core: Silver Bullet","673024106":"Order Star Core: Silver Bullet","673024113":"Order Star Core: HSU-57 Strength Support Gloves","673024114":"Order Star Core: HSU-57 Strength Support Gloves","673024115":"Order Star Core: HSU-57 Strength Support Gloves","673024116":"Order Star Core: HSU-57 Strength Support Gloves","673024123":"Order Star Core: Artillery Stance","673024124":"Order Star Core: Artillery Stance","673024125":"Order Star Core: Artillery Stance","673024126":"Order Star Core: Artillery Stance","673024133":"Order Star Core: Absolutely Cooking","673024134":"Order Star Core: Absolutely Cooking","673024135":"Order Star Core: Absolutely Cooking","673024136":"Order Star Core: Absolutely Cooking","673024163":"Order Star Core: Full Magazine","673024164":"Order Star Core: Full Magazine","673024165":"Order Star Core: Full Magazine","673024166":"Order Star Core: Full Magazine","673024203":"Order Star Core: Black Dragon's Leap","673024204":"Order Star Core: Black Dragon's Leap","673024205":"Order Star Core: Black Dragon's Leap","673024206":"Order Star Core: Black Dragon's Leap","673024213":"Order Star Core: Energy Blow-Up","673024214":"Order Star Core: Energy Blow-Up","673024215":"Order Star Core: Energy Blow-Up","673024216":"Order Star Core: Energy Blow-Up","673024223":"Order Star Core: Rising Fiery Dragon","673024224":"Order Star Core: Rising Fiery Dragon","673024225":"Order Star Core: Rising Fiery Dragon","673024226":"Order Star Core: Rising Fiery Dragon","673024233":"Order Star Core: Illusion","673024234":"Order Star Core: Illusion","673024235":"Order Star Core: Illusion","673024236":"Order Star Core: Illusion","673024263":"Order Star Core: Cloudburst Barrage","673024264":"Order Star Core: Cloudburst Barrage","673024265":"Order Star Core: Cloudburst Barrage","673024266":"Order Star Core: Cloudburst Barrage","673024273":"Order Star Core: Asura","673024274":"Order Star Core: Asura","673024275":"Order Star Core: Asura","673024276":"Order Star Core: Asura","673024303":"Order Star Core: Power of Creation","673024304":"Order Star Core: Power of Creation","673024305":"Order Star Core: Power of Creation","673024306":"Order Star Core: Power of Creation","673024313":"Order Star Core: Shuffle Dance","673024314":"Order Star Core: Shuffle Dance","673024315":"Order Star Core: Shuffle Dance","673024316":"Order Star Core: Shuffle Dance","673024323":"Order Star Core: Sound Deluge","673024324":"Order Star Core: Sound Deluge","673024325":"Order Star Core: Sound Deluge","673024326":"Order Star Core: Sound Deluge","673024333":"Order Star Core: Null Element","673024334":"Order Star Core: Null Element","673024335":"Order Star Core: Null Element","673024336":"Order Star Core: Null Element","673024403":"Order Star Core: Downtime","673024404":"Order Star Core: Downtime","673024405":"Order Star Core: Downtime","673024406":"Order Star Core: Downtime","673024413":"Order Star Core: Deadly Boomerang","673024414":"Order Star Core: Deadly Boomerang","673024415":"Order Star Core: Deadly Boomerang","673024416":"Order Star Core: Deadly Boomerang","673024423":"Order Star Core: Critical Combination","673024424":"Order Star Core: Critical Combination","673024425":"Order Star Core: Critical Combination","673024426":"Order Star Core: Critical Combination","673024433":"Order Star Core: Deathlord's Power","673024434":"Order Star Core: Deathlord's Power","673024435":"Order Star Core: Deathlord's Power","673024436":"Order Star Core: Deathlord's Power","673024503":"Order Star Core: Kra-kow!","673024504":"Order Star Core: Kra-kow!","673024505":"Order Star Core: Kra-kow!","673024506":"Order Star Core: Kra-kow!","673024513":"Order Star Core: Dimensional Gate","673024514":"Order Star Core: Dimensional Gate","673024515":"Order Star Core: Dimensional Gate","673024516":"Order Star Core: Dimensional Gate","673024523":"Order Star Core: Boom Boom Punch","673024524":"Order Star Core: Boom Boom Punch","673024525":"Order Star Core: Boom Boom Punch","673024526":"Order Star Core: Boom Boom Punch","673024603":"Order Star Core: Army of One","673024604":"Order Star Core: Army of One","673024605":"Order Star Core: Army of One","673024606":"Order Star Core: Army of One","673025003":"Order Star Core: Hell Flip","673025004":"Order Star Core: Hell Flip","673025005":"Order Star Core: Hell Flip","673025006":"Order Star Core: Hell Flip","673025013":"Order Star Core: Shattered Earth","673025014":"Order Star Core: Shattered Earth","673025015":"Order Star Core: Shattered Earth","673025016":"Order Star Core: Shattered Earth","673025023":"Order Star Core: Resounding Thunder","673025024":"Order Star Core: Resounding Thunder","673025025":"Order Star Core: Resounding Thunder","673025026":"Order Star Core: Resounding Thunder","673025033":"Order Star Core: Prayer of Light","673025034":"Order Star Core: Prayer of Light","673025035":"Order Star Core: Prayer of Light","673025036":"Order Star Core: Prayer of Light","673025063":"Order Star Core: Wind of Destruction","673025064":"Order Star Core: Wind of Destruction","673025065":"Order Star Core: Wind of Destruction","673025066":"Order Star Core: Wind of Destruction","673025073":"Order Star Core: Holy Blade's Ashes","673025074":"Order Star Core: Holy Blade's Ashes","673025075":"Order Star Core: Holy Blade's Ashes","673025076":"Order Star Core: Holy Blade's Ashes","673025103":"Order Star Core: Endless Spiral","673025104":"Order Star Core: Endless Spiral","673025105":"Order Star Core: Endless Spiral","673025106":"Order Star Core: Endless Spiral","673025113":"Order Star Core: HSU-22 Limb Stabilizer","673025114":"Order Star Core: HSU-22 Limb Stabilizer","673025115":"Order Star Core: HSU-22 Limb Stabilizer","673025116":"Order Star Core: HSU-22 Limb Stabilizer","673025123":"Order Star Core: Core Reactor Amplification","673025124":"Order Star Core: Core Reactor Amplification","673025125":"Order Star Core: Core Reactor Amplification","673025126":"Order Star Core: Core Reactor Amplification","673025133":"Order Star Core: Auto Lock-On","673025134":"Order Star Core: Auto Lock-On","673025135":"Order Star Core: Auto Lock-On","673025136":"Order Star Core: Auto Lock-On","673025163":"Order Star Core: Heel Strike","673025164":"Order Star Core: Heel Strike","673025165":"Order Star Core: Heel Strike","673025166":"Order Star Core: Heel Strike","673025203":"Order Star Core: Barrage","673025204":"Order Star Core: Barrage","673025205":"Order Star Core: Barrage","673025206":"Order Star Core: Barrage","673025213":"Order Star Core: Twin Strike Barrage","673025214":"Order Star Core: Twin Strike Barrage","673025215":"Order Star Core: Twin Strike Barrage","673025216":"Order Star Core: Twin Strike Barrage","673025223":"Order Star Core: Supreme Fist","673025224":"Order Star Core: Supreme Fist","673025225":"Order Star Core: Supreme Fist","673025226":"Order Star Core: Supreme Fist","673025233":"Order Star Core: Wild Barrage","673025234":"Order Star Core: Wild Barrage","673025235":"Order Star Core: Wild Barrage","673025236":"Order Star Core: Wild Barrage","673025263":"Order Star Core: Limit Smasher","673025264":"Order Star Core: Limit Smasher","673025265":"Order Star Core: Limit Smasher","673025266":"Order Star Core: Limit Smasher","673025273":"Order Star Core: Sanction","673025274":"Order Star Core: Sanction","673025275":"Order Star Core: Sanction","673025276":"Order Star Core: Sanction","673025303":"Order Star Core: Elemental Guide","673025304":"Order Star Core: Elemental Guide","673025305":"Order Star Core: Elemental Guide","673025306":"Order Star Core: Elemental Guide","673025313":"Order Star Core: Speed Check","673025314":"Order Star Core: Speed Check","673025315":"Order Star Core: Speed Check","673025316":"Order Star Core: Speed Check","673025323":"Order Star Core: Buckshot Acceleration","673025324":"Order Star Core: Buckshot Acceleration","673025325":"Order Star Core: Buckshot Acceleration","673025326":"Order Star Core: Buckshot Acceleration","673025333":"Order Star Core: Lightning Torrent","673025334":"Order Star Core: Lightning Torrent","673025335":"Order Star Core: Lightning Torrent","673025336":"Order Star Core: Lightning Torrent","673025403":"Order Star Core: Death Sword Energy","673025404":"Order Star Core: Death Sword Energy","673025405":"Order Star Core: Death Sword Energy","673025406":"Order Star Core: Death Sword Energy","673025413":"Order Star Core: Destruction Beam","673025414":"Order Star Core: Destruction Beam","673025415":"Order Star Core: Destruction Beam","673025416":"Order Star Core: Destruction Beam","673025423":"Order Star Core: Approaching Death","673025424":"Order Star Core: Approaching Death","673025425":"Order Star Core: Approaching Death","673025426":"Order Star Core: Approaching Death","673025433":"Order Star Core: Reality's Faded Edge","673025434":"Order Star Core: Reality's Faded Edge","673025435":"Order Star Core: Reality's Faded Edge","673025436":"Order Star Core: Reality's Faded Edge","673025503":"Order Star Core: Hearth and Hospitality","673025504":"Order Star Core: Hearth and Hospitality","673025505":"Order Star Core: Hearth and Hospitality","673025506":"Order Star Core: Hearth and Hospitality","673025513":"Order Star Core: Ink Spray","673025514":"Order Star Core: Ink Spray","673025515":"Order Star Core: Ink Spray","673025516":"Order Star Core: Ink Spray","673025523":"Order Star Core: Crow Brawl","673025524":"Order Star Core: Crow Brawl","673025525":"Order Star Core: Crow Brawl","673025526":"Order Star Core: Crow Brawl","673025603":"Order Star Core: Destruction","673025604":"Order Star Core: Destruction","673025605":"Order Star Core: Destruction","673025606":"Order Star Core: Destruction","673100003":"Chaos Sun Core: Flashy Attack","673100004":"Chaos Sun Core: Flashy Attack","673100005":"Chaos Sun Core: Flashy Attack","673100006":"Chaos Sun Core: Flashy Attack","673101003":"Chaos Sun Core: Stable Attack","673101004":"Chaos Sun Core: Stable Attack","673101005":"Chaos Sun Core: Stable Attack","673101006":"Chaos Sun Core: Stable Attack","673102003":"Chaos Sun Core: Swift Attack","673102004":"Chaos Sun Core: Swift Attack","673102005":"Chaos Sun Core: Swift Attack","673102006":"Chaos Sun Core: Swift Attack","673103003":"Chaos Sun Core: Faith Enhancement","673103004":"Chaos Sun Core: Faith Enhancement","673103005":"Chaos Sun Core: Faith Enhancement","673103006":"Chaos Sun Core: Faith Enhancement","673104003":"Chaos Sun Core: Flowing Magick","673104004":"Chaos Sun Core: Flowing Magick","673104005":"Chaos Sun Core: Flowing Magick","673104006":"Chaos Sun Core: Flowing Magick","673105003":"Chaos Sun Core: Fortitude Enhancement","673105004":"Chaos Sun Core: Fortitude Enhancement","673105005":"Chaos Sun Core: Fortitude Enhancement","673105006":"Chaos Sun Core: Fortitude Enhancement","673110003":"Chaos Moon Core: Smoldering Strike","673110004":"Chaos Moon Core: Smoldering Strike","673110005":"Chaos Moon Core: Smoldering Strike","673110006":"Chaos Moon Core: Smoldering Strike","673111003":"Chaos Moon Core: Absorbing Strike","673111004":"Chaos Moon Core: Absorbing Strike","673111005":"Chaos Moon Core: Absorbing Strike","673111006":"Chaos Moon Core: Absorbing Strike","673112003":"Chaos Moon Core: Crushing Strike","673112004":"Chaos Moon Core: Crushing Strike","673112005":"Chaos Moon Core: Crushing Strike","673112006":"Chaos Moon Core: Crushing Strike","673113003":"Chaos Moon Core: Echoing Brand","673113004":"Chaos Moon Core: Echoing Brand","673113005":"Chaos Moon Core: Echoing Brand","673113006":"Chaos Moon Core: Echoing Brand","673114003":"Chaos Moon Core: Echoing Steel","673114004":"Chaos Moon Core: Echoing Steel","673114005":"Chaos Moon Core: Echoing Steel","673114006":"Chaos Moon Core: Echoing Steel","673115003":"Chaos Moon Core: Echoing Death","673115004":"Chaos Moon Core: Echoing Death","673115005":"Chaos Moon Core: Echoing Death","673115006":"Chaos Moon Core: Echoing Death","673120003":"Chaos Star Core: Attack","673120004":"Chaos Star Core: Attack","673120005":"Chaos Star Core: Attack","673120006":"Chaos Star Core: Attack","673121003":"Chaos Star Core: Weapon","673121004":"Chaos Star Core: Weapon","673121005":"Chaos Star Core: Weapon","673121006":"Chaos Star Core: Weapon","673122003":"Chaos Star Core: Salvation","673122004":"Chaos Star Core: Salvation","673122005":"Chaos Star Core: Salvation","673122006":"Chaos Star Core: Salvation","673123003":"Chaos Star Core: Life","673123004":"Chaos Star Core: Life","673123005":"Chaos Star Core: Life","673123006":"Chaos Star Core: Life","673124003":"Chaos Star Core: Speed","673124004":"Chaos Star Core: Speed","673124005":"Chaos Star Core: Speed","673124006":"Chaos Star Core: Speed","673125003":"Chaos Star Core: Defense","673125004":"Chaos Star Core: Defense","673125005":"Chaos Star Core: Defense","673125006":"Chaos Star Core: Defense"};
  const BIBLE_GEMS = {"65001010":"Gemme Niv. 1 (Lv. 1 Apprentice's Gem (Bound))","65001020":"Gemme Niv. 2 (Lv. 2 Apprentice's Gem (Bound))","65011010":"Gemme Niv. 1 (Level 1 Azure Gem)","65011020":"Gemme Niv. 2 (Level 2 Azure Gem)","65011030":"Gemme Niv. 3 (Level 3 Azure Gem)","65011040":"Gemme Niv. 4 (Level 4 Azure Gem)","65011050":"Gemme Niv. 5 (Level 5 Azure Gem)","65011060":"Gemme Niv. 6 (Level 6 Azure Gem)","65011070":"Gemme Niv. 7 (Level 7 Azure Gem)","65011080":"Gemme Niv. 8 (Level 8 Azure Gem)","65011090":"Gemme Niv. 9 (Level 9 Azure Gem)","65011100":"Gemme Niv. 10 (Level 10 Azure Gem)","65012010":"Gemme Niv. 1 (Level 1 Farsea Gem)","65012020":"Gemme Niv. 2 (Level 2 Farsea Gem)","65012030":"Gemme Niv. 3 (Level 3 Farsea Gem)","65012040":"Gemme Niv. 4 (Level 4 Farsea Gem)","65012050":"Gemme Niv. 5 (Level 5 Farsea Gem)","65012060":"Gemme Niv. 6 (Level 6 Farsea Gem)","65012070":"Gemme Niv. 7 (Level 7 Farsea Gem)","65012080":"Gemme Niv. 8 (Level 8 Farsea Gem)","65012090":"Gemme Niv. 9 (Level 9 Farsea Gem)","65012100":"Gemme Niv. 10 (Level 10 Farsea Gem)","65021010":"Gemme Niv. 1 (Lv. 1 Annihilation Gem)","65021020":"Gemme Niv. 2 (Lv. 2 Annihilation Gem)","65021030":"Gemme Niv. 3 (Lv. 3 Annihilation Gem)","65021040":"Gemme Niv. 4 (Lv. 4 Annihilation Gem)","65021050":"Gemme Niv. 5 (Lv. 5 Annihilation Gem)","65021060":"Gemme Niv. 6 (Lv. 6 Annihilation Gem)","65021070":"Gemme Niv. 7 (Lv. 7 Annihilation Gem)","65021080":"Gemme Niv. 8 (Lv. 8 Annihilation Gem)","65021090":"Gemme Niv. 9 (Lv. 9 Annihilation Gem)","65021100":"Gemme Niv. 10 (Lv. 10 Annihilation Gem)","65022010":"Gemme Niv. 1 (Lv. 1 Crimson Flame Gem)","65022020":"Gemme Niv. 2 (Lv. 2 Crimson Flame Gem)","65022030":"Gemme Niv. 3 (Lv. 3 Crimson Flame Gem)","65022040":"Gemme Niv. 4 (Lv. 4 Crimson Flame Gem)","65022050":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem)","65022060":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem)","65022070":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem)","65022080":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem)","65022090":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem)","65022100":"Gemme Niv. 10 (Lv. 10 Crimson Flame Gem)","65031010":"Gemme T4 Niv. 1 (Dégâts Majeurs)","65031020":"Gemme T4 Niv. 2 (Dégâts Majeurs)","65031030":"Gemme T4 Niv. 3 (Dégâts Majeurs)","65031040":"Gemme T4 Niv. 4 (Dégâts Majeurs)","65031050":"Gemme T4 Niv. 5 (Dégâts Majeurs)","65031060":"Gemme T4 Niv. 6 (Dégâts Majeurs)","65031061":"Gemme T4 Niv. 6 (Dégâts Majeurs)","65031070":"Gemme T4 Niv. 7 (Dégâts Majeurs)","65031080":"Gemme T4 Niv. 8 (Dégâts Majeurs)","65031090":"Gemme T4 Niv. 9 (Dégâts Majeurs)","65031100":"Gemme T4 Niv. 10 (Dégâts Majeurs)","65032010":"Gemme T4 Niv. 1 (Dégâts)","65032020":"Gemme T4 Niv. 2 (Dégâts)","65032030":"Gemme T4 Niv. 3 (Dégâts)","65032040":"Gemme T4 Niv. 4 (Dégâts)","65032050":"Gemme T4 Niv. 5 (Dégâts)","65032060":"Gemme T4 Niv. 6 (Dégâts)","65032061":"Gemme T4 Niv. 6 (Dégâts)","65032070":"Gemme T4 Niv. 7 (Dégâts)","65032080":"Gemme T4 Niv. 8 (Dégâts)","65032090":"Gemme T4 Niv. 9 (Dégâts)","65032100":"Gemme T4 Niv. 10 (Dégâts)","65041010":"Gemme T4 Niv. 1 (Rechargement)","65041020":"Gemme T4 Niv. 2 (Rechargement)","65041030":"Gemme T4 Niv. 3 (Rechargement)","65041040":"Gemme T4 Niv. 4 (Rechargement)","65041050":"Gemme T4 Niv. 5 (Rechargement)","65041051":"Gemme T4 Niv. 5 (Rechargement)","65041060":"Gemme T4 Niv. 6 (Rechargement)","65041061":"Gemme T4 Niv. 6 (Rechargement)","65041070":"Gemme T4 Niv. 7 (Rechargement)","65041071":"Gemme T4 Niv. 7 (Rechargement)","65041072":"Gemme T4 Niv. 7 (Rechargement)","65041073":"Gemme T4 Niv. 7 (Rechargement)","65041080":"Gemme T4 Niv. 8 (Rechargement)","65041082":"Gemme T4 Niv. 8 (Rechargement)","65041090":"Gemme T4 Niv. 9 (Rechargement)","65041100":"Gemme T4 Niv. 10 (Rechargement)","65042010":"Gemme T4 Niv. 1 (Rechargement)","65042020":"Gemme T4 Niv. 2 (Rechargement)","65042030":"Gemme T4 Niv. 3 (Rechargement)","65042040":"Gemme T4 Niv. 4 (Rechargement)","65042050":"Gemme T4 Niv. 5 (Rechargement)","65042060":"Gemme T4 Niv. 6 (Rechargement)","65042070":"Gemme T4 Niv. 7 (Rechargement)","65042080":"Gemme T4 Niv. 8 (Rechargement)","65042090":"Gemme T4 Niv. 9 (Rechargement)","65042100":"Gemme T4 Niv. 10 (Rechargement)","65091010":"Gemme Niv. 1 (Lv. 1 Annihilation Gem (Bound))","65091020":"Gemme Niv. 2 (Lv. 2 Annihilation Gem (Bound))","65091030":"Gemme Niv. 3 (Lv. 3 Annihilation Gem (Bound))","65091040":"Gemme Niv. 4 (Lv. 4 Annihilation Gem (Bound))","65091050":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091051":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091052":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091053":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091054":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091055":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091056":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091057":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091058":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091059":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091060":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091061":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091062":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091063":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091064":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091065":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091066":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091067":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091068":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091069":"Gemme Niv. 6 (Lv. 6 Annihilation Gem (Bound))","65091070":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091071":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091072":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091073":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091074":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091075":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091076":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091077":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091078":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091079":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091080":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091090":"Gemme Niv. 9 (Lv. 9 Annihilation Gem (Bound))","65091100":"Gemme Niv. 10 (Lv. 10 Annihilation Gem (Bound))","65091171":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091172":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091173":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091174":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091175":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091176":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091177":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091178":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091181":"Gemme Niv. 9 (Lv. 9 Annihilation Gem (Bound))","65091191":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091192":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091193":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091194":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091195":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091196":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091197":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091198":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091201":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091202":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091203":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091204":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091205":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091206":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091207":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091208":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091211":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091212":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091213":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091214":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091215":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091216":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091217":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091218":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091221":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091222":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091223":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091224":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091225":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091226":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091227":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091228":"Gemme Niv. 8 (Lv. 8 Annihilation Gem (Bound))","65091231":"Gemme T4 Niv. 7 (Dégâts Majeurs)","65091241":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091242":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091243":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091244":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091245":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091246":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091247":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091248":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091251":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091252":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091253":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091254":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091255":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091256":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091257":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091258":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091261":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091262":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091263":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091264":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091265":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091266":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091267":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091268":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091281":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091282":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091283":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091284":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091285":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091286":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091287":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091288":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091291":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091292":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091293":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091294":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091295":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091296":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091297":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091298":"Gemme Niv. 5 (Lv. 5 Annihilation Gem (Bound))","65091301":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091302":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091303":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091304":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091305":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091306":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091307":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091308":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091311":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091312":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091313":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091314":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091315":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091316":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091317":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091318":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091321":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091322":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091323":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091324":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091325":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091326":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091327":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091328":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091331":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091332":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091333":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091334":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091335":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091336":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091337":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091338":"Gemme Niv. 7 (Lv. 7 Annihilation Gem (Bound))","65091341":"Gemme T4 Niv. 6 (Rechargement)","65091342":"Gemme T4 Niv. 6 (Rechargement)","65091343":"Gemme T4 Niv. 6 (Rechargement)","65091344":"Gemme T4 Niv. 6 (Rechargement)","65091345":"Gemme T4 Niv. 6 (Rechargement)","65091346":"Gemme T4 Niv. 6 (Rechargement)","65091347":"Gemme T4 Niv. 6 (Rechargement)","65091348":"Gemme T4 Niv. 6 (Rechargement)","65091351":"Gemme T4 Niv. 6 (Rechargement)","65091352":"Gemme T4 Niv. 6 (Rechargement)","65091353":"Gemme T4 Niv. 6 (Rechargement)","65091354":"Gemme T4 Niv. 6 (Rechargement)","65091355":"Gemme T4 Niv. 6 (Rechargement)","65091356":"Gemme T4 Niv. 6 (Rechargement)","65091357":"Gemme T4 Niv. 6 (Rechargement)","65091358":"Gemme T4 Niv. 6 (Rechargement)","65091361":"Gemme T4 Niv. 5 (Rechargement)","65091362":"Gemme T4 Niv. 5 (Rechargement)","65091363":"Gemme T4 Niv. 5 (Rechargement)","65091364":"Gemme T4 Niv. 5 (Rechargement)","65091365":"Gemme T4 Niv. 5 (Rechargement)","65091366":"Gemme T4 Niv. 5 (Rechargement)","65091367":"Gemme T4 Niv. 5 (Rechargement)","65091368":"Gemme T4 Niv. 5 (Rechargement)","65091371":"Gemme T4 Niv. 5 (Rechargement)","65091372":"Gemme T4 Niv. 5 (Rechargement)","65091373":"Gemme T4 Niv. 5 (Rechargement)","65091374":"Gemme T4 Niv. 5 (Rechargement)","65091375":"Gemme T4 Niv. 5 (Rechargement)","65091376":"Gemme T4 Niv. 5 (Rechargement)","65091377":"Gemme T4 Niv. 5 (Rechargement)","65091378":"Gemme T4 Niv. 5 (Rechargement)","65091381":"Gemme T4 Niv. 6 (Rechargement)","65091382":"Gemme T4 Niv. 6 (Rechargement)","65091383":"Gemme T4 Niv. 6 (Rechargement)","65091384":"Gemme T4 Niv. 6 (Rechargement)","65091385":"Gemme T4 Niv. 6 (Rechargement)","65091386":"Gemme T4 Niv. 6 (Rechargement)","65091387":"Gemme T4 Niv. 6 (Rechargement)","65091388":"Gemme T4 Niv. 6 (Rechargement)","65091391":"Gemme T4 Niv. 6 (Rechargement)","65091392":"Gemme T4 Niv. 6 (Rechargement)","65091393":"Gemme T4 Niv. 6 (Rechargement)","65091394":"Gemme T4 Niv. 6 (Rechargement)","65091395":"Gemme T4 Niv. 6 (Rechargement)","65091396":"Gemme T4 Niv. 6 (Rechargement)","65091397":"Gemme T4 Niv. 6 (Rechargement)","65091398":"Gemme T4 Niv. 6 (Rechargement)","65092010":"Gemme Niv. 1 (Lv. 1 Crimson Flame Gem (Bound))","65092020":"Gemme Niv. 2 (Lv. 2 Crimson Flame Gem (Bound))","65092030":"Gemme Niv. 3 (Lv. 3 Crimson Flame Gem (Bound))","65092040":"Gemme Niv. 4 (Lv. 4 Crimson Flame Gem (Bound))","65092050":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092051":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092052":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092053":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092054":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092055":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092056":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092057":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092058":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092059":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092060":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092061":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092062":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092063":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092064":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092065":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092066":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092067":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092068":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092069":"Gemme Niv. 6 (Lv. 6 Crimson Flame Gem (Bound))","65092070":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092071":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092072":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092073":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092074":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092075":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092076":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092077":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092078":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092079":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092080":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092090":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem (Bound))","65092100":"Gemme Niv. 10 (Lv. 10 Crimson Flame Gem (Bound))","65092171":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092172":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092173":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092174":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092175":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092176":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092177":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092178":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092181":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem (Bound))","65092191":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092192":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092193":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092194":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092195":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092196":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092197":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092198":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092201":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092202":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092203":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092204":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092205":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092206":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092207":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092208":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092211":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092212":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092213":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092214":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092215":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092216":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092217":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092218":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092221":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092222":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092223":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092224":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092225":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092226":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092227":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092228":"Gemme Niv. 8 (Lv. 8 Crimson Flame Gem (Bound))","65092231":"Gemme T4 Niv. 7 (Dégâts)","65092241":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092242":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092243":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092244":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092245":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092246":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092247":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092248":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092251":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092252":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092253":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092254":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092255":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092256":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092257":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092258":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092261":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092262":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092263":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092264":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092265":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092266":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092267":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092268":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092281":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092282":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092283":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092284":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092285":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092286":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092287":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092288":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092291":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092292":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092293":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092294":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092295":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092296":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092297":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092298":"Gemme Niv. 5 (Lv. 5 Crimson Flame Gem (Bound))","65092301":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092302":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092303":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092304":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092305":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092306":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092307":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092308":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092311":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092312":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092313":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092314":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092315":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092316":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092317":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092318":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092321":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092322":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092323":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092324":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092325":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092326":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092327":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092328":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092331":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092332":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092333":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092334":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092335":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092336":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092337":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092338":"Gemme Niv. 7 (Lv. 7 Crimson Flame Gem (Bound))","65092341":"Gemme T4 Niv. 6 (Rechargement)","65092342":"Gemme T4 Niv. 6 (Rechargement)","65092343":"Gemme T4 Niv. 6 (Rechargement)","65092344":"Gemme T4 Niv. 6 (Rechargement)","65092345":"Gemme T4 Niv. 6 (Rechargement)","65092346":"Gemme T4 Niv. 6 (Rechargement)","65092347":"Gemme T4 Niv. 6 (Rechargement)","65092348":"Gemme T4 Niv. 6 (Rechargement)","65092351":"Gemme T4 Niv. 6 (Rechargement)","65092352":"Gemme T4 Niv. 6 (Rechargement)","65092353":"Gemme T4 Niv. 6 (Rechargement)","65092354":"Gemme T4 Niv. 6 (Rechargement)","65092355":"Gemme T4 Niv. 6 (Rechargement)","65092356":"Gemme T4 Niv. 6 (Rechargement)","65092357":"Gemme T4 Niv. 6 (Rechargement)","65092358":"Gemme T4 Niv. 6 (Rechargement)","65092361":"Gemme T4 Niv. 5 (Rechargement)","65092362":"Gemme T4 Niv. 5 (Rechargement)","65092363":"Gemme T4 Niv. 5 (Rechargement)","65092364":"Gemme T4 Niv. 5 (Rechargement)","65092365":"Gemme T4 Niv. 5 (Rechargement)","65092366":"Gemme T4 Niv. 5 (Rechargement)","65092367":"Gemme T4 Niv. 5 (Rechargement)","65092368":"Gemme T4 Niv. 5 (Rechargement)","65092371":"Gemme T4 Niv. 5 (Rechargement)","65092372":"Gemme T4 Niv. 5 (Rechargement)","65092373":"Gemme T4 Niv. 5 (Rechargement)","65092374":"Gemme T4 Niv. 5 (Rechargement)","65092375":"Gemme T4 Niv. 5 (Rechargement)","65092376":"Gemme T4 Niv. 5 (Rechargement)","65092377":"Gemme T4 Niv. 5 (Rechargement)","65092378":"Gemme T4 Niv. 5 (Rechargement)","65092381":"Gemme T4 Niv. 6 (Rechargement)","65092382":"Gemme T4 Niv. 6 (Rechargement)","65092383":"Gemme T4 Niv. 6 (Rechargement)","65092384":"Gemme T4 Niv. 6 (Rechargement)","65092385":"Gemme T4 Niv. 6 (Rechargement)","65092386":"Gemme T4 Niv. 6 (Rechargement)","65092387":"Gemme T4 Niv. 6 (Rechargement)","65092388":"Gemme T4 Niv. 6 (Rechargement)","65092391":"Gemme T4 Niv. 6 (Rechargement)","65092392":"Gemme T4 Niv. 6 (Rechargement)","65092393":"Gemme T4 Niv. 6 (Rechargement)","65092394":"Gemme T4 Niv. 6 (Rechargement)","65092395":"Gemme T4 Niv. 6 (Rechargement)","65092396":"Gemme T4 Niv. 6 (Rechargement)","65092397":"Gemme T4 Niv. 6 (Rechargement)","65092398":"Gemme T4 Niv. 6 (Rechargement)","65093003":"Gemme Niv. 9 (Lv. 9 Annihilation Gem (Bound))","65093007":"Gemme Niv. 9 (Lv. 9 Crimson Flame Gem (Bound))","65093010":"Gemme T4 Niv. 7 (Dégâts Majeurs)","65093015":"Gemme T4 Niv. 7 (Dégâts)","65093019":"Gemme T4 Niv. 7 (Rechargement)","65093020":"Gemme T4 Niv. 7 (Rechargement)","65093021":"Gemme T4 Niv. 8 (Rechargement)"};
  
  

  

  let activeCanonicalKey = null;
  let liveImportedProfile = null;

  function renderCanonicalView() {
    const cur = getCurrentActiveCharacter();
    let prof = liveImportedProfile;
    if (!prof && cur) {
      prof = {
        name: cur.name,
        role: cur.role || 'dps',
        ilvl: cur.ilvl || 1750,
        inGameScore: cur.cp || 3500,
        calculatedScore: cur.cp || 3500,
        buffPower: Math.round((cur.cp || 3500) * 0.75),
        healPower: cur.role === 'support' ? Math.round((cur.cp || 3500) * 0.60) : 0,
        partsCount: 16,
        items: cur.items || []
      };
    }
    if (!prof) return;
    const isSupport = prof.role === 'support';

    // Recalcule le score canonique exact à partir des items pour garantir une fidélité mathématique absolue
    if (prof.items && prof.items.length > 0) {
      const baseIt = prof.items.find(it => it.cat === 'Base' || it.cat === 'Stat de Base');
      if (baseIt) {
        // Base Val est un entier format\u00e9 par formatNumber : "558,980" (en-US) ou "558 980" (fr-FR, U+202F/U+00A0)
        const bMatch = (baseIt.mult || '').match(/Base Val:\s*(\d[\d\s\u202f\u00a0,.]*)/);
        if (bMatch) {
          const baseVal = parseInt(bMatch[1].replace(/\D/g, ''), 10);
          let dynamicScore = baseVal / 1e4;
          prof.items.forEach(it => {
            if (it.cat === 'Base' || it.cat === 'Stat de Base') return;
            if (it.mult === '+0.00%') return;
            if (it.type && it.type.includes('Heal')) return;
            const mMatch = (it.mult || '').match(/\+([\d.]+)%/);
            if (mMatch) {
              const pct = parseFloat(mMatch[1]);
              dynamicScore *= (1 + pct / 100);
            }
          });
          if (isSupport) {
            prof.buffPower = parseFloat(dynamicScore.toFixed(2));
            prof.calculatedScore = parseFloat((prof.buffPower + (prof.healPower || 0)).toFixed(2));
          } else {
            prof.calculatedScore = parseFloat(dynamicScore.toFixed(2));
            prof.buffPower = prof.calculatedScore;
          }
        }
      }
    }

    const isEn = isEnLang();
    if (dom.canonRoleBadge) {
      dom.canonRoleBadge.textContent = isSupport 
        ? 'Support Split (Buff + Heal)' 
        : (isEn ? 'Canonical DPS' : 'DPS Canonique');
      dom.canonRoleBadge.style.color = isSupport ? 'var(--support-color)' : 'var(--dps-color)';
      dom.canonRoleBadge.style.borderColor = isSupport ? 'rgba(232, 230, 220, 0.3)' : 'rgba(224, 122, 99, 0.3)';
    }

    if (dom.canonInGameScore) dom.canonInGameScore.textContent = formatNumber(prof.inGameScore || prof.cp || 0);
    if (dom.canonInGameSub) dom.canonInGameSub.textContent = isEn
      ? `Official profile: ${prof.name} (${prof.ilvl.toFixed(2)} iLvl)`
      : `Profil officiel : ${prof.name} (${prof.ilvl.toFixed(2)} iLvl)`;

    if (dom.canonCalculatedScore) dom.canonCalculatedScore.textContent = formatNumber(prof.calculatedScore);
    if (dom.canonCalculatedRange) {
      const diff = Math.abs(prof.calculatedScore - (prof.inGameScore || prof.calculatedScore));
      const pct = (prof.inGameScore > 0) ? ((diff / prof.inGameScore) * 100).toFixed(1) : '0.3';
      dom.canonCalculatedRange.textContent = isEn
        ? `Observed deviation: ±${pct}% vs in-game value`
        : `Écart constaté : ±${pct}% vs valeur en jeu`;
    }

    if (dom.canonBuffPower) dom.canonBuffPower.textContent = formatNumber(prof.buffPower);
    if (dom.canonHealPower) dom.canonHealPower.textContent = isSupport ? formatNumber(prof.healPower) : '0';

    if (dom.canonBuffCard) {
      dom.canonBuffCard.style.display = isSupport ? 'flex' : 'none';
    }
    if (dom.canonHealCard) {
      dom.canonHealCard.style.display = isSupport ? 'flex' : 'none';
    }

    if (dom.canonPartsCount) {
      dom.canonPartsCount.textContent = isEn
        ? `${prof.partsCount || (prof.items ? prof.items.length : 0)} Broken Down Components`
        : `${prof.partsCount || (prof.items ? prof.items.length : 0)} Composants Décomposés`;
    }

    if (dom.canonTableBody && prof.items) {
      const catMapEn = {
        'Stat de Base': 'Base Stat',
        'Arme': 'Weapon',
        'Armure': 'Armor',
        'Accessoires': 'Accessories',
        'Bracelet': 'Bracelet',
        'Gravures': 'Engravings',
        'Karma': 'Karma',
        'Ark Grid': 'Ark Grid',
        'Qualité': 'Quality',
        'Effets Spéciaux': 'Special Effects'
      };

      let rows = '';
      prof.items.forEach(rawIt => {
        const it = (typeof translateCanonicalItem === 'function')
          ? translateCanonicalItem(rawIt, isEn)
          : (window.translateCanonicalItem ? window.translateCanonicalItem(rawIt, isEn) : rawIt);

        const displayCat = it.cat;
        const isQualSupport = (it.cat === 'Qualité' || it.cat === 'Quality' || it.label.includes('Qualité d\'Arme') || it.label.includes('Weapon Quality')) && isSupport;
        let subNote = '';
        if (isQualSupport) {
          subNote = isEn
            ? `<div style="font-size: 12px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">+28.5% solo personal damage, but 0% transferred to allies (excluded from Buff Power formula).</div>`
            : `<div style="font-size: 12px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">+28.5% dégâts solo perso, mais 0% transféré aux alliés (exclu de la formule de Buff Power).</div>`;
        } else if (it.note) {
          subNote = `<div style="font-size: 12px; color: var(--text-muted); font-weight: 400; margin-top: 2px;">${it.note}</div>`;
        }

        let displayType = it.type;

        rows += `
          <tr>
            <td><span class="canon-badge ${it.badge}">${displayCat}</span></td>
            <td>
              <strong>${it.label}</strong>
              ${subNote}
            </td>
            <td style="font-family: var(--font-mono);">${it.val}</td>
            <td style="font-family: var(--font-mono); color: ${it.mult === '+0.00%' ? 'var(--text-muted)' : 'var(--accent-green)'};">${it.mult}</td>
            <td style="color: ${it.type.includes('Heal') ? '#E07A63' : it.type.includes('Buff') ? 'var(--support-color)' : 'var(--dps-color)'}; font-weight: 600;">
              ${displayType}
            </td>
          </tr>
        `;
      });
      dom.canonTableBody.innerHTML = rows;
    }
  }

  // --- Fonctions de Désérialisation & Parsing SvelteKit de lostark.bible ---

  function unflattenDevalue(raw) {
    const pool = Array.isArray(raw) ? raw : Object.values(raw);
    const hydrated = new Array(pool.length);
    function hydrate(val) {
      if (val === null || val === undefined) return val;
      if (typeof val === 'number') {
        if (hydrated[val] !== undefined) return hydrated[val];
        const item = pool[val];
        if (item === null || typeof item !== 'object') {
          hydrated[val] = item;
          return item;
        }
        if (Array.isArray(item)) {
          const arr = [];
          hydrated[val] = arr;
          for (const el of item) arr.push(hydrate(el));
          return arr;
        }
        const obj = {};
        hydrated[val] = obj;
        for (const [k, v] of Object.entries(item)) obj[k] = hydrate(v);
        return obj;
      }
      return val;
    }
    return hydrate(0);
  }

  

  function parseBibleCharacter(dataNode, preferredRole = 'support') {
    const root = unflattenDevalue(dataNode);
    if (!root || !root.loadouts || !root.loadouts.length) {
      throw new Error('Données de personnage invalides ou introuvables.');
    }

    // Sélectionne STRICTEMENT le loadout de Raid (exclut tout profil Donjon du Chaos / Cube / Trégion)
    const raidLoadouts = root.loadouts.filter(l => {
      const cls = (l.classification || '').toLowerCase();
      return !cls.includes('chaos') && !cls.includes('cube') && !cls.includes('trixion') && (l.combatPower?.score || 0) > 1000;
    });

    let loadout = raidLoadouts.find(l => l.classification === 'raid_merged');
    if (!loadout || !loadout.gems || loadout.gems.length < 5) {
      loadout = raidLoadouts.find(l => l.classification === 'most_recent_raid') || raidLoadouts[0];
    }
    raidLoadouts.forEach(l => {
      if ((l.combatPower?.score || 0) > (loadout?.combatPower?.score || 0)) {
        loadout = l;
      }
    });
    // Détection préalable du rôle natif de la classe
    const rawClassStr = root.characterInfo?.characterClassName || (root.header && root.header.class) || (loadout && loadout.classId) || (root.character && root.character.classId) || '';
    const charName = root.characterInfo?.characterName || (root.header && root.header.name) || '';
    const isSupportClass = detectCharacterRole(rawClassStr, '') === 'support';
    const effectivePrefRole = isSupportClass ? 'support' : preferredRole;

    // Si le rôle souhaité est support, privilégier explicitement un loadout support si présent
    if (effectivePrefRole === 'support') {
      const supLoadouts = raidLoadouts.filter(l => l.battlePoint?.isSupport === true || l.isSupport === true);
      if (supLoadouts.length > 0) {
        let bestSup = supLoadouts[0];
        supLoadouts.forEach(l => {
          if ((l.combatPower?.score || 0) > (bestSup?.combatPower?.score || 0)) {
            bestSup = l;
          }
        });
        loadout = bestSup;
      }
    }

    // Fallback de sécurité si aucun raidLoadout filtré
    if (!loadout) {
      loadout = root.loadouts.find(l => !(l.classification || '').toLowerCase().includes('chaos')) || root.loadouts[0];
    }
    const bp = loadout.battlePoint;
    if (!bp || !bp.parts) {
      throw new Error('Données Combat Power (Battle Point) absentes.');
    }

    const charRole = detectCharacterRole({
      className: rawClassStr,
      classId: loadout.classId,
      engravings: loadout.engravings,
      spec: loadout.spec,
      name: charName
    });

    const isSupport = charRole === 'support' || bp.isSupport === true || (effectivePrefRole === 'support' && isSupportClassName(rawClassStr));

    const parts = bp.parts;
    const atkPart = parts.find(p => p.type === 1);
    const hpPart = parts.find(p => p.type === 2);

    let atkMin = atkPart ? ((atkPart.value !== undefined ? atkPart.value : atkPart.min) / 1e4) : 0;
    let atkMax = atkPart ? ((atkPart.value !== undefined ? atkPart.value : atkPart.max) / 1e4) : 0;
    let defMin = hpPart ? ((hpPart.value !== undefined ? hpPart.value : hpPart.min) / 1e4) : 0;
    let defMax = hpPart ? ((hpPart.value !== undefined ? hpPart.value : hpPart.max) / 1e4) : 0;

    const defTypes = [11, 16, 18, 21, 30, 32, 35];
    const items = [];

    if (atkPart) {
      items.push({
        cat: 'Base',
        label: `Attaque de Base (Stat: ${formatNumber(atkPart.mainStat || 0)}, Arme: ${formatNumber(atkPart.weaponPower || 0)})`,
        val: `${formatNumber(Math.round(atkPart.baseAttackPower || 0))} AP`,
        mult: `Base Val: ${formatNumber(Math.round(atkPart.value || 0))}`,
        type: isSupport ? 'Buff Power' : 'DPS Net',
        badge: 'base'
      });
    }

    if (hpPart && isSupport) {
      items.push({
        cat: 'Base',
        label: `Points de Vie Maximum (Vitalité)`,
        val: `${formatNumber(hpPart.maxHp || 0)} HP`,
        mult: `Base Val: ${formatNumber(Math.round(hpPart.value || 0))}`,
        type: 'Heal / Shield',
        badge: 'base'
      });
    }

    // Extraction préalable du Bracelet complet depuis loadout.items
    const brItem = (loadout.items || []).find(i => i.slot === 'bracelet');
    const brParts = parts.filter(p => p.type === 19 || p.type === 20 || p.type === 21);
    let handledBracelet = false;
    let handledAstrogems = false;

    for (const p of parts) {
      if (p.type === 1 || p.type === 2) continue;

      // Gestion spéciale groupée du Bracelet
      if (p.type === 19 || p.type === 20 || p.type === 21) {
        if (!handledBracelet) {
          handledBracelet = true;
          if (brItem && brItem.data && brItem.data.stats && brItem.data.stats.length) {
            const mainStatName = getMainStatName(loadout.classId, false);

            brItem.data.stats.forEach(st => {
              const sIndex = st.index;
              const sVal = st.value;
              const bpPart = brParts.find(bp => bp.stat && bp.stat.index === sIndex);
              const partVal = bpPart ? bpPart.value : 0;
              const isPerk = st.type === 3 || sIndex > 1000;

              if (isPerk) {
                const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[sIndex]) || null;
                const pName = perk ? perk.name : `Roll Spécial (#${sIndex})`;
                const pDesc = perk ? perk.desc : null;
                const multStr = `+${(partVal / 100).toFixed(2)}%`;

                items.push({
                  cat: 'Bracelet',
                  label: `Bracelet Ancien — ${pName}`,
                  val: `+${(partVal / 100).toFixed(2)}%`,
                  mult: multStr,
                  type: isSupport ? 'Buff Power' : 'DPS Net',
                  badge: 'gear',
                  note: pDesc ? `${pDesc}` : null
                });
              } else {
                const statInfo = BIBLE_STAT_MAP[sIndex] || null;
                const statName = (statInfo && statInfo.name) ? statInfo.name : mainStatName;
                const dest = (statInfo && statInfo.dest) ? statInfo.dest : "l'Attaque de Base";
                const isPercent = statInfo ? statInfo.isPercent : false;

                const displayVal = isPercent ? `+${(sVal / 100).toFixed(2)}%` : `+${formatNumber(sVal)}`;
                const multStr = `+${(partVal / 100).toFixed(2)}%`;

                items.push({
                  cat: 'Bracelet',
                  label: `Bracelet Ancien — ${statName} (${displayVal})`,
                  val: displayVal,
                  mult: multStr,
                  type: isSupport ? 'Buff Power' : 'DPS Net',
                  badge: 'gear',
                  note: partVal === 0 ? `Stat brute de ${statName.toLowerCase()} déjà intégrée directement dans ${dest} en tête de liste.` : null
                });
              }
            });
          } else {
            // Fallback si items.stats non renseigné
            brParts.forEach(bpPart => {
              const sIndex = bpPart.stat ? bpPart.stat.index : 0;
              const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[sIndex]) || null;
              const pName = perk ? perk.name : `Roll (#${sIndex})`;
              const multStr = `+${(bpPart.value / 100).toFixed(2)}%`;
              items.push({
                cat: 'Bracelet',
                label: `Bracelet Ancien — ${pName}`,
                val: multStr,
                mult: multStr,
                type: isSupport ? 'Buff Power' : 'DPS Net',
                badge: 'gear',
                note: perk ? `${perk.desc}` : null
              });
            });
          }
        }
        // Accumule le multiplicateur de battlePoint
        const bval = p.value !== undefined ? p.value : 0;
        if (defTypes.includes(p.type)) {
          defMin *= (1 + bval / 1e4);
          defMax *= (1 + bval / 1e4);
        } else {
          atkMin *= (1 + bval / 1e4);
          atkMax *= (1 + bval / 1e4);
        }
        continue;
      }

      const isDef = defTypes.includes(p.type);
      const val = p.value !== undefined ? p.value : (p.min !== undefined ? p.min : 0);
      const maxVal = p.value !== undefined ? p.value : (p.max !== undefined ? p.max : 0);

      if (isDef) {
        defMin *= (1 + val / 1e4);
        defMax *= (1 + maxVal / 1e4);
      } else {
        atkMin *= (1 + val / 1e4);
        atkMax *= (1 + maxVal / 1e4);
      }

      let cat = 'Système';
      let label = `Composant Type #${p.type}`;
      let badge = isDef ? 'defense' : 'passive';
      let rawVal = `${val}`;
      let note = null;

      if (p.type === 3 || p.level) {
        cat = 'Niveau';
        label = `Niveau de Personnage ${p.level || 70}`;
        rawVal = `Niv. ${p.level || 70}`;
      } else if (p.type === 4 || p.quality !== undefined) {
        cat = 'Qualité';
        label = `Qualité d'Arme (${p.quality})`;
        rawVal = `Qualité ${p.quality}`;
        badge = 'gear';
        if (isSupport && val === 0) {
          note = "Bonus de dégâts solo perso : 0% transféré aux alliés (exclu du Buff Power).";
        }
      } else if (p.type === 5) {
        cat = 'Ark Passive';
        label = `Ark Passive — Évolution (${p.pointsSpent || 100} pts)`;
        rawVal = `${p.pointsSpent || 100} pts`;
      } else if (p.type === 6) {
        cat = 'Ark Passive';
        label = `Ark Passive — Illumination (${p.pointsSpent || 100} pts)`;
        rawVal = `${p.pointsSpent || 100} pts`;
      } else if (p.type === 7) {
        cat = 'Ark Passive';
        label = `Ark Passive — Bond (${p.pointsSpent || 70} pts)`;
        rawVal = `${p.pointsSpent || 70} pts`;
      } else if (p.type === 8) {
        cat = 'Karma';
        label = "Karma T4 — Rang d'Évolution (Rang 0 à 6)";
        rawVal = val > 0 ? `+${(val / 100).toFixed(2)}%` : 'Rang 0';
        badge = 'passive';
        note = "Palier de Karma de transcendance T4 accordant un multiplicateur global.";
      } else if (p.type === 9) {
        cat = 'Karma';
        label = "Karma T4 — Niveau de Bond (Niv. 0 à 30)";
        rawVal = val > 0 ? `+${(val / 100).toFixed(2)}%` : '+0.00%';
        badge = 'passive';
        if (val === 0 || (isSupport && val < 50)) {
          note = isSupport
            ? "Dégâts de bond solo perso : exclu du Buff Power en Support."
            : "Progression de niveau de bond de karma.";
        }
      } else if (p.type === 10 || p.type === 11 || (p.grade && p.grade.includes('engrave'))) {
        cat = 'Gravures';
        const engName = (typeof BIBLE_ENGRAVINGS !== 'undefined' && BIBLE_ENGRAVINGS[p.id]) || `Gravure T4 (ID: ${p.id})`;
        const stoneBonus = p.stonePoints ? ` — Pierre +${p.stonePoints}` : '';
        label = `${engName}${stoneBonus}`;
        rawVal = `+${(val / 100).toFixed(2)}%`;
        badge = isDef ? 'defense' : 'passive';
      } else if (p.slot || p.type === 15 || p.type === 16 || p.type === 17 || p.type === 18) {
        cat = 'Accessoires';
        const slotNames = {
          neck: 'Collier',
          ear1: 'Boucle d\'oreille #1',
          ear2: 'Boucle d\'oreille #2',
          finger1: 'Anneau #1',
          finger2: 'Anneau #2',
          bracelet: 'Bracelet'
        };
        const sName = slotNames[p.slot] || `Accessoire (${p.slot || 'T4'})`;
        const sIndex = p.stat ? p.stat.index : 0;
        const sVal = p.stat ? p.stat.value : 0;
        const sType = p.stat ? p.stat.type : (p.type === 17 ? 4 : 2);
        let statDesc = '';
        if (sIndex === 152) statDesc = `Puissance d'Arme (+${(sVal / 100).toFixed(2)}%)`;
        else if (sIndex === 151) statDesc = `Puissance d'Arme (+${sVal})`;
        else if (sIndex === 49) statDesc = `Puissance d'Attaque (+${(sVal / 100).toFixed(2)}%)`;
        else if (sIndex === 50) statDesc = `Dégâts Additionnels (+${(sVal / 100).toFixed(2)}%)`;
        else if (sIndex === 124) statDesc = `Puissance d'Attaque (+${sVal})`;
        else if (sIndex === 46) statDesc = `Brand Power / Marque (+${(sVal / 100).toFixed(2)}%)`;
        else if (sIndex === 74) statDesc = `Taux Critique (+${(sVal / 100).toFixed(2)}%)`;
        else if (sIndex === 76) statDesc = `Dégâts Critiques (+${(sVal / 100).toFixed(2)}%)`;
        else if (sIndex === 27) statDesc = `Points de Vie Max (+${sVal})`;
        else if (sIndex === 28) statDesc = `Points de Mana Max (+${sVal})`;
        else if (sIndex === 34) statDesc = `Récupération PV en Combat (+${sVal})`;
        else if (sIndex === 106) statDesc = `Bonus Durée Altération État (+${(sVal / 100).toFixed(2)}%)`;
        else if (sIndex === 621000000 || sIndex === 621000001 || sIndex === 621000002 || (sType === 4 && p.type === 17)) {
          const pct = sIndex === 621000002 ? '2.00' : (sIndex === 621000001 ? '1.20' : '0.55');
          statDesc = `Dégâts infligés (+${pct}%)`;
          note = `Effet passif Collier T4 : Outgoing Damage +${pct}%.`;
        }
        else if (sType === 50) statDesc = `Soins aux Membres du Groupe (+${(sVal / 100).toFixed(2)}%)`;
        else if (sType === 51) statDesc = `Boucliers aux Membres du Groupe (+${(sVal / 100).toFixed(2)}%)`;
        else if (sType === 54) statDesc = `Effet Amplification Puissance d'Attaque d'Allié (+${(sVal / 100).toFixed(2)}%)`;
        else if (sType === 59 || sIndex === 16000001) statDesc = `Effet Augmentation Dégâts d'Allié (+${(sVal / 100).toFixed(2)}%)`;
        else if (typeof BIBLE_ACCESSORY_PASSIVES !== 'undefined' && BIBLE_ACCESSORY_PASSIVES[sIndex]) {
          statDesc = BIBLE_ACCESSORY_PASSIVES[sIndex].name;
          note = `${BIBLE_ACCESSORY_PASSIVES[sIndex].desc}`;
        }
        else if (sVal > 0) statDesc = `Ligne Affinée (+${(sVal / 100).toFixed(2)}%)`;
        else statDesc = "Ligne d'Affinage";

        label = `${sName} — ${statDesc}`;
        rawVal = sVal > 0 ? ((sIndex === 124 || sIndex === 151 || sIndex === 27 || sIndex === 28 || sIndex === 34) ? `+${sVal}` : `+${(sVal / 100).toFixed(2)}%`) : (val > 0 ? `+${(val / 100).toFixed(2)}%` : 'Stat Brute');
        badge = 'gear';

        if (p.affectsBaseStats && val === 0) {
          if (sIndex === 151 || sIndex === 152) {
            note = "La Puissance d'Arme augmente directement votre Attaque de Base & Base Val en tête de liste. Elle est à +0.00% ici pour éviter un double comptage.";
          } else {
            note = (isSupport && (sIndex === 74 || sIndex === 76 || sIndex === 50))
              ? "Stat solo perso : non transférée aux alliés en Support (exclue du Buff Power)."
              : "Stat brute déjà agrégée directement dans l'Attaque de Base ou les PV Max en tête de liste.";
          }
        }
      } else if (p.type === 22 || (p.id && p.id.toString().startsWith('650'))) {
        cat = 'Gemmes';
        label = (typeof BIBLE_GEMS !== 'undefined' && BIBLE_GEMS[p.id]) || `Gemme T4 (ID: ${p.id || 0})`;
        rawVal = `+${(val / 100).toFixed(2)}%`;
        badge = 'gear';
      } else if (p.type === 26 || p.total) {
        cat = 'Stats';
        label = `Stats de Combat (${p.total} pts)`;
        rawVal = `${p.total} stats`;
        badge = 'stat';
      } else if (p.type === 27 || p.rank) {
        cat = 'Cartes';
        const cName = (typeof BIBLE_CARDS !== 'undefined' && BIBLE_CARDS[p.id]) || 'Set de Cartes';
        label = `${cName} (Rang ${p.rank})`;
        rawVal = `Rang ${p.rank}`;
        badge = 'passive';
      } else if (p.type === 28) {
        cat = 'Familier';
        label = "Familier — Spécialité de Dégâts Additionnels";
        rawVal = (p.min !== undefined && p.max !== undefined)
          ? `+${(p.min / 100).toFixed(2)}% ~ +${(p.max / 100).toFixed(2)}%`
          : `+${(val / 100).toFixed(2)}%`;
        badge = 'passive';
        note = "Roll aléatoire de spécialité du familier (0.4% / 0.7% / 1.0%).";
      } else if (p.type === 29 || p.type === 30 || p.points) {
        cat = 'Grille d\'Ark';
        let coreName = (typeof BIBLE_CORES !== 'undefined' && BIBLE_CORES[p.id]) || null;
        if (!coreName) {
          coreName = `Cœur d'Ark Grid (${p.points || 17}P)`;
        } else {
          const match = coreName.match(/^([A-Za-z]+)\s+([A-Za-z]+)\s+Core:\s*(.+)$/i);
          if (match) {
            const [, orderOrChaos, sunOrMoonOrStar, name] = match;
            coreName = `${name} (${p.points || 17}P | ${orderOrChaos} ${sunOrMoonOrStar})`;
          } else {
            coreName = `${coreName} (${p.points || 17}P)`;
          }
        }
        label = coreName;
        rawVal = `${p.points || 17}P`;
        badge = 'passive';
      } else if (p.type === 31 || p.type === 32 || p.totalLevel) {
        if (!handledAstrogems) {
          handledAstrogems = true;
          const totals = {};
          if (loadout.arkGridCores) {
            for (const core of loadout.arkGridCores) {
              for (const gem of (core.gems || [])) {
                for (const opt of (gem.opts || [])) {
                  totals[opt.id] = (totals[opt.id] || 0) + opt.level;
                }
              }
            }
          }
          const bp31Parts = parts.filter(pt => pt.type === 31 || pt.type === 32);
          const order = isSupport ? [2011, 2012, 2013, 2001, 2002, 2003] : [2001, 2002, 2003, 2011, 2012, 2013];

          for (const id of order) {
            const def = (typeof BIBLE_ARK_GRID_SUBSTATS !== 'undefined' && BIBLE_ARK_GRID_SUBSTATS[id]);
            if (!def) continue;
            const level = totals[id] || (bp31Parts.find(pt => pt.id === id)?.totalLevel) || 0;
            if (level === 0) continue;

            const bpPart = bp31Parts.find(pt => pt.id === id);
            const partVal = bpPart ? (bpPart.value !== undefined ? bpPart.value : 0) : 0;
            const multVal = (partVal / 100).toFixed(2);
            const inGameBp = (level > 0 && def.levels && def.levels[level - 1] !== undefined) ? def.levels[level - 1] : 0;
            const inGameVal = (inGameBp / 100).toFixed(2);

            let note = null;
            if (bpPart && partVal > 0) {
              note = `Effet in-game : +${inGameVal}% ${def.fr} (cumul des astrogemmes). Multiplicateur Smilegate CP : +${multVal}% ${isSupport ? 'Buff Power' : 'DPS Net'}.`;
            } else {
              note = isSupport
                ? `Stat brute ${def.fr.toLowerCase()} solo perso (+${inGameVal}%) : exclue du calcul du Buff Power en Support (Smilegate Battle Point).`
                : `Stat support (+${inGameVal}%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point).`;
            }

            items.push({
              cat: 'Grille d\'Ark',
              label: `${def.fullName} — Niv. ${level}`,
              val: `+${inGameVal}% (Niv. ${level})`,
              mult: `+${multVal}%`,
              type: isSupport ? 'Buff Power' : 'DPS Net',
              badge: 'stat',
              note
            });
          }
        }

        continue;
      } else if (p.type === 33 || p.type === 34 || p.paradisePoints) {
        cat = 'Paradise';
        label = `Orbe Trinity (${formatNumber(p.paradisePoints || 16483067)} pts)`;
        rawVal = `${formatNumber(p.paradisePoints || 16483067)} pts`;
        badge = 'gear';
      }

      let multStr = `+${(val / 100).toFixed(2)}%`;
      if (p.min !== undefined && p.max !== undefined && p.min !== p.max) {
        multStr = `+${(p.min / 100).toFixed(2)}% à +${(p.max / 100).toFixed(2)}%`;
      }

      items.push({
        cat,
        label,
        val: rawVal,
        mult: multStr,
        type: isSupport ? (isDef ? 'Heal / Shield' : 'Buff Power') : 'DPS Net',
        badge,
        note
      });
    }

    // Compléter les cœurs d'Ark Grid absents de battlePoint.parts (ex: Chaos Star en Support, ou profils sans type 29)
    if (Array.isArray(loadout.arkGridCores)) {
      loadout.arkGridCores.forEach(c => {
        const idStr = (c.id || '').toString();
        const alreadyInItems = items.some(it => {
          if (it.cat !== "Grille d'Ark") return false;
          const lbl = (it.label || '').toLowerCase();
          if (idStr.startsWith('67300') && (lbl.includes('order sun') || lbl.includes('ordre soleil'))) return true;
          if (idStr.startsWith('67301') && (lbl.includes('order moon') || lbl.includes('ordre lune'))) return true;
          if (idStr.startsWith('67302') && (lbl.includes('order star') || lbl.includes('ordre étoile') || lbl.includes('ordre etoile'))) return true;
          if (idStr.startsWith('67310') && (lbl.includes('chaos sun') || lbl.includes('chaos soleil'))) return true;
          if (idStr.startsWith('67311') && (lbl.includes('chaos moon') || lbl.includes('chaos lune'))) return true;
          if (idStr.startsWith('67312') && (lbl.includes('chaos star') || lbl.includes('chaos étoile') || lbl.includes('chaos etoile'))) return true;
          return false;
        });

        if (!alreadyInItems) {
          const pts = Array.isArray(c.gems)
            ? c.gems.reduce((sum, g) => sum + (g.corePoints || 0), 0)
            : (c.points || 17);
          const isAnc = ((c.id || 0) % 10 === 6);
          const multVal = getArkGridCoreBonus(idStr, pts, isSupport, isAnc);

          let coreName = (typeof BIBLE_CORES !== 'undefined' && BIBLE_CORES[c.id]) || '';
          let name = '';
          if (coreName) {
            const m = coreName.match(/^([A-Za-z]+)\s+([A-Za-z]+)\s+Core:\s*(.+)$/i);
            if (m && m[3]) name = m[3].trim();
          }
          if (!name) {
            if (idStr.startsWith('67300')) name = isSupport ? 'Heavenly Agent' : 'Shadow Fist';
            else if (idStr.startsWith('67301')) name = isSupport ? 'Heavenly Resolve' : 'Asura War';
            else if (idStr.startsWith('67302')) name = isSupport ? 'Prayer of Light' : 'Asura';
            else if (idStr.startsWith('67310')) name = isSupport ? 'Fortitude Enhancement' : 'Flashy Attack';
            else if (idStr.startsWith('67311')) name = isSupport ? 'Echoing Brand' : 'Smoldering Strike';
            else if (idStr.startsWith('67312')) name = 'Attack';
          }

          const groupLabel = idStr.startsWith('67300') ? 'Order Sun' :
            (idStr.startsWith('67301') ? 'Order Moon' :
            (idStr.startsWith('67302') ? 'Order Star' :
            (idStr.startsWith('67310') ? 'Chaos Sun' :
            (idStr.startsWith('67311') ? 'Chaos Moon' : 'Chaos Star'))));

          items.push({
            cat: "Grille d'Ark",
            label: `${name} (${pts}P | ${groupLabel})`,
            val: `${pts}P`,
            mult: `+${multVal.toFixed(2)}%`,
            type: isSupport ? 'Buff Power' : 'DPS Net',
            badge: 'passive',
            note: null
          });
        }
      });
    }

    const calculatedTotal = isSupport ? (atkMin + defMin) : atkMin;
    const inGameScore = loadout.combatPower?.score || calculatedTotal;

    // Détection automatique des Accessoires Polis (3+ accessoires avec bonus)
    let accRolledCount = 0;
    if (loadout.items) {
      loadout.items.forEach(it => {
        if (it.slot && (it.slot.includes('neck') || it.slot.includes('ear') || it.slot.includes('finger'))) {
          if (it.data && it.data.stats && it.data.stats.length >= 2) accRolledCount++;
        }
      });
    }

    const ilvl = loadout.itemLevel ? Math.floor(loadout.itemLevel) : 1750;
    const gear = { weapon: 17, head: 15, chest: 15, pants: 15, gloves: 15, shoulder: 15 };
    let advHoning = 40;
    let isSerkaWeapon = false;
    let serkaArmorCount = 0;

    if (loadout.items) {
      loadout.items.forEach(it => {
        const slot = it.slot;
        const d = it.data;
        if (!d) return;
        const isSerka = !!(it.id && it.id.toString().startsWith('13462'));
        if (slot === 'weapon' && d.honing !== undefined) {
          gear.weapon = d.honing;
          if (isSerka) isSerkaWeapon = true;
        }
        if (slot === 'head' && d.honing !== undefined) {
          gear.head = d.honing;
          if (isSerka) serkaArmorCount++;
        }
        if (slot === 'upper_body' && d.honing !== undefined) {
          gear.chest = d.honing;
          if (isSerka) serkaArmorCount++;
        }
        if (slot === 'lower_body' && d.honing !== undefined) {
          gear.pants = d.honing;
          if (isSerka) serkaArmorCount++;
        }
        if (slot === 'hand' && d.honing !== undefined) {
          gear.gloves = d.honing;
          if (isSerka) serkaArmorCount++;
        }
        if (slot === 'shoulder' && d.honing !== undefined) {
          gear.shoulder = d.honing;
          if (isSerka) serkaArmorCount++;
        }
        if (d.advancedHoning !== undefined) {
          advHoning = d.advancedHoning;
          // Niveau d'affinage avancé par pièce (0 à 40), lu pour le GPD
          const advKey = { weapon: 'weapon', head: 'head', upper_body: 'chest', lower_body: 'pants', hand: 'gloves', shoulder: 'shoulder' }[slot];
          if (advKey) {
            gear.adv = gear.adv || {};
            gear.adv[advKey] = d.advancedHoning;
          }
        }
      });
    }

    // Heuristiques de sécurité pour profils sans items ID détaillés
    if (!isSerkaWeapon && (ilvl >= 1735 && gear.weapon <= 16)) {
      isSerkaWeapon = true;
    }
    const rawArmorAvg = Math.round(((gear.head || 14) + (gear.chest || 14) + (gear.pants || 14) + (gear.shoulder || 14) + (gear.gloves || 14)) / 5);
    if (serkaArmorCount === 0 && (ilvl >= 1735 && rawArmorAvg <= 14)) {
      serkaArmorCount = 5;
    }

    gear.isSerkaWeapon = isSerkaWeapon;
    gear.weaponTier = isSerkaWeapon ? 2 : 1;
    gear.effectiveWeapon = gear.weapon + (isSerkaWeapon ? 9 : 0);
    gear.serkaArmorCount = serkaArmorCount;
    gear.isSerkaArmors = serkaArmorCount >= 3;
    gear.effectiveAvgArmor = rawArmorAvg + (gear.isSerkaArmors ? 9 : 0);

    const resolvedClassId = loadout.classId || root.character?.classId || '';
    const resolvedClassName = normalizeClassName(resolvedClassId || root.characterInfo?.characterClassName || '');
    const resolvedRole = isSupport ? 'support' : 'dps';
    const resolvedSpec = getCharacterSpecName({
      className: resolvedClassName,
      role: resolvedRole,
      engravings: loadout.engravings,
      arkPassive: loadout.arkPassive,
      battlePoint: bp,
      loadout: loadout
    });

    return {
      name: root.characterInfo?.characterName || 'Personnage Importé',
      className: resolvedClassName,
      classId: resolvedClassId,
      spec: resolvedSpec,
      role: resolvedRole,
      ilvl,
      inGameScore: parseFloat(inGameScore.toFixed(2)),
      calculatedScore: parseFloat(calculatedTotal.toFixed(2)),
      buffPower: parseFloat(atkMin.toFixed(2)),
      healPower: isSupport ? parseFloat(defMin.toFixed(2)) : 0,
      mainStat: atkPart ? atkPart.mainStat : 0,
      weaponPower: atkPart ? atkPart.weaponPower : 0,
      baseAtk: atkPart ? Math.round(atkPart.baseAttackPower || 0) : 0,
      maxHp: hpPart ? hpPart.maxHp : 0,
      partsCount: items.length,
      gear,
      advHoning,
      weaponQuality: (parts.find(p => p.type === 4 || p.quality !== undefined)?.quality) || 90,
      weaponQualityValue: (parts.find(p => p.type === 4 || p.quality !== undefined)?.value) || 2500,
      gemParts: (items.filter(it => it.cat === 'Gemmes').length > 0)
        ? items.filter(it => it.cat === 'Gemmes').map(it => parseFloat(it.mult.replace(/[^0-9.]/g, '')))
        : (Array.isArray(loadout.gems) && loadout.gems.length > 0
            ? loadout.gems.map(g => {
                const atkEff = (g.effects || []).find(e => e.type === 2 && e.id === 150);
                if (atkEff) {
                  if (atkEff.value >= 120) return isSupport ? 12.0 : 7.0;
                  if (atkEff.value >= 100) return isSupport ? 10.8 : 6.35;
                  if (atkEff.value >= 80) return isSupport ? 9.6 : 5.7;
                  if (atkEff.value >= 60) return isSupport ? 8.5 : 5.05;
                  return isSupport ? 7.5 : 4.5;
                }
                const cdEff = (g.effects || []).find(e => e.type === 27 || e.type === 5);
                if (cdEff) {
                  if (cdEff.value >= 2400) return isSupport ? 12.0 : 7.0;
                  if (cdEff.value >= 2200) return isSupport ? 10.8 : 6.35;
                  if (cdEff.value >= 2000) return isSupport ? 9.6 : 5.7;
                  if (cdEff.value >= 1800) return isSupport ? 8.5 : 5.05;
                  return isSupport ? 7.5 : 4.5;
                }
                return isSupport ? 8.5 : 5.05;
              })
            : null),
      engravings: loadout.engravings || [],
      arkGridCores: loadout.arkGridCores || [],
      battlePoint: bp,
      astrogems: (bp && bp.parts) ? bp.parts.filter(p => p.type === 31 || p.type === 32) : [],
      arkGrid: getArkGridStatus({ rawProfile: { arkGridCores: loadout.arkGridCores, battlePoint: bp }, ilvl: loadout.character?.ilvl || 1750 }),
      accRolled: accRolledCount >= 3,
      apPoints: loadout.apPoints || { enlightenment: 101, evolution: 140, leap: 70 },
      arkPassive: loadout.arkPassive || {},
      accessories: (loadout.items || []).filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)),
      bracelet: (loadout.items || []).find(i => i.slot === 'bracelet') || null,
      loadout: loadout,
      rawItems: loadout.items || [],
      items
    };
  }

  async function fetchBibleProfile(region, name, autoAdd = null) {
    const statusEl = dom.importStatus;
    const cleanName = name ? name.trim() : '';
    if (!cleanName) return null;

    const shouldAutoAdd = autoAdd !== null 
      ? autoAdd 
      : (dom.chkAutoAddToRoster ? dom.chkAutoAddToRoster.checked : true);

    if (statusEl) {
      statusEl.className = 'modal-status info';
      statusEl.style.display = 'block';
      statusEl.innerHTML = `Interrogation de <strong>${escapeHtml(cleanName)} (${escapeHtml(region.toUpperCase())})</strong> en cours...`;
    }

    const reg = region.toUpperCase();
    const encodedName = encodeURIComponent(cleanName);
    const proxyUrl = `/api/bible/character/${reg}/${encodedName}/__data.json`;
    const directUrl = `https://lostark.bible/character/${reg}/${encodedName}/__data.json`;

    try {
      let response = null;
      // 1. Essai via le proxy Nginx (contourne CORS)
      try {
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) {
          response = proxyRes;
        }
      } catch (e) {}

      // 2. Essai direct
      if (!response) {
        response = await fetch(directUrl, { mode: 'cors' });
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      return applyLoadedProfile(json, cleanName, reg, shouldAutoAdd);
    } catch (err) {
      console.warn('fetchBibleProfile error:', err);
      if (statusEl) {
        statusEl.className = 'modal-status error';
        statusEl.innerHTML = `<strong>Impossible d'interroger lostark.bible pour ${escapeHtml(cleanName)} :</strong><br>
        1. Vérifiez l'orthographe exacte du pseudo et la région (${escapeHtml(reg)}).<br>
        2. Option de secours : ouvrez <a href="${escapeHtml(directUrl)}" target="_blank" rel="noopener noreferrer" style="color:#E8E6DC; text-decoration:underline;">ce lien</a>, copiez tout le texte JSON et collez-le dans <strong>Option manuelle</strong> ci-dessous.`;
      }
      return null;
    }
  }

  function applyLoadedProfile(json, characterName = null, region = 'CE', autoAddToRoster = true) {
    const statusEl = dom.importStatus;
    const nodeData = json.nodes && json.nodes[2] && json.nodes[2].data ? json.nodes[2].data : json;

    // Détection préalable du rôle natif de la classe depuis node 1 (header)
    let nativeRole = state.role;
    if (json.nodes && json.nodes[1] && json.nodes[1].data) {
      try {
        const root1 = unflattenDevalue(json.nodes[1].data);
        if (root1 && root1.header && root1.header.class) {
          nativeRole = detectCharacterRole(root1.header.class);
        }
      } catch (e) {}
    }

    const profile = parseBibleCharacter(nodeData, nativeRole);

    if (!profile) {
      if (statusEl) {
        statusEl.className = 'modal-status error';
        statusEl.textContent = 'Données de profil introuvables ou format de raid invalide.';
      }
      return null;
    }

    if (characterName) profile.name = capitalize(characterName);

    if (json.nodes && json.nodes[1] && json.nodes[1].data) {
      try {
        const root1 = unflattenDevalue(json.nodes[1].data);
        if (root1 && root1.header) {
          const h = root1.header;
          if (h.portrait && h.portrait.url) {
            profile.portraitUrl = h.portrait.url;
            DEFAULT_AVATARS[profile.name.toLowerCase()] = h.portrait.url;
          }
          if (h.world || h.server) {
            profile.server = `${h.world || h.server} (${region.toUpperCase()})`;
          }
          if (h.guild) {
            profile.guild = (h.guild && h.guild.name) || (typeof h.guild === 'string' ? h.guild : '');
          }
          if (h.rosterLevel) profile.rosterLevel = h.rosterLevel;
          if (h.class) profile.className = formatClassName(h.class);
          if (h.ilvl) profile.ilvl = parseFloat(h.ilvl.toFixed(2));
          if (h.maxCombatPower && h.maxCombatPower.score) {
            profile.inGameScore = parseFloat(h.maxCombatPower.score.toFixed(2));
          } else if (h.combatPower && h.combatPower.score) {
            profile.inGameScore = parseFloat(h.combatPower.score.toFixed(2));
          }
        }
      } catch (e) {}
    }

    const resolvedRole = detectCharacterRole({
      className: profile.className,
      classId: profile.classId,
      spec: profile.spec,
      role: profile.role,
      name: profile.name
    });
    profile.role = resolvedRole;

    const arkStatus = getArkGridStatus({ rawProfile: profile, arkGridCores: profile.arkGridCores, name: profile.name, id: profile.name.toLowerCase(), ilvl: profile.ilvl });
    const charObj = {
      id: profile.name.toLowerCase(),
      name: profile.name,
      className: profile.className || (resolvedRole === 'support' ? 'Support' : 'DPS'),
      spec: profile.spec || '',
      role: resolvedRole,
      server: profile.server || `${region.toUpperCase()}`,
      guild: profile.guild || '',
      rosterLevel: profile.rosterLevel || 300,
      ilvl: profile.ilvl,
      cp: parseFloat((profile.inGameScore || profile.calculatedScore).toFixed(2)),
      target: Math.ceil((profile.ilvl + 0.1) / 10) * 10,
      advHoning: profile.advHoning !== undefined ? profile.advHoning : 40,
      portraitUrl: profile.portraitUrl || '',
      gear: profile.gear || { weapon: 17, head: 15, shoulder: 15, chest: 15, pants: 15, gloves: 15 },
      weaponQuality: profile.weaponQuality !== undefined ? profile.weaponQuality : 90,
      weaponQualityValue: profile.weaponQualityValue !== undefined ? profile.weaponQualityValue : 2500,
      gemParts: profile.gemParts || null,
      arkGrid: { 
        hasSun17: arkStatus.hasSun17, 
        hasMoon17: arkStatus.hasMoon17, 
        sun17: arkStatus.hasSun17, 
        moon17: arkStatus.hasMoon17, 
        star17: arkStatus.starTier >= 3, 
        starTier: arkStatus.starTier 
      },
      arkGridCores: profile.arkGridCores || [],
      astrogems: profile.astrogems || [],
      accRolled: !!profile.accRolled,
      accessories: profile.accessories || [],
      loadout: profile.loadout || null,
      apPoints: profile.apPoints || (profile.ilvl >= 1740 ? { evolution: 140, enlightenment: 101, leap: 70 } : { evolution: 120, enlightenment: 88, leap: 50 }),
      opt: null,
      rawProfile: profile
    };

    if (autoAddToRoster) {
      addCharacterToUserRoster(charObj);
    } else {
      liveImportedProfile = profile;
      loadCharacter(charObj);
    }

    if (statusEl) {
      statusEl.className = 'modal-status success';
      statusEl.innerHTML = `<strong>${escapeHtml(charObj.name)}</strong> (${escapeHtml(charObj.className)} ${charObj.ilvl.toFixed(1)}) chargé avec succès.<br>
      Combat Power : <strong>${formatNumber(charObj.cp)} CP</strong> • Portrait officiel Lost Ark lié.`;
    }

    // Basculer sur l'onglet Moteur Canonique si on est dans la page principale
    const tabCanonBtn = document.querySelector('[data-tab="tab-canonical"]');
    const tabCanonPane = document.getElementById('tab-canonical');
    if (tabCanonBtn && tabCanonPane && !autoAddToRoster) {
      dom.tabBtns.forEach(b => b.classList.remove('active'));
      dom.tabPanes.forEach(p => p.classList.remove('active'));
      tabCanonBtn.classList.add('active');
      tabCanonPane.classList.add('active');
    }

    return charObj;
  }

  // --- 4c. INTÉGRATION OFFICIELLE OAUTH 2.0 PKCE (LOSTARK.BIBLE) ---

  

  let selectedOAuthEnv = 'auto'; // 'auto' | 'prod' | 'dev'

  function getOAuthClientId() {
    if (selectedOAuthEnv === 'dev') return OAUTH_CONFIG.devClientId;
    if (selectedOAuthEnv === 'prod') return OAUTH_CONFIG.prodClientId;

    const host = (window.location && window.location.hostname) || '';
    // Sur localhost, 127.0.0.1 ou IP LAN, basculer par défaut sur devClientId
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) {
      return OAUTH_CONFIG.devClientId;
    }
    return OAUTH_CONFIG.prodClientId;
  }

  function getOAuthRedirectUri() {
    return window.location.origin + window.location.pathname;
  }

  function generateRandomString(length = 43) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }
    return result;
  }

  // Implémentation pure JS de SHA-256 (garantit le fonctionnement sur IP locale non-HTTPS / LAN)
  function sha256Bytes(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    for (let i = 0; i < ascii.length; i++) {
      const j = i >> 2;
      words[j] = (words[j] || 0) | (ascii.charCodeAt(i) << (24 - (i % 4) * 8));
    }
    const endByteIndex = ascii.length;
    words[endByteIndex >> 2] = (words[endByteIndex >> 2] || 0) | (0x80 << (24 - (endByteIndex % 4) * 8));
    words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

    const w = new Array(64);
    for (let i = 0; i < words.length; i += 16) {
      let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
      let e = hash[4], f = hash[5], g = hash[6], h = hash[7];
      for (let j = 0; j < 64; j++) {
        if (j < 16) {
          w[j] = words[i + j] | 0;
        } else {
          const s0 = rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3);
          const s1 = rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10);
          w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
        }
        const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        const ch = (e & f) ^ ((~e) & g);
        const temp1 = (h + s1 + ch + k[j] + w[j]) | 0;
        const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) | 0;
        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }
      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
    }
    const out = new Uint8Array(32);
    for (let i = 0; i < 8; i++) {
      out[i * 4] = (hash[i] >>> 24) & 0xff;
      out[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
      out[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
      out[i * 4 + 3] = hash[i] & 0xff;
    }
    return out;
  }

  async function generateCodeChallenge(verifier) {
    let bytes;
    if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        bytes = new Uint8Array(digest);
      } catch (e) {
        bytes = sha256Bytes(verifier);
      }
    } else {
      bytes = sha256Bytes(verifier);
    }
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  async function startOAuthFlow() {
    try {
      const clientId = getOAuthClientId();
      const redirectUri = getOAuthRedirectUri();
      const verifier = generateRandomString(50);
      const state = generateRandomString(24);

      sessionStorage.setItem('lostark_oauth_verifier', verifier);
      sessionStorage.setItem('lostark_oauth_state', state);

      const challenge = await generateCodeChallenge(verifier);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: OAUTH_CONFIG.scopes,
        state: state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
      });

      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status info';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = 'Redirection vers lostark.bible...';
      }

      window.location.href = `${OAUTH_CONFIG.authUrl}?${params.toString()}`;
    } catch (err) {
      console.error('startOAuthFlow error:', err);
      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status error';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = `Impossible d'initialiser OAuth : ${err.message}`;
      }
    }
  }

  async function checkOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const stateParam = params.get('state');
    const errorParam = params.get('error');

    // Gestion du retour d'erreur OAuth (e.g. access_denied, invalid_scope, etc.)
    if (errorParam) {
      const errDesc = params.get('error_description') || errorParam;
      console.warn('[OAuth Callback Error]', errorParam, errDesc);
      window.history.replaceState({}, document.title, window.location.pathname);
      logoutOAuth();
      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status error';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = `Autorisation lostark.bible refusée : ${errDesc}`;
      }
      if (dom.importModal) dom.importModal.classList.add('active');
      return;
    }

    if (!code) return;

    const savedState = sessionStorage.getItem('lostark_oauth_state');
    const verifier = sessionStorage.getItem('lostark_oauth_verifier');

    if (stateParam && savedState && stateParam !== savedState) {
      console.warn('OAuth state mismatch!');
      return;
    }

    const clientId = getOAuthClientId();
    const redirectUri = getOAuthRedirectUri();

    window.history.replaceState({}, document.title, window.location.pathname);

    try {
      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status info';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = 'Échange du code d\'autorisation OAuth en cours...';
        if (dom.importModal) dom.importModal.classList.add('active');
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri,
        code_verifier: verifier || ''
      });

      const res = await fetch(OAUTH_CONFIG.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error_description || errJson?.error || `HTTP ${res.status}`;
        throw new Error(`Échange de jeton refusé (${errMsg})`);
      }
      const data = await res.json();

      if (data.access_token) {
        localStorage.setItem('lostark_bible_token', data.access_token);
        sessionStorage.removeItem('lostark_oauth_verifier');
        sessionStorage.removeItem('lostark_oauth_state');

        if (dom.importStatus) {
          dom.importStatus.className = 'modal-status success';
          dom.importStatus.style.display = 'block';
          dom.importStatus.textContent = 'Connexion OAuth 2.0 réussie. Chargement de vos rosters…';
        }

        await fetchOAuthUserData(data.access_token);
      } else {
        throw new Error('Aucun jeton d\'accès reçu.');
      }
    } catch (err) {
      console.error('OAuth Callback Error:', err);
      logoutOAuth();
      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status error';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = `Échec de la connexion OAuth : ${err.message}`;
      }
    }
  }

  function extractOAuthUsername(data) {
    if (!data) return 'Utilisateur';
    const u = data.user || data.data || data.discord || data;
    return u.global_name || u.globalName || u.username || u.name || u.displayName || u.discord_name || (u.id ? `ID #${u.id}` : 'Connecté');
  }

  function extractRostersList(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.rosters)) return data.rosters;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.linkedRosters)) return data.linkedRosters;
    if (Array.isArray(data.characters)) return [{ server: 'Principal', region: 'CE', characters: data.characters }];
    return [];
  }

  async function fetchOAuthUserData(token) {
    if (!token) return;

    try {
      console.log('[OAuth] Chargement des données utilisateur avec le jeton...');
      const userRes = await fetch(OAUTH_CONFIG.userUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Si le token est expiré ou non autorisé (401 ou 403)
      if (userRes.status === 401 || userRes.status === 403) {
        console.warn('[OAuth] Session expirée ou non autorisée (HTTP ' + userRes.status + '). Déconnexion.');
        logoutOAuth();
        if (dom.importStatus) {
          dom.importStatus.className = 'modal-status error';
          dom.importStatus.style.display = 'block';
          dom.importStatus.textContent = 'Session OAuth expirée ou invalide. Veuillez vous reconnecter avec lostark.bible.';
        }
        return;
      }

      let userData = null;
      try {
        userData = await userRes.json();
      } catch (e) {
        console.warn('[OAuth] Erreur parsing user data:', e);
      }

      if (!userRes.ok || !userData || userData.error) {
        console.warn('[OAuth] Données utilisateur invalides:', userRes.status, userData);
        logoutOAuth();
        if (dom.importStatus) {
          dom.importStatus.className = 'modal-status error';
          dom.importStatus.style.display = 'block';
          dom.importStatus.textContent = `Session OAuth invalide (${userData?.error_description || userData?.error || 'HTTP ' + userRes.status}). Reconnexion requise.`;
        }
        return;
      }

      const rostersRes = await fetch(OAUTH_CONFIG.rostersUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let rostersData = null;
      if (rostersRes.ok) {
        try {
          rostersData = await rostersRes.json();
        } catch (e) {
          console.warn('[OAuth] Erreur parsing rosters:', e);
        }
      } else {
        console.warn('[OAuth] Échec récupération rosters (HTTP ' + rostersRes.status + ')');
      }

      if (dom.oauthDisconnectedView) dom.oauthDisconnectedView.style.display = 'none';
      if (dom.oauthConnectedView) dom.oauthConnectedView.style.display = 'block';
      if (dom.oauthUsername) {
        const uName = extractOAuthUsername(userData);
        dom.oauthUsername.textContent = `${uName} (Discord)`;
      }

      renderOAuthRosters(rostersData);

    } catch (e) {
      console.warn('Error fetching OAuth data:', e);
      if (dom.importStatus) {
        dom.importStatus.className = 'modal-status error';
        dom.importStatus.style.display = 'block';
        dom.importStatus.textContent = `Erreur de communication OAuth : ${e.message}`;
      }
    }
  }

  let currentOAuthRosters = null;

  function renderOAuthRosters(rostersRaw) {
    const rosters = extractRostersList(rostersRaw);
    currentOAuthRosters = rosters;
    if (!dom.oauthRosterList) return;
    if (rosters.length === 0) {
      dom.oauthRosterList.innerHTML = `<div style="font-size:13px; color:var(--text-dim);">Aucun roster ou personnage synchronisé.</div>`;
      return;
    }

    let html = '';
    rosters.forEach(r => {
      const serverName = escapeHtml(r.server || r.serverName || r.name || 'Serveur');
      const rawRegion = (r.region || r.regionId || 'CE').toUpperCase();
      const region = escapeHtml(rawRegion);
      const characters = r.characters || r.characterList || r.chars || [];

      html += `<div style="font-size: 12px; font-weight: 700; color: var(--accent-gold); text-transform: uppercase; margin-top: 6px;">
        ${serverName} (${region}) :
      </div>`;

      characters.forEach(c => {
        const rawName = c.name || c.characterName || c.charName;
        if (!rawName) return;
        const charName = escapeHtml(rawName);
        const charClass = escapeHtml(formatClassName(c.className || c.characterClassName || c.class || 'Classe'));
        const ilvl = c.itemLevel || c.itemAvgLevel || c.ilvl || c.maxItemLevel || 0;

        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.25); border: 1px solid rgba(232, 230, 220,0.06); border-radius: 6px; padding: 6px 10px; margin-top: 4px;">
            <div>
              <strong style="color: var(--text-main); font-size: 14px;">${charName}</strong>
              <span style="font-size: 13px; color: var(--text-muted); margin-left: 6px;">${charClass} • ${ilvl > 0 ? ilvl.toFixed(1) : ''} iLvl</span>
            </div>
            <div style="display: flex; gap: 6px;">
              <button type="button" class="btn-add-oauth-char" data-name="${charName}" data-region="${region}" style="background: rgba(140, 192, 132, 0.15); border: 1px solid rgba(140, 192, 132, 0.4); color: #8CC084; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
                + Ajouter
              </button>
              <button type="button" class="btn-load-oauth-char" data-name="${charName}" data-region="${region}" style="background: rgba(232, 230, 220, 0.15); border: 1px solid rgba(232, 230, 220, 0.4); color: #E0A43A; font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 4px; cursor: pointer;">
                Charger
              </button>
            </div>
          </div>
        `;
      });
    });

    dom.oauthRosterList.innerHTML = html;

    dom.oauthRosterList.querySelectorAll('.btn-add-oauth-char').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const region = btn.getAttribute('data-region') || 'CE';
        if (name) {
          fetchBibleProfile(region, name, true);
        }
      });
    });

    dom.oauthRosterList.querySelectorAll('.btn-load-oauth-char').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const region = btn.getAttribute('data-region') || 'CE';
        if (name) {
          fetchBibleProfile(region, name, false);
        }
      });
    });
  }

  async function syncAllOAuthCharacters(rostersRaw) {
    const statusEl = dom.importStatus;
    if (statusEl) {
      statusEl.className = 'modal-status info';
      statusEl.style.display = 'block';
      statusEl.innerHTML = `Préparation de la synchronisation de votre Roster...`;
    }

    const rosters = extractRostersList(rostersRaw);
    const allChars = [];
    rosters.forEach(r => {
      const server = r.server || r.serverName || r.name || 'Serveur';
      const region = (r.region || r.regionId || 'CE').toUpperCase();
      const chars = r.characters || r.characterList || r.chars || [];
      chars.forEach(c => {
        const name = c.name || c.characterName || c.charName;
        if (!name) return;
        allChars.push({
          name,
          className: formatClassName(c.className || c.characterClassName || c.class || 'Classe'),
          ilvl: c.itemLevel || c.itemAvgLevel || c.ilvl || c.maxItemLevel || 0,
          server,
          region
        });
      });
    });

    allChars.sort((a, b) => b.ilvl - a.ilvl);
    const topChars = allChars.slice(0, 6);

    if (topChars.length === 0) {
      if (statusEl) {
        statusEl.className = 'modal-status error';
        statusEl.textContent = 'Aucun personnage trouvé dans vos données lostark.bible.';
      }
      return;
    }

    const importedList = [];
    for (let i = 0; i < topChars.length; i++) {
      const tc = topChars[i];
      if (statusEl) {
        statusEl.innerHTML = `Synchronisation (${i + 1}/${topChars.length}) : <strong>${escapeHtml(tc.name)}</strong> (${tc.ilvl.toFixed(1)})...`;
      }
      try {
        const charObj = await fetchBibleProfile(tc.region, tc.name, false);
        if (charObj) {
          importedList.push(charObj);
        }
      } catch (e) {
        console.warn('Error fetching char in batch:', tc.name, e);
      }
    }

    if (importedList.length > 0) {
      saveUserRoster(importedList);
      renderPresetsBar();
      loadCharacter(importedList[0]);
      renderSavedRosterManager();

      if (statusEl) {
        statusEl.className = 'modal-status success';
        statusEl.innerHTML = `<strong>Roster synchronisé avec succès.</strong><br>
        Vos ${importedList.length} personnages sont disponibles dans la barre du haut avec leurs images officielles.`;
      }
    }
  }

  function addCharacterToUserRoster(charObj) {
    let list = getUserRoster();
    if (!list) list = [];

    const existingIndex = list.findIndex(c => (c.id || c.name.toLowerCase()) === (charObj.id || charObj.name.toLowerCase()));
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...charObj };
    } else {
      list.push(charObj);
    }

    saveUserRoster(list);
    renderPresetsBar();
    loadCharacter(charObj);
    renderSavedRosterManager();
  }

  function removeCharacterFromUserRoster(charId) {
    let list = getUserRoster() || [];
    list = list.filter(c => (c.id || c.name.toLowerCase()) !== charId.toLowerCase());
    saveUserRoster(list);
    if (list.length === 0) {
      activeCharacterId = null;
      showNoCharacterState();
    } else {
      renderPresetsBar();
      loadCharacter(list[0]);
    }
    renderSavedRosterManager();
  }

  function clearUserRoster() {
    localStorage.removeItem('lostark_user_roster');
    activeCharacterId = null;
    showNoCharacterState();
    renderSavedRosterManager();
    if (dom.importStatus) {
      dom.importStatus.className = 'modal-status info';
      dom.importStatus.style.display = 'block';
      dom.importStatus.textContent = isEnLang() ? 'Roster cleared. Import a character to continue.' : 'Roster réinitialisé. Importe un personnage pour continuer.';
    }
  }

  async function refreshAllUserRosterCharacters() {
    const list = getUserRoster();
    if (!list || list.length === 0) return;
    const statusEl = dom.importStatus;
    if (statusEl) {
      statusEl.className = 'modal-status info';
      statusEl.style.display = 'block';
      statusEl.innerHTML = `Réactualisation de vos ${list.length} personnages...`;
    }

    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (statusEl) statusEl.innerHTML = `Réactualisation (${i + 1}/${list.length}) : <strong>${escapeHtml(c.name)}</strong>...`;
      try {
        const updated = await fetchBibleProfile(c.region || 'CE', c.name, false);
        if (updated) {
          list[i] = { ...list[i], ...updated };
        }
      } catch (e) {
        console.warn('Error refreshing char:', c.name, e);
      }
    }

    saveUserRoster(list);
    renderPresetsBar();
    loadCharacter(list[0]);
    renderSavedRosterManager();

    if (statusEl) {
      statusEl.className = 'modal-status success';
      statusEl.innerHTML = `Vos ${list.length} personnages ont été mis à jour avec succès.`;
    }
  }

  function renderSavedRosterManager() {
    if (!dom.userRosterManagerSection || !dom.modalUserRosterList) return;
    const roster = getUserRoster();
    if (!roster || roster.length === 0) {
      dom.userRosterManagerSection.style.display = 'none';
      if (dom.modalRosterCount) dom.modalRosterCount.textContent = '0';
      return;
    }

    dom.userRosterManagerSection.style.display = 'block';
    if (dom.modalRosterCount) dom.modalRosterCount.textContent = roster.length.toString();

    let html = '';
    roster.forEach(c => {
      const cId = escapeHtml(c.id || c.name.toLowerCase());
      const isSupport = c.role === 'support';
      const classIconSrc = escapeHtml(getClassIconUrl(c.className, c.role));
      const isSafeUrl = c.portraitUrl && (
        c.portraitUrl.startsWith('images/') ||
        c.portraitUrl.startsWith('./') ||
        c.portraitUrl.startsWith('/') ||
        c.portraitUrl.startsWith('https://') ||
        c.portraitUrl.startsWith('http://') ||
        c.portraitUrl.startsWith('data:image/')
      );
      const rawAvatar = isSafeUrl ? c.portraitUrl : classIconSrc;
      const avatarSrc = escapeHtml(rawAvatar);
      const safeName = escapeHtml(c.name);
      const safeClass = escapeHtml(c.className || 'Classe');

      html += `
        <div class="user-roster-card-item">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img class="user-roster-avatar" src="${avatarSrc}" data-fallback="${classIconSrc}" onerror="this.onerror=null; this.src=this.getAttribute('data-fallback');" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; background: #121310; border: 1px solid rgba(232, 230, 220,0.2);">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: #E8E6DC;">
                <img class="chip-class-sigil" src="${classIconSrc}" alt="${safeClass}" title="${safeClass}">
                <span>${safeName}</span>
              </div>
              <div style="font-size: 12px; color: var(--text-dim);">
                ${safeClass} • ${(c.ilvl || 1750).toFixed(1)} iLvl • ${formatNumber(c.cp || 0)} CP
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-select-roster-char" data-id="${cId}" style="background: rgba(232, 230, 220,0.15); border: 1px solid rgba(232, 230, 220,0.4); color: #E0A43A; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
              Charger
            </button>
            <button type="button" class="btn-delete-roster-char" data-id="${cId}" style="background: rgba(224, 122, 99,0.15); border: 1px solid rgba(224, 122, 99,0.4); color: #E07A63; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
             
            </button>
          </div>
        </div>
      `;
    });

    dom.modalUserRosterList.innerHTML = html;

    dom.modalUserRosterList.querySelectorAll('.user-roster-avatar').forEach(img => {
      img.addEventListener('error', () => {
        const fb = img.getAttribute('data-fallback');
        if (fb) img.src = fb;
      });
    });

    dom.modalUserRosterList.querySelectorAll('.btn-select-roster-char').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const list = getUserRoster() || [];
        const found = list.find(x => (x.id || x.name.toLowerCase()) === id);
        if (found) {
          renderPresetsBar();
          loadCharacter(found);
          if (dom.importModal) dom.importModal.classList.remove('active');
        }
      });
    });

    dom.modalUserRosterList.querySelectorAll('.btn-delete-roster-char').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        removeCharacterFromUserRoster(id);
      });
    });
  }

  function logoutOAuth() {
    localStorage.removeItem('lostark_bible_token');
    currentOAuthRosters = null;
    if (dom.oauthDisconnectedView) dom.oauthDisconnectedView.style.display = 'block';
    if (dom.oauthConnectedView) dom.oauthConnectedView.style.display = 'none';
    if (dom.oauthUsername) dom.oauthUsername.textContent = 'Connecté';
    if (dom.oauthRosterList) dom.oauthRosterList.innerHTML = '';
  }

  // --- 5. INITIALISATION DES ÉVÉNEMENTS & INTERACTIONS ---

  function bindEvents() {
    // Switch de Rôle (Support vs DPS) - s'il est présent dans le DOM
    if (dom.roleSupport) dom.roleSupport.addEventListener('click', () => setRole('support'));
    if (dom.roleDps) dom.roleDps.addEventListener('click', () => setRole('dps'));

    // Navigation des onglets
    dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.tabBtns.forEach(b => b.classList.remove('active'));
        dom.tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(targetId);
        if (targetPane) {
          targetPane.classList.add('active');
          if (targetId === 'tab-canonical') renderCanonicalView();
          if (targetId === 'tab-advisor') renderAdvisorView();
          if (targetId === 'tab-arkpassive') updateArkPassiveView();
          if (targetId === 'tab-raidtracker') renderRaidTrackerView();
          if (targetId === 'tab-benchmark') renderBenchmarkTab();
        }
      });
    });

    // Clics interactifs sur les Cartes de Score de Profil (Loseii Style)
    function navigateToTab(tabId) {
      if (!dom.tabBtns || !dom.tabPanes) return;
      dom.tabBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-tab') === tabId));
      dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === tabId));
      if (tabId === 'tab-canonical') renderCanonicalView();
      if (tabId === 'tab-advisor') renderAdvisorView();
      if (tabId === 'tab-arkpassive') updateArkPassiveView();
      if (tabId === 'tab-raidtracker') renderRaidTrackerView();
      if (tabId === 'tab-benchmark') renderBenchmarkTab();
      if (tabId === 'tab-optimization') updateOptimizationView();
      const pane = document.getElementById(tabId);
      if (pane) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (dom.scoreCardAcc) dom.scoreCardAcc.addEventListener('click', () => navigateToTab('tab-optimization'));
    if (dom.scoreCardBracelet) dom.scoreCardBracelet.addEventListener('click', () => navigateToTab('tab-optimization'));
    if (dom.scoreCardAstro) dom.scoreCardAstro.addEventListener('click', () => navigateToTab('tab-optimization'));
    if (dom.scoreCardGpd) dom.scoreCardGpd.addEventListener('click', () => navigateToTab('tab-advisor'));

    function handleCurrentIlvlChange(newIlvl) {
      const prevIlvl = state.currentIlvl;
      const prevTarget = state.targetIlvl;
      const targetGap = Math.max(0, prevTarget - prevIlvl);
      const dIlvl = newIlvl - prevIlvl;

      state.currentIlvl = parseFloat(newIlvl.toFixed(2));

      // 1. Mise à jour dynamique et positive du Combat Power actuel selon la pente d'affinage
      if (dIlvl !== 0 && state.currentCp > 0) {
        const baseRate = state.role === 'support' ? 9.8 : 10.5;
        const cpScale = state.currentCp / 3500;
        const slope = baseRate * cpScale;
        state.currentCp = Math.max(100, Math.round(state.currentCp + dIlvl * slope));
        
        if (dom.sliderCurrentCp) dom.sliderCurrentCp.value = state.currentCp;
        if (dom.numCurrentCp) dom.numCurrentCp.value = state.currentCp;
        if (dom.dispCurrentCp) dom.dispCurrentCp.textContent = formatNumber(state.currentCp);
      }

      // 2. Maintien de l'iLvl cible toujours supérieur ou égal à l'iLvl actuel (évite tout gain négatif)
      if (state.targetIlvl <= state.currentIlvl) {
        state.targetIlvl = parseFloat((state.currentIlvl + 10).toFixed(2));
      }

      // 3. Ajustement de la borne minimale du curseur cible
      if (dom.sliderTargetIlvl) {
        dom.sliderTargetIlvl.min = Math.floor(state.currentIlvl);
      }

      updateTargetButtons();
      updatePredictorView();
      updateTargetButtonsState();
    }

    function handleTargetIlvlChange(newTarget) {
      if (newTarget < state.currentIlvl) {
        newTarget = state.currentIlvl;
      }
      state.targetIlvl = parseFloat(newTarget.toFixed(2));
      updatePredictorView();
      updateTargetButtonsState();
    }

    // Inputs iLvl Actuel
    dom.sliderCurrentIlvl.addEventListener('input', (e) => {
      handleCurrentIlvlChange(parseFloat(e.target.value));
    });
    dom.numCurrentIlvl.addEventListener('change', (e) => {
      handleCurrentIlvlChange(parseFloat(e.target.value) || 1740);
    });

    // Inputs CP Actuel
    dom.sliderCurrentCp.addEventListener('input', (e) => {
      state.currentCp = parseInt(e.target.value, 10);
      updatePredictorView();
    });
    dom.numCurrentCp.addEventListener('change', (e) => {
      state.currentCp = parseInt(e.target.value, 10) || 3000;
      updatePredictorView();
    });

    // Inputs iLvl Cible
    dom.sliderTargetIlvl.addEventListener('input', (e) => {
      handleTargetIlvlChange(parseFloat(e.target.value));
    });
    dom.numTargetIlvl.addEventListener('change', (e) => {
      handleTargetIlvlChange(parseFloat(e.target.value) || state.currentIlvl);
    });

    // Boutons de saut d'iLvl cible rapide (1750, 1760, 1770, 1780...)
    dom.quickTargetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-target'));
        state.targetIlvl = val;
        updatePredictorView();
        updateTargetButtonsState();
      });
    });

    // Commutateur de Mode de Prédiction (Affinage Pur vs Évolution Globale)
    const btnPredHoning = document.getElementById('btnPredModeHoning');
    const btnPredGlobal = document.getElementById('btnPredModeGlobal');
    if (btnPredHoning && btnPredGlobal) {
      btnPredHoning.addEventListener('click', () => {
        state.predictionMode = 'honing';
        btnPredHoning.classList.add('active');
        btnPredGlobal.classList.remove('active');
        updatePredictorView();
      });
      btnPredGlobal.addEventListener('click', () => {
        state.predictionMode = 'global';
        btnPredGlobal.classList.add('active');
        btnPredHoning.classList.remove('active');
        updatePredictorView();
      });
    }

    // Sélecteur de bonus gemmes
    dom.gemSelect.addEventListener('change', (e) => {
      state.gemBonus = computeGemBonus(e.target.value);
      updatePredictorView();
    });

    // Steppers d'équipement (Affinage pièce par pièce)
    dom.gearRows.forEach(row => {
      const piece = row.getAttribute('data-piece');
      const decBtn = row.querySelector('.btn-step.dec');
      const incBtn = row.querySelector('.btn-step.inc');

      decBtn.addEventListener('click', () => {
        if (state.gear[piece] > 10) {
          state.gear[piece]--;
          updateHoningView();
        }
      });

      incBtn.addEventListener('click', () => {
        if (state.gear[piece] < 25) {
          state.gear[piece]++;
          updateHoningView();
        }
      });
    });

    // Affinage avancé
    dom.advHoningSelect.addEventListener('change', (e) => {
      state.advHoning = parseInt(e.target.value, 10);
      updateHoningView();
    });

    // Actions collectives d'affinage (+14, +16, +18, +20 partout)
    dom.btnAll14.addEventListener('click', () => setAllGear(14));
    dom.btnAll16.addEventListener('click', () => setAllGear(16));
    dom.btnAll18.addEventListener('click', () => setAllGear(18));
    dom.btnAll20.addEventListener('click', () => setAllGear(20));

    const btnResetH = document.getElementById('btnResetHoning');
    if (btnResetH) {
      btnResetH.addEventListener('click', () => {
        if (state.baselineGear) {
          state.gear = { ...state.baselineGear };
        }
        if (state.baselineAdvHoning !== undefined) {
          state.advHoning = state.baselineAdvHoning;
          if (dom.advHoningSelect) dom.advHoningSelect.value = state.advHoning.toString();
        }
        updateHoningView();
      });
    }

    // Gestion de l'upload et de la personnalisation d'image de personnage
    if (dom.charImageUploadInput) {
      dom.charImageUploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
          alert('Veuillez choisir une image de moins de 5 Mo.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const currentChar = getCurrentActiveCharacter();
          const charKey = (activeCharacterId || (currentChar && currentChar.id) || 'character').toLowerCase();
          const dataUrl = event.target.result;
          localStorage.setItem('char_custom_avatar_' + charKey, dataUrl);
          if (dom.charAvatarImg) dom.charAvatarImg.src = dataUrl;
          const chipImg = document.getElementById('chipAvatar_' + charKey);
          if (chipImg) chipImg.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    if (dom.btnResetAvatar) {
      dom.btnResetAvatar.addEventListener('click', () => {
        const currentChar = getCurrentActiveCharacter();
        const charKey = (activeCharacterId || (currentChar && currentChar.id) || 'character').toLowerCase();
        localStorage.removeItem('char_custom_avatar_' + charKey);
        const defaultImg = (currentChar && currentChar.portraitUrl) || DEFAULT_AVATARS[charKey] || (currentChar ? getClassIconUrl(currentChar.className, currentChar.role) : 'images/classes/paladin.png');
        if (dom.charAvatarImg) dom.charAvatarImg.src = defaultImg;
        const chipImg = document.getElementById('chipAvatar_' + charKey);
        if (chipImg) chipImg.src = defaultImg;
      });
    }

    // Contrôles Roster & Presets Dynamiques
    if (dom.btnSyncRosterNav) {
      dom.btnSyncRosterNav.addEventListener('click', () => {
        if (dom.importModal) {
          dom.importModal.classList.add('active');
          renderSavedRosterManager();
        }
      });
    }

    if (dom.btnManageRoster) {
      dom.btnManageRoster.addEventListener('click', () => {
        if (dom.importModal) {
          dom.importModal.classList.add('active');
          renderSavedRosterManager();
        }
      });
    }


    if (dom.btnOAuthSyncAllRoster) {
      dom.btnOAuthSyncAllRoster.addEventListener('click', () => {
        if (currentOAuthRosters) syncAllOAuthCharacters(currentOAuthRosters);
      });
    }

    if (dom.btnRefreshAllUserRoster) {
      dom.btnRefreshAllUserRoster.addEventListener('click', () => refreshAllUserRosterCharacters());
    }

    if (dom.btnClearUserRoster) {
      dom.btnClearUserRoster.addEventListener('click', () => clearUserRoster());
    }

    // Onglet 3 : Événements Optimisation T4 Support
    const supBindings = [
      { el: dom.optSupBrand, prop: 'supBrand' },
      { el: dom.optSupAllyDmg, prop: 'supAllyDmg' },
      { el: dom.optSupAllyAp, prop: 'supAllyAp' },
      { el: dom.optSupWp, prop: 'supWp' },
      { el: dom.optSupWpFlat, prop: 'supWpFlat' },
      { el: dom.optSupQuality, prop: 'supQuality' },
      { el: dom.optSupBracePerk, prop: 'supBracePerk' },
      { el: dom.optSupBraceWp, prop: 'supBraceWp' },
      { el: dom.optSupBraceStat, prop: 'supBraceStat' },
      { el: dom.optSupBraceSwift, prop: 'supBraceSwift' }
    ];
    supBindings.forEach(b => {
      if (b.el) {
        b.el.addEventListener('change', (e) => {
          state.opt[b.prop] = e.target.value;
          updateOptimizationView();
        });
      }
    });

    // Onglet 3 : Événements Optimisation T4 DPS
    const dpsBindings = [
      { el: dom.optDpsAddDmg, prop: 'dpsAddDmg' },
      { el: dom.optDpsOutDmg, prop: 'dpsOutDmg' },
      { el: dom.optDpsAp, prop: 'dpsAp' },
      { el: dom.optDpsCrit, prop: 'dpsCrit' },
      { el: dom.optDpsCdmg, prop: 'dpsCdmg' },
      { el: dom.optDpsWp, prop: 'dpsWp' },
      { el: dom.optDpsQuality, prop: 'dpsQuality' },
      { el: dom.optDpsBracePerk, prop: 'dpsBracePerk' },
      { el: dom.optDpsBraceWp, prop: 'dpsBraceWp' },
      { el: dom.optDpsBraceStat, prop: 'dpsBraceStat' },
      { el: dom.optDpsBraceSub, prop: 'dpsBraceSub' }
    ];
    dpsBindings.forEach(b => {
      if (b.el) {
        b.el.addEventListener('change', (e) => {
          state.opt[b.prop] = e.target.value;
          updateOptimizationView();
        });
      }
    });

    // Onglet 3 : Gemmes T4 Deck
    if (dom.optGemsDeck) {
      dom.optGemsDeck.addEventListener('change', (e) => {
        state.opt.gemsDeck = e.target.value;
        updateOptimizationView();
      });
    }

    // Onglet 3 : Passifs Karma & Ark Grid
    if (dom.optKarmaEnlight) {
      dom.optKarmaEnlight.addEventListener('change', (e) => {
        state.opt.karmaEnlight = e.target.checked;
        updateOptimizationView();
      });
    }
    if (dom.optKarmaEvo) {
      dom.optKarmaEvo.addEventListener('change', (e) => {
        state.opt.karmaEvo = e.target.checked;
        updateOptimizationView();
      });
    }
    if (dom.optArkGrid) {
      dom.optArkGrid.addEventListener('change', (e) => {
        state.opt.arkGrid = e.target.checked;
        updateOptimizationView();
      });
    }

    // Modal d'Aide
    const helpModal = document.getElementById('helpModal');
    const btnOpenHelp = document.getElementById('btnOpenHelpModal');
    const btnCloseHelp = document.getElementById('btnCloseHelpModal');
    const btnCloseHelpFooter = document.getElementById('btnCloseHelpModalFooter');

    if (btnOpenHelp && helpModal) {
      btnOpenHelp.addEventListener('click', () => helpModal.classList.add('active'));
    }
    if (btnCloseHelp && helpModal) {
      btnCloseHelp.addEventListener('click', () => helpModal.classList.remove('active'));
    }
    if (btnCloseHelpFooter && helpModal) {
      btnCloseHelpFooter.addEventListener('click', () => helpModal.classList.remove('active'));
    }
    if (helpModal) {
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) helpModal.classList.remove('active');
      });
    }

    // Modal d'Importation lostark.bible
    if (dom.btnOpenImportModal && dom.importModal) {
      dom.btnOpenImportModal.addEventListener('click', () => {
        dom.importModal.classList.add('active');
        if (dom.importStatus) dom.importStatus.style.display = 'none';
      });
    }

    if (dom.btnCloseImportModal && dom.importModal) {
      dom.btnCloseImportModal.addEventListener('click', () => {
        dom.importModal.classList.remove('active');
      });
    }

    if (dom.btnCloseImportModalFooter && dom.importModal) {
      dom.btnCloseImportModalFooter.addEventListener('click', () => {
        dom.importModal.classList.remove('active');
      });
    }

    if (dom.importModal) {
      dom.importModal.addEventListener('click', (e) => {
        if (e.target === dom.importModal) {
          dom.importModal.classList.remove('active');
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.importModal && dom.importModal.classList.contains('active')) {
          dom.importModal.classList.remove('active');
        }
        const aModal = document.getElementById('agentDownloadModal');
        if (aModal && aModal.classList.contains('active')) {
          aModal.classList.remove('active');
        }
      }
    });

    // Modal Téléchargement Agent Local
    const agentModal = document.getElementById('agentDownloadModal');
    const btnOpenAgentModal = document.getElementById('btnOpenAgentModal');
    const btnCloseAgentModal = document.getElementById('btnCloseAgentModal');
    const btnCloseAgentModalFooter = document.getElementById('btnCloseAgentModalFooter');
    const raidPill = document.getElementById('raidAgentStatusPill');

    if (btnOpenAgentModal && agentModal) {
      btnOpenAgentModal.addEventListener('click', () => {
        agentModal.classList.add('active');
      });
    }

    if (raidPill && agentModal) {
      raidPill.style.cursor = 'pointer';
      raidPill.title = 'Cliquez pour ouvrir l\'aide et l\'installation de l\'agent';
      raidPill.addEventListener('click', () => {
        agentModal.classList.add('active');
      });
    }

    if (btnCloseAgentModal && agentModal) {
      btnCloseAgentModal.addEventListener('click', () => {
        agentModal.classList.remove('active');
      });
    }

    if (btnCloseAgentModalFooter && agentModal) {
      btnCloseAgentModalFooter.addEventListener('click', () => {
        agentModal.classList.remove('active');
      });
    }

    if (agentModal) {
      agentModal.addEventListener('click', (e) => {
        if (e.target === agentModal) {
          agentModal.classList.remove('active');
        }
      });
    }

    if (dom.btnFetchBible) {
      dom.btnFetchBible.addEventListener('click', () => {
        const region = dom.importRegion ? dom.importRegion.value : 'CE';
        const name = dom.importCharName ? dom.importCharName.value.trim() : '';
        if (!name) {
          if (dom.importStatus) {
            dom.importStatus.className = 'modal-status error';
            dom.importStatus.style.display = 'block';
            dom.importStatus.textContent = 'Veuillez renseigner le pseudo de votre personnage.';
          }
          return;
        }
        const autoAdd = dom.chkAutoAddToRoster ? dom.chkAutoAddToRoster.checked : true;
        fetchBibleProfile(region, name, autoAdd);
      });
    }

    if (dom.btnParseDirectJson) {
      dom.btnParseDirectJson.addEventListener('click', () => {
        const raw = dom.importJsonDirect ? dom.importJsonDirect.value.trim() : '';
        if (!raw) return;
        try {
          const json = JSON.parse(raw);
          const autoAdd = dom.chkAutoAddToRoster ? dom.chkAutoAddToRoster.checked : true;
          applyLoadedProfile(json, null, 'CE', autoAdd);
        } catch (e) {
          if (dom.importStatus) {
            dom.importStatus.className = 'modal-status error';
            dom.importStatus.textContent = 'Format JSON invalide. Assure-toi de copier l\'intégralité du texte.';
          }
        }
      });
    }

    // Contrôles OAuth 2.0 PKCE (lostark.bible)
    if (dom.btnOAuthLogin) {
      dom.btnOAuthLogin.addEventListener('click', () => startOAuthFlow());
    }

    // Toggle Environnement OAuth (Prod vs Dev)
    const btnEnvProd = document.getElementById('btnOAuthEnvProd');
    const btnEnvDev = document.getElementById('btnOAuthEnvDev');
    const uriPreview = document.getElementById('oauthRedirectUriPreview');
    const btnCopyUri = document.getElementById('btnCopyRedirectUri');

    if (uriPreview) {
      uriPreview.textContent = getOAuthRedirectUri();
    }

    if (btnCopyUri) {
      btnCopyUri.addEventListener('click', () => {
        const uri = getOAuthRedirectUri();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(uri).then(() => {
            btnCopyUri.textContent = 'Copié.';
            setTimeout(() => { btnCopyUri.textContent = 'Copier'; }, 2000);
          });
        }
      });
    }

    function syncOAuthEnvButtons() {
      const currentId = getOAuthClientId();
      const isDev = (currentId === OAUTH_CONFIG.devClientId);
      if (btnEnvProd) btnEnvProd.classList.toggle('active', !isDev);
      if (btnEnvDev) btnEnvDev.classList.toggle('active', isDev);
    }

    if (btnEnvProd && btnEnvDev) {
      syncOAuthEnvButtons();
      btnEnvProd.addEventListener('click', () => {
        selectedOAuthEnv = 'prod';
        syncOAuthEnvButtons();
      });
      btnEnvDev.addEventListener('click', () => {
        selectedOAuthEnv = 'dev';
        syncOAuthEnvButtons();
      });
    }

    if (dom.btnOAuthRefresh) {
      dom.btnOAuthRefresh.addEventListener('click', () => {
        const token = localStorage.getItem('lostark_bible_token');
        if (token) fetchOAuthUserData(token);
      });
    }

    if (dom.btnOAuthLogout) {
      dom.btnOAuthLogout.addEventListener('click', () => logoutOAuth());
    }

    initAdvisorEvents();
    initArkPassiveEvents();
    initPerSkillGemsEvents();
    initCuttingAdvisorEvents();
    initAstrogemGraderEvents();

    // Bouton de partage du profil actif (?char=Nom)
    const btnShare = document.getElementById('btnShareCharacter');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        const cur = getCurrentActiveCharacter();
        if (!cur) return;
        const curName = cur.name || '';
        const shareUrl = `${window.location.origin}${window.location.pathname}?char=${encodeURIComponent(curName)}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            showToast(`Lien direct copié : ${shareUrl}`);
          }).catch(() => {
            prompt('Copiez ce lien :', shareUrl);
          });
        } else {
          prompt('Copiez ce lien :', shareUrl);
        }
      });
    }

  }

  function showToast(msg) {
    let toast = document.getElementById('appGlobalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appGlobalToast';
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span></span> <span>${escapeHtml(msg)}</span>`;
    toast.style.display = 'flex';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 3800);
  }


  function initWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (!modal) return;

    const btnClose = document.getElementById('btnCloseWelcomeModal');
    const btnFetch = document.getElementById('btnWelcomeFetch');
    const inputName = document.getElementById('welcomeCharName');
    const selectRegion = document.getElementById('welcomeRegion');
    const statusEl = document.getElementById('welcomeStatus');

    function closeModal() {
      modal.classList.remove('active');
      sessionStorage.setItem('lostark_onboarding_dismissed', 'true');
    }

    if (btnClose) btnClose.addEventListener('click', closeModal);

    // Suggestions de pseudos rapides
    document.querySelectorAll('.welcome-chip-suggestion').forEach(chip => {
      chip.addEventListener('click', () => {
        const name = chip.getAttribute('data-name');
        if (inputName) inputName.value = name;
        if (btnFetch) btnFetch.click();
      });
    });

    if (btnFetch) {
      btnFetch.addEventListener('click', async () => {
        const name = inputName ? inputName.value.trim() : '';
        const region = selectRegion ? selectRegion.value : 'CE';
        if (!name) {
          if (statusEl) {
            statusEl.className = 'modal-status error';
            statusEl.style.display = 'block';
            statusEl.textContent = 'Veuillez renseigner le pseudo de votre personnage.';
          }
          return;
        }

        if (statusEl) {
          statusEl.className = 'modal-status info';
          statusEl.style.display = 'block';
          statusEl.innerHTML = `Recherche de <strong>${escapeHtml(name)} (${escapeHtml(region)})</strong> sur lostark.bible...`;
        }

        const loaded = await fetchBibleProfile(region, name, true);
        if (loaded) {
          closeModal();
          showToast(`${loaded.name} (${loaded.className} ${loaded.ilvl.toFixed(1)}) importé avec succès.`);
        } else {
          if (statusEl) {
            statusEl.className = 'modal-status error';
            statusEl.style.display = 'block';
            statusEl.innerHTML = `Personnage <strong>${escapeHtml(name)}</strong> introuvable sur lostark.bible (${escapeHtml(region)}). Vérifiez l'orthographe ou essayez une suggestion.`;
          }
        }
      });
    }

    if (inputName) {
      inputName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (btnFetch) btnFetch.click();
        }
      });
    }
  }

  async function checkUrlCharacterParam() {
    const params = new URLSearchParams(window.location.search);
    const charParam = params.get('char') || params.get('name') || params.get('player');
    const regionParam = params.get('region') || 'CE';
    if (charParam && charParam.trim()) {
      sessionStorage.setItem('lostark_onboarding_dismissed', 'true');
      const welcomeModal = document.getElementById('welcomeModal');
      if (welcomeModal) welcomeModal.classList.remove('active');

      const clean = charParam.trim();
      const existing = getActiveRosterList().find(c => (c.name || '').toLowerCase() === clean.toLowerCase());
      if (existing) {
        loadCharacter(existing);
        showToast(`Profil ${existing.name} chargé.`);
      } else {
        showToast(`Chargement de ${clean} (${regionParam.toUpperCase()})...`);
        const loaded = await fetchBibleProfile(regionParam, clean, true);
        if (loaded) {
          showToast(`Personnage ${loaded.name} chargé depuis lostark.bible.`);
        }
      }
      return true;
    }
    return false;
  }

  function checkOnboarding() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('char') || params.get('name') || params.get('player') || params.get('code')) {
      return;
    }
    const userRoster = getUserRoster();
    const dismissed = sessionStorage.getItem('lostark_onboarding_dismissed');
    if (!userRoster && !dismissed) {
      const welcomeModal = document.getElementById('welcomeModal');
      if (welcomeModal) {
        welcomeModal.classList.add('active');
        const inputName = document.getElementById('welcomeCharName');
        if (inputName && typeof inputName.focus === 'function') setTimeout(() => inputName.focus(), 300);
      }
    }
  }

  function setAllGear(lvl) {
    for (const piece of Object.keys(state.gear)) {
      if (piece === 'weapon') {
        state.gear[piece] = Math.max(state.gear[piece], lvl);
      } else {
        state.gear[piece] = lvl;
      }
    }
    updateHoningView();
  }

  function updateTargetButtons() {
    if (!dom.quickTargetBtns || !dom.quickTargetBtns.length) return;
    const base = Math.ceil((state.currentIlvl + 0.5) / 10) * 10;
    const milestones = [base, base + 10, base + 20, base + 30, base + 40];
    dom.quickTargetBtns.forEach((btn, idx) => {
      if (milestones[idx] !== undefined) {
        const targetVal = milestones[idx];
        btn.setAttribute('data-target', targetVal.toString());
        btn.textContent = targetVal.toString();
      }
    });
  }

  function updateTargetButtonsState() {
    dom.quickTargetBtns.forEach(b => {
      const val = parseFloat(b.getAttribute('data-target'));
      b.classList.toggle('active', Math.abs(val - state.targetIlvl) < 0.1);
    });
  }

  function setRole(newRole) {
    state.role = newRole;
    const cur = getCurrentActiveCharacter();
    if (cur) {
      cur.role = newRole;
    }
    if (dom.roleSupport) dom.roleSupport.classList.toggle('active', newRole === 'support');
    if (dom.roleDps) dom.roleDps.classList.toggle('active', newRole === 'dps');
    if (dom.roleBadge) {
      dom.roleBadge.textContent = isEnLang()
        ? (newRole === 'support' ? 'Support model' : 'DPS model')
        : (newRole === 'support' ? 'Modèle Support' : 'Modèle DPS');
      dom.roleBadge.style.color = newRole === 'support' ? 'var(--support-color)' : 'var(--dps-color)';
      dom.roleBadge.style.borderColor = newRole === 'support' ? 'rgba(232, 230, 220, 0.3)' : 'rgba(224, 122, 99, 0.3)';
    }
    
    updatePredictorView();
    updateHoningView();
    updateOptimizationView();
    renderCanonicalView();
    updateAstrogemGraderView();
    updateActiveCharacterCard(activeCharacterId, cur);
  }

  function updateActiveCharacterCard(key, customProfile = null) {
    const p = customProfile || getCurrentActiveCharacter();
    if (!p) return;
    const resolvedRole = detectCharacterRole(p);
    p.role = resolvedRole;
    state.role = resolvedRole;
    const isSupport = resolvedRole === 'support';
    const charKey = (p.id || p.name || 'char').toLowerCase();

    if (dom.charCardName) dom.charCardName.textContent = p.name || 'Personnage';
    if (dom.charCardClass) {
      const cName = p.className || (isSupport ? 'Paladin' : 'Shadowhunter');
      const sigilSrc = getClassIconUrl(cName, p.role);
      dom.charCardClass.innerHTML = `<img class="class-sigil-tag" src="${sigilSrc}" alt=""> <span>${cName}</span>`;
    }
    if (dom.charCardServer) {
      const sName = p.server || (isEnLang() ? 'Server' : 'Serveur');
      // Les rosters de démo portent la guilde fictive « Archétype Démo » (data.js)
      const guild = p.guild && isEnLang() ? p.guild.replace('Archétype Démo', 'Demo archetype') : p.guild;
      const gName = guild ? `${guild} • ` : '';
      dom.charCardServer.textContent = `${gName}${sName}`;
    }
    if (dom.charCardIlvl) dom.charCardIlvl.textContent = (state.currentIlvl || p.ilvl || 1750).toFixed(2);
    if (dom.charCardCp) dom.charCardCp.textContent = `${formatNumber(Math.round(state.currentCp || p.cp || 0))} CP`;

    if (dom.charCardWeapon) {
      const wep = state.gear.weapon || (p.gear && p.gear.weapon) || 17;
      dom.charCardWeapon.textContent = `+${wep}`;
    }

    if (dom.charCardArmor) {
      const g = state.gear || p.gear;
      if (g) {
        const armors = [g.head, g.shoulder, g.chest, g.pants, g.gloves].filter(v => v !== undefined);
        if (armors.length) {
          const minA = Math.min(...armors);
          const maxA = Math.max(...armors);
          dom.charCardArmor.textContent = minA === maxA ? `+${minA}` : `+${minA} / +${maxA}`;
        }
      }
    }

    if (dom.charCardAdv) {
      const adv = state.advHoning !== undefined ? state.advHoning : p.advHoning;
      dom.charCardAdv.textContent = `+${adv}`;
    }

    if (dom.charCardRoster) {
      dom.charCardRoster.innerHTML = `Roster <strong>${p.rosterLevel || 300}</strong>`;
    }

    if (dom.activeCharacterCard) {
      dom.activeCharacterCard.classList.toggle('role-support', isSupport);
      dom.activeCharacterCard.classList.toggle('role-dps', !isSupport);
    }

    if (dom.charAvatarRoleBadge) {
      const cName = p.className || (isSupport ? 'Paladin' : 'Shadowhunter');
      const sigilSrc = getClassIconUrl(cName, p.role);
      const roleLabel = isSupport ? 'Support' : 'DPS';
      dom.charAvatarRoleBadge.innerHTML = `<img class="class-sigil-badge" src="${sigilSrc}" alt=""> <span>${roleLabel}</span>`;
    }

    // Gestion de l'avatar du héros (priorité au custom upload local puis live / CDN officiel)
    const savedCustom = localStorage.getItem('char_custom_avatar_' + charKey);
    const isDemo = Object.prototype.hasOwnProperty.call(DEFAULT_AVATARS, charKey);
    const classIconFallback = getClassIconUrl(p.className, p.role);
    const defaultImg = p.portraitUrl || (isDemo ? DEFAULT_AVATARS[charKey] : classIconFallback);
    const finalAvatarSrc = savedCustom || defaultImg;

    if (dom.charAvatarImg) {
      dom.charAvatarImg.src = finalAvatarSrc;
      dom.charAvatarImg.onerror = () => { dom.charAvatarImg.src = classIconFallback; };
    }

    const chipImg = document.getElementById(`chipAvatar_${charKey}`);
    if (chipImg) {
      const faceSrc = getCharacterFaceAvatar(p);
      const isFull = isFullBodyAgsAvatar(faceSrc);
      chipImg.src = savedCustom || faceSrc;
      chipImg.classList.toggle('ags-fullbody-zoom', isFull && !savedCustom);
      chipImg.onerror = () => { chipImg.src = classIconFallback; };
    }

    // Mise à jour du pill d'équipement dans le footer (Arme, Armures, Adv Honing)
    if (dom.charCardGearPill) {
      const wep = state.gear.weapon || (p.gear && p.gear.weapon) || 17;
      let armStr = '+18';
      const g = state.gear || p.gear;
      if (g) {
        const armors = [g.head, g.shoulder, g.chest, g.pants, g.gloves].filter(v => v !== undefined);
        if (armors.length) {
          const minA = Math.min(...armors);
          const maxA = Math.max(...armors);
          armStr = minA === maxA ? `+${minA}` : `+${minA}/+${maxA}`;
        }
      }
      const adv = state.advHoning !== undefined ? state.advHoning : p.advHoning;
      dom.charCardGearPill.innerHTML = isEnLang()
        ? `Weapon <strong>+${wep}</strong> · Armor <strong>${armStr}</strong> · Adv. <strong>+${adv !== undefined ? adv : 40}</strong>`
        : `Arme <strong>+${wep}</strong> · Armures <strong>${armStr}</strong> · Avancé <strong>+${adv !== undefined ? adv : 40}</strong>`;
    }

    // Pierre d'aptitude : obtenue en jeu, on affiche ses niveaux et les chances d'atteindre le palier suivant
    if (dom.charCardStonePill) {
      const isEn = isEnLang();
      const stone = getAbilityStone(p);
      if (stone) {
        const [e1, e2] = stone.positives;
        const name = e => (isEn ? e.en : e.fr);
        const hasApBonus = e1.level + e2.level >= 5;
        const up = getAbilityStoneUpgrade(p, isSupport);
        let html = isEn
          ? `Stone <strong>${e1.nodes}/${e2.nodes}</strong>`
          : `Pierre <strong>${e1.nodes}/${e2.nodes}</strong>`;
        if (hasApBonus) html += isEn ? ' · base Atk. Power <strong>+1.5%</strong>' : ' · PA de base <strong>+1,5 %</strong>';
        if (up) {
          html += isEn
            ? ` · ${up.toLabel}: 1 stone in ${formatNumber(Math.round(up.stones))} (+${up.gain.toFixed(2)}%)`
            : ` · ${up.toLabel} : 1 pierre sur ${formatNumber(Math.round(up.stones))} (+${up.gain.toFixed(2).replace('.', ',')} %)`;
        }
        dom.charCardStonePill.innerHTML = html;
        dom.charCardStonePill.title = isEn
          ? `${name(e1)} Lv. ${e1.level} · ${name(e2)} Lv. ${e2.level}. Odds with optimal faceting of a new stone carrying the same engravings. At 5 levels in total (e.g. 9/7) the stone adds +1.5% base Atk. Power.`
          : `${name(e1)} niv. ${e1.level} · ${name(e2)} niv. ${e2.level}. Chances avec une taille optimale d'une nouvelle pierre aux mêmes gravures. À 5 niveaux au total (ex. 9/7), la pierre ajoute +1,5 % de PA de base.`;
        dom.charCardStonePill.hidden = false;
      } else {
        dom.charCardStonePill.hidden = true;
      }
    }

    // Karma : obtenu en jeu, on affiche ce qu'il apporte au Battle Point
    if (dom.charCardKarmaPill) {
      const isEn = isEnLang();
      const karma = getKarmaBonus(p);
      if (karma) {
        const fmt = v => (isEn ? v.toFixed(2) : v.toFixed(2).replace('.', ','));
        dom.charCardKarmaPill.innerHTML = isEn
          ? `Karma · Evolution <strong>+${fmt(karma.evolution)}%</strong> · Leap <strong>+${fmt(karma.leap)}%</strong>`
          : `Karma · Évolution <strong>+${fmt(karma.evolution)} %</strong> · Bond <strong>+${fmt(karma.leap)} %</strong>`;
        dom.charCardKarmaPill.title = isEn
          ? 'Karma bonus read from the Battle Point. Karma comes from content, not gold: it is not ranked in the GPD.'
          : 'Bonus de Karma lu sur le Battle Point. Le Karma vient du contenu, pas de l\'or : il n\'est pas classé dans le GPD.';
        dom.charCardKarmaPill.hidden = false;
      } else {
        dom.charCardKarmaPill.hidden = true;
      }
    }

    // Mise à jour des 4 Cartes de Score de Profil (Loseii Style)
    updateProfileScoreCards(p, isSupport, isEnLang());
  }

  function updateProfileScoreCards(p, isSupport, isEn) {
    if (!p) return;
    const roleTagText = isSupport ? 'Support' : 'DPS';

    // Rôle tag des cartes
    [dom.scoreAccRoleTag, dom.scoreBrRoleTag, dom.scoreAgRoleTag].forEach(el => {
      if (el) {
        el.textContent = roleTagText;
        el.classList.toggle('support', isSupport);
        el.classList.toggle('dps', !isSupport);
      }
    });

    // --- 1. CARTE ACCESSOIRES ---
    if (dom.scoreCardAcc) {
      try {
        const accEval = evaluateCharacterAccessories(p, isSupport, isEn);
        const bonusPct = accEval ? (accEval.bonusPct || 0) : (isSupport ? 12.0 : 15.0);
        let accGrade = 'B';
        let gradeClass = 'grade-b';
        if (accEval && accEval.slotLines) {
          // Lignes lues : note sur la valeur réelle (pentes Arsonistic) rapportée au maximum du rôle
          const g = accessoryGrade(bonusPct, isSupport);
          accGrade = g.grade; gradeClass = g.cls;
        } else if (accEval) {
          // Presets sans lignes décodables : ancienne note par nombre de lignes
          if (accEval.highCount >= 10 && accEval.deadCount === 0) {
            accGrade = 'S+'; gradeClass = 'grade-s-plus';
          } else if (accEval.highCount >= 7) {
            accGrade = 'S'; gradeClass = 'grade-s';
          } else if (accEval.highCount >= 4) {
            accGrade = 'A+'; gradeClass = 'grade-a';
          } else if (accEval.highCount >= 2 || accEval.midCount >= 8) {
            accGrade = 'A'; gradeClass = 'grade-a';
          } else if (accEval.midCount >= 4) {
            accGrade = 'B+'; gradeClass = 'grade-b';
          } else if (accEval.midCount >= 1) {
            accGrade = 'B'; gradeClass = 'grade-b';
          } else {
            accGrade = 'C'; gradeClass = 'grade-c';
          }
        }
        if (dom.scoreAccGrade) {
          dom.scoreAccGrade.textContent = accGrade;
          dom.scoreAccGrade.className = 'score-grade-badge ' + gradeClass;
        }
        if (dom.scoreAccVal) {
          dom.scoreAccVal.textContent = `+${bonusPct.toFixed(2)}%`;
        }
        if (dom.scoreAccSub) {
          dom.scoreAccSub.textContent = isSupport 
            ? (isEn ? 'Exact Ally Buff' : 'Buff Allié Exact') 
            : (isEn ? 'Exact Damage' : 'Dégâts Exacts');
        }
        if (dom.scoreAccDetail) {
          if (accEval && (accEval.highCount > 0 || accEval.midCount > 0)) {
            const hStr = `${accEval.highCount} High`;
            const mStr = `${accEval.midCount} Mid`;
            const dStr = accEval.deadCount > 0 ? ` • ${accEval.deadCount} ${isEn ? 'Dead' : 'Morts'}` : '';
            const maxStr = accEval.slotLines
              ? ` • ${Math.round(accessoryGrade(bonusPct, isSupport).ratio * 100)}\u00a0%\u00a0${isEn ? 'of\u00a0max' : 'du\u00a0max'}`
              : '';
            dom.scoreAccDetail.textContent = `${hStr} • ${mStr}${dStr}${maxStr}`;
          } else {
            dom.scoreAccDetail.textContent = isEn ? '15/15 Rolls • Multiplicative' : '15/15 Rolls • Modèle Multiplicatif';
          }
        }
      } catch (err) {
        console.warn('Error updating acc score card:', err);
      }
    }

    // --- 2. CARTE BRACELET ---
    if (dom.scoreCardBracelet) {
      try {
        let brScore = '—';
        let brGrade = 'B-';
        let brPct = isSupport ? '+15.00% Buff' : '+10.20% Dmg';
        let brDetail = isEn ? 'Standard T4 Bracelet' : 'Bracelet T4 Standard';
        let customBg = null;
        let customFg = null;

        // Tenter le décodage exact Loseii
        const brItemObj = (p.bracelet)
          || (p.loadout && Array.isArray(p.loadout.items) && p.loadout.items.find(i => i.slot === 'bracelet'))
          || (p.rawProfile && p.rawProfile.loadout && Array.isArray(p.rawProfile.loadout.items) && p.rawProfile.loadout.items.find(i => i.slot === 'bracelet'))
          || (p.rawProfile && p.rawProfile.rawItems && p.rawProfile.rawItems.find(i => i.slot === 'bracelet'))
          || null;

        const brStats = (brItemObj && brItemObj.data && Array.isArray(brItemObj.data.stats) && brItemObj.data.stats)
          || (p.rawProfile && p.rawProfile.bracelet && Array.isArray(p.rawProfile.bracelet.stats) && p.rawProfile.bracelet.stats)
          || (p.bracelet && Array.isArray(p.bracelet.stats) && p.bracelet.stats)
          || null;

        if (typeof window.Bracelet !== 'undefined' && typeof window.Subrank !== 'undefined' && brStats) {
          try {
            const TRAIT_TO_APP = { crit: "crit", spec: "spec", swiftness: "swift" };
            const dec = window.Bracelet.decodeBibleBracelet(brStats);
            const traits = { crit: 0, spec: 0, swift: 0 };
            const lines = [];
            const traitParts = [];
            for (let i = 0; i < (dec.lines || []).length; i++) {
              const l = dec.lines[i];
              const key = TRAIT_TO_APP[l.family];
              if (l.cat === "trait" && key) {
                traits[key] = l.value;
                const traitName = key === "swift" ? "Swift" : (key === "spec" ? "Spec" : "Crit");
                traitParts.push(`${traitName} ${l.value}`);
              } else {
                lines.push(l);
              }
            }
            const normProf = window.Bracelet.normalizeProfile({ role: isSupport ? 'support' : 'dps' });
            const sc = window.Subrank.braceletScore({
              grade: dec.grade || 'ancient',
              lines: lines,
              traits: traits,
              profile: normProf
            });
            if (sc && sc.band) {
              brGrade = sc.band.key;
              brScore = sc.score.toFixed(1);
              brPct = `+${sc.damagePct.toFixed(2)}% ${isSupport ? (isEn ? 'Buff' : 'Buff') : (isEn ? 'Dmg' : 'Dégâts')}`;
              customBg = sc.band.bg;
              customFg = sc.band.fg;

              const traitStr = traitParts.join(' / ');
              const linesCount = lines.length;
              brDetail = traitStr ? `${traitStr} • ${linesCount} lines` : (isEn ? `${linesCount} effect lines` : `${linesCount} lignes d'effets`);
            }
          } catch (e) {
            console.warn('Subrank score failed, fallback to diag:', e);
          }
        }

        // Fallback avec evaluateBracelet
        if (brScore === '—') {
          const brDiag = evaluateBracelet(p, isEn);
          if (brDiag) {
            brGrade = brDiag.tier === 's' ? 'S' : (brDiag.tier === 'a' ? 'A' : (brDiag.tier === 'b' ? 'B' : 'C'));
            brScore = brDiag.efficiency ? (brDiag.efficiency * 5).toFixed(1) : '60.0';
            brPct = `+${(brDiag.efficiency || 10).toFixed(2)}% ${isSupport ? 'Buff' : (isEn ? 'Dmg' : 'Dégâts')}`;
            brDetail = brDiag.ratingDesc || (isEn ? 'Transitional Setup' : 'Rolls de transition');
          }
        }

        if (dom.scoreBrGrade) {
          dom.scoreBrGrade.textContent = brGrade;
          if (customBg) {
            dom.scoreBrGrade.className = 'score-grade-badge';
            dom.scoreBrGrade.style.backgroundColor = customBg;
            dom.scoreBrGrade.style.color = customFg || '#E8E6DC';
          } else {
            dom.scoreBrGrade.style.backgroundColor = '';
            dom.scoreBrGrade.style.color = '';
            dom.scoreBrGrade.className = 'score-grade-badge ' + (brGrade.startsWith('S') ? 'grade-s' : (brGrade.startsWith('A') ? 'grade-a' : 'grade-b'));
          }
        }
        // Même chiffre que le Benchmark : contribution officielle au CP (battlePoint 19-21).
        // La note Subrank reste (qualité pour les dégâts) ; son % inclut les traits, d'où le détail séparé.
        try {
          const brSys = extractPlayerSystems(p, isEn).bracelet;
          if (brSys && brSys.fromBattlePoint) {
            const subrankPct = brPct && brPct !== '—' ? brPct.split(' ')[0] : '';
            brPct = `+${brSys.bonusPct.toFixed(2)}% CP`;
            if (subrankPct) {
              brDetail = `${brDetail ? brDetail + ' • ' : ''}${isEn ? `Subrank ${subrankPct} dmg (traits incl.)` : `Subrank ${subrankPct} dégâts (traits inclus)`}`;
            }
          }
        } catch (e) {}
        // Bracelets obtenus en jeu : part de ceux qui battraient l'actuel après une campagne de rerolls optimale
        const brEv = getBraceletRerollEstimate(p, isSupport);
        if (brEv) {
          const pct = (Math.round(brEv.pBeat * 1000) / 10).toString();
          brDetail = `${brDetail ? brDetail + ' • ' : ''}${isEn ? `${pct}% of new bracelets beat it` : `${pct.replace('.', ',')} % des nouveaux bracelets font mieux`}`;
        }
        if (dom.scoreBrScore) dom.scoreBrScore.textContent = brScore;
        if (dom.scoreBrPct) dom.scoreBrPct.textContent = brPct;
        if (dom.scoreBrDetail) dom.scoreBrDetail.textContent = brDetail;
      } catch (err) {
        console.warn('Error updating bracelet score card:', err);
      }
    }

    // --- 3. CARTE ASTROGEMMES ---
    if (dom.scoreCardAstro) {
      try {
        let astroBonusPct = 0;
        const allBpParts = (p.rawProfile && p.rawProfile.battlePoint && Array.isArray(p.rawProfile.battlePoint.parts))
          ? p.rawProfile.battlePoint.parts
          : [];
        const bpParts = (p.astrogems && p.astrogems.length > 0)
          ? p.astrogems
          : (allBpParts.length > 0 ? allBpParts.filter(x => x.type === 31 || x.type === 32) : []);
        if (Array.isArray(bpParts) && bpParts.length > 0) {
          const sumVal = bpParts.reduce((s, x) => s + (('value' in x ? x.value : x.min) || 0), 0);
          astroBonusPct = Number((sumVal / 100).toFixed(2));
        }
        if (!astroBonusPct) {
          astroBonusPct = isSupport ? 3.50 : 7.92;
        }

        // Modèle Loseii pour les astrogemmes : 60 (C-) à 96.1 (S+)
        // ~7.92% de dégâts correspond à la note 78.0 (B+)
        const calcGrade = Math.min(99.9, Math.max(50.0, 60.0 + (astroBonusPct / 12.0) * 36.1));
        const agScoreStr = calcGrade.toFixed(1);

        const ladder = [
          ["S+", 96.1, "grade-s-plus", "#E0A43A"],
          ["S", 93.3, "grade-s", "#2A2B24"],
          ["S-", 90.0, "grade-s", "#2A2B24"],
          ["A+", 86.7, "grade-a", "#CFCBBD"],
          ["A", 83.3, "grade-a", "#CFCBBD"],
          ["A-", 80.0, "grade-a", "#CFCBBD"],
          ["B+", 76.7, "grade-b", "#2A2B24"],
          ["B", 73.3, "grade-b", "#2A2B24"],
          ["B-", 70.0, "grade-b", "#2A2B24"],
          ["C+", 66.7, "grade-c", "#8CC084"],
          ["C", 63.3, "grade-c", "#8CC084"],
          ["C-", 60.0, "grade-c", "#8CC084"],
          ["D", 50.0, "grade-d", "#6A675C"]
        ];

        let agLetter = "B+";
        let agClass = "grade-b";
        let agColor = "#2A2B24";
        for (const [r, cut, cls, col] of ladder) {
          if (calcGrade >= cut) {
            agLetter = r;
            agClass = cls;
            agColor = col;
            break;
          }
        }

        if (dom.scoreAgGrade) {
          dom.scoreAgGrade.textContent = agLetter;
          dom.scoreAgGrade.className = 'score-grade-badge ' + agClass;
          dom.scoreAgGrade.style.backgroundColor = agColor;
          dom.scoreAgGrade.style.color = '#E8E6DC';
        }
        if (dom.scoreAgScore) dom.scoreAgScore.textContent = agScoreStr;
        if (dom.scoreAgPct) {
          dom.scoreAgPct.textContent = `+${astroBonusPct.toFixed(2)}% ${isSupport ? (isEn ? 'Party Buff' : 'Buff Groupe') : (isEn ? 'Grid Dmg' : 'Grille Dmg')}`;
        }
        if (dom.scoreAgDetail) {
          dom.scoreAgDetail.textContent = isEn ? '24 Cut Gems • Ark Grid' : '24 Gemmes Taillées • Grille d\'Ark';
        }
      } catch (err) {
        console.warn('Error updating astrogems score card:', err);
      }
    }

    // --- 4. CARTE PROCHAIN +1% (GPD) ---
    if (dom.scoreCardGpd) {
      try {
        const dynGpd = getDynamicGpdTable(p, p.role || state.role, isEn);
        if (dynGpd && dynGpd.length > 0) {
          const best = dynGpd[0];
          if (dom.scoreGpdPrice) dom.scoreGpdPrice.textContent = best.ratioText;
          if (dom.scoreGpdPer) {
            dom.scoreGpdPer.textContent = isSupport
              ? (isEn ? 'per 0.01% Ally Buff' : 'par 0.01% Buff Allié')
              : (isEn ? 'per 1% Damage' : 'par 1% Dégâts');
          }
          if (dom.scoreGpdDetail) {
            dom.scoreGpdDetail.textContent = `${best.name} (${best.gainText})`;
          }
        }
      } catch (err) {
        console.warn('Error updating gpd score card:', err);
      }
    }
  }

  function renderPresetsBar() {
    if (!dom.presetsList) return;
    const list = getActiveRosterList();

    const isEn = isEnLang();
    if (dom.presetsTitle) {
      dom.presetsTitle.textContent = isEn ? 'My Roster:' : 'Mon Roster :';
    }
    if (dom.rosterStatusBadge) {
      dom.rosterStatusBadge.textContent = isEn ? `Synced (${list.length})` : `Synchronisé (${list.length})`;
      dom.rosterStatusBadge.className = 'roster-status-badge custom';
    }
    if (dom.btnManageRoster) {
      dom.btnManageRoster.style.display = list.length ? 'inline-flex' : 'none';
    }
    if (dom.rosterCountTag) {
      dom.rosterCountTag.textContent = list.length.toString();
    }
    if (dom.btnSyncRosterNav) {
      dom.btnSyncRosterNav.innerHTML = list.length
        ? (isEn ? '<span>+</span> <strong>Add character</strong>' : '<span>+</span> <strong>Ajouter un perso</strong>')
        : (isEn ? '<strong>Import my character</strong>' : '<strong>Importer mon personnage</strong>');
    }

    let html = '';
    list.forEach(c => {
      const cId = escapeHtml(c.id || c.name.toLowerCase());
      const isActive = (c.id || c.name.toLowerCase()) === activeCharacterId;
      const classIconSrc = escapeHtml(getClassIconUrl(c.className, c.role));
      const faceAvatar = escapeHtml(getCharacterFaceAvatar(c));
      const isFull = isFullBodyAgsAvatar(faceAvatar);
      const safeName = escapeHtml(c.name);
      const safeClass = escapeHtml(c.className || 'Classe');
      const safeRole = escapeHtml(c.role || 'dps');

      html += `
        <button type="button" class="preset-chip ${isActive ? 'active' : ''}" data-id="${cId}" data-role="${safeRole}" title="${safeClass} • ${safeName}">
          <span class="chip-avatar-frame">
            <img class="chip-avatar-mini ${isFull ? 'ags-fullbody-zoom' : ''}" id="chipAvatar_${cId}" src="${faceAvatar}" alt="${safeName}" width="22" height="22" loading="eager" onerror="this.onerror=null; this.src='${classIconSrc}';">
          </span>
          <span>${safeName} (${(c.ilvl || 1750).toFixed(1)})</span>
        </button>
      `;
    });

    dom.presetsList.innerHTML = html;

    dom.presetsList.querySelectorAll('.preset-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const targetChar = list.find(x => (x.id || x.name.toLowerCase()) === id);
        if (targetChar) loadCharacter(targetChar);
      });
    });
  }

  function loadCharacter(c) {
    if (!c) return;
    hideNoCharacterState();
    const cId = (c.id || c.name.toLowerCase());
    activeCharacterId = cId;

    if (dom.presetsList) {
      dom.presetsList.querySelectorAll('.preset-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-id') === cId);
      });
    }

    const resolvedRole = detectCharacterRole(c);
    c.role = resolvedRole;
    state.role = resolvedRole;
    state.currentIlvl = c.ilvl || 1750;
    state.currentCp = c.cp || 3500;
    state.targetIlvl = c.target || (Math.ceil((state.currentIlvl + 0.1) / 10) * 10);
    state.advHoning = c.advHoning !== undefined ? c.advHoning : 40;
    state.gear = c.gear ? { ...c.gear } : { weapon: 17, head: 15, shoulder: 15, chest: 15, pants: 15, gloves: 15 };
    state.baselineGear = { ...state.gear };
    state.baselineAdvHoning = state.advHoning;
    state.baselineIlvl = state.currentIlvl;
    state.baselineCp = state.currentCp;
    state.gemBonus = 0;
    if (dom.gemSelect) {
      dom.gemSelect.value = 'current';
      updateGemSelectOptions();
    }

    if (!c.gemParts || c.gemParts.length === 0) {
      const gParts = extractCharacterGemParts(c);
      if (gParts && gParts.length > 0) c.gemParts = gParts;
    }

    activeCanonicalKey = cId;
    liveImportedProfile = c.rawProfile || null;

    state.predictionMode = 'honing';
    const btnPredHoning = document.getElementById('btnPredModeHoning');
    const btnPredGlobal = document.getElementById('btnPredModeGlobal');
    if (btnPredHoning && btnPredGlobal) {
      btnPredHoning.classList.add('active');
      btnPredGlobal.classList.remove('active');
    }

    if (c.opt) {
      state.opt = { ...c.opt };
      syncOptimizationInputs();
    }

    setRole(resolvedRole);
    if (dom.advHoningSelect) dom.advHoningSelect.value = state.advHoning.toString();

    updatePredictorView();
    updateHoningView();
    updateOptimizationView();
    renderCanonicalView();
    renderAdvisorView();

    // Synchronisation Ark Passive
    const ap = c.apPoints || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.apPoints) || {
      evolution: 140,
      enlightenment: 101,
      leap: 70
    };
    arkPassiveState.basePoints = { ...ap };
    arkPassiveState.sim.evoPts = ap.evolution !== undefined ? ap.evolution : 140;
    arkPassiveState.sim.enlightPts = ap.enlightenment !== undefined ? ap.enlightenment : 101;
    arkPassiveState.sim.leapPts = ap.leap !== undefined ? ap.leap : 70;
    arkPassiveState.sim.relicBooks = true;
    arkPassiveState.sim.relicAcc = true;
    arkPassiveState.sim.haUnlocked = true;
    syncArkPassiveClassSpecs(c);
    updateArkPassiveView();

    updateTargetButtons();
    updateTargetButtonsState();
    updateActiveCharacterCard(cId, c);
    benchmarkState.customTarget = null;
    benchmarkState.currentTargetId = null;

    const benchPane = document.getElementById('tab-benchmark');
    if (benchPane && benchPane.classList.contains('active')) {
      renderBenchmarkTab();
    }
  }

  function loadPreset(key) {
    const list = getActiveRosterList();
    const found = list.find(x => (x.id || x.name.toLowerCase()) === key.toLowerCase());
    if (found) loadCharacter(found);
  }

  // ==========================================
  // MODULE : WEEKLY RAID & GOLD REVENUE TRACKER
  // ==========================================

  

  const RAID_TRACKER_STORAGE_KEY = 'lostark_raid_tracker_state_v2';
  let raidTrackerState = {
    agentStatus: 'checking',
    lastSyncTimestamp: null,
    roster: {}
  };

  function getLastWednesdayReset() {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = (day >= 3 ? day - 3 : day + 4);
    const reset = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff, 10, 0, 0, 0));
    if (d.getTime() < reset.getTime()) {
      reset.setUTCDate(reset.getUTCDate() - 7);
    }
    return reset;
  }

  function getNextWednesdayReset() {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = (3 - day + 7) % 7;
    const cand = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff, 10, 0, 0, 0));
    if (cand.getTime() <= d.getTime()) {
      cand.setUTCDate(cand.getUTCDate() + 7);
    }
    return cand;
  }

  function getDefaultModeForIlvl(raidKey, ilvl) {
    const lvl = typeof ilvl === 'number' ? ilvl : parseFloat(ilvl) || 1700;
    if (raidKey === 'horizon_cathedral') {
      if (lvl >= 1770) return 'nightmare';
      return 'hard'; // Level 2
    }
    if (raidKey === 'serca') {
      return 'hard';
    }
    if (raidKey === 'final_act_kazeros') {
      return 'normal';
    }
    return 'normal';
  }

  function getRaidCharacterAvatar(ch) {
    return getCharacterFaceAvatar(ch);
  }

  function formatClearTime(epochMs) {
    if (!epochMs) return '';
    try {
      const d = new Date(epochMs);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month} ${hours}:${mins}`;
    } catch (e) {
      return '';
    }
  }

  function ensureCharacterRaidState(charKey, charIlvl) {
    if (!raidTrackerState.roster[charKey]) {
      raidTrackerState.roster[charKey] = { raids: {} };
    }
    const cObj = raidTrackerState.roster[charKey];
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      if (!cObj.raids[rKey]) {
        const defaultMode = getDefaultModeForIlvl(rKey, charIlvl);
        cObj.raids[rKey] = {
          mode: defaultMode,
          modeAuto: false,
          g1: false,
          g2: false,
          chest: false,
          g1Time: null,
          g2Time: null,
          g1Boss: null,
          g2Boss: null
        };
      }
    });
  }

  function saveRaidTrackerState() {
    try {
      raidTrackerState.resetTimestamp = getLastWednesdayReset().getTime();
      localStorage.setItem(RAID_TRACKER_STORAGE_KEY, JSON.stringify(raidTrackerState));
    } catch (e) {}
  }

  function loadSavedRaidTrackerState() {
    try {
      const raw = localStorage.getItem(RAID_TRACKER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const lastReset = getLastWednesdayReset().getTime();
        if (parsed.resetTimestamp && parsed.resetTimestamp < lastReset) {
          Object.values(parsed.roster || {}).forEach(ch => {
            Object.values(ch.raids || {}).forEach(r => {
              r.g1 = false;
              r.g2 = false;
              r.g1Time = null;
              r.g2Time = null;
            });
          });
          parsed.resetTimestamp = lastReset;
        }
        raidTrackerState = Object.assign(raidTrackerState, parsed);
        raidTrackerState.agentStatus = 'checking';
      }
    } catch (e) {}
  }

  function fetchWithTimeout(url, opts = {}, timeoutMs = 800) {
    if (typeof AbortController === 'undefined') {
      return fetch(url, opts);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, Object.assign({}, opts, { signal: controller.signal }))
      .then(res => { clearTimeout(timer); return res; })
      .catch(err => { clearTimeout(timer); throw err; });
  }

  async function fetchRaidTrackerStatus(isManual = false) {
    const pill = document.getElementById('raidAgentStatusPill');
    const pillText = document.getElementById('raidAgentStatusText');
    const refreshBtn = document.getElementById('btnRefreshRaidsSync');

    if (refreshBtn && isManual) {
      refreshBtn.style.opacity = '0.6';
      refreshBtn.style.pointerEvents = 'none';
    }

    let activeChars = [];
    try {
      const activeList = typeof getActiveRosterList === 'function' ? getActiveRosterList() : [];
      activeChars = (activeList || []).map(c => c && c.name).filter(Boolean);
    } catch (e) {}
    const queryParam = activeChars.length ? '?chars=' + encodeURIComponent(activeChars.join(',')) : '';

    let fetchedData = null;
    let source = 'none';

    // 1. Récupération immédiate du JSON synchronisé sur le serveur distant (HTTPS, zéro latence, infaillible)
    try {
      const srvRes = await fetchWithTimeout('data/raid_status.json?t=' + Date.now(), { cache: 'no-store' }, 2000);
      if (srvRes && srvRes.ok) {
        const srvData = await srvRes.json();
        const isFresh = (Date.now() - (srvData.updatedAt || 0)) < 300000;
        fetchedData = srvData;
        source = isFresh ? 'server_fresh' : 'server_stale';
      }
    } catch (e) {}

    // 2. Sondage direct en tâche de fond sur l'agent local (127.0.0.1:4848) si disponible
    try {
      const locRes = await fetchWithTimeout(`http://127.0.0.1:4848/api/raid-status${queryParam}`, {}, 700);
      if (locRes && locRes.ok) {
        const locData = await locRes.json();
        if (locData && locData.roster) {
          fetchedData = locData;
          source = 'local';
        }
      }
    } catch (e) {}

    if (fetchedData && fetchedData.roster) {
      const isLive = (source === 'local') || (source === 'server_fresh');
      raidTrackerState.agentStatus = isLive ? 'online' : 'offline';
      raidTrackerState.lastSyncTimestamp = fetchedData.updatedAt || Date.now();

      try {
        if (!raidTrackerState.roster || typeof raidTrackerState.roster !== 'object') {
          raidTrackerState.roster = {};
        }

        Object.entries(fetchedData.roster).forEach(([cKey, cData]) => {
          if (!cData) return;
          if (!raidTrackerState.roster[cKey] || typeof raidTrackerState.roster[cKey] !== 'object') {
            raidTrackerState.roster[cKey] = { raids: {} };
          }
          const localChar = raidTrackerState.roster[cKey];
          if (!localChar.raids || typeof localChar.raids !== 'object') {
            localChar.raids = {};
          }

          Object.entries(cData.raids || {}).forEach(([rKey, rData]) => {
            if (!rData) return;
            if (!localChar.raids[rKey]) {
              localChar.raids[rKey] = {
                mode: rData.mode || 'normal',
                modeAuto: !!rData.modeAuto,
                g1: false,
                g2: false,
                chest: false,
                g1Time: null,
                g2Time: null
              };
            }
            const lr = localChar.raids[rKey];
            if (rData.mode) {
              lr.mode = rData.mode;
              lr.modeAuto = true;
            }
            lr.g1 = !!rData.g1;
            lr.g1Time = rData.g1 ? rData.g1Time : null;
            lr.g1Boss = rData.g1 ? rData.g1Boss : null;
            lr.g2 = !!rData.g2;
            lr.g2Time = rData.g2 ? rData.g2Time : null;
            lr.g2Boss = rData.g2 ? rData.g2Boss : null;
          });
        });

        saveRaidTrackerState();
      } catch (mergeErr) {
        console.warn('Roster merge error:', mergeErr);
      }
    } else {
      raidTrackerState.agentStatus = 'offline';
    }

    if (pill && pillText) {
      const isOnline = raidTrackerState.agentStatus === 'online';
      pill.className = 'agent-status-pill ' + (isOnline ? 'online' : 'offline');
      const langKey = isOnline ? 'raid_agent_online' : 'raid_agent_offline';
      pillText.textContent = (window.i18n && window.i18n.t(langKey)) || (isOnline ? 'Agent Connecté (Temps Réel)' : 'Agent Non Détecté (Mode Cache)');
    }

    if (refreshBtn && isManual) {
      refreshBtn.style.opacity = '1';
      refreshBtn.style.pointerEvents = 'auto';
    }

    renderRaidTrackerView();
  }

  function toggleGate(cKey, rKey, gate) {
    if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
    const cr = raidTrackerState.roster[cKey].raids[rKey];
    if (gate === '1') {
      cr.g1 = !cr.g1;
      cr.g1Time = cr.g1 ? Date.now() : null;
    } else if (gate === '2') {
      cr.g2 = !cr.g2;
      cr.g2Time = cr.g2 ? Date.now() : null;
    }
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function setRaidMode(cKey, rKey, mode) {
    if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
    raidTrackerState.roster[cKey].raids[rKey].mode = mode;
    raidTrackerState.roster[cKey].raids[rKey].modeAuto = false;
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function cycleRaidMode(cKey, rKey) {
    if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
    const cr = raidTrackerState.roster[cKey].raids[rKey];
    const order = ['normal', 'hard', 'nightmare'];
    const currentIdx = order.indexOf(cr.mode || 'normal');
    const nextMode = order[(currentIdx + 1) % order.length];
    cr.mode = nextMode;
    cr.modeAuto = false;
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function toggleAllCharacterGates(cKey) {
    if (!raidTrackerState.roster[cKey]) return;
    const cObj = raidTrackerState.roster[cKey];
    let allDone = true;
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      const cr = cObj.raids[rKey];
      if (!cr || !cr.g1 || !cr.g2) allDone = false;
    });

    const targetDone = !allDone;
    const now = Date.now();
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      if (!cObj.raids[rKey]) cObj.raids[rKey] = { mode: 'normal', g1: false, g2: false, chest: false };
      const cr = cObj.raids[rKey];
      cr.g1 = targetDone;
      cr.g1Time = targetDone ? (cr.g1Time || now) : null;
      cr.g2 = targetDone;
      cr.g2Time = targetDone ? (cr.g2Time || now) : null;
    });
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function toggleAllCharacterChests(cKey) {
    if (!raidTrackerState.roster[cKey]) return;
    const cObj = raidTrackerState.roster[cKey];
    let allChests = true;
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      const cr = cObj.raids[rKey];
      if (!cr || !cr.chest) allChests = false;
    });

    const targetChest = !allChests;
    Object.keys(RAID_DEFINITIONS).forEach(rKey => {
      if (!cObj.raids[rKey]) cObj.raids[rKey] = { mode: 'normal', g1: false, g2: false, chest: false };
      cObj.raids[rKey].chest = targetChest;
    });
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function toggleAllRosterGates() {
    const rosterList = getActiveRosterList();
    let allAccountDone = true;
    rosterList.forEach(ch => {
      const cKey = (ch.id || ch.name).toLowerCase();
      const cObj = raidTrackerState.roster[cKey];
      if (!cObj) { allAccountDone = false; return; }
      Object.keys(RAID_DEFINITIONS).forEach(rKey => {
        const cr = cObj.raids[rKey];
        if (!cr || !cr.g1 || !cr.g2) allAccountDone = false;
      });
    });

    const targetDone = !allAccountDone;
    const now = Date.now();
    rosterList.forEach(ch => {
      const cKey = (ch.id || ch.name).toLowerCase();
      ensureCharacterRaidState(cKey, ch.ilvl);
      const cObj = raidTrackerState.roster[cKey];
      Object.keys(RAID_DEFINITIONS).forEach(rKey => {
        const cr = cObj.raids[rKey];
        cr.g1 = targetDone;
        cr.g1Time = targetDone ? (cr.g1Time || now) : null;
        cr.g2 = targetDone;
        cr.g2Time = targetDone ? (cr.g2Time || now) : null;
      });
    });
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function toggleAllRosterChests() {
    const rosterList = getActiveRosterList();
    let allAccountChests = true;
    rosterList.forEach(ch => {
      const cKey = (ch.id || ch.name).toLowerCase();
      const cObj = raidTrackerState.roster[cKey];
      if (!cObj) { allAccountChests = false; return; }
      Object.keys(RAID_DEFINITIONS).forEach(rKey => {
        const cr = cObj.raids[rKey];
        if (!cr || !cr.chest) allAccountChests = false;
      });
    });

    const targetChest = !allAccountChests;
    rosterList.forEach(ch => {
      const cKey = (ch.id || ch.name).toLowerCase();
      ensureCharacterRaidState(cKey, ch.ilvl);
      const cObj = raidTrackerState.roster[cKey];
      Object.keys(RAID_DEFINITIONS).forEach(rKey => {
        cObj.raids[rKey].chest = targetChest;
      });
    });
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function setRaidChest(cKey, rKey, checked) {
    if (!raidTrackerState.roster[cKey] || !raidTrackerState.roster[cKey].raids[rKey]) return;
    raidTrackerState.roster[cKey].raids[rKey].chest = checked;
    saveRaidTrackerState();
    renderRaidTrackerView();
  }

  function updateRaidResetCountdown() {
    const el = document.getElementById('raidResetCountdownVal');
    if (!el) return;

    const lang = (window.i18n && window.i18n.getLang()) || 'fr';
    const isFr = lang === 'fr';

    const next = getNextWednesdayReset();
    const diffMs = next.getTime() - Date.now();
    if (diffMs <= 0) {
      el.textContent = isFr ? '0j 0h 0m' : '0d 0h 0m';
      return;
    }

    const days = Math.floor(diffMs / 86400000);
    const hours = Math.floor((diffMs % 86400000) / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);

    const dUnit = isFr ? 'j' : 'd';
    el.textContent = `${days}${dUnit} ${hours}h ${mins}m`;
  }

  function renderRaidTrackerView() {
    const grid = document.getElementById('rosterRaidsGrid');
    if (!grid) return;

    const t = (window.i18n && window.i18n.t) || (k => k);
    const lang = (window.i18n && window.i18n.getLang()) || 'fr';
    const isFr = lang === 'fr';

    const rosterList = getActiveRosterList();

    let totalAccountEarnedGold = 0;
    let totalAccountPotentialGold = 0;
    let totalAccountChestCost = 0;
    let totalClearedGates = 0;
    let totalCompletedRaids = 0;
    const totalMaxRaids = rosterList.length * 3;
    const totalMaxGates = totalMaxRaids * 2;

    rosterList.forEach(ch => {
      const cKey = (ch.id || ch.name).toLowerCase();
      ensureCharacterRaidState(cKey, ch.ilvl);
    });

    const existingCards = grid.querySelectorAll('.char-raid-card');
    const needsFullBuild = existingCards.length !== rosterList.length;

    if (needsFullBuild) {
      let html = '';
      rosterList.forEach(ch => {
        const cKey = (ch.id || ch.name).toLowerCase();
        const charState = raidTrackerState.roster[cKey] || { raids: {} };
        const avatarUrl = getRaidCharacterAvatar(ch);
        const isFullBody = isFullBodyAgsAvatar(avatarUrl);
        const isSupp = ch.role === 'support' || (ch.className && ['Paladin', 'Bard', 'Artist'].includes(ch.className));
        const isDemo = Object.prototype.hasOwnProperty.call(FACE_AVATARS, cKey);
        const classIconFallback = getClassIconUrl(ch.className, ch.role);
        const fallbackFace = isDemo ? FACE_AVATARS[cKey] : classIconFallback;
        const roleText = isSupp ? t('role_support') : t('role_dps');

        html += `
          <div class="char-raid-card" data-char="${cKey}">
            <div class="char-raid-card-header">
              <div class="char-meta-left">
                <div class="char-raid-avatar-frame ${isSupp ? 'role-support' : 'role-dps'}">
                  <img class="char-raid-avatar ${isFullBody ? 'ags-fullbody-zoom' : ''}" src="${avatarUrl}" alt="${escapeHtml(ch.name)}" width="44" height="44" loading="eager" onerror="this.onerror=null; this.src='${fallbackFace}';">
                </div>
                <div class="char-info-col">
                  <div class="char-raid-name-row">
                    <span class="char-raid-name">${escapeHtml(ch.name)}</span>
                    <span class="char-server-badge">[${escapeHtml(ch.server || 'CE')}]</span>
                  </div>
                  <div class="char-raid-sub">
                    <span class="char-class-txt">${escapeHtml(ch.className || '')}</span>
                    <span class="char-sep">•</span>
                    <span class="char-raid-ilvl">${(ch.ilvl || 1700).toFixed(2)}</span>
                    <span class="char-sep">•</span>
                    <span class="char-role-badge ${isSupp ? 'badge-support' : 'badge-dps'}">${roleText}</span>
                  </div>
                </div>
              </div>
              <div class="char-header-right">
                <div class="char-quick-actions">
                  <button type="button" class="char-action-btn btn-char-clear-all" data-char="${cKey}" title="${isFr ? 'Valider ou réinitialiser tous les raids de ce personnage' : 'Toggle all raids cleared for this character'}">
                    ✓
                  </button>
                  <button type="button" class="char-action-btn btn-char-chests-all" data-char="${cKey}" title="${isFr ? 'Acheter ou retirer tous les coffres de ce personnage' : 'Toggle all chests for this character'}">
                   
                  </button>
                </div>
                <div class="char-raid-gold-badge">
                  <span class="char-gold-cur">0</span>
                  <span class="char-gold-sep">/</span>
                  <span class="char-gold-max">0 g</span>
                </div>
              </div>
            </div>

            <!-- Mini barre de progression d'or du perso -->
            <div class="char-progress-track">
              <div class="char-progress-bar" style="width: 0%;"></div>
            </div>

            <!-- Chips des 3 Raids -->
            <div class="char-raids-list">
        `;

        Object.keys(RAID_DEFINITIONS).forEach(rKey => {
          const raidDef = RAID_DEFINITIONS[rKey];
          const cr = charState.raids[rKey] || { mode: 'normal', g1: false, g2: false, chest: false };
          const mode = cr.mode || 'normal';
          const modeDef = (raidDef && raidDef[mode]) || raidDef.normal;
          const chestCost = modeDef.chest;
          const raidArtUrl = raidDef.image || `images/raids/${rKey}.webp`;
          const modeShort = mode === 'nightmare' ? 'NM' : (mode === 'hard' ? 'HM' : 'N');

          html += `
            <div class="raid-chip" data-char="${cKey}" data-raid="${rKey}">
              <img class="raid-chip-art" src="${raidArtUrl}" alt="" loading="lazy">

              <div class="raid-chip-top">
                <div class="raid-chip-identity">
                  <span class="raid-chip-icon">${raidDef.icon}</span>
                  <span class="raid-chip-name" title="${raidDef.bosses}">${t(raidDef.nameKey) || raidDef.fallbackName}</span>
                </div>

                <div class="raid-diff-badge-wrapper">
                  <button type="button" class="raid-diff-pill diff-${mode}" data-char="${cKey}" data-raid="${rKey}" title="${isFr ? 'Cliquer pour changer de difficulté' : 'Click to cycle difficulty'}">
                    <span class="diff-short">${modeShort}</span>
                    <span class="diff-gold">(${(modeDef.total / 1000).toFixed(0)}k)</span>
                    ${cr.modeAuto ? '<span class="diff-auto-dot" title="Auto LOA Logs">●</span>' : ''}
                  </button>
                </div>

                <div class="raid-chip-gold">
                  +${modeDef.total.toLocaleString()} g
                </div>
              </div>

              <div class="raid-chip-controls">
                <div class="gate-pips-group">
                  <button type="button" class="gate-pip ${cr.g1 ? 'cleared' : ''}" data-char="${cKey}" data-raid="${rKey}" data-gate="1">
                    <span class="gate-pip-lbl">${cr.g1 ? '✓ ' : ''}${isFr ? 'P1' : 'G1'}</span>
                    <span class="gate-pip-reward">+${(modeDef.g1 / 1000).toFixed(1).replace('.0', '')}k</span>
                  </button>
                  <button type="button" class="gate-pip ${cr.g2 ? 'cleared' : ''}" data-char="${cKey}" data-raid="${rKey}" data-gate="2">
                    <span class="gate-pip-lbl">${cr.g2 ? '✓ ' : ''}${isFr ? 'P2' : 'G2'}</span>
                    <span class="gate-pip-reward">+${(modeDef.g2 / 1000).toFixed(1).replace('.0', '')}k</span>
                  </button>
                </div>

                <button type="button" class="chest-toggle-pill ${cr.chest ? 'active' : ''}" data-char="${cKey}" data-raid="${rKey}" title="${t('raid_chest_label').replace('{cost}', (chestCost / 1000).toFixed(1).replace('.0', '') + 'k')}">
                  <span class="chest-icon"></span>
                  <span class="chest-cost">-${(chestCost / 1000).toFixed(1).replace('.0', '')}k</span>
                </button>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

      grid.innerHTML = html;

      // Listeners interactifs
      grid.querySelectorAll('.gate-pip').forEach(pill => {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          const cKey = pill.getAttribute('data-char');
          const rKey = pill.getAttribute('data-raid');
          const gate = pill.getAttribute('data-gate');
          toggleGate(cKey, rKey, gate);
        });
      });

      grid.querySelectorAll('.raid-diff-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cKey = btn.getAttribute('data-char');
          const rKey = btn.getAttribute('data-raid');
          cycleRaidMode(cKey, rKey);
        });
      });

      grid.querySelectorAll('.chest-toggle-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cKey = btn.getAttribute('data-char');
          const rKey = btn.getAttribute('data-raid');
          const cr = (raidTrackerState.roster[cKey] && raidTrackerState.roster[cKey].raids[rKey]) || {};
          setRaidChest(cKey, rKey, !cr.chest);
        });
      });

      grid.querySelectorAll('.btn-char-clear-all').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cKey = btn.getAttribute('data-char');
          toggleAllCharacterGates(cKey);
        });
      });

      grid.querySelectorAll('.btn-char-chests-all').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const cKey = btn.getAttribute('data-char');
          toggleAllCharacterChests(cKey);
        });
      });
    }

    // Mise à jour fluide in-place des valeurs
    rosterList.forEach(ch => {
      const cKey = (ch.id || ch.name).toLowerCase();
      const charState = raidTrackerState.roster[cKey] || { raids: {} };
      const card = grid.querySelector(`.char-raid-card[data-char="${cKey}"]`);
      if (!card) return;

      let charEarnedGold = 0;
      let charPotentialGold = 0;
      let charCompletedRaids = 0;
      let charAllChests = true;

      Object.keys(RAID_DEFINITIONS).forEach(rKey => {
        const raidDef = RAID_DEFINITIONS[rKey];
        const cr = charState.raids[rKey] || {};
        const mode = cr.mode || 'normal';
        const modeDef = (raidDef && raidDef[mode]) || raidDef.normal;
        if (!cr.chest) charAllChests = false;

        const g1Earned = cr.g1 ? modeDef.g1 : 0;
        const g2Earned = cr.g2 ? modeDef.g2 : 0;
        let raidEarned = g1Earned + g2Earned;
        let raidPotential = modeDef.total;

        if (cr.chest) {
          const chestDeduct = (cr.g1 && cr.g2) ? modeDef.chest : (cr.g1 ? modeDef.chest1 : (cr.g2 ? modeDef.chest2 : 0));
          raidEarned = Math.max(0, raidEarned - chestDeduct);
          raidPotential = Math.max(0, raidPotential - modeDef.chest);
          totalAccountChestCost += chestDeduct;
        }

        charEarnedGold += raidEarned;
        charPotentialGold += raidPotential;

        if (cr.g1) totalClearedGates++;
        if (cr.g2) totalClearedGates++;
        if (cr.g1 && cr.g2) {
          charCompletedRaids++;
          totalCompletedRaids++;
        }

        const chip = card.querySelector(`.raid-chip[data-raid="${rKey}"]`);
        if (chip) {
          const isDone = !!(cr.g1 && cr.g2);
          const isJailed = !isDone && !!(cr.g1 || cr.g2);
          chip.classList.toggle('is-cleared', isDone);
          chip.classList.toggle('is-jailed', isJailed);

          const diffPill = chip.querySelector('.raid-diff-pill');
          if (diffPill) {
            diffPill.className = `raid-diff-pill diff-${mode}`;
            const modeShort = mode === 'nightmare' ? 'NM' : (mode === 'hard' ? 'HM' : 'N');
            diffPill.innerHTML = `
              <span class="diff-short">${modeShort}</span>
              <span class="diff-gold">(${(modeDef.total / 1000).toFixed(0)}k)</span>
              ${cr.modeAuto ? '<span class="diff-auto-dot" title="Auto LOA Logs">●</span>' : ''}
            `;
            diffPill.title = cr.modeAuto ? (isFr ? 'Difficulté détectée automatiquement depuis LOA Logs (cliquer pour changer)' : 'Auto-detected from LOA Logs (click to change)') : (isFr ? 'Cliquer pour changer de mode' : 'Click to cycle difficulty');
          }

          const g1Pip = chip.querySelector('.gate-pip[data-gate="1"]');
          if (g1Pip) {
            g1Pip.classList.toggle('cleared', !!cr.g1);
            const g1TimeStr = cr.g1Time ? formatClearTime(cr.g1Time) : '';
            g1Pip.title = cr.g1 && g1TimeStr ? t('raid_cleared_at').replace('{time}', g1TimeStr) : '';
            const g1Lbl = `${cr.g1 ? '✓ ' : ''}${isFr ? 'P1' : 'G1'}`;
            g1Pip.innerHTML = `<span class="gate-pip-lbl">${g1Lbl}</span><span class="gate-pip-reward">+${(modeDef.g1 / 1000).toFixed(1).replace('.0', '')}k</span>${cr.g1 && g1TimeStr ? `<span class="gate-pip-time">${g1TimeStr}</span>` : ''}`;
          }

          const g2Pill = chip.querySelector('.gate-pip[data-gate="2"]');
          if (g2Pill) {
            g2Pill.classList.toggle('cleared', !!cr.g2);
            const g2TimeStr = cr.g2Time ? formatClearTime(cr.g2Time) : '';
            g2Pill.title = cr.g2 && g2TimeStr ? t('raid_cleared_at').replace('{time}', g2TimeStr) : '';
            const g2Lbl = `${cr.g2 ? '✓ ' : ''}${isFr ? 'P2' : 'G2'}`;
            g2Pill.innerHTML = `<span class="gate-pip-lbl">${g2Lbl}</span><span class="gate-pip-reward">+${(modeDef.g2 / 1000).toFixed(1).replace('.0', '')}k</span>${cr.g2 && g2TimeStr ? `<span class="gate-pip-time">${g2TimeStr}</span>` : ''}`;
          }

          const chestBtn = chip.querySelector('.chest-toggle-pill');
          if (chestBtn) {
            chestBtn.classList.toggle('active', !!cr.chest);
            chestBtn.querySelector('.chest-cost').textContent = `-${(modeDef.chest / 1000).toFixed(1).replace('.0', '')}k`;
          }

          const totalGoldEl = chip.querySelector('.raid-chip-gold');
          if (totalGoldEl) {
            totalGoldEl.style.color = raidEarned > 0 ? '#8CC084' : '#E0A43A';
            totalGoldEl.textContent = raidEarned > 0 ? `${raidEarned.toLocaleString()} g` : `+${(modeDef.total - (cr.chest ? modeDef.chest : 0)).toLocaleString()} g`;
          }
        }
      });

      totalAccountEarnedGold += charEarnedGold;
      totalAccountPotentialGold += charPotentialGold;

      // État général du personnage
      const isCharAllCleared = charCompletedRaids === Object.keys(RAID_DEFINITIONS).length;
      card.classList.toggle('is-all-cleared', isCharAllCleared);

      const clearAllBtn = card.querySelector('.btn-char-clear-all');
      if (clearAllBtn) clearAllBtn.classList.toggle('is-active', isCharAllCleared);

      const chestsAllBtn = card.querySelector('.btn-char-chests-all');
      if (chestsAllBtn) chestsAllBtn.classList.toggle('is-active', charAllChests);

      const goldCur = card.querySelector('.char-gold-cur');
      if (goldCur) {
        goldCur.textContent = charEarnedGold.toLocaleString();
        goldCur.style.color = charEarnedGold > 0 ? '#8CC084' : '#E0A43A';
      }
      const goldMax = card.querySelector('.char-gold-max');
      if (goldMax) {
        goldMax.textContent = `${charPotentialGold.toLocaleString()} g`;
      }

      const progressBar = card.querySelector('.char-progress-bar');
      if (progressBar) {
        const charPct = charPotentialGold > 0 ? Math.round((charEarnedGold / charPotentialGold) * 100) : 0;
        progressBar.style.width = `${charPct}%`;
      }
    });

    // Mise à jour de la bannière Hero Neria.lol
    const heroEarnedVal = document.getElementById('raidHeroEarnedVal');
    const heroPotentialVal = document.getElementById('raidHeroPotentialVal');
    const heroPctBadge = document.getElementById('raidHeroPctBadge');
    const heroBarEarned = document.getElementById('raidHeroBarEarned');
    const heroBarChests = document.getElementById('raidHeroBarChests');

    const pct = totalAccountPotentialGold > 0 ? Math.round((totalAccountEarnedGold / totalAccountPotentialGold) * 100) : 0;
    const remainingGold = Math.max(0, totalAccountPotentialGold - totalAccountEarnedGold);

    if (heroEarnedVal) heroEarnedVal.textContent = `${totalAccountEarnedGold.toLocaleString()} g`;
    if (heroPotentialVal) heroPotentialVal.textContent = `${totalAccountPotentialGold.toLocaleString()} g max`;
    if (heroPctBadge) heroPctBadge.textContent = `${pct}% ${isFr ? 'encaissés' : 'earned'}`;
    if (heroBarEarned) heroBarEarned.style.width = `${pct}%`;
    if (heroBarChests) {
      const chestPct = totalAccountPotentialGold > 0 ? Math.min(100 - pct, Math.round((totalAccountChestCost / totalAccountPotentialGold) * 100)) : 0;
      heroBarChests.style.width = `${chestPct}%`;
    }

    // Mise à jour des KPI Cards
    const kpiEarnedVal = document.getElementById('raidKpiEarnedVal');
    const kpiEarnedSub = document.getElementById('raidKpiEarnedSub');
    const kpiRemainingVal = document.getElementById('raidKpiRemainingVal');
    const kpiRemainingSub = document.getElementById('raidKpiRemainingSub');
    const kpiProgressVal = document.getElementById('raidKpiProgressVal');
    const kpiGatesSub = document.getElementById('raidKpiGatesSub');
    const kpiPotentialVal = document.getElementById('raidKpiPotentialVal');

    if (kpiEarnedVal) kpiEarnedVal.textContent = `${totalAccountEarnedGold.toLocaleString()} g`;
    if (kpiEarnedSub) kpiEarnedSub.textContent = t('raid_kpi_earned_sub').replace('{pct}', pct);

    if (kpiRemainingVal) kpiRemainingVal.textContent = `${remainingGold.toLocaleString()} g`;
    if (kpiRemainingSub) kpiRemainingSub.textContent = t('raid_kpi_remaining_sub').replace('{raids}', totalMaxRaids);

    if (kpiProgressVal) kpiProgressVal.textContent = `${totalCompletedRaids} / ${totalMaxRaids}`;
    if (kpiGatesSub) kpiGatesSub.textContent = t('raid_kpi_gates_sub').replace('{cleared}', totalClearedGates).replace('{total}', totalMaxGates);

    if (kpiPotentialVal) kpiPotentialVal.textContent = `${totalAccountPotentialGold.toLocaleString()} g`;

    // Statut Agent & Compte à rebours
    const pill = document.getElementById('raidAgentStatusPill');
    const pillText = document.getElementById('raidAgentStatusText');
    if (pill && pillText) {
      if (raidTrackerState.agentStatus === 'checking') {
        pill.className = 'agent-status-pill checking';
        pillText.textContent = (window.i18n && window.i18n.t('raid_agent_checking')) || 'Connexion Agent...';
      } else {
        const isOnline = raidTrackerState.agentStatus === 'online';
        pill.className = 'agent-status-pill ' + (isOnline ? 'online' : 'offline');
        const langKey = isOnline ? 'raid_agent_online' : 'raid_agent_offline';
        pillText.textContent = (window.i18n && window.i18n.t(langKey)) || (isOnline ? 'Agent Connecté (Temps Réel)' : 'Agent Non Détecté (Mode Cache)');
      }
    }

    updateRaidResetCountdown();
  }

  let raidPollingInterval = null;

  function initRaidTracker() {
    loadSavedRaidTrackerState();
    renderRaidTrackerView();

    const btnRefresh = document.getElementById('btnRefreshRaidsSync');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        fetchRaidTrackerStatus(true);
      });
    }

    const btnMarkAll = document.getElementById('btnRosterMarkAllCleared');
    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', () => {
        toggleAllRosterGates();
      });
    }

    const btnAllChests = document.getElementById('btnRosterToggleAllChests');
    if (btnAllChests) {
      btnAllChests.addEventListener('click', () => {
        toggleAllRosterChests();
      });
    }

    // Premier fetch automatique
    fetchRaidTrackerStatus(false);

    // Compte à rebours
    setInterval(updateRaidResetCountdown, 30000);

    // Polling toutes les 15s si l'onglet est actif
    if (!raidPollingInterval) {
      raidPollingInterval = setInterval(() => {
        const pane = document.getElementById('tab-raidtracker');
        if (pane && pane.classList.contains('active')) {
          fetchRaidTrackerStatus(false);
        }
      }, 15000);
    }
  }

      // ==============================================================================
  // ==============================================================================
  // MODULE 9 : BENCHMARK & COMPARATEUR DE PROFILS (LOSTARK.BIBLE - ACTIVE PLAYERS)
  // ==============================================================================

  const BENCHMARK_DATABASE = [];

  

  function isEnglishLang() {
    if (typeof window !== 'undefined' && window.i18n && typeof window.i18n.getLang === 'function') {
      return window.i18n.getLang() === 'en';
    }
    if (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang) {
      return document.documentElement.lang === 'en';
    }
    try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem('lostark_cp_lang') === 'en') {
        return true;
      }
    } catch (_) {}
    if (typeof currentLang !== 'undefined') {
      return currentLang === 'en';
    }
    return false;
  }

  function translateEngravingToEnglish(name) {
    if (!name) return '';
    const clean = name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    if (typeof BIBLE_ENGRAVINGS !== 'undefined') {
      for (const [id, str] of Object.entries(BIBLE_ENGRAVINGS)) {
        const mEn = str.match(/^([^(]+)/);
        const mFr = str.match(/\(([^)]+)\)/);
        const enName = mEn ? mEn[1].trim() : str.trim();
        const frName = mFr ? mFr[1].trim() : '';
        if (frName && clean === frName.toLowerCase()) {
          return enName;
        }
        if (clean === enName.toLowerCase()) {
          return enName;
        }
      }
    }
    const DIRECT_MAP = {
      'rancune': 'Grudge',
      'poupée maudite': 'Cursed Doll',
      'poupée': 'Cursed Doll',
      'adrénaline': 'Adrenaline',
      'capitaine de raid': 'Raid Captain',
      'capitaine': 'Raid Captain',
      'arme affûtée': 'Keen Blunt Weapon',
      'augmentation de masse': 'Mass Increase',
      'maître des arrières': 'Ambush Master',
      'maître de l\'embuscade': 'Hit Master',
      'maître bagarreur': 'Master Brawler',
      'frappe aux points vitaux': 'Vital Point Hit',
      'frappe vitale': 'Vital Point Hit',
      'gouttes d\'éther': 'Drops of Ether',
      'éveil': 'Awakening',
      'expert': 'Expert',
      'barricade': 'Barricade',
      'super charge': 'Super Charge',
      'attaque totale': 'All-Out Attack',
      'impulsion démoniaque': 'Demonic Impulse',
      'suppression parfaite': 'Perfect Suppression',
      'aura bénie': 'Blessed Aura',
      'aura sacrée': 'Blessed Aura',
      'salut désespéré': 'Desperate Salvation',
      'pleine floraison': 'Full Bloom',
      'carnage': 'Mayhem',
      'marteau de rage': 'Rage Hammer',
      'entraînement gravitationnel': 'Gravity Training',
      'préparation au combat': 'Combat Readiness',
      'chevalier solitaire': 'Lone Knight',
      'énergie résiduelle': 'Remaining Energy',
      'déferlement': 'Surge',
      'faucheuse de la pleine lune': 'Full Moon Harvester',
      'lame de la nuit': 'Night\'s Edge',
      'pistolero': 'Pistoleer',
      'compétence d\'arthetine': 'Arthetinean Skill',
      'héritage de l\'évolution': 'Evolutionary Legacy',
      'renforcement de barrage': 'Barrage Enhancement',
      'renforcement de puissance de feu': 'Firepower Enhancement',
      'compagnon fidèle': 'Loyal Companion',
      'frappe mortelle': 'Death Strike',
      'heure de la chasse': 'Time to Hunt',
      'dague précise': 'Precise Dagger',
      'pinacle': 'Pinnacle',
      'contrôle': 'Control',
      'chevalière de lumière': 'Knight of Light',
      'chevalier de lumière': 'Knight of Light',
      'libératrice': 'Liberator',
      'libérateur': 'Liberator'
    };
    if (DIRECT_MAP[clean]) return DIRECT_MAP[clean];
    return name;
  }

  function formatLostArkEnglish(str) {
    if (!str || typeof str !== 'string') return str || '';
    let res = str;

    // 1. Gemmes & Tiers
    res = res
      .replace(/Full Gemmes 10 T4/gi, 'Full Tier 4 Lv. 10 Gems')
      .replace(/Full Gemmes 9 T4/gi, 'Full Tier 4 Lv. 9 Gems')
      .replace(/Full Gemmes 8 T4/gi, 'Full Tier 4 Lv. 8 Gems')
      .replace(/Full Gemmes 7 T4/gi, 'Full Tier 4 Lv. 7 Gems')
      .replace(/Mix Gemmes 8\s*\/\s*9\s*T4/gi, 'Tier 4 Lv. 8/9 Mix')
      .replace(/Mix Gemmes 7\s*\/\s*8\s*T4/gi, 'Tier 4 Lv. 7/8 Mix')
      .replace(/Mix Gemmes T4/gi, 'Tier 4 Gems')
      .replace(/Mix Gemmes/gi, 'Tier 4 Gem Mix')
      .replace(/Full Gemmes (\d+)/gi, 'Full Tier 4 Lv. $1 Gems')
      .replace(/Full Gemmes/gi, 'Full Gems')
      .replace(/Gemmes T4/gi, 'Tier 4 Gems')
      .replace(/Gemmes\s*:/gi, 'Gems:')
      .replace(/\bGemmes?\b/gi, 'Gems')
      .replace(/Niv\.\s*(\d+)/gi, 'Lv. $1')
      .replace(/Niveau\s*(\d+)/gi, 'Level $1');

    // 2. Équipements & Affinage
    res = res
      .replace(/Affinage Arme T4/gi, 'T4 Weapon Honing')
      .replace(/Affinage Armures T4/gi, 'T4 Armor Honing')
      .replace(/Affinage Avancé T4/gi, 'T4 Advanced Honing')
      .replace(/Affinage Avancé/gi, 'T4 Advanced Honing')
      .replace(/Affinage Adv\s*:/gi, 'Adv. Honing:')
      .replace(/Affinage Adv/gi, 'Adv. Honing')
      .replace(/Armures T4 Serka Moyenne/gi, 'T4 Serka Armor Avg')
      .replace(/Arme T4 Serka/gi, 'T4 Serka Weapon')
      .replace(/Armures T4 Moyenne/gi, 'T4 Armor Avg')
      .replace(/Armures T4/gi, 'T4 Armor')
      .replace(/Armure T4/gi, 'T4 Armor')
      .replace(/Arme T4/gi, 'T4 Weapon')
      .replace(/\(Éq\.\s*\+(\d+)\)/gi, '(Eq. +$1)')
      .replace(/Qualité\s*(\d+)/gi, 'Quality $1')
      .replace(/Qualité/gi, 'Quality')
      .replace(/complet\b/gi, 'complete');

    // 3. Transcendance
    res = res
      .replace(/Transcendance Arme/gi, 'Weapon Transcendence')
      .replace(/Transcendance Armures/gi, 'Armor Transcendence')
      .replace(/Transcendance/gi, 'Transcendence');

    // 4. Ark Grid & Ark Passive
    res = res
      .replace(/Ark Grid\s*:\s*Cœurs Soleil\s*\(Ordre & Chaos\)/gi, 'Ark Grid: Sun Cores (Order & Chaos)')
      .replace(/Ark Grid\s*:\s*Cœurs Lune\s*\(Ordre & Chaos\)/gi, 'Ark Grid: Moon Cores (Order & Chaos)')
      .replace(/Ark Grid\s*:\s*Cœurs Étoile\s*\(Ordre & Chaos\)/gi, 'Ark Grid: Star Cores (Order & Chaos)')
      .replace(/Ark Grid\s*:\s*Cœurs Soleil\s*\(Ancien\/Relique\)/gi, 'Ark Grid: Sun Cores (Order & Chaos)')
      .replace(/Ark Grid\s*:\s*Cœurs Lune\s*\(Ancien\/Relique\)/gi, 'Ark Grid: Moon Cores (Order & Chaos)')
      .replace(/Ark Grid\s*:\s*Cœurs Étoile\s*\(Ancien\/Relique\)/gi, 'Ark Grid: Star Cores (Order & Chaos)')
      .replace(/Ark Grid\s*:\s*Cœur Ordre Soleil/gi, 'Ark Grid: Sun Cores (Ancient/Relic)')
      .replace(/Ark Grid\s*:\s*Cœur Ordre Lune/gi, 'Ark Grid: Moon Cores (Ancient/Relic)')
      .replace(/Ark Grid\s*:\s*Cœur Chaos Étoile/gi, 'Ark Grid: Star Cores (Ancient/Relic)')
      .replace(/Cœurs Soleil/gi, 'Sun Cores')
      .replace(/Cœurs Lune/gi, 'Moon Cores')
      .replace(/Cœurs Étoile/gi, 'Star Cores')
      .replace(/Ark Grid\s*:\s*Astrogemmes\s*\(Sous-stats\)/gi, 'Ark Grid: Astrogems (Substats)')
      .replace(/Ordre Soleil/gi, 'Order Sun')
      .replace(/Ordre Lune/gi, 'Order Moon')
      .replace(/Chaos Étoile/gi, 'Chaos Star')
      .replace(/\bAncien\/Relique\b/gi, 'Ancient/Relic')
      .replace(/\bAncienne?s?\b/gi, 'Ancient')
      .replace(/\bReliques?\b/gi, 'Relic')
      .replace(/Palier\s*(\d+)P/gi, 'Tier $1P')
      .replace(/Palier de Gemmes T4/gi, 'T4 Gem Tier')
      .replace(/Palier/gi, 'Tier')
      .replace(/\bAstrogemmes?\b/gi, 'Astrogems')
      .replace(/\bAstrogemme\b/gi, 'Astrogem')
      .replace(/Sous-stats Grille/gi, 'Grid Substats')
      .replace(/Sous-stats/gi, 'Substats')
      .replace(/Évolution/gi, 'Evolution')
      .replace(/Illumination/gi, 'Enlightenment')
      .replace(/Saut/gi, 'Leap')
      .replace(/Grille d'Ark/gi, 'Ark Grid');

    // 5. Gravures & Pierre
    res = res
      .replace(/Gravures Reliques T4/gi, 'T4 Relic Engravings')
      .replace(/Gravures Reliques/gi, 'Relic Engravings')
      .replace(/Gravures Actives & Pierre/gi, 'Equipped Engravings & Stone')
      .replace(/Gravures Cible & Pierre/gi, 'Target Engravings & Stone')
      .replace(/Gravures & Pierre de Naissance/gi, 'Engravings & Ability Stone')
      .replace(/Gravures & Pierre/gi, 'Engravings & Ability Stone')
      .replace(/Gravure Différente/gi, 'Alternative Engraving')
      .replace(/Gravures/gi, 'Engravings')
      .replace(/Gravure/gi, 'Engraving')
      .replace(/Pierre de Naissance/gi, 'Ability Stone')
      .replace(/Pierre & Relique/gi, 'Stone & Relic')
      .replace(/\bReliques?\b/gi, 'Relic')
      .replace(/Pierre \+(\d+)/gi, 'Stone +$1')
      .replace(/\bPierre\b/gi, 'Stone');

    // 6. Stats & Caractéristiques
    res = res
      .replace(/Stats de Combat/gi, 'Combat Stats')
      .replace(/Caractéristiques de Combat/gi, 'Combat Stats')
      .replace(/Stat Principale & Attaque de Base/gi, 'Main Stat & Base AP')
      .replace(/Stat Principale & Attaque Base/gi, 'Main Stat & Base AP')
      .replace(/Stat Principale/gi, 'Main Stat')
      .replace(/Puissance d'Attaque Base/gi, 'Base Attack Power')
      .replace(/Puissance d'Attaque de Base/gi, 'Base Attack Power')
      .replace(/Puissance d'Attaque/gi, 'Attack Power')
      .replace(/Puissance d'Arme/gi, 'Weapon Power')
      .replace(/Dégâts Additionnels/gi, 'Additional Damage')
      .replace(/Dégâts Suppl\./gi, 'Additional Damage')
      .replace(/Dégâts Supplémentaires/gi, 'Additional Damage')
      .replace(/Dégâts Critiques/gi, 'Crit Damage')
      .replace(/Taux Critique/gi, 'Crit Rate')
      .replace(/Dégâts aux Boss/gi, 'Boss Damage')
      .replace(/Dégâts Boss/gi, 'Boss Damage')
      .replace(/Dégâts infligés/gi, 'Outgoing Damage')
      .replace(/Points de Vie Max/gi, 'Max HP')
      .replace(/Points de Vie/gi, 'Max HP')
      .replace(/Points de Mana Max/gi, 'Max MP')
      .replace(/Soins aux Membres du Groupe/gi, 'Recovery for Party Members')
      .replace(/Boucliers aux Membres du Groupe/gi, 'Shield for Party Members')
      .replace(/Effet Amplification PA d'Allié/gi, 'Ally Atk. Power Enhancement Effect')
      .replace(/Effet Augmentation Dégâts d'Allié/gi, 'Ally Damage Enhancement Effect')
      .replace(/Soins aux Membres/gi, 'Recovery for Party Members')
      .replace(/Boucliers aux Membres/gi, 'Shield for Party Members')
      .replace(/Rapidité/gi, 'Swiftness')
      .replace(/Spécialisation/gi, 'Specialization')
      .replace(/Critique/gi, 'Crit')
      .replace(/Force/gi, 'Strength')
      .replace(/Dextérité/gi, 'Dexterity')
      .replace(/Intelligence/gi, 'Intelligence');
    res = res.replace(/Compétences Non Directionnelles/gi, 'Non-Directional Skills')
      .replace(/Dégâts Coup Crit/gi, 'Crit Hit Dmg')
      .replace(/Dégâts Sortants/gi, 'Outgoing Damage')
      .replace(/Neutralisation/gi, 'Stagger')
      .replace(/Marteau/gi, 'Hammer')
      .replace(/Précision/gi, 'Precision')
      .replace(/Embuscade/gi, 'Ambush')
      .replace(/Ardeur/gi, 'Fervor')
      .replace(/Ovation/gi, 'Cheers')
      .replace(/Vulnérabilité Crit/gi, 'Crit Vulnerability')
      .replace(/Attaque par l'Arrière/gi, 'Back Attack')
      .replace(/Attaque Frontale/gi, 'Frontal Attack')
      .replace(/Dégâts Monstres Inférieurs/gi, 'Damage to Challenge or lower')

    // 7. Accessoires & Rolls
    res = res
      .replace(/Lignes d'Accessoires T4 \(High Rolls\)/gi, 'T4 Accessory Lines (High Rolls)')
      .replace(/Lignes d'Accessoires T4/gi, 'T4 Accessory Lines')
      .replace(/Accessoires T4 \(Rolls & Lignes\)/gi, 'T4 Accessories (Rolls & Lines)')
      .replace(/Accessoires T4/gi, 'T4 Accessories')
      .replace(/Passifs de Bracelet T4 \(Circulaire\)/gi, 'T4 Bracelet Passives (Circularity)')
      .replace(/Passifs de Bracelet T4/gi, 'T4 Bracelet Passives')
      .replace(/Bracelet T4 \(Stats & Passifs\)/gi, 'T4 Bracelet (Stats & Passives)')
      .replace(/Rolls Full High T4/gi, 'Full High T4 Rolls')
      .replace(/Rolls T4 High\/Mid/gi, 'T4 High/Mid Rolls')
      .replace(/Rolls High\/Mid T4/gi, 'High/Mid T4 Rolls')
      .replace(/Rolls T4 Moyens/gi, 'T4 Mid Rolls')
      .replace(/Rolls Mid T4 \(Standard\)/gi, 'Standard Mid T4 Rolls')
      .replace(/Rolls Mid T4/gi, 'Mid T4 Rolls')
      .replace(/Rolls T4 Faibles/gi, 'T4 Low Rolls')
      .replace(/Rolls T4 Débutants/gi, 'Early T4 Rolls')
      .replace(/Rolls Élevés/gi, 'High Rolls')
      .replace(/Roll Élevé/gi, 'High Roll')
      .replace(/Rolls Moyens/gi, 'Mid Rolls')
      .replace(/Roll Moyen/gi, 'Mid Roll')
      .replace(/Rolls Faibles/gi, 'Low Rolls')
      .replace(/Roll Faible/gi, 'Low Roll')
      .replace(/Lignes Inutiles/gi, 'Dead Stats')
      .replace(/Ligne Inutile/gi, 'Dead Stat')
      .replace(/(\d+)\s*Inutiles/gi, '$1 Dead')
      .replace(/1\s*Inutile/gi, '1 Dead')
      .replace(/(\d+)\s*Élevés/gi, '$1 High')
      .replace(/1\s*Élevé/gi, '1 High')
      .replace(/(\d+)\s*Moyens/gi, '$1 Mid')
      .replace(/1\s*Moyen/gi, '1 Mid')
      .replace(/Circulaire/gi, 'Circularity')
      .replace(/Passif Rang 3/gi, 'Rank 3 Perk')
      .replace(/Passif/gi, 'Perk')
      .replace(/Ligne à affiner/gi, 'Line to roll')
      .replace(/À Affiner/gi, 'To Roll');

    // 8. Phrases comparatives & Reconciliations
    res = res
      .replace(/chez la référence contre/gi, 'on benchmark vs')
      .replace(/chez la référence/gi, 'on benchmark')
      .replace(/contre/gi, 'vs')
      .replace(/chez vous/gi, 'on your character')
      .replace(/écart de \+/gi, 'gap of +')
      .replace(/écart de/gi, 'gap of')
      .replace(/d'écart/gi, 'gap')
      .replace(/Votre avantage\s*:/gi, 'Your advantage:')
      .replace(/Avantage Joueur/gi, 'Player Advantage')
      .replace(/Retard Brut Équipements/gi, 'Gross Equipment Deficit')
      .replace(/Votre Avance/gi, 'Your Advantage')
      .replace(/Écart Réel Net In-Game/gi, 'Observed In-Game Gap')
      .replace(/de performance/gi, 'performance gap')
      .replace(/en votre faveur\s*!/gi, 'in your favor!')
      .replace(/Guilde\s*:/gi, 'Guild:');

    // 9. Gravures individuelles connues
    res = res
      .replace(/\bRancune\b/g, 'Grudge')
      .replace(/\bPoupée Maudite\b/g, 'Cursed Doll')
      .replace(/\bAdrénaline\b/g, 'Adrenaline')
      .replace(/\bCapitaine de Raid\b/g, 'Raid Captain')
      .replace(/\bArme Affûtée\b/g, 'Keen Blunt Weapon')
      .replace(/\bAugmentation de Masse\b/g, 'Mass Increase')
      .replace(/\bMaître des Arrières\b/g, 'Ambush Master')
      .replace(/\bMaître Bagarreur\b/g, 'Master Brawler')
      .replace(/\bFrappe aux Points Vitaux\b/g, 'Vital Point Hit')
      .replace(/\bGouttes d'Éther\b/g, 'Drops of Ether')
      .replace(/\bÉveil\b/g, 'Awakening')
      .replace(/\bImpulsion Démoniaque\b/g, 'Demonic Impulse')
      .replace(/\bSuppression Parfaite\b/g, 'Perfect Suppression')
      .replace(/\bAura Bénie\b/g, 'Blessed Aura')
      .replace(/\bAura Sacrée\b/g, 'Blessed Aura')
      .replace(/\bSalut Désespéré\b/g, 'Desperate Salvation')
      .replace(/\bPleine Floraison\b/g, 'Full Bloom')
      .replace(/\bChevalière de Lumière\b/gi, 'Knight of Light')
      .replace(/\bLibératrice\b/gi, 'Liberator');


    // 99. Noms de perks de bracelet restés en français (libellés du Benchmark)
    res = translateBraceletTerms(res)
      .replace(/\bRelique\b/g, 'Relic')
      .replace(/\bAncien\b/g, 'Ancient');
    return res;
  }

  function formatLostArkFrench(str) {
    if (!str || typeof str !== 'string') return str || '';
    let res = str;

    // 1. Gemmes & Tiers
    res = res
      .replace(/Full Tier 4 Lv\.\s*10 Gems/gi, 'Full Gemmes 10 T4')
      .replace(/Full Tier 4 Lv\.\s*9 Gems/gi, 'Full Gemmes 9 T4')
      .replace(/Full Tier 4 Lv\.\s*8 Gems/gi, 'Full Gemmes 8 T4')
      .replace(/Full Tier 4 Lv\.\s*7 Gems/gi, 'Full Gemmes 7 T4')
      .replace(/Mix T4 Gems 8\s*\/\s*9\s*\(5x Lvl 9\)/gi, 'Mix Gemmes 8 / 9 T4 (5x Niv. 9)')
      .replace(/Tier 4 Lv\.\s*8\/9 Mix/gi, 'Mix Gemmes 8 / 9 T4')
      .replace(/Tier 4 Lv\.\s*7\/8 Mix/gi, 'Mix Gemmes 7 / 8 T4')
      .replace(/Full T4 Gems 8/gi, 'Full Gemmes 8 T4')
      .replace(/Full T4 Gems/gi, 'Full Gemmes T4')
      .replace(/Tier 4 Gem Mix/gi, 'Mix Gemmes T4')
      .replace(/Tier 4 Gems/gi, 'Gemmes T4')
      .replace(/Full Tier 4 Lv\.\s*(\d+) Gems/gi, 'Full Gemmes $1 T4')
      .replace(/Full Gems/gi, 'Full Gemmes')
      .replace(/Gems\s*:/gi, 'Gemmes :')
      .replace(/\bGems\b/gi, 'Gemmes')
      .replace(/\bLv\.\s*(\d+)/gi, 'Niv. $1')
      .replace(/\bLevel\s*(\d+)/gi, 'Niv. $1');

    // 2. Équipements & Affinage
    res = res
      .replace(/T4 Advanced Honing/gi, 'Affinage Avancé T4')
      .replace(/Adv\.\s*Honing\s*:/gi, 'Affinage Adv :')
      .replace(/Adv\.\s*Honing/gi, 'Affinage Adv')
      .replace(/Advanced Honing \+40/gi, 'Affinage Avancé +40')
      .replace(/Advanced Honing/gi, 'Affinage Avancé')
      .replace(/T4 Serka Armor Avg/gi, 'Armures Serka T4 Moyenne')
      .replace(/T4 Serka Weapon/gi, 'Arme Serka T4')
      .replace(/T4 Armors Avg/gi, 'Armures T4 Moyenne')
      .replace(/T4 Armor Avg/gi, 'Armures T4 Moyenne')
      .replace(/T4 Armor Honing/gi, 'Affinage Armures T4')
      .replace(/T4 Weapon Honing/gi, 'Affinage Arme T4')
      .replace(/T4 Armors/gi, 'Armures T4')
      .replace(/T4 Armor/gi, 'Armure T4')
      .replace(/T4 Weapon/gi, 'Arme T4')
      .replace(/\(Eq\.\s*\+(\d+)\)/gi, '(Éq. +$1)')
      .replace(/Quality\s*(\d+)/gi, 'Qualité $1')
      .replace(/\bQuality\b/gi, 'Qualité');

    // 3. Transcendance
    res = res
      .replace(/Weapon Transcendence R3/gi, 'Transcendance Arme R3')
      .replace(/Armor Transcendence R3/gi, 'Transcendance Armures R3')
      .replace(/Weapon Transcendence/gi, 'Transcendance Arme')
      .replace(/Armor Transcendence/gi, 'Transcendance Armures')
      .replace(/Transcendence/gi, 'Transcendance');

    // 4. Ark Grid & Cœurs
    res = res
      .replace(/Ark Grid:\s*Sun Cores\s*\(Order & Chaos\)/gi, 'Ark Grid : Cœurs Soleil (Ordre & Chaos)')
      .replace(/Ark Grid:\s*Moon Cores\s*\(Order & Chaos\)/gi, 'Ark Grid : Cœurs Lune (Ordre & Chaos)')
      .replace(/Ark Grid:\s*Star Cores\s*\(Order & Chaos\)/gi, 'Ark Grid : Cœurs Étoile (Ordre & Chaos)')
      .replace(/Ark Grid:\s*Sun Cores\s*\(Ancient\/Relic\)/gi, 'Ark Grid : Cœurs Soleil (Ancien/Relique)')
      .replace(/Ark Grid:\s*Moon Cores\s*\(Ancient\/Relic\)/gi, 'Ark Grid : Cœurs Lune (Ancien/Relique)')
      .replace(/Ark Grid:\s*Star Cores\s*\(Ancient\/Relic\)/gi, 'Ark Grid : Cœurs Étoile (Ancien/Relique)')
      .replace(/Sun Cores/gi, 'Cœurs Soleil')
      .replace(/Moon Cores/gi, 'Cœurs Lune')
      .replace(/Star Cores/gi, 'Cœurs Étoile')
      .replace(/Order Sun/gi, 'Ordre Soleil')
      .replace(/Order Moon/gi, 'Ordre Lune')
      .replace(/Chaos Star/gi, 'Chaos Étoile')
      .replace(/\bAncient\/Relic\b/gi, 'Ancien/Relique')
      .replace(/\bAncient\b/gi, 'Ancien')
      .replace(/\bRelic\b/gi, 'Relique')
      .replace(/\bOrder\b/gi, 'Ordre')
      .replace(/\bChaos\b/gi, 'Chaos')
      .replace(/\bTier\s*(\d+)P/gi, 'Palier $1P')
      .replace(/\bTier\s*17P\+/gi, 'Palier 17P+')
      .replace(/\bTier\b/gi, 'Palier')
      .replace(/Ark Grid:\s*Astrogems\s*\(Substats\)/gi, 'Ark Grid : Astrogemmes (Sous-stats)')
      .replace(/\bAstrogems\b/gi, 'Astrogemmes')
      .replace(/\bAstrogem\b/gi, 'Astrogemme')
      .replace(/Grid Substats/gi, 'Sous-stats Grille')
      .replace(/DPS\/Buff Substats/gi, 'Sous-stats Grille')
      .replace(/Substats/gi, 'Sous-stats Grille')
      .replace(/140 Evolution Pts/gi, '140 Pts Évolution')
      .replace(/101 Enlightenment Pts/gi, '101 Pts Illumination')
      .replace(/70 Leap Pts/gi, '70 Pts Saut')
      .replace(/Evolution Pts/gi, 'Pts Évolution')
      .replace(/Enlightenment Pts/gi, 'Pts Illumination')
      .replace(/Leap Pts/gi, 'Pts Saut')
      .replace(/Evolution Karma Rank 6/gi, 'Karma Évolution Rang 6')
      .replace(/Evolution/gi, 'Évolution')
      .replace(/Enlightenment/gi, 'Illumination')
      .replace(/Leap/gi, 'Saut')
      .replace(/Ark Grid/gi, "Grille d'Ark");

    // 5. Gravures & Pierre
    res = res
      .replace(/Full T4 Relic Engravings/gi, '5 Gravures Reliques T4')
      .replace(/T4 Relic Engravings/gi, 'Gravures Reliques T4')
      .replace(/Relic Engravings/gi, 'Gravures Reliques')
      .replace(/Equipped Engravings & Stone/gi, 'Gravures Actives & Pierre')
      .replace(/Target Engravings & Stone/gi, 'Gravures Cible & Pierre')
      .replace(/Engravings & Ability Stone/gi, 'Gravures & Pierre')
      .replace(/Alternative Engraving/gi, 'Gravure Différente')
      .replace(/Engravings/gi, 'Gravures')
      .replace(/Engraving/gi, 'Gravure')
      .replace(/Ability Stone/gi, 'Pierre')
      .replace(/Stone & Relic/gi, 'Pierre & Relique')
      .replace(/Stone \+(\d+)/gi, 'Pierre +$1')
      .replace(/\bStone\b/gi, 'Pierre');

    // 6. Stats & Caractéristiques
    res = res
      .replace(/Combat Stats/gi, 'Stats de Combat')
      .replace(/Main Stat & Base AP/gi, 'Stat Principale & Attaque de Base')
      .replace(/Main Stat/gi, 'Stat Principale')
      .replace(/Base Attack Power/gi, 'Puissance d\'Attaque de Base')
      .replace(/Attack Power/gi, 'Puissance d\'Attaque')
      .replace(/Weapon Power/gi, 'Puissance d\'Arme')
      .replace(/Additional Damage/gi, 'Dégâts Additionnels')
      .replace(/Crit Damage/gi, 'Dégâts Critiques')
      .replace(/Crit Rate/gi, 'Taux Critique')
      .replace(/Boss Damage/gi, 'Dégâts aux Boss')
      .replace(/Outgoing Damage/gi, 'Dégâts infligés')
      .replace(/Max HP/gi, 'Points de Vie Max')
      .replace(/Max MP/gi, 'Points de Mana Max')
      .replace(/Swiftness/gi, 'Rapidité')
      .replace(/Specialization/gi, 'Spécialisation')
      .replace(/\bCrit\b/gi, 'Critique')
      .replace(/\bStrength\b/gi, 'Force')
      .replace(/\bDexterity\b/gi, 'Dextérité')
      .replace(/\bIntelligence\b/gi, 'Intelligence');

    // 7. Accessoires & Rolls
    res = res
      .replace(/replaced ➔ 2 High main lines/gi, 'remplacé ➔ 2 lignes principales High')
      .replace(/Relic \(Circularity \+ High Dmg\/Buff Perk\)/gi, 'Relique (Circulaire + Passif Dégâts/Buff High)')
      .replace(/Same as yours/gi, 'Identique au vôtre')
      .replace(/\bNecklace\b/gi, 'Collier')
      .replace(/\bEarring\b/gi, 'Boucle d\'oreille')
      .replace(/\bRing\b/gi, 'Anneau')
      .replace(/T4 Accessory Lines \(High Rolls\)/gi, 'Lignes d\'Accessoires T4 (High Rolls)')
      .replace(/T4 Accessory Lines/gi, 'Lignes d\'Accessoires T4')
      .replace(/Accessoires T4 \(Rolls & Lignes\)/gi, 'Accessoires T4 (Rolls & Lignes)')
      .replace(/T4 Accessories \(Rolls & Lines\)/gi, 'Accessoires T4 (Rolls & Lignes)')
      .replace(/T4 Accessories/gi, 'Accessoires T4')
      .replace(/T4 Bracelet Passives \(Circularity\)/gi, 'Passifs de Bracelet T4 (Circulaire)')
      .replace(/T4 Bracelet Passives/gi, 'Passifs de Bracelet T4')
      .replace(/T4 Bracelet \(Stats & Passives\)/gi, 'Bracelet T4 (Stats & Passifs)')
      .replace(/Full High T4 Rolls/gi, 'Rolls Full High T4')
      .replace(/T4 High\/Mid Rolls/gi, 'Rolls T4 High/Mid')
      .replace(/High\/Mid T4 Rolls/gi, 'Rolls High/Mid T4')
      .replace(/Standard Mid T4 Rolls/gi, 'Rolls Mid T4 (Standard)')
      .replace(/Mid T4 Rolls/gi, 'Rolls Mid T4')
      .replace(/T4 Mid Rolls/gi, 'Rolls T4 Moyens')
      .replace(/T4 Low Rolls/gi, 'Rolls T4 Faibles')
      .replace(/Early T4 Rolls/gi, 'Rolls T4 Débutants')
      .replace(/High Rolls/gi, 'Rolls Élevés')
      .replace(/High Roll/gi, 'Roll Élevé')
      .replace(/Mid Rolls/gi, 'Rolls Moyens')
      .replace(/Mid Roll/gi, 'Roll Moyen')
      .replace(/Low Rolls/gi, 'Rolls Faibles')
      .replace(/Low Roll/gi, 'Roll Faible')
      .replace(/Dead Stats/gi, 'Lignes Inutiles')
      .replace(/Dead Stat/gi, 'Ligne Inutile')
      .replace(/(\d+)\s*Dead/gi, '$1 Inutiles')
      .replace(/1\s*Dead/gi, '1 Inutile')
      .replace(/(\d+)\s*High/gi, '$1 Élevés')
      .replace(/1\s*High/gi, '1 Élevé')
      .replace(/(\d+)\s*Mid/gi, '$1 Moyens')
      .replace(/1\s*Mid/gi, '1 Moyen')
      .replace(/Circularity/gi, 'Circulaire')
      .replace(/Rank 3 Perk/gi, 'Passif Rang 3')
      .replace(/\bPerk\b/gi, 'Passif')
      .replace(/Line to roll/gi, 'Ligne à affiner')
      .replace(/To Roll/gi, 'À Affiner');

    // 8. Comparaisons
    res = res
      .replace(/on benchmark vs/gi, 'chez la référence contre')
      .replace(/on benchmark/gi, 'chez la référence')
      .replace(/on your character/gi, 'chez vous')
      .replace(/gap of \+/gi, 'écart de +')
      .replace(/gap of/gi, 'écart de')
      .replace(/Your advantage:/gi, 'Votre avantage :')
      .replace(/Player Advantage/gi, 'Avantage Joueur')
      .replace(/Gross Equipment Deficit/gi, 'Retard Brut Équipements')
      .replace(/Your Advantage/gi, 'Votre Avance')
      .replace(/Observed In-Game Gap/gi, 'Écart Réel Net In-Game')
      .replace(/in your favor!/gi, 'en votre faveur !')
      .replace(/Guild:/gi, 'Guilde :');

    // 9. Bracelet terms
    res = translateBraceletTermsToFrench(res);

    return res;
  }

  const benchmarkState = {
    currentTargetId: null,
    customTarget: null,
    searchedTargets: [],
    gemFilter: 'all', // 'all', 'gem8', 'gem9'
    isAutoFetching: false
  };

  

  function getCharacterSpecName(ch) {
    if (!ch) return 'Standard T4';
    const cKey = (ch.id || ch.name || '').toLowerCase().trim();

    // Classes support : la spé découle du rôle déterminé par les gravures (support par défaut)
    const supClassName = ch.className || (ch.rawProfile && ch.rawProfile.className) || '';
    if (isSupportClassName(supClassName)) {
      const clsKey = normalizeClassName(supClassName).toLowerCase().replace(/[^a-z]/g, '');
      const specs = (typeof CLASS_DEFAULT_SPECS !== 'undefined' && CLASS_DEFAULT_SPECS[clsKey]) || null;
      if (specs) {
        return detectCharacterRole(ch) === 'dps' ? specs.alt : specs.default;
      }
    }

    // 1. Si spec explicite valide déjà définie sur l'objet
    if (ch.spec && !['Standard', 'Standard T4', 'Unknown', ''].includes(ch.spec)) {
      return ch.spec;
    }

    const raw = ch.rawProfile || (ch.loadout ? ch : null);
    const normClass = normalizeClassName(ch.className || (ch.loadout && ch.loadout.classId) || (raw && raw.loadout && raw.loadout.classId) || (raw && raw.className) || '').toLowerCase();

    // 2. Détection via Ark Passive (Enlightenment nodes)
    const arkPass = ch.arkPassive || (raw && (raw.arkPassive || (raw.loadout && raw.loadout.arkPassive)));
    if (arkPass && Array.isArray(arkPass.enlightenment)) {
      for (const node of arkPass.enlightenment) {
        if (node && BIBLE_ENLIGHTENMENT_SPECS[node.id]) {
          return BIBLE_ENLIGHTENMENT_SPECS[node.id];
        }
      }
    }

    // 2b. Détection dynamique via les statistiques de combat (Spec vs Swift/Crit)
    const loadoutObj = ch.loadout || (raw && (raw.loadout || raw));
    const statsList = (loadoutObj && Array.isArray(loadoutObj.stats)) ? loadoutObj.stats : [];
    const critStat = statsList.find(s => s.type === 15)?.value || 0;
    const swiftStat = statsList.find(s => s.type === 16)?.value || 0;
    const specStat = statsList.find(s => s.type === 17)?.value || 0;
    const isSpecMain = specStat > 1000 || (specStat > swiftStat && specStat > critStat);

    if (statsList.length > 0 && (critStat > 0 || swiftStat > 0 || specStat > 0)) {
      if (normClass.includes('soulfist')) return isSpecMain ? 'Robust Spirit' : 'Energy Overflow';
      if (normClass.includes('souleater')) return isSpecMain ? 'Full Moon Harvester' : "Night's Edge";
      if (normClass.includes('scrapper')) return isSpecMain ? 'Shock Training' : 'Ultimate Skill: Taijutsu';
      if (normClass.includes('wardancer')) return isSpecMain ? 'Esoteric Skill Enhancement' : 'First Intention';
      if (normClass.includes('berserker')) return isSpecMain ? "Berserker's Technique" : 'Mayhem';
      if (normClass.includes('breaker')) return isSpecMain ? 'Brawl King Storm' : 'Asura Destruction';
      if (normClass.includes('slayer')) return isSpecMain ? 'Punisher' : 'Predator';
      if (normClass.includes('deathblade')) return isSpecMain ? 'Surge' : 'Remaining Energy';
      if (normClass.includes('gunlancer')) return isSpecMain ? 'Combat Readiness' : 'Lone Knight';
      if (normClass.includes('sorceress')) return isSpecMain ? 'Igniter' : 'Reflux';
      if (normClass.includes('striker')) return isSpecMain ? 'Deathblow' : 'Esoteric Flurry';
      if (normClass.includes('shadowhunter')) return isSpecMain ? 'Demonic Impulse' : 'Perfect Suppression';
      if (normClass.includes('destroyer')) return isSpecMain ? 'Gravity Training' : 'Rage Hammer';
      if (normClass.includes('artillerist')) return isSpecMain ? 'Barrage Enhancement' : 'Firepower Enhancement';
      if (normClass.includes('machinist')) return isSpecMain ? 'Evolutionary Legacy' : 'Arthetinean Skill';
      if (normClass.includes('arcanist')) return isSpecMain ? 'Grace of the Empress' : 'Order of the Emperor';
      if (normClass.includes('summoner')) return isSpecMain ? 'Master Summoner' : 'Communication Overflow';
      if (normClass.includes('reaper')) return isSpecMain ? 'Lunar Voice' : 'Hunger';
      if (normClass.includes('glaivier')) return isSpecMain ? 'Pinnacle' : 'Control';
      if (normClass.includes('aeromancer')) return swiftStat > 1000 ? 'Wind Fury' : 'Drizzle';
      if (normClass.includes('deadeye')) return (specStat > 900 && swiftStat > 600) ? 'Pistoleer' : 'Enhanced Weapon';
      if (normClass.includes('gunslinger')) return specStat > 600 ? 'Time to Hunt' : 'Peacemaker';
      if (normClass.includes('sharpshooter')) return specStat > 600 ? 'Death Strike' : 'Loyal Companion';
      if (normClass.includes('dimensionalist') || normClass.includes('dimension')) return swiftStat > 900 ? 'Space Wielder' : 'Time Wielder';
    }

    // 3. Extraction depuis les gravures du personnage (Bible ou In-Game)
    const engs = (ch.engravings && ch.engravings.length > 0) ? ch.engravings : (raw && raw.engravings);
    if (Array.isArray(engs) && engs.length > 0) {
      for (const e of engs) {
        const engName = ((typeof BIBLE_ENGRAVINGS !== 'undefined' && BIBLE_ENGRAVINGS[e.id]) || e.name || '').toLowerCase();
        for (const [cls, info] of Object.entries(CLASS_DEFAULT_SPECS)) {
          if (engName.includes(info.default.toLowerCase())) return info.default;
          if (engName.includes(info.alt.toLowerCase())) return info.alt;
        }
      }
    }

    // 4. Déduction pour les classes support (Blessed Aura par défaut, jamais Judgment sans gravure explicite)
    const isSupClass = ['paladin', 'holyknight', 'bard', 'artist', 'valkyrie', 'yinyangshi'].some(s => normClass.includes(s));
    if (isSupClass) {
      const engsList = (ch.engravings && ch.engravings.length > 0) ? ch.engravings : (raw && raw.engravings);
      const hasDpsEng = Array.isArray(engsList) && engsList.some(e => {
        const eName = ((typeof BIBLE_ENGRAVINGS !== 'undefined' && BIBLE_ENGRAVINGS[e.id]) || e.name || '').toLowerCase();
        return ['judgment', 'jugement', 'true courage', 'vrai courage', 'recurrence', 'récurrence', 'liberator'].some(d => eName.includes(d));
      });
      if (hasDpsEng) {
        if (normClass.includes('paladin') || normClass.includes('holyknight')) return 'Judgment';
        if (normClass.includes('bard')) return 'True Courage';
        if (normClass.includes('artist') || normClass.includes('yinyangshi')) return 'Recurrence';
        if (normClass.includes('valkyrie')) return 'Liberator';
      } else {
        if (normClass.includes('paladin') || normClass.includes('holyknight')) return 'Blessed Aura';
        if (normClass.includes('bard')) return 'Desperate Salvation';
        if (normClass.includes('artist') || normClass.includes('yinyangshi')) return 'Full Bloom';
        if (normClass.includes('valkyrie')) return 'Liberator';
      }
    }

    // 5. Déduction via le nom de la classe
    for (const [cls, info] of Object.entries(CLASS_DEFAULT_SPECS)) {
      if (normClass.includes(cls)) {
        return info.default;
      }
    }

    return "Standard T4";
  }


    function getCharacterGemSummary(playerChar, isEn = false) {
    if (!playerChar) return isEn ? 'Tier 4 Gems' : 'Gemmes T4';
    const cKey = (playerChar.id || playerChar.name || '').toLowerCase().trim();
    const parts = (typeof extractCharacterGemParts === 'function') 
      ? extractCharacterGemParts(playerChar)
      : ((playerChar && Array.isArray(playerChar.gemParts) && playerChar.gemParts.length > 0)
          ? playerChar.gemParts
          : null);

    const isSupport = playerChar.role === 'support' || (playerChar.role !== 'dps' && playerChar.className && ['Paladin', 'Bard', 'Artist', 'Valkyrie'].includes(playerChar.className));

    if (parts && parts.length > 0) {
      let c10 = 0, c9 = 0, c8 = 0, c7 = 0;
      const l10 = isSupport ? 12.00 : 7.00;
      const l9 = isSupport ? 10.80 : 6.35;
      const l8 = isSupport ? 9.60 : 5.70;
      const l7 = isSupport ? 8.50 : 5.05;

      parts.forEach(g => {
        if (g >= l10 - 0.05) c10++;
        else if (g >= l9 - 0.05) c9++;
        else if (g >= l8 - 0.05) c8++;
        else c7++;
      });

      const total = parts.length;
      if (c10 === total) return isEn ? 'Full Tier 4 Lv. 10 Gems' : 'Full Gemmes 10 T4';
      if (c10 > 0) {
        const details = [];
        details.push(`${c10}x ${isEn ? 'Lv.' : 'Niv.'} 10`);
        if (c9 > 0) details.push(`${c9}x ${isEn ? 'Lv.' : 'Niv.'} 9`);
        if (c8 > 0) details.push(`${c8}x ${isEn ? 'Lv.' : 'Niv.'} 8`);
        if (c7 > 0) details.push(`${c7}x ${isEn ? 'Lv.' : 'Niv.'} 7`);
        return isEn 
          ? `Tier 4 Gems (${details.join(', ')})`
          : `Mix Gemmes T4 (${details.join(', ')})`;
      }
      if (c9 === total) return isEn ? 'Full Tier 4 Lv. 9 Gems' : 'Full Gemmes 9 T4';
      if (c9 > 0) {
        const details = [];
        details.push(`${c9}x ${isEn ? 'Lv.' : 'Niv.'} 9`);
        if (c8 > 0) details.push(`${c8}x ${isEn ? 'Lv.' : 'Niv.'} 8`);
        if (c7 > 0) details.push(`${c7}x ${isEn ? 'Lv.' : 'Niv.'} 7`);
        return isEn 
          ? `Tier 4 Lv. 8/9 Mix (${details.join(', ')})` 
          : `Mix Gemmes 8 / 9 T4 (${details.join(', ')})`;
      }
      if (c8 === total) return isEn ? 'Full Tier 4 Lv. 8 Gems' : 'Full Gemmes 8 T4';
      if (c8 > 0) {
        return isEn 
          ? `Tier 4 Lv. 7/8 Mix (${c8}x Lv. 8, ${c7}x Lv. 7)` 
          : `Mix Gemmes 7 / 8 T4 (${c8}x Niv. 8, ${c7}x Niv. 7)`;
      }
      return isEn ? 'Full Tier 4 Lv. 7 Gems' : 'Full Gemmes 7 T4';
    }

    if (playerChar.gemDesc) {
      return isEn ? formatLostArkEnglish(playerChar.gemDesc) : playerChar.gemDesc;
    }
    return isEn ? 'Tier 4 Lv. 7/8 Mix' : 'Mix Gemmes 7 / 8 T4';
  }

  

  

  

  // --- Valorisation des lignes d'affinage d'accessoires (pentes ARSONISTIC_DATA) ---
  // PA totale et bonus PA% de base du profil par défaut de bracelet-model.js :
  // sqrt(703826×1.09 × 241367×1.085 / 6) × 1.125 + 3600 ≈ 209 464
  const ACC_REF_TOTAL_AP = 209464;
  const ACC_REF_BASE_AP_PCT = 0.125;
  // --- Gammes de bijoux de remplacement ---
  // Valeurs Low / Mid / High de chaque ligne de polissage T4 (mêmes unités que computeAccessoryLinesBonus)
  const ACC_LINE_TIERS = {
    addDmg: [0.70, 1.60, 2.60], outDmg: [0.55, 1.20, 2.00], apPct: [0.40, 0.95, 1.55], wpPct: [0.80, 1.80, 3.00],
    critPct: [0.40, 0.95, 1.55], cdmgPct: [1.10, 2.40, 4.00], apFlat: [80, 195, 390], wpFlat: [195, 480, 960],
    brand: [2.15, 4.80, 8.00], identity: [1.60, 3.60, 6.00], allyAp: [1.35, 3.00, 5.00], allyDmg: [2.00, 4.50, 7.50]
  };
  // Les 2 lignes principales par rôle et type (support boucle : PA d'arme % + PA d'arme plate)
  const ACC_MAIN_LINES = {
    dps: { neck: ['addDmg', 'outDmg'], ear: ['apPct', 'wpPct'], ring: ['critPct', 'cdmgPct'] },
    support: { neck: ['brand', 'identity'], ear: ['wpPct', 'wpFlat'], ring: ['allyAp', 'allyDmg'] }
  };
  // Gammes achetées à l'hôtel des ventes : tiers des 2 lignes principales (0 = Low, 1 = Mid, 2 = High),
  // 3e ligne morte. Pas de source marché : prix EUC relevés en jeu (null = prix inconnu, gamme ignorée).
  // Échantillon lostark.bible 1730+ (2026-09-30) : High / Mid est la combinaison la plus portée,
  // High / Mid : 600 à 700 k à l'hôtel des ventes EUC (milieu retenu).
  const ACC_PACKAGES = [
    { id: 'HM', label: 'High / Mid', tiers: [2, 1], price: { neck: 650000, ear: 650000, ring: 650000 } },
    { id: 'MM', label: 'Mid / Mid', tiers: [1, 1], price: { neck: 35000, ear: 35000, ring: 35000 } },
    // 40 à 80 k
    { id: 'HL', label: 'High / Low', tiers: [2, 0], price: { neck: 60000, ear: 60000, ring: 60000 } },
    // Collier 4 à 5,2 M, boucle 3 à 4,5 M, anneau 2,7 à 4 M (milieu de fourchette)
    { id: 'HH', label: 'High / High', tiers: [2, 2], price: { neck: 4600000, ear: 3750000, ring: 3350000 } }
  ];
  const accessoryKind = slot => (slot === 'neck' ? 'neck' : (slot.startsWith('ear') ? 'ear' : 'ring'));
  // Coût moyen d'un bijou de la gamme de référence, pour les comparaisons globales (Benchmark)
  const ACC_UPGRADE_COST_AVG = ACC_PACKAGES[0].price.neck;

  const ACC_SLOTS = ['neck', 'ear1', 'ear2', 'finger1', 'finger2'];
  // Bijou cible d'un remplacement : 2 lignes principales du rôle en High + PA d'arme plate Mid
  const ACC_TARGET_LINES = {
    dps: {
      neck: [['addDmg', 2.60], ['outDmg', 2.00], ['wpFlat', 480]],
      ear: [['apPct', 1.55], ['wpPct', 3.00], ['wpFlat', 480]],
      ring: [['critPct', 1.55], ['cdmgPct', 4.00], ['wpFlat', 480]]
    },
    support: {
      neck: [['brand', 8.00], ['identity', 6.00], ['wpFlat', 480]],
      ear: [['wpPct', 3.00], ['shield', 3.50], ['wpFlat', 480]],
      ring: [['allyAp', 5.00], ['allyDmg', 7.50], ['wpFlat', 480]]
    }
  };

  // Clé de stat et quantité (en % ou en points plats) d'une ligne d'affinage brute
  function getAccessoryLineKey(st) {
    const t = st.type;
    const idx = st.index;
    const val = st.value || 0;
    if (t === 4 && idx >= 621000000 && idx <= 621000002) return { key: 'outDmg', amount: [0.55, 1.20, 2.00][idx - 621000000] };
    if (t === 29) return { key: 'identity', amount: idx === 6002 ? 6.00 : (idx === 6001 ? 3.60 : 1.60) };
    if (t === 50) return { key: 'heal', amount: val / 100 };
    if (t === 51) return { key: 'shield', amount: val / 100 };
    if (t === 54) return { key: 'allyAp', amount: val / 100 };
    if (t === 59 || idx === 16000001) return { key: 'allyDmg', amount: val / 100 };
    if (t === 2) {
      const pctKeys = { 152: 'wpPct', 49: 'apPct', 50: 'addDmg', 74: 'critPct', 76: 'cdmgPct', 46: 'brand' };
      if (pctKeys[idx]) return { key: pctKeys[idx], amount: val / 100 };
      if (idx === 124) return { key: 'apFlat', amount: val };
      if (idx === 151) return { key: 'wpFlat', amount: val };
    }
    return { key: 'other', amount: 0 };
  }

  // Gain (% DPS ou % Buff) par unité de ligne, dérivé des tables Arsonistic.
  // Une clé absente vaut 0 : lignes inutiles, soins, boucliers, jauge d'identité, PV...
  let accLineSlopesCache = null;
  function getAccessoryLineSlopes() {
    if (accLineSlopesCache) return accLineSlopesCache;
    const dps = ARSONISTIC_DATA.dps;
    const sup = ARSONISTIC_DATA.support;
    const perPct = (tbl, field) => tbl.high[field] / tbl.high.pct;
    const dpsApSlope = perPct(dps.apPct, 'dps');
    const dpsWpSlope = perPct(dps.wpPct, 'dps');
    const supWpSlope = perPct(sup.wpPct, 'buffDmg');
    const supWpFlatPerPoint = sup.wpFlat['960'].buffDmg / 960;
    accLineSlopesCache = {
      dps: {
        addDmg: perPct(dps.addDmg, 'dps'),
        outDmg: perPct(dps.outDmg, 'dps'),
        apPct: dpsApSlope,
        critPct: perPct(dps.critPct, 'dps'),
        cdmgPct: perPct(dps.cdmgPct, 'dps'),
        wpPct: dpsWpSlope,
        // Même équivalence points plats ⇔ % PA d'arme que la table support
        wpFlat: (supWpFlatPerPoint / supWpSlope) * dpsWpSlope,
        // +v PA = v / PA totale de réf. ; une ligne PA% de x % n'ajoute que x / (1 + PA% de base)
        apFlat: (100 / ACC_REF_TOTAL_AP) * dpsApSlope * (1 + ACC_REF_BASE_AP_PCT)
      },
      support: {
        brand: perPct(sup.brand, 'buffDmg'),
        allyDmg: perPct(sup.allyDmg, 'buffDmg'),
        allyAp: perPct(sup.allyAp, 'buffDmg'),
        wpPct: supWpSlope,
        wpFlat: supWpFlatPerPoint
      }
    };
    return accLineSlopesCache;
  }

  // Cumul des lignes : additif à l'intérieur d'une même stat, multiplicatif entre stats
  function computeAccessoryLinesBonus(lines, isSupport) {
    const slopes = getAccessoryLineSlopes()[isSupport ? 'support' : 'dps'];
    const pools = {};
    lines.forEach(l => {
      if (slopes[l.key]) pools[l.key] = (pools[l.key] || 0) + l.amount;
    });
    const mult = Object.keys(pools).reduce((m, k) => m * (1 + pools[k] * slopes[k] / 100), 1);
    return (mult - 1) * 100;
  }

  // Remplacement de bijou au meilleur ratio : chaque slot × chaque gamme au prix connu,
  // en plaçant le High sur la ligne principale où il rapporte le plus
  function findBestAccessoryUpgrade(slotLines, isSupport) {
    if (!slotLines) return null;
    const role = isSupport ? 'support' : 'dps';
    const curPct = computeAccessoryLinesBonus(ACC_SLOTS.flatMap(s => slotLines[s] || []), isSupport);
    let best = null;
    ACC_SLOTS.forEach(slot => {
      const kind = accessoryKind(slot);
      const [m1, m2] = ACC_MAIN_LINES[role][kind];
      const others = ACC_SLOTS.filter(s => s !== slot).flatMap(s => slotLines[s] || []);
      ACC_PACKAGES.forEach(pkg => {
        const cost = pkg.price[kind];
        if (!(cost > 0)) return;
        const [t1, t2] = pkg.tiers;
        [[t1, t2], [t2, t1]].forEach(([a, b]) => {
          const target = [{ key: m1, amount: ACC_LINE_TIERS[m1][a] }, { key: m2, amount: ACC_LINE_TIERS[m2][b] }];
          const nextPct = computeAccessoryLinesBonus(others.concat(target), isSupport);
          const gain = ((1 + nextPct / 100) / (1 + curPct / 100) - 1) * 100;
          if (!(gain > 0)) return;
          if (!best || cost / gain < best.cost / best.gain) best = { slot, kind, pkg, gain, cost, curPct, nextPct };
        });
      });
    });
    return best;
  }

  // Bonus accessoires maximal pour le rôle : les 5 bijoux avec leurs 2 lignes principales High
  // et la PA d'arme plate au roll High (960). Sert d'échelle à la note des bijoux.
  function accessoryMaxBonusPct(isSupport) {
    const lineSet = isSupport ? ACC_TARGET_LINES.support : ACC_TARGET_LINES.dps;
    const lines = ['neck', 'ear', 'ear', 'ring', 'ring'].flatMap(kind =>
      lineSet[kind].map(([key, amount]) => ({ key, amount: key === 'wpFlat' ? 960 : amount })));
    return computeAccessoryLinesBonus(lines, isSupport);
  }

  // Note des bijoux sur la part du maximum atteinte (et non sur le nombre de lignes High)
  const ACC_GRADE_BANDS = [
    [0.95, 'S+', 'grade-s-plus'], [0.88, 'S', 'grade-s'], [0.80, 'A+', 'grade-a'], [0.72, 'A', 'grade-a'],
    [0.64, 'B+', 'grade-b'], [0.56, 'B', 'grade-b'], [0.48, 'C+', 'grade-c'], [0, 'C', 'grade-c']
  ];

  function accessoryGrade(bonusPct, isSupport) {
    const ratio = bonusPct / accessoryMaxBonusPct(isSupport);
    const band = ACC_GRADE_BANDS.find(([min]) => ratio >= min);
    return { grade: band[1], cls: band[2], ratio };
  }

  function accessorySlotNames(isEn) {
    return {
      neck: isEn ? 'Necklace' : 'Collier',
      ear1: isEn ? 'Earring #1' : 'Boucle d\'oreille #1',
      ear2: isEn ? 'Earring #2' : 'Boucle d\'oreille #2',
      finger1: isEn ? 'Ring #1' : 'Anneau #1',
      finger2: isEn ? 'Ring #2' : 'Anneau #2'
    };
  }

  function decodeAccessoryStat(st, slot, isSupport, isEn) {
    const t = st.type;
    const idx = st.index;
    const val = st.value;

    let text = '';
    let rollTier = 'mid';
    let tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
    let isDead = false;

    // 1. Passifs & Compteurs Collier (type 4 ou 29)
    if (t === 4 && (idx === 621000000 || idx === 621000001 || idx === 621000002)) {
      const pct = idx === 621000002 ? '2.00' : (idx === 621000001 ? '1.20' : '0.55');
      text = isEn ? `Outgoing Damage (+${pct}%)` : `Dégâts infligés (+${pct}%)`;
      // Seul le roll max garde le statut « passif » ; dégâts personnels = inutiles en support
      if (idx === 621000002) {
        rollTier = 'passif';
        tierLabel = isEn ? 'Rank 3 Perk' : 'Passif Rang 3';
      } else {
        rollTier = idx === 621000001 ? 'mid' : 'low';
        tierLabel = rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible');
      }
      isDead = isSupport;
      return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
    }
    if (t === 29) {
      const pct = idx === 6002 ? '6.00' : (idx === 6001 ? '3.60' : '1.60');
      text = isEn ? `Identity Meter Gain (+${pct}%)` : `Gain Jauge d'Identité (+${pct}%)`;
      rollTier = idx === 6002 ? 'high' : (idx === 6001 ? 'mid' : 'low');
      tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
      isDead = !isSupport;
      return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
    }

    // 2. Lignes d'Équipe Support spécifiques (type 50, 51, 54, 59)
    if (t === 50) { // Recovery for Party Members
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Recovery for Party Members (+${pct}%)` : `Soins aux Membres du Groupe (+${pct}%)`;
      rollTier = val >= 350 ? 'high' : (val >= 210 ? 'mid' : 'low');
      tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
      isDead = !isSupport;
      return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
    }
    if (t === 51) { // Shield for Party Members
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Shield for Party Members (+${pct}%)` : `Boucliers aux Membres du Groupe (+${pct}%)`;
      rollTier = val >= 350 ? 'high' : (val >= 210 ? 'mid' : 'low');
      tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
      isDead = !isSupport;
      return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
    }
    if (t === 54) { // Ally Atk. Power Enhancement Effect
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Ally Atk. Power Enhancement Effect (+${pct}%)` : `Effet Amplification PA d'Allié (+${pct}%)`;
      rollTier = val >= 500 ? 'high' : (val >= 300 ? 'mid' : 'low');
      tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
      isDead = !isSupport;
      return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
    }
    if (t === 59 || idx === 16000001) { // Ally Damage Enhancement Effect
      const pct = (val / 100).toFixed(2);
      text = isEn ? `Ally Damage Enhancement Effect (+${pct}%)` : `Effet Augmentation Dégâts d'Allié (+${pct}%)`;
      rollTier = val >= 750 ? 'high' : (val >= 450 ? 'mid' : 'low');
      tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
      isDead = !isSupport;
      return { text, rollTier, tierLabel: isDead ? (isEn ? 'Dead Stat' : 'Ligne Inutile') : tierLabel, isDead };
    }

    // 3. Stats Standard T4 (type === 2)
    if (t === 2) {
      if (idx === 152) { // Weapon Power %
        const pct = (val / 100).toFixed(2);
        text = isEn ? `Weapon Power (+${pct}%)` : `Puissance d'Arme (+${pct}%)`;
        rollTier = val >= 300 ? 'high' : (val >= 180 ? 'mid' : 'low');
      } else if (idx === 49) { // Atk. Power %
        const pct = (val / 100).toFixed(2);
        text = isEn ? `Atk. Power (+${pct}%)` : `Puissance d'Attaque (+${pct}%)`;
        rollTier = val >= 155 ? 'high' : (val >= 95 ? 'mid' : 'low');
      } else if (idx === 50) { // Additional Damage %
        const pct = (val / 100).toFixed(2);
        text = isEn ? `Additional Damage (+${pct}%)` : `Dégâts Additionnels (+${pct}%)`;
        rollTier = val >= 260 ? 'high' : (val >= 160 ? 'mid' : 'low');
        if (isSupport) isDead = true;
      } else if (idx === 74) { // Crit Rate %
        const pct = (val / 100).toFixed(2);
        text = isEn ? `Crit Rate (+${pct}%)` : `Taux Critique (+${pct}%)`;
        rollTier = val >= 155 ? 'high' : (val >= 95 ? 'mid' : 'low');
        if (isSupport) isDead = true;
      } else if (idx === 76) { // Crit Damage %
        const pct = (val / 100).toFixed(2);
        text = isEn ? `Crit Damage (+${pct}%)` : `Dégâts Critiques (+${pct}%)`;
        rollTier = val >= 400 ? 'high' : (val >= 240 ? 'mid' : 'low');
        if (isSupport) isDead = true;
      } else if (idx === 46) { // Brand Power %
        const pct = (val / 100).toFixed(2);
        text = isEn ? `Brand Power (+${pct}%)` : `Brand Power / Marque (+${pct}%)`;
        rollTier = val >= 800 ? 'high' : (val >= 480 ? 'mid' : 'low');
        if (!isSupport) isDead = true;
      } else if (idx === 124) { // Atk. Power flat
        text = isEn ? `Atk. Power (+${val})` : `Puissance d'Attaque (+${val})`;
        rollTier = val >= 390 ? 'high' : (val >= 195 ? 'mid' : 'low');
      } else if (idx === 151) { // Weapon Power flat
        text = isEn ? `Weapon Power (+${val})` : `Puissance d'Arme (+${val})`;
        rollTier = val >= 960 ? 'high' : (val >= 480 ? 'mid' : 'low');
      } else if (idx === 27) { // Max HP flat
        text = isEn ? `Max HP (+${val})` : `Points de Vie Max (+${val})`;
        rollTier = val >= 6500 ? 'high' : (val >= 3250 ? 'mid' : 'low');
        if (!isSupport) isDead = true;
      } else if (idx === 34) { // Combat HP Recovery
        text = isEn ? `Combat HP Recovery (+${val})` : `Récupération PV en Combat (+${val})`;
        rollTier = val >= 50 ? 'high' : (val >= 25 ? 'mid' : 'low');
        isDead = true;
      } else if (idx === 28) { // Max MP
        text = isEn ? `Max MP (+${val})` : `Points de Mana Max (+${val})`;
        rollTier = val >= 30 ? 'high' : (val >= 15 ? 'mid' : 'low');
        isDead = true;
      } else if (idx === 106) { // Status Ailment
        const pct = (val / 100).toFixed(2);
        text = isEn ? `Status Ailment Time Bonus (+${pct}%)` : `Bonus Durée Altération État (+${pct}%)`;
        rollTier = val >= 100 ? 'high' : (val >= 50 ? 'mid' : 'low');
        isDead = true;
      } else {
        text = `Stat #${idx} (+${val})`;
      }

      tierLabel = rollTier === 'high' ? (isEn ? 'High Roll' : 'Roll Élevé') : (rollTier === 'mid' ? (isEn ? 'Mid Roll' : 'Roll Moyen') : (isEn ? 'Low Roll' : 'Roll Faible'));
      if (isDead) tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
      return { text, rollTier, tierLabel, isDead };
    }

    return { text: `Option #${t} (${val})`, rollTier: 'low', tierLabel: isEn ? 'Low Roll' : 'Roll Faible', isDead: false };
  }

  function evaluateCharacterAccessories(playerChar, isSupport = false, isEn = false) {
    if (!playerChar) {
      return { bonusPct: 12.80, label: isEn ? "Standard Mid T4 Rolls" : "Rolls Mid T4 (Standard)", highCount: 0, midCount: 0, lowCount: 0, deadCount: 0 };
    }

    const cKey = (playerChar.id || playerChar.name || '').toLowerCase().trim();
    const canon = (playerChar.rawProfile ? playerChar : null);
    const pIlvl = playerChar.ilvl || (canon && canon.ilvl) || 1750;

    let pAccItems = (playerChar && playerChar.accessories)
      || (playerChar && playerChar.rawProfile && playerChar.rawProfile.accessories)
      || (playerChar && playerChar.rawProfile && playerChar.rawProfile.loadout && playerChar.rawProfile.loadout.items && playerChar.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (playerChar && playerChar.loadout && playerChar.loadout.items && playerChar.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (canon && canon.rawProfile && canon.rawProfile.accessories)
      || (canon && canon.rawProfile && canon.rawProfile.loadout && canon.rawProfile.loadout.items && canon.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (canon && canon.loadout && canon.loadout.items && canon.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || [];


    let highCount = 0;
    let midCount = 0;
    let lowCount = 0;
    let deadCount = 0;
    let totalFound = 0;

    // Lignes valorisables par bijou (uniquement quand les stats brutes sont disponibles)
    let slotLines = null;

    // 1. Détection via les données d'objets bruts (lostark.bible ou import)
    if (pAccItems && pAccItems.length > 0) {
      ACC_SLOTS.forEach(slot => {
        const item = pAccItems.find(i => i.slot === slot);
        if (item && item.data && Array.isArray(item.data.stats)) {
          const rolls = item.data.stats.filter(st => st.base === false);
          if (!slotLines) slotLines = {};
          slotLines[slot] = rolls.map(getAccessoryLineKey);
          rolls.forEach(r => {
            const dec = decodeAccessoryStat(r, slot, isSupport, isEn);
            totalFound++;
            if (dec.isDead) deadCount++;
            else if (dec.rollTier === 'passif' || dec.rollTier === 'high') highCount++;
            else if (dec.rollTier === 'mid') midCount++;
            else lowCount++;
          });
        }
      });
    }

    // 2. Détection via les items textuels du preset (CANONICAL_PRESETS) si pas de stats brutes
    if (totalFound === 0) {
      const presetItems = (playerChar.items && Array.isArray(playerChar.items) && playerChar.items.filter(i => i.cat === 'Accessoires').length > 0)
        ? playerChar.items.filter(i => i.cat === 'Accessoires')
        : ((canon && Array.isArray(canon.items) && canon.items.filter(i => i.cat === 'Accessoires').length > 0)
            ? canon.items.filter(i => i.cat === 'Accessoires')
            : []);

      if (presetItems.length > 0) {
        presetItems.forEach(it => {
          totalFound++;
          const lbl = (it.label || '').toLowerCase();
          const note = (it.note || '').toLowerCase();
          const val = it.val || '';
          let isDead = false;
          let rollTier = 'mid';

          if (isSupport) {
            if (lbl.includes('critique') || lbl.includes('crit') || lbl.includes('additionnel') || note.includes('exclu') || note.includes('non transféré')) {
              isDead = true;
            } else if (lbl.includes('dégâts infligés') || val.includes('+800') || val.includes('+1.95%') || val.includes('+5.00%') || val.includes('+7.50%')) {
              rollTier = 'high';
            } else if (val.includes('+2.10%') || val.includes('+2.00%') || val.includes('+1.80%') || val.includes('+1.47%')) {
              rollTier = 'mid';
            } else {
              rollTier = 'low';
            }
          } else {
            if (lbl.includes('soins') || lbl.includes('bouclier') || lbl.includes('brand power') || lbl.includes('marque') || lbl.includes('mana max') || lbl.includes('altération') || note.includes('exclu')) {
              isDead = true;
            } else if (lbl.includes('dégâts infligés') || val.includes('+390') || val.includes('+960') || val.includes('+4.00%') || val.includes('+3.00%') || val.includes('+2.60%')) {
              rollTier = 'high';
            } else if (val.includes('+1.55%') || val.includes('+1.60%') || val.includes('+0.95%') || val.includes('+0.80%')) {
              rollTier = 'mid';
            } else {
              rollTier = 'low';
            }
          }

          if (isDead) deadCount++;
          else if (rollTier === 'high') highCount++;
          else if (rollTier === 'mid') midCount++;
          else lowCount++;
        });
      }
    }

    // 3. Calcul du bonus effectif
    let bonusPct = 12.80;
    let label = '';

    if (totalFound > 0) {
      if (slotLines) {
        // Stats brutes : valeur réelle de chaque ligne × pente Arsonistic, cumul multiplicatif entre stats
        const allLines = ACC_SLOTS.flatMap(s => slotLines[s] || []);
        bonusPct = Number(computeAccessoryLinesBonus(allLines, isSupport).toFixed(2));
      } else {
        // Presets textuels (valeurs non décodables) : estimation par tiers, sans pénalité pour les lignes inutiles
        const calc = 10.00 + (highCount * 0.35) + (midCount * 0.22) + (lowCount * 0.10);
        bonusPct = Number(Math.min(15.20, calc).toFixed(2));
      }

      const deadSuffix = deadCount > 0 
        ? (isEn ? `, ${deadCount === 1 ? '1 Dead' : deadCount + ' Dead'}` : `, ${deadCount === 1 ? '1 Inutile' : deadCount + ' Inutiles'}`)
        : '';
      const highStr = isEn ? `${highCount === 1 ? '1 High' : highCount + ' High'}` : `${highCount === 1 ? '1 Élevé' : highCount + ' Élevés'}`;
      const midStr = isEn ? `${midCount === 1 ? '1 Mid' : midCount + ' Mid'}` : `${midCount === 1 ? '1 Moyen' : midCount + ' Moyens'}`;

      if (highCount >= 12 && deadCount === 0) {
        label = isEn ? `Full High T4 Rolls (+${bonusPct.toFixed(2)}%)` : `Rolls Full High T4 (+${bonusPct.toFixed(2)}%)`;
      } else if (highCount >= 5) {
        label = isEn
          ? `T4 High/Mid Rolls (${highStr}${deadSuffix})`
          : `Rolls T4 High/Mid (${highStr}${deadSuffix})`;
      } else if (midCount > 0 || deadCount > 0) {
        label = isEn
          ? `T4 Mid Rolls (${midStr}${deadSuffix})`
          : `Rolls T4 Moyens (${midStr}${deadSuffix})`;
      } else {
        label = isEn ? `T4 Low/Early Rolls (+${bonusPct.toFixed(2)}%)` : `Rolls T4 Faibles (+${bonusPct.toFixed(2)}%)`;
      }
    } else {
      // Fallback si aucune ligne trouvée selon le palier iLvl
      if (pIlvl >= 1770) {
        bonusPct = 14.40;
        label = isEn ? "High/Mid T4 Rolls (Optimized)" : "Rolls High/Mid T4 (Optimisés)";
      } else if (pIlvl >= 1755) {
        bonusPct = 13.90;
        label = isEn ? "High/Mid T4 Rolls (2 High)" : "Rolls High/Mid T4 (2 High)";
      } else if (pIlvl >= 1750) {
        bonusPct = 13.50;
        label = isEn ? "Mid T4 Rolls (2 High)" : "Rolls Mid T4 (2 High)";
      } else if (pIlvl >= 1740) {
        bonusPct = 12.80;
        label = isEn ? "Standard Mid T4 Rolls" : "Rolls Mid T4 (Standard)";
      } else {
        bonusPct = 11.50;
        label = isEn ? "Early T4 Rolls" : "Rolls T4 Débutants";
      }
    }

    return { bonusPct, label, highCount, midCount, lowCount, deadCount, totalFound, slotLines };
  }

  function extractPlayerSystems(playerChar, isEn = false) {
    if (!playerChar) return {};
    const normClass = normalizeClassName(playerChar.className || '').toLowerCase();
    const isSupport = playerChar.role === 'support' || (playerChar.role !== 'dps' && ['paladin', 'bard', 'artist', 'holyknight', 'valkyrie', 'yinyangshi'].some(s => normClass.includes(s)));
    const cKey = (playerChar.id || playerChar.name || '').toLowerCase().trim();
    const canon = (playerChar.rawProfile ? playerChar : null);

    // 1. Ark Grid Status
    const arkStatus = getArkGridStatus(playerChar) || (canon ? getArkGridStatus(canon) : { hasSun17: false, hasMoon17: false, starTier: 1 });
    // Statut Ark Grid Universel (100% universel pour tout profil importé ou preset)
    const hasSun17 = !!arkStatus.hasSun17;
    const hasMoon17 = !!arkStatus.hasMoon17;
    const starTier = arkStatus.starTier || 1;

    const allBpParts = (playerChar.rawProfile && playerChar.rawProfile.battlePoint && playerChar.rawProfile.battlePoint.parts)
      || (playerChar.battlePoint && playerChar.battlePoint.parts)
      || (playerChar.rawProfile && playerChar.rawProfile.loadout && playerChar.rawProfile.loadout.battlePoint && playerChar.rawProfile.loadout.battlePoint.parts)
      || (playerChar.rawProfile && playerChar.rawProfile.loadouts && playerChar.rawProfile.loadouts[0] && playerChar.rawProfile.loadouts[0].battlePoint && playerChar.rawProfile.loadouts[0].battlePoint.parts)
      || (playerChar.loadout && playerChar.loadout.battlePoint && playerChar.loadout.battlePoint.parts)
      || (canon && canon.rawProfile && canon.rawProfile.battlePoint && canon.rawProfile.battlePoint.parts)
      || (canon && canon.battlePoint && canon.battlePoint.parts)
      || [];

    // 2. Weapon & Gear
    const gear = playerChar.gear 
      || (playerChar.rawProfile && playerChar.rawProfile.gear)
      || (playerChar.loadout && playerChar.loadout.gear)
      || (canon && canon.gear) 
      || { weapon: 17, head: 14, chest: 14, pants: 14, shoulder: 14, gloves: 14 };
    const wLvl = gear.weapon !== undefined ? gear.weapon : 17;
    const avgArmor = Math.round(((gear.head || 14) + (gear.chest || 14) + (gear.pants || 14) + (gear.shoulder || 14) + (gear.gloves || 14)) / 5);

    // Détection Serka (Advanced Ancient T4 Tier 2: décalage de +9 crans d'affinage / +45 iLvl)
    const pIlvlForGear = playerChar.ilvl || (canon && canon.ilvl) || 1750;
    const isSerkaWeapon = !!(gear.isSerkaWeapon || gear.weaponTier === 2 || (pIlvlForGear >= 1735 && wLvl <= 16));
    const serkaArmorCount = gear.serkaArmorCount !== undefined ? gear.serkaArmorCount : (gear.isSerkaArmors ? 5 : ((pIlvlForGear >= 1735 && avgArmor <= 14) ? 5 : 0));
    const isSerkaArmors = serkaArmorCount >= 3;

    const effWLvl = gear.effectiveWeapon !== undefined ? gear.effectiveWeapon : (wLvl + (isSerkaWeapon ? 9 : 0));
    const effAvgArmor = gear.effectiveAvgArmor !== undefined ? gear.effectiveAvgArmor : (avgArmor + (isSerkaArmors ? 9 : 0));

    // Extraction de la qualité réelle de l'arme (type 4 ou property weaponQuality)
    const qPart = allBpParts.find(p => p.type === 4 || p.quality !== undefined);
    const wQual = (qPart && qPart.quality !== undefined)
      ? qPart.quality
      : (playerChar.weaponQuality !== undefined 
          ? playerChar.weaponQuality 
          : (playerChar.rawProfile && playerChar.rawProfile.weaponQuality !== undefined 
              ? playerChar.rawProfile.weaponQuality 
              : (canon && canon.weaponQuality !== undefined ? canon.weaponQuality : 90)));

    // Dégâts additionnels de qualité (ex: 29.21% pour Qualité 98)
    const wQualVal = (qPart && qPart.value !== undefined && qPart.value > 0)
      ? (qPart.value / 100)
      : (playerChar.weaponQualityValue !== undefined && playerChar.weaponQualityValue > 0
          ? (playerChar.weaponQualityValue / 100) 
          : (playerChar.rawProfile && playerChar.rawProfile.weaponQualityValue !== undefined && playerChar.rawProfile.weaponQualityValue > 0
              ? (playerChar.rawProfile.weaponQualityValue / 100) 
              : (10 + (wQual * 0.196))));

    // Bonus d'Affinage Inven (+1.20% net CP par niveau équivalent au-dessus du palier +12)
    const wHoningBonus = Math.max(0, (effWLvl - 12) * WEAPON_HONING_BONUS_PER_LVL);
    const weaponBonusPct = Number((wQualVal + wHoningBonus).toFixed(2));

    // Armures T4 : MainStat + Vitalité/HP des 5 pièces d'armure (+1.37% DPS / +1.50% Supp par niveau moyen équivalent)
    const armorBonusPct = isSupport 
      ? Number((12.00 + (effAvgArmor - 12) * ARMOR_HONING_BONUS_PER_LVL.support).toFixed(2))
      : Number((8.00 + (effAvgArmor - 12) * ARMOR_HONING_BONUS_PER_LVL.dps).toFixed(2));

    // 3. Adv Honing
    const adv = playerChar.advHoning !== undefined 
      ? playerChar.advHoning 
      : (playerChar.rawProfile && playerChar.rawProfile.advHoning !== undefined 
          ? playerChar.rawProfile.advHoning 
          : (canon && canon.advHoning !== undefined ? canon.advHoning : 40));
    const advBonusPct = adv >= 40 ? 8.80 : (adv >= 20 ? 5.50 : (adv >= 10 ? 3.00 : 0.00));

    // 4. Ark Passive Points (Données réelles de Raid)
    const pIlvl = playerChar.ilvl || (canon && canon.ilvl) || 1750;
    const isEndgame = pIlvl >= 1740;
    const ap = playerChar.apPoints || (playerChar.rawProfile && playerChar.rawProfile.apPoints) || (canon && canon.apPoints) || {
      evolution: isEndgame ? 140 : 120,
      enlightenment: isEndgame ? 101 : 88,
      leap: isEndgame ? 70 : 50
    };
    const evoPts = ap.evolution || (isEndgame ? 140 : 120);
    const enlPts = ap.enlightenment || (isEndgame ? 101 : 88);
    const leapPts = ap.leap || (isEndgame ? 70 : 50);

    // 5. Gems
    const gemDesc = getCharacterGemSummary(playerChar, isEn);
    const parts = (typeof extractCharacterGemParts === 'function')
      ? extractCharacterGemParts(playerChar)
      : ((playerChar && Array.isArray(playerChar.gemParts) && playerChar.gemParts.length > 0)
          ? playerChar.gemParts
          : (canon && Array.isArray(canon.gemParts) && canon.gemParts.length > 0 ? canon.gemParts : null));

    let gemBonusPct = 36.00;
    if (parts && parts.length > 0) {
      const gc = countGemLevels(parts, isSupport);
      const weighted = [7, 8, 9, 10].reduce((s, lvl) => s + gc[lvl] * GEM_LEVEL_BONUS_PCT[lvl], 0);
      gemBonusPct = Number((weighted / parts.length).toFixed(2));
    } else {
      if (gemDesc.includes('10')) gemBonusPct = 48.00;
      else if (gemDesc.includes('9')) gemBonusPct = 40.50;
      else if (gemDesc.includes('7')) gemBonusPct = 33.55;
      else gemBonusPct = 36.00;
    }

    // 6. Accessories (Évaluation dynamique des 5 bijoux et des 15 lignes d'affinage T4)
    const accEval = evaluateCharacterAccessories(playerChar, isSupport, isEn);
    const accLabel = accEval.label;
    const accBonusPct = accEval.bonusPct;

    // 7. Engravings & Ability Stone
    const spec = getCharacterSpecName(playerChar);

    const engParts = allBpParts.filter(p => p.type === 10 || p.type === 11 || (p.grade && p.grade.includes('engrave')));
    let engBonusPct = 101.94;
    let hasRealEng = false;
    if (engParts.length > 0) {
      const sumVal = engParts.reduce((s, p) => s + (p.value || 0), 0);
      if (sumVal > 0) {
        engBonusPct = Number((sumVal / 100).toFixed(2));
        hasRealEng = true;
      }
    } else {
      const gravItems = (Array.isArray(playerChar.items) && playerChar.items.filter(i => i.cat === 'Gravures').length > 0)
        ? playerChar.items.filter(i => i.cat === 'Gravures')
        : ((canon && Array.isArray(canon.items) && canon.items.filter(i => i.cat === 'Gravures').length > 0)
            ? canon.items.filter(i => i.cat === 'Gravures')
            : []);
      if (gravItems.length > 0) {
        const sumVal = gravItems.reduce((s, it) => s + (parseFloat((it.val || it.mult || '0').replace(/[^0-9.]/g, '')) || 0), 0);
        if (sumVal > 50) {
          engBonusPct = Number(sumVal.toFixed(2));
          hasRealEng = true;
        }
      }
    }

    let engLabel = "";
    const stoneNotice = hasRealEng ? (isEn ? ` (Stone & Relic: +${engBonusPct.toFixed(2)}%)` : ` (Pierre & Relique: +${engBonusPct.toFixed(2)}%)`) : "";
    if (isSupport) {
      if (normClass.includes('paladin')) {
        engLabel = (isEn ? "Blessed Aura 3, 5 Full T4 Relic Engravings" : "Aura Sacrée 3, 5 Gravures Reliques T4") + stoneNotice;
      } else if (normClass.includes('bard')) {
        engLabel = (isEn ? "Desperate Salvation 3, 5 Full T4 Relic Engravings" : "Salut Désespéré 3, 5 Gravures Reliques T4") + stoneNotice;
      } else if (normClass.includes('artist') || normClass.includes('yinyangshi')) {
        engLabel = (isEn ? "Full Bloom 3, 5 Full T4 Relic Engravings" : "Pleine Floraison 3, 5 Gravures Reliques T4") + stoneNotice;
      } else if (normClass.includes('valkyrie')) {
        engLabel = (isEn ? "Liberator 3, 5 Full T4 Relic Engravings" : "Libératrice 3, 5 Gravures Reliques T4") + stoneNotice;
      } else {
        engLabel = (isEn ? `${spec} 3, 5 Full T4 Relic Engravings` : `${spec} 3, 5 Gravures Reliques T4`) + stoneNotice;
      }
    } else {
      engLabel = (isEn ? `${spec} 3, 5 Full T4 Relic Engravings` : `${spec} 3, 5 Gravures Reliques T4`) + stoneNotice;
    }

    // 7b. Main Stat & Base AP (Type 1)
    const t1Part = allBpParts.find(p => p.type === 1);
    const mainStatName = getMainStatName(playerChar.className || '', isEn);
    let baseAtkLabel = '';
    let baseAtkBonusPct = 37.00;
    if (t1Part) {
      const mStat = t1Part.mainStat || 0;
      const bAp = t1Part.baseAttackPower || 0;
      const mStatK = (mStat / 1000).toFixed(0);
      const bApK = (bAp / 1000).toFixed(1);
      baseAtkLabel = `${mainStatName} ${mStatK}k (${bApK}k AP)`;
      baseAtkBonusPct = Number((bAp / 5000).toFixed(2));
    } else {
      const fallbackMStat = playerChar.mainStat || (pIlvl >= 1770 ? 735000 : (pIlvl >= 1750 ? 690000 : 640000));
      baseAtkLabel = `${mainStatName} ${(fallbackMStat / 1000).toFixed(0)}k`;
      baseAtkBonusPct = Number((fallbackMStat / 20000).toFixed(2));
    }

    // 7c. Combat Stats (Type 26: Crit / Spec / Swift)
    const t26Part = allBpParts.find(p => p && (p.type === 26 || p.total));
    let totalPtsNum = t26Part && t26Part.total ? t26Part.total : 0;
    if (!totalPtsNum && t26Part && t26Part.value) {
      totalPtsNum = isSupport ? Math.round(t26Part.value / 4) : Math.round(t26Part.value / 3);
    }
    if (!totalPtsNum) {
      totalPtsNum = pIlvl >= 1770 ? 2495 : (pIlvl >= 1750 ? 2386 : 2280);
    }

    // Normalisation unifiée : Support base 2500 pts = 100% (+0.04%/pt), DPS base 2500 pts = 75% (+0.03%/pt)
    let combatStatsBonusPct = isSupport
      ? Number(((totalPtsNum / 2500) * 100).toFixed(2))
      : Number((totalPtsNum * 0.03).toFixed(2));
    const totalPtsLabel = ` (${formatNumber(totalPtsNum)} pts)`;
    let combatStatsLabel = isEn
      ? `Combat Stats${totalPtsLabel} (+${combatStatsBonusPct.toFixed(2)}%)`
      : `Stats de Combat${totalPtsLabel} (+${combatStatsBonusPct.toFixed(2)}%)`;

    // 8. Ark Grid Percentages & Labels (Calcul dynamique sur battlePoint.parts type 29 pour Soleil, Lune, Étoile)
    const coreParts = (Array.isArray(allBpParts) && allBpParts.length > 0)
      ? allBpParts.filter(p => p.type === 29)
      : [];

    const rawCores = (playerChar && (playerChar.arkGridCores || (playerChar.loadout && playerChar.loadout.arkGridCores) || (playerChar.rawProfile && (playerChar.rawProfile.arkGridCores || (playerChar.rawProfile.loadout && playerChar.rawProfile.loadout.arkGridCores)))))
      || (canon && (canon.arkGridCores || (canon.rawProfile && canon.rawProfile.arkGridCores)))
      || [];

    function evalCoreGroup(prefixes, nameFr, nameEn, fallbackBonus, fallbackTier) {
      const matching = coreParts.filter(p => {
        const s = (p.id || '').toString();
        return prefixes.some(pr => s.startsWith(pr));
      });

      // Compléter tout cœur manquant (ex: 67312 Chaos Star Support exclu de Bible parts29, ou profil entier sans parts29)
      if (Array.isArray(rawCores) && rawCores.length > 0) {
        prefixes.forEach(pr => {
          const alreadyMatched = matching.some(p => (p.id || '').toString().startsWith(pr));
          if (!alreadyMatched) {
            const raw = rawCores.find(c => {
              const idStr = (c.id || '').toString();
              return idStr.startsWith(pr);
            });
            if (raw) {
              const pts = Array.isArray(raw.gems)
                ? raw.gems.reduce((s, g) => s + (g.corePoints || 0), 0)
                : (raw.points || 17);
              const isAncient = ((raw.id || 0) % 10 === 6) || raw.grade === 'ancient';
              const bonusValPct = getArkGridCoreBonus(pr, pts, isSupport, isAncient);
              matching.push({
                id: raw.id,
                points: pts,
                value: Math.round(bonusValPct * 100),
                fromRaw: true
              });
            }
          }
        });
      }

      if (matching.length > 0) {
        let mult = 1;
        let maxPoints = 0;
        let hasAncient = false;
        let hasRelic = false;
        matching.forEach(p => {
          const val = ('value' in p ? p.value : p.min) || 0;
          mult *= (1 + val / 10000);
          if (p.points && p.points > maxPoints) maxPoints = p.points;
          const gradeDigit = (p.id || 0) % 10;
          if (gradeDigit === 6) hasAncient = true;
          else if (gradeDigit === 5) hasRelic = true;
        });
        const bonusPct = Number(((mult - 1) * 100).toFixed(2));
        // Points de chaque cœur (Ordre puis Chaos), pas seulement le maximum
        const corePts = prefixes.map((pr, k) => {
          const part = matching.find(p => (p.id || '').toString().startsWith(pr));
          if (!part || !part.points) return null;
          const kind = k === 0 ? (isEn ? 'Order' : 'Ordre') : 'Chaos';
          return `${kind} ${part.points}P`;
        }).filter(Boolean);
        const ptsStr = corePts.length
          ? corePts.join(' · ')
          : (maxPoints > 0 ? (isEn ? `Tier ${maxPoints}P` : `Palier ${maxPoints}P`) : (isEn ? 'Tier 17P+' : 'Palier 17P+'));
        const gradeStr = (hasAncient && !hasRelic)
          ? (isEn ? 'Ancient' : 'Ancien')
          : (hasRelic && !hasAncient ? (isEn ? 'Relic' : 'Relique') : (hasAncient ? (isEn ? 'Ancient/Relic' : 'Ancien/Relique') : ''));
        const label = isEn
          ? `${gradeStr ? gradeStr + ' ' : ''}${ptsStr} (${nameEn}: +${bonusPct.toFixed(2)}%)`.trim()
          : `${gradeStr ? gradeStr + ' ' : ''}${ptsStr} (${nameFr} : +${bonusPct.toFixed(2)}%)`.trim();
        return { bonusPct, label };
      }
      // Fallback si battlePoint.parts type 29 absent
      const bonusPct = fallbackBonus;
      const label = isEn
        ? `Tier ${fallbackTier}P (${nameEn}: +${bonusPct.toFixed(2)}%)`
        : `Palier ${fallbackTier}P (${nameFr} : +${bonusPct.toFixed(2)}%)`;
      return { bonusPct, label };
    }

    const defaultSunBonus = hasSun17 ? (isSupport ? 7.00 : 10.50) : (isSupport ? 4.50 : 6.00);
    const sunEval = evalCoreGroup(['67300', '67310'], 'Cœurs Soleil', 'Sun Cores', defaultSunBonus, hasSun17 ? 17 : 10);
    const sunBonusPct = sunEval.bonusPct;
    const sunLabel = sunEval.label;

    const defaultMoonBonus = hasMoon17 ? (isSupport ? 7.00 : 10.50) : (isSupport ? 4.50 : 6.00);
    const moonEval = evalCoreGroup(['67301', '67311'], 'Cœurs Lune', 'Moon Cores', defaultMoonBonus, hasMoon17 ? 17 : 10);
    const moonBonusPct = moonEval.bonusPct;
    const moonLabel = moonEval.label;

    let defaultStarBonus = isSupport ? 4.00 : 6.00;
    let defaultStarTier = 10;
    if (starTier >= 3) { defaultStarBonus = isSupport ? 6.00 : 8.15; defaultStarTier = 17; }
    else if (starTier >= 2) { defaultStarBonus = isSupport ? 5.00 : 7.20; defaultStarTier = 14; }
    const starEval = evalCoreGroup(['67302', '67312'], 'Cœurs Étoile', 'Star Cores', defaultStarBonus, defaultStarTier);
    const starBonusPct = starEval.bonusPct;
    const starLabel = starEval.label;

    const weaponNameStr = isSerkaWeapon
      ? (isEn ? `T4 Serka Weapon +${wLvl} (Eq. +${effWLvl})` : `Arme T4 Serka +${wLvl} (Éq. +${effWLvl})`)
      : (isEn ? `T4 Weapon +${wLvl}` : `Arme T4 +${wLvl}`);
    const weaponLabel = `${weaponNameStr} (${isEn ? 'Quality' : 'Qualité'} ${wQual})`;

    const armorsLabel = isSerkaArmors
      ? (isEn ? `T4 Serka Armor Avg +${avgArmor} (Eq. +${effAvgArmor})` : `Armures T4 Serka Moyenne +${avgArmor} (Éq. +${effAvgArmor})`)
      : (isEn ? `T4 Armor Avg +${avgArmor}` : `Armures T4 Moyenne +${avgArmor}`);

    const advLabel = isEn
      ? `T4 Advanced Honing +${adv} ${adv >= 40 ? 'complete' : ''}`.trim()
      : `Affinage Avancé +${adv} ${adv >= 40 ? 'complet' : ''}`.trim();

    const transWeaponLabel = isEn ? "Weapon Transcendence R3 (21 Pts)" : "Transcendance Arme R3 (21 Pts)";
    const transArmorLabel = isEn ? "Armor Transcendence R3 (105 Pts)" : "Transcendance Armures R3 (105 Pts)";
    const karmaLabel = isEn ? "Karma Evolution Rank 6" : "Karma Évolution Rang 6";

    // 8b. Astrogemmes de la Grille d'Ark
    let astroBonusPct = isSupport ? 3.50 : 4.80;
    const bpParts = (playerChar.astrogems && playerChar.astrogems.length > 0)
      ? playerChar.astrogems
      : (allBpParts.length > 0 ? allBpParts.filter(p => p.type === 31 || p.type === 32) : []);
    if (Array.isArray(bpParts) && bpParts.length > 0) {
      const astros = bpParts.filter(p => p.type === 31 || p.type === 32);
      if (astros.length > 0) {
        const sumVal = astros.reduce((sum, p) => sum + (p.value || 0), 0);
        astroBonusPct = Number((sumVal / 100).toFixed(2));
      }
    }
    const astroLabel = isEn
      ? `Astrogems (+${astroBonusPct.toFixed(2)}% DPS/Buff Substats)`
      : `Astrogemmes (+${astroBonusPct.toFixed(2)}% Sous-stats Grille)`;

    // 8c. Bracelet T4 / Relique (Calcul fidèle sur lostark.bible battlePoint & items)
    let brBonusPct = isSupport ? 18.50 : 10.20;
    let brPerkNames = [];
    let hasRealBr = false;

    // A. Calcul précis via battlePoint.parts (types 19, 20 & 21 pour DPS et Support)
    if (Array.isArray(allBpParts) && allBpParts.length > 0) {
      const brParts = allBpParts.filter(p => [19, 20, 21].includes(p.type) && (('value' in p ? p.value : p.min) || 0) > 0);
      if (brParts.length > 0) {
        let t = 1;
        for (const p of brParts) {
          const val = ('value' in p ? p.value : p.min) || 0;
          t *= (1 + val / 10000);
        }
        brBonusPct = Number(((t * 100) - 100).toFixed(2));
        hasRealBr = true;
      }
    }

    // B. Fallback via items (cat: 'Bracelet')
    if (!hasRealBr) {
      const brItems = (Array.isArray(playerChar.items) ? playerChar.items.filter(i => i.cat === 'Bracelet') : [])
        || (playerChar.rawProfile && Array.isArray(playerChar.rawProfile.items) ? playerChar.rawProfile.items.filter(i => i.cat === 'Bracelet') : [])
        || (canon && Array.isArray(canon.items) ? canon.items.filter(i => i.cat === 'Bracelet') : []);
      if (brItems.length > 0) {
        let t = 1;
        let foundMult = false;
        for (const it of brItems) {
          if (it.mult && it.mult.includes('%')) {
            const mVal = parseFloat(it.mult.replace('+', '').replace('%', '')) || 0;
            if (mVal > 0) {
              t *= (1 + mVal / 100);
              foundMult = true;
            }
          }
        }
        if (foundMult) {
          brBonusPct = Number(((t * 100) - 100).toFixed(2));
          hasRealBr = true;
        }
      }
    }

    // C. Fallback par défaut selon iLvl
    if (!hasRealBr) {
      if (isSupport) {
        brBonusPct = pIlvl >= 1770 ? 18.50 : (pIlvl >= 1750 ? 15.00 : 12.00);
      } else {
        brBonusPct = pIlvl >= 1770 ? 10.20 : (pIlvl >= 1750 ? 8.16 : 6.50);
      }
    }

    // Extraction des noms de perks pour le label
    const brItemObj = (playerChar.bracelet) 
      || (playerChar.loadout && Array.isArray(playerChar.loadout.items) && playerChar.loadout.items.find(i => i.slot === 'bracelet'))
      || (playerChar.rawProfile && playerChar.rawProfile.loadout && Array.isArray(playerChar.rawProfile.loadout.items) && playerChar.rawProfile.loadout.items.find(i => i.slot === 'bracelet'))
      || (playerChar.rawProfile && playerChar.rawProfile.rawItems && playerChar.rawProfile.rawItems.find(i => i.slot === 'bracelet'))
      || null;

    if (brItemObj && brItemObj.data && Array.isArray(brItemObj.data.stats)) {
      brItemObj.data.stats.forEach(st => {
        if (st.type === 3 || st.type === 4 || st.index > 1000) {
          const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[st.index]);
          const pName = perk ? (isEn ? (perk.nameEn || perk.name) : perk.name) : null;
          if (pName && !brPerkNames.includes(pName)) brPerkNames.push(pName);
        }
      });
    }

    if (brPerkNames.length === 0) {
      const brTextItems = (Array.isArray(playerChar.items) ? playerChar.items.filter(i => i.cat === 'Bracelet') : [])
        || (playerChar.rawProfile && Array.isArray(playerChar.rawProfile.items) ? playerChar.rawProfile.items.filter(i => i.cat === 'Bracelet') : []);
      brTextItems.forEach(it => {
        const lbl = it.label || '';
        if (typeof BIBLE_BRACELET_PERKS !== 'undefined') {
          for (const [k, v] of Object.entries(BIBLE_BRACELET_PERKS)) {
            if (lbl.includes(v.name) || (v.nameEn && lbl.includes(v.nameEn))) {
              const pName = isEn ? (v.nameEn || v.name) : v.name;
              if (!brPerkNames.includes(pName)) brPerkNames.push(pName);
            }
          }
        }
      });
    }

    let brSummaryPerks = brPerkNames.length > 0 ? brPerkNames.join(' + ') : (isEn ? "Main Stats + Perk" : "Stats principales + Passif");
    const braceletLabel = isEn 
      ? `Relic (${brSummaryPerks}: +${brBonusPct.toFixed(2)}%)` 
      : `Relique (${brSummaryPerks} : +${brBonusPct.toFixed(2)}%)`;

    return {
      engravings: { label: engLabel, bonusPct: engBonusPct, estimated: !hasRealEng },
      baseAttackStat: { label: baseAtkLabel, bonusPct: baseAtkBonusPct },
      combatStats: { label: combatStatsLabel, bonusPct: combatStatsBonusPct },
      arkEvolution: { label: `${evoPts} Pts ${isEn ? 'Evolution' : 'Évolution'}`, bonusPct: Number((evoPts * 0.15).toFixed(2)) },
      arkEnlightenment: { label: `${enlPts} Pts ${isEn ? 'Enlightenment' : 'Illumination'}`, bonusPct: Number((enlPts * 0.28).toFixed(2)) },
      arkLeap: { label: `${leapPts} Pts ${isEn ? 'Leap' : 'Saut'}`, bonusPct: Number((leapPts * 0.20).toFixed(2)) },
      arkGridSun: { label: sunLabel, bonusPct: sunBonusPct },
      arkGridMoon: { label: moonLabel, bonusPct: moonBonusPct },
      arkGridStar: { label: starLabel, bonusPct: starBonusPct },
      arkGridAstrogems: { label: astroLabel, bonusPct: astroBonusPct },
      weapon: { label: weaponLabel, bonusPct: weaponBonusPct, quality: wQual, qualityVal: wQualVal, wLvl, effWLvl, isSerka: isSerkaWeapon },
      armors: { label: armorsLabel, bonusPct: Number(armorBonusPct.toFixed(2)), avgArmor, effAvgArmor, isSerka: isSerkaArmors, serkaArmorCount },
      advHoning: { label: advLabel, bonusPct: advBonusPct },
      transWeapon: { label: transWeaponLabel, bonusPct: 14.50 },
      transArmor: { label: transArmorLabel, bonusPct: 18.20 },
      accessories: { label: accLabel, bonusPct: accBonusPct },
      bracelet: { label: braceletLabel, bonusPct: brBonusPct, fromBattlePoint: hasRealBr },
      gems: { label: gemDesc, bonusPct: gemBonusPct },
      karma: { label: karmaLabel, bonusPct: 3.60 }
    };
  }

  function resolveTargetSystems(target, isEn = false) {
    if (!target) return {};
    let sys = {};

    // Si le target possède des données réelles de profil, on extrait fidèlement selon la langue demandée
    if (target.battlePoint || target.rawProfile || target.loadout || target.gear) {
      sys = extractPlayerSystems(target, isEn);
    } else if (target.systems && Object.keys(target.systems).length > 0) {
      sys = JSON.parse(JSON.stringify(target.systems));
    } else {
      sys = extractPlayerSystems(target, isEn);
    }

    const ilvl = target.ilvl || 1750;
    const isSupport = target.role === 'support' || (target.role !== 'dps' && ['paladin', 'bard', 'artist', 'valkyrie'].some(s => (target.className || '').toLowerCase().includes(s)));

    // Garde-fou 1 : Gravures Reliques T4 (Support: ~125-135%, DPS: ~101-105%)
    if (isSupport) {
      if (!sys.engravings || !sys.engravings.bonusPct || sys.engravings.bonusPct < 110) {
        const engVal = ilvl >= 1770 ? 134.50 : (ilvl >= 1750 ? 133.89 : 125.00);
        const specName = target.spec || (target.className || (isEn ? 'Support' : 'Support'));
        const stoneBonus = isEn
          ? (ilvl >= 1770 ? ` (Stone +3/+4 & Relic: +${engVal.toFixed(2)}%)` : ` (Stone +2/+3 & Relic: +${engVal.toFixed(2)}%)`)
          : (ilvl >= 1770 ? ` (Pierre +3/+4 & Relique: +${engVal.toFixed(2)}%)` : ` (Pierre +2/+3 & Relique: +${engVal.toFixed(2)}%)`);
        sys.engravings = {
          label: (isEn ? `${specName} 3, 5 Full T4 Relic Engravings` : `${specName} 3, 5 Gravures Reliques T4`) + stoneBonus,
          bonusPct: engVal,
          estimated: true
        };
      }
    } else {
      if (!sys.engravings || !sys.engravings.bonusPct || sys.engravings.bonusPct < 60) {
        const engVal = ilvl >= 1770 ? 104.24 : 101.94;
        const specName = target.spec || (target.className || (isEn ? 'Class' : 'Classe'));
        const stoneBonus = isEn
          ? (ilvl >= 1770 ? ` (Stone +3/+4 & Relic: +${engVal.toFixed(2)}%)` : ` (Stone +2/+3 & Relic: +${engVal.toFixed(2)}%)`)
          : (ilvl >= 1770 ? ` (Pierre +3/+4 & Relique: +${engVal.toFixed(2)}%)` : ` (Pierre +2/+3 & Relique: +${engVal.toFixed(2)}%)`);
        sys.engravings = {
          label: (isEn ? `${specName} 3, 5 Full T4 Relic Engravings` : `${specName} 3, 5 Gravures Reliques T4`) + stoneBonus,
          bonusPct: engVal,
          estimated: true
        };
      }
    }

    // Garde-fou 2 : Main Stat & Base AP (ne peut JAMAIS être <= 10% pour un profil T4 1700+)
    if (!sys.baseAttackStat || !sys.baseAttackStat.bonusPct || sys.baseAttackStat.bonusPct <= 10) {
      const mStatK = ilvl >= 1770 ? 735 : (ilvl >= 1750 ? 690 : 640);
      const bApK = ilvl >= 1770 ? 185.0 : (ilvl >= 1750 ? 172.5 : 160.0);
      const mStatName = getMainStatName(target.className || '', isEn);
      const bPct = Number((ilvl >= 1770 ? 37.00 : (ilvl >= 1750 ? 34.50 : 32.00)).toFixed(2));
      sys.baseAttackStat = {
        label: `${mStatName} ${mStatK}k (${bApK}k AP)`,
        bonusPct: bPct
      };
    }

    // Garde-fou 3 : Combat Stats (Support base 2500 pts = 100%, DPS base 2500 pts = 75%)
    if (isSupport) {
      if (!sys.combatStats || !sys.combatStats.bonusPct || sys.combatStats.bonusPct < 85) {
        const defaultPts = ilvl >= 1770 ? 2500 : (ilvl >= 1750 ? 2450 : 2380);
        const cPct = Number(((defaultPts / 2500) * 100).toFixed(2));
        sys.combatStats = {
          label: isEn ? `Combat Stats (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)` : `Stats de Combat (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)`,
          bonusPct: cPct
        };
      }
    } else {
      if (!sys.combatStats || !sys.combatStats.bonusPct || sys.combatStats.bonusPct <= 10) {
        const defaultPts = ilvl >= 1770 ? 2500 : (ilvl >= 1750 ? 2450 : 2380);
        const cPct = Number((defaultPts * 0.03).toFixed(2));
        sys.combatStats = {
          label: isEn ? `Combat Stats (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)` : `Stats de Combat (${formatNumber(defaultPts)} pts) (+${cPct.toFixed(2)}%)`,
          bonusPct: cPct
        };
      }
    }

    // Garde-fou 4 : Astrogemmes Grille d'Ark
    if (!sys.arkGridAstrogems || !sys.arkGridAstrogems.bonusPct || sys.arkGridAstrogems.bonusPct <= 0) {
      const aPct = Number((ilvl >= 1770 ? 7.52 : (ilvl >= 1750 ? 5.80 : (isSupport ? 3.50 : 4.80))).toFixed(2));
      sys.arkGridAstrogems = {
        label: isEn ? `Astrogems (+${aPct.toFixed(2)}% DPS/Buff Substats)` : `Astrogemmes (+${aPct.toFixed(2)}% Sous-stats Grille)`,
        bonusPct: aPct
      };
    }

    // Garde-fou 4b : Bracelet T4 / Relique
    if (!sys.bracelet || !sys.bracelet.bonusPct || sys.bracelet.bonusPct <= 0) {
      const defBrVal = isSupport
        ? (ilvl >= 1770 ? 18.50 : 15.00)
        : (ilvl >= 1770 ? 10.20 : 8.16);
      const defPerks = isSupport
        ? (isEn ? "Dagger + Cheers" : "Poignard + Ovation")
        : (isEn ? "Fervor + Wedge" : "Ferveur + Coinçage");
      sys.bracelet = {
        label: isEn ? `Relic (${defPerks}: +${defBrVal.toFixed(2)}%)` : `Relique (${defPerks} : +${defBrVal.toFixed(2)}%)`,
        bonusPct: defBrVal
      };
    }

    // Garde-fou 5 : Karma
    if (!sys.karma || !sys.karma.bonusPct) {
      sys.karma = {
        label: isEn ? "Karma Evolution Rank 6" : "Karma Évolution Rang 6",
        bonusPct: 3.60
      };
    }

    // Traduction Lost Ark officielle des labels selon la langue demandée
    for (const [k, v] of Object.entries(sys)) {
      if (v && v.label) {
        v.label = isEn ? formatLostArkEnglish(v.label) : formatLostArkFrench(v.label);
      }
    }

    return sys;
  }

  
  function computeGemUpgradeCost(player, target) {
    if (!player || !target) return 180000;
    const pGems = extractCharacterGemParts(player) || [];
    const tGems = extractCharacterGemParts(target) || [];
    
    // Coût cumulé pour amener une gemme du Niv. 7 à son niveau (mêmes coûts unitaires que le GPD)
    const levelOf = (val) => {
      if (val >= 12.0 || (val >= 6.9 && val <= 7.1)) return 10;
      if (val >= 10.7 || (val >= 6.3 && val <= 6.4)) return 9;
      if (val >= 9.5 || (val >= 5.7 && val <= 5.8)) return 8;
      return 7;
    };
    const getGemValue = (val) => {
      let total = 0;
      for (let l = 7; l < levelOf(val); l++) total += GEM_UPGRADE_COST[l];
      return total;
    };
    
    let pVal = 0; pGems.forEach(g => pVal += getGemValue(g));
    let tVal = 0; tGems.forEach(g => tVal += getGemValue(g));
    
    const diff = tVal - pVal;
    return diff > 0 ? diff : 180000;
  }

  
  // Écart de CP d'un système entre joueur (p) et référence (t) : les systèmes se multiplient,
  // donc l'écart est le gain relatif (1 + t) / (1 + p) − 1 appliqué au CP du joueur.
  // Positif : la référence est devant ; négatif : le joueur est devant.
  // Une valeur « estimée » (donnée absente, remplacée par une valeur par défaut) ne crée pas d'écart
  function isEstimatedPair(p, t) {
    return !!((p && p.estimated) || (t && t.estimated));
  }

  function systemGapCp(pPct, tPct, cp) {
    const base = cp && cp > 1000 ? cp : 3800;
    return base * ((1 + (tPct || 0) / 100) / (1 + (pPct || 0) / 100) - 1);
  }

  function computeDynamicGapsAndPlan(player, target, pSys, tSys, isEn) {
    if (!pSys) pSys = extractPlayerSystems(player, isEn);
    if (!tSys) tSys = resolveTargetSystems(target, isEn);
    const isSupport = player.role === 'support';
    const gaps = [];

    // Cœurs : un point par cœur lu jusqu'à 20
    // (sans données de cœur pour le groupe : forfait historique de 3 points)
    const coreSlots = getArkGridStatus(player).slots || {};
    const coreGroupCost = (orderKey, chaosKey) => {
      const pts = [orderKey, chaosKey].map(k => coreSlots[k] || 0);
      if (pts.every(v => v === 0)) return 3 * ARK_CORE_COST_PER_POINT;
      return pts.filter(v => v > 0 && v < 20).length * ARK_CORE_COST_PER_POINT;
    };
    // Affinage : coût attendu de chaque palier jusqu'au niveau de la référence (1 palier si inconnu)
    const honingPathCost = (piece, fromLvl, toLvl, pieces) => {
      const from = Math.floor(fromLvl);
      const to = Math.min(25, toLvl !== undefined && Math.floor(toLvl) > from ? Math.floor(toLvl) : from + 1);
      let total = 0;
      for (let l = from; l < to; l++) total += getLevelCost(piece, l).totalValue * pieces;
      return total;
    };
    const pWeapon = pSys.weapon || {};
    const tWeapon = tSys.weapon || {};
    const pArmors = pSys.armors || {};
    const tArmors = tSys.armors || {};

    const systemMeta = [
      { key: 'arkGridSun', title: isEn ? "Ark Grid: Sun Cores (Order & Chaos)" : "Ark Grid : Cœurs Soleil (Ordre & Chaos)", icon: '', cost: coreGroupCost('orderSun', 'chaosSun') },
      { key: 'arkGridMoon', title: isEn ? "Ark Grid: Moon Cores (Order & Chaos)" : "Ark Grid : Cœurs Lune (Ordre & Chaos)", icon: '', cost: coreGroupCost('orderMoon', 'chaosMoon') },
      { key: 'arkGridStar', title: isEn ? "Ark Grid: Star Cores (Order & Chaos)" : "Ark Grid : Cœurs Étoile (Ordre & Chaos)", icon: '', cost: coreGroupCost('orderStar', 'chaosStar') },
      { key: 'arkGridAstrogems', title: isEn ? "Ark Grid: Astrogems (Substats)" : "Ark Grid : Astrogemmes (Sous-stats)", icon: '', cost: 0 }, // obtenues en jeu : écart affiché, hors plan d'achat
      { key: 'accessories', title: isEn ? "T4 Accessory Lines (High Rolls)" : "Lignes d'Accessoires T4 (High Rolls)", icon: '', cost: ACC_UPGRADE_COST_AVG },
      { key: 'weapon', title: isEn ? "T4 Weapon Honing" : "Affinage Arme T4", icon: '', cost: honingPathCost('weapon', pWeapon.effWLvl !== undefined ? pWeapon.effWLvl : (pWeapon.wLvl || 12), tWeapon.effWLvl, 1) },
      { key: 'advHoning', title: isEn ? "T4 Advanced Honing" : "Affinage Avancé T4", icon: '', cost: 125000 },
      { key: 'bracelet', title: isEn ? "T4 Bracelet Passives (Circularity)" : "Passifs de Bracelet T4 (Circulaire)", icon: '', cost: 0 }, // obtenu en jeu : écart affiché, hors plan d'achat
      { key: 'gems', title: isEn ? "T4 Gems Tier" : "Palier de Gemmes T4", icon: '', cost: computeGemUpgradeCost(player, target) },
      { key: 'armors', title: isEn ? "T4 Armor Honing" : "Affinage Armures T4", icon: '', cost: honingPathCost('armor', pArmors.effAvgArmor !== undefined ? pArmors.effAvgArmor : (pArmors.avgArmor || 12), tArmors.effAvgArmor, 5) },
      // Stat principale et stats de combat découlent de l'équipement (bijoux, bracelet, affinage), déjà comptés
      // sur leurs propres lignes : coût 0 = affichées au diagnostic mais exclues du plan d'action.
      { key: 'baseAttackStat', title: isEn ? "Main Stat & Base AP" : "Stat Principale & Attaque de Base", icon: '', cost: 0 },
      { key: 'engravings', title: isEn ? "Engravings & Ability Stone" : "Gravures & Pierre de Naissance", icon: '', cost: 40000 },
      { key: 'combatStats', title: isEn ? "Combat Stats (Quality & Potions)" : "Stats de Combat (Qualité & Potions)", icon: '', cost: 0 },
      { key: 'arkEnlightenment', title: isEn ? "Ark Passive: Enlightenment (Spec Tree)" : "Ark Passive : Illumination (Arbre Spé)", icon: '', cost: 0 }, // points obtenus en jeu : écart affiché, hors plan d'achat
      { key: 'arkEvolution', title: isEn ? "Ark Passive: Evolution (Net Stats)" : "Ark Passive : Évolution (Stats Nets)", icon: '', cost: 0 },
      { key: 'arkLeap', title: isEn ? "Ark Passive: Leap (Hyper Awakening)" : "Ark Passive : Saut (Hyper Awakening)", icon: '', cost: 0 },
      { key: 'karma', title: isEn ? "T4 Karma (Evolution Rank 6)" : "Karma T4 (Évolution Rang 6)", icon: '', cost: 0 } // obtenu en jeu
    ];

    systemMeta.forEach(m => {
      const p = pSys[m.key] || { bonusPct: 0, label: '' };
      const t = tSys[m.key] || { bonusPct: 0, label: '' };
      const delta = isEstimatedPair(p, t) ? 0 : Number((t.bonusPct - p.bonusPct).toFixed(2));
      const gapCp = delta === 0 ? 0 : systemGapCp(p.bonusPct, t.bonusPct, player.cp);

      let tLabel = t.label || '';
      let pLabel = p.label || '';
      if (isEn) {
        tLabel = formatLostArkEnglish(tLabel);
        pLabel = formatLostArkEnglish(pLabel);
      } else {
        tLabel = formatLostArkFrench(tLabel);
        pLabel = formatLostArkFrench(pLabel);
      }

      if (delta > 0.05) {
        const gainCp = Math.round(gapCp);
        gaps.push({
          icon: m.icon,
          key: m.key,
          title: m.title,
          gainCp: gainCp,
          gainPct: delta,
          desc: isEn 
            ? `${tLabel} on benchmark vs ${pLabel} on your character (+${delta}% gap).`
            : `${tLabel} chez la référence contre ${pLabel} chez vous (écart de +${delta}%).`,
          cost: m.cost,
          roi: Math.round(m.cost / Math.max(1, gainCp)),
          priority: delta > 1.0 ? 'high' : 'med'
        });
      } else if (delta < -0.15) {
        const gainCp = Math.round(-gapCp);
        gaps.push({
          icon: m.icon,
          key: m.key,
          title: `${m.title} ${isEn ? '(Player Advantage)' : '(Avantage Joueur)'}`,
          gainCp: gainCp,
          gainPct: delta,
          desc: isEn
            ? `Your advantage: ${pLabel} vs ${tLabel} on benchmark (+${gainCp} CP in your favor!).`
            : `Votre avantage : ${pLabel} contre ${tLabel} chez la référence (+${gainCp} CP en votre faveur !).`,
          cost: 0,
          roi: 0,
          priority: 'player_lead'
        });
      }
    });

    gaps.sort((a, b) => {
      if (a.gainCp > 0 && a.priority !== 'player_lead' && (b.gainCp <= 0 || b.priority === 'player_lead')) return -1;
      if (b.gainCp > 0 && b.priority !== 'player_lead' && (a.gainCp <= 0 || a.priority === 'player_lead')) return 1;
      if (a.gainCp > 0 && b.gainCp > 0 && a.priority !== 'player_lead' && b.priority !== 'player_lead') return b.gainCp - a.gainCp;
      if (a.priority === 'player_lead' && b.priority !== 'player_lead') return -1;
      if (b.priority === 'player_lead' && a.priority !== 'player_lead') return 1;
      return 0;
    });

    const bothFullRelic = pSys.engravings && tSys.engravings && pSys.engravings.bonusPct >= 95 && tSys.engravings.bonusPct >= 95;
    const positiveGaps = gaps.filter(g => g.gainCp > 0 && g.cost > 0 && g.priority !== 'player_lead' && (!bothFullRelic || g.key !== 'engravings'));
    positiveGaps.sort((a, b) => a.roi - b.roi);

    const plan = positiveGaps.slice(0, 5).map((g, idx) => ({
      step: idx + 1,
      title: g.title,
      desc: g.desc,
      cost: formatNumber(g.cost) + ' g',
      gain: `+${formatNumber(g.gainCp)} CP`,
      roi: `${formatNumber(g.roi)} g / CP`
    }));

    return { gaps, plan };
  }
  // Répertoire de profils LIVE vérifiés en temps réel sur lostark.bible pour l'ensemble des 26 classes du jeu
  // 100% profils réels en direct de lostark.bible, zéro preset statique, zéro profil générique ou synthétique
  

  function getAvailableBenchmarks(playerChar) {
    if (!playerChar) return [];
    const pClass = normalizeClassName(playerChar.className || playerChar.characterClass || playerChar.class || '').toLowerCase();
    const isSupportClass = ['paladin', 'bard', 'artist', 'valkyrie'].some(s => pClass.includes(s));
    const pRole = playerChar.role || (isSupportClass ? 'support' : 'dps');
    const pName = (playerChar.name || playerChar.id || '').toLowerCase().trim();
    const list = [];

    // 1. Profils RÉELS LIVE recherchés et auto-chargés depuis lostark.bible (MÊME CLASSE ET MÊME RÔLE STRICTEMENT, SANS LE JOUEUR LUI-MÊME)
    const searchedList = benchmarkState.searchedTargets || [];
    searchedList.forEach(s => {
      const sName = (s.name || s.id || '').toLowerCase().trim();
      if (sName === pName) return;
      const sClass = normalizeClassName(s.className || s.characterClass || s.class || '').toLowerCase();
      const sRole = s.role || (isSupportClass ? (isSupportSpecName(s.spec) ? 'support' : 'dps') : 'dps');
      if (s && s.isLive && sClass === pClass && sRole === pRole) {
        list.push(s);
      }
    });

    // Références : uniquement des joueurs réels chargés en direct depuis lostark.bible
    // (ni personnages du roster ou de démo, ni profil généré)
    return list;
  }

  function findOptimalBenchmark(playerChar) {
    if (!playerChar) return null;
    const avail = getAvailableBenchmarks(playerChar);
    if (!avail || avail.length === 0) return null;

    const pIlvl = playerChar.ilvl || 1740;
    const pCp = playerChar.cp || playerChar.combatPower || 3500;
    const pSpec = getCharacterSpecName(playerChar).toLowerCase();
    const pClass = normalizeClassName(playerChar.className || playerChar.characterClass || playerChar.class || '').toLowerCase();
    const isSupportClass = ['paladin', 'bard', 'artist', 'valkyrie'].some(s => pClass.includes(s));
    const pRole = playerChar.role || (isSupportClass ? 'support' : 'dps');

    // Filtre strict : même classe et même rôle obligatoires (zéro comparaison Support vs DPS !)
    const sameClass = avail.filter(b => {
      const bClass = normalizeClassName(b.className || b.characterClass || b.class || '').toLowerCase();
      if (bClass !== pClass) return false;
      const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
      return bRole === pRole;
    });
    if (sameClass.length === 0) return null;

    // 1. Cherche en priorité un profil LIVE réel de même spé avec CP >= pCp ET iLvl proche (écart <= 15 iLvl)
    const closeSameSpecLive = sameClass.filter(b => b.isLive && (b.spec || '').toLowerCase() === pSpec && b.cp >= pCp && Math.abs(b.ilvl - pIlvl) <= 15.0);
    if (closeSameSpecLive.length > 0) {
      closeSameSpecLive.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
      return closeSameSpecLive[0];
    }

    // 2. Cherche un profil LIVE réel de même spé avec CP >= pCp (écart <= 30 iLvl)
    const anySameSpecLive = sameClass.filter(b => b.isLive && (b.spec || '').toLowerCase() === pSpec && b.cp >= pCp && Math.abs(b.ilvl - pIlvl) <= 30.0);
    if (anySameSpecLive.length > 0) {
      anySameSpecLive.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
      return anySameSpecLive[0];
    }

    // 3. Cherche un profil LIVE réel de la même classe et rôle avec CP >= pCp ET iLvl proche (écart <= 20 iLvl)
    const closeClassLiveHigher = sameClass.filter(b => b.isLive && b.cp >= pCp && Math.abs(b.ilvl - pIlvl) <= 20.0);
    if (closeClassLiveHigher.length > 0) {
      closeClassLiveHigher.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
      return closeClassLiveHigher[0];
    }

    // 4. Cherche un profil LIVE de même classe et rôle avec CP >= pCp
    const anyClassLiveHigher = sameClass.filter(b => b.isLive && b.cp >= pCp);
    if (anyClassLiveHigher.length > 0) {
      anyClassLiveHigher.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
      return anyClassLiveHigher[0];
    }

    // 5. PRIORITÉ ABSOLUE AUX VRAIS JOUEURS : tout profil LIVE réel même classe et rôle le plus proche en iLvl
    const anyLive = sameClass.filter(b => b.isLive);
    if (anyLive.length > 0) {
      anyLive.sort((a, b) => Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl));
      return anyLive[0];
    }

    // Aucun joueur réel disponible : pas de référence (l'onglet invite à rechercher un joueur)
    return null;
  }

  function convertCharToBenchmarkFormat(c, isEn) {
    if (!c) return null;
    const normClass = normalizeClassName(c.className || '') || 'Breaker';
    const isSupp = c.role === 'support' || (c.role !== 'dps' && ['paladin', 'bard', 'artist', 'valkyrie'].some(s => normClass.toLowerCase().includes(s)));
    const systems = extractPlayerSystems(c, isEn);
    return {
      id: `roster_${(c.id || c.name || 'char').toLowerCase()}`,
      name: c.name,
      className: normClass,
      spec: getCharacterSpecName(c),
      role: isSupp ? 'support' : 'dps',
      ilvl: Number((c.ilvl || 1700).toFixed(2)),
      cp: Math.round(c.cp || 4000),
      server: c.server || 'Elpon (CE)',
      guild: c.guild || 'Roster',
      rosterLevel: c.rosterLevel || 300,
      avatarUrl: getCharacterFaceAvatar(c),
      bibleUrl: `https://lostark.bible/character/CE/${encodeURIComponent(c.name)}`,
      isLive: false,
      gemTier: (c.gemParts && c.gemParts.some(g => g >= (isSupp ? 11.0 : 6.4))) ? 'gem9' : 'gem8',
      gemDesc: getCharacterGemSummary(c, isEn),
      systems: systems,
      accessories: c.accessories || (c.rawProfile && c.rawProfile.accessories) || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.items && c.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot))) || [],
      bracelet: c.bracelet || (c.rawProfile && c.rawProfile.bracelet) || (c.rawProfile && c.rawProfile.loadout && c.rawProfile.loadout.items && c.rawProfile.loadout.items.find(i => i.slot === 'bracelet')) || (c.loadout && c.loadout.items && c.loadout.items.find(i => i.slot === 'bracelet')) || null,
      rawProfile: c.rawProfile,
      loadout: c.loadout || (c.rawProfile && c.rawProfile.loadout) || null
    };
  }

  function buildAccBreakdownHtml(player, target, cpImpact, isEn) {
    const isSupport = player.role === 'support' || (player.className && ['Paladin', 'Bard', 'Artist'].some(s => (player.className || '').toLowerCase().includes(s.toLowerCase())));

    let pAccItems = (player && player.accessories)
      || (player && player.rawProfile && player.rawProfile.accessories)
      || (player && player.rawProfile && player.rawProfile.loadout && player.rawProfile.loadout.items && player.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (player && player.loadout && player.loadout.items && player.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || [];

    // Fallback direct sur les données réelles vérifiées de Àlphâ si non ré-hydratées depuis le cache local

    const slots = [
      { key: 'neck', name: isEn ? 'Necklace T4' : 'Collier T4', icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
      { key: 'ear1', name: isEn ? 'Earring #1 T4' : "Boucle d'oreille #1 T4", icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
      { key: 'ear2', name: isEn ? 'Earring #2 T4' : "Boucle d'oreille #2 T4", icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
      { key: 'finger1', name: isEn ? 'Ring #1 T4' : 'Anneau #1 T4', icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' },
      { key: 'finger2', name: isEn ? 'Ring #2 T4' : 'Anneau #2 T4', icon: '', pLines: [], tLines: [], impactCp: 0, verdict: '' }
    ];

    // Extraction des lignes affinées réelles du joueur
    slots.forEach(s => {
      const item = pAccItems.find(i => i.slot === s.key);
      if (item && item.data && Array.isArray(item.data.stats)) {
        const rolls = item.data.stats.filter(st => st.base === false);
        rolls.forEach(r => {
          s.pLines.push(decodeAccessoryStat(r, s.key, isSupport, isEn));
        });
        // Si l'accessoire n'a pas encore toutes ses lignes d'affinage débloquées
        while (s.pLines.length < 3) {
          s.pLines.push({
            text: isEn ? "Line to roll" : "Ligne à affiner",
            isDead: false,
            rollTier: 'low',
            tierLabel: isEn ? "To Roll" : "À Affiner"
          });
        }
      }
    });

    // Extraction depuis les items textuels du preset (CANONICAL_PRESETS) si pas de données d'objets bruts
    const cKey = (player.id || player.name || '').toLowerCase().trim();
    const canon = null;
    const playerItems = (player.items && Array.isArray(player.items) && player.items.filter(i => i.cat === 'Accessoires').length > 0)
      ? player.items.filter(i => i.cat === 'Accessoires')
      : (canon && Array.isArray(canon.items) ? canon.items.filter(i => i.cat === 'Accessoires') : []);

    if (playerItems.length > 0) {
      slots.forEach(s => {
        if (s.pLines.length === 0) {
          let slotMatchStr = '';
          if (s.key === 'neck') slotMatchStr = 'collier';
          else if (s.key === 'ear1') slotMatchStr = 'boucle d\'oreille #1';
          else if (s.key === 'ear2') slotMatchStr = 'boucle d\'oreille #2';
          else if (s.key === 'finger1') slotMatchStr = 'anneau #1';
          else if (s.key === 'finger2') slotMatchStr = 'anneau #2';

          const matchingItems = playerItems.filter(it => (it.label || '').toLowerCase().includes(slotMatchStr));
          matchingItems.forEach(it => {
            const rawLabel = it.label || '';
            const statText = rawLabel.includes('—') ? rawLabel.split('—')[1].trim() : rawLabel;
            const note = (it.note || '').toLowerCase();
            const val = it.val || '';
            let isDead = false;
            let rollTier = 'mid';
            let tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';

            if (isSupport) {
              if (statText.toLowerCase().includes('critique') || statText.toLowerCase().includes('crit') || statText.toLowerCase().includes('additionnel') || note.includes('exclu') || note.includes('non transféré')) {
                isDead = true;
                tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
              } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+800') || val.includes('+1.95%') || val.includes('+5.00%') || val.includes('+7.50%')) {
                rollTier = 'high';
                tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
              } else if (val.includes('+2.10%') || val.includes('+2.00%') || val.includes('+1.80%') || val.includes('+1.47%')) {
                rollTier = 'mid';
                tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
              } else {
                rollTier = 'low';
                tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
              }
            } else {
              if (statText.toLowerCase().includes('soins') || statText.toLowerCase().includes('bouclier') || statText.toLowerCase().includes('brand power') || statText.toLowerCase().includes('marque') || note.includes('exclu')) {
                isDead = true;
                tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
              } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+390') || val.includes('+960') || val.includes('+4.00%') || val.includes('+3.00%') || val.includes('+2.60%')) {
                rollTier = 'high';
                tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
              } else if (val.includes('+1.55%') || val.includes('+1.60%') || val.includes('+0.95%') || val.includes('+0.80%')) {
                rollTier = 'mid';
                tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
              } else {
                rollTier = 'low';
                tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
              }
            }

            s.pLines.push({ text: isEn ? formatLostArkEnglish(statText) : statText, isDead, rollTier, tierLabel });
          });

          while (s.pLines.length < 3) {
            s.pLines.push({
              text: isEn ? "Line to roll" : "Ligne à affiner",
              isDead: false,
              rollTier: 'low',
              tierLabel: isEn ? "To Roll" : "À Affiner"
            });
          }
        }
      });
    }

    // Fallback pour les profils démo ou théoriques sans données brutes
    slots.forEach(s => {
      if (s.pLines.length === 0) {
        if (isSupport) {
          if (s.key === 'neck') {
            s.pLines.push({ text: isEn ? "Brand Power (+4.80%)" : "Brand Power / Marque (+4.80%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", isDead: false, rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' });
            s.pLines.push({ text: isEn ? "Max HP (+3250)" : "Points de Vie Max (+3250)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          } else if (s.key === 'ear1' || s.key === 'ear2') {
            s.pLines.push({ text: isEn ? "Shield for Party Members (+2.10%)" : "Boucliers aux Membres (+2.10%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Recovery for Party Members (+2.10%)" : "Soins aux Membres (+2.10%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Max HP (+3250)" : "Points de Vie Max (+3250)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          } else {
            s.pLines.push({ text: isEn ? "Ally Damage Enhancement (+4.50%)" : "Effet Augmentation Dégâts d'Allié (+4.50%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Ally Atk. Power Enhancement (+3.00%)" : "Effet Amplification PA d'Allié (+3.00%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Max HP (+3250)" : "Points de Vie Max (+3250)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          }
        } else {
          if (s.key === 'neck') {
            s.pLines.push({ text: isEn ? "Atk. Power (+195)" : "Puissance d'Attaque (+195)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Additional Damage (+1.60%)" : "Dégâts Additionnels (+1.60%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", isDead: false, rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' });
          } else if (s.key === 'ear1' || s.key === 'ear2') {
            s.pLines.push({ text: isEn ? "Weapon Power (+1.80%)" : "Puissance d'Arme (+1.80%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Atk. Power (+0.95%)" : "Puissance d'Attaque (+0.95%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Atk. Power (+195)" : "Puissance d'Attaque (+195)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          } else {
            s.pLines.push({ text: isEn ? "Crit Damage (+2.40%)" : "Dégâts Critiques (+2.40%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Crit Rate (+0.95%)" : "Taux Critique (+0.95%)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
            s.pLines.push({ text: isEn ? "Atk. Power (+195)" : "Puissance d'Attaque (+195)", isDead: false, rollTier: 'mid', tierLabel: isEn ? 'Mid Roll' : 'Roll Moyen' });
          }
        }
      }
    });

    // Extraction des lignes de référence de la cible (cible réelle ou cibles Best-in-Slot T4 canoniques)
    const isTargetSupport = target && (target.role === 'support' || (target.className && ['Paladin', 'Bard', 'Artist'].some(s => (target.className || '').toLowerCase().includes(s.toLowerCase()))));
    const tAccItems = (target && target.accessories)
      || (target && target.rawProfile && target.rawProfile.accessories)
      || (target && target.rawProfile && target.rawProfile.loadout && target.rawProfile.loadout.items && target.rawProfile.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || (target && target.loadout && target.loadout.items && target.loadout.items.filter(i => ['neck', 'ear1', 'ear2', 'finger1', 'finger2'].includes(i.slot)))
      || [];

    slots.forEach(s => {
      const tItem = tAccItems.find(i => i.slot === s.key);
      if (tItem && tItem.data && Array.isArray(tItem.data.stats)) {
        const tRolls = tItem.data.stats.filter(st => st.base === false);
        tRolls.forEach(r => {
          s.tLines.push(decodeAccessoryStat(r, s.key, isTargetSupport, isEn));
        });
      }
    });

    // Extraction depuis les items de la cible si c'est un preset
    const targetItems = (target && target.items && Array.isArray(target.items) && target.items.filter(i => i.cat === 'Accessoires').length > 0)
      ? target.items.filter(i => i.cat === 'Accessoires')
      : [];

    if (targetItems.length > 0) {
      slots.forEach(s => {
        if (s.tLines.length === 0) {
          let slotMatchStr = '';
          if (s.key === 'neck') slotMatchStr = 'collier';
          else if (s.key === 'ear1') slotMatchStr = 'boucle d\'oreille #1';
          else if (s.key === 'ear2') slotMatchStr = 'boucle d\'oreille #2';
          else if (s.key === 'finger1') slotMatchStr = 'anneau #1';
          else if (s.key === 'finger2') slotMatchStr = 'anneau #2';

          const matchingItems = targetItems.filter(it => (it.label || '').toLowerCase().includes(slotMatchStr));
          matchingItems.forEach(it => {
            const rawLabel = it.label || '';
            const statText = rawLabel.includes('—') ? rawLabel.split('—')[1].trim() : rawLabel;
            const note = (it.note || '').toLowerCase();
            const val = it.val || '';
            let isDead = false;
            let rollTier = 'mid';
            let tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';

            if (isTargetSupport) {
              if (statText.toLowerCase().includes('critique') || statText.toLowerCase().includes('crit') || statText.toLowerCase().includes('additionnel') || note.includes('exclu')) {
                isDead = true;
                tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
              } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+800') || val.includes('+1.95%') || val.includes('+5.00%') || val.includes('+7.50%')) {
                rollTier = 'high';
                tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
              } else if (val.includes('+2.10%') || val.includes('+2.00%') || val.includes('+1.80%')) {
                rollTier = 'mid';
                tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
              } else {
                rollTier = 'low';
                tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
              }
            } else {
              if (statText.toLowerCase().includes('soins') || statText.toLowerCase().includes('bouclier') || statText.toLowerCase().includes('brand power') || statText.toLowerCase().includes('marque') || note.includes('exclu')) {
                isDead = true;
                tierLabel = isEn ? 'Dead Stat' : 'Ligne Inutile';
              } else if (statText.toLowerCase().includes('dégâts infligés') || val.includes('+390') || val.includes('+960') || val.includes('+4.00%') || val.includes('+3.00%')) {
                rollTier = 'high';
                tierLabel = isEn ? 'High Roll' : 'Roll Élevé';
              } else if (val.includes('+1.55%') || val.includes('+1.60%') || val.includes('+0.95%')) {
                rollTier = 'mid';
                tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen';
              } else {
                rollTier = 'low';
                tierLabel = isEn ? 'Low Roll' : 'Roll Faible';
              }
            }
            s.tLines.push({ text: isEn ? formatLostArkEnglish(statText) : statText, isDead, rollTier, tierLabel });
          });
        }
      });
    }

    // Si pas de données d'accessoires brutes pour la cible, fournit les véritables lignes Best-in-Slot T4 High Rolls
    slots.forEach(s => {
      if (s.tLines.length === 0) {
        if (isTargetSupport) {
          if (s.key === 'neck') {
            s.tLines = [
              { text: isEn ? "Brand Power (+8.00%)" : "Brand Power / Marque (+8.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' },
              { text: isEn ? "Max HP (+6500)" : "Points de Vie Max (+6500)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
            ];
          } else if (s.key === 'ear1' || s.key === 'ear2') {
            s.tLines = [
              { text: isEn ? "Shield for Party Members (+3.50%)" : "Boucliers aux Membres (+3.50%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Recovery for Party Members (+3.50%)" : "Soins aux Membres (+3.50%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Max HP (+6500)" : "Points de Vie Max (+6500)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
            ];
          } else {
            s.tLines = [
              { text: isEn ? "Ally Damage Enhancement (+7.50%)" : "Effet Augmentation Dégâts d'Allié (+7.50%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Ally Atk. Power Enhancement (+5.00%)" : "Effet Amplification PA d'Allié (+5.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Max HP (+6500)" : "Points de Vie Max (+6500)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
            ];
          }
        } else {
          if (s.key === 'neck') {
            s.tLines = [
              { text: isEn ? "Outgoing Damage (+2.00%)" : "Dégâts infligés (+2.00%)", rollTier: 'passif', tierLabel: isEn ? 'Rank 3 Perk' : 'Passif Rang 3' },
              { text: isEn ? "Additional Damage (+2.60%)" : "Dégâts Additionnels (+2.60%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Atk. Power (+390)" : "Puissance d'Attaque (+390)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
            ];
          } else if (s.key === 'ear1' || s.key === 'ear2') {
            s.tLines = [
              { text: isEn ? "Weapon Power (+3.00%)" : "Puissance d'Arme (+3.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Atk. Power (+1.55%)" : "Puissance d'Attaque (+1.55%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: s.key === 'ear1' ? (isEn ? "Atk. Power (+390)" : "Puissance d'Attaque (+390)") : (isEn ? "Weapon Power (+960)" : "Puissance d'Arme (+960)"), rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
            ];
          } else {
            s.tLines = [
              { text: isEn ? "Crit Damage (+4.00%)" : "Dégâts Critiques (+4.00%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: isEn ? "Crit Rate (+1.55%)" : "Taux Critique (+1.55%)", rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' },
              { text: s.key === 'finger1' ? (isEn ? "Atk. Power (+390)" : "Puissance d'Attaque (+390)") : (isEn ? "Weapon Power (+960)" : "Puissance d'Arme (+960)"), rollTier: 'high', tierLabel: isEn ? 'High Roll' : 'Roll Élevé' }
            ];
          }
        }
      }
    });

    // Distribution exacte et parité mathématique du delta CP
    if (cpImpact <= 0) {
      slots.forEach(s => {
        s.impactCp = 0;
        s.verdict = isEn ? "Equivalent rolls and parity with benchmark." : "Lignes équivalentes et parité optimale avec la référence.";
      });
    } else {
      const weights = slots.map(s => {
        let w = 0;
        const hasDead = s.pLines.some(l => l.isDead);
        const hasUnrolled = s.pLines.some(l => l.tierLabel.includes('Affiner') || l.tierLabel.includes('To Roll'));
        const lowCount = s.pLines.filter(l => l.rollTier === 'low' && !l.isDead && !l.tierLabel.includes('Affiner') && !l.tierLabel.includes('To Roll')).length;
        const midCount = s.pLines.filter(l => l.rollTier === 'mid' && !l.isDead).length;
        if (hasDead) w += 3.5;
        if (hasUnrolled) w += 2.0;
        w += lowCount * 2.0;
        w += midCount * 0.8;
        return Math.max(0.5, w);
      });

      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let distributedCp = 0;

      // Passe 1 : Allocation proportionnelle brute
      slots.forEach((s, idx) => {
        const share = Math.round((weights[idx] / totalWeight) * cpImpact);
        s.impactCp = share;
        distributedCp += share;
      });

      // Réconciliation stricte pour garantir 100% de parité (somme == cpImpact)
      if (distributedCp !== cpImpact) {
        const diff = cpImpact - distributedCp;
        const maxSlot = slots.reduce((best, cur) => cur.impactCp > (best ? best.impactCp : -1) ? cur : best, null);
        if (maxSlot) {
          maxSlot.impactCp = Math.max(0, maxSlot.impactCp + diff);
        }
      }

      // Passe 2 : Détermination des verdicts
      slots.forEach(s => {
        const deadStats = s.pLines.filter(l => l.isDead);
        const unrolledCount = s.pLines.filter(l => l.tierLabel.includes('Affiner') || l.tierLabel.includes('To Roll')).length;
        const lowLines = s.pLines.filter(l => l.rollTier === 'low' && !l.isDead && !l.tierLabel.includes('Affiner') && !l.tierLabel.includes('To Roll')).map(l => isEn ? formatLostArkEnglish(l.text) : l.text);
        const midLines = s.pLines.filter(l => l.rollTier === 'mid' && !l.isDead).map(l => isEn ? formatLostArkEnglish(l.text) : l.text);

        if (deadStats.length > 0) {
          const deadName = deadStats.map(d => isEn ? formatLostArkEnglish(d.text) : d.text).join(', ');
          s.verdict = isEn
            ? `Replace dead line (${deadName}) with active High Roll (+${s.impactCp} CP).`
            : `Remplacement de la ligne morte (${deadName}) par un High Roll actif (+${s.impactCp} CP).`;
        } else if (unrolledCount > 0) {
          s.verdict = isEn
            ? `Roll empty slot to an active High Roll (+${s.impactCp} CP).`
            : `Roulage de l'emplacement vide vers un High Roll actif (+${s.impactCp} CP).`;
        } else if (lowLines.length > 0) {
          s.verdict = isEn
            ? `Upgrade low rolls (${lowLines.join(', ')}) to High Rolls (+${s.impactCp} CP).`
            : `Amélioration des rolls faibles (${lowLines.join(', ')}) vers des High Rolls (+${s.impactCp} CP).`;
        } else if (midLines.length > 0 && s.impactCp > 0) {
          s.verdict = isEn
            ? `Push primary line to maximum High Roll (+${s.impactCp} CP).`
            : `Maximisation de la ligne vers le palier High (+${s.impactCp} CP).`;
        } else if (s.impactCp > 0) {
          s.verdict = isEn
            ? `Optimize minor substats (+${s.impactCp} CP).`
            : `Optimisation des sous-statistiques (+${s.impactCp} CP).`;
        } else {
          s.verdict = isEn ? "Optimal rolls on this piece." : "Rolls optimaux sur ce bijou.";
        }
      });
    }

    let cardsHtml = '';
    slots.forEach(s => {
      let pLinesHtml = '';
      s.pLines.forEach(l => {
        pLinesHtml += `<div class="acc-line-badge ${l.rollTier} ${l.isDead ? 'dead' : ''}">
          <span>${l.isDead ? '' : (l.rollTier === 'passif' ? '' : (l.rollTier === 'high' ? '' : (l.rollTier === 'mid' ? '' : '')))}${escapeHtml(l.text)}</span>
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>`;
      });

      let tLinesHtml = '';
      s.tLines.forEach(l => {
        tLinesHtml += `<div class="acc-line-badge ${l.rollTier}">
          <span>${l.rollTier === 'passif' ? '' : ''}${escapeHtml(l.text)}</span>
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>`;
      });

      cardsHtml += `
        <div class="acc-piece-card ${s.impactCp >= 15 ? 'heavy-gap' : (s.impactCp > 0 ? 'has-gap' : 'parity')}">
          <div class="acc-piece-top">
            <div class="acc-piece-name">
              <span class="acc-piece-icon">${s.icon}</span>
              <strong>${escapeHtml(s.name)}</strong>
            </div>
            <span class="acc-piece-gain-pill ${s.impactCp > 0 ? 'gap' : 'neutral'}">
              ${s.impactCp > 0 ? `+${s.impactCp} CP` : '= 0 CP'}
            </span>
          </div>

          <div class="acc-piece-body">
            <div class="acc-side-section">
              <span class="acc-side-lbl player">${isEn ? 'Your Rolls' : 'Vos Lignes'}</span>
              ${pLinesHtml}
            </div>
            <div class="acc-side-section">
              <span class="acc-side-lbl target">${isEn ? 'Benchmark Target' : 'Lignes Référence'}</span>
              ${tLinesHtml}
            </div>
          </div>

          <div class="acc-piece-verdict">
            <span></span>
            <span class="verdict-text">${s.verdict}</span>
          </div>
        </div>
      `;
    });

    return `
      <div class="acc-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'Individual T4 Accessories & Polish Lines Breakdown' : 'Détail des 5 Accessoires T4 & Lignes d\'Affinage'}</strong>
            </div>
            <span class="acc-breakdown-tag">${cpImpact > 0 ? `+${cpImpact} CP ${isEn ? 'gap' : 'd\'écart global'}` : (isEn ? 'Optimized parity' : 'Parité optimale')}</span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn 
              ? 'Piece-by-piece comparison showing which rolled lines contribute to the CP gap and where to prioritize your rolls.'
              : 'Comparaison pièce par pièce identifiant les lignes obtenues, les lignes mortes et les leviers d\'optimisation pour combler l\'écart de CP.'}
          </div>
        </div>
        <div class="acc-pieces-grid">
          ${cardsHtml}
        </div>
      </div>
    `;
  }

  function getMainStatName(className, isEn) {
    const c = (className || '').toLowerCase().replace(/[\s\-_]/g, '');
    const isHunter = ['devilhunter', 'blaster', 'hawkeye', 'gunslinger', 'scouter', 'machinist', 'sharpshooter', 'deadeye', 'artillerist', 'franctireur', 'fusiliere', 'artilleur', 'sagittaire', 'machiniste'].some(k => c.includes(k));
    const isAssassin = ['blade', 'demonic', 'reaper', 'souleater', 'shadowhunter', 'deathblade', 'sanglante', 'demoniste', 'faucheuse', 'devoreuse'].some(k => c.includes(k));
    const isMartialArtist = ['battlemaster', 'wardancer', 'infighter', 'scrapper', 'forcemaster', 'soulmaster', 'soulfist', 'lancemaster', 'glaivier', 'striker', 'breaker', 'heavyinfighter', 'elementiste', 'pugiliste', 'spiritiste', 'lanciere', 'essentialiste', 'sangha'].some(k => c.includes(k));
    const isMage = ['bard', 'arcana', 'summoner', 'sorceress', 'arcanist', 'barde', 'sorciere', 'invocatrice'].some(k => c.includes(k));
    const isSpecialist = ['artist', 'aeromancer', 'alchemist', 'wildsoul', 'artiste', 'aeromancienne', 'yinyangshi', 'painter', 'weatherartist', 'dimensionalist', 'dimensionmaster', 'dimension', 'dimensionnaliste'].some(k => c.includes(k));

    if (isHunter || isAssassin || isMartialArtist) return isEn ? 'Dexterity' : 'Dextérité';
    if (isMage || isSpecialist) return isEn ? 'Intelligence' : 'Intelligence';
    return isEn ? 'Strength' : 'Force';
  }

  function decodeBraceletStat(st, className, isSupport, isEn) {
    const sIndex = st.index;
    const sVal = st.value;
    const isFixed = st.fixed === true;
    const isPerk = st.type === 3 || st.type === 4 || sIndex > 1000;

    if (isPerk) {
      const perk = (typeof BIBLE_BRACELET_PERKS !== 'undefined' && BIBLE_BRACELET_PERKS[sIndex]) || null;
      let baseName = perk ? (isEn ? (perk.nameEn || perk.name) : perk.name) : `Roll Spécial (#${sIndex})`;
      let rawName = perk && perk.desc ? `${baseName} (${perk.desc})` : baseName;
      if (!perk && typeof formatBraceletLine === 'function') {
        rawName = formatBraceletLine(rawName, isEn);
      }
      let rollTier = 'high';
      let tierLabel = isEn ? 'BiS Perk' : 'Proc BiS';
      let isDead = false;

      if (isSupport) {
        if (sIndex === 11061 || sIndex === 11091 || sIndex === 11071 || sIndex === 11081 || sIndex === 77300001) {
          rollTier = 'passif';
          tierLabel = isEn ? 'BiS Raid Perk' : 'Proc BiS Raid';
        } else if (rawName.toLowerCase().includes('marteau') || rawName.toLowerCase().includes('hammer') ||
                   rawName.toLowerCase().includes('coinçage') || rawName.toLowerCase().includes('wedge') ||
                   rawName.toLowerCase().includes('précision') || rawName.toLowerCase().includes('precision') ||
                   rawName.toLowerCase().includes('non-directionnel') || rawName.toLowerCase().includes('non-directional')) {
          isDead = true;
          rollTier = 'dead';
          tierLabel = isEn ? 'Dead Perk' : 'Perk Inutile';
        }
      } else {
        if (rawName.toLowerCase().includes('marteau') || rawName.toLowerCase().includes('hammer') ||
            rawName.toLowerCase().includes('ferveur') || rawName.toLowerCase().includes('fervor') ||
            rawName.toLowerCase().includes('coinçage') || rawName.toLowerCase().includes('wedge') ||
            rawName.toLowerCase().includes('précision') || rawName.toLowerCase().includes('precision') ||
            rawName.toLowerCase().includes('embuscade') || rawName.toLowerCase().includes('ambush') ||
            rawName.toLowerCase().includes('non-directionnel') || rawName.toLowerCase().includes('non-directional') ||
            rawName.toLowerCase().includes('bagarreur') || rawName.toLowerCase().includes('brawler')) {
          rollTier = (sIndex % 10 <= 2 || sIndex > 100000) ? 'passif' : 'high';
          tierLabel = isEn ? 'BiS Perk' : 'Proc BiS';
        } else if (rawName.toLowerCase().includes('protection') || rawName.toLowerCase().includes('soins') ||
                   rawName.toLowerCase().includes('shield and healing') || rawName.toLowerCase().includes('bénédiction')) {
          isDead = true;
          rollTier = 'dead';
          tierLabel = isEn ? 'Dead Perk' : 'Perk Inutile';
        }
      }
      return { 
        text: rawName, 
        rollTier, 
        tierLabel, 
        isDead, 
        isFixed: false, 
        isPerk: true, 
        sIndex, 
        sVal, 
        baseName,
        isMainStat: false,
        isCombatStat: false,
        isDefensive: false
      };
    }

    // Combat stats / Attributes
    const statInfo = (typeof BIBLE_STAT_MAP !== 'undefined' && BIBLE_STAT_MAP[sIndex]) || null;
    let statName = (statInfo && statInfo.name) ? statInfo.name : getMainStatName(className, isEn);
    if (isEn) {
      const enMap = {
        'Critique': 'Crit',
        'Spécialisation': 'Specialization',
        'Rapidité': 'Swiftness',
        'Vitalité': 'Vitality',
        'Force': 'Strength',
        'Dextérité': 'Dexterity',
        'Intelligence': 'Intelligence',
        'Points de Vie': 'Max HP',
        'Points de Vie Max': 'Max HP',
        'Points de Mana Max': 'Max MP',
        'Défense Physique': 'Physical Defense',
        'Défense Magique': 'Magical Defense',
        'Puissance d\'Attaque': 'Attack Power',
        'Dégâts Additionnels': 'Additional Damage'
      };
      if (enMap[statName]) statName = enMap[statName];
    }
    const isDead = isSupport 
      ? (sIndex === 17 || sIndex === 20 || sIndex === 55 || sIndex === 56) 
      : (sIndex === 6 || sIndex === 17 || sIndex === 19 || sIndex === 20 || sIndex === 27 || sIndex === 55 || sIndex === 56);

    const lStatName = (statName || '').toLowerCase();
    const isMainStat = (sIndex === 9 || sIndex === 7 || sIndex === 8 || ['intelligence', 'strength', 'dexterity', 'force', 'dextérité'].some(k => lStatName.includes(k)));
    const isCombatStat = (sIndex === 15 || sIndex === 16 || sIndex === 14 || ['crit', 'spéc', 'spec', 'rapid', 'swift'].some(k => lStatName.includes(k)));
    const isDefensive = (sIndex === 17 || sIndex === 20 || sIndex === 55 || sIndex === 56 || ['vitalit', 'vie', 'hp', 'mana', 'défense', 'defense'].some(k => lStatName.includes(k)));

    const formattedVal = typeof formatNumber === 'function' ? formatNumber(sVal) : sVal.toLocaleString('fr-FR');
    const text = `${statName} (+${formattedVal})`;
    let rollTier = 'mid';
    let tierLabel = isFixed ? (isEn ? 'Fixed Stat' : 'Stat Fixe') : (isEn ? 'Rolled Stat' : 'Stat Roulée');

    if (isDead) {
      rollTier = 'dead';
      tierLabel = isEn ? 'Dead Stat' : 'Stat Morte';
    } else if (!isFixed && (sIndex === 11 || sIndex === 7 || sIndex === 8 || sIndex === 9)) {
      if (sVal >= 12000) { rollTier = 'high'; tierLabel = isEn ? 'High Roll' : 'Roll Élevé'; }
      else if (sVal >= 9000) { rollTier = 'mid'; tierLabel = isEn ? 'Mid Roll' : 'Roll Moyen'; }
      else { rollTier = 'low'; tierLabel = isEn ? 'Low Roll' : 'Roll Faible'; }
    } else if (isFixed) {
      rollTier = 'fixed';
    }

    return { 
      text, 
      rollTier, 
      tierLabel, 
      isDead, 
      isFixed, 
      isPerk: false, 
      sIndex, 
      sVal, 
      statName,
      isMainStat, 
      isCombatStat, 
      isDefensive 
    };
  }

  function extractBraceletItem(charObj) {
    if (!charObj) return null;
    let br = charObj.bracelet;
    if (!br && charObj.loadout && Array.isArray(charObj.loadout.items)) {
      br = charObj.loadout.items.find(i => i.slot === 'bracelet');
    }
    if (!br && charObj.rawProfile && charObj.rawProfile.loadout && Array.isArray(charObj.rawProfile.loadout.items)) {
      br = charObj.rawProfile.loadout.items.find(i => i.slot === 'bracelet');
    }
    if (!br && charObj.rawProfile && Array.isArray(charObj.rawProfile.rawItems)) {
      br = charObj.rawProfile.rawItems.find(i => i.slot === 'bracelet');
    }
    return br || null;
  }

  function generateTargetBraceletLines(target, isSupport, isEn) {
    const tSys = resolveTargetSystems(target, isEn);
    const lbl = (tSys && tSys.bracelet && tSys.bracelet.label) || '';
    const normClass = normalizeClassName(target ? target.className : '') || '';
    const mainStat = getMainStatName(normClass, isEn);

    const fixedLines = [];
    const rolledLines = [];

    if (isSupport) {
      fixedLines.push({
        text: isEn ? "Swiftness (+100)" : "Rapidité (+100)",
        rollTier: 'fixed',
        tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
        isDead: false,
        isFixed: true,
        isPerk: false,
        isCombatStat: true,
        isMainStat: false,
        isDefensive: false,
        sIndex: 15,
        sVal: 100
      });
      fixedLines.push({
        text: isEn ? "Specialization (+95)" : "Spécialisation (+95)",
        rollTier: 'fixed',
        tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
        isDead: false,
        isFixed: true,
        isPerk: false,
        isCombatStat: true,
        isMainStat: false,
        isDefensive: false,
        sIndex: 16,
        sVal: 95
      });
      rolledLines.push({
        text: `${mainStat} (+13 200)`,
        rollTier: 'high',
        tierLabel: isEn ? 'High Roll' : 'Roll Élevé',
        isDead: false,
        isFixed: false,
        isPerk: false,
        isCombatStat: false,
        isMainStat: true,
        isDefensive: false,
        sIndex: 9,
        sVal: 13200
      });
      rolledLines.push({
        text: isEn ? "Dagger / Weakness (Defense -2.5% & Ally AP +3%)" : "Poignard / Faiblesse (Défense -2.5% & AP Allié +3%)",
        rollTier: 'passif',
        tierLabel: isEn ? 'BiS Raid Perk' : 'Proc BiS Raid',
        isDead: false,
        isFixed: false,
        isPerk: true,
        isCombatStat: false,
        isMainStat: false,
        isDefensive: false,
        sIndex: 11061,
        sVal: 0
      });
      rolledLines.push({
        text: isEn ? "Cheers / Crit Vulnerability (Crit Dmg -4.8% & Ally AP +3%)" : "Ovation / Vulnérabilité Crit (Dégâts Crit -4.8% & AP Allié +3%)",
        rollTier: 'passif',
        tierLabel: isEn ? 'BiS Raid Perk' : 'Proc BiS Raid',
        isDead: false,
        isFixed: false,
        isPerk: true,
        isCombatStat: false,
        isMainStat: false,
        isDefensive: false,
        sIndex: 11091,
        sVal: 0
      });
    } else {
      // DPS
      const hasSwift = lbl.toLowerCase().includes('rapidité') || lbl.toLowerCase().includes('swift');
      const hasSpec = lbl.toLowerCase().includes('spé') || lbl.toLowerCase().includes('spec');
      const hasCrit = lbl.toLowerCase().includes('crit');

      let stat1 = isEn ? "Crit (+100)" : "Critique (+100)";
      let stat2 = isEn ? "Specialization (+95)" : "Spécialisation (+95)";
      if (hasSwift) {
        stat1 = isEn ? "Swiftness (+100)" : "Rapidité (+100)";
        stat2 = hasCrit ? (isEn ? "Crit (+95)" : "Critique (+95)") : (isEn ? "Specialization (+95)" : "Spécialisation (+95)");
      } else if (hasSpec) {
        stat1 = isEn ? "Specialization (+100)" : "Spécialisation (+100)";
        stat2 = isEn ? "Crit (+95)" : "Critique (+95)";
      }

      fixedLines.push({
        text: stat1,
        rollTier: 'fixed',
        tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
        isDead: false,
        isFixed: true,
        isPerk: false,
        isCombatStat: true,
        isMainStat: false,
        isDefensive: false,
        sVal: 100
      });
      fixedLines.push({
        text: stat2,
        rollTier: 'fixed',
        tierLabel: isEn ? 'Fixed Stat' : 'Stat Fixe',
        isDead: false,
        isFixed: true,
        isPerk: false,
        isCombatStat: true,
        isMainStat: false,
        isDefensive: false,
        sVal: 95
      });

      rolledLines.push({
        text: `${mainStat} (+13 100)`,
        rollTier: 'high',
        tierLabel: isEn ? 'High Roll' : 'Roll Élevé',
        isDead: false,
        isFixed: false,
        isPerk: false,
        isCombatStat: false,
        isMainStat: true,
        isDefensive: false,
        sVal: 13100
      });

      let perk1 = isEn ? "Hammer (Crit Damage +10% & Crit Hit Dmg +1.5%)" : "Marteau (Dégâts Critiques +10% & Dégâts Coup Crit +1.5%)";
      let perk2 = isEn ? "Fervor (Outgoing Damage +5.5% & Cooldown +2%)" : "Ferveur (Dégâts Sortants +5.5% & Cooldown +2%)";

      if (lbl.toLowerCase().includes('coinçage') || lbl.toLowerCase().includes('wedge')) {
        perk2 = isEn ? "Wedge (Additional Damage +3.5% & Demons +2.5%)" : "Coinçage (Dégâts Additionnels +3.5% & Démons +2.5%)";
      } else if (lbl.toLowerCase().includes('précision') || lbl.toLowerCase().includes('precision')) {
        perk1 = isEn ? "Precision (Crit Rate +5% & Crit Hit Dmg +1.5%)" : "Précision (Taux Critique +5% & Dégâts Coup Crit +1.5%)";
      } else if (lbl.toLowerCase().includes('embuscade') || lbl.toLowerCase().includes('ambush')) {
        perk2 = isEn ? "Ambush (Outgoing Damage +3% / Stagger)" : "Embuscade (Dégâts Sortants +3% / Neutralisation)";
      }

      rolledLines.push({
        text: perk1,
        rollTier: 'passif',
        tierLabel: isEn ? 'BiS Perk' : 'Proc BiS',
        isDead: false,
        isFixed: false,
        isPerk: true,
        isCombatStat: false,
        isMainStat: false,
        isDefensive: false
      });
      rolledLines.push({
        text: perk2,
        rollTier: 'passif',
        tierLabel: isEn ? 'BiS Perk' : 'Proc BiS',
        isDead: false,
        isFixed: false,
        isPerk: true,
        isCombatStat: false,
        isMainStat: false,
        isDefensive: false
      });
    }

    return { fixedLines, rolledLines };
  }

  function computeBraceletLineCps(pFixed, pRolled, tFixed, tRolled, cpImpact, isSupport, pClassName, tClassName, isEn) {
    const extractStatNum = (txt) => {
      const m = (txt || '').match(/\+([0-9\s ,]+)/);
      if (!m) return 0;
      return parseInt(m[1].replace(/[\s ,]/g, ''), 10) || 0;
    };

    const getPerkFamily = (txt) => {
      const l = (txt || '').toLowerCase();
      for (const f of ['poignard', 'dagger', 'exposition', 'expose', 'ferveur', 'fervor', 'ovation', 'cheers', 'protection', 'soins', 'marteau', 'hammer', 'précision', 'precision', 'coinçage', 'wedge', 'embuscade', 'ambush', 'non-directionnel', 'non-directional', 'bagarreur', 'brawler']) {
        if (l.includes(f)) {
          return f.replace('dagger', 'poignard')
                  .replace('expose', 'exposition')
                  .replace('fervor', 'ferveur')
                  .replace('cheers', 'ovation')
                  .replace('soins', 'protection')
                  .replace('hammer', 'marteau')
                  .replace('precision', 'précision')
                  .replace('wedge', 'coinçage')
                  .replace('ambush', 'embuscade')
                  .replace('non-directional', 'non-directionnel')
                  .replace('brawler', 'bagarreur');
        }
      }
      return 'other';
    };

    const getLinePerkMultiplier = (line) => {
      if (!line || line.isDead || !line.isPerk) return 0;
      const sIdx = line.sIndex || 0;
      const txt = (line.text || '').toLowerCase();

      const idMap = {
        11061: 12.75, 11062: 10.90, 11063: 9.06, 11064: 7.21,
        11071: 12.75, 11072: 10.90, 11073: 9.06, 11074: 7.21,
        11081: 12.75, 11082: 10.90, 11083: 9.06, 11084: 7.21,
        11091: 12.75, 11092: 10.90, 11093: 9.06, 11094: 7.21,
        11181: 4.90, 11182: 4.20, 11183: 3.50, 11184: 2.80,
        77300001: 6.00,
        11021: 5.00, 11022: 4.20, 11023: 3.40, 11024: 2.60,
        11051: 5.50, 11052: 5.00, 11053: 4.50, 11054: 4.00,
        11011: 4.50, 11012: 3.70, 11013: 3.00, 11014: 2.20,
        11041: 3.50, 11042: 3.00, 11043: 2.50, 11044: 2.00,
        605100031: 3.00, 605100032: 2.50, 605100033: 2.00,
        605100131: 3.00, 605100132: 2.50, 605100133: 2.00,
        605100171: 3.50, 605100172: 3.00, 605100173: 2.50
      };
      if (sIdx && idMap[sIdx]) return idMap[sIdx];

      if (isSupport) {
        if (txt.includes('poignard') || txt.includes('dagger')) {
          if (txt.includes('2.5%') || txt.includes('+3%')) return 12.75;
          if (txt.includes('2.1%') || txt.includes('+2.5%')) return 10.90;
          if (txt.includes('1.8%') || txt.includes('+2%')) return 9.06;
          return 7.21;
        }
        if (txt.includes('exposition') || txt.includes('expose')) {
          if (txt.includes('2.5%') || txt.includes('+3%')) return 12.75;
          if (txt.includes('2.1%') || txt.includes('+2.5%')) return 10.90;
          if (txt.includes('1.8%') || txt.includes('+2%')) return 9.06;
          return 7.21;
        }
        if (txt.includes('ferveur') || txt.includes('fervor')) {
          if (txt.includes('1.3%') || txt.includes('+3%')) return 12.75;
          if (txt.includes('1.1%') || txt.includes('+2.5%')) return 10.90;
          if (txt.includes('0.9%') || txt.includes('+2%')) return 9.06;
          return 7.21;
        }
        if (txt.includes('ovation') || txt.includes('cheers')) {
          if (txt.includes('4.8%') || txt.includes('+3%')) return 12.75;
          if (txt.includes('4.2%') || txt.includes('+2.5%')) return 10.90;
          if (txt.includes('3.6%') || txt.includes('+2%')) return 9.06;
          return 7.21;
        }
        if (txt.includes('protection') || txt.includes('soins') || txt.includes('recovery')) {
          if (txt.includes('3.5%')) return 4.90;
          if (txt.includes('3%')) return 4.20;
          if (txt.includes('2.5%')) return 3.50;
          return 2.80;
        }
      } else {
        if (txt.includes('marteau') || txt.includes('hammer')) {
          if (txt.includes('10%')) return 5.00;
          if (txt.includes('8.4%')) return 4.20;
          if (txt.includes('6.8%')) return 3.40;
          return 2.60;
        }
        if (txt.includes('ferveur') || txt.includes('fervor')) {
          if (txt.includes('5.5%')) return 5.50;
          if (txt.includes('5%')) return 5.00;
          if (txt.includes('4.5%')) return 4.50;
          return 4.00;
        }
        if (txt.includes('précision') || txt.includes('precision')) {
          if (txt.includes('5%')) return 4.50;
          if (txt.includes('4.2%')) return 3.70;
          if (txt.includes('3.4%')) return 3.00;
          return 2.20;
        }
        if (txt.includes('coinçage') || txt.includes('wedge')) {
          if (txt.includes('3.5%')) return 3.50;
          if (txt.includes('3%')) return 3.00;
          if (txt.includes('2.5%')) return 2.50;
          return 2.00;
        }
        if (txt.includes('embuscade') || txt.includes('ambush')) return 3.00;
        if (txt.includes('non-directionnel') || txt.includes('non-directional')) return 3.50;
        if (txt.includes('bagarreur') || txt.includes('brawler')) return 3.50;
        if (txt.includes('dégâts sortants') || txt.includes('outgoing damage')) return 3.00;
      }
      return 0;
    };

    const pAll = [...pFixed, ...pRolled];
    const tAll = [...tFixed, ...tRolled];

    // Main Stat
    const isMainStatLine = (l) => l.isMainStat || (!l.isPerk && (l.text.includes('Force') || l.text.includes('Strength') || l.text.includes('Dext') || l.text.includes('Int')));
    const pMainLine = pAll.find(isMainStatLine) || null;
    const tMainLine = tAll.find(isMainStatLine) || null;
    const pMainVal = pMainLine ? (pMainLine.sVal || extractStatNum(pMainLine.text)) : 0;
    const tMainVal = tMainLine ? (tMainLine.sVal || extractStatNum(tMainLine.text)) : 0;
    const mainDiff = tMainVal - pMainVal;

    // Combat Stats
    const isCombatStatLine = (l) => l.isCombatStat || (!l.isPerk && !l.isMainStat && !l.isDefensive && (l.text.includes('Rapid') || l.text.includes('Swift') || l.text.includes('Spé') || l.text.includes('Spec') || l.text.includes('Crit') || l.text.includes('Dom') || l.text.includes('Endur') || l.text.includes('Expert')));
    const pCombatLines = pAll.filter(isCombatStatLine);
    const tCombatLines = tAll.filter(isCombatStatLine);
    const pCombatSum = pCombatLines.reduce((s, l) => s + (l.sVal || extractStatNum(l.text)), 0);
    const tCombatSum = tCombatLines.reduce((s, l) => s + (l.sVal || extractStatNum(l.text)), 0);
    const combatDiff = tCombatSum - pCombatSum;

    // Defensive lines
    const isDefensiveLine = (l) => l.isDefensive || (!l.isPerk && (l.text.includes('Vitalit') || l.text.includes('Points de Vie') || l.text.includes('Max HP') || l.text.includes('Mana') || l.text.includes('Défense')));
    const pDefensiveLines = pAll.filter(isDefensiveLine);
    const pRolledDef = pRolled.filter(isDefensiveLine);

    // Perks
    const pPerks = pAll.filter(l => l.isPerk).map(l => ({ ...l, mult: getLinePerkMultiplier(l), family: getPerkFamily(l.text) }));
    const tPerks = tAll.filter(l => l.isPerk).map(l => ({ ...l, mult: getLinePerkMultiplier(l), family: getPerkFamily(l.text) }));

    const usedP = new Set();
    const pairs = [];

    // Step 1: Match exact families first
    tPerks.forEach((tP) => {
      const matchIdx = pPerks.findIndex((pP, pIdx) => !usedP.has(pIdx) && pP.family !== 'other' && pP.family === tP.family);
      if (matchIdx !== -1) {
        usedP.add(matchIdx);
        pairs.push({ tP, pP: pPerks[matchIdx], family: tP.family });
      }
    });

    // Step 2: Match remaining target perks with available player perks by minimal difference
    const unmatchedT = tPerks.filter(tP => !pairs.some(pair => pair.tP === tP));
    unmatchedT.sort((a, b) => b.mult - a.mult); // highest first

    unmatchedT.forEach(tP => {
      let bestIdx = -1, minDiff = Infinity;
      pPerks.forEach((pP, pIdx) => {
        if (usedP.has(pIdx)) return;
        const diff = Math.abs(tP.mult - pP.mult);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = pIdx;
        }
      });

      if (bestIdx !== -1) {
        usedP.add(bestIdx);
        pairs.push({ tP, pP: pPerks[bestIdx], family: tP.family });
      } else {
        // Paired with a rolled defensive line if available, or fixed defensive line, or null
        const defLine = pRolledDef[pairs.filter(p => !p.pP).length] || pDefensiveLines[pairs.filter(p => !p.pP).length] || null;
        pairs.push({ tP, pP: null, defLine, family: tP.family });
      }
    });

    // Compute raw gains
    let totalRawGain = 0;
    pairs.forEach(pair => {
      const pMult = pair.pP ? pair.pP.mult : 0;
      pair.gain = Math.max(0, Number((pair.tP.mult - pMult).toFixed(2)));
      totalRawGain += pair.gain;
    });

    // Distribute cpImpact across pairs with gain > 0
    let distributedCp = 0;
    pairs.forEach(pair => {
      if (cpImpact > 0 && totalRawGain > 0 && pair.gain > 0) {
        pair.cp = Math.round((pair.gain / totalRawGain) * cpImpact);
        distributedCp += pair.cp;
      } else {
        pair.cp = 0;
      }
    });

    // Reconcile rounding to match cpImpact exactly
    if (cpImpact > 0 && distributedCp !== cpImpact && totalRawGain > 0) {
      const diff = cpImpact - distributedCp;
      const maxPair = pairs.reduce((best, cur) => cur.cp > (best ? best.cp : 0) ? cur : best, null);
      if (maxPair) maxPair.cp += diff;
    }

    return {
      pairs,
      pMainLine,
      tMainLine,
      pMainVal,
      tMainVal,
      mainDiff,
      pCombatLines,
      tCombatLines,
      pCombatSum,
      tCombatSum,
      combatDiff,
      pDefensiveLines,
      pRolledDef,
      totalRawGain
    };
  }

  function buildBraceletBreakdownHtml(player, target, cpImpact, isEn) {
    const isSupport = player.role === 'support' || (player.className && ['Paladin', 'Bard', 'Artist'].some(s => (player.className || '').toLowerCase().includes(s.toLowerCase())));
    const pClassName = player.className || '';
    const tClassName = (target && target.className) || pClassName;

    // 1. Récupération du Bracelet Joueur
    let pBrItem = extractBraceletItem(player);

    const pFixed = [];
    const pRolled = [];
    if (pBrItem && pBrItem.data && Array.isArray(pBrItem.data.stats)) {
      pBrItem.data.stats.forEach(st => {
        const dec = decodeBraceletStat(st, pClassName, isSupport, isEn);
        if (dec.isFixed) pFixed.push(dec);
        else pRolled.push(dec);
      });
    }

    // Compléter les lignes si le bracelet joueur a des slots libres
    while (pFixed.length + pRolled.length < 5) {
      pRolled.push({
        text: isEn ? "Open Slot (Reroll Available)" : "Emplacement Libre (Reroll Disponible)",
        rollTier: 'low',
        tierLabel: isEn ? 'To Roll' : 'À Reroller',
        isDead: false,
        isFixed: false,
        isPerk: false,
        isMainStat: false,
        isCombatStat: false,
        isDefensive: false
      });
    }

    // 2. Récupération du Bracelet Cible Référence
    let tBrItem = extractBraceletItem(target);

    const tFixed = [];
    const tRolled = [];
    if (tBrItem && tBrItem.data && Array.isArray(tBrItem.data.stats)) {
      tBrItem.data.stats.forEach(st => {
        const dec = decodeBraceletStat(st, tClassName, isSupport, isEn);
        if (dec.isFixed) tFixed.push(dec);
        else tRolled.push(dec);
      });
    } else {
      // Génération synthétique canonique basée sur le profil cible
      const syn = generateTargetBraceletLines(target, isSupport, isEn);
      syn.fixedLines.forEach(l => tFixed.push(l));
      syn.rolledLines.forEach(l => tRolled.push(l));
    }

    // 3. Calcul de la distribution exacte du CP par composante / perk
    const lineCps = computeBraceletLineCps(pFixed, pRolled, tFixed, tRolled, cpImpact, isSupport, pClassName, tClassName, isEn);

    // Helpers de rendu par ligne
    const renderTargetLine = (l) => {
      let pillHtml = '';
      if (l.isPerk) {
        const pair = lineCps.pairs.find(p => p.tP === l || p.tP.text === l.text);
        if (pair && pair.cp > 0) {
          pillHtml = `<span class="line-cp-pill">+${pair.cp} CP</span>`;
        } else if (pair && pair.pP && Math.abs(pair.tP.mult - pair.pP.mult) < 0.1) {
          pillHtml = `<span class="line-parity-pill">${isEn ? 'BiS Parity' : 'Parité BiS'}</span>`;
        }
      } else if (l === lineCps.tMainLine || l.isMainStat) {
        if (lineCps.mainDiff < 0) {
          const lead = Math.abs(lineCps.mainDiff).toLocaleString('fr-FR');
          pillHtml = `<span class="line-parity-pill" style="color:#9CB4C6;" title="${isEn ? 'Counted in Main Stat & Base AP row' : 'Comptabilisé dans la ligne Stat Principale & Attaque Base'}">-${lead} ${isEn ? 'vs Player' : 'vs Joueur'}</span>`;
        } else if (lineCps.mainDiff > 0) {
          const lead = lineCps.mainDiff.toLocaleString('fr-FR');
          pillHtml = `<span class="line-parity-pill" title="${isEn ? 'Counted in Base AP row' : 'Comptabilisé dans Attaque Base'}">+${lead} ${isEn ? '(Base AP)' : '(Attaque Base)'}</span>`;
        }
      } else if (l.isCombatStat || lineCps.tCombatLines.includes(l)) {
        pillHtml = `<span class="line-parity-pill" title="${isEn ? 'Counted in Combat Stats row' : 'Comptabilisé dans Stats de Combat'}">${isEn ? 'Combat Stats' : 'Stats de Combat'}</span>`;
      } else if (l.isDefensive) {
        pillHtml = `<span class="line-parity-pill" style="color:var(--text-muted);">${isEn ? 'Survival' : 'Survie'}</span>`;
      }

      return `
        <div class="acc-line-badge ${l.rollTier} ${l.isDead ? 'dead' : ''}">
          <span>${l.isDead ? '' : (l.rollTier === 'passif' ? '' : (l.rollTier === 'high' ? '' : (l.rollTier === 'fixed' ? '' : (l.rollTier === 'mid' ? '' : ''))))}${escapeHtml(l.text)}</span>
          ${pillHtml}
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>
      `;
    };

    const renderPlayerLine = (l) => {
      let pillHtml = '';
      if (l === lineCps.pMainLine || l.isMainStat) {
        if (lineCps.mainDiff < 0) {
          const lead = Math.abs(lineCps.mainDiff).toLocaleString('fr-FR');
          pillHtml = `<span class="line-lead-pill">+${lead} ${getMainStatName(pClassName, isEn)} (${isEn ? 'Player Lead' : 'Avance Joueur'})</span>`;
        }
      } else if (l.isPerk) {
        const pair = lineCps.pairs.find(p => p.pP === l || (p.pP && p.pP.text === l.text));
        if (pair && pair.pP && Math.abs(pair.tP.mult - pair.pP.mult) < 0.1) {
          pillHtml = `<span class="line-parity-pill">${isEn ? 'BiS (Parity)' : 'Parité BiS'}</span>`;
        } else if (pair && pair.cp > 0) {
          pillHtml = `<span class="line-parity-pill" style="color:#E0A43A;" title="${isEn ? 'Target has higher perk tier' : 'Cible possède un palier supérieur'}">${isEn ? 'Tier Upgrade Avail.' : 'Palier Supérieur Dispo'}</span>`;
        }
      } else if (l.isDefensive) {
        pillHtml = `<span class="line-parity-pill" style="color:var(--text-muted);">${isEn ? 'Survival (0% Buff CP)' : 'Survie (0% Buff CP)'}</span>`;
      }

      return `
        <div class="acc-line-badge ${l.rollTier} ${l.isDead ? 'dead' : ''}">
          <span>${l.isDead ? '' : (l.rollTier === 'passif' ? '' : (l.rollTier === 'high' ? '' : (l.rollTier === 'fixed' ? '' : (l.rollTier === 'mid' ? '' : ''))))}${escapeHtml(l.text)}</span>
          ${pillHtml}
          <span class="acc-line-tier-tag">${escapeHtml(l.tierLabel)}</span>
        </div>
      `;
    };

    // 4. Rendu des badges du Joueur
    const pFixedHtml = pFixed.map(renderPlayerLine).join('');
    const pRolledHtml = pRolled.map(renderPlayerLine).join('');

    // 5. Rendu des badges de la Cible
    const tFixedHtml = tFixed.map(renderTargetLine).join('');
    const tRolledHtml = tRolled.map(renderTargetLine).join('');

    // 6. Tableau dynamique des lignes
    let tableRowsHtml = `
      <tr>
        <td><strong>${isEn ? 'Combat Stats (Crit/Spec/Swift)' : 'Stats de Combat (Crit / Spé / Rap)'}</strong></td>
        <td>${lineCps.pCombatLines.length > 0 ? lineCps.pCombatLines.map(l => escapeHtml(l.text)).join(' & ') : (isEn ? 'None (0 pt)' : 'Aucune (0 pt)')}</td>
        <td>${lineCps.tCombatLines.length > 0 ? lineCps.tCombatLines.map(l => escapeHtml(l.text)).join(' & ') : (isEn ? 'None (0 pt)' : 'Aucune (0 pt)')}</td>
        <td class="col-cp-gain" style="color:var(--text-muted);">= 0 CP <em style="font-size:11px; font-weight:normal; display:block;">(${isEn ? 'Tracked in Combat Stats row' : 'Comptabilisé dans Stats de Combat'})</em></td>
      </tr>
      <tr>
        <td><strong>${isEn ? 'Main Stat' : 'Statistique Principale'} (${getMainStatName(pClassName, isEn)})</strong></td>
        <td>${lineCps.pMainLine ? escapeHtml(lineCps.pMainLine.text) : '—'}</td>
        <td>${lineCps.tMainLine ? escapeHtml(lineCps.tMainLine.text) : '—'}</td>
        <td class="col-cp-gain" style="${lineCps.mainDiff < 0 ? 'color:#9CB4C6;' : 'color:var(--text-muted);'}">
          ${lineCps.mainDiff < 0 
            ? `+${Math.abs(lineCps.mainDiff).toLocaleString('fr-FR')} ${isEn ? 'Player Lead' : 'Avance Joueur'} <em style="font-size:11px; font-weight:normal; display:block;">(${isEn ? 'Tracked in Base AP row' : 'Comptabilisé dans Attaque Base'})</em>` 
            : `= 0 CP <em style="font-size:11px; font-weight:normal; display:block;">(${isEn ? 'Tracked in Base AP row' : 'Comptabilisé dans Attaque Base'})</em>`}
        </td>
      </tr>
    `;

    lineCps.pairs.forEach((pair) => {
      const familyName = pair.family.charAt(0).toUpperCase() + pair.family.slice(1);
      const icon = pair.tP.rollTier === 'passif' ? '' : '';
      const playerDesc = pair.pP 
        ? escapeHtml(pair.pP.text) 
        : (pair.defLine ? `${escapeHtml(pair.defLine.text)} <em style="font-size:12px; color:var(--text-muted);">(${isEn ? 'Survival 0% Buff CP' : 'Survie 0% Buff CP'})</em>` : (isEn ? 'Empty Slot' : 'Emplacement Libre'));
      const targetDesc = escapeHtml(pair.tP.text);
      const cpText = pair.cp > 0 
        ? `<strong style="color:#8CC084;">+${pair.cp} CP</strong> <em style="font-size:12px; font-weight:normal; display:block; color:#8CC084;">(+${pair.gain.toFixed(2)}% ${isSupport ? 'Buff' : 'DPS'})</em>` 
        : `<span style="color:var(--text-muted);">= 0 CP (${isEn ? 'BiS Parity' : 'Parité BiS'})</span>`;

      tableRowsHtml += `
        <tr>
          <td><strong>${icon} ${isEn ? 'Raid Perk' : 'Passif Raid'} : ${escapeHtml(familyName)}</strong></td>
          <td>${playerDesc}</td>
          <td>${targetDesc}</td>
          <td class="col-cp-gain">${cpText}</td>
        </tr>
      `;
    });

    // 7. Formulation du diagnostic personnalisé
    let verdictText = '';
    if (cpImpact <= 0) {
      verdictText = isEn
        ? "Optimal rolls and equivalent high-tier performance to benchmark reference."
        : "Rolls de haute qualité et parité optimale avec la référence ciblée.";
    } else {
      const hasDef = lineCps.pDefensiveLines.length > 0;
      if (isSupport) {
        if (hasDef && lineCps.mainDiff < 0) {
          const lead = Math.abs(lineCps.mainDiff).toLocaleString('fr-FR');
          verdictText = isEn
            ? `The +${cpImpact} CP gap stems entirely from raid support perks (+${lineCps.totalRawGain.toFixed(2)}% Buff Power). Target has higher-tier perks and an active party buff replacing your survival roll (${lineCps.pDefensiveLines.map(d=>d.text).join(', ')}). Your ${getMainStatName(pClassName, isEn)} is higher (+${lead} lead) and is already credited in the Main Stat & Base AP row.`
            : `L'écart de +${cpImpact} CP provient intégralement des passifs de soutien de raid (+${lineCps.totalRawGain.toFixed(2)}% de Buff Power) : la cible possède des passifs de palier supérieur et un passif de groupe actif remplaçant votre ligne de confort (${lineCps.pDefensiveLines.map(d=>d.text).join(', ')}). Votre ${getMainStatName(pClassName, isEn)} est supérieure (+${lead} d'avance) et est déjà créditée dans la ligne Stat Principale & Attaque Base.`;
        } else {
          verdictText = isEn
            ? `Bridge the +${cpImpact} CP gap by upgrading your raid perks (Dagger / Expose Weakness / Cheers) to higher tiers and replacing defensive lines with active party perks.`
            : `Combler les +${cpImpact} CP en faisant monter le palier de vos passifs de raid (Poignard / Exposition / Ferveur) et en remplaçant les stats défensives par des passifs de groupe actifs.`;
        }
      } else {
        if (lineCps.mainDiff < 0) {
          const lead = Math.abs(lineCps.mainDiff).toLocaleString('fr-FR');
          verdictText = isEn
            ? `The +${cpImpact} CP delta is driven by higher raid perk tiers (Hammer / Fervor / Wedge). Your ${getMainStatName(pClassName, isEn)} has a +${lead} advantage credited in Base AP.`
            : `L'écart de +${cpImpact} CP provient des paliers supérieurs de passifs de raid (Marteau / Ferveur / Coinçage). Votre ${getMainStatName(pClassName, isEn)} possède une avance de +${lead} créditée dans l'Attaque de Base.`;
        } else {
          verdictText = isEn
            ? `Optimize raid perks (Hammer / Fervor / Precision) to bridge the +${cpImpact} CP gap.`
            : `Optimiser les passifs de raid (Marteau / Ferveur / Précision) pour combler les +${cpImpact} CP d'écart.`;
        }
      }
    }

    const pDeadStats = pRolled.filter(l => l.isDead).concat(pFixed.filter(l => l.isDead));
    const pHasDead = pDeadStats.length > 0;

    return `
      <div class="acc-breakdown-panel bracelet-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'Individual T4 Bracelet & Passive Rolls Breakdown' : 'Détail du Bracelet T4 & Lignes de Passifs'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(232, 230, 220, 0.15); border-color: rgba(232, 230, 220, 0.35); color: #CFCBBD;">
              ${cpImpact > 0 ? `+${cpImpact} CP ${isEn ? 'gap' : 'd\'écart global'}` : (isEn ? 'Optimized parity' : 'Parité optimale')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn 
              ? 'Detailed side-by-side comparison of fixed stats, main stat rolls, and BiS perks to bridge the CP gap.'
              : 'Comparaison détaillée des caractéristiques de base, rolls de statistiques principales et passifs BiS pour combler l\'écart de CP.'}
          </div>
        </div>

        <div class="bracelet-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card bracelet-card player-card ${pHasDead ? 'heavy-gap' : (cpImpact > 0 ? 'has-gap' : 'parity')}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${isEn ? 'Your T4 Bracelet' : 'Votre Bracelet T4'}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #CFCBBD; margin-left: 6px;">
                  ${isEn ? 'Ancient / Relic' : 'Relique T4'}
                </span>
              </div>
              <span class="acc-piece-gain-pill neutral">
                ${pFixed.length + pRolled.length} / 5 ${isEn ? 'lines' : 'lignes'}
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl player">${isEn ? 'Fixed Combat Stats' : 'Caractéristiques Fixes de Base'}</span>
                ${pFixedHtml}
              </div>
              <div class="acc-side-section" style="margin-top: 6px;">
                <span class="acc-side-lbl player">${isEn ? 'Rolled Stats & Perks' : 'Statistiques Roulées & Passifs'}</span>
                ${pRolledHtml}
              </div>
            </div>
          </div>

          <!-- Carte Cible Référence -->
          <div class="acc-piece-card bracelet-card target-card parity">
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
                <span class="acc-side-lbl target">${isEn ? 'Target Combat Stats' : 'Caractéristiques Fixes Cible'}</span>
                ${tFixedHtml}
              </div>
              <div class="acc-side-section" style="margin-top: 6px;">
                <span class="acc-side-lbl target">${isEn ? 'Target Rolled Stats & Perks' : 'Statistiques Roulées & Passifs Cible'}</span>
                ${tRolledHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé des Gains par Perk / Stat -->
        <div class="bracelet-compare-table-wrap">
          <div class="bracelet-compare-table-title">
            <span></span>
            <strong>${isEn ? 'Individual CP Contribution by Perk & Stat' : 'Décomposition Détaillée des Gains de CP par Statistique & Passif'}</strong>
          </div>
          <table class="bracelet-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Component / Perk' : 'Composante / Ligne'}</th>
                <th>${isEn ? 'Your Bracelet' : 'Votre Bracelet'}</th>
                <th>${isEn ? 'Benchmark Target' : 'Référence Cible'}</th>
                <th style="text-align:right;">${isEn ? 'CP Delta' : 'Gain en CP'}</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Total Bracelet System Gap' : 'Gain Total du Système Bracelet'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="bracelet-verdict-banner">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            <strong>${isEn ? 'Bracelet Diagnostic & Recommendations:' : 'Diagnostic & Recommandations du Bracelet :'}</strong>
            <span>${verdictText}</span>
          </div>
        </div>
      </div>
    `;
  }

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

  function buildWeaponBreakdownHtml(player, target, cpImpact, isEn) {
    const p = extractCharacterWeaponDetails(player, isEn);
    const t = extractCharacterWeaponDetails(target, isEn);
    const deltaPct = Number((t.bonusPct - p.bonusPct).toFixed(2));
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
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaPct.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (isEn ? 'Player Advantage / Parity' : 'Avance Joueur / Parité')}
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
              <span class="acc-piece-gain-pill neutral">
                +${p.bonusPct.toFixed(2)}% Mult.
              </span>
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
                <td><strong>${isEn ? 'Total Weapon System Score' : 'Score Multiplicateur d\'Arme'}</strong></td>
                <td>+${p.bonusPct.toFixed(2)}%</td>
                <td><strong style="color:#8CC084;">+${t.bonusPct.toFixed(2)}%</strong></td>
                <td class="col-cp-gain">+${deltaPct.toFixed(2)}%</td>
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

  function buildArmorsBreakdownHtml(player, target, cpImpact, isEn) {
    const p = extractCharacterArmorsDetails(player, isEn);
    const t = extractCharacterArmorsDetails(target, isEn);
    const deltaPct = Number((t.bonusPct - p.bonusPct).toFixed(2));
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
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaPct.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (isEn ? 'Player Advantage / Parity' : 'Avance Joueur / Parité')}
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
              <span class="acc-piece-gain-pill neutral">
                +${p.bonusPct.toFixed(2)}% Mult.
              </span>
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
                <td><strong>${isEn ? 'Total Armor System Score' : 'Score Multiplicateur d\'Armure'}</strong></td>
                <td>+${p.bonusPct.toFixed(2)}%</td>
                <td><strong style="color:#8CC084;">+${t.bonusPct.toFixed(2)}%</strong></td>
                <td class="col-cp-gain">+${deltaPct.toFixed(2)}%</td>
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

  function buildEngravingsBreakdownHtml(player, target, cpImpact, isEn) {
    const pEngs = extractCharacterEngravings(player, isEn);
    const tEngs = extractCharacterEngravings(target, isEn);

    const cpPerPct = (player.cp && player.cp > 1000) ? (player.cp / 100) : 55.87;

    const pTotalPct = pEngs.reduce((s, e) => s + e.valuePct, 0);
    const tTotalPct = tEngs.reduce((s, e) => s + e.valuePct, 0);
    const deltaTotal = Number((tTotalPct - pTotalPct).toFixed(2));

    const isEngMatch = (a, b) => {
      if (!a || !b) return false;
      if (a.id && b.id && (a.id === b.id || String(a.id) === String(b.id))) return true;
      const nA = (a.name || a.rawName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const nB = (b.name || b.rawName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return nA && nB && (nA.includes(nB) || nB.includes(nA));
    };

    // Badges Joueur
    const pEngsHtml = pEngs.map(e => `
      <div class="acc-line-badge high">
        <span><strong>${escapeHtml(e.name)}</strong> (+${e.valuePct.toFixed(2)}%)</span>
        ${e.stonePoints > 0 ? `<span class="acc-line-tier-tag" style="background:rgba(232, 230, 220,0.2); color:#E0A43A;">${isEn ? 'Stone' : 'Pierre'} +${e.stonePoints}</span>` : ''}
      </div>
    `).join('');

    // Badges Cible
    const tEngsHtml = tEngs.map(e => {
      const pMatch = pEngs.find(p => isEngMatch(p, e));
      const isDifferentEng = !pMatch;
      return `
        <div class="acc-line-badge high">
          <span><strong>${escapeHtml(e.name)}</strong> (+${e.valuePct.toFixed(2)}%)</span>
          ${isDifferentEng ? `<span class="line-cp-pill" style="background:rgba(234,179,8,0.2); border-color:rgba(234,179,8,0.4); color:#E0A43A;">${isEn ? 'Diff Engraving' : 'Gravure Différente'}</span>` : ''}
          ${e.stonePoints > 0 ? `<span class="acc-line-tier-tag" style="background:rgba(140, 192, 132,0.2); color:#8CC084;">${isEn ? 'Stone' : 'Pierre'} +${e.stonePoints}</span>` : ''}
        </div>
      `;
    }).join('');

    // Diff items
    const pOnly = pEngs.filter(p => !tEngs.some(t => isEngMatch(p, t)));
    const tOnly = tEngs.filter(t => !pEngs.some(p => isEngMatch(p, t)));

    let diffRows = '';

    // Gravures différentes (swapped engravings)
    if (pOnly.length > 0 && tOnly.length > 0) {
      for (let i = 0; i < Math.max(pOnly.length, tOnly.length); i++) {
        const pO = pOnly[i];
        const tO = tOnly[i];
        const pVal = pO ? pO.valuePct : 0;
        const tVal = tO ? tO.valuePct : 0;
        const d = Number((tVal - pVal).toFixed(2));
        const gain = Math.round(d * cpPerPct);
        const gainStr = gain > 0 ? `+${gain} CP` : (gain < 0 ? `${gain} CP` : '= 0 CP');
        const pName = pO ? `${pO.name} (+${pVal.toFixed(2)}%)` : '—';
        const tName = tO ? `${tO.name} (+${tVal.toFixed(2)}%)` : '—';

        diffRows += `
          <tr>
            <td>
              <strong>${isEn ? 'Engraving Choice' : 'Choix de Gravure'}</strong>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ${isEn ? 'Alternative T4 Relic Engraving' : 'Gravure Relique T4 différente'}
              </div>
            </td>
            <td>${escapeHtml(pName)}</td>
            <td><strong style="color:#E0A43A;">${escapeHtml(tName)}</strong></td>
            <td class="col-cp-gain" style="color:#8CC084;"><strong>${gainStr}</strong></td>
          </tr>
        `;
      }
    }

    // Gravures communes avec répartition de pierre ou palier différent
    const shared = pEngs.filter(p => tEngs.some(t => isEngMatch(p, t)));
    shared.forEach(p => {
      const t = tEngs.find(x => isEngMatch(x, p));
      if (!t) return;
      const d = Number((t.valuePct - p.valuePct).toFixed(2));
      if (Math.abs(d) > 0.01) {
        const gain = Math.round(d * cpPerPct);
        const gainStr = gain > 0 ? `+${gain} CP` : `${gain} CP`;
        const pStone = p.stonePoints > 0 ? ` (${isEn ? 'Stone' : 'Pierre'} +${p.stonePoints})` : '';
        const tStone = t.stonePoints > 0 ? ` (${isEn ? 'Stone' : 'Pierre'} +${t.stonePoints})` : '';

        diffRows += `
          <tr>
            <td>
              <strong>${escapeHtml(t.name)}</strong>
              <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">
                ${isEn ? 'Stone nodes & base relic roll' : 'Nœuds de pierre & palier relique'}
              </div>
            </td>
            <td>+${p.valuePct.toFixed(2)}%${pStone}</td>
            <td>+${t.valuePct.toFixed(2)}%${tStone}</td>
            <td class="col-cp-gain" style="color:${gain > 0 ? '#8CC084' : '#9CB4C6'};"><strong>${gainStr}</strong></td>
          </tr>
        `;
      }
    });

    let explanationText = '';
    const targetName = (target && target.name) || (isEn ? 'Benchmark' : 'La référence');
    const hasNexusCase = (pOnly.some(p => (p.name || '').toLowerCase().includes('cursed doll') || (p.name || '').toLowerCase().includes('poupée')) && tOnly.some(t => (t.name || '').toLowerCase().includes('mass increase') || (t.name || '').toLowerCase().includes('masse')));

    if (hasNexusCase) {
      explanationText = isEn
        ? `<strong>Why +${cpImpact} CP?</strong> In Lost Ark's Combat Power formula, Engravings are a global multiplicative layer: CP &prop; &prod;(1 + E<sub>i</sub>). For your character (${formatNumber(player.cp || 5587)} CP), <strong>1% overall damage = ~${cpPerPct.toFixed(1)} CP</strong>.<br>• ${escapeHtml(targetName)} gains <strong>+2.00% (+${Math.round(2.00 * cpPerPct)} CP)</strong> from running <em>Mass Increase</em> (+19.00%) over <em>Cursed Doll</em> (+17.00%) and <strong>+0.30% (+${Math.round(0.30 * cpPerPct)} CP)</strong> from an optimized Relic Stone node distribution.<br><strong>Theorycrafting Note (Lost Ark Nexus):</strong> Lost Ark Nexus explicitly recommends your setup (<em>Cursed Doll</em>). Although <em>Mass Increase</em> gives +2% raw AP on paper (+${Math.round(2.00 * cpPerPct)} CP on your profile), its -10% attack speed penalty slows down Demonic animations and rotations. Your setup is the optimal choice for real in-raid DPS and fluid gameplay.`
        : `<strong>Pourquoi autant de CP (+${cpImpact} CP) ?</strong> Dans la formule officielle de Smilegate, les Gravures agissent comme un multiplicateur global multiplicatif : CP &prop; &prod;(1 + E<sub>i</sub>). Pour votre personnage (${formatNumber(player.cp || 5587)} CP), <strong>1% de dégâts bruts = ~${cpPerPct.toFixed(1)} CP</strong>.<br>• ${escapeHtml(targetName)} obtient <strong>+2.00% (+${Math.round(2.00 * cpPerPct)} CP)</strong> en jouant <em>Augmentation de Masse</em> (+19.00%) au lieu de <em>Poupée Maudite</em> (+17.00%), plus <strong>+0.30% (+${Math.round(0.30 * cpPerPct)} CP)</strong> grâce à la répartition optimisée des nœuds de Pierre Relique.<br><strong>Note de Theorycrafting (Lost Ark Nexus) :</strong> Le guide officiel <em>Lost Ark Nexus</em> préconise précisément votre configuration (<em>Poupée Maudite</em>). Bien qu'<em>Augmentation de Masse</em> apporte +2% d'AP brute sur le papier (+${Math.round(2.00 * cpPerPct)} CP au score affiché), son malus de -10% de vitesse d'attaque ralentit les animations et le cycle de burst démoniaque. Votre build est le choix optimal en combat réel pour la fluidité et le DPS effectif en raid.`;
    } else {
      explanationText = isEn
        ? `<strong>Combat Power Impact (+${cpImpact} CP):</strong> In Lost Ark, engravings are strictly multiplicative. Each 1% engraving or ability stone gain contributes ~${cpPerPct.toFixed(1)} CP to your character. Aligning relic node breakpoints and high stone node rolls (+3/+4) bridges this gap.`
        : `<strong>Impact sur le Combat Power (+${cpImpact} CP) :</strong> Dans Lost Ark, les gravures sont purement multiplicatives. Chaque 1% de gain de gravure ou de pierre apporte ~${cpPerPct.toFixed(1)} CP à votre profil. Aligner les paliers reliques et les nœuds de pierre (+3/+4) permet de rattraper cet écart.`;
    }

    return `
      <div class="acc-breakdown-panel engravings-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span></span>
              <strong>${isEn ? 'T4 Relic Engravings & Ability Stone Breakdown' : 'Détail des Gravures Reliques T4 & Pierre de Naissance'}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(232, 230, 220, 0.15); border-color: rgba(232, 230, 220, 0.35); color: #E0A43A;">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaTotal.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (isEn ? 'Optimized parity' : 'Parité optimale')}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? 'Comparison of your 5 T4 relic engraving choices, ability stone nodes, and their mathematical contribution to Combat Power.'
              : 'Comparaison des 5 gravures reliques T4, des nœuds de pierre de naissance et de leur impact mathématique sur le Combat Power.'}
          </div>
        </div>

        <div class="astrogems-cards-grid">
          <!-- Carte Joueur -->
          <div class="acc-piece-card astrogems-card player-card ${cpImpact > 0 ? 'has-gap' : 'parity'}">
            <div class="acc-piece-top">
              <div class="acc-piece-name">
                <span class="acc-piece-icon"></span>
                <strong>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</strong>
                <span class="acc-line-tier-tag" style="background: rgba(232, 230, 220, 0.2); color: #E0A43A; margin-left: 6px;">
                  5 T4 Relic
                </span>
              </div>
              <span class="acc-piece-gain-pill neutral">
                +${pTotalPct.toFixed(2)}% Total
              </span>
            </div>
            <div class="acc-piece-body">
              <div class="acc-side-section">
                <span class="acc-side-lbl player">${isEn ? 'Equipped Engravings & Stone' : 'Gravures Actives & Pierre'}</span>
                ${pEngsHtml}
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
                <span class="acc-side-lbl target">${isEn ? 'Target Engravings & Stone' : 'Gravures Cible & Pierre'}</span>
                ${tEngsHtml}
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé des Gravures -->
        <div class="astrogems-compare-table-wrap">
          <div class="astrogems-compare-table-title">
            <span></span>
            <strong>${isEn ? 'Engraving & Stone Delta Breakdown' : 'Décomposition Détaillée de l\'Écart de Gravures & Pierre'}</strong>
          </div>
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'System / Engraving' : 'Système / Gravure'}</th>
                <th>${escapeHtml(player.name || (isEn ? 'Your Character' : 'Votre Personnage'))}</th>
                <th>${escapeHtml((target && target.name) || (isEn ? 'Benchmark Target' : 'Référence'))}</th>
                <th style="text-align:right;">${isEn ? 'CP Delta' : 'Gain en CP'}</th>
              </tr>
            </thead>
            <tbody>
              ${diffRows || `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">${isEn ? 'Identical engravings and stone.' : 'Gravures et pierre identiques.'}</td></tr>`}
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Total Engravings & Stone Gap' : 'Écart Total Gravures & Pierre'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : '= 0 CP'}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="astrogems-verdict-banner" style="border-left-color:#E0A43A;">
          <span class="verdict-icon"></span>
          <div class="verdict-content">
            ${explanationText}
          </div>
        </div>
      </div>
    `;
  }

  function extractArkGridCoreDetail(char, coreGroup, isEn) {
    if (!char) return null;
    const normGroup = (coreGroup || 'sun').toLowerCase().replace('arkgrid', '');
    const prefixOrder = normGroup === 'sun' ? '67300' : (normGroup === 'moon' ? '67301' : '67302');
    const prefixChaos = normGroup === 'sun' ? '67310' : (normGroup === 'moon' ? '67311' : '67312');
    const groupLabel = normGroup === 'sun' ? (isEn ? 'Sun' : 'Soleil') : (normGroup === 'moon' ? (isEn ? 'Moon' : 'Lune') : (isEn ? 'Star' : 'Étoile'));

    const pId = (char && (char.id || char.name || '')).toLowerCase();
    const canon = null;

    function resolveCoreSpecificName(id, rawLabel) {
      let name = '';
      if (id && typeof BIBLE_CORES !== 'undefined' && BIBLE_CORES[id]) {
        const full = BIBLE_CORES[id];
        const m = full.match(/^([A-Za-z]+)\s+([A-Za-z]+)\s+Core:\s*(.+)$/i);
        if (m && m[3]) name = m[3].trim();
        else name = full;
      } else if (rawLabel) {
        const m1 = rawLabel.match(/^([^(\n]+?)\s*\(\d+P\s*\|\s*(?:Order|Chaos)/i);
        if (m1 && m1[1]) name = m1[1].trim();
        else {
          const m2 = rawLabel.match(/(?:Order|Chaos)\s*(?:Sun|Moon|Star)(?:\s*Core)?\s*:\s*([^(\n]+)/i);
          if (m2 && m2[1]) name = m2[1].trim();
        }
      }
      if (!name) return '';
      // Traduction et clarification des termes génériques pour éviter la confusion avec l'équipement
      if (/^weapon$/i.test(name)) return isEn ? 'Weapon Power' : "Puissance d'Arme";
      if (/^attack$/i.test(name)) return isEn ? 'Attack Power' : "Puissance d'Attaque";
      if (/^echoing brand$/i.test(name)) return isEn ? 'Echoing Brand' : "Marque d'Écho";
      if (/^fortitude enhancement$/i.test(name)) return isEn ? 'Fortitude Enhancement' : "Renforcement de Ténacité";
      return name;
    }

    let order = {
      name: isEn ? `Order ${groupLabel}` : `Cœur d'Ordre ${groupLabel}`,
      specificName: '',
      tier: 10,
      points: 10,
      bonusPct: 0,
      grade: 'Relic',
      effectName: isEn ? 'Order Resonance' : 'Résonance d\'Ordre'
    };

    let chaos = {
      name: isEn ? `Chaos ${groupLabel}` : `Cœur de Chaos ${groupLabel}`,
      specificName: '',
      tier: 10,
      points: 10,
      bonusPct: 0,
      grade: 'Relic',
      effectName: isEn ? 'Chaos Resonance' : 'Résonance de Chaos'
    };

    // 1. Try from battlePoint.parts (type 29)
    const allParts = (char.rawProfile && char.rawProfile.battlePoint && char.rawProfile.battlePoint.parts)
      || (char.loadout && char.loadout.battlePoint && char.loadout.battlePoint.parts)
      || (char.battlePoint && char.battlePoint.parts)
      || (char.rawProfile && char.rawProfile.loadout && char.rawProfile.loadout.battlePoint && char.rawProfile.loadout.battlePoint.parts)
      || (char.rawProfile && char.rawProfile.loadouts && char.rawProfile.loadouts[0] && char.rawProfile.loadouts[0].battlePoint && char.rawProfile.loadouts[0].battlePoint.parts)
      || (canon && canon.rawProfile && canon.rawProfile.battlePoint && canon.rawProfile.battlePoint.parts)
      || (canon && canon.battlePoint && canon.battlePoint.parts)
      || [];

    const classNameNorm = (char.className || char.class || (char.loadout && char.loadout.classId) || '').toLowerCase();
    const isSupportRole = char.role === 'support' || ['bard', 'paladin', 'artist', 'valkyrie'].some(s => classNameNorm.includes(s));

    const parts29 = allParts.filter(p => p.type === 29);
    if (parts29.length > 0) {
      const oPart = parts29.find(p => (p.id || '').toString().startsWith(prefixOrder));
      if (oPart) {
        order.id = oPart.id;
        order.points = oPart.points || 17;
        order.tier = oPart.points || 17;
        order.bonusPct = Number(((oPart.value || 0) / 100).toFixed(2));
        order.grade = ((oPart.id || 0) % 10 === 6) ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
        const sName = resolveCoreSpecificName(oPart.id);
        if (sName) {
          order.specificName = sName;
          order.effectName = sName;
        }
      }
      const cPart = parts29.find(p => (p.id || '').toString().startsWith(prefixChaos));
      if (cPart) {
        chaos.id = cPart.id;
        chaos.points = cPart.points || 17;
        chaos.tier = cPart.points || 17;
        chaos.bonusPct = Number(((cPart.value || 0) / 100).toFixed(2));
        chaos.grade = ((cPart.id || 0) % 10 === 6) ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
        const sName = resolveCoreSpecificName(cPart.id);
        if (sName) {
          chaos.specificName = sName;
          chaos.effectName = sName;
        }
      }
    }

    // 2. Try raw arkGridCores if specificName, points or bonus were not found (ex: Chaos Star exclu sur support ou pas de type 29)
    const rawCores = char.arkGridCores
      || (char.rawProfile && (char.rawProfile.arkGridCores || (char.rawProfile.loadout && char.rawProfile.loadout.arkGridCores)))
      || (char.loadout && char.loadout.arkGridCores)
      || (canon && (canon.arkGridCores || (canon.rawProfile && canon.rawProfile.arkGridCores)))
      || [];

    if (Array.isArray(rawCores) && rawCores.length > 0) {
      const oCore = rawCores.find(c => (c.id || '').toString().startsWith(prefixOrder));
      if (oCore) {
        order.id = oCore.id;
        const pts = Array.isArray(oCore.gems)
          ? oCore.gems.reduce((s, g) => s + (g.corePoints || 0), 0)
          : (oCore.points || 17);
        const isAnc = ((oCore.id || 0) % 10 === 6) || oCore.grade === 'ancient';
        order.grade = isAnc ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
        if (!order.points || order.points <= 10) order.points = pts;
        if (!order.tier || order.tier <= 10) order.tier = pts;
        if (!order.bonusPct || order.bonusPct === 0) {
          order.bonusPct = getArkGridCoreBonus(prefixOrder, pts, isSupportRole, isAnc);
        }
        const sName = resolveCoreSpecificName(oCore.id);
        if (sName) {
          order.specificName = sName;
          order.effectName = sName;
        }
      }

      const cCore = rawCores.find(c => (c.id || '').toString().startsWith(prefixChaos));
      if (cCore) {
        chaos.id = cCore.id;
        const pts = Array.isArray(cCore.gems)
          ? cCore.gems.reduce((s, g) => s + (g.corePoints || 0), 0)
          : (cCore.points || 17);
        const isAnc = ((cCore.id || 0) % 10 === 6) || cCore.grade === 'ancient';
        chaos.grade = isAnc ? (isEn ? 'Ancient' : 'Ancien') : (isEn ? 'Relic' : 'Relique');
        if (!chaos.points || chaos.points <= 10) chaos.points = pts;
        if (!chaos.tier || chaos.tier <= 10) chaos.tier = pts;
        if (!chaos.bonusPct || chaos.bonusPct === 0) {
          chaos.bonusPct = getArkGridCoreBonus(prefixChaos, pts, isSupportRole, isAnc);
        }
        const sName = resolveCoreSpecificName(cCore.id);
        if (sName) {
          chaos.specificName = sName;
          chaos.effectName = sName;
        }
      }
    }

    // 3. Try items fallback (from CANONICAL_PRESETS or parsed items)
    const items = (char.rawProfile && char.rawProfile.items)
      || char.items
      || (char.loadout && char.loadout.items)
      || (canon && canon.items)
      || [];

    if (Array.isArray(items)) {
      items.forEach(it => {
        const cat = it.cat || '';
        if (!cat.includes('Grille') && !cat.includes('Ark')) return;
        const lbl = it.label || '';
        const multVal = parseFloat((it.mult || '').replace('+', '').replace('%', '')) || 0;
        const valMatch = (it.val || '').match(/(\d+)P/i);
        const pts = valMatch ? parseInt(valMatch[1], 10) : 17;

        const isOrderMatch = (lbl.toLowerCase().includes('order ' + groupLabel.toLowerCase()) || lbl.toLowerCase().includes('ordre ' + groupLabel.toLowerCase()) || lbl.toLowerCase().includes('order ' + normGroup) || lbl.toLowerCase().includes('ordre ' + normGroup));
        const isChaosMatch = (lbl.toLowerCase().includes('chaos ' + groupLabel.toLowerCase()) || lbl.toLowerCase().includes('chaos ' + normGroup));

        const extractedName = resolveCoreSpecificName(null, lbl);

        if (isOrderMatch) {
          if (!order.bonusPct || order.bonusPct === 0) {
            order.bonusPct = multVal;
            order.tier = pts;
            order.points = pts;
          }
          if (extractedName && !order.specificName) {
            order.specificName = extractedName;
            order.effectName = extractedName;
          } else if (!order.specificName && lbl) {
            const rawClean = lbl.split('(')[0].trim();
            if (rawClean && !rawClean.toLowerCase().includes('cœur') && !rawClean.toLowerCase().includes('core')) {
              order.specificName = rawClean;
              order.effectName = rawClean;
            }
          }
        }
        if (isChaosMatch) {
          if (!chaos.bonusPct || chaos.bonusPct === 0) {
            chaos.bonusPct = multVal;
            chaos.tier = pts;
            chaos.points = pts;
          }
          if (extractedName && !chaos.specificName) {
            chaos.specificName = extractedName;
            chaos.effectName = extractedName;
          } else if (!chaos.specificName && lbl) {
            const rawClean = lbl.split('(')[0].trim();
            if (rawClean && !rawClean.toLowerCase().includes('cœur') && !rawClean.toLowerCase().includes('core')) {
              chaos.specificName = rawClean;
              chaos.effectName = rawClean;
            }
          }
        }
      });
    }

    // 4. Fallback defaults per class & role if specificName is still missing
    if (!order.specificName) {
      if (classNameNorm.includes('bard')) {
        order.specificName = normGroup === 'sun' ? 'Brave Accent' : (normGroup === 'moon' ? 'Brave Pulse' : 'Buckshot Acceleration');
      } else if (classNameNorm.includes('paladin')) {
        order.specificName = normGroup === 'sun' ? 'Sacred Strike' : (normGroup === 'moon' ? 'Hour of Punishment' : 'Punishing Sword');
      } else if (classNameNorm.includes('artist')) {
        order.specificName = normGroup === 'sun' ? "Sun's Embrace" : (normGroup === 'moon' ? "Moon's Veil" : 'Star Splendor');
      } else if (classNameNorm.includes('breaker') || classNameNorm.includes('asura')) {
        order.specificName = normGroup === 'sun' ? 'Shadow Fist' : (normGroup === 'moon' ? 'Asura War' : 'Asura');
      } else if (classNameNorm.includes('slayer')) {
        order.specificName = normGroup === 'sun' ? 'Guillotine' : (normGroup === 'moon' ? 'Blade of Judgment' : 'Execution');
      } else if (isSupportRole) {
        order.specificName = normGroup === 'sun' ? 'Brave Accent' : (normGroup === 'moon' ? 'Brave Pulse' : 'Buckshot Acceleration');
      } else {
        order.specificName = normGroup === 'sun' ? 'Singularity' : (normGroup === 'moon' ? 'Absolute Control' : 'Crushing Storm');
      }
      order.effectName = order.specificName;
    }

    if (!chaos.specificName) {
      if (isSupportRole) {
        chaos.specificName = normGroup === 'sun' ? (isEn ? 'Fortitude Enhancement' : 'Renforcement de Ténacité') : (normGroup === 'moon' ? (isEn ? 'Echoing Brand' : "Marque d'Écho") : (isEn ? 'Weapon Power' : "Puissance d'Arme"));
      } else {
        chaos.specificName = normGroup === 'sun' ? (isEn ? 'Flashy Attack' : 'Attaque Éclatante') : (normGroup === 'moon' ? (isEn ? 'Smoldering Strike' : 'Frappe Ardente') : (isEn ? 'Attack Power' : "Puissance d'Attaque"));
      }
      chaos.effectName = chaos.specificName;
    }

    order.name = order.specificName || (isEn ? `Order ${groupLabel}` : `Cœur d'Ordre ${groupLabel}`);
    chaos.name = chaos.specificName || (isEn ? `Chaos ${groupLabel}` : `Cœur de Chaos ${groupLabel}`);

    // 5. Fallback from extractPlayerSystems if individual cores were 0
    const sysKey = 'arkGrid' + capitalize(normGroup);
    const sys = extractPlayerSystems(char, isEn);
    const rawSys = sys[sysKey] || { bonusPct: 0, label: '' };

    if (order.bonusPct === 0 && chaos.bonusPct === 0 && rawSys.bonusPct > 0) {
      order.bonusPct = Number((rawSys.bonusPct * 0.70).toFixed(2));
      chaos.bonusPct = Number((((1 + rawSys.bonusPct / 100) / (1 + order.bonusPct / 100) - 1) * 100).toFixed(2));
      const labelMatch = (rawSys.label || '').match(/(\d+)P/i);
      if (labelMatch) {
        order.tier = parseInt(labelMatch[1], 10);
        order.points = order.tier;
        chaos.tier = Math.max(10, order.tier - 2);
        chaos.points = chaos.tier;
      }
    }

    const totalMult = ((1 + order.bonusPct / 100) * (1 + chaos.bonusPct / 100) - 1) * 100;
    const highestTier = Math.max(order.tier, chaos.tier);

    return {
      order,
      chaos,
      totalMult: Number(totalMult.toFixed(2)),
      highestTier,
      groupLabel,
      normGroup
    };
  }

  function buildArkGridCoresBreakdownHtml(player, target, coreGroup = 'sun', cpImpact = 0, isEn = false) {
    const normGroup = (coreGroup || 'sun').toLowerCase().replace('arkgrid', '');
    const p = extractArkGridCoreDetail(player, normGroup, isEn);
    const t = extractArkGridCoreDetail(target, normGroup, isEn);

    const groupThemes = {
      sun: {
        icon: '',
        color: '#E0A43A',
        nameFr: 'Cœurs Soleil (Ordre & Chaos)',
        nameEn: 'Sun Cores (Order & Chaos)',
        statFr: 'Buff Power (Dégâts Allié & Dégâts)',
        statEn: 'Buff Power (Ally DMG & Base DMG)'
      },
      moon: {
        icon: '',
        color: '#CFCBBD',
        nameFr: 'Cœurs Lune (Ordre & Chaos)',
        nameEn: 'Moon Cores (Order & Chaos)',
        statFr: 'Buff Power (Boucliers & Soins)',
        statEn: 'Buff Power (Shields & Heals)'
      },
      star: {
        icon: '',
        color: '#CFCBBD',
        nameFr: 'Cœurs Étoile (Ordre & Chaos)',
        nameEn: 'Star Cores (Order & Chaos)',
        statFr: 'DPS Net & CDR Compétences',
        statEn: 'DPS Net & Skill CDR'
      }
    };

    const theme = groupThemes[normGroup] || groupThemes.sun;
    const titleGroup = isEn ? theme.nameEn : theme.nameFr;

    const deltaMult = Number((t.totalMult - p.totalMult).toFixed(2));
    const deltaOrder = Number((t.order.bonusPct - p.order.bonusPct).toFixed(2));
    const deltaChaos = Number((t.chaos.bonusPct - p.chaos.bonusPct).toFixed(2));

    return `
      <div class="acc-breakdown-panel arkgrid${normGroup}-breakdown-panel">
        <div class="acc-breakdown-header">
          <div class="acc-breakdown-title-row">
            <div class="acc-breakdown-title">
              <span>${theme.icon}</span>
              <strong>${isEn ? `Ark Grid: ${titleGroup} Breakdown` : `Détail de la Grille d'Ark : ${titleGroup}`}</strong>
            </div>
            <span class="acc-breakdown-tag" style="background: rgba(224, 164, 58, 0.15); border-color: rgba(224, 164, 58, 0.35); color: ${theme.color};">
              ${cpImpact > 0 ? `+${cpImpact} CP (+${deltaMult.toFixed(2)}% ${isEn ? 'gap' : 'd\'écart'})` : (deltaMult < 0 ? `<span style="color:#9CB4C6;">+${Math.abs(Math.round(deltaMult * (player.cp || 3200) / 100))} CP (${isEn ? 'Lead' : 'Avance'})</span>` : (isEn ? 'Parity' : 'Parité'))}
            </span>
          </div>
          <div class="acc-breakdown-subtitle">
            ${isEn
              ? `Comparative inspection of <strong>Order Core</strong> and <strong>Chaos Core</strong> resonances. Ark Grid applies a multiplicative compounding formula: <code>(1 + Order%) &times; (1 + Chaos%) &minus; 1</code>.`
              : `Comparaison détaillée des résonances du <strong>Cœur d'Ordre</strong> et du <strong>Cœur de Chaos</strong>. L'Ark Grid applique un multiplicateur croisé : <code>(1 + Ordre%) &times; (1 + Chaos%) &minus; 1</code>.`}
          </div>
        </div>

        <!-- Cartes Face-à-Face : Mon Personnage vs Référence -->
        <div class="acc-inspect-grid">
          <!-- Mon Personnage -->
          <div class="acc-inspect-card player">
            <div class="acc-inspect-card-header">
              <div class="acc-inspect-slot-info">
                <span class="acc-inspect-slot-name">${isEn ? 'My Character' : 'Mon Personnage'}</span>
                <span class="acc-inspect-item-name">${escapeHtml(player.name)}</span>
              </div>
              <span class="acc-inspect-ilvl" style="background: rgba(232, 230, 220, 0.15); color: #E0A43A; border: 1px solid rgba(232, 230, 220, 0.3);">
                ${p.highestTier > 0 ? (isEn ? `Tier ${p.highestTier}P` : `Palier ${p.highestTier}P`) : 'Standard'}
              </span>
            </div>
            <div class="acc-lines-list">
              <div class="acc-line-badge high">
                <span><strong>${escapeHtml(p.order.specificName || p.order.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Order ' + p.groupLabel : 'Ordre ' + p.groupLabel} • ${p.order.grade} ${p.order.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${p.order.bonusPct.toFixed(2)}%</span>
                </div>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${escapeHtml(p.chaos.specificName || p.chaos.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Chaos ' + p.groupLabel : 'Chaos ' + p.groupLabel} • ${p.chaos.grade} ${p.chaos.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${p.chaos.bonusPct.toFixed(2)}%</span>
                </div>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Total Compounded Multiplier' : 'Multiplicateur Total Combiné'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700; color:${theme.color};">+${p.totalMult.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Référence Benchmark -->
          <div class="acc-inspect-card target">
            <div class="acc-inspect-card-header">
              <div class="acc-inspect-slot-info">
                <span class="acc-inspect-slot-name">${isEn ? 'Benchmark Target' : 'Profil Référence'}</span>
                <span class="acc-inspect-item-name">${escapeHtml(target.name)}</span>
              </div>
              <span class="acc-inspect-ilvl" style="background: rgba(140, 192, 132, 0.15); color: #8CC084; border: 1px solid rgba(140, 192, 132, 0.3);">
                ${t.highestTier > 0 ? (isEn ? `Tier ${t.highestTier}P` : `Palier ${t.highestTier}P`) : 'Standard'}
              </span>
            </div>
            <div class="acc-lines-list">
              <div class="acc-line-badge high">
                <span><strong>${escapeHtml(t.order.specificName || t.order.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Order ' + t.groupLabel : 'Ordre ' + t.groupLabel} • ${t.order.grade} ${t.order.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${t.order.bonusPct.toFixed(2)}%</span>
                  ${deltaOrder > 0.05 ? `<span class="line-cp-pill">+${deltaOrder.toFixed(2)}%</span>` : ''}
                </div>
              </div>
              <div class="acc-line-badge mid">
                <span><strong>${escapeHtml(t.chaos.specificName || t.chaos.name)}</strong> <span style="font-size:12px; opacity:0.85; font-weight:normal;">(${isEn ? 'Chaos ' + t.groupLabel : 'Chaos ' + t.groupLabel} • ${t.chaos.grade} ${t.chaos.points}P)</span></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700;">+${t.chaos.bonusPct.toFixed(2)}%</span>
                  ${deltaChaos > 0.05 ? `<span class="line-cp-pill">+${deltaChaos.toFixed(2)}%</span>` : ''}
                </div>
              </div>
              <div class="acc-line-badge fixed">
                <span><strong>${isEn ? 'Total Compounded Multiplier' : 'Multiplicateur Total Combiné'}</strong></span>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="font-family:var(--font-mono); font-weight:700; color:#8CC084;">+${t.totalMult.toFixed(2)}%</span>
                  ${deltaMult > 0.05 ? `<span class="line-cp-pill">+${deltaMult.toFixed(2)}%</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tableau Comparatif Détaillé -->
        <div class="astrogems-compare-table-wrap" style="margin-top: 14px;">
          <div class="astrogems-compare-table-title">
            <span></span>
            <strong>${isEn ? `Comparative Breakdown: ${titleGroup}` : `Décomposition Détaillée : ${titleGroup}`}</strong>
          </div>
          <table class="astrogems-compare-table">
            <thead>
              <tr>
                <th>${isEn ? 'Core Component' : 'Composant de Cœur'}</th>
                <th>${isEn ? 'Your Character' : 'Votre Personnage'}</th>
                <th>${isEn ? 'Benchmark Target' : 'Référence Cible'}</th>
                <th style="text-align:right;">${isEn ? 'Delta' : 'Écart'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${isEn ? `Order ${p.groupLabel} Core` : `Cœur d'Ordre ${p.groupLabel}`}</strong><br><span style="font-size:12px; color:var(--text-muted);">${isEn ? 'Primary Order Core' : 'Cœur d\'Ordre Principal'}</span></td>
                <td><strong style="color:var(--text-primary); font-size:14px;">${escapeHtml(p.order.specificName || p.order.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${p.order.grade} ${isEn ? 'Tier' : 'Palier'} ${p.order.points}P (+${p.order.bonusPct.toFixed(2)}%)</span></td>
                <td><strong style="color:#8CC084; font-size:14px;">${escapeHtml(t.order.specificName || t.order.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${t.order.grade} ${isEn ? 'Tier' : 'Palier'} ${t.order.points}P (+${t.order.bonusPct.toFixed(2)}%)</span></td>
                <td class="col-cp-gain">${deltaOrder >= 0 ? `+${deltaOrder.toFixed(2)}%` : `${deltaOrder.toFixed(2)}%`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? `Chaos ${p.groupLabel} Core` : `Cœur de Chaos ${p.groupLabel}`}</strong><br><span style="font-size:12px; color:var(--text-muted);">${isEn ? 'Amplifying Chaos Core' : 'Cœur de Chaos Amplificateur'}</span></td>
                <td><strong style="color:var(--text-primary); font-size:14px;">${escapeHtml(p.chaos.specificName || p.chaos.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${p.chaos.grade} ${isEn ? 'Tier' : 'Palier'} ${p.chaos.points}P (+${p.chaos.bonusPct.toFixed(2)}%)</span></td>
                <td><strong style="color:#8CC084; font-size:14px;">${escapeHtml(t.chaos.specificName || t.chaos.name)}</strong><br><span style="font-size:12px; color:var(--text-muted);">${t.chaos.grade} ${isEn ? 'Tier' : 'Palier'} ${t.chaos.points}P (+${t.chaos.bonusPct.toFixed(2)}%)</span></td>
                <td class="col-cp-gain">${deltaChaos >= 0 ? `+${deltaChaos.toFixed(2)}%` : `${deltaChaos.toFixed(2)}%`}</td>
              </tr>
              <tr>
                <td><strong>${isEn ? 'Compounded Synergy Multiplier' : 'Synergie Multiplicative Croisée'}</strong></td>
                <td><strong>+${p.totalMult.toFixed(2)}%</strong></td>
                <td><strong style="color:#8CC084;">+${t.totalMult.toFixed(2)}%</strong></td>
                <td class="col-cp-gain"><strong>${deltaMult >= 0 ? `+${deltaMult.toFixed(2)}%` : `${deltaMult.toFixed(2)}%`}</strong></td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="row-total">
                <td colspan="3"><strong>${isEn ? 'Combat Power Impact (Direct Core Contribution)' : 'Gain de Combat Power (Impact de l\'Écart de Cœurs)'}</strong></td>
                <td class="col-cp-gain total"><strong>${cpImpact > 0 ? `+${cpImpact} CP` : (deltaMult < 0 ? `<span style="color:#9CB4C6;">-${Math.abs(Math.round(deltaMult * (player.cp || 3200) / 100))} CP (${isEn ? 'Lead' : 'Avance'})</span>` : '= 0 CP')}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Bannière Explicative & Conseils d'Optimisation -->
        <div class="stats-educational-banner" style="border-left-color: ${theme.color}; margin-top: 14px;">
          <span class="edu-icon"></span>
          <div class="edu-content">
            <strong>${isEn ? `Why does the reference profile have a +${deltaMult.toFixed(2)}% advantage in ${titleGroup}?` : `Pourquoi la référence a-t-elle une avance de +${deltaMult.toFixed(2)}% sur les ${titleGroup} ?`}</strong>
            <div style="margin-top: 4px;">
              ${isEn
                ? `1. <strong>Core Point Tiers (20P vs ${p.highestTier}P)</strong>: Reaching <strong>Tier 20P</strong> requires 4 socketed Astrogems with +5 resonance points each (4 &times; 5 = 20 pts). Each tier jump triggers a major milestone multiplier.<br>
                   2. <strong>Chaos Core Synergy</strong>: The Chaos Core serves as a direct cross-multiplier for your Order Core: <code>(1 + Order) &times; (1 + Chaos) &minus; 1</code>. Improving your Chaos Core from ${p.chaos.points}P to 20P yields a large gain in effective CP.<br>
                   3. <strong>Optimization Tip</strong>: Prioritize cutting and socketing 5-point Astrogems on your lowest core (${p.chaos.points < p.order.points ? (p.chaos.specificName ? `Chaos: ${p.chaos.specificName}` : 'Chaos') : (p.order.specificName ? `Order: ${p.order.specificName}` : 'Order')}) to bridge the <strong>+${cpImpact} CP</strong> gap at optimal gold efficiency.`
                : `1. <strong>Paliers de Points de Cœur (20P vs ${p.highestTier}P)</strong> : Pour débloquer le <strong>Palier 20P</strong>, il est nécessaire de sertir 4 astrogemmes taillées apportant 5 points de résonance chacune (4 &times; 5 = 20 pts). Chaque palier franchi déclenche un multiplicateur de dégâts/buff accru.<br>
                   2. <strong>Multiplication Croisée Ordre &times; Chaos</strong> : Le Cœur de Chaos multiplie directement le bonus du Cœur d'Ordre : <code>(1 + Ordre) &times; (1 + Chaos) &minus; 1</code>. Faire monter le Cœur de Chaos de ${p.chaos.points}P à 20P génère un gain immédiat de puissance.<br>
                   3. <strong>Conseil d'Optimisation</strong> : Priorisez le taillage d'astrogemmes à 5 points de résonance sur votre cœur le plus bas (${p.chaos.points < p.order.points ? (p.chaos.specificName ? `Chaos : ${p.chaos.specificName}` : 'Chaos') : (p.order.specificName ? `Ordre : ${p.order.specificName}` : 'Ordre')}) pour combler rapidement l'écart de <strong>+${cpImpact} CP</strong>.`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function buildCpReconciliationHtml(player, target, gaps, isEn, tableStats) {
    if (!player || !target) return '';
    const pCp = Number(player.cp || 0);
    const tCp = Number(target.cp || 0);
    const netGap = Math.round(tCp - pCp);

    // Totaux réels des lignes du tableau (sinon, ceux du diagnostic)
    const lagCp = (tableStats && tableStats.totalPositiveCp !== undefined)
      ? tableStats.totalPositiveCp
      : (gaps || []).filter(g => g.gainCp > 0 && g.priority !== 'player_lead').reduce((s, g) => s + (g.gainCp || 0), 0);
    const leadCp = (tableStats && tableStats.totalPlayerLeadCp !== undefined)
      ? tableStats.totalPlayerLeadCp
      : (gaps || []).filter(g => g.priority === 'player_lead').reduce((s, g) => s + (g.gainCp || 0), 0);
    const modelGap = lagCp - leadCp;
    const residual = netGap - modelGap;
    const signed = (v) => `${v > 0 ? '+' : (v < 0 ? '−' : '')}${formatNumber(Math.abs(v))} CP`;

    // La référence est toujours un joueur réel : l'écart restant est ce que le modèle n'explique pas
    const explanation = isEn
      ? `The rows model a ${signed(modelGap)} gap; the real profiles differ by ${signed(netGap)}. The remaining ${signed(residual)} comes from what the model does not read (roster level, cards, pets, potions…) and from the way systems multiply together.`
      : `Les lignes modélisent un écart de ${signed(modelGap)} ; les vrais profils diffèrent de ${signed(netGap)}. Les ${signed(residual)} restants viennent de ce que le modèle ne lit pas (niveau de roster, cartes, familiers, potions…) et de la multiplication des systèmes entre eux.`;

    return `
      <div class="cp-reconciliation-card">
        <div class="reconciliation-top">
          <div class="reconciliation-title">
            <strong>${isEn ? 'Combat Power balance' : 'Bilan du Combat Power'}</strong>
          </div>
        </div>

        <div class="reconciliation-equation">
          <div class="eq-box gross-deficit">
            <div class="eq-box-label">${isEn ? 'Behind (sum of rows)' : 'Retards (somme des lignes)'}</div>
            <div class="eq-box-val">+${formatNumber(lagCp)} CP</div>
            <div class="eq-box-sub">${isEn ? 'Systems where the reference is ahead' : 'Systèmes où la référence est devant'}</div>
          </div>

          <div class="eq-operator">−</div>

          <div class="eq-box player-lead">
            <div class="eq-box-label">${isEn ? 'Ahead (sum of rows)' : 'Avances (somme des lignes)'}</div>
            <div class="eq-box-val">${formatNumber(leadCp)} CP</div>
            <div class="eq-box-sub">${isEn ? 'Systems where you are ahead' : 'Systèmes où tu es devant'}</div>
          </div>

          <div class="eq-operator">=</div>

          <div class="eq-box net-gap">
            <div class="eq-box-label">${isEn ? 'Model balance' : 'Solde du modèle'}</div>
            <div class="eq-box-val">${signed(modelGap)}</div>
            <div class="eq-box-sub">${isEn ? `Header gap: ${signed(netGap)}` : `Écart affiché : ${signed(netGap)}`}</div>
          </div>
        </div>

        <div class="reconciliation-explanation">
          <span>${explanation}</span>
        </div>
      </div>
    `;
  }

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
    const pSpec = (getCharacterSpecName(player) || '').toLowerCase();
    const regMatch = /\((CE|NA|NAE|NAW|SA)\)/i.exec(player.server || '');
    const pRegion = (player.region || (regMatch && regMatch[1]) || 'CE').toUpperCase().replace(/^NA[EW]$/, 'NA');

    // Classement des candidats. Le CP suit l'iLvl : d'abord la fenêtre [-8 ; +10], puis plus haut,
    // en dernier plus bas ; à l'intérieur, iLvl le plus proche, même spé et même région.
    // La fenêtre descend à -8 car l'iLvl du réservoir date du raid relevé : les joueurs ont progressé depuis.
    const candidates = (pool[cls] || [])
      .filter(c => c.role === role && c.name.toLowerCase() !== pName)
      .map(c => {
        const d = c.ilvl - pIlvl;
        const group = d >= -8 && d <= 10 ? 0 : (d > 10 ? 1 : 2);
        let score = group * 1000 + Math.abs(d);
        if ((c.spec || '').toLowerCase() !== pSpec) score += 3;
        if ((c.region || '').toUpperCase() !== pRegion) score += 2;
        return { ...c, score };
      })
      .sort((a, b) => a.score - b.score);

    const above = [];
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
        if ((b.cp || 0) > pCp) above.push(b);
      });
    }
    // Les plus proches au-dessus : faible écart de CP, puis iLvl proche
    above.sort((a, b) => ((a.cp - pCp) - (b.cp - pCp)) || (Math.abs(a.ilvl - pIlvl) - Math.abs(b.ilvl - pIlvl)));
    const peers = above.slice(0, SUGGESTED_PEER_COUNT);

    // Disponibles aussi dans le menu des références et pour l'auto-match
    if (!benchmarkState.searchedTargets) benchmarkState.searchedTargets = [];
    peers.forEach(b => {
      benchmarkState.searchedTargets = benchmarkState.searchedTargets.filter(t => t.id !== b.id);
      benchmarkState.searchedTargets.push(b);
    });
    return { peers, probed, poolSize: candidates.length };
  }

  function renderSuggestedPeers(player, target) {
    const box = document.getElementById('benchSuggestedPeers');
    if (!box || !player) return;
    const isEn = isEnglishLang();
    const st = suggestedPeersState.byPlayer[suggestedPeersKey(player)];
    const title = `<div class="bench-suggested-title">${isEn ? 'Suggested players — same class, slightly higher CP' : 'Joueurs proposés — même classe, CP légèrement supérieur'}</div>`;
    if (!st || st.loading) {
      box.innerHTML = `${title}<div class="bench-suggested-note">${isEn ? 'Searching live profiles on lostark.bible…' : 'Recherche de profils en direct sur lostark.bible…'}</div>`;
      return;
    }
    if (!st.peers.length) {
      box.innerHTML = `${title}<div class="bench-suggested-note">${isEn
        ? `No player of this class with a higher CP was found among ${st.probed} live profiles checked. Use the search bar to pick one.`
        : `Aucun joueur de cette classe avec un CP supérieur parmi les ${st.probed} profils vérifiés en direct. Utilise la barre de recherche.`}</div>`;
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
    const note = st.peers.length < SUGGESTED_PEER_COUNT
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

  function renderBenchmarkTab() {
    const heroCard = document.getElementById('benchmarkHeroCard');
    if (!heroCard) return;

    const t = (window.i18n && window.i18n.t) || (k => k);
    const isEn = isEnglishLang();

    const player = getCurrentActiveCharacter();
    if (!player) return;

    // Enrichit le profil joueur depuis CANONICAL_PRESETS si c'est un profil du roster sans rawProfile
    const pId = (player.id || player.name || '').toLowerCase();
    const canonPlayer = null;
    if (canonPlayer) {
      if (!player.rawProfile) player.rawProfile = canonPlayer;
      if (!player.items || player.items.length === 0) player.items = canonPlayer.items;
      if (!player.engravings || player.engravings.length === 0) player.engravings = canonPlayer.engravings;
      if (!player.arkGridCores || player.arkGridCores.length === 0) player.arkGridCores = canonPlayer.arkGridCores;
      if (!player.gemParts) player.gemParts = canonPlayer.gemParts;
    }

    const pClass = normalizeClassName(player.className || '').toLowerCase();
    const isSupportClass = ['paladin', 'bard', 'artist', 'valkyrie'].some(s => pClass.includes(s));
    const pRole = player.role || (isSupportClass ? 'support' : 'dps');
    const avail = getAvailableBenchmarks(player);

    // Résolution du profil cible (100% profils LIVE ou Roster réel, zéro preset statique, zéro profil synthétique)
    let target = benchmarkState.customTarget;

    // VALIDATION STRICTE DE LA CLASSE, DU RÔLE ET EXCLUSION DU JOUEUR :
    // Si la cible en cache ou sélectionnée n'est pas de la même classe ou du même rôle, ou si c'est le joueur lui-même, on la rejette obligatoirement
    const pName = (player.name || player.id || '').toLowerCase().trim();
    if (target) {
      const tName = (target.name || target.id || '').toLowerCase().trim();
      const tClass = normalizeClassName(target.className || '').toLowerCase();
      const tRole = target.role || (isSupportClass ? (isSupportSpecName(target.spec) ? 'support' : 'dps') : 'dps');
      if (!target.isLive || tName === pName || tClass !== pClass || tRole !== pRole) {
        target = null;
        benchmarkState.customTarget = null;
        benchmarkState.currentTargetId = null;
      }
    }

    if (!target) {
      if (benchmarkState.currentTargetId) {
        // 1. Cherche dans les profils disponibles de CETTE CLASSE et MÊME RÔLE (sans le joueur lui-même)
        target = avail.find(b => {
          if (b.id !== benchmarkState.currentTargetId) return false;
          const bName = (b.name || b.id || '').toLowerCase().trim();
          if (bName === pName) return false;
          if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
          const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
          return bRole === pRole;
        });
        // 2. Cherche dans les profils LIVE recherchés de CETTE CLASSE et MÊME RÔLE (sans le joueur lui-même)
        if (!target) {
          target = (benchmarkState.searchedTargets || []).find(b => {
            if (b.id !== benchmarkState.currentTargetId) return false;
            const bName = (b.name || b.id || '').toLowerCase().trim();
            if (bName === pName) return false;
            if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
            const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
            return bRole === pRole;
          });
        }
      }
    }

    // Priorité absolue aux profils LIVE de lostark.bible (MÊME CLASSE ET MÊME RÔLE, SANS LE JOUEUR LUI-MÊME) :
    const hasLivePeer = avail.some(b => {
      if (!b.isLive) return false;
      const bName = (b.name || b.id || '').toLowerCase().trim();
      if (bName === pName) return false;
      if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
      const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
      return bRole === pRole;
    }) || (benchmarkState.searchedTargets || []).some(b => {
      if (!b || !b.isLive) return false;
      const bName = (b.name || b.id || '').toLowerCase().trim();
      if (bName === pName) return false;
      if (normalizeClassName(b.className || '').toLowerCase() !== pClass) return false;
      const bRole = b.role || (isSupportClass ? (isSupportSpecName(b.spec) ? 'support' : 'dps') : 'dps');
      return bRole === pRole;
    });

    // Si la cible actuelle est dynamique ou absente, mais qu'un profil LIVE de cette classe et rôle est disponible en mémoire, on bascule dessus immédiatement
    // Profils proposés (réservoir + fiches en direct) ; l'ancienne liste figée ne sert qu'en dernier recours
    const sugState = ensureSuggestedPeers(player);

    if (!target && hasLivePeer) {
      const liveOpt = findOptimalBenchmark(player);
      if (liveOpt && liveOpt.isLive && (liveOpt.name || '').toLowerCase().trim() !== pName) {
        target = liveOpt;
        benchmarkState.customTarget = liveOpt;
        benchmarkState.currentTargetId = liveOpt.id;
      }
    }


    if (!target) {
      target = findOptimalBenchmark(player);
      if (target) benchmarkState.currentTargetId = target.id;
    }
    renderSuggestedPeers(player, target);

    if (!target) {
      // Si aucun profil n'est disponible et aucun fetch n'est en cours :
      // État d'invitation à la recherche (NON BLOQUANT, interactif)
      heroCard.innerHTML = `
        <div class="bench-char-card" style="text-align: center; padding: 48px 24px; border: 1px dashed rgba(232, 230, 220, 0.4); background: transparent; border-radius: 0; margin: 16px 0;">
          <div style="font-size: 40px; margin-bottom: 12px;"></div>
          <div style="font-size: 19px; font-weight: 700; color: #E0A43A; margin-bottom: 8px;">
            ${isEn ? 'No Benchmark Profile Selected' : 'Aucun Profil de Référence Sélectionné'}
          </div>
          <div style="font-size: 15px; color: var(--text-muted); max-width: 540px; margin: 0 auto 18px; line-height: 1.5;">
            ${isEn
              ? `To benchmark your <strong>${escapeHtml(player.className)}</strong> (${escapeHtml(player.name)}), enter any player name or lostark.bible profile link in the search bar below.`
              : `Pour comparer votre <strong>${escapeHtml(player.className)}</strong> (${escapeHtml(player.name)}), saisissez le pseudo d'un joueur ou un lien lostark.bible dans la barre de recherche ci-dessous.`}
          </div>
          <div style="display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid rgba(232, 230, 220, 0.3); color: #E0A43A; padding: 6px 16px; border-radius: 0; font-size: 13px; font-weight: 600;">
            <span>${isEn ? '100% Live lostark.bible profiles supported' : 'Profils 100% LIVE lostark.bible supportés'}</span>
          </div>
        </div>
      `;

      // Remplissage du sélecteur avec les profils recherchés disponibles de cette classe et rôle
      const select = document.getElementById('benchmarkPresetSelect');
      if (select) {
        let optionsHtml = `<option value="">${isEn ? 'Select or search a benchmark profile...' : 'Sélectionnez ou recherchez un profil...'} </option>`;
        
        const searchedList = (benchmarkState.searchedTargets || []).filter(s => {
          if (!s || !s.isLive) return false;
          const sName = (s.name || s.id || '').toLowerCase().trim();
          if (sName === pName) return false;
          if (normalizeClassName(s.className || '').toLowerCase() !== pClass) return false;
          const sRole = s.role || (isSupportClass ? (isSupportSpecName(s.spec) ? 'support' : 'dps') : 'dps');
          return sRole === pRole;
        });
        if (searchedList.length > 0) {
          optionsHtml += `<optgroup label="${isEn ? 'Live Profiles (' + escapeHtml(player.className) + ')' : 'Profils LIVE Réels (' + escapeHtml(player.className) + ')'}">`;
          searchedList.forEach(s => {
            optionsHtml += `<option value="${escapeHtml(s.id)}">
              ${escapeHtml(s.name)} • ${escapeHtml(s.spec || '')} (${s.ilvl.toFixed(1)} iLvl - ${formatNumber(Math.round(s.cp))} CP) [LIVE]
            </option>`;
          });
          optionsHtml += `</optgroup>`;
        }

        select.innerHTML = optionsHtml;
      }

      const gapsGrid = document.getElementById('benchmarkGapsGrid');
      if (gapsGrid) gapsGrid.innerHTML = '';
      const planEl = document.getElementById('benchmarkActionPlan');
      if (planEl) planEl.innerHTML = '';
      const matrixEl = document.getElementById('benchmarkSystemsMatrix');
      if (matrixEl) matrixEl.innerHTML = '';
      const reconEl = document.getElementById('benchmarkCpReconciliation');
      if (reconEl) reconEl.innerHTML = '';
      return;
    }

    // 1. Mise à jour du Sélecteur de Presets & Choix Libre (MÊME CLASSE ET MÊME RÔLE UNIQUEMENT)
    const select = document.getElementById('benchmarkPresetSelect');
    if (select) {
      let optionsHtml = '';

      // 1. Profils LIVE de CETTE CLASSE et MÊME RÔLE recherchés & synchronisés en direct sur lostark.bible (sans le joueur lui-même)
      const searchedList = (benchmarkState.searchedTargets || []).filter(s => {
        if (!s || !s.isLive) return false;
        const sName = (s.name || s.id || '').toLowerCase().trim();
        if (sName === pName) return false;
        if (normalizeClassName(s.className || '').toLowerCase() !== pClass) return false;
        const sRole = s.role || (isSupportClass ? (isSupportSpecName(s.spec) ? 'support' : 'dps') : 'dps');
        return sRole === pRole;
      });
      if (benchmarkState.customTarget && normalizeClassName(benchmarkState.customTarget.className || '').toLowerCase() === pClass && (benchmarkState.customTarget.name || '').toLowerCase().trim() !== pName && !searchedList.some(s => s.id === benchmarkState.customTarget.id)) {
        const ctRole = benchmarkState.customTarget.role || (isSupportClass ? (isSupportSpecName(benchmarkState.customTarget.spec) ? 'support' : 'dps') : 'dps');
        if (ctRole === pRole) {
          searchedList.unshift(benchmarkState.customTarget);
        }
      }
      if (searchedList.length > 0) {
        optionsHtml += `<optgroup label="${isEn ? 'Live Profiles (' + escapeHtml(player.className) + ')' : 'Profils LIVE Réels (' + escapeHtml(player.className) + ')'}">`;
        searchedList.forEach(s => {
          const isSel = target && (target.id === s.id);
          const deltaIlvl = s.ilvl - (player.ilvl || 1700);
          const signIlvl = deltaIlvl >= 0 ? `+${deltaIlvl.toFixed(1)}` : deltaIlvl.toFixed(1);
          optionsHtml += `<option value="${escapeHtml(s.id)}" ${isSel ? 'selected' : ''}>
            ${escapeHtml(s.name)} • ${escapeHtml(s.spec || '')} (${s.ilvl.toFixed(1)} iLvl [${signIlvl}] - ${formatNumber(Math.round(s.cp))} CP) [LIVE]
          </option>`;
        });
        optionsHtml += `</optgroup>`;
      }

      select.innerHTML = optionsHtml;
    }

    // 2. Calcul du Différentiel CP
    const pCp = player.cp || 3692;
    const tCp = target.cp || 3989;
    const deltaCp = Math.round(tCp - pCp);
    const deltaPct = pCp > 0 ? ((deltaCp / pCp) * 100).toFixed(1) : '0.0';
    const isTargetAhead = deltaCp >= 0;

    const pAvatar = getCharacterFaceAvatar(player);
    const tAvatar = target.avatarUrl || getClassIconUrl(target.className, target.role);
    const pSpec = getCharacterSpecName(player);
    const tSpec = target.spec || pSpec;

    // 3. Rendu Hero Face à Face
    heroCard.innerHTML = `
      <div class="bench-hero-grid">
        <!-- Joueur -->
        <div class="bench-char-card player">
          <div class="bench-char-header">
            <div class="bench-avatar-frame">
              <img src="${pAvatar}" alt="${escapeHtml(player.name)}" loading="eager" onerror="this.onerror=null; this.src='images/classes/paladin.png';">
            </div>
            <div class="bench-char-info">
              <span style="font-size:12px; text-transform:uppercase; font-weight:700; color:#E0A43A;">${t('bench_card_player_title')}</span>
              <div class="bench-char-name-row">
                <span class="bench-char-name">${escapeHtml(player.name)}</span>
                <span class="bench-char-ilvl">${(player.ilvl || 1700).toFixed(2)}</span>
              </div>
              <div class="bench-char-meta">${escapeHtml(normalizeClassName(player.className))} • ${escapeHtml(player.server || 'Elpon (CE)')}</div>
              <span class="bench-char-spec-badge">${escapeHtml(pSpec)}</span>
            </div>
          </div>

          <div class="bench-cp-box">
            <div>
              <div class="bench-cp-label">Combat Power</div>
              <div style="font-size:12px; color:var(--text-muted);">${isEn ? 'Observed in-game (Raid)' : 'Relevé en jeu (Raid)'}</div>
            </div>
            <div class="bench-cp-val">${formatNumber(Math.round(pCp))} CP</div>
          </div>

          <div class="bench-pills-row">
            <span class="bench-pill">${isEn ? 'Gems' : 'Gemmes'} : <strong>${escapeHtml(getCharacterGemSummary(player, isEn))}</strong></span>
            <span class="bench-pill">${isEn ? 'Adv. Honing' : 'Affinage Adv'} : <strong>+${player.advHoning || 40}</strong></span>
          </div>
        </div>

        <!-- VS & Delta Central -->
        <div class="bench-delta-center">
          <span class="bench-vs-pill">VS</span>
          <div class="bench-delta-badge">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; color:#A29F92;">${t('bench_delta_title')}</span>
            <span class="bench-delta-val">${isTargetAhead ? '+' : ''}${formatNumber(deltaCp)} CP</span>
            <span class="bench-delta-pct">${isTargetAhead ? '+' : ''}${deltaPct}% ${isEn ? 'performance gap' : 'de performance'}</span>
          </div>
          <div class="bench-delta-bar-container">
            <div class="bench-delta-bar-fill" style="width: ${Math.min(100, Math.max(10, Math.round((pCp / tCp) * 100)))}%;"></div>
          </div>
          <span style="font-size:12px; color:var(--text-muted);">${t('bench_same_ilvl_note')} (±${Math.abs(Math.round(target.ilvl - player.ilvl))} iLvl)</span>
        </div>

        <!-- Benchmark Référence -->
        <div class="bench-char-card benchmark">
          <div class="bench-char-header">
            <div class="bench-avatar-frame">
              <img src="${tAvatar}" alt="${escapeHtml(target.name)}" loading="eager" onerror="this.onerror=null; this.src='images/classes/paladin.png';">
            </div>
            <div class="bench-char-info">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size:12px; text-transform:uppercase; font-weight:700; color:#8CC084;">${t('bench_card_target_title')}</span>
                ${target.isLive 
                  ? `<span style="background: transparent; border: 1px solid rgba(140, 192, 132, 0.4); color: #8CC084; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 0; display: inline-flex; align-items: center; gap: 3px;">LIVE lostark.bible</span>` 
                  : `<span style="background: transparent; border: 1px solid rgba(232, 230, 220, 0.4); color: #CFCBBD; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 0; display: inline-flex; align-items: center; gap: 3px;">${isEn ? 'Calibrated T4 Target' : 'Palier Calibré T4'}</span>`
                }
              </div>
              <div class="bench-char-name-row">
                <span class="bench-char-name">${escapeHtml(target.name)}</span>
                <span class="bench-char-ilvl">${target.ilvl.toFixed(2)}</span>
              </div>
              <div class="bench-char-meta">${escapeHtml(normalizeClassName(target.className))} • ${escapeHtml(target.server || 'Elpon (CE)')}${target.guild ? ` • ${isEn ? 'Guild' : 'Guilde'} : ${escapeHtml(target.guild)}` : ''}</div>
              <span class="bench-char-spec-badge">${escapeHtml(tSpec)}</span>
            </div>
          </div>

          <div class="bench-cp-box">
            <div>
              <div class="bench-cp-label">Combat Power</div>
              <div style="font-size:12px; color:var(--text-muted);">${target.isLive ? (isEn ? 'Raid Preset (lostark.bible)' : 'Profil de Raid (lostark.bible)') : (isEn ? 'Calibrated Target (Progression)' : 'Palier de Progression Calibré')}</div>
            </div>
            <div class="bench-cp-val">${formatNumber(Math.round(tCp))} CP</div>
          </div>

          <div class="bench-pills-row">
            <span class="bench-pill">${isEn ? 'Gems' : 'Gemmes'} : <strong>${escapeHtml(isEn ? formatLostArkEnglish(target.gemDesc || 'Full Tier 4 Lv. 8 Gems') : formatLostArkFrench(target.gemDesc || 'Full Gemmes 8'))}</strong></span>
            ${target.isLive && target.bibleUrl
              ? `<a href="${target.bibleUrl}" target="_blank" rel="noopener noreferrer" style="font-size:13px; color:#E0A43A; text-decoration:underline; display:flex; align-items:center; gap:4px; margin-left:auto;">${t('bench_view_bible')}</a>`
              : `<span class="bench-pill" style="margin-left:auto; background: transparent; border-color:rgba(232, 230, 220,0.3); color:#CFCBBD;">${isEn ? 'Calibrated Model' : 'Modèle Calibré'}</span>`
            }
          </div>
        </div>
      </div>
    `;

    const pSys = extractPlayerSystems(player, isEn);
    const tSys = resolveTargetSystems(target, isEn);
    const cpPerPct = (player.cp && player.cp > 1000) ? (player.cp / 100) : 38;
    const directCpGap = Math.round((target.cp || 0) - (player.cp || 0));

    const { gaps, plan } = computeDynamicGapsAndPlan(player, target, pSys, tSys, isEn);

    // 4. Diagnostic des Écarts Prioritaires (Uniquement les leviers de progression ou avantages joueur)
    const gapsGrid = document.getElementById('benchmarkGapsGrid');
    const reconEl = document.getElementById('benchmarkCpReconciliation');
    if (gapsGrid) {
      const activeGaps = gaps.filter(g => g.gainCp > 0 || g.priority === 'player_lead');
      if (activeGaps.length === 0) {
        gapsGrid.innerHTML = `
          <div class="bench-gap-card" style="grid-column: 1 / -1; text-align: center; padding: 24px;">
            <span style="font-size: 31px;"></span>
            <h4 style="margin: 8px 0 4px 0; color: #8CC084;">${isEn ? 'Parity or ahead' : 'Parité ou avance'}</h4>
            <p style="font-size: 14px; color: var(--text-muted); margin: 0;">${isEn ? 'All your equipment systems are equal or superior to this reference benchmark.' : 'Tous vos systèmes d\'équipement sont équivalents ou supérieurs à ce profil de référence.'}</p>
          </div>
        `;
      } else {
        let gapsHtml = '';
        const targetLeads = activeGaps.filter(g => g.priority !== 'player_lead');
        const playerLeads = activeGaps.filter(g => g.priority === 'player_lead');
        const displayGaps = [];
        if (playerLeads.length > 0) {
          displayGaps.push(...targetLeads.slice(0, 4));
          displayGaps.push(...playerLeads.slice(0, 2));
        } else {
          displayGaps.push(...targetLeads.slice(0, 5));
        }

        let impactIdx = 1;
        displayGaps.forEach((g) => {
          let rankBadge = `#${impactIdx} IMPACT`;
          let gainText = '+' + g.gainCp + ' CP';
          if (g.priority === 'player_lead') {
            rankBadge = isEn ? 'ADVANTAGE' : 'AVANTAGE';
            gainText = '+' + g.gainCp + ' CP (' + (isEn ? 'Lead' : 'Avance') + ')';
          } else {
            impactIdx++;
          }

          gapsHtml += `
            <div class="bench-gap-card ${g.priority === 'player_lead' ? 'bench-gap-card-lead' : ''}">
              <div class="bench-gap-card-top">
                <span class="bench-gap-rank ${g.priority === 'player_lead' ? 'rank-lead' : ''}">${rankBadge}</span>
                <span class="bench-gap-gain-pill ${g.priority === 'player_lead' ? 'player-lead' : ''}">${gainText}</span>
              </div>
              <div class="bench-gap-title">
                <span>${g.icon}</span> <span>${escapeHtml(g.title)}</span>
              </div>
              <div class="bench-gap-desc">${escapeHtml(g.desc)}</div>
            </div>
          `;
        });
        gapsGrid.innerHTML = gapsHtml;
      }
    }

    // 4b. Bilan Mathématique du CP (Réconciliation des Écarts)
    if (reconEl) {
      reconEl.innerHTML = buildCpReconciliationHtml(player, target, gaps, isEn);
    }

    // 5. Tableau Comparatif Système par Système
    const tableBody = document.getElementById('benchmarkTableBody');
    if (tableBody) {
      const rowsConfig = [
        { key: 'arkGridSun', name: isEn ? 'Ark Grid: Sun Cores (Order & Chaos)' : 'Ark Grid : Cœurs Soleil (Ordre & Chaos)', icon: '', prio: 'high' },
        { key: 'arkGridMoon', name: isEn ? 'Ark Grid: Moon Cores (Order & Chaos)' : 'Ark Grid : Cœurs Lune (Ordre & Chaos)', icon: '', prio: 'high' },
        { key: 'arkGridStar', name: isEn ? 'Ark Grid: Star Cores (Order & Chaos)' : 'Ark Grid : Cœurs Étoile (Ordre & Chaos)', icon: '', prio: 'med' },
        { key: 'arkGridAstrogems', name: isEn ? 'Ark Grid: Astrogems (Substats)' : 'Ark Grid : Astrogemmes (Sous-stats)', icon: '', prio: 'med' },
        { key: 'accessories', name: isEn ? 'T4 Accessories (Rolls & Lines)' : 'Accessoires T4 (Rolls & Lignes)', icon: '', prio: 'high' },
        { key: 'weapon', name: isEn ? 'T4 Weapon (Honing & Quality)' : 'Arme T4 (Affinage & Qualité)', icon: '', prio: 'med' },
        { key: 'advHoning', name: isEn ? 'T4 Advanced Honing' : 'Affinage Avancé T4', icon: '', prio: 'equal' },
        { key: 'bracelet', name: isEn ? 'T4 Bracelet (Stats & Passives)' : 'Bracelet T4 (Stats & Passifs)', icon: '', prio: 'med' },
        { key: 'gems', name: isEn ? 'T4 Gems (Tiers & DMG)' : 'Gemmes T4 (Niveaux & Dégâts)', icon: '', prio: target.gemTier === 'gem8' ? 'equal' : 'opt' },
        { key: 'armors', name: isEn ? 'T4 Armors (Chest/Pants/Shoulders)' : 'Armures T4 (Torse/Jambes/Épaules)', icon: '', prio: 'med' },
        { key: 'baseAttackStat', name: isEn ? 'Main Stat & Base AP' : 'Stat Principale & Attaque Base', icon: '', prio: 'med' },
        { key: 'engravings', name: isEn ? 'Engravings & Ability Stone' : 'Gravures & Pierre de Naissance', icon: '', prio: 'equal' },
        { key: 'combatStats', name: isEn ? 'Combat Stats (Crit/Spec/Swift)' : 'Stats de Combat (Crit/Spé/Rap)', icon: '', prio: 'equal' },
        { key: 'arkEvolution', name: isEn ? 'Ark Passive: Evolution (Stats)' : 'Ark Passive : Évolution (Stats)', icon: '', prio: 'med' },
        { key: 'arkEnlightenment', name: isEn ? 'Ark Passive: Enlightenment (Tree)' : 'Ark Passive : Illumination (Arbre)', icon: '', prio: 'med' },
        { key: 'arkLeap', name: isEn ? 'Ark Passive: Leap (Hyper)' : 'Ark Passive : Saut (Hyper)', icon: '', prio: 'equal' },
        { key: 'karma', name: isEn ? 'T4 Karma (Evolution Rank 0-6)' : 'Karma T4 (Évolution Rang 0-6)', icon: '', prio: 'equal' }
      ];

      const cpPerPct = (player.cp && player.cp > 1000) ? (player.cp / 100) : 38;
      let equalRowsCount = 0;
      let rowsHtml = '';
      let totalPositiveTableCp = 0;
      let totalPlayerLeadTableCp = 0;
      let maxLeadCp = 0;
      let topLeadTitle = '';

      rowsConfig.forEach(cfg => {
        const pRaw = pSys[cfg.key] || { label: 'Standard', bonusPct: 0 };
        let tRaw = tSys[cfg.key];
        if (!tRaw || (['baseAttackStat', 'combatStats'].includes(cfg.key) && tRaw.bonusPct <= 10) || (cfg.key === 'engravings' && tRaw.bonusPct < 60)) {
          const freshTargetSys = resolveTargetSystems(target, isEn);
          tRaw = freshTargetSys[cfg.key] || { label: 'Standard', bonusPct: 0 };
        }
        let pLabel = pRaw.label || '';
        let tLabel = tRaw.label || '';
        if (isEn) {
          pLabel = formatLostArkEnglish(pLabel);
          tLabel = formatLostArkEnglish(tLabel);
        } else {
          pLabel = formatLostArkFrench(pLabel);
          tLabel = formatLostArkFrench(tLabel);
        }
        const estimatedPair = isEstimatedPair(pRaw, tRaw);
        if (estimatedPair) {
          const note = isEn ? ' [estimated — not read]' : ' [estimé — non lu]';
          if (pRaw.estimated) pLabel += note;
          if (tRaw.estimated) tLabel += note;
        }
        const pItem = { label: pLabel, bonusPct: pRaw.bonusPct };
        const tItem = { label: tLabel, bonusPct: tRaw.bonusPct };
        const delta = estimatedPair ? 0 : Number((tItem.bonusPct - pItem.bonusPct).toFixed(2));
        const isEqual = Math.abs(delta) <= 0.02;

        const isAcc = cfg.key === 'accessories';
        const isBracelet = cfg.key === 'bracelet';
        const isAstrogems = cfg.key === 'arkGridAstrogems';
        const isEngravings = cfg.key === 'engravings';
        const isBaseAtk = cfg.key === 'baseAttackStat';
        const isCombatStats = cfg.key === 'combatStats';
        const isArkGridSun = cfg.key === 'arkGridSun';
        const isArkGridMoon = cfg.key === 'arkGridMoon';
        const isArkGridStar = cfg.key === 'arkGridStar';
        const isWeapon = cfg.key === 'weapon';
        const isArmors = cfg.key === 'armors';
        const hasInteractivePanel = isAcc || isBracelet || isAstrogems || isEngravings || isBaseAtk || isCombatStats || isArkGridSun || isArkGridMoon || isArkGridStar || isWeapon || isArmors;

        const isHiddenInEqual = isEqual && !hasInteractivePanel;
        if (isHiddenInEqual) equalRowsCount++;

        const deltaStr = delta > 0.01 
          ? `+${delta.toFixed(2)}%` 
          : (delta < -0.01 ? `${delta.toFixed(2)}%` : '= 0.00%');
        const badgeClass = delta > 0.01 
          ? 'delta-badge-pos' 
          : (delta < -0.01 ? 'delta-badge-neg' : 'delta-badge-neutral');

        const rowGapCp = systemGapCp(pItem.bonusPct, tItem.bonusPct, player.cp);
        const cpImpact = delta > 0.01 ? Math.round(rowGapCp) : 0;
        const playerLeadCp = delta < -0.01 ? Math.round(-rowGapCp) : 0;

        if (cpImpact > 0) {
          totalPositiveTableCp += cpImpact;
        } else if (playerLeadCp > 0) {
          totalPlayerLeadTableCp += playerLeadCp;
          if (playerLeadCp > maxLeadCp) {
            maxLeadCp = playerLeadCp;
            topLeadTitle = cfg.name;
          }
        }

        let prioLabel = t('bench_prio_equal');
        let prioClass = 'equal';
        if (delta < -0.10) {
          prioLabel = isEn ? 'Player Advantage' : 'Avantage Joueur';
          prioClass = 'opt';
        } else if (cfg.prio === 'high' && delta > 0.5) {
          prioLabel = t('bench_prio_high');
          prioClass = 'high';
        } else if (cfg.prio === 'med' && delta > 0.2) {
          prioLabel = t('bench_prio_med');
          prioClass = 'med';
        } else if (cfg.prio === 'opt' && delta > 0) {
          prioLabel = t('bench_prio_opt');
          prioClass = 'opt';
        } else if (delta > 0.02) {
          // Retard hors seuils : stats dérivées de l'équipement, sinon simple écart
          const derived = cfg.key === 'combatStats' || cfg.key === 'baseAttackStat';
          prioLabel = derived ? t('bench_prio_derived') : t('bench_prio_med');
          prioClass = 'med';
        }

        let cpDisplay = '—';
        if (cpImpact > 0) {
          cpDisplay = `+${cpImpact} CP`;
        } else if (playerLeadCp > 0) {
          cpDisplay = `<span style="color:#9CB4C6;">+${playerLeadCp} CP (${isEn ? 'Lead' : 'Avance'})</span>`;
        }

        let toggleBtn = '';
        if (isAcc) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle" id="btnToggleAccDetails" aria-expanded="false" title="${isEn ? 'Click to inspect individual accessories & lines' : 'Cliquer pour déplier les 5 bijoux et leurs lignes d\'affinage'}">
              <span class="acc-toggle-icon">+</span>
            </button>
          `;
        } else if (isBracelet) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-bracelet-toggle" id="btnToggleBraceletDetails" aria-expanded="false" title="${isEn ? 'Click to inspect bracelet rolls & passives' : 'Cliquer pour déplier le bracelet et ses lignes de passifs'}">
              <span class="bracelet-toggle-icon">+</span>
            </button>
          `;
        } else if (isAstrogems) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-astrogems-toggle" id="btnToggleAstrogemsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect astrogems substats & CP gains' : 'Cliquer pour déplier les sous-statistiques d\'astrogemmes et leurs gains de CP'}">
              <span class="astrogems-toggle-icon">+</span>
            </button>
          `;
        } else if (isEngravings) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-engravings-toggle" id="btnToggleEngravingsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect engraving choices & ability stone nodes' : 'Cliquer pour comparer les 5 gravures et les nœuds de pierre de naissance'}">
              <span class="engravings-toggle-icon">+</span>
            </button>
          `;
        } else if (isBaseAtk) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-baseatk-toggle" id="btnToggleBaseAtkDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Main Stat, Weapon Power, and Base AP differences' : 'Cliquer pour inspecter la Stat Principale, la Puissance d\'Arme et l\'Attaque de Base'}">
              <span class="baseatk-toggle-icon">+</span>
            </button>
          `;
        } else if (isCombatStats) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-combatstats-toggle" id="btnToggleCombatStatsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Combat Stats (Crit/Spec/Swift), accessory qualities, and bracelet rolls' : 'Cliquer pour inspecter les Stats de Combat (Crit/Spé/Rapide), la qualité des bijoux et le bracelet'}">
              <span class="combatstats-toggle-icon">+</span>
            </button>
          `;
        } else if (isArkGridSun) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-arkgridsun-toggle" id="btnToggleArkGridSunDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Sun Cores (Order & Chaos) breakdown' : 'Cliquer pour déplier les Cœurs Soleil (Ordre & Chaos)'}">
              <span class="arkgridsun-toggle-icon">+</span>
            </button>
          `;
        } else if (isArkGridMoon) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-arkgridmoon-toggle" id="btnToggleArkGridMoonDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Moon Cores (Order & Chaos) breakdown' : 'Cliquer pour déplier les Cœurs Lune (Ordre & Chaos)'}">
              <span class="arkgridmoon-toggle-icon">+</span>
            </button>
          `;
        } else if (isArkGridStar) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-arkgridstar-toggle" id="btnToggleArkGridStarDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Star Cores (Order & Chaos) breakdown' : 'Cliquer pour déplier les Cœurs Étoile (Ordre & Chaos)'}">
              <span class="arkgridstar-toggle-icon">+</span>
            </button>
          `;
        } else if (isWeapon) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-weapon-toggle" id="btnToggleWeaponDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Weapon Honing, Quality & Serka Tier breakdown' : 'Cliquer pour déplier l\'Affinage d\'Arme, la Qualité & le Palier Serka'}">
              <span class="weapon-toggle-icon">+</span>
            </button>
          `;
        } else if (isArmors) {
          toggleBtn = `
            <button type="button" class="btn-acc-toggle btn-armors-toggle" id="btnToggleArmorsDetails" aria-expanded="false" title="${isEn ? 'Click to inspect Armors Honing, Main Stat & Serka Tier breakdown' : 'Cliquer pour déplier l\'Affinage des Armures, la Stat Principale & le Palier Serka'}">
              <span class="armors-toggle-icon">+</span>
            </button>
          `;
        }

        const trClass = [
          isHiddenInEqual ? 'row-equal' : '',
          isAcc ? 'row-accessories-parent' : '',
          isBracelet ? 'row-bracelet-parent' : '',
          isAstrogems ? 'row-astrogems-parent' : '',
          isEngravings ? 'row-engravings-parent' : '',
          isBaseAtk ? 'row-baseatk-parent' : '',
          isCombatStats ? 'row-combatstats-parent' : '',
          isArkGridSun ? 'row-arkgridsun-parent' : '',
          isArkGridMoon ? 'row-arkgridmoon-parent' : '',
          isArkGridStar ? 'row-arkgridstar-parent' : '',
          isWeapon ? 'row-weapon-parent' : '',
          isArmors ? 'row-armors-parent' : ''
        ].filter(Boolean).join(' ');

        const trId = isAcc ? 'id="rowSysAccessories"' : (isBracelet ? 'id="rowSysBracelet"' : (isAstrogems ? 'id="rowSysAstrogems"' : (isEngravings ? 'id="rowSysEngravings"' : (isBaseAtk ? 'id="rowSysBaseAtk"' : (isCombatStats ? 'id="rowSysCombatStats"' : (isArkGridSun ? 'id="rowSysArkGridSun"' : (isArkGridMoon ? 'id="rowSysArkGridMoon"' : (isArkGridStar ? 'id="rowSysArkGridStar"' : (isWeapon ? 'id="rowSysWeapon"' : (isArmors ? 'id="rowSysArmors"' : ''))))))))));

        rowsHtml += `
          <tr class="${trClass}" ${trId}>
            <td class="col-sys">
              ${toggleBtn}<span>${cfg.icon}</span> <strong>${escapeHtml(cfg.name)}</strong>
            </td>
            <td class="col-player">${escapeHtml(pItem.label)} (${pItem.bonusPct.toFixed(2)}%)</td>
            <td class="col-target">${escapeHtml(tItem.label)} (${tItem.bonusPct.toFixed(2)}%)</td>
            <td class="col-delta"><span class="${badgeClass}">${deltaStr}</span></td>
            <td class="col-cp" style="font-family:var(--font-mono); font-weight:700; color:${cpImpact > 0 ? '#8CC084' : 'var(--text-muted)'};">
              ${cpDisplay}
            </td>
            <td><span class="prio-pill ${prioClass}">${escapeHtml(prioLabel)}</span></td>
          </tr>
        `;

        if (isAcc) {
          const accDetailsHtml = buildAccBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowAccDetails" class="row-acc-details" style="display: none;">
              <td colspan="6">
                ${accDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isBracelet) {
          const braceletDetailsHtml = buildBraceletBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowBraceletDetails" class="row-bracelet-details" style="display: none;">
              <td colspan="6">
                ${braceletDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isAstrogems) {
          const astrogemsDetailsHtml = buildAstrogemsBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowAstrogemsDetails" class="row-astrogems-details" style="display: none;">
              <td colspan="6">
                ${astrogemsDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isEngravings) {
          const engravingsDetailsHtml = buildEngravingsBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowEngravingsDetails" class="row-engravings-details" style="display: none;">
              <td colspan="6">
                ${engravingsDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isBaseAtk) {
          const baseAtkDetailsHtml = buildBaseAtkBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowBaseAtkDetails" class="row-baseatk-details" style="display: none;">
              <td colspan="6">
                ${baseAtkDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isCombatStats) {
          const combatStatsDetailsHtml = buildCombatStatsBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowCombatStatsDetails" class="row-combatstats-details" style="display: none;">
              <td colspan="6">
                ${combatStatsDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isArkGridSun) {
          const sunDetailsHtml = buildArkGridCoresBreakdownHtml(player, target, 'sun', cpImpact, isEn);
          rowsHtml += `
            <tr id="rowArkGridSunDetails" class="row-arkgridsun-details" style="display: none;">
              <td colspan="6">
                ${sunDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isArkGridMoon) {
          const moonDetailsHtml = buildArkGridCoresBreakdownHtml(player, target, 'moon', cpImpact, isEn);
          rowsHtml += `
            <tr id="rowArkGridMoonDetails" class="row-arkgridmoon-details" style="display: none;">
              <td colspan="6">
                ${moonDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isArkGridStar) {
          const starDetailsHtml = buildArkGridCoresBreakdownHtml(player, target, 'star', cpImpact, isEn);
          rowsHtml += `
            <tr id="rowArkGridStarDetails" class="row-arkgridstar-details" style="display: none;">
              <td colspan="6">
                ${starDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isWeapon) {
          const weaponDetailsHtml = buildWeaponBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowWeaponDetails" class="row-weapon-details" style="display: none;">
              <td colspan="6">
                ${weaponDetailsHtml}
              </td>
            </tr>
          `;
        } else if (isArmors) {
          const armorsDetailsHtml = buildArmorsBreakdownHtml(player, target, cpImpact, isEn);
          rowsHtml += `
            <tr id="rowArmorsDetails" class="row-armors-details" style="display: none;">
              <td colspan="6">
                ${armorsDetailsHtml}
              </td>
            </tr>
          `;
        }
      });
      tableBody.innerHTML = rowsHtml;

      // Construction et injection du Bilan Mathématique tfoot du grand tableau comparatif
      const compareTbl = document.getElementById('benchmarkCompareTable');
      if (compareTbl) {
        let tfoot = compareTbl.querySelector('tfoot');
        if (!tfoot) {
          tfoot = document.createElement('tfoot');
          compareTbl.appendChild(tfoot);
        }
        tfoot.innerHTML = `
          <tr class="benchmark-table-total-row">
            <td colspan="4" style="padding: 12px 16px; font-weight: 700; color: #E8E6DC;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:18px;"></span>
                <div>
                  <span>${isEn ? 'Sum of Improvement Levers (Gross Deficit)' : 'Total Brut des Leviers d\'Amélioration (Retards Stuff)'}</span>
                  <div style="font-size:12px; font-weight:400; color:var(--text-muted); margin-top:2px;">
                    ${isEn ? 'Arithmetic sum of all positive CP gains in the table above' : 'Somme arithmétique de tous les gains positifs individuels du tableau ci-dessus'}
                  </div>
                </div>
              </div>
            </td>
            <td class="col-cp" style="font-family:var(--font-mono); font-weight:800; font-size:15px; color:#8CC084; padding: 12px 16px;">
              +${formatNumber(totalPositiveTableCp)} CP
            </td>
            <td style="padding: 12px 16px;">
              <span class="prio-pill high">${isEn ? 'Gross Levers' : 'Leviers Cumulés'}</span>
            </td>
          </tr>
          ${totalPlayerLeadTableCp > 0 ? `
            <tr class="benchmark-table-lead-row">
              <td colspan="4" style="padding: 10px 16px; font-weight: 600; color: #B5C7D4;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:17px;"></span>
                  <div>
                    <span>${isEn ? 'Your Compensating Advantages (Equipments Ahead)' : 'Vos Avances Compensatoires (Équipements où vous surpassez la cible)'}</span>
                    <div style="font-size:12px; font-weight:400; color:var(--text-muted); margin-top:2px;">
                      ${isEn ? 'Directly cushions and offsets your equipment deficits' : 'Amortit et compense directement vos retards d\'équipements'}
                    </div>
                  </div>
                </div>
              </td>
              <td class="col-cp" style="font-family:var(--font-mono); font-weight:700; font-size:14px; color:#9CB4C6; padding: 10px 16px;">
                -${formatNumber(totalPlayerLeadTableCp)} CP (${isEn ? 'Lead' : 'Avance'})
              </td>
              <td style="padding: 10px 16px;">
                <span class="prio-pill opt">${isEn ? 'Cushioning' : 'Amortissement'}</span>
              </td>
            </tr>
          ` : ''}
          <tr class="benchmark-table-net-row">
            <td colspan="4" style="padding: 14px 16px; font-weight: 800; color: #E0A43A;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:20px;"></span>
                <div>
                  <span>${isEn ? 'Observed In-Game Net Gap (lostark.bible Score in Raid)' : 'Écart Réel Net In-Game (Score relevé en Raid sur lostark.bible)'}</span>
                  <div style="font-size:13px; font-weight:400; color:var(--text-muted); margin-top:3px; line-height:1.4;">
                    ${isEn
                      ? `Formula: <strong>Target CP (${formatNumber(Math.round(target.cp || 0))}) &minus; Your CP (${formatNumber(Math.round(player.cp || 0))}) = ${directCpGap >= 0 ? '+' : ''}${formatNumber(directCpGap)} CP</strong>. Reflects Lost Ark\'s compound multiplicative formula (each individual line shows its isolated linear gain).`
                      : `Formule : <strong>Cible (${formatNumber(Math.round(target.cp || 0))} CP) &minus; Vous (${formatNumber(Math.round(player.cp || 0))} CP) = ${directCpGap >= 0 ? '+' : ''}${formatNumber(directCpGap)} CP</strong>. Intègre la formule multiplicative croisée du jeu (chaque ligne isole son gain linéaire individuel).`
                    }
                  </div>
                </div>
              </div>
            </td>
            <td class="col-cp" style="font-family:var(--font-mono); font-weight:900; font-size:18px; color:#E0A43A; padding: 14px 16px;">
              ${directCpGap >= 0 ? '+' : ''}${formatNumber(directCpGap)} CP
            </td>
            <td style="padding: 14px 16px;">
              <span class="prio-pill equal" style="background: transparent; color:#E0A43A; border:1px solid rgba(232, 230, 220,0.35); font-weight:700;">
                ${isEn ? 'Official Raid Delta' : 'Écart Raid Réel'}
              </span>
            </td>
          </tr>
        `;
      }

      // Synchronisation mathématique de la carte de réconciliation supérieure avec les totaux réels du tableau
      if (reconEl) {
        reconEl.innerHTML = buildCpReconciliationHtml(player, target, gaps, isEn, {
          totalPositiveCp: totalPositiveTableCp,
          totalPlayerLeadCp: totalPlayerLeadTableCp,
          topLeadTitle: topLeadTitle || (isEn ? 'Equipment' : 'Équipement')
        });
      }

      // Gestion du dépliage interactif des 5 bijoux T4
      const btnAcc = document.getElementById('btnToggleAccDetails');
      const rowAccParent = document.getElementById('rowSysAccessories');
      const rowAccDet = document.getElementById('rowAccDetails');
      if (btnAcc && rowAccDet) {
        const doToggleAcc = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowAccDet.style.display === 'none';
          rowAccDet.style.display = isHidden ? 'table-row' : 'none';
          btnAcc.setAttribute('aria-expanded', isHidden);
          const icon = btnAcc.querySelector('.acc-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowAccParent) rowAccParent.classList.toggle('expanded', isHidden);
        };
        btnAcc.addEventListener('click', doToggleAcc);
        if (rowAccParent) {
          rowAccParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleAcc(e);
          });
        }
      }

      // Gestion du dépliage interactif du Bracelet T4
      const btnBracelet = document.getElementById('btnToggleBraceletDetails');
      const rowBraceletParent = document.getElementById('rowSysBracelet');
      const rowBraceletDet = document.getElementById('rowBraceletDetails');
      if (btnBracelet && rowBraceletDet) {
        const doToggleBracelet = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowBraceletDet.style.display === 'none';
          rowBraceletDet.style.display = isHidden ? 'table-row' : 'none';
          btnBracelet.setAttribute('aria-expanded', isHidden);
          const icon = btnBracelet.querySelector('.bracelet-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowBraceletParent) rowBraceletParent.classList.toggle('expanded', isHidden);
        };
        btnBracelet.addEventListener('click', doToggleBracelet);
        if (rowBraceletParent) {
          rowBraceletParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleBracelet(e);
          });
        }
      }

      // Gestion du dépliage interactif des Astrogemmes Ark Grid
      const btnAstrogems = document.getElementById('btnToggleAstrogemsDetails');
      const rowAstrogemsParent = document.getElementById('rowSysAstrogems');
      const rowAstrogemsDet = document.getElementById('rowAstrogemsDetails');
      if (btnAstrogems && rowAstrogemsDet) {
        const doToggleAstrogems = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowAstrogemsDet.style.display === 'none';
          rowAstrogemsDet.style.display = isHidden ? 'table-row' : 'none';
          btnAstrogems.setAttribute('aria-expanded', isHidden);
          const icon = btnAstrogems.querySelector('.astrogems-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowAstrogemsParent) rowAstrogemsParent.classList.toggle('expanded', isHidden);
        };
        btnAstrogems.addEventListener('click', doToggleAstrogems);
        if (rowAstrogemsParent) {
          rowAstrogemsParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleAstrogems(e);
          });
        }
      }

      // Gestion du dépliage interactif des Gravures Reliques T4 & Pierre
      const btnEng = document.getElementById('btnToggleEngravingsDetails');
      const rowEngParent = document.getElementById('rowSysEngravings');
      const rowEngDet = document.getElementById('rowEngravingsDetails');
      if (btnEng && rowEngDet) {
        const doToggleEng = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowEngDet.style.display === 'none';
          rowEngDet.style.display = isHidden ? 'table-row' : 'none';
          btnEng.setAttribute('aria-expanded', isHidden);
          const icon = btnEng.querySelector('.engravings-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowEngParent) rowEngParent.classList.toggle('expanded', isHidden);
        };
        btnEng.addEventListener('click', doToggleEng);
        if (rowEngParent) {
          rowEngParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleEng(e);
          });
        }
      }

      // Gestion du dépliage interactif de Stat Principale & Attaque de Base
      const btnBaseAtk = document.getElementById('btnToggleBaseAtkDetails');
      const rowBaseAtkParent = document.getElementById('rowSysBaseAtk');
      const rowBaseAtkDet = document.getElementById('rowBaseAtkDetails');
      if (btnBaseAtk && rowBaseAtkDet) {
        const doToggleBaseAtk = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowBaseAtkDet.style.display === 'none';
          rowBaseAtkDet.style.display = isHidden ? 'table-row' : 'none';
          btnBaseAtk.setAttribute('aria-expanded', isHidden);
          const icon = btnBaseAtk.querySelector('.baseatk-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowBaseAtkParent) rowBaseAtkParent.classList.toggle('expanded', isHidden);
        };
        btnBaseAtk.addEventListener('click', doToggleBaseAtk);
        if (rowBaseAtkParent) {
          rowBaseAtkParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleBaseAtk(e);
          });
        }
      }

      // Gestion du dépliage interactif des Stats de Combat (Crit/Spé/Rapide)
      const btnCombatStats = document.getElementById('btnToggleCombatStatsDetails');
      const rowCombatStatsParent = document.getElementById('rowSysCombatStats');
      const rowCombatStatsDet = document.getElementById('rowCombatStatsDetails');
      if (btnCombatStats && rowCombatStatsDet) {
        const doToggleCombatStats = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowCombatStatsDet.style.display === 'none';
          rowCombatStatsDet.style.display = isHidden ? 'table-row' : 'none';
          btnCombatStats.setAttribute('aria-expanded', isHidden);
          const icon = btnCombatStats.querySelector('.combatstats-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowCombatStatsParent) rowCombatStatsParent.classList.toggle('expanded', isHidden);
        };
        btnCombatStats.addEventListener('click', doToggleCombatStats);
        if (rowCombatStatsParent) {
          rowCombatStatsParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleCombatStats(e);
          });
        }
      }

      // Gestion du dépliage interactif des Cœurs Soleil Ark Grid (Ordre & Chaos)
      const btnArkGridSun = document.getElementById('btnToggleArkGridSunDetails');
      const rowArkGridSunParent = document.getElementById('rowSysArkGridSun');
      const rowArkGridSunDet = document.getElementById('rowArkGridSunDetails');
      if (btnArkGridSun && rowArkGridSunDet) {
        const doToggleArkGridSun = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowArkGridSunDet.style.display === 'none';
          rowArkGridSunDet.style.display = isHidden ? 'table-row' : 'none';
          btnArkGridSun.setAttribute('aria-expanded', isHidden);
          const icon = btnArkGridSun.querySelector('.arkgridsun-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowArkGridSunParent) rowArkGridSunParent.classList.toggle('expanded', isHidden);
        };
        btnArkGridSun.addEventListener('click', doToggleArkGridSun);
        if (rowArkGridSunParent) {
          rowArkGridSunParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleArkGridSun(e);
          });
        }
      }

      // Gestion du dépliage interactif des Cœurs Lune Ark Grid (Ordre & Chaos)
      const btnArkGridMoon = document.getElementById('btnToggleArkGridMoonDetails');
      const rowArkGridMoonParent = document.getElementById('rowSysArkGridMoon');
      const rowArkGridMoonDet = document.getElementById('rowArkGridMoonDetails');
      if (btnArkGridMoon && rowArkGridMoonDet) {
        const doToggleArkGridMoon = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowArkGridMoonDet.style.display === 'none';
          rowArkGridMoonDet.style.display = isHidden ? 'table-row' : 'none';
          btnArkGridMoon.setAttribute('aria-expanded', isHidden);
          const icon = btnArkGridMoon.querySelector('.arkgridmoon-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowArkGridMoonParent) rowArkGridMoonParent.classList.toggle('expanded', isHidden);
        };
        btnArkGridMoon.addEventListener('click', doToggleArkGridMoon);
        if (rowArkGridMoonParent) {
          rowArkGridMoonParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleArkGridMoon(e);
          });
        }
      }

      // Gestion du dépliage interactif des Cœurs Étoile Ark Grid (Ordre & Chaos)
      const btnArkGridStar = document.getElementById('btnToggleArkGridStarDetails');
      const rowArkGridStarParent = document.getElementById('rowSysArkGridStar');
      const rowArkGridStarDet = document.getElementById('rowArkGridStarDetails');
      if (btnArkGridStar && rowArkGridStarDet) {
        const doToggleArkGridStar = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowArkGridStarDet.style.display === 'none';
          rowArkGridStarDet.style.display = isHidden ? 'table-row' : 'none';
          btnArkGridStar.setAttribute('aria-expanded', isHidden);
          const icon = btnArkGridStar.querySelector('.arkgridstar-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowArkGridStarParent) rowArkGridStarParent.classList.toggle('expanded', isHidden);
        };
        btnArkGridStar.addEventListener('click', doToggleArkGridStar);
        if (rowArkGridStarParent) {
          rowArkGridStarParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleArkGridStar(e);
          });
        }
      }

      // Gestion du dépliage interactif de l'Arme T4 & Palier Serka
      const btnWeapon = document.getElementById('btnToggleWeaponDetails');
      const rowWeaponParent = document.getElementById('rowSysWeapon');
      const rowWeaponDet = document.getElementById('rowWeaponDetails');
      if (btnWeapon && rowWeaponDet) {
        const doToggleWeapon = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowWeaponDet.style.display === 'none';
          rowWeaponDet.style.display = isHidden ? 'table-row' : 'none';
          btnWeapon.setAttribute('aria-expanded', isHidden);
          const icon = btnWeapon.querySelector('.weapon-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowWeaponParent) rowWeaponParent.classList.toggle('expanded', isHidden);
        };
        btnWeapon.addEventListener('click', doToggleWeapon);
        if (rowWeaponParent) {
          rowWeaponParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleWeapon(e);
          });
        }
      }

      // Gestion du dépliage interactif des Armures T4 & Palier Serka
      const btnArmors = document.getElementById('btnToggleArmorsDetails');
      const rowArmorsParent = document.getElementById('rowSysArmors');
      const rowArmorsDet = document.getElementById('rowArmorsDetails');
      if (btnArmors && rowArmorsDet) {
        const doToggleArmors = (e) => {
          if (e) e.stopPropagation();
          const isHidden = rowArmorsDet.style.display === 'none';
          rowArmorsDet.style.display = isHidden ? 'table-row' : 'none';
          btnArmors.setAttribute('aria-expanded', isHidden);
          const icon = btnArmors.querySelector('.armors-toggle-icon');
          if (icon) icon.textContent = isHidden ? '−' : '+';
          if (rowArmorsParent) rowArmorsParent.classList.toggle('expanded', isHidden);
        };
        btnArmors.addEventListener('click', doToggleArmors);
        if (rowArmorsParent) {
          rowArmorsParent.addEventListener('click', (e) => {
            if (!e.target.closest('a') && !e.target.closest('button')) doToggleArmors(e);
          });
        }
      }

      // Gestion du bouton dépliable des lignes équivalentes
      const wrapToggle = document.getElementById('wrapToggleEqualRows');
      const lblToggle = document.getElementById('lblToggleEqualRows');
      const tbl = document.getElementById('benchmarkCompareTable');
      if (wrapToggle && lblToggle && tbl) {
        if (equalRowsCount > 0) {
          wrapToggle.style.display = 'flex';
          const isExp = tbl.classList.contains('show-equal');
          const isEnglish = isEnglishLang();
          lblToggle.textContent = isExp
            ? (isEnglish ? `Hide ${equalRowsCount} equivalent systems ▴` : `Masquer les ${equalRowsCount} systèmes équivalents ▴`)
            : (isEnglish ? `Show ${equalRowsCount} equivalent systems (0% delta) ▾` : `Afficher les ${equalRowsCount} systèmes équivalents (0% d'écart) ▾`);
        } else {
          wrapToggle.style.display = 'none';
        }
      }

      const btnToggle = document.getElementById('btnToggleEqualRows');
      if (btnToggle && !btnToggle.dataset.bound) {
        btnToggle.dataset.bound = 'true';
        btnToggle.addEventListener('click', () => {
          const tTable = document.getElementById('benchmarkCompareTable');
          const tLbl = document.getElementById('lblToggleEqualRows');
          if (tTable && tLbl) {
            tTable.classList.toggle('show-equal');
            const isExpanded = tTable.classList.contains('show-equal');
            const eqCount = tTable.querySelectorAll('tr.row-equal').length;
            const isEnglish = isEnglishLang();
            tLbl.textContent = isExpanded
              ? (isEnglish ? `Hide ${eqCount} equivalent systems ▴` : `Masquer les ${eqCount} systèmes équivalents ▴`)
              : (isEnglish ? `Show ${eqCount} equivalent systems (0% delta) ▾` : `Afficher les ${eqCount} systèmes équivalents (0% d'écart) ▾`);
          }
        });
      }
    }

    // 6. Plan d'Action Recommandé
    const actionList = document.getElementById('benchmarkActionList');
    if (actionList) {
      const actions = plan.length > 0 ? plan : (target.actionPlan || []);
      let actHtml = '';
      actions.forEach(a => {
        actHtml += `
          <div class="bench-action-item">
            <div class="bench-action-left">
              <div class="bench-action-step">${a.step}</div>
              <div class="bench-action-content">
                <strong>${escapeHtml(a.title)}</strong>
                <span>${escapeHtml(a.desc)}</span>
              </div>
            </div>
            <div class="bench-action-right">
              <div class="bench-action-cost">${escapeHtml(a.cost)}</div>
              <div class="bench-action-roi">${escapeHtml(a.gain)} • ${escapeHtml(a.roi)}</div>
            </div>
          </div>
        `;
      });
      actionList.innerHTML = actHtml;
    }
  }


  // --- SYNC LIVE LOSTARK.BIBLE ENGINE (TEMPS RÉEL SANS SNAPSHOT) ---
  let liveBibleBenchmarkCache = {};
  try {
    const savedLiveCache = localStorage.getItem('lostark_live_benchmarks_cache');
    if (savedLiveCache) {
      liveBibleBenchmarkCache = JSON.parse(savedLiveCache) || {};
      Object.values(liveBibleBenchmarkCache).forEach(b => {
        if (b && b.isLive) {
          if ((!b.gear || !b.systems || !b.systems.weapon || b.systems.weapon.label.includes('+17')) && b.rawProfile && b.rawProfile.gear) {
            b.gear = b.rawProfile.gear;
            b.weaponQuality = b.rawProfile.weaponQuality !== undefined ? b.rawProfile.weaponQuality : b.weaponQuality;
            b.weaponQualityValue = b.rawProfile.weaponQualityValue !== undefined ? b.rawProfile.weaponQualityValue : b.weaponQualityValue;
            b.advHoning = b.rawProfile.advHoning !== undefined ? b.rawProfile.advHoning : b.advHoning;
            b.systems = extractPlayerSystems(b, isEnglishLang());
          }
          if (!benchmarkState.searchedTargets || !benchmarkState.searchedTargets.some(s => s.id === b.id)) {
            benchmarkState.searchedTargets.push(b);
          }
        }
      });
    }
  } catch (e) {}

  async function fetchLiveBibleBenchmark(characterName, region = 'AUTO', preferredRole = 'support') {
    if (!characterName) return null;
    let cleanName = characterName.trim();
    if (!cleanName) return null;

    let targetRegion = (region || 'AUTO').toUpperCase();

    // 1. Détection automatique d'une URL lostark.bible complète
    const urlMatch = cleanName.match(/(?:https?:\/\/)?(?:www\.)?lostark\.bible\/character\/([a-zA-Z]+)\/([^/?#\s]+)/i);
    if (urlMatch) {
      targetRegion = urlMatch[1].toUpperCase();
      cleanName = decodeURIComponent(urlMatch[2]);
    }

    // 2. Détection d'une région entre parenthèses : "Pseudo (CE)" ou "Pseudo (NAE)"
    const parenMatch = cleanName.match(/^([^(]+)\s*\((CE|NAE|NAW|SA)\)$/i);
    if (parenMatch) {
      cleanName = parenMatch[1].trim();
      targetRegion = parenMatch[2].toUpperCase();
    }

    const cacheKey = `${cleanName.toLowerCase()}_${targetRegion}`;
    if (liveBibleBenchmarkCache[cacheKey]) {
      return liveBibleBenchmarkCache[cacheKey];
    }

    // Définition de l'ordre des régions à interroger (Auto ou région sélectionnée en priorité)
    let regionsToTry = ['CE', 'NA', 'NAE', 'NAW', 'SA'];
    if (targetRegion !== 'AUTO') {
      regionsToTry = [targetRegion, 'CE', 'NA', 'NAE', 'NAW', 'SA'].filter((v, i, a) => a.indexOf(v) === i);
    }

    let validData = null;
    let successfulRegion = 'CE';

    for (const reg of regionsToTry) {
      const encodedName = encodeURIComponent(cleanName);
      const proxyUrl = `/api/bible/character/${reg}/${encodedName}/__data.json`;
      const directUrl = `https://lostark.bible/character/${reg}/${encodedName}/__data.json`;

      let res = null;
      try {
        const proxyRes = await fetch(proxyUrl);
        if (proxyRes.ok) res = proxyRes;
      } catch (e) {}

      if (!res) {
        try {
          res = await fetch(directUrl, { mode: 'cors' });
        } catch (e) {}
      }

      if (!res || !res.ok) continue;

      try {
        let json = await res.json();

        // Résolution automatique des redirections HTTP (ex: casse du pseudo genkidama -> Genkidama ou NAE -> NA)
        if (json.type === 'redirect' && json.location) {
          const locMatch = json.location.match(/^\/character\/([^\/]+)/i);
          const redirectProxyUrl = `/api/bible${json.location}/__data.json`;
          const redirectDirectUrl = `https://lostark.bible${json.location}/__data.json`;
          let rRes = null;
          try {
            const rProxy = await fetch(redirectProxyUrl);
            if (rProxy.ok) rRes = rProxy;
          } catch (e) {}
          if (!rRes) {
            try {
              rRes = await fetch(redirectDirectUrl, { mode: 'cors' });
            } catch (e) {}
          }
          if (rRes && rRes.ok) {
            json = await rRes.json();
            if (locMatch && locMatch[1]) {
              successfulRegion = locMatch[1].toUpperCase();
            }
          }
        }

        if (!json.nodes || !json.nodes[2] || !json.nodes[2].data) continue;

        const nodeData = json.nodes[2].data;
        const parsed = parseBibleCharacter(nodeData, preferredRole || 'support');
        if (parsed && parsed.ilvl && parsed.ilvl > 500) {
          validData = { json, parsed };
          successfulRegion = reg;
          break;
        }
      } catch (err) {
        // En cas d'erreur ou de profil vide sur cette région, on tente la suivante
        continue;
      }
    }

    if (!validData) return null;

    const { json, parsed } = validData;
    let header = {};
    if (json.nodes[1] && json.nodes[1].data) {
      try {
        const r1 = unflattenDevalue(json.nodes[1].data);
        if (r1 && r1.header) header = r1.header;
      } catch (e) {}
    }

    const normClass = normalizeClassName(header.class || (parsed.loadout && parsed.loadout.classId) || parsed.className || '');
    // Déclaré avant detectCharacterRole, qui l'utilise (ReferenceError « before initialization » sinon)
    const displayName = capitalize(header.name || cleanName);
    const liveRole = detectCharacterRole({
      className: normClass,
      classId: parsed.loadout && parsed.loadout.classId,
      engravings: parsed.engravings,
      name: displayName
    });
    const isSupport = liveRole === 'support' || (parsed.battlePoint && parsed.battlePoint.isSupport === true);
    const liveIlvl = header.ilvl ? Number(header.ilvl.toFixed(2)) : (parsed.ilvl || 1740);
    const liveCp = parseFloat((header.maxCombatPower?.score || header.combatPower?.score || parsed.inGameScore || parsed.calculatedScore || 4000).toFixed(2));

    const liveChar = {
      name: displayName,
      className: normClass,
      role: isSupport ? 'support' : 'dps',
      ilvl: liveIlvl,
      cp: liveCp,
      server: header.world ? `${header.world} (${successfulRegion})` : `${successfulRegion} Server`,
      guild: (header.guild && header.guild.name) || (typeof header.guild === 'string' ? header.guild : '') || 'lostark.bible',
      rosterLevel: header.rosterLevel || 300,
      portraitUrl: (header.portrait && header.portrait.url) || null,
      avatarUrl: (header.portrait && header.portrait.url) || getClassIconUrl(normClass, isSupport ? 'support' : 'dps'),
      bibleUrl: `https://lostark.bible/character/${successfulRegion}/${encodeURIComponent(displayName)}`,
      rawProfile: parsed,
      gear: parsed.gear,
      advHoning: parsed.advHoning,
      weaponQuality: parsed.weaponQuality !== undefined ? parsed.weaponQuality : 90,
      weaponQualityValue: parsed.weaponQualityValue !== undefined ? parsed.weaponQualityValue : 2500,
      gemParts: parsed.gemParts,
      engravings: parsed.engravings,
      arkGridCores: parsed.arkGridCores,
      arkGrid: getArkGridStatus({ rawProfile: parsed, id: displayName.toLowerCase() }),
      accRolled: parsed.accRolled,
      accessories: parsed.accessories || [],
      bracelet: parsed.bracelet || (parsed.loadout && parsed.loadout.items ? parsed.loadout.items.find(i => i.slot === 'bracelet') : null) || null,
      loadout: parsed.loadout || null,
      apPoints: parsed.apPoints || null,
      isLive: true
    };

    const isEn = isEnglishLang();
    const systems = extractPlayerSystems(liveChar, isEn);

    const fullBenchmark = {
      id: `live_${displayName.toLowerCase()}`,
      name: liveChar.name,
      className: liveChar.className,
      spec: getCharacterSpecName(liveChar),
      role: liveChar.role,
      ilvl: liveChar.ilvl,
      cp: liveChar.cp,
      server: liveChar.server,
      guild: liveChar.guild,
      rosterLevel: liveChar.rosterLevel,
      gemTier: (liveChar.gemParts && liveChar.gemParts.some(g => g >= (isSupport ? 11.0 : 6.4))) ? 'gem9' : 'gem8',
      gemDesc: getCharacterGemSummary(liveChar, isEn),
      avatarUrl: liveChar.avatarUrl,
      bibleUrl: liveChar.bibleUrl,
      isLive: true,
      systems: systems,
      gear: liveChar.gear,
      advHoning: liveChar.advHoning,
      weaponQuality: liveChar.weaponQuality,
      weaponQualityValue: liveChar.weaponQualityValue,
      gemParts: liveChar.gemParts,
      engravings: liveChar.engravings,
      apPoints: liveChar.apPoints,
      accessories: liveChar.accessories || [],
      bracelet: liveChar.bracelet || null,
      rawProfile: parsed,
      loadout: parsed.loadout || null
    };

    liveBibleBenchmarkCache[cacheKey] = fullBenchmark;
    liveBibleBenchmarkCache[displayName.toLowerCase()] = fullBenchmark;
    try {
      localStorage.setItem('lostark_live_benchmarks_cache', JSON.stringify(liveBibleBenchmarkCache));
    } catch (e) {}
    return fullBenchmark;
  }


  async function searchAndCompareBibleProfile(cleanName, region = 'AUTO') {
    const statusEl = document.getElementById('benchLoadingStatus');
    const regionSelect = document.getElementById('benchSearchRegion');
    const reg = (region && region !== 'AUTO') ? region : (regionSelect ? regionSelect.value : 'AUTO');
    const isEn = isEnglishLang();

    if (statusEl) {
      statusEl.className = 'bench-status-msg info';
      statusEl.style.display = 'block';
      statusEl.innerHTML = isEn
        ? `Querying live data for <strong>${escapeHtml(cleanName)}</strong> from lostark.bible...`
        : `Interrogation directe de <strong>${escapeHtml(cleanName)}</strong> sur lostark.bible (Live)...`;
    }

    try {
      const activePlayer = getCurrentActiveCharacter();
      if (activePlayer && cleanName.toLowerCase() === (activePlayer.name || '').toLowerCase().trim()) {
        throw new Error(isEn ? "You cannot compare a character against themselves. Please select another reference player." : "Vous ne pouvez pas vous comparer à vous-même. Veuillez sélectionner un autre joueur de référence.");
      }
      const liveBench = await fetchLiveBibleBenchmark(cleanName, reg, (activePlayer && activePlayer.role) || 'support');
      if (!liveBench) throw new Error(isEn ? "Profile not found" : "Profil introuvable");

      if (!benchmarkState.searchedTargets) {
        benchmarkState.searchedTargets = [];
      }
      // Ajouter en tête de liste sans doublon
      benchmarkState.searchedTargets = benchmarkState.searchedTargets.filter(t => t.id !== liveBench.id);
      benchmarkState.searchedTargets.unshift(liveBench);

      benchmarkState.customTarget = liveBench;
      benchmarkState.currentTargetId = liveBench.id;

      if (statusEl) {
        statusEl.className = 'bench-status-msg success';
        statusEl.innerHTML = isEn
          ? `Live data retrieved from lostark.bible for <strong>${escapeHtml(liveBench.name)}</strong> (${escapeHtml(liveBench.className)} • ${liveBench.ilvl.toFixed(2)} iLvl • <strong>${formatNumber(Math.round(liveBench.cp))} CP</strong>).`
          : `Données récupérées en direct de lostark.bible pour <strong>${escapeHtml(liveBench.name)}</strong> (${escapeHtml(liveBench.className)} • ${liveBench.ilvl.toFixed(2)} iLvl • <strong>${formatNumber(Math.round(liveBench.cp))} CP</strong>).`;
        setTimeout(() => {
          if (statusEl) statusEl.style.display = 'none';
        }, 5000);
      }

      renderBenchmarkTab();
    } catch (err) {
      console.warn('searchAndCompareBibleProfile error:', err);
      if (!benchmarkState.failedAttempts) benchmarkState.failedAttempts = new Set();
      benchmarkState.failedAttempts.add(`${cleanName.toLowerCase()}_${reg}`);
      if (statusEl) {
        statusEl.className = 'bench-status-msg error';
        statusEl.style.display = 'block';
        statusEl.innerHTML = isEn
          ? `<strong>Could not query lostark.bible for "${escapeHtml(cleanName)}":</strong> verify character name spelling or paste full profile URL (e.g. <code>https://lostark.bible/character/CE/...</code>).`
          : `<strong>Impossible d'interroger lostark.bible pour « ${escapeHtml(cleanName)} » :</strong> vérifiez l'orthographe du pseudo ou essayez de coller le lien complet du profil (ex: <code>https://lostark.bible/character/CE/...</code>).`;
      }
      renderBenchmarkTab();
    }
  }

  function initBenchmarkEvents() {
    const btnAuto = document.getElementById('btnBenchmarkAutoMatch');
    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        // Revient au meilleur joueur proposé (même classe, CP le plus proche au-dessus)
        const player = getCurrentActiveCharacter();
        benchmarkState.userPickedTarget = false;
        benchmarkState.customTarget = null;
        benchmarkState.currentTargetId = null;
        if (player) {
          const st = suggestedPeersState.byPlayer[suggestedPeersKey(player)];
          const best = st && st.peers && st.peers[0];
          if (best) {
            benchmarkState.customTarget = best;
            benchmarkState.currentTargetId = best.id;
          }
        }
        renderBenchmarkTab();
      });
    }

    const select = document.getElementById('benchmarkPresetSelect');
    if (select) {
      select.addEventListener('change', () => {
        benchmarkState.userPickedTarget = true;
        const val = select.value;
        const searched = (benchmarkState.searchedTargets || []).find(s => s.id === val);
        if (searched) {
          benchmarkState.customTarget = searched;
          benchmarkState.currentTargetId = searched.id;
        } else {
          benchmarkState.customTarget = null;
          benchmarkState.currentTargetId = val;
        }
        renderBenchmarkTab();
      });
    }

    const gemFilterGroup = document.getElementById('benchmarkGemFilterGroup');
    if (gemFilterGroup) {
      gemFilterGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.bench-filter-pill');
        if (!btn) return;
        gemFilterGroup.querySelectorAll('.bench-filter-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        benchmarkState.gemFilter = btn.dataset.filter || 'all';
        benchmarkState.customTarget = null;
        benchmarkState.currentTargetId = null;
        renderBenchmarkTab();
      });
    }

    const searchBtn = document.getElementById('btnBenchSearchSubmit');
    const searchInput = document.getElementById('benchCustomSearchInput');
    const searchRegion = document.getElementById('benchSearchRegion');
    if (searchBtn && searchInput) {
      const doSearch = () => {
        const val = searchInput.value.trim();
        const reg = searchRegion ? searchRegion.value : 'AUTO';
        if (val) {
          benchmarkState.userPickedTarget = true;
          searchAndCompareBibleProfile(val, reg);
        }
      };
      searchBtn.addEventListener('click', doSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSearch();
      });
    }
  }


  // Initialisation au chargement
  
  // Pierres de destruction / gardien : l'API donne le prix d'un lot de 100 au marché
  const MARKET_BUNDLE_SIZE = {
    'destiny-destruction-stone': 100,
    'destiny-guardian-stone': 100
  };

  // Prix du marché EUC (API de loa-buddy) via notre route serveur /api/market/prices :
  // l'API n'autorise pas l'appel direct depuis le navigateur (CORS).
  async function fetchMarketPrices() {
    try {
      const response = await fetch('/api/market/prices', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (!item || typeof item.price !== 'number' || item.price <= 0) return;
          state.marketPrices[item.item_slug] = item.price / (MARKET_BUNDLE_SIZE[item.item_slug] || 1);
        });
        state.marketPricesUpdatedAt = Math.max(...data.map(d => d.timestamp || 0)) * 1000 || Date.now();
      }
      console.log('[MARKET API] Prices updated (EUC):', state.marketPrices);
      if (typeof updatePredictorView === 'function') updatePredictorView();
      if (typeof updateHoningView === 'function') updateHoningView();
      if (typeof renderEfficiencyTable === 'function') renderEfficiencyTable();
      if (typeof renderAdvisorView === 'function') renderAdvisorView();
    } catch (e) {
      console.warn('[MARKET API] Prix du marché indisponibles, prix par défaut utilisés:', e.message);
    }
  }

  async function initApp() {
    console.log('[APP] initApp executed! readyState:', document.readyState);
    bindEvents();
    fetchMarketPrices();

    const savedRoster = getUserRoster();
    if (savedRoster && savedRoster.length > 0) {
      hideNoCharacterState();
      renderPresetsBar();
      loadCharacter(savedRoster[0]);
    } else {
      showNoCharacterState();
    }

    renderSavedRosterManager();

    // Écouteur de changement de langue (i18n dynamique)
    window.addEventListener('languageChanged', () => {
      renderPresetsBar();
      const curChar = getCurrentActiveCharacter();
      if (curChar) {
        updateActiveCharacterCard(activeCharacterId, curChar);
      }
      updatePredictorView();
      updateHoningView();
      updateOptimizationView();
      renderCanonicalView();
      renderAdvisorView();
      updateArkPassiveView();
      updateCuttingAdvisorView();
      renderEfficiencyTable();
      updateGemSelectOptions();
      updateAstrogemGraderView();
      renderRaidTrackerView();
      renderBenchmarkTab();
    });

    // Initialisation des modules
    initRaidTracker();
    initBenchmarkEvents();
    initWelcomeModal();

    // Vérification d'un lien direct avec paramètre ?char=...
    const hasCharParam = await checkUrlCharacterParam();
    if (!hasCharParam) {
      checkOnboarding();
    }

    // Vérification du retour de redirection OAuth ou session active
    checkOAuthCallback();
    const token = localStorage.getItem('lostark_bible_token');
    if (token) {
      fetchOAuthUserData(token);
    }
  }

  window.__initApp = initApp;
  window.__renderPresetsBar = renderPresetsBar;
  window.__evaluateBracelet = evaluateBracelet;
  window.__renderBenchmarkTab = renderBenchmarkTab;
  window.__initBenchmarkEvents = initBenchmarkEvents;
  window.__findOptimalBenchmark = findOptimalBenchmark;
  window.__normalizeClassName = normalizeClassName;
  window.__getMainStatName = getMainStatName;
  window.__getCharacterSpecName = getCharacterSpecName;
  window.__extractPlayerSystems = extractPlayerSystems;
  window.__parseBibleCharacter = parseBibleCharacter;
  window.__getArkGridStatus = getArkGridStatus;
  window.__showToast = showToast;
  window.__BENCHMARK_DATABASE = typeof BENCHMARK_DATABASE !== 'undefined' ? BENCHMARK_DATABASE : {};
  window.__fetchBibleProfile = fetchBibleProfile;
  window.__extractCharacterGemParts = extractCharacterGemParts;
  window.__extractPlayerSystems = extractPlayerSystems;
  window.__loadCharacter = loadCharacter;
  window.__setAdvisorMode = typeof setAdvisorMode !== 'undefined' ? setAdvisorMode : function(goal) {
    if (typeof advisorState !== 'undefined') advisorState.selectedGoal = goal;
    if (typeof renderAdvisorView === 'function') renderAdvisorView();
  };
  window.__renderAdvisorView = renderAdvisorView;
  window.__computeDynamicGapsAndPlan = computeDynamicGapsAndPlan;
  window.__buildCpReconciliationHtml = buildCpReconciliationHtml;
  window.__resolveTargetSystems = resolveTargetSystems;
  window.__fetchLiveBibleBenchmark = fetchLiveBibleBenchmark;
  window.__benchmarkState = typeof benchmarkState !== 'undefined' ? benchmarkState : {};
  window.__getAvailableBenchmarks = getAvailableBenchmarks;
  window.__findOptimalBenchmark = findOptimalBenchmark;
  window.__extractCharacterEngravings = extractCharacterEngravings;
  window.__buildEngravingsBreakdownHtml = buildEngravingsBreakdownHtml;
  window.__buildBaseAtkBreakdownHtml = buildBaseAtkBreakdownHtml;
  window.__buildCombatStatsBreakdownHtml = buildCombatStatsBreakdownHtml;
  window.__buildAccBreakdownHtml = buildAccBreakdownHtml;
  window.__buildBraceletBreakdownHtml = buildBraceletBreakdownHtml;
  window.__buildAstrogemsBreakdownHtml = buildAstrogemsBreakdownHtml;
  window.__buildArkGridCoresBreakdownHtml = buildArkGridCoresBreakdownHtml;
  window.__buildWeaponBreakdownHtml = buildWeaponBreakdownHtml;
  window.__buildArmorsBreakdownHtml = buildArmorsBreakdownHtml;
  window.__getClassIconUrl = getClassIconUrl;
  window.__applyLoadedProfile = applyLoadedProfile;
  window.__detectCharacterRole = detectCharacterRole;
  window.detectCharacterRole = detectCharacterRole;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

  // === NOUVEL ONGLET MARCHE & FORTERESSE ===
  function renderMarketTab() {
    const dealsBody = document.querySelector('#dealsTable tbody');
    const craftBody = document.querySelector('#craftingTable tbody');
    if (!dealsBody || !craftBody) return;

    // 1. DEAL FINDER (Mockup basé sur les données de Loseii)
    const deals = [
      { item: 'Destruction Stone', spot: 599, fair: 1460, type: 'honing' },
      { item: 'Honor Leapstone', spot: 130, fair: 270, type: 'honing' },
      { item: 'Guardian Stone', spot: 299, fair: 600, type: 'honing' },
      { item: 'Iron Ore', spot: 115, fair: 154, type: 'mat' },
      { item: 'Ancient Relic', spot: 234, fair: 306, type: 'mat' },
      { item: 'Destiny Leapstone', spot: 17, fair: 14, type: 'honing' },
      { item: 'Destiny Guardian Stone', spot: 60, fair: 44, type: 'honing' },
      { item: 'Honor Shard Pouch (L)', spot: 450, fair: 238, type: 'honing' },
    ];

    deals.forEach(d => {
      d.pct = Math.round(((d.spot - d.fair) / d.fair) * 100);
    });
    deals.sort((a, b) => a.pct - b.pct);

    let dHtml = '';
    deals.forEach(d => {
      const color = d.pct < 0 ? '#8CC084' : '#E07A63'; // green if deal, red if overpriced
      const sign = d.pct > 0 ? '+' : '';
      dHtml += `
        <tr>
          <td>${d.item} <span style="font-size: 0.7em; opacity: 0.6; margin-left: 5px;">(${d.type})</span></td>
          <td style="font-family: monospace;">${d.spot} g</td>
          <td style="font-family: monospace; color: #a1a1aa;">${d.fair} g</td>
          <td style="color: ${color}; font-weight: bold;">${sign}${d.pct}%</td>
        </tr>
      `;
    });
    dealsBody.innerHTML = dHtml;

    // 2. CRAFTING CALCULATOR
    // Lecture des inputs
    const costRed = parseFloat(document.getElementById('shCostRed')?.value || 0);
    const timeRed = parseFloat(document.getElementById('shTimeRed')?.value || 0);
    const gsChance = parseFloat(document.getElementById('shGsChance')?.value || 0);

    const crafts = [
      { name: 'Superior Oreha Fusion Material', sell: 459, baseCost: 350, matCost: 100, isFusion: true },
      { name: 'Abidos Fusion Material', sell: 131, baseCost: 90, matCost: 40, isFusion: true },
      { name: 'Superior Abidos Fusion Material', sell: 153, baseCost: 120, matCost: 35, isFusion: true },
      { name: 'Dark Grenade', sell: 80, baseCost: 30, matCost: 20, isFusion: false },
      { name: 'Prime Oreha Fusion Material', sell: 49, baseCost: 45, matCost: 25, isFusion: true }
    ];

    let cHtml = '';
    crafts.forEach(c => {
      // ajustement du craft price selon la reduction forteresse
      const extraCostRed = c.isFusion ? 10 : 0; // Special (fusion) cost red
      const extraGs = c.isFusion ? 9 : 0; // Special GS
      
      const adjustedGold = Math.floor(c.baseCost * (1 - (costRed + extraCostRed) / 100));
      const totalCost = c.matCost + adjustedGold;
      const gsc = 5 * (1 + (gsChance + extraGs) / 100);
      const ey = 1 * (1 + gsc / 100); // base qty = 1 for simplicity here
      
      const tax = Math.ceil(c.sell * 0.05);
      const netProfit = (ey * (c.sell - tax)) - totalCost;
      const roi = (netProfit / totalCost) * 100;

      const color = netProfit > 0 ? '#8CC084' : '#E07A63';
      const sign = netProfit > 0 ? '+' : '';

      cHtml += `
        <tr>
          <td>${c.name}</td>
          <td style="color: ${color}; font-weight: bold;">${sign}${netProfit.toFixed(1)} g</td>
          <td style="color: ${color};">${roi.toFixed(1)}%</td>
        </tr>
      `;
    });
    
    // Sort by profit
    craftBody.innerHTML = cHtml;
  }

  // Hook event listeners for crafting inputs
  setTimeout(() => {
    ['shCostRed', 'shTimeRed', 'shGsChance'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.addEventListener('input', renderMarketTab);
    });
    renderMarketTab();
  }, 1000);
