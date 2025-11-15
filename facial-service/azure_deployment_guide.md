# Guía de Despliegue del Servicio Facial en Azure

Esta guía te ayudará a desplegar el servicio facial en Azure Container Instances y conectarlo con tu proyecto.

## Prerrequisitos

1. **Azure CLI instalado**
   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Autenticado en Azure**
   
   **Opción A: Usando el script de ayuda**
   ```bash
   cd facial-service
   ./azure_login.sh
   ```
   Este script te guiará en el proceso de autenticación.
   
   **Opción B: Manualmente**
   ```bash
   az login
   ```
   Se abrirá una ventana del navegador donde debes ingresar:
   - Email: `ervin.caravali@correounivalle.edu.co`
   - Contraseña: (tu contraseña de Azure)

3. **Imagen subida a Docker Hub**
   - Ya tienes la imagen `ervincaravaliibarra/facial-service:latest` en Docker Hub
   - Si no, ejecuta: `./push_to_dockerhub.sh`

## Paso 1: Desplegar en Azure

Ejecuta el script de despliegue:

```bash
cd facial-service
./deploy_to_azure.sh
```

Este script:
- Crea un grupo de recursos en Azure (si no existe)
- Despliega el contenedor en Azure Container Instances
- Configura el DNS público
- Te muestra las URLs disponibles

**Nota:** El despliegue puede tardar 2-5 minutos.

## Paso 2: Obtener la URL del servicio

Después del despliegue, el script te mostrará la URL. También puedes obtenerla manualmente:

```bash
az container show \
  --resource-group facial-service-rg \
  --name facial-service-ervin \
  --query ipAddress.fqdn -o tsv
```

La URL será algo como:
```
http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001
```

## Paso 3: Actualizar la configuración del backend

### Opción A: Usando el script automático

```bash
cd facial-service
./update_backend_config.sh http://TU_URL_AQUI:5001
```

### Opción B: Manualmente

1. Edita el archivo `backend-v1/.env` (o créalo si no existe)
2. Agrega o actualiza:
   ```env
   DEEPFACE_SERVICE_URL=http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001
   ```

## Paso 4: Verificar la conexión

### Probar desde el backend

```bash
cd backend-v1
node scripts/test-azure-facial-service.js
```

O usa el script de diagnóstico:

```bash
cd backend-v1
node scripts/diagnose-facial-service.js
```

### Probar manualmente

```bash
curl http://TU_URL:5001/health
```

Deberías recibir:
```json
{
  "status": "ok",
  "service": "facial-recognition",
  "version": "1.0.0"
}
```

## Paso 5: Reiniciar el backend

Para que los cambios surtan efecto, reinicia tu backend:

```bash
# Si usas PM2
pm2 restart backend

# Si usas npm
npm restart

# O simplemente detén y vuelve a iniciar
```

## Comandos útiles de Azure

### Ver estado del contenedor
```bash
az container show \
  --resource-group facial-service-rg \
  --name facial-service-ervin \
  --query containers[0].instanceView.currentState
```

### Ver logs del contenedor
```bash
az container logs \
  --resource-group facial-service-rg \
  --name facial-service-ervin
```

### Detener el contenedor
```bash
az container stop \
  --resource-group facial-service-rg \
  --name facial-service-ervin
```

### Eliminar el contenedor
```bash
az container delete \
  --resource-group facial-service-rg \
  --name facial-service-ervin \
  --yes
```

### Eliminar todo el grupo de recursos
```bash
az group delete \
  --name facial-service-rg \
  --yes
```

## Solución de problemas

### El servicio no responde

1. **Verifica que el contenedor esté ejecutándose:**
   ```bash
   az container show --resource-group facial-service-rg --name facial-service-ervin
   ```

2. **Revisa los logs:**
   ```bash
   az container logs --resource-group facial-service-rg --name facial-service-ervin
   ```

3. **Verifica el puerto:**
   - El servicio debe estar escuchando en el puerto 5001
   - Azure debe tener el puerto 5001 expuesto

### Error de conexión desde el backend

1. **Verifica la variable de entorno:**
   ```bash
   cd backend-v1
   cat .env | grep DEEPFACE_SERVICE_URL
   ```

2. **Prueba la URL manualmente:**
   ```bash
   curl http://TU_URL:5001/health
   ```

3. **Verifica que el backend esté usando la variable:**
   - El servicio `deepface.service.js` usa `process.env.DEEPFACE_SERVICE_URL`
   - Si no está definida, usa `http://localhost:5001` por defecto

### El contenedor se reinicia constantemente

1. **Revisa los logs para ver el error:**
   ```bash
   az container logs --resource-group facial-service-rg --name facial-service-ervin
   ```

2. **Verifica los recursos asignados:**
   - CPU: mínimo 2 cores
   - Memoria: mínimo 4 GB (DeepFace requiere bastante memoria)

## Costos

Azure Container Instances se cobra por:
- **Tiempo de ejecución:** Solo pagas cuando el contenedor está corriendo
- **CPU y memoria:** Según los recursos asignados (2 CPU, 4 GB RAM)

Para estimar costos, visita: https://azure.microsoft.com/pricing/details/container-instances/

## Actualizar la imagen

Si actualizas la imagen en Docker Hub:

1. **Sube la nueva versión:**
   ```bash
   ./push_to_dockerhub.sh
   ```

2. **Reinicia el contenedor en Azure:**
   ```bash
   az container restart \
     --resource-group facial-service-rg \
     --name facial-service-ervin
   ```

   O elimina y vuelve a crear:
   ```bash
   ./deploy_to_azure.sh
   ```

