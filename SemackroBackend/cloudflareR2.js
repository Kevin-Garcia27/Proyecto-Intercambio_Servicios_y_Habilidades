// cloudflareR2.js
// ========================================
// Configuración de Cloudflare R2 Storage
// ========================================

const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Configurar cliente S3 para Cloudflare R2
const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// Nombre del bucket
const BUCKET_NAME = process.env.R2_BUCKET_NAME;

// URL pública del bucket
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Subir un archivo a Cloudflare R2
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} fileName - Nombre del archivo
 * @param {string} contentType - Tipo de contenido (ej: 'image/jpeg')
 * @returns {Promise<string>} - URL pública de la imagen
 */
async function uploadToR2(fileBuffer, fileName, contentType) {
    try {
        // Generar nombre único con timestamp
        const timestamp = Date.now();
        const uniqueFileName = `${timestamp}-${fileName}`;

        // Comando para subir el archivo
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: uniqueFileName,
            Body: fileBuffer,
            ContentType: contentType,
        });

        // Subir a R2
        await r2Client.send(command);

        // Construir URL pública
        const publicUrl = `${PUBLIC_URL}/${uniqueFileName}`;

        return publicUrl;

    } catch (error) {
        console.error('Error al subir archivo a R2:', error);
        throw error;
    }
}

/**
 * Listar todas las imágenes en el bucket
 * @returns {Promise<Array>} - Lista de URLs de imágenes
 */
async function listImagesFromR2() {
    try {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
        });

        const response = await r2Client.send(command);

        // Convertir las claves (keys) a URLs públicas
        const imageUrls = (response.Contents || []).map(item => ({
            url: `${PUBLIC_URL}/${item.Key}`,
            fileName: item.Key,
            size: item.Size,
            lastModified: item.LastModified
        }));

        return imageUrls;

    } catch (error) {
        console.error('Error al listar imágenes de R2:', error);
        throw error;
    }
}

/**
 * Eliminar un archivo de Cloudflare R2
 * @param {string} imageUrl - URL completa de la imagen a eliminar
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function deleteFromR2(imageUrl) {
    try {
        // Extraer el nombre del archivo de la URL
        // Ejemplo: https://pub-ada139691018466fa48df5ea9f22ee6c.r2.dev/1729267890123-foto.jpg
        // Resultado: 1729267890123-foto.jpg
        const fileName = imageUrl.split('/').pop();

        if (!fileName) {
            throw new Error('No se pudo extraer el nombre del archivo de la URL');
        }

        // Comando para eliminar el archivo
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
        });

        // Eliminar de R2
        await r2Client.send(command);

        console.log(`Archivo eliminado de R2: ${fileName}`);
        return true;

    } catch (error) {
        console.error('Error al eliminar archivo de R2:', error);
        throw error;
    }
}

/**
 * Extraer nombre de archivo de una URL de R2
 * @param {string} imageUrl - URL completa de la imagen
 * @returns {string|null} - Nombre del archivo o null
 */
function extractFileNameFromUrl(imageUrl) {
    try {
        if (!imageUrl || typeof imageUrl !== 'string') {
            return null;
        }
        
        // Verificar que sea una URL de nuestro bucket
        if (!imageUrl.startsWith(PUBLIC_URL)) {
            return null;
        }
        
        const fileName = imageUrl.split('/').pop();
        return fileName || null;
    } catch (error) {
        console.error('Error al extraer nombre de archivo:', error);
        return null;
    }
}

module.exports = {
    uploadToR2,
    listImagesFromR2,
    deleteFromR2,
    extractFileNameFromUrl,
    r2Client,
    BUCKET_NAME,
    PUBLIC_URL
};
