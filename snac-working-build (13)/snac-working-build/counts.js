import fs from 'fs'; import path from 'path'; import readline from 'readline';
import { fileURLToPath, pathToFileURL } from 'url';
function normalize(s){return String(s||'').toLowerCase().replace(/[_-]/g,' ').replace(/\s+/g,' ').trim();}
function parseCsvLine(line){const o=[];let c='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];if(q){if(ch==='"'){if(line[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}else{if(ch==='"')q=true;else if(ch===','){o.push(c);c='';}else c+=ch;}}o.push(c);return o;}
async function main(){
  const here=path.dirname(fileURLToPath(import.meta.url));
  const cands=[path.join(process.cwd(),'snac_profiles.js'),path.join(here,'snac_profiles.js'),path.join(here,'..','snac_profiles.js')];
  const mod=await import(pathToFileURL(cands.find(p=>fs.existsSync(p))).href);
  const profiles=mod.getProfiles();
  const lookup={};
  for(const [key,prof] of Object.entries(profiles)) for(const cand of [key,prof.common_name,prof.scientific_name]){const n=normalize(cand);if(n&&!(n in lookup))lookup[n]=key;}
  const csv='./data_prep/csv_temp/nacti_metadata.csv';
  const rl=readline.createInterface({input:fs.createReadStream(csv),crlfDelay:Infinity});
  let header=null,iName=-1,iCommon=-1;const counts={};
  for await(const line of rl){
    if(!line.trim())continue;
    if(!header){header=parseCsvLine(line).map(h=>h.trim().toLowerCase());iName=header.indexOf('name');iCommon=header.indexOf('common_name');continue;}
    const f=parseCsvLine(line);
    const key=lookup[normalize(f[iName])]||lookup[normalize(iCommon>=0?f[iCommon]:'')];
    if(key)counts[key]=(counts[key]||0)+1;
  }
  rl.close();
  const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  console.log('NACTI images available per SNAC species:');
  for(const [k,c] of sorted) console.log('  '+k+': '+c);
  for(const k of ['gray_wolf','white_tailed_deer','eastern_cottontail','ship_rat']) if(!(k in counts)) console.log('  '+k+': 0 (none in NACTI)');
}
main().catch(e=>{console.error('[ERR]',e.message);process.exit(1);});
