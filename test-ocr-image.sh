#!/bin/bash

# Test OCR with a sample image file
# This helps diagnose what's happening with image processing

echo "🧪 Testing OCR Image Processing"
echo "================================"
echo ""

# Check if we have an image to test with
if [ ! -f "$1" ]; then
    echo "❌ Uso: $0 <path_to_image>"
    echo ""
    echo "Ejemplo:"
    echo "  bash test-ocr-image.sh IMG_20251122_014356.jpg"
    echo ""
    echo "Esto convertirá la imagen a base64 y la enviará al endpoint OCR"
    exit 1
fi

IMAGE_FILE="$1"
echo "📸 Archivo de imagen: $IMAGE_FILE"
echo ""

# Convert image to base64
echo "🔄 Convirtiendo imagen a base64..."
BASE64_IMAGE=$(base64 -w 0 "$IMAGE_FILE")
echo "✅ Imagen convertida (${#BASE64_IMAGE} caracteres)"
echo ""

# Send to OCR endpoint
echo "📤 Enviando a endpoint OCR: http://localhost:5000/api/ocr/process-image"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:5000/api/ocr/process-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "'$BASE64_IMAGE'",
    "mimeType": "image/jpeg",
    "language": "es"
  }')

echo "📥 Respuesta del servidor:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Parse the response
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ ÉXITO: OCR procesó la imagen correctamente"
    echo ""
    echo "Datos extraídos:"
    echo "$RESPONSE" | jq '.pregunta' 2>/dev/null && echo ""
    echo "$RESPONSE" | jq '.opciones' 2>/dev/null
else
    echo "❌ ERROR: OCR no pudo procesar la imagen"
    echo ""
    echo "Revisa:"
    echo "1. ¿La imagen tiene texto legible?"
    echo "2. ¿El endpoint está disponible?"
    echo "3. ¿Azure OCR está configurado correctamente?"
fi
