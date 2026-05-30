/**
 * useSnac.js
 * Shared state singleton + Phase 3 full chain orchestration.
 *
 * ARCHITECTURE NOTE:
 * useSnac() is called in multiple screens (InputsScreen, WorkspaceScreen,
 * ResultsScreen). React hooks create isolated state per component instance,
 * so we lift all shared state into a module-level store and use a single
 * React event emitter pattern to keep all consumers in sync.
 *
 * Phase 3.9: analyzeSession() runs after every addTrack() and inside run().
 * Phase 4.0: weatherResult captured, stored, exposed.
 * Phase 4.1: scent approach re-patched after heading known.
 * Phase 4.2: terrain anchors scored after weather (uses wind cardinal),
 *            stored and exposed as terrainAnchor.
 */
 
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  runSnacFullAnalysis,
  buildSnacFieldSummary,
  buildSnacDecisionOutput,
} from './snac_master_deduped.js';
import { getProfiles, initProfiles } from './snac_profiles.js';
import { applyEnrichedProfiles } from './snac_profile_enricher.js';
import { initDB, logRun, logHarvest, ensureDefaultPrefs } from './snac_db.js';
import { syncPending } from './snac_sync.js';
import { snacInputFromScreenState } from './snac_input_schema.js';
import { resolveInputs } from './snac_inference_engine.js';
import { fuseSignals, flattenForEvaluators } from './snac_sensor_fusion.js';
import { buildConfidenceLayers, buildPrePassFlags } from './snac_confidence_layers.js';
import { applyHuntingPressure } from './Snac_hunting_pressure.js';
import { scoreWeatherPriors, buildScentApproach } from './Snac_weather_priors.js';
import { scoreTerrainAnchors } from './snac_terrain_anchors.js';
import { analyzeSession, getSessionSummaryLine } from './snac_session_memory.js';
import { scoreHabitatPlausibility, getBiome } from './snac_habitat_gps.js';
 
// =============================================================================
// MODULE-LEVEL SINGLETON STORE
// =============================================================================
 
const _store = {
  ready:          false,
  loading:        false,
  error:          null,
  summary:        null,
  decision:       null,
  rawResult:      null,
  confidenceLayers: null,
  probabilityList:  [],
  weatherResult:  null,
  terrainAnchor:  null,
  sessionTracks:  [],
  sessionMemory:  null,
  inputState:     {},
  photoUri:       null,
};
 
const _listeners = new Set();
 
function _notify() {
  _listeners.forEach(fn => fn({ ..._store }));
}
 
function _set(patch) {
  Object.assign(_store, patch);
  _notify();
}
 
// =============================================================================
// INIT
// =============================================================================
 
let _initPromise = null;
 
async function _init() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    await initDB();
    await ensureDefaultPrefs();
    await initProfiles();
    syncPending().catch(() => {});
  })();
  return _initPromise;
}
 
// =============================================================================
// PHASE 3 ENGINE HELPERS
// =============================================================================
 
function buildDetection(fusedContext, screenState, index) {
  const speciesKey = fusedContext.species?.species ?? null;
  const probList   = fusedContext.species?.species_probability_list ?? [];
 
  const classifications = probList.length > 0
    ? probList.map(p => ({ species: p.species_key, confidence: (p.probability ?? 0) / 100 }))
    : speciesKey
      ? [{ species: speciesKey, confidence: screenState.confidence ?? 0.5 }]
      : [];
 
  return {
    id: 'track_' + (index + 1) + '_' + (screenState._timestamp ?? Date.now()),
    classifications,
    geometry: {
      stride_length_m: fusedContext.gait?.stride_m ?? null,
      lat: screenState.harvestGps?.latitude  ?? null,
      lon: screenState.harvestGps?.longitude ?? null,
    },
    vision_metrics: {
      freshness_score: fusedContext.freshness?.freshness_raw ?? screenState.freshness ?? null,
      edge_clarity:    screenState.edgeClarity ?? null,
      moisture_score:  fusedContext.substrate?.is_wet ? 0.75 : 0.25,
    },
    behavior_hints: {
      gait:            fusedContext.gait?.gait           ?? screenState.gait      ?? null,
      behavior:        screenState.behavior              ?? null,
      track_substrate: fusedContext.substrate?.substrate ?? screenState.substrate ?? null,
      freshness_score: fusedContext.freshness?.freshness_raw ?? screenState.freshness ?? null,
    },
    source: 'manual_phase3',
    timestamp: screenState._timestamp ?? Date.now(),
  };
}
 
