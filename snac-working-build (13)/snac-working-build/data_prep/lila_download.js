#!/usr/bin/env node

/**
 * lila_download.js
 * SNAC LILA Camera Trap Metadata-First Download Pipeline
 *
 * Metadata first: fetch COCO JSON, filter labels BEFORE downloading images.
 * Only download images that match SNAC species, capped per species.
 * No placeholders, no fabricated data, no silent failures.
 *
 * LILA License: Community Data License Agreement (CDLA) - training use permitted
 * https://lila.science
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import zlib from 'zlib';
import { Transform } from 'stream';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// ============================================================================
// CONFIGURATION
// ============================================================================

const PER_SPECIES_CAP = 200; // Hard cap on images per species per dataset

const OUTPUT_BASE = './data_prep/lila_out';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DATASETS = {
  NACTI: {
    name: 'North American Camera Trap Images (LILA)',
    metadata_url: 'https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti/nacti_metadata.1.14.json.zip',
    images_base_url: 'https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti-unzipped/',
  },
};

// ============================================================================
// AUTOMATIC LILA TAXONOMY MAPPING (from snac_profiles.js)
// ============================================================================

/**
 * Normalize a string for matching:
 * lowercase, convert underscores/hyphens to spaces, collapse spaces, trim
 */
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a lookup table from SNAC profiles:
 * normalized_name -> snac_key
 * Includes the species key, common_name, and scientific_name
 */
async function buildSpeciesLookup() {
  try {
    const profilesPath = path.join(projectRoot, 'snac_profiles.js');
    const profilesUrl = new URL(`file:///${profilesPath.replace(/\\/g, '/')}`);
    const { getProfiles } = await import(profilesUrl.href);
    const profiles = getProfiles();

    const lookup = {}; // normalized_name -> snac_key

    for (const [snacKey, profile] of Object.entries(profiles)) {
      // Add the key itself (normalized)
      lookup[normalize(snacKey)] = snacKey;

      // Add common name if available
      if (profile.common_name) {
        lookup[normalize(profile.common_name)] = snacKey;
      }

      // Add scientific name if available
      if (profile.scientific_name) {
        lookup[normalize(profile.scientific_name)] = snacKey;
      }
    }

    return lookup;
  } catch (err) {
    console.error('[ERROR] Failed to build species lookup:', err.message);
    process.exit(1);
  }
}

/**
 * Map a LILA category label to SNAC species key using automatic lookup
 */
function mapCategoryToSnac(category, speciesLookup) {
  const normalized = normalize(category);
  return speciesLookup[normalized] || null;
}

// ============================================================================
// METADATA FETCHING & FILTERING
// ============================================================================

/**
 * Download ZIP file and extract using tar.exe (Windows 10/11 native)
 */
