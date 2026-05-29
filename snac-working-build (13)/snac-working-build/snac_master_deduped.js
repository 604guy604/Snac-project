import { getClusterConfig, classifyCluster, clusterEvidenceLabel } from './snac_clustering_config.js';

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function lower(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()))];
}

function mean(values) {
  const valid = values.filter((v) => Number.isFinite(v));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function variance(values) {
  const avg = mean(values);
  if (!Number.isFinite(avg) || values.length < 2) return null;
  const sq = values.reduce((acc, v) => acc + (v - avg) ** 2, 0);
  return sq / values.length;
}

function clamp01(value) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

function strengthLabel(score) {
  if (!Number.isFinite(score)) return "insufficient_data";
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "moderate";
  if (score > 0) return "low";
  return "none";
}

function computeDistanceM(a, b) {
  if (Number.isFinite(a?.x) && Number.isFinite(a?.y) &&
    Number.isFinite(b?.x) && Number.isFinite(b?.y)
  ) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  if (Number.isFinite(a?.lat) && Number.isFinite(a?.lon) &&
    Number.isFinite(b?.lat) && Number.isFinite(b?.lon)
  ) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  return null;
}

function angleDifferenceDeg(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function getSpeciesEntry(speciesProfiles, speciesKey) {
  if (!speciesProfiles || !speciesKey) return null;
  return speciesProfiles[speciesKey] || null;
}

function assertNoTestOnlyDataInProduction(speciesProfiles) {
  if (!speciesProfiles || typeof speciesProfiles !== "object") return;
  if (speciesProfiles.__test_only === true) {
    throw new Error("Test-only speciesProfiles passed to production engine.");
  }
}

function getNormalizedNameList(entry, keys) {
  const collected = [];
  for (const key of keys) {
    const value = entry?.[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim()) collected.push(item.trim().toLowerCase());
      }
    } else if (typeof value === "string" && value.trim()) {
      collected.push(value.trim().toLowerCase());
    }
  }
  return [...new Set(collected)];
}

function getBehaviorTags(entry) {
  const tags = [];
  for (const bucket of [
    toArray(entry?.behavior_tags),
    toArray(entry?.behavior_classification),
    toArray(entry?.movement_tags),
    toArray(entry?.alert_behavior)
  ]) {
    for (const item of bucket) {
      if (typeof item === "string" && item.trim()) tags.push(item.trim().toLowerCase());
    }
  }
  return [...new Set(tags)];
}

function getDietTags(entry) {
  const tags = [];
  for (const bucket of [
    toArray(entry?.diet),
    toArray(entry?.diet_type),
    toArray(entry?.feeding_behavior)
  ]) {
    for (const item of bucket) {
      if (typeof item === "string" && item.trim()) tags.push(item.trim().toLowerCase());
    }
  }
  return [...new Set(tags)];
}

function getPredatorPreyProfile(entry) {
  return {
    predatorOf: getNormalizedNameList(entry, ["predator_of","prey_species","predator_targets","preferred_prey"]),
    preyOf: getNormalizedNameList(entry, ["prey_of","predators","known_predators","predator_species"]),
    riskRadiusM: toNumber(entry?.predator_prey?.risk_radius_m ?? entry?.predator_alert?.risk_radius_m ?? entry?.risk_radius_m),
    trailAvoidanceRadiusM: toNumber(entry?.predator_prey?.trail_avoidance_radius_m ?? entry?.trail_avoidance_radius_m),
    pressureWeight: toNumber(entry?.predator_prey?.pressure_weight ?? entry?.predator_alert?.pressure_weight),
    movementTags: getBehaviorTags(entry),
    dietTags: getDietTags(entry),
    groupBehavior: toArray(entry?.group_behavior).filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().toLowerCase()),
    migratory: Boolean(entry?.migratory === true || entry?.migration === true || entry?.seasonal_movement === true)
  };
}

function buildNoTracksResult(context = "unknown") {
  return {
    module: context,
    valid: false,
    reason: "No tracks provided",
    evaluations: [],
    summary: { evaluationCount: 0 }
  };
}

function pickBestSpeciesCandidate(classifications = []) {
  const normalized = toArray(classifications).map((item) => ({
      species: item?.species ?? item?.label ?? null,
      confidence: clamp01(item?.confidence ?? item?.score ?? item?.probability)
    })).filter((item) => item.species);
  if (!normalized.length) return { species: null, confidence: null, alternatives: [] };
  normalized.sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1));
  return {
    species: normalized[0].species,
    confidence: normalized[0].confidence,
    alternatives: normalized.slice(1, 4)
  };
}

function normalizeTrackGeometry(geometry = {}) {
  return {
    x: toNumber(geometry?.x),
    y: toNumber(geometry?.y),
    lat: toNumber(geometry?.lat),
    lon: toNumber(geometry?.lon),
    heading_deg: toNumber(geometry?.heading_deg ?? geometry?.direction_deg),
    stride_length_m: toNumber(geometry?.stride_length_m),
    pace_length_m: toNumber(geometry?.pace_length_m),
    step_length_m: toNumber(geometry?.step_length_m),
    track_count: toNumber(geometry?.track_count)
  };
}

function normalizeVisionMetrics(vision = {}) {
  return {
    edge_clarity: clamp01(vision?.edge_clarity),
    debris_level: clamp01(vision?.debris_level),
    shadow_score: clamp01(vision?.shadow_score),
    softness_score: clamp01(vision?.softness_score),
    compression_score: clamp01(vision?.compression_score),
    moisture_score: clamp01(vision?.moisture_score),
    distortion_score: clamp01(vision?.distortion_score),
    depth_score: clamp01(vision?.depth_score),
    weather_exposure_score: clamp01(vision?.weather_exposure_score),
    sun_exposure_score: clamp01(vision?.sun_exposure_score)
  };
}

function normalizeBehaviorHints(hints = {}) {
  return {
    gait: lower(hints?.gait),
    behavior: lower(hints?.behavior),
    zone_id: hints?.zone_id ?? null,
    track_substrate: lower(hints?.track_substrate ?? hints?.substrate),
    freshness_score: clamp01(hints?.freshness_score)
  };
}

function normalizeTrackDetection(detection = {}, index = 0) {
  const speciesPick = pickBestSpeciesCandidate(detection?.classifications);
  return {
    id: detection?.id ?? `sensor_track_${index + 1}`,
    species: speciesPick.species,
    confidence_score: speciesPick.confidence,
    ...normalizeTrackGeometry(detection?.geometry),
    ...normalizeVisionMetrics(detection?.vision_metrics),
    ...normalizeBehaviorHints(detection?.behavior_hints),
    sensor_meta: {
      source: detection?.source ?? "unknown_sensor",
      model: detection?.model ?? null,
      timestamp: toNumber(detection?.timestamp) ?? null,
      species_alternatives: speciesPick.alternatives,
      raw_detection_id: detection?.raw_detection_id ?? null
    }
  };
}

function substrateFromEnvironment(rawEnvironment = {}) {
  const direct = lower(rawEnvironment?.track_substrate ?? rawEnvironment?.substrate);
  if (direct) return direct;
  const tags = toArray(rawEnvironment?.zone_tags).map(lower);
  if (tags.includes("creek_edge")) return "creek_edge";
  if (tags.includes("wetland") || tags.includes("marsh")) return "wet_grass";
  if (tags.includes("rocky") || tags.includes("ridge")) return "rocky";
  if (tags.includes("forest_floor")) return "leaf_litter";
  if (tags.includes("pine_forest")) return "pine_needles";
  if (tags.includes("open_field")) return "grass_short";
  return "";
}

function normalizeEnvironment(rawEnvironment = {}) {
  const zoneTags = uniqueStrings(toArray(rawEnvironment?.zone_tags).map(lower));
  const inferredSubstrate = substrateFromEnvironment(rawEnvironment);
  if (inferredSubstrate && !zoneTags.includes(inferredSubstrate)) zoneTags.push(inferredSubstrate);
  return {
    near_water: Boolean(rawEnvironment?.near_water === true),
    on_ridge: Boolean(rawEnvironment?.on_ridge === true),
    dense_cover: Boolean(rawEnvironment?.dense_cover === true),
    zone_tags: zoneTags,
    light_phase: lower(rawEnvironment?.light_phase),
    weather_code: rawEnvironment?.weather_code ?? null,
    air_temperature_c: toNumber(rawEnvironment?.air_temperature_c),
    substrate_hint: inferredSubstrate || null
  };
}

function normalizeTimeContext(rawTimeContext = {}) {
  return {
    local_hour: toNumber(rawTimeContext?.local_hour),
    light_phase: lower(rawTimeContext?.light_phase),
    timestamp: rawTimeContext?.timestamp ?? null
  };
}

function deriveTrackDefaults(track, environment) {
  const derived = { ...track };
  if (!derived.track_substrate && environment?.substrate_hint) derived.track_substrate = environment.substrate_hint;
  if (!derived.zone_id && Array.isArray(environment?.zone_tags) && environment.zone_tags.length) derived.zone_id = environment.zone_tags[0];
  return derived;
}

function normalizeTrackMeasurements(geometry = {}, measurementContext = {}) {
  const ppm = toNumber(measurementContext?.pixels_per_meter);
  const result = { ...geometry };
  if (Number.isFinite(ppm) && ppm > 0) {
    if (Number.isFinite(geometry?.width_px)) result.width_m = geometry.width_px / ppm;
    if (Number.isFinite(geometry?.height_px)) result.height_m = geometry.height_px / ppm;
    if (Number.isFinite(geometry?.stride_px)) result.stride_length_m = geometry.stride_px / ppm;
    if (Number.isFinite(geometry?.pace_px)) result.pace_length_m = geometry.pace_px / ppm;
  }
  return result;
}

export function sensorIntegrationLayer({
  sensorDetections = [],
  rawEnvironment = {},
  rawTimeContext = {}
}) {
  if (!Array.isArray(sensorDetections)) {
    return {
      module: "phase2_sensor_integration",
      function: "sensorIntegrationLayer",
      valid: false,
      reason: "sensorDetections must be an array",
      tracks: [],
      environment: {},
      timeContext: {}
    };
  }
  const environment = normalizeEnvironment(rawEnvironment);
  const timeContext = normalizeTimeContext(rawTimeContext);
  const normalizedTracks = sensorDetections
    .map((detection, index) => normalizeTrackDetection(detection, index)).map((track) => deriveTrackDefaults(track, environment)).filter((track) => track.species);
  return {
    module: "phase2_sensor_integration",
    function: "sensorIntegrationLayer",
    valid: true,
    tracks: normalizedTracks,
    environment,
    timeContext,
    summary: {
      detectionCount: sensorDetections.length,
      normalizedTrackCount: normalizedTracks.length,
      speciesDetected: uniqueStrings(normalizedTracks.map((t) => t.species))
    }
  };
}

function getTrackInputProfile(track, speciesProfiles) {
  const species = track?.species;
  const entry = getSpeciesEntry(speciesProfiles, species);
  return {
    species,
    entry,
    id: track?.id ?? null,
    x: toNumber(track?.x),
    y: toNumber(track?.y),
    lat: toNumber(track?.lat),
    lon: toNumber(track?.lon),
    headingDeg: toNumber(track?.heading_deg ?? track?.direction_deg),
    freshnessScore: toNumber(track?.freshness_score),
    profile: entry ? getPredatorPreyProfile(entry) : null
  };
}

function freshnessGap(a, b) {
  const aF = toNumber(a?.freshnessScore ?? a?.freshness_score);
  const bF = toNumber(b?.freshnessScore ?? b?.freshness_score);
  if (!Number.isFinite(aF) || !Number.isFinite(bF)) return null;
  return Math.abs(aF - bF);
}

function isPredatorPreyMatch(a, b) {
  if (!a?.profile || !b?.profile) return { match: false };
  const aSpecies = lower(a.species);
  const bSpecies = lower(b.species);
  if (a.profile.predatorOf.includes(bSpecies) || b.profile.preyOf.includes(aSpecies))
    return { match: true, predator: a, prey: b };
  if (b.profile.predatorOf.includes(aSpecies) || a.profile.preyOf.includes(bSpecies))
    return { match: true, predator: b, prey: a };
  return { match: false };
}

function computePressureLevel(score) {
  if (!Number.isFinite(score)) return "none";
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "moderate";
  if (score > 0) return "low";
  return "none";
}

export function evaluatePredatorPreyInteraction({
  tracks = [],
  speciesProfiles = {}
}) {
  if (!Array.isArray(tracks) || !speciesProfiles || typeof speciesProfiles !== "object") {
    return { module:"phase2version2", function:"evaluatePredatorPreyInteraction", valid:false, reason:"Invalid input shape", interactions:[], summary:{evaluationCount:0,interactionCount:0} };
  }
  const normalizedTracks = tracks
    .map((track) => getTrackInputProfile(track, speciesProfiles)).filter((t) => t?.species && t?.entry && t?.profile);
  const interactions = [];
  for (let i = 0; i < normalizedTracks.length; i++) {
    for (let j = i + 1; j < normalizedTracks.length; j++) {
      const a = normalizedTracks[i];
      const b = normalizedTracks[j];
      const pair = isPredatorPreyMatch(a, b);
      if (!pair.match) continue;
      const { predator, prey } = pair;
      const distanceM = computeDistanceM(predator, prey);
      const headingDiff = angleDifferenceDeg(toNumber(predator.headingDeg), toNumber(prey.headingDeg));
      const freshnessDelta = freshnessGap(predator, prey);
      const riskRadiusM = predator.profile.riskRadiusM ?? 200;
      const pressureWeight = predator.profile.pressureWeight ?? 1.0;
      let score = 0;
      const evidence = [];
      const distanceFactor = Number.isFinite(distanceM) && distanceM <= riskRadiusM ? 1 - distanceM / riskRadiusM : 0;
      if (distanceFactor > 0) { score += distanceFactor * 0.4 * pressureWeight; evidence.push(`predator-prey distance ${distanceM?.toFixed(2)}m within risk radius ${riskRadiusM}m`); }
      const freshnessFactor = Number.isFinite(freshnessDelta) ? Math.max(0, 1 - freshnessDelta) : 0;
      if (freshnessFactor > 0) { score += freshnessFactor * 0.3; evidence.push(`freshness delta ${freshnessDelta?.toFixed(4)} - temporal overlap likely`); }
      const directionalCoupling = Number.isFinite(headingDiff) ? Math.max(0, 1 - headingDiff / 180) : 0;
      if (directionalCoupling > 0) { score += directionalCoupling * 0.3; evidence.push(`heading alignment ${headingDiff?.toFixed(2)} supports pursuit vector`); }
      const interactionScore = Number(Math.min(1, score).toFixed(4));
      interactions.push({
        predator_species: predator.species,
        prey_species: prey.species,
        interaction_score: interactionScore,
        pressure_level: computePressureLevel(interactionScore),
        prey_likely_avoidance: interactionScore >= 0.45,
        predator_hunt_pattern_tags_present: interactionScore >= 0.6,
        distance_m: Number.isFinite(distanceM) ? Number(distanceM.toFixed(2)) : null,
        heading_diff_deg: Number.isFinite(headingDiff) ? Number(headingDiff.toFixed(2)) : null,
        freshness_delta: Number.isFinite(freshnessDelta) ? Number(freshnessDelta.toFixed(4)) : null,
        evidence: uniqueStrings(evidence)
      });
    }
  }
  return { module:"phase2version2", function:"evaluatePredatorPreyInteraction", valid:true, interactions, summary:{ evaluationCount:normalizedTracks.length, interactionCount:interactions.length } };
}

function getDecaySettings(entry) {
  return {
    decayWeight: toNumber(entry?.track_age_decay?.weight ?? entry?.track_decay?.weight ?? entry?.decay_curve?.weight),
    sameBandThreshold: toNumber(entry?.track_age_decay?.same_band_threshold ?? entry?.track_decay?.same_band_threshold ?? entry?.decay_curve?.same_band_threshold),
    separateBandThreshold: toNumber(entry?.track_age_decay?.separate_band_threshold ?? entry?.track_decay?.separate_band_threshold ?? entry?.decay_curve?.separate_band_threshold),
    environmentalSensitivity: toNumber(entry?.track_age_decay?.environmental_sensitivity ?? entry?.track_decay?.environmental_sensitivity ?? entry?.decay_curve?.environmental_sensitivity),
    speciesDecayTags: toArray(entry?.track_age_decay?.tags ?? entry?.track_decay?.tags ?? entry?.decay_curve?.tags).filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().toLowerCase())
  };
}

function getTrackProfile(track, speciesProfiles) {
  const species = track?.species;
  const entry = getSpeciesEntry(speciesProfiles, species);
  return {
    id: track?.id ?? null, species, entry,
    x: toNumber(track?.x), y: toNumber(track?.y),
    lat: toNumber(track?.lat), lon: toNumber(track?.lon),
    zoneId: track?.zone_id ?? null,
    substrate: lower(track?.track_substrate ?? track?.substrate),
    gait: lower(track?.gait), behavior: lower(track?.behavior),
    headingDeg: toNumber(track?.heading_deg ?? track?.direction_deg),
    shadowScore: toNumber(track?.shadow_score),
    edgeClarity: toNumber(track?.edge_clarity),
    debrisLevel: toNumber(track?.debris_level),
    softnessScore: toNumber(track?.softness_score),
    compressionScore: toNumber(track?.compression_score),
    moistureScore: toNumber(track?.moisture_score),
    distortionScore: toNumber(track?.distortion_score),
    depthScore: toNumber(track?.depth_score),
    weatherExposureScore: toNumber(track?.weather_exposure_score),
    sunExposureScore: toNumber(track?.sun_exposure_score),
    freshnessScore: toNumber(track?.freshness_score),
    strideM: toNumber(track?.stride_length_m),
    strideLengthM: toNumber(track?.stride_length_m),
    paceLengthM: toNumber(track?.pace_length_m),
    stepLengthM: toNumber(track?.step_length_m),
    confidenceScore: toNumber(track?.confidence_score),
    profile: entry ? getPredatorPreyProfile(entry) : null,
    decaySettings: entry ? getDecaySettings(entry) : null
  };
}

function collectDecaySignals(track) {
  const signals = { shadowScore:track.shadowScore, edgeClarity:track.edgeClarity, debrisLevel:track.debrisLevel, softnessScore:track.softnessScore, compressionScore:track.compressionScore, moistureScore:track.moistureScore, distortionScore:track.distortionScore, depthScore:track.depthScore, weatherExposureScore:track.weatherExposureScore, sunExposureScore:track.sunExposureScore, freshnessScore:track.freshnessScore };
  return Object.fromEntries(Object.entries(signals).filter(([, v]) => Number.isFinite(v)));
}

function buildSignalComparisons(aSignals, bSignals) {
  const names = ["shadowScore","edgeClarity","debrisLevel","softnessScore","compressionScore","moistureScore","distortionScore","depthScore","weatherExposureScore","sunExposureScore","freshnessScore"];
  return names.map((n) => {
    const aV = aSignals[n]; const bV = bSignals[n];
    if (!Number.isFinite(aV) || !Number.isFinite(bV)) return null;
    return { signal:n, a:Number(aV.toFixed(4)), b:Number(bV.toFixed(4)), absolute_difference:Number(Math.abs(aV-bV).toFixed(4)) };
  }).filter(Boolean);
}

