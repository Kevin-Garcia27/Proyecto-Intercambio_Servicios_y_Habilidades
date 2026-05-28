// Helper para traducciones
var t = (key) => {
  if (window.t_real && typeof window.t_real === 'function') return window.t_real(key);
  if (window.t && typeof window.t === 'function' && window.t !== t) return window.t(key);
  const fallbacks = {
    'users.showing': 'Mostrando',
    'users.of': 'De',
    'users.user': 'Usuario',
    'users.users': 'Usuarios'
  };
  return fallbacks[key] || key;
};

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const closeSidebar = document.getElementById("closeSidebar");
const usersGrid = document.getElementById("usersGrid");
const mainContent = document.getElementById("mainContent");
let cleanupMobileChatViewportHandlers = null;
let chatMessagesAbortController = null;
let chatMessagesRequestNonce = 0;

function syncAppHeaderHeight() {
  const header = document.querySelector("#mainContent > header");
  document.documentElement.style.setProperty("--app-vh", `${window.innerHeight}px`);
  if (!header) return;
  document.documentElement.style.setProperty(
    "--app-header-height",
    `${header.offsetHeight}px`,
  );
}

function syncVisualViewportHeight() {
  const layoutViewportHeight = window.innerHeight;
  document.documentElement.style.setProperty(
    "--app-vh",
    `${layoutViewportHeight}px`,
  );

  if (window.visualViewport) {
    const vv = window.visualViewport;
    const visualViewportHeight = Math.round(vv.height);
    const keyboardOffset = Math.max(
      0,
      Math.round(layoutViewportHeight - (vv.height + vv.offsetTop)),
    );

    document.documentElement.style.setProperty(
      "--visual-vh",
      `${visualViewportHeight}px`,
    );
    document.documentElement.style.setProperty(
      "--chat-keyboard-offset",
      `${keyboardOffset}px`,
    );
    return;
  }

  document.documentElement.style.setProperty(
    "--visual-vh",
    `${layoutViewportHeight}px`,
  );
  document.documentElement.style.setProperty("--chat-keyboard-offset", "0px");
}

function setupMobileChatViewportFixes() {
  if (cleanupMobileChatViewportHandlers) {
    cleanupMobileChatViewportHandlers();
    cleanupMobileChatViewportHandlers = null;
  }

  const mensajesView = document.getElementById("mensajesView");
  const input = document.getElementById("message-input-dashboard");
  const messagesContainer = document.getElementById("mensajes-container-dashboard");
  const chatHeader = document.getElementById("chat-header-dashboard");

  if (!mensajesView || !input) return;

  let blurTimer = null;

  const isMobile = () => window.innerWidth <= 767;
  const isMensajesActive = () =>
    document.body.classList.contains("mensajes-open") ||
    mensajesView.classList.contains("active");

  const setKeyboardOffset = (value) => {
    const safeValue = Math.max(0, Math.round(Number(value) || 0));
    document.documentElement.style.setProperty(
      "--chat-keyboard-offset",
      `${safeValue}px`,
    );
  };

  const getKeyboardOffset = () => {
    if (!isMobile() || !window.visualViewport) return 0;
    const vv = window.visualViewport;
    return Math.max(0, Math.round(window.innerHeight - (vv.height + vv.offsetTop)));
  };

  const scrollBottomIfChatOpen = () => {
    const chatLayout = document.getElementById("chat-layout-dashboard");
    if (!chatLayout || !chatLayout.classList.contains("mobile-show-chat")) return;
    scrollToBottomDashboard();
  };

  const syncChatViewportState = () => {
    if (!isMobile() || !isMensajesActive()) {
      setKeyboardOffset(0);
      document.documentElement.classList.remove("chat-typing");
      document.body.classList.remove("chat-typing");
      mensajesView.classList.remove("mobile-chat-keyboard-open");
      syncVisualViewportHeight();
      return;
    }

    const keyboardOffset = getKeyboardOffset();
    const keyboardOpen = keyboardOffset > 80 || document.activeElement === input;
    setKeyboardOffset(keyboardOffset);

    if (keyboardOpen) {
      document.documentElement.classList.add("chat-typing");
      document.body.classList.add("chat-typing");
      mensajesView.classList.add("mobile-chat-keyboard-open");
    } else if (document.activeElement !== input) {
      document.documentElement.classList.remove("chat-typing");
      document.body.classList.remove("chat-typing");
      mensajesView.classList.remove("mobile-chat-keyboard-open");
    }

    syncVisualViewportHeight();
  };

  const onViewportChange = () => {
    syncChatViewportState();
    setTimeout(() => {
      scrollBottomIfChatOpen();
    }, 70);
  };

  const onInputFocus = () => {
    if (!isMobile()) return;
    if (!isMensajesActive()) return;
    clearTimeout(blurTimer);
    document.documentElement.classList.add("mensajes-open");
    document.body.classList.add("mensajes-open");
    syncChatViewportState();
    setTimeout(() => {
      onViewportChange();
    }, 90);
    setTimeout(() => {
      scrollBottomIfChatOpen();
    }, 220);
  };

  const onInputBlur = () => {
    if (!isMobile()) return;
    blurTimer = setTimeout(() => {
      if (document.activeElement === input) return;
      document.documentElement.classList.remove("chat-typing");
      document.body.classList.remove("chat-typing");
      mensajesView.classList.remove("mobile-chat-keyboard-open");
      setKeyboardOffset(0);
      syncVisualViewportHeight();
    }, 140);
  };

  const onInputType = () => {
    if (!isMobile()) return;
    if (!isMensajesActive()) return;
    setTimeout(() => {
      scrollBottomIfChatOpen();
    }, 40);
  };

  const onPointerOutsideInput = (event) => {
    if (!isMobile()) return;
    if (document.activeElement !== input) return;

    const target = event.target;
    if (
      target &&
      (target.closest("#chat-input-dashboard") ||
        target.closest("#attachments-preview-dashboard"))
    ) {
      return;
    }

    input.blur();
  };

  input.addEventListener("focus", onInputFocus);
  input.addEventListener("blur", onInputBlur);
  input.addEventListener("input", onInputType);
  input.addEventListener("click", onInputType);
  if (messagesContainer) {
    messagesContainer.addEventListener("pointerdown", onPointerOutsideInput);
  }
  if (chatHeader) {
    chatHeader.addEventListener("pointerdown", onPointerOutsideInput);
  }
  window.addEventListener("orientationchange", onViewportChange);

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", onViewportChange);
    window.visualViewport.addEventListener("scroll", onViewportChange);
  }

  syncChatViewportState();
  syncVisualViewportHeight();

  cleanupMobileChatViewportHandlers = () => {
    document.documentElement.classList.remove("chat-typing");
    document.body.classList.remove("chat-typing");
    mensajesView.classList.remove("mobile-chat-keyboard-open");
    setKeyboardOffset(0);
    syncVisualViewportHeight();
    input.removeEventListener("focus", onInputFocus);
    input.removeEventListener("blur", onInputBlur);
    input.removeEventListener("input", onInputType);
    input.removeEventListener("click", onInputType);
    if (messagesContainer) {
      messagesContainer.removeEventListener("pointerdown", onPointerOutsideInput);
    }
    if (chatHeader) {
      chatHeader.removeEventListener("pointerdown", onPointerOutsideInput);
    }
    window.removeEventListener("orientationchange", onViewportChange);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", onViewportChange);
      window.visualViewport.removeEventListener("scroll", onViewportChange);
    }
  };
}

window.addEventListener("resize", syncAppHeaderHeight);
window.addEventListener("load", syncAppHeaderHeight);

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

const POST_LOGIN_ONBOARDING_STORAGE_KEY = "semackro_post_login_onboarding";
const POST_LOGIN_ONBOARDING_SEEN_PREFIX = "semackro_onboarding_seen_user_";
const POST_LOGIN_ONBOARDING_DRIVER_KEY = "descubrir_post_login_onboarding_v1";
let onboardingPostLoginEnCurso = false;
let pendingProfileOnboardingTourStart = false;

function enviarTriggerTourPerfilAlIframe() {
  const iframe = document.getElementById("perfilIframe");
  if (!iframe || !iframe.contentWindow) return false;
  iframe.contentWindow.postMessage(
    {
      type: "startProfileOnboardingTour",
      source: "descubrirOnboarding",
    },
    window.location.origin,
  );
  return true;
}

function abrirPerfilYDispararTour() {
  pendingProfileOnboardingTourStart = true;
  closeSidebarFn();
  navigateTo("perfil");

  // Intento inmediato por si el iframe ya está cargado.
  setTimeout(() => {
    if (enviarTriggerTourPerfilAlIframe()) {
      pendingProfileOnboardingTourStart = false;
    }
  }, 220);
}

function onboardingForzadoPorQuery() {
  try {
    const url = new URL(window.location.href);
    const value = (url.searchParams.get("onboarding") || "").toLowerCase();
    return value === "1" || value === "true" || value === "yes";
  } catch (error) {
    return false;
  }
}

function limpiarQueryOnboarding() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("onboarding")) return;
    url.searchParams.delete("onboarding");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state || {}, "", nextUrl);
  } catch (error) {
    console.warn("No se pudo limpiar query de onboarding:", error);
  }
}

function obtenerUsuarioSesionOnboarding() {
  return String(localStorage.getItem("usuarioId") || "");
}

function obtenerClaveOnboardingMostradoUsuario() {
  const usuarioId = obtenerUsuarioSesionOnboarding();
  return `${POST_LOGIN_ONBOARDING_SEEN_PREFIX}${usuarioId || "anon"}`;
}

function fueMostradoOnboardingUsuarioActual() {
  try {
    return localStorage.getItem(obtenerClaveOnboardingMostradoUsuario()) === "1";
  } catch (error) {
    console.warn("No se pudo leer estado de onboarding mostrado:", error);
    return false;
  }
}

function marcarOnboardingMostradoUsuarioActual() {
  try {
    localStorage.setItem(obtenerClaveOnboardingMostradoUsuario(), "1");
  } catch (error) {
    console.warn("No se pudo guardar estado de onboarding mostrado:", error);
  }
}

async function obtenerEstadoOnboardingServidor() {
  try {
    const idPerfilPersona = await obtenerPersonaIdActual();
    if (!idPerfilPersona || !window.API_BASE) return false;

    const response = await fetch(
      `${window.API_BASE}/onboarding-drivers/${encodeURIComponent(idPerfilPersona)}/${encodeURIComponent(POST_LOGIN_ONBOARDING_DRIVER_KEY)}`,
    );

    if (!response.ok) return false;
    const data = await response.json();
    return !!(data && data.success && data.data && data.data.ejecutado === true);
  } catch (error) {
    console.warn("No se pudo consultar onboarding en servidor:", error);
    return false;
  }
}

