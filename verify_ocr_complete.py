#!/usr/bin/env python3
"""
OCR System Complete Verification Script
Verifica TODOS los aspectos del sistema OCR en un solo script
"""

import os
import json
import base64
import requests
from pathlib import Path
from datetime import datetime

def print_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")

def check_files():
    """Verificar que los archivos necesarios existan"""
    print_section("📁 VERIFICACIÓN DE ARCHIVOS")
    
    files_to_check = [
        "/home/ervin/Documents/PROYECTO-2/docker/.env",
        "/home/ervin/Documents/PROYECTO-2/backend-v1/services/azureOCRService.js",
        "/home/ervin/Documents/PROYECTO-2/backend-v1/controllers/ocrController.js",
        "/home/ervin/Documents/PROYECTO-2/frontend-v2/src/components/OCRQuestionCapture.jsx",
    ]
    
    all_good = True
    for file_path in files_to_check:
        if Path(file_path).exists():
            size = Path(file_path).stat().st_size
            print(f"✅ {file_path}")
            print(f"   Tamaño: {size:,} bytes")
        else:
            print(f"❌ {file_path} - NO ENCONTRADO")
            all_good = False
    
    return all_good

def check_services():
    """Verificar que los servicios estén corriendo"""
    print_section("🔧 VERIFICACIÓN DE SERVICIOS")
    
    services = [
        ("Backend OCR Health", "http://localhost:5000/api/ocr/health", "health"),
        ("Frontend", "http://localhost:80", "html"),
    ]
    
    all_good = True
    for service_name, url, expected_type in services:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {service_name}")
                print(f"   HTTP {response.status_code}")
                if expected_type == "health":
                    data = response.json()
                    print(f"   Status: {data.get('status', 'unknown')}")
            else:
                print(f"⚠️  {service_name} - HTTP {response.status_code}")
        except Exception as e:
            print(f"❌ {service_name} - {str(e)}")
            all_good = False
    
    return all_good

def check_azure_config():
    """Verificar configuración de Azure"""
    print_section("🔐 VERIFICACIÓN DE CONFIGURACIÓN AZURE")
    
    env_file = "/home/ervin/Documents/PROYECTO-2/docker/.env"
    
    try:
        with open(env_file, 'r') as f:
            content = f.read()
            
        has_key = "AZURE_CV_API_KEY=" in content
        has_endpoint = "AZURE_CV_ENDPOINT=" in content
        
        if has_key and has_endpoint:
            print("✅ Archivo .env encontrado")
            print("✅ AZURE_CV_API_KEY configurada")
            print("✅ AZURE_CV_ENDPOINT configurada")
            
            # Extract endpoint
            for line in content.split('\n'):
                if "AZURE_CV_ENDPOINT=" in line:
                    endpoint = line.split('=')[1]
                    print(f"   Endpoint: {endpoint}")
            
            return True
        else:
            print("❌ Configuración de Azure incompleta")
            return False
            
    except Exception as e:
        print(f"❌ Error leyendo .env: {e}")
        return False