function averageDifference(comparisons) {
  if (!comparisons.length) return null;
  return comparisons.reduce((acc, item) => acc + item.absolute_difference, 0) / comparisons.length;
}

function computeEnvironmentalAdjustment(a, b) {
  const sharedZone = Boolean(a.zoneId) && Boolean(b.zoneId) && a.zoneId === b.zoneId;
  const sharedSubstrate = Boolean(a.substrate) && Boolean(b.substrate) && a.substrate === b.substrate;
  let modifier = 1;
  const evidence = [];
  if (sharedZone) { modifier -= 0.08; evidence.push(`shared zone_id ${a.zoneId}`); }
  if (sharedSubstrate) { modifier -= 0.08; evidence.push(`shared substrate ${a.substrate}`); }
  const aSens = a.decaySettings?.environmentalSensitivity;
  const bSens = b.decaySettings?.environmentalSensitivity;
  if (Number.isFinite(aSens) && Number.isFinite(bSens)) { const ms=(aSens+bSens)/2; modifier*=ms; evidence.push(`env sensitivity ${ms.toFixed(4)}`); }
  else if (Number.isFinite(aSens)) { modifier*=aSens; evidence.push(`env sensitivity ${aSens.toFixed(4)}`); }
  else if (Number.isFinite(bSens)) { modifier*=bSens; evidence.push(`env sensitivity ${bSens.toFixed(4)}`); }
  if (modifier < 0.2) modifier = 0.2;
  return { modifier:Number(modifier.toFixed(4)), evidence, shared:{ sharedZone, sharedSubstrate } };
}

function determineLayerClassification({ normalizedDifference, sameBandThreshold, separateBandThreshold }) {
  if (!Number.isFinite(normalizedDifference)) return "insufficient_data";
  if (Number.isFinite(sameBandThreshold) && normalizedDifference <= sameBandThreshold) return "same_freshness_band";
  if (Number.isFinite(separateBandThreshold) && normalizedDifference >= separateBandThreshold) return "separate_time_layer";
  return "transitional_or_uncertain";
}

function computeRelativeAgeDirection(a, b) {
  if (!Number.isFinite(a.freshnessScore) || !Number.isFinite(b.freshnessScore)) return { olderTrackId:null, fresherTrackId:null, basis:"insufficient_freshness_score" };
  if (a.freshnessScore === b.freshnessScore) return { olderTrackId:null, fresherTrackId:null, basis:"equal_freshness_score" };
  return a.freshnessScore > b.freshnessScore
    ? { olderTrackId:b.id??null, fresherTrackId:a.id??null, basis:"freshness_score" }
    : { olderTrackId:a.id??null, fresherTrackId:b.id??null, basis:"freshness_score" };
}

export function evaluateTrackDegradationCurve({
  tracks = [],
  speciesProfiles = {}
}) {
  if (!Array.isArray(tracks) || !speciesProfiles || typeof speciesProfiles !== "object") {
    return { module:"phase2version3", function:"evaluateTrackDegradationCurve", valid:false, reason:"Invalid input shape", comparisons:[], summary:{comparisonCount:0,sameBandCount:0,separateLayerCount:0,uncertainCount:0} };
  }
  const normalizedTracks = tracks.map((t) => getTrackProfile(t, speciesProfiles)).filter((t) => t?.species && t?.entry);
  const comparisons = [];
  for (let i = 0; i < normalizedTracks.length; i++) {
    for (let j = i + 1; j < normalizedTracks.length; j++) {
      const a = normalizedTracks[i]; const b = normalizedTracks[j];
      if (a.species !== b.species) continue;
      const aS = collectDecaySignals(a); const bS = collectDecaySignals(b);
      const sigComps = buildSignalComparisons(aS, bS);
      if (!sigComps.length) { comparisons.push({ species:a.species, track_a_id:a.id, track_b_id:b.id, valid_comparison:false, reason:"No shared measurable decay signals", layer_classification:"insufficient_data", comparison_strength:"insufficient_data", distance_m:null, normalized_decay_difference:null, raw_average_difference:null, evidence:[], signal_comparisons:[] }); continue; }
      const rawAvg = averageDifference(sigComps);
      const envAdj = computeEnvironmentalAdjustment(a, b);
      let wDiff = rawAvg;
      const evidence = [...envAdj.evidence];
      const aW = a.decaySettings?.decayWeight; const bW = b.decaySettings?.decayWeight;
      if (Number.isFinite(aW) && Number.isFinite(bW)) { const mw=(aW+bW)/2; wDiff*=mw; evidence.push(`decay weight ${mw.toFixed(4)}`); }
      else if (Number.isFinite(aW)) { wDiff*=aW; evidence.push(`decay weight ${aW.toFixed(4)}`); }
      else if (Number.isFinite(bW)) { wDiff*=bW; evidence.push(`decay weight ${bW.toFixed(4)}`); }
      wDiff *= envAdj.modifier;
      const aSBT = a.decaySettings?.sameBandThreshold; const bSBT = b.decaySettings?.sameBandThreshold;
      const aSepBT = a.decaySettings?.separateBandThreshold; const bSepBT = b.decaySettings?.separateBandThreshold;
      const sameBandThreshold = Number.isFinite(aSBT) && Number.isFinite(bSBT) ? (aSBT+bSBT)/2 : Number.isFinite(aSBT) ? aSBT : Number.isFinite(bSBT) ? bSBT : null;
      const separateBandThreshold = Number.isFinite(aSepBT) && Number.isFinite(bSepBT) ? (aSepBT+bSepBT)/2 : Number.isFinite(aSepBT) ? aSepBT : Number.isFinite(bSepBT) ? bSepBT : null;
      const layerClass = determineLayerClassification({ normalizedDifference:wDiff, sameBandThreshold, separateBandThreshold });
      if (Number.isFinite(sameBandThreshold)) evidence.push(`same band threshold ${sameBandThreshold.toFixed(4)}`);
      if (Number.isFinite(separateBandThreshold)) evidence.push(`separate layer threshold ${separateBandThreshold.toFixed(4)}`);
      const ageDir = computeRelativeAgeDirection(a, b);
      if (ageDir.basis === "freshness_score") evidence.push(`relative age: fresher=${ageDir.fresherTrackId??"unknown"}, older=${ageDir.olderTrackId??"unknown"}`);
      const distM = computeDistanceM(a, b);
      if (Number.isFinite(distM)) evidence.push(`distance ${distM.toFixed(2)}m`);
      const strengthScore = Number.isFinite(wDiff) && sigComps.length > 0 ? Math.min(1, (sigComps.length/11)*(1-Math.min(wDiff,1))) : null;
      comparisons.push({ species:a.species, track_a_id:a.id, track_b_id:b.id, valid_comparison:true, layer_classification:layerClass, comparison_strength:strengthLabel(strengthScore), comparison_strength_score:Number.isFinite(strengthScore)?Number(strengthScore.toFixed(4)):null, distance_m:Number.isFinite(distM)?Number(distM.toFixed(2)):null, raw_average_difference:Number.isFinite(rawAvg)?Number(rawAvg.toFixed(4)):null, normalized_decay_difference:Number.isFinite(wDiff)?Number(wDiff.toFixed(4)):null, same_band_threshold:Number.isFinite(sameBandThreshold)?Number(sameBandThreshold.toFixed(4)):null, separate_layer_threshold:Number.isFinite(separateBandThreshold)?Number(separateBandThreshold.toFixed(4)):null, shared_zone:envAdj.shared.sharedZone, shared_substrate:envAdj.shared.sharedSubstrate, inferred_fresher_track_id:ageDir.fresherTrackId, inferred_older_track_id:ageDir.olderTrackId, relative_age_basis:ageDir.basis, evidence:uniqueStrings(evidence), signal_comparisons:sigComps });
    }
  }
  return { module:"phase2version3", function:"evaluateTrackDegradationCurve", valid:true, comparisons, summary:{ comparisonCount:comparisons.length, sameBandCount:comparisons.filter((x)=>x.layer_classification==="same_freshness_band").length, separateLayerCount:comparisons.filter((x)=>x.layer_classification==="separate_time_layer").length, uncertainCount:comparisons.filter((x)=>x.layer_classification==="transitional_or_uncertain").length } };
}

function getBehaviorProfile(entry) {
  const directTags = [
    ...toArray(entry?.behavior_tags), ...toArray(entry?.behavior_classification),
    ...toArray(entry?.movement_tags), ...toArray(entry?.feeding_behavior), ...toArray(entry?.alert_behavior)
  ].filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().toLowerCase());
  const flightTags = [...toArray(entry?.flight_behavior_tags), ...toArray(entry?.escape_behavior_tags), ...directTags.filter((t) => ["flight","flee","escape","evasive","spooked","burst","alert"].includes(t))];
  const forageTags = [...toArray(entry?.forage_behavior_tags), ...toArray(entry?.browse_behavior_tags), ...directTags.filter((t) => ["forage","feeding","browse","grazing","slow_feed","meander"].includes(t))];
  return {
    weightFlight: toNumber(entry?.flight_or_forage?.flight_weight ?? entry?.behavior_logic?.flight_weight),
    weightForage: toNumber(entry?.flight_or_forage?.forage_weight ?? entry?.behavior_logic?.forage_weight),
    directionChangeThresholdDeg: toNumber(entry?.flight_or_forage?.direction_change_threshold_deg ?? entry?.behavior_logic?.direction_change_threshold_deg),
    spreadTightnessThresholdM: toNumber(entry?.flight_or_forage?.spread_tightness_threshold_m ?? entry?.behavior_logic?.spread_tightness_threshold_m),
    strideVarianceThreshold: toNumber(entry?.flight_or_forage?.stride_variance_threshold ?? entry?.behavior_logic?.stride_variance_threshold),
    freshnessClusterThreshold: toNumber(entry?.flight_or_forage?.freshness_cluster_threshold ?? entry?.behavior_logic?.freshness_cluster_threshold),
    flightTags: uniqueStrings(flightTags),
    forageTags: uniqueStrings(forageTags)
  };
}

function buildOrderedPathMetrics(tracks) {
  const ordered = tracks.filter(Boolean);
  if (ordered.length < 2) return { segmentDistances:[], headingDiffs:[], strideValues:[], freshnessValues:ordered.map((t)=>t.freshnessScore).filter((v)=>Number.isFinite(v)) };
  const segmentDistances = [], headingDiffs = [], strideValues = [], freshnessValues = [];
  for (let i = 0; i < ordered.length; i++) {
    const cur = ordered[i];
    if (Number.isFinite(cur.freshnessScore)) freshnessValues.push(cur.freshnessScore);
    const stride = [cur.strideLengthM, cur.paceLengthM, cur.stepLengthM].find((v) => Number.isFinite(v));
    if (Number.isFinite(stride)) strideValues.push(stride);
    if (i === 0) continue;
    const prev = ordered[i - 1];
    const dist = computeDistanceM(prev, cur);
    if (Number.isFinite(dist)) segmentDistances.push(dist);
    const hDiff = angleDifferenceDeg(prev.headingDeg, cur.headingDeg);
    if (Number.isFinite(hDiff)) headingDiffs.push(hDiff);
  }
  return { segmentDistances, headingDiffs, strideValues, freshnessValues };
}

function getTrackSpreadM(tracks) {
  const points = tracks.filter((t) => (Number.isFinite(t.x) && Number.isFinite(t.y)) || (Number.isFinite(t.lat) && Number.isFinite(t.lon)));
  if (points.length < 2) return null;
  let maxDist = 0;
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) { const d = computeDistanceM(points[i], points[j]); if (Number.isFinite(d) && d > maxDist) maxDist = d; }
  return Number.isFinite(maxDist) ? maxDist : null;
}

function normalizeAgainstThreshold(value, threshold, invert = false) {
  if (!Number.isFinite(value) || !Number.isFinite(threshold) || threshold <= 0) return null;
  const ratio = value / threshold;
  return Number((invert ? Math.max(0, 1 - ratio) : Math.min(1, ratio)).toFixed(4));
}

function determineIntentLabel(flightScore, forageScore) {
  if (!Number.isFinite(flightScore) && !Number.isFinite(forageScore)) return "insufficient_data";
  if (Number.isFinite(flightScore) && !Number.isFinite(forageScore)) return flightScore > 0 ? "flight_leaning" : "insufficient_data";
  if (!Number.isFinite(flightScore) && Number.isFinite(forageScore)) return forageScore > 0 ? "forage_leaning" : "insufficient_data";
  if (Math.abs(flightScore - forageScore) < 0.12) return "mixed_or_uncertain";
  return flightScore > forageScore ? "flight_leaning" : "forage_leaning";
}

function getSpeciesGroupTracks(normalizedTracks) {
  const groups = new Map();
  for (const track of normalizedTracks) {
    if (!track?.species) continue;
    if (!groups.has(track.species)) groups.set(track.species, []);
    groups.get(track.species).push(track);
  }
  return groups;
}

export function evaluateFlightOrForage({
  tracks = [],
  speciesProfiles = {}
}) {
  if (!Array.isArray(tracks) || !speciesProfiles || typeof speciesProfiles !== "object") {
    return { module:"phase2version4", function:"evaluateFlightOrForage", valid:false, reason:"Invalid input shape", evaluations:[], summary:{evaluationCount:0,flightLeaningCount:0,forageLeaningCount:0,mixedCount:0,insufficientCount:0} };
  }
  const normalizedTracks = tracks
    .map((t) => ({ ...getTrackProfile(t, speciesProfiles), profile: (() => { const e = getSpeciesEntry(speciesProfiles, t?.species); return e ? getBehaviorProfile(e) : null; })() })).filter((t) => t?.species && t?.entry && t?.profile);
  const speciesGroups = getSpeciesGroupTracks(normalizedTracks);
  const evaluations = [];
  for (const [species, speciesTracks] of speciesGroups.entries()) {
    if (!speciesTracks.length) continue;
    const profile = speciesTracks[0]?.profile || {};
    const pathMetrics = buildOrderedPathMetrics(speciesTracks);
    const meanHeadingDiff = mean(pathMetrics.headingDiffs);
    const meanSegDist = mean(pathMetrics.segmentDistances);
    const strideVar = variance(pathMetrics.strideValues);
    const freshnessVar = variance(pathMetrics.freshnessValues);
    const spreadM = getTrackSpreadM(speciesTracks);
    const evidence = [];
    let flightScore = 0, forageScore = 0, usableSignals = 0;
    const dirShiftScore = normalizeAgainstThreshold(meanHeadingDiff, profile.directionChangeThresholdDeg);
    if (Number.isFinite(dirShiftScore)) { usableSignals++; flightScore += dirShiftScore * 0.25; evidence.push(`mean heading change ${meanHeadingDiff?.toFixed(2)} vs threshold ${profile.directionChangeThresholdDeg?.toFixed(2)}`); }
    const spreadTightScore = normalizeAgainstThreshold(spreadM, profile.spreadTightnessThresholdM, true);
    if (Number.isFinite(spreadTightScore)) { usableSignals++; forageScore += spreadTightScore * 0.18; evidence.push(`track spread ${spreadM?.toFixed(2)}m vs tightness threshold ${profile.spreadTightnessThresholdM?.toFixed(2)}m`); }
    const strideVarScore = normalizeAgainstThreshold(strideVar, profile.strideVarianceThreshold);
    if (Number.isFinite(strideVarScore)) { usableSignals++; flightScore += strideVarScore * 0.16; evidence.push(`stride variance ${strideVar?.toFixed(4)} vs threshold ${profile.strideVarianceThreshold?.toFixed(4)}`); }
    const freshnessClusterScore = normalizeAgainstThreshold(freshnessVar, profile.freshnessClusterThreshold, true);
    if (Number.isFinite(freshnessClusterScore)) { usableSignals++; forageScore += freshnessClusterScore * 0.16; evidence.push(`freshness variance ${freshnessVar?.toFixed(4)} vs cluster threshold ${profile.freshnessClusterThreshold?.toFixed(4)}`); }
    if (Number.isFinite(meanSegDist)) { usableSignals++; flightScore += Math.min(1, meanSegDist) * 0.08; evidence.push(`mean segment distance ${meanSegDist.toFixed(2)}m`); }
    const gaits = uniqueStrings(speciesTracks.map((t) => t.gait).filter(Boolean));
    if (gaits.some((g) => ["bound","gallop","run","burst"].includes(g))) { usableSignals++; flightScore += 0.14; evidence.push(`flight-linked gait: ${gaits.join(", ")}`); }
    if (gaits.some((g) => ["walk","browse","graze","meander","slow"].includes(g))) { usableSignals++; forageScore += 0.12; evidence.push(`forage-linked gait: ${gaits.join(", ")}`); }
    const behaviorTags = uniqueStrings([...speciesTracks.map((t) => t.behavior).filter(Boolean), ...toArray(profile.flightTags), ...toArray(profile.forageTags)]);
    if (behaviorTags.some((tag) => profile.flightTags.includes(tag))) { usableSignals++; flightScore += 0.12; evidence.push("flight-linked behavior tags present"); }
    if (behaviorTags.some((tag) => profile.forageTags.includes(tag))) { usableSignals++; forageScore += 0.12; evidence.push("forage-linked behavior tags present"); }
    const meanDebris = mean(speciesTracks.map((t) => t.debrisLevel).filter((v) => Number.isFinite(v)));
    const meanEdge = mean(speciesTracks.map((t) => t.edgeClarity).filter((v) => Number.isFinite(v)));
    const meanShadow = mean(speciesTracks.map((t) => t.shadowScore).filter((v) => Number.isFinite(v)));
    if (Number.isFinite(meanDebris) && Number.isFinite(meanEdge)) { usableSignals++; if (meanDebris < meanEdge) { forageScore += 0.05; evidence.push(`debris ${meanDebris.toFixed(4)} < edge clarity ${meanEdge.toFixed(4)}`); } else { flightScore += 0.04; evidence.push(`debris ${meanDebris.toFixed(4)} >= edge clarity ${meanEdge.toFixed(4)}`); } }
    if (Number.isFinite(meanShadow)) { usableSignals++; forageScore += Math.min(1, meanShadow) * 0.03; evidence.push(`mean shadow ${meanShadow.toFixed(4)}`); }
    if (Number.isFinite(profile.weightFlight)) { flightScore *= profile.weightFlight; evidence.push(`flight weight ${profile.weightFlight.toFixed(4)}`); }
    if (Number.isFinite(profile.weightForage)) { forageScore *= profile.weightForage; evidence.push(`forage weight ${profile.weightForage.toFixed(4)}`); }
    flightScore = Number.isFinite(flightScore) ? Number(Math.min(1, flightScore).toFixed(4)) : null;
    forageScore = Number.isFinite(forageScore) ? Number(Math.min(1, forageScore).toFixed(4)) : null;
    const intentLabel = usableSignals ? determineIntentLabel(flightScore, forageScore) : "insufficient_data";
    const confBase = usableSignals > 0 ? Math.min(1, (usableSignals/9) * mean([flightScore, forageScore].filter((v) => Number.isFinite(v)))) : null;
    evaluations.push({ species, track_ids:speciesTracks.map((t)=>t.id).filter(Boolean), track_count:speciesTracks.length, intent_label:intentLabel, flight_score:flightScore, forage_score:forageScore, evaluation_strength:strengthLabel(confBase), evaluation_strength_score:Number.isFinite(confBase)?Number(confBase.toFixed(4)):null, usable_signal_count:usableSignals, mean_heading_change_deg:Number.isFinite(meanHeadingDiff)?Number(meanHeadingDiff.toFixed(2)):null, mean_segment_distance_m:Number.isFinite(meanSegDist)?Number(meanSegDist.toFixed(2)):null, stride_variance:Number.isFinite(strideVar)?Number(strideVar.toFixed(4)):null, freshness_variance:Number.isFinite(freshnessVar)?Number(freshnessVar.toFixed(4)):null, track_spread_m:Number.isFinite(spreadM)?Number(spreadM.toFixed(2)):null, zone_ids:uniqueStrings(speciesTracks.map((t)=>t.zoneId).filter(Boolean)), substrates:uniqueStrings(speciesTracks.map((t)=>t.substrate).filter(Boolean)), gaits, evidence:uniqueStrings(evidence) });
  }
  return { module:"phase2version4", function:"evaluateFlightOrForage", valid:true, evaluations, summary:{ evaluationCount:evaluations.length, flightLeaningCount:evaluations.filter((x)=>x.intent_label==="flight_leaning").length, forageLeaningCount:evaluations.filter((x)=>x.intent_label==="forage_leaning").length, mixedCount:evaluations.filter((x)=>x.intent_label==="mixed_or_uncertain").length, insufficientCount:evaluations.filter((x)=>x.intent_label==="insufficient_data").length } };
}

