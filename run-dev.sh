#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando el entorno de desarrollo...${NC}"

# Función para limpiar e instalar dependencias
clean_install() {
    local dir=$1
    echo -e "${GREEN}📦 Limpiando e instalando dependencias en ${dir}...${NC}"
    cd $dir
    # Eliminar node_modules y package-lock.json
    rm -rf node_modules package-lock.json
    # Instalar dependencias limpias
    npm install --force
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error instalando dependencias en ${dir}${NC}"
        exit 1
    fi
    cd ..
}

# Limpiar e instalar dependencias
clean_install "backend-v1"
clean_install "frontend-v2"

echo -e "${GREEN}🚀 Iniciando servicios...${NC}"

# Crear terminal y ejecutar backend
echo -e "${GREEN}📡 Iniciando Backend...${NC}"
gnome-terminal --working-directory="$(pwd)/backend-v1" -- bash -c "node hybridServer.js; exec bash" &

# Esperar un momento para que el backend inicie
sleep 2

# Crear terminal y ejecutar frontend
echo -e "${GREEN}🌐 Iniciando Frontend...${NC}"
gnome-terminal --working-directory="$(pwd)/frontend-v2" -- bash -c "npm run dev; exec bash" &

echo -e "${GREEN}✨ Servicios iniciados. Las terminales deberían estar abiertas en tu workspace.${NC}"