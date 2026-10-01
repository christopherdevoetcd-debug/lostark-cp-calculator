// Lecture de la base locale de LOA Logs (encounters.db, SQLite) en lecture seule, sous Node.
// Les requêtes sont communes avec le navigateur : js/rotation/encounters.js.
import { DatabaseSync } from 'node:sqlite';
import { gunzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export { listRaids, raidIds, loadEncounter } from '../../js/rotation/encounters.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_DB = path.join(HERE, '..', 'samples', 'encounters.db');

export function unpack(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v ? JSON.parse(v) : null;
  return JSON.parse(gunzipSync(v).toString('utf8'));
}

// Base ouverte + interface attendue par encounters.mjs (get / all / unpack).
export function openDb(file = process.env.LOA_DB || DEFAULT_DB) {
  if (!existsSync(file)) throw new Error(`Base LOA Logs introuvable : ${file} (option --db ou variable LOA_DB)`);
  const sqlite = new DatabaseSync(file, { readOnly: true });
  return {
    sqlite,
    get: (sql, args = []) => sqlite.prepare(sql).get(...args),
    all: (sql, args = []) => sqlite.prepare(sql).all(...args),
    unpack,
  };
}
