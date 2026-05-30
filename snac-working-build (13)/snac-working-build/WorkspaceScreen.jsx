import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import * as Location from 'expo-location';
import { useSnac } from './useSnac.js';
import ResultsScreen from './ResultsScreen.jsx';
import HarvestScreen from './HarvestScreen.jsx';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export default function WorkspaceScreen() {
  const [view, setView] = useState('workspace');

  const {
    run,
    loading,
    error,
    sessionTrackCount,
    sessionMemory,
    sessionSummaryLine,
    inputState,
    setInputState,
    confidenceLayers,
    decision,
    summary,
    clearSession,
  } = useSnac();

  // Try to get GPS. Returns coords on success, null on deny/error.
  // NEVER blocks analysis - null is a valid result the engine handles.
  const captureGps = useCallback(async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch (err) {
      // GPS hardware off, no fix, timeout - all fall through to null
      return null;
    }
  }, []);

  const handleAnalyse = useCallback(async () => {
    let harvestGps = inputState?.harvestGps ?? null;

    // Try for GPS if we don't already have it - but don't block on failure
    if (!harvestGps) {
      harvestGps = await captureGps();
      if (harvestGps) {
        setInputState({
          ...(inputState ?? {}),
          harvestGps,
          harvestTimestamp: new Date().toISOString(),
        });
      }
    }

    // Run analysis whether or not we got GPS.
    // No GPS = engine skips biome/weather/scent layers and runs on track data.
    const result = await run({
      currentScreenState: {
        ...(inputState ?? {}),
        localHour: new Date().getHours(),
        harvestGps: harvestGps ?? null,
      },
      huntingPressure: inputState?.huntingPressure ?? 'none',
      gpsCoords: harvestGps
        ? { lat: harvestGps.latitude, lon: harvestGps.longitude }
        : null,
    });

    // If GPS was unavailable, let the user know location layers were skipped -
    // but only after results are ready, so it never blocks the workflow.
    if (result && !harvestGps) {
      Alert.alert(
        'Analysis Complete - No GPS',
        'Location was unavailable, so weather, habitat, and biome layers were skipped. Track analysis ran on your field data. Enable location for full environmental analysis.'
      );
    }

    if (result) setView('results');
  }, [run, inputState, setInputState, captureGps]);

  const handleDifferentAnimal = useCallback(() => {
    Alert.alert(
      'Different Animal?',
      sessionMemory?.false_reset_recommended
        ? 'The engine detected a contradiction in your tracks. Start a new session for this animal?'
        : 'Start tracking a different animal? Current session will be archived.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New Animal',
          style: 'destructive',
          onPress: () => clearSession(),
        },
      ]
    );
  }, [clearSession, sessionMemory]);

  if (view === 'results') {
    return <ResultsScreen onBack={() => setView('workspace')} onHarvest={() => setView('harvest')} />;
  }

  if (view === 'harvest') {
    return <HarvestScreen onBack={() => setView('results')} onDone={() => { clearSession(); setView('workspace'); }} />;
  }

  const hasResult      = !!decision && !!summary;
  const hasMem         = !!sessionMemory && sessionMemory.track_count > 0;
  const showFalseReset = sessionMemory?.false_reset_recommended;
  const showMigration  = sessionMemory?.migration_flag;
  const showDiffAnimal = sessionTrackCount > 0;

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.headerWordmark}>SNAC</Text>
        <Text style={st.headerSub}>WORKSPACE</Text>
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.body}>

        {/* Session status */}
        <View style={st.statusCard}>
          <Text style={st.statusLabel}>SESSION STATUS</Text>
          <View style={st.statusRow}>
            <View style={st.statusItem}>
              <Text style={st.statusVal}>{sessionTrackCount}</Text>
              <Text style={st.statusSub}>TRACKS LOGGED</Text>
            </View>
            <View style={st.statusItem}>
              <Text style={st.statusVal}>{inputState?.speciesLabel || 'AUTO'}</Text>
              <Text style={st.statusSub}>SPECIES</Text>
            </View>
            <View style={st.statusItem}>
              <Text style={[st.statusVal, { textTransform: 'uppercase' }]}>
                {inputState?.huntingPressure || 'NONE'}
              </Text>
              <Text style={st.statusSub}>PRESSURE</Text>
            </View>
          </View>
          {hasMem && (
            <Text style={st.sessionLine}>{sessionSummaryLine}</Text>
          )}
        </View>

        {/* Session memory synthesis */}
        {hasMem && sessionMemory.session_synthesis ? (
          <View style={st.synthesisCard}>
            <Text style={st.synthesisLabel}>SESSION READ</Text>
            <Text style={st.synthesisText}>{sessionMemory.session_synthesis}</Text>
            {sessionMemory.follow_modifier !== 1.0 && (
              <View style={st.modRow}>
                <Text style={st.modLabel}>FOLLOW MOD</Text>
                <Text style={[
                  st.modVal,
                  { color: sessionMemory.follow_modifier > 1 ? '#4EFF6E' : '#FF4E4E' }
                ]}>
                  {sessionMemory.follow_modifier > 1 ? '+' : ''}
                  {Math.round((sessionMemory.follow_modifier - 1) * 100)}%
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Migration flag */}
        {showMigration && (
          <View style={[st.flagCard, { borderColor: '#FFB84E' }]}>
            <Text style={[st.flagTxt, { color: '#FFB84E' }]}>
              MIGRATION FLAG — 5+ tracks, consistent direction
            </Text>
          </View>
        )}

        {/* False reset warning */}
        {showFalseReset && (
          <View style={[st.flagCard, { borderColor: '#FF4E4E' }]}>
            <Text style={[st.flagTxt, { color: '#FF4E4E' }]}>
              CONTRADICTION DETECTED — tracks may be a different animal
            </Text>
            <Text style={st.flagSub}>{sessionMemory.inconsistency_flag}</Text>
          </View>
        )}

        {/* Last result */}
        {hasResult && (
          <TouchableOpacity style={st.lastResultCard} onPress={() => setView('results')}>
            <Text style={st.lastResultLabel}>LAST RESULT  TAP TO VIEW</Text>
            <Text style={st.lastResultRec}>
              {(decision.recommendation ?? 'unknown').replace(/_/g, ' ').toUpperCase()}
            </Text>
            <Text style={st.lastResultConf}>
              {Math.round((decision.tracking_confidence ?? 0) * 100)}% confidence
              {'  //  '}
              {(summary.primary_behavior ?? 'unknown').replace(/_/g, ' ').toUpperCase()}
            </Text>
            {decision.session_follow_mod && decision.session_follow_mod !== 1.0 && (
              <Text style={st.lastResultMod}>
                Session mod applied: {decision.session_follow_mod > 1 ? '+' : ''}
                {Math.round((decision.session_follow_mod - 1) * 100)}%
              </Text>
            )}
          </TouchableOpacity>
        )}

        {!!error && (
          <View style={st.errorBox}>
            <Text style={st.errorTxt}>! {error}</Text>
          </View>
        )}

        {/* Analyse button */}
        <View style={st.analyseWrap}>
          {loading ? (
            <View style={st.runningWrap}>
              <ActivityIndicator color="#4EFF6E" size="small" />
              <Text style={st.runningTxt}>RUNNING ENGINE...</Text>
            </View>
          ) : (
            <TouchableOpacity style={st.analyseBtn} onPress={handleAnalyse} activeOpacity={0.8}>
              <Text style={st.analyseTxt}>
                {sessionTrackCount > 0
                  ? 'ANALYSE SESSION (' + (sessionTrackCount + 1) + ' TRACKS)'
                  : 'ANALYSE'}
              </Text>
              <View style={st.analyseGlow} />
            </TouchableOpacity>
          )}
        </View>

        {/* Different animal button - shows when tracks are logged */}
        {showDiffAnimal && !loading && (
          <TouchableOpacity
            style={[
              st.diffAnimalBtn,
              showFalseReset && { borderColor: '#FF4E4E', backgroundColor: '#FF4E4E11' }
            ]}
            onPress={handleDifferentAnimal}
            activeOpacity={0.7}
          >
            <Text style={[
              st.diffAnimalTxt,
              showFalseReset && { color: '#FF4E4E' }
            ]}>
              DIFFERENT ANIMAL
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#090B0A' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  headerWordmark:  { fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 6, color: '#4EFF6E' },
  headerSub:       { fontFamily: MONO, fontSize: 9, letterSpacing: 4, color: '#7A917C', marginTop: 1 },
  scroll:          { flex: 1 },
  body:            { padding: 20 },
  statusCard:      { backgroundColor: '#0F1210', borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 16, marginBottom: 12 },
  statusLabel:     { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C', marginBottom: 12 },
  statusRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem:      { alignItems: 'center', flex: 1 },
  statusVal:       { fontFamily: MONO, fontSize: 16, fontWeight: '700', color: '#E2EAE3', marginBottom: 4 },
  statusSub:       { fontFamily: MONO, fontSize: 7, letterSpacing: 2, color: '#3A4A3C' },
  sessionLine:     { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#4EFF6E', marginTop: 12, textAlign: 'center' },
  synthesisCard:   { backgroundColor: '#0F1210', borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 16, marginBottom: 12 },
  synthesisLabel:  { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C', marginBottom: 8 },
  synthesisText:   { fontFamily: MONO, fontSize: 11, color: '#E2EAE3', lineHeight: 18 },
  modRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1C211D' },
  modLabel:        { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C' },
  modVal:          { fontFamily: MONO, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  flagCard:        { borderWidth: 1, borderRadius: 3, padding: 12, marginBottom: 12 },
  flagTxt:         { fontFamily: MONO, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  flagSub:         { fontFamily: MONO, fontSize: 9, color: '#7A917C', marginTop: 4 },
  lastResultCard:  { backgroundColor: '#0F1210', borderWidth: 1, borderColor: '#344D37', borderRadius: 4, padding: 16, marginBottom: 12 },
  lastResultLabel: { fontFamily: MONO, fontSize: 8, letterSpacing: 3, color: '#256B35', marginBottom: 8 },
  lastResultRec:   { fontFamily: MONO, fontSize: 16, fontWeight: '700', color: '#4EFF6E', marginBottom: 4 },
  lastResultConf:  { fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: '#7A917C' },
  lastResultMod:   { fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: '#256B35', marginTop: 4 },
  errorBox:        { borderWidth: 1, borderColor: '#FF4E4E', borderRadius: 3, padding: 12, marginBottom: 12 },
  errorTxt:        { fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: '#FF4E4E' },
  analyseWrap:     { marginTop: 20 },
  analyseBtn:      { backgroundColor: '#256B3533', borderWidth: 1.5, borderColor: '#4EFF6E', borderRadius: 4, paddingVertical: 22, alignItems: 'center', overflow: 'hidden' },
  analyseTxt:      { fontFamily: MONO, fontSize: 16, letterSpacing: 6, color: '#4EFF6E', fontWeight: '700' },
  analyseGlow:     { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: '#4EFF6E55' },
  runningWrap:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 24 },
  runningTxt:      { fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: '#7A917C' },
  diffAnimalBtn:   { marginTop: 10, borderWidth: 1, borderColor: '#3A4A3C', borderRadius: 4, paddingVertical: 14, alignItems: 'center' },
  diffAnimalTxt:   { fontFamily: MONO, fontSize: 11, letterSpacing: 4, color: '#3A4A3C', fontWeight: '700' },
});