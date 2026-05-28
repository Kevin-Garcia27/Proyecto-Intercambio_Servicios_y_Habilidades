// Configuracion global de URLs y helper de red tolerante a fallos
(function () {
    const hostname = window.location.hostname;
    const RAILWAY_BASE = 'https://serversemackro.up.railway.app';
    const LOCAL_DEV_BASE = 'http://localhost:3001';
    const searchParams = new URLSearchParams(window.location.search);

    const isPrivateHost =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    function normalizeBase(url) {
        try {
            if (!url) return null;
            return new URL(url).origin;
        } catch (_) {
            return null;
        }
    }

    // Produccion: siempre Railway. Desarrollo local/LAN: se permite override.
    const rawOverrideBase =
        searchParams.get('apiBase') ||
        localStorage.getItem('SEMACKRO_API_BASE');
    const devOverride = normalizeBase(rawOverrideBase);

    const backendBase = isPrivateHost
        ? (devOverride || LOCAL_DEV_BASE)
        : RAILWAY_BASE;

    const rawFrontendOverride =
        searchParams.get('frontendUrl') ||
        localStorage.getItem('SEMACKRO_FRONTEND_URL');
    const frontendBase = normalizeBase(rawFrontendOverride) || window.location.origin;

    const rawEmailFromName =
        searchParams.get('emailFromName') ||
        localStorage.getItem('SEMACKRO_EMAIL_FROM_NAME') ||
        'SEMACKRO';
    const emailFromName = String(rawEmailFromName).trim().slice(0, 80) || 'SEMACKRO';

    // Limpieza preventiva: si el navegador traia override viejo, quitarlo en produccion.
    if (!isPrivateHost && localStorage.getItem('SEMACKRO_API_BASE')) {
        localStorage.removeItem('SEMACKRO_API_BASE');
    }

    window.APP_CONFIG = {
        BACKEND_URL: backendBase,
        API_BASE: `${backendBase}/api`,
        FRONTEND_URL: frontendBase,
        EMAIL_FROM_NAME: emailFromName,
        HF_API_URL: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2'
    };

    window.BACKEND_URL = window.APP_CONFIG.BACKEND_URL;
    window.API_BASE = window.APP_CONFIG.API_BASE;
    window.FRONTEND_URL = window.APP_CONFIG.FRONTEND_URL;
    window.EMAIL_FROM_NAME = window.APP_CONFIG.EMAIL_FROM_NAME;
    window.HF_API_URL = window.APP_CONFIG.HF_API_URL;

    window.safeFetch = async (url, options = {}) => {
        const timeoutMs = Number(options.timeoutMs || 20000);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: options.signal || controller.signal
            });
            return response;
        } finally {
            clearTimeout(timer);
        }
    };
})();
