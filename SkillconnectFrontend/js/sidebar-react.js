
const { useState, useEffect } = React;

/**
 * SidebarReact V9: 100% CSS - Sin Framer Motion
 * Elimina completamente la dependencia de Motion para evitar conflictos de keys
 */

// Helper para traducciones
var t = (key) => {
    if (window.t_real && typeof window.t_real === 'function') return window.t_real(key);
    if (window.t && typeof window.t === 'function' && window.t !== t) return window.t(key);
    return key;
};

const SidebarReact = () => {
    const [conversations, setConversations] = useState([]);
    const [isHovered, setIsHovered] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchGlobal = () => {
            const raw = window.conversacionesDashboard || [];
            
            // Deduplicación por ID
            const seen = new Set();
            const unique = raw.filter(c => {
                const id = c.id_conversacion;
                if (!id || seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            setConversations(prev => {
                const isSame = prev.length === unique.length && JSON.stringify(prev) === JSON.stringify(unique);
                return isSame ? prev : [...unique];
            });

            if (window.conversacionActivaDashboard) {
                setActiveId(window.conversacionActivaDashboard.id_conversacion);
            }
        };

        const timer = setInterval(fetchGlobal, 450);
        fetchGlobal();
        return () => clearInterval(timer);
    }, []);

    // En móvil siempre expandido (width 100%), en desktop usa hover
    const sidebarStyle = isMobile ? { width: '100%' } : {
        width: isHovered ? '280px' : '88px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
    
    // En móvil mostramos los detalles siempre
    const showDetails = isMobile || isHovered;

    return (
        <div
            className={`h-full bg-white border-r border-gray-100 flex flex-col relative z-50 shadow-md overflow-hidden ${isMobile ? 'w-full' : ''}`}
            style={sidebarStyle}
            onMouseEnter={() => !isMobile && setIsHovered(true)}
            onMouseLeave={() => !isMobile && setIsHovered(false)}
        >
            {/* Header */}
            <div className="h-[80px] border-b border-gray-50 flex items-center justify-center shrink-0 px-4">
                <div className={`transition-all duration-300 ${showDetails ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <h2 className="text-lg font-black text-slate-800 whitespace-nowrap">
                        {typeof t === 'function' ? t('messages.title') : 'Mensajes'}
                    </h2>
                </div>
                <div className={`transition-all duration-300 text-indigo-600 ${showDetails ? 'opacity-0 w-0 absolute' : 'opacity-100'}`}>
                    <span className="iconify" data-icon="mdi:chat-processing" data-width="32"></span>
                </div>
            </div>

            {/* Lista de conversaciones */}
            <div 
                className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1"
                style={{
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none' /* IE/Edge */
                }}
            >
                <style>{`
                    .sidebar-scroll::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
                {conversations.length === 0 ? (
                    <div className="p-8 text-center opacity-10">
                         <span className="iconify mx-auto" data-icon="mdi:chat-outline" data-width="32"></span>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <ConversationItem 
                            key={conv.id_conversacion}
                            conv={conv} 
                            isHovered={showDetails} 
                            isActive={activeId === conv.id_conversacion}
                            onClick={() => window.seleccionarConversacionDashboard?.(conv.id_conversacion)}
                        />
                    ))
                )}
            </div>
            
            {/* Footer */}
            <div className="h-[70px] border-t border-gray-50 p-4 flex items-center shrink-0 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">SC</div>
                <div className={`ml-3 truncate transition-all duration-300 ${showDetails ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <p className="text-xs font-bold text-slate-800">SkillConnect App</p>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Premium</p>
                </div>
            </div>
        </div>
    );
};

const ConversationItem = ({ conv, isHovered, isActive, onClick }) => {
    const nombre = conv.nombre_contacto || "Usuario";
    const initials = nombre.charAt(0).toUpperCase();
    const unread = conv.mensajes_no_leidos || 0;

    return (
        <div 
            onClick={onClick}
            className={`mx-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 flex items-center relative group ${isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'hover:bg-slate-100'}`}
        >
            {/* Avatar */}
            <div className="relative shrink-0 w-11 h-11 flex items-center justify-center">
                {conv.imagenUrl_contacto ? (
                    <img src={conv.imagenUrl_contacto} className={`w-full h-full rounded-full object-cover border-2 shadow-sm ${isActive ? 'border-indigo-400' : 'border-white'}`} alt={nombre}/>
                ) : (
                    <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold shadow-sm ${isActive ? 'bg-white/20' : 'bg-indigo-500'}`}>{initials}</div>
                )}
                
                {/* Badge de notificación */}
                {!isHovered && unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-md z-10" />
                )}
            </div>

            {/* Panel de detalles */}
            <div className={`ml-3 flex-1 min-w-0 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                <div className="flex items-center justify-between gap-1">
                    <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{nombre}</p>
                    {unread > 0 && (
                        <span className={`text-[10px] font-black rounded-full px-1.5 py-0.5 min-w-[18px] text-center ${isActive ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>{unread}</span>
                    )}
                </div>
                <p className={`text-[11px] truncate mt-0.5 font-medium ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {conv.ultimo_mensaje || "Empieza a chatear..."}
                </p>
            </div>
            
            {/* Tooltip */}
            {!isHovered && (
                 <div className="absolute left-full ml-4 px-2 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-2xl ring-1 ring-white/10">{nombre}</div>
            )}
        </div>
    );
};

// Renderizado
const rootElement = document.getElementById("sidebar-react-root");
if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<SidebarReact />);
}
