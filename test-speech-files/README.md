# Test Speech Implementation Files

Este directorio contiene los archivos necesarios para implementar la funcionalidad de Text-to-Speech (TTS) y reconocimiento de voz en el proyecto.

## Estructura de archivos

```
test-speech-files/
├── frontend/
│   └── src/
│       ├── VoiceContext.jsx
│       └── services/
│           ├── voiceService.js
│           └── voiceRecognitionService.js
└── backend/
    ├── controllers/
    │   └── ttsController.js
    ├── services/
    │   └── azureTTSService.js
    └── routes/
        └── tts.js
```

## Dependencias necesarias

### Backend
```json
{
  "dependencies": {
    "microsoft-cognitiveservices-speech-sdk": "^1.31.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "axios": "^1.5.0"
  }
}
```

## Configuración

1. Configurar las variables de entorno en el backend:
   ```env
   AZURE_SPEECH_KEY=tu_clave_de_azure
   AZURE_SPEECH_REGION=tu_region_de_azure
   ```

2. Instalar dependencias:
   ```bash
   # En el backend
   cd backend
   npm install microsoft-cognitiveservices-speech-sdk express cors dotenv

   # En el frontend
   cd frontend
   npm install axios react
   ```

## Uso

1. En el frontend, envuelve tu aplicación con el VoiceProvider:
   ```jsx
   import { VoiceProvider } from './VoiceContext';

   function App() {
     return (
       <VoiceProvider>
         {/* Tu aplicación */}
       </VoiceProvider>
     );
   }
   ```

2. Usa el hook useVoice para acceder a la funcionalidad:
   ```jsx
   import { useVoice } from './VoiceContext';

   function MyComponent() {
     const { speak, isVoiceModeEnabled } = useVoice();

     const handleSpeak = () => {
       speak('Texto a convertir en voz');
     };

     return (
       <button onClick={handleSpeak}>
         Hablar
       </button>
     );
   }
   ```

3. Para el reconocimiento de voz:
   ```jsx
   import voiceRecognitionService from './services/voiceRecognitionService';

   // Iniciar reconocimiento
   await voiceRecognitionService.start();

   // Detener y obtener transcripción
   const result = await voiceRecognitionService.stop();
   console.log(result.transcript);
   ```

## Características

- Síntesis de voz usando Azure TTS
- Reconocimiento de voz con AssemblyAI
- Múltiples voces en diferentes idiomas
- Control de volumen y velocidad
- Registro de interacciones de voz
- Modo de voz automático para usuarios con dificultades visuales

## Notas importantes

1. Es necesario tener una cuenta de Azure con el servicio Cognitive Services habilitado.
2. Asegúrate de tener las claves de API correctamente configuradas.
3. El servicio de reconocimiento de voz requiere acceso al micrófono.
4. Las voces disponibles dependen de tu suscripción de Azure.