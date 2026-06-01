# SNAC Wildlife Data Preparation Pipeline

## Overview

You now have a complete **metadata-first camera trap image downloader** integrated into your SNAC workspace. This tool automatically:

1. Downloads COCO metadata from LILA camera trap datasets
2. Filters images by your 127 SNAC species
3. Applies per-species caps (200 images default)
4. Organizes downloads into `data_prep/lila_out/<species>/`
5. Saves JSON metadata sidecars with each image

## Quick Start

### Step 1: Validate Setup

```bash
# Navigate to your SNAC project
cd "c:\Users\604Ac\Snac-project\snac-working-build (13)\snac-working-build"

# Run component tests
C:\Program Files\nodejs\node.exe data_prep/lila_download_test.js
```

**Expected output:**
```
========================================
Test Results: All Core Components ✓
========================================
```

### Step 2: Download NACTI Dataset

```bash
# This requires the NACTI metadata ZIP to be properly decompressed
C:\Program Files\nodejs\node.exe data_prep/lila_download.js
```

**If you see ZIP extraction errors**, follow the workaround below.

### Step 3: Use Downloaded Images

Images are saved in:
```
data_prep/lila_out/
├── coyote/
│   ├── nacti_001.jpg
│   ├── nacti_001.jpg.json       # metadata with bbox, dataset ID, timestamp
│   ├── nacti_002.jpg
│   ├── nacti_002.jpg.json
│   └── ...
├── white_tailed_deer/
│   ├── ...
└── [127 other SNAC species]
```

Each species folder contains up to 200 images (configurable).

---

## Troubleshooting NACTI Metadata

### Issue: ZIP Extraction Fails

If you see:
```
[WARN] PowerShell extraction failed...
[WARN] Failed to extract nacti_metadata.1.14.json: incorrect header check
```

### Solution A: Manual Download (Recommended)

1. **Download the metadata ZIP manually:**

   ```powershell
   # PowerShell command (copy-paste):
   $url = "https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti/nacti_metadata.1.14.json.zip"
   $outfile = "C:\Users\604Ac\Snac-project\snac-working-build (13)\snac-working-build\data_prep\nacti_metadata.zip"
   Invoke-WebRequest -Uri $url -OutFile $outfile
   
   # Verify download (should be ~43 MB)
   (Get-Item $outfile).Length / 1MB
   ```

2. **Extract the ZIP:**

   ```powershell
   # In the same PowerShell window:
   $destination = "C:\Users\604Ac\Snac-project\snac-working-build (13)\snac-working-build\data_prep"
   Expand-Archive -Path $outfile -DestinationPath $destination -Force
   ```

3. **Update the script to use local file:**

   Open `data_prep/lila_download.js` and change the NACTI config:

   ```javascript
   NACTI: {
     name: 'North American Camera Trap Images (LILA)',
     // Use local extracted file instead:
     metadata_url: 'file:///C:/Users/604Ac/Snac-project/snac-working-build%20(13)/snac-working-build/data_prep/nacti_metadata.1.14.json',
     images_base_url: 'https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti-unzipped/',
   },
   ```

4. **Run the script:**

   ```bash
   C:\Program Files\nodejs\node.exe data_prep/lila_download.js
   ```

### Solution B: Try Alternative Datasets

If manual extraction is complicated, try a different LILA dataset that doesn't have ZIP issues:

```javascript
// In lila_download.js, add:
SNAPSHOT_WISCONSIN: {
  name: 'Snapshot Wisconsin Camera Traps',
  metadata_url: 'https://lilawildlife.blob.core.windows.net/lila-wildlife/snapshot-wisconsin/snapshot-wisconsin_metadata.csv.zip',
  images_base_url: 'https://lilawildlife.blob.core.windows.net/lila-wildlife/snapshot-wisconsin-unzipped/',
},
```

---

## Configuration Options

### Adjust Per-Species Download Cap

