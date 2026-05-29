import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform
} from 'react-native';
import { useSnac } from './useSnac.js';
import { useUnits, formatDistance } from './snac_units.js';

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

export default function ResultsScreen({ onBack, onHarvest }) {
  const { summary, decision, rawResult, confidenceLayers, probabilityList, weatherResult, terrainAnchor, clearSession } = useSnac();
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

  // ---- weather helpers ----
  const moveColor = lbl => ({
    peak: '#4EFF6E', good: '#4EFF6E', moderate: '#FFB84E', slow: '#FF8A4E', poor: '#FF4E4E',
  }[lbl] ?? '#7A917C');

  const windArrow = card => ({
    N: '\u2193', NE: '\u2199', E: '\u2190', SE: '\u2196',
    S: '\u2191', SW: '\u2197', W: '\u2192', NW: '\u2198',
  }[card] ?? '');

  const fmtTemp = c => c == null ? '-' : `${Math.round(c)}\u00B0C`;
  const fmtWind = k => k == null ? '-' : `${Math.round(k)} km/h`;

  const scent = weatherResult?.scent_approach ?? null;

  // ---- terrain anchor helpers ----
  const ta = (terrainAnchor && terrainAnchor.has_terrain_data) ? terrainAnchor : null;
  const waterWindowColor = w => ({
    open:    '#4EFF6E',
    closing: '#FFB84E',
    closed:  '#FF8A4E',
    none:    '#7A917C',
  }[w] ?? '#7A917C');
  const waterWindowLabel = w => ({
    open:    'WINDOW OPEN',
    closing: 'WINDOW CLOSING',
    closed:  'WINDOW CLOSED',
    none:    'NO WATER',
  }[w] ?? '-');

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
          {decision.session_follow_mod && decision.session_follow_mod !== 1.0 && (
            <Text style={st.sessionModNote}>
              Session pattern applied: {decision.session_follow_mod > 1 ? '+' : ''}
              {Math.round((decision.session_follow_mod - 1) * 100)}% follow modifier
            </Text>
          )}
        </View>

        {/* ---- Phase 4.1: SCENT & APPROACH ---- */}
        {scent && (
          <View style={[st.scentCard, { borderColor: scent.hot ? '#FF6B35' : '#C8A84B' }]}>
            <View style={st.scentHeaderRow}>
              <Text style={[st.sectionTitle, { marginBottom: 0 }]}>SCENT & APPROACH</Text>
              {scent.hot && (
                <View style={st.hotBadge}>
                  <Text style={st.hotBadgeTxt}>HOT TRACK</Text>
                </View>
              )}
            </View>

            <View style={st.scentVectorRow}>
              <Text style={[st.scentArrow, { color: scent.hot ? '#FF6B35' : '#C8A84B' }]}>
                {windArrow(weatherResult.wind_direction_cardinal)}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={st.scentApproachLabel}>APPROACH FROM</Text>
                <Text style={[st.scentApproachVal, { color: scent.hot ? '#FF6B35' : '#C8A84B' }]}>
                  {scent.approach_cardinal ?? '-'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={st.scentApproachLabel}>SCENT CARRIES</Text>
                <Text style={st.scentToVal}>{scent.scent_to_cardinal ?? '-'}</Text>
              </View>
            </View>

            <Text style={st.scentAdvice}>{scent.advice}</Text>
          </View>
        )}

        {/* ---- Phase 4.2: TERRAIN ANCHORS ---- */}
        {ta && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>TERRAIN ANCHORS</Text>

            {/* Water feature */}
            {ta.water_type && ta.water_type !== 'none' && (
              <View style={st.terrainBlock}>
                <View style={st.terrainRowHeader}>
                  <Text style={st.terrainFeatureLabel}>
                    {ta.water_type === 'permanent' ? 'PERMANENT WATER' : 'EPHEMERAL WATER'}
                    {ta.water_condition ? ` - ${ta.water_condition.toUpperCase()}` : ''}
                  </Text>
                  <Text style={[st.terrainWindowBadge, {
                    color: waterWindowColor(ta.water_window),
                    borderColor: waterWindowColor(ta.water_window),
                  }]}>
                    {waterWindowLabel(ta.water_window)}
                  </Text>
                </View>
                <View style={st.terrainPullRow}>
                  <Text style={st.terrainPullLabel}>WATER PULL</Text>
                  <View style={st.terrainPullTrack}>
                    <View style={[st.terrainPullFill, {
                      width: `${Math.round((ta.water_pull ?? 0) * 100)}%`,
                      backgroundColor: waterWindowColor(ta.water_window),
                    }]} />
                  </View>
                  <Text style={[st.terrainPullPct, { color: waterWindowColor(ta.water_window) }]}>
                    {Math.round((ta.water_pull ?? 0) * 100)}%
                  </Text>
                </View>
              </View>
            )}

            {/* Channel */}
            {ta.terrain_channel && ta.terrain_channel !== 'flat' && (
              <View style={st.terrainBlock}>
                <Text style={st.terrainFeatureLabel}>
                  {ta.terrain_channel.toUpperCase()} - {(ta.channel_effect ?? '').replace(/_/g,' ').toUpperCase()}
                </Text>
                {ta.scent_channel_note && (
                  <Text style={st.terrainScentNote}>{ta.scent_channel_note}</Text>
                )}
              </View>
            )}

            {/* Follow modifier readout */}
            {ta.follow_modifier !== 0 && (
              <Text style={st.terrainModNote}>
                Terrain {ta.follow_modifier > 0 ? 'raises' : 'lowers'} follow value by {Math.abs(Math.round(ta.follow_modifier * 100))}%
              </Text>
            )}

            {/* Anchor notes */}
            {ta.anchor_notes?.length > 0 && (
              <View style={st.terrainNotes}>
                {ta.anchor_notes.map((n, i) => (
                  <View key={i} style={st.evidenceRow}>
                    <Text style={st.evidenceDot}>-</Text>
                    <Text style={st.evidenceTxt}>{n}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ---- Phase 4.0: WEATHER / CONDITIONS ---- */}
        {weatherResult && (
          <View style={st.card}>
            <Text style={st.sectionTitle}>CONDITIONS</Text>

            <View style={st.weatherHeadline}>
              <View style={{ flex: 1 }}>
                <Text style={st.weatherMoveLabel}>MOVEMENT</Text>
                <Text style={[st.weatherMoveVal, { color: moveColor(weatherResult.movement_label) }]}>
                  {(weatherResult.movement_label ?? 'unknown').toUpperCase()}
                </Text>
              </View>
              <View style={st.weatherMoveBarWrap}>
                <View style={st.weatherMoveBarTrack}>
                  <View style={[st.weatherMoveBarFill, {
                    width: `${Math.round((weatherResult.movement_likelihood ?? 0) * 100)}%`,
                    backgroundColor: moveColor(weatherResult.movement_label),
                  }]} />
                </View>
                <Text style={[st.weatherMovePct, { color: moveColor(weatherResult.movement_label) }]}>
                  {Math.round((weatherResult.movement_likelihood ?? 0) * 100)}%
                </Text>
              </View>
            </View>

            <View style={st.statGrid}>
              <View style={st.statCell}>
                <Text style={st.statVal}>{(weatherResult.condition ?? '-').replace(/_/g,' ').toUpperCase()}</Text>
                <Text style={st.statLabel}>CONDITION</Text>
              </View>
              <View style={st.statCell}>
                <Text style={st.statVal}>{fmtTemp(weatherResult.temperature_c)}</Text>
                <Text style={st.statLabel}>TEMP</Text>
              </View>
              <View style={st.statCell}>
                <Text style={st.statVal}>{fmtWind(weatherResult.wind_kmh)}</Text>
                <Text style={st.statLabel}>WIND SPEED</Text>
              </View>
              <View style={st.statCell}>
                <Text style={st.statVal}>
                  {weatherResult.wind_direction_cardinal
                    ? `${windArrow(weatherResult.wind_direction_cardinal)} ${weatherResult.wind_direction_cardinal}`
                    : '-'}
                </Text>
                <Text style={st.statLabel}>WIND DIR</Text>
              </View>
              <View style={st.statCell}>
                <Text style={st.statVal}>{(weatherResult.pressure_trend_label ?? '-').toUpperCase()}</Text>
                <Text style={st.statLabel}>PRESSURE</Text>
              </View>
              <View style={st.statCell}>
                <Text style={st.statVal}>{(weatherResult.moon_label ?? '-').replace(/_/g,' ').toUpperCase()}</Text>
                <Text style={st.statLabel}>MOON</Text>
              </View>
            </View>

            {weatherResult.notes?.length > 0 && (
              <View style={st.weatherNotes}>
                {weatherResult.notes.slice(0, 6).map((n, i) => (
                  <View key={i} style={st.evidenceRow}>
                    <Text style={st.evidenceDot}>-</Text>
                    <Text style={st.evidenceTxt}>{n}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

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

        {/* Habitat plausibility */}
        {decision.habitat_scored && decision.habitat_plausibility != null ? (
          <View style={st.card}>
            <Text style={st.sectionTitle}>HABITAT PLAUSIBILITY</Text>
            <View style={st.habitatRow}>
              <Text style={st.habitatScore}>{Math.round(decision.habitat_plausibility * 100)}%</Text>
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

  // ---- weather panel ----
  weatherHeadline:    { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  weatherMoveLabel:   { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#7A917C', marginBottom: 4 },
  weatherMoveVal:     { fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  weatherMoveBarWrap: { flex: 1, marginLeft: 12 },
  weatherMoveBarTrack:{ height: 4, backgroundColor: '#1C211D', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  weatherMoveBarFill: { height: 4, borderRadius: 2 },
  weatherMovePct:     { fontFamily: MONO, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  weatherNotes:       { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1C211D' },

  // ---- scent approach panel ----
  scentCard:        { backgroundColor: '#0F1210', borderWidth: 1.5, borderRadius: 4, padding: 16, marginBottom: 12 },
  scentHeaderRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  hotBadge:         { backgroundColor: '#FF6B3522', borderWidth: 1, borderColor: '#FF6B35', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3 },
  hotBadgeTxt:      { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#FF6B35', fontWeight: '700' },
  scentVectorRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  scentArrow:       { fontFamily: MONO, fontSize: 40, fontWeight: '700', lineHeight: 44 },
  scentApproachLabel:{ fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#7A917C', marginBottom: 3 },
  scentApproachVal: { fontFamily: MONO, fontSize: 24, fontWeight: '700', letterSpacing: 2 },
  scentToVal:       { fontFamily: MONO, fontSize: 16, fontWeight: '700', color: '#7A917C', letterSpacing: 1 },
  scentAdvice:      { fontFamily: MONO, fontSize: 11, color: '#E2EAE3', lineHeight: 18 },

  // ---- terrain anchor panel ----
  terrainBlock:        { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  terrainRowHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  terrainFeatureLabel: { fontFamily: MONO, fontSize: 10, letterSpacing: 1, color: '#E2EAE3', fontWeight: '700', flex: 1 },
  terrainWindowBadge:  { fontFamily: MONO, fontSize: 8, letterSpacing: 1, borderWidth: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3 },
  terrainPullRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  terrainPullLabel:    { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#7A917C', width: 70 },
  terrainPullTrack:    { flex: 1, height: 4, backgroundColor: '#1C211D', borderRadius: 2, overflow: 'hidden' },
  terrainPullFill:     { height: 4, borderRadius: 2 },
  terrainPullPct:      { fontFamily: MONO, fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
  terrainScentNote:    { fontFamily: MONO, fontSize: 9, letterSpacing: 0.5, color: '#FFB84E', lineHeight: 15, marginTop: 4 },
  terrainModNote:      { fontFamily: MONO, fontSize: 9, letterSpacing: 0.5, color: '#256B35', marginBottom: 8 },
  terrainNotes:        { marginTop: 4 },
});