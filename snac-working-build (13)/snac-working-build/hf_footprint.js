import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

const REPO = 'risashinoda/footprint_yolo';
const REVISION = 'main';
const OUT_DIR = './data_prep/footprint_yolo';
const CONCURRENCY = 8;
const TOKEN = process.env.HF_TOKEN;

if(!TOKEN){
  console.error('No HF_TOKEN found in this terminal. Run this first (with your real token):');
  console.error('  $env:HF_TOKEN = "hf_xxxxxxxxxxxxxxxx"');
  console.error('then re-run:  node hf_footprint.js');
  process.exit(1);
}
const AUTH = { 'Authorization': 'Bearer ' + TOKEN };

function resolveUrl(p){
  return 'https://huggingface.co/datasets/' + REPO + '/resolve/' + REVISION + '/' + p.split('/').map(encodeURIComponent).join('/');
}

async function listFiles(){
  const files = [];
  let url = 'https://huggingface.co/api/datasets/' + REPO + '/tree/' + REVISION + '?recursive=true&limit=1000';
  let pages = 0;
  while(url){
    const res = await fetch(url, {});
    if(!res.ok) throw new Error('Tree listing HTTP ' + res.status);
    const batch = await res.json();
    for(const e of batch) if(e.type === 'file') files.push(e.path);
    pages++;
    const link = res.headers.get('link');
    url = null;
    if(link){ const m = link.match(/<([^>]+)>;\s*rel="next"/); if(m) url = m[1]; }
  }
  console.log('[LIST] ' + files.length + ' files across ' + pages + ' pages');
  return files;
}

async function dl(p){
  const out = path.join(OUT_DIR, p);
  if(fs.existsSync(out)) return 'skip';
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const tmp = out + '.part';
  try{
    const res = await fetch(resolveUrl(p), { headers: AUTH });
    if(!res.ok) return 'fail';
    await pipeline(res.body, createWriteStream(tmp));
    fs.renameSync(tmp, out);
    return 'ok';
  }catch(e){
    try{ if(fs.existsSync(tmp)) fs.unlinkSync(tmp); }catch{}
    return 'fail';
  }
}

async function runPool(items, worker, concurrency){
  let idx = 0;
  async function next(){
    while(idx < items.length){ const i = idx++; await worker(items[i]); }
  }
  await Promise.all(Array.from({length: concurrency}, next));
}

async function main(){
  console.log('=== AnimalClue footprint_yolo downloader (full set) ===');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pre = await fetch(resolveUrl('dataset_card.yaml'), { headers: AUTH });
  if(pre.status === 401 || pre.status === 403){
    console.error('[AUTH FAIL] HTTP ' + pre.status + ' - token rejected or dataset terms not accepted.');
    console.error('Check: (1) token has READ access, (2) you clicked "Agree and access repository" on the dataset page while logged in.');
    process.exit(1);
  }
  console.log('[AUTH OK] token works');

  const files = await listFiles();
  const total = files.length;
  let ok=0, skip=0, fail=0, done=0;
  const failed = [];
  await runPool(files, async (p) => {
    const r = await dl(p);
    if(r==='ok') ok++; else if(r==='skip') skip++; else { fail++; failed.push(p); }
    done++;
    if(done % 250 === 0) console.log('[DL] ' + done + '/' + total + '  (' + ok + ' new, ' + skip + ' existing, ' + fail + ' failed)');
  }, CONCURRENCY);

  console.log('\n=== DONE ===');
  console.log(ok + ' new, ' + skip + ' existing, ' + fail + ' failed  (' + total + ' total)');
  if(fail) console.log('Some failed - just re-run; it skips what you have and retries the rest.');
  console.log('Output: ' + OUT_DIR);
}
main().catch(e=>{ console.error('[FATAL]', e.message); process.exit(1); });
