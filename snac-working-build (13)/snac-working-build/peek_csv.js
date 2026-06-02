import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
const execPromise = promisify(exec);
const CSV_ZIP_URL = 'https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti/nacti_metadata.csv.zip';
const TEMP_DIR = './data_prep/csv_temp';
async function main() {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const zipPath = path.join(TEMP_DIR, 'nacti_metadata.csv.zip');
  console.log('[1/3] Downloading CSV zip (~31 MB)...');
  const res = await fetch(CSV_ZIP_URL);
  if (!res.ok) throw new Error('Download failed: HTTP ' + res.status);
  await pipeline(res.body, createWriteStream(zipPath));
  console.log('  done:', fs.statSync(zipPath).size, 'bytes');
  console.log('[2/3] Extracting with tar.exe...');
  await execPromise(`tar -xf "${zipPath}" -C "${TEMP_DIR}"`);
  const csvFile = fs.readdirSync(TEMP_DIR).find(f => f.toLowerCase().endsWith('.csv'));
  if (!csvFile) throw new Error('No .csv found. Files: ' + fs.readdirSync(TEMP_DIR).join(', '));
  const csvPath = path.join(TEMP_DIR, csvFile);
  console.log('  extracted:', csvFile);
  console.log('[3/3] First 4 lines:');
  const rl = readline.createInterface({ input: fs.createReadStream(csvPath), crlfDelay: Infinity });
  let n = 0;
  for await (const line of rl) {
    console.log(n === 0 ? 'HEADER: ' + line : 'ROW ' + n + ': ' + line);
    if (++n >= 4) break;
  }
  rl.close();
}
main().catch(e => { console.error('[ERROR]', e.message); process.exit(1); });
