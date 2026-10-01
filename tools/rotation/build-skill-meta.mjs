// Table légère des compétences de joueur (recharge de base, placement) pour l'analyseur de rotation.
// Source : Skill.json des tables du jeu embarquées par LOA Logs (meter-data).
// Usage : node tools/rotation/build-skill-meta.mjs [chemin/vers/Skill.json]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SRC_URL = 'https://raw.githubusercontent.com/snoww/loa-logs/master/src-tauri/meter-data/Skill.json';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data', 'rotation-skills.json');

const file = process.argv[2];
const skills = file ? JSON.parse(readFileSync(file, 'utf8')) : await (await fetch(SRC_URL)).json();

// directionalMask : 1 = attaque de dos, 2 = attaque de face, 3 = les deux.
const out = {};
for (const s of Object.values(skills)) {
  if (!s.classId) continue;
  out[s.id] = { n: s.name, c: s.classId, cd: s.cooldown || 0, dm: s.directionalMask || 0, t: s.type };
}
writeFileSync(OUT, JSON.stringify({ source: file ? path.basename(file) : SRC_URL, built: new Date().toISOString().slice(0, 10), skills: out }));
console.log(`${Object.keys(out).length} compétences écrites dans ${path.relative(process.cwd(), OUT)}`);