async function enrichOne(screenState, profiles, gpsCoords, huntingPressure, sharedWeather) {
  const schemaInput = snacInputFromScreenState(screenState);
  const resolved    = resolveInputs(schemaInput, profiles, gpsCoords);
 
  const weatherResult = sharedWeather
    ?? await scoreWeatherPriors(resolved, gpsCoords, null);
 
  const speciesKey = resolved.species?.value ?? null;
  const localHour  = resolved.local_hour?.value ?? new Date().getHours();
  const month      = new Date().getMonth() + 1;
 
  const pressureResult = applyHuntingPressure({
    activityPrior:      resolved.activity_prior ?? null,
    weatherPrior:       weatherResult,
    huntingPressure:    huntingPressure ?? 'none',
    speciesKey,
    correctedFreshness: resolved.decay_correction?.corrected_freshness
      ?? resolved.freshness?.value ?? null,
    localHour,
    month,
  });
 
  // Phase 4.2: terrain anchors - uses wind cardinal from weather when present
  const terrainObs = {
    water_type:      resolved.water_type?.value      ?? null,
    water_condition: resolved.water_condition?.value  ?? null,
    terrain_channel: resolved.terrain_channel?.value  ?? null,
  };
  const terrainAnchor = scoreTerrainAnchors(
    resolved,
    terrainObs,
    weatherResult?.wind_direction_cardinal ?? null
  );
 
  const fusedContext = fuseSignals(resolved, weatherResult, pressureResult);
  const prePassFlags = buildPrePassFlags(fusedContext);
  const flatInputs   = flattenForEvaluators(fusedContext);
 
  return { fusedContext, flatInputs, prePassFlags, weatherResult, pressureResult, terrainAnchor, resolved };
}
 
