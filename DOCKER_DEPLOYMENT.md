# BrainBlitz - Docker Deployment Guide

## 📋 Requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB de RAM mínimo
- Conexión a Internet

## 🚀 Iniciar la aplicación completa

```bash
# Clonar o navegar al repositorio
cd /home/ervin/Desktop/PROYECTO-2

# Construir y ejecutar todos los servicios
docker-compose up --build

# En background
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend-api
docker-compose logs -f facial-recognition-service
docker-compose logs -f frontend
```

## 🔧 Servicios individuales

### 1. **Redis** (Puerto 6379)
```bash
docker-compose up facial-service-redis
redis-cli PING  # Verificar conexión
```

### 2. **Microservicio Facial** (Puerto 5001)
```bash
docker-compose up facial-recognition-service
curl http://localhost:5001/health
```

### 3. **Backend API** (Puerto 5000)
```bash
docker-compose up backend-api
curl http://localhost:5000/health
```

### 4. **Frontend** (Puerto 80)
```bash
docker-compose up frontend
open http://localhost
```

## 📤 Subir imágenes a Docker Hub

### Backend
```bash
cd backend-v1
./push_backend_to_dockerhub.sh latest
# o con tag custom
./push_backend_to_dockerhub.sh v1.0.0
```

### Frontend
```bash
cd frontend-v2
./push_frontend_to_dockerhub.sh latest
# o con tag custom
./push_frontend_to_dockerhub.sh v1.0.0
```

## 🔐 Variables de entorno

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DEEPFACE_SERVICE_URL=http://facial-recognition-service:5001
REDIS_URL=redis://facial-service-redis:6379/0
GROQ_API_KEY=tu_api_key
ASSEMBLYAI_API_KEY=tu_api_key
AZURE_API_KEY=tu_api_key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Facial Service (.env)
```env
USE_REDIS=1
REDIS_URL=redis://facial-service-redis:6379/0
FLASK_ENV=production
```

## 🧹 Limpiar

```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Eliminar imágenes
docker-compose down --rmi all

# Limpiar todo (contenedores, redes, volúmenes)
docker system prune -a -f
```

## 📊 Monitoreo

```bash
# Ver estado de contenedores
docker-compose ps

# Ver uso de recursos
docker stats

# Ver logs en tiempo real
docker-compose logs -f

# Verificar health de servicios
docker-compose ps --no-trunc
```

## 🐛 Troubleshooting

### El backend no se conecta a Redis
```bash
docker-compose logs facial-service-redis
docker exec facial-service-redis redis-cli PING
```

### El frontend no carga
```bash
docker-compose logs frontend
curl -v http://localhost:80/
```

### Error de puertos en uso
```bash
# Cambiar puertos en docker-compose.yml
# Ejemplo: "8000:5000" para backend en puerto 8000

# O liberar puerto
lsof -i :5000
kill -9 <PID>
```

## 📱 URLs de acceso

- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Facial Service**: http://localhost:5001
- **Redis**: localhost:6379

## 🐳 Imágenes en Docker Hub

```bash
# Descargar y ejecutar
docker run -p 5000:5000 ervincaravaliibarra/backend-v1:latest
docker run -p 80:80 ervincaravaliibarra/frontend-v2:latest

# O usar docker-compose con imágenes del Hub
services:
  backend-api:
    image: ervincaravaliibarra/backend-v1:latest
  frontend:
    image: ervincaravaliibarra/frontend-v2:latest
```

## 📚 Documentación adicional

- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Alpine Linux](https://alpinelinux.org/)
- [Nginx Configuration](https://nginx.org/en/docs/)
