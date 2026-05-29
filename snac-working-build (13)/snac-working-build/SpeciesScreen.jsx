import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform
} from 'react-native';
import { getProfiles } from './snac_profiles.js';
import { useUnits, convertWater, convertHomeRange, formatAdaptedTrackSize } from './snac_units.js';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const C = {
  bg:         '#090B0A',
  surface:    '#0F1210',
  surfaceHi:  '#161A17',
  border:     '#1C211D',
  borderHot:  '#4A3A1A',
  accent:     '#C8A84B',
  accentDim:  '#7A6430',
  green:      '#4EFF6E',
  greenDim:   '#256B35',
  text:       '#E2EAE3',
  textMid:    '#7A917C',
  textDim:    '#3A4A3C',
  red:        '#FF4E4E',
};

const SPECIES_GROUPS = [
  { group: 'NORTH AMERICAN DEER', keys: ['blacktail_deer','white_tailed_deer','mule_deer','elk','moose','caribou','pronghorn','bighorn_sheep','mountain_goat'] },
  { group: 'BEARS', keys: ['black_bear','grizzly_bear'] },
  { group: 'NORTH AMERICAN PREDATORS', keys: ['mountain_lion','gray_wolf','coyote','bobcat','wolverine','fisher','red_fox','american_marten','mink','american_badger'] },
  { group: 'UPLAND & SMALL GAME', keys: ['wild_turkey','ruffed_grouse','spruce_grouse','sharp_tailed_grouse','chukar_partridge','snowshoe_hare','eastern_cottontail'] },
  { group: 'SEMI-AQUATIC', keys: ['beaver','river_otter','mink','muskrat'] },
  { group: 'FURBEARERS', keys: ['raccoon','striped_skunk','porcupine','groundhog','virginia_opossum'] },
  { group: 'EUROPEAN', keys: ['european_badger','red_deer','roe_deer','wild_boar','pine_marten','stoat','weasel','european_polecat','european_beaver','european_otter','european_hare','european_rabbit','chamois','alpine_ibex','mouflon','hedgehog','sika_deer','fallow_deer','ferret'] },
  { group: 'AFRICAN', keys: ['lion','leopard','cheetah','spotted_hyena','african_elephant','plains_zebra','african_buffalo','impala','greater_kudu','blue_wildebeest','springbok','warthog','baboon','meerkat','genet','slender_mongoose','african_civet','black_rhino','giraffe','nyala','eland','aardvark','ground_pangolin'] },
  { group: 'AUSTRALIAN', keys: ['red_kangaroo','grey_kangaroo','wallaby','common_wombat','common_brushtail_possum','short_beaked_echidna','eastern_quoll','ringtail_possum','platypus','bilby','bandicoot','numbat','bettong','kiwi','dingo'] },
  { group: 'SOUTH AMERICAN', keys: ['puma','jaguar','ocelot','tapir','capybara','collared_peccary','white_lipped_peccary','giant_anteater','tamandua','nine_banded_armadillo','giant_armadillo','howler_monkey','capuchin_monkey','coatimundi','mara','vicuna','guanaco'] },
  { group: 'DOMESTICS & FERAL', keys: ['domestic_dog','domestic_cat','horse','cattle','goat','sheep','pig','donkey','feral_pig','feral_goat'] },
  { group: 'COMMENSAL', keys: ['ship_rat','norway_rat','house_mouse','gray_squirrel','red_squirrel','groundhog'] },
];

// Convert comma string or array to clean array
function toArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string' && v.trim().length > 0) {
    return v.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function fmt(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : null;
  return String(v);
}

function Pill({ label, color }) {
  return (
    <View style={[sty.pill, { borderColor: color ?? C.accentDim }]}>
      <Text style={[sty.pillTxt, { color: color ?? C.accent }]}>{label}</Text>
    </View>
  );
}

function DataRow({ label, value, accent }) {
  if (!value) return null;
  return (
    <View style={sty.dataRow}>
      <Text style={sty.dataLabel}>{label}</Text>
      <Text style={[sty.dataVal, accent && { color: C.accent }]}>{value}</Text>
    </View>
  );
}

function PillGroup({ title, items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={sty.pillSection}>
      <Text style={sty.pillSectionLabel}>{title}</Text>
      <View style={sty.pillRow}>
        {items.map(t => (
          <Pill key={t} label={t.replace(/_/g, ' ')} color={color} />
        ))}
      </View>
    </View>
  );
}

