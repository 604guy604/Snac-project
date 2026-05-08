import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform,
} from 'react-native';
import { getProfiles } from './snac_profiles.js';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const C = {
  bg:        '#090B0A',
  surface:   '#0F1210',
  border:    '#1C211D',
  borderHot: '#4A3A1A',
  accent:    '#C8A84B',
  accentDim: '#7A6430',
  green:     '#4EFF6E',
  greenDim:  '#256B35',
  text:      '#E2EAE3',
  textMid:   '#7A917C',
  textDim:   '#3A4A3C',
  red:       '#FF4E4E',
};

// Nuclear safe - converts ANYTHING to a display string, never throws
function safe(v) {
  try {
    if (v == null) return null;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') return v.trim() || null;
    if (Array.isArray(v)) return v.filter(Boolean).join(', ') || null;
    if (typeof v === 'object') return null; // don't render raw objects
    return String(v);
  } catch (_e) {
    return null;
  }
}

// Nuclear safe array - always returns array, never throws
function safeArr(v) {
  try {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(x => x != null);
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  } catch (_e) {
    return [];
  }
}

const SPECIES_GROUPS = [
  { group: 'NORTH AMERICAN DEER',     keys: ['blacktail_deer','white_tailed_deer','mule_deer','elk','moose','caribou','pronghorn','bighorn_sheep','mountain_goat'] },
  { group: 'BEARS',                   keys: ['black_bear','grizzly_bear'] },
  { group: 'NORTH AMERICAN PREDATORS',keys: ['mountain_lion','gray_wolf','coyote','bobcat','wolverine','fisher','red_fox','american_marten','mink','american_badger'] },
  { group: 'UPLAND & SMALL GAME',    keys: ['wild_turkey','ruffed_grouse','spruce_grouse','sharp_tailed_grouse','chukar_partridge','snowshoe_hare','eastern_cottontail'] },
  { group: 'SEMI-AQUATIC',            keys: ['beaver','river_otter','muskrat'] },
  { group: 'FURBEARERS',              keys: ['raccoon','striped_skunk','porcupine','groundhog','virginia_opossum','gray_squirrel','red_squirrel'] },
  { group: 'EUROPEAN',                keys: ['european_badger','red_deer','roe_deer','wild_boar','pine_marten','stoat','weasel','european_polecat','european_beaver','european_otter','european_hare','european_rabbit','chamois','alpine_ibex','mouflon','hedgehog','sika_deer','fallow_deer','ferret'] },
  { group: 'AFRICAN',                 keys: ['lion','leopard','cheetah','spotted_hyena','african_elephant','plains_zebra','african_buffalo','impala','greater_kudu','blue_wildebeest','springbok','warthog','baboon','meerkat','genet','slender_mongoose','african_civet','black_rhino','giraffe','nyala','eland','aardvark','ground_pangolin'] },
  { group: 'AUSTRALIAN',              keys: ['red_kangaroo','grey_kangaroo','wallaby','common_wombat','common_brushtail_possum','short_beaked_echidna','eastern_quoll','ringtail_possum','platypus','bilby','bandicoot','numbat','bettong','kiwi','dingo'] },
  { group: 'SOUTH AMERICAN',          keys: ['puma','jaguar','ocelot','tapir','capybara','collared_peccary','white_lipped_peccary','giant_anteater','tamandua','nine_banded_armadillo','giant_armadillo','howler_monkey','capuchin_monkey','coatimundi','mara','vicuna','guanaco'] },
  { group: 'DOMESTICS & FERAL',       keys: ['domestic_dog','domestic_cat','horse','cattle','goat','sheep','pig','donkey','feral_pig','feral_goat'] },
  { group: 'COMMENSAL',               keys: ['ship_rat','norway_rat','house_mouse'] },
];

function Row({ label, value }) {
  const v = safe(value);
  if (!v) return null;
  return (
    <View style={st.dataRow}>
      <Text style={st.dataLabel}>{label}</Text>
      <Text style={st.dataVal}>{v}</Text>
    </View>
  );
}

