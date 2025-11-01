/**
 * GaleriaUniforme - Versión JavaScript Vanilla
 * Sistema de galería de imágenes con upload y menú contextual
 * 
 * Uso:
 * const galeria = new GaleriaUniforme(containerElement, {
 *   images: [],
 *   onUpload: (file) => {...},
 *   onImageContextMenu: (e, index) => {...},
 *   maxImages: 3
 * });
 */

class GaleriaUniforme {
  constructor(container, options = {}) {
    this.container = container;
    this.config = {
      images: options.images || [],
      onUpload: options.onUpload || (() => {}),
      onImageContextMenu: options.onImageContextMenu || (() => {}),
      maxImages: options.maxImages || 3
    };
    
    this.fileInput = null;
    this.init();
  }
  
  init() {
    this.container.classList.add('galeria-uniforme-container');
    this.render();
  }
  
  render() {
    this.container.innerHTML = '';
    
    // Crear grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'gallery-grid';
    
    // Renderizar imágenes existentes
    this.config.images.forEach((img, index) => {
      const imageItem = this.createImageItem(img, index);
      gridContainer.appendChild(imageItem);
    });
    
    // Agregar botón de upload si no se alcanzó el máximo
    if (this.config.images.length < this.config.maxImages) {
      const uploadButton = this.createUploadButton();
      gridContainer.appendChild(uploadButton);
    }
    
    this.container.appendChild(gridContainer);
  }
  
  createImageItem(img, index) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    
    const imgElement = document.createElement('img');
    imgElement.src = img.url;
    imgElement.alt = img.title || `Galería ${index + 1}`;
    imgElement.loading = 'lazy';
    
    // Manejador de error de carga
    imgElement.onerror = () => {
      imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
    };
    
    // Menú contextual
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.config.onImageContextMenu(e, index);
    });
    
    // Click para ampliar (opcional)
    item.addEventListener('click', () => {
      this.openImageModal(img.url);
    });
    
    item.appendChild(imgElement);
    return item;
  }
  
  createUploadButton() {
    const uploadItem = document.createElement('div');
    uploadItem.className = 'gallery-item gallery-upload';
    
    uploadItem.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" style="width: 48px; height: 48px; color: #9ca3af;" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
      <p style="margin-top: 8px; font-size: 12px; color: #6b7280;">Agregar imagen</p>
    `;
    
    uploadItem.addEventListener('click', () => {
      this.triggerFileUpload();
    });
    
    return uploadItem;
  }
  
  triggerFileUpload() {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'image/jpeg, image/png, image/gif';
      this.fileInput.style.display = 'none';
      
      this.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          // Crear evento sintético para mantener compatibilidad
          const syntheticEvent = {
            target: { files: [file], value: '' }
          };
          this.config.onUpload(syntheticEvent);
        }
        // Limpiar input
        this.fileInput.value = '';
      });
      
      document.body.appendChild(this.fileInput);
    }
    
    this.fileInput.click();
  }
  
  openImageModal(imageUrl) {
    // Modal simple para ver imagen ampliada
    const modal = document.createElement('div');
    modal.className = 'image-modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
      backdrop-filter: blur(4px);
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    `;
    
    modal.appendChild(img);
    
    // Cerrar al hacer click
    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Cerrar con ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (document.body.contains(modal)) {
          document.body.removeChild(modal);
        }
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
    
    document.body.appendChild(modal);
  }
  
  // Método para actualizar imágenes externamente
  setImages(images) {
    this.config.images = images;
    this.render();
  }
  
  // Método para agregar una imagen
  addImage(image) {
    if (this.config.images.length < this.config.maxImages) {
      this.config.images.push(image);
      this.render();
    }
  }
  
  // Método para eliminar una imagen
  removeImage(index) {
    this.config.images.splice(index, 1);
    this.render();
  }
  
  // Destructor
  destroy() {
    if (this.fileInput && document.body.contains(this.fileInput)) {
      document.body.removeChild(this.fileInput);
    }
    this.container.innerHTML = '';
  }
}

// Estilos CSS para la galería (inyectar si no existen)
const galeriaStyles = `
/* Estilos para GaleriaUniforme */
.galeria-uniforme-container {
  width: 100%;
}

.image-modal-overlay img {
  animation: modalZoomIn 0.3s ease-out;
}

@keyframes modalZoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Hover effect para items de galería */
.gallery-item {
  position: relative;
}

.gallery-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0);
  border-radius: 12px;
  transition: background 0.3s ease;
  pointer-events: none;
}

.gallery-item:hover::after {
  background: rgba(0, 0, 0, 0.1);
}

.gallery-upload:hover {
  background: #f3f4f6 !important;
  border-color: #9ca3af !important;
}

/* Loading state */
.gallery-item.loading {
  position: relative;
}

.gallery-item.loading::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border: 3px solid rgba(37, 99, 235, 0.3);
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
`;

// Inyectar estilos si no existen
if (!document.getElementById('galeria-uniforme-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'galeria-uniforme-styles';
  styleSheet.textContent = galeriaStyles;
  document.head.appendChild(styleSheet);
}

// Hacer disponible globalmente
window.GaleriaUniforme = GaleriaUniforme;