#!/bin/bash

# Script para limpiar, reconstruir y ejecutar docker compose

echo "🧹 Limpiando Docker..."
./cleanup-docker.sh

echo ""
echo "🔨 Reconstruyendo imágenes..."
docker compose build --no-cache

echo ""
echo "🚀 Iniciando servicios..."
docker compose up -d

echo ""
echo "✅ Servicios iniciados!"
echo ""
echo "📊 Estado de los servicios:"
docker compose ps
echo ""
echo "🌐 Frontend disponible en: http://localhost:80"
echo "🔌 Backend disponible en: http://localhost:5000"
echo "🎯 Facial Service disponible en: http://localhost:5001"
