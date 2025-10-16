// server.js
const express = require('express');
const app = express();
const port = 3001; // El puerto donde se ejecutará tu API

// 1. Cargar la configuración de la DB (Esto ejecuta la prueba de conexión en db.js)
require('./db'); 

// 2. Importar las Rutas de Autenticación
const authRoutes = require('./routes/auth');

// Middleware para parsear JSON (permite leer los datos JSON que envía React)
app.use(express.json()); 

// 3. Configurar la URL base para las rutas de autenticación
// Todas las rutas en auth.js (como '/registro') serán accesibles en /api/registro
app.use('/api', authRoutes);

// Prueba básica de que el servidor Express funciona
app.get('/', (req, res) => {
  res.send('Servidor Skill Connect Activo!');
});

// Iniciar el servidor y escuchar el puerto
app.listen(port, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${port}`);
});
