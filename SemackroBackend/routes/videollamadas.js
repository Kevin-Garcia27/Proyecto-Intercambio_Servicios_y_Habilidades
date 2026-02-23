
const express = require('express');
const router = express.Router();
const pool = require('../db');

/*
  Rutas para señalización de videollamadas.
  Este archivo usa procedures almacenados en MySQL (ver SQL propuesto más abajo).
  Endpoints:
  - POST /videollamadas/offer        -> guardar offer (CALL sp_CreateOrUpdateCallOffer)
  - GET  /videollamadas/offer/:roomId -> obtener offer por room
  - POST /videollamadas/answer       -> guardar answer (CALL sp_SaveAnswer)
  - GET  /videollamadas/answer/:roomId -> obtener answer por room
  - POST /videollamadas/candidate    -> añadir candidate
  - GET  /videollamadas/candidates/:roomId -> obtener candidatos
  - POST /videollamadas/status       -> cambiar estado de llamada
  - GET  /videollamadas/user/:userId -> obtener llamadas relacionadas (join con personas)

  Nota: El pool exportado por ../db es pool.promise() de mysql2, por eso usamos await pool.query(...)
*/

// Guardar o actualizar la offer de una llamada
router.post('/offer', async (req, res) => {
    try {
    let { roomId, callerId, calleeId, offer, id_mensaje, conversationId } = req.body;
    // Si se pasó id_mensaje, intentar resolver participantes desde mensajes
    if (id_mensaje && (!roomId || !callerId)) {
      try {
        const [msgRows] = await pool.query('SELECT id_persona_envia, id_persona_recibe FROM mensajes WHERE id_mensaje = ? LIMIT 1', [id_mensaje]);
          const m = (msgRows && msgRows[0]) ? msgRows[0] : null;
          if (m) {
            callerId = callerId || m.id_persona_envia;
            calleeId = calleeId || m.id_persona_recibe;
            roomId = roomId || `room_${id_mensaje}`;
          }
      } catch (e) { console.warn('Error resolviendo mensaje en /offer', e); }
    }

    // Si no se proporcionó id_mensaje pero tenemos conversationId y callerId, crear un mensaje de tipo 'llamada'
    if (!id_mensaje && conversationId && callerId) {
      try {
        // Determinar calleeId si no se proporcionó: buscar último interlocutor en la conversación
        if (!calleeId) {
          try {
            const [lastMsgRows] = await pool.query('SELECT id_persona_envia, id_persona_recibe FROM mensajes WHERE id_conversacion = ? ORDER BY fecha_envio DESC LIMIT 1', [conversationId]);
            if (lastMsgRows && lastMsgRows[0]) {
              const last = lastMsgRows[0];
              // Asumir que el receptor es la otra persona en el último mensaje
              if (String(last.id_persona_envia) === String(callerId)) calleeId = last.id_persona_recibe;
              else calleeId = last.id_persona_envia;
            }
          } catch(e) { /* ignore */ }
        }

        // Insertar mensaje de llamada
        const contenido = 'LLAMADA_INICIADA';
        const [insertResult] = await pool.query('INSERT INTO mensajes (id_conversacion, id_persona_envia, id_persona_recibe, contenido) VALUES (?, ?, ?, ?)', [conversationId, callerId, calleeId || null, contenido]);
        if (insertResult && insertResult.insertId) {
          id_mensaje = insertResult.insertId;
          // asegurar roomId
          roomId = roomId || `room_${id_mensaje}`;
        }
      } catch (e) { console.warn('Error creando mensaje de llamada en /offer', e); }
    }

    if (!roomId || !callerId || !offer) return res.status(400).json({ success: false, message: 'Faltan parámetros: roomId, callerId, offer (o id_mensaje incorrecto)' });

    // Intentar usar el procedimiento almacenado; si falla, hacer fallback directo a tablas
    try {
      const [rows] = await pool.query('CALL sp_CreateOrUpdateCallOffer(?, ?, ?, ?)', [roomId, callerId, calleeId || null, offer]);
      if (id_mensaje) {
        try { await pool.query('UPDATE calls SET id_mensaje = ? WHERE room_id = ?', [id_mensaje, roomId]); } catch (e) { console.warn('No se pudo actualizar id_mensaje en calls', e); }
      }
      return res.json({ success: true, data: rows[0] || null });
    } catch (spErr) {
      console.warn('sp_CreateOrUpdateCallOffer failed, using fallback SQL:', spErr && spErr.message);
      try {
        // Verificar si ya existe la llamada
        const [existing] = await pool.query('SELECT id FROM calls WHERE room_id = ? LIMIT 1', [roomId]);
        if (existing && existing[0] && existing[0].id) {
          await pool.query('UPDATE calls SET offer = ?, caller_id = ?, callee_id = ?, status = ?, updated_at = NOW() WHERE room_id = ?', [offer, callerId, calleeId || null, 'ringing', roomId]);
        } else {
          await pool.query('INSERT INTO calls (room_id, caller_id, callee_id, offer, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())', [roomId, callerId, calleeId || null, offer, 'ringing']);
        }
        if (id_mensaje) {
          try { await pool.query('UPDATE calls SET id_mensaje = ? WHERE room_id = ?', [id_mensaje, roomId]); } catch (e) { console.warn('No se pudo actualizar id_mensaje en calls (fallback)', e); }
        }
        return res.json({ success: true, fallback: true });
      } catch (fallbackErr) {
        console.error('Fallback for sp_CreateOrUpdateCallOffer failed', fallbackErr);
        return res.status(500).json({ success: false, message: 'Error guardando offer (fallback failed)', error: fallbackErr.message });
      }
    }
    } catch (err) {
        console.error('POST /videollamadas/offer error', err);
        return res.status(500).json({ success: false, message: 'Error guardando offer', error: err.message });
    }
});

