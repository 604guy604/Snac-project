function _isString(v)  { return typeof v === "string" && v.trim().length > 0; }
function _isNumber(v)  { return typeof v === "number" && isFinite(v); }
function _isArray(v)   { return Array.isArray(v); }
function _isObject(v)  { return v !== null && typeof v === "object" && !Array.isArray(v); }
function _arrayOfStrings(v) { return _isArray(v) && v.every((x) => _isString(x)); }

const FIELD_SPEC = [
  { path: "common_name",          type: "string",   severity: "required",    desc: "Display name (e.g. 'Coyote')" },
  { path: "species_key",          type: "string",   severity: "recommended", desc: "Canonical lookup key matching profiles object key" },
  { path: "track_shape",          type: "string",   severity: "recommended", desc: "Shape descriptor used by predictSpeciesFromTrack" },
  { path: "track_size_cm.front",  type: "string",   severity: "recommended", desc: "Front track size range string e.g. '5-6'" },
  { path: "track_size_cm.hind",   type: "string",   severity: "recommended", desc: "Hind track size range string e.g. '4.5-5.5'" },
  { path: "diet",                 type: "string",   severity: "recommended", desc: "Diet description (browse / carnivore / omnivore...)" },
  { path: "activity",             type: "string",   severity: "recommended", desc: "Activity pattern (crepuscular / nocturnal / diurnal)" },
  { path: "water_needs",          type: "string",   severity: "optional",    desc: "Water requirements for evaluateWaterBehavior" },
  { path: "migratory",            type: "boolean",  severity: "optional",    desc: "True if species is migratory" },

  { path: "behavior_tags",        type: "string[]", severity: "recommended", desc: "General behavior tags" },
  { path: "movement_tags",        type: "string[]", severity: "optional",    desc: "Movement-specific tags" },
  { path: "alert_behavior",       type: "string[]", severity: "optional",    desc: "Tags describing alert/threat response" },
  { path: "diet_type",            type: "string[]", severity: "optional",    desc: "Structured diet tags (carnivore, herbivore...)" },
  { path: "feeding_behavior",     type: "string[]", severity: "optional",    desc: "Feeding mode tags" },
  { path: "group_behavior",       type: "string[]", severity: "optional",    desc: "Grouping tags (solitary, pack, herd...)" },
  { path: "flight_behavior_tags", type: "string[]", severity: "optional",    desc: "Escape/flight behavior tags" },
  { path: "forage_behavior_tags", type: "string[]", severity: "optional",    desc: "Foraging behavior tags" },

  { path: "predator_prey.risk_radius_m",          type: "number",  severity: "recommended", desc: "Distance at which predator pressure activates (m)" },
  { path: "predator_prey.pressure_weight",        type: "number",  severity: "recommended", desc: "Multiplier on interaction score (0-2)" },
  { path: "predator_prey.trail_avoidance_radius_m", type: "number", severity: "optional",  desc: "Prey trail-avoidance radius (m)" },
  { path: "predator_of",                          type: "string[]", severity: "recommended", desc: "Species this animal preys upon (lowercase keys)" },
  { path: "prey_of",                              type: "string[]", severity: "recommended", desc: "Species that prey upon this animal (lowercase keys)" },

  { path: "track_age_decay.weight",                 type: "number", severity: "recommended", desc: "Decay weighting multiplier" },
  { path: "track_age_decay.same_band_threshold",    type: "number", severity: "recommended", desc: "Normalized diff at or below  same freshness band" },
  { path: "track_age_decay.separate_band_threshold",type: "number", severity: "recommended", desc: "Normalized diff at or above  separate time layer" },
  { path: "track_age_decay.environmental_sensitivity", type: "number", severity: "optional", desc: "0-1 sensitivity of tracks to environment" },
  { path: "track_age_decay.tags",                   type: "string[]", severity: "optional",  desc: "Decay characteristic tags" },

  { path: "flight_or_forage.flight_weight",               type: "number",  severity: "recommended", desc: "Multiplier on flight score" },
  { path: "flight_or_forage.forage_weight",               type: "number",  severity: "recommended", desc: "Multiplier on forage score" },
  { path: "flight_or_forage.direction_change_threshold_deg", type: "number", severity: "recommended", desc: "Heading change () that indicates flight" },
  { path: "flight_or_forage.spread_tightness_threshold_m",   type: "number", severity: "recommended", desc: "Track spread (m) below which = forage tightness" },
  { path: "flight_or_forage.stride_variance_threshold",     type: "number", severity: "recommended", desc: "Stride variance above which = flight signal" },
  { path: "flight_or_forage.freshness_cluster_threshold",   type: "number", severity: "recommended", desc: "Freshness variance below which = clustered time" },

  { path: "denning_behavior.den_types",                  type: "string[]", severity: "recommended", desc: "Den type tags" },
  { path: "denning_behavior.den_site_tags",              type: "string[]", severity: "recommended", desc: "Site characteristic tags" },
  { path: "denning_behavior.den_return_pattern_tags",    type: "string[]", severity: "optional",    desc: "Return/approach pattern tags" },
  { path: "denning_behavior.den_radius_m",               type: "number",   severity: "recommended", desc: "Radius around den core (m)" },
  { path: "denning_behavior.return_radius_m",            type: "number",   severity: "recommended", desc: "Revisit proximity threshold (m)" },
  { path: "denning_behavior.bedding_spread_threshold_m", type: "number",   severity: "recommended", desc: "Max spread for bedding classification (m)" },
  { path: "denning_behavior.freshness_cluster_threshold",type: "number",   severity: "optional",    desc: "Freshness variance for cluster detection" },
  { path: "denning_behavior.denning_weight",             type: "number",   severity: "optional",    desc: "Multiplier on all denning scores" },

  { path: "scent_marking_behavior.scent_marking_tags",       type: "string[]", severity: "recommended", desc: "Scent marking behavior tags" },
  { path: "scent_marking_behavior.loopback_pattern_tags",    type: "string[]", severity: "recommended", desc: "Loopback / patrol pattern tags" },
  { path: "scent_marking_behavior.travel_context_tags",      type: "string[]", severity: "optional",    desc: "Travel context / habitat tags" },
  { path: "scent_marking_behavior.marking_radius_m",         type: "number",   severity: "recommended", desc: "Radius for marking site clustering (m)" },
  { path: "scent_marking_behavior.revisit_radius_m",         type: "number",   severity: "recommended", desc: "Revisit proximity threshold (m)" },
  { path: "scent_marking_behavior.route_reuse_threshold_m",  type: "number",   severity: "recommended", desc: "Max spread for route-reuse classification (m)" },
  { path: "scent_marking_behavior.freshness_cluster_threshold", type: "number", severity: "optional",   desc: "Freshness variance for temporal clustering" },
  { path: "scent_marking_behavior.scent_weight",             type: "number",   severity: "optional",    desc: "Multiplier on scent/territorial scores" },

  { path: "movement_pattern.loopback_radius_m",                     type: "number",   severity: "recommended", desc: "Return-to-start threshold (m)" },
  { path: "movement_pattern.zigzag_direction_threshold_deg",        type: "number",   severity: "recommended", desc: "Mean heading change () for zigzag" },
  { path: "movement_pattern.escape_line_direction_variance_threshold", type: "number", severity: "recommended", desc: "Heading variance at/below = escape line" },
  { path: "movement_pattern.water_approach_radius_m",               type: "number",   severity: "optional",    desc: "Radius for water approach scoring (m)" },
  { path: "movement_pattern.trail_reuse_radius_m",                  type: "number",   severity: "optional",    desc: "Trail reuse proximity (m)" },
  { path: "movement_pattern.pattern_tags",                          type: "string[]", severity: "recommended", desc: "Movement pattern tags" },

  { path: "behavior_research.primary_habitat",   type: "string[]", severity: "recommended", desc: "Primary habitat zone tags" },
  { path: "terrain_intelligence.terrain_weight", type: "number",   severity: "optional",    desc: "Global terrain score multiplier" },
  { path: "terrain_intelligence.water_edge_weight", type: "number", severity: "optional",   desc: "Water-edge sub-score multiplier" },
  { path: "terrain_intelligence.cover_weight",   type: "number",   severity: "optional",    desc: "Cover sub-score multiplier" },
  { path: "terrain_intelligence.open_ground_weight", type: "number", severity: "optional",  desc: "Open-ground sub-score multiplier" },
  { path: "terrain_intelligence.elevation_weight",   type: "number", severity: "optional",  desc: "Elevation sub-score multiplier" }
];

