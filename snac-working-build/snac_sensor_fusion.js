import { SOURCE, CONFIDENCE } from './snac_input_schema.js';

// =============================================================================
// SNAC Field Intelligence - Phase 3.6
// snac_sensor_fusion.js
// Signal priority ladder and conflict resolution
// =============================================================================
//
// PURPOSE:
// By the end of the Phase 3 chain, multiple modules have produced outputs that
// can disagree. This module receives all upstream outputs and resolves conflicts
// using an explicit priority ladder. It emits a single fused context object
// that Phase 2 evaluators can consume without needing to know which signal won.
//
// PHILOSOPHY:
// Do not average conflicting signals. Averaging produces wrong answers that
// look plausible. Instead, identify which signal has higher epistemic authority
// for each contested field, explain the conflict, and emit the winning value
// with an honest confidence score. Always tell the tracker what disagreed.
//
// PRIORITY LADDER (highest to lowest):
// 1. Hard physical timestamps (frost, fresh snow) - cannot be argued with
// 2. Substrate decay correction - math applied to measured physical evidence
// 3. Species profile constraints (home range cap, migration status)
// 4. Weather behavioral priors - current conditions from Open-Meteo
// 5. Hunting pressure adjustments - user-declared, high local knowledge
// 6. Activity prior from time-of-day - species pattern, lowest priority signal
// 7. User-declared values - trusted but can be wrong (misread track age etc.)
//
// Note: Rut override (from 3.3 and 3.5) suspends activity priors and some
// pressure effects - it is an exception handled explicitly, not via ladder.
//
// =============================================================================

// Numeric confidence for comparison arithmetic
const CONF_RANK = {
  high:   3,
  medium: 2,
  low:    1,
  none:   0,
};

function rankOf(conf) {
  return CONF_RANK[conf] ?? 0;
}

// Convert numeric confidence rank back to label
function rankToLabel(n) {
  if (n >= 3) return CONFIDENCE.HIGH;
  if (n >= 2) return CONFIDENCE.MEDIUM;
  if (n >= 1) return CONFIDENCE.LOW;
  return CONFIDENCE.NONE;
}

// =============================================================================
// FRESHNESS CONFLICT RESOLUTION
// =============================================================================
// User declares freshness 0-10. Substrate decay emits age_hours_min/max.
// These can disagree badly. Rules:
//   - Hard timestamp (frost/snow) wins unconditionally.
//   - If decay correction ran and has medium+ confidence, it wins over user.
//   - If decay correction has low/no confidence, user value is preserved with
//     a warning that decay data was insufficient.
//   - Flag the gap if user and decay differ by more than 2x estimated hours.

