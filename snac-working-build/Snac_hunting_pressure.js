import { SOURCE, CONFIDENCE } from './snac_input_schema.js';

// How hunting pressure shifts animal behavior by species group
const PRESSURE_BEHAVIOR_SHIFT = {
  // Ungulates are most sensitive — shift nocturnal fast
  ungulate: {
    none:     { nocturnal_shift: 0.0, pattern_change: null,          confidence_penalty: 0.00 },
    light:    { nocturnal_shift: 0.2, pattern_change: 'compressed',  confidence_penalty: 0.05 },
    moderate: { nocturnal_shift: 0.5, pattern_change: 'nocturnal',   confidence_penalty: 0.12 },
    heavy:    { nocturnal_shift: 0.9, pattern_change: 'full_nocturnal', confidence_penalty: 0.20 },
  },
  // Canids adapt quickly but maintain some daylight activity
  canid: {
    none:     { nocturnal_shift: 0.0, pattern_change: null,          confidence_penalty: 0.00 },
    light:    { nocturnal_shift: 0.1, pattern_change: null,          confidence_penalty: 0.03 },
    moderate: { nocturnal_shift: 0.3, pattern_change: 'compressed',  confidence_penalty: 0.08 },
    heavy:    { nocturnal_shift: 0.6, pattern_change: 'nocturnal',   confidence_penalty: 0.12 },
  },
  // Bears largely ignore pressure except mature animals
  bear: {
    none:     { nocturnal_shift: 0.0, pattern_change: null,          confidence_penalty: 0.00 },
    light:    { nocturnal_shift: 0.1, pattern_change: null,          confidence_penalty: 0.02 },
    moderate: { nocturnal_shift: 0.2, pattern_change: null,          confidence_penalty: 0.05 },
    heavy:    { nocturnal_shift: 0.4, pattern_change: 'compressed',  confidence_penalty: 0.08 },
  },
  // Felids maintain patterns but shift timing slightly
  felid: {
    none:     { nocturnal_shift: 0.0, pattern_change: null,          confidence_penalty: 0.00 },
    light:    { nocturnal_shift: 0.1, pattern_change: null,          confidence_penalty: 0.02 },
    moderate: { nocturnal_shift: 0.3, pattern_change: 'compressed',  confidence_penalty: 0.06 },
    heavy:    { nocturnal_shift: 0.5, pattern_change: 'nocturnal',   confidence_penalty: 0.10 },
  },
  // Default for unknown species
  default: {
    none:     { nocturnal_shift: 0.0, pattern_change: null,          confidence_penalty: 0.00 },
    light:    { nocturnal_shift: 0.1, pattern_change: null,          confidence_penalty: 0.03 },
    moderate: { nocturnal_shift: 0.3, pattern_change: 'compressed',  confidence_penalty: 0.08 },
    heavy:    { nocturnal_shift: 0.6, pattern_change: 'nocturnal',   confidence_penalty: 0.15 },
  },
};

// Species to group mapping
const SPECIES_GROUP = {
  blacktail_deer:    'ungulate',
  sitka_deer:        'ungulate',
  mule_deer:         'ungulate',
  white_tailed_deer: 'ungulate',
  elk:               'ungulate',
  moose:             'ungulate',
  caribou:           'ungulate',
  pronghorn:         'ungulate',
  bighorn_sheep:     'ungulate',
  mountain_goat:     'ungulate',
  wild_boar:         'ungulate',
  coyote:            'canid',
  wolf:              'canid',
  red_fox:           'canid',
  black_bear:        'bear',
  grizzly_bear:      'bear',
  polar_bear:        'bear',
  mountain_lion:     'felid',
  bobcat:            'felid',
  lynx:              'felid',
  jaguar:            'felid',
  leopard:           'felid',
};

// How pressure affects the morning follow window specifically
// The 5-10am window is the primary hunting window — pressure degrades it
const MORNING_WINDOW_PRESSURE = {
  none:     { window_valid: true,  boost_multiplier: 1.00, note: null },
  light:    { window_valid: true,  boost_multiplier: 0.80, note: 'Light pressure — morning window still reliable but animals may be moving earlier.' },
  moderate: { window_valid: true,  boost_multiplier: 0.50, note: 'Moderate pressure — morning activity compressed toward pre-dawn. 4-6am more reliable than 6-10am.' },
  heavy:    { window_valid: false, boost_multiplier: 0.15, note: 'Heavy pressure — crepuscular patterns shifted nocturnal. Daytime sign likely old. Night or pre-dawn approach recommended.' },
};

// Freshness threshold — how fresh does a track need to be for time-of-day prior to matter
const FRESHNESS_THRESHOLD = 0.75; // corrected freshness

