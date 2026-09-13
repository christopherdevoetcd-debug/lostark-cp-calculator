# ⚔️ Lost Ark T4 — Calculateur & Prédicteur de Combat Power (CP) & iLvl

Outil haute précision, autonome et interactif permettant de **prédire et calculer le Combat Power (CP)** à partir des formules mathématiques officielles de Smilegate et du moteur décompilé de **lostark.bible**.

---

## 🚀 Comment l'utiliser ?

### Option A — Mode Serveur Local & Connexion lostark.bible (Recommandé)
1. Double-clique sur le fichier **`start.bat`**.
2. Cela lance automatiquement le serveur local sur le port 8080 et ouvre **`http://localhost:8080/`** dans ton navigateur.
3. Ce mode est indispensable pour utiliser la connexion automatique **OAuth 2.0 (« Se connecter avec lostark.bible »)** et synchroniser directement tous tes rosters sans copier/coller.

### Option B — Mode Fichier Autonome (Offline)
1. Double-clique simplement sur le fichier **`index.html`** pour l'ouvrir directement dans ton navigateur (`file:///...`).
2. Tous les calculateurs, simulateurs d'affinage, prédictions d'iLvl et tableaux de rentabilité fonctionnent à 100% hors-ligne.
3. L'importation de profil peut se faire par copier-coller de ton JSON `lostark.bible`.

---

## ✨ Fonctionnalités Clés

### 1. 📐 Moteur Mathématique Canonique (lostark.bible & Smilegate T4)
Intégration directe de la formule officielle décompilée depuis l'application `lostark.bible` :

* **Formule DPS :**
  $$\text{Combat Power} = \frac{\text{Base Attack Point} \times \prod_{i} (1 + \text{Multiplicateur}_i)}{100}$$
  Où $\text{Base Attack Point} = \sqrt{\frac{\text{MainStat} \times \text{Puissance Arme}}{6}} \times (1 + \text{Bonus AP \%}) \times 0.028795$.

