# 🎨 MAPA VISUAL - Dónde están los nuevos elementos

## Ubicación de los Nuevos Elementos en la UI

```
╔══════════════════════════════════════════════════════════════╗
║                  FORMULARIO OCR                              ║
║                  "Pregunta extraída"                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Tema: [Dropdown ▼]                                          ║
║                                                              ║
║  Pregunta *                                                  ║
║  [Texto pregunta extraída] ← Editable                        ║
║                                                              ║
║  Opciones de respuesta *                                     ║
║  A) [Texto opción A] ← Editable                             ║
║  B) [Texto opción B] ← Editable                             ║
║  C) [Texto opción C] ← Editable                             ║
║  D) [Texto opción D] ← Editable                             ║
║                                                              ║
║  ╔════════════════════════════════════════════════════════╗ ║
║  ║ ❓ ¿Cuál es la respuesta correcta? *                  ║ ║ ← NUEVO
║  ║ (Sección con fondo azul claro)                        ║ ║
║  ║                                                        ║ ║
║  ║ ⭕ A) París              ✓ Correcta (si está selec)  ║ ║ ← NUEVO
║  ║ ⭕ B) Lyon                                            ║ ║ ← NUEVO
║  ║ ⭕ C) Marsella                                        ║ ║ ← NUEVO
║  ║ ⭕ D) Toulouse                                        ║ ║ ← NUEVO
║  ║                                                        ║ ║
║  ║ (Solo muestra opciones no vacías)                      ║ ║ ← NUEVO
║  ╚════════════════════════════════════════════════════════╝ ║
║                                                              ║
║  ℹ️ Puedes editar la pregunta manualmente...               ║
║                                                              ║
║  ┌────────────────────────────────────────────────────────┐ ║
║  │ [✓ Confirmar] [📷 Otra imagen] [Atrás]                │ ║
║  └────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  ╔════════════════════════════════════════════════════════╗ ║
║  ║ ✅ 1 pregunta(s) guardada(s)                          ║ ║ ← NUEVO
║  ║                                                        ║ ║
║  ║ [➕ Agregar otra pregunta]                            ║ ║ ← NUEVO
║  ║ [📷 Otra imagen]                                      ║ ║
║  ║ [Atrás]                                               ║ ║
║  ╚════════════════════════════════════════════════════════╝ ║ ← NUEVO
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Estados de la Interfaz

### Estado 1: Después de Extraer OCR (Normal)
```
┌──────────────────────────────────────┐
│ Pregunta extraída                    │
│                                      │
│ [Campo tema]                         │
│ [Campo pregunta]                     │
│ A) [Campo opción A]                  │
│ B) [Campo opción B]                  │
│ C) [Campo opción C]                  │
│ D) [Campo opción D]                  │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ¿Cuál es la respuesta correcta? │ ← NUEVO
│ │ ⭕ A) ...                        │
│ │ ⭕ B) ...                        │
│ └──────────────────────────────────┘ │
│                                      │
│ [✓ Confirmar] [📷 Otra] [Atrás]    │
└──────────────────────────────────────┘

Acciones disponibles:
✓ Editar pregunta
✓ Editar opciones
✓ Seleccionar respuesta correcta ← NUEVA
✓ Confirmar guardado
```

### Estado 2: Cargando (Mientras se guarda)
```
┌──────────────────────────────────────┐
│ Pregunta extraída                    │
│ (Contenido deshabilitado, grayed)    │
│                                      │
│ [⏳ Guardando…] [📷 Otra] [Atrás]   │ ← Cambió a "Guardando…"
│ (Botones deshabilitados)             │
└──────────────────────────────────────┘

Indicadores:
⏳ Botón cambia de "✓ Confirmar" a "⏳ Guardando…"
🔒 Todos los campos se deshabilitan
💤 Todos los botones se deshabilitan
```

### Estado 3: Éxito + Contador (Después de guardar)
```
┌──────────────────────────────────────┐
│ ✅ Pregunta guardada exitosamente    │ ← Mensaje de éxito
│                                      │
│ ✅ 1 pregunta(s) guardada(s)         │ ← NUEVO: Contador
│                                      │
│ [➕ Agregar otra pregunta]           │ ← NUEVO: Botón destacado
│ [📷 Otra imagen]                    │
│ [Atrás]                             │
└──────────────────────────────────────┘

Acciones disponibles:
✓ Agregar otra pregunta ← NUEVA
✓ Capturar otra imagen
✓ Volver atrás
```

### Estado 4: Después de Agregar 2 preguntas
```
┌──────────────────────────────────────┐
│ ✅ Pregunta guardada exitosamente    │
│                                      │
│ ✅ 2 pregunta(s) guardada(s)         │ ← Contador actualizado
│                                      │
│ [➕ Agregar otra pregunta]           │
│ [📷 Otra imagen]                    │
│ [Atrás]                             │
└──────────────────────────────────────┘

