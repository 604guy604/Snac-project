import {
  checkWeightUpdateEligibility,
  getAggregatedScores,
  saveProfileVersion,
  getPref
} from './snac_db.js';
import { getProfiles, loadProfilesFromDB } from './snac_profiles.js';

const WEIGHT_CAP         = 0.03;
const MIN_ELIGIBLE_RUNS  = 20;
const CONFIDENCE_FLOOR   = 0.75;

const ADJUSTABLE_FIELDS = {
  track_age_decay: [
    'weight',
    'same_band_threshold',
    'separate_band_threshold',
    'environmental_sensitivity'
  ],
  flight_or_forage: [
    'flight_weight',
    'forage_weight',
    'direction_change_threshold_deg',
    'spread_tightness_threshold_m',
    'stride_variance_threshold',
    'freshness_cluster_threshold'
  ],
  denning_behavior: [
    'den_radius_m',
    'return_radius_m',
    'bedding_spread_threshold_m',
    'freshness_cluster_threshold',
    'denning_weight'
  ],
  scent_marking_behavior: [
    'marking_radius_m',
    'revisit_radius_m',
    'route_reuse_threshold_m',
    'freshness_cluster_threshold',
    'scent_weight'
  ],
  movement_pattern: [
    'loopback_radius_m',
    'zigzag_direction_threshold_deg',
    'escape_line_direction_variance_threshold',
    'water_approach_radius_m',
    'trail_reuse_radius_m'
  ],
  terrain_intelligence: [
    'terrain_weight',
    'water_edge_weight',
    'cover_weight',
    'open_ground_weight',
    'elevation_weight'
  ]
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function applyDelta(current, observed, cap, floor = 0, ceil = Infinity) {
  if (!Number.isFinite(current) || !Number.isFinite(observed)) {
    return { newValue: current, delta: 0 };
  }
  const rawDelta  = observed - current;
  const capped    = clamp(rawDelta, -cap, cap);
  const newValue  = clamp(current + capped, floor, ceil);
  const delta     = Number((newValue - current).toFixed(6));
  return { newValue: Number(newValue.toFixed(6)), delta };
}

function weightedMean(samples) {
  const valid = samples.filter(
    s => Number.isFinite(s?.value) && Number.isFinite(s?.confidence) && s.confidence > 0
  );
  if (!valid.length) return null;
  const totalWeight = valid.reduce((sum, s) => sum + s.confidence, 0);
  const weightedSum = valid.reduce((sum, s) => sum + s.value * s.confidence, 0);
  return totalWeight > 0 ? weightedSum / totalWeight : null;
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function computeSpeciesUpdate(speciesKey, currentProfile, aggregatedScores) {
  const updatedProfile = deepCopy(currentProfile);
  const deltas = {};
  let fieldCount = 0;

  for (const [blockKey, fields] of Object.entries(ADJUSTABLE_FIELDS)) {
    const currentBlock   = currentProfile[blockKey];
    const observedBlock  = aggregatedScores[blockKey];

    if (!currentBlock || !observedBlock) continue;

    deltas[blockKey] = {};

    for (const field of fields) {
      const current  = currentBlock[field];
      const observed = observedBlock[field];

      if (!Number.isFinite(current) || !Number.isFinite(observed)) continue;

      let floor = 0, ceil = Infinity, effectiveCap = WEIGHT_CAP;
      if (field.endsWith('_weight') ||
         (field.includes('threshold') && !field.includes('_m') && !field.includes('_deg'))) {
        floor = 0; ceil = 1;
        effectiveCap = WEIGHT_CAP;
      } else if (field.endsWith('_m')) {
        floor = 0.5; ceil = 10000;
        effectiveCap = Math.max(0.5, current * WEIGHT_CAP);
      } else if (field.endsWith('_deg')) {
        floor = 5; ceil = 180;
        effectiveCap = Math.max(0.5, current * WEIGHT_CAP);
      }

      const { newValue, delta } = applyDelta(current, observed, effectiveCap, floor, ceil);

      if (Math.abs(delta) > 0.000001) {
        updatedProfile[blockKey][field] = newValue;
        deltas[blockKey][field] = { from: current, to: newValue, delta };
        fieldCount++;
      }
    }

    if (!Object.keys(deltas[blockKey]).length) delete deltas[blockKey];
  }

  return { updatedProfile, deltas, fieldCount };
}

export async function getUpdateEligibility() {
  const profiles = getProfiles();
  const speciesKeys = Object.keys(profiles);
  const eligible = [], ineligible = [];

  await Promise.all(speciesKeys.map(async key => {
    try {
      const check = await checkWeightUpdateEligibility(key);
      if (check?.eligible) {
        eligible.push(key);
      } else {
        ineligible.push({
          key,
          reason:   check?.reason   ?? 'unknown',
          runCount: check?.runCount ?? 0
        });
      }
    } catch {
      ineligible.push({ key, reason: 'db_error', runCount: 0 });
    }
  }));

  return { eligible, ineligible, totalSpecies: speciesKeys.length };
}

export async function runWeightUpdate({ dryRun = false } = {}) {
  const profiles = getProfiles();
  if (!profiles || !Object.keys(profiles).length) {
    return {
      valid: false, reason: 'no_profiles_loaded',
      speciesUpdated: 0, totalFieldsChanged: 0,
      newVersionLabel: null, report: {}, dryRun
    };
  }

  const { eligible } = await getUpdateEligibility();
  if (!eligible.length) {
    return {
      valid: true, reason: 'no_eligible_species',
      speciesUpdated: 0, totalFieldsChanged: 0,
      newVersionLabel: null, report: {}, dryRun
    };
  }

  const updatedProfiles = deepCopy(profiles);
  const report = {};
  let totalFieldsChanged = 0;
  let speciesUpdated = 0;

  for (const key of eligible) {
    try {
      const aggregatedScores = await getAggregatedScores(key);
      if (!aggregatedScores) continue;

      const { updatedProfile, deltas, fieldCount } = computeSpeciesUpdate(
        key, profiles[key], aggregatedScores
      );

      if (fieldCount > 0) {
        updatedProfiles[key]  = updatedProfile;
        report[key]           = { deltas, fieldCount };
        totalFieldsChanged   += fieldCount;
        speciesUpdated++;
      }
    } catch (err) {
      report[key] = { error: err.message };
    }
  }

  if (!totalFieldsChanged) {
    return {
      valid: true, reason: 'no_changes_needed',
      speciesUpdated: 0, totalFieldsChanged: 0,
      newVersionLabel: null, report, dryRun
    };
  }

  let newVersionLabel = null;
  if (!dryRun) {
    const now   = new Date();
    newVersionLabel = `auto_${now.toISOString().slice(0,10)}_${speciesUpdated}sp`;

    await saveProfileVersion(updatedProfiles, {
      versionLabel: newVersionLabel,
      source:       'weight_updater',
      speciesUpdated,
      totalFieldsChanged,
      updatedAt:    now.toISOString()
    });

    await loadProfilesFromDB();
  }

  return {
    valid: true,
    speciesUpdated,
    totalFieldsChanged,
    newVersionLabel,
    report,
    dryRun
  };
}

export async function getWeightHistory() {
  try {
    const lastRun    = await getPref('last_weight_update_at').catch(() => null);
    const lastResult = await getPref('last_weight_update_result').catch(() => null);
    return {
      lastRun,
      lastResult: lastResult ? JSON.parse(lastResult) : null
    };
  } catch {
    return { lastRun: null, lastResult: null };
  }
}

export async function previewSpeciesUpdate(speciesKey) {
  try {
    const profiles = getProfiles();
    const profile  = profiles[speciesKey];
    if (!profile) return { eligible: false, deltas: {}, reason: 'species_not_found' };

    const check = await checkWeightUpdateEligibility(speciesKey);
    if (!check?.eligible) {
      return { eligible: false, deltas: {}, reason: check?.reason ?? 'ineligible' };
    }

    const aggregatedScores = await getAggregatedScores(speciesKey);
    if (!aggregatedScores) {
      return { eligible: false, deltas: {}, reason: 'no_aggregated_scores' };
    }

    const { deltas, fieldCount } = computeSpeciesUpdate(speciesKey, profile, aggregatedScores);
    return { eligible: true, deltas, fieldCount, reason: null };

  } catch (err) {
    return { eligible: false, deltas: {}, reason: err.message };
  }
}