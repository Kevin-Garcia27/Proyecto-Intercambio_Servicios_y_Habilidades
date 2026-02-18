// Helper para traducciones
var t = (key) => {
  if (window.t_real && typeof window.t_real === 'function') return window.t_real(key);
  if (window.t && typeof window.t === 'function' && window.t !== t) return window.t(key);
  const fallbacks = {
    'users.showing': 'Mostrando',
    'users.of': 'de',
    'users.user': 'usuario',
    'users.users': 'usuarios'
  };
  return fallbacks[key] || key;
};

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const closeSidebar = document.getElementById("closeSidebar");
const usersGrid = document.getElementById("usersGrid");
const mainContent = document.getElementById("mainContent");

// Comprobación de sesión: si no hay usuario o token en localStorage, redirigir al login
try {
  const hasUser = localStorage.getItem("usuarioId");
  const hasToken =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  if (!hasUser || !hasToken) {
    // Si no hay sesión activa, llevar al login
    window.location.href = "login.html";
  }
} catch (e) {
  console.warn("No se pudo verificar la sesión en localStorage:", e);
  // En caso de error en localStorage, redirigir al login por seguridad
  window.location.href = "login.html";
}

// Sistema de navegación SPA (Single Page Application)
let currentView = "descubrir";

async function navigateTo(viewName) {
  // Actualizar el estado activo del sidebar inmediatamente
  try {
    document.querySelectorAll(".sidebar-item").forEach((item) => {
      item.classList.remove("active");
    });
    const earlyActive = document.querySelector(`[data-view="${viewName}"]`);
    if (earlyActive) earlyActive.classList.add("active");
  } catch (e) {
    // no hacer nada si falla (compatibilidad)
  }

  document.querySelectorAll(".view-section").forEach((view) => {
    view.classList.remove("active");
  });

  // 🛑 2. AÑADIR: OCULTAR LA VISTA DE PERFIL FORZOSAMENTE (si fue activada con style.display)
  const perfSectionView = document.getElementById("perfilSeccionView");
  const descubrirView = document.getElementById("descubrirView");

  // Si la vista de perfil existe y fue activada con style.display, la ocultamos
  if (perfSectionView) {
    perfSectionView.style.display = "none";
    perfSectionView.classList.remove("animate-slideIn"); // Elimina la clase de animación si aplica
  }

  // Asegurarse de que la vista descubrir se muestre si volvemos a 'descubrir', o se oculte si cambiamos a otra cosa
  if (viewName !== "descubrir" && descubrirView) {
    descubrirView.style.display = "none";
  } else if (descubrirView) {
    descubrirView.style.display = ""; // O block, dependiendo de tu CSS base
  }

  // 3. Mostrar la vista seleccionada (resto del código sin cambios)

  // Ocultar todas las vistas
  document.querySelectorAll(".view-section").forEach((view) => {
    view.classList.remove("active");
  });

  // Mostrar la vista seleccionada
  const targetView = document.getElementById(viewName + "View");
  if (targetView) {
    // Ocultar todas las vistas
    document.querySelectorAll(".view-section").forEach((view) => {
      view.style.display = "none";
      view.classList.remove("active");
    });
    // Mostrar la vista seleccionada
    targetView.style.display = "";
    targetView.classList.add("active");
    currentView = viewName;
    // Actualizar la URL para SPA
    window.history.pushState({}, "", "/" + viewName);
  }

  // Actualizar estado activo en el sidebar
  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.classList.remove("active");
  });

  const activeItem = document.querySelector(`[data-view="${viewName}"]`);
  if (activeItem) {
    activeItem.classList.add("active");
  }

  // Cargar contenido específico según la vista
  if (viewName === "favoritos") {
    console.log(' navigateTo("favoritos") - Llamando a cargarFavoritos()');
    cargarFavoritos();
  }
  if (viewName === "historial") {
    console.log(' navigateTo("historial") - Llamando a cargarHistorial()');
    try {
      await cargarHistorial();
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  }
  if (viewName === "solicitudesEnviadas") {
    console.log(
      ' navigateTo("solicitudesEnviadas") - Llamando a cargarSolicitudesEnviadas()',
    );
    cargarSolicitudesEnviadas();
  }
  if (viewName === "mensajes") {
    // Cargar conversaciones
    cargarConversacionesDashboard();

    // INICIAR POLLING GLOBAL DE MENSAJES (tiempo real)
    if (window.mensajeriaGlobalInterval)
      clearInterval(window.mensajeriaGlobalInterval);
    window.mensajeriaGlobalInterval = setInterval(() => {
      // Actualizar lista de conversaciones
      cargarConversacionesDashboard();

      // Si hay conversación activa, actualizar mensajes
      if (window.conversacionActivaDashboard) {
        try {
          // SIEMPRE actualizar mensajes para tiempo real instantáneo
          cargarMensajesDashboard(
            window.conversacionActivaDashboard.id_conversacion,
            false,
          );
        } catch (err) {
          console.warn("Error polling mensajes:", err);
        }
      }
    }, 1000); // 1 segundo para mensajes instantáneos
  } else {
    // Detener polling si salimos de mensajes
    if (window.mensajeriaGlobalInterval) {
      clearInterval(window.mensajeriaGlobalInterval);
      window.mensajeriaGlobalInterval = null;
    }
  }

  // Cerrar el sidebar automáticamente en móvil
  if (window.innerWidth < 1024) {
    closeSidebarFn();
  }

  // Scroll al Descubrir
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Función para abrir el sidebar
function openSidebar() {
  sidebar.classList.add("open");
  mainContent.classList.add("shifted");
  hamburgerBtn.classList.add("open");

  // Solo mostrar overlay y prevenir scroll en móvil
  if (window.innerWidth < 1024) {
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }
}

// Función para cerrar el sidebar
function closeSidebarFn() {
  sidebar.classList.remove("open");
  mainContent.classList.remove("shifted");
  overlay.classList.remove("show");
  hamburgerBtn.classList.remove("open");
  document.body.style.overflow = "";
}

// ========================================
// MODAL DE CERRAR SESIÓN
// ========================================
function logout() {
  showLogoutModal();
}

function showLogoutModal() {
  const t = (key) => translations[currentLanguage][key] || key;
  const modalHTML = `
                <div class="custom-modal-overlay" id="logoutModal" onclick="closeLogoutModal(event)">
                    <div class="custom-modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <div class="modal-icon">⚠</div>
                            <div class="modal-title" data-i18n="logout.title">${t("logout.title")}</div>
                        </div>
                        <div class="modal-message" data-i18n="logout.message">
                            ${t("logout.message")}
                        </div>
                        <div class="modal-actions">
                            <button class="modal-btn modal-btn-cancel" onclick="closeLogoutModal()" data-i18n="logout.cancel">
                                ${t("logout.cancel")}
                            </button>
                            <button class="modal-btn modal-btn-confirm" onclick="confirmLogout()" data-i18n="logout.confirm">
                                ${t("logout.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function closeLogoutModal(event) {
  if (event && event.target.id !== "logoutModal") return;
  const modal = document.getElementById("logoutModal");
  if (modal) {
    modal.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => modal.remove(), 300);
  }
}

function confirmLogout() {
  // Limpiar localStorage (igual que en perfil.html)
  localStorage.removeItem("usuarioId");
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");

  // Redirigir al login
  window.location.href = "login.html";
}

// ========================================
// SINCRONIZACIÓN DE IMAGEN DE PERFIL
// ========================================
// Listener para actualizar imagen cuando cambia en perfil.html
window.addEventListener("storage", (e) => {
  if (e.key === "perfilImagenActualizada") {
    const sidebarUserImage = document.getElementById("sidebarUserImage");
    if (sidebarUserImage && e.newValue) {
      sidebarUserImage.src = e.newValue;
      console.log("Imagen del sidebar actualizada desde localStorage");
    }
  }
});

// También escuchar eventos personalizados (para cuando están en la misma pestaña)
window.addEventListener("perfilActualizado", (e) => {
  const sidebarUserImage = document.getElementById("sidebarUserImage");
  if (sidebarUserImage && e.detail && e.detail.imagenUrl) {
    sidebarUserImage.src = e.detail.imagenUrl;
    console.log("Imagen del sidebar actualizada desde evento personalizado");
  }
});

// Verificar si hay actualizaciones pendientes al cargar
function verificarActualizacionesPendientes() {
  const imagenActualizada = localStorage.getItem("perfilImagenActualizada");
  const timestamp = localStorage.getItem("perfilImagenTimestamp");

  if (imagenActualizada && timestamp) {
    const tiempoTranscurrido = Date.now() - parseInt(timestamp);
    // Si la actualización fue hace menos de 5 segundos, aplicarla
    if (tiempoTranscurrido < 5000) {
      const sidebarUserImage = document.getElementById("sidebarUserImage");
      if (sidebarUserImage) {
        sidebarUserImage.src = imagenActualizada;
        console.log("Imagen del sidebar actualizada desde caché reciente");
      }
    }
  }
}

// Event listeners
hamburgerBtn.addEventListener("click", openSidebar);
closeSidebar.addEventListener("click", closeSidebarFn);
overlay.addEventListener("click", closeSidebarFn);

// Cerrar sidebar con tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSidebarFn();
  }
});

// ========================================
// CARGAR INFORMACIÓN DEL USUARIO EN SIDEBAR
// ========================================
const API_BASE = `${window.BACKEND_URL}/api`;

// Variable global para el usuario actual
let miPerfilIdGlobal = null;

// Variable global para almacenar usuarios
let usuariosReales = [];

// Variables de paginación y ordenamiento
let currentPage = 1;
let usersPerPage = 9;
let currentSort = "recent";
let allUsers = []; // Copia completa de usuarios para ordenamiento
let currentCategoryFilter = null; // Filtro de categoría activo
let currentSearchFilter = ""; // Filtro de búsqueda activo

// Variable global para almacenar ID_Persona del usuario actual
let usuarioActualPersonaId = null;

async function cargarDatosUsuario() {
  try {
    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) {
      console.log("No hay usuario logueado");
      return;
    }

    // Consultar persona por usuario ID
    const resPersona = await fetch(
      `${API_BASE}/personas/by-usuario/${usuarioId}`,
    );
    const dataPersona = await resPersona.json();

    if (!resPersona.ok || !dataPersona.success || !dataPersona.data) {
      console.error("No se pudo obtener el perfil de la persona");
      return;
    }

    const personaDB = dataPersona.data;

    // Lógica de fallback si no tiene nombre (usuarios nuevos)
    let nombreMostrar = personaDB.nombre_Persona;
    let apellidoMostrar = personaDB.apellido_Persona;

    if (!nombreMostrar) {
      const correoUsuario = localStorage.getItem("correoUsuario") || "";
      if (correoUsuario) {
        const nombreDelCorreo = correoUsuario.split("@")[0];
        // Capitalizar
        nombreMostrar =
          nombreDelCorreo.charAt(0).toUpperCase() + nombreDelCorreo.slice(1);
        apellidoMostrar = ""; // No hay apellido en el correo
      }
    }

    // Función para generar avatar con solo la primera inicial
    function generarAvatar(nombre, apellido, imagenUrl) {
      if (imagenUrl) {
        return imagenUrl;
      }
      // Solo la primera letra del nombre
      const inicial = (nombre || "U").charAt(0).toUpperCase();
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(inicial)}&background=3b82f6&color=fff&size=48&bold=true&rounded=true`;
    }

    // Actualizar imagen de perfil
    const sidebarUserImage = document.getElementById("sidebarUserImage");
    const avatarUrl = generarAvatar(
      nombreMostrar,
      apellidoMostrar,
      personaDB.imagenUrl_Persona,
    );
    sidebarUserImage.src = avatarUrl;

    // Actualizar nombre
    const sidebarUserName = document.getElementById("sidebarUserName");
    const nombreCompleto =
      `${nombreMostrar || ""} ${apellidoMostrar || ""}`.trim();
    sidebarUserName.textContent = nombreCompleto || "Usuario";
  } catch (error) {
    console.error("Error al cargar datos del usuario:", error);
  }
}

// ========================================
// CARGAR USUARIOS DESDE EL BACKEND
// ========================================
let categoriaActiva = null; // Para trackear qué filtro está activo

async function cargarCategorias() {
  try {
    const resCategorias = await fetch(`${API_BASE}/categorias`);
    const dataCategorias = await resCategorias.json();

    if (!resCategorias.ok || !dataCategorias.success) {
      console.error("Error al cargar categorías");
      return;
    }

    const categorias = dataCategorias.data;
    console.log("Categorías cargadas:", categorias); // Debug

    const categoryFilters = document.getElementById("categoryFilters");

    // Mapeo de iconos y claves de traducción para cada categoría
    const iconos = {
      "Diseño y Creatividad": "mdi:palette",
      "Educación y Tutorías": "mdi:book-open-variant",
      "Tecnología y Desarrollo": "mdi:code-tags",
      "Servicios Profesionales y Asesoría": "mdi:briefcase",
      "Hogar y Reparaciones": "mdi:home-variant",
      "Bienestar y Personal": "mdi:heart-pulse",
      Fotografía: "mdi:camera",
      Música: "mdi:music",
      Escritura: "mdi:pencil",
      Otro: "mdi:dots-horizontal",
    };

    // Mapeo de nombres de categoría a claves de traducción
    const categoryTranslationKeys = {
      "Diseño y Creatividad": "categories.design",
      "Educación y Tutorías": "categories.education",
      "Tecnología y Desarrollo": "categories.tech",
      "Servicios Profesionales y Asesoría": "categories.professional",
      "Hogar y Reparaciones": "categories.home",
      "Bienestar y Personal": "categories.wellness",
      Otro: "categories.other",
    };

    // Función auxiliar: generar slug seguro para URL
    function slugify(text) {
      return (text || "")
        .toString()
        .normalize("NFD") // separar acentos
        .replace(/\p{Diacritic}/gu, "") // eliminar diacríticos
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_") // reemplazar separadores por guiones bajos
        .replace(/^_+|_+$/g, "");
    }

    // Crear botón para cada categoría
    categorias.forEach((categoria) => {
      // Los nombres de campos pueden variar, intentar diferentes variaciones
      const nombreCategoria =
        categoria.nombre_categoria ||
        categoria.nombre_categoria_Habilidad ||
        categoria.nombreCategoria ||
        "Categoría";

      const idCategoria =
        categoria.id_categorias_Habilidades_Servicios ||
        categoria.id_categoria_Habilidad_Servicio ||
        categoria.id;

      const icono = iconos[nombreCategoria] || "mdi:star";
      const translationKey = categoryTranslationKeys[nombreCategoria];

      console.log("Procesando categoría:", {
        nombreCategoria,
        idCategoria,
        translationKey,
      }); // Debug

      const button = document.createElement("button");
      button.className =
        "filter-button px-6 py-2 bg-white text-gray-700 rounded-full hover:bg-blue-50 hover:text-blue-600 transition border border-gray-200 shadow-sm flex items-center gap-2";
      button.setAttribute("data-categoria-id", idCategoria);
      // Añadir slug legible para la URL (ej: disenio_y_creatividad)
      const slug = slugify(nombreCategoria);
      if (slug) button.setAttribute("data-categoria-slug", slug);
      button.onclick = (e) => filtrarPorCategoria(idCategoria, e);

      // Si hay clave de traducción, agregar el atributo data-i18n
      if (translationKey) {
        button.innerHTML = `
                            <span class="iconify" data-icon="${icono}" data-width="20" data-height="20"></span>
                            <span data-i18n="${translationKey}">${nombreCategoria}</span>
                        `;
      } else {
        button.innerHTML = `
                            <span class="iconify" data-icon="${icono}" data-width="20" data-height="20"></span>
                            ${nombreCategoria}
                        `;
      }

      categoryFilters.appendChild(button);
    });

    // Después de crear los botones, si la URL contiene un slug de categoría
    // intentar activar ese filtro automáticamente.
    try {
      const rawPath = decodeURIComponent(
        window.location.pathname.replace(/^\/+/, "").split("/")[0] || "",
      );
      if (rawPath && rawPath !== "") {
        const normalizedPathSlug = slugify(rawPath);
        if (normalizedPathSlug) {
          const targetBtn = categoryFilters.querySelector(
            '[data-categoria-slug="' + normalizedPathSlug + '"]',
          );
          if (targetBtn) {
            // Defer para asegurarnos que el resto del init termine
            setTimeout(() => {
              targetBtn.click();
            }, 50);
          }
        }
      }
    } catch (e) {
      console.warn("No se pudo activar slug de categoría desde la URL:", e);
    }
  } catch (error) {
    console.error("Error al cargar categorías:", error);
  }
}

async function filtrarPorCategoria(idCategoria, event) {
  // Guardar el filtro de categoría activo
  currentCategoryFilter = idCategoria;
  currentPage = 1; // Resetear a primera página

  // Actualizar estilos de botones
  const buttons = document.querySelectorAll("#categoryFilters .filter-button");
  buttons.forEach((btn) => {
    btn.classList.remove(
      "filter-active",
      "bg-blue-600",
      "text-white",
      "border-blue-600",
    );
    btn.classList.add("bg-white", "text-gray-700", "border-gray-200");
  });

  // Marcar botón activo
  if (event && event.target) {
    const buttonElement = event.target.closest(".filter-button");
    if (buttonElement) {
      buttonElement.classList.add(
        "filter-active",
        "bg-blue-600",
        "text-white",
        "border-blue-600",
      );
      buttonElement.classList.remove(
        "bg-white",
        "text-gray-700",
        "border-gray-200",
      );
      // Actualizar la URL (solo la ruta) a `/mi_slug_de_categoria`
      try {
        const slug = buttonElement.getAttribute("data-categoria-slug") || "";
        if (slug) {
          const state = { category: slug };
          const p = "/" + encodeURIComponent(slug);
          history.pushState(state, "", p);
        }
      } catch (err) {
        // No bloquear la funcionalidad por errores en history
        console.warn("No se pudo actualizar la URL de categoría:", err);
      }
    }
  }

  // Aplicar todos los filtros
  await aplicarFiltros();
}

