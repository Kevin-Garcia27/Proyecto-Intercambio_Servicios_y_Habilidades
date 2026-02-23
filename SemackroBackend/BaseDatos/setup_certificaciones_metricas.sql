-- ========================================
-- SCRIPT SQL PARA CERTIFICACIONES Y MÉTRICAS
-- Ejecutar en la base de datos SEMACKRO2025
-- ========================================

-- 1. Agregar campo años de experiencia a Personas
-- EJECUTAR PRIMERO ESTE COMANDO SOLO:
-- Si da error "Duplicate column name", significa que ya existe y puedes continuar
ALTER TABLE Personas ADD COLUMN anios_experiencia INT DEFAULT 0;

-- 2. Tabla de Formación y Certificaciones
CREATE TABLE IF NOT EXISTS Certificaciones (
    id_certificacion BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_Perfil_Persona BIGINT NOT NULL,
    titulo_certificacion VARCHAR(255) NOT NULL,
    institucion VARCHAR(255),
    url_certificado TEXT, -- Aquí guardas la URL que te devuelve Cloudinary
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_persona_cert FOREIGN KEY (id_Perfil_Persona) 
        REFERENCES Personas(id_Perfil_Persona) ON DELETE CASCADE
);

-- 3. Tabla de Métricas de Desempeño (Progress Bars)
CREATE TABLE IF NOT EXISTS Metricas_Desempeno (
    id_metrica BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_Perfil_Persona BIGINT NOT NULL,
    puntualidad TINYINT DEFAULT 0,
    calidad_trabajo TINYINT DEFAULT 0,
    limpieza TINYINT DEFAULT 0,
    comunicacion TINYINT DEFAULT 0,
    CONSTRAINT fk_persona_metrica FOREIGN KEY (id_Perfil_Persona) 
        REFERENCES Personas(id_Perfil_Persona) ON DELETE CASCADE
);

-- 4. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_cert_persona ON Certificaciones(id_Perfil_Persona);
CREATE INDEX IF NOT EXISTS idx_metrica_persona ON Metricas_Desempeno(id_Perfil_Persona);

-- ========================================
-- STORED PROCEDURES
-- ========================================

-- SP: Insertar certificación
DELIMITER //
DROP PROCEDURE IF EXISTS sp_insertar_certificacion //
CREATE PROCEDURE sp_insertar_certificacion(
    IN p_id_persona BIGINT,
    IN p_titulo VARCHAR(255),
    IN p_institucion VARCHAR(255),
    IN p_url TEXT
)
BEGIN
    INSERT INTO Certificaciones (id_Perfil_Persona, titulo_certificacion, institucion, url_certificado)
    VALUES (p_id_persona, p_titulo, p_institucion, p_url);
END //
DELIMITER ;

-- SP: Actualizar métricas (insert o update)
DELIMITER //
DROP PROCEDURE IF EXISTS sp_actualizar_metricas //
CREATE PROCEDURE sp_actualizar_metricas(
    IN p_id_persona BIGINT,
    IN p_puntualidad TINYINT,
    IN p_calidad TINYINT,
    IN p_limpieza TINYINT,
    IN p_comunicacion TINYINT
)
BEGIN
    -- Verificamos si ya existen métricas para esa persona
    IF EXISTS (SELECT 1 FROM Metricas_Desempeno WHERE id_Perfil_Persona = p_id_persona) THEN
        UPDATE Metricas_Desempeno 
        SET puntualidad = p_puntualidad,
            calidad_trabajo = p_calidad,
            limpieza = p_limpieza,
            comunicacion = p_comunicacion
        WHERE id_Perfil_Persona = p_id_persona;
    ELSE
        INSERT INTO Metricas_Desempeno (id_Perfil_Persona, puntualidad, calidad_trabajo, limpieza, comunicacion)
        VALUES (p_id_persona, p_puntualidad, p_calidad, p_limpieza, p_comunicacion);
    END IF;
END //
DELIMITER ;

-- SP: Obtener perfil completo (persona + métricas + certificaciones)
DELIMITER //
DROP PROCEDURE IF EXISTS sp_obtener_perfil_completo //
CREATE PROCEDURE sp_obtener_perfil_completo(
    IN p_id_persona BIGINT
)
BEGIN
    SELECT 
        p.id_Perfil_Persona,
        p.anios_experiencia,
        -- Datos de la tabla Métricas
        IFNULL(m.puntualidad, 0) AS puntualidad,
        IFNULL(m.calidad_trabajo, 0) AS calidad_trabajo,
        IFNULL(m.limpieza, 0) AS limpieza,
        IFNULL(m.comunicacion, 0) AS comunicacion,
        -- Datos de la tabla Certificaciones
        c.id_certificacion,
        c.titulo_certificacion,
        c.institucion,
        c.url_certificado,
        c.fecha_registro
    FROM Personas p
    LEFT JOIN Metricas_Desempeno m ON p.id_Perfil_Persona = m.id_Perfil_Persona
    LEFT JOIN Certificaciones c ON p.id_Perfil_Persona = c.id_Perfil_Persona
    WHERE p.id_Perfil_Persona = p_id_persona;
END //
DELIMITER ;

-- ========================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ========================================

-- Insertar métricas de prueba para usuario 28 (Dilmer)
-- INSERT INTO Metricas_Desempeno (id_Perfil_Persona, puntualidad, calidad_trabajo, limpieza, comunicacion)
-- VALUES (28, 85, 92, 78, 95);

-- Insertar certificación de prueba para usuario 28
-- INSERT INTO Certificaciones (id_Perfil_Persona, titulo_certificacion, institucion, url_certificado)
-- VALUES (28, 'Certificación en Electricidad Industrial', 'SENA Colombia', 'https://cloudinary.com/ejemplo.pdf');

-- Actualizar años de experiencia
-- UPDATE Personas SET anios_experiencia = 5 WHERE id_Perfil_Persona = 28;