export function detectMultipleAnimals({
  tracks = [],
  speciesProfiles = {}
}) {
  if (!Array.isArray(tracks) || tracks.length < 2) {
    return {
      module: "phase2version1",
      function: "detectMultipleAnimals",
      valid: false,
      reason: "Not enough tracks to evaluate",
      summary: { evaluationCount: 0, multipleAnimalCount: 0 }
    };
  }

  const validTracks = tracks.filter((t) => t && typeof t === "object");
  const sizes = validTracks.map((t) => toNumber(t?.size_cm ?? t?.track_size_cm ?? t?.x)).filter((v) => Number.isFinite(v));
  const fresh = validTracks.map((t) => toNumber(t?.freshness ?? t?.freshness_score)).filter((v) => Number.isFinite(v));
  const gaits = [...new Set(validTracks.map((t) => lower(t?.gait)).filter(Boolean))];
  const speciesSet = uniqueStrings(validTracks.map((t) => lower(t?.species)).filter(Boolean));

  let sizeVar = 0, freshnessVar = 0, gaitVar = 0, speciesVar = 0;
  const evidence = [];

  if (sizes.length >= 2) {
    const sizeDiff = Math.max(...sizes) - Math.min(...sizes);
    if (sizeDiff >= 1.5) { sizeVar = 0.4; evidence.push(`size gap ${sizeDiff.toFixed(2)} cm - significant`); }
    else if (sizeDiff >= 1.0) { sizeVar = 0.2; evidence.push(`size gap ${sizeDiff.toFixed(2)} cm - moderate`); }
  }

  if (fresh.length >= 2) {
    const freshDiff = Math.max(...fresh) - Math.min(...fresh);
    if (freshDiff >= 0.3) { freshnessVar = 0.3; evidence.push(`freshness spread ${freshDiff.toFixed(4)} - different time windows likely`); }
    else if (freshDiff >= 0.15) { freshnessVar = 0.15; evidence.push(`freshness spread ${freshDiff.toFixed(4)} - possible time gap`); }
  }

  if (gaits.length > 1) { gaitVar = 0.3; evidence.push(`multiple gait modes: ${gaits.join(", ")}`); }
  if (speciesSet.length > 1) { speciesVar = 0.3; evidence.push(`multiple species present: ${speciesSet.join(", ")}`); }

  const totalScore = Number(Math.min(1, sizeVar + freshnessVar + gaitVar + speciesVar).toFixed(4));
  const multipleAnimalCount = totalScore >= 0.3 ? 1 : 0;

  let interpretation = `Multiple animal presence confidence: ${Math.round(totalScore * 100)}% - `;
  if (totalScore >= 0.7) interpretation += "High likelihood of multiple animals";
  else if (totalScore >= 0.3) interpretation += "Possible track overlap - variation detected";
  else interpretation += "Low indication of multiple animals";

  return {
    module: "phase2version1",
    function: "detectMultipleAnimals",
    valid: true,
    multi_animal_score: totalScore,
    description: interpretation,
    summary: {
      evaluationCount: validTracks.length,
      multipleAnimalCount,
      speciesPresent: speciesSet,
      gaitsPresent: gaits
    },
    evidence: uniqueStrings(evidence)
  };
}

function groupTracksBySpecies(normalizedTracks) {
  const groups = new Map();
  for (const track of normalizedTracks) {
    if (!track?.species) continue;
    if (!groups.has(track.species)) groups.set(track.species, []);
    groups.get(track.species).push(track);
  }
  return groups;
}

function getMaxSpreadM(tracks) {
  if (tracks.length < 2) return null;
  let maxDist = 0;
  for (let i = 0; i < tracks.length; i++)
    for (let j = i + 1; j < tracks.length; j++) {
      const d = computeDistanceM(tracks[i], tracks[j]);
      if (Number.isFinite(d) && d > maxDist) maxDist = d;
    }
  return Number.isFinite(maxDist) ? maxDist : null;
}

function getCenterPoint(tracks) {
  const xs = tracks.map((t) => t.x).filter((v) => Number.isFinite(v));
  const ys = tracks.map((t) => t.y).filter((v) => Number.isFinite(v));
  const lats = tracks.map((t) => t.lat).filter((v) => Number.isFinite(v));
  const lons = tracks.map((t) => t.lon).filter((v) => Number.isFinite(v));
  if (xs.length && ys.length) return { x: mean(xs), y: mean(ys), lat: null, lon: null };
  if (lats.length && lons.length) return { x: null, y: null, lat: mean(lats), lon: mean(lons) };
  return null;
}

function getDistanceToCenterStats(tracks, center) {
  if (!center) return { meanDistanceToCenterM: null, varianceDistanceToCenterM: null };
  const distances = tracks.map((t) => computeDistanceM(t, center)).filter((v) => Number.isFinite(v));
  return { meanDistanceToCenterM: mean(distances), varianceDistanceToCenterM: variance(distances) };
}

function getRevisitCount(tracks, radiusM) {
  if (!Number.isFinite(radiusM) || radiusM <= 0 || tracks.length < 3) return 0;
  let count = 0;
  for (let i = 0; i < tracks.length; i++)
    for (let j = i + 2; j < tracks.length; j++) {
      const d = computeDistanceM(tracks[i], tracks[j]);
      if (Number.isFinite(d) && d <= radiusM) count++;
    }
  return count;
}

function normalizeRatio(value, threshold, invert = false) {
  if (!Number.isFinite(value) || !Number.isFinite(threshold) || threshold <= 0) return null;
  const ratio = value / threshold;
  return Number((invert ? Math.max(0, 1 - Math.min(ratio, 1)) : Math.min(1, ratio)).toFixed(4));
}

function classifyDenning(denningScore, beddingScore) {
  if (!Number.isFinite(denningScore) && !Number.isFinite(beddingScore)) return "insufficient_data";
  if (Number.isFinite(denningScore) && Number.isFinite(beddingScore)) {
    if (Math.abs(denningScore - beddingScore) < 0.12) return "mixed_or_uncertain";
    return denningScore > beddingScore ? "denning_leaning" : "bedding_leaning";
  }
  if (Number.isFinite(denningScore) && denningScore > 0) return "denning_leaning";
  if (Number.isFinite(beddingScore) && beddingScore > 0) return "bedding_leaning";
  return "insufficient_data";
}

function getDenningProfile(entry) {
  const mk = (arrs) => uniqueStrings(arrs.flat().filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().toLowerCase()));
  return {
    denTypes: mk([toArray(entry?.denning_behavior?.den_types), toArray(entry?.denning_behavior_tags), toArray(entry?.nesting_behavior?.nest_types), toArray(entry?.roosting_behavior?.roost_types), toArray(entry?.bedding_behavior_tags), toArray(entry?.refuge_behavior?.refuge_types)]),
    denSiteTags: mk([toArray(entry?.denning_behavior?.den_site_tags), toArray(entry?.nesting_behavior?.nest_site_tags), toArray(entry?.roosting_behavior?.roost_site_tags), toArray(entry?.refuge_behavior?.refuge_types)]),
    denReturnPatternTags: mk([toArray(entry?.denning_behavior?.den_return_pattern_tags), toArray(entry?.nesting_behavior?.brood_movement_tags), toArray(entry?.roosting_behavior?.roost_return_pattern_tags), toArray(entry?.refuge_behavior?.refuge_return_pattern)]),
    denRadiusM: toNumber(entry?.denning_behavior?.den_radius_m ?? entry?.denning_logic?.den_radius_m),
    returnRadiusM: toNumber(entry?.denning_behavior?.return_radius_m ?? entry?.denning_logic?.return_radius_m),
    beddingSpreadThresholdM: toNumber(entry?.denning_behavior?.bedding_spread_threshold_m ?? entry?.denning_logic?.bedding_spread_threshold_m),
    freshnessClusterThreshold: toNumber(entry?.denning_behavior?.freshness_cluster_threshold ?? entry?.denning_logic?.freshness_cluster_threshold),
    denningWeight: toNumber(entry?.denning_behavior?.denning_weight ?? entry?.denning_logic?.denning_weight)
  };
}

export function evaluateDenningBehavior({
  tracks = [],
  speciesProfiles = {},
  environment = {}
}) {
  if (!Array.isArray(tracks) || !speciesProfiles || typeof speciesProfiles !== "object") {
    return { module:"phase2version5", function:"evaluateDenningBehavior", valid:false, reason:"Invalid input shape", evaluations:[], summary:{evaluationCount:0,denningLeaningCount:0,beddingLeaningCount:0,mixedCount:0,insufficientCount:0} };
  }
  const normalizedTracks = tracks.map((t) => {
    const base = getTrackProfile(t, speciesProfiles);
    const entry = getSpeciesEntry(speciesProfiles, t?.species);
    return { ...base, profile: entry ? getDenningProfile(entry) : null };
  }).filter((t) => t?.species && t?.entry && t?.profile);
  const speciesGroups = groupTracksBySpecies(normalizedTracks);
  const evaluations = [];
  const environmentTags = uniqueStrings(toArray(environment?.zone_tags).map(lower));
  for (const [species, speciesTracks] of speciesGroups.entries()) {
    const profile = speciesTracks[0]?.profile || {};
    const evidence = [];
    let denningScore = 0, beddingScore = 0, usableSignals = 0;
    const maxSpreadM = getMaxSpreadM(speciesTracks);
    const center = getCenterPoint(speciesTracks);
    const centerStats = getDistanceToCenterStats(speciesTracks, center);
    const revisitCount = getRevisitCount(speciesTracks, profile.returnRadiusM ?? profile.denRadiusM ?? null);
    const freshnessVariance = variance(speciesTracks.map((t) => t.freshnessScore).filter((v) => Number.isFinite(v)));
    if (Number.isFinite(maxSpreadM) && Number.isFinite(profile.beddingSpreadThresholdM)) { usableSignals++; const s = normalizeRatio(maxSpreadM, profile.beddingSpreadThresholdM, true); if (Number.isFinite(s)) { beddingScore += s * 0.28; denningScore += s * 0.12; evidence.push(`max spread ${maxSpreadM.toFixed(2)}m vs bedding threshold ${profile.beddingSpreadThresholdM.toFixed(2)}m`); } }
    if (Number.isFinite(centerStats.meanDistanceToCenterM) && Number.isFinite(profile.denRadiusM)) { usableSignals++; const s = normalizeRatio(centerStats.meanDistanceToCenterM, profile.denRadiusM, true); if (Number.isFinite(s)) { denningScore += s * 0.24; beddingScore += s * 0.14; evidence.push(`mean center distance ${centerStats.meanDistanceToCenterM.toFixed(2)}m vs den radius ${profile.denRadiusM.toFixed(2)}m`); } }
    if (revisitCount > 0) { usableSignals++; const rs = Math.min(1, revisitCount / 4); denningScore += rs * 0.24; beddingScore += rs * 0.08; evidence.push(`revisit count ${revisitCount}`); }
    if (Number.isFinite(freshnessVariance) && Number.isFinite(profile.freshnessClusterThreshold)) { usableSignals++; const fs = normalizeRatio(freshnessVariance, profile.freshnessClusterThreshold, true); if (Number.isFinite(fs)) { denningScore += fs * 0.12; beddingScore += fs * 0.16; evidence.push(`freshness variance ${freshnessVariance.toFixed(4)} vs cluster threshold ${profile.freshnessClusterThreshold.toFixed(4)}`); } }
    const meanShadow = mean(speciesTracks.map((t) => t.shadowScore).filter((v) => Number.isFinite(v)));
    const meanDepth = mean(speciesTracks.map((t) => t.depthScore).filter((v) => Number.isFinite(v)));
    const meanDebris = mean(speciesTracks.map((t) => t.debrisLevel).filter((v) => Number.isFinite(v)));
    if (Number.isFinite(meanShadow)) { usableSignals++; beddingScore += Math.min(1, meanShadow) * 0.08; evidence.push(`mean shadow ${meanShadow.toFixed(4)}`); }
    if (Number.isFinite(meanDepth)) { usableSignals++; beddingScore += Math.min(1, meanDepth) * 0.05; evidence.push(`mean depth ${meanDepth.toFixed(4)}`); }
    if (Number.isFinite(meanDebris)) { usableSignals++; denningScore += Math.min(1, meanDebris) * 0.04; evidence.push(`mean debris ${meanDebris.toFixed(4)}`); }
    if (profile.denSiteTags?.some((tag) => environmentTags.includes(tag))) { usableSignals++; denningScore += 0.18; beddingScore += 0.08; evidence.push("environment tags overlap den/bedding site tags"); }
    if (profile.denReturnPatternTags?.some((t) => ["den_centered_travel","den_centered_movement","burrow_center_loop","lodge_centered_travel","winter_den_return","cover_reentry","repeated_entry_exit"].includes(t))) { denningScore += 0.12; evidence.push("species pattern tags support den-centered return"); }
    if (profile.denTypes?.some((t) => ["ground_nest","tree_roost","cover_loafing","ridge_bed","shade_bed","brush_bedding","shallow_cover_rest"].includes(t))) { beddingScore += 0.08; evidence.push("species den/bedding types support rest-site interpretation"); }
    if (speciesTracks.some((t) => ["walk","slow","meander","browse","graze"].includes(t.gait))) { beddingScore += 0.05; evidence.push("rest-compatible gait tags present"); }
    if (speciesTracks.some((t) => ["den","bed","rest","roost","nest"].includes(t.behavior))) { denningScore += 0.08; beddingScore += 0.08; evidence.push("track behavior tags include denning or bedding"); }
    if (Number.isFinite(profile.denningWeight)) { denningScore *= profile.denningWeight; beddingScore *= profile.denningWeight; evidence.push(`denning weight ${profile.denningWeight.toFixed(4)}`); }
    denningScore = Number(Math.min(1, denningScore).toFixed(4));
    beddingScore = Number(Math.min(1, beddingScore).toFixed(4));
    const denningLabel = usableSignals > 0 ? classifyDenning(denningScore, beddingScore) : "insufficient_data";
    const confBase = usableSignals > 0 ? Math.min(1, (usableSignals / 8) * mean([denningScore, beddingScore].filter((v) => Number.isFinite(v)))) : null;
    evaluations.push({ species, track_ids:speciesTracks.map((t)=>t.id).filter(Boolean), track_count:speciesTracks.length, denning_label:denningLabel, denning_score:denningScore, bedding_score:beddingScore, evaluation_strength:strengthLabel(confBase), evaluation_strength_score:Number.isFinite(confBase)?Number(confBase.toFixed(4)):null, usable_signal_count:usableSignals, max_spread_m:Number.isFinite(maxSpreadM)?Number(maxSpreadM.toFixed(2)):null, mean_distance_to_center_m:Number.isFinite(centerStats.meanDistanceToCenterM)?Number(centerStats.meanDistanceToCenterM.toFixed(2)):null, freshness_variance:Number.isFinite(freshnessVariance)?Number(freshnessVariance.toFixed(4)):null, revisit_count:revisitCount, zone_ids:uniqueStrings(speciesTracks.map((t)=>t.zoneId).filter(Boolean)), substrates:uniqueStrings(speciesTracks.map((t)=>t.substrate).filter(Boolean)), evidence:uniqueStrings(evidence) });
  }
  return { module:"phase2version5", function:"evaluateDenningBehavior", valid:true, evaluations, summary:{ evaluationCount:evaluations.length, denningLeaningCount:evaluations.filter((x)=>x.denning_label==="denning_leaning").length, beddingLeaningCount:evaluations.filter((x)=>x.denning_label==="bedding_leaning").length, mixedCount:evaluations.filter((x)=>x.denning_label==="mixed_or_uncertain").length, insufficientCount:evaluations.filter((x)=>x.denning_label==="insufficient_data").length } };
}

function getScentProfile(entry) {
  const mk = (arrs) => uniqueStrings(arrs.flat().filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().toLowerCase()));
  return {
    scentMarkingTags: mk([toArray(entry?.territorial_behavior?.scent_marking_tags), toArray(entry?.scent_marking_behavior?.scent_marking_tags), toArray(entry?.behavior_research?.scent_marking_tags)]),
    loopbackTags: mk([toArray(entry?.territorial_behavior?.loopback_pattern_tags), toArray(entry?.scent_marking_behavior?.loopback_pattern_tags), toArray(entry?.territorial_behavior?.territoriality_tags)]),
    travelContextTags: mk([toArray(entry?.territorial_behavior?.travel_context_tags), toArray(entry?.scent_marking_behavior?.travel_context_tags), toArray(entry?.behavior_research?.primary_habitat)]),
    markingRadiusM: toNumber(entry?.scent_marking_behavior?.marking_radius_m ?? entry?.territorial_behavior?.marking_radius_m ?? entry?.scent_logic?.marking_radius_m),
    revisitRadiusM: toNumber(entry?.scent_marking_behavior?.revisit_radius_m ?? entry?.territorial_behavior?.revisit_radius_m ?? entry?.scent_logic?.revisit_radius_m),
    routeReuseThresholdM: toNumber(entry?.scent_marking_behavior?.route_reuse_threshold_m ?? entry?.territorial_behavior?.route_reuse_threshold_m ?? entry?.scent_logic?.route_reuse_threshold_m),
    freshnessClusterThreshold: toNumber(entry?.scent_marking_behavior?.freshness_cluster_threshold ?? entry?.scent_logic?.freshness_cluster_threshold),
    scentWeight: toNumber(entry?.scent_marking_behavior?.scent_weight ?? entry?.scent_logic?.scent_weight)
  };
}

