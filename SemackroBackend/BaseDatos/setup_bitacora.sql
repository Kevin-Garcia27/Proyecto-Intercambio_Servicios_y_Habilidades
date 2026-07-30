DELIMITER //

-- 1. Crear Tabla de Bitácora
CREATE TABLE IF NOT EXISTS BitacoraAcciones (
    ID_Bitacora INT AUTO_INCREMENT PRIMARY KEY,
    ID_Usuario INT,
    Accion VARCHAR(100) NOT NULL,
    Modulo VARCHAR(100) NOT NULL,
    Detalles TEXT,
    IP VARCHAR(45),
    Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuarios(ID_Usuario) ON DELETE SET NULL
)//

-- 2. Procedimiento para Insertar en la Bitácora
CREATE PROCEDURE IF NOT EXISTS sp_RegistrarAccionBitacora (
    IN p_ID_Usuario INT,
    IN p_Accion VARCHAR(100),
    IN p_Modulo VARCHAR(100),
    IN p_Detalles TEXT,
    IN p_IP VARCHAR(45)
)
BEGIN
    INSERT INTO BitacoraAcciones (ID_Usuario, Accion, Modulo, Detalles, IP)
    VALUES (p_ID_Usuario, p_Accion, p_Modulo, p_Detalles, p_IP);
END//

-- 3. Procedimiento para Consultar Bitácora con Filtros (Admin)
CREATE PROCEDURE IF NOT EXISTS sp_ObtenerBitacora (
    IN p_FiltroUsuario VARCHAR(100),
    IN p_FiltroModulo VARCHAR(100),
    IN p_FechaInicio DATETIME,
    IN p_FechaFin DATETIME
)
BEGIN
    SELECT 
        b.ID_Bitacora,
        b.ID_Usuario,
        COALESCE(u.Nombre, 'Sistema') AS NombreUsuario,
        b.Accion,
        b.Modulo,
        b.Detalles,
        b.IP,
        b.Fecha
    FROM 
        BitacoraAcciones b
    LEFT JOIN 
        Usuarios u ON b.ID_Usuario = u.ID_Usuario
    WHERE 
        (p_FiltroUsuario IS NULL OR p_FiltroUsuario = '' OR u.Nombre LIKE CONCAT('%', p_FiltroUsuario, '%'))
        AND (p_FiltroModulo IS NULL OR p_FiltroModulo = '' OR b.Modulo = p_FiltroModulo)
        AND (p_FechaInicio IS NULL OR b.Fecha >= p_FechaInicio)
        AND (p_FechaFin IS NULL OR b.Fecha <= p_FechaFin)
    ORDER BY 
        b.Fecha DESC
    LIMIT 1000; -- Límite de seguridad
END//

DELIMITER ;
