import { SUBSTRATE_KEYS, WEATHER_KEYS, TEMP_KEYS, SUN_KEYS } from './Snac_substrate_decay.js';
 
export const SOURCE = {
  MEASURED: 'measured',
  INFERRED: 'inferred',
  USER:     'user',
  MISSING:  'missing',
  DEFAULT:  'default',
};
 
export const CONFIDENCE = {
  HIGH:   'high',
  MEDIUM: 'medium',
  LOW:    'low',
  NONE:   'none',
};
 
// Phase 4.2 terrain anchor controlled vocabularies - user-observed ground truth
export const WATER_TYPE_KEYS      = ['permanent', 'ephemeral', 'none'];
export const WATER_CONDITION_KEYS = ['clear', 'churned'];
export const TERRAIN_CHANNEL_KEYS = ['ridge', 'drainage', 'flat'];
 
function clamp01(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : null;
}
 
function lower(v) {
  return typeof v === 'string' && v.trim() ? v.trim().toLowerCase() : null;
}
 
function toNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
 
function field(value, source, confidence, fallback = null) {
  const present = value !== null && value !== undefined && value !== '';
  return {
    value:      present ? value : fallback,
    source:     present ? source : SOURCE.MISSING,
    confidence: present ? confidence : CONFIDENCE.NONE,
    missing:    !present,
  };
}
 
function inferSunFromEnvironment({ zoneTag, lightPhase, localHour } = {}) {
  const z = lower(zoneTag);
  const l = lower(lightPhase);
  const h = toNum(localHour);
 
  if (z === 'pine_forest' || z === 'forest_floor' || z === 'shrub_cover') return 'full_shade';
  if (z === 'open_field' || z === 'rocky') return 'full_sun';
  if (l === 'dawn' || l === 'dusk' || l === 'night') return 'full_shade';
  if (Number.isFinite(h)) {
    if (h >= 10 && h <= 15) return 'full_sun';
    if (h >= 7  && h <= 18) return 'partial_shade';
    return 'full_shade';
  }
  return null;
}
 
function inferTempFromWeather({ weatherCode, temp } = {}) {
  if (temp) return temp;
  const w = lower(weatherCode);
  if (w === 'frost') return 'freezing';
  if (w === 'snow')  return 'cold';
  return null;
}
 
function inferIsWet({ substrate, weatherCode, nearWater } = {}) {
  const s = lower(substrate);
  const w = lower(weatherCode);
  if (s === 'riparian_mud' || s === 'wetland_edge') return true;
  if (w === 'heavy_rain' || w === 'light_rain' || w === 'fog') return true;
  if (nearWater === true) return true;
  return null;
}
 