function _getPath(obj, dotPath) {
  return dotPath.split(".").reduce((cur, key) => (cur != null ? cur[key] : undefined), obj);
}

function _checkField(entry, spec) {
  const value = _getPath(entry, spec.path);
  const issue = { path: spec.path, severity: spec.severity, desc: spec.desc, value };

  if (value === undefined || value === null) {
    return { ...issue, status: "missing" };
  }

  let typeOk = false;
  switch (spec.type) {
    case "string":   typeOk = _isString(value);        break;
    case "number":   typeOk = _isNumber(value);        break;
    case "boolean":  typeOk = typeof value === "boolean"; break;
    case "string[]": typeOk = _arrayOfStrings(value);  break;
    case "object":   typeOk = _isObject(value);        break;
    default:         typeOk = true;
  }

  if (!typeOk) {
    return { ...issue, status: "wrong_type", expected: spec.type, actual: typeof value };
  }

  const SCORE_THRESHOLD_PATHS = [
    "same_band_threshold", "separate_band_threshold", "environmental_sensitivity",
    "stride_variance_threshold", "freshness_cluster_threshold",
    "escape_line_direction_variance_threshold"
  ];
  if (spec.type === "number" && spec.path.includes("weight") && (value < 0 || value > 5)) {
    return { ...issue, status: "out_of_range", note: "weight fields expected 0-5" };
  }
  const isScoreThreshold = SCORE_THRESHOLD_PATHS.some((p) => spec.path.endsWith(p));
  if (spec.type === "number" && isScoreThreshold && (value < 0 || value > 1)) {
    return { ...issue, status: "out_of_range", note: "score threshold fields expected 0-1" };
  }

  return { ...issue, status: "ok" };
}

