export const PENDING = '__pending_behavioral_data__';

const TERRAIN_MAP = {
  'forest':            ['forest', 'mixed_forest'],
  'coniferous forest': ['conifer_forest', 'dense_evergreen_cover'],
  'conifer forest':  ['conifer_forest', 'dense_evergreen_cover'],
  'boreal forest':   ['conifer_forest', 'taiga'],
  'boreal':          ['conifer_forest', 'taiga'],
  'mixed forest':    ['mixed_forest'],
  'deciduous forest':['mixed_forest'],
  'mountain':          ['mountain_slope', 'subalpine_ridge'],
  'alpine':            ['alpine_cliff', 'high_alpine_tundra'],
  'tundra':            ['rock_tundra', 'high_alpine_tundra'],
  'taiga':             ['taiga', 'conifer_forest'],
  'wetland':           ['wetland', 'wetland_edge'],
  'wetlands':          ['wetland', 'wetland_edge'],
  'swamp':             ['wetland', 'wetland_edge'],
  'marsh':             ['wetland', 'wetland_edge'],
  'bog':               ['wetland'],
  'riparian':          ['riparian', 'stream_bank'],
  'river':             ['riparian', 'river_edge'],
  'rivers':            ['riparian', 'river_edge'],
  'streams':           ['stream_bank', 'riparian'],
  'lake':              ['lake_edge', 'wetland_edge'],
  'pond':              ['pond', 'wetland_edge'],
  'grassland':         ['grassland', 'prairie'],
  'prairie':           ['prairie', 'grassland'],
  'open plains':     ['prairie', 'open_country'],
  'open field':      ['open_country', 'grassland'],
  'meadow':            ['grassland', 'prairie'],
  'savanna':           ['grassland', 'open_country'],
  'desert':            ['semiarid_open_country', 'open_country'],
  'semi-arid':       ['semiarid_open_country'],
  'scrub':             ['shrub_cover', 'brushland'],
  'shrub':             ['shrub_cover'],
  'brushy':            ['brushland', 'shrub_cover'],
  'forest edge':     ['forest_edge', 'agricultural_edge'],
  'woodland edge':   ['forest_edge'],
  'edge habitat':    ['forest_edge', 'agricultural_edge'],
  'urban':             ['agricultural_edge'],
  'suburban':          ['agricultural_edge'],
  'farmland':          ['agricultural_edge'],
  'agricultural':      ['agricultural_edge'],
  'cliff':             ['alpine_cliff', 'rocky_slope'],
  'rocky':             ['rocky_slope'],
  'rocky slope':     ['rocky_slope'],
  'coastal':           ['riparian', 'wetland_edge'],
  'moorland':          ['prairie', 'open_country'],
  'mountains':         ['mountain_slope', 'subalpine_ridge'],
  'forests':           ['forest', 'mixed_forest'],
  'open fields':     ['open_country', 'grassland', 'prairie'],
  'open range':      ['open_country', 'grassland'],
  'rocky hills':     ['rocky_slope', 'mountain_slope'],
  'rocky hillsides': ['rocky_slope'],
  'alpine cliffs':   ['alpine_cliff'],
  'alpine thickets': ['subalpine_ridge', 'shrub_cover'],
  'alpine meadows':  ['subalpine_ridge', 'grassland'],
  'boreal forests':  ['conifer_forest', 'taiga'],
  'woodland':          ['mixed_forest', 'forest'],
  'woodlands':         ['mixed_forest', 'forest'],
  'mixed woodlands': ['mixed_forest'],
  'conifer forest':  ['conifer_forest', 'dense_evergreen_cover'],
  'subalpine forests':['conifer_forest', 'subalpine_ridge'],
  'thickets':          ['shrub_cover', 'brushland'],
  'brushy edges':    ['brushland', 'shrub_cover'],
  'brushy fields':   ['brushland', 'agricultural_edge'],
  'brush':           ['brushland', 'shrub_cover'],
  'edge habitats':   ['forest_edge', 'agricultural_edge'],
  'woodland edges':  ['forest_edge'],
  'meadows':         ['grassland', 'prairie'],
  'pasture':           ['agricultural_edge', 'grassland'],
  'dry plains':      ['semiarid_open_country', 'open_country'],
  'arid scrub':      ['semiarid_open_country', 'shrub_cover'],
  'parks':             ['agricultural_edge', 'grassland'],
  'paths':             ['agricultural_edge'],
  'roads':             ['agricultural_edge'],
  'urban areas':     ['agricultural_edge'],
  'urban edge':      ['agricultural_edge', 'forest_edge'],
  'suburban areas':  ['agricultural_edge'],
  'garden':          ['agricultural_edge'],
  'gardens':           ['agricultural_edge'],
  'hedgerows':         ['agricultural_edge', 'shrub_cover'],
  'hedgerow':          ['agricultural_edge', 'shrub_cover'],
  'farm':            ['agricultural_edge'],
  'heathland':         ['shrub_cover', 'open_country'],
  'rainforest':        ['forest', 'mixed_forest'],
  'cloud forest':    ['mixed_forest'],
  'mangrove':          ['wetland_edge', 'riparian']
};

