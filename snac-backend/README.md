# SNAC Backend - Layer 4 Vision API

FastAPI backend for SNAC animal track analysis system.

## Setup

1. **Install Python 3.11+**
   - Download from https://python.org
   - Make sure to check "Add Python to PATH" during installation
   - Or use: `winget install Python.Python.3.11`

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Run the server:**
```bash
python main.py
```
Or use the Windows batch script:
```bash
run_server.bat
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `POST /analyze-image` - Upload and analyze animal track image

## Integration

Set the environment variable in your Expo app:
```
EXPO_PUBLIC_VISION_API_URL=http://localhost:8000
```

Or for tunnel/remote access:
```
EXPO_PUBLIC_VISION_API_URL=https://your-tunnel-url.ngrok.io
```

## Development

Currently returns mock analysis results. Replace the mock data in `main.py` with actual computer vision models when ready.