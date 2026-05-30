import React, {
  useCallback, useReducer, useEffect, useState
} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Dimensions, Platform, Alert,
  KeyboardAvoidingView, Switch, Modal, FlatList
} from 'react-native';
import { useSnac } from './useSnac.js';
import { useUnits } from './snac_units.js';

const { width: W } = Dimensions.get('window');
const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const C = {
  bg:          '#090B0A',
  surface:     '#0F1210',
  surfaceHi:   '#161A17',
  border:      '#1C211D',
  borderHot:   '#344D37',
  accent:      '#4EFF6E',
  accentDim:   '#256B35',
  accentWarm:  '#FFB84E',
  text:        '#E2EAE3',
  accentRed:   '#FF4E4E',
  textMid:     '#7A917C',
  textDim:     '#3A4A3C',
};

const SIGN_TAGS = [
  { id: 'scat',     label: 'Scat'          },
  { id: 'browse',   label: 'Fresh Browse'  },
  { id: 'rubs',     label: 'Rubs / Scrapes'},
  { id: 'beds',     label: 'Beds'          },
  { id: 'water',    label: 'Water Source'  },
  { id: 'trail',    label: 'Game Trail'    },
  { id: 'predator', label: 'Predator Sign' },
  { id: 'pressure', label: 'Human Pressure'},
];

const GAIT_OPTS      = ['walk','trot','lope','bound','gallop','meander','browse','graze'];
const SUBSTRATE_OPTS = ['mud','soft_dirt','wet_sand','leaf_litter','grass_short','rocky','snow_powder','packed_dirt'];
const BEHAVIOR_OPTS  = ['forage','patrol','browse','flee','rest','den','mark','territorial'];
const ZONE_OPTS      = ['riparian_edge','shrub_cover','forest_floor','open_field','creek_edge','rocky','wetland','pine_forest'];
const LIGHT_OPTS     = ['dawn','morning','midday','afternoon','dusk','night'];
const WEATHER_OPTS   = ['clear','overcast','light_rain','heavy_rain','snow','fog','windy'];

// Phase 4.2 terrain anchor inputs - user-observed ground truth
const WATER_TYPE_OPTS      = ['none','permanent','ephemeral'];
const WATER_CONDITION_OPTS = ['clear','churned'];
const TERRAIN_CHANNEL_OPTS = ['flat','ridge','drainage'];