// ========================================
// FUNCIÓN PARA APLICAR FILTROS COMBINADOS
// ========================================
async function aplicarFiltros() {
  try {
    mostrarSkeletonLoaders(usersPerPage);

    const usuarioActualId = localStorage.getItem("usuarioId");
    let personas = [];

    // 1. Obtener personas según el filtro de categoría
    if (currentCategoryFilter === null) {
      // Sin filtro de categoría - obtener todos
      const resPersonas = await fetch(`${API_BASE}/personas`);
      const dataPersonas = await resPersonas.json();

      if (!resPersonas.ok || !dataPersonas.success) {
        console.error("Error al obtener personas");
        usersGrid.innerHTML =
          '<p class="col-span-full text-center text-gray-500">Error al cargar usuarios</p>';
        return;
      }
      personas = dataPersonas.data;
    } else {
      // Con filtro de categoría
      const resPersonas = await fetch(
        `${API_BASE}/personas/categoria/${currentCategoryFilter}`,
      );

      if (!resPersonas.ok) {
        const errorData = await resPersonas.json().catch(() => ({}));
        console.error("Error del servidor:", resPersonas.status, errorData);
        usersGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Error al filtrar: ${errorData.error || "Error del servidor"}</p>`;
        return;
      }

      const dataPersonas = await resPersonas.json();

      if (!dataPersonas.success) {
        console.error("Error al filtrar personas:", dataPersonas);
        usersGrid.innerHTML =
          '<p class="col-span-full text-center text-gray-500">No se encontraron usuarios en esta categoría</p>';
        return;
      }

      personas = dataPersonas.data;
    }

    // 2. Filtrar usuario actual
    const personasFiltradas = personas.filter((persona) => {
      return (
        !usuarioActualId || persona.id_Usuario !== parseInt(usuarioActualId)
      );
    });

    // 3. Procesar usuarios en paralelo
    const usuariosPromises = personasFiltradas.map(async (persona) => {
      try {
        const [resHabilidades, resDireccion] = await Promise.all([
          fetch(
            `${API_BASE}/habilidades/persona/${persona.id_Perfil_Persona}`,
          ).catch(() => null),
          fetch(
            `${API_BASE}/direcciones/persona/${persona.id_Perfil_Persona}`,
          ).catch(() => null),
        ]);

        let habilidades = [];
        if (resHabilidades && resHabilidades.ok) {
          const dataHabilidades = await resHabilidades.json();
          if (dataHabilidades.success && dataHabilidades.data) {
            habilidades = dataHabilidades.data
              .filter((h) => h.tipoEstado_Habilidad === "Ofrece")
              .map((h) => h.nombre_Habilidad)
              .slice(0, 4);
          }
        }

        let location = "Sin ubicación";
        if (resDireccion && resDireccion.ok) {
          const dataDireccion = await resDireccion.json();
          if (dataDireccion.success && dataDireccion.data) {
            const direccion = Array.isArray(dataDireccion.data)
              ? dataDireccion.data[0]
              : dataDireccion.data;

            const ciudad = direccion.ciudad_Direccion || direccion.ciudad || "";
            const pais = direccion.pais_Direccion || direccion.pais || "";
            location =
              [ciudad, pais].filter(Boolean).join(", ") || "Sin ubicación";
          }
        }

        // Obtener estadísticas reales
        let rating = 0;
        let exchanges = 0;

        try {
          const resEstadisticas = await fetch(
            `${API_BASE}/intercambios/estadisticas/${persona.id_Perfil_Persona}`,
          );
          if (resEstadisticas.ok) {
            const dataEstadisticas = await resEstadisticas.json();
            if (dataEstadisticas.success && dataEstadisticas.data) {
              rating = dataEstadisticas.data.promedio_calificacion || 0;
              exchanges =
                dataEstadisticas.data.total_intercambios_completados || 0;
            }
          }
        } catch (e) {
          console.error("Error al obtener estadísticas:", e);
        }

        return {
          id: persona.id_Perfil_Persona,
          usuarioId: persona.id_Usuario,
          name:
            `${persona.nombre_Persona || ""} ${persona.apellido_Persona || ""}`.trim() ||
            "Usuario",
          profession:
            persona.descripcionPerfil_Persona || "Usuario SkillConnect",
          location: location,
          skills: habilidades,
          bio: persona.descripcionPerfil_Persona || "Sin descripción",
          rating: rating,
          exchanges: exchanges,
          online: Math.random() > 0.5,
          avatar: persona.imagenUrl_Persona || null,
          avatarInitials: (persona.nombre_Persona || "U")[0].toUpperCase(),
        };
      } catch (error) {
        console.error(
          `Error al procesar persona ${persona.id_Perfil_Persona}:`,
          error,
        );
        return null;
      }
    });

    const resultados = await Promise.all(usuariosPromises);
    let usuariosFiltrados = resultados.filter((u) => u !== null);

    // 4. Aplicar filtro de búsqueda si existe
    if (currentSearchFilter && currentSearchFilter.trim() !== "") {
      const searchTerm = currentSearchFilter.toLowerCase().trim();

      usuariosFiltrados = usuariosFiltrados.filter((user) => {
        const matchName = user.name.toLowerCase().includes(searchTerm);
        const matchLocation = user.location.toLowerCase().includes(searchTerm);
        const matchSkills = user.skills.some((skill) =>
          skill.toLowerCase().includes(searchTerm),
        );
        const matchBio = user.bio.toLowerCase().includes(searchTerm);

        return matchName || matchLocation || matchSkills || matchBio;
      });
    }

    // 5. Actualizar allUsers y renderizar
    allUsers = usuariosFiltrados;

    renderUserCardsReal();
  } catch (error) {
    console.error("Error al aplicar filtros:", error);
    usersGrid.innerHTML =
      '<p class="col-span-full text-center text-red-500">Error al filtrar usuarios</p>';
  }
}

// ========================================
// CARGAR ESTADÍSTICAS GLOBALES
// ========================================
async function cargarEstadisticasGlobales() {
  try {
    console.log(" Cargando estadísticas globales...");
    const response = await fetch(
      `${API_BASE}/intercambios/estadisticas-globales`,
    );
    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error("Error al obtener estadísticas globales");
    }

    const data = await response.json();
    console.log("Datos recibidos:", data);

    if (data.success && data.data) {
      console.log("Usuarios activos:", data.data.usuarios_activos);
      console.log("Categorías:", data.data.categorias_disponibles);
      console.log("Intercambios:", data.data.intercambios_exitosos);

      // Actualizar los valores en el HTML usando animación
      animarContador("usuarios-activos", data.data.usuarios_activos);
      animarContador(
        "categorias-disponibles",
        data.data.categorias_disponibles,
      );
      animarContador("intercambios-exitosos", data.data.intercambios_exitosos);
    }
  } catch (error) {
    // Mantener valores por defecto si hay error
  }
}

// Función auxiliar para animar el contador
function animarContador(elementId, valorFinal) {
  const elemento = document.getElementById(elementId);
  if (!elemento) {
    console.error(` No se encontró el elemento con ID: ${elementId}`);
    return;
  }

  // console.log eliminado

  const duracion = 1000; // 1 segundo
  const pasos = 20;
  const incremento = valorFinal / pasos;
  let valorActual = 0;
  const intervalo = duracion / pasos;

  const timer = setInterval(() => {
    valorActual += incremento;
    if (valorActual >= valorFinal) {
      valorActual = valorFinal;
      clearInterval(timer);
    }
    elemento.textContent = Math.floor(valorActual).toLocaleString("es-ES");
  }, intervalo);
}

async function cargarUsuariosReales() {
  try {
    console.log("Cargando usuarios desde el backend...");
    console.time("Carga de usuarios"); // Medir tiempo

    // Obtener el ID del usuario actual para excluirlo
    const usuarioActualId = localStorage.getItem("usuarioId");

    // 1. Obtener todas las personas
    const resPersonas = await fetch(`${API_BASE}/personas`);
    const dataPersonas = await resPersonas.json();

    if (!resPersonas.ok || !dataPersonas.success) {
      console.error("Error al obtener personas");
      usersGrid.innerHTML =
        '<p class="col-span-full text-center text-gray-500">Error al cargar usuarios</p>';
      return;
    }

    const personas = dataPersonas.data;

    // Filtrar usuario actual primero
    const personasFiltradas = personas.filter((persona) => {
      return (
        !usuarioActualId || persona.id_Usuario !== parseInt(usuarioActualId)
      );
    });

    console.log(`Procesando ${personasFiltradas.length} usuarios...`);

    // 2. Procesar usuarios en paralelo (mucho más rápido)
    const usuariosPromises = personasFiltradas.map(async (persona) => {
      try {
        // Hacer ambas peticiones en paralelo
        const [resHabilidades, resDireccion] = await Promise.all([
          fetch(
            `${API_BASE}/habilidades/persona/${persona.id_Perfil_Persona}`,
          ).catch(() => null),
          fetch(
            `${API_BASE}/direcciones/persona/${persona.id_Perfil_Persona}`,
          ).catch(() => null),
        ]);

        // Procesar habilidades
        let habilidades = [];
        if (resHabilidades && resHabilidades.ok) {
          const dataHabilidades = await resHabilidades.json();
          if (dataHabilidades.success && dataHabilidades.data) {
            habilidades = dataHabilidades.data
              .filter((h) => h.tipoEstado_Habilidad === "Ofrece")
              .map((h) => h.nombre_Habilidad)
              .slice(0, 4);
          }
        }

        // Procesar dirección
        let location = "Sin ubicación";
        if (resDireccion && resDireccion.ok) {
          const dataDireccion = await resDireccion.json();
          if (dataDireccion.success && dataDireccion.data) {
            const direccion = Array.isArray(dataDireccion.data)
              ? dataDireccion.data[0]
              : dataDireccion.data;

            const ciudad = direccion.ciudad_Direccion || direccion.ciudad || "";
            const pais = direccion.pais_Direccion || direccion.pais || "";
            location =
              [ciudad, pais].filter(Boolean).join(", ") || "Sin ubicación";
          }
        }

        // Obtener estadísticas reales
        let rating = 0;
        let exchanges = 0;

        try {
          const resEstadisticas = await fetch(
            `${API_BASE}/intercambios/estadisticas/${persona.id_Perfil_Persona}`,
          );
          if (resEstadisticas.ok) {
            const dataEstadisticas = await resEstadisticas.json();
            if (dataEstadisticas.success && dataEstadisticas.data) {
              rating = dataEstadisticas.data.promedio_calificacion || 0;
              exchanges =
                dataEstadisticas.data.total_intercambios_completados || 0;
            }
          }
        } catch (e) {
          console.error("Error al obtener estadísticas:", e);
        }

        // Crear objeto de usuario
        return {
          id: persona.id_Perfil_Persona,
          usuarioId: persona.id_Usuario,
          name:
            `${persona.nombre_Persona || ""} ${persona.apellido_Persona || ""}`.trim() ||
            "Usuario",
          profession:
            persona.descripcionPerfil_Persona || "Usuario SkillConnect",
          location: location,
          skills: habilidades,
          bio: persona.descripcionPerfil_Persona || "Sin descripción",
          rating: rating,
          exchanges: exchanges,
          online: Math.random() > 0.5,
          avatar: persona.imagenUrl_Persona || null,
          avatarInitials: (persona.nombre_Persona || "U")[0].toUpperCase(),
        };
      } catch (error) {
        console.error(
          `Error al procesar persona ${persona.id_Perfil_Persona}:`,
          error,
        );
        return null;
      }
    });

    // Esperar a que todos los usuarios se procesen en paralelo
    const resultados = await Promise.all(usuariosPromises);

    // Filtrar nulos y asignar
    usuariosReales = resultados.filter((u) => u !== null);
    allUsers = [...usuariosReales]; // Guardar copia completa

    console.timeEnd("Carga de usuarios");
    console.log(` ${usuariosReales.length} usuarios cargados exitosamente`);

    // 3. Renderizar usuarios reales con paginación
    renderUserCardsReal();
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    usersGrid.innerHTML =
      '<p class="col-span-full text-center text-red-500">Error al cargar usuarios. Por favor, recarga la página.</p>';
  }
}

// ========================================
// FUNCIONES DE ORDENAMIENTO
// ========================================
function sortUsers(users, sortType) {
  const sorted = [...users];

  switch (sortType) {
    case "recent":
      // Ordenar por ID descendente (más recientes primero)
      return sorted.sort((a, b) => b.id - a.id);

    case "name":
      // Ordenar alfabéticamente por nombre
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case "skills":
      // Ordenar por cantidad de habilidades (más primero)
      return sorted.sort((a, b) => b.skills.length - a.skills.length);

    case "location":
      // Ordenar por ubicación alfabéticamente
      return sorted.sort((a, b) => a.location.localeCompare(b.location));

    default:
      return sorted;
  }
}

// ========================================
// FUNCIONES DE PAGINACIÓN
// ========================================
function renderPagination() {
  const totalPages = Math.ceil(allUsers.length / usersPerPage);
  const paginationContainer = document.getElementById("paginationControls");

  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  let buttons = "";

  // Botón anterior
  buttons += `
                <button
                    onclick="changePage(${currentPage - 1})"
                    ${currentPage === 1 ? "disabled" : ""}
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </button>
            `;

  // Botones de páginas
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    buttons += `
                    <button onclick="changePage(1)" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        1
                    </button>
                `;
    if (startPage > 2) {
      buttons += `<span class="px-2 py-2">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    buttons += `
                    <button
                        onclick="changePage(${i})"
                        class="px-4 py-2 border rounded-lg transition ${i === currentPage ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"}">
                        ${i}
                    </button>
                `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      buttons += `<span class="px-2 py-2">...</span>`;
    }
    buttons += `
                    <button onclick="changePage(${totalPages})" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        ${totalPages}
                    </button>
                `;
  }

  // Botón siguiente
  buttons += `
                <button
                    onclick="changePage(${currentPage + 1})"
                    ${currentPage === totalPages ? "disabled" : ""}
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </button>
            `;

  paginationContainer.innerHTML = buttons;
}

function changePage(page) {
  const totalPages = Math.ceil(allUsers.length / usersPerPage);
  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderUserCardsReal();

  // Scroll suave al Descubrir del grid
  document
    .getElementById("usersGrid")
    .scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateResultsCount() {
  const start = (currentPage - 1) * usersPerPage + 1;
  const end = Math.min(currentPage * usersPerPage, allUsers.length);
  const total = allUsers.length;

  const showing = t("users.showing");
  const of = t("users.of");
  const users = total === 1 ? t("users.user") : t("users.users");

  document.getElementById("resultsCount").textContent =
    `${showing} ${start}-${end} ${of} ${total} ${users}`;
}

// ========================================
// SISTEMA DE FAVORITOS (Conectado con Backend)
// ========================================

let favoritosCache = [];

// Cargar favoritos desde el backend
async function cargarFavoritosDesdeBackend() {
  try {
    console.log(" cargarFavoritosDesdeBackend() - Descubrir");
    const personaId = await obtenerPersonaIdActual();
    if (!personaId) {
      console.warn(" No hay personaId");
      return [];
    }

    console.log("📡 Fetch a /api/favoritos/" + personaId);
    const response = await fetch(`${API_BASE}/favoritos/${personaId}`);
    const data = await response.json();
    console.log(" cargarFavoritosDesdeBackend - Data:", data);

    if (data.success) {
      favoritosCache = data.favoritos.map((fav) => ({
        id: fav.id_persona,
        nombre: fav.nombre,
        fechaAgregado: fav.fecha_agregado,
      }));
      console.log(
        "favoritosCache actualizado:",
        favoritosCache.length,
        "favoritos",
      );
      return favoritosCache;
    }
    return [];
  } catch (error) {
    console.error(" Error al cargar favoritos:", error);
    return [];
  }
}

// Verificar si un usuario es favorito
function esFavorito(userId) {
  return favoritosCache.some((fav) => fav.id === userId);
}

// Toggle favorito (agregar o quitar) con Backend
async function toggleFavorite(event, userId, userName) {
  event.stopPropagation();
  event.preventDefault();

  try {
    // Obtener id_Perfil_Persona en lugar de id_Usuario
    const personaId = await obtenerPersonaIdActual();
    if (!personaId) {
      Toast.error(
        "Acceso requerido",
        "Debes iniciar sesión para agregar favoritos",
      );
      return;
    }

    console.log(" Toggle favorito:", { personaId, userId, userName });

    const response = await fetch(`${API_BASE}/favoritos/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_persona: personaId,
        id_persona_favorito: userId,
      }),
    });

    const data = await response.json();

    if (data.success) {
      if (data.accion === "agregado") {
        favoritosCache.push({
          id: userId,
          nombre: userName,
          fechaAgregado: new Date().toISOString(),
        });
        // SVG corazón rojo
        const svgCorazon = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path fill=\"#ff401d\" d=\"M12.002 4.818a6.228 6.228 0 0 1 8.51 9.087l-5.225 5.225L12 22.415l-7.28-7.279l-1.23-1.232a6.228 6.228 0 0 1 8.511-9.086\"/></svg>`;
        showNotification(
          `${svgCorazon} ${userName} agregado a favoritos`,
          "success",
        );
        localStorage.setItem("actualizarEstadisticas", Date.now().toString());
      } else {
        const svgCorazon2 = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 36 36\"><g fill=\"#dd2e44\"><path d=\"M13.589 26.521a1.5 1.5 0 0 1 .035-1.599l4.395-6.646l-5.995-5.139a1.5 1.5 0 0 1-.31-1.911l4.304-7.172a9.78 9.78 0 0 0-6.035-2.09c-5.45 0-9.868 4.417-9.868 9.868c0 .772.098 1.52.266 2.241C1.751 22.587 11.216 31.568 18 34.034l.077-.032z\"/><path d=\"M26.018 1.966c-2.765 0-5.248 1.151-7.037 2.983l-4.042 6.737l6.039 5.176a1.5 1.5 0 0 1 .274 1.966l-4.604 6.962l4.161 6.935c6.338-3.529 13.621-11.263 14.809-18.649c.17-.721.268-1.469.268-2.241c-.001-5.452-4.419-9.869-9.868-9.869\"/></g></svg>`;
        favoritosCache = favoritosCache.filter((fav) => fav.id !== userId);
        localStorage.setItem("actualizarEstadisticas", Date.now().toString());
        showNotification(
          `${svgCorazon2} ${userName} eliminado de favoritos`,
          "info",
        );
      }

      // Sincronización UI: Actualizar TODOS los botones de este usuario en toda la página
      const allFavBtns = document.querySelectorAll(
        `.favorite-btn[onclick*="${userId}"]`,
      );
      allFavBtns.forEach((btn) => {
        const isAdded = data.accion === "agregado";

        // 1. Clase Active
        if (isAdded) btn.classList.add("active");
        else btn.classList.remove("active");

        // 2. Título tooltip
        btn.title = isAdded ? "Quitar de favoritos" : "Agregar a favoritos";

        // 3. Icono correcto (evita el "corazón gris relleno")
        const iconName = isAdded ? "ph:heart-fill" : "ph:heart";
        btn.innerHTML = `<span class="iconify favorite-icon" data-icon="${iconName}"></span>`;
      });

      // Forzar renderizado de nuevos iconos Iconify (si la librería está cargada)
      if (window.Iconify && typeof window.Iconify.scan === "function") {
        window.Iconify.scan();
      }

      // Actualizar badge del menú
      actualizarBadgeFavoritos();

      // Re-renderizar la vista actual
      if (currentView === "favoritos") {
        await cargarFavoritos();
      } else {
        renderUserCardsReal();
      }

      // Notificar a otras pestañas/páginas que las estadísticas deben actualizarse
      localStorage.setItem("actualizarEstadisticas", Date.now().toString());
    } else {
      showNotification(data.mensaje || "Error al actualizar favorito", "error");
    }
  } catch (error) {
    console.error(" Error toggleFavorite:", error);
    Toast.error("Error", "Ocurrió un error al procesar la solicitud");
  }
}

// Actualizar el badge de favoritos en el sidebar
function actualizarBadgeFavoritos() {
  const badge = document.getElementById("favoritosBadge");
  if (badge) {
    badge.textContent = favoritosCache.length;
    if (favoritosCache.length > 0) {
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }
  }
}

// Cargar y mostrar usuarios favoritos (patrón de solicitudes enviadas)
async function cargarFavoritos() {
  // console.log eliminado
  try {
    console.log(" Obteniendo personaId actual...");
    const personaId = await obtenerPersonaIdActual();
    console.log(" personaId obtenido:", personaId);

    if (!personaId) {
      console.warn(" No hay personaId, abortando");
      return;
    }

    console.log(
      ` Haciendo fetch a: ${window.APP_CONFIG.BACKEND_URL}/api/favoritos/${personaId}`,
    );
    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/favoritos/${personaId}`,
    );

    if (!response.ok) throw new Error("Error al cargar favoritos");

    const data = await response.json();

    mostrarFavoritos(data.favoritos || []);

    // Actualizar badge
    actualizarBadgeFavoritos();
  } catch (error) {
    console.error(" Error al cargar favoritos:", error);
    mostrarEstadoVacioFavoritos();
  }
}

// Mostrar favoritos
function mostrarFavoritos(favoritos) {
  // console.log eliminado

  const grid = document.getElementById("favoritosGrid");
  // console.log eliminado

  if (!favoritos || favoritos.length === 0) {
    console.log(" No hay favoritos, mostrando estado vacío");
    mostrarEstadoVacioFavoritos();
    return;
  }

  // console.log eliminado
  grid.innerHTML = favoritos
    .map((fav) => {
      const userId = fav.id_persona;

      // Buscar datos completos del usuario en allUsers
      const userCompleto = allUsers.find((u) => u.id === userId);

      // Si encontramos el usuario completo, usar sus datos; si no, usar los de favorito
      const nombreCompleto = userCompleto
        ? userCompleto.name
        : fav.nombre || "Usuario";
      const imagenUrl = userCompleto ? userCompleto.avatar : fav.imagen || "";
      const profesion = userCompleto
        ? userCompleto.profession
        : fav.profesion || fav.titulo_habilidad || "Sin profesión";
      const ubicacion = userCompleto
        ? userCompleto.location
        : fav.ubicacion || fav.ciudad || "Ubicación no especificada";
      const bio = userCompleto
        ? userCompleto.bio
        : fav.descripcion || "Sin descripción";
      const habilidades = userCompleto
        ? userCompleto.skills
        : fav.habilidades || fav.skills || [];
      const rating = userCompleto
        ? userCompleto.rating
        : fav.rating || fav.calificacion_promedio || 0;
      const intercambios = userCompleto
        ? userCompleto.exchanges
        : fav.intercambios || fav.total_intercambios || 0;

      const initials = nombreCompleto
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      return `
                    <div class="user-card" onclick="viewProfile(${userId})">
                        <!-- Botón de favoritos -->
                        <button onclick="toggleFavorite(event, ${userId}, '${nombreCompleto.replace(/'/g, "\\'")}'); localStorage.setItem('actualizarFavoritos', Date.now().toString()); cargarFavoritosDesdeBackend().then(() => { renderUserCardsReal(); });"
                                class="favorite-btn active"
                                title="Quitar de favoritos">
                            <span class="iconify favorite-icon" data-icon="ph:heart-fill"></span>
                        </button>

                        <!-- Banner superior con gradiente -->
                        <div class="user-card-banner bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>

                        <!-- Contenido de la tarjeta -->
                        <div class="user-card-content">
                            <div class="user-card-info">
                                <!-- Avatar -->
                                <div class="user-card-avatar-container">
                                    <div class="relative inline-block">
                                        ${
                                          imagenUrl
                                            ? `<img src="${imagenUrl}"
                                                   alt="${nombreCompleto}"
                                                   class="user-avatar object-cover"
                                                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                               <div class="user-avatar hidden">
                                                   <span class="text-white text-3xl font-bold">${initials}</span>
                                               </div>`
                                            : `<div class="user-avatar">
                                                   <span class="text-white text-3xl font-bold">${initials}</span>
                                               </div>`
                                        }
                                    </div>
                                </div>

                                <!-- Información del usuario -->
                                <h3 class="text-xl font-bold text-gray-800 mb-1 truncate" title="${nombreCompleto}">${nombreCompleto}</h3>
                                <p class="text-blue-600 font-semibold mb-2 truncate" title="${profesion}">${profesion}</p>

                                <!-- Ubicación -->
                                <div class="flex items-center text-gray-600 text-sm mb-3">
                                    <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    <span class="truncate">${ubicacion}</span>
                                </div>

                                <!-- Bio -->
                                <p class="text-gray-600 text-sm user-bio mb-3" title="${bio}">${bio}</p>

                                <!-- Habilidades -->
                                <div class="skills-container-card">
                                    <div class="flex flex-wrap gap-1">
                                        ${
                                          habilidades.length > 0
                                            ? habilidades
                                                .slice(0, 4)
                                                .map(
                                                  (skill) =>
                                                    `<span class="skill-badge">${skill}</span>`,
                                                )
                                                .join("")
                                            : '<span class="text-gray-400 text-sm">Sin habilidades registradas</span>'
                                        }
                                    </div>
                                </div>

                                <!-- Estadísticas -->
                                <div class="flex items-center justify-between text-sm pb-4 border-b border-gray-200">
                                    <div class="flex items-center">
                                        ${
                                          rating > 0
                                            ? `<svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                               </svg>
                                               <span class="font-semibold text-gray-700">${rating.toFixed(1)}</span>`
                                            : `<span class="text-gray-400 text-xs">${t("card.noRating")}</span>`
                                        }
                                    </div>
                                    <div class="text-gray-600">
                                        <span class="font-semibold">${intercambios}</span> ${t("card.exchanges").toLowerCase()}
                                    </div>
                                </div>
                            </div>

                            <!-- Botones de acción -->
                            <div class="grid grid-cols-2 gap-3 mt-4">
                                <button onclick="event.stopPropagation(); viewProfile(${userId})"
                                        class="flex items-center justify-center px-4 py-2.5 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition w-full h-10">
                                    ${t("card.viewProfile")}
                                </button>
                                <button onclick="event.stopPropagation(); sendRequest(${userId}, '${nombreCompleto.replace(/'/g, "\\'")}')"
                                        class="flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition w-full h-10">
                                    ${t("card.requestExchange")}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    })
    .join("");
}

// Mostrar estado vacío de favoritos
function mostrarEstadoVacioFavoritos() {
  const grid = document.getElementById("favoritosGrid");
  grid.innerHTML = `
                <div class="col-span-full flex items-center justify-center py-12">
                    <div class="text-center">
                        <span class="iconify w-16 h-16 text-gray-300 mx-auto mb-4" data-icon="ph:heart" style="font-size: 64px;"></span>
                        <p class="text-gray-500 text-lg">${t("favorites.empty")}</p>
                        <p class="text-gray-400 text-sm mt-2">${t("favorites.emptyDesc")}</p>
                    </div>
                </div>
            `;
}

// Mostrar notificación (Wrapper para usar el nuevo sistema Toast)
function showNotification(message, type = "info") {
  // Limpiar mensaje agresivamente para asegurar una sola línea
  let cleanMessage = message
    ? String(message)
        .replace(/<br\s*\/?>|<\/?div>|<\/?p>|\n/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
    : "";

  // Usar el sistema global Toast si está disponible, sino fallback
  if (typeof Toast !== "undefined") {
    // Pasamos el mensaje como Título (primer arg) y detalle vacío (segundo arg)
    // para que se vea en una sola línea junto al icono del Toast.
    Toast.show(cleanMessage, "", type);
  } else {
    console.log("Toast no disponible:", message);
  }
}

// Función para renderizar las tarjetas con datos reales
function renderUserCardsReal() {
  if (allUsers.length === 0) {
    let mensaje = "No hay usuarios disponibles";
    let icono = `<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>`;

    if (currentSearchFilter && currentSearchFilter.trim() !== "") {
      mensaje = `No se encontraron resultados para "<strong>${currentSearchFilter}</strong>"`;
      icono = `<svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>`;
    } else if (currentCategoryFilter !== null) {
      mensaje = "No hay usuarios en esta categoría";
    }

    usersGrid.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center py-16">
                        ${icono}
                        <p class="text-gray-500 text-lg mb-2">${mensaje}</p>
                        ${currentSearchFilter ? '<p class="text-gray-400 text-sm">Intenta con otras palabras clave o limpia los filtros</p>' : ""}
                    </div>
                `;
    document.getElementById("resultsCount").textContent =
      "0 usuarios encontrados";
    document.getElementById("paginationControls").innerHTML = "";
    return;
  }

  // Aplicar ordenamiento
  const sortedUsers = sortUsers(allUsers, currentSort);

  // Calcular indices de paginación
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Actualizar contador
  updateResultsCount();

  // Renderizar tarjetas
  const usuarioActualId = parseInt(localStorage.getItem("usuarioId"));

  usersGrid.innerHTML = paginatedUsers
    .map(
      (user) => `
                <div class="user-card" onclick="viewProfile(${user.id})">
                    <!-- Botón de favoritos (ocultar si es el propio usuario) -->
                    ${
                      user.usuarioId !== usuarioActualId
                        ? `
                    <button type="button"
                            onclick="toggleFavorite(event, ${user.id}, '${user.name.replace(/'/g, "\\'")}')"
                            class="favorite-btn ${esFavorito(user.id) ? "active" : ""}"
                            title="${esFavorito(user.id) ? "Quitar de favoritos" : "Agregar a favoritos"}"
                            data-user-id="${user.id}">
                        <span class="iconify favorite-icon" data-icon="${esFavorito(user.id) ? "ph:heart-fill" : "ph:heart"}"></span>
                    </button>
                    `
                        : ""
                    }

                    <!-- Banner superior con gradiente -->
                    <div class="user-card-banner bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"></div>

                    <!-- Contenido de la tarjeta -->
                    <div class="user-card-content">
                        <div class="user-card-info">
                            <!-- Avatar con badge de estado - Alineado a la izquierda -->
                            <div class="user-card-avatar-container">
                                <div class="relative inline-block">
                                    ${
                                      user.avatar
                                        ? `<img src="${user.avatar}" alt="${user.name}" class="user-avatar object-cover">`
                                        : `<div class="user-avatar"><span class="text-white text-3xl font-bold">${user.avatarInitials}</span></div>`
                                    }
                                    ${user.online ? '<div class="online-badge"></div>' : ""}
                                </div>
                            </div>

                            <!-- Información del usuario -->
                            <h3 class="text-xl font-bold text-gray-800 mb-1 truncate" title="${user.name}">${user.name}</h3>
                            <p class="text-blue-600 font-semibold mb-2 truncate" title="${user.profession}">${user.profession}</p>

                            <!-- Ubicación -->
                            <div class="flex items-center text-gray-600 text-sm mb-3">
                                <svg class="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                </svg>
                                <span class="truncate">${user.location}</span>
                            </div>

                            <!-- Bio -->
                            <p class="text-gray-600 text-sm user-bio mb-3" title="${user.bio}">${user.bio}</p>

                            <!-- Habilidades -->
                            <div class="skills-container-card">
                                <div class="flex flex-wrap gap-1">
                                    ${
                                      user.skills.length > 0
                                        ? user.skills
                                            .slice(0, 4)
                                            .map(
                                              (skill) =>
                                                `<span class="skill-badge">${skill}</span>`,
                                            )
                                            .join("")
                                        : '<span class="text-gray-400 text-sm">Sin habilidades registradas</span>'
                                    }
                                </div>
                            </div>

                            <!-- Estadísticas -->
                            <div class="flex items-center justify-between text-sm pb-4 border-b border-gray-200">
                                <div class="flex items-center">
                                    ${
                                      user.rating > 0
                                        ? `<svg class="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                           </svg>
                                           <span class="font-semibold text-gray-700">${user.rating.toFixed(1)}</span>`
                                        : `<span class="text-gray-400 text-xs">${t("card.noRating")}</span>`
                                    }
                                </div>
                                <div class="text-gray-600">
                                    <span class="font-semibold">${user.exchanges}</span> ${t("card.exchanges").toLowerCase()}
                                </div>
                            </div>
                        </div>

                        <!-- Botones de acción (el botón 'Reportar' fue movido al perfil) -->
                       <div class="grid grid-cols-2 gap-3 mt-4">
    <button onclick="event.stopPropagation(); viewProfile(${user.id})"
            class="flex items-center justify-center px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
        ${t("card.viewProfile")}
    </button>

    <button onclick="event.stopPropagation(); sendRequest(${user.id}, '${user.name.replace(/'/g, "\\'")}')"
            class="request-button flex items-center justify-center px-4 py-2 text-white rounded-lg font-semibold">
        ${t("card.requestExchange")}
    </button>
</div>
                    </div>
                </div>
            `,
    )
    .join("");

  // Renderizar controles de paginación
  renderPagination();
}

// ========================================
// FUNCIÓN PARA MOSTRAR SKELETON LOADERS
// ========================================
function mostrarSkeletonLoaders(cantidad = 6) {
  const skeletons = Array(cantidad)
    .fill(0)
    .map(
      () => `
                <div class="skeleton-card">
                    <div class="skeleton-banner"></div>
                    <div class="p-6">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-line" style="width: 60%; margin: 0 auto 0.5rem;"></div>
                        <div class="skeleton-line" style="width: 40%; margin: 0 auto 1rem;"></div>
                        <div class="skeleton-line" style="width: 50%; margin: 0 auto 1rem;"></div>
                        <div class="skeleton-line" style="width: 90%; margin-bottom: 0.5rem;"></div>
                        <div class="skeleton-line" style="width: 75%; margin-bottom: 1rem;"></div>
                        <div class="flex gap-2 mb-4">
                            <div class="skeleton-badge"></div>
                            <div class="skeleton-badge"></div>
                            <div class="skeleton-badge"></div>
                        </div>
                        <div class="skeleton-line" style="width: 100%; height: 40px; margin-top: 2rem;"></div>
                    </div>
                </div>
            `,
    )
    .join("");

  usersGrid.innerHTML = skeletons;
}
// ========================================
// INICIALIZACIÓN OPTIMIZADA CON CARGA PARALELA
// ========================================
async function inicializarDashboard() {
  // Mostrar skeleton mientras carga
  mostrarSkeletonLoaders(6);

  // Cargar todo en paralelo para mejorar el rendimiento
  await Promise.all([
    cargarDatosUsuario(),
    cargarCategorias(),
    cargarUsuariosReales(),
    cargarFavoritosDesdeBackend(),
    cargarEstadisticasGlobales(),
    cargarSolicitudesEnviadas(),
  ]);

  // Verificar actualizaciones de imagen
  verificarActualizacionesPendientes();

  // Actualizar badge de favoritos
  actualizarBadgeFavoritos();

  // Aplicar traducciones después de cargar los datos
  applyTranslations();
}

// Llamar a la función de inicialización optimizada
inicializarDashboard();

// ========================================
// EVENT LISTENERS PARA PAGINACIÓN Y ORDENAMIENTO
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  // Selector de ordenamiento
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      currentPage = 1;
      renderUserCardsReal();
    });
  }

  // Selector de resultados por página
  const perPageSelect = document.getElementById("perPageSelect");
  if (perPageSelect) {
    perPageSelect.addEventListener("change", (e) => {
      usersPerPage = parseInt(e.target.value);
      currentPage = 1;
      renderUserCardsReal();
    });
  }

  // Búsqueda
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  if (searchInput && searchButton) {
    // Búsqueda al hacer clic en el botón
    searchButton.addEventListener("click", (e) => {
      e.preventDefault();
      currentSearchFilter = searchInput.value.trim();
      currentPage = 1;
      aplicarFiltros();
    });

    // Búsqueda al presionar Enter
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        currentSearchFilter = searchInput.value.trim();
        currentPage = 1;
        aplicarFiltros();
      }
    });

    // Búsqueda en tiempo real mientras escribe
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (
          searchInput.value.trim().length >= 3 ||
          searchInput.value.trim() === ""
        ) {
          currentSearchFilter = searchInput.value.trim();
          currentPage = 1;
          aplicarFiltros();
        }
      }, 500);
    });
  }

  // Verificar si se debe abrir el perfil de un usuario desde un enlace externo
  const urlParams = new URLSearchParams(window.location.search);
  const verPerfilId = urlParams.get("verPerfil");
  if (verPerfilId) {
    setTimeout(() => {
      console.log("Abriendo perfil desde URL, ID:", verPerfilId);
      viewProfile(parseInt(verPerfilId));
    }, 1500);
  }
});

// ========================================
// FUNCIONALIDAD DEL CHAT
// ========================================
function initializeChat() {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("message-input");
  const container = document.getElementById("message-container");

  if (!form || !input || !container) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const messageText = input.value.trim();

    if (messageText) {
      addMessageToChat(messageText, "sent");
      input.value = "";
      scrollToBottom();

      setTimeout(() => {
        addMessageToChat("Mensaje recibido y leído. ", "received");
        scrollToBottom();
      }, 1500);
    }
  });

  function addMessageToChat(text, type) {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const messageDiv = document.createElement("div");
    const bubbleDiv = document.createElement("div");
    const timeSpan = document.createElement("span");

    timeSpan.className = "block text-right text-xs mt-1";
    timeSpan.textContent = timeString;

    if (type === "sent") {
      messageDiv.className = "flex justify-end";
      bubbleDiv.className =
        "bg-indigo-600 text-white p-3 rounded-xl rounded-tr-none max-w-xs text-sm shadow";
      timeSpan.classList.add("text-indigo-300");
    } else {
      messageDiv.className = "flex justify-start";
      bubbleDiv.className =
        "bg-gray-200 p-3 rounded-xl rounded-tl-none max-w-xs text-sm shadow";
      timeSpan.classList.add("text-gray-500");
    }

    bubbleDiv.textContent = text;
    bubbleDiv.appendChild(timeSpan);
    messageDiv.appendChild(bubbleDiv);
    container.appendChild(messageDiv);
  }

  function scrollToBottom() {
    container.scrollTop = container.scrollHeight;
  }

  scrollToBottom();
}

initializeChat();

// ========================================
// FUNCIONALIDAD DEL MODAL DE PERFIL
// ========================================
async function viewProfile(perfilId) {
  console.log("viewProfile() llamado con perfilId:", perfilId);

  try {
    // Ocultar el grid de usuarios
    const descubrirView = document.getElementById("descubrirView");
    const perfSectionView = document.getElementById("perfilSeccionView");
    const favoritosView = document.getElementById("favoritosView");

    if (!perfSectionView) {
      console.error("No existe el elemento perfilSeccionView");
      return;
    }

    // Integración SPA: ocultar/limpiar otras vistas y marcar la sección de perfil como activa
    document
      .querySelectorAll(".view-section")
      .forEach((v) => v.classList.remove("active"));

    if (descubrirView) descubrirView.style.display = "none";
    if (favoritosView) favoritosView.classList.remove("active");

    // Mostrar vista de perfil correctamente
    perfSectionView.style.display = "block";
    perfSectionView.classList.add("active");
    perfSectionView.classList.add("animate-slideIn");

    // Cargar contenido del perfil (reemplaza el contenido anterior)
    await cargarPerfilEnSeccion(perfilId);

    // El nuevo componente React ya incluye el botón de reportar,
    // así que no necesitamos agregar uno adicional aquí.

    // Asegurar que la UI muestre la parte superior del perfil
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  } catch (error) {
    console.error("Error al mostrar perfil:", error);
  }
}

function volverAlGrid() {
  const descubrirView = document.getElementById("descubrirView");
  const perfSectionView = document.getElementById("perfilSeccionView");

  if (descubrirView && perfSectionView) {
    perfSectionView.style.display = "none";
    descubrirView.style.display = "block";

    // Scroll al Descubrir
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Exponer funciones globalmente para el componente React de perfil
window.volverAlGrid = volverAlGrid;

async function cargarPerfilEnSeccion(perfilId) {
  const container = document.getElementById("perfilSeccionContent");

  // ========================================
  // USAR NUEVO PERFIL REACT SI ESTÁ DISPONIBLE
  // ========================================
  if (typeof window.renderNuevoPerfilUsuario === "function") {
    console.log("🎨 Usando nuevo perfil React para perfilId:", perfilId);

    // NO limpiar el contenedor manualmente - React lo maneja
    // Renderizar el nuevo componente React
    window.renderNuevoPerfilUsuario("perfilSeccionContent", perfilId, {
      onVolver: () => volverAlGrid(),
      onSolicitar: (id, persona) => {
        // El componente React ProfileHeader ahora maneja esto internamente
        // usando window.sendRequest cuando es necesario
        const nombreCompleto = persona
          ? `${persona.nombre_Persona || ""} ${persona.apellido_Persona || ""}`.trim()
          : "Usuario";
        if (typeof sendRequest === "function") {
          sendRequest(id, nombreCompleto);
        }
      },
      onReportar: (id, nombre) => {
        if (typeof reportUser === "function") {
          reportUser(id, nombre);
        }
      },
    });

    return; // Salir de la función, el componente React maneja todo
  }
  // ========================================
  // FIN NUEVO PERFIL REACT
  // ========================================

  // Mostrar loader (código legacy)
  container.innerHTML = `
        <div class="flex items-center justify-center py-20">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
    `;
  try {
    // 1. Obtener datos de la persona
    const resPersonas = await fetch(`${API_BASE}/personas`);
    const dataPersonas = await resPersonas.json();

    if (!resPersonas.ok || !dataPersonas.success) {
      throw new Error("No se pudo obtener los datos del usuario");
    }

    const persona = dataPersonas.data.find(
      (p) => p.id_Perfil_Persona === perfilId,
    );

    if (!persona) {
      throw new Error("Usuario no encontrado");
    }

    // 2. Obtener habilidades
    let habilidadesOfrece = [];
    let habilidadesNecesita = [];
    let todasLasHabilidades = [];

    try {
      const resHabilidades = await fetch(
        `${API_BASE}/habilidades/persona/${perfilId}`,
      );
      const dataHabilidades = await resHabilidades.json();

      if (
        resHabilidades.ok &&
        dataHabilidades.success &&
        dataHabilidades.data
      ) {
        todasLasHabilidades = dataHabilidades.data;
        habilidadesOfrece = dataHabilidades.data.filter(
          (h) => h.tipoEstado_Habilidad === "Ofrece",
        );
        habilidadesNecesita = dataHabilidades.data.filter(
          (h) => h.tipoEstado_Habilidad === "Necesita",
        );
      }
    } catch (e) {
      console.error("Error al cargar habilidades:", e);
    }

    // 3. Obtener categorías
    let categorias = [];
    try {
      const resCategorias = await fetch(`${API_BASE}/categorias`);
      const dataCategorias = await resCategorias.json();
      if (resCategorias.ok && dataCategorias.success && dataCategorias.data) {
        categorias = dataCategorias.data;
      }
    } catch (e) {
      console.error("Error al cargar categorías:", e);
    }

    // 4. Obtener dirección
    let direccion = null;
    try {
      const resDireccion = await fetch(
        `${API_BASE}/direcciones/persona/${perfilId}`,
      );
      if (resDireccion.ok) {
        const dataDireccion = await resDireccion.json();
        if (dataDireccion.success && dataDireccion.data) {
          direccion = Array.isArray(dataDireccion.data)
            ? dataDireccion.data[0]
            : dataDireccion.data;
        }
      }
    } catch (e) {
      console.error("Error al cargar dirección:", e);
    }

    // 5. Preparar las imágenes de la galería
    const galeriaImagenes = [];
    if (persona.imagen1Url_Persona)
      galeriaImagenes.push(persona.imagen1Url_Persona);
    if (persona.imagen2Url_Persona)
      galeriaImagenes.push(persona.imagen2Url_Persona);
    if (persona.imagen3Url_Persona)
      galeriaImagenes.push(persona.imagen3Url_Persona);

    // 6. Formatear ubicación
    let ubicacion = "Sin ubicación";
    if (direccion) {
      const ciudad = direccion.ciudad_Direccion || direccion.ciudad || "";
      const departamento =
        direccion.departamento_Direccion || direccion.departamento || "";
      const pais = direccion.pais_Direccion || direccion.pais || "";
      ubicacion = [ciudad, departamento, pais].filter(Boolean).join(", ");
    }

    // 7. Generar el contenido del modal
    const nombreCompleto =
      `${persona.nombre_Persona || ""} ${persona.apellido_Persona || ""}`.trim();
    const iniciales = `${(persona.nombre_Persona || "U")[0]}${(persona.apellido_Persona || "S")[0]}`;

    container.innerHTML = `
            <div class="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100">

                <!-- Banner y Avatar -->
                <div class="profile-modal-banner">
                    <div class="profile-modal-avatar" style="cursor: ${persona.imagenUrl_Persona ? "zoom-in" : "default"};" ${persona.imagenUrl_Persona ? `onclick="openImageFullscreen('${persona.imagenUrl_Persona}')"` : ""}>
                        ${
                          persona.imagenUrl_Persona
                            ? `<img src="${persona.imagenUrl_Persona}" alt="${nombreCompleto}">`
                            : `<span>${iniciales}</span>`
                        }
                    </div>
                </div>

                <!-- Información del usuario -->
                <div class="profile-modal-info">
                    <h2 class="text-3xl font-bold text-gray-900 mb-1">${nombreCompleto}</h2>
                    <p class="text-blue-600 text-lg font-semibold mb-3">@${persona.nombre_Persona || "usuario"}</p>
                    <div class="profile-location-text flex items-center justify-center gap-2 text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <span>${ubicacion}</span>
                    </div>

                    <div class="profile-modal-section py-6" id="request-button-section">
                        <div class="flex items-center justify-center py-4">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    </div>

                    <!-- Estadísticas -->
                    <div class="profile-stats grid grid-cols-3 gap-4 max-w-2xl mx-auto px-4" id="profile-stats-container">
                        <div class="profile-stat-card p-4 rounded-2xl bg-blue-50/50">
                            <div class="profile-stat-value text-2xl font-bold text-blue-600">${habilidadesOfrece.length}</div>
                            <div class="profile-stat-label text-sm text-gray-500 font-medium">Habilidades</div>
                        </div>
                        <div class="profile-stat-card p-4 rounded-2xl bg-blue-50/50">
                            <div class="profile-stat-value text-2xl font-bold text-blue-600"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div></div>
                            <div class="profile-stat-label text-sm text-gray-500 font-medium">Intercambios</div>
                        </div>
                        <div class="profile-stat-card p-4 rounded-2xl bg-blue-50/50">
                            <div class="profile-stat-value text-2xl font-bold text-blue-600"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div></div>
                            <div class="profile-stat-label text-sm text-gray-500 font-medium">Valoración</div>
                        </div>
                    </div>
                </div>

                <div class="px-6 pb-8">
                    <!-- Descripción -->
                    ${
                      persona.descripcionPerfil_Persona
                        ? `
                    <div class="profile-modal-section border-b border-gray-100 py-8">
                        <h3 class="profile-modal-section-title text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            Sobre mí
                        </h3>
                        <p class="text-gray-700 leading-relaxed text-lg">${persona.descripcionPerfil_Persona}</p>
                    </div>
                    `
                        : ""
                    }

                    <!-- Habilidades que ofrece -->
                    ${
                      habilidadesOfrece.length > 0
                        ? `
                    <div class="profile-modal-section border-b border-gray-100 py-8">
                        <h3 class="profile-modal-section-title text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Habilidades que Ofrezco
                        </h3>
                        <p class="text-sm text-gray-500 mb-4">Estas son las habilidades que ofrece para un intercambio.</p>
                        <div class="skills-container flex flex-wrap gap-3" id="offeredSkillsContainer">
                            ${habilidadesOfrece
                              .map((skill) => {
                                const categoria = categorias.find(
                                  (c) =>
                                    c.id_categorias_Habilidades_Servicios ===
                                    skill.id_categorias_Habilidades_Servicios,
                                );
                                return `<span class="skill-tag-offered px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 font-medium cursor-pointer hover:bg-green-100 transition-colors" onclick='showSkillDetailInModal(${JSON.stringify(skill)}, ${JSON.stringify(categoria)}, "offered")'>${skill.nombre_Habilidad}</span>`;
                              })
                              .join("")}
                        </div>
                        <div id="selectedOfferedDetail" class="mt-4" style="display: none;"></div>
                    </div>
                    `
                        : ""
                    }

                    <!-- Habilidades que necesita -->
                    ${
                      habilidadesNecesita.length > 0
                        ? `
                    <div class="profile-modal-section border-b border-gray-100 py-8">
                        <h3 class="profile-modal-section-title text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            Habilidades que Necesito
                        </h3>
                        <p class="text-sm text-gray-500 mb-4">Busca a otros usuarios con estas habilidades para iniciar un trueque.</p>
                        <div class="skills-container flex flex-wrap gap-3" id="requiredSkillsContainer">
                            ${habilidadesNecesita
                              .map((skill) => {
                                const categoria = categorias.find(
                                  (c) =>
                                    c.id_categorias_Habilidades_Servicios ===
                                    skill.id_categorias_Habilidades_Servicios,
                                );
                                return `<span class="skill-tag-required px-4 py-2 bg-orange-50 text-orange-700 rounded-full border border-orange-100 font-medium cursor-pointer hover:bg-orange-100 transition-colors" onclick='showSkillDetailInModal(${JSON.stringify(skill)}, ${JSON.stringify(categoria)}, "required")'>${skill.nombre_Habilidad}</span>`;
                              })
                              .join("")}
                        </div>
                        <div id="selectedRequiredDetail" class="mt-4" style="display: none;"></div>
                    </div>
                    `
                        : ""
                    }

                    <!-- Galería de imágenes -->
                    ${
                      galeriaImagenes.length > 0
                        ? `
                    <div class="profile-modal-section border-b border-gray-100 py-8">
                        <h3 class="profile-modal-section-title text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Galería
                        </h3>
                        <div class="profile-gallery">
                            ${galeriaImagenes
                              .map(
                                (img) => `
                                <div class="profile-gallery-item" onclick="openImageFullscreen('${img}')">
                                    <img src="${img}" alt="Imagen de galería" onerror="this.parentElement.style.display='none'">
                                </div>
                            `,
                              )
                              .join("")}
                        </div>
                    </div>
                    `
                        : ""
                    }

                    <!-- Sección de Calificaciones y Reseñas -->
                    <div id="calificaciones-section" class="profile-modal-section py-8" style="display: none;">
                        <h3 class="profile-modal-section-title text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#FFD700">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Calificaciones y Reseñas
                        </h3>
                        <div id="calificaciones-content">
                            <div class="flex items-center justify-center py-4">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        `;

    // Cargar estadísticas y calificaciones
    await cargarEstadisticasYCalificaciones(perfilId);

    // Verificar si existe una solicitud activa
    await verificarYMostrarBotonSolicitud(perfilId, nombreCompleto);
  } catch (error) {
    console.error("Error al cargar el perfil:", error);
    container.innerHTML = `
            <div class="p-12 text-center">
                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Error al cargar el perfil</h3>
                <p class="text-gray-600 mb-4">${error.message}</p>
            </div>
        `;
  }
}

// Funciones para abrir el perfil en un modal desde el chat (duplicado del renderer del perfil)
// Abre el modal reutilizando el contenedor #profileModalContent
async function openChatProfileModal(perfilId) {
  try {
    const modal = document.getElementById("profileModal");
    const content = document.getElementById("profileModalContent");
    if (!modal || !content) {
      console.error("El modal de perfil no existe en el DOM");
      // Fallback: llamar a la vista completa
      viewProfile(perfilId);
      return;
    }

    // Mostrar modal y bloquear scroll de fondo
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Mostrar loader
    content.innerHTML = `
                    <div class="flex items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                `;

    // Cargar contenido del perfil dentro del modal
    await cargarPerfilEnModal(perfilId);
  } catch (err) {
    console.error("Error abriendo modal de chat:", err);
    // Fallback: mostrar la vista clásica
    viewProfile(perfilId);
  }
}

