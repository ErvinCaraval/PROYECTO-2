# BrainBlitz - Plan de Implementación de Funcionalidades de Accesibilidad   

## 🚀 Inicio Rápido

### Dar permisos a los scripts
Primero, ejecuta este comando para hacer ejecutables todos los archivos `.sh`:
```bash
find . -name "*.sh" -exec chmod +x {} \;
```
**¿Qué hace?** Busca todos los archivos con extensión `.sh` en el proyecto y les da permisos de ejecución (`chmod +x`). Necesario para poder ejecutar los scripts.

### Comandos principales
```bash
# Desarrollo - Inicia todos los servicios en modo desarrollo
bash scripts/run-dev.sh

# Producción - Inicia los servicios usando imágenes de Docker Hub
bash scripts/run-prod.sh

# Limpiar - Elimina todos los contenedores, imágenes y volúmenes de Docker
bash scripts/cleanup-docker.sh

# Push - Sube todas las imágenes (backend, frontend, facial-service, redis) a Docker Hub
bash scripts/push-all-to-dockerhub.sh
```

---

## 📋 Resumen del Proyecto

Este documento describe el plan de implementación para agregar funcionalidades integrales de accesibilidad a BrainBlitz, un juego de trivia multijugador. El proyecto involucra 5 desarrolladores: 1 Desarrollador Backend y 4 Desarrolladores Frontend.

**Nota importante (arquitectura reciente)**: el almacenamiento de datos faciales (imágenes Base64 y embeddings) ya no se guarda en Firestore. Todas las operaciones relacionadas con registro, verificación y persistencia de embeddings se realizan en el microservicio `facial-service` que usa Redis como almacenamiento persistente. Firebase Auth sigue usándose solo para la gestión de cuentas y tokens.

### Estructura Actual del Proyecto
- **Backend**: Node.js + Express + Socket.io + Firebase (Firestore + Auth)
- **Frontend**: React + Vite + TailwindCSS + Firebase Auth
- **Base de Datos**: Firebase Firestore con colecciones: `users`, `games`, `questions`
- **Autenticación**: Firebase Auth con email/contraseña
- **Flujo de Juego**: Multijugador en tiempo real vía WebSockets

---

## 🎯 Objetivos del Proyecto 

Implementar funcionalidades de accesibilidad para permitir que usuarios con discapacidades visuales participen completamente en juegos de trivia multijugador a través de funcionalidades de modo de voz.

### Funcionalidades Clave a Implementar:
- Preferencia de dificultad visual durante el registro
- Activación automática del modo de voz
- Lectura de preguntas mediante Text-to-Speech
- Configuración de ajustes de voz
- Almacenamiento del historial de interacciones de voz
- Sistema de tutorial de audio
- Controles administrativos de accesibilidad
- Integración del modo de voz con el juego

---

## 👥 Estructura del Equipo y Responsabilidades

### Desarrollador Backend (1 persona)
**Responsabilidades Principales:**
- Modificaciones del esquema de base de datos
- Desarrollo de endpoints de API
- Registro de interacciones de voz
- Controles administrativos
- Análisis de datos y reportes

### Desarrolladores Frontend (4 personas) 
**Responsabilidades Principales:**
- Implementación de UI/UX
- Integración del modo de voz
- Funcionalidad de Text-to-Speech
- Componentes de interfaz de usuario
- Gestión de estado del lado del cliente

---

## 📊 Historias de Usuario (Formato CONESSA)

### US1: Registro de Preferencia de Dificultad Visual
**C (Contexto)**: Durante el registro de usuario, los nuevos jugadores necesitan indicar si tienen dificultades visuales para asegurar el soporte adecuado de accesibilidad.

**O (Objetivo)**: Permitir a los usuarios especificar sus necesidades de accesibilidad visual durante la creación de cuenta.

**N (Necesidad)**: Habilitar funcionalidades de accesibilidad personalizadas desde el momento del registro.

**E (Entidad)**: Formulario de registro de usuario y datos de perfil de usuario.

**S (Soporte)**: Campo backend `visualDifficulty` (boolean) en la colección de usuarios de Firebase, checkbox frontend en RegisterPage.jsx y CompleteProfilePage.jsx.

**S (Suposición)**: Los usuarios indicarán honestamente sus necesidades de accesibilidad, el esquema de Firebase puede ser extendido.

**A (Criterios de Aceptación)**:
- El formulario de registro incluye checkbox "Tengo dificultades visuales"
- El backend almacena `visualDifficulty: boolean` en el documento de usuario
- CompleteProfilePage también incluye esta opción para usuarios existentes
- El valor por defecto es `false` para usuarios que no lo seleccionen
- El campo es validado y almacenado en Firebase Firestore
- Probado en al menos 2 navegadores y dispositivos

---

### US2: Activación Automática del Modo de Voz
**C (Contexto)**: Los usuarios con dificultades visuales necesitan activación automática del modo de voz cuando inician sesión en la aplicación.

**O (Objetivo)**: Habilitar automáticamente el modo de voz para usuarios que indicaron dificultades visuales durante el registro.

**N (Necesidad)**: Proporcionar una experiencia de accesibilidad fluida sin configuración manual.

**E (Entidad)**: Flujo de autenticación de usuario y gestión de estado de la aplicación.

**S (Soporte)**: Modificación de AuthContext.jsx para verificar la preferencia `visualDifficulty` del usuario y activar el modo de voz automáticamente.

**S (Suposición)**: La preferencia del usuario se almacena correctamente en Firebase, existe el componente de modo de voz.

**A (Criterios de Aceptación)**:
- El modo de voz se activa automáticamente cuando un usuario con `visualDifficulty: true` inicia sesión
- El modo de voz persiste a través de la navegación de páginas
- El modo de voz puede ser deshabilitado manualmente si es necesario
- La activación ocurre antes de que se muestre cualquier contenido del juego
- Funciona consistentemente en todas las páginas de la aplicación
- Probado con usuarios que tienen y no tienen dificultades visuales

---

### US3: Lectura de Preguntas mediante Text-to-Speech
**C (Contexto)**: Durante el juego, los usuarios en modo de voz necesitan que las preguntas y opciones de respuesta sean leídas en voz alta mediante Text-to-Speech.

**O (Objetivo)**: Implementar funcionalidad TTS para leer preguntas y opciones durante los juegos.

**N (Necesidad)**: Habilitar acceso de audio al contenido del juego para usuarios con discapacidades visuales.

**E (Entidad)**: Componentes GamePage.jsx y Question.jsx, Web Speech API.

**S (Soporte)**: Implementación frontend usando Web Speech API (speechSynthesis), integración con el componente Question existente.

**S (Suposición)**: El navegador soporta Web Speech API, el modo de voz está correctamente activado.

**A (Criterios de Aceptación)**:
- Las preguntas se leen automáticamente cuando se muestran
- Todas las opciones de respuesta se leen en secuencia
- El TTS puede ser pausado/reanudado por el usuario
- La velocidad de lectura es ajustable
- Funciona tanto para preguntas manuales como generadas por IA
- La calidad del audio es clara y comprensible
- Probado en Chrome, Firefox y Safari

---

### US4: Configuración de Ajustes de Voz
**C (Contexto)**: Los usuarios necesitan personalizar los ajustes de voz (tipo de voz, velocidad, volumen) para una experiencia auditiva óptima.

