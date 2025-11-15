/**
 * Controlador para autenticación facial
 * Maneja registro y login facial
 */
const deepfaceService = require('../services/deepface.service');
const firebaseFaceService = require('../services/firebase.service');
const { auth } = require('../firebase');

class FaceController {
  /**
   * Registra la cara de un usuario
   * POST /api/face/register
   */
  async register(req, res) {
    try {
      const { image, token } = req.body;

      // Validaciones
      if (!image) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere una imagen en Base64'
        });
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Se requiere un token de autenticación'
        });
      }

      // Verificar token de Firebase
      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(token);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido o expirado'
        });
      }

      const userId = decodedToken.uid;

      // Verificar si el usuario ya tiene registro facial
      const hasRegistration = await firebaseFaceService.hasFaceRegistration(userId);
      if (hasRegistration) {
        return res.status(400).json({
          success: false,
          error: 'El usuario ya tiene un registro facial. Elimina el registro anterior para crear uno nuevo.'
        });
      }

      // Enviar imagen al microservicio DeepFace para validación y generación de embeddings
      let registerResult;
      try {
        registerResult = await deepfaceService.registerFace(image, userId);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      if (!registerResult.success) {
        return res.status(400).json({
          success: false,
          error: registerResult.message || 'Error en el registro facial'
        });
      }

      if (!registerResult.faceDetected) {
        return res.status(400).json({
          success: false,
          error: 'No se detectó una cara en la imagen. Por favor, asegúrate de que tu rostro sea claramente visible.'
        });
      }

      // Guardar imagen en Firestore (Base64)
      await firebaseFaceService.saveFaceImage(
        userId,
        image,
        registerResult.embedding
      );

      res.status(201).json({
        success: true,
        message: 'Registro facial completado exitosamente',
        userId,
        registeredAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error en registro facial:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  }

  /**
   * Login facial
   * POST /api/face/login
   */
  async login(req, res) {
    try {
      const { image, email } = req.body;

      // Validaciones
      if (!image) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere una imagen en Base64'
        });
      }

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el email del usuario'
        });
      }

      // Obtener usuario por email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(email);
      } catch (error) {
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
      }

      const userId = userRecord.uid;

      // Verificar si el usuario tiene registro facial
      const hasRegistration = await firebaseFaceService.hasFaceRegistration(userId);
      if (!hasRegistration) {
        return res.status(400).json({
          success: false,
          error: 'El usuario no tiene un registro facial. Por favor, regístrate primero.'
        });
      }

      // Obtener imagen guardada del usuario
      let savedImage;
      try {
        savedImage = await firebaseFaceService.getFaceImage(userId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      // Enviar ambas imágenes al microservicio DeepFace para verificación
      let verifyResult;
      try {
        verifyResult = await deepfaceService.verifyFace(savedImage, image);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }

      if (!verifyResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Error en la verificación facial'
        });
      }

      if (!verifyResult.faceDetected) {
        return res.status(400).json({
          success: false,
          error: 'No se detectó una cara en la imagen. Por favor, asegúrate de que tu rostro sea claramente visible.'
        });
      }

      // Verificar si las caras coinciden
      if (!verifyResult.verified) {
        return res.status(401).json({
          success: false,
          verified: false,
          error: 'Las caras no coinciden. Acceso denegado.',
          confidence: verifyResult.confidence
        });
      }

      // Login exitoso - generar token personalizado de Firebase
      let customToken;
      try {
        customToken = await auth.createCustomToken(userId);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: 'Error generando token de autenticación'
        });
      }

      res.status(200).json({
        success: true,
        verified: true,
        message: 'Login facial exitoso',
        userId,
        customToken,
        confidence: verifyResult.confidence,
        distance: verifyResult.distance
      });
    } catch (error) {
      console.error('Error en login facial:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  }
}

module.exports = new FaceController();

