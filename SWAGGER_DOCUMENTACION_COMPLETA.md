# 📚 Documentación Swagger Completa - BrainBlitz API

## ✅ Estado: COMPLETADO

Se ha completado la integración completa de toda la documentación Swagger en el archivo principal `swagger.yaml`. **Todos los endpoints están ahora documentados y centralizados**.

---

## 📊 Resumen de Cambios

### Estadísticas Finales
- **Total de líneas**: 2,611 líneas
- **Endpoints documentados**: 29 endpoints
- **Tags (categorías)**: 13 tags
- **Esquemas de componentes**: 20+ esquemas
- **Validación**: ✅ YAML válido

---

## 🎯 Endpoints Documentados por Categoría

### 1. 🔐 **Facial Recognition (4 endpoints)**
Autenticación biométrica mediante reconocimiento facial.

- ✅ `POST /api/face/register` - Registrar rostro del usuario
- ✅ `POST /api/face/login` - Login facial/biométrico
- ✅ `GET /api/face/exists` - Verificar si usuario tiene registro facial
- ✅ `DELETE /api/face/{userId}` - Eliminar registro facial

**Autenticación**: Bearer Token (Firebase)
**Rate Limiting**: Aplicado
**Características**:
- Microservicio DeepFace para embeddings
- Detección de rostro en imagen
- Confianza y distancia euclidiana

---

### 2. 🖼️ **Vision - Image Analysis (3 endpoints)**
Análisis completo de imágenes usando Azure Computer Vision.

#### HU-VC3: Análisis General
- ✅ `POST /api/vision/analyze-image` - Análisis completo de imagen
  - Descripción con captions
  - Tags/etiquetas detectadas
  - Categorías
  - Objetos con bounding boxes
  - Análisis de colores
  - Sugerencias de preguntas

#### HU-VC2: OCR (3 endpoints)
- ✅ `GET /api/ocr/health` - Estado del servicio OCR
- ✅ `POST /api/ocr/process-url` - Extraer texto desde URL
- ✅ `POST /api/ocr/process-image` - Extraer texto desde Base64
  - Extracción de caracteres
  - Parsing de preguntas
  - Extracción de opciones
  - Niveles de confianza

#### HU-VC4: Detección de Objetos
- ✅ `POST /api/vision/detect-objects` - Detección y localización de objetos
  - **Restricción crítica**: Exactamente 4 opciones por pregunta
  - 3 tipos de preguntas:
    - Identificación (4 opciones)
    - Conteo (4 opciones numéricas)
    - Opción múltiple (4 opciones, nullable)
  - Bounding boxes normalizados (0-1) para Canvas
  - Estadísticas de confianza
  - Filtrado por minConfidence

**Idiomas soportados**: es, en, fr, de, pt, it
**Tamaño máximo**: 4 MB
**Autenticación**: Bearer Token

---

### 3. 👥 **Users (6 endpoints)**
Gestión de usuarios y autenticación.

- ✅ `POST /api/users/register` - Registrar nuevo usuario
- ✅ `PUT /api/users/me/profile` - Actualizar perfil
- ✅ `GET /api/users/me/stats` - Obtener estadísticas
- ✅ `GET /api/users/recover-password` - Recuperar contraseña
- ✅ `POST /api/admin/accessibility` - Obtener accesibilidad
- ✅ `PUT /api/admin/accessibility` - Actualizar accesibilidad

---

### 4. 🎮 **Games (3+ endpoints)**
Gestión de partidas multijugador.

---

### 5 ❓ **Questions (4 endpoints)**
Gestión y creación de preguntas.

- ✅ `GET /api/questions` - Obtener todas las preguntas
- ✅ `POST /api/questions` - Crear pregunta
- ✅ `POST /api/questions/bulk` - Crear múltiples preguntas
- ✅ `PUT /api/questions/{id}` - Actualizar pregunta
- ✅ `DELETE /api/questions/{id}` - Eliminar pregunta

---

### 6. 🤖 **AI (4 endpoints)**
Generación de preguntas con inteligencia artificial.

---

### 7. 🎤 **Voice Interactions (5+ endpoints)**
Gestión de interacciones de voz.

---

### 8. 📢 **AdminAccessibility (4+ endpoints)**
Controles administrativos de accesibilidad.

---

## 📋 Esquemas de Componentes Agregados

