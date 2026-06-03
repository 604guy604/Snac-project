import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
function normalize(s){return String(s||'').toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();}
async function main(){
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cands = [path.join(process.cwd(),'snac_profiles.js'), path.join(here,'snac_profiles.js'), path.join(here,'..','snac_profiles.js')];
  const pp = cands.find(p=>fs.existsSync(p));
  if(!pp) throw new Error('snac_profiles.js not found');
  const mod = await import(pathToFileURL(pp).href);
  const profiles = mod.getProfiles();
  const targetKeys = ['gray_wolf','white_tailed_deer','eastern_cottontail','ship_rat'];
  console.log('--- TARGET PROFILES ---');
  for(const k of targetKeys){
    const p = profiles[k];
    if(!p){ console.log(k + ': NOT IN PROFILES'); continue; }
    console.log(k + '  common="' + p.common_name + '"  sci="' + p.scientific_name + '"');
  }
  const lookup = {};
  for(const [key, prof] of Object.entries(profiles)){
    for(const cand of [key, prof.common_name, prof.scientific_name]){
      const n = normalize(cand);
      if(n && !(n in lookup)) lookup[n] = key;
    }
  }
  const nactiNames = ['canis lupus','odocoileus virginianus','sylvilagus floridanus','rattus rattus'];
  console.log('--- NACTI NAME -> MATCH ---');
  for(const nm of nactiNames){
    console.log('"' + nm + '"  ->  ' + (lookup[normalize(nm)] || 'NO MATCH'));
  }
}
main().catch(e=>{console.error('[ERR]', e.message); process.exit(1);});
