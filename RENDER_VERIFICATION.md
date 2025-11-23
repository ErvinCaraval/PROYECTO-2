# 🚀 INSTRUCCIONES PARA VERIFICAR EN RENDER

## PASO 1: Re-deploy en Render

1. **Ve a**: https://dashboard.render.com/
2. **Selecciona**: `frontend-v2-latest` service
3. **Click en**: "Manual Deploy" (arriba a la derecha)
4. **Espera**: ~3-5 minutos a que se despliegue

---

## PASO 2: Abre la Aplicación

1. **Ve a**: https://frontend-v2-latest.onrender.com
2. **Abre DevTools**: `F12` (o `Cmd+Option+I` en Mac)
3. **Ve a**: Pestaña "Console"

---

## PASO 3: Verificación en Console

### ✅ Deberías ver ESTO:

```
[ENV CONFIG LOADED] {
  environment: 'RENDER',
  VITE_API_URL: 'https://backend-v1-latest.onrender.com/api',
  VITE_SOCKET_URL: 'https://backend-v1-latest.onrender.com'
}
```

### ✅ Cada servicio debería loguear:

```
[VoiceService] Initialized with baseUrl: https://backend-v1-latest.onrender.com/api
[Socket] Connecting to: https://backend-v1-latest.onrender.com
```

### ❌ SI VES ESTO = PROBLEMA:

```
localhost:5000
net::ERR_CONNECTION_REFUSED
Cannot connect to http://localhost
```

---

## PASO 4: Pruebas Funcionales

### Test 1: Login
- [ ] Intenta login con usuario existente
- [ ] Verifica que no haya errores de conexión
- [ ] Debería redirigir a dashboard

### Test 2: Ver Juegos Públicos
- [ ] En dashboard, busca sección de "Juegos Públicos"
- [ ] Debería cargar lista de juegos
- [ ] NO debería tener errores en console

### Test 3: Voice/Audio
- [ ] Si hay botones de "Voice"
- [ ] Click en "Speak" o "Listen"
- [ ] Debería reproducir audio sin errores
- [ ] Console debería loguear URLs correctas

### Test 4: Socket.IO
- [ ] Abre Network tab en DevTools
- [ ] Busca conexión a "wss://" (WebSocket)
- [ ] Debería estar conectado a backend-v1-latest.onrender.com
- [ ] No debería tener "ws://localhost"

### Test 5: TTS/Text-to-Speech
- [ ] Si hay botón de "Hablar" o "Speak"
- [ ] Click en él
- [ ] Console debería loguer "[VoiceService] TTS Request"
- [ ] No debería errores de conexión

---

## 📊 CHECKLIST DE VERIFICACIÓN

| Test | Expected | Actual | Status |
|------|----------|--------|--------|
| ENV CONFIG LOADED | ✅ Presente | ? | ? |
| VITE_API_URL | backend-v1-latest.onrender.com | ? | ? |
| Login funciona | ✅ Sin errores | ? | ? |
| Juegos cargan | ✅ Lista visible | ? | ? |
| Socket.IO conectado | ✅ wss://backend | ? | ? |
| TTS funciona | ✅ Audio se escucha | ? | ? |
| Console limpia | ✅ Sin localhost | ? | ? |

---

## 🔍 SI ALGO NO FUNCIONA

### Problema 1: "net::ERR_CONNECTION_REFUSED"

**Causa probable**: env-config.js no se cargó

**Solución**:
1. Abre Network tab
2. Recarga la página
3. Busca `env-config.js` en la lista
4. Verifica que Status sea `200` (no 404)
5. Si es 404, re-deploy de nuevo

### Problema 2: Sigue usando localhost

**Causa probable**: window.ENV no está disponible

**Solución**:
1. En Console escribe: `window.ENV`
2. Debería mostrar objeto con VITE_API_URL
3. Si dice `undefined`, env-config.js falló
4. Check Render logs con `docker logs`

### Problema 3: Socket.IO no conecta

**Causa probable**: VITE_SOCKET_URL incorrecto

**Solución**:
1. Console: `window.ENV.VITE_SOCKET_URL`
2. Debería ser `https://backend-v1-latest.onrender.com`
3. Si dice `undefined` o `localhost`, hay error

---

## 🛠️ DEPURACIÓN AVANZADA

### Ver Todos los Valores Configurados

```javascript
// En Console, copia esto:
console.log(JSON.stringify(window.ENV, null, 2))
```

### Ver Qué URL Está Usando Socket

```javascript
// En Console:
console.log('Socket URL:', window.io?.sockets?.io?.path)
```

### Ver Qué URL Está Usando Backend Auth

```javascript
// En Console:
console.log(window.ENV?.VITE_API_URL || 'UNDEFINED')
```

---

## 📱 VERIFICACIÓN EN MOBILE

1. Abre app en teléfono
2. Abre DevTools con `about:inspect` (Android)
3. O Safari DevTools (iPhone)
4. Sigue los mismos pasos de verificación
5. Verifica que Socket.IO funcione con polling

---

## ✅ CRITERIOS DE ÉXITO

Todo está bien si:

- ✅ Ves `[ENV CONFIG LOADED] environment: 'RENDER'`
- ✅ VITE_API_URL = `https://backend-v1-latest.onrender.com/api`
- ✅ No ves errores de `localhost:5000`
- ✅ Login funciona sin problemas
- ✅ Puedes ver lista de juegos
- ✅ Voice/TTS funciona
- ✅ Socket.IO conecta con `wss://backend-v1-latest...`

---

## 🚨 ERRORES CRÍTICOS A REPORTAR

Si ves ALGUNO de estos después de re-deploy:

1. **404 on env-config.js** → Entrypoint script falló
2. **window.ENV undefined** → env-config.js no ejecutó
3. **Sigue diciendo localhost** → window.ENV no se propagó
4. **Socket en ws://localhost** → socket.js no usa window.ENV

**CONTACTA SI**: Después de re-deploy sigues viendo localhost

---

## 📝 REGISTRO DE VERIFICACIÓN

**Fecha de Re-deploy**: ________________  
**Hora de Verificación**: ________________  
**Environment Detectado**: ________________  
**VITE_API_URL**: ________________  
**Login Funciona**: ☐ Sí ☐ No  
**Juegos Cargan**: ☐ Sí ☐ No  
**Socket.IO Conecta**: ☐ Sí ☐ No  
**TTS Funciona**: ☐ Sí ☐ No  

---

**Creado**: 23 Nov 2025  
**Estado**: Listo para Render  
**Docker Image**: ervincaravaliibarra/frontend-v2:latest  
**Digest**: sha256:d548ad75cc518da28900c2d3a5f5d3063da7df0638d5d0535c79b681894513b6