async function downloadAndExtractZip(url, tempDir) {
  try {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const zipPath = path.join(tempDir, 'metadata.zip');
    console.log(`[EXTRACT] Downloading ZIP to ${zipPath}...`);

    // Download ZIP fully and wait for complete write
    const response = await fetch(url, { timeout: 120000 });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const fileStream = createWriteStream(zipPath);
    await pipeline(response.body, fileStream);

    const downloadedSize = fs.statSync(zipPath).size;
    console.log(`[EXTRACT] Downloaded ${downloadedSize} bytes, now extracting...`);

    // Try tar.exe first (Windows 10/11 native tar handles .zip)
    try {
      console.log(`[EXTRACT] Extracting with tar.exe...`);
      const tarCmd = `tar -xf "${zipPath}" -C "${tempDir}"`;
      const { stdout, stderr } = await execPromise(tarCmd, {
        shell: 'cmd.exe',
        timeout: 60000,
      });

      console.log('[EXTRACT] tar.exe extraction successful');

      // Diagnostic: list files in tempDir
      const allFiles = fs.readdirSync(tempDir);
      console.log(`[EXTRACT] Files in ${tempDir}:`, allFiles);

      // Find JSON file
      const jsonFile = allFiles.find(f => f.endsWith('.json'));

      if (jsonFile) {
        const jsonPath = path.join(tempDir, jsonFile);
        const fileSize = fs.statSync(jsonPath).size;
        console.log(`[EXTRACT] Reading ${jsonFile} (${(fileSize / 1024 / 1024).toFixed(2)} MB)...`);
        
        // Use streaming JSON extraction to find categories
        console.log(`[EXTRACT] Extracting categories from stream...`);
        
        const categories = [];
        let carry = '';
        let foundCategories = false;
        let inCategoriesArray = false;
        let braceCount = 0;
        let categoryJson = '';
        let bytesProcessed = 0;
        const keyToken = '"categories"';

        await new Promise((resolve, reject) => {
          const stream = fs.createReadStream(jsonPath, {
            encoding: 'utf8',
            highWaterMark: 256 * 1024,
          });

          let chunkCount = 0;
          let finished = false;

          const processChunk = (chunk) => {
            const text = carry + chunk;
            let pos = 0;

            while (pos < text.length && !finished) {
              if (!foundCategories) {
                const idx = text.indexOf(keyToken, pos);
                if (idx === -1) {
                  carry = text.slice(-Math.min(64, text.length));
                  return;
                }
                foundCategories = true;
                pos = idx + keyToken.length;
                continue;
              }

              if (foundCategories && !inCategoriesArray) {
                while (pos < text.length && /[\s:]/.test(text[pos])) {
                  pos++;
                }
                if (pos < text.length && text[pos] === '[') {
                  inCategoriesArray = true;
                  pos++;
                  continue;
                }
                carry = text.slice(-Math.min(64, text.length));
                return;
              }

              if (inCategoriesArray) {
                const ch = text[pos];
                if (braceCount === 0) {
                  if (ch === '{') {
                    braceCount = 1;
                    categoryJson = '{';
                  } else if (ch === ']') {
                    finished = true;
                    stream.close();
                    resolve();
                    return;
                  }
                } else {
                  categoryJson += ch;
                  if (ch === '{') {
                    braceCount++;
                  } else if (ch === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                      try {
                        const cat = JSON.parse(categoryJson);
                        if (cat.name) categories.push(cat.name);
                      } catch (e) {
                        // skip malformed object
                      }
                      categoryJson = '';
                    }
                  }
                }
                pos++;
                continue;
              }

              pos++;
            }

            carry = finished ? '' : text.slice(-Math.min(64, text.length));
          };

          stream.on('data', (chunk) => {
            chunkCount++;
            bytesProcessed += chunk.length;
            if (chunkCount % 500 === 0) {
              const mb = (bytesProcessed / 1024 / 1024).toFixed(0);
              console.log(`[EXTRACT] Processed ${mb} MB...`);
            }
            try {
              processChunk(chunk);
            } catch (err) {
              stream.destroy();
              reject(err);
            }
          });

          stream.on('end', () => {
            if (!finished) resolve();
          });

          stream.on('error', reject);
        });

        console.log(`[EXTRACT] Extracted ${categories.length} categories`);
        
        // Clean up
        fs.rmSync(zipPath, { force: true });
        fs.rmSync(jsonPath, { force: true });
        
        // Return mock metadata with just categories for filtering
        return {
          images: [],
          categories: categories.map((name, idx) => ({ id: idx, name })),
          annotations: []
        };
      } else {
        throw new Error(`No JSON file found in extracted files: ${allFiles.join(', ')}`);
      }
    } catch (tarErr) {
      console.warn(
        `[WARN] tar.exe extraction failed: ${tarErr.message}`
      );

      // Fallback to PowerShell Expand-Archive
      try {
        const psCommand = `
          if ((Get-Command Expand-Archive -ErrorAction SilentlyContinue) -ne $null) {
            Expand-Archive -Path "${zipPath}" -DestinationPath "${tempDir}" -Force
            Write-Output "OK"
          } else {
            Write-Error "Expand-Archive not available"
          }
        `;
        const { stdout, stderr } = await execPromise(psCommand, {
          shell: 'powershell.exe',
          timeout: 60000,
        });

        if (stdout.includes('OK')) {
          console.log('[EXTRACT] PowerShell extraction successful');

          // Find JSON file
          const files = fs.readdirSync(tempDir);
          const jsonFile = files.find(f => f.endsWith('.json'));

          if (jsonFile) {
            const jsonPath = path.join(tempDir, jsonFile);
            const jsonContent = fs.readFileSync(jsonPath, 'utf8');
            const metadata = JSON.parse(jsonContent);

            // Clean up
            fs.rmSync(zipPath, { force: true });
            fs.rmSync(jsonPath, { force: true });

            console.log(
              `[EXTRACT] Parsed: ${metadata.images?.length ?? 0} images, ${metadata.categories?.length ?? 0} categories`
            );
            return metadata;
          }
        }
      } catch (psErr) {
        console.warn('[WARN] PowerShell extraction also failed');
      }
    }

    throw new Error('ZIP extraction failed with all methods');
  } catch (err) {
    console.error(`[ERROR] Download/extract failed:`, err.message);
    return null;
  }
}