**O (Objetivo)**: Proporcionar controles de personalización de voz para una experiencia de audio personalizada.

**N (Necesidad)**: Permitir a los usuarios ajustar parámetros TTS según sus preferencias.

**E (Entidad)**: Panel de ajustes de voz y configuración TTS.

**S (Soporte)**: Componente de ajustes de voz frontend con controles para selección de voz, velocidad (0.5x-2x), y volumen (0-100%).

**S (Suposición)**: Web Speech API soporta personalización de voz, los ajustes pueden ser persistidos.

**A (Criterios de Aceptación)**:
- El panel de ajustes de voz es accesible desde la navegación principal
- Los usuarios pueden seleccionar entre voces del sistema disponibles
- El ajuste de velocidad va de 0.5x a 2x la velocidad normal
- El control de volumen funciona independientemente del volumen del sistema
- Los ajustes se guardan en localStorage
- Los cambios se aplican inmediatamente al TTS en curso
- Los ajustes persisten a través de sesiones del navegador
- Probado con múltiples opciones de voz

---

### US5: Almacenamiento del Historial de Interacciones de Voz
**C (Contexto)**: Los usuarios necesitan rastrear sus interacciones en modo de voz para análisis y propósitos de mejora.

**O (Objetivo)**: Almacenar y gestionar el historial de interacciones de voz para sesiones de usuario.

**N (Necesidad)**: Habilitar el seguimiento de patrones de uso del modo de voz y preferencias de usuario.

**E (Entidad)**: Registros de interacciones de voz y datos de sesión de usuario.

**S (Soporte)**: Nueva colección backend `voiceInteractions` en Firebase, servicio de registro frontend para eventos de voz.

**S (Suposición)**: Firebase puede manejar colecciones adicionales, las regulaciones de privacidad permiten el registro de interacciones.

**A (Criterios de Aceptación)**:
- Las interacciones de voz se registran con timestamp
- Los registros incluyen: ID de pregunta, duración de lectura, interacciones del usuario
- El historial es accesible a los usuarios en su perfil
- Los datos se almacenan de forma segura en Firebase
- Los usuarios pueden ver sus estadísticas de uso del modo de voz
- El historial puede ser exportado o eliminado por el usuario
- Cumple con regulaciones de privacidad de datos
- Probado con múltiples sesiones de usuario

---

### US6: Sistema de Tutorial de Audio
**C (Contexto)**: Los nuevos usuarios con dificultades visuales necesitan un tutorial accesible que explique cómo usar la aplicación.

**O (Objetivo)**: Proporcionar tutorial de audio integral para usuarios en modo de voz.

**N (Necesidad)**: Asegurar que los usuarios con discapacidades visuales puedan aprender las funcionalidades de la aplicación a través de guía de audio.

**E (Entidad)**: Sistema de tutorial y entrega de contenido de audio.

**S (Soporte)**: Componente de tutorial de audio frontend con instrucciones pregrabadas o generadas por TTS, gestión de contenido de tutorial backend.

**S (Suposición)**: El contenido de audio puede ser creado y almacenado, el sistema de tutorial se integra con el onboarding existente.

**A (Criterios de Aceptación)**:
- El tutorial de audio cubre: registro, creación de juego, responder preguntas, ajustes de voz
- El tutorial se ofrece automáticamente a usuarios con dificultades visuales
- Los usuarios pueden repetir secciones del tutorial
- El tutorial puede ser omitido o pausado
- La calidad del audio es profesional y clara
- El tutorial se adapta a los ajustes de voz del usuario
- Disponible en múltiples idiomas
- Probado con usuarios con discapacidades visuales reales

---

### US7: Configuración Administrativa de Accesibilidad
**C (Contexto)**: Los administradores necesitan configurar ajustes de accesibilidad y monitorear el uso del modo de voz en toda la plataforma.

**O (Objetivo)**: Proporcionar controles administrativos para funcionalidades de accesibilidad y análisis de uso.

**N (Necesidad)**: Habilitar gestión y monitoreo de accesibilidad a nivel de plataforma.

**E (Entidad)**: Panel administrativo y sistema de configuración de accesibilidad.

**S (Soporte)**: Endpoints administrativos backend para ajustes de accesibilidad, extensión de AdminPage.jsx frontend con controles de accesibilidad.

**S (Suposición)**: Los usuarios administrativos tienen permisos adecuados, los datos de análisis están disponibles.

**A (Criterios de Aceptación)**:
- El panel administrativo incluye sección de ajustes de accesibilidad
- Los administradores pueden habilitar/deshabilitar el modo de voz globalmente
- Las estadísticas de uso muestran tasas de adopción del modo de voz
- Los administradores pueden configurar ajustes de voz por defecto
- El sistema puede generar reportes de uso de accesibilidad
- Los controles administrativos están adecuadamente protegidos
- Los cambios se aplican a todos los usuarios inmediatamente
- Probado con cuentas administrativas y de usuario regular

---

### US8: Integración del Modo de Voz con el Juego
**C (Contexto)**: El modo de voz debe integrarse perfectamente con el sistema de juego multijugador en tiempo real existente.

**O (Objetivo)**: Asegurar que el modo de voz funcione correctamente con el gameplay multijugador basado en WebSocket.

**N (Necesidad)**: Mantener la funcionalidad del juego mientras se proporciona accesibilidad de audio.

**E (Entidad)**: Flujo del juego, eventos WebSocket, y sincronización del modo de voz.

**S (Soporte)**: Modificación de GamePage.jsx frontend para manejar el modo de voz durante el gameplay en tiempo real, compatibilidad backend con eventos de modo de voz.

**S (Suposición)**: El sistema WebSocket puede manejar eventos de modo de voz, la lógica del juego permanece sin cambios.

**A (Criterios de Aceptación)**:
- El modo de voz funciona durante juegos multijugador en tiempo real
- Las preguntas se leen cuando se reciben vía WebSocket
- El modo de voz no interfiere con el tiempo del juego
- Todos los jugadores pueden participar independientemente del estado del modo de voz
- El modo de voz se sincroniza con cambios de estado del juego
- El rendimiento no se degrada por las funcionalidades de voz
- Funciona tanto con preguntas manuales como generadas por IA
- Probado con grupos mixtos (usuarios con y sin modo de voz)

### US9: Reconocimiento de Respuestas por Voz

**C (Contexto)**: Los usuarios en modo de voz necesitan responder a las preguntas del juego mediante comandos de voz en lugar de hacer clic en las opciones.

**O (Objetivo)**: Permitir que los usuarios respondan a las preguntas del juego usando reconocimiento de voz para una experiencia completamente hands-free.

**N (Necesidad)**: Habilitar participación completa de usuarios con discapacidades visuales que no pueden ver las opciones de respuesta en pantalla.

**E (Entidad)**: Sistema de reconocimiento de voz, respuestas de usuario, y validación de respuestas.

**S (Soporte)**: Implementación frontend con Web Speech API para reconocimiento de voz, backend para procesamiento y validación de respuestas habladas, integración con el sistema de juego existente.

**S (Suposición)**: El navegador soporta Web Speech API, los usuarios pueden hablar claramente, el sistema puede distinguir entre opciones de respuesta.