function TagRow({ label, items, color }) {
  const arr = safeArr(items);
  if (!arr.length) return null;
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={st.tagLabel}>{label}</Text>
      <View style={st.tagWrap}>
        {arr.map((item, i) => (
          <View key={i} style={[st.tag, { borderColor: color ?? C.accentDim }]}>
            <Text style={[st.tagTxt, { color: color ?? C.accent }]}>
              {String(item).replace(/_/g, ' ')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SpeciesDetail({ speciesKey, p, onBack }) {
  const [showTech, setShowTech] = useState(false);

  // Pull everything through safe() - nothing can throw
  const name    = safe(p?.common_name) ?? speciesKey.replace(/_/g, ' ');
  const sci     = safe(p?.scientific_name);
  const diet    = safe(p?.diet);
  const activity= safe(p?.activity ?? p?.activity_pattern);
  const water   = safe(p?.water_needs);
  const migratory = p?.migratory != null ? (p.migratory ? 'Yes' : 'No') : null;
  const homeRange = p?.home_range_km2 != null ? `${p.home_range_km2} km²` : null;
  const migDist   = p?.migration_distance_km != null ? `${p.migration_distance_km} km` : null;
  const notes   = safe(p?._raw?.notes ?? p?.notes);
  const trackDepth = safe(p?.track_depth_notes ?? p?.track_depth);

  const tsf = safe(p?.track_size_cm?.front);
  const tsr = safe(p?.track_size_cm?.hind ?? p?.track_size_cm?.rear);
  const trackSize = tsf && tsr ? `Front ${tsf}  /  Rear ${tsr}` : (tsf ?? tsr ?? null);

  const terrain    = safeArr(p?._raw?.terrain ?? p?.behavior_research?.primary_habitat);
  const gait       = safeArr(p?._raw?.gait_patterns ?? p?.movement_tags);
  const dietType   = safeArr(p?.diet_type);
  const predatorOf = safeArr(p?.predator_of);
  const preyOf     = safeArr(p?.prey_of);
  const behaviorTags = safeArr(p?.behavior_tags);

  const clust = p?.clustering ?? null;
  const tad   = p?.track_age_decay ?? null;
  const fof   = p?.flight_or_forage ?? null;
  const den   = p?.denning_behavior ?? null;
  const ter   = p?.terrain_intelligence ?? null;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={onBack}>
          <Text style={st.backBtnTxt}>← BACK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.detailContent} showsVerticalScrollIndicator={false}>

        <View style={st.hero}>
          <Text style={st.heroName}>{name}</Text>
          {sci ? <Text style={st.heroSci}>{sci}</Text> : null}
          <Text style={st.heroKey}>{speciesKey}</Text>
          {dietType.length > 0 && (
            <View style={[st.tagWrap, { marginTop: 8 }]}>
              {dietType.map((dt, i) => (
                <View key={i} style={[st.tag, { borderColor: C.accentDim }]}>
                  <Text style={[st.tagTxt, { color: C.accent }]}>{String(dt).replace(/_/g,' ')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={st.card}>
          <Text style={st.cardTitle}>FIELD DATA</Text>
          {trackSize ? (
            <View style={st.dataRow}>
              <Text style={st.dataLabel}>Track size</Text>
              <Text style={[st.dataVal, { color: C.accent }]}>{trackSize}</Text>
            </View>
          ) : null}
          <Row label="Track depth"  value={trackDepth} />
          <Row label="Activity"     value={activity} />
          <Row label="Home range"   value={homeRange} />
          <Row label="Migration"    value={migDist} />
          <Row label="Water needs"  value={water} />
          <Row label="Migratory"    value={migratory} />
          <TagRow label="GAIT" items={gait} color={C.green} />
          <TagRow label="BEHAVIOUR" items={behaviorTags} color={C.textMid} />
        </View>

        {(terrain.length > 0 || diet) ? (
          <View style={st.card}>
            <Text style={st.cardTitle}>HABITAT & DIET</Text>
            <TagRow label="TERRAIN" items={terrain} color={C.green} />
            {diet ? (
              <View style={{ marginTop: 10 }}>
                <Text style={st.tagLabel}>DIET</Text>
                <Text style={[st.dataVal, { textAlign: 'left', marginTop: 4 }]}>{diet}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {(predatorOf.length > 0 || preyOf.length > 0) ? (
          <View style={st.card}>
            <Text style={st.cardTitle}>PREDATOR / PREY</Text>
            <TagRow label="HUNTS"     items={predatorOf} color={C.red} />
            <TagRow label="HUNTED BY" items={preyOf}     color={C.textMid} />
          </View>
        ) : null}

        {clust ? (
          <View style={st.card}>
            <Text style={st.cardTitle}>TRACKING PARAMETERS</Text>
            <Row label="Cluster radius" value={clust.eps_m != null ? `${clust.eps_m}m` : null} />
            <Row label="Group radius"   value={clust.typical_group_radius_m != null ? `${clust.typical_group_radius_m}m` : null} />
            <Row label="Stride mult"    value={clust.stride_multiplier != null ? `${clust.stride_multiplier}×` : null} />
            <Row label="Min points"     value={clust.min_pts != null ? String(clust.min_pts) : null} />
            {clust.source ? <Text style={st.clustSource}>Source: {clust.source}</Text> : null}
          </View>
        ) : null}

        {notes ? (
          <View style={st.card}>
            <Text style={st.cardTitle}>FIELD NOTES</Text>
            <Text style={st.notesText}>{notes}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={st.techToggle} onPress={() => setShowTech(v => !v)}>
          <Text style={st.techToggleTxt}>{showTech ? '▲  HIDE TECHNICAL' : '▼  SHOW TECHNICAL DATA'}</Text>
        </TouchableOpacity>

        {showTech ? (
          <View style={[st.card, { borderColor: C.borderHot }]}>
            <Text style={st.cardTitle}>TECHNICAL DATA</Text>
            {tad ? (
              <View style={st.techSub}>
                <Text style={st.techSubTitle}>DECAY</Text>
                <Row label="Weight"          value={tad.weight} />
                <Row label="Env sensitivity" value={tad.environmental_sensitivity} />
              </View>
            ) : null}
            {fof ? (
              <View style={st.techSub}>
                <Text style={st.techSubTitle}>FLIGHT / FORAGE</Text>
                <Row label="Flight weight" value={fof.flight_weight} />
                <Row label="Forage weight" value={fof.forage_weight} />
                <Row label="Dir threshold" value={fof.direction_change_threshold_deg != null ? `${fof.direction_change_threshold_deg}°` : null} />
              </View>
            ) : null}
            {den ? (
              <View style={st.techSub}>
                <Text style={st.techSubTitle}>DENNING</Text>
                <Row label="Den radius"    value={den.den_radius_m != null ? `${den.den_radius_m}m` : null} />
                <Row label="Return radius" value={den.return_radius_m != null ? `${den.return_radius_m}m` : null} />
                <Row label="Weight"        value={den.denning_weight} />
              </View>
            ) : null}
            {ter ? (
              <View style={st.techSub}>
                <Text style={st.techSubTitle}>TERRAIN WEIGHTS</Text>
                <Row label="Terrain"     value={ter.terrain_weight} />
                <Row label="Water edge"  value={ter.water_edge_weight} />
                <Row label="Cover"       value={ter.cover_weight} />
                <Row label="Open"        value={ter.open_ground_weight} />
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

export default function SpeciesLib() {
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const profiles = useMemo(() => {
    try { return getProfiles() ?? {}; }
    catch (_e) { return {}; }
  }, []);

  const allSpecies = useMemo(() => {
    const seen = new Set();
    const out  = [];
    for (const grp of SPECIES_GROUPS) {
      for (const key of grp.keys) {
        if (seen.has(key)) continue;
        seen.add(key);
        const p = profiles[key];
        out.push({ key, group: grp.group, label: safe(p?.common_name) ?? key.replace(/_/g,' '), sci: safe(p?.scientific_name) ?? '' });
      }
    }
    for (const key of Object.keys(profiles)) {
      if (seen.has(key)) continue;
      seen.add(key);
      const p = profiles[key];
      out.push({ key, group: 'OTHER', label: safe(p?.common_name) ?? key.replace(/_/g,' '), sci: safe(p?.scientific_name) ?? '' });
    }
    return out;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSpecies;
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

  if (selected) {
    return (
      <SpeciesDetail
        speciesKey={selected}
        p={profiles[selected]}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.headerWordmark}>SNAC</Text>
        <Text style={st.headerSub}>SPECIES LIBRARY</Text>
      </View>

      <View style={st.searchWrap}>
        <TextInput
          style={st.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search 125 species..."
          placeholderTextColor={C.textDim}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={st.clearBtn}>
            <Text style={st.clearBtnTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={st.countLine}>{filtered.length} SPECIES</Text>

      <ScrollView style={st.scroll} contentContainerStyle={st.listContent} showsVerticalScrollIndicator={false}>
        {grouped.map(([group, items]) => (
          <View key={group} style={st.groupBlock}>
            <Text style={st.groupHeader}>{group}</Text>
            {items.map(item => (
              <TouchableOpacity
                key={item.key}
                style={st.speciesRow}
                onPress={() => setSelected(item.key)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={st.speciesRowLabel}>{item.label}</Text>
                  {item.sci ? <Text style={st.speciesRowSci}>{item.sci}</Text> : null}
                </View>
                <Text style={st.arrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerWordmark:  { fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 6, color: C.accent },
  headerSub:       { fontFamily: MONO, fontSize: 9, letterSpacing: 4, color: C.accentDim },
  backBtn:         { borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingHorizontal: 12, paddingVertical: 6 },
  backBtnTxt:      { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: C.textMid },
  searchWrap:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4 },
  searchInput:     { flex: 1, fontFamily: MONO, fontSize: 13, color: C.text, paddingHorizontal: 14, paddingVertical: 10 },
  clearBtn:        { paddingHorizontal: 12, paddingVertical: 10 },
  clearBtnTxt:     { fontFamily: MONO, fontSize: 11, color: C.textDim },
  countLine:       { fontFamily: MONO, fontSize: 8, letterSpacing: 3, color: C.textDim, paddingHorizontal: 20, marginBottom: 8, marginTop: 4 },
  scroll:          { flex: 1 },
  listContent:     { paddingHorizontal: 16, paddingTop: 4 },
  groupBlock:      { marginBottom: 8 },
  groupHeader:     { fontFamily: MONO, fontSize: 8, letterSpacing: 4, color: C.accent, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderHot, marginBottom: 2 },
  speciesRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: C.border },
  speciesRowLabel: { fontFamily: MONO, fontSize: 13, color: C.text, fontWeight: '600' },
  speciesRowSci:   { fontFamily: MONO, fontSize: 9, color: C.textDim, marginTop: 2, fontStyle: 'italic' },
  arrow:           { fontFamily: MONO, fontSize: 20, color: C.accentDim, marginLeft: 8 },
  detailContent:   { padding: 16 },
  hero:            { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.borderHot },
  heroName:        { fontFamily: MONO, fontSize: 20, fontWeight: '700', color: C.accent, letterSpacing: 2, marginBottom: 4 },
  heroSci:         { fontFamily: MONO, fontSize: 11, color: C.textMid, fontStyle: 'italic', marginBottom: 4 },
  heroKey:         { fontFamily: MONO, fontSize: 9, color: C.textDim, letterSpacing: 3 },
  card:            { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 14, marginBottom: 10 },
  cardTitle:       { fontFamily: MONO, fontSize: 8, letterSpacing: 4, color: C.accentDim, marginBottom: 12 },
  dataRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  dataLabel:       { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: C.textMid, flex: 1 },
  dataVal:         { fontFamily: MONO, fontSize: 11, color: C.text, flex: 2, textAlign: 'right', flexWrap: 'wrap' },
  tagLabel:        { fontFamily: MONO, fontSize: 8, letterSpacing: 3, color: C.textDim, marginBottom: 6 },
  tagWrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:             { borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  tagTxt:          { fontFamily: MONO, fontSize: 9, letterSpacing: 1 },
  notesText:       { fontFamily: MONO, fontSize: 11, color: C.text, lineHeight: 18 },
  clustSource:     { fontFamily: MONO, fontSize: 8, color: C.textDim, marginTop: 8 },
  techToggle:      { borderWidth: 1, borderColor: C.borderHot, borderRadius: 3, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  techToggleTxt:   { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: C.accentDim },
  techSub:         { marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  techSubTitle:    { fontFamily: MONO, fontSize: 7, letterSpacing: 3, color: C.textDim, marginBottom: 8 },
});
