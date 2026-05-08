import { SOURCE, CONFIDENCE } from './snac_input_schema.js';

// =============================================================================
// SNAC Field Intelligence - Phase 3.4
// snac_weather_priors.js
// Weather behavioral priors - movement likelihood from current conditions
// =============================================================================
//
// PURPOSE:
// Scores current environmental conditions for animal movement likelihood.
// Weather data auto-fetched from Open-Meteo API (free, no key required).
// Manual override available if GPS or network unavailable.
//
// KEY LOGIC:
// - Barometric pressure state + 3hr trend
//   User never sees numbers - shown as steady/rising/dropping fast
//   Optimal ungulate movement: 30.00-30.40 inHg stable
//   Pressure dropping fast = movement spike before front
//   Post-rain clearance = peak movement window
// - Wind species-specific
//   Deer: high sensitivity (wind masks hunter scent - cuts movement)
//   Bears: ignore wind almost entirely
//   Canids: use wind actively, movement increases
// - Moon phase from date
//   Full moon: mutes dawn peak (animals moved at night already)
//   New moon: sharpens dawn and dusk peaks
// - Temperature + season
//   Warm rut temps suppress buck movement (bucks bed down in heat)
//   Cold snap in fall triggers movement
//   Extreme cold suppresses most species
// - Fog
//   Predator advantage - coyote and mountain lion get positive modifier
//   Prey species get negative modifier in fog (can't see threats)
// - Post-rain clearance
//   Peak movement window after rain stops
//   Animals that sheltered start moving hard
//
// OUTPUT:
//   movement_likelihood  0.0-1.0
//   movement_label       'peak' | 'good' | 'moderate' | 'slow' | 'poor'
//   pressure_trend_label 'rising fast' | 'rising' | 'steady' | 'dropping' | 'dropping fast'
//   follow_boost         -0.3 to +0.3 adjustment for follow priority
//   notes[]              human readable field observations
//
// =============================================================================

// Open-Meteo API - free, no key, returns hourly weather
const OPEN_METEO_URL =
  'https://api.open-meteo.com/v1/forecast?' +
  'hourly=pressure_msl,windspeed_10m,precipitation,weathercode,temperature_2m' +
  '&current_weather=true' +
  '&forecast_days=1' +
  '&timezone=auto';

// hPa to inHg conversion
function hpaToInHg(hpa) {
  return hpa * 0.02953;
}

// Pressure trend labels - user never sees raw numbers
function pressureTrendLabel(trend) {
  if (trend > 2.0)  return 'rising fast';
  if (trend > 0.5)  return 'rising';
  if (trend < -2.0) return 'dropping fast';
  if (trend < -0.5) return 'dropping';
  return 'steady';
}

