import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform
} from 'react-native';
import { useSnac } from './useSnac.js';
import { useUnits, formatDistance, convertHomeRange } from './snac_units.js';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

function BarRow({ label, value, color }) {
  const pct = Math.round((value ?? 0) * 100);
  return (
    <View style={st.barRow}>
      <Text style={st.barLabel}>{label}</Text>
      <View style={st.barTrack}>
        <View style={[st.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[st.barVal, { color }]}>{pct}</Text>
    </View>
  );
}

// onBack  -> WorkspaceScreen sets view back to 'workspace'
// onHarvest -> WorkspaceScreen sets view to 'harvest'
export default function ResultsScreen({ onBack, onHarvest }) {
  const { summary, decision, rawResult, confidenceLayers, probabilityList, clearSession } = useSnac();
  const { system: units } = useUnits();

  if (!decision || !summary) {
    return (
      <View style={[st.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#7A917C', fontFamily: MONO }}>No results yet. Run analysis first.</Text>
        <TouchableOpacity style={st.backBtn} onPress={onBack}>
          <Text style={st.backBtnTxt}>BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scores = rawResult?.behavior?.behavior_scores ?? {};
  const scoreColor = v => v >= 0.65 ? '#4EFF6E' : v >= 0.35 ? '#FFB84E' : '#7A917C';
  const viabilityColor = { hot: '#FF6B35', usable: '#FFB84E', low_value: '#3A4A3C' }[summary.viability_status] ?? '#3A4A3C';
  const decayColor = { slow_decay: '#4EFF6E', moderate_decay: '#FFB84E', fast_decay: '#FF4E4E' }[summary.decay_status] ?? '#7A917C';

  const rec = decision.recommendation ?? 'insufficient_data';
  const recMap = {
    high_probability_follow:     { t: 'HIGH - FOLLOW',     c: '#4EFF6E' },
    moderate_probability_follow: { t: 'MODERATE - FOLLOW', c: '#FFB84E' },
    low_probability_follow:      { t: 'LOW - PROCEED',     c: '#7A917C' },
    do_not_follow:               { t: 'DO NOT FOLLOW',     c: '#FF4E4E' },
    insufficient_data:           { t: 'INSUFFICIENT DATA', c: '#3A4A3C' },
  };
  const { t: recTxt, c: recColor } = recMap[rec] ?? recMap.insufficient_data;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={onBack}>
          <Text style={st.backBtnTxt}>BACK</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>RESULTS</Text>
        <TouchableOpacity style={st.newBtn} onPress={() => { clearSession(); onBack && onBack(); }}>
          <Text style={st.newBtnTxt}>NEW</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Decision card */}
        <View style={[st.decisionCard, { borderColor: recColor + '88' }]}>
          <View style={[st.recBadge, { borderColor: recColor }]}>
            <Text style={[st.recText, { color: recColor }]}>{recTxt}</Text>
          </View>
          <View style={st.chipRow}>
            <View style={[st.chip, { borderColor: viabilityColor }]}>
              <View style={[st.chipDot, { backgroundColor: viabilityColor }]} />
              <Text style={[st.chipTxt, { color: viabilityColor }]}>{(summary.viability_status ?? 'unknown').toUpperCase()}</Text>
            </View>
            <View style={[st.chip, { borderColor: decayColor }]}>
              <View style={[st.chipDot, { backgroundColor: decayColor }]} />
              <Text style={[st.chipTxt, { color: decayColor }]}>{(summary.decay_status ?? 'unknown').replace(/_/g,' ').toUpperCase()}</Text>
            </View>
          </View>
          <View style={st.confBlock}>
            <Text style={st.confBlockLabel}>TRACKING CONFIDENCE</Text>
            <Text style={st.confBlockVal}>
              {Math.round((decision.tracking_confidence ?? 0) * 100)}
              <Text style={st.confBlockPct}>%</Text>
            </Text>
          </View>
          {/* Session memory modifier note */}
          {decision.session_follow_mod && decision.session_follow_mod !== 1.0 && (
            <Text style={st.sessionModNote}>
              Session pattern applied: {decision.session_follow_mod > 1 ? '+' : ''}
              {Math.round((decision.session_follow_mod - 1) * 100)}% follow modifier
            </Text>
          )}
        </View>

        {/* Session synthesis */}
        {decision.session_synthesis ? (
          <View style={st.card}>
            <Text style={st.sectionTitle}>SESSION READ</Text>
            <Text style={st.synthesisText}>{decision.session_synthesis}</Text>
            {decision.session_direction && decision.session_direction !== 'unknown' && (
              <Text style={st.directionTag}>
                {decision.session_direction.replace(/_/g, ' ').toUpperCase()}
              </Text>
            )}
          </View>
        ) : null}

        {/* Habitat plausibility - only shown when scored (20 real species + GPS) */}
        {decision.habitat_scored && decision.habitat_plausibility != null ? (
          <View style={st.card}>
            <Text style={st.sectionTitle}>HABITAT PLAUSIBILITY</Text>
            <View style={st.habitatRow}>
              <Text style={st.habitatScore}>
                {Math.round(decision.habitat_plausibility * 100)}%
              </Text>
              <View style={{ flex: 1 }}>
                {decision.biome_inferred ? (
                  <Text style={st.habitatBiome}>{decision.biome_inferred.replace(/_/g,' ').toUpperCase()}</Text>
                ) : null}
                {decision.habitat_range_note ? (
                  <Text style={st.habitatNote}>{decision.habitat_range_note}</Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : decision.biome_inferred ? (
          <View style={st.card}>
            <Text style={st.sectionTitle}>BIOME</Text>
            <Text style={st.habitatBiome}>{decision.biome_inferred.replace(/_/g,' ').toUpperCase()}</Text>
            <Text style={st.habitatNote}>Habitat plausibility not yet scored for this species</Text>
          </View>
        ) : null}

        {/* Probability list */}
        {probabilityList?.length > 0 && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>SPECIES PROBABILITY</Text>
            {probabilityList.map((p, i) => (
              <View key={i} style={st.probRow}>
                <Text style={st.probLabel}>{p.label?.replace(/_/g,' ') ?? p.species_key}</Text>
                <View style={st.probBar}>
                  <View style={[st.probFill, { width: `${p.probability}%` }]} />
                </View>
                <Text style={st.probPct}>{p.probability}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Confidence layers */}
        {confidenceLayers && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>CONFIDENCE LAYERS</Text>
            {[
              { label: 'SPECIES',   layer: confidenceLayers.species },
              { label: 'FRESHNESS', layer: confidenceLayers.freshness },
              { label: 'BEHAVIOR',  layer: confidenceLayers.behavior },
              { label: 'SUBSTRATE', layer: confidenceLayers.substrate },
            ].map(({ label, layer }) => (
              <View key={label} style={st.layerRow}>
                <Text style={st.layerLabel}>{label}</Text>
                <Text style={[st.layerBadge, {
                  color: layer?.label === 'high' ? '#4EFF6E' : layer?.label === 'medium' ? '#FFB84E' : '#7A917C',
                  borderColor: layer?.label === 'high' ? '#4EFF6E' : layer?.label === 'medium' ? '#FFB84E' : '#1C211D',
                }]}>
                  {(layer?.label ?? 'none').toUpperCase()}
                </Text>
              </View>
            ))}
            {confidenceLayers.summary?.rut_note && (
              <Text style={st.rutNote}>{confidenceLayers.summary.rut_note}</Text>
            )}
          </View>
        )}

        {/* Movement */}
        <View style={st.card}>
          <Text style={st.sectionTitle}>MOVEMENT</Text>
          <View style={st.statGrid}>
            {[
              { val: decision.predicted_heading_deg != null ? `${decision.predicted_heading_deg}deg` : '-', lbl: 'HEADING' },
              { val: summary.estimated_travel_distance_m != null ? formatDistance(summary.estimated_travel_distance_m, units) : '-', lbl: 'EST RANGE' },
              { val: (summary.movement_pattern ?? '-').replace(/_/g,' ').toUpperCase(), lbl: 'PATTERN' },
              { val: (summary.primary_behavior ?? '-').replace(/_/g,' ').toUpperCase(), lbl: 'BEHAVIOR' },
            ].map(({ val, lbl }) => (
              <View key={lbl} style={st.statCell}>
                <Text style={st.statVal}>{val}</Text>
                <Text style={st.statLabel}>{lbl}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Behavior scores */}
        {Object.keys(scores).length > 0 && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>BEHAVIOR SCORES</Text>
            {Object.entries(scores).map(([key, val]) => (
              <BarRow key={key} label={key.replace(/_/g,' ').toUpperCase()} value={val} color={scoreColor(val)} />
            ))}
          </View>
        )}

        {/* Detection */}
        <View style={st.card}>
          <Text style={st.sectionTitle}>DETECTION</Text>
          {[
            ['SPECIES',       (summary.species_detected ?? []).join('  ').replace(/_/g,' ').toUpperCase() || '-'],
            ['CLUSTERS',      String(summary.cluster_count ?? 0)],
            ['MULTI-SPECIES', String(summary.multi_species_overlap_count ?? 0)],
          ].map(([lbl, val]) => (
            <View key={lbl} style={st.detRow}>
              <Text style={st.detLabel}>{lbl}</Text>
              <Text style={st.detVal}>{val}</Text>
            </View>
          ))}
        </View>

        {/* Evidence */}
        {summary.evidence?.length > 0 && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>EVIDENCE  ({summary.evidence.length} signals)</Text>
            {summary.evidence.slice(0, 12).map((e, i) => (
              <View key={i} style={st.evidenceRow}>
                <Text style={st.evidenceDot}>-</Text>
                <Text style={st.evidenceTxt}>{e}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={st.actionRow}>
          <TouchableOpacity style={st.actionSecondary} onPress={onBack}>
            <Text style={st.actionSecondaryTxt}>BACK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.actionPrimary} onPress={onHarvest}>
            <Text style={st.actionPrimaryTxt}>LOG HARVEST</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#090B0A' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  headerTitle:      { fontFamily: MONO, fontSize: 12, letterSpacing: 4, color: '#E2EAE3', fontWeight: '700' },
  backBtn:          { borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 6 },
  backBtnTxt:       { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#7A917C' },
  newBtn:           { borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 6 },
  newBtnTxt:        { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#7A917C' },
  scroll:           { flex: 1 },
  scrollContent:    { padding: 16 },
  decisionCard:     { backgroundColor: '#0F1210', borderWidth: 1, borderRadius: 4, padding: 20, marginBottom: 12 },
  recBadge:         { borderWidth: 1.5, borderRadius: 3, paddingVertical: 10, alignItems: 'center', marginBottom: 14 },
  recText:          { fontFamily: MONO, fontSize: 14, letterSpacing: 4, fontWeight: '700' },
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4 },
  chipDot:          { width: 5, height: 5, borderRadius: 3 },
  chipTxt:          { fontFamily: MONO, fontSize: 9, letterSpacing: 2 },
  confBlock:        { alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1C211D' },
  confBlockLabel:   { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C', marginBottom: 4 },
  confBlockVal:     { fontFamily: MONO, fontSize: 48, fontWeight: '700', color: '#4EFF6E', lineHeight: 56 },
  confBlockPct:     { fontSize: 20, color: '#256B35' },
  sessionModNote:   { fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: '#256B35', textAlign: 'center', marginTop: 8 },
  synthesisText:    { fontFamily: MONO, fontSize: 11, color: '#E2EAE3', lineHeight: 18 },
  directionTag:     { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#4EFF6E', marginTop: 10 },
  card:             { backgroundColor: '#0F1210', borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 16, marginBottom: 12 },
  sectionTitle:     { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C', marginBottom: 12 },
  probRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  probLabel:        { fontFamily: MONO, fontSize: 10, color: '#E2EAE3', width: 120 },
  probBar:          { flex: 1, height: 3, backgroundColor: '#1C211D', borderRadius: 2, overflow: 'hidden' },
  probFill:         { height: 3, backgroundColor: '#4EFF6E', borderRadius: 2 },
  probPct:          { fontFamily: MONO, fontSize: 10, color: '#7A917C', width: 36, textAlign: 'right' },
  layerRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  layerLabel:       { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#7A917C' },
  layerBadge:       { fontFamily: MONO, fontSize: 9, letterSpacing: 2, borderWidth: 1, borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  rutNote:          { fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: '#FFB84E', marginTop: 10, lineHeight: 16 },
  statGrid:         { flexDirection: 'row', flexWrap: 'wrap' },
  statCell:         { width: '50%', paddingVertical: 10, paddingRight: 8 },
  statVal:          { fontFamily: MONO, fontSize: 16, fontWeight: '700', color: '#E2EAE3', marginBottom: 3 },
  statLabel:        { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#7A917C' },
  barRow:           { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barLabel:         { fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: '#7A917C', width: 116 },
  barTrack:         { flex: 1, height: 3, backgroundColor: '#1C211D', borderRadius: 2, overflow: 'hidden' },
  barFill:          { height: 3, borderRadius: 2 },
  barVal:           { fontFamily: MONO, fontSize: 11, fontWeight: '700', width: 28, textAlign: 'right' },
  detRow:           { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  detLabel:         { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#7A917C' },
  detVal:           { fontFamily: MONO, fontSize: 11, color: '#E2EAE3', fontWeight: '700', letterSpacing: 1 },
  evidenceRow:      { flexDirection: 'row', gap: 8, marginBottom: 5 },
  evidenceDot:      { fontFamily: MONO, fontSize: 11, color: '#256B35', marginTop: 1 },
  evidenceTxt:      { fontFamily: MONO, fontSize: 10, letterSpacing: 0.5, color: '#7A917C', flex: 1, lineHeight: 16 },
  actionRow:        { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionSecondary:  { flex: 1, borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingVertical: 14, alignItems: 'center' },
  actionSecondaryTxt: { fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: '#7A917C' },
  actionPrimary:    { flex: 2, borderWidth: 1.5, borderColor: '#C8A84B', borderRadius: 3, paddingVertical: 14, alignItems: 'center', backgroundColor: '#C8A84B22' },
  actionPrimaryTxt: { fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: '#C8A84B', fontWeight: '700' },
  habitatRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  habitatScore:     { fontFamily: MONO, fontSize: 32, fontWeight: '700', color: '#4EFF6E', width: 64 },
  habitatBiome:     { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#E2EAE3', marginBottom: 4 },
  habitatNote:      { fontFamily: MONO, fontSize: 9, letterSpacing: 0.5, color: '#7A917C', lineHeight: 15 },
});
