export const SUBSTRATE_DECAY = {

  riparian_mud: {
    base_multiplier: 4.0,
    label: 'Riparian Mud',
    moisture_sensitive: true,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Saturated substrate. Best track retention of any surface. Tracks last days to over a week. Edges stay sharp until mud dries completely.',
    dry_multiplier: 1.2,
  },

  mud: {
    base_multiplier: 3.5,
    label: 'Deep Mud',
    moisture_sensitive: true,
    wind_immune: true,
    sun_sensitive: true,
    frost_timestamp: false,
    notes: 'Excellent retention when moist. Dries outside-in — edges round before compression fades. Sun accelerates drying significantly.',
    dry_multiplier: 1.0,
  },

  clay: {
    base_multiplier: 3.0,
    label: 'Clay',
    moisture_sensitive: true,
    wind_immune: true,
    sun_sensitive: true,
    frost_timestamp: false,
    notes: 'Excellent wet retention. Cracks as it dries but compression survives. Can mislead — cracked clay track may look old but be from yesterday.',
    dry_multiplier: 1.5,
  },

  wetland_edge: {
    base_multiplier: 2.8,
    label: 'Wetland Edge',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Consistently high moisture. Near-mud retention. Wind and sun have minimal effect due to ambient humidity.',
    dry_multiplier: 2.8,
  },

  snow_packed: {
    base_multiplier: 2.5,
    label: 'Packed Snow',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: true,
    frost_timestamp: true,
    notes: 'Good detail retention in cold. Ice crystals forming inside track = track predates last freeze. Sun melts edges fast on warm days.',
    dry_multiplier: 2.5,
  },

  soft_dirt: {
    base_multiplier: 2.0,
    label: 'Soft Dirt',
    moisture_sensitive: true,
    wind_immune: false,
    sun_sensitive: true,
    frost_timestamp: false,
    notes: 'Good retention when moist. Dries and crumbles within 24-48h in warm conditions. Wind starts moving loose particles after 12h.',
    dry_multiplier: 0.8,
  },

  snow_crust: {
    base_multiplier: 1.5,
    label: 'Snow Crust',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: true,
    frost_timestamp: true,
    notes: 'Variable. Hard surface holds shape well but sun destroys edges quickly. Refreeze at night re-sharpens edges — do not use edge sharpness alone to age.',
    dry_multiplier: 1.5,
  },

  moss: {
    base_multiplier: 1.5,
    label: 'Moss',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Springs back slowly. 6-12h for full recovery. Good short-term retention, poor long-term as moss rebounds.',
    dry_multiplier: 1.5,
  },

  pine_duff: {
    base_multiplier: 1.2,
    label: 'Pine Duff',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Moderate compression retention. Detail soft. Wind disturbs loose duff after a day.',
    dry_multiplier: 1.2,
  },

  wet_sand: {
    base_multiplier: 1.2,
    label: 'Wet Sand',
    moisture_sensitive: true,
    wind_immune: false,
    sun_sensitive: true,
    frost_timestamp: false,
    notes: 'Good detail when saturated but dries and slumps within hours. Sun and wind rapidly degrade.',
    dry_multiplier: 0.3,
  },

  leaf_litter: {
    base_multiplier: 1.0,
    label: 'Leaf Litter',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Baseline substrate. Compression outline visible under leaves but detail poor. Wind disturbs surface layer.',
    dry_multiplier: 1.0,
  },

  snow_fresh: {
    base_multiplier: 0.1,
    label: 'Fresh Snow (track on top)',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: true,
    frost_timestamp: false,
    is_timestamp: true,
    notes: 'Track ON TOP of fresh snow = made after last snowfall. Snow IS the timestamp. Track age = time since snow stopped. Very high confidence on freshness.',
    dry_multiplier: 0.1,
  },

  grass_short: {
    base_multiplier: 0.6,
    label: 'Short Grass',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Stems spring back within 2-4 hours. Dullings and shinings visible briefly. Poor retention beyond a few hours.',
    dry_multiplier: 0.6,
  },

  packed_dirt: {
    base_multiplier: 0.7,
    label: 'Packed Dirt',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Hard surface, shallow impressions only. Ages quickly. Only heavy animals leave reliable sign.',
    dry_multiplier: 0.7,
  },

  grass_long: {
    base_multiplier: 0.4,
    label: 'Long Grass',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Bent stems recover in 12-24h. Very poor retention. Tunnel and path visible longer than individual prints.',
    dry_multiplier: 0.4,
  },

  thin_soil_rock: {
    base_multiplier: 0.4,
    label: 'Thin Soil on Rock',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Poor. Only heaviest animals leave clear sign. Disturbed lichen or scraped rock surface outlasts soil tracks.',
    dry_multiplier: 0.4,
  },

  snow_powder: {
    base_multiplier: 0.5,
    label: 'Powder Snow (aged)',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Snow blown into track or fallen on top = track predates last snowfall. Wind erases in minutes to hours. Poor detail retention.',
    dry_multiplier: 0.5,
  },

  dry_sand: {
    base_multiplier: 0.3,
    label: 'Dry Sand',
    moisture_sensitive: false,
    wind_immune: false,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Very poor retention. Even light wind erases tracks within hours. Only deep compression from heavy animals survives.',
    dry_multiplier: 0.3,
  },

  gravel: {
    base_multiplier: 0.3,
    label: 'Gravel',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Almost no retention. Disturbed stones and scrape marks only clue. Age nearly impossible to estimate.',
    dry_multiplier: 0.3,
  },

  rocky: {
    base_multiplier: 0.2,
    label: 'Rocky',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'No meaningful retention. Scraped lichen, wet prints briefly visible. Age estimation unreliable.',
    dry_multiplier: 0.2,
  },

  manmade: {
    base_multiplier: 0.5,
    label: 'Manmade Surface',
    moisture_sensitive: false,
    wind_immune: true,
    sun_sensitive: false,
    frost_timestamp: false,
    notes: 'Dust and grime only. Wet prints visible minutes to hours. Very short retention.',
    dry_multiplier: 0.5,
  },
};

