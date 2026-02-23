const express = require('express');
const router = express.Router();

// Importar configuración centralizada de la base de datos
const db = require('../db');

// ----------------------------------------------------
// ENDPOINT: Obtener todas las categorías (GET /categorias)
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const [resultado] = await db.execute('CALL sp_Categorias_ObtenerTodo()');
        const categorias = resultado[0];
        
        res.json({
            success: true,
            data: categorias
        });
    } catch (error) {
        console.error('Error al obtener categorías:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las categorías'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener categoría por ID (GET /categorias/:id)
// ----------------------------------------------------
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    try {
        const [resultado] = await db.execute('CALL sp_Categorias_ObtenerPorId(?)', [id]);
        const categoria = resultado[0][0];
        
        if (!categoria) {
            return res.status(404).json({ 
                success: false,
                message: 'Categoría no encontrada' 
            });
        }
        
        res.json({
            success: true,
            data: categoria
        });
    } catch (error) {
        console.error(`Error al obtener categoría con ID ${id}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener la categoría'
        });
    }
});

module.exports = router;
