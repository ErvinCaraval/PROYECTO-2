"""
Microservicio de Reconocimiento Facial - VERSIÓN ESCALABLE
Usa DeepFace para verificación y registro facial con:
- Cola de procesamiento asincrónico
- Caché de embeddings
- Connection pooling
- Rate limiting
- Procesamiento paralelo
"""
from flask import Flask, request, jsonify, has_request_context
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from deepface import DeepFace
from functools import lru_cache
from queue import Queue, Empty
from threading import Thread, Lock, Semaphore
import cv2
import numpy as np
import base64
import os
import tempfile
import traceback
import logging
import time
from datetime import datetime, timedelta
import hashlib
import json
import redis as redis_client

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Rate limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Configuración
# No se usan archivos temporales en disco: procesamos imágenes en memoria.

# ============ SISTEMA DE CACHÉ Y POOL ============
class EmbeddingCache:
    """Caché en memoria para embeddings con expiración"""
    def __init__(self, max_size=1000, ttl_seconds=3600, enabled=True):
        self.cache = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.lock = Lock()
        self.persistent_store = None
        self.enabled = enabled
    
    def _hash_image(self, image_base64):
        """Genera hash SHA256 de la imagen"""
        return hashlib.sha256(image_base64.encode()).hexdigest()
    
    def get(self, image_base64):
        """Obtiene embedding del caché"""
        hash_key = self._hash_image(image_base64)

        # If in-memory cache is disabled, read directly from persistent store (if available)
        if not self.enabled:
            if self.persistent_store:
                try:
                    persistent = self.persistent_store.get(hash_key)
                    if persistent:
                        logger.info(f"✓ Embedding obtenido desde persistente (hash: {hash_key[:8]}...)")
                        return persistent
                except Exception as e:
                    logger.warning(f"Error consultando persistente: {str(e)}")
            return None

        # Normal in-memory flow
        with self.lock:
            if hash_key in self.cache:
                embedding, timestamp = self.cache[hash_key]
                # Verificar si no ha expirado
                if datetime.now() - timestamp < timedelta(seconds=self.ttl_seconds):
                    logger.info(f"✓ Embedding encontrado en caché (hash: {hash_key[:8]}...)")
                    return embedding
                else:
                    del self.cache[hash_key]

            # Si no está en memoria, intentar persistente si está configurado
            if self.persistent_store:
                try:
                    persistent = self.persistent_store.get(hash_key)
                    if persistent:
                        # Restaurar en memoria
                        self.cache[hash_key] = (persistent, datetime.now())
                        logger.info(f"✓ Embedding restaurado desde persistente (hash: {hash_key[:8]}...)")
                        return persistent
                except Exception as e:
                    logger.warning(f"Error consultando persistente: {str(e)}")
            return None
    
    def set(self, image_base64, embedding):
        """Almacena embedding en caché"""
        hash_key = self._hash_image(image_base64)

        # If in-memory cache is disabled, only write to persistent store
        if not self.enabled:
            if self.persistent_store:
                try:
                    # write synchronously to ensure persistence
                    self.persistent_store.set(hash_key, embedding)
                except Exception as e:
                    logger.warning(f"Persistent store set error (disabled inmem): {str(e)}")
            return

        # Normal in-memory flow
        with self.lock:
            # Limpiar caché si alcanza tamaño máximo
            if len(self.cache) >= self.max_size:
                oldest_key = min(self.cache.keys(), 
                               key=lambda k: self.cache[k][1])
                del self.cache[oldest_key]

            self.cache[hash_key] = (embedding, datetime.now())
            # Guardar también en persistente de forma asíncrona
            if self.persistent_store:
                try:
                    Thread(target=self.persistent_store.set, args=(hash_key, embedding), daemon=True).start()
                except Exception as e:
                    logger.warning(f"No se pudo iniciar hilo para persistente: {str(e)}")

# Control para habilitar/deshabilitar caché en memoria. Por seguridad y para
# garantizar que los embeddings se persistan únicamente en Redis cuando se
# desea, por defecto la caché en memoria queda DESHABILITADA. Para activar
# la caché local explícitamente establezca `USE_INMEM_CACHE=1`.
USE_INMEM_CACHE = os.getenv('USE_INMEM_CACHE', 'false').lower() in ('1', 'true', 'yes')
if not USE_INMEM_CACHE:
    logger.info("Caché en memoria DESHABILITADA — usando solo el persistent store para embeddings")
