# Acción Inmediata para Resolver ECONNRESET

## ✅ Cambios Aplicados (Frontend)

He reducido aún más el tamaño de las imágenes:
- **Resolución**: 300x300px (antes 400x400px)
- **Calidad**: 0.6 (antes 0.7)
- **Resultado esperado**: Imágenes ~70-80% más pequeñas = procesamiento más rápido

**Acción requerida**: Reinicia el frontend para aplicar los cambios.

---

## 🔧 Verificar Servicio en Azure

**IMPORTANTE**: Asegúrate de que el servicio en Azure tenga los cambios del `api.py` (timeout aumentado).

### Verificar si el servicio tiene los cambios:

```bash
# Ver logs del Container en Azure
az container logs \
  --resource-group <TU_RESOURCE_GROUP> \
  --name facial-service-ervin \
  --follow
```

Si ves errores o el servicio no está corriendo, necesitas redesplegarlo.

---

## 🚀 Soluciones por Orden de Prioridad

### Solución 1: Aumentar Recursos en Azure (RECOMENDADO - Más Rápido)

Azure Container Instances con más CPU/memoria procesa DeepFace más rápido, reduciendo la probabilidad de timeout.

**Pasos**:

1. Ve a Azure Portal → Container Instances → `facial-service-ervin`
2. Haz clic en **"Stop"**
3. Ve a **"Settings"** → **"Containers"**
4. Aumenta:
   - **CPU**: De 2 a **4 cores**
   - **Memory**: De 4GB a **8GB**
5. Guarda y reinicia

**O con Azure CLI**:
```bash
# Obtener configuración actual
az container show \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --query "{cpu:containers[0].resources.requests.cpu,memory:containers[0].resources.requests.memoryInGb}"

# Recrear con más recursos
az container delete --resource-group <TU_RG> --name facial-service-ervin --yes

az container create \
  --resource-group <TU_RG> \
  --name facial-service-ervin \
  --image ervincaravaliibarra/facial-service:latest \
  --dns-name-label facial-service-ervin \
  --ports 5001 \
  --cpu 4 \
  --memory 8 \
  --restart-policy Always
```

**Costo**: Aproximadamente 2x más, pero debería resolver el problema.

---

### Solución 2: Migrar a Azure App Service (MEJOR A LARGO PLAZO)

Azure App Service está mejor diseñado para aplicaciones con procesamiento largo.

**Ventajas**:
- ✅ Timeouts más largos por defecto
- ✅ Mejor manejo de conexiones persistentes
- ✅ Escalado automático
- ✅ Logs más detallados
- ✅ Deployment slots (staging/production)

**Pasos**:
1. En Azure Portal, crea un nuevo **App Service**
2. Configura para usar **Docker Container**
3. Usa la imagen: `ervincaravaliibarra/facial-service:latest`
4. Configura el puerto: `5001`
5. Actualiza `DEEPFACE_SERVICE_URL` en tu backend

---

### Solución 3: Usar Modelo Más Rápido de DeepFace

Cambiar de `VGG-Face` a un modelo más rápido (menos preciso pero más rápido).

**En `facial-service/api.py`**, cambiar:
```python
# Línea ~82 (registerFace)
embedding = DeepFace.represent(
    img_path=image_path,
    model_name='Facenet',  # Cambiar de 'VGG-Face' a 'Facenet'
    enforce_detection=True
)

# Línea ~142 (verifyFace)
result = DeepFace.verify(
    img1_path=img1_path,
    img2_path=img2_path,
    model_name='Facenet',  # Cambiar de 'VGG-Face' a 'Facenet'
    distance_metric='cosine',
    enforce_detection=True
)
```

**Modelos disponibles** (de más rápido a más lento):
- `OpenFace` - Más rápido, menos preciso
- `Facenet` - Balanceado
- `VGG-Face` - Más lento, más preciso (actual)

---

## 📊 Verificación

Después de aplicar cualquier solución:

1. **Reinicia el frontend** (para aplicar optimizaciones de imágenes)
2. **Prueba el servicio**:
   ```bash
   curl http://facial-service-ervin.guayfkfebtc3fnda.brazilsouth.azurecontainer.io:5001/health
   ```
3. **Revisa los logs del backend** para ver si hay menos errores
4. **Prueba el registro/login facial** desde la aplicación

---

## 🎯 Recomendación Final

**Orden de acción**:

1. ✅ **Ya hecho**: Optimizar imágenes a 300x300px
2. 🔄 **Ahora**: Reiniciar frontend y probar
3. ⚠️ **Si persiste**: Aumentar recursos en Azure (4 CPU, 8GB RAM)
4. 🔄 **Si aún persiste**: Migrar a Azure App Service

El problema fundamental es que **Azure Container Instances tiene límites de timeout** que no podemos controlar completamente. Más recursos = procesamiento más rápido = menos probabilidad de timeout.