const FLIGHT_GAITS  = new Set(['bound','gallop','run','burst','pounce','sprint','stot']);
const FORAGE_GAITS  = new Set(['walk','browse','graze','meander','amble','waddle','scurry','shuffle','dig','lope']);
const FLIGHT_TAGS   = ['flight','flee','escape','evasive','burst','spooked'];
const FORAGE_TAGS   = ['forage','feeding','browse','grazing','slow_feed','meander'];

const HERBIVORE_WORDS  = new Set(['grass','grasse','shrub','bark','leaf','leaves','herb','root','seed','berry','berrie','fruit','lichen','moss','aquatic plant','forb','twig','bud','hay','grain','silage','legume','cone','needle','heather','clover','vegetat']);
const CARNIVORE_WORDS  = new Set(['deer','elk','moose','rabbit','rodent','fish','bird','mammal','carrion','prey','meat','insect','bug','worm','slug','crustacean','amphibian','reptile','caiman','peccary','capybara','wildebeest','zebra','impala','antelope','vole','mouse','rat','squirrel']);
const OMNI_THRESHOLD   = 2;

const ACTIVITY_KEYWORDS = {
  crepuscular: ['crepuscular','dawn','dusk','dawn/dusk'],
  nocturnal:   ['nocturnal','night','nighttime'],
  diurnal:     ['diurnal','daytime','day active']
};

function lower(v) { return typeof v === 'string' ? v.trim().toLowerCase() : ''; }

function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }

function normaliseSpeciesKey(s) {
  return lower(s).replace(/\s+/g, '_').replace(/-/g, '_');
}

function arrayToRangeString(arr) {
  if (!Array.isArray(arr) || arr.length < 2) return arr?.[0] != null ? String(arr[0]) : null;
  return `${arr[0]}-${arr[arr.length - 1]}`;
}

function deriveTerrain(terrainArray) {
  if (!Array.isArray(terrainArray)) return [];
  const tags = new Set();
  for (const t of terrainArray) {
    const key = lower(t);
    const mapped = TERRAIN_MAP[key];
    if (mapped) mapped.forEach(tag => tags.add(tag));
    else tags.add(key.replace(/\s+/g, '_'));
  }
  return [...tags];
}

function deriveDietType(dietArray) {
  if (!Array.isArray(dietArray)) return [];
  const joined = dietArray.map(lower).join(' ');
  let herbScore = 0, carnScore = 0;
  for (const word of HERBIVORE_WORDS) if (joined.includes(word)) herbScore++;
  for (const word of CARNIVORE_WORDS) if (joined.includes(word)) carnScore++;

  if (herbScore >= OMNI_THRESHOLD && carnScore >= OMNI_THRESHOLD) return ['omnivore'];
  if (carnScore >= OMNI_THRESHOLD && herbScore < OMNI_THRESHOLD) return ['carnivore'];
  if (herbScore >= OMNI_THRESHOLD && carnScore < OMNI_THRESHOLD) return ['herbivore'];
  if (carnScore > 0 && herbScore > 0) return ['omnivore'];
  if (carnScore > 0) return ['carnivore'];
  return ['herbivore'];
}

