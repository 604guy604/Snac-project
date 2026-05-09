from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import json
import io
from PIL import Image
import numpy as np
from ultralytics import YOLO
import torch

app = FastAPI(title="SNAC Vision API", description="Backend for SNAC animal track analysis")

# Allow CORS for Expo development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None

def load_yolo_model():
    """Load YOLO model from HuggingFace"""
    global model
    try:
        # Load the footprint YOLO model from HuggingFace
        model = YOLO('https://huggingface.co/risashinoda/footprint_yolo/resolve/main/best.pt')
        print("✅ YOLO model loaded successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to load YOLO model: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    load_yolo_model()

@app.get("/")
async def root():
    return {"message": "SNAC Vision API Layer 4 - Active", "model_loaded": model is not None}

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze uploaded image for animal tracks using YOLO.
    """
    if model is None:
        return {
            "error": "YOLO model not loaded",
            "species_candidates": [],
            "environmental_factors": {},
            "analysis_metadata": {"model_version": "none", "error": "model_not_loaded"}
        }

    try:
        # Read and process the uploaded image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Run YOLO inference
        results = model(image)

        # Process results
        species_candidates = []
        if results and len(results) > 0:
            result = results[0]  # Get first result

            # Extract detections
            if hasattr(result, 'boxes') and result.boxes is not None:
                boxes = result.boxes
                for i, box in enumerate(boxes):
                    # Get class name and confidence
                    class_id = int(box.cls.item())
                    confidence = float(box.conf.item())

                    # Map YOLO class to SNAC species (this is a simplified mapping)
                    # In production, you'd have a proper mapping table
                    species_name = map_yolo_class_to_species(class_id)

                    if species_name and confidence > 0.3:  # Filter low confidence
                        species_candidates.append({
                            "species": species_name,
                            "confidence": confidence,
                            "track_type": "detected_track",
                            "size_estimate": "unknown",  # Would need additional analysis
                            "direction": "unknown"  # Would need additional analysis
                        })

        # Sort by confidence
        species_candidates.sort(key=lambda x: x['confidence'], reverse=True)

        # Limit to top 5 candidates
        species_candidates = species_candidates[:5]

        # Return results in SNAC format
        return {
            "species_candidates": species_candidates,
            "environmental_factors": {
                "substrate": "detected_from_image",  # Could be enhanced with additional analysis
                "weather_conditions": "unknown",
                "time_estimate": "unknown"
            },
            "analysis_metadata": {
                "model_version": "risashinoda/footprint_yolo",
                "processing_time_ms": 0,  # Could measure this
                "image_quality": "analyzed",
                "detections_found": len(species_candidates)
            }
        }

    except Exception as e:
        print(f"Error processing image: {e}")
        return {
            "error": f"Processing failed: {str(e)}",
            "species_candidates": [],
            "environmental_factors": {},
            "analysis_metadata": {"model_version": "error", "error": str(e)}
        }

def map_yolo_class_to_species(class_id):
    """
    Map YOLO class IDs to SNAC species names.
    This is a simplified mapping - in production you'd have a comprehensive lookup table.
    """
    # This mapping would need to be created based on the actual YOLO model's classes
    # For now, using some common mappings as examples
    yolo_to_snac = {
        0: "White-tailed Deer",
        1: "Eastern Coyote",
        2: "Black Bear",
        3: "Bobcat",
        4: "Red Fox",
        5: "Gray Wolf",
        6: "Mountain Lion",
        7: "Elk",
        8: "Moose",
        9: "Mule Deer",
        # Add more mappings as needed
    }

    return yolo_to_snac.get(class_id, f"Unknown Species {class_id}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)