import { SOURCE, CONFIDENCE } from './snac_input_schema.js';
import { correctFreshnessForSubstrate, estimateAgeHours, correctTravelDistance } from './Snac_substrate_decay.js';

// Migration calendar — month ranges when species are likely in migratory vs resident mode
// month is 1-12
const MIGRATION_CALENDAR = {
  blacktail_deer:   { migratory_months: [5, 6, 10, 11], notes: 'Ascend May-June, descend Oct with first frost, rut Nov-Dec' },
  sitka_deer:       { migratory_months: [5, 6, 10, 11], notes: 'Similar to blacktail, elevation driven' },
  mule_deer:        { migratory_months: [4, 5, 6, 10, 11], notes: 'Longer migrations, some 100km+' },
  elk:              { migratory_months: [5, 6, 9, 10], notes: 'Spring ascent, fall descent before rut' },
  moose:            { migratory_months: [5, 10], notes: 'Shorter seasonal shifts, less pronounced than deer' },
  caribou:          { migratory_months: [3, 4, 5, 9, 10, 11], notes: 'Long distance migratory, 100s of km' },
  white_tailed_deer:{ migratory_months: [10, 11], notes: 'Mostly resident, some elevation shift in mountains' },
  bighorn_sheep:    { migratory_months: [5, 6, 10, 11], notes: 'Elevation driven, alpine summer' },
  mountain_goat:    { migratory_months: [5, 6, 10, 11], notes: 'Alpine summer, lower winter' },
  pronghorn:        { migratory_months: [4, 5, 10, 11], notes: 'Longest land migration in western hemisphere' },
};

// Resident vs migratory home range caps (km2) from scientific literature
const HOME_RANGE = {
  blacktail_deer:   { resident: 1.4,   migratory: 17.7,  notes: 'Nyberg & Janz 1990, ADF&G radio collar' },
  sitka_deer:       { resident: 0.8,   migratory: 8.0,   notes: 'ADF&G Admiralty Island avg 200 acres' },
  mule_deer:        { resident: 5.0,   migratory: 50.0,  notes: 'Highly variable by population' },
  elk:              { resident: 15.0,  migratory: 100.0, notes: 'GPS collar studies western NA' },
  moose:            { resident: 10.0,  migratory: 30.0,  notes: 'Variable by habitat quality' },
  caribou:          { resident: 50.0,  migratory: 5000.0,notes: 'Annual range can be enormous' },
  white_tailed_deer:{ resident: 2.0,   migratory: 10.0,  notes: 'GPS collar Oklahoma/Texas studies' },
  bighorn_sheep:    { resident: 20.0,  migratory: 80.0,  notes: 'Elevation driven seasonal range' },
  mountain_goat:    { resident: 15.0,  migratory: 40.0,  notes: 'Alpine specialist, narrow range' },
  pronghorn:        { resident: 30.0,  migratory: 300.0, notes: 'Most migratory ungulate in western hemisphere' },
  coyote:           { resident: 40.0,  migratory: 40.0,  notes: 'Territorial, not migratory' },
  black_bear:       { resident: 80.0,  migratory: 200.0, notes: 'Females smaller, males larger' },
  grizzly_bear:     { resident: 300.0, migratory: 800.0, notes: 'Highly variable, food-driven' },
  mountain_lion:    { resident: 150.0, migratory: 400.0, notes: 'Females smaller, males patrol wide' },
  wolf:             { resident: 200.0, migratory: 1000.0,notes: 'Pack territory, dispersers travel far' },
};

// Stride fallbacks per species per gait (metres) from Elbroch + field guides
const STRIDE_FALLBACK = {
  blacktail_deer:   { walk: [0.38, 0.63], trot: [0.84, 1.27], bound: [1.5, 2.5],  pronk: [2.0, 4.0] },
  sitka_deer:       { walk: [0.35, 0.55], trot: [0.75, 1.10], bound: [1.2, 2.2] },
  mule_deer:        { walk: [0.40, 0.70], trot: [0.90, 1.40], bound: [1.8, 3.0] },
  white_tailed_deer:{ walk: [0.33, 0.66], trot: [0.76, 1.52], bound: [1.5, 3.0] },
  elk:              { walk: [0.60, 0.90], trot: [1.20, 1.80], gallop: [2.5, 4.0] },
  moose:            { walk: [0.70, 1.10], trot: [1.40, 2.20], gallop: [2.8, 4.5] },
  coyote:           { walk: [0.25, 0.40], trot: [0.50, 0.90], lope: [1.0, 2.0], gallop: [2.0, 4.0] },
  wolf:             { walk: [0.35, 0.55], trot: [0.70, 1.20], lope: [1.5, 2.5], gallop: [2.5, 5.0] },
  black_bear:       { walk: [0.30, 0.55], lope: [0.80, 1.50], gallop: [1.5, 3.0] },
  grizzly_bear:     { walk: [0.40, 0.70], lope: [1.00, 2.00], gallop: [2.0, 4.0] },
  mountain_lion:    { walk: [0.40, 0.65], trot: [0.80, 1.30], gallop: [2.0, 5.0] },
  bobcat:           { walk: [0.25, 0.40], trot: [0.50, 0.80], gallop: [1.5, 3.0] },
  lynx:             { walk: [0.30, 0.50], trot: [0.60, 1.00], gallop: [1.8, 3.5] },
};

