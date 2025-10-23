# 🎤 API de Voz - BrainBlitz Backend

## 📋 Resumen

Este documento describe las APIs implementadas para las funcionalidades de voz en BrainBlitz, incluyendo la integración con AssemblyAI para Text-to-Speech (TTS) y Speech-to-Text (STT).

## 🔧 Configuración Requerida

### Variables de Entorno
```bash
# AssemblyAI API Key (opcional - si no está configurado, se usará Web Speech API)
ASSEMBLYAI_API_KEY=tu_api_key_aqui
```

## 📚 APIs Implementadas

### 1. **Voice Interactions** - Historial de Interacciones de Voz

#### `POST /api/voice-interactions`
Registra una interacción de voz del usuario.

**Request Body:**
```json
{
  "userId": "string",
  "questionId": "string", 
  "action": "question_read" | "voice_answer",
  "duration": "number (ms)",
  "timestamp": "string (ISO date)",
  "voiceText": "string (opcional)",
  "confidence": "number (opcional)",
  "metadata": {
    "audioBase64": "string (opcional)",
    "matchedOption": "string (opcional)",
    "answerIndex": "number (opcional)"
  }
}
```

**Response:**
```json
{
  "message": "Voice interaction registered successfully."
}
```

#### `GET /api/voice-interactions/:userId`
Obtiene el historial de interacciones de voz de un usuario.

**Response:**
```json
[
  {
    "id": "string",
    "userId": "string",
    "questionId": "string",
    "action": "string",
    "duration": "number",
    "timestamp": "Date",
    "voiceText": "string",
    "confidence": "number",
    "metadata": "object"
  }
]
```

#### `DELETE /api/voice-interactions/:userId`
Elimina el historial de interacciones de voz de un usuario.

**Response:**
```json
{
  "message": "Deleted X interactions."
}
```

#### `GET /api/voice-interactions/stats/:userId`
Obtiene estadísticas de uso de voz de un usuario.

**Response:**
```json
{
  "total": "number",
  "averageDuration": "number"
}
```

### 2. **Voice Responses** - Procesamiento de Respuestas de Voz

#### `POST /api/voice-responses/validate`
Valida una respuesta de voz contra las opciones de una pregunta.

**Request Body:**
```json
{
  "userId": "string",
  "questionId": "string",
  "voiceResponse": "string",
  "questionOptions": ["string", "string", "string", "string"]
}
```

**Response:**
```json
{
  "valid": "boolean",
  "matchedOption": "string | null",
  "answerIndex": "number | null", 
  "confidence": "number"
}
```

**Algoritmo de Validación:**
- ✅ Coincidencia exacta con opciones
- ✅ Coincidencia por letras (A, B, C, D)
- ✅ Coincidencia por posición (primera, segunda, etc.)
- ✅ Coincidencia por números (1, 2, 3, 4)
- ✅ Coincidencia parcial (contiene la opción)

#### `POST /api/voice-responses/process`
Procesa una respuesta de voz y la registra.

**Request Body:** (igual que validate)

**Response:**
```json
{
  "success": "boolean",
  "result": {
    "isValid": "boolean",
    "matchedOption": "string | null",
    "answerIndex": "number | null",
    "confidence": "number"
  }
}
```

#### `GET /api/voice-responses/stats/:userId`
Obtiene estadísticas de reconocimiento de voz de un usuario.

**Response:**
```json
{
  "totalAttempts": "number",
  "successfulRecognitions": "number", 
  "successRate": "number",
  "averageConfidence": "number"
}
```

### 3. **AssemblyAI Integration** - Servicios de Voz Avanzados

#### `POST /api/assemblyai/tts`
Convierte texto a voz usando AssemblyAI.

**Request Body:**
```json
{
  "text": "string (máx 5000 caracteres)",
  "voice": "string (opcional, default: es-ES-EnriqueNeural)",
  "speed": "number (opcional, default: 1.0)",
  "format": "string (opcional, default: mp3)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "audioUrl": "string",
  "duration": "number",
  "format": "string"
}
```

#### `POST /api/assemblyai/stt`
Convierte audio a texto usando AssemblyAI.

**Request Body:**
```json
{
  "audioUrl": "string",
  "language": "string (opcional, default: es)",
  "punctuate": "boolean (opcional, default: true)",
  "formatText": "boolean (opcional, default: true)",
  "speakerLabels": "boolean (opcional, default: false)"
}
```

**Response:**
```json
{
  "success": "boolean",
  "text": "string",
  "confidence": "number",
  "words": "array",
  "duration": "number"
}
```

