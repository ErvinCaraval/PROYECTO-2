/**
 * @swagger
 * /api/vision/detect-objects:
 *   post:
 *     summary: "HU-VC4 - Detectar objetos en imágenes"
 *     description: "Detecta y localiza objetos específicos en imágenes usando Azure Computer Vision. Permite crear preguntas interactivas basadas en objetos detectados."
 *     tags:
 *       - Vision
 *       - Object Detection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageBase64
 *             properties:
 *               imageBase64:
 *                 type: string
 *                 description: "Imagen codificada en base64. Formato: 'data:image/jpeg;base64,...'"
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
 *               imageUrl:
 *                 type: string
 *                 description: "URL pública de la imagen (alternativa a imageBase64)"
 *                 example: "https://example.com/image.jpg"
 *               minConfidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 default: 0.5
 *                 description: "Umbral mínimo de confianza para incluir objetos detectados"
 *                 example: 0.6
 *               language:
 *                 type: string
 *                 default: "es"
 *                 description: "Idioma para las etiquetas de objetos"
 *                 enum: ["es", "en", "fr", "de", "pt", "it"]
 *               objectName:
 *                 type: string
 *                 description: "Filtrar por nombre específico de objeto (ej: 'guitar')"
 *                 example: "guitar"
 *     responses:
 *       200:
 *         description: "Detección exitosa"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 detection:
 *                   type: object
 *                   properties:
 *                     objects:
 *                       type: array
 *                       description: "Lista de objetos detectados"
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                             example: 0
 *                           name:
 *                             type: string
 *                             example: "guitar"
 *                           confidence:
 *                             type: number
 *                             minimum: 0
 *                             maximum: 1
 *                             example: 0.98
 *                           rectangle:
 *                             type: object
 *                             properties:
 *                               x:
 *                                 type: number
 *                                 description: "Coordenada X del bounding box"
 *                                 example: 150
 *                               y:
 *                                 type: number
 *                                 description: "Coordenada Y del bounding box"
 *                                 example: 200
 *                               w:
 *                                 type: number
 *                                 description: "Ancho del bounding box"
 *                                 example: 400
 *                               h:
 *                                 type: number
 *                                 description: "Alto del bounding box"
 *                                 example: 600
 *                           area:
 *                             type: number
 *                             description: "Área calculada del bounding box"
 *                             example: 240000
 *                     objectCounts:
 *                       type: object
 *                       description: "Conteo de objetos por tipo"
 *                       example:
 *                         guitar: 1
 *                         person: 2
 *                         piano: 1
 *                     groupedByType:
 *                       type: object
 *                       description: "Objetos agrupados por tipo"
 *                       example:
 *                         guitar:
 *                           - id: 0
 *                             name: "guitar"
 *                             confidence: 0.98
 *                     stats:
 *                       type: object
 *                       description: "Estadísticas de detección"
 *                       properties:
 *                         totalObjects:
 *                           type: number
 *                           example: 4
 *                         totalTypes:
 *                           type: number
 *                           example: 3
 *                         averageConfidence:
 *                           type: number
 *                           example: 0.92
 *                         maxConfidence:
 *                           type: number
 *                           example: 0.98
 *                         minConfidence:
 *                           type: number
 *                           example: 0.87
 *                     topObjects:
 *                       type: array
 *                       description: "Top 5 objetos más confiables"
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           confidence:
 *                             type: number
 *                           count:
 *                             type: number
 *                     metadata:
 *                       type: object
 *                       description: "Metadatos de la detección"
 *                       properties:
 *                         width:
 *                           type: number
 *                           example: 1920
 *                         height:
 *                           type: number
 *                           example: 1440
 *                         service:
 *                           type: string
 *                           example: "Azure Computer Vision v3.2"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                         minConfidenceThreshold:
 *                           type: number
 *                           example: 0.5
 *                 questionSuggestions:
 *                   type: object
 *                   description: "Sugerencias automáticas de preguntas"
 *                   properties:
 *                     identification:
 *                       type: object
 *                       description: "Pregunta de identificación"
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "identification"
 *                         question:
 *                           type: string
 *                           example: "¿Qué objeto aparece en esta imagen?"
 *                         options:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               text:
 *                                 type: string
 *                               confidence:
 *                                 type: number
 *                               isCorrect:
 *                                 type: boolean
 *                         correctAnswer:
 *                           type: string
 *                         explanation:
 *                           type: string
 *                     counting:
 *                       type: object
 *                       description: "Pregunta de conteo"
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "counting"
 *                         question:
 *                           type: string
 *                           example: "¿Cuántos guitar(s) hay en la imagen?"
 *                         options:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["0", "1", "2", "3", "4+"]
 *                         correctAnswer:
 *                           type: string
 *                           example: "1"
 *                     multipleChoice:
 *                       type: object
 *                       description: "Pregunta de opción múltiple"
 *                       nullable: true
 *                 cost:
 *                   type: object
 *                   description: "Información de costos"
 *                   properties:
 *                     usd:
 *                       type: number
 *                       example: 0.0005
 *                     note:
 *                       type: string
 *                 processedAt:
 *                   type: string
 *                   format: date-time
 *                 language:
 *                   type: string
 *                   example: "es"
 *       400:
 *         description: "Error en la solicitud"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                   enum:
 *                     - MISSING_IMAGE
 *                     - IMAGE_TOO_LARGE
 *                     - INVALID_IMAGE_TYPE
 *                     - INVALID_CONFIDENCE
 *       401:
 *         description: "No autenticado"
 *       403:
 *         description: "No autorizado"
 *       429:
 *         description: "Límite de tasa excedido"
 *       503:
 *         description: "Servicio no disponible"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *                   example: "SERVICE_UNAVAILABLE"
 *     examples:
 *       request:
 *         description: "Ejemplo de solicitud"
 *         value:
 *           imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/..."
 *           minConfidence: 0.5
 *           language: "es"
 *       response_success:
 *         description: "Ejemplo de respuesta exitosa"
 *         value:
 *           success: true
 *           detection:
 *             objects:
 *               - id: 0
 *                 name: "guitar"
 *                 confidence: 0.98
 *                 rectangle:
 *                   x: 150
 *                   y: 200
 *                   w: 400
 *                   h: 600
 *                 area: 240000
 *             objectCounts:
 *               guitar: 1
 *             stats:
 *               totalObjects: 1
 *               totalTypes: 1
 *               averageConfidence: 0.98
 *               maxConfidence: 0.98
 *               minConfidence: 0.98
 *             topObjects:
 *               - name: "guitar"
 *                 confidence: 0.98
 *                 count: 1
 *           questionSuggestions:
 *             identification:
 *               type: "identification"
 *               question: "¿Qué objeto aparece en esta imagen?"
 *               options:
 *                 - text: "guitar"
 *                   confidence: 0.98
 *                   isCorrect: true
 *               correctAnswer: "guitar"
 *           cost:
 *             usd: 0.0005
 *           processedAt: "2025-11-24T10:30:00.000Z"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DetectedObject:
 *       type: object
 *       description: "Objeto detectado en una imagen"
 *       properties:
 *         id:
 *           type: number
 *           description: "ID único del objeto detectado"
 *         name:
 *           type: string
 *           description: "Nombre/etiqueta del objeto"
 *         confidence:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: "Nivel de confianza (0-1)"
 *         rectangle:
 *           type: object
 *           description: "Bounding box del objeto"
 *           properties:
 *             x:
 *               type: number
 *             y:
 *               type: number
 *             w:
 *               type: number
 *             h:
 *               type: number
 *         area:
 *           type: number
 *           description: "Área del objeto en píxeles"
 *     ObjectDetectionStats:
 *       type: object
 *       description: "Estadísticas de detección de objetos"
 *       properties:
 *         totalObjects:
 *           type: number
 *           description: "Total de objetos detectados"
 *         totalTypes:
 *           type: number
 *           description: "Cantidad de tipos únicos de objetos"
 *         averageConfidence:
 *           type: number
 *           description: "Confianza promedio"
 *         maxConfidence:
 *           type: number
 *           description: "Confianza máxima"
 *         minConfidence:
 *           type: number
 *           description: "Confianza mínima"
 *     QuestionSuggestion:
 *       type: object
 *       description: "Sugerencia de pregunta generada automáticamente"
 *       properties:
 *         type:
 *           type: string
 *           enum: ["identification", "counting", "multipleChoice"]
 *         question:
 *           type: string
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         correctAnswer:
 *           type: string
 *         explanation:
 *           type: string
 */