function resolveFreshness(resolved, pressureResult, conflicts, warnings) {
  const userFreshness = resolved.freshness;
  const decayCorrection = resolved.decay_correction;
  const hardTimestamp = resolved.hard_timestamp;

  const fused = {
    freshness_raw:   userFreshness?.value ?? null,
    source:          userFreshness?.source ?? SOURCE.MISSING,
    confidence:      userFreshness?.confidence ?? CONFIDENCE.NONE,
    age_hours_min:   null,
    age_hours_max:   null,
    age_hours_mid:   null,
    age_note:        null,
    timestamp_type:  null,
    conflict:        false,
    conflict_note:   null,
  };

  // Hard timestamp wins unconditionally
  if (hardTimestamp?.type === 'frost') {
    fused.age_hours_min  = hardTimestamp.age_floor_hours ?? null;
    fused.age_hours_max  = null; // open-ended - could be hours or days before frost
    fused.age_hours_mid  = fused.age_hours_min;
    fused.timestamp_type = 'frost';
    fused.source         = SOURCE.INFERRED;
    fused.confidence     = CONFIDENCE.HIGH;
    fused.age_note       = 'Track predates last frost. Age floor is time since freeze.';
    // Check if user freshness contradicts
    if (userFreshness?.value !== null && userFreshness?.value > 7) {
      fused.conflict      = true;
      fused.conflict_note = `User declared freshness ${userFreshness.value}/10 (very fresh) but frost timestamp requires track age >= ${fused.age_hours_min}h. Frost timestamp wins.`;
      conflicts.push('freshness_vs_frost');
    }
    return fused;
  }

  if (hardTimestamp?.type === 'fresh_snow') {
    fused.age_hours_min  = 0;
    fused.age_hours_max  = hardTimestamp.max_hours ?? 2;
    fused.age_hours_mid  = 1;
    fused.timestamp_type = 'fresh_snow';
    fused.source         = SOURCE.INFERRED;
    fused.confidence     = CONFIDENCE.HIGH;
    fused.age_note       = 'Fresh snow layer. Track made after snowfall - 0-2 hour window.';
    return fused;
  }

  // No hard timestamp - use decay correction if available
  if (decayCorrection?.age_hours_min !== undefined && decayCorrection?.age_hours_max !== undefined) {
    const decayConf = decayCorrection.confidence ?? CONFIDENCE.LOW;
    const decayRank = rankOf(decayConf);

    fused.age_hours_min  = decayCorrection.age_hours_min;
    fused.age_hours_max  = decayCorrection.age_hours_max;
    fused.age_hours_mid  = ((decayCorrection.age_hours_min + decayCorrection.age_hours_max) / 2);
    fused.timestamp_type = 'decay_corrected';
    fused.age_note       = decayCorrection.note ?? null;

    if (decayRank >= rankOf(CONFIDENCE.MEDIUM)) {
      fused.source     = SOURCE.INFERRED;
      fused.confidence = decayConf;

      // Check if user freshness conflicts significantly
      const userHoursApprox = userFreshness?.value !== null
        ? Math.round((10 - (userFreshness.value ?? 5)) * 12) // 10=0h, 5=60h, 0=120h rough map
        : null;

      if (userHoursApprox !== null && fused.age_hours_mid !== null) {
        const ratio = Math.max(userHoursApprox, fused.age_hours_mid) /
                      Math.max(1, Math.min(userHoursApprox, fused.age_hours_mid));
        if (ratio > 2.5) {
          fused.conflict      = true;
          fused.conflict_note = `User freshness (${userFreshness.value}/10, ~${userHoursApprox}h) conflicts with substrate decay estimate (${fused.age_hours_min}-${fused.age_hours_max}h). Decay correction wins - substrate conditions explain the discrepancy.`;
          conflicts.push('freshness_user_vs_decay');
          warnings.push(fused.conflict_note);
        }
      }
    } else {
      // Decay ran but low confidence - preserve user value, note decay
      fused.source     = userFreshness?.source ?? SOURCE.USER;
      fused.confidence = userFreshness?.confidence ?? CONFIDENCE.LOW;
      warnings.push('Substrate decay ran but low confidence - user freshness value preserved. Check substrate conditions.');
    }
  } else {
    // No decay correction available - keep user value as-is
    fused.source     = userFreshness?.source ?? SOURCE.USER;
    fused.confidence = userFreshness?.confidence ?? CONFIDENCE.NONE;
    if (userFreshness?.missing) {
      warnings.push('Freshness not declared and no decay correction available - age estimate unavailable.');
    }
  }

  // Apply hunting pressure track-fresh-enough gate on top
  if (pressureResult?.track_fresh_enough === false && fused.confidence !== CONFIDENCE.NONE) {
    fused.age_note = (fused.age_note ? fused.age_note + ' ' : '') +
      'Track too old for morning window to apply.';
  }

  return fused;
}

// =============================================================================
// MOVEMENT LIKELIHOOD CONFLICT RESOLUTION
// =============================================================================
// Weather priors give a movement score. Hunting pressure modifies it.
// Activity prior (time-of-day) gives another score. These three can conflict.
// Rules:
//   - Rut override suspends time-of-day activity prior for ungulates (Nov-Dec)
//   - Hunting pressure penalty is applied to weather score after rut check
//   - Activity prior is advisory unless rut is active
//   - If weather says high movement but activity says bedding -> flag, weather wins
//   - If pressure says fully nocturnal and weather says peak movement -> flag both,
//     note that pressure effect likely dominates