// Activity priors — what behavior is expected at this hour for this species
function getActivityPrior(speciesKey, localHour, month) {
  const profile = { activity: 'crepuscular' }; // default
  const activity = profile.activity;

  if (localHour === null || localHour === undefined) return null;

  const isDawn    = localHour >= 5  && localHour <= 8;
  const isDusk    = localHour >= 18 && localHour <= 21;
  const isMidday  = localHour >= 10 && localHour <= 15;
  const isNight   = localHour >= 22 || localHour <= 4;

  // Rut months for deer species — behavior changes completely
  const isRut = month && [11, 12].includes(month) &&
    ['blacktail_deer','sitka_deer','mule_deer','white_tailed_deer'].includes(speciesKey);

  if (isRut) {
    return {
      expected_behavior: 'patrol',
      movement_likelihood: 'high',
      follow_boost: 0.15,
      note: 'Rut period — bucks move at all hours searching for does. Time-of-day priors suspended.',
      source: SOURCE.INFERRED,
      confidence: CONFIDENCE.HIGH,
    };
  }

  if (activity === 'crepuscular') {
    if (isDawn || isDusk) return {
      expected_behavior: 'travel',
      movement_likelihood: 'high',
      follow_boost: 0.12,
      note: 'Crepuscular species at peak activity window. Track likely fresh, animal nearby.',
      source: SOURCE.INFERRED,
      confidence: CONFIDENCE.HIGH,
    };
    if (isMidday) return {
      expected_behavior: 'bedding',
      movement_likelihood: 'low',
      follow_boost: -0.10,
      note: 'Crepuscular species at midday. Track likely older — animal has bedded. Follow priority reduced.',
      source: SOURCE.INFERRED,
      confidence: CONFIDENCE.MEDIUM,
    };
    if (isNight) return {
      expected_behavior: 'forage',
      movement_likelihood: 'medium',
      follow_boost: 0.05,
      note: 'Crepuscular species — some nocturnal feeding. Track age uncertain.',
      source: SOURCE.INFERRED,
      confidence: CONFIDENCE.LOW,
    };
  }

  if (activity === 'nocturnal') {
    if (isNight) return {
      expected_behavior: 'travel',
      movement_likelihood: 'high',
      follow_boost: 0.10,
      note: 'Nocturnal species at peak activity. Track likely fresh.',
      source: SOURCE.INFERRED,
      confidence: CONFIDENCE.HIGH,
    };
    if (isMidday) return {
      expected_behavior: 'resting',
      movement_likelihood: 'very_low',
      follow_boost: -0.15,
      note: 'Nocturnal species in midday. Track likely old — animal denned or resting nearby.',
      source: SOURCE.INFERRED,
      confidence: CONFIDENCE.HIGH,
    };
  }

  return {
    expected_behavior: 'unknown',
    movement_likelihood: 'unknown',
    follow_boost: 0,
    note: 'Time context insufficient for activity prior.',
    source: SOURCE.INFERRED,
    confidence: CONFIDENCE.NONE,
  };
}

function getMigrationStatus(speciesKey, month) {
  const calendar = MIGRATION_CALENDAR[speciesKey];
  const homeRange = HOME_RANGE[speciesKey];

  if (!calendar || !homeRange) {
    return {
      status: 'unknown',
      home_range_cap_km2: null,
      confidence: CONFIDENCE.NONE,
      note: 'No migration calendar for this species',
    };
  }

  const isMigratingMonth = month && calendar.migratory_months.includes(month);

  return {
    status: isMigratingMonth ? 'likely_migratory' : 'likely_resident',
    home_range_cap_km2: isMigratingMonth ? homeRange.migratory : homeRange.resident,
    max_single_track_travel_m: isMigratingMonth
      ? Math.sqrt(homeRange.migratory) * 1000
      : Math.sqrt(homeRange.resident) * 1000,
    confidence: month ? CONFIDENCE.MEDIUM : CONFIDENCE.LOW,
    note: isMigratingMonth
      ? `${speciesKey} typically in transit this month. ${calendar.notes}`
      : `${speciesKey} likely on resident range this month. ${calendar.notes}`,
    source: SOURCE.INFERRED,
  };
}

