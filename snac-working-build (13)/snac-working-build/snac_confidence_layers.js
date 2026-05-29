import { SOURCE, CONFIDENCE } from './snac_input_schema.js';
import { CONF_RANK } from './snac_sensor_fusion.js';

// =============================================================================
// SNAC Field Intelligence - Phase 3.7
// snac_confidence_layers.js
// Layered confidence architecture + species probability list
// =============================================================================
//
// PURPOSE:
// Phase 2 emits one number. That is not honest. A result can be high
// confidence on species ID and low confidence on track age at the same time.
// A tracker needs to know which part of the answer to trust.
//
// This module produces four independent confidence layers:
//
//   SPECIES   - How sure are we this is the right animal?
//   FRESHNESS - How sure are we of the track age estimate?
//   BEHAVIOR  - How sure are we of the behavioral classification?
//   SUBSTRATE - How sure are we the substrate correction is valid?
//
// And one ranked output:
//
//   PROBABILITY LIST - Ranked candidate species with % likelihood
//
// Each layer scores 0.0-1.0, labeled high/medium/low/none.
// Each layer carries an evidence list showing what raised or lowered it.
// Layers are never averaged into a single number.
// Unknown species -> graceful track-only mode. No zero. No fake probabilities.
//
// =============================================================================

// Rut months by species - when behavioral prediction degrades
// and freshness confidence gets a boost (animal definitely moving)
const RUT_MONTHS = {
  blacktail_deer:    [11, 12],
  white_tailed_deer: [11, 12],
  mule_deer:         [11, 12],
  elk:               [9, 10],
  moose:             [9, 10],
  caribou:           [10, 11],
  bighorn_sheep:     [11, 12],
  mountain_goat:     [11, 12],
  pronghorn:         [9, 10],
  red_deer:          [9, 10],
  roe_deer:          [7, 8],
  sika_deer:         [10, 11],
  fallow_deer:       [10, 11],
  wild_boar:         [11, 12],
  feral_pig:         [11, 12],
};

// Heavy animal flag - these species press into most substrates regardless
// Standard substrate confidence penalty is bypassed for these
const HEAVY_ANIMAL = new Set([
  'moose', 'elk', 'caribou', 'grizzly_bear', 'black_bear',
  'african_elephant', 'black_rhino', 'african_buffalo',
  'horse', 'cattle', 'donkey',
]);

// Ambiguous species pairs - where track alone cannot reliably distinguish
// Engine flags these rather than forcing a call
const AMBIGUOUS_PAIRS = [
  { keys: ['black_bear', 'grizzly_bear'],    reason: 'Size overlap 13-18cm - claw pattern and geography needed' },
  { keys: ['gray_wolf', 'coyote'],           reason: 'Size overlap in some regions - track > 9cm favors wolf' },
  { keys: ['bobcat', 'canada_lynx'],         reason: 'Paw size similar - habitat and range dependent' },
  { keys: ['blacktail_deer', 'mule_deer'],   reason: 'Hybridize and overlap in range - metatarsal gland key' },
  { keys: ['mountain_lion', 'jaguar'],       reason: 'Geographic range overlap in Southwest - size key' },
  { keys: ['coyote', 'domestic_dog'],        reason: 'Size overlap common - gait pattern and habitat key' },
];

