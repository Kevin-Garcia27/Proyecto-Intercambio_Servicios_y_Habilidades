// Direcciones.js
// ========================================
// API Direcciones - SkillConnect2025
// ========================================

const express = require('express');
const router = express.Router();

// Importar configuración centralizada de la base de datos
const db = require('../db');

// ----------------------------------------------------
// ENDPOINT: Obtener TODAS las direcciones (GET /direcciones)
// ----------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const [resultado] = await db.execute('CALL sp_Direcciones_ObtenerTodo()');
        const direcciones = resultado[0];
        
        res.json({
            success: true,
            count: direcciones.length,
            data: direcciones
        });
    } catch (error) {
        console.error('Error al obtener todas las direcciones:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener las direcciones'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener direccion por ID (GET /direcciones/:id)
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
        const [resultado] = await db.execute('CALL sp_Direcciones_ObtenerPorId(?)', [id]);
        const direccion = resultado[0][0];
        
        if (!direccion) {
            return res.status(404).json({ 
                success: false,
                message: 'Dirección no encontrada' 
            });
        }
        
        res.json({
            success: true,
            data: direccion
        });
    } catch (error) {
        console.error(`Error al obtener direccion con ID ${id}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener la dirección'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Obtener direccion por ID de Persona (GET /direcciones/persona/:idPersona)
// ----------------------------------------------------
router.get('/persona/:idPersona', async (req, res) => {
    const idPersona = parseInt(req.params.idPersona);
    
    if (isNaN(idPersona)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID de persona no válido' 
        });
    }

    try {
        const [resultado] = await db.execute('CALL sp_Direcciones_ObtenerPorPersona(?)', [idPersona]);
        const direccion = resultado[0][0];
        
        if (!direccion) {
            // Devolver 200 con objeto vacío si no hay dirección
            return res.status(200).json({
                success: true,
                data: null
            });
        }
        res.json({
            success: true,
            data: direccion
        });
    } catch (error) {
        console.error(`Error al obtener direccion de persona ${idPersona}:`, error.message);
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al obtener la dirección'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Crear una nueva direccion (POST /direcciones)
// ----------------------------------------------------
router.post('/', async (req, res) => {
    const { 
        ciudad,
        departamento,
        pais,
        codigoPostal,
        idPersona
    } = req.body;
    
    // Validación: al menos debe tener un campo de ubicación
    if (!ciudad && !departamento && !pais) {
        return res.status(400).json({ 
            success: false, 
            message: 'Debe proporcionar al menos ciudad, departamento o país' 
        });
    }

    try {
        const [resultado] = await db.execute(
            'CALL sp_Direcciones_Insertar(?, ?, ?, ?, ?)',
            [
                ciudad || null,
                departamento || null,
                pais || null,
                codigoPostal || null,
                idPersona || null
            ]
        );
        
        const idInsertado = resultado[0][0] ? resultado[0][0].id_Direccion_Nueva : null;
        
        res.status(201).json({
            success: true,
            message: 'Dirección creada exitosamente',
            data: { 
                id: idInsertado,
                ciudad,
                departamento,
                pais,
                codigoPostal
            }
        });
    } catch (error) {
        console.error('Error al crear dirección:', error.message);
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ 
                success: false,
                error: 'La persona especificada no existe'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al crear la dirección'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Actualizar una direccion (PUT /direcciones/:id)
// ----------------------------------------------------
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    // Permitir actualización parcial
    const {
        ciudad,
        departamento,
        pais,
        codigoPostal,
        idPersona // puede venir o no
    } = req.body;

    if (isNaN(id)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID no válido' 
        });
    }

    try {
        // Verificar si la dirección existe
        const [verificacion] = await db.execute('CALL sp_Direcciones_ObtenerPorId(?)', [id]);
        
        if (!verificacion[0] || verificacion[0].length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Dirección no encontrada' 
            });
        }

        const direccionActual = verificacion[0][0];

        // Actualizar la dirección
        await db.execute(
            'CALL sp_Direcciones_Actualizar(?, ?, ?, ?, ?, ?)',
            [
                id,
                ciudad !== undefined ? ciudad : direccionActual.ciudad_Direccion,
                departamento !== undefined ? departamento : direccionActual.departamento_Direccion,
                pais !== undefined ? pais : direccionActual.pais_Direccion,
                codigoPostal !== undefined ? codigoPostal : direccionActual.codigoPostal_Direccion,
                idPersona !== undefined ? idPersona : direccionActual.id_Perfil_Persona
            ]
        );
        
        res.json({
            success: true,
            message: `Dirección con ID ${id} actualizada exitosamente`,
            data: { 
                id,
                ciudad: ciudad !== undefined ? ciudad : direccionActual.ciudad_Direccion,
                departamento: departamento !== undefined ? departamento : direccionActual.departamento_Direccion,
                pais: pais !== undefined ? pais : direccionActual.pais_Direccion
            }
        });
    } catch (error) {
        console.error(`Error al actualizar dirección con ID ${id}:`, error.message);
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(404).json({ 
                success: false,
                error: 'La persona especificada no existe'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al actualizar la dirección'
        });
    }
});

// ----------------------------------------------------
// ENDPOINT: Eliminar una direccion (DELETE /direcciones/:id)
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
        // Verificar si la dirección existe
        const [verificacion] = await db.execute('CALL sp_Direcciones_ObtenerPorId(?)', [id]);
        
        if (!verificacion[0] || verificacion[0].length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Dirección no encontrada' 
            });
        }

        // Eliminar la dirección
        await db.execute('CALL sp_Direcciones_Eliminar(?)', [id]);
        
        res.json({
            success: true,
            message: `Dirección con ID ${id} eliminada exitosamente`
        });
    } catch (error) {
        console.error(`Error al eliminar dirección con ID ${id}:`, error.message);
        
        res.status(500).json({ 
            success: false,
            error: 'Error del servidor al eliminar la dirección'
        });
    }
});

// Exportar el router
module.exports = router;
