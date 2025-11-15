# Microservicio de Reconocimiento Facial

## Inicio Rápido

```bash
# Iniciar el servicio
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener el servicio
docker-compose down

# Verificar salud
curl http://localhost:5001/health
```

## Endpoints

### POST /register
Registra una cara y genera embeddings.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cara registrada exitosamente",
  "user_id": "user123",
  "embedding": [...],
  "face_detected": true
}
```

### POST /verify
Verifica si dos imágenes corresponden a la misma persona.

**Request:**
```json
{
  "img1": "data:image/jpeg;base64,...",
  "img2": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "distance": 0.15,
  "threshold": 0.4,
  "confidence": 0.625
}
```

### GET /health
Verifica el estado del servicio.

**Response:**
```json
{
  "status": "ok",
  "service": "facial-recognition",
  "version": "1.0.0"
}
```

## Requisitos

- Docker
- Docker Compose
- Puerto 5001 disponible

