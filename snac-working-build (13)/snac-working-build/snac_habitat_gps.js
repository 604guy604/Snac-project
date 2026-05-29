/**
 * SNAC HABITAT GPS - Phase 3.10
 *
 * Scores habitat plausibility for a species given GPS coordinates.
 * Uses terrain-tag matching against a coarse biome grid derived from lat/lon.
 * Hard geographic bounding boxes applied for species with strict range limits.
 *
 * ALL 125 SPECIES COVERED:
 * - scored: true  → real plausibility 0.0-1.0, influences engine output
 * - scored: false → null pass-through, engine ignores entirely
 *
 * EXPORTS:
 *   scoreHabitatPlausibility(speciesKey, gpsCoords)
 *   getBiome(gpsCoords)
 */

// =============================================================================
// BIOME INFERENCE
// =============================================================================

const BIOME_GRID = [
  { latMin: 66,  latMax: 90,  lonMin: -180, lonMax: 180,  biome: 'tundra_arctic' },
  { latMin: 55,  latMax: 66,  lonMin: -168, lonMax: -50,  biome: 'boreal' },
  { latMin: 55,  latMax: 66,  lonMin: 20,   lonMax: 180,  biome: 'boreal' },
  { latMin: 45,  latMax: 60,  lonMin: -130, lonMax: -120, biome: 'temperate_rainforest' },
  { latMin: 35,  latMax: 55,  lonMin: -95,  lonMax: -50,  biome: 'temperate_broadleaf' },
  { latMin: 35,  latMax: 60,  lonMin: -125, lonMax: -100, biome: 'mountain_alpine' },
  { latMin: 30,  latMax: 55,  lonMin: -105, lonMax: -85,  biome: 'prairie_grassland' },
  { latMin: 20,  latMax: 37,  lonMin: -120, lonMax: -95,  biome: 'desert_arid' },
  { latMin: 25,  latMax: 37,  lonMin: -95,  lonMax: -75,  biome: 'subtropical' },
  { latMin: 45,  latMax: 60,  lonMin: -10,  lonMax: 20,   biome: 'temperate_broadleaf' },
  { latMin: 30,  latMax: 45,  lonMin: -10,  lonMax: 40,   biome: 'mediterranean' },
  { latMin: -35, latMax: 15,  lonMin: 10,   lonMax: 50,   biome: 'savanna' },
  { latMin: -10, latMax: 15,  lonMin: -80,  lonMax: -45,  biome: 'tropical_rainforest' },
  { latMin: -55, latMax: -30, lonMin: -75,  lonMax: -50,  biome: 'temperate_broadleaf' },
  { latMin: -20, latMax: -30, lonMin: -75,  lonMax: -45,  biome: 'tropical_dry' },
  { latMin: -45, latMax: -10, lonMin: 110,  lonMax: 155,  biome: 'australian' },
  { latMin: -10, latMax: 30,  lonMin: 95,   lonMax: 150,  biome: 'tropical_rainforest' },
  { latMin: 30,  latMax: 55,  lonMin: 75,   lonMax: 140,  biome: 'temperate_broadleaf' },
  { latMin: 15,  latMax: 30,  lonMin: -95,  lonMax: -75,  biome: 'tropical_dry' },
  { latMin: -35, latMax: -20, lonMin: 15,   lonMax: 35,   biome: 'savanna' },
];

function inferBiome(lat, lon) {
  for (const zone of BIOME_GRID) {
    if (lat >= zone.latMin && lat < zone.latMax &&
        lon >= zone.lonMin && lon < zone.lonMax) {
      return zone.biome;
    }
  }
  return 'unknown';
}

// =============================================================================
// TERRAIN -> BIOME COMPATIBILITY
// =============================================================================

const BIOME_TERRAIN_COMPAT = {
  tundra_arctic:        ['tundra','taiga','boreal forest','alpine','rocky','bog','arctic','boreal forests','alpine thickets'],
  boreal:               ['boreal forest','taiga','conifer forest','mixed forest','bog','swamp','alpine thickets','forest','boreal forests','spruce thickets'],
  temperate_rainforest: ['forest','coastal','mountain','conifer forest','mixed forest','wetland','mature_forest'],
  mountain_alpine:      ['mountain','alpine','rocky','conifer forest','forest','meadow','boreal forest','mountains','cliffs','alpine meadows','rocky hills','subalpine','rocky_slopes','high_alpine','rocky_cliffs','subalpine_meadow','high_andes','puna_grassland','alpine_meadow'],
  temperate_broadleaf:  ['forest','deciduous forest','mixed forest','field','swamp','wetland','farmland','woodland','urban','suburban','rural','meadow','forest_edge','fields','brushy fields','woodland edges','moorland','hedgerows','scrub','urban edge','mature_forest','mixed_forest','parkland','temperate_forest','woodland_edge','brushy edges'],
  prairie_grassland:    ['grassland','prairie','open plains','open_country','field','farmland','meadow','brushy fields','grasslands','brushy prairies','open fields','open_farmland'],
  desert_arid:          ['desert','arid','rocky','grassland','open plains','scrub','arid scrub','semi-arid areas','rocky hillsides','semi_arid','arid_scrub','spinifex_grassland','karoo','kalahari','mulga_woodland','monte_desert'],
  subtropical:          ['forest','swamp','wetland','field','farmland','suburban','urban','gallery_forest','scrub','mangrove','tropical_dry','dry_forest'],
  mediterranean:        ['forest','moorland','scrub','mountain','farmland','grassland','rocky','pasture','scrub_forest','heathland','coastal_heath'],
  savanna:              ['savanna','grassland','woodland','wetland','rocky','open_savanna','bushveld','open_woodland','floodplain','thornbush','semi_arid','riverine','cerrado','open_grassland','scrubland'],
  tropical_rainforest:  ['rainforest','wetland','forest','savanna','tropical_forest','gallery_forest','mangrove','flooded_forest','secondary_forest','wet_forest'],
  tropical_dry:         ['tropical_forest','dry_forest','scrub','savanna','grassland','gallery_forest','cerrado'],
  australian:           ['forest','grassland','rocky','desert','wetland','scrub','suburban_gardens','coastal_scrub','heathland','wandoo_woodland','eucalypt_forest','arid_scrub','spinifex_grassland','mulga_woodland','open_woodland','coastal_heath','open plains','arid scrub'],
  unknown:              [],
};