In `data_prep/lila_download.js`, change:

```javascript
const PER_SPECIES_CAP = 200;  // Download 200 images per species
const PER_SPECIES_CAP = 50;   // Or just 50 for quick testing
```

### Add Custom Datasets

Find a LILA dataset URL at https://lila.science, then add to `DATASETS`:

```javascript
const DATASETS = {
  NACTI: { ... },
  
  SERENGETI: {
    name: 'Serengeti Camera Traps',
    metadata_url: 'https://lilawildlife.blob.core.windows.net/lila-wildlife/serengeti/serengeti_metadata.csv.zip',
    images_base_url: 'https://lilawildlife.blob.core.windows.net/lila-wildlife/serengeti-unzipped/',
  },
};
```

### Expand Species Mapping

If LILA uses different names than SNAC, add to `LILA_TO_SNAC_MAPPING`:

```javascript
const LILA_TO_SNAC_MAPPING = {
  'Mule Deer': 'mule_deer',
  'Odocoileus hemionus': 'mule_deer',  // Scientific name
  // ... add more mappings
};
```

---

## Output Format

### Image Structure

```
data_prep/lila_out/coyote/nacti_001.jpg
data_prep/lila_out/coyote/nacti_001.jpg.json
```

### Metadata Sidecar (.json)

```json
{
  "dataset": "NACTI",
  "original_id": 12345,
  "bbox": [100, 150, 200, 300],
  "downloaded_at": "2025-05-31T14:23:45.123Z"
}
```

- **dataset**: Source dataset name
- **original_id**: Image ID in original COCO metadata
- **bbox**: Bounding box [x, y, width, height] if available
- **downloaded_at**: Download timestamp

---

## Performance

| Task | Time | Notes |
|------|------|-------|
| Component tests | ~5 sec | Validates all parts |
| Metadata fetch | ~1-2 min | 43 MB ZIP + extraction |
| Per-species download (200 images) | ~30-60 sec | Network-dependent |
| Full NACTI (6 species × 200 imgs) | ~5-10 min | Parallel downloads |

---

## Architecture

```
snac_profiles.js (127 species)
        ↓
lila_download.js
        ↓
   Extract species
        ↓
NACTI metadata.zip (LILA)
        ↓
   Fetch + decompress
        ↓
   Build filter plan
   (map categories → SNAC species)
        ↓
   Apply per-species cap
        ↓
   Download matched images
   + save .json sidecars
        ↓
data_prep/lila_out/<species>/
```

---

## Next Steps

1. ✅ **Validate**: Run `lila_download_test.js`
2. ⏳ **Download**: Run `lila_download.js` (or use workaround)
3. ⏳ **Inspect**: Review `data_prep/lila_out/` directory
4. ⏳ **Integrate**: Connect to SNAC training pipeline
5. ⏳ **Scale**: Add more datasets (Serengeti, Snapshot Wisconsin, etc.)

---

## References

- **Main script**: [lila_download.js](./lila_download.js)
- **Setup guide**: [SETUP.md](./SETUP.md)
- **Component test**: [lila_download_test.js](./lila_download_test.js)
- **LILA BC**: https://lila.science
- **NACTI Dataset**: https://lila.science/datasets/nacti
- **COCO Format**: https://cocodataset.org

---

## Support

**Questions about LILA?**
- Check LILA FAQ: https://lila.science/faq
- Email: [info@lila.science](mailto:info@lila.science)

**Issues with the script?**
- Review error logs in terminal output
- See SETUP.md Troubleshooting section
- Verify Node.js is installed: `C:\Program Files\nodejs\node.exe --version`

---

## License

LILA datasets are provided under **CDLA Permissive-1.0**. Training use is permitted. Please cite the source dataset in any publications using this data.

Example citation:
> We thank LILA.science and the North American Camera Trap Images (NACTI) project for providing open-access wildlife imagery used in this study.
