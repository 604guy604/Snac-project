import fs from 'fs'; import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
async function main(){
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cands = [path.join(process.cwd(),'snac_profiles.js'), path.join(here,'snac_profiles.js'), path.join(here,'..','snac_profiles.js')];
  const mod = await import(pathToFileURL(cands.find(p=>fs.existsSync(p))).href);
  const keys = Object.keys(mod.getProfiles());
  const base = './data_prep/lila_out';
  const counts = {};
  for(const k of keys){
    const dir = path.join(base, k);
    let n = 0;
    if(fs.existsSync(dir)) n = fs.readdirSync(dir).filter(f=>/\.(jpg|jpeg|png)$/i.test(f)).length;
    counts[k] = n;
  }
  const have = keys.filter(k=>counts[k]>0).sort((a,b)=>counts[b]-counts[a]);
  const missing = keys.filter(k=>counts[k]===0).sort();
  const total = Object.values(counts).reduce((a,b)=>a+b,0);
  console.log('=== COVERAGE: ' + have.length + ' of ' + keys.length + ' species have images (' + total + ' total) ===');
  console.log('\n-- HAVE (' + have.length + ') --');
  for(const k of have) console.log('  ' + k + ': ' + counts[k]);
  console.log('\n-- STILL NEED (' + missing.length + ') --');
  console.log('  ' + missing.join(', '));
}
main().catch(e=>{console.error('[ERR]', e.message); process.exit(1);});