const SPECIES_GROUPS = [
  { group: 'NORTH AMERICAN DEER', items: [
    { key: 'blacktail_deer',    label: 'Black-tailed Deer' },
    { key: 'white_tailed_deer', label: 'White-tailed Deer' },
    { key: 'mule_deer',         label: 'Mule Deer' },
    { key: 'caribou',           label: 'Caribou / Reindeer' },
    { key: 'pronghorn',         label: 'Pronghorn' },
    { key: 'bighorn_sheep',     label: 'Bighorn Sheep' },
    { key: 'mountain_goat',     label: 'Mountain Goat' },
  ]},
  { group: 'ELK & MOOSE', items: [
    { key: 'elk',   label: 'Elk / Wapiti' },
    { key: 'moose', label: 'Moose' },
  ]},
  { group: 'BEAR', items: [
    { key: 'black_bear',   label: 'Black Bear' },
    { key: 'grizzly_bear', label: 'Grizzly / Brown Bear' },
  ]},
  { group: 'NORTH AMERICAN PREDATORS', items: [
    { key: 'mountain_lion',   label: 'Mountain Lion / Cougar' },
    { key: 'gray_wolf',       label: 'Gray Wolf' },
    { key: 'coyote',          label: 'Coyote' },
    { key: 'bobcat',          label: 'Bobcat' },
    { key: 'wolverine',       label: 'Wolverine' },
    { key: 'fisher',          label: 'Fisher' },
    { key: 'red_fox',         label: 'Red Fox' },
    { key: 'american_marten', label: 'American Marten' },
    { key: 'mink',            label: 'American Mink' },
    { key: 'american_badger', label: 'American Badger' },
  ]},
  { group: 'UPLAND & SMALL GAME', items: [
    { key: 'wild_turkey',         label: 'Wild Turkey' },
    { key: 'ruffed_grouse',       label: 'Ruffed Grouse' },
    { key: 'spruce_grouse',       label: 'Spruce Grouse' },
    { key: 'sharp_tailed_grouse', label: 'Sharp-tailed Grouse' },
    { key: 'chukar_partridge',    label: 'Chukar Partridge' },
    { key: 'snowshoe_hare',       label: 'Snowshoe Hare' },
    { key: 'eastern_cottontail',  label: 'Eastern Cottontail' },
  ]},
  { group: 'SEMI-AQUATIC', items: [
    { key: 'beaver',      label: 'North American Beaver' },
    { key: 'river_otter', label: 'River Otter' },
    { key: 'mink',        label: 'American Mink' },
    { key: 'muskrat',     label: 'Muskrat' },
  ]},
  { group: 'FURBEARERS', items: [
    { key: 'raccoon',          label: 'Raccoon' },
    { key: 'striped_skunk',    label: 'Striped Skunk' },
    { key: 'porcupine',        label: 'North American Porcupine' },
    { key: 'groundhog',        label: 'Groundhog' },
    { key: 'virginia_opossum', label: 'Virginia Opossum' },
  ]},
  { group: 'DOMESTICS', items: [
    { key: 'domestic_dog', label: 'Domestic Dog' },
    { key: 'domestic_cat', label: 'Domestic Cat' },
    { key: 'horse',        label: 'Horse' },
    { key: 'cattle',       label: 'Cattle' },
    { key: 'pig',          label: 'Domestic Pig' },
    { key: 'sheep',        label: 'Domestic Sheep' },
    { key: 'goat',         label: 'Domestic Goat' },
    { key: 'donkey',       label: 'Donkey' },
  ]},
  { group: 'EUROPEAN', items: [
    { key: 'red_deer',        label: 'Red Deer' },
    { key: 'roe_deer',        label: 'Roe Deer' },
    { key: 'wild_boar',       label: 'Wild Boar' },
    { key: 'european_hare',   label: 'European Hare' },
    { key: 'european_rabbit', label: 'European Rabbit' },
    { key: 'european_badger', label: 'European Badger' },
    { key: 'chamois',         label: 'Chamois' },
    { key: 'alpine_ibex',     label: 'Alpine Ibex' },
    { key: 'mouflon',         label: 'Mouflon' },
  ]},
  { group: 'AFRICAN', items: [
    { key: 'lion',            label: 'Lion' },
    { key: 'leopard',         label: 'Leopard' },
    { key: 'cheetah',         label: 'Cheetah' },
    { key: 'african_elephant',label: 'African Elephant' },
    { key: 'african_buffalo', label: 'African Buffalo' },
    { key: 'plains_zebra',    label: 'Plains Zebra' },
    { key: 'giraffe',         label: 'Giraffe' },
    { key: 'impala',          label: 'Impala' },
    { key: 'greater_kudu',    label: 'Greater Kudu' },
    { key: 'warthog',         label: 'Warthog' },
  ]},
  { group: 'AUSTRALASIAN', items: [
    { key: 'red_kangaroo',  label: 'Red Kangaroo' },
    { key: 'grey_kangaroo', label: 'Eastern Grey Kangaroo' },
    { key: 'wallaby',       label: 'Red-necked Wallaby' },
    { key: 'dingo',         label: 'Dingo' },
    { key: 'feral_pig',     label: 'Feral Pig' },
  ]},
  { group: 'SOUTH AMERICAN', items: [
    { key: 'puma',    label: 'Puma' },
    { key: 'jaguar',  label: 'Jaguar' },
    { key: 'tapir',   label: 'South American Tapir' },
    { key: 'capybara',label: 'Capybara' },
    { key: 'guanaco', label: 'Guanaco' },
  ]},
];

const SPECIES_FLAT = SPECIES_GROUPS.flatMap(g =>
  g.items.map(i => ({ ...i, group: g.group }))
);

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

