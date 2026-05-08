const PACK_SPECIES = new Set([
  'gray_wolf', 'coyote', 'red_fox', 'swift_fox', 'kit_fox', 'domestic_dog',
  'dingo', 'lion', 'spotted_hyena', 'baboon', 'meerkat',
  'capuchin_monkey', 'howler_monkey'
]);

const HERD_SPECIES = new Set([
  'blacktail_deer', 'white_tailed_deer', 'mule_deer', 'elk', 'moose',
  'caribou', 'pronghorn', 'mountain_goat', 'bighorn_sheep',
  'cattle', 'cow', 'horse', 'sheep', 'goat', 'donkey',
  'pig', 'feral_hog', 'boar',
  'wild_turkey', 'sharp_tailed_grouse', 'chukar_partridge',
  'columbian_black_tailed_deer', 'sitka_deer',
  'red_deer', 'roe_deer', 'wild_boar', 'chamois', 'alpine_ibex', 'mouflon',
  'european_hare', 'european_rabbit',
  'red_kangaroo', 'grey_kangaroo', 'wallaby', 'feral_goat', 'feral_pig',
  'sika_deer', 'fallow_deer',
  'african_elephant', 'white_rhino', 'plains_zebra',
  'african_buffalo', 'impala', 'greater_kudu', 'eland', 'nyala',
  'blue_wildebeest', 'springbok', 'warthog', 'giraffe',
  'capybara', 'collared_peccary', 'white_lipped_peccary'
]);

const SMALL_GROUP_SPECIES = new Set([
  'snowshoe_hare', 'eastern_cottontail',
  'gray_squirrel', 'red_squirrel',
  'ruffed_grouse', 'spruce_grouse',
  'nutria', 'columbian_ground_squirrel', 'california_ground_squirrel',
  'eastern_chipmunk', 'townsend_chipmunk', 'american_pika',
  'meadow_vole', 'creeping_vole', 'deer_mouse', 'house_mouse',
  'ship_rat', 'norway_rat',
  'bandicoot', 'bettong'
]);

function _socialType(key) {
  if (PACK_SPECIES.has(key))        return 'pack';
  if (HERD_SPECIES.has(key))        return 'herd';
  if (SMALL_GROUP_SPECIES.has(key)) return 'small_group';
  return 'solitary';
}

