import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);

const PER_SPECIES_CAP = 200;
const OUTPUT_BASE = './data_prep/lila_out';
const DATASETS = {
  idaho: {
    name: 'Idaho Camera Traps',
    metadata_url: 'https://storage.googleapis.com/public-datasets-lila/idaho-camera-traps/idaho-camera-traps.json.zip',
    image_base: 'https://storage.googleapis.com/public-datasets-lila/idaho-camera-traps/public/',
  },
  wcs: {
    name: 'WCS Camera Traps',
    metadata_url: 'https://storage.googleapis.com/public-datasets-lila/wcs/wcs_camera_traps.json.zip',
    image_base: 'https://storage.googleapis.com/public-datasets-lila/wcs-unzipped/',
  },
};
const TARGET = process.argv[2] || 'idaho';
if(!DATASETS[TARGET]){ console.error('Unknown dataset "' + TARGET + '". Available: ' + Object.keys(DATASETS).join(', ')); process.exit(1); }
const TEMP_DIR = './data_prep/json_temp/' + TARGET;

const ALIASES = { 'wolf':'gray_wolf', 'ermine':'stoat', 'turkey':'wild_turkey', 'skunk':'striped_skunk', 'badger':'american_badger' };

function normalize(s){ return String(s||'').toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim(); }

async function loadSnacLookup(){
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cands = [path.join(process.cwd(),'snac_profiles.js'), path.join(here,'snac_profiles.js'), path.join(here,'..','snac_profiles.js')];
  const pp = cands.find(p=>fs.existsSync(p));
  if(!pp) throw new Error('snac_profiles.js not found');
  const mod = await import(pathToFileURL(pp).href);
  const profiles = mod.getProfiles();
  const lookup = {};
  for(const [key,prof] of Object.entries(profiles))
    for(const cand of [key, prof.common_name, prof.scientific_name]){
      const n = normalize(cand);
      if(n && !(n in lookup)) lookup[n] = key;
    }
  console.log('[SETUP] ' + Object.keys(profiles).length + ' species, ' + Object.keys(lookup).length + ' names');
  return { lookup, validKeys: new Set(Object.keys(profiles)) };
}

async function getMetadata(ds){
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  let f = fs.readdirSync(TEMP_DIR).find(x=>x.toLowerCase().endsWith('.json'));
  if(f){ console.log('[META] Reusing ' + f); return path.join(TEMP_DIR, f); }
  const zipPath = path.join(TEMP_DIR, 'meta.zip');
  console.log('[META] Downloading metadata zip...');
  const res = await fetch(ds.metadata_url);
  if(!res.ok) throw new Error('Metadata HTTP ' + res.status);
  await pipeline(res.body, createWriteStream(zipPath));
  console.log('[META] Extracting...');
  await execPromise('tar -xf "' + zipPath + '" -C "' + TEMP_DIR + '"');
  f = fs.readdirSync(TEMP_DIR).find(x=>x.toLowerCase().endsWith('.json'));
  if(!f) throw new Error('No .json after extract: ' + fs.readdirSync(TEMP_DIR).join(', '));
  return path.join(TEMP_DIR, f);
}

async function streamJsonArray(filePath, arrayName, onObject){
  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { encoding:'utf8', highWaterMark: 1<<20 });
    let pending = '', phase = 'seek';
    const key = '"' + arrayName + '"';
    let depth=0, inStr=false, esc=false, collecting=false, curObj='';
    function proc(s){
      for(let i=0;i<s.length;i++){
        const c = s[i];
        if(collecting) curObj += c;
        if(inStr){ if(esc) esc=false; else if(c==='\\') esc=true; else if(c==='"') inStr=false; continue; }
        if(c==='"'){ inStr=true; continue; }
        if(c==='{'){ if(depth===0){ collecting=true; curObj='{'; } depth++; }
        else if(c==='}'){ depth--; if(depth===0 && collecting){ try{ onObject(JSON.parse(curObj)); }catch(e){} collecting=false; curObj=''; } }
        else if(c===']' && depth===0){ phase='done'; return true; }
      }
      return false;
    }
    stream.on('data', chunk => {
      if(phase==='done') return;
      if(phase==='seek'){
        pending += chunk;
        const k = pending.indexOf(key);
        if(k===-1){ pending = pending.slice(-key.length); return; }
        const b = pending.indexOf('[', k);
        if(b===-1){ pending = pending.slice(k); return; }
        phase='array';
        const rest = pending.slice(b+1); pending='';
        if(proc(rest)){ stream.destroy(); resolve(); }
        return;
      }
      if(phase==='array'){ if(proc(chunk)){ stream.destroy(); resolve(); } }
    });
    stream.on('end', ()=>{ if(phase!=='done') resolve(); });
    stream.on('error', reject);
  });
}

async function dl(url, outPath){
  if(fs.existsSync(outPath)) return 'skip';
  try{ const res = await fetch(url); if(!res.ok) return 'fail'; await pipeline(res.body, createWriteStream(outPath)); return 'ok'; }catch{ return 'fail'; }
}

async function main(){
  const ds = DATASETS[TARGET];
  console.log('=== SNAC LILA JSON Scrubber: ' + ds.name + ' (cap ' + PER_SPECIES_CAP + ') ===');
  const { lookup, validKeys } = await loadSnacLookup();
  const metaPath = await getMetadata(ds);

  console.log('[PARSE] Reading categories...');
  const cats = [];
  await streamJsonArray(metaPath, 'categories', o => cats.push(o));
  const catToSnac = {}; const unmatched = [];
  for(const c of cats){
    const nm = normalize(c.name);
    let key = lookup[nm];
    if(!key){ const a = ALIASES[nm]; if(a && validKeys.has(a)) key = a; }
    if(key) catToSnac[c.id]=key; else unmatched.push(c.name);
  }
  console.log('[CATEGORIES] ' + cats.length + ' total');
  console.log('[MAPPING] ' + Object.keys(catToSnac).length + ' matched:');
  for(const [id,k] of Object.entries(catToSnac)){ const c = cats.find(x=>String(x.id)===String(id)); console.log('  "' + (c?c.name:id) + '" -> ' + k); }
  console.log('[UNMATCHED] ' + unmatched.length + ' (first 60): ' + unmatched.slice(0,60).join(', '));
  if(Object.keys(catToSnac).length===0){ console.log('Nothing matched. Stopping.'); return; }

  console.log('[PARSE] Scanning annotations (pass 1)...');
  const counts = {}; const needed = new Map();
  await streamJsonArray(metaPath, 'annotations', a => {
    const key = catToSnac[a.category_id];
    if(!key) return;
    if((counts[key]||0) >= PER_SPECIES_CAP) return;
    if(needed.has(a.image_id)) return;
    needed.set(a.image_id, key); counts[key]=(counts[key]||0)+1;
  });
  console.log('[PLAN] ' + needed.size + ' images flagged across ' + Object.keys(counts).length + ' species');

  console.log('[PARSE] Resolving image paths (pass 2)...');
  const plan = {};
  await streamJsonArray(metaPath, 'images', img => { const key = needed.get(img.id); if(key) (plan[key]=plan[key]||[]).push(img.file_name); });

  const species = Object.keys(plan).sort(); const stats = {};
  for(const key of species){
    const dir = path.join(OUTPUT_BASE, key); fs.mkdirSync(dir, { recursive:true });
    let ok=0, skip=0, fail=0;
    for(const fn of plan[key]){
      const out = path.join(dir, (TARGET + '_' + fn).replace(/[\/\\]/g,'_'));
      const r = await dl(ds.image_base + fn, out);
      if(r==='ok') ok++; else if(r==='skip') skip++; else fail++;
    }
    stats[key] = { planned: plan[key].length, ok, skip, fail };
    console.log('[DL] ' + key + ': ' + ok + ' new, ' + skip + ' existing, ' + fail + ' failed');
  }
  console.log('\n=== SUMMARY (' + ds.name + ') ===');
  console.log('Species | Planned | New | Existing | Failed');
  for(const key of species){ const s=stats[key]; console.log(key + ' | ' + s.planned + ' | ' + s.ok + ' | ' + s.skip + ' | ' + s.fail); }
  console.log('\nOutput: ' + OUTPUT_BASE);
}
main().catch(e=>{ console.error('[FATAL]', e.message); process.exit(1); });
