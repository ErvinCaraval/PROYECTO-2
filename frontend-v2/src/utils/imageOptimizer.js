/**
 * Utilidad para optimizar imágenes antes de enviarlas al servidor
 * Reduce el tamaño del archivo manteniendo calidad suficiente para reconocimiento facial
 */

/**
 * Optimiza una imagen Base64 reduciendo su tamaño
 * @param {string} base64String - Imagen en formato Base64
 * @param {number} maxWidth - Ancho máximo (default: 300 para reducir más el tamaño)
 * @param {number} maxHeight - Alto máximo (default: 300 para reducir más el tamaño)
 * @param {number} quality - Calidad JPEG (0-1, default: 0.6 para reducir más)
 * @returns {Promise<string>} Imagen optimizada en Base64
 */
export function optimizeImage(base64String, maxWidth = 300, maxHeight = 300, quality = 0.6) {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Crear canvas con dimensiones optimizadas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        
        // Mejorar calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a Base64 con calidad optimizada
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(reader.result);
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Error al optimizar la imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };
      
      // Cargar imagen desde Base64
      img.src = base64String;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Obtiene el tamaño aproximado de una imagen Base64 en KB
 * @param {string} base64String - Imagen en formato Base64
 * @returns {number} Tamaño en KB
 */
export function getImageSize(base64String) {
  if (!base64String) return 0;
  // Remover el prefijo data:image si existe
  const base64 = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  // Calcular tamaño aproximado (Base64 es ~33% más grande que el binario)
  return Math.round((base64.length * 3) / 4 / 1024);
}

