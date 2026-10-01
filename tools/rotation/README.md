# Analyseur de rotation (prototype)

Analyse d'un combat enregistré par [LOA Logs](https://github.com/snoww/loa-logs) (base locale `encounters.db`), façon xivanalysis : utilisations par compétence, temps perdu, alignement sur les buffs du support, placement, et note d'exécution sur 100 par rapport aux joueurs de la même spé.

## Fichiers

| Fichier | Rôle |
|---|---|
| `db.mjs` | Lecture seule de `encounters.db` (`node:sqlite`, colonnes JSON en gzip). |
| `metrics.mjs` | Calculs, sans dépendance à Node (réutilisable dans le navigateur). |
| `build-ref.mjs` | Références par spé et par boss → `tools/samples/rotation-ref.json` (quantiles, aucun nom). |
| `coach.mjs` | Conseils pédagogiques (FR / EN), module pur. |
| `analyze.mjs` | Rapport en ligne de commande (`--en` : conseils en anglais). |
| `build-skill-meta.mjs` | `data/rotation-skills.json` : recharge de base et placement (`directionalMask`) de chaque compétence, noms des nœuds d'Ark Passive, durée et groupe des buffs de support, tirés des tables du jeu de LOA Logs (`Skill.json`, `ArkPassive.json`, `SkillBuff.json`). |

`tools/samples/` (ignoré par Git) contient `encounters.db`, un lien vers la copie de l'utilisateur sur le partage `medias` (`/mnt/pve/Proxmox-Data4TO/encounters.db`), et les références.

## Usage

```bash
node --no-warnings tools/rotation/build-ref.mjs [--days 120]        # ~15 s
node --no-warnings tools/rotation/analyze.mjs --list --player Neeverslayer
node --no-warnings tools/rotation/analyze.mjs 4275 Neeverslayer [--json]
```

## Données d'un combat (LOA Logs 1.51)

