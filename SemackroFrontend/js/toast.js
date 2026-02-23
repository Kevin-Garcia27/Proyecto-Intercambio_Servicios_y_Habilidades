/**
 * Sistema de Notificaciones Toast "SEMACKRO Premium"
 * Ligero, sin dependencias externas pesadas, animaciones fluidas.
 */
const Toast = {
    // Inicializar contenedor si no existe
    init() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
    },

    /**
     * Mostrar notificación
     * @param {string} title - Título corto (ej: "Éxito")
     * @param {string} message - Mensaje detallado
     * @param {string} type - 'success', 'error', 'info', 'warning'
     * @param {number} duration - Duración en ms (default 4000)
     */
    show(title, message, type = 'info', duration = 4000) {
        this.init();

        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        // Mapeo de iconos (usando Iconify que ya está en tu proyecto)
        const icons = {
            success: 'mdi:check-circle',
            error: 'mdi:alert-circle',
            info: 'mdi:information',
            warning: 'mdi:alert'
        };

        const iconName = icons[type] || icons.info;

        toast.className = `sc-toast sc-toast-${type}`;
        
        // Determinar si es diseño de una sola línea (sin mensaje secundario)
        // Si no hay mensaje, alineamos el título verticalmente al centro del contenedor
        const singleLine = !message;
        
        toast.innerHTML = `
            <div class="sc-toast-icon">
                <span class="iconify" data-icon="${iconName}"></span>
            </div>
            <div class="sc-toast-content" style="${singleLine ? 'justify-content: center;' : ''}">
                <div class="sc-toast-title" style="display: flex; align-items: center; gap: 6px; line-height: 1.2;">
                    ${title}
                </div>
                ${message ? `<div class="sc-toast-message">${message}</div>` : ''}
            </div>
            <button class="sc-toast-close" onclick="Toast.close(this.parentElement)">
                <span class="iconify" data-icon="mdi:close" style="font-size: 18px;"></span>
            </button>
        `;

        // Añadir al DOM
        // Insertamos al principio para que los nuevos aparezcan arriba (o appendChild para abajo)
        // Usaremos appendChild y flex-direction: column-reverse en CSS si queremos que stackeen hacia arriba
        // Por ahora standard: appendChild
        container.appendChild(toast);

        // Forzar reflow para activar transición CSS
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Configurar auto-cierre
        if (duration > 0) {
            setTimeout(() => {
                Toast.close(toast);
            }, duration);
        }
    },

    // Métodos helper rápidos
    success(title, message, duration) { this.show(title, message, 'success', duration); },
    error(title, message, duration) { this.show(title, message, 'error', duration); },
    info(title, message, duration) { this.show(title, message, 'info', duration); },
    warning(title, message, duration) { this.show(title, message, 'warning', duration); },

    // Notificación de Llamada Entrante (Estilo iOS/Android)
    call(callerName, onAccept, onReject) {
        this.init();
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'sc-toast sc-toast-call';
        // Estilo específico en línea para asegurar override
        toast.style.flexDirection = 'column';
        toast.style.padding = '16px';
        toast.style.gap = '12px';
        
        toast.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; width:100%;">
                <div style="width:48px; height:48px; min-width:48px; background:#3b82f6; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                     <span class="iconify" data-icon="mdi:video" style="font-size:24px;"></span>
                </div>
                <div style="flex:1;">
                    <div style="font-weight:700; color:#111827; font-size:1rem; line-height:1.2;">${callerName}</div>
                    <div style="color:#6b7280; font-size:0.85rem;">te está llamando...</div>
                </div>
            </div>
            <div style="display:flex; gap:12px; width:100%; margin-top:4px;">
                <button class="sc-btn-reject" style="flex:1; padding:10px; border-radius:10px; background:#ef4444; color:white; border:none; font-weight:600; font-size:0.9rem; cursor:pointer; transition:all 0.2s; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.25);">
                    Rechazar
                </button>
                <button class="sc-btn-accept" style="flex:1; padding:10px; border-radius:10px; background:#10b981; color:white; border:none; font-weight:600; font-size:0.9rem; cursor:pointer; box-shadow:0 4px 12px rgba(16, 185, 129, 0.35); transition:all 0.15s;">
                    Contestar
                </button>
            </div>
        `;

        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));

        // Event listeners
        const btnReject = toast.querySelector('.sc-btn-reject');
        const btnAccept = toast.querySelector('.sc-btn-accept');

        btnReject.onclick = () => {
            if(onReject) onReject();
            Toast.close(toast);
        };
        
        btnAccept.onclick = () => {
            if(onAccept) onAccept();
            Toast.close(toast);
        };
        
        // Efecto hover mejorado
        btnReject.onmouseover = () => {
            btnReject.style.background = '#dc2626';
            btnReject.style.transform = 'scale(1.02)';
        };
        btnReject.onmouseout = () => {
            btnReject.style.background = '#ef4444';
            btnReject.style.transform = 'scale(1)';
        };
        
        btnAccept.onmouseover = () => {
            btnAccept.style.background = '#059669';
            btnAccept.style.transform = 'scale(1.02)';
        };
        btnAccept.onmouseout = () => {
            btnAccept.style.background = '#10b981';
            btnAccept.style.transform = 'scale(1)';
        };
        
        return toast; // Retornar instancia por si se necesita cerrar programáticamente (timeout)
    },

    // Función para cerrar con animación
    close(element) {
        if (!element) return;
        element.classList.remove('show'); // Inicia animación salida
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px) scale(0.95)';
        
        // Esperar a que termine la transición CSS (0.4s) antes de eliminar del DOM
        setTimeout(() => {
            if (element.parentElement) {
                element.remove();
            }
        }, 400);
    }
};

// Exportar globalmente
window.Toast = Toast;
