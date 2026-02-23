const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /notificaciones/insertar
// Body: { id_usuario_destino, id_usuario_origen, tipo, titulo, mensaje, url, data }
router.post('/insertar', async (req, res) => {
	try {
		// LOGGING TEMPORAL: mostrar payload entrante para depuración
		console.debug('POST /notificaciones/insertar - payload recibido:', req.body);
		const {
			id_usuario_destino,
			id_usuario_origen = null,
			tipo = 'respuesta_reseña',
			titulo = null,
			mensaje = null,
			url = null,
			data = null
		} = req.body;

		if (!id_usuario_destino) {
			return res.status(400).json({ success: false, message: 'Falta id_usuario_destino' });
		}

		// Evitar notificar al mismo usuario
		if (id_usuario_origen && id_usuario_destino && Number(id_usuario_origen) === Number(id_usuario_destino)) {
			return res.status(400).json({ success: false, message: 'No se puede notificar al mismo usuario' });
		}

		// Normalizar mensaje si está vacío
		if (!mensaje || String(mensaje).trim() === '') {
			// si no hay título ni mensaje, establecer un texto por defecto
			if (titulo && String(titulo).trim() !== '') {
				mensaje = String(titulo).trim();
			} else {
				mensaje = 'Tienes una nueva notificación';
			}
		}

		const [results] = await pool.query(
			'CALL sp_InsertarNotificacion(?, ?, ?, ?, ?, ?, ?)',
			[id_usuario_destino, id_usuario_origen, tipo, titulo, mensaje, url, JSON.stringify(data || null)]
		);

		// El procedimiento devuelve el registro insertado en el primer result-set
		const inserted = (results && results[0]) ? results[0][0] : null;

		res.status(201).json({ success: true, data: inserted });
	} catch (error) {
		console.error('Error al insertar notificación:', error);
		res.status(500).json({ success: false, message: 'Error al insertar notificación', error: error.message });
	}
});

// GET /notificaciones/usuario/:id?limit=20&offset=0
router.get('/usuario/:id', async (req, res) => {
	try {
		const usuarioId = req.params.id;
		const limit = parseInt(req.query.limit || '20', 10);
		const offset = parseInt(req.query.offset || '0', 10);

		const [results] = await pool.query(
			'CALL sp_ObtenerNotificacionesPorUsuario(?, ?, ?)',
			[usuarioId, limit, offset]
		);

		// El primer result-set contiene las filas
		const notifications = (results && results[0]) ? results[0] : [];

		res.json({ success: true, count: notifications.length, data: notifications });
	} catch (error) {
		console.error('Error al obtener notificaciones:', error);
		res.status(500).json({ success: false, message: 'Error al obtener notificaciones', error: error.message });
	}
});

// GET /notificaciones/count/:id  -> contar no vistas
router.get('/count/:id', async (req, res) => {
	try {
		const usuarioId = req.params.id;
		const [results] = await pool.query('CALL sp_ContarNotificacionesNoVistas(?)', [usuarioId]);
		const count = (results && results[0] && results[0][0]) ? results[0][0].no_vistas : 0;
		res.json({ success: true, count });
	} catch (error) {
		console.error('Error al contar notificaciones no vistas:', error);
		res.status(500).json({ success: false, message: 'Error al contar notificaciones', error: error.message });
	}
});

// PUT /notificaciones/:id/marcar-visto
router.put('/:id/marcar-visto', async (req, res) => {
	try {
		const id = req.params.id;
		const [results] = await pool.query('CALL sp_MarcarNotificacionVisto(?)', [id]);
		const affected = (results && results[0] && results[0][0]) ? results[0][0].affected : 0;
		res.json({ success: true, affected });
	} catch (error) {
		console.error('Error al marcar notificación vista:', error);
		res.status(500).json({ success: false, message: 'Error al marcar notificación', error: error.message });
	}
});

// PUT /notificaciones/usuario/:id/marcar-todas-vistas
router.put('/usuario/:id/marcar-todas-vistas', async (req, res) => {
	try {
		const usuarioId = req.params.id;
		const [results] = await pool.query('CALL sp_MarcarTodasVistasPorUsuario(?)', [usuarioId]);
		const affected = (results && results[0] && results[0][0]) ? results[0][0].affected : 0;
		res.json({ success: true, affected });
	} catch (error) {
		console.error('Error al marcar todas notificaciones vistas:', error);
		res.status(500).json({ success: false, message: 'Error al marcar todas', error: error.message });
	}
});

module.exports = router;