async function marcarOnboardingMostradoServidor() {
  try {
    const idPerfilPersona = await obtenerPersonaIdActual();
    if (!idPerfilPersona || !window.API_BASE) return;

    await fetch(
      `${window.API_BASE}/onboarding-drivers/${encodeURIComponent(idPerfilPersona)}/${encodeURIComponent(POST_LOGIN_ONBOARDING_DRIVER_KEY)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ejecutado: true }),
      },
    );
  } catch (error) {
    console.warn("No se pudo guardar onboarding en servidor:", error);
  }
}

function leerBanderaOnboardingEn(storageRef) {
  try {
    if (!storageRef || typeof storageRef.getItem !== "function") return null;
    const raw = storageRef.getItem(POST_LOGIN_ONBOARDING_STORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (!data || data.pending !== true) return null;

    const usuarioSesion = obtenerUsuarioSesionOnboarding();
    const usuarioBandera = String(data.usuarioId || "");
    if (usuarioBandera && usuarioSesion && usuarioBandera !== usuarioSesion) {
      return null;
    }

    return data;
  } catch (error) {
    console.warn("No se pudo leer bandera de onboarding:", error);
    return null;
  }
}

function leerOnboardingPostLoginPendiente() {
  try {
    if (onboardingForzadoPorQuery()) return true;

    const banderaSession = leerBanderaOnboardingEn(sessionStorage);
    if (banderaSession) return true;

    const banderaLocal = leerBanderaOnboardingEn(localStorage);
    if (banderaLocal) return true;

    return !fueMostradoOnboardingUsuarioActual();
  } catch (error) {
    console.warn("No se pudo leer onboarding post-login:", error);
    return false;
  }
}

function limpiarOnboardingPostLoginPendiente() {
  try {
    sessionStorage.removeItem(POST_LOGIN_ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(POST_LOGIN_ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo limpiar onboarding post-login:", error);
  }
}

function obtenerDriverFactoryDescubrir() {
  if (window.driver && typeof window.driver === "function") return window.driver;
  if (window.driver && typeof window.driver.driver === "function") {
    return window.driver.driver;
  }
  if (
    window.driver &&
    window.driver.js &&
    typeof window.driver.js.driver === "function"
  ) {
    return window.driver.js.driver;
  }
  return null;
}

function iniciarTourOnboardingPerfil() {
  const hamburger = document.getElementById("hamburgerBtn");
  const perfilItem = document.querySelector('[data-view="perfil"]');

  if (!hamburger || !perfilItem) {
    abrirPerfilYDispararTour();
    return;
  }

  const createDriver = obtenerDriverFactoryDescubrir();
  if (!createDriver) {
    console.warn("Driver.js no está disponible. Redirigiendo al perfil.");
    openSidebar();
    setTimeout(() => {
      abrirPerfilYDispararTour();
    }, 260);
    return;
  }

  let activeStepIndex = 0;
  let autoAdvanceLock = false;
  let removeTourInteractionListeners = () => {};

  const moveToNextFromInteraction = (driverInstance) => {
    if (!driverInstance || autoAdvanceLock) return;
    autoAdvanceLock = true;
    setTimeout(() => {
      try {
        driverInstance.moveNext();
      } catch (error) {
        console.warn("No se pudo avanzar onboarding automaticamente:", error);
      } finally {
        autoAdvanceLock = false;
      }
    }, 180);
  };

  const tour = createDriver({
    steps: [
      {
        element: "#hamburgerBtn",
        popover: {
          title: "Paso 1: abre el menu",
          description:
            "Toca este boton para abrir el menu lateral. Si prefieres, tambien puedes usar Siguiente.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-view="perfil"]',
        popover: {
          title: "Paso 2: entra a tu perfil",
          description:
            "Desde aqui completas tu informacion. Toca Mi perfil para abrir esta seccion.",
          side: "right",
          align: "start",
        },
      },
    ],
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: "close",
    overlayOpacity: 0.55,
    stagePadding: 10,
    popoverOffset: 14,
    disableActiveInteraction: false,
    nextBtnText: "Siguiente",
    prevBtnText: "Atras",
    doneBtnText: "Ir a perfil",
    showButtons: ["previous", "next", "close"],
    onHighlighted: (_, __, options) => {
      activeStepIndex = options?.state?.activeIndex || 0;
    },
    onNextClick: (_, __, options) => {
      const index = options?.state?.activeIndex || 0;
      const total = (options?.config?.steps || []).length;

      if (index === 0) {
        openSidebar();
        setTimeout(() => {
          options.driver.moveNext();
        }, 260);
        return;
      }

      if (index >= total - 1) {
        abrirPerfilYDispararTour();
        options.driver.destroy();
        return;
      }

      options.driver.moveNext();
    },
    onPrevClick: (_, __, options) => {
      const index = options?.state?.activeIndex || 0;
      if (index <= 0) return;
      if (index === 1) {
        closeSidebarFn();
      }
      setTimeout(() => {
        options.driver.movePrevious();
      }, 120);
    },
    onCloseClick: (_, __, options) => {
      closeSidebarFn();
      options.driver.destroy();
    },
    onDestroyed: () => {
      removeTourInteractionListeners();
      closeSidebarFn();
    },
  });

  const onHamburgerClick = () => {
    if (activeStepIndex !== 0) return;
    openSidebar();
    moveToNextFromInteraction(tour);
  };

  const onPerfilClick = () => {
    if (activeStepIndex !== 1) return;
    abrirPerfilYDispararTour();
    try {
      tour.destroy();
    } catch (error) {
      console.warn("No se pudo cerrar onboarding automaticamente:", error);
    }
  };

  hamburger.addEventListener("click", onHamburgerClick, true);
  perfilItem.addEventListener("click", onPerfilClick, true);
  removeTourInteractionListeners = () => {
    hamburger.removeEventListener("click", onHamburgerClick, true);
    perfilItem.removeEventListener("click", onPerfilClick, true);
  };

  if (tour && typeof tour.drive === "function") {
    setTimeout(() => {
      tour.drive();
    }, 180);
    return;
  }

  abrirPerfilYDispararTour();
}

async function mostrarOnboardingPostLogin() {
  if (onboardingPostLoginEnCurso) return;
  if (!leerOnboardingPostLoginPendiente()) return;

  onboardingPostLoginEnCurso = true;

  try {
    const onboardingVistoEnServidor = await obtenerEstadoOnboardingServidor();
    if (onboardingVistoEnServidor) {
      marcarOnboardingMostradoUsuarioActual();
      limpiarOnboardingPostLoginPendiente();
      limpiarQueryOnboarding();
      return;
    }

    if (typeof Swal !== "undefined" && Swal && typeof Swal.fire === "function") {
      const result = await Swal.fire({
        title: "Completa tu perfil",
        html: "Es importante para nosotros que llenes ahora tu perfil para poder verificar tus datos, habilidades y mas.",
        imageUrl: "/MascotaDesicion.gif",
        imageWidth: 90,
        imageAlt: "Mascota de ayuda",
        showDenyButton: true,
        confirmButtonText: "Llenar informacion",
        denyButtonText: "Omitir por ahora",
        confirmButtonColor: "#2563eb",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCloseButton: false,
        reverseButtons: true,
        didOpen: () => {
          const confirmButton = Swal.getConfirmButton();
          if (confirmButton) {
            confirmButton.style.backgroundColor = "#2563eb";
            confirmButton.style.borderColor = "#2563eb";
          }
        },
      });

      if (result.isConfirmed) {
        await marcarOnboardingMostradoServidor();
        marcarOnboardingMostradoUsuarioActual();
        limpiarOnboardingPostLoginPendiente();
        limpiarQueryOnboarding();
        setTimeout(() => {
          iniciarTourOnboardingPerfil();
        }, 120);
        return;
      }

      if (result.isDenied) {
        await marcarOnboardingMostradoServidor();
        marcarOnboardingMostradoUsuarioActual();
        limpiarOnboardingPostLoginPendiente();
        limpiarQueryOnboarding();
        return;
      }

      return;
    }

    const quiereCompletar = window.confirm(
      "Antes de usar Descubrir, quieres completar tu perfil ahora?",
    );
    await marcarOnboardingMostradoServidor();
    marcarOnboardingMostradoUsuarioActual();
    limpiarOnboardingPostLoginPendiente();
    limpiarQueryOnboarding();
    if (quiereCompletar) {
      iniciarTourOnboardingPerfil();
    }
  } catch (error) {
    console.warn("No se pudo mostrar onboarding post-login:", error);
  } finally {
    onboardingPostLoginEnCurso = false;
  }
}

function intentarOnboardingPostLogin() {
  if (!leerOnboardingPostLoginPendiente()) return;
  window.requestAnimationFrame(() => {
    setTimeout(() => {
      mostrarOnboardingPostLogin();
    }, 140);
  });
}

setTimeout(() => {
  intentarOnboardingPostLogin();
}, 280);

window.addEventListener("load", () => {
  setTimeout(() => {
    intentarOnboardingPostLogin();
  }, 120);
});

window.addEventListener("focus", () => {
  setTimeout(() => {
    intentarOnboardingPostLogin();
  }, 80);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  setTimeout(() => {
    intentarOnboardingPostLogin();
  }, 80);
});

// Sistema de navegación SPA (Single Page Application)
let currentView = "descubrir";

async function navigateTo(viewName) {
  syncAppHeaderHeight();
  document.documentElement.classList.toggle("mensajes-open", viewName === "mensajes");
  document.body.classList.toggle("mensajes-open", viewName === "mensajes");
  if (viewName !== "mensajes") {
    document.documentElement.classList.remove("chat-typing");
    document.body.classList.remove("chat-typing");
  }

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
  if (viewName === "ordenesTrabajo") {
    console.log(' navigateTo("ordenesTrabajo") - Llamando a cargarOrdenesTrabajo()');
    cargarOrdenesTrabajo();
  }
  if (viewName === "mensajes") {
    setupMobileChatViewportFixes();

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
    if (cleanupMobileChatViewportHandlers) {
      cleanupMobileChatViewportHandlers();
      cleanupMobileChatViewportHandlers = null;
    }

    if (chatMessagesAbortController) {
      chatMessagesAbortController.abort();
      chatMessagesAbortController = null;
    }
    chatMessagesRequestNonce += 1;

    const mensajesView = document.getElementById("mensajesView");
    if (mensajesView) {
      mensajesView.classList.remove("mobile-chat-keyboard-open");
    }

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

  // Evitar locks globales persistentes de scroll fuera de overlays/sidebar móvil.
  const sidebarIsOpen = document.getElementById("sidebar")?.classList.contains("open");
  if (!sidebarIsOpen && viewName !== "mensajes") {
    document.body.style.overflow = "";
  }

  // Scroll al Descubrir
  if (viewName !== "mensajes") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (window.innerWidth <= 767) {
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  // Recalcular tras render para evitar desfases visuales por fuentes/cambios de layout.
  setTimeout(syncAppHeaderHeight, 0);
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
          <div class="custom-modal custom-modal-logout" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
                        <div class="modal-header">
              <div class="modal-icon modal-icon-logout" aria-hidden="true"><svg class="logout-title-svg" xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><path fill="#fcea2b" d="M32.294 14.233a3.892 3.892 0 0 1 6.706 0l20.12 40.142a4.5 4.5 0 0 1 .574 1.916a3.885 3.885 0 0 1-3.832 3.88H15.528a3.803 3.803 0 0 1-3.832-3.784a3.45 3.45 0 0 1 .575-1.916z"/><path fill="#d22f27" d="M35.854 39.049c0 1.505-2.728 3.81-2.728 5.991l-.06.188s-.322 1.428-1.39 1.428a1.3 1.3 0 0 1-.772-.325c-.262-.244-.6.13-.547.458c.16 1.31 3.023 5.521 5.17 5.521c2.456 0 4.629-2.945 4.822-3.985c0-.498-.834-.187-.834-.873c0-.582.507-.964.507-1.729a.41.41 0 0 0-.424-.378c-.191 0-.46.134-.674.134c-.82 0-1.007-.746-1.007-1.51c0 0 .154.05.154-1.58a5.9 5.9 0 0 0-1.422-3.493a.55.55 0 0 0-.357-.133c-.19 0-.438.084-.438.286"/><g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M29.548 52.622a8.3 8.3 0 0 0 5.936 2.332a8.84 8.84 0 0 0 6.02-2.332M27.69 50.224s-4.452-4.75-.212-11.025c0 0 .856 1.088 1.508 2.132c.486.56 1.367 1.515 1.833 1.515a1.004 1.004 0 0 0 1.018-1.102v-.382a15.5 15.5 0 0 1 1.526-7.293s2.969 1.611 1.697-6.191c0 0 6.763 4.558 6.509 12.106c0 .551.248.975.847.975c.59 0 2.388-.572 2.388-1.124c.042.043 2.671 5.555-1.06 10.389"/><path d="M33.079 45.118s-.298 1.641-1.488 1.527a2.7 2.7 0 0 1-.61-.245c-.328-.36-.674.084-.624.39a10.96 10.96 0 0 0 3.02 4.472s.93.685.98.685m2.609.063a12.4 12.4 0 0 0 1.547-1.048a6.84 6.84 0 0 0 1.806-2.487a.335.335 0 0 0-.297-.458a.78.78 0 0 1-.496-.458h0s-.1-.305.297-.992a1.6 1.6 0 0 0 .199-.916a.47.47 0 0 0-.645-.267a.96.96 0 0 1-1.29-.42s-.312-.153-.014-1.64a6 6 0 0 0-1.425-4.428a.55.55 0 0 0-.377-.133a.395.395 0 0 0-.417.286"/><path d="M32.294 14.233a3.892 3.892 0 0 1 6.706 0l20.12 40.142a4.5 4.5 0 0 1 .574 1.916a3.885 3.885 0 0 1-3.832 3.88H15.528a3.803 3.803 0 0 1-3.832-3.784a3.45 3.45 0 0 1 .575-1.916z"/></g></svg></div>
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
const API_BASE = window.APP_CONFIG?.API_BASE || `${window.BACKEND_URL}/api`;

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
const verificationStatusCache = new Map();

// Variable global para almacenar ID_Persona del usuario actual
let usuarioActualPersonaId = null;

function normalizarGenero(valorGenero) {
  const genero = (valorGenero || "").toString().trim().toLowerCase();
  if (!genero) return "";

  if (["femenino", "mujer", "female", "f"].includes(genero)) {
    return "femenino";
  }

  if (["masculino", "hombre", "male", "m"].includes(genero)) {
    return "masculino";
  }

  return "";
}

function obtenerClaseBannerPorGenero(valorGenero) {
  const genero = normalizarGenero(valorGenero);
  if (genero === "femenino") {
    return "bg-gradient-to-r from-pink-400 via-pink-500 to-fuchsia-500";
  }
  return "bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600";
}

function normalizarDisponibilidad(valorDisponibilidad) {
  const disponibilidad = (valorDisponibilidad || "")
    .toString()
    .trim()
    .toLowerCase();

  if (!disponibilidad) return "";

  if (["disponible", "available", "libre", "activo", "active"].includes(disponibilidad)) {
    return "disponible";
  }

  if (
    [
      "en obra",
      "en_obra",
      "ocupado",
      "busy",
      "trabajando",
      "no disponible",
      "no_disponible",
      "inactivo",
      "inactive",
    ].includes(disponibilidad)
  ) {
    return "en_obra";
  }

  return "";
}

function obtenerEstadoDisponibilidadCard(valorDisponibilidad) {
  const disponibilidad = normalizarDisponibilidad(valorDisponibilidad);

  if (disponibilidad === "disponible") {
    return {
      label: "Disponible",
      textColor: "#059669",
      dotColor: "#10b981",
    };
  }

  if (disponibilidad === "en_obra") {
    return {
      label: "En obra",
      textColor: "#b45309",
      dotColor: "#f59e0b",
    };
  }

  return {
    label: "Estado no definido",
    textColor: "#6b7280",
    dotColor: "#9ca3af",
  };
}

function normalizarEstadoVerificacion(valorEstado) {
  if (valorEstado === true || valorEstado === 1 || valorEstado === "1") {
    return "aprobada";
  }

  if (valorEstado === false || valorEstado === 0 || valorEstado === "0") {
    return "no_verificado";
  }

  const estado = (valorEstado || "").toString().trim().toLowerCase();
  if (!estado) return "";

  if (["aprobada", "aprobado", "verificado", "verified", "true"].includes(estado)) {
    return "aprobada";
  }

  if (["pendiente", "pending"].includes(estado)) {
    return "pendiente";
  }

  if (["rechazada", "rechazado", "denegada", "denegado", "no_verificado", "not_verified", "false"].includes(estado)) {
    return "no_verificado";
  }

  return estado;
}

function esPerfilVerificado(estadoVerificacion) {
  return normalizarEstadoVerificacion(estadoVerificacion) === "aprobada";
}

async function obtenerEstadoVerificacionPerfil(idPerfilPersona, estadoFallback = "") {
  const estadoLocal = normalizarEstadoVerificacion(estadoFallback);
  if (estadoLocal) {
    return estadoLocal;
  }

  const cacheKey = Number(idPerfilPersona);
  if (verificationStatusCache.has(cacheKey)) {
    return verificationStatusCache.get(cacheKey);
  }

  try {
    const res = await fetch(
      `${API_BASE}/verificacion-usuarios/perfil/${idPerfilPersona}`,
    );
    const data = await res.json().catch(() => ({}));
    const estado = normalizarEstadoVerificacion(
      data?.estado_verificacion || data?.estado || data?.verificacion || "",
    ) || "no_verificado";

    verificationStatusCache.set(cacheKey, estado);
    return estado;
  } catch (error) {
    console.warn(
      `No se pudo obtener estado de verificacion para el perfil ${idPerfilPersona}:`,
      error,
    );
    verificationStatusCache.set(cacheKey, "no_verificado");
    return "no_verificado";
  }
}

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
        const estadoVerificacion = await obtenerEstadoVerificacionPerfil(
          persona.id_Perfil_Persona,
          persona.estado_verificacion || persona.estadoVerificacion || persona.verificado,
        );

        if (!esPerfilVerificado(estadoVerificacion)) {
          return null;
        }

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
            persona.descripcionPerfil_Persona || "Usuario SEMACKRO",
          genero:
            persona.genero_Persona || persona.genero || persona.genero_Usuario || "",
          availability:
            persona.disponibilidad_Persona || persona.disponibilidad || "",
          location: location,
          skills: habilidades,
          bio: persona.descripcionPerfil_Persona || "Sin descripción",
          experienceYears: Number(
            persona.anios_experiencia || persona.anios_experiencia_Persona || 0,
          ),
          rating: rating,
          exchanges: exchanges,
          online: Math.random() > 0.5,
          avatar: persona.imagenUrl_Persona || null,
          avatarInitials: (persona.nombre_Persona || "U")[0].toUpperCase(),
          estadoVerificacion,
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
  const idsStats = [
    "usuarios-activos",
    "categorias-disponibles",
    "intercambios-exitosos",
  ];
  const hasStatsUI = idsStats.some((id) => document.getElementById(id));
  if (!hasStatsUI) return;

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
        const estadoVerificacion = await obtenerEstadoVerificacionPerfil(
          persona.id_Perfil_Persona,
          persona.estado_verificacion || persona.estadoVerificacion || persona.verificado,
        );

        if (!esPerfilVerificado(estadoVerificacion)) {
          return null;
        }

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
            persona.descripcionPerfil_Persona || "Usuario SEMACKRO",
          genero:
            persona.genero_Persona || persona.genero || persona.genero_Usuario || "",
          availability:
            persona.disponibilidad_Persona || persona.disponibilidad || "",
          location: location,
          skills: habilidades,
          bio: persona.descripcionPerfil_Persona || "Sin descripción",
          experienceYears: Number(
            persona.anios_experiencia || persona.anios_experiencia_Persona || 0,
          ),
          rating: rating,
          exchanges: exchanges,
          online: Math.random() > 0.5,
          avatar: persona.imagenUrl_Persona || null,
          avatarInitials: (persona.nombre_Persona || "U")[0].toUpperCase(),
          estadoVerificacion,
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
      '<p class="col-span-full text-center text-red-500">Error al cargar usuarios. por favor, recarga la página.</p>';
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
            class="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
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
            <button onclick="changePage(1)" class="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition">
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
              class="px-4 py-2 border rounded-lg transition ${i === currentPage ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}">
                        ${i}
                    </button>
                `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      buttons += `<span class="px-2 py-2">...</span>`;
    }
    buttons += `
            <button onclick="changePage(${totalPages})" class="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition">
                        ${totalPages}
                    </button>
                `;
  }

  // Botón siguiente
  buttons += `
                <button
                    onclick="changePage(${currentPage + 1})"
                    ${currentPage === totalPages ? "disabled" : ""}
            class="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
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
      const experienceYears = userCompleto
        ? Number(userCompleto.experienceYears || 0)
        : Number(fav.anios_experiencia || fav.aniosExperiencia || 0);
      const experienceText =
        experienceYears > 0
          ? `${experienceYears} año${experienceYears === 1 ? "" : "s"} de experiencia`
          : "Sin experiencia registrada";
      const availabilityRaw = userCompleto
        ? userCompleto.availability
        : fav.disponibilidad ||
          fav.disponibilidad_Persona ||
          fav.disponibilidad_Usuario ||
          fav.estado_disponibilidad ||
          "";
      const availabilityData = obtenerEstadoDisponibilidadCard(availabilityRaw);
      const habilidades = userCompleto
        ? userCompleto.skills
        : fav.habilidades || fav.skills || [];
      const rating = userCompleto
        ? userCompleto.rating
        : fav.rating || fav.calificacion_promedio || 0;
      const intercambios = userCompleto
        ? userCompleto.exchanges
        : fav.intercambios || fav.total_intercambios || 0;
      const genero = userCompleto
        ? userCompleto.genero
        : fav.genero || fav.genero_Persona || fav.genero_Usuario || "";
      const bannerGradientClass = obtenerClaseBannerPorGenero(genero);

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
                        <div class="user-card-banner ${bannerGradientClass}"></div>

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

                                <!-- Experiencia -->
                                <p class="text-gray-600 text-sm user-bio mb-3" title="${experienceText} • ${availabilityData.label}">
                                  ${experienceText}
                                  <span class="mx-1.5 text-gray-300">•</span>
                                  <span class="inline-flex items-center gap-1 font-semibold" style="color:${availabilityData.textColor};">
                                    <span class="w-2 h-2 rounded-full" style="background:${availabilityData.dotColor};"></span>
                                    ${availabilityData.label}
                                  </span>
                                </p>

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
    let mensaje = "No hay perfiles verificados disponibles";
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
      (user) => {
        const bannerGradientClass = obtenerClaseBannerPorGenero(user.genero);
        const experienceYears = Number(user.experienceYears || 0);
        const experienceText =
          experienceYears > 0
            ? `${experienceYears} año${experienceYears === 1 ? "" : "s"} de experiencia`
            : "Sin experiencia registrada";
        const availabilityData = obtenerEstadoDisponibilidadCard(user.availability);

        return `
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
                    <div class="user-card-banner ${bannerGradientClass}"></div>

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

                            <!-- Experiencia -->
                            <p class="text-gray-600 text-sm user-bio mb-3" title="${experienceText} • ${availabilityData.label}">
                              ${experienceText}
                              <span class="mx-1.5 text-gray-300">•</span>
                              <span class="inline-flex items-center gap-1 font-semibold" style="color:${availabilityData.textColor};">
                                <span class="w-2 h-2 rounded-full" style="background:${availabilityData.dotColor};"></span>
                                ${availabilityData.label}
                              </span>
                            </p>

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
                `;
              },
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

  // Cargar todo en paralelo sin bloquear toda la vista si una tarea falla.
  const tareasInit = [
    ["cargarDatosUsuario", cargarDatosUsuario()],
    ["cargarCategorias", cargarCategorias()],
    ["cargarUsuariosReales", cargarUsuariosReales()],
    ["cargarFavoritosDesdeBackend", cargarFavoritosDesdeBackend()],
    ["cargarEstadisticasGlobales", cargarEstadisticasGlobales()],
    ["cargarSolicitudesEnviadas", cargarSolicitudesEnviadas()],
  ];

  const resultadosInit = await Promise.allSettled(
    tareasInit.map(([, promesa]) => promesa),
  );

  resultadosInit.forEach((resultado, indice) => {
    if (resultado.status === "rejected") {
      console.warn(
        `[Init Descubrir] Fallo en ${tareasInit[indice][0]}:`,
        resultado.reason,
      );
    }
  });

  // Verificar actualizaciones de imagen
  verificarActualizacionesPendientes();

  // Actualizar badge de favoritos
  actualizarBadgeFavoritos();

  // Si por algún fallo parcial no se renderizó el grid, forzamos render final.
  try {
    renderUserCardsReal();
  } catch (error) {
    console.warn("No se pudo renderizar grid final de usuarios:", error);
  }

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
                            ? `<img src="${persona.imagenUrl_Persona}" alt="${Nombrecompleto}">`
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
                        ? `<img src="${persona.imagenUrl_Persona}" alt="${Nombrecompleto}">`
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
                                        ? `<img src="${getImagenCalificador(cal)}" alt="${Nombrecalificador}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">`
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
    type === "offered" ? "selectedOfferedDetail" : "Selectedrequireddetail";
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
                            <p style="margin:0 0 6px 0; font-size:14px;">Por favor, selecciona el motivo del reporte y agrega una descripción si crees que es necesaria. nuestro equipo revisará el caso.</p>
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
                            <label for="swal-descripcion" style="display:block; font-weight:600; margin-bottom:6px;">Descripción adicional <span style=\"font-weight:400; font-size:12px; color:#6b7280;\">(Opcional)</span></label>
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
  const countText = document.getElementById("notificationCount");

  // Guardar para badge combinado
  _solicitudesPendientesCount = count || 0;

  if (count > 0) {
    if (countText) countText.textContent = `${count} ${count === 1 ? t("notifications.pending") : t("notifications.pendientes")}`;
  } else {
    if (countText) countText.textContent = "";
  }

  // Actualizar badge combinado (alertas + solicitudes)
  if (typeof _syncCampanaBadge === 'function') {
    _syncCampanaBadge();
  } else {
    // fallback: si aún no se definió _syncCampanaBadge (orden de carga)
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      if (count > 0) { badge.classList.remove('hidden'); badge.textContent = count > 99 ? '99+' : count; }
      else { badge.classList.add('hidden'); badge.textContent = ''; }
    }
  }
}

// Escuchar cambios en localStorage realizados por iframes (storage event)
window.addEventListener("storage", function (e) {
  try {
    if (e.key === "SEMACKRO_notification_delta") {
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
          localStorage.removeItem("SEMACKRO_notification_delta");
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

        if (pendingProfileOnboardingTourStart) {
          iframe.contentWindow.postMessage(
            {
              type: "startProfileOnboardingTour",
              source: "descubrirOnboarding",
            },
            window.location.origin,
          );
          pendingProfileOnboardingTourStart = false;
        }
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
                        Explorar usuarios
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
let isSendingDashboardMessage = false;

const MENSAJERIA_LIMITES = {
  MAX_CARACTERES_MENSAJE: 1500,
  MAX_ADJUNTOS: 8,
  MAX_MB_POR_ARCHIVO: 15,
  MAX_MB_TOTAL: 40,
};

const MIME_PERMITIDOS_MENSAJERIA = [
  "image/",
  "video/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function esMimePermitidoMensajeria(file) {
  const mime = (file?.type || "").toLowerCase();
  return MIME_PERMITIDOS_MENSAJERIA.some((allowed) =>
    allowed.endsWith("/") ? mime.startsWith(allowed) : mime === allowed,
  );
}

function normalizarContenidoMensaje(texto) {
  return String(texto || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

function validarAdjuntosMensajeria(files) {
  if (!Array.isArray(files)) return { ok: true };

  if (files.length > MENSAJERIA_LIMITES.MAX_ADJUNTOS) {
    return {
      ok: false,
      mensaje: `Solo puedes adjuntar hasta ${MENSAJERIA_LIMITES.MAX_ADJUNTOS} archivos.`,
    };
  }

  const maxBytesPorArchivo = MENSAJERIA_LIMITES.MAX_MB_POR_ARCHIVO * 1024 * 1024;
  const maxBytesTotal = MENSAJERIA_LIMITES.MAX_MB_TOTAL * 1024 * 1024;
  let totalBytes = 0;

  for (const f of files) {
    if (!esMimePermitidoMensajeria(f)) {
      return {
        ok: false,
        mensaje: `Tipo de archivo no permitido: ${f.name}`,
      };
    }
    if ((f.size || 0) > maxBytesPorArchivo) {
      return {
        ok: false,
        mensaje: `El archivo ${f.name} supera ${MENSAJERIA_LIMITES.MAX_MB_POR_ARCHIVO} MB.`,
      };
    }
    totalBytes += f.size || 0;
  }

  if (totalBytes > maxBytesTotal) {
    return {
      ok: false,
      mensaje: `El total de adjuntos supera ${MENSAJERIA_LIMITES.MAX_MB_TOTAL} MB.`,
    };
  }

  return { ok: true };
}

// Variables globales para polling de mensajes (accesibles desde navigateTo)
window.conversacionActivaDashboard = null;
window.mensajeriaGlobalInterval = null;

// Inicializar mensajería cuando se abra la vista de mensajes
document.addEventListener("DOMContentLoaded", () => {
  // El polling se maneja ahora en navigateTo('mensajes')

  // Event listener para enviar mensajes
  const formDashboard = document.getElementById("chat-form-dashboard");
  if (formDashboard) {
    formDashboard.removeEventListener("submit", enviarMensajeDashboard);
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

      const esGrupo = conv.tipo === 'grupo';

      return `
                    <div class="conv-item ${isActive ? "active" : ""} flex items-center space-x-3 cursor-pointer"
                         onclick="seleccionarConversacionDashboard(${conv.id_conversacion})">
                        <div class="relative flex-shrink-0">
                            ${
                              esGrupo
                                ? `<div class="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                                     <span class="iconify text-white" data-icon="mdi:account-group" style="font-size:22px;"></span>
                                   </div>`
                                : tieneImagen
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

function limpiarContenedorMensajesDashboard(mensaje = "Cargando mensajes...") {
  const container = document.getElementById("mensajes-container-dashboard");
  if (!container) return;

  if (!mensaje) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div class="flex items-center justify-center h-full text-gray-400">
      <p class="text-sm">${mensaje}</p>
    </div>
  `;
}

// Seleccionar conversación
async function seleccionarConversacionDashboard(idConversacion) {
  const idConversacionNumerico = Number(idConversacion);
  const idConversacionAnterior = Number(
    conversacionActivaDashboard?.id_conversacion || 0,
  );

  conversacionActivaDashboard = conversacionesDashboard.find(
    (c) => Number(c.id_conversacion) === idConversacionNumerico,
  );
  window.conversacionActivaDashboard = conversacionActivaDashboard; // Sincronizar con global

  // Resetear tracking de mensajes al cambiar de conversación
  ultimoMensajeId = null;
  ultimaCantidadMensajes = 0;
  fueReRenderizado = false;
  window.lastReadStatusString = "";

  if (!conversacionActivaDashboard) return;

  if (idConversacionAnterior !== idConversacionNumerico) {
    limpiarContenedorMensajesDashboard("Cargando mensajes...");
  }

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
  await cargarMensajesDashboard(idConversacionNumerico, true);

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
  const esGrupo = conv.tipo === 'grupo';
  const nombreContacto = conv.nombre_contacto || "Usuario";
  const initials = getInitialsDashboard(nombreContacto);
  const colorClass = getColorClassDashboard(conv.id_conversacion);
  const tieneImagen =
    conv.imagenUrl_contacto && conv.imagenUrl_contacto.trim() !== "";

  // Guardar el ID del contacto
  if (!conversacionActivaDashboard.id_contacto && conv.id_contacto) {
    conversacionActivaDashboard.id_contacto = conv.id_contacto;
  }

  const avatarHtml = esGrupo
    ? `<div class="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm shrink-0">
         <span class="iconify text-white" data-icon="mdi:account-group" style="font-size:22px;"></span>
       </div>`
    : tieneImagen
    ? `<img src="${conv.imagenUrl_contacto}"
              class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow-sm"
            alt="${nombreContacto}"
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
         <div class="w-10 h-10 md:w-12 md:h-12 ${colorClass} rounded-full items-center justify-center text-white font-bold text-sm md:text-base hidden shadow-sm">
            ${initials}
         </div>`
    : `<div class="w-10 h-10 md:w-12 md:h-12 ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-sm md:text-base shadow-sm">
            ${initials}
        </div>`;

  const subtituloHtml = esGrupo
    ? `<p class="text-[10px] md:text-xs text-indigo-500 font-medium">Grupo · ${conv.total_miembros || ''} integrantes</p>`
    : `<p class="text-[10px] md:text-xs text-green-500 font-medium">${t("messages.activeConversation")}</p>`;

  const botonesAccionHtml = esGrupo
    ? ``
    : `<button id="verPerfilBtnDashboard" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="${t("messages.viewProfile")}">
           <span class="iconify" data-icon="mdi:account-circle" data-width="22"></span>
       </button>
       <button id="VideoLlamada" class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" title="${t("messages.videoCall")}">
           <span class="iconify" data-icon="mdi:video" data-width="22"></span>
       </button>
       <button id="finalizarIntercambioBtn" class="p-2 text-red-600 hover:bg-red-50 rounded-full transition-all" title="${t("messages.finishExchange")}">
           <span class="iconify" data-icon="mdi:check-circle" data-width="22"></span>
       </button>`;

  document.getElementById("chat-header-dashboard").innerHTML = `
                <div class="flex items-center gap-2 md:gap-3 overflow-hidden">
                    <button id="backToListBtnDashboard" onclick="volverALaListaDashboard()" class="md:hidden text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors shrink-0" title="Volver">
                        <span class="iconify" data-icon="mdi:arrow-left" data-width="20"></span>
                    </button>
                    <div class="relative shrink-0">
                        ${avatarHtml}
                    </div>
                    <div class="min-w-0">
                        <h2 class="text-sm md:text-lg font-bold text-gray-800 truncate">${nombreContacto}</h2>
                        ${subtituloHtml}
                    </div>
                </div>

                <div class="flex items-center gap-1 md:gap-2 shrink-0">
                    ${botonesAccionHtml}
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
  const idConversacionNumerico = Number(idConversacion);
  const requestNonce = ++chatMessagesRequestNonce;

  if (chatMessagesAbortController) {
    chatMessagesAbortController.abort();
  }
  chatMessagesAbortController = new AbortController();

  const esSolicitudObsoleta = () => {
    const idConversacionActiva = Number(
      window.conversacionActivaDashboard?.id_conversacion ||
        conversacionActivaDashboard?.id_conversacion ||
        0,
    );

    return (
      requestNonce !== chatMessagesRequestNonce ||
      idConversacionActiva !== idConversacionNumerico
    );
  };

  try {
    const personaId = await obtenerPersonaIdActual();
    if (esSolicitudObsoleta()) return;

    const response = await fetch(
      `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversacion/${idConversacionNumerico}/mensajes?personaId=${personaId}`,
      {
        signal: chatMessagesAbortController.signal,
      },
    );

    if (!response.ok) throw new Error("Error al cargar mensajes");

    const resultado = await response.json();
    if (esSolicitudObsoleta()) return;

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
      mostrarMensajesDashboard(mensajes, idConversacionNumerico);
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
      if (esSolicitudObsoleta()) return;
      await fetch(
        `${window.APP_CONFIG.BACKEND_URL}/api/mensajeria/conversacion/${idConversacionNumerico}/marcar-leidos`,
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
    if (esSolicitudObsoleta()) return;
    await cargarConversacionesDashboard();
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }
    console.error("Error:", error);
  } finally {
    if (requestNonce === chatMessagesRequestNonce) {
      chatMessagesAbortController = null;
    }
  }
}

// Mostrar mensajes
function mostrarMensajesDashboard(mensajes, idConversacionRender = null) {
  if (idConversacionRender !== null) {
    const idConversacionActiva = Number(
      window.conversacionActivaDashboard?.id_conversacion ||
        conversacionActivaDashboard?.id_conversacion ||
        0,
    );
    if (idConversacionActiva !== Number(idConversacionRender)) {
      return;
    }
  }

  const container = document.getElementById("mensajes-container-dashboard");

  if (!mensajes || mensajes.length === 0) {
    container.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-400">
                        <p class="text-sm">No hay mensajes aún. ¡envía el primero!</p>
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
          ? `<span class="text-[10px] opacity-70 ml-1 italic">(Editado)</span>`
          : "";
      const animationClass =
        esUltimo && !fueReRenderizado ? "message-enter" : "";

      if (esMio) {
        return `
                        <div class="flex justify-end group ${animationClass} w-full">
                            <div class="flex flex-col items-end max-w-[90%] md:max-w-[85%]">
                                  <div class="bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 text-white p-2.5 px-3.5 rounded-2xl rounded-tr-none shadow-md message-item hover:shadow-lg w-fit relative"
                                    oncontextmenu="return abrirMenuMensajeDesdeInline(event, this)"
                                     data-message-id="${msg.id_mensaje}"
                                     data-message-content="${contenidoMostrado.replace(/"/g, "&quot;")}"
                                     data-puede-editar="${puedeEditar}"
                                    data-es-mio="true"
                                    data-puede-borrar-todos="${puedeBorrarParaTodos}"
                                    data-puede-borrar-mi="${puedeBorrarParaMi}">
                                    <p class="leading-relaxed text-sm">${contenidoMostrado}</p>
                                    ${renderAdjuntosHTML(msg.adjuntos || [])}
                                    <div class="flex items-center justify-end gap-1.5 text-[10px] text-indigo-100 mt-1 opacity-90">
                                        <span class="whitespace-nowrap">${formatearHoraDashboard(msg.fecha_envio)}</span>
                                        ${badgeEdicion}
                                        <span class="iconify" data-icon="${msg.leido ? "mdi:check-all" : "mdi:check"}" style="${msg.leido ? "color: #7dd3fc;" : ""}" data-width="19"></span>
                                      <button type="button" onclick="abrirAccionesMensajeDesdeBoton(event, this.closest('.message-item'))" class="btn-opciones-mensaje ml-1 text-indigo-200 hover:text-white transition-colors" title="Opciones de mensaje">
                                        <span class="iconify" data-icon="mdi:dots-vertical" data-width="14"></span>
                                      </button>
                                    </div>
                                </div>
                            </div>
                        </div>
`;
      } else {
        const esGrupoActivo = window.conversacionActivaDashboard?.tipo === 'grupo';
        const nombreEmisorHtml = (esGrupoActivo && msg.nombre_emisor)
          ? `<span class="text-[10px] font-semibold text-indigo-600 mb-0.5 ml-0.5">${msg.nombre_emisor}</span>`
          : '';
        return `
                        <div class="flex justify-start group ${animationClass} w-full">
                            <div class="flex flex-col items-start max-w-[90%] md:max-w-[85%]">
                                ${nombreEmisorHtml}
                                  <div class="bg-white border border-slate-200 p-2.5 px-3.5 rounded-2xl rounded-tl-none shadow-sm message-item hover:shadow-md w-fit relative"
                                    oncontextmenu="return abrirMenuMensajeDesdeInline(event, this)"
                                     data-message-id="${msg.id_mensaje}"
                                     data-message-content="${(contenidoMostrado || "").replace(/\"/g, "&quot;")}"
                                     data-puede-editar="${puedeEditar}"
                                    data-es-mio="false"
                                    data-puede-borrar-todos="${puedeBorrarParaTodos}"
                                    data-puede-borrar-mi="${puedeBorrarParaMi}">
                                    <p class="text-slate-800 leading-relaxed text-sm">${contenidoMostrado}</p>
                                    ${renderAdjuntosHTML(msg.adjuntos || [])}
                                    <div class="flex items-center justify-start gap-1.5 text-[10px] text-slate-400 mt-1">
                                        <span class="whitespace-nowrap">${formatearHoraDashboard(msg.fecha_envio)}</span>
                                        ${badgeEdicion}
                                      <button type="button" onclick="abrirAccionesMensajeDesdeBoton(event, this.closest('.message-item'))" class="btn-opciones-mensaje ml-1 text-slate-400 hover:text-slate-700 transition-colors" title="Opciones de mensaje">
                                        <span class="iconify" data-icon="mdi:dots-vertical" data-width="14"></span>
                                      </button>
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

// Renderizar adjuntos: imágenes, videos y documentos
function renderAdjuntosHTML(adjuntos) {
  if (!adjuntos || !Array.isArray(adjuntos) || adjuntos.length === 0) return "";

  const images = [];
  const videos = [];
  const docs   = [];

  adjuntos.forEach((a) => {
    const mime = (a.mime || a.tipo_mime || "").toLowerCase();
    const url = a.url || a.ruta || a.url_publica || a.url_public;
    const nombre = a.nombre_original || a.nombre || "";
    const tipo = (a.tipo || a.tipo_adjunto || "").toLowerCase();
    if (!url) return;
    if (mime.startsWith("video/")) {
      videos.push({ ...a, url, mime, nombre, tipo });
    } else if (mime.startsWith("image/")) {
      images.push({ ...a, url, mime, nombre, tipo });
    } else {
      // Documentos: PDF, Word, PPT, Excel, etc.
      docs.push({ ...a, url, mime, nombre, tipo });
    }
  });

  const usedThumbs = new Set();
  const parts = [];

  // Para cada video, intentar encontrar su thumbnail correspondiente
  for (const v of videos) {
    let posterUrl = null;
    let match = images.find(
      (img) => img.tipo === "thumbnail" || img.tipo === "thumb" || img.tipo === "thumbnail_image"
    );
    if (match) {
      posterUrl = match.url;
      usedThumbs.add(match.url);
    } else {
      const baseV = (v.nombre || "").replace(/\.[^/.]+$/, "");
      if (baseV) {
        match = images.find((img) => {
          const baseImg = (img.nombre || "").replace(/\.[^/.]+$/, "");
          if (!baseImg) return false;
          return baseImg === `${baseV}-thumb` || baseImg === `${baseV}_thumb` || baseImg === baseV
            || baseImg.includes(baseV) || baseV.includes(baseImg);
        });
        if (match) { posterUrl = match.url; usedThumbs.add(match.url); }
      }
    }
    const safePoster = posterUrl ? ` poster="${posterUrl}"` : "";
    parts.push(`<div class="mt-2"><video controls class="max-w-xs rounded"${safePoster}><source src="${v.url}" type="${v.mime}"></video></div>`);
  }

  // Imágenes que no son thumbnails de vídeo
  for (const img of images) {
    if (usedThumbs.has(img.url)) continue;
    parts.push(`<div class="mt-2"><img src="${img.url}" alt="Adjunto" class="max-w-xs rounded cursor-pointer" onclick="openImageFullscreen('${img.url}')"></div>`);
  }

  // Documentos: tarjeta de descarga con icono SVG según tipo
  for (const doc of docs) {
    const ext = (doc.nombre || doc.url).split('.').pop().toLowerCase();
    let iconColor = '#6b7280', iconLabel = 'Documento';
    if (ext === 'pdf') { iconColor = '#ef4444'; iconLabel = 'PDF'; }
    else if (ext === 'doc' || ext === 'docx') { iconColor = '#2563eb'; iconLabel = 'Word'; }
    else if (ext === 'ppt' || ext === 'pptx') { iconColor = '#ea580c'; iconLabel = 'PowerPoint'; }
    else if (ext === 'xls' || ext === 'xlsx') { iconColor = '#16a34a'; iconLabel = 'Excel'; }
    const nombreDisplay = doc.nombre ? (doc.nombre.length > 28 ? doc.nombre.slice(0, 28) + '…' : doc.nombre) : iconLabel;
    parts.push(`
      <div class="mt-2">
        <a href="${doc.url}" target="_blank" rel="noopener"
           class="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition max-w-xs"
           style="text-decoration:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="1.8" style="width:22px;height:22px;flex-shrink:0;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <span style="font-size:12px;color:#374151;font-weight:500;">${nombreDisplay}</span>
          <svg viewBox="0 0 20 20" fill="#9ca3af" style="width:14px;height:14px;flex-shrink:0;">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </a>
      </div>`);
  }

  if (parts.length === 0) {
    return adjuntos.map((a) => {
      const url = a.url || a.ruta || a.url_publica || a.url_public;
      if (!url) return "";
      return `<div class="mt-2"><a href="${url}" target="_blank" class="text-indigo-600 underline">Ver archivo adjunto</a></div>`;
    }).join("");
  }

  return parts.join("");
}

// === GESTIÓN DE LLAMADAS ===
function handleCallNotification(payload) {
  if (!payload || !payload.caller) return;

  Toast.call(
    payload.caller.name || "Usuario SEMACKRO",
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

  if (isSendingDashboardMessage) return;

  if (!conversacionActivaDashboard) {
    Toast.error("Sin conversación", "Selecciona una conversación primero.");
    return;
  }

  const input = document.getElementById("message-input-dashboard");
  const contenido = input && input.value ? normalizarContenidoMensaje(input.value) : "";

  const validacionAdjuntos = validarAdjuntosMensajeria(selectedFilesDashboard);
  if (!validacionAdjuntos.ok) {
    Toast.error("Adjuntos inválidos", validacionAdjuntos.mensaje);
    return;
  }

  if (contenido.length > MENSAJERIA_LIMITES.MAX_CARACTERES_MENSAJE) {
    Toast.error(
      "Mensaje demasiado largo",
      `Máximo ${MENSAJERIA_LIMITES.MAX_CARACTERES_MENSAJE} caracteres.`,
    );
    return;
  }

  if (!contenido && selectedFilesDashboard.length === 0) {
    Toast.error("Mensaje vacío", "Escribe un mensaje o adjunta un archivo.");
    return;
  }

  const sendBtn = document.getElementById("send-message-btn-dashboard");
  isSendingDashboardMessage = true;
  if (sendBtn) sendBtn.disabled = true;

  try {
    const personaId = await obtenerPersonaIdActual();

    // Si estamos editando
    if (mensajeEnEdicion) {
      if (selectedFilesDashboard.length > 0) {
        Toast.error(
          "Edición inválida",
          "No puedes adjuntar archivos al editar un mensaje.",
        );
        return;
      }

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
  } finally {
    isSendingDashboardMessage = false;
    if (sendBtn) sendBtn.disabled = false;
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
        tipo: file.type && file.type.startsWith("video/") ? "video" : "Image",
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
    const box = document.createElement('div');
    box.className = 'w-full h-full flex flex-col items-center justify-center p-2 bg-gray-50';
    // Determinar icono SVG según tipo de archivo
    const ext = (file.name || '').split('.').pop().toLowerCase();
    let iconSvg;
    if (ext === 'pdf') {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.8" style="width:28px;height:28px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    } else if (ext === 'doc' || ext === 'docx') {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" style="width:28px;height:28px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    } else if (ext === 'ppt' || ext === 'pptx') {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="1.8" style="width:28px;height:28px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    } else {
        iconSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" style="width:28px;height:28px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;
    }
    const fileName = file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name;
    box.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;">${iconSvg}</div><div class="text-xs text-gray-600 text-center break-words mt-1">${fileName}</div>`;
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

      const proposed = [...selectedFilesDashboard, ...files];
      const validacion = validarAdjuntosMensajeria(proposed);
      if (!validacion.ok) {
        Toast.error("Adjuntos inválidos", validacion.mensaje);
        ev.target.value = "";
        return;
      }

      files.forEach((f) => selectedFilesDashboard.push(f));
      refreshAttachmentsPreview();
      ev.target.value = "";
    });
  }

  if (form) {
    form.removeEventListener("submit", enviarMensajeDashboard);
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
                            Esta acción solo eliminará los mensajes para ti. el otro usuario seguirá viendo los mensajes.
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
      try {
        mostrarModalCalificacionDashboard(
          data.intercambio.id_intercambio,
          idContacto,
          nombreContacto,
        );
      } catch (modalError) {
        console.error("Error al abrir modal de calificación:", modalError);
        Swal.fire({
          icon: "warning",
          title: "Intercambio finalizado",
          html: `
                            <div style="text-align: center;">
                                <p style="color: #4b5563; font-size: 15px; margin-bottom: 12px;">
                                    El intercambio se finalizó correctamente.
                                </p>
                                <p style="color: #6b7280; font-size: 13px;">
                                    Hubo un problema al abrir la ventana de calificación. Puedes calificar después desde tu historial.
                                </p>
                            </div>
                        `,
          confirmButtonColor: "#3b82f6",
          customClass: {
            popup: "rounded-lg shadow-2xl",
          },
        });
      }
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
  const nombrePersonaSeguro =
    typeof nombrePersona === "string" && nombrePersona.trim()
      ? nombrePersona
      : "la otra persona";

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
  console.log("   nombrePersona:", nombrePersonaSeguro);

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
                                  ¿Cómo fue tu intercambio con <strong style="color: #334155;">${nombrePersonaSeguro}</strong>?
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
                                Comentario <span style="color: #94a3b8; font-weight: 400;">(Opcional)</span>
                            </label>
                            <textarea id="comentarioCalificacionDashboard" rows="3" maxlength="500"
                                      style="width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #1e293b; resize: none; font-family: inherit; transition: border-color 0.15s;"
                                      placeholder="Comparte tu experiencia con ${nombrePersonaSeguro}..."
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
                            Enviar calificación
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
                                    Tu calificación no fue guardada. por favor, intenta nuevamente.
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
  if (!container) return;
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 100);
}

// ============================================
// MENÚ CONTEXTUAL PARA MENSAJES (ACTUALIZADO)
// ============================================
let mensajeSeleccionadoId = null;
let mensajeSeleccionadoContenido = "";
window.mensajeSeleccionadoId = null;
let panelAccionesMensajeActivo = null;
let hostPanelAccionesMensaje = null;
let handlersPanelAccionesMensaje = null;

function obtenerDatosMenuDesdeElemento(element) {
  const asBool = (v, fallback = false) => {
    if (v === "true") return true;
    if (v === "false") return false;
    return fallback;
  };

  if (!element) return null;

  return {
    messageId: element.getAttribute("data-message-id"),
    messageContent: element.getAttribute("data-message-content") || "",
    puedeEditar: asBool(element.getAttribute("data-puede-editar"), false),
    puedeBorrarTodos: asBool(
      element.getAttribute("data-puede-borrar-todos"),
      false,
    ),
    puedeBorrarMi: asBool(element.getAttribute("data-puede-borrar-mi"), true),
  };
}

function abrirMenuMensajeDesdeInline(event, element) {
  if (event && typeof event.preventDefault === "function") event.preventDefault();
  if (event && typeof event.stopPropagation === "function") event.stopPropagation();

  const datos = obtenerDatosMenuDesdeElemento(element);
  if (!datos || !datos.messageId) return false;

  mostrarMenuContextual(
    event || { preventDefault: () => {}, pageX: 0, pageY: 0 },
    datos.messageId,
    datos.messageContent,
    datos.puedeEditar,
    datos.puedeBorrarTodos,
    datos.puedeBorrarMi,
    element,
  );

  return false;
}

function abrirAccionesMensajeDesdeBoton(event, element) {
  if (event && typeof event.preventDefault === "function") event.preventDefault();
  if (event && typeof event.stopPropagation === "function") event.stopPropagation();

  const datos = obtenerDatosMenuDesdeElemento(element);
  if (!datos || !datos.messageId) return;

  abrirPanelAccionesMensaje(element, datos);
}

function cerrarPanelAccionesMensaje() {
  if (panelAccionesMensajeActivo) {
    panelAccionesMensajeActivo.remove();
    panelAccionesMensajeActivo = null;
    hostPanelAccionesMensaje = null;
  }

  if (handlersPanelAccionesMensaje) {
    const { onResize, onWheel, onScroll } = handlersPanelAccionesMensaje;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("wheel", onWheel, true);
    window.removeEventListener("scroll", onScroll, true);
    handlersPanelAccionesMensaje = null;
  }
}

function posicionarPanelAccionesMensaje(element, panel) {
  if (!element || !panel) return;

  const rect = element.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const gap = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const esMio = element.getAttribute("data-es-mio") === "true";

  // Preferir abajo como WhatsApp; si no cabe, subir.
  let top = rect.bottom + gap;
  if (top + panelRect.height > vh - 8) {
    top = rect.top - panelRect.height - gap;
  }
  if (top < 8) top = 8;

  let left = esMio ? rect.right - panelRect.width : rect.left;
  if (left + panelRect.width > vw - 8) left = vw - panelRect.width - 8;
  if (left < 8) left = 8;

  panel.style.top = `${Math.round(top)}px`;
  panel.style.left = `${Math.round(left)}px`;
}

function abrirPanelAccionesMensaje(element, datos) {
  if (!element || !datos || !datos.messageId) return;

  mensajeSeleccionadoId = datos.messageId;
  mensajeSeleccionadoContenido = datos.messageContent || "";
  window.mensajeSeleccionadoId = datos.messageId;

  const allowEditar = !!datos.puedeEditar;
  const allowBorrarTodos = !!datos.puedeBorrarTodos;
  const allowBorrarMi =
    !!datos.puedeBorrarMi || (!allowEditar && !allowBorrarTodos);

  // Toggle si se vuelve a tocar el mismo mensaje
  if (panelAccionesMensajeActivo && hostPanelAccionesMensaje === element) {
    cerrarPanelAccionesMensaje();
    return;
  }

  cerrarPanelAccionesMensaje();

  const panel = document.createElement("div");
  panel.className =
    "fixed z-[10090] min-w-[190px] bg-white border border-slate-200 rounded-xl shadow-2xl p-2";

  const botones = [];
  if (allowEditar) {
    botones.push(`
      <button data-accion-msg="editar" class="w-full px-3 py-2 rounded-lg text-left hover:bg-slate-50 text-slate-700 text-sm font-medium flex items-center gap-2">
        <span class="iconify" data-icon="mdi:pencil" data-width="16"></span>
        Editar
      </button>
    `);
  }
  if (allowBorrarTodos) {
    botones.push(`
      <button data-accion-msg="borrar-todos" class="w-full px-3 py-2 rounded-lg text-left hover:bg-red-50 text-red-700 text-sm font-medium flex items-center gap-2">
        <span class="iconify" data-icon="mdi:delete-outline" data-width="16"></span>
        Eliminar para todos
      </button>
    `);
  }
  if (allowBorrarMi) {
    botones.push(`
      <button data-accion-msg="borrar-mi" class="w-full px-3 py-2 rounded-lg text-left hover:bg-amber-50 text-amber-700 text-sm font-medium flex items-center gap-2">
        <span class="iconify" data-icon="mdi:delete-sweep-outline" data-width="16"></span>
        Borrar solo para mí
      </button>
    `);
  }

  panel.innerHTML = botones.join("");
  document.body.appendChild(panel);
  if (window.Iconify) Iconify.scan(panel);
  posicionarPanelAccionesMensaje(element, panel);

  panel.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("button[data-accion-msg]");
    if (!btn) return;

    const accion = btn.getAttribute("data-accion-msg");
    cerrarPanelAccionesMensaje();

    if (accion === "editar") {
      iniciarEdicionMensaje(mensajeSeleccionadoId, mensajeSeleccionadoContenido);
      return;
    }
    if (accion === "borrar-todos") {
      await confirmarBorrarMensaje(mensajeSeleccionadoId, "todos");
      return;
    }
    if (accion === "borrar-mi") {
      await confirmarBorrarMensaje(mensajeSeleccionadoId, "mi");
    }
  });

  panelAccionesMensajeActivo = panel;
  hostPanelAccionesMensaje = element;

  const onResize = () => {
    if (!panelAccionesMensajeActivo || !hostPanelAccionesMensaje) return;
    posicionarPanelAccionesMensaje(hostPanelAccionesMensaje, panelAccionesMensajeActivo);
  };

  const onWheel = (ev) => {
    if (!panelAccionesMensajeActivo) return;
    const dentroPanel = panelAccionesMensajeActivo.contains(ev.target);
    const enMensaje = hostPanelAccionesMensaje && hostPanelAccionesMensaje.contains(ev.target);
    if (!dentroPanel && !enMensaje) cerrarPanelAccionesMensaje();
  };

  const onScroll = () => {
    cerrarPanelAccionesMensaje();
  };

  window.addEventListener("resize", onResize);
  window.addEventListener("wheel", onWheel, true);
  window.addEventListener("scroll", onScroll, true);
  handlersPanelAccionesMensaje = { onResize, onWheel, onScroll };
}

