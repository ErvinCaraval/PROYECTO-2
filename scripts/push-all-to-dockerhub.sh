#!/bin/bash

# Script para construir y empujar todas las imágenes a Docker Hub
# Ejecuta en orden:
# 1. push_backend_to_dockerhub.sh (backend-v1)
# 2. push_facial_service_to_dockerhub.sh (facial-service)
# 3. push_redis_to_dockerhub.sh (facial-service)
# 4. push_frontend_to_dockerhub.sh (frontend-v2)
#
# REQUERIMIENTOS:
#   - Docker instalado y corriendo
#   - Estar autenticado en Docker Hub O tener credenciales en .env
#   - Variables de entorno: DOCKERHUB_USER, DOCKERHUB_PASS (opcional)

# NO usar set -e para que continúe aunque un script falle
# set -e

# Credenciales de Docker Hub
export DOCKERHUB_USER="ervincaravaliibarra"
export DOCKERHUB_PASS="94092232381"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "📦 Iniciando proceso de construcción y push de imágenes a Docker Hub..."
echo "📍 Directorio base: $SCRIPT_DIR"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arrays separados para nombres y rutas
SERVICES=("backend" "facial-service" "facial-redis" "frontend")
SCRIPT_PATHS=(
    "$SCRIPT_DIR/backend-v1/push_backend_to_dockerhub.sh"
    "$SCRIPT_DIR/facial-service/push_facial_service_to_dockerhub.sh"
    "$SCRIPT_DIR/facial-service/push_redis_to_dockerhub.sh"
    "$SCRIPT_DIR/frontend-v2/push_frontend_to_dockerhub.sh"
)

# Contador de éxitos y fallos
TOTAL=${#SERVICES[@]}
SUCCESS=0
FAILED=0
FAILED_SCRIPTS=()

# Ejecutar cada script
for i in "${!SERVICES[@]}"; do
    SERVICE="${SERVICES[$i]}"
    SCRIPT_PATH="${SCRIPT_PATHS[$i]}"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}▶ Procesando: $SERVICE${NC}"
    echo -e "${BLUE}📄 Script: $SCRIPT_PATH${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [ -f "$SCRIPT_PATH" ]; then
        # Obtener el directorio del script
        SCRIPT_DIR=$(dirname "$SCRIPT_PATH")
        # Ejecutar el script desde su directorio (no parar si falla)
        if (cd "$SCRIPT_DIR" && bash "$(basename "$SCRIPT_PATH")" 2>&1); then
            echo ""
            echo -e "${GREEN}✅ $SERVICE - Completado exitosamente${NC}"
            ((SUCCESS++))
        else
            EXIT_CODE=$?
            echo ""
            echo -e "${RED}❌ $SERVICE - Falló (código: $EXIT_CODE)${NC}"
            ((FAILED++))
            FAILED_SCRIPTS+=("$SERVICE")
        fi
    else
        echo -e "${RED}❌ Script no encontrado: $SCRIPT_PATH${NC}"
        ((FAILED++))
        FAILED_SCRIPTS+=("$SERVICE (archivo no encontrado)")
    fi
    echo ""
done

# Resumen final
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 RESUMEN FINAL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "Total de servicios: $TOTAL"
echo -e "${GREEN}✅ Exitosos: $SUCCESS${NC}"
echo -e "${RED}❌ Fallidos: $FAILED${NC}"

if [ $FAILED -gt 0 ]; then
    echo ""
    echo "Servicios que fallaron:"
    for failed in "${FAILED_SCRIPTS[@]}"; do
        echo -e "${RED}  • $failed${NC}"
    done
    echo ""
    exit 1
else
    echo ""
    echo -e "${GREEN}🎉 ¡Todos los servicios fueron empujados exitosamente a Docker Hub!${NC}"
    echo ""
    exit 0
fi