async function runWithPhase3({ currentScreenState, sessionTracks, huntingPressure, profiles, gpsCoords }) {
  const allStates = [
    ...sessionTracks,
    { ...currentScreenState, _timestamp: Date.now() },
  ];
 
  const first = await enrichOne(allStates[0], profiles, gpsCoords, huntingPressure, null);
 
  const rest = await Promise.all(
    allStates.slice(1).map(ss =>
      enrichOne(ss, profiles, null, huntingPressure, first.weatherResult)
    )
  );
 
  const allEnriched = [first, ...rest];
 
  const sensorDetections = allEnriched.map((e, i) =>
    buildDetection(e.fusedContext, allStates[i], i)
  );
 
  const last      = allEnriched[allEnriched.length - 1];
  const lastState = allStates[allStates.length - 1];
 
  const rawEnvironment = {
    near_water:   last.fusedContext.near_water  ?? lastState.nearWater  ?? false,
    on_ridge:     last.fusedContext.on_ridge    ?? lastState.onRidge    ?? false,
    dense_cover:  last.fusedContext.dense_cover ?? lastState.denseCover ?? false,
    zone_tags:    lastState.zoneTag
      ? [lastState.zoneTag, ...(lastState.signTags ?? [])]
      : [...(lastState.signTags ?? [])],
    light_phase:  last.fusedContext.light_phase ?? lastState.lightPhase  ?? null,
    weather_code: lastState.weatherCode ?? null,
  };
 
  const rawTimeContext = {
    local_hour:  last.fusedContext.local_hour ?? new Date().getHours(),
    light_phase: last.fusedContext.light_phase ?? lastState.lightPhase ?? null,
    timestamp:   lastState._timestamp ?? Date.now(),
  };
 
  const fullResult   = runSnacFullAnalysis({ sensorDetections, rawEnvironment, rawTimeContext, speciesProfiles: profiles });
  const fieldSummary = buildSnacFieldSummary(fullResult);
  const decisionOut  = buildSnacDecisionOutput(fullResult);
 
  const confidenceLayers = buildConfidenceLayers(last.fusedContext, decisionOut, profiles);
 
  // --- Phase 3.9: session memory follow_modifier ---
  const sessionMem = analyzeSession(sessionTracks, currentScreenState);
  const rawConf    = decisionOut?.tracking_confidence ?? 0;
  const modifier   = sessionMem?.follow_modifier ?? 1.0;
  const boostedConf = Math.min(1.0, Math.max(0, rawConf * modifier));
 
  // --- Phase 3.10: habitat GPS plausibility ---
  const speciesKey_    = currentScreenState.speciesOverride ?? null;
  const habitatResult  = scoreHabitatPlausibility(speciesKey_, gpsCoords);
  const biomeInferred  = habitatResult.biome_inferred ?? getBiome(gpsCoords);
  const habitatMod     = (habitatResult.scored && habitatResult.plausibility != null)
    ? (0.4 + habitatResult.plausibility * 0.6)
    : 1.0;
 
  // --- Phase 4.2: terrain anchor follow modifier applied to confidence ---
  // Terrain concentrates where the animal is - open water window and channeling
  // raise follow value, closed water window lowers it. Applied as a bounded
  // multiplier so it nudges rather than dominates.
  const terrainFollowMod = last.terrainAnchor?.follow_modifier ?? 0;
  const terrainMult      = 1 + terrainFollowMod; // follow_modifier is -0.15..+0.20
 
  const finalConf = parseFloat(
    Math.min(1.0, Math.max(0, boostedConf * habitatMod * terrainMult)).toFixed(4)
  );
 
  const patchedDecision = {
    ...decisionOut,
    tracking_confidence:  finalConf,
    session_follow_mod:   modifier,
    session_synthesis:    sessionMem.session_synthesis,
    session_direction:    sessionMem.direction,
    session_pattern:      sessionMem.pattern_confidence,
    migration_flag:       sessionMem.migration_flag,
    inconsistency_flag:   sessionMem.inconsistency_flag,
    false_reset_recommended: sessionMem.false_reset_recommended,
    habitat_plausibility: habitatResult.plausibility,
    habitat_scored:       habitatResult.scored,
    habitat_range_note:   habitatResult.range_note,
    biome_inferred:       biomeInferred,
    terrain_follow_mod:   terrainFollowMod,
    recommendation: finalConf >= 0.75 ? 'high_probability_follow'
                  : finalConf >= 0.50 ? 'moderate_probability_follow'
                  : finalConf >= 0.30 ? 'low_probability_follow'
                  : 'do_not_follow',
  };
 
  // --- Phase 4.1: re-patch scent approach now that heading is known ---
  let weatherOut = last.weatherResult;
  if (weatherOut && weatherOut.wind_direction_deg != null) {
    const headingDeg = patchedDecision.predicted_heading_deg ?? decisionOut.predicted_heading_deg ?? null;
    const freshness  = last.resolved?.decay_correction?.corrected_freshness
      ?? last.resolved?.freshness?.value
      ?? null;
    const refinedApproach = buildScentApproach(weatherOut.wind_direction_deg, headingDeg, freshness);
    if (refinedApproach) {
      const notes = Array.isArray(weatherOut.notes) ? [...weatherOut.notes] : [];
      const oldAdvice = weatherOut.scent_approach?.advice ?? null;
      const idx = oldAdvice ? notes.lastIndexOf(oldAdvice) : -1;
      if (idx !== -1) notes.splice(idx, 1);
      notes.push(refinedApproach.advice);
      weatherOut = { ...weatherOut, scent_approach: refinedApproach, notes };
    }
  }
 
  return {
    valid:             true,
    summary:           fieldSummary,
    decision:          patchedDecision,
    confidenceLayers,
    probabilityList:   confidenceLayers.summary?.species_probability_list ?? [],
    weatherResult:     weatherOut,
    terrainAnchor:     last.terrainAnchor,
    sessionTrackCount: allStates.length,
    sessionMemory:     sessionMem,
    raw:               fullResult,
  };
}
 
// =============================================================================
// PUBLIC ACTIONS
// =============================================================================
 
function _addTrack(screenState) {
  const snapshot = { ...screenState, _timestamp: Date.now() };
  const nextTracks = [..._store.sessionTracks, snapshot];
  const mem = analyzeSession(nextTracks, null);
  _set({ sessionTracks: nextTracks, sessionMemory: mem });
  return { snapshot, sessionMemory: mem };
}
 
function _clearSession() {
  _set({
    sessionTracks:    [],
    sessionMemory:    null,
    summary:          null,
    decision:         null,
    rawResult:        null,
    confidenceLayers: null,
    probabilityList:  [],
    weatherResult:    null,
    terrainAnchor:    null,
    error:            null,
  });
}
 
