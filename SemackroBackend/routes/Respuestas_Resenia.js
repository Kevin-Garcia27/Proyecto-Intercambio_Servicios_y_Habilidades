const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint: Insertar respuesta
router.post('/insertar', async (req, res) => {
	const { id_calificacion, id_usuario, respuesta } = req.body;
	console.debug('POST /api/respuestas-resenia/insertar body:', req.body);
	if (!id_calificacion || !id_usuario || !respuesta) {
		return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
	}
	try {
		await db.query('CALL InsertarRespuestaResena(?, ?, ?)', [id_calificacion, id_usuario, respuesta]);
		res.json({ success: true, message: 'Respuesta insertada correctamente.' });
	} catch (err) {
		console.error('Error en InsertarRespuestaResena:', err);
		res.status(500).json({ success: false, message: 'Error al insertar respuesta.', error: err.message || err });
	}
});

// Endpoint: Obtener respuestas por reseña
router.get('/por-resena/:id_calificacion', async (req, res) => {
	const { id_calificacion } = req.params;
	console.debug('GET /api/respuestas-resenia/por-resena params:', req.params);
		try {
			const result = await db.query('CALL ObtenerRespuestasPorResena(?)', [id_calificacion]);
			console.debug('Resultado ObtenerRespuestasPorResena:', result);

			// MySQL CALL puede devolver múltiples result sets y metadatos.
			// Buscaremos de forma robusta el primer result set que contenga filas (objetos con id_respuesta).
			let rows = [];
			if (Array.isArray(result)) {
				for (const r of result) {
					if (Array.isArray(r) && r.length > 0 && typeof r[0] === 'object' && r[0] !== null && ('id_respuesta' in r[0] || 'respuesta' in r[0])) {
						rows = r;
						break;
					}
					// En algunos drivers el primer elemento es [rows, fields], o [rows, ResultSetHeader]
					if (Array.isArray(r) && r.length === 2 && Array.isArray(r[0]) && r[0].length > 0 && typeof r[0][0] === 'object') {
						rows = r[0];
						break;
					}
				}
			} else if (result && result[0]) {
				rows = result[0];
			}

			res.json({ success: true, data: rows });
		} catch (err) {
		console.error('Error en ObtenerRespuestasPorResena:', err);
		res.status(500).json({ success: false, message: 'Error al obtener respuestas.', error: err.message || err });
	}
});

// Endpoint: Eliminar (ocultar) respuesta
router.delete('/eliminar/:id_respuesta', async (req, res) => {
	const { id_respuesta } = req.params;
	console.debug('DELETE /api/respuestas-resenia/eliminar id_respuesta=', id_respuesta);
	try {
		await db.query('CALL EliminarRespuestaResena(?)', [id_respuesta]);
		res.json({ success: true, message: 'Respuesta eliminada correctamente.' });
	} catch (err) {
		console.error('Error en EliminarRespuestaResena:', err);
		res.status(500).json({ success: false, message: 'Error al eliminar respuesta.', error: err.message || err });
	}
});
// Endpoint: Actualizar respuesta
// Endpoint: Actualizar respuesta
// Endpoint: Actualizar respuesta
router.put('/actualizar/:id_respuesta', async (req, res) => {
	const { id_respuesta } = req.params;
	const { respuesta } = req.body;
	
	console.debug('PUT /api/respuestas-resenia/actualizar', {
		id_respuesta,
		respuesta: respuesta ? respuesta.substring(0, 50) + '...' : 'vacía'
	});
	
	// Validaciones
	if (!id_respuesta) {
		return res.status(400).json({
			success: false,
			message: 'El ID de la respuesta es requerido.'
		});
	}
	
	if (!respuesta || respuesta.trim() === '') {
		return res.status(400).json({
			success: false,
			message: 'La respuesta no puede estar vacía.'
		});
	}
	
	try {
		const result = await db.query('CALL ActualizarRespuestaResena(?, ?)', [
			parseInt(id_respuesta),
			respuesta.trim()
		]);
		
		console.debug('Resultado ActualizarRespuestaResena:', result);
		
		// Extraer los datos de la respuesta de forma robusta (CALL puede devolver varios result sets)
		let foundRows = [];
		let foundMeta = null;
		if (Array.isArray(result)) {
			for (const r of result) {
				if (!Array.isArray(r)) continue;
				// r puede ser [rows, ResultSetHeader] o directamente rows
				const candidate = Array.isArray(r[0]) ? r[0] : r;
				if (candidate.length === 0) continue;
				const first = candidate[0];
				if (first && typeof first === 'object') {
					if ('success' in first || 'message' in first) {
						foundMeta = first;
					} else if ('id_respuesta' in first || 'respuesta' in first) {
						foundRows = candidate;
					} else {
						// Si no tiene claves conocidas, puede ser rows igualmente
						foundRows = candidate;
					}
				}
			}
		} else if (result && result[0]) {
			foundRows = result[0];
		}

		console.debug('foundRows:', foundRows, 'foundMeta:', foundMeta);

		// Si hay meta explícita (success/message), usarla
		if (foundMeta) {
			const metaNum = Number(foundMeta.success);
			const ok = (!isNaN(metaNum) && metaNum === 1) || foundMeta.success === true;
			if (ok) {
				return res.json({ success: true, message: foundMeta.message || 'Respuesta actualizada correctamente.' });
			} else {
				return res.status(400).json({ success: false, message: foundMeta.message || 'Error al actualizar la respuesta.' });
			}
		}

		// Si no hay meta pero hay filas, asumir éxito
		if (Array.isArray(foundRows) && foundRows.length > 0) {
			return res.json({ success: true, message: 'Respuesta actualizada correctamente.', data: foundRows[0] });
		}
		
		// Si no hay datos, asumir éxito
		res.json({
			success: true,
			message: 'Respuesta actualizada correctamente.'
		});
		
	} catch (err) {
		console.error('Error en ActualizarRespuestaResena:', err);
		res.status(500).json({
			success: false,
			message: 'Error al actualizar respuesta.',
			error: err.message || err
		});
	}
});
module.exports = router;