function resolveMovementLikelihood(resolved, weatherResult, pressureResult, conflicts, warnings) {
  const activityPrior   = resolved.activity_prior;
  const isRutOverride   = resolved.rut_override ?? false;

  // Base movement score from weather
  const weatherScore    = weatherResult?.movement_likelihood ?? null;
  const weatherLabel    = weatherResult?.movement_label ?? null;

  // Modified prior from pressure module
  const modifiedActivity = pressureResult?.modified_activity_prior ?? null;
  const modifiedWeather  = pressureResult?.modified_weather_prior ?? null;
  const nocturnalShift   = pressureResult?.nocturnal_shift ?? 0;
  const patternChange    = pressureResult?.pattern_change ?? null;
  const rutOverrideActive = pressureResult?.rut_override ?? false;

  const fused = {
    weather_movement_score:      weatherScore,
    weather_movement_label:      weatherLabel,
    activity_prior_label:        activityPrior?.label ?? null,
    activity_prior_follow_boost: activityPrior?.follow_boost ?? null,
    nocturnal_shift:             nocturnalShift,
    pattern_change:              patternChange,
    rut_override_active:         isRutOverride || rutOverrideActive,
    effective_movement_label:    null,
    effective_follow_boost:      null,
    conflict:                    false,
    conflict_note:               null,
    notes:                       [],
  };

  // Rut override - suspends time-of-day activity prior
  if (fused.rut_override_active) {
    fused.activity_prior_label = null;
    fused.activity_prior_follow_boost = null;
    fused.notes.push('Rut active - time-of-day activity prior suspended. Animals move at any hour.');
  }

  // Conflict: weather says high movement but activity says bedding
  if (
    !fused.rut_override_active &&
    weatherScore !== null && weatherScore > 0.65 &&
    activityPrior?.label === 'bedding'
  ) {
    fused.conflict      = true;
    fused.conflict_note = `Weather conditions favor movement (score ${(weatherScore * 100).toFixed(0)}%) but time-of-day prior suggests bedding. Weather score applies to potential - animal behavior at this hour leans bedding. Both signals are valid; consider that the animal may have moved recently and is now bedded.`;
    conflicts.push('weather_vs_activity_bedding');
    warnings.push(fused.conflict_note);
  }

  // Conflict: heavy pressure says fully nocturnal but weather says peak movement
  if (patternChange === 'full_nocturnal' && weatherScore !== null && weatherScore > 0.7) {
    fused.conflict      = true;
    fused.conflict_note = (fused.conflict_note ? fused.conflict_note + ' | ' : '') +
      `Heavy hunting pressure has shifted species to full nocturnal behavior. High weather movement score (${(weatherScore * 100).toFixed(0)}%) applies but animals likely moving only in darkness. Daylight follow has low probability of intercept.`;
    if (!conflicts.includes('pressure_nocturnal_vs_weather')) {
      conflicts.push('pressure_nocturnal_vs_weather');
    }
    warnings.push('Nocturnal shift and high weather movement score conflict - pressure effect dominates for daylight hunting.');
  }

  // Effective movement label - use modified weather label from pressure module if available
  fused.effective_movement_label = modifiedWeather?.movement_label ?? weatherLabel;

  // Effective follow boost - activity prior applies unless rut or bedding conflict
  if (fused.rut_override_active) {
    fused.effective_follow_boost = 0.1; // slight positive - rut drives movement
  } else if (fused.conflict && conflicts.includes('weather_vs_activity_bedding')) {
    fused.effective_follow_boost = -0.15; // bedding wins for follow priority
    fused.notes.push('Follow priority reduced - midday bedding likely despite favorable weather.');
  } else {
    fused.effective_follow_boost = modifiedActivity?.follow_boost ?? activityPrior?.follow_boost ?? 0;
  }

  // Pressure notes pass through
  if (pressureResult?.notes?.length) {
    fused.notes.push(...pressureResult.notes);
  }

  return fused;
}

// =============================================================================
// TRAVEL ESTIMATE CONFLICT RESOLUTION
// =============================================================================
// 3.3 applies home range cap to the decay-corrected distance.
// If travel estimate after cap is still implausibly high for the declared
// migration status, flag it. Also catch the case where user declares resident
// but travel implies migratory range.

