import express from "express";
import db from "../db.js";

const router = express.Router();


// POST: Crear nueva calificación
router.post('/', async (req, res) => {
  const { usuario_calificador, usuario_calificado, rating, comentario } = req.body;

  if (!usuario_calificador || !usuario_calificado || !rating) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    await db.query(
      `INSERT INTO calificaciones (usuario_calificador, usuario_calificado, rating, comentario)
       VALUES (?, ?, ?, ?)`,
      [usuario_calificador, usuario_calificado, rating, comentario]
    );

    // /Opcional: crear notificación para el usuario calificado
    await db.query(
      `INSERT INTO notificaciones (user_id, mensaje)
       VALUES (?, ?)`,
      [usuario_calificado, `Has recibido una nueva calificación de ${rating} estrellas`]
    );

    res.status(201).json({ mensaje: "Calificación registrada correctamente" });
  } catch (error) {
    console.error(" Error al guardar calificación:", error);
    res.status(500).json({ error: "Error al guardar calificación" });
  }
});


// GET: Obtener todas las calificaciones de un usuario calificado
router.get("/:usuario_calificado", async (req, res) => {
  const { usuario_calificado } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT c.id, c.rating, c.comentario, c.fecha,
              u.nombre AS calificado_por
       FROM calificaciones c
       JOIN usuarios u ON c.usuario_calificador = u.id_usuario
       WHERE c.usuario_calificado = ?
       ORDER BY c.fecha DESC`,
      [usuario_calificado]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error al obtener calificaciones:", error);
    res.status(500).json({ error: "Error al obtener calificaciones" });
  }
});


// DELETE: Eliminar una calificación por su ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM calificaciones WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Calificación no encontrada" });
    }

    res.json({ mensaje: "Calificación eliminada correctamente" });
  } catch (error) {
    console.error(" Error al eliminar calificación:", error);
    res.status(500).json({ error: "Error al eliminar calificación" });
  }
});


export default  router;