export function applyHuntingPressure({
  activityPrior   = null,
  weatherPrior    = null,
  huntingPressure = 'none',
  speciesKey      = null,
  correctedFreshness = null,
  localHour       = null,
  month           = null,
} = {}) {

  const pressure   = huntingPressure ?? 'none';
  const group      = SPECIES_GROUP[speciesKey] ?? 'default';
  const shift      = PRESSURE_BEHAVIOR_SHIFT[group][pressure];
  const morning    = MORNING_WINDOW_PRESSURE[pressure];

  const isRut      = month && [11, 12].includes(month) &&
    ['blacktail_deer','sitka_deer','mule_deer','white_tailed_deer'].includes(speciesKey);

  // During rut, bucks largely ignore pressure — override
  const effectivePressure = isRut ? 'light' : pressure;
  const effectiveShift    = PRESSURE_BEHAVIOR_SHIFT[group][effectivePressure];

  // Is the track fresh enough for time-of-day prior to apply?
  const trackIsFresh = correctedFreshness !== null
    ? correctedFreshness >= FRESHNESS_THRESHOLD
    : null; // unknown freshness — can't apply window logic reliably

  // Morning window check (5-10am)
  const inMorningWindow = localHour !== null && localHour >= 5 && localHour <= 10;
  const morningWindowFires = inMorningWindow && trackIsFresh === true && morning.window_valid;

  // Build modified activity prior
  const modifiedActivityPrior = activityPrior ? { ...activityPrior } : null;
  if (modifiedActivityPrior) {
    // Apply pressure to follow boost
    const originalBoost = modifiedActivityPrior.follow_boost ?? 0;

    if (inMorningWindow) {
      // Morning window — fresh track check gates the boost
      if (morningWindowFires) {
        modifiedActivityPrior.follow_boost = Number((originalBoost * morning.boost_multiplier).toFixed(3));
        modifiedActivityPrior.morning_window_active = true;
      } else if (trackIsFresh === false) {
        modifiedActivityPrior.follow_boost = 0;
        modifiedActivityPrior.morning_window_active = false;
        modifiedActivityPrior.note = 'Track not fresh enough for morning window to apply. Time-of-day prior suppressed.';
      } else {
        // Unknown freshness — reduce confidence
        modifiedActivityPrior.follow_boost = Number((originalBoost * 0.5).toFixed(3));
        modifiedActivityPrior.morning_window_active = null;
        modifiedActivityPrior.note = 'Freshness unknown — morning window confidence reduced.';
      }
    } else {
      // Outside morning window — apply nocturnal shift penalty
      modifiedActivityPrior.follow_boost = Number((originalBoost * (1 - effectiveShift.nocturnal_shift)).toFixed(3));
    }

    if (effectiveShift.pattern_change) {
      modifiedActivityPrior.pressure_pattern = effectiveShift.pattern_change;
    }

    if (pressure === 'heavy' && !isRut) {
      modifiedActivityPrior.note = (modifiedActivityPrior.note ?? '') +
        ' Heavy pressure — crepuscular patterns unreliable. Daytime sign likely old.';
    }

    if (isRut && pressure !== 'none') {
      modifiedActivityPrior.note = 'Rut active — bucks largely ignore hunting pressure. Time-of-day patterns suspended.';
    }
  }

  // Build modified weather prior
  const modifiedWeatherPrior = weatherPrior ? { ...weatherPrior } : null;
  if (modifiedWeatherPrior) {
    const originalBoost = modifiedWeatherPrior.follow_boost ?? 0;
    modifiedWeatherPrior.follow_boost = Number((originalBoost * (1 - effectiveShift.nocturnal_shift * 0.5)).toFixed(3));
  }

  // Overall confidence penalty
  const confidencePenalty = effectiveShift.confidence_penalty;

  // Human readable notes
  const notes = [];
  if (morning.note && inMorningWindow) notes.push(morning.note);
  if (effectiveShift.pattern_change === 'full_nocturnal') {
    notes.push(`${speciesKey ?? 'Species'} likely fully nocturnal under heavy pressure. Pre-dawn approach most effective.`);
  } else if (effectiveShift.pattern_change === 'nocturnal') {
    notes.push(`Moderate-heavy pressure has shifted activity toward darker hours.`);
  } else if (effectiveShift.pattern_change === 'compressed') {
    notes.push(`Light-moderate pressure compressing activity windows toward low light.`);
  }

  if (trackIsFresh === true && inMorningWindow && morningWindowFires) {
    notes.push(`Fresh track in morning window — animal likely still in area.`);
  } else if (trackIsFresh === true && inMorningWindow && !morningWindowFires) {
    notes.push(`Fresh track but pressure has degraded morning window reliability.`);
  } else if (trackIsFresh === false && inMorningWindow) {
    notes.push(`Track too old for morning window to apply. Animal has moved on.`);
  }

  return {
    hunting_pressure:         pressure,
    species_group:            group,
    nocturnal_shift:          effectiveShift.nocturnal_shift,
    pattern_change:           effectiveShift.pattern_change,
    confidence_penalty:       confidencePenalty,
    morning_window_fires:     morningWindowFires,
    track_fresh_enough:       trackIsFresh,
    modified_activity_prior:  modifiedActivityPrior,
    modified_weather_prior:   modifiedWeatherPrior,
    notes,
    rut_override:             isRut && pressure !== 'none',
    source:                   SOURCE.INFERRED,
    confidence:               pressure === 'none' ? CONFIDENCE.HIGH : CONFIDENCE.MEDIUM,
  };
}

export { SPECIES_GROUP, PRESSURE_BEHAVIOR_SHIFT, MORNING_WINDOW_PRESSURE, FRESHNESS_THRESHOLD };