// Carga el perfil y renderiza dentro de #profileModalContent (para uso en chat)
async function cargarPerfilEnModal(perfilId) {
  const container = document.getElementById("profileModalContent");
  if (!container) return;

  // Mostrar loader
  container.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>
            `;

  try {
    // 1. Obtener datos de la persona
    const resPersonas = await fetch(`${API_BASE}/personas`);
    const dataPersonas = await resPersonas.json();

    if (!resPersonas.ok || !dataPersonas.success) {
      throw new Error("No se pudo obtener los datos del usuario");
    }

    const persona = dataPersonas.data.find(
      (p) => p.id_Perfil_Persona === perfilId,
    );

    if (!persona) {
      throw new Error("Usuario no encontrado");
    }

    // 2. Obtener habilidades
    let habilidadesOfrece = [];
    let habilidadesNecesita = [];
    let todasLasHabilidades = [];

    try {
      const resHabilidades = await fetch(
        `${API_BASE}/habilidades/persona/${perfilId}`,
      );
      const dataHabilidades = await resHabilidades.json();

      if (
        resHabilidades.ok &&
        dataHabilidades.success &&
        dataHabilidades.data
      ) {
        todasLasHabilidades = dataHabilidades.data;
        habilidadesOfrece = dataHabilidades.data.filter(
          (h) => h.tipoEstado_Habilidad === "Ofrece",
        );
        habilidadesNecesita = dataHabilidades.data.filter(
          (h) => h.tipoEstado_Habilidad === "Necesita",
        );
      }
    } catch (e) {
      console.error("Error al cargar habilidades:", e);
    }

    // 3. Obtener categorías
    let categorias = [];
    try {
      const resCategorias = await fetch(`${API_BASE}/categorias`);
      const dataCategorias = await resCategorias.json();
      if (resCategorias.ok && dataCategorias.success && dataCategorias.data) {
        categorias = dataCategorias.data;
      }
    } catch (e) {
      console.error("Error al cargar categorías:", e);
    }

    // 4. Obtener dirección
    let direccion = null;
    try {
      const resDireccion = await fetch(
        `${API_BASE}/direcciones/persona/${perfilId}`,
      );
      if (resDireccion.ok) {
        const dataDireccion = await resDireccion.json();
        if (dataDireccion.success && dataDireccion.data) {
          direccion = Array.isArray(dataDireccion.data)
            ? dataDireccion.data[0]
            : dataDireccion.data;
        }
      }
    } catch (e) {
      console.error("Error al cargar dirección:", e);
    }

    // 5. Preparar las imágenes de la galería
    const galeriaImagenes = [];
    if (persona.imagen1Url_Persona)
      galeriaImagenes.push(persona.imagen1Url_Persona);
    if (persona.imagen2Url_Persona)
      galeriaImagenes.push(persona.imagen2Url_Persona);
    if (persona.imagen3Url_Persona)
      galeriaImagenes.push(persona.imagen3Url_Persona);

    // 6. Formatear ubicación
    let ubicacion = "Sin ubicación";
    if (direccion) {
      const ciudad = direccion.ciudad_Direccion || direccion.ciudad || "";
      const departamento =
        direccion.departamento_Direccion || direccion.departamento || "";
      const pais = direccion.pais_Direccion || direccion.pais || "";
      ubicacion = [ciudad, departamento, pais].filter(Boolean).join(", ");
    }

    // 7. Generar el contenido del modal (duplicando la estructura del perfil)
    const nombreCompleto =
      `${persona.nombre_Persona || ""} ${persona.apellido_Persona || ""}`.trim();
    const iniciales = `${(persona.nombre_Persona || "U")[0]}${(persona.apellido_Persona || "S")[0]}`;

    container.innerHTML = `
            <!-- Banner y Avatar -->
            <div class="profile-modal-banner">
                <div class="profile-modal-avatar" style="cursor: ${persona.imagenUrl_Persona ? "zoom-in" : "default"};" ${persona.imagenUrl_Persona ? `onclick="openImageFullscreen('${persona.imagenUrl_Persona}')"` : ""}>
                    ${
                      persona.imagenUrl_Persona
                        ? `<img src="${persona.imagenUrl_Persona}" alt="${nombreCompleto}">`
                        : `<span>${iniciales}</span>`
                    }
                </div>
            </div>

            <!-- Información del usuario -->
            <div class="profile-modal-info">
                <h2 class="text-2xl font-bold text-gray-900 mb-1">${nombreCompleto}</h2>
                <p class="text-blue-600 font-semibold mb-2">@${persona.nombre_Persona || "usuario"}</p>
                <div class="profile-location-text">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>${ubicacion}</span>
                </div>
                <div class="profile-modal-section" id="request-button-section">
                    <div class="flex items-center justify-center py-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </div>
                <!-- Estadísticas -->
                <div class="profile-stats" id="profile-stats-container">
                    <div class="profile-stat-card">
                        <div class="profile-stat-value">${habilidadesOfrece.length}</div>
                        <div class="profile-stat-label">Habilidades</div>
                    </div>
                    <div class="profile-stat-card">
                        <div class="profile-stat-value"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div></div>
                        <div class="profile-stat-label">Intercambios</div>
                    </div>
                    <div class="profile-stat-card">
                        <div class="profile-stat-value"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div></div>
                        <div class="profile-stat-label">Valoración</div>
                    </div>
                </div>
            </div>

            <!-- Descripción -->
            ${
              persona.descripcionPerfil_Persona
                ? `
            <div class="profile-modal-section">
                <h3 class="profile-modal-section-title">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Sobre mí
                </h3>
                <p class="text-gray-700 leading-relaxed">${persona.descripcionPerfil_Persona}</p>
            </div>
            `
                : ""
            }

            <!-- Habilidades que ofrece -->
            ${
              habilidadesOfrece.length > 0
                ? `
            <div class="profile-modal-section">
                <h3 class="profile-modal-section-title">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Habilidades que Ofrezco
                </h3>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">Estas son las habilidades que ofrece para un intercambio.</p>
                <div class="skills-container" id="offeredSkillsContainer">
                    ${habilidadesOfrece
                      .map((skill) => {
                        const categoria = categorias.find(
                          (c) =>
                            c.id_categorias_Habilidades_Servicios ===
                            skill.id_categorias_Habilidades_Servicios,
                        );
                        return `<span class="skill-tag-offered" onclick='showSkillDetailInModal(${JSON.stringify(skill)}, ${JSON.stringify(categoria)}, "offered")'>${skill.nombre_Habilidad}</span>`;
                      })
                      .join("")}
                </div>
                <div id="selectedOfferedDetail" style="display: none;"></div>
            </div>
            `
                : ""
            }

            <!-- Habilidades que necesita -->
            ${
              habilidadesNecesita.length > 0
                ? `
            <div class="profile-modal-section">
                <h3 class="profile-modal-section-title">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Habilidades que Necesito
                </h3>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 12px;">Busca a otros usuarios con estas habilidades para iniciar un trueque.</p>
                <div class="skills-container" id="requiredSkillsContainer">
                    ${habilidadesNecesita
                      .map((skill) => {
                        const categoria = categorias.find(
                          (c) =>
                            c.id_categorias_Habilidades_Servicios ===
                            skill.id_categorias_Habilidades_Servicios,
                        );
                        return `<span class="skill-tag-required" onclick='showSkillDetailInModal(${JSON.stringify(skill)}, ${JSON.stringify(categoria)}, "required")'>${skill.nombre_Habilidad}</span>`;
                      })
                      .join("")}
                </div>
                <div id="selectedRequiredDetail" style="display: none;"></div>
            </div>
            `
                : ""
            }

            <!-- Galería de imágenes -->
            ${
              galeriaImagenes.length > 0
                ? `
            <div class="profile-modal-section">
                <h3 class="profile-modal-section-title">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Galería
                </h3>
                <div class="profile-gallery">
                    ${galeriaImagenes
                      .map(
                        (img) => `
                        <div class="profile-gallery-item" onclick="openImageFullscreen('${img}')">
                            <img src="${img}" alt="Imagen de galería" onerror="this.parentElement.style.display='none'">
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            `
                : ""
            }

            <!-- Sección de Calificaciones y Reseñas -->
            <div id="calificaciones-section" class="profile-modal-section" style="display: none;">
                <h3 class="profile-modal-section-title">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#FFD700" stroke="#FFD700" stroke-width="1" style="display: inline-block; margin: 0 4px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
                    Calificaciones y Reseñas
                </h3>
                <div id="calificaciones-content">
                    <div class="flex items-center justify-center py-4">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                    </div>
                </div>
            </div>

        `;

    // Cargar estadísticas y calificaciones y mostrar botones
    await cargarEstadisticasYCalificaciones(perfilId);
    await verificarYMostrarBotonSolicitud(perfilId, nombreCompleto);
  } catch (error) {
    console.error("Error al cargar el perfil en modal:", error);
    container.innerHTML = `
                    <div class="p-12 text-center">
                        <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Error al cargar el perfil</h3>
                        <p class="text-gray-600 mb-4">${error.message}</p>
                    </div>
                `;
  }
}

// Cargar estadísticas y calificaciones del usuario
async function cargarEstadisticasYCalificaciones(perfilId) {
  try {
    // 1. Obtener estadísticas
    const resEstadisticas = await fetch(
      `${API_BASE}/intercambios/estadisticas/${perfilId}`,
    );
    const dataEstadisticas = await resEstadisticas.json();

    let estadisticas = {
      total_intercambios_completados: 0,
      promedio_calificacion: 0,
      total_calificaciones: 0,
      distribucion_estrellas_5: 0,
      distribucion_estrellas_4: 0,
      distribucion_estrellas_3: 0,
      distribucion_estrellas_2: 0,
      distribucion_estrellas_1: 0,
    };

    if (
      resEstadisticas.ok &&
      dataEstadisticas.success &&
      dataEstadisticas.data
    ) {
      estadisticas = dataEstadisticas.data;
    }

    // 2. Actualizar estadísticas en el perfil
    const statsContainer = document.getElementById("profile-stats-container");
    if (statsContainer) {
      const habilidadesCount = statsContainer.querySelector(
        ".profile-stat-card:first-child .profile-stat-value",
      ).textContent;
      statsContainer.innerHTML = `
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${habilidadesCount}</div>
                    <div class="profile-stat-label">Habilidades</div>
                </div>
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${estadisticas.total_intercambios_completados || 0}</div>
                    <div class="profile-stat-label">Intercambios</div>
                </div>
                <div class="profile-stat-card">
                    <div class="profile-stat-value">
                        ${
                          estadisticas.promedio_calificacion > 0
                            ? `<div class="flex items-center justify-center space-x-1">
                                <span>${estadisticas.promedio_calificacion.toFixed(1)}</span>
                                <svg class="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                </svg>
                            </div>`
                            : '<span class="text-gray-400 text-sm">Sin calificar</span>'
                        }
                    </div>
                    <div class="profile-stat-label">Valoración</div>
                </div>
            `;
    }

    // 3. Si no tiene calificaciones, ocultar la sección
    if (estadisticas.total_calificaciones === 0) {
      document.getElementById("calificaciones-section").style.display = "none";
      return;
    }

    // 4. Obtener calificaciones con comentarios
    const resCalificaciones = await fetch(
      `${API_BASE}/intercambios/calificaciones/${perfilId}`,
    );
    const dataCalificaciones = await resCalificaciones.json();

    let calificaciones = [];
    if (
      resCalificaciones.ok &&
      dataCalificaciones.success &&
      dataCalificaciones.data
    ) {
      calificaciones = dataCalificaciones.data.filter((cal) => cal.visible);
    }

    // Cargar respuestas para cada calificación (si existen)
    for (let i = 0; i < calificaciones.length; i++) {
      const cal = calificaciones[i];
      // normalizar posibles nombres de id
      const calId =
        cal.id_Calificacion ??
        cal.id_calificacion ??
        cal.id ??
        cal.idCalificacion ??
        null;
      if (!calId) continue;
      try {
        const resRespuestas = await fetch(
          `${API_BASE}/respuestas-resenia/por-resena/${calId}`,
        );
        if (resRespuestas.ok) {
          const dataRespuestas = await resRespuestas.json();
          if (
            dataRespuestas.success &&
            dataRespuestas.data &&
            dataRespuestas.data.length > 0
          ) {
            cal.respuesta_del_dueno = dataRespuestas.data[0].respuesta || "";
            cal.id_respuesta = dataRespuestas.data[0].id_respuesta;
            cal.fecha_respuesta =
              dataRespuestas.data[0].fecha_creacion ||
              dataRespuestas.data[0].fecha_respuesta ||
              new Date().toISOString();
          }
        }
      } catch (err) {
        console.debug("No hay respuesta para la reseña id:", calId, err);
      }
    }

    // 5. Mostrar la sección de calificaciones
    const calificacionesSection = document.getElementById(
      "calificaciones-section",
    );
    const calificacionesContent = document.getElementById(
      "calificaciones-content",
    );

    calificacionesSection.style.display = "block";

    // 6. Generar el HTML de calificaciones
    const promedioCalificacion = estadisticas.promedio_calificacion || 0;
    const totalCalificaciones = estadisticas.total_calificaciones || 0;

    calificacionesContent.innerHTML = `
            <!-- Resumen de calificaciones -->
           <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF9C3 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <div class="flex items-center space-x-2 mb-1">
                            <span style="font-size: 48px; font-weight: 700; color: #92400e;">${promedioCalificacion.toFixed(1)}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#FFD700" stroke="#FFD700" stroke-width="1" style="display: inline-block; margin: 0 4px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
                        </div>
                        <p style="color: #92400e; font-size: 14px; font-weight: 600;"> calificación${totalCalificaciones !== 1 ? "es" : ""}</p>
                    </div>
                    <div style="flex: 1; max-width: 300px; margin-left: 32px;">
                        ${[5, 4, 3, 2, 1]
                          .map((star) => {
                            const count =
                              estadisticas[`distribucion_estrellas_${star}`] ||
                              0;
                            const percentage =
                              totalCalificaciones > 0
                                ? ((count / totalCalificaciones) * 100).toFixed(
                                    0,
                                  )
                                : 0;
                            return `
                            <div class="flex items-center space-x-2 mb-1">
                                <span style="color: #92400e; font-size: 12px; font-weight: 600; width: 50px; display: flex; align-items: center; gap: 4px;">
                                    ${star}
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#FFD700" stroke="#FFD700" stroke-width="1" style="display: inline-block; margin: 0 4px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
                                    </span>
                                <div style="flex: 1; background: rgba(146, 64, 14, 0.2); border-radius: 9999px; height: 8px; overflow: hidden;">
                                    <div style="background: #f59e0b; height: 100%; width: ${percentage}%; transition: width 0.3s;"></div>
                                </div>
                                <span style="color: #92400e; font-size: 12px; width: 35px; text-align: right;">${count}</span>
                            </div>`;
                          })
                          .join("")}
                    </div>
                </div>
            </div>

            <!-- Lista de comentarios -->
            ${
              calificaciones.length > 0
                ? `
                <h4 style="font-size: 16px; font-weight: 700; color: #1f2937; margin-bottom: 16px;">
                    Comentarios de Usuarios (${calificaciones.length})
                </h4>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${calificaciones
                      .map((cal) => {
                        const nombreCalificador =
                          `${cal.nombre_calificador || ""} ${cal.apellido_calificador || ""}`.trim();
                        const iniciales = `${(cal.nombre_calificador || "U")[0]}${(cal.apellido_calificador || "S")[0]}`;
                        const fechaFormateada = new Date(
                          cal.fecha_calificacion,
                        ).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        });

                        return `
                            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; gap: 12px;">
                                <!-- Avatar del calificador -->
                                <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; flex-shrink: 0; overflow: hidden; position: relative;">
                                    ${
                                      getImagenCalificador(cal)
                                        ? `<img src="${getImagenCalificador(cal)}" alt="${nombreCalificador}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">`
                                        : `<span style="font-size: 20px;">${iniciales}</span>`
                                    }
                                </div>

                                <!-- Contenido de la reseña -->
                                <div style="flex: 1; min-width: 0;">
                                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap;">
                                        <div>
                                            <p style="font-weight: 600; color: #1f2937; font-size: 14px; margin: 0;">${nombreCalificador}</p>
                                            <p style="color: #6b7280; font-size: 12px; margin: 2px 0 0 0;">${fechaFormateada}</p>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 4px; color: #fbbf24;">
                                            ${Array(Math.round(cal.puntuacion))
                                              .fill(0)
                                              .map(
                                                () => `
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: inline-block;">
                                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                                                </svg>
                                            `,
                                              )
                                              .join("")}
                                        </div>
                                    </div>
                                    ${
                                      cal.comentario
                                        ? `
                                        <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 8px 0 0 0;">
                                            "${cal.comentario}"
                                        </p>
                                    `
                                        : ""
                                    }
                                    ${
                                      cal.respuesta_del_dueno
                                        ? `
                                        <div style="margin-top:12px; padding:12px; background:#f0f9ff; border-left:4px solid #2563eb; border-radius:6px;">
                                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:600; color:#1f2937; font-size:13px;">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor" style="color: #2563eb;">
                                                    <path d="M3 6a3 3 0 013-3h10a1 1 0 01.82.055l.487.979A2 2 0 0116 6v10a3 3 0 01-3 3H6a3 3 0 01-3-3V6z"/>
                                                </svg>
                                                <span>Respuesta</span>
                                            </div>
                                            <p style="color:#374151; margin:0;">"${cal.respuesta_del_dueno}"</p>
                                            <p style="color:#9ca3af; font-size:12px; margin-top:8px;">Respondido ${new Date(cal.fecha_respuesta).toLocaleDateString("es-ES")}</p>
                                        </div>
                                    `
                                        : ""
                                    }
                                </div>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
            `
                : `
                <p style="text-align: center; color: #6b7280; font-size: 14px; padding: 24px;">
                    Este usuario aún no tiene comentarios escritos.
                </p>
            `
            }
        `;
  } catch (error) {
    console.error("Error al cargar estadísticas y calificaciones:", error);
    document.getElementById("calificaciones-section").style.display = "none";
  }
}

// Función auxiliar para obtener la imagen del calificador
function getImagenCalificador(cal) {
  // Intenta varios nombres de campos posibles
  const posiblesNombres = [
    cal.imagenUrl_calificador,
    cal.imagen_calificador,
    cal.foto_calificador,
    cal.urlFoto,
    cal.imagenUrl_Persona_calificador,
    cal.imagen_Persona_calificador,
    cal.fotoPerfil_calificador,
    cal.imagenPerfil_calificador,
  ];

  // Retorna la primera que tenga valor
  return (
    posiblesNombres.find((nombre) => nombre && nombre.trim() !== "") || null
  );
}

// Verificar si existe solicitud y mostrar el botón correspondiente
async function verificarYMostrarBotonSolicitud(perfilId, nombreCompleto) {
  const buttonSection = document.getElementById("request-button-section");

  try {
    // Intentar usar la variable global primero
    let miPerfilId = miPerfilIdGlobal;

    // Si no está en la variable global, intentar obtenerla
    if (!miPerfilId) {
      console.log("Variable global no disponible, obteniendo del servidor...");
      miPerfilId = await obtenerPersonaIdActual();
    }

    // Si aún no tenemos el ID, esperar y reintentar
    if (!miPerfilId) {
      console.log("No se pudo obtener el ID, esperando y reintentando...");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      miPerfilId = miPerfilIdGlobal || (await obtenerPersonaIdActual());
    }

    if (!miPerfilId) {
      console.error("No se pudo obtener el ID del usuario actual");
      buttonSection.innerHTML = `
                        <div class="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
                            <p class="text-yellow-800 font-semibold">Inicia sesión para enviar solicitudes de intercambio</p>
                        </div>
                    `;
      return;
    }

    console.log("Mi perfil ID:", miPerfilId, "Perfil a verificar:", perfilId);

    // Verificar si existe una solicitud activa
    const resVerificar = await fetch(
      `${API_BASE}/solicitudes-intercambio/verificar/${miPerfilId}/${perfilId}`,
    );
    const dataVerificar = await resVerificar.json();

    if (!resVerificar.ok || !dataVerificar.success) {
      throw new Error("Error al verificar solicitud");
    }

    if (dataVerificar.existeSolicitud) {
      // Ya existe una solicitud - mostrar mensaje informativo
      const solicitud = dataVerificar.solicitud;
      let iconoHTML = "";
      let colorClase = "";
      let mensajeTexto = solicitud.mensaje;

      if (solicitud.estado === "Aceptada") {
        iconoHTML =
          '<span class="iconify text-green-600" data-icon="mdi:check-circle" data-width="24"></span>';
        colorClase = "bg-green-50 border-green-200 text-green-800";
      } else if (solicitud.esMiSolicitud) {
        iconoHTML =
          '<span class="iconify text-blue-600" data-icon="mdi:clock-outline" data-width="24"></span>';
        colorClase = "bg-blue-50 border-blue-200 text-blue-800";
      } else {
        iconoHTML =
          '<span class="iconify text-purple-600" data-icon="mdi:email-outline" data-width="24"></span>';
        colorClase = "bg-purple-50 border-purple-200 text-purple-800";
      }

      buttonSection.innerHTML = `
                        <div class="p-4 ${colorClase} border-2 rounded-lg flex items-center space-x-3">
                            ${iconoHTML}
                            <div class="flex-1">
                                <p class="font-semibold">${mensajeTexto}</p>
                                ${
                                  solicitud.estado === "Pendiente" &&
                                  !solicitud.esMiSolicitud
                                    ? '<p class="text-sm mt-1">Ve a la sección de notificaciones para responder.</p>'
                                    : ""
                                }
                            </div>
                        </div>
                    `;
    } else {
      // No existe solicitud - mostrar botón para enviar
      buttonSection.innerHTML = `
                        <button onclick="sendRequest(${perfilId}, '${nombreCompleto}')" class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg flex items-center justify-center space-x-2">
                            <span class="iconify" data-icon="mdi:hand-heart" data-width="20"></span>
                            <span>${t("requestModal.sendExchangeRequest")}</span>
                        </button>
                    `;
    }
  } catch (error) {
    console.error("Error al verificar solicitud:", error);
    // En caso de error, mostrar botón por defecto
    buttonSection.innerHTML = `
                    <button onclick="sendRequest(${perfilId}, '${nombreCompleto}')" class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg">
                        ${t("requestModal.sendExchangeRequest")}
                    </button>
                `;
  }
}

// Exponer funciones globalmente para el componente React
window.verificarYMostrarBotonSolicitud = verificarYMostrarBotonSolicitud;
window.sendRequest = sendRequest;
window.obtenerPersonaIdActual = obtenerPersonaIdActual;
// La variable miPerfilIdGlobal ya debería estar accesible pero la exponemos explícitamente
window.miPerfilIdGlobal = miPerfilIdGlobal;

function closeProfileModal() {
  const modal = document.getElementById("profileModal");
  if (!modal) return;

  modal.style.display = "none";
  // Restaurar scroll del body (en caso de haberse bloqueado al abrir el modal)
  try {
    document.body.style.overflow = "";
  } catch (e) {
    console.warn("No se pudo restaurar overflow del body:", e);
  }

  // Limpiar contenido si existe (evita mantener grandes nodos en memoria)
  const content = document.getElementById("profileModalContent");
  if (content) {
    content.innerHTML = `
                    <div class="flex items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                `;
  }
}