function mostrarMenuContextual(
  event,
  messageId,
  messageContent,
  puedeEditar,
  puedeBorrarParaTodos,
  puedeBorrarParaMi,
  anchorElement = null,
) {
  if (event && typeof event.preventDefault === "function") event.preventDefault();

  const host =
    anchorElement ||
    (event && event.target && event.target.closest
      ? event.target.closest(".message-item")
      : null);

  if (!host) {
    confirmarBorrarMensaje(messageId, puedeBorrarParaTodos ? "todos" : "mi");
    return false;
  }

  abrirPanelAccionesMensaje(host, {
    messageId,
    messageContent,
    puedeEditar,
    puedeBorrarTodos: puedeBorrarParaTodos,
    puedeBorrarMi: puedeBorrarParaMi,
  });

  return false;
}

// Cerrar menú contextual al hacer clic fuera
document.addEventListener("click", function (event) {
  if (!panelAccionesMensajeActivo) return;

  const clicDentroPanel = panelAccionesMensajeActivo.contains(event.target);
  const clicEnDisparador = !!event.target.closest(".btn-opciones-mensaje");
  if (!clicDentroPanel && !clicEnDisparador) {
    cerrarPanelAccionesMensaje();
  }
});

// Long-press para móvil (mantener pero pasar permisos reales cuando no los tenemos)
function agregarLongPressListeners() {
  const messages = document.querySelectorAll(".message-item");
  let longPressTimer;

  const asBool = (v, fallback = false) => {
    if (v === "true") return true;
    if (v === "false") return false;
    return fallback;
  };

  messages.forEach((msg) => {
    // Evitar re-vincular listeners en cada re-render del chat
    if (msg.dataset.contextBound === "1") return;
    msg.dataset.contextBound = "1";

    // Click derecho (desktop)
    msg.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      const messageId = this.getAttribute("data-message-id");
      const messageContent = this.getAttribute("data-message-content") || "";
      const puedeEditar = asBool(this.getAttribute("data-puede-editar"), false);
      const puedeBorrarTodos = asBool(
        this.getAttribute("data-puede-borrar-todos"),
        false,
      );
      const puedeBorrarMi = asBool(
        this.getAttribute("data-puede-borrar-mi"),
        true,
      );

      mostrarMenuContextual(
        e,
        messageId,
        messageContent,
        puedeEditar,
        puedeBorrarTodos,
        puedeBorrarMi,
        this,
      );
    });

    // Touch events para móvil
    msg.addEventListener(
      "touchstart",
      function (e) {
        const messageElement = this;
        const messageId = this.getAttribute("data-message-id");
        const messageContent = this.getAttribute("data-message-content");
        const puedeEditar = asBool(this.getAttribute("data-puede-editar"), false);
        const puedeBorrarTodos = asBool(
          this.getAttribute("data-puede-borrar-todos"),
          false,
        );
        const puedeBorrarMi = asBool(
          this.getAttribute("data-puede-borrar-mi"),
          true,
        );

        longPressTimer = setTimeout(() => {
          const touch = e.touches[0];
          mostrarMenuContextual(
            {
              preventDefault: () => {},
              pageX: touch.pageX,
              pageY: touch.pageY,
            },
            messageId,
            messageContent,
            puedeEditar,
            puedeBorrarTodos,
            puedeBorrarMi,
            messageElement,
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
  if (menu) menu.classList.add("hidden");

  await confirmarBorrarMensaje(mensajeSeleccionadoId, "todos");
}

async function eliminarMensajeParaMi() {
  const menu = document.getElementById("messageContextMenu");
  if (menu) menu.classList.add("hidden");

  const idMensaje = mensajeSeleccionadoId || window.mensajeSeleccionadoId;
  if (!idMensaje) {
    Toast.warning("Selecciona un mensaje", "No se detectó el mensaje a eliminar.");
    return;
  }

  await confirmarBorrarMensaje(idMensaje, "mi");
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
    // AI Chat esta deshabilitado si los elementos no existen en el DOM.
    return;
  }

  // n8n Webhook URL for the AI agent
  const N8N_WEBHOOK_URL =
    "https://tu-n8n-publico.com/webhook/e198fe85-0b97-4d32-8a5a-889aa29cd142/chat";

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
    messageDiv.className = `ai-message ${isUser ? "user" : "Bot"}`;

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
      localStorage.getItem("SEMACKRO_language") === "en"
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
              // Handle n8n streaming format: {"type":"Item","content":"..."}
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
          "Por favor verifica que el servidor n8n esté activo";
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
      const currentLang = localStorage.getItem("SEMACKRO_language") || "es";
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
    // Ejemplo: SEMACKRO73829ad8
    const randomStr = Math.random().toString(36).substring(2, 12);
    return `SEMACKRO${idConversacion}${randomStr}`; // Sin guiones ni guiones bajos
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
      nombreUsuario = window.usuarioActualNombre || "Usuario SEMACKRO";
    } catch (e) {
      console.warn("No se pudo obtener nombre de usuario:", e);
    }

    // Abrir modal de inmediato para dar feedback visual aunque la señalizacion tarde.
    abrirJitsiModal(roomId, nombreUsuario, conv.nombre_contacto || "Contacto");

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
      fetch(`${window.APP_CONFIG.BACKEND_URL}/api/call-signals/send`, {
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
      }).catch((err) => {
        console.warn("No se pudo enviar señal de videollamada (continuando):", err);
      });
      console.log(
        "✅ Señal de videollamada enviada correctamenta a ID:",
        receptorId,
      );
    } catch (e) {
      console.error("Error enviando notificación de videollamada:", e);
      // No bloquear la apertura del modal por errores de señalizacion.
      Toast?.warning?.("Se abrio la llamada", "No se pudo notificar al contacto automaticamente");
    }
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

    // Asegurar que el modal no quede atrapado en contenedores con overflow/transform.
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    // Mostrar modal
    modal.classList.remove("hidden");
    modal.style.display = "block";
    modal.style.visibility = "visible";
    modal.style.opacity = "1";
    modal.style.zIndex = "2147483000";
    document.body.style.overflow = "hidden";
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
          // Evita fallos de permisos/dispositivo al entrar a la sala.
          startWithAudioMuted: true,
          startWithVideoMuted: true,
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
      modal.style.display = "";
      modal.style.visibility = "";
      modal.style.opacity = "";
      modal.style.zIndex = "";
    }

    document.body.style.overflow = "";
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

// ============================================================
// MÓDULO: ÓRDENES DE TRABAJO
// ============================================================

// Cache local de órdenes para filtrado sin nuevo fetch
let _todasLasOrdenes = [];
let _filtroActualOrden = 'todas';
let _misPostulacionesMap = {};
let _ubicacionUsuarioActual = null; // ubicación en texto del usuario logueado (city/depto)

/**
 * Compara dos cadenas de ubicación de forma insensible a mayúsculas/minúsculas.
 * Retorna true si una contiene a la otra (coincidencia parcial).
 */
function _ubicacionCoincide(ubicacionOrden, ubicacionUsuario) {
  if (!ubicacionOrden || !ubicacionUsuario) return false;
  const a = ubicacionOrden.toLowerCase().trim();
  const b = ubicacionUsuario.toLowerCase().trim();
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/**
 * Obtiene la ubicación textual del usuario actual.
 * Primero intenta localStorage 'perfilUsuario', luego llama la API.
 * Retorna string (ej: "Tegucigalpa") o null si no disponible.
 */
async function obtenerUbicacionUsuario() {
  if (_ubicacionUsuarioActual !== null) return _ubicacionUsuarioActual;
  try {
    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) return null;
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    // Obtener id_Perfil_Persona (igual que perfil.html)
    const rP = await fetch(`${API_BASE}/personas/by-usuario/${usuarioId}`, { headers });
    if (!rP.ok) return null;
    const jP = await rP.json();
    const idPerfil = jP?.data?.id_Perfil_Persona;
    if (!idPerfil) return null;
    // Obtener dirección usando id_Perfil_Persona (igual que perfil.html)
    const rD = await fetch(`${API_BASE}/direcciones/persona/${idPerfil}`, { headers });
    if (!rD.ok) return null;
    const jD = await rD.json();
    const d = jD?.data;
    if (!d) return null;
    // Combinar ciudad + departamento para que coincida con cualquiera de los dos
    const ciudad    = d.ciudad_Direccion    || d.ciudad    || '';
    const depto     = d.departamento_Direccion || d.departamento || '';
    const ubic = [ciudad, depto].filter(Boolean).join(' ').trim() || null;
    _ubicacionUsuarioActual = ubic;
    return _ubicacionUsuarioActual;
  } catch (e) {
    console.warn('[OT] No se pudo obtener ubicación del usuario:', e.message);
    return null;
  }
}

/**
 * Carga desde el API las órdenes del usuario autenticado
 * y renderiza las tarjetas en el grid.
 */
async function cargarOrdenesTrabajo() {
  const grid = document.getElementById('ordenesTrabajoGrid');
  if (!grid) return;

  const esAdmin = localStorage.getItem('usuarioRolId') === '1';

  // Mostrar u ocultar botón "Nueva Orden" y control geo-filtro según rol
  const btnNuevaOrden = document.getElementById('btnNuevaOrden');
  if (btnNuevaOrden) btnNuevaOrden.style.display = esAdmin ? '' : 'none';
  
  const geoContainer = document.getElementById('adminGeoFilterContainer');
  if (geoContainer) geoContainer.classList.toggle('hidden', !esAdmin);

  // ── CACHÉ sessionStorage (5 min) ──────────────────────────────
  const _OT_CACHE_KEY_DATA = 'cache_ot_data';
  const _OT_CACHE_KEY_TS   = 'cache_ot_ts';
  const ahora = Date.now();
  const tsCache = parseInt(sessionStorage.getItem(_OT_CACHE_KEY_TS) || '0', 10);
  if (tsCache && (ahora - tsCache) < _OT_CACHE_TTL) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(_OT_CACHE_KEY_DATA) || 'null');
      if (cached) {
        _todasLasOrdenes = cached.ordenes || [];
        _misPostulacionesMap = cached.postulaciones || {};
        // Para no-admins asegurar que la ubicación esté cargada antes de filtrar
        if (!esAdmin) await obtenerUbicacionUsuario();
        renderizarOrdenes(_todasLasOrdenes, esAdmin, _misPostulacionesMap);
        return;
      }
    } catch (e) { /* caché corrupta, continuar con fetch */ }
  }
  // ──────────────────────────────────────────────────────────────

  // Admin también carga especialidades para el modal de creación
  if (esAdmin) await cargarEspecialidadesOrden();

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Todos los roles obtienen todas las órdenes; el filtro de visibilidad se aplica en cliente
    const res = await fetch(`${API_BASE}/ordenes-trabajo`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    _todasLasOrdenes = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);

    // Para usuarios normales: obtener estado de SUS postulaciones + su ubicación
    let misPostulacionesMap = {};
    if (!esAdmin) {
      const usuarioId = localStorage.getItem('usuarioId');
      // Cargar ubicación y postulaciones en paralelo
      await obtenerUbicacionUsuario();
      if (usuarioId) {
        try {
          const rPost = await fetch(`${API_BASE}/ordenes-trabajo/mis-postulaciones?usuario_id=${usuarioId}`, { headers });
          if (rPost.ok) {
            const jPost = await rPost.json();
            (jPost.data || []).forEach(p => { misPostulacionesMap[p.id_orden] = p.estado; });
            _misPostulacionesMap = misPostulacionesMap;
          }
        } catch (e) { /* silencioso */ }
      }
    }

    // Guardar en caché
    sessionStorage.setItem('cache_ot_data', JSON.stringify({ ordenes: _todasLasOrdenes, postulaciones: misPostulacionesMap }));
    sessionStorage.setItem('cache_ot_ts', String(Date.now()));

    renderizarOrdenes(_todasLasOrdenes, esAdmin, misPostulacionesMap);
  } catch (err) {
    console.warn('[OT] No se pudo conectar al endpoint:', err.message);
    _todasLasOrdenes = [];
    renderizarOrdenes([], esAdmin, {});
  }
}