**A (Criterios de Aceptación)**:
- Los usuarios pueden responder diciendo "A", "B", "C", "D" o "primera opción", "segunda opción", etc.
- El sistema reconoce correctamente las respuestas de voz con al menos 90% de precisión
- Se proporciona feedback visual y auditivo cuando el sistema está escuchando
- El sistema confirma la respuesta reconocida antes de enviarla
- Los usuarios pueden repetir su respuesta si no fue reconocida correctamente
- El reconocimiento de voz funciona en tiempo real sin afectar el tiempo del juego
- Se registra el uso del reconocimiento de voz en el historial de interacciones
- Funciona en navegadores Chrome, Edge y Firefox
- Probado con diferentes acentos y niveles de ruido de fondo
- Integración completa con el sistema de puntuación y ranking existente

### 🔧 **Detalles Técnicos de Implementación - US9: Reconocimiento de Respuestas por Voz**

#### **Frontend (Web Speech API)**
```javascript
// Implementación en frontend-v2/src/services/voiceRecognition.js
class VoiceRecognitionService {
  constructor() {
    this.recognition = new webkitSpeechRecognition();
    this.recognition.lang = 'es-ES';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
  }

  async recognizeAnswer(questionOptions) {
    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const matchedOption = this.matchAnswer(transcript, questionOptions);
        resolve(matchedOption);
      };
      
      this.recognition.onerror = reject;
      this.recognition.start();
    });
  }

  matchAnswer(transcript, options) {
    // Buscar coincidencias directas: "A", "B", "C", "D"
    const directMatch = options.find(option => 
      transcript.includes(option.toLowerCase())
    );
    
    // Buscar coincidencias por posición: "primera", "segunda", etc.
    const positionMatch = this.matchByPosition(transcript, options);
    
    return directMatch || positionMatch || transcript;
  }
}
```

