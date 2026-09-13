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
- **Cache Busters actuels** : `calculator.js?v=10.0`, `style.css?v=7.0`.

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
