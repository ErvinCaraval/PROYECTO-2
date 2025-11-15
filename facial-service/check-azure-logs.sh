#!/bin/bash

# Script para verificar logs y estado del Container en Azure

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Verificando Estado del Container en Azure ===${NC}\n"

# Verificar Azure CLI
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI no está instalado${NC}"
    exit 1
fi

# Obtener Resource Group
RESOURCE_GROUP=${1:-""}
CONTAINER_NAME="facial-service-ervin"

if [ -z "$RESOURCE_GROUP" ]; then
    echo -e "${YELLOW}Por favor, proporciona el nombre del Resource Group:${NC}"
    read -p "Resource Group: " RESOURCE_GROUP
fi

echo -e "${GREEN}Resource Group: ${RESOURCE_GROUP}${NC}"
echo -e "${GREEN}Container Name: ${CONTAINER_NAME}\n${NC}"

# Verificar estado
echo -e "${GREEN}[1/4] Estado del Container:${NC}"
az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query "{state:containers[0].instanceView.currentState.state,restartCount:containers[0].instanceView.restartCount,startTime:containers[0].instanceView.currentState.startTime}" \
  --output table

# Ver recursos
echo -e "\n${GREEN}[2/4] Recursos Asignados:${NC}"
az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query "{cpu:containers[0].resources.requests.cpu,memory:containers[0].resources.requests.memoryInGb}" \
  --output table

# Ver eventos recientes
echo -e "\n${GREEN}[3/4] Eventos Recientes (últimos 20):${NC}"
az container show \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --query "containers[0].instanceView.events[-20:]" \
  --output table

# Ver logs
echo -e "\n${GREEN}[4/4] Logs del Container (últimas 50 líneas):${NC}"
echo -e "${YELLOW}========================================${NC}"
az container logs \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --tail 50

echo -e "\n${YELLOW}========================================${NC}"
echo -e "\n${GREEN}=== Análisis ===${NC}"
echo -e "Si ves 'Restart count' > 0, el container se está crasheando."
echo -e "Revisa los logs arriba para ver el error específico."

