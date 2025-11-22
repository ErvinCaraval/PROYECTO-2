# ⚡ GUÍA RÁPIDA - Qué Esperar

## 🎯 Lo que AHORA puedes hacer en OCR

### ✅ CAMBIO 1: Seleccionar Respuesta Correcta

**Antes:**
```
El sistema asumía que la respuesta correcta era SIEMPRE la opción A
(Hardcodeado, no había forma de cambiarlo)
```

**Ahora:**
```
┌─────────────────────────────────────┐
│ ¿Cuál es la respuesta correcta? *   │ ← Sección NUEVA
├─────────────────────────────────────┤
│ ⭕ A) París                         │
│ ⭕ B) Lyon                          │ ← Haz clic en uno
│ ⭕ C) Marsella                      │
│ ⭕ D) Toulouse                      │
└─────────────────────────────────────┘
      ↓ (Después de seleccionar)
┌─────────────────────────────────────┐
│ ⭕ A) París                         │
│ ⭕ B) Lyon                          │
│ ⭕ C) Marsella         ✓ Correcta   │ ← Marca y text azul
│ ⭕ D) Toulouse                      │
└─────────────────────────────────────┘
```

**Validación:**
```
Si intentas guardar SIN seleccionar:
❌ Error: "Por favor selecciona cuál opción es correcta"

Si seleccionas una:
✅ Permite guardar
```

---

### ✅ CAMBIO 2: Agregar Múltiples Preguntas

**Antes:**
```
1. Extraes pregunta 1 con OCR
2. Guardas pregunta 1
3. Modal se cierra
4. Tienes que abrir OCR de nuevo
5. (Proceso lento y tedioso)
```

**Ahora:**
```
1. Extraes pregunta 1 con OCR
2. Seleccionas respuesta correcta ← NUEVA
3. Guardas pregunta 1
   ↓
   ✅ Pregunta guardada exitosamente  ← Ves confirmación
   ✅ 1 pregunta(s) guardada(s)       ← NUEVO: Contador
   [➕ Agregar otra pregunta]         ← NUEVO: Botón
   ↓
4. Haces clic "Agregar otra pregunta" ← NUEVO
   ↓
5. (Modal permanece abierto, vuelves a seleccionar imagen)
   ↓
6. Extraes pregunta 2 con OCR
7. Seleccionas respuesta correcta (puede ser diferente)
8. Guardas pregunta 2
   ↓
   ✅ Pregunta guardada exitosamente
   ✅ 2 pregunta(s) guardada(s)       ← Se actualizó
   [➕ Agregar otra pregunta]
   ↓
9. Puedes continuar agregando...
   ↓
10. Cuando termines: Clic "Atrás"
    ↓
    Modal cierra
    TODAS tus preguntas están en la BD ✅
```

**Flujo Visual:**
```
[Inicio]
    ↓
[Pregunta 1: Extraer → Editar → Seleccionar → Guardar]
    ↓
[✅ 1 pregunta guardada - Ver contador]
    ↓
[Clic "Agregar otra"]
    ↓
[Pregunta 2: Extraer → Editar → Seleccionar → Guardar]
    ↓
[✅ 2 preguntas guardadas - Contador actualizado]
    ↓
[Clic "Agregar otra" (opcional)]
    ↓
[Pregunta 3: Extraer → Editar → Seleccionar → Guardar]
    ↓
[✅ 3 preguntas guardadas]
    ↓
[Clic "Atrás" - Modal cierra]
    ↓
[Fin - Todas guardadas en BD]
```

---

## 📋 Prueba en 5 Minutos

### Paso 1: Preparación (30 segundos)
```
1. Abre http://localhost en tu navegador
2. Inicia sesión
3. Ve a "Generar preguntas"
4. Elige "Capturar pregunta" (OCR)
```

### Paso 2: Primera pregunta (2 minutos)
```
1. Clic "Subir imagen" o "Tomar foto"
2. Selecciona una imagen con una pregunta clara
   (Ej: "¿Cuál es la capital de Francia?")
3. Clic "⚡ Procesar"
4. Espera a que OCR extraiga el texto
   
   ← Aquí debería ver la pregunta y opciones extraídas
```

### Paso 3: Seleccionar respuesta correcta (1 minuto)
```
5. Busca la sección azul: "¿Cuál es la respuesta correcta?"
   
   ← NUEVO: Esta sección ahora está aquí
   
6. Mira las opciones (solo las válidas, no las vacías)
7. Haz clic en el radio button de la respuesta correcta
   
   Ejemplo:
   ⭕ Paris
   ⭕ Lyon
   ⭕ Marsella     ← Haz clic aquí
   ⭕ Toulouse
   
8. Deberías ver "✓ Correcta" en azul
   
   ⭕ Marsella  ✓ Correcta
```

