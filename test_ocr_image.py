#!/usr/bin/env python3
"""
Test OCR with image file
"""
import base64
import json
import requests
import sys

# Image path
image_path = sys.argv[1] if len(sys.argv) > 1 else "IMG_20251122_014356.jpg"

print(f"📸 Leyendo imagen: {image_path}")
try:
    with open(image_path, 'rb') as f:
        image_data = f.read()
    print(f"✅ Imagen leída ({len(image_data)} bytes)")
except FileNotFoundError:
    print(f"❌ Error: Archivo no encontrado: {image_path}")
    sys.exit(1)

# Convert to base64
print("🔄 Convirtiendo a base64...")
base64_image = base64.b64encode(image_data).decode('utf-8')
print(f"✅ Base64 generado ({len(base64_image)} caracteres)")

# Prepare request
print("\n📤 Enviando a OCR endpoint: http://localhost:5000/api/ocr/process-image")
url = "http://localhost:5000/api/ocr/process-image"
headers = {"Content-Type": "application/json"}
payload = {
    "imageBase64": base64_image,
    "mimeType": "image/jpeg",
    "language": "es"
}

try:
    print("⏳ Esperando respuesta...")
    response = requests.post(url, json=payload, timeout=60)
    
    print(f"\n📥 Respuesta recibida (Status: {response.status_code})")
    data = response.json()
    
    # Pretty print response
    print("\n" + "="*60)
    print("RESPUESTA DEL OCR:")
    print("="*60)
    print(json.dumps(data, indent=2, ensure_ascii=False))
    print("="*60)
    
    if data.get('success'):
        print("\n✅ ÉXITO: OCR procesó la imagen correctamente")
        print("\n📝 PREGUNTA EXTRAÍDA:")
        print(f"   {data.get('pregunta', 'N/A')}")
        print("\n📋 OPCIONES EXTRAÍDAS:")
        opciones = data.get('opciones', {})
        for key in ['a', 'b', 'c', 'd']:
            print(f"   {key.upper()}) {opciones.get(key, 'N/A')}")
        print("\n📄 TEXTO RAW:")
        print(data.get('rawText', 'N/A'))
    else:
        print(f"\n❌ ERROR: {data.get('error', 'Unknown error')}")
        
except requests.exceptions.ConnectionError:
    print("❌ Error: No puedo conectar al backend")
    print("   ¿El servidor está corriendo en http://localhost:5000?")
except requests.exceptions.Timeout:
    print("❌ Error: Timeout - la solicitud tardó demasiado")
except json.JSONDecodeError:
    print(f"❌ Error: Respuesta inválida del servidor")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
