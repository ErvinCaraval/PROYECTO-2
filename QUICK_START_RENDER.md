# ⚡ GUÍA RÁPIDA: Deploy Optimizado a Render

## PASO 1: Preparar (5 min)

```bash
cd /home/ervin/Downloads/PROYECTO-2

# Verificar cambios
git log --oneline -3

# Debería mostrar:
# 1399eb9 - docs: add comprehensive memory optimization summary
# 45fc04a - fix: optimize facial-service memory for Render 512MB
# b68517b - fix: optimize memory usage for Render 512MB limit
```

## PASO 2: Push a GitHub (1 min)

```bash
git push origin main
```

**Esperar confirmación:** `Everything up-to-date` ✅

## PASO 3: Redeploy en Render (10 min)

### Para Backend (backend-v1-latest):

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio: `backend-v1-latest`
3. Opción A (recomendado):
   - Click en **"Manual Deploy"**
   - Espera a que aparezca "Deploying..." luego "Live"
4. Opción B (automático):
   - Va a redeploy automáticamente cuando detecte push

### Para Facial-Service (si está en Render):

1. Ve a https://dashboard.render.com
2. Selecciona: `facial-service`
3. Espera redeploy automático (5-10 minutos)

## PASO 4: Monitorear Logs (15 min)

### Backend
```bash
# Dashboard → backend-v1-latest → Logs
# Buscar esta línea:

"Memory Check (5min): { rss: 280, heapUsed: 95 }"
```

✅ Si ves esto: **¡Funciona!**
❌ Si ves "Out of memory": Pasar a troubleshooting

### Facial-Service
```bash
# Dashboard → facial-service → Logs
# Buscar esta línea:

"🟢 Memory startup: 250.5MB / 800MB"
```

✅ Si ves verde: **¡Funciona!**

## PASO 5: Probar Aplicación (5 min)

1. Abre tu frontend: https://frontend-v2-latest.onrender.com
2. Intenta registrar usuario con rostro
3. Intenta login con rostro
4. Si funciona → **¡TODO LISTO!** 🎉

---

## 🆘 TROUBLESHOOTING RÁPIDO

### Error: "502 Bad Gateway"
- ✅ Esperar 2-3 minutos más
- ✅ Refresh la página
- ✅ Ver logs para "Deploying..."

### Error: "Out of memory" sigue apareciendo
- ❌ Significa el deploy no aplicó cambios
- ✅ Hacer force redeploy:
  1. Dashboard → backend-v1-latest
  2. Ir a Settings
  3. Trigger deploy (delete build cache)
  4. Esperar 10 minutos

### Error: Facial-service no responde
- ❌ Probablemente todavía startup
- ✅ Esperar 5-10 minutos
- ✅ Ver logs: "🟢 Memory startup"

---

## 📊 ESPERADO DESPUÉS DE DEPLOY

| Métrica | Esperado |
|---------|----------|
| Startup time | 2-3 minutos |
| Memory inicio | 200-250MB |
| Memory durante uso | 250-350MB |
| Status | "Live" ✅ |

---

## ✅ TODO COMPLETADO?

- [ ] Git push hecho
- [ ] Redeploy completado (status "Live")
- [ ] Logs muestran "Memory Check" para backend
- [ ] Facial-service logs muestran 🟢 verde
- [ ] Frontend carga sin errores
- [ ] Registrar usuario funciona
- [ ] Login facial funciona
- [ ] **¡LISTO!** 🎉

---

**Tiempo total estimado:** 25-35 minutos

Si algo falla, consultar: `RESUMEN_OPTIMIZACION_MEMORIA.md`
