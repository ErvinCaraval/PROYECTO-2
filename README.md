---

# 🚀 BrainBlitz - Product Backlog & Release Plan
## Proyecto de Visión Computacional con Azure

---

## 📋 Índice

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Product Backlog](#product-backlog)
3. [Historias de Usuario (HU)](#historias-de-usuario-hu)
4. [Clasificación de HUs según Uso de IA](#clasificación-de-hus-según-uso-de-ia)
5. [Release Plan](#release-plan)
6. [Arquitectura Técnica](#arquitectura-técnica)
7. [Configuración del Proyecto](#configuración-del-proyecto)

---
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
## 📝 Descripción del Proyecto

**BrainBlitz** es una plataforma de trivia interactiva que integra funcionalidades avanzadas de **Visión Computacional** utilizando **Azure Computer Vision** y **DeepFace** para mejorar la experiencia de creación de preguntas y autenticación de usuarios.

### Objetivos Principales:
- ✅ Implementar autenticación biométrica mediante reconocimiento facial
- ✅ Automatizar la extracción de texto de imágenes (OCR)
- ✅ Analizar imágenes para generar preguntas automáticamente
- ✅ Detectar objetos en imágenes para crear preguntas visuales interactivas

### Tecnologías Utilizadas:
- **Backend:** Node.js, Express, Firebase
- **Frontend:** React, TailwindCSS
- **IA y Visión Computacional:**
  - Azure Computer Vision (OCR, Analyze Image, Object Detection)
  - DeepFace (Reconocimiento Facial)
  - Azure Container Instances (Despliegue de microservicios)
- **DevOps:** GitHub Actions, Docker

---

## 📊 Product Backlog

### Sprint Semana 1: 17-19 Noviembre 2025
**Enfoque:** OCR y Reconocimiento Facial

| ID | Historia de Usuario | Puntos | Prioridad | Fecha | IA |
|----|-------------------|--------|-----------|-------|-----|
| HU-VC2 | [BE] OCR - Extracción de Texto de Imágenes | 8 SP | Media | 17 Nov | ✅ |
| HU-VC1 | [BE] Reconocimiento Facial para Login y Registro | 13 SP | Alta | 18 Nov | ✅ |

**Total Sprint 1:** 21 Story Points

---

### Sprint Semana 2: 20-24 Noviembre 2025
**Enfoque:** Análisis de Imágenes y Detección de Objetos

| ID | Historia de Usuario | Puntos | Prioridad | Fecha | IA |
|----|-------------------|--------|-----------|-------|-----|
| HU-VC3 | [BE] Análisis Inteligente de Imágenes | 10 SP | Media | 20 Nov | ✅ |
| HU-VC4 | [BE] Detección de Objetos en Imágenes | 10 SP | Media | 21 Nov | ✅ |

**Total Sprint 2:** 20 Story Points

---

**Total del Proyecto:** 41 Story Points

---

## 📖 Historias de Usuario (HU)

### HU-VC1: Reconocimiento Facial para Login y Registro
**📅 Fecha Objetivo:** Martes 18 Noviembre 2025  
**🔢 Estimación:** 13 Story Points  
**🎯 Prioridad:** Alta  
**🤖 Requiere IA:** ✅ Sí (DeepFace + VGG-Face)

#### Contexto (C):
Los usuarios de BrainBlitz necesitan una forma segura y moderna de autenticarse sin depender únicamente de contraseñas. El sistema actual permite registro e inicio de sesión con email/contraseña, pero se requiere implementar autenticación biométrica mediante reconocimiento facial.

#### Objetivo (O):
Permitir que los usuarios se registren e inicien sesión usando reconocimiento facial como método de autenticación alternativo o principal, mejorando la seguridad y la experiencia de usuario.

#### Necesidad (N):
Proporcionar una opción de autenticación sin contraseña que sea rápida, segura y accesible desde dispositivos con cámara, reduciendo la fricción en el proceso de login y mejorando la seguridad mediante biometría.

#### Entidades (E):
- Sistema de autenticación facial
- Base de datos de usuarios
- Servicio de reconocimiento facial (DeepFace)
- Frontend con acceso a cámara
- Backend con endpoints de registro y login facial

#### Soporte (S):
- **Microservicio:** `facial-service` usando DeepFace
- **Endpoints Backend:** 
  - `POST /api/face/register`
  - `POST /api/face/login`
- **Frontend:** 
  - `FaceRegister.jsx`
  - `FaceLogin.jsx`
- **Base de Datos:** Firebase Firestore (embeddings faciales)
- **Despliegue:** Azure Container Instances

#### Suposiciones (S):
- Los usuarios tienen acceso a dispositivos con cámara web
- El navegador soporta acceso a la cámara (getUserMedia API)
- El servicio de reconocimiento facial está desplegado y accesible
- Los usuarios están dispuestos a registrar su rostro para autenticación

#### Criterios de Aceptación (A):

**1. Registro Facial:**
- ✅ Endpoint `POST /api/face/register` que acepta imagen Base64 y token Firebase
- ✅ Validación de rostro visible usando DeepFace
- ✅ Generación de embeddings faciales con modelo VGG-Face
- ✅ Almacenamiento de embeddings en Firestore asociados al userId
- ✅ Prevención de duplicados (un usuario = un registro facial)
- ✅ Respuesta exitosa: `{ success: true, message: 'Cara registrada exitosamente' }`
- ✅ Manejo de errores: rostro no detectado, token inválido, usuario ya registrado

**2. Login Facial:**
- ✅ Endpoint `POST /api/face/login` que acepta imagen Base64 y email
- ✅ Búsqueda de usuario por email en Firebase Auth
- ✅ Verificación de registro facial previo
- ✅ Comparación facial con embedding almacenado
- ✅ Umbral de confianza mínimo (ej: 0.7)
- ✅ Generación de token personalizado de Firebase si verificación exitosa
- ✅ Respuesta: `{ success: true, verified: true, customToken, userId, confidence }`
- ✅ Manejo de errores: rostro no detectado, usuario no encontrado, verificación fallida

**3. Frontend - Registro Facial:**
- ✅ Componente `FaceRegister.jsx` con:
  - Vista previa de cámara en tiempo real
  - Captura de foto del rostro
  - Conversión a Base64
  - Envío al endpoint `/api/face/register`
  - Mensajes de éxito/error
- ✅ Solicitud de permisos de cámara con `navigator.mediaDevices.getUserMedia()`
- ✅ Indicador visual cuando se detecta un rostro
- ✅ Manejo de errores: sin cámara, permisos denegados, registro fallido

**4. Frontend - Login Facial:**
- ✅ Componente `FaceLogin.jsx` con:
  - Campo de email del usuario
  - Vista previa de cámara
  - Captura de foto
  - Envío al endpoint `/api/face/login`
  - Autenticación con token recibido
- ✅ Integración con `AuthContext`
- ✅ Redirección a página principal después de login exitoso

**5. Seguridad:**
- ✅ Registro facial requiere token Firebase válido
- ✅ Verificación de token antes de procesar registro
- ✅ Almacenamiento seguro de embeddings en Firestore
- ✅ Rate limiting en endpoints para prevenir ataques

**6. Despliegue:**
- ✅ Microservicio facial desplegado en Azure Container Instances
- ✅ URL configurada en `.env` como `DEEPFACE_SERVICE_URL`
- ✅ Health check: `GET /health` responde correctamente

**7. Pruebas:**
- ✅ Pruebas unitarias para controladores de registro y login
- ✅ Pruebas de integración de flujos completos
- ✅ Pruebas manuales en Chrome, Firefox y Edge

#### Tecnologías:
- DeepFace
- VGG-Face (modelo de embeddings)
- Azure Container Instances
- Firebase Auth
- React
- getUserMedia API

---

### HU-VC2: OCR - Extracción de Texto de Imágenes
**📅 Fecha Objetivo:** Lunes 17 Noviembre 2025  
**🔢 Estimación:** 8 Story Points  
**🎯 Prioridad:** Media  
**🤖 Requiere IA:** ✅ Sí (Azure Computer Vision OCR)

#### Contexto (C):
Los usuarios y administradores de BrainBlitz necesitan una forma de convertir imágenes con texto (pantallas, documentos, carteles, capturas) en texto editable para generar preguntas automáticamente o procesar contenido visual. Actualmente, el sistema requiere que las preguntas se ingresen manualmente, lo cual es lento y propenso a errores.

#### Objetivo (O):
Implementar un sistema de reconocimiento óptico de caracteres (OCR) que permita extraer texto de imágenes subidas por usuarios o administradores, facilitando la creación de preguntas y el procesamiento de contenido visual.

#### Necesidad (N):
Automatizar la extracción de texto de imágenes para reducir el tiempo de creación de preguntas, permitir que usuarios suban imágenes con preguntas y convertirlas automáticamente, y mejorar la accesibilidad del contenido visual.

#### Entidades (E):
- Servicio de OCR (Azure Computer Vision)
- Endpoint backend para procesamiento de imágenes
- Frontend para subir imágenes
- Base de datos para almacenar texto extraído
- Sistema de validación y limpieza de texto

#### Soporte (S):
- **Servicio:** Azure Computer Vision API con OCR
- **Endpoint Backend:** `POST /api/vision/extract-text`
- **Frontend:** Componente para subir imágenes y mostrar texto extraído
- **Variables de Entorno:** 
  - `AZURE_COMPUTER_VISION_KEY`
  - `AZURE_COMPUTER_VISION_ENDPOINT`
- **Biblioteca:** `@azure/cognitiveservices-computervision` o HTTP REST

#### Suposiciones (S):
- Azure Computer Vision está configurado y tiene créditos disponibles
- Las imágenes subidas contienen texto legible
- Los usuarios tienen permisos para subir imágenes
- El texto extraído puede requerir limpieza y validación

#### Criterios de Aceptación (A):

**1. Configuración de Azure:**
- ✅ Cuenta Azure con Computer Vision habilitado
- ✅ API Key de Azure Computer Vision disponible
- ✅ URL del endpoint de Azure Computer Vision
- ✅ Variables `AZURE_COMPUTER_VISION_KEY` y `AZURE_COMPUTER_VISION_ENDPOINT` en `.env`
- ✅ Instalación de `@azure/cognitiveservices-computervision` o uso de `axios`/`fetch`

**2. Endpoint Backend:**
- ✅ Ruta `POST /api/vision/extract-text` en `backend-v1/routes/vision.routes.js`
- ✅ Controlador `visionController.js` con método `extractText`
- ✅ Middleware de autenticación `authenticate.js`
- ✅ Validación de imagen en Base64 o archivo
- ✅ Límite de tamaño de 4MB (límite de Azure)

**3. Integración con Azure OCR:**
- ✅ Conversión de Base64 a buffer binario
- ✅ POST a `https://{endpoint}/vision/v3.2/read/analyze`
- ✅ Headers: `Ocp-Apim-Subscription-Key` y `Content-Type: application/octet-stream`
- ✅ Manejo de procesamiento asíncrono de Azure (analyze → get results)
- ✅ Extracción de todas las líneas de texto de la respuesta
- ✅ Formato de respuesta limpio y estructurado

**4. Respuesta del Endpoint:**
- ✅ Formato JSON: `{ success: true, text: string, language: string, confidence: number, lines: array }`
- ✅ Texto completo concatenado
- ✅ Array con cada línea de texto detectada
- ✅ Idioma detectado (es, en, etc.)
- ✅ Nivel de confianza promedio

**5. Manejo de Errores:**
- ✅ Error 400 si imagen inválida
- ✅ Mensaje claro si no se detecta texto
- ✅ Manejo de errores de Azure (401, 429, 500)
- ✅ Manejo de timeouts con reintentos
- ✅ Logging de errores para debugging

**6. Pruebas:**
- ✅ Prueba unitaria de función de extracción
- ✅ Prueba de integración del endpoint completo
- ✅ Prueba de manejo de errores
- ✅ Prueba manual con JPG, PNG, PDF

**7. Integración con el Juego - Frontend:**
- ✅ Componente `OCRQuestionCreator.jsx` con:
  - Subida de imagen (drag & drop o botón)
  - Preview de imagen subida
  - Botón "Extraer Texto" → llamada a `/api/vision/extract-text`
  - Spinner de carga
  - Textarea editable con texto extraído
  - Botón "Usar como Pregunta" → pre-llena formulario
- ✅ Integración con `AIQuestionGenerator.jsx`:
  - Texto extraído pasa al campo de pregunta
  - Usuario edita texto antes de crear pregunta
  - Usuario completa opciones y selecciona respuesta correcta
  - Creación de pregunta con flujo existente
- ✅ Flujo de Usuario Completo:
  1. Usuario va a "Crear Juego" o "Generar Preguntas"
  2. Ve opción "Crear desde Imagen con Texto"
  3. Sube imagen con texto
  4. Sistema extrae texto automáticamente
  5. Texto aparece en formulario editable
  6. Usuario edita y completa opciones
  7. Crea pregunta normalmente
- ✅ Resultado Final:
  - Preguntas creadas desde OCR aparecen en juegos normalmente
  - No hay diferencia visual entre preguntas manuales u OCR
  - Texto extraído se guarda como texto de pregunta
  - Jugadores ven y responden pregunta normalmente

**8. Documentación:**
- ✅ Endpoint documentado en `swagger.yaml`
- ✅ Instrucciones de configuración de Azure en README
- ✅ Ejemplos de uso del endpoint

#### Tecnologías:
- Azure Computer Vision OCR
- Node.js
- Express
- React
- Base64 encoding

---

### HU-VC3: Análisis Inteligente de Imágenes
**📅 Fecha Objetivo:** Jueves 20 Noviembre 2025  
**🔢 Estimación:** 10 Story Points  
**🎯 Prioridad:** Media  
**🤖 Requiere IA:** ✅ Sí (Azure Computer Vision Analyze)

#### Contexto (C):
Los usuarios y administradores de BrainBlitz necesitan generar preguntas automáticamente a partir de imágenes. Actualmente, las preguntas se crean manualmente o mediante IA basada en texto. Se requiere un sistema que analice imágenes y genere descripciones, tags y categorías automáticamente para facilitar la creación de preguntas visuales.

#### Objetivo (O):
Implementar un sistema de análisis inteligente de imágenes que genere descripciones automáticas, tags, categorías y metadatos de imágenes, permitiendo crear preguntas de trivia basadas en contenido visual de forma automática.

#### Necesidad (N):
Automatizar la generación de contenido para preguntas visuales, mejorar la accesibilidad describiendo imágenes, y permitir búsqueda y categorización automática de imágenes por contenido.

#### Entidades (E):
- Servicio de análisis de imágenes (Azure Computer Vision)
- Endpoint backend para análisis
- Frontend para subir y visualizar análisis
- Base de datos para almacenar metadatos de imágenes
- Sistema de generación de preguntas basado en análisis

#### Soporte (S):
- **Servicio:** Azure Computer Vision API Analyze Image
- **Endpoint Backend:** `POST /api/vision/analyze-image`
- **Frontend:** Componente para subir imágenes y mostrar análisis
- **Variables de Entorno:** 
  - `AZURE_COMPUTER_VISION_KEY`
  - `AZURE_COMPUTER_VISION_ENDPOINT`
- **Biblioteca:** `@azure/cognitiveservices-computervision` o HTTP REST

#### Suposiciones (S):
- Azure Computer Vision está configurado
- Las imágenes contienen contenido reconocible
- Los usuarios tienen permisos para subir imágenes
- El análisis puede usarse para generar preguntas automáticamente

#### Criterios de Aceptación (A):

**1. Configuración de Azure:**
- ✅ Variable `AZURE_COMPUTER_VISION_KEY` en `.env`
- ✅ Variable `AZURE_COMPUTER_VISION_ENDPOINT` en `.env`
- ✅ Dependencias instaladas

**2. Endpoint Backend:**
- ✅ Ruta `POST /api/vision/analyze-image` en `backend-v1/routes/vision.routes.js`
- ✅ Método `analyzeImage` en `visionController.js`
- ✅ Autenticación requerida
- ✅ Validación de imagen Base64 o archivo, máximo 4MB

**3. Integración con Azure Analyze Image:**
- ✅ POST a `https://{endpoint}/vision/v3.2/analyze?visualFeatures=Description,Tags,Categories,Objects,Color`
- ✅ Headers: `Ocp-Apim-Subscription-Key` y `Content-Type: application/octet-stream`
- ✅ Parámetros visuales: Description, Tags, Categories, Objects, Color
- ✅ Procesamiento correcto de respuesta JSON

**4. Extracción de Datos:**
- ✅ Descripción principal y descripciones alternativas
- ✅ Tags con niveles de confianza
- ✅ Categorías detectadas (abstract, people, outdoor, etc.)
- ✅ Objetos detectados con bounding boxes
- ✅ Colores dominantes y acento de color
- ✅ Metadatos: dimensiones, formato

**5. Respuesta del Endpoint:**
- ✅ Objeto JSON estructurado con descripción, tags, categorías, objetos y colores
- ✅ Niveles de confianza incluidos
- ✅ Tags y categorías ordenados por confianza descendente

**6. Manejo de Errores:**
- ✅ Error 400 con mensaje claro para imagen inválida
- ✅ Mensaje si no se detecta contenido reconocible
- ✅ Manejo de 401, 429, 500 con mensajes apropiados
- ✅ Manejo de timeouts con reintentos
- ✅ Logging de errores

**7. Pruebas:**
- ✅ Prueba unitaria con imagen de prueba
- ✅ Prueba de integración del endpoint
- ✅ Prueba con imágenes de arte, geografía, objetos, personas
- ✅ Verificación de manejo de errores

**8. Integración con el Juego - Frontend:**
- ✅ Componente `ImageAnalysisQuestionCreator.jsx` con:
  - Subida de imagen (drag & drop o botón)
  - Preview de imagen
  - Botón "Analizar Imagen" → llamada a `/api/vision/analyze-image`
  - Spinner de carga
  - Resultados en secciones:
    - Descripción Principal (texto destacado)
    - Tags Detectados (chips/badges, confianza mínima 0.7)
    - Categorías (lista)
    - Objetos Detectados (lista con confianza)
- ✅ Generación Automática de Preguntas:
  - Botón "Generar Pregunta desde Análisis":
    1. Usa descripción como base para pregunta
    2. Usa tags para sugerir categoría
    3. Pre-llena campo: "¿Qué se muestra en esta imagen?"
    4. Sugiere opciones basadas en tags y objetos
  - Usuario puede editar antes de guardar
- ✅ Integración con `AIQuestionGenerator`:
  - Opción "Crear desde Análisis de Imagen"
  - Análisis pre-llena formulario
  - Usuario completa/edita y crea pregunta
- ✅ Flujo de Usuario Completo:
  1. Usuario va a "Crear Juego" o "Generar Preguntas"
  2. Selecciona "Crear desde Análisis de Imagen"
  3. Sube imagen (monumento, obra de arte, paisaje, objeto)
  4. Sistema analiza y muestra resultados
  5. Usuario revisa descripción, tags y objetos
  6. Clic en "Generar Pregunta"
  7. Sistema pre-llena formulario con pregunta sugerida
  8. Usuario edita pregunta y opciones
  9. Usuario selecciona respuesta correcta y crea pregunta
- ✅ Resultado Final en el Juego:
  - Preguntas aparecen con imagen asociada
  - Durante juego, jugadores ven:
    - Imagen en la pregunta
    - Texto de pregunta generada desde análisis
    - Opciones de respuesta
  - Ejemplo: "¿Qué monumento histórico se muestra en la imagen?" con opciones basadas en tags
  - Validación de respuesta correcta normal

**9. Documentación:**
- ✅ Endpoint documentado en Swagger
- ✅ Ejemplos de imágenes y respuestas esperadas
- ✅ Guía de integración para generar preguntas

#### Tecnologías:
- Azure Computer Vision Analyze Image
- Node.js
- Express
- React

---

### HU-VC4: Detección de Objetos en Imágenes
**📅 Fecha Objetivo:** Viernes 21 Noviembre 2025  
**🔢 Estimación:** 10 Story Points  
**🎯 Prioridad:** Media  
**🤖 Requiere IA:** ✅ Sí (Azure Computer Vision Object Detection)

#### Contexto (C):
Los usuarios de BrainBlitz necesitan crear preguntas visuales donde se identifiquen objetos específicos en imágenes. Por ejemplo, "¿Qué objeto aparece en esta imagen?" o "¿Cuántos objetos de tipo X hay en la imagen?". Actualmente, no existe funcionalidad para detectar y localizar objetos en imágenes.

#### Objetivo (O):
Implementar un sistema de detección de objetos que identifique y localice objetos específicos dentro de imágenes, permitiendo crear preguntas interactivas basadas en la detección de objetos y mejorar la experiencia de preguntas visuales.

#### Necesidad (N):
Habilitar la creación de preguntas visuales interactivas, permitir búsqueda de objetos en imágenes, y mejorar la accesibilidad describiendo qué objetos están presentes en una imagen.

#### Entidades (E):
- Servicio de detección de objetos (Azure Computer Vision)
- Endpoint backend para detección
- Frontend para visualizar objetos detectados
- Base de datos para almacenar detecciones
- Sistema de preguntas basadas en objetos

#### Soporte (S):
- **Servicio:** Azure Computer Vision API Object Detection
- **Endpoint Backend:** `POST /api/vision/detect-objects`
- **Frontend:** Componente para mostrar objetos con bounding boxes
- **Variables de Entorno:** 
  - `AZURE_COMPUTER_VISION_KEY`
  - `AZURE_COMPUTER_VISION_ENDPOINT`
- **Biblioteca:** `@azure/cognitiveservices-computervision` o HTTP REST

#### Suposiciones (S):
- Azure Computer Vision soporta detección de objetos
- Las imágenes contienen objetos reconocibles
- Los usuarios necesitan crear preguntas basadas en objetos detectados

#### Criterios de Aceptación (A):

**1. Configuración de Azure:**
- ✅ Variable `AZURE_COMPUTER_VISION_KEY` configurada
- ✅ Variable `AZURE_COMPUTER_VISION_ENDPOINT` configurada
- ✅ Librería de Azure instalada o HTTP REST

**2. Endpoint Backend:**
- ✅ Ruta `POST /api/vision/detect-objects` en `backend-v1/routes/vision.routes.js`
- ✅ Método `detectObjects` en `visionController.js`
- ✅ Autenticación requerida
- ✅ Validación de imagen Base64 o archivo, máximo 4MB

**3. Integración con Azure Object Detection:**
- ✅ POST a `https://{endpoint}/vision/v3.2/detect`
- ✅ Headers: `Ocp-Apim-Subscription-Key` y `Content-Type: application/octet-stream`
- ✅ Procesamiento de respuesta JSON con objetos detectados

**4. Extracción de Objetos:**
- ✅ Lista de objetos con nombre, confianza, bounding box y área
- ✅ Filtrado opcional por confianza < 0.5
- ✅ Ordenamiento por confianza descendente o área

**5. Respuesta del Endpoint:**
- ✅ Formato JSON con array de objetos, total y dimensiones de imagen
- ✅ Metadatos: total de objetos y dimensiones
- ✅ Bounding boxes en píxeles o normalizados (0-1)

**6. Funcionalidades Adicionales:**
- ✅ Parámetro opcional `objectName` para buscar objeto específico
- ✅ Conteo de cada tipo de objeto
- ✅ Agrupación de objetos del mismo tipo

**7. Manejo de Errores:**
- ✅ Error 400 con mensaje claro para imagen inválida
- ✅ Lista vacía si no se detectan objetos (no error)
- ✅ Manejo de errores de API con mensajes apropiados
- ✅ Manejo de timeouts
- ✅ Logging de errores

**8. Pruebas:**
- ✅ Prueba unitaria con imagen de prueba
- ✅ Prueba de integración del endpoint
- ✅ Verificación de detección de múltiples objetos
- ✅ Verificación de precisión
- ✅ Verificación de manejo de errores

**9. Integración con el Juego - Frontend:**
- ✅ Componente `ObjectDetectionQuestionCreator.jsx` con:
  - Subida de imagen (drag & drop o botón)
  - Preview de imagen
  - Botón "Detectar Objetos" → llamada a `/api/vision/detect-objects`
  - Spinner de carga
  - Imagen con bounding boxes dibujados sobre objetos
  - Lista de objetos con:
    - Nombre del objeto
    - Nivel de confianza (barra o porcentaje)
    - Posición (coordenadas)
- ✅ Visualización Interactiva:
  - Hover sobre objeto en lista → resalta bounding box
  - Clic en bounding box → resalta en lista
  - Filtro por confianza mínima (slider)
  - Contador por tipo (ej: "3 guitarras", "1 persona", "2 sillas")
- ✅ Generación Automática de Preguntas:
  - Botón "Crear Pregunta de Objetos":
    1. Genera: "¿Qué objeto aparece en esta imagen?" o "¿Cuántos [objeto] hay?"
    2. Usa objetos detectados como opciones
    3. Marca objeto con mayor confianza como correcto
    4. Pre-llena formulario
  - Opción para preguntas de conteo:
    - "¿Cuántos [objeto] hay en la imagen?"
    - Sistema cuenta objetos del mismo tipo
    - Genera opciones numéricas (0, 1, 2, 3, 4+)
- ✅ Integración con `AIQuestionGenerator`:
  - Opción "Crear Pregunta de Detección de Objetos"
  - Imagen con objetos se guarda asociada a pregunta
  - Formulario pre-llenado con pregunta y opciones
- ✅ Flujo de Usuario Completo:
  1. Usuario va a "Crear Juego" o "Generar Preguntas"
  2. Selecciona "Crear Pregunta de Detección de Objetos"
  3. Sube imagen con objetos (instrumentos, animales, objetos)
  4. Sistema detecta objetos y muestra resultados visuales
  5. Usuario revisa objetos y ajusta filtro de confianza
  6. Usuario selecciona tipo de pregunta:
     - "¿Qué objeto es este?" (identificación)
     - "¿Cuántos [objeto] hay?" (conteo)
  7. Sistema genera pregunta y opciones automáticamente
  8. Usuario edita si es necesario
  9. Usuario confirma respuesta correcta y crea pregunta
- ✅ Resultado Final en el Juego:
  - Preguntas muestran:
    - Imagen original (sin bounding boxes)
    - Texto de pregunta (ej: "¿Qué objeto musical aparece?")
    - Opciones de respuesta (objetos detectados)
  - Durante juego, jugadores:
    1. Ven imagen de pregunta
    2. Leen pregunta sobre objeto a identificar/contar
    3. Seleccionan respuesta entre opciones
    4. Sistema valida respuesta correcta
  - Ejemplo:
    - Imagen: Foto de guitarra, piano y violín
    - Pregunta: "¿Qué instrumento musical aparece en la imagen?"
    - Opciones: ["Guitarra", "Piano", "Violín", "Batería"]
    - Respuesta correcta: "Guitarra" (objeto con mayor confianza)

**10. Documentación:**
- ✅ Endpoint documentado en Swagger
- ✅ Ejemplos visuales de imágenes y objetos detectados
- ✅ Guía de uso para crear preguntas

#### Tecnologías:
- Azure Computer Vision Object Detection
- Node.js
- Express
- React
- Canvas API (para dibujar bounding boxes)

---

## 🤖 Clasificación de HUs según Uso de IA

### ✅ Historias que REQUIEREN IA (4/4 - 100%)

Todas las historias de usuario en este proyecto utilizan servicios de Inteligencia Artificial:

| ID | Historia de Usuario | Servicio de IA | Modelo/Algoritmo |
|----|-------------------|----------------|------------------|
| **HU-VC1** | Reconocimiento Facial | DeepFace | VGG-Face (embeddings faciales) |
| **HU-VC2** | OCR - Extracción de Texto | Azure Computer Vision | OCR v3.2 |
| **HU-VC3** | Análisis de Imágenes | Azure Computer Vision | Analyze Image API |
| **HU-VC4** | Detección de Objetos | Azure Computer Vision | Object Detection API |

### 📊 Análisis por Tipo de IA:

**1. Visión Computacional con Azure (3 HUs):**
- HU-VC2: OCR para extracción de texto
- HU-VC3: Análisis inteligente de imágenes (descripción, tags, categorías)
- HU-VC4: Detección y localización de objetos

**2. Reconocimiento Facial con DeepFace (1 HU):**
- HU-VC1: Autenticación biométrica mediante reconocimiento facial

### 🎯 Distribución de Story Points por IA:

- **DeepFace (Reconocimiento Facial):** 13 SP (31.7%)
- **Azure OCR:** 8 SP (19.5%)
- **Azure Analyze Image:** 10 SP (24.4%)
- **Azure Object Detection:** 10 SP (24.4%)

**Total:** 41 Story Points implementando servicios de IA

---

## 📅 Release Plan

### 🚀 Release 1.0: "Computer Vision Foundation"
**Fecha de Lanzamiento:** 24 Noviembre 2025  
**Duración:** 2 Sprints (8 días laborables)

---

### Sprint 1: "Autenticación y Extracción" (17-19 Noviembre 2025)
**Objetivo:** Implementar funcionalidades core de autenticación biométrica y procesamiento de texto

#### 📦 Entregables:

**Lunes 17 Noviembre:**
- ✅ **HU-VC2: OCR - Extracción de Texto** (8 SP)
  - Endpoint `/api/vision/extract-text` funcional
  - Integración con Azure Computer Vision OCR
  - Componente frontend `OCRQuestionCreator.jsx`
  - Flujo completo de creación de preguntas desde imágenes con texto
  - Pruebas unitarias e integración
  - Documentación Swagger

**Martes 18 Noviembre:**
- ✅ **HU-VC1: Reconocimiento Facial** (13 SP)
  - Microservicio `facial-service` con DeepFace desplegado en Azure
  - Endpoints `/api/face/register` y `/api/face/login`
  - Componentes frontend `FaceRegister.jsx` y `FaceLogin.jsx`
  - Integración con Firebase Auth
  - Sistema de embeddings faciales
  - Pruebas de seguridad y autenticación
  - Documentación completa

**Miércoles 19 Noviembre:**
- 🔧 Testing y refinamiento del Sprint 1
- 📝 Documentación de usuario
- 🐛 Bug fixing
- 🎨 Mejoras de UX/UI

#### 📈 Métricas del Sprint 1:
- **Story Points:** 21 SP
- **Historias Completadas:** 2
- **Endpoints API Nuevos:** 3
- **Componentes Frontend Nuevos:** 3
- **Servicios de IA Integrados:** 2 (DeepFace, Azure OCR)

---

### Sprint 2: "Análisis Visual Avanzado" (20-24 Noviembre 2025)
**Objetivo:** Implementar análisis inteligente y detección de objetos para preguntas visuales

#### 📦 Entregables:

**Jueves 20 Noviembre:**
- ✅ **HU-VC3: Análisis Inteligente de Imágenes** (10 SP)
  - Endpoint `/api/vision/analyze-image` funcional
  - Integración con Azure Computer Vision Analyze
  - Componente frontend `ImageAnalysisQuestionCreator.jsx`
  - Extracción de descripción, tags, categorías, objetos y colores
  - Generación automática de preguntas desde análisis
  - Integración con `AIQuestionGenerator`
  - Pruebas con diferentes tipos de imágenes
  - Documentación y ejemplos

**Viernes 21 Noviembre:**
- ✅ **HU-VC4: Detección de Objetos** (10 SP)
  - Endpoint `/api/vision/detect-objects` funcional
  - Integración con Azure Object Detection
  - Componente frontend `ObjectDetectionQuestionCreator.jsx`
  - Visualización de bounding boxes
  - Generación de preguntas de identificación y conteo
  - Funcionalidades interactivas (hover, filtros)
  - Pruebas de precisión
  - Documentación completa

**Sábado-Domingo 22-23 Noviembre:**
- 🔧 Testing integral de todas las funcionalidades
- 📝 Documentación de usuario final
- 🐛 Bug fixing y optimización
- 🎨 Refinamiento de UX/UI
- 🔒 Revisión de seguridad

**Lunes 24 Noviembre:**
- 🚀 **Despliegue a Producción**
- ✅ Validación de todas las funcionalidades en producción
- 📊 Configuración de monitoring y alertas
- 📢 Anuncio de Release 1.0

#### 📈 Métricas del Sprint 2:
- **Story Points:** 20 SP
- **Historias Completadas:** 2
- **Endpoints API Nuevos:** 2
- **Componentes Frontend Nuevos:** 2
- **Servicios de IA Integrados:** 1 (Azure Computer Vision - 2 APIs)

---

### 📊 Resumen General del Release 1.0

#### Story Points Totales: 41 SP
- Sprint 1: 21 SP (51.2%)
- Sprint 2: 20 SP (48.8%)

#### Componentes Entregados:
- **Backend:**
  - 5 Endpoints API nuevos
  - 1 Microservicio de reconocimiento facial
  - 5 Controladores nuevos
  - Sistema de validación y manejo de errores
  
- **Frontend:**
  - 5 Componentes React nuevos
  - Integración con cámara web
  - Visualización de análisis de IA
  - Sistema de generación automática de preguntas
  
- **Integraciones de IA:**
  - DeepFace (VGG-Face)
  - Azure Computer Vision OCR
  - Azure Computer Vision Analyze
  - Azure Computer Vision Object Detection
  
- **Infraestructura:**
  - Azure Container Instances (microservicio facial)
  - Firebase Firestore (embeddings faciales)
  - Azure Cognitive Services (3 APIs)

#### Capacidades Nuevas para Usuarios:
1. ✅ Autenticación sin contraseña mediante rostro
2. ✅ Creación de preguntas desde imágenes con texto
3. ✅ Generación automática de preguntas desde análisis de imágenes
4. ✅ Creación de preguntas visuales con detección de objetos
5. ✅ Mejora de accesibilidad con descripción automática de imágenes

---

### 🔄 Post-Release Activities (25-30 Noviembre 2025)

**Lunes 25 Noviembre:**
- 📊 Análisis de métricas de uso
- 📝 Recolección de feedback de usuarios
- 🐛 Identificación de bugs críticos

**Martes 26 - Viernes 29 Noviembre:**
- 🔧 Hotfixes según prioridad
- 📈 Optimización de rendimiento
- 🎨 Mejoras de UX basadas en feedback
- 📚 Actualización de documentación

**Sábado 30 Noviembre:**
- 📊 Reporte final de Release 1.0
- 🎯 Planificación de Release 2.0
- 🏆 Retrospectiva del proyecto

---

## 🏗️ Arquitectura Técnica

### Arquitectura General del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ FaceRegister │ │  FaceLogin   │ │ OCRQuestionCreator   ││
│  │              │ │              │ │                      ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
│  ┌────────────────────────────┐ ┌──────────────────────────┐│
│  │ ImageAnalysisQuestionCreator│ │ObjectDetectionCreator    ││
│  │                            │ │                          ││
│  └────────────────────────────┘ └──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐│
│  │ /face/       │ │ /vision/     │ │ /vision/             ││
│  │  register    │ │  extract-text│ │  analyze-image       ││
│  │  login       │ │              │ │                      ││
│  └──────────────┘ └──────────────┘ └──────────────────────┘│
│  ┌──────────────────────────────┐                          │
│  │ /vision/detect-objects       │                          │
│  │                              │                          │
│  └──────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────────┐        ┌──────────────────────────────┐
│  FACIAL SERVICE     │        │   AZURE COGNITIVE SERVICES   │
│  (DeepFace)         │        │                              │
│                     │        │  ┌────────────────────────┐  │
│  ┌───────────────┐  │        │  │ Computer Vision OCR    │  │
│  │ VGG-Face      │  │        │  │                        │  │
│  │ Embeddings    │  │        │  └────────────────────────┘  │
│  └───────────────┘  │        │  ┌────────────────────────┐  │
│                     │        │  │ Analyze Image API      │  │
│  Azure Container    │        │  │                        │  │
│  Instances          │        │  └────────────────────────┘  │
└─────────────────────┘        │  ┌────────────────────────┐  │
         │                     │  │ Object Detection API   │  │
         │                     │  │                        │  │
         ▼                     │  └────────────────────────┘  │
┌─────────────────────┐        └──────────────────────────────┘
│  FIREBASE           │
│  ┌───────────────┐  │
│  │ Auth          │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │ Firestore     │  │
│  │ (Embeddings)  │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Flujo de Datos por Funcionalidad

#### 1. Reconocimiento Facial (HU-VC1)

**Registro:**
```
Usuario → Cámara Web → Base64 → /api/face/register
    → Facial Service (DeepFace) → Embedding VGG-Face
    → Firebase Firestore → Confirmación
```

**Login:**
```
Usuario → Cámara Web → Base64 + Email → /api/face/login
    → Buscar Usuario en Firebase Auth
    → Obtener Embedding Almacenado
    → Facial Service (Comparación) → Verificación
    → Generar Custom Token → Autenticación Exitosa
```

#### 2. OCR - Extracción de Texto (HU-VC2)

```
Usuario → Imagen → Base64 → /api/vision/extract-text
    → Azure Computer Vision OCR API
    → Procesamiento Asíncrono (analyze → results)
    → Extracción de Texto por Líneas
    → Texto Limpio + Metadatos → Usuario
    → Pre-llenar Formulario de Pregunta
```

#### 3. Análisis de Imágenes (HU-VC3)

```
Usuario → Imagen → Base64 → /api/vision/analyze-image
    → Azure Computer Vision Analyze API
    → Extracción: Description, Tags, Categories, Objects, Colors
    → Procesamiento y Ordenamiento por Confianza
    → Resultados Estructurados → Usuario
    → Generación Automática de Pregunta
    → Pre-llenar Formulario con Sugerencias
```

#### 4. Detección de Objetos (HU-VC4)

```
Usuario → Imagen → Base64 → /api/vision/detect-objects
    → Azure Computer Vision Object Detection API
    → Detección de Objetos + Bounding Boxes
    → Filtrado por Confianza
    → Agrupación por Tipo
    → Visualización con Bounding Boxes → Usuario
    → Generación de Pregunta (Identificación o Conteo)
    → Pre-llenar Formulario
```

### Stack Tecnológico Completo

#### Backend:
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Autenticación:** Firebase Admin SDK
- **Base de Datos:** Firebase Firestore
- **Validación:** express-validator
- **HTTP Client:** axios / node-fetch
- **Procesamiento de Imágenes:** Sharp (opcional)

#### Frontend:
- **Framework:** React 18+
- **Routing:** React Router v6
- **State Management:** Context API / Redux (opcional)
- **Styling:** TailwindCSS
- **HTTP Client:** axios
- **Media:** getUserMedia API (WebRTC)
- **Canvas:** HTML5 Canvas (para bounding boxes)

#### Servicios de IA:
- **DeepFace:** Python-based facial recognition library
- **Azure Computer Vision:** v3.2
  - OCR (Read API)
  - Analyze Image
  - Object Detection
- **Modelo Facial:** VGG-Face (embeddings de 128 dimensiones)

#### Infraestructura:
- **Hosting Backend:** Azure App Service / Cloud Run
- **Hosting Frontend:** Vercel / Netlify
- **Container Registry:** Azure Container Registry
- **Container Instances:** Azure Container Instances (facial-service)
- **Storage:** Firebase Storage (imágenes)
- **CI/CD:** GitHub Actions

#### DevOps:
- **Version Control:** Git + GitHub
- **CI/CD:** GitHub Actions (workflow automatizado)
- **Containers:** Docker
- **Monitoring:** Azure Application Insights
- **Logs:** Winston / Morgan

---

## ⚙️ Configuración del Proyecto

### Prerequisitos

```bash
# Node.js v18+
node --version

# npm v9+
npm --version

# Git
git --version

# Docker (para facial-service)
docker --version
```

### Variables de Entorno (.env)

```bash
# ==========================================
# FIREBASE CONFIGURATION
# ==========================================
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# ==========================================
# AZURE COMPUTER VISION
# ==========================================
AZURE_COMPUTER_VISION_KEY=your-azure-cv-key
AZURE_COMPUTER_VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/

# ==========================================
# DEEPFACE FACIAL SERVICE
# ==========================================
DEEPFACE_SERVICE_URL=https://your-facial-service.azurecontainer.io

# ==========================================
# SERVER CONFIGURATION
# ==========================================
PORT=3000
NODE_ENV=production

# ==========================================
# CORS
# ==========================================
FRONTEND_URL=https://your-frontend-domain.com

# ==========================================
# RATE LIMITING
# ==========================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Instalación Backend

```bash
# Clonar repositorio
git clone https://github.com/your-org/brainblitz.git
cd brainblitz/backend-v1

# Instalar dependencias
npm install

# Instalar dependencias específicas de Azure
npm install @azure/cognitiveservices-computervision @azure/ms-rest-js

# Instalar dependencias de Firebase
npm install firebase-admin

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

### Instalación Frontend

```bash
cd brainblitz/frontend-v2

# Instalar dependencias
npm install

# Instalar dependencias específicas
npm install axios react-router-dom

# Copiar y configurar variables de entorno
cp .env.example .env
# Configurar REACT_APP_API_URL

# Ejecutar en desarrollo
npm start

# Build para producción
npm run build
```

### Despliegue Facial Service (Docker)

```bash
cd brainblitz/facial-service

# Build imagen Docker
docker build -t facial-service:latest .

# Ejecutar localmente (testing)
docker run -p 5000:5000 facial-service:latest

# Push a Azure Container Registry
az acr login --name yourregistryname
docker tag facial-service:latest yourregistryname.azurecr.io/facial-service:latest
docker push yourregistryname.azurecr.io/facial-service:latest

# Desplegar en Azure Container Instances
az container create \
  --resource-group your-resource-group \
  --name facial-service \
  --image yourregistryname.azurecr.io/facial-service:latest \
  --dns-name-label facial-service-unique \
  --ports 5000
```

### Configuración de Azure Computer Vision

1. **Crear Recurso en Azure Portal:**
   - Ir a Azure Portal → Create Resource
   - Buscar "Computer Vision"
   - Crear recurso en región deseada
   - Obtener Key y Endpoint

2. **Configurar Variables de Entorno:**
   ```bash
   AZURE_COMPUTER_VISION_KEY=your-key-here
   AZURE_COMPUTER_VISION_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
   ```

3. **Verificar Conectividad:**
   ```bash
   curl -X POST "https://your-region.api.cognitive.microsoft.com/vision/v3.2/analyze?visualFeatures=Description" \
     -H "Ocp-Apim-Subscription-Key: your-key" \
     -H "Content-Type: application/octet-stream" \
     --data-binary @test-image.jpg
   ```

### GitHub Actions Workflow

El proyecto incluye un workflow automatizado que:

1. ✅ Crea el proyecto "Product Backlog" en GitHub Projects
2. ✅ Crea etiquetas de prioridad (Alta, Media, Baja)
3. ✅ Crea milestones para cada sprint
4. ✅ Crea todas las issues (HUs) con descripción completa
5. ✅ Añade las issues al proyecto automáticamente
6. ✅ Mueve las issues a la columna "Todo"
7. ✅ Crea ramas de trabajo para cada issue
8. ✅ Vincula ramas con issues mediante comentarios

**Para ejecutar:**
```bash
# Ir a GitHub → Actions → "🚀 Crear Backlog y Sprints del Proyecto"
# Click en "Run workflow"
```

---

## 📚 Documentación Adicional

### Endpoints API

Documentación completa disponible en:
- **Swagger UI:** `https://api.brainblitz.com/api-docs`
- **Postman Collection:** Disponible en `/docs/postman`

### Testing

```bash
# Ejecutar tests unitarios
npm test

# Ejecutar tests de integración
npm run test:integration

# Generar reporte de cobertura
npm run test:coverage
```

### Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
3. Hacer cambios y commit: `git commit -m "feat: descripción"`
4. Push a tu fork: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request hacia `main`

### Soporte

- **Issues:** https://github.com/your-org/brainblitz/issues
- **Discussions:** https://github.com/your-org/brainblitz/discussions
- **Email:** support@brainblitz.com

---

## 📄 Licencia

Este proyecto está licenciado bajo MIT License - ver archivo [LICENSE](LICENSE) para detalles.

---

## 👥 Equipo

- **Product Owner:** [Nombre]
- **Scrum Master:** [Nombre]
- **Desarrolladores:**
  - Backend: [Nombres]
  - Frontend: [Nombres]
  - DevOps: [Nombres]

---

**Última Actualización:** 15 Noviembre 2025  
**Versión del Documento:** 1.0  
**Estado del Proyecto:** En Desarrollo Activo 🚀

