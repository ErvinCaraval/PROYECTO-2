#!/bin/bash

# 🐳 Script de Verificación de Conectividad - BrainBlitz Docker Compose
# Este script verifica que todos los servicios estén conectando correctamente

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  🐳 Verificación de Conectividad - BrainBlitz${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

# Función para probar un endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" == "$expected_code" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        echo "  Response: $(echo "$body" | jq -c . 2>/dev/null || echo "$body" | head -c 100)"
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $http_code, expected $expected_code)"
        echo "  Response: $body"
        return 1
    fi
}

echo -e "${YELLOW}1. Verificando conectividad local:${NC}\n"

# Probar endpoints locales
test_endpoint "Frontend" "http://localhost/" "" && echo ""
test_endpoint "Backend Health" "http://localhost:5000/api/health" "200" && echo ""
test_endpoint "Facial Service Health" "http://localhost:5001/health" "200" && echo ""
test_endpoint "Topics API" "http://localhost:5000/api/ai/topics" "200" && echo ""
test_endpoint "Difficulty Levels API" "http://localhost:5000/api/ai/difficulty-levels" "200" && echo ""
test_endpoint "Games API" "http://localhost:5000/api/games" "200" && echo ""

echo -e "${YELLOW}2. Verificando conectividad desde contenedores:${NC}\n"

# Verificar que los contenedores estén corriendo
echo -n "Containers running... "
if docker ps | grep -q "backend-api"; then
    echo -e "${GREEN}✓${NC}\n"
else
    echo -e "${RED}✗${NC}\n"
    exit 1
fi

# Probar conectividad del frontend al backend (desde dentro de Docker)
echo -n "Frontend can reach Backend... "
docker exec frontend wget -q -O- http://backend-api:5000/api/health > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"

# Probar conectividad del backend al facial service (desde dentro de Docker)
echo -n "Backend can reach Facial Service... "
docker exec backend-api node -e "require('http').get('http://facial-recognition-service:5001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"

# Probar conectividad del backend a Redis (desde dentro de Docker)
echo -n "Backend can reach Redis... "
docker exec backend-api node -e "const redis = require('redis'); const client = redis.createClient({url: 'redis://facial-service-redis:6379/0'}); client.connect().then(() => { client.quit(); process.exit(0); }).catch(() => process.exit(1))" > /dev/null 2>&1 && echo -e "${GREEN}✓${NC}" || echo -e "${RED}✗${NC}"

echo -e "\n${YELLOW}3. Verificando variables de entorno:${NC}\n"

# Ver variables de entorno del backend
echo "Backend environment:"
docker exec backend-api sh -c 'echo "  DEEPFACE_SERVICE_URL=$DEEPFACE_SERVICE_URL"'
docker exec backend-api sh -c 'echo "  REDIS_URL=$REDIS_URL"'

echo ""
echo "Frontend environment (from Nginx):"
echo "  VITE_API_URL=http://backend-api:5000"
echo "  VITE_SOCKET_URL=http://backend-api:5000"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Verificación completada${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"

echo "Accede a la aplicación en: ${GREEN}http://localhost${NC}"
echo "API Docs disponibles en: ${GREEN}http://localhost:5000/api-docs${NC}"
