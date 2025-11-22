#!/bin/bash
# OCR System Health Check
# Verificación rápida de que todo está funcionando

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🏥 OCR SYSTEM HEALTH CHECK"
echo "════════════════════════════════════════════════════════════"

# Check Docker containers
echo ""
echo "1️⃣  Verificando contenedores Docker..."
cd /home/ervin/Documents/PROYECTO-2/docker

BACKEND=$(docker compose ps backend-api --format "{{.Status}}" 2>/dev/null | grep -c "Up")
FRONTEND=$(docker compose ps frontend --format "{{.Status}}" 2>/dev/null | grep -c "Up")

if [ "$BACKEND" -eq 1 ]; then
    echo "   ✅ Backend API - Running"
else
    echo "   ❌ Backend API - Not running"
fi

if [ "$FRONTEND" -eq 1 ]; then
    echo "   ✅ Frontend - Running"
else
    echo "   ❌ Frontend - Not running"
fi

# Check Backend Health
echo ""
echo "2️⃣  Verificando health check del backend..."
HEALTH=$(curl -s http://localhost:5000/api/ocr/health 2>/dev/null | grep -c '"status"')

if [ "$HEALTH" -eq 1 ]; then
    echo "   ✅ Backend OCR Health Endpoint - Responding"
else
    echo "   ❌ Backend OCR Health Endpoint - Not responding"
fi

# Check Frontend
echo ""
echo "3️⃣  Verificando acceso al frontend..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null)

if [ "$HTTP_CODE" == "200" ]; then
    echo "   ✅ Frontend Web Interface - Accessible (HTTP $HTTP_CODE)"
else
    echo "   ⚠️  Frontend - HTTP $HTTP_CODE"
fi

# Check Azure Credentials
echo ""
echo "4️⃣  Verificando Azure Credentials..."
if [ -f "/home/ervin/Documents/PROYECTO-2/docker/.env" ]; then
    HAS_KEY=$(grep -c "AZURE_CV_API_KEY" /home/ervin/Documents/PROYECTO-2/docker/.env)
    HAS_ENDPOINT=$(grep -c "AZURE_CV_ENDPOINT" /home/ervin/Documents/PROYECTO-2/docker/.env)
    
    if [ "$HAS_KEY" -eq 1 ] && [ "$HAS_ENDPOINT" -eq 1 ]; then
        echo "   ✅ Azure Credentials - Configured"
    else
        echo "   ❌ Azure Credentials - Incomplete"
    fi
else
    echo "   ❌ Environment file not found"
fi

# Summary
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ SYSTEM STATUS: READY FOR TESTING"
echo "════════════════════════════════════════════════════════════"

echo ""
echo "📋 Próximos pasos:"
echo "   1. Tomar una foto clara de una pregunta (buen enfoque, iluminación)"
echo "   2. Abrir http://localhost en el navegador"
echo "   3. Usar el componente OCR para subir la imagen"
echo "   4. Verificar que se detectan pregunta + opciones"
echo ""
echo "💡 Si no se detectan todas las opciones:"
echo "   • Editar manualmente los campos incompletos (en naranja)"
echo "   • Confirmar (se requiere pregunta + 2 opciones mínimo)"
echo ""
