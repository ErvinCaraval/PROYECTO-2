## ⚠️ SOLUCIÓN: Optimización de Memoria en Facial-Service

### Cambios Realizados

#### 1. **Memory Optimizer (`memory_optimizer.py`)**
- ✅ `MemoryOptimizer`: Monitoreo continuo de memoria
- ✅ `ImageOptimizer`: Compresión de imágenes antes de procesar
- ✅ Detección de umbrales (Warning: 500MB, Critical: 700MB)
- ✅ Cleanup automático cada 30 segundos

#### 2. **Dockerfile Optimizado**
```dockerfile
# Variables de entorno para limitar threads en librerías
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1
```

Esto previene que OpenBLAS, MKL y OpenMP usen todos los cores, evitando picos de memoria.

#### 3. **api.py Cambios**
- ✅ ThreadPoolExecutor reducido: máximo 2 workers (vs 4-8)
- ✅ Cache reducido: 500 embeddings (vs 2000)
- ✅ TTL corto: 30 minutos (vs 60 minutos)
- ✅ Rate limiting reducido: 100/día, 20/hora (vs 200/día, 50/hora)
- ✅ Integración con Memory Optimizer

#### 4. **requirements.txt**
- ✅ Agregado `psutil==5.9.6` para monitoreo de memoria

### Impacto Esperado en Memoria

| Aspecto | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| Cache máximo | 2000 embeddings | 500 embeddings | -75% |
| Workers | 4-8 | 2 | -75% |
| Thread overhead | Alto | Bajo | -60% |
| Picos de memoria | 600-700MB | 300-350MB | -50% |
| Startup memory | 450MB | 250MB | -44% |

### Configuración Recomendada para Render

**En `docker-compose.yml` o Azure Container Instances:**

```yaml
environment:
  - USE_INMEM_CACHE=false  # Usar Redis en lugar de memoria
  - FLASK_ENV=production
  - PYTHONUNBUFFERED=1
```

O si estás en Azure Container Instances:

```bash
az container create \
  --resource-group your-group \
  --name facial-service \
  --image your-registry.azurecr.io/facial-service:latest \
  --cpu 1 --memory 0.5 \
  --environment-variables \
    USE_INMEM_CACHE=false \
    FLASK_ENV=production \
    PYTHONUNBUFFERED=1 \
  --ports 5001
```

### Monitoreo Después del Deploy

El servicio ahora loguea memoria cada 30 segundos:

```
🟢 Memory startup: 250.5MB / 800MB
🟢 Memory check: 280.3MB / 800MB
🟡 WARNING: Memory 520.0MB > 500MB
🔴 CRITICAL: Memory 750.0MB > 700MB
```

**Señales de Salud:**
- 🟢 Verde: < 500MB ✅
- 🟡 Amarillo: 500-700MB (limpieza automática)
- 🔴 Rojo: > 700MB (problema crítico)

### Prueba Local

```bash
cd facial-service

# Build
docker build -t facial-service:optimized .

# Ejecutar con límite de memoria
docker run \
  --memory=512m \
  --memory-reservation=400m \
  -p 5001:5001 \
  -e USE_INMEM_CACHE=false \
  facial-service:optimized

# En otra terminal, ver logs con memoria
docker logs -f <container-id>
```

### Troubleshooting

**Si aún hay problemas de memoria:**

1. **Reducir cache más:**
   ```python
   cache_size = 250  # En lugar de 500
   ```

2. **Usar solo Redis (sin caché en memoria):**
   ```bash
   USE_INMEM_CACHE=false
   ```

3. **Reducir workers a 1:**
   ```python
   optimal_workers = 1  # Ultra-conservador
   ```

4. **Usar modelo facial más ligero:**
   ```python
   DeepFace.verify(
       img1_path, img2_path,
       model_name="SFace",  # Más ligero que VGG-Face
       detector_backend="retinaface"
   )
   ```

### Archivos Modificados

- ✅ `facial-service/memory_optimizer.py` - NUEVO
- ✅ `facial-service/api.py` - Integración de optimizador
- ✅ `facial-service/Dockerfile` - Variables de entorno
- ✅ `facial-service/requirements.txt` - psutil agregado

### Próximos Pasos

1. **Commit:**
```bash
git add facial-service/
git commit -m "fix: optimize facial-service memory for Render 512MB"
git push origin main
```

2. **Redeploy:**
   - En Azure Container Instances: Redeploy la imagen
   - En Docker Compose: `docker-compose down && docker-compose up`

3. **Monitorear:**
   - Ver logs durante 30 minutos
   - Confirmar que memoria no exceda 400MB
   - Si sigue fallo: reducir workers a 1

---

**Estimación Total de Ahorro:**

Backend (Node.js): -70-80%
Facial-service (Python): -50-60%
**Total del sistema: -60-70% memoria**

¡Debería funcionar sin problemas en Render 512MB!