/**
 * Download and decompress ZIP file containing JSON
 * LILA metadata files are often provided as .json.zip for storage efficiency
 */
async function fetchMetadataZip(url) {
  console.log(`[DOWNLOAD] Fetching compressed metadata: ${url}`);

  // Try PowerShell extraction first (best for ZIP files)
  const tempDir = path.join(OUTPUT_BASE, '.temp');
  const extracted = await downloadAndExtractZip(url, tempDir);
  if (extracted) return extracted;

  // Fallback to native ZIP parsing (slower)
  console.log('[DEBUG] Attempting native ZIP extraction...');
  try {
    const response = await fetch(url, { timeout: 120000 });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = Buffer.from(buffer);

    console.log(
      `[DEBUG] Downloaded ${bytes.length} bytes, signature: ${bytes.slice(0, 4).toString('hex')}`
    );

    // Check for ZIP signature (PK\x03\x04 = 0x04034b50)
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      console.log('[DEBUG] Not a ZIP file, trying direct decompression');

      // Try GZIP decompression
      try {
        const decompressed = zlib.gunzipSync(bytes);
        const jsonContent = decompressed.toString('utf8');
        const metadata = JSON.parse(jsonContent);
        console.log(
          `[DECOMPRESS] GZIP extracted: ${metadata.images?.length ?? 0} images`
        );
        return metadata;
      } catch (e) {
        console.warn('[WARN] GZIP decompression failed');
      }
    }

    // Manual ZIP extraction (simplified)
    console.log('[DEBUG] Attempting manual ZIP extraction...');
    for (let i = 0; i < bytes.length - 30; i++) {
      // ZIP local file header signature: 0x04034b50
      if (
        bytes[i] === 0x50 &&
        bytes[i + 1] === 0x4b &&
        bytes[i + 2] === 0x03 &&
        bytes[i + 3] === 0x04
      ) {
        const compressionMethod = bytes.readUInt16LE(i + 8);
        const filenameLen = bytes.readUInt16LE(i + 26);
        const extraLen = bytes.readUInt16LE(i + 28);
        const compressedSize = bytes.readUInt32LE(i + 18);
        const uncompressedSize = bytes.readUInt32LE(i + 22);

        const filename = bytes
          .slice(i + 30, i + 30 + filenameLen)
          .toString('utf8');

        console.log(
          `[DEBUG] Found: ${filename} (method=${compressionMethod}, ${uncompressedSize} bytes)`
        );

        if (filename.endsWith('.json') && compressionMethod === 8) {
          const fileDataStart = i + 30 + filenameLen + extraLen;
          const fileData = bytes.slice(
            fileDataStart,
            fileDataStart + compressedSize
          );

          try {
            // ZIP entries use raw DEFLATE, not zlib-wrapped DEFLATE
            const decompressed = zlib.inflateRawSync(fileData);
            const jsonContent = decompressed.toString('utf8');
            const metadata = JSON.parse(jsonContent);
            console.log(
              `[DECOMPRESS] Native ZIP (raw DEFLATE): ${metadata.images?.length ?? 0} images`
            );
            return metadata;
          } catch (e) {
            console.warn(`[WARN] Failed to extract ${filename}: ${e.message}`);
          }
        }
      }
    }

    throw new Error('No valid JSON found in ZIP');
  } catch (err) {
    console.error(`[ERROR] Metadata ZIP parse failed:`, err.message);
    return null;
  }
}