function resolveTravelEstimate(resolved, conflicts, warnings) {
  const travel = resolved.travel_estimate;
  const migrationStatus = resolved.migration_status;
  const homeRangeCap = travel?.home_range_cap_m ?? null;
  const cappedDist = travel?.corrected_m ?? null;
  const wasCapped = travel?.capped_by_home_range ?? false;

  const fused = {
    travel_m:              cappedDist,
    was_capped:            wasCapped,
    cap_m:                 homeRangeCap,
    migration_status:      migrationStatus?.status ?? 'unknown',
    source:                travel?.source ?? SOURCE.MISSING,
    confidence:            travel ? CONFIDENCE.MEDIUM : CONFIDENCE.NONE,
    conflict:              false,
    conflict_note:         null,
  };

  if (!travel || cappedDist === null) {
    return fused;
  }

  // If not capped but distance is large relative to resident cap, flag it
  const speciesKey = resolved.species?.value;
  if (
    !wasCapped &&
    migrationStatus?.status === 'resident' &&
    homeRangeCap !== null &&
    cappedDist > homeRangeCap * 0.8
  ) {
    fused.conflict      = true;
    fused.conflict_note = `Travel estimate (${cappedDist.toFixed(0)}m) is near the resident home range cap (${homeRangeCap.toFixed(0)}m). Animal may be at edge of range or migration status inference may be wrong.`;
    conflicts.push('travel_near_resident_cap');
    warnings.push(fused.conflict_note);
  }

  // If distance was capped, note that for the tracker
  if (wasCapped) {
    fused.confidence   = CONFIDENCE.MEDIUM;
    fused.conflict     = true;
    fused.conflict_note = `Raw travel estimate exceeded ${migrationStatus?.status ?? ''} home range cap. Capped at ${homeRangeCap?.toFixed(0)}m. Substrate or stride data may be off, or animal is at range boundary.`;
    conflicts.push('travel_capped_by_home_range');
  }

  return fused;
}

// =============================================================================
// SPECIES CONFIDENCE FUSION
// =============================================================================
// Species confidence comes in from 3.2 (user-declared + source tag).
// It degrades through the chain with each uncertain inference.
// Accumulate all confidence penalties and emit a single species confidence.

function resolveSpeciesConfidence(resolved, pressureResult, conflicts, warnings) {
  const baseConf  = resolved.species?.confidence ?? CONFIDENCE.NONE;
  const baseRank  = rankOf(baseConf);
  const speciesSource = resolved.species?.source ?? SOURCE.MISSING;

  // Pressure penalty applies a fractional reduction
  const pressurePenalty = pressureResult?.confidence_penalty ?? 0;

  // Missing critical fields also reduce confidence
  const missingCritical = resolved.meta?.missing_critical ?? [];
  const missingPenaltyRank = Math.min(missingCritical.length, 2); // max -2 ranks

  // Resolution meta flags
  const profileUsed   = resolved.resolution_meta?.species_profile_used ?? false;
  const decayApplied  = resolved.resolution_meta?.decay_correction_applied ?? false;
  const migCalUsed    = resolved.resolution_meta?.migration_calendar_used ?? false;

  // Adjust rank
  let adjustedRank = baseRank - missingPenaltyRank;
  // Apply pressure penalty (0.0 to 0.20 -> reduce rank proportionally)
  adjustedRank = adjustedRank - Math.round(pressurePenalty * 4); // 0.20 penalty = -0.8 rank ~ -1
  adjustedRank = Math.max(0, Math.min(3, adjustedRank));

  const notes = [];
  if (missingCritical.length) {
    notes.push(`Missing critical inputs: ${missingCritical.join(', ')} - species confidence reduced.`);
  }
  if (pressurePenalty > 0.1) {
    notes.push(`Hunting pressure degraded species confidence by ${(pressurePenalty * 100).toFixed(0)}%.`);
  }

  return {
    species:          resolved.species?.value ?? null,
    source:           speciesSource,
    base_confidence:  baseConf,
    adjusted_confidence: rankToLabel(adjustedRank),
    profile_used:     profileUsed,
    decay_applied:    decayApplied,
    migration_calendar_used: migCalUsed,
    confidence_notes: notes,
  };
}

