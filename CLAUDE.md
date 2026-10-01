# Lost Ark CP Calculator & Upgrade Advisor (T4)

## 📌 Présentation du Projet
Application web monopage (SPA) haute performance en **Vanilla JavaScript** (ES6+), sans framework lourd, dédiée à l'analyse, la prédiction et l'optimisation du **Combat Power (CP / Battle Point)** pour Lost Ark Tier 4 (T4).
Elle s'appuie sur la calibration réelle des courbes de `lostark.bible` et les modèles d'analyse de `loseii.com`.

- **Dépôt local** : `/root/ia-projects/lostark-cp-calculator`
- **Serveur local Docker** : CT 104 (`192.168.1.104:8080`, container `lostark-cp`, `/opt/lostark-cp/public/`)
- **Production Cloudflare Pages** : `https://lostark-cp.pages.dev` (branche `master`)

---

## 📂 Cartographie des Fichiers & Rôles

| Fichier | Rôle & Contenu |
|---|---|
| `calculator.js` | **Cœur de l'application (~17k lignes)** : Moteur de calcul CP, affinage (honing), simulateur Ark Passive, diagnostic des bracelets, algorithme GPD (Gold Per Damage / Buff), gestion du Roster local, parsing des données JSON `lostark.bible`, exports globaux `window.__*`. |
| `data.js` | Constantes de jeu, coûts d'affinage T4 (`HONING_COSTS`), XP, bonus des cœurs d'Ark Grid (`getArkGridCoreBonus`), dictionnaires du jeu (spés, gravures, stats). Aucune donnée de démo. |
| `bracelet-model.js` | Modèle mathématique complet de simulation des lignes de bracelet T4 (effets uniques, rolls fixes et combinatoires). |
| `bracelet-worker.js` | Web Worker : lance le solveur exact de `bracelet-model.js` (gain espéré d'une nouvelle campagne de bracelet) hors du fil principal, résultat en cache `localStorage` (`lostark_bracelet_ev`). |
| `bracelet-data.js` | Dictionnaire des stats, affixes et tiers de bracelets T4. |
| `subrank.js` | Système de notation Loseii (grades S+, S, S-, A+, A, A-, B+, B, B-, C+, C, C-, D et percentiles). |
| `gear-data.js` | Données complémentaires d'équipement et d'affinage avancé (+10, +20, +30, +40). |
| `i18n.js` | Gestion multilingue dynamique (Français / Anglais). |
| `index.html` | Structure DOM, modales d'import, grilles de scoring de profil Loseii, onglets de simulation. |
| `style.css` | Thème sombre haut de gamme, composants de cartes Loseii, pills, badges de rôle. |

---

## 📐 Règles Mathématiques & Mécaniques de Calcul

### 1. Distinction Stricte : DPS vs Support
Le modèle de calcul change du tout au tout selon le rôle :
- **DPS** (Shadowhunter, Slayer, Souleater, Breaker, etc.) :
  - **Métrique clé** : Gain de dégâts nets personnels (% Dégâts sortants, Puissance d'Attaque %, Dégâts additionnels, Taux/Dégâts Critiques).
  - **GPD (Gold Per Damage)** : Coût en pièces d'or par **+1% de Dégâts** (`per 1% Damage`).
- **Support** (Paladin, Barde, Artiste, Valkyrie) :
  - **Métrique clé** : *Buff Power* allié (% Amplification PA d'Allié, % Dégâts Alliés, Puissance de Marque, Vitalité / Points de Vie max pour les boucliers et soins).
  - **GPD** : Coût en pièces d'or par **+0.01% de Buff Allié** (`per 0.01% Ally Buff`).
  - **Règle d'or** : Une classe support est TOUJOURS Support avec sa spé par défaut (Blessed Aura, Desperate Salvation, Full Bloom), SAUF si une gravure DPS explicite (`Judgment`, `True Courage`, `Recurrence`) est équipée.

### 2. Décodage du Battle Point Smilegate (`lostark.bible`)
Lors de l'ingestion d'un profil via `parseBibleCharacter()`, les données brutes contiennent `loadout.battlePoint.parts` avec des types stricts :
- `type 1` : Attaque de base (Stat principale Dex/Str/Int + Puissance d'arme + Base AP).
- `type 2` : Points de vie max (Vitalité) — crucial pour le calcul du bouclier/soin support.
- `type 4` : Qualité d'arme (valeur 0 à 100).
- `types 19, 20, 21` : Bracelet T4 (traits de combat Swift/Spec/Crit + perks).
- `types 31, 32` : Astrogemmes taillées T4.
- `type 29 / loadout.arkGridCores` : Cœurs de la Grille d'Ark (Soleil, Lune, Étoile) par paliers 10, 14, 17, 20 points.
- `types 50, 51, 54, 59` : Lignes d'affinage de bijoux spécifiques Support (50 = Soins, 51 = Boucliers, 54 = Amplification PA allié, 59 = Dégâts alliés). Si le rôle est DPS, ces lignes sont des **Dead Stats** ; si Support, elles sont prioritaires (High/Mid rolls).

### 3. Modèle GPD & Smart Advisor
- La fonction `getDynamicGpdTable(charObj, role, isEn)` liste **toutes** les façons de monter le personnage, chiffrées en or, comme le GPD de Loseii (loseii.com/loa-gpd) : affinage arme / armures, affinage avancé, gemmes, cœurs 17 pts, livres reliques, qualité d'arme, bijoux (une ligne par type : collier, boucle, anneau), bracelet, pierre d'aptitude, Karma d'Illumination, astrogemmes (taille d'épiques et de rares). Classement par or / 1 % (DPS) ou / 0,01 % (support), rang S+ / S / A / B / C / D (`getTierFromRatio`, D au-delà de 6 M / 1 %) et colonne « Ton état » (`gpdRowState`, note de Loseii quand l'échelle en a une).
- Tables de Loseii chargées en direct (`loadLoseiiGpd`, CORS ouvert, CSP de `nginx.conf` : script-src et connect-src autorisent https://www.loseii.com) : `rows.json` / `rows-dps.json` (échelle du bracelet), `arkgrid-rows-{,dps-}{epic,rare}.json` (taille d'astrogemmes), et `astrogem.js` (note des gemmes) épinglé par empreinte SRI (`LOSEII_ASTROGEM_JS` + `LOSEII_ASTROGEM_SRI` à changer ensemble).
  - Bracelet (`braceletGpdStep`) : note Subrank du bracelet porté ; note suivante = campagne neuve depuis zéro (`total` de l'échelle), gain = `totalDamage` − dégâts du bracelet actuel (méthode de Loseii, vérifiée sur Neevercry : B- → B 1,17 M pour +0,61 %).
  - Astrogemmes (`astrogemGridBand`) : note moyenne des gemmes (`Astrogem.grade` / `supportGrade`), coût de base 8 / 9 / 10 d'après les options (2001-2003, 2011-2013), Ordre / Chaos d'après le cœur (6730… / 6731…) ; ligne de l'échelle qui part de cette note (vérifié : Neevercry B+, épiques 675 k +1,08 %, rares 3,03 M +0,97 %). Si le palier part sous la note du joueur (ex. épiques « ungraded ➔ B » pour une grille B-, dont les dégâts comptent la grille entière), gain = `totalDamage` du palier − dégâts estimés de la grille actuelle (`astrogemDamageAtMean` : courbe note moyenne → dégâts des `tiers` épiques + rares de Loseii), or du palier inchangé (vérifié : Kaarlach B- 72,5, épiques +7,22 % → +0,96 %).
  - Karma (`karmaGpdStep`) : `data/karma-t4.json` (table du jeu, flux Maxroll, identique à celle de Loseii), 900 or par essai, jauge d'énergie ; +0,10 % de puissance d'arme par niveau.
  - Pierre d'aptitude : taille exacte (`getAbilityStoneUpgrade`), pierre non taillée = 9 pheons ; l'or = pierres achetées (la taille coûte de l'argent, non comptée). Pas de ligne au-delà de 5 000 pierres (`STONE_GPD_MAX_STONES`) : un 10/x s'achète taillé à l'hôtel des ventes.
  - Prix hors marché réglables au-dessus du tableau (`lostark_gpd_prices` en localStorage) : pheon et bracelet 90/90 non relancé ; défauts = prix de Loseii ; leurs achats sont repris au prorata (`loseiiRepriceRatio`).
- Le Smart Advisor (`buildMasterGpdData`) reprend les mêmes lignes ; une ligne sans traduction y est ignorée.

---

## 🛠️ Règles de Développement & Bonnes Pratiques

1. **Intégrité du DOM & Reactivité** :
   - `calculator.js` référence des éléments du DOM dans l'objet `dom` initialisé au chargement.
   - Ne jamais supprimer un identifiant DOM sans vérifier toutes ses références dans `calculator.js`.
   - Toutes les fonctions clés appelées par les gestionnaires d'événements ou inline HTML sont exportées sur `window.__nomDeFonction`.
2. **Gestion du Cache & Roster** :
   - Le roster actif de l'utilisateur est stocké dans `localStorage.getItem('lostark_user_roster')`.
   - `getUserRoster()` guérit automatiquement les rôles obsolètes en appelant `detectCharacterRole(c)`.
3. **Vérification de Syntaxe avant Déploiement** :
   - Toujours exécuter `node -c calculator.js` pour s'assurer de l'absence totale d'erreur de parsing JavaScript.

---

## 🚀 Procédure de Déploiement

À chaque modification :
1. **Incrémenter le cache-busting** dans `index.html` :
   - `style.css?v=X.Y`
   - `calculator.js?v=X.Y`
2. **Pousser sur Git (main et master)** :
   ```bash
   git commit -am "feat/fix: description des changements" && git push origin main && git push origin main:master
   ```
3. **Déployer sur CT 104 et Cloudflare Pages en une seule commande** :
   ```bash
   ./deploy.sh
   ```
   *(Ce script autonome vérifie la syntaxe JS, synchronise CT 104 + Nginx, déploie sur Cloudflare Pages via Wrangler et vérifie la mise en ligne)*
   - Le token Cloudflare est lu dans `.env` (ignoré par Git) ou l'environnement : `CLOUDFLARE_API_TOKEN=...`. Ne jamais l'écrire dans un fichier versionné, le dépôt est public.

### Recettes d'affinage T4 (Maxroll)
- `data/honing-t4.json` : recettes du jeu (or, matériaux, taux, bonus d'échec, artisan, souffles) pour l'Aegir (1640) et le Serka (1675), arme et armures, +10 à +25. Tirées du flux du planificateur Maxroll (`assets-ng.maxroll.gg/laplanner/game/stats.json`, même source que loseii.com).
- Les régénérer après un patch d'affinage : `node tools/fetch-maxroll-honing.mjs`, puis redéployer. Le Serka est chiffré sur sa propre recette au niveau affiché ; l'estimation « Aegir +9 » ne sert plus que de repli si le fichier manque.
- Le fichier contient aussi les stats de base par niveau (table `itemLevel` : puissance d'arme, stat principale et Vitalité par emplacement), et pour l'Aegir la même table iLvl par iLvl (`stats.byIlvl`, 1590 → 1755). Gain DPS (`gearDpsGain`, utilisé par `honingDpsGain`, `advHoningDpsGain` et le simulateur de l'onglet 2) = 50 × ln(1 + écart ÷ total du personnage), PA de base = √(puissance d'arme × stat principale ÷ 6).
- Gemmes DPS (`dpsGemUpgradeGain`) : vraies gemmes du profil (niveau par l'effet stat 150, type 5 = dégâts de compétence, type 27 = recharge). Monter une gemme : dégâts +4 points (moyenne des 1 + dégâts sur les gemmes de dégâts), recharge +2 points (1 / (1 − recharge), sur 70 % des dégâts, hypothèse Loseii), PA de base de la gemme sur le multiplicateur du Battle Point (type 1 `attackPowerMultiplier` = somme des PA des gemmes + pierre). Gain = 100 × ln(produit). Loseii ne compte plus la PA des gemmes dans ses lignes DPS ; nous oui (vérifié : PA de base = √(PA × stat ÷ 6) × (1 + multiplicateur)).
- Supports : modèle de Loseii (`model/support.js`, `model/gems.js`) porté dans `supportContribution` (vérifié identique à leur `contribution`) : Q = 100 × ln(ap × marque × identité), en % de dégâts de chaque allié, même échelle que les lignes support des bijoux (tables Arsonistic `buffDmg`). Canal ap : le support donne 22 % × (1 + amplification de PA allié) de sa PA de base (√(PA × stat ÷ 6) × (1 + `attackPowerMultiplier` du Battle Point type 1)). Références Loseii (Barde, gemmes niv. 9, DPS buffé) décalées par le vrai personnage : lignes des bijoux (stat 54 amplification, 59 dégâts alliés, stat 2 index 46 marque) et niveau moyen des gemmes (+1 point de buff par niveau du set, recharge convertie en Spécialisation).
  - Affinage support (`supportApGain`) : seul le canal ap bouge.
  - Gemmes support (`supportGemUpgradeGain`) : niveau lu sur l'effet stat 150 de chaque gemme (45/60/80/100/120 = niv. 6/7/8/9/10, % de PA par gemme 0,45/0,60/0,80/1,00/1,20).
  - Cœurs de la Grille d'Ark support (`SUPPORT_CORE_STEPS`) : options 14 et 17 points mesurées par Loseii (feuille « Ark Grid Cores » de bebkok, Barde de référence) : Ordre Soleil / Lune 1,1 % à 17, Ordre Étoile 0,3 % à 14 puis 0,16 % à 17, Chaos 0,7 % à 17 ; presque plat sous 14.
  - Le simulateur de l'onglet 2 garde l'estimation en CP pour les supports.
- iLvl d'une pièce (vérifié sur les profils lostark.bible) : Aegir 1590 + 5 × affinage + affinage avancé ; Serka 1675 + 5 × affinage (l'avancé n'y change ni l'iLvl ni les stats, pas de ligne GPD). La puissance d'arme totale du profil = stat de base de l'arme à son iLvl × (1 + % boucles d'oreilles + Karma Illumination).

- Qualité d'arme (DPS, `weaponQualityUpgrade`, ligne `dyn_quality`) : chances officielles du wiki Lost Ark (« Quality upgrade »), fixes quelle que soit la qualité actuelle : tranches 0-10 … 91-100 = 25,19 / 21,41 / 17,63 / 13,85 / 10,08 / 6,30 / 2,52 / 1,26 / 1,01 / 0,76 %, puis 10 % par qualité ; la qualité n'est gardée que si elle monte. Vérifié en jeu : 94 → 0,45 %, 97 → 0,23 %. Coût 800 or par essai (les 3 pierres du chaos viennent du contenu, non comptées). Effet : dégâts additionnels 10 % + 0,002 % × qualité² (= partie type 4 du Battle Point DPS), gain moyen des qualités supérieures, dilué dans le pool de dégâts additionnels de bracelet-model.js. Pas de ligne support : le Battle Point support compte la qualité à 0 et elle ne touche pas le buff.

### Battle Point des cœurs de la Grille d'Ark (DPS)
- `data/ark-grid-bp.json` : table `battlePoint` du jeu (flux Maxroll, branche 1 = mode DPS), écrite par `node tools/fetch-maxroll-honing.mjs`. Par ID de cœur, valeur cumulée à 10 / 14 / 17 / 18 / 19 / 20 points en 0,01 % de dégâts (chaque partie du Battle Point est un multiplicateur 1 + bp ÷ 10 000). Les profils lostark.bible donnent les mêmes valeurs (parties type 29).
- GPD DPS : gain d'un cœur jusqu'à 17 points = 100 × ln((1 + bp17) ÷ (1 + bp actuel)), pour le cœur réellement équipé (`getArkGridCoreIds`, repli sur `loadout.arkGridCores` sous 10 points). Pas de ligne si le rang du cœur ne va pas jusqu'à 17 ; cœurs absents de la table : ancien barème `getArkGridCoreBonus`.
- Cœur Chaos Étoile « Arme » (ID 6731210xx, absent de la table DPS : sa puissance d'arme passe par l'attaque de base) : `weaponCoreGain`, DPS comme support. Options du jeu (`arkGridCoreOptions`) : 10 pts +1 300 ; 14 +0,75 % ; 17 +2 600 et +1,50 % (rang 5) ou +3 900 et +2,25 % (rang 6) ; 18-20 +0,23 % chacun ; rang 4 plafonné à 14. Puissance d'arme totale = (arme + fixes) × (1 + % boucles + % Karma + % cœur) : exacte sur les profils Serka ; sur l'Aegir, écarts de −3 à +6 % non expliqués (transcendance ?).

### Benchmark aligné sur le GPD
- `benchmarkGpdGains(player, target, pSys, tSys, isSupport)` chiffre les écarts achetables avec les fonctions du GPD, toujours sur le profil réel du **joueur** (« ce que rapporterait l'état de la référence ») : affinage arme / armures et affinage avancé (`gearDpsGain` / `supportApGain`, pièce par pièce, Aegir → Serka via `toIsSerka`), gemmes (`dpsGemSetGain` / `supportGemSetGain`, meilleures gemmes appariées aux meilleures, même type d'effet d'abord), cœurs (règle de la ligne cœur du GPD : table Battle Point, `weaponCoreGain`, `SUPPORT_CORE_STEPS`), bijoux (pentes Arsonistic, bijou par bijou, prix de la gamme de la référence), livres reliques (DPS).
- Par système : `net` (écart affiché dans le tableau et les cartes, unité du GPD : % DPS ou % Buff), `buy` (seulement ce qui manque, pour le plan) et `cost` (coûts du GPD). Le plan d'achat est classé par or / 1 % DPS ou or / 0,01 % Buff, comme le GPD. CP = CP du joueur × (e^(gain/100) − 1).
- Qualité d'arme (DPS) : ligne `weaponQuality` à part (plus dans l'écart de l'arme), gain `weaponQualityGain` du GPD, coût pour tirer au moins la qualité de la référence = 800 or ÷ `weaponQualityChanceAtLeast`, dans le plan d'achat. Support : écart 0.
- Hors plan : grade Relique / Ancien des cœurs (écart au Battle Point réel des deux cœurs, DPS). Bracelet, astrogemmes, gravures (écart affiché), stats de combat, Ark Passive et Karma : écart en CP lu sur les parties du Battle Point des deux profils (`dpsBpGaps` pour les DPS, types 19-21, 31-32, 10-11, 26, 5, 6, 7, 8 ; CP × (produit référence ÷ produit joueur − 1)), comme `supportCpGaps` pour les supports. Un système sans données détaillées (ou un profil sans Battle Point) retombe sur l'ancien barème `bonusPct`, ramené en % du CP dans le plan (« estimation »).
- Gemmes : effets de compétence type 5 / 34 = dégâts, 27 / 35 = recharge (34 et 35 lus sur des profils réels, mêmes valeurs).
- **CP des supports** (`supportCpGaps`) : le % de buff du GPD ne se convertit pas en CP (le Battle Point pèse les lignes support ~5× plus que Loseii, rapport variable selon la stat). CP support = branche buff (type 1 = PA de base × 1,24, × parties offensives) + branche défense (type 2 = PV × 12, × parties 11, 16, 18, 21, 30, 32, 35), vérifié à 1-2 % du CP en jeu. Écart CP par système = parties réelles des deux profils sur les branches du joueur ; équipement par √(puissance d'arme × stat principale) ; gemmes : 125 × niveau (table battlePoint branche 2) + % de PA. Armures : Vitalité (stat 6 de la table `itemLevel`, `stats.vitality`) sur la branche défense, PV max proportionnels à la Vitalité du profil (stat 6), ≈ +8 % de la valeur CP de l'affinage des armures. Tableau : % Buff (GPD) pour les systèmes du GPD, % CP pour les autres ; cartes classées au CP du jeu ; plan d'achat au buff.
  - Bracelet et astrogemmes support ont aussi leur % Buff (hors plan d'achat, obtenus en jeu) : bracelet entier par `Bracelet.jointScore` (bracelet-model.js, profil support) ; astrogemmes par `supportAstroGain` : options 2011 dégâts alliés, 2012 marque, 2013 amplification de PA alliée (mêmes stats que les bijoux support, valeurs par niveau `gemOptions` de `data/battle-point-support.json`, écrites par `node tools/fetch-maxroll-honing.mjs`). La base de Loseii inclut déjà la grille d'Ark de sa référence : seul l'écart référence − joueur est ajouté aux lignes du joueur.
- Ligne « Stat principale & PA de base » (DPS et support, `baseAttackRestRatio`) : seulement le reste de l'attaque de base, hors affinage et % de PA des gemmes (déjà sur leurs lignes).
- CP d'un personnage = CP du profil raid (`loadout.combatPower`, `raidCombatPower`), jamais `maxCombatPower` de l'en-tête (maximum historique : 4 930 contre 3 335 actuels sur un Paladin). Les anciens rosters et le cache des références sont corrigés au chargement (`raidCombatPowerOf`).

### Réservoir de joueurs réels (Benchmark)
- `data/live-peers.json` liste de vrais joueurs par classe, rôle et iLvl, tirés des classements de raid de `lostark.bible` (Armoche, Kazeros, Serca, Cathédrale). Seuls les noms en viennent : CP et iLvl sont toujours rechargés en direct.
- Le reconstituer (≈2 min, ~1 fois par semaine) : `node tools/harvest-live-peers.mjs`, puis redéployer.
- Toujours lire le profil **raid** de lostark.bible, jamais le profil donjon du chaos. Le mode du Battle Point (`battlePoint.isSupport`) suit l'arbre d'Illumination enregistré. Or Lost Ark n'enregistre l'arbre d'Ark Passive qu'à la **déconnexion** du personnage (note de lostark.bible) : un support qui a changé d'arbre en jeu garde un profil raid « mélangé » (stuff et gravures support à jour, Battle Point calculé en mode DPS).
  - **Recalcul automatique** (`rebuildSupportBattlePoint`, dans `parseBibleCharacter` et au chargement pour les rosters / références déjà enregistrés) : si les gravures disent support et que le Battle Point est en mode DPS, le Battle Point est recalculé en mode support avec la table du jeu (`data/battle-point-support.json`, branche 2 du flux Maxroll, écrite par `node tools/fetch-maxroll-honing.mjs`). Vérifié à l'identique, partie par partie, sur 6 loadouts support corrects. Repris du profil : PA de base, PV, niveau, points d'Ark Passive, Karma, cartes (id + rang), paradis, gemmes (niveau = ID mod 1000 ÷ 10). Revalorisé : gravures (code = 20 × niveau de pierre + niveau de livres, 13 = relique 20/20 ; pierre : 6 nœuds = +1, 7-8 = +2, 9 = +3, 10 = +4), lignes de bijoux et de bracelet, stats de combat (Spécialisation + Célérité) × 4, cœurs (points des gemmes), astrogemmes (options 2011-2013). Marque `battlePoint.rebuiltSupport`, pastille d'information sur la fiche.
  - Un vrai DPS (gravures DPS, ex. Paladin Jugement) n'est jamais recalculé. `hasMixedRaidProfile()` ne reste utile que si le recalcul est impossible (table absente, DPS enregistré en mode support) : avertissement, Benchmark suspendu, jamais retenu comme référence.
- Aucune donnée de démo ni règle par pseudo : l'application ne manipule que des personnages importés. Rôle des classes support : support par défaut, DPS seulement si les gravures l'indiquent (`roleFromEngravings`).

