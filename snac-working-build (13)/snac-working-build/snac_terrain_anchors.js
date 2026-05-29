import { SOURCE, CONFIDENCE } from './snac_input_schema.js';
 
// =============================================================================
// SNAC Field Intelligence - Phase 4.2
// snac_terrain_anchors.js
// Terrain anchor behavioral modeling - water sources and movement channels
// =============================================================================
//
// PURPOSE:
// Models how local terrain features pull and channel animal movement.
// EVERYTHING here is driven by USER-OBSERVED ground truth - no elevation API,
// no inferred hydrology, no seasonal guessing. The tracker is standing there
// and reports what they see; the engine reasons about behavior from that.
//
// GROUND TRUTH INPUTS (all user-observed, never inferred):
//   water_type        'permanent' | 'ephemeral' | 'none'
//                     permanent = creek, lake, spring, river - reliable
//                     ephemeral = puddle, seep, rain pool - temporary
//   water_condition   'clear' | 'churned' | null
//                     only meaningful for ephemeral water
//                     clear   = not yet fouled, animals still using
//                     churned = mudded up from use, animals abandoning
//   terrain_channel   'ridge' | 'drainage' | 'flat'
//                     ridge    = high ground, channels travel along spine
//                     drainage = valley/draw, funnels movement AND scent
//                     flat     = no strong channeling
//
// KEY FIELD LOGIC:
// - Water pull is species-weighted. A bear or deer will hit a puddle and quit
//   it before the mud gets bad. A cat largely ignores standing water. Canids
//   use water opportunistically.
// - Ephemeral water has a USE WINDOW: high pull while clear, dropping sharply
//   once churned. "Hit it and quit it." Churned ephemeral water means the
//   animal was here recently but has likely moved on.
// - Drainages funnel both movement and scent. A drainage below the hunter
//   carries scent downhill toward bedding; a drainage above carries it away.
// - Ridges channel travel along the high line and give animals wind/visual
//   advantage - they bed near the military crest.
//
// SEASONAL/INTERMITTENT water is deliberately NOT modeled - that needs
// regional hydrology research and rain history. Deferred to Phase 5+.
//
// OUTPUT: terrain_anchor object
//   water_pull          0.0-1.0 behavioral pull toward the water feature
//   water_window        'open' | 'closing' | 'closed' | 'none'
//   channel_effect      movement channeling descriptor
//   scent_channel_note  drainage/ridge scent guidance, null if flat
//   anchor_notes[]      human-readable field observations
//   follow_modifier     -0.15 to +0.20 adjustment to follow priority
//
// =============================================================================
 
// Species group lookup - matches weather priors groupings
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
  wild_boar:         'ungulate',
  feral_pig:         'ungulate',
  gray_wolf:         'canid',
  coyote:            'canid',
  red_fox:           'canid',
  dingo:             'canid',
  black_bear:        'bear',
  grizzly_bear:      'bear',
  moose_bear:        'bear',
  mountain_lion:     'felid',
  bobcat:            'felid',
  lion:              'felid',
  leopard:           'felid',
  cheetah:           'felid',
  jaguar:            'felid',
  puma:              'felid',
  lynx:              'felid',
  beaver:            'semiaquatic',
  muskrat:           'semiaquatic',
  river_otter:       'semiaquatic',
  mink:              'semiaquatic',
  european_beaver:   'semiaquatic',
  european_otter:    'semiaquatic',
  capybara:          'semiaquatic',
  platypus:          'semiaquatic',
};
 
// Species water affinity - how strongly water pulls this group
// Drives base water pull before water type/condition adjustment
const WATER_AFFINITY = {
  ungulate:    0.70,
  bear:        0.75,
  canid:       0.55,
  felid:       0.35,
  semiaquatic: 0.95,
  default:     0.55,
};
 
// Species willingness to use EPHEMERAL (puddle/seep) water
// Some animals readily use temporary water, others prefer permanent
const EPHEMERAL_WILLINGNESS = {
  ungulate:    0.85,
  bear:        0.90,
  canid:       0.70,
  felid:       0.40,
  semiaquatic: 0.30,
  default:     0.65,
};
 
// =============================================================================
// WATER PULL SCORING
// =============================================================================
 