embedding_cache = EmbeddingCache(max_size=1000, ttl_seconds=3600, enabled=USE_INMEM_CACHE)

# ============ SISTEMA DE PROCESAMIENTO CON COLA ============
class ProcessingQueue:
    """Cola de procesamiento con workers paralelos"""
    def __init__(self, max_workers=3):
        self.queue = Queue()
        self.max_workers = max_workers
        self.active_tasks = 0
        self.lock = Lock()
        self.semaphore = Semaphore(max_workers)
        self.start_workers()
    
    def start_workers(self):
        """Inicia workers para procesar tareas"""
        for i in range(self.max_workers):
            worker = Thread(target=self._worker, daemon=True)
            worker.start()
            logger.info(f"Worker {i+1}/{self.max_workers} iniciado")
    
    def _worker(self):
        """Worker que procesa tareas de la cola"""
        while True:
            try:
                task = self.queue.get(timeout=1)
                if task is None:
                    break
                
                self.semaphore.acquire()
                try:
                    with self.lock:
                        self.active_tasks += 1
                    
                    logger.info(f"Procesando tarea: {task['id']} ({self.active_tasks} activas)")
                    task['callback'](task)
                finally:
                    self.semaphore.release()
                    with self.lock:
                        self.active_tasks -= 1
                    self.queue.task_done()
            except Empty:
                continue
    
    def add_task(self, task_id, callback):
        """Añade tarea a la cola"""
        self.queue.put({'id': task_id, 'callback': callback})
    
    def get_status(self):
        """Retorna estado de la cola"""
        return {
            'queue_size': self.queue.qsize(),
            'active_tasks': self.active_tasks,
            'max_workers': self.max_workers
        }

processing_queue = ProcessingQueue(max_workers=3)


USE_REDIS = os.getenv('USE_REDIS', 'true').lower() in ('1', 'true', 'yes')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
API_AUTH_TOKEN = os.getenv('API_AUTH_TOKEN', None)


class RedisEmbeddingStore:
    """Almacena embeddings en Redis como JSON (clave = hash_key)"""
    def __init__(self, url=REDIS_URL, ttl_seconds=3600):
        self.url = url
        self.ttl_seconds = ttl_seconds
        try:
            # redis.from_url handles parsing and connection pool
            self.client = redis_client.from_url(self.url, decode_responses=True)
        except Exception as e:
            logger.error(f"No se pudo conectar a Redis en {self.url}: {str(e)}")
            self.client = None

    def get(self, hash_key):
        try:
            if not self.client:
                return None
            raw = self.client.get(hash_key)
            if not raw:
                return None
            data = json.loads(raw)
            return data.get('embedding')
        except Exception as e:
            logger.warning(f"Redis get error: {str(e)}")
            return None

    def set(self, hash_key, embedding):
        try:
            if not self.client:
                raise RuntimeError('Redis client no inicializado')
            caller = request.remote_addr if has_request_context() else 'local'
            payload = json.dumps({
                'embedding': embedding,
                'created_at': datetime.now().isoformat()
            })
            # Set with expiration (TTL)
            self.client.set(hash_key, payload, ex=self.ttl_seconds)
            logger.info(f"✓ Embedding guardado en Redis (hash: {hash_key[:8]}...) caller={caller}")
        except Exception as e:
            logger.warning(f"Redis set error: {str(e)}")

    def delete(self, hash_key):
        """Elimina la entrada indicada por hash_key. Retorna True si existía y fue eliminada."""
        try:
            if not self.client:
                raise RuntimeError('Redis client no inicializado')
            removed = self.client.delete(hash_key)
            caller = request.remote_addr if has_request_context() else 'local'
            if removed:
                logger.info(f"✓ Embedding eliminado de Redis (hash: {hash_key[:8]}...) caller={caller}")
            else:
                logger.info(f"ℹ️ No se encontró embedding en Redis para (hash: {hash_key[:8]}...) caller={caller}")
            return bool(removed)
        except Exception as e:
            logger.warning(f"Redis delete error: {str(e)}")
            return False

    def set_user(self, user_id, embedding):
        """Guarda el embedding asociado a un user_id bajo la clave user:{user_id}"""
        try:
            if not self.client:
                raise RuntimeError('Redis client no inicializado')
            key = f"user:{user_id}"
            payload = json.dumps({
                'embedding': embedding,
                'created_at': datetime.now().isoformat()
            })
            self.client.set(key, payload, ex=self.ttl_seconds)
            caller = request.remote_addr if has_request_context() else 'local'
            logger.info(f"✓ Embedding guardado para usuario {user_id} en Redis caller={caller}")
        except Exception as e:
            logger.warning(f"Redis set_user error: {str(e)}")

    def get_user(self, user_id):
        """Obtiene el embedding guardado para un user_id, o None si no existe"""
        try:
            if not self.client:
                return None
            key = f"user:{user_id}"
            raw = self.client.get(key)
            if not raw:
                return None
            data = json.loads(raw)
            # Log read access for auditing
            caller = request.remote_addr if has_request_context() else 'local'
            logger.info(f"ℹ️ Redis get_user for user={user_id} caller={caller}")
            return data.get('embedding')
        except Exception as e:
            logger.warning(f"Redis get_user error: {str(e)}")
            return None

    def delete_user(self, user_id):
        try:
            if not self.client:
                raise RuntimeError('Redis client no inicializado')
            key = f"user:{user_id}"
            removed = self.client.delete(key)
            caller = request.remote_addr if has_request_context() else 'local'
            if removed:
                logger.info(f"✓ Embedding de usuario {user_id} eliminado de Redis caller={caller}")
            else:
                logger.info(f"ℹ️ No se encontró embedding de usuario {user_id} en Redis caller={caller}")
            return bool(removed)
        except Exception as e:
            logger.warning(f"Redis delete_user error: {str(e)}")
            return False


