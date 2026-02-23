const express = require('express');
const router = express.Router();

// Importar configuración centralizada de la base de datos
const db = require('../db');

// ----------------------------------------------------
// ENDPOINT: Obtener todas las geolocalizaciones (GET /geolocalizacion)
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const [resultado] = await db.execute('CALL sp_Geolocalizacion_ObtenerTodo()');
        const geolocalizaciones = resultado[0];
        
        res.json({
            success: true,
            data: geolocalizaciones
        });
    } catch (error) {
        console.error('Error al obtener geolocalizaciones:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las geolocalizaciones'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener geolocalización por ID (GET /geolocalizacion/:id)
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
        const [resultado] = await db.execute('CALL sp_Geolocalizacion_ObtenerPorId(?)', [id]);
        const geolocalizacion = resultado[0][0];
        
        if (!geolocalizacion) {
            return res.status(404).json({ 
                success: false,
                message: 'Geolocalización no encontrada' 
            });
        }
        
        res.json({
            success: true,
            data: geolocalizacion
        });
    } catch (error) {
        console.error(`Error al obtener geolocalización con ID ${id}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener la geolocalización'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener geolocalización por ID de Dirección (GET /geolocalizacion/direccion/:idDireccion)
// ----------------------------------------------------
router.get('/direccion/:idDireccion', async (req, res) => {
    const idDireccion = parseInt(req.params.idDireccion);
    
    if (isNaN(idDireccion)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID de dirección no válido' 
        });
    }

    try {
        const [resultado] = await db.execute('CALL sp_Geolocalizacion_ObtenerPorDireccion(?)', [idDireccion]);
        const geolocalizacion = resultado[0][0];
        
        if (!geolocalizacion) {
            return res.status(404).json({ 
                success: false,
                message: 'Geolocalización no encontrada para esta dirección' 
            });
        }
        
        res.json({
            success: true,
            data: geolocalizacion
        });
    } catch (error) {
        console.error(`Error al obtener geolocalización de dirección ${idDireccion}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener la geolocalización'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Crear una nueva geolocalización (POST /geolocalizacion)
// ----------------------------------------------------
router.post('/', async (req, res) => {
    const { 
        latitud,
        longitud,
        idDireccion
    } = req.body;
    
    // Validación: latitud y longitud son opcionales pero deben ser números válidos si se proporcionan
    if (latitud !== null && latitud !== undefined && (typeof latitud !== 'number' || isNaN(latitud))) {
        return res.status(400).json({ 
            success: false, 
            message: 'La latitud debe ser un número válido' 
        });
    }

    if (longitud !== null && longitud !== undefined && (typeof longitud !== 'number' || isNaN(longitud))) {
        return res.status(400).json({ 
            success: false, 
            message: 'La longitud debe ser un número válido' 
        });
    }

    // Validar que idDireccion sea proporcionado
    if (!idDireccion) {
        return res.status(400).json({ 
            success: false, 
            message: 'El ID de la dirección es requerido' 
        });
    }

    try {
        const [resultado] = await db.execute(
            'CALL sp_Geolocalizacion_Insertar(?, ?, ?)',
            [
                latitud || null,
                longitud || null,
                idDireccion
            ]
        );
        
        const idInsertado = resultado[0][0] ? resultado[0][0].id_Geolocalizacion_Nueva : null;
        
        res.status(201).json({
            success: true,
            message: 'Geolocalización creada exitosamente',
            data: { 
                id: idInsertado,
                latitud,
                longitud,
                idDireccion
            }
        });
    } catch (error) {
        console.error('Error al crear geolocalización:', error.message);
        
        // Error de clave foránea - dirección no existe
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ 
                success: false,
                error: 'La dirección especificada no existe'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al crear la geolocalización'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Actualizar una geolocalización (PUT /geolocalizacion/:id)
// ----------------------------------------------------
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    const { 
        latitud,
        longitud,
        idDireccion
    } = req.body;

    // Validación: latitud y longitud son opcionales pero deben ser números válidos si se proporcionan
    if (latitud !== null && latitud !== undefined && (typeof latitud !== 'number' || isNaN(latitud))) {
        return res.status(400).json({ 
            success: false, 
            message: 'La latitud debe ser un número válido' 
        });
    }

    if (longitud !== null && longitud !== undefined && (typeof longitud !== 'number' || isNaN(longitud))) {
        return res.status(400).json({ 
            success: false, 
            message: 'La longitud debe ser un número válido' 
        });
    }

    try {
        // Verificar si la geolocalización existe
        const [checkResult] = await db.execute('CALL sp_Geolocalizacion_ObtenerPorId(?)', [id]);
        if (!checkResult[0][0]) {
            return res.status(404).json({ 
                success: false,
                message: 'Geolocalización no encontrada' 
            });
        }

        // Actualizar la geolocalización
        await db.execute(
            'CALL sp_Geolocalizacion_Actualizar(?, ?, ?, ?)',
            [
                id,
                latitud || null,
                longitud || null,
                idDireccion || null
            ]
        );
        
        res.json({
            success: true,
            message: 'Geolocalización actualizada exitosamente',
            data: {
                id,
                latitud,
                longitud,
                idDireccion
            }
        });
    } catch (error) {
        console.error(`Error al actualizar geolocalización ${id}:`, error.message);
        
        // Error de clave foránea
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ 
                success: false,
                error: 'La dirección especificada no existe'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al actualizar la geolocalización'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Eliminar una geolocalización (DELETE /geolocalizacion/:id)
// ----------------------------------------------------
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    try {
        // Verificar si la geolocalización existe
        const [checkResult] = await db.execute('CALL sp_Geolocalizacion_ObtenerPorId(?)', [id]);
        if (!checkResult[0][0]) {
            return res.status(404).json({ 
                success: false,
                message: 'Geolocalización no encontrada' 
            });
        }

        // Eliminar la geolocalización
        await db.execute('CALL sp_Geolocalizacion_Eliminar(?)', [id]);
        
        res.json({
            success: true,
            message: 'Geolocalización eliminada exitosamente'
        });
    } catch (error) {
        console.error(`Error al eliminar geolocalización ${id}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al eliminar la geolocalización'
        });
    }
});

module.exports = router;
