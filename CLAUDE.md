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
- La fonction `getDynamicGpdTable(charObj, role, isEn)` évalue chaque palier d'amélioration possible (Honing arme, Honing armures, Affinage avancé, Gemmes T4, Taillage d'astrogemmes, Cœurs 17pts, Affinage bijoux, Livres de gravure T4).
- Elle calcule le ratio `Coût en or / Gain net de puissance` et classe les actions par ROI décroissant.

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
- Le fichier contient aussi les stats de base par niveau (table `itemLevel` : puissance d'arme, stat principale par emplacement), et pour l'Aegir la même table iLvl par iLvl (`stats.byIlvl`, 1590 → 1755). Gain DPS (`gearDpsGain`, utilisé par `honingDpsGain`, `advHoningDpsGain` et le simulateur de l'onglet 2) = 50 × ln(1 + écart ÷ total du personnage), PA de base = √(puissance d'arme × stat principale ÷ 6).
- Gemmes DPS (`dpsGemUpgradeGain`) : vraies gemmes du profil (niveau par l'effet stat 150, type 5 = dégâts de compétence, type 27 = recharge). Monter une gemme : dégâts +4 points (moyenne des 1 + dégâts sur les gemmes de dégâts), recharge +2 points (1 / (1 − recharge), sur 70 % des dégâts, hypothèse Loseii), PA de base de la gemme sur le multiplicateur du Battle Point (type 1 `attackPowerMultiplier` = somme des PA des gemmes + pierre). Gain = 100 × ln(produit). Loseii ne compte plus la PA des gemmes dans ses lignes DPS ; nous oui (vérifié : PA de base = √(PA × stat ÷ 6) × (1 + multiplicateur)).
- Supports : modèle de Loseii (`model/support.js`, `model/gems.js`) porté dans `supportContribution` (vérifié identique à leur `contribution`) : Q = 100 × ln(ap × marque × identité), en % de dégâts de chaque allié, même échelle que les lignes support des bijoux (tables Arsonistic `buffDmg`). Canal ap : le support donne 22 % × (1 + amplification de PA allié) de sa PA de base (√(PA × stat ÷ 6) × (1 + `attackPowerMultiplier` du Battle Point type 1)). Références Loseii (Barde, gemmes niv. 9, DPS buffé) décalées par le vrai personnage : lignes des bijoux (stat 54 amplification, 59 dégâts alliés, stat 2 index 46 marque) et niveau moyen des gemmes (+1 point de buff par niveau du set, recharge convertie en Spécialisation).
  - Affinage support (`supportApGain`) : seul le canal ap bouge.
  - Gemmes support (`supportGemUpgradeGain`) : niveau lu sur l'effet stat 150 de chaque gemme (45/60/80/100/120 = niv. 6/7/8/9/10, % de PA par gemme 0,45/0,60/0,80/1,00/1,20).
  - Cœurs de la Grille d'Ark support (`SUPPORT_CORE_STEPS`) : options 14 et 17 points mesurées par Loseii (feuille « Ark Grid Cores » de bebkok, Barde de référence) : Ordre Soleil / Lune 1,1 % à 17, Ordre Étoile 0,3 % à 14 puis 0,16 % à 17, Chaos 0,7 % à 17 ; presque plat sous 14.
  - Le simulateur de l'onglet 2 garde l'estimation en CP pour les supports.
- iLvl d'une pièce (vérifié sur les profils lostark.bible) : Aegir 1590 + 5 × affinage + affinage avancé ; Serka 1675 + 5 × affinage (l'avancé n'y change ni l'iLvl ni les stats, pas de ligne GPD). La puissance d'arme totale du profil = stat de base de l'arme à son iLvl × (1 + % boucles d'oreilles + Karma Illumination).

### Battle Point des cœurs de la Grille d'Ark (DPS)
- `data/ark-grid-bp.json` : table `battlePoint` du jeu (flux Maxroll, branche 1 = mode DPS), écrite par `node tools/fetch-maxroll-honing.mjs`. Par ID de cœur, valeur cumulée à 10 / 14 / 17 / 18 / 19 / 20 points en 0,01 % de dégâts (chaque partie du Battle Point est un multiplicateur 1 + bp ÷ 10 000). Les profils lostark.bible donnent les mêmes valeurs (parties type 29).
- GPD DPS : gain d'un cœur jusqu'à 17 points = 100 × ln((1 + bp17) ÷ (1 + bp actuel)), pour le cœur réellement équipé (`getArkGridCoreIds`, repli sur `loadout.arkGridCores` sous 10 points). Pas de ligne si le rang du cœur ne va pas jusqu'à 17 ; cœurs absents de la table : ancien barème `getArkGridCoreBonus`.
- Cœur Chaos Étoile « Arme » (ID 6731210xx, absent de la table DPS : sa puissance d'arme passe par l'attaque de base) : `weaponCoreGain`, DPS comme support. Options du jeu (`arkGridCoreOptions`) : 10 pts +1 300 ; 14 +0,75 % ; 17 +2 600 et +1,50 % (rang 5) ou +3 900 et +2,25 % (rang 6) ; 18-20 +0,23 % chacun ; rang 4 plafonné à 14. Puissance d'arme totale = (arme + fixes) × (1 + % boucles + % Karma + % cœur) : exacte sur les profils Serka ; sur l'Aegir, écarts de −3 à +6 % non expliqués (transcendance ?).

### Réservoir de joueurs réels (Benchmark)
- `data/live-peers.json` liste de vrais joueurs par classe, rôle et iLvl, tirés des classements de raid de `lostark.bible` (Armoche, Kazeros, Serca, Cathédrale). Seuls les noms en viennent : CP et iLvl sont toujours rechargés en direct.
- Le reconstituer (≈2 min, ~1 fois par semaine) : `node tools/harvest-live-peers.mjs`, puis redéployer.
- Toujours lire le profil **raid** de lostark.bible, jamais le profil donjon du chaos. Le mode du Battle Point (`battlePoint.isSupport`) suit l'arbre d'Illumination enregistré : un support qui quitte le jeu après un chaos en arbre DPS peut laisser un profil raid « mélangé » (gravures support, Battle Point en mode DPS). `hasMixedRaidProfile()` le détecte : avertissement sur la fiche, Benchmark suspendu, jamais retenu comme référence.
- Aucune donnée de démo ni règle par pseudo : l'application ne manipule que des personnages importés. Rôle des classes support : support par défaut, DPS seulement si les gravures l'indiquent (`roleFromEngravings`).