function validateSpeciesText(raw) {
  if (!raw || !raw.trim()) return { value: '', label: '', known: false, warning: '' };
  const norm = raw.trim().toLowerCase().replace(/\s+/g, '_');
  const exactKey = SPECIES_FLAT.find(i => i.key === norm);
  if (exactKey) return { value: exactKey.key, label: exactKey.label, known: true, warning: '' };
  const nameMatch = SPECIES_FLAT.find(i => i.label.toLowerCase() === raw.trim().toLowerCase());
  if (nameMatch) return { value: nameMatch.key, label: nameMatch.label, known: true, warning: '' };
  const partial = SPECIES_FLAT.find(i =>
    i.key.includes(norm) || i.label.toLowerCase().includes(raw.trim().toLowerCase())
  );
  if (partial) return { value: partial.key, label: partial.label, known: true, warning: 'Auto-corrected to: ' + partial.label };
  let best = null, bestDist = Infinity;
  for (const item of SPECIES_FLAT) {
    const d = levenshtein(norm, item.key);
    if (d < bestDist) { bestDist = d; best = item; }
  }
  if (best && bestDist <= 2) return { value: best.key, label: best.label, known: true, warning: 'Did you mean: ' + best.label + '? Auto-corrected.' };
  return { value: raw.trim(), label: raw.trim(), known: false, warning: 'Species not in library. Engine will run in track-only mode.' };
}

const INIT = {
  speciesOverride:  '',
  speciesLabel:     '',
  speciesKnown:     false,
  speciesModalOpen: false,
  speciesSearch:    '',
  speciesWarning:   '',
  huntingPressure:  'none',
  freshness:        0.70,
  edgeClarity:      0.70,
  strideM:          '',
  nearWater:        false,
  onRidge:          false,
  denseCover:       false,
  waterType:        '',
  waterCondition:   '',
  terrainChannel:   '',
  zoneTag:          '',
  lightPhase:       '',
  weatherCode:      '',
  gait:             '',
  substrate:        '',
  behavior:         '',
  signTags:         [],
  fieldNotes:       '',
  envExpanded:      false,
  confidence:       0.80,
};

function reducer(s, a) {
  switch (a.type) {
    case 'SET':    return { ...s, [a.k]: a.v };
    case 'TOGGLE': return { ...s, [a.k]: !s[a.k] };
    case 'TOGGLE_TAG': {
      const t = s.signTags.includes(a.tag)
        ? s.signTags.filter(x => x !== a.tag)
        : [...s.signTags, a.tag];
      return { ...s, signTags: t };
    }
    case 'SPECIES_SELECT': return {
      ...s,
      speciesOverride:  a.key,
      speciesLabel:     a.label,
      speciesKnown:     true,
      speciesModalOpen: false,
      speciesSearch:    '',
      speciesWarning:   '',
    };
    case 'SPECIES_CLEAR': return {
      ...s,
      speciesOverride:  '',
      speciesLabel:     '',
      speciesKnown:     false,
      speciesModalOpen: false,
      speciesSearch:    '',
      speciesWarning:   '',
    };
    case 'SPECIES_TEXT': return {
      ...s,
      speciesOverride: a.value,
      speciesLabel:    a.label ?? a.value,
      speciesKnown:    a.known ?? false,
      speciesWarning:  a.warning ?? '',
    };
    case 'RESET_INPUTS': return { ...INIT };
    default: return s;
  }
}

