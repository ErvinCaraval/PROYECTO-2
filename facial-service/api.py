"""
Microservicio de Reconocimiento Facial
Usa DeepFace para verificación y registro facial
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import os
import tempfile
import traceback

app = Flask(__name__)
CORS(app)  # Permitir CORS para comunicación con el backend

# Configuración
UPLOAD_FOLDER = '/tmp/deepface_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def base64_to_image(base64_string):
    """Convierte una cadena Base64 a un archivo de imagen temporal"""
    try:
        # Remover el prefijo data:image si existe
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decodificar Base64
        image_data = base64.b64decode(base64_string)
        
        # Crear archivo temporal
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg', dir=UPLOAD_FOLDER)
        temp_file.write(image_data)
        temp_file.close()
        
        return temp_file.name
    except Exception as e:
        raise Exception(f"Error decodificando imagen Base64: {str(e)}")

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud para verificar que el servicio está funcionando"""
    return jsonify({
        'status': 'ok',
        'service': 'facial-recognition',
        'version': '1.0.0'
    })

@app.route('/register', methods=['POST'])
def register():
    """
    Endpoint para registrar una cara
    Recibe una imagen en Base64 y genera embeddings
    """
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Se requiere una imagen en Base64'
            }), 400
        
        image_base64 = data['image']
        user_id = data.get('user_id', 'unknown')
        
        # Convertir Base64 a imagen temporal
        image_path = base64_to_image(image_base64)
        
        try:
            # Verificar que la imagen contiene una cara
            result = DeepFace.analyze(
                img_path=image_path,
                actions=['age', 'gender', 'race', 'emotion'],
                enforce_detection=True
            )
            
            # Generar embeddings
            embedding = DeepFace.represent(
                img_path=image_path,
                model_name='VGG-Face',
                enforce_detection=True
            )
            
            # Limpiar archivo temporal
            os.unlink(image_path)
            
            return jsonify({
                'success': True,
                'message': 'Cara registrada exitosamente',
                'user_id': user_id,
                'embedding': embedding[0]['embedding'] if embedding else None,
                'face_detected': True
            }), 200
            
        except ValueError:
            os.unlink(image_path)
            return jsonify({
                'success': False,
                'error': 'No se detectó una cara en la imagen. Por favor, asegúrate de que tu rostro sea claramente visible.',
                'face_detected': False
            }), 400
            
    except Exception as e:
        if 'image_path' in locals() and os.path.exists(image_path):
            os.unlink(image_path)
        
        return jsonify({
            'success': False,
            'error': f'Error procesando registro facial: {str(e)}',
            'traceback': traceback.format_exc() if app.debug else None
        }), 500

@app.route('/verify', methods=['POST'])
def verify():
    """
    Endpoint para verificar una cara
    Compara dos imágenes y retorna si son la misma persona
    """
    try:
        data = request.get_json()
        
        if not data or 'img1' not in data or 'img2' not in data:
            return jsonify({
                'success': False,
                'verified': False,
                'error': 'Se requieren dos imágenes (img1 e img2) en Base64'
            }), 400
        
        img1_base64 = data['img1']
        img2_base64 = data['img2']
        
        img1_path = base64_to_image(img1_base64)
        img2_path = base64_to_image(img2_base64)
        
        try:
            result = DeepFace.verify(
                img1_path=img1_path,
                img2_path=img2_path,
                model_name='VGG-Face',
                distance_metric='cosine',
                enforce_detection=True
            )
            
            os.unlink(img1_path)
            os.unlink(img2_path)
            
            verified = result.get('verified', False)
            distance = result.get('distance', 1.0)
            threshold = result.get('threshold', 0.4)
            
            return jsonify({
                'success': True,
                'verified': verified,
                'distance': float(distance),
                'threshold': float(threshold),
                'confidence': float(1 - min(distance / threshold, 1.0)) if verified else 0.0
            }), 200
            
        except ValueError:
            if os.path.exists(img1_path):
                os.unlink(img1_path)
            if os.path.exists(img2_path):
                os.unlink(img2_path)
            
            return jsonify({
                'success': False,
                'verified': False,
                'error': 'No se detectó una cara en una o ambas imágenes.',
                'face_detected': False
            }), 400
            
    except Exception as e:
        if 'img1_path' in locals() and os.path.exists(img1_path):
            os.unlink(img1_path)
        if 'img2_path' in locals() and os.path.exists(img2_path):
            os.unlink(img2_path)
        
        return jsonify({
            'success': False,
            'verified': False,
            'error': f'Error procesando verificación facial: {str(e)}',
            'traceback': traceback.format_exc() if app.debug else None
        }), 500

if __name__ == '__main__':
    # No usar request_timeout: Flask no lo soporta
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)