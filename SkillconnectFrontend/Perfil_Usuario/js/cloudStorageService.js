// Servicio de API para almacenamiento en la nube (Cloudflare R2)
const API_URL = 'http://localhost:3001/api';

/**
 * Obtener todas las imágenes de la galería
 */
export const obtenerImagenes = async () => {
  try {
    const response = await fetch(`${API_URL}/images`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error al obtener imágenes:', error);
    throw error;
  }
};

/**
 * Subir una imagen al almacenamiento
 * @param {File} file - Archivo de imagen a subir
 */
export const subirImagen = async (file) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw error;
  }
};

/**
 * Validar si una URL es de imagen válida
 * @param {string} url - URL a validar
 */
export const esUrlImagenValida = (url) => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
};

/**
 * Copiar texto al portapapeles
 * @param {string} text - Texto a copiar
 */
export const copiarAlPortapapeles = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error al copiar al portapapeles:', error);
    return false;
  }
};
