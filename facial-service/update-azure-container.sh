#!/bin/bash

# Script para actualizar el Container Instance en Azure
# Uso: ./update-azure-container.sh [resource-group] [container-name]

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Colores
echo -e "${GREEN}=== Actualizar Container Instance en Azure ===${NC}\n"

# Verificar que Azure CLI está instalado
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI no está instalado${NC}"
    echo -e "${YELLOW}Instala Azure CLI con:${NC}"
    echo "  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

# Verificar que está logueado
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}No estás logueado en Azure. Iniciando sesión...${NC}"
    az login
fi

# Obtener parámetros
RESOURCE_GROUP=${1:-""}
CONTAINER_NAME=${2:-"facial-service-ervin"}
IMAGE_NAME="ervincaravaliibarra/facial-service:latest"

if [ -z "$RESOURCE_GROUP" ]; then
    echo -e "${YELLOW}Por favor, proporciona el nombre del Resource Group:${NC}"
    read -p "Resource Group: " RESOURCE_GROUP
fi

echo -e "${GREEN}Configuración:${NC}"
echo -e "  Resource Group: ${RESOURCE_GROUP}"
echo -e "  Container Name: ${CONTAINER_NAME}"
echo -e "  Image: ${IMAGE_NAME}"
echo ""

# Verificar que el Container existe
if ! az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" &> /dev/null; then
    echo -e "${RED}Error: Container Instance '${CONTAINER_NAME}' no encontrado en Resource Group '${RESOURCE_GROUP}'${NC}"
    exit 1
fi

# Obtener información del Container actual
echo -e "${GREEN}[1/4] Obteniendo información del Container actual...${NC}"
CURRENT_IMAGE=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query "containers[0].image" -o tsv)
echo -e "  Imagen actual: ${CURRENT_IMAGE}"

if [ "$CURRENT_IMAGE" == "$IMAGE_NAME" ]; then
    echo -e "${YELLOW}⚠️  La imagen ya está actualizada.${NC}"
    read -p "¿Deseas continuar de todos modos? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ] && [ "$CONTINUE" != "Y" ]; then
        exit 0
    fi
fi

# Detener el Container
echo -e "\n${GREEN}[2/4] Deteniendo el Container Instance...${NC}"
az container stop --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME"
echo -e "${GREEN}✓ Container detenido${NC}"

# Esperar un momento
sleep 3

# Obtener configuración actual
echo -e "\n${GREEN}[3/4] Obteniendo configuración actual...${NC}"
DNS_LABEL=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query "ipAddress.fqdn" -o tsv | cut -d'.' -f1)
CPU=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query "containers[0].resources.requests.cpu" -o tsv)
MEMORY=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query "containers[0].resources.requests.memoryInGb" -o tsv)
LOCATION=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query "location" -o tsv)

echo -e "  DNS Label: ${DNS_LABEL}"
echo -e "  CPU: ${CPU}"
echo -e "  Memory: ${MEMORY}GB"
echo -e "  Location: ${LOCATION}"

# Eliminar y recrear (más confiable que actualizar)
echo -e "\n${GREEN}[4/4] Eliminando y recreando el Container con la nueva imagen...${NC}"
echo -e "${YELLOW}Esto puede tardar 2-5 minutos...${NC}"

az container delete \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --yes

# Esperar a que se elimine completamente
sleep 5

# Recrear con la nueva imagen
az container create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$CONTAINER_NAME" \
  --image "$IMAGE_NAME" \
  --dns-name-label "$DNS_LABEL" \
  --ports 5001 \
  --cpu "$CPU" \
  --memory "$MEMORY" \
  --location "$LOCATION" \
  --restart-policy Always \
  --registry-login-server docker.io

echo -e "\n${GREEN}✓ Container recreado exitosamente${NC}"

# Obtener nueva información
echo -e "\n${GREEN}Información del nuevo Container:${NC}"
NEW_FQDN=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query "ipAddress.fqdn" -o tsv)
NEW_IP=$(az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" --query "ipAddress.ip" -o tsv)

echo -e "  FQDN: ${NEW_FQDN}"
echo -e "  IP: ${NEW_IP}"
echo -e "  URL completa: http://${NEW_FQDN}:5001"

# Esperar a que el servicio esté listo
echo -e "\n${YELLOW}Esperando a que el servicio esté listo...${NC}"
sleep 10

# Probar el health endpoint
echo -e "\n${GREEN}Probando el servicio...${NC}"
if curl -f -s "http://${NEW_FQDN}:5001/health" > /dev/null; then
    echo -e "${GREEN}✅ Servicio funcionando correctamente${NC}"
else
    echo -e "${YELLOW}⚠️  El servicio aún no está listo. Espera unos minutos más.${NC}"
    echo -e "  Prueba manualmente: curl http://${NEW_FQDN}:5001/health"
fi

echo -e "\n${GREEN}=== ¡Actualización completada! ===${NC}"
echo -e "\n${YELLOW}Recuerda actualizar DEEPFACE_SERVICE_URL en tu backend si el FQDN cambió:${NC}"
echo -e "  DEEPFACE_SERVICE_URL=http://${NEW_FQDN}:5001"

