@echo off
echo Starting SNAC Backend - Layer 4 Vision API with YOLO...
echo.
echo Make sure Python 3.11+ is installed and in PATH
echo.
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.11+ from https://python.org
    echo Add python.exe to your PATH environment variable
    pause
    exit /b 1
)
echo.
echo Installing dependencies (including PyTorch and ultralytics for YOLO)...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.
echo Loading YOLO model from HuggingFace (this may take a moment)...
echo Starting FastAPI server on http://localhost:8000
echo Press Ctrl+C to stop
echo.
python main.py