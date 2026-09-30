// Lost Ark CP Calculator - Data Dictionaries

window.ASTROGEM_DATA = {
    pools: {
      8: ["add_dmg", "atk_power", "brand", "ally_dmg"],
      9: ["boss_dmg", "atk_power", "ally_dmg", "ally_ap"],
      10: ["boss_dmg", "add_dmg", "brand", "ally_ap"]
    },
    effectLabels: {
      fr: {
        add_dmg: "Dégâts Additionnels",
        atk_power: "Puissance d'Arme / Attaque",
        brand: "Marque (Brand Power)",
        ally_dmg: "Amplif. Dégâts Alliés",
        ally_ap: "Amplif. Puissance d'Attaque (PA)",
        boss_dmg: "Dégâts aux Boss"
      },
      en: {
        add_dmg: "Additional Damage",
        atk_power: "Weapon / Attack Power",
        brand: "Brand Power",
        ally_dmg: "Ally Damage Amplification",
        ally_ap: "Ally Attack Power Amplification",
        boss_dmg: "Boss Damage"
      }
    },
    dps: {
      atkPerLvl: 0.032386,
      addPerLvl: 0.059287,
      bossPerLvl: 0.081268,
      orderPerPoint: 0.159872,
      wpCredit: { 3: 0.1327, 4: 0.0896, 5: 0, 6: -0.1203, 7: -0.2504, 8: -0.3970, 9: -0.5686 },
      bounds: { min: -1.048216, max: 0.862648 },
      anchor: 0.823494
    },
    support: {
      allyApPerLvl: 0.0586 / 3,   // 0.019533
      brandPerLvl: 0.0437 / 3,    // 0.014567
      allyDmgPerLvl: 0.0214 / 3,  // 0.007133
      orderPerPoint: 0.02879,
      wpCredit: { 3: 0.0252, 4: 0.0150, 5: 0, 6: -0.0235, 7: -0.0593, 8: -0.0986, 9: -0.1346 },
      bounds: { min: -0.105810, max: 0.314450 },
      anchor: 0.299708
    }
  };;

window.BIBLE_ARK_GRID_SUBSTATS = {"2001":{"id":2001,"en":"Attack Power","fr":"Puissance d'Attaque","fullName":"Astrogemmes — Puissance d'Attaque (Attack Power)","isSupport":false,"levels":[3,7,11,14,18,22,25,29,33,36,40,44,47,51,55,58,62,66,69,73,77,80,84,88,91,95,99,102,106,110,113,117,121,124,128,132,135,139,143,146,150,154,157,161,165,168,172,176,179,183,187,190,194,198,201,205,209,212,216,220,223,227,231,234,238,242,245,249,253,256,260,264,267,271,275,278,282,286,289,293,297,300,304,308,311,315,319,322,326,330,333,337,341,344,348,352,355,359,363,366,370,374,377,381,385,388,392,396,399,403,407,410,414,418,421,425,429,432,436,440]},"2002":{"id":2002,"en":"Additional Damage","fr":"Dégâts Additionnels","fullName":"Astrogemmes — Dégâts Additionnels (Additional Damage)","isSupport":false,"levels":[8,16,24,32,40,48,56,64,72,80,88,97,105,113,121,129,137,145,153,161,169,177,185,194,202,210,218,226,234,242,250,258,266,274,282,291,299,307,315,323,331,339,347,355,363,371,379,388,396,404,412,420,428,436,444,452,460,468,476,485,493,501,509,517,525,533,541,549,557,565,573,582,590,598,606,614,622,630,638,646,654,662,670,679,687,695,703,711,719,727,735,743,751,759,767,776,784,792,800,808,816,824,832,840,848,856,864,873,881,889,897,905,913,921,929,937,945,953,961,970]},"2003":{"id":2003,"en":"Boss Damage","fr":"Dégâts aux Boss","fullName":"Astrogemmes — Dégâts aux Boss (Boss Damage)","isSupport":false,"levels":[8,16,25,33,41,50,58,66,75,83,91,100,108,116,125,133,141,150,158,166,175,183,191,200,208,216,225,233,241,250,258,266,275,283,291,300,308,316,325,333,341,350,358,366,375,383,391,400,408,416,425,433,441,450,458,466,475,483,491,500,508,516,525,533,541,550,558,566,575,583,591,600,608,616,625,633,641,650,658,666,675,683,691,700,708,716,725,733,741,750,758,766,775,783,791,800,808,816,825,833,841,850,858,866,875,883,891,900,908,916,925,933,941,950,958,966,975,983,991,1000]},"2011":{"id":2011,"en":"Ally Damage Enh.","fr":"Amélioration Dégâts Alliés","fullName":"Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés)","isSupport":true,"levels":[5,10,15,21,26,31,36,42,47,52,57,63,68,73,78,84,89,94,99,105,110,115,120,126,131,136,141,147,152,157,162,168,173,178,183,189,194,199,204,210,215,220,225,231,236,241,246,252,257,262,267,273,278,283,288,294,299,304,309,315,320,325,330,336,341,346,351,357,362,367,372,378,383,388,393,399,404,409,414,420,425,430,435,441,446,451,456,462,467,472,477,483,488,493,498,504,509,514,519,525,530,535,540,546,551,556,561,567,572,577,582,588,593,598,603,609,614,619,624,630]},"2012":{"id":2012,"en":"Brand Power","fr":"Puissance de Marque","fullName":"Astrogemmes — Brand Power (Puissance de la Marque)","isSupport":true,"levels":[16,33,50,66,83,100,116,133,150,166,183,200,216,233,250,266,283,300,316,333,350,366,383,400,416,433,450,466,483,500,516,533,550,566,583,600,616,633,650,666,683,700,716,733,750,766,783,800,816,833,850,866,883,900,916,933,950,966,983,1000,1016,1033,1050,1066,1083,1100,1116,1133,1150,1166,1183,1200,1216,1233,1250,1266,1283,1300,1316,1333,1350,1366,1383,1400,1416,1433,1450,1466,1483,1500,1516,1533,1550,1566,1583,1600,1616,1633,1650,1666,1683,1700,1716,1733,1750,1766,1783,1800,1816,1833,1850,1866,1883,1900,1916,1933,1950,1966,1983,2000]},"2013":{"id":2013,"en":"Ally Attack Enh.","fr":"Amélioration AP Allié","fullName":"Astrogemmes — Ally Attack Enh. (Amélioration AP Allié)","isSupport":true,"levels":[13,26,39,52,65,78,91,104,117,130,143,156,169,182,195,208,221,234,247,260,273,286,299,312,325,338,351,364,377,390,403,416,429,442,455,468,481,494,507,520,533,546,559,572,585,598,611,624,637,650,663,676,689,702,715,728,741,754,767,780,793,806,819,832,845,858,871,884,897,910,923,936,949,962,975,988,1001,1014,1027,1040,1053,1066,1079,1092,1105,1118,1131,1144,1157,1170,1183,1196,1209,1222,1235,1248,1261,1274,1287,1300,1313,1326,1339,1352,1365,1378,1391,1404,1417,1430,1443,1456,1469,1482,1495,1508,1521,1534,1547,1560]}};;

window.BIBLE_CARDS = {"1001":"Guardian's Mayhem","1002":"Guardian's Threat","1003":"Guardian's Roar","1004":"Lostwind Cliff (Falaise du Vent Perdu)","1005":"Grand Master Trial","1006":"Luterra's Ordeal","1007":"Farewell, Weapon","1008":"A Ghostly Night","1009":"Romanticist","1010":"Master of Necromancy","1011":"We'll Meet Again","1012":"Triarchy","1013":"Three Umar Families (Trois Familles Umar)","1014":"Scene Stealer","1015":"Light of Salvation (Lumière du Salut)","1016":"Verdantier Plan","1017":"Weight of Destiny","1018":"Death Approaches","1019":"Nature's Elementals","1020":"Spear Master","1021":"Cherish Your Books","1022":"Forest of Giants","1023":"Kazeros's Legion Commanders (Commandants de Kazeros)","1024":"Trixion","1025":"Field Boss II","1026":"Desert of Sky","1027":"Pirate Generation","1028":"Chaos Guardian I","1029":"The Way it Was","1031":"Oreha's Well","1032":"Fate of the Lazeniths (Destin des Lazeniths)","1034":"A Sun That Rose in the South","1036":"Guardian's Punishment","1037":"What's Left After a War","1038":"Revenge Is Mine","1039":"Destined Encounter I","1041":"Platina's People","1042":"The Witcher Collaboration 2023","1043":"Deep Dive (Plongée Profonde)","1044":"You Have A Plan","1045":"Star of Destiny","1046":"A Voice Calls","1048":"Spirited Flame's Breath","1049":"Powerful Wind's Breath","1050":"Strong Earth's Breath","1051":"Swift Thunderbolt's Breath","1052":"Frozen Wildfire Protection","1053":"Melodious Tide Protection","1054":"Sleeping Earth Protection","1055":"Raging Thunderbolt Protection","1056":"Guardian Purification I","1057":"Guardian's First Choice II","1058":"Path of Faith"};;

