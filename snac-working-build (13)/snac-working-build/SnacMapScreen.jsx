import React, {
  useState, useEffect, useRef, useCallback, useMemo
} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Switch, Dimensions, Platform,
  Animated, PanResponder, ActivityIndicator, Alert
} from 'react-native';
import MapView, { Marker, Heatmap, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { initDB, getPref } from './snac_db.js';
import { getSyncStatus, syncPending } from './snac_sync.js';

const { width: SW, height: SH } = Dimensions.get('window');

const C = {
  bg:           '#0D0D0D',
  surface:      '#141414',
  surfaceHigh:  '#1C1C1C',
  border:       '#2A2A2A',
  borderHigh:   '#3A3A3A',
  text:         '#E8E4DC',
  textMuted:    '#8B8B7A',
  textFaint:    '#4A4A3A',
  accent:       '#8B5E3C',
  accentBright: '#C47840',
  accentGlow:   '#C4784022',
  green:        '#4A7C59',
  greenBright:  '#6AAF7A',
  amber:        '#B8860B',
  amberBright:  '#DAA520',
  red:          '#8B3A3A',
  redBright:    '#CC4444',
  blue:         '#3A5A8B',
  blueBright:   '#5A8ACC'
};

const SIGN_TAGS = [
  { id: 'track',        label: 'Track',         icon: '', color: C.accentBright },
  { id: 'scat',         label: 'Scat',           icon: '', color: C.amber        },
  { id: 'fresh_browse', label: 'Fresh Browse',   icon: '', color: C.green        },
  { id: 'rub_scrape',   label: 'Rub/Scrape',     icon: '', color: C.greenBright  },
  { id: 'bed',          label: 'Bed',            icon: '', color: C.textMuted    },
  { id: 'water',        label: 'Water Source',   icon: '', color: C.blueBright   },
  { id: 'trail',        label: 'Game Trail',     icon: '', color: C.textMuted    },
  { id: 'predator',     label: 'Predator Sign',  icon: '', color: C.redBright    },
  { id: 'harvest',      label: 'Harvest',        icon: '', color: C.accentBright },
  { id: 'human',        label: 'Human Pressure', icon: '', color: C.textFaint    }
];

const TAG_MAP = Object.fromEntries(SIGN_TAGS.map(t => [t.id, t]));

const MAP_DARK_STYLE = [
  { elementType: 'geometry',        stylers: [{ color: '#0D0D0D' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8B8B7A' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0D0D0D' }] },
  { featureType: 'administrative',  elementType: 'geometry', stylers: [{ color: '#2A2A2A' }] },
  { featureType: 'poi',             stylers: [{ visibility: 'off' }] },
  { featureType: 'road',            elementType: 'geometry', stylers: [{ color: '#1C1C1C' }] },
  { featureType: 'road',            elementType: 'geometry.stroke', stylers: [{ color: '#141414' }] },
  { featureType: 'road.highway',    elementType: 'geometry', stylers: [{ color: '#282828' }] },
  { featureType: 'transit',         stylers: [{ visibility: 'off' }] },
  { featureType: 'water',           elementType: 'geometry', stylers: [{ color: '#0A1520' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#111A0D' }] },
  { featureType: 'landscape.natural.terrain', elementType: 'geometry', stylers: [{ color: '#0F1A0C' }] }
];

function generateMockPins() {
  const BASE_LAT = 49.8, BASE_LON = -120.5;
  const pins = [];
  const tags = SIGN_TAGS.map(t => t.id);
  const species = ['blacktail_deer','mule_deer','black_bear','coyote','elk','moose'];

  for (let i = 0; i < 28; i++) {
    const tagId = tags[Math.floor(Math.random() * tags.length)];
    pins.push({
      id: `pin_${i}`,
      lat: BASE_LAT + (Math.random() - 0.5) * 0.18,
      lon: BASE_LON + (Math.random() - 0.5) * 0.28,
      tagId,
      species: species[Math.floor(Math.random() * species.length)],
      confidence: Number((0.6 + Math.random() * 0.4).toFixed(2)),
      freshness: Number((0.3 + Math.random() * 0.7).toFixed(2)),
      notes: '',
      timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      shared: Math.random() > 0.6
    });
  }
  return pins;
}

function formatAge(ts) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function freshnessColor(f) {
  if (f >= 0.75) return C.greenBright;
  if (f >= 0.50) return C.amberBright;
  return C.redBright;
}

function TagBadge({ tagId, size = 'sm' }) {
  const tag = TAG_MAP[tagId];
  if (!tag) return null;
  const isLg = size === 'lg';
  return (
    <View style={[styles.tagBadge, isLg && styles.tagBadgeLg, { borderColor: tag.color + '60' }]}>
      <Text style={[styles.tagIcon, isLg && styles.tagIconLg]}>{tag.icon}</Text>
      {isLg && <Text style={[styles.tagLabel, { color: tag.color }]}>{tag.label}</Text>}
    </View>
  );
}

function ConfidenceBar({ value, color }) {
  return (
    <View style={styles.confBarTrack}>
      <View style={[styles.confBarFill, { width: `${Math.round(value * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

function PinDetailSheet({ pin, onClose, onDelete }) {
  const tag = TAG_MAP[pin?.tagId];
  const slideY = useRef(new Animated.Value(SH)).current;

  useEffect(() => {
    Animated.spring(slideY, {
      toValue: 0, tension: 65, friction: 11, useNativeDriver: true
    }).start();
  }, []);

  const close = () => {
    Animated.timing(slideY, { toValue: SH, duration: 220, useNativeDriver: true }).start(onClose);
  };

  if (!pin) return null;

  return (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
      <View style={styles.sheetHandle} />

      <View style={styles.sheetHeader}>
        <TagBadge tagId={pin.tagId} size="lg" />
        <TouchableOpacity onPress={close} style={styles.sheetClose}>
          <Text style={styles.sheetCloseText}></Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sheetRow}>
        <Text style={styles.sheetSpecies}>{pin.species?.replace(/_/g,' ')}</Text>
        <Text style={[styles.sheetAge, { color: freshnessColor(pin.freshness) }]}>
          {formatAge(pin.timestamp)}
        </Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>CONFIDENCE</Text>
          <ConfidenceBar value={pin.confidence} color={C.accentBright} />
          <Text style={styles.metaValue}>{Math.round(pin.confidence * 100)}%</Text>
        </View>
        <View style={styles.metaCell}>
          <Text style={styles.metaLabel}>FRESHNESS</Text>
          <ConfidenceBar value={pin.freshness} color={freshnessColor(pin.freshness)} />
          <Text style={[styles.metaValue, { color: freshnessColor(pin.freshness) }]}>
            {Math.round(pin.freshness * 100)}%
          </Text>
        </View>
      </View>

      <View style={styles.coordRow}>
        <Text style={styles.coordText}>
          {pin.lat.toFixed(4)}N  {Math.abs(pin.lon).toFixed(4)}W
        </Text>
        {pin.shared && (
          <View style={styles.sharedBadge}>
            <Text style={styles.sharedBadgeText}>SHARED</Text>
          </View>
        )}
      </View>

      {Boolean(pin.notes) && (
        <Text style={styles.pinNotes}>{pin.notes}</Text>
      )}

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => Alert.alert('Delete Pin', 'Remove this pin?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => { onDelete(pin.id); close(); } }
        ])}
      >
        <Text style={styles.deleteBtnText}>Delete Pin</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AddPinModal({ coord, onAdd, onClose }) {
  const [selectedTag, setSelectedTag] = useState('track');
  const [notes, setNotes]             = useState('');
  const [share, setShare]             = useState(false);

  const confirm = () => {
    if (!coord) return;
    onAdd({
      id:         `pin_${Date.now()}`,
      lat:        coord.latitude,
      lon:        coord.longitude,
      tagId:      selectedTag,
      species:    '',
      confidence: 0.70,
      freshness:  1.0,
      notes,
      timestamp:  Date.now(),
      shared:     share
    });
    onClose();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>ADD SIGN PIN</Text>
          <Text style={styles.modalCoord}>
            {coord?.latitude.toFixed(5)}  {coord?.longitude.toFixed(5)}
          </Text>

          <Text style={styles.fieldLabel}>SIGN TYPE</Text>
          <View style={styles.tagGrid}>
            {SIGN_TAGS.map(tag => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => setSelectedTag(tag.id)}
                style={[
                  styles.tagOption,
                  selectedTag === tag.id && { borderColor: tag.color, backgroundColor: tag.color + '18' }
                ]}
              >
                <Text style={styles.tagOptionIcon}>{tag.icon}</Text>
                <Text style={[styles.tagOptionLabel, selectedTag === tag.id && { color: tag.color }]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. fresh scrape under pine, 3 tracks..."
            placeholderTextColor={C.textFaint}
            multiline
            maxLength={200}
          />

          <View style={styles.shareRow}>
            <View>
              <Text style={styles.shareLabel}>Share with group</Text>
              <Text style={styles.shareSubLabel}>Zone heatmap only - exact pin stays private</Text>
            </View>
            <Switch
              value={share}
              onValueChange={setShare}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={share ? C.accentBright : C.textMuted}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
              <Text style={styles.confirmBtnText}>Add Pin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterBar({ active, onToggle }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterBar}
      contentContainerStyle={styles.filterBarContent}
    >
      <TouchableOpacity
        onPress={() => onToggle('all')}
        style={[styles.filterChip, active === 'all' && styles.filterChipActive]}
      >
        <Text style={[styles.filterChipText, active === 'all' && styles.filterChipTextActive]}>
          ALL
        </Text>
      </TouchableOpacity>
      {SIGN_TAGS.map(tag => (
        <TouchableOpacity
          key={tag.id}
          onPress={() => onToggle(tag.id)}
          style={[
            styles.filterChip,
            active === tag.id && { borderColor: tag.color, backgroundColor: tag.color + '18' }
          ]}
        >
          <Text style={styles.filterChipIcon}>{tag.icon}</Text>
          <Text style={[
            styles.filterChipText,
            active === tag.id && { color: tag.color }
          ]}>
            {tag.label.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function StatsBar({ pins, syncStatus }) {
  const recentCount = pins.filter(p => Date.now() - p.timestamp < 24 * 3600000).length;
  const sharedCount = pins.filter(p => p.shared).length;

  return (
    <View style={styles.statsBar}>
      <View style={styles.statCell}>
        <Text style={styles.statValue}>{pins.length}</Text>
        <Text style={styles.statLabel}>TOTAL PINS</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statCell}>
        <Text style={[styles.statValue, { color: C.greenBright }]}>{recentCount}</Text>
        <Text style={styles.statLabel}>LAST 24H</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statCell}>
        <Text style={[styles.statValue, { color: C.blueBright }]}>{sharedCount}</Text>
        <Text style={styles.statLabel}>SHARED</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statCell}>
        <View style={[
          styles.syncDot,
          { backgroundColor: syncStatus?.pendingCount > 0 ? C.amberBright : C.greenBright }
        ]} />
        <Text style={styles.statLabel}>
          {syncStatus?.pendingCount > 0 ? `${syncStatus.pendingCount} PENDING` : 'SYNCED'}
        </Text>
      </View>
    </View>
  );
}

export default function SnacMapScreen({ onBack }) {
  const mapRef            = useRef(null);
  const [pins, setPins]   = useState(generateMockPins);
  const [region, setRegion] = useState({
    latitude:        49.8,
    longitude:       -120.5,
    latitudeDelta:   0.12,
    longitudeDelta:  0.20
  });
  const [selectedPin,   setSelectedPin]   = useState(null);
  const [addCoord,      setAddCoord]      = useState(null);
  const [filter,        setFilter]        = useState('all');
  const [showHeatmap,   setShowHeatmap]   = useState(false);
  const [locationReady, setLocationReady] = useState(false);
  const [syncStatus,    setSyncStatus]    = useState(null);
  const [syncing,       setSyncing]       = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setRegion(r => ({ ...r, latitude, longitude }));
      setLocationReady(true);
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.08, longitudeDelta: 0.12 }, 800);
    })();
  }, []);

  useEffect(() => {
    getSyncStatus().then(setSyncStatus).catch(() => {});
  }, []);

  const visiblePins = useMemo(() =>
    filter === 'all' ? pins : pins.filter(p => p.tagId === filter),
    [pins, filter]
  );

  const heatmapPoints = useMemo(() =>
    visiblePins.map(p => ({
      latitude:  p.lat,
      longitude: p.lon,
      weight:    p.freshness
    })),
    [visiblePins]
  );

  const handleLongPress = useCallback(e => {
    setAddCoord(e.nativeEvent.coordinate);
  }, []);

  const handleAddPin = useCallback(pin => {
    setPins(prev => [pin, ...prev]);
  }, []);

  const handleDeletePin = useCallback(id => {
    setPins(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleFilterToggle = useCallback(tagId => {
    setFilter(prev => prev === tagId ? 'all' : tagId);
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncPending();
      const status = await getSyncStatus();
      setSyncStatus(status);
    } finally {
      setSyncing(false);
    }
  }, []);

  const goToLocation = useCallback(async () => {
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateToRegion({
      latitude:      loc.coords.latitude,
      longitude:     loc.coords.longitude,
      latitudeDelta:  0.04,
      longitudeDelta: 0.07
    }, 600);
  }, []);

  return (
    <View style={styles.root}>

      {}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        customMapStyle={MAP_DARK_STYLE}
        initialRegion={region}
        onLongPress={handleLongPress}
        showsUserLocation={locationReady}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        mapType="terrain"
      >
        {}
        {showHeatmap && heatmapPoints.length > 0 && (
          <Heatmap
            points={heatmapPoints}
            radius={40}
            opacity={0.65}
            gradient={{
              colors:     ['#0A1520', '#3A5A8B', '#8B5E3C', '#C47840', '#DAA520'],
              startPoints:[0, 0.25, 0.5, 0.75, 1],
              colorMapSize: 256
            }}
          />
        )}

        {}
        {!showHeatmap && visiblePins.map(pin => {
          const tag = TAG_MAP[pin.tagId];
          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.lat, longitude: pin.lon }}
              onPress={() => setSelectedPin(pin)}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.marker, { borderColor: tag?.color ?? C.accent }]}>
                <Text style={styles.markerIcon}>{tag?.icon ?? ''}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {}
      <View style={styles.topBar}>
        {onBack && (
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <Text style={styles.backBtnText}> FIELD</Text>
          </TouchableOpacity>
        )}
        <View style={styles.topTitle}>
          <Text style={styles.titleText}>SIGN MAP</Text>
          <Text style={styles.titleSub}>Hold map to drop pin</Text>
        </View>
        <TouchableOpacity
          style={[styles.heatmapToggle, showHeatmap && styles.heatmapToggleActive]}
          onPress={() => setShowHeatmap(h => !h)}
        >
          <Text style={[styles.heatmapToggleText, showHeatmap && { color: C.amberBright }]}>
            {showHeatmap ? ' HEAT' : ' PINS'}
          </Text>
        </TouchableOpacity>
      </View>

      {}
      <FilterBar active={filter} onToggle={handleFilterToggle} />

      {}
      <StatsBar pins={visiblePins} syncStatus={syncStatus} />

      {}
      <View style={styles.fabGroup}>
        <TouchableOpacity style={styles.fabSecondary} onPress={handleSync} disabled={syncing}>
          {syncing
            ? <ActivityIndicator size="small" color={C.textMuted} />
            : <Text style={styles.fabSecondaryText}></Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabSecondary} onPress={goToLocation}>
          <Text style={styles.fabSecondaryText}></Text>
        </TouchableOpacity>
      </View>

      {}
      {selectedPin && (
        <PinDetailSheet
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onDelete={handleDeletePin}
        />
      )}

      {}
      {addCoord && (
        <AddPinModal
          coord={addCoord}
          onAdd={handleAddPin}
          onClose={() => setAddCoord(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: 16, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.bg + 'E8',
    borderBottomWidth: 1, borderBottomColor: C.border
  },
  backBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border, borderRadius: 4
  },
  backBtnText: { color: C.textMuted, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 },
  topTitle:  { alignItems: 'center' },
  titleText: { color: C.text, fontSize: 15, fontFamily: 'monospace', letterSpacing: 3, fontWeight: '700' },
  titleSub:  { color: C.textFaint, fontSize: 10, fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 },
  heatmapToggle: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: C.border, borderRadius: 4
  },
  heatmapToggleActive: { borderColor: C.amberBright + '80', backgroundColor: C.amberBright + '18' },
  heatmapToggleText: { color: C.textMuted, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1 },

  filterBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 108 : 92,
    left: 0, right: 0
  },
  filterBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 6, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, borderColor: C.border, borderRadius: 20,
    backgroundColor: C.surface + 'CC'
  },
  filterChipActive: { borderColor: C.accentBright, backgroundColor: C.accentGlow },
  filterChipIcon: { fontSize: 12 },
  filterChipText: { color: C.textMuted, fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5 },
  filterChipTextActive: { color: C.accentBright },

  statsBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.bg + 'F2',
    borderTopWidth: 1, borderTopColor: C.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 10
  },
  statCell:    { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },
  statValue:   { color: C.text, fontSize: 18, fontFamily: 'monospace', fontWeight: '700' },
  statLabel:   { color: C.textFaint, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },
  syncDot:     { width: 8, height: 8, borderRadius: 4 },

  fabGroup: {
    position: 'absolute', right: 16,
    bottom: Platform.OS === 'ios' ? 110 : 90,
    gap: 10
  },
  fabSecondary: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }
  },
  fabSecondaryText: { color: C.textMuted, fontSize: 18, fontFamily: 'monospace' },

  marker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surface + 'F0',
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }
  },
  markerIcon: { fontSize: 18 },

  tagBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 4, paddingHorizontal: 8,
    borderWidth: 1, borderRadius: 4,
    backgroundColor: C.surfaceHigh
  },
  tagBadgeLg: { paddingVertical: 6, paddingHorizontal: 12, gap: 8 },
  tagIcon:    { fontSize: 16 },
  tagIconLg:  { fontSize: 22 },
  tagLabel:   { fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, fontWeight: '600' },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.surface,
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderTopWidth: 1, borderColor: C.border,
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.border, alignSelf: 'center', marginBottom: 16
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sheetClose:  { padding: 8 },
  sheetCloseText: { color: C.textMuted, fontSize: 18 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetSpecies: { color: C.text, fontSize: 16, fontFamily: 'monospace', fontWeight: '600', textTransform: 'capitalize' },
  sheetAge:     { fontSize: 13, fontFamily: 'monospace' },
  metaGrid: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaCell: { flex: 1, gap: 5 },
  metaLabel: { color: C.textFaint, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },
  metaValue: { color: C.textMuted, fontSize: 13, fontFamily: 'monospace', fontWeight: '600' },
  confBarTrack: { height: 3, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  confBarFill:  { height: 3, borderRadius: 2 },
  coordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  coordText: { color: C.textFaint, fontSize: 11, fontFamily: 'monospace', letterSpacing: 0.5 },
  sharedBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, backgroundColor: C.blue + '40', borderWidth: 1, borderColor: C.blueBright + '60' },
  sharedBadgeText: { color: C.blueBright, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 },
  pinNotes: { color: C.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 14, fontStyle: 'italic' },
  deleteBtn: { paddingVertical: 12, borderRadius: 6, borderWidth: 1, borderColor: C.red, alignItems: 'center', marginTop: 4 },
  deleteBtnText: { color: C.redBright, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1 },

  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 20 },
  modalTitle: { color: C.text, fontSize: 14, fontFamily: 'monospace', letterSpacing: 3, fontWeight: '700', marginBottom: 4 },
  modalCoord: { color: C.textFaint, fontSize: 11, fontFamily: 'monospace', marginBottom: 20 },
  fieldLabel: { color: C.textFaint, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 8 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  tagOption: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6,
    borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 5
  },
  tagOptionIcon:  { fontSize: 14 },
  tagOptionLabel: { color: C.textMuted, fontSize: 11, fontFamily: 'monospace' },
  notesInput: {
    backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 6,
    color: C.text, fontSize: 13, fontFamily: 'monospace', padding: 12,
    minHeight: 64, textAlignVertical: 'top', marginBottom: 16
  },
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  shareLabel: { color: C.text, fontSize: 13, fontFamily: 'monospace' },
  shareSubLabel: { color: C.textFaint, fontSize: 10, fontFamily: 'monospace', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 6, borderWidth: 1, borderColor: C.border, alignItems: 'center' },
  cancelBtnText: { color: C.textMuted, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 6, backgroundColor: C.accent, alignItems: 'center' },
  confirmBtnText: { color: C.text, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1, fontWeight: '600' }
});