// Obtener offer por roomId
router.get('/offer/:roomId', async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [rows] = await pool.query('CALL sp_GetOfferByRoom(?)', [roomId]);
        const data = (rows && rows[0] && rows[0][0]) ? rows[0][0] : (rows && rows[0]) ? rows[0] : null;
        return res.json({ success: true, data });
    } catch (err) {
        console.error('GET /videollamadas/offer/:roomId error', err);
        return res.status(500).json({ success: false, message: 'Error obteniendo offer', error: err.message });
    }
});

// Guardar answer
router.post('/answer', async (req, res) => {
    try {
    let { roomId, answer, userId, id_mensaje } = req.body;
    if (id_mensaje && !roomId) {
      try {
        const [callRows] = await pool.query('SELECT room_id FROM calls WHERE id_mensaje = ? LIMIT 1', [id_mensaje]);
        if (callRows && callRows[0]) roomId = callRows[0].room_id;
        else roomId = `room_${id_mensaje}`;
      } catch (e) { console.warn('Error resolviendo room por id_mensaje en /answer', e); }
    }

    if (!roomId || !answer) return res.status(400).json({ success: false, message: 'Faltan parámetros: roomId, answer (o id_mensaje inválido)' });

    try {
      const [rows] = await pool.query('CALL sp_SaveAnswer(?, ?, ?)', [roomId, answer, userId || null]);
      return res.json({ success: true, data: rows[0] || null });
    } catch (spErr) {
      console.warn('sp_SaveAnswer failed, using fallback SQL:', spErr && spErr.message);
      try {
        await pool.query('UPDATE calls SET answer = ?, status = ?, updated_at = NOW() WHERE room_id = ?', [answer, 'accepted', roomId]);
        try { await pool.query('INSERT INTO call_logs (room_id, user_id, action, created_at) VALUES (?, ?, ?, NOW())', [roomId, userId || null, 'answer_saved']); } catch(e){}
        return res.json({ success: true, fallback: true });
      } catch (fallbackErr) {
        console.error('Fallback for sp_SaveAnswer failed', fallbackErr);
        return res.status(500).json({ success: false, message: 'Error guardando answer (fallback failed)', error: fallbackErr.message });
      }
    }
    } catch (err) {
        console.error('POST /videollamadas/answer error', err);
        return res.status(500).json({ success: false, message: 'Error guardando answer', error: err.message });
    }
});

