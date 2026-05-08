// snac_profile_enricher.js
// Phase 4 — Profile patch system
// Corrects or extends species profiles WITHOUT touching snac_profiles.js
//
// RULES:
//   - Never import or edit snac_profiles.js
//   - Patches are deep-merged: only keys you specify are overwritten
//   - Arrays replace entirely (not concat) — be explicit
//   - Call applyEnrichedProfiles(getProfiles()) and use the result
//   - Add new patches at the bottom of PATCHES — one object per species
//
// USAGE in useSnac.js (or wherever profiles are consumed):
//   import { getProfiles } from './snac_profiles.js';
//   import { applyEnrichedProfiles } from './snac_profile_enricher.js';
//   const profiles = applyEnrichedProfiles(getProfiles());

// ---------------------------------------------------------------------------
// PATCH REGISTRY
// Each entry: { key, field, value, reason, date, source }
// field: dot-notation path into the raw profile   e.g. 'home_range_km2'
//        or nested                                 e.g. 'behavior_weights.denning_behavior.den_radius_m'
// value: the corrected value (replaces existing)
// ---------------------------------------------------------------------------

const PATCHES = [

  // --- BLACKTAIL DEER corrections (confirmed field) ---
  {
    key:    'blacktail_deer',
    field:  'home_range_km2',
    value:  1.4,
    reason: 'Original value 3.5 too high for coastal BC blacktail. Resident range 0.8-2.0 km2. 1.4 is centroid.',
    date:   '2026-04',
    source: 'Adam field / Pojar & MacKinnon BC habitat data',
  },

  // --- Add your next patches below this line ---
  // Example (uncomment and fill):
  // {
  //   key:    'mule_deer',
  //   field:  'behavior_weights.track_age_decay.environmental_sensitivity',
  //   value:  0.80,
  //   reason: 'Mule deer in arid terrain show faster decay than default 0.70',
  //   date:   '2026-04',
  //   source: 'Adam field',
  // },

];

// ---------------------------------------------------------------------------
// Deep merge helper — only goes as deep as needed for dot-notation paths
// ---------------------------------------------------------------------------

function setDeep(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== 'object') {
      cur[p] = {};
    } else {
      // Clone so we don't mutate the original profile object
      cur[p] = Array.isArray(cur[p]) ? [...cur[p]] : { ...cur[p] };
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

// ---------------------------------------------------------------------------
// applyEnrichedProfiles
// Takes the profiles map from getProfiles(), returns a patched copy.
// Original map is never mutated.
// ---------------------------------------------------------------------------

export function applyEnrichedProfiles(profilesMap) {
  if (!profilesMap || typeof profilesMap !== 'object') return profilesMap;

  // Shallow clone the map so we can replace individual species objects
  const out = { ...profilesMap };

  const log = [];

  for (const patch of PATCHES) {
    const { key, field, value, reason, date, source } = patch;

    if (!key || !field || value === undefined) {
      console.warn('[Enricher] Malformed patch — skipping:', patch);
      continue;
    }

    const original = out[key];
    if (!original) {
      console.warn(`[Enricher] Species key not found: ${key} — patch skipped`);
      continue;
    }

    // Deep clone the species profile so we never mutate the bundled object
    const patched = JSON.parse(JSON.stringify(original));
    setDeep(patched, field, value);
    out[key] = patched;

    log.push({ key, field, date, source });
  }

  if (log.length > 0) {
    console.log(`[Enricher] Applied ${log.length} patch(es):`, log.map(l => `${l.key}.${l.field}`).join(', '));
  }

  return out;
}

// ---------------------------------------------------------------------------
// getPatchLog — returns human-readable list of all registered patches
// Useful for a future "Profile corrections" UI in the species library
// ---------------------------------------------------------------------------

export function getPatchLog() {
  return PATCHES.map(p => ({
    species: p.key,
    field:   p.field,
    reason:  p.reason,
    date:    p.date,
    source:  p.source,
  }));
}

// ---------------------------------------------------------------------------
// getPatchesForSpecies — returns patches for a single species key
// ---------------------------------------------------------------------------

export function getPatchesForSpecies(speciesKey) {
  return PATCHES.filter(p => p.key === speciesKey);
}