function inferStride(speciesKey, gait) {
  const strides = STRIDE_FALLBACK[speciesKey];
  if (!strides) return null;

  const gaitKey = gait ?? 'walk';
  const range = strides[gaitKey] ?? strides['walk'];
  if (!range) return null;

  const mean = Number(((range[0] + range[1]) / 2).toFixed(3));
  return {
    value: mean,
    range_m: range,
    gait: gaitKey,
    source: SOURCE.INFERRED,
    confidence: CONFIDENCE.LOW,
    note: `Stride inferred from ${speciesKey} ${gaitKey} range (Elbroch/field guide). Enter measured stride for better accuracy.`,
  };
}

function parsedTrackSize(speciesKey, rawProfiles) {
  const p = rawProfiles[speciesKey];
  if (!p?.track_size_cm) return null;

  function parseRange(str) {
    if (typeof str === 'number') return str;
    if (typeof str === 'string') {
      const parts = str.split('-').map(Number);
      if (parts.length === 2 && parts.every(Number.isFinite)) {
        return Number(((parts[0] + parts[1]) / 2).toFixed(1));
      }
    }
    return null;
  }

  const front = parseRange(p.track_size_cm.front ?? p.track_size_cm.front_cm);
  const rear  = parseRange(p.track_size_cm.rear  ?? p.track_size_cm.hind ?? p.track_size_cm.hind_cm);

  return {
    front_cm: front,
    rear_cm:  rear,
    front_range: p.track_size_cm.front,
    rear_range:  p.track_size_cm.rear ?? p.track_size_cm.hind,
    source: SOURCE.DEFAULT,
    confidence: CONFIDENCE.MEDIUM,
  };
}

