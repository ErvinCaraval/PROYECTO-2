# ⚠️ RESTRICCIÓN CRÍTICA: 4 OPCIONES DE RESPUESTA

## Regla Fundamental
**TODAS las preguntas generadas por HU-VC4 deben tener EXACTAMENTE 4 opciones de respuesta. Ni más, ni menos.**

---

## Implementación en Backend

### 1. Identification Question (¿Qué objeto aparece?)

```javascript
// EXACTAMENTE 4 opciones
identificationOptions = topObjects.slice(0, 4);

// Si hay menos de 4 objetos detectados, rellenar con genéricos
if (identificationOptions.length < 4) {
  const genéricos = ['otro objeto', 'persona', 'animal', 'vehículo'];
  identificationOptions.push({ texto: genérico, isCorrect: false });
}

// Si hay más de 4, tomar solo los primeros 4
identificationOptions = identificationOptions.slice(0, 4);
```

**Ejemplo:**
```json
{
  "options": [
    { "text": "guitarra", "isCorrect": true },
    { "text": "persona", "isCorrect": false },
    { "text": "otro objeto", "isCorrect": false },
    { "text": "vehículo", "isCorrect": false }
  ]
}
```

---

### 2. Counting Question (¿Cuántos hay?)

```javascript
// Generar 4 opciones numéricas según el conteo real
if (count === 0) options = ['0', '1', '2', '3'];
if (count === 1) options = ['0', '1', '2', '3'];
if (count === 2) options = ['1', '2', '3', '4'];
if (count === 3) options = ['2', '3', '4', '5'];
if (count >= 4) options = ['3', '4', '5', '6+'];
```

**Ejemplo:**
```json
{
  "question": "¿Cuántas guitarras hay en la imagen?",
  "options": [
    { "text": "1", "isCorrect": true },
    { "text": "2", "isCorrect": false },
    { "text": "3", "isCorrect": false },
    { "text": "4", "isCorrect": false }
  ]
}
```

---

### 3. Multiple Choice (¿Cuál aparece?)

```javascript
// Comenzar con objetos detectados (máx 4)
let options = topObjects.slice(0, 4);

// Si hay menos de 4, rellenar con opciones no detectadas
const noDetectadas = ['árbol', 'coche', 'gato', 'casa', 'teléfono'];
while (options.length < 4) {
  options.push(noDetectadas.shift());
}

// Asegurar exactamente 4
options = options.slice(0, 4);
```

**Ejemplo:**
```json
{
  "question": "¿Cuál de estos objetos aparece en la imagen?",
  "options": [
    { "text": "guitarra", "isCorrect": true },
    { "text": "persona", "isCorrect": false },
    { "text": "árbol", "isCorrect": false },
    { "text": "coche", "isCorrect": false }
  ]
}
```

---

## Validación en Respuesta

```javascript
// ANTES de enviar respuesta:
if (identification.options.length !== 4) {
  throw new Error('Identification debe tener exactamente 4 opciones');
}
if (counting.options.length !== 4) {
  throw new Error('Counting debe tener exactamente 4 opciones');
}
if (multipleChoice.options.length !== 4) {
  throw new Error('MultipleChoice debe tener exactamente 4 opciones');
}
```

---

## Escenarios Manejados

### Escenario 1: Pocos objetos detectados (1-2)
```
Detectados: guitarra, persona

Identification:
  - guitarra ✓
  - persona
  - otro objeto [RELLENO]
  - animal [RELLENO]
```

### Escenario 2: Muchos objetos detectados (5+)
```
Detectados: guitarra, persona, árbol, coche, casa, teléfono

Identification:
  - guitarra ✓
  - persona
  - árbol
  - coche
  [house, teléfono se ignoran]
```

### Escenario 3: Conteo
```
Count: 2

Counting:
  - 1
  - 2 ✓
  - 3
  - 4
```

---

## Testing

Verificar en pruebas:

```javascript
// ✅ DEBE pasar
expect(suggestion.identification.options).toHaveLength(4);
expect(suggestion.counting.options).toHaveLength(4);
expect(suggestion.multipleChoice.options).toHaveLength(4);

// ❌ DEBE fallar
expect(suggestion.identification.options).toHaveLength(3); // ERROR
expect(suggestion.counting.options).toHaveLength(5); // ERROR
```

---

## API Response Validation

```bash
# Verificar que TODAS las sugerencias tengan exactamente 4 opciones
curl -X POST http://localhost:3000/api/vision/detect-objects \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "...",
    "minConfidence": 0.5
  }' | jq '.questionSuggestions[] | .options | length'

# Debe devolver:
# 4
# 4
# 4
```

---

## Documentación del Cambio

**Commit:** `fix(HU-VC4): Asegurar exactamente 4 opciones de respuesta`

**Archivos afectados:**
- `backend-v1/controllers/visionController.js`

**Cambios:**
- ✅ `generateObjectQuestionSuggestions()` - Garantiza 4 opciones
- ✅ Handling de casos edge (pocos/muchos objetos)
- ✅ Relleno automático de opciones genéricas si necesario

**Backwards Compatibility:** ✅ 100% compatible
- Solo agrega opciones, no cambia lógica de respuesta correcta
- Frontend puede ignorar cambios
- API devuelve misma estructura

---

## Resumen

| Tipo | Opciones | Relleno |
|------|----------|---------|
| **Identification** | 4 objetos | Genéricos si < 4 |
| **Counting** | 4 números | Siempre 4 valores |
| **Multiple Choice** | 4 opciones | No-detectados si < 4 |

**INVARIANTE:** Siempre 4, nunca más, nunca menos.

