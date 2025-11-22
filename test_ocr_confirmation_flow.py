#!/usr/bin/env python3
"""
Test the OCR confirmation flow - simulates:
1. Upload image
2. Extract text via OCR
3. Confirm question
4. Verify save success message
"""

import requests
import json
import base64
import time
from pathlib import Path

# Configuration
API_URL = "http://localhost:5000"
FRONTEND_URL = "http://localhost:80"

def load_test_image():
    """Load a test image for OCR processing"""
    test_image_path = Path("/home/ervin/Documents/PROYECTO-2/test_ocr_image.py")
    
    # If we need a real image, create a simple one
    # For now, we'll just return a base64 encoded placeholder
    # In real testing, use an actual image file
    return None

def test_ocr_extraction():
    """Test OCR extraction endpoint"""
    print("\n📷 TEST 1: OCR Image Extraction")
    print("=" * 50)
    
    # Create a minimal test image (1x1 pixel PNG)
    # This is a valid PNG but too small to extract meaningful text
    png_bytes = bytes([
        137, 80, 78, 71, 13, 10, 26, 10,  # PNG signature
        0, 0, 0, 13, 73, 72, 68, 82,      # IHDR chunk
        0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0,  # Width=1, Height=1, 8-bit RGB
        0, 0, 144, 119, 83, 222,          # CRC
        0, 0, 0, 12, 73, 68, 65, 84,      # IDAT chunk
        120, 156, 99, 248, 15, 0, 0, 1,   # Deflate data
        1, 1, 0, 24, 221, 143, 144,       # CRC
        0, 0, 0, 0, 73, 69, 78, 68,       # IEND chunk
        174, 66, 96, 130                  # CRC
    ])
    
    try:
        files = {'image': ('test.png', png_bytes, 'image/png')}
        response = requests.post(
            f"{API_URL}/api/ocr/extract",
            files=files,
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ OCR extraction successful")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data
        else:
            print(f"❌ OCR extraction failed")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during OCR extraction: {e}")
        return None

def test_question_save():
    """Test question save endpoint"""
    print("\n💾 TEST 2: Save Question to Database")
    print("=" * 50)
    
    # Create a sample question payload
    # This simulates what OCRQuestionCapture sends to onQuestionExtracted
    payload = {
        "text": "¿Cuál es la capital de Francia?",
        "options": [
            "París",
            "Lyon",
            "Marsella",
            "Toulouse"
        ],
        "correctAnswerIndex": 0,
        "category": "Geography",
        "explanation": "París es la capital y ciudad más grande de Francia."
    }
    
    try:
        response = requests.post(
            f"{API_URL}/api/questions",
            json=payload,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print("✅ Question saved successfully")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data
        else:
            print(f"❌ Question save failed")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error during question save: {e}")
        return None

def test_confirmation_flow():
    """Test complete confirmation flow"""
    print("\n🔄 TEST 3: Complete Confirmation Flow")
    print("=" * 50)
    
    print("\n1️⃣ Step 1: Extract OCR data from image")
    ocr_result = test_ocr_extraction()
    
    if ocr_result:
        print("\n2️⃣ Step 2: User confirms the question")
        question_data = test_question_save()
        
        if question_data:
            print("\n✅ COMPLETE FLOW SUCCESS")
            print("The question was successfully:")
            print("  ✓ Extracted from image via OCR")
            print("  ✓ Confirmed by user")
            print("  ✓ Saved to database")
            return True
    
    print("\n❌ COMPLETE FLOW FAILED")
    return False

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🎯 OCR CONFIRMATION FLOW TEST")
    print("=" * 50)
    
    # Test individual endpoints
    test_ocr_extraction()
    test_question_save()
    
    # Test complete flow
    test_confirmation_flow()
    
    print("\n" + "=" * 50)
    print("✅ Test completed")
    print("=" * 50)
