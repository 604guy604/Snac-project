<<<<<<< Updated upstream
# Snac-project
A passion project app for outdoorsman farmers pet owners and animal enthusists

## Business Model

- Free tier: 7-day free trial → subscription
- Core features: inference engine, manual track entry, species ID, behavior classification,
  results screen, harvest log, species library
- Competitor pricing anchor: $4.09/week or $20 lifetime (static guide app, not an engine)
- SNAC is an inference engine not a reference book - price accordingly
- Future revenue: Python backend as SaaS, guide licensing, species profile subscriptions
- NO paid tier UI built yet - subscription/trial flow is a future task

---

## Device and Environment Reality

- Primary device: Samsung Galaxy S25 FE - all development and testing
- Secondary: Acer Chromebook (borrowed, admin locked, Crosh only, no shell) - browser and copy-paste only
- No laptop, no admin access, no local terminal
- Expo Snack is the primary dev environment - all files flat at root (no folders)
- Expo Go SDK 54 on device for testing
- CRITICAL: @react-navigation/native-stack CANNOT be used in Expo Go SDK 54 bridgeless mode
  causes PlatformConstants TurboModule crash
- Navigation solution: Custom vertical right-side tab bar using local state (no navigation library)
- app.json is not editable in Snack - cannot set newArchEnabled:false

---

## SDK 54 Working package.json

```json
{
  "dependencies": {
    "expo": "~54.0.33",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "expo-sqlite": "~16.0.10",
    "expo-location": "~19.0.8",
    "expo-image-picker": "~17.0.10",
    "react-native-maps": "1.20.1",
    "@expo/vector-icons": "^15.0.3",
    "react-native-paper": "4.9.2",
    "react-native-screens": "~4.16.0",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "react-native-safe-area-context": "~5.6.0",
    "@react-native-community/netinfo": "11.4.1"
  }
}
```

NOTE: Do NOT add @react-navigation/native-stack - crashes Expo Go SDK 54.
NOTE: Expo auto-fixes dependency versions on save - let it.

---

## Current Navigation Architecture

