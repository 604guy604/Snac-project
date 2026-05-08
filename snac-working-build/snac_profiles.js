import { adaptProfiles }        from './snac_profile_adapter.js';


const RAW_GROK = {

  blacktail_deer: {
    common_name: "Black-tailed Deer", scientific_name: "Odocoileus hemionus columbianus",
    home_range_km2: 3.5, migration_distance_km: 10,
    gait_patterns: ["walk","trot","bound"],
    track_size_cm: { front: [6,8], rear: [5,7] },
    diet: ["grasses","shrubs","berries"], water_needs_l_per_day: 3.5,
    terrain: ["forest","mountain","coastal"],
    track_depth: "light to moderate depending on substrate",
    notes: "Common in coastal BC; crepuscular; edge habitats",
    clustering: { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45, source: "Elbroch + coastal BC" },
    predator_prey: { predatorOf: [], preyOf: ["cougar","wolf","coyote","bobcat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 30, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["depression_nest","cover_loafing"], den_site_tags: ["dense_cover","ridge_bed"], den_return_pattern_tags: ["shade_bed","repeated_entry_exit"], den_radius_m: 12, return_radius_m: 40, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 20, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 35, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 45, trail_reuse_radius_m: 10, pattern_tags: ["zigzag_escape","forage_spread_then_regroup"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.20, cover_weight: 0.35, open_ground_weight: 0.15, elevation_weight: 0.05 }
    }
  },

  white_tailed_deer: {
    common_name: "White-tailed Deer", scientific_name: "Odocoileus virginianus",
    home_range_km2: 1.2, migration_distance_km: 15,
    gait_patterns: ["walk","trot","bound"],
    track_size_cm: { front: [5.5,8], rear: [5,7] },
    diet: ["twigs","fruits","acorns","grasses"], water_needs_l_per_day: 3,
    terrain: ["forest","swamp","field"],
    track_depth: "moderate, sharp hooves with pointed toes",
    notes: "Highly adaptive to human presence; crepuscular.",
    clustering: { eps_m: 40.0, stride_multiplier: 2.2, min_pts: 5, typical_group_radius_m: 55, source: "Movebank + Elbroch" },
    predator_prey: { predatorOf: [], preyOf: ["cougar","wolf","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.32, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["depression_nest","brush_bedding"], den_site_tags: ["dense_cover","shade_bed"], den_return_pattern_tags: ["cover_reentry"], den_radius_m: 10, return_radius_m: 35, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["edge_revisit"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 18, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 30, zigzag_direction_threshold_deg: 45, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 40, trail_reuse_radius_m: 8, pattern_tags: ["zigzag_escape","forage_spread_then_regroup"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.25, cover_weight: 0.30, open_ground_weight: 0.15, elevation_weight: 0.05 }
    }
  },

  mule_deer: {
    common_name: "Mule Deer", scientific_name: "Odocoileus hemionus",
    home_range_km2: 10, migration_distance_km: 80,
    gait_patterns: ["walk","bound","trot"],
    track_size_cm: { front: [6,8], rear: [6,8] },
    diet: ["shrubs","leaves","grasses"], water_needs_l_per_day: 3.0,
    terrain: ["mountains","forests","open fields"],
    track_depth: "narrow cloven hoof, symmetrical, deep bounding gaps",
    notes: "Distinct bounding gait; common in western US and Canada; crepuscular.",
    clustering: { eps_m: 38.0, stride_multiplier: 2.2, min_pts: 5, typical_group_radius_m: 50, source: "Elbroch" },
    predator_prey: { predatorOf: [], preyOf: ["cougar","wolf","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.48, forage_weight: 0.52, direction_change_threshold_deg: 52, spread_tightness_threshold_m: 32, stride_variance_threshold: 0.31, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["depression_nest"], den_site_tags: ["dense_cover","ridge_bed"], den_return_pattern_tags: ["shade_bed"], den_radius_m: 12, return_radius_m: 40, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.78 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 20, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.58 },
      movement_pattern:      { loopback_radius_m: 35, zigzag_direction_threshold_deg: 42, escape_line_direction_variance_threshold: 0.24, water_approach_radius_m: 45, trail_reuse_radius_m: 10, pattern_tags: ["zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.22, cover_weight: 0.33, open_ground_weight: 0.15, elevation_weight: 0.05 }
    }
  },

  elk: {
    common_name: "Elk", scientific_name: "Cervus canadensis",
    home_range_km2: 60, migration_distance_km: 100,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [9,13], rear: [8,12] },
    diet: ["grasses","woody plants","forbs"], water_needs_l_per_day: 10,
    terrain: ["forest","meadow","mountain"],
    track_depth: "deep, rounded heart shape",
    notes: "Seasonal migrations; strong herding; bugling in rut; crepuscular.",
    clustering: { eps_m: 45.0, stride_multiplier: 2.4, min_pts: 5, typical_group_radius_m: 65, source: "Movebank" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","grizzly_bear","cougar"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 40, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cover_loafing","group_bed"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","rubbing"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 10, revisit_radius_m: 30, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 50, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 50, trail_reuse_radius_m: 12, pattern_tags: ["group_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.25, cover_weight: 0.25, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },

  moose: {
    common_name: "Moose", scientific_name: "Alces alces",
    home_range_km2: 30, migration_distance_km: 50,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [13,18], rear: [12,17] },
    diet: ["aquatic plants","willows","birch"], water_needs_l_per_day: 10,
    terrain: ["bog","tundra","boreal forest"],
    track_depth: "deep, large heart-shaped tracks",
    notes: "Largest cervid; solitary; excellent swimmers.",
    clustering: { eps_m: 55.0, stride_multiplier: 2.5, min_pts: 4, typical_group_radius_m: 70, source: "Elbroch" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","grizzly_bear"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 50, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cover_loafing"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["low_movement"], den_radius_m: 25, return_radius_m: 70, bedding_spread_threshold_m: 20, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 60, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 60, trail_reuse_radius_m: 15, pattern_tags: ["linear_travel"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.40, cover_weight: 0.20, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },

  caribou: {
    common_name: "Caribou", scientific_name: "Rangifer tarandus",
    home_range_km2: 300, migration_distance_km: 1000,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [10,13], rear: [9,12] },
    diet: ["lichens","shrubs","grasses"], water_needs_l_per_day: 5,
    terrain: ["tundra","taiga"],
    track_depth: "broad and splayed hooves, sometimes dragging marks in snow",
    notes: "Massive seasonal migrations; both sexes grow antlers.",
    clustering: { eps_m: 50.0, stride_multiplier: 2.4, min_pts: 5, typical_group_radius_m: 80, source: "Movebank" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.65, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cover_loafing"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 10, revisit_radius_m: 30, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 70, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 50, trail_reuse_radius_m: 15, pattern_tags: ["migration_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.20, open_ground_weight: 0.30, elevation_weight: 0.10 }
    }
  },

  coyote: {
    common_name: "Coyote", scientific_name: "Canis latrans",
    home_range_km2: 40, migration_distance_km: 30,
    gait_patterns: ["trot","lope","bound"],
    track_size_cm: { front: [5,7.5], rear: [4.5,7] },
    diet: ["rodents","fruits","carrion","livestock"], water_needs_l_per_day: 2,
    terrain: ["desert","grassland","urban"],
    track_depth: "narrower than dogs; often single file; claws visible",
    notes: "Highly adaptable; often vocal; seen alone or in small groups; crepuscular.",
    clustering: { eps_m: 22.5, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25, source: "Movebank + Elbroch" },
    predator_prey: { predatorOf: ["rabbit","rodents","deer_fawns"], preyOf: ["wolf","cougar"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 30, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","burrow"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 15, return_radius_m: 40, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 30, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 40, trail_reuse_radius_m: 10, pattern_tags: ["trail_reuse","zigzag"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.25, open_ground_weight: 0.30, elevation_weight: 0.05 }
    }
  },

  gray_wolf: {
    common_name: "Gray Wolf", scientific_name: "Canis lupus",
    home_range_km2: 200, migration_distance_km: 80,
    gait_patterns: ["trot","lope","gallop"],
    track_size_cm: { front: [9,12], rear: [8,10] },
    diet: ["deer","elk","moose","small mammals"], water_needs_l_per_day: 3,
    terrain: ["taiga","tundra","forest"],
    track_depth: "oval-shaped with defined claw marks and straight-line travel",
    notes: "Pack hunters; long-distance travelers; vocalizations for communication.",
    clustering: { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45, source: "Movebank pack data" },
    predator_prey: { predatorOf: ["deer","elk","moose"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","cave"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.70, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.68, scent_weight: 0.70 },
      movement_pattern:      { loopback_radius_m: 50, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 50, trail_reuse_radius_m: 15, pattern_tags: ["linear_travel","pack_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.25, open_ground_weight: 0.25, elevation_weight: 0.10 }
    }
  },

  red_fox: {
    common_name: "Red Fox", scientific_name: "Vulpes vulpes",
    home_range_km2: 10, migration_distance_km: 5,
    gait_patterns: ["trot","bound","gallop"],
    track_size_cm: { front: [4,5.5], rear: [4,5] },
    diet: ["rodents","birds","fruit","insects"], water_needs_l_per_day: 1,
    terrain: ["forest","fields","urban"],
    track_depth: "small oval print with claws visible; direct register gait common",
    notes: "Often curls tail around body when resting; prefers edge habitats; crepuscular.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 20, source: "Elbroch" },
    predator_prey: { predatorOf: ["small_mammals","birds"], preyOf: ["coyote","wolf"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","burrow"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 6, revisit_radius_m: 20, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 45, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["trail_reuse","zigzag"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.30, open_ground_weight: 0.20, elevation_weight: 0.10 }
    }
  },

  snowshoe_hare: {
    common_name: "Snowshoe Hare", scientific_name: "Lepus americanus",
    home_range_km2: 0.5, migration_distance_km: 1,
    gait_patterns: ["bound","hop"],
    track_size_cm: { front: [4,5.5], rear: [10,13] },
    diet: ["twigs","bark","leaves","grasses"], water_needs_l_per_day: 0.4,
    terrain: ["boreal forests","swamps","alpine thickets"],
    track_depth: "large hind feet often land ahead of small front prints",
    notes: "Active year-round; tracks often in pairs with long stride in snow; nocturnal.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 10, source: "Elbroch bounding" },
    predator_prey: { predatorOf: [], preyOf: ["lynx","coyote","bobcat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.70, forage_weight: 0.30, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["form_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["low_movement"], den_radius_m: 5, return_radius_m: 20, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 10, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 25, trail_reuse_radius_m: 6, pattern_tags: ["zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.50, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },

  eastern_cottontail: {
    common_name: "Eastern Cottontail", scientific_name: "Sylvilagus floridanus",
    home_range_km2: 0.3, migration_distance_km: 0.2,
    gait_patterns: ["hop","bound"],
    track_size_cm: { front: [3,4.5], rear: [7.5,10] },
    diet: ["grasses","herbs","bark"], water_needs_l_per_day: 0.25,
    terrain: ["meadows","brushy fields","woodland edges"],
    track_depth: "hind feet often land ahead of front; toes spread in mud or snow",
    notes: "Common around suburban areas; zigzag bounding pattern; crepuscular.",
    clustering: { eps_m: 7.5, stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 9, source: "Elbroch" },
    predator_prey: { predatorOf: [], preyOf: ["coyote","fox","bobcat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.75, forage_weight: 0.25, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["form_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["low_movement"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 10, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 20, trail_reuse_radius_m: 5, pattern_tags: ["zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.50, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },

  european_badger: {
    common_name: "European Badger", scientific_name: "Meles meles",
    home_range_km2: 5, migration_distance_km: 2,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [6,8], rear: [7,9] },
    diet: ["earthworms","insects","fruit","small mammals"], water_needs_l_per_day: 1,
    terrain: ["woodland","farmland","urban edge"],
    track_depth: "broad front with long claws; rear smaller",
    notes: "Nocturnal; burrows; social groups.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 22, source: "European track keys" },
    predator_prey: { predatorOf: ["small_mammals","ground_birds"], preyOf: ["fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 20, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.70 },
      denning_behavior:      { den_types: ["burrow","sett"], den_site_tags: ["dense_cover","slope"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 8, return_radius_m: 30, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.75, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.70, scent_weight: 0.70 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 40, trail_reuse_radius_m: 10, pattern_tags: ["trail_reuse","zigzag"] },
      terrain_intelligence:  { terrain_weight: 0.30, water_edge_weight: 0.15, cover_weight: 0.35, open_ground_weight: 0.10, elevation_weight: 0.10 }
    }
  },

  red_deer: {
    common_name: "Red Deer", scientific_name: "Cervus elaphus",
    home_range_km2: 20, migration_distance_km: 30,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [10,14], rear: [9,13] },
    diet: ["grasses","heather","bark"], water_needs_l_per_day: 6,
    terrain: ["forest","moorland","mountain"],
    track_depth: "large rounded cloven",
    notes: "Roaring in rut; mixed herds; crepuscular.",
    clustering: { eps_m: 45.0, stride_multiplier: 2.3, min_pts: 5, typical_group_radius_m: 60, source: "European cervid" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 40, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cover_loafing"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","rubbing"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 10, revisit_radius_m: 30, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 50, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 50, trail_reuse_radius_m: 12, pattern_tags: ["group_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.25, cover_weight: 0.25, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },

  red_kangaroo: {
    common_name: "Red Kangaroo", scientific_name: "Macropus rufus",
    home_range_km2: 5, migration_distance_km: 20,
    gait_patterns: ["hop","bound"],
    track_size_cm: { front: [8,12], rear: [20,30] },
    diet: ["grasses","forbs"], water_needs_l_per_day: 2,
    terrain: ["open plains","arid scrub"],
    track_depth: "large hind feet; tail drag",
    notes: "Mob groups; dominant males; diurnal.",
    clustering: { eps_m: 50.0, stride_multiplier: 2.5, min_pts: 4, typical_group_radius_m: 70, source: "Auz hopping groups" },
    predator_prey: { predatorOf: [], preyOf: ["dingo"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.70, forage_weight: 0.30, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 40, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["resting_scrape"], den_site_tags: ["shade"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 15, return_radius_m: 50, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 60, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 60, trail_reuse_radius_m: 20, pattern_tags: ["hopping_linear"] },
      terrain_intelligence:  { terrain_weight: 0.30, water_edge_weight: 0.10, cover_weight: 0.10, open_ground_weight: 0.45, elevation_weight: 0.05 }
    }
  },

  dingo: {
    common_name: "Dingo", scientific_name: "Canis lupus dingo",
    home_range_km2: 80, migration_distance_km: 30,
    gait_patterns: ["trot","lope"],
    track_size_cm: { front: [6,9], rear: [5.5,8.5] },
    diet: ["kangaroo","small mammals","livestock"], water_needs_l_per_day: 2,
    terrain: ["desert","savanna","forest"],
    track_depth: "narrow dog-like; claws visible",
    notes: "Wild dog; pack or solitary; crepuscular.",
    clustering: { eps_m: 25.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 30, source: "Auz wild dog" },
    predator_prey: { predatorOf: ["kangaroo","wallaby"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","cave"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 15, return_radius_m: 50, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 8, revisit_radius_m: 30, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 50, trail_reuse_radius_m: 12, pattern_tags: ["linear_travel"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.20, open_ground_weight: 0.35, elevation_weight: 0.05 }
    }
  },

  lion: {
    common_name: "Lion", scientific_name: "Panthera leo",
    home_range_km2: 400, migration_distance_km: 50,
    gait_patterns: ["walk","stalk","gallop"],
    track_size_cm: { front: [15,20], rear: [14,19] },
    diet: ["zebra","wildebeest","buffalo","antelope"], water_needs_l_per_day: 8,
    terrain: ["savanna","grassland","woodland"],
    track_depth: "large round with claw marks",
    notes: "Pride hunter; dominant predator; territorial roaring; crepuscular.",
    clustering: { eps_m: 45.0, stride_multiplier: 2.4, min_pts: 4, typical_group_radius_m: 60, source: "African spoor guides" },
    predator_prey: { predatorOf: ["zebra","wildebeest","impala"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.30, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.70, forage_weight: 0.30, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 40, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.70 },
      denning_behavior:      { den_types: ["cave","thicket"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 30, return_radius_m: 80, bedding_spread_threshold_m: 20, freshness_cluster_threshold: 0.75, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_spray","rubbing"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 10, revisit_radius_m: 40, route_reuse_threshold_m: 25, freshness_cluster_threshold: 0.70, scent_weight: 0.75 },
      movement_pattern:      { loopback_radius_m: 50, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 60, trail_reuse_radius_m: 15, pattern_tags: ["linear_escape","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.30, water_edge_weight: 0.25, cover_weight: 0.30, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },

  jaguar: {
    common_name: "Jaguar", scientific_name: "Panthera onca",
    home_range_km2: 100, migration_distance_km: 20,
    gait_patterns: ["walk","stalk","pounce"],
    track_size_cm: { front: [10,13], rear: [9,12] },
    diet: ["capybara","peccary","tapir","caiman"], water_needs_l_per_day: 5,
    terrain: ["rainforest","wetland","savanna"],
    track_depth: "large round with claws",
    notes: "Apex ambush predator; nocturnal.",
    clustering: { eps_m: 30.0, stride_multiplier: 2.1, min_pts: 3, typical_group_radius_m: 40, source: "SA spoor" },
    predator_prey: { predatorOf: ["capybara","peccary"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.85, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.65, forage_weight: 0.35, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.70 },
      denning_behavior:      { den_types: ["cave","thicket"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 25, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.75, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_spray","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 12, revisit_radius_m: 35, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.70, scent_weight: 0.75 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 50, trail_reuse_radius_m: 15, pattern_tags: ["linear_escape","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.30, water_edge_weight: 0.30, cover_weight: 0.25, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },



  // BATCH 1 - 47 species


  american_marten: {
    common_name: "American Marten", scientific_name: "Martes americana",
    home_range_km2: 8, migration_distance_km: 2,
    gait_patterns: ["bound","lope","walk"],
    track_size_cm: { front: [4,5.5], rear: [4.5,6] },
    diet: ["small mammals","birds","berries","insects"], water_needs_l_per_day: 0.4,
    terrain: ["conifer forest","mixed forest","boreal"],
    track_depth: "five toes; asymmetric; often bounding pairs in snow",
    notes: "Arboreal and terrestrial; crepuscular; sensitive to habitat fragmentation.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15, source: "Elbroch mustelid" },
    predator_prey: { predatorOf: ["voles","red_squirrel","birds"], preyOf: ["fisher","coyote","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","rock_crevice"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 6, return_radius_m: 20, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 48, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 30, trail_reuse_radius_m: 6, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.10, cover_weight: 0.45, open_ground_weight: 0.05, elevation_weight: 0.12 }
    }
  },

  wolverine: {
    common_name: "Wolverine", scientific_name: "Gulo gulo",
    home_range_km2: 400, migration_distance_km: 50,
    gait_patterns: ["lope","bound","walk"],
    track_size_cm: { front: [8,11], rear: [9,12] },
    diet: ["carrion","small mammals","berries","eggs"], water_needs_l_per_day: 1.5,
    terrain: ["alpine","boreal forest","tundra"],
    track_depth: "large five-toed; semi-plantigrade; claw marks prominent",
    notes: "Enormous range; solitary; powerful scavenger; tracks resemble small bear.",
    clustering: { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 38, source: "Movebank wolverine" },
    predator_prey: { predatorOf: ["caribou_calves","rodents","carrion"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.33, environmental_sensitivity: 0.68, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 42, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["snow_den","rock_crevice"], den_site_tags: ["elevated","remote"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.72, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark","musk_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.68, scent_weight: 0.72 },
      movement_pattern:      { loopback_radius_m: 55, zigzag_direction_threshold_deg: 38, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 50, trail_reuse_radius_m: 14, pattern_tags: ["linear_travel","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.12, cover_weight: 0.22, open_ground_weight: 0.20, elevation_weight: 0.18},
    },
  },

  raccoon: {
    common_name: "Raccoon", scientific_name: "Procyon lotor",
    home_range_km2: 5, migration_distance_km: 2,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [5,7], rear: [6,8] },
    diet: ["fish","fruits","insects","garbage","eggs"], water_needs_l_per_day: 1.5,
    terrain: ["forest","urban","wetland"],
    track_depth: "hand-like five-toed; hind resembles tiny human foot",
    notes: "Highly adaptable; nocturnal; often near water; dextrous forepaws.",
    clustering: { eps_m: 14.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 18, source: "Elbroch" },
    predator_prey: { predatorOf: ["fish","eggs","crayfish"], preyOf: ["coyote","bobcat","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 20, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","burrow"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 20, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 25, trail_reuse_radius_m: 8, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.35, cover_weight: 0.25, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },

  striped_skunk: {
    common_name: "Striped Skunk", scientific_name: "Mephitis mephitis",
    home_range_km2: 2, migration_distance_km: 1,
    gait_patterns: ["walk","waddle"],
    track_size_cm: { front: [3.5,5], rear: [4,6] },
    diet: ["insects","grubs","berries","eggs","small mammals"], water_needs_l_per_day: 0.5,
    terrain: ["grassland","forest_edge","urban"],
    track_depth: "five toes with prominent claws on front; waddling gait pattern",
    notes: "Nocturnal; slow-moving; spray defence; often near human settlements.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 12, source: "Elbroch" },
    predator_prey: { predatorOf: ["insects","grubs","eggs"], preyOf: ["great_horned_owl","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.25, forage_weight: 0.75, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","ground_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 6, return_radius_m: 18, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["spray_mark","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 20, trail_reuse_radius_m: 6, pattern_tags: ["zigzag","meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.30, open_ground_weight: 0.25, elevation_weight: 0.05 }
    }
  },

  virginia_opossum: {
    common_name: "Virginia Opossum", scientific_name: "Didelphis virginiana",
    home_range_km2: 0.8, migration_distance_km: 0.5,
    gait_patterns: ["walk","slow_amble"],
    track_size_cm: { front: [4,6], rear: [5,7] },
    diet: ["carrion","fruits","insects","eggs"], water_needs_l_per_day: 0.5,
    terrain: ["forest","urban","wetland"],
    track_depth: "star-shaped five toes; opposable rear hallux leaves thumb-like mark",
    notes: "Only marsupial in North America; nocturnal; plays dead when threatened.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 12, source: "Elbroch" },
    predator_prey: { predatorOf: ["carrion","insects","eggs"], preyOf: ["coyote","bobcat","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.25, forage_weight: 0.75, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","burrow","ground_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 6, return_radius_m: 18, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.38, water_approach_radius_m: 20, trail_reuse_radius_m: 6, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.20, cover_weight: 0.35, open_ground_weight: 0.15, elevation_weight: 0.05 }
    }
  },

  porcupine: {
    common_name: "North American Porcupine", scientific_name: "Erethizon dorsatum",
    home_range_km2: 0.6, migration_distance_km: 0.5,
    gait_patterns: ["walk","waddle"],
    track_size_cm: { front: [4,6], rear: [5,7] },
    diet: ["bark","twigs","leaves","salt"], water_needs_l_per_day: 0.5,
    terrain: ["conifer forest","mixed forest","rocky"],
    track_depth: "four front toes; five rear; pebbly texture from quills; pigeon-toed",
    notes: "Slow-moving; nocturnal; quill defence; gnaws antlers and bones for minerals.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 12, source: "Elbroch" },
    predator_prey: { predatorOf: [], preyOf: ["fisher","mountain_lion","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.20, forage_weight: 0.80, direction_change_threshold_deg: 70, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["rock_crevice","tree_hollow"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 6, return_radius_m: 18, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 65, escape_line_direction_variance_threshold: 0.40, water_approach_radius_m: 20, trail_reuse_radius_m: 6, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.45, open_ground_weight: 0.05, elevation_weight: 0.15 }
    }
  },

  muskrat: {
    common_name: "Muskrat", scientific_name: "Ondatra zibethicus",
    home_range_km2: 0.2, migration_distance_km: 0.3,
    gait_patterns: ["walk","swim","bound"],
    track_size_cm: { front: [2.5,3.5], rear: [4,5.5] },
    diet: ["aquatic plants","roots","fish","crayfish"], water_needs_l_per_day: 0.2,
    terrain: ["marshes","ponds","streams","wetlands"],
    track_depth: "hind feet partially webbed; tail drag mark common",
    notes: "Semi-aquatic; builds lodges; tracks almost always near water.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 10, source: "Elbroch aquatic" },
    predator_prey: { predatorOf: ["aquatic_plants","crayfish"], preyOf: ["mink","otter","hawk","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.42, environmental_sensitivity: 0.88, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["lodge","burrow"], den_site_tags: ["near_water"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 4, return_radius_m: 12, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.72, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["musk_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 6, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 15, trail_reuse_radius_m: 5, pattern_tags: ["shoreline_loopback","water_edge_reentry"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.65, cover_weight: 0.10, open_ground_weight: 0.05, elevation_weight: 0.00 }
    }
  },

  gray_squirrel: {
    common_name: "Eastern Gray Squirrel", scientific_name: "Sciurus carolinensis",
    home_range_km2: 0.08, migration_distance_km: 0.2,
    gait_patterns: ["bound","hop"],
    track_size_cm: { front: [2.5,3.5], rear: [4,5.5] },
    diet: ["nuts","seeds","fungi","buds"], water_needs_l_per_day: 0.15,
    terrain: ["deciduous forest","urban parks","suburban"],
    track_depth: "four front toes; five rear; bounding pattern with rear ahead of front",
    notes: "Diurnal; caches food; common in suburban areas; territorial males.",
    clustering: { eps_m: 7.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 9, source: "Elbroch" },
    predator_prey: { predatorOf: ["nuts","seeds","fungi"], preyOf: ["hawk","fox","coyote","bobcat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.42, environmental_sensitivity: 0.65, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 10, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","leaf_nest"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 4, return_radius_m: 12, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.65 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 15, trail_reuse_radius_m: 4, pattern_tags: ["zigzag_escape","patch_forage"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.05, cover_weight: 0.50, open_ground_weight: 0.10, elevation_weight: 0.10 }
    }
  },

  red_squirrel: {
    common_name: "American Red Squirrel", scientific_name: "Tamiasciurus hudsonicus",
    home_range_km2: 0.04, migration_distance_km: 0.1,
    gait_patterns: ["bound","hop"],
    track_size_cm: { front: [2,3], rear: [3,4.5] },
    diet: ["conifer seeds","fungi","berries","insects"], water_needs_l_per_day: 0.1,
    terrain: ["boreal forest","conifer forest","mixed forest"],
    track_depth: "tiny bounding pattern; four front toes; five rear; middens visible",
    notes: "Territorial; loud alarm calls; builds middens; diurnal.",
    clustering: { eps_m: 6.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 7, source: "Elbroch" },
    predator_prey: { predatorOf: ["conifer_seeds","fungi"], preyOf: ["marten","hawk","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.20, separate_band_threshold: 0.45, environmental_sensitivity: 0.62, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 8, stride_variance_threshold: 0.48, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","leaf_nest"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 3, return_radius_m: 10, bedding_spread_threshold_m: 3, freshness_cluster_threshold: 0.70, denning_weight: 0.65 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","midden_site"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 10, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 12, trail_reuse_radius_m: 4, pattern_tags: ["patch_forage","zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.05, cover_weight: 0.55, open_ground_weight: 0.05, elevation_weight: 0.10 }
    }
  },

  american_badger: {
    common_name: "American Badger", scientific_name: "Taxidea taxus",
    home_range_km2: 8, migration_distance_km: 2,
    gait_patterns: ["walk","waddle","dig"],
    track_size_cm: { front: [5,7], rear: [5,7] },
    diet: ["ground_squirrels","prairie_dogs","rodents","insects"], water_needs_l_per_day: 0.6,
    terrain: ["grassland","prairie","desert","open_country"],
    track_depth: "five toes with very long front claws; pigeon-toed walk; wide body impression",
    notes: "Powerful digger; crepuscular; often hunts cooperatively with coyote.",
    clustering: { eps_m: 14.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 18, source: "Elbroch" },
    predator_prey: { predatorOf: ["ground_squirrels","rodents","prairie_dogs"], preyOf: ["coyote","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","excavated"], den_site_tags: ["open_ground","dry"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 8, return_radius_m: 24, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.82 },
      scent_marking_behavior:{ scent_marking_tags: ["musk_mark","latrine","burrow_area_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 14, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.62 },
      movement_pattern:      { loopback_radius_m: 20, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.32, water_approach_radius_m: 30, trail_reuse_radius_m: 8, pattern_tags: ["meandering_search","zigzag"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.08, cover_weight: 0.12, open_ground_weight: 0.45, elevation_weight: 0.07 }
    }
  },

  groundhog: {
    common_name: "Groundhog", scientific_name: "Marmota monax",
    home_range_km2: 0.3, migration_distance_km: 0.2,
    gait_patterns: ["walk","trot","waddle"],
    track_size_cm: { front: [3.5,5], rear: [4,6] },
    diet: ["grasses","clover","vegetables","bark"], water_needs_l_per_day: 0.3,
    terrain: ["meadow","forest_edge","farmland"],
    track_depth: "four front toes with claws; five rear toes; waddling walk pattern",
    notes: "Diurnal; hibernates; burrow systems with multiple entrances; alarm whistle.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 12, source: "Elbroch" },
    predator_prey: { predatorOf: ["grasses","clover"], preyOf: ["coyote","fox","hawk","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","excavated"], den_site_tags: ["open_ground","forest_edge"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 6, return_radius_m: 20, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 20, trail_reuse_radius_m: 6, pattern_tags: ["meandering_search","loopback"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.20, open_ground_weight: 0.45, elevation_weight: 0.05 }
    }
  },

  beaver: {
    common_name: "North American Beaver", scientific_name: "Castor canadensis",
    home_range_km2: 0.5, migration_distance_km: 1,
    gait_patterns: ["walk","waddle","swim"],
    track_size_cm: { front: [6,8], rear: [12,16] },
    diet: ["bark","twigs","aquatic_plants","roots"], water_needs_l_per_day: 1,
    terrain: ["streams","ponds","lakes","wetlands"],
    track_depth: "large webbed rear feet; front feet smaller; tail drag often visible",
    notes: "Keystone species; builds dams and lodges; nocturnal; scent mounds near water.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 15, source: "Elbroch aquatic" },
    predator_prey: { predatorOf: ["bark","aquatic_plants"], preyOf: ["wolf","coyote","otter"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.85, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["lodge","burrow"], den_site_tags: ["near_water"], den_return_pattern_tags: ["repeated_entry_exit","lodge_centered_travel"], den_radius_m: 8, return_radius_m: 22, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.72, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["castor_mound","scent_mound","urine_mark"], loopback_pattern_tags: ["shoreline_loopback","bank_patrol_revisit"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.75 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 20, trail_reuse_radius_m: 8, pattern_tags: ["shoreline_loopback","water_edge_reentry"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.70, cover_weight: 0.08, open_ground_weight: 0.02, elevation_weight: 0.00 }
    }
  },

  domestic_dog: {
    common_name: "Domestic Dog", scientific_name: "Canis lupus familiaris",
    home_range_km2: 2, migration_distance_km: 1,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [4,10], rear: [3.5,9] },
    diet: ["omnivore","manufactured_food","carrion"], water_needs_l_per_day: 1,
    terrain: ["urban","suburban","rural"],
    track_depth: "variable by breed; rounder than coyote; claws always present; wider heel",
    notes: "Highly variable by breed; direct register less common than wild canids.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 22, source: "General domestic" },
    predator_prey: { predatorOf: ["small_mammals","birds"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["trail_reuse","zigzag"] },
      terrain_intelligence:  { terrain_weight: 0.20, water_edge_weight: 0.15, cover_weight: 0.20, open_ground_weight: 0.30, elevation_weight: 0.05 }
    }
  },

  domestic_cat: {
    common_name: "Domestic Cat", scientific_name: "Felis catus",
    home_range_km2: 0.5, migration_distance_km: 0.3,
    gait_patterns: ["walk","trot","stalk"],
    track_size_cm: { front: [2.5,4], rear: [2.5,4] },
    diet: ["birds","rodents","lizards","manufactured_food"], water_needs_l_per_day: 0.2,
    terrain: ["urban","suburban","rural"],
    track_depth: "small round; no claw marks; two leading toes asymmetric",
    notes: "Retractable claws; direct register; significant wildlife predation impact.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12, source: "General domestic" },
    predator_prey: { predatorOf: ["birds","rodents","lizards"], preyOf: ["coyote","eagle","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 48, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter","dense_cover"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 6, return_radius_m: 18, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.65 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_spray","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 45, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 20, trail_reuse_radius_m: 6, pattern_tags: ["stalk_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.20, water_edge_weight: 0.10, cover_weight: 0.35, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },

  horse: {
    common_name: "Horse", scientific_name: "Equus caballus",
    home_range_km2: 10, migration_distance_km: 5,
    gait_patterns: ["walk","trot","canter","gallop"],
    track_size_cm: { front: [12,18], rear: [11,17] },
    diet: ["grasses","hay","grains"], water_needs_l_per_day: 30,
    terrain: ["pasture","grassland","trail"],
    track_depth: "single round hoof; unshod shows frog and bars; shod shows nail holes",
    notes: "Unshod horses leave rounder tracks; gaits create distinctive stride patterns.",
    clustering: { eps_m: 45.0, stride_multiplier: 2.4, min_pts: 3, typical_group_radius_m: 55, source: "General domestic" },
    predator_prey: { predatorOf: [], preyOf: ["cougar","wolf"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.33, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter","open_ground"], den_site_tags: ["open"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.68, denning_weight: 0.55 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 38, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 50, trail_reuse_radius_m: 12, pattern_tags: ["linear_travel","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.22, water_edge_weight: 0.18, cover_weight: 0.12, open_ground_weight: 0.40, elevation_weight: 0.08 }
    }
  },

  cattle: {
    common_name: "Cattle", scientific_name: "Bos taurus",
    home_range_km2: 1, migration_distance_km: 0.5,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [10,14], rear: [10,14] },
    diet: ["grasses","hay","grain"], water_needs_l_per_day: 40,
    terrain: ["pasture","rangeland","farmland"],
    track_depth: "large rounded cloven; dewclaw marks in soft ground; wide toe spread",
    notes: "Large heavy tracks; often in groups; trail networks well worn.",
    clustering: { eps_m: 35.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 45, source: "General domestic" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","cougar"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.33, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 40, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter","open_ground"], den_site_tags: ["open"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 15, return_radius_m: 45, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.68, denning_weight: 0.55 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 30, zigzag_direction_threshold_deg: 45, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 40, trail_reuse_radius_m: 12, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.20, water_edge_weight: 0.20, cover_weight: 0.10, open_ground_weight: 0.45, elevation_weight: 0.05 }
    }
  },

  goat: {
    common_name: "Domestic Goat", scientific_name: "Capra hircus",
    home_range_km2: 0.5, migration_distance_km: 0.3,
    gait_patterns: ["walk","trot","climb"],
    track_size_cm: { front: [5,8], rear: [5,8] },
    diet: ["browse","shrubs","grasses","bark"], water_needs_l_per_day: 3,
    terrain: ["rocky","pasture","scrub"],
    track_depth: "pointed cloven hooves; narrower than sheep; confident on rocky terrain",
    notes: "Agile climbers; browser not grazer; will eat almost anything.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 22, source: "General domestic" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","cougar","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 22, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter","rock_shelter"], den_site_tags: ["rocky","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.68, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 30, trail_reuse_radius_m: 8, pattern_tags: ["climb_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.12, cover_weight: 0.18, open_ground_weight: 0.20, elevation_weight: 0.25 }
    }
  },

  sheep: {
    common_name: "Domestic Sheep", scientific_name: "Ovis aries",
    home_range_km2: 0.4, migration_distance_km: 0.3,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [5,8], rear: [5,8] },
    diet: ["grasses","forbs","hay"], water_needs_l_per_day: 4,
    terrain: ["pasture","grassland","hills"],
    track_depth: "blunter than goat; wider toe spread; dewclaws in mud",
    notes: "Flock animal; grazer; follows established trails; wool can obscure body outline.",
    clustering: { eps_m: 20.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 25, source: "General domestic" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","coyote","cougar"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 52, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.32, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter","open_ground"], den_site_tags: ["open"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.68, denning_weight: 0.55 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 30, trail_reuse_radius_m: 8, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.22, water_edge_weight: 0.15, cover_weight: 0.15, open_ground_weight: 0.40, elevation_weight: 0.08 }
    }
  },

  pig: {
    common_name: "Domestic Pig", scientific_name: "Sus scrofa domesticus",
    home_range_km2: 0.3, migration_distance_km: 0.2,
    gait_patterns: ["walk","trot","root"],
    track_size_cm: { front: [5,9], rear: [5,9] },
    diet: ["roots","grains","vegetables","insects","carrion"], water_needs_l_per_day: 6,
    terrain: ["farmland","forest_edge","wetland"],
    track_depth: "rounded cloven; dewclaws usually show; rooting disturbance nearby",
    notes: "Omnivore; rooting behaviour leaves distinctive ground disturbance.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 22, source: "General domestic" },
    predator_prey: { predatorOf: ["roots","insects","small_animals"], preyOf: ["wolf","cougar"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 22, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter","nest_scrape"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 22, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.68, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine","rubbing"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.32, water_approach_radius_m: 25, trail_reuse_radius_m: 8, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.22, water_edge_weight: 0.20, cover_weight: 0.25, open_ground_weight: 0.25, elevation_weight: 0.05 }
    }
  },

  donkey: {
    common_name: "Donkey", scientific_name: "Equus asinus",
    home_range_km2: 2, migration_distance_km: 1,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [8,12], rear: [8,12] },
    diet: ["grasses","shrubs","hay","bark"], water_needs_l_per_day: 15,
    terrain: ["arid","rocky","pasture"],
    track_depth: "narrower and more oval than horse; upright hoof wall; smaller than horse",
    notes: "Hardy and sure-footed; prefers arid terrain; distinctive bray.",
    clustering: { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 38, source: "General domestic" },
    predator_prey: { predatorOf: [], preyOf: ["cougar","wolf"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.34, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 48, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["human_shelter","open_ground"], den_site_tags: ["open","rocky"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 12, return_radius_m: 35, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.68, denning_weight: 0.55 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 30, zigzag_direction_threshold_deg: 45, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 40, trail_reuse_radius_m: 12, pattern_tags: ["linear_travel","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.22, water_edge_weight: 0.15, cover_weight: 0.12, open_ground_weight: 0.38, elevation_weight: 0.13 }
    }
  },

  roe_deer: {
    common_name: "Roe Deer", scientific_name: "Capreolus capreolus",
    home_range_km2: 0.5, migration_distance_km: 5,
    gait_patterns: ["walk","trot","bound"],
    track_size_cm: { front: [3.5,5], rear: [3.5,5] },
    diet: ["browse","forbs","grasses","berries"], water_needs_l_per_day: 1.5,
    terrain: ["forest","farmland","hedgerows"],
    track_depth: "small pointed cloven; very narrow; often in pairs on soft ground",
    notes: "Smallest European deer; solitary; territorial bucks; crepuscular.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 28, source: "European cervid" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 52, spread_tightness_threshold_m: 22, stride_variance_threshold: 0.32, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["depression_nest","cover_loafing"], den_site_tags: ["dense_cover","shade_bed"], den_return_pattern_tags: ["cover_reentry"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark","rubbing"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 14, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 46, escape_line_direction_variance_threshold: 0.24, water_approach_radius_m: 35, trail_reuse_radius_m: 8, pattern_tags: ["zigzag_escape","forage_spread_then_regroup"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.18, cover_weight: 0.35, open_ground_weight: 0.15, elevation_weight: 0.07 }
    }
  },

  wild_boar: {
    common_name: "Wild Boar", scientific_name: "Sus scrofa",
    home_range_km2: 15, migration_distance_km: 10,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [5,9], rear: [5,9] },
    diet: ["roots","bulbs","fungi","carrion","acorns","small_animals"], water_needs_l_per_day: 5,
    terrain: ["forest","farmland","scrub","wetland"],
    track_depth: "rounded cloven; dewclaws always show; rooting disturbance prominent",
    notes: "Destructive rooter; nocturnal; gregarious sounders; tusks in males.",
    clustering: { eps_m: 28.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 35, source: "European sounders" },
    predator_prey: { predatorOf: ["roots","small_animals","eggs"], preyOf: ["wolf","lynx"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 30, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["nest_scrape","cover_loafing"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 12, return_radius_m: 38, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","rubbing","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 7, revisit_radius_m: 22, route_reuse_threshold_m: 14, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 30, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 40, trail_reuse_radius_m: 10, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.22, cover_weight: 0.30, open_ground_weight: 0.18, elevation_weight: 0.05 }
    }
  },

  pine_marten: {
    common_name: "European Pine Marten", scientific_name: "Martes martes",
    home_range_km2: 6, migration_distance_km: 2,
    gait_patterns: ["bound","lope","walk"],
    track_size_cm: { front: [4,5.5], rear: [4.5,6] },
    diet: ["small_mammals","birds","berries","insects"], water_needs_l_per_day: 0.4,
    terrain: ["mature_forest","mixed_forest","woodland"],
    track_depth: "five toes; semi-plantigrade; bounding pairs; heavily furred in winter",
    notes: "Arboreal and terrestrial; crepuscular; partially recovers in managed forests.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15, source: "European mustelid" },
    predator_prey: { predatorOf: ["voles","squirrels","birds"], preyOf: ["eagle","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 52, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","rock_crevice"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 6, return_radius_m: 18, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.62 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 48, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 28, trail_reuse_radius_m: 6, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.10, cover_weight: 0.45, open_ground_weight: 0.05, elevation_weight: 0.12 }
    }
  },

  stoat: {
    common_name: "Stoat", scientific_name: "Mustela erminea",
    home_range_km2: 0.5, migration_distance_km: 0.5,
    gait_patterns: ["bound","lope"],
    track_size_cm: { front: [1.5,2.5], rear: [2,3] },
    diet: ["rabbits","voles","birds","eggs"], water_needs_l_per_day: 0.1,
    terrain: ["grassland","woodland","farmland","arctic"],
    track_depth: "tiny five-toed bounding pairs; often shows two-by-two pattern",
    notes: "White in winter (ermine); aggressive predator relative to body size.",
    clustering: { eps_m: 6.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 7, source: "Small mustelid" },
    predator_prey: { predatorOf: ["voles","rabbits","birds"], preyOf: ["fox","hawk","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.20, separate_band_threshold: 0.45, environmental_sensitivity: 0.65, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 10, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","rock_crevice"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 3, return_radius_m: 10, bedding_spread_threshold_m: 3, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["musk_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 10, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 15, trail_reuse_radius_m: 4, pattern_tags: ["zigzag_escape","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.40, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },

  weasel: {
    common_name: "Least Weasel", scientific_name: "Mustela nivalis",
    home_range_km2: 0.1, migration_distance_km: 0.2,
    gait_patterns: ["bound"],
    track_size_cm: { front: [1,1.8], rear: [1.2,2] },
    diet: ["voles","mice","shrews"], water_needs_l_per_day: 0.05,
    terrain: ["grassland","farmland","woodland"],
    track_depth: "tiny bounding pairs; smallest mustelid tracks; easily obscured",
    notes: "World's smallest carnivore; moves mostly under snow in winter.",
    clustering: { eps_m: 5.0, stride_multiplier: 1.2, min_pts: 3, typical_group_radius_m: 6, source: "Small mustelid" },
    predator_prey: { predatorOf: ["voles","mice"], preyOf: ["fox","hawk","owl","stoat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.22, separate_band_threshold: 0.48, environmental_sensitivity: 0.62, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 8, stride_variance_threshold: 0.48, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","grass_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 2, return_radius_m: 8, bedding_spread_threshold_m: 2, freshness_cluster_threshold: 0.70, denning_weight: 0.65 },
      scent_marking_behavior:{ scent_marking_tags: ["musk_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 2, revisit_radius_m: 6, route_reuse_threshold_m: 4, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 8, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.32, water_approach_radius_m: 12, trail_reuse_radius_m: 3, pattern_tags: ["zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.08, cover_weight: 0.45, open_ground_weight: 0.18, elevation_weight: 0.04 }
    }
  },

  european_polecat: {
    common_name: "European Polecat", scientific_name: "Mustela putorius",
    home_range_km2: 2, migration_distance_km: 1,
    gait_patterns: ["bound","lope","walk"],
    track_size_cm: { front: [2.5,4], rear: [3,4.5] },
    diet: ["rabbits","rodents","amphibians","birds"], water_needs_l_per_day: 0.2,
    terrain: ["woodland","farmland","wetland"],
    track_depth: "five toes; bounding pattern; wider than stoat",
    notes: "Ancestor of ferret; nocturnal; strong musky odour.",
    clustering: { eps_m: 9.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 11, source: "European mustelid" },
    predator_prey: { predatorOf: ["rabbits","rodents","frogs"], preyOf: ["fox","eagle","otter"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 14, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","rock_crevice"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["musk_mark","latrine","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 10, route_reuse_threshold_m: 7, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 22, trail_reuse_radius_m: 5, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.22, cover_weight: 0.38, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },

  european_beaver: {
    common_name: "European Beaver", scientific_name: "Castor fiber",
    home_range_km2: 0.6, migration_distance_km: 1,
    gait_patterns: ["walk","waddle","swim"],
    track_size_cm: { front: [6,8], rear: [12,16] },
    diet: ["bark","twigs","aquatic_plants","roots"], water_needs_l_per_day: 1,
    terrain: ["rivers","streams","wetlands"],
    track_depth: "webbed hind feet; front smaller; tail drag in mud",
    notes: "Keystone engineer; builds dams; nocturnal; scent mounds on banks.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 15, source: "European riparian" },
    predator_prey: { predatorOf: ["bark","aquatic_plants"], preyOf: ["wolf","otter","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.85, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["lodge","burrow"], den_site_tags: ["near_water"], den_return_pattern_tags: ["repeated_entry_exit","lodge_centered_travel"], den_radius_m: 8, return_radius_m: 22, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.72, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["castor_mound","scent_mound","urine_mark"], loopback_pattern_tags: ["shoreline_loopback","bank_patrol_revisit"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.75 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 20, trail_reuse_radius_m: 8, pattern_tags: ["shoreline_loopback","water_edge_reentry"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.70, cover_weight: 0.08, open_ground_weight: 0.02, elevation_weight: 0.00 }
    }
  },

  european_otter: {
    common_name: "European Otter", scientific_name: "Lutra lutra",
    home_range_km2: 20, migration_distance_km: 5,
    gait_patterns: ["bound","slide","swim"],
    track_size_cm: { front: [5,7], rear: [6,8] },
    diet: ["fish","amphibians","crayfish","water_birds"], water_needs_l_per_day: 0.5,
    terrain: ["rivers","lakes","coastal","wetlands"],
    track_depth: "five webbed toes; tail drag; spraint deposits on prominent rocks",
    notes: "Nocturnal and crepuscular; solitary; spraint sites used for communication.",
    clustering: { eps_m: 14.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18, source: "European riparian" },
    predator_prey: { predatorOf: ["fish","frogs","crayfish"], preyOf: ["eagle","mink"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.85, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.38, forage_weight: 0.62, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 20, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["holt","burrow"], den_site_tags: ["near_water","dense_cover"], den_return_pattern_tags: ["revisit_loop","repeated_entry_exit"], den_radius_m: 7, return_radius_m: 22, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["spraint_site","urine_mark","latrine"], loopback_pattern_tags: ["shoreline_loopback","river_bend_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.72 },
      movement_pattern:      { loopback_radius_m: 20, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 25, trail_reuse_radius_m: 8, pattern_tags: ["shoreline_loopback","slide_and_bound"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.62, cover_weight: 0.12, open_ground_weight: 0.02, elevation_weight: 0.00 }
    }
  },

  european_hare: {
    common_name: "European Hare", scientific_name: "Lepus europaeus",
    home_range_km2: 1.5, migration_distance_km: 2,
    gait_patterns: ["bound","gallop","hop"],
    track_size_cm: { front: [5,7], rear: [12,16] },
    diet: ["grasses","cereals","herbs","bark"], water_needs_l_per_day: 0.5,
    terrain: ["open_farmland","grassland","meadow"],
    track_depth: "large hind feet land ahead of front; bound marks widely spaced",
    notes: "Open-country specialist; nocturnal and crepuscular; boxing displays in spring.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 22, source: "European lagomorph" },
    predator_prey: { predatorOf: [], preyOf: ["fox","eagle","harrier","lynx"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.65, forage_weight: 0.35, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["form_nest"], den_site_tags: ["open_ground","grass_tall"], den_return_pattern_tags: ["low_movement"], den_radius_m: 5, return_radius_m: 18, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.68, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 30, trail_reuse_radius_m: 8, pattern_tags: ["zigzag_escape","linear_escape"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.10, cover_weight: 0.15, open_ground_weight: 0.45, elevation_weight: 0.02 }
    }
  },

  european_rabbit: {
    common_name: "European Rabbit", scientific_name: "Oryctolagus cuniculus",
    home_range_km2: 0.1, migration_distance_km: 0.2,
    gait_patterns: ["hop","bound"],
    track_size_cm: { front: [2.5,4], rear: [6,9] },
    diet: ["grasses","herbs","bark","roots"], water_needs_l_per_day: 0.2,
    terrain: ["grassland","farmland","scrub","dunes"],
    track_depth: "hind feet ahead of front; group warrens create network of tracks",
    notes: "Colonial; warren systems; crepuscular; significant agricultural pest in some areas.",
    clustering: { eps_m: 9.0, stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 12, source: "European lagomorph" },
    predator_prey: { predatorOf: [], preyOf: ["fox","stoat","polecat","buzzard","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.65, forage_weight: 0.35, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 14, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["warren","burrow"], den_site_tags: ["dense_cover","open_ground"], den_return_pattern_tags: ["repeated_entry_exit","burrow_network_revisit"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","urine_mark","chin_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 6, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.32, water_approach_radius_m: 18, trail_reuse_radius_m: 5, pattern_tags: ["zigzag_escape","loopback"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.08, cover_weight: 0.35, open_ground_weight: 0.32, elevation_weight: 0.05 }
    }
  },

  chamois: {
    common_name: "Chamois", scientific_name: "Rupicapra rupicapra",
    home_range_km2: 8, migration_distance_km: 15,
    gait_patterns: ["walk","trot","bound","climb"],
    track_size_cm: { front: [4,6], rear: [4,6] },
    diet: ["alpine_grasses","herbs","lichens","bark"], water_needs_l_per_day: 2,
    terrain: ["alpine","subalpine","rocky_slopes"],
    track_depth: "sharp-edged cloven with elastic pads; excellent grip on rock",
    notes: "Agile alpine specialist; herding in winter; seasonal altitudinal migration.",
    clustering: { eps_m: 16.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 20, source: "Alpine ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 56, spread_tightness_threshold_m: 22, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cliff_shelter","rock_crevice"], den_site_tags: ["rocky","elevated"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","horn_gland_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.52 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 32, trail_reuse_radius_m: 8, pattern_tags: ["climb_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.08, cover_weight: 0.15, open_ground_weight: 0.12, elevation_weight: 0.40 }
    }
  },

  alpine_ibex: {
    common_name: "Alpine Ibex", scientific_name: "Capra ibex",
    home_range_km2: 20, migration_distance_km: 20,
    gait_patterns: ["walk","climb","bound"],
    track_size_cm: { front: [7,10], rear: [7,10] },
    diet: ["alpine_grasses","herbs","shrubs"], water_needs_l_per_day: 3,
    terrain: ["high_alpine","rocky_cliffs","subalpine_meadow"],
    track_depth: "broad cloven with rough textured soles; deeply split tips",
    notes: "Extreme altitude specialist; males have massive curved horns; rutting in winter.",
    clustering: { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25, source: "Alpine ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.68, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cliff_shelter","rocky_ledge"], den_site_tags: ["rocky","elevated","alpine_cliff"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 12, return_radius_m: 35, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","horn_gland_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 28, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["climb_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.07, cover_weight: 0.10, open_ground_weight: 0.08, elevation_weight: 0.50 }
    }
  },

  mouflon: {
    common_name: "Mouflon", scientific_name: "Ovis aries musimon",
    home_range_km2: 5, migration_distance_km: 10,
    gait_patterns: ["walk","trot","bound"],
    track_size_cm: { front: [5,7], rear: [5,7] },
    diet: ["grasses","herbs","shrubs","bark"], water_needs_l_per_day: 2,
    terrain: ["rocky_hills","scrub_forest","mountain"],
    track_depth: "cloven with pointed tips; narrower than domestic sheep",
    notes: "Wild ancestor of domestic sheep; gregarious; males have curved horns.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 22, source: "Alpine ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.48, forage_weight: 0.52, direction_change_threshold_deg: 54, spread_tightness_threshold_m: 24, stride_variance_threshold: 0.34, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["rock_shelter","cover_loafing"], den_site_tags: ["rocky","elevated"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.68 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 32, trail_reuse_radius_m: 9, pattern_tags: ["climb_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.18, open_ground_weight: 0.18, elevation_weight: 0.29 }
    }
  },

  hedgehog: {
    common_name: "European Hedgehog", scientific_name: "Erinaceus europaeus",
    home_range_km2: 0.3, migration_distance_km: 0.3,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [2,3], rear: [2.5,3.5] },
    diet: ["insects","worms","slugs","berries","eggs"], water_needs_l_per_day: 0.15,
    terrain: ["gardens","hedgerows","woodland_edge","farmland"],
    track_depth: "five toes; claws show; wide stance; belly drag faint in soft ground",
    notes: "Nocturnal; hibernates; spiny defence; important garden insectivore.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 10, source: "European small mammal" },
    predator_prey: { predatorOf: ["insects","worms","slugs"], preyOf: ["badger","fox","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.20, separate_band_threshold: 0.44, environmental_sensitivity: 0.62, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.20, forage_weight: 0.80, direction_change_threshold_deg: 70, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["leaf_nest","ground_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 4, return_radius_m: 12, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 65, escape_line_direction_variance_threshold: 0.40, water_approach_radius_m: 15, trail_reuse_radius_m: 5, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.12, cover_weight: 0.38, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },

  grey_kangaroo: {
    common_name: "Eastern Grey Kangaroo", scientific_name: "Macropus giganteus",
    home_range_km2: 8, migration_distance_km: 15,
    gait_patterns: ["hop","bound","walk_slow"],
    track_size_cm: { front: [6,10], rear: [18,26] },
    diet: ["grasses","forbs","shrubs"], water_needs_l_per_day: 2,
    terrain: ["open_woodland","grassland","suburban"],
    track_depth: "large hind feet; smaller front; tail drag; mob grazing patterns",
    notes: "Mob groups; nocturnal and crepuscular grazing; tail used as fifth limb.",
    clustering: { eps_m: 45.0, stride_multiplier: 2.4, min_pts: 4, typical_group_radius_m: 60, source: "Aus macropod" },
    predator_prey: { predatorOf: [], preyOf: ["dingo","wedge_tailed_eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.78, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.65, forage_weight: 0.35, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 38, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["resting_scrape"], den_site_tags: ["shade","open_woodland"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 15, return_radius_m: 45, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 7, revisit_radius_m: 22, route_reuse_threshold_m: 14, freshness_cluster_threshold: 0.68, scent_weight: 0.48 },
      movement_pattern:      { loopback_radius_m: 55, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 55, trail_reuse_radius_m: 18, pattern_tags: ["hopping_linear","group_linear"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.12, cover_weight: 0.15, open_ground_weight: 0.40, elevation_weight: 0.05 }
    }
  },

  wallaby: {
    common_name: "Red-necked Wallaby", scientific_name: "Notamacropus rufogriseus",
    home_range_km2: 1, migration_distance_km: 3,
    gait_patterns: ["hop","bound"],
    track_size_cm: { front: [4,6], rear: [10,16] },
    diet: ["grasses","forbs","shrubs"], water_needs_l_per_day: 1,
    terrain: ["forest_edge","scrub","coastal_heath"],
    track_depth: "smaller than kangaroo; elongated hind feet; tail drag present",
    notes: "Crepuscular and nocturnal; solitary or small groups; common in eastern Aus.",
    clustering: { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35, source: "Aus macropod" },
    predator_prey: { predatorOf: [], preyOf: ["dingo","wedge_tailed_eagle","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.78, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.62, forage_weight: 0.38, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["resting_scrape","dense_cover"], den_site_tags: ["dense_cover","shade"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.62 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 35, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 40, trail_reuse_radius_m: 12, pattern_tags: ["hopping_linear","zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.12, cover_weight: 0.30, open_ground_weight: 0.28, elevation_weight: 0.04 }
    }
  },

  common_wombat: {
    common_name: "Common Wombat", scientific_name: "Vombatus ursinus",
    home_range_km2: 0.25, migration_distance_km: 0.3,
    gait_patterns: ["walk","waddle","trot"],
    track_size_cm: { front: [4,6], rear: [5,7] },
    diet: ["grasses","roots","bark"], water_needs_l_per_day: 0.5,
    terrain: ["forest","heathland","grassland"],
    track_depth: "five toes; flat-footed; scratched areas and cube-shaped scats nearby",
    notes: "Nocturnal; powerful burrower; cube scat diagnostic; backward-opening pouch.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 15, source: "Aus marsupial" },
    predator_prey: { predatorOf: [], preyOf: ["dingo","wedge_tailed_eagle","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.30, forage_weight: 0.70, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 16, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","warren"], den_site_tags: ["dense_cover","slope"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 8, return_radius_m: 22, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.72, denning_weight: 0.88 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","scat_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 62, escape_line_direction_variance_threshold: 0.38, water_approach_radius_m: 20, trail_reuse_radius_m: 7, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.35, open_ground_weight: 0.28, elevation_weight: 0.02 }
    }
  },

  common_brushtail_possum: {
    common_name: "Common Brushtail Possum", scientific_name: "Trichosurus vulpecula",
    home_range_km2: 0.15, migration_distance_km: 0.3,
    gait_patterns: ["walk","trot","climb"],
    track_size_cm: { front: [2.5,4], rear: [3.5,5] },
    diet: ["leaves","flowers","fruits","bark"], water_needs_l_per_day: 0.2,
    terrain: ["forest","urban","suburban"],
    track_depth: "five toes; opposable rear hallux; often arboreal but ground tracks near trees",
    notes: "Most common urban possum in Australia; nocturnal; distinctive hissing call.",
    clustering: { eps_m: 9.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 11, source: "Aus marsupial" },
    predator_prey: { predatorOf: ["leaves","fruits","eggs"], preyOf: ["dingo","fox","quoll","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 14, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","roof_cavity"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.78 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","chin_gland_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 10, route_reuse_threshold_m: 7, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.34, water_approach_radius_m: 18, trail_reuse_radius_m: 5, pattern_tags: ["loopback","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.08, cover_weight: 0.50, open_ground_weight: 0.10, elevation_weight: 0.07 }
    }
  },

  short_beaked_echidna: {
    common_name: "Short-beaked Echidna", scientific_name: "Tachyglossus aculeatus",
    home_range_km2: 0.3, migration_distance_km: 0.5,
    gait_patterns: ["walk","dig"],
    track_size_cm: { front: [3,5], rear: [3,5] },
    diet: ["ants","termites","earthworms"], water_needs_l_per_day: 0.1,
    terrain: ["forest","heathland","grassland","arid_scrub"],
    track_depth: "five robust claws on all feet; wide splayed stance; snout probe marks",
    notes: "Monotreme; spiny defence; rolls into ball; hibernates in cold areas.",
    clustering: { eps_m: 9.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 11, source: "Aus monotreme" },
    predator_prey: { predatorOf: ["ants","termites","worms"], preyOf: ["dingo","fox","goanna"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.20, forage_weight: 0.80, direction_change_threshold_deg: 68, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","log_hollow"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 4, return_radius_m: 12, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.35 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 68, escape_line_direction_variance_threshold: 0.42, water_approach_radius_m: 15, trail_reuse_radius_m: 5, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.08, cover_weight: 0.32, open_ground_weight: 0.30, elevation_weight: 0.05 }
    }
  },

  eastern_quoll: {
    common_name: "Eastern Quoll", scientific_name: "Dasyurus viverrinus",
    home_range_km2: 0.5, migration_distance_km: 0.5,
    gait_patterns: ["bound","trot"],
    track_size_cm: { front: [2,3.5], rear: [2.5,4] },
    diet: ["insects","small_mammals","carrion","berries"], water_needs_l_per_day: 0.2,
    terrain: ["grassland","forest_edge","heathland"],
    track_depth: "five toes; claw marks; bounding pattern similar to small cat",
    notes: "Nocturnal; spotted coat; now mainly in Tasmania; important mesopredator.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12, source: "Aus dasyurid" },
    predator_prey: { predatorOf: ["insects","small_mammals","berries"], preyOf: ["fox","cat","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.70, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["log_hollow","rock_crevice","grass_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 9, route_reuse_threshold_m: 6, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 18, trail_reuse_radius_m: 5, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.38, open_ground_weight: 0.22, elevation_weight: 0.05 }
    }
  },

  feral_pig: {
    common_name: "Feral Pig", scientific_name: "Sus scrofa",
    home_range_km2: 20, migration_distance_km: 8,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [5,9], rear: [5,9] },
    diet: ["roots","bulbs","carrion","small_animals","grain"], water_needs_l_per_day: 6,
    terrain: ["forest","wetland","farmland","scrub"],
    track_depth: "rounded cloven; dewclaws always present; rooting disturbance diagnostic",
    notes: "Major pest species in Aus; destructive rooter; nocturnal; sounders.",
    clustering: { eps_m: 28.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 35, source: "Aus feral" },
    predator_prey: { predatorOf: ["roots","small_animals","eggs"], preyOf: ["dingo"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 56, spread_tightness_threshold_m: 30, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["nest_scrape","cover_loafing"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 12, return_radius_m: 36, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.68 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","rubbing","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 7, revisit_radius_m: 22, route_reuse_threshold_m: 14, freshness_cluster_threshold: 0.68, scent_weight: 0.58 },
      movement_pattern:      { loopback_radius_m: 30, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 40, trail_reuse_radius_m: 10, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.25, cover_weight: 0.28, open_ground_weight: 0.18, elevation_weight: 0.04 }
    }
  },

  feral_goat: {
    common_name: "Feral Goat", scientific_name: "Capra hircus",
    home_range_km2: 3, migration_distance_km: 3,
    gait_patterns: ["walk","trot","climb"],
    track_size_cm: { front: [5,8], rear: [5,8] },
    diet: ["browse","shrubs","bark","grasses"], water_needs_l_per_day: 3,
    terrain: ["rocky","arid_scrub","rangelands"],
    track_depth: "pointed cloven; narrow; similar to wild goat; agile on rocky terrain",
    notes: "Major pest in arid Aus; browsing damages vegetation; herds follow water.",
    clustering: { eps_m: 20.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 25, source: "Aus feral" },
    predator_prey: { predatorOf: [], preyOf: ["dingo","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.42, forage_weight: 0.58, direction_change_threshold_deg: 54, spread_tightness_threshold_m: 24, stride_variance_threshold: 0.34, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["rock_shelter","open_ground"], den_site_tags: ["rocky","elevated"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.68, denning_weight: 0.58 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.44 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 35, trail_reuse_radius_m: 9, pattern_tags: ["climb_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.15, open_ground_weight: 0.22, elevation_weight: 0.23 }
    }
  },

  // BATCH 2 - Africa + South America (50 species)


  leopard: {
    common_name: "Leopard", scientific_name: "Panthera pardus",
    home_range_km2: 50, migration_distance_km: 15,
    gait_patterns: ["walk","stalk","gallop","climb"],
    track_size_cm: { front: [8,11], rear: [7,10] },
    diet: ["impala","baboon","warthog","small_mammals"], water_needs_l_per_day: 3,
    terrain: ["savanna","forest","rocky_hills","riverine"],
    track_depth: "round; no claws; asymmetric lead toe; smaller than lion",
    notes: "Most adaptable big cat; hoists kills into trees; nocturnal; solitary.",
    clustering: { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35, source: "African spoor" },
    predator_prey: { predatorOf: ["impala","baboon","warthog"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.30, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.68, forage_weight: 0.32, direction_change_threshold_deg: 42, spread_tightness_threshold_m: 36, stride_variance_threshold: 0.26, freshness_cluster_threshold: 0.70 },
      denning_behavior:      { den_types: ["rock_crevice","thicket","cave"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 18, return_radius_m: 55, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.75, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_spray","scrape_mark","rubbing"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 8, revisit_radius_m: 28, route_reuse_threshold_m: 18, freshness_cluster_threshold: 0.70, scent_weight: 0.72 },
      movement_pattern:      { loopback_radius_m: 38, zigzag_direction_threshold_deg: 36, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 48, trail_reuse_radius_m: 12, pattern_tags: ["stalk_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.20, cover_weight: 0.35, open_ground_weight: 0.08, elevation_weight: 0.09 }
    }
  },

  cheetah: {
    common_name: "Cheetah", scientific_name: "Acinonyx jubatus",
    home_range_km2: 250, migration_distance_km: 40,
    gait_patterns: ["walk","stalk","sprint","gallop"],
    track_size_cm: { front: [7,9], rear: [6,8] },
    diet: ["gazelle","impala","hare","small_antelope"], water_needs_l_per_day: 4,
    terrain: ["open_savanna","grassland","semi_arid"],
    track_depth: "semi-retractable claws often visible; elongated oval; dog-like",
    notes: "Fastest land animal; diurnal hunter; non-retractable claws for traction.",
    clustering: { eps_m: 35.0, stride_multiplier: 2.2, min_pts: 3, typical_group_radius_m: 45, source: "African spoor" },
    predator_prey: { predatorOf: ["gazelle","impala","hare"], preyOf: ["lion","leopard"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.30, environmental_sensitivity: 0.82, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.72, forage_weight: 0.28, direction_change_threshold_deg: 35, spread_tightness_threshold_m: 42, stride_variance_threshold: 0.22, freshness_cluster_threshold: 0.70 },
      denning_behavior:      { den_types: ["thicket","minimal_cover"], den_site_tags: ["dense_cover","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.72, denning_weight: 0.65 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_spray","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 10, revisit_radius_m: 35, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.70, scent_weight: 0.68 },
      movement_pattern:      { loopback_radius_m: 55, zigzag_direction_threshold_deg: 30, escape_line_direction_variance_threshold: 0.15, water_approach_radius_m: 65, trail_reuse_radius_m: 18, pattern_tags: ["rapid_open_country_escape","long_run_escape"] },
      terrain_intelligence:  { terrain_weight: 0.30, water_edge_weight: 0.15, cover_weight: 0.12, open_ground_weight: 0.38, elevation_weight: 0.05 }
    }
  },

  spotted_hyena: {
    common_name: "Spotted Hyena", scientific_name: "Crocuta crocuta",
    home_range_km2: 200, migration_distance_km: 30,
    gait_patterns: ["walk","trot","gallop","lope"],
    track_size_cm: { front: [10,14], rear: [9,13] },
    diet: ["wildebeest","zebra","carrion","impala"], water_needs_l_per_day: 5,
    terrain: ["savanna","grassland","woodland","semi_arid"],
    track_depth: "four toes with large blunt claws; asymmetric; front larger than rear",
    notes: "Highly social clan; nocturnal; powerful jaws; actually skilled hunter not just scavenger.",
    clustering: { eps_m: 40.0, stride_multiplier: 2.2, min_pts: 4, typical_group_radius_m: 55, source: "African spoor" },
    predator_prey: { predatorOf: ["wildebeest","zebra","impala"], preyOf: ["lion"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.13, separate_band_threshold: 0.31, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.62, forage_weight: 0.38, direction_change_threshold_deg: 42, spread_tightness_threshold_m: 42, stride_variance_threshold: 0.26, freshness_cluster_threshold: 0.68 },
      denning_behavior:      { den_types: ["den","burrow","communal_den"], den_site_tags: ["open_ground","shade"], den_return_pattern_tags: ["revisit_loop","den_centered_movement"], den_radius_m: 25, return_radius_m: 70, bedding_spread_threshold_m: 18, freshness_cluster_threshold: 0.72, denning_weight: 0.78 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","paste_mark","urine_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 22, freshness_cluster_threshold: 0.68, scent_weight: 0.75 },
      movement_pattern:      { loopback_radius_m: 55, zigzag_direction_threshold_deg: 38, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 60, trail_reuse_radius_m: 16, pattern_tags: ["pack_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.20, cover_weight: 0.18, open_ground_weight: 0.30, elevation_weight: 0.04 }
    }
  },

  african_elephant: {
    common_name: "African Elephant", scientific_name: "Loxodonta africana",
    home_range_km2: 1000, migration_distance_km: 100,
    gait_patterns: ["walk","amble"],
    track_size_cm: { front: [40,60], rear: [38,55] },
    diet: ["grasses","bark","leaves","roots","fruit"], water_needs_l_per_day: 150,
    terrain: ["savanna","forest","wetland","bushveld"],
    track_depth: "massive circular; toenail indentations; cracked skin texture in substrate",
    notes: "Largest land animal; matriarchal herds; long memory; ecosystem engineer.",
    clustering: { eps_m: 80.0, stride_multiplier: 2.8, min_pts: 4, typical_group_radius_m: 120, source: "African megafauna" },
    predator_prey: { predatorOf: [], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.28, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 35, spread_tightness_threshold_m: 80, stride_variance_threshold: 0.20, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["wallowing_site","shade_loafing"], den_site_tags: ["near_water","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 50, return_radius_m: 150, bedding_spread_threshold_m: 40, freshness_cluster_threshold: 0.65, denning_weight: 0.55 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","temporal_gland_mark","dung_pile"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 25, revisit_radius_m: 80, route_reuse_threshold_m: 50, freshness_cluster_threshold: 0.65, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 120, zigzag_direction_threshold_deg: 30, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 150, trail_reuse_radius_m: 40, pattern_tags: ["migration_linear","group_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.35, cover_weight: 0.15, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },

  plains_zebra: {
    common_name: "Plains Zebra", scientific_name: "Equus quagga",
    home_range_km2: 100, migration_distance_km: 200,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [12,17], rear: [11,16] },
    diet: ["grasses","bark","leaves"], water_needs_l_per_day: 15,
    terrain: ["savanna","grassland","open_woodland"],
    track_depth: "single round hoof; slightly narrower than horse; herd worn trails",
    notes: "Herd migrator; often with wildebeest; alert sentinels; striped camouflage.",
    clustering: { eps_m: 50.0, stride_multiplier: 2.4, min_pts: 5, typical_group_radius_m: 75, source: "African megafauna" },
    predator_prey: { predatorOf: [], preyOf: ["lion","hyena","wild_dog","crocodile"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.13, separate_band_threshold: 0.31, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 38, spread_tightness_threshold_m: 55, stride_variance_threshold: 0.24, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["open_ground","shade_loafing"], den_site_tags: ["open","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 18, freshness_cluster_threshold: 0.65, denning_weight: 0.50 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 10, revisit_radius_m: 35, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.65, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 80, zigzag_direction_threshold_deg: 32, escape_line_direction_variance_threshold: 0.16, water_approach_radius_m: 90, trail_reuse_radius_m: 25, pattern_tags: ["group_departure","direct_run","migration_linear"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.28, cover_weight: 0.10, open_ground_weight: 0.30, elevation_weight: 0.04 }
    }
  },

  african_buffalo: {
    common_name: "African Buffalo", scientific_name: "Syncerus caffer",
    home_range_km2: 80, migration_distance_km: 50,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [14,18], rear: [13,17] },
    diet: ["grasses","herbs","sedges"], water_needs_l_per_day: 30,
    terrain: ["savanna","woodland","wetland","montane"],
    track_depth: "large rounded cloven; wide toe spread; dewclaws in mud; very heavy",
    notes: "Unpredictable and dangerous; large mixed herds; mobbing defence.",
    clustering: { eps_m: 55.0, stride_multiplier: 2.3, min_pts: 5, typical_group_radius_m: 80, source: "African megafauna" },
    predator_prey: { predatorOf: [], preyOf: ["lion","crocodile"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.13, separate_band_threshold: 0.31, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 42, spread_tightness_threshold_m: 55, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["wallowing_site","shade_loafing"], den_site_tags: ["near_water","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 25, return_radius_m: 70, bedding_spread_threshold_m: 22, freshness_cluster_threshold: 0.65, denning_weight: 0.55 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 25, freshness_cluster_threshold: 0.65, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 70, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 80, trail_reuse_radius_m: 22, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.32, cover_weight: 0.15, open_ground_weight: 0.25, elevation_weight: 0.03 }
    }
  },

  impala: {
    common_name: "Impala", scientific_name: "Aepyceros melampus",
    home_range_km2: 3, migration_distance_km: 10,
    gait_patterns: ["walk","trot","gallop","pronk"],
    track_size_cm: { front: [4,6], rear: [4,6] },
    diet: ["grasses","forbs","browse"], water_needs_l_per_day: 3,
    terrain: ["savanna","open_woodland","riverine"],
    track_depth: "slender pointed cloven; light in dry substrates; often in groups",
    notes: "Most common antelope; mixed grazer-browser; spectacular leaping escape.",
    clustering: { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 5, typical_group_radius_m: 40, source: "African ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["lion","leopard","cheetah","wild_dog","crocodile"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.82, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.62, forage_weight: 0.38, direction_change_threshold_deg: 42, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.26, freshness_cluster_threshold: 0.68 },
      denning_behavior:      { den_types: ["open_ground","shade_loafing"], den_site_tags: ["open","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 12, return_radius_m: 38, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.68, denning_weight: 0.52 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","dung_pile","preorbital_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 20, route_reuse_threshold_m: 14, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 35, zigzag_direction_threshold_deg: 38, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 42, trail_reuse_radius_m: 12, pattern_tags: ["group_departure","zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.25, cover_weight: 0.18, open_ground_weight: 0.25, elevation_weight: 0.04 }
    }
  },

  greater_kudu: {
    common_name: "Greater Kudu", scientific_name: "Tragelaphus strepsiceros",
    home_range_km2: 20, migration_distance_km: 15,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [8,12], rear: [7,11] },
    diet: ["browse","forbs","fruit","seeds"], water_needs_l_per_day: 4,
    terrain: ["savanna_woodland","rocky_hills","riverine_bush"],
    track_depth: "large pointed cloven; spread in soft ground; male tracks larger",
    notes: "Spectacular spiral horns on males; secretive browser; crepuscular.",
    clustering: { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45, source: "African ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["lion","leopard","wild_dog"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.78, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.52, forage_weight: 0.48, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 38, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.66 },
      denning_behavior:      { den_types: ["thicket","cover_loafing"], den_site_tags: ["dense_cover","rocky"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 18, return_radius_m: 55, bedding_spread_threshold_m: 14, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","preorbital_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 16, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 42, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 50, trail_reuse_radius_m: 14, pattern_tags: ["zigzag_escape","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.22, cover_weight: 0.30, open_ground_weight: 0.12, elevation_weight: 0.10 }
    }
  },

  blue_wildebeest: {
    common_name: "Blue Wildebeest", scientific_name: "Connochaetes taurinus",
    home_range_km2: 500, migration_distance_km: 1000,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [9,13], rear: [8,12] },
    diet: ["grasses"], water_needs_l_per_day: 10,
    terrain: ["open_savanna","grassland","floodplain"],
    track_depth: "rounded cloven; dewclaw marks common; herd creates worn trails",
    notes: "Great migration animal; grazing herds millions strong; calving synchronized.",
    clustering: { eps_m: 55.0, stride_multiplier: 2.3, min_pts: 5, typical_group_radius_m: 90, source: "African megafauna" },
    predator_prey: { predatorOf: [], preyOf: ["lion","hyena","wild_dog","crocodile"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.13, separate_band_threshold: 0.31, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.58, forage_weight: 0.42, direction_change_threshold_deg: 38, spread_tightness_threshold_m: 60, stride_variance_threshold: 0.24, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["open_ground"], den_site_tags: ["open","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 20, freshness_cluster_threshold: 0.65, denning_weight: 0.48 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_mark","preorbital_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 10, revisit_radius_m: 30, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.65, scent_weight: 0.48 },
      movement_pattern:      { loopback_radius_m: 120, zigzag_direction_threshold_deg: 30, escape_line_direction_variance_threshold: 0.15, water_approach_radius_m: 120, trail_reuse_radius_m: 35, pattern_tags: ["migration_linear","group_departure"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.30, cover_weight: 0.08, open_ground_weight: 0.30, elevation_weight: 0.04 }
    }
  },

  springbok: {
    common_name: "Springbok", scientific_name: "Antidorcas marsupialis",
    home_range_km2: 10, migration_distance_km: 50,
    gait_patterns: ["walk","trot","gallop","pronk"],
    track_size_cm: { front: [4,6], rear: [3.5,5.5] },
    diet: ["grasses","forbs","browse"], water_needs_l_per_day: 1.5,
    terrain: ["semi_arid","grassland","karoo"],
    track_depth: "slender pointed cloven; light; often in dense herd patterns",
    notes: "Pronking leaps to confuse predators; partly drought-independent; national animal of SA.",
    clustering: { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 5, typical_group_radius_m: 45, source: "African ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["cheetah","leopard","lion","wild_dog"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.84, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.65, forage_weight: 0.35, direction_change_threshold_deg: 38, spread_tightness_threshold_m: 38, stride_variance_threshold: 0.22, freshness_cluster_threshold: 0.68 },
      denning_behavior:      { den_types: ["open_ground"], den_site_tags: ["open","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 12, return_radius_m: 38, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.65, denning_weight: 0.48 },
      scent_marking_behavior:{ scent_marking_tags: ["preorbital_mark","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.48 },
      movement_pattern:      { loopback_radius_m: 45, zigzag_direction_threshold_deg: 36, escape_line_direction_variance_threshold: 0.16, water_approach_radius_m: 50, trail_reuse_radius_m: 14, pattern_tags: ["group_departure","direct_run"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.12, cover_weight: 0.08, open_ground_weight: 0.45, elevation_weight: 0.07 }
    }
  },

  warthog: {
    common_name: "Warthog", scientific_name: "Phacochoerus africanus",
    home_range_km2: 1.5, migration_distance_km: 5,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [5,8], rear: [5,8] },
    diet: ["grasses","roots","bulbs","bark"], water_needs_l_per_day: 5,
    terrain: ["savanna","open_woodland","grassland"],
    track_depth: "rounded cloven; dewclaws show; rooting disturbance; tusks graze soil",
    notes: "Kneels to root; backs into burrows; upright tail when running; farrowing sows.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 28, source: "African suidae" },
    predator_prey: { predatorOf: ["roots","bulbs","grasses"], preyOf: ["lion","leopard","cheetah","wild_dog","crocodile"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.78, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","aardvark_hole"], den_site_tags: ["open_ground","shade"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","tusk_mark","dung_pile"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.52 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 45, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["linear_escape","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.22, cover_weight: 0.14, open_ground_weight: 0.35, elevation_weight: 0.03 }
    }
  },

  baboon: {
    common_name: "Olive Baboon", scientific_name: "Papio anubis",
    home_range_km2: 15, migration_distance_km: 10,
    gait_patterns: ["walk","trot","gallop","climb"],
    track_size_cm: { front: [6,9], rear: [8,11] },
    diet: ["fruits","seeds","insects","small_mammals","roots"], water_needs_l_per_day: 3,
    terrain: ["savanna","woodland","rocky_hills","farmland"],
    track_depth: "five fingers/toes; palm pad; finger-like impressions; very human-like",
    notes: "Highly social troops; opportunistic omnivore; problem animal near human areas.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 5, typical_group_radius_m: 30, source: "African primate" },
    predator_prey: { predatorOf: ["insects","small_mammals","eggs"], preyOf: ["leopard","lion","crocodile"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.48, forage_weight: 0.52, direction_change_threshold_deg: 52, spread_tightness_threshold_m: 30, stride_variance_threshold: 0.32, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cliff_shelter","tree_roost"], den_site_tags: ["rocky","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 18, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","dung_pile","chest_gland"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.58 },
      movement_pattern:      { loopback_radius_m: 35, zigzag_direction_threshold_deg: 48, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 42, trail_reuse_radius_m: 12, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.22, cover_weight: 0.22, open_ground_weight: 0.18, elevation_weight: 0.12 }
    }
  },

  meerkat: {
    common_name: "Meerkat", scientific_name: "Suricata suricatta",
    home_range_km2: 5, migration_distance_km: 2,
    gait_patterns: ["walk","trot","bound"],
    track_size_cm: { front: [2,3], rear: [2.5,3.5] },
    diet: ["insects","scorpions","lizards","snakes","bulbs"], water_needs_l_per_day: 0.1,
    terrain: ["semi_arid","kalahari","scrubland"],
    track_depth: "four toes with long front claws; narrow; digging marks prominent",
    notes: "Highly social mobs; sentinel system; immune to some venom; diurnal.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 12, source: "African small mammal" },
    predator_prey: { predatorOf: ["insects","scorpions","lizards"], preyOf: ["eagle","hawk","snake","jackal"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.82, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 14, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","warren"], den_site_tags: ["open_ground","dry"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.72, denning_weight: 0.88 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","cheek_gland","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 6, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 18, trail_reuse_radius_m: 5, pattern_tags: ["meandering_search","loopback"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.05, cover_weight: 0.10, open_ground_weight: 0.50, elevation_weight: 0.07 }
    }
  },

  genet: {
    common_name: "Common Genet", scientific_name: "Genetta genetta",
    home_range_km2: 2, migration_distance_km: 1,
    gait_patterns: ["walk","trot","bound","climb"],
    track_size_cm: { front: [2.5,4], rear: [2.5,4] },
    diet: ["rodents","birds","insects","fruits","reptiles"], water_needs_l_per_day: 0.3,
    terrain: ["savanna","woodland","rocky_hills","urban_fringe"],
    track_depth: "semi-retractable claws; cat-like; five toes; direct register",
    notes: "Nocturnal; arboreal and terrestrial; latrine sites diagnostic; spotted coat.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12, source: "African viverrid" },
    predator_prey: { predatorOf: ["rodents","birds","insects"], preyOf: ["leopard","eagle","python"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 16, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","rock_crevice"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","perineal_mark","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 16, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 22, trail_reuse_radius_m: 6, pattern_tags: ["stalk_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.14, cover_weight: 0.40, open_ground_weight: 0.12, elevation_weight: 0.08 }
    }
  },

  slender_mongoose: {
    common_name: "Slender Mongoose", scientific_name: "Galerella sanguinea",
    home_range_km2: 0.8, migration_distance_km: 0.5,
    gait_patterns: ["bound","trot"],
    track_size_cm: { front: [2,3], rear: [2.5,3.5] },
    diet: ["insects","reptiles","rodents","birds","eggs"], water_needs_l_per_day: 0.1,
    terrain: ["savanna","woodland","rocky_areas"],
    track_depth: "five toes; elongated; claw marks; bounding pairs in soil",
    notes: "Solitary and diurnal; upright tail with black tip diagnostic; fast and agile.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 10, source: "African small mammal" },
    predator_prey: { predatorOf: ["insects","lizards","rodents"], preyOf: ["hawk","eagle","snake"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.78, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.42, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","rock_crevice","log_hollow"], den_site_tags: ["dense_cover","rocky"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 4, return_radius_m: 12, bedding_spread_threshold_m: 3, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["anal_mark","latrine","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.58 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 16, trail_reuse_radius_m: 4, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.10, cover_weight: 0.30, open_ground_weight: 0.30, elevation_weight: 0.04 }
    }
  },

  puma: {
    common_name: "Puma", scientific_name: "Puma concolor",
    home_range_km2: 150, migration_distance_km: 20,
    gait_patterns: ["walk","stalk","pounce","gallop"],
    track_size_cm: { front: [7.5,10], rear: [6.5,9] },
    diet: ["deer","guanaco","rodents","livestock"], water_needs_l_per_day: 4,
    terrain: ["mountain","forest","desert","grassland"],
    track_depth: "rounded; three-lobed heel pad; no claw marks; retractable",
    notes: "Widest range of any wild land mammal; solitary; crepuscular; adaptable.",
    clustering: { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35, source: "SA spoor" },
    predator_prey: { predatorOf: ["deer","guanaco","rodents"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.30, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.70, forage_weight: 0.30, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.70 },
      denning_behavior:      { den_types: ["rock_shelter","cave","thicket"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 15, return_radius_m: 50, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.75, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_spray","scrape_mark","scat_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 8, revisit_radius_m: 30, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.70, scent_weight: 0.70 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 50, trail_reuse_radius_m: 12, pattern_tags: ["stalk_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.15, cover_weight: 0.35, open_ground_weight: 0.15, elevation_weight: 0.09 }
    }
  },

  ocelot: {
    common_name: "Ocelot", scientific_name: "Leopardus pardalis",
    home_range_km2: 8, migration_distance_km: 3,
    gait_patterns: ["walk","stalk","climb"],
    track_size_cm: { front: [4,6], rear: [3.5,5.5] },
    diet: ["rodents","birds","reptiles","small_mammals"], water_needs_l_per_day: 1,
    terrain: ["tropical_forest","scrub","mangrove"],
    track_depth: "round; no claws; smaller than puma; two leading toes",
    notes: "Nocturnal; solitary; spotted coat; primarily terrestrial despite climbing ability.",
    clustering: { eps_m: 16.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 20, source: "SA spoor" },
    predator_prey: { predatorOf: ["rodents","birds","reptiles"], preyOf: ["jaguar","puma","harpy_eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.82, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 46, spread_tightness_threshold_m: 22, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.68 },
      denning_behavior:      { den_types: ["thicket","log_hollow"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 7, freshness_cluster_threshold: 0.72, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_spray","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.70, scent_weight: 0.68 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 42, escape_line_direction_variance_threshold: 0.24, water_approach_radius_m: 30, trail_reuse_radius_m: 8, pattern_tags: ["stalk_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.20, cover_weight: 0.40, open_ground_weight: 0.08, elevation_weight: 0.06 }
    }
  },

  tapir: {
    common_name: "South American Tapir", scientific_name: "Tapirus terrestris",
    home_range_km2: 10, migration_distance_km: 5,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [14,20], rear: [13,18] },
    diet: ["fruits","leaves","aquatic_plants","bark"], water_needs_l_per_day: 8,
    terrain: ["tropical_forest","wetland","gallery_forest"],
    track_depth: "three-toed rear; four-toed front; large and heavy; water-loving",
    notes: "Three rear toes; four front toes; strong swimmer; nocturnal; shy.",
    clustering: { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 3, typical_group_radius_m: 42, source: "SA large mammal" },
    predator_prey: { predatorOf: ["fruits","leaves","aquatic_plants"], preyOf: ["jaguar","puma","caiman"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.86, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 48, spread_tightness_threshold_m: 40, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["dense_thicket","near_water"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 18, return_radius_m: 55, bedding_spread_threshold_m: 14, freshness_cluster_threshold: 0.70, denning_weight: 0.68 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","dung_pile","latrine"], loopback_pattern_tags: ["shoreline_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 44, escape_line_direction_variance_threshold: 0.24, water_approach_radius_m: 45, trail_reuse_radius_m: 14, pattern_tags: ["linear_travel","water_edge_reentry"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.42, cover_weight: 0.25, open_ground_weight: 0.05, elevation_weight: 0.02 }
    }
  },

  capybara: {
    common_name: "Capybara", scientific_name: "Hydrochoerus hydrochaeris",
    home_range_km2: 0.5, migration_distance_km: 1,
    gait_patterns: ["walk","trot","swim"],
    track_size_cm: { front: [8,12], rear: [9,13] },
    diet: ["grasses","aquatic_plants","bark","reeds"], water_needs_l_per_day: 5,
    terrain: ["riverbank","wetland","flooded_grassland"],
    track_depth: "four toes; slightly webbed; large and heavy; trails to water clear",
    notes: "World's largest rodent; semi-aquatic; social groups; near water always.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 28, source: "SA large rodent" },
    predator_prey: { predatorOf: ["grasses","aquatic_plants"], preyOf: ["jaguar","puma","caiman","anaconda"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.34, environmental_sensitivity: 0.90, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.42, forage_weight: 0.58, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 30, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["bank_shelter","dense_cover"], den_site_tags: ["near_water"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.62 },
      scent_marking_behavior:{ scent_marking_tags: ["morillo_gland","urine_mark","dung_pile"], loopback_pattern_tags: ["shoreline_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.28, water_approach_radius_m: 25, trail_reuse_radius_m: 8, pattern_tags: ["shoreline_loopback","water_edge_reentry"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.68, cover_weight: 0.10, open_ground_weight: 0.05, elevation_weight: 0.02 }
    }
  },

  collared_peccary: {
    common_name: "Collared Peccary", scientific_name: "Dicotyles tajacu",
    home_range_km2: 1, migration_distance_km: 1,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [3.5,5], rear: [3,4.5] },
    diet: ["roots","tubers","fruits","cactus","small_animals"], water_needs_l_per_day: 2,
    terrain: ["desert","scrub","tropical_forest","grassland"],
    track_depth: "small rounded two-toed (pigs have four); narrow; dew hooves absent",
    notes: "Two toes not four - key distinguisher from pigs; herds; musky odour.",
    clustering: { eps_m: 16.0, stride_multiplier: 1.7, min_pts: 4, typical_group_radius_m: 20, source: "SA suiform" },
    predator_prey: { predatorOf: ["roots","fruits","cactus"], preyOf: ["jaguar","puma","coyote","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.78, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.48, forage_weight: 0.52, direction_change_threshold_deg: 54, spread_tightness_threshold_m: 22, stride_variance_threshold: 0.36, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","thicket","cover_loafing"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 24, bedding_spread_threshold_m: 7, freshness_cluster_threshold: 0.70, denning_weight: 0.65 },
      scent_marking_behavior:{ scent_marking_tags: ["dorsal_gland_mark","urine_mark","latrine"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.26, water_approach_radius_m: 30, trail_reuse_radius_m: 8, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.18, cover_weight: 0.28, open_ground_weight: 0.22, elevation_weight: 0.06 }
    }
  },

  giant_anteater: {
    common_name: "Giant Anteater", scientific_name: "Myrmecophaga tridactyla",
    home_range_km2: 9, migration_distance_km: 3,
    gait_patterns: ["walk","amble"],
    track_size_cm: { front: [9,14], rear: [6,9] },
    diet: ["ants","termites"], water_needs_l_per_day: 0.2,
    terrain: ["grassland","savanna","tropical_forest"],
    track_depth: "walks on knuckles (front); front claws huge and curved; very distinctive",
    notes: "Knuckle-walking; huge claws for digging; no teeth; long sticky tongue.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 28, source: "SA large mammal" },
    predator_prey: { predatorOf: ["ants","termites"], preyOf: ["jaguar","puma"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.78, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.30, forage_weight: 0.70, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["ground_scrape","dense_cover"], den_site_tags: ["dense_cover","open_ground"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 12, return_radius_m: 38, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.68, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["anal_gland_mark","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 28, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.14, cover_weight: 0.22, open_ground_weight: 0.35, elevation_weight: 0.03 }
    }
  },

  nine_banded_armadillo: {
    common_name: "Nine-banded Armadillo", scientific_name: "Dasypus novemcinctus",
    home_range_km2: 0.5, migration_distance_km: 0.5,
    gait_patterns: ["walk","trot","dig"],
    track_size_cm: { front: [4,6], rear: [5,7] },
    diet: ["insects","worms","grubs","small_vertebrates"], water_needs_l_per_day: 0.3,
    terrain: ["forest","grassland","scrub","suburban"],
    track_depth: "distinctive four front toes (curved); five rear toes; armour impression in mud",
    notes: "Only armadillo in North America; bony plates; poor eyesight; nocturnal.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 12, source: "SA armadillo" },
    predator_prey: { predatorOf: ["insects","worms","grubs"], preyOf: ["coyote","bobcat","hawk","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.30, forage_weight: 0.70, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.48, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","excavated"], den_site_tags: ["dense_cover","sandy_soil"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.82 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 9, route_reuse_threshold_m: 6, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 65, escape_line_direction_variance_threshold: 0.40, water_approach_radius_m: 18, trail_reuse_radius_m: 5, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.12, cover_weight: 0.32, open_ground_weight: 0.28, elevation_weight: 0.03 }
    }
  },

  howler_monkey: {
    common_name: "Mantled Howler Monkey", scientific_name: "Alouatta palliata",
    home_range_km2: 0.3, migration_distance_km: 0.3,
    gait_patterns: ["walk","climb","swing"],
    track_size_cm: { front: [4,6], rear: [5,7] },
    diet: ["leaves","fruits","flowers","seeds"], water_needs_l_per_day: 0.5,
    terrain: ["tropical_forest","gallery_forest","mangrove"],
    track_depth: "five-fingered hand-like; opposable thumb; prehensile tail drag rare",
    notes: "Loudest land animal; arboreal; found ground level rarely; troops.",
    clustering: { eps_m: 14.0, stride_multiplier: 1.6, min_pts: 4, typical_group_radius_m: 18, source: "SA primate" },
    predator_prey: { predatorOf: ["leaves","fruits","flowers"], preyOf: ["harpy_eagle","jaguar","boa"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_roost","canopy_loafing"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.65 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","chest_gland","dung_pile"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["boundary"], marking_radius_m: 5, revisit_radius_m: 14, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 22, trail_reuse_radius_m: 6, pattern_tags: ["loopback","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.50, open_ground_weight: 0.05, elevation_weight: 0.05 }
    }
  },

  capuchin_monkey: {
    common_name: "White-faced Capuchin", scientific_name: "Cebus imitator",
    home_range_km2: 1, migration_distance_km: 0.5,
    gait_patterns: ["walk","climb","bound"],
    track_size_cm: { front: [3,5], rear: [4,6] },
    diet: ["fruits","insects","small_vertebrates","nuts","seeds"], water_needs_l_per_day: 0.4,
    terrain: ["tropical_forest","mangrove","secondary_forest"],
    track_depth: "hand-like; five fingers with nails; opposable; semi-terrestrial",
    notes: "Highly intelligent; tool use; omnivorous; social troops; very adaptable.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 15, source: "SA primate" },
    predator_prey: { predatorOf: ["insects","fruits","small_animals"], preyOf: ["harpy_eagle","jaguar","boa"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.42, forage_weight: 0.58, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 16, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_roost","canopy_loafing"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.62 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_wash","chest_rub","dung_pile"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["boundary"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 16, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 20, trail_reuse_radius_m: 5, pattern_tags: ["patch_forage","loopback"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.16, cover_weight: 0.48, open_ground_weight: 0.06, elevation_weight: 0.05 }
    }
  },

  fisher: {
    common_name: "Fisher", scientific_name: "Pekania pennanti",
    home_range_km2: 10, migration_distance_km: 3,
    gait_patterns: ["lope","bound","walk"],
    track_size_cm: { front: [6,7.5], rear: [7,9] },
    diet: ["small_mammals","porcupine","birds","fruits"], water_needs_l_per_day: 0.4,
    terrain: ["mixed_forest","conifer_forest","boreal"],
    track_depth: "five toes; round; diagonal lope pattern; rear larger than front",
    notes: "One of few predators of porcupine; crepuscular; rare and recovering; solitary.",
    clustering: { eps_m: 16.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 20, source: "Elbroch mustelid" },
    predator_prey: { predatorOf: ["porcupine","squirrels","snowshoe_hare"], preyOf: ["coyote","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.70, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.58, forage_weight: 0.42, direction_change_threshold_deg: 48, spread_tightness_threshold_m: 22, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","rock_crevice"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 7, return_radius_m: 22, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 14, route_reuse_threshold_m: 9, freshness_cluster_threshold: 0.68, scent_weight: 0.62 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 46, escape_line_direction_variance_threshold: 0.27, water_approach_radius_m: 32, trail_reuse_radius_m: 7, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.10, cover_weight: 0.45, open_ground_weight: 0.05, elevation_weight: 0.12 }
    }
  },

  mountain_goat: {
    common_name: "Mountain Goat", scientific_name: "Oreamnos americanus",
    home_range_km2: 15, migration_distance_km: 10,
    gait_patterns: ["walk","bound","climb"],
    track_size_cm: { front: [6,8], rear: [6,8] },
    diet: ["grasses","shrubs","mosses"], water_needs_l_per_day: 3.0,
    terrain: ["mountains","cliffs","alpine meadows"],
    track_depth: "small cloven hooves with pointed ends and splayed rear",
    notes: "Alpine terrain specialist; crepuscular; sure-footed on steep gradients.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 22, source: "Alpine tight groups" },
    predator_prey: { predatorOf: [], preyOf: ["cougar","wolf","grizzly_bear"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 20, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["cliff_shelter","rock_crevice"], den_site_tags: ["rocky","elevated"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 35, trail_reuse_radius_m: 8, pattern_tags: ["climb_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.20, open_ground_weight: 0.10, elevation_weight: 0.35 }
    }
  },
  bighorn_sheep: {
    common_name: "Bighorn Sheep", scientific_name: "Ovis canadensis",
    home_range_km2: 20, migration_distance_km: 30,
    gait_patterns: ["walk","bound","trot"],
    track_size_cm: { front: [6,9], rear: [6,9] },
    diet: ["grasses","forbs","shrubs"], water_needs_l_per_day: 2.5,
    terrain: ["rocky hills","deserts","mountains"],
    track_depth: "cloven tracks with tight spacing and pointed tips",
    notes: "Rugged terrain specialist; herding; males fight with horn clashes.",
    clustering: { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25, source: "Rocky herd spacing" },
    predator_prey: { predatorOf: [], preyOf: ["cougar","wolf","grizzly_bear"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["rock_shelter"], den_site_tags: ["rocky","elevated"], den_return_pattern_tags: ["revisit_loafing"], den_radius_m: 12, return_radius_m: 35, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 20, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 30, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 40, trail_reuse_radius_m: 10, pattern_tags: ["climb_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.20, open_ground_weight: 0.10, elevation_weight: 0.35 }
    }
  },
  pronghorn: {
    common_name: "Pronghorn", scientific_name: "Antilocapra americana",
    home_range_km2: 50, migration_distance_km: 100,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [7,9], rear: [6,8] },
    diet: ["grasses","forbs","shrubs"], water_needs_l_per_day: 2.5,
    terrain: ["open plains","grasslands","semi-desert"],
    track_depth: "cloven hooves with rounded tips; fast stride marks",
    notes: "Fastest North American land animal; open-country specialist; diurnal.",
    clustering: { eps_m: 40.0, stride_multiplier: 2.2, min_pts: 4, typical_group_radius_m: 50, source: "Open plains herd" },
    predator_prey: { predatorOf: [], preyOf: ["coyote","cougar"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.70, forage_weight: 0.30, direction_change_threshold_deg: 35, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.20, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["minimal_cover"], den_site_tags: ["open"], den_return_pattern_tags: ["low_movement"], den_radius_m: 15, return_radius_m: 50, bedding_spread_threshold_m: 20, freshness_cluster_threshold: 0.65, denning_weight: 0.50 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 60, zigzag_direction_threshold_deg: 30, escape_line_direction_variance_threshold: 0.15, water_approach_radius_m: 60, trail_reuse_radius_m: 20, pattern_tags: ["linear_escape"] },
      terrain_intelligence:  { terrain_weight: 0.30, water_edge_weight: 0.10, cover_weight: 0.05, open_ground_weight: 0.50, elevation_weight: 0.05 }
    }
  },
  bobcat: {
    common_name: "Bobcat", scientific_name: "Lynx rufus",
    home_range_km2: 25, migration_distance_km: 8,
    gait_patterns: ["walk","trot","bound","stalk"],
    track_size_cm: { front: [5,6.5], rear: [4.5,6] },
    diet: ["rabbits","rodents","birds"], water_needs_l_per_day: 1.2,
    terrain: ["forest","scrub","desert"],
    track_depth: "round asymmetrical prints; no claw marks; lead toe visible",
    notes: "Crepuscular; very territorial; prefers thick cover; ambush hunter.",
    clustering: { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18, source: "Elbroch" },
    predator_prey: { predatorOf: ["rabbits","rodents"], preyOf: ["coyote","wolf"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.65, forage_weight: 0.35, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","rock_shelter"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 45, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["stalk_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.35, open_ground_weight: 0.15, elevation_weight: 0.10 }
    }
  },
  mountain_lion: {
    common_name: "Mountain Lion", scientific_name: "Puma concolor",
    home_range_km2: 150, migration_distance_km: 15,
    gait_patterns: ["walk","trot","pounce","stalk"],
    track_size_cm: { front: [7.5,10], rear: [6.5,9] },
    diet: ["deer","small_mammals","livestock"], water_needs_l_per_day: 4,
    terrain: ["mountain","forest","desert"],
    track_depth: "rounded with three-lobed heel pad; no claw marks",
    notes: "Solitary ambush predator; crepuscular; territorial; widest range of any wild cat.",
    clustering: { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35, source: "Elbroch" },
    predator_prey: { predatorOf: ["deer","elk"], preyOf: ["grizzly_bear"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.30, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.70, forage_weight: 0.30, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.25, freshness_cluster_threshold: 0.70 },
      denning_behavior:      { den_types: ["rock_shelter","cave"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 15, return_radius_m: 50, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.75, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 8, revisit_radius_m: 30, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.70, scent_weight: 0.70 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 50, trail_reuse_radius_m: 12, pattern_tags: ["stalk_linear"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.35, open_ground_weight: 0.15, elevation_weight: 0.10 }
    }
  },
  grizzly_bear: {
    common_name: "Grizzly Bear", scientific_name: "Ursus arctos horribilis",
    home_range_km2: 500, migration_distance_km: 40,
    gait_patterns: ["walk","amble","gallop"],
    track_size_cm: { front: [13,20], rear: [20,28] },
    diet: ["berries","fish","roots","small_mammals","carrion"], water_needs_l_per_day: 10,
    terrain: ["mountain","forest","tundra"],
    track_depth: "massive with visible claw marks; wide toe spread; front smaller than rear",
    notes: "Shoulder hump; solitary except mating/cubs; dominant omnivore; hibernates.",
    clustering: { eps_m: 38.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 48, source: "Movebank" },
    predator_prey: { predatorOf: ["moose","elk","deer"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.30, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 50, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","cave"], den_site_tags: ["dense_cover","slope"], den_return_pattern_tags: ["winter_den_return"], den_radius_m: 25, return_radius_m: 70, bedding_spread_threshold_m: 20, freshness_cluster_threshold: 0.75, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["rubbing","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.70, scent_weight: 0.70 },
      movement_pattern:      { loopback_radius_m: 50, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 60, trail_reuse_radius_m: 15, pattern_tags: ["linear_travel"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.20, cover_weight: 0.30, open_ground_weight: 0.15, elevation_weight: 0.10 }
    }
  },
  black_bear: {
    common_name: "Black Bear", scientific_name: "Ursus americanus",
    home_range_km2: 120, migration_distance_km: 20,
    gait_patterns: ["walk","amble","climb"],
    track_size_cm: { front: [10,18], rear: [15,25] },
    diet: ["berries","insects","roots","carrion"], water_needs_l_per_day: 6,
    terrain: ["forest","swamp","mountain"],
    track_depth: "rounded toes with slight claw impressions; rear resembles human foot",
    notes: "Shy; excellent climber; color ranges black to cinnamon; hibernates.",
    clustering: { eps_m: 32.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 40, source: "Movebank" },
    predator_prey: { predatorOf: ["deer_fawns","small_mammals"], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","cave"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["winter_den_return"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 15, freshness_cluster_threshold: 0.75, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["rubbing","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 10, revisit_radius_m: 30, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 40, zigzag_direction_threshold_deg: 40, escape_line_direction_variance_threshold: 0.25, water_approach_radius_m: 50, trail_reuse_radius_m: 12, pattern_tags: ["linear_travel"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.20, cover_weight: 0.30, open_ground_weight: 0.15, elevation_weight: 0.10 }
    }
  },
  river_otter: {
    common_name: "North American River Otter", scientific_name: "Lontra canadensis",
    home_range_km2: 15, migration_distance_km: 5,
    gait_patterns: ["bound","slide"],
    track_size_cm: { front: [6,8], rear: [7,9] },
    diet: ["fish","amphibians","crustaceans"], water_needs_l_per_day: 0.5,
    terrain: ["rivers","lakes","wetlands"],
    track_depth: "webbed toes; tracks near water with belly slides characteristic",
    notes: "Bounding gait with slide marks in snow; playful; crepuscular.",
    clustering: { eps_m: 14.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18, source: "Elbroch" },
    predator_prey: { predatorOf: ["fish","crustaceans"], preyOf: ["coyote","wolf"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.85, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 20, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","burrow"], den_site_tags: ["near_water"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","spraint_site"], loopback_pattern_tags: ["shoreline_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 20, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 25, trail_reuse_radius_m: 8, pattern_tags: ["slide_and_bound","shoreline_loopback"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.60, cover_weight: 0.10, open_ground_weight: 0.05, elevation_weight: 0.00 }
    }
  },
  mink: {
    common_name: "American Mink", scientific_name: "Neogale vison",
    home_range_km2: 1.5, migration_distance_km: 1,
    gait_patterns: ["bound","walk"],
    track_size_cm: { front: [3,4], rear: [4,5.5] },
    diet: ["fish","crustaceans","small_mammals"], water_needs_l_per_day: 0.3,
    terrain: ["streams","wetlands","marshes"],
    track_depth: "five toes with claws; asymmetrical; often near water",
    notes: "Semi-aquatic; nocturnal; resembles weasel family; tracks always near water.",
    clustering: { eps_m: 9.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 11, source: "Elbroch" },
    predator_prey: { predatorOf: ["small_mammals","fish"], preyOf: ["otter","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.85, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["den","burrow"], den_site_tags: ["near_water"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 6, return_radius_m: 20, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["latrine","musk_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.52 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 20, trail_reuse_radius_m: 6, pattern_tags: ["slide_and_bound"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.50, cover_weight: 0.15, open_ground_weight: 0.05, elevation_weight: 0.05 }
    }
  },
  wild_turkey: {
    common_name: "Wild Turkey", scientific_name: "Meleagris gallopavo",
    home_range_km2: 1, migration_distance_km: 0,
    gait_patterns: ["walk","run"],
    track_size_cm: { front: [9,12], rear: [2,4] },
    diet: ["seeds","insects","grasses"], water_needs_l_per_day: 0.5,
    terrain: ["fields","forests","brush"],
    track_depth: "three forward toes and small rear toe; long clawed digits",
    notes: "Wing drag marks visible in mating season; diurnal; flock foraging.",
    clustering: { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 4, typical_group_radius_m: 20, source: "Group strut patterns" },
    predator_prey: { predatorOf: [], preyOf: ["coyote","bobcat","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["ground_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["low_movement"], den_radius_m: 8, return_radius_m: 25, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["dusting"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 20, zigzag_direction_threshold_deg: 50, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 30, trail_reuse_radius_m: 8, pattern_tags: ["strut_group"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.15, cover_weight: 0.30, open_ground_weight: 0.20, elevation_weight: 0.10 }
    }
  },
  ruffed_grouse: {
    common_name: "Ruffed Grouse", scientific_name: "Bonasa umbellus",
    home_range_km2: 0.5, migration_distance_km: 0,
    gait_patterns: ["walk","short_hop"],
    track_size_cm: { front: [3,5], rear: [1,2] },
    diet: ["buds","berries","insects"], water_needs_l_per_day: 0.2,
    terrain: ["deciduous forest","brushy edges"],
    track_depth: "tiny clawed digits; shallow in leaf litter; wing imprints when flushed",
    notes: "Drumming display; well-camouflaged; diurnal forager.",
    clustering: { eps_m: 6.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8, source: "Small flush tracks" },
    predator_prey: { predatorOf: [], preyOf: ["coyote","fox","bobcat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.20, separate_band_threshold: 0.45, environmental_sensitivity: 0.60, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.30, forage_weight: 0.70, direction_change_threshold_deg: 70, spread_tightness_threshold_m: 10, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["ground_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["low_movement"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["dusting"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 10, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 20, trail_reuse_radius_m: 5, pattern_tags: ["flush_short"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.05, cover_weight: 0.50, open_ground_weight: 0.10, elevation_weight: 0.10 }
    }
  },
  spruce_grouse: {
    common_name: "Spruce Grouse", scientific_name: "Canachites canadensis",
    home_range_km2: 0.4, migration_distance_km: 0,
    gait_patterns: ["walk","hop"],
    track_size_cm: { front: [3,4], rear: [1,2] },
    diet: ["conifer needles","berries","insects"], water_needs_l_per_day: 0.2,
    terrain: ["boreal forest","spruce thickets"],
    track_depth: "shallow prints in snow or leaf litter; light claw marks",
    notes: "Camouflaged; flushes at close range; relies on crypsis over flight.",
    clustering: { eps_m: 5.5, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 7, source: "Conifer proxies" },
    predator_prey: { predatorOf: [], preyOf: ["lynx","coyote"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.20, separate_band_threshold: 0.45, environmental_sensitivity: 0.60, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.30, forage_weight: 0.70, direction_change_threshold_deg: 70, spread_tightness_threshold_m: 10, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["ground_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["low_movement"], den_radius_m: 5, return_radius_m: 15, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["dusting"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 10, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.35, water_approach_radius_m: 20, trail_reuse_radius_m: 5, pattern_tags: ["flush_short"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.05, cover_weight: 0.55, open_ground_weight: 0.05, elevation_weight: 0.10 }
    }
  },
  sharp_tailed_grouse: {
    common_name: "Sharp-tailed Grouse", scientific_name: "Tympanuchus phasianellus",
    home_range_km2: 1, migration_distance_km: 0,
    gait_patterns: ["walk","hop","flutter"],
    track_size_cm: { front: [3,5], rear: [1,2] },
    diet: ["buds","leaves","insects"], water_needs_l_per_day: 0.25,
    terrain: ["grasslands","brushy prairies"],
    track_depth: "distinct three-toed imprint; strut patterns during lekking",
    notes: "Lek display species; grassland specialist; diurnal.",
    clustering: { eps_m: 7.0, stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 10, source: "Lek patterns" },
    predator_prey: { predatorOf: [], preyOf: ["coyote","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["ground_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["low_movement"], den_radius_m: 6, return_radius_m: 20, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["dusting"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 25, trail_reuse_radius_m: 6, pattern_tags: ["lek_strut"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.40, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },
  chukar_partridge: {
    common_name: "Chukar Partridge", scientific_name: "Alectoris chukar",
    home_range_km2: 0.6, migration_distance_km: 0,
    gait_patterns: ["walk","run"],
    track_size_cm: { front: [4,6], rear: [1,2] },
    diet: ["seeds","grasses","insects"], water_needs_l_per_day: 0.3,
    terrain: ["rocky hillsides","semi-arid areas"],
    track_depth: "short straight prints with slight lateral splay; covey patterns",
    notes: "Covey species; rocky terrain specialist; runs rather than flies when alarmed.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 12, source: "Covey proxies" },
    predator_prey: { predatorOf: [], preyOf: ["coyote","bobcat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.65, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 15, stride_variance_threshold: 0.45, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["ground_nest"], den_site_tags: ["rocky_cover"], den_return_pattern_tags: ["low_movement"], den_radius_m: 6, return_radius_m: 20, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.60 },
      scent_marking_behavior:{ scent_marking_tags: ["dusting"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 15, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 25, trail_reuse_radius_m: 6, pattern_tags: ["covey_run"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.30, open_ground_weight: 0.25, elevation_weight: 0.10 }
    }
  },

spotted_tailed_quoll: {
    common_name: "Spotted-tailed Quoll", scientific_name: "Dasyurus maculatus",
    home_range_km2: 8, migration_distance_km: 2,
    gait_patterns: ["bound","trot","climb"],
    track_size_cm: { front: [3,5], rear: [3.5,5.5] },
    diet: ["small_mammals","birds","reptiles","insects","carrion"], water_needs_l_per_day: 0.3,
    terrain: ["wet_forest","rainforest","rocky_areas"],
    track_depth: "five toes; claw marks; bounding gait; spots on tail diagnostic",
    notes: "Australia's largest marsupial carnivore; nocturnal; solitary; threatened.",
    clustering: { eps_m: 16.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 20, source: "Aus dasyurid" },
    predator_prey: { predatorOf: ["small_mammals","birds","reptiles"], preyOf: ["fox","cat","eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 20, stride_variance_threshold: 0.35, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["rock_crevice","log_hollow","tree_hollow"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 6, return_radius_m: 20, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine","anal_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.62 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 48, escape_line_direction_variance_threshold: 0.27, water_approach_radius_m: 28, trail_reuse_radius_m: 8, pattern_tags: ["stalk_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.12, cover_weight: 0.45, open_ground_weight: 0.08, elevation_weight: 0.09 }
    }
  },
  ringtail_possum: {
    common_name: "Common Ringtail Possum", scientific_name: "Pseudocheirus peregrinus",
    home_range_km2: 0.08, migration_distance_km: 0.2,
    gait_patterns: ["walk","climb"],
    track_size_cm: { front: [2,3], rear: [2.5,3.5] },
    diet: ["leaves","flowers","fruits"], water_needs_l_per_day: 0.15,
    terrain: ["forest","suburban_gardens","coastal_scrub"],
    track_depth: "five toes; opposable; prehensile tail rarely leaves ground mark",
    notes: "Nocturnal; builds dreys; prehensile tail; pairs or family groups.",
    clustering: { eps_m: 7.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 9, source: "Aus marsupial" },
    predator_prey: { predatorOf: ["leaves","flowers","fruits"], preyOf: ["fox","cat","owl","quoll"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.19, separate_band_threshold: 0.42, environmental_sensitivity: 0.65, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.44, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["drey","tree_hollow"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 4, return_radius_m: 12, bedding_spread_threshold_m: 3, freshness_cluster_threshold: 0.70, denning_weight: 0.78 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","sternal_gland"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.48 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.36, water_approach_radius_m: 15, trail_reuse_radius_m: 4, pattern_tags: ["loopback","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.07, cover_weight: 0.52, open_ground_weight: 0.08, elevation_weight: 0.08 }
    }
  },
  platypus: {
    common_name: "Platypus", scientific_name: "Ornithorhynchus anatinus",
    home_range_km2: 0.15, migration_distance_km: 0.5,
    gait_patterns: ["walk","swim","dig"],
    track_size_cm: { front: [3,5], rear: [3.5,5.5] },
    diet: ["invertebrates","crustaceans","worms","insect_larvae"], water_needs_l_per_day: 0.2,
    terrain: ["freshwater_streams","rivers","lakes"],
    track_depth: "five webbed toes; rear spur on males; duck-bill probe marks in mud",
    notes: "Monotreme; electroreception; nocturnal; burrows in banks; males venomous spur.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 10, source: "Aus monotreme" },
    predator_prey: { predatorOf: ["invertebrates","worms","crustaceans"], preyOf: ["fox","eel","hawk"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.88, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.38, forage_weight: 0.62, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.44, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow"], den_site_tags: ["near_water","riverbank"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 4, return_radius_m: 12, bedding_spread_threshold_m: 3, freshness_cluster_threshold: 0.72, denning_weight: 0.88 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["shoreline_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.38, water_approach_radius_m: 14, trail_reuse_radius_m: 4, pattern_tags: ["shoreline_loopback","water_edge_reentry"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.72, cover_weight: 0.08, open_ground_weight: 0.02, elevation_weight: 0.00 }
    }
  },
  bilby: {
    common_name: "Greater Bilby", scientific_name: "Macrotis lagotis",
    home_range_km2: 1.5, migration_distance_km: 1,
    gait_patterns: ["bound","hop","dig"],
    track_size_cm: { front: [2.5,4], rear: [3.5,5] },
    diet: ["insects","bulbs","seeds","fungi","small_vertebrates"], water_needs_l_per_day: 0.05,
    terrain: ["arid_scrub","spinifex_grassland","mulga_woodland"],
    track_depth: "asymmetric three-toed prints; large ears leave no mark; long spiral burrows",
    notes: "Nocturnal; obtains water from food; long rabbit-like ears; endangered; spiral burrows.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12, source: "Aus arid mammal" },
    predator_prey: { predatorOf: ["insects","bulbs","small_vertebrates"], preyOf: ["fox","cat","dingo","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.82, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 14, stride_variance_threshold: 0.44, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow"], den_site_tags: ["open_ground","dry"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 5, return_radius_m: 14, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.88 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 9, route_reuse_threshold_m: 6, freshness_cluster_threshold: 0.68, scent_weight: 0.42 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 62, escape_line_direction_variance_threshold: 0.38, water_approach_radius_m: 18, trail_reuse_radius_m: 5, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.27, water_edge_weight: 0.04, cover_weight: 0.18, open_ground_weight: 0.48, elevation_weight: 0.03 }
    }
  },
  bandicoot: {
    common_name: "Long-nosed Bandicoot", scientific_name: "Perameles nasuta",
    home_range_km2: 0.08, migration_distance_km: 0.2,
    gait_patterns: ["bound","hop"],
    track_size_cm: { front: [2,3], rear: [3,4.5] },
    diet: ["insects","worms","fungi","seeds","tubers"], water_needs_l_per_day: 0.1,
    terrain: ["forest","heathland","suburban_gardens"],
    track_depth: "conical snout probe marks in soil; bounding pairs; small asymmetric prints",
    notes: "Nocturnal; solitary; pointed snout probe marks in soil diagnostic; rapid digger.",
    clustering: { eps_m: 7.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 9, source: "Aus marsupial" },
    predator_prey: { predatorOf: ["insects","worms","tubers"], preyOf: ["fox","cat","owl","quoll"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.19, separate_band_threshold: 0.42, environmental_sensitivity: 0.70, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.42, forage_weight: 0.58, direction_change_threshold_deg: 64, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.46, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["grass_nest","leaf_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 3, return_radius_m: 10, bedding_spread_threshold_m: 3, freshness_cluster_threshold: 0.70, denning_weight: 0.68 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 8, route_reuse_threshold_m: 5, freshness_cluster_threshold: 0.68, scent_weight: 0.38 },
      movement_pattern:      { loopback_radius_m: 10, zigzag_direction_threshold_deg: 65, escape_line_direction_variance_threshold: 0.40, water_approach_radius_m: 14, trail_reuse_radius_m: 4, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.10, cover_weight: 0.40, open_ground_weight: 0.22, elevation_weight: 0.03 }
    }
  },
  numbat: {
    common_name: "Numbat", scientific_name: "Myrmecobius fasciatus",
    home_range_km2: 0.5, migration_distance_km: 0.3,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [1.5,2.5], rear: [2,3] },
    diet: ["termites"], water_needs_l_per_day: 0.05,
    terrain: ["wandoo_woodland","eucalypt_forest","semi_arid_scrub"],
    track_depth: "five toes; long front claws; termite mound disturbance nearby",
    notes: "Diurnal; only marsupial strictly diurnal; no pouch in females; termite specialist.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 10, source: "Aus marsupial" },
    predator_prey: { predatorOf: ["termites"], preyOf: ["fox","cat","eagle","carpet_python"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.19, separate_band_threshold: 0.42, environmental_sensitivity: 0.78, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.35, forage_weight: 0.65, direction_change_threshold_deg: 66, spread_tightness_threshold_m: 10, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["log_hollow","burrow"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 3, return_radius_m: 10, bedding_spread_threshold_m: 3, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 2, revisit_radius_m: 7, route_reuse_threshold_m: 4, freshness_cluster_threshold: 0.68, scent_weight: 0.35 },
      movement_pattern:      { loopback_radius_m: 10, zigzag_direction_threshold_deg: 66, escape_line_direction_variance_threshold: 0.40, water_approach_radius_m: 14, trail_reuse_radius_m: 4, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.06, cover_weight: 0.35, open_ground_weight: 0.30, elevation_weight: 0.03 }
    }
  },
  ship_rat: {
    common_name: "Ship Rat", scientific_name: "Rattus rattus",
    home_range_km2: 0.02, migration_distance_km: 0.1,
    gait_patterns: ["run","bound","climb"],
    track_size_cm: { front: [1.5,2.5], rear: [2,3] },
    diet: ["seeds","fruit","insects","food_waste","eggs"], water_needs_l_per_day: 0.05,
    terrain: ["urban","forest","coastal","island"],
    track_depth: "four front toes; five rear; narrow; dragging tail mark; runs along walls",
    notes: "Nocturnal; agile climber; significant invasive pest on islands; thinner tail than brown rat.",
    clustering: { eps_m: 6.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 7, source: "Urban rodent" },
    predator_prey: { predatorOf: ["seeds","eggs","insects"], preyOf: ["cat","stoat","owl","hawk"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.20, separate_band_threshold: 0.45, environmental_sensitivity: 0.68, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.60, forage_weight: 0.40, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 8, stride_variance_threshold: 0.46, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["nest","burrow","wall_cavity"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 3, return_radius_m: 8, bedding_spread_threshold_m: 2, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 2, revisit_radius_m: 5, route_reuse_threshold_m: 3, freshness_cluster_threshold: 0.68, scent_weight: 0.48 },
      movement_pattern:      { loopback_radius_m: 8, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.32, water_approach_radius_m: 10, trail_reuse_radius_m: 3, pattern_tags: ["trail_reuse","zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.22, water_edge_weight: 0.10, cover_weight: 0.45, open_ground_weight: 0.15, elevation_weight: 0.08 }
    }
  },
  norway_rat: {
    common_name: "Norway Rat", scientific_name: "Rattus norvegicus",
    home_range_km2: 0.03, migration_distance_km: 0.1,
    gait_patterns: ["run","bound","swim"],
    track_size_cm: { front: [2,3], rear: [2.5,3.5] },
    diet: ["seeds","insects","food_waste","carrion","small_vertebrates"], water_needs_l_per_day: 0.06,
    terrain: ["urban","farmland","riverbank","sewer"],
    track_depth: "four front toes; five rear; thick tail drag; burrow entrances nearby",
    notes: "Nocturnal; excellent swimmer; burrows; heavier than ship rat; blunter snout.",
    clustering: { eps_m: 6.0, stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 8, source: "Urban rodent" },
    predator_prey: { predatorOf: ["seeds","small_vertebrates","food_waste"], preyOf: ["cat","stoat","owl","hawk"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.20, separate_band_threshold: 0.45, environmental_sensitivity: 0.70, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 10, stride_variance_threshold: 0.44, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","wall_cavity"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 3, return_radius_m: 9, bedding_spread_threshold_m: 2, freshness_cluster_threshold: 0.70, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 2, revisit_radius_m: 6, route_reuse_threshold_m: 3, freshness_cluster_threshold: 0.68, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 9, zigzag_direction_threshold_deg: 56, escape_line_direction_variance_threshold: 0.32, water_approach_radius_m: 12, trail_reuse_radius_m: 3, pattern_tags: ["trail_reuse","shoreline_loopback"] },
      terrain_intelligence:  { terrain_weight: 0.22, water_edge_weight: 0.28, cover_weight: 0.38, open_ground_weight: 0.10, elevation_weight: 0.02 }
    }
  },
  house_mouse: {
    common_name: "House Mouse", scientific_name: "Mus musculus",
    home_range_km2: 0.004, migration_distance_km: 0.05,
    gait_patterns: ["run","bound"],
    track_size_cm: { front: [1,1.5], rear: [1.2,1.8] },
    diet: ["seeds","grains","insects","food_waste"], water_needs_l_per_day: 0.02,
    terrain: ["urban","farmland","grassland","island"],
    track_depth: "tiny four front toes; five rear; tail drag fine line; running lanes",
    notes: "Nocturnal; follows walls; ultrasonic calls; worldwide invasive; plague irruptions.",
    clustering: { eps_m: 4.0, stride_multiplier: 1.2, min_pts: 3, typical_group_radius_m: 5, source: "Small rodent" },
    predator_prey: { predatorOf: ["seeds","insects"], preyOf: ["cat","stoat","owl","snake"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.22, separate_band_threshold: 0.48, environmental_sensitivity: 0.65, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.62, forage_weight: 0.38, direction_change_threshold_deg: 60, spread_tightness_threshold_m: 6, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["nest","wall_cavity","grass_nest"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 2, return_radius_m: 6, bedding_spread_threshold_m: 2, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 2, revisit_radius_m: 4, route_reuse_threshold_m: 2, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 6, zigzag_direction_threshold_deg: 62, escape_line_direction_variance_threshold: 0.36, water_approach_radius_m: 8, trail_reuse_radius_m: 2, pattern_tags: ["trail_reuse","zigzag_escape"] },
      terrain_intelligence:  { terrain_weight: 0.20, water_edge_weight: 0.08, cover_weight: 0.50, open_ground_weight: 0.18, elevation_weight: 0.04 }
    }
  },
  sika_deer: {
    common_name: "Sika Deer", scientific_name: "Cervus nippon",
    home_range_km2: 1.5, migration_distance_km: 10,
    gait_patterns: ["walk","trot","bound"],
    track_size_cm: { front: [5.5,8], rear: [5,7] },
    diet: ["grasses","browse","bark","fungi"], water_needs_l_per_day: 3,
    terrain: ["forest","woodland","coastal_grassland"],
    track_depth: "narrow pointed cloven; similar to roe deer but larger; heart-shaped",
    notes: "Invasive in Europe; native to East Asia; hybridises with red deer; crepuscular.",
    clustering: { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 38, source: "European cervid" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.50, forage_weight: 0.50, direction_change_threshold_deg: 52, spread_tightness_threshold_m: 30, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["depression_nest","cover_loafing"], den_site_tags: ["dense_cover","shade_bed"], den_return_pattern_tags: ["cover_reentry"], den_radius_m: 10, return_radius_m: 32, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark","rubbing"], loopback_pattern_tags: ["edge_revisit"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.58 },
      movement_pattern:      { loopback_radius_m: 28, zigzag_direction_threshold_deg: 46, escape_line_direction_variance_threshold: 0.23, water_approach_radius_m: 38, trail_reuse_radius_m: 9, pattern_tags: ["zigzag_escape","forage_spread_then_regroup"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.22, cover_weight: 0.32, open_ground_weight: 0.14, elevation_weight: 0.07 }
    }
  },
  fallow_deer: {
    common_name: "Fallow Deer", scientific_name: "Dama dama",
    home_range_km2: 1, migration_distance_km: 5,
    gait_patterns: ["walk","trot","pronk","gallop"],
    track_size_cm: { front: [5,7.5], rear: [4.5,7] },
    diet: ["grasses","browse","acorns","bark"], water_needs_l_per_day: 2.5,
    terrain: ["parkland","mixed_forest","farmland"],
    track_depth: "narrow cloven; spade-shaped; smaller than red deer; males larger",
    notes: "Palmate antlers on bucks; introduced widely; deer parks; crepuscular.",
    clustering: { eps_m: 28.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 35, source: "European cervid" },
    predator_prey: { predatorOf: [], preyOf: ["wolf","lynx"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.35, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.48, forage_weight: 0.52, direction_change_threshold_deg: 50, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["depression_nest","cover_loafing"], den_site_tags: ["dense_cover","shade_bed"], den_return_pattern_tags: ["cover_reentry"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.75 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","scrape_mark","rubbing"], loopback_pattern_tags: ["edge_revisit"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 16, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 26, zigzag_direction_threshold_deg: 46, escape_line_direction_variance_threshold: 0.23, water_approach_radius_m: 36, trail_reuse_radius_m: 9, pattern_tags: ["zigzag_escape","forage_spread_then_regroup"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.20, cover_weight: 0.32, open_ground_weight: 0.16, elevation_weight: 0.07 }
    }
  },
  ferret: {
    common_name: "Domestic Ferret", scientific_name: "Mustela putorius furo",
    home_range_km2: 0.2, migration_distance_km: 0.3,
    gait_patterns: ["bound","lope","walk"],
    track_size_cm: { front: [2.5,4], rear: [3,4.5] },
    diet: ["small_mammals","birds","rabbits","eggs"], water_needs_l_per_day: 0.1,
    terrain: ["farmland","grassland","scrub","urban_edge"],
    track_depth: "five toes; bounding pairs; feral populations in NZ; similar to polecat",
    notes: "Domesticated polecat; significant invasive predator in NZ; nocturnal; musky odour.",
    clustering: { eps_m: 8.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 10, source: "Mustelid" },
    predator_prey: { predatorOf: ["rabbits","small_mammals","birds"], preyOf: ["fox","eagle","cat"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.18, separate_band_threshold: 0.40, environmental_sensitivity: 0.68, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.52, forage_weight: 0.48, direction_change_threshold_deg: 54, spread_tightness_threshold_m: 14, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","rock_crevice"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 5, return_radius_m: 14, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["musk_mark","latrine","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 10, route_reuse_threshold_m: 7, freshness_cluster_threshold: 0.68, scent_weight: 0.58 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 20, trail_reuse_radius_m: 5, pattern_tags: ["zigzag","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.14, cover_weight: 0.38, open_ground_weight: 0.18, elevation_weight: 0.05 }
    }
  },
  kiwi: {
    common_name: "Brown Kiwi", scientific_name: "Apteryx mantelli",
    home_range_km2: 0.25, migration_distance_km: 0.2,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [6,8], rear: [5,7] },
    diet: ["earthworms","grubs","berries","leaves","insects"], water_needs_l_per_day: 0.1,
    terrain: ["temperate_forest","scrub","farmland"],
    track_depth: "three forward toes; vestigial rear toe; wide stance; distinctive probe marks",
    notes: "Nocturnal; uses nostrils at bill tip for probing; monogamous pairs; NZ endemic.",
    clustering: { eps_m: 10.0, stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 12, source: "NZ ratite" },
    predator_prey: { predatorOf: ["earthworms","grubs","insects"], preyOf: ["stoat","cat","dog","ferret"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.19, separate_band_threshold: 0.42, environmental_sensitivity: 0.72, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.30, forage_weight: 0.70, direction_change_threshold_deg: 68, spread_tightness_threshold_m: 14, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","log_hollow"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 5, return_radius_m: 14, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.80 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 10, route_reuse_threshold_m: 7, freshness_cluster_threshold: 0.68, scent_weight: 0.42 },
      movement_pattern:      { loopback_radius_m: 14, zigzag_direction_threshold_deg: 65, escape_line_direction_variance_threshold: 0.40, water_approach_radius_m: 18, trail_reuse_radius_m: 5, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.12, cover_weight: 0.48, open_ground_weight: 0.10, elevation_weight: 0.04 }
    }
  },
  bettong: {
    common_name: "Burrowing Bettong", scientific_name: "Bettongia lesueur",
    home_range_km2: 0.15, migration_distance_km: 0.3,
    gait_patterns: ["hop","bound"],
    track_size_cm: { front: [2.5,3.5], rear: [5,7] },
    diet: ["fungi","roots","bulbs","seeds","insects"], water_needs_l_per_day: 0.1,
    terrain: ["arid_scrub","spinifex_grassland","island"],
    track_depth: "elongated hind feet; smaller front; tail drag occasional; burrow entrances",
    notes: "Nocturnal; warren burrows; important fungal disperser; extinct mainland; island refugia.",
    clustering: { eps_m: 9.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 11, source: "Aus macropod" },
    predator_prey: { predatorOf: ["fungi","roots","insects"], preyOf: ["fox","cat","dingo","owl"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.19, separate_band_threshold: 0.42, environmental_sensitivity: 0.78, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.48, forage_weight: 0.52, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 12, stride_variance_threshold: 0.44, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","warren"], den_site_tags: ["open_ground","dry"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 5, return_radius_m: 14, bedding_spread_threshold_m: 4, freshness_cluster_threshold: 0.70, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 3, revisit_radius_m: 9, route_reuse_threshold_m: 6, freshness_cluster_threshold: 0.68, scent_weight: 0.42 },
      movement_pattern:      { loopback_radius_m: 12, zigzag_direction_threshold_deg: 62, escape_line_direction_variance_threshold: 0.38, water_approach_radius_m: 16, trail_reuse_radius_m: 4, pattern_tags: ["meandering_search","loopback"] },
      terrain_intelligence:  { terrain_weight: 0.27, water_edge_weight: 0.05, cover_weight: 0.20, open_ground_weight: 0.45, elevation_weight: 0.03 }
    }
  },

white_rhino: {
    common_name: "White Rhinoceros", scientific_name: "Ceratotherium simum",
    home_range_km2: 15, migration_distance_km: 10,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [30,45], rear: [28,42] },
    diet: ["grasses"], water_needs_l_per_day: 60,
    terrain: ["savanna","grassland","bushveld"],
    track_depth: "three-toed; enormous round; toenail indentations; very heavy impression",
    notes: "Grazer; social groups; square lip; wallowing; horn poached aggressively.",
    clustering: { eps_m: 55.0, stride_multiplier: 2.2, min_pts: 3, typical_group_radius_m: 70, source: "African megafauna" },
    predator_prey: { predatorOf: [], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.28, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.42, forage_weight: 0.58, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 55, stride_variance_threshold: 0.22, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["wallowing_site","shade_loafing"], den_site_tags: ["near_water","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 30, return_radius_m: 90, bedding_spread_threshold_m: 25, freshness_cluster_threshold: 0.65, denning_weight: 0.50 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_spray","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 15, revisit_radius_m: 50, route_reuse_threshold_m: 30, freshness_cluster_threshold: 0.65, scent_weight: 0.60 },
      movement_pattern:      { loopback_radius_m: 60, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 80, trail_reuse_radius_m: 25, pattern_tags: ["trail_reuse","linear_travel"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.30, cover_weight: 0.10, open_ground_weight: 0.30, elevation_weight: 0.05 }
    }
  },
  black_rhino: {
    common_name: "Black Rhinoceros", scientific_name: "Diceros bicornis",
    home_range_km2: 25, migration_distance_km: 15,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [25,38], rear: [24,36] },
    diet: ["browse","shrubs","herbs","bark"], water_needs_l_per_day: 45,
    terrain: ["thornbush","woodland","semi_arid"],
    track_depth: "three-toed; large; slightly smaller than white rhino; browser dung nearby",
    notes: "Solitary browser; hooked lip; aggressive when threatened; critically endangered.",
    clustering: { eps_m: 45.0, stride_multiplier: 2.1, min_pts: 3, typical_group_radius_m: 55, source: "African megafauna" },
    predator_prey: { predatorOf: [], preyOf: [] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.12, separate_band_threshold: 0.28, environmental_sensitivity: 0.75, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 42, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.24, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["wallowing_site","thicket"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 65, bedding_spread_threshold_m: 18, freshness_cluster_threshold: 0.65, denning_weight: 0.55 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_spray","scrape_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 25, freshness_cluster_threshold: 0.65, scent_weight: 0.65 },
      movement_pattern:      { loopback_radius_m: 50, zigzag_direction_threshold_deg: 38, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 65, trail_reuse_radius_m: 20, pattern_tags: ["trail_reuse","linear_travel"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.28, cover_weight: 0.22, open_ground_weight: 0.20, elevation_weight: 0.05 }
    }
  },
  giraffe: {
    common_name: "Giraffe", scientific_name: "Giraffa camelopardalis",
    home_range_km2: 50, migration_distance_km: 20,
    gait_patterns: ["walk","gallop"],
    track_size_cm: { front: [18,25], rear: [18,25] },
    diet: ["acacia_leaves","browse","flowers"], water_needs_l_per_day: 10,
    terrain: ["savanna","open_woodland","thornbush"],
    track_depth: "large rounded cloven; very widely spaced; long neck leaves no ground sign",
    notes: "Tallest living terrestrial animal; ossicones; splayed gait when galloping.",
    clustering: { eps_m: 60.0, stride_multiplier: 2.6, min_pts: 4, typical_group_radius_m: 85, source: "African megafauna" },
    predator_prey: { predatorOf: [], preyOf: ["lion","crocodile"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.13, separate_band_threshold: 0.30, environmental_sensitivity: 0.78, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 35, spread_tightness_threshold_m: 65, stride_variance_threshold: 0.22, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["open_ground","shade_loafing"], den_site_tags: ["open","shade"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 25, return_radius_m: 80, bedding_spread_threshold_m: 22, freshness_cluster_threshold: 0.65, denning_weight: 0.48 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","dung_pile"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 12, revisit_radius_m: 40, route_reuse_threshold_m: 25, freshness_cluster_threshold: 0.65, scent_weight: 0.40 },
      movement_pattern:      { loopback_radius_m: 80, zigzag_direction_threshold_deg: 30, escape_line_direction_variance_threshold: 0.16, water_approach_radius_m: 90, trail_reuse_radius_m: 30, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.25, water_edge_weight: 0.22, cover_weight: 0.15, open_ground_weight: 0.30, elevation_weight: 0.08 }
    }
  },
  nyala: {
    common_name: "Nyala", scientific_name: "Tragelaphus angasii",
    home_range_km2: 4, migration_distance_km: 5,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [6,9], rear: [5.5,8] },
    diet: ["browse","forbs","fruit","bark"], water_needs_l_per_day: 3,
    terrain: ["dense_bushveld","riverine_thicket","woodland"],
    track_depth: "narrow pointed cloven; lighter than kudu; males much larger than females",
    notes: "Extreme sexual dimorphism; very shy; dense vegetation specialist; crepuscular.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 28, source: "African ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["lion","leopard","wild_dog"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.32, environmental_sensitivity: 0.78, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.54, forage_weight: 0.46, direction_change_threshold_deg: 46, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.66 },
      denning_behavior:      { den_types: ["thicket","cover_loafing"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 12, return_radius_m: 38, bedding_spread_threshold_m: 10, freshness_cluster_threshold: 0.70, denning_weight: 0.72 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","preorbital_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.52 },
      movement_pattern:      { loopback_radius_m: 28, zigzag_direction_threshold_deg: 44, escape_line_direction_variance_threshold: 0.24, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["zigzag_escape","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.24, cover_weight: 0.35, open_ground_weight: 0.10, elevation_weight: 0.05 }
    }
  },
  eland: {
    common_name: "Common Eland", scientific_name: "Tragelaphus oryx",
    home_range_km2: 100, migration_distance_km: 50,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [10,14], rear: [9,13] },
    diet: ["grasses","browse","forbs","fruits"], water_needs_l_per_day: 5,
    terrain: ["open_savanna","woodland","semi_arid"],
    track_depth: "large rounded cloven; ox-like; heavy; dew claws in soft ground",
    notes: "Largest antelope; surprisingly agile; clicking tendons audible; diurnal.",
    clustering: { eps_m: 48.0, stride_multiplier: 2.2, min_pts: 4, typical_group_radius_m: 65, source: "African ungulate" },
    predator_prey: { predatorOf: [], preyOf: ["lion","wild_dog","spotted_hyena"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.13, separate_band_threshold: 0.31, environmental_sensitivity: 0.76, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.48, forage_weight: 0.52, direction_change_threshold_deg: 38, spread_tightness_threshold_m: 55, stride_variance_threshold: 0.24, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["open_ground","shade_loafing"], den_site_tags: ["shade","open"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 20, return_radius_m: 60, bedding_spread_threshold_m: 18, freshness_cluster_threshold: 0.65, denning_weight: 0.52 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_mark","forehead_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 10, revisit_radius_m: 32, route_reuse_threshold_m: 20, freshness_cluster_threshold: 0.65, scent_weight: 0.48 },
      movement_pattern:      { loopback_radius_m: 70, zigzag_direction_threshold_deg: 35, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 80, trail_reuse_radius_m: 22, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.22, cover_weight: 0.16, open_ground_weight: 0.32, elevation_weight: 0.04 }
    }
  },
  aardvark: {
    common_name: "Aardvark", scientific_name: "Orycteropus afer",
    home_range_km2: 10, migration_distance_km: 3,
    gait_patterns: ["walk","trot","dig"],
    track_size_cm: { front: [6,9], rear: [7,10] },
    diet: ["ants","termites"], water_needs_l_per_day: 0.2,
    terrain: ["savanna","woodland","bushveld","semi_arid"],
    track_depth: "four front toes; five rear; powerful claw marks; burrow entrances nearby",
    notes: "Nocturnal; powerful digger; critical ecosystem engineer; burrows used by many species.",
    clustering: { eps_m: 18.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 22, source: "African large mammal" },
    predator_prey: { predatorOf: ["ants","termites"], preyOf: ["lion","leopard","python"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.34, environmental_sensitivity: 0.76, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.32, forage_weight: 0.68, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 25, stride_variance_threshold: 0.44, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","warren"], den_site_tags: ["open_ground","dry"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.88 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine","anal_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 6, revisit_radius_m: 18, route_reuse_threshold_m: 12, freshness_cluster_threshold: 0.68, scent_weight: 0.48 },
      movement_pattern:      { loopback_radius_m: 22, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.32, water_approach_radius_m: 28, trail_reuse_radius_m: 8, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.12, cover_weight: 0.18, open_ground_weight: 0.40, elevation_weight: 0.04 }
    }
  },
  ground_pangolin: {
    common_name: "Ground Pangolin", scientific_name: "Smutsia temminckii",
    home_range_km2: 8, migration_distance_km: 2,
    gait_patterns: ["walk","bipedal_walk"],
    track_size_cm: { front: [4,6], rear: [5,7] },
    diet: ["ants","termites"], water_needs_l_per_day: 0.1,
    terrain: ["savanna","woodland","bushveld"],
    track_depth: "bipedal hind prints; tail drag continuous; scale impressions in soft mud",
    notes: "Nocturnal; scales armour; rolls into ball; most trafficked mammal; bipedal walking.",
    clustering: { eps_m: 14.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 18, source: "African large mammal" },
    predator_prey: { predatorOf: ["ants","termites"], preyOf: ["lion","leopard","hyena"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.76, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.22, forage_weight: 0.78, direction_change_threshold_deg: 65, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.50, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","aardvark_hole"], den_site_tags: ["open_ground","dry"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 6, return_radius_m: 18, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.82 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine","anal_gland_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 62, escape_line_direction_variance_threshold: 0.38, water_approach_radius_m: 22, trail_reuse_radius_m: 6, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.10, cover_weight: 0.20, open_ground_weight: 0.40, elevation_weight: 0.04 }
    }
  },
  african_civet: {
    common_name: "African Civet", scientific_name: "Civettictis civetta",
    home_range_km2: 3, migration_distance_km: 2,
    gait_patterns: ["walk","trot"],
    track_size_cm: { front: [4,6], rear: [4.5,6.5] },
    diet: ["fruits","insects","rodents","carrion","reptiles","eggs"], water_needs_l_per_day: 0.5,
    terrain: ["woodland","forest_edge","farmland","savanna"],
    track_depth: "five toes; semi-retractable claws; direct register; civetry latrine sites",
    notes: "Nocturnal; communal latrines used for scent communication; musk used in perfume.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 15, source: "African viverrid" },
    predator_prey: { predatorOf: ["rodents","reptiles","insects"], preyOf: ["leopard","lion","python"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.74, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 55, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.38, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","dense_thicket"], den_site_tags: ["dense_cover"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 7, return_radius_m: 20, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.70 },
      scent_marking_behavior:{ scent_marking_tags: ["civetry_latrine","urine_mark","perineal_mark"], loopback_pattern_tags: ["localized_loopback","circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.72 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 52, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 24, trail_reuse_radius_m: 7, pattern_tags: ["trail_reuse","zigzag"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.16, cover_weight: 0.35, open_ground_weight: 0.18, elevation_weight: 0.05 }
    }
  },
  white_lipped_peccary: {
    common_name: "White-lipped Peccary", scientific_name: "Tayassu pecari",
    home_range_km2: 50, migration_distance_km: 15,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [4,6], rear: [3.5,5.5] },
    diet: ["fruits","roots","seeds","fungi","small_animals"], water_needs_l_per_day: 3,
    terrain: ["tropical_forest","gallery_forest","flooded_forest"],
    track_depth: "two-toed like collared peccary but slightly larger; large herds flatten trail",
    notes: "Large herds 50-300; extremely aggressive when threatened; clicking teeth warning.",
    clustering: { eps_m: 35.0, stride_multiplier: 2.0, min_pts: 6, typical_group_radius_m: 50, source: "SA suiform" },
    predator_prey: { predatorOf: ["fruits","roots","small_animals"], preyOf: ["jaguar","puma","harpy_eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.34, environmental_sensitivity: 0.82, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.45, forage_weight: 0.55, direction_change_threshold_deg: 45, spread_tightness_threshold_m: 45, stride_variance_threshold: 0.30, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["thicket","cover_loafing"], den_site_tags: ["dense_cover","near_water"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 15, return_radius_m: 45, bedding_spread_threshold_m: 14, freshness_cluster_threshold: 0.70, denning_weight: 0.62 },
      scent_marking_behavior:{ scent_marking_tags: ["dorsal_gland_mark","urine_mark","dung_pile"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 15, freshness_cluster_threshold: 0.68, scent_weight: 0.62 },
      movement_pattern:      { loopback_radius_m: 45, zigzag_direction_threshold_deg: 42, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 55, trail_reuse_radius_m: 14, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.28, cover_weight: 0.30, open_ground_weight: 0.12, elevation_weight: 0.04 }
    }
  },
  tamandua: {
    common_name: "Southern Tamandua", scientific_name: "Tamandua tetradactyla",
    home_range_km2: 1.5, migration_distance_km: 1,
    gait_patterns: ["walk","climb"],
    track_size_cm: { front: [5,8], rear: [4,6] },
    diet: ["ants","termites","bees","honey"], water_needs_l_per_day: 0.1,
    terrain: ["tropical_forest","gallery_forest","grassland"],
    track_depth: "knuckle-walking front with large curved claws; five-toed rear; distinctive",
    notes: "Semi-arboreal; knuckle-walking; uses prehensile tail; strong musky odour when stressed.",
    clustering: { eps_m: 12.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 15, source: "SA medium mammal" },
    predator_prey: { predatorOf: ["ants","termites","bees"], preyOf: ["jaguar","puma","harpy_eagle"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.80, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.28, forage_weight: 0.72, direction_change_threshold_deg: 64, spread_tightness_threshold_m: 18, stride_variance_threshold: 0.48, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_hollow","burrow"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["repeated_entry_exit"], den_radius_m: 7, return_radius_m: 20, bedding_spread_threshold_m: 5, freshness_cluster_threshold: 0.70, denning_weight: 0.68 },
      scent_marking_behavior:{ scent_marking_tags: ["anal_gland_mark","urine_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 4, revisit_radius_m: 12, route_reuse_threshold_m: 8, freshness_cluster_threshold: 0.68, scent_weight: 0.45 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 58, escape_line_direction_variance_threshold: 0.34, water_approach_radius_m: 22, trail_reuse_radius_m: 6, pattern_tags: ["meandering_search","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.15, cover_weight: 0.40, open_ground_weight: 0.15, elevation_weight: 0.04 }
    }
  },
  giant_armadillo: {
    common_name: "Giant Armadillo", scientific_name: "Priodontes maximus",
    home_range_km2: 25, migration_distance_km: 5,
    gait_patterns: ["walk","dig"],
    track_size_cm: { front: [9,14], rear: [8,12] },
    diet: ["ants","termites","worms","larvae"], water_needs_l_per_day: 0.5,
    terrain: ["tropical_forest","cerrado","gallery_forest"],
    track_depth: "enormous curved front claws; five rear toes; tail drag; armour edge marks",
    notes: "Largest armadillo; nocturnal; powerful digger; creates burrows used by other species.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 28, source: "SA large mammal" },
    predator_prey: { predatorOf: ["termites","ants","worms"], preyOf: ["jaguar","puma"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.80, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.28, forage_weight: 0.72, direction_change_threshold_deg: 62, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.46, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","excavated"], den_site_tags: ["dense_cover","forest_floor"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 10, return_radius_m: 30, bedding_spread_threshold_m: 8, freshness_cluster_threshold: 0.70, denning_weight: 0.85 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine","anal_gland_mark"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 15, route_reuse_threshold_m: 10, freshness_cluster_threshold: 0.68, scent_weight: 0.42 },
      movement_pattern:      { loopback_radius_m: 28, zigzag_direction_threshold_deg: 60, escape_line_direction_variance_threshold: 0.36, water_approach_radius_m: 35, trail_reuse_radius_m: 10, pattern_tags: ["meandering_search"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.15, cover_weight: 0.38, open_ground_weight: 0.18, elevation_weight: 0.03 }
    }
  },
  coatimundi: {
    common_name: "White-nosed Coati", scientific_name: "Nasua narica",
    home_range_km2: 1, migration_distance_km: 1,
    gait_patterns: ["walk","trot","climb"],
    track_size_cm: { front: [3.5,5.5], rear: [4,6] },
    diet: ["insects","fruits","lizards","rodents","eggs"], water_needs_l_per_day: 0.5,
    terrain: ["tropical_forest","dry_forest","scrub"],
    track_depth: "five toes; long front claws for digging; tail held erect; social trail patterns",
    notes: "Diurnal; females and young in bands; males solitary; long flexible snout; noisy.",
    clustering: { eps_m: 14.0, stride_multiplier: 1.6, min_pts: 4, typical_group_radius_m: 18, source: "SA procyonid" },
    predator_prey: { predatorOf: ["insects","lizards","rodents"], preyOf: ["jaguar","ocelot","harpy_eagle","boa"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.17, separate_band_threshold: 0.38, environmental_sensitivity: 0.76, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.40, forage_weight: 0.60, direction_change_threshold_deg: 58, spread_tightness_threshold_m: 20, stride_variance_threshold: 0.40, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["tree_roost","rock_crevice"], den_site_tags: ["dense_cover","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 8, return_radius_m: 22, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.70, denning_weight: 0.68 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine","anal_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["boundary"], marking_radius_m: 5, revisit_radius_m: 14, route_reuse_threshold_m: 9, freshness_cluster_threshold: 0.68, scent_weight: 0.55 },
      movement_pattern:      { loopback_radius_m: 18, zigzag_direction_threshold_deg: 55, escape_line_direction_variance_threshold: 0.30, water_approach_radius_m: 24, trail_reuse_radius_m: 7, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.16, cover_weight: 0.38, open_ground_weight: 0.14, elevation_weight: 0.06 }
    }
  },
  mara: {
    common_name: "Patagonian Mara", scientific_name: "Dolichotis patagonum",
    home_range_km2: 2, migration_distance_km: 2,
    gait_patterns: ["walk","trot","gallop","bound"],
    track_size_cm: { front: [4,6], rear: [5,7] },
    diet: ["grasses","herbs","cacti","shrubs"], water_needs_l_per_day: 0.5,
    terrain: ["open_grassland","scrubland","monte_desert"],
    track_depth: "hoof-like nails; three rear toes; four front; rabbit-deer appearance",
    notes: "Monogamous; large rabbit-like rodent; diurnal; hoofed nails; communal burrows.",
    clustering: { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 28, source: "SA large rodent" },
    predator_prey: { predatorOf: [], preyOf: ["puma","maned_wolf","eagle","fox"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.16, separate_band_threshold: 0.36, environmental_sensitivity: 0.80, tags: ["fast_decay"] },
      flight_or_forage:      { flight_weight: 0.58, forage_weight: 0.42, direction_change_threshold_deg: 44, spread_tightness_threshold_m: 28, stride_variance_threshold: 0.28, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["burrow","warren"], den_site_tags: ["open_ground","dry"], den_return_pattern_tags: ["repeated_entry_exit","burrow_center_loop"], den_radius_m: 8, return_radius_m: 24, bedding_spread_threshold_m: 6, freshness_cluster_threshold: 0.68, denning_weight: 0.78 },
      scent_marking_behavior:{ scent_marking_tags: ["urine_mark","latrine"], loopback_pattern_tags: ["localized_loopback"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 5, revisit_radius_m: 14, route_reuse_threshold_m: 9, freshness_cluster_threshold: 0.68, scent_weight: 0.42 },
      movement_pattern:      { loopback_radius_m: 25, zigzag_direction_threshold_deg: 42, escape_line_direction_variance_threshold: 0.22, water_approach_radius_m: 32, trail_reuse_radius_m: 9, pattern_tags: ["linear_escape","loopback"] },
      terrain_intelligence:  { terrain_weight: 0.28, water_edge_weight: 0.10, cover_weight: 0.10, open_ground_weight: 0.48, elevation_weight: 0.04 }
    }
  },
  vicuna: {
    common_name: "Vicuna", scientific_name: "Vicugna vicugna",
    home_range_km2: 5, migration_distance_km: 10,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [6,8], rear: [5.5,7.5] },
    diet: ["grasses","herbs","high_altitude_plants"], water_needs_l_per_day: 2,
    terrain: ["high_andes","puna_grassland","alpine_meadow"],
    track_depth: "two-toed camelid; soft padded feet; narrow; family group patterns",
    notes: "Highest altitude ungulate; finest natural fibre; protected species; Andes endemic.",
    clustering: { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 35, source: "SA camelid" },
    predator_prey: { predatorOf: [], preyOf: ["puma","andean_fox","condor"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.15, separate_band_threshold: 0.34, environmental_sensitivity: 0.68, tags: ["slow_decay"] },
      flight_or_forage:      { flight_weight: 0.55, forage_weight: 0.45, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 35, stride_variance_threshold: 0.26, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["open_ground","minimal_cover"], den_site_tags: ["open","elevated"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 15, return_radius_m: 45, bedding_spread_threshold_m: 12, freshness_cluster_threshold: 0.65, denning_weight: 0.50 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 7, revisit_radius_m: 22, route_reuse_threshold_m: 14, freshness_cluster_threshold: 0.65, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 35, zigzag_direction_threshold_deg: 38, escape_line_direction_variance_threshold: 0.20, water_approach_radius_m: 42, trail_reuse_radius_m: 12, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.12, cover_weight: 0.08, open_ground_weight: 0.28, elevation_weight: 0.26 }
    }
  },
  guanaco: {
    common_name: "Guanaco", scientific_name: "Lama guanicoe",
    home_range_km2: 20, migration_distance_km: 30,
    gait_patterns: ["walk","trot","gallop"],
    track_size_cm: { front: [7,10], rear: [6.5,9.5] },
    diet: ["grasses","shrubs","lichens","cacti"], water_needs_l_per_day: 2.5,
    terrain: ["patagonian_steppe","andes","desert","coastal"],
    track_depth: "two-toed camelid; soft leathery pads; wider than vicuna; herd trails",
    notes: "Wild ancestor of llama; wide range from Andes to Patagonia; gregarious herds.",
    clustering: { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45, source: "SA camelid" },
    predator_prey: { predatorOf: [], preyOf: ["puma","andean_fox","condor"] },
    behavior_weights: {
      track_age_decay:       { weight: 1.0, same_band_threshold: 0.14, separate_band_threshold: 0.33, environmental_sensitivity: 0.70, tags: ["medium_decay"] },
      flight_or_forage:      { flight_weight: 0.52, forage_weight: 0.48, direction_change_threshold_deg: 40, spread_tightness_threshold_m: 40, stride_variance_threshold: 0.26, freshness_cluster_threshold: 0.65 },
      denning_behavior:      { den_types: ["open_ground","minimal_cover"], den_site_tags: ["open","semi_arid"], den_return_pattern_tags: ["revisit_loop"], den_radius_m: 18, return_radius_m: 55, bedding_spread_threshold_m: 14, freshness_cluster_threshold: 0.65, denning_weight: 0.50 },
      scent_marking_behavior:{ scent_marking_tags: ["dung_pile","urine_mark"], loopback_pattern_tags: ["circuit_route"], travel_context_tags: ["trail_edge_mark"], marking_radius_m: 8, revisit_radius_m: 25, route_reuse_threshold_m: 16, freshness_cluster_threshold: 0.65, scent_weight: 0.50 },
      movement_pattern:      { loopback_radius_m: 45, zigzag_direction_threshold_deg: 36, escape_line_direction_variance_threshold: 0.18, water_approach_radius_m: 52, trail_reuse_radius_m: 14, pattern_tags: ["group_linear","trail_reuse"] },
      terrain_intelligence:  { terrain_weight: 0.26, water_edge_weight: 0.14, cover_weight: 0.10, open_ground_weight: 0.32, elevation_weight: 0.18 },
    },
  },

};

let _profiles = null;
let _ready    = false;
let _source   = 'uninitialised';

const _grokAdapted = adaptProfiles(RAW_GROK);

const _bundled = { ..._grokAdapted };

export async function initProfiles() {
  if (_ready) return;

  try {
    const { getLatestProfiles } = await import('./snac_db.js');
    const dbResult = await getLatestProfiles();
    if (dbResult?.profiles && Object.keys(dbResult.profiles).length > 0) {
      _profiles = dbResult.profiles;
      _source   = 'db';
      _ready    = true;
      console.log(`[SNAC Profiles] Loaded from DB - ${Object.keys(_profiles).length} species (v${dbResult.meta?.versionLabel})`);
      return;
    }
  } catch (e) { /* silent */ }

  _profiles = _bundled;
  _source   = 'grok';
  _ready    = true;
  console.log(`[SNAC Profiles] Loaded bundled - ${Object.keys(_profiles).length} species`);
}

export async function loadProfilesFromDB() {
  _ready = false;
  await initProfiles();
}

export function getProfiles() {
  if (!_ready) return _bundled;
  return _profiles;
}

export function getProfile(speciesKey) {
  const profiles = getProfiles();
  if (!speciesKey) return null;
  const key = speciesKey.trim().toLowerCase().replace(/-/g, '_');
  return profiles[key] ?? null;
}

export function getProfilesStatus() {
  const profiles = getProfiles();
  return {
    ready:        _ready,
    source:       _source,
    speciesCount: Object.keys(profiles).length,
    grokCount:    Object.keys(_grokAdapted).length,
    mockCount:    0
  };
}