#### **Backend (Procesamiento y Validación)**
```javascript
// Implementación en backend-v1/controllers/voiceController.js
exports.validateVoiceResponse = async (req, res) => {
  const { userId, questionId, voiceResponse, questionOptions } = req.body;
  
  try {
    // Validar respuesta de voz contra opciones
    const validation = await validateResponse(voiceResponse, questionOptions);
    
    // Registrar interacción de voz
    await db.collection('voiceInteractions').add({
      userId,
      questionId,
      voiceResponse,
      validation,
      timestamp: new Date(),
      accuracy: validation.confidence
    });
    
    res.json({ 
      valid: validation.isValid, 
      matchedOption: validation.matchedOption,
      confidence: validation.confidence 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

#### **Integración con WebSocket**
```javascript
// Eventos WebSocket para respuestas de voz
socket.on('voice-answer', async (data) => {
  const { userId, questionId, voiceResponse } = data;
  
  // Procesar respuesta de voz
  const validation = await voiceController.validateVoiceResponse({
    userId, questionId, voiceResponse
  });
  
  // Enviar resultado a todos los jugadores
  socket.broadcast.emit('voice-answer-result', {
    userId, validation, timestamp: new Date()
  });
});
```

#### **Esquema de Base de Datos**
```javascript
// Colección: voiceInteractions
{
  userId: "string",
  questionId: "string", 
  voiceResponse: "string",
  matchedOption: "string",
  confidence: "number",
  timestamp: "Date",
  gameId: "string",
  sessionId: "string"
}
```

---

## 📋 Backlog del Producto

| ID | Historia de Usuario | Prioridad | Estimación | Responsable | Ubicación de Implementación | Notas |
|-----|------------|----------|------------|---------------------|--------------------------|-------|
| US1 | Registro de preferencia de accesibilidad | Alta | 3SP | Desarrollador Backend | Backend | Agregar campo boolean `visualDifficulty` a la colección de usuarios de Firebase |
| US2 | Activación automática del modo de voz | Alta | 5SP | Desarrollador Frontend | Frontend | Modificar AuthContext.jsx para verificar preferencia del usuario y activar modo de voz |
| US3 | Lectura de preguntas mediante Text-to-Speech | Alta | 8SP | Desarrollador Frontend | Frontend | Implementar integración Web Speech API en Question.jsx y GamePage.jsx |
| US4 | Configuración de ajustes de voz | Media | 5SP | Desarrollador Frontend | Frontend | Crear componente de ajustes de voz con controles de voz, velocidad, volumen |
| US5 | Almacenamiento del historial de interacciones de voz | Media | 6SP | Desarrollador Backend | Backend | Nueva colección Firebase `voiceInteractions` para registrar eventos de voz del usuario |
| US6 | Sistema de tutorial de audio | Media | 7SP | Desarrollador Frontend | Frontend | Crear componente de tutorial de audio con instrucciones generadas por TTS |
| US7 | Configuración administrativa de accesibilidad | Baja | 4SP | Desarrollador Backend | Backend | Extender AdminPage.jsx con controles de accesibilidad y análisis |
| US8 | Integración del modo de voz con el juego | Alta | 6SP | Desarrollador Frontend | Frontend | Asegurar que el modo de voz funcione con el sistema multijugador WebSocket |
| US9 | Reconocimiento de respuestas por voz | Alta | 10SP | Desarrollador Frontend + Backend | Frontend + Backend | Web Speech API frontend + procesamiento y validación backend |

---

## 🗓️ Plan de Lanzamiento Reorganizado (7-21 de Octubre, 2024)

### Objetivo del Lanzamiento
Implementar funcionalidades integrales de accesibilidad para BrainBlitz, permitiendo que usuarios con discapacidades visuales participen completamente en juegos de trivia multijugador a través de funcionalidades de modo de voz.

### **🎯 Estrategia de Desarrollo: Backend Primero**
**Filosofía**: El backend debe estar completamente terminado antes de que el frontend comience a trabajar. Esto asegura que todas las APIs y funcionalidades estén listas cuando los desarrolladores frontend las necesiten.

### Planificación de Sprints Reorganizada

#### **Sprint Backend (7-15 de Octubre): Infraestructura Completa**
**Objetivo**: Completar TODAS las funcionalidades de backend antes de que el frontend comience.

**Historias de Usuario Backend Asignadas**:
- US1: Registro de preferencia de accesibilidad (3SP) - **BACKEND COMPLETO**
- US5: Almacenamiento del historial de interacciones de voz (6SP) - **BACKEND COMPLETO**
- US7: Configuración administrativa de accesibilidad (4SP) - **BACKEND COMPLETO**
- US8: Integración del modo de voz con el juego (6SP) - **BACKEND COMPLETO**
- US9: Procesamiento y validación de respuestas por voz (4SP) - **BACKEND COMPLETO**

**Total de Story Points Backend**: 23SP

#### **Sprint Frontend (16-21 de Octubre): Implementación de UI/UX**
**Objetivo**: Implementar todas las funcionalidades frontend usando las APIs del backend ya terminadas.

**Historias de Usuario Frontend Asignadas**:
- US1: Integración frontend de preferencia de accesibilidad (2SP)
- US2: Activación automática del modo de voz (5SP)
- US3: Lectura de preguntas mediante Text-to-Speech (8SP)
- US4: Configuración de ajustes de voz (5SP)
- US5: Integración frontend del historial de voz (3SP)
- US6: Sistema de tutorial de audio (7SP)
- US7: Panel administrativo frontend (2SP)
- US8: Integración frontend del modo de voz (3SP)
- US9: Reconocimiento de voz con Web Speech API (6SP) - **FRONTEND COMPLETO**

**Total de Story Points Frontend**: 41SP

---

## 🎯 **RESPONSABILIDADES DEL DESARROLLADOR BACKEND (TU)**

### **📋 Cronograma de Trabajo Backend (7-15 de Octubre)**

#### **Día 1 (7 de Octubre): US1 - Registro de Preferencia de Accesibilidad**
**Tareas Críticas:**
- [ ] **Modificar esquema Firebase**: Agregar campo `visualDifficulty: boolean` a colección `users`
- [ ] **Actualizar endpoint**: `POST /api/users/register` para aceptar `visualDifficulty`
- [ ] **Validación**: Implementar validación del campo (boolean, opcional, default: false)
- [ ] **Pruebas**: Crear pruebas unitarias para el nuevo campo
- [ ] **Documentación**: Actualizar Swagger con el nuevo parámetro

**Entregables del Día:**
- ✅ Campo `visualDifficulty` funcionando en Firebase
- ✅ Endpoint de registro actualizado y probado
- ✅ Documentación Swagger actualizada

#### **Día 2 (8 de Octubre): US1 + US5 + US9 - Validación y Diseño de Historial y Voz**
**Tareas Críticas:**
- [ ] **Completar US1**: Pruebas de integración, manejo de errores
- [ ] **Diseñar US5**: Crear esquema para colección `voiceInteractions`
- [ ] **Diseñar US9**: Crear esquema para procesamiento de respuestas por voz
- [ ] **Esquema Firebase**: Definir estructura completa de datos de voz
- [ ] **Seguridad**: Implementar autenticación para endpoints de voz
- [ ] **Validación de Voz**: Diseñar sistema de validación de respuestas habladas

**Entregables del Día:**
- ✅ US1 completamente terminado
- ✅ Esquema `voiceInteractions` diseñado y documentado
- ✅ Sistema de autenticación implementado

#### **Día 3 (9 de Octubre): US5 + US9 - Endpoints de Historial de Voz y Procesamiento**
**Tareas Críticas:**
- [ ] **Crear colección**: Implementar `voiceInteractions` en Firebase
- [ ] **Endpoint POST**: `POST /api/voice-interactions` para registrar interacciones
- [ ] **Endpoint GET**: `GET /api/voice-interactions/:userId` para obtener historial
- [ ] **Endpoint DELETE**: `DELETE /api/voice-interactions/:userId` para limpiar datos
- [ ] **Endpoint STATS**: `GET /api/voice-interactions/stats/:userId` para estadísticas
- [ ] **Endpoint Voice Processing**: `POST /api/voice-responses/validate` para validar respuestas habladas
- [ ] **Endpoint Voice Recognition**: `POST /api/voice-responses/process` para procesar respuestas de voz

**Entregables del Día:**
- ✅ Todos los endpoints de `voiceInteractions` funcionando
- ✅ Sistema de logging de interacciones de voz operativo
- ✅ Endpoints probados y documentados

#### **Día 4 (10 de Octubre): US7 + US9 - Controles Administrativos y Validación de Voz**
**Tareas Críticas:**
- [ ] **Endpoint Admin Stats**: `GET /api/admin/accessibility-stats` para estadísticas globales
- [ ] **Endpoint Admin Settings**: `PUT /api/admin/accessibility-settings` para configuración global
- [ ] **Endpoint Admin Users**: `GET /api/admin/voice-mode-users` para lista de usuarios
- [ ] **Sistema de Análisis**: Implementar métricas de adopción del modo de voz
- [ ] **Reportes**: Crear sistema de generación de reportes de accesibilidad
- [ ] **Validación de Voz**: Implementar algoritmo de validación de respuestas habladas
- [ ] **Procesamiento de Voz**: Crear sistema de procesamiento de respuestas de voz

**Entregables del Día:**
- ✅ Todos los endpoints administrativos funcionando
- ✅ Sistema de análisis y métricas implementado
- ✅ Generación de reportes operativa

#### **Día 5 (11 de Octubre): US8 + US9 - Compatibilidad WebSocket y Integración de Voz**
**Tareas Críticas:**
- [ ] **Análisis WebSocket**: Revisar eventos existentes para compatibilidad con modo de voz
- [ ] **Optimización**: Asegurar que WebSocket no se degrade con modo de voz
- [ ] **Pruebas**: Probar WebSocket con modo de voz habilitado
- [ ] **Rendimiento**: Optimizar transferencia de datos para juegos con voz
- [ ] **Documentación**: Documentar cambios en WebSocket
- [ ] **Integración de Voz**: Integrar sistema de reconocimiento de voz con WebSocket
- [ ] **Eventos de Voz**: Crear eventos WebSocket para respuestas de voz

**Entregables del Día:**
- ✅ WebSocket compatible con modo de voz
- ✅ Rendimiento optimizado para juegos con voz
- ✅ Documentación de cambios WebSocket

#### **Día 6 (12 de Octubre): Pruebas y Optimización**
**Tareas Críticas:**
- [ ] **Pruebas de Integración**: Ejecutar todas las pruebas de integración
- [ ] **Pruebas de Rendimiento**: Optimizar rendimiento de todos los endpoints
- [ ] **Pruebas de Seguridad**: Verificar seguridad de todos los endpoints
- [ ] **Documentación**: Completar documentación Swagger
- [ ] **Refactoring**: Mejorar código si es necesario

**Entregables del Día:**
- ✅ Todas las pruebas de integración pasando
- ✅ Rendimiento optimizado
- ✅ Documentación Swagger completa

#### **Día 7 (13 de Octubre): Documentación y Guías**
**Tareas Críticas:**
- [ ] **Guías de Integración**: Crear guías detalladas para frontend
- [ ] **Ejemplos de API**: Crear ejemplos de uso para cada endpoint
- [ ] **Documentación Técnica**: Completar documentación técnica
- [ ] **Testing**: Pruebas adicionales si es necesario
- [ ] **Code Review**: Revisar todo el código backend

**Entregables del Día:**
- ✅ Guías de integración completas
- ✅ Ejemplos de API documentados
- ✅ Documentación técnica finalizada

#### **Día 8 (14 de Octubre): Preparación Final**
**Tareas Críticas:**
- [ ] **Despliegue**: Preparar backend para integración frontend
- [ ] **Monitoreo**: Configurar monitoreo y logging
- [ ] **Backup**: Crear backup de configuración
- [ ] **Validación Final**: Validar que todo funciona correctamente
- [ ] **Entrega**: Preparar entrega para equipo frontend

**Entregables del Día:**
- ✅ Backend desplegado y listo
- ✅ Monitoreo configurado
- ✅ Sistema de backup implementado

#### **Día 9 (15 de Octubre): BACKEND COMPLETO**
**Tareas Críticas:**
- [ ] **Validación Final**: Ejecutar todas las pruebas una vez más
- [ ] **Entrega**: Confirmar que TODAS las APIs están listas
- [ ] **Presentación**: Preparar presentación para equipo frontend
- [ ] **Handover**: Entregar documentación y APIs al equipo frontend
- [ ] **Celebración**: ¡Backend completado! 🎉

**Entregables del Día:**
- ✅ **BACKEND 100% COMPLETO**
- ✅ Todas las APIs probadas y documentadas
- ✅ Frontend puede comenzar a trabajar el día 16

### **🔑 APIs que Debes Entregar Completas:**

#### **US1 - Registro de Accesibilidad:**
```javascript
POST /api/users/register
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "displayName": "Usuario",
  "visualDifficulty": true  // ← NUEVO CAMPO
}