const _RAW = {

  blacktail_deer:      { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45,  source: 'Elbroch + coastal BC spacing' },
  white_tailed_deer:   { eps_m: 40.0, stride_multiplier: 2.2, min_pts: 5, typical_group_radius_m: 55,  source: 'Movebank + Elbroch herd beds' },
  mule_deer:           { eps_m: 38.0, stride_multiplier: 2.2, min_pts: 5, typical_group_radius_m: 50,  source: 'Elbroch bounding' },
  elk:                 { eps_m: 45.0, stride_multiplier: 2.4, min_pts: 5, typical_group_radius_m: 65,  source: 'Movebank migration clusters' },
  moose:               { eps_m: 55.0, stride_multiplier: 2.5, min_pts: 4, typical_group_radius_m: 70,  source: 'Elbroch large solitary/group' },
  caribou:             { eps_m: 50.0, stride_multiplier: 2.4, min_pts: 5, typical_group_radius_m: 80,  source: 'Movebank long migrations' },
  pronghorn:           { eps_m: 40.0, stride_multiplier: 2.2, min_pts: 4, typical_group_radius_m: 50,  source: 'Open plains herd' },
  mountain_goat:       { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 22,  source: 'Alpine tight groups' },
  bighorn_sheep:       { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'Rocky herd spacing' },

  coyote:              { eps_m: 22.5, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'Movebank + Elbroch' },
  gray_wolf:           { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45,  source: 'Movebank pack data' },
  red_fox:             { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 20,  source: 'Elbroch trot patterns' },
  swift_fox:           { eps_m: 14.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 16,  source: 'Arid small canid' },
  kit_fox:             { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18,  source: 'Desert fox' },

  cougar:              { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35,  source: 'Elbroch solitary' },
  mountain_lion:       { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35,  source: 'Same as cougar' },
  bobcat:              { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18,  source: 'OpenAnimalTracks + Elbroch' },
  canada_lynx:         { eps_m: 25.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 30,  source: 'Elbroch snow travel' },

  grizzly_bear:        { eps_m: 38.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 48,  source: 'Movebank' },
  black_bear:          { eps_m: 32.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 40,  source: 'Movebank' },

  river_otter:         { eps_m: 14.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18,  source: 'Elbroch slide' },
  mink:                { eps_m: 9.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 11,  source: 'Elbroch' },
  fisher:              { eps_m: 16.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 20,  source: 'Elbroch' },
  american_marten:     { eps_m: 13.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 16,  source: 'Elbroch' },
  wolverine:           { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35,  source: 'Movebank' },
  american_badger:     { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 25,  source: 'Burrow clusters' },
  black_footed_ferret: { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Prairie burrow' },

  raccoon:             { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 4, typical_group_radius_m: 15,  source: 'Elbroch' },
  striped_skunk:       { eps_m: 10.5, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'OpenAnimalTracks' },
  virginia_opossum:    { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Elbroch' },
  porcupine:           { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'Elbroch' },
  muskrat:             { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 12,  source: 'Elbroch' },
  snowshoe_hare:       { eps_m: 8.0,  stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 10,  source: 'Elbroch bounding' },
  eastern_cottontail:  { eps_m: 7.5,  stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 9,   source: 'Elbroch' },
  gray_squirrel:       { eps_m: 6.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'Elbroch' },
  red_squirrel:        { eps_m: 5.5,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 7,   source: 'Elbroch' },
  beaver:              { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 22,  source: 'Lodge groups' },
  groundhog:           { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 20,  source: 'Burrow clusters' },
  armadillo:           { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'Southern burrow' },

  domestic_dog:        { eps_m: 15.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 20,  source: 'Breed variable' },
  domestic_cat:        { eps_m: 8.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 10,  source: 'Small domestic' },
  horse:               { eps_m: 25.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35,  source: 'Large hoof' },
  cattle:              { eps_m: 30.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 40,  source: 'Herd' },
  cow:                 { eps_m: 30.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 40,  source: 'Same as cattle' },
  goat:                { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 4, typical_group_radius_m: 15,  source: 'Cloven' },
  sheep:               { eps_m: 14.0, stride_multiplier: 1.7, min_pts: 4, typical_group_radius_m: 18,  source: 'Flock' },
  pig:                 { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'Boar' },
  donkey:              { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 30,  source: 'Hoof' },
  feral_hog:           { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'Same as pig' },
  boar:                { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'Same as feral hog' },

  wild_turkey:         { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 4, typical_group_radius_m: 20,  source: 'Strut groups' },
  ruffed_grouse:       { eps_m: 6.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'Flush tracks' },
  spruce_grouse:       { eps_m: 5.5,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 7,   source: 'Conifer' },
  sharp_tailed_grouse: { eps_m: 7.0,  stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 10,  source: 'Lek' },
  chukar_partridge:    { eps_m: 8.0,  stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 12,  source: 'Covey' },

  american_mink:             { eps_m: 9.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 11,  source: 'Elbroch water/forest' },
  long_tailed_weasel:        { eps_m: 8.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 10,  source: 'Small mustelid proxy' },
  short_tailed_weasel:       { eps_m: 7.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 9,   source: 'Ermine proxy' },
  least_weasel:              { eps_m: 6.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'Tiny mustelid' },
  ermine:                    { eps_m: 7.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 9,   source: 'Short-tailed weasel proxy' },
  stone_marten:              { eps_m: 12.5, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'European proxy' },
  pine_marten:               { eps_m: 13.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 16,  source: 'Elbroch conifer' },
  american_beaver:           { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 22,  source: 'Lodge groups' },

  nutria:                    { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 20,  source: 'Wetland invasive groups' },
  eastern_chipmunk:          { eps_m: 5.5,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'Burrow small' },
  townsend_chipmunk:         { eps_m: 5.8,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'BC regional' },
  hoary_marmot:              { eps_m: 14.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18,  source: 'Alpine marmot groups' },
  yellow_bellied_marmot:     { eps_m: 13.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 16,  source: 'Rocky burrow' },
  columbian_ground_squirrel: { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 12,  source: 'Colonial groups BC' },
  california_ground_squirrel:{ eps_m: 9.5,  stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 11,  source: 'Colonial' },
  northern_flying_squirrel:  { eps_m: 5.0,  stride_multiplier: 1.3, min_pts: 3, typical_group_radius_m: 7,   source: 'Arboreal small' },
  douglas_squirrel:          { eps_m: 6.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'Conifer small' },
  meadow_vole:               { eps_m: 4.0,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 6,   source: 'Runway clusters' },
  creeping_vole:             { eps_m: 4.2,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 6,   source: 'BC small vole' },
  deer_mouse:                { eps_m: 4.5,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 7,   source: 'Small rodent' },
  house_mouse:               { eps_m: 4.0,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 6,   source: 'Commensal small' },
  western_jumping_mouse:     { eps_m: 6.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'Jumping small' },
  bushy_tailed_woodrat:      { eps_m: 8.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 10,  source: 'Midden clusters' },
  northern_pocket_gopher:    { eps_m: 6.5,  stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 9,   source: 'Tunnel mounds' },
  american_pika:             { eps_m: 7.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 9,   source: 'Talus hay piles' },

  common_shrew:              { eps_m: 3.5,  stride_multiplier: 1.2, min_pts: 4, typical_group_radius_m: 5,   source: 'Tiny crawler' },
  dusky_shrew:               { eps_m: 3.8,  stride_multiplier: 1.2, min_pts: 4, typical_group_radius_m: 5,   source: 'BC small' },
  vagrant_shrew:             { eps_m: 3.6,  stride_multiplier: 1.2, min_pts: 4, typical_group_radius_m: 5,   source: 'Small crawler' },
  coast_mole:                { eps_m: 4.0,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 6,   source: 'Subsurface tunnels' },
  townsend_mole:             { eps_m: 4.2,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 6,   source: 'BC mole' },
  eastern_mole:              { eps_m: 4.5,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 7,   source: 'Tunnel proxy' },
  star_nosed_mole:           { eps_m: 5.0,  stride_multiplier: 1.3, min_pts: 4, typical_group_radius_m: 7,   source: 'Wetland mole' },

  columbian_black_tailed_deer:{ eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45, source: 'Same as blacktail' },
  sitka_deer:                { eps_m: 32.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 40,  source: 'Island coastal proxy' },

  european_badger:           { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 22,  source: 'European track keys + burrow clusters' },
  red_deer:                  { eps_m: 45.0, stride_multiplier: 2.3, min_pts: 5, typical_group_radius_m: 60,  source: 'European cervid groups' },
  roe_deer:                  { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 40,  source: 'Small European deer' },
  wild_boar:                 { eps_m: 25.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 35,  source: 'European rooting groups' },
  stoat:                     { eps_m: 7.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 9,   source: 'Ermine European / NZ pest' },
  weasel:                    { eps_m: 6.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 8,   source: 'Small European mustelid' },
  european_polecat:          { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'Polecat proxy' },
  european_beaver:           { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 25,  source: 'Lodge groups Europe' },
  european_otter:            { eps_m: 16.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 20,  source: 'European slide' },
  european_hare:             { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 4, typical_group_radius_m: 15,  source: 'Bounding hare' },
  european_rabbit:           { eps_m: 8.0,  stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 10,  source: 'Burrow groups' },
  chamois:                   { eps_m: 25.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 30,  source: 'Alpine European' },
  alpine_ibex:               { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 35,  source: 'Cliff groups' },
  mouflon:                   { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 28,  source: 'European sheep' },
  hedgehog:                  { eps_m: 8.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 10,  source: 'European / NZ crawler' },

  red_kangaroo:              { eps_m: 50.0, stride_multiplier: 2.5, min_pts: 4, typical_group_radius_m: 70,  source: 'Auz hopping groups' },
  grey_kangaroo:             { eps_m: 45.0, stride_multiplier: 2.4, min_pts: 4, typical_group_radius_m: 60,  source: 'Auz mob spacing' },
  wallaby:                   { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 40,  source: 'Auz small hopper' },
  common_wombat:             { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 3, typical_group_radius_m: 25,  source: 'Auz burrow' },
  koala:                     { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Arboreal but ground tracks' },
  eastern_quoll:             { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'Auz carnivorous marsupial' },
  spotted_tailed_quoll:      { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18,  source: 'Auz quoll' },
  common_brushtail_possum:   { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Auz possum' },
  ringtail_possum:           { eps_m: 8.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 10,  source: 'Auz arboreal' },
  brushtail_possum:          { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'NZ invasive possum' },
  dingo:                     { eps_m: 25.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 30,  source: 'Auz wild dog' },
  short_beaked_echidna:      { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'Auz monotreme crawler' },
  platypus:                  { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Semi-aquatic land tracks' },
  bilby:                     { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Auz desert digger' },
  bandicoot:                 { eps_m: 9.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 11,  source: 'Auz small marsupial' },
  bettong:                   { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'Auz rat-kangaroo' },
  numbat:                    { eps_m: 8.0,  stride_multiplier: 1.4, min_pts: 3, typical_group_radius_m: 10,  source: 'Auz marsupial anteater' },

  kiwi:                      { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'NZ rare ground bird tracks' },
  ferret:                    { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'NZ introduced' },
  ship_rat:                  { eps_m: 6.0,  stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 8,   source: 'NZ pest rat' },
  norway_rat:                { eps_m: 7.0,  stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 9,   source: 'NZ rat' },
  sika_deer:                 { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45,  source: 'NZ deer' },
  fallow_deer:               { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 40,  source: 'NZ deer' },
  feral_goat:                { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 4, typical_group_radius_m: 15,  source: 'NZ pest goat' },
  feral_pig:                 { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'NZ boar' },

  lion:                      { eps_m: 45.0, stride_multiplier: 2.4, min_pts: 4, typical_group_radius_m: 60,  source: 'African pride spacing + spoor guides' },
  leopard:                   { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35,  source: 'Solitary African cat' },
  cheetah:                   { eps_m: 35.0, stride_multiplier: 2.2, min_pts: 3, typical_group_radius_m: 45,  source: 'Fast African sprint groups' },
  spotted_hyena:             { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 40,  source: 'Clan spacing Africa' },
  african_elephant:          { eps_m: 80.0, stride_multiplier: 2.8, min_pts: 3, typical_group_radius_m: 100, source: 'Large herd spacing' },
  white_rhino:               { eps_m: 60.0, stride_multiplier: 2.6, min_pts: 3, typical_group_radius_m: 75,  source: 'African rhino tracks' },
  black_rhino:               { eps_m: 55.0, stride_multiplier: 2.5, min_pts: 3, typical_group_radius_m: 70,  source: 'Solitary African' },
  giraffe:                   { eps_m: 50.0, stride_multiplier: 2.5, min_pts: 3, typical_group_radius_m: 65,  source: 'Tall stride Africa' },
  plains_zebra:              { eps_m: 40.0, stride_multiplier: 2.2, min_pts: 5, typical_group_radius_m: 55,  source: 'Herd spacing' },
  african_buffalo:           { eps_m: 50.0, stride_multiplier: 2.5, min_pts: 5, typical_group_radius_m: 70,  source: 'Herd clusters' },
  impala:                    { eps_m: 30.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 40,  source: 'Leap groups Africa' },
  greater_kudu:              { eps_m: 35.0, stride_multiplier: 2.1, min_pts: 4, typical_group_radius_m: 45,  source: 'Bush antelope' },
  eland:                     { eps_m: 45.0, stride_multiplier: 2.3, min_pts: 4, typical_group_radius_m: 60,  source: 'Large antelope herd' },
  nyala:                     { eps_m: 32.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 42,  source: 'Southern Africa' },
  blue_wildebeest:           { eps_m: 40.0, stride_multiplier: 2.2, min_pts: 5, typical_group_radius_m: 55,  source: 'Migration herds' },
  springbok:                 { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 35,  source: 'Pronking groups' },
  warthog:                   { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'Family groups Africa' },
  baboon:                    { eps_m: 25.0, stride_multiplier: 2.0, min_pts: 4, typical_group_radius_m: 35,  source: 'Troop spacing' },
  meerkat:                   { eps_m: 8.0,  stride_multiplier: 1.5, min_pts: 4, typical_group_radius_m: 10,  source: 'Mob burrow clusters' },
  aardvark:                  { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 22,  source: 'Solitary digger' },
  ground_pangolin:           { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18,  source: 'Scaled crawler Africa' },
  genet:                     { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Small African civet' },
  african_civet:             { eps_m: 14.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 18,  source: 'Scent marking' },
  slender_mongoose:          { eps_m: 9.0,  stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 11,  source: 'Small crawler' },

  jaguar:                    { eps_m: 30.0, stride_multiplier: 2.1, min_pts: 3, typical_group_radius_m: 40,  source: 'Solitary SA cat' },
  puma:                      { eps_m: 28.0, stride_multiplier: 2.0, min_pts: 3, typical_group_radius_m: 35,  source: 'SA cougar' },
  ocelot:                    { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 22,  source: 'Small SA cat' },
  tapir:                     { eps_m: 35.0, stride_multiplier: 2.2, min_pts: 3, typical_group_radius_m: 45,  source: 'SA large herbivore' },
  capybara:                  { eps_m: 25.0, stride_multiplier: 2.0, min_pts: 5, typical_group_radius_m: 35,  source: 'SA group near water' },
  collared_peccary:          { eps_m: 20.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 25,  source: 'SA herd' },
  white_lipped_peccary:      { eps_m: 22.0, stride_multiplier: 1.9, min_pts: 4, typical_group_radius_m: 28,  source: 'SA large herd' },
  giant_anteater:            { eps_m: 30.0, stride_multiplier: 2.1, min_pts: 3, typical_group_radius_m: 40,  source: 'SA solitary digger' },
  tamandua:                  { eps_m: 15.0, stride_multiplier: 1.7, min_pts: 3, typical_group_radius_m: 20,  source: 'SA arboreal/ground' },
  nine_banded_armadillo:     { eps_m: 12.0, stride_multiplier: 1.6, min_pts: 3, typical_group_radius_m: 15,  source: 'SA crawler' },
  giant_armadillo:           { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 3, typical_group_radius_m: 22,  source: 'Large SA digger' },
  howler_monkey:             { eps_m: 10.0, stride_multiplier: 1.5, min_pts: 3, typical_group_radius_m: 12,  source: 'Arboreal but ground tracks' },
  capuchin_monkey:           { eps_m: 8.0,  stride_multiplier: 1.4, min_pts: 4, typical_group_radius_m: 10,  source: 'SA troop' },

  default:             { eps_m: 18.0, stride_multiplier: 1.8, min_pts: 4, typical_group_radius_m: 25,  source: 'General wildlife average' }

};

export const CLUSTER_CONFIG = Object.fromEntries(
  Object.entries(_RAW).map(([key, val]) => [
    key,
    { ...val, social_type: _socialType(key) }
  ])
);

export const CLUSTER_DEFAULT = CLUSTER_CONFIG['default'];

export function getClusterConfig(speciesKey) {
  if (!speciesKey) return CLUSTER_DEFAULT;
  const normalised = String(speciesKey).trim().toLowerCase().replace(/-/g, '_');
  return CLUSTER_CONFIG[normalised] ?? CLUSTER_DEFAULT;
}

export function classifyCluster({ speciesSet, trackCount, spreadM, cfg }) {
  if (speciesSet.length > 1) return 'multi_species_overlap';

  const spread         = spreadM ?? 0;
  const minPts         = cfg.min_pts;
  const groupRadiusM   = cfg.typical_group_radius_m;
  const socialType     = cfg.social_type;
  const meetsMinPts    = trackCount >= minPts;
  const withinGroup    = spread <= groupRadiusM;

  if (meetsMinPts && withinGroup && socialType === 'pack') return 'pack_cluster';

  if (meetsMinPts && withinGroup && (socialType === 'herd' || socialType === 'small_group')) return 'herd_cluster';

  if (trackCount >= 2 && spread > groupRadiusM) return 'loopback_cluster';

  if (trackCount >= 2 && withinGroup) return 'repeat_use_cluster';

  return 'single_animal_cluster';
}

export function clusterEvidenceLabel(clusterType, cfg, spreadM, trackCount) {
  const spread = spreadM != null ? `${spreadM.toFixed(1)}m spread` : 'spread unknown';
  const radius = `${cfg.typical_group_radius_m}m group radius`;
  const pts    = `${trackCount}/${cfg.min_pts} min_pts`;
  switch (clusterType) {
    case 'pack_cluster':         return `pack confirmed - ${pts}, ${spread} within ${radius}`;
    case 'herd_cluster':         return `herd confirmed - ${pts}, ${spread} within ${radius}`;
    case 'loopback_cluster':     return `loopback - ${spread} exceeds ${radius}, single animal return likely`;
    case 'repeat_use_cluster':   return `repeat use - ${pts}, ${spread} within ${radius}`;
    case 'multi_species_overlap':return `multi-species overlap in cluster zone`;
    default:                     return `single animal - below group threshold`;
  }
}