function TechSection({ bw }) {
  if (!bw) return null;
  const tad = bw.track_age_decay;
  const fof = bw.flight_or_forage;
  const den = bw.denning_behavior;
  const ter = bw.terrain_intelligence;
  return (
    <View style={sty.techBlock}>
      <Text style={sty.techTitle}>TECHNICAL DATA</Text>
      {tad && (
        <View style={sty.techSub}>
          <Text style={sty.techSubTitle}>DECAY</Text>
          <DataRow label="Weight"          value={tad.weight != null ? String(tad.weight) : null} />
          <DataRow label="Env sensitivity" value={tad.environmental_sensitivity != null ? String(tad.environmental_sensitivity) : null} />
        </View>
      )}
      {fof && (
        <View style={sty.techSub}>
          <Text style={sty.techSubTitle}>FLIGHT / FORAGE</Text>
          <DataRow label="Flight weight"       value={fof.flight_weight != null ? String(fof.flight_weight) : null} />
          <DataRow label="Forage weight"       value={fof.forage_weight != null ? String(fof.forage_weight) : null} />
          <DataRow label="Direction threshold" value={fof.direction_change_threshold_deg != null ? `${fof.direction_change_threshold_deg}°` : null} />
        </View>
      )}
      {den && (
        <View style={sty.techSub}>
          <Text style={sty.techSubTitle}>DENNING / BEDDING</Text>
          <DataRow label="Den radius"     value={den.den_radius_m != null ? `${den.den_radius_m}m` : null} />
          <DataRow label="Return radius"  value={den.return_radius_m != null ? `${den.return_radius_m}m` : null} />
          <DataRow label="Denning weight" value={den.denning_weight != null ? String(den.denning_weight) : null} />
        </View>
      )}
      {ter && (
        <View style={sty.techSub}>
          <Text style={sty.techSubTitle}>TERRAIN WEIGHTS</Text>
          <DataRow label="Terrain"    value={ter.terrain_weight != null ? String(ter.terrain_weight) : null} />
          <DataRow label="Water edge" value={ter.water_edge_weight != null ? String(ter.water_edge_weight) : null} />
          <DataRow label="Cover"      value={ter.cover_weight != null ? String(ter.cover_weight) : null} />
          <DataRow label="Open"       value={ter.open_ground_weight != null ? String(ter.open_ground_weight) : null} />
        </View>
      )}
    </View>
  );
}