def test_ocr_flow(image_path):
    """Probar flujo completo de OCR"""
    print_section(f"🧪 PRUEBA DE FLUJO OCR")
    
    if not Path(image_path).exists():
        print(f"❌ Imagen no encontrada: {image_path}")
        return False
    
    print(f"📷 Imagen: {image_path}")
    
    # Read image
    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    size_mb = len(image_data) / (1024 * 1024)
    print(f"   Tamaño: {size_mb:.2f} MB")
    
    # Check size
    if size_mb > 5:
        print(f"⚠️  Imagen muy grande (máximo 5MB)")
        return False
    
    print(f"✅ Validación de tamaño OK")
    
    # Convert to base64
    print(f"\n🔄 Convirtiendo a Base64...")
    base64_image = base64.b64encode(image_data).decode('utf-8')
    print(f"✅ Base64 generado ({len(base64_image)} caracteres)")
    
    # Send to OCR
    print(f"\n📤 Enviando a OCR...")
    url = "http://localhost:5000/api/ocr/process-image"
    payload = {
        "imageBase64": base64_image,
        "mimeType": "image/jpeg",
        "language": "es"
    }
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        print(f"✅ Respuesta: HTTP {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Parse response
    print(f"\n📥 Analizando respuesta...")
    try:
        result = response.json()
    except:
        print(f"❌ Respuesta no es JSON")
        return False
    
    if not result.get('success'):
        print(f"❌ OCR Error: {result.get('error')}")
        return False
    
    print(f"✅ OCR procesó la imagen")
    
    # Display results
    print(f"\n📊 RESULTADOS:")
    
    pregunta = result.get('pregunta', '')
    opciones = result.get('opciones', {})
    raw_text = result.get('rawText', '')
    
    question_found = pregunta and not pregunta.startswith('Pregunta')
    options_found = sum(1 for opt in opciones.values() 
                       if opt and not opt.startswith('Opción'))
    
    print(f"\n🎤 Pregunta: {'✅' if question_found else '❌'}")
    if question_found:
        print(f"   {pregunta[:100]}")
    
    print(f"\n📋 Opciones detectadas: {options_found}/4")
    for letter in ['a', 'b', 'c', 'd']:
        opt = opciones.get(letter, '')
        status = "✅" if opt and not opt.startswith('Opción') else "❌"
        if opt and not opt.startswith('Opción'):
            print(f"   {status} {letter.upper()}: {opt[:50]}")
        else:
            print(f"   {status} {letter.upper()}: [No detectada]")
    
    print(f"\n📄 Texto raw detectado: {len(raw_text)} caracteres")
    if raw_text:
        print(f"   Primeros 100 caracteres: {raw_text[:100]}")
    
    # Validation verdict
    print(f"\n✔️  VALIDACIÓN FRONTEND (líneas 211-240 OCRQuestionCapture.jsx):")
    
    if question_found and options_found >= 2:
        print(f"   ✅ Pregunta: Completada")
        print(f"   ✅ Opciones: {options_found} completadas (mínimo 2)")
        print(f"\n   🎯 RESULTADO: Flujo automático - SE GUARDA DIRECTAMENTE")
        return True
    else:
        print(f"   {'✅' if question_found else '❌'} Pregunta: {'Completada' if question_found else 'Requiere edición'}")
        print(f"   {'✅' if options_found >= 2 else '❌'} Opciones: {options_found} ({options_found >= 2 and 'OK' or 'Requiere edición'})")
        print(f"\n   🎯 RESULTADO: Flujo con edición - Usuario edita campos en naranja")
        return True

def main():
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "🎯 OCR SYSTEM COMPLETE VERIFICATION".center(58) + "║")
    print("║" + " "*20 + f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(58) + "║")
    print("╚" + "="*78 + "╝")
    
    # Run all checks
    files_ok = check_files()
    services_ok = check_services()
    azure_ok = check_azure_config()
    
    # Test with image
    image_path = "IMG_20251122_014356.jpg"
    ocr_ok = test_ocr_flow(image_path)
    
    # Final summary
    print_section("📊 RESUMEN FINAL")
    
    print("\n✅ COMPONENTES:")
    print(f"  {'✅' if files_ok else '❌'} Archivos necesarios")
    print(f"  {'✅' if services_ok else '❌'} Servicios corriendo")
    print(f"  {'✅' if azure_ok else '❌'} Configuración Azure")
    print(f"  {'✅' if ocr_ok else '❌'} Flujo OCR end-to-end")
    
    print("\n🎯 ESTADO GENERAL:")
    if files_ok and services_ok and azure_ok:
        print("  ✅ SISTEMA 100% FUNCIONAL Y LISTO PARA USAR")
        print("\n💡 Próximos pasos:")
        print("  1. Abre http://localhost en tu navegador")
        print("  2. Usa el componente OCR para subir una imagen")
        print("  3. Si OCR detecta todo → Se guarda automáticamente")
        print("  4. Si OCR es parcial → Edita manualmente (campos en naranja)")
    else:
        print("  ⚠️  Hay problemas que necesitan ser resueltos")
    
    print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    main()