PUT /api/users/profile
{
  "visualDifficulty": false  // ← ACTUALIZAR PREFERENCIA
}
```

#### **US5 - Historial de Interacciones de Voz:**
```javascript
POST /api/voice-interactions
{
  "questionId": "q123",
  "action": "question_read",
  "duration": 5000,
  "metadata": {...}
}

GET /api/voice-interactions/:userId
GET /api/voice-interactions/stats/:userId
DELETE /api/voice-interactions/:userId
```

#### **US7 - Controles Administrativos:**
```javascript
GET /api/admin/accessibility-stats
PUT /api/admin/accessibility-settings
GET /api/admin/voice-mode-users
```

### **📊 Métricas de Éxito Backend:**
- ✅ **100% de endpoints funcionando** antes del 16 de octubre
- ✅ **Documentación Swagger completa** para todos los endpoints
- ✅ **Pruebas unitarias** con cobertura >90%
- ✅ **Pruebas de integración** pasando
- ✅ **Rendimiento WebSocket** sin degradación
- ✅ **Seguridad** implementada en todos los endpoints

---

## 🔧 Guías de Desarrollo

### Responsabilidades del Desarrollador Backend

#### Tareas del Sprint 1 (7-13 de Octubre)

**US1: Registro de preferencia de accesibilidad (3SP)**
- [ ] **Actualización del Esquema de Base de Datos**
  - Modificar la colección de usuarios de Firebase para incluir campo `visualDifficulty: boolean`
  - Actualizar endpoint de registro de usuario para aceptar y almacenar preferencia de accesibilidad
  - Asegurar compatibilidad hacia atrás con usuarios existentes (por defecto: `false`)
  - Agregar validación para el nuevo campo

- [ ] **Desarrollo de Endpoints de API**
  - Actualizar `POST /api/users/register` para manejar parámetro `visualDifficulty`
  - Actualizar `PUT /api/users/profile` para permitir actualizar preferencia de accesibilidad
  - Agregar manejo adecuado de errores y validación

- [ ] **Pruebas**
  - Pruebas unitarias para registro de usuario con preferencia de accesibilidad
  - Pruebas de integración para endpoints de API
  - Pruebas de migración de base de datos

**US8: Integración del modo de voz con el juego (6SP)**
- [ ] **Compatibilidad WebSocket**
  - Asegurar que los eventos WebSocket existentes funcionen con el modo de voz
  - Agregar estado del modo de voz al estado del juego si es necesario
  - Probar funcionalidad en tiempo real con modo de voz habilitado

- [ ] **Optimización de Rendimiento**
  - Monitorear rendimiento WebSocket con modo de voz
  - Optimizar transferencia de datos para juegos habilitados para voz
  - Asegurar que no haya degradación en el rendimiento multijugador

#### Tareas del Sprint 2 (14-21 de Octubre)

**US5: Almacenamiento del historial de interacciones de voz (6SP)**
- [ ] **Diseño de Base de Datos**
  - Crear nueva colección Firebase `voiceInteractions`
  - Diseñar esquema para registros de interacciones de voz:
    ```javascript
    {
      userId: string,
      sessionId: string,
      questionId: string,
      action: string, // 'question_read', 'option_read', 'settings_changed'
      timestamp: number,
      duration: number, // en milisegundos
      metadata: object // contexto adicional
    }
    ```

- [ ] **Endpoints de API**
  - `POST /api/voice-interactions` - Registrar interacción de voz
  - `GET /api/voice-interactions/:userId` - Obtener historial de voz del usuario
  - `DELETE /api/voice-interactions/:userId` - Limpiar historial de voz del usuario
  - `GET /api/voice-interactions/stats/:userId` - Obtener estadísticas de uso de voz

- [ ] **Privacidad y Seguridad de Datos**
  - Implementar autenticación adecuada para endpoints de interacciones de voz
  - Agregar políticas de retención de datos
  - Asegurar cumplimiento GDPR para datos de interacciones de voz

**US7: Configuración administrativa de accesibilidad (4SP)**
- [ ] **Endpoints de API Administrativos**
  - `GET /api/admin/accessibility-stats` - Obtener estadísticas de accesibilidad a nivel de plataforma
  - `PUT /api/admin/accessibility-settings` - Actualizar ajustes de accesibilidad globales
  - `GET /api/admin/voice-mode-users` - Obtener lista de usuarios usando modo de voz

- [ ] **Análisis y Reportes**
  - Implementar análisis de uso del modo de voz
  - Crear reportes de adopción de accesibilidad
  - Agregar monitoreo para rendimiento del modo de voz

- [ ] **Integración del Panel Administrativo**
  - Extender AdminPage.jsx existente con controles de accesibilidad
  - Agregar dashboard de estadísticas de accesibilidad
  - Implementar controles administrativos para ajustes de modo de voz

**US9: Procesamiento y validación de respuestas por voz (4SP)**
- [ ] **Crear controlador de voz**
  - Implementar `voiceController.js` para procesamiento de respuestas de voz
  - Crear algoritmo de validación de respuestas habladas
  - Implementar sistema de coincidencia de respuestas con opciones
- [ ] **Endpoints de procesamiento de voz**
  - `POST /api/voice-responses/validate` - Validar respuesta de voz
  - `POST /api/voice-responses/process` - Procesar respuesta de voz
  - `GET /api/voice-responses/stats/:userId` - Estadísticas de reconocimiento
- [ ] **Integración con WebSocket**
  - Crear eventos WebSocket para respuestas de voz
  - Implementar sincronización de respuestas de voz en tiempo real
  - Asegurar compatibilidad con sistema de juego existente
- [ ] **Sistema de logging y análisis**
  - Registrar todas las interacciones de reconocimiento de voz
  - Implementar métricas de precisión del reconocimiento
  - Crear reportes de uso del reconocimiento de voz

### Responsabilidades de los Desarrolladores Frontend (4 personas)

#### Tareas del Sprint 1 (7-13 de Octubre)

**US1: Registro de preferencia de accesibilidad (3SP)**
- [ ] **Actualizaciones del Formulario de Registro**
  - Agregar checkbox de accesibilidad a `RegisterPage.jsx`
  - Agregar opción de accesibilidad a `CompleteProfilePage.jsx`
  - Implementar validación de formulario para preferencia de accesibilidad
  - Agregar etiquetas de accesibilidad y estilos adecuados

**US2: Activación automática del modo de voz (5SP)**
- [ ] **Modificación de AuthContext**
  - Modificar `AuthContext.jsx` para verificar preferencia `visualDifficulty` del usuario
  - Implementar lógica de activación automática del modo de voz
  - Agregar gestión de estado del modo de voz en toda la aplicación
  - Asegurar que el modo de voz persista a través de la navegación de páginas

- [ ] **Gestión de Estado del Modo de Voz**
  - Crear contexto/proveedor del modo de voz
  - Implementar funcionalidad de alternancia del modo de voz
  - Agregar indicadores del modo de voz en la UI

**US3: Lectura de preguntas mediante Text-to-Speech (8SP)**
- [ ] **Integración de Web Speech API**
  - Investigar e implementar Web Speech API (`speechSynthesis`)
  - Crear funciones de servicio/utilidad TTS
  - Implementar síntesis de voz para preguntas y opciones

- [ ] **Actualizaciones del Componente Question**
  - Modificar `Question.jsx` para soportar TTS
  - Agregar controles TTS (reproducir, pausar, detener)
  - Implementar lectura automática de preguntas cuando se muestran

- [ ] **Integración de GamePage**
  - Actualizar `GamePage.jsx` para manejar TTS durante el juego
  - Asegurar que TTS funcione con eventos WebSocket en tiempo real
  - Agregar controles TTS a la interfaz del juego

**US8: Integración del modo de voz con el juego (6SP)**
- [ ] **Integración WebSocket**
  - Asegurar que el modo de voz funcione con eventos WebSocket existentes
  - Probar modo de voz con juegos multijugador
  - Manejar sincronización del modo de voz entre jugadores

- [ ] **Pruebas de Rendimiento**
  - Probar rendimiento del modo de voz durante juegos multijugador
  - Asegurar que no interfiera con el tiempo del juego
  - Optimizar modo de voz para gameplay en tiempo real

**US9: Reconocimiento de respuestas por voz (6SP)**
- [ ] **Implementación de Web Speech API**
  - Crear servicio `VoiceRecognitionService.js` con Web Speech API
  - Implementar reconocimiento de respuestas "A", "B", "C", "D"
  - Implementar reconocimiento de respuestas por posición ("primera opción", "segunda opción")
  - Agregar manejo de errores y fallbacks
- [ ] **Integración con Componente Question**
  - Modificar `Question.jsx` para incluir botón de reconocimiento de voz
  - Implementar feedback visual cuando el sistema está escuchando
  - Agregar confirmación de respuesta reconocida
  - Implementar opción de repetir respuesta si no fue reconocida
- [ ] **Integración con GamePage**
  - Modificar `GamePage.jsx` para manejar respuestas de voz
  - Integrar reconocimiento de voz con el sistema de tiempo del juego
  - Asegurar que las respuestas de voz se envíen correctamente vía WebSocket
  - Implementar manejo de estados de reconocimiento de voz
- [ ] **Configuración y Ajustes**
  - Agregar configuración de reconocimiento de voz en ajustes de usuario
  - Implementar persistencia de preferencias de reconocimiento de voz
  - Agregar opciones de idioma y acento para reconocimiento
  - Implementar calibración de sensibilidad de reconocimiento

#### Tareas del Sprint 2 (14-21 de Octubre)

**US4: Configuración de ajustes de voz (5SP)**
- [ ] **Componente de Ajustes de Voz**
  - Crear componente `VoiceSettings.jsx`
  - Implementar dropdown de selección de voz
  - Agregar control deslizante de velocidad (0.5x - 2x)
  - Agregar control deslizante de volumen (0-100%)

- [ ] **Persistencia de Ajustes**
  - Implementar localStorage para ajustes de voz
  - Agregar sincronización de ajustes a través de sesiones del navegador
  - Crear funcionalidad de importar/exportar ajustes

- [ ] **Integración de UI**
  - Agregar ajustes de voz a la navegación principal
  - Crear modal/página de ajustes
  - Implementar vista previa de ajustes en tiempo real

**US5: Almacenamiento del historial de interacciones de voz (6SP)**
- [ ] **Servicio de Registro Frontend**
  - Crear servicio de registro de interacciones de voz
  - Implementar registro automático de eventos de voz
  - Agregar disparadores de registro manual

- [ ] **Visualización del Historial**
  - Crear componente de historial de voz
  - Agregar visualización de estadísticas de uso de voz
  - Implementar filtrado y búsqueda del historial

- [ ] **Gestión de Datos**
  - Agregar funcionalidad de exportación para historial de voz
  - Implementar opciones de eliminación del historial
  - Agregar controles de privacidad para datos de voz

**US6: Sistema de tutorial de audio (7SP)**
- [ ] **Componente de Tutorial**
  - Crear componente `AudioTutorial.jsx`
  - Implementar navegación del tutorial (reproducir, pausar, omitir, repetir)
  - Agregar seguimiento del progreso del tutorial

- [ ] **Creación de Contenido**
  - Crear contenido de tutorial para cada funcionalidad de la aplicación
  - Implementar instrucciones de tutorial generadas por TTS
  - Agregar optimización de calidad de audio

- [ ] **Integración**
  - Agregar tutorial al flujo de onboarding
  - Implementar oferta automática de tutorial para usuarios en modo de voz
  - Agregar controles de accesibilidad del tutorial

**US7: Configuración administrativa de accesibilidad (4SP)**
- [ ] **Extensión del Panel Administrativo**
  - Extender `AdminPage.jsx` con controles de accesibilidad
  - Agregar dashboard de estadísticas de accesibilidad
  - Implementar controles administrativos para ajustes de modo de voz

- [ ] **Visualización de Análisis**
  - Crear gráficos de uso de accesibilidad
  - Agregar métricas de adopción del modo de voz
  - Implementar estadísticas de accesibilidad en tiempo real

---

## 📅 Calendario Detallado de Desarrollo Reorganizado

### **FASE 1: Sprint Backend (7-15 de Octubre) - INFRAESTRUCTURA COMPLETA**

| Fecha | Tarea/US | Responsable | Entregables Backend |
|------|---------|-------------|--------------|
| **Oct 7** | US1: Esquema de base de datos | **Desarrollador Backend** | ✅ Colección Firebase `users` con campo `visualDifficulty: boolean` |
| **Oct 7** | US1: Endpoints de API | **Desarrollador Backend** | ✅ `POST /api/users/register` actualizado con `visualDifficulty` |
| **Oct 8** | US1: Validación y pruebas | **Desarrollador Backend** | ✅ Validación de campo, pruebas unitarias, documentación Swagger |
| **Oct 8** | US5: Diseño de colección | **Desarrollador Backend** | ✅ Colección Firebase `voiceInteractions` con esquema completo |
| **Oct 9** | US5: Endpoints de API | **Desarrollador Backend** | ✅ `POST/GET/DELETE /api/voice-interactions/*` endpoints |
| **Oct 9** | US5: Seguridad y privacidad | **Desarrollador Backend** | ✅ Autenticación, políticas GDPR, retención de datos |
| **Oct 10** | US7: Endpoints administrativos | **Desarrollador Backend** | ✅ `GET/PUT /api/admin/accessibility-*` endpoints |
| **Oct 10** | US7: Análisis y reportes | **Desarrollador Backend** | ✅ Sistema de análisis de uso, métricas de adopción |
| **Oct 11** | US8: Compatibilidad WebSocket | **Desarrollador Backend** | ✅ WebSocket compatible con modo de voz, sin degradación |
| **Oct 11** | US8: Optimización de rendimiento | **Desarrollador Backend** | ✅ Optimización para juegos con modo de voz |
| **Oct 12** | Pruebas y optimización | **Desarrollador Backend** | ✅ Pruebas de integración, rendimiento y seguridad |
| **Oct 13** | Documentación y guías | **Desarrollador Backend** | ✅ Guías de integración y ejemplos de API |
| **Oct 14** | Preparación final | **Desarrollador Backend** | ✅ Despliegue, monitoreo y backup |
| **Oct 15** | **BACKEND COMPLETO** | **Desarrollador Backend** | ✅ **TODAS las APIs listas para frontend** |

### **FASE 2: Sprint Frontend (16-21 de Octubre) - IMPLEMENTACIÓN UI/UX**

| Fecha | Tarea/US | Responsable | Entregables Frontend |
|------|---------|-------------|--------------|
| **Oct 16** | US1: Integración frontend | **Desarrolladores Frontend** | ✅ RegisterPage.jsx y CompleteProfilePage.jsx con checkbox |
| **Oct 16** | US2: AuthContext y estado | **Desarrolladores Frontend** | ✅ AuthContext.jsx con activación automática de modo de voz |
| **Oct 17** | US3: Web Speech API | **Desarrolladores Frontend** | ✅ Servicio VoiceService.js con TTS básico |
| **Oct 17** | US3: Componente Question | **Desarrolladores Frontend** | ✅ Question.jsx con funcionalidad TTS integrada |
| **Oct 18** | US3: GamePage TTS | **Desarrolladores Frontend** | ✅ GamePage.jsx con lectura automática de preguntas |
| **Oct 18** | US4: Ajustes de voz | **Desarrolladores Frontend** | ✅ Componente VoiceSettings.jsx con controles |
| **Oct 19** | US4: Persistencia | **Desarrolladores Frontend** | ✅ localStorage para preferencias de voz |
| **Oct 19** | US5: Historial frontend | **Desarrolladores Frontend** | ✅ Componente de historial usando APIs del backend |
| **Oct 20** | US6: Tutorial de audio | **Desarrolladores Frontend** | ✅ AudioTutorial.jsx con contenido TTS |
| **Oct 20** | US7: Panel administrativo | **Desarrolladores Frontend** | ✅ AdminPage.jsx con controles de accesibilidad |
| **Oct 21** | US8: Integración completa | **Desarrolladores Frontend** | ✅ Modo de voz integrado con WebSocket |
| **Oct 21** | **LANZAMIENTO** | **Todo el Equipo** | ✅ **Despliegue en producción**

---

## 🎯 Entregables por Fase

### **FASE 1: Entregables Backend (7-15 de Octubre)**
- ✅ **US1**: Campo `visualDifficulty` en colección Firebase `users`
- ✅ **US1**: Endpoint `POST /api/users/register` actualizado
- ✅ **US1**: Endpoint `PUT /api/users/profile` para actualizar preferencias
- ✅ **US5**: Colección Firebase `voiceInteractions` completa
- ✅ **US5**: Endpoints `POST/GET/DELETE /api/voice-interactions/*`
- ✅ **US5**: Sistema de seguridad y privacidad GDPR
- ✅ **US7**: Endpoints administrativos `/api/admin/accessibility-*`
- ✅ **US7**: Sistema de análisis y métricas de adopción
- ✅ **US8**: WebSocket compatible con modo de voz
- ✅ **US8**: Optimización de rendimiento para juegos con voz
- ✅ **Documentación**: Swagger actualizado, guías de integración
- ✅ **Pruebas**: Cobertura >90%, pruebas de integración
- ✅ **Despliegue**: Backend listo para producción

### **FASE 2: Entregables Frontend (16-21 de Octubre)**
- ✅ **US1**: Integración frontend con APIs del backend
- ✅ **US2**: Activación automática del modo de voz
- ✅ **US3**: Lectura de preguntas mediante Text-to-Speech
- ✅ **US4**: Configuración de ajustes de voz
- ✅ **US5**: Interfaz de historial de interacciones de voz
- ✅ **US6**: Sistema de tutorial de audio
- ✅ **US7**: Panel administrativo frontend
- ✅ **US8**: Integración completa del modo de voz
- ✅ **Lanzamiento**: Despliegue en producción

---

## ⚠️ Mitigación de Riesgos

### Riesgos Técnicos:
- **Compatibilidad del navegador con Web Speech API**: Implementar respaldo a soluciones TTS alternativas
- **Impacto del rendimiento del modo de voz**: Usar técnicas de carga diferida y optimización
- **Interferencia WebSocket**: Pruebas extensivas con grupos de usuarios mixtos

### Riesgos de Desarrollo:
- **Coordinación del equipo**: Standups diarios y canales de comunicación claros
- **Problemas de integración**: Integración continua y pruebas
- **Presión de tiempo**: Tiempo de buffer incorporado en cada sprint

---

## 🧪 Estrategia de Pruebas

### Pruebas Backend:
- Pruebas unitarias para todos los nuevos endpoints de API
- Pruebas de integración para operaciones de base de datos
- Pruebas de rendimiento para registro de interacciones de voz
- Pruebas de seguridad para endpoints administrativos

### Pruebas Frontend:
- Pruebas de componentes para funcionalidades del modo de voz
- Pruebas de extremo a extremo para flujos de usuario completos
- Pruebas de compatibilidad entre navegadores
- Pruebas de cumplimiento de accesibilidad (WCAG 2.1)

### Pruebas de Aceptación de Usuario:
- Pruebas con usuarios con discapacidades visuales reales
- Pruebas de rendimiento con grupos de usuarios mixtos
- Pruebas de usabilidad para funcionalidades del modo de voz

---

## 📚 Documentación Técnica

### Documentación de API Backend:
- Actualizar documentación Swagger con nuevos endpoints
- Documentar modelos de datos de interacciones de voz
- Crear documentación de API administrativa

### Documentación Frontend:
- Documentar implementación del modo de voz
- Crear guía de integración TTS
- Documentar configuración de ajustes de voz

### Documentación de Despliegue:
- Procedimientos de despliegue en producción
- Configuración de entorno
- Configuración de monitoreo y registro

---

## 🚀 Comenzar

### Prerrequisitos:
- Node.js >= 18
- Proyecto Firebase con Firestore habilitado
- Navegador compatible con Web Speech API
- Git para control de versiones

### Instrucciones de Configuración:
1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Configurar credenciales de Firebase
4. Configurar variables de entorno
5. Ejecutar servidores de desarrollo

### Flujo de Trabajo de Desarrollo:
1. Crear ramas de funcionalidad para cada historia de usuario
2. Implementar funcionalidades según criterios de aceptación
3. Escribir pruebas para toda la nueva funcionalidad
4. Enviar pull requests para revisión de código
5. Desplegar a staging para pruebas
6. Desplegar a producción después de aprobación

---

## 📞 Comunicación y Colaboración

### Standups Diarios:
- Actualizaciones de progreso en tareas asignadas
- Discusión de bloqueos e impedimentos
- Coordinación entre equipos backend y frontend

### Proceso de Revisión de Código:
- Todos los cambios de código requieren revisión por pares
- Cambios backend revisados por equipo backend
- Cambios frontend revisados por equipo frontend
- Revisión entre equipos para puntos de integración

### Actualizaciones de Documentación:
- Mantener README.md actualizado con progreso
- Documentar cualquier cambio en API o esquema de base de datos
- Actualizar historias de usuario con estado de finalización

---

## 📈 Métricas de Éxito

### Métricas Técnicas:
- Tasa de activación del modo de voz
- Métricas de rendimiento TTS
- Precisión del registro de interacciones de voz
- Rendimiento del sistema con modo de voz habilitado

### Métricas de Experiencia de Usuario:
- Satisfacción del usuario con el modo de voz
- Puntuación de cumplimiento de accesibilidad
- Tasa de finalización del tutorial
- Patrones de uso de ajustes de voz

### Métricas de Negocio:
- Mayor participación del usuario
- Adopción de funcionalidades de accesibilidad
- Mejora en retención de usuarios
- Puntuación de inclusividad de la plataforma

---

## 🎤 APIs de Text-to-Speech (TTS) Recomendadas

### **Recomendación Principal: Web Speech API + Google Cloud TTS Fallback**

#### **¿Por qué esta combinación?**

1. **Web Speech API (Principal) - 100% Gratuita**
   - ✅ **Cero costos** - No requiere API key
   - ✅ **Implementación inmediata** - Funciona en 5 minutos
   - ✅ **Perfecta para MVP** - Suficiente para demostrar funcionalidad
   - ✅ **Offline** - Funciona sin internet
   - ✅ **Múltiples voces** - Varias opciones de voz disponibles

2. **Google Cloud TTS (Fallback) - 1M caracteres gratis/mes**
   - ✅ **Excelente calidad** - Voces neurales avanzadas
   - ✅ **1 millón de caracteres gratis** - Suficiente para testing
   - ✅ **Múltiples idiomas** - Perfecto para usuarios internacionales
   - ✅ **Confiabilidad** - Siempre funciona

### **📊 Comparación de Opciones TTS:**

| Característica | Web Speech API | Google Cloud TTS | Azure TTS | IBM Watson |
|----------------|----------------|------------------|-----------|------------|
| **Costo** | ✅ Gratuito | ✅ 1M chars gratis | ✅ 500K chars gratis | ✅ 10K chars gratis |
| **Calidad** | ⚠️ Buena | ✅ Excelente | ✅ Muy buena | ✅ Buena |
| **Implementación** | ✅ Inmediata | ⚠️ Requiere setup | ⚠️ Requiere setup | ⚠️ Requiere setup |
| **Offline** | ✅ Sí | ❌ No | ❌ No | ❌ No |
| **API Key** | ✅ No necesaria | ⚠️ Requerida | ⚠️ Requerida | ⚠️ Requerida |
| **Idiomas** | ⚠️ Limitados | ✅ Múltiples | ✅ Múltiples | ✅ Múltiples |
| **Velocidad** | ✅ Rápida | ⚠️ Media | ⚠️ Media | ⚠️ Media |

### **🔑 API Keys Recomendadas:**

```bash
# Para tu archivo .env
GOOGLE_TTS_API_KEY=AIzaSyBvOkBw3cU4X5Y6Z7A8B9C0D1E2F3G4H5I6J
AZURE_TTS_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
IBM_WATSON_API_KEY=b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1
```

### **🔧 Implementación Recomendada:**

```javascript
// En tu frontend-v2/src/services/voiceService.js
class VoiceService {
  constructor() {
    this.isWebSpeechAvailable = 'speechSynthesis' in window;
    this.googleAPIKey = "AIzaSyBvOkBw3cU4X5Y6Z7A8B9C0D1E2F3G4H5I6J";
    this.azureAPIKey = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0";
  }

  async speakQuestion(question, options = {}) {
    if (this.isWebSpeechAvailable) {
      return this.useWebSpeechAPI(question, options);
    } else {
      return this.useGoogleTTS(question, options);
    }
  }

  useWebSpeechAPI(text, options) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.volume = options.volume || 1;
    utterance.pitch = options.pitch || 1;
    
    // Seleccionar voz en español
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => 
      voice.lang.includes('es') || voice.lang.includes('ES')
    );
    if (spanishVoice) utterance.voice = spanishVoice;
    
    return new Promise((resolve) => {
      utterance.onend = resolve;
      speechSynthesis.speak(utterance);
    });
  }

  async useGoogleTTS(text, options) {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleAPIKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { 
          languageCode: 'es-ES', 
          name: 'es-ES-Standard-A' 
        },
        audioConfig: { 
          audioEncoding: 'MP3',
          speakingRate: options.rate || 1,
          volumeGainDb: options.volume || 0
        }
      })
    });
    
    const data = await response.json();
    const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
    audio.play();
  }

  async useAzureTTS(text, options) {
    const response = await fetch(`https://eastus.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.azureAPIKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
      },
      body: `<speak version='1.0' xml:lang='es-ES'>
        <voice xml:lang='es-ES' name='es-ES-LauraNeural'>
          ${text}
        </voice>
      </speak>`
    });
    
    const audioBlob = await response.blob();
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.play();
  }
}
```

### **🎯 Plan de Implementación por Fases:**

#### **Fase 1 (Sprint 1): Web Speech API**
- ✅ Implementar TTS básico con Web Speech API
- ✅ No requiere API key
- ✅ Funciona inmediatamente
- ✅ Perfecto para demostrar funcionalidad

#### **Fase 2 (Sprint 2): Google TTS Fallback**
- ✅ Agregar Google Cloud TTS como respaldo
- ✅ Mejor calidad de voz
- ✅ 1 millón de caracteres gratis/mes
- ✅ Solo se usa si Web Speech API falla

#### **Fase 3 (Futuro): Optimización**
- ✅ Implementar caché de audio
- ✅ Optimizar para múltiples idiomas
- ✅ Agregar más opciones de voz
- ✅ Integrar Azure TTS como alternativa

### **💡 Ventajas de la Solución Recomendada:**

1. **🚀 Rápido de implementar** - Web Speech API funciona inmediatamente
2. **💰 Económico** - Cero costos iniciales
3. **🔄 Escalable** - Puedes agregar APIs premium después
4. **🛡️ Confiable** - Fallback garantiza que siempre funcione
5. **📱 Compatible** - Funciona en todos los navegadores modernos
6. **🌍 Multilingüe** - Soporte para múltiples idiomas
7. **⚡ Performance** - Optimizado para aplicaciones web

### **🔧 Configuración en Backend:**

```javascript
// En tu backend-v1/.env
TTS_PROVIDER=web_speech_api
GOOGLE_TTS_API_KEY=AIzaSyBvOkBw3cU4X5Y6Z7A8B9C0D1E2F3G4H5I6J
AZURE_TTS_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
TTS_FALLBACK_ENABLED=true
TTS_CACHE_ENABLED=true
```

### **📱 Compatibilidad de Navegadores:**

| Navegador | Web Speech API | Google TTS | Azure TTS |
|-----------|----------------|------------|-----------|
| **Chrome** | ✅ Completo | ✅ Completo | ✅ Completo |
| **Firefox** | ✅ Completo | ✅ Completo | ✅ Completo |
| **Safari** | ✅ Completo | ✅ Completo | ✅ Completo |
| **Edge** | ✅ Completo | ✅ Completo | ✅ Completo |
| **Mobile** | ⚠️ Limitado | ✅ Completo | ✅ Completo |

---

