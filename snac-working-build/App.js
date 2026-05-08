import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import InputsScreen    from './InputsScreen.jsx';
import CameraScreen    from './CameraScreen.jsx';
import WorkspaceScreen from './WorkspaceScreen.jsx';
import SpeciesScreen   from './SpeciesScreen.jsx';

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

function TabLayout() {
  const [active, setActive] = useState('Inputs');
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Inputs',    label: 'INPUTS', activeColor: '#4EFF6E' },
    { name: 'Camera',    label: 'CAM',    activeColor: '#4EFF6E' },
    { name: 'Workspace', label: 'WORK',   activeColor: '#4EFF6E' },
    { name: 'Species',   label: 'LIB',    activeColor: '#C8A84B' },
  ];

  const Screen = active === 'Inputs'    ? InputsScreen
               : active === 'Camera'    ? CameraScreen
               : active === 'Workspace' ? WorkspaceScreen
               : SpeciesScreen;

  return (
    <View style={[st.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={{ flex: 1 }}>
        <Screen />
      </View>
      <View style={st.tabBar}>
        {tabs.map(tab => {
          const on = active === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={[st.tab, on && { backgroundColor: tab.activeColor + '22' }]}
              onPress={() => setActive(tab.name)}
            >
              <Text style={[st.tabTxt, on && { color: tab.activeColor }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TabLayout />
    </SafeAreaProvider>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1, flexDirection: 'row', backgroundColor: '#090B0A' },
  tabBar: { width: 52, backgroundColor: '#0F1210', borderLeftWidth: 1, borderLeftColor: '#1C211D', justifyContent: 'center', alignItems: 'center', gap: 6 },
  tab:    { paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center', borderRadius: 3, width: 44 },
  tabTxt: { fontFamily: MONO, fontSize: 7, letterSpacing: 2, color: '#3A4A3C', fontWeight: '700', transform: [{ rotate: '90deg' }] },
});