function getSequentialMetrics(tracks) {
  const headingDiffs = [], segmentDistances = [], freshnessValues = [];
  for (let i = 0; i < tracks.length; i++) {
    const cur = tracks[i];
    if (Number.isFinite(cur.freshnessScore)) freshnessValues.push(cur.freshnessScore);
    if (i === 0) continue;
    const prev = tracks[i - 1];
    const hd = angleDifferenceDeg(prev.headingDeg, cur.headingDeg);
    if (Number.isFinite(hd)) headingDiffs.push(hd);
    const sd = computeDistanceM(prev, cur);
    if (Number.isFinite(sd)) segmentDistances.push(sd);
  }
  return { meanHeadingDiff: mean(headingDiffs), headingVariance: variance(headingDiffs), meanSegmentDistance: mean(segmentDistances), freshnessVariance: variance(freshnessValues) };
}

function classifyScentMarking(scentScore, territorialScore) {
  if (!Number.isFinite(scentScore) && !Number.isFinite(territorialScore)) return "insufficient_data";
  if (Number.isFinite(scentScore) && Number.isFinite(territorialScore)) {
    if (Math.abs(scentScore - territorialScore) < 0.12) return "mixed_or_uncertain";
    return scentScore > territorialScore ? "marking_pattern_leaning" : "territorial_patrol_leaning";
  }
  if (Number.isFinite(scentScore) && scentScore > 0) return "marking_pattern_leaning";
  if (Number.isFinite(territorialScore) && territorialScore > 0) return "territorial_patrol_leaning";
  return "insufficient_data";
}

export function evaluateTerritorialMarkingPattern({
  tracks = [],
  speciesProfiles = {},
  environment = {}
}) {
  if (!Array.isArray(tracks) || !speciesProfiles || typeof speciesProfiles !== "object") {
    return { module:"phase2version6", function:"evaluateTerritorialMarkingPattern", valid:false, reason:"Invalid input shape", evaluations:[], summary:{evaluationCount:0,markingPatternCount:0,territorialPatrolCount:0,mixedCount:0,insufficientCount:0} };
  }
  const normalizedTracks = tracks.map((t) => {
    const base = getTrackProfile(t, speciesProfiles);
    const entry = getSpeciesEntry(speciesProfiles, t?.species);
    return { ...base, profile: entry ? getScentProfile(entry) : null };
  }).filter((t) => t?.species && t?.entry && t?.profile);
  const speciesGroups = groupTracksBySpecies(normalizedTracks);
  const evaluations = [];
  const environmentTags = uniqueStrings(toArray(environment?.zone_tags).map(lower));
  for (const [species, speciesTracks] of speciesGroups.entries()) {
    const profile = speciesTracks[0]?.profile || {};
    const evidence = [];
    let scentMarkingScore = 0, territorialPatrolScore = 0, usableSignals = 0;
    const center = getCenterPoint(speciesTracks);
    const centerStats = getDistanceToCenterStats(speciesTracks, center);
    const maxSpreadM = getMaxSpreadM(speciesTracks);
    const revisitCount = getRevisitCount(speciesTracks, profile.revisitRadiusM ?? profile.markingRadiusM ?? profile.routeReuseThresholdM ?? null);
    const seq = getSequentialMetrics(speciesTracks);
    if (Number.isFinite(centerStats.meanDistanceToCenterM) && Number.isFinite(profile.markingRadiusM)) { usableSignals++; const s = normalizeRatio(centerStats.meanDistanceToCenterM, profile.markingRadiusM, true); if (Number.isFinite(s)) { scentMarkingScore += s*0.18; territorialPatrolScore += s*0.12; evidence.push(`center dist ${centerStats.meanDistanceToCenterM.toFixed(2)}m vs marking radius ${profile.markingRadiusM.toFixed(2)}m`); } }
    if (revisitCount > 0) { usableSignals++; const rs = Math.min(1, revisitCount/4); scentMarkingScore += rs*0.24; territorialPatrolScore += rs*0.22; evidence.push(`revisit count ${revisitCount}`); }
    if (Number.isFinite(maxSpreadM) && Number.isFinite(profile.routeReuseThresholdM)) { usableSignals++; const rs = normalizeRatio(maxSpreadM, profile.routeReuseThresholdM, true); if (Number.isFinite(rs)) { territorialPatrolScore += rs*0.18; scentMarkingScore += rs*0.08; evidence.push(`max spread ${maxSpreadM.toFixed(2)}m vs route reuse threshold ${profile.routeReuseThresholdM.toFixed(2)}m`); } }
    if (Number.isFinite(seq.meanHeadingDiff)) { usableSignals++; const hc = Math.max(0, 1-Math.min(seq.meanHeadingDiff/180,1)); territorialPatrolScore += hc*0.08; evidence.push(`mean heading change ${seq.meanHeadingDiff.toFixed(2)}`); }
    if (Number.isFinite(seq.headingVariance)) { usableSignals++; const hv = Math.max(0, 1-Math.min(seq.headingVariance,1)); territorialPatrolScore += hv*0.08; evidence.push(`heading variance ${seq.headingVariance.toFixed(4)}`); }
    if (Number.isFinite(seq.freshnessVariance) && Number.isFinite(profile.freshnessClusterThreshold)) { usableSignals++; const fs = normalizeRatio(seq.freshnessVariance, profile.freshnessClusterThreshold, true); if (Number.isFinite(fs)) { scentMarkingScore += fs*0.08; territorialPatrolScore += fs*0.10; evidence.push(`freshness variance ${seq.freshnessVariance.toFixed(4)} vs cluster threshold ${profile.freshnessClusterThreshold.toFixed(4)}`); } }
    if (profile.scentMarkingTags?.length > 0) { usableSignals++; scentMarkingScore += 0.14; evidence.push("species scent-marking tags present"); }
    if (profile.loopbackTags?.length > 0) { usableSignals++; territorialPatrolScore += 0.12; evidence.push("species territorial loopback tags present"); }
    if (profile.travelContextTags?.some((t) => environmentTags.includes(t))) { usableSignals++; territorialPatrolScore += 0.10; scentMarkingScore += 0.06; evidence.push("environment tags overlap travel-context tags"); }
    if (profile.scentMarkingTags?.some((t) => ["urine_mark","scat_mark","trail_edge_mark","scent_post_use","latrine_site","castor_mound","scent_mound","shoreline_mark","spraint_site","scrape_mark","burrow_area_mark","rest_site_mark"].includes(t))) { scentMarkingScore += 0.12; evidence.push("species tags support explicit marking behavior"); }
    if (profile.loopbackTags?.some((t) => ["localized_loopback","edge_revisit","scent_route_reuse","cover_loop","ridge_revisit","riparian_loopback","burrow_network_revisit","forest_patch_loopback","creek_edge_loopback","river_bend_loopback","feed_cache_revisit"].includes(t))) { territorialPatrolScore += 0.12; evidence.push("species tags support route-reuse or patrol looping"); }
    if (speciesTracks.some((t) => ["patrol","mark","territorial","loop"].includes(t.behavior))) { scentMarkingScore += 0.08; territorialPatrolScore += 0.10; evidence.push("track behavior tags include territorial or marking language"); }
    if (speciesTracks.some((t) => ["walk","trot","meander","slow"].includes(t.gait))) { territorialPatrolScore += 0.06; evidence.push("patrol-compatible gait tags present"); }
    if (Number.isFinite(profile.scentWeight)) { scentMarkingScore *= profile.scentWeight; territorialPatrolScore *= profile.scentWeight; evidence.push(`scent weight ${profile.scentWeight.toFixed(4)}`); }
    scentMarkingScore = Number(Math.min(1, scentMarkingScore).toFixed(4));
    territorialPatrolScore = Number(Math.min(1, territorialPatrolScore).toFixed(4));
    const scentLabel = usableSignals > 0 ? classifyScentMarking(scentMarkingScore, territorialPatrolScore) : "insufficient_data";
    const confBase = usableSignals > 0 ? Math.min(1, (usableSignals/9)*mean([scentMarkingScore,territorialPatrolScore].filter((v)=>Number.isFinite(v)))) : null;
    evaluations.push({ species, track_ids:speciesTracks.map((t)=>t.id).filter(Boolean), track_count:speciesTracks.length, marking_label:scentLabel, marking_pattern_score:scentMarkingScore, territorial_patrol_score:territorialPatrolScore, scent_marking_score:scentMarkingScore, evaluation_strength:strengthLabel(confBase), evaluation_strength_score:Number.isFinite(confBase)?Number(confBase.toFixed(4)):null, usable_signal_count:usableSignals, mean_distance_to_center_m:Number.isFinite(centerStats.meanDistanceToCenterM)?Number(centerStats.meanDistanceToCenterM.toFixed(2)):null, max_spread_m:Number.isFinite(maxSpreadM)?Number(maxSpreadM.toFixed(2)):null, revisit_count:revisitCount, mean_heading_change_deg:Number.isFinite(seq.meanHeadingDiff)?Number(seq.meanHeadingDiff.toFixed(2)):null, heading_variance:Number.isFinite(seq.headingVariance)?Number(seq.headingVariance.toFixed(4)):null, freshness_variance:Number.isFinite(seq.freshnessVariance)?Number(seq.freshnessVariance.toFixed(4)):null, zone_ids:uniqueStrings(speciesTracks.map((t)=>t.zoneId).filter(Boolean)), substrates:uniqueStrings(speciesTracks.map((t)=>t.substrate).filter(Boolean)), evidence:uniqueStrings(evidence) });
  }
  return { module:"phase2version6", function:"evaluateTerritorialMarkingPattern", valid:true, evaluations, summary:{ evaluationCount:evaluations.length, markingPatternCount:evaluations.filter((x)=>x.marking_label==="marking_pattern_leaning").length, territorialPatrolCount:evaluations.filter((x)=>x.marking_label==="territorial_patrol_leaning").length, mixedCount:evaluations.filter((x)=>x.marking_label==="mixed_or_uncertain").length, insufficientCount:evaluations.filter((x)=>x.marking_label==="insufficient_data").length } };
}

function getPatternProfile(entry) {
  return {
    loopbackRadiusM: toNumber(entry?.movement_pattern?.loopback_radius_m ?? entry?.pattern_logic?.loopback_radius_m),
    zigzagDirectionThresholdDeg: toNumber(entry?.movement_pattern?.zigzag_direction_threshold_deg ?? entry?.pattern_logic?.zigzag_direction_threshold_deg),
    escapeLineDirectionVarianceThreshold: toNumber(entry?.movement_pattern?.escape_line_direction_variance_threshold ?? entry?.pattern_logic?.escape_line_direction_variance_threshold),
    waterApproachRadiusM: toNumber(entry?.movement_pattern?.water_approach_radius_m ?? entry?.pattern_logic?.water_approach_radius_m),
    trailReuseRadiusM: toNumber(entry?.movement_pattern?.trail_reuse_radius_m ?? entry?.pattern_logic?.trail_reuse_radius_m),
    patternTags: uniqueStrings([
      ...toArray(entry?.movement_pattern?.pattern_tags), ...toArray(entry?.pattern_logic?.pattern_tags),
      ...toArray(entry?.territorial_behavior?.loopback_pattern_tags), ...toArray(entry?.forage_behavior_tags),
      ...toArray(entry?.flight_behavior_tags), ...toArray(entry?.feeding_pattern?.movement_tags),
      ...toArray(entry?.refuge_behavior?.refuge_return_pattern)
    ].filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().toLowerCase()))
  };
}

function buildSequentialMetrics(tracks) {
  const segmentDistances = [], headingDiffs = [], headings = [], strideValues = [], freshnessValues = [];
  for (let i = 0; i < tracks.length; i++) {
    const cur = tracks[i];
    if (Number.isFinite(cur.headingDeg)) headings.push(cur.headingDeg);
    if (Number.isFinite(cur.strideLengthM)) strideValues.push(cur.strideLengthM);
    if (Number.isFinite(cur.freshnessScore)) freshnessValues.push(cur.freshnessScore);
    if (i === 0) continue;
    const prev = tracks[i - 1];
    const dist = computeDistanceM(prev, cur);
    if (Number.isFinite(dist)) segmentDistances.push(dist);
    const hd = angleDifferenceDeg(prev.headingDeg, cur.headingDeg);
    if (Number.isFinite(hd)) headingDiffs.push(hd);
  }
  return { segmentDistances, headingDiffs, headings, strideValues, freshnessValues };
}

function getReturnToStartDistanceM(tracks) {
  if (tracks.length < 3) return null;
  return computeDistanceM(tracks[0], tracks[tracks.length - 1]);
}

function determinePrimaryPattern(scores) {
  const entries = Object.entries(scores).filter(([, v]) => Number.isFinite(v));
  if (!entries.length) return "insufficient_data";
  entries.sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? null;
  if (!Number.isFinite(topScore) || topScore <= 0) return "insufficient_data";
  if (Number.isFinite(secondScore) && Math.abs(topScore - secondScore) < 0.12) return "mixed_or_uncertain";
  return topKey;
}

export function movementPatternDetector({
  tracks = [],
  speciesProfiles = {},
  environment = {}
}) {
  if (!Array.isArray(tracks) || !speciesProfiles || typeof speciesProfiles !== "object") {
    return { module:"phase2_movement_pattern_detector", function:"movementPatternDetector", valid:false, reason:"Invalid input shape", evaluations:[], summary:{evaluationCount:0,loopbackCount:0,zigzagCount:0,escapeLineCount:0,waterApproachCount:0,trailReuseCount:0} };
  }
  const normalizedTracks = tracks.map((t) => {
    const base = getTrackProfile(t, speciesProfiles);
    const entry = getSpeciesEntry(speciesProfiles, t?.species);
    return { ...base, strideLengthM: toNumber(t?.stride_length_m ?? t?.pace_length_m ?? t?.step_length_m), profile: entry ? getPatternProfile(entry) : null };
  }).filter((t) => t?.species && t?.entry && t?.profile);
  const speciesGroups = groupTracksBySpecies(normalizedTracks);
  const evaluations = [];
  const environmentZoneTags = uniqueStrings(toArray(environment?.zone_tags).map(lower));
  const nearWater = Boolean(environment?.near_water === true || environmentZoneTags.includes("water") || environmentZoneTags.includes("creek_edge") || environmentZoneTags.includes("riparian"));
  for (const [species, speciesTracks] of speciesGroups.entries()) {
    const profile = speciesTracks[0]?.profile || {};
    const metrics = buildSequentialMetrics(speciesTracks);
    const meanHeadingDiff = mean(metrics.headingDiffs);
    const headingVariance = variance(metrics.headingDiffs);
    const meanSegDist = mean(metrics.segmentDistances);
    const strideVariance = variance(metrics.strideValues);
    const freshnessVariance = variance(metrics.freshnessValues);
    const maxSpreadM = getMaxSpreadM(speciesTracks);
    const returnToStartM = getReturnToStartDistanceM(speciesTracks);
    const revisitCount = getRevisitCount(speciesTracks, profile.loopbackRadiusM ?? profile.trailReuseRadiusM ?? null);
    let loopbackScore = 0, zigzagScore = 0, escapeLineScore = 0, waterApproachScore = 0, trailReuseScore = 0, usableSignals = 0;
    const evidence = [];
    if (Number.isFinite(returnToStartM) && Number.isFinite(profile.loopbackRadiusM)) { usableSignals++; const s = normalizeRatio(returnToStartM, profile.loopbackRadiusM, true); if (Number.isFinite(s)) { loopbackScore += s*0.35; evidence.push(`return-to-start ${returnToStartM.toFixed(2)}m vs loopback radius ${profile.loopbackRadiusM.toFixed(2)}m`); } }
    if (revisitCount > 0) { usableSignals++; const rs = Math.min(1, revisitCount/4); loopbackScore += rs*0.20; trailReuseScore += rs*0.25; evidence.push(`revisit count ${revisitCount}`); }
    if (Number.isFinite(meanHeadingDiff) && Number.isFinite(profile.zigzagDirectionThresholdDeg)) { usableSignals++; const s = normalizeRatio(meanHeadingDiff, profile.zigzagDirectionThresholdDeg); if (Number.isFinite(s)) { zigzagScore += s*0.30; evidence.push(`mean heading ${meanHeadingDiff.toFixed(2)} vs zigzag threshold ${profile.zigzagDirectionThresholdDeg.toFixed(2)}`); } }
    if (Number.isFinite(headingVariance) && Number.isFinite(profile.escapeLineDirectionVarianceThreshold)) { usableSignals++; const s = normalizeRatio(headingVariance, profile.escapeLineDirectionVarianceThreshold, true); if (Number.isFinite(s)) { escapeLineScore += s*0.35; evidence.push(`heading variance ${headingVariance.toFixed(4)} vs escape threshold ${profile.escapeLineDirectionVarianceThreshold.toFixed(4)}`); } }
    if (Number.isFinite(meanSegDist)) { usableSignals++; escapeLineScore += Math.min(1, meanSegDist)*0.12; evidence.push(`mean segment distance ${meanSegDist.toFixed(2)}m`); }
    if (Number.isFinite(strideVariance)) { usableSignals++; escapeLineScore += Math.min(1-Math.min(strideVariance,1),1)*0.10; zigzagScore += Math.min(1,strideVariance)*0.08; evidence.push(`stride variance ${strideVariance.toFixed(4)}`); }
    if (Number.isFinite(freshnessVariance)) { usableSignals++; trailReuseScore += Math.max(0,1-Math.min(freshnessVariance,1))*0.08; evidence.push(`freshness variance ${freshnessVariance.toFixed(4)}`); }
    if (nearWater) { usableSignals++; waterApproachScore += 0.22; evidence.push("environment flagged near water"); }
    if (profile.patternTags.some((t) => ["loopback","localized_loopback","cover_patch_revisit","den_centered_travel","feed_cover_loop"].includes(t))) { loopbackScore += 0.12; trailReuseScore += 0.08; evidence.push("species pattern tags support loopback or route reuse"); }
    if (profile.patternTags.some((t) => ["zigzag_escape","forage_spread_then_regroup","patch_forage","meandering_search"].includes(t))) { zigzagScore += 0.12; evidence.push("species pattern tags support zigzag"); }
    if (profile.patternTags.some((t) => ["rapid_open_country_escape","long_run_escape","group_departure","direct_run","escape_line"].includes(t))) { escapeLineScore += 0.12; evidence.push("species pattern tags support escape-line"); }
    if (profile.patternTags.some((t) => ["shoreline_loopback","bank_patrol_revisit","water_edge_reentry","shoreline_revisit","aquatic_corridor_use"].includes(t))) { waterApproachScore += 0.14; trailReuseScore += 0.08; evidence.push("species pattern tags support water-linked travel"); }
    if (speciesTracks.some((t) => ["bound","gallop","run","burst"].includes(t.gait))) { escapeLineScore += 0.10; evidence.push("flight-linked gait present"); }
    if (speciesTracks.some((t) => ["browse","graze","meander","walk","slow"].includes(t.gait))) { zigzagScore += 0.08; loopbackScore += 0.06; evidence.push("forage-linked gait present"); }
    if (maxSpreadM && Number.isFinite(maxSpreadM)) evidence.push(`max spread ${maxSpreadM.toFixed(2)}m`);
    loopbackScore = Number(Math.min(1,loopbackScore).toFixed(4));
    zigzagScore = Number(Math.min(1,zigzagScore).toFixed(4));
    escapeLineScore = Number(Math.min(1,escapeLineScore).toFixed(4));
    waterApproachScore = Number(Math.min(1,waterApproachScore).toFixed(4));
    trailReuseScore = Number(Math.min(1,trailReuseScore).toFixed(4));
    const patternScores = { loopback:loopbackScore, zigzag:zigzagScore, escape_line:escapeLineScore, water_approach:waterApproachScore, trail_reuse:trailReuseScore };
    const primaryPattern = usableSignals > 0 ? determinePrimaryPattern(patternScores) : "insufficient_data";
    const confBase = usableSignals > 0 ? Math.min(1,(usableSignals/8)*mean(Object.values(patternScores).filter((v)=>Number.isFinite(v)))) : null;
    evaluations.push({ species, track_ids:speciesTracks.map((t)=>t.id).filter(Boolean), track_count:speciesTracks.length, primary_pattern:primaryPattern, pattern_scores:patternScores, evaluation_strength:strengthLabel(confBase), evaluation_strength_score:Number.isFinite(confBase)?Number(confBase.toFixed(4)):null, usable_signal_count:usableSignals, mean_heading_change_deg:Number.isFinite(meanHeadingDiff)?Number(meanHeadingDiff.toFixed(2)):null, heading_variance:Number.isFinite(headingVariance)?Number(headingVariance.toFixed(4)):null, mean_segment_distance_m:Number.isFinite(meanSegDist)?Number(meanSegDist.toFixed(2)):null, stride_variance:Number.isFinite(strideVariance)?Number(strideVariance.toFixed(4)):null, freshness_variance:Number.isFinite(freshnessVariance)?Number(freshnessVariance.toFixed(4)):null, max_spread_m:Number.isFinite(maxSpreadM)?Number(maxSpreadM.toFixed(2)):null, return_to_start_distance_m:Number.isFinite(returnToStartM)?Number(returnToStartM.toFixed(2)):null, revisit_count:revisitCount, zone_ids:uniqueStrings(speciesTracks.map((t)=>t.zoneId).filter(Boolean)), substrates:uniqueStrings(speciesTracks.map((t)=>t.substrate).filter(Boolean)), evidence:uniqueStrings(evidence) });
  }
  return { module:"phase2_movement_pattern_detector", function:"movementPatternDetector", valid:true, evaluations, summary:{ evaluationCount:evaluations.length, loopbackCount:evaluations.filter((x)=>x.primary_pattern==="loopback").length, zigzagCount:evaluations.filter((x)=>x.primary_pattern==="zigzag").length, escapeLineCount:evaluations.filter((x)=>x.primary_pattern==="escape_line").length, waterApproachCount:evaluations.filter((x)=>x.primary_pattern==="water_approach").length, trailReuseCount:evaluations.filter((x)=>x.primary_pattern==="trail_reuse").length } };
}