// Fallback confidence defaults for major game
// Used when species profile lacks specific fields
// Covers what Phase 4 enrichment will eventually formalize
const SPECIES_DEFAULTS = {
  blacktail_deer:    { trackSizeFront: [6,8],    knownGaits: ['walk','trot','bound'],           confirmingSign: ['rubs','beds','browse','scat'], behaviorPredictability: 0.70, flightOrForage: 'mixed',  groupBehavior: 'pair'     },
  white_tailed_deer: { trackSizeFront: [5.5,8],  knownGaits: ['walk','trot','bound'],           confirmingSign: ['rubs','beds','browse','scat'], behaviorPredictability: 0.70, flightOrForage: 'mixed',  groupBehavior: 'pair'     },
  mule_deer:         { trackSizeFront: [6,8],    knownGaits: ['walk','bound','trot'],           confirmingSign: ['rubs','beds','browse'],        behaviorPredictability: 0.65, flightOrForage: 'mixed',  groupBehavior: 'pair'     },
  elk:               { trackSizeFront: [9,13],   knownGaits: ['walk','trot','gallop'],          confirmingSign: ['rubs','beds','scat','trail'],  behaviorPredictability: 0.65, flightOrForage: 'forage', groupBehavior: 'herd'     },
  moose:             { trackSizeFront: [13,18],  knownGaits: ['walk','trot','gallop'],          confirmingSign: ['browse','beds','scat'],        behaviorPredictability: 0.60, flightOrForage: 'forage', groupBehavior: 'solitary', heavyAnimal: true },
  caribou:           { trackSizeFront: [10,13],  knownGaits: ['walk','trot','gallop'],          confirmingSign: ['trail','scat'],               behaviorPredictability: 0.55, flightOrForage: 'forage', groupBehavior: 'herd',    heavyAnimal: true },
  bighorn_sheep:     { trackSizeFront: [6,9],    knownGaits: ['walk','bound','trot'],           confirmingSign: ['scat','trail'],               behaviorPredictability: 0.65, flightOrForage: 'forage', groupBehavior: 'herd'     },
  mountain_goat:     { trackSizeFront: [6,8],    knownGaits: ['walk','bound','climb'],          confirmingSign: ['scat','trail'],               behaviorPredictability: 0.70, flightOrForage: 'forage', groupBehavior: 'pair'     },
  pronghorn:         { trackSizeFront: [7,9],    knownGaits: ['walk','trot','gallop'],          confirmingSign: ['scat','trail'],               behaviorPredictability: 0.60, flightOrForage: 'forage', groupBehavior: 'herd'     },
  black_bear:        { trackSizeFront: [10,18],  knownGaits: ['walk','amble','climb'],          confirmingSign: ['scat','browse','trail'],       behaviorPredictability: 0.55, flightOrForage: 'forage', groupBehavior: 'solitary', heavyAnimal: true, ambiguousWith: ['grizzly_bear'] },
  grizzly_bear:      { trackSizeFront: [13,20],  knownGaits: ['walk','amble','gallop'],         confirmingSign: ['scat','digging','trail'],      behaviorPredictability: 0.50, flightOrForage: 'forage', groupBehavior: 'solitary', heavyAnimal: true, ambiguousWith: ['black_bear'] },
  mountain_lion:     { trackSizeFront: [7,10],   knownGaits: ['walk','stalk','gallop'],         confirmingSign: ['scat','scrape','cache'],       behaviorPredictability: 0.30, flightOrForage: 'flight', groupBehavior: 'solitary' },
  gray_wolf:         { trackSizeFront: [9,12],   knownGaits: ['trot','lope','gallop'],          confirmingSign: ['scat','trail','predator'],     behaviorPredictability: 0.55, flightOrForage: 'flight', groupBehavior: 'herd',    ambiguousWith: ['coyote','domestic_dog'] },
  coyote:            { trackSizeFront: [5,7.5],  knownGaits: ['trot','lope','bound'],           confirmingSign: ['scat','trail'],               behaviorPredictability: 0.60, flightOrForage: 'mixed',  groupBehavior: 'pair',    ambiguousWith: ['gray_wolf','domestic_dog'] },
  bobcat:            { trackSizeFront: [5,6.5],  knownGaits: ['walk','trot','bound','stalk'],   confirmingSign: ['scat','scrape'],              behaviorPredictability: 0.45, flightOrForage: 'flight', groupBehavior: 'solitary', ambiguousWith: ['canada_lynx'] },
  wolverine:         { trackSizeFront: [8,11],   knownGaits: ['lope','bound','walk'],           confirmingSign: ['scat','trail'],               behaviorPredictability: 0.40, flightOrForage: 'mixed',  groupBehavior: 'solitary' },
  fisher:            { trackSizeFront: [5,7],    knownGaits: ['lope','bound','walk'],           confirmingSign: ['scat','trail'],               behaviorPredictability: 0.45, flightOrForage: 'mixed',  groupBehavior: 'solitary' },
  red_fox:           { trackSizeFront: [4,6],    knownGaits: ['trot','lope','bound'],           confirmingSign: ['scat','trail'],               behaviorPredictability: 0.60, flightOrForage: 'mixed',  groupBehavior: 'pair'     },
  american_marten:   { trackSizeFront: [3.5,5],  knownGaits: ['bound','lope'],                  confirmingSign: ['scat','trail'],               behaviorPredictability: 0.50, flightOrForage: 'mixed',  groupBehavior: 'solitary' },
  raccoon:           { trackSizeFront: [5,8],    knownGaits: ['walk','trot'],                   confirmingSign: ['scat','water','trail'],        behaviorPredictability: 0.65, flightOrForage: 'forage', groupBehavior: 'pair'     },
  beaver:            { trackSizeFront: [6,8],    knownGaits: ['walk','waddle','swim'],          confirmingSign: ['water','browse','trail'],      behaviorPredictability: 0.75, flightOrForage: 'forage', groupBehavior: 'pair'     },
  river_otter:       { trackSizeFront: [6,8],    knownGaits: ['bound','slide'],                 confirmingSign: ['water','scat','trail'],        behaviorPredictability: 0.65, flightOrForage: 'forage', groupBehavior: 'pair'     },
  wild_turkey:       { trackSizeFront: [9,12],   knownGaits: ['walk','run'],                    confirmingSign: ['scat','trail','beds'],         behaviorPredictability: 0.70, flightOrForage: 'forage', groupBehavior: 'herd'     },
  snowshoe_hare:     { trackSizeFront: [4,5.5],  knownGaits: ['bound','hop'],                   confirmingSign: ['browse','scat','trail'],       behaviorPredictability: 0.65, flightOrForage: 'mixed',  groupBehavior: 'solitary' },
  lion:              { trackSizeFront: [15,20],  knownGaits: ['walk','stalk','gallop'],         confirmingSign: ['scat','scrape','cache'],       behaviorPredictability: 0.45, flightOrForage: 'flight', groupBehavior: 'herd'     },
  leopard:           { trackSizeFront: [8,11],   knownGaits: ['walk','stalk','gallop','climb'], confirmingSign: ['scat','scrape','cache'],       behaviorPredictability: 0.30, flightOrForage: 'flight', groupBehavior: 'solitary' },
  african_elephant:  { trackSizeFront: [40,60],  knownGaits: ['walk','amble'],                  confirmingSign: ['browse','trail','scat'],       behaviorPredictability: 0.65, flightOrForage: 'forage', groupBehavior: 'herd',    heavyAnimal: true },
  horse:             { trackSizeFront: [12,18],  knownGaits: ['walk','trot','gallop'],          confirmingSign: ['trail','scat'],               behaviorPredictability: 0.80, flightOrForage: 'forage', groupBehavior: 'herd',    heavyAnimal: true },
  cattle:            { trackSizeFront: [10,16],  knownGaits: ['walk','trot'],                   confirmingSign: ['trail','scat','browse'],       behaviorPredictability: 0.85, flightOrForage: 'forage', groupBehavior: 'herd',    heavyAnimal: true },
  domestic_dog:      { trackSizeFront: [3,12],   knownGaits: ['walk','trot','lope','gallop'],   confirmingSign: ['trail'],                      behaviorPredictability: 0.50, flightOrForage: 'mixed',  groupBehavior: 'pair',    ambiguousWith: ['coyote','gray_wolf'] },
  wild_boar:         { trackSizeFront: [5,9],    knownGaits: ['walk','trot','gallop'],          confirmingSign: ['rooting','scat','trail'],      behaviorPredictability: 0.60, flightOrForage: 'forage', groupBehavior: 'herd'     },
};