export function resolveInputs(schemaInput, speciesProfiles) {
  const resolved = JSON.parse(JSON.stringify(schemaInput));
  const inferences = [];
  const warnings   = [];

  const speciesKey = schemaInput.species?.value;
  const profile    = speciesKey ? speciesProfiles[speciesKey] : null;
  const localHour  = schemaInput.local_hour?.value;
  const month      = schemaInput.timestamp
    ? new Date(schemaInput.timestamp).getMonth() + 1
    : null;

  // 1. Activity prior from species + time of day + season
  if (localHour !== null && localHour !== undefined) {
    const prior = getActivityPrior(speciesKey, localHour, month);
    if (prior) {
      resolved.activity_prior = prior;
      inferences.push(`activity_prior: ${prior.expected_behavior} (${prior.movement_likelihood} movement likelihood)`);
    }
  }

  // 2. Migration status — sets home range cap
  if (speciesKey) {
    const migration = getMigrationStatus(speciesKey, month);
    resolved.migration_status = migration;
    if (migration.status !== 'unknown') {
      inferences.push(`migration_status: ${migration.status} — home range cap ${migration.home_range_cap_km2} km2`);
    }
  }

  // 3. Stride inference from species profile if missing
  if (schemaInput.stride?.missing && speciesKey) {
    const gait = schemaInput.gait?.value;
    const inferred = inferStride(speciesKey, gait);
    if (inferred) {
      resolved.stride = {
        value:      inferred.value,
        source:     inferred.source,
        confidence: inferred.confidence,
        missing:    false,
        inferred_note: inferred.note,
      };
      inferences.push(`stride: ${inferred.value}m inferred from ${speciesKey} ${inferred.gait} gait range`);
    }
  }

  // 4. Track size from profile (parsed to numbers)
  if (speciesKey && speciesProfiles[speciesKey]) {
    const size = parsedTrackSize(speciesKey, speciesProfiles);
    if (size) {
      resolved.track_size = size;
    }
  }

  // 5. Substrate fallback from species terrain preference
  if (schemaInput.substrate?.missing && profile?.terrain_intelligence) {
    const ti = profile.terrain_intelligence;
    let inferredSubstrate = null;
    if (ti.water_edge_weight > 0.25) inferredSubstrate = 'wetland_edge';
    else if (ti.cover_weight > 0.40)  inferredSubstrate = 'leaf_litter';
    else if (ti.open_ground_weight > 0.40) inferredSubstrate = 'packed_dirt';

    if (inferredSubstrate) {
      resolved.substrate = {
        value:      inferredSubstrate,
        source:     SOURCE.INFERRED,
        confidence: CONFIDENCE.LOW,
        missing:    false,
        inferred_note: `Substrate inferred from ${speciesKey} terrain preference weights. Very low confidence — enter actual substrate.`,
      };
      inferences.push(`substrate: ${inferredSubstrate} inferred from species terrain weights (low confidence)`);
    }
  }

  // 6. Decay correction with all resolved values
  const substrate  = resolved.substrate?.value;
  const freshness  = resolved.freshness?.value;
  const weather    = resolved.weather?.value;
  const temp       = resolved.temperature?.value;
  const sun        = resolved.sun?.value;
  const isWet      = resolved.is_wet?.value;

  if (substrate && freshness !== null && freshness !== undefined) {
    const corrected = correctFreshnessForSubstrate({ rawFreshness: freshness, substrate, weather, temp, sun, isWet });
    const ageEst    = estimateAgeHours({ rawFreshness: freshness, substrate, weather, temp, sun, isWet });

    resolved.decay_correction = {
      corrected_freshness:    corrected.corrected_freshness,
      combined_multiplier:    corrected.combined_multiplier,
      age_estimate_hours:     ageEst.estimated_age_label,
      age_confidence:         ageEst.confidence,
      is_timestamp:           ageEst.is_timestamp,
      frost_timestamp:        ageEst.frost_timestamp,
      note:                   corrected.age_adjustment_note,
      source:                 SOURCE.INFERRED,
    };
    inferences.push(`decay_correction: freshness ${freshness} → ${corrected.corrected_freshness} (${ageEst.estimated_age_label})`);

    // 7. Travel distance correction with home range cap
    const rawStride = resolved.stride?.value;
    if (rawStride) {
      const rawDist = Math.max(10, rawStride * 400 * Math.max(0.2, 1 - freshness));
      const correctedDist = correctTravelDistance({ rawDistanceM: rawDist, rawFreshness: freshness, substrate, weather, temp, sun, isWet });

      const migrationCap = resolved.migration_status?.max_single_track_travel_m;
      const cappedDist   = migrationCap
        ? Math.min(correctedDist.corrected_distance_m, migrationCap)
        : correctedDist.corrected_distance_m;

      const wasCapped = migrationCap && correctedDist.corrected_distance_m > migrationCap;

      resolved.travel_estimate = {
        raw_distance_m:       Number(rawDist.toFixed(1)),
        corrected_distance_m: Number(cappedDist.toFixed(1)),
        capped_by_home_range: wasCapped,
        home_range_cap_m:     migrationCap ? Number(migrationCap.toFixed(0)) : null,
        source:               SOURCE.INFERRED,
        note: wasCapped
          ? `Corrected distance capped at home range boundary for ${resolved.migration_status?.status} ${speciesKey}`
          : correctedDist.note,
      };
      inferences.push(`travel_estimate: ${rawDist.toFixed(0)}m raw → ${cappedDist.toFixed(0)}m corrected${wasCapped ? ' (home range capped)' : ''}`);
    }
  }

  // 8. Follow priority adjustment from activity prior
  if (resolved.activity_prior?.follow_boost) {
    resolved.follow_priority_adjustment = {
      boost:  resolved.activity_prior.follow_boost,
      reason: resolved.activity_prior.note,
      source: SOURCE.INFERRED,
    };
  }

  // 9. Null guard — flag any fields still missing that engine needs
  const engineRequires = ['freshness', 'substrate', 'gait'];
  const stillMissing = engineRequires.filter(f => resolved[f]?.missing);
  if (stillMissing.length) {
    warnings.push(`Engine fields still unresolved: ${stillMissing.join(', ')} — evaluators will degrade gracefully`);
  }

  resolved.resolution_meta = {
    inferences,
    warnings,
    species_profile_used: Boolean(profile),
    migration_calendar_used: Boolean(resolved.migration_status?.status !== 'unknown'),
    decay_correction_applied: Boolean(resolved.decay_correction),
    travel_estimate_capped: resolved.travel_estimate?.capped_by_home_range ?? false,
  };

  return resolved;
}

export { getActivityPrior, getMigrationStatus, inferStride, MIGRATION_CALENDAR, HOME_RANGE, STRIDE_FALLBACK };
