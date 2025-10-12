# 🧪 Comandos de Pruebas - BrainBlitz Backend

## 🚀 **COMANDO PRINCIPAL - EJECUTAR TODO**

```bash
# Ejecutar TODAS las pruebas y validaciones en un solo comando
npm run test:everything
# o
npm run test:all
# o
./scripts/run-all-tests.sh
```

**Este comando ejecuta:**
- ✅ 15 pruebas unitarias diferentes
- ✅ Validación de sintaxis de todos los archivos
- ✅ Verificación de dependencias
- ✅ Validación de archivos requeridos
- ✅ Verificación de rutas registradas
- ✅ Validación de exports
- ✅ Verificación de middlewares
- ✅ Generación de reporte de cobertura
- ✅ Resumen completo con estadísticas

## 📋 **Comandos Específicos**

### Pruebas Unitarias
```bash
# Todas las pruebas unitarias
npm run test:unit

# Solo pruebas de voz
npm run test:voice

# Solo pruebas de usuarios (HU1)
npm run test:unit -- --testNamePattern="usersController"

# Solo pruebas de autenticación
npm run test:unit -- --testNamePattern="authenticate"

# Solo pruebas de rate limiting
npm run test:unit -- --testNamePattern="rateLimiter"
```

### Validaciones de Código
```bash
# Validación completa sin Firebase
npm run validate

# Validación completa con Firebase (requiere configuración)
npm run validate:full

# Solo verificación de sintaxis
npm run check:syntax

# Solo verificación de dependencias
npm run check:deps

# Solo verificación de archivos
npm run check:files

# Solo verificación de rutas
npm run check:routes

# Todas las verificaciones
npm run check:all
```

### Cobertura de Código
```bash
# Cobertura completa
npm run coverage

# Cobertura solo de APIs de voz
npm run coverage:voice

# Cobertura con reportes HTML y JSON
npm run test:unit -- --coverage --coverageReporters=json --coverageReporters=html
```

### Verificación Completa
```bash
# Verificación completa (recomendado)
npm run verify

# Verificación de APIs de voz
npm run test:voice:complete
```

## 🎯 **Comandos por Categoría**

### 🔧 **Desarrollo**
```bash
# Iniciar servidor
npm start

# Modo desarrollo con auto-reload
npm run dev

# Linting
npm run lint

# Linting con auto-fix
npm run lint:fix
```

### 🧪 **Testing**
```bash
# Pruebas básicas
npm test

# Pruebas unitarias
npm run test:unit

# Pruebas de integración
npm run test:integration

# Todas las pruebas
npm run test:all
```

### ✅ **Validación**
```bash
# Validación rápida
npm run validate

# Validación completa
npm run validate:full

# Verificación de código
npm run verify
```

## 📊 **Ejemplos de Uso**

### Antes de hacer commit
```bash
# Ejecutar validación completa
npm run test:everything
```

### Solo verificar APIs de voz
```bash
# Pruebas específicas de voz
npm run test:voice:complete
```

### Verificar que todo está bien
```bash
# Verificación rápida
npm run verify
```

### Generar reporte de cobertura
```bash
# Cobertura completa
npm run coverage

# Ver reporte en: coverage/index.html
```

## 🎉 **Comando Recomendado**

**Para máxima confianza, usa este comando:**

```bash
npm run test:everything
```

**Este comando te garantiza:**
- ✅ Todas las pruebas unitarias pasan
- ✅ El código es sintácticamente correcto
- ✅ Todas las dependencias están instaladas
- ✅ Los archivos requeridos existen
- ✅ Las rutas están registradas
- ✅ Los exports están correctos
- ✅ Los middlewares están aplicados
- ✅ Reporte de cobertura generado

## 🚨 **Si Algo Falla**

### Verificar errores específicos
```bash
# Ver errores de sintaxis
npm run check:syntax

# Ver dependencias faltantes
npm run check:deps

# Ver archivos faltantes
npm run check:files

# Ver rutas no registradas
npm run check:routes
```

### Ejecutar pruebas específicas
```bash
# Solo pruebas de voz
npm run test:voice

# Solo pruebas de usuarios
npm run test:unit -- --testNamePattern="usersController"
```

## 📈 **Interpretación de Resultados**

### ✅ **Éxito Total**
```
🎉 ¡TODAS LAS PRUEBAS Y VALIDACIONES PASARON!
✅ El código está 100% estable y listo para producción
🚀 EL CÓDIGO NO DEBERÍA FALLAR EN PRODUCCIÓN
🛡️  GARANTÍA DE ESTABILIDAD: 100%
```

### ⚠️ **Errores Detectados**
```
⚠️  X validaciones críticas fallaron
❌ El código necesita revisión antes de continuar
🔧 Ejecutar: npm run validate para más detalles
```

## 🎯 **Comandos Más Usados**

1. **`npm run test:everything`** - Ejecutar todo (recomendado)
2. **`npm run test:voice`** - Solo APIs de voz
3. **`npm run validate`** - Validación rápida
4. **`npm run verify`** - Verificación completa
5. **`npm run coverage`** - Reporte de cobertura