// Cerrar modal al hacer clic fuera de él
document.getElementById("profileModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeProfileModal();
  }
});

// ========================================
// FUNCIONALIDAD DE IMAGEN FULLSCREEN
// ========================================
function openImageFullscreen(imageUrl) {
  const modal = document.getElementById("imageFullscreenModal");
  const img = document.getElementById("fullscreenImage");

  img.src = imageUrl;
  modal.style.display = "flex";

  // Prevenir scroll del body
  document.body.style.overflow = "hidden";
}

function closeImageFullscreen(event) {
  if (event) {
    event.stopPropagation();
  }

  const modal = document.getElementById("imageFullscreenModal");
  modal.style.display = "none";

  // Restaurar scroll del body
  document.body.style.overflow = "";
}

// Prevenir que el click en la imagen cierre el modal
document
  .getElementById("fullscreenImage")
  ?.addEventListener("click", function (e) {
    e.stopPropagation();
  });

// ========================================
// FUNCIONALIDAD DE DETALLE DE HABILIDAD (igual que en perfil.html)
// ========================================
function showSkillDetailInModal(skill, categoria, type) {
  const detailId =
    type === "offered" ? "selectedOfferedDetail" : "selectedRequiredDetail";
  const detailDiv = document.getElementById(detailId);

  if (!detailDiv) return;

  const categoryName = categoria ? categoria.nombre_categoria : null;

  detailDiv.innerHTML = `
                <div class="skill-detail-card">
                    <p class="skill-detail-title">${skill.nombre_Habilidad}</p>
                    ${
                      categoryName
                        ? `
                        <p style="font-size: 13px; color: #94a3b8; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            ${categoryName}
                        </p>
                    `
                        : ""
                    }
                    <p class="skill-detail-text">${skill.descripcion_Habilidad || "Sin descripción."}</p>
                </div>
            `;
  detailDiv.style.display = "block";
}

// ========================================
// SISTEMA DE SOLICITUDES DE INTERCAMBIO
// ========================================

// Función para obtener el ID_Persona del usuario actual
async function obtenerPersonaIdActual() {
  if (usuarioActualPersonaId) {
    return usuarioActualPersonaId;
  }

  try {
    // Intentar con ambos nombres de clave por compatibilidad
    const usuarioId =
      localStorage.getItem("id_usuario") || localStorage.getItem("usuarioId");

    if (!usuarioId) {
      console.error("No hay usuario logueado");
      return null;
    }

    const response = await fetch(
      `${API_BASE}/personas/by-usuario/${usuarioId}`,
    );
    const data = await response.json();

    console.log(" Respuesta de /personas/by-usuario:", data);

    // Verificar estructura de respuesta (primero la anidada que es la correcta)
    if (data.success && data.data && data.data.id_Perfil_Persona) {
      usuarioActualPersonaId = data.data.id_Perfil_Persona;
      miPerfilIdGlobal = data.data.id_Perfil_Persona; // Guardar en variable global
      console.log(" id_Perfil_Persona obtenido:", usuarioActualPersonaId);
      return usuarioActualPersonaId;
    } else if (data && data.id_Perfil_Persona) {
      usuarioActualPersonaId = data.id_Perfil_Persona;
      miPerfilIdGlobal = data.id_Perfil_Persona; // Guardar en variable global
      console.log(" id_Perfil_Persona obtenido:", usuarioActualPersonaId);
      return usuarioActualPersonaId;
    }

    console.error(" No se pudo extraer id_Perfil_Persona de la respuesta");
    return null;
  } catch (error) {
    console.error("Error al obtener id_Perfil_Persona:", error);
    return null;
  }
}

// Enviar solicitud de intercambio
async function sendRequest(receptorId, nombreReceptor) {
  try {
    // Cerrar el modal del perfil si está abierto
    const profileModal = document.getElementById("profileModal");
    if (profileModal && profileModal.style.display !== "none") {
      closeProfileModal();
    }

    const solicitanteId = await obtenerPersonaIdActual();

    if (!solicitanteId) {
      Toast.error("Error", "No se pudo identificar al usuario actual");
      return;
    }

    // Mostrar formulario detallado de solicitud
    await mostrarFormularioSolicitudDetallada(
      solicitanteId,
      receptorId,
      nombreReceptor,
    );
  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    Toast.error("Error", "Ocurrió un error al procesar la solicitud");
  }
}

// Reportar usuario: abre modal para motivo + descripción y envía POST a /api/reportes
async function reportUser(reportedId, reportedName) {
  try {
    // Obtener id de cuenta (id_usuario) del reportante preferentemente desde localStorage
    let reporterUserId =
      localStorage.getItem("id_usuario") ||
      localStorage.getItem("usuarioId") ||
      null;
    if (reporterUserId) reporterUserId = Number(reporterUserId);

    // Si no hay id_usuario en localStorage intentar resolver desde el perfil (id_Perfil_Persona)
    if (!reporterUserId) {
      const reporterPersonaId = await obtenerPersonaIdActual();
      if (!reporterPersonaId) {
        Swal.fire({
          icon: "warning",
          title: "Inicia sesión",
          text: "Debes iniciar sesión para poder reportar usuarios.",
          confirmButtonColor: "#3b82f6",
        });
        return;
      }
      try {
        const r2 = await fetch(
          `${API_BASE}/personas/perfil-usuario/${reporterPersonaId}`,
        );
        if (r2.ok) {
          const j2 = await r2.json();
          if (j2 && j2.data && j2.data.id_Usuario)
            reporterUserId = Number(j2.data.id_Usuario);
          else if (j2 && j2.id_Usuario) reporterUserId = Number(j2.id_Usuario);
        }
      } catch (err) {
        console.warn(
          "No se pudo resolver id_Usuario desde id_Perfil_Persona del reportero:",
          err,
        );
      }
    }

    if (!reporterUserId) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "No se pudo identificar la cuenta del reportante.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    // Intentar resolver id_perfil_persona del usuario reportado
    let personaId = null;
    // Resolver id_perfil_persona y id_usuario del usuario reportado
    let reportedUserAccountId = null;
    try {
      const r = await fetch(`${API_BASE}/personas/by-usuario/${reportedId}`);
      if (r.ok) {
        const j = await r.json();
        const d = j.data || j;
        personaId =
          d.id_Perfil_Persona ||
          d.id_perfil_persona ||
          d.idPerfilPersona ||
          null;
        // Si la llamada fue por usuario, reportedId ya es account id
        reportedUserAccountId = Number(reportedId);
      } else if (r.status === 404) {
        // Si no existe persona por usuario, quizá reportedId es id_Perfil_Persona
        personaId = Number(reportedId) || null;
        // Intentar resolver el id_Usuario desde el id_Perfil_Persona
        if (personaId) {
          try {
            const r3 = await fetch(
              `${API_BASE}/personas/perfil-usuario/${personaId}`,
            );
            if (r3.ok) {
              const j3 = await r3.json();
              const dd = j3.data || j3;
              reportedUserAccountId = dd.id_Usuario || dd.id_usuario || null;
              if (reportedUserAccountId)
                reportedUserAccountId = Number(reportedUserAccountId);
            }
          } catch (err) {
            console.warn(
              "No se pudo resolver id_Usuario desde id_Perfil_Persona reportado:",
              err,
            );
          }
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener persona del usuario reportado:", err);
    }

    if (!personaId) personaId = null;

    if (!reportedUserAccountId) {
      Swal.fire({
        icon: "error",
        title: "Usuario no encontrado",
        text: "No se pudo identificar la cuenta del usuario reportado. No se enviará el reporte.",
        confirmButtonColor: "#3b82f6",
      });
      return;
    }

    const motivos = {
      Spam: "Spam o publicidad no deseada",
      Abuso: "Abuso, acoso o lenguaje ofensivo",
      "Contenido inapropiado": "Contenido sexual o inapropiado",
      Suplantación: "Suplantación de identidad",
      Otro: "Otro motivo",
    };

    const { value: formValues } = await Swal.fire({
      title: `Reportar a ${escapeHtml(reportedName)}`,
      html:
        `
                        <div style="text-align:left; margin-bottom:8px; color:#374151;">
                            <p style="margin:0 0 6px 0; font-size:14px;">Por favor, selecciona el motivo del reporte y agrega una descripción si crees que es necesaria. Nuestro equipo revisará el caso.</p>
                        </div>
                        <div style="margin-top:6px; text-align:left;">
                            <label for="swal-motivo" style="display:block; font-weight:600; margin-bottom:6px;">Motivo</label>
                            <select id="swal-motivo" style="width:100%; padding:10px; border-radius:8px; border:1px solid #d1d5db; font-size:14px;">\n` +
        Object.keys(motivos)
          .map((k) => `<option value="${k}">${motivos[k]}</option>`)
          .join("") +
        `</select>
                        </div>
                        <div style="margin-top:12px; text-align:left;">
                            <label for="swal-descripcion" style="display:block; font-weight:600; margin-bottom:6px;">Descripción adicional <span style=\"font-weight:400; font-size:12px; color:#6b7280;\">(opcional)</span></label>
                            <textarea id="swal-descripcion" rows="5" maxlength="500" placeholder="Añade más contexto: qué pasó, enlaces, capturas o mensajes relevantes (máx. 500 caracteres)" style="width:100%; padding:10px; border-radius:8px; border:1px solid #d1d5db; resize:vertical; font-size:14px;"></textarea>
                            <div id="swal-charcount" style="text-align:right; font-size:12px; color:#6b7280; margin-top:6px;">0/500</div>
                        </div>
                    `,
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonText: "Enviar reporte",
      confirmButtonColor: "#f59e0b",
      focusConfirm: false,
      allowOutsideClick: false,
      didOpen: () => {
        const ta = Swal.getPopup().querySelector("#swal-descripcion");
        const countEl = Swal.getPopup().querySelector("#swal-charcount");
        if (ta && countEl) {
          const update = () => {
            countEl.textContent = `${ta.value.length}/500`;
          };
          ta.addEventListener("input", update);
          update();
        }
      },
      preConfirm: () => {
        const motivoEl = Swal.getPopup().querySelector("#swal-motivo");
        const descEl = Swal.getPopup().querySelector("#swal-descripcion");
        const motivo = motivoEl ? motivoEl.value : "";
        const descripcion = descEl ? descEl.value.trim() : "";
        if (!motivo) {
          Swal.showValidationMessage("Selecciona un motivo para el reporte");
          return false;
        }
        if (descripcion.length > 500) {
          Swal.showValidationMessage(
            "La descripción excede los 500 caracteres",
          );
          return false;
        }
        return { motivo, descripcion };
      },
    });

    if (!formValues) return; // cancelado

    // Enviar POST al backend
    const payload = {
      reporter_id: reporterUserId,
      reported_user_id: reportedUserAccountId,
      id_perfil_persona: personaId,
      motivo_descripcion: formValues.motivo,
      descripcion: formValues.descripcion || null,
    };

    const resp = await fetch(`${API_BASE}/reportes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (resp.ok) {
      const json = await resp.json();
      Swal.fire({
        icon: "success",
        title: "Reporte enviado",
        text: json.mensaje || "Tu reporte ha sido enviado correctamente.",
        confirmButtonColor: "#3b82f6",
      });
    } else {
      const err = await resp.json().catch(() => ({}));
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.error || "No se pudo enviar el reporte.",
        confirmButtonColor: "#3b82f6",
      });
    }
  } catch (error) {
    console.error("Error en reportUser:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error al enviar el reporte.",
      confirmButtonColor: "#3b82f6",
    });
  }
}

// NUEVA FUNCIÓN: Formulario detallado de solicitud
// Exponer reportUser globalmente para el componente React
window.reportUser = reportUser;

async function mostrarFormularioSolicitudDetallada(
  solicitanteId,
  receptorId,
  nombreReceptor,
) {
  try {
    // Cargar habilidades del solicitante (lo que ofrece)
    const habilidadesOfrecidasResp = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/habilidades/persona/${solicitanteId}`,
    );
    const habilidadesOfrecidasData = await habilidadesOfrecidasResp.json();
    const todasHabilidadesSolicitante = habilidadesOfrecidasData.success
      ? habilidadesOfrecidasData.data
      : [];
    const habilidadesOfrecidas = todasHabilidadesSolicitante.filter(
      (h) => h.tipoEstado_Habilidad === "Ofrece",
    );

    // Cargar habilidades del receptor (lo que busca)
    const habilidadesBuscadasResp = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/habilidades/persona/${receptorId}`,
    );
    const habilidadesBuscadasData = await habilidadesBuscadasResp.json();
    const todasHabilidadesReceptor = habilidadesBuscadasData.success
      ? habilidadesBuscadasData.data
      : [];
    const habilidadesBuscadas = todasHabilidadesReceptor.filter(
      (h) => h.tipoEstado_Habilidad === "Necesita",
    );

    // Construir opciones para los selects
    const opcionesOfrecidas =
      habilidadesOfrecidas.length > 0
        ? habilidadesOfrecidas
            .map(
              (h) =>
                `<option value="${h.id_Habilidad}">${h.nombre_Habilidad}</option>`,
            )
            .join("")
        : `<option value="">${t("requestModal.noSkillsToOffer")}</option>`;

    const opcionesBuscadas =
      habilidadesBuscadas.length > 0
        ? habilidadesBuscadas
            .map(
              (h) =>
                `<option value="${h.id_Habilidad}">${h.nombre_Habilidad}</option>`,
            )
            .join("")
        : `<option value="">${t("requestModal.noSkillsRequested")}</option>`;

    // Obtener fecha mínima (hoy)
    const hoy = new Date().toISOString().split("T")[0];

    // Mostrar formulario con SweetAlert2
    const { value: formValues } = await Swal.fire({
      title: t("requestModal.title"),
      html: `
                        <div style="text-align: left; padding: 10px;">
                            <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
                                ${t("requestModal.sendingTo")} <strong style="color: #1e40af;">${nombreReceptor}</strong>
                            </p>

                            <!-- Habilidad que ofreces -->
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">
                                    ${t("requestModal.skillOffered")}
                                </label>
                                <select id="habilidadOfrecida" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151; background-color: white;">
                                    <option value="">${t("requestModal.selectSkill")}</option>
                                    ${opcionesOfrecidas}
                                </select>
                            </div>

                            <!-- Habilidad que solicitas -->
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">
                                    ${t("requestModal.skillInterested")}
                                </label>
                                <select id="habilidadSolicitada" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151; background-color: white;">
                                    <option value="">${t("requestModal.selectSkill")}</option>
                                    ${opcionesBuscadas}
                                </select>
                            </div>

                            <!-- Fecha y hora en la misma fila -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                                <div>
                                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">
                                        ${t("requestModal.proposedDate")}
                                    </label>
                                    <input type="date" id="fechaPropuesta" min="${hoy}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151;">
                                </div>
                                <div>
                                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">
                                        ${t("requestModal.proposedTime")}
                                    </label>
                                    <input type="time" id="horaPropuesta" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151;">
                                </div>
                            </div>

                            <!-- Duración y modalidad en la misma fila -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                                <div>
                                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">
                                        ${t("requestModal.duration")}
                                    </label>
                                    <input type="number" id="duracionEstimada" min="15" step="15" placeholder="${t("requestModal.durationPlaceholder")}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151;">
                                </div>
                                <div>
                                    <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">
                                        ${t("requestModal.modality")}
                                    </label>
                                    <select id="modalidad" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151; background-color: white;">
                                        <option value="">${t("requestModal.selectModality")}</option>
                                        <option value="Virtual">${t("requestModal.virtual")}</option>
                                        <option value="Presencial">${t("requestModal.inPerson")}</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Mensaje adicional -->
                            <div style="margin-bottom: 16px;">
                                <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 6px; font-size: 14px;">
                                    ${t("requestModal.additionalMessage")}
                                </label>
                                <textarea id="mensajeAdicional" rows="3" placeholder="${t("requestModal.messagePlaceholder")}" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; color: #374151; resize: vertical; font-family: inherit;"></textarea>
                            </div>
                        </div>
                    `,
      width: "650px",
      showCancelButton: true,
      confirmButtonText: t("requestModal.sendRequest"),
      cancelButtonText: t("common.cancel"),
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      customClass: {
        popup: "rounded-xl",
        confirmButton: "px-6 py-3 rounded-lg font-semibold",
        cancelButton: "px-6 py-3 rounded-lg font-semibold",
      },
      preConfirm: () => {
        return {
          habilidadOfrecida:
            document.getElementById("habilidadOfrecida").value || null,
          habilidadSolicitada:
            document.getElementById("habilidadSolicitada").value || null,
          fechaPropuesta:
            document.getElementById("fechaPropuesta").value || null,
          horaPropuesta: document.getElementById("horaPropuesta").value || null,
          duracionEstimada:
            document.getElementById("duracionEstimada").value || null,
          modalidad: document.getElementById("modalidad").value || null,
          mensajeAdicional:
            document.getElementById("mensajeAdicional").value || null,
        };
      },
    });

    if (!formValues) return; // Usuario canceló

    // Enviar solicitud detallada (sin loading swal pesado, Toast es asíncrono)

    // Enviar solicitud detallada
    const response = await fetch(
      `${API_BASE}/solicitudes-intercambio/enviar-detallada`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          solicitanteId: solicitanteId,
          receptorId: receptorId,
          fechaPropuesta: formValues.fechaPropuesta,
          horaPropuesta: formValues.horaPropuesta,
          duracionEstimada: formValues.duracionEstimada
            ? parseInt(formValues.duracionEstimada)
            : null,
          idHabilidadSolicitada: formValues.habilidadSolicitada,
          idHabilidadOfrecida: formValues.habilidadOfrecida,
          mensajeAdicional: formValues.mensajeAdicional,
          modalidad: formValues.modalidad,
        }),
      },
    );

    const data = await response.json();

    if (data.success) {
      Toast.success(
        t("requestModal.sent"),
        `${t("requestModal.sentMessage")} ${nombreReceptor}`,
      );

      // Recargar usuarios y solicitudes enviadas
      cargarUsuariosReales();
      cargarSolicitudesEnviadas();
    } else {
      // Mensaje más amigable si ya existe una solicitud
      const esYaEnviada =
        data.message &&
        (data.message.includes("ya existe") ||
          data.message.includes("pendiente") ||
          data.message.includes("conexión establecida"));

      if (esYaEnviada) {
        Toast.info(
          t("requestModal.alreadySent"),
          `${t("requestModal.alreadySentMessage")} ${nombreReceptor}. ${t("requestModal.viewPending")}`,
        );
      } else {
        Toast.error(
          t("requestModal.couldNotSend"),
          data.message || t("requestModal.couldNotSend"),
        );
      }
    }
  } catch (error) {
    console.error("Error en formulario solicitud detallada:", error);
    Toast.error("Error", "Ocurrió un error al procesar la solicitud");
  }
}

// Variable global para almacenar solicitudes actuales
let currentNotifications = [];

// Cargar y mostrar solicitudes recibidas
async function cargarSolicitudesRecibidas() {
  try {
    const personaId = await obtenerPersonaIdActual();

    if (!personaId) {
      return;
    }

    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/solicitudes-intercambio/recibidas/${personaId}`,
    );
    const data = await response.json();

    if (data.success) {
      // Filtrar por seguridad: excluir solicitudes donde yo soy el solicitante
      // (aunque el backend ya debería filtrarlas, esto es doble seguridad)
      let requests = data.data || [];
      if (Array.isArray(requests)) {
        requests = requests.filter(
          (r) => r.id_persona_solicitante != personaId,
        );
      }

      actualizarBadgeNotificaciones(requests.length);

      if (requests.length > 0) {
        currentNotifications = requests; // Guardar solicitudes
        mostrarSolicitudesEnDropdown(requests);
      } else {
        currentNotifications = []; // Limpiar si no hay solicitudes
        mostrarDropdownVacio();
      }
    }
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
  }
}

// Actualizar el badge de notificaciones
function actualizarBadgeNotificaciones(count) {
  const badge = document.getElementById("notificationBadge");
  const countText = document.getElementById("notificationCount");

  if (count > 0) {
    badge.classList.remove("hidden");
    badge.textContent = count > 99 ? "99+" : count;
    countText.textContent = `${count} ${count === 1 ? t("notifications.pending") : t("notifications.pendientes")}`;
  } else {
    badge.classList.add("hidden");
    countText.textContent = "";
  }
}

// Escuchar cambios en localStorage realizados por iframes (storage event)
window.addEventListener("storage", function (e) {
  try {
    if (e.key === "skillconnect_notification_delta") {
      const delta = parseInt(e.newValue || "0", 10) || 0;
      if (delta > 0) {
        const badge = document.getElementById("notificationBadge");
        const countText = document.getElementById("notificationCount");
        const current =
          parseInt(badge?.textContent?.replace(/\D+/g, "") || "0", 10) || 0;
        const nuevo = current + delta;
        if (badge) {
          badge.classList.remove("hidden");
          badge.textContent = nuevo > 99 ? "99+" : nuevo;
        }
        if (countText)
          countText.textContent = `${nuevo} pendiente${nuevo > 1 ? "s" : ""}`;
        // limpiar la bandera
        try {
          localStorage.removeItem("skillconnect_notification_delta");
        } catch (err) {}
      }
    }
  } catch (err) {
    console.debug("storage listener error", err);
  }
});

// Escuchar mensajes postMessage desde iframes (por si se envía directamente)
window.addEventListener("message", function (ev) {
  try {
    // confianza: mismo origen
    if (ev.origin !== window.location.origin) return;
    const d = ev.data || {};
    if (d.type === "nueva_notificacion") {
      const inc = parseInt(d.inc || 1, 10) || 1;
      const badge = document.getElementById("notificationBadge");
      const countText = document.getElementById("notificationCount");
      const current =
        parseInt(badge?.textContent?.replace(/\D+/g, "") || "0", 10) || 0;
      const nuevo = current + inc;
      if (badge) {
        badge.classList.remove("hidden");
        badge.textContent = nuevo > 99 ? "99+" : nuevo;
      }
      if (countText)
        countText.textContent = `${nuevo} pendiente${nuevo > 1 ? "s" : ""}`;
    }

    // Escuchar cambios de idioma desde el perfil (iframe)
    if (d.type === "languageChangeFromProfile") {
      const newLang = d.language;
      if (newLang && (newLang === "es" || newLang === "en")) {
        currentLanguage = newLang;
        localStorage.setItem("preferred_language", newLang);
        applyTranslations();
        retranslateCurrentView();

        // Actualizar el selector de idioma en Descubrir.html
        const langLabel = document.getElementById("currentLangLabel");
        if (langLabel) {
          langLabel.textContent = newLang.toUpperCase();
        }
      }
    }

    // Cuando el perfil está listo, enviarle el idioma actual
    if (d.type === "profileReady") {
      const iframe = document.getElementById("perfilIframe");
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "languageChange",
            language: currentLanguage,
          },
          window.location.origin,
        );
      }
    }
  } catch (err) {
    console.debug("message listener error", err);
  }
});

// Toggle dropdown de notificaciones
document
  .getElementById("notificationBtn")
  ?.addEventListener("click", function (e) {
    e.stopPropagation();
    const dropdown = document.getElementById("notificationDropdown");
    dropdown.classList.toggle("hidden");
  });

// Cerrar dropdown al hacer clic fuera
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("notificationDropdown");
  const btn = document.getElementById("notificationBtn");

  if (!dropdown?.contains(e.target) && !btn?.contains(e.target)) {
    dropdown?.classList.add("hidden");
  }
});