function getTerrainProfile(entry) {
  return {
    primaryHabitat: uniqueStrings([
      ...toArray(entry?.behavior_research?.primary_habitat), ...toArray(entry?.territorial_behavior?.travel_context_tags),
      ...toArray(entry?.denning_behavior?.den_site_tags), ...toArray(entry?.roosting_behavior?.roost_site_tags),
      ...toArray(entry?.nesting_behavior?.nest_site_tags), ...toArray(entry?.refuge_behavior?.refuge_types)
    ].filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim().toLowerCase())),
    terrainWeight: toNumber(entry?.terrain_intelligence?.terrain_weight ?? entry?.terrain_logic?.terrain_weight),
    waterEdgeWeight: toNumber(entry?.terrain_intelligence?.water_edge_weight ?? entry?.terrain_logic?.water_edge_weight),
    coverWeight: toNumber(entry?.terrain_intelligence?.cover_weight ?? entry?.terrain_logic?.cover_weight),
    openGroundWeight: toNumber(entry?.terrain_intelligence?.open_ground_weight ?? entry?.terrain_logic?.open_ground_weight),
    elevationWeight: toNumber(entry?.terrain_intelligence?.elevation_weight ?? entry?.terrain_logic?.elevation_weight)
  };
}

function substrateCategory(substrate) {
  const s = lower(substrate);
  if (["creek_edge","wet_sand","slush","wet_grass","marsh","river_edge"].includes(s)) return "water_edge";
  if (["leaf_litter","pine_needles","moss","undergrowth","grass_tall"].includes(s)) return "cover";
  if (["grass_short","dry_sand","trail_dust","packed_dirt","open_ground"].includes(s)) return "open_ground";
  if (["rocky","thin_soil_rock","gravel","ice_crust","snow_crust"].includes(s)) return "elevated_or_hard";
  if (["mud","soft_dirt","clay","ash_soil","burned_ground"].includes(s)) return "soft_ground";
  return "unknown";
}

function scoreEnvironmentOverlap(profile, environmentTags) {
  if (!profile?.primaryHabitat?.length || !environmentTags.length) return { score:0, evidence:[] };
  const overlap = profile.primaryHabitat.filter((tag) => environmentTags.includes(tag));
  if (!overlap.length) return { score:0, evidence:[] };
  return { score: Math.min(1, overlap.length/3), evidence:[`environment overlap with species terrain tags: ${overlap.join(", ")}`] };
}

function countByCategory(tracks) {
  const counts = { water_edge:0, cover:0, open_ground:0, elevated_or_hard:0, soft_ground:0, unknown:0 };
  for (const track of tracks) counts[substrateCategory(track.substrate)] += 1;
  return counts;
}

function determinePrimaryTerrainContext(scores) {
  const entries = Object.entries(scores).filter(([, v]) => Number.isFinite(v));
  if (!entries.length) return "insufficient_data";
  entries.sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = entries[0];
  const secondScore = entries[1]?.[1] ?? null;
  if (!Number.isFinite(topScore) || topScore <= 0) return "insufficient_data";
  if (Number.isFinite(secondScore) && Math.abs(topScore - secondScore) < 0.12) return "mixed_or_uncertain";
  return topKey;
}

export function terrainIntelligenceEngine({
  tracks = [],
  speciesProfiles = {},
  environment = {}
}) {
  if (!Array.isArray(tracks) || !speciesProfiles || typeof speciesProfiles !== "object") {
    return { module:"phase2_terrain_intelligence", function:"terrainIntelligenceEngine", valid:false, reason:"Invalid input shape", evaluations:[], summary:{evaluationCount:0,waterEdgeCount:0,coverUseCount:0,openGroundCount:0,elevatedUseCount:0,refugeContextCount:0} };
  }
  const normalizedTracks = tracks.map((t) => {
    const base = getTrackProfile(t, speciesProfiles);
    const entry = getSpeciesEntry(speciesProfiles, t?.species);
    return { ...base, profile: entry ? getTerrainProfile(entry) : null };
  }).filter((t) => t?.species && t?.entry && t?.profile);
  const groups = groupTracksBySpecies(normalizedTracks);
  const evaluations = [];
  const environmentTags = uniqueStrings(toArray(environment?.zone_tags).map(lower));
  const nearWater = Boolean(environment?.near_water === true);
  const onRidge = Boolean(environment?.on_ridge === true);
  const denseCover = Boolean(environment?.dense_cover === true);
  for (const [species, speciesTracks] of groups.entries()) {
    const profile = speciesTracks[0]?.profile || {};
    const evidence = [];
    let usableSignals = 0;
    let waterEdgeUse=0, coverUse=0, openGroundUse=0, ridgeOrElevatedUse=0, denOrRefugeContext=0, forageFriendlyContext=0, travelCorridorContext=0;
    const counts = countByCategory(speciesTracks);
    const totalTracks = speciesTracks.length || 1;
    const waterRatio = counts.water_edge/totalTracks, coverRatio = counts.cover/totalTracks, openRatio = counts.open_ground/totalTracks, elevatedRatio = counts.elevated_or_hard/totalTracks, softGroundRatio = counts.soft_ground/totalTracks;
    if (waterRatio > 0) { usableSignals++; waterEdgeUse += waterRatio*0.35; forageFriendlyContext += waterRatio*0.10; evidence.push(`water-edge substrate ratio ${waterRatio.toFixed(4)}`); }
    if (coverRatio > 0) { usableSignals++; coverUse += coverRatio*0.35; denOrRefugeContext += coverRatio*0.18; evidence.push(`cover substrate ratio ${coverRatio.toFixed(4)}`); }
    if (openRatio > 0) { usableSignals++; openGroundUse += openRatio*0.30; travelCorridorContext += openRatio*0.08; evidence.push(`open-ground substrate ratio ${openRatio.toFixed(4)}`); }
    if (elevatedRatio > 0) { usableSignals++; ridgeOrElevatedUse += elevatedRatio*0.28; evidence.push(`elevated-or-hard substrate ratio ${elevatedRatio.toFixed(4)}`); }
    if (softGroundRatio > 0) { usableSignals++; forageFriendlyContext += softGroundRatio*0.12; evidence.push(`soft-ground substrate ratio ${softGroundRatio.toFixed(4)}`); }
    const overlap = scoreEnvironmentOverlap(profile, environmentTags);
    if (overlap.score > 0) { usableSignals++; waterEdgeUse+=overlap.score*0.08; coverUse+=overlap.score*0.08; openGroundUse+=overlap.score*0.08; ridgeOrElevatedUse+=overlap.score*0.08; denOrRefugeContext+=overlap.score*0.10; forageFriendlyContext+=overlap.score*0.08; travelCorridorContext+=overlap.score*0.08; evidence.push(...overlap.evidence); }
    if (nearWater) { usableSignals++; waterEdgeUse+=0.20; travelCorridorContext+=0.08; evidence.push("environment flagged near water"); }
    if (denseCover) { usableSignals++; coverUse+=0.18; denOrRefugeContext+=0.16; evidence.push("environment flagged dense cover"); }
    if (onRidge) { usableSignals++; ridgeOrElevatedUse+=0.20; travelCorridorContext+=0.08; evidence.push("environment flagged ridge or elevated terrain"); }
    if (profile.primaryHabitat.some((t) => ["riparian","wetland","wetland_edge","stream_bank","river_edge","pond","lake_edge","marsh","beaver_pond"].includes(t))) { waterEdgeUse+=0.10; evidence.push("species terrain profile supports water-linked habitat"); }
    if (profile.primaryHabitat.some((t) => ["forest","mixed_forest","conifer_forest","dense_evergreen_cover","shrub_cover","brushland","undergrowth"].includes(t))) { coverUse+=0.10; denOrRefugeContext+=0.06; evidence.push("species terrain profile supports cover-linked habitat"); }
    if (profile.primaryHabitat.some((t) => ["prairie","open_country","grassland","sagebrush_plain","agricultural_edge","semiarid_open_country"].includes(t))) { openGroundUse+=0.10; evidence.push("species terrain profile supports open-ground habitat"); }
    if (profile.primaryHabitat.some((t) => ["alpine_cliff","subalpine_ridge","rocky_slope","mountain_slope","high_alpine_tundra","rock_tundra","fellfield"].includes(t))) { ridgeOrElevatedUse+=0.12; evidence.push("species terrain profile supports elevated or alpine habitat"); }
    if (Number.isFinite(profile.waterEdgeWeight)) { waterEdgeUse*=profile.waterEdgeWeight; evidence.push(`water-edge weight ${profile.waterEdgeWeight.toFixed(4)}`); }
    if (Number.isFinite(profile.coverWeight)) { coverUse*=profile.coverWeight; denOrRefugeContext*=profile.coverWeight; evidence.push(`cover weight ${profile.coverWeight.toFixed(4)}`); }
    if (Number.isFinite(profile.openGroundWeight)) { openGroundUse*=profile.openGroundWeight; evidence.push(`open-ground weight ${profile.openGroundWeight.toFixed(4)}`); }
    if (Number.isFinite(profile.elevationWeight)) { ridgeOrElevatedUse*=profile.elevationWeight; evidence.push(`elevation weight ${profile.elevationWeight.toFixed(4)}`); }
    if (Number.isFinite(profile.terrainWeight)) { waterEdgeUse*=profile.terrainWeight; coverUse*=profile.terrainWeight; openGroundUse*=profile.terrainWeight; ridgeOrElevatedUse*=profile.terrainWeight; denOrRefugeContext*=profile.terrainWeight; forageFriendlyContext*=profile.terrainWeight; travelCorridorContext*=profile.terrainWeight; evidence.push(`terrain weight ${profile.terrainWeight.toFixed(4)}`); }
    const terrainScores = { water_edge_use:Number(Math.min(1,waterEdgeUse).toFixed(4)), cover_use:Number(Math.min(1,coverUse).toFixed(4)), open_ground_use:Number(Math.min(1,openGroundUse).toFixed(4)), ridge_or_elevated_use:Number(Math.min(1,ridgeOrElevatedUse).toFixed(4)), den_or_refuge_context:Number(Math.min(1,denOrRefugeContext).toFixed(4)), forage_friendly_context:Number(Math.min(1,forageFriendlyContext).toFixed(4)), travel_corridor_context:Number(Math.min(1,travelCorridorContext).toFixed(4)) };
    const primaryTerrainContext = usableSignals > 0 ? determinePrimaryTerrainContext(terrainScores) : "insufficient_data";
    const confBase = usableSignals > 0 ? Math.min(1,(usableSignals/8)*(mean(Object.values(terrainScores))??0)) : null;
    evaluations.push({ species, track_ids:speciesTracks.map((t)=>t.id).filter(Boolean), track_count:speciesTracks.length, primary_terrain_context:primaryTerrainContext, terrain_scores:terrainScores, evaluation_strength:strengthLabel(confBase), evaluation_strength_score:Number.isFinite(confBase)?Number(confBase.toFixed(4)):null, usable_signal_count:usableSignals, substrate_breakdown:counts, zone_ids:uniqueStrings(speciesTracks.map((t)=>t.zoneId).filter(Boolean)), evidence:uniqueStrings(evidence) });
  }
  return { module:"phase2_terrain_intelligence", function:"terrainIntelligenceEngine", valid:true, evaluations, summary:{ evaluationCount:evaluations.length, waterEdgeCount:evaluations.filter((x)=>x.primary_terrain_context==="water_edge_use").length, coverUseCount:evaluations.filter((x)=>x.primary_terrain_context==="cover_use").length, openGroundCount:evaluations.filter((x)=>x.primary_terrain_context==="open_ground_use").length, elevatedUseCount:evaluations.filter((x)=>x.primary_terrain_context==="ridge_or_elevated_use").length, refugeContextCount:evaluations.filter((x)=>x.primary_terrain_context==="den_or_refuge_context").length } };
}

function aggregateFlightOrForage(result) {
  const evaluations = toArray(result?.evaluations);
  if (!evaluations.length) return { flightScore:0, forageScore:0, beddingScore:0, evidence:[] };
  let flightScore=0, forageScore=0, beddingScore=0;
  const evidence = [];
  for (const item of evaluations) {
    const strength = toNumber(item?.evaluation_strength_score) ?? 0.4;
    flightScore += (toNumber(item?.flight_score)??0) * Math.max(strength, 0.4);
    forageScore += (toNumber(item?.forage_score)??0) * Math.max(strength, 0.4);
    if (item?.intent_label === "forage_leaning" && item?.evidence?.some?.((x) => String(x).toLowerCase().includes("shadow"))) beddingScore += 0.08;
    evidence.push(...toArray(item?.evidence));
  }
  const n = evaluations.length;
  return { flightScore:Number(Math.min(1,flightScore/n).toFixed(4)), forageScore:Number(Math.min(1,forageScore/n).toFixed(4)), beddingScore:Number(Math.min(1,beddingScore).toFixed(4)), evidence };
}

function aggregatePredatorPrey(result) {
  const interactions = toArray(result?.interactions);
  if (!interactions.length) return { predatorPressureScore:0, huntingTravelScore:0, evidence:[] };
  let predatorPressureScore=0, huntingTravelScore=0;
  const evidence = [];
  for (const item of interactions) {
    const score = toNumber(item?.interaction_score)??0;
    predatorPressureScore += score;
    if (item?.predator_hunt_pattern_tags_present) huntingTravelScore += Math.max(score, 0.15);
    evidence.push(...toArray(item?.evidence));
  }
  const n = interactions.length;
  return { predatorPressureScore:Number(Math.min(1,predatorPressureScore/n).toFixed(4)), huntingTravelScore:Number(Math.min(1,huntingTravelScore/n).toFixed(4)), evidence };
}

function aggregateDegradation(result) {
  const comparisons = toArray(result?.comparisons);
  if (!comparisons.length) return { layeredMovementScore:0, evidence:[] };
  const separateLayerCount = comparisons.filter((x) => x?.layer_classification === "separate_time_layer").length;
  const sameBandCount = comparisons.filter((x) => x?.layer_classification === "same_freshness_band").length;
  const layeredMovementScore = comparisons.length ? Number(Math.min(1,separateLayerCount/comparisons.length).toFixed(4)) : 0;
  const evidence = [];
  if (separateLayerCount > 0) evidence.push(`separate time layers detected (${separateLayerCount})`);
  if (sameBandCount > 0) evidence.push(`same freshness bands detected (${sameBandCount})`);
  return { layeredMovementScore, evidence };
}

function aggregateDenning(result) {
  const evaluations = toArray(result?.evaluations);
  if (!evaluations.length) return { denningScore:0, beddingScore:0, evidence:[] };
  let denningScore=0, beddingScore=0;
  const evidence = [];
  for (const item of evaluations) {
    const strength = toNumber(item?.evaluation_strength_score)??0.3;
    denningScore += (toNumber(item?.denning_score)??0) * strength;
    beddingScore += (toNumber(item?.bedding_score)??0) * strength;
    evidence.push(...toArray(item?.evidence));
  }
  const n = evaluations.length;
  return { denningScore:Number(Math.min(1,denningScore/n).toFixed(4)), beddingScore:Number(Math.min(1,beddingScore/n).toFixed(4)), evidence:uniqueStrings(evidence) };
}

function aggregateTerritorialMarking(result) {
  const evaluations = toArray(result?.evaluations);
  if (!evaluations.length) return { markingPatternScore:0, territorialPatrolScore:0, evidence:[] };
  let markingPatternScore=0, territorialPatrolScore=0;
  const evidence = [];
  for (const item of evaluations) {
    const strength = toNumber(item?.evaluation_strength_score)??0.3;
    markingPatternScore += (toNumber(item?.marking_pattern_score ?? item?.scent_marking_score)??0) * strength;
    territorialPatrolScore += (toNumber(item?.territorial_patrol_score)??0) * strength;
    evidence.push(...toArray(item?.evidence));
  }
  const n = evaluations.length;
  return { markingPatternScore:Number(Math.min(1,markingPatternScore/n).toFixed(4)), territorialPatrolScore:Number(Math.min(1,territorialPatrolScore/n).toFixed(4)), evidence:uniqueStrings(evidence) };
}

