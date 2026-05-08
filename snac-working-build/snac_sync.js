import { getPendingSyncs, markSynced, markSyncFailed, getPref, setPref, saveProfileVersion } from './snac_db.js';
import { loadProfilesFromDB } from './snac_profiles.js';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const BATCH_SIZE        = 25;
const UPDATE_INTERVAL_DAYS = 14;
const ENDPOINTS = {
  runs:     SUPABASE_URL + '/rest/v1/snac_runs',
  harvests: SUPABASE_URL + '/rest/v1/snac_harvests',
  profiles: SUPABASE_URL + '/rest/v1/snac_profile_versions?select=*&order=created_at.desc&limit=1'
};

async function isOnline() {
  try {
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000)
    });
    return res.status === 204;
  } catch (e) {
    return false;
  }
}

async function supabasePost(endpoint, rows) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase not configured');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY, 'Prefer': 'return=minimal' },
    body: JSON.stringify(rows),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) throw new Error('Supabase POST ' + res.status);
}

async function supabaseGet(endpoint) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase not configured');
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY },
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error('Supabase GET ' + res.status);
  return res.json();
}

async function pushBatch(records) {
  const runs     = records.filter(r => r.table_name === 'runs');
  const harvests = records.filter(r => r.table_name === 'harvests');
  const pushed = [];
  const failed = [];
  for (const group of [{ items: runs, endpoint: ENDPOINTS.runs }, { items: harvests, endpoint: ENDPOINTS.harvests }]) {
    if (!group.items.length) continue;
    for (let i = 0; i < group.items.length; i += BATCH_SIZE) {
      const batch = group.items.slice(i, i + BATCH_SIZE);
      const rows  = batch.map(r => { try { return JSON.parse(r.payload); } catch (e) { return null; } }).filter(Boolean);
      try { await supabasePost(group.endpoint, rows); batch.forEach(r => pushed.push(r.id)); }
      catch (err) { batch.forEach(r => failed.push({ id: r.id, error: err.message })); }
    }
  }
  return { pushed, failed };
}

export async function syncPending() {
  if (!(await isOnline())) return { pushed: 0, failed: 0, skipped: 'offline' };
  let pending;
  try { pending = await getPendingSyncs(); } catch (err) { return { pushed: 0, failed: 0, skipped: 'db_error' }; }
  if (!pending || !pending.length) return { pushed: 0, failed: 0, skipped: 'nothing_pending' };
  const { pushed, failed } = await pushBatch(pending);
  for (const id of pushed) await markSynced([id]).catch(() => {});
  for (const item of failed) await markSyncFailed(item.id, item.error).catch(() => {});
  await setPref('last_sync_at', new Date().toISOString()).catch(() => {});
  return { pushed: pushed.length, failed: failed.length, skipped: null };
}

export async function pullProfileUpdate() {
  if (!(await isOnline())) return { updated: false, version: null, reason: 'offline' };
  try {
    const rows = await supabaseGet(ENDPOINTS.profiles);
    if (!rows || !rows.length) return { updated: false, version: null, reason: 'no_remote_profile' };
    const remote        = rows[0];
    const remoteVersion = remote.version_label || remote.id || 'unknown';
    const localVersion  = await getPref('current_profile_version').catch(() => null);
    if (localVersion && localVersion === remoteVersion) return { updated: false, version: remoteVersion, reason: 'already_current' };
    const profileData = remote.profiles || remote.profile_data;
    if (!profileData || typeof profileData !== 'object') return { updated: false, version: remoteVersion, reason: 'invalid_profile_data' };
    await saveProfileVersion(profileData, { versionLabel: remoteVersion, source: 'supabase_pull', pulledAt: new Date().toISOString() });
    await loadProfilesFromDB();
    await setPref('last_profile_pull', new Date().toISOString()).catch(() => {});
    await setPref('current_profile_version', remoteVersion).catch(() => {});
    return { updated: true, version: remoteVersion, reason: 'updated_ok' };
  } catch (err) {
    return { updated: false, version: null, reason: 'error: ' + err.message };
  }
}

export async function shouldCheckForUpdate() {
  try {
    const lastPull = await getPref('last_profile_pull');
    if (!lastPull) return true;
    const intervalDays = Number(await getPref('profile_update_interval_days')) || UPDATE_INTERVAL_DAYS;
    const elapsed = (Date.now() - new Date(lastPull).getTime()) / (1000 * 60 * 60 * 24);
    return elapsed >= intervalDays;
  } catch (e) {
    return true;
  }
}

export async function getSyncStatus() {
  try {
    const lastSyncAt            = await getPref('last_sync_at').catch(() => null);
    const lastProfilePull       = await getPref('last_profile_pull').catch(() => null);
    const currentProfileVersion = await getPref('current_profile_version').catch(() => null);
    const pending               = await getPendingSyncs().catch(() => []);
    const updateDue             = await shouldCheckForUpdate().catch(() => false);
    return { lastSyncAt, lastProfilePull, currentProfileVersion, pendingCount: pending ? pending.length : 0, updateDue };
  } catch (e) {
    return { lastSyncAt: null, lastProfilePull: null, currentProfileVersion: null, pendingCount: 0, updateDue: false };
  }
}