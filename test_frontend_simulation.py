#!/usr/bin/env python3
"""
Frontend OCR Simulation Test
Simula exactamente lo que hace el frontend React
"""
import base64
import json
import requests
import sys
from pathlib import Path

def simulate_frontend_ocr(image_path):
    """
    Simula el componente OCRQuestionCapture.jsx
    """
    
    print("\n" + "="*80)
    print("🎯 SIMULANDO FRONTEND - OCRQuestionCapture.jsx")
    print("="*80)
    
    # Check if file exists
    if not Path(image_path).exists():
        print(f"❌ Archivo no encontrado: {image_path}")
        return
    
    # Read image
    print(f"\n📷 Leyendo imagen: {image_path}")
    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    file_size = len(image_data) / (1024 * 1024)  # MB
    print(f"   Tamaño: {file_size:.2f} MB")
    
    # Validate image size (max 5MB per frontend validation)
    if file_size > 5:
        print(f"   ⚠️  Imagen muy grande (máximo 5MB)")
        return
    
    print(f"   ✅ Validación de tamaño: OK")
    
    # Convert to base64
    print(f"\n🔄 Codificando a Base64...")
    base64_image = base64.b64encode(image_data).decode('utf-8')
    print(f"   Base64 length: {len(base64_image)} caracteres")
    
    # Prepare payload (exactly as frontend does)
    print(f"\n📤 Enviando a backend...")
    payload = {
        "imageBase64": base64_image,
        "mimeType": "image/jpeg",
        "language": "es"
    }
    
    # POST to backend
    url = "http://localhost:5000/api/ocr/process-image"
    print(f"   POST {url}")
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        print(f"   ✅ HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Parse response
    print(f"\n📥 Procesando respuesta...")
    try:
        result = response.json()
    except:
        print(f"   ❌ Respuesta no es JSON válido")
        print(f"   Contenido: {response.text[:300]}")
        return
    
    print(f"   ✅ JSON válido")
    
    # Check if OCR was successful
    if not result.get('success'):
        error = result.get('error', 'Unknown error')
        print(f"\n   ❌ OCR Error: {error}")
        return
    
    # Extract data
    pregunta = result.get('pregunta', '')
    opciones = result.get('opciones', {})
    raw_text = result.get('rawText', '')
    
    print(f"\n🎤 PREGUNTA DETECTADA:")
    if pregunta and not pregunta.startswith('Pregunta'):
        print(f"   ✅ {pregunta}")
        question_detected = True
    else:
        print(f"   ❌ [No detectada]")
        question_detected = False
    
    print(f"\n📋 OPCIONES DETECTADAS:")
    options_detected = 0
    for letter in ['a', 'b', 'c', 'd']:
        opt = opciones.get(letter, '')
        if opt and not opt.startswith('Opción'):
            print(f"   ✅ {letter.upper()}: {opt}")
            options_detected += 1
        else:
            print(f"   ❌ {letter.upper()}: [No detectada]")
    
    print(f"\n📊 ESTADÍSTICAS:")
    print(f"   • Pregunta: {question_detected}")
    print(f"   • Opciones detectadas: {options_detected}/4")
    print(f"   • Texto raw length: {len(raw_text)} caracteres")
    
    # Simulate frontend validation (from lines 211-240 in OCRQuestionCapture.jsx)
    print(f"\n✔️  VALIDACIÓN FRONTEND:")
    
    # Check if question is empty
    question_valid = bool(pregunta and not pregunta.startswith('Pregunta'))
    print(f"   • Pregunta completada: {question_valid}")
    
    # Check if at least 2 options are filled
    filled_options = sum(1 for opt in opciones.values() 
                        if opt and not opt.startswith('Opción'))
    options_valid = filled_options >= 2
    print(f"   • Al menos 2 opciones: {options_valid} ({filled_options}/4)")
    
    # Final verdict
    print(f"\n" + "="*80)
    if question_valid and options_valid:
        print(f"✅ PUEDO ENVIAR DIRECTAMENTE (OCR detectó todo)")
        print(f"   La pregunta se guardaría ahora en la base de datos")
    elif not question_valid:
        print(f"⚠️  DEBO PEDIR AL USUARIO QUE EDITE LA PREGUNTA")
        print(f"   • Frontend muestra: 'Pregunta (requerida)'")
        print(f"   • Campo resaltado en naranja")
        print(f"   • Usuario puede editar manualmente")
    elif options_valid < 2:
        print(f"⚠️  DEBO PEDIR AL USUARIO QUE COMPLETE LAS OPCIONES")
        print(f"   • Frontend muestra: 'Opción X (opcional)' en naranja")
        print(f"   • Usuario puede editar manualmente")
        print(f"   • Botón 'Confirmar' habilitado cuando hay 2+ opciones")
    
    print(f"\n🎯 RESULTADO FINAL:")
    if question_valid and options_valid:
        print(f"   ✅ FLUJO AUTOMÁTICO - No requiere intervención del usuario")
    else:
        print(f"   ✏️  FLUJO CON EDICIÓN - Usuario completa manualmente")
        print(f"   Este comportamiento es NORMAL y ESPERADO")
    
    print("="*80 + "\n")

if __name__ == '__main__':
    image_path = sys.argv[1] if len(sys.argv) > 1 else "IMG_20251122_014356.jpg"
    simulate_frontend_ocr(image_path)