export function validateSpeciesProfile(entry, key = "unknown") {
  if (!_isObject(entry)) {
    return {
      key,
      valid: false,
      errors: [{ path: "(root)", status: "not_an_object" }],
      warnings: [],
      info: [],
      score: 0
    };
  }

  const errors = [], warnings = [], info = [];

  for (const spec of FIELD_SPEC) {
    const result = _checkField(entry, spec);
    if (result.status === "ok") continue;

    const record = { path: result.path, status: result.status, desc: result.desc };
    if (result.expected)  record.expected = result.expected;
    if (result.actual)    record.actual   = result.actual;
    if (result.note)      record.note     = result.note;

    if (result.status === "missing" || result.status === "wrong_type" || result.status === "out_of_range") {
      if (spec.severity === "required")    errors.push(record);
      else if (spec.severity === "recommended") warnings.push(record);
      else                                 info.push(record);
    }
  }

  const total       = FIELD_SPEC.length;
  const okCount     = total - errors.length - warnings.length - info.length;
  const score       = Math.round((okCount / total) * 100);
  const valid       = errors.length === 0;

  return { key, valid, score, errors, warnings, info };
}

export function validateSpeciesProfiles(profiles) {
  if (!_isObject(profiles)) {
    return {
      valid: false,
      profileCount: 0,
      results: [],
      summary: { passed: 0, failed: 1, avgScore: 0 }
    };
  }

  const results = Object.entries(profiles).map(([key, entry]) =>
    validateSpeciesProfile(entry, key)
  );

  const passed   = results.filter((r) => r.valid).length;
  const avgScore = results.length
    ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)
    : 0;

  return {
    valid: results.every((r) => r.valid),
    profileCount: results.length,
    results,
    summary: { passed, failed: results.length - passed, avgScore }
  };
}