App.js uses a custom vertical right-side tab bar (pure React Native, no navigation library):
- Four tabs: INPUTS / CAM / WORK / LIB
- Tabs sit on the right edge of screen vertically
- INPUTS and WORK tabs use green (#4EFF6E) active color
- LIB tab uses amber (#C8A84B) to distinguish it as reference
- Local state (useState) switches between screens
- WorkspaceScreen manages: workspace -> results -> harvest views internally
- Results and Harvest receive onBack/onDone as props, not useNavigation
- NEVER use useNavigation - it crashes without NavigationContainer

---

## Complete File Inventory (Snack - all flat at root)

### Phase 2 Core (stable, do not edit)
- App.js - Custom vertical 4-tab bar, SafeAreaProvider, insets via useSafeAreaInsets()
- SnacScreen.jsx - Legacy backup, not in active navigation
- SnacMapScreen.jsx - GPS sign map (future paid tier feature, untested)
- snac_master_deduped.js - 8 behavioral evaluators (271KB - do not edit)
- snac_profiles.js - 125 species profiles (do not edit - use snac_profile_enricher.js for patches)
- snac_profile_adapter.js - Profile normalization - outputs water_needs_l_per_day at top level
- snac_species_schema.js - Species data contract + 3 mock profiles (coyote, mule_deer, black_bear)
- snac_clustering_config.js - Clustering parameters
- snac_db.js - SQLite, 5 tables, user_prefs with units:'metric' default
- snac_sync.js - Supabase push/pull (needs env vars - currently silent fail)
- snac_weight_updater.js - +/-3% behavioral weight learning

### Phase 3 Engine Files
- Snac_substrate_decay.js (3.1, capital S - Snack renamed it)
- snac_input_schema.js (3.2)
- snac_inference_engine.js (3.3)
- Snac_weather_priors.js (3.4, capital S)
- Snac_hunting_pressure.js (3.5, capital S)
- snac_sensor_fusion.js (3.6)
- snac_confidence_layers.js (3.7)
- snac_session_memory.js (3.9) - NOTE: old broken file was snac_session_memory.js. with trailing dot
- snac_habitat_gps.js (3.10) - All 125 species, real bounding boxes, terrain matching

### Screen Files (4-tab UI)
- InputsScreen.jsx - All manual inputs, species picker, track metrics, env, sign tags,
  session bar, metric/imperial toggle switch
- CameraScreen.jsx - Photo capture, library picker, vision layer placeholder
- WorkspaceScreen.jsx - Analyse button, session memory display, DIFFERENT ANIMAL button,
  results/harvest local state navigation
- ResultsScreen.jsx - Full results display, session synthesis, habitat plausibility,
  receives onBack/onHarvest props
- HarvestScreen.jsx - Harvest logging, receives onBack/onDone props
- SpeciesScreen.jsx - Species library, 125 species grouped, search, detail view with
  track data, terrain, diet, predator/prey, clustering params, technical data toggle

### New Phase 3 Support Files
- useSnac.js - SINGLETON shared state pattern (module-level store, not per-component hook)
  Phase 3 full chain orchestration, session tracks, inputState shared across all screens
- snac_units.js - Metric/imperial conversion, useUnits() hook, persists to SQLite
  formatAdaptedTrackSize now outputs "Front Xcm  Rear Xcm" (not F/R)

---

## CRITICAL: useSnac.js Singleton Pattern

useSnac() is called in InputsScreen, WorkspaceScreen, ResultsScreen, HarvestScreen.
React hooks create isolated state per component - this would break shared state.
Solution: module-level _store object + listener registry.
All screens subscribe to the same store. setInputState() from InputsScreen is visible
to WorkspaceScreen's run() call. This is what makes the Analyse button work.

DO NOT revert to per-component hook pattern. The singleton is intentional.

---

## Phase 3 Engine Chain

User input + device sensors
    |
snac_input_schema.js (3.2) - Data contract, every field gets value/source/confidence/missing
    |
Snac_substrate_decay.js (3.1) - Correct age and distance for substrate conditions
    |
snac_inference_engine.js (3.3) - Fill missing values from species profile, migration calendar
    |
Snac_weather_priors.js (3.4) - Score conditions for movement likelihood, Open-Meteo API
    |
Snac_hunting_pressure.js (3.5) - Adjust priors based on pressure, gate morning window
    |
snac_sensor_fusion.js (3.6) - Resolve conflicts when signals disagree
    |
snac_confidence_layers.js (3.7) - Split into species/freshness/behavior/substrate layers
    |
snac_session_memory.js (3.9) - Session-level behavioral synthesis across multiple tracks
    |
snac_habitat_gps.js (3.10) - GPS plausibility scoring for species location
    |
snac_master_deduped.js - 8 behavioral evaluators receive enriched inputs
    |
Results

---

## Session Memory (3.9) - How It Works

analyzeSession() runs after every addTrack() and inside run().
follow_modifier from session memory multiplies against tracking_confidence.
1 track = rough idea, 2 similar = follow recommendation, 3+ = confirmed pattern.
Tracker always has final say via DIFFERENT ANIMAL button.

---

## Units System (snac_units.js)

useUnits() hook - reads/writes metric|imperial to SQLite user_prefs.
Exported functions (all require system param):
convertDistance(metres, system), convertTrackSize(cm, system),
convertStride(cm, system), convertWater(litres, system),
convertHomeRange(km2, system), formatTrackSizeRange(minCm, maxCm, system),
formatAdaptedTrackSize(trackSizeCm, system), formatDistance(metres, system)

Engine always receives and returns metric internally.
Imperial conversion happens at display layer only.

---

## Species Library (SpeciesScreen.jsx)

4th tab (LIB) - amber accent color to distinguish from engine tabs.
Pulls data live from getProfiles() - no duplication.
125 species grouped, searchable by common name, scientific name, or key.

Real profile field paths (CRITICAL - adapter output shape):
- terrain    → profile.behavior_research.primary_habitat (array)
- diet       → profile.diet (comma string or array)
- water      → profile.water_needs_l_per_day (number, via convertWater())
               fallback → profile.water_needs (string description)
- predators  → profile.predator_of (array, top level)
- prey       → profile.prey_of (array, top level)
- track size → profile.track_size_cm { front, hind } via formatAdaptedTrackSize()

Detail view shows:
- Track size (unit-aware), track depth, activity, home range (unit-aware)
- Migration distance, water needs (unit-aware), migratory flag
- Terrain pills (from behavior_research.primary_habitat)
- Diet pills
- Predator/prey relationships
- Tracking parameters (clustering data)
- Field notes
- Collapsible technical data (decay weights, flight/forage, denning, terrain weights)

---

## Known Issues and Technical Debt

- Species count log shows 127 (127 Grok + 3 mock) - should be 125
  Fix: snac_profiles.js line ~2672, update log line, remove mock merge loop
  (mocks are guarded with if(!_bundled[key]) so no engine impact - cosmetic only)
- SnacScreen.jsx still in project - legacy, not in active navigation, can be deleted eventually
- Snack auto-capitalizes some filenames (Snac_substrate_decay.js, Snac_weather_priors.js,
  Snac_hunting_pressure.js) - imports must match exactly including capital S
- snac_species_schema.js has broken filename entry "Snac_behavior_wiring #U00b7js" - unicode
  middot in filename, cannot be imported, harmless dead file
- Supabase env vars not configured - sync silent fails
- EAS build not set up
- Session memory (3.9) and Habitat GPS (3.10) wired but not field tested
- Weather API (Open-Meteo) not tested - requires GPS for location-aware call
- Wind direction (winddirection_10m from Open-Meteo) absent from weather priors - Phase 4 addition
- Vision layer (3.11) not written - requires Python backend

---

## Fixes Completed This Session (May 5 2026)

- water_needs_l_per_day now passes through snac_profile_adapter.js to adapted profile output
- SpeciesScreen: water needs displays in L/day via convertWater(), string fallback if no numeric value
- SpeciesScreen: terrain tags now pull from behavior_research.primary_habitat correctly
- SpeciesScreen: diet handles both comma string and array formats via toArray() helper
- SpeciesScreen: predator/prey uses profile.predator_of / profile.prey_of (top level arrays)
- SpeciesScreen: useUnits() destructured correctly as { system: units }
- SpeciesScreen: track size displays "Front Xcm  Rear Xcm" (was "F / R")
- InputsScreen: NEAR WATER / RIDGE / DENSE COVER toggles now spaced correctly (flex:1 per item)
- InputsScreen: toggle labels wrap with \n to prevent cramping on narrow screens
- App.js: SafeAreaView deprecation warning fixed - insets applied via useSafeAreaInsets() on root View

---

## What Works Right Now

- App loads on device, no crashes, 0 errors 0 warnings
- 4-tab vertical navigation (INPUTS/CAM/WORK/LIB)
- InputsScreen: species picker (125 species), pressure pills, freshness/edge clarity
  sliders, stride input, environment section (zone/light/weather/gait/substrate/behavior),
  sign tags, field notes, session bar with ADD TRACK, metric/imperial toggle
- CameraScreen: capture and library picker UI, vision layer placeholder
- WorkspaceScreen: session status, session memory synthesis card, migration flag,
  contradiction flag, DIFFERENT ANIMAL button, ANALYSE button, last result card
- ResultsScreen: recommendation badge, viability/decay chips, confidence %, session read,
  habitat plausibility card, species probability list, confidence layers, movement stats,
  behavior scores, detection, evidence signals, back/harvest actions
- HarvestScreen: confirm toggle, species/distance/notes fields, GPS stamp, contribute toggle
- SpeciesScreen: 125 species grouped list with search, full detail view with all data,
  water needs in L/day, terrain tags displaying, collapsible technical section
- Units toggle persists to SQLite, affects stride input conversion and display values
- End-to-end analyse confirmed working with real field inputs

---

## Phase 4 - Vision Layer

### Dataset Stack
- risashinoda/footprint_yolo (HuggingFace) - Pre-trained YOLOv11 weights trained on AnimalClue
  This is the starting point. Do not train from scratch.
- dahlian00/AnimalClue (GitHub) - 968 species, footprints/scat/eggs/bones/feathers, open source
  This is what competitor apps use. SNAC uses this PLUS iNaturalist.
- dahlian00/OpenAnimalTracks (GitHub) - Pure footprint recognition dataset, open source
- iNaturalist Open Dataset - Millions of real-world field photos, species-verified
  Pull only SNAC species list via iNaturalist API. This is SNAC's competitive edge -
  no other track app has trained on iNaturalist diversity.

### Phase 4 Coding Order

**4.1 - FastAPI Endpoint**
Write /analyze-image POST endpoint in Python backend.
Accepts photo, runs YOLO inference, returns species candidates with confidence scores.
This is the bridge between the phone and the model.
FastAPI server already scaffolded and confirmed live with health endpoint.

**4.2 - Load YOLO Weights**
Pull risashinoda/footprint_yolo weights from HuggingFace.
Load YOLOv11 into the endpoint.
Confirm inference runs on a test image before any fine-tuning.
Prove the pipeline exists before optimizing it.

**4.3 - Connect CameraScreen**
Wire CameraScreen to hit /analyze-image endpoint.
Photo goes up, species candidates come back, displayed in UI.
Pipeline is end-to-end even if accuracy is rough at this stage.

**4.4 - Feed Inference Engine**
Take YOLO species candidates and confidence scores.
Pass into existing inference engine as species input -
same input slots that manual species picker uses now.
ResultsScreen should render without any changes.

**4.5 - Fine-tune**
Pull AnimalClue and OpenAnimalTracks subsets for SNAC species list.
Pull iNaturalist images via API for gaps in coverage.
Build clean labeled image set for 125 species across substrate conditions:
mud, snow, sand, leaf litter, wet rock, packed dirt.
Fine-tune YOLO weights on this set. Target: exceed 70% accuracy.

**4.6 - Wind Direction**
Add winddirection_10m from Open-Meteo to weather priors.
Flagged as absent since Phase 3. Do this while in the Python backend anyway.

**4.7 - End-to-End Test**
Photo → YOLO → inference engine → Results screen.
Full pipeline live. This is the Phase 4 completion milestone.

### Phase 4 Requirements
- Requires proper machine (not Chromebook) for model training
- Python backend via GitHub Codespaces or local VS Code when machine available
- TensorFlow and OpenCV cannot run in Expo JS - must be Python backend
- CameraScreen has placeholder UI ready - no screen changes needed until 4.3
- Engine input schema slots are ready - no engine changes needed until 4.4

---

## Next Session Priority Queue

### CRITICAL FIRST
1. GitHub - confirm clean repo upload complete (The-Snac-project, private)

### Remaining Polish
2. Species count log 127→125 (two line edit in snac_profiles.js)
3. DIFFERENT ANIMAL button field test with session memory

### Features to Build
4. snac_profile_enricher.js - Profile patch system (new file, never edit snac_profiles.js)
5. Subscription/trial flow - 7 day free trial UI, paywall for premium features
6. Supabase env vars - configure for sync
7. EAS build setup - required before app store

### Phase 4 (needs proper machine)
8. Vision layer per Phase 4 coding order above
9. Python backend migration - JS files are proof of concept specs
10. SnacMapScreen - GPS sign map, needs subscription gate, untested

---

## Architecture Rules - Never Break These

1. Do not edit Phase 2 files - add Phase 3 as new files only
=======
# Sample Snack app

Open the `App.js` file to start writing some code. You can preview the changes directly on your phone or tablet by scanning the **QR code** or use the iOS or Android emulators. When you're done, click **Save** and share the link!

When you're ready to see everything that Expo provides (or if you want to use your own editor) you can **Download** your project and use it with [expo cli](https://docs.expo.dev/get-started/installation/#expo-cli)).

All projects created in Snack are publicly available, so you can easily share the link to this project via link, or embed it on a web page with the `<>` button.

If you're having problems, you can tweet to us [@expo](https://twitter.com/expo) or ask in our [forums](https://forums.expo.dev/c/expo-dev-tools/61) or [Discord](https://chat.expo.dev/).

Snack is Open Source. You can find the code on the [GitHub repo](https://github.com/expo/snack).
>>>>>>> Stashed changes