function scoreTerrainMatch(speciesTerrain, biome) {
  if (!speciesTerrain || !speciesTerrain.length) return 0.5;
  const compatTags = BIOME_TERRAIN_COMPAT[biome] ?? [];
  if (!compatTags.length) return 0.5;
  const matches = speciesTerrain.filter(t =>
    compatTags.some(c =>
      c.toLowerCase().includes(t.toLowerCase()) ||
      t.toLowerCase().includes(c.toLowerCase())
    )
  ).length;
  return Math.min(1.0, matches / speciesTerrain.length + (matches > 0 ? 0.15 : 0));
}

// =============================================================================
// SPECIES PROFILES - all 125
// =============================================================================

const PROFILES = {

  // NORTH AMERICAN DEER
  blacktail_deer:    { terrain: ['forest','mountain','coastal'], bounds: [{ latMin: 37, latMax: 60, lonMin: -140, lonMax: -115 }], boundsNote: 'Pacific coast endemic - SE Alaska to central California' },
  white_tailed_deer: { terrain: ['forest','swamp','field'], bounds: [{ latMin: 8, latMax: 60, lonMin: -140, lonMax: -55 }], boundsNote: 'Most of North and Central America' },
  mule_deer:         { terrain: ['mountains','forests','open fields'], bounds: [{ latMin: 23, latMax: 60, lonMin: -140, lonMax: -95 }], boundsNote: 'Western North America - Rockies and west' },
  elk:               { terrain: ['forest','meadow','mountain'], bounds: [{ latMin: 35, latMax: 60, lonMin: -140, lonMax: -95 },{ latMin: 40, latMax: 55, lonMin: -95, lonMax: -75 }], boundsNote: 'Western NA; reintroduced pockets in east' },
  moose:             { terrain: ['bog','tundra','boreal forest'], bounds: [{ latMin: 45, latMax: 70, lonMin: -168, lonMax: -55 },{ latMin: 50, latMax: 70, lonMin: 10, lonMax: 180 }], boundsNote: 'Boreal zone - North America and Eurasia' },
  caribou:           { terrain: ['tundra','taiga'], bounds: [{ latMin: 50, latMax: 85, lonMin: -168, lonMax: -55 },{ latMin: 55, latMax: 80, lonMin: 10, lonMax: 180 }], boundsNote: 'Tundra and boreal only - hard southern limit', hardSouthLimit: 48 },
  pronghorn:         { terrain: ['open plains','arid scrub'], bounds: [{ latMin: 28, latMax: 55, lonMin: -120, lonMax: -95 }], boundsNote: 'Great Plains and Great Basin only', hardExclude: [{ latMin: 45, latMax: 65, lonMin: -140, lonMax: -120 }] },
  bighorn_sheep:     { terrain: ['alpine','boreal forest','tundra'], bounds: [{ latMin: 30, latMax: 55, lonMin: -125, lonMax: -100 }], boundsNote: 'Rocky Mountain system and desert ranges - western NA' },
  mountain_goat:     { terrain: ['alpine','boreal forest','tundra'], bounds: [{ latMin: 45, latMax: 65, lonMin: -140, lonMax: -110 }], boundsNote: 'Pacific mountain ranges - coastal BC to Idaho panhandle' },

  // BEARS
  black_bear:   { terrain: ['forest','mountain','coastal'], bounds: [{ latMin: 25, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'Most forested regions of North America' },
  grizzly_bear: { terrain: ['forest','meadow','mountain'], bounds: [{ latMin: 44, latMax: 75, lonMin: -168, lonMax: -95 },{ latMin: 45, latMax: 75, lonMin: 20, lonMax: 180 }], boundsNote: 'Western NA north of ~44N; Eurasia brown bear range', hardSouthLimit: 43 },

  // NORTH AMERICAN PREDATORS
  mountain_lion:  { terrain: ['conifer forest','mixed forest','rocky'], bounds: [{ latMin: -55, latMax: 60, lonMin: -140, lonMax: -55 }], boundsNote: 'Western hemisphere - Yukon to Patagonia' },
  gray_wolf:      { terrain: ['taiga','tundra','forest'], bounds: [{ latMin: 40, latMax: 80, lonMin: -168, lonMax: -55 },{ latMin: 35, latMax: 75, lonMin: -10, lonMax: 180 }], boundsNote: 'Northern hemisphere - recovered in many former ranges' },
  coyote:         { terrain: ['grassland','forest_edge','urban'], bounds: [{ latMin: 7, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'All of North America - highly adaptable generalist' },
  bobcat:         { terrain: ['conifer forest','mixed forest','boreal'], bounds: [{ latMin: 15, latMax: 55, lonMin: -130, lonMax: -60 }], boundsNote: 'Southern Canada through Mexico', hardNorthLimit: 56 },
  wolverine:      { terrain: ['alpine','boreal forest','tundra'], bounds: [{ latMin: 38, latMax: 75, lonMin: -168, lonMax: -55 },{ latMin: 50, latMax: 75, lonMin: 10, lonMax: 180 }], boundsNote: 'Boreal and alpine - rare south of 45N', hardSouthLimit: 36 },
  fisher:         { terrain: ['mixed_forest','conifer_forest','boreal'], bounds: [{ latMin: 38, latMax: 65, lonMin: -140, lonMax: -60 }], boundsNote: 'Dense boreal and montane forest NA', hardSouthLimit: 35 },
  red_fox:        { terrain: ['forest','fields','urban'], bounds: [{ latMin: 20, latMax: 80, lonMin: -168, lonMax: -55 },{ latMin: 20, latMax: 75, lonMin: -15, lonMax: 180 },{ latMin: -40, latMax: -25, lonMin: 140, lonMax: 155 }], boundsNote: 'Global - widest range of any wild carnivore' },
  american_marten:{ terrain: ['conifer forest','mixed forest','boreal'], bounds: [{ latMin: 38, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'Boreal and montane conifer forest NA', hardSouthLimit: 35 },
  american_badger:{ terrain: ['grassland','prairie','desert','open_country'], bounds: [{ latMin: 22, latMax: 58, lonMin: -130, lonMax: -80 }], boundsNote: 'Open grassland and prairie - western NA', hardExclude: [{ latMin: 45, latMax: 65, lonMin: -140, lonMax: -120 }] },
  river_otter:    { terrain: ['rivers','lakes','wetlands'], bounds: [{ latMin: 25, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'Most of North America near clean waterways', requiresWater: true },
  mink:           { terrain: ['streams','wetlands','marshes'], bounds: [{ latMin: 25, latMax: 70, lonMin: -168, lonMax: -55 },{ latMin: 45, latMax: 70, lonMin: -10, lonMax: 60 }], boundsNote: 'Riparian obligate - NA and feral in Europe', requiresWater: true },

  // UPLAND & SMALL GAME
  wild_turkey:         { terrain: ['deciduous forest','brushy edges'], bounds: [{ latMin: 18, latMax: 50, lonMin: -125, lonMax: -65 }], boundsNote: 'North America - reintroduced across former range', hardNorthLimit: 52 },
  ruffed_grouse:       { terrain: ['deciduous forest','brushy edges'], bounds: [{ latMin: 38, latMax: 68, lonMin: -140, lonMax: -55 }], boundsNote: 'Boreal and mixed forest North America', hardSouthLimit: 35 },
  spruce_grouse:       { terrain: ['boreal forest','spruce thickets'], bounds: [{ latMin: 45, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'Boreal spruce-fir belt North America', hardSouthLimit: 43 },
  sharp_tailed_grouse: { terrain: ['grasslands','brushy prairies'], bounds: [{ latMin: 40, latMax: 65, lonMin: -130, lonMax: -75 }], boundsNote: 'Prairie and parkland - central NA grassland', hardExclude: [{ latMin: 45, latMax: 65, lonMin: -140, lonMax: -120 }] },
  chukar_partridge:    { terrain: ['rocky hillsides','semi-arid areas'], bounds: [{ latMin: 28, latMax: 48, lonMin: -120, lonMax: -110 },{ latMin: 25, latMax: 50, lonMin: 25, lonMax: 90 }], boundsNote: 'Native SW Asia; introduced western NA - rocky arid slopes' },
  snowshoe_hare:       { terrain: ['boreal forests','swamps','alpine thickets'], bounds: [{ latMin: 40, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'Boreal North America - follows spruce-fir belt', hardSouthLimit: 37 },
  eastern_cottontail:  { terrain: ['meadows','brushy fields','woodland edges'], bounds: [{ latMin: 8, latMax: 50, lonMin: -110, lonMax: -60 }], boundsNote: 'Eastern and central North America', hardNorthLimit: 52 },

  // SEMI-AQUATIC
  beaver:  { terrain: ['marshes','ponds','streams','wetlands'], bounds: [{ latMin: 25, latMax: 70, lonMin: -168, lonMax: -55 },{ latMin: 45, latMax: 70, lonMin: 10, lonMax: 130 }], boundsNote: 'Any freshwater habitat in temperate/boreal zones', requiresWater: true },
  muskrat: { terrain: ['marshes','ponds','streams','wetlands'], bounds: [{ latMin: 25, latMax: 70, lonMin: -168, lonMax: -55 },{ latMin: 45, latMax: 65, lonMin: 10, lonMax: 130 }], boundsNote: 'Any freshwater marsh or slow water', requiresWater: true },

  // FURBEARERS
  raccoon:          { terrain: ['forest','urban','wetland'], bounds: [{ latMin: 8, latMax: 60, lonMin: -140, lonMax: -55 },{ latMin: 45, latMax: 60, lonMin: 5, lonMax: 40 },{ latMin: 30, latMax: 45, lonMin: 125, lonMax: 145 }], boundsNote: 'North America; introduced Europe and Japan' },
  striped_skunk:    { terrain: ['grassland','forest_edge','urban'], bounds: [{ latMin: 15, latMax: 58, lonMin: -130, lonMax: -60 }], boundsNote: 'North America - southern Canada through northern Mexico', hardNorthLimit: 60 },
  porcupine:        { terrain: ['conifer forest','mixed forest','rocky'], bounds: [{ latMin: 30, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'Most of forested North America', hardSouthLimit: 28 },
  virginia_opossum: { terrain: ['forest','urban','wetland'], bounds: [{ latMin: 8, latMax: 52, lonMin: -125, lonMax: -60 }], boundsNote: 'Eastern and central NA; expanding north', hardNorthLimit: 54 },
  groundhog:        { terrain: ['meadow','forest_edge','farmland'], bounds: [{ latMin: 35, latMax: 60, lonMin: -100, lonMax: -60 }], boundsNote: 'Eastern North America - forest edge and farmland', hardNorthLimit: 62, hardSouthLimit: 33 },
  gray_squirrel:    { terrain: ['deciduous forest','urban parks','suburban'], bounds: [{ latMin: 25, latMax: 50, lonMin: -100, lonMax: -60 },{ latMin: 45, latMax: 60, lonMin: -5, lonMax: 10 }], boundsNote: 'Eastern NA; invasive UK and Italy', hardNorthLimit: 52 },
  red_squirrel:     { terrain: ['boreal forest','conifer forest','mixed forest'], bounds: [{ latMin: 38, latMax: 70, lonMin: -168, lonMax: -55 }], boundsNote: 'Boreal and montane conifer forest NA', hardSouthLimit: 35 },

  // EUROPEAN SPECIES
  european_badger:  { terrain: ['woodland','farmland','urban edge'], bounds: [{ latMin: 35, latMax: 65, lonMin: -10, lonMax: 60 }], boundsNote: 'Europe and western Asia' },
  red_deer:         { terrain: ['forest','moorland','mountain'], bounds: [{ latMin: 35, latMax: 65, lonMin: -10, lonMax: 60 },{ latMin: 30, latMax: 55, lonMin: 60, lonMax: 130 }], boundsNote: 'Europe, western Asia; introduced worldwide' },
  roe_deer:         { terrain: ['forest','farmland','scrub','wetland'], bounds: [{ latMin: 35, latMax: 65, lonMin: -10, lonMax: 130 }], boundsNote: 'Europe and temperate Asia' },
  wild_boar:        { terrain: ['forest','farmland','scrub','wetland'], bounds: [{ latMin: 30, latMax: 65, lonMin: -10, lonMax: 150 },{ latMin: -35, latMax: 5, lonMin: 10, lonMax: 50 }], boundsNote: 'Europe, Asia, N Africa; feral worldwide' },
  pine_marten:      { terrain: ['mature_forest','mixed_forest','woodland'], bounds: [{ latMin: 40, latMax: 70, lonMin: -10, lonMax: 130 }], boundsNote: 'Mature forest across Europe and temperate Asia' },
  stoat:            { terrain: ['grassland','woodland','farmland','arctic'], bounds: [{ latMin: 35, latMax: 80, lonMin: -168, lonMax: 180 }], boundsNote: 'Holarctic - widespread across northern hemisphere' },
  weasel:           { terrain: ['grassland','farmland','woodland'], bounds: [{ latMin: 30, latMax: 75, lonMin: -10, lonMax: 180 },{ latMin: 35, latMax: 60, lonMin: -130, lonMax: -55 }], boundsNote: 'Widespread across Eurasia and North America' },
  european_polecat: { terrain: ['woodland','farmland','wetland'], bounds: [{ latMin: 35, latMax: 60, lonMin: -10, lonMax: 60 }], boundsNote: 'Western and central Europe' },
  european_beaver:  { terrain: ['rivers','streams','wetlands'], bounds: [{ latMin: 40, latMax: 70, lonMin: -10, lonMax: 130 }], boundsNote: 'Reintroduced across much of Europe and western Russia', requiresWater: true },
  european_otter:   { terrain: ['rivers','lakes','coastal','wetlands'], bounds: [{ latMin: 35, latMax: 70, lonMin: -10, lonMax: 130 },{ latMin: -35, latMax: 10, lonMin: 10, lonMax: 50 }], boundsNote: 'Europe, Asia and Africa - any clean waterway', requiresWater: true },
  european_hare:    { terrain: ['open_farmland','grassland','meadow'], bounds: [{ latMin: 35, latMax: 65, lonMin: -10, lonMax: 60 }], boundsNote: 'Open farmland across Europe and western Asia' },
  european_rabbit:  { terrain: ['grassland','farmland','scrub','dunes'], bounds: [{ latMin: 30, latMax: 60, lonMin: -10, lonMax: 20 },{ latMin: -45, latMax: -10, lonMin: 110, lonMax: 155 }], boundsNote: 'Native Iberia; introduced Europe, Australia, NZ' },
  chamois:          { terrain: ['alpine','subalpine','rocky_slopes'], bounds: [{ latMin: 40, latMax: 55, lonMin: 5, lonMax: 45 }], boundsNote: 'Alpine and subalpine - European mountain ranges' },
  alpine_ibex:      { terrain: ['high_alpine','rocky_cliffs','subalpine_meadow'], bounds: [{ latMin: 43, latMax: 48, lonMin: 5, lonMax: 15 }], boundsNote: 'Alps only - strict alpine specialist', hardSouthLimit: 43, hardNorthLimit: 48 },
  mouflon:          { terrain: ['rocky_hills','scrub_forest','mountain'], bounds: [{ latMin: 35, latMax: 45, lonMin: 20, lonMax: 50 },{ latMin: 40, latMax: 60, lonMin: 5, lonMax: 30 }], boundsNote: 'Native Cyprus/Sardinia; introduced across Europe' },
  hedgehog:         { terrain: ['gardens','hedgerows','woodland_edge','farmland'], bounds: [{ latMin: 35, latMax: 65, lonMin: -10, lonMax: 60 },{ latMin: -45, latMax: -35, lonMin: 165, lonMax: 180 }], boundsNote: 'Europe and western Asia; introduced NZ' },
  sika_deer:        { terrain: ['forest','woodland','coastal_grassland'], bounds: [{ latMin: 30, latMax: 55, lonMin: 120, lonMax: 145 },{ latMin: 45, latMax: 60, lonMin: -10, lonMax: 10 }], boundsNote: 'Native East Asia; introduced Ireland, UK, Europe' },
  fallow_deer:      { terrain: ['parkland','mixed_forest','farmland'], bounds: [{ latMin: 30, latMax: 60, lonMin: -10, lonMax: 40 },{ latMin: -45, latMax: -10, lonMin: 110, lonMax: 155 }], boundsNote: 'Native Mediterranean; introduced worldwide' },
  ferret:           { terrain: ['farmland','grassland','scrub','urban_edge'], bounds: [{ latMin: 35, latMax: 65, lonMin: -10, lonMax: 30 },{ latMin: -46, latMax: -35, lonMin: 165, lonMax: 178 }], boundsNote: 'Domesticated worldwide; feral in NZ' },

  // AFRICAN SPECIES
  lion:           { terrain: ['savanna','grassland','woodland'], bounds: [{ latMin: -35, latMax: 15, lonMin: 10, lonMax: 50 },{ latMin: 20, latMax: 30, lonMin: 65, lonMax: 75 }], boundsNote: 'Sub-Saharan Africa; tiny remnant Gir Forest India' },
  leopard:        { terrain: ['savanna','forest','rocky_hills','riverine'], bounds: [{ latMin: -35, latMax: 35, lonMin: 10, lonMax: 50 },{ latMin: 15, latMax: 45, lonMin: 50, lonMax: 135 }], boundsNote: 'Sub-Saharan Africa and South/SE Asia' },
  cheetah:        { terrain: ['open_savanna','grassland','semi_arid'], bounds: [{ latMin: -30, latMax: 20, lonMin: 10, lonMax: 50 }], boundsNote: 'Sub-Saharan Africa; tiny remnant in Iran', hardNorthLimit: 22 },
  spotted_hyena:  { terrain: ['savanna','grassland','woodland','semi_arid'], bounds: [{ latMin: -35, latMax: 20, lonMin: 10, lonMax: 50 }], boundsNote: 'Sub-Saharan Africa' },
  african_elephant:{ terrain: ['savanna','forest','wetland','bushveld'], bounds: [{ latMin: -35, latMax: 15, lonMin: 10, lonMax: 50 }], boundsNote: 'Sub-Saharan Africa' },
  plains_zebra:   { terrain: ['savanna','grassland','open_woodland'], bounds: [{ latMin: -30, latMax: 15, lonMin: 20, lonMax: 45 }], boundsNote: 'East and southern Africa - grassland and open savanna' },
  african_buffalo:{ terrain: ['savanna','woodland','wetland','montane'], bounds: [{ latMin: -35, latMax: 15, lonMin: 10, lonMax: 50 }], boundsNote: 'Sub-Saharan Africa - follows water and grass' },
  impala:         { terrain: ['savanna','open_woodland','riverine'], bounds: [{ latMin: -30, latMax: 5, lonMin: 25, lonMax: 45 }], boundsNote: 'East and southern Africa - woodland/grassland ecotone' },
  greater_kudu:   { terrain: ['savanna_woodland','rocky_hills','riverine_bush'], bounds: [{ latMin: -35, latMax: 10, lonMin: 20, lonMax: 45 }], boundsNote: 'Eastern and southern Africa - dense bush' },
  blue_wildebeest:{ terrain: ['open_savanna','grassland','floodplain'], bounds: [{ latMin: -30, latMax: 5, lonMin: 25, lonMax: 45 }], boundsNote: 'East and southern Africa - open grassland' },
  springbok:      { terrain: ['semi_arid','grassland','karoo'], bounds: [{ latMin: -35, latMax: -15, lonMin: 15, lonMax: 35 }], boundsNote: 'Southern Africa - Karoo and semi-arid grassland' },
  warthog:        { terrain: ['savanna','open_woodland','grassland'], bounds: [{ latMin: -30, latMax: 15, lonMin: 10, lonMax: 50 }], boundsNote: 'Sub-Saharan Africa - open savanna and woodland' },
  baboon:         { terrain: ['savanna','woodland','rocky_hills','farmland'], bounds: [{ latMin: -35, latMax: 15, lonMin: 10, lonMax: 50 },{ latMin: 10, latMax: 30, lonMin: 35, lonMax: 50 }], boundsNote: 'Africa and Arabian Peninsula' },
  meerkat:        { terrain: ['semi_arid','kalahari','scrubland'], bounds: [{ latMin: -30, latMax: -18, lonMin: 18, lonMax: 28 }], boundsNote: 'Kalahari Basin only - Botswana, Namibia, South Africa' },
  genet:          { terrain: ['savanna','woodland','rocky_hills','urban_fringe'], bounds: [{ latMin: -35, latMax: 15, lonMin: 10, lonMax: 50 },{ latMin: 35, latMax: 45, lonMin: -10, lonMax: 10 }], boundsNote: 'Sub-Saharan Africa; introduced southern Europe' },
  slender_mongoose:{ terrain: ['savanna','woodland','rocky_areas'], bounds: [{ latMin: -30, latMax: 15, lonMin: 10, lonMax: 45 }], boundsNote: 'Sub-Saharan Africa' },
  african_civet:  { terrain: ['savanna','woodland','bushveld'], bounds: [{ latMin: -30, latMax: 15, lonMin: 10, lonMax: 50 }], boundsNote: 'Sub-Saharan Africa - forest edges and dense bush' },
  black_rhino:    { terrain: ['thornbush','woodland','semi_arid'], bounds: [{ latMin: -30, latMax: 5, lonMin: 20, lonMax: 45 }], boundsNote: 'Eastern and southern Africa - critically endangered' },
  giraffe:        { terrain: ['savanna','open_woodland','thornbush'], bounds: [{ latMin: -30, latMax: 15, lonMin: 10, lonMax: 45 }], boundsNote: 'Sub-Saharan Africa - acacia savanna' },
  nyala:          { terrain: ['dense_bushveld','riverine_thicket','woodland'], bounds: [{ latMin: -30, latMax: -10, lonMin: 28, lonMax: 38 }], boundsNote: 'Southern Africa - dense lowland bush near water', hardNorthLimit: -10 },
  eland:          { terrain: ['open_savanna','woodland','semi_arid'], bounds: [{ latMin: -35, latMax: 10, lonMin: 15, lonMax: 45 }], boundsNote: 'Sub-Saharan Africa - widest antelope range' },
  aardvark:       { terrain: ['savanna','woodland','bushveld','semi_arid'], bounds: [{ latMin: -35, latMax: 15, lonMin: 10, lonMax: 50 }], boundsNote: 'Sub-Saharan Africa - requires termites and soft soil' },
  ground_pangolin:{ terrain: ['savanna','woodland','bushveld'], bounds: [{ latMin: -30, latMax: 10, lonMin: 15, lonMax: 45 }], boundsNote: 'Sub-Saharan Africa' },

  // AUSTRALIAN SPECIES
  red_kangaroo:           { terrain: ['open plains','arid scrub'], bounds: [{ latMin: -35, latMax: -15, lonMin: 115, lonMax: 150 }], boundsNote: 'Arid and semi-arid interior Australia' },
  grey_kangaroo:          { terrain: ['open_woodland','grassland','suburban'], bounds: [{ latMin: -40, latMax: -15, lonMin: 115, lonMax: 155 }], boundsNote: 'Eastern and western Australia' },
  wallaby:                { terrain: ['forest_edge','scrub','coastal_heath'], bounds: [{ latMin: -45, latMax: -10, lonMin: 110, lonMax: 155 },{ latMin: -46, latMax: -35, lonMin: 165, lonMax: 178 }], boundsNote: 'Australia and New Zealand (introduced)' },
  common_wombat:          { terrain: ['forest','heathland','grassland'], bounds: [{ latMin: -40, latMax: -25, lonMin: 140, lonMax: 155 }], boundsNote: 'South-eastern Australia including Tasmania' },
  common_brushtail_possum:{ terrain: ['forest','urban','suburban'], bounds: [{ latMin: -45, latMax: -10, lonMin: 110, lonMax: 155 },{ latMin: -46, latMax: -35, lonMin: 165, lonMax: 178 }], boundsNote: 'Australia and New Zealand (invasive)' },
  short_beaked_echidna:   { terrain: ['forest','heathland','grassland','arid_scrub'], bounds: [{ latMin: -45, latMax: -10, lonMin: 110, lonMax: 155 }], boundsNote: 'All of Australia and New Guinea' },
  eastern_quoll:          { terrain: ['forest','heathland','grassland'], bounds: [{ latMin: -44, latMax: -40, lonMin: 144, lonMax: 148 }], boundsNote: 'Tasmania only - extinct mainland Australia' },
  ringtail_possum:        { terrain: ['wet_forest','rainforest','rocky_areas'], bounds: [{ latMin: -40, latMax: -10, lonMin: 140, lonMax: 155 }], boundsNote: 'Eastern Australia - wet forest and urban' },
  platypus:               { terrain: ['freshwater_streams','rivers','lakes'], bounds: [{ latMin: -44, latMax: -15, lonMin: 140, lonMax: 155 }], boundsNote: 'Eastern Australia and Tasmania - freshwater only', requiresWater: true },
  bilby:                  { terrain: ['arid_scrub','spinifex_grassland','mulga_woodland'], bounds: [{ latMin: -30, latMax: -18, lonMin: 120, lonMax: 145 }], boundsNote: 'Arid interior Australia - critically reduced range' },
  bandicoot:              { terrain: ['forest','heathland','suburban_gardens'], bounds: [{ latMin: -45, latMax: -10, lonMin: 110, lonMax: 155 }], boundsNote: 'Australia - various species across continent' },
  numbat:                 { terrain: ['wandoo_woodland','eucalypt_forest','semi_arid_scrub'], bounds: [{ latMin: -35, latMax: -28, lonMin: 116, lonMax: 122 }], boundsNote: 'SW Western Australia only - critically endangered' },
  bettong:                { terrain: ['grassland','open_woodland','suburban'], bounds: [{ latMin: -35, latMax: -25, lonMin: 115, lonMax: 140 }], boundsNote: 'Southern Australia - highly reduced range' },
  kiwi:                   { terrain: ['forest','suburban_gardens','coastal_scrub'], bounds: [{ latMin: -47, latMax: -34, lonMin: 166, lonMax: 178 }], boundsNote: 'New Zealand only' },
  dingo:                  { terrain: ['desert','savanna','forest'], bounds: [{ latMin: -38, latMax: -14, lonMin: 113, lonMax: 154 }], boundsNote: 'Australian mainland - absent Tasmania' },

  // SOUTH AMERICAN SPECIES
  puma:              { terrain: ['mountain','forest','desert','grassland'], bounds: [{ latMin: -55, latMax: 60, lonMin: -140, lonMax: -55 }], boundsNote: 'Western hemisphere - same species as mountain lion' },
  jaguar:            { terrain: ['rainforest','wetland','savanna'], bounds: [{ latMin: -30, latMax: 30, lonMin: -120, lonMax: -45 }], boundsNote: 'Central and South America; remnant SW USA', hardNorthLimit: 33 },
  ocelot:            { terrain: ['tropical_forest','scrub','mangrove'], bounds: [{ latMin: -30, latMax: 30, lonMin: -115, lonMax: -45 }], boundsNote: 'Central and South America; small Texas population', hardNorthLimit: 32 },
  tapir:             { terrain: ['tropical_forest','wetland','gallery_forest'], bounds: [{ latMin: -25, latMax: 20, lonMin: -85, lonMax: -45 }], boundsNote: 'Central and South America - lowland tropical forest', hardNorthLimit: 22 },
  capybara:          { terrain: ['riverbank','wetland','flooded_grassland'], bounds: [{ latMin: -35, latMax: 12, lonMin: -80, lonMax: -45 }], boundsNote: 'South America - always near water', requiresWater: true },
  collared_peccary:  { terrain: ['desert','scrub','tropical_forest','grassland'], bounds: [{ latMin: -35, latMax: 35, lonMin: -120, lonMax: -45 }], boundsNote: 'SW USA through South America' },
  white_lipped_peccary:{ terrain: ['tropical_forest','gallery_forest','flooded_forest'], bounds: [{ latMin: -25, latMax: 18, lonMin: -85, lonMax: -45 }], boundsNote: 'Lowland tropical forest - Central and South America', hardNorthLimit: 20 },
  giant_anteater:    { terrain: ['grassland','savanna','tropical_forest'], bounds: [{ latMin: -35, latMax: 15, lonMin: -80, lonMax: -45 }], boundsNote: 'South America - cerrado, grassland and forest edge' },
  tamandua:          { terrain: ['tropical_forest','gallery_forest','mangrove'], bounds: [{ latMin: -30, latMax: 18, lonMin: -85, lonMax: -45 }], boundsNote: 'Central and South America' },
  nine_banded_armadillo:{ terrain: ['forest','grassland','scrub','suburban'], bounds: [{ latMin: -40, latMax: 40, lonMin: -100, lonMax: -45 }], boundsNote: 'Southern USA through South America - expanding north' },
  giant_armadillo:   { terrain: ['tropical_forest','cerrado','gallery_forest'], bounds: [{ latMin: -25, latMax: 10, lonMin: -80, lonMax: -45 }], boundsNote: 'South America - Amazon basin and cerrado', hardNorthLimit: 12 },
  howler_monkey:     { terrain: ['tropical_forest','gallery_forest','mangrove'], bounds: [{ latMin: -25, latMax: 20, lonMin: -90, lonMax: -45 }], boundsNote: 'Central and South America - arboreal forest' },
  capuchin_monkey:   { terrain: ['tropical_forest','secondary_forest','gallery_forest'], bounds: [{ latMin: -25, latMax: 20, lonMin: -90, lonMax: -35 }], boundsNote: 'Central and South America' },
  coatimundi:        { terrain: ['tropical_forest','dry_forest','scrub'], bounds: [{ latMin: -30, latMax: 35, lonMin: -115, lonMax: -45 }], boundsNote: 'SW USA through South America' },
  mara:              { terrain: ['open_grassland','scrubland','monte_desert'], bounds: [{ latMin: -52, latMax: -28, lonMin: -72, lonMax: -55 }], boundsNote: 'Patagonia and pampas - Argentina only' },
  vicuna:            { terrain: ['high_andes','puna_grassland','alpine_meadow'], bounds: [{ latMin: -32, latMax: -8, lonMin: -75, lonMax: -60 }], boundsNote: 'High Andes 3500-5500m - Peru, Bolivia, Chile, Argentina', hardSouthLimit: -32 },
  guanaco:           { terrain: ['patagonian_steppe','andes','desert','coastal'], bounds: [{ latMin: -55, latMax: -8, lonMin: -75, lonMax: -55 }], boundsNote: 'South America - Andes and Patagonia' },

  // DOMESTICS / FERAL (global)
  domestic_dog: { terrain: ['urban','suburban','rural'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - all inhabited continents' },
  domestic_cat: { terrain: ['urban','suburban','rural'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - all inhabited continents' },
  horse:        { terrain: ['pasture','grassland','trail'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - domesticated; feral on every continent' },
  cattle:       { terrain: ['pasture','rangeland','farmland'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - domesticated on all inhabited continents' },
  goat:         { terrain: ['rocky','pasture','scrub'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - domesticated and feral worldwide' },
  sheep:        { terrain: ['pasture','grassland','hills'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - domesticated and feral worldwide' },
  pig:          { terrain: ['farmland','forest_edge','wetland'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - domesticated on all inhabited continents' },
  donkey:       { terrain: ['arid','rocky','pasture'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - domesticated; feral in arid regions' },
  feral_pig:    { terrain: ['forest','farmland','scrub','wetland'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global invasive - every inhabited continent' },
  feral_goat:   { terrain: ['rocky','pasture','scrub'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global invasive - islands and remote ranges worldwide' },

  // COMMENSAL RODENTS
  ship_rat:   { terrain: ['urban','forest','coastal','island'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global invasive - all inhabited coasts and islands' },
  norway_rat: { terrain: ['urban','farmland','riverbank','sewer'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - all inhabited continents' },
  house_mouse:{ terrain: ['urban','farmland','grassland','island'], bounds: [{ latMin: -90, latMax: 90, lonMin: -180, lonMax: 180 }], boundsNote: 'Global - all inhabited continents' },

};

// =============================================================================
// SCORING ENGINE
// =============================================================================

function isInBounds(lat, lon, bounds) {
  return bounds.some(b =>
    lat >= b.latMin && lat < b.latMax &&
    lon >= b.lonMin && lon < b.lonMax
  );
}

function scoreProfile(profile, lat, lon) {
  const biome = inferBiome(lat, lon);

  if (profile.hardExclude && isInBounds(lat, lon, profile.hardExclude)) {
    return { plausibility: 0.05, biome_inferred: biome, range_note: profile.boundsNote + ' — outside known range', confidence: 'high', scored: true };
  }
  if (profile.hardSouthLimit && lat < profile.hardSouthLimit) {
    return { plausibility: 0.05, biome_inferred: biome, range_note: `${profile.boundsNote} — south of range limit (${profile.hardSouthLimit}N)`, confidence: 'high', scored: true };
  }
  if (profile.hardNorthLimit && lat > profile.hardNorthLimit) {
    return { plausibility: 0.05, biome_inferred: biome, range_note: `${profile.boundsNote} — north of range limit (${profile.hardNorthLimit}N)`, confidence: 'high', scored: true };
  }

  const inRange      = isInBounds(lat, lon, profile.bounds);
  const terrainScore = scoreTerrainMatch(profile.terrain, biome);

  let plausibility;
  if (inRange && terrainScore >= 0.5)       plausibility = 0.6 + (terrainScore * 0.4);
  else if (inRange && terrainScore < 0.5)   plausibility = 0.35 + (terrainScore * 0.3);
  else if (!inRange && terrainScore >= 0.6) plausibility = 0.25;
  else                                       plausibility = 0.05 + (terrainScore * 0.15);

  if (profile.requiresWater && biome === 'desert_arid') plausibility *= 0.4;

  return {
    plausibility:   parseFloat(Math.min(1.0, Math.max(0, plausibility)).toFixed(3)),
    biome_inferred: biome,
    range_note:     profile.boundsNote,
    confidence:     inRange ? 'medium' : 'low',
    scored:         true,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export function scoreHabitatPlausibility(speciesKey, gpsCoords) {
  if (!gpsCoords || gpsCoords.lat == null || gpsCoords.lon == null) {
    return { plausibility: null, biome_inferred: null, range_note: null, confidence: null, scored: false };
  }
  const { lat, lon } = gpsCoords;
  const key     = speciesKey?.toLowerCase()?.trim();
  const profile = key ? PROFILES[key] : null;

  if (profile) return scoreProfile(profile, lat, lon);

  return { plausibility: null, biome_inferred: inferBiome(lat, lon), range_note: 'Unknown species key', confidence: null, scored: false };
}

export function getBiome(gpsCoords) {
  if (!gpsCoords?.lat || !gpsCoords?.lon) return null;
  return inferBiome(gpsCoords.lat, gpsCoords.lon);
}