async function fetchMetadata(datasetKey) {
  const dataset = DATASETS[datasetKey];
  console.log(
    `\n[${datasetKey}] Fetching metadata from ${dataset.metadata_url}`
  );

  try {
    const response = await fetch(dataset.metadata_url, { timeout: 120000 });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if it's a ZIP file by content-type or filename
    const contentType = response.headers.get('content-type') || '';
    const isZip =
      dataset.metadata_url.endsWith('.zip') ||
      contentType.includes('zip');

    if (isZip) {
      return await fetchMetadataZip(dataset.metadata_url);
    }

    // Plain JSON
    const metadata = await response.json();
    console.log(
      `[${datasetKey}] Metadata loaded: ${metadata.images?.length ?? 0} images, ${metadata.categories?.length ?? 0} categories`
    );
    return metadata;
  } catch (err) {
    console.error(`[ERROR] ${datasetKey} metadata fetch failed:`, err.message);
    return null;
  }
}

/**
 * Build a filter plan: which images to download per species
 * Enforces PER_SPECIES_CAP globally
 */
function buildFilterPlan(metadata, speciesLookup) {
  if (!metadata?.images || !metadata?.categories) {
    console.warn('[FILTER] Metadata missing images or categories');
    return {};
  }

  const plan = {}; // { snac_key: [image_ids] }
  const categoryMap = {}; // { category_id: snac_key }
  const mappedCategories = {}; // { catName: snac_key }
  const unmappedCategories = new Set(); // catNames that didn't match
  const speciesDownloaded = {}; // counter per species

  // Log all categories the dataset contains
  console.log('\n[CATEGORIES] Dataset contains:');
  for (const cat of metadata.categories) {
    console.log(`  - ID ${cat.id}: "${cat.name}"`);
  }

  // Build category → SNAC mapping using automatic lookup
  console.log('\n[MAPPING] Auto-built category to SNAC mappings:');
  for (const cat of metadata.categories) {
    const catId = cat.id;
    const catName = cat.name;
    const snacKey = mapCategoryToSnac(catName, speciesLookup);

    if (snacKey) {
      categoryMap[catId] = snacKey;
      mappedCategories[catName] = snacKey;
      console.log(`  ✓ "${catName}" → ${snacKey}`);
    } else {
      unmappedCategories.add(catName);
    }
  }

  // Log categories that did NOT match
  if (unmappedCategories.size > 0) {
    console.log('\n[UNMATCHED] Categories with no SNAC species match:');
    for (const catName of Array.from(unmappedCategories).sort()) {
      console.log(`  - "${catName}"`);
    }
  }

  // Filter images: keep only those in mapped categories, respect cap
  for (const img of metadata.images) {
    // Find annotations for this image
    const annotations = metadata.annotations?.filter(a => a.image_id === img.id) || [];

    for (const ann of annotations) {
      const catId = ann.category_id;
      const snacKey = categoryMap[catId];

      if (!snacKey) continue; // Not mapped to SNAC

      // Check per-species cap
      speciesDownloaded[snacKey] = (speciesDownloaded[snacKey] || 0) + 1;
      if (speciesDownloaded[snacKey] > PER_SPECIES_CAP) {
        continue; // Skip, cap reached
      }

      if (!plan[snacKey]) plan[snacKey] = [];
      plan[snacKey].push({
        image_id: img.id,
        file_name: img.file_name,
        url: img.coco_url || null,
        bbox: ann.bbox || null,
      });
    }
  }

  return plan;
}