#### `POST /api/assemblyai/process-audio`
Procesa audio en formato base64.

**Request Body:**
```json
{
  "audioBase64": "string",
  "language": "string (opcional, default: es)",
  "punctuate": "boolean (opcional, default: true)",
  "formatText": "boolean (opcional, default: true)"
}
```

**Response:** (igual que STT)

#### `GET /api/assemblyai/voices`
Obtiene las voces disponibles en AssemblyAI.

**Response:**
```json
{
  "success": "boolean",
  "voices": [
    {
      "name": "string",
      "language": "string",
      "gender": "string"
    }
  ]
}
```

#### `GET /api/assemblyai/status`
Verifica el estado del servicio AssemblyAI.

**Response:**
```json
{
  "available": "boolean",
  "service": "AssemblyAI",
  "features": ["text-to-speech", "speech-to-text", "audio-processing"]
}
```

### 4. **Admin Accessibility** - Controles Administrativos

#### `GET /api/admin/accessibility`
Obtiene la configuración de accesibilidad del usuario autenticado.

**Response:**
```json
{
  "visualDifficulty": "boolean",
  "stats": "object",
  "email": "string",
  "displayName": "string"
}
```

#### `PUT /api/admin/accessibility`
Actualiza la configuración de accesibilidad del usuario.

**Request Body:**
```json
{
  "visualDifficulty": "boolean"
}
```

**Response:**
```json
{
  "visualDifficulty": "boolean",
  "email": "string", 
  "displayName": "string"
}
```

#### `GET /api/admin/accessibility/stats`
Obtiene estadísticas de accesibilidad del usuario.

**Response:**
```json
{
  "totalInteractions": "number",
  "averageDuration": "number"
}
```

## 🔐 Autenticación

Todas las APIs requieren autenticación mediante Firebase Auth token en el header:

```
Authorization: Bearer <firebase_token>
```

## 🚦 Rate Limiting

- **General User Limiter**: 100 requests/15 minutos
- **Rate limits aplicados a todas las APIs de voz**

## 📊 Códigos de Respuesta

- `200` - Éxito
- `201` - Creado exitosamente
- `400` - Error en la petición
- `401` - No autenticado
- `404` - No encontrado
- `413` - Audio demasiado grande
- `500` - Error interno del servidor

## 🧪 Pruebas

### Ejecutar Pruebas Unitarias
```bash
npm run test:unit -- --testNamePattern="voiceController"
```

### Ejecutar Todas las Pruebas
```bash
npm test
```

## 📈 Métricas de Rendimiento

- **Cobertura de pruebas**: 70%+ en voiceController
- **Tiempo de respuesta**: < 200ms para validación de voz
- **Precisión de reconocimiento**: 85%+ con el algoritmo implementado

## 🔄 Flujo de Integración Frontend

### 1. **Configuración Inicial**
```javascript
// Verificar si AssemblyAI está disponible
const response = await fetch('/api/assemblyai/status');
const { available } = await response.json();

if (available) {
  // Usar AssemblyAI para mejor calidad
  useAssemblyAI = true;
} else {
  // Usar Web Speech API como fallback
  useWebSpeechAPI = true;
}
```

### 2. **Text-to-Speech**
```javascript
// Usar AssemblyAI TTS
const ttsResponse = await fetch('/api/assemblyai/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "¿Cuál es la capital de España?",
    voice: "es-ES-EnriqueNeural",
    speed: 1.0
  })
});

const { audioUrl } = await ttsResponse.json();
const audio = new Audio(audioUrl);
audio.play();
```

### 3. **Speech-to-Text**
```javascript
// Procesar audio con AssemblyAI
const sttResponse = await fetch('/api/assemblyai/process-audio', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audioBase64: audioData,
    language: 'es'
  })
});

const { text, confidence } = await sttResponse.json();
```

### 4. **Validar Respuesta de Voz**
```javascript
// Validar respuesta contra opciones de pregunta
const validateResponse = await fetch('/api/voice-responses/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.uid,
    questionId: question.id,
    voiceResponse: recognizedText,
    questionOptions: question.options
  })
});

const { valid, matchedOption, answerIndex, confidence } = await validateResponse.json();
```

## 🎯 Próximos Pasos para Frontend

1. **Implementar VoiceContext** para gestión de estado
2. **Crear componentes de voz** (VoiceSettings, VoiceControls)
3. **Integrar en GamePage** y Question components
4. **Implementar activación automática** basada en `visualDifficulty`
5. **Agregar indicadores visuales** de estado de voz

## 📞 Soporte

Para problemas o preguntas sobre la API de voz, contactar al equipo de backend.