// =============================================================================
// HELPERS
// =============================================================================

function clamp(v) { return Math.max(0.0, Math.min(0.95, v)); }

function scoreToLabel(score) {
  if (score >= 0.70) return CONFIDENCE.HIGH;
  if (score >= 0.45) return CONFIDENCE.MEDIUM;
  if (score >= 0.15) return CONFIDENCE.LOW;
  return CONFIDENCE.NONE;
}

function rankOf(conf) { return CONF_RANK[conf] ?? 0; }

function currentMonth() { return new Date().getMonth() + 1; }

function isRutActive(speciesKey, month) {
  const months = RUT_MONTHS[speciesKey];
  if (!months) return false;
  return months.includes(month ?? currentMonth());
}

function isHeavyAnimal(speciesKey) {
  return HEAVY_ANIMAL.has(speciesKey) ||
    (SPECIES_DEFAULTS[speciesKey]?.heavyAnimal === true);
}

function getAmbiguousPair(speciesKey) {
  return AMBIGUOUS_PAIRS.find(p => p.keys.includes(speciesKey)) ?? null;
}

// =============================================================================
// LAYER 1: SPECIES CONFIDENCE
// =============================================================================

function scoreSpeciesLayer(fusedContext, phase2Output, speciesProfiles) {
  let score = 0.40;
  const evidence  = [];
  const penalties = [];

  const sp         = fusedContext.species;
  const speciesKey = sp?.species ?? null;
  const profile    = speciesKey ? (speciesProfiles?.[speciesKey] ?? null) : null;
  const defaults   = speciesKey ? (SPECIES_DEFAULTS[speciesKey] ?? null) : null;

  // No species - track-only mode
  if (!speciesKey) {
    return {
      score:      0,
      label:      CONFIDENCE.NONE,
      track_only: true,
      evidence:   [],
      penalties:  ['No species declared - running in track-only mode'],
      species_probability_list: [],
      ambiguous:  false,
      ambiguous_reason: null,
    };
  }

  // Profile found
  if (profile) {
    const declaredRank = rankOf(sp.base_confidence ?? CONFIDENCE.NONE);
    if (declaredRank >= 3)      { score += 0.25; evidence.push('Species declared, profile found, high confidence'); }
    else if (declaredRank >= 2) { score += 0.15; evidence.push('Species declared, profile found, medium confidence'); }
    else if (declaredRank >= 1) { score += 0.05; evidence.push('Species declared, profile found, low confidence'); }
    else                        { score += 0.08; evidence.push('Species declared, profile found'); }
  } else {
    score -= 0.15;
    penalties.push('Species declared but not in library - limited inference');
  }

  // Confirming sign tags
  const signTags   = fusedContext.sign_tags ?? [];
  const confirming = defaults?.confirmingSign ?? [];
  const matched    = signTags.filter(t => confirming.includes(t));
  if (matched.length > 0) {
    score += 0.05;
    evidence.push('Confirming sign: ' + matched.join(', '));
  }

  // Gait consistency
  const gaitDeclared = fusedContext.gait?.gait ?? null;
  const knownGaits   = profile?.gait_patterns ?? defaults?.knownGaits ?? [];
  if (gaitDeclared && knownGaits.length > 0) {
    if (knownGaits.includes(gaitDeclared)) {
      score += 0.05;
      evidence.push('Gait ' + gaitDeclared + ' consistent with species');
    } else {
      score -= 0.05;
      penalties.push('Gait ' + gaitDeclared + ' not typical for ' + speciesKey);
    }
  }

  // Migration calendar resolved
  if (fusedContext.migration?.status && fusedContext.migration.status !== 'unknown') {
    score += 0.05;
    evidence.push('Migration status resolved: ' + fusedContext.migration.status);
  }

  // Ambiguous pair penalty
  const ambPair = getAmbiguousPair(speciesKey);
  if (ambPair) {
    score -= 0.10;
    penalties.push('Ambiguous with ' + ambPair.keys.filter(k => k !== speciesKey).join('/') + ' - ' + ambPair.reason);
  }

  // Hunting pressure penalty
  const nocturnalShift = fusedContext.movement?.nocturnal_shift ?? 0;
  if (nocturnalShift >= 0.5) {
    score -= 0.10;
    penalties.push('Heavy hunting pressure reduced species confidence');
  } else if (nocturnalShift >= 0.2) {
    score -= 0.05;
    penalties.push('Moderate hunting pressure reduced species confidence');
  }

  // Conflict penalty
  const conflicts = fusedContext.fusion_meta?.conflicts ?? [];
  const critConf  = conflicts.filter(c => c.includes('species') || c.includes('freshness')).length;
  if (critConf > 0) {
    score -= Math.min(critConf * 0.05, 0.15);
    penalties.push(critConf + ' critical signal conflict(s) affecting species confidence');
  }

  const finalScore = clamp(score);
  return {
    score:    finalScore,
    label:    scoreToLabel(finalScore),
    track_only: false,
    evidence,
    penalties,
    species_probability_list: buildProbabilityList(fusedContext, phase2Output),
    ambiguous: !!ambPair,
    ambiguous_reason: ambPair?.reason ?? null,
  };
}

