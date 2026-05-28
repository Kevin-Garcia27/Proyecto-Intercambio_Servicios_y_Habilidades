const db = require('../db');

async function createTable() {
    try {
        console.log('Creating onboarding_drivers table if not exists...');

        await db.query(`
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
        `);

        console.log('Table onboarding_drivers created or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating onboarding_drivers table:', error);
        process.exit(1);
    }
}

createTable();
