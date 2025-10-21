/**
 * Componente de imagen con efecto BlurFade y manejo de errores
 * @param {object} props - Propiedades del componente
 * @param {string} props.src - URL de la imagen.
 * @param {string} props.alt - Texto alternativo de la imagen.
 * @param {number} props.delay - Retraso en segundos antes de que la imagen aparezca.
 * @param {Function} props.onContextMenu - Función para el menú contextual.
 */
const AnimatedImage = ({ src, alt, delay, onContextMenu }) => {
  const { useState } = React;
  const BlurFade = window.BlurFade; // Obtener BlurFade del window
  const [touchTimer, setTouchTimer] = useState(null);
  
  const handleTouchStart = (e) => {
    const timer = setTimeout(() => {
      // Simular un evento de click derecho con las coordenadas del toque
      const touch = e.touches[0];
      const fakeEvent = {
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY
      };
      onContextMenu(fakeEvent);
    }, 500); // 500ms de mantener presionado
    setTouchTimer(timer);
  };

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer);
      setTouchTimer(null);
    }
  };

  return (
    // Utilizamos BlurFade para animación avanzada con desenfoque
    <BlurFade delay={delay} inView={true}>
      <div 
        className="gallery-image-container"
        onContextMenu={onContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <img
          className="gallery-image"
          src={src}
          alt={alt}
          // Manejo de error de carga de imagen
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co/800x800/94a3b8/000000?text=Error+Carga";
          }}
        />
      </div>
    </BlurFade>
  );
};

/**
 * Componente de galería con efecto de aparición escalonada
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.images - Lista de imágenes a mostrar
 * @param {Function} props.onUpload - Función a ejecutar cuando se quiere subir una imagen
 * @param {Function} props.onImageContextMenu - Función para el menú contextual de imagen
 */
const GaleriaUniforme = ({ images = [], onUpload, onImageContextMenu }) => {
  const { useRef } = React;
  const fileInputRef = useRef(null);
  const hasImages = images.length > 0;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageContextMenu = (e, index) => {
    e.preventDefault();
    if (onImageContextMenu) {
      onImageContextMenu(e, index);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="section-title-white">Galería de Fotos</h2>
      
      {/* Descripción simple de la galería */}
      <p className="section-description">
        Toca en un espacio con línea punteada para subir una imagen. {images.length}/3 imágenes
      </p>

      {/* Input oculto para subir imágenes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg, image/png, image/gif"
        onChange={onUpload}
        style={{ display: 'none' }}
        id="gallery-upload"
      />

      <section id="photos" className="w-full flex justify-center mt-5">
        {/* Siempre mostramos un grid de exactamente 3 espacios */}
        <div className="gallery-grid">
          {/* Mostramos hasta 3 imágenes (o placeholders para completar) */}
          {[0, 1, 2].map(idx => {
            const image = images[idx];
            
            if (image) {
              // Si existe una imagen para esta posición, la mostramos
              return (
                <div key={image.id} className="gallery-item">
                  <AnimatedImage
                    src={image.url}
                    alt={image.title || `Imagen ${idx + 1}`}
                    delay={0.25 + idx * 0.1}
                    onContextMenu={(e) => handleImageContextMenu(e, idx)}
                  />
                </div>
              );
            } else {
              // Si no hay imagen, mostramos un espacio vacío clicable
              return (
                <div 
                  key={`empty-${idx}`} 
                  className="gallery-item empty-slot"
                  onClick={handleUploadClick}
                >
                  <div className="empty-slot-icon">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M40 10L40 50M40 10L25 25M40 10L55 25" stroke="rgba(255,255,255,0.7)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M15 65H65" stroke="rgba(255,255,255,0.7)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M40 70C56.5685 70 70 56.5685 70 40C70 23.4315 56.5685 10 40 10C23.4315 10 10 23.4315 10 40C10 56.5685 23.4315 70 40 70Z" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </section>
    </div>
  );
};

window.GaleriaUniforme = GaleriaUniforme;