// =============================================================================
// SPECIES PROBABILITY LIST
// =============================================================================
// Ranked candidates with % probability.
// User declaration anchors the top slot.
// Engine conflict flagged, not silently overridden.

function buildProbabilityList(fusedContext, phase2Output) {
  const declaredKey  = fusedContext.species?.species ?? null;
  const declaredRank = rankOf(fusedContext.species?.base_confidence ?? CONFIDENCE.NONE);
  const signTags     = fusedContext.sign_tags ?? [];
  const gait         = fusedContext.gait?.gait ?? null;
  const month        = currentMonth();
  const p2Species    = phase2Output?.species_detected ?? [];

  const candidates = [];

  for (const [key, def] of Object.entries(SPECIES_DEFAULTS)) {
    let raw = 0.10;

    // Sign tag match
    const signMatch = signTags.filter(t => def.confirmingSign?.includes(t)).length;
    raw += signMatch * 0.08;

    // Gait match
    if (gait && def.knownGaits?.includes(gait)) raw += 0.10;

    // Rut active - slight boost (more movement = more sign)
    if (isRutActive(key, month)) raw += 0.05;

    // User declaration anchor
    if (key === declaredKey) {
      if (declaredRank >= 3)      raw += 0.60;
      else if (declaredRank >= 2) raw += 0.45;
      else if (declaredRank >= 1) raw += 0.25;
      else                        raw += 0.15;
    }

    // Phase 2 species_detected match
    if (p2Species.includes(key)) raw += 0.15;

    candidates.push({ key, raw });
  }

  // Normalize to 1.0 then take top 5
  const total      = candidates.reduce((s, c) => s + c.raw, 0) || 1;
  const normalized = candidates
    .map(c => ({ ...c, probability: c.raw / total }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);

  // Flag engine conflict: if declared species is not top after anchoring
  const topKey = normalized[0]?.key;
  const declaredProb   = normalized.find(c => c.key === declaredKey)?.probability ?? 0;
  const topProb        = normalized[0]?.probability ?? 0;
  const engineConflict = declaredKey && topKey !== declaredKey && topProb > declaredProb * 1.5;

  return normalized.map(c => ({
    species_key: c.key,
    label:       SPECIES_DEFAULTS[c.key] ? (c.key.replace(/_/g, ' ')) : c.key,
    probability: Math.round(c.probability * 100),
    engine_conflict: engineConflict && c.key === topKey
      ? 'Engine scored ' + topKey.replace(/_/g, ' ') + ' higher than declared species based on sign and gait'
      : null,
  }));
}

// =============================================================================
// LAYER 2: FRESHNESS CONFIDENCE
// =============================================================================

function scoreFreshnessLayer(fusedContext) {
  let score = 0.35;
  const evidence  = [];
  const penalties = [];

  const freshness  = fusedContext.freshness;
  const speciesKey = fusedContext.species?.species ?? null;
  const rutActive  = isRutActive(speciesKey, currentMonth());

  // Hard timestamps
  if (freshness?.timestamp_type === 'frost') {
    score = 0.82;
    evidence.push('Frost hard timestamp - age floor established');
  } else if (freshness?.timestamp_type === 'fresh_snow') {
    score = 0.90;
    evidence.push('Fresh snow timestamp - 0-2 hour window, very high confidence');
  } else if (freshness?.timestamp_type === 'decay_corrected') {
    const dc = freshness.confidence ?? CONFIDENCE.LOW;
    if (dc === CONFIDENCE.HIGH)        { score += 0.30; evidence.push('Decay correction high confidence'); }
    else if (dc === CONFIDENCE.MEDIUM) { score += 0.18; evidence.push('Decay correction medium confidence'); }
    else                               { score += 0.05; evidence.push('Decay ran but low confidence'); }
  } else {
    if (freshness?.freshness_raw !== null && freshness?.freshness_raw !== undefined) {
      score += 0.08;
      evidence.push('User-declared freshness - no decay correction available');
    } else {
      score -= 0.15;
      penalties.push('No freshness data and no decay correction - age unknown');
    }
  }

  // Rut boost
  if (rutActive && (freshness?.freshness_raw ?? 0) > 0.6) {
    score += 0.10;
    evidence.push('Rut active - fresh track almost certainly still in area');
  }

  // Conflict penalty
  if (freshness?.conflict) {
    score -= 0.08;
    penalties.push('Freshness conflict detected - ' + (freshness.conflict_note ?? ''));
  }

  // Data completeness
  const completeness = fusedContext.fusion_meta?.data_completeness ?? 0;
  if (completeness > 0.75) {
    score += 0.05;
    evidence.push('Good data completeness supports estimate');
  }

  const finalScore = clamp(score);
  return {
    score:   finalScore,
    label:   scoreToLabel(finalScore),
    rut_boost_applied: rutActive,
    evidence,
    penalties,
  };
}

// =============================================================================
// LAYER 3: BEHAVIOR CONFIDENCE
// =============================================================================
// Rut LOWERS behavior confidence - moving unpredictably.
// Can say "moving a lot", not much else.

function scoreBehaviorLayer(fusedContext, phase2Output) {
  let score = 0.40;
  const evidence  = [];
  const penalties = [];

  const speciesKey   = fusedContext.species?.species ?? null;
  const rutActive    = isRutActive(speciesKey, currentMonth());
  const behavior     = phase2Output?.behavior_type ?? null;
  const behaviorConf = phase2Output?.behavior?.confidence ?? null;
  const movement     = fusedContext.movement;

  // Phase 2 behavior confidence as base
  if (behaviorConf !== null && behaviorConf !== undefined) {
    score = 0.30 + (behaviorConf * 0.50);
    evidence.push('Phase 2 behavior confidence: ' + Math.round(behaviorConf * 100) + '%');
  }

  if (behavior === 'insufficient_data') {
    score -= 0.20;
    penalties.push('Insufficient data for behavior classification');
  } else if (behavior === 'mixed_behavior') {
    score -= 0.10;
    penalties.push('Mixed behavior signal - primary unclear');
  } else if (behavior) {
    evidence.push('Primary behavior: ' + behavior);
  }

  // Sign tags reinforce
  const signTags = fusedContext.sign_tags ?? [];
  if (signTags.length > 0) {
    score += Math.min(signTags.length * 0.03, 0.09);
    evidence.push('Supporting sign: ' + signTags.join(', '));
  }

  // Gait observed
  if (fusedContext.gait?.gait) {
    score += 0.05;
    evidence.push('Gait observed: ' + fusedContext.gait.gait);
  }

  // Movement label resolved
  if (movement?.effective_movement_label) {
    score += 0.04;
    evidence.push('Movement label: ' + movement.effective_movement_label);
  }

  // Movement conflict
  if (movement?.conflict) {
    score -= 0.08;
    penalties.push('Movement signal conflict - behavior prediction less reliable');
  }

  // Rut penalty - behavior unpredictable
  if (rutActive) {
    score -= 0.18;
    penalties.push('Rut active - behavioral prediction degraded. Animal moving more than usual but pattern is unpredictable. Cannot reliably score forage/flight/patrol.');
  }

  // Nocturnal shift
  const nocturnalShift = movement?.nocturnal_shift ?? 0;
  if (nocturnalShift >= 0.5) {
    score -= 0.10;
    penalties.push('Heavy pressure nocturnal shift - daylight track may not reflect current movement');
  } else if (nocturnalShift >= 0.2) {
    score -= 0.05;
    penalties.push('Moderate pressure - some activity compression');
  }

  const finalScore = clamp(score);
  return {
    score:    finalScore,
    label:    scoreToLabel(finalScore),
    rut_degraded:  rutActive,
    behavior_type: behavior,
    evidence,
    penalties,
  };
}

// =============================================================================
// LAYER 4: SUBSTRATE CONFIDENCE
// =============================================================================
// Heavy animals bypass the standard substrate penalty.

function scoreSubstrateLayer(fusedContext) {
  let score = 0.50;
  const evidence  = [];
  const penalties = [];

  const substrate       = fusedContext.substrate;
  const speciesKey      = fusedContext.species?.species ?? null;
  const heavy           = isHeavyAnimal(speciesKey);
  const decayMultiplier = substrate?.decay_multiplier ?? 1.0;
  const decayConf       = substrate?.decay_confidence ?? CONFIDENCE.NONE;

  // Substrate identified
  if (substrate?.substrate) {
    score += 0.15;
    evidence.push('Substrate identified: ' + substrate.substrate);
  } else {
    score -= 0.20;
    penalties.push('Substrate not declared - decay correction unavailable');
  }

  // Moisture state
  if (substrate?.is_wet !== null && substrate?.is_wet !== undefined) {
    score += 0.08;
    evidence.push('Moisture state known: ' + (substrate.is_wet ? 'wet' : 'dry'));
  } else {
    score -= 0.05;
    penalties.push('Moisture state inferred not measured');
  }

  // Decay correction confidence
  if (decayConf === CONFIDENCE.HIGH)        { score += 0.15; evidence.push('Decay correction high confidence'); }
  else if (decayConf === CONFIDENCE.MEDIUM) { score += 0.08; evidence.push('Decay correction medium confidence'); }
  else if (decayConf === CONFIDENCE.LOW)    { score -= 0.05; penalties.push('Decay correction low confidence'); }
  else                                      { score -= 0.10; penalties.push('No decay correction confidence data'); }

  // High multiplier = more uncertainty
  if (decayMultiplier > 5.0) {
    score -= 0.08;
    penalties.push('Very high decay multiplier (' + decayMultiplier.toFixed(1) + 'x) - extreme conditions, correction less reliable');
  } else if (decayMultiplier > 3.0) {
    score -= 0.04;
    penalties.push('High decay multiplier (' + decayMultiplier.toFixed(1) + 'x) - significant correction applied');
  }

  // Heavy animal floor - they press into most substrates
  if (heavy) {
    score = Math.max(score, 0.50);
    evidence.push('Heavy animal - presses into most substrates, substrate confidence floor raised');
  }

  const finalScore = clamp(score);
  return {
    score:    finalScore,
    label:    scoreToLabel(finalScore),
    heavy_animal:     heavy,
    decay_multiplier: decayMultiplier,
    evidence,
    penalties,
  };
}

// =============================================================================
// MAIN EXPORT: buildConfidenceLayers
// =============================================================================
// Inputs:
//   fusedContext    - output of fuseSignals() from snac_sensor_fusion.js
//   phase2Output    - output of buildSnacDecisionOutput() from snac_master_deduped.js
//   speciesProfiles - full snac_profiles.js object
//
// Output: four scored layers + probability list + summary

export function buildConfidenceLayers(fusedContext = {}, phase2Output = {}, speciesProfiles = {}) {
  const speciesLayer   = scoreSpeciesLayer(fusedContext, phase2Output, speciesProfiles);
  const freshnessLayer = scoreFreshnessLayer(fusedContext);
  const behaviorLayer  = scoreBehaviorLayer(fusedContext, phase2Output);
  const substrateLayer = scoreSubstrateLayer(fusedContext);

  const weakLayers = [
    speciesLayer.label   === CONFIDENCE.LOW || speciesLayer.label   === CONFIDENCE.NONE ? 'species'   : null,
    freshnessLayer.label === CONFIDENCE.LOW || freshnessLayer.label === CONFIDENCE.NONE ? 'freshness' : null,
    behaviorLayer.label  === CONFIDENCE.LOW || behaviorLayer.label  === CONFIDENCE.NONE ? 'behavior'  : null,
    substrateLayer.label === CONFIDENCE.LOW || substrateLayer.label === CONFIDENCE.NONE ? 'substrate' : null,
  ].filter(Boolean);

  const overallHonestLabel = weakLayers.length >= 3
    ? CONFIDENCE.LOW
    : weakLayers.length >= 2
      ? CONFIDENCE.MEDIUM
      : CONFIDENCE.HIGH;

  return {
    species:   speciesLayer,
    freshness: freshnessLayer,
    behavior:  behaviorLayer,
    substrate: substrateLayer,
    summary: {
      overall_honest_label:  overallHonestLabel,
      weak_layers:           weakLayers,
      track_only_mode:       speciesLayer.track_only ?? false,
      rut_active:            freshnessLayer.rut_boost_applied || behaviorLayer.rut_degraded,
      rut_note:              behaviorLayer.rut_degraded
        ? 'Rut active: animal moving more than usual but behavior is unpredictable. Fresh sign is actionable. Pattern prediction is not.'
        : null,
      phase2_recommendation: phase2Output?.recommendation ?? null,
      phase2_confidence:     phase2Output?.tracking_confidence ?? null,
      species_probability_list: speciesLayer.species_probability_list,
    },
  };
}

// =============================================================================
// CONVENIENCE: pre-pass flags for Phase 2 evaluators (runs before Phase 2)
// Lightweight quality flags so evaluators know what to trust
// =============================================================================

export function buildPrePassFlags(fusedContext = {}) {
  const speciesKey   = fusedContext.species?.species ?? null;
  const hasGait      = !!fusedContext.gait?.gait;
  const hasSubstrate = !!fusedContext.substrate?.substrate;
  const hasFreshness = fusedContext.freshness?.freshness_raw !== null &&
                       fusedContext.freshness?.freshness_raw !== undefined;
  const completeness = fusedContext.fusion_meta?.data_completeness ?? 0;

  return {
    species_known:       !!speciesKey,
    track_only_mode:     !speciesKey,
    has_gait:            hasGait,
    has_substrate:       hasSubstrate,
    has_freshness:       hasFreshness,
    data_completeness:   completeness,
    evaluators_can_run:  completeness > 0.25,
    evaluators_degraded: completeness < 0.50,
    notes: [
      !speciesKey    ? 'No species - species evaluators will not run'      : null,
      !hasGait       ? 'No gait - movement pattern evaluators degraded'    : null,
      !hasSubstrate  ? 'No substrate - decay evaluator degraded'           : null,
      !hasFreshness  ? 'No freshness - viability evaluator degraded'       : null,
    ].filter(Boolean),
  };
}

export { SPECIES_DEFAULTS, RUT_MONTHS, HEAVY_ANIMAL, AMBIGUOUS_PAIRS };
