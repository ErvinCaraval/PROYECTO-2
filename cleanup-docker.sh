#!/bin/bash

# Script para limpiar todas las imágenes, contenedores y volúmenes de Docker
# Generados por docker-compose.

echo "🧹 Limpiando Docker..."
echo ""

# Detener todos los contenedores en ejecución
echo "⏹️  Deteniendo contenedores..."
docker compose down -v 2>/dev/null || true

# Esperar un momento
sleep 2

# Detener cualquier contenedor restante
echo "🛑 Deteniendo todos los contenedores..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Eliminar todos los contenedores
echo "🗑️  Eliminando contenedores..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Eliminar volúmenes
echo "💾 Eliminando volúmenes..."
docker volume prune -f 2>/dev/null || true

# Eliminar imágenes generadas por docker-compose
echo "🖼️  Eliminando imágenes..."
docker rmi -f \
  ervincaravaliibarra/backend-v1 \
  ervincaravaliibarra/frontend-v2 \
  ervincaravaliibarra/facial-service \
  ervincaravaliibarra/facial-service-redis \
  proyecto-2-backend-api \
  proyecto-2-frontend \
  proyecto-2-facial-recognition-service \
  proyecto-2-redis \
  2>/dev/null || true

# Eliminar imágenes no etiquetadas
echo "🧹 Eliminando imágenes no etiquetadas..."
docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true

# Eliminar redes no utilizadas
echo "🌐 Eliminando redes..."
docker network prune -f 2>/dev/null || true

# Limpiar caché de compilación
echo "⚙️  Limpiando caché de compilación..."
docker builder prune -af 2>/dev/null || true

echo ""
echo "✅ Limpieza completada!"
echo ""
echo "Estado actual de Docker:"
docker system df