// Mostrar solicitudes en el dropdown
function mostrarSolicitudesEnDropdown(solicitudes) {
  const notificationList = document.getElementById("notificationList");
  const emptyState = document.getElementById("emptyNotifications");

  if (!notificationList) return;

  emptyState?.classList.add("hidden");

  notificationList.innerHTML = solicitudes
    .map((solicitud) => {
      const nombreCompleto =
        `${solicitud.nombre_solicitante || ""} ${solicitud.apellido_solicitante || ""}`.trim();
      const inicial =
        solicitud.nombre_solicitante && solicitud.nombre_solicitante.length > 0
          ? solicitud.nombre_solicitante.charAt(0).toUpperCase()
          : "?";

      // Construir detalles adicionales si existen
      let detallesHTML = "";

      if (
        solicitud.fecha_propuesta ||
        solicitud.hora_propuesta ||
        solicitud.duracion_estimada ||
        solicitud.modalidad ||
        solicitud.mensaje_adicional ||
        solicitud.habilidad_ofrecida ||
        solicitud.habilidad_solicitada
      ) {
        detallesHTML =
          '<div class="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs space-y-1">';

        // Habilidades
        if (solicitud.habilidad_ofrecida) {
          detallesHTML += `
                            <div class="flex items-center gap-1.5 text-gray-700">
                                <span class="iconify text-blue-700" data-icon="mdi:briefcase-outline" data-width="16" data-height="16"></span>
                                <span class="font-semibold text-blue-700">${t("notifications.offers")}</span>
                                <span class="text-blue-700 font-medium">${solicitud.habilidad_ofrecida}</span>
                            </div>`;
        }

        if (solicitud.habilidad_solicitada) {
          detallesHTML += `
                            <div class="flex items-center gap-1.5 text-gray-700">
                                <span class="iconify text-purple-700" data-icon="mdi:target" data-width="16" data-height="16"></span>
                                <span class="font-semibold text-purple-700">${t("notifications.seeks")}</span>
                                <span class="text-purple-700 font-medium">${solicitud.habilidad_solicitada}</span>
                            </div>`;
        }

        if (solicitud.fecha_propuesta) {
          const fechaPropuesta = new Date(solicitud.fecha_propuesta);
          detallesHTML += `
                            <div class="flex items-center gap-1.5 text-gray-700">
                                <span class="iconify text-gray-700" data-icon="mdi:calendar" data-width="16" data-height="16"></span>
                                <span class="font-semibold">${t("notifications.date")}</span>
                                <span>${fechaPropuesta.toLocaleDateString(
                                  "es-HN",
                                  {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}</span>
                            </div>`;
        }

        if (solicitud.hora_propuesta) {
          detallesHTML += `
                            <div class="flex items-center gap-1.5 text-gray-700">
                                <span class="iconify text-gray-700" data-icon="mdi:clock-outline" data-width="16" data-height="16"></span>
                                <span class="font-semibold">${t("notifications.time")}</span>
                                <span>${solicitud.hora_propuesta}</span>
                            </div>`;
        }

        if (solicitud.duracion_estimada) {
          const horas = Math.floor(solicitud.duracion_estimada / 60);
          const minutos = solicitud.duracion_estimada % 60;
          let duracionTexto = "";
          if (horas > 0) duracionTexto += `${horas}h `;
          if (minutos > 0) duracionTexto += `${minutos}min`;

          detallesHTML += `
                            <div class="flex items-center gap-1.5 text-gray-700">
                                <span class="iconify text-gray-700" data-icon="mdi:timer-outline" data-width="16" data-height="16"></span>
                                <span class="font-semibold">${t("notifications.duration")}</span>
                                <span>${duracionTexto}</span>
                            </div>`;
        }

        if (solicitud.modalidad) {
          const iconoModalidad =
            solicitud.modalidad === "Virtual"
              ? '<span class="iconify text-gray-700" data-icon="mdi:laptop" data-width="16" data-height="16"></span>'
              : '<span class="iconify text-gray-700" data-icon="mdi:office-building" data-width="16" data-height="16"></span>';
          detallesHTML += `
                            <div class="flex items-center gap-1.5 text-gray-700">
                                ${iconoModalidad}
                                <span class="font-semibold">${t("notifications.modality")}</span>
                                <span>${solicitud.modalidad}</span>
                            </div>`;
        }

        if (solicitud.mensaje_adicional) {
          detallesHTML += `
                            <div class="mt-1.5 pt-1.5 border-t border-blue-200">
                                <div class="flex items-center gap-1.5 mb-1">
                                    <span class="iconify text-gray-700" data-icon="mdi:message-text-outline" data-width="16" data-height="16"></span>
                                    <p class="font-semibold text-gray-700">${t("notifications.message")}</p>
                                </div>
                                <p class="text-gray-600 italic">"${solicitud.mensaje_adicional}"</p>
                            </div>`;
        }

        detallesHTML += "</div>";
      }

      return `
                    <div class="p-4 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0">
                        <div class="flex items-start gap-3">
                            ${
                              solicitud.foto_solicitante
                                ? `<img src="${solicitud.foto_solicitante}" alt="${nombreCompleto}" class="w-12 h-12 rounded-full object-cover flex-shrink-0" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                                   <div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 items-center justify-center text-white font-bold text-lg flex-shrink-0" style="display:none;">
                                    ${inicial}
                                   </div>`
                                : `<div class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    ${inicial}
                                   </div>`
                            }
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-gray-800 truncate">${nombreCompleto || "Usuario"}</p>
                                <p class="text-sm text-gray-600 mb-1">${t("notifications.wantsToExchange")}</p>
                                <p class="text-xs text-gray-400 mb-2">${new Date(
                                  solicitud.fecha_solicitud,
                                ).toLocaleString("es-HN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                  timeZone: "America/Tegucigalpa",
                                })}</p>

                                ${detallesHTML}

                                <div class="flex gap-2 mt-3">
                                    <button
                                        onclick="aceptarSolicitud(${solicitud.id_solicitud}, '${nombreCompleto.replace(/'/g, "\\'")}')"
                                        class="flex-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold shadow-sm">
                                        ${t("notifications.accept")}
                                    </button>
                                    <button
                                        onclick="rechazarSolicitud(${solicitud.id_solicitud}, '${nombreCompleto.replace(/'/g, "\\'")}')"
                                        class="flex-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition font-semibold shadow-sm">
                                        ${t("notifications.reject")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    })
    .join("");
}

// Mostrar estado vacío
function mostrarDropdownVacio() {
  const notificationList = document.getElementById("notificationList");
  const emptyState = document.getElementById("emptyNotifications");

  if (notificationList && emptyState) {
    notificationList.innerHTML = "";
    emptyState.classList.remove("hidden");
  }
}

// Aceptar solicitud
async function aceptarSolicitud(solicitudId, nombreSolicitante) {
  try {
    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/solicitudes-intercambio/${solicitudId}/aceptar`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.success) {
      Toast.success(
        t("notifications.accepted"),
        `${t("notifications.nowCanExchange")} ${nombreSolicitante}`,
      );

      // Recargar solicitudes
      await cargarSolicitudesRecibidas();
    } else {
      Toast.error("Error", data.message || "No se pudo aceptar la solicitud");
    }
  } catch (error) {
    console.error("Error al aceptar solicitud:", error);
    Toast.error("Error", "Ocurrió un error al aceptar la solicitud");
  }
}

// Rechazar solicitud
async function rechazarSolicitud(solicitudId) {
  try {
    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/solicitudes-intercambio/${solicitudId}/rechazar`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.success) {
      Toast.success(t("notifications.rejected"), t("notifications.rejected"));

      // Recargar solicitudes
      await cargarSolicitudesRecibidas();
    } else {
      Toast.error("Error", data.message || "No se pudo rechazar la solicitud");
    }
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    Toast.error("Error", "Ocurrió un error al rechazar la solicitud");
  }
}

// Cargar solicitudes cada 30 segundos
setInterval(cargarSolicitudesRecibidas, 30000);

// Actualizar badge de mensajes del sidebar cada 2 segundos para tiempo real
setInterval(async () => {
  try {
    const personaId = await obtenerPersonaIdActual();
    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversaciones/${personaId}`,
    );
    if (response.ok) {
      const resultado = await response.json();
      actualizarBadgeSidebarMensajes(resultado.data || []);
      // Actualizar lista de conversaciones si estamos en la vista de mensajes
      if (
        window.location.hash.includes("mensajes") ||
        document
          .querySelector('[data-view="mensajes"]')
          .parentElement.classList.contains("active")
      ) {
        await cargarConversacionesDashboard();
      }
    }
  } catch (error) {
    console.warn("Error al actualizar badge de mensajes:", error);
  }
}, 2000); // Actualizar cada 2 segundos para tiempo real

// Cargar solicitudes al iniciar
document.addEventListener("DOMContentLoaded", () => {
  cargarSolicitudesRecibidas();

  // Cargar badge de mensajes al iniciar
  (async () => {
    try {
      const personaId = await obtenerPersonaIdActual();
      const response = await fetch(
        `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversaciones/${personaId}`,
      );
      if (response.ok) {
        const resultado = await response.json();
        actualizarBadgeSidebarMensajes(resultado.data || []);
      }
    } catch (error) {
      console.warn("Error al cargar badge inicial de mensajes:", error);
    }
  })();
});

// ============================================
// SOLICITUDES ENVIADAS
// ============================================

// Variable global para almacenar solicitudes enviadas actuales
let currentSentRequests = [];

// Cargar solicitudes enviadas
async function cargarSolicitudesEnviadas() {
  try {
    const personaId = await obtenerPersonaIdActual();
    if (!personaId) return;

    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/solicitudes-intercambio/enviadas/${personaId}`,
    );
    if (!response.ok) throw new Error("Error al cargar solicitudes enviadas");

    const data = await response.json();
    currentSentRequests = data.data || []; // Guardar en variable global
    mostrarSolicitudesEnviadas(currentSentRequests);

    // Actualizar badge
    const badge = document.getElementById("badge-solicitudes-enviadas");
    if (badge) {
      if (data.count > 0) {
        badge.textContent = data.count;
        badge.classList.remove("hidden");
      } else {
        badge.classList.add("hidden");
      }
    }
  } catch (error) {
    console.error("Error al cargar solicitudes enviadas:", error);
    mostrarEstadoVacioEnviadas();
  }
}

// Mostrar solicitudes enviadas
function mostrarSolicitudesEnviadas(solicitudes) {
  const grid = document.getElementById("solicitudesEnviadasGrid");

  if (!grid) return; // Si el elemento no existe, salir

  if (!solicitudes || solicitudes.length === 0) {
    mostrarEstadoVacioEnviadas();
    return;
  }

  grid.innerHTML = solicitudes
    .map((solicitud) => {
      const nombreCompleto =
        `${solicitud.nombre_receptor || "Usuario"} ${solicitud.apellido_receptor || ""}`.trim();
      const imagenUrl =
        solicitud.imagenUrl_receptor ||
        solicitud.imagenUrl_Persona_receptor ||
        "";
      const initials = nombreCompleto
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      return `
                    <div class="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100">
                        <div class="p-6">
                            <div class="flex items-center space-x-4 mb-4">
                                ${
                                  imagenUrl
                                    ? `<img src="${imagenUrl}"
                                         class="w-16 h-16 rounded-full object-cover border-2 border-blue-500 shadow-md"
                                         alt="${nombreCompleto}"
                                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                     <div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full items-center justify-center text-white font-bold text-xl shadow-md hidden">
                                        ${initials}
                                     </div>`
                                    : `<div class="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                                        ${initials}
                                    </div>`
                                }
                                <div class="flex-1">
                                    <p class="font-semibold text-gray-800">${nombreCompleto}</p>
                                    <p class="text-sm text-gray-600">${t("sentRequests.pending")}</p>
                                    <p class="text-xs text-gray-400 mt-1">${new Date(
                                      solicitud.fecha_solicitud,
                                    ).toLocaleString("es-ES", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}</p>
                                </div>
                            </div>

                            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span class="flex items-center text-xs text-yellow-600 font-medium">
                                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                                    </svg>
                                    ${t("sentRequests.waitingResponse")}
                                </span>
                                <button
                                    onclick="cancelarSolicitud(${solicitud.id_solicitud})"
                                    class="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition font-semibold">
                                    ${t("sentRequests.cancel")}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
    })
    .join("");
}

// Mostrar estado vacío
function mostrarEstadoVacioEnviadas() {
  const grid = document.getElementById("solicitudesEnviadasGrid");
  grid.innerHTML = `
                <div class="col-span-full flex items-center justify-center py-16">
                    <div class="text-center">
                        <svg class="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                        </svg>
                        <h3 class="text-lg font-semibold text-gray-700 mb-2">No tienes solicitudes enviadas</h3>
                        <p class="text-gray-500 mb-4">Busca usuarios y envíales solicitudes de intercambio</p>
                        <button onclick="window.location.href='Descubrir.html'" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        Explorar Usuarios
                        </button>
                    </div>
                </div>
            `;
}

// Cancelar solicitud
async function cancelarSolicitud(solicitudId) {
  try {
    const result = await Swal.fire({
      title: "¿Cancelar solicitud?",
      text: "Esta acción eliminará la solicitud enviada",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Cancelando...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/solicitudes-intercambio/${solicitudId}/cancelar`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Solicitud cancelada",
        text: "La solicitud ha sido cancelada exitosamente",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
      });

      // Recargar solicitudes
      await cargarSolicitudesEnviadas();
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message || "No se pudo cancelar la solicitud",
        confirmButtonColor: "#3b82f6",
      });
    }
  } catch (error) {
    console.error("Error al cancelar solicitud:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error al cancelar la solicitud",
      confirmButtonColor: "#3b82f6",
    });
  }
}

// Cargar solicitudes enviadas cuando se abra la vista
document.addEventListener("DOMContentLoaded", () => {
  const menuEnviadas = document.querySelector(
    '[data-view="solicitudesEnviadas"]',
  );
  if (menuEnviadas) {
    menuEnviadas.addEventListener("click", () => {
      cargarSolicitudesEnviadas();
    });
  }

  // Cargar badge inicial
  cargarSolicitudesEnviadas();
});

// Actualizar solicitudes enviadas cada 30 segundos
setInterval(cargarSolicitudesEnviadas, 30000);

// ============================================
// SISTEMA DE MENSAJERÍA DEL DASHBOARD
// ============================================
window.conversacionesDashboard = [];
let conversacionesDashboard = window.conversacionesDashboard;
// Archivos seleccionados en el chat (antes de subir)
let selectedFilesDashboard = []; // array de File
let conversacionActivaDashboard = null;
let mensajeriaInterval = null;

// Variables globales para polling de mensajes (accesibles desde navigateTo)
window.conversacionActivaDashboard = null;
window.mensajeriaGlobalInterval = null;

// Inicializar mensajería cuando se abra la vista de mensajes
document.addEventListener("DOMContentLoaded", () => {
  // El polling se maneja ahora en navigateTo('mensajes')

  // Event listener para enviar mensajes
  const formDashboard = document.getElementById("chat-form-dashboard");
  if (formDashboard) {
    formDashboard.addEventListener("submit", enviarMensajeDashboard);
  }

  // Event delegation para el botón "Ver Perfil" en el chat del Dashboard
  document.addEventListener("click", (e) => {
    if (
      e.target.id === "verPerfilBtnDashboard" ||
      e.target.closest("#verPerfilBtnDashboard")
    ) {
      e.preventDefault();
      console.log("Click capturado en botón Ver Perfil Descubrir");
      verPerfilContactoDashboard();
    }
  });
});

// Cargar conversaciones
async function cargarConversacionesDashboard() {
  try {
    const personaId = await obtenerPersonaIdActual();
    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversaciones/${personaId}`,
    );

    if (!response.ok) throw new Error("Error al cargar conversaciones");

    const resultado = await response.json();

    // La API devuelve { success: true, data: [...] }
    const nuevasConversaciones = resultado.data || [];

    // Comparar strings de datos para evitar re-renderizado innecesario
    const oldStr = JSON.stringify(conversacionesDashboard);
    const newStr = JSON.stringify(nuevasConversaciones);

    if (oldStr !== newStr) {
      conversacionesDashboard = nuevasConversaciones;
      window.conversacionesDashboard = nuevasConversaciones;
      mostrarConversacionesDashboard(conversacionesDashboard);
      actualizarBadgeSidebarMensajes(conversacionesDashboard);
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById("conversaciones-list").innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-400">
                        <div class="text-center p-4">
                            <p class="text-sm">No tienes conversaciones activas</p>
                            <p class="text-xs mt-1">Acepta solicitudes de intercambio para chatear</p>
                        </div>
                    </div>
                `;
    actualizarBadgeSidebarMensajes([]);
  }
}

// Mostrar conversaciones
function mostrarConversacionesDashboard(conversaciones) {
  const container = document.getElementById("conversaciones-list");

  if (!conversaciones || conversaciones.length === 0) {
    container.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-400">
                        <div class="text-center p-4">
                            <p class="text-sm">No tienes conversaciones activas</p>
                            <p class="text-xs mt-1">Acepta solicitudes de intercambio para chatear</p>
                        </div>
                    </div>
                `;
    return;
  }

  container.innerHTML = conversaciones
    .map((conv, index) => {
      const nombreContacto = conv.nombre_contacto || "Usuario";
      const initials = getInitialsDashboard(nombreContacto);
      const colorClass = getColorClassDashboard(index);
      const mensajesNoLeidos = conv.mensajes_no_leidos || 0;
      const isActive =
        conversacionActivaDashboard &&
        conversacionActivaDashboard.id_conversacion === conv.id_conversacion;
      const tieneImagen =
        conv.imagenUrl_contacto && conv.imagenUrl_contacto.trim() !== "";

      return `
                    <div class="conv-item ${isActive ? "active" : ""} flex items-center space-x-3 cursor-pointer"
                         onclick="seleccionarConversacionDashboard(${conv.id_conversacion})">
                        <div class="relative flex-shrink-0">
                            ${
                              tieneImagen
                                ? `<img src="${conv.imagenUrl_contacto}"
                                     class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                     alt="${nombreContacto}"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                 <div class="w-12 h-12 ${colorClass} rounded-full items-center justify-center text-white font-semibold shadow-sm hidden">
                                    ${initials}
                                 </div>`
                                : `<div class="w-12 h-12 ${colorClass} rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                                    ${initials}
                                </div>`
                            }
                        </div>
                        <div class="flex-grow min-w-0">
                            <p class="text-sm font-bold text-gray-900 truncate">${nombreContacto}</p>
                            <p class="text-xs ${isActive ? "text-indigo-600" : "text-gray-500"} truncate font-medium">
                                ${conv.ultimo_mensaje || "Sin mensajes aún"}
                            </p>
                        </div>
                        ${
                          mensajesNoLeidos > 0
                            ? `
                            <div class="unread-badge bg-indigo-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                ${mensajesNoLeidos}
                            </div>
                        `
                            : ""
                        }
                    </div>
                `;
    })
    .join("");
}

// Actualizar badge de mensajes no leídos en el sidebar
function actualizarBadgeSidebarMensajes(conversaciones) {
  const badge = document.getElementById("sidebarMessagesBadge");

  if (!badge) return;

  // Calcular el total de mensajes no leídos de todas las conversaciones
  const totalNoLeidos = conversaciones.reduce((total, conv) => {
    return total + (conv.mensajes_no_leidos || 0);
  }, 0);

  if (totalNoLeidos > 0) {
    badge.classList.remove("hidden");
    badge.textContent = totalNoLeidos > 99 ? "99+" : totalNoLeidos;
  } else {
    badge.classList.add("hidden");
  }
}

// Seleccionar conversación
async function seleccionarConversacionDashboard(idConversacion) {
  conversacionActivaDashboard = conversacionesDashboard.find(
    (c) => c.id_conversacion === idConversacion,
  );
  window.conversacionActivaDashboard = conversacionActivaDashboard; // Sincronizar con global

  // Resetear tracking de mensajes al cambiar de conversación
  ultimoMensajeId = null;
  ultimaCantidadMensajes = 0;

  if (!conversacionActivaDashboard) return;

  // Mostrar panel de chat
  document.getElementById("chat-vacio-dashboard").classList.add("hidden");
  document.getElementById("chat-activo-dashboard").classList.remove("hidden");
  document.getElementById("chat-activo-dashboard").classList.add("flex");

  // En móvil, mostrar el chat a pantalla completa (ocultar lista)
  try {
    if (window.innerWidth && window.innerWidth <= 767) {
      document
        .getElementById("chat-layout-dashboard")
        .classList.add("mobile-show-chat");
    }
  } catch (e) {
    // no crítico
  }

  // Actualizar header del chat
  actualizarHeaderChatDashboard(conversacionActivaDashboard);

  // Cargar mensajes
  await cargarMensajesDashboard(idConversacion, true);

  // Actualizar lista para mostrar cual está activa
  mostrarConversacionesDashboard(conversacionesDashboard);

  // El polling se maneja globalmente en mensajeriaGlobalInterval
}

// Volver a la lista de conversaciones en móvil
function volverALaListaDashboard() {
  const layout = document.getElementById("chat-layout-dashboard");
  if (layout && layout.classList.contains("mobile-show-chat")) {
    layout.classList.remove("mobile-show-chat");
  }

  // Mostrar otra vez la vista vacía y ocultar chat activo
  document.getElementById("chat-vacio-dashboard").classList.remove("hidden");
  document.getElementById("chat-activo-dashboard").classList.add("hidden");
  document.getElementById("chat-activo-dashboard").classList.remove("flex");
}

// Actualizar header del chat
function actualizarHeaderChatDashboard(conv) {
  const nombreContacto = conv.nombre_contacto || "Usuario";
  const initials = getInitialsDashboard(nombreContacto);
  const colorClass = getColorClassDashboard(conv.id_conversacion);
  const tieneImagen =
    conv.imagenUrl_contacto && conv.imagenUrl_contacto.trim() !== "";

  // Guardar el ID del contacto
  if (!conversacionActivaDashboard.id_contacto && conv.id_contacto) {
    conversacionActivaDashboard.id_contacto = conv.id_contacto;
  }

  document.getElementById("chat-header-dashboard").innerHTML = `
                <div class="flex items-center gap-2 md:gap-3 overflow-hidden">
                    <button id="backToListBtnDashboard" onclick="volverALaListaDashboard()" class="md:hidden text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0" title="Volver">
                        <span class="iconify" data-icon="mdi:arrow-left" data-width="20"></span>
                    </button>
                    <div class="relative shrink-0">
                        ${
                          tieneImagen
                            ? `<img src="${conv.imagenUrl_contacto}"
                                  class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-sm"
                                  alt="${nombreContacto}"
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                             <div class="w-10 h-10 md:w-12 md:h-12 ${colorClass} rounded-full items-center justify-center text-white font-bold text-sm md:text-base hidden shadow-sm">
                                ${initials}
                             </div>`
                            : `<div class="w-10 h-10 md:w-12 md:h-12 ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-sm">
                                ${initials}
                            </div>`
                        }
                    </div>
                    <div class="min-w-0">
                        <h2 class="text-sm md:text-lg font-bold text-gray-800 truncate">${nombreContacto}</h2>
                        <p class="text-[10px] md:text-xs text-green-500 font-medium">${t("messages.activeConversation")}</p>
                    </div>
                </div>

                <div class="flex items-center gap-1 md:gap-2 shrink-0">
                    <button id="verPerfilBtnDashboard" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="${t("messages.viewProfile")}">
                        <span class="iconify" data-icon="mdi:account-circle" data-width="22"></span>
                    </button>
                    <button id="VideoLlamada" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="${t("messages.videoCall")}">
                        <span class="iconify" data-icon="mdi:video" data-width="22"></span>
                    </button>
                    <button id="finalizarIntercambioBtn" class="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all" title="${t("messages.finishExchange")}">
                        <span class="iconify" data-icon="mdi:check-circle" data-width="22"></span>
                    </button>
                    <button id="vaciarMensajesBtn" class="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-all" title="Vaciar chat">
                        <span class="iconify" data-icon="mdi:delete-sweep" data-width="22"></span>
                    </button>
                </div>
`;
}

// Función para ver el perfil del contacto desde el chat
// Función para ver el perfil del contacto desde el chat
function verPerfilContactoDashboard() {
  console.log("Función verPerfilContactoDashboard llamada");
  console.log("Conversación activa:", conversacionActivaDashboard);

  const idContacto =
    conversacionActivaDashboard?.id_contacto ||
    conversacionActivaDashboard?.idContacto ||
    conversacionActivaDashboard?.id_persona_contacto;

  if (idContacto) {
    console.log("Abriendo perfil para ID (chat -> vista perfil):", idContacto);
    // Abrir la vista de perfil en la sección principal (comportamiento SPA)
    viewProfile(parseInt(idContacto));
  } else {
    console.error("No se encontró el ID del contacto");
    alert("No se pudo cargar el perfil del contacto");
  }
}

// Variables para trackear cambios en mensajes
let ultimoMensajeId = null;
let ultimaCantidadMensajes = 0;
let fueReRenderizado = false;

// Cargar mensajes
async function cargarMensajesDashboard(idConversacion, scrollToEnd = true) {
  try {
    const personaId = await obtenerPersonaIdActual();
    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversacion/${idConversacion}/mensajes?personaId=${personaId}`,
    );

    if (!response.ok) throw new Error("Error al cargar mensajes");

    const resultado = await response.json();

    // La API devuelve { success: true, data: [...] }
    const mensajes = resultado.data || [];

    // Detectar CUALQUIER cambio: nuevos, eliminados, editados o estado de lectura
    const currentReadStatus = mensajes.map((m) => m.leido).join(",");
    const huboChangios =
      ultimoMensajeId === null ||
      mensajes.length !== ultimaCantidadMensajes ||
      (mensajes.length > 0 &&
        mensajes[mensajes.length - 1].id_mensaje !== ultimoMensajeId) ||
      (window.lastReadStatusString &&
        window.lastReadStatusString !== currentReadStatus);

    if (huboChangios || scrollToEnd) {
      console.log(
        `[MENSAJES] Actualizando chat - Total: ${mensajes.length} mensajes`,
      );
      mostrarMensajesDashboard(mensajes);
      if (mensajes.length > 0) {
        ultimoMensajeId = mensajes[mensajes.length - 1].id_mensaje;
      }
      ultimaCantidadMensajes = mensajes.length;
      window.lastReadStatusString = currentReadStatus;
    }

    if (scrollToEnd) {
      scrollToBottomDashboard();
    }

    // Marcar mensajes como leídos (con manejo de errores silencioso)
    try {
      await fetch(
        `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversacion/${idConversacion}/marcar-leidos`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personaId: personaId }),
        },
      );
    } catch (error) {
      // Error silencioso - no afecta la carga de mensajes
      console.warn("No se pudieron marcar mensajes como leídos:", error);
    }

    // Actualizar lista de conversaciones
    await cargarConversacionesDashboard();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Mostrar mensajes
function mostrarMensajesDashboard(mensajes) {
  const container = document.getElementById("mensajes-container-dashboard");

  if (!mensajes || mensajes.length === 0) {
    container.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-400">
                        <p class="text-sm">No hay mensajes aún. ¡Envía el primero!</p>
                    </div>
                `;
    return;
  }

  const newHtml = mensajes
    .map((msg, index) => {
      const esMio =
        msg.es_remitente_actual === 1 || msg.es_remitente_actual === true;
      const esUltimo = index === mensajes.length - 1;
      const ahora = new Date();
      // Manejar diferentes formatos de fecha que puedan venir del backend
      let fechaRaw = msg.fecha_envio || msg.fechaEnvio || msg.fecha || null;
      if (
        typeof fechaRaw === "string" &&
        fechaRaw.indexOf("T") === -1 &&
        fechaRaw.indexOf(" ") !== -1
      ) {
        // convertir 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DDTHH:MM:SS' para parseo confiable
        fechaRaw = fechaRaw.replace(" ", "T");
      }
      const fechaMensaje = fechaRaw ? new Date(fechaRaw) : new Date();
      let minutosDiferencia = (ahora - fechaMensaje) / (1000 * 60);
      if (!isFinite(minutosDiferencia) || minutosDiferencia < 0)
        minutosDiferencia = 0;

      // Aceptar varios nombres de campo para compatibilidad con la API
      const veceEditado =
        msg.veces_editado || msg.vecesEditado || msg.vecesEditadas || 0;
      const fueBorrado =
        msg.borrado_para_todos === 1 ||
        msg.borradoParaTodos === 1 ||
        msg.borrado === 1;

      // Determinar qué acciones son permitidas
      const LIMITE_MINUTOS_EDICION = 2;
      const puedeEditar =
        esMio &&
        veceEditado < 3 &&
        minutosDiferencia <= LIMITE_MINUTOS_EDICION &&
        !fueBorrado;
      const puedeBorrarParaTodos =
        esMio && minutosDiferencia <= 2 && !fueBorrado;
      const puedeBorrarParaMi = !fueBorrado;

      if (fueBorrado) {
        return `
                        <div class="${esMio ? "flex justify-end" : "flex justify-start"} message-enter">
                            <div class="bg-gray-100 text-gray-500 p-3 rounded-2xl max-w-md text-xs italic border border-gray-200">
                                <span class="iconify inline-block mr-1" data-icon="mdi:comment-remove-outline"></span>
                                Este mensaje fue eliminado
                            </div>
                        </div>
                    `;
      }

      const contenidoMostrado = msg.contenido_editado || msg.contenido;
      const badgeEdicion =
        veceEditado > 0
          ? `<span class="text-[10px] opacity-70 ml-1 italic">(editado)</span>`
          : "";
      const animationClass =
        esUltimo && !fueReRenderizado ? "message-enter" : "";

      if (esMio) {
        return `
                        <div class="flex justify-end group ${animationClass} w-full">
                            <div class="flex flex-col items-end max-w-[90%] md:max-w-[85%]">
                                <div class="bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white p-2.5 px-3.5 rounded-2xl rounded-tr-none shadow-md message-item hover:shadow-lg w-fit"
                                     data-message-id="${msg.id_mensaje}"
                                     data-message-content="${contenidoMostrado.replace(/"/g, "&quot;")}"
                                     data-puede-editar="${puedeEditar}"
                                     oncontextmenu="mostrarMenuContextual(event, ${msg.id_mensaje}, '${contenidoMostrado.replace(/'/g, "\\'")}', ${puedeEditar}, ${puedeBorrarParaTodos}, ${puedeBorrarParaMi}); return false;">
                                    <p class="leading-relaxed text-sm">${contenidoMostrado}</p>
                                    ${renderAdjuntosHTML(msg.adjuntos || [])}
                                    <div class="flex items-center justify-end gap-1.5 text-[10px] text-indigo-100 mt-1 opacity-90">
                                        <span class="whitespace-nowrap">${formatearHoraDashboard(msg.fecha_envio)}</span>
                                        ${badgeEdicion}
                                        <span class="iconify" data-icon="${msg.leido ? "mdi:check-all" : "mdi:check"}" style="${msg.leido ? "color: #7dd3fc;" : ""}" data-width="19"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
`;
      } else {
        return `
                        <div class="flex justify-start group ${animationClass} w-full">
                            <div class="flex flex-col items-start max-w-[90%] md:max-w-[85%]">
                                <div class="bg-white border border-slate-200 p-2.5 px-3.5 rounded-2xl rounded-tl-none shadow-sm message-item hover:shadow-md w-fit"
                                     data-message-id="${msg.id_mensaje}"
                                     data-message-content="${(contenidoMostrado || "").replace(/\"/g, "&quot;")}"
                                     data-puede-editar="${puedeEditar}"
                                     oncontextmenu="mostrarMenuContextual(event, ${msg.id_mensaje}, '${(contenidoMostrado || "").replace(/'/g, "\\'")}', ${puedeEditar}, ${puedeBorrarParaTodos}, ${puedeBorrarParaMi}); return false;">
                                    <p class="text-slate-800 leading-relaxed text-sm">${contenidoMostrado}</p>
                                    ${renderAdjuntosHTML(msg.adjuntos || [])}
                                    <div class="flex items-center justify-start gap-1.5 text-[10px] text-slate-400 mt-1">
                                        <span class="whitespace-nowrap">${formatearHoraDashboard(msg.fecha_envio)}</span>
                                        ${badgeEdicion}
                                    </div>
                                </div>
                            </div>
                        </div>
`;
      }
    })
    .join("");

  if (container.innerHTML !== newHtml) {
    container.innerHTML = newHtml;
    fueReRenderizado = true;
  }

  agregarLongPressListeners();
}

// Renderizar adjuntos: imágenes y videos
function renderAdjuntosHTML(adjuntos) {
  if (!adjuntos || !Array.isArray(adjuntos) || adjuntos.length === 0) return "";

  // Separar por tipo y buscar thumbnails que acompañen vídeos
  const images = [];
  const videos = [];

  adjuntos.forEach((a) => {
    const mime = (a.mime || a.tipo_mime || "").toLowerCase();
    const url = a.url || a.ruta || a.url_publica || a.url_public;
    const nombre = a.nombre_original || a.nombre || "";
    const tipo = (a.tipo || a.tipo_adjunto || "").toLowerCase();
    if (!url) return;
    if (mime.startsWith("video/"))
      videos.push({ ...a, url, mime, nombre, tipo });
    else if (mime.startsWith("image/"))
      images.push({ ...a, url, mime, nombre, tipo });
    else images.push({ ...a, url, mime, nombre, tipo });
  });

  const usedThumbs = new Set();
  const parts = [];

  // Para cada video, intentar encontrar su thumbnail correspondiente
  for (const v of videos) {
    let posterUrl = null;
    // buscar thumbnail marcado explícitamente
    let match = images.find(
      (img) =>
        img.tipo === "thumbnail" ||
        img.tipo === "thumb" ||
        img.tipo === "thumbnail_image",
    );
    if (match) {
      posterUrl = match.url;
      usedThumbs.add(match.url);
    } else {
      // intentar emparejar por nombre: video 'foo.mp4' -> thumb 'foo-thumb.png' o 'foo-thumb'
      const baseV = (v.nombre || "").replace(/\.[^/.]+$/, "");
      if (baseV) {
        match = images.find((img) => {
          const baseImg = (img.nombre || "").replace(/\.[^/.]+$/, "");
          if (!baseImg) return false;
          if (
            baseImg === `${baseV}-thumb` ||
            baseImg === `${baseV}_thumb` ||
            baseImg === baseV
          )
            return true;
          return baseImg.includes(baseV) || baseV.includes(baseImg);
        });
        if (match) {
          posterUrl = match.url;
          usedThumbs.add(match.url);
        }
      }
    }

    const safePoster = posterUrl ? ` poster="${posterUrl}"` : "";
    parts.push(
      `<div class="mt-2"><video controls class="max-w-xs rounded"${safePoster}><source src="${v.url}" type="${v.mime}"></video></div>`,
    );
  }

  // Renderizar imágenes que no fueron usadas como thumbnails
  for (const img of images) {
    if (usedThumbs.has(img.url)) continue;
    parts.push(
      `<div class="mt-2"><img src="${img.url}" alt="adjunto" class="max-w-xs rounded cursor-pointer" onclick="openImageFullscreen('${img.url}')"></div>`,
    );
  }

  // Si no hay video ni imagens interpretables, mostrar enlaces para los adjuntos restantes
  if (parts.length === 0) {
    return adjuntos
      .map((a) => {
        const url = a.url || a.ruta || a.url_publica || a.url_public;
        if (!url) return "";
        return `<div class="mt-2"><a href="${url}" target="_blank" class="text-indigo-600 underline">Ver archivo adjunto</a></div>`;
      })
      .join("");
  }

  return parts.join("");
}

// === GESTIÓN DE LLAMADAS ===
function handleCallNotification(payload) {
  if (!payload || !payload.caller) return;

  Toast.call(
    payload.caller.name || "Usuario SkillConnect",
    () => {
      console.log("Llamada aceptada", payload.roomId);
      Toast.success("Conectando...", "Iniciando videollamada");
      // TODO: Redirigir a sala de video
      // window.location.href = `/video/${payload.roomId}`;
    },
    () => {
      console.log("Llamada rechazada");
      // TODO: Emitir evento de rechazo al socket
    },
  );
}
window.handleCallNotification = handleCallNotification;

// === ENVIAR MENSAJE / EDICIÓN ===
let mensajeEnEdicion = null;

async function enviarMensajeDashboard(e) {
  if (e && e.preventDefault) e.preventDefault();

  const input = document.getElementById("message-input-dashboard");
  const contenido = input && input.value ? input.value.trim() : "";

  if (
    (!contenido && selectedFilesDashboard.length === 0) ||
    !conversacionActivaDashboard
  )
    return;

  try {
    const personaId = await obtenerPersonaIdActual();

    // Si estamos editando
    if (mensajeEnEdicion) {
      const msgElement = document.querySelector(
        `[data-message-id="${mensajeEnEdicion.idMensaje}"]`,
      );
      const puedeEditar = msgElement
        ? msgElement.getAttribute("data-puede-editar") === "true"
        : false;

      if (!puedeEditar) {
        Toast.error(
          "No puedes editar",
          "Solo puedes editar mensajes durante 2 minutos tras enviarlos",
        );
        cancelarEdicion();
        return;
      }

      const response = await fetch(
        `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/mensajes/${mensajeEnEdicion.idMensaje}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contenido: contenido,
            timestamp: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 410) {
          Toast.error(
            "Tiempo expirado",
            "Solo puedes editar durante 2 minutos",
          );
          cancelarEdicion();
          await cargarMensajesDashboard(
            conversacionActivaDashboard.id_conversacion,
            true,
          );
          return;
        }
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Error al editar mensaje");
      }

      const data = await response.json();
      if (data.success) {
        Toast.success("Mensaje editado");
        input.value = "";
        const indicador = document.querySelector(".edicion-indicador");
        if (indicador) indicador.remove();
        mensajeEnEdicion = null;
        await cargarMensajesDashboard(
          conversacionActivaDashboard.id_conversacion,
          true,
        );
      }
    } else {
      // Enviar nuevo mensaje: si hay archivos seleccionados, subir primero
      let adjuntosMetadata = [];
      if (selectedFilesDashboard.length > 0) {
        try {
          // Mostrar la previsualización y preparar UI de carga (skeleton/progress)
          refreshAttachmentsPreview();

          // Asegurar que el overlay global de progreso esté visible y en 0
          const overall = document.getElementById(
            "attachments-overall-progress",
          );
          if (overall) {
            overall.classList.remove("hidden");
            const inner = document.getElementById(
              "attachments-overall-progress-inner",
            );
            if (inner) inner.style.width = "0%";
          }

          // Preparar cada tile para mostrar progress circular al iniciar la subida
          selectedFilesDashboard.forEach((f, idx) => {
            const tile = document.querySelector(
              `#attachments-preview-dashboard [data-attach-index="${idx}"]`,
            );
            if (!tile) return;
            const circle = tile.querySelector(".attach-circle");
            const cancelBtn = tile.querySelector(".attach-cancel");
            const progressOuter = tile.querySelector(".attach-progress-outer");
            const progressText = tile.querySelector(".attach-progress-text");
            // reset visuals
            if (circle) {
              const bg = circle.querySelector(".circle-bg");
              const label = circle.querySelector(".circle-label");
              if (bg)
                bg.style.background =
                  "conic-gradient(#7c3aed 0deg, #e5e7eb 0deg)";
              if (label) label.textContent = "0%";
              circle.style.display = "flex";
            }
            if (cancelBtn) cancelBtn.style.display = "none";
            if (progressOuter) progressOuter.style.display = "none";
            if (progressText) progressText.style.display = "none";
          });

          // ahora sí iniciar subidas (uploadSelectedFiles habilita el botón Enviar y muestra progreso por tile)
          adjuntosMetadata = await uploadSelectedFiles(selectedFilesDashboard);
        } catch (err) {
          console.error("Error subiendo adjuntos:", err);
          Toast.error(
            "Error al subir archivos",
            "No fue posible subir los archivos seleccionados",
          );
          return;
        }
      }

      const personaRecibeId =
        conversacionActivaDashboard.id_contacto ||
        conversacionActivaDashboard.id_persona_contacto ||
        null;
      const payload = {
        conversacionId: conversacionActivaDashboard.id_conversacion,
        personaEnviaId: personaId,
        contenido: contenido,
      };
      if (personaRecibeId) payload.personaRecibeId = personaRecibeId;
      if (adjuntosMetadata && adjuntosMetadata.length > 0)
        payload.adjuntos = adjuntosMetadata;

      const response = await fetch(
        `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/enviar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        let errBody = null;
        try {
          errBody = await response.json();
        } catch (e) {
          errBody = await response.text().catch(() => null);
        }
        console.error(
          "Error al enviar mensaje - status:",
          response.status,
          "body:",
          errBody,
        );
        throw new Error("Error al enviar mensaje");
      }

      // Limpieza: input y previsualización
      if (input) input.value = "";
      clearSelectedAttachmentsPreview();

      await cargarMensajesDashboard(
        conversacionActivaDashboard.id_conversacion,
        true,
      );
    }
  } catch (error) {
    console.error("Error:", error);
    Toast.error("Error", error.message || "Error al procesar el mensaje");
  }
}

// ---- Helpers para adjuntos ----
// Convertir File -> data URL (evita CSP que bloquea blob:)
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
// Generar miniatura de vídeo en el cliente (extraer un frame)
async function generateVideoThumbnail(file, maxWidth = 480) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.src = url;
      video.playsInline = true;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      };

      const onError = (e) => {
        cleanup();
        reject(new Error("Error cargando vídeo para miniatura"));
      };

      video.addEventListener("loadeddata", () => {
        try {
          // intenta posicionar a 0.25s para evitar frames en negro
          const target = Math.min(0.25, (video.duration || 0) / 2);
          video.currentTime = target;
        } catch (seekErr) {
          // ignore
        }
      });

      video.addEventListener("seeked", () => {
        try {
          const canvas = document.createElement("canvas");
          const vw = video.videoWidth || maxWidth;
          const vh = video.videoHeight || maxWidth * 0.56;
          const scale = Math.min(1, maxWidth / vw);
          canvas.width = Math.round(vw * scale);
          canvas.height = Math.round(vh * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (!blob)
                return reject(new Error("No se generó blob desde canvas"));
              const thumbFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, "") + "-thumb.png",
                { type: "image/png" },
              );
              resolve(thumbFile);
            },
            "image/png",
            0.9,
          );
        } catch (err) {
          cleanup();
          reject(err);
        }
      });

      video.addEventListener("error", onError);

      // safety timeout
      setTimeout(() => {
        if (!video.readyState) {
          cleanup();
          reject(new Error("Tiempo agotado generando miniatura"));
        }
      }, 5000);
    } catch (err) {
      reject(err);
    }
  });
}

// Subir archivos; si hay vídeos, generar y subir miniatura antes
async function uploadSelectedFiles(filesArray) {
  const uploaded = [];

  const sendBtn = document.getElementById("send-message-btn-dashboard");
  if (sendBtn) sendBtn.disabled = true;

  // prepare arrays for overall progress (only main files)
  const totalMainBytes = filesArray.reduce((s, f) => s + (f.size || 0), 0);
  const mainUploadedBytes = new Array(filesArray.length).fill(0);

  // utility to update overall bar
  const updateOverall = () => {
    try {
      const overallEl = document.getElementById("attachments-overall-progress");
      const inner = document.getElementById(
        "attachments-overall-progress-inner",
      );
      if (!overallEl || !inner) return;
      overallEl.classList.remove("hidden");
      const totalUploaded = mainUploadedBytes.reduce((a, b) => a + (b || 0), 0);
      const pct =
        totalMainBytes > 0
          ? Math.round((totalUploaded / totalMainBytes) * 100)
          : 0;
      inner.style.width = pct + "%";
    } catch (e) {}
  };

  for (let i = 0; i < filesArray.length; i++) {
    const file = filesArray[i];
    const preview = document.querySelector(
      `#attachments-preview-dashboard [data-attach-index="${i}"]`,
    );
    const circle = preview ? preview.querySelector(".attach-circle") : null;
    const cancelEl = preview ? preview.querySelector(".attach-cancel") : null;

    // create cancellable XHR
    let currentXhr = null;
    if (cancelEl) {
      cancelEl.style.display = "none";
      cancelEl.onclick = (e) => {
        e.stopPropagation();
        if (currentXhr) currentXhr.abort();
        if (preview) preview.remove();
      };
    }

    const uploadSingle = (fileToSend, onProgress) => {
      return new Promise((resolve, reject) => {
        try {
          const form = new FormData();
          form.append("file", fileToSend, fileToSend.name);
          const xhr = new XMLHttpRequest();
          currentXhr = xhr;
          xhr.open(
            "POST",
            `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/upload`,
          );

          if (cancelEl) cancelEl.style.display = "flex";

          xhr.upload.onprogress = (ev) => {
            if (!ev.lengthComputable) return;
            onProgress && onProgress(ev.loaded, ev.total);
            const percent = Math.round((ev.loaded / ev.total) * 100);
            if (circle) {
              const bg = circle.querySelector(".circle-bg");
              const label = circle.querySelector(".circle-label");
              if (bg)
                bg.style.background = `conic-gradient(#7c3aed ${percent * 3.6}deg, #e5e7eb 0deg)`;
              if (label) label.textContent = percent + "%";
            }
          };

          xhr.onload = () => {
            currentXhr = null;
            if (cancelEl) cancelEl.style.display = "none";
            if (xhr.status >= 200 && xhr.status < 300) {
              let json = {};
              try {
                json = JSON.parse(xhr.responseText);
              } catch (e) {
                json = {};
              }
              resolve(json);
            } else {
              reject(new Error("Error en subida: " + xhr.status));
            }
          };

          xhr.onerror = () => {
            currentXhr = null;
            reject(new Error("Error de red al subir archivo"));
          };
          xhr.onabort = () => {
            currentXhr = null;
            reject(new Error("Cancelado por el usuario"));
          };
          xhr.send(form);
        } catch (err) {
          reject(err);
        }
      });
    };

    // If video: generate thumb and upload it (smaller, but don't count in main progress)
    let thumbMeta = null;
    if (file.type && file.type.startsWith("video/")) {
      try {
        const thumbFile = await generateVideoThumbnail(file, 480);
        // upload thumbnail with simple progress to circle
        try {
          const thumbResp = await uploadSingle(thumbFile, () => {});
          thumbMeta = {
            url:
              thumbResp.url ||
              thumbResp.url_publica ||
              thumbResp.location ||
              thumbResp.publicUrl,
            mime: thumbResp.mime || thumbFile.type,
            nombre_original: thumbResp.nombre_original || thumbFile.name,
            tamano_bytes: thumbResp.tamano_bytes || thumbFile.size,
            tipo: "image",
            is_thumb: true,
          };
        } catch (errThumb) {
          console.warn("Thumb upload failed", errThumb);
        }
      } catch (err) {
        console.warn("Thumb gen failed", err);
      }
    }

    // upload main and update overall progress using ev.loaded
    try {
      const resp = await uploadSingle(file, (loaded, total) => {
        // update mainUploadedBytes for this index
        mainUploadedBytes[i] = loaded;
        updateOverall();
      });
      const mainMeta = {
        url: resp.url || resp.url_publica || resp.location || resp.publicUrl,
        mime: resp.mime || file.type,
        nombre_original: resp.nombre_original || file.name,
        tamano_bytes: resp.tamano_bytes || file.size,
        tipo: file.type && file.type.startsWith("video/") ? "video" : "image",
      };
      uploaded.push(mainMeta);
      if (thumbMeta) uploaded.push(thumbMeta);
      // finish circle to 100%
      if (circle) {
        const bg = circle.querySelector(".circle-bg");
        const label = circle.querySelector(".circle-label");
        if (bg)
          bg.style.background = `conic-gradient(#7c3aed 360deg, #e5e7eb 0deg)`;
        if (label) label.textContent = "✓";
      }
    } catch (err) {
      if (circle) {
        const label = circle.querySelector(".circle-label");
        if (label) label.textContent = "✕";
      }
      throw err;
    }
  }

  if (sendBtn) sendBtn.disabled = false;
  return uploaded;
}

