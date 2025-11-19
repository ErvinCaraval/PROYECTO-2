#!/bin/bash

# Script para reconstruir el frontend y evitar problemas de compilación

echo "🧹 Limpiando Docker..."
./cleanup-docker.sh

echo ""
echo "🔨 Reconstruyendo imagen del frontend..."
cd frontend-v2

# Limpiar dependencias locales para asegurar instalación fresca
rm -rf node_modules package-lock.json

echo "📦 Reinstalando dependencias locales..."
npm install --legacy-peer-deps

echo "🏗️  Compilando localmente..."
npm run build

echo ""
echo "🐳 Reconstruyendo imagen Docker..."
cd ..
docker compose build --no-cache frontend

echo ""
echo "🚀 Iniciando el contenedor frontend..."
docker compose up -d frontend

echo ""
echo "✅ Frontend reconstruido correctamente!"
echo ""
echo "🌐 Frontend disponible en: http://localhost:80"