export const WEATHER_MODIFIER = {
  clear:       { modifier: 1.0,  label: 'Clear',              wind_effect: false, notes: 'Baseline. Drying proceeds at normal rate.' },
  overcast:    { modifier: 1.25, label: 'Overcast',           wind_effect: false, notes: 'Slower drying, reduced UV. Slight preservation boost across all substrates.' },
  fog:         { modifier: 1.4,  label: 'Fog / Mist',         wind_effect: false, notes: 'High ambient moisture significantly slows drying. Strong preservation boost.' },
  frost:       { modifier: 1.8,  label: 'Frost',              wind_effect: false, is_timestamp: true, notes: 'Ice crystals INSIDE track = made before last freeze. Hard minimum age floor. Track predates the freeze.' },
  snow:        { modifier: 0.3,  label: 'Currently Snowing',  wind_effect: false, is_timestamp: true, notes: 'Active snowfall. Any visible track made within minutes to an hour. Snow is covering tracks as you watch.' },
  light_rain:  { modifier: 0.9,  label: 'Light Rain',         wind_effect: false, notes: 'Temporarily preserves moisture in mud/clay. Slight surface wash on sand. Near-neutral effect.' },
  heavy_rain:  { modifier: 0.25, label: 'Heavy Rain',         wind_effect: false, notes: 'Destroys surface detail rapidly. Only deep compression survives. Age estimate very uncertain after heavy rain.' },
  windy:       { modifier: 1.0,  label: 'Windy',              wind_effect: true,  notes: 'Applied differently per substrate. Wind-immune substrates unaffected. Loose substrates degrade fast.' },
};

export const TEMP_MODIFIER = {
  freezing: { modifier: 2.5, label: 'Freezing  (<0°C)',  notes: 'Very slow decay across all substrates. Mud freezes solid and preserves indefinitely. Tracks last weeks.' },
  cold:     { modifier: 1.8, label: 'Cold      (0-8°C)', notes: 'Slow decay. Excellent multi-day retention in most substrates.' },
  cool:     { modifier: 1.3, label: 'Cool      (8-15°C)',notes: 'Moderate decay. Shifted toward preservation.' },
  mild:     { modifier: 1.0, label: 'Mild      (15-22°C)',notes: 'Baseline decay rate.' },
  warm:     { modifier: 0.7, label: 'Warm      (22-28°C)',notes: 'Faster drying. Mud edges round and crack quicker. Sand slumps faster.' },
  hot:      { modifier: 0.4, label: 'Hot       (>28°C)', notes: 'Rapid decay. Mud cracks and curls within hours. Most substrates degrade fast.' },
};