- `entity.skills` : par compétence, `skillCastLog` = chaque utilisation (`timestamp`, `last` = dernier coup) et ses coups (dégâts, crit, dos / face, `buffedBy` / `debuffedBy` actifs au moment du coup). Dégâts sur la durée et objets : pas d'utilisations.
- Buffs de support reconnus par leur groupe du jeu (`uniqueGroup`, mêmes règles que LOA Logs) : PA 101204 / 101105 / 314004 / 480030, Marque 210230 (debuff), identité 211400 / 368000 / 310501 / 480018, T 362600…
- `duration` de LOA Logs retire certains passages (Kazeros : 657 s contre 697 s de chronologie) : les calculs utilisent la chronologie complète (`timelineMs`, jusqu'au dernier paquet).
- Morts : `damageStats.deathInfo` (instant absolu, `deadFor`).
- La recharge de base (`Skill.json`) ne sert pas de référence : identité, tripods et Ark Passive la changent (Brutal Impact : 40 s de base, 4,6 s en médiane chez le Prédateur). Les rythmes de référence sont mesurés sur les logs de la spé.

## Calculs

- **Phases sans boss** : moins de la moitié du raid inflige des dégâts pendant plus de 4 s (boss absent, non ciblable, mécanique). Fondé sur les coups, pas sur les compétences lancées : le support continue de buffer et certains lancent dans le vide (G2 de la Cathédrale vers 7:40 : ~13 s sans aucun dégât). Retirées du temps jouable, comme le temps à terre.
- **Pauses partagées** : trou d'au moins 5 s pendant lequel au moins 2 autres DPS (et un tiers d'entre eux) n'infligent presque rien (coups sur moins de 25 % du trou) : mécanique qui désigne certains joueurs (Kazeros : 3 joueurs de groupes différents arrêtés 14 s). Affichées à part, hors temps perdu. Avec 1 seul autre DPS, ou des trous plus courts, la coïncidence est fréquente (corrélation de l'activité 0,58 → 0,50).
- **Temps perdu** : écarts entre deux utilisations au-delà de 1,5 s de battement. **Activité** = 1 − temps perdu ÷ temps jouable.
- **Buffs** : part des dégâts (coups des compétences) sous PA du support et Marque à la fois.
- **Placement** : part des dégâts des compétences à placement portés du bon côté.
- **Note** (DPS seulement) : chaque critère = rang (0-100) parmi les logs de la même spé sur le même boss (8 au minimum, sinon la spé tous boss), sur les 120 derniers jours. Activité 30, compétences 35 (utilisations par minute des compétences clés, ≥ 3 % des dégâts et jouées par 60 % de la spé, pondérées par leur part), buffs 20, placement 15 (spés dont ≥ 20 % des dégâts sont à placement). Critère absent : poids redistribué.
- **Note des supports** : couverture de leur groupe calculée par LOA Logs (`support_ap` / `_brand` / `_identity` / `_hyper` de la table `entity`, `compute_support_buffs` : part des dégâts des DPS du groupe sous le buff de PA, la Marque, l'identité et la T, pondérée par leurs dégâts, groupes à un seul support), rang parmi la même spé sur le même boss. PA 30, Marque 25, identité 25, T 10, activité 10 : poids proches de la corrélation de chaque critère avec le rDPS donné ÷ dégâts du groupe (803 supports, 29 groupes : identité 0,61, PA 0,50, Marque 0,50, activité 0,34, T 0,25 ; CP 0,53). Note : 0,66, et 0,21 avec le CP. Compétences comparées à la référence à titre indicatif (fréquence des buffs), hors note.
- Validation des DPS (2026-10-01, 649 combats récents) : corrélation de rang médiane avec DPS ÷ CP de 0,68 au sein d'une même spé, boss et difficulté (activité 0,55, compétences 0,50, placement 0,35, buffs 0,29) ; 0,24 avec le CP. Mesuré sur les mêmes logs que les références.

## Conseils (`coach.mjs`)

Chaque conseil : ce qui ne va pas (chiffres du joueur), pourquoi (gain estimé quand il se mesure), comment faire (en mots simples) et les moments du combat. Uniquement des comparaisons mesurées, aucune règle de classe écrite à la main. Les 5 plus importants sont affichés (gain estimé décroissant), le build à part.

- **Compétence clé pas assez lancée** (DPS, gain = part des dégâts × (fréquence médiane ÷ la sienne − 1), au moins 1 %). Cause par le rythme le plus rapide (10 % des écarts, approche la recharge réelle) comparé à celui de la spé :
  - compétence sans recharge (≤ 3 s de base, ex. Asura Destruction, type combo) : ressource à générer plus vite ;
  - rythme plus lent de 15 % : recharge → gemme de recharge des meilleurs (≥ 60 % en ont une) ou Rapidité de l'Évolution (5 niveaux d'écart), sinon tripods / bracelet ;
  - même rythme : prête mais pas relancée → moments où elle est restée prête plus de 3 s (hors phases sans boss, temps à terre, pauses partagées).
- **Activité** (rang < 35) : temps perdu et ses moments.
- **Buffs** (rang < 35) : gros sorts partis sans PA ou Marque, avec la couverture du support du groupe pour faire la part entre son timing et celui du joueur (écart < 2 points : les trous viennent du support).
- **Placement** (rang < 35) : les compétences à placement les moins bien placées.
- **Build** : comparé aux 25 % de la spé qui font le plus de dégâts pour leur CP (supports : couverture de PA), tous boss : stats de l'Évolution (5 niveaux d'écart), gravures et nœuds d'Ark Passive (≥ 70 % des meilleurs, ou < 15 %), gemmes de recharge.
- **Supports** : couverture PA / Marque / identité (rang < 35) avec les moments où le groupe a frappé sans (« tu étais à terre » si c'est le cas) ; buffs de PA relancés alors que le précédent est actif (même groupe, durée des tables du jeu ; au-dessus du 75e centile de la spé, moments à 2 s ou plus gaspillées ; la Marque n'est pas comptée, elle est réappliquée par beaucoup de coups) ; compétences de buff lancées moins souvent (rang < 25).
- Contrôle (150 combats, 748 joueurs, FR et EN) : aucun texte vide ou cassé ; conseils hors build par note : 6,2 (0-24), 3,5 (25-49), 1,2 (50-74), 0,4 (75-100).

## Pas encore fait

- Bracelet et stats de combat (absents du log) : à croiser avec le profil lostark.bible dans l'appli.
- Boucliers des supports (chevauchements, boucliers perdus).

- Ouverture et cycle comparés à la référence, fenêtres de burst (gros sorts lancés juste avant le buff).
- Références du top (logs de lostark.bible) : aujourd'hui, les joueurs de la base de l'utilisateur.
- Interface web (sql.js, fichier glissé dans la page, lecture du seul combat choisi).