const ALIAS_MAP = {
  name:                  "common_name",
  scientific_name:       null,
  species_id:            "species_key",
  shape:                 "track_shape",
  track_shape_type:      "track_shape",
  behavior:              "behavior_tags",
  behaviors:             "behavior_tags",
  diet_description:      "diet",
  activity_pattern:      "activity",
  water_requirement:     "water_needs",
  is_migratory:          "migratory",

  predator_targets:      "predator_of",
  prey_species:          "predator_of",
  preferred_prey:        "predator_of",
  known_predators:       "prey_of",
  predator_species:      "prey_of",
  predators:             "prey_of",

  predator_alert:        "predator_prey",
  behavior_logic:        "flight_or_forage",
  denning_logic:         "denning_behavior",
  scent_logic:           "scent_marking_behavior",
  pattern_logic:         "movement_pattern",
  terrain_logic:         "terrain_intelligence",
  decay_curve:           "track_age_decay",
  track_decay:           "track_age_decay"
};

function _deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function adaptSpeciesProfile(raw) {
  if (!_isObject(raw)) return raw;
  const out = _deepClone(raw);

  for (const [alias, canonical] of Object.entries(ALIAS_MAP)) {
    if (!(alias in out)) continue;
    if (canonical === null) {
      delete out[alias];
      continue;
    }
    if (!(canonical in out)) {
      out[canonical] = out[alias];
    } else if (_isObject(out[canonical]) && _isObject(out[alias])) {
      out[canonical] = { ...out[alias], ...out[canonical] };
    }
    if (alias !== canonical) delete out[alias];
  }

  return out;
}

export function adaptSpeciesProfiles(rawProfiles) {
  if (!_isObject(rawProfiles)) return rawProfiles;
  const out = {};
  for (const [key, entry] of Object.entries(rawProfiles)) {
    out[key] = adaptSpeciesProfile(entry);
  }
  return out;
}

