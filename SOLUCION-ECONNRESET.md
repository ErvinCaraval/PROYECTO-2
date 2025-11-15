# Solución para Error ECONNRESET

## Problema
El error `ECONNRESET` ocurre cuando Azure Container Instances cierra la conexión antes de que DeepFace termine de procesar las imágenes.

## Soluciones Implementadas

### 1. ✅ Optimización de Imágenes (Frontend)
- Las imágenes se reducen automáticamente a 400x400px
- Calidad reducida a 0.7 (suficiente para reconocimiento facial)
- Reducción típica de 60-80% en tamaño

### 2. ✅ Sistema de Reintentos (Backend)
- 4 intentos totales (3 reintentos)
- Backoff exponencial: 2s, 4s, 6s entre intentos
- Solo reintenta errores recuperables (ECONNRESET, ETIMEDOUT)

### 3. ✅ Timeout Aumentado
- Timeout aumentado a 90 segundos
- Keep-alive mejorado con socketTimeout

## Si el Problema Persiste

### Opción 1: Verificar Azure Container Instances
Azure Container Instances puede tener límites de timeout. Verifica:

1. **En Azure Portal**, ve a tu Container Instance
2. Verifica la configuración de **timeout** y **health probes**
3. Aumenta el timeout si es posible

### Opción 2: Usar Azure App Service en lugar de Container Instances
Azure App Service tiene mejor soporte para conexiones largas:
- Timeouts más largos por defecto
- Mejor manejo de conexiones persistentes
- Escalado automático

### Opción 3: Implementar Procesamiento Asíncrono
En lugar de esperar la respuesta inmediata:
1. Enviar la petición al servicio
2. El servicio procesa en background
3. El cliente consulta el resultado después

### Opción 4: Reducir Más el Tamaño de Imágenes
Si las imágenes siguen siendo muy grandes:
- Reducir resolución a 300x300px
- Reducir calidad a 0.6
- Ver `frontend-v2/src/utils/imageOptimizer.js`

## Verificación

Para verificar si el problema es de timeout:
```bash
# Probar directamente con curl (debería funcionar)
curl -X POST http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001/verify \
  -H "Content-Type: application/json" \
  -d '{"img1":"...","img2":"..."}' \
  --max-time 120
```

## Logs para Debugging

Revisa los logs del backend para ver:
- Cuántos reintentos se hicieron
- Cuánto tiempo tardó cada intento
- El tamaño de las imágenes enviadas

Los logs mostrarán:
```
🔄 Reintentando verificación facial (intento 2/4)...
   Esperando 2000ms antes de reintentar...
Error en verifyFace (intento 2/4): { ... }
```

