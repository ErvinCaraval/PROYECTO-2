const rateLimit = require('express-rate-limit');

// Rate limiter para registro de usuarios
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 5 intentos de registro por IP cada 15 minutos
  message: {
    error: 'Demasiados intentos de registro. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar todos los requests
});

// ✅ SECURITY FIX: Rate limiter para login (verificación de credenciales)
// Protege contra ataques de fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // máximo 5 intentos de login por IP cada 15 minutos
  message: {
    error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar todos los requests (fallidos y exitosos)
});

// Rate limiter para recuperación de contraseña
const passwordRecoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // máximo 3 intentos de recuperación por IP cada 15 minutos
  message: {
    error: 'Demasiados intentos de recuperación de contraseña. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Contar todos los requests
});

// Rate limiter para actualización de perfil
const profileUpdateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 30, // máximo 10 actualizaciones por IP cada 5 minutos
  message: {
    error: 'Demasiadas actualizaciones de perfil. Intenta de nuevo en 5 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter general para endpoints de usuarios
const generalUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP cada 15 minutos
  message: {
    error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  registerLimiter,
  loginLimiter,
  passwordRecoveryLimiter,
  profileUpdateLimiter,
  generalUserLimiter
};