El contador se actualizó de "1" a "2"
```

---

## Componentes Modificados

### 1. Sección de Selector de Respuesta Correcta
```jsx
<div className="grid gap-3 p-3 bg-bb-primary/10 rounded-lg border border-bb-primary/30">
  <label className="text-sm font-semibold text-white">
    ¿Cuál es la respuesta correcta? *
  </label>
  <div className="grid gap-2">
    {['a', 'b', 'c', 'd'].map((key, idx) => {
      const optionText = processedQuestion.opciones[key];
      const isEmptyOrInvalid = !optionText || optionText.trim() === '';
      
      if (isEmptyOrInvalid) return null;
      
      return (
        <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
          <input
            type="radio"
            name="correctOption"
            checked={correctAnswerIndex === idx}
            onChange={() => setCorrectAnswerIndex(idx)}
            disabled={loading || isEmptyOrInvalid}
            className="h-4 w-4 cursor-pointer"
          />
          <span className="text-sm">
            <strong>{key.toUpperCase()})</strong> {optionText}
          </span>
          {correctAnswerIndex === idx && (
            <span className="ml-auto text-bb-primary font-bold">✓ Correcta</span>
          )}
        </label>
      );
    })}
  </div>
</div>
```

**Características:**
- Fondo azul claro (bg-bb-primary/10)
- Borde azul (border-bb-primary/30)
- Radio buttons para cada opción válida
- Label "✓ Correcta" cuando está seleccionada
- Solo muestra opciones no vacías

---

### 2. Sección de Contador y Agregar Otra
```jsx
{/* Show "Add another question" button if questions have been saved */}
{savedQuestions.length > 0 && (
  <div className="p-3 bg-bb-primary/10 rounded-lg border border-bb-primary/30">
    <p className="text-sm text-white mb-2">
      ✅ {savedQuestions.length} pregunta{savedQuestions.length !== 1 ? 's' : ''} guardada{savedQuestions.length !== 1 ? 's' : ''}
    </p>
    <Button
      variant="secondary"
      onClick={resetForm}
      disabled={loading}
      className="w-full"
      onFocus={() => isVoiceModeEnabled && speak('Agregar otra pregunta', { force: true })}
      onMouseEnter={() => isVoiceModeEnabled && speak('Agregar otra pregunta', { force: true })}
    >
      ➕ Agregar otra pregunta
    </Button>
  </div>
)}
```

**Características:**
- Fondo azul claro (bg-bb-primary/10)
- Contador dinámico (1 pregunta vs N preguntas)
- Botón destacado con emoji ➕
- Texto completo en español
- Ancho completo del contenedor

---

## Comparación Visual

### Versión Anterior (OCR)
```
┌──────────────────────────────┐
│ Pregunta extraída            │
│ [Campos]                     │
│ [Opciones]                   │
│                              │
│ [✓ Confirmar] [📷] [Atrás]  │
│                              │
│ (Modal se cerraba)           │
└──────────────────────────────┘
```

### Versión Nueva (OCR)
```
┌──────────────────────────────────┐
│ Pregunta extraída                │
│ [Campos]                         │
│ [Opciones]                       │
│                                  │
│ ┌────────────────────────────┐   │
│ │ ¿Respuesta correcta?     │ ← NUEVO
│ │ ⭕ A) ...                 │ ← NUEVO
│ │ ⭕ B) ...                 │ ← NUEVO
│ └────────────────────────────┘   │
│                                  │
│ [✓ Confirmar] [📷] [Atrás]      │
│                                  │
│ ✅ 1 pregunta guardada           │ ← NUEVO
│ [➕ Agregar otra pregunta]       │ ← NUEVO
└──────────────────────────────────┘
```

---

## Interactividad

### Selector de Respuesta Correcta
```
Antes de seleccionar:
⭕ A) París           ← Circunferencia vacía
⭕ B) Lyon

Después de seleccionar A:
⭕ A) París  ✓ Correcta  ← Se llena + aparece marca
⭕ B) Lyon
```

### Contador
```
Después de guardar 1 pregunta:
✅ 1 pregunta guardada

Después de guardar 2 preguntas:
✅ 2 preguntas guardadas    ← Cambió pluralización

Después de guardar 3 preguntas:
✅ 3 preguntas guardadas    ← Sigue el patrón
```

---

## Colores y Estilos

### Nuevos elementos azules:
```
Selector de respuesta:
- Fondo: bg-bb-primary/10 (azul claro, 10% opacidad)
- Borde: border-bb-primary/30 (azul oscuro, 30% opacidad)
- Texto label: "¿Cuál es la respuesta correcta? *"