function deriveFeedingBehavior(dietArray) {
  const tags = [];
  const joined = (dietArray || []).map(lower).join(' ');
  if (joined.includes('grass') || joined.includes('graze')) tags.push('graze');
  if (joined.includes('shrub') || joined.includes('browse') || joined.includes('twig') || joined.includes('bark')) tags.push('browse');
  if (joined.includes('insect') || joined.includes('bug') || joined.includes('worm')) tags.push('forage');
  if (joined.includes('fish') || joined.includes('crustacean')) tags.push('forage');
  if (joined.includes('carrion')) tags.push('scavenge');
  if (joined.includes('fruit') || joined.includes('berry') || joined.includes('seed')) tags.push('forage');
  if (joined.includes('root') || joined.includes('dig') || joined.includes('grub')) tags.push('dig');
  return uniq(tags.length ? tags : ['forage']);
}

function deriveBehaviorTags(gaitPatterns, terrainArray, notes, dietType) {
  const tags = new Set();

  for (const g of (gaitPatterns || [])) {
    const gl = lower(g);
    if (FLIGHT_GAITS.has(gl)) { tags.add('flight'); tags.add('alert'); }
    if (FORAGE_GAITS.has(gl)) { tags.add('forage'); }
    if (['trot','lope'].includes(gl)) tags.add('patrol');
    if (['stalk','pounce'].includes(gl)) tags.add('stalk');
    if (['climb'].includes(gl)) tags.add('arboreal');
    if (['dig'].includes(gl)) tags.add('excavate');
  }

  const dt = (dietType || [])[0];
  if (dt === 'carnivore') tags.add('territorial');
  if (dt === 'omnivore')  tags.add('opportunistic');
  if (dt === 'herbivore') tags.add('browse');

  const notesL = lower(notes || '');
  if (notesL.includes('territorial')) tags.add('territorial');
  if (notesL.includes('scent')) tags.add('scent_marking');
  if (notesL.includes('solitary')) tags.add('solitary');
  if (notesL.includes('pack') || notesL.includes('pride') || notesL.includes('herd') || notesL.includes('mob')) tags.add('group_travel');
  if (notesL.includes('den') || notesL.includes('burrow') || notesL.includes('lodge')) tags.add('denning');
  if (notesL.includes('nocturnal') || notesL.includes('crepuscular')) tags.add('alert');

  return [...tags];
}

function deriveMovementTags(gaitPatterns) {
  const map = {
    'walk': 'walk', trot: 'trot', lope: 'lope', gallop: 'gallop',
    'bound': 'bound', hop: 'hop', bound_hop: 'bound',
    'amble': 'amble', waddle: 'waddle', scurry: 'scurry',
    'stalk': 'stalk', pounce: 'pounce', slide: 'slide',
    'swim': 'swim', climb: 'climb', run: 'run'
  };
  return uniq((gaitPatterns || []).map(g => map[lower(g)]).filter(Boolean));
}

function deriveFlightTags(gaitPatterns, notes) {
  const tags = new Set();
  for (const g of (gaitPatterns || [])) {
    if (FLIGHT_GAITS.has(lower(g))) tags.add(lower(g));
  }
  const notesL = lower(notes || '');
  if (notesL.includes('alarm') || notesL.includes('alert') || notesL.includes('flush')) tags.add('alert');
  if (notesL.includes('burst')) tags.add('burst');
  FLIGHT_TAGS.forEach(t => tags.add(t));
  return [...tags];
}

