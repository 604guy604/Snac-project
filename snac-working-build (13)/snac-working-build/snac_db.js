import * as SQLite from 'expo-sqlite';

const DB_NAME    = 'snac_field.db';
const DB_VERSION = 3;

export const CONFIDENCE_THRESHOLD = 0.75;
export const MIN_ELIGIBLE_RUNS    = 20;

let _db = null;

function getDb() {
  if (!_db) throw new Error('[SNAC DB] Database not initialised. Call initDB() first.');
  return _db;
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function nowIso() {
  return new Date().toISOString();
}

function safeJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return null; }
}

function parseJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}

async function exec(sql, params = []) {
  const db = getDb();
  return db.runAsync(sql, params);
}

async function query(sql, params = []) {
  const db = getDb();
  return db.getAllAsync(sql, params);
}

async function queryOne(sql, params = []) {
  const db = getDb();
  return db.getFirstAsync(sql, params);
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS runs (
    id                    TEXT PRIMARY KEY,
    created_at            TEXT NOT NULL,
    local_hour            INTEGER,
    light_phase           TEXT,
    gps_lat               REAL,
    gps_lon               REAL,
    altitude_m            REAL,

    -- Inputs (serialised JSON)
    sensor_detections     TEXT,
    raw_environment       TEXT,
    raw_time_context      TEXT,

    -- Core outputs
    species_detected      TEXT,           -- JSON array
    primary_behavior      TEXT,
    behavior_scores       TEXT,           -- JSON object
    viability_score       REAL,
    viability_status      TEXT,
    follow_priority       TEXT,
    decay_status          TEXT,
    tracking_confidence   REAL,
    recommendation        TEXT,
    movement_pattern      TEXT,
    predicted_heading_deg REAL,
    cluster_count         INTEGER,

    -- Field observations
    sign_tags             TEXT,           -- JSON array
    field_notes           TEXT,
    gait                  TEXT,
    substrate             TEXT,
    behavior_hint         TEXT,

    -- Profile version active at time of run
    profile_version_id    TEXT,

    -- Sync
    synced                INTEGER DEFAULT 0,
    sync_attempts         INTEGER DEFAULT 0,
    last_sync_error       TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS harvests (
    id                    TEXT PRIMARY KEY,
    run_id                TEXT NOT NULL,
    created_at            TEXT NOT NULL,
    species_confirmed     TEXT,
    harvest_distance_yds  REAL,
    harvest_notes         TEXT,
    harvest_gps_lat       REAL,
    harvest_gps_lon       REAL,

    -- Denormalised from run for faster aggregation
    tracking_confidence   REAL,
    recommendation        TEXT,
    primary_behavior      TEXT,
    behavior_scores       TEXT,           -- JSON object
    sign_tags             TEXT,           -- JSON array
    field_notes           TEXT,

    -- Data contribution
    contribute_to_model   INTEGER DEFAULT 1,

    -- Sync
    synced                INTEGER DEFAULT 0,
    sync_attempts         INTEGER DEFAULT 0,
    last_sync_error       TEXT,

    FOREIGN KEY (run_id) REFERENCES runs(id)
  )`,

  `CREATE TABLE IF NOT EXISTS profile_versions (
    id                    TEXT PRIMARY KEY,
    created_at            TEXT NOT NULL,
    version_label         TEXT,           -- e.g. "2024-W42" or "grok_batch_3"
    source                TEXT,           -- 'bundled' | 'user_update' | 'auto_update'
    profiles_json         TEXT NOT NULL,  -- full profiles object serialised
    species_count         INTEGER,
    delta_from_baseline   TEXT,           -- JSON: { species_key: { field: delta } }
    delta_from_previous   TEXT,           -- JSON: same shape
    is_active             INTEGER DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS sync_queue (
    id                    TEXT PRIMARY KEY,
    created_at            TEXT NOT NULL,
    table_name            TEXT NOT NULL,  -- 'runs' | 'harvests'
    record_id             TEXT NOT NULL,
    payload               TEXT NOT NULL,  -- JSON snapshot at time of queue
    priority              INTEGER DEFAULT 0,  -- higher = first
    attempts              INTEGER DEFAULT 0,
    last_attempt_at       TEXT,
    last_error            TEXT,
    synced                INTEGER DEFAULT 0,
    synced_at             TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS user_prefs (
    key                   TEXT PRIMARY KEY,
    value                 TEXT,
    updated_at            TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_runs_species     ON runs(species_detected)`,
  `CREATE INDEX IF NOT EXISTS idx_runs_confidence  ON runs(tracking_confidence)`,
  `CREATE INDEX IF NOT EXISTS idx_runs_synced      ON runs(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_runs_created     ON runs(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_harvests_run     ON harvests(run_id)`,
  `CREATE INDEX IF NOT EXISTS idx_harvests_species ON harvests(species_confirmed)`,
  `CREATE INDEX IF NOT EXISTS idx_harvests_synced  ON harvests(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_ready ON sync_queue(synced, attempts)`,
  `CREATE INDEX IF NOT EXISTS idx_profile_active   ON profile_versions(is_active)`
];

export async function initDB() {
  if (_db) return;

  _db = await SQLite.openDatabaseAsync(DB_NAME);

  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await _db.execAsync('PRAGMA foreign_keys = ON;');

  await _db.withTransactionAsync(async () => {
    for (const statement of SCHEMA) {
      await _db.execAsync(statement);
    }
  });

  const stored = await queryOne('SELECT value FROM user_prefs WHERE key = ?', ['db_version']);
  const storedVersion = stored ? parseInt(stored.value, 10) : 0;

  if (storedVersion < DB_VERSION) {
    await _runMigrations(storedVersion, DB_VERSION);
    await exec(
      `INSERT OR REPLACE INTO user_prefs (key, value, updated_at) VALUES (?, ?, ?)`,
      ['db_version', String(DB_VERSION), nowIso()]
    );
  }

  console.log(`[SNAC DB] Ready - v${DB_VERSION}`);
}

async function _runMigrations(from, to) {
  console.log(`[SNAC DB] Migrated ${from}  ${to}`);
}

export async function logRun(p = {}) {
  const id         = uuid();
  const createdAt  = nowIso();
  const summary    = p.result?.summary ?? {};
  const decision   = p.result?.decision ?? {};
  const full       = p.result?.full ?? {};
  const timeCtx    = p.rawTimeContext ?? {};
  const fieldState = p.fieldState ?? {};

  await exec(
    `INSERT INTO runs (
      id, created_at, local_hour, light_phase,
      gps_lat, gps_lon, altitude_m,
      sensor_detections, raw_environment, raw_time_context,
      species_detected, primary_behavior, behavior_scores,
      viability_score, viability_status, follow_priority,
      decay_status, tracking_confidence, recommendation,
      movement_pattern, predicted_heading_deg, cluster_count,
      sign_tags, field_notes, gait, substrate, behavior_hint,
      profile_version_id, synced
    ) VALUES (
      ?,?,?,?,
      ?,?,?,
      ?,?,?,
      ?,?,?,
      ?,?,?,
      ?,?,?,
      ?,?,?,
      ?,?,?,?,?,
      ?,0
    )`,
    [
      id, createdAt,
      timeCtx.local_hour ?? new Date().getHours(),
      timeCtx.light_phase ?? null,

      p.gps?.lat ?? null, p.gps?.lon ?? null, p.gps?.altitude_m ?? null,

      safeJson(p.sensorDetections),
      safeJson(p.rawEnvironment),
      safeJson(p.rawTimeContext),

      safeJson(summary.species_detected),
      summary.primary_behavior ?? null,
      safeJson(full.behavior?.behavior_scores),

      decision.viability_score ?? full.viability?.viability_score ?? null,
      summary.viability_status ?? null,
      summary.follow_priority  ?? null,

      summary.decay_status          ?? null,
      decision.tracking_confidence  ?? null,
      decision.recommendation       ?? null,

      summary.movement_pattern      ?? null,
      decision.predicted_heading_deg ?? null,
      summary.cluster_count         ?? null,

      safeJson(fieldState.signTags ?? []),
      fieldState.fieldNotes  ?? null,
      fieldState.gait        ?? null,
      fieldState.substrate   ?? null,
      fieldState.behavior    ?? null,

      p.profileVersionId ?? null
    ]
  );

  await _enqueueSync('runs', id, {
    id, created_at: createdAt,
    species_detected:     summary.species_detected,
    primary_behavior:     summary.primary_behavior,
    behavior_scores:      full.behavior?.behavior_scores,
    tracking_confidence:  decision.tracking_confidence,
    recommendation:       decision.recommendation,
    viability_status:     summary.viability_status,
    follow_priority:      summary.follow_priority,
    decay_status:         summary.decay_status,
    movement_pattern:     summary.movement_pattern,
    cluster_count:        summary.cluster_count,
    sign_tags:            fieldState.signTags,
    field_notes:          fieldState.fieldNotes,
    gps_lat:              p.gps?.lat,
    gps_lon:              p.gps?.lon,
    local_hour:           timeCtx.local_hour,
    light_phase:          timeCtx.light_phase,
    profile_version_id:   p.profileVersionId
  }, 1);

  console.log(`[SNAC DB] Run logged: ${id}`);
  return id;
}

export async function getRunsForSpecies(speciesKey) {
  const rows = await query(
    `SELECT * FROM runs WHERE species_detected LIKE ? ORDER BY created_at DESC`,
    [`%${speciesKey}%`]
  );
  return rows.map(_deserialiseRun);
}

export async function getEligibleRuns(speciesKey, minConfidence = CONFIDENCE_THRESHOLD) {
  const rows = await query(
    `SELECT * FROM runs
     WHERE species_detected LIKE ?
       AND tracking_confidence >= ?
     ORDER BY created_at DESC`,
    [`%${speciesKey}%`, minConfidence]
  );
  return rows.map(_deserialiseRun);
}

export async function getRunStats() {
  const total     = await queryOne(`SELECT COUNT(*) as n FROM runs`);
  const synced    = await queryOne(`SELECT COUNT(*) as n FROM runs WHERE synced = 1`);
  const pending   = await queryOne(`SELECT COUNT(*) as n FROM runs WHERE synced = 0`);
  const highConf  = await queryOne(`SELECT COUNT(*) as n FROM runs WHERE tracking_confidence >= ?`, [CONFIDENCE_THRESHOLD]);
  const species   = await query(`SELECT DISTINCT species_detected FROM runs`);

  return {
    totalRuns:       total?.n ?? 0,
    syncedRuns:      synced?.n ?? 0,
    pendingSync:     pending?.n ?? 0,
    highConfRuns:    highConf?.n ?? 0,
    speciesInLog:    species.map(r => parseJson(r.species_detected)).flat().filter(Boolean)
  };
}

function _deserialiseRun(row) {
  return {
    ...row,
    species_detected:  parseJson(row.species_detected),
    behavior_scores:   parseJson(row.behavior_scores),
    sensor_detections: parseJson(row.sensor_detections),
    raw_environment:   parseJson(row.raw_environment),
    raw_time_context:  parseJson(row.raw_time_context),
    sign_tags:         parseJson(row.sign_tags)
  };
}

export async function logHarvest(p = {}) {
  const id        = uuid();
  const createdAt = nowIso();
  const contribute = p.contribute_to_model !== false ? 1 : 0;

  await exec(
    `INSERT INTO harvests (
      id, run_id, created_at,
      species_confirmed, harvest_distance_yds, harvest_notes,
      harvest_gps_lat, harvest_gps_lon,
      tracking_confidence, recommendation, primary_behavior,
      behavior_scores, sign_tags, field_notes,
      contribute_to_model, synced
    ) VALUES (
      ?,?,?,
      ?,?,?,
      ?,?,
      ?,?,?,
      ?,?,?,
      ?,0
    )`,
    [
      id, p.run_id ?? null, createdAt,
      p.species_confirmed     ?? null,
      p.harvest_distance_yds  ?? null,
      p.harvest_notes         ?? null,
      p.harvest_gps?.lat      ?? null,
      p.harvest_gps?.lon      ?? null,
      p.tracking_confidence   ?? null,
      p.recommendation        ?? null,
      p.primary_behavior      ?? null,
      safeJson(p.behavior_scores),
      safeJson(p.sign_tags ?? []),
      p.field_notes           ?? null,
      contribute
    ]
  );

  if (contribute) {
    await _enqueueSync('harvests', id, {
      id, run_id: p.run_id, created_at: createdAt,
      species_confirmed:    p.species_confirmed,
      harvest_distance_yds: p.harvest_distance_yds,
      harvest_notes:        p.harvest_notes,
      harvest_gps_lat:      p.harvest_gps?.lat ? _fuzzeGps(p.harvest_gps.lat) : null,
      harvest_gps_lon:      p.harvest_gps?.lon ? _fuzzeGps(p.harvest_gps.lon) : null,
      tracking_confidence:  p.tracking_confidence,
      recommendation:       p.recommendation,
      primary_behavior:     p.primary_behavior,
      behavior_scores:      p.behavior_scores,
      sign_tags:            p.sign_tags,
      field_notes:          p.field_notes
    }, 2);
  }

  console.log(`[SNAC DB] Harvest logged: ${id} - contribute=${!!contribute}`);
  return id;
}

function _fuzzeGps(coord) {
  return Math.round(coord * 100) / 100;
}

export async function getHarvests(limit = 50) {
  const rows = await query(
    `SELECT * FROM harvests ORDER BY created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(r => ({
    ...r,
    behavior_scores: parseJson(r.behavior_scores),
    sign_tags:       parseJson(r.sign_tags)
  }));
}

export async function saveProfileVersion(profiles, meta = {}) {
  const id        = uuid();
  const createdAt = nowIso();
  const speciesCount = Object.keys(profiles ?? {}).length;

  if (meta.setActive !== false) {
    await exec(`UPDATE profile_versions SET is_active = 0`);
  }

  await exec(
    `INSERT INTO profile_versions (
      id, created_at, version_label, source,
      profiles_json, species_count,
      delta_from_baseline, delta_from_previous,
      is_active
    ) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id, createdAt,
      meta.versionLabel ?? createdAt.slice(0, 10),
      meta.source       ?? 'bundled',
      safeJson(profiles),
      speciesCount,
      safeJson(meta.deltaFromBaseline ?? null),
      safeJson(meta.deltaFromPrevious ?? null),
      meta.setActive !== false ? 1 : 0
    ]
  );

  console.log(`[SNAC DB] Profile version saved: ${id} (${speciesCount} species)`);
  return id;
}

export async function getLatestProfiles() {
  const row = await queryOne(
    `SELECT * FROM profile_versions WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1`
  );
  if (!row) return null;
  return {
    profiles: parseJson(row.profiles_json),
    meta: {
      id:                   row.id,
      createdAt:            row.created_at,
      versionLabel:         row.version_label,
      source:               row.source,
      speciesCount:         row.species_count,
      deltaFromBaseline:    parseJson(row.delta_from_baseline),
      deltaFromPrevious:    parseJson(row.delta_from_previous)
    }
  };
}

export async function getProfileVersions() {
  const rows = await query(
    `SELECT id, created_at, version_label, source, species_count, is_active
     FROM profile_versions ORDER BY created_at DESC`
  );
  return rows;
}

async function _enqueueSync(tableName, recordId, payload, priority = 0) {
  const id = uuid();
  await exec(
    `INSERT INTO sync_queue (id, created_at, table_name, record_id, payload, priority)
     VALUES (?,?,?,?,?,?)`,
    [id, nowIso(), tableName, recordId, safeJson(payload), priority]
  );
}

export async function getPendingSyncs(limit = 100) {
  const rows = await query(
    `SELECT * FROM sync_queue
     WHERE synced = 0 AND attempts < 5
     ORDER BY priority DESC, created_at ASC
     LIMIT ?`,
    [limit]
  );
  return rows.map(r => ({ ...r, payload: parseJson(r.payload) }));
}

export async function markSynced(ids = []) {
  if (!ids.length) return;
  const now = nowIso();

  await getDb().withTransactionAsync(async () => {
    for (const id of ids) {
      const item = await queryOne(`SELECT * FROM sync_queue WHERE id = ?`, [id]);
      if (!item) continue;

      await exec(
        `UPDATE sync_queue SET synced = 1, synced_at = ?, last_error = NULL WHERE id = ?`,
        [now, id]
      );
      await exec(
        `UPDATE ${item.table_name} SET synced = 1 WHERE id = ?`,
        [item.record_id]
      );
    }
  });

  console.log(`[SNAC DB] Marked synced: ${ids.length} items`);
}

export async function markSyncFailed(id, errorMessage = '') {
  await exec(
    `UPDATE sync_queue
     SET attempts = attempts + 1,
         last_attempt_at = ?,
         last_error = ?
     WHERE id = ?`,
    [nowIso(), String(errorMessage).slice(0, 500), id]
  );
}

export async function getSyncQueueCount() {
  const row = await queryOne(
    `SELECT COUNT(*) as n FROM sync_queue WHERE synced = 0 AND attempts < 5`
  );
  return row?.n ?? 0;
}

export async function getPref(key) {
  const row = await queryOne(
    `SELECT value FROM user_prefs WHERE key = ?`,
    [key]
  );
  return row ? parseJson(row.value) : null;
}

export async function setPref(key, value) {
  await exec(
    `INSERT OR REPLACE INTO user_prefs (key, value, updated_at) VALUES (?,?,?)`,
    [key, safeJson(value), nowIso()]
  );
}

export async function getAllPrefs() {
  const rows = await query(`SELECT key, value FROM user_prefs`);
  const out = {};
  for (const row of rows) {
    out[row.key] = parseJson(row.value);
  }
  return out;
}

export async function ensureDefaultPrefs() {
  const defaults = {
    confidence_threshold:        CONFIDENCE_THRESHOLD,
    min_eligible_runs:           MIN_ELIGIBLE_RUNS,
    weight_update_cap:           0.03,
    contribute_by_default:       true,
    last_profile_check:          null,
    profile_update_interval_days: 14,
    units:                       'metric',
    onboarded:                   false
  };

  for (const [key, value] of Object.entries(defaults)) {
    const existing = await getPref(key);
    if (existing === null) {
      await setPref(key, value);
    }
  }

  console.log('[SNAC DB] Default prefs ensured');
}

export async function checkWeightUpdateEligibility(speciesKey) {
  const minConf  = await getPref('confidence_threshold') ?? CONFIDENCE_THRESHOLD;
  const minRuns  = await getPref('min_eligible_runs')    ?? MIN_ELIGIBLE_RUNS;

  const row = await queryOne(
    `SELECT COUNT(*) as n FROM runs
     WHERE species_detected LIKE ?
       AND tracking_confidence >= ?`,
    [`%${speciesKey}%`, minConf]
  );

  const count = row?.n ?? 0;
  return {
    eligible:  count >= minRuns,
    count,
    threshold: minRuns,
    minConfidence: minConf
  };
}

export async function getAggregatedScores(speciesKey) {
  const minConf = await getPref('confidence_threshold') ?? CONFIDENCE_THRESHOLD;

  const rows = await query(
    `SELECT behavior_scores, tracking_confidence FROM runs
     WHERE species_detected LIKE ?
       AND tracking_confidence >= ?
       AND behavior_scores IS NOT NULL`,
    [`%${speciesKey}%`, minConf]
  );

  if (!rows.length) return null;

  const scoreSums   = {};
  const weightSums  = {};

  for (const row of rows) {
    const scores = parseJson(row.behavior_scores);
    const weight = row.tracking_confidence ?? 0.75;
    if (!scores || typeof scores !== 'object') continue;

    for (const [key, val] of Object.entries(scores)) {
      if (typeof val !== 'number') continue;
      scoreSums[key]  = (scoreSums[key]  ?? 0) + val * weight;
      weightSums[key] = (weightSums[key] ?? 0) + weight;
    }
  }

  const means = {};
  for (const key of Object.keys(scoreSums)) {
    means[key] = weightSums[key] > 0
      ? parseFloat((scoreSums[key] / weightSums[key]).toFixed(4))
      : null;
  }

  return { means, count: rows.length };
}

export async function _dangerDropAllData() {
  const db = getDb();
  await db.withTransactionAsync(async () => {
    for (const t of ['runs','harvests','profile_versions','sync_queue','user_prefs']) {
      await db.execAsync(`DELETE FROM ${t}`);
    }
  });
  console.warn('[SNAC DB]  All data wiped');
}

export async function closeDB() {
  if (_db) {
    await _db.closeAsync();
    _db = null;
    console.log('[SNAC DB] Closed');
  }
}