// server.js

// 0. Configuracion del Entorno (DEBE IR PRIMERO)
require('dotenv').config(); 

// 1. Importaciones de Librerias y Modulos
const express = require('express');
const cors = require('cors'); 
// Asume que tu archivo db.js exporta la conexion como 'pool'
const pool = require('./db'); // Importamos la conexion a la DB
const authRoutes = require('./routes/auth'); 

const app = express();
// Obtiene el puerto del .env o usa 3001 por defecto
const port = process.env.PORT || 3001; 

// 2. Middleware de CORS (Permite al frontend hablar con el backend)
app.use(cors({
    // El frontend ahora corre en el puerto 5500 gracias a Live Server
    origin: 'http://127.0.0.1:5500' 
}));

// 3. Middleware para procesar JSON (SOLO UNA VEZ)
app.use(express.json()); 

// 4. Configurar la URL base para las rutas de autenticacion
app.use('/api', authRoutes);

// Prueba basica de que el servidor Express funciona
app.get('/', (req, res) => {
    res.send('Servidor Skill Connect Activo!');
});

// =========================================================
// RUTA DE API NUEVA (HISTORIA DE USUARIO #11: Envio de Solicitud de Intercambio)
// =========================================================
app.post('/api/solicitudes', async (req, res) => {
    // Necesitamos autenticar al usuario aqui en un proyecto real, 
    // pero para la prueba, obtendremos los IDs directamente del cuerpo:
    const { 
        solicitante_id, 
        receptor_id, 
        habilidad_ofrecida, 
        habilidad_solicitada, 
        fecha_sugerida, 
        tiempo_estimado 
    } = req.body;

    // Validacion basica: Asegurate de que los IDs y habilidades esten presentes
    if (!solicitante_id || !receptor_id || !habilidad_ofrecida || !habilidad_solicitada) {
        return res.status(400).json({ mensaje: 'Faltan campos obligatorios para la solicitud.' });
    }

    try {
        const query = `
            INSERT INTO solicitudes_intercambio 
            (solicitante_id, receptor_id, habilidad_ofrecida, habilidad_solicitada, fecha_sugerida, tiempo_estimado)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        
        // Ejecucion de la consulta en la base de datos
        // Usamos pool.query ya que importamos 'pool' arriba
        const [result] = await pool.query(query, [
            solicitante_id, 
            receptor_id, 
            habilidad_ofrecida, 
            habilidad_solicitada, 
            fecha_sugerida, 
            tiempo_estimado
        ]);

        // Retorna una respuesta de exito
        res.status(201).json({ 
            mensaje: 'Solicitud de intercambio enviada con exito.',
            solicitudId: result.insertId // ID de la solicitud recien creada
        });

    } catch (error) {
        console.error('Error al procesar la solicitud de intercambio:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al enviar la solicitud.' });
    }
});

// =========================================================
// RUTA DE API NUEVA (HISTORIA DE USUARIO #12: Aceptar o Rechazar Solicitud)
// =========================================================
app.patch('/api/solicitudes/:solicitudId', async (req, res) => {
    // El ID de la solicitud se obtiene de la URL
    const { solicitudId } = req.params;
    // El nuevo estado (ACEPTADA o RECHAZADA) se obtiene del cuerpo
    const { nuevoEstado } = req.body;
    
    // NOTA: En un proyecto real, se debe verificar que el usuario autenticado
    // sea realmente el 'receptor_id' de esta solicitud.

    // 1. Validar el estado
    const estadosValidos = ['ACEPTADA', 'RECHAZADA'];
    if (!nuevoEstado || !estadosValidos.includes(nuevoEstado.toUpperCase())) {
        return res.status(400).json({ mensaje: 'Estado de solicitud invalido. Debe ser ACEPTADA o RECHAZADA.' });
    }

    try {
        const query = `
            UPDATE solicitudes_intercambio
            SET estado = ?
            WHERE id = ? AND estado = 'PENDIENTE';
        `;
        
        const [result] = await pool.query(query, [nuevoEstado.toUpperCase(), solicitudId]);

        if (result.affectedRows === 0) {
            // Esto ocurre si la solicitud no existe o si ya no esta en estado 'PENDIENTE'
            return res.status(404).json({ mensaje: 'Solicitud no encontrada o ya ha sido procesada.' });
        }

        // Retorna una respuesta de exito
        res.status(200).json({ 
            mensaje: `Solicitud ${solicitudId} actualizada a estado: ${nuevoEstado}.`
        });

    } catch (error) {
        console.error('Error al actualizar el estado de la solicitud:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor al actualizar la solicitud.' });
    }
});


// 5. Iniciar el servidor
app.listen(port, () => {
    // Ya no es necesario el require('./db') aqui, ya que lo importamos arriba
    console.log(`Servidor escuchando en http://localhost:${port}`);
});