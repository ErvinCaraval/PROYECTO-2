# 📊 Ejemplos de Respuestas - Vision API

## 1. Endpoint: POST /api/vision/detect-objects

### Request
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "minConfidence": 0.5,
  "language": "es"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "detection": {
    "objects": [
      {
        "id": 0,
        "name": "guitarra",
        "confidence": 0.95,
        "rectangle": {
          "x": 50,
          "y": 100,
          "w": 200,
          "h": 250
        },
        "normalizedRectangle": {
          "x": 0.025,
          "y": 0.05,
          "w": 0.1,
          "h": 0.125
        },
        "area": 50000,
        "parent": null
      },
      {
        "id": 1,
        "name": "persona",
        "confidence": 0.87,
        "rectangle": {
          "x": 300,
          "y": 50,
          "w": 150,
          "h": 400
        },
        "normalizedRectangle": {
          "x": 0.15,
          "y": 0.025,
          "w": 0.075,
          "h": 0.2
        },
        "area": 60000,
        "parent": null
      }
    ],
    "objectCounts": {
      "guitarra": 1,
      "persona": 1
    },
    "groupedByType": {
      "guitarra": [
        {
          "id": 0,
          "name": "guitarra",
          "confidence": 0.95,
          "rectangle": { ... }
        }
      ],
      "persona": [
        {
          "id": 1,
          "name": "persona",
          "confidence": 0.87,
          "rectangle": { ... }
        }
      ]
    },
    "stats": {
      "totalObjects": 2,
      "totalTypes": 2,
      "averageConfidence": 0.91,
      "maxConfidence": 0.95,
      "minConfidence": 0.87
    },
    "topObjects": [
      {
        "name": "guitarra",
        "confidence": 0.95,
        "count": 1
      },
      {
        "name": "persona",
        "confidence": 0.87,
        "count": 1
      }
    ],
    "metadata": {
      "width": 2000,
      "height": 2000,
      "service": "Azure Computer Vision v3.2",
      "timestamp": "2025-11-24T15:30:45.123Z",
      "language": "es",
      "minConfidenceThreshold": 0.5,
      "detectionMode": "objects"
    },
    "objectSummary": {
      "mostConfidentObject": {
        "name": "guitarra",
        "confidence": 0.95,
        "count": 1
      },
      "topThreeObjects": [
        {
          "name": "guitarra",
          "confidence": 0.95,
          "count": 1
        },
        {
          "name": "persona",
          "confidence": 0.87,
          "count": 1
        }
      ],
      "allDetectedTypes": ["guitarra", "persona"],
      "objectStatistics": [
        {
          "name": "guitarra",
          "count": 1
        },
        {
          "name": "persona",
          "count": 1
        }
      ],
      "confidence": {
        "average": "91.0",
        "max": "95.0",
        "min": "87.0"
      },
      "summary": {
        "totalObjects": 2,
        "uniqueTypes": 2,
        "mostCommonType": "guitarra",
        "qualityScore": "91% confianza"
      }
    }
  },
  "questionSuggestions": {
    "identification": {
      "type": "identification",
      "question": "¿Qué objeto principal aparece en esta imagen?",
      "description": "Se detectó principalmente: guitarra",
      "options": [
        {
          "text": "guitarra",
          "confidence": 0.95,
          "count": 1,
          "isCorrect": true
        },
        {
          "text": "persona",
          "confidence": 0.87,
          "count": 1,
          "isCorrect": false
        }
      ],
      "correctAnswer": "guitarra",
      "explanation": "Se detectaron 2 objeto(s) en total. El más confiable es \"guitarra\" con 95% de confianza.",
      "difficulty": "fácil"
    },
    "counting": {
      "type": "counting",
      "question": "¿Cuántas guitarra(s) hay en la imagen?",
      "description": "Total detectado: 1",
      "options": [
        {
          "text": "0",
          "isCorrect": false
        },
        {
          "text": "1",
          "isCorrect": true
        },
        {
          "text": "2",
          "isCorrect": false
        },
        {
          "text": "3",
          "isCorrect": false
        },
        {
          "text": "4+",
          "isCorrect": false
        }
      ],
      "correctAnswer": "1",
      "explanation": "Se detectó(ron) 1 guitarra(s) en la imagen.",
      "difficulty": "fácil"
    },
    "multipleChoice": {
      "type": "multipleChoice",
      "question": "¿Cuál de estos objetos aparece en la imagen?",
      "description": "Selecciona de la lista detectada",
      "detectedObjects": ["guitarra", "persona"],
      "notDetectedExamples": ["árbol", "coche"],
      "explanation": "Objetos detectados en la imagen: guitarra (1), persona (1)",
      "difficulty": "media"
    },
    "metadata": {
      "totalObjectTypes": 2,
      "totalObjects": 2,
      "averageConfidence": "91.0",
      "timestamp": "2025-11-24T15:30:45.123Z"
    }
  },
  "cost": {
    "usd": 0.0005,
    "note": "Each detection costs approximately $0.0005 USD"
  },
  "processedAt": "2025-11-24T15:30:45.123Z",
  "language": "es"
}
```

---

## 2. Endpoint: POST /api/vision/analyze-image

### Request
```json
{
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "language": "es"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "analysis": {
    "description": {
      "primary": {
        "text": "Un grupo de personas disfrutando de música en una fiesta",
        "confidence": 0.92
      },
      "captions": [
        {
          "text": "Un grupo de personas disfrutando de música en una fiesta",
          "confidence": 0.92
        },
        {
          "text": "Personas tocando instrumentos musicales",
          "confidence": 0.85
        }
      ],
      "tags": ["música", "fiesta", "instrumentos"]
    },
    "tags": [
      {
        "name": "música",
        "confidence": 0.94
      },
      {
        "name": "guitarra",
        "confidence": 0.89
      },
      {
        "name": "persona",
        "confidence": 0.87
      },
      {
        "name": "fiesta",
        "confidence": 0.82
      }
    ],
    "categories": [
      {
        "name": "people",
        "confidence": 0.91,
        "detail": null
      },
      {
        "name": "indoor",
        "confidence": 0.78,
        "detail": null
      }
    ],
    "objects": [
      {
        "name": "guitarra",
        "confidence": 0.95,
        "rectangle": {
          "x": 50,
          "y": 100,
          "w": 200,
          "h": 250
        },
        "parent": null
      },
      {
        "name": "persona",
        "confidence": 0.87,
        "rectangle": {
          "x": 300,
          "y": 50,
          "w": 150,
          "h": 400
        },
        "parent": null
      }
    ],
    "colors": {
      "dominantColors": ["marrón", "negro", "rojo"],
      "accentColor": "rojo",
      "dominantForegroundColor": "marrón",
      "dominantBackgroundColor": "negro",
      "isBWImg": false
    },
    "metadata": {
      "width": 2000,
      "height": 2000
    },
    "objectSummary": [
      {
        "name": "guitarra",
        "count": 1
      },
      {
        "name": "persona",
        "count": 2
      }
    ]
  },
  "questionSuggestions": {
    "question": "¿Qué se muestra en esta imagen?",
    "descriptionContext": "Un grupo de personas disfrutando de música en una fiesta",
    "categorySuggestion": "people",
    "options": ["música", "guitarra", "persona", "fiesta"],
    "suggestedAnswer": "música",
    "confidence": 0.92
  },
  "processedAt": "2025-11-24T15:30:45.123Z",
  "language": "es"
}
```

---

## 3. Comparación: HU-VC3 vs HU-VC4

| Aspecto | HU-VC3 (Analyze) | HU-VC4 (Detect Objects) |
|---------|-----------------|------------------------|
| **Datos retornados** | Descripción, tags, categorías, colores, objetos | Objetos, conteos, estadísticas, sugerencias |
| **Propósito** | Análisis general de imagen | Detección y conteo específico de objetos |
| **Tipos de preguntas** | 1 tipo general | 3 tipos (identificación, conteo, opción múltiple) |
| **Filtrado** | No configurable | `minConfidence`, `objectName` |
| **Bounding boxes** | Simple | Con normalización (píxeles + 0-1) |
| **Estadísticas** | Básicas | Completas (avg, max, min, total types) |

---

## 4. Estructura de Mejoras Realizadas

### Backend (✅ Implementado)
- **Normalización de bounding boxes:** Píxeles + coordenadas 0-1
- **Sugerencias mejoradas:** Descripción, dificultad, contexto
- **Resumen enriquecido:** Top 3 objetos, quality score, summary
- **Parámetros dinámicos:** `minConfidence`, `objectName`, `language`

### Frontend (⚠️ Próxima Iteración)
- Visualización de bounding boxes con Canvas API
- Interactividad: hover, filtros, zoom
- Integración con AIQuestionGenerator
- Selección de tipo de pregunta sugerida

