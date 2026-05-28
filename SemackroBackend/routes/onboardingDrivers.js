const express = require('express');
const router = express.Router();
const db = require('../db');

let ensureTablePromise = null;

function ensureOnboardingDriversTable() {
    if (!ensureTablePromise) {
        ensureTablePromise = db.query(`
            CREATE TABLE IF NOT EXISTS onboarding_drivers (
                id_onboarding_driver BIGINT AUTO_INCREMENT PRIMARY KEY,
                id_Perfil_Persona BIGINT NOT NULL,
                clave_driver VARCHAR(120) NOT NULL,
                ejecutado TINYINT(1) NOT NULL DEFAULT 1,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_onboarding_drivers_persona
                    FOREIGN KEY (id_Perfil_Persona)
                    REFERENCES Personas(id_Perfil_Persona)
                    ON DELETE CASCADE,
                UNIQUE KEY uq_onboarding_driver_persona_clave (id_Perfil_Persona, clave_driver)
            )
        `).catch((error) => {
            ensureTablePromise = null;
            throw error;
        });
    }

    return ensureTablePromise;
}

function parseIdPerfilPersona(value) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDriverKey(rawKey) {
    const key = String(rawKey || '').trim();
    if (!key) return null;
    if (key.length > 120) return null;
    return key;
}

router.get('/:idPerfilPersona/:driverKey', async (req, res) => {
    const idPerfilPersona = parseIdPerfilPersona(req.params.idPerfilPersona);
    const driverKey = normalizeDriverKey(decodeURIComponent(req.params.driverKey || ''));

    if (!idPerfilPersona || !driverKey) {
        return res.status(400).json({
            success: false,
            error: 'Parámetros inválidos para consultar onboarding driver'
        });
    }

    try {
        await ensureOnboardingDriversTable();

        const [rows] = await db.query(
            `SELECT id_Perfil_Persona, clave_driver, ejecutado
             FROM onboarding_drivers
             WHERE id_Perfil_Persona = ? AND clave_driver = ?
             LIMIT 1`,
            [idPerfilPersona, driverKey]
        );

        const row = rows && rows[0] ? rows[0] : null;
        return res.json({
            success: true,
            data: {
                id_Perfil_Persona: idPerfilPersona,
                clave_driver: driverKey,
                ejecutado: !!(row && Number(row.ejecutado) === 1)
            }
        });
    } catch (error) {
        console.error('Error al consultar onboarding driver:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error al consultar estado de onboarding driver'
        });
    }
});

router.put('/:idPerfilPersona/:driverKey', async (req, res) => {
    const idPerfilPersona = parseIdPerfilPersona(req.params.idPerfilPersona);
    const driverKey = normalizeDriverKey(decodeURIComponent(req.params.driverKey || ''));

    if (!idPerfilPersona || !driverKey) {
        return res.status(400).json({
            success: false,
            error: 'Parámetros inválidos para actualizar onboarding driver'
        });
    }

    const ejecutado = req.body && typeof req.body.ejecutado !== 'undefined'
        ? !!req.body.ejecutado
        : true;

    try {
        await ensureOnboardingDriversTable();

        await db.query(
            `INSERT INTO onboarding_drivers (id_Perfil_Persona, clave_driver, ejecutado)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
                ejecutado = VALUES(ejecutado),
                fecha_actualizacion = CURRENT_TIMESTAMP`,
            [idPerfilPersona, driverKey, ejecutado ? 1 : 0]
        );

        return res.json({
            success: true,
            data: {
                id_Perfil_Persona: idPerfilPersona,
                clave_driver: driverKey,
                ejecutado
            }
        });
    } catch (error) {
        console.error('Error al actualizar onboarding driver:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error al actualizar estado de onboarding driver'
        });
    }
});

module.exports = router;