// Obtener answer por roomId
router.get('/answer/:roomId', async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [rows] = await pool.query('CALL sp_GetAnswerByRoom(?)', [roomId]);
        const data = (rows && rows[0] && rows[0][0]) ? rows[0][0] : (rows && rows[0]) ? rows[0] : null;
        return res.json({ success: true, data });
    } catch (err) {
        console.error('GET /videollamadas/answer/:roomId error', err);
        return res.status(500).json({ success: false, message: 'Error obteniendo answer', error: err.message });
    }
});

// Añadir candidate
router.post('/candidate', async (req, res) => {
    try {
    let { roomId, senderId, candidate, id_mensaje } = req.body;
    if (id_mensaje && !roomId) {
      try {
        const [callRows] = await pool.query('SELECT room_id FROM calls WHERE id_mensaje = ? LIMIT 1', [id_mensaje]);
        if (callRows && callRows[0]) roomId = callRows[0].room_id;
        else roomId = `room_${id_mensaje}`;
      } catch (e) { console.warn('Error resolviendo room por id_mensaje en /candidate', e); }
    }

    if (!roomId || !candidate) return res.status(400).json({ success: false, message: 'Faltan parámetros: roomId, candidate (o id_mensaje inválido)' });
    try {
      const [rows] = await pool.query('CALL sp_AddCandidate(?, ?, ?)', [roomId, senderId || null, candidate]);
      return res.json({ success: true });
    } catch (spErr) {
      console.warn('sp_AddCandidate failed, using fallback SQL:', spErr && spErr.message);
      try {
        // obtener call_id
        const [callRows] = await pool.query('SELECT id FROM calls WHERE room_id = ? LIMIT 1', [roomId]);
        if (callRows && callRows[0] && callRows[0].id) {
          await pool.query('INSERT INTO call_candidates (call_id, sender_id, candidate, created_at) VALUES (?, ?, ?, NOW())', [callRows[0].id, senderId || null, candidate]);
          return res.json({ success: true, fallback: true });
        } else {
          // si no existe llamada, crearla mínimamente y luego insertar candidate
          const [ins] = await pool.query('INSERT INTO calls (room_id, caller_id, callee_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())', [roomId, senderId || null, null, 'ringing']);
          const callId = ins && ins.insertId ? ins.insertId : null;
          if (callId) await pool.query('INSERT INTO call_candidates (call_id, sender_id, candidate, created_at) VALUES (?, ?, ?, NOW())', [callId, senderId || null, candidate]);
          return res.json({ success: true, fallback: true });
        }
      } catch (fallbackErr) {
        console.error('Fallback for sp_AddCandidate failed', fallbackErr);
        return res.status(500).json({ success: false, message: 'Error guardando candidate (fallback failed)', error: fallbackErr.message });
      }
    }
    } catch (err) {
        console.error('POST /videollamadas/candidate error', err);
        return res.status(500).json({ success: false, message: 'Error guardando candidate', error: err.message });
    }
});

// Obtener candidatos por roomId
router.get('/candidates/:roomId', async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [rows] = await pool.query('CALL sp_GetCandidatesByRoom(?)', [roomId]);
        const data = (rows && rows[0]) ? rows[0] : [];
        return res.json({ success: true, count: data.length, data });
    } catch (err) {
        console.error('GET /videollamadas/candidates/:roomId error', err);
        return res.status(500).json({ success: false, message: 'Error obteniendo candidatos', error: err.message });
    }
});

// Obtener llamada por id_mensaje (facilita polling desde cliente que usa la lógica de mensajes)
router.get('/by-message/:id_mensaje', async (req, res) => {
  try {
    const id_mensaje = req.params.id_mensaje;
    const [rows] = await pool.query('SELECT * FROM calls WHERE id_mensaje = ? LIMIT 1', [id_mensaje]);
    const data = (rows && rows[0]) ? rows[0] : null;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /videollamadas/by-message/:id_mensaje error', err);
    return res.status(500).json({ success: false, message: 'Error obteniendo llamada por mensaje', error: err.message });
  }
});