export const SUN_MODIFIER = {
  full_shade:   { modifier: 1.3, label: 'Full Shade',   notes: 'No direct UV or radiant heat. Preserves moisture significantly.' },
  partial_shade:{ modifier: 1.1, label: 'Partial Shade',notes: 'Mixed. Slight preservation advantage.' },
  full_sun:     { modifier: 0.6, label: 'Full Sun',     notes: 'Direct sun accelerates drying and UV degrades surface detail. Applies strongly to sun-sensitive substrates.' },
  unknown:      { modifier: 1.0, label: 'Unknown',      notes: 'Baseline — no sun data available.' },
};

function interpretMultiplier(m, substrate) {
  const s = SUBSTRATE_DECAY[substrate];
  if (s?.is_timestamp) return 'Track ON fresh snow = made after last snowfall. Snow is the timestamp. Very fresh — minutes to hours old.';
  if (m >= 5.0) return 'Extreme preservation conditions. Track could be many days older than it appears. Low confidence on visual age.';
  if (m >= 3.0) return 'Conditions strongly preserve tracks. Apparent freshness may be 2-4 days older than it looks.';
  if (m >= 2.0) return 'Conditions favour preservation. Add 1-2 days to visual age estimate.';
  if (m >= 1.2) return 'Slightly better than baseline preservation.';
  if (m >= 0.8) return 'Near-baseline decay. Visual age estimate is reasonably reliable.';
  if (m >= 0.4) return 'Faster than baseline decay. Tracks age quickly here.';
  return 'Very rapid decay. Even fresh tracks may look old. High uncertainty on age.';
}

export function getDecayMultiplier({
  substrate  = null,
  weather    = null,
  temp       = null,
  sun        = null,
  isWet      = null,
} = {}) {
  const s = SUBSTRATE_DECAY[substrate];
  const w = WEATHER_MODIFIER[weather]    ?? WEATHER_MODIFIER['clear'];
  const t = TEMP_MODIFIER[temp]          ?? TEMP_MODIFIER['mild'];
  const u = SUN_MODIFIER[sun]            ?? SUN_MODIFIER['unknown'];

  if (!s) {
    return {
      substrate_multiplier: 1.0,
      weather_modifier:     w.modifier,
      temp_modifier:        t.modifier,
      sun_modifier:         u.modifier,
      combined_multiplier:  Number((w.modifier * t.modifier * u.modifier).toFixed(3)),
      substrate_label:      'Unknown substrate',
      weather_label:        w.label,
      temp_label:           t.label,
      sun_label:            u.label,
      interpretation:       'Unknown substrate — decay estimate unreliable.',
      is_timestamp:         false,
      frost_timestamp:      false,
      warnings:             ['substrate not recognised — using environmental modifiers only'],
    };
  }

  // Moisture state affects substrate multiplier
  let substrateMultiplier = s.base_multiplier;
  if (s.moisture_sensitive && isWet === false) {
    substrateMultiplier = s.dry_multiplier;
  }

  // Wind only affects wind-sensitive substrates
  let windEffect = 1.0;
  if (w.wind_effect && !s.wind_immune) {
    windEffect = 0.5;
  }

  // Sun only affects sun-sensitive substrates
  let sunEffect = 1.0;
  if (s.sun_sensitive) {
    sunEffect = u.modifier;
  }

  const combined = substrateMultiplier * w.modifier * t.modifier * windEffect * sunEffect;

  const isTimestamp  = Boolean(s.is_timestamp || w.is_timestamp);
  const isFrost      = Boolean(s.frost_timestamp || weather === 'frost');

  return {
    substrate_multiplier:  Number(substrateMultiplier.toFixed(3)),
    weather_modifier:      Number((w.modifier * windEffect).toFixed(3)),
    temp_modifier:         t.modifier,
    sun_modifier:          Number(sunEffect.toFixed(3)),
    combined_multiplier:   Number(combined.toFixed(3)),
    substrate_label:       s.label,
    weather_label:         w.label,
    temp_label:            t.label,
    sun_label:             u.label,
    substrate_notes:       s.notes,
    interpretation:        interpretMultiplier(combined, substrate),
    is_timestamp:          isTimestamp,
    frost_timestamp:       isFrost,
    frost_note:            isFrost ? 'Ice crystals in track = track predates last freeze. This is a minimum age floor, not just a modifier.' : null,
    timestamp_note:        isTimestamp && !isFrost ? 'Snow is the timestamp. Track age = time since snow stopped falling.' : null,
    warnings:              [],
  };
}

