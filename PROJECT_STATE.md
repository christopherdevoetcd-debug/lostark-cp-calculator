# Lost Ark T4 CP Calculator — État & Mémoire du Projet

Document de transmission complet du projet pour reprise instantanée de contexte dans toute nouvelle session d'assistance IA (local ou Proxmox).

---

## 1. Vue d'Ensemble & Mission
- **Application** : Calculateur et prédicteur de Combat Power (CP) et iLvl pour Lost Ark Tier 4 (Ratik / Kazeros), supportant à la fois les archétypes **DPS** et **Supports** (Buff Power, Marque, Bouclier/Soins).
- **Moteur Mathématique** : Calibré directement sur les formules et courbes empiriques réelles de [lostark.bible](https://lostark.bible).
- **Architecture Technique** :
  - Frontend SPA sans framework lourd : Vanilla ES6+ (`calculator.js`), Glassmorphism CSS (`style.css`), HTML5 sémantique (`index.html`), Internationalisation dynamique FR/EN (`i18n.js`).
  - Production : Serveur Nginx Alpine sous Docker avec reverse proxy sécurisé vers l'API bible (`/api/bible/...`) pour contourner CORS.
  - Agent de synchronisation Raid en temps réel : Node.js standalone compilé en binaire autonome (`client-agent/LostArkRaidAgent.exe`, port local 4848).

---

## 2. Infrastructure & Déploiements Actuels

### A. Serveur Proxmox VE (`192.168.1.100` - Host `pve`)
- **Emplacement du dépôt complet** : `/root/ia-projects/lostark-cp-calculator/`
- **Gestionnaire de version** : Git initialisé (`master`).
- **Antigravity CLI (`agy`)** : Installé dans `/root/.local/bin/agy`, configuration et mémoire dans `/root/.gemini/antigravity-cli/`.

### B. Machine Virtuelle Docker Proxmox (`192.168.1.104` - VM `docker`)
- **Emplacement du projet source** : `/opt/lostark-cp/`
- **Répertoire servi par Nginx** : `/opt/lostark-cp/public/` (monté en lecture seule dans le conteneur).
- **Conteneur actif** : `lostark-cp` (image `nginx:alpine`).
- **URL locale en production** : [http://192.168.1.104:8080/](http://192.168.1.104:8080/)
- **Commandes de maintenance** :
  ```bash
  ssh root@192.168.1.104
  cd /opt/lostark-cp
  docker exec lostark-cp nginx -t && docker exec lostark-cp nginx -s reload
  ```

---

## 3. Dernières Fonctionnalités Implémentées & Validées

### A. Dépliage Interactif des 5 Accessoires T4 (Rolls & Lignes)
- **Bouton `➕` / `➖`** : Ajouté directement sur la ligne « 💎 Accessoires T4 (Rolls & Lignes) » du tableau comparatif.
- **Grille 5 Colonnes** : Affichage côte à côte des 5 pièces (Collier, Boucle #1, Boucle #2, Anneau #1, Anneau #2).
- **Filtrage des stats de base** : Exclut les valeurs brutes (`> 5.0%`, comme DC +65% collier ou +32.5% anneau) pour n'isoler que les vraies lignes d'affinage (rolls $\le 5.0\%$).
- **Marquage visuel des anomalies** :
  - `⚠️ [Ligne Inutile]` (fond rouge) pour les lignes support sur DPS (ex: `Dégâts d'Allié (+3.00%)`).
  - `📉 [Roll Faible]`, `🔹 [Roll Moyen]`, `✨ [Roll Élevé]`, `👑 [Passif Rang 3]`.
  - `[À Affiner]` pour les emplacements d'affinage encore vides ou incomplets.
- **Parité Mathématique Stricte** : La somme des gains individuels par bijou est strictement égale au delta global du système (ex. $+59\text{ CP}$ pour Àlphâ vs Cyanora : $20 + 15 + 12 + 10 + 2 = 59\text{ CP}$).

### B. Correction Haute Lisibilité du Menu « Profils de Référence »
- **Problème résolu** : Sur Windows (Edge/Chrome), le menu déroulant natif `<select id="benchmarkPresetSelect">` apparaissait avec un fond blanc par défaut et du texte blanc, devenant illisible.
- **Solution apportée** :
  - Directive globale `color-scheme: dark;` sur `:root` et tous les `select`.
  - Stylisation sombre complète (`#0f172a` et `#070a12`) avec flèche SVG cyan et en-têtes de groupes `<optgroup>` en cyan `#38bdf8`.

### C. Décodage Authentique des Lignes d'Accessoires T4 (Tables Officielles lostark.bible)
- **Origine du problème résolu** : 
  - Les identifiants de statistiques (`stat.index`) étaient incorrectement assignés (ex: l'index `152` qui est du `Weapon Power %` était traduit à tort en `Dégâts d'Allié` et marqué `Ligne Inutile`, l'index `124` qui est de la `Puissance d'Attaque` flat était traduit en `Puissance d'Arme %`, l'index `74` qui est du `Crit Rate %` était traduit en `Dégâts d'Évolution`, et l'index `27` qui est des `Points de Vie Max` était éliminé car pris pour du dégât critique brut $> 5\%$).
  - La lecture des lignes s'appuyait uniquement sur `battlePoint.parts` (qui omet les lignes mortes/utilitaires sur un profil DPS), activant des lignes par défaut fictives au lieu de lire les véritables stats de `loadout.items`.
  - Les cibles de référence utilisaient des combinaisons théoriques impossibles (du Weapon Power % sur Collier/Anneau).
- **Correctifs déployés** :
  - **Dictionnaire Décompilé Canonique** : Basé sur les tables `6009` (Collier), `6109` (Boucles) et `6209` (Anneaux) de `lostark.bible`.
  - **Alignement Exact Pièce par Pièce (ex: Profil d'Àlphâ)** :
    - *Collier* : Points de Vie Max (+6500) [⚠️ Ligne Inutile], Dégâts infligés (+2.00%) [👑 Passif Rang 3], Puissance d'Attaque (+195) [🔹 Roll Moyen].
    - *Boucle #1* : Puissance d'Arme (+3.00%) [✨ Roll Élevé], Puissance d'Attaque (+0.40%) [📉 Roll Faible], Puissance d'Attaque (+80) [📉 Roll Faible].
    - *Boucle #2* : Puissance d'Arme (+3.00%) [✨ Roll Élevé], Boucliers aux Membres du Groupe (+0.95%) [⚠️ Ligne Inutile], Puissance d'Attaque (+0.40%) [📉 Roll Faible].
    - *Anneau #1* : Taux Critique (+1.55%) [✨ Roll Élevé], Récupération PV en Combat (+10) [⚠️ Ligne Inutile], Points de Vie Max (+3250) [⚠️ Ligne Inutile].
    - *Anneau #2* : Puissance d'Attaque (+195) [🔹 Roll Moyen], Effet Augmentation Dégâts d'Allié (+2.00%) [⚠️ Ligne Inutile], Dégâts Critiques (+4.00%) [✨ Roll Élevé].
  - **Lignes Référence Best-in-Slot** : Véritables High Rolls T4 par slot pour DPS et Supports.
- **Cache Busters actuels** : `calculator.js?v=14.0`, `style.css?v=10.0`.

### D. Dépliage Interactif du Bracelet T4 (Stats & Passifs)
- **Bouton `➕` / `➖`** : Ajouté directement sur la ligne « 🔮 Bracelet T4 (Stats & Passifs) » (`rowSysBracelet`) du tableau de benchmark.
- **Grille Comparative 2 Colonnes** :
  - **Carte Joueur** : Décode et affiche les caractéristiques fixes de base (ex: `Spécialisation +87` [Stat Fixe], `Critique +73` [Stat Fixe]), les rolls de statistique principale (ex: `Force +11 904` [Roll Élevé]) et les passifs débloqués (ex: `Coinçage +3%` [Proc BiS], `Marteau +8.4%` [Proc BiS]).
  - **Carte Cible Référence** : Affiche les stats fixes de la cible (ex: `Critique +81`, `Rapidité +100`) et ses passifs (ex: `Embuscade +3%`, `Marteau +6.8%` / `Ferveur +5.5%`), ou génère une référence BiS canonique selon le rôle (DPS / Support).
  - **Détection des Stats Mortes** : Identifie et signale en rouge `⚠️ [Stat Morte]` les caractéristiques inefficaces (ex: Vitalité sur DPS, ou stats critiques sur Support).
- **Bannière d'Optimisation & Diagnostic** : Recommandation claire et actionnable pour combler l'écart de CP (ex: reroll de stat morte, passage au palier max de stat principale ou reroll de passif BiS).

### E. Décomposition Détaillée des Gains de CP par Statistique & Passif (Mini-Tableau Bracelet)
- **Tableau Intégré `bracelet-compare-table`** : Inséré directement dans la zone dépliée sous les deux cartes de bracelet.
- **Ventilation Ligne par Ligne** :
  1. **Stats de Combat Fixes** : Compare le cumul des stats primaires (Spécialisation, Critique, Rapidité) et attribue le gain en CP correspondant (ex: `+18 CP`).
  2. **Statistique Principale** : Compare le palier de Force / Dextérité / Intelligence (ex: `Force +11 904` vs `Force +13 100`) et attribue le gain en CP (ex: `+13 CP`).
  3. **Passif Spécial #1** : Appariement intelligent des passifs identiques (ex: `Marteau +8.4%` vs `Marteau +10%`) avec gain en CP dédié (ex: `+13 CP`).
  4. **Passif Spécial #2** : Comparaison du second passif (ex: `Coinçage +3%` vs `Ferveur +5.5%`) avec gain en CP dédié (ex: `+38 CP`).
- **Badges Visuels Intégrés (`line-cp-pill`)** : Des pilules cyan `+X CP` sont également incrustées directement sur les badges de la carte cible pour une lecture visuelle immédiate.
- **Garantie Mathématique Stricte** : La somme des 4 composantes est rigoureusement égale à 100% du `cpImpact` du système bracelet (ex: $18 + 13 + 13 + 38 = 82\text{ CP}$).

### F. Profils de Référence 100% Réels lostark.bible & Moteur de Recherche Live
- **Éradication Totale des Profils Virtuels / Génériques** :
  - Aucun profil synthétique ou modèle virtuel n'est généré ni affiché. L'application s'appuie **strictement sur des profils de joueurs réels** issus de lostark.bible.
  - Tous les profils présentés disposent de leur lien direct officiel `🌐 Voir sur lostark.bible` (ex: `https://lostark.bible/character/CE/Cyanora` pour Soulfist Energy Overflow).
- **Épuration Complète du Menu Déroulant** : Suppression de l'injection arbitraire de 9 classes sans rapport qui polluaient la sélection. Désormais, le menu déroulant ne propose QUE :
  1. `🌐 Profils Recherchés (lostark.bible)` : Profils interrogés en direct par l'utilisateur.
  2. `🎯 Profils Réels lostark.bible (<Classe>)` : Strictement la classe du joueur (ex: `Cyanora`, `Genkidama`), triés par même spécialisation et proximité d'iLvl, avec indication directe du delta iLvl (ex: `[+6.7]`) et de leurs gemmes réelles.
  3. `👥 Vos Autres Personnages (Roster)` : Uniquement si l'utilisateur possède plusieurs personnages dans son roster.
- **Auto-Match Ciblé sur Profil Réel** : Sélectionne automatiquement le vrai joueur de la même classe et même spécialisation ayant le CP supérieur le plus proche (ex: pour `Àlphâ` 1758.33 $\rightarrow$ sélectionne automatiquement le vrai profil de `Cyanora` 1765.00).
- **Moteur de Recherche Live lostark.bible Haute Compatibilité** :
  - **Champ & Contrôle Dédiés** : Champ de saisie spacieux, sélecteur de région (`Auto`, `CE`, `NAE`, `NAW`, `SA`) et bouton d'action lumineux `Interroger lostark.bible`.
  - **Support des Liens URL Directs** : Détection et parsing automatique des URL complètes copiées-collées depuis le navigateur (ex: `https://lostark.bible/character/CE/...`).
  - **Résolution Automatique des Redirections de Casse** : Si un pseudo est entré en minuscules (ex: `cyanora`), le système suit automatiquement la redirection HTTP de lostark.bible vers le pseudo canonique (`Cyanora`).
  - **Multi-Région Automatique** : En mode `Auto`, si le pseudo n'existe pas en Europe (CE), le moteur tente immédiatement les serveurs Nord-Américains (NAE, NAW) et Sud-Américains (SA).
### G. Décomposition Interactive des Astrogemmes Ark Grid (Sous-statistiques & CP)
- **Bouton accordéon `➕` / `➖` dédié** : Positionné sur la ligne `✨ Ark Grid : Astrogemmes (Sous-stats)` du tableau comparatif benchmark (`#benchmarkTableBody`).
- **Extraction Réelle des Données lostark.bible (Battle Point Types 31 / 32)** :
  - DPS : `2001` (Puissance d'Attaque), `2002` (Dégâts Additionnels), `2003` (Dégâts aux Boss).
  - Supports : `2011` (Amélioration Dégâts Alliés), `2012` (Puissance de Marque), `2013` (Amélioration AP Allié).
  - Cumul des 24 slots d'astrogemmes et extraction des niveaux totaux (`totalLevel`) et multiplicateurs in-game (`value / 100`).
- **Calcul Mathématique Strict à 100% de Parité** :
  - Formule au prorata : $CP_i = \text{round}\left(\frac{\Delta_i}{\sum \Delta} \times \text{cpImpact}\right)$ avec ajustement résiduel sur le dernier terme pour garantir $\sum CP_i \equiv \text{cpImpact}$.
  - Exemple réel (Neevercry vs Ebeneben) : $+139\text{ CP}$ réparti exactement en Puissance d'Attaque ($+10\text{ CP}$), Dégâts Additionnels ($+26\text{ CP}$), Dégâts aux Boss ($+103\text{ CP}$).
- **Interface Glassmorphism Bilingue** :
  - Cartes côte à côte Joueur vs Cible avec pilules de gains `+X CP`.
  - Tableau comparatif dédié avec sous-totaux et écarts individuels.
  - Bannière de recommandation d'optimisation prioritaire identifiant la sous-statistique au plus fort impact (ex: Dégâts aux Boss).

---

## 4. Profils Clés et Benchmarks de Référence

- **DPS - Soulfist (Energy Overflow)** :
  - Joueur : `Àlphâ` (1758.33 iLvl, 4,564 CP)
  - Cible Recommandée : `Cyanora` (1765.00 iLvl, 4,951 CP, échelon +387 CP)
- **Support - Paladin (Blessed Aura)** :
  - Joueur : `Neversup` (1750.00 iLvl, 3,368 CP)
  - Cible Recommandée : `Siwilpal` (1765.83 iLvl, 4,652 CP, échelon +1,284 CP)
- **Top Stars Multi-classes intégrés dans la base** :
  - `Frieedhof` (Scrapper 1780.00 iLvl, 6,100 CP)
  - `Bascojin` (Shadowhunter 1785.00 iLvl, 6,525 CP)
  - `Ebeneben` (Shadowhunter 1775.83 iLvl, 6,103 CP)
  - `Câsy` (Shadowhunter 1790.00 iLvl, 6,650 CP)
  - `Lethimsmashh` (Breaker 1770.00 iLvl, 5,550 CP)
  - `Canilux` (Slayer 1775.00 iLvl, 5,850 CP)
  - `Viorella` (Gunslinger 1770.00 iLvl, 5,500 CP)
  - `Granchey` (Wildsoul 1775.00 iLvl, 5,800 CP)

---

## 5. Procédure de Déploiement Rapide vers Proxmox

Depuis le poste Windows dans le dossier `lostark-cp-calculator` :
```powershell
# 1. Déploiement sur la VM Docker de production
scp calculator.js style.css index.html root@192.168.1.104:/opt/lostark-cp/public/
ssh root@192.168.1.104 "docker exec lostark-cp nginx -s reload"

# 2. Synchronisation du dépôt Git sur l'hôte Proxmox VE
scp calculator.js style.css index.html root@192.168.1.100:/root/ia-projects/lostark-cp-calculator/
ssh root@192.168.1.100 "cd /root/ia-projects/lostark-cp-calculator && git add -A && git commit -m 'Sync updates' 2>/dev/null"
```