export const MOCK_SPECIES_PROFILES = {

  coyote: {
    common_name: "Coyote",
    species_key: "coyote",
    track_shape: "oval_4toe",
    track_size_cm: { front: "5-6.5", hind: "4.5-6" },
    diet: "omnivore - small mammals, carrion, berries, insects",
    activity: "crepuscular",
    water_needs: "moderate - drinks every 1-2 days near reliable water",
    migratory: false,

    behavior_tags:        ["alert", "territorial", "scent_marking", "opportunistic"],
    movement_tags:        ["trot", "lope", "patrol"],
    alert_behavior:       ["freeze", "circle", "retreat"],
    diet_type:            ["carnivore", "omnivore"],
    feeding_behavior:     ["forage", "cache", "opportunistic_feed"],
    group_behavior:       ["solitary", "pair", "family_group"],
    flight_behavior_tags: ["flight", "evasive", "burst", "escape"],
    forage_behavior_tags: ["forage", "meander", "slow_feed"],

    predator_of: ["cottontail", "jackrabbit", "vole", "mouse", "ground_squirrel", "mule_deer"],
    prey_of:     ["gray_wolf", "mountain_lion", "black_bear"],

    predator_prey: {
      risk_radius_m:             150,
      pressure_weight:           1.2,
      trail_avoidance_radius_m:  60
    },

    track_age_decay: {
      weight:                    0.85,
      same_band_threshold:       0.08,
      separate_band_threshold:   0.28,
      environmental_sensitivity: 0.75,
      tags: ["rapid_edge_loss_in_sun", "good_mud_retention"]
    },

    flight_or_forage: {
      flight_weight:                 1.1,
      forage_weight:                 0.9,
      direction_change_threshold_deg: 85,
      spread_tightness_threshold_m:   18,
      stride_variance_threshold:      0.12,
      freshness_cluster_threshold:    0.06
    },

    denning_behavior: {
      den_types:                  ["earth_burrow", "rocky_outcrop_den", "brushpile_rest"],
      den_site_tags:              ["brushland", "rocky_slope", "riparian_edge"],
      den_return_pattern_tags:    ["den_centered_travel", "cover_reentry"],
      den_radius_m:               12,
      return_radius_m:            20,
      bedding_spread_threshold_m: 35,
      freshness_cluster_threshold: 0.07,
      denning_weight:             1.0
    },

    scent_marking_behavior: {
      scent_marking_tags:       ["urine_mark", "scat_mark", "scrape_mark", "trail_edge_mark"],
      loopback_pattern_tags:    ["localized_loopback", "edge_revisit", "scent_route_reuse"],
      travel_context_tags:      ["brushland", "grassland", "riparian_edge", "forest_edge"],
      marking_radius_m:         80,
      revisit_radius_m:         40,
      route_reuse_threshold_m:  120,
      freshness_cluster_threshold: 0.10,
      scent_weight:             1.0
    },

    movement_pattern: {
      loopback_radius_m:                       25,
      zigzag_direction_threshold_deg:          55,
      escape_line_direction_variance_threshold: 0.18,
      water_approach_radius_m:                 80,
      trail_reuse_radius_m:                    30,
      pattern_tags: [
        "localized_loopback", "scent_route_reuse", "zigzag_escape",
        "shoreline_loopback", "edge_revisit"
      ]
    },

    behavior_research: {
      primary_habitat: ["grassland", "shrub_cover", "riparian_edge", "forest_edge", "agricultural_edge"]
    },

    terrain_intelligence: {
      terrain_weight:      1.0,
      water_edge_weight:   0.9,
      cover_weight:        1.1,
      open_ground_weight:  1.0,
      elevation_weight:    0.7
    }
  },

  mule_deer: {
    common_name: "Mule Deer",
    species_key: "mule_deer",
    track_shape: "cloven_hoof_wide",
    track_size_cm: { front: "6.5-8.5", hind: "6-8" },
    diet: "browse - shrubs, forbs, grasses, mast",
    activity: "crepuscular",
    water_needs: "daily - requires free water, especially in summer",
    migratory: true,

    behavior_tags:        ["alert", "flight", "browse", "bedding"],
    movement_tags:        ["walk", "bound", "stot"],
    alert_behavior:       ["freeze", "stot", "burst_run", "alarm_snort"],
    diet_type:            ["herbivore"],
    feeding_behavior:     ["browse", "graze", "forage", "slow_feed"],
    group_behavior:       ["small_herd", "doe_fawn_group", "buck_bachelor_group"],
    flight_behavior_tags: ["flight", "flee", "burst", "escape", "spooked", "stot"],
    forage_behavior_tags: ["forage", "browse", "graze", "meander", "slow_feed"],

    predator_of: [],
    prey_of:     ["mountain_lion", "gray_wolf", "coyote", "black_bear", "bobcat"],

    predator_prey: {
      risk_radius_m:             250,
      pressure_weight:           0.8,
      trail_avoidance_radius_m:  120
    },

    track_age_decay: {
      weight:                    0.9,
      same_band_threshold:       0.07,
      separate_band_threshold:   0.25,
      environmental_sensitivity: 0.80,
      tags: ["hoof_retains_edge_in_mud", "fast_degradation_in_gravel"]
    },

    flight_or_forage: {
      flight_weight:                  1.3,
      forage_weight:                  1.1,
      direction_change_threshold_deg:  70,
      spread_tightness_threshold_m:    30,
      stride_variance_threshold:       0.15,
      freshness_cluster_threshold:     0.05
    },

    denning_behavior: {
      den_types:                  ["ridge_bed", "shade_bed", "brush_bedding", "shallow_cover_rest"],
      den_site_tags:              ["shrub_cover", "rocky_slope", "forest_edge", "ridge"],
      den_return_pattern_tags:    ["cover_reentry", "repeated_entry_exit"],
      den_radius_m:               20,
      return_radius_m:            35,
      bedding_spread_threshold_m: 60,
      freshness_cluster_threshold: 0.06,
      denning_weight:             0.95
    },

    scent_marking_behavior: {
      scent_marking_tags:       ["scrape_mark", "rub_tree", "tarsal_gland"],
      loopback_pattern_tags:    ["edge_revisit", "cover_loop", "ridge_revisit"],
      travel_context_tags:      ["shrub_cover", "rocky_slope", "forest_edge", "riparian"],
      marking_radius_m:         60,
      revisit_radius_m:         50,
      route_reuse_threshold_m:  200,
      freshness_cluster_threshold: 0.08,
      scent_weight:             0.9
    },

    movement_pattern: {
      loopback_radius_m:                        40,
      zigzag_direction_threshold_deg:            60,
      escape_line_direction_variance_threshold:  0.12,
      water_approach_radius_m:                  100,
      trail_reuse_radius_m:                      50,
      pattern_tags: [
        "rapid_open_country_escape", "long_run_escape", "zigzag_escape",
        "water_edge_reentry", "cover_loop"
      ]
    },

    behavior_research: {
      primary_habitat: ["shrub_cover", "rocky_slope", "forest_edge", "riparian", "subalpine_ridge"]
    },

    terrain_intelligence: {
      terrain_weight:      1.0,
      water_edge_weight:   1.1,
      cover_weight:        1.2,
      open_ground_weight:  0.8,
      elevation_weight:    1.1
    }
  },

  black_bear: {
    common_name: "Black Bear",
    species_key: "black_bear",
    track_shape: "5toe_plantigrade_wide",
    track_size_cm: { front: "10-18", hind: "14-22" },
    diet: "omnivore - berries, mast, insects, carrion, salmon, small mammals",
    activity: "diurnal",
    water_needs: "moderate - opportunistic drinker, attracted to salmon streams",
    migratory: false,

    behavior_tags:        ["opportunistic", "curious", "denning", "solitary"],
    movement_tags:        ["walk", "amble", "lope"],
    alert_behavior:       ["charge_bluff", "retreat", "tree_climb"],
    diet_type:            ["omnivore"],
    feeding_behavior:     ["forage", "graze", "dig", "fish", "browse"],
    group_behavior:       ["solitary", "sow_cub_pair"],
    flight_behavior_tags: ["flight", "retreat", "escape"],
    forage_behavior_tags: ["forage", "dig", "graze", "browse", "meander"],

    predator_of: ["deer_fawn", "elk_calf", "salmon", "ground_squirrel", "honeybee"],
    prey_of:     ["gray_wolf", "mountain_lion"],

    predator_prey: {
      risk_radius_m:             200,
      pressure_weight:           1.0,
      trail_avoidance_radius_m:  80
    },

    track_age_decay: {
      weight:                    0.80,
      same_band_threshold:       0.09,
      separate_band_threshold:   0.30,
      environmental_sensitivity: 0.70,
      tags: ["large_impression_retains_shape", "good_mud_retention", "substrate_dependent"]
    },

    flight_or_forage: {
      flight_weight:                  0.8,
      forage_weight:                  1.4,
      direction_change_threshold_deg:  90,
      spread_tightness_threshold_m:    45,
      stride_variance_threshold:       0.20,
      freshness_cluster_threshold:     0.09
    },

    denning_behavior: {
      den_types:                  ["ground_den", "rock_cavity_den", "hollow_tree", "excavated_burrow"],
      den_site_tags:              ["dense_evergreen_cover", "rocky_slope", "conifer_forest", "brushland"],
      den_return_pattern_tags:    ["den_centered_travel", "winter_den_return", "cover_reentry", "burrow_center_loop"],
      den_radius_m:               15,
      return_radius_m:            25,
      bedding_spread_threshold_m: 40,
      freshness_cluster_threshold: 0.08,
      denning_weight:             1.1
    },

    scent_marking_behavior: {
      scent_marking_tags:       ["tree_rub", "bite_mark", "urine_mark", "scat_mark", "scent_post_use"],
      loopback_pattern_tags:    ["localized_loopback", "forest_patch_loopback", "burrow_network_revisit"],
      travel_context_tags:      ["conifer_forest", "dense_evergreen_cover", "riparian", "shrub_cover"],
      marking_radius_m:         120,
      revisit_radius_m:         60,
      route_reuse_threshold_m:  180,
      freshness_cluster_threshold: 0.10,
      scent_weight:             1.0
    },

    movement_pattern: {
      loopback_radius_m:                        30,
      zigzag_direction_threshold_deg:            65,
      escape_line_direction_variance_threshold:  0.22,
      water_approach_radius_m:                  120,
      trail_reuse_radius_m:                      40,
      pattern_tags: [
        "localized_loopback", "patch_forage", "meandering_search",
        "shoreline_loopback", "aquatic_corridor_use", "cover_patch_revisit"
      ]
    },

    behavior_research: {
      primary_habitat: [
        "conifer_forest", "mixed_forest", "dense_evergreen_cover",
        "riparian", "shrub_cover", "brushland", "wetland_edge"
      ]
    },

    terrain_intelligence: {
      terrain_weight:      1.0,
      water_edge_weight:   1.2,
      cover_weight:        1.3,
      open_ground_weight:  0.7,
      elevation_weight:    0.9
    }
  }
};

