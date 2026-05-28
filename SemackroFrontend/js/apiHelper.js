// API Helper - Compatible con restricciones de Chrome para red local
// Usar este helper para todas las peticiones API en lugar de fetch directo

class APIHelper {
    constructor() {
        this.baseURL = window.API_BASE || 'https://serversemackro.up.railway.app/api';
        this.isSecureContext = window.location.protocol === 'https:';
        this.isLocalAPI = this.baseURL.includes('localhost') || this.baseURL.includes('127.0.0.1');
    }

    // Fetch mejorado que maneja restricciones de Chrome
    async fetch(url, options = {}) {
        const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        const isLocalRequest = fullURL.includes('localhost') || fullURL.includes('127.0.0.1') || fullURL.includes('.local');
        
        if (isLocalRequest && this.isSecureContext) {
            // Para Chrome: marcar requests locales desde contexto seguro
            const fetchOptions = {
                ...options,
                targetAddressSpace: 'private',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            };
            
            console.log('🔒 Local network request from secure context');
            return fetch(fullURL, fetchOptions);
        }
        
        return fetch(fullURL, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
    }

    // Métodos de conveniencia
    async get(endpoint) {
        return this.fetch(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.fetch(endpoint, { method: 'DELETE' });
    }

    // Helper para mostrar advertencias sobre compatibilidad
    checkCompatibility() {
        if (this.isLocalAPI && this.isSecureContext) {
            console.warn('⚠️ ADVERTENCIA: Usando API local desde contexto HTTPS');
            console.log('💡 Chrome puede requerir permisos explícitos para acceso de red local');
            console.log('🔧 Usando targetAddressSpace: private para compatibilidad');
            return false;
        }
        return true;
    }
}

// Instancia global
window.API = new APIHelper();

// Mantener compatibilidad con código existente
window.safeFetch = (url, options) => window.API.fetch(url, options);

// Verificar compatibilidad al cargar
document.addEventListener('DOMContentLoaded', () => {
    window.API.checkCompatibility();
});

console.log('🚀 APIHelper cargado - Compatible con Chrome local network restrictions');