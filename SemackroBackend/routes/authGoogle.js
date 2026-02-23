// routes/authGoogle.js
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura_2025_SEMACKRO';
const JWT_EXPIRES_IN = '7d';

// Ruta para iniciar autenticación con Google
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Callback de Google después de autenticación
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login.html?error=auth_failed',
    session: false 
  }),
  async (req, res) => {
    try {
      console.log(' Procesando callback de Google...');
      console.log(' Usuario:', req.user);
      
      const user = req.user;
      
      // Generar token JWT
      const token = jwt.sign(
        { 
          id_usuario: user.id_usuario,
          correo: user.correo 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      console.log(' Token JWT generado');
      
      // Redirigir al frontend con el token en la URL
      // El frontend capturará estos parámetros y los guardará en localStorage
      // Auto-detectar entorno basado en el host de la request
      const requestHost = req.get('host') || '';
      const isLocal = requestHost.includes('localhost') || requestHost.includes('127.0.0.1');
      const frontendUrl = isLocal ? 'http://localhost:5050' : (process.env.FRONTEND_URL || 'https://SEMACKRO.duckdns.org');
      const redirectUrl = `${frontendUrl}/login.html?token=${token}&userId=${user.id_usuario}&email=${encodeURIComponent(user.correo)}&source=google`;
      
      console.log(' Redirigiendo a:', redirectUrl);
      
      res.redirect(redirectUrl);
      
    } catch (error) {
      console.error(' Error en callback de Google:', error);
      res.redirect('/login.html?error=server_error');
    }
  }
);

// Ruta de logout (opcional)
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  });
});

module.exports = router;