export function correctFreshnessForSubstrate({
  rawFreshness = 0.7,
  substrate    = null,
  weather      = null,
  temp         = null,
  sun          = null,
  isWet        = null,
} = {}) {
  const decay = getDecayMultiplier({ substrate, weather, temp, sun, isWet });
  const { combined_multiplier, is_timestamp, frost_timestamp } = decay;

  if (is_timestamp && !frost_timestamp) {
    return {
      raw_freshness:       Number(rawFreshness.toFixed(3)),
      corrected_freshness: 0.98,
      combined_multiplier,
      is_timestamp:        true,
      age_adjustment_note: 'Snow timestamp — track is very fresh regardless of visual freshness score.',
    };
  }

  const corrected = Math.min(1, rawFreshness / combined_multiplier);
  const direction = combined_multiplier > 1 ? 'older' : 'fresher';
  const pct       = Math.abs(Math.round((1 - (corrected / rawFreshness)) * 100));

  return {
    raw_freshness:       Number(rawFreshness.toFixed(3)),
    corrected_freshness: Number(corrected.toFixed(3)),
    combined_multiplier,
    is_timestamp:        false,
    frost_timestamp,
    age_adjustment_note: combined_multiplier > 1
      ? `Substrate/conditions preserve sign. Track is ~${pct}% ${direction} than visual freshness suggests.`
      : `Substrate/conditions accelerate decay. Track may be ${direction} than it looks.`,
  };
}

export function estimateAgeHours({
  rawFreshness = 0.7,
  substrate    = null,
  weather      = null,
  temp         = null,
  sun          = null,
  isWet        = null,
} = {}) {
  const correction = correctFreshnessForSubstrate({ rawFreshness, substrate, weather, temp, sun, isWet });
  const { corrected_freshness, combined_multiplier, is_timestamp, frost_timestamp } = correction;

  if (is_timestamp && !frost_timestamp) {
    return {
      estimated_age_hours_low:  0,
      estimated_age_hours_high: 2,
      estimated_age_label:      '0-2 hours',
      confidence:               'high',
      confidence_note:          'Snow timestamp. Track made after last snowfall. Very high confidence.',
      is_timestamp:             true,
    };
  }

  const decayRate = 1 - corrected_freshness;
  const baseHours = decayRate * 72;
  const low       = Math.round(baseHours * 0.6);
  const high      = Math.round(baseHours * 1.6);

  let confidence = 'high';
  if (combined_multiplier > 3.0 || combined_multiplier < 0.4) confidence = 'low';
  else if (combined_multiplier > 1.8 || combined_multiplier < 0.7) confidence = 'medium';

  const frostNote = frost_timestamp
    ? ' Frost present — track predates last freeze, adding minimum age floor.'
    : '';

  return {
    estimated_age_hours_low:  Math.max(0, low),
    estimated_age_hours_high: Math.max(1, high),
    estimated_age_label:      `${Math.max(0, low)}-${Math.max(1, high)} hours`,
    confidence,
    confidence_note: confidence === 'low'
      ? `High uncertainty — extreme preservation or decay conditions.${frostNote}`
      : confidence === 'medium'
      ? `Moderate confidence. Environmental conditions affect reliability.${frostNote}`
      : `Reasonable confidence given substrate conditions.${frostNote}`,
    is_timestamp:    false,
    frost_timestamp,
  };
}

export function correctTravelDistance({
  rawDistanceM  = 10,
  rawFreshness  = 0.7,
  substrate     = null,
  weather       = null,
  temp          = null,
  sun           = null,
  isWet         = null,
} = {}) {
  const { corrected_freshness, combined_multiplier } = correctFreshnessForSubstrate({
    rawFreshness, substrate, weather, temp, sun, isWet
  });

  const correctedHourFactor = Math.max(0.2, 1 - corrected_freshness);
  const rawHourFactor       = Math.max(0.2, 1 - rawFreshness);
  const correctedDist       = Math.max(10, rawDistanceM * (correctedHourFactor / rawHourFactor) * combined_multiplier);

  return {
    raw_distance_m:        Number(rawDistanceM.toFixed(1)),
    corrected_distance_m:  Number(correctedDist.toFixed(1)),
    combined_multiplier,
    note: `Substrate correction ${combined_multiplier}x applied. Raw estimate was based on unmodified freshness score.`,
  };
}

export const SUBSTRATE_KEYS = Object.keys(SUBSTRATE_DECAY);
export const WEATHER_KEYS   = Object.keys(WEATHER_MODIFIER);
export const TEMP_KEYS      = Object.keys(TEMP_MODIFIER);
export const SUN_KEYS       = Object.keys(SUN_MODIFIER);