function clearSelectedAttachmentsPreview() {
  selectedFilesDashboard = [];
  const preview = document.getElementById("attachments-preview-dashboard");
  if (preview) {
    preview.innerHTML = "";
    preview.classList.add("hidden");
    preview.classList.remove("flex");
  }
  const fileInput = document.getElementById("file-input-dashboard");
  if (fileInput) fileInput.value = null;
}

function createAttachmentPreview(file, index) {
  const container = document.createElement("div");
  container.className =
    "relative inline-block bg-white rounded-lg border border-gray-300 overflow-visible";
  container.style.width = "80px";
  container.style.height = "80px";
  container.setAttribute("data-attach-index", String(index));

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className =
    "absolute -top-2 -right-2 bg-white text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-lg font-bold shadow-md hover:bg-gray-100 z-10 border border-gray-300";
  removeBtn.innerHTML = "×";
  removeBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectedFilesDashboard.splice(index, 1);
    refreshAttachmentsPreview();
  };
  // asegurar que el botón esté por encima de cualquier borde/overlay
  removeBtn.style.zIndex = "9999";

  if (file.type.startsWith("image/")) {
    const img = document.createElement("img");
    img.className = "w-full h-full object-cover";
    img.style.display = "block";
    // usar data URL en vez de blob: para evitar CSP
    fileToDataURL(file)
      .then((dataURL) => {
        img.src = dataURL;
        img.onclick = () => openImageFullscreen(dataURL);
      })
      .catch((err) => {
        console.error("Error al convertir imagen a dataURL:", err);
        img.src =
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23f3f4f6" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280"%3E?%3C/text%3E%3C/svg%3E';
      });
    img.onerror = () => {
      console.error("Error al cargar imagen:", file.name);
    };
    container.appendChild(img);
  } else if (file.type.startsWith("video/")) {
    const vid = document.createElement("video");
    vid.className = "w-full h-full object-cover";
    vid.style.display = "block";
    vid.controls = false;
    vid.muted = true;
    // Convertir a dataURL para preview (puede ser pesado pero evita CSP)
    fileToDataURL(file)
      .then((dataURL) => {
        vid.src = dataURL;
      })
      .catch((err) => {
        console.error("Error al convertir video a dataURL:", err);
      });
    container.appendChild(vid);
  } else {
    const box = document.createElement("div");
    box.className =
      "w-full h-full flex flex-col items-center justify-center p-2 bg-gray-50";
    const fileName =
      file.name.length > 12 ? file.name.substring(0, 12) + "..." : file.name;
    box.innerHTML = `<div class="text-2xl mb-1">📄</div><div class="text-xs text-gray-600 text-center break-words">${fileName}</div>`;
    container.appendChild(box);
  }
  // Circular progress indicator (shows percent while uploading)
  const circle = document.createElement("div");
  circle.className = "attach-circle";
  circle.innerHTML = `<div class="circle-bg"></div><div class="circle-label">0%</div>`;
  container.appendChild(circle);

  // Cancel upload button (visible only durante upload)
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "attach-cancel";
  cancelBtn.innerHTML = "✕";
  cancelBtn.title = "Cancelar subida";
  cancelBtn.style.display = "none";
  container.appendChild(cancelBtn);

  // Barra de progreso (oculta por defecto)
  const progressOuter = document.createElement("div");
  progressOuter.className = "attach-progress-outer";
  progressOuter.innerHTML = `<div class="attach-progress-inner"></div>`;
  container.appendChild(progressOuter);

  // Texto de porcentaje
  const progressText = document.createElement("div");
  progressText.className = "attach-progress-text";
  progressText.textContent = "0%";
  container.appendChild(progressText);

  container.appendChild(removeBtn);
  return container;
}

function refreshAttachmentsPreview() {
  const preview = document.getElementById("attachments-preview-dashboard");
  if (!preview) return;
  preview.innerHTML = "";
  // overall progress bar
  const overallBar = document.createElement("div");
  overallBar.id = "attachments-overall-progress";
  overallBar.className = "hidden";
  overallBar.innerHTML = `<div id="attachments-overall-progress-inner" style="width:0%;height:6px;background:linear-gradient(90deg,#7c3aed,#2563eb);border-radius:8px"></div>`;
  preview.appendChild(overallBar);
  if (!selectedFilesDashboard || selectedFilesDashboard.length === 0) {
    preview.classList.add("hidden");
    preview.classList.remove("flex");
    return;
  }

  preview.classList.remove("hidden");
  preview.classList.add("flex");
  selectedFilesDashboard.forEach((f, idx) => {
    const node = createAttachmentPreview(f, idx);
    preview.appendChild(node);
  });
}

// Inicializar listeners del input de archivos y form
(function initAttachmentsUI() {
  const fileInput = document.getElementById("file-input-dashboard");
  const form = document.getElementById("chat-form-dashboard");
  if (fileInput) {
    fileInput.addEventListener("change", (ev) => {
      const files = Array.from(ev.target.files || []);
      // Limitar número/size si se desea (puedes ajustar aquí)
      files.forEach((f) => selectedFilesDashboard.push(f));
      refreshAttachmentsPreview();
    });
  }

  if (form) {
    form.addEventListener("submit", enviarMensajeDashboard);
  }
})();

// ============================================
// 🟦 FUNCIONES DE EDICIÓN / BORRADO
// ============================================

function iniciarEdicionMensaje(idMensaje, contenidoActual) {
  mensajeEnEdicion = { idMensaje };

  const input = document.getElementById("message-input-dashboard");
  input.value = contenidoActual;
  input.focus();
  input.style.borderColor = "#3b82f6";
  input.style.borderWidth = "2px";

  const form =
    document.querySelector("form") ||
    document.getElementById("form-mensaje-dashboard");
  let indicador = form.querySelector(".edicion-indicador");

  if (!indicador) {
    indicador = document.createElement("div");
    indicador.className =
      "edicion-indicador text-xs text-blue-600 font-semibold mb-2 flex items-center gap-2";
    form.insertBefore(indicador, form.firstChild);
  }

  indicador.innerHTML = `
                <span class="iconify" data-icon="mdi:pencil" data-width="14"></span>
                ${t("messages.editingMessage")}
                <button type="button" onclick="cancelarEdicion()" class="text-red-500 hover:text-red-700 font-bold">✕</button>
            `;
}

function cancelarEdicion() {
  mensajeEnEdicion = null;
  const input = document.getElementById("message-input-dashboard");
  input.value = "";
  input.style.borderColor = "";
  input.style.borderWidth = "";

  const indicador = document.querySelector(".edicion-indicador");
  if (indicador) {
    indicador.remove();
  }
}

async function confirmarBorrarMensaje(idMensaje, tipo) {
  const title =
    tipo === "todos"
      ? t("messages.deleteForAllTitle")
      : t("messages.deleteForMeTitle");
  const text =
    tipo === "todos"
      ? t("messages.deleteForAllText")
      : t("messages.deleteForMeText");

  // Custom Modal "No-AI Look"
  return new Promise((resolve) => {
    const modalId = "delete-confirm-modal";
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const modalHtml = `
                    <div id="${modalId}" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
                        <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all scale-100 animate-scaleUp">
                            <div class="flex flex-col items-center text-center">
                                <div class="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-4">
                                    <span class="iconify text-2xl" data-icon="mdi:delete-outline"></span>
                                </div>
                                <h3 class="text-lg font-bold text-gray-900 mb-2">${title}</h3>
                                <p class="text-sm text-gray-500 mb-6">${text}</p>
                                <div class="flex gap-3 w-full">
                                    <button id="cancel-delete" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">
                                        ${t("messages.finishCancel")}
                                    </button>
                                    <button id="confirm-delete" class="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all transform active:scale-95">
                                        ${t("messages.yesDelete")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.getElementById(modalId);
    const btnConfirm = document.getElementById("confirm-delete");
    const btnCancel = document.getElementById("cancel-delete");

    const closeModal = () => {
      modal.classList.add("opacity-0");
      setTimeout(() => modal.remove(), 200);
    };

    btnCancel.onclick = () => {
      closeModal();
      resolve(false);
    };

    btnConfirm.onclick = async () => {
      closeModal();
      try {
        // Usar endpoint existente en backend
        const personaId = await obtenerPersonaIdActual();
        const qs = new URLSearchParams({ tipo: tipo, personaId: personaId });
        const response = await fetch(
          `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/mensajes/${idMensaje}?${qs.toString()}`,
          {
            method: "DELETE",
          },
        );

        if (response.status === 410) {
          await response.json().catch(() => {});
          Toast.error(
            t("messages.deleteExpired"),
            t("messages.deleteExpiredText"),
          );
          await cargarMensajesDashboard(
            conversacionActivaDashboard.id_conversacion,
            false,
          );
          return;
        }

        if (!response.ok) throw new Error("Error al borrar mensaje");

        const data = await response.json();

        if (data.success) {
          const msgSuccess =
            tipo === "todos"
              ? "Mensaje eliminado para todos"
              : "Mensaje eliminado para mí";
          Toast.success(msgSuccess);
          await cargarMensajesDashboard(
            conversacionActivaDashboard.id_conversacion,
            false,
          );
        }
      } catch (err) {
        console.error(err);
        Toast.error("Error", "No se pudo eliminar el mensaje");
      }
      resolve(true);
    };
  });
}

// ============================================
// VACIAR MENSAJES PARA MÍ
// ============================================

async function vaciarMensajesParaMi() {
  if (
    !conversacionActivaDashboard ||
    !conversacionActivaDashboard.id_conversacion
  ) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No hay conversación activa",
      confirmButtonColor: "#3b82f6",
    });
    return;
  }

  const nombreContacto =
    conversacionActivaDashboard.nombre_contacto || "este usuario";

  const result = await Swal.fire({
    title: "¿Vaciar conversación?",
    html: `
                    <div style="text-align: center;">
                        <p style="font-size: 16px; color: #4b5563; margin: 16px 0;">
                            ¿Estás seguro de que deseas eliminar todos los mensajes de la conversación con <strong>${nombreContacto}</strong>?
                        </p>
                        <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
                            Esta acción solo eliminará los mensajes para ti. El otro usuario seguirá viendo los mensajes.
                        </p>
                    </div>
                `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#6b7280",
    confirmButtonText: '<i class="mdi mdi-delete-sweep"></i> Sí, vaciar',
    cancelButtonText: '<i class="mdi mdi-close-circle"></i> Cancelar',
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const personaId = await obtenerPersonaIdActual();
    const idConversacion = conversacionActivaDashboard.id_conversacion;

    // Obtener todos los mensajes de la conversación
    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversacion/${idConversacion}/mensajes?personaId=${personaId}`,
    );
    if (!response.ok) throw new Error("Error al obtener mensajes");

    const resultado = await response.json();
    const mensajes = resultado.mensajes || [];

    // Eliminar cada mensaje solo para mí
    let errores = 0;
    for (const msg of mensajes) {
      try {
        const deleteResponse = await fetch(
          `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/mensajes/${msg.id_mensaje}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ personaId, soloParaMi: true }),
          },
        );
        if (!deleteResponse.ok) errores++;
      } catch (err) {
        console.error("Error eliminando mensaje:", err);
        errores++;
      }
    }

    if (errores === 0) {
      Swal.fire({
        icon: "success",
        title: "Mensajes eliminados",
        text: "Todos los mensajes han sido eliminados para ti",
        timer: 2000,
        showConfirmButton: false,
      });
      await cargarMensajesDashboard(idConversacion, true);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Algunos mensajes no se eliminaron",
        text: `Se eliminaron correctamente ${mensajes.length - errores} de ${mensajes.length} mensajes`,
        confirmButtonColor: "#3b82f6",
      });
      await cargarMensajesDashboard(idConversacion, true);
    }
  } catch (error) {
    console.error("Error al vaciar mensajes:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron eliminar los mensajes",
      confirmButtonColor: "#3b82f6",
    });
  }
}

// ============================================
// FINALIZAR INTERCAMBIO DESDE DASHBOARD
// ============================================

// Event listener para el botón Vaciar Mensajes
document.addEventListener(
  "click",
  (e) => {
    if (
      e.target.id === "vaciarMensajesBtn" ||
      e.target.closest("#vaciarMensajesBtn")
    ) {
      e.preventDefault();
      e.stopPropagation();
      vaciarMensajesParaMi();
    }
  },
  true,
);

// Event listener para el botón Finalizar Intercambio
document.addEventListener(
  "click",
  (e) => {
    if (
      e.target.id === "finalizarIntercambioBtn" ||
      e.target.closest("#finalizarIntercambioBtn")
    ) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Click en botón Finalizar Intercambio (Descubrir)");
      finalizarIntercambioDashboard();
    }
  },
  true,
);

// Función para finalizar el intercambio desde Dashboard
async function finalizarIntercambioDashboard() {
  console.log(" finalizarIntercambioDashboard() - Descubrir");
  console.log("conversacionActivaDashboard:", conversacionActivaDashboard);

  if (
    !conversacionActivaDashboard ||
    !conversacionActivaDashboard.id_conversacion
  ) {
    alert("Error: No se pudo identificar la conversación actual");
    return;
  }

  // Obtener IDs necesarios
  const idConversacion = conversacionActivaDashboard.id_conversacion;
  const idContacto =
    conversacionActivaDashboard.id_contacto ||
    conversacionActivaDashboard.id_persona_contacto;
  const nombreContacto =
    conversacionActivaDashboard.nombre_contacto || "este usuario";

  if (!idContacto) {
    alert("Error: No se pudo identificar al usuario contacto");
    return;
  }

  // Modal minimalista profesional (estilo Slack/Linear)
  const modalHtml = `
                    <div id="finalizarIntercambioModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.15s ease-out;">
                        <div style="background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); max-width: 440px; width: 92%; animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">

                            <!-- Contenido -->
                            <div style="padding: 24px 24px 20px;">
                                <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                                    <div style="width: 40px; height: 40px; min-width: 40px; background: #fef3c7; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
                                        <span class="iconify" data-icon="mdi:alert" style="font-size: 22px; color: #f59e0b;"></span>
                                    </div>
                                    <div style="flex: 1; padding-top: 2px;">
                                        <h3 style="margin: 0 0 6px; font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.3;">
                                            Finalizar intercambio
                                        </h3>
                                        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                                            Estás a punto de finalizar el intercambio con <strong style="color: #334155;">${nombreContacto}</strong>
                                        </p>
                                    </div>
                                </div>

                                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 14px; margin-top: 16px;">
                                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                                        La conversación será eliminada permanentemente
                                    </p>
                                </div>
                            </div>

                            <!-- Footer con botones -->
                            <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; display: flex; gap: 10px; justify-content: flex-end; border-radius: 0 0 12px 12px;">
                                <button id="btnCancelarFinalizar" style="padding: 9px 18px; background: white; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.15s;">
                                    Cancelar
                                </button>
                                <button id="btnConfirmarFinalizar" style="padding: 9px 18px; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 2px rgba(239, 68, 68, 0.2);">
                                    Sí, finalizar
                                </button>
                            </div>
                        </div>
                    </div>
                    <style>
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        #btnCancelarFinalizar:hover { background: #f1f5f9; border-color: #94a3b8; }
                        #btnConfirmarFinalizar:hover { background: #dc2626; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3); }
                        #btnCancelarFinalizar:active { transform: scale(0.98); }
                        #btnConfirmarFinalizar:active { transform: scale(0.98); }
                    </style>
                `;

  const modalContainer = document.createElement("div");
  modalContainer.innerHTML = modalHtml;
  document.body.appendChild(modalContainer);

  // Esperar a que Iconify renderice los iconos
  if (window.Iconify && typeof window.Iconify.scan === "function") {
    window.Iconify.scan();
  }

  const result = await new Promise((resolve) => {
    document.getElementById("btnConfirmarFinalizar").onclick = () => {
      modalContainer.remove();
      resolve({ isConfirmed: true });
    };
    document.getElementById("btnCancelarFinalizar").onclick = () => {
      modalContainer.remove();
      resolve({ isConfirmed: false });
    };
    document.getElementById("finalizarIntercambioModal").onclick = (e) => {
      if (e.target.id === "finalizarIntercambioModal") {
        modalContainer.remove();
        resolve({ isConfirmed: false });
      }
    };
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: t("messages.processing"),
      html: `<div style="padding: 20px;">${t("messages.finishingExchange")}</div>`,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Obtener datos de la persona actual
    const personaId = await obtenerPersonaIdActual();

    if (!personaId) {
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "No se pudo obtener tu información de usuario. Por favor, inicia sesión nuevamente.",
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: "rounded-lg shadow-2xl",
        },
      });
      return;
    }

    // Llamar al backend para finalizar el intercambio
    const response = await fetch(`${API_BASE}/intercambios/finalizar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_conversacion: idConversacion,
        id_persona_finalizador: personaId,
        id_persona_otro: idContacto,
      }),
    });

    const data = await response.json();

    if (data.success) {
      Swal.close(); // Cerrar el loading

      // Verificar que tenemos el ID del intercambio
      if (!data.intercambio || !data.intercambio.id_intercambio) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo obtener el ID del intercambio",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      // Mostrar modal de calificación
      mostrarModalCalificacionDashboard(
        data.intercambio.id_intercambio,
        idContacto,
        nombreContacto,
      );
    } else {
      Swal.fire({
        icon: "error",
        title: "Error al finalizar",
        html: `
                            <p style="color: #4b5563; font-size: 15px;">
                                ${data.mensaje || "No se pudo finalizar el intercambio"}
                            </p>
                        `,
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: "rounded-lg shadow-2xl",
        },
      });
    }
  } catch (error) {
    console.error(" Error al finalizar intercambio:", error);
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      html: `
                        <div style="text-align: center;">
                            <p style="color: #4b5563; font-size: 15px; margin-bottom: 12px;">
                                No se pudo conectar con el servidor
                            </p>
                            <p style="color: #6b7280; font-size: 13px;">
                                Por favor, verifica tu conexión a internet e intenta nuevamente
                            </p>
                        </div>
                    `,
      confirmButtonColor: "#3b82f6",
      customClass: {
        popup: "rounded-lg shadow-2xl",
      },
    });
  }
}