Contador:
- Fondo: bg-bb-primary/10 (azul claro, 10% opacidad)
- Borde: border-bb-primary/30 (azul oscuro, 30% opacidad)
- Texto: "✅ N pregunta(s) guardada(s)"

Marca correcta:
- Color: text-bb-primary (azul primario)
- Peso: font-bold
- Texto: "✓ Correcta"
```

### Botón "Agregar otra pregunta":
```
- Variante: secondary (estilo secundario)
- Ancho: w-full (ancho completo)
- Color: gris/azul secundario
- Emoji: ➕
- Hover: Más destacado
- Disabled state: Grayed cuando está cargando
```

---

## Flujo de Cambio de Estados

```
Normal (Sin guardar)
    ↓
Usuario selecciona respuesta correcta
    ↓ [Selector se marca]
    ↓
Usuario hace clic "Confirmar"
    ↓
Estado Cargando ("⏳ Guardando…")
    ↓ [Botones deshabilitados]
    ↓ [Campos read-only]
    ↓
Éxito (Después de 2 segundos)
    ↓
Mensaje: "✅ Pregunta guardada"
    ↓
Contador: "✅ 1 pregunta(s) guardada(s)"
    ↓
Botón: "➕ Agregar otra pregunta"
    ↓
Usuario hace clic "Agregar otra"
    ↓
resetForm() limpia todo
    ↓
Vuelve a "Normal" para la próxima pregunta
```

---

## Responsive Design

### En Desktop (1920px)
```
┌────────────────────────────────────────────┐
│ Pregunta extraída                          │
│                                            │
│ [Campo tema]                               │
│ [Campo pregunta largo]                     │
│ [Opciones en columna]                      │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ ¿Cuál es la respuesta correcta?    │  │
│ │ ⭕ A) París          ✓ Correcta    │  │
│ │ ⭕ B) Lyon                         │  │
│ │ ⭕ C) Marsella                     │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [✓ Confirmar] [📷 Otra] [Atrás]           │
│                                            │
│ ✅ 1 pregunta guardada                     │
│ [➕ Agregar otra pregunta]                │
└────────────────────────────────────────────┘
```

### En Tablet (768px)
```
┌──────────────────────────┐
│ Pregunta extraída        │
│ [Campo tema]             │
│ [Campo pregunta]         │
│ [Opciones]               │
│                          │
│ ┌────────────────────┐   │
│ │ ¿Respuesta...?   │   │
│ │ ⭕ A) París       │   │
│ │ ⭕ B) Lyon        │   │
│ └────────────────────┘   │
│                          │
│ [✓] [📷] [Atrás]        │
│ ✅ 1 pregunta guardada   │
│ [➕ Agregar...]         │
└──────────────────────────┘
```

### En Mobile (375px)
```
┌──────────────┐
│ Pregunta...  │
│ [Campo tema] │
│ [Campo pre]  │
│ [Opciones]   │
│              │
│ ┌──────────┐ │
│ │ ¿Resp?   │ │
│ │ ⭕ A) P  │ │
│ │ ⭕ B) L  │ │
│ └──────────┘ │
│              │
│ [✓][📷][←]  │
│ ✅ 1 pregunta│
│ [➕ Agregar] │
└──────────────┘
```

---

## Accesibilidad

### Para usuarios con discapacidades:
- **Radio buttons:** Navegables con tabulador
- **Etiquetas:** Todas tienen `<label>` vinculadas
- **Focus visible:** Los elementos muestran foco cuando se navega
- **ARIA:** Estructura semántica correcta
- **Voice mode:** Los botones usan `onFocus` y `onMouseEnter` para anunciar
  - "Confirmar y guardar"
  - "Agregar otra pregunta"
  - Etc.

### Ejemplo de navegación por voz:
```
Usuario dice: "Seleccionar París"
→ Focus en radio button A
→ Lee: "Confirmar y guardar"
→ Usuario hace clic
→ Se marca respuesta correcta
```

---

## Testing Visual Checklist

- [ ] Selector aparece en fondo azul
- [ ] Radio buttons muestran las opciones correctas
- [ ] Al seleccionar, aparece "✓ Correcta" en azul
- [ ] Contador aparece después de guardar
- [ ] Contador muestra el número correcto
- [ ] Botón "Agregar otra" es visible y clickeable
- [ ] Flujo es fluido sin parpadeos
- [ ] Estilos son consistentes (colores, fuentes)
- [ ] Botones están deshabilitados durante guardado
- [ ] En mobile se ve correctamente

✅ **LISTO PARA VER EN ACCIÓN**

Abre tu navegador en http://localhost y prueba el flujo completo.