// Cambiar estado de la llamada
router.post('/status', async (req, res) => {
    try {
        const { roomId, status } = req.body;
        if (!roomId || !status) return res.status(400).json({ success: false, message: 'Faltan parámetros: roomId, status' });
    try {
      await pool.query('CALL sp_SetCallStatus(?, ?)', [roomId, status]);
      return res.json({ success: true });
    } catch (callErr) {
      // Fallback: si el procedimiento no existe o hay error, intentar UPDATE directo a la tabla calls
      console.warn('sp_SetCallStatus failed, attempting fallback update:', callErr && callErr.message);
      try {
        await pool.query('UPDATE calls SET status = ?, updated_at = NOW() WHERE room_id = ?', [status, roomId]);
        // Insertar un log mínimo en call_logs si existe la tabla
        try { await pool.query('INSERT INTO call_logs (room_id, action, created_at) VALUES (?, ?, NOW())', [roomId, status]); } catch(e) { /* ignore */ }
        return res.json({ success: true, fallback: true });
      } catch (fallbackErr) {
        console.error('Fallback update failed for /status', fallbackErr);
        return res.status(500).json({ success: false, message: 'Error seteando status (fallback failed)', error: fallbackErr.message });
      }
    }
    } catch (err) {
        console.error('POST /videollamadas/status error', err);
        return res.status(500).json({ success: false, message: 'Error seteando status', error: err.message });
    }
});

// Obtener llamadas relacionadas a un usuario (caller o callee)
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const [rows] = await pool.query('CALL sp_GetCallsForUser(?)', [userId]);
        const data = (rows && rows[0]) ? rows[0] : [];
        return res.json({ success: true, count: data.length, data });
    } catch (err) {
        console.error('GET /videollamadas/user/:userId error', err);
        return res.status(500).json({ success: false, message: 'Error obteniendo llamadas', error: err.message });
    }
});

module.exports = router;

