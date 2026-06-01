# SNAC LILA Data Prep - Setup Guide

## Quick Start

The `lila_download.js` script implements a **metadata-first camera trap image downloader** for SNAC's wildlife classifier. It's designed to:

1. ✅ Extract SNAC's 127 species from `snac_profiles.js`
2. ✅ Fetch COCO metadata from LILA datasets
3. ✅ Map LILA category labels to SNAC species
4. ✅ Filter images by species with per-species caps
5. ✅ Download matched images + metadata sidecars

## Prerequisites

- **Node.js** 18+ (`C:\Program Files\nodejs\node.exe`)
- **PowerShell** (built-in on Windows, for ZIP extraction)
- **Internet connection** (to download from LILA/Azure)
- **Disk space** (200 images/species × N species; ~100-500 MB per dataset)

## Installation

```bash
cd data_prep
npm install  # (no external dependencies needed - uses Node built-ins)
```

## Usage

### Standard Run (Metadata-First)

```bash
node lila_download.js
```

This processes NACTI with default settings:
- Species cap: 200 images per species
- Output: `data_prep/lila_out/<species>/`

### Troubleshooting

#### Issue: PowerShell extraction failed

**Error:**
```
[WARN] PowerShell extraction failed, falling back to Node ZIP parsing
[DEBUG] Found: nacti_metadata.1.14.json (method=8, 1170017505 bytes)
[WARN] Failed to extract nacti_metadata.1.14.json: incorrect header check
```

**Cause:** The NACTI metadata ZIP appears to have a corrupt or non-standard DEFLATE stream.

**Solutions:**

1. **Manual Download & Extract** (Recommended)
   ```bash
   # Download metadata ZIP to data_prep/
   # On Windows:
   $url = "https://lilawildlife.blob.core.windows.net/lila-wildlife/nacti/nacti_metadata.1.14.json.zip"
   Invoke-WebRequest -Uri $url -OutFile "data_prep/nacti_metadata.json.zip"
   
   # Extract with PowerShell
   Expand-Archive -Path "data_prep/nacti_metadata.json.zip" -DestinationPath "data_prep/" -Force
   ```

   Then, modify the script to use the local JSON:
   ```javascript
   // In lila_download.js, change DATASETS:
   metadata_url: 'file:///C:/Users/604Ac/Snac-project/snac-working-build (13)/snac-working-build/data_prep/nacti_metadata.1.14.json',
   ```

2. **Use Alternative LILA Dataset**
   
   Try a different camera trap dataset that doesn't have ZIP issues. Examples:
   - **Snapshot Wisconsin** (smaller, COCO format available)
   - **Missouri Camera Traps**
   - **Serengeti Camera Traps** (if SNAC species present)

   Check LILA for alternative metadata URLs without ZIP compression.

3. **Contact LILA**
   
   Report the metadata ZIP corruption at [info@lila.science](mailto:info@lila.science)

#### Issue: PowerShell not found

**Error:**
```
PowerShell is not recognized...
```

**Solution:**
PowerShell should be available on Windows 10+. If missing, install it or use WSL2. Alternatively, use a Linux/Mac machine where `unzip` is available (native in the script).

#### Issue: Network timeout

**Error:**
```
[ERROR] Metadata ZIP fetch failed: ... timeout
```

**Solution:**
The LILA Azure CDN might be slow. Retry or increase timeout in the script:
```javascript
const timeoutMs = 300000; // 5 minutes
```

## Dataset Configuration

### Adding New Datasets

Edit `DATASETS` in `lila_download.js`:

```javascript
const DATASETS = {
  NACTI: { ... },
  
  NEW_DATASET: {
    name: 'Dataset Full Name',
    metadata_url: 'https://lila.example.com/metadata.json',  // or .json.zip
    images_base_url: 'https://lila.example.com/images/',
  },
};
```

### LILA Datasets with SNAC Species

Check which LILA datasets contain SNAC species:
- **NACTI**: Coyote, White-tailed Deer, Gray Wolf, Bobcat, Raccoon, Red Fox
- **Snapshot Wisconsin**: Deer, wolves, coyotes (if available)
- **Serengeti**: Lions, leopards, cheetahs, antelopes (carnivore/ungulate focus)

See LILA taxonomy mapping: https://lila.science/taxonomy-mapping-for-camera-trap-data-sets/

## Output Structure

```
data_prep/lila_out/
├── coyote/
│   ├── image_001.jpg
│   ├── image_001.jpg.json         # metadata sidecar
│   ├── image_002.jpg
│   ├── image_002.jpg.json
│   └── ...
├── white_tailed_deer/
│   ├── ...
└── ...
```

Each `.jpg.json` contains:
```json
{
  "dataset": "NACTI",
  "original_id": 12345,
  "bbox": [x, y, width, height],
  "downloaded_at": "2025-05-31T14:23:45.123Z"
}
```

## Performance Notes

- **First run**: ~1-5 minutes (metadata download + ZIP extraction)
- **Per-species download**: ~30-60 seconds for 200 images
- **Network bound**: Most time spent downloading from Azure/GCP CDNs
- **Cap enforcement**: Per-species cap (200 default) limits total download size

## Advanced Options

### Adjusting Per-Species Cap

```javascript
const PER_SPECIES_CAP = 50;  // Download only 50 images per species
```

### Custom Species Mapping

If LILA uses different common/scientific names:

```javascript
const LILA_TO_SNAC_MAPPING = {
  // Add new mappings
  'Mule Deer (subspecies variant)': 'mule_deer',
  'Canis latrans': 'coyote',  // Scientific name
};
```

### Batch Downloading

To download multiple datasets:

```bash
# Process NACTI and (any other configured dataset)
node lila_download.js
```

Logs will show:
```
Dataset | Species | Matched | Downloaded | Failed
NACTI   | coyote  | 200     | 200        | 0
NACTI   | white_tailed_deer | 200 | 199 | 1
```

## Next Steps

1. ✅ Fix NACTI metadata ZIP (see Troubleshooting)
2. Run first download: `node lila_download.js`
3. Validate output in `data_prep/lila_out/`
4. Integrate with SNAC training pipeline
5. Scale to additional datasets + species

## References

- **LILA BC**: https://lila.science
- **NACTI Dataset**: https://lila.science/datasets/nacti
- **COCO Format**: https://cocodataset.org
- **Camera Trap Taxonomy**: https://lila.science/taxonomy-mapping-for-camera-trap-data-sets/

## License

LILA datasets are provided under **CDLA Permissive-1.0**. Training use is permitted. Always cite the source dataset in publications.

---

**Need help?**
- Check LILA FAQ: https://lila.science/faq
- Email LILA: [info@lila.science](mailto:info@lila.science)
- Review script logs for specific error messages
