/**
 * SNAC UNITS - Metric / Imperial conversion
 *
 * Engine always works in metric internally.
 * This module converts for display only.
 *
 * Imperial field reality (Canadian trackers):
 *   Distance: yards under ~500, miles over
 *   Track size: inches
 *   Stride: inches
 *   Water: oz/day
 *   Home range: square miles
 *   Weight: lbs
 *
 * Metric:
 *   Distance: metres under 500, km over
 *   Track size: cm
 *   Stride: cm
 *   Water: L/day
 *   Home range: km²
 *
 * EXPORTS:
 *   convertDistance(metres, system)     → { value, unit, display } 
 *   convertTrackSize(cm, system)        → { value, unit, display }
 *   convertStride(cm, system)           → { value, unit, display }
 *   convertWater(litres, system)        → { value, unit, display }
 *   convertHomeRange(km2, system)       → { value, unit, display }
 *   formatDistance(metres, system)      → string e.g. "389m" or "425yds"
 *   formatTrackSize(cm, system)         → string e.g. "6-8cm" or '2.4-3.1"'
 *   useUnits()                          → React hook for reading/setting pref
 */

import { useState, useEffect, useCallback } from 'react';
import { getPref, setPref } from './snac_db.js';

// =============================================================================
// CONVERSION CONSTANTS
// =============================================================================

const M_TO_YD   = 1.09361;
const M_TO_MI   = 0.000621371;
const CM_TO_IN  = 0.393701;
const KM2_TO_MI2 = 0.386102;
const L_TO_OZ   = 33.814;

const SMART_DISTANCE_THRESHOLD_M  = 457; // ~500yds
const SMART_DISTANCE_THRESHOLD_KM = 0.5;

// =============================================================================
// CORE CONVERTERS
// Each returns { value: number, unit: string, display: string }
// =============================================================================

export function convertDistance(metres, system = 'metric') {
  if (metres == null || isNaN(metres)) return { value: null, unit: '', display: '—' };

  if (system === 'imperial') {
    if (metres < SMART_DISTANCE_THRESHOLD_M) {
      const yds = Math.round(metres * M_TO_YD);
      return { value: yds, unit: 'yds', display: `${yds}yds` };
    } else {
      const mi = (metres * M_TO_MI).toFixed(2);
      return { value: parseFloat(mi), unit: 'mi', display: `${mi}mi` };
    }
  }

  // Metric
  if (metres < SMART_DISTANCE_THRESHOLD_KM * 1000) {
    return { value: Math.round(metres), unit: 'm', display: `${Math.round(metres)}m` };
  } else {
    const km = (metres / 1000).toFixed(2);
    return { value: parseFloat(km), unit: 'km', display: `${km}km` };
  }
}

export function convertTrackSize(cm, system = 'metric') {
  if (cm == null || isNaN(cm)) return { value: null, unit: '', display: '—' };

  if (system === 'imperial') {
    const inches = (cm * CM_TO_IN).toFixed(1);
    return { value: parseFloat(inches), unit: '"', display: `${inches}"` };
  }
  return { value: cm, unit: 'cm', display: `${cm}cm` };
}

export function convertStride(cm, system = 'metric') {
  return convertTrackSize(cm, system);
}

export function convertWater(litres, system = 'metric') {
  if (litres == null || isNaN(litres)) return { value: null, unit: '', display: '—' };

  if (system === 'imperial') {
    const oz = Math.round(litres * L_TO_OZ);
    return { value: oz, unit: 'oz/day', display: `${oz} oz/day` };
  }
  return { value: litres, unit: 'L/day', display: `${litres} L/day` };
}

export function convertHomeRange(km2, system = 'metric') {
  if (km2 == null || isNaN(km2)) return { value: null, unit: '', display: '—' };

  if (system === 'imperial') {
    const mi2 = (km2 * KM2_TO_MI2).toFixed(2);
    return { value: parseFloat(mi2), unit: 'mi²', display: `${mi2} mi²` };
  }
  return { value: km2, unit: 'km²', display: `${km2} km²` };
}

// =============================================================================
// RANGE FORMATTERS (for track size ranges like "6-8cm")
// =============================================================================

export function formatTrackSizeRange(minCm, maxCm, system = 'metric') {
  if (minCm == null && maxCm == null) return '—';

  if (system === 'imperial') {
    const minIn = minCm != null ? (minCm * CM_TO_IN).toFixed(1) : null;
    const maxIn = maxCm != null ? (maxCm * CM_TO_IN).toFixed(1) : null;
    if (minIn && maxIn) return `${minIn}-${maxIn}"`;
    return `${minIn ?? maxIn}"`;
  }

  if (minCm != null && maxCm != null) return `${minCm}-${maxCm}cm`;
  return `${minCm ?? maxCm}cm`;
}

// Parse the adapted profile track_size_cm strings like "6-8" or "[6,8]"
export function formatAdaptedTrackSize(trackSizeCm, system = 'metric') {
  if (!trackSizeCm) return null;
  const front = trackSizeCm.front;
  const rear  = trackSizeCm.hind ?? trackSizeCm.rear;

  function parseRange(v) {
    if (!v) return null;
    if (typeof v === 'string') {
      const match = v.match(/([\d.]+)[^\d]+([\d.]+)/);
      if (match) return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
      const single = parseFloat(v);
      return isNaN(single) ? null : { min: single, max: single };
    }
    if (Array.isArray(v)) return { min: v[0], max: v[1] };
    return null;
  }

  const f = parseRange(front);
  const r = parseRange(rear);

  const fStr = f ? formatTrackSizeRange(f.min, f.max, system) : null;
  const rStr = r ? formatTrackSizeRange(r.min, r.max, system) : null;

  if (fStr && rStr) return `Front ${fStr}  Rear ${rStr}`;
  return fStr ?? rStr ?? null;
}

// Quick string formatter for distance
export function formatDistance(metres, system = 'metric') {
  return convertDistance(metres, system).display;
}

// =============================================================================
// REACT HOOK
// =============================================================================

export function useUnits() {
  const [system, setSystem] = useState('metric'); // 'metric' | 'imperial'
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPref('units')
      .then(val => {
        if (val === 'imperial' || val === 'metric') setSystem(val);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const toggle = useCallback(async () => {
    const next = system === 'metric' ? 'imperial' : 'metric';
    setSystem(next);
    try { await setPref('units', next); } catch (_e) { /* silent */ }
  }, [system]);

  const setUnits = useCallback(async (val) => {
    if (val !== 'metric' && val !== 'imperial') return;
    setSystem(val);
    try { await setPref('units', val); } catch (_e) { /* silent */ }
  }, []);

  return { system, toggle, setUnits, loaded };
}