// =============================================================================
// MAIN FUSION FUNCTION
// =============================================================================
//
// Inputs:
//   resolved       - output of snac_inference_engine.js (enriched input object)
//   weatherResult  - output of scoreWeatherPriors() from snac_weather_priors.js
//   pressureResult - output of applyHuntingPressure() from snac_hunting_pressure.js
//
// Output:
//   fusedContext   - single resolved object ready for Phase 2 evaluators
//                    (3.7 confidence layers reads this; 3.8 wiring passes to engine)

export function fuseSignals(resolved = {}, weatherResult = {}, pressureResult = {}) {
  const conflicts = [];
  const warnings  = [...(resolved.resolution_meta?.warnings ?? [])];
  const inferences = [...(resolved.resolution_meta?.inferences ?? [])];

  // --- Run each fusion domain ---

  const fusedFreshness  = resolveFreshness(resolved, pressureResult, conflicts, warnings);

  const fusedMovement   = resolveMovementLikelihood(
    resolved, weatherResult, pressureResult, conflicts, warnings
  );

  const fusedTravel     = resolveTravelEstimate(resolved, conflicts, warnings);

  const fusedSpecies    = resolveSpeciesConfidence(resolved, pressureResult, conflicts, warnings);

  // --- Substrate pass-through (no conflict possible - 3.1 is authoritative) ---
  const substrateContext = {
    substrate:         resolved.substrate?.value ?? null,
    is_wet:            resolved.is_wet?.value ?? null,
    decay_multiplier:  resolved.decay_correction?.multiplier ?? 1.0,
    decay_confidence:  resolved.decay_correction?.confidence ?? CONFIDENCE.NONE,
  };

  // --- Migration status pass-through ---
  const migrationContext = {
    status:       resolved.migration_status?.status ?? 'unknown',
    month:        resolved.migration_status?.month ?? null,
    confidence:   resolved.migration_status?.confidence ?? CONFIDENCE.NONE,
    notes:        resolved.migration_status?.note ?? null,
  };

  // --- Stride / gait pass-through (3.3 inferred, no conflict resolution needed) ---
  const gaitmContext = {
    gait:        resolved.gait?.value ?? null,
    stride_m:    resolved.stride?.value ?? null,
    stride_note: resolved.inferred_stride?.note ?? null,
  };

  // --- Overall data quality score ---
  // Completeness from 3.2 minus a conflict penalty
  const rawCompleteness  = resolved.meta?.completeness_score ?? 0;
  const conflictPenalty  = Math.min(conflicts.length * 0.05, 0.25);
  const fusedCompleteness = Math.max(0, rawCompleteness - conflictPenalty);

  // --- Capability flags pass-through from 3.2 ---
  const capabilities = {
    can_run_decay_correction: resolved.meta?.can_run_decay_correction ?? false,
    can_run_time_priors:      resolved.meta?.can_run_time_priors ?? false,
    can_run_vision:           resolved.meta?.can_run_vision ?? false,
    can_identify_species:     resolved.meta?.can_identify_species ?? false,
  };

  // --- Assemble fused context ---
  const fusedContext = {
    // Species
    species:           fusedSpecies,

    // Freshness and age
    freshness:         fusedFreshness,

    // Movement and activity
    movement:          fusedMovement,

    // Travel estimate
    travel:            fusedTravel,

    // Environmental context (no conflict - authoritative sources)
    substrate:         substrateContext,
    migration:         migrationContext,
    gait:              gaitmContext,

    // Environmental inputs for evaluators
    near_water:        resolved.near_water?.value ?? null,
    on_ridge:          resolved.on_ridge?.value ?? null,
    dense_cover:       resolved.dense_cover?.value ?? null,
    zone_tag:          resolved.zone_tag?.value ?? null,
    light_phase:       resolved.light_phase?.value ?? null,
    local_hour:        resolved.local_hour?.value ?? null,
    sign_tags:         resolved.sign_tags?.value ?? [],
    field_notes:       resolved.field_notes?.value ?? null,
    photo_uri:         resolved.photo_uri?.value ?? null,

    // Fusion meta
    fusion_meta: {
      conflicts,
      warnings,
      inferences,
      conflict_count:         conflicts.length,
      warning_count:          warnings.length,
      data_completeness:      fusedCompleteness,
      capabilities,
      priority_ladder_applied: true,
    },
  };

  return fusedContext;
}