/** Puebla el <select> de especialidad con categorías del API */
async function cargarEspecialidadesOrden() {
  const sel = document.getElementById('ordenEspecialidad');
  if (!sel) return;

  // Limpiar opciones anteriores (excepto la primera placeholder)
  while (sel.options.length > 1) sel.remove(1);

  try {
    const res = await fetch(`${API_BASE}/categorias`);
    if (!res.ok) throw new Error('No se pudo obtener categorías');
    const json = await res.json();
    const cats = Array.isArray(json) ? json : (json.data || []);
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nombre_categoria_Habilidad || c.nombre_categoria || c.nombre || c.id_categorias_Habilidades_Servicios || c.id;
      opt.textContent = c.nombre_categoria_Habilidad || c.nombre_categoria || c.nombre || 'Sin nombre';
      sel.appendChild(opt);
    });
  } catch (e) {
    console.warn('[OT] No se cargaron especialidades:', e.message);
  }
}

/** Renderiza el array de órdenes como tarjetas en el grid */
function renderizarOrdenes(ordenes, esAdmin, misPostulacionesMap) {
  if (esAdmin === undefined) esAdmin = localStorage.getItem('usuarioRolId') === '1';
  if (!misPostulacionesMap) misPostulacionesMap = {};
  const grid = document.getElementById('ordenesTrabajoGrid');
  if (!grid) return;

  const estadoConfig = {
    pendiente:    { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', label: 'Pendiente' },
    en_progreso:  { color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500',   label: 'En Progreso' },
    completada:   { color: 'bg-green-100 text-green-700',  dot: 'bg-green-500',  label: 'Completada' },
    cancelada:    { color: 'bg-red-100 text-red-700',      dot: 'bg-red-400',    label: 'Cancelada' },
  };

  // Para no-admins: filtrar órdenes con restricción de ubicación
  let ordenesFiltradas = ordenes;
  if (!esAdmin) {
    ordenesFiltradas = ordenes.filter(o => {
      if (!o.restringir_por_ubicacion) return true; // sin restricción → visible para todos
      const ubicOrden = o.ubicacion_obra || o.ubicacion || '';
      if (!ubicOrden) return false; // restricción activa pero sin ubicación → nadie puede ver
      return _ubicacionCoincide(ubicOrden, _ubicacionUsuarioActual || '');
    });
  }

  if (!ordenesFiltradas || ordenesFiltradas.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full flex items-center justify-center py-16">
        <div class="text-center">
          <span class="iconify text-gray-300 mx-auto mb-4" data-icon="mdi:clipboard-text-off-outline" style="font-size:64px;"></span>
          <p class="text-gray-500 font-medium">No hay órdenes de trabajo disponibles${!esAdmin && _ubicacionUsuarioActual ? ` en tu zona (${_ubicacionUsuarioActual})` : ''}</p>
          ${esAdmin ? '<p class="text-gray-400 text-sm mt-1">Haz clic en &ldquo;nueva orden&rdquo; para crear una</p>' : ''}
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = ordenesFiltradas.map(o => {
    const est = estadoConfig[o.estado] || estadoConfig['pendiente'];
    const fechaInicio = o.fecha_inicio ? new Date(o.fecha_inicio).toLocaleDateString('es-HN') : '—';
    const fechaFin    = o.fecha_fin    ? new Date(o.fecha_fin).toLocaleDateString('es-HN')    : '—';
    const presupuesto = o.presupuesto_estimado
      ? `L ${Number(o.presupuesto_estimado).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : '—';
    const titulo      = escapeHtml(o.titulo || 'Sin título');
    const descripcion = escapeHtml(o.descripcion || '');
    const ubicacion   = escapeHtml(o.ubicacion || o.ubicacion_obra || '');
    const especialidad = escapeHtml(o.especialidad || o.nombre_categoria || '');

    // Badge de restricción por ubicación (solo visible para admin)
    const idOrden = o.id_orden || o.id;
    const restriccionBadge = esAdmin && o.restringir_por_ubicacion
      ? `<div class="mx-5 mb-2 flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2.5 py-1 text-[10px] font-semibold" title="Solo usuarios de: ${escapeHtml(o.ubicacion_obra || o.ubicacion || 'ubicación no definida')}">
           <span class="iconify shrink-0" data-icon="mdi:map-marker-lock" style="font-size:12px;"></span>
           Solo zona coincidente
         </div>`
      : '';
    // Badge del estado de la postulación del usuario
    const estadoPost = misPostulacionesMap[idOrden];
    const postBadgeConfig = {
      pendiente:  { cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200', icon: 'mdi:clock-outline',        label: 'Tu postulación: En revisión' },
      aceptada:   { cls: 'bg-green-50 text-green-700 border border-green-200',   icon: 'mdi:check-circle-outline',  label: 'Tu postulación: Aceptada ✓' },
      rechazada:  { cls: 'bg-red-50 text-red-600 border border-red-200',         icon: 'mdi:close-circle-outline',  label: 'Tu postulación: No seleccionado' },
    };
    const postBadge = (!esAdmin && estadoPost && postBadgeConfig[estadoPost])
      ? `<div class="mx-5 mb-2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${postBadgeConfig[estadoPost].cls}">
           <span class="iconify shrink-0" data-icon="${postBadgeConfig[estadoPost].icon}" style="font-size:14px;"></span>
           ${postBadgeConfig[estadoPost].label}
         </div>`
      : '';

    return `
      <div class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col overflow-hidden border border-gray-100">
        <!-- Cabecera con estado -->
        <div class="px-5 pt-5 pb-3 flex items-start justify-between">
          <h3 class="font-bold text-gray-800 text-base leading-tight flex-1 mr-3">${titulo}</h3>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${est.color} shrink-0">
            <span class="w-1.5 h-1.5 rounded-full ${est.dot}"></span>
            ${est.label}
          </span>
        </div>
        ${restriccionBadge}

        <!-- Descripción -->
        ${descripcion ? `<p class="px-5 text-gray-500 text-sm line-clamp-2">${descripcion}</p>` : ''}

        <!-- Badge estado postulación del usuario -->
        ${postBadge}

        <!-- Detalles -->
        <div class="px-5 py-3 flex-1 space-y-2 text-sm text-gray-600">
          ${ubicacion ? `
          <div class="flex items-center gap-2">
            <span class="iconify text-gray-400" data-icon="mdi:map-marker-outline" style="font-size:16px;"></span>
            <span>${ubicacion}</span>
          </div>` : ''}
          <div class="flex items-center gap-2">
            <span class="iconify text-gray-400" data-icon="mdi:calendar-range" style="font-size:16px;"></span>
            <span>${fechaInicio} → ${fechaFin}</span>
          </div>
          ${especialidad ? `
          <div class="flex items-center gap-2">
            <span class="iconify text-gray-400" data-icon="mdi:briefcase-outline" style="font-size:16px;"></span>
            <span>${especialidad}</span>
          </div>` : ''}
          <div class="flex items-center gap-2">
            <span class="iconify text-gray-400" data-icon="mdi:cash" style="font-size:16px;"></span>
            <span class="font-medium">${presupuesto}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="iconify text-gray-400" data-icon="mdi:account-group-outline" style="font-size:16px;"></span>
            <span class="text-xs">${o.total_postulaciones || 0}/${o.max_postulantes || 1} postulante(s)</span>
          </div>
        </div>

        <!-- Acciones -->
        <div class="px-5 pb-4 pt-2 flex gap-2 border-t border-gray-50">
          <button onclick="verDetalleOrden(${o.id_orden || o.id})"
            class="flex-1 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium transition flex items-center justify-center gap-1">
            <span class="iconify" data-icon="mdi:eye-outline" style="font-size:14px;"></span> Ver
          </button>
          ${esAdmin && o.estado !== 'cancelada' && o.estado !== 'completada' ? `
          <button onclick="editarOrden(${o.id_orden || o.id})"
            class="flex-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-medium transition flex items-center justify-center gap-1">
            <span class="iconify" data-icon="mdi:pencil-outline" style="font-size:14px;"></span> Editar
          </button>
          <button onclick="cancelarOrden(${o.id_orden || o.id})"
            class="flex-1 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium transition flex items-center justify-center gap-1">
            <span class="iconify" data-icon="mdi:close-circle-outline" style="font-size:14px;"></span> Cancelar
          </button>` : (!esAdmin && !estadoPost && o.estado === 'pendiente' && (o.total_postulaciones || 0) < (o.max_postulantes || 1)) ? `
          <button onclick="postularseOrden(${o.id_orden || o.id})"
            class="flex-1 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 text-xs font-semibold transition flex items-center justify-center gap-1">
            <span class="iconify" data-icon="mdi:account-plus-outline" style="font-size:14px;"></span> Postularme
          </button>` : (!esAdmin && !estadoPost && o.estado === 'pendiente') ? `
          <span class="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-400 text-xs font-medium text-center">Cupo lleno</span>` : ''}
        </div>
      </div>`;
  }).join('');

  // Reactivar iconify para los nuevos elementos
  if (window.Iconify) Iconify.scan();
}

/** Filtra la lista local por estado */
function filtrarOrdenes(filtro) {
  _filtroActualOrden = filtro;

  // Resaltar botón activo
  document.querySelectorAll('.filtro-orden-btn').forEach(btn => {
    const esFiltro = btn.dataset.filtro === filtro;
    btn.classList.toggle('bg-blue-600', esFiltro);
    btn.classList.toggle('hover:bg-blue-700', esFiltro);
    btn.classList.toggle('text-white', esFiltro);
    btn.classList.toggle('border-blue-600', esFiltro);

    btn.classList.toggle('bg-white', !esFiltro);
    btn.classList.toggle('hover:bg-gray-50', !esFiltro);
    btn.classList.toggle('text-gray-600', !esFiltro);
    btn.classList.toggle('border', !esFiltro);
    btn.classList.toggle('border-gray-200', !esFiltro);
  });

  const filtradas = filtro === 'todas'
    ? _todasLasOrdenes
    : _todasLasOrdenes.filter(o => o.estado === filtro);

  renderizarOrdenes(filtradas, localStorage.getItem('usuarioRolId') === '1', _misPostulacionesMap);
}

/** Toggles the geographic filter for Admin orders view */
async function toggleFiltroGeografico() {
    // Limpiamos caché de OT para forzar recarga
    sessionStorage.removeItem('cache_ot_data');
    sessionStorage.removeItem('cache_ot_ts');
    
    // Recargamos órdenes aplicando el nuevo estado del toggle
    await cargarOrdenesTrabajo();
}

/** Abre el modal para crear una nueva orden */
function abrirModalCrearOrden() {
  const modal = document.getElementById('modalOrdenTrabajo');
  if (!modal) return;

  // Resetear formulario
  document.getElementById('formOrdenTrabajo').reset();
  document.getElementById('ordenTrabajoId').value = '';
  document.getElementById('modalOrdenTitulo').textContent = 'Crear Nueva Orden de Trabajo';
  document.getElementById('btnGuardarOrden').textContent = 'Crear Orden';

  cargarEspecialidadesOrden();
  modal.classList.remove('hidden');

  // SCRUM-25: Resetear y ocultar mapa al abrir
  if (window.MapaOT) MapaOT.reset();
}

/** Cierra el modal de crear/editar */
function cerrarModalOrden(event) {
  if (event && event.target !== document.getElementById('modalOrdenTrabajo')) return;
  document.getElementById('modalOrdenTrabajo').classList.add('hidden');
  // SCRUM-25: Resetear mapa al cerrar
  if (window.MapaOT) MapaOT.reset();
}

/** Envía el formulario para crear o actualizar una orden */
async function guardarOrdenTrabajo(event) {
  event.preventDefault();

  const id          = document.getElementById('ordenTrabajoId').value;
  const titulo      = document.getElementById('ordenTitulo').value.trim();
  const descripcion = document.getElementById('ordenDescripcion').value.trim();
  const ubicacion   = document.getElementById('ordenUbicacion').value.trim();
  const fechaInicio = document.getElementById('ordenFechaInicio').value;
  const fechaFin    = document.getElementById('ordenFechaFin').value;
  const especialidad = document.getElementById('ordenEspecialidad').value;
  const presupuesto      = document.getElementById('ordenPresupuesto').value;
  const maxPostulantes    = document.getElementById('ordenMaxPostulantes').value || 1;

  if (fechaFin < fechaInicio) {
    Toast.warning('Fechas inválidas', 'La fecha de fin no puede ser anterior a la fecha de inicio.');
    return;
  }

  const btn = document.getElementById('btnGuardarOrden');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    const usuarioId = localStorage.getItem('usuarioId');
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const restringirUbicacion = document.getElementById('ordenRestringirUbicacion')?.checked || false;
    const body = JSON.stringify({
      usuario_id: usuarioId,
      titulo, descripcion, ubicacion_obra: ubicacion,
      fecha_inicio: fechaInicio, fecha_fin: fechaFin,
      especialidad, presupuesto_estimado: presupuesto || null,
      max_postulantes: parseInt(maxPostulantes) || 1,
      restringir_por_ubicacion: restringirUbicacion
    });

    const url    = id ? `${API_BASE}/ordenes-trabajo/${id}` : `${API_BASE}/ordenes-trabajo`;
    const method = id ? 'PUT' : 'Post';

    const res = await fetch(url, { method, headers, body });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    document.getElementById('modalOrdenTrabajo').classList.add('hidden');
    Toast.success(id ? 'Orden actualizada' : 'Orden creada', id ? 'Los cambios fueron guardados correctamente.' : 'La orden fue creada exitosamente.');
    await cargarOrdenesTrabajo();
  } catch (err) {
    console.error('[OT] Error al guardar:', err);
    Toast.error('Error al guardar', 'No se pudo guardar la orden. Por favor intenta de nuevo.');
  } finally {
    btn.disabled = false;
    btn.textContent = id ? 'Guardar Cambios' : 'Crear Orden';
  }
}

/** Carga los datos de una orden y abre el modal en modo edición */
async function editarOrden(id) {
  const orden = _todasLasOrdenes.find(o => (o.id_orden || o.id) == id);
  if (!orden) return;

  document.getElementById('ordenTrabajoId').value = orden.id_orden || orden.id;
  document.getElementById('ordenTitulo').value = orden.titulo || '';
  document.getElementById('ordenDescripcion').value = orden.descripcion || '';
  document.getElementById('ordenUbicacion').value = orden.ubicacion || orden.ubicacion_obra || '';
  document.getElementById('ordenFechaInicio').value = (orden.fecha_inicio || '').substring(0, 10);
  document.getElementById('ordenFechaFin').value = (orden.fecha_fin || '').substring(0, 10);
  document.getElementById('ordenPresupuesto').value = orden.presupuesto_estimado || '';
  document.getElementById('ordenMaxPostulantes').value = orden.max_postulantes || 1;
  const chkRestr = document.getElementById('ordenRestringirUbicacion');
  if (chkRestr) chkRestr.checked = !!(orden.restringir_por_ubicacion);

  await cargarEspecialidadesOrden();
  document.getElementById('ordenEspecialidad').value = orden.especialidad || '';

  document.getElementById('modalOrdenTitulo').textContent = 'Editar Orden de Trabajo';
  document.getElementById('btnGuardarOrden').textContent = 'Guardar Cambios';
  document.getElementById('modalOrdenTrabajo').classList.remove('hidden');

  // SCRUM-25: Resetear mapa al editar para evitar estados anteriores
  if (window.MapaOT) MapaOT.reset();
}

/** Cancela (cambia estado a 'cancelada') una orden */
async function cancelarOrden(id) {
  const confirmado = await new Promise((resolve) => {
    const modalId = 'ot-cancel-confirm-modal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div id="${modalId}" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
              <span class="iconify text-2xl" data-icon="mdi:close-circle-outline"></span>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Cancelar orden</h3>
            <p class="text-sm text-gray-500 mb-6">¿Seguro que deseas cancelar esta orden de trabajo? esta acción no se puede deshacer.</p>
            <div class="flex gap-3 w-full">
              <button id="ot-cancel-no" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">No, mantener</button>
              <button id="ot-cancel-yes" class="flex-1 px-4 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all">Sí, cancelar</button>
            </div>
          </div>
        </div>
      </div>`);

    const modal = document.getElementById(modalId);
    const close = (val) => { modal.remove(); resolve(val); };
    document.getElementById('ot-cancel-no').onclick = () => close(false);
    document.getElementById('ot-cancel-yes').onclick = () => close(true);
  });

  if (!confirmado) return;

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE}/ordenes-trabajo/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ estado: 'cancelada' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    Toast.success('Orden cancelada', 'La orden de trabajo fue cancelada correctamente.');
    await cargarOrdenesTrabajo();
  } catch (err) {
    console.error('[OT] Error al cancelar:', err);
    Toast.error('Error', 'No se pudo cancelar la orden. Por favor intenta de nuevo.');
  }
}