function deriveForageTags(gaitPatterns, dietArray) {
  const tags = new Set(FORAGE_TAGS);
  for (const g of (gaitPatterns || [])) {
    if (FORAGE_GAITS.has(lower(g))) tags.add(lower(g));
  }
  const joined = (dietArray || []).map(lower).join(' ');
  if (joined.includes('browse') || joined.includes('shrub')) tags.add('browse');
  if (joined.includes('graze') || joined.includes('grass')) tags.add('graze');
  return [...tags];
}

function deriveGroupBehavior(clusteringConfig, notes) {
  const tags = [];
  const minPts = clusteringConfig?.min_pts ?? 4;
  const notesL = lower(notes || '');
  if (minPts <= 3) tags.push('solitary');
  if (minPts >= 4 && minPts <= 5) tags.push('small_group');
  if (minPts >= 5) tags.push('herd');
  if (notesL.includes('pack')) tags.push('pack');
  if (notesL.includes('pride')) tags.push('pride');
  if (notesL.includes('mob')) tags.push('mob');
  if (notesL.includes('pair') || notesL.includes('family')) tags.push('family_group');
  return uniq(tags);
}

function deriveActivity(notes) {
  const notesL = lower(notes || '');
  for (const [pattern, keywords] of Object.entries(ACTIVITY_KEYWORDS)) {
    if (keywords.some(k => notesL.includes(k))) return pattern;
  }
  return 'crepuscular';
}

function deriveWaterNeedsString(litresPerDay) {
  if (!litresPerDay || litresPerDay < 0.5) return 'minimal - moisture from food';
  if (litresPerDay < 2) return '1-2 days - moderate water needs';
  if (litresPerDay < 5) return 'daily - requires regular water access';
  return 'daily - high water needs, stays near reliable water';
}

function deriveTrackShape(trackDepthDescription, common_name) {
  const desc = lower(trackDepthDescription || '') + ' ' + lower(common_name || '');
  if (desc.includes('cloven') || desc.includes('hoof')) return 'cloven_hoof';
  if (desc.includes('round') || desc.includes('oval')) {
    if (desc.includes('four') || desc.includes('4 toe')) return 'oval_4toe';
    if (desc.includes('five') || desc.includes('5 toe')) return 'round_5toe_plantigrade';
    return 'round_4toe';
  }
  if (desc.includes('three') || desc.includes('3 toe')) return '3toe_bird';
  if (desc.includes('hand') || desc.includes('finger')) return 'hand_like_5toe';
  if (desc.includes('webbed')) return 'webbed_5toe';
  if (desc.includes('five') || desc.includes('5 toe')) return 'oval_5toe';
  if (desc.includes('plantigrade') || desc.includes('heel') ||
      (desc.includes('claw') && (desc.includes('bear') || desc.includes('massive') || desc.includes('large')))) {
    return 'round_5toe_plantigrade';
  }
  return 'oval_4toe';
}

function normalisePreyList(arr) {
  return (arr || []).map(s => normaliseSpeciesKey(String(s)));
}

