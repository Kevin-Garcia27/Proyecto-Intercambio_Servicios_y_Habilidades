// routes/favoritos.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // ajusta la ruta si tu db.js está en otra carpeta

// 📌 Obtener todos los favoritos de un usuario
router.get('/:usuario_id', (req, res) => {
  const { usuario_id } = req.params;
  const query = 'SELECT * FROM favoritos WHERE usuario_id = ?';

  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      console.error('Error al obtener favoritos:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

// 📌 Agregar un nuevo favorito
router.post('/', (req, res) => {
  const { usuario_id, persona_id } = req.body;
  const query = 'INSERT INTO favoritos (usuario_id, persona_id) VALUES (?, ?)';

  db.query(query, [usuario_id, persona_id], (err, result) => {
    if (err) {
      console.error('Error al agregar favorito:', err);
      return res.status(500).json({ error: 'Error al agregar favorito' });
    }
    res.json({ message: 'Favorito agregado correctamente', id: result.insertId });
  });
});

// 📌 Eliminar un favorito
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM favoritos WHERE id = ?';

  db.query(query, [id], (err) => {
    if (err) {
      console.error('Error al eliminar favorito:', err);
      return res.status(500).json({ error: 'Error al eliminar favorito' });
    }
    res.json({ message: 'Favorito eliminado correctamente' });
  });
});

module.exports = router;