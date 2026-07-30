/**
 * SEMACKRO — Helper global de permisos
 * ======================================
 * Reemplaza las verificaciones hardcodeadas de id_rol por
 * verificaciones basadas en claves de permisos dinámicos.
 *
 * Uso: window.Permisos.tienePermiso('VER_METRICAS')
 *      window.Permisos.esAdmin()
 */
window.Permisos = {
    /**
     * Obtiene la lista de permisos cacheada.
     * @returns {string[]} Array de claves de permisos (ej: ['VER_METRICAS', 'MODERAR_USUARIOS'])
     */
    _obtenerPermisos() {
        try {
            return JSON.parse(sessionStorage.getItem('usuarioPermisos') || localStorage.getItem('usuarioPermisos') || '[]');
        } catch {
            return [];
        }
    },

    /**
     * Verifica si el usuario tiene un permiso específico.
     * @param {string} clave — Clave del permiso (ej: 'VER_METRICAS')
     * @returns {boolean}
     */
    tienePermiso(clave) {
        return this._obtenerPermisos().includes(clave);
    },

    /**
     * Verifica si el usuario tiene TODOS los permisos administrativos clave.
     * Fallback: si no hay permisos en localStorage/sessionStorage, revisa id_rol === '1'.
     * @returns {boolean}
     */
    esAdmin() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) {
            return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        }
        return permisos.includes('VER_METRICAS')
            && permisos.includes('MODERAR_USUARIOS')
            && permisos.includes('rolesPermisos:ver');
    },

    /** ¿Puede ver reportes y métricas de uso? */
    puedeVerReportes() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_METRICAS');
    },

    /** ¿Puede ver y gestionar usuarios reportados? */
    puedeGestionarReportesUsuarios() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_REPORTES_USUARIOS');
    },

    /** ¿Puede ver solicitudes de verificación? */
    puedeVerVerificaciones() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_SOLICITUDES_VERIFICACION');
    },

    /** ¿Puede bloquear usuarios desde la tabla de reportados? */
    puedeBloquearReportados() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('BLOQUEAR_REPORTADOS');
    },

    /** ¿Puede bloquear y moderar usuarios? */
    puedeModerar() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('MODERAR_USUARIOS');
    },

    /** ¿Puede editar configuraciones y tablas maestras? */
    puedeConfigurar() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('GESTIONAR_CONFIGURACION')
            || permisos.includes('configGenerales:ver')
            || permisos.includes('modalidades:ver')
            || permisos.includes('categorias:ver')
            || permisos.includes('variables:ver')
            || permisos.includes('motivosBloqueo:ver')
            || permisos.includes('rolesPermisos:ver');
    },

    /** ¿Puede solicitar y concretar intercambios? */
    puedeIntercambiar() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('ACEPTAR_INTERCAMBIOS');
    },

    /** ¿Puede ver el panel global de postulaciones (antes historial)? */
    puedeVerHistorial() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_POSTULACIONES_GLOBALES');
    },

    /** ¿Puede ver el Directorio General? */
    puedeVerDirectorio() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_DIRECTORIO');
    },

    /** Determina si tiene acceso a cualquier sección del panel de administración */
    puedeVerBitacora() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_BITACORA');
    },

    /** Determina si tiene acceso a cualquier sección del panel de administración */
    esAdminOPersonalAutorizado() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_METRICAS')
            || permisos.includes('MODERAR_USUARIOS')
            || permisos.includes('VER_REPORTES_USUARIOS')
            || this.puedeConfigurar()
            || permisos.includes('VER_DIRECTORIO')
            || permisos.includes('VER_SOLICITUDES_VERIFICACION')
            || permisos.includes('VER_BITACORA');
    },

    /** ¿Puede crear nuevas cuentas de usuario? */
    puedeCrearCuentas() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('CREAR_CUENTAS');
    },

    /** ¿Puede editar perfiles de usuarios? */
    puedeEditarUsuarios() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('EDITAR_USUARIOS');
    },

    /** ¿Puede asignar roles o cambiar permisos de usuarios? */
    puedeAsignarRolesPermisos() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('ASIGNAR_ROLES_PERMISOS');
    },

    /** ¿Puede ver solicitudes de verificación (cola de identidad y certificaciones)? */
    puedeVerSolicitudesVerificacion() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('VER_SOLICITUDES_VERIFICACION');
    },

    /** ¿Puede aprobar o rechazar solicitudes de verificación? */
    puedeGestionarVerificaciones() {
        const permisos = this._obtenerPermisos();
        if (permisos.length === 0) return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        return permisos.includes('GESTIONAR_VERIFICACIONES');
    },

    /**
     * Verifica si el usuario tiene permiso para acceder a una vista de la SPA
     * @param {string} viewName - El nombre de la vista (ej. 'panel-admin')
     * @returns {boolean}
     */
    puedeAccederVista(viewName) {
        // Solo las vistas más críticas no pueden restringirse desde el panel
        const vistasBasicas = ['descubrir', 'perfil'];
        if (vistasBasicas.includes(viewName)) return true;

        // El panel de administración es accesible para cualquier personal autorizado
        if (viewName === 'panel-admin') return this.esAdminOPersonalAutorizado();

        const permisos = this._obtenerPermisos();

        if (permisos.length === 0) {
            // Fallback para administradores legacy sin JSON de permisos
            return sessionStorage.getItem('usuarioRolId') === '1' || localStorage.getItem('usuarioRolId') === '1';
        }

        // Si es ordenesTrabajo, permitir si tiene ordenesTrabajo O VER_POSTULACIONES_GLOBALES
        if (viewName === 'ordenesTrabajo') {
            return permisos.includes('ordenesTrabajo') || permisos.includes('VER_POSTULACIONES_GLOBALES');
        }

        return permisos.includes(viewName);
    }
};
