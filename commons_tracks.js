import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'SNAC-research/0.1 (https://github.com/604guy604; adifferentkind89@gmail.com)';
const OUT_DIR = './data_prep/commons_tracks';
const THUMB_WIDTH = 1280;
const MAX_DEPTH = 2;
const PER_CAT_CAP = 600;
const ALLOW_SA = false; // set true to also include CC BY-SA (share-alike) images

const DEFAULT_CATS = [
  'Animal tracks on mud',
  'Animal tracks on sand',
  'Animal tracks on snow',
  'Animal tracks on dust',
];
const SKIP_CATS = new Set([
  'illustrations of animal tracks','animal tracks in art','trackways fossils',
  'animal tracks on ceramic','animal tracks by country','unidentified animal tracks',
  'manus imprints','pes imprints','animal trails','mollusca tracks','arthropoda tracks',
]);

const cats = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_CATS;

async function api(params){
  const u = API + '?' + new URLSearchParams({ format:'json', ...params });
  const r = await fetch(u, { headers:{ 'User-Agent': UA } });
  if(!r.ok) throw new Error('API HTTP ' + r.status);
  return r.json();
}

function licenseOk(em){
  if(!em) return false;
  if(em.Restrictions && em.Restrictions.value) return false;
  const blob = (((em.License&&em.License.value)||'') + ' ' + ((em.LicenseShortName&&em.LicenseShortName.value)||'')).toLowerCase();
  if(blob.includes('nc')) return false;
  if(blob.includes('nd')) return false;
  if(blob.includes('cc0') || blob.includes('public domain') || blob.includes('no restrictions')) return true;
  if(blob.includes('sa')) return ALLOW_SA;
  if(blob.includes('by')) return true;
  return false;
}

async function gatherFiles(startCat){
  const files = new Set();
  const seen = new Set();
  let frontier = [{ cat:startCat, depth:0 }];
  while(frontier.length && files.size < PER_CAT_CAP){
    const next = [];
    for(const { cat, depth } of frontier){
      const key = cat.toLowerCase().replace('category:','');
      if(seen.has(key)) continue; seen.add(key);
      if(SKIP_CATS.has(key)) continue;
      let cont;
      do{
        const d = await api({ action:'query', list:'categorymembers', cmtitle:'Category:'+cat, cmtype:'file', cmlimit:'500', ...(cont?{cmcontinue:cont}:{}) });
        for(const m of (d.query?.categorymembers||[])) files.add(m.title);
        cont = d.continue?.cmcontinue;
      } while(cont && files.size < PER_CAT_CAP);
      if(depth < MAX_DEPTH){
        const ds = await api({ action:'query', list:'categorymembers', cmtitle:'Category:'+cat, cmtype:'subcat', cmlimit:'500' });
        for(const m of (ds.query?.categorymembers||[])){
          const sc = m.title.replace('Category:','');
          if(!SKIP_CATS.has(sc.toLowerCase())) next.push({ cat:sc, depth:depth+1 });
        }
      }
    }
    frontier = next;
  }
  return [...files];
}

async function getInfo(titles){
  const out = {};
  for(let i=0;i<titles.length;i+=50){
    const b = titles.slice(i,i+50);
    const d = await api({ action:'query', titles:b.join('|'), prop:'imageinfo', iiprop:'url|extmetadata|mime', iiurlwidth:String(THUMB_WIDTH) });
    for(const k in (d.query?.pages||{})){ const p = d.query.pages[k]; const ii = p.imageinfo?.[0]; if(ii) out[p.title] = ii; }
  }
  return out;
}

function safeName(s){ return s.replace('File:','').replace(/[\/\\:*?"<>|]/g,'_'); }

async function dl(url, outPath){
  if(fs.existsSync(outPath)) return 'skip';
  try{
    const r = await fetch(url, { headers:{ 'User-Agent': UA } });
    if(!r.ok) return 'fail';
    const tmp = outPath + '.part';
    await pipeline(r.body, createWriteStream(tmp));
    fs.renameSync(tmp, outPath);
    return 'ok';
  }catch(e){ return 'fail'; }
}

async function main(){
  console.log('=== Wikimedia Commons track scrubber (ALLOW_SA=' + ALLOW_SA + ') ===');
  console.log('Categories: ' + cats.join(', '));
  fs.mkdirSync(OUT_DIR, { recursive:true });
  const manifestPath = path.join(OUT_DIR, 'manifest.csv');
  if(!fs.existsSync(manifestPath)) fs.writeFileSync(manifestPath, 'file,category,license,attribution_required,artist,source_url\n');

  let tOk=0, tSkip=0, tFail=0, tReject=0;
  for(const cat of cats){
    const catKey = cat.replace(/[\/\\:*?"<>|]/g,'_');
    console.log('\n[CAT] ' + cat + ' - gathering...');
    const titles = await gatherFiles(cat);
    console.log('[CAT] ' + cat + ': ' + titles.length + ' candidate files');
    const info = await getInfo(titles);
    const dir = path.join(OUT_DIR, catKey); fs.mkdirSync(dir, { recursive:true });
    let ok=0, skip=0, fail=0, reject=0;
    for(const title in info){
      const ii = info[title]; const em = ii.extmetadata;
      if(!(ii.mime||'').startsWith('image/')){ reject++; continue; }
      if(!licenseOk(em)){ reject++; continue; }
      const url = ii.thumburl || ii.url;
      const fn = safeName(title);
      const r = await dl(url, path.join(dir, fn));
      if(r==='ok'){
        ok++;
        const lic = (em.LicenseShortName?.value||'').replace(/,/g,' ');
        const artist = (em.Artist?.value||'').replace(/<[^>]+>/g,'').replace(/[\n,"]/g,' ').trim().slice(0,120);
        fs.appendFileSync(manifestPath, [fn, catKey, lic, (em.AttributionRequired?.value||''), '"'+artist+'"', (ii.descriptionurl||ii.url)].join(',')+'\n');
      } else if(r==='skip') skip++; else fail++;
    }
    console.log('[CAT] ' + cat + ': ' + ok + ' downloaded, ' + skip + ' existing, ' + fail + ' failed, ' + reject + ' rejected');
    tOk+=ok; tSkip+=skip; tFail+=fail; tReject+=reject;
  }
  console.log('\n=== DONE ===');
  console.log(tOk + ' downloaded, ' + tSkip + ' existing, ' + tFail + ' failed, ' + tReject + ' rejected (license/non-image)');
  console.log('Images: ' + OUT_DIR);
  console.log('License + attribution log: ' + manifestPath);
}
main().catch(e=>{ console.error('[FATAL]', e.message); process.exit(1); });