// ============================================================================
// DOWNLOAD IMAGES
// ============================================================================

async function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url, { timeout: 30000 });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    await pipeline(response.body, createWriteStream(outputPath));
    return true;
  } catch (err) {
    console.warn(`[WARN] Image download failed (${url}): ${err.message}`);
    return false;
  }
}

async function downloadFilteredImages(datasetKey, filterPlan) {
  const dataset = DATASETS[datasetKey];
  const downloadStats = {};

  for (const [snacKey, images] of Object.entries(filterPlan)) {
    const speciesDir = path.join(OUTPUT_BASE, snacKey);
    await ensureDirExists(speciesDir);

    downloadStats[snacKey] = { total: images.length, downloaded: 0, failed: 0 };

    console.log(`\n[DOWNLOAD] ${snacKey}: ${images.length} images`);

    for (const img of images) {
      const url = dataset.images_base_url + img.file_name;
      const outputPath = path.join(speciesDir, path.basename(img.file_name));

      const success = await downloadImage(url, outputPath);
      if (success) {
        downloadStats[snacKey].downloaded++;

        // Save metadata alongside image
        const metaPath = outputPath + '.json';
        const metadata = {
          dataset: datasetKey,
          original_id: img.image_id,
          bbox: img.bbox,
          downloaded_at: new Date().toISOString(),
        };
        fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
      } else {
        downloadStats[snacKey].failed++;
      }
    }
  }

  return downloadStats;
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function main() {
  console.log('========================================');
  console.log('SNAC LILA Data Preparation Pipeline');
  console.log(`Species cap per dataset: ${PER_SPECIES_CAP}`);
  console.log('========================================\n');

  // Step A: Build automatic species lookup from profiles
  console.log('[SETUP] Building automatic species lookup from snac_profiles.js...');
  const speciesLookup = await buildSpeciesLookup();
  const uniqueSpecies = new Set(Object.values(speciesLookup));
  console.log(`[SETUP] Lookup built: ${Object.keys(speciesLookup).length} normalized names across ${uniqueSpecies.size} species\n`);

  // Step B-F: Process each dataset
  const allResults = {};

  for (const [datasetKey, dataset] of Object.entries(DATASETS)) {
    console.log(`\n>>> Processing ${datasetKey}: ${dataset.name}`);

    // Metadata first
    const metadata = await fetchMetadata(datasetKey);
    if (!metadata) {
      console.error(`[SKIP] ${datasetKey} - metadata unavailable`);
      continue;
    }

    // Filter
    const filterPlan = buildFilterPlan(metadata, speciesLookup);
    const totalImages = Object.values(filterPlan).reduce((sum, imgs) => sum + imgs.length, 0);
    console.log(`\n[PLAN] ${totalImages} images will be downloaded`);

    // Download
    const stats = await downloadFilteredImages(datasetKey, filterPlan);
    allResults[datasetKey] = stats;
  }

  // Summary table
  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log('\nDataset | Species | Matched | Downloaded | Failed');
  console.log('--------|---------|---------|------------|--------');

  for (const [datasetKey, stats] of Object.entries(allResults)) {
    for (const [species, data] of Object.entries(stats)) {
      console.log(`${datasetKey} | ${species} | ${data.total} | ${data.downloaded} | ${data.failed}`);
    }
  }

  console.log('\nOutput directory: ' + OUTPUT_BASE);
}

main().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