function aggregateMovementPattern(result) {
  const evaluations = toArray(result?.evaluations);
  if (!evaluations.length) return { travelScore:0, territorialScore:0, escapeScore:0, waterLinkedScore:0, evidence:[] };
  let travelScore=0, territorialScore=0, escapeScore=0, waterLinkedScore=0;
  const evidence = [];
  for (const item of evaluations) {
    const scores = item?.pattern_scores || {};
    const strength = toNumber(item?.evaluation_strength_score)??0.3;
    const loopback = toNumber(scores?.loopback)??0, zigzag = toNumber(scores?.zigzag)??0, escapeLine = toNumber(scores?.escape_line)??0, waterApproach = toNumber(scores?.water_approach)??0, trailReuse = toNumber(scores?.trail_reuse)??0;
    territorialScore += ((loopback+trailReuse)/2)*strength;
    escapeScore += escapeLine*strength;
    waterLinkedScore += waterApproach*strength;
    travelScore += Math.max(escapeLine, trailReuse, zigzag*0.7)*strength;
    evidence.push(...toArray(item?.evidence));
  }
  const n = evaluations.length;
  return { travelScore:Number(Math.min(1,travelScore/n).toFixed(4)), territorialScore:Number(Math.min(1,territorialScore/n).toFixed(4)), escapeScore:Number(Math.min(1,escapeScore/n).toFixed(4)), waterLinkedScore:Number(Math.min(1,waterLinkedScore/n).toFixed(4)), evidence:uniqueStrings(evidence) };
}

function aggregateTerrain(result) {
  const evaluations = toArray(result?.evaluations);
  if (!evaluations.length) return { waterEdgeScore:0, coverScore:0, openGroundScore:0, elevatedScore:0, refugeScore:0, forageContextScore:0, corridorScore:0, evidence:[] };
  let waterEdgeScore=0, coverScore=0, openGroundScore=0, elevatedScore=0, refugeScore=0, forageContextScore=0, corridorScore=0;
  const evidence = [];
  for (const item of evaluations) {
    const strength = toNumber(item?.evaluation_strength_score)??0.3;
    const s = item?.terrain_scores||{};
    waterEdgeScore += (toNumber(s?.water_edge_use)??0)*strength;
    coverScore += (toNumber(s?.cover_use)??0)*strength;
    openGroundScore += (toNumber(s?.open_ground_use)??0)*strength;
    elevatedScore += (toNumber(s?.ridge_or_elevated_use)??0)*strength;
    refugeScore += (toNumber(s?.den_or_refuge_context)??0)*strength;
    forageContextScore += (toNumber(s?.forage_friendly_context)??0)*strength;
    corridorScore += (toNumber(s?.travel_corridor_context)??0)*strength;
    evidence.push(...toArray(item?.evidence));
  }
  const n = evaluations.length;
  return { waterEdgeScore:Number(Math.min(1,waterEdgeScore/n).toFixed(4)), coverScore:Number(Math.min(1,coverScore/n).toFixed(4)), openGroundScore:Number(Math.min(1,openGroundScore/n).toFixed(4)), elevatedScore:Number(Math.min(1,elevatedScore/n).toFixed(4)), refugeScore:Number(Math.min(1,refugeScore/n).toFixed(4)), forageContextScore:Number(Math.min(1,forageContextScore/n).toFixed(4)), corridorScore:Number(Math.min(1,corridorScore/n).toFixed(4)), evidence:uniqueStrings(evidence) };
}

function aggregateMultiAnimal(result) {
  const summary = result?.summary||{};
  const interactionCount = toNumber(summary?.interactionCount)??0;
  const detectionCount = toNumber(summary?.sameBandCount) ?? toNumber(summary?.multipleAnimalCount) ?? interactionCount;
  const herdMovementScore = detectionCount > 0 ? Number(Math.min(1,detectionCount/4).toFixed(4)) : 0;
  return { herdMovementScore, evidence: herdMovementScore > 0 ? [`multi-animal indicators present (${detectionCount})`] : [] };
}

function determinePrimaryBehavior(scores) {
  const entries = Object.entries(scores).filter(([, v]) => Number.isFinite(v) && v > 0);
  if (!entries.length) return "insufficient_data";
  entries.sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = entries[0];
  const secondScore = entries[1]?.[1]??null;
  if (!Number.isFinite(topScore) || topScore <= 0) return "insufficient_data";
  if (Number.isFinite(secondScore) && Math.abs(topScore-secondScore) < 0.08) return "mixed_behavior";
  return topKey;
}

function normalizeBehaviorScores(scores) {
  const normalized = {};
  for (const [key, value] of Object.entries(scores)) {
    const n = toNumber(value);
    normalized[key] = Number.isFinite(n) ? Number(Math.max(0,Math.min(1,n)).toFixed(4)) : 0;
  }
  return normalized;
}

function getBehaviorConfidence(primaryBehavior, behaviorScores) {
  if (!primaryBehavior || primaryBehavior === "insufficient_data" || primaryBehavior === "mixed_behavior") return 0;
  const scoreValues = Object.values(behaviorScores).filter((v) => Number.isFinite(toNumber(v)));
  const score = behaviorScores[primaryBehavior];
  if (!Number.isFinite(toNumber(score))) return 0;
  const sorted = [...scoreValues].sort((a,b)=>b-a);
  const gap = sorted.length > 1 ? sorted[0]-sorted[1] : sorted[0];
  return Number(Math.min(1, toNumber(score)*0.7 + gap*0.3).toFixed(4));
}

function collectBehaviorEvidence(args) {
  const { flightForageAgg={}, predatorAgg={}, degradationAgg={}, denningAgg={}, territorialAgg={}, movementAgg={}, terrainAgg={}, multiAgg={} } = args;
  return uniqueStrings([
    ...toArray(flightForageAgg?.evidence), ...toArray(predatorAgg?.evidence), ...toArray(degradationAgg?.evidence),
    ...toArray(denningAgg?.evidence), ...toArray(territorialAgg?.evidence), ...toArray(movementAgg?.evidence),
    ...toArray(terrainAgg?.evidence), ...toArray(multiAgg?.evidence)
  ]);
}

export function interpretBehavior({
  tracks = [],
  speciesProfiles = {},
  environment = {},
  timeContext = {},
  allowTestOnly = false
}) {
  if (!allowTestOnly) assertNoTestOnlyDataInProduction(speciesProfiles);

  const multipleAnimalsResult = detectMultipleAnimals({ tracks, speciesProfiles });
  const predatorPreyResult = evaluatePredatorPreyInteraction({ tracks, speciesProfiles });
  const degradationResult = evaluateTrackDegradationCurve({ tracks, speciesProfiles });
  const flightOrForageResult = evaluateFlightOrForage({ tracks, speciesProfiles });
  const denningResult = evaluateDenningBehavior({ tracks, speciesProfiles, environment });
  const territorialMarkingResult = evaluateTerritorialMarkingPattern({ tracks, speciesProfiles, environment });
  const movementPatternResult = movementPatternDetector({ tracks, speciesProfiles, environment });
  const terrainResult = terrainIntelligenceEngine({ tracks, speciesProfiles, environment });

  const flightForageAgg = aggregateFlightOrForage(flightOrForageResult);
  const predatorAgg = aggregatePredatorPrey(predatorPreyResult);
  const degradationAgg = aggregateDegradation(degradationResult);
  const denningAgg = aggregateDenning(denningResult);
  const territorialAgg = aggregateTerritorialMarking(territorialMarkingResult);
  const movementAgg = aggregateMovementPattern(movementPatternResult);
  const terrainAgg = aggregateTerrain(terrainResult);
  const multiAgg = aggregateMultiAnimal(multipleAnimalsResult);

  const rawBehaviorScores = {
    foraging: 0,
    travel: 0,
    flight: 0,
    bedding: 0,
    territorial_patrol: 0,
    denning: 0,
    herd_movement: 0,
    layered_activity: 0,
    marking_pattern: 0
  };

  rawBehaviorScores.foraging += flightForageAgg.forageScore;
  rawBehaviorScores.flight += Math.max(flightForageAgg.flightScore, movementAgg.escapeScore);
  rawBehaviorScores.bedding += Math.max(flightForageAgg.beddingScore, denningAgg.beddingScore);
  rawBehaviorScores.travel += mean([movementAgg.travelScore, predatorAgg.huntingTravelScore]) ?? 0;
  rawBehaviorScores.territorial_patrol += Math.max(movementAgg.territorialScore, territorialAgg.territorialPatrolScore);
  rawBehaviorScores.denning += denningAgg.denningScore;
  rawBehaviorScores.herd_movement += multiAgg.herdMovementScore;
  rawBehaviorScores.layered_activity += degradationAgg.layeredMovementScore;
  rawBehaviorScores.marking_pattern += territorialAgg.markingPatternScore;

  rawBehaviorScores.foraging += terrainAgg.forageContextScore * 0.15;
  rawBehaviorScores.travel += terrainAgg.corridorScore * 0.12;
  rawBehaviorScores.denning += terrainAgg.refugeScore * 0.12;
  rawBehaviorScores.bedding += terrainAgg.coverScore * 0.10;

  const behaviorScores = normalizeBehaviorScores(rawBehaviorScores);
  const primaryBehavior = determinePrimaryBehavior(behaviorScores);
  const confidence = getBehaviorConfidence(primaryBehavior, behaviorScores);
  const supportingEvidence = collectBehaviorEvidence({ flightForageAgg, predatorAgg, degradationAgg, denningAgg, territorialAgg, movementAgg, terrainAgg, multiAgg });

  return {
    module: "phase2_behavior_interpreter",
    function: "interpretBehavior",
    valid: true,
    primary_behavior: primaryBehavior,
    confidence,
    behavior_scores: behaviorScores,
    supporting_evidence: supportingEvidence,
    supporting_modules: {
      detectMultipleAnimals: multipleAnimalsResult,
      evaluatePredatorPreyInteraction: predatorPreyResult,
      evaluateTrackDegradationCurve: degradationResult,
      evaluateFlightOrForage: flightOrForageResult,
      evaluateDenningBehavior: denningResult,
      evaluateTerritorialMarkingPattern: territorialMarkingResult,
      movementPatternDetector: movementPatternResult,
      terrainIntelligenceEngine: terrainResult
    }
  };
}

export function sensorToBehaviorPipeline({
  sensorDetections = [],
  rawEnvironment = {},
  rawTimeContext = {},
  speciesProfiles = {},
  allowTestOnly = false
}) {
  const integrated = sensorIntegrationLayer({ sensorDetections, rawEnvironment, rawTimeContext });

  if (!integrated.valid) {
    return {
      module: "phase2_sensor_to_behavior_pipeline",
      function: "sensorToBehaviorPipeline",
      valid: false,
      reason: integrated.reason ?? "Sensor integration failed",
      sensor: integrated,
      behavior: null
    };
  }

  const behavior = interpretBehavior({
    tracks: integrated.tracks,
    speciesProfiles,
    environment: integrated.environment,
    timeContext: integrated.timeContext,
    allowTestOnly
  });

  return {
    module: "phase2_sensor_to_behavior_pipeline",
    function: "sensorToBehaviorPipeline",
    valid: true,
    sensor: integrated,
    behavior
  };
}

export function estimateTrackViability({
tracks = [],
  speciesProfiles = {},
  environment = {},
  timeContext = {}
}) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return {
      module: "phase2_track_viability_estimator",
      function: "estimateTrackViability",
      valid: false,
      reason: "No tracks provided"
    };
  }

  const validTracks = tracks.filter((track) => track?.species && speciesProfiles?.[track.species]
  );

  if (!validTracks.length) {
    return {
      module: "phase2_track_viability_estimator",
      function: "estimateTrackViability",
      valid: false,
      reason: "No valid species-mapped tracks provided"
    };
  }

  const freshnessScores = validTracks
    .map((track) => toNumber(track?.freshness_score)).filter((value) => 
Number.isFinite(value));

  const edgeScores = validTracks
    .map((track) => toNumber(track?.edge_clarity)).filter((value) => Number.isFinite(value));

  const debrisScores = validTracks
    .map((track) => toNumber(track?.debris_level)).filter((value) => Number.isFinite(value));

  const shadowScores = validTracks
    .map((track) => toNumber(track?.shadow_score)).filter((value) => Number.isFinite(value));

  const moistureScores = validTracks
    .map((track) => toNumber(track?.moisture_score)).filter((value) => Number.isFinite(value));

  const distortionScores = validTracks
    .map((track) => toNumber(track?.distortion_score)).filter((value) => Number.isFinite(value));

  const strideLengths = validTracks
    .map((track) => 
toNumber(track?.stride_length_m)).filter((value) => Number.isFinite(value));

  const paceLengths = validTracks
    .map((track) => toNumber(track?.pace_length_m)).filter((value) => Number.isFinite(value));

  const speciesKeys = uniqueStrings(validTracks.map((track) => track.species));
  const substrates = uniqueStrings(validTracks.map((track) => lower(track?.track_substrate)).filter(Boolean)
  );
  const gaitTags = uniqueStrings(validTracks.map((track) => lower(track?.gait)).filter(Boolean)
  );
  const behaviorTags = uniqueStrings(validTracks.map((track) => lower(track?.behavior)).filter(Boolean)
  );

  const meanFreshness = freshnessScores.length ? mean(freshnessScores) : null;
  const meanEdgeClarity = edgeScores.length ? mean(edgeScores) : null;
  const meanDebris = debrisScores.length ? mean(debrisScores) : null;
  const meanShadow = 
shadowScores.length ? mean(shadowScores) : null;
  const meanMoisture = moistureScores.length ? mean(moistureScores) : null;
  const meanDistortion = distortionScores.length ? mean(distortionScores) : null;
  const meanStride = strideLengths.length ? mean(strideLengths) : null;
  const meanPace = paceLengths.length ? mean(paceLengths) : null;

  const strideVariance = strideLengths.length > 1 ? variance(strideLengths) : null;
  const freshnessVariance = freshnessScores.length > 1 ? variance(freshnessScores) : null;

  let viabilityScore = 0;
  let freshnessConfidence = 0;
  let travelDistanceEstimateM = null;
  let followPriorityScore = 0;

  const evidence = [];

  if (Number.isFinite(meanFreshness)) {
    viabilityScore += meanFreshness * 0.35;
    freshnessConfidence += meanFreshness * 0.5;

    if (meanFreshness >= 0.8) {
      evidence.push("freshness score strongly supports recent track");
    } else if (meanFreshness >= 0.6) {

      evidence.push("freshness score supports usable recent track");
    } else if (meanFreshness < 0.4) {
      evidence.push("freshness score weakens follow priority");
    }
  }

  if (Number.isFinite(meanEdgeClarity)) {
    viabilityScore += 
meanEdgeClarity * 0.2;

    if (meanEdgeClarity >= 0.75) {
      evidence.push("edge clarity supports high track integrity");
    } else if (meanEdgeClarity < 0.4) {
      evidence.push("soft edge clarity weakens track certainty");
    }
  }

  if (Number.isFinite(meanDebris)) {
    const debrisPenalty = Math.max(0, 1 - meanDebris);
    viabilityScore += debrisPenalty * 0.12;

    if (meanDebris >= 0.5) {
      evidence.push("debris level suggests environmental degradation");
    }
  }

  if (Number.isFinite(meanDistortion)) {
    const distortionPenalty = Math.max(0, 1 - meanDistortion);
    viabilityScore += distortionPenalty * 0.08;

    if (meanDistortion >= 0.45) {
      evidence.push("distortion score reduces measurement trust");
    }
  }

  if (Number.isFinite(meanShadow)) {
    freshnessConfidence += meanShadow * 0.08;

    if (meanShadow >= 0.45) {
      evidence.push("shadow retention supports track readability");
    }
  }

  if 

(Number.isFinite(meanMoisture)) {
    if (meanMoisture >= 0.5) {
      evidence.push("moisture suggests substrate may preserve recent detail");
      viabilityScore += 0.04;
    }
  }

  if (Number.isFinite(freshnessVariance)) {
    if (freshnessVariance < 0.08) {

      viabilityScore += 0.06;
      freshnessConfidence += 0.06;
      evidence.push("freshness consistency supports unified track window");
    } else {
      evidence.push("freshness variance suggests layered or mixed sign");
    }
  }

  if (Number.isFinite(strideVariance) && strideVariance < 0.08) {
    viabilityScore += 0.04;
    evidence.push("stride consistency supports stable travel interpretation");
  }

  if (substrates.some((s) => ["mud", "soft_dirt", "clay", "wet_sand", "snow_powder"].includes(s))) {
    viabilityScore += 0.08;
    evidence.push("substrate type supports readable print quality");

  }

  if (substrates.some((s) => ["gravel", "rocky", "thin_soil_rock", "manmade"].includes(s))) {
    viabilityScore -= 0.05;
    evidence.push("substrate type weakens print reliability");
  }

  if (gaitTags.some((g) => ["walk", "meander", "browse", "graze", "trot"].includes(g))) {
    followPriorityScore += 0.08;

    evidence.push("gait suggests readable track progression");
  }

  if (gaitTags.some((g) => ["bound", "gallop", "burst", "run"].includes(g))) {
    followPriorityScore += 0.04;
    evidence.push("flight gait may increase urgency but reduce interpretive certainty");
  }

  if (behaviorTags.some((b) => 

["browse", "graze", "forage", "feed"].includes(b))) {
    followPriorityScore += 0.06;
    evidence.push("feeding behavior tags support useful nearby search area");
  }

  if (behaviorTags.some((b) => ["flight", "flee", "escape", "spooked"].includes(b))) {
    followPriorityScore += 0.04;
    evidence.push("escape behavior may widen search path");

  }

  if (Number.isFinite(meanStride) || Number.isFinite(meanPace)) {
    const baseTravelStep = Number.isFinite(meanPace) ? meanPace : meanStride;
    const hourFactor =
      Number.isFinite(meanFreshness) ? Math.max(0.2, 1 - meanFreshness) : 0.5;

    if (Number.isFinite(baseTravelStep)) {
      travelDistanceEstimateM = Number(Math.max(10, baseTravelStep * 400 * hourFactor).toFixed(2)
      );
      evidence.push("travel estimate derived from pace/stride and freshness");
    }
  }

  viabilityScore += followPriorityScore;
  viabilityScore = Number(Math.max(0, Math.min(1, viabilityScore)).toFixed(4));
  freshnessConfidence = Number(Math.max(0, Math.min(1, freshnessConfidence)).toFixed(4)
  );

  let viabilityStatus = "low_value";

  let followPriority = "low";

  if (viabilityScore >= 0.75) {
    viabilityStatus = "hot";
    followPriority = "high";
  } else if (viabilityScore >= 0.5) {
    viabilityStatus = "usable";
    followPriority = "medium";
  }

  const localHour = toNumber(timeContext?.local_hour);
  if 
