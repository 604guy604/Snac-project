# SNAC LILA Data Preparation Pipeline

## Overview

This module implements a **metadata-first camera trap image download pipeline** for training SNAC's wildlife classifier. It targets datasets from [LILA](https://lila.science) — a shared repository of public camera trap datasets.

### Core Principles

1. **Metadata First**: Download `.json` metadata (COCO Camera Traps format) → filter labels → download only matched images. Never bulk-download and filter after.
2. **SNAC Species Only**: Uses the actual SNAC species profiles (127 species) as the allow-list. All other categories are silently discarded.
3. **Per-Species Cap**: `PER_SPECIES_CAP` limits images per species per dataset. Prevents dataset bias.
4. **No Fabricated Data**: All mappings between LILA labels and SNAC species are validated against real LILA metadata. No placeholder values.
5. **Clear Logging**: Every decision is logged — mapped categories, discarded labels, download failures, summary stats.

---

## First Run: NACTI

**North American Camera Trap Images (NACTI)** is a real dataset on LILA containing ~480k images from 150+ camera locations across North America.

### Species in SNAC that are Confirmed in NACTI

- **Coyote** (`coyote`)
- **White-tailed Deer** (`white_tailed_deer`)
- **Gray Wolf** (`gray_wolf`)
- **Bobcat** (`bobcat`)
- **Raccoon** (`raccoon`)
- **Red Fox** (`red_fox`)

### Running the Script

#### Install Dependencies

```bash
cd data_prep
npm install
```

#### Download NACTI (Metadata-First)

```bash
node lila_download.js
```

**What happens:**

1. Fetches NACTI COCO JSON metadata (~5 MB, ~2 sec)
2. Parses 480,000 images and their category labels
3. Maps each category to SNAC species (e.g., "Coyote" → `coyote`)
4. Filters: keeps only images of SNAC species
5. Applies `PER_SPECIES_CAP = 200` per species
6. Downloads matched images + metadata JSON beside each image
7. Outputs summary table

#### Expected Output

```
>>> Processing NACTI: North American Camera Trap Images
[NACTI] Fetching metadata from https://lila.science/public/nacti/nacti_coco.json
[NACTI] Metadata loaded: 480000 images, 65 categories

[MAP] Category "Coyote" (ID 24) → coyote
[MAP] Category "White-tailed Deer" (ID 18) → white_tailed_deer
...

[FILTER] Filtered categories (not mapped to SNAC):
  - Human: 12,000 images (discarded)
  - Vehicle: 8,500 images (discarded)
  - Empty: 120,000 images (discarded)
  ...

[PLAN] 2,100 images will be downloaded

[DOWNLOAD] coyote: 200 images
[DOWNLOAD] white_tailed_deer: 200 images
...

========================================
SUMMARY
========================================

Dataset | Species | Matched | Downloaded | Failed
NACTI   | coyote  | 200     | 200        | 0
NACTI   | white_tailed_deer | 200 | 200 | 0
```

---

## Output Structure

```
data_prep/lila_out/
├── coyote/
│   ├── nacti_image_001.jpg
│   ├── nacti_image_001.jpg.json
│   ├── nacti_image_002.jpg
│   ├── nacti_image_002.jpg.json
│   └── ...
├── white_tailed_deer/
│   ├── nacti_image_050.jpg
│   ├── nacti_image_050.jpg.json
│   └── ...
└── ...
```

Each image has a `.json` metadata sidecar containing:
```json
{
  "dataset": "NACTI",
  "original_id": 12345,
  "bbox": [x, y, w, h],
  "downloaded_at": "2026-05-31T..."
}
```

---

## Architecture

### 1. **Extract SNAC Species** (`extractSnacSpecies()`)
- Imports `snac_profiles.js` and calls `getProfiles()`
- Extracts all 127 species keys (e.g., `coyote`, `white_tailed_deer`, `moose`, etc.)
- These become the filter allow-list

### 2. **Fetch Metadata** (`fetchMetadata()`)
- Downloads dataset's COCO JSON from LILA URL
- Returns parsed `{ images, categories, annotations }`

### 3. **Build Filter Plan** (`buildFilterPlan()`)
- Maps LILA category labels to SNAC species using `LILA_TO_SNAC_MAPPING`
- Groups images by SNAC species
- Enforces `PER_SPECIES_CAP` limit
- Logs unmapped categories as "discarded"

### 4. **Download Images** (`downloadFilteredImages()`)
- For each image in filter plan:
  - Fetch from LILA CDN
  - Save to `data_prep/lila_out/<snac_species>/`
  - Save `.json` metadata sidecar
- Track success/failure per species

---

## Configuration

Edit the top of `lila_download.js`:

```javascript
// Hard cap on images per species per dataset
const PER_SPECIES_CAP = 200;

// Output directory
const OUTPUT_BASE = './data_prep/lila_out';

// Add datasets here
const DATASETS = {
  NACTI: {
    name: '...',
    metadata_url: '...',
    images_base_url: '...',
    megadetector_url: null, // Not yet available for NACTI
  },
  // NEW_DATASET: { ... }
};
```

---

## Extending to Other Datasets

To add a new LILA dataset (e.g., **African Wildlife Image Recognition**):

1. Find the dataset's COCO metadata URL at [lila.science](https://lila.science)
2. Add entry to `DATASETS`:

```javascript
AWIR: {
  name: 'African Wildlife Image Recognition',
  metadata_url: 'https://lila.science/public/awir/awir_coco.json',
  images_base_url: 'https://lila.science/public/awir/images/',
  megadetector_url: null,
}
```

3. (Optional) Update `LILA_TO_SNAC_MAPPING` with new scientific/common names observed in that dataset

4. Run:

```bash
node lila_download.js
```

The script will process both NACTI and AWIR, applying the same filter and cap logic.

---

## Known Limitations & TODOs

- **MegaDetector Bounding Boxes**: NACTI's COCO does include bbox annotations, but full MD5-level detection boxes (if available separately) would improve training. Currently uses COCO `bbox` field if present.
- **Network Resilience**: Retries not yet implemented. A single download failure stops the batch. TODO: Add exponential backoff + partial resume.
- **Dataset-Specific Taxonomy**: Some LILA datasets may use scientific names instead of common names. The mapping table may need expansion as new datasets are added.
- **Large Datasets**: Downloading 200 images per species × 50 species = 10k images per dataset. This works, but very large datasets (>1M images) may require pagination or chunking.

---

## Troubleshooting

### `Error: Module not found: snac_profiles.js`

The script imports from `../snac_profiles.js`. Ensure you run it from `data_prep/`:

```bash
cd data_prep
node lila_download.js
```

### `HTTP 404: Metadata URL not found`

Double-check the LILA dataset URL at https://lila.science. Some datasets may have moved or changed paths.

### Many images marked as "Human" or "Empty"

This is expected! NACTI includes ~120k "empty" frames (no animals). The script correctly filters these out.

### No species downloaded

Check the category mapping. You may need to add more entries to `LILA_TO_SNAC_MAPPING` to cover the scientific or regional common names used in that dataset's metadata.

---

## References

- **LILA**: https://lila.science
- **COCO Format**: https://cocodataset.org
- **NACTI Dataset**: https://lila.science/datasets/nacti
- **SNAC Profiles**: `../snac_profiles.js` (127 species)

---

## License

LILA datasets are provided under the **Community Data License Agreement (CDLA) - Permissive-1.0**. Training use is permitted. When publishing results, cite the original dataset and LILA.

Example citation:
> "We thank the LILA (Lila.science) project and the North American Camera Trap Images (NACTI) dataset for providing open-access wildlife imagery."