function SectionHead({ title, sub }) {
  return (
    <View style={st.sHead}>
      <View style={st.sAccent} />
      <View>
        <Text style={st.sTitle}>{title}</Text>
        {sub ? <Text style={st.sSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function PillRow({ label, opts, selected, onSelect }) {
  return (
    <View style={st.pillSection}>
      {label ? <Text style={st.fieldLabel}>{label}</Text> : null}
      <View style={st.pillWrap}>
        {opts.map(o => {
          const on = selected === o;
          return (
            <TouchableOpacity
              key={o}
              style={[st.pill, on && st.pillOn]}
              onPress={() => onSelect(on ? '' : o)}
            >
              <Text style={[st.pillTxt, on && st.pillTxtOn]}>
                {o.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SliderField({ label, value, onChange }) {
  const pct = Math.round(value * 100);
  return (
    <View style={st.sliderField}>
      <View style={st.sliderMeta}>
        <Text style={st.fieldLabel}>{label}</Text>
        <Text style={[st.fieldLabel, { color: C.accent }]}>{pct}%</Text>
      </View>
      <TouchableOpacity
        activeOpacity={1}
        style={st.sliderTrack}
        onPress={e => {
          const r = Math.max(0, Math.min(1, e.nativeEvent.locationX / (W - 64)));
          onChange(parseFloat(r.toFixed(2)));
        }}
      >
        <View style={[st.sliderFill, { width: `${pct}%` }]} />
        <View style={[st.sliderThumb, { left: `${Math.max(0, Math.min(96, pct))}%` }]} />
      </TouchableOpacity>
    </View>
  );
}

function SpeciesDropdown({ selected, label, known, warning, search, onOpen, onClear, onSearch, onSelect, onClose, onTextChange, onTextBlur, modalOpen }) {
  const filtered = search.trim().length > 1
    ? SPECIES_FLAT.filter(i =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.key.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  return (
    <>
      <TouchableOpacity style={[st.input, st.speciesTrigger]} onPress={onOpen} activeOpacity={0.7}>
        <Text style={known ? st.speciesTriggerVal : st.speciesTriggerPlaceholder} numberOfLines={1}>
          {known && label ? label : 'Browse species list'}
        </Text>
        <Text style={st.speciesChevron}>LIST</Text>
      </TouchableOpacity>

      <Text style={[st.fieldLabel, { marginTop: 10 }]}>OR TYPE NAME DIRECTLY</Text>
      <TextInput
        style={[st.input, known && !warning && st.speciesInputKnown, warning && st.speciesInputWarn]}
        value={known && label ? label : selected}
        onChangeText={onTextChange}
        onBlur={onTextBlur}
        placeholder="e.g. Black-tailed Deer or Elk"
        placeholderTextColor={C.textDim}
        autoCapitalize="words"
        autoCorrect={false}
      />

      {!!warning && (
        <View style={st.speciesFeedbackBox}>
          <Text style={st.speciesWarnTxt}>! {warning}</Text>
        </View>
      )}
      {known && !warning && !!selected && (
        <View style={st.speciesFeedbackBoxOk}>
          <Text style={st.speciesOkTxt}>OK  Profile matched: {label}</Text>
          <Text style={st.speciesOkSub}>Engine will use this species profile</Text>
        </View>
      )}
      {!known && !warning && !!selected && selected.length > 2 && (
        <View style={st.speciesFeedbackBox}>
          <Text style={st.speciesWarnTxt}>Tap away when done typing to validate</Text>
        </View>
      )}

      {(known || !!selected) && (
        <TouchableOpacity style={st.speciesClear} onPress={onClear}>
          <Text style={st.speciesClearTxt}>CLEAR  -  LET ENGINE DECIDE</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <View style={st.modalHeader}>
              <Text style={st.modalTitle}>SELECT SPECIES</Text>
              <TouchableOpacity onPress={onClose} style={st.modalCloseBtn}>
                <Text style={st.modalCloseTxt}>CANCEL</Text>
              </TouchableOpacity>
            </View>
            <View style={st.modalSearchWrap}>
              <TextInput
                style={st.modalSearch}
                value={search}
                onChangeText={onSearch}
                placeholder="Search species..."
                placeholderTextColor={C.textDim}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity style={st.modalUnknown} onPress={onClear}>
              <Text style={st.modalUnknownTxt}>UNKNOWN  /  LET ENGINE DECIDE</Text>
              <Text style={st.modalUnknownSub}>Engine infers species from track data</Text>
            </TouchableOpacity>
            <FlatList
              data={filtered
                ? filtered.map(i => ({ type: 'item', ...i }))
                : SPECIES_GROUPS.flatMap(g => [
                    { type: 'header', group: g.group },
                    ...g.items.map(i => ({ type: 'item', ...i, group: g.group })),
                  ])
              }
              keyExtractor={(item, idx) => item.key ?? (item.group + idx)}
              renderItem={({ item }) => {
                if (item.type === 'header') return <Text style={st.modalGroupHeader}>{item.group}</Text>;
                const active = selected === item.key;
                return (
                  <TouchableOpacity
                    style={[st.modalItem, active && st.modalItemOn]}
                    onPress={() => onSelect(item.key, item.label)}
                  >
                    <Text style={[st.modalItemTxt, active && st.modalItemTxtOn]}>{item.label}</Text>
                    {active && <Text style={st.modalItemCheck}>OK</Text>}
                  </TouchableOpacity>
                );
              }}
              style={st.modalList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function InputsScreen() {
  const [s, dispatch] = useReducer(reducer, INIT);
  const set = useCallback((k, v) => dispatch({ type: 'SET', k, v }), [dispatch]);

  const {
    sessionTrackCount: hookSessionTrackCount,
    addTrack:          hookAddTrack,
    clearSession:      hookClearSession,
    setInputState,
  } = useSnac();

  const { system: units, toggle: toggleUnits } = useUnits();

  useEffect(() => {
    if (!setInputState) return;
    let strideMForEngine = s.strideM;
    if (units === 'imperial' && s.strideM) {
      const inches = parseFloat(s.strideM);
      if (!isNaN(inches)) strideMForEngine = (inches * 0.0254).toFixed(3);
    }
    setInputState({ ...s, strideM: strideMForEngine });
  }, [s, setInputState, units]);

  const handleAddTrack = useCallback(() => {
    hookAddTrack({ ...s, localHour: new Date().getHours(), _timestamp: Date.now() });
    Alert.alert('Track Added', `${hookSessionTrackCount + 1} track${hookSessionTrackCount + 1 > 1 ? 's' : ''} logged this session.`);
  }, [s, hookAddTrack, hookSessionTrackCount]);

  const stridePlaceholder = units === 'imperial' ? 'e.g. 33  (inches)' : 'e.g. 0.85  (metres)';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={st.header}>
        <Text style={st.headerWordmark}>SNAC</Text>
        <Text style={st.headerSub}>FIELD INTELLIGENCE</Text>
      </View>

      <View style={st.unitsBar}>
        <Text style={[st.unitsLabel, units === 'metric' && st.unitsLabelActive]}>METRIC</Text>
        <TouchableOpacity
          style={[st.unitsTrack, units === 'imperial' && st.unitsTrackOn]}
          onPress={toggleUnits}
          activeOpacity={0.8}
        >
          <View style={[st.unitsThumb, units === 'imperial' && st.unitsThumbOn]} />
        </TouchableOpacity>
        <Text style={[st.unitsLabel, units === 'imperial' && st.unitsLabelActive]}>IMPERIAL</Text>
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Hunting Pressure */}
        <View style={st.card}>
          <SectionHead title="SESSION PRESSURE" sub="Set once - affects all tracks this session" />
          <View style={st.pillWrap}>
            {['none','light','moderate','heavy'].map(p => {
              const on = s.huntingPressure === p;
              const col = p === 'heavy' ? C.accentRed : p === 'moderate' ? C.accentWarm : C.accent;
              return (
                <TouchableOpacity key={p} style={[st.pill, on && { borderColor: col, backgroundColor: col + '22' }]} onPress={() => set('huntingPressure', p)}>
                  <Text style={[st.pillTxt, on && { color: col }]}>{p.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Species */}
        <View style={st.card}>
          <SectionHead title="SPECIES" sub="Select or let engine decide from track data" />
          <SpeciesDropdown
            selected={s.speciesOverride}
            label={s.speciesLabel}
            known={s.speciesKnown}
            warning={s.speciesWarning}
            search={s.speciesSearch}
            modalOpen={s.speciesModalOpen}
            onOpen={() => set('speciesModalOpen', true)}
            onClose={() => set('speciesModalOpen', false)}
            onSearch={v => set('speciesSearch', v)}
            onSelect={(key, label) => dispatch({ type: 'SPECIES_SELECT', key, label })}
            onClear={() => dispatch({ type: 'SPECIES_CLEAR' })}
            onTextChange={v => dispatch({ type: 'SPECIES_TEXT', value: v, label: '', known: false, warning: '' })}
            onTextBlur={() => {
              if (!s.speciesOverride) return;
              const r = validateSpeciesText(s.speciesOverride);
              dispatch({ type: 'SPECIES_TEXT', value: r.value, label: r.label, known: r.known, warning: r.warning });
            }}
          />
          <SliderField label="DETECTION CONFIDENCE" value={s.confidence ?? 0.80} onChange={v => set('confidence', v)} />
        </View>

        {/* Track Metrics */}
        <View style={st.card}>
          <SectionHead title="TRACK METRICS" sub="Adjust to match what you see" />
          <SliderField label="FRESHNESS"    value={s.freshness}   onChange={v => set('freshness', v)} />
          <SliderField label="EDGE CLARITY" value={s.edgeClarity} onChange={v => set('edgeClarity', v)} />
          <Text style={[st.fieldLabel, { marginTop: 12 }]}>
            STRIDE LENGTH ({units === 'imperial' ? 'inches' : 'metres'})
          </Text>
          <TextInput
            style={st.input}
            value={s.strideM}
            onChangeText={v => set('strideM', v)}
            placeholder={stridePlaceholder}
            placeholderTextColor={C.textDim}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Environment */}
        <View style={st.card}>
          <TouchableOpacity style={st.expandRow} onPress={() => dispatch({ type: 'TOGGLE', k: 'envExpanded' })}>
            <SectionHead title="ENVIRONMENT" sub="Tap to expand field conditions" />
            <Text style={st.chevron}>{s.envExpanded ? 'v' : '>'}</Text>
          </TouchableOpacity>
          {s.envExpanded && (
            <View style={{ marginTop: 4 }}>
              <View style={st.toggleRow}>
                {[
                  { k: 'nearWater',  l: 'NEAR\nWATER' },
                  { k: 'onRidge',    l: 'RIDGE' },
                  { k: 'denseCover', l: 'DENSE\nCOVER' },
                ].map(({ k, l }) => (
                  <View key={k} style={st.toggleItem}>
                    <Text style={st.toggleLabel}>{l}</Text>
                    <Switch
                      value={s[k]}
                      onValueChange={() => dispatch({ type: 'TOGGLE', k })}
                      trackColor={{ false: C.border, true: C.accentDim }}
                      thumbColor={s[k] ? C.accent : C.textDim}
                    />
                  </View>
                ))}
              </View>
              <PillRow label="WATER TYPE"  opts={WATER_TYPE_OPTS} selected={s.waterType} onSelect={v => set('waterType', v)} />
              {s.waterType === 'ephemeral' && (
                <PillRow label="WATER CONDITION" opts={WATER_CONDITION_OPTS} selected={s.waterCondition} onSelect={v => set('waterCondition', v)} />
              )}
              <PillRow label="TERRAIN CHANNEL" opts={TERRAIN_CHANNEL_OPTS} selected={s.terrainChannel} onSelect={v => set('terrainChannel', v)} />
              <PillRow label="ZONE"        opts={ZONE_OPTS}      selected={s.zoneTag}     onSelect={v => set('zoneTag', v)} />
              <PillRow label="LIGHT PHASE" opts={LIGHT_OPTS}     selected={s.lightPhase}  onSelect={v => set('lightPhase', v)} />
              <PillRow label="WEATHER"     opts={WEATHER_OPTS}   selected={s.weatherCode} onSelect={v => set('weatherCode', v)} />
              <PillRow label="GAIT"        opts={GAIT_OPTS}      selected={s.gait}        onSelect={v => set('gait', v)} />
              <PillRow label="SUBSTRATE"   opts={SUBSTRATE_OPTS} selected={s.substrate}   onSelect={v => set('substrate', v)} />
              <PillRow label="BEHAVIOR"    opts={BEHAVIOR_OPTS}  selected={s.behavior}    onSelect={v => set('behavior', v)} />
            </View>
          )}
        </View>

        {/* Field Sign */}
        <View style={st.card}>
          <SectionHead title="FIELD SIGN" sub="Observed on site" />
          <View style={st.tagGrid}>
            {SIGN_TAGS.map(({ id, label }) => {
              const on = s.signTags.includes(id);
              return (
                <TouchableOpacity key={id} style={[st.tagChip, on && st.tagChipOn]} onPress={() => dispatch({ type: 'TOGGLE_TAG', tag: id })}>
                  <Text style={[st.tagLabel, on && st.tagLabelOn]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[st.fieldLabel, { marginTop: 14 }]}>FIELD NOTES</Text>
          <TextInput
            style={[st.input, st.notesInput]}
            value={s.fieldNotes}
            onChangeText={v => set('fieldNotes', v)}
            placeholder="Describe what you see..."
            placeholderTextColor={C.textDim}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Session bar */}
        <View style={st.sessionBar}>
          <View style={st.sessionBarLeft}>
            <Text style={st.sessionBarCount}>
              {hookSessionTrackCount > 0
                ? 'SESSION  ' + hookSessionTrackCount + ' TRACK' + (hookSessionTrackCount > 1 ? 'S' : '') + ' LOGGED'
                : 'SESSION  NO TRACKS LOGGED YET'}
            </Text>
            <Text style={st.sessionBarSub}>
              {hookSessionTrackCount > 0
                ? 'Go to WORKSPACE to analyse all ' + (hookSessionTrackCount + 1) + ' tracks'
                : 'Log multiple tracks for pattern analysis'}
            </Text>
          </View>
          <View style={st.sessionBarBtns}>
            <TouchableOpacity style={st.sessionAddBtn} onPress={handleAddTrack}>
              <Text style={st.sessionAddTxt}>+ ADD TRACK</Text>
            </TouchableOpacity>
            {hookSessionTrackCount > 0 && (
              <TouchableOpacity style={st.sessionClearBtn} onPress={hookClearSession}>
                <Text style={st.sessionClearTxt}>CLEAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  headerWordmark:{ fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 6, color: '#4EFF6E' },
  headerSub:     { fontFamily: MONO, fontSize: 9, letterSpacing: 4, color: '#7A917C', marginTop: 1 },
  unitsBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0F1210', borderBottomWidth: 1, borderBottomColor: '#1C211D', paddingVertical: 10, paddingHorizontal: 20 },
  unitsLabel:    { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#3A4A3C' },
  unitsLabelActive: { color: '#4EFF6E' },
  unitsTrack:    { width: 44, height: 24, borderRadius: 12, backgroundColor: '#1C211D', borderWidth: 1, borderColor: '#3A4A3C', justifyContent: 'center', paddingHorizontal: 2 },
  unitsTrackOn:  { backgroundColor: '#256B3533', borderColor: '#4EFF6E' },
  unitsThumb:    { width: 18, height: 18, borderRadius: 9, backgroundColor: '#3A4A3C' },
  unitsThumbOn:  { backgroundColor: '#4EFF6E', transform: [{ translateX: 20 }] },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  card:          { backgroundColor: '#0F1210', borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 16, marginBottom: 12 },
  sHead:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sAccent:       { width: 3, height: 18, backgroundColor: '#4EFF6E', borderRadius: 1 },
  sTitle:        { fontFamily: MONO, fontSize: 12, letterSpacing: 3, color: '#E2EAE3', fontWeight: '700' },
  sSub:          { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#7A917C', marginTop: 2 },
  fieldLabel:    { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C', marginBottom: 6 },
  input:         { backgroundColor: '#161A17', borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 10, color: '#E2EAE3', fontFamily: MONO, fontSize: 13, letterSpacing: 1 },
  notesInput:    { minHeight: 90, paddingTop: 10 },
  sliderField:   { marginBottom: 14 },
  sliderMeta:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sliderTrack:   { height: 20, justifyContent: 'center' },
  sliderFill:    { height: 2, backgroundColor: '#4EFF6E', position: 'absolute', left: 0, top: 9 },
  sliderThumb:   { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: '#4EFF6E', top: 3, marginLeft: -7 },
  pillSection:   { marginBottom: 12 },
  pillWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill:          { borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 9, paddingVertical: 5 },
  pillOn:        { borderColor: '#4EFF6E', backgroundColor: '#256B3533' },
  pillTxt:       { fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: '#3A4A3C' },
  pillTxtOn:     { color: '#4EFF6E' },
  toggleRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 8 },
  toggleItem:    { alignItems: 'center', flex: 1, gap: 6 },
  toggleLabel:   { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#7A917C', textAlign: 'center' },
  expandRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chevron:       { fontFamily: MONO, fontSize: 10, color: '#7A917C' },
  tagGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip:       { borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 7 },
  tagChipOn:     { borderColor: '#4EFF6E', backgroundColor: '#4EFF6E22' },
  tagLabel:      { fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: '#7A917C' },
  tagLabelOn:    { color: '#4EFF6E' },
  speciesTrigger:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  speciesTriggerVal:         { fontFamily: MONO, fontSize: 13, color: '#E2EAE3', letterSpacing: 1, flex: 1 },
  speciesTriggerPlaceholder: { fontFamily: MONO, fontSize: 12, color: '#3A4A3C', letterSpacing: 1, flex: 1 },
  speciesChevron:            { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#256B35', marginLeft: 8 },
  speciesInputKnown:         { borderColor: '#4EFF6E' },
  speciesInputWarn:          { borderColor: '#FFB84E' },
  speciesFeedbackBox:        { borderWidth: 1, borderColor: '#FFB84E', borderRadius: 3, padding: 10, marginTop: 6, backgroundColor: '#FFB84E11' },
  speciesFeedbackBoxOk:      { borderWidth: 1, borderColor: '#4EFF6E', borderRadius: 3, padding: 10, marginTop: 6, backgroundColor: '#4EFF6E11' },
  speciesWarnTxt:            { fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: '#FFB84E' },
  speciesOkTxt:              { fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: '#4EFF6E', fontWeight: '700' },
  speciesOkSub:              { fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: '#256B35', marginTop: 3 },
  speciesClear:              { alignSelf: 'flex-start', marginTop: 8, marginBottom: 4 },
  speciesClearTxt:           { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#3A4A3C' },
  modalOverlay:              { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet:                { backgroundColor: '#0F1210', borderTopWidth: 1, borderTopColor: '#344D37', borderTopLeftRadius: 8, borderTopRightRadius: 8, maxHeight: '88%' },
  modalHeader:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  modalTitle:                { fontFamily: MONO, fontSize: 12, letterSpacing: 4, color: '#E2EAE3', fontWeight: '700' },
  modalCloseBtn:             { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#1C211D', borderRadius: 3 },
  modalCloseTxt:             { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#7A917C' },
  modalSearchWrap:           { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  modalSearch:               { backgroundColor: '#161A17', borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 9, color: '#E2EAE3', fontFamily: MONO, fontSize: 12 },
  modalUnknown:              { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#344D37', backgroundColor: '#4EFF6E11' },
  modalUnknownTxt:           { fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: '#4EFF6E', fontWeight: '700' },
  modalUnknownSub:           { fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: '#7A917C', marginTop: 3 },
  modalList:                 { flex: 1 },
  modalGroupHeader:          { fontFamily: MONO, fontSize: 8, letterSpacing: 4, color: '#256B35', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6, backgroundColor: '#090B0A' },
  modalItem:                 { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1C211D', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalItemOn:               { backgroundColor: '#4EFF6E22' },
  modalItemTxt:              { fontFamily: MONO, fontSize: 12, letterSpacing: 1, color: '#7A917C' },
  modalItemTxtOn:            { color: '#4EFF6E' },
  modalItemCheck:            { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#4EFF6E' },
  sessionBar:                { backgroundColor: '#161A17', borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 14, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionBarLeft:            { flex: 1 },
  sessionBarCount:           { fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: '#4EFF6E', fontWeight: '700' },
  sessionBarSub:             { fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: '#3A4A3C', marginTop: 3 },
  sessionBarBtns:            { flexDirection: 'row', gap: 8, marginLeft: 10 },
  sessionAddBtn:             { borderWidth: 1, borderColor: '#4EFF6E', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 6 },
  sessionAddTxt:             { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#4EFF6E', fontWeight: '700' },
  sessionClearBtn:           { borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 10, paddingVertical: 6 },
  sessionClearTxt:           { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#7A917C' },
});