window.BIBLE_STAT_MAP = {
    1: { name: 'Points de Vie', isPercent: false, dest: 'les Points de Vie Maximum' },
    6: { name: 'Vitalité', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    7: { name: 'Force', isPercent: false, dest: "l'Attaque de Base (Base AP)" },
    8: { name: 'Dextérité', isPercent: false, dest: "l'Attaque de Base (Base AP)" },
    9: { name: 'Intelligence', isPercent: false, dest: "l'Attaque de Base (Base AP)" },
    10: { name: 'Vitalité', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    11: { name: null, isPercent: false, dest: "l'Attaque de Base (Base AP)" }, // mainStatName selon classe
    15: { name: 'Critique', isPercent: false, dest: 'les Stats de Combat' },
    16: { name: 'Spécialisation', isPercent: false, dest: 'les Stats de Combat' },
    17: { name: 'Domination', isPercent: false, dest: 'les Stats de Combat' },
    18: { name: 'Rapidité', isPercent: false, dest: 'les Stats de Combat' },
    19: { name: 'Endurance', isPercent: false, dest: 'les Stats de Combat' },
    20: { name: 'Expertise', isPercent: false, dest: 'les Stats de Combat' },
    21: { name: 'Critique', isPercent: false, dest: 'les Stats de Combat' },
    22: { name: 'Spécialisation', isPercent: false, dest: 'les Stats de Combat' },
    23: { name: 'Domination', isPercent: false, dest: 'les Stats de Combat' },
    24: { name: 'Rapidité', isPercent: false, dest: 'les Stats de Combat' },
    25: { name: 'Endurance', isPercent: false, dest: 'les Stats de Combat' },
    26: { name: 'Expertise', isPercent: false, dest: 'les Stats de Combat' },
    27: { name: 'Points de Vie Max', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    28: { name: 'Points de Mana Max', isPercent: false, dest: 'le Mana Maximum' },
    29: { name: 'Points de Vie Max', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    30: { name: 'Points de Mana Max', isPercent: false, dest: 'le Mana Maximum' },
    31: { name: 'Points de Vie Max', isPercent: false, dest: 'les Points de Vie Maximum (HP)' },
    32: { name: 'Points de Mana Max', isPercent: false, dest: 'le Mana Maximum' },
    45: { name: "Dégâts d'Évolution", isPercent: true, dest: 'les Dégâts' },
    46: { name: 'Brand Power (Marque)', isPercent: true, dest: 'la Marque' },
    47: { name: "Puissance d'Attaque", isPercent: false, dest: "l'Attaque de Base" },
    48: { name: 'Dégâts Bonus', isPercent: false, dest: 'les Dégâts' },
    49: { name: "Puissance d'Attaque", isPercent: true, dest: "l'Attaque de Base" },
    50: { name: 'Dégâts Additionnels', isPercent: true, dest: 'les Dégâts' },
    51: { name: "Puissance d'Attaque", isPercent: true, dest: "l'Attaque de Base" },
    52: { name: 'Dégâts Additionnels', isPercent: true, dest: 'les Dégâts' },
    53: { name: 'Réduction Temps de Recharge', isPercent: true, dest: 'le Temps de Recharge' },
    54: { name: 'Neutralisation (Stagger)', isPercent: true, dest: 'la Neutralisation' },
    55: { name: 'Défense Physique', isPercent: false, dest: 'la Défense Physique' },
    56: { name: 'Défense Magique', isPercent: false, dest: 'la Défense Magique' },
    57: { name: 'Défense Physique', isPercent: false, dest: 'la Défense Physique' },
    58: { name: 'Défense Magique', isPercent: false, dest: 'la Défense Magique' },
    59: { name: 'Défense Physique', isPercent: false, dest: 'la Défense Physique' },
    60: { name: 'Défense Magique', isPercent: false, dest: 'la Défense Magique' },
    71: { name: 'Bouclier', isPercent: true, dest: 'les Boucliers' },
    76: { name: 'Dégâts Critiques', isPercent: true, dest: 'les Dégâts Critiques' },
    77: { name: "Vitesse d'Attaque", isPercent: false, dest: "la Vitesse d'Attaque" },
    78: { name: "Vitesse d'Attaque", isPercent: true, dest: "la Vitesse d'Attaque" },
    79: { name: 'Vitesse de Déplacement', isPercent: false, dest: 'la Vitesse de Déplacement' },
    80: { name: 'Vitesse de Déplacement', isPercent: true, dest: 'la Vitesse de Déplacement' },
    151: { name: "Puissance d'Arme", isPercent: false, dest: "l'Attaque de Base (Base AP)" }
  };;

window.OAUTH_CONFIG = {
    prodClientId: 'm2remvngsp3rb3ezylwvlgzdfa',
    devClientId: 'rvyrwvi7r4hb65oma34fv73cte',
    scopes: 'identify rosters logs',
    authUrl: 'https://lostark.bible/oauth/authorize',
    tokenUrl: 'https://lostark.bible/oauth/token',
    userUrl: 'https://lostark.bible/api/oauth/user',
    rostersUrl: 'https://lostark.bible/api/oauth/rosters'
  };;

window.RAID_DEFINITIONS = {
    horizon_cathedral: {
      key: 'horizon_cathedral',
      nameKey: 'raid_cathedral',
      fallbackName: 'Horizon Cathedral',
      short: 'Cathedral',
      icon: '',
      image: 'images/raids/cathedral.webp',
      bosses: 'G1: Archbishop Arcenos • G2: Vanguard of Fanaticism',
      normal: { g1: 13500, g2: 16500, chest1: 2500, chest2: 3500, chest: 6000, total: 30000, ilvl: 1700 },
      hard: { g1: 16000, g2: 24000, chest1: 3000, chest2: 4500, chest: 7500, total: 40000, ilvl: 1720 },
      nightmare: { g1: 20000, g2: 30000, chest1: 3500, chest2: 5500, chest: 9000, total: 50000, ilvl: 1750 }
    },
    serca: {
      key: 'serca',
      nameKey: 'raid_serca',
      fallbackName: 'Serca',
      short: 'Serca',
      icon: '',
      image: 'images/raids/serca.webp',
      bosses: 'G1: Witch of Agony, Serca • G2: Corvus Tul Rak',
      normal: { g1: 14000, g2: 21000, chest1: 2500, chest2: 4000, chest: 6500, total: 35000, ilvl: 1710 },
      hard: { g1: 18000, g2: 26000, chest1: 3500, chest2: 5000, chest: 8500, total: 44000, ilvl: 1730 },
      nightmare: { g1: 22000, g2: 32000, chest1: 4000, chest2: 6000, chest: 10000, total: 54000, ilvl: 1740 }
    },
    final_act_kazeros: {
      key: 'final_act_kazeros',
      nameKey: 'raid_kazeros',
      fallbackName: 'Final Act: Kazeros',
      short: 'Kazeros',
      icon: '',
      image: 'images/raids/kazeros.webp',
      bosses: 'G1: Abyss Lord Kazeros • G2: Archdemon Kazeros',
      normal: { g1: 14000, g2: 26000, chest1: 2500, chest2: 5000, chest: 7500, total: 40000, ilvl: 1710 },
      hard: { g1: 17000, g2: 35000, chest1: 3500, chest2: 6500, chest: 10000, total: 52000, ilvl: 1730 },
      nightmare: { g1: 25000, g2: 40000, chest1: 4500, chest2: 7500, chest: 12000, total: 65000, ilvl: 1750 }
    }
  };;

window.CLASS_DEFAULT_SPECS = {
    shadowhunter: { default: "Demonic Impulse", alt: "Perfect Suppression", keys: ["demonic", "suppression", "impulse", "shadowhunter"] },
    paladin: { default: "Blessed Aura", alt: "Judgment", keys: ["blessed", "aura", "judgment", "paladin"] },
    breaker: { default: "Asura's Path", alt: "Brawl King Storm", keys: ["asura", "brawl", "breaker"] },
    slayer: { default: "Predator", alt: "Punisher", keys: ["predator", "punisher", "slayer"] },
    souleater: { default: "Full Moon Harvester", alt: "Night's Edge", keys: ["moon", "night", "edge", "souleater"] },
    bard: { default: "Desperate Salvation", alt: "True Courage", keys: ["salvation", "courage", "bard"] },
    artist: { default: "Full Bloom", alt: "Recurrence", keys: ["bloom", "recurrence", "artist", "yinyangshi"] },
    deathblade: { default: "Surge", alt: "Remaining Energy", keys: ["surge", "remaining", "deathblade", "blade"] },
    sorceress: { default: "Igniter", alt: "Reflux", keys: ["igniter", "reflux", "sorceress"] },
    gunlancer: { default: "Combat Readiness", alt: "Lone Knight", keys: ["combat readiness", "lone knight", "gunlancer", "warlord"] },
    wardancer: { default: "First Intention", alt: "Esoteric Skill Enhancement", keys: ["first intention", "esoteric", "wardancer", "battlemaster"] },
    scrapper: { default: "Ultimate Skill: Taijutsu", alt: "Shock Training", keys: ["taijutsu", "shock", "scrapper", "infighter"] },
    gunslinger: { default: "Peacemaker", alt: "Time to Hunt", keys: ["peacemaker", "hunt", "gunslinger"] },
    reaper: { default: "Hunger", alt: "Lunar Voice", keys: ["hunger", "lunar", "reaper"] },
    berserker: { default: "Mayhem", alt: "Berserker Technique", keys: ["mayhem", "berserker technique", "berserker"] },
    destroyer: { default: "Rage Hammer", alt: "Gravity Training", keys: ["rage hammer", "gravity", "destroyer"] },
    artillerist: { default: "Barrage Enhancement", alt: "Firepower Enhancement", keys: ["barrage", "firepower", "artillerist", "blaster"] },
    sharpshooter: { default: "Death Strike", alt: "Loyal Companion", keys: ["death strike", "loyal companion", "sharpshooter", "hawkeye"] },
    machinist: { default: "Evolutionary Legacy", alt: "Arthetinean Skill", keys: ["evolutionary legacy", "arthetinean", "machinist", "scouter"] },
    arcanist: { default: "Grace of the Empress", alt: "Order of the Emperor", keys: ["empress", "emperor", "arcanist", "arcana"] },
    summoner: { default: "Master Summoner", alt: "Communication Overflow", keys: ["master summoner", "overflow", "summoner"] },
    aeromancer: { default: "Wind Fury", alt: "Drizzle", keys: ["wind fury", "drizzle", "aeromancer"] },
    glaivier: { default: "Pinnacle", alt: "Control", keys: ["pinnacle", "control", "glaivier", "lancemaster"] },
    striker: { default: "Deathblow", alt: "Esoteric Flurry", keys: ["deathblow", "flurry", "striker"] },
    soulfist: { default: "Energy Overflow", alt: "Robust Spirit", keys: ["energy overflow", "robust", "soulfist", "soulmaster"] },
    deadeye: { default: "Enhanced Weapon", alt: "Pistoleer", keys: ["enhanced weapon", "pistoleer", "deadeye", "devilhunter"] },
    valkyrie: { default: "Liberator", alt: "Shining Knight", keys: ["liberator", "shining knight", "knight of light", "valkyrie", "holyknight_female", "holyknightfemale"] },
    dimensionalist: { default: "Time Wielder", alt: "Space Wielder", keys: ["time wielder", "space wielder", "dimensionalist", "dimension_master", "dimension master", "dimensionmaster", "dimension"] }
  };;

window.BIBLE_ENLIGHTENMENT_SPECS = {
    // Paladin
    2360010: 'Blessed Aura',
    2360020: 'Judgment',
    // Bard
    2370010: 'Desperate Salvation',
    2370020: 'True Courage',
    // Artist
    2440010: 'Full Bloom',
    2440020: 'Recurrence',
    // Slayer
    2450010: 'Predator',
    2450020: 'Punisher',
    // Shadowhunter
    2400010: 'Demonic Impulse',
    2400020: 'Perfect Suppression',
    // Souleater
    2460010: 'Full Moon Harvester',
    2460020: "Night's Edge",
    // Breaker
    2470010: 'Brawl King Storm',
    2470020: 'Asura Destruction',
    // Valkyrie
    2480100: 'Knight of Light',
    2480200: 'Liberator',
    // Soulfist
    2240000: 'Energy Overflow',
    2240100: 'Robust Spirit',
    // Scrapper
    2230000: 'Ultimate Skill: Taijutsu',
    2230100: 'Shock Training',
    // Wardancer
    2220000: 'First Intention',
    2220100: 'Esoteric Skill Enhancement',
    // Berserker
    2160010: 'Mayhem',
    2160020: "Berserker's Technique",
    // Destroyer
    2170010: 'Rage Hammer',
    2170020: 'Gravity Training',
    // Gunlancer
    2180010: 'Combat Readiness',
    2180020: 'Lone Knight',
    // Glaivier
    2250010: 'Pinnacle',
    2250020: 'Control',
    // Striker
    2260010: 'Deathblow',
    2260020: 'Esoteric Flurry',
    // Deadeye
    2270010: 'Enhanced Weapon',
    2270020: 'Pistoleer',
    // Gunslinger
    2280010: 'Peacemaker',
    2280020: 'Time to Hunt',
    // Artillerist
    2290010: 'Barrage Enhancement',
    2290020: 'Firepower Enhancement',
    // Sharpshooter
    2300010: 'Death Strike',
    2300020: 'Loyal Companion',
    // Machinist
    2310010: 'Evolutionary Legacy',
    2310020: 'Arthetinean Skill',
    // Sorceress
    2380010: 'Igniter',
    2380020: 'Reflux',
    // Deathblade
    2390010: 'Surge',
    2390020: 'Remaining Energy',
    // Arcanist
    2410010: 'Grace of the Empress',
    2410020: 'Order of the Emperor',
    // Summoner
    2420010: 'Master Summoner',
    2420020: 'Communication Overflow',
    // Reaper
    2430010: 'Hunger',
    2430020: 'Lunar Voice',
    // Aeromancer
    2490010: 'Wind Fury',
    2490020: 'Drizzle',
    // Dimensionalist
    220500100: 'Space Wielder',
    220500300: 'Space Wielder',
    220500600: 'Space Wielder',
    220500700: 'Space Wielder',
    220501000: 'Space Wielder',
    220501100: 'Space Wielder',
    220500000: 'Time Wielder',
    220500200: 'Time Wielder',
    220500400: 'Time Wielder',
    220500500: 'Time Wielder',
    220500800: 'Time Wielder',
    220500900: 'Time Wielder'
  };;

window.CLASS_NAME_MAP = {
    // Warriors
    holyknight: 'Paladin',
    holy_knight: 'Paladin',
    paladin: 'Paladin',
    warlord: 'Gunlancer',
    gunlancer: 'Gunlancer',
    pistolancier: 'Gunlancer',
    berserker: 'Berserker',
    berserker_male: 'Berserker',
    berserkermale: 'Berserker',
    berserker_female: 'Slayer',
    berserkerfemale: 'Slayer',
    slayer: 'Slayer',
    salveuse: 'Slayer',
    destroyer: 'Destroyer',
    valkyrie: 'Valkyrie',
    holyknight_female: 'Valkyrie',
    'holyknight female': 'Valkyrie',
    holyknightfemale: 'Valkyrie',
    guardianknight: 'Valkyrie',

    // Martial Artists
    battlemaster: 'Wardancer',
    battle_master: 'Wardancer',
    wardancer: 'Wardancer',
    elementiste: 'Wardancer',
    infighter: 'Scrapper',
    infighter_female: 'Scrapper',
    'infighter female': 'Scrapper',
    infighterfemale: 'Scrapper',
    scrapper: 'Scrapper',
    pugiliste: 'Scrapper',
    force_master: 'Soulfist',
    forcemaster: 'Soulfist',
    soul_master: 'Soulfist',
    soulmaster: 'Soulfist',
    soulfist: 'Soulfist',
    spiritiste: 'Soulfist',
    lance_master: 'Glaivier',
    lancemaster: 'Glaivier',
    glaivier: 'Glaivier',
    lanciere: 'Glaivier',
    striker: 'Striker',
    essentialiste: 'Striker',
    heavy_infighter: 'Breaker',
    heavyinfighter: 'Breaker',
    infighter_male: 'Breaker',
    'infighter male': 'Breaker',
    infightermale: 'Breaker',
    breaker: 'Breaker',
    sangha: 'Breaker',

    // Gunners
    devil_hunter: 'Deadeye',
    devilhunter: 'Deadeye',
    deadeye: 'Deadeye',
    franctireur: 'Deadeye',
    gunslinger: 'Gunslinger',
    devil_hunter_female: 'Gunslinger',
    devilhunterfemale: 'Gunslinger',
    fusiliere: 'Gunslinger',
    blaster: 'Artillerist',
    artillerist: 'Artillerist',
    artilleur: 'Artillerist',
    hawkeye: 'Sharpshooter',
    sharpshooter: 'Sharpshooter',
    sagittaire: 'Sharpshooter',
    machinist: 'Machinist',
    scouter: 'Machinist',
    machiniste: 'Machinist',

    // Mages
    bard: 'Bard',
    barde: 'Bard',
    arcana: 'Arcanist',
    arcanist: 'Arcanist',
    summoner: 'Summoner',
    invocatrice: 'Summoner',
    sorceress: 'Sorceress',
    sorciere: 'Sorceress',
    elemental_master: 'Sorceress',
    elementalmaster: 'Sorceress',

    // Assassins
    blade: 'Deathblade',
    deathblade: 'Deathblade',
    sanglante: 'Deathblade',
    demonic: 'Shadowhunter',
    shadowhunter: 'Shadowhunter',
    demoniste: 'Shadowhunter',
    reaper: 'Reaper',
    faucheuse: 'Reaper',
    soul_eater: 'Souleater',
    souleater: 'Souleater',
    devoreuse: 'Souleater',
    devoreusedames: 'Souleater',

    // Specialists
    artist: 'Artist',
    artiste: 'Artist',
    yinyangshi: 'Artist',
    yin_yang_shi: 'Artist',
    painter: 'Artist',
    illusionist: 'Artist',
    aeromancer: 'Aeromancer',
    weather_artist: 'Aeromancer',
    weatherartist: 'Aeromancer',
    aeromancienne: 'Aeromancer',
    meteorologist: 'Aeromancer',
    wildsoul: 'Wildsoul',
    wild_soul: 'Wildsoul',
    alchemist: 'Wildsoul',
    dimensionalist: 'Dimensionalist',
    dimension_master: 'Dimensionalist',
    dimensionmaster: 'Dimensionalist',
    'dimension master': 'Dimensionalist',
    dimensionnaliste: 'Dimensionalist',
    dimensioniste: 'Dimensionalist',
    maitredesdimensions: 'Dimensionalist'
  };;

window.ARSONISTIC_DATA = {
    support: {
      brand: {
        none: { pct: 0, buffDmg: 0, cp: 0 },
        low: { pct: 2.15, buffDmg: 0.19, cp: 25 },
        mid: { pct: 4.80, buffDmg: 0.42, cp: 55 },
        high: { pct: 8.00, buffDmg: 0.70, cp: 90 }
      },
      allyDmg: {
        none: { pct: 0, buffDmg: 0, cp: 0 },
        low: { pct: 2.00, buffDmg: 0.20, cp: 22 },
        mid: { pct: 4.50, buffDmg: 0.45, cp: 50 },
        high: { pct: 7.50, buffDmg: 0.75, cp: 85 }
      },
      allyAp: {
        none: { pct: 0, buffDmg: 0, cp: 0 },
        low: { pct: 1.35, buffDmg: 0.21, cp: 26 },
        mid: { pct: 3.00, buffDmg: 0.47, cp: 58 },
        high: { pct: 5.00, buffDmg: 0.78, cp: 96 }
      },
      wpPct: {
        none: { pct: 0, buffDmg: 0, cp: 0 },
        low: { pct: 0.80, buffDmg: 0.10, cp: 15 },
        mid: { pct: 1.80, buffDmg: 0.22, cp: 35 },
        high: { pct: 3.00, buffDmg: 0.36, cp: 58 }
      },
      wpFlat: {
        '0': { val: 0, buffDmg: 0, cp: 0 },
        '195': { val: 195, buffDmg: 0.016, cp: 8 },
        '480': { val: 480, buffDmg: 0.038, cp: 18 },
        '960': { val: 960, buffDmg: 0.077, cp: 36 }
      },
      quality: {
        min: { val: 60714, buffDmg: 0.00, cp: 0 },
        low: { val: 63397, buffDmg: 0.36, cp: 28 },
        mid: { val: 66080, buffDmg: 0.72, cp: 56 },
        high: { val: 68763, buffDmg: 1.08, cp: 84 },
        max: { val: 71446, buffDmg: 1.44, cp: 112 },
        // Rétrocompatibilité clés historiques
        '1935': { val: 60714, buffDmg: 0.00, cp: 0 },
        '2083': { val: 66080, buffDmg: 0.72, cp: 56 },
        '2679': { val: 71446, buffDmg: 1.44, cp: 112 }
      },
      bracePerk: {
        crit_ap: { name: 'Taux Crit Alliés (+2.5%) + PA (+3%)', buffDmg: 2.43, cp: 110 },
        cdmg_ap: { name: 'Dégâts Crit Alliés (+4.8%) + PA (+3%)', buffDmg: 2.04, cp: 92 },
        def_ap: { name: 'Réduction Défense (-2.5%) + PA (+3%)', buffDmg: 1.68, cp: 78 },
        shield_ap: { name: 'Dégâts Bouclier (+1.3%) + PA (+3%)', buffDmg: 1.65, cp: 75 },
        pure_ap: { name: 'PA Alliés Pure (+6.0%)', buffDmg: 0.94, cp: 60 },
        pure_dmg: { name: 'Dégâts Alliés Purs (+9.0%)', buffDmg: 0.90, cp: 58 },
        none: { name: 'Aucune', buffDmg: 0, cp: 0 }
      },
      braceWp: {
        '0': { buffDmg: 0, cp: 0 },
        '7200': { buffDmg: 0.59, cp: 38 },
        '8100': { buffDmg: 0.66, cp: 46 },
        '9000': { buffDmg: 0.73, cp: 56 }
      },
      braceStat: {
        '0': { buffDmg: 0, cp: 0 },
        '12000': { buffDmg: 0.29, cp: 20 },
        '14000': { buffDmg: 0.34, cp: 26 },
        '16000': { buffDmg: 0.39, cp: 34 }
      },
      braceSwift: {
        '0': { buffDmg: 0, cp: 0 },
        '80': { buffDmg: 0.24, cp: 16 },
        '100': { buffDmg: 0.30, cp: 20 },
        '120': { buffDmg: 0.35, cp: 25 }
      }
    },
    dps: {
      addDmg: {
        none: { pct: 0, dps: 0, cp: 0 },
        low: { pct: 0.70, dps: 0.53, cp: 28 },
        mid: { pct: 1.60, dps: 1.20, cp: 64 },
        high: { pct: 2.60, dps: 1.95, cp: 105 }
      },
      outDmg: {
        none: { pct: 0, dps: 0, cp: 0 },
        low: { pct: 0.55, dps: 0.55, cp: 28 },
        mid: { pct: 1.20, dps: 1.20, cp: 65 },
        high: { pct: 2.00, dps: 2.00, cp: 108 }
      },
      apPct: {
        none: { pct: 0, dps: 0, cp: 0 },
        low: { pct: 0.40, dps: 0.36, cp: 24 },
        mid: { pct: 0.95, dps: 0.85, cp: 52 },
        high: { pct: 1.55, dps: 1.38, cp: 84 }
      },
      critPct: {
        none: { pct: 0, dps: 0, cp: 0 },
        low: { pct: 0.40, dps: 0.32, cp: 20 },
        mid: { pct: 0.95, dps: 0.75, cp: 46 },
        high: { pct: 1.55, dps: 1.23, cp: 76 }
      },
      cdmgPct: {
        none: { pct: 0, dps: 0, cp: 0 },
        low: { pct: 1.10, dps: 0.28, cp: 18 },
        mid: { pct: 2.40, dps: 0.61, cp: 40 },
        high: { pct: 4.00, dps: 1.02, cp: 68 }
      },
      wpPct: {
        none: { pct: 0, dps: 0, cp: 0 },
        low: { pct: 0.80, dps: 0.28, cp: 18 },
        mid: { pct: 1.80, dps: 0.62, cp: 42 },
        high: { pct: 3.00, dps: 1.03, cp: 70 }
      },
      quality: {
        min: { val: 60714, dps: 0.00, cp: 0 },
        low: { val: 63397, dps: 0.85, cp: 28 },
        mid: { val: 66080, dps: 1.70, cp: 56 },
        high: { val: 68763, dps: 2.55, cp: 84 },
        max: { val: 71446, dps: 3.40, cp: 112 },
        '1935': { val: 60714, dps: 0.00, cp: 0 },
        '2083': { val: 66080, dps: 1.70, cp: 56 },
        '2679': { val: 71446, dps: 3.40, cp: 112 }
      },
      bracePerk: {
        crit_cdmg: { name: 'Taux Crit (+5%) & Dégâts Crit (+1.5%)', dps: 5.45, cp: 155 },
        add_demon: { name: 'Dégâts Add (+3.5%) & Dégâts Démon (+2.5%)', dps: 5.03, cp: 142 },
        cdmg_crit: { name: 'Dégâts Crit (+10%) & Dégâts Crit (+1.5%)', dps: 5.20, cp: 148 },
        dmg_cd: { name: 'Dégâts Purs (+5.5%) avec pénalité CD', dps: 4.06, cp: 120 },
        wp_stack: { name: 'Puissance Arme Cumulable (+1480x6 + Vitesse)', dps: 2.83, cp: 95 },
        none: { name: 'Aucune', dps: 0, cp: 0 }
      },
      braceWp: {
        '0': { dps: 0, cp: 0 },
        '7200': { dps: 1.70, cp: 52 },
        '8100': { dps: 1.91, cp: 62 },
        '9000': { dps: 2.12, cp: 72 }
      },
      braceStat: {
        '0': { dps: 0, cp: 0 },
        '12000': { dps: 0.85, cp: 28 },
        '14000': { dps: 0.99, cp: 36 },
        '16000': { dps: 1.13, cp: 44 }
      },
      braceSub: {
        '0': { dps: 0, cp: 0 },
        '80': { dps: 2.27, cp: 35 },
        '100': { dps: 2.84, cp: 46 },
        '120': { dps: 3.40, cp: 58 }
      }
    },
    gems: {
      lvl7: { buffDmg: 0, dps: 0, cp: 0, label: '11x Gemmes Niv. 7' },
      lvl8: { buffDmg: 1.25, dps: 2.40, cp: 312, label: '11x Gemmes Niv. 8' },
      lvl9: { buffDmg: 3.50, dps: 5.10, cp: 664, label: '11x Gemmes Niv. 9' },
      lvl10: { buffDmg: 6.00, dps: 8.40, cp: 1082, label: '11x Gemmes Niv. 10' }
    }
  };;

window.EUC_EFFICIENCY_DATA = {
    support: [
      {
        id: 'acc_wp_mid',
        name: 'Accessoire T4 : Roll Ligne Arme % Mid',
        sub: 'Accessoire Ancien • +1.8% Puissance Arme',
        gainText: '+0.19% Buff',
        gainVal: 0.19,
        cost: 7500,
        ratioText: '395 g',
        ratioVal: 395,
        tier: 's-plus',
        tierLabel: 'Rang S+',
        comment: 'Meilleur ROI : roll basique très accessible pour un bonus direct de buff PA.',
        checkAcquired: (st) => st.opt && ['mid', 'high'].includes(st.opt.supWp)
      },
      {
        id: 'ark_grid_order_sun_17',
        name: 'Grille d\'Ark : Ordre Soleil 17 Points',
        sub: 'Arbre Ark Grid • Nœud Soleil Ordre',
        gainText: '+1.13% Buff',
        gainVal: 1.13,
        cost: 80898,
        ratioText: '716 g',
        ratioVal: 716,
        tier: 's-plus',
        tierLabel: 'Rang S+',
        comment: 'Meilleur investissement Ark Grid : +1.13% de buff direct pour ~81k gold.',
        checkAcquired: (st) => st.opt ? !!st.opt.arkGrid : (st.currentIlvl >= 1750)
      },
      {
        id: 'ark_grid_order_moon_17',
        name: 'Grille d\'Ark : Ordre Lune 17 Points',
        sub: 'Arbre Ark Grid • Nœud Lune Ordre',
        gainText: '+1.11% Buff',
        gainVal: 1.11,
        cost: 80898,
        ratioText: '729 g',
        ratioVal: 729,
        tier: 's-plus',
        tierLabel: 'Rang S+',
        comment: 'Complément direct de l\'Ordre Soleil, très bon ratio de rentabilité.',
        checkAcquired: (st) => st.opt ? !!st.opt.arkGrid : (st.currentIlvl >= 1750)
      },
      {
        id: 'ark_grid_chaos_moon_17',
        name: 'Grille d\'Ark : Chaos Lune (Marque) 17P',
        sub: 'Arbre Ark Grid • Spécialisation Marque',
        gainText: '+0.61% Buff',
        gainVal: 0.61,
        cost: 80898,
        ratioText: '1 326 g',
        ratioVal: 1326,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Augmentation de l\'efficacité de la marque groupe.',
        checkAcquired: (st) => st.opt ? !!st.opt.arkGrid : (st.currentIlvl >= 1750)
      },
      {
        id: 'ark_grid_chaos_star_17',
        name: 'Grille d\'Ark : Chaos Étoile (Arme) 17P',
        sub: 'Arbre Ark Grid • Puissance d\'Arme',
        gainText: '+0.60% Buff',
        gainVal: 0.60,
        cost: 80898,
        ratioText: '1 348 g',
        ratioVal: 1348,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Puissance d\'arme transmise aux alliés à très bon coût.',
        checkAcquired: (st) => st.opt ? !!st.opt.arkGrid : (st.currentIlvl >= 1750)
      },
      {
        id: 'weapon_18',
        name: 'Affinage Normal : Arme +17 ➔ +18',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+0.32% Buff',
        gainVal: 0.32,
        cost: 56265,
        ratioText: '1 758 g',
        ratioVal: 1758,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Palier d\'arme clé (+29 CP et +0.32% Buff) pour un coût brut modéré de 56k gold.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 18
      },
      {
        id: 'weapon_19',
        name: 'Affinage Normal : Arme +18 ➔ +19',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+0.32% Buff',
        gainVal: 0.32,
        cost: 61332,
        ratioText: '1 917 g',
        ratioVal: 1917,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Dernier palier d\'arme à coût réduit avant le saut de difficulté du +20.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 19
      },
      {
        id: 'weapon_adv_1_10',
        name: 'Affinage Avancé Arme : Rangs 1 ➔ 10',
        sub: 'Advanced Honing Echidna • 10 Niveaux',
        gainText: '+0.65% Buff',
        gainVal: 0.65,
        cost: 125337,
        ratioText: '1 928 g',
        ratioVal: 1928,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Gain garanti sans échec avec les souffles et parchemins (~125k gold coût total EUC).',
        checkAcquired: (st) => st.advHoning >= 10
      },
      {
        id: 'acc_wp_high',
        name: 'Accessoire T4 : Roll Ligne Arme % High',
        sub: 'Accessoire Ancien • +3.0% Puissance Arme',
        gainText: '+0.32% Buff',
        gainVal: 0.32,
        cost: 91500,
        ratioText: '2 859 g',
        ratioVal: 2859,
        tier: 'a',
        tierLabel: 'Rang A',
        comment: 'Optimisation de stat haute pour couronner les bijoux principaux.',
        checkAcquired: (st) => st.opt && st.opt.supWp === 'high'
      },
      {
        id: 'weapon_adv_11_20',
        name: 'Affinage Avancé Arme : Rangs 11 ➔ 20',
        sub: 'Advanced Honing Echidna • 10 Niveaux',
        gainText: '+0.66% Buff',
        gainVal: 0.66,
        cost: 208219,
        ratioText: '3 155 g',
        ratioVal: 3155,
        tier: 'a',
        tierLabel: 'Rang A',
        comment: 'Sécurise +0.66% de buff net, indispensable avant d\'attaquer le honing normal +20.',
        checkAcquired: (st) => st.advHoning >= 20
      },
      {
        id: 'karma_evo_6',
        name: 'Karma Évolution : Rangs 0 ➔ 6',
        sub: 'Système Ark Passive Karma',
        gainText: '+0.50% Buff',
        gainVal: 0.50,
        cost: 199000,
        ratioText: '3 980 g',
        ratioVal: 3980,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Investissement fixe de 199k gold pour débloquer les nœuds d\'évolution.',
        checkAcquired: (st) => st.opt ? !!st.opt.karmaEvo : (st.currentIlvl >= 1750)
      },
      {
        id: 'armor_15_16',
        name: 'Affinage Armures : Toutes à +16',
        sub: '5 Pièces d\'armure (Torse, Jambes, Casque...)',
        gainText: '+0.25% Buff',
        gainVal: 0.25,
        cost: 109600,
        ratioText: '4 384 g',
        ratioVal: 4384,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Apporte un gros boost de Vitalité et Shield pour une dépense modérée.',
        checkAcquired: (st) => st.gear && Math.min(st.gear.head, st.gear.shoulder, st.gear.chest, st.gear.pants, st.gear.gloves) >= 16
      },
      {
        id: 'weapon_adv_21_30',
        name: 'Affinage Avancé Arme : Rangs 21 ➔ 30',
        sub: 'Advanced Honing Aegir • 10 Niveaux',
        gainText: '+0.85% Buff',
        gainVal: 0.85,
        cost: 432449,
        ratioText: '5 088 g',
        ratioVal: 5088,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Gros boost de puissance, coût important mais bien plus rentable que le honing normal +21+.',
        checkAcquired: (st) => st.advHoning >= 30
      },
      {
        id: 'gem_atk_7_8',
        name: 'Gemme T4 Dégâts/PA : Niv. 7 ➔ Niv. 8',
        sub: 'Palier 1 Gemme de Buff d\'Attaque',
        gainText: '+0.14% Buff',
        gainVal: 0.14,
        cost: 276000,
        ratioText: '19 714 g',
        ratioVal: 19714,
        tier: 'c',
        tierLabel: 'Rang C',
        comment: 'Coûteux pour un Support (+0.14% buff). À faire après l\'Ark Grid et l\'Arme +18.',
        checkAcquired: (st) => st.opt && ['lvl8', 'lvl9', 'lvl10'].includes(st.opt.gemsDeck)
      },
      {
        id: 'weapon_20',
        name: 'Affinage Normal : Arme +19 ➔ +20',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+0.32% Buff',
        gainVal: 0.32,
        cost: 123929,
        ratioText: '38 728 g',
        ratioVal: 38728,
        tier: 'c',
        tierLabel: 'Rang C',
        comment: 'Le taux de réussite chute drastiquement, coût par tap doublé.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 20
      },
      {
        id: 'gem_atk_9_10',
        name: 'Gemme T4 Dégâts/PA : Niv. 9 ➔ Niv. 10',
        sub: '1 Gemme T4 Niv. 10 Endgame',
        gainText: '+0.14% Buff',
        gainVal: 0.14,
        cost: 2415000,
        ratioText: '172 500 g',
        ratioVal: 172500,
        tier: 'trap',
        tierLabel: 'Piège à Gold',
        comment: '2.4 Millions de gold pour seulement +0.14% de buff. Pire ratio ROI du jeu pour un support.',
        checkAcquired: (st) => st.opt && st.opt.gemsDeck === 'lvl10'
      },
      {
        id: 'stone_9_7',
        name: 'Pierre de Capacité 9/7 (Full Pheons)',
        sub: 'Tentatives répétées de pierre 9/7',
        gainText: '+0.30% Buff',
        gainVal: 0.30,
        cost: 12127500,
        ratioText: '404 250 g',
        ratioVal: 404250,
        tier: 'trap',
        tierLabel: 'Luxe Extrême',
        comment: 'Coût astronomique (~12M gold en moyenne) pour un apport minime sur support.',
        checkAcquired: () => false
      }
    ],

    dps: [
      {
        id: 'dps_acc_mid_low',
        name: 'Accessoires T4 : 5x Rolls Mid-Low',
        sub: 'Set de 5 Accessoires Anciens T4',
        gainText: '+6.40% DPS',
        gainVal: 6.40,
        cost: 9250,
        ratioText: '1 445 g',
        ratioVal: 1445,
        tier: 's-plus',
        tierLabel: 'Rang S+',
        comment: 'Premier palier de bijoux anciens : gain massif de +6.4% DPS pour moins de 10k gold.',
        checkAcquired: () => true
      },
      {
        id: 'dps_acc_high',
        name: 'Accessoires T4 : 5x Rolls High 1ère ligne',
        sub: 'Set Ancien • Ligne principale High',
        gainText: '+7.62% DPS',
        gainVal: 7.62,
        cost: 91500,
        ratioText: '12 008 g',
        ratioVal: 12008,
        tier: 's-plus',
        tierLabel: 'Rang S+',
        comment: 'Bon ratio or / DPS personnel.',
        checkAcquired: (st) => st.opt && (st.opt.dpsAddDmg === 'high' || st.opt.dpsOutDmg === 'high')
      },
      {
        id: 'dps_weapon_18',
        name: 'Affinage Normal : Arme +17 ➔ +18',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 56265,
        ratioText: '40 189 g',
        ratioVal: 40189,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Gain DPS direct de +1.4% et boost majeur de Puissance d\'Arme.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 18
      },
      {
        id: 'dps_karma_enlight_6',
        name: 'Karma Illumination : Rangs 0 ➔ 6',
        sub: 'Système Ark Passive Karma DPS',
        gainText: '+4.67% DPS',
        gainVal: 4.67,
        cost: 199000,
        ratioText: '42 612 g',
        ratioVal: 42612,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Débloque les nœuds d\'illumination majeurs de la classe (+4.67% DPS net).',
        checkAcquired: (st) => st.opt ? !!st.opt.karmaEnlight : (st.currentIlvl >= 1750)
      },
      {
        id: 'dps_ark_grid_order_17',
        name: 'Grille d\'Ark : Ordre (Soleil+Lune+Étoile) 17P',
        sub: 'Arbre Ark Grid Complet 17 Points',
        gainText: '+20.76% DPS',
        gainVal: 20.76,
        cost: 891570,
        ratioText: '42 947 g',
        ratioVal: 42947,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Plus gros gain de dégâts du tableau : +20.8% DPS pour ~890k gold.',
        checkAcquired: (st) => st.opt ? !!st.opt.arkGrid : (st.currentIlvl >= 1750)
      },
      {
        id: 'dps_weapon_19',
        name: 'Affinage Normal : Arme +18 ➔ +19',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 61332,
        ratioText: '43 809 g',
        ratioVal: 43809,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Continuité de l\'arme avant le mur du +20.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 19
      },
      {
        id: 'dps_weapon_adv_1_10',
        name: 'Affinage Avancé Arme : Rangs 1 ➔ 10',
        sub: 'Advanced Honing Echidna • 10 Niveaux',
        gainText: '+2.82% DPS',
        gainVal: 2.82,
        cost: 135105,
        ratioText: '47 916 g',
        ratioVal: 47916,
        tier: 's',
        tierLabel: 'Rang S',
        comment: 'Sécurisé, sans RNG : +2.82% DPS pour 135k gold tout compris.',
        checkAcquired: (st) => st.advHoning >= 10
      },
      {
        id: 'dps_karma_evo_6',
        name: 'Karma Évolution : Rangs 0 ➔ 6',
        sub: 'Système Ark Passive Karma DPS',
        gainText: '+3.60% DPS',
        gainVal: 3.60,
        cost: 199000,
        ratioText: '55 278 g',
        ratioVal: 55278,
        tier: 'a',
        tierLabel: 'Rang A',
        comment: 'Augmentation passive de stats de combat et multiplicateurs.',
        checkAcquired: (st) => st.opt ? !!st.opt.karmaEvo : (st.currentIlvl >= 1750)
      },
      {
        id: 'dps_weapon_adv_11_20',
        name: 'Affinage Avancé Arme : Rangs 11 ➔ 20',
        sub: 'Advanced Honing Echidna • 10 Niveaux',
        gainText: '+2.82% DPS',
        gainVal: 2.82,
        cost: 214008,
        ratioText: '75 900 g',
        ratioVal: 75900,
        tier: 'a',
        tierLabel: 'Rang A',
        comment: 'Deuxième tranche d\'affinage avancé arme, très solide ROI.',
        checkAcquired: (st) => st.advHoning >= 20
      },
      {
        id: 'dps_weapon_20',
        name: 'Affinage Normal : Arme +19 ➔ +20',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 123929,
        ratioText: '88 521 g',
        ratioVal: 88521,
        tier: 'a',
        tierLabel: 'Rang A',
        comment: 'Le fameux cap +20, coûteux mais clé pour le prestige et le palier 1780+.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 20
      },
      {
        id: 'dps_weapon_21',
        name: 'Affinage Normal : Arme +20 ➔ +21',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 134607,
        ratioText: '96 148 g',
        ratioVal: 96148,
        tier: 'a',
        tierLabel: 'Rang A',
        comment: 'Palier +21 avec bonus de puissance d\'arme accru.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 21
      },
      {
        id: 'dps_weapon_adv_21_30',
        name: 'Affinage Avancé Arme : Rangs 21 ➔ 30',
        sub: 'Advanced Honing Brelshaza T4 • 10 Niveaux',
        gainText: '+3.71% DPS',
        gainVal: 3.71,
        cost: 448783,
        ratioText: '120 840 g',
        ratioVal: 120840,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Gain majeur garanti sans RNG pour ~449k gold.',
        checkAcquired: (st) => st.advHoning >= 30
      },
      {
        id: 'dps_gems_7_8_cd',
        name: 'Gemmes CD T4 : Niv. 7 ➔ Niv. 8',
        sub: '1 Gemme de Cooldown Cycle Majeur',
        gainText: '+2.19% DPS',
        gainVal: 2.19,
        cost: 276000,
        ratioText: '126 027 g',
        ratioVal: 126027,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Permet d\'aligner la rotation de sorts pour un gain de fluidité et de DPS.',
        checkAcquired: (st) => st.opt && ['lvl8', 'lvl9', 'lvl10'].includes(st.opt.gemsDeck)
      },
      {
        id: 'dps_weapon_adv_31_40',
        name: 'Affinage Avancé Arme : Rangs 31 ➔ 40',
        sub: 'Advanced Honing Brelshaza T4 • 10 Niveaux',
        gainText: '+4.16% DPS',
        gainVal: 4.16,
        cost: 539274,
        ratioText: '129 557 g',
        ratioVal: 129557,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Palier final d\'affinage avancé arme.',
        checkAcquired: (st) => st.advHoning >= 40
      },
      {
        id: 'dps_gems_7_8_dmg',
        name: 'Gemmes Dégâts T4 : Niv. 7 ➔ Niv. 8 (Skill 60%)',
        sub: '1 Gemme Dégâts sur compétence principale',
        gainText: '+2.00% DPS',
        gainVal: 2.00,
        cost: 276000,
        ratioText: '138 000 g',
        ratioVal: 138000,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Rentable sur la compétence qui représente le plus gros % de dégâts du kit.',
        checkAcquired: (st) => st.opt && ['lvl8', 'lvl9', 'lvl10'].includes(st.opt.gemsDeck)
      },
      {
        id: 'dps_weapon_22',
        name: 'Affinage Normal : Arme +21 ➔ +22',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 212651,
        ratioText: '151 894 g',
        ratioVal: 151894,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Coût en hausse, nécessite de solides réserves de gold.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 22
      },
      {
        id: 'dps_weapon_23',
        name: 'Affinage Normal : Arme +22 ➔ +23',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 229625,
        ratioText: '164 018 g',
        ratioVal: 164018,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Arme d\'élite niveau 23.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 23
      },
      {
        id: 'dps_armor_adv_1_10',
        name: 'Affinage Avancé Armure : Rangs 1 ➔ 10',
        sub: '5 Pièces d\'armure (Echidna)',
        gainText: '+2.31% DPS',
        gainVal: 2.31,
        cost: 405660,
        ratioText: '175 372 g',
        ratioVal: 175372,
        tier: 'b',
        tierLabel: 'Rang B',
        comment: 'Apporte de la stat principale et de l\'iLvl garanti.',
        checkAcquired: (st) => st.advHoning >= 10
      },
      {
        id: 'dps_armor_adv_11_20',
        name: 'Affinage Avancé Armure : Rangs 11 ➔ 20',
        sub: '5 Pièces d\'armure (Echidna)',
        gainText: '+2.31% DPS',
        gainVal: 2.31,
        cost: 616924,
        ratioText: '266 739 g',
        ratioVal: 266739,
        tier: 'c',
        tierLabel: 'Rang C',
        comment: 'Gain d\'iLvl global et stat principale pour le raid.',
        checkAcquired: (st) => st.advHoning >= 20
      },
      {
        id: 'dps_armors_all_20',
        name: 'Affinage Armures : Toutes à +20',
        sub: '5 Pièces d\'armure (+19 ➔ +20)',
        gainText: '+1.15% DPS',
        gainVal: 1.15,
        cost: 372111,
        ratioText: '323 575 g',
        ratioVal: 323575,
        tier: 'c',
        tierLabel: 'Rang C',
        comment: 'Franchissement du cap 1780+ pour toutes les armures.',
        checkAcquired: (st) => st.gear && Math.min(st.gear.head, st.gear.shoulder, st.gear.chest, st.gear.pants, st.gear.gloves) >= 20
      },
      {
        id: 'dps_weapon_24',
        name: 'Affinage Normal : Arme +23 ➔ +24',
        sub: 'Honing T4 • Arme d\'Aegir',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 479436,
        ratioText: '342 454 g',
        ratioVal: 342454,
        tier: 'c',
        tierLabel: 'Rang C',
        comment: 'Palier d\'arme +24 d\'Aegir, investissement massif de prestige.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 24
      },
      {
        id: 'dps_gems_8_9_cd',
        name: 'Gemmes T4 : Niv. 8 ➔ Niv. 9 (1 Cycle)',
        sub: 'Gemme de CD majeure',
        gainText: '+2.23% DPS',
        gainVal: 2.23,
        cost: 813000,
        ratioText: '364 574 g',
        ratioVal: 364574,
        tier: 'c',
        tierLabel: 'Rang C',
        comment: 'Optimisation de rotation endgame.',
        checkAcquired: (st) => st.opt && ['lvl9', 'lvl10'].includes(st.opt.gemsDeck)
      },
      {
        id: 'dps_weapon_25',
        name: 'Affinage Normal : Arme +24 ➔ +25',
        sub: 'Honing T4 • Arme d\'Aegir (+25 Max)',
        gainText: '+1.40% DPS',
        gainVal: 1.40,
        cost: 515964,
        ratioText: '368 545 g',
        ratioVal: 368545,
        tier: 'c',
        tierLabel: 'Rang C',
        comment: 'Palier maximum d\'Aegir : Puissance d\'Arme au plafond.',
        checkAcquired: (st) => st.gear && st.gear.weapon >= 25
      },
      {
        id: 'dps_gems_9_10_dmg',
        name: 'Gemme Dégâts T4 : Niv. 9 ➔ Niv. 10 (Skill 60%)',
        sub: '1 Gemme T4 Niv. 10 Endgame',
        gainText: '+1.90% DPS',
        gainVal: 1.90,
        cost: 2415000,
        ratioText: '1 271 053 g',
        ratioVal: 1271053,
        tier: 'trap',
        tierLabel: 'Piège à Gold',
        comment: '2.4 Millions de gold pour 1.9% de DPS. Réserve cet achat pour l\'extrême endgame.',
        checkAcquired: (st) => st.opt && st.opt.gemsDeck === 'lvl10'
      }
    ]
  };;

window.ARK_CLASS_SPECS = {
    shadowhunter: {
      name: 'Shadowhunter',
      specs: [
        { id: 'demonic_impulse', name: 'Impulsion Démoniaque (Transfo DPS)', nameEn: 'Demonic Impulse (Transform DPS)', role: 'dps' },
        { id: 'perfect_suppression', name: 'Suppression Parfaite (Humaine DPS)', nameEn: 'Perfect Suppression (Human DPS)', role: 'dps' }
      ]
    },
    souleater: {
      name: 'Souleater',
      specs: [
        { id: 'full_moon', name: 'Faucheuse de la Pleine Lune (Burst DPS)', nameEn: 'Full Moon Harvester (Burst DPS)', role: 'dps' },
        { id: 'nights_edge', name: 'Lisière de la Nuit (DPS Continu)', nameEn: 'Night\'s Edge (Consistent DPS)', role: 'dps' }
      ]
    },
    slayer: {
      name: 'Slayer',
      specs: [
        { id: 'predator', name: 'Prédatrice (DPS Continu)', nameEn: 'Predator (Consistent DPS)', role: 'dps' },
        { id: 'punisher', name: 'Punitrice (Burst DPS)', nameEn: 'Punisher (Burst DPS)', role: 'dps' }
      ]
    },
    paladin: {
      name: 'Paladin',
      specs: [
        { id: 'blessed_aura', name: 'Bénédiction Sacrée (Aura Bénie / Support)', nameEn: 'Blessed Aura (Support)', role: 'support' },
        { id: 'judgment', name: 'Jugement (Paladin DPS)', nameEn: 'Judgment (Paladin DPS)', role: 'dps' }
      ]
    },
    bard: {
      name: 'Bard',
      specs: [
        { id: 'desperate_salvation', name: 'Salut Désespéré (Support)', nameEn: 'Desperate Salvation (Support)', role: 'support' },
        { id: 'true_courage', name: 'Vrai Courage (DPS)', nameEn: 'True Courage (DPS)', role: 'dps' }
      ]
    },
    artist: {
      name: 'Artist',
      specs: [
        { id: 'full_bloom', name: 'Pleine Floraison (Support)', nameEn: 'Full Bloom (Support)', role: 'support' },
        { id: 'recurrence', name: 'Récurrence (DPS)', nameEn: 'Recurrence (DPS)', role: 'dps' }
      ]
    },
    breaker: {
      name: 'Breaker',
      specs: [
        { id: 'asura_path', name: 'Voie d\'Asura (Front Burst)', nameEn: 'Asura\'s Path (Front Burst)', role: 'dps' },
        { id: 'brawl_king', name: 'Roi de la Bagarre (Stance DPS)', nameEn: 'Brawl King Storm (Stance DPS)', role: 'dps' }
      ]
    },
    berserker: {
      name: 'Berserker',
      specs: [
        { id: 'mayhem', name: 'Carnage (Mayhem)', nameEn: 'Mayhem (Fast DPS)', role: 'dps' },
        { id: 'berserker_technique', name: 'Technique du Berserker (Burst)', nameEn: 'Berserker\'s Technique (Burst)', role: 'dps' }
      ]
    },
    gunlancer: {
      name: 'Gunlancer',
      specs: [
        { id: 'combat_readiness', name: 'Préparation au Combat (Bleu)', nameEn: 'Combat Readiness (Blue)', role: 'dps' },
        { id: 'lone_knight', name: 'Chevalier Solitaire (Rouge Burst)', nameEn: 'Lone Knight (Red Burst)', role: 'dps' }
      ]
    },
    destroyer: {
      name: 'Destroyer',
      specs: [
        { id: 'rage_hammer', name: 'Marteau de Rage (Burst)', nameEn: 'Rage Hammer (Burst)', role: 'dps' },
        { id: 'gravity_training', name: 'Entraînement Gravitationnel (Bonk)', nameEn: 'Gravity Training', role: 'dps' }
      ]
    },
    deathblade: {
      name: 'Deathblade',
      specs: [
        { id: 'surge', name: 'Déferlement (Surge)', nameEn: 'Surge (Burst)', role: 'dps' },
        { id: 'remaining_energy', name: 'Énergie Résiduelle', nameEn: 'Remaining Energy', role: 'dps' }
      ]
    },
    reaper: {
      name: 'Reaper',
      specs: [
        { id: 'lunar_voice', name: 'Voix Lunaire (Burst)', nameEn: 'Lunar Voice (Burst)', role: 'dps' },
        { id: 'hunger', name: 'Faim (Chaos Constant)', nameEn: 'Hunger (Sustained)', role: 'dps' }
      ]
    },
    sorceress: {
      name: 'Sorceress',
      specs: [
        { id: 'igniter', name: 'Ignition (Burst Météore)', nameEn: 'Igniter (Meteor Burst)', role: 'dps' },
        { id: 'reflux', name: 'Reflux (Spam Instant)', nameEn: 'Reflux (Instant Cast)', role: 'dps' }
      ]
    },
    arcanist: {
      name: 'Arcanist',
      specs: [
        { id: 'empress_grace', name: 'Grâce de l\'Impératrice (Ruin)', nameEn: 'Empress\'s Grace (Ruin)', role: 'dps' },
        { id: 'order_emperor', name: 'Ordre de l\'Empereur (Normal)', nameEn: 'Order of the Emperor (Normal)', role: 'dps' }
      ]
    },
    summoner: {
      name: 'Summoner',
      specs: [
        { id: 'master_summoner', name: 'Maîtresse Invocatrice (Burst)', nameEn: 'Master Summoner (Burst)', role: 'dps' },
        { id: 'communication_overflow', name: 'Débordement Invocations', nameEn: 'Communication Overflow (Pets)', role: 'dps' }
      ]
    },
    wardancer: {
      name: 'Wardancer',
      specs: [
        { id: 'first_intention', name: 'Première Intention (FI)', nameEn: 'First Intention (FI)', role: 'dps' },
        { id: 'esoteric_enhancement', name: 'Renforcement Ésotérique (ESO)', nameEn: 'Esoteric Skill Enhancement', role: 'dps' }
      ]
    },
    scrapper: {
      name: 'Scrapper',
      specs: [
        { id: 'tai_jutsu', name: 'Taijutsu (Vitesse/Stamina)', nameEn: 'Ultimate Skill: Taijutsu', role: 'dps' },
        { id: 'shock_training', name: 'Entraînement au Choc (Heavy)', nameEn: 'Shock Training (Heavy)', role: 'dps' }
      ]
    },
    striker: {
      name: 'Striker',
      specs: [
        { id: 'deathblow', name: 'Coup Mortel (4 Orbes Burst)', nameEn: 'Deathblow (4 Orbs Burst)', role: 'dps' },
        { id: 'esoteric_flurry', name: 'Rafale Ésotérique (1 Orbe)', nameEn: 'Esoteric Flurry (1 Orb)', role: 'dps' }
      ]
    },
    glaivier: {
      name: 'Glaivier',
      specs: [
        { id: 'pinnacle', name: 'Pinacle (Stance Swap)', nameEn: 'Pinnacle (Stance Swap)', role: 'dps' },
        { id: 'control', name: 'Contrôle (Lance Bleue)', nameEn: 'Control (Blue Stance)', role: 'dps' }
      ]
    },
    deadeye: {
      name: 'Deadeye',
      specs: [
        { id: 'enhanced_weapon', name: 'Arme Améliorée (Fusil à Pompe)', nameEn: 'Enhanced Weapon (Shotgun)', role: 'dps' },
        { id: 'pistoleer', name: 'Pistolero (Pistolets Seuls)', nameEn: 'Pistoleer (Pistols Only)', role: 'dps' }
      ]
    },
    gunslinger: {
      name: 'Gunslinger',
      specs: [
        { id: 'peacemaker', name: 'Pacificatrice (Tri-Armes)', nameEn: 'Peacemaker (Tri-Stance)', role: 'dps' },
        { id: 'time_to_hunt', name: 'Heure de la Chasse (Sans Pompe)', nameEn: 'Time to Hunt (No Shotgun)', role: 'dps' }
      ]
    },
    artillerist: {
      name: 'Artillerist',
      specs: [
        { id: 'barrage_enhancement', name: 'Renforcement de Barrage (Tourelle)', nameEn: 'Barrage Enhancement (Turret)', role: 'dps' },
        { id: 'firepower_enhancement', name: 'Puissance de Feu (Mobilité)', nameEn: 'Firepower Enhancement', role: 'dps' }
      ]
    },
    sharpshooter: {
      name: 'Sharpshooter',
      specs: [
        { id: 'death_strike', name: 'Frappe Mortelle (Burst Faucon)', nameEn: 'Death Strike (Hawk Burst)', role: 'dps' },
        { id: 'loyal_companion', name: 'Compagnon Fidèle (Sustained)', nameEn: 'Loyal Companion (Sustained)', role: 'dps' }
      ]
    },
    machinist: {
      name: 'Machinist',
      specs: [
        { id: 'evolutionary_legacy', name: 'Héritage de l\'Évolution (Ironman)', nameEn: 'Evolutionary Legacy (Ironman)', role: 'dps' },
        { id: 'arthetinean_skill', name: 'Compétence d\'Arthetine (Drone)', nameEn: 'Arthetinean Skill (Drone)', role: 'dps' }
      ]
    },
    aeromancer: {
      name: 'Aeromancer',
      specs: [
        { id: 'wind_fury', name: 'Fureur du Vent (Parapluie Rapide)', nameEn: 'Wind Fury (Fast Umbrella)', role: 'dps' },
        { id: 'drizzle', name: 'Bruine (Météo/Dégâts Spé)', nameEn: 'Drizzle (Weather Special)', role: 'dps' }
      ]
    },
    dimensionalist: {
      name: 'Dimensionalist',
      specs: [
        { id: 'time_wielder', name: 'Maître du Temps (Time Wielder / Spé)', nameEn: 'Time Wielder (Spec / Non-Positional)', role: 'dps' },
        { id: 'space_wielder', name: 'Maître de l\'Espace (Space Wielder / Rap)', nameEn: 'Space Wielder (Swift / Back Attack)', role: 'dps' }
      ]
    }
  };;


// --- T4 EXACT HONING MATRICES (Imported from Honing Forecast) ---
// Index Mapping: [0] Destruction, [1] Guardian, [2] Fusion, [3] Shards, [4] Leapstones, [5] Raw Gold, [6] Silver
window.T4_HONING_CHANCES = [0.6,0.6,0.6,0.45,0.45,0.3,0.3,0.15,0.15,0.1,0.1,0.05,0.05,0.04,0.04,0.04,0.03,0.03,0.03,0.015,0.015,0.01,0.01,0.005,0.005];
window.T4_WEAPON_COST = [[350,450,550,650,750,800,900,1000,1050,1150,1250,1300,1400,1550,1700,1950,2200,2450,2700,2950,3200,3700,4000,4200,4500],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[12,13,14,15,15,15,16,16,18,18,18,21,24,27,30,33,36,39,42,45,48,52,56,60,65],[3000,3100,3200,3300,3500,3700,3900,4200,4400,4700,5000,5300,7600,8200,8800,9400,12000,12900,13700,16000,17100,18200,19200,20400,21500],[5,5,5,6,6,6,8,8,10,10,12,12,15,15,18,18,25,25,25,35,35,35,35,50,50],[624,632,648,688,728,792,864,952,1048,1168,1296,1432,1592,1760,1944,2136,2352,2576,3510,3830,4160,4510,4870,5250,5650],[50000,50000,50000,50000,50000,50000,55000,55000,55000,55000,55000,55000,55000,55000,55000,55000,65000,65000,65000,90000,90000,120000,120000,150000,150000]];
window.T4_ARMOR_COST = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[210,270,330,390,450,480,540,600,630,690,750,780,840,930,1020,1170,1320,1470,1620,1770,1920,2220,2400,2520,2700],[7,8,8,9,9,9,10,10,11,11,11,13,14,16,18,20,22,23,25,27,29,31,34,36,40],[1800,1860,1920,1980,2100,2220,2340,2520,2640,2820,3000,3180,4560,4920,5280,5640,7200,7740,8220,9600,10260,10920,11520,12240,12900],[3,3,3,4,4,4,5,5,6,6,7,7,9,9,11,11,15,15,15,21,21,21,21,30,30],[376,384,392,416,440,472,520,568,632,704,776,856,952,1056,1168,1280,1408,1544,2110,2300,2500,2710,2920,3150,3390],[30000,30000,30000,30000,30000,30000,33000,33000,33000,33000,33000,33000,33000,33000,33000,33000,39000,39000,39000,54000,54000,72000,72000,90000,90000]];
window.T4_WEAPON_UNLOCK = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[15000,15000,15000,15000,15000,16000,17000,17000,18000,20000,21000,23000,33000,38000,43000,49000,66000,75000,85000,106000,120000,135000,152000,170000,190000],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[240000,240000,240000,270000,270000,320000,340000,374000,396000,520000,525000,690000,825000,950000,1075000,1225000,1650000,1875000,1955000,2120000,2400000,2700000,3040000,3400000,4750000]];
window.T4_ARMOR_UNLOCK = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[9000,9000,9000,9000,9000,9000,10000,10000,10000,12000,12000,13000,19000,22000,25000,29000,39000,45000,51000,63000,72000,81000,91000,102000,114000],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[144000,144000,144000,162000,162000,180000,200000,220000,220000,312000,300000,390000,475000,550000,625000,725000,975000,1125000,1173000,1260000,1440000,1620000,1820000,2040000,2850000]];