/*
  SQL propuesto (ejecutar en MySQL) — ejemplo de scripts para crear tablas y procedimientos.
  Copia y pega en tu cliente MySQL (phpMyAdmin o mysql CLI). Ajusta prefijos y tipos según tu proyecto.

-- =================================================================================
-- 1) Tablas
-- =================================================================================
CREATE TABLE IF NOT EXISTS calls (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(128) NOT NULL UNIQUE,
  caller_id BIGINT NOT NULL,
  callee_id BIGINT DEFAULT NULL,
  offer LONGTEXT,
  answer LONGTEXT,
  status ENUM('ringing','accepted','rejected','connected','ended','expired') DEFAULT 'ringing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS call_candidates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  call_id BIGINT NOT NULL,
  sender_id BIGINT DEFAULT NULL,
  candidate TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS call_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(128) DEFAULT NULL,
  user_id BIGINT DEFAULT NULL,
  action VARCHAR(64) DEFAULT NULL,
  meta JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ejemplo (referencia) tabla mensajes (si no la tienes)
CREATE TABLE IF NOT EXISTS mensajes (
  id_mensaje BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_conversacion BIGINT NOT NULL,
  id_persona_envia BIGINT NOT NULL,
  id_persona_recibe BIGINT NOT NULL,
  contenido TEXT,
  fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leido TINYINT(1) DEFAULT 0,
  borrado_por_emisor TINYINT(1) DEFAULT 0,
  borrado_por_receptor TINYINT(1) DEFAULT 0
);

-- =================================================================================
-- 2) Procedimientos almacenados
-- =================================================================================
DELIMITER $$

-- Crear o actualizar offer (inserta si no existe, actualiza si ya existe)
CREATE PROCEDURE sp_CreateOrUpdateCallOffer(
  IN p_room_id VARCHAR(128),
  IN p_caller_id BIGINT,
  IN p_callee_id BIGINT,
  IN p_offer LONGTEXT)
BEGIN
  DECLARE v_call_id BIGINT;
  SELECT id INTO v_call_id FROM calls WHERE room_id = p_room_id LIMIT 1;
  IF v_call_id IS NULL THEN
    INSERT INTO calls (room_id, caller_id, callee_id, offer, status, expires_at)
    VALUES (p_room_id, p_caller_id, p_callee_id, p_offer, 'ringing', DATE_ADD(NOW(), INTERVAL 10 MINUTE));
    SELECT LAST_INSERT_ID() AS insertId, p_room_id AS room_id, 'created' AS action;
  ELSE
    UPDATE calls SET offer = p_offer, caller_id = p_caller_id, callee_id = p_callee_id, status = 'ringing', updated_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
    WHERE id = v_call_id;
    SELECT v_call_id AS insertId, p_room_id AS room_id, 'updated' AS action;
  END IF;
END$$

DELIMITER $$
-- Obtener offer por room
CREATE PROCEDURE sp_GetOfferByRoom(IN p_room_id VARCHAR(128))
BEGIN
  SELECT id, room_id, caller_id, callee_id, offer, status, created_at, updated_at, expires_at
  FROM calls WHERE room_id = p_room_id LIMIT 1;
END$$

DELIMITER $$
-- Guardar answer y marcar llamada como accepted/connected
CREATE PROCEDURE sp_SaveAnswer(IN p_room_id VARCHAR(128), IN p_answer LONGTEXT, IN p_user_id BIGINT)
BEGIN
  UPDATE calls SET answer = p_answer, status = 'accepted', updated_at = NOW() WHERE room_id = p_room_id;
  INSERT INTO call_logs (room_id, user_id, action, meta) VALUES (p_room_id, p_user_id, 'answer_saved', JSON_OBJECT('length', CHAR_LENGTH(p_answer)));
  SELECT room_id, status, updated_at FROM calls WHERE room_id = p_room_id LIMIT 1;
END$$

DELIMITER $$
-- Obtener answer por room
CREATE PROCEDURE sp_GetAnswerByRoom(IN p_room_id VARCHAR(128))
BEGIN
  SELECT id, room_id, answer, status, updated_at FROM calls WHERE room_id = p_room_id LIMIT 1;
END$$


DELIMITER $$
-- Añadir candidate (asocia al call mediante room_id)
CREATE PROCEDURE sp_AddCandidate(IN p_room_id VARCHAR(128), IN p_sender_id BIGINT, IN p_candidate TEXT)
BEGIN
  DECLARE v_call_id BIGINT;
  SELECT id INTO v_call_id FROM calls WHERE room_id = p_room_id LIMIT 1;
  IF v_call_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Call no encontrada para room_id';
  ELSE
    INSERT INTO call_candidates (call_id, sender_id, candidate) VALUES (v_call_id, p_sender_id, p_candidate);
  END IF;
END$$

DELIMITER $$
-- Obtener candidatos por room (retorna sender_id y candidate)
CREATE PROCEDURE sp_GetCandidatesByRoom(IN p_room_id VARCHAR(128))
BEGIN
  SELECT cc.id, cc.sender_id, cc.candidate, cc.created_at
  FROM call_candidates cc
  JOIN calls c ON c.id = cc.call_id
  WHERE c.room_id = p_room_id
  ORDER BY cc.created_at ASC;
END$$

DELIMITER $$
-- Cambiar estado de la llamada
CREATE PROCEDURE sp_SetCallStatus(IN p_room_id VARCHAR(128), IN p_status VARCHAR(32))
BEGIN
  UPDATE calls SET status = p_status, updated_at = NOW() WHERE room_id = p_room_id;
  INSERT INTO call_logs (room_id, action) VALUES (p_room_id, p_status);
  SELECT room_id, status FROM calls WHERE room_id = p_room_id LIMIT 1;
END$$

DELIMITER $$
-- Obtener llamadas relacionadas a un usuario (caller o callee), con JOIN a tabla personas si existe
CREATE PROCEDURE sp_GetCallsForUser(IN p_user_id BIGINT)
BEGIN
  SELECT c.*, p1.nombre AS caller_nombre, p1.imagenUrl AS caller_imagen, p2.nombre AS callee_nombre, p2.imagenUrl AS callee_imagen
  FROM calls c
  LEFT JOIN personas p1 ON p1.id_persona = c.caller_id
  LEFT JOIN personas p2 ON p2.id_persona = c.callee_id
  WHERE c.caller_id = p_user_id OR c.callee_id = p_user_id
  ORDER BY c.created_at DESC LIMIT 50;
END$$

DELIMITER $$
-- Limpieza de llamadas expiradas (por ejemplo cron cada 5 minutos)
CREATE PROCEDURE sp_CleanupExpiredCalls()
BEGIN
  DELETE FROM call_candidates WHERE call_id IN (SELECT id FROM calls WHERE expires_at IS NOT NULL AND expires_at < NOW());
  DELETE FROM calls WHERE expires_at IS NOT NULL AND expires_at < NOW();
END$$

DELIMITER ;

*/