(Number.isFinite(localHour)) {
    if (localHour >= 5 && localHour <= 9) {
      evidence.push("time context aligns with strong morning tracking window");
    }
    if (localHour >= 18 && localHour <= 22) {
      evidence.push("time context aligns with evening movement window");
    }
  }

  return {
    module: "phase2_track_viability_estimator",
    function: "estimateTrackViability",
    valid: true,
    species_detected: speciesKeys,
    substrate_types: substrates,
    mean_freshness_score: Number.isFinite(meanFreshness)
      ? Number(meanFreshness.toFixed(4))
      : null,
    freshness_confidence: freshnessConfidence,
    viability_score: viabilityScore,
    viability_status: viabilityStatus,
    follow_priority: followPriority,
    estimated_travel_distance_m: travelDistanceEstimateM,
    mean_edge_clarity: Number.isFinite(meanEdgeClarity)
      ? Number(meanEdgeClarity.toFixed(4))
      : null,
    mean_debris_level: Number.isFinite(meanDebris)
      ? Number(meanDebris.toFixed(4))
      : null,
    mean_shadow_score: Number.isFinite(meanShadow)
      ? 
Number(meanShadow.toFixed(4))
      : null,
    mean_stride_length_m: Number.isFinite(meanStride)
      ? Number(meanStride.toFixed(4))
      : null,
    mean_pace_length_m: Number.isFinite(meanPace)
      ? Number(meanPace.toFixed(4))
      : null,
    freshness_variance: Number.isFinite(freshnessVariance)
      ? Number(freshnessVariance.toFixed(4))
      : null,
    stride_variance: Number.isFinite(strideVariance)
      ? Number(strideVariance.toFixed(4))
      : null,
    evidence: 
uniqueStrings(evidence)
  };
}

export function estimateTrackDecay({

  tracks = [],
  environment = {},
  timeContext = {}
}) {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return {
      module: "phase2_track_decay_model",
      function: "estimateTrackDecay",
      valid: false,
      reason: "No tracks provided"
    };

  }

  const validTracks = tracks.filter((track) => track && typeof track === "object");

  if (!validTracks.length) {
    return {
      module: "phase2_track_decay_model",
      function: "estimateTrackDecay",
      valid: false,
      reason: "No valid track objects provided"
    };
  }

  const edgeScores = validTracks
    .map((track) => toNumber(track?.edge_clarity)).filter((value) => Number.isFinite(value));

  const debrisScores = validTracks
    .map((track) => toNumber(track?.debris_level)
).filter((value) => Number.isFinite(value));

  const shadowScores = validTracks
    .map((track) => toNumber(track?.shadow_score)).filter((value) => Number.isFinite(value));

  const moistureScores = validTracks
    .map((track) => 
toNumber(track?.moisture_score)).filter((value) => Number.isFinite(value));

  const distortionScores = validTracks
    .map((track) => toNumber(track?.distortion_score)).filter((value) => Number.isFinite(value));

  const weatherExposureScores = 

validTracks
    .map((track) => toNumber(track?.weather_exposure_score)).filter((value) => Number.isFinite(value));

  const sunExposureScores = validTracks
    .map((track) => toNumber(track?.sun_exposure_score)).filter((value) => Number.isFinite(value));

  const substrates = uniqueStrings(validTracks.map((track) => lower(track?.track_substrate)).filter(Boolean)
  );

  const meanEdge = edgeScores.length ? mean(edgeScores) : null;
  const meanDebris = debrisScores.length ? mean(debrisScores) : null;
  const meanShadow = shadowScores.length ? 
mean(shadowScores) : null;
  const meanMoisture = moistureScores.length ? mean(moistureScores) : null;
  const meanDistortion = distortionScores.length ? mean(distortionScores) : null;
  const meanWeatherExposure = weatherExposureScores.length
    ? mean(weatherExposureScores)
    : null;

  const meanSunExposure = sunExposureScores.length ? mean(sunExposureScores) : null;

  let decayScore = 0;
  let preservationScore = 0;
  const evidence = [];

  if (Number.isFinite(meanEdge)) {
    preservationScore += meanEdge * 0.28;

    if (meanEdge >= 0.75) {
      evidence.push("edge clarity supports lower decay");
    } else if (meanEdge < 0.4) {
      decayScore += 0.16;
      evidence.push("soft edges support track decay");
    }
  }

  if (Number.isFinite(meanDebris)) {
    decayScore += meanDebris * 0.18;

    if (meanDebris >= 0.5) {
      evidence.push("debris accumulation supports environmental degradation");
    }
  }

  if (Number.isFinite(meanDistortion)) {
    decayScore += meanDistortion * 0.16;

    if (meanDistortion >= 0.45) {

      evidence.push("distortion score supports track breakdown");
    }
  }

  if (Number.isFinite(meanWeatherExposure)) {
    decayScore += meanWeatherExposure * 0.18;

    if (meanWeatherExposure >= 0.5) {
      evidence.push("weather  exposure supports faster decay");
    }
  }

  if (Number.isFinite(meanSunExposure)) {
    decayScore += meanSunExposure * 0.08;

    if (meanSunExposure >= 0.5) {
      evidence.push("sun exposure supports drying and  edge loss");
    }
  }

  if (Number.isFinite(meanShadow)) {
    preservationScore += meanShadow * 0.12;

    if (meanShadow >= 0.45) {
      evidence.push("shadow retention supports slower decay");
    }

  }

  if (Number.isFinite(meanMoisture)) {
    if (meanMoisture >= 0.5) {
      preservationScore += 0.08;
      evidence.push("moisture supports temporary detail retention");
    } else if (meanMoisture < 0.2) {
      decayScore += 0.05;
      evidence.push("dry conditions may accelerate  crumbling or edge loss");
    }
  }

  if (substrates.some((s) => ["mud", "clay", "wet_sand", "snow_powder", "soft_dirt"].includes(s))) {
    preservationScore += 0.1;
    evidence.push("substrate supports stronger print preservation");
  }

  if (substrates.some((s) => 

["gravel", "rocky", "thin_soil_rock", "manmade"].includes(s))) {
    decayScore += 0.08;
    evidence.push("substrate weakens reliable detail retention");
  }

  if (substrates.some((s) => ["leaf_litter", "pine_needles", "undergrowth", "grass_tall"].includes(s))) {
    decayScore += 0.05;
    evidence.push("organic  substrate can obscure edge detail quickly");
  }

  const weatherCode = lower(environment?.weather_code);
  if (["rain", "heavy_rain", "showers", "wet"].includes(weatherCode)) {
    decayScore += 0.12;
    evidence.push("weather code suggests accelerated rain decay");

  }

  if (["snow", "fresh_snow"].includes(weatherCode)) {
    preservationScore += 0.04;
    evidence.push("weather code may support short-term snow print visibility");
  }

  const localHour = toNumber(timeContext?.local_hour);
  if 
(Number.isFinite(localHour)) {
    if (localHour >= 11 && localHour <= 17) {
      decayScore += 0.03;
      evidence.push("midday timing may support higher sun-driven decay");
    }

    if (localHour >= 4 && localHour <= 8) {
      preservationScore += 0.03;
      evidence.push("cooler morning window may preserve sign slightly better");

    }
  }

  decayScore = Number(Math.max(0, Math.min(1, decayScore)).toFixed(4));
  preservationScore = Number(Math.max(0, Math.min(1, preservationScore)).toFixed(4));

  const netDecayPressure = Number(Math.max(0, Math.min(1, decayScore - preservationScore * 0.5)).toFixed(4)
  );

  let decayStatus = "moderate_decay";
  if (netDecayPressure >= 0.55) {
    decayStatus = "fast_decay";
  } else if (netDecayPressure <= 0.2) {
    decayStatus = "slow_decay";
  }

  return {
    module: "phase2_track_decay_model",
    function: "estimateTrackDecay",
    valid: true,
    decay_score: decayScore,
    preservation_score: preservationScore,
    net_decay_pressure: netDecayPressure,
    decay_status: decayStatus,
    substrate_types: substrates,
    mean_edge_clarity: 
Number.isFinite(meanEdge) ? Number(meanEdge.toFixed(4)) : null,
    mean_debris_level: Number.isFinite(meanDebris) ? Number(meanDebris.toFixed(4)) : null,
    mean_shadow_score: Number.isFinite(meanShadow) ? Number(meanShadow.toFixed(4)) : null,
    mean_moisture_score: Number.isFinite(meanMoisture) ? Number(meanMoisture.toFixed(4)) : null,
    mean_distortion_score: Number.isFinite(meanDistortion)
      ? Number(meanDistortion.toFixed(4))
      : null,
    mean_weather_exposure_score: Number.isFinite(meanWeatherExposure)
      ? Number(meanWeatherExposure.toFixed(4))
      : null,
    mean_sun_exposure_score: Number.isFinite(meanSunExposure)
      ? Number(meanSunExposure.toFixed(4))
      : null,
    evidence: uniqueStrings(evidence)
  };
}
export function predictMovementDirection({
  tracks = [],
  environment = {},
  speciesProfiles = {}
}) {
  if (!Array.isArray(tracks) || tracks.length < 2) {
    return {
      module: "phase2_directional_prediction",
      function: "predictMovementDirection",
      valid: false,
      reason: "Not enough tracks to determine direction"
    };
  }

  const orderedTracks = tracks
    .filter((t) =>
        Number.isFinite(toNumber(t?.x)) &&
        Number.isFinite(toNumber(t?.y))
    ).sort((a, b) => {
      const aTime =
        toNumber(a?.timestamp) ??
        toNumber(a?.sensor_meta?.timestamp) ??
        0;

      const bTime =
        toNumber(b?.timestamp) 
??
        toNumber(b?.sensor_meta?.timestamp) ??
        0;

      return aTime - bTime;
    });

  if (orderedTracks.length < 2) {
    return {
      module: "phase2_directional_prediction",
      function: 
"predictMovementDirection",
      valid: false,
      reason: "Track geometry insufficient"
    };
  }

  const start = orderedTracks[0];
  const end = orderedTracks[orderedTracks.length - 1];

  const dx = toNumber(end.x) - toNumber(start.x);

  const dy = toNumber(end.y) - toNumber(start.y);

  const headingRad = Math.atan2(dy, dx);
  const headingDeg = (headingRad * 180 / Math.PI + 360) % 360;

  let movementPattern = "linear_travel";
  const evidence = [];

  const headingValues = orderedTracks

    .map((t) => toNumber(t?.heading_deg)).filter((v) => Number.isFinite(v));

  const headingVariance = headingValues.length > 1 ? variance(headingValues) : null;

  if (Number.isFinite(headingVariance)) {
    if (headingVariance > 800) {
      movementPattern = "looping_movement";

      evidence.push("heading variance indicates looping behavior");
    } else if (headingVariance > 400) {
      movementPattern = "search_pattern";
      evidence.push("heading variance indicates foraging search pattern");
    }
  }

  const substrates = uniqueStrings(orderedTracks.map((t) => lower(t?.track_substrate)).filter(Boolean)
  );

  if (environment?.near_water) {
    evidence.push("movement influenced by water proximity");
  }

  if (environment?.dense_cover) {
    evidence.push("movement  likely using cover corridor");
  }

  const predictedDistance = Math.sqrt(dx * dx + dy * dy);

  return {
    module: "phase2_directional_prediction",
    function: "predictMovementDirection",
    valid: true,
    movement_pattern: movementPattern,
    predicted_heading_deg: Number(headingDeg.toFixed(2)),
    displacement_m: Number(predictedDistance.toFixed(2)),
    substrate_context: substrates,
    evidence: uniqueStrings(evidence)
  };
}

export function analyzeTrackClusters({
  tracks = [],
  speciesProfiles = {}
}) {

  if (!Array.isArray(tracks) || tracks.length < 2) {
    return {
      module: "phase2_track_cluster_analyzer",
      function: "analyzeTrackClusters",
      valid: false,
      reason: "Not enough tracks to analyze clusters"
    };
  }

  const validTracks = 

tracks.filter((track) =>
      track &&
      track.species &&
      speciesProfiles?.[track.species] &&
      Number.isFinite(toNumber(track?.x)) &&
      Number.isFinite(toNumber(track?.y))
  );

  if (validTracks.length < 2) {

    return {
      module: "phase2_track_cluster_analyzer",
      function: "analyzeTrackClusters",
      valid: false,
      reason: "Not enough valid geometry tracks"
    };
  }

  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < validTracks.length; i++) {
    if (visited.has(i)) continue;

    const seed = validTracks[i];
    const seedCfg = getClusterConfig(seed.species);
    const epsM = seedCfg.eps_m;

    const clusterIndices = [i];
    visited.add(i);

    for (let j = i + 1; j < validTracks.length; j++) {
      if (visited.has(j)) continue;
      const candidate = validTracks[j];
      const distance = computeDistanceM(seed, candidate);
      if (Number.isFinite(distance) && distance <= epsM) {
        clusterIndices.push(j);
        visited.add(j);
      }
    }

    const clusterTracks  = clusterIndices.map((idx) => validTracks[idx]);
    const speciesSet     = uniqueStrings(clusterTracks.map((t) => t.species));
    const gaitSet        = uniqueStrings(clusterTracks.map((t) => lower(t?.gait)).filter(Boolean));
    const behaviorSet    = uniqueStrings(clusterTracks.map((t) => lower(t?.behavior)).filter(Boolean));

    const freshnessScores = clusterTracks.map((t) => toNumber(t?.freshness_score)).filter((v) => Number.isFinite(v));
    const meanFreshness   = freshnessScores.length ? mean(freshnessScores) : null;
    const freshnessVariance = freshnessScores.length > 1 ? variance(freshnessScores) : null;

    const xs = clusterTracks.map((t) => toNumber(t?.x)).filter((v) => Number.isFinite(v));
    const ys = clusterTracks.map((t) => toNumber(t?.y)).filter((v) => Number.isFinite(v));
    const centerX = xs.length ? mean(xs) : null;
    const centerY = ys.length ? mean(ys) : null;

    let spreadM = null;
    if (clusterTracks.length >= 2) {
      let maxDist = 0;
      for (let a = 0; a < clusterTracks.length; a++) {
        for (let b = a + 1; b < clusterTracks.length; b++) {
          const d = computeDistanceM(clusterTracks[a], clusterTracks[b]);
          if (Number.isFinite(d) && d > maxDist) maxDist = d;
        }
      }
      spreadM = maxDist;
    }

    const clusterType = classifyCluster({
      speciesSet,
      trackCount: clusterTracks.length,
      spreadM,
      cfg: seedCfg
    });

    const evidence = [
      clusterEvidenceLabel(clusterType, seedCfg, spreadM, clusterTracks.length)
    ];

    if (Number.isFinite(freshnessVariance) && freshnessVariance < 0.08) {
      evidence.push("freshness consistency supports same-window movement");
    } else if (Number.isFinite(freshnessVariance) && freshnessVariance >= 0.08) {
      evidence.push("freshness variance suggests layered use");
    }

    if (gaitSet.some((g) => ["walk","trot","browse","graze"].includes(g))) {
      evidence.push("gait pattern supports stable cluster interpretation");
    }

    if (behaviorSet.some((b) => ["browse","graze","feed","forage"].includes(b))) {
      evidence.push("behavior tags support feeding cluster");
    }

    clusters.push({
      cluster_id:          `cluster_${clusters.length + 1}`,
      cluster_type:        clusterType,
      track_count:         clusterTracks.length,
      species_present:     speciesSet,
      social_type:         seedCfg.social_type,
      track_ids:           clusterTracks.map((t) => t.id).filter(Boolean),
      center_x:            Number.isFinite(centerX) ? Number(centerX.toFixed(2)) : null,
      center_y:            Number.isFinite(centerY) ? Number(centerY.toFixed(2)) : null,
      spread_m:            Number.isFinite(spreadM) ? Number(spreadM.toFixed(2)) : null,
      eps_m_used:          epsM,
      min_pts_used:        seedCfg.min_pts,
      typical_group_radius_m: seedCfg.typical_group_radius_m,
      mean_freshness_score:Number.isFinite(meanFreshness) ? Number(meanFreshness.toFixed(4)) : null,
      freshness_variance:  Number.isFinite(freshnessVariance) ? Number(freshnessVariance.toFixed(4)) : null,
      gaits:               gaitSet,
      behaviors:           behaviorSet,
      evidence:            uniqueStrings(evidence)
    });
  }

  const multiSpeciesOverlapCount = clusters.filter((c) => c.cluster_type === "multi_species_overlap").length;
  const herdClusterCount         = clusters.filter((c) => c.cluster_type === "herd_cluster").length;
  const packClusterCount         = clusters.filter((c) => c.cluster_type === "pack_cluster").length;
  const loopbackClusterCount     = clusters.filter((c) => c.cluster_type === "loopback_cluster").length;
  const repeatUseClusterCount    = clusters.filter((c) => c.cluster_type === "repeat_use_cluster").length;
  const groupMovementClusterCount = herdClusterCount + packClusterCount;

  return {
    module: "phase2_track_cluster_analyzer",
    function: "analyzeTrackClusters",
    valid: true,
    clusters,
    summary: {
      clusterCount: clusters.length,
      multiSpeciesOverlapCount,
      herdClusterCount,
      packClusterCount,
      loopbackClusterCount,
      repeatUseClusterCount,
      groupMovementClusterCount
    }
  };
}

