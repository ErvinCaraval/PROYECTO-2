# Solución para Container Reiniciándose (Restart Count: 5)

## 🔴 Problema Identificado

Tu container en Azure tiene **Restart count: 5**, lo que significa que se ha reiniciado 5 veces. Esto explica los errores `ECONNRESET` - el container se está crasheando durante el procesamiento.

## 🔍 Diagnóstico

### Ver Logs del Container

Ejecuta este comando para ver qué está causando los crashes:

```bash
cd facial-service
./check-azure-logs.sh [TU_RESOURCE_GROUP]
```

O manualmente:

```bash
# Ver logs completos
az container logs \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin \
  --tail 100

# Ver eventos (muestra por qué se reinició)
az container show \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin \
  --query "containers[0].instanceView.events" \
  --output table
```

## 🛠️ Causas Comunes y Soluciones

### Causa 1: Memoria Insuficiente (MÁS PROBABLE)

DeepFace requiere mucha memoria. Si el container se queda sin memoria, Azure lo mata.

**Solución**: Aumentar memoria a mínimo 8GB (recomendado 16GB)

```bash
az container delete --resource-group <TU_RG> --name facial-service-ervin --yes

az container create \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --image ervincaravaliibarra/facial-service:latest \
  --dns-name-label facial-service-ervin \
  --ports 5001 \
  --cpu 4 \
  --memory 16 \
  --restart-policy Always
```

### Causa 2: Error en el Código

El container puede estar crasheando por un error en Python.

**Solución**: Verificar logs para ver el error específico

```bash
az container logs \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --tail 100
```

Busca errores como:
- `MemoryError`
- `Killed` (OOM - Out of Memory)
- `ModuleNotFoundError`
- `ImportError`

### Causa 3: Health Check Falla

Si el health check falla repetidamente, Azure reinicia el container.

**Solución**: Verificar que el health endpoint funcione

```bash
curl http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001/health
```

### Causa 4: Timeout en el Procesamiento

Si DeepFace tarda demasiado, Azure puede matar el proceso.

**Solución**: Ya implementado (timeout aumentado), pero verifica que el servicio tenga los cambios.

## ✅ Pasos Inmediatos

### 1. Ver Logs
```bash
az container logs \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --tail 100
```

### 2. Verificar Recursos Actuales
```bash
az container show \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --query "{cpu:containers[0].resources.requests.cpu,memory:containers[0].resources.requests.memoryInGb}"
```

### 3. Aumentar Recursos (Recomendado)

**Mínimo recomendado para DeepFace**:
- CPU: 4 cores
- Memory: 16GB

```bash
# Eliminar container actual
az container delete \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --yes

# Crear con más recursos
az container create \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --image ervincaravaliibarra/facial-service:latest \
  --dns-name-label facial-service-ervin \
  --ports 5001 \
  --cpu 4 \
  --memory 16 \
  --restart-policy Always \
  --registry-login-server docker.io
```

### 4. Verificar que la Imagen Tiene los Cambios

Asegúrate de que la imagen en Docker Hub tenga los cambios del `api.py`:

```bash
cd facial-service
# Reconstruir
docker build -t ervincaravaliibarra/facial-service:latest .

# Subir
docker push ervincaravaliibarra/facial-service:latest

# Actualizar en Azure (usar el script o manualmente)
```

## 📊 Monitoreo

Después de aumentar recursos, monitorea:

```bash
# Ver estado cada 30 segundos
watch -n 30 'az container show --resource-group <TU_RG> --name facial-service-ervin --query "containers[0].instanceView.restartCount" -o tsv'
```

Si el restart count sigue aumentando, hay un problema más profundo que necesita investigación.

## 🎯 Recomendación

**Acción inmediata**:
1. Ver logs para identificar el error específico
2. Aumentar memoria a 16GB (muy probable que sea el problema)
3. Verificar que la imagen tenga los cambios del `api.py`
4. Monitorear el restart count después de los cambios

Si después de aumentar a 16GB el problema persiste, considera migrar a **Azure App Service** que tiene mejor manejo de recursos y no mata procesos tan agresivamente.

