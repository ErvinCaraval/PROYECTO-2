# 🔧 Fix: Múltiples Preguntas OCR - Modal No Se Cierra

## Problema Reportado
Cuando el usuario creaba múltiples preguntas desde OCR:
1. Tomaba foto de la primera pregunta
2. Confirmaba (se guardaba)
3. **Modal se cerraba automáticamente** ❌
4. El usuario NO podía agregar más preguntas
5. Se iba directo a creación de partida

## Root Cause
En `/frontend-v2/src/components/AIQuestionGenerator.jsx`, la función `onQuestionExtracted` tenía un timeout que cerraba el modal (`setShowOCRForm(false)`) después de 2 segundos de guardar la pregunta.

```javascript
// ❌ ANTES (Incorrecto)
setTimeout(() => {
  // Cierra OCR automáticamente después de guardar
  setShowOCRForm(false);  // ← PROBLEMA: Cierra el modal
  
  if (updatedQuestions.length > 0) {
    onQuestionsGenerated(updatedQuestions);
  }
  
  setTimeout(() => {
    setOcrQuestions([]);
    setStatusMessage('');
  }, 500);
}, 2000);
```

## Solución Implementada

### 1. **AIQuestionGenerator.jsx** - Remover cierre automático del modal

```javascript
// ✅ DESPUÉS (Correcto)
// Mantener modal abierto para agregar más preguntas
// No cierra automáticamente después de guardar

setStatusMessage(`✅ Pregunta ${updatedQuestions.length} guardada exitosamente. Puedes agregar más o finalizar.`);
setLoading(false);

// Solo cierra cuando el usuario hace clic en "Atrás" o "Cancelar"
```

**Cambios específicos:**
- Removida la llamada a `setShowOCRForm(false)` en el timeout
- Removida la cadena de timeouts que reseteaba el estado y cerraba
- Mejorado el mensaje de estado para indicar que el usuario puede agregar más

### 2. **OCRQuestionCapture.jsx** - Agregar contador visible

Se agregó un contador visual cuando el usuario ha guardado preguntas:

```javascript
{/* Show counter of saved questions */}
{savedQuestions.length > 0 && (
  <div className="p-3 bg-gradient-to-r from-bb-primary/20 to-bb-primary/10 rounded-lg border border-bb-primary/40 flex items-center justify-between">
    <span className="text-sm font-semibold text-white">
      ✅ {savedQuestions.length} pregunta{savedQuestions.length !== 1 ? 's' : ''} guardada{savedQuestions.length !== 1 ? 's' : ''}
    </span>
    <Button
      variant="outline"
      size="sm"
      onClick={onCancel}
      className="text-xs"
    >
      Finalizar
    </Button>
  </div>
)}
```

## Comportamiento Después del Fix

### Flujo Correcto Ahora:

1. **Usuario toma foto 1**
   - Sistema procesa y extrae pregunta
   - Usuario completa campos y confirma
   - ✅ Pregunta guardada (se ve contador)
   - 📝 Modal sigue abierto
   - ➕ Usuario puede capturar otra foto

2. **Usuario toma foto 2**
   - Proceso se repite
   - ✅ Pregunta 2 guardada (contador: "✅ 2 preguntas guardadas")
   - 📝 Modal sigue abierto
   - ➕ Usuario puede continuar...

3. **Usuario finaliza**
   - Hace clic en "Finalizar" (botón en el contador)
   - Modal se cierra
   - Las 2+ preguntas van a creación de partida
   - Usuario crea el juego normalmente

## Archivos Modificados

### 1. `/frontend-v2/src/components/AIQuestionGenerator.jsx`
- **Líneas 495-525:** Removido cierre automático del modal
- **Línea 506:** Actualizado mensaje de estado para indicar flujo continuo

### 2. `/frontend-v2/src/components/OCRQuestionCapture.jsx`
- **Líneas 338-349:** Agregado contador visible de preguntas guardadas
- **Línea 231:** Agregado comentario sobre mantener modal abierto

## Validación

✅ Build sin errores  
✅ Componentes compilan correctamente  
✅ Lógica de flujo mejorada  
✅ UX más clara con contador visible  

## Testing Manual

Para verificar que funciona:

1. Ir a "Crear Juego" → "Crear Pregunta con OCR"
2. Tomar foto de pregunta 1 (o subir imagen)
3. Confirmar pregunta
4. ✅ Verificar que se muestra contador "✅ 1 pregunta guardada"
5. ✅ Verificar que modal sigue abierto
6. Tomar foto de pregunta 2
7. ✅ Verificar que se actualiza a "✅ 2 preguntas guardadas"
8. Clic en "Finalizar"
9. ✅ Modal se cierra
10. ✅ Las 2 preguntas están lisas para crear juego

## Mejoras Adicionales

El componente ya incluye:
- ✅ Botón "➕ Agregar otra pregunta" después de guardar
- ✅ Selector de respuesta correcta (radio buttons)
- ✅ Validación de todos los campos
- ✅ Manejo de errores robusto

## Summary

**Problema:** Modal se cerraba después de guardar una pregunta  
**Solución:** Remover el cierre automático, permitir múltiples preguntas en un flujo continuo  
**Resultado:** Usuario ahora puede capturar N preguntas sin interrupciones  
**UX:** Mejorada con contador visible y botón "Finalizar" explícito

