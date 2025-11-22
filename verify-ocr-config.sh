#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== OCR Service Configuration Verification ===${NC}\n"

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if containers are running
echo -e "\n${YELLOW}Checking container status...${NC}"

BACKEND_STATUS=$(docker compose -f docker/docker-compose.yml ps backend-api --format "{{.State}}" 2>/dev/null)
FRONTEND_STATUS=$(docker compose -f docker/docker-compose.yml ps frontend --format "{{.State}}" 2>/dev/null)
FACIAL_STATUS=$(docker compose -f docker/docker-compose.yml ps facial-recognition-service --format "{{.State}}" 2>/dev/null)
REDIS_STATUS=$(docker compose -f docker/docker-compose.yml ps facial-service-redis --format "{{.State}}" 2>/dev/null)

if [ "$BACKEND_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ Backend API is running${NC}"
else
    echo -e "${RED}❌ Backend API is not running (Status: $BACKEND_STATUS)${NC}"
fi

if [ "$FRONTEND_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not running (Status: $FRONTEND_STATUS)${NC}"
fi

if [ "$FACIAL_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ Facial Recognition Service is running${NC}"
else
    echo -e "${RED}❌ Facial Recognition Service is not running (Status: $FACIAL_STATUS)${NC}"
fi

if [ "$REDIS_STATUS" = "running" ]; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not running (Status: $REDIS_STATUS)${NC}"
fi

# Check OCR environment variables
echo -e "\n${YELLOW}Checking OCR configuration in docker/.env...${NC}"

if [ -f "docker/.env" ]; then
    echo -e "${GREEN}✅ docker/.env file exists${NC}"
    
    if grep -q "AZURE_CV_API_KEY" docker/.env; then
        echo -e "${GREEN}✅ AZURE_CV_API_KEY is configured${NC}"
    else
        echo -e "${RED}❌ AZURE_CV_API_KEY is missing${NC}"
    fi
    
    if grep -q "AZURE_CV_ENDPOINT" docker/.env; then
        echo -e "${GREEN}✅ AZURE_CV_ENDPOINT is configured${NC}"
    else
        echo -e "${RED}❌ AZURE_CV_ENDPOINT is missing${NC}"
    fi
else
    echo -e "${RED}❌ docker/.env file not found${NC}"
fi

# Check OCR service health
echo -e "\n${YELLOW}Checking OCR service health endpoint...${NC}"

OCR_HEALTH=$(curl -s -w "%{http_code}" -o /tmp/ocr_health.json http://localhost:5000/api/ocr/health)

if [ "$OCR_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ OCR Health endpoint is responding (HTTP 200)${NC}"
    echo -e "${YELLOW}Response:${NC}"
    cat /tmp/ocr_health.json | jq . 2>/dev/null || cat /tmp/ocr_health.json
else
    echo -e "${RED}❌ OCR Health endpoint returned HTTP $OCR_HEALTH${NC}"
fi

# Check backend logs for OCR initialization
echo -e "\n${YELLOW}Checking backend logs for OCR initialization...${NC}"

LOGS=$(docker compose -f docker/docker-compose.yml logs backend-api 2>&1 | grep -i "ocr\|azure" | head -5)

if echo "$LOGS" | grep -q "initialized"; then
    echo -e "${GREEN}✅ OCR Service is initialized${NC}"
    echo -e "${YELLOW}Log details:${NC}"
    echo "$LOGS" | head -3
else
    echo -e "${YELLOW}⚠️  Could not find initialization message in logs${NC}"
fi

# Summary
echo -e "\n${YELLOW}=== Summary ===${NC}"

if [ "$BACKEND_STATUS" = "running" ] && [ "$OCR_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ OCR service is fully operational!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Open http://localhost in your browser"
    echo "2. Navigate to Dashboard → 🤖 Generador de Preguntas"
    echo "3. Click 📸 Capturar pregunta to test OCR"
else
    echo -e "${RED}❌ OCR service needs attention${NC}"
    echo -e "\n${YELLOW}Troubleshooting steps:${NC}"
    echo "1. Check docker/.env file exists with credentials"
    echo "2. Restart containers: docker compose down && docker compose up -d"
    echo "3. Wait 30 seconds and run this script again"
fi

rm -f /tmp/ocr_health.json