function SpeciesDetail({ speciesKey, profile, onBack }) {
  const [showTech, setShowTech] = useState(false);
  const { system: units } = useUnits();

  const terrainArr  = toArray(profile?.behavior_research?.primary_habitat).length > 0
    ? toArray(profile?.behavior_research?.primary_habitat)
    : toArray(profile?.terrain);
  const dietArr     = toArray(profile?.diet);
  const predatorOf  = toArray(profile?.predator_of);
  const preyOf      = toArray(profile?.prey_of);
  const clust       = profile?.clustering;

  const homeRangeDisplay = profile?.home_range_km2 != null
    ? convertHomeRange(profile.home_range_km2, units).display
    : null;

  const trackDisplay = formatAdaptedTrackSize(profile?.track_size_cm, units);

  return (
    <View style={sty.root}>
      <View style={sty.header}>
        <TouchableOpacity style={sty.backBtn} onPress={onBack}>
          <Text style={sty.backBtnTxt}>← BACK</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView style={sty.scroll} contentContainerStyle={sty.detailContent} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={sty.speciesHero}>
          <Text style={sty.speciesCommon}>
            {profile?.common_name ?? speciesKey.replace(/_/g, ' ').toUpperCase()}
          </Text>
          {profile?.scientific_name ? (
            <Text style={sty.speciesSci}>{profile.scientific_name}</Text>
          ) : null}
          <Text style={sty.speciesKey}>{speciesKey}</Text>
        </View>

        {/* Field data */}
        <View style={sty.card}>
          <Text style={sty.cardTitle}>FIELD DATA</Text>
          <DataRow label="Track size"   value={trackDisplay} accent />
          <DataRow label="Track depth"  value={fmt(profile?.track_depth_notes ?? profile?.track_depth)} />
          <DataRow label="Gait"         value={fmt(profile?.movement_tags ?? profile?.gait_patterns)} />
          <DataRow label="Activity"     value={profile?.activity ?? profile?.activity_pattern ?? null} />
          <DataRow label="Home range"   value={homeRangeDisplay} />
          <DataRow label="Migration"    value={profile?.migration_distance_km != null ? `${profile.migration_distance_km} km` : null} />
          <DataRow label="Water needs"  value={profile?.water_needs_l_per_day != null ? convertWater(profile.water_needs_l_per_day, units).display : (profile?.water_needs ?? null)} />
        </View>

        {/* Habitat & Diet */}
        {(terrainArr.length > 0 || dietArr.length > 0) && (
          <View style={sty.card}>
            <Text style={sty.cardTitle}>HABITAT & DIET</Text>
            <PillGroup title="TERRAIN" items={terrainArr} color={C.green} />
            {terrainArr.length > 0 && dietArr.length > 0 && <View style={{ height: 12 }} />}
            <PillGroup title="DIET" items={dietArr} color={C.accentDim} />
          </View>
        )}

        {/* Predator / Prey */}
        {(predatorOf.length > 0 || preyOf.length > 0) && (
          <View style={sty.card}>
            <Text style={sty.cardTitle}>PREDATOR / PREY</Text>
            <PillGroup title="HUNTS"     items={predatorOf} color={C.red} />
            {predatorOf.length > 0 && preyOf.length > 0 && <View style={{ height: 12 }} />}
            <PillGroup title="HUNTED BY" items={preyOf}    color={C.textMid} />
          </View>
        )}

        {/* Clustering */}
        {clust && (
          <View style={sty.card}>
            <Text style={sty.cardTitle}>SIGN DETECTION RANGE</Text>
            <DataRow label="Detection radius" value={clust.eps_m != null ? `${clust.eps_m}m` : null} />
            <DataRow label="Group spread"     value={clust.typical_group_radius_m != null ? `${clust.typical_group_radius_m}m` : null} />
          </View>
        )}

        {/* Notes */}
        {profile?.notes ? (
          <View style={sty.card}>
            <Text style={sty.cardTitle}>FIELD NOTES</Text>
            <Text style={sty.notesText}>{profile.notes}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={sty.techToggle} onPress={() => setShowTech(v => !v)}>
          <Text style={sty.techToggleTxt}>
            {showTech ? '▲ HIDE TECHNICAL DATA' : '▼ SHOW TECHNICAL DATA'}
          </Text>
        </TouchableOpacity>

        {showTech && <TechSection bw={profile?.behavior_weights} />}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

export default function SpeciesScreen() {
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const profiles = useMemo(() => {
    try { return getProfiles() ?? {}; } catch { return {}; }
  }, []);

  const allSpecies = useMemo(() => {
    const seen = new Set();
    const out  = [];
    for (const grp of SPECIES_GROUPS) {
      for (const key of grp.keys) {
        if (seen.has(key)) continue;
        seen.add(key);
        const p = profiles[key];
        out.push({ key, group: grp.group, label: p?.common_name ?? key.replace(/_/g, ' '), sci: p?.scientific_name ?? '' });
      }
    }
    for (const key of Object.keys(profiles)) {
      if (seen.has(key)) continue;
      seen.add(key);
      const p = profiles[key];
      out.push({ key, group: 'OTHER', label: p?.common_name ?? key.replace(/_/g, ' '), sci: p?.scientific_name ?? '' });
    }
    return out;
  }, [profiles]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allSpecies;
    const q = search.toLowerCase();
    return allSpecies.filter(s =>
      s.label.toLowerCase().includes(q) ||
      s.key.toLowerCase().includes(q) ||
      s.sci.toLowerCase().includes(q)
    );
  }, [allSpecies, search]);

  const grouped = useMemo(() => {
    const map = {};
    for (const s of filtered) {
      if (!map[s.group]) map[s.group] = [];
      map[s.group].push(s);
    }
    return Object.entries(map);
  }, [filtered]);

  const handleSelect = useCallback((key) => setSelected(key), []);

  if (selected) {
    return (
      <SpeciesDetail
        speciesKey={selected}
        profile={profiles[selected]}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <View style={sty.root}>
      <View style={sty.header}>
        <Text style={sty.headerWordmark}>SNAC</Text>
        <Text style={sty.headerSub}>SPECIES LIBRARY</Text>
      </View>

      <View style={sty.searchWrap}>
        <TextInput
          style={sty.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search species..."
          placeholderTextColor={C.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity style={sty.clearBtn} onPress={() => setSearch('')}>
            <Text style={sty.clearBtnTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={sty.countLine}>{filtered.length} SPECIES</Text>

      <ScrollView style={sty.scroll} contentContainerStyle={sty.listContent} showsVerticalScrollIndicator={false}>
        {grouped.map(([group, items]) => (
          <View key={group} style={sty.groupBlock}>
            <Text style={sty.groupHeader}>{group}</Text>
            {items.map(item => (
              <TouchableOpacity
                key={item.key}
                style={sty.speciesRow}
                onPress={() => handleSelect(item.key)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={sty.speciesRowLabel}>{item.label}</Text>
                  {item.sci ? <Text style={sty.speciesRowSci}>{item.sci}</Text> : null}
                </View>
                <Text style={sty.speciesRowArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const sty = StyleSheet.create({
  root:             { flex: 1, backgroundColor: C.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerWordmark:   { fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 6, color: C.accent },
  headerSub:        { fontFamily: MONO, fontSize: 9, letterSpacing: 4, color: C.accentDim, marginTop: 1 },
  backBtn:          { borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 6 },
  backBtnTxt:       { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.textMid },
  searchWrap:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4 },
  searchInput:      { flex: 1, fontFamily: MONO, fontSize: 13, color: C.text, paddingHorizontal: 14, paddingVertical: 10 },
  clearBtn:         { paddingHorizontal: 12, paddingVertical: 10 },
  clearBtnTxt:      { fontFamily: MONO, fontSize: 11, color: C.textDim },
  countLine:        { fontFamily: MONO, fontSize: 8, letterSpacing: 3, color: C.textDim, paddingHorizontal: 20, marginBottom: 8, marginTop: 4 },
  scroll:           { flex: 1 },
  listContent:      { paddingHorizontal: 16, paddingTop: 4 },
  groupBlock:       { marginBottom: 8 },
  groupHeader:      { fontFamily: MONO, fontSize: 8, letterSpacing: 4, color: C.accent, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderHot, marginBottom: 2 },
  speciesRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  speciesRowLabel:  { fontFamily: MONO, fontSize: 13, color: C.text, fontWeight: '600' },
  speciesRowSci:    { fontFamily: MONO, fontSize: 9, color: C.textDim, marginTop: 2, fontStyle: 'italic' },
  speciesRowArrow:  { fontFamily: MONO, fontSize: 20, color: C.accentDim, marginLeft: 8 },
  detailContent:    { padding: 16 },
  speciesHero:      { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.borderHot },
  speciesCommon:    { fontFamily: MONO, fontSize: 18, fontWeight: '700', color: C.accent, letterSpacing: 2, marginBottom: 4, flexWrap: 'wrap' },
  speciesSci:       { fontFamily: MONO, fontSize: 11, color: C.textMid, fontStyle: 'italic', marginBottom: 4 },
  speciesKey:       { fontFamily: MONO, fontSize: 9, color: C.textDim, letterSpacing: 3 },
  card:             { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 14, marginBottom: 10 },
  cardTitle:        { fontFamily: MONO, fontSize: 8, letterSpacing: 4, color: C.accentDim, marginBottom: 12 },
  dataRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  dataLabel:        { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: C.textMid, flex: 1 },
  dataVal:          { fontFamily: MONO, fontSize: 11, color: C.text, flex: 2, textAlign: 'right', flexWrap: 'wrap' },
  pillSection:      {},
  pillSectionLabel: { fontFamily: MONO, fontSize: 8, letterSpacing: 3, color: C.textDim, marginBottom: 8 },
  pillRow:          { flexDirection: 'row', flexWrap: 'wrap', marginRight: -6 },
  pill:             { borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 6 },
  pillTxt:          { fontFamily: MONO, fontSize: 9, letterSpacing: 1 },
  notesText:        { fontFamily: MONO, fontSize: 11, color: C.text, lineHeight: 18 },
  techToggle:       { borderWidth: 1, borderColor: C.borderHot, borderRadius: 3, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  techToggleTxt:    { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: C.accentDim },
  techBlock:        { backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderHot, borderRadius: 4, padding: 14, marginBottom: 10 },
  techTitle:        { fontFamily: MONO, fontSize: 8, letterSpacing: 4, color: C.accent, marginBottom: 14 },
  techSub:          { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  techSubTitle:     { fontFamily: MONO, fontSize: 7, letterSpacing: 3, color: C.textDim, marginBottom: 8 },
});
