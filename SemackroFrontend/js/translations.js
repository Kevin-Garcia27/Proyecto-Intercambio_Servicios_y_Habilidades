// Diccionario de traducciones
const translations = {
                es: {
                    // Hero section
                    'hero.title': 'Descubre talentos increíbles',
                    'hero.subtitle': 'Conecta con personas que pueden ayudarte a crecer',
                    'search.placeholder': 'Buscar por nombre, habilidad o ubicación...',
                    'search.button': 'Buscar',

                    // Navegación y notificaciones
                    'nav.notifications': 'Solicitudes de intercambio',
                    'nav.noNotifications': 'No tienes solicitudes pendientes',

                    // Categorías de filtros
                    'categories.all': 'Todos',
                    'categories.design': 'Diseño y creatividad',
                    'categories.education': 'Educación y tutorías',
                    'categories.tech': 'Tecnología y desarrollo',
                    'categories.professional': 'Servicios profesionales y asesoría',
                    'categories.home': 'Hogar y reparaciones',
                    'categories.wellness': 'Bienestar y personal',
                    'categories.other': 'Otro',

                    // Sección de usuarios
                    'users.title': 'Usuarios recomendados',
                    'users.sortBy': 'Ordenar por:',
                    'users.sortRecent': 'Más recientes',
                    'users.sortName': 'Nombre (a-z)',
                    'users.sortSkills': 'Más habilidades',
                    'users.sortLocation': 'Ubicación',
                    'users.show': 'Mostrar:',
                    'users.showing': 'Mostrando',
                    'users.of': 'De',
                    'users.users': 'Usuarios',
                    'users.user': 'Usuario',
                    'stats.activeUsers': 'Usuarios activos',
                    'stats.availableCategories': 'Categorías de habilidades disponibles',
                    'stats.successfulExchanges': 'Intercambios exitosos',

                    // Tarjetas de usuario
                    'card.exchanges': 'Intercambios',
                    'card.rating': 'Calificación',
                    'card.location': 'Ubicación',
                    'card.viewProfile': 'Ver perfil',
                    'card.addFavorite': 'Agregar a favoritos',
                    'card.removeFavorite': 'Quitar de favoritos',
                    'card.requestExchange': 'Solicitar intercambio',
                    'card.noLocation': 'Sin ubicación',
                    'card.noRating': 'Sin calificación',

                    // Sidebar
                    'sidebar.title': 'Menú',
                    'sidebar.welcome': 'Bienvenido de nuevo',
                    'sidebar.discover': 'Descubrir',
                    'sidebar.favorites': 'Mis favoritos',
                    'sidebar.messages': 'Solicitudes y mensajes',
                    'sidebar.sentRequests': 'Solicitudes enviadas',
                    'sidebar.history': 'Historial de intercambios',
                    'sidebar.profile': 'Mi perfil',
                    'sidebar.reports': 'Reportes',
                    'sidebar.logout': 'Cerrar sesión',

                    // Sección de favoritos
                    'favorites.title': 'Mis favoritos',
                    'favorites.subtitle': 'Aquí puedes ver los usuarios que has marcado como favoritos',
                    'favorites.empty': 'No tienes favoritos aún',
                    'favorites.emptyDesc': 'Agrega usuarios a favoritos para acceder rápidamente a sus perfiles',

                    // Sección de mensajes/solicitudes
                    'messages.title': 'Mensajes',
                    'messages.selectConversation': 'Selecciona una conversación',
                    'messages.chooseContact': 'Elige un contacto para empezar a chatear',
                    'messages.loadingConversations': 'Cargando conversaciones...',
                    'messages.writeMessage': 'Escribe un mensaje...',
                    'messages.send': 'Enviar',
                    'messages.attachFile': 'Adjuntar archivo',
                    'messages.pending': 'Pendiente',
                    'messages.accepted': 'Aceptada',
                    'messages.rejected': 'Rechazada',
                    'messages.completed': 'Completada',
                    'messages.accept': 'Aceptar',
                    'messages.reject': 'Rechazar',
                    'messages.empty': 'No hay mensajes',
                    'messages.viewProfile': 'Ver perfil',
                    'messages.videoCall': 'Video llamada',
                    'messages.finishExchange': 'Finalizar intercambio',
                    'messages.activeConversation': 'Conversación activa',
                    'messages.back': 'Volver',
                    'messages.finishTitle': '¿Finalizar intercambio?',
                    'messages.finishText': 'Estás a punto de finalizar el intercambio con',
                    'messages.finishWarning': 'La conversación será eliminada permanentemente',
                    'messages.finishConfirm': 'Sí, finalizar',
                    'messages.finishCancel': 'Cancelar',
                    'messages.processing': 'Procesando...',
                    'messages.finishingExchange': 'Finalizando intercambio',
                    'messages.edit': 'Editar',
                    'messages.deleteForAll': 'Eliminar para todos',
                    'messages.deleteForMe': 'Borrar solo para mí',
                    'messages.editingMessage': 'Editando mensaje...',
                    'messages.deleteForAllTitle': 'Borrar para todos',
                    'messages.deleteForMeTitle': 'Borrar solo para mí',
                    'messages.deleteForAllText': '¿Borrar este mensaje para todos? no podrán verlo',
                    'messages.deleteForMeText': '¿Borrar este mensaje solo para ti? el otro usuario seguirá viéndolo',
                    'messages.yesDelete': 'Sí, borrar',
                    'messages.messageDeleted': 'Mensaje eliminado',
                    'messages.deleteExpired': 'Tiempo de eliminación expirado',
                    'messages.deleteExpiredText': 'Solo puedes eliminar mensajes para todos durante 3 minutos después de enviarlos',

                    // Solicitudes enviadas
                    'sentRequests.title': 'Solicitudes enviadas',
                    'sentRequests.subtitle': 'Aquí puedes ver las solicitudes que has enviado y que están pendientes de respuesta',
                    'sentRequests.loading': 'Cargando solicitudes enviadas...',
                    'sentRequests.pending': 'Solicitud pendiente',
                    'sentRequests.waitingResponse': 'Esperando respuesta',
                    'sentRequests.cancel': 'Cancelar',

                    // Historial
                    'history.title': 'Historial de intercambios',
                    'history.subtitle': 'Registro visual de tus intercambios pasados y estado actual.',
                    'history.empty': 'No hay intercambios o calificaciones registradas',
                    'history.loading': 'Cargando historial...',
                    'history.completed': 'Completado',
                    'history.pending': 'Pendiente',
                    'history.serviceOffered': 'Servicio ofrecido',
                    'history.serviceReceived': 'Servicio recibido',
                    'history.exchangeWith': 'Intercambio con',

                    // Modal de solicitud de intercambio
                    'requestModal.title': 'Solicitud de intercambio',
                    'requestModal.sendingTo': 'Enviando solicitud a',
                    'requestModal.skillOffered': 'Habilidad que ofreces',
                    'requestModal.skillInterested': 'Habilidad que te interesa',
                    'requestModal.selectSkill': 'Selecciona una habilidad (opcional)',
                    'requestModal.noSkillsToOffer': 'No tienes habilidades para ofrecer',
                    'requestModal.noSkillsRequested': 'Esta persona no busca habilidades específicas',
                    'requestModal.proposedDate': 'Fecha propuesta',
                    'requestModal.proposedTime': 'Hora propuesta',
                    'requestModal.duration': 'Duración (minutos)',
                    'requestModal.durationPlaceholder': 'Ej: 60',
                    'requestModal.modality': 'Modalidad',
                    'requestModal.selectModality': 'Selecciona (opcional)',
                    'requestModal.virtual': 'Virtual',
                    'requestModal.inPerson': 'Presencial',
                    'requestModal.additionalMessage': 'Mensaje adicional',
                    'requestModal.messagePlaceholder': 'Escribe un mensaje personalizado (opcional)',
                    'requestModal.sendRequest': 'Enviar solicitud',
                    'requestModal.sending': 'Enviando solicitud...',
                    'requestModal.sent': '¡Solicitud enviada!',
                    'requestModal.sentMessage': 'Tu solicitud ha sido enviada a',
                    'requestModal.alreadySent': 'Solicitud ya enviada',
                    'requestModal.alreadySentMessage': 'Ya has enviado una solicitud a',
                    'requestModal.viewPending': 'Puedes ver tus solicitudes pendientes en el menú lateral.',
                    'requestModal.understood': 'Entendido',
                    'requestModal.couldNotSend': 'No se pudo enviar',
                    'requestModal.sendExchangeRequest': 'Enviar solicitud de intercambio',

                    // Notificaciones
                    'notifications.wantsToExchange': 'Quiere intercambiar habilidades contigo',
                    'notifications.offers': 'Ofrece:',
                    'notifications.seeks': 'Busca:',
                    'notifications.date': 'Fecha:',
                    'notifications.time': 'Hora:',
                    'notifications.duration': 'Duración:',
                    'notifications.modality': 'Modalidad:',
                    'notifications.message': 'Mensaje:',
                    'notifications.accept': 'Aceptar',
                    'notifications.reject': 'Rechazar',
                    'notifications.processing': 'Procesando...',
                    'notifications.accepted': '¡Solicitud aceptada!',
                    'notifications.nowCanExchange': 'Ahora puedes intercambiar con',
                    'notifications.rejected': '¡Solicitud rechazada!',
                    'notifications.pending': 'Pendiente',
                    'notifications.pendientes': 'Pendientes',

                    // Modal de cerrar sesión
                    'logout.title': 'Cerrar sesión',
                    'logout.message': '¿Estás seguro de que deseas cerrar sesión? tendrás que iniciar sesión nuevamente para acceder a tu perfil.',
                    'logout.cancel': 'Cancelar',
                    'logout.confirm': 'Cerrar sesión',

                    // Botones y acciones comunes
                    'common.cancel': 'Cancelar',
                    'common.confirm': 'Confirmar',
                    'common.close': 'Cerrar',
                    'common.save': 'Guardar',
                    'common.edit': 'Editar',
                    'common.delete': 'Eliminar',
                    'common.send': 'Enviar',
                    'common.loading': 'Cargando...',
                    'common.error': 'Error',
                    'common.success': 'Éxito',

                    // Sección de Administración / Reportes
                    'reports.title': 'Panel de administración',
                    'reports.subtitle': 'Reportes, métricas y gestión de técnicos en un solo lugar.',
                    'reports.reportedUsers': 'Usuarios reportados',
                    'reports.reportedUsersDesc': 'Usuarios con mayor índice de incidencias.',
                    'reports.globalPerformance': 'Desempeño global',
                    'reports.performanceDesc': 'Promedios generales de satisfacción.',
                    'reports.verificationRequests': 'Solicitudes de verificación',
                    'reports.verificationDesc': 'Cola de validadores para identidad y certificaciones.',
                    'reports.directory': 'Directorio general',
                    'reports.directoryDesc': 'Listado íntegro de profesionales registrados.',
                    'reports.search': 'Buscar...',
                    'reports.specialty': 'Especialidad',
                    'reports.location': 'Ubicación',
                    
                    // Tablas
                    'table.user': 'Usuario',
                    'table.email': 'Email',
                    'table.id': 'Id',
                    'table.reports': 'Reps',
                    'table.action': 'Acción',
                    'table.technician': 'Técnico',
                    'table.status': 'Estado',
                    'table.dateTime': 'Fecha / hora',
                    'table.actions': 'Acciones',
                    'table.photo': 'Foto',
                    'table.fullName': 'Nombre completo',
                    'table.expertise': 'Expertise',
                    'table.availability': 'Disponibilidad',
                    'table.loading': 'Cargando datos...',
                    'table.syncing': 'Sincronizando...',
                    'table.noRecords': 'Sin registros',

                    // Estados
                    'status.available': 'Disponible',
                    'status.atWork': 'En obra',
                    'status.busy': 'Ocupado',
                    'status.approved': 'Aprobada',
                    'status.rejected': 'Rechazada',
                    'status.pending': 'Pendiente',

                    // Métricas
                    'reports.punctuality': 'Puntualidad',
                    'reports.quality': 'Calidad',
                    'reports.cleaning': 'Limpieza',
                    'reports.communication': 'Comunicación',
                    'reports.percentage': 'Porcentaje (%)',

                    // Perfil Nuevo
                    'profile.sendRequest': 'Enviar solicitud',
                    'profile.reporting': 'Reportar',
                    'profile.yearsExperience': 'Años de experiencia',
                    'profile.works': 'Obras',
                    'profile.completed': 'Completadas',
                    'profile.average': 'Promedio',
                    'profile.status': 'Estado',
                    'profile.specialties': 'Especialidades técnicas',
                    'profile.descriptionAvailable': 'Sin descripción disponible.',
                    'profile.profileInfo': 'Información del perfil',
                    'profile.birthDate': 'Fecha de nacimiento',
                    'profile.gender': 'Género',
                    'profile.email': 'Correo electrónico',
                    'profile.phone': 'Teléfono',
                    'profile.professionalInfo': 'Información profesional',
                    'profile.certifications': 'Certificaciones',
                    'profile.noCertifications': 'Sin certificaciones registradas',
                    'profile.portfolio': 'Portafolio',
                    'profile.workDone': 'Trabajo realizado',
                    'profile.reviews': 'Reseñas de clientes',
                    'profile.noReviews': 'Aún no hay reseñas para este usuario.',
                    'profile.verifying': 'Verificando...',
                    'profile.verified': 'Verificado',
                    'profile.pendingVerification': 'Verificación pendiente',
                    'profile.notVerified': 'No verificado',
                    'profile.loadingSession': 'Inicia sesión para enviar solicitudes',
                    'profile.requestAccepted': 'Solicitud aceptada',
                    'profile.requestPending': 'Tu solicitud está pendiente',
                    'profile.requestReceived': 'Este usuario te envió una solicitud',
                    'profile.unspecified': 'No especificado',
                    'profile.years': 'Años',
                    'profile.workHistory': 'Historial de órdenes de trabajo',
                    'status.finished': 'Finalizada',
                    'status.inProgress': 'En progreso',
                    'status.ongoing': 'En curso',
                    'profile.technicalEvaluation': 'Evaluación técnica',
                    'profile.averageRating': 'Calificación promedio',
                    'profile.qualityOfWork': 'Calidad de trabajo',
                    'profile.location': 'Ubicación',
                    'profile.noPerformanceEvaluations': 'Aún no hay evaluaciones de desempeño',
                    'profile.technicianResponse': 'Respuesta del técnico:',
                    'profile.backToDiscover': 'Volver a descubrir',
                    'profile.errorLoading': 'Error al cargar el perfil',
                    'profile.updateError': 'Error de conexión al actualizar el estado',
                    'profile.serverError': 'Error del servidor',
                    'profile.portfolioImage': 'Imagen del portafolio',
                    'profile.enlargedImage': 'Imagen ampliada'
                },
                en: {
                    // Hero section
                    'hero.title': 'Discover incredible talents',
                    'hero.subtitle': 'Connect with people who can help you grow',
                    'search.placeholder': 'Search by name, skill or location...',
                    'search.button': 'Search',

                    // Navigation and notifications
                    'nav.notifications': 'Exchange requests',
                    'nav.noNotifications': 'You have no pending requests',

                    // Filter categories
                    'categories.all': 'All',
                    'categories.design': 'Design & creativity',
                    'categories.education': 'Education & tutoring',
                    'categories.tech': 'Technology & development',
                    'categories.professional': 'Professional services & consulting',
                    'categories.home': 'Home & repairs',
                    'categories.wellness': 'Wellness & personal',
                    'categories.other': 'Other',

                    // Users section
                    'users.title': 'Recommended users',
                    'users.sortBy': 'Sort by:',
                    'users.sortRecent': 'Most recent',
                    'users.sortName': 'Name (a-z)',
                    'users.sortSkills': 'Most skills',
                    'users.sortLocation': 'Location',
                    'users.show': 'Show:',
                    'users.showing': 'Showing',
                    'users.of': 'Of',
                    'users.users': 'Users',
                    'users.user': 'User',
                    'stats.activeUsers': 'Active users',
                    'stats.availableCategories': 'Available skill categories',
                    'stats.successfulExchanges': 'Successful exchanges',

                    // User cards
                    'card.exchanges': 'Exchanges',
                    'card.rating': 'Rating',
                    'card.location': 'Location',
                    'card.viewProfile': 'View profile',
                    'card.addFavorite': 'Add to favorites',
                    'card.removeFavorite': 'Remove from favorites',
                    'card.requestExchange': 'Request exchange',
                    'card.noLocation': 'No location',
                    'card.noRating': 'No rating',

                    // Sidebar
                    'sidebar.title': 'Menu',
                    'sidebar.welcome': 'Welcome back',
                    'sidebar.discover': 'Discover',
                    'sidebar.favorites': 'My favorites',
                    'sidebar.messages': 'Requests & messages',
                    'sidebar.sentRequests': 'Sent requests',
                    'sidebar.history': 'Exchange history',
                    'sidebar.profile': 'My profile',
                    'sidebar.reports': 'Reports',
                    'sidebar.logout': 'Logout',

                    // Favorites section
                    'favorites.title': 'My favorites',
                    'favorites.subtitle': 'Here you can see the users you have marked as favorites',
                    'favorites.empty': 'You have no favorites yet',
                    'favorites.emptyDesc': 'Add users to favorites to quickly access their profiles',

                    // Messages/requests section
                    'messages.title': 'Messages',
                    'messages.selectConversation': 'Select a conversation',
                    'messages.chooseContact': 'Choose a contact to start chatting',
                    'messages.loadingConversations': 'Loading conversations...',
                    'messages.writeMessage': 'Write a message...',
                    'messages.send': 'Send',
                    'messages.attachFile': 'Attach file',
                    'messages.pending': 'Pending',
                    'messages.accepted': 'Accepted',
                    'messages.rejected': 'Rejected',
                    'messages.completed': 'Completed',
                    'messages.accept': 'Accept',
                    'messages.reject': 'Reject',
                    'messages.empty': 'No messages',
                    'messages.viewProfile': 'View profile',
                    'messages.videoCall': 'Video call',
                    'messages.finishExchange': 'Finish exchange',
                    'messages.activeConversation': 'Active conversation',
                    'messages.back': 'Back',
                    'messages.finishTitle': 'Finish exchange?',
                    'messages.finishText': 'You are about to finish the exchange with',
                    'messages.finishWarning': 'The conversation will be permanently deleted',
                    'messages.finishConfirm': 'Yes, finish',
                    'messages.finishCancel': 'Cancel',
                    'messages.processing': 'Processing...',
                    'messages.finishingExchange': 'Finishing exchange',
                    'messages.edit': 'Edit',
                    'messages.deleteForAll': 'Delete for everyone',
                    'messages.deleteForMe': 'Delete only for me',
                    'messages.editingMessage': 'Editing message...',
                    'messages.deleteForAllTitle': 'Delete for everyone',
                    'messages.deleteForMeTitle': 'Delete only for me',
                    'messages.deleteForAllText': 'Delete this message for everyone? they won\'t be able to see it',
                    'messages.deleteForMeText': 'Delete this message only for you? the other user will still see it',
                    'messages.yesDelete': 'Yes, delete',
                    'messages.messageDeleted': 'Message deleted',
                    'messages.deleteExpired': 'Deletion time expired',
                    'messages.deleteExpiredText': 'You can only delete messages for everyone within 3 minutes of sending them',

                    // Sent requests
                    'sentRequests.title': 'Sent requests',
                    'sentRequests.subtitle': 'Here you can see the requests you have sent that are pending response',
                    'sentRequests.loading': 'Loading sent requests...',
                    'sentRequests.pending': 'Pending request',
                    'sentRequests.waitingResponse': 'Waiting for response',
                    'sentRequests.cancel': 'Cancel',

                    // History
                    'history.title': 'Exchange history',
                    'history.subtitle': 'Visual record of your past exchanges and current status.',
                    'history.empty': 'No exchanges or ratings recorded',
                    'history.loading': 'Loading history...',
                    'history.completed': 'Completed',
                    'history.pending': 'Pending',
                    'history.serviceOffered': 'Service offered',
                    'history.serviceReceived': 'Service received',
                    'history.exchangeWith': 'Exchange with',

                    // Exchange request modal
                    'requestModal.title': 'Exchange request',
                    'requestModal.sendingTo': 'Sending request to',
                    'requestModal.skillOffered': 'Skill you offer',
                    'requestModal.skillInterested': 'Skill you are interested in',
                    'requestModal.selectSkill': 'Select a skill (optional)',
                    'requestModal.noSkillsToOffer': 'You have no skills to offer',
                    'requestModal.noSkillsRequested': 'This person is not looking for specific skills',
                    'requestModal.proposedDate': 'Proposed date',
                    'requestModal.proposedTime': 'Proposed time',
                    'requestModal.duration': 'Duration (minutes)',
                    'requestModal.durationPlaceholder': 'E.g.: 60',
                    'requestModal.modality': 'Modality',
                    'requestModal.selectModality': 'Select (optional)',
                    'requestModal.virtual': 'Virtual',
                    'requestModal.inPerson': 'In person',
                    'requestModal.additionalMessage': 'Additional message',
                    'requestModal.messagePlaceholder': 'Write a personalized message (optional)',
                    'requestModal.sendRequest': 'Send request',
                    'requestModal.sending': 'Sending request...',
                    'requestModal.sent': 'Request sent!',
                    'requestModal.sentMessage': 'Your request has been sent to',
                    'requestModal.alreadySent': 'Request already sent',
                    'requestModal.alreadySentMessage': 'You have already sent a request to',
                    'requestModal.viewPending': 'You can view your pending requests in the side menu.',
                    'requestModal.understood': 'Understood',
                    'requestModal.couldNotSend': 'Could not send',
                    'requestModal.sendExchangeRequest': 'Send exchange request',

                    // Notifications
                    'notifications.wantsToExchange': 'Wants to exchange skills with you',
                    'notifications.offers': 'Offers:',
                    'notifications.seeks': 'Seeks:',
                    'notifications.date': 'Date:',
                    'notifications.time': 'Time:',
                    'notifications.duration': 'Duration:',
                    'notifications.modality': 'Modality:',
                    'notifications.message': 'Message:',
                    'notifications.accept': 'Accept',
                    'notifications.reject': 'Reject',
                    'notifications.processing': 'Processing...',
                    'notifications.accepted': 'Request accepted!',
                    'notifications.nowCanExchange': 'Now you can exchange with',
                    'notifications.rejected': 'Request rejected!',
                    'notifications.pending': 'Pending',
                    'notifications.pendientes': 'Pending',

                    // Logout modal
                    'logout.title': 'Logout',
                    'logout.message': 'Are you sure you want to logout? you will need to login again to access your profile.',
                    'logout.cancel': 'Cancel',
                    'logout.confirm': 'Logout',

                    // Common buttons and actions
                    'common.cancel': 'Cancel',
                    'common.confirm': 'Confirm',
                    'common.close': 'Close',
                    'common.save': 'Save',
                    'common.edit': 'Edit',
                    'common.delete': 'Delete',
                    'common.send': 'Send',
                    'common.loading': 'Loading...',
                    'common.error': 'Error',
                    'common.success': 'Success',

                    // Administration / Reports Section
                    'reports.title': 'Administration panel',
                    'reports.subtitle': 'Reports, metrics, and technician management in one place.',
                    'reports.reportedUsers': 'Reported users',
                    'reports.reportedUsersDesc': 'Users with core high incident rates.',
                    'reports.globalPerformance': 'Global performance',
                    'reports.performanceDesc': 'Overall satisfaction averages.',
                    'reports.verificationRequests': 'Verification requests',
                    'reports.verificationDesc': 'Validator queue for identity and certifications.',
                    'reports.directory': 'General directory',
                    'reports.directoryDesc': 'Complete list of registered professionals.',
                    'reports.search': 'Search...',
                    'reports.specialty': 'Specialty',
                    'reports.location': 'Location',
                    
                    // Tables
                    'table.user': 'User',
                    'table.email': 'Email',
                    'table.id': 'Id',
                    'table.reports': 'Reps',
                    'table.action': 'Action',
                    'table.technician': 'Technician',
                    'table.status': 'Status',
                    'table.dateTime': 'Date / time',
                    'table.actions': 'Actions',
                    'table.photo': 'Photo',
                    'table.fullName': 'Full name',
                    'table.expertise': 'Expertise',
                    'table.availability': 'Availability',
                    'table.loading': 'Loading data...',
                    'table.syncing': 'Syncing...',
                    'table.noRecords': 'No records',

                    // States
                    'status.available': 'Available',
                    'status.atWork': 'At work',
                    'status.busy': 'Busy',
                    'status.approved': 'Approved',
                    'status.rejected': 'Rejected',
                    'status.pending': 'Pending',

                    // Metrics
                    'reports.punctuality': 'Punctuality',
                    'reports.quality': 'Quality',
                    'reports.cleaning': 'Cleaning',
                    'reports.communication': 'Communication',
                    'reports.percentage': 'Percentage (%)',

                    // New Profile
                    'profile.sendRequest': 'Send request',
                    'profile.reporting': 'Report',
                    'profile.yearsExperience': 'Years of experience',
                    'profile.works': 'Works',
                    'profile.completed': 'Completed',
                    'profile.average': 'Average',
                    'profile.status': 'Status',
                    'profile.specialties': 'Technical specialties',
                    'profile.descriptionAvailable': 'No description available.',
                    'profile.profileInfo': 'Profile information',
                    'profile.birthDate': 'Birth date',
                    'profile.gender': 'Gender',
                    'profile.email': 'Email',
                    'profile.phone': 'Phone',
                    'profile.professionalInfo': 'Professional information',
                    'profile.certifications': 'Certifications',
                    'profile.noCertifications': 'No certifications registered',
                    'profile.portfolio': 'Portfolio',
                    'profile.workDone': 'Work done',
                    'profile.reviews': 'Client reviews',
                    'profile.noReviews': 'No reviews for this user yet.',
                    'profile.verifying': 'Verifying...',
                    'profile.verified': 'Verified',
                    'profile.pendingVerification': 'Pending verification',
                    'profile.notVerified': 'Not verified',
                    'profile.loadingSession': 'Log in to send requests',
                    'profile.requestAccepted': 'Request accepted',
                    'profile.requestPending': 'Your request is pending',
                    'profile.requestReceived': 'This user sent you a request',
                    'profile.unspecified': 'Unspecified',
                    'profile.years': 'Years',
                    'profile.workHistory': 'Work history',
                    'status.finished': 'Finished',
                    'status.inProgress': 'In progress',
                    'status.ongoing': 'Ongoing',
                    'profile.technicalEvaluation': 'Technical evaluation',
                    'profile.averageRating': 'Average rating',
                    'profile.qualityOfWork': 'Quality of work',
                    'profile.location': 'Location',
                    'profile.noPerformanceEvaluations': 'No performance evaluations yet',
                    'profile.technicianResponse': 'Technician response:',
                    'profile.backToDiscover': 'Back to discover',
                    'profile.errorLoading': 'Error loading profile',
                    'profile.updateError': 'Connection error while updating status',
                    'profile.serverError': 'Server error',
                    'profile.portfolioImage': 'Portfolio image',
                    'profile.enlargedImage': 'Enlarged image'
                }
            };

            // Idioma actual (por defecto español)
            let currentLanguage = localStorage.getItem('preferred_language') || 'es';