export function adaptProfile(speciesKey, raw) {
  if (!raw || typeof raw !== 'object') return null;

  const key          = normaliseSpeciesKey(speciesKey);
  const gaits        = raw.gait_patterns || [];
  const dietArr      = Array.isArray(raw.diet) ? raw.diet : (raw.diet ? [raw.diet] : []);
  const terrainArr   = raw.terrain || [];
  const notes        = raw.notes || '';
  const clustering   = raw.clustering || {};
  const predPrey     = raw.predator_prey || {};

  const bw = raw.behavior_weights || {};

  const homeRangeKm2 = raw.home_range_km2 ?? 10;
  const rawRadius = Math.sqrt(homeRangeKm2) * 180;
  const derivedRiskRadiusM = homeRangeKm2 < 5   ? Math.round(Math.min(80,  Math.max(30, rawRadius)))
                           : homeRangeKm2 < 50  ? Math.round(Math.min(200, Math.max(80, rawRadius)))
                           :                      Math.round(Math.min(400, Math.max(200, rawRadius)));

  const dietType       = deriveDietType(dietArr);
  const feedingBehavior = deriveFeedingBehavior(dietArr);
  const behaviorTags   = deriveBehaviorTags(gaits, terrainArr, notes, dietType);
  const movementTags   = deriveMovementTags(gaits);
  const flightTags     = deriveFlightTags(gaits, notes);
  const forageTags     = deriveForageTags(gaits, dietArr);
  const groupBehavior  = deriveGroupBehavior(clustering, notes);
  const activity       = deriveActivity(notes);
  const waterNeeds     = deriveWaterNeedsString(raw.water_needs_l_per_day);
  const habitatTags    = deriveTerrain(terrainArr);
  const predatorOf     = normalisePreyList(predPrey.predatorOf || predPrey.predator_of || []);
  const preyOf         = normalisePreyList(predPrey.preyOf || predPrey.prey_of || []);
  const isPredator     = predatorOf.length > 0 ||
    dietArr.join(' ').match(/\b(mammal|deer|elk|moose|caribou|rabbit|rodent|bird|fish|prey|zebra|wildebeest|antelope|impala|buffalo|capybara|peccary)\b/i);
  const derivedPressureWeight = isPredator ? 1.1 : 0.8;
  const migratory      = (raw.migration_distance_km || 0) > 5;
  const trackShape     = deriveTrackShape(raw.track_depth, raw.common_name);

  const frontRaw = raw.track_size_cm?.front;
  const hindRaw  = raw.track_size_cm?.rear ?? raw.track_size_cm?.hind;
  const trackSizeCm = {
    front: Array.isArray(frontRaw) ? arrayToRangeString(frontRaw) : (frontRaw ?? null),
    hind:  Array.isArray(hindRaw)  ? arrayToRangeString(hindRaw)  : (hindRaw  ?? null)
  };

  return {
    common_name:      raw.common_name ?? key,
    scientific_name:  raw.scientific_name ?? null,
    species_key:      key,
    track_shape:      trackShape,
    track_size_cm:    trackSizeCm,
    track_depth_notes: raw.track_depth ?? null,

    diet:             dietArr.join(', '),
    diet_type:        dietType,
    feeding_behavior: feedingBehavior,
    activity:         activity,
    water_needs:          waterNeeds,
    water_needs_l_per_day: raw.water_needs_l_per_day ?? null,
    migratory:        migratory,
    home_range_km2:   raw.home_range_km2 ?? null,
    migration_distance_km: raw.migration_distance_km ?? null,

    behavior_tags:        behaviorTags,
    movement_tags:        movementTags,
    flight_behavior_tags: flightTags,
    forage_behavior_tags: forageTags,
    alert_behavior:       ['freeze','retreat','alarm'].concat(
                            notes.toLowerCase().includes('alarm') ? ['alarm_call'] : []
                          ),
    group_behavior:       groupBehavior,

    predator_of: predatorOf,
    prey_of:     preyOf,
    predator_prey: {
      risk_radius_m:             derivedRiskRadiusM,
      pressure_weight:           derivedPressureWeight,
      trail_avoidance_radius_m:  Math.round(derivedRiskRadiusM * 0.4)
    },

    behavior_research: {
      primary_habitat: habitatTags
    },

    clustering: {
      eps_m:                 clustering.eps_m               ?? null,
      stride_multiplier:     clustering.stride_multiplier   ?? null,
      min_pts:               clustering.min_pts             ?? null,
      typical_group_radius_m: clustering.typical_group_radius_m ?? null,
      source:                clustering.source              ?? null
    },

    track_age_decay: bw.track_age_decay ? { ...bw.track_age_decay } : {
      _status:                    PENDING,
      weight:                     1.0,
      same_band_threshold:        0.15,
      separate_band_threshold:    0.35,
      environmental_sensitivity:  0.70,
      tags:                       ['medium_decay']
    },

    flight_or_forage: bw.flight_or_forage ? { ...bw.flight_or_forage } : {
      flight_weight:                    0.55,
      forage_weight:                    0.45,
      direction_change_threshold_deg:   45,
      spread_tightness_threshold_m:     25,
      stride_variance_threshold:        0.35,
      freshness_cluster_threshold:      0.65
    },

    denning_behavior: bw.denning_behavior ? { ...bw.denning_behavior } : {
      den_types:                   ['depression_nest','cover_loafing'],
      den_site_tags:               ['dense_cover'],
      den_return_pattern_tags:     ['revisit_loop'],
      den_radius_m:                15,
      return_radius_m:             50,
      bedding_spread_threshold_m:  12,
      denning_weight:              0.75
    },

    scent_marking_behavior: bw.scent_marking_behavior ? { ...bw.scent_marking_behavior } : {
      scent_marking_tags:             ['urine_mark','scrape_mark'],
      loopback_pattern_tags:          ['localized_loopback'],
      travel_context_tags:            ['trail_edge_mark'],
      marking_radius_m:               8,
      revisit_radius_m:               20,
      route_reuse_threshold_m:        15,
      scent_weight:                   0.65
    },

    movement_pattern: bw.movement_pattern ? { ...bw.movement_pattern } : {
      loopback_radius_m:                          40,
      zigzag_direction_threshold_deg:             35,
      escape_line_direction_variance_threshold:   0.20,
      water_approach_radius_m:                    50,
      trail_reuse_radius_m:                       10,
      pattern_tags:                               ['loopback','zigzag']
    },

    terrain_intelligence: bw.terrain_intelligence ? { ...bw.terrain_intelligence } : {
      terrain_weight:    0.25,
      water_edge_weight: 0.25,
      cover_weight:      0.25,
      open_ground_weight:0.15,
      elevation_weight:  0.10
    },

    _raw: {
      gait_patterns:          gaits,
      terrain:                terrainArr,
      notes:                  notes,
      water_needs_l_per_day:  raw.water_needs_l_per_day
    }
  };
}

