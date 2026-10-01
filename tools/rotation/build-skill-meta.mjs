// Tables légères pour l'analyseur de rotation, tirées des tables du jeu embarquées par LOA Logs (meter-data) :
// compétences de joueur (recharge de base, placement), noms des nœuds d'Ark Passive, buffs de support (durée, groupe).
// Usage : node tools/rotation/build-skill-meta.mjs [dossier meter-data local]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SRC = 'https://raw.githubusercontent.com/snoww/loa-logs/master/src-tauri/meter-data/';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'rotation-skills.json');

const dir = process.argv[2];
const load = async name => (dir ? JSON.parse(readFileSync(path.join(dir, name), 'utf8')) : (await fetch(SRC + name)).json());

// directionalMask : 1 = attaque de dos, 2 = attaque de face, 3 = les deux.
const skills = {};
for (const s of Object.values(await load('Skill.json'))) {
  if (!s.classId) continue;
  skills[s.id] = { n: s.name, c: s.classId, cd: s.cooldown || 0, dm: s.directionalMask || 0, t: s.type };
}

const arkPassive = {};
for (const n of Object.values(await load('ArkPassive.json'))) {
  const l = n.levels?.['1'];
  if (l?.name) arkPassive[n.id] = l.name;
}

// Buffs de support (catégorie supportbuff) et Marque : durée en ms (-1 = permanent), groupe (uniqueGroup).
const buffs = {};
for (const b of Object.values(await load('SkillBuff.json'))) {
  if (b.buffCategory === 'supportbuff' || b.uniqueGroup === 210230) buffs[b.id] = { n: b.name, d: b.duration, g: b.uniqueGroup };
}

writeFileSync(OUT, JSON.stringify({ source: dir ? 'meter-data local' : SRC, built: new Date().toISOString().slice(0, 10), skills, arkPassive, buffs }));
console.log(`${Object.keys(skills).length} compétences, ${Object.keys(arkPassive).length} nœuds d'Ark Passive, ${Object.keys(buffs).length} buffs → ${path.relative(process.cwd(), OUT)}`);
