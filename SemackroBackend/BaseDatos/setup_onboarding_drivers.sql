-- Tabla para registrar drivers/onboarding ejecutados por persona
-- Permite que cada driver se ejecute una sola vez automaticamente por usuario/perfil

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
);
