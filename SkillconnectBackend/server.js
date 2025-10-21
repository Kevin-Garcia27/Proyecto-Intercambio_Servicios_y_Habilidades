// server.js

// 0. Configuración del Entorno (DEBE IR PRIMERO)
require('dotenv').config(); 

// 1. Importaciones de Librerías
const express = require('express');
const cors = require('cors'); 

// Importar rutas
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const personasRoutes = require('./routes/Personas');
const habilidadesRoutes = require('./routes/HabilidadesYServicios_Persona');
const direccionesRoutes = require('./routes/Direcciones');
const categoriasRoutes = require('./routes/CategoriasGeneralesHabilidades');
const geolocalizacionRoutes = require('./routes/Geolocalizacion');

const app = express();
// Obtiene el puerto del .env o usa 3001 por defecto
const port = process.env.PORT || 3001; 

// 2. Middleware de CORS (Permite al frontend hablar con el backend)
app.use(cors({
    // El frontend ahora corre en el puerto 5500 gracias a Live Server
    origin: 'http://127.0.0.1:5500' 
}));

// 3. Middleware para procesar JSON (SOLO UNA VEZ)
app.use(express.json()); 

// 4. Configurar las rutas
app.use('/api', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/habilidades', habilidadesRoutes);
app.use('/api/direcciones', direccionesRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/geolocalizacion', geolocalizacionRoutes);

// Prueba básica de que el servidor Express funciona
app.get('/', (req, res) => {
    res.send('Servidor Skill Connect Activo!');
});

// 5. Iniciar el servidor
app.listen(port, () => {
    // Asegúrate de que el db.js se importe y ejecute su conexión de prueba
    require('./db');
    console.log(`Servidor escuchando en http://localhost:${port}`);
});