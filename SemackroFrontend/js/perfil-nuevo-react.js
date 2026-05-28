/**
 * ========================================
 * NUEVO PERFIL DE USUARIO - COMPONENTES REACT
 * Usando React CDN + Material UI Icons via Iconify
 * ========================================
 */

// Destructuring de React
const { useState, useEffect, useCallback, useMemo } = React;

// Helper para traducciones
var t = (key) => {
    if (window.t_real && typeof window.t_real === 'function') return window.t_real(key);
    if (window.t && window.t !== t) return window.t(key);
    return key;
};

// ========================================
// ICONOS SVG (para no depender de librerías externas)
// ========================================
const Icons = {
    MapPin: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    ),
    CheckCircle: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    ),
    Send: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    ),
    Flag: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="15"></line>
        </svg>
    ),
    Wrench: ({ size = 32 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
    ),
    ClipboardList: ({ size = 32 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <path d="M12 11h4"></path>
            <path d="M12 16h4"></path>
            <path d="M8 11h.01"></path>
            <path d="M8 16h.01"></path>
        </svg>
    ),
    Star: ({ filled = false, half = false, size = 32, color = "#2563eb" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
        </svg>
    ),
    StarYellow: ({ filled = true, size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#facc15" : "none"} stroke={filled ? "#facc15" : "#d1d5db"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
    ),
    Clock: ({ size = 32, disponible = false }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={disponible ? "#22c55e" : "#2563eb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    ),
    Award: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
    ),
    Briefcase: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
    ),
    FileText: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    ),
    Images: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
    ),
    ClipboardCheck: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <path d="M9 14l2 2 4-4"></path>
        </svg>
    ),
    ArrowLeft: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
    ),
    X: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    ),
    User: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
    Calendar: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
    ),
    Mail: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
    ),
    Phone: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
    ),
    // Iconos de verificación
    ShieldCheck: ({ color = "#22c55e" }) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M9 12l2 2 4-4"></path>
        </svg>
    ),
    ShieldAlert: ({ color = "#eab308" }) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
        </svg>
    ),
    ShieldOff: ({ color = "#ef4444" }) => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"></path>
            <path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
    ),
    // Iconos para métricas de desempeño
    ClockCheck: ({ size = 16, color = "#10b981" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
            <path d="M16 16l2 2 4-4" stroke={color} strokeWidth="2"></path>
        </svg>
    ),
    StarCheck: ({ size = 16, color = "#f59e0b" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={color}></polygon>
        </svg>
    ),
    Sparkles: ({ size = 16, color = "#06b6d4" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"></path>
            <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z"></path>
            <path d="M19 12l1 2 1-2 2-1-2-1-1-2-1 2-2 1 2 1z"></path>
        </svg>
    ),
    MessageCircle: ({ size = 16, color = "#8b5cf6" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
    )
};

// ========================================
// COMPONENTE: ProfileHeader
// ========================================
function ProfileHeader({ persona, ubicacion, onSolicitar, onReportar, perfilId, onToggleStatus }) {
    const [estadoSolicitud, setEstadoSolicitud] = useState(null); // null, 'loading', 'pendiente', 'aceptada', 'enviada_por_otro', 'none'
    const [mensajeSolicitud, setMensajeSolicitud] = useState('');
    const [estadoVerificacion, setEstadoVerificacion] = useState('loading'); // 'loading', 'aprobada', 'pendiente', 'no_verificado'
    
    // Identificar si es el propio perfil del usuario
    const [esMiPerfil, setEsMiPerfil] = useState(false);

    const nombreCompleto = `${persona.nombre_Persona || ''} ${persona.apellido_Persona || ''}`.trim();
    const iniciales = `${(persona.nombre_Persona || 'U')[0]}${(persona.apellido_Persona || '')[0] || ''}`.toUpperCase();
    
    // Verificar si es mi propio perfil
    useEffect(() => {
        async function checkMyProfile() {
            let miPerfilId = window.miPerfilIdGlobal;
            if (!miPerfilId && window.obtenerPersonaIdActual) {
                miPerfilId = await window.obtenerPersonaIdActual();
            }
            if (miPerfilId && perfilId && parseInt(miPerfilId) === parseInt(perfilId)) {
                setEsMiPerfil(true);
            }
        }
        checkMyProfile();
    }, [perfilId]);

    // Verificar estado de verificación del usuario
    useEffect(() => {
        async function verificarEstadoVerificacion() {
            if (!perfilId) return;
            
            try {
                const res = await fetch(`${window.API_BASE}/verificacion-usuarios/perfil/${perfilId}`);
                const data = await res.json();
                
                console.log('Estado verificación API:', data);
                
                if (res.ok && data && data.estado_verificacion) {
                    setEstadoVerificacion(data.estado_verificacion);
                } else {
                    setEstadoVerificacion('no_verificado');
                }
            } catch (e) {
                console.error('Error al verificar estado de verificación:', e);
                setEstadoVerificacion('no_verificado');
            }
        }
        
        verificarEstadoVerificacion();
    }, [perfilId]);
    
    // Verificar estado de solicitud al montar
    useEffect(() => {
        async function verificarSolicitud() {
            if (!perfilId) return;
            
            setEstadoSolicitud('loading');
            
            try {
                // Obtener mi perfil ID
                let miPerfilId = window.miPerfilIdGlobal;
                if (!miPerfilId && window.obtenerPersonaIdActual) {
                    miPerfilId = await window.obtenerPersonaIdActual();
                }
                
                if (!miPerfilId) {
                    setEstadoSolicitud('no-session');
                    return;
                }
                
                // Verificar si existe solicitud
                const res = await fetch(`${window.API_BASE}/solicitudes-intercambio/verificar/${miPerfilId}/${perfilId}`);
                const data = await res.json();
                
                if (res.ok && data.success) {
                    if (data.existeSolicitud) {
                        const solicitud = data.solicitud;
                        setMensajeSolicitud(solicitud.mensaje);
                        
                        if (solicitud.estado === 'Aceptada') {
                            setEstadoSolicitud('aceptada');
                        } else if (solicitud.esMiSolicitud) {
                            setEstadoSolicitud('pendiente');
                        } else {
                            setEstadoSolicitud('enviada_por_otro');
                        }
                    } else {
                        setEstadoSolicitud('none');
                    }
                } else {
                    setEstadoSolicitud('none');
                }
            } catch (e) {
                console.error('Error verificando solicitud:', e);
                setEstadoSolicitud('none');
            }
        }
        
        verificarSolicitud();
    }, [perfilId]);
    
    // Handler para enviar solicitud
    const handleEnviarSolicitud = () => {
        if (window.sendRequest) {
            window.sendRequest(perfilId, nombreCompleto);
        } else if (onSolicitar) {
            onSolicitar();
        }
    };
    
    // Renderizar botón o mensaje según estado
    const renderBotonSolicitud = () => {
        switch (estadoSolicitud) {
            case 'loading':
                return (
                    <div className="perfil-solicitud-loading">
                        <div className="perfil-spinner"></div>
                    </div>
                );
            case 'no-session':
                return (
                    <div className="perfil-solicitud-mensaje warning">
                        <Icons.User size={18} />
                        <span>{t('profile.loadingSession')}</span>
                    </div>
                );
            case 'aceptada':
                return (
                    <div className="perfil-solicitud-mensaje success">
                        <Icons.CheckCircle size={18} />
                        <span>{mensajeSolicitud || t('profile.requestAccepted')}</span>
                    </div>
                );
            case 'pendiente':
                return (
                    <div className="perfil-solicitud-mensaje info">
                        <Icons.Clock size={18} />
                        <span>{mensajeSolicitud || t('profile.requestPending')}</span>
                    </div>
                );
            case 'enviada_por_otro':
                return (
                    <div className="perfil-solicitud-mensaje purple">
                        <Icons.Send size={18} />
                        <span>{mensajeSolicitud || t('profile.requestReceived')}</span>
                    </div>
                );
            case 'none':
            default:
                return (
                    <button 
                        className="perfil-btn perfil-btn-primary"
                        onClick={handleEnviarSolicitud}
                    >
                        <Icons.Send />
                        {t('profile.sendRequest')}
                    </button>
                );
        }
    };
    
    // Estado de disponibilidad - usar el valor de la BD
    const disponibilidadRaw = persona.disponibilidad;
    console.log('ProfileHeader - disponibilidad de la BD:', disponibilidadRaw);
    
    // Normalizar el valor para comparación
    const disponibilidadNormalizada = (disponibilidadRaw || '').toString().trim().toLowerCase();
    
    // Check robusto incluyendo 1/true/'1' como disponible
    const esDisponible = (
        disponibilidadNormalizada === 'disponible' || 
        disponibilidadNormalizada === 'available' ||
        persona.disponibilidad === 1 || 
        persona.disponibilidad === true || 
        persona.disponibilidad === '1'
    );
    
    const statusConfig = {
        disponible: { className: 'perfil-chip-available', text: t('status.available') },
        noDisponible: { className: 'perfil-chip-unavailable', text: t('status.atWork') }
    };
    const status = esDisponible ? statusConfig.disponible : statusConfig.noDisponible;

    return (
        <div className="perfil-paper">
            <div className="perfil-header-banner"></div>
            <div className="perfil-header-content">
                <div className="perfil-header-flex">
                    <div className="perfil-avatar">
                        {persona.imagenUrl_Persona ? (
                            <img 
                                src={persona.imagenUrl_Persona} 
                                alt={nombreCompleto}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = iniciales;
                                }}
                            />
                        ) : (
                            <span>{iniciales}</span>
                        )}
                    </div>
                    
                    <div className="perfil-header-info">
                        <h1 className="perfil-header-nombre">{nombreCompleto}</h1>
                        
                        {/* Solo mostrar profesión si existe */}
                        {persona.profesion && (
                            <p className="perfil-header-profesion">
                                {persona.profesion}
                            </p>
                        )}
                        
                        {/* Descripción completa debajo del nombre */}
                        {persona.descripcionPerfil_Persona && (
                            <p className="perfil-header-descripcion">
                                {persona.descripcionPerfil_Persona}
                            </p>
                        )}
                        
                        <div className="perfil-header-ubicacion">
                            <Icons.MapPin />
                            <span>{ubicacion || t('card.noLocation')}</span>
                        </div>

                        <div className="perfil-header-badges">
                            {/* Chip de verificación dinámico */}
                             {estadoVerificacion === 'loading' ? (
                                <span className="perfil-chip perfil-chip-pending">
                                    <Icons.ShieldAlert color="#6b7280" />
                                    {t('profile.verifying')}
                                </span>
                            ) : estadoVerificacion === 'aprobada' ? (
                                <span className="perfil-chip perfil-chip-verified">
                                    <Icons.ShieldCheck color="#22c55e" />
                                    {t('profile.verified')}
                                </span>
                            ) : estadoVerificacion === 'pendiente' ? (
                                <span className="perfil-chip perfil-chip-pending">
                                    <Icons.ShieldAlert color="#eab308" />
                                    {t('profile.pendingVerification')}
                                </span>
                            ) : (
                                <span className="perfil-chip perfil-chip-not-verified">
                                    <Icons.ShieldOff color="#ef4444" />
                                    {t('profile.notVerified')}
                                </span>
                            )}
                            
                            <span 
                                className={`perfil-chip perfil-chip-status ${status.className} ${esMiPerfil ? 'cursor-pointer' : ''}`}
                                onClick={esMiPerfil ? onToggleStatus : undefined}
                                title={esMiPerfil ? 'Haz clic para cambiar tu estado' : undefined}
                                style={esMiPerfil ? { cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' } : { display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                {status.text}
                            </span>

                            {/* Botón de solicitud dinámico */}
                            {renderBotonSolicitud()}

                            <button 
                                className="perfil-btn perfil-btn-outline"
                                onClick={onReportar}
                            >
                                <Icons.Flag />
                                {t('profile.reporting')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ========================================
// COMPONENTE: QuickStats
// ========================================
function QuickStats({ aniosExperiencia, intercambiosCount, promedioCalificacion, disponibilidad, onToggleStatus, perfilId }) {
    // Identificar si es el propio perfil del usuario
    const [esMiPerfil, setEsMiPerfil] = useState(false);
    
    // Verificar si es mi propio perfil
    useEffect(() => {
        async function checkMyProfile() {
            let miPerfilId = window.miPerfilIdGlobal;
            if (!miPerfilId && window.obtenerPersonaIdActual) {
                miPerfilId = await window.obtenerPersonaIdActual();
            }
            if (miPerfilId && perfilId && parseInt(miPerfilId) === parseInt(perfilId)) {
                setEsMiPerfil(true);
            }
        }
        checkMyProfile();
    }, [perfilId]);

    // Debug: ver qué valor llega
    console.log('QuickStats - disponibilidad recibida:', disponibilidad, '| tipo:', typeof disponibilidad);
    
    // Normalizar: quitar espacios y comparar
    // Normalizar: quitar espacios y comparar
    const disponibilidadNormalizada = (disponibilidad || '').toString().trim().toLowerCase();
    
    const esDisponible = (
        disponibilidadNormalizada === 'available' || 
        disponibilidadNormalizada === 'disponible' || 
        disponibilidad === 1 ||
        disponibilidad === '1' ||
        disponibilidad === true
    );
    
    console.log('QuickStats - esDisponible:', esDisponible);
    
    const stats = [
        { 
            icon: <Icons.Wrench size={32} />, 
            label: t('profile.yearsExperience'), 
            value: aniosExperiencia || 0, 
            color: 'primary' 
        },
        { 
            icon: <Icons.ClipboardList size={32} />, 
            label: t('profile.works'), 
            value: intercambiosCount || 0, 
            sublabel: t('profile.completed'), 
            color: 'primary' 
        },
        { 
            icon: <Icons.Star size={32} color="#2563eb" />, 
            label: t('profile.average'), 
            value: promedioCalificacion ? promedioCalificacion.toFixed(1) : '0.0', 
            sublabel: '/ 5', 
            color: 'primary' 
        },
        { 
            icon: <Icons.Clock size={32} disponible={esDisponible} />, 
            label: t('profile.status'), 
            value: esDisponible ? t('status.available') : t('status.atWork'), 
            color: esDisponible ? 'success' : 'Primary' 
        }
    ];

    return (
        <div className="perfil-stats-grid">
            {stats.map((stat, index) => {
                const isStatusCard = stat.label === 'Estado';
                const canToggle = isStatusCard && esMiPerfil;
                
                return (
                    <div 
                        key={index} 
                        className={`perfil-stat-card ${canToggle ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={canToggle ? onToggleStatus : undefined}
                        title={canToggle ? 'Haz clic para cambiar tu estado' : undefined}
                        style={canToggle ? { cursor: 'pointer' } : {}}
                    >
                        <div className={`perfil-stat-icon ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div className="perfil-stat-value">
                            {stat.value}
                            {stat.sublabel && (
                                <span className="perfil-stat-sublabel">{stat.sublabel}</span>
                            )}
                        </div>
                        <div className="perfil-stat-label">{stat.label}</div>
                    </div>
                );
            })}
        </div>
    );
}

// ========================================
// COMPONENTE: Specialties (Especialidades Técnicas)
// ========================================
function Specialties({ habilidades, tipo = 'Ofrece' }) {
    const [selectedIndex, setSelectedIndex] = useState(null);

    const handleClick = (index) => {
        setSelectedIndex(selectedIndex === index ? null : index);
    };

    // Solo mostrar Especialidades Técnicas (antes "Habilidades que Ofrece")
    const titulo = t('profile.specialties');
    const iconColor = '#2563eb';

    if (!habilidades || habilidades.length === 0) {
        return null;
    }

    return (
        <div className="perfil-section">
            <div className="perfil-section-title">
                <Icons.Wrench />
                <h3>{titulo}</h3>
            </div>
            
            <div className="perfil-chips-container">
                {habilidades.map((skill, index) => (
                    <button
                        key={index}
                        className={`perfil-specialty-chip ${selectedIndex === index ? 'active' : ''}`}
                        onClick={() => handleClick(index)}
                        style={{
                            backgroundColor: selectedIndex === index 
                                ? '#2563eb'
                                : '#eff6ff',
                            color: selectedIndex === index 
                                ? 'white' 
                                : '#2563Eb'
                        }}
                    >
                        {skill.nombre_Habilidad}
                    </button>
                ))}
            </div>

            {selectedIndex !== null && habilidades[selectedIndex] && (
                <div className="perfil-specialty-detail" style={{ borderColor: iconColor }}>
                    <h4 style={{ color: iconColor }}>{habilidades[selectedIndex].nombre_Habilidad}</h4>
                    <p>{habilidades[selectedIndex].descripcion_Habilidad || t('profile.descriptionAvailable')}</p>
                </div>
            )}
        </div>
    );
}

// ========================================
// COMPONENTE: ProfessionalInfo - Información del Perfil completa
// ========================================
function ProfessionalInfo({ persona, certificaciones }) {
    return (
        <>
            {/* Sección de Información del Perfil */}
            <div className="perfil-section">
                <div className="perfil-section-title">
                    <Icons.User />
                    <h3>{t('profile.profileInfo')}</h3>
                </div>
                
                {/* Fecha de nacimiento */}
                {persona.fechaNac_Persona && (
                    <div className="perfil-info-item">
                        <div className="perfil-info-icon">
                            <Icons.Calendar />
                        </div>
                        <div>
                            <div className="perfil-info-label">{t('profile.birthDate')}</div>
                            <div className="perfil-info-value">
                                {new Date(persona.fechaNac_Persona).toLocaleDateString(window.currentLanguage === 'en' ? 'en-US' : 'es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Género */}
                {persona.genero_Persona && (
                    <div className="perfil-info-item">
                        <div className="perfil-info-icon">
                            <Icons.User />
                        </div>
                        <div>
                            <div className="perfil-info-label">{t('profile.gender')}</div>
                            <div className="perfil-info-value">{persona.genero_Persona}</div>
                        </div>
                    </div>
                )}

                {/* Email */}
                {persona.email_Persona && (
                    <div className="perfil-info-item">
                        <div className="perfil-info-icon">
                            <Icons.Mail />
                        </div>
                        <div>
                            <div className="perfil-info-label">{t('profile.email')}</div>
                            <div className="perfil-info-value">{persona.email_Persona}</div>
                        </div>
                    </div>
                )}

                {/* Teléfono */}
                {persona.telefono_Persona && (
                    <div className="perfil-info-item">
                        <div className="perfil-info-icon">
                            <Icons.Phone />
                        </div>
                        <div>
                            <div className="perfil-info-label">{t('profile.phone')}</div>
                            <div className="perfil-info-value">{persona.telefono_Persona}</div>
                        </div>
                    </div>
                )}

                <div className="perfil-divider"></div>

                {/* Descripción del perfil */}
                {persona.descripcionPerfil_Persona && (
                    <p className="perfil-description">
                        {persona.descripcionPerfil_Persona}
                    </p>
                )}
            </div>

            {/* Sección de Información Profesional */}
            <div className="perfil-section">
                <div className="perfil-section-title">
                    <Icons.Briefcase />
                    <h3>{t('profile.professionalInfo')}</h3>
                </div>
                
                {/* Años de experiencia */}
                <div className="perfil-info-item">
                    <div className="perfil-info-icon">
                        <Icons.Briefcase />
                    </div>
                    <div>
                        <div className="perfil-info-label">{t('profile.yearsExperience')}</div>
                        <div className="perfil-info-value">
                            {persona.anios_experiencia 
                                ? `${persona.anios_experiencia} ${t('profile.years')}` 
                                : t('profile.unspecified')}
                        </div>
                    </div>
                </div>

                {/* Certificaciones - ahora dinámico desde la API */}
                <div className="perfil-info-item">
                    <div className="perfil-info-icon">
                        <Icons.Award />
                    </div>
                    <div className="perfil-certifications-container">
                        <div className="perfil-info-label">{t('profile.certifications')}</div>
                        {certificaciones && certificaciones.length > 0 ? (
                            <div className="perfil-certifications-list">
                                {certificaciones.map((cert, index) => (
                                    <a 
                                        key={index}
                                        href={cert.url_certificado || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="perfil-certification-btn"
                                        style={{ 
                                            pointerEvents: cert.url_certificado ? 'auto' : 'None',
                                            opacity: cert.url_certificado ? 1 : 0.7
                                        }}
                                    >
                                        <Icons.FileText />
                                        <span>{cert.titulo_certificacion}</span>
                                        {cert.institucion && (
                                            <span style={{ fontSize: '10px', color: '#6b7280', marginLeft: '4px' }}>
                                                ({cert.institucion})
                                            </span>
                                        )}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="perfil-info-value perfil-info-muted">
                                {t('profile.noCertifications')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ========================================
// COMPONENTE: Portfolio (Galería) - Basado en NuevosArchivos/Portfolio.tsx
// ========================================
function Portfolio({ imagenes, onImageClick }) {
    if (!imagenes || imagenes.length === 0) {
        return null;
    }

    const portfolioItems = imagenes.map((url, index) => ({
        url,
        description: `${t('profile.workDone')} #${index + 1}`
    }));

    return (
        <div className="perfil-portfolio-sticky">
            <div className="perfil-section-title" style={{ marginBottom: '16px' }}>
                <Icons.Images />
                <h3>{t('profile.portfolio')}</h3>
            </div>
            
            <div className="perfil-portfolio-grid">
                {portfolioItems.map((item, index) => (
                    <div
                        key={index}
                        className="perfil-portfolio-item"
                        onClick={() => onImageClick && onImageClick(item)}
                    >
                        <img
                            src={item.url}
                            alt={item.description}
                            onError={(e) => e.target.parentElement.style.display = 'none'}
                        />
                        <div className="perfil-portfolio-overlay">
                            <span>{item.description}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ========================================
// ========================================
// COMPONENTE: PostulacionesHistory (SCRUM-26) — Historial de postulaciones del usuario
// ========================================
function PostulacionesHistory({ postulaciones }) {
    if (!postulaciones || postulaciones.length === 0) return null;

    const estadoCfg = {
        pendiente: { cls: 'bg-yellow-50 text-yellow-700',  icon: 'mdi:clock-outline',        label: 'Pendiente'  },
        aceptada:  { cls: 'bg-green-50  text-green-700',   icon: 'mdi:check-circle-outline',  label: 'Aceptada ✓' },
        rechazada: { cls: 'bg-red-50    text-red-600',     icon: 'mdi:close-circle-outline',  label: 'No seleccionado' },
    };

    const necesitaScroll = postulaciones.length > 5;

    return (
        <div className="perfil-section">
            <div className="perfil-section-title">
                <Icons.ClipboardCheck />
                <h3>Mis postulaciones a órdenes de trabajo</h3>
                {postulaciones.length > 5 && (
                    <span className="perfil-section-count">({postulaciones.length} total)</span>
                )}
            </div>

            <div className={`perfil-work-list ${necesitaScroll ? 'perfil-work-list-scroll' : ''}`}>
                {postulaciones.map((item, index) => {
                    const cfg = estadoCfg[item.estado_postulacion] || estadoCfg['pendiente'];
                    const fechaPost = item.fecha_postulacion
                        ? new Date(item.fecha_postulacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Sin fecha';
                    const presupuesto = item.presupuesto_estimado
                        ? `L ${Number(item.presupuesto_estimado).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
                        : null;

                    return (
                        <div key={index} className="perfil-work-item" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                <div className="perfil-work-info" style={{ flex: 1 }}>
                                    <h4 className="perfil-work-project">{item.titulo || `Orden #${item.id_orden}`}</h4>
                                    <div className="perfil-work-meta">
                                        {item.especialidad && <span>{item.especialidad}</span>}
                                        {item.especialidad && <span>•</span>}
                                        <span>Postulado: {fechaPost}</span>
                                        {presupuesto && <><span>•</span><span>{presupuesto}</span></>}
                                    </div>
                                </div>
                                <span className={`perfil-work-chip ${cfg.cls}`} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {cfg.label}
                                </span>
                            </div>
                            {item.portafolio_url && (
                                <a href={item.portafolio_url} target="_blank" rel="noopener noreferrer"
                                    style={{ fontSize: '12px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef2f2', padding: '3px 8px', borderRadius: '6px', textDecoration: 'none', fontWeight: 500 }}>
                                    📄 Ver portafolio pdf
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// COMPONENTE: WorkHistory (Historial de Órdenes de Trabajo) - Basado en NuevosArchivos/WorkHistory.tsx
// ========================================
function WorkHistory({ intercambios }) {
    // Configuración de estados como en el diseño original
    const statusConfig = {
        'Completado': { icon: Icons.CheckCircle, text: t('status.finished'), color: '#22c55e', bgcolor: '#f0fdf4' },
        'Finalizado': { icon: Icons.CheckCircle, text: t('status.finished'), color: '#22c55e', bgcolor: '#f0fdf4' },
        'En progreso': { icon: Icons.Clock, text: t('status.inProgress'), color: '#2563eb', bgcolor: '#eff6ff' },
        'Pendiente': { icon: Icons.Clock, text: t('status.pending'), color: '#2563eb', bgcolor: '#eff6ff' },
        'default': { icon: Icons.Clock, text: t('status.ongoing'), color: '#2563eb', bgcolor: '#eff6ff' }
    };

    const getStatusConfig = (estado) => {
        return statusConfig[estado] || statusConfig['default'];
    };

    if (!intercambios || intercambios.length === 0) {
        return null;
    }

    // Determinar si necesitamos scroll (más de 5 items)
    const necesitaScroll = intercambios.length > 5;
    
    return (
        <div className="perfil-section">
            <div className="perfil-section-title">
                <Icons.ClipboardCheck />
                <h3>{t('profile.workHistory')}</h3>
                {intercambios.length > 5 && (
                    <span className="perfil-section-count">({intercambios.length} total)</span>
                )}
            </div>
            
            <div className={`perfil-work-list ${necesitaScroll ? 'perfil-work-list-scroll' : ''}`}>
                {intercambios.map((item, index) => {
                    const config = getStatusConfig(item.estado);
                    const StatusIcon = config.icon;
                    
                    return (
                        <div key={index} className="perfil-work-item">
                            <div className="perfil-work-info">
                                <h4 className="perfil-work-project">
                                    {item.nombre_habilidad || item.titulo || `Orden de trabajo #${item.id_intercambio || index + 1}`}
                                </h4>
                                <div className="perfil-work-meta">
                                    <span>
                                        {item.fecha_finalizacion 
                                            ? new Date(item.fecha_finalizacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : item.fecha_creacion 
                                                ? new Date(item.fecha_creacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'Sin fecha'}
                                    </span>
                                    <span>•</span>
                                    <span>{item.modalidad || item.categoria || 'Servicio'}</span>
                                </div>
                            </div>
                            
                            {/* Chip con icono y estilo como en el diseño original */}
                            <span 
                                className="perfil-work-chip"
                                style={{ 
                                    backgroundColor: config.bgcolor, 
                                    color: config.color 
                                }}
                            >
                                <StatusIcon size={14} />
                                <span>{config.text}</span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ========================================
// COMPONENTE: LocationMap - Mapa de ubicación con Leaflet
// ========================================
function LocationMap({ coordenadas, ubicacion }) {
    const mapRef = React.useRef(null);
    const mapInstanceRef = React.useRef(null);

    useEffect(() => {
        // Esperar a que Leaflet esté disponible
        if (!window.L || !mapRef.current || !coordenadas) return;

        // Si ya hay un mapa, destruirlo
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        try {
            const map = window.L.map(mapRef.current, {
                center: [coordenadas.latitud, coordenadas.longitud],
                zoom: 15,
                scrollWheelZoom: true,
                dragging: true,
                zoomControl: true
            });

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                minZoom: 2
            }).addTo(map);

            window.L.marker([coordenadas.latitud, coordenadas.longitud])
                .addTo(map)
                .bindPopup(ubicacion || 'Ubicación del usuario')
                .openPopup();

            mapInstanceRef.current = map;

            // Forzar resize después de que el contenedor sea visible
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 250);
        } catch (error) {
            console.error('Error al inicializar mapa:', error);
        }

        // Cleanup
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [coordenadas, ubicacion]);

    if (!coordenadas || !coordenadas.latitud || !coordenadas.longitud) {
        return null;
    }

    return (
        <div className="perfil-location-map-container">
            <div className="perfil-location-map-header">
                <Icons.MapPin />
                <span>{t('profile.location')}</span>
            </div>
            <div 
                ref={mapRef} 
                className="perfil-location-map"
            ></div>
        </div>
    );
}

// ========================================
// COMPONENTE: TechnicalEvaluation (Calificaciones) - Basado en NuevosArchivos/TechnicalEvaluation.tsx
// ========================================
function TechnicalEvaluation({ estadisticas, calificaciones, coordenadas, ubicacion, metricas }) {
    // Calcular promedio desde calificaciones si no hay estadísticas
    let overallRating = estadisticas?.promedio_calificacion || 0;
    const totalCalificaciones = estadisticas?.total_calificaciones || calificaciones?.length || 0;
    
    // Si no hay promedio pero hay calificaciones, calcularlo
    if (overallRating === 0 && calificaciones && calificaciones.length > 0) {
        const suma = calificaciones.reduce((acc, c) => acc + (c.puntuacion || c.estrellas || 0), 0);
        overallRating = suma / calificaciones.length;
    }

    // Criterios de evaluación usando métricas de desempeño (0-100%) de la tabla Metricas_Desempeno
    // Si no hay métricas, usar valores por defecto basados en la calificación promedio
    const criteria = [
        { 
            name: t('reports.punctuality'), 
            percentage: metricas?.puntualidad ?? 0,
            IconComponent: Icons.ClockCheck,
            color: '#10b981'
        },
        { 
            name: t('profile.qualityOfWork'), 
            percentage: metricas?.calidad_trabajo ?? 0,
            IconComponent: Icons.StarCheck,
            color: '#f59e0b'
        },
        { 
            name: t('reports.cleaning'), 
            percentage: metricas?.limpieza ?? 0,
            IconComponent: Icons.Sparkles,
            color: '#06b6d4'
        },
        { 
            name: t('reports.communication'), 
            percentage: metricas?.comunicacion ?? 0,
            IconComponent: Icons.MessageCircle,
            color: '#8b5cf6'
        }
    ];

    // Verificar si hay métricas para mostrar
    const tieneMetricas = metricas && (metricas.puntualidad > 0 || metricas.calidad_trabajo > 0 || 
                                       metricas.limpieza > 0 || metricas.comunicacion > 0);

    // Distribución de estrellas
    const distribucion = [
        { stars: 5, count: estadisticas?.distribucion_estrellas_5 || 0 },
        { stars: 4, count: estadisticas?.distribucion_estrellas_4 || 0 },
        { stars: 3, count: estadisticas?.distribucion_estrellas_3 || 0 },
        { stars: 2, count: estadisticas?.distribucion_estrellas_2 || 0 },
        { stars: 1, count: estadisticas?.distribucion_estrellas_1 || 0 }
    ];

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Icons.StarYellow key={`full-${i}`} filled={true} size={14} />);
        }
        
        if (hasHalfStar) {
            stars.push(<Icons.StarYellow key="half" filled={true} size={14} />);
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<Icons.StarYellow key={`empty-${i}`} filled={false} size={14} />);
        }
        
        return stars;
    };

    // Mostrar si hay calificaciones en el array O si hay estadísticas con total > 0
    const tieneCalificaciones = (calificaciones && calificaciones.length > 0) || totalCalificaciones > 0;
    
    if (!tieneCalificaciones) {
        return null;
    }

    return (
        <div className="perfil-section">
            <div className="perfil-section-title">
                <Icons.StarYellow filled={true} size={20} />
                <h3>{t('profile.technicalEvaluation')}</h3>
            </div>
            
            <div className="perfil-eval-grid">
                {/* Calificación promedio - Estilo degradado amarillo como en el diseño */}
                <div className="perfil-eval-rating">
                    <div className="perfil-eval-rating-value">{overallRating.toFixed(1)}</div>
                    <div className="perfil-eval-stars">
                        {renderStars(overallRating)}
                    </div>
                    <div className="perfil-eval-label">
                        {t('profile.averageRating')}
                    </div>
                </div>

                {/* Criterios con barras de progreso - Métricas de Desempeño */}
                <div className="perfil-criteria-list">
                    {tieneMetricas ? (
                        criteria.map((criterion, index) => (
                            <div key={index} className="perfil-criteria-item">
                                <div className="perfil-criteria-header">
                                    <span className="perfil-criteria-name">
                                        <span style={{ marginRight: '6px', display: 'inline-flex', verticalAlign: 'middle' }}>
                                            <criterion.IconComponent size={16} color={criterion.color} />
                                        </span>
                                        {criterion.name}
                                    </span>
                                    <span style={{ 
                                        fontSize: '13px', 
                                        fontWeight: '600', 
                                        color: criterion.color 
                                    }}>
                                        {criterion.percentage}%
                                    </span>
                                </div>
                                <div className="perfil-progress-bar" style={{ 
                                    background: '#e2e8f0',
                                    borderRadius: '4px',
                                    height: '8px',
                                    overflow: 'hidden'
                                }}>
                                    <div 
                                        className="perfil-progress-fill" 
                                        style={{ 
                                            width: `${criterion.percentage}%`,
                                            background: criterion.color,
                                            height: '100%',
                                            borderRadius: '4px',
                                            transition: 'width 0.5s ease-out'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '16px', 
                            color: '#94a3b8',
                            fontSize: '13px'
                        }}>
                            {t('profile.noPerformanceEvaluations')}
                        </div>
                    )}
                </div>

                {/* Mapa de ubicación - Tercera columna */}
                {coordenadas && coordenadas.latitud && coordenadas.longitud && (
                    <LocationMap coordenadas={coordenadas} ubicacion={ubicacion} />
                )}
            </div>

            {/* Comentarios de Clientes - Grid de 2 columnas como en el diseño */}
            {calificaciones && calificaciones.length > 0 && (
                <>
                    <h4 className="perfil-reviews-title">{t('profile.reviews')}</h4>
                    <div className="perfil-reviews-grid">
                        {calificaciones.map((review, index) => (
                            <div key={index} className="perfil-review-item">
                                <div className="perfil-review-header">
                                    <div>
                                        <div className="perfil-review-author">
                                            {review.nombre_calificador || t('table.user')} {review.apellido_calificador || ''}
                                        </div>
                                        <div className="perfil-review-date">
                                            {(review.fecha_calificacion || review.fecha_creacion)
                                                ? new Date(review.fecha_calificacion || review.fecha_creacion).toLocaleDateString(window.currentLanguage === 'en' ? 'en-US' : 'es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : ''}
                                        </div>
                                    </div>
                                    <div className="perfil-criteria-stars">
                                        {renderStars(review.puntuacion || review.estrellas || 0)}
                                    </div>
                                </div>
                                
                                {review.comentario && (
                                    <p className="perfil-review-comment">{review.comentario}</p>
                                )}

                                {/* Respuesta del técnico/usuario - Como en TechnicalEvaluation.tsx */}
                                {review.respuesta_del_dueno && (
                                    <div className="perfil-review-response">
                                        <div className="perfil-review-response-label">
                                            {t('profile.technicianResponse')}
                                        </div>
                                        <p className="perfil-review-response-text">{review.respuesta_del_dueno}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ========================================
// COMPONENTE: ImageModal - Basado en Portfolio.tsx Dialog
// ========================================
function ImageModal({ imageData, onClose }) {
    if (!imageData) return null;

    // Si es string, convertir a objeto
    const image = typeof imageData === 'string' 
        ? { url: imageData, description: t('profile.portfolioImage') }
        : imageData;

    return (
        <div className="perfil-image-modal" onClick={onClose}>
            <button className="perfil-image-modal-close" onClick={onClose}>
                <Icons.X />
            </button>
            <div className="perfil-image-modal-content" onClick={(e) => e.stopPropagation()}>
                <img src={image.url} alt={image.description || t('profile.enlargedImage')} />
                {image.description && (
                    <div className="perfil-image-modal-caption">
                        {image.description}
                    </div>
                )}
            </div>
        </div>
    );
}

// ========================================
// COMPONENTE PRINCIPAL: NuevoPerfilUsuario
// ========================================
function NuevoPerfilUsuario({ perfilId, onVolver, onSolicitar, onReportar }) {
    const [loading, setLoading] = useState(true);
    const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
    const [persona, setPersona] = useState(null);
    const [habilidadesOfrece, setHabilidadesOfrece] = useState([]);
    const [habilidadesNecesita, setHabilidadesNecesita] = useState([]);
    const [ubicacion, setUbicacion] = useState('');
    const [coordenadas, setCoordenadas] = useState(null); // { latitud, longitud }
    const [estadisticas, setEstadisticas] = useState(null);
    const [calificaciones, setCalificaciones] = useState([]);
    const [intercambios, setIntercambios] = useState([]);
    const [galeriaImagenes, setGaleriaImagenes] = useState([]);
    const [certificaciones, setCertificaciones] = useState([]); // Nuevo estado para certificaciones
    const [metricas, setMetricas] = useState(null); // Estado para métricas de desempeño (progress bars)
    const [misPostulaciones, setMisPostulaciones] = useState([]); // SCRUM-26: historial de postulaciones
    const [selectedImage, setSelectedImage] = useState(null);
    const [error, setError] = useState(null);
    const [, setTick] = useState(0); // Para forzar re-render al cambiar idioma

    // Escuchar cambios de idioma
    useEffect(() => {
        const handleLangChange = () => setTick(t => t + 1);
        window.addEventListener('languageChanged', handleLangChange);
        return () => window.removeEventListener('languageChanged', handleLangChange);
    }, []);

    // Cargar datos del perfil
    useEffect(() => {
        let isMounted = true;
        let loadingTimerId = null;

        async function cargarDatos() {
            setLoading(true);
            setShowLoadingIndicator(false);
            setError(null);

            // Mostrar loader solo si la red tarda demasiado
            loadingTimerId = setTimeout(() => {
                if (isMounted) setShowLoadingIndicator(true);
            }, 2000);

            try {
                // 1. Obtener datos de la persona
                const resPersonas = await fetch(`${window.API_BASE}/personas`);
                const dataPersonas = await resPersonas.json();

                if (!resPersonas.ok || !dataPersonas.success) {
                    throw new Error('No se pudo obtener los datos del usuario');
                }

                const personaData = dataPersonas.data.find(p => p.id_Perfil_Persona === perfilId);
                if (!personaData) {
                    throw new Error('Usuario no encontrado');
                }
                // DEBUG: Ver qué campos vienen de la API
                console.log('=== DEBUG: Datos de persona cargados ===');
                console.log('persona.disponibilidad:', personaData.disponibilidad);
                console.log('Todos los campos:', Object.keys(personaData));
                setPersona(personaData);

                // Preparar galería
                const imagenes = [];
                if (personaData.imagen1Url_Persona) imagenes.push(personaData.imagen1Url_Persona);
                if (personaData.imagen2Url_Persona) imagenes.push(personaData.imagen2Url_Persona);
                if (personaData.imagen3Url_Persona) imagenes.push(personaData.imagen3Url_Persona);
                setGaleriaImagenes(imagenes);

                // Abrir el perfil en cuanto tengamos datos base.
                // El resto de secciones se completan en segundo plano.
                if (isMounted) {
                    setLoading(false);
                    setShowLoadingIndicator(false);
                }
                if (loadingTimerId) {
                    clearTimeout(loadingTimerId);
                    loadingTimerId = null;
                }

                // 2. Obtener habilidades
                try {
                    const resHabilidades = await fetch(`${window.API_BASE}/habilidades/persona/${perfilId}`);
                    const dataHabilidades = await resHabilidades.json();
                    if (resHabilidades.ok && dataHabilidades.success && dataHabilidades.data) {
                        setHabilidadesOfrece(dataHabilidades.data.filter(h => h.tipoEstado_Habilidad === 'Ofrece'));
                        setHabilidadesNecesita(dataHabilidades.data.filter(h => h.tipoEstado_Habilidad === 'Necesita'));
                    }
                } catch (e) {
                    console.error('Error al cargar habilidades:', e);
                }

                // 3. Obtener dirección
                let direccionId = null;
                try {
                    const resDireccion = await fetch(`${window.API_BASE}/direcciones/persona/${perfilId}`);
                    if (resDireccion.ok) {
                        const dataDireccion = await resDireccion.json();
                        if (dataDireccion.success && dataDireccion.data) {
                            const dir = Array.isArray(dataDireccion.data) ? dataDireccion.data[0] : dataDireccion.data;
                            const ciudad = dir.ciudad_Direccion || dir.ciudad || '';
                            const departamento = dir.departamento_Direccion || dir.departamento || '';
                            const pais = dir.pais_Direccion || dir.pais || '';
                            setUbicacion([ciudad, departamento, pais].filter(Boolean).join(', '));
                            direccionId = dir.id_Direccion;
                        }
                    }
                } catch (e) {
                    console.error('Error al cargar dirección:', e);
                }

                // 3.5. Obtener coordenadas de geolocalización
                if (direccionId) {
                    try {
                        const resGeo = await fetch(`${window.API_BASE}/geolocalizacion/direccion/${direccionId}`);
                        if (resGeo.ok) {
                            const dataGeo = await resGeo.json();
                            if (dataGeo.success && dataGeo.data) {
                                const geo = dataGeo.data;
                                if (geo.latitud_Geolocalizacion && geo.Longitud_Geolocalizacion) {
                                    setCoordenadas({
                                        latitud: geo.latitud_Geolocalizacion,
                                        longitud: geo.Longitud_Geolocalizacion
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.debug('No se encontraron coordenadas de geolocalización');
                    }
                }

                // 4. Obtener estadísticas
                try {
                    const resEstadisticas = await fetch(`${window.API_BASE}/intercambios/estadisticas/${perfilId}`);
                    const dataEstadisticas = await resEstadisticas.json();
                    if (resEstadisticas.ok && dataEstadisticas.success && dataEstadisticas.data) {
                        setEstadisticas(dataEstadisticas.data);
                    }
                } catch (e) {
                    console.error('Error al cargar estadísticas:', e);
                }

                // 5. Obtener calificaciones con sus respuestas
                try {
                    const resCalificaciones = await fetch(`${window.API_BASE}/intercambios/calificaciones/${perfilId}`);
                    const dataCalificaciones = await resCalificaciones.json();
                    if (resCalificaciones.ok && dataCalificaciones.success && dataCalificaciones.data) {
                        const calificacionesFiltradas = dataCalificaciones.data.filter(c => c.visible !== false);
                        
                        // Cargar respuestas para cada calificación
                        const calificacionesConRespuestas = await Promise.all(
                            calificacionesFiltradas.map(async (calificacion) => {
                                try {
                                    const resRespuestas = await fetch(`${window.API_BASE}/respuestas-resenia/por-resena/${calificacion.id_calificacion}`);
                                    const dataRespuestas = await resRespuestas.json();
                                    if (resRespuestas.ok && dataRespuestas.success && dataRespuestas.data && dataRespuestas.data.length > 0) {
                                        // Tomar la primera respuesta (o la más reciente)
                                        return {
                                            ...calificacion,
                                            respuesta_del_dueno: dataRespuestas.data[0].respuesta
                                        };
                                    }
                                } catch (e) {
                                    console.debug('No se encontraron respuestas para calificación:', calificacion.id_calificacion);
                                }
                                return calificacion;
                            })
                        );
                        
                        setCalificaciones(calificacionesConRespuestas);
                    }
                } catch (e) {
                    console.error('Error al cargar calificaciones:', e);
                }

                // 6. Obtener historial de intercambios
                try {
                    const resHistorial = await fetch(`${window.API_BASE}/intercambios/historial/${perfilId}`);
                    const dataHistorial = await resHistorial.json();
                    if (resHistorial.ok && dataHistorial.success && dataHistorial.data) {
                        setIntercambios(dataHistorial.data);
                    }
                } catch (e) {
                    console.error('Error al cargar historial:', e);
                }

                // 7. Obtener certificaciones del usuario
                try {
                    const resCertificaciones = await fetch(`${window.API_BASE}/certificaciones/persona/${perfilId}`);
                    const dataCertificaciones = await resCertificaciones.json();
                    if (resCertificaciones.ok && dataCertificaciones.success && dataCertificaciones.data) {
                        setCertificaciones(dataCertificaciones.data);
                        console.log('=== DEBUG: Certificaciones cargadas ===', dataCertificaciones.data);
                    }
                } catch (e) {
                    console.debug('No se encontraron certificaciones para el usuario');
                }

                // 8. Obtener métricas de desempeño (progress bars)
                try {
                    const resMetricas = await fetch(`${window.API_BASE}/metricas/persona/${perfilId}`);
                    const dataMetricas = await resMetricas.json();
                    if (resMetricas.ok && dataMetricas.success && dataMetricas.data) {
                        setMetricas(dataMetricas.data);
                        console.log('=== DEBUG: Métricas de desempeño cargadas ===', dataMetricas.data);
                    }
                } catch (e) {
                    console.debug('No se encontraron métricas de desempeño para el usuario');
                }

                // 9. Historial de postulaciones (SCRUM-26) — solo cuando es el perfil del usuario logueado
                try {
                    const usuarioLogueadoId = Number(localStorage.getItem('usuarioId'));
                    if (personaData.id_Usuario && personaData.id_Usuario === usuarioLogueadoId) {
                        const resPostulaciones = await fetch(
                            `${window.API_BASE}/ordenes-trabajo/mis-postulaciones?usuario_id=${usuarioLogueadoId}`
                        );
                        const dataPostulaciones = await resPostulaciones.json();
                        if (resPostulaciones.ok && dataPostulaciones.success && dataPostulaciones.data) {
                            setMisPostulaciones(dataPostulaciones.data);
                        }
                    }
                } catch (e) {
                    console.debug('No se pudieron cargar las postulaciones del usuario', e);
                }

            } catch (err) {
                console.error('Error cargando perfil:', err);
                setError(err.message);
            } finally {
                if (loadingTimerId) {
                    clearTimeout(loadingTimerId);
                    loadingTimerId = null;
                }
                if (isMounted) {
                    setLoading(false);
                    setShowLoadingIndicator(false);
                }
            }
        }

        if (perfilId) {
            cargarDatos();
        }

        return () => {
            isMounted = false;
            if (loadingTimerId) clearTimeout(loadingTimerId);
        };
    }, [perfilId]);

    // Handlers
    const handleSolicitar = () => {
        if (onSolicitar) {
            onSolicitar(perfilId, persona);
        }
    };

    const handleReportar = () => {
        if (onReportar) {
            const nombreCompleto = persona ? `${persona.nombre_Persona || ''} ${persona.apellido_Persona || ''}`.trim() : '';
            onReportar(perfilId, nombreCompleto);
        }
    };

    const handleToggleStatus = async () => {
        if (!persona) return;
        
        // 1. Determinar estado actual y nuevo
        const currentRaw = persona.disponibilidad;
        const currentStr = (currentRaw || '').toString().trim().toLowerCase();
        
        // Check robusto de "Disponible"
        const isCurrentlyAvailable = (
            currentRaw === 1 || 
            currentRaw === true || 
            currentRaw === '1' || 
            currentStr === 'disponible' || 
            currentStr === 'available'
        );
        
        // Toggle entre "Disponible" y "No disponible" (Backend espera No disponible)
        const nuevoEstado = isCurrentlyAvailable ? 'No disponible' : 'Disponible';
        
        console.log(`[Toggle] Cambiando estado de "${currentRaw}" a "${nuevoEstado}"`);
        
        // 2. Optimistic Update (Actualizar UI inmediatamente)
        const previousPersona = { ...persona };
        setPersona(prev => ({
            ...prev,
            disponibilidad: nuevoEstado
        }));
        
        try {
            // 3. Actualizar en el backend
            const res = await fetch(`${window.API_BASE}/personas/${persona.id_Usuario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disponibilidad: nuevoEstado })
            });
            
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || t('profile.serverError'));
            }
            console.log('Estado actualizado exitosamente en backend');
        } catch (e) {
            console.error('Error de red al actualizar estado:', e);
            // 4. Revertir cambios en caso de error
            setPersona(previousPersona);
            alert(t('profile.updateError'));
        }
    };

    // Loading state
    if (loading) {
        if (!showLoadingIndicator) {
            return (
                <div className="nuevo-perfil-container">
                    <div className="nuevo-perfil-wrapper" style={{ minHeight: '320px' }}></div>
                </div>
            );
        }

        return (
            <div className="nuevo-perfil-container">
                <div className="nuevo-perfil-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="nuevo-perfil-container">
                <div className="nuevo-perfil-wrapper">
                    <button className="perfil-back-btn" onClick={onVolver}>
                        <Icons.ArrowLeft />
                        {t('messages.back')}
                    </button>
                    <div className="perfil-section" style={{ textAlign: 'center', padding: '48px' }}>
                        <div style={{ color: '#ef4444', marginBottom: '16px' }}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ margin: '0 auto' }}>
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>{t('profile.errorLoading')}</h3>
                        <p style={{ color: '#6b7280' }}>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="nuevo-perfil-container">
            <div className="nuevo-perfil-wrapper">
                {/* Botón volver */}
                <button className="perfil-back-btn" onClick={onVolver}>
                    <Icons.ArrowLeft />
                    {t('profile.backToDiscover')}
                </button>

                {/* Header del perfil */}
                <ProfileHeader 
                    persona={persona}
                    ubicacion={ubicacion}
                    perfilId={perfilId}
                    onSolicitar={handleSolicitar}
                    onReportar={handleReportar}
                    onToggleStatus={handleToggleStatus}
                />

                {/* Estadísticas rápidas */}
                <QuickStats 
                    aniosExperiencia={persona?.anios_experiencia || 0}
                    intercambiosCount={estadisticas?.total_intercambios_completados || 0}
                    promedioCalificacion={estadisticas?.promedio_calificacion || 0}
                    disponibilidad={persona?.disponibilidad}
                    onToggleStatus={handleToggleStatus}
                    perfilId={perfilId}
                />

                {/* Layout de 2 columnas */}
                <div className="perfil-layout-grid">
                    <div className="perfil-main-column">
                        {/* Especialidades Técnicas (antes Habilidades que ofrece) */}
                        <Specialties habilidades={habilidadesOfrece} tipo="Ofrece" />
                        
                        {/* Habilidades que necesita - COMENTADO: ya no se muestra en frontend
                        <Specialties habilidades={habilidadesNecesita} tipo="Necesita" />
                        */}
                        
                        {/* Información profesional */}
                        <ProfessionalInfo persona={persona} certificaciones={certificaciones} />
                        
                        {/* Historial de intercambios */}
                        <WorkHistory intercambios={intercambios} />

                        {/* Historial de postulaciones a órdenes (SCRUM-26) */}
                        <PostulacionesHistory postulaciones={misPostulaciones} />
                    </div>
                    
                    {/* Galería lateral (desktop) */}
                    <div className="perfil-side-column">
                        <Portfolio 
                            imagenes={galeriaImagenes} 
                            onImageClick={(url) => setSelectedImage(url)}
                        />
                    </div>
                </div>

                {/* Galería móvil */}
                <div className="perfil-mobile-portfolio">
                    <Portfolio 
                        imagenes={galeriaImagenes} 
                        onImageClick={(url) => setSelectedImage(url)}
                    />
                </div>

                {/* Evaluación técnica */}
                <TechnicalEvaluation 
                    estadisticas={estadisticas}
                    calificaciones={calificaciones}
                    coordenadas={coordenadas}
                    ubicacion={ubicacion}
                    metricas={metricas}
                />

                {/* Modal de imagen */}
                <ImageModal 
                    imageData={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            </div>
        </div>
    );
}

// ========================================
// FUNCIÓN PARA RENDERIZAR EL PERFIL
// ========================================
// Almacenar referencias a los roots para evitar crear múltiples
const reactRoots = new Map();

window.renderNuevoPerfilUsuario = function(containerId, perfilId, callbacks = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Contenedor no encontrado:', containerId);
        return;
    }

    // Reutilizar el root existente o crear uno nuevo
    let root;
    if (reactRoots.has(containerId)) {
        root = reactRoots.get(containerId);
    } else {
        root = ReactDOM.createRoot(container);
        reactRoots.set(containerId, root);
    }
    
    root.render(
        <NuevoPerfilUsuario 
            perfilId={perfilId}
            onVolver={callbacks.onVolver || (() => window.volverAlGrid && window.volverAlGrid())}
            onSolicitar={callbacks.onSolicitar || ((id, persona) => {
                // Usar la función existente de solicitud
                if (window.abrirModalSolicitud) {
                    window.abrirModalSolicitud(id, persona);
                } else if (window.verificarYMostrarBotonSolicitud) {
                    window.verificarYMostrarBotonSolicitud(id, `${persona?.nombre_Persona || ''} ${persona?.apellido_Persona || ''}`.trim());
                }
            })}
            onReportar={callbacks.onReportar || ((id, nombre) => {
                if (window.reportUser) {
                    window.reportUser(id, nombre);
                }
            })}
        />
    );

    return root;
};

// Exportar componentes para uso externo
window.NuevoPerfilComponents = {
    NuevoPerfilUsuario,
    ProfileHeader,
    QuickStats,
    Specialties,
    ProfessionalInfo,
    Portfolio,
    WorkHistory,
    LocationMap,
    TechnicalEvaluation,
    ImageModal
};