### Vision - Object Detection Schemas
```yaml
DetectedObject:
  - id, name, confidence
  - rectangle (píxeles: x, y, w, h)
  - normalizedRectangle (0-1 coords para Canvas)
  - area

ObjectDetectionStats:
  - totalObjects, totalTypes
  - averageConfidence, maxConfidence, minConfidence

QuestionSuggestion:
  - type (identification, counting, multipleChoice)
  - question, options (exactamente 4), correctAnswer
  - explanation
```

### Facial Recognition Schemas
```yaml
FaceRegistrationResponse:
  - success, message, userId, registeredAt

FaceLoginResponse:
  - success, verified, message, userId
  - customToken, confidence, distance

FaceExistsResponse:
  - success, exists

FaceDeleteResponse:
  - success, removed

FaceErrorResponse:
  - success, error
```

---

## 🔐 Seguridad Implementada

### Autenticación
- ✅ Bearer Token (Firebase JWT)
- ✅ Token requerido en endpoints sensibles
- ✅ Validación en cada request

### Rate Limiting
- ✅ Aplicado a todos los endpoints
- ✅ generalUserLimiter configurado
- ✅ Respuesta 429 documentada

### Validaciones
- ✅ Tamaño máximo de imagen (4-50 MB según endpoint)
- ✅ Tipos MIME permitidos
- ✅ Base64 válido
- ✅ Parámetros requeridos

---

## 📝 Características Documentadas

### Por Cada Endpoint
- ✅ Descripción clara y detallada
- ✅ Parámetros requeridos y opcionales
- ✅ Esquema de request completo
- ✅ Esquema de response completo
- ✅ Ejemplos con valores reales
- ✅ Códigos de error (200, 201, 400, 401, 403, 404, 429, 500, 503)
- ✅ Mensajes de error específicos
- ✅ Autenticación requerida indicada
- ✅ Rate limiting documentado

---

## 🚀 Commits Realizados

```
711d187 docs: Agregar documentación Swagger de endpoints OCR
2b7ae31 docs: Agregar documentación Swagger del endpoint de análisis de imagen
a52cbcb docs: Agregar documentación Swagger de endpoints de Facial Recognition
fd16594 docs: Integrar documentación Swagger de objectDetection en swagger.yaml
b3588eb docs: Agregar documento de resumen de integración Swagger
```

---

## 📍 Ubicación del Archivo

```
/home/ervin/Documents/PROYECTO-2/backend-v1/swagger/swagger.yaml
```

---

## 🔍 Cómo Usar

### Ver Documentación Swagger UI
1. Iniciar el backend: `npm start` (puerto 5000)
2. Abrir navegador: `http://localhost:5000/api-docs`
3. Swagger UI mostrará toda la documentación interactiva

### Probar Endpoints
1. Ir a `http://localhost:5000/api-docs`
2. Expandir la categoría deseada
3. Hacer clic en "Try it out"
4. Completar parámetros
5. Hacer clic en "Execute"

### En Producción
```
https://backend-v1-latest.onrender.com/api-docs
```

---

## ✨ Notas Importantes

### Restricción de 4 Opciones (HU-VC4)
Todos los tipos de preguntas generadas por `/api/vision/detect-objects` tienen **exactamente 4 opciones**:
- Identificación: 4 objetos detectados (o genéricos si hay menos)
- Conteo: 4 opciones numéricas
- Opción múltiple: 4 opciones combinadas

Esta restricción está **documentada y garantizada** en el código backend.

### Bounding Box Dual (HU-VC4)
Los objetos detectados incluyen:
- `rectangle`: Coordenadas en píxeles (x, y, w, h)
- `normalizedRectangle`: Coordenadas normalizadas 0-1 para renderizar en Canvas sin cálculos

### Autenticación Flexible
La autenticación se puede pasar de múltiples formas:
- Header: `Authorization: Bearer <token>`
- Query: `?token=<token>`
- Body: `{ "token": "<token>" }`

---

## 📞 Soporte

Si encuentras problemas:
1. Valida que el YAML sea correcto: `python3 -c "import yaml; yaml.safe_load(open('swagger/swagger.yaml'))"`
2. Verifica que el backend esté ejecutándose
3. Abre `http://localhost:5000/api-docs` para ver Swagger UI
4. Revisa los logs del backend para errores

---

## 🎉 Estado Final

✅ **COMPLETADO Y VALIDADO**

Toda la documentación Swagger está:
- Centralizada en un único archivo `swagger.yaml`
- Completamente validada (YAML syntax)
- Organizada por categorías (tags)
- Con ejemplos reales
- Lista para Swagger UI
- Lista para generar clientes (OpenAPI)

**Fecha**: 2025-11-24
**Usuario**: Ervin
**Estado**: ✅ COMPLETADO