export function buildSensorInput({
  species          = null,
  speciesSource    = SOURCE.USER,
  speciesConf      = null,
  freshness        = null,
  freshnessSource  = SOURCE.USER,
  edgeClarity      = null,
  stride           = null,
  gait             = null,
  behavior         = null,
  substrate        = null,
  substrateSource  = SOURCE.USER,
  weather          = null,
  temperature      = null,
  sun              = null,
  isWet            = null,
  nearWater        = null,
  onRidge          = null,
  denseCover       = null,
  waterType        = null,
  waterCondition   = null,
  terrainChannel   = null,
  zoneTag          = null,
  lightPhase       = null,
  localHour        = null,
  photoUri         = null,
  signTags         = [],
  fieldNotes       = null,
  sessionId        = null,
  gps              = null,
  timestamp        = null,
} = {}) {
 
  const speciesVal   = lower(species);
  const freshnessNum = clamp01(freshness);
  const edgeNum      = clamp01(edgeClarity);
  const strideNum    = toNum(stride);
  const gaitVal      = lower(gait);
  const behaviorVal  = lower(behavior);
  const hourNum      = toNum(localHour);
  const lightVal     = lower(lightPhase);
  const zoneVal      = lower(zoneTag);
 
  const substrateVal = SUBSTRATE_KEYS.includes(lower(substrate)) ? lower(substrate) : null;
  const weatherVal   = WEATHER_KEYS.includes(lower(weather))     ? lower(weather)   : null;
  const sunVal       = SUN_KEYS.includes(lower(sun))             ? lower(sun)       : null;
 
  // Phase 4.2 terrain anchor fields - validated against controlled vocab
  const waterTypeVal   = WATER_TYPE_KEYS.includes(lower(waterType))           ? lower(waterType)      : null;
  const waterCondVal   = WATER_CONDITION_KEYS.includes(lower(waterCondition)) ? lower(waterCondition) : null;
  const channelVal     = TERRAIN_CHANNEL_KEYS.includes(lower(terrainChannel)) ? lower(terrainChannel) : null;
 
  // Infer missing values where possible
  const inferredTemp   = inferTempFromWeather({ weatherCode: weatherVal, temp: lower(temperature) });
  const tempVal        = TEMP_KEYS.includes(inferredTemp) ? inferredTemp : null;
  const tempSource     = inferredTemp && !lower(temperature) ? SOURCE.INFERRED : SOURCE.USER;
 
  const inferredSun    = sunVal ?? inferSunFromEnvironment({ zoneTag: zoneVal, lightPhase: lightVal, localHour: hourNum });
  const sunClean       = SUN_KEYS.includes(inferredSun) ? inferredSun : null;
  const sunSource      = sunClean && !sunVal ? SOURCE.INFERRED : SOURCE.USER;
 
  // Phase 4.2: nearWater can be inferred from an explicit water_type
  const nearWaterResolved = nearWater ?? (waterTypeVal && waterTypeVal !== 'none' ? true : null);
 
  const inferredWet    = isWet ?? inferIsWet({ substrate: substrateVal, weatherCode: weatherVal, nearWater: nearWaterResolved });
  const wetSource      = inferredWet !== null && isWet === null ? SOURCE.INFERRED : SOURCE.USER;
 
  // onRidge can be inferred from terrain_channel
  const onRidgeResolved = onRidge ?? (channelVal === 'ridge' ? true : null);
 
  // Decay correction capability
  const canRunDecay    = Boolean(substrateVal && freshnessNum !== null);
  const canRunTime     = Boolean(hourNum !== null);
  const canRunVision   = Boolean(photoUri);
  const canIDSpecies   = Boolean(speciesVal);
  const canRunTerrain  = Boolean((waterTypeVal && waterTypeVal !== 'none') || (channelVal && channelVal !== 'flat'));
 
  // Build missing/warning lists
  const missingCritical = [];
  const missingOptional = [];
  const inferred        = [];
  const warnings        = [];
 
  if (!speciesVal)     missingCritical.push('species — engine runs on default behavioral weights');
  if (freshnessNum === null) missingCritical.push('freshness — decay and viability calculations degraded');
  if (!substrateVal) {
    missingCritical.push('substrate — track age correction cannot run');
    if (lower(substrate)) warnings.push(`Unknown substrate '${lower(substrate)}' — not in library`);
  }
 
  if (!weatherVal)   missingOptional.push('weather');
  if (!tempVal)      missingOptional.push('temperature');
  if (!sunClean)     missingOptional.push('sun_exposure');
  if (!hourNum)      missingOptional.push('local_hour — time-of-day priors cannot fire');
  if (!gaitVal)      missingOptional.push('gait');
  if (!behaviorVal)  missingOptional.push('behavior');
  if (!signTags.length) missingOptional.push('sign_tags');
  if (!photoUri)     missingOptional.push('photo — vision layer cannot run');
  if (!waterTypeVal) missingOptional.push('water_type — terrain water pull cannot run');
  if (!channelVal)   missingOptional.push('terrain_channel — movement channeling cannot run');
 
  // Validation warnings for terrain inputs
  if (lower(waterType) && !waterTypeVal) warnings.push(`Unknown water_type '${lower(waterType)}' — expected permanent/ephemeral/none`);
  if (lower(waterCondition) && !waterCondVal) warnings.push(`Unknown water_condition '${lower(waterCondition)}' — expected clear/churned`);
  if (lower(terrainChannel) && !channelVal) warnings.push(`Unknown terrain_channel '${lower(terrainChannel)}' — expected ridge/drainage/flat`);
  if (waterCondVal && waterTypeVal !== 'ephemeral') warnings.push('water_condition only applies to ephemeral water - ignored for permanent/none');
 
  if (tempSource   === SOURCE.INFERRED) inferred.push(`temperature inferred as '${tempVal}' from weather '${weatherVal}'`);
  if (sunSource    === SOURCE.INFERRED) inferred.push(`sun_exposure inferred as '${sunClean}' from zone/light/hour context`);
  if (wetSource    === SOURCE.INFERRED) inferred.push(`is_wet inferred as ${inferredWet} from substrate/weather/nearWater`);
  if (nearWater === null && nearWaterResolved === true) inferred.push('near_water inferred true from water_type');
  if (onRidge === null && onRidgeResolved === true) inferred.push('on_ridge inferred true from terrain_channel ridge');
 
  const completeness = Number(Math.max(0,
    1 - (missingCritical.length * 0.2) - (missingOptional.length * 0.04)
  ).toFixed(2));
 
  return {
    schema_version: '3.2',
    session_id:     sessionId ?? null,
    timestamp:      timestamp ?? new Date().toISOString(),
    gps:            gps ?? null,
 
    species:      field(speciesVal,    speciesSource,  speciesConf ? CONFIDENCE.HIGH : CONFIDENCE.MEDIUM),
    freshness:    field(freshnessNum,  freshnessSource, freshnessSource === SOURCE.USER ? CONFIDENCE.MEDIUM : CONFIDENCE.HIGH),
    substrate:    field(substrateVal,  substrateSource, substrateVal   ? CONFIDENCE.HIGH   : CONFIDENCE.NONE),
    weather:      field(weatherVal,    SOURCE.USER,     weatherVal     ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    temperature:  field(tempVal,       tempSource,      tempVal        ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    sun:          field(sunClean,      sunSource,       sunClean       ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    is_wet:       field(inferredWet,   wetSource,       inferredWet !== null ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    edge_clarity: field(edgeNum,       SOURCE.USER,     edgeNum !== null     ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    stride:       field(strideNum,     SOURCE.USER,     strideNum !== null   ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    gait:         field(gaitVal,       SOURCE.USER,     gaitVal        ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    behavior:     field(behaviorVal,   SOURCE.USER,     behaviorVal    ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    near_water:   field(nearWaterResolved, SOURCE.USER, nearWaterResolved !== null ? CONFIDENCE.HIGH : CONFIDENCE.NONE),
    on_ridge:     field(onRidgeResolved,   SOURCE.USER, onRidgeResolved !== null   ? CONFIDENCE.HIGH : CONFIDENCE.NONE),
    dense_cover:  field(denseCover,    SOURCE.USER,     denseCover !== null  ? CONFIDENCE.HIGH   : CONFIDENCE.NONE),
    water_type:      field(waterTypeVal, SOURCE.USER,   waterTypeVal   ? CONFIDENCE.HIGH   : CONFIDENCE.NONE),
    water_condition: field(waterCondVal, SOURCE.USER,   waterCondVal   ? CONFIDENCE.HIGH   : CONFIDENCE.NONE),
    terrain_channel: field(channelVal,   SOURCE.USER,   channelVal     ? CONFIDENCE.HIGH   : CONFIDENCE.NONE),
    zone_tag:     field(zoneVal,       SOURCE.USER,     zoneVal        ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    light_phase:  field(lightVal,      SOURCE.USER,     lightVal       ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE),
    local_hour:   field(hourNum,       SOURCE.USER,     hourNum !== null     ? CONFIDENCE.HIGH   : CONFIDENCE.NONE),
    photo_uri:    field(photoUri,      SOURCE.USER,     photoUri       ? CONFIDENCE.HIGH   : CONFIDENCE.NONE),
    sign_tags:    field(signTags.length ? signTags : null, SOURCE.USER, signTags.length ? CONFIDENCE.HIGH : CONFIDENCE.NONE),
    field_notes:  field(fieldNotes,    SOURCE.USER,     fieldNotes     ? CONFIDENCE.LOW    : CONFIDENCE.NONE),
 
    meta: {
      missing_critical:        missingCritical,
      missing_optional:        missingOptional,
      inferred,
      warnings,
      completeness_score:      completeness,
      can_run_decay_correction:canRunDecay,
      can_run_time_priors:     canRunTime,
      can_run_vision:          canRunVision,
      can_identify_species:    canIDSpecies,
      can_run_terrain_anchors: canRunTerrain,
    },
  };
}
 
export function snacInputFromScreenState(s = {}) {
  return buildSensorInput({
    species:         s.speciesOverride  || null,
    speciesSource:   SOURCE.USER,
    speciesConf:     s.confidence       ?? null,
    freshness:       s.freshness        ?? null,
    freshnessSource: SOURCE.USER,
    edgeClarity:     s.edgeClarity      ?? null,
    stride:          s.strideM ? parseFloat(s.strideM) : null,
    gait:            s.gait             || null,
    behavior:        s.behavior         || null,
    substrate:       s.substrate        || null,
    weather:         s.weatherCode      || null,
    temperature:     s.tempCode         || null,
    sun:             s.sunExposure      || null,
    isWet:           s.isWet            ?? null,
    nearWater:       s.nearWater        ?? null,
    onRidge:         s.onRidge          ?? null,
    denseCover:      s.denseCover       ?? null,
    waterType:       s.waterType        || null,
    waterCondition:  s.waterCondition   || null,
    terrainChannel:  s.terrainChannel   || null,
    zoneTag:         s.zoneTag          || null,
    lightPhase:      s.lightPhase       || null,
    localHour:       s.localHour        ?? null,
    photoUri:        s.photoUri         || null,
    signTags:        s.signTags         || [],
    fieldNotes:      s.fieldNotes       || null,
    sessionId:       s.sessionId        || null,
    gps:             s.harvestGps       || null,
    timestamp:       s.harvestTimestamp || null,
  });
}
 