// Modal de calificación con sistema de estrellas (Dashboard)
function mostrarModalCalificacionDashboard(
  idIntercambio,
  idPersonaCalificada,
  nombrePersona,
) {
  console.log("   mostrarModalCalificacionDashboard recibió:");
  console.log(
    "   idIntercambio:",
    idIntercambio,
    "tipo:",
    typeof idIntercambio,
  );
  console.log(
    "   idPersonaCalificada:",
    idPersonaCalificada,
    "tipo:",
    typeof idPersonaCalificada,
  );
  console.log("   nombrePersona:", nombrePersona);

  const modal = document.createElement("div");
  modal.id = "modalCalificacionDashboard";
  modal.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  modal.style.zIndex = "9999";
  modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" style="animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">

                    <!-- Header -->
                    <div style="padding: 24px 24px 0;">
                        <div style="display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px;">
                            <div style="width: 44px; height: 44px; min-width: 44px; background: #fef3c7; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
                                <span class="iconify text-amber-500" data-icon="mdi:star" data-width="24"></span>
                            </div>
                            <div style="flex: 1;">
                                <h2 style="margin: 0 0 6px; font-size: 20px; font-weight: 600; color: #0f172a; line-height: 1.3;">
                                    Califica tu experiencia
                                </h2>
                                <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                                    ¿Cómo fue tu intercambio con <strong style="color: #334155;">${nombrePersona}</strong>?
                                </p>
                            </div>
                        </div>

                        <!-- Sistema de estrellas (sin cambios en la funcionalidad) -->
                        <div class="flex justify-center space-x-2 mb-4" id="sistemaEstrellasDashboard" style="padding: 8px 0;">
                            ${[1, 2, 3, 4, 5]
                              .map(
                                (num) => `
                                <button type="button" class="estrella-dashboard text-gray-300 hover:text-yellow-400 transition transform hover:scale-110" data-valor="${num}" style="background: none; border: none; cursor: pointer;">
                                    <span class="iconify" data-icon="mdi:star" data-width="48"></span>
                                </button>
                            `,
                              )
                              .join("")}
                        </div>

                        <!-- Texto de calificación seleccionada -->
                        <div class="text-center mb-6">
                            <p id="textoCalificacionDashboard" class="text-base font-medium text-gray-500">Selecciona una calificación</p>
                        </div>

                        <!-- Métricas de Desempeño - Progress Bars -->
                        <div class="mb-6" style="background: #f8fafc; border-radius: 12px; padding: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 16px;">
                                <span class="iconify" data-icon="mdi:chart-bar" data-width="18" style="color: #3b82f6;"></span>
                                Evalúa el desempeño
                            </label>

                            <!-- Puntualidad -->
                            <div style="margin-bottom: 14px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <span style="font-size: 13px; color: #475569; display: flex; align-items: center; gap: 6px;">
                                        <span class="iconify" data-icon="mdi:clock-check-outline" data-width="16" style="color: #10b981;"></span>
                                        Puntualidad
                                    </span>
                                    <span id="valorPuntualidad" style="font-size: 12px; font-weight: 600; color: #3b82f6;">50%</span>
                                </div>
                                <input type="range" id="sliderPuntualidad" min="0" max="100" value="50"
                                       style="width: 100%; height: 6px; border-radius: 3px; -webkit-appearance: none; background: linear-gradient(to right, #3b82f6 50%, #e2e8f0 50%); cursor: pointer;">
                            </div>

                            <!-- Calidad de Trabajo -->
                            <div style="margin-bottom: 14px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <span style="font-size: 13px; color: #475569; display: flex; align-items: center; gap: 6px;">
                                        <span class="iconify" data-icon="mdi:star-check" data-width="16" style="color: #f59e0b;"></span>
                                        Calidad del trabajo
                                    </span>
                                    <span id="valorCalidad" style="font-size: 12px; font-weight: 600; color: #3b82f6;">50%</span>
                                </div>
                                <input type="range" id="sliderCalidad" min="0" max="100" value="50"
                                       style="width: 100%; height: 6px; border-radius: 3px; -webkit-appearance: none; background: linear-gradient(to right, #3b82f6 50%, #e2e8f0 50%); cursor: pointer;">
                            </div>

                            <!-- Limpieza -->
                            <div style="margin-bottom: 14px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <span style="font-size: 13px; color: #475569; display: flex; align-items: center; gap: 6px;">
                                        <span class="iconify" data-icon="mdi:broom" data-width="16" style="color: #06b6d4;"></span>
                                        Limpieza
                                    </span>
                                    <span id="valorLimpieza" style="font-size: 12px; font-weight: 600; color: #3b82f6;">50%</span>
                                </div>
                                <input type="range" id="sliderLimpieza" min="0" max="100" value="50"
                                       style="width: 100%; height: 6px; border-radius: 3px; -webkit-appearance: none; background: linear-gradient(to right, #3b82f6 50%, #e2e8f0 50%); cursor: pointer;">
                            </div>

                            <!-- Comunicación -->
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                    <span style="font-size: 13px; color: #475569; display: flex; align-items: center; gap: 6px;">
                                        <span class="iconify" data-icon="mdi:message-text-outline" data-width="16" style="color: #8b5cf6;"></span>
                                        Comunicación
                                    </span>
                                    <span id="valorComunicacion" style="font-size: 12px; font-weight: 600; color: #3b82f6;">50%</span>
                                </div>
                                <input type="range" id="sliderComunicacion" min="0" max="100" value="50"
                                       style="width: 100%; height: 6px; border-radius: 3px; -webkit-appearance: none; background: linear-gradient(to right, #3b82f6 50%, #e2e8f0 50%); cursor: pointer;">
                            </div>
                        </div>

                        <!-- Campo de comentario -->
                        <div class="mb-6">
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px;">
                                Comentario <span style="color: #94a3b8; font-weight: 400;">(opcional)</span>
                            </label>
                            <textarea id="comentarioCalificacionDashboard" rows="3" maxlength="500"
                                      style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #1e293b; resize: none; font-family: inherit; transition: border-color 0.15s;"
                                      placeholder="Comparte tu experiencia con ${nombrePersona}..."
                                      onfocus="this.style.borderColor='#3b82f6'; this.style.outline='none';"
                                      onblur="this.style.borderColor='#cbd5e1';"></textarea>
                            <p style="margin: 6px 0 0; font-size: 12px; color: #94a3b8;">Máximo 500 caracteres</p>
                        </div>
                    </div>

                    <!-- Footer con botones -->
                    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; display: flex; gap: 10px; justify-content: flex-end; border-radius: 0 0 12px 12px;">
                        <button id="btnCancelarCalificacionDashboard" style="padding: 9px 18px; background: white; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.15s;">
                            Omitir
                        </button>
                        <button id="btnEnviarCalificacionDashboard" style="padding: 9px 18px; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.15s; box-shadow: 0 1px 2px rgba(59, 130, 246, 0.2);" disabled>
                            Enviar Calificación
                        </button>
                    </div>

                    <style>
                        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        #btnCancelarCalificacionDashboard:hover { background: #f1f5f9; border-color: #94a3b8; }
                        #btnEnviarCalificacionDashboard:hover:not(:disabled) { background: #2563eb; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); }
                        #btnEnviarCalificacionDashboard:disabled { opacity: 0.5; cursor: not-allowed; }
                        #btnCancelarCalificacionDashboard:active { transform: scale(0.98); }
                        #btnEnviarCalificacionDashboard:active:not(:disabled) { transform: scale(0.98); }

                        /* Estilos para los sliders */
                        input[type="range"]::-webkit-slider-thumb {
                            -webkit-appearance: none;
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            background: #3b82f6;
                            cursor: pointer;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                        input[type="range"]::-moz-range-thumb {
                            width: 16px;
                            height: 16px;
                            border-radius: 50%;
                            background: #3b82f6;
                            cursor: pointer;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                        }
                    </style>
                </div>
            `;

  document.body.appendChild(modal);

  // Variables para la calificación
  let calificacionSeleccionada = 0;
  const estrellas = modal.querySelectorAll(".estrella-dashboard");
  const textoCalificacion = modal.querySelector("#textoCalificacionDashboard");
  const btnEnviar = modal.querySelector("#btnEnviarCalificacionDashboard");
  const textosCalificacion = {
    1: " Malo",
    2: " Regular",
    3: " Bueno",
    4: " Muy Bueno",
    5: " Excelente",
  };

  // Event listeners para las estrellas
  estrellas.forEach((estrella) => {
    estrella.addEventListener("click", () => {
      calificacionSeleccionada = parseInt(estrella.dataset.valor);
      actualizarEstrellas();
      textoCalificacion.textContent =
        textosCalificacion[calificacionSeleccionada];
      textoCalificacion.className = "text-lg font-semibold text-yellow-500";
      btnEnviar.disabled = false;
    });

    estrella.addEventListener("mouseenter", () => {
      const valor = parseInt(estrella.dataset.valor);
      estrellas.forEach((e, index) => {
        if (index < valor) {
          e.classList.add("text-yellow-400");
          e.classList.remove("text-gray-300");
        } else {
          e.classList.add("text-gray-300");
          e.classList.remove("text-yellow-400");
        }
      });
    });
  });

  modal
    .querySelector("#sistemaEstrellasDashboard")
    .addEventListener("mouseleave", () => {
      actualizarEstrellas();
    });

  function actualizarEstrellas() {
    estrellas.forEach((estrella, index) => {
      if (index < calificacionSeleccionada) {
        estrella.classList.add("text-yellow-400");
        estrella.classList.remove("text-gray-300");
      } else {
        estrella.classList.add("text-gray-300");
        estrella.classList.remove("text-yellow-400");
      }
    });
  }

  // ========================================
  // Event listeners para los sliders de métricas
  // ========================================
  const sliderPuntualidad = modal.querySelector("#sliderPuntualidad");
  const sliderCalidad = modal.querySelector("#sliderCalidad");
  const sliderLimpieza = modal.querySelector("#sliderLimpieza");
  const sliderComunicacion = modal.querySelector("#sliderComunicacion");

  function actualizarSlider(slider, valorSpan) {
    const valor = slider.value;
    valorSpan.textContent = `${valor}%`;
    slider.style.background = `linear-gradient(to right, #3b82f6 ${valor}%, #e2e8f0 ${valor}%)`;
  }

  // Inicializar y agregar listeners
  [
    { slider: sliderPuntualidad, spanId: "valorPuntualidad" },
    { slider: sliderCalidad, spanId: "valorCalidad" },
    { slider: sliderLimpieza, spanId: "valorLimpieza" },
    { slider: sliderComunicacion, spanId: "valorComunicacion" },
  ].forEach(({ slider, spanId }) => {
    const valorSpan = modal.querySelector(`#${spanId}`);
    actualizarSlider(slider, valorSpan);
    slider.addEventListener("input", () => actualizarSlider(slider, valorSpan));
  });

  // Botón cancelar/omitir
  modal
    .querySelector("#btnCancelarCalificacionDashboard")
    .addEventListener("click", () => {
      modal.remove();
      // Recargar conversaciones
      cargarConversacionesDashboard();

      // Limpiar chat activo (con validación)
      const activeChat = document.getElementById("chat-activo-dashboard");
      const emptyState = document.getElementById("chat-vacio-dashboard");

      if (activeChat) activeChat.classList.add("hidden");
      if (emptyState) emptyState.classList.remove("hidden");
      conversacionActivaDashboard = null;
    });

  // Botón enviar calificación
  btnEnviar.addEventListener("click", async () => {
    const comentario = modal
      .querySelector("#comentarioCalificacionDashboard")
      .value.trim();

    // Obtener valores de las métricas DIRECTAMENTE del DOM
    const sliderP = modal.querySelector("#sliderPuntualidad");
    const sliderC = modal.querySelector("#sliderCalidad");
    const sliderL = modal.querySelector("#sliderLimpieza");
    const sliderCom = modal.querySelector("#sliderComunicacion");

    console.log("🔍 DEBUG - Valores DIRECTOS del DOM al hacer click:");
    console.log(
      "   #sliderPuntualidad:",
      sliderP ? sliderP.value : "NO ENCONTRADO",
    );
    console.log(
      "   #sliderCalidad:",
      sliderC ? sliderC.value : "NO ENCONTRADO",
    );
    console.log(
      "   #sliderLimpieza:",
      sliderL ? sliderL.value : "NO ENCONTRADO",
    );
    console.log(
      "   #sliderComunicacion:",
      sliderCom ? sliderCom.value : "NO ENCONTRADO",
    );

    const metricas = {
      puntualidad: parseInt(sliderP.value),
      calidad_trabajo: parseInt(sliderC.value),
      limpieza: parseInt(sliderL.value),
      comunicacion: parseInt(sliderCom.value),
    };

    console.log("📊 Objeto metricas creado:", metricas);

    btnEnviar.disabled = true;
    btnEnviar.innerHTML =
      '<span class="mdi mdi-loading mdi-spin"></span> Enviando...';

    try {
      const personaId = await obtenerPersonaIdActual();

      const payload = {
        id_intercambio: idIntercambio,
        id_persona_calificadora: personaId,
        id_persona_calificada: idPersonaCalificada,
        puntuacion: calificacionSeleccionada,
        comentario: comentario || null,
      };

      console.log(" Enviando calificación con payload:", payload);
      console.log(" Métricas de desempeño:", metricas);
      console.log("   Tipos:", {
        id_intercambio: typeof payload.id_intercambio,
        id_persona_calificadora: typeof payload.id_persona_calificadora,
        id_persona_calificada: typeof payload.id_persona_calificada,
        puntuacion: typeof payload.puntuacion,
      });

      const response = await fetch(`${API_BASE}/intercambios/calificar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        // ========================================
        // Guardar/Actualizar métricas de desempeño (promediadas correctamente)
        // Fórmula: nuevo_promedio = (promedio_actual * cantidad + nueva_calificacion) / (cantidad + 1)
        // ========================================
        try {
          // Primero obtenemos las métricas actuales del usuario calificado
          const metricasActualesRes = await fetch(
            `${API_BASE}/metricas/persona/${idPersonaCalificada}`,
          );
          const metricasActualesData = await metricasActualesRes.json();

          let nuevasMetricas = { ...metricas, cantidad_calificaciones: 1 };

          // Solo promediar si YA tiene calificaciones previas (cantidad_calificaciones > 0)
          if (
            metricasActualesRes.ok &&
            metricasActualesData.success &&
            metricasActualesData.data
          ) {
            const actuales = metricasActualesData.data;
            const cantidadAnterior = actuales.cantidad_calificaciones || 0;

            // Si es la primera calificación, solo guardar los nuevos valores
            if (cantidadAnterior === 0) {
              nuevasMetricas = { ...metricas, cantidad_calificaciones: 1 };
              console.log(
                "Primera calificación - guardando valores directos:",
                nuevasMetricas,
              );
            } else {
              // Si ya tiene calificaciones, calcular promedio ponderado
              const nuevaCantidad = cantidadAnterior + 1;
              nuevasMetricas = {
                puntualidad: Math.round(
                  (actuales.puntualidad * cantidadAnterior +
                    metricas.puntualidad) /
                    nuevaCantidad,
                ),
                calidad_trabajo: Math.round(
                  (actuales.calidad_trabajo * cantidadAnterior +
                    metricas.calidad_trabajo) /
                    nuevaCantidad,
                ),
                limpieza: Math.round(
                  (actuales.limpieza * cantidadAnterior + metricas.limpieza) /
                    nuevaCantidad,
                ),
                comunicacion: Math.round(
                  (actuales.comunicacion * cantidadAnterior +
                    metricas.comunicacion) /
                    nuevaCantidad,
                ),
                cantidad_calificaciones: nuevaCantidad,
              };
              console.log(
                `Métricas promediadas (${nuevaCantidad} calificaciones):`,
                nuevasMetricas,
              );
            }
          }

          // Guardar/Actualizar las métricas
          console.log("==========================================");
          console.log("📤 ENVIANDO MÉTRICAS AL SERVIDOR");
          console.log("🆔 ID Persona Calificada:", idPersonaCalificada);
          console.log("📊 Valores originales de sliders:");
          console.log("   sliderPuntualidad.value:", sliderPuntualidad.value);
          console.log("   sliderCalidad.value:", sliderCalidad.value);
          console.log("   sliderLimpieza.value:", sliderLimpieza.value);
          console.log("   sliderComunicacion.value:", sliderComunicacion.value);
          console.log(
            "📦 Objeto nuevasMetricas a enviar:",
            JSON.stringify(nuevasMetricas, null, 2),
          );
          console.log("==========================================");

          const metricasResponse = await fetch(
            `${API_BASE}/metricas/persona/${idPersonaCalificada}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(nuevasMetricas),
            },
          );

          const metricasResult = await metricasResponse.json();
          console.log("Métricas guardadas:", metricasResult);
        } catch (metricasError) {
          console.error(
            "Error al guardar métricas (no bloqueante):",
            metricasError,
          );
          // No bloqueamos el flujo si falla el guardado de métricas
        }

        modal.remove();

        // Crear estrellas SVG
        const crearEstrellaSVG = () => {
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#FFD700" stroke="#FFD700" stroke-width="1" style="display: inline-block; margin: 0 4px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>`;
        };

        // Generar estrellas según la calificación
        const estrellasHTML = Array(calificacionSeleccionada)
          .fill(0)
          .map(() => crearEstrellaSVG())
          .join("");

        // Modal de éxito minimalista (sustituyendo a Swal)
        const successModalHtml = `
                                <div id="exitoCalificacionModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.15s ease-out;">
                                    <div style="background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); max-width: 400px; width: 90%; text-align: center; overflow: hidden; animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);">
                                        <div style="padding: 32px 24px;">
                                            <div style="width: 56px; height: 56px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                                                <span class="iconify" data-icon="mdi:check-circle" style="font-size: 32px; color: #10b981;"></span>
                                            </div>
                                            <h3 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #0f172a;">¡Calificación enviada!</h3>
                                            <p style="margin: 0 0 24px; font-size: 14px; color: #64748b; line-height: 1.5;">
                                                Gracias por compartir tu experiencia con <strong style="color: #334155;">${nombrePersona}</strong>
                                            </p>

                                            <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px; display: inline-flex; gap: 6px; justify-content: center;">
                                                ${estrellasHTML}
                                            </div>

                                            <button id="btnCerrarExito" style="width: 100%; padding: 12px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                                                Continuar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <style>
                                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                                    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                                    #btnCerrarExito:hover { background: #059669; transform: translateY(-1px); box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3); }
                                    #btnCerrarExito:active { transform: scale(0.98); }
                                </style>
                            `;

        const successContainer = document.createElement("div");
        successContainer.innerHTML = successModalHtml;
        document.body.appendChild(successContainer);

        if (window.Iconify && typeof window.Iconify.scan === "function")
          window.Iconify.scan();

        await new Promise((resolve) => {
          const btn = document.getElementById("btnCerrarExito");
          btn.onclick = () => {
            successContainer.remove();
            resolve();
          };
          // Auto-cerrar después de 4 segundos
          setTimeout(() => {
            if (document.body.contains(successContainer)) {
              successContainer.remove();
              resolve();
            }
          }, 3500);
        });

        // Recargar conversaciones
        await cargarConversacionesDashboard();

        // Limpiar chat activo (con validación)
        const activeChat = document.getElementById("chat-activo-dashboard");
        const emptyState = document.getElementById("chat-vacio-dashboard");

        if (activeChat) activeChat.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");
        conversacionActivaDashboard = null;
      } else {
        modal.remove();

        Swal.fire({
          icon: "error",
          title: "Error al enviar calificación",
          html: `
                                <p style="color: #4b5563; font-size: 15px;">
                                    ${data.mensaje || "No se pudo enviar tu calificación"}
                                </p>
                            `,
          confirmButtonColor: "#ef4444",
          customClass: {
            popup: "rounded-lg shadow-2xl",
          },
        });

        btnEnviar.disabled = false;
        btnEnviar.textContent = "Enviar Calificación";
      }
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      modal.remove();

      Swal.fire({
        icon: "error",
        title: "Error de conexión",
        html: `
                            <div style="text-align: center;">
                                <p style="color: #4b5563; font-size: 15px; margin-bottom: 12px;">
                                    No se pudo conectar con el servidor
                                </p>
                                <p style="color: #6b7280; font-size: 13px;">
                                    Tu calificación no fue guardada. Por favor, intenta nuevamente.
                                </p>
                            </div>
                        `,
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: "rounded-lg shadow-2xl",
        },
      });

      btnEnviar.disabled = false;
      btnEnviar.textContent = "Enviar Calificación";
    }
  });
}

// Utilidades para Dashboard
function getInitialsDashboard(nombre) {
  if (!nombre) return "??";
  const parts = nombre.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nombre.substring(0, 2).toUpperCase();
}