// Función para cambiar idioma
function changeLanguage(lang) {
    currentLanguage = lang;
    window.currentLanguage = lang;
                localStorage.setItem('preferred_language', lang);
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

                // Actualizar texto del idioma en el botón
                const langSpan = document.getElementById('currentLang');
                if (langSpan) {
                    langSpan.textContent = lang === 'es' ? 'ES' : 'EN';
                }

                // Cerrar dropdown
                const dropdown = document.getElementById('languageDropdown');
                if (dropdown) {
                    dropdown.classList.add('hidden');
                }

                // Aplicar traducciones y re-renderizar contenido dinámico
                retranslateCurrentView();

                // Notificar al iframe del perfil si está cargado
                const profileIframe = document.getElementById('perfilIframe');
                if (profileIframe && profileIframe.contentWindow) {
                    profileIframe.contentWindow.postMessage({
                        type: 'languageChange',
                        language: lang
                    }, window.location.origin);
                }

                // Notificar al iframe de reportes si está cargado
                const reportesIframe = document.getElementById('reportesIframe');
                if (reportesIframe && reportesIframe.contentWindow) {
                    reportesIframe.contentWindow.postMessage({
                        type: 'languageChange',
                        language: lang
                    }, window.location.origin);
                }
            }

// Función para aplicar traducciones
function applyTranslations() {
    const trans = translations[currentLanguage];

                // Traducir elementos con data-i18n
                document.querySelectorAll('[data-i18n]').forEach(element => {
                    const key = element.getAttribute('data-i18n');
                    if (trans[key]) {
                        // Para opciones de select, necesitamos un manejo especial
                        if (element.tagName === 'OPTION') {
                            // Extraer número si existe (ej: "6 usuarios" -> "6")
                            const match = element.textContent.match(/^\d+/);
                            const number = match ? match[0] : '';

                            // Aplicar traducción
                            if (number) {
                                element.textContent = number + ' ' + trans[key];
                            } else {
                                element.textContent = trans[key];
                            }
                        } else {
                            element.textContent = trans[key];
                        }
                    }
                });

                // Traducir placeholders
                document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                    const key = element.getAttribute('data-i18n-placeholder');
                    if (trans[key]) {
                        element.placeholder = trans[key];
                    }
                });

                // Traducir títulos (title attribute)
                document.querySelectorAll('[data-i18n-title]').forEach(element => {
                    const key = element.getAttribute('data-i18n-title');
                    if (trans[key]) {
                        element.title = trans[key];
                    }
                });
            }

