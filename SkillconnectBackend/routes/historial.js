// routes/historial.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // ajusta la ruta si tu db.js está en otra carpeta

//  Obtener historial de un usuario
router.get('/:usuario_id', (req, res) => {
  const { usuario_id } = req.params;
  const query = 'SELECT * FROM historial_busquedas WHERE usuario_id = ? ORDER BY fecha DESC';

  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      console.error('Error al obtener historial:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

router.post('/', (req, res) => {
    const { usuario_id, tipo_busqueda, termino, fecha } = req.body;
    
    // 1. SOLUCIÓN: Agregue la definición de la variable 'query'
    const query = 'INSERT INTO historial_busquedas (usuario_id, tipo_busqueda, termino, fecha) VALUES (?, ?, ?, ?)';

    console.log('1. Solicitud recibida y datos extraídos.'); 

    // 2. Ahora 'query' está definida y se puede usar en db.query()
    db.query(query, [usuario_id, tipo_busqueda, termino, fecha], (err, result) => {
        if (err) {
            console.error('Error al agregar búsqueda:', err);
            return res.status(500).json({ error: 'Error al registrar búsqueda' });
        }

        console.log('2. Búsqueda registrada en BD. Intentando enviar respuesta.');
        
        // Versión simple que ya probamos para evitar errores de result.insertId
        return res.json({ message: 'Búsqueda registrada correctamente' });
    });
});

module.exports = router;