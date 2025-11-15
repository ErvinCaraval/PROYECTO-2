/**
 * Servicio para operaciones de Firebase relacionadas con autenticación facial
 * Maneja el almacenamiento y recuperación de imágenes faciales en Firestore
 */
const { db } = require('../firebase');

class FirebaseFaceService {
  /**
   * Guarda la imagen facial de un usuario en Firestore (Base64)
   * @param {string} userId - ID del usuario (UID de Firebase)
   * @param {string} imageBase64 - Imagen en formato Base64
   * @param {Object} embedding - Embedding facial (opcional)
   * @returns {Promise<Object>} Datos guardados
   */
  async saveFaceImage(userId, imageBase64, embedding = null) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error('Usuario no encontrado');
      }

      // Preparar datos de la imagen facial
      const faceData = {
        faceImage: imageBase64, // Guardar directamente en Base64
        faceEmbedding: embedding, // Embedding opcional
        faceRegisteredAt: new Date().toISOString(),
        faceRegistered: true
      };

      // Actualizar el documento del usuario
      await userRef.update(faceData);

      return {
        success: true,
        userId,
        registeredAt: faceData.faceRegisteredAt
      };
    } catch (error) {
      throw new Error(`Error guardando imagen facial: ${error.message}`);
    }
  }

  /**
   * Obtiene la imagen facial guardada de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<string>} Imagen en Base64
   */
  async getFaceImage(userId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userDoc.data();

      if (!userData.faceImage) {
        throw new Error('El usuario no tiene una imagen facial registrada');
      }

      if (!userData.faceRegistered) {
        throw new Error('El usuario no ha completado el registro facial');
      }

      return userData.faceImage; // Retorna Base64
    } catch (error) {
      throw new Error(`Error obteniendo imagen facial: ${error.message}`);
    }
  }

  /**
   * Verifica si un usuario tiene registro facial
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} true si tiene registro facial
   */
  async hasFaceRegistration(userId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return false;
      }

      const userData = userDoc.data();
      return userData.faceRegistered === true && !!userData.faceImage;
    } catch (error) {
      return false;
    }
  }

  /**
   * Elimina el registro facial de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteFaceRegistration(userId) {
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error('Usuario no encontrado');
      }

      await userRef.update({
        faceImage: null,
        faceEmbedding: null,
        faceRegistered: false,
        faceRegisteredAt: null
      });

      return {
        success: true,
        userId
      };
    } catch (error) {
      throw new Error(`Error eliminando registro facial: ${error.message}`);
    }
  }
}

module.exports = new FirebaseFaceService();