export function consolidateTrackingConfidence({
  behavior = {},
  viability = {},
  decay = {},
  movement = {},
  clusters = {}
}) {
  const scores = [];
  const evidence = [];

  if (Number.isFinite(toNumber(behavior?.confidence))) {
    scores.push(toNumber(behavior.confidence));
    evidence.push("behavior confidence included");
  }

  if (Number.isFinite(toNumber(viability?.viability_score))) {
    scores.push(toNumber(viability.viability_score));
    evidence.push("viability score included");

  }

  if (Number.isFinite(toNumber(viability?.freshness_confidence))) {
    scores.push(toNumber(viability.freshness_confidence) * 0.85);
    evidence.push("freshness confidence included");
  }

  if (Number.isFinite(toNumber(decay?.net_decay_pressure))) {
    const decayConfidence = Math.max(0, 1 - toNumber(decay.net_decay_pressure));
    scores.push(Number(decayConfidence.toFixed(4)));
    evidence.push("inverse decay pressure included");
  } else if (Number.isFinite(toNumber(decay?.decay_score))) {
    const decayConfidence = Math.max(0, 1 - toNumber(decay.decay_score));
    scores.push(Number(decayConfidence.toFixed(4)));
    evidence.push("inverse decay score included");
  }

  let movementConfidence = null;

  if (Number.isFinite(toNumber(movement?.displacement_m)) &&
    Number.isFinite(toNumber(movement?.predicted_heading_deg))
  ) {
    movementConfidence = 0.7;

    if (movement?.movement_pattern === "linear_travel") {
      movementConfidence = 0.8;
    } else if (movement?.movement_pattern === "search_pattern") {
      movementConfidence = 0.65;
    } else if (movement?.movement_pattern === "looping_movement") {
      movementConfidence = 0.55;

    }

    scores.push(movementConfidence);
    evidence.push("movement confidence inferred from displacement and heading");
  }

  let clusterInfluence = 0;
  const clusterCount       = toNumber(clusters?.summary?.clusterCount)             ?? 0;
  const herdClusters       = toNumber(clusters?.summary?.herdClusterCount)         ?? 0;
  const packClusters       = toNumber(clusters?.summary?.packClusterCount)         ?? 0;
  const loopbackClusters   = toNumber(clusters?.summary?.loopbackClusterCount)     ?? 0;
  const multiSpeciesOverlaps = toNumber(clusters?.summary?.multiSpeciesOverlapCount) ?? 0;

  if (clusterCount >= 2) {
    clusterInfluence += 0.05;
    evidence.push("multiple clusters slightly increase tracking confidence");
  }

  if (herdClusters >= 1) {
    clusterInfluence += 0.08;
    evidence.push("herd cluster confirmed - group presence increases confidence");
  }

  if (packClusters >= 1) {
    clusterInfluence += 0.07;
    evidence.push("pack cluster confirmed - coordinated group increases confidence");
  }

  if (loopbackClusters >= 1) {
    clusterInfluence += 0.04;
    evidence.push("loopback cluster - single animal return pattern detected");
  }

  if (multiSpeciesOverlaps >= 1) {
    clusterInfluence -= 0.04;
    evidence.push("multi-species overlap slightly reduces certainty");
  }

  const usableScores = scores.filter((v) => Number.isFinite(toNumber(v)));
  const baseScore = usableScores.length
    ? usableScores.reduce((a, b) => a + b, 0) / usableScores.length
    : 0;

  const finalConfidence = Math.min(1,
    Math.max(0, Number((baseScore + clusterInfluence).toFixed(4)))
  );

  let trackingRecommendation = "insufficient_data";

  if (finalConfidence >= 0.75) {
    trackingRecommendation = "high_probability_follow";
  } else if (finalConfidence >= 0.5) {
    trackingRecommendation = 
"moderate_probability_follow";
  } else if (finalConfidence >= 0.3) {
    trackingRecommendation = "low_probability_follow";
  } else {
    trackingRecommendation = "do_not_follow";
  }

  return {
    module: "phase2_confidence_consolidation",
    function: 
"consolidateTrackingConfidence",
    valid: true,
    final_confidence: finalConfidence,
    recommendation: trackingRecommendation,
    cluster_influence: Number(clusterInfluence.toFixed(4)),
    contributing_scores: usableScores.map((v) => Number(toNumber(v).toFixed(4))),
    evidence: 
uniqueStrings(evidence)
  };
}

export function buildSnacDecisionOutput(fullAnalysis = {}) {

  if (!fullAnalysis?.valid) {
    return {
      valid: false,
      reason: "analysis_invalid"
    };
  }

  const confidenceResult = consolidateTrackingConfidence({
    behavior: fullAnalysis.behavior,
    viability: fullAnalysis.viability,
    decay: fullAnalysis.decay,
    movement: fullAnalysis.movement,
    clusters: fullAnalysis.clusters
  });

  return {
    valid: true,
    species_detected:            fullAnalysis?.viability?.species_detected ?? [],
    movement_pattern:            fullAnalysis?.movement?.movement_pattern ?? null,
    predicted_heading_deg:       fullAnalysis?.movement?.predicted_heading_deg ?? null,
    estimated_travel_distance_m: fullAnalysis?.viability?.estimated_travel_distance_m ?? null,
    track_decay_status:          fullAnalysis?.decay?.decay_status ?? null,
    behavior_type:               fullAnalysis?.behavior?.primary_behavior ?? null,
    cluster_count:               fullAnalysis?.clusters?.summary?.clusterCount              ?? 0,
    herd_cluster_count:          fullAnalysis?.clusters?.summary?.herdClusterCount          ?? 0,
    pack_cluster_count:          fullAnalysis?.clusters?.summary?.packClusterCount          ?? 0,
    loopback_cluster_count:      fullAnalysis?.clusters?.summary?.loopbackClusterCount      ?? 0,
    tracking_confidence:         confidenceResult.final_confidence,
    recommendation:              confidenceResult.recommendation,
    evidence: uniqueStrings([
      ...(fullAnalysis?.behavior?.supporting_evidence ?? []),
      ...(fullAnalysis?.viability?.evidence ?? []),
      ...(fullAnalysis?.decay?.evidence ?? []),
      ...(fullAnalysis?.movement?.evidence ?? [])
    ])
  };
}

export function validateSnacInputs({
  sensorDetections = [],
  speciesProfiles = {},
  rawEnvironment = {},
  rawTimeContext = {}
}) {

  const issues = [];

  if (!Array.isArray(sensorDetections)) {
    issues.push("sensorDetections_not_array");
  }

  if (!speciesProfiles || typeof speciesProfiles !== "object") {
    issues.push("speciesProfiles_missing_or_invalid");
  }

  if (!rawEnvironment || typeof rawEnvironment !== "object") {
    issues.push("environment_missing_or_invalid");

  }

  if (!rawTimeContext || typeof rawTimeContext !== "object") {
    issues.push("timeContext_missing_or_invalid");
  }

  const valid = issues.length === 0;

  return {
    module: "phase2_input_validation",
    function: "validateSnacInputs",
    valid,
    issues
  };
}
export function runSnacEngineSafe({
  sensorDetections = [],
  speciesProfiles = {},
  rawEnvironment = {},
  rawTimeContext = {}
}) {

  const validation = validateSnacInputs({
    sensorDetections,
    speciesProfiles,
    rawEnvironment,
    rawTimeContext
  });

  if (!validation.valid) {
    return {
      valid: false,
      module: "phase2_engine_entry",
      reason: 
"input_validation_failed",
      issues: validation.issues
    };
  }

  const fullAnalysis = runSnacFullAnalysis({
    sensorDetections,
    rawEnvironment,
    rawTimeContext,
    speciesProfiles
  });

  if (!fullAnalysis?.valid) {
    return {

      valid: false,
      module: "phase2_engine_entry",
      reason: "analysis_failed"
    };
  }

  const decision = buildSnacDecisionOutput(fullAnalysis);

  return {
    valid: true,
    module: "phase2_engine_entry",
    analysis: fullAnalysis,
    decision
  };
}

export function runSnacFullAnalysis({
  sensorDetections = [],
  rawEnvironment = {},
  rawTimeContext = {},
  speciesProfiles = {},
  allowTestOnly = false
}) {
  const pipelineResult = 
sensorToBehaviorPipeline({
    sensorDetections,
    rawEnvironment,
    rawTimeContext,
    speciesProfiles,
    allowTestOnly
  });

  if (!pipelineResult?.valid) {
    return {
      module: "phase2_full_analysis",
      function: "runSnacFullAnalysis",
      valid: false,
      reason: pipelineResult?.reason ?? "Behavior pipeline failed",
      sensor: pipelineResult?.sensor ?? null,
      behavior: pipelineResult?.behavior ?? null,
      viability: null,
      decay: null,
      movement: null,
      clusters: null
    };
  }

  const tracks = pipelineResult.sensor?.tracks ?? [];
  const environment = pipelineResult.sensor?.environment ?? {};
  const timeContext = pipelineResult.sensor?.timeContext ?? {};

  const viabilityResult = estimateTrackViability({
    tracks,
    speciesProfiles,
    environment,
    timeContext
  });

  const decayResult = estimateTrackDecay({
    tracks,
    environment,
    timeContext
  });

  const movementResult = predictMovementDirection({
    tracks,
    environment,
    speciesProfiles
  });

  const clusterResult = analyzeTrackClusters({
    tracks,
    speciesProfiles
  });

  return {
    module: "phase2_full_analysis",
    function: "runSnacFullAnalysis",
    valid: true,
    sensor: 
pipelineResult.sensor,
    behavior: pipelineResult.behavior,
    viability: viabilityResult,
    decay: decayResult,
    movement: movementResult,
    clusters: clusterResult
  };
}

export function buildSnacFieldSummary(fullAnalysisResult = {}) {
  if (!fullAnalysisResult?.valid) {
    return {
      valid: false,
      summary_status: "analysis_failed",
      reason: fullAnalysisResult?.reason ?? "Unknown analysis failure"
    };
  }

  const behavior = 

fullAnalysisResult?.behavior ?? {};
  const viability = fullAnalysisResult?.viability ?? {};
  const decay = fullAnalysisResult?.decay ?? {};
  const movement = fullAnalysisResult?.movement ?? {};
  const clusters = fullAnalysisResult?.clusters ?? {};

  return {

    valid: true,
    summary_status: "ready",
    species_detected: viability?.species_detected ?? [],
    primary_behavior: behavior?.primary_behavior ?? null,
    behavior_confidence: behavior?.confidence ?? null,
    viability_status: viability?.viability_status ?? null,
    follow_priority: viability?.follow_priority ?? null,
    decay_status: decay?.decay_status ?? null,
    predicted_heading_deg: movement?.predicted_heading_deg ?? null,
    movement_pattern: movement?.movement_pattern ?? null,
    displacement_m: movement?.displacement_m ?? null,
    estimated_travel_distance_m: viability?.estimated_travel_distance_m ?? null,
    cluster_count:                clusters?.summary?.clusterCount              ?? 0,
    herd_cluster_count:           clusters?.summary?.herdClusterCount          ?? 0,
    pack_cluster_count:           clusters?.summary?.packClusterCount          ?? 0,
    loopback_cluster_count:       clusters?.summary?.loopbackClusterCount      ?? 0,
    repeat_use_cluster_count:     clusters?.summary?.repeatUseClusterCount     ?? 0,
    group_movement_cluster_count: clusters?.summary?.groupMovementClusterCount ?? 0,
    multi_species_overlap_count:  clusters?.summary?.multiSpeciesOverlapCount  ?? 0,
    evidence: uniqueStrings([
      ...toArray(behavior?.supporting_evidence),
      ...toArray(viability?.evidence),
      ...toArray(decay?.evidence),
      ...toArray(movement?.evidence),
      ...toArray(Array.isArray(clusters?.clusters)
          ? clusters.clusters.flatMap((c) => c.evidence || [])
          : []
      )
    ])
  };
}

const estimateTrackFreshness = (metrics, env) => {
  const { edgeSharpness, depth, debrisLevel } = metrics;
  const { weather } = env;
  let score = 0;
  if (edgeSharpness === "crisp") score += 0.4;
  if (depth === "medium") score += 0.2;
  if (debrisLevel === "clean") score += 0.2;
  if (weather === "clear") score += 0.2;
  if (score > 0.66) return "<6h (Hot)";
  if (score > 0.33) return "6-24h (Viable)";
  return ">24h (Stale)";
};

const analyzeGaitPattern = (strideSet) => {
  const strides = strideSet.map((s) => s.strideLength);
  const avg = strides.reduce((a, b) => a + b, 0) / strides.length;
  if (avg < 60) return "Walk";
  if (avg < 120) return "Trot";
  return "Bound";
};

const predictSpeciesFromTrack = (shape, size, gait, speciesProfiles) => {
  if (!Array.isArray(speciesProfiles)) return [];
  const candidates = speciesProfiles.filter((sp) => {
    const s = sp.track_shape.toLowerCase();
    const matchesShape = s.includes(shape.toLowerCase());
    const front = sp.track_size_cm?.front;
    const cm = typeof front === "string" ? parseFloat(front.split("-")[0]) : front;
    const matchesSize = !isNaN(cm) && Math.abs(cm - size) < 2;
    return matchesShape && matchesSize;
  });
  return candidates.map((c) => ({ common_name: c.common_name, confidence: 0.9 })).slice(0, 3);
};

const determineRutPhase = (species) => {
  const today = new Date();
  const mmdd = String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  const rutWindows = {
    "Mule Deer": { pre_rut: ["09-15","10-15"], rut: ["10-16","11-20"], post_rut: ["11-21","12-10"] },
    "White-tailed Deer": { pre_rut: ["10-01","11-01"], rut: ["11-02","11-30"], post_rut: ["12-01","12-20"] },
    "Black-tailed Deer": { pre_rut: ["10-01","10-25"], rut: ["10-26","11-25"], post_rut: ["11-26","12-15"] },
    "Elk (Wapiti)": { pre_rut: ["08-15","09-14"], rut: ["09-15","10-15"], post_rut: ["10-16","11-15"] }
  };
  const phaseWindow = rutWindows[species];
  if (!phaseWindow) return "Unknown";
  for (const phase in phaseWindow) {
    const [start, end] = phaseWindow[phase];
    if (mmdd >= start && mmdd <= end) return phase.replace("_", " ").toUpperCase();
  }
  return "Off-season";
};

function adjustFreshnessWithTerrain(baseFreshness, terrain) {
  let modifier = 0;
  if (terrain.exposure === "shaded" && terrain.substrate?.includes("dirt")) modifier -= 0.1;
  if (terrain.exposure === "open" && terrain.substrate?.includes("sand")) modifier += 0.15;
  if (terrain.recent_rain_mm > 5) modifier -= 0.2;
  if (terrain.time_of_day === "afternoon" && terrain.canopy_cover === "open") modifier += 0.1;
  return Math.max(0, Math.min(1, baseFreshness + modifier));
}

function detectLoopBehavior(trackSequence) {
  let turns = 0;
  for (let i = 2; i < trackSequence.length; i++) {
    const prev = trackSequence[i - 1].direction;
    const curr = trackSequence[i].direction;
    if (prev && curr && Math.abs(curr - prev) > 135) turns++;
  }
  return turns >= 2;
}

function calculateRangeWithLoop(gait_estimate_meters, terrain, loopDetected) {
  let loop_uncertainty_factor = 1;
  if (terrain.terrain_type === "ridge" || terrain.terrain_type === "trail") loop_uncertainty_factor += 0.25;
  if (terrain.slope_degrees > 15) loop_uncertainty_factor += 0.1;
  if (gait_estimate_meters < 400) loop_uncertainty_factor += 0.15;
  if (loopDetected) loop_uncertainty_factor += 0.5;
  return {
    range_min_meters: Math.round(gait_estimate_meters * 0.8),
    range_max_meters: Math.round(gait_estimate_meters * loop_uncertainty_factor),
    note: loopDetected ? "Loopback behavior detected - expanded search radius." : "Linear travel pattern"
  };
}

function evaluateWaterBehavior(speciesProfile, terrain) {
  const waterString = speciesProfile.water_needs?.toLowerCase() ?? "";
  const dist = terrain.distance_to_water_meters;
  if ((waterString.includes("daily") || waterString.includes("every day")) && dist < 300) return "Subject likely approaching water";
  if ((waterString.includes("1-2 days") || waterString.includes("moderate")) && dist < 500) return "Water proximity increases likelihood of presence";
  if ((waterString.includes("minimal") || waterString.includes("moisture from food")) && dist < 150) return "Possibly incidental water contact";
  return "No water-driven behavior detected";
}

function evaluateShelterBehavior(speciesProfile, terrain) {
  const activity = speciesProfile.activity?.toLowerCase() ?? "";
  const time = terrain.time_of_day;
  const cover = terrain.canopy_cover;
  const type = terrain.terrain_type;
  const weather = terrain.weather_manual || terrain.weather_auto || "clear";
  const denseCover = cover === "dense" || type === "valley" || type === "forest";
  if ((activity.includes("nocturnal") || activity.includes("crepuscular")) && (time === "morning" || time === "day") && denseCover) return "Shelter likely sought during daylight in dense terrain";
  if (activity.includes("diurnal") && (time === "evening" || time === "night") && denseCover) return "Subject likely seeking rest or bedding in shaded terrain";
  if ((weather.includes("rain") || weather.includes("storm") || weather.includes("snow")) && denseCover) return "Weather-driven shelter behavior likely - dense terrain favored";
  if (weather.includes("rain") || weather.includes("storm") || weather.includes("snow")) return "Shelter behavior possible due to weather - terrain lacks ideal cover";
  return "No strong shelter signal - further environmental input required";
}

function evaluateBrowsingBehavior(speciesProfile, terrain, gaitData) {
  let dietScore=0, terrainScore=0, gaitScore=0;
  const diet = speciesProfile.diet?.toLowerCase() ?? "";
  const substrate = terrain.substrate || "";
  const type = terrain.terrain_type || "";
  const strideLength = gaitData.strideLength || 0;
  if (diet.includes("browse")) dietScore += 0.4;
  if (diet.includes("forbs") || diet.includes("shrubs")) dietScore += 0.3;
  if (substrate.includes("leaf") || substrate.includes("undergrowth") || substrate.includes("moss")) terrainScore += 0.3;
  if (type === "valley" || type === "forest") terrainScore += 0.2;
  if (strideLength > 0 && strideLength < 60) gaitScore += 0.3;
  else if (strideLength >= 60 && strideLength <= 90) gaitScore += 0.15;
  const browsingScore = Math.min(1, dietScore + terrainScore + gaitScore);
  const pct = Math.round(browsingScore * 100);
  let out = `Browsing confidence: ${pct}% - `;
  if (pct >= 70) out += "Strong indicators of active feeding";
  else if (pct >= 30) out += "Moderate signs - browsing possible";
  else out += "Minimal browsing behavior indicated";
  return out;
}

function interpretTrackSize(measuredSize_cm, rangeString, footType = "front") {
  const [minStr, maxStr] = rangeString.replace("~","").split("-");
  const min = parseFloat(minStr), max = parseFloat(maxStr);
  if (isNaN(min) || isNaN(max)) return { size_class:"unknown", confidence:50, detail:"Range parse error." };
  const range = max - min, mid = min + range / 2;
  if (measuredSize_cm < min) return { size_class:"below species range", confidence:30, detail:`Measured ${footType} track smaller than documented minimum.` };
  if (measuredSize_cm < min + range * 0.25) return { size_class:"juvenile or small female", confidence:60, detail:`Measured ${footType} track in lower 25% of range.` };
  if (measuredSize_cm < mid) return { size_class:"subadult or female", confidence:70, detail:`Measured ${footType} track below midpoint of range.` };
  if (measuredSize_cm <= max) return { size_class:"adult male or large female", confidence:80, detail:`Measured ${footType} track in upper range.` };
  return { size_class:"above species range", confidence:40, detail:`Measured ${footType} track exceeds documented range.` };
}

function classifyAnimalTrackSizes(measured, speciesProfile) {
  return {
    front_track: interpretTrackSize(measured.front, speciesProfile.track_size_cm?.front, "front"),
    hind_track: interpretTrackSize(measured.hind, speciesProfile.track_size_cm?.hind, "hind")
  };
}

export {
  estimateTrackFreshness,
  analyzeGaitPattern,
  predictSpeciesFromTrack,
  determineRutPhase,
  adjustFreshnessWithTerrain,
  detectLoopBehavior,
  calculateRangeWithLoop,
  evaluateWaterBehavior,
  evaluateShelterBehavior,
  evaluateBrowsingBehavior,
  interpretTrackSize,
  classifyAnimalTrackSizes,
  toArray,
  toNumber,
  lower,
  uniqueStrings,
  mean,
  variance,
  clamp01,
  computeDistanceM,
  angleDifferenceDeg,
  getSpeciesEntry,
  normalizeTrackDetection,
  normalizeEnvironment,
  normalizeTimeContext
};