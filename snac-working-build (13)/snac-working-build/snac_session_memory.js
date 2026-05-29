/**
 * SNAC SESSION MEMORY - Phase 3.9
 * Synthesizes behavioral pattern across multiple logged tracks in a session.
 * Inputs: sessionTracks[] from useSnac - each track is a full observation snapshot
 * Outputs: session-level pattern confidence, direction, sign diversity, follow modifier
 *
 * No GPS required (3.10). No vision (3.11). Pure field sign + freshness logic.
 */

// --- Constants ---------------------------------------------------------------

const PATTERN_TIERS = {
  NONE:      { label: 'none',      minTracks: 0, confidence: 0.0, followMod: 0.85 },
  EMERGING:  { label: 'emerging',  minTracks: 2, confidence: 0.5, followMod: 1.05 },
  CONFIRMED: { label: 'confirmed', minTracks: 3, confidence: 0.8, followMod: 1.20 },
  STRONG:    { label: 'strong',    minTracks: 5, confidence: 0.9, followMod: 1.35 },
};

const MIGRATION_TRACK_THRESHOLD = 5;
const CONSISTENCY_HARD_FAIL     = 0.30; // below this, flag contradiction

// Sign types that indicate resident behavior when combined
const RESIDENT_SIGN_COMBO = ['scat', 'browse', 'beds', 'rubs'];

// Sign types that indicate active movement
const TRAVEL_SIGN_COMBO = ['trail', 'water'];

// Species that are mutually exclusive (hard contradiction)
const SPECIES_CONTRADICTIONS = [
  ['blacktail_deer', 'wolf'],
  ['elk', 'mountain_lion'],
  ['domestic_dog', 'wild_turkey'],
  // predator/prey combos are NOT contradictions - they share habitat
];

// --- Helpers -----------------------------------------------------------------

function toNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function avg(arr) {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function speciesKey(track) {
  return track.speciesOverride?.trim().toLowerCase() ?? null;
}

function freshnessVal(track) {
  return toNum(track.freshness) ?? 0.5;
}

function getSignTags(track) {
  return Array.isArray(track.signTags) ? track.signTags : [];
}

function substrateVal(track) {
  return track.substrate ?? null;
}

// --- Consistency scoring ------------------------------------------------------

/**
 * Score how consistent a new track is with the existing session.
 * Returns 0.0 (total contradiction) to 1.0 (perfect match)
 */
function scoreTrackConsistency(track, sessionTracks) {
  if (!sessionTracks.length) return { score: 1.0, flags: [] };

  let score = 1.0;
  const flags = [];

  // Species consistency
  const newSpecies     = speciesKey(track);
  const sessionSpecies = sessionTracks.map(speciesKey).filter(Boolean);

  if (newSpecies && sessionSpecies.length) {
    const dominant = mostCommon(sessionSpecies);
    if (dominant && newSpecies !== dominant) {
      const isHardContra = SPECIES_CONTRADICTIONS.some(pair =>
        (pair[0] === newSpecies && pair[1] === dominant) ||
        (pair[1] === newSpecies && pair[0] === dominant)
      );
      if (isHardContra) {
        score -= 0.5;
        flags.push(`Species contradiction: ${newSpecies} vs ${dominant}`);
      } else {
        score -= 0.15;
        flags.push(`Different species: ${newSpecies} (session: ${dominant})`);
      }
    }
  }

  // Freshness gradient check
  const prevFreshness = sessionTracks.map(freshnessVal);
  const newFreshness  = freshnessVal(track);
  const avgPrev       = avg(prevFreshness);

  if (avgPrev !== null) {
    const freshnessJump = Math.abs(newFreshness - avgPrev);
    if (freshnessJump > 0.6) {
      score -= 0.25;
      flags.push(`Freshness jump too large (${Math.round(avgPrev * 100)}% -> ${Math.round(newFreshness * 100)}%)`);
    } else if (freshnessJump > 0.35) {
      score -= 0.10;
      flags.push('Freshness shift notable');
    }
  }

  // Substrate compatibility
  const prevSubstrates = sessionTracks.map(substrateVal).filter(Boolean);
  const newSubstrate   = substrateVal(track);
  if (newSubstrate && prevSubstrates.length) {
    const waterToRocky = (
      prevSubstrates.some(s => s.includes('mud') || s.includes('riparian')) &&
      newSubstrate.includes('rocky')
    );
    if (waterToRocky) {
      score -= 0.10;
      flags.push('Substrate shift: riparian to rocky');
    }
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    flags,
  };
}

function mostCommon(arr) {
  if (!arr.length) return null;
  const counts = {};
  arr.forEach(v => { counts[v] = (counts[v] ?? 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// --- Freshness direction ------------------------------------------------------

function inferDirection(sessionTracks) {
  if (sessionTracks.length < 2) return 'unknown';

  const values = sessionTracks.map(freshnessVal);
  let increases = 0;
  let decreases = 0;

  for (let i = 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    if (delta > 0.05)       increases++;
    else if (delta < -0.05) decreases++;
  }

  const total = increases + decreases;
  if (total === 0) return 'holding';

  const increaseRatio = increases / total;
  if (increaseRatio >= 0.75) return 'closing_in';
  if (increaseRatio <= 0.25) return 'moving_away';
  if (increases > 0 && decreases > 0) return 'circling';
  return 'unknown';
}

// --- Sign diversity -----------------------------------------------------------

function scoreSignDiversity(sessionTracks) {
  const allTags = new Set();
  sessionTracks.forEach(t => getSignTags(t).forEach(tag => allTags.add(tag)));

  const uniqueCount = allTags.size;
  const maxPossible = 8;
  const score = Math.min(1.0, uniqueCount / maxPossible);

  const residentHits = RESIDENT_SIGN_COMBO.filter(s => allTags.has(s)).length;
  const travelHits   = TRAVEL_SIGN_COMBO.filter(s => allTags.has(s)).length;

  let behaviorHint = 'insufficient_sign';
  if (residentHits >= 3)      behaviorHint = 'strong_resident';
  else if (residentHits >= 2) behaviorHint = 'likely_resident';
  else if (travelHits >= 2)   behaviorHint = 'travel_corridor';
  else if (uniqueCount >= 2)  behaviorHint = 'active_area';

  return { score, uniqueCount, behaviorHint, tags: [...allTags] };
}

// --- Migration flag -----------------------------------------------------------

function checkMigrationFlag(sessionTracks, direction) {
  if (sessionTracks.length < MIGRATION_TRACK_THRESHOLD) return false;
  if (direction === 'circling' || direction === 'holding' || direction === 'unknown') return false;

  const values = sessionTracks.map(freshnessVal);
  let consistent = 0;
  for (let i = 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    if (direction === 'closing_in'  && delta > 0) consistent++;
    if (direction === 'moving_away' && delta < 0) consistent++;
  }

  return consistent / (values.length - 1) >= 0.70;
}

// --- Pattern tier -------------------------------------------------------------

function getPatternTier(count) {
  if (count >= 5) return PATTERN_TIERS.STRONG;
  if (count >= 3) return PATTERN_TIERS.CONFIRMED;
  if (count >= 2) return PATTERN_TIERS.EMERGING;
  return PATTERN_TIERS.NONE;
}

// --- Plain language synthesis -------------------------------------------------

function buildSynthesis({ trackCount, patternTier, direction, signDiversity, migrationFlag, dominantSpecies, inconsistencyFlag }) {
  const parts = [];

  if (trackCount === 1) {
    parts.push('Single observation - rough read only.');
  } else if (trackCount === 2) {
    parts.push('Two observations - pattern emerging.');
  } else {
    parts.push(`${trackCount} observations - pattern ${patternTier.label}.`);
  }

  if (dominantSpecies) {
    parts.push(`Dominant sign: ${dominantSpecies.replace(/_/g, ' ')}.`);
  }

  const dirMap = {
    closing_in:  'Sign getting fresher - animal moving toward you or holding nearby.',
    moving_away: 'Sign getting older - animal moving away from this area.',
    circling:    'Mixed freshness - animal may be circling or working a home range.',
    holding:     'Consistent freshness - animal holding in this area.',
    unknown:     'Direction unclear from available sign.',
  };
  parts.push(dirMap[direction] ?? 'Direction unknown.');

  if (signDiversity.behaviorHint === 'strong_resident') {
    parts.push('Multiple sign types confirm resident activity - bed, browse, scat, rub all present.');
  } else if (signDiversity.behaviorHint === 'likely_resident') {
    parts.push('Sign diversity suggests resident animal working this area.');
  } else if (signDiversity.behaviorHint === 'travel_corridor') {
    parts.push('Sign consistent with travel corridor - animal moving through.');
  } else if (signDiversity.behaviorHint === 'active_area') {
    parts.push('Active area - multiple sign types observed.');
  }

  if (migrationFlag) {
    parts.push('MIGRATION FLAG: 5+ tracks with consistent direction - possible migration corridor.');
  }

  if (inconsistencyFlag) {
    parts.push(`NOTE: ${inconsistencyFlag}`);
  }

  return parts.join(' ');
}

// --- Main exports -------------------------------------------------------------

/**
 * analyzeSession(sessionTracks, newTrack?)
 * Call after every ADD TRACK. Pass newTrack for pre-add consistency check.
 * Returns full session memory object - consumed by useSnac to apply follow_modifier
 * and surface session synthesis to the UI.
 */
export function analyzeSession(sessionTracks = [], newTrack = null) {
  const tracks = newTrack ? [...sessionTracks, newTrack] : sessionTracks;
  const count  = tracks.length;

  if (count === 0) {
    return {
      track_count:             0,
      pattern_confidence:      'none',
      pattern_label:           'none',
      direction:               'unknown',
      sign_diversity_score:    0,
      sign_diversity_hint:     'no_sign',
      follow_modifier:         1.0,
      session_synthesis:       'No tracks logged yet.',
      inconsistency_flag:      null,
      migration_flag:          false,
      dominant_species:        null,
      consistency_score:       null,
      false_reset_recommended: false,
    };
  }

  let consistencyResult     = null;
  let inconsistencyFlag     = null;
  let falseResetRecommended = false;

  if (newTrack && sessionTracks.length > 0) {
    consistencyResult = scoreTrackConsistency(newTrack, sessionTracks);
    if (consistencyResult.score < CONSISTENCY_HARD_FAIL) {
      inconsistencyFlag     = consistencyResult.flags.join('. ');
      falseResetRecommended = true;
    } else if (consistencyResult.flags.length > 0) {
      inconsistencyFlag = consistencyResult.flags[0];
    }
  }

  const patternTier     = getPatternTier(count);
  const direction       = inferDirection(tracks);
  const signDiversity   = scoreSignDiversity(tracks);
  const migrationFlag   = checkMigrationFlag(tracks, direction);
  const dominantSpecies = mostCommon(tracks.map(speciesKey).filter(Boolean)) ?? null;

  let followModifier = patternTier.followMod;
  if (signDiversity.behaviorHint === 'strong_resident')  followModifier *= 1.10;
  if (signDiversity.behaviorHint === 'likely_resident')  followModifier *= 1.05;
  if (signDiversity.behaviorHint === 'travel_corridor')  followModifier *= 0.95;
  if (direction === 'moving_away')                       followModifier *= 0.85;
  if (direction === 'closing_in')                        followModifier *= 1.10;
  if (falseResetRecommended)                             followModifier *= 0.70;
  followModifier = Math.max(0.5, Math.min(1.6, followModifier));

  const synthesis = buildSynthesis({
    trackCount: count,
    patternTier,
    direction,
    signDiversity,
    migrationFlag,
    dominantSpecies,
    inconsistencyFlag,
  });

  return {
    track_count:             count,
    pattern_confidence:      patternTier.label,
    pattern_label:           patternTier.label,
    direction,
    sign_diversity_score:    signDiversity.score,
    sign_diversity_hint:     signDiversity.behaviorHint,
    sign_tags_observed:      signDiversity.tags,
    follow_modifier:         parseFloat(followModifier.toFixed(3)),
    session_synthesis:       synthesis,
    inconsistency_flag:      inconsistencyFlag,
    migration_flag:          migrationFlag,
    dominant_species:        dominantSpecies,
    consistency_score:       consistencyResult?.score ?? null,
    false_reset_recommended: falseResetRecommended,
  };
}

/**
 * shouldFalseReset(sessionTracks, newTrack)
 * Quick pre-add check. Returns true if engine recommends a false reset.
 */
export function shouldFalseReset(sessionTracks, newTrack) {
  if (!sessionTracks.length) return false;
  const result = scoreTrackConsistency(newTrack, sessionTracks);
  return result.score < CONSISTENCY_HARD_FAIL;
}

/**
 * getSessionSummaryLine(sessionMemory)
 * Single short line for display in WorkspaceScreen status card.
 */
export function getSessionSummaryLine(mem) {
  if (!mem || mem.track_count === 0) return 'No session data';
  const dir = {
    closing_in:  'Closing in',
    moving_away: 'Moving away',
    circling:    'Circling',
    holding:     'Holding',
    unknown:     'Direction unknown',
  }[mem.direction] ?? 'Unknown';
  return `${mem.track_count} tracks  //  ${mem.pattern_confidence.toUpperCase()}  //  ${dir}`;
}