/** Muestra el modal de detalle de una orden */
async function verDetalleOrden(id) {
  const orden = _todasLasOrdenes.find(o => (o.id_orden || o.id) == id);
  if (!orden) return;

  const estadoLabels = {
    pendiente: 'Pendiente', en_progreso: 'En Progreso',
    completada: 'Completada', cancelada: 'Cancelada'
  };
  const fechaInicio = orden.fecha_inicio ? new Date(orden.fecha_inicio).toLocaleDateString('es-HN') : '—';
  const fechaFin    = orden.fecha_fin    ? new Date(orden.fecha_fin).toLocaleDateString('es-HN')    : '—';
  const presupuesto = orden.presupuesto_estimado
    ? `L ${Number(orden.presupuesto_estimado).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
    : '—';

  const esAdmin = localStorage.getItem('usuarioRolId') === '1';

  document.getElementById('detalleOrdenContent').innerHTML = `
    <div class="space-y-3">
      <div><span class="font-semibold text-gray-800">Título:</span><p class="text-gray-600 mt-0.5">${escapeHtml(orden.titulo || '')}</p></div>
      ${orden.descripcion ? `<div><span class="font-semibold text-gray-800">Descripción:</span><p class="text-gray-600 mt-0.5">${escapeHtml(orden.descripcion)}</p></div>` : ''}
      ${(orden.ubicacion || orden.ubicacion_obra) ? `<div><span class="font-semibold text-gray-800">Ubicación:</span><p class="text-gray-600 mt-0.5">${escapeHtml(orden.ubicacion || orden.ubicacion_obra)}</p></div>` : ''}
      <div class="grid grid-cols-2 gap-3">
        <div><span class="font-semibold text-gray-800">Fecha inicio:</span><p class="text-gray-600 mt-0.5">${fechaInicio}</p></div>
        <div><span class="font-semibold text-gray-800">Fecha fin:</span><p class="text-gray-600 mt-0.5">${fechaFin}</p></div>
      </div>
      ${(orden.especialidad || orden.nombre_categoria) ? `<div><span class="font-semibold text-gray-800">Especialidad:</span><p class="text-gray-600 mt-0.5">${escapeHtml(orden.especialidad || orden.nombre_categoria)}</p></div>` : ''}
      <div class="grid grid-cols-2 gap-3">
        <div><span class="font-semibold text-gray-800">Presupuesto:</span><p class="text-gray-600 mt-0.5">${presupuesto}</p></div>
        <div><span class="font-semibold text-gray-800">Estado:</span><p class="text-gray-600 mt-0.5">${estadoLabels[orden.estado] || orden.estado || '—'}</p></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div><span class="font-semibold text-gray-800">Máx. postulantes:</span><p class="text-gray-600 mt-0.5">${orden.max_postulantes || 1}</p></div>
        <div><span class="font-semibold text-gray-800">Postulantes:</span><p class="text-gray-600 mt-0.5">${orden.total_postulaciones || 0} / ${orden.max_postulantes || 1}</p></div>
      </div>

      <!-- Botón PDF (SCRUM-30) -->
      <div class="pt-2 border-t border-gray-100">
        <button onclick="descargarPDFOrden(${id})"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-sm rounded-xl transition-colors border border-red-200">
          <span class="iconify" data-icon="mdi:file-pdf-box" style="font-size:18px;"></span>
          Descargar pdf de la orden
        </button>
      </div>

      <!-- Postulantes (solo admin, SCRUM-25) -->
      ${esAdmin ? `<div id="ot-postulantes-section" class="pt-2 border-t border-gray-100">
        <p class="font-semibold text-gray-800 mb-2 flex items-center gap-1">
          <span class="iconify text-blue-500" data-icon="mdi:account-group-outline" style="font-size:17px;"></span>
          Postulantes
        </p>
        <div id="ot-postulantes-list" class="text-xs text-gray-400 italic"></div>
      </div>` : ''}
    </div>`;

  document.getElementById('modalDetalleOrden').classList.remove('hidden');

  // Cargar postulantes para admin (SCRUM-25)
  if (esAdmin) {
    const container = document.getElementById('ot-postulantes-list');
    if (!container) return;

    const LOADER_POSTULANTES_DELAY_MS = 1200;
    let postulantesFinalizados = false;
    const postulantesLoadingTimer = setTimeout(() => {
      if (postulantesFinalizados) return;
      container.innerHTML = '<p class="text-xs text-gray-400 italic">Cargando postulantes...</p>';
    }, LOADER_POSTULANTES_DELAY_MS);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const rp = await fetch(`${API_BASE}/ordenes-trabajo/${id}/postulaciones`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const dp = await rp.json();
      const lista = dp.data || [];
      if (!lista.length) {
        container.innerHTML = '<p class="text-xs text-gray-400 italic">Aún no hay postulantes.</p>';
        return;
      }
      container.innerHTML = lista.map(p => {
        const estadoBadge = {
          pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
          aceptada:  'bg-green-50 text-green-700 border-green-200',
          rechazada: 'bg-red-50 text-red-500 border-red-200'
        }[p.estado] || 'bg-gray-50 text-gray-600 border-gray-200';

        // ── Calcular puntuación global (promedio de las 4 métricas) ───────────
        const punt   = Number(p.puntualidad      || 0);
        const cal    = Number(p.calidad_trabajo  || 0);
        const limp   = Number(p.limpieza         || 0);
        const com    = Number(p.comunicacion     || 0);
        const nCal   = Number(p.cantidad_calificaciones || 0);
        const promedio = nCal > 0 ? Math.round((punt + cal + limp + com) / 4) : 0;
        // Convertir promedio 0-100 → 0-5 estrellas
        const estrellasNum  = promedio > 0 ? Math.round((promedio / 100) * 5 * 10) / 10 : 0;
        // Render de estrellas (enteras + media + vacías)
        function renderEstrellas(val) {
          const full  = Math.floor(val);
          const half  = val - full >= 0.3 && val - full < 0.8 ? 1 : 0;
          const empty = 5 - full - half - (val - full >= 0.8 ? 1 : 0);
          const fullExtra = val - full >= 0.8 ? 1 : 0;
          let s = '';
          for (let i = 0; i < full + fullExtra; i++) s += '<span class="iconify text-amber-400" data-icon="mdi:star" style="font-size:14px;"></span>';
          if (half) s += '<span class="iconify text-amber-400" data-icon="mdi:star-half-full" style="font-size:14px;"></span>';
          for (let i = 0; i < Math.max(0, 5 - full - fullExtra - half); i++) s += '<span class="iconify text-gray-300" data-icon="mdi:star-outline" style="font-size:14px;"></span>';
          return s;
        }

        // ── Barras de métricas ────────────────────────────────────────────────
        function barra(label, valor, color) {
          if (!valor) return '';
          return `
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-gray-500 w-20 shrink-0">${label}</span>
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full ${color}" style="width:${valor}%"></div>
              </div>
              <span class="text-[10px] text-gray-500 w-6 text-right">${valor}</span>
            </div>`;
        }

        const tieneMetricas = nCal > 0;
        const metricasHtml  = tieneMetricas ? `
          <div class="mt-2 space-y-1">
            ${barra('Puntualidad', punt, 'bg-blue-400')}
            ${barra('Calidad',     cal,  'bg-emerald-400')}
            ${barra('Limpieza',    limp, 'bg-sky-400')}
            ${barra('Comunic.',    com,  'bg-violet-400')}
          </div>` : '';

        // ── Botón Ver Perfil (SCRUM-25) ─────────────────────────────────────────
        const idUsuarioPostulante = p.usuario_id || p.id_usuario || p.id_Usuario;
        const btnPerfil = '';

        return `
          <div class="py-3 border-b border-gray-100 last:border-0">
            <!-- Fila superior: foto + nombre + estado -->
            <div class="flex items-start gap-3">
              <img src="${p.imagen_tecnico || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.nombre_tecnico || 'U') + '&size=40&background=e0e7ff&color=4f46e5&rounded=true'}"
                class="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow"
                onerror="this.src='https://ui-avatars.com/api/?name=U&size=40&background=e0e7ff&color=4f46e5&rounded=true'">
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <p class="text-sm font-semibold text-gray-800 truncate">${escapeHtml(p.nombre_tecnico || 'Usuario')}</p>
                  <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${estadoBadge}">${p.estado}</span>
                </div>
                <!-- Estrellas -->
                <div class="flex items-center gap-1 mt-0.5">
                  ${tieneMetricas
                    ? `<div class="flex items-center gap-0.5">${renderEstrellas(estrellasNum)}</div>
                       <span class="text-[10px] text-gray-500">${estrellasNum.toFixed(1)} · ${nCal} reseña${nCal !== 1 ? 's' : ''}</span>`
                    : `<span class="text-[10px] text-gray-400 italic">Sin calificaciones aún</span>`}
                </div>
                <!-- Mensaje de postulación -->
                ${p.mensaje ? `<p class="text-xs text-gray-500 mt-1 line-clamp-2">${escapeHtml(p.mensaje)}</p>` : ''}
              </div>
            </div>
            <!-- Barras de métricas -->
            ${metricasHtml}
            <!-- Línea de acciones: portafolio + ver perfil -->
            <div class="mt-2 flex flex-wrap items-center gap-2">
              ${p.portafolio_url
                ? `<a href="${escapeHtml(p.portafolio_url)}" target="_blank" rel="noopener"
                     class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-medium rounded-lg border border-red-200 transition-colors">
                     <span class="iconify" data-icon="mdi:file-pdf-box" style="font-size:13px;"></span>
                     Portafolio PDF
                   </a>`
                : `<span class="text-[10px] text-gray-400 italic">Sin portafolio</span>`}
              ${btnPerfil}
            </div>
          </div>`;
      }).join('');
      if (window.Iconify) Iconify.scan();
    } catch (e) {
      container.innerHTML = '<p class="text-xs text-gray-400">No se pudieron cargar los postulantes.</p>';
    } finally {
      postulantesFinalizados = true;
      clearTimeout(postulantesLoadingTimer);
    }
  }
}

/** Cierra el modal de detalle */
function cerrarDetalleOrden(event) {
  if (event && event.target !== document.getElementById('modalDetalleOrden')) return;
  document.getElementById('modalDetalleOrden').classList.add('hidden');
}

/** SCRUM-30: Genera y descarga un PDF con los detalles de la orden */
function descargarPDFOrden(id) {
  const orden = _todasLasOrdenes.find(o => (o.id_orden || o.id) == id);
  if (!orden) return;

  try {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      Toast.error('PDF no disponible', 'La librería de PDF no está cargada. Recarga la página.');
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const BLUE   = [30, 86, 160];
    const GRAY   = [90, 90, 90];
    const BLACK  = [30, 30, 30];
    const LIGHT  = [245, 247, 250];
    const pageW  = doc.internal.pageSize.getWidth();
    let   y      = 0;

    // ── Encabezado ──────────────────────────────────────────────────
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, pageW, 32, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('ORDEN DE TRABAJO', 14, 14);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('  SEMACKRO — Intercambio de Servicios y Habilidades', 14, 22);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-HN', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}`, 14, 28);

    y = 44;

    // ── Función helper: fila con etiqueta + valor ──────────────────
    const rowH = 8;
    const campo = (label, valor, x1 = 14, x2 = 65, maxW = pageW - x2 - 14) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(label, x1, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BLACK);
      const lines = doc.splitTextToSize(String(valor || '—'), maxW);
      doc.text(lines, x2, y);
      y += rowH * Math.max(lines.length, 1);
    };

    // ── Sección: Información general ─────────────────────────────
    doc.setFillColor(...LIGHT);
    doc.roundedRect(12, y - 5, pageW - 24, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text('Información General', 14, y);
    y += 8;

    const estadoLabels = { pendiente:'Pendiente', en_progreso:'En Progreso', completada:'Completada', cancelada:'Cancelada' };
    const presupuesto  = orden.presupuesto_estimado
      ? `L ${Number(orden.presupuesto_estimado).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
      : '—';

    campo('Título:', orden.titulo);
    campo('Especialidad:', orden.especialidad || orden.nombre_categoria);
    campo('Estado:', estadoLabels[orden.estado] || orden.estado);
    campo('Presupuesto:', presupuesto);
    campo('Máx. postulantes:', orden.max_postulantes || 1);
    campo('Postulantes:', `${orden.total_postulaciones || 0} / ${orden.max_postulantes || 1}`);

    y += 4;

    // ── Sección: Fechas ─────────────────────────────────────────
    doc.setFillColor(...LIGHT);
    doc.roundedRect(12, y - 5, pageW - 24, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...BLUE);
    doc.text('Fechas', 14, y);
    y += 8;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-HN') : '—';
    campo('Inicio:', fmtDate(orden.fecha_inicio));
    campo('Fin:', fmtDate(orden.fecha_fin));

    y += 4;

    // ── Sección: Ubicación ──────────────────────────────────────
    if (orden.ubicacion || orden.ubicacion_obra) {
      doc.setFillColor(...LIGHT);
      doc.roundedRect(12, y - 5, pageW - 24, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...BLUE);
      doc.text('Ubicación', 14, y);
      y += 8;
      campo('Lugar:', orden.ubicacion || orden.ubicacion_obra);
      y += 4;
    }

    // ── Sección: Descripción ────────────────────────────────────
    if (orden.descripcion) {
      doc.setFillColor(...LIGHT);
      doc.roundedRect(12, y - 5, pageW - 24, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...BLUE);
      doc.text('Descripción', 14, y);
      y += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...BLACK);
      const descLines = doc.splitTextToSize(orden.descripcion, pageW - 28);
      doc.text(descLines, 14, y);
      y += descLines.length * 5 + 4;
    }

    // ── Pie de página ────────────────────────────────────────────
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(...BLUE);
    doc.rect(0, pageH - 14, pageW, 14, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(200, 220, 255);
    doc.text('Documento generado automáticamente por   SEMACKRO.', 14, pageH - 5);

    const nombreArchivo = `Orden_${id}_${(orden.titulo || 'detalle').replace(/[^a-zA-Z0-9]/g,'_').slice(0,30)}.pdf`;
    doc.save(nombreArchivo);
    Toast.success('PDF generado', `Archivo "${nombreArchivo}" descargado.`);
  } catch (err) {
    console.error('[PDF] Error al generar PDF:', err);
    Toast.error('Error al generar PDF', err.message || 'Intenta de nuevo.');
  }
}

/** Envía la postulación del técnico a una orden de trabajo */
async function postularseOrden(id) {
  const usuarioId = localStorage.getItem('usuarioId');
  if (!usuarioId) {
    Toast.warning('Sin sesión activa', 'Debes iniciar sesión para postularte.');
    return;
  }

  // Verificar si ya hay una postulación previa antes de abrir el modal
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const statusRes = await fetch(`${API_BASE}/ordenes-trabajo/${id}/postulacion-status?usuario_id=${usuarioId}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (statusData.postulado) {
        const est = statusData.postulacion?.estado || 'pendiente';
        const msg = est === 'aceptada'
          ? 'Tu postulación fue <strong>aceptada</strong>. Ya eres parte de este proyecto.'
          : est === 'rechazada'
          ? 'Tu postulación fue <strong>rechazada</strong>. No puedes volver a postularte.'
          : 'Ya enviaste una postulación a esta orden. Está <strong>pendiente</strong> de revisión.';
        Toast.warning('Ya te postulaste', msg.replace(/<[^>]*>/g, ''));
        return;
      }
    }
  } catch (_) { /* continuar si falla el chequeo previo */ }

  const orden = _todasLasOrdenes.find(o => (o.id_orden || o.id) == id);
  const titulo = orden ? escapeHtml(orden.titulo || 'esta orden') : 'esta orden';

  // Modal de postulación con mensaje y portafolio opcionales
  const postulacionData = await new Promise((resolve) => {
    const modalId = 'ot-postular-modal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', `
      <div id="${modalId}" class="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
          <div class="flex flex-col">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <span class="iconify text-xl" data-icon="mdi:account-plus-outline"></span>
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-900">Postularse a orden</h3>
                <p class="text-xs text-gray-400 mt-0.5 line-clamp-1">${titulo}</p>
              </div>
            </div>
            <label class="text-sm font-medium text-gray-700 mb-1.5">Mensaje <span class="text-gray-400 font-normal">(Opcional)</span></label>
            <textarea id="ot-postular-msg" rows="3"
              class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none bg-gray-50"
              placeholder="Describe tu experiencia o disponibilidad..."></textarea>
            <label class="text-sm font-medium text-gray-700 mt-3 mb-1.5 flex items-center gap-1">
              <span class="iconify text-red-500" data-icon="mdi:file-pdf-box" style="font-size:15px"></span>
              Portafolio en PDF <span class="text-gray-400 font-normal">(Opcional)</span>
            </label>
            <label id="ot-pdf-label"
              class="flex items-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors bg-gray-50">
              <span class="iconify text-red-400" data-icon="mdi:file-pdf-box" style="font-size:20px"></span>
              <span id="ot-pdf-name" class="text-xs text-gray-500 truncate flex-1">Haz clic para seleccionar un pdf...</span>
              <input type="file" id="ot-postular-portfolio" accept=".pdf,application/pdf" class="hidden" />
            </label>
            <p class="text-xs text-gray-400 mt-1">Máximo 10 mb. el administrador podrá verlo en la lista de postulantes.</p>
            <div class="flex gap-3 mt-4">
              <button id="ot-postular-cancel" class="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
              <button id="ot-postular-confirm" class="flex-1 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all">Postularme</button>
            </div>
          </div>
        </div>
      </div>`);

    const modal = document.getElementById(modalId);
    const close = (val) => { modal.remove(); resolve(val); };
    // Mostrar nombre del archivo seleccionado
    document.getElementById('ot-postular-portfolio').addEventListener('change', function() {
      const file = this.files[0];
      const nameEl = document.getElementById('ot-pdf-name');
      if (file) {
        if (file.type !== 'application/pdf') {
          nameEl.textContent = '⚠️ Solo se aceptan archivos PDF';
          nameEl.classList.add('text-red-500');
          this.value = '';
        } else if (file.size > 10 * 1024 * 1024) {
          nameEl.textContent = '⚠️ El archivo supera los 10 MB';
          nameEl.classList.add('text-red-500');
          this.value = '';
        } else {
          nameEl.textContent = '✅ ' + file.name;
          nameEl.classList.remove('text-red-500');
          nameEl.classList.add('text-green-700');
        }
      } else {
        nameEl.textContent = 'Haz clic para seleccionar un PDF...';
        nameEl.classList.remove('text-green-700', 'text-red-500');
      }
    });

    document.getElementById('ot-postular-cancel').onclick = () => close(null);
    document.getElementById('ot-postular-confirm').onclick = () => {
      const fileInput = document.getElementById('ot-postular-portfolio');
      close({
        mensaje: document.getElementById('ot-postular-msg').value.trim(),
        pdfFile: fileInput.files[0] || null
      });
    };
  });

  if (postulacionData === null) return; // Cancelado

  // Subir PDF a R2 si se adjuntó uno
  let portafolio_url = null;
  if (postulacionData.pdfFile) {
    try {
      const formData = new FormData();
      formData.append('document', postulacionData.pdfFile);
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const uploadBtn = document.querySelector('#ot-postular-confirm');
      // Mostrar feedback de subida en el Toast
      Toast.info('Subiendo portafolio...', 'Por favor espera mientras se sube tu PDF.');
      const uploadRes = await fetch(`${API_BASE}/upload/document`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        Toast.error('Error al subir PDF', uploadData.error || 'No se pudo subir el portafolio.');
        return;
      }
      portafolio_url = uploadData.url;
    } catch (uploadErr) {
      console.error('[OT] Error subiendo PDF de portafolio:', uploadErr);
      Toast.error('Error al subir PDF', 'Verifica tu conexión e intenta de nuevo.');
      return;
    }
  }

  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE}/ordenes-trabajo/${id}/postular`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        usuario_id: usuarioId,
        mensaje: postulacionData.mensaje,
        portafolio_url: portafolio_url
      })
    });
    const data = await res.json();
    if (!res.ok) {
      Toast.error('No se pudo postular', data.mensaje || 'Ocurrió un error al enviar la postulación.');
      return;
    }
    Toast.success('Postulación enviada', 'El administrador revisará tu solicitud en breve.');
    await cargarOrdenesTrabajo();
  } catch (err) {
    console.error('[OT] Error al postularse:', err);
    Toast.error('Error de conexión', 'No se pudo enviar la postulación. Intenta de nuevo.');
  }
}

// ========================================
// H8 — NOTIFICACIONES CONTEXTUALES
// ========================================

// SVG helpers para icono de tipo de alerta
const _ALERTA_SVGS = {
    alerta: `<svg viewBox="0 0 20 20" fill="#2563eb" style="width:18px;height:18px;flex-shrink:0;"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`,
    exito:  `<svg viewBox="0 0 20 20" fill="#16a34a" style="width:18px;height:18px;flex-shrink:0;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`,
    recordatorio: `<svg viewBox="0 0 20 20" fill="#d97706" style="width:18px;height:18px;flex-shrink:0;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>`,
    critico: `<svg viewBox="0 0 20 20" fill="#dc2626" style="width:18px;height:18px;flex-shrink:0;"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`,
    sinAlertas: `<svg viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5" style="width:40px;height:40px;"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
};

let _alertasContextuales = [];          // caché de alertas activas
let _alertasLeidas = new Set(           // IDs de alertas ya leídas/descartadas (persiste en sessionStorage)
    JSON.parse(sessionStorage.getItem('alertasLeidas') || '[]')
);
let _alertasAnteriorIds = new Set();    // IDs de la vez anterior (para detectar nuevas)
let _alertaEmailCrossOriginWarned = false;
let _solicitudesPendientesCount = 0;    // Contador de solicitudes (para badge combinado)

/** Cambia entre las pestañas Solicitudes / Alertas del dropdown */
function switchNotifTab(tab) {
    const panelSol = document.getElementById('notifPanelSolicitudes');
    const panelAlt = document.getElementById('notifPanelAlertas');
    const tabSol   = document.getElementById('notifTabSolicitudes');
    const tabAlt   = document.getElementById('notifTabAlertas');
    if (!panelSol || !panelAlt) return;

    if (tab === 'alertas') {
        panelSol.classList.add('hidden');
        panelAlt.classList.remove('hidden');
        tabAlt.classList.add('border-indigo-600', 'text-indigo-600');
        tabAlt.classList.remove('border-transparent', 'text-gray-500');
        tabSol.classList.remove('border-indigo-600', 'text-indigo-600');
        tabSol.classList.add('border-transparent', 'text-gray-500');
        renderAlertasEnPanel();
    } else {
        panelAlt.classList.add('hidden');
        panelSol.classList.remove('hidden');
        tabSol.classList.add('border-indigo-600', 'text-indigo-600');
        tabSol.classList.remove('border-transparent', 'text-gray-500');
        tabAlt.classList.remove('border-indigo-600', 'text-indigo-600');
        tabAlt.classList.add('border-transparent', 'text-gray-500');
    }
}

/** Descarta una alerta individual y actualiza el badge */
function descartarAlerta(alertaId) {
    _alertasLeidas.add(alertaId);
    sessionStorage.setItem('alertasLeidas', JSON.stringify([..._alertasLeidas]));
    renderAlertasEnPanel();
    _actualizarBadgeAlertas();
}

/** Confirma lectura de una instrucción crítica */
function confirmarLecturaAlerta(alertaId) {
    descartarAlerta(alertaId);
    const btn = document.getElementById('confirmLecturaBtn_' + alertaId);
    if (btn) { btn.textContent = '✓ Confirmado'; btn.disabled = true; btn.classList.add('opacity-50'); }
    setTimeout(() => descartarAlerta(alertaId), 800);
}

/** Actualiza el badge naranja sobre la pestaña Alertas Y el badge rojo de la campana (combinado) */
function _actualizarBadgeAlertas() {
    const pendientes = _alertasContextuales.filter(a => !_alertasLeidas.has(a.id));
    const badge = document.getElementById('alertaBadge');
    if (badge) {
        if (pendientes.length > 0) {
            badge.classList.remove('hidden');
            badge.textContent = pendientes.length > 9 ? '9+' : pendientes.length;
        } else {
            badge.classList.add('hidden');
        }
    }
    // Actualizar campana principal: suma solicitudes + alertas no leídas
    _syncCampanaBadge();
}

/** Sincroniza el badge rojo de la campana con el total combinado */
function _syncCampanaBadge() {
    const pendientesAlertas = _alertasContextuales.filter(a => !_alertasLeidas.has(a.id)).length;
    const total = _solicitudesPendientesCount + pendientesAlertas;
    const campana = document.getElementById('notificationBadge');
    if (!campana) return;
    if (total > 0) {
        campana.classList.remove('hidden');
        campana.textContent = total > 99 ? '99+' : String(total);
    } else {
        campana.classList.add('hidden');
        campana.textContent = '';
    }
}

/** Renderiza las alertas dentro del panel */
function renderAlertasEnPanel() {
    const contenedor = document.getElementById('alertasList');
    if (!contenedor) return;

    const pendientes = _alertasContextuales.filter(a => !_alertasLeidas.has(a.id));

    if (pendientes.length === 0) {
        contenedor.innerHTML = `
        <div class="p-8 text-center flex flex-col items-center gap-2">
            ${_ALERTA_SVGS.sinAlertas}
            <p class="text-gray-400 text-sm">Sin alertas pendientes</p>
        </div>`;
        return;
    }

    const TIPO_STYLES = {
        alerta:       { bg: 'bg-blue-50',   border: 'border-blue-200',   svgKey: 'alerta',       label: 'Alerta',              labelCls: 'text-blue-700 bg-blue-100' },
        exito:        { bg: 'bg-green-50',  border: 'border-green-200',  svgKey: 'exito',        label: 'Completado',          labelCls: 'text-green-700 bg-green-100' },
        recordatorio: { bg: 'bg-amber-50',  border: 'border-amber-200',  svgKey: 'recordatorio', label: 'Recordatorio',        labelCls: 'text-amber-700 bg-amber-100' },
        critico:      { bg: 'bg-red-50',    border: 'border-red-200',    svgKey: 'critico',      label: 'Instrucción Crítica', labelCls: 'text-red-700 bg-red-100' },
    };

    contenedor.innerHTML = pendientes.map(a => {
        const s = TIPO_STYLES[a.tipo] || TIPO_STYLES.alerta;
        const iconHtml = _ALERTA_SVGS[s.svgKey] || _ALERTA_SVGS.alerta;
        const confirmBtn = a.tipo === 'critico'
            ? `<button id="confirmLecturaBtn_${a.id}" onclick="confirmarLecturaAlerta('${a.id}')"
                   class="mt-2 w-full py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-1">
                   <svg viewBox="0 0 20 20" fill="currentColor" style="width:12px;height:12px;"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
                   Confirmar lectura
               </button>`
            : '';
        return `
        <div class="flex gap-3 p-3 rounded-xl border ${s.bg} ${s.border} mb-1.5">
            <span class="leading-none mt-0.5 shrink-0">${iconHtml}</span>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full ${s.labelCls}">${s.label}</span>
                    ${a.orden ? `<span class="text-[10px] text-gray-400 truncate">${a.orden}</span>` : ''}
                </div>
                <p class="text-sm font-semibold text-gray-800">${a.titulo}</p>
                ${a.detalle ? `<p class="text-xs text-gray-500 mt-0.5">${a.detalle}</p>` : ''}
                ${confirmBtn}
            </div>
            <button onclick="descartarAlerta('${a.id}')" class="text-gray-300 hover:text-gray-500 shrink-0 self-start leading-none" style="font-size:18px;line-height:1;">&#215;</button>
        </div>`;
    }).join('');
}

/**
 * Carga alertas contextuales consultando las órdenes de trabajo:
 *  - Nuevas postulaciones  → tipo "alerta"
 *  - Obras finalizadas     → tipo "exito"
 *  - Mañana inicia obra    → tipo "recordatorio"
 *  - Crítico: instrucciones críticas en grupos OT
 */
async function cargarAlertasContextuales() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        if (!usuarioId) return;

        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

        const res = await fetch(`${API_BASE}/ordenes-trabajo`, { headers });
        if (!res.ok) return;
        const json = await res.json();
        const ordenes = (json.data || json || []).filter(o => String(o.usuario_id) === String(usuarioId));

        const nuevasAlertas = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);

        for (const orden of ordenes) {
            const tituloOrden = orden.titulo || `Orden #${orden.id_orden || orden.id}`;
            const idBase = String(orden.id_orden || orden.id);

            // 1. Nuevas postulaciones pendientes
            try {
                const rp = await fetch(`${API_BASE}/ordenes-trabajo/${idBase}/postulaciones`, { headers });
                if (rp.ok) {
                    const jp = await rp.json();
                    const pendientes = (jp.data || []).filter(p => p.estado === 'pendiente');
                    if (pendientes.length > 0) {
                        // ID incluye el conteo: cada nuevo postulante genera una alerta fresca
                        // aunque el admin haya descartado la alerta anterior
                        nuevasAlertas.push({
                            id: `postulado_${idBase}_n${pendientes.length}`,
                            tipo: 'alerta',
                            titulo: `Nuevo técnico postulado`,
                            detalle: `${pendientes.length} postulante${pendientes.length > 1 ? 's' : ''} esperando revisión`,
                            orden: tituloOrden
                        });
                    }
                }
            } catch (e) { /* ignorar */ }

            // 2. Obra finalizada
            const estadoFin = (orden.estado || '').toLowerCase();
            if (estadoFin === 'finalizada' || estadoFin === 'completada' || estadoFin === 'finalizado') {
                nuevasAlertas.push({
                    id: `finalizada_${idBase}`,
                    tipo: 'exito',
                    titulo: `Obra finalizada`,
                    detalle: `La orden ha sido marcada como completada`,
                    orden: tituloOrden
                });
            }

            // 3. Mañana inicia obra
            if (orden.fecha_inicio) {
                const fInicio = new Date(orden.fecha_inicio);
                fInicio.setHours(0, 0, 0, 0);
                if (fInicio.getTime() === manana.getTime()) {
                    nuevasAlertas.push({
                        id: `manana_${idBase}`,
                        tipo: 'recordatorio',
                        titulo: `Mañana inicia obra`,
                        detalle: `La orden comienza mañana`,
                        orden: tituloOrden
                    });
                }
            }
        }

        // 4. Verificar mensajes críticos en conversaciones de grupos OT
        const convs = window.conversacionesDashboard || [];
        for (const conv of convs.filter(c => (c.nombre_contacto || '').startsWith('OT:'))) {
            const ult = (conv.ultimo_mensaje || '').toUpperCase();
            if (ult.includes('[CRÍTICO]') || ult.includes('[CRITICO]') || ult.includes('[URGENTE]')) {
                nuevasAlertas.push({
                    id: `critico_conv_${conv.id_conversacion}`,
                    tipo: 'critico',
                    titulo: 'Instrucción crítica sin confirmar',
                    detalle: conv.ultimo_mensaje?.replace(/\[CRÍTICO\]|\[CRITICO\]|\[URGENTE\]/gi, '').trim(),
                    orden: conv.nombre_contacto
                });
            }
        }

        // 5. Estado de MIS propias postulaciones (aceptada / rechazada)
        // NOTA: el endpoint devuelve 'estado_postulacion', no 'estado'
        try {
            const rMisPost = await fetch(`${API_BASE}/ordenes-trabajo/mis-postulaciones?usuario_id=${usuarioId}`, { headers });
            if (rMisPost.ok) {
                const jMisPost = await rMisPost.json();
                for (const p of (jMisPost.data || [])) {
                    const est = (p.estado_postulacion || p.estado || '').toLowerCase();
                    if (est === 'aceptada') {
                        nuevasAlertas.push({
                            id: `mi_post_aceptada_${p.id_postulacion}`,
                            tipo: 'exito',
                            titulo: '¡Tu postulación fue aceptada!',
                            detalle: `Has sido seleccionado para "${p.titulo || `Orden #${p.id_orden}`}". Revisa el grupo de mensajería.`,
                            orden: p.titulo || ''
                        });
                    } else if (est === 'rechazada') {
                        nuevasAlertas.push({
                            id: `mi_post_rechazada_${p.id_postulacion}`,
                            tipo: 'alerta',
                            titulo: 'Tu postulación no fue seleccionada',
                            detalle: `Para "${p.titulo || `Orden #${p.id_orden}`}". ¡Sigue intentándolo!`,
                            orden: p.titulo || ''
                        });
                    }
                }
            }
        } catch (e) { /* ignorar */ }

        _alertasContextuales = nuevasAlertas;
        _actualizarBadgeAlertas();

        // Detectar alertas NUEVAS (no estaban en la carga anterior) y enviar correo
        const nuevasIds = nuevasAlertas.map(a => a.id);
        const realesNuevas = nuevasAlertas.filter(a => !_alertasAnteriorIds.has(a.id) && !_alertasLeidas.has(a.id));
        _alertasAnteriorIds = new Set(nuevasIds);

        if (realesNuevas.length > 0) {
            const usuarioId = localStorage.getItem('usuarioId');
            if (usuarioId) {
            // En despliegues cross-origin (ej. Vercel -> Railway) este endpoint puede fallar por CORS/502.
            // El disparo de correo debe vivir en backend (job/trigger server-side).
            const esMismoOrigenApi = API_BASE.startsWith(`${window.location.origin}/api`);
            if (esMismoOrigenApi) {
              fetch(`${API_BASE}/ordenes-trabajo/enviar-alerta-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario_id: usuarioId, alertas: realesNuevas })
              }).catch(e => console.debug('[H8 email]', e));
            } else if (!_alertaEmailCrossOriginWarned) {
              _alertaEmailCrossOriginWarned = true;
              console.info('[H8 email] envio desde frontend omitido en cross-origin; mover a backend.');
            }
            }
        }

        // Si el panel de alertas está visible, re-render
        const panelAlt = document.getElementById('notifPanelAlertas');
        if (panelAlt && !panelAlt.classList.contains('hidden')) {
            renderAlertasEnPanel();
        }
    } catch (err) {
        console.debug('[H8] Error al cargar alertas contextuales:', err);
    }
}

// Polling de alertas contextuales
document.addEventListener('DOMContentLoaded', () => {
    // 1ª carga a los 3 segundos
    setTimeout(cargarAlertasContextuales, 3000);
    // Polling completo cada 2 minutos
    setInterval(cargarAlertasContextuales, 2 * 60 * 1000);
    // Polling rápido solo de mis-postulaciones cada 30 segundos
    setInterval(_checkMisPostulacionesRapido, 30 * 1000);
    // Re-chequear inmediatamente cuando el usuario vuelve a la pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            setTimeout(cargarAlertasContextuales, 500);
        }
    });
});

/** Chequeo rápido solo del estado de mis postulaciones (liviano, cada 30s) */
async function _checkMisPostulacionesRapido() {
    try {
        const usuarioId = localStorage.getItem('usuarioId');
        if (!usuarioId) return;
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

        // --- Para usuarios normales: estado de sus propias postulaciones ---
        const r = await fetch(`${API_BASE}/ordenes-trabajo/mis-postulaciones?usuario_id=${usuarioId}`, { headers });
        if (r.ok) {
            const { data } = await r.json();
            let cambio = false;
            for (const p of (data || [])) {
                const est = (p.estado_postulacion || p.estado || '').toLowerCase();
                const idAcep = `mi_post_aceptada_${p.id_postulacion}`;
                const idRech = `mi_post_rechazada_${p.id_postulacion}`;
                const yaExiste = _alertasContextuales.some(a => a.id === idAcep || a.id === idRech);
                if (!yaExiste) {
                    if (est === 'aceptada') {
                        _alertasContextuales.push({ id: idAcep, tipo: 'exito', titulo: '¡Tu postulación fue aceptada!', detalle: `Has sido seleccionado para "${p.titulo || `Orden #${p.id_orden}`}". Revisa el grupo de mensajería.`, orden: p.titulo || '' });
                        cambio = true;
                    } else if (est === 'rechazada') {
                        _alertasContextuales.push({ id: idRech, tipo: 'alerta', titulo: 'Tu postulación no fue seleccionada', detalle: `Para "${p.titulo || `Orden #${p.id_orden}`}". ¡Sigue intentándolo!`, orden: p.titulo || '' });
                        cambio = true;
                    }
                }
            }
            if (cambio) {
                _actualizarBadgeAlertas();
                const panelAlt = document.getElementById('notifPanelAlertas');
                if (panelAlt && !panelAlt.classList.contains('hidden')) renderAlertasEnPanel();
                return; // usuario normal: ya terminamos
            }
        }

        // --- Para el admin: verificar si hay nuevos postulantes en sus órdenes ---
        const esAdmin = localStorage.getItem('usuarioRolId') === '1';
        if (!esAdmin) return;
        const resOT = await fetch(`${API_BASE}/ordenes-trabajo`, { headers });
        if (!resOT.ok) return;
        const jsonOT = await resOT.json();
        const misOrdenes = (jsonOT.data || jsonOT || []).filter(o => String(o.usuario_id) === String(usuarioId));
        let cambioAdmin = false;
        for (const orden of misOrdenes) {
            const idBase = String(orden.id_orden || orden.id);
            try {
                const rp = await fetch(`${API_BASE}/ordenes-trabajo/${idBase}/postulaciones`, { headers });
                if (!rp.ok) continue;
                const jp = await rp.json();
                const pendientes = (jp.data || []).filter(p => p.estado === 'pendiente');
                if (pendientes.length === 0) continue;
                const alertId = `postulado_${idBase}_n${pendientes.length}`;
                const yaExiste = _alertasContextuales.some(a => a.id === alertId);
                if (!yaExiste) {
                    // Limpiar alertas anteriores de esta misma orden (conteos menores)
                    const _filtradas = _alertasContextuales.filter(a => !a.id.startsWith(`postulado_${idBase}_n`));
                    _alertasContextuales.length = 0;
                    _filtradas.forEach(a => _alertasContextuales.push(a));
                    _alertasContextuales.push({
                        id: alertId,
                        tipo: 'alerta',
                        titulo: `Nuevo técnico postulado`,
                        detalle: `${pendientes.length} postulante${pendientes.length > 1 ? 's' : ''} esperando revisión`,
                        orden: orden.titulo || `Orden #${idBase}`
                    });
                    cambioAdmin = true;
                }
            } catch (e) { /* ignorar */ }
        }
        if (cambioAdmin) {
            _actualizarBadgeAlertas();
            const panelAlt = document.getElementById('notifPanelAlertas');
            if (panelAlt && !panelAlt.classList.contains('hidden')) renderAlertasEnPanel();
        }
    } catch (e) { /* silencioso */ }
}

// =====================================================
// CACHE ORDENES DE TRABAJO (H8 / UX)
// =====================================================
const _OT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/** Fuerza recarga limpiando caché y girando icono */
function refrescarOrdenesTrabajo() {
    sessionStorage.removeItem('cache_ot_data');
    sessionStorage.removeItem('cache_ot_ts');
    const icon = document.getElementById('iconRefrescarOrdenes');
    if (icon) { icon.style.transition = 'transform 0.6s'; icon.style.transform = 'rotate(360deg)'; setTimeout(() => { icon.style.transform = ''; }, 650); }
    cargarOrdenesTrabajo();
}
