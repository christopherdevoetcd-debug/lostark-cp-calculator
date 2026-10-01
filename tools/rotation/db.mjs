// Lecture de la base locale de LOA Logs (encounters.db, SQLite) en lecture seule.
// Les colonnes JSON (skills, damage_stats, buffs, debuffs, boss_hp_log, misc) sont compressées en gzip.
import { DatabaseSync } from 'node:sqlite';
import { gunzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DB = path.join(HERE, '..', 'samples', 'encounters.db');

export function openDb(file = process.env.LOA_DB || DEFAULT_DB) {
  if (!existsSync(file)) throw new Error(`Base LOA Logs introuvable : ${file} (option --db ou variable LOA_DB)`);
  return new DatabaseSync(file, { readOnly: true });
}

export function unpack(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v ? JSON.parse(v) : null;
  return JSON.parse(gunzipSync(v).toString('utf8'));
}

// Combats de raid exploitables : réussis, pas en solo ni en matchmaking, plus de 2 minutes.
const RAID_FILTER = `p.cleared = 1 AND p.difficulty IS NOT NULL AND p.difficulty NOT IN ('Solo', 'Matching') AND p.duration > 120000`;

export function listRaids(db, { player, boss, limit = 20 } = {}) {
  const where = [RAID_FILTER];
  const args = [];
  if (player) { where.push(`EXISTS (SELECT 1 FROM entity e WHERE e.encounter_id = p.id AND e.name = ? AND e.entity_type = 'PLAYER')`); args.push(player); }
  if (boss) { where.push('p.current_boss LIKE ?'); args.push(`%${boss}%`); }
  return db.prepare(`SELECT p.id, p.fight_start, p.current_boss, p.difficulty, p.duration, p.local_player, s.upstream_id
    FROM encounter_preview p LEFT JOIN sync_logs s ON s.encounter_id = p.id
    WHERE ${where.join(' AND ')} ORDER BY p.fight_start DESC LIMIT ?`).all(...args, limit);
}

export function raidIds(db) {
  return db.prepare(`SELECT p.id FROM encounter_preview p WHERE ${RAID_FILTER} ORDER BY p.id`).all().map(r => r.id);
}

export function loadEncounter(db, id) {
  const p = db.prepare(`SELECT p.*, s.upstream_id FROM encounter_preview p LEFT JOIN sync_logs s ON s.encounter_id = p.id WHERE p.id = ?`).get(id);
  if (!p) throw new Error(`Combat ${id} introuvable`);
  const e = db.prepare('SELECT buffs, debuffs, misc, last_combat_packet FROM encounter WHERE id = ?').get(id);
  // support_* : pour un support, part des dégâts des DPS de son groupe (pondérée par leurs dégâts) faite sous son buff
  // de PA, sa Marque, son identité et sa T (compute_support_buffs de LOA Logs, groupes à un seul support).
  const players = db.prepare(`SELECT name, class, class_id, spec, combat_power, gear_score, skills, damage_stats, skill_stats,
      support_ap, support_brand, support_identity, support_hyper, rdps_damage_given, engravings, ark_passive_data
    FROM entity WHERE encounter_id = ? AND entity_type = 'PLAYER'`).all(id).map(r => ({
      name: r.name, className: r.class, classId: r.class_id, spec: r.spec || null,
      combatPower: r.combat_power, gearScore: r.gear_score,
      supportCoverage: { ap: r.support_ap, brand: r.support_brand, identity: r.support_identity, hat: r.support_hyper },
      rdpsGiven: r.rdps_damage_given || 0,
      engravings: unpack(r.engravings) || [], arkPassive: unpack(r.ark_passive_data) || null,
      skills: unpack(r.skills) || {}, damageStats: unpack(r.damage_stats) || {}, skillStats: unpack(r.skill_stats) || {},
    }));
  return {
    // durationMs = durée affichée par LOA Logs, qui retire certains passages (ex. Kazeros) ; timelineMs = chronologie
    // complète des utilisations et des morts, jusqu'au dernier paquet de combat.
    id: p.id, boss: p.current_boss, difficulty: p.difficulty, durationMs: p.duration, fightStart: p.fight_start,
    timelineMs: Math.max(p.duration, (e.last_combat_packet || 0) - p.fight_start),
    localPlayer: p.local_player, bibleId: p.upstream_id || null,
    buffs: unpack(e.buffs) || {}, debuffs: unpack(e.debuffs) || {}, misc: unpack(e.misc) || {},
    players,
  };
}
