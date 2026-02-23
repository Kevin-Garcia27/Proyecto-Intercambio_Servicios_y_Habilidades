// Configuración global de URLs para entorno local y producción
// Auto-detecta el entorno basado en el hostname
(function() {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Si estamos en producción, usar el dominio DuckDNS
    // Si estamos en local, usar localhost
    window.APP_CONFIG = {
        BACKEND_URL: isLocal ? 'http://localhost:3001' : 'https://SEMACKRO.duckdns.org',
        API_BASE: isLocal ? 'http://localhost:3001/api' : 'https://SEMACKRO.duckdns.org/api',
        // Hugging Face API (Gratis) - Obtén tu token en: https://huggingface.co/settings/tokens
       
        HF_API_URL: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2'
    };
    
    // Compatibilidad con código existente
    window.BACKEND_URL = window.APP_CONFIG.BACKEND_URL;
    window.API_BASE = window.APP_CONFIG.API_BASE;
    window.HF_API_KEY = window.APP_CONFIG.HF_API_KEY;
    window.HF_API_URL = window.APP_CONFIG.HF_API_URL;
    
    console.log('🔧 Configuración de entorno:', isLocal ? 'LOCAL' : 'PRODUCCIÓN');
    console.log('📡 Backend URL:', window.BACKEND_URL);
})();

