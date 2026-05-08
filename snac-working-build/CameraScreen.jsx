import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Alert, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSnac } from './useSnac.js';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

export default function CameraScreen() {
  const { photoUri, setPhotoUri } = useSnac();

  const handleCapture = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera permission required', 'Enable camera access in Settings.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setPhotoUri(res.assets[0].uri);
    }
  }, [setPhotoUri]);

  const handleLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Library permission required', 'Enable photo library access in Settings.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setPhotoUri(res.assets[0].uri);
    }
  }, [setPhotoUri]);

  return (
    <View style={st.root}>
      <View style={st.header}>
        <Text style={st.headerWordmark}>SNAC</Text>
        <Text style={st.headerSub}>TRACK CAPTURE</Text>
      </View>

      <View style={st.body}>
        {photoUri ? (
          <>
            <Image source={{ uri: photoUri }} style={st.preview} resizeMode="contain" />
            <View style={st.previewActions}>
              <Text style={st.previewLabel}>PHOTO LOADED</Text>
              <Text style={st.previewSub}>Photo will feed the engine on analysis</Text>
              <TouchableOpacity style={st.clearBtn} onPress={() => setPhotoUri(null)}>
                <Text style={st.clearBtnTxt}>CLEAR PHOTO</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={st.captureZone}>
              {/* Corner markers */}
              {['tl','tr','bl','br'].map(p => <View key={p} style={[st.corner, st[p]]} />)}
              <Text style={st.captureIcon}>+</Text>
              <Text style={st.captureLabel}>NO PHOTO LOADED</Text>
              <Text style={st.captureSub}>Capture or select a track photo</Text>
              <Text style={st.captureNote}>Future: auto-fills substrate, geometry, species ID</Text>
            </View>

            <View style={st.btnRow}>
              <TouchableOpacity style={st.captureBtn} onPress={handleCapture}>
                <Text style={st.captureBtnTxt}>CAPTURE TRACK</Text>
                <Text style={st.captureBtnSub}>Open camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={st.libraryBtn} onPress={handleLibrary}>
                <Text style={st.libraryBtnTxt}>FROM LIBRARY</Text>
                <Text style={st.libraryBtnSub}>Select existing photo</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={st.visionPlaceholder}>
          <Text style={st.visionLabel}>VISION LAYER</Text>
          <Text style={st.visionSub}>Phase 3.11 - Python backend required</Text>
          <Text style={st.visionNote}>
            Substrate classification  Track geometry  Species ID from photo
          </Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#090B0A' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 56 : 24, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1C211D' },
  headerWordmark: { fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 6, color: '#4EFF6E' },
  headerSub:      { fontFamily: MONO, fontSize: 9, letterSpacing: 4, color: '#7A917C', marginTop: 1 },
  body:           { flex: 1, padding: 20 },
  captureZone:    { height: 260, borderWidth: 1, borderColor: '#344D37', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1210', marginBottom: 20, position: 'relative' },
  corner:         { position: 'absolute', width: 16, height: 16, borderColor: '#4EFF6E' },
  tl:             { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2 },
  tr:             { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2 },
  bl:             { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2 },
  br:             { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2 },
  captureIcon:    { fontSize: 32, color: '#256B35', marginBottom: 12 },
  captureLabel:   { fontFamily: MONO, fontSize: 13, letterSpacing: 4, color: '#7A917C', fontWeight: '700', marginBottom: 6 },
  captureSub:     { fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: '#3A4A3C', marginBottom: 8 },
  captureNote:    { fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: '#1C211D', textAlign: 'center', paddingHorizontal: 20 },
  btnRow:         { flexDirection: 'row', gap: 12, marginBottom: 20 },
  captureBtn:     { flex: 1, borderWidth: 1.5, borderColor: '#4EFF6E', borderRadius: 4, paddingVertical: 18, alignItems: 'center', backgroundColor: '#4EFF6E11' },
  captureBtnTxt:  { fontFamily: MONO, fontSize: 12, letterSpacing: 3, color: '#4EFF6E', fontWeight: '700' },
  captureBtnSub:  { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#256B35', marginTop: 4 },
  libraryBtn:     { flex: 1, borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, paddingVertical: 18, alignItems: 'center' },
  libraryBtnTxt:  { fontFamily: MONO, fontSize: 12, letterSpacing: 3, color: '#7A917C', fontWeight: '700' },
  libraryBtnSub:  { fontFamily: MONO, fontSize: 8, letterSpacing: 2, color: '#3A4A3C', marginTop: 4 },
  preview:        { width: '100%', height: 280, borderRadius: 4, marginBottom: 16 },
  previewActions: { alignItems: 'center' },
  previewLabel:   { fontFamily: MONO, fontSize: 13, letterSpacing: 4, color: '#4EFF6E', fontWeight: '700', marginBottom: 4 },
  previewSub:     { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#7A917C', marginBottom: 16 },
  clearBtn:       { borderWidth: 1, borderColor: '#1C211D', borderRadius: 3, paddingHorizontal: 20, paddingVertical: 10 },
  clearBtnTxt:    { fontFamily: MONO, fontSize: 10, letterSpacing: 3, color: '#7A917C' },
  visionPlaceholder: { borderWidth: 1, borderColor: '#1C211D', borderRadius: 4, padding: 16, marginTop: 'auto' },
  visionLabel:    { fontFamily: MONO, fontSize: 10, letterSpacing: 4, color: '#256B35', fontWeight: '700', marginBottom: 4 },
  visionSub:      { fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#3A4A3C', marginBottom: 8 },
  visionNote:     { fontFamily: MONO, fontSize: 8, letterSpacing: 1, color: '#1C211D', lineHeight: 14 },
});
