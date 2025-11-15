# Cómo Actualizar el Container Instance en Azure

## Opción 1: Azure Portal (Recomendado - Más Fácil)

### Paso 1: Ir al Container Instance
1. Ve a [Azure Portal](https://portal.azure.com)
2. Busca "Container instances" en la barra de búsqueda
3. Selecciona tu Container Instance: `facial-service-ervin`

### Paso 2: Detener el Container
1. En la página del Container Instance, haz clic en **"Stop"** (Detener)
2. Espera a que el estado cambie a "Stopped"

### Paso 3: Actualizar la Imagen
1. En el menú izquierdo, ve a **"Containers"** o **"Settings"**
2. Busca la sección **"Image"** o **"Container image"**
3. Haz clic en **"Edit"** o **"Update"**
4. Cambia la imagen a: `ervincaravaliibarra/facial-service:latest`
5. Haz clic en **"Save"** o **"Apply"**

### Paso 4: Reiniciar el Container
1. Haz clic en **"Start"** (Iniciar)
2. Espera a que el estado cambie a "Running"

---

## Opción 2: Azure CLI (Línea de Comandos)

### Prerequisitos
```bash
# Instalar Azure CLI si no lo tienes
# En Ubuntu/Debian:
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# O en macOS:
brew install azure-cli

# Iniciar sesión
az login
```

### Pasos para Actualizar

```bash
# 1. Detener el Container Instance
az container stop \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin

# 2. Actualizar la imagen
az container create \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin \
  --image ervincaravaliibarra/facial-service:latest \
  --dns-name-label facial-service-ervin \
  --ports 5001 \
  --cpu 2 \
  --memory 4 \
  --restart-policy Always \
  --registry-login-server docker.io \
  --registry-username <TU_USUARIO_DOCKERHUB> \
  --registry-password <TU_PASSWORD_DOCKERHUB>

# 3. Iniciar el Container
az container start \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin
```

**Nota**: Reemplaza:
- `<TU_RESOURCE_GROUP>` con el nombre de tu Resource Group
- `<TU_USUARIO_DOCKERHUB>` con tu usuario de Docker Hub
- `<TU_PASSWORD_DOCKERHUB>` con tu contraseña de Docker Hub

---

## Opción 3: Eliminar y Recrear (Más Simple)

Si prefieres empezar de cero:

### Desde Azure Portal:
1. Ve a tu Container Instance
2. Haz clic en **"Delete"** (Eliminar)
3. Crea uno nuevo con la nueva imagen

### Desde Azure CLI:
```bash
# Eliminar el Container existente
az container delete \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin \
  --yes

# Crear uno nuevo con la imagen actualizada
az container create \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin \
  --image ervincaravaliibarra/facial-service:latest \
  --dns-name-label facial-service-ervin \
  --ports 5001 \
  --cpu 2 \
  --memory 4 \
  --restart-policy Always \
  --registry-login-server docker.io \
  --registry-username ervincaravaliibarra \
  --registry-password <TU_PASSWORD>
```

---

## Verificar que Funciona

Después de actualizar, verifica que el servicio está funcionando:

```bash
# Probar el health endpoint
curl http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001/health

# Deberías ver:
# {"service":"facial-recognition","status":"ok","version":"1.0.0"}
```

---

## Notas Importantes

1. **Tiempo de Actualización**: Puede tardar 2-5 minutos
2. **IP/FQDN**: La IP puede cambiar, pero el FQDN debería mantenerse
3. **Credenciales Docker Hub**: Si tu imagen es pública, no necesitas credenciales
4. **Recursos**: Asegúrate de tener suficientes recursos (CPU/Memoria) para DeepFace

---

## Troubleshooting

### Si el Container no inicia:
- Verifica los logs: `az container logs --resource-group <RG> --name facial-service-ervin`
- Verifica que la imagen existe en Docker Hub
- Verifica que tienes suficientes recursos asignados

### Si el FQDN cambia:
- Actualiza la variable `DEEPFACE_SERVICE_URL` en tu backend
- O usa la IP directamente (menos recomendado)

