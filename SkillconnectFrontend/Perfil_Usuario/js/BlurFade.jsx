/**
 * Componente BlurFade para crear un efecto de desenfoque y aparición gradual
 * @param {object} props 
 * @param {React.ReactNode} props.children - Elemento hijo a animar (normalmente una imagen)
 * @param {number} props.delay - Retraso en segundos antes de iniciar la animación
 * @param {boolean} props.inView - Si el componente está en el viewport (por defecto true)
 */
const BlurFade = ({ children, delay = 0, inView = true }) => {
  const { useState, useEffect } = React;
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!inView) return;

    // Primera fase: iniciar el desenfoque
    const blurTimer = setTimeout(() => {
      setIsLoaded(true);
    }, delay * 1000);

    // Segunda fase: completar la aparición
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true);
    }, (delay + 0.2) * 1000);

    return () => {
      clearTimeout(blurTimer);
      clearTimeout(visibilityTimer);
    };
  }, [delay, inView]);

  // Aplicamos los estilos de transición
  const styles = {
    opacity: isVisible ? 1 : 0,
    filter: isLoaded ? 'blur(0)' : 'blur(20px)',
    transform: isVisible ? 'scale(1)' : 'scale(0.95)',
    transition: `opacity 0.6s ease-out, filter 0.8s ease-out, transform 0.8s ease-out`,
  };

  return (
    <div style={styles}>
      {children}
    </div>
  );
};

window.BlurFade = BlurFade;