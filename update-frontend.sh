#!/bin/bash

# Script rápido: Compila localmente y copia al Docker sin reconstruir imagen

echo "🏗️  Compilando frontend localmente..."
cd frontend-v2
npm run build

echo ""
echo "📋 Esperando a que el contenedor esté listo..."
sleep 2

echo "📦 Copiando dist al contenedor..."
docker cp dist/. frontend:/usr/share/nginx/html/

echo ""
echo "✅ Frontend actualizado!"
echo ""
echo "🌐 Frontend disponible en: http://localhost:80"
