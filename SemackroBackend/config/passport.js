// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db');
const bcrypt = require('bcrypt');

// Configuración de Google OAuth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('📧 Usuario de Google autenticado:', profile.emails[0].value);
      
      const email = profile.emails[0].value;
      const displayName = profile.displayName || 'Usuario de Google';
      
      // 1. Buscar si el usuario ya existe en la base de datos
      const [existingUsers] = await pool.execute(
        'SELECT id_usuario, correo FROM Usuarios WHERE correo = ?',
        [email]
      );
      
      if (existingUsers.length > 0) {
        // Usuario ya existe
        console.log('✅ Usuario existente encontrado:', email);
        return done(null, {
          id_usuario: existingUsers[0].id_usuario,
          correo: existingUsers[0].correo,
          isNew: false
        });
      }
      
      // 2. Si no existe, crear nuevo usuario
      console.log('📝 Creando nuevo usuario:', email);
      
      // Usar el email como contraseña (hash)
      const saltRounds = 10;
      const contrasena_hash = await bcrypt.hash(email, saltRounds);
      
      const [result] = await pool.execute(
        'INSERT INTO Usuarios (correo, contrasena_hash) VALUES (?, ?)',
        [email, contrasena_hash]
      );
      
      const nuevoUsuarioId = result.insertId;
      
      // Crear registro en tabla Personas
      await pool.execute(
        'INSERT INTO Personas (id_Usuario) VALUES (?)',
        [nuevoUsuarioId]
      );
      
      console.log('✅ Nuevo usuario creado con ID:', nuevoUsuarioId);
      
      return done(null, {
        id_usuario: nuevoUsuarioId,
        correo: email,
        isNew: true
      });
      
    } catch (error) {
      console.error('  Error en autenticación de Google:', error);
      return done(error, null);
    }
  }
));

// Serializar usuario para la sesión
passport.serializeUser((user, done) => {
  done(null, user.id_usuario);
});

// Deserializar usuario desde la sesión
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.execute(
      'SELECT id_usuario, correo FROM Usuarios WHERE id_usuario = ?',
      [id]
    );
    
    if (users.length > 0) {
      done(null, users[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
