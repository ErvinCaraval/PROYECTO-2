#!/bin/bash

# Script rápido: Compila localmente y copia al Docker sin reconstruir imagen

echo "🏗️  Compilando frontend localmente..."
cd frontend-v2 || exit
npm install --silent
npm run build

echo ""
echo "📋 Esperando a que el contenedor esté listo..."
sleep 2

# Nombre del contenedor según docker-compose
CONTAINER_NAME="frontend-prod"
DEST_PATH="/usr/share/nginx/html/"

echo "📦 Copiando dist al contenedor: $CONTAINER_NAME -> $DEST_PATH"
docker cp dist/. "$CONTAINER_NAME":"$DEST_PATH"

echo ""
echo "♻️  Reiniciando contenedor para aplicar cambios..."
docker restart "$CONTAINER_NAME"

echo ""
echo "✅ Frontend actualizado!"
echo ""
echo "🌐 Frontend disponible en: http://localhost:80"
