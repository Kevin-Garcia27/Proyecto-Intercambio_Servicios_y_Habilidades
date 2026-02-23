// db.js

// 1. Cargar variables de entorno (desde el archivo .env)
require('dotenv').config();

// 2. Importar el driver de MySQL (mysql2)
const mysql = require('mysql2');

// 3. Crear el pool de conexiones a la base de datos
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 4. Función de prueba: Intenta conectarse a la DB al iniciar el servidor
pool.getConnection((err, connection) => {
    if (err) {
        // *** ESTA LÍNEA MOSTRARÁ EL ERROR REAL ***
        console.error('ERROR CRÍTICO DE CONEXIÓN A DB. Detalles del fallo:');
        console.error(err); 
        return;
    }
    console.log('Conexión exitosa a la base de datos SkillConnect2025 (vía túnel SSH).');
    connection.release(); // Libera la conexión de vuelta al pool
});

// 5. Exportar el pool con soporte para promesas (lo que usa 'await' en auth.js)
module.exports = pool.promise();