// Moon phase 0.0-1.0 from date
// 0.0 = new moon, 0.5 = full moon, 1.0 = new moon again
// Synodic period: 29.53 days
// Reference new moon: Jan 6 2000
function moonPhase(date) {
  const ref  = new Date('2000-01-06T00:00:00Z');
  const diff = (date.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
  const cycle = 29.53059;
  return ((diff % cycle) + cycle) % cycle / cycle;
}

function moonLabel(phase) {
  if (phase < 0.10 || phase > 0.90) return 'new';
  if (phase < 0.25) return 'waxing crescent';
  if (phase < 0.40) return 'waxing gibbous';
  if (phase < 0.60) return 'full';
  if (phase < 0.75) return 'waning gibbous';
  return 'waning crescent';
}

// Species wind sensitivity
// How much wind reduces movement likelihood
const WIND_SENSITIVITY = {
  ungulate:   0.80,   // deer hate wind - masks sound, spreads scent
  canid:      0.10,   // wolves and coyotes use wind actively
  bear:       0.05,   // bears largely ignore wind
  felid:      0.30,   // cats prefer calm but hunt in wind ok
  default:    0.50,
};

// Species group lookup - matches hunting pressure groups
const SPECIES_GROUP = {
  blacktail_deer:    'ungulate',
  white_tailed_deer: 'ungulate',
  mule_deer:         'ungulate',
  elk:               'ungulate',
  moose:             'ungulate',
  caribou:           'ungulate',
  bighorn_sheep:     'ungulate',
  mountain_goat:     'ungulate',
  pronghorn:         'ungulate',
  red_deer:          'ungulate',
  roe_deer:          'ungulate',
  sika_deer:         'ungulate',
  fallow_deer:       'ungulate',
  gray_wolf:         'canid',
  coyote:            'canid',
  red_fox:           'canid',
  dingo:             'canid',
  black_bear:        'bear',
  grizzly_bear:      'bear',
  black_rhino:       'bear',   // approximation for heavy browser
  mountain_lion:     'felid',
  bobcat:            'felid',
  lion:              'felid',
  leopard:           'felid',
  cheetah:           'felid',
  jaguar:            'felid',
  puma:              'felid',
};

// Open-Meteo weather codes -> readable condition + base movement modifier
// WMO weather interpretation codes
const WEATHER_CODE_MAP = {
  0:  { condition: 'clear',         moveMod:  0.10, postRain: false },
  1:  { condition: 'mostly_clear',  moveMod:  0.08, postRain: false },
  2:  { condition: 'partly_cloudy', moveMod:  0.05, postRain: false },
  3:  { condition: 'overcast',      moveMod:  0.02, postRain: false },
  45: { condition: 'fog',           moveMod: -0.10, postRain: false },
  48: { condition: 'fog',           moveMod: -0.12, postRain: false },
  51: { condition: 'drizzle',       moveMod: -0.05, postRain: false },
  53: { condition: 'drizzle',       moveMod: -0.08, postRain: false },
  55: { condition: 'heavy_drizzle', moveMod: -0.12, postRain: false },
  61: { condition: 'light_rain',    moveMod: -0.08, postRain: false },
  63: { condition: 'rain',          moveMod: -0.15, postRain: false },
  65: { condition: 'heavy_rain',    moveMod: -0.22, postRain: false },
  71: { condition: 'snow',          moveMod: -0.05, postRain: false },
  73: { condition: 'snow',          moveMod: -0.10, postRain: false },
  75: { condition: 'heavy_snow',    moveMod: -0.18, postRain: false },
  77: { condition: 'snow_grains',   moveMod: -0.06, postRain: false },
  80: { condition: 'showers',       moveMod: -0.10, postRain: false },
  81: { condition: 'showers',       moveMod: -0.15, postRain: false },
  82: { condition: 'heavy_showers', moveMod: -0.20, postRain: false },
  85: { condition: 'snow_showers',  moveMod: -0.08, postRain: false },
  86: { condition: 'snow_showers',  moveMod: -0.14, postRain: false },
  95: { condition: 'thunderstorm',  moveMod: -0.30, postRain: false },
  96: { condition: 'thunderstorm',  moveMod: -0.30, postRain: false },
  99: { condition: 'thunderstorm',  moveMod: -0.30, postRain: false },
};

// =============================================================================
// OPEN-METEO FETCH
// =============================================================================

async function fetchWeatherData(lat, lon) {
  try {
    const url = OPEN_METEO_URL + '&latitude=' + lat + '&longitude=' + lon;
    const res  = await fetch(url, { timeout: 8000 });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

function parseWeatherData(data) {
  if (!data) return null;

  const current     = data.current_weather ?? {};
  const hourly      = data.hourly ?? {};
  const pressures   = hourly.pressure_msl ?? [];
  const winds       = hourly.windspeed_10m ?? [];
  const precip      = hourly.precipitation ?? [];
  const codes       = hourly.weathercode ?? [];
  const temps       = hourly.temperature_2m ?? [];

  // Current hour index - Open-Meteo hourly starts at midnight local
  const hour = new Date().getHours();

  const pressureNow = pressures[hour] ?? null;
  // 3hr trend: compare now to 3 hours ago
  const pressure3hAgo = pressures[Math.max(0, hour - 3)] ?? pressureNow;
  const pressureTrendHpa = pressureNow !== null && pressure3hAgo !== null
    ? pressureNow - pressure3hAgo
    : 0;

  // Recent precipitation - last 3 hours
  const recentPrecip = precip
    .slice(Math.max(0, hour - 3), hour)
    .reduce((s, v) => s + (v ?? 0), 0);

  // Post-rain check: had rain in last 3h but current code is clear/mostly clear
  const currentCode = codes[hour] ?? current.weathercode ?? 0;
  const isClearing  = recentPrecip > 0.2 && currentCode <= 3;

  return {
    pressure_hpa:      pressureNow,
    pressure_inhg:     pressureNow ? hpaToInHg(pressureNow) : null,
    pressure_trend_hpa: pressureTrendHpa,
    windspeed_kmh:     winds[hour] ?? current.windspeed ?? null,
    temperature_c:     temps[hour] ?? current.temperature ?? null,
    weather_code:      currentCode,
    recent_precip_mm:  recentPrecip,
    is_post_rain:      isClearing,
    raw_current:       current,
  };
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

function scorePressure(pressureInHg, trendHpa, notes) {
  let score = 0.50; // neutral base

  if (pressureInHg === null) return { score, label: 'steady', trendLabel: 'steady' };

  const trendLabel = pressureTrendLabel(trendHpa);

  // Optimal deer movement band: 30.00-30.40 inHg
  if (pressureInHg >= 30.00 && pressureInHg <= 30.40) {
    score += 0.15;
    notes.push('Barometric pressure in optimal movement range');
  } else if (pressureInHg > 30.40) {
    // High and stable - still good but past peak
    score += 0.08;
  } else if (pressureInHg < 29.50) {
    // Low pressure - storm conditions, movement suppressed
    score -= 0.15;
    notes.push('Low pressure system - movement generally suppressed');
  }

  // Trend adjustments
  if (trendLabel === 'dropping fast') {
    // Pressure dropping fast = movement spike before front
    // Animals feed hard before weather closes in
    score += 0.20;
    notes.push('Pressure dropping fast - animals feeding hard before incoming front');
  } else if (trendLabel === 'dropping') {
    score += 0.10;
    notes.push('Pressure dropping - pre-front movement increase likely');
  } else if (trendLabel === 'rising fast') {
    // Post-storm clearing - also good
    score += 0.12;
    notes.push('Pressure rising fast - post-storm movement increasing');
  } else if (trendLabel === 'rising') {
    score += 0.06;
    notes.push('Pressure rising - conditions improving');
  } else {
    // Steady - good for prediction
    score += 0.05;
    notes.push('Pressure steady - movement patterns predictable');
  }

  return { score, trendLabel };
}

function scoreWind(windKmh, speciesGroup, notes) {
  if (windKmh === null) return 0;

  const sensitivity = WIND_SENSITIVITY[speciesGroup] ?? WIND_SENSITIVITY.default;

  // Wind thresholds
  // < 8 kmh  = calm, no effect
  // 8-20     = light, slight suppression for sensitive species
  // 20-35    = moderate, significant suppression for ungulates
  // > 35     = strong, major suppression for all prey, canids less affected
  let windPenalty = 0;
  if (windKmh > 35) {
    windPenalty = 0.25 * sensitivity;
    notes.push('Strong wind - movement significantly suppressed for this species');
  } else if (windKmh > 20) {
    windPenalty = 0.15 * sensitivity;
    notes.push('Moderate wind - some movement suppression');
  } else if (windKmh > 8) {
    windPenalty = 0.06 * sensitivity;
  }

  // Canids get a bonus in moderate wind - they use it to hunt
  if ((speciesGroup === 'canid') && windKmh > 8 && windKmh < 35) {
    return -windPenalty + 0.08; // net positive
  }

  return -windPenalty;
}

function scoreMoon(phase, localHour, notes) {
  const label = moonLabel(phase);
  let score   = 0;

  // Full moon effect: animals already moved at night
  // Dawn peak is muted - they fed at night, now bedded
  if (label === 'full') {
    if (localHour >= 5 && localHour <= 8) {
      score -= 0.12;
      notes.push('Full moon - dawn peak muted, animals likely bedded after night feeding');
    } else if (localHour >= 18 && localHour <= 21) {
      score -= 0.08;
      notes.push('Full moon - evening movement less concentrated, spread across night');
    } else if (localHour >= 22 || localHour <= 4) {
      score += 0.15;
      notes.push('Full moon night - peak movement window, animals active in moonlight');
    }
  }

  // New moon: sharpens dawn and dusk peaks - animals move in darkness, concentrate at edges
  if (label === 'new') {
    if ((localHour >= 5 && localHour <= 9) || (localHour >= 17 && localHour <= 20)) {
      score += 0.10;
      notes.push('New moon - crepuscular peaks sharpened, concentrated dawn/dusk movement');
    }
  }

  return { score, moonLabel: label, moonPhase: Math.round(phase * 100) };
}

function scoreTemperature(tempC, month, speciesGroup, notes) {
  let score = 0;

  if (tempC === null) return score;

  const isRutSeason = month >= 10 && month <= 12;

  // Extreme cold suppresses most species
  if (tempC < -15) {
    score -= 0.15;
    notes.push('Extreme cold - movement suppressed, animals conserving energy');
    return score;
  }

  // Cold snap in fall triggers movement for ungulates
  if (isRutSeason && speciesGroup === 'ungulate') {
    if (tempC < 5) {
      score += 0.12;
      notes.push('Cold fall temps - triggers rut movement and feeding intensity');
    } else if (tempC > 18) {
      score -= 0.10;
      notes.push('Warm rut temps - bucks bedding down in heat, movement suppressed midday');
    }
  }

  // General temperature comfort range for most ungulates: 2-15C
  if (tempC >= 2 && tempC <= 15) {
    score += 0.05;
  } else if (tempC > 28) {
    score -= 0.12;
    notes.push('High heat - most species bedded during day, movement shifts to night');
  }

  return score;
}

function scorePostRain(isPostRain, recentPrecipMm, notes) {
  if (!isPostRain) return 0;
  // Post-rain clearance = peak movement window
  // Animals that sheltered emerge and feed hard
  const intensity = Math.min(recentPrecipMm / 10, 1); // normalize 0-1
  const bonus     = 0.10 + (intensity * 0.12); // 0.10-0.22 bonus
  notes.push('Post-rain clearance - peak movement window. Animals emerging from shelter.');
  return bonus;
}

function scoreFog(weatherCode, speciesGroup, notes) {
  const isFog = weatherCode === 45 || weatherCode === 48;
  if (!isFog) return 0;

  if (speciesGroup === 'felid' || speciesGroup === 'canid') {
    notes.push('Fog - predator advantage. Ambush predators more active.');
    return 0.08; // predators benefit
  }
  if (speciesGroup === 'ungulate') {
    notes.push('Fog - prey species more cautious. Cannot see threats. Movement reduced.');
    return -0.10;
  }
  return -0.05;
}

function movementLabel(score) {
  if (score >= 0.78) return 'peak';
  if (score >= 0.60) return 'good';
  if (score >= 0.42) return 'moderate';
  if (score >= 0.25) return 'slow';
  return 'poor';
}

// =============================================================================
// MAIN EXPORT: scoreWeatherPriors
// =============================================================================
// Inputs:
//   resolved      - output of resolveInputs() from snac_inference_engine.js
//   gpsCoords     - { lat, lon } for Open-Meteo fetch, null if unavailable
//   manualOverride - optional manual weather values if no GPS/network
//
// Output:
//   Full weather prior object consumed by snac_hunting_pressure.js
//   and snac_sensor_fusion.js

export async function scoreWeatherPriors(resolved = {}, gpsCoords = null, manualOverride = null) {
  const notes        = [];
  const speciesKey   = resolved.species?.value ?? null;
  const speciesGroup = SPECIES_GROUP[speciesKey] ?? 'default';
  const localHour    = resolved.local_hour?.value ?? new Date().getHours();
  const month        = new Date().getMonth() + 1;
  const now          = new Date();

  // Fetch weather data
  let weather = null;
  if (gpsCoords?.lat && gpsCoords?.lon) {
    const raw = await fetchWeatherData(gpsCoords.lat, gpsCoords.lon);
    weather   = parseWeatherData(raw);
  }

  // Manual override - user entered conditions in UI
  // Fills gaps when network unavailable
  if (manualOverride) {
    weather = {
      pressure_hpa:       manualOverride.pressureHpa ?? null,
      pressure_inhg:      manualOverride.pressureHpa ? hpaToInHg(manualOverride.pressureHpa) : null,
      pressure_trend_hpa: 0,
      windspeed_kmh:      manualOverride.windKmh ?? null,
      temperature_c:      manualOverride.tempC ?? null,
      weather_code:       manualOverride.weatherCode ?? 0,
      recent_precip_mm:   0,
      is_post_rain:       manualOverride.postRain ?? false,
      raw_current:        null,
    };
  }

  // Also check the resolved input schema for manually entered weather code
  // This comes from the UI weather pill selection
  const uiWeatherCode = resolved.weather?.value ?? null;
  const uiWeatherCodeMap = {
    'clear':       0,
    'overcast':    3,
    'light_rain':  61,
    'heavy_rain':  65,
    'snow':        73,
    'fog':         45,
    'windy':       null, // not a WMO code - handled as wind modifier
  };

  // If no GPS and no override but UI weather pill set, use that
  if (!weather && uiWeatherCode) {
    const mappedCode = uiWeatherCodeMap[uiWeatherCode] ?? 0;
    weather = {
      pressure_hpa:       null,
      pressure_inhg:      null,
      pressure_trend_hpa: 0,
      windspeed_kmh:      uiWeatherCode === 'windy' ? 30 : null,
      temperature_c:      resolved.temperature?.value ?? null,
      weather_code:       mappedCode,
      recent_precip_mm:   0,
      is_post_rain:       false,
      raw_current:        null,
    };
    notes.push('Weather from UI selection - no GPS data available');
  }

  // Fallback - no data at all
  if (!weather) {
    return {
      movement_likelihood:  0.50,
      movement_label:       'moderate',
      pressure_trend_label: 'steady',
      pressure_inhg:        null,
      wind_kmh:             null,
      temperature_c:        null,
      moon_label:           moonLabel(moonPhase(now)),
      moon_phase:           Math.round(moonPhase(now) * 100),
      weather_code:         null,
      condition:            'unknown',
      is_post_rain:         false,
      follow_boost:         0,
      notes:                ['No weather data available - movement likelihood set to neutral'],
      source:               SOURCE.DEFAULT,
      confidence:           CONFIDENCE.NONE,
      species_group:        speciesGroup,
    };
  }

  // Score each component
  let totalScore = 0.50; // neutral base

  const { score: pressureScore, trendLabel } = scorePressure(
    weather.pressure_inhg,
    weather.pressure_trend_hpa,
    notes
  );
  totalScore += (pressureScore - 0.50); // delta from neutral

  const windScore = scoreWind(weather.windspeed_kmh, speciesGroup, notes);
  totalScore += windScore;

  const phase = moonPhase(now);
  const { score: moonScore, moonLabel: mLabel, moonPhase: mPhase } = scoreMoon(phase, localHour, notes);
  totalScore += moonScore;

  const tempScore = scoreTemperature(weather.temperature_c, month, speciesGroup, notes);
  totalScore += tempScore;

  const postRainScore = scorePostRain(weather.is_post_rain, weather.recent_precip_mm, notes);
  totalScore += postRainScore;

  const fogScore = scoreFog(weather.weather_code, speciesGroup, notes);
  totalScore += fogScore;

  // Weather code base modifier
  const codeEntry = WEATHER_CODE_MAP[weather.weather_code];
  if (codeEntry) totalScore += codeEntry.moveMod;

  // Clamp 0.0-1.0
  const finalScore = Math.max(0, Math.min(1, totalScore));
  const label      = movementLabel(finalScore);
  const condition  = codeEntry?.condition ?? 'unknown';

  // Follow boost - passed to hunting pressure and fusion
  // Score above 0.60 = positive boost, below 0.40 = negative
  const followBoost = Number(((finalScore - 0.50) * 0.6).toFixed(3));

  return {
    movement_likelihood:  Number(finalScore.toFixed(3)),
    movement_label:       label,
    pressure_trend_label: trendLabel,
    pressure_inhg:        weather.pressure_inhg ? Number(weather.pressure_inhg.toFixed(2)) : null,
    wind_kmh:             weather.windspeed_kmh,
    temperature_c:        weather.temperature_c,
    moon_label:           mLabel,
    moon_phase:           mPhase,
    weather_code:         weather.weather_code,
    condition,
    is_post_rain:         weather.is_post_rain,
    follow_boost:         followBoost,
    notes,
    source:               gpsCoords ? SOURCE.MEASURED : (manualOverride ? SOURCE.USER : SOURCE.INFERRED),
    confidence:           gpsCoords ? CONFIDENCE.HIGH : (uiWeatherCode ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW),
    species_group:        speciesGroup,
  };
}

export { SPECIES_GROUP, WIND_SENSITIVITY, WEATHER_CODE_MAP, moonPhase, moonLabel };