function getColorClassDashboard(index) {
  const colors = [
    "bg-green-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  return colors[index % colors.length];
}

function formatearHoraDashboard(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function scrollToBottomDashboard() {
  const container = document.getElementById("mensajes-container-dashboard");
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 100);
}

// ============================================
// MENÚ CONTEXTUAL PARA MENSAJES (ACTUALIZADO)
// ============================================
let mensajeSeleccionadoId = null;
let mensajeSeleccionadoContenido = "";

function mostrarMenuContextual(
  event,
  messageId,
  messageContent,
  puedeEditar,
  puedeBorrarParaTodos,
  puedeBorrarParaMi,
) {
  event.preventDefault();

  const menu = document.getElementById("messageContextMenu");
  mensajeSeleccionadoId = messageId;
  mensajeSeleccionadoContenido = messageContent;

  // Actualizar opciones del menú basado en permisos
  const editarBtn = menu.querySelector('[data-action="editar"]');
  const borrarTodosBtn = menu.querySelector('[data-action="borrar-todos"]');
  const borrarMiBtn = menu.querySelector('[data-action="borrar-mi"]');

  if (editarBtn) editarBtn.style.display = puedeEditar ? "flex" : "none";
  if (borrarTodosBtn)
    borrarTodosBtn.style.display = puedeBorrarParaTodos ? "flex" : "none";
  if (borrarMiBtn)
    borrarMiBtn.style.display = puedeBorrarParaMi ? "flex" : "none";

  // Ajustar posición del menú para que no se salga de la pantalla
  const menuWidth = 200; // ancho aproximado del menú
  const windowWidth = window.innerWidth;
  let leftPosition = event.pageX;

  // Si el menú se saldría por la derecha, posicionarlo a la izquierda del cursor
  if (leftPosition + menuWidth > windowWidth) {
    leftPosition = event.pageX - menuWidth;
  }

  menu.style.left = leftPosition + "px";
  menu.style.top = event.pageY + "px";
  menu.classList.remove("hidden");

  return false;
}

// Cerrar menú contextual al hacer clic fuera
document.addEventListener("click", function (event) {
  const menu = document.getElementById("messageContextMenu");
  if (menu && !menu.contains(event.target)) {
    menu.classList.add("hidden");
  }
});

// Long-press para móvil (mantener pero pasar permisos reales cuando no los tenemos)
function agregarLongPressListeners() {
  const messages = document.querySelectorAll(".message-item");
  let longPressTimer;

  messages.forEach((msg) => {
    // Touch events para móvil
    msg.addEventListener(
      "touchstart",
      function (e) {
        const messageId = this.getAttribute("data-message-id");
        const messageContent = this.getAttribute("data-message-content");

        longPressTimer = setTimeout(() => {
          const touch = e.touches[0];
          // Si no conocemos permisos, mostramos todas las opciones posibles
          mostrarMenuContextual(
            {
              preventDefault: () => {},
              pageX: touch.pageX,
              pageY: touch.pageY,
            },
            messageId,
            messageContent,
            true,
            true,
            true,
          );
        }, 500);
      },
      { passive: true },
    );

    msg.addEventListener(
      "touchend",
      function () {
        clearTimeout(longPressTimer);
      },
      { passive: true },
    );

    msg.addEventListener(
      "touchmove",
      function () {
        clearTimeout(longPressTimer);
      },
      { passive: true },
    );
  });
}

// Editar mensaje (inicia el modo edición)
async function editarMensaje() {
  const menu = document.getElementById("messageContextMenu");
  menu.classList.add("hidden");

  iniciarEdicionMensaje(mensajeSeleccionadoId, mensajeSeleccionadoContenido);
}

// Eliminar mensaje (confirmación con opción para todos)
async function eliminarMensaje() {
  const menu = document.getElementById("messageContextMenu");
  menu.classList.add("hidden");

  await confirmarBorrarMensaje(mensajeSeleccionadoId, "todos");
}

// Limpiar intervalo al cambiar de vista
window.addEventListener("beforeunload", () => {
  if (mensajeriaInterval) {
    clearInterval(mensajeriaInterval);
  }
});
// Script simple: al hacer click en elementos con `data-view` actualiza la URL a `/home`, `/perfil`, etc.
(function () {
  function setPath(view, replace = false) {
    if (!view) return;
    const state = { view };
    try {
      const u = new URL(window.location.href);
      u.pathname = "/" + encodeURIComponent(view);
      if (replace) history.replaceState(state, "", u.toString());
      else history.pushState(state, "", u.toString());
    } catch (err) {
      const p = "/" + encodeURIComponent(view);
      if (replace) history.replaceState(state, "", p);
      else history.pushState(state, "", p);
    }
  }

  document.addEventListener("click", function (e) {
    const el = e.target.closest("[data-view]");
    if (!el) return;
    const view = el.getAttribute("data-view");
    // actualizar URL después de que otros handlers corran
    setTimeout(() => setPath(view), 0);
  });

  window.addEventListener("popstate", function (e) {
    const view =
      (e.state && e.state.view) ||
      (function () {
        try {
          const p = location.pathname.replace(/^\/+/, "").split("/")[0];
          return p || "";
        } catch (err) {
          return "";
        }
      })();
    if (!view) return;
    const target = document.querySelector('[data-view="' + view + '"]');
    if (target) target.click();
  });

  document.addEventListener("DOMContentLoaded", function () {
    // Al cargar, si la ruta es /home o similar, activar esa vista
    try {
      const p = location.pathname.replace(/^\/+/, "").split("/")[0];
      if (p && p !== "") {
        // establecer estado sin agregar al historial
        try {
          history.replaceState({ view: p }, "", window.location.href);
        } catch (e) {}
        const target = document.querySelector('[data-view="' + p + '"]');
        if (target) target.click();
      }
    } catch (e) {}
  });

  // Nota: usar rutas tipo `/home` puede generar 404 al recargar si el servidor
  // no está configurado para redirigir todas las rutas a `Descubrir.html`.
})();
/*
               LEGACY VIDEO CALL LOGIC REMOVED
               The old WebRTC-based video call system was replaced by Jitsi Meet.
               The logic for 'videoModal' and polling-based call notifications
               is now handled by the Jitsi integration at the end of this file.
            */

// ========================================
// AI CHAT ASSISTANT FUNCTIONALITY
// ========================================
(function initAiChat() {
  const aiChatBtn = document.getElementById("aiChatBtn");
  const aiChatModal = document.getElementById("aiChatModal");
  const aiChatClose = document.getElementById("aiChatClose");
  const aiChatForm = document.getElementById("aiChatForm");
  const aiChatInput = document.getElementById("aiChatInput");
  const aiChatMessages = document.getElementById("aiChatMessages");
  const aiChatSend = document.getElementById("aiChatSend");

  if (!aiChatBtn || !aiChatModal) {
    console.warn("AI Chat elements not found");
    return;
  }

  // n8n Webhook URL for the AI agent
  const N8N_WEBHOOK_URL =
    "http://localhost:5678/webhook/e198fe85-0b97-4d32-8a5a-889aa29cd142/chat";

  // Session ID for conversation memory
  let sessionId = localStorage.getItem("aiChatSessionId");
  if (!sessionId) {
    sessionId =
      "session_" + Date.now() + "_" + Math.random().toString(36).substring(7);
    localStorage.setItem("aiChatSessionId", sessionId);
  }

  // Toggle chat modal
  function toggleAiChat() {
    aiChatModal.classList.toggle("open");
    if (aiChatModal.classList.contains("open")) {
      aiChatInput.focus();
      scrollToBottom();
    }
  }

  // Close chat modal
  function closeAiChat() {
    aiChatModal.classList.remove("open");
  }

  // Scroll messages to bottom
  function scrollToBottom() {
    if (aiChatMessages) {
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
    }
  }

  // Add message to chat
  function addMessage(content, isUser = false) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `ai-message ${isUser ? "user" : "bot"}`;

    const icon = isUser ? "mdi:account" : "mdi:robot-happy";

    messageDiv.innerHTML = `
                        <div class="ai-message-avatar">
                            <span class="iconify" data-icon="${icon}"></span>
                        </div>
                        <div class="ai-message-bubble">${escapeHtmlAi(content)}</div>
                    `;

    aiChatMessages.appendChild(messageDiv);
    scrollToBottom();

    // Trigger Iconify to render new icons
    if (window.Iconify) {
      window.Iconify.scan(messageDiv);
    }
  }

  // Show typing indicator
  function showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.id = "aiTypingIndicator";
    typingDiv.className = "ai-message bot";
    typingDiv.innerHTML = `
                        <div class="ai-message-avatar">
                            <span class="iconify" data-icon="mdi:robot-happy"></span>
                        </div>
                        <div class="ai-typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    `;
    aiChatMessages.appendChild(typingDiv);
    scrollToBottom();

    if (window.Iconify) {
      window.Iconify.scan(typingDiv);
    }
  }

  // Hide typing indicator
  function hideTypingIndicator() {
    const typingDiv = document.getElementById("aiTypingIndicator");
    if (typingDiv) {
      typingDiv.remove();
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtmlAi(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/\n/g, "<br>");
  }

  // ========================================
  // TEXT-TO-SPEECH (AI Voice Response)
  // ========================================
  let isSpeaking = false;
  let currentUtterance = null;
  let isMuted = localStorage.getItem("aiChatMuted") === "true";

  // Check if speech synthesis is available
  const speechSynthesis = window.speechSynthesis;

  // Speaker toggle button
  const aiChatSpeakerToggle = document.getElementById("aiChatSpeakerToggle");

  // Initialize mute state UI
  if (aiChatSpeakerToggle) {
    updateSpeakerIcon();

    aiChatSpeakerToggle.addEventListener("click", function () {
      isMuted = !isMuted;
      localStorage.setItem("aiChatMuted", isMuted);
      updateSpeakerIcon();

      // If muting, stop any current speech
      if (isMuted) {
        stopSpeaking();
      }
    });
  }

  function updateSpeakerIcon() {
    if (!aiChatSpeakerToggle) return;
    const icon = aiChatSpeakerToggle.querySelector(".iconify");
    if (icon) {
      icon.setAttribute(
        "data-icon",
        isMuted ? "mdi:volume-off" : "mdi:volume-high",
      );
      if (window.Iconify) {
        window.Iconify.scan(aiChatSpeakerToggle);
      }
    }
    aiChatSpeakerToggle.classList.toggle("muted", isMuted);
    aiChatSpeakerToggle.title = isMuted ? "Voz desactivada" : "Voz activada";
  }

  // Function to speak text with natural pauses
  async function speakText(text) {
    // Check if muted
    if (isMuted) {
      console.log("🔇 Voice muted, skipping speech");
      return;
    }

    if (!speechSynthesis) {
      console.warn("Speech synthesis not supported");
      return;
    }

    // Stop any current speech
    stopSpeaking();

    // Clean text
    let cleanText = text
      .replace(/<[^>]*>/g, "")
      .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, "")
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, "")
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "")
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      .replace(/👋|🤖|✨|💡|🎯|📚|💻|🔍|✅| /g, "")
      .replace(/&amp;/g, "y")
      .replace(/&lt;/g, "")
      .replace(/&gt;/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .replace(/\*/g, "") // Remove asterisks common in MD
      .replace(/#/g, "") // Remove hashes
      .trim();

    if (!cleanText) return;

    // Split into sentences for better rhythm
    // Split by period, question mark, exclamation, or newline, but keep the delimiter
    const sentences = cleanText.match(/[^.?!;\n]+[.?!;\n]*/g) || [cleanText];

    // Identify best voice once
    const voices = speechSynthesis.getVoices();
    let selectedVoice = null;
    const langCode =
      localStorage.getItem("skillconnect_language") === "en"
        ? "en-US"
        : "es-ES";

    const langVoices = voices.filter((v) =>
      v.lang.startsWith(langCode.substring(0, 2)),
    );

    if (langVoices.length > 0) {
      // High quality voices priority
      const preferredNames = [
        "Microsoft Sabina",
        "Microsoft Helena",
        "Microsoft Laura",
        "Google español",
        "Microsoft Zira",
        "Microsoft Aria",
        "Google US English",
      ];
      for (const name of preferredNames) {
        selectedVoice = langVoices.find((v) => v.name.includes(name));
        if (selectedVoice) break;
      }
      if (!selectedVoice) {
        selectedVoice = langVoices.find((v) =>
          v.name.toLowerCase().includes("natural"),
        );
      }
    }

    // Speak sentences sequentially
    isSpeaking = true;

    for (const phrase of sentences) {
      if (!isSpeaking) break; // Allow interruption

      const utterance = new SpeechSynthesisUtterance(phrase.trim());
      utterance.lang = langCode;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Slight variations for naturalness
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      // Create a promise to wait for this sentence to finish
      await new Promise((resolve) => {
        utterance.onend = resolve;
        utterance.onerror = resolve; // Continue even if error
        speechSynthesis.speak(utterance);
      });

      // Small pause between sentences (native API doesn't do this well automatically)
      if (isSpeaking) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    isSpeaking = false;
    console.log("🔇 Finished speaking sequence");
  }

  // Function to stop speaking
  function stopSpeaking() {
    if (speechSynthesis && isSpeaking) {
      speechSynthesis.cancel();
      isSpeaking = false;
    }
  }

  // Preload voices (some browsers need this)
  if (speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
      speechSynthesis.getVoices();
    };
  }

  // Send message to n8n webhook
  async function sendMessageToAi(message) {
    // Disable input while sending
    aiChatInput.disabled = true;
    aiChatSend.disabled = true;

    // Show typing indicator
    showTypingIndicator();

    try {
      // Get current user ID for context
      const usuarioId = localStorage.getItem("usuarioId") || null;

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: message, // Required by default n8n AI Agent node
          mensaje: message,
          message: message,
          usuarioId: usuarioId,
          sessionId: sessionId,
          action: "sendMessage",
        }),
      });

      hideTypingIndicator();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get text first to debug and handle potential non-JSON responses or multiple JSONs
      const rawText = await response.text();
      console.log("🤖 Raw AI Response:", rawText);

      let aiResponse = "";

      try {
        // Try parsing as standard single JSON first
        const data = JSON.parse(rawText);
        if (data.output) aiResponse = data.output;
        else if (data.response) aiResponse = data.response;
        else if (data.text) aiResponse = data.text;
        else if (data.message) aiResponse = data.message;
        else if (typeof data === "string") aiResponse = data;
        else aiResponse = JSON.stringify(data);
      } catch (e) {
        // If standard parse fails, check if it's multiple JSON objects (NDJSON/Streaming)
        console.log("Standard JSON parse failed, trying stream parsing...");

        const lines = rawText.split("\n").filter((line) => line.trim());
        if (lines.length > 0) {
          let accumulatedText = "";
          let validJsonFound = false;

          for (const line of lines) {
            try {
              const lineData = JSON.parse(line);
              // Handle n8n streaming format: {"type":"item","content":"..."}
              if (lineData.content) {
                accumulatedText += lineData.content;
                validJsonFound = true;
              } else if (lineData.output) {
                accumulatedText += lineData.output;
                validJsonFound = true;
              }
            } catch (err) {
              // Ignore parsing errors for individual lines (interstitial noise)
            }
          }

          if (validJsonFound && accumulatedText) {
            aiResponse = accumulatedText;
          } else {
            // Fallback: Use raw text if no structured data could be extracted
            console.warn(
              "Could not extract structured data from stream, using raw text",
            );
            aiResponse = rawText;
          }
        } else {
          aiResponse = rawText;
        }
      }

      // Final cleanup of response
      if (!aiResponse) aiResponse = "Lo siento, recibí una respuesta vacía.";

      addMessage(aiResponse, false);

      // 🔊 SPEAK THE RESPONSE
      speakText(aiResponse);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      hideTypingIndicator();

      // Show a friendly error message
      let errorMsg =
        "Lo siento, hubo un problema al conectar con el asistente. ";
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        errorMsg +=
          "Por favor verifica que el servidor n8n esté activo en http://localhost:5678";
      } else {
        errorMsg += "Por favor intenta de nuevo.";
      }
      addMessage(errorMsg, false);

      // Also speak error
      speakText(errorMsg);
    } finally {
      // Re-enable input
      aiChatInput.disabled = false;
      aiChatSend.disabled = false;
      aiChatInput.focus();
    }
  }

  // Handle form submission
  function handleSubmit(e) {
    e.preventDefault();

    const message = aiChatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, true);

    // Clear input
    aiChatInput.value = "";

    // Send to AI
    sendMessageToAi(message);
  }

  // ========================================
  // SPEECH RECOGNITION (Voice Input)
  // ========================================
  const aiChatMic = document.getElementById("aiChatMic");
  let recognition = null;
  let isRecording = false;

  // Check for Web Speech API support
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition && aiChatMic) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "es-ES"; // Spanish by default

    // Try to match the current language
    try {
      const currentLang = localStorage.getItem("skillconnect_language") || "es";
      recognition.lang = currentLang === "en" ? "en-US" : "es-ES";
    } catch (e) {
      recognition.lang = "es-ES";
    }

    recognition.onstart = function () {
      isRecording = true;
      aiChatMic.classList.add("recording");
      aiChatInput.classList.add("listening");
      aiChatInput.placeholder = "🎤 Escuchando...";
      console.log("🎤 Voice recognition started");
    };

    recognition.onresult = function (event) {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Show interim results in input field
      if (interimTranscript) {
        aiChatInput.value = interimTranscript;
      }

      // When we have final results, use them
      if (finalTranscript) {
        aiChatInput.value = finalTranscript;
      }
    };

    recognition.onerror = function (event) {
      console.error("Speech recognition error:", event.error);
      stopRecording();

      let errorMsg = "";
      switch (event.error) {
        case "no-speech":
          errorMsg = "No se detectó voz. Intenta de nuevo.";
          break;
        case "audio-capture":
          errorMsg = "No se encontró micrófono. Verifica tu dispositivo.";
          break;
        case "not-allowed":
          errorMsg =
            "Permiso de micrófono denegado. Habilítalo en la configuración del navegador.";
          break;
        default:
          errorMsg = "Error de reconocimiento de voz: " + event.error;
      }

      // Show error in input temporarily
      aiChatInput.placeholder = errorMsg;
      setTimeout(() => {
        aiChatInput.placeholder = "Escribe o habla tu mensaje...";
      }, 3000);
    };

    recognition.onend = function () {
      stopRecording();

      // If we have text, optionally auto-send
      const message = aiChatInput.value.trim();
      if (message) {
        // Auto-send the voice message
        addMessage(message, true);
        aiChatInput.value = "";
        sendMessageToAi(message);
      }
    };

    function startRecording() {
      if (!recognition || isRecording) return;

      try {
        recognition.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
      }
    }

    function stopRecording() {
      isRecording = false;
      aiChatMic.classList.remove("recording");
      aiChatInput.classList.remove("listening");
      aiChatInput.placeholder = "Escribe o habla tu mensaje...";

      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Already stopped
        }
      }
    }

    function toggleRecording() {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }

    // Mic button click
    aiChatMic.addEventListener("click", function (e) {
      e.preventDefault();
      toggleRecording();
    });

    console.log("🎤 Voice input enabled");
  } else if (aiChatMic) {
    // Hide mic button if speech recognition not supported
    aiChatMic.style.display = "none";
    console.warn("Web Speech API not supported in this browser");
  }

  // Event listeners
  aiChatBtn.addEventListener("click", toggleAiChat);
  aiChatClose.addEventListener("click", closeAiChat);
  aiChatForm.addEventListener("submit", handleSubmit);

  // Close on clicking outside
  document.addEventListener("click", function (e) {
    if (
      aiChatModal.classList.contains("open") &&
      !aiChatModal.contains(e.target) &&
      !aiChatBtn.contains(e.target)
    ) {
      closeAiChat();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && aiChatModal.classList.contains("open")) {
      closeAiChat();
    }
  });

  console.log("✅ AI Chat Assistant initialized");
})();

// =============================================================================
// VIDEOLLAMADAS CON JITSI MEET
// =============================================================================
(function initJitsiVideoCall() {
  "use strict";

  // Variables globales para Jitsi
  let jitsiApi = null;
  let currentJitsiRoomId = null;
  let pendingIncomingCall = null;

  // Generar ID de sala limpio (solo alfanumérico)
  function generarJitsiRoomId(idConversacion) {
    // Ejemplo: SkillConnect73829ad8
    const randomStr = Math.random().toString(36).substring(2, 12);
    return `SkillConnect${idConversacion}${randomStr}`; // Sin guiones ni guiones bajos
  }

  // Iniciar videollamada (cuando el usuario hace clic en el botón de video)
  window.iniciarVideollamadaJitsi = async function () {
    if (!window.conversacionActivaDashboard) {
      alert("Selecciona una conversación primero");
      return;
    }

    const conv = window.conversacionActivaDashboard;
    const roomId = generarJitsiRoomId(conv.id_conversacion);
    currentJitsiRoomId = roomId;

    // Obtener nombre del usuario actual
    let nombreUsuario = "Usuario";
    try {
      // Intentar obtener el nombre del usuario actual
      nombreUsuario = window.usuarioActualNombre || "Usuario SkillConnect";
    } catch (e) {
      console.warn("No se pudo obtener nombre de usuario:", e);
    }

    // Enviar notificación de llamada al otro usuario via SISTEMA DE SEÑALIZACIÓN (no chat)
    try {
      const personaIdRaw = await obtenerPersonaIdActual();
      const personaId = parseInt(personaIdRaw, 10);

      // Asegurar ID de receptor correcto buscando en varias propiedades posibles
      const receptorIdRaw =
        conv.id_contacto ||
        conv.id_persona_contacto ||
        conv.id_persona ||
        conv.receiver_id;
      const receptorId = parseInt(receptorIdRaw, 10);

      if (!receptorId || isNaN(receptorId) || !personaId || isNaN(personaId)) {
        console.error("[JITSI ERROR] IDs inválidos:", {
          personaId,
          receptorId,
          conv,
        });
        alert(
          "No se pudo iniciar la llamada: Error de identificación de usuarios.",
        );
        return;
      }

      console.log("[JITSI] Enviando señal de llamada a ID:", receptorId);

      // POST /api/call-signals/send
      // id_mensaje = null (no vinculamos a un mensaje de chat visible)
      await fetch(`${window.APP_CONFIG.BACKEND_URL}/api/call-signals/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_mensaje: null,
          room_id: roomId,
          signal_type: "call_notification",
          sender_id: personaId,
          receiver_id: receptorId,
          payload: JSON.stringify({
            caller_name: nombreUsuario,
            room_id: roomId,
          }),
        }),
      });
      console.log(
        "✅ Señal de videollamada enviada correctamenta a ID:",
        receptorId,
      );
    } catch (e) {
      console.error("Error enviando notificación de videollamada:", e);
      alert("Error al conectar la llamada. Revisa la consola.");
    }

    // Abrir modal y cargar Jitsi
    abrirJitsiModal(roomId, nombreUsuario, conv.nombre_contacto || "Contacto");
  };

  // --- POLLING para llamadas entrantes usando call-signals ---
  let callNotificationPollInterval = null;

  async function startCallNotificationPolling() {
    // Solo hacer polling si estamos logueados
    let personaId = 0;
    try {
      const pid = await obtenerPersonaIdActual();
      personaId = parseInt(pid, 10);
    } catch (e) {
      return;
    }

    if (!personaId || isNaN(personaId)) return;

    console.log("[JITSI] Iniciando polling de llamadas para ID:", personaId);

    // Limpiar intervalo anterior si existe
    if (callNotificationPollInterval) {
      clearInterval(callNotificationPollInterval);
    }

    // Polling cada 3 segundos
    callNotificationPollInterval = setInterval(async () => {
      try {
        // GET /api/call-signals/notification/:receiver_id
        const resp = await fetch(
          `${window.APP_CONFIG.BACKEND_URL}/api/call-signals/notification/${personaId}`,
        );
        if (!resp.ok) return;

        const json = await resp.json();

        // Si hay llamada entrante pendiente
        if (json.success && json.has_incoming_call && json.data) {
          const notif = json.data;
          console.log("[JITSI] 📞 ¡Llamada entrante detectada!", notif);

          // Evitar procesar la misma señal múltiples veces si ya estamos en una llamada
          if (currentJitsiRoomId || pendingIncomingCall) return;

          // Marcar como procesada INMEDIATAMENTE para que deje de salir en el polling
          await fetch(
            `${window.APP_CONFIG.BACKEND_URL}/api/call-signals/mark-processed`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ signal_ids: [notif.id] }),
            },
          );

          // Parsear payload
          let payload = {};
          try {
            payload = JSON.parse(notif.payload || "{}");
          } catch (e) {}

          const callerName =
            payload.caller_name || notif.caller_name || "Desconocido";
          const incomingRoomId = notif.room_id;

          // Mostrar notificación UI
          detectarLlamadaEntrante(
            `📹 VIDEOLLAMADA::${incomingRoomId}::${callerName}`,
            callerName,
          );
        }
      } catch (err) {
        // Silencioso para no saturar consola
        // console.warn('Error polling call notifications:', err);
      }
    }, 3000);
  }

  // Iniciar polling al cargar
  setTimeout(startCallNotificationPolling, 2000);

  // Abrir el modal de Jitsi y crear la instancia
  function abrirJitsiModal(roomId, nombreUsuario, nombreContacto) {
    const modal = document.getElementById("jitsiVideoModal");
    const container = document.getElementById("jitsiMeetContainer");
    const statusEl = document.getElementById("jitsiCallStatus");

    if (!modal || !container) {
      console.error("No se encontró el modal de Jitsi");
      return;
    }

    // Limpiar instancia anterior si existe
    if (jitsiApi) {
      try {
        jitsiApi.dispose();
      } catch (e) {}
      jitsiApi = null;
    }

    // Limpiar contenedor
    container.innerHTML = "";

    // Mostrar modal
    modal.classList.remove("hidden");
    statusEl.textContent = `Conectando con ${nombreContacto}...`;

    // Crear instancia de Jitsi con configuración compatible
    try {
      // Usar alpha.jitsi.net que es una instancia de pruebas comunitaria
      // Suele tener menos restricciones de autenticación que meet.jit.si
      const domain = "alpha.jitsi.net";

      // Log para debug
      console.log("[JITSI] Conectando a:", domain, "Sala:", roomId);

      jitsiApi = new JitsiMeetExternalAPI(domain, {
        roomName: roomId,
        parentNode: container,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: nombreUsuario,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          // Habilitar prejoin es CLAVE para evitar el error membersOnly en muchas ocasiones
          prejoinPageEnabled: true,
          // Deshabilitar lobby explícitamente
          enableLobby: false,
          // Deshabilitar características que requieren auth
          enableRecording: false,
          enableLiveStreaming: false,
        },
        interfaceConfigOverwrite: {
          // Ocultar elementos que distraen
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_ALWAYS_VISIBLE: true,
        },
      });

      // Eventos de Jitsi
      jitsiApi.on("videoConferenceJoined", () => {
        console.log("✅ Conectado a la videollamada");
        statusEl.textContent = `En llamada con ${nombreContacto}`;
      });

      jitsiApi.on("videoConferenceLeft", () => {
        console.log("📞 Videollamada terminada");
        cerrarVideollamadaJitsi();
      });

      jitsiApi.on("participantJoined", (participant) => {
        console.log("👤 Participante se unió:", participant.displayName);
        statusEl.textContent = `En llamada con ${participant.displayName || nombreContacto}`;
      });

      jitsiApi.on("participantLeft", () => {
        console.log("👤 Participante salió");
      });

      jitsiApi.on("readyToClose", () => {
        cerrarVideollamadaJitsi();
      });
    } catch (error) {
      console.error("Error creando instancia de Jitsi:", error);
      container.innerHTML = `
                <div class="flex items-center justify-center h-full text-white text-center p-8">
                    <div>
                        <p class="text-xl font-bold mb-2">Error al iniciar videollamada</p>
                        <p class="text-gray-400">${error.message}</p>
                    </div>
                </div>
            `;
    }
  }

  // Cerrar videollamada
  window.cerrarVideollamadaJitsi = function () {
    const modal = document.getElementById("jitsiVideoModal");

    if (jitsiApi) {
      try {
        jitsiApi.dispose();
      } catch (e) {}
      jitsiApi = null;
    }

    if (modal) {
      modal.classList.add("hidden");
    }

    currentJitsiRoomId = null;
    console.log("📞 Videollamada cerrada");
  };

  // Copiar enlace de la videollamada
  window.copiarEnlaceVideollamada = function () {
    if (!currentJitsiRoomId) {
      alert("No hay una videollamada activa");
      return;
    }

    const enlace = `https://meet.jit.si/${currentJitsiRoomId}`;

    navigator.clipboard
      .writeText(enlace)
      .then(() => {
        // Cambiar texto del botón temporalmente
        const btn = document.getElementById("jitsiCopyLinkBtn");
        if (btn) {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = `<span class="iconify" data-icon="mdi:check" data-width="16"></span><span>¡Copiado!</span>`;
          setTimeout(() => {
            btn.innerHTML = originalHTML;
          }, 2000);
        }
        console.log("📋 Enlace copiado:", enlace);
      })
      .catch((err) => {
        // Fallback: mostrar enlace en un prompt
        prompt("Copia este enlace para compartir:", enlace);
      });
  };

  // Detectar mensajes de videollamada entrante
  window.detectarLlamadaEntrante = function (mensaje, nombreRemitente) {
    // Formato: 📹 VIDEOLLAMADA::roomId::nombreUsuario
    if (mensaje && mensaje.startsWith("📹 VIDEOLLAMADA::")) {
      const partes = mensaje.split("::");
      if (partes.length >= 2) {
        const roomId = partes[1];
        const callerName = partes[2] || nombreRemitente || "Usuario";

        pendingIncomingCall = { roomId, callerName };
        mostrarNotificacionLlamada(callerName);
        return true;
      }
    }
    return false;
  };

  // Mostrar notificación de llamada entrante
  function mostrarNotificacionLlamada(callerName) {
    // Usar el nuevo sistema Toast en lugar del HTML antiguo
    Toast.call(
      callerName,
      () => {
        // Callback Contestar
        if (pendingIncomingCall) {
          const { roomId } = pendingIncomingCall;
          const nombreUsuario = window.usuarioActualNombre || "Usuario";
          currentJitsiRoomId = roomId;
          abrirJitsiModal(roomId, nombreUsuario, callerName);
          pendingIncomingCall = null;
        }
      },
      () => {
        // Callback Rechazar
        pendingIncomingCall = null;
        console.log("📞 Llamada rechazada");
      },
    );

    // Auto-rechazar después de 30 segundos
    setTimeout(() => {
      if (pendingIncomingCall) {
        pendingIncomingCall = null;
        console.log("📞 Llamada expirada (timeout)");
      }
    }, 30000);
  }

  // Contestar llamada entrante
  window.contestarLlamadaEntrante = function () {
    const notification = document.getElementById("incomingCallNotification");

    if (pendingIncomingCall) {
      const { roomId, callerName } = pendingIncomingCall;

      // Ocultar notificación
      if (notification) {
        notification.classList.add("hidden");
      }

      // Obtener nombre del usuario
      const nombreUsuario = window.usuarioActualNombre || "Usuario";

      // Abrir Jitsi con el roomId recibido
      currentJitsiRoomId = roomId;
      abrirJitsiModal(roomId, nombreUsuario, callerName);

      pendingIncomingCall = null;
    }
  };

  // Rechazar llamada entrante
  window.rechazarLlamadaEntrante = function () {
    const notification = document.getElementById("incomingCallNotification");

    if (notification) {
      notification.classList.add("hidden");
    }

    pendingIncomingCall = null;
    console.log("📞 Llamada rechazada");
  };

  // Conectar el botón de videollamada existente en el header del chat
  document.addEventListener("click", function (e) {
    const videoBtn = e.target.closest("#VideoLlamada");
    if (videoBtn) {
      e.preventDefault();
      iniciarVideollamadaJitsi();
    }
  });

  // Escuchar mensajes nuevos para detectar llamadas entrantes
  // Esto se integrará con el sistema de polling existente
  const originalMostrarMensajes = window.mostrarMensajesDashboard;
  if (typeof originalMostrarMensajes === "function") {
    window.mostrarMensajesDashboard = function (mensajes) {
      // Log para depuración
      // console.log('[JITSI DEBUG] Polling hooks - mensajes recibidos:', mensajes?.length);

      // Verificar si hay mensajes de videollamada nuevos
      if (Array.isArray(mensajes) && mensajes.length > 0) {
        const ultimoMensaje = mensajes[mensajes.length - 1];

        if (ultimoMensaje && ultimoMensaje.contenido) {
          // Intentar obtener ID de usuario actual de varias fuentes
          let personaIdActual = window.usuarioActualPersonaId;

          // Si es undefined, intentar parsear de localStorage o JWT si existe
          if (!personaIdActual) {
            try {
              const u = JSON.parse(
                localStorage.getItem("usuario_actual") || "{}",
              );
              personaIdActual = u.id || u.id_persona;
            } catch (e) {}
          }

          // console.log('[JITSI DEBUG] Último mensaje:', ultimoMensaje.contenido, 'De:', ultimoMensaje.id_persona_envia, 'Para mí:', personaIdActual);

          // Detectar si es mensaje de videollamada
          if (ultimoMensaje.contenido.startsWith("📹 VIDEOLLAMADA::")) {
            console.log(
              "[JITSI] Mensaje de videollamada detectado:",
              ultimoMensaje,
            );

            // Solo procesar si el mensaje es RECIENTE (menos de 2 minutos)
            // para evitar que suenen llamadas viejas al recargar
            const fechaMsg = new Date(ultimoMensaje.fecha_envio);
            const ahora = new Date();
            const diffMinutos = (ahora - fechaMsg) / 1000 / 60;

            if (diffMinutos > 2) {
              console.log(
                "[JITSI] Videollamada antigua ignorada (" +
                  diffMinutos.toFixed(1) +
                  " min)",
              );
            } else {
              // Validar ownership: si yo no lo envié, es para mí.
              // Convertir a string para comparar seguramente
              if (
                String(ultimoMensaje.id_persona_envia) !==
                String(personaIdActual)
              ) {
                console.log(
                  "[JITSI] ✅ Es una llamada entrante válida. Disparando notificación.",
                );
                detectarLlamadaEntrante(
                  ultimoMensaje.contenido,
                  ultimoMensaje.nombre_remitente,
                );
              } else {
                console.log("[JITSI] Ignorado: Es mi propia llamada saliente.");
              }
            }
          }
        }
      }
      // Llamar a la función original
      return originalMostrarMensajes.apply(this, arguments);
    };
  }

  console.log("✅ Jitsi Meet Video Call System initialized");
})();
