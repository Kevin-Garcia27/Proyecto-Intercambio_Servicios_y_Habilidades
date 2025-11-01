// auth-guard.js - Protección de rutas
// Verifica que el usuario tenga sesión activa antes de acceder a páginas protegidas

(function() {
  'use strict';
  
  const usuarioId = localStorage.getItem('usuarioId');
  
  if (!usuarioId) {
    // No hay sesión activa, redirigir al login
    // Guardar la URL actual para redirigir después del login
    const currentPath = window.location.pathname;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    
    window.location.href = 'login.html';
  }
})();
