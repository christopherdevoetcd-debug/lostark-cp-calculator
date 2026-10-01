// Benchmark : base, traductions des gravures, spé du personnage, résumé des gemmes.
// Scripts classiques de js/ chargés dans l'ordre d'index.html, qui partagent leurs déclarations de premier niveau.
'use strict';

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

  const raw = ch.rawProfile || (ch.loadout ? ch : null);
  const normClass = normalizeClassName(ch.className || (ch.loadout && ch.loadout.classId) || (raw && raw.loadout && raw.loadout.classId) || (raw && raw.className) || '').toLowerCase();

  // 1. Nœud d'Éclairage de palier 1 du profil (table du jeu) : prime sur une spé enregistrée,
  // qui peut venir de l'ancienne table fausse (rosters et références sauvegardés avant).
  const arkPass = ch.arkPassive || (raw && (raw.arkPassive || (raw.loadout && raw.loadout.arkPassive)));
  if (arkPass && Array.isArray(arkPass.enlightenment)) {
    for (const node of arkPass.enlightenment) {
      if (node && BIBLE_ENLIGHTENMENT_SPECS[node.id]) {
        return BIBLE_ENLIGHTENMENT_SPECS[node.id];
      }
    }
  }

  // 2. Spé explicite déjà définie sur l'objet
  if (ch.spec && !['Standard', 'Standard T4', 'Unknown', ''].includes(ch.spec)) {
    return ch.spec;
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