### Paso 4: Guardar (1 minuto)
```
9. Clic en el botón azul grande: "✓ Confirmar"

10. Durante 2 segundos verás: "⏳ Guardando…"
    (Los botones estarán deshabilitados)

11. Después verás: "✅ Pregunta guardada exitosamente"
    (Un mensaje verde)

12. Debajo aparecerá: "✅ 1 pregunta(s) guardada(s)"
    (Un contador, esto es NUEVO)

13. Y un botón: "➕ Agregar otra pregunta"
    (Esto es NUEVO)
```

### Paso 5: Verificar Multiplicidad (1 minuto)
```
14. Haz clic en: "➕ Agregar otra pregunta"

15. Deberías volver a la pantalla de seleccionar imagen
    (El modal NO se cierra)

16. Sube una segunda imagen

17. Selecciona la respuesta correcta

18. Clic "Confirmar"

19. Verás el contador actualizado: "✅ 2 pregunta(s) guardada(s)"

20. El botón "➕ Agregar otra pregunta" sigue disponible
```

---

## ✨ Lo que deberías VER

### Elemento 1: Selector Azul
```
Se parece a esto (fondo azul claro):

╔════════════════════════════════════╗
║ ❓ ¿Cuál es la respuesta correcta? ║
╠════════════════════════════════════╣
║ ⭕ A) París                        ║
║ ⭕ B) Lyon                         ║
║ ⭕ C) Marsella                     ║
║ ⭕ D) Toulouse                     ║
╚════════════════════════════════════╝
```