/**
 * HU-VC4: Detección de Objetos en Imágenes
 * 
 * OBJETIVO:
 * Implementar un sistema de detección de objetos que identifique y localice objetos específicos
 * dentro de imágenes, permitiendo crear preguntas interactivas basadas en la detección de objetos
 * y mejorar la experiencia de preguntas visuales.
 * 
 * CARACTERÍSTICAS:
 * ✅ Detección de múltiples objetos en una imagen
 * ✅ Localización de objetos con bounding boxes
 * ✅ Filtrado por nivel de confianza
 * ✅ Conteo de objetos por tipo
 * ✅ Generación automática de preguntas (identificación y conteo)
 * ✅ Soporte para múltiples idiomas
 * ✅ Estadísticas detalladas de detección
 * ✅ API profesional con validaciones robustas
 * ✅ Integración con Azure Computer Vision v3.2
 * ✅ Autenticación requerida
 * 
 * CASOS DE USO:
 * 1. Preguntas de identificación: "¿Qué objeto aparece?"
 * 2. Preguntas de conteo: "¿Cuántos objetos hay?"
 * 3. Preguntas de localización: "¿Dónde está el objeto?"
 * 4. Análisis educativo: Identificar elementos en imágenes científicas
 * 
 * TECNOLOGÍA:
 * - Backend: Node.js + Express
 * - IA: Azure Computer Vision v3.2
 * - Frontend: React + Canvas para visualización
 * - Almacenamiento: Base de datos MongoDB
 * 
 * CRITERIOS DE ACEPTACIÓN CUMPLIDOS:
 * ✅ Configuración de Azure (variables de entorno)
 * ✅ Endpoint backend POST /api/vision/detect-objects
 * ✅ Autenticación requerida
 * ✅ Validación de imagen (Base64, max 4MB)
 * ✅ Integración con Azure Object Detection
 * ✅ Extracción de objetos con confianza y bounding boxes
 * ✅ Respuesta JSON estructurada
 * ✅ Parámetros opcionales (minConfidence, objectName, language)
 * ✅ Conteo y agrupación de objetos
 * ✅ Manejo robusto de errores
 * ✅ Logging detallado
 * ✅ Tests unitarios e integración
 * ✅ Componente frontend profesional (ObjectDetectionQuestionCreator)
 * ✅ Visualización con Canvas y bounding boxes
 * ✅ Interactividad completa
 * ✅ Generación automática de preguntas
 * ✅ Integración con AIQuestionGenerator
 * ✅ Documentación Swagger
 * 
 * ENDPOINTS:
 * POST /api/vision/detect-objects - Detectar objetos en una imagen
 * 
 * FLUJO DE USUARIO:
 * 1. Profesor accede a "Crear Pregunta con Detección de Objetos"
 * 2. Sube una imagen (JPG, PNG, WebP, max 4MB)
 * 3. Sistema detecta automáticamente todos los objetos
 * 4. Se muestran objetos con bounding boxes en canvas
 * 5. Profesor selecciona un objeto
 * 6. Elige tipo de pregunta (identificación o conteo)
 * 7. Sistema genera pregunta y opciones automáticamente
 * 8. Profesor revisa y confirma
 * 9. Pregunta se guarda en base de datos
 * 10. En el juego, estudiantes responden identificando/contando objetos
 */
