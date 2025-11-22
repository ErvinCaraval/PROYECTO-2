#!/usr/bin/env python3
"""
OCR Quality Test
Demuestra cómo la calidad de imagen afecta OCR
"""
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw
import base64
import io
import json
import requests

def create_test_image_with_text():
    """Crea una imagen limpia con texto de prueba"""
    # Crear imagen blanca
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Texto a escribir (similar a una pregunta de examen)
    text = """¿Cuál es la capital de España?

A) Barcelona
B) Madrid
C) Valencia
D) Sevilla"""
    
    # Dibujar texto en negro
    draw.text((50, 50), text, fill='black')
    
    # Guardar y retornar
    return img

def test_ocr_with_image(img):
    """Test OCR con una imagen específica"""
    
    # Convertir a JPEG en memoria
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG", quality=95)
    image_data = buffered.getvalue()
    
    # Base64
    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    # POST
    url = "http://localhost:5000/api/ocr/process-image"
    payload = {
        "imageBase64": base64_image,
        "mimeType": "image/jpeg",
        "language": "es"
    }
    
    response = requests.post(url, json=payload, timeout=60)
    return response.json()

def main():
    print("\n" + "="*80)
    print("🧪 OCR QUALITY TEST - Demostrando el impacto de la calidad de imagen")
    print("="*80)
    
    print("\n📸 Creando imagen de prueba con texto claro...")
    test_img = create_test_image_with_text()
    
    print("✅ Imagen creada (800x600, texto negro sobre blanco)")
    
    print("\n🔄 Enviando a OCR...")
    result = test_ocr_with_image(test_img)
    
    if not result.get('success'):
        print(f"❌ Error: {result.get('error')}")
        return
    
    pregunta = result.get('pregunta', '')
    opciones = result.get('opciones', {})
    
    print("\n📊 RESULTADOS:")
    print(f"\n🎤 Pregunta:")
    print(f"   {pregunta if pregunta and not pregunta.startswith('Pregunta') else '[No detectada]'}")
    
    print(f"\n📋 Opciones:")
    for letter in ['a', 'b', 'c', 'd']:
        opt = opciones.get(letter, '')
        status = "✅" if opt and not opt.startswith('Opción') else "❌"
        print(f"   {status} {letter.upper()}: {opt if opt else '[No detectada]'}")
    
    # Verify results
    detected_options = sum(1 for opt in opciones.values() 
                          if opt and not opt.startswith('Opción'))
    
    print("\n" + "="*80)
    if pregunta and not pregunta.startswith('Pregunta'):
        print("✅ OCR FUNCIONANDO CORRECTAMENTE CON IMAGEN DE CALIDAD")
    else:
        print("⚠️  OCR NO DETECTÓ PREGUNTA - Posible problema de calidad de imagen")
    print("="*80 + "\n")

if __name__ == '__main__':
    main()