// =============================================================================
// CONVENIENCE: build a flat input object for Phase 2 evaluators
// =============================================================================
// The Phase 2 engine (snac_master_deduped.js) expects a specific shape.
// This flattens fusedContext into that shape so 3.8 wiring is straightforward.

export function flattenForEvaluators(fusedContext) {
  const f = fusedContext;

  return {
    // Species
    speciesOverride:  f.species?.species ?? null,
    confidence:       rankOf(f.species?.adjusted_confidence ?? CONFIDENCE.NONE) / 3, // normalize 0-1

    // Freshness
    freshness:        f.freshness?.freshness_raw ?? null,
    ageHoursMin:      f.freshness?.age_hours_min ?? null,
    ageHoursMax:      f.freshness?.age_hours_max ?? null,

    // Gait / movement
    gait:             f.gait?.gait ?? null,
    strideM:          f.gait?.stride_m ?? null,

    // Substrate
    substrate:        f.substrate?.substrate ?? null,
    isWet:            f.substrate?.is_wet ?? null,

    // Travel
    travelM:          f.travel?.travel_m ?? null,

    // Activity and movement
    movementLabel:    f.movement?.effective_movement_label ?? null,
    followBoost:      f.movement?.effective_follow_boost ?? 0,
    rutActive:        f.movement?.rut_override_active ?? false,
    nocturnalShift:   f.movement?.nocturnal_shift ?? 0,

    // Environment
    nearWater:        f.near_water ?? null,
    onRidge:          f.on_ridge ?? null,
    denseCover:       f.dense_cover ?? null,
    zoneTag:          f.zone_tag ?? null,
    lightPhase:       f.light_phase ?? null,
    localHour:        f.local_hour ?? null,
    signTags:         f.sign_tags ?? [],
    migrationStatus:  f.migration?.status ?? 'unknown',

    // Meta
    dataCompleteness: f.fusion_meta?.data_completeness ?? 0,
    conflictCount:    f.fusion_meta?.conflict_count ?? 0,
    conflictWarnings: f.fusion_meta?.warnings ?? [],
    capabilities:     f.fusion_meta?.capabilities ?? {},
  };
}

// =============================================================================
// CONVENIENCE: human-readable fusion summary for results screen
// =============================================================================

export function fusionSummary(fusedContext) {
  const f = fusedContext;
  const lines = [];

  if (f.freshness?.conflict) {
    lines.push(`Age conflict: ${f.freshness.conflict_note}`);
  }
  if (f.movement?.conflict) {
    lines.push(`Movement conflict: ${f.movement.conflict_note}`);
  }
  if (f.travel?.conflict) {
    lines.push(`Travel conflict: ${f.travel.conflict_note}`);
  }
  if (f.fusion_meta?.warnings?.length) {
    f.fusion_meta.warnings.forEach(w => {
      if (!lines.includes(w)) lines.push(w);
    });
  }

  return {
    has_conflicts:     f.fusion_meta?.conflict_count > 0,
    conflict_count:    f.fusion_meta?.conflict_count ?? 0,
    data_completeness: f.fusion_meta?.data_completeness ?? 0,
    species_confidence: f.species?.adjusted_confidence ?? CONFIDENCE.NONE,
    age_estimate:      f.freshness?.age_hours_min !== null
      ? `${f.freshness.age_hours_min}-${f.freshness.age_hours_max ?? '?'}h`
      : null,
    movement_label:    f.movement?.effective_movement_label ?? null,
    follow_boost:      f.movement?.effective_follow_boost ?? 0,
    notes:             lines,
  };
}

export { CONF_RANK };