**Color:** Azul claro (#bb-primary con 10% opacidad)
**Borde:** Línea azul oscura
**Ubicación:** Abajo de las opciones de texto, arriba de los botones

---

### Elemento 2: Marca "Correcta"
```
Cuando haces clic en una opción:

⭕ C) Marsella  ✓ Correcta
                  ↑
            Aparece en AZUL
```

**Color:** Azul primario (bb-primary)
**Estilo:** Negrita (bold)
**Símbolo:** ✓ (Check mark)
**Ubicación:** Al lado derecho de la opción

---

### Elemento 3: Contador
```
Después de guardar una pregunta:

╔════════════════════════════════════╗
║ ✅ Pregunta guardada exitosamente ║ ← Mensaje verde
║                                    ║
║ ✅ 1 pregunta(s) guardada(s)       ║ ← NUEVO: Contador
║                                    ║
║ [➕ Agregar otra pregunta]         ║ ← NUEVO: Botón
║ [📷 Otra imagen]                  ║
║ [Atrás]                           ║
╚════════════════════════════════════╝
```

**Color fondo:** Azul claro (bb-primary 10%)
**Ubicación:** Debajo de los botones principales
**Número:** Dinámico (1, 2, 3... pregunta/s)
**Gramática:** "1 pregunta" vs "2 preguntas" (correcta)

---

### Elemento 4: Botón "Agregar otra"
```
[➕ Agregar otra pregunta]
 ↑
Emoji más   Texto descriptivo
```

**Estilo:** Botón secundario (más gris/azul claro)
**Emoji:** ➕ (Plus/más)
**Ancho:** Ancho completo del contenedor
**Función:** Resetea el formulario para nueva pregunta
**Estado deshabilitado:** Gris cuando está guardando

---

## 🚨 Validaciones (Lo que DEBE funcionar)

### Validación 1: Sin pregunta
```
❌ Si NO escribes la pregunta:
   → Clic "Confirmar"
   → Error: "Por favor escribe la pregunta"
```

### Validación 2: Pocas opciones
```
❌ Si solo tienes 1 opción:
   → Clic "Confirmar"
   → Error: "Por favor completa al menos 2 opciones"
```

### Validación 3: Sin respuesta correcta (NUEVA)
```
❌ Si NO seleccionas una respuesta:
   → Clic "Confirmar"
   → Error: "Por favor selecciona cuál opción es correcta"
   
   ← Este es el NUEVO validador
```

### Validación 4: Sin tema
```
❌ Si el tema está vacío:
   → Clic "Confirmar"
   → Error: "Por favor selecciona un tema"
```

### Validación 5: Todo correcto
```
✅ Si todo está bien:
   → Pregunta escrita ✓
   → 2+ opciones ✓
   → Respuesta correcta seleccionada ✓
   → Tema seleccionado ✓
   → Clic "Confirmar"
   → ¡Se guarda! ✅
```

---

## 🎬 Acciones Disponibles en Cada Estado

### Estado: Formulario Normal
```
Puedes:
✓ Editar pregunta
✓ Editar opciones
✓ Seleccionar respuesta correcta (NUEVO)
✓ Cambiar tema
✓ Clic "Confirmar"
✓ Clic "Otra imagen"
✓ Clic "Atrás"

NO puedes:
✗ Enviar sin seleccionar respuesta correcta (NUEVO)
```

### Estado: Cargando
```
Puedes:
✓ Esperar (nada más)

NO puedes:
✗ Editar campos
✗ Cambiar selector de respuesta
✗ Clic en ningún botón
```

### Estado: Éxito con Contador
```
Puedes:
✓ Clic "Agregar otra pregunta" (NUEVO)
✓ Clic "Otra imagen"
✓ Clic "Atrás"

NO puedes:
✗ Editar los campos mostrados
✗ Volver a guardar (ya está guardado)
```

---

## 🐛 Si algo falla

### Problema: No veo el selector de respuesta correcta
```
Solución:
1. Scroll hacia abajo en el formulario
2. Debería estar entre las opciones y los botones
3. Si no aparece, recarga la página (Ctrl+R)
```

### Problema: No puedo seleccionar respuesta correcta
```
Solución:
1. Verifica que haya opciones no vacías
2. Si todas están vacías, completa al menos 2
3. Intenta hacer clic en el radio button directamente
```

### Problema: El contador no actualiza
```
Solución:
1. Espera 2 segundos después de guardar
2. El contador debería cambiar de "1" a "2"
3. Si no actualiza, recarga y verifica en historial
```

### Problema: El botón "Agregar otra" no aparece
```
Solución:
1. Necesitas guardar al menos 1 pregunta primero
2. El contador debe aparecer primero
3. Entonces el botón aparecerá debajo del contador
```

### Problema: Se cierra el modal inesperadamente
```
Solución:
1. Esto NO debería pasar (el modal debe permanecer abierto)
2. Si pasa, clic "Atrás" y vuelve a intentar
3. Verifica que el backend esté respondiendo (http://localhost:5000)
```

---

## 📊 Comparación: Antes vs Después

| Acción | ANTES | DESPUÉS |
|--------|-------|---------|
| Seleccionar respuesta correcta | ❌ No se podía | ✅ Radio buttons |
| Validación respuesta correcta | ❌ No existía | ✅ Obligatorio |
| Ver respuesta seleccionada | ❌ No se veía | ✅ Marca "✓ Correcta" |
| Agregar múltiples preguntas | ❌ Cerrar/abrir modal | ✅ Botón "Agregar otra" |
| Contador de preguntas | ❌ No existía | ✅ Muestra cantidad |
| Feedback visual | ✅ Sí (spinner) | ✅ Mejorado (con contador) |

---

## ✅ Checklist de Verificación Personal

Después de probar, marca estos items:

- [ ] Veo el selector azul "¿Cuál es la respuesta correcta?"
- [ ] Puedo hacer clic en las opciones (radio buttons)
- [ ] Aparece "✓ Correcta" cuando selecciono una opción
- [ ] No puedo guardar sin seleccionar respuesta (error aparece)
- [ ] Después de guardar, veo "✅ Pregunta guardada"
- [ ] Aparece el contador "✅ N pregunta(s) guardada(s)"
- [ ] Aparece el botón "➕ Agregar otra pregunta"
- [ ] Puedo agregar una segunda pregunta sin cerrar el modal
- [ ] El contador actualiza a "✅ 2 pregunta(s) guardada(s)"
- [ ] Puedo agregar una tercera pregunta también
- [ ] Cuando hago clic "Atrás", el modal cierra
- [ ] Voy a historial y veo TODAS mis preguntas guardadas
- [ ] Cada pregunta tiene la respuesta correcta que seleccioné

---

## 💡 Tips

1. **Para OCR de calidad:**
   - Usa imágenes claras (buena iluminación)
   - Pregunta debe ser legible
   - Opciones deben estar bien separadas

2. **Para seleccionar respuesta correcta:**
   - Solo verás las opciones válidas (no vacías)
   - Puedes cambiar de selección cuantas veces quieras
   - Se marca visualmente cuando está seleccionada

3. **Para agregar múltiples:**
   - El modal permanece abierto
   - Cada pregunta se guarda cuando haces clic "Confirmar"
   - El contador actualiza inmediatamente

4. **Si necesitas editar después:**
   - Ve a tu historial/dashboard
   - Las preguntas están ahí con la respuesta correcta que seleccionaste
   - Puedes editar desde allí si es necesario

---

## 🎉 Resultado Final

Después de completar la prueba, deberías tener:
```
✅ Múltiples preguntas OCR en la BD
✅ Cada una con una respuesta correcta específica (no asumida)
✅ Confirmadas visualmente (viste "✓ Correcta")
✅ Guardadas automáticamente
✅ Accesibles en el historial
✅ Listas para usar en partidas
```

¡**Listo para jugar!**

---

## Soporte Rápido

Si tienes dudas:

**P: ¿Necesito seleccionar respuesta correcta?**
A: SÍ, es obligatorio. El sistema no te deja guardar sin ello.

**P: ¿Se cierran todos los validadores?**
A: NO, se mantienen todos (pregunta, opciones, tema, respuesta correcta).

**P: ¿Cuántas preguntas puedo agregar?**
A: Las que quieras. Mientras haya tiempo y paciencia 😄

**P: ¿Dónde se guardan?**
A: En la BD de Firebase, igual que Manual e IA.

**P: ¿Se ve igual en mobile?**
A: Sí, responde a diferentes tamaños de pantalla.

---

✅ **LISTO PARA PROBAR**

Abre http://localhost y comienza. El sistema está actualizado y listo.
