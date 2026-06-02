import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath, pathToFileURL } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);

const PER_SPECIES_CAP = 200;
const OUTPUT_BASE = './data_prep/lila_out';
const TEMP_DIR = './data_prep/csv_temp';
const CSV_ZIP_URL = 'https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti/nacti_metadata.csv.zip';
const IMAGE_BASE_URL = 'https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti-unzipped/';

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function loadSnacLookup() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [path.join(process.cwd(), 'snac_profiles.js'), path.join(here, 'snac_profiles.js'), path.join(here, '..', 'snac_profiles.js')];
  const profilesPath = candidates.find(p => fs.existsSync(p));
  if (!profilesPath) throw new Error('snac_profiles.js not found: ' + candidates.join(' | '));
  const mod = await import(pathToFileURL(profilesPath).href);
  const profiles = mod.getProfiles();
  const lookup = {};
  for (const [key, prof] of Object.entries(profiles)) {
    for (const cand of [key, prof.common_name, prof.scientific_name]) {
      const n = normalize(cand);
      if (n && !(n in lookup)) lookup[n] = key;
    }
  }
  console.log('[SETUP] ' + Object.keys(profiles).length + ' species, ' + Object.keys(lookup).length + ' names');
  return lookup;
}

function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
  }
  out.push(cur); return out;
}

async function getCsv() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const existing = fs.readdirSync(TEMP_DIR).find(f => f.toLowerCase().endsWith('.csv'));
  if (existing) { console.log('[CSV] Reusing ' + existing); return path.join(TEMP_DIR, existing); }
  const zipPath = path.join(TEMP_DIR, 'nacti_metadata.csv.zip');
  console.log('[CSV] Downloading (~31 MB)...');
  const res = await fetch(CSV_ZIP_URL);
  if (!res.ok) throw new Error('CSV download HTTP ' + res.status);
  await pipeline(res.body, createWriteStream(zipPath));
  await execPromise('tar -xf "' + zipPath + '" -C "' + TEMP_DIR + '"');
  const csv = fs.readdirSync(TEMP_DIR).find(f => f.toLowerCase().endsWith('.csv'));
  if (!csv) throw new Error('No .csv after extract');
  return path.join(TEMP_DIR, csv);
}

async function buildPlan(csvPath, lookup) {
  const rl = readline.createInterface({ input: fs.createReadStream(csvPath), crlfDelay: Infinity });
  let header = null, iFile = -1, iName = -1, iCommon = -1;
  const plan = {}, counts = {}, unmatched = {};
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!header) {
      header = parseCsvLine(line).map(h => h.trim().toLowerCase());
      iFile = header.indexOf('filename'); iName = header.indexOf('name'); iCommon = header.indexOf('common_name');
      if (iFile < 0 || iName < 0) throw new Error('Missing columns: ' + header.join(','));
      continue;
    }
    const f = parseCsvLine(line);
    const key = lookup[normalize(f[iName])] || lookup[normalize(iCommon >= 0 ? f[iCommon] : '')];
    if (!key) { const s = f[iName]; unmatched[s] = (unmatched[s] || 0) + 1; continue; }
    if ((counts[key] || 0) >= PER_SPECIES_CAP) continue;
    counts[key] = (counts[key] || 0) + 1;
    (plan[key] = plan[key] || []).push(f[iFile]);
  }
  rl.close(); return { plan, counts, unmatched };
}

async function dl(url, outPath) {
  if (fs.existsSync(outPath)) return 'skip';
  try { const res = await fetch(url); if (!res.ok) return 'fail'; await pipeline(res.body, createWriteStream(outPath)); return 'ok'; } catch { return 'fail'; }
}

async function main() {
  console.log('=== SNAC LILA Scrubber (CSV) cap=' + PER_SPECIES_CAP + ' ===');
  const lookup = await loadSnacLookup();
  const csvPath = await getCsv();
  console.log('[PLAN] Scanning CSV (this takes a moment)...');
  const { plan, counts, unmatched } = await buildPlan(csvPath, lookup);
  const species = Object.keys(plan).sort();
  console.log('[PLAN] ' + species.length + ' species matched: ' + species.join(', '));
  console.log('[PLAN] unmatched category names: ' + Object.keys(unmatched).length);
  const stats = {};
  for (const key of species) {
    const dir = path.join(OUTPUT_BASE, key);
    fs.mkdirSync(dir, { recursive: true });
    let ok = 0, skip = 0, fail = 0;
    for (const fn of plan[key]) {
      const out = path.join(dir, fn.replace(/[\/\\]/g, '_'));
      const r = await dl(IMAGE_BASE_URL + fn, out);
      if (r === 'ok') ok++; else if (r === 'skip') skip++; else fail++;
    }
    stats[key] = { planned: plan[key].length, ok, skip, fail };
    console.log('[DL] ' + key + ': ' + ok + ' new, ' + skip + ' existing, ' + fail + ' failed');
  }
  console.log('\n=== SUMMARY ===');
  console.log('Species | Planned | New | Existing | Failed');
  for (const key of species) { const s = stats[key]; console.log(key + ' | ' + s.planned + ' | ' + s.ok + ' | ' + s.skip + ' | ' + s.fail); }
  console.log('\nOutput: ' + OUTPUT_BASE);
}
main().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