// Función auxiliar para obtener traducción (útil para JavaScript dinámico)
function t(key) {
    const lang = (currentLanguage || 'es').toLowerCase();
    const trans = translations[lang] || translations['es'] || {};
    return trans[key] || key;
}
t._isReal = true;
window.t = t;
window.t_real = t;
window.changeLanguage = changeLanguage;
window.applyTranslations = applyTranslations;
window.retranslateCurrentView = retranslateCurrentView;

// Función para re-traducir elementos dinámicos después de cambiar idioma
function retranslateCurrentView() {
    applyTranslations();

                // Re-renderizar elementos dinámicos si existen
                if (typeof updateResultsCount === 'function') updateResultsCount();
                if (typeof renderUserCardsReal === 'function') renderUserCardsReal();
                if (typeof mostrarFavoritos === 'function' && currentView === 'favoritos') mostrarFavoritos();

                // Re-renderizar notificaciones si existen
                if (typeof currentNotifications !== 'undefined' && currentNotifications.length > 0) {
                    mostrarSolicitudesEnDropdown(currentNotifications);
                }

                // Re-actualizar badge de notificaciones
                if (typeof currentNotifications !== 'undefined') {
                    actualizarBadgeNotificaciones(currentNotifications.length);
                }

                // Re-renderizar solicitudes enviadas si hay datos
                if (typeof currentSentRequests !== 'undefined' && currentSentRequests.length > 0) {
                    mostrarSolicitudesEnviadas(currentSentRequests);
                }

                // Re-renderizar historial si existe la función
                if (typeof cargarHistorial === 'function' && currentView === 'historial') {
                    cargarHistorial();
                }

                // Re-renderizar perfil si está abierto
                if (typeof currentProfileId !== 'undefined' && currentProfileId !== null && currentView === 'perfil') {
                    viewProfile(currentProfileId);
                }

                // Re-renderizar header del chat si hay conversación activa
                if (typeof conversacionActivaDashboard !== 'undefined' && conversacionActivaDashboard && conversacionActivaDashboard.id_conversacion) {
                    actualizarHeaderChatDashboard(conversacionActivaDashboard);
                }

                // Actualizar título del modal de video si está visible
                const videoModalTitle = document.getElementById('videoModalTitle');
                if (videoModalTitle) {
                    videoModalTitle.textContent = t('messages.videoCall');
                }
            }

// Toggle dropdown de idiomas
document.addEventListener('DOMContentLoaded', function () {
    const languageBtn = document.getElementById('languageBtn');
                const languageDropdown = document.getElementById('languageDropdown');

                if (languageBtn && languageDropdown) {
                    languageBtn.addEventListener('click', function (e) {
                        e.stopPropagation();
                        languageDropdown.classList.toggle('hidden');
                    });

                    // Cerrar al hacer clic fuera
                    document.addEventListener('click', function (e) {
                        if (!languageDropdown.contains(e.target) && !languageBtn.contains(e.target)) {
                            languageDropdown.classList.add('hidden');
                        }
                    });
                }

                // Actualizar texto del idioma según idioma guardado
                const langSpan = document.getElementById('currentLang');
                if (langSpan) {
                    langSpan.textContent = currentLanguage === 'en' ? 'EN' : 'Es';
    }
});
