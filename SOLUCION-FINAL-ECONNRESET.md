# Solución Final para ECONNRESET

## Problema Identificado

Azure Container Instances está cerrando la conexión (`ECONNRESET`) durante el procesamiento de DeepFace, que puede tardar 30-60 segundos. Esto ocurre porque:

1. **Azure Container Instances tiene límites de timeout** que no podemos controlar completamente
2. **DeepFace es computacionalmente intensivo** y tarda mucho en procesar
3. **Las conexiones HTTP se cierran** si no hay actividad durante cierto tiempo

## Soluciones Implementadas

### ✅ 1. Optimización Agresiva de Imágenes
- **Resolución reducida**: 300x300px (antes 400x400px)
- **Calidad reducida**: 0.6 (antes 0.7)
- **Resultado**: Imágenes ~70-80% más pequeñas = procesamiento más rápido

### ✅ 2. Sistema de Reintentos
- 4 intentos totales con backoff exponencial
- Timeout aumentado a 90 segundos

### ✅ 3. Timeout en Flask
- `request_timeout=120` segundos en el servicio

## Si el Problema Persiste

### Opción A: Aumentar Recursos en Azure (RECOMENDADO)

Azure Container Instances con más CPU/memoria procesa más rápido:

```bash
# Ver recursos actuales
az container show --resource-group <RG> --name facial-service-ervin --query "containers[0].resources"

# Actualizar a más recursos (ejemplo: 4 CPU, 8GB RAM)
az container create \
  --resource-group <RG> \
  --name facial-service-ervin \
  --image ervincaravaliibarra/facial-service:latest \
  --cpu 4 \
  --memory 8 \
  --dns-name-label facial-service-ervin \
  --ports 5001 \
  --restart-policy Always
```

**Nota**: Más recursos = más costo, pero procesamiento más rápido = menos timeouts

### Opción B: Migrar a Azure App Service

Azure App Service tiene mejor soporte para conexiones largas:

1. **Ventajas**:
   - Timeouts más largos por defecto
   - Mejor manejo de conexiones persistentes
   - Escalado automático
   - Logs más detallados

2. **Cómo migrar**:
   - Crear un App Service en Azure Portal
   - Configurar para usar Docker Hub
   - Desplegar la misma imagen

### Opción C: Procesamiento Asíncrono (Más Complejo)

Implementar un sistema donde:
1. Cliente envía imagen → recibe un `job_id`
2. Servicio procesa en background
3. Cliente consulta el resultado con el `job_id`

Esto requiere cambios significativos en el código.

### Opción D: Usar un Modelo Más Rápido

DeepFace tiene varios modelos. `VGG-Face` es preciso pero lento. Podrías probar:
- `Facenet` (más rápido)
- `OpenFace` (más rápido pero menos preciso)

Cambiar en `facial-service/api.py`:
```python
# En lugar de 'VGG-Face'
model_name='Facenet'  # o 'OpenFace'
```

## Verificación

Después de aplicar las optimizaciones:

1. **Verifica el tamaño de las imágenes**:
   - Abre la consola del navegador
   - Deberías ver: `Imagen optimizada: XKB → YKB (Z% reducción)`
   - El tamaño debería ser < 100KB

2. **Verifica los logs del backend**:
   - Deberías ver los reintentos
   - Si todos fallan, el problema es de Azure

3. **Prueba directamente con curl**:
   ```bash
   # Esto debería funcionar si el servicio está bien
   curl -X POST http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001/health
   ```

## Recomendación Final

**Si después de reducir las imágenes a 300x300 el problema persiste:**

1. **Aumenta los recursos del Container Instance** (más CPU/memoria)
2. O **migra a Azure App Service** para mejor soporte de conexiones largas

El problema fundamental es que **Azure Container Instances no está diseñado para procesamiento largo**, mientras que **Azure App Service sí**.