function scoreWater(waterType, waterCondition, speciesGroup, notes) {
  if (!waterType || waterType === 'none') {
    return { water_pull: 0, water_window: 'none' };
  }
 
  const affinity    = WATER_AFFINITY[speciesGroup] ?? WATER_AFFINITY.default;
  const ephWilling  = EPHEMERAL_WILLINGNESS[speciesGroup] ?? EPHEMERAL_WILLINGNESS.default;
 
  if (waterType === 'permanent') {
    const pull = affinity;
    notes.push('Permanent water nearby - reliable draw for this species. Travel routes often connect water to bedding and feeding.');
    return { water_pull: parseFloat(pull.toFixed(3)), water_window: 'open' };
  }
 
  if (waterType === 'ephemeral') {
    if (waterCondition === 'churned') {
      const pull = affinity * ephWilling * 0.30;
      notes.push('Ephemeral water churned and fouled - the use window has closed. Animal likely watered here recently and moved on. Track ahead, not at the water.');
      return { water_pull: parseFloat(pull.toFixed(3)), water_window: 'closed' };
    }
    if (waterCondition === 'clear') {
      const pull = affinity * ephWilling;
      notes.push('Ephemeral water still clear - use window is open. Animals working this feature now before it fouls. Strong current draw.');
      return { water_pull: parseFloat(pull.toFixed(3)), water_window: 'open' };
    }
    const pull = affinity * ephWilling * 0.65;
    notes.push('Ephemeral water present - condition unreported. Temporary draw, check if fouled to read the use window.');
    return { water_pull: parseFloat(pull.toFixed(3)), water_window: 'closing' };
  }
 
  return { water_pull: 0, water_window: 'none' };
}
 
// =============================================================================
// TERRAIN CHANNEL SCORING
// =============================================================================
// Ridges and drainages channel movement and scent. Uses wind direction when
// available to give scent guidance relative to the channel.
 
function scoreChannel(terrainChannel, windFromCardinal, speciesGroup, notes) {
  if (!terrainChannel || terrainChannel === 'flat') {
    return { channel_effect: 'none', scent_channel_note: null, channel_mod: 0 };
  }
 
  if (terrainChannel === 'drainage') {
    notes.push('Drainage funnels movement along its length - animals travel the path of least resistance. Cold air and scent drain downhill through it.');
    let scentNote = 'Scent pools and drains downhill through the drainage. Stay above the animal, never let the drainage carry your scent down to it.';
    if (windFromCardinal) {
      scentNote += ' Wind from ' + windFromCardinal + ' compounds with drainage flow - read both before committing.';
    }
    return { channel_effect: 'funnels_movement', scent_channel_note: scentNote, channel_mod: 0.10 };
  }
 
  if (terrainChannel === 'ridge') {
    notes.push('Ridge channels travel along the spine. Animals favor the military crest just below the top for wind scent and escape options.');
    let scentNote = 'On a ridge your scent blows over both faces. Work the downwind side and keep below the skyline.';
    if (windFromCardinal) {
      scentNote += ' Wind from ' + windFromCardinal + ' - the lee face is where scent settles.';
    }
    return { channel_effect: 'channels_along_spine', scent_channel_note: scentNote, channel_mod: 0.08 };
  }
 
  return { channel_effect: 'none', scent_channel_note: null, channel_mod: 0 };
}
 
// =============================================================================
// MAIN EXPORT: scoreTerrainAnchors
// =============================================================================
// Inputs:
//   resolved        - resolved input object (for species)
//   terrainObs      - user-observed terrain ground truth:
//                     { water_type, water_condition, terrain_channel }
//   windFromCardinal - optional wind direction cardinal from weather priors
//
// Output: terrain_anchor object (see header)
 
export function scoreTerrainAnchors(resolved = {}, terrainObs = {}, windFromCardinal = null) {
  const notes        = [];
  const speciesKey   = resolved.species?.value ?? null;
  const speciesGroup = SPECIES_GROUP[speciesKey] ?? 'default';
 
  const waterType      = terrainObs.water_type      ?? 'none';
  const waterCondition = terrainObs.water_condition ?? null;
  const terrainChannel = terrainObs.terrain_channel ?? 'flat';
 
  const { water_pull, water_window } = scoreWater(waterType, waterCondition, speciesGroup, notes);
 
  const { channel_effect, scent_channel_note, channel_mod } =
    scoreChannel(terrainChannel, windFromCardinal, speciesGroup, notes);
 
  let followModifier = 0;
  if (water_window === 'open')    followModifier += water_pull * 0.20;
  if (water_window === 'closing') followModifier += water_pull * 0.10;
  if (water_window === 'closed')  followModifier -= 0.05;
  followModifier += channel_mod;
  followModifier = parseFloat(Math.max(-0.15, Math.min(0.20, followModifier)).toFixed(3));
 
  const hasData = waterType !== 'none' || terrainChannel !== 'flat';
 
  return {
    water_pull,
    water_window,
    water_type:        waterType,
    water_condition:   waterCondition,
    channel_effect,
    terrain_channel:   terrainChannel,
    scent_channel_note: scent_channel_note,
    follow_modifier:   followModifier,
    anchor_notes:      notes,
    source:            hasData ? SOURCE.USER : SOURCE.DEFAULT,
    confidence:        hasData ? CONFIDENCE.HIGH : CONFIDENCE.NONE,
    species_group:     speciesGroup,
    has_terrain_data:  hasData,
  };
}
 
export { SPECIES_GROUP as TERRAIN_SPECIES_GROUP, WATER_AFFINITY, EPHEMERAL_WILLINGNESS };