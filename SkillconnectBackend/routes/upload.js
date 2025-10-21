// upload.js
// ========================================
// API Upload - Subida de Imágenes a R2
// ========================================

const express = require('express');
const multer = require('multer');
const { uploadToR2, listImagesFromR2, deleteFromR2, extractFileNameFromUrl } = require('../cloudflareR2');

const router = express.Router();

// Configurar Multer para guardar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Límite de 5MB
    },
    fileFilter: (req, file, cb) => {
        // Aceptar solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'), false);
        }
    }
});

// ----------------------------------------------------
// ENDPOINT: Subir imagen a R2 (POST /api/upload)
// Soporta reemplazo automático si se envía oldImageUrl
// ----------------------------------------------------
router.post('/', upload.single('image'), async (req, res) => {
    try {
        // Verificar que se haya subido un archivo
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ninguna imagen'
            });
        }

        // Verificar si hay una imagen antigua para eliminar
        const oldImageUrl = req.body.oldImageUrl;
        
        if (oldImageUrl) {
            try {
                // Eliminar imagen antigua de R2
                await deleteFromR2(oldImageUrl);
                console.log('Imagen antigua eliminada:', oldImageUrl);
            } catch (deleteError) {
                console.error('Error al eliminar imagen antigua (continuando):', deleteError);
                // Continuar aunque falle la eliminación de la imagen antigua
            }
        }

        // Subir nueva imagen a Cloudflare R2
        const imageUrl = await uploadToR2(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
        );

        // Responder con la URL de la imagen
        res.json({
            success: true,
            message: 'Imagen subida exitosamente',
            url: imageUrl,
            fileName: req.file.originalname,
            replacedOld: !!oldImageUrl
        });

    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir la imagen'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Eliminar imagen de R2 (DELETE /api/upload)
// ----------------------------------------------------
router.delete('/', async (req, res) => {
    try {
        const { imageUrl } = req.body;

        // Verificar que se proporcionó la URL
        if (!imageUrl) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó la URL de la imagen'
            });
        }

        // Eliminar de Cloudflare R2
        await deleteFromR2(imageUrl);

        // Responder éxito
        res.json({
            success: true,
            message: 'Imagen eliminada exitosamente de R2',
            deletedUrl: imageUrl
        });

    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la imagen'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener todas las imágenes (GET /api/upload/images)
// ----------------------------------------------------
router.get('/images', async (req, res) => {
    try {
        const images = await listImagesFromR2();
        
        res.json({
            success: true,
            count: images.length,
            images: images
        });

    } catch (error) {
        console.error('Error al obtener imágenes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las imágenes'
        });
    }
});

module.exports = router;
