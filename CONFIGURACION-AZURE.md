# Configuración del Servicio Facial en Azure

## Información del Servicio Desplegado

- **FQDN**: `facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io`
- **IP Pública**: `4.203.90.128`
- **Región**: Brazil South

## Configuración del Backend

El servicio facial se configura mediante la variable de entorno `DEEPFACE_SERVICE_URL`.

**⚠️ IMPORTANTE**: Debes definir esta variable de entorno en tu archivo `.env` o en las variables de entorno de tu servidor.

✅ **Verificado**: El servicio está funcionando correctamente en el puerto 5001.

### Configuración Requerida

**DEBES** agregar la variable de entorno `DEEPFACE_SERVICE_URL` en tu archivo `.env`:

#### Opción 1: Usar FQDN con puerto 5001 (Recomendado para producción)
```bash
# En backend-v1/.env
DEEPFACE_SERVICE_URL=http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001
```

#### Opción 2: Usar IP Directa con puerto 5001
```bash
# En backend-v1/.env
DEEPFACE_SERVICE_URL=http://4.203.90.128:5001
```

#### Opción 3: Usar Local (Desarrollo)
```bash
# En backend-v1/.env
DEEPFACE_SERVICE_URL=http://localhost:5001
```

**Nota**: Si no defines `DEEPFACE_SERVICE_URL`, el sistema usará `http://localhost:5001` por defecto (solo para desarrollo local).

## Probar la Conexión

Ejecuta el script de prueba para verificar qué URL funciona:

```bash
cd backend-v1
node scripts/test-azure-facial-service.js
```

Este script probará todas las combinaciones posibles y te dirá cuál funciona.

## Verificar el Servicio en Azure

### Desde la línea de comandos:
```bash
# Probar health endpoint (puerto 5001)
curl http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001/health

# O con IP
curl http://4.203.90.128:5001/health
```

## Verificar Configuración en Azure

Asegúrate de que en Azure Container Instances:

1. **Puerto del contenedor**: Debe estar mapeado correctamente (probablemente 5001)
2. **Puerto público**: Azure normalmente mapea al puerto 80 del FQDN
3. **Firewall**: Debe permitir conexiones entrantes en el puerto configurado
4. **CORS**: El servicio debe tener CORS habilitado (ya está en `api.py`)

## Configuración del Código

El archivo `backend-v1/services/deepface.service.js` está configurado para usar **únicamente** la variable de entorno `DEEPFACE_SERVICE_URL`.

**No hay URLs hardcodeadas** en el código. Para cambiar la URL del servicio:

1. **Agregar variable de entorno** (recomendado): Definir `DEEPFACE_SERVICE_URL` en `.env`
2. **Variable de entorno del sistema**: Exportar `DEEPFACE_SERVICE_URL` en tu servidor

Si no defines la variable, el sistema usará `http://localhost:5001` por defecto (solo para desarrollo local).

## Notas Importantes

- Azure Container Instances normalmente expone el puerto del contenedor en el puerto 80 del FQDN
- Si tu contenedor escucha en el puerto 5001, Azure debería mapearlo automáticamente
- El FQDN es más estable que la IP (la IP puede cambiar si reinicias el contenedor)
- Asegúrate de que el servicio en Azure esté ejecutándose antes de probar