export function adaptProfiles(rawMap) {
  if (!rawMap || typeof rawMap !== 'object') return {};
  const out = {};
  for (const [key, raw] of Object.entries(rawMap)) {
    if (key === 'default') continue;
    if (!raw || typeof raw !== 'object') continue;
    if (!raw.common_name && !raw.track_size_cm && !raw.gait_patterns) continue;
    const adapted = adaptProfile(key, raw);
    if (adapted) out[key] = adapted;
  }
  return out;
}

export function mergeBehavioralData(adaptedProfile, behavioralData) {
  if (!adaptedProfile || !behavioralData) return adaptedProfile;
  const merged = { ...adaptedProfile };

  const blocks = [
    'track_age_decay', 'flight_or_forage', 'denning_behavior',
    'scent_marking_behavior', 'movement_pattern', 'terrain_intelligence'
  ];

  for (const block of blocks) {
    if (behavioralData[block] && typeof behavioralData[block] === 'object') {
      merged[block] = { ...behavioralData[block] };
    }
  }

  if (behavioralData.predator_prey) {
    merged.predator_prey = {
      ...merged.predator_prey,
      ...behavioralData.predator_prey
    };
  }

  return merged;
}

export function getPendingReport(profiles) {
  const blocks = [
    'track_age_decay', 'flight_or_forage', 'denning_behavior',
    'scent_marking_behavior', 'movement_pattern', 'terrain_intelligence'
  ];

  let total = 0, complete = 0, pending = 0;
  const byBlock = {};

  for (const block of blocks) {
    byBlock[block] = { complete: 0, pending: 0 };
  }

  for (const [key, profile] of Object.entries(profiles)) {
    if (key === 'default') continue;
    total++;
    let profilePending = false;
    for (const block of blocks) {
      const b = profile[block];
      if (!b || b._status === PENDING || b.weight === PENDING) {
        byBlock[block].pending++;
        profilePending = true;
      } else {
        byBlock[block].complete++;
      }
    }
    profilePending ? pending++ : complete++;
  }

  return { total, complete, pending, byBlock };}