# Firebase removed: using Redis or in-memory persistent store only

# Inicializar Redis si está habilitado (cuando USE_REDIS=1 usaremos Redis como store)
if USE_REDIS:
    try:
        redis_store = RedisEmbeddingStore(url=REDIS_URL, ttl_seconds=3600)
        if redis_store.client:
            embedding_cache.persistent_store = redis_store
            logger.info(f"Redis inicializado y store inyectado desde {REDIS_URL}")
        else:
            logger.error(f"Redis no disponible en {REDIS_URL}")
    except Exception as e:
        logger.error(f"No se pudo inicializar Redis: {str(e)}")
        redis_store = None
else:
    redis_store = None

if not USE_INMEM_CACHE and not USE_REDIS:
    logger.error("Caché en memoria DESHABILITADA y no hay persistent store habilitado: los embeddings no se persistirán. Establece USE_REDIS=1 o habilita la caché.")

# ============ UTILIDADES ============
def base64_to_image(base64_string):
    """Convierte una cadena Base64 a un array numpy (BGR) en memoria.

    Devuelve una imagen compatible con DeepFace (numpy array). No crea archivos.
    """
    try:
        # Remover el prefijo data:image si existe
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]

        # Decodificar Base64 a bytes
        image_data = base64.b64decode(base64_string)

        # Convertir bytes a numpy array y decodificar con opencv
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise Exception('cv2.imdecode devolvió None')

        return img
    except Exception as e:
        raise Exception(f"Error decodificando imagen Base64: {str(e)}")

def cleanup_temp_files(*file_paths):
    """Funciona como no-op: ya no usamos archivos temporales en disco."""
    return


def require_write_auth():
    """Si `API_AUTH_TOKEN` está configurado, valida el header Authorization: Bearer <token>.
    Devuelve True si está autorizado, False en caso contrario.
    """
    if not API_AUTH_TOKEN:
        return True
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False
    token = auth.split(' ', 1)[1]
    return token == API_AUTH_TOKEN