* **Formule Support (Paladin, Barde, Artiste) :**
  $$\text{Combat Power}_{\text{Support}} = \text{Buff Power} + \text{Heal/Shield Power}$$
  * **Buff Power :** Calculé sur la Base d'Attaque (Puissance d'Arme, Main Stat, buffs PA d'équipe, Marque, passifs Ark).
  * **Heal/Shield Power :** Calculé directement sur les **Max HP** et la **Vitalité** (taille des boucliers de Mur de protection et soins d'Aura bénie / Expert).
* **Décomposition analytique intégrale en 14 catégories :**
  1. Base (Main Stat, Puissance Arme, Bonus AP%, Max HP)
  2. Niveau de Personnage 70 (+29.45%)
  3. Qualité de l'Arme 100 (+30.00%)
  4. Ark Passive : Évolution (+0.75%/pt), Illumination (+0.70%/pt), Leap (+0.20%/pt)
  5. Karma T4 : Évolution Rang 0 ➔ 6 (+3.60%), Leap 0 ➔ 30 (+0.54%)
  6. Gravures Reliques (Grudge, KBW, Expert, Éveil, Aura bénie...)
  7. Accessoires T4 (Weapon Power %, Atk Power %, Outgoing Dmg %, Add Dmg %, Crit)
  8. Bracelet T4 (Perks de raid et statistiques pures)
  9. Deck de Joyaux T4 (Gemmes Blazing Niv. 8, 9, 10)
  10. Stats de Combat (Critique, Spécialisation, Rapidité : **exactement 0.030% par point**)
  11. Cartes (Light of Salvation 30 = +15.00%, You Have a Plan 30 = +21.00%)
  12. Effet Pet Forteresse (0.00% à 0.77%)
  13. Grille d'Ark (Astrogemmes AP, Dégâts Additionnels, Cœurs Ordre & Chaos)
  14. Paradise (Orbe Trinity Power)

---

### 2. 🌐 Importation Live & Roster Sync (lostark.bible)
* **Interrogation automatique :** Saisis simplement le pseudo de ton personnage (ex: `Neversup`, `Neevercry`) et ta région (`CE`, `NAW`, `NAE`, `SA`).
* L'outil interroge l'endpoint public `https://lostark.bible/character/[REGION]/[NAME]/__data.json` et désérialise en direct la structure SvelteKit / devalue.
* **Chargement instantané :**
  * iLvl réel et score de Combat Power en jeu
  * Détection automatique du rôle (Support vs DPS)
  * Extraction des 48 composants analytiques
  * Mise à jour du prédicteur et du simulateur d'affinage
* **Option avancée :** En cas de blocage CORS/Cloudflare du navigateur, tu peux coller directement le JSON ou ton Bearer Token (`uwo_...`).

---

### 3. 🔮 Prédicteur Rapide (iLvl ➔ CP)
* **Saisie intuitive :** Renseigne ton iLvl actuel (ex: `1740.00`) et ton CP actuel (ex: `3235`).
* **Choix de l'objectif :** Sélectionne ton iLvl cible (ex: `1770.00`) via le slider ou les boutons de saut rapide (`1750`, `1760`, `1770`, `1780`, `1790`).
* **Résultats complets en temps réel :**
  * Combat Power estimé (avec fourchette haute/basse).
  * Gain net de CP (+Δ CP) et efficacité en **CP par point d'iLvl**.
  * Tranche de comparaison (*Bracket*) sur `lostark.bible`.
  * Jauge visuelle de progression vers l'Endgame.

---

### 4. 🔨 Simulateur d'Affinage par Pièce (Gear Honing)
* Ajuste le niveau d'affinage (+10 à +25) de chaque pièce : **Arme, Tête, Épaulières, Torse, Jambes, Gants**.
* Prends en compte l'Affinage Avancé (+0, +20 Echidna, +40 Aegir).
* **Coût en Or Réel & Ratio Gold / CP (Issu de la feuille Honing) :**
  * Calcule le total en Gold brut nécessaire pour réaliser l'affinage simulé.
  * Affiche le ratio de rentabilité immédiat en **Gold / point de CP** (ex: ~1 940 g / CP pour l'Arme +18 vs ~680 g / CP pour les armures +16).

---

### 5. 💎 Optimisation T4 & Synergies (Moteur Arsonistic)
* **Intégration complète des tables mathématiques d'Arsonistic (`Lost Ark Arsonistic DPS Calculator.xlsx`) :**
  * **Accessoires T4 :** Marque (+8% = +0.70% buff), Dégâts Alliés (+7.5% = +0.75% buff), PA Alliés (+5% = +0.78% buff), WP Flat (+960 WP).
  * **Bracelets T4 :** Roll maître **Taux Crit Alliés (+2.5%) + PA Alliés (+3%)** (Top 1 absolu : +2.43% Dmg pour tout le raid) vs Crit/CDmg DPS (+5.45%).
  * **Deck de Gemmes T4 :** Passage en gemmes Niv. 8 (+28.35 CP par gemme, +1.25% buff power / +2.40% DPS).

---

### 6. 📊 Tableau d'Arbitrage Rentabilité Gold / Dégâts (Marché EUC)
* **Issu du classeur mondial :** *Automatic Gold to DMG Efficiency (Cracine, Portia, Riyon)* avec les cours EUC.
* **Classement ROI dynamique :**
  * Support : Coût en gold par tranche de **0.01% de buff dégâts alliés**.
  * DPS : Coût en gold par tranche de **1.00% de DPS personnel**.
* **Recommandation Intelligente ("Next Best Upgrade") :** Identifie automatiquement la prochaine amélioration prioritaire à réaliser selon ton profil actif.

---

### 7. ⚡ Mon Roster Préconfiguré (Top 6 en 1 Clic)
* 🛡️ **Neversup (1750.00 iLvl - 3 368 CP)** : Paladin Support (Ratik CE).
* ⚔️ **Neevercry (1770.83 iLvl - 5 445 CP)** : Shadowhunter DPS.
* ⚔️ **Kaarlach (1751.67 iLvl - 4 409 CP)** : Souleater DPS.
* ⚔️ **Neeverslayer (1751.67 iLvl - 4 160 CP)** : Slayer DPS.
* 🛡️ **Jigokuushoujo (1742.50 iLvl - 3 072 CP)** : Bard Support.
* ⚔️ **Neverbreak (1736.67 iLvl - 3 410 CP)** : Breaker DPS.
