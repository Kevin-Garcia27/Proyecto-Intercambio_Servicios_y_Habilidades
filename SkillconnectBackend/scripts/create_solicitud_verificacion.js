const db = require('../db');

async function createTable() {
    try {
        console.log('Creating solicitud_verificacion table if not exists...');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS solicitud_verificacion (
                id INT AUTO_INCREMENT PRIMARY KEY,
                id_Perfil INT NOT NULL,
                estado VARCHAR(50) DEFAULT 'pendiente',
                fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_revision DATETIME NULL,
                revisado_por INT NULL,
                comentario_admin TEXT NULL,
                FOREIGN KEY (id_Perfil) REFERENCES Personas(id_Perfil_Persona) ON DELETE CASCADE
            )
        `);

        console.log('Table solicitud_verificacion created or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

createTable();
