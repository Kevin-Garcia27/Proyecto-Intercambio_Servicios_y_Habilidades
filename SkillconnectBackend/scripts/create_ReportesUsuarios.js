const db = require('../db');

async function createTable() {
    try {
        console.log('Creating ReportesUsuarios table if not exists...');
        
        await db.query(`
            CREATE TABLE IF NOT EXISTS ReportesUsuarios (
                id_reporte INT AUTO_INCREMENT PRIMARY KEY,
                reporter_id INT NOT NULL,
                reported_user_id INT NOT NULL,
                id_perfil_persona INT NOT NULL,
                motivo_descripcion TEXT NOT NULL,
                descripcion TEXT,
                fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estado VARCHAR(50) DEFAULT 'Pendiente',
                FOREIGN KEY (reporter_id) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (reported_user_id) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
                FOREIGN KEY (id_perfil_persona) REFERENCES Personas(id_Perfil_Persona) ON DELETE CASCADE
            )
        `);

        console.log('Table ReportesUsuarios created or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    }
}

createTable();