# ============ ENDPOINTS ============

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud para verificar que el servicio está funcionando"""
    queue_status = processing_queue.get_status()
    return jsonify({
        'status': 'ok',
        'service': 'facial-recognition',
        'version': '2.0.0-scalable',
        'queue': queue_status,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/metrics', methods=['GET'])
def metrics():
    """Endpoint para obtener métricas del servicio"""
    queue_status = processing_queue.get_status()
    return jsonify({
        'inmem_cache_enabled': embedding_cache.enabled,
        'cache_size': len(embedding_cache.cache) if embedding_cache.enabled else 0,
        'cache_max_size': embedding_cache.max_size if embedding_cache.enabled else 0,
        'queue': queue_status,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/register', methods=['POST'])
@limiter.limit("10 per minute")
def register():
    """
    Endpoint para registrar una cara
    Recibe una imagen en Base64 y genera embeddings
    Implementa: caché, validación y manejo de errores robusto
    """
    start_time = time.time()
    image_array = None
    
    try:
        # Auth guard for write operations (only active if API_AUTH_TOKEN is configured)
        if not require_write_auth():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'Se requiere una imagen en Base64'
            }), 400
        
        image_base64 = data['image']
        user_id = data.get('user_id', 'unknown')
        
        logger.info(f"📸 Registro iniciado para usuario: {user_id}")
        
        # PASO 1: Verificar caché
        cached_embedding = embedding_cache.get(image_base64)
        if cached_embedding:
            return jsonify({
                'success': True,
                'message': 'Cara registrada exitosamente (desde caché)',
                'user_id': user_id,
                'embedding': cached_embedding,
                'face_detected': True,
                'processing_time_ms': round((time.time() - start_time) * 1000)
            }), 200
        
        # PASO 2: Convertir imagen (en memoria)
        try:
            image_array = base64_to_image(image_base64)
        except Exception as e:
            logger.error(f"Error al convertir imagen: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Error al procesar imagen Base64'
            }), 400
        
        # PASO 3: Analizar y detectar cara
        try:
            result = DeepFace.analyze(
                img_path=image_array,
                actions=['age', 'gender', 'race', 'emotion'],
                enforce_detection=True
            )
            logger.info(f"✓ Cara detectada para {user_id}")
            
        except ValueError:
            # no temp files to cleanup
            logger.warning(f"No se detectó cara para {user_id}")
            return jsonify({
                'success': False,
                'error': 'No se detectó una cara en la imagen.',
                'face_detected': False
            }), 400
        
        # PASO 4: Generar embeddings
        try:
            embedding = DeepFace.represent(
                img_path=image_array,
                model_name='VGG-Face',
                enforce_detection=True
            )
            
            embedding_data = embedding[0]['embedding'] if embedding else None

            # PASO 5: Cachear embedding
            embedding_cache.set(image_base64, embedding_data)
            logger.info(f"✓ Embedding generado y cacheado para {user_id}")

            # Si viene user_id, guardar también el embedding bajo user:{user_id} en el store persistente
            try:
                if user_id and embedding_cache.persistent_store and hasattr(embedding_cache.persistent_store, 'set_user'):
                    embedding_cache.persistent_store.set_user(user_id, embedding_data)
            except Exception as e:
                logger.warning(f"No se pudo guardar embedding por user_id: {str(e)}")
            
            # no temp files to cleanup
            
            return jsonify({
                'success': True,
                'message': 'Cara registrada exitosamente',
                'user_id': user_id,
                'embedding': embedding_data,
                'face_detected': True,
                'processing_time_ms': round((time.time() - start_time) * 1000)
            }), 200
            
        except Exception as e:
            logger.error(f"Error generando embedding: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Error al generar embeddings'
            }), 500
            
    except Exception as e:
        logger.error(f"Error en /register: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': f'Error procesando registro facial'
        }), 500

@app.route('/verify', methods=['POST'])
@limiter.limit("10 per minute")
def verify():
    """
    Endpoint para verificar una cara.
    Requiere Redis: obtiene (o calcula y persiste) embeddings para ambas imágenes
    y compara via cosine distance. No utiliza caché en disco ni caché en memoria.
    """
    start_time = time.time()

    try:
        data = request.get_json()

        if not data or 'img1' not in data or 'img2' not in data:
            return jsonify({
                'success': False,
                'verified': False,
                'error': 'Se requieren dos imágenes (img1 e img2) en Base64'
            }), 400

        if not embedding_cache.persistent_store:
            return jsonify({
                'success': False,
                'verified': False,
                'error': 'Redis requerido para /verify. Habilita USE_REDIS=1 y REDIS_URL.'
            }), 503

        img1_base64 = data['img1']
        img2_base64 = data['img2']
        user_id = data.get('user_id', 'unknown')

        logger.info(f"🔍 Verificación (persistente) iniciada para usuario: {user_id}")

        def get_or_persist_embedding(image_base64):
            try:
                emb = embedding_cache.get(image_base64)
                if emb:
                    logger.info("✓ Embedding obtenido desde persistente para verificación")
                    return emb
            except Exception as e:
                logger.warning(f"Error accediendo a embedding en persistent store: {e}")

            try:
                img_array_local = base64_to_image(image_base64)
                rep = DeepFace.represent(img_path=img_array_local, model_name='VGG-Face', enforce_detection=True)
                new_embedding = rep[0]['embedding'] if rep else None
                if new_embedding:
                    embedding_cache.set(image_base64, new_embedding)
                    logger.info("✓ Embedding calculado y persistido para verificación")
                return new_embedding
            except ValueError:
                raise
            except Exception as e:
                logger.error(f"Error generando embedding para verificación: {e}")
                return None

        emb1 = get_or_persist_embedding(img1_base64)
        emb2 = get_or_persist_embedding(img2_base64)

        if not emb1 or not emb2:
            return jsonify({
                'success': False,
                'verified': False,
                'error': 'No se pudo generar/recuperar embedding para una o ambas imágenes.',
                'face_detected': False
            }), 400

        def cosine_distance(a, b):
            try:
                import math
                dot = sum(x * y for x, y in zip(a, b))
                na = math.sqrt(sum(x * x for x in a))
                nb = math.sqrt(sum(y * y for y in b))
                if na == 0 or nb == 0:
                    return 1.0
                return 1.0 - (dot / (na * nb))
            except Exception:
                return 1.0

        distance = cosine_distance(emb1, emb2)
        threshold = float(os.getenv('FACE_VERIFY_THRESHOLD', '0.4'))
        verified = distance <= threshold

        log_status = "✓ VERIFICADO" if verified else "✗ NO VERIFICADO"
        logger.info(f"{log_status} para {user_id} (distancia: {distance:.4f}) [via Redis]")

        return jsonify({
            'success': True,
            'verified': verified,
            'distance': float(distance),
            'threshold': float(threshold),
            'confidence': float(1 - min(distance / threshold, 1.0)) if verified else 0.0,
            'processing_time_ms': round((time.time() - start_time) * 1000)
        }), 200
    except ValueError:
        logger.warning("No se detectó cara en una o ambas imágenes")
        return jsonify({
            'success': False,
            'verified': False,
            'error': 'No se detectó una cara en una o ambas imágenes.',
            'face_detected': False
        }), 400
    except Exception as e:
        logger.error(f"Error en /verify: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'success': False,
            'verified': False,
            'error': 'Error procesando verificación facial'
        }), 500


@app.route('/verify/user', methods=['POST'])
@limiter.limit("10 per minute")
def verify_user():
    """Verifica si la `image` (Base64) corresponde al `user_id` registrado.

    Request JSON: { "image": "<base64>", "user_id": "..." }
    """
    start_time = time.time()
    # no temp files; procesamos en memoria
    try:
        data = request.get_json() or {}
        image_base64 = data.get('image')
        user_id = data.get('user_id')

        if not image_base64 or not user_id:
            return jsonify({'success': False, 'verified': False, 'error': 'Se requieren `image` y `user_id`.'}), 400

        # Obtener embedding guardado para el usuario
        stored = None
        if embedding_cache.persistent_store and hasattr(embedding_cache.persistent_store, 'get_user'):
            try:
                stored = embedding_cache.persistent_store.get_user(user_id)
            except Exception as e:
                logger.warning(f"Error consultando embedding de usuario: {str(e)}")

        if not stored:
            return jsonify({'success': True, 'verified': False, 'error': 'Usuario no registrado'}), 200

        # Generar embedding de la imagen enviada (en memoria)
        try:
            img_array = base64_to_image(image_base64)
            emb = DeepFace.represent(img_path=img_array, model_name='VGG-Face', enforce_detection=True)
            new_embedding = emb[0]['embedding'] if emb else None
        except ValueError:
            return jsonify({'success': False, 'verified': False, 'error': 'No se detectó una cara en la imagen.'}), 400

        if not new_embedding:
            return jsonify({'success': False, 'verified': False, 'error': 'No se pudo generar embedding de la imagen.'}), 400

        # Comparar embeddings usando distancia coseno
        def cosine_distance(a, b):
            try:
                import math
                dot = sum(x * y for x, y in zip(a, b))
                na = math.sqrt(sum(x * x for x in a))
                nb = math.sqrt(sum(y * y for y in b))
                if na == 0 or nb == 0:
                    return 1.0
                return 1.0 - (dot / (na * nb))
            except Exception:
                return 1.0

        distance = cosine_distance(new_embedding, stored)
        threshold = float(os.getenv('FACE_VERIFY_THRESHOLD', '0.4'))
        verified = distance <= threshold

        logger.info(f"✓ VERIFICACION POR USUARIO para {user_id} => {'VERIFICADO' if verified else 'NO VERIFICADO'} (distancia: {distance:.4f})")

        return jsonify({
            'success': True,
            'verified': bool(verified),
            'distance': float(distance),
            'threshold': threshold,
            'processing_time_ms': round((time.time() - start_time) * 1000)
        }), 200

    except Exception as e:
        logger.error(f"Error en /verify/user: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'verified': False, 'error': 'Error procesando verificación por usuario'}), 500


@app.route('/user/exists', methods=['GET'])
def user_exists():
    """Consulta ligera para saber si hay un embedding registrado para `user_id`.

    Query params: ?user_id=...
    Response: { exists: true|false }
    """
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': 'Se requiere user_id'}), 400

        stored = None
        if embedding_cache.persistent_store and hasattr(embedding_cache.persistent_store, 'get_user'):
            try:
                stored = embedding_cache.persistent_store.get_user(user_id)
            except Exception as e:
                logger.warning(f"Error consultando embedding de usuario en exists: {str(e)}")

        return jsonify({'success': True, 'exists': bool(stored)}), 200
    except Exception as e:
        logger.error(f"Error en /user/exists: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'error': 'Error procesando consulta de existencia de usuario'}), 500


@app.route('/user/<user_id>', methods=['DELETE'])
def user_delete(user_id):
    """Elimina el embedding asociado al user_id (si existe) en el store persistente (Redis)."""
    try:
        # Auth guard for deletions
        if not require_write_auth():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        if not user_id:
            return jsonify({'success': False, 'error': 'Se requiere user_id'}), 400

        removed = False
        if embedding_cache.persistent_store and hasattr(embedding_cache.persistent_store, 'delete_user'):
            try:
                removed = embedding_cache.persistent_store.delete_user(user_id)
            except Exception as e:
                logger.warning(f"Error eliminando embedding de usuario: {str(e)}")

        return jsonify({'success': True, 'removed': bool(removed)}), 200
    except Exception as e:
        logger.error(f"Error en /user/<user_id> DELETE: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'error': 'Error eliminando registro de usuario'}), 500

@app.route('/cache/clear', methods=['POST'])
def clear_cache():
    """Endpoint para limpiar caché (útil para mantenimiento)"""
    try:
        # Auth guard for cache clearing
        if not require_write_auth():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        if not embedding_cache.enabled:
            return jsonify({
                'success': True,
                'message': 'Caché en memoria deshabilitada; no hay caché local para limpiar'
            }), 200

        with embedding_cache.lock:
            cache_size = len(embedding_cache.cache)
            embedding_cache.cache.clear()

        logger.info(f"Caché limpiado ({cache_size} items eliminados)")
        return jsonify({
            'success': True,
            'message': f'Caché limpiado ({cache_size} items eliminados)'
        }), 200
    except Exception as e:
        logger.error(f"Error limpiando caché: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error limpiando caché'
        }), 500


@app.route('/register/delete', methods=['POST'])
def delete_registration():
    """Elimina un registro facial persistente dado el `image` (Base64) o `hash`.

    Request JSON:
    - image: Base64 string (preferido)
    - hash: SHA256 hex string (opcional, si no se provee `image`)
    """
    try:
        # Auth guard for deletions
        if not require_write_auth():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401
        data = request.get_json() or {}
        image_base64 = data.get('image')
        hash_key = data.get('hash')

        if not image_base64 and not hash_key:
            return jsonify({'success': False, 'error': 'Se requiere `image` o `hash` para eliminar.'}), 400

        if image_base64:
            hash_key = embedding_cache._hash_image(image_base64)

        # Remove from in-memory cache if enabled
        try:
            with embedding_cache.lock:
                if hash_key in embedding_cache.cache:
                    del embedding_cache.cache[hash_key]
        except Exception:
            pass

        # Remove from persistent store (Redis) if configured
        removed = False
        if embedding_cache.persistent_store and hasattr(embedding_cache.persistent_store, 'delete'):
            removed = embedding_cache.persistent_store.delete(hash_key)

        return jsonify({'success': True, 'removed': removed, 'hash': hash_key}), 200
    except Exception as e:
        logger.error(f"Error en /register/delete: {str(e)}\n{traceback.format_exc()}")
        return jsonify({'success': False, 'error': 'Error eliminando registro facial'}), 500

if __name__ == '__main__':
    logger.info("🚀 Iniciando Facial Recognition Service v2.0 (Escalable)")
    logger.info(f"Caché: {embedding_cache.max_size} items, TTL: {embedding_cache.ttl_seconds}s")
    logger.info(f"Workers de procesamiento: {processing_queue.max_workers}")
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)