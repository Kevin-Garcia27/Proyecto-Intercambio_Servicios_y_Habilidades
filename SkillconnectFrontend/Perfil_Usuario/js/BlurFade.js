/**
 * BlurFade - Versión JavaScript Vanilla
 * Efecto de desenfoque y aparición gradual para elementos
 * 
 * Uso:
 * const blurFade = new BlurFade(element, {
 *   delay: 0.3,
 *   inView: true
 * });
 * 
 * O aplicar directamente a elementos con clase:
 * BlurFade.applyToElements('.blur-fade', { delay: 0.2 });
 */

class BlurFade {
  constructor(element, options = {}) {
    this.element = element;
    this.config = {
      delay: options.delay || 0,
      inView: options.inView !== undefined ? options.inView : true,
      duration: options.duration || 0.8
    };
    
    this.isVisible = false;
    this.isLoaded = false;
    this.timers = [];
    
    this.init();
  }
  
  init() {
    if (!this.config.inView) return;
    
    // Establecer estilos iniciales
    this.element.style.opacity = '0';
    this.element.style.filter = 'blur(20px)';
    this.element.style.transform = 'scale(0.95)';
    this.element.style.transition = `opacity ${this.config.duration}s ease-out, filter ${this.config.duration}s ease-out, transform ${this.config.duration}s ease-out`;
    
    // Iniciar animación
    this.startAnimation();
  }
  
  startAnimation() {
    // Primera fase: reducir desenfoque
    const blurTimer = setTimeout(() => {
      this.isLoaded = true;
      this.element.style.filter = 'blur(0)';
    }, this.config.delay * 1000);
    
    this.timers.push(blurTimer);
    
    // Segunda fase: aparecer completamente
    const visibilityTimer = setTimeout(() => {
      this.isVisible = true;
      this.element.style.opacity = '1';
      this.element.style.transform = 'scale(1)';
    }, (this.config.delay + 0.2) * 1000);
    
    this.timers.push(visibilityTimer);
  }
  
  // Reiniciar animación
  reset() {
    this.cleanup();
    this.isVisible = false;
    this.isLoaded = false;
    this.init();
  }
  
  // Limpiar timers
  cleanup() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
  }
  
  // Destructor
  destroy() {
    this.cleanup();
    this.element.style.opacity = '';
    this.element.style.filter = '';
    this.element.style.transform = '';
    this.element.style.transition = '';
  }
  
  // Método estático para aplicar a múltiples elementos
  static applyToElements(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    
    elements.forEach((element, index) => {
      // Aplicar delay incremental si se desea
      const elementDelay = options.delay || 0;
      const staggerDelay = options.stagger ? index * options.stagger : 0;
      
      const instance = new BlurFade(element, {
        ...options,
        delay: elementDelay + staggerDelay
      });
      
      instances.push(instance);
    });
    
    return instances;
  }
  
  // Método estático con Intersection Observer para lazy loading
  static applyWithIntersectionObserver(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = new Map();
    
    const observerOptions = {
      root: null,
      rootMargin: options.rootMargin || '0px',
      threshold: options.threshold || 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !instances.has(entry.target)) {
          const instance = new BlurFade(entry.target, {
            ...options,
            inView: true
          });
          instances.set(entry.target, instance);
          
          // Dejar de observar después de animar
          if (options.once !== false) {
            observer.unobserve(entry.target);
          }
        }
      });
    }, observerOptions);
    
    elements.forEach(element => observer.observe(element));
    
    return { observer, instances };
  }
}

// ==============================================
// HELPERS Y UTILIDADES
// ==============================================

/**
 * Aplicar BlurFade a imágenes cuando se cargan
 */
BlurFade.applyToImages = function(selector, options = {}) {
  const images = document.querySelectorAll(selector);
  const instances = [];
  
  images.forEach((img, index) => {
    // Esperar a que la imagen se cargue
    const applyEffect = () => {
      const staggerDelay = options.stagger ? index * options.stagger : 0;
      const instance = new BlurFade(img, {
        ...options,
        delay: (options.delay || 0) + staggerDelay
      });
      instances.push(instance);
    };
    
    if (img.complete) {
      applyEffect();
    } else {
      img.addEventListener('load', applyEffect, { once: true });
    }
  });
  
  return instances;
};

/**
 * Aplicar BlurFade a elementos hijos de un contenedor
 */
BlurFade.applyToChildren = function(containerSelector, options = {}) {
  const container = document.querySelector(containerSelector);
  if (!container) return [];
  
  const children = Array.from(container.children);
  return BlurFade.applyToElements(children.map((_, i) => `${containerSelector} > *:nth-child(${i + 1})`).join(', '), {
    ...options,
    stagger: options.stagger || 0.1
  });
};

// ==============================================
// ESTILOS CSS (OPCIONALES)
// ==============================================

const blurFadeStyles = `
/* Clase base para BlurFade */
.blur-fade {
  will-change: opacity, filter, transform;
}

/* Prevenir flash de contenido sin estilo */
.blur-fade-preload {
  opacity: 0;
  filter: blur(20px);
  transform: scale(0.95);
}

/* Variantes de velocidad */
.blur-fade-fast {
  transition-duration: 0.4s !important;
}

.blur-fade-slow {
  transition-duration: 1.2s !important;
}

/* Variantes de dirección */
.blur-fade-up {
  transform: translateY(20px) scale(0.95);
}

.blur-fade-down {
  transform: translateY(-20px) scale(0.95);
}

.blur-fade-left {
  transform: translateX(20px) scale(0.95);
}

.blur-fade-right {
  transform: translateX(-20px) scale(0.95);
}

/* Optimización para animaciones */
@media (prefers-reduced-motion: reduce) {
  .blur-fade {
    transition: none !important;
    filter: none !important;
    transform: none !important;
    opacity: 1 !important;
  }
}
`;

// Inyectar estilos si no existen
if (!document.getElementById('blur-fade-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'blur-fade-styles';
  styleSheet.textContent = blurFadeStyles;
  document.head.appendChild(styleSheet);
}

// ==============================================
// EJEMPLOS DE USO
// ==============================================

/**
 * Ejemplo 1: Aplicar a elementos específicos
 * BlurFade.applyToElements('.gallery-item', { delay: 0.2, stagger: 0.1 });
 * 
 * Ejemplo 2: Aplicar con Intersection Observer (lazy loading)
 * const { observer, instances } = BlurFade.applyWithIntersectionObserver('.card', {
 *   delay: 0.1,
 *   threshold: 0.2,
 *   once: true
 * });
 * 
 * Ejemplo 3: Aplicar a imágenes cuando se cargan
 * BlurFade.applyToImages('.profile-pic', { delay: 0.3 });
 * 
 * Ejemplo 4: Aplicar a hijos de un contenedor con efecto cascada
 * BlurFade.applyToChildren('.skills-container', { stagger: 0.05 });
 */

// Hacer disponible globalmente
window.BlurFade = BlurFade;

// ==============================================
// AUTO-INICIALIZACIÓN (OPCIONAL)
// ==============================================

// Buscar elementos con atributo data-blur-fade y aplicar automáticamente
document.addEventListener('DOMContentLoaded', () => {
  const autoElements = document.querySelectorAll('[data-blur-fade]');
  
  autoElements.forEach(element => {
    const delay = parseFloat(element.dataset.blurFadeDelay || 0);
    const duration = parseFloat(element.dataset.blurFadeDuration || 0.8);
    
    new BlurFade(element, { delay, duration });
  });
});