async function _run({ currentScreenState = {}, huntingPressure = 'none', gpsCoords = null } = {}) {
  _set({ loading: true, error: null });
  try {
    const profiles = applyEnrichedProfiles(getProfiles());
    const result   = await runWithPhase3({
      currentScreenState,
      sessionTracks: _store.sessionTracks,
      huntingPressure,
      profiles,
      gpsCoords,
    });
 
    _set({
      rawResult:        result.raw,
      summary:          result.summary,
      decision:         result.decision,
      confidenceLayers: result.confidenceLayers,
      probabilityList:  result.probabilityList ?? [],
      weatherResult:    result.weatherResult ?? null,
      terrainAnchor:    result.terrainAnchor ?? null,
      sessionMemory:    result.sessionMemory,
      loading:          false,
    });
 
    logRun({
      species_detected:    result.summary?.species_detected  || [],
      primary_behavior:    result.summary?.primary_behavior  || null,
      confidence:          result.decision?.tracking_confidence || null,
      recommendation:      result.decision?.recommendation   || null,
      viability_status:    result.summary?.viability_status  || null,
      decay_status:        result.summary?.decay_status      || null,
      environment_tags:    currentScreenState.zoneTag
        ? [currentScreenState.zoneTag, ...(currentScreenState.signTags ?? [])]
        : [...(currentScreenState.signTags ?? [])],
      local_hour:          new Date().getHours(),
      session_track_count: result.sessionTrackCount ?? 1,
      hunting_pressure:    huntingPressure,
      raw_result:          JSON.stringify(result.raw),
    }).catch(() => {});
 
    return result;
  } catch (err) {
    _set({ loading: false, error: err?.message ?? 'Unknown engine error' });
    return null;
  }
}
 
// =============================================================================
// HOOK
// =============================================================================
 
export function useSnac() {
  const [state, setState] = useState({ ..._store });
  const mountedRef = useRef(true);
 
  useEffect(() => {
    mountedRef.current = true;
    const listener = (snapshot) => {
      if (mountedRef.current) setState(snapshot);
    };
    _listeners.add(listener);
    setState({ ..._store });
 
    return () => {
      mountedRef.current = false;
      _listeners.delete(listener);
    };
  }, []);
 
  useEffect(() => {
    _init()
      .then(() => {
        if (!_store.ready) _set({ ready: true });
      })
      .catch(err => {
        _set({ error: 'Init failed: ' + (err?.message ?? 'unknown') });
      });
  }, []);
 
  const run = useCallback(async (opts) => {
    return _run(opts);
  }, []);
 
  const addTrack = useCallback((screenState) => {
    return _addTrack(screenState);
  }, []);
 
  const clearSession = useCallback(() => {
    _clearSession();
  }, []);
 
  const setInputState = useCallback((s) => {
    _set({ inputState: s });
  }, []);
 
  const setPhotoUri = useCallback((uri) => {
    _set({ photoUri: uri });
  }, []);
 
  const reset = useCallback(() => {
    _set({
      summary:          null,
      decision:         null,
      rawResult:        null,
      confidenceLayers: null,
      probabilityList:  [],
      weatherResult:    null,
      terrainAnchor:    null,
      error:            null,
    });
  }, []);
 
  const sessionSummaryLine = getSessionSummaryLine(state.sessionMemory);
 
  return {
    run,
    loading:          state.loading,
    ready:            state.ready,
    error:            state.error,
    reset,
    summary:          state.summary,
    decision:         state.decision,
    rawResult:        state.rawResult,
    confidenceLayers: state.confidenceLayers,
    probabilityList:  state.probabilityList,
    weatherResult:    state.weatherResult,
    terrainAnchor:    state.terrainAnchor,
    sessionTracks:    state.sessionTracks,
    sessionTrackCount: state.sessionTracks.length,
    sessionMemory:    state.sessionMemory,
    sessionSummaryLine,
    addTrack,
    clearSession,
    inputState:       state.inputState,
    setInputState,
    photoUri:         state.photoUri,
    setPhotoUri,
  };
}
 
// =============================================================================
// HARVEST HOOK
// =============================================================================
 
export function useSnacHarvest() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState(null);
 
  const submit = useCallback(async function({
    species         = null,
    shotDistanceYds = null,
    notes           = '',
    contribute      = true,
    location        = null,
    timestamp       = Date.now()
  }) {
    setSubmitting(true);
    setError(null);
    try {
      await logHarvest({
        species,
        shot_distance_yds:   shotDistanceYds,
        notes,
        contribute_to_model: contribute,
        gps_lat:             location?.latitude  ?? null,
        gps_lon:             location?.longitude ?? null,
        timestamp,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message ?? 'Harvest log failed');
    } finally {
      setSubmitting(false);
    }
  }, []);
 
  const resetHarvest = useCallback(() => {
    setSubmitted(false);
    setError(null);
  }, []);
 
  return { submit, submitting, submitted, error, resetHarvest };
}