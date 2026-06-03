import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { fileURLToPath, pathToFileURL } from 'url';

const API = 'https://api.inaturalist.org/v1';
const UA = 'SNAC-research/0.1 (https://github.com/604guy604; adifferentkind89@gmail.com)';
const OUT_DIR = './data_prep/inat_tracks';
const PHOTO_SIZE = 'large';
const PER_SPECIES_CAP = 300;
const ALLOWED = new Set(['cc0','cc-by']);

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function normalize(s){ return String(s||'').toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim(); }

async function api(q){
  for(let a=0;a<4;a++){
    try{ const r = await fetch(API+q, { headers:{ 'User-Agent': UA } }); if(r.ok) return r.json(); await sleep(1500*(a+1)); }
    catch(e){ await sleep(1500*(a+1)); }
  }
  throw new Error('API failed: '+q);
}

async function loadSnacLookup(){
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cands = [path.join(process.cwd(),'snac_profiles.js'), path.join(here,'snac_profiles.js'), path.join(here,'..','snac_profiles.js')];
  const pp = cands.find(p=>fs.existsSync(p));
  if(!pp) throw new Error('snac_profiles.js not found');
  const mod = await import(pathToFileURL(pp).href);
  const profiles = mod.getProfiles();
  const lookup = {};
  for(const [key,prof] of Object.entries(profiles))
    for(const cand of [key, prof.common_name, prof.scientific_name]){ const n = normalize(cand); if(n && !(n in lookup)) lookup[n]=key; }
  console.log('[SETUP] '+Object.keys(profiles).length+' species, '+Object.keys(lookup).length+' names');
  return lookup;
}

function matchSpecies(taxonName, lookup){
  const n = normalize(taxonName);
  if(lookup[n]) return lookup[n];
  const toks = n.split(' ');
  if(toks.length>=2){ const bi = toks[0]+' '+toks[1]; if(lookup[bi]) return lookup[bi]; }
  return null;
}

function photoUrl(p, size){ return (p.url||'').replace(/\/(square|small|medium|large|original)\./, '/'+size+'.'); }

async function dl(url, outPath){
  if(fs.existsSync(outPath)) return 'skip';
  fs.mkdirSync(path.dirname(outPath), { recursive:true });
  for(let a=0;a<4;a++){
    try{
      const r = await fetch(url, { headers:{ 'User-Agent': UA } });
      if(r.ok){ const tmp=outPath+'.part'; await pipeline(r.body, createWriteStream(tmp)); fs.renameSync(tmp,outPath); return 'ok'; }
      if(r.status===404) return 'fail';
      await sleep(800*(a+1));
    }catch(e){ try{ if(fs.existsSync(outPath+'.part')) fs.unlinkSync(outPath+'.part'); }catch{} await sleep(800*(a+1)); }
  }
  return 'fail';
}

async function main(){
  console.log('=== iNaturalist track scrubber (research-grade, CC0/CC-BY only) ===');
  const lookup = await loadSnacLookup();
  fs.mkdirSync(OUT_DIR, { recursive:true });
  const manifestPath = path.join(OUT_DIR, 'manifest.csv');
  if(!fs.existsSync(manifestPath)) fs.writeFileSync(manifestPath,'file,species,license,attribution,observation_url\n');

  const counts = {}; let idAbove=0, page=0, totalSeen=0, ok=0, skip=0, fail=0;
  const MAX_PAGES = parseInt(process.env.MAX_PAGES||'0',10);
  while(true){
    const q = '/observations?term_id=22&term_value_id=26&quality_grade=research&photos=true&photo_license=cc0%2Ccc-by&order_by=id&order=asc&id_above='+idAbove+'&per_page=200';
    const d = await api(q);
    const res = d.results||[];
    if(res.length===0) break;
    page++;
    for(const obs of res){
      totalSeen++;
      idAbove = Math.max(idAbove, obs.id);
      const key = matchSpecies(obs.taxon?.name, lookup);
      if(!key) continue;
      if((counts[key]||0) >= PER_SPECIES_CAP) continue;
      const attribution = (obs.user?.name || obs.user?.login || '').replace(/[\n,"]/g,' ');
      const obsUrl = 'https://www.inaturalist.org/observations/'+obs.id;
      for(const p of (obs.photos||[])){
        if(!ALLOWED.has((p.license_code||'').toLowerCase())) continue;
        if((counts[key]||0) >= PER_SPECIES_CAP) break;
        const fn = key+'_'+obs.id+'_'+p.id+'.jpg';
        const out = path.join(OUT_DIR, key, fn);
        let r = await dl(photoUrl(p, PHOTO_SIZE), out);
        if(r==='fail') r = await dl(photoUrl(p,'medium'), out);
        if(r==='ok'){ ok++; counts[key]=(counts[key]||0)+1; fs.appendFileSync(manifestPath,[fn,key,(p.license_code||''),'"'+attribution+'"',obsUrl].join(',')+'\n'); await sleep(200); }
        else if(r==='skip'){ skip++; counts[key]=(counts[key]||0)+1; } else fail++;
      }
    }
    if(page%5===0) console.log('[SCAN] page '+page+', seen '+totalSeen+' obs, '+ok+' new / '+skip+' existing / '+fail+' failed');
    if(MAX_PAGES && page>=MAX_PAGES) break;
    await sleep(700);
  }
  console.log('\n=== DONE ===');
  console.log('Scanned '+totalSeen+' track observations. '+ok+' downloaded, '+skip+' existing, '+fail+' failed, across '+Object.keys(counts).length+' of your species.');
  for(const k of Object.keys(counts).sort()) console.log('  '+k+': '+counts[k]);
  console.log('Images: '+OUT_DIR+'   |   License log: '+manifestPath);
}
main().catch(e=>{ console.error('[FATAL]', e.message); process.exit(1); });