export function runSchemaSelfTest() {
  console.log("=== SNAC Species Schema Self-Test ===\n");

  const result = validateSpeciesProfiles(MOCK_SPECIES_PROFILES);

  console.log(`Profiles validated: ${result.profileCount}`);
  console.log(`Passed: ${result.summary.passed}  Failed: ${result.summary.failed}  Avg score: ${result.summary.avgScore}%\n`);

  for (const r of result.results) {
    const icon = r.valid ? "" : "";
    console.log(`${icon} [${r.key}]  score=${r.score}%  errors=${r.errors.length}  warnings=${r.warnings.length}  info=${r.info.length}`);
    if (r.errors.length) {
      for (const e of r.errors) console.log(`    ERROR   ${e.path} - ${e.status}`);
    }
    if (r.warnings.length) {
      for (const w of r.warnings) console.log(`    WARN    ${w.path} - ${w.status}`);
    }
  }

  console.log("\n--- Adapter test ---");
  const rawGrok = {
    name: "Test Animal",
    species_id: "test_animal",
    behavior: ["alert", "forage"],
    predator_alert: { risk_radius_m: 100, pressure_weight: 1.0 },
    predator_targets: ["mouse"],
    decay_curve: { weight: 0.8, same_band_threshold: 0.1, separate_band_threshold: 0.3 }
  };
  const adapted = adaptSpeciesProfile(rawGrok);
  console.log("Adapted keys:", Object.keys(adapted).join(", "));
  console.log("common_name:", adapted.common_name);
  console.log("predator_prey:", JSON.stringify(adapted.predator_prey));
  console.log("predator_of:", adapted.predator_of);
  console.log("track_age_decay:", JSON.stringify(adapted.track_age_decay));
  console.log("\nSelf-test complete.");

  return result;
}

  