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

window.CANONICAL_PRESETS = {
    "neversup": {
        "name": "Neversup",
        "className": "Paladin",
        "spec": "Blessed Aura",
        "role": "support",
        "ilvl": 1750,
        "inGameScore": 3367.92,
        "calculatedScore": 3606.71,
        "buffPower": 2982.59,
        "healPower": 624.12,
        "mainStat": 627038,
        "weaponPower": 218877,
        "baseAtk": 162736,
        "maxHp": 373636,
        "partsCount": 53,
        "gear": {
            "weapon": 17,
            "head": 14,
            "chest": 15,
            "pants": 15,
            "gloves": 15,
            "shoulder": 14
        },
        "advHoning": 40,
        "gemParts": [
            10,
            8.75,
            8.75,
            8.75,
            10,
            10,
            10,
            10,
            8.75,
            8.75,
            8.75
        ],
        "engravings": [
            {
                "grade": "engrave_grade04",
                "id": 1255,
                "progress": 10
            },
            {
                "grade": "engrave_grade05",
                "id": 1251,
                "progress": 0
            },
            {
                "grade": "engrave_grade04",
                "id": 1301,
                "progress": 2
            },
            {
                "grade": "engrave_grade05",
                "id": 1167,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1134,
                "progress": 0
            }
        ],
        "arkGridCores": [
            {
                "id": 673003035,
                "base": 10001,
                "gems": [
                    {
                        "id": 67401025,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 4
                            },
                            {
                                "id": 2002,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 4
                            },
                            {
                                "id": 2012,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 3,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 4
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673013035,
                "base": 10002,
                "gems": [
                    {
                        "id": 67401025,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 3
                            },
                            {
                                "id": 2012,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 3
                            },
                            {
                                "id": 2011,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2013,
                                "level": 4
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673103005,
                "base": 10003,
                "gems": [
                    {
                        "id": 67411325,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2012,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 4
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 2
                            },
                            {
                                "id": 2013,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 3
                            },
                            {
                                "id": 2012,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673113005,
                "base": 10004,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 4
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411425,
                        "idx": 3,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2013,
                                "level": 3
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673121005,
                "base": 10005,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2011,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673025035,
                "base": 10006,
                "gems": [
                    {
                        "id": 67401025,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 5
                            },
                            {
                                "id": 2002,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2013,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 4
                            }
                        ]
                    }
                ]
            }
        ],
        "arkGrid": {
            "sun17": true,
            "moon17": true,
            "star17": true,
            "starTier": 3
        },
        "accRolled": true,
        "apPoints": {
            "enlightenment": 101,
            "evolution": 140,
            "leap": 70
        },
        "arkPassive": {
            "evolution": [
                {
                    "id": 1010200,
                    "level": 10
                },
                {
                    "id": 1010400,
                    "level": 30
                },
                {
                    "id": 1020600,
                    "level": 3
                },
                {
                    "id": 1030600,
                    "level": 2
                },
                {
                    "id": 1032400,
                    "level": 1
                },
                {
                    "id": 1032600,
                    "level": 1
                },
                {
                    "id": 1040400,
                    "level": 2
                }
            ],
            "enlightenment": [
                {
                    "id": 2360010,
                    "level": 1
                },
                {
                    "id": 2360030,
                    "level": 3
                },
                {
                    "id": 2360060,
                    "level": 3
                },
                {
                    "id": 2360070,
                    "level": 1
                },
                {
                    "id": 2360100,
                    "level": 3
                },
                {
                    "id": 2360110,
                    "level": 1
                }
            ],
            "leap": [
                {
                    "id": 2365000,
                    "level": 2
                },
                {
                    "id": 2365200,
                    "level": 3
                },
                {
                    "id": 2365400,
                    "level": 5
                },
                {
                    "id": 2365500,
                    "level": 3
                },
                {
                    "id": 2365900,
                    "level": 3
                }
            ]
        },
        "items": [
            {
                "cat": "Base",
                "label": "Attaque de Base (Stat: 627 038, Arme: 218 877)",
                "val": "162 736 AP",
                "mult": "Base Val: 201 793",
                "type": "Buff Power",
                "badge": "base"
            },
            {
                "cat": "Base",
                "label": "Points de Vie Maximum (Vitalité)",
                "val": "373 636 HP",
                "mult": "Base Val: 4 483 632",
                "type": "Heal / Shield",
                "badge": "base"
            },
            {
                "cat": "Niveau",
                "label": "Niveau de Personnage 70",
                "val": "Niv. 70",
                "mult": "+4.76%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Qualité",
                "label": "Qualité d'Arme (97)",
                "val": "Qualité 97",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Bonus de dégâts solo perso : 0% transféré aux alliés (exclu du Buff Power)."
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Évolution (100 pts)",
                "val": "100 pts",
                "mult": "+160.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Illumination (100 pts)",
                "val": "100 pts",
                "mult": "+72.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Bond (70 pts)",
                "val": "70 pts",
                "mult": "+14.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Rang d'Évolution (Rang 0 à 6)",
                "val": "+3.60%",
                "mult": "+3.60%",
                "type": "Buff Power",
                "badge": "passive",
                "note": "Palier de Karma de transcendance T4 accordant un multiplicateur global."
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Niveau de Bond (Niv. 0 à 30)",
                "val": "+0.00%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": "💡 Dégâts de bond solo perso : exclu du Buff Power en Support."
            },
            {
                "cat": "Gravures",
                "label": "Awakening (Éveil) — Pierre +2",
                "val": "+32.25%",
                "mult": "+32.25%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Magick Stream (Flux Magique)",
                "val": "+20.00%",
                "mult": "+20.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Expert (Expert)",
                "val": "+39.20%",
                "mult": "+39.20%",
                "type": "Heal / Shield",
                "badge": "defense",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Drops of Ether (Gouttes d'Éther) — Pierre +2",
                "val": "+31.44%",
                "mult": "+31.44%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Puissance d'Attaque Flat (+800)",
                "val": "+800 AP",
                "mult": "+4.80%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Puissance d'Attaque d'Allié (+1.95%)",
                "val": "+1.95%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Ligne Affinée (+2.10%)",
                "val": "+2.10%",
                "mult": "+1.47%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts d'Allié (+1.80%)",
                "val": "+1.80%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts Critiques (+13.00%)",
                "val": "+13.00%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Dégâts Critiques solo perso : non transférés aux alliés en Support (exclu du Buff Power)."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Dégâts d'Allié (+1.80%)",
                "val": "+1.80%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Ligne Affinée (+5.00%)",
                "val": "+5.00%",
                "mult": "+3.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Efficacité Bouclier / Soins (+2.00%)",
                "val": "+2.00%",
                "mult": "+1.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Efficacité Bouclier / Soins (+2.00%)",
                "val": "+2.00%",
                "mult": "+1.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Ligne Affinée (+5.00%)",
                "val": "+5.00%",
                "mult": "+3.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Vitalité (+5 300)",
                "val": "+5 300",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute de vitalité déjà intégrée directement dans les Points de Vie Maximum (HP) en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Force (+10 497)",
                "val": "+10 497",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute de force déjà intégrée directement dans l'Attaque de Base (Base AP) en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Poignard / Faiblesse (Défense -1.8% & AP Allié +2%)",
                "val": "+9.06%",
                "mult": "+9.06%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 On hit, target's Defense -1.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Spécialisation (+74)",
                "val": "+74",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute de spécialisation déjà intégrée directement dans les Stats de Combat en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Ovation / Vulnérabilité Crit (Dégâts Crit -3.6% & AP Allié +2%)",
                "val": "+9.06%",
                "mult": "+9.06%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 On hit, target's Crit Damage -3.6% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Dégâts)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts Majeurs)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts Majeurs)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts Majeurs)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Stats",
                "label": "Stats de Combat (2386 pts)",
                "val": "2386 stats",
                "mult": "+95.44%",
                "type": "Buff Power",
                "badge": "stat",
                "note": null
            },
            {
                "cat": "Cartes",
                "label": "Lostwind Cliff (Falaise du Vent Perdu) (Rang 6)",
                "val": "Rang 6",
                "mult": "+21.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Heavenly Agent (17P | Order Sun)",
                "val": "17P",
                "mult": "+7.80%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Heavenly Resolve (18P | Order Moon)",
                "val": "18P",
                "mult": "+7.98%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Faith Enhancement (17P | Chaos Sun)",
                "val": "17P",
                "mult": "+3.60%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Echoing Brand (17P | Chaos Moon)",
                "val": "17P",
                "mult": "+3.60%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Prayer of Light (17P | Order Star)",
                "val": "17P",
                "mult": "+2.10%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Attack (17P | Chaos Star)",
                "val": "17P",
                "mult": "+3.60%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés) — Niv. 40",
                "val": "+2.10% (Niv. 40)",
                "mult": "+2.00%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Effet in-game : +2.10% Amélioration Dégâts Alliés (cumul des astrogemmes). Multiplicateur Smilegate CP : +2.00% Buff Power."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Brand Power (Puissance de la Marque) — Niv. 32",
                "val": "+5.33% (Niv. 32)",
                "mult": "+2.80%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Effet in-game : +5.33% Puissance de Marque (cumul des astrogemmes). Multiplicateur Smilegate CP : +2.80% Buff Power."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Attack Enh. (Amélioration AP Allié) — Niv. 12",
                "val": "+1.56% (Niv. 12)",
                "mult": "+1.50%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.56% Amélioration AP Allié (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.50% Buff Power."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Puissance d'Attaque (Attack Power) — Niv. 25",
                "val": "+0.91% (Niv. 25)",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Stat brute puissance d'attaque solo perso (+0.91%) : exclue du calcul du Buff Power en Support (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts Additionnels (Additional Damage) — Niv. 18",
                "val": "+1.45% (Niv. 18)",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Stat brute dégâts additionnels solo perso (+1.45%) : exclue du calcul du Buff Power en Support (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts aux Boss (Boss Damage) — Niv. 3",
                "val": "+0.25% (Niv. 3)",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Stat brute dégâts aux boss solo perso (+0.25%) : exclue du calcul du Buff Power en Support (Smilegate Battle Point)."
            },
            {
                "cat": "Paradise",
                "label": "Orbe Trinity (16 483 067 pts)",
                "val": "16 483 067 pts",
                "mult": "+1.30%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            }
        ]
    },
    "neevercry": {
        "name": "Neevercry",
        "className": "Shadowhunter",
        "spec": "Demonic Impulse",
        "role": "dps",
        "ilvl": 1770,
        "inGameScore": 2770.44,
        "calculatedScore": 2769.16,
        "buffPower": 2769.16,
        "healPower": 0,
        "mainStat": 701897,
        "weaponPower": 249724,
        "baseAtk": 172287,
        "maxHp": 316420,
        "partsCount": 44,
        "gear": {
            "weapon": 23,
            "head": 18,
            "chest": 18,
            "pants": 19,
            "gloves": 19,
            "shoulder": 18
        },
        "advHoning": 40,
        "gemParts": [
            5.76
        ],
        "engravings": [
            {
                "grade": "engrave_grade05",
                "id": 1118,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1247,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1299,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1254,
                "progress": 0
            },
            {
                "grade": "engrave_grade04",
                "id": 1141,
                "progress": 16
            }
        ],
        "arkGridCores": [
            {
                "id": 673002415,
                "base": 10001,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2002,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401025,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 4
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401025,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2002,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673120005,
                "base": 10002,
                "gems": [
                    {
                        "id": 67411325,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 5
                            },
                            {
                                "id": 2011,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673021416,
                "base": 10003,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2012,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401025,
                        "idx": 3,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673100006,
                "base": 10004,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2003,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2003,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673012416,
                "base": 10005,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 4
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401125,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 5
                            },
                            {
                                "id": 2003,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401125,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673110005,
                "base": 10006,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 2,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    }
                ]
            }
        ],
        "arkGrid": {
            "sun17": true,
            "moon17": true,
            "star17": true,
            "starTier": 3
        },
        "accRolled": true,
        "apPoints": {
            "enlightenment": 101,
            "evolution": 140,
            "leap": 70
        },
        "arkPassive": {
            "evolution": [
                {
                    "id": 1010100,
                    "level": 10
                },
                {
                    "id": 1010200,
                    "level": 30
                },
                {
                    "id": 1020400,
                    "level": 3
                },
                {
                    "id": 1030200,
                    "level": 2
                },
                {
                    "id": 1032100,
                    "level": 1
                },
                {
                    "id": 1032300,
                    "level": 1
                },
                {
                    "id": 1040400,
                    "level": 2
                }
            ],
            "enlightenment": [
                {
                    "id": 2270000,
                    "level": 1
                },
                {
                    "id": 2270100,
                    "level": 3
                },
                {
                    "id": 2270300,
                    "level": 3
                },
                {
                    "id": 2270400,
                    "level": 2
                },
                {
                    "id": 2270500,
                    "level": 3
                }
            ],
            "leap": [
                {
                    "id": 2275300,
                    "level": 5
                },
                {
                    "id": 2275400,
                    "level": 5
                },
                {
                    "id": 2275900,
                    "level": 3
                }
            ]
        },
        "items": [
            {
                "cat": "Base",
                "label": "Attaque de Base (Stat: 701 897, Arme: 249 724)",
                "val": "172 287 AP",
                "mult": "Base Val: 496 186",
                "type": "DPS Net",
                "badge": "base"
            },
            {
                "cat": "Niveau",
                "label": "Niveau de Personnage 70",
                "val": "Niv. 70",
                "mult": "+29.45%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Qualité",
                "label": "Qualité d'Arme (100)",
                "val": "Qualité 100",
                "mult": "+30.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Évolution (100 pts)",
                "val": "100 pts",
                "mult": "+75.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Illumination (100 pts)",
                "val": "100 pts",
                "mult": "+70.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Bond (70 pts)",
                "val": "70 pts",
                "mult": "+14.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Rang d'Évolution (Rang 0 à 6)",
                "val": "+3.60%",
                "mult": "+3.60%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "Palier de Karma de transcendance T4 accordant un multiplicateur global."
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Niveau de Bond (Niv. 0 à 30)",
                "val": "+0.54%",
                "mult": "+0.54%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Grudge (Rancune) — Pierre +2",
                "val": "+24.75%",
                "mult": "+24.75%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Cursed Doll (Poupée Maudite)",
                "val": "+17.00%",
                "mult": "+17.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Adrenaline (Adrénaline)",
                "val": "+19.40%",
                "mult": "+19.40%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Raid Captain (Capitaine de Raid) — Pierre +2",
                "val": "+22.96%",
                "mult": "+22.96%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Keen Blunt Weapon (Arme Affûtée)",
                "val": "+16.62%",
                "mult": "+16.62%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Puissance d'Attaque (+1.60%)",
                "val": "+1.60%",
                "mult": "+1.23%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts Additionnels (+0.95%)",
                "val": "+0.95%",
                "mult": "+0.95%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts d'Allié (+3.00%)",
                "val": "+3.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Dégâts Additionnels (+0.95%)",
                "val": "+0.95%",
                "mult": "+0.95%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Dégâts d'Allié (+3.00%)",
                "val": "+3.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Dégâts d'Évolution (+0.95%)",
                "val": "+0.95%",
                "mult": "+0.74%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Dégâts d'Évolution (+0.95%)",
                "val": "+0.95%",
                "mult": "+0.74%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Dégâts infligés (+2.00%)",
                "val": "+2.00%",
                "mult": "+2.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Bonus passif d'accessoire T4 (Rang 3) : Dégâts infligés +2.00% (Outgoing Damage)."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Rapidité (+103)",
                "val": "+103",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de rapidité déjà intégrée directement dans les Stats de Combat en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Défense Magique (+5 000)",
                "val": "+5 000",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de défense magique déjà intégrée directement dans la Défense Magique en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Spécialisation (+78)",
                "val": "+78",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de spécialisation déjà intégrée directement dans les Stats de Combat en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Compétences Non Directionnelles (+3.5%)",
                "val": "+3.50%",
                "mult": "+3.50%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Compétences sans direction d'attaque +3.5% (hors compétences d'Éveil)."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Marteau (Dégâts Critiques +10% & Dégâts Coup Crit +1.5%)",
                "val": "+4.50%",
                "mult": "+4.50%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Crit Damage +10%. Crit Hit Damage +1.5%."
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Stats",
                "label": "Stats de Combat (2409 pts)",
                "val": "2409 stats",
                "mult": "+72.27%",
                "type": "DPS Net",
                "badge": "stat",
                "note": null
            },
            {
                "cat": "Cartes",
                "label": "Light of Salvation (Lumière du Salut) (Rang 6)",
                "val": "Rang 6",
                "mult": "+15.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Familier",
                "label": "Familier — Spécialité de Dégâts Additionnels",
                "val": "+0.00% ~ +0.77%",
                "mult": "+0.00% à +0.77%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "💡 Roll aléatoire de spécialité du familier (0.4% / 0.7% / 1.0%)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Ominous (18P | Order Sun)",
                "val": "18P",
                "mult": "+7.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Attack (18P | Chaos Star)",
                "val": "18P",
                "mult": "+2.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Critical Claws (20P | Order Star)",
                "val": "20P",
                "mult": "+6.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Flashy Attack (20P | Chaos Sun)",
                "val": "20P",
                "mult": "+4.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Demonic Clone (17P | Order Moon)",
                "val": "17P",
                "mult": "+8.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Smoldering Strike (18P | Chaos Moon)",
                "val": "18P",
                "mult": "+2.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Puissance d'Attaque (Attack Power) — Niv. 38",
                "val": "+1.39% (Niv. 38)",
                "mult": "+1.26%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.39% Puissance d'Attaque (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.26% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts Additionnels (Additional Damage) — Niv. 45",
                "val": "+3.63% (Niv. 45)",
                "mult": "+2.62%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +3.63% Dégâts Additionnels (cumul des astrogemmes). Multiplicateur Smilegate CP : +2.62% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts aux Boss (Boss Damage) — Niv. 14",
                "val": "+1.16% (Niv. 14)",
                "mult": "+1.16%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.16% Dégâts aux Boss (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.16% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés) — Niv. 24",
                "val": "+1.26% (Niv. 24)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+1.26%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Brand Power (Puissance de la Marque) — Niv. 16",
                "val": "+2.66% (Niv. 16)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+2.66%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Paradise",
                "label": "Orbe Trinity (28 254 617 pts)",
                "val": "28 254 617 pts",
                "mult": "+3.08%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            }
        ]
    },
    "kaarlach": {
        "name": "Kaarlach",
        "className": "Souleater",
        "spec": "Full Moon Harvester",
        "role": "dps",
        "ilvl": 1751,
        "inGameScore": 3185.88,
        "calculatedScore": 3222.14,
        "buffPower": 3222.14,
        "healPower": 0,
        "mainStat": 644083,
        "weaponPower": 219577,
        "baseAtk": 162587,
        "maxHp": 329996,
        "partsCount": 49,
        "gear": {
            "weapon": 19,
            "head": 15,
            "chest": 14,
            "pants": 14,
            "gloves": 15,
            "shoulder": 15
        },
        "advHoning": 40,
        "gemParts": [
            5.76,
            5.76,
            5.76,
            5.76,
            5.12,
            5.12
        ],
        "engravings": [
            {
                "grade": "engrave_grade05",
                "id": 1118,
                "progress": 0
            },
            {
                "grade": "engrave_grade04",
                "id": 1141,
                "progress": 15
            },
            {
                "grade": "engrave_grade05",
                "id": 1247,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1254,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1299,
                "progress": 0
            }
        ],
        "arkGridCores": [
            {
                "id": 673004435,
                "base": 10001,
                "gems": [
                    {
                        "id": 67401026,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 4
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673024435,
                "base": 10002,
                "gems": [
                    {
                        "id": 67401025,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 2
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673014436,
                "base": 10003,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 3
                            },
                            {
                                "id": 2002,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2003,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 4
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673120005,
                "base": 10004,
                "gems": [
                    {
                        "id": 67411325,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 5
                            },
                            {
                                "id": 2002,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 3
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673110005,
                "base": 10005,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 5
                            },
                            {
                                "id": 2001,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673102006,
                "base": 10006,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    }
                ]
            }
        ],
        "arkGrid": {
            "sun17": true,
            "moon17": true,
            "star17": true,
            "starTier": 3
        },
        "accRolled": true,
        "apPoints": {
            "enlightenment": 101,
            "evolution": 140,
            "leap": 70
        },
        "arkPassive": {
            "evolution": [
                {
                    "id": 1010100,
                    "level": 30
                },
                {
                    "id": 1010400,
                    "level": 10
                },
                {
                    "id": 1020400,
                    "level": 3
                },
                {
                    "id": 1030100,
                    "level": 2
                },
                {
                    "id": 1032100,
                    "level": 1
                },
                {
                    "id": 1032300,
                    "level": 1
                },
                {
                    "id": 1040400,
                    "level": 2
                }
            ],
            "enlightenment": [
                {
                    "id": 2460400,
                    "level": 1
                },
                {
                    "id": 2460600,
                    "level": 3
                },
                {
                    "id": 2460700,
                    "level": 3
                },
                {
                    "id": 2460800,
                    "level": 3
                },
                {
                    "id": 2460900,
                    "level": 1
                },
                {
                    "id": 2461000,
                    "level": 3
                }
            ],
            "leap": [
                {
                    "id": 2465300,
                    "level": 5
                },
                {
                    "id": 2465400,
                    "level": 5
                },
                {
                    "id": 2465700,
                    "level": 3
                }
            ]
        },
        "items": [
            {
                "cat": "Base",
                "label": "Attaque de Base (Stat: 644 083, Arme: 219 577)",
                "val": "162 587 AP",
                "mult": "Base Val: 468 249",
                "type": "DPS Net",
                "badge": "base"
            },
            {
                "cat": "Niveau",
                "label": "Niveau de Personnage 70",
                "val": "Niv. 70",
                "mult": "+29.45%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Qualité",
                "label": "Qualité d'Arme (96)",
                "val": "Qualité 96",
                "mult": "+28.44%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Évolution (100 pts)",
                "val": "100 pts",
                "mult": "+75.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Illumination (100 pts)",
                "val": "100 pts",
                "mult": "+70.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Bond (70 pts)",
                "val": "70 pts",
                "mult": "+14.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Rang d'Évolution (Rang 0 à 6)",
                "val": "+3.60%",
                "mult": "+3.60%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "Palier de Karma de transcendance T4 accordant un multiplicateur global."
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Niveau de Bond (Niv. 0 à 30)",
                "val": "+0.46%",
                "mult": "+0.46%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Grudge (Rancune)",
                "val": "+21.00%",
                "mult": "+21.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Keen Blunt Weapon (Arme Affûtée) — Pierre +3",
                "val": "+21.54%",
                "mult": "+21.54%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Cursed Doll (Poupée Maudite)",
                "val": "+17.00%",
                "mult": "+17.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Raid Captain (Capitaine de Raid) — Pierre +2",
                "val": "+22.96%",
                "mult": "+22.96%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Adrenaline (Adrénaline)",
                "val": "+19.40%",
                "mult": "+19.40%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Dégâts Critiques (+13.00%)",
                "val": "+13.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts Additionnels (+1.55%)",
                "val": "+1.55%",
                "mult": "+1.55%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Puissance d'Arme (+0.80%)",
                "val": "+0.80%",
                "mult": "+0.06%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts Critiques (+13.00%)",
                "val": "+13.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Dégâts d'Allié (+3.00%)",
                "val": "+3.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Dégâts Critiques (+13.00%)",
                "val": "+13.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Dégâts Critiques (+13.00%)",
                "val": "+13.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Dégâts infligés (+2.00%)",
                "val": "+2.00%",
                "mult": "+2.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Bonus passif d'accessoire T4 (Rang 3) : Dégâts infligés +2.00% (Outgoing Damage)."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Rapidité (+81)",
                "val": "+81",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de rapidité déjà intégrée directement dans les Stats de Combat en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Expertise (+97)",
                "val": "+97",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute d'expertise déjà intégrée directement dans les Stats de Combat en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Puissance d'Attaque (+3.50%)",
                "val": "+3.50%",
                "mult": "+2.69%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Coinçage (Dégâts Additionnels +3.5% & Démons +2.5%)",
                "val": "+4.50%",
                "mult": "+4.50%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Additional Damage +3.5%. Bonus vs. Demon/Archdemon +2.5%."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Ferveur (Dégâts Sortants +5% & Cooldown +2%)",
                "val": "+4.00%",
                "mult": "+4.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Skill cooldown +2%. Outgoing Damage +5%."
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts Majeurs)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Stats",
                "label": "Stats de Combat (2469 pts)",
                "val": "2469 stats",
                "mult": "+74.07%",
                "type": "DPS Net",
                "badge": "stat",
                "note": null
            },
            {
                "cat": "Cartes",
                "label": "Light of Salvation (Lumière du Salut) (Rang 6)",
                "val": "Rang 6",
                "mult": "+15.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Familier",
                "label": "Familier — Spécialité de Dégâts Additionnels",
                "val": "+0.00% ~ +0.77%",
                "mult": "+0.00% à +0.77%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "💡 Roll aléatoire de spécialité du familier (0.4% / 0.7% / 1.0%)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Deathlord's Call (18P | Order Sun)",
                "val": "18P",
                "mult": "+7.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Deathlord's Power (18P | Order Star)",
                "val": "18P",
                "mult": "+4.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Moonlit Midnight (18P | Order Moon)",
                "val": "18P",
                "mult": "+8.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Attack (17P | Chaos Star)",
                "val": "17P",
                "mult": "+2.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Smoldering Strike (18P | Chaos Moon)",
                "val": "18P",
                "mult": "+2.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Swift Attack (18P | Chaos Sun)",
                "val": "18P",
                "mult": "+2.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Puissance d'Attaque (Attack Power) — Niv. 54",
                "val": "+1.98% (Niv. 54)",
                "mult": "+1.80%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.98% Puissance d'Attaque (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.80% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts Additionnels (Additional Damage) — Niv. 27",
                "val": "+2.18% (Niv. 27)",
                "mult": "+1.57%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +2.18% Dégâts Additionnels (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.57% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts aux Boss (Boss Damage) — Niv. 1",
                "val": "+0.08% (Niv. 1)",
                "mult": "+0.08%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +0.08% Dégâts aux Boss (cumul des astrogemmes). Multiplicateur Smilegate CP : +0.08% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés) — Niv. 30",
                "val": "+1.57% (Niv. 30)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+1.57%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Brand Power (Puissance de la Marque) — Niv. 17",
                "val": "+2.83% (Niv. 17)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+2.83%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Paradise",
                "label": "Orbe Trinity (16 687 220 pts)",
                "val": "16 687 220 pts",
                "mult": "+1.92%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            }
        ]
    },
    "neeverslayer": {
        "name": "Neeverslayer",
        "className": "Slayer",
        "spec": "Predator",
        "role": "dps",
        "ilvl": 1752.5,
        "inGameScore": 4170.58,
        "calculatedScore": 4200.72,
        "buffPower": 4200.72,
        "healPower": 0,
        "mainStat": 637543,
        "weaponPower": 248550,
        "baseAtk": 180822,
        "maxHp": 341200,
        "partsCount": 50,
        "gear": {
            "weapon": 20,
            "head": 14,
            "chest": 14,
            "pants": 15,
            "gloves": 15,
            "shoulder": 15
        },
        "advHoning": 40,
        "gemParts": [
            6.4,
            6.4,
            6.4,
            6.4,
            5.76,
            5.76,
            5.76,
            6.4,
            5.76,
            5.76,
            5.76
        ],
        "engravings": [
            {
                "grade": "engrave_grade05",
                "id": 1118,
                "progress": 0
            },
            {
                "grade": "engrave_grade04",
                "id": 1249,
                "progress": 7
            },
            {
                "grade": "engrave_grade05",
                "id": 1254,
                "progress": 0
            },
            {
                "grade": "engrave_grade04",
                "id": 1295,
                "progress": 2
            },
            {
                "grade": "engrave_grade05",
                "id": 1247,
                "progress": 0
            }
        ],
        "arkGridCores": [
            {
                "id": 673004065,
                "base": 10001,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401025,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 5
                            },
                            {
                                "id": 2011,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2003,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673023065,
                "base": 10002,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 4
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 4
                            },
                            {
                                "id": 2012,
                                "level": 2
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673015065,
                "base": 10003,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 2,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67401025,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 5
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401025,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 4
                            },
                            {
                                "id": 2011,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 3
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673100005,
                "base": 10004,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 5
                            },
                            {
                                "id": 2002,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 5
                            },
                            {
                                "id": 2002,
                                "level": 4
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673110005,
                "base": 10005,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 2
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673121005,
                "base": 10006,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    }
                ]
            }
        ],
        "arkGrid": {
            "sun17": true,
            "moon17": true,
            "star17": true,
            "starTier": 3
        },
        "accRolled": true,
        "apPoints": {
            "enlightenment": 101,
            "evolution": 140,
            "leap": 70
        },
        "arkPassive": {
            "evolution": [
                {
                    "id": 1010100,
                    "level": 20
                },
                {
                    "id": 1010400,
                    "level": 20
                },
                {
                    "id": 1020200,
                    "level": 2
                },
                {
                    "id": 1020400,
                    "level": 1
                },
                {
                    "id": 1030300,
                    "level": 2
                },
                {
                    "id": 1032100,
                    "level": 1
                },
                {
                    "id": 1032300,
                    "level": 1
                },
                {
                    "id": 1040200,
                    "level": 2
                }
            ],
            "enlightenment": [
                {
                    "id": 2450010,
                    "level": 1
                },
                {
                    "id": 2450030,
                    "level": 3
                },
                {
                    "id": 2450060,
                    "level": 3
                },
                {
                    "id": 2450070,
                    "level": 2
                },
                {
                    "id": 2450100,
                    "level": 3
                }
            ],
            "leap": [
                {
                    "id": 2455300,
                    "level": 5
                },
                {
                    "id": 2455400,
                    "level": 4
                },
                {
                    "id": 2455500,
                    "level": 2
                },
                {
                    "id": 2455900,
                    "level": 3
                }
            ]
        },
        "items": [
            {
                "cat": "Base",
                "label": "Attaque de Base (Stat: 633 810, Arme: 248 550)",
                "val": "180 346 AP",
                "mult": "Base Val: 519 396",
                "type": "DPS Net",
                "badge": "base"
            },
            {
                "cat": "Niveau",
                "label": "Niveau de Personnage 70",
                "val": "Niv. 70",
                "mult": "+29.45%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Qualité",
                "label": "Qualité d'Arme (94)",
                "val": "Qualité 94",
                "mult": "+27.68%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Évolution (100 pts)",
                "val": "100 pts",
                "mult": "+75.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Illumination (100 pts)",
                "val": "100 pts",
                "mult": "+70.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Bond (70 pts)",
                "val": "70 pts",
                "mult": "+14.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Rang d'Évolution (Rang 0 à 6)",
                "val": "+3.60%",
                "mult": "+3.60%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "Palier de Karma de transcendance T4 accordant un multiplicateur global."
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Niveau de Bond (Niv. 0 à 30)",
                "val": "+0.48%",
                "mult": "+0.48%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Grudge (Rancune)",
                "val": "+21.00%",
                "mult": "+21.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Ambush Master (Maître des Arrières) — Pierre +3",
                "val": "+20.70%",
                "mult": "+20.70%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Raid Captain (Capitaine de Raid)",
                "val": "+19.20%",
                "mult": "+19.20%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Mass Increase (Augmentation de Masse) — Pierre +2",
                "val": "+19.75%",
                "mult": "+19.75%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Cursed Doll (Poupée Maudite)",
                "val": "+17.00%",
                "mult": "+17.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Puissance d'Arme (+0.80%)",
                "val": "+0.80%",
                "mult": "+0.06%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts d'Allié (+3.00%)",
                "val": "+3.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Dégâts d'Allié (+3.00%)",
                "val": "+3.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Puissance d'Attaque d'Allié (+1.95%)",
                "val": "+1.95%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Dégâts infligés (+2.00%)",
                "val": "+2.00%",
                "mult": "+2.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Bonus passif d'accessoire T4 (Rang 3) : Dégâts infligés +2.00% (Outgoing Damage)."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Rapidité (+84)",
                "val": "+84",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de rapidité déjà intégrée directement dans les Stats de Combat en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Force (+15 744)",
                "val": "+15 744",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de force déjà intégrée directement dans l'Attaque de Base (Base AP) en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Puissance d'Arme (+7 200)",
                "val": "+7 200",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de puissance d'arme déjà intégrée directement dans l'Attaque de Base en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Dégâts Critiques (+6.80%)",
                "val": "+6.80%",
                "mult": "+2.27%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Précision (Taux Critique +3.4% & Dégâts Coup Crit +1.5%)",
                "val": "+3.50%",
                "mult": "+3.50%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Crit Rate +3.4%. Crit Hit Damage +1.5%."
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 9 (Dégâts Majeurs)",
                "val": "+6.40%",
                "mult": "+6.40%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 9 (Dégâts Majeurs)",
                "val": "+6.40%",
                "mult": "+6.40%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 9 (Dégâts Majeurs)",
                "val": "+6.40%",
                "mult": "+6.40%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 9 (Dégâts)",
                "val": "+6.40%",
                "mult": "+6.40%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 9 (Dégâts Majeurs)",
                "val": "+6.40%",
                "mult": "+6.40%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Stats",
                "label": "Stats de Combat (2472 pts)",
                "val": "2472 stats",
                "mult": "+74.16%",
                "type": "DPS Net",
                "badge": "stat",
                "note": null
            },
            {
                "cat": "Cartes",
                "label": "Light of Salvation (Lumière du Salut) (Rang 6)",
                "val": "Rang 6",
                "mult": "+15.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Familier",
                "label": "Familier — Spécialité de Dégâts Additionnels",
                "val": "+0.00% ~ +0.77%",
                "mult": "+0.00% à +0.77%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "💡 Roll aléatoire de spécialité du familier (0.4% / 0.7% / 1.0%)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Unpredictable (18P | Order Sun)",
                "val": "18P",
                "mult": "+7.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Swift Execution (18P | Order Star)",
                "val": "18P",
                "mult": "+4.67%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Spiral Tempest (17P | Order Moon)",
                "val": "17P",
                "mult": "+7.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Flashy Attack (17P | Chaos Sun)",
                "val": "17P",
                "mult": "+2.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Smoldering Strike (17P | Chaos Moon)",
                "val": "17P",
                "mult": "+2.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Puissance d'Attaque (Attack Power) — Niv. 29",
                "val": "+1.06% (Niv. 29)",
                "mult": "+0.96%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.06% Puissance d'Attaque (cumul des astrogemmes). Multiplicateur Smilegate CP : +0.96% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts Additionnels (Additional Damage) — Niv. 27",
                "val": "+2.18% (Niv. 27)",
                "mult": "+1.57%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +2.18% Dégâts Additionnels (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.57% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts aux Boss (Boss Damage) — Niv. 6",
                "val": "+0.50% (Niv. 6)",
                "mult": "+0.50%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +0.50% Dégâts aux Boss (cumul des astrogemmes). Multiplicateur Smilegate CP : +0.50% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés) — Niv. 32",
                "val": "+1.68% (Niv. 32)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+1.68%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Brand Power (Puissance de la Marque) — Niv. 30",
                "val": "+5.00% (Niv. 30)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+5.00%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Paradise",
                "label": "Orbe Trinity (16 402 097 pts)",
                "val": "16 402 097 pts",
                "mult": "+1.13%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            }
        ]
    },
    "jigokuushoujo": {
        "name": "Jigokuushoujo",
        "className": "Bard",
        "spec": "Desperate Salvation",
        "role": "support",
        "ilvl": 1742,
        "inGameScore": 3071.91,
        "calculatedScore": 3244.36,
        "buffPower": 2622.92,
        "healPower": 621.45,
        "mainStat": 616999,
        "weaponPower": 201979,
        "baseAtk": 154495,
        "maxHp": 361199,
        "partsCount": 53,
        "gear": {
            "weapon": 14,
            "head": 14,
            "chest": 14,
            "pants": 13,
            "gloves": 13,
            "shoulder": 13
        },
        "advHoning": 40,
        "gemParts": [
            8.75,
            8.75,
            8.75,
            8.75,
            10,
            10,
            10,
            8.75,
            8.75,
            8.75,
            8.75
        ],
        "engravings": [
            {
                "grade": "engrave_grade04",
                "id": 1255,
                "progress": 10
            },
            {
                "grade": "engrave_grade05",
                "id": 1251,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1134,
                "progress": 0
            },
            {
                "grade": "engrave_grade04",
                "id": 1301,
                "progress": 2
            },
            {
                "grade": "engrave_grade05",
                "id": 1167,
                "progress": 0
            }
        ],
        "arkGridCores": [
            {
                "id": 673004325,
                "base": 10001,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 3
                            },
                            {
                                "id": 2012,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2013,
                                "level": 5
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673025325,
                "base": 10002,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 5
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2001,
                                "level": 2
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673014325,
                "base": 10003,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 1
                            },
                            {
                                "id": 2012,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 2
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673121005,
                "base": 10004,
                "gems": [
                    {
                        "id": 67411325,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 5
                            },
                            {
                                "id": 2012,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2013,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2013,
                                "level": 4
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673113005,
                "base": 10005,
                "gems": [
                    {
                        "id": 67411325,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 3
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411326,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 5
                            },
                            {
                                "id": 2012,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673105005,
                "base": 10006,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 2
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2013,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 5
                            },
                            {
                                "id": 2012,
                                "level": 3
                            }
                        ]
                    }
                ]
            }
        ],
        "arkGrid": {
            "sun17": true,
            "moon17": true,
            "star17": true,
            "starTier": 3
        },
        "accRolled": true,
        "apPoints": {
            "enlightenment": 101,
            "evolution": 140,
            "leap": 70
        },
        "arkPassive": {
            "evolution": [
                {
                    "id": 1010200,
                    "level": 10
                },
                {
                    "id": 1010400,
                    "level": 30
                },
                {
                    "id": 1020600,
                    "level": 3
                },
                {
                    "id": 1030600,
                    "level": 2
                },
                {
                    "id": 1032400,
                    "level": 1
                },
                {
                    "id": 1032600,
                    "level": 1
                },
                {
                    "id": 1040400,
                    "level": 2
                }
            ],
            "enlightenment": [
                {
                    "id": 2210000,
                    "level": 3
                },
                {
                    "id": 2210200,
                    "level": 3
                },
                {
                    "id": 2210500,
                    "level": 3
                },
                {
                    "id": 2210800,
                    "level": 2
                },
                {
                    "id": 2210900,
                    "level": 3
                }
            ],
            "leap": [
                {
                    "id": 2215000,
                    "level": 2
                },
                {
                    "id": 2215200,
                    "level": 3
                },
                {
                    "id": 2215400,
                    "level": 5
                },
                {
                    "id": 2215500,
                    "level": 3
                },
                {
                    "id": 2215700,
                    "level": 3
                }
            ]
        },
        "items": [
            {
                "cat": "Base",
                "label": "Attaque de Base (Stat: 616 999, Arme: 201 979)",
                "val": "154 495 AP",
                "mult": "Base Val: 191 574",
                "type": "Buff Power",
                "badge": "base"
            },
            {
                "cat": "Base",
                "label": "Points de Vie Maximum (Vitalité)",
                "val": "361 199 HP",
                "mult": "Base Val: 4 334 388",
                "type": "Heal / Shield",
                "badge": "base"
            },
            {
                "cat": "Niveau",
                "label": "Niveau de Personnage 70",
                "val": "Niv. 70",
                "mult": "+4.76%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Qualité",
                "label": "Qualité d'Arme (100)",
                "val": "Qualité 100",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Bonus de dégâts solo perso : 0% transféré aux alliés (exclu du Buff Power)."
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Évolution (100 pts)",
                "val": "100 pts",
                "mult": "+160.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Illumination (100 pts)",
                "val": "100 pts",
                "mult": "+72.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Bond (70 pts)",
                "val": "70 pts",
                "mult": "+14.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Rang d'Évolution (Rang 0 à 6)",
                "val": "+3.60%",
                "mult": "+3.60%",
                "type": "Buff Power",
                "badge": "passive",
                "note": "Palier de Karma de transcendance T4 accordant un multiplicateur global."
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Niveau de Bond (Niv. 0 à 30)",
                "val": "+0.00%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": "💡 Dégâts de bond solo perso : exclu du Buff Power en Support."
            },
            {
                "cat": "Gravures",
                "label": "Awakening (Éveil) — Pierre +3",
                "val": "+33.75%",
                "mult": "+33.75%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Magick Stream (Flux Magique)",
                "val": "+20.00%",
                "mult": "+20.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Drops of Ether (Gouttes d'Éther) — Pierre +1",
                "val": "+30.72%",
                "mult": "+30.72%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Expert (Expert)",
                "val": "+39.20%",
                "mult": "+39.20%",
                "type": "Heal / Shield",
                "badge": "defense",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Puissance d'Attaque Flat (+215)",
                "val": "+215 AP",
                "mult": "+1.29%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Ligne Affinée (+0.95%)",
                "val": "+0.95%",
                "mult": "+0.67%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts d'Allié (+1.80%)",
                "val": "+1.80%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Ligne Affinée (+0.95%)",
                "val": "+0.95%",
                "mult": "+0.67%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Dégâts d'Allié (+1.80%)",
                "val": "+1.80%",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Ligne Affinée (+2.10%)",
                "val": "+2.10%",
                "mult": "+1.47%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Efficacité Bouclier / Soins (+7.50%)",
                "val": "+7.50%",
                "mult": "+3.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Ligne Affinée (+1.35%)",
                "val": "+1.35%",
                "mult": "+1.01%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Efficacité Bouclier / Soins (+7.50%)",
                "val": "+7.50%",
                "mult": "+3.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Ligne Affinée (+1.35%)",
                "val": "+1.35%",
                "mult": "+1.01%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Ligne d'Affinage",
                "val": "+3.00%",
                "mult": "+3.00%",
                "type": "Heal / Shield",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Vitalité (+5 200)",
                "val": "+5 200",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute de vitalité déjà intégrée directement dans les Points de Vie Maximum (HP) en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Intelligence (+13 312)",
                "val": "+13 312",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 Stat brute de intelligence déjà intégrée directement dans l'Attaque de Base (Base AP) en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Exposition Crit (Résistance Crit -1.8% & AP Allié +2%)",
                "val": "+9.06%",
                "mult": "+9.06%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 On hit, target's Crit Resistance -1.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Poignard / Faiblesse (Défense -1.8% & AP Allié +2%)",
                "val": "+9.06%",
                "mult": "+9.06%",
                "type": "Buff Power",
                "badge": "gear",
                "note": "💡 On hit, target's Defense -1.8% for 8s. This effect is limited to a single application per party. Ally Atk. Power Enhancement +2%."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Points de Vie Max (+11 200)",
                "val": "+11 200",
                "mult": "+0.00%",
                "type": "Heal / Shield",
                "badge": "gear",
                "note": "💡 Stat brute de PV max déjà intégrée directement dans les Points de Vie Maximum (HP) en tête de liste."
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts Majeurs)",
                "val": "+10.00%",
                "mult": "+10.00%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Dégâts)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+8.75%",
                "mult": "+8.75%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Stats",
                "label": "Stats de Combat (2312 pts)",
                "val": "2312 stats",
                "mult": "+92.48%",
                "type": "Buff Power",
                "badge": "stat",
                "note": null
            },
            {
                "cat": "Cartes",
                "label": "Lostwind Cliff (Falaise du Vent Perdu) (Rang 6)",
                "val": "Rang 6",
                "mult": "+21.00%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Brave Accent (19P | Order Sun)",
                "val": "19P",
                "mult": "+8.10%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Buckshot Acceleration (17P | Order Star)",
                "val": "17P",
                "mult": "+2.10%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Brave Pulse (19P | Order Moon)",
                "val": "19P",
                "mult": "+8.10%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Echoing Brand (17P | Chaos Moon)",
                "val": "17P",
                "mult": "+3.60%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Fortitude Enhancement (17P | Chaos Sun)",
                "val": "17P",
                "mult": "+1.32%",
                "type": "Buff Power",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés) — Niv. 34",
                "val": "+1.78% (Niv. 34)",
                "mult": "+1.70%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.78% Amélioration Dégâts Alliés (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.70% Buff Power."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Brand Power (Puissance de la Marque) — Niv. 31",
                "val": "+5.16% (Niv. 31)",
                "mult": "+2.71%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Effet in-game : +5.16% Puissance de Marque (cumul des astrogemmes). Multiplicateur Smilegate CP : +2.71% Buff Power."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Attack Enh. (Amélioration AP Allié) — Niv. 13",
                "val": "+1.69% (Niv. 13)",
                "mult": "+1.62%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.69% Amélioration AP Allié (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.62% Buff Power."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Puissance d'Attaque (Attack Power) — Niv. 30",
                "val": "+1.10% (Niv. 30)",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Stat brute puissance d'attaque solo perso (+1.10%) : exclue du calcul du Buff Power en Support (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts Additionnels (Additional Damage) — Niv. 18",
                "val": "+1.45% (Niv. 18)",
                "mult": "+0.00%",
                "type": "Buff Power",
                "badge": "stat",
                "note": "💡 Stat brute dégâts additionnels solo perso (+1.45%) : exclue du calcul du Buff Power en Support (Smilegate Battle Point)."
            },
            {
                "cat": "Paradise",
                "label": "Orbe Trinity (18 812 397 pts)",
                "val": "18 812 397 pts",
                "mult": "+1.30%",
                "type": "Buff Power",
                "badge": "gear",
                "note": null
            }
        ]
    },
    "neverbreak": {
        "name": "Neverbreak",
        "className": "Breaker",
        "spec": "Asura's Path",
        "role": "dps",
        "ilvl": 1736,
        "inGameScore": 3692.05,
        "calculatedScore": 3756.48,
        "buffPower": 3756.48,
        "healPower": 0,
        "mainStat": 583462,
        "weaponPower": 203053,
        "baseAtk": 151199,
        "maxHp": 360790,
        "partsCount": 54,
        "gear": {
            "weapon": 17,
            "head": 11,
            "chest": 11,
            "pants": 12,
            "gloves": 12,
            "shoulder": 11
        },
        "advHoning": 40,
        "gemParts": [
            5.76,
            5.12,
            5.12,
            5.12,
            5.12,
            5.76,
            5.12,
            5.76,
            5.76,
            5.76,
            5.12
        ],
        "engravings": [
            {
                "grade": "engrave_grade05",
                "id": 1118,
                "progress": 0
            },
            {
                "grade": "engrave_grade04",
                "id": 1141,
                "progress": 16
            },
            {
                "grade": "engrave_grade05",
                "id": 1254,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1288,
                "progress": 0
            },
            {
                "grade": "engrave_grade05",
                "id": 1299,
                "progress": 0
            }
        ],
        "arkGridCores": [
            {
                "id": 673024275,
                "base": 10001,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 1
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 3
                            },
                            {
                                "id": 2011,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673014275,
                "base": 10002,
                "gems": [
                    {
                        "id": 67401025,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 4
                            },
                            {
                                "id": 2012,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2012,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673110005,
                "base": 10003,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 2,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 2
                            },
                            {
                                "id": 2003,
                                "level": 2
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 5
                            },
                            {
                                "id": 2002,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673005275,
                "base": 10004,
                "gems": [
                    {
                        "id": 67401024,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2012,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 2
                            },
                            {
                                "id": 2011,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67401024,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2011,
                                "level": 1
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    },
                    {
                        "id": 67401124,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 1
                            },
                            {
                                "id": 2013,
                                "level": 5
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673120005,
                "base": 10005,
                "gems": [
                    {
                        "id": 67411324,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 1
                            },
                            {
                                "id": 2012,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 1
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 3,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 3
                            },
                            {
                                "id": 2002,
                                "level": 3
                            }
                        ]
                    }
                ]
            },
            {
                "id": 673102005,
                "base": 10006,
                "gems": [
                    {
                        "id": 67411325,
                        "idx": 0,
                        "costReduc": 5,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411424,
                        "idx": 1,
                        "costReduc": 5,
                        "corePoints": 3,
                        "opts": [
                            {
                                "id": 2003,
                                "level": 2
                            },
                            {
                                "id": 2001,
                                "level": 5
                            }
                        ]
                    },
                    {
                        "id": 67411325,
                        "idx": 2,
                        "costReduc": 4,
                        "corePoints": 5,
                        "opts": [
                            {
                                "id": 2002,
                                "level": 3
                            },
                            {
                                "id": 2012,
                                "level": 4
                            }
                        ]
                    },
                    {
                        "id": 67411324,
                        "idx": 3,
                        "costReduc": 4,
                        "corePoints": 4,
                        "opts": [
                            {
                                "id": 2001,
                                "level": 4
                            },
                            {
                                "id": 2002,
                                "level": 1
                            }
                        ]
                    }
                ]
            }
        ],
        "arkGrid": {
            "sun17": true,
            "moon17": true,
            "star17": true,
            "starTier": 3
        },
        "accRolled": true,
        "apPoints": {
            "enlightenment": 101,
            "evolution": 140,
            "leap": 70
        },
        "arkPassive": {
            "evolution": [
                {
                    "id": 1010100,
                    "level": 30
                },
                {
                    "id": 1010400,
                    "level": 10
                },
                {
                    "id": 1020300,
                    "level": 2
                },
                {
                    "id": 1020400,
                    "level": 1
                },
                {
                    "id": 1030300,
                    "level": 2
                },
                {
                    "id": 1032100,
                    "level": 1
                },
                {
                    "id": 1032300,
                    "level": 1
                },
                {
                    "id": 1040100,
                    "level": 2
                }
            ],
            "enlightenment": [
                {
                    "id": 2470100,
                    "level": 1
                },
                {
                    "id": 2470300,
                    "level": 3
                },
                {
                    "id": 2470600,
                    "level": 3
                },
                {
                    "id": 2470700,
                    "level": 2
                },
                {
                    "id": 2471000,
                    "level": 3
                }
            ],
            "leap": [
                {
                    "id": 2475300,
                    "level": 5
                },
                {
                    "id": 2475400,
                    "level": 5
                },
                {
                    "id": 2475600,
                    "level": 3
                }
            ]
        },
        "items": [
            {
                "cat": "Base",
                "label": "Attaque de Base (Stat: 583 462, Arme: 203 053)",
                "val": "151 199 AP",
                "mult": "Base Val: 435 452",
                "type": "DPS Net",
                "badge": "base"
            },
            {
                "cat": "Niveau",
                "label": "Niveau de Personnage 70",
                "val": "Niv. 70",
                "mult": "+29.45%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Qualité",
                "label": "Qualité d'Arme (94)",
                "val": "Qualité 94",
                "mult": "+27.68%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Évolution (100 pts)",
                "val": "100 pts",
                "mult": "+75.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Illumination (100 pts)",
                "val": "100 pts",
                "mult": "+70.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Ark Passive",
                "label": "Ark Passive — Bond (70 pts)",
                "val": "70 pts",
                "mult": "+14.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Rang d'Évolution (Rang 0 à 6)",
                "val": "+3.60%",
                "mult": "+3.60%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "Palier de Karma de transcendance T4 accordant un multiplicateur global."
            },
            {
                "cat": "Karma",
                "label": "Karma T4 — Niveau de Bond (Niv. 0 à 30)",
                "val": "+0.52%",
                "mult": "+0.52%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Grudge (Rancune) — Pierre +3",
                "val": "+26.25%",
                "mult": "+26.25%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Keen Blunt Weapon (Arme Affûtée)",
                "val": "+16.62%",
                "mult": "+16.62%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Raid Captain (Capitaine de Raid)",
                "val": "+19.20%",
                "mult": "+19.20%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Master Brawler (Maître Bagarreur)",
                "val": "+18.10%",
                "mult": "+18.10%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Gravures",
                "label": "Adrenaline (Adrénaline) — Pierre +1",
                "val": "+22.28%",
                "mult": "+22.28%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Puissance d'Arme (+0.80%)",
                "val": "+0.80%",
                "mult": "+0.06%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts Additionnels (+1.55%)",
                "val": "+1.55%",
                "mult": "+1.55%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Puissance d'Arme (+0.80%)",
                "val": "+0.80%",
                "mult": "+0.06%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #1 — Dégâts Critiques (+13.00%)",
                "val": "+13.00%",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute déjà agrégée directement dans l'Attaque de Base ou la Vitalité en tête de liste."
            },
            {
                "cat": "Accessoires",
                "label": "Boucle d'oreille #2 — Dégâts Additionnels (+1.55%)",
                "val": "+1.55%",
                "mult": "+1.55%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #1 — Puissance d'Arme (+0.80%)",
                "val": "+0.80%",
                "mult": "+0.06%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Anneau #2 — Dégâts de Compétence (+4.00%)",
                "val": "+4.00%",
                "mult": "+1.20%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Accessoires",
                "label": "Collier — Dégâts infligés (+2.00%)",
                "val": "+2.00%",
                "mult": "+2.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Bonus passif d'accessoire T4 (Rang 3) : Dégâts infligés +2.00% (Outgoing Damage)."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Vitalité (+4 821)",
                "val": "+4 821",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de vitalité déjà intégrée directement dans les Points de Vie Maximum (HP) en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Force (+10 880)",
                "val": "+10 880",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Stat brute de force déjà intégrée directement dans l'Attaque de Base (Base AP) en tête de liste."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Marteau (Dégâts Critiques +8.4% & Dégâts Coup Crit +1.5%)",
                "val": "+4.00%",
                "mult": "+4.00%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Crit Damage +8.4%. Crit Hit Damage +1.5%."
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Puissance d'Attaque (+3.00%)",
                "val": "+3.00%",
                "mult": "+2.31%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Bracelet",
                "label": "Bracelet Ancien — Coinçage (Dégâts Additionnels +2.5% & Démons +2.5%)",
                "val": "+3.50%",
                "mult": "+3.50%",
                "type": "DPS Net",
                "badge": "gear",
                "note": "💡 Additional Damage +2.5%. Bonus vs. Demon/Archdemon +2.5%."
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts Majeurs)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Dégâts)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Rechargement)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 8 (Dégâts Majeurs)",
                "val": "+5.76%",
                "mult": "+5.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Gemmes",
                "label": "Gemme T4 Niv. 7 (Rechargement)",
                "val": "+5.12%",
                "mult": "+5.12%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            },
            {
                "cat": "Stats",
                "label": "Stats de Combat (2388 pts)",
                "val": "2388 stats",
                "mult": "+71.64%",
                "type": "DPS Net",
                "badge": "stat",
                "note": null
            },
            {
                "cat": "Cartes",
                "label": "Light of Salvation (Lumière du Salut) (Rang 6)",
                "val": "Rang 6",
                "mult": "+15.00%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Familier",
                "label": "Familier — Spécialité de Dégâts Additionnels",
                "val": "+0.00% ~ +0.77%",
                "mult": "+0.00% à +0.77%",
                "type": "DPS Net",
                "badge": "passive",
                "note": "💡 Roll aléatoire de spécialité du familier (0.4% / 0.7% / 1.0%)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Asura (17P | Order Star)",
                "val": "17P",
                "mult": "+4.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Asura War (17P | Order Moon)",
                "val": "17P",
                "mult": "+7.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Smoldering Strike (17P | Chaos Moon)",
                "val": "17P",
                "mult": "+2.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Shadow Fist (17P | Order Sun)",
                "val": "17P",
                "mult": "+7.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Attack (17P | Chaos Star)",
                "val": "17P",
                "mult": "+2.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Swift Attack (17P | Chaos Sun)",
                "val": "17P",
                "mult": "+1.50%",
                "type": "DPS Net",
                "badge": "passive",
                "note": null
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Puissance d'Attaque (Attack Power) — Niv. 39",
                "val": "+1.43% (Niv. 39)",
                "mult": "+1.30%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +1.43% Puissance d'Attaque (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.30% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts Additionnels (Additional Damage) — Niv. 33",
                "val": "+2.66% (Niv. 33)",
                "mult": "+1.92%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +2.66% Dégâts Additionnels (cumul des astrogemmes). Multiplicateur Smilegate CP : +1.92% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Dégâts aux Boss (Boss Damage) — Niv. 10",
                "val": "+0.83% (Niv. 10)",
                "mult": "+0.83%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Effet in-game : +0.83% Dégâts aux Boss (cumul des astrogemmes). Multiplicateur Smilegate CP : +0.83% DPS Net."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Damage Enh. (Amélioration Dégâts Alliés) — Niv. 21",
                "val": "+1.10% (Niv. 21)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+1.10%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Brand Power (Puissance de la Marque) — Niv. 13",
                "val": "+2.16% (Niv. 13)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+2.16%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Grille d'Ark",
                "label": "Astrogemmes — Ally Attack Enh. (Amélioration AP Allié) — Niv. 5",
                "val": "+0.65% (Niv. 5)",
                "mult": "+0.00%",
                "type": "DPS Net",
                "badge": "stat",
                "note": "💡 Stat support (+0.65%) : non applicable aux dégâts solo en DPS (Smilegate Battle Point)."
            },
            {
                "cat": "Paradise",
                "label": "Orbe Trinity (15 140 921 pts)",
                "val": "15 140 921 pts",
                "mult": "+1.76%",
                "type": "DPS Net",
                "badge": "gear",
                "note": null
            }
        ]
    }
};;

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
      icon: '🏛️',
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
      icon: '🥀',
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
      icon: '👑',
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
    valkyrie: { default: "Knight of Light", alt: "Liberator", keys: ["knight of light", "liberator", "valkyrie", "holyknight_female", "holyknightfemale"] },
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

window.ALPHA_KNOWN_ACCESSORIES = [
  {
    "slot": "neck",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 13
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 3789
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 15446
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 15446
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 15446
        },
        {
          "type": 4,
          "index": 621000001,
          "base": false,
          "value": 0
        },
        {
          "type": 2,
          "index": 50,
          "base": false,
          "value": 160
        },
        {
          "type": 2,
          "index": 124,
          "base": false,
          "value": 390
        }
      ]
    }
  },
  {
    "slot": "ear1",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2707
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 12015
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 12015
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 12015
        },
        {
          "type": 2,
          "index": 49,
          "base": false,
          "value": 95
        },
        {
          "type": 2,
          "index": 152,
          "base": false,
          "value": 180
        },
        {
          "type": 2,
          "index": 124,
          "base": false,
          "value": 390
        }
      ]
    }
  },
  {
    "slot": "ear2",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2707
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 12015
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 12015
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 12015
        },
        {
          "type": 2,
          "index": 49,
          "base": false,
          "value": 95
        },
        {
          "type": 2,
          "index": 152,
          "base": false,
          "value": 180
        },
        {
          "type": 2,
          "index": 124,
          "base": false,
          "value": 390
        }
      ]
    }
  },
  {
    "slot": "finger1",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2166
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 11156
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 11156
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 11156
        },
        {
          "type": 2,
          "index": 76,
          "base": false,
          "value": 240
        },
        {
          "type": 2,
          "index": 74,
          "base": false,
          "value": 95
        },
        {
          "type": 2,
          "index": 124,
          "base": false,
          "value": 390
        }
      ]
    }
  },
  {
    "slot": "finger2",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2166
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 11156
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 11156
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 11156
        },
        {
          "type": 2,
          "index": 76,
          "base": false,
          "value": 240
        },
        {
          "type": 2,
          "index": 74,
          "base": false,
          "value": 95
        },
        {
          "type": 2,
          "index": 124,
          "base": false,
          "value": 390
        }
      ]
    }
  }
];;
window.NEVERSUP_KNOWN_ACCESSORIES = [
  {
    "slot": "neck",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 13
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 3824
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 17777
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 17777
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 17777
        },
        {
          "type": 2,
          "index": 46,
          "base": false,
          "value": 800
        },
        {
          "type": 2,
          "index": 50,
          "base": false,
          "value": 160
        },
        {
          "type": 2,
          "index": 151,
          "base": false,
          "value": 195
        }
      ]
    }
  },
  {
    "slot": "ear1",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2817
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 12119
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 12119
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 12119
        },
        {
          "type": 51,
          "index": 0,
          "base": false,
          "value": 210
        },
        {
          "type": 2,
          "index": 152,
          "base": false,
          "value": 180
        },
        {
          "type": 2,
          "index": 27,
          "base": false,
          "value": 1300
        }
      ]
    }
  },
  {
    "slot": "ear2",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2705
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 13806
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 13806
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 13806
        },
        {
          "type": 2,
          "index": 152,
          "base": false,
          "value": 180
        },
        {
          "type": 2,
          "index": 34,
          "base": false,
          "value": 25
        },
        {
          "type": 2,
          "index": 49,
          "base": false,
          "value": 95
        }
      ]
    }
  },
  {
    "slot": "finger1",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2232
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 11891
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 11891
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 11891
        },
        {
          "type": 54,
          "index": 0,
          "base": false,
          "value": 500
        },
        {
          "type": 59,
          "index": 16000001,
          "base": false,
          "value": 200
        },
        {
          "type": 2,
          "index": 76,
          "base": false,
          "value": 110
        }
      ]
    }
  },
  {
    "slot": "finger2",
    "data": {
      "stats": [
        {
          "type": 57,
          "index": 1,
          "base": true,
          "value": 12
        },
        {
          "type": 2,
          "index": 6,
          "base": true,
          "value": 2190
        },
        {
          "type": 2,
          "index": 3,
          "base": true,
          "value": 12762
        },
        {
          "type": 2,
          "index": 4,
          "base": true,
          "value": 12762
        },
        {
          "type": 2,
          "index": 5,
          "base": true,
          "value": 12762
        },
        {
          "type": 59,
          "index": 16000001,
          "base": false,
          "value": 200
        },
        {
          "type": 54,
          "index": 0,
          "base": false,
          "value": 500
        },
        {
          "type": 2,
          "index": 34,
          "base": false,
          "value": 25
        }
      ]
    }
  }
];;

window.ALPHA_KNOWN_BRACELET = {
    slot: "bracelet",
    data: {
      stats: [
        { type: 2, index: 16, value: 87, fixed: true },
        { type: 2, index: 15, value: 73, fixed: true },
        { type: 2, index: 11, value: 11904, fixed: false },
        { type: 3, index: 11042, value: 5, fixed: false },
        { type: 3, index: 11022, value: 5, fixed: false }
      ],
      numRerolls: 4,
      numTicketRerolls: 3
    }
  };;

window.CYANORA_KNOWN_BRACELET = {
    slot: "bracelet",
    data: {
      stats: [
        { type: 2, index: 15, value: 81, fixed: true },
        { type: 2, index: 6, value: 4040, fixed: true },
        { type: 3, index: 605100031, value: 5, fixed: false },
        { type: 2, index: 11, value: 13056, fixed: false },
        { type: 3, index: 11023, value: 5, fixed: false }
      ],
      numRerolls: 0,
      numTicketRerolls: 0
    }
  };;

window.VERIFIED_LIVE_PEERS = {
    'shadowhunter': [
      { name: 'Brookop', region: 'CE', ilvl: 1760.00, cp: 4951, role: 'dps', spec: 'Demonic Impulse' },
      { name: 'Æzoryn', region: 'CE', ilvl: 1760.00, cp: 4949, role: 'dps', spec: 'Demonic Impulse' },
      { name: 'Alcatrazzyy', region: 'CE', ilvl: 1760.83, cp: 4571, role: 'dps', spec: 'Demonic Impulse' },
      { name: 'Ebeneben', region: 'CE', ilvl: 1775.83, cp: 6151, role: 'dps', spec: 'Demonic Impulse' }
    ],
    'soulfist': [
      { name: 'Namichichi', region: 'CE', ilvl: 1761.67, cp: 4725, role: 'dps', spec: 'Energy Overflow' },
      { name: 'Chuohunter', region: 'CE', ilvl: 1758.33, cp: 4182, role: 'dps', spec: 'Robust Spirit' },
      { name: 'Valaken', region: 'CE', ilvl: 1757.50, cp: 3820, role: 'dps', spec: 'Energy Overflow' },
      { name: 'Leezek', region: 'CE', ilvl: 1774.17, cp: 4925, role: 'dps', spec: 'Energy Overflow' }
    ],
    'breaker': [
      { name: 'Dèxxos', region: 'CE', ilvl: 1751.67, cp: 4895, role: 'dps', spec: 'Brawl King Storm' },
      { name: 'Îzanagî', region: 'CE', ilvl: 1750.83, cp: 4434, role: 'dps', spec: 'Asura Destruction' },
      { name: 'Yokotami', region: 'CE', ilvl: 1750.00, cp: 3820, role: 'dps', spec: 'Brawl King Storm' },
      { name: 'Lethimsmashh', region: 'CE', ilvl: 1750.00, cp: 5005, role: 'dps', spec: 'Asura Destruction' }
    ],
    'bard': [
      { name: 'Ultrabuff', region: 'CE', ilvl: 1741.67, cp: 4315, role: 'support', spec: 'Desperate Salvation' },
      { name: 'Bardolyn', region: 'CE', ilvl: 1757.50, cp: 4411, role: 'support', spec: 'Desperate Salvation' },
      { name: 'Lavieenrosee', region: 'CE', ilvl: 1760.00, cp: 4631, role: 'support', spec: 'Desperate Salvation' },
      { name: 'Kimaziel', region: 'CE', ilvl: 1765.00, cp: 4705, role: 'support', spec: 'Desperate Salvation' }
    ],
    'paladin': [
      { name: 'Leomdri', region: 'CE', ilvl: 1760.00, cp: 3504, role: 'support', spec: 'Blessed Aura' },
      { name: 'Marbás', region: 'CE', ilvl: 1758.33, cp: 4107, role: 'support', spec: 'Blessed Aura' },
      { name: 'Pontiknight', region: 'CE', ilvl: 1756.67, cp: 4181, role: 'support', spec: 'Blessed Aura' },
      { name: 'Siwilpal', region: 'CE', ilvl: 1770.00, cp: 4751, role: 'support', spec: 'Blessed Aura' }
    ],
    'slayer': [
      { name: 'Trustslays', region: 'CE', ilvl: 1750.00, cp: 4230, role: 'dps', spec: 'Predator' },
      { name: 'Allîssa', region: 'CE', ilvl: 1742.50, cp: 4371, role: 'dps', spec: 'Predator' },
      { name: 'Ildsang', region: 'CE', ilvl: 1760.00, cp: 4428, role: 'dps', spec: 'Predator' },
      { name: 'Siwilayer', region: 'CE', ilvl: 1769.17, cp: 5684, role: 'dps', spec: 'Predator' }
    ],
    'souleater': [
      { name: 'Alcareapy', region: 'CE', ilvl: 1760.00, cp: 4262, role: 'dps', spec: "Night's Edge" },
      { name: 'Soulkotka', region: 'CE', ilvl: 1760.00, cp: 4569, role: 'dps', spec: 'Full Moon Harvester' },
      { name: 'Saîzu', region: 'CE', ilvl: 1760.83, cp: 4422, role: 'dps', spec: "Night's Edge" },
      { name: 'Hanekâwâ', region: 'CE', ilvl: 1770.83, cp: 5383, role: 'dps', spec: 'Full Moon Harvester' }
    ],
    'artist': [
      { name: 'Enanía', region: 'CE', ilvl: 1760.00, cp: 4087, role: 'support', spec: 'Full Bloom' },
      { name: 'Rüfûs', region: 'CE', ilvl: 1750.00, cp: 3570, role: 'support', spec: 'Full Bloom' },
      { name: 'Minëko', region: 'CE', ilvl: 1780.83, cp: 6014, role: 'support', spec: 'Full Bloom' },
      { name: 'Yukinosere', region: 'CE', ilvl: 1787.50, cp: 6814, role: 'support', spec: 'Full Bloom' }
    ],
    'scrapper': [
      { name: 'Immensa', region: 'CE', ilvl: 1760.00, cp: 4300, role: 'dps', spec: 'Taijutsu' },
      { name: 'Skeja', region: 'CE', ilvl: 1763.33, cp: 5359, role: 'dps', spec: 'Shock Training' },
      { name: 'Seyscrap', region: 'CE', ilvl: 1750.83, cp: 3842, role: 'dps', spec: 'Taijutsu' },
      { name: 'Arbore', region: 'CE', ilvl: 1785.83, cp: 6895, role: 'dps', spec: 'Shock Training' }
    ],
    'wardancer': [
      { name: 'Jinkowar', region: 'CE', ilvl: 1760.83, cp: 5824, role: 'dps', spec: 'First Intention' },
      { name: 'Zhanxy', region: 'CE', ilvl: 1758.33, cp: 5235, role: 'dps', spec: 'Esoteric Skill Enhancement' },
      { name: 'Hypnodanca', region: 'CE', ilvl: 1753.33, cp: 4520, role: 'dps', spec: 'First Intention' },
      { name: 'Granchey', region: 'CE', ilvl: 1785.83, cp: 6386, role: 'dps', spec: 'First Intention' }
    ],
    'berserker': [
      { name: 'Trustbigswird', region: 'CE', ilvl: 1753.33, cp: 4857, role: 'dps', spec: 'Mayhem' },
      { name: 'Neoconmachinx', region: 'CE', ilvl: 1765.00, cp: 5380, role: 'dps', spec: "Berserker's Technique" },
      { name: 'Woopzahr', region: 'CE', ilvl: 1765.83, cp: 5454, role: 'dps', spec: 'Mayhem' },
      { name: 'Camerilla', region: 'CE', ilvl: 1791.67, cp: 7487, role: 'dps', spec: 'Mayhem' }
    ],
    'destroyer': [
      { name: 'Baembam', region: 'CE', ilvl: 1760.00, cp: 4908, role: 'dps', spec: 'Rage Hammer' },
      { name: 'Baltino', region: 'CE', ilvl: 1754.17, cp: 4962, role: 'dps', spec: 'Gravity Training' },
      { name: 'Sestino', region: 'CE', ilvl: 1753.33, cp: 4578, role: 'dps', spec: 'Rage Hammer' },
      { name: 'Smashmi', region: 'CE', ilvl: 1765.83, cp: 4971, role: 'dps', spec: 'Rage Hammer' }
    ],
    'gunslinger': [
      { name: 'Xyrillachan', region: 'CE', ilvl: 1761.67, cp: 4283, role: 'dps', spec: 'Peacemaker' },
      { name: 'Demoguns', region: 'CE', ilvl: 1753.33, cp: 4253, role: 'dps', spec: 'Time to Hunt' },
      { name: 'Fency', region: 'CE', ilvl: 1751.67, cp: 4251, role: 'dps', spec: 'Peacemaker' },
      { name: 'Mirisama', region: 'CE', ilvl: 1771.67, cp: 6220, role: 'dps', spec: 'Peacemaker' }
    ],
    'artillerist': [
      { name: 'Grunwalt', region: 'CE', ilvl: 1760.00, cp: 4127, role: 'dps', spec: 'Barrage Enhancement' },
      { name: 'Roaringcannon', region: 'CE', ilvl: 1760.00, cp: 4455, role: 'dps', spec: 'Firepower Enhancement' },
      { name: 'Fraenkky', region: 'CE', ilvl: 1757.50, cp: 4803, role: 'dps', spec: 'Barrage Enhancement' },
      { name: 'Sedirst', region: 'CE', ilvl: 1763.33, cp: 5002, role: 'dps', spec: 'Barrage Enhancement' }
    ],
    'sorceress': [
      { name: 'Iphelina', region: 'CE', ilvl: 1760.00, cp: 4177, role: 'dps', spec: 'Igniter' },
      { name: 'Fenxy', region: 'CE', ilvl: 1758.33, cp: 4493, role: 'dps', spec: 'Reflux' },
      { name: 'Lowdmgceo', region: 'CE', ilvl: 1760.83, cp: 4831, role: 'dps', spec: 'Igniter' },
      { name: 'Arithea', region: 'CE', ilvl: 1761.67, cp: 4873, role: 'dps', spec: 'Igniter' }
    ],
    'deathblade': [
      { name: 'Scarletnichirin', region: 'CE', ilvl: 1760.00, cp: 4177, role: 'dps', spec: 'Surge' },
      { name: 'Bêrserkbeast', region: 'CE', ilvl: 1760.00, cp: 5236, role: 'dps', spec: 'Remaining Energy' },
      { name: 'Surgéz', region: 'CE', ilvl: 1760.00, cp: 4198, role: 'dps', spec: 'Surge' },
      { name: 'Ârcanis', region: 'CE', ilvl: 1759.17, cp: 4497, role: 'dps', spec: 'Remaining Energy' }
    ],
    'glaivier': [
      { name: 'Mingtzu', region: 'CE', ilvl: 1760.00, cp: 3827, role: 'dps', spec: 'Pinnacle' },
      { name: 'Doryphora', region: 'CE', ilvl: 1759.17, cp: 4041, role: 'dps', spec: 'Control' },
      { name: 'Mínille', region: 'CE', ilvl: 1759.17, cp: 4620, role: 'dps', spec: 'Pinnacle' },
      { name: 'Disglaívsting', region: 'CE', ilvl: 1760.83, cp: 5561, role: 'dps', spec: 'Pinnacle' }
    ],
    'striker': [
      { name: 'Parallelos', region: 'CE', ilvl: 1760.00, cp: 5190, role: 'dps', spec: 'Deathblow' },
      { name: 'Demosage', region: 'CE', ilvl: 1750.00, cp: 3910, role: 'dps', spec: 'Esoteric Flurry' },
      { name: 'Strikinshii', region: 'CE', ilvl: 1770.00, cp: 4809, role: 'dps', spec: 'Deathblow' },
      { name: 'Sendoru', region: 'CE', ilvl: 1770.00, cp: 5577, role: 'dps', spec: 'Deathblow' }
    ],
    'deadeye': [
      { name: 'Pistall', region: 'CE', ilvl: 1760.83, cp: 4696, role: 'dps', spec: 'Pistoleer' },
      { name: 'Jáckeylove', region: 'CE', ilvl: 1758.33, cp: 4598, role: 'dps', spec: 'Enhanced Weapon' },
      { name: 'Gwaiku', region: 'CE', ilvl: 1770.00, cp: 4958, role: 'dps', spec: 'Pistoleer' },
      { name: 'Gwaide', region: 'CE', ilvl: 1770.00, cp: 4853, role: 'dps', spec: 'Enhanced Weapon' }
    ],
    'sharpshooter': [
      { name: 'Scharfschiesi', region: 'CE', ilvl: 1762.50, cp: 5009, role: 'dps', spec: 'Death Strike' },
      { name: 'Kemancash', region: 'CE', ilvl: 1763.33, cp: 4278, role: 'dps', spec: 'Loyal Companion' },
      { name: 'Schiesii', region: 'CE', ilvl: 1765.00, cp: 4864, role: 'dps', spec: 'Death Strike' },
      { name: 'Artemo', region: 'CE', ilvl: 1765.00, cp: 4628, role: 'dps', spec: 'Loyal Companion' }
    ],
    'machinist': [
      { name: 'Prophyprime', region: 'CE', ilvl: 1753.33, cp: 4181, role: 'dps', spec: 'Evolutionary Legacy' },
      { name: 'Erkundi', region: 'CE', ilvl: 1758.33, cp: 4133, role: 'dps', spec: 'Arthetinean Skill' },
      { name: 'Luckiin', region: 'CE', ilvl: 1760.00, cp: 5075, role: 'dps', spec: 'Evolutionary Legacy' },
      { name: 'Eísenmann', region: 'CE', ilvl: 1765.83, cp: 4389, role: 'dps', spec: 'Evolutionary Legacy' }
    ],
    'arcanist': [
      { name: 'Glaivecant', region: 'CE', ilvl: 1759.17, cp: 4702, role: 'dps', spec: "Empress's Grace" },
      { name: 'Cardmagus', region: 'CE', ilvl: 1756.67, cp: 4675, role: 'dps', spec: 'Order of the Emperor' },
      { name: 'Mirisensei', region: 'CE', ilvl: 1755.83, cp: 4382, role: 'dps', spec: "Empress's Grace" },
      { name: 'Æacemaster', region: 'CE', ilvl: 1761.67, cp: 5688, role: 'dps', spec: 'Order of the Emperor' }
    ],
    'summoner': [
      { name: 'Pikasumchan', region: 'CE', ilvl: 1760.00, cp: 4244, role: 'dps', spec: 'Master Summoner' },
      { name: 'Evapora', region: 'CE', ilvl: 1760.00, cp: 4126, role: 'dps', spec: 'Communication Overflow' },
      { name: 'Artémiswift', region: 'CE', ilvl: 1760.83, cp: 5101, role: 'dps', spec: 'Master Summoner' },
      { name: 'Arthémissing', region: 'CE', ilvl: 1760.83, cp: 4926, role: 'dps', spec: 'Communication Overflow' }
    ],
    'reaper': [
      { name: 'Nunape', region: 'CE', ilvl: 1760.00, cp: 4694, role: 'dps', spec: 'Lunar Voice' },
      { name: 'Nemirea', region: 'CE', ilvl: 1751.67, cp: 4368, role: 'dps', spec: 'Hunger' },
      { name: 'Píffíí', region: 'CE', ilvl: 1771.67, cp: 5015, role: 'dps', spec: 'Lunar Voice' },
      { name: 'Rhialyn', region: 'CE', ilvl: 1771.67, cp: 5634, role: 'dps', spec: 'Hunger' }
    ],
    'aeromancer': [
      { name: 'Tsukiniji', region: 'CE', ilvl: 1760.00, cp: 4246, role: 'dps', spec: 'Drizzle' },
      { name: 'Arasue', region: 'CE', ilvl: 1760.00, cp: 4016, role: 'dps', spec: 'Wind Fury' },
      { name: 'Qileew', region: 'CE', ilvl: 1760.00, cp: 5129, role: 'dps', spec: 'Wind Fury' },
      { name: 'Lînfea', region: 'CE', ilvl: 1760.83, cp: 4831, role: 'dps', spec: 'Drizzle' }
    ],
    'gunlancer': [
      { name: 'Yasinyoo', region: 'CE', ilvl: 1760.00, cp: 4819, role: 'dps', spec: 'Combat Readiness' },
      { name: 'Sozaî', region: 'CE', ilvl: 1758.33, cp: 4292, role: 'dps', spec: 'Lone Knight' },
      { name: 'Kanonenlanzer', region: 'CE', ilvl: 1758.33, cp: 4879, role: 'dps', spec: 'Combat Readiness' },
      { name: 'Kotkalancer', region: 'CE', ilvl: 1760.83, cp: 5601, role: 'dps', spec: 'Lone Knight' }
    ],
    'valkyrie': [
      // Spécialisation Support (Knight of Light)
      { name: 'Valkraide', region: 'CE', ilvl: 1770.00, cp: 4325, role: 'support', spec: 'Knight of Light' },
      { name: 'Âzelia', region: 'CE', ilvl: 1766.67, cp: 4261, role: 'support', spec: 'Knight of Light' },
      { name: 'Pallagina', region: 'CE', ilvl: 1770.00, cp: 4410, role: 'support', spec: 'Knight of Light' },
      { name: 'Babynessi', region: 'CE', ilvl: 1771.67, cp: 5015, role: 'support', spec: 'Knight of Light' },
      // Spécialisation DPS (Liberator)
      { name: 'Trivalkyrie', region: 'CE', ilvl: 1770.83, cp: 4865, role: 'dps', spec: 'Liberator' },
      { name: 'Dingeladina', region: 'CE', ilvl: 1771.67, cp: 5272, role: 'dps', spec: 'Liberator' },
      { name: 'Nephílía', region: 'CE', ilvl: 1770.83, cp: 5369, role: 'dps', spec: 'Liberator' },
      { name: 'Lynkyrie', region: 'CE', ilvl: 1787.50, cp: 6686, role: 'dps', spec: 'Liberator' }
    ],
    'dimensionalist': [
      { name: 'Prophyzeit', region: 'CE', ilvl: 1750.83, cp: 3901, role: 'dps', spec: 'Space Wielder' },
      { name: 'Knäy', region: 'CE', ilvl: 1737.50, cp: 3745, role: 'dps', spec: 'Space Wielder' },
      { name: 'Lndxz', region: 'CE', ilvl: 1730.00, cp: 3137, role: 'dps', spec: 'Space Wielder' },
      { name: 'Nymren', region: 'CE', ilvl: 1720.00, cp: 2748, role: 'dps', spec: 'Space Wielder' },
      { name: 'Weiztwink', region: 'CE', ilvl: 1712.66, cp: 1958, role: 'dps', spec: 'Time Wielder' },
      { name: 'Momnt', region: 'CE', ilvl: 1700.00, cp: 1187, role: 'dps', spec: 'Time Wielder' }
    ]
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

window.NEVERCRY_PRESET_ROSTER = [
    {
      id: 'neevercry',
      name: 'Neevercry',
      className: 'Shadowhunter',
      spec: 'Demonic Impulse',
      role: 'dps',
      ilvl: 1777.50,
      cp: 5970,
      target: 1790.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Keyboard Heroes',
      rosterLevel: 320,
      gemDesc: 'Mix Gemmes 8 / 9 T4 (8x Niv. 9)',
      gemParts: [6.4, 6.4, 6.4, 6.4, 6.4, 6.4, 6.4, 6.4, 5.76, 5.76, 5.76],
      portraitUrl: 'images/characters/neevercry.webp',
      avatarUrl: 'images/characters/neevercry_avatar.webp',
      gear: { weapon: 23, head: 20, shoulder: 20, chest: 20, pants: 20, gloves: 20 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'kaarlach',
      name: 'Kaarlach',
      className: 'Souleater',
      spec: 'Full Moon Harvester',
      role: 'dps',
      ilvl: 1751.67,
      cp: 4409,
      target: 1770.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Keyboard Heroes',
      rosterLevel: 319,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (4x Niv. 8)',
      gemParts: [5.76, 5.76, 5.76, 5.76, 5.12, 5.12],
      portraitUrl: 'images/characters/kaarlach.webp',
      avatarUrl: 'images/characters/kaarlach_avatar.webp',
      gear: { weapon: 19, head: 15, shoulder: 15, chest: 14, pants: 14, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'neeverslayer',
      name: 'Neeverslayer',
      className: 'Slayer',
      spec: 'Predator',
      role: 'dps',
      ilvl: 1752.50,
      cp: 4171,
      target: 1770.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Keyboard Heroes',
      rosterLevel: 319,
      gemDesc: 'Mix Gemmes 8 / 9 T4 (5x Niv. 9)',
      gemParts: [6.4, 6.4, 6.4, 6.4, 5.76, 5.76, 5.76, 6.4, 5.76, 5.76, 5.76],
      portraitUrl: 'images/characters/neeverslayer.webp',
      avatarUrl: 'images/characters/neeverslayer_avatar.webp',
      gear: { weapon: 20, head: 14, shoulder: 15, chest: 14, pants: 15, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'neversup',
      name: 'Neversup',
      className: 'Paladin',
      spec: 'Blessed Aura',
      role: 'support',
      ilvl: 1750.00,
      cp: 3368,
      target: 1770.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Keyboard Heroes',
      rosterLevel: 319,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (5x Niv. 8)',
      gemParts: [10, 8.75, 8.75, 8.75, 10, 10, 10, 10, 8.75, 8.75, 8.75],
      portraitUrl: 'images/characters/neversup.webp',
      avatarUrl: 'images/characters/neversup_avatar.webp',
      gear: { weapon: 17, head: 14, shoulder: 14, chest: 15, pants: 15, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'jigokuushoujo',
      name: 'Jigokuushoujo',
      className: 'Bard',
      spec: 'Desperate Salvation',
      role: 'support',
      ilvl: 1742.50,
      cp: 3072,
      target: 1760.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Keyboard Heroes',
      rosterLevel: 319,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (3x Niv. 8)',
      gemParts: [8.75, 8.75, 8.75, 8.75, 10, 10, 10, 8.75, 8.75, 8.75, 8.75],
      portraitUrl: 'images/characters/jigokuushoujo.webp',
      avatarUrl: 'images/characters/jigokuushoujo_avatar.webp',
      gear: { weapon: 14, head: 14, shoulder: 13, chest: 14, pants: 13, gloves: 13 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'neverbreak',
      name: 'Neverbreak',
      className: 'Breaker',
      spec: "Asura's Path",
      role: 'dps',
      ilvl: 1736.67,
      cp: 3692,
      target: 1760.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Keyboard Heroes',
      rosterLevel: 319,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (5x Niv. 8, 6x Niv. 7)',
      gemParts: [5.76, 5.12, 5.12, 5.12, 5.12, 5.76, 5.12, 5.76, 5.76, 5.76, 5.12],
      portraitUrl: 'images/characters/neverbreak.webp',
      avatarUrl: 'images/characters/neverbreak_avatar.webp',
      gear: { weapon: 17, head: 11, shoulder: 11, chest: 11, pants: 12, gloves: 12 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    }
  ];;

window.DEFAULT_DEMO_ROSTER = [
    {
      id: 'demo_paladin',
      name: 'Paladin (Exemple)',
      className: 'Paladin',
      spec: 'Blessed Aura',
      role: 'support',
      ilvl: 1750.00,
      cp: 3368,
      target: 1770.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Archétype Démo',
      rosterLevel: 300,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (5x Niv. 8)',
      gemParts: [10, 8.75, 8.75, 8.75, 10, 10, 10, 10, 8.75, 8.75, 8.75],
      portraitUrl: 'images/classes/paladin.png',
      avatarUrl: 'images/classes/paladin.png',
      gear: { weapon: 17, head: 14, shoulder: 14, chest: 15, pants: 15, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'demo_shadowhunter',
      name: 'Shadowhunter (Exemple)',
      className: 'Shadowhunter',
      spec: 'Demonic Impulse',
      role: 'dps',
      ilvl: 1770.83,
      cp: 5445,
      target: 1790.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Archétype Démo',
      rosterLevel: 300,
      gemDesc: 'Mix Gemmes 8 / 9 T4 (5x Niv. 9)',
      gemParts: [6.4, 6.4, 6.4, 6.4, 6.4, 5.76, 5.76, 5.76, 5.76, 5.76, 5.76],
      portraitUrl: 'images/classes/shadowhunter.png',
      avatarUrl: 'images/classes/shadowhunter.png',
      gear: { weapon: 23, head: 18, shoulder: 18, chest: 18, pants: 19, gloves: 19 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'demo_souleater',
      name: 'Souleater (Exemple)',
      className: 'Souleater',
      spec: 'Full Moon Harvester',
      role: 'dps',
      ilvl: 1751.67,
      cp: 4409,
      target: 1770.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Archétype Démo',
      rosterLevel: 300,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (4x Niv. 8)',
      gemParts: [5.76, 5.76, 5.76, 5.76, 5.12, 5.12],
      portraitUrl: 'images/classes/souleater.png',
      avatarUrl: 'images/classes/souleater.png',
      gear: { weapon: 19, head: 15, shoulder: 15, chest: 14, pants: 14, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'demo_slayer',
      name: 'Slayer (Exemple)',
      className: 'Slayer',
      spec: 'Predator',
      role: 'dps',
      ilvl: 1752.50,
      cp: 4171,
      target: 1770.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Archétype Démo',
      rosterLevel: 300,
      gemDesc: 'Mix Gemmes 8 / 9 T4 (5x Niv. 9)',
      gemParts: [6.4, 6.4, 6.4, 6.4, 5.76, 5.76, 5.76, 6.4, 5.76, 5.76, 5.76],
      portraitUrl: 'images/classes/slayer.png',
      avatarUrl: 'images/classes/slayer.png',
      gear: { weapon: 20, head: 14, shoulder: 15, chest: 14, pants: 15, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'demo_bard',
      name: 'Bard (Exemple)',
      className: 'Bard',
      spec: 'Desperate Salvation',
      role: 'support',
      ilvl: 1742.50,
      cp: 3072,
      target: 1760.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Archétype Démo',
      rosterLevel: 300,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (3x Niv. 8)',
      gemParts: [8.75, 8.75, 8.75, 8.75, 10, 10, 10, 8.75, 8.75, 8.75, 8.75],
      portraitUrl: 'images/classes/bard.png',
      avatarUrl: 'images/classes/bard.png',
      gear: { weapon: 14, head: 14, shoulder: 13, chest: 14, pants: 13, gloves: 13 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    },
    {
      id: 'demo_breaker',
      name: 'Breaker (Exemple)',
      className: 'Breaker',
      spec: "Asura's Path",
      role: 'dps',
      ilvl: 1736.67,
      cp: 3692,
      target: 1760.0,
      advHoning: 40,
      server: 'Elpon (CE)',
      guild: 'Archétype Démo',
      rosterLevel: 300,
      gemDesc: 'Mix Gemmes 7 / 8 T4 (5x Niv. 8, 6x Niv. 7)',
      gemParts: [5.76, 5.12, 5.12, 5.12, 5.12, 5.76, 5.12, 5.76, 5.76, 5.76, 5.12],
      portraitUrl: 'images/classes/breaker.png',
      avatarUrl: 'images/classes/breaker.png',
      gear: { weapon: 17, head: 11, shoulder: 11, chest: 11, pants: 12, gloves: 12 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true
    }
  ];;

window.PRESETS = {
    neevercry: {
      name: 'Neevercry',
      className: 'Shadowhunter',
      role: 'dps',
      ilvl: 1777.50,
      cp: 5970,
      target: 1790.0,
      advHoning: 40,
      gear: { weapon: 23, head: 20, shoulder: 20, chest: 20, pants: 20, gloves: 20 },
      opt: {
        dpsAddDmg: 'high',
        dpsOutDmg: 'high',
        dpsAp: 'high',
        dpsCrit: 'high',
        dpsCdmg: 'high',
        dpsWp: 'high',
        dpsBracePerk: 'crit_cdmg',
        dpsBraceWp: '9000',
        dpsBraceStat: '16000',
        dpsBraceSub: '120',
        gemsDeck: 'lvl9',
        karmaEnlight: true,
        karmaEvo: true,
        arkGrid: true
      }
    },
    kaarlach: {
      name: 'Kaarlach',
      className: 'Souleater',
      role: 'dps',
      ilvl: 1751.67,
      cp: 4409,
      target: 1770.0,
      advHoning: 40,
      gear: { weapon: 19, head: 15, shoulder: 15, chest: 14, pants: 14, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true,
      opt: {
        dpsAddDmg: 'high',
        dpsOutDmg: 'mid',
        dpsAp: 'high',
        dpsCrit: 'mid',
        dpsCdmg: 'mid',
        dpsWp: 'mid',
        dpsBracePerk: 'crit_cdmg',
        dpsBraceWp: '8100',
        dpsBraceStat: '14000',
        dpsBraceSub: '100',
        gemsDeck: 'lvl8',
        karmaEnlight: true,
        karmaEvo: true,
        arkGrid: true
      }
    },
    neeverslayer: {
      name: 'Neeverslayer',
      className: 'Slayer',
      role: 'dps',
      ilvl: 1752.50,
      cp: 4171,
      target: 1770.0,
      advHoning: 40,
      gear: { weapon: 20, head: 14, shoulder: 15, chest: 14, pants: 15, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true,
      opt: {
        dpsAddDmg: 'high',
        dpsOutDmg: 'mid',
        dpsAp: 'mid',
        dpsCrit: 'high',
        dpsCdmg: 'mid',
        dpsWp: 'mid',
        dpsBracePerk: 'add_demon',
        dpsBraceWp: '8100',
        dpsBraceStat: '14000',
        dpsBraceSub: '100',
        gemsDeck: 'lvl8',
        karmaEnlight: true,
        karmaEvo: true,
        arkGrid: true
      }
    },
    neversup: {
      name: 'Neversup',
      className: 'Paladin',
      role: 'support',
      ilvl: 1750.00,
      cp: 3368,
      target: 1770.0,
      advHoning: 40,
      gear: { weapon: 17, head: 14, shoulder: 14, chest: 15, pants: 15, gloves: 15 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true,
      opt: {
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
        gemsDeck: 'lvl8',
        karmaEnlight: true,
        karmaEvo: true,
        arkGrid: true
      }
    },
    jigokuushoujo: {
      name: 'Jigokuushoujo',
      className: 'Bard',
      role: 'support',
      ilvl: 1742.50,
      cp: 3072,
      target: 1760.0,
      advHoning: 40,
      gear: { weapon: 14, head: 14, shoulder: 13, chest: 14, pants: 13, gloves: 13 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true,
      opt: {
        supBrand: 'mid',
        supAllyDmg: 'mid',
        supAllyAp: 'mid',
        supWp: 'low',
        supWpFlat: '480',
        supQuality: 'mid',
        supBracePerk: 'shield_ap',
        supBraceWp: '7200',
        supBraceStat: '12000',
        supBraceSwift: '80',
        gemsDeck: 'lvl8',
        karmaEnlight: true,
        karmaEvo: true,
        arkGrid: true
      }
    },
    neverbreak: {
      name: 'Neverbreak',
      className: 'Breaker',
      role: 'dps',
      ilvl: 1736.67,
      cp: 3692,
      target: 1760.0,
      advHoning: 40,
      gear: { weapon: 17, head: 11, shoulder: 11, chest: 11, pants: 12, gloves: 12 },
      arkGrid: { sun17: true, moon17: true, star17: true, starTier: 3 },
      accRolled: true,
      opt: {
        dpsAddDmg: 'mid',
        dpsOutDmg: 'mid',
        dpsAp: 'mid',
        dpsCrit: 'low',
        dpsCdmg: 'low',
        dpsWp: 'low',
        dpsQuality: 'mid',
        dpsBracePerk: 'wp_stack',
        dpsBraceWp: '7200',
        dpsBraceStat: '12000',
        dpsBraceSub: '80',
        gemsDeck: 'lvl8',
        karmaEnlight: true,
        karmaEvo: true,
        arkGrid: true
      }
    }
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
        comment: 'ROI absolu : roll basique très accessible pour un bonus direct de buff PA.',
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
        comment: 'Complément direct de l\'Ordre Soleil, ratio de rentabilité exceptionnel.',
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
        comment: 'Excellent ratio investissement / DPS personnel.',
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
        comment: 'Le plus gros boost absolu de dégâts du jeu : +20.8% DPS pour ~890k gold.',
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
        comment: 'Palier maximum d\'Aegir, gloire et Puissance d\'Arme ultime.',
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
        { id: 'demonic_impulse', name: '⚔️ Impulsion Démoniaque (Transfo DPS)', nameEn: '⚔️ Demonic Impulse (Transform DPS)', role: 'dps' },
        { id: 'perfect_suppression', name: '⚔️ Suppression Parfaite (Humaine DPS)', nameEn: '⚔️ Perfect Suppression (Human DPS)', role: 'dps' }
      ]
    },
    souleater: {
      name: 'Souleater',
      specs: [
        { id: 'full_moon', name: '⚔️ Faucheuse de la Pleine Lune (Burst DPS)', nameEn: '⚔️ Full Moon Harvester (Burst DPS)', role: 'dps' },
        { id: 'nights_edge', name: '⚔️ Lisière de la Nuit (DPS Continu)', nameEn: '⚔️ Night\'s Edge (Consistent DPS)', role: 'dps' }
      ]
    },
    slayer: {
      name: 'Slayer',
      specs: [
        { id: 'predator', name: '⚔️ Prédatrice (DPS Continu)', nameEn: '⚔️ Predator (Consistent DPS)', role: 'dps' },
        { id: 'punisher', name: '⚔️ Punitrice (Burst DPS)', nameEn: '⚔️ Punisher (Burst DPS)', role: 'dps' }
      ]
    },
    paladin: {
      name: 'Paladin',
      specs: [
        { id: 'blessed_aura', name: '🛡️ Bénédiction Sacrée (Aura Bénie / Support)', nameEn: '🛡️ Blessed Aura (Support)', role: 'support' },
        { id: 'judgment', name: '⚔️ Jugement (Paladin DPS)', nameEn: '⚔️ Judgment (Paladin DPS)', role: 'dps' }
      ]
    },
    bard: {
      name: 'Bard',
      specs: [
        { id: 'desperate_salvation', name: '🛡️ Salut Désespéré (Support)', nameEn: '🛡️ Desperate Salvation (Support)', role: 'support' },
        { id: 'true_courage', name: '⚔️ Vrai Courage (DPS)', nameEn: '⚔️ True Courage (DPS)', role: 'dps' }
      ]
    },
    artist: {
      name: 'Artist',
      specs: [
        { id: 'full_bloom', name: '🛡️ Pleine Floraison (Support)', nameEn: '🛡️ Full Bloom (Support)', role: 'support' },
        { id: 'recurrence', name: '⚔️ Récurrence (DPS)', nameEn: '⚔️ Recurrence (DPS)', role: 'dps' }
      ]
    },
    breaker: {
      name: 'Breaker',
      specs: [
        { id: 'asura_path', name: '⚔️ Voie d\'Asura (Front Burst)', nameEn: '⚔️ Asura\'s Path (Front Burst)', role: 'dps' },
        { id: 'brawl_king', name: '⚔️ Roi de la Bagarre (Stance DPS)', nameEn: '⚔️ Brawl King Storm (Stance DPS)', role: 'dps' }
      ]
    },
    berserker: {
      name: 'Berserker',
      specs: [
        { id: 'mayhem', name: '⚔️ Carnage (Mayhem)', nameEn: '⚔️ Mayhem (Fast DPS)', role: 'dps' },
        { id: 'berserker_technique', name: '⚔️ Technique du Berserker (Burst)', nameEn: '⚔️ Berserker\'s Technique (Burst)', role: 'dps' }
      ]
    },
    gunlancer: {
      name: 'Gunlancer',
      specs: [
        { id: 'combat_readiness', name: '🛡️ Préparation au Combat (Bleu)', nameEn: '🛡️ Combat Readiness (Blue)', role: 'dps' },
        { id: 'lone_knight', name: '⚔️ Chevalier Solitaire (Rouge Burst)', nameEn: '⚔️ Lone Knight (Red Burst)', role: 'dps' }
      ]
    },
    destroyer: {
      name: 'Destroyer',
      specs: [
        { id: 'rage_hammer', name: '⚔️ Marteau de Rage (Burst)', nameEn: '⚔️ Rage Hammer (Burst)', role: 'dps' },
        { id: 'gravity_training', name: '🔨 Entraînement Gravitationnel (Bonk)', nameEn: '🔨 Gravity Training', role: 'dps' }
      ]
    },
    deathblade: {
      name: 'Deathblade',
      specs: [
        { id: 'surge', name: '⚔️ Déferlement (Surge)', nameEn: '⚔️ Surge (Burst)', role: 'dps' },
        { id: 'remaining_energy', name: '⚔️ Énergie Résiduelle', nameEn: '⚔️ Remaining Energy', role: 'dps' }
      ]
    },
    reaper: {
      name: 'Reaper',
      specs: [
        { id: 'lunar_voice', name: '🌙 Voix Lunaire (Burst)', nameEn: '🌙 Lunar Voice (Burst)', role: 'dps' },
        { id: 'hunger', name: '🗡️ Faim (Chaos Constant)', nameEn: '🗡️ Hunger (Sustained)', role: 'dps' }
      ]
    },
    sorceress: {
      name: 'Sorceress',
      specs: [
        { id: 'igniter', name: '🔥 Ignition (Burst Météore)', nameEn: '🔥 Igniter (Meteor Burst)', role: 'dps' },
        { id: 'reflux', name: '❄️ Reflux (Spam Instant)', nameEn: '❄️ Reflux (Instant Cast)', role: 'dps' }
      ]
    },
    arcanist: {
      name: 'Arcanist',
      specs: [
        { id: 'empress_grace', name: '🃏 Grâce de l\'Impératrice (Ruin)', nameEn: '🃏 Empress\'s Grace (Ruin)', role: 'dps' },
        { id: 'order_emperor', name: '🃏 Ordre de l\'Empereur (Normal)', nameEn: '🃏 Order of the Emperor (Normal)', role: 'dps' }
      ]
    },
    summoner: {
      name: 'Summoner',
      specs: [
        { id: 'master_summoner', name: '🔮 Maîtresse Invocatrice (Burst)', nameEn: '🔮 Master Summoner (Burst)', role: 'dps' },
        { id: 'communication_overflow', name: '🐾 Débordement Invocations', nameEn: '🐾 Communication Overflow (Pets)', role: 'dps' }
      ]
    },
    wardancer: {
      name: 'Wardancer',
      specs: [
        { id: 'first_intention', name: '⚔️ Première Intention (FI)', nameEn: '⚔️ First Intention (FI)', role: 'dps' },
        { id: 'esoteric_enhancement', name: '🌪️ Renforcement Ésotérique (ESO)', nameEn: '🌪️ Esoteric Skill Enhancement', role: 'dps' }
      ]
    },
    scrapper: {
      name: 'Scrapper',
      specs: [
        { id: 'tai_jutsu', name: '👊 Taijutsu (Vitesse/Stamina)', nameEn: '👊 Ultimate Skill: Taijutsu', role: 'dps' },
        { id: 'shock_training', name: '💥 Entraînement au Choc (Heavy)', nameEn: '💥 Shock Training (Heavy)', role: 'dps' }
      ]
    },
    striker: {
      name: 'Striker',
      specs: [
        { id: 'deathblow', name: '⚔️ Coup Mortel (4 Orbes Burst)', nameEn: '⚔️ Deathblow (4 Orbs Burst)', role: 'dps' },
        { id: 'esoteric_flurry', name: '🌪️ Rafale Ésotérique (1 Orbe)', nameEn: '🌪️ Esoteric Flurry (1 Orb)', role: 'dps' }
      ]
    },
    glaivier: {
      name: 'Glaivier',
      specs: [
        { id: 'pinnacle', name: '⚔️ Pinacle (Stance Swap)', nameEn: '⚔️ Pinnacle (Stance Swap)', role: 'dps' },
        { id: 'control', name: '⚔️ Contrôle (Lance Bleue)', nameEn: '⚔️ Control (Blue Stance)', role: 'dps' }
      ]
    },
    deadeye: {
      name: 'Deadeye',
      specs: [
        { id: 'enhanced_weapon', name: '🎯 Arme Améliorée (Fusil à Pompe)', nameEn: '🎯 Enhanced Weapon (Shotgun)', role: 'dps' },
        { id: 'pistoleer', name: '🔫 Pistolero (Pistolets Seuls)', nameEn: '🔫 Pistoleer (Pistols Only)', role: 'dps' }
      ]
    },
    gunslinger: {
      name: 'Gunslinger',
      specs: [
        { id: 'peacemaker', name: '🎯 Pacificatrice (Tri-Armes)', nameEn: '🎯 Peacemaker (Tri-Stance)', role: 'dps' },
        { id: 'time_to_hunt', name: '⏳ Heure de la Chasse (Sans Pompe)', nameEn: '⏳ Time to Hunt (No Shotgun)', role: 'dps' }
      ]
    },
    artillerist: {
      name: 'Artillerist',
      specs: [
        { id: 'barrage_enhancement', name: '🚀 Renforcement de Barrage (Tourelle)', nameEn: '🚀 Barrage Enhancement (Turret)', role: 'dps' },
        { id: 'firepower_enhancement', name: '💣 Puissance de Feu (Mobilité)', nameEn: '💣 Firepower Enhancement', role: 'dps' }
      ]
    },
    sharpshooter: {
      name: 'Sharpshooter',
      specs: [
        { id: 'death_strike', name: '🏹 Frappe Mortelle (Burst Faucon)', nameEn: '🏹 Death Strike (Hawk Burst)', role: 'dps' },
        { id: 'loyal_companion', name: '🦅 Compagnon Fidèle (Sustained)', nameEn: '🦅 Loyal Companion (Sustained)', role: 'dps' }
      ]
    },
    machinist: {
      name: 'Machinist',
      specs: [
        { id: 'evolutionary_legacy', name: '🤖 Héritage de l\'Évolution (Ironman)', nameEn: '🤖 Evolutionary Legacy (Ironman)', role: 'dps' },
        { id: 'arthetinean_skill', name: '🔧 Compétence d\'Arthetine (Drone)', nameEn: '🔧 Arthetinean Skill (Drone)', role: 'dps' }
      ]
    },
    aeromancer: {
      name: 'Aeromancer',
      specs: [
        { id: 'wind_fury', name: '🌪️ Fureur du Vent (Parapluie Rapide)', nameEn: '🌪️ Wind Fury (Fast Umbrella)', role: 'dps' },
        { id: 'drizzle', name: '🌧️ Bruine (Météo/Dégâts Spé)', nameEn: '🌧️ Drizzle (Weather Special)', role: 'dps' }
      ]
    },
    dimensionalist: {
      name: 'Dimensionalist',
      specs: [
        { id: 'time_wielder', name: '⏳ Maître du Temps (Time Wielder / Spé)', nameEn: '⏳ Time Wielder (Spec / Non-Positional)', role: 'dps' },
        { id: 'space_wielder', name: '🌌 Maître de l\'Espace (Space Wielder / Rap)', nameEn: '🌌 Space Wielder (Swift / Back Attack)', role: 'dps' }
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
