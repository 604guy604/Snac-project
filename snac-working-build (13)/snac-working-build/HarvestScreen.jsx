import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Alert, Switch
} from 'react-native';
import * as Location from 'expo-location';
import { useSnac, useSnacHarvest } from './useSnac.js';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

// onBack -> WorkspaceScreen sets view back to 'results'
// onDone -> WorkspaceScreen clears session and sets view to 'workspace'
export default function HarvestScreen({ onBack, onDone }) {
  const { decision, summary, clearSession } = useSnac();
  const { submit } = useSnacHarvest();

  const [confirmed,   setConfirmed]   = useState(false);
  const [species,     setSpecies]     = useState(summary?.species_detected?.[0]?.replace(/_/g,' ') ?? '');
  const [distanceYds, setDistanceYds] = useState('');
  const [notes,       setNotes]       = useState('');
  const [gps,         setGps]         = useState(null);
  const [contribute,  setContribute]  = useState(true);
  const [timestamp]                   = useState(new Date().toISOString());

  const handleGps = useCallback(async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Location access needed to stamp harvest GPS.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGps({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    } catch (e) {
      Alert.alert('GPS error', e?.message ?? 'Could not get location');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!confirmed) {
      Alert.alert('Confirm Harvest', 'Check the harvest box first.');
      return;
    }
    try {
      await submit({ species, shotDistanceYds: distanceYds, notes, location: gps, contribute, timestamp });
    } catch (err) {
      console.warn('[SNAC] logHarvest failed:', err);
    }
    Alert.alert(
      'Harvest Logged',
      contribute
        ? 'Thank you - your data helps improve the model for every tracker using SNAC.'
        : 'Harvest saved locally.',
      [{ text: 'Done', onPress: () => { clearSession(); onDone && onDone(); } }]
    );
  }, [confirmed, species, distanceYds, notes, gps, contribute, timestamp, submit, clearSession, onDone]);

  return (
    <View style={st.root}>
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={onBack}>
          <Text style={st.backBtnTxt}>BACK</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>LOG HARVEST</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={st.subHeader}>
          <Text style={st.subConf}>
            Run confidence: {Math.round((decision?.tracking_confidence ?? 0) * 100)}%
          </Text>
          <Text style={st.subBehavior}>
            {(summary?.primary_behavior ?? 'unknown').replace(/_/g,' ').toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          style={[st.confirmRow, confirmed && st.confirmRowOn]}
          onPress={() => setConfirmed(!confirmed)}
        >
          <View style={[st.checkbox, confirmed && st.checkboxOn]}>
            {confirmed && <Text style={st.checkmark}>OK</Text>}
          </View>
          <Text style={[st.confirmLabel, confirmed && st.confirmLabelOn]}>
            ANIMAL HARVESTED
          </Text>
        </TouchableOpacity>

        {confirmed && (
          <>
            <View style={st.card}>
              <Text style={st.sectionTitle}>HARVEST DETAILS</Text>

              <Text style={st.fieldLabel}>SPECIES CONFIRMED</Text>
              <TextInput
                style={st.input}
                value={species}
                onChangeText={setSpecies}
                placeholder="Confirm species"
                placeholderTextColor="#3A4A3C"
                autoCapitalize="words"
              />

              <Text style={[st.fieldLabel, { marginTop: 12 }]}>SHOT DISTANCE (yds)</Text>
              <TextInput
                style={st.input}
                value={distanceYds}
                onChangeText={setDistanceYds}
                placeholder="e.g. 180"
                placeholderTextColor="#3A4A3C"
                keyboardType="decimal-pad"
              />

              <Text style={[st.fieldLabel, { marginTop: 12 }]}>HARVEST NOTES</Text>
              <TextInput
                style={[st.input, st.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Shot placement, animal condition, how the prediction held up..."
                placeholderTextColor="#3A4A3C"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={st.stampRow}>
                <View style={st.stampItem}>
                  <Text style={st.stampLabel}>TIMESTAMP</Text>
                  <Text style={st.stampVal}>{timestamp.slice(0,19).replace('T',' ')}</Text>
                </View>
                <View style={st.stampItem}>
                  <Text style={st.stampLabel}>GPS</Text>
                  <Text style={st.stampVal}>
                    {gps ? `${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}` : 'NOT CAPTURED'}
                  </Text>
                </View>
              </View>

              {!gps && (
                <TouchableOpacity style={st.gpsBtn} onPress={handleGps}>
                  <Text style={st.gpsBtnTxt}>+ CAPTURE GPS LOCATION</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={st.card}>
              <Text style={st.contributeThanks}>
                Sharing harvest data helps improve species profiles for every tracker using SNAC.
              </Text>
              <View style={st.contributeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={st.contributeLabel}>CONTRIBUTE TO MODEL</Text>
                  <Text style={st.contributeSub}>Anonymous  location fuzzed to 1km grid</Text>
                </View>
                <Switch
                  value={contribute}
                  onValueChange={setContribute}
                  trackColor={{ false: '#1C211D', true: '#5C4A1A' }}
                  thumbColor={contribute ? '#C8A84B' : '#3A4A3C'}
                />
              </View>
              {!contribute && (
                <Text style={st.optOutNote}>No problem - harvest saved locally only.</Text>
              )}
            </View>
          </>
        )}

        <View style={st.actionRow}>
          <TouchableOpacity style={st.actionSecondary} onPress={onBack}>
            <Text style={st.actionSecondaryTxt}>BACK</Text>
          </TouchableOpacity>
          {confirmed && (
            <TouchableOpacity style={st.actionPrimary} onPress={handleSubmit}>
              <Text style={st.actionPrimaryTxt}>SUBMIT LOG</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:             { flex: 1, backgroundColor: '#090B0A' },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  headerTitle:      { fontFamily: MONO, fontSize: 12, letterSpacing: 4, color: '#C8A84B', fontWeight: '700' },
  backBtn:          { borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 6 },
  backBtnTxt:       { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#7A917C' },
  scroll:           { flex: 1 },
  scrollContent:    { padding: 16 },
  subHeader:        { marginBottom: 16 },
  subConf:          { fontFamily: MONO, fontSize: 11, color: '#7A917C', letterSpacing: 1 },
  subBehavior:      { fontFamily: MONO, fontSize: 11, color: '#4EFF6E', letterSpacing: 2, marginTop: 2 },
  confirmRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 18, marginBottom: 12 },
  confirmRowOn:     { borderColor: '#C8A84B', backgroundColor: '#5C4A1A22' },
  checkbox:         { width: 24, height: 24, borderWidth: 1.5, borderColor: '#3A4A3C', borderRadius: 3, justifyContent: 'center', alignItems: 'center' },
  checkboxOn:       { borderColor: '#C8A84B', backgroundColor: '#5C4A1A' },
  checkmark:        { fontFamily: MONO, fontSize: 10, color: '#C8A84B', fontWeight: '700' },
  confirmLabel:     { fontFamily: MONO, fontSize: 14, letterSpacing: 4, color: '#7A917C', fontWeight: '700' },
  confirmLabelOn:   { color: '#C8A84B' },
  card:             { backgroundColor: '#0F1210', borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 16, marginBottom: 12 },
  sectionTitle:     { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C', marginBottom: 12 },
  fieldLabel:       { fontFamily: MONO, fontSize: 9, letterSpacing: 3, color: '#7A917C', marginBottom: 6 },
  input:            { backgroundColor: '#161A17', borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 12, paddingVertical: 10, color: '#E2EAE3', fontFamily: MONO, fontSize: 13 },
  notesInput:       { minHeight: 90, paddingTop: 10 },
  stampRow:         { flexDirection: 'row', gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#1C211D' },
  stampItem:        { flex: 1 },
  stampLabel:       { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#3A4A3C', marginBottom: 4 },
  stampVal:         { fontFamily: MONO, fontSize: 10, color: '#7A917C', letterSpacing: 1 },
  gpsBtn:           { borderWidth: 1, borderColor: '#344D37', borderRadius: 3, paddingVertical: 10, alignItems: 'center', marginTop: 12 },
  gpsBtnTxt:        { fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: '#256B35' },
  contributeThanks: { fontFamily: MONO, fontSize: 11, letterSpacing: 0.5, color: '#7A917C', lineHeight: 20, marginBottom: 16 },
  contributeRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contributeLabel:  { fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: '#C8A84B', fontWeight: '700' },
  contributeSub:    { fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: '#3A4A3C', marginTop: 3 },
  optOutNote:       { fontFamily: MONO, fontSize: 9, letterSpacing: 1, color: '#3A4A3C', marginTop: 10 },
  actionRow:        { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionSecondary:  { flex: 1, borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingVertical: 14, alignItems: 'center' },
  actionSecondaryTxt: { fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: '#7A917C' },
  actionPrimary:    { flex: 2, borderWidth: 1.5, borderColor: '#C8A84B', borderRadius: 3, paddingVertical: 14, alignItems: 'center', backgroundColor: '#C8A84B22' },
  actionPrimaryTxt: { fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: '#C8A84B', fontWeight: '700' },
});
