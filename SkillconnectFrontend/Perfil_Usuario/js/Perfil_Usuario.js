function Perfil_Usuario() {
  const { useState, useEffect, useRef } = React;
  const navigate = null; // Sin React Router en CDN
  
  // Obtener componentes del window
  const PixelBarChart = window.PixelBarChart;
  const GaleriaUniforme = window.GaleriaUniforme;
  const InlineEditable = window.InlineEditable;
  const SelectEditable = window.SelectEditable;
  const BlurFade = window.BlurFade;
  
  // Usuario editable
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const usuarioId = 1; // ID del usuario que acabas de crear (puedes cambiarlo)
  const [direccionId, setDireccionId] = useState(null); // ID de la dirección del usuario
  const [geolocalizacionId, setGeolocalizacionId] = useState(null); // ID de la geolocalización
  
  // Referencia al input de tipo file para la imagen de perfil
  const fileInputRef = useRef(null);
  
  // Referencia al contenedor del mapa
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Estado para las imágenes de la galería
  const [galeriaImagenes, setGaleriaImagenes] = useState([]);
  
  // Estado para geolocalización (con ubicación por defecto en Honduras)
  const [geolocalizacion, setGeolocalizacion] = useState({
    latitud: 14.0650,  // Coordenadas de Tegucigalpa, Honduras (por defecto)
    longitud: -87.1715,
    obteniendo: false,
    mensaje: '',
    ubicacionReal: false  // Para saber si es la ubicación real o por defecto
  });

  // Cargar datos del usuario desde la base de datos
  useEffect(() => {
    cargarUsuario();
  }, []);

  const cargarUsuario = async () => {
    try {
      setCargando(true);
      const resultado = await obtenerPersonaPorId(usuarioId);
      
      if (resultado.success) {
        const personaDB = resultado.data;
        
        // Cargar dirección del usuario
        let direccionDB = null;
        try {
          const resultadoDireccion = await obtenerDireccionPorPersona(usuarioId);
          if (resultadoDireccion.success && resultadoDireccion.data) {
            direccionDB = resultadoDireccion.data;
            setDireccionId(direccionDB.id_Direccion);
          }
        } catch (errDireccion) {
          console.error('No se encontró dirección para este usuario');
        }
        
        // Mapear los campos de la base de datos al formato del estado
        setUsuario({
          nombre_Usuario: personaDB.nombre_Persona || '',
          apellido_Usuario: personaDB.apellido_Persona || '',
          descripcion_Usuario: personaDB.descripcionPerfil_Persona || '',
          imagenUrl_Usuario: personaDB.imagenUrl_Persona || '',
          imagen1Url_Usuario: personaDB.imagen1Url_Persona || '',
          imagen2Url_Usuario: personaDB.imagen2Url_Persona || '',
          imagen3Url_Usuario: personaDB.imagen3Url_Persona || '',
          pais: direccionDB?.pais_Direccion || '',
          departamento: direccionDB?.departamento_Direccion || '',
          ciudad: direccionDB?.ciudad_Direccion || '',
          codigoPostal: direccionDB?.codigoPostal_Direccion || '',
          estadoCivil_Usuario: personaDB.estadoCivil_Persona || 'Soltero',
          genero_Usuario: personaDB.genero_Persona || 'Otro',
          tipoIdentificacion_Usuario: personaDB.tipoIdentificacion_Persona || 'DNI',
          identificacion_usuario: personaDB.identificacion_Persona || '',
          fechaNacimiento: personaDB.fechaNac_Persona || ''
        });

        // Cargar imágenes de la galería si existen
        const imagenes = [];
        if (personaDB.imagen1Url_Persona) {
          imagenes.push({ id: 1, url: personaDB.imagen1Url_Persona });
        }
        if (personaDB.imagen2Url_Persona) {
          imagenes.push({ id: 2, url: personaDB.imagen2Url_Persona });
        }
        if (personaDB.imagen3Url_Persona) {
          imagenes.push({ id: 3, url: personaDB.imagen3Url_Persona });
        }
        setGaleriaImagenes(imagenes);
        
        // Cargar habilidades del usuario
        try {
          const resultadoHabilidades = await obtenerHabilidadesPorPersona(usuarioId);
          if (resultadoHabilidades.success && resultadoHabilidades.data) {
            const habilidades = resultadoHabilidades.data;
            
            // Separar entre ofrecidas y necesitadas
            const ofrecidas = habilidades
              .filter(h => h.tipoEstado_Habilidad === 'Ofrece')
              .map(h => ({
                id: h.id_Habilidad,
                name: h.nombre_Habilidad,
                description: h.descripcion_Habilidad || '',
                categoryId: h.id_categorias_Habilidades_Servicios
              }));
            
            const necesitadas = habilidades
              .filter(h => h.tipoEstado_Habilidad === 'Necesita')
              .map(h => ({
                id: h.id_Habilidad,
                name: h.nombre_Habilidad,
                description: h.descripcion_Habilidad || '',
                categoryId: h.id_categorias_Habilidades_Servicios
              }));
            
            setOfferedSkills(ofrecidas);
            setRequiredSkills(necesitadas);
          }
        } catch (errHabilidades) {
          console.error('Error al cargar habilidades:', errHabilidades);
        }
        
        // Cargar categorías
        try {
          const resultadoCategorias = await obtenerTodasCategorias();
          if (resultadoCategorias.success && resultadoCategorias.data) {
            setCategorias(resultadoCategorias.data);
          }
        } catch (errCategorias) {
          console.error('Error al cargar categorías:', errCategorias);
        }
        
        // Cargar geolocalización si existe una dirección
        if (direccionDB && direccionDB.id_Direccion) {
          try {
            const resultadoGeo = await obtenerGeolocalizacionPorDireccion(direccionDB.id_Direccion);
            if (resultadoGeo.success && resultadoGeo.data) {
              const geoDB = resultadoGeo.data;
              const latitudDB = geoDB.latitud_Geolocalizacion;
              const longitudDB = geoDB.Longitud_Geolocalizacion;
              
              setGeolocalizacionId(geoDB.id_Geolocalizacion);
              setGeolocalizacion({
                latitud: latitudDB,
                longitud: longitudDB,
                obteniendo: false,
                mensaje: '',
                ubicacionReal: true  // Es ubicación real porque viene de la BD
              });
              
              // Si los campos de dirección están vacíos, hacer geocodificación inversa automática
              const direccionVacia = !direccionDB.pais_Direccion && 
                                    !direccionDB.departamento_Direccion && 
                                    !direccionDB.ciudad_Direccion;
              
              if (direccionVacia && latitudDB && longitudDB) {
                // Hacer geocodificación inversa para llenar los campos
                try {
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitudDB}&lon=${longitudDB}`
                  );
                  
                  if (response.ok) {
                    const data = await response.json();
                    const addr = data.address;
                    
                    const pais = addr.country || '';
                    const departamento = addr.state || addr.region || '';
                    const ciudad = addr.city || addr.town || addr.village || '';
                    const codigoPostal = addr.postcode || '';
                    
                    // Preparar datos para actualizar dirección
                    const camposBD = {
                      pais_Direccion: pais,
                      departamento_Direccion: departamento,
                      ciudad_Direccion: ciudad,
                      codigoPostal_Direccion: codigoPostal
                    };
                    
                    // Actualizar en la base de datos
                    try {
                      await actualizarDireccion(direccionDB.id_Direccion, camposBD);
                      
                      // Actualizar estado local
                      setUsuario(prev => ({
                        ...prev,
                        pais,
                        departamento,
                        ciudad,
                        codigoPostal
                      }));
                    } catch (errActualizar) {
                      console.error('Error al actualizar dirección:', errActualizar);
                    }
                  }
                } catch (errGeocode) {
                  console.error('Error en geocodificación inversa automática:', errGeocode);
                }
              }
            }
          } catch (errGeo) {
            console.error('No se encontró geolocalización para esta dirección');
          }
        }
      }
      
      setCargando(false);
    } catch (err) {
      console.error('Error al cargar usuario:', err);
      setError('Error al cargar los datos del usuario');
      setCargando(false);
    }
  };

  // Limpiar URLs de objeto al desmontar el componente
  useEffect(() => {
    return () => {
      // Comprobar si la URL de la imagen de perfil es una URL de objeto y revocarla
      if (usuario.imagenUrl_Usuario && usuario.imagenUrl_Usuario.startsWith('blob:')) {
        URL.revokeObjectURL(usuario.imagenUrl_Usuario);
      }
      
      // Limpiar URLs de objeto de la galería
      galeriaImagenes.forEach(img => {
        if (img.url && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [galeriaImagenes, usuario.imagenUrl_Usuario]);

  // useEffect para inicializar y actualizar el mapa de Leaflet
  useEffect(() => {
    // Esperar a que el componente esté montado y Leaflet cargado
    const initMap = () => {
      if (!mapContainerRef.current || !window.L) {
        return;
      }

      // Si ya existe un mapa, destruirlo primero
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        // Crear nuevo mapa con zoom apropiado
        const zoomLevel = geolocalizacion.ubicacionReal ? 15 : 6;
        const map = window.L.map(mapContainerRef.current, {
          center: [geolocalizacion.latitud, geolocalizacion.longitud],
          zoom: zoomLevel,
          scrollWheelZoom: true,
          dragging: true,
          zoomControl: true
        });

        // Agregar capa de tiles de OpenStreetMap
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          minZoom: 2
        }).addTo(map);

        // Agregar marcador solo si es ubicación real
        if (geolocalizacion.ubicacionReal) {
          window.L.marker([geolocalizacion.latitud, geolocalizacion.longitud])
            .addTo(map)
            .bindPopup('Tu ubicación')
            .openPopup();
        }

        // Guardar referencia del mapa
        mapInstanceRef.current = map;
        
        // Forzar actualización del tamaño del mapa después de un momento
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 250);
      } catch (error) {
        console.error('Error al inicializar mapa:', error);
      }
    };

    // Esperar a que Leaflet esté disponible
    if (!window.L) {
      const checkLeaflet = setInterval(() => {
        if (window.L) {
          clearInterval(checkLeaflet);
          setTimeout(initMap, 100);
        }
      }, 100);
      
      // Timeout de seguridad
      setTimeout(() => clearInterval(checkLeaflet), 5000);
      
      return () => clearInterval(checkLeaflet);
    } else {
      // Leaflet ya está disponible, inicializar después de un pequeño delay
      const timer = setTimeout(initMap, 100);
      return () => clearTimeout(timer);
    }
  }, [geolocalizacion.latitud, geolocalizacion.longitud, geolocalizacion.ubicacionReal, cargando]);

  // Cleanup del mapa al desmontar
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Función para actualizar cualquier campo del usuario y guardarlo en la BD
  const updateUsuario = async (campo, valor) => {
    // Actualizar el estado local inmediatamente
    setUsuario(prevUsuario => ({
      ...prevUsuario,
      [campo]: valor
    }));

    // Campos de dirección
    const camposDireccion = ['pais', 'departamento', 'ciudad', 'codigoPostal', 'pais_Usuario', 'departamento_Usuario', 'ciudad_Usuario', 'codigoPostal_Usuario'];
    
    if (camposDireccion.includes(campo)) {
      // Es un campo de dirección
      try {
        setGuardando(true);
        
        // Mapear nombres de campo
        const mapaCamposDireccion = {
          'pais': 'pais',
          'pais_Usuario': 'pais',
          'departamento': 'departamento',
          'departamento_Usuario': 'departamento',
          'ciudad': 'ciudad',
          'ciudad_Usuario': 'ciudad',
          'codigoPostal': 'codigoPostal',
          'codigoPostal_Usuario': 'codigoPostal'
        };
        
        const campoDireccionBD = mapaCamposDireccion[campo];
        const datosActualizar = { 
          [campoDireccionBD]: valor,
          idPersona: usuarioId
        };
        
        if (direccionId) {
          // Actualizar dirección existente
          const resultado = await actualizarDireccion(direccionId, datosActualizar);
          if (!resultado.success) {
            console.error('Error al actualizar dirección:', resultado.error);
          }
        } else {
          // Crear nueva dirección con los valores actuales del usuario
          const nuevaDireccion = {
            ciudad: campo.includes('ciudad') ? valor : usuario.ciudad || '',
            departamento: campo.includes('departamento') ? valor : usuario.departamento || '',
            pais: campo.includes('pais') ? valor : usuario.pais || '',
            codigoPostal: campo.includes('codigoPostal') ? valor : usuario.codigoPostal || '',
            idPersona: usuarioId
          };
          
          const resultado = await crearDireccion(nuevaDireccion);
          if (resultado.success && resultado.data) {
            setDireccionId(resultado.data.id);
          } else {
            console.error('Error al crear dirección:', resultado.error);
          }
        }
        
        setGuardando(false);
      } catch (error) {
        console.error('Error al actualizar dirección:', error);
        setGuardando(false);
      }
    } else {
      // Es un campo de persona
      const camposBD = {
        'nombre_Usuario': 'nombre',
        'apellido_Usuario': 'apellido',
        'descripcion_Usuario': 'descripcionPerfil',
        'imagenUrl_Usuario': 'imagenUrl',
        'imagen1Url_Usuario': 'imagen1Url',
        'imagen2Url_Usuario': 'imagen2Url',
        'imagen3Url_Usuario': 'imagen3Url',
        'estadoCivil': 'estadoCivil',
        'estadoCivil_Usuario': 'estadoCivil',
        'genero': 'genero',
        'genero_Usuario': 'genero',
        'tipoIdentificacion': 'tipoIdentificacion',
        'tipoIdentificacion_Usuario': 'tipoIdentificacion',
        'numeroIdentificacion': 'identificacion',
        'identificacion_usuario': 'identificacion',
        'fechaNacimiento': 'fechaNac'
      };

      const campoDB = camposBD[campo];
      
      if (campoDB) {
        try {
          setGuardando(true);
          
          const datosActualizar = { [campoDB]: valor };
          const resultado = await actualizarPersona(usuarioId, datosActualizar);
          
          if (!resultado.success) {
            console.error('Error al actualizar en BD:', resultado.error);
          }
          
          setGuardando(false);
        } catch (error) {
          console.error('Error al actualizar usuario:', error);
          setGuardando(false);
        }
      }
    }
  };
  
  // Función para manejar la subida de imagen de perfil
  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setGuardando(true);
        
        // Obtener URL de imagen antigua (si existe)
        const oldImageUrl = usuario.imagenUrl_Usuario;
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('image', file);
        
        // Si existe una imagen antigua, enviarla para que se elimine
        if (oldImageUrl && oldImageUrl.includes('r2.dev')) {
          formData.append('oldImageUrl', oldImageUrl);
        }
        
        // Subir imagen a Cloudflare R2 (automáticamente eliminará la antigua)
        const response = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Guardar la URL de R2 en la base de datos
          await updateUsuario('imagenUrl_Usuario', result.url);
          console.log('Imagen de perfil subida a R2:', result.url);
          if (result.replacedOld) {
            console.log('Imagen anterior eliminada de R2');
          }
        } else {
          console.error('Error al subir imagen:', result.error);
          alert('Error al subir la imagen. Inténtalo de nuevo.');
        }
        
        setGuardando(false);
      } catch (error) {
        console.error('Error al subir imagen de perfil:', error);
        alert('Error de conexión al subir la imagen.');
        setGuardando(false);
      }
    }
    
    // Limpiar el valor del input file para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };
  
  // Función para guardar las URLs de las imágenes de la galería en la BD
  const guardarImagenesGaleria = async (imagenesArray) => {
    try {
      // Extraer las URLs de las imágenes (máximo 3 para la galería)
      const imagen1 = imagenesArray.length > 0 ? imagenesArray[0].url : '';
      const imagen2 = imagenesArray.length > 1 ? imagenesArray[1].url : '';
      const imagen3 = imagenesArray.length > 2 ? imagenesArray[2].url : '';
      
      // Actualizar los tres campos secuencialmente con delay
      await updateUsuario('imagen1Url_Usuario', imagen1);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await updateUsuario('imagen2Url_Usuario', imagen2);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await updateUsuario('imagen3Url_Usuario', imagen3);
    } catch (error) {
      console.error('Error al guardar imágenes de galería:', error);
    }
  };
  
  // Función para manejar la subida de imágenes a la galería
  const handleGalleryImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file && galeriaImagenes.length < 3) { // Verificar límite de 3 imágenes
      try {
        setGuardando(true);
        
        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('image', file);
        
        // Subir imagen a Cloudflare R2
        const response = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          // Generar un ID único para la imagen
          const newImageId = Date.now();
          
          // Añadir la nueva imagen a la galería con la URL de R2
          const nuevasImagenes = [
            ...galeriaImagenes,
            { 
              id: newImageId, 
              title: result.fileName || `Imagen ${newImageId}`, 
              url: result.url // URL de Cloudflare R2
            }
          ].slice(0, 3); // Asegurar que no excedamos el límite
          
          setGaleriaImagenes(nuevasImagenes);
          
          // Guardar las URLs en la base de datos
          await guardarImagenesGaleria(nuevasImagenes);
          
          console.log('Imagen de galería subida a R2:', result.url);
        } else {
          console.error('Error al subir imagen:', result.error);
          alert('Error al subir la imagen. Inténtalo de nuevo.');
        }
        
        setGuardando(false);
      } catch (error) {
        console.error('Error al subir imagen de galería:', error);
        alert('Error de conexión al subir la imagen.');
        setGuardando(false);
      }
    }
    
    // Limpiar el valor del input file para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  };
  
  const [showModal, setShowModal] = useState(false);
  const [skillType, setSkillType] = useState('offered');
  const [skillInput, setSkillInput] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  // Control de edición: cuando editSkillIndex !== null, estamos editando
  const [editSkillIndex, setEditSkillIndex] = useState(null);
  const [editSkillId, setEditSkillId] = useState(null); // ID de la habilidad en la BD
  const [offeredSkills, setOfferedSkills] = useState([]);
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [categorias, setCategorias] = useState([]); // Lista de categorías desde la BD
  const [selectedOffered, setSelectedOffered] = useState(null);
  const [selectedRequired, setSelectedRequired] = useState(null);
  // Menú contextual para habilidades
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, index: null });
  // Menú contextual para imágenes de la galería
  const [imageContextMenu, setImageContextMenu] = useState({ visible: false, x: 0, y: 0, index: null });
  // Menú contextual para foto de perfil
  const [profileContextMenu, setProfileContextMenu] = useState({ visible: false, x: 0, y: 0 });

  // Datos para la mini gráfica en Estadísticas (dinámico)
  const statsData = [
    { key: 'intercambios', label: 'Intercambios', value: 12, color: '#4F46E5' },
    { key: 'favoritos', label: 'Favoritos', value: 8, color: '#10B981' },
    { key: 'ofrecidas', label: 'Habilidades Ofrecidas', value: offeredSkills.length, color: '#8B5CF6' },
  ];
  const maxStatValue = Math.max(...statsData.map(s => s.value));

  // Función para obtener el nombre de la categoría por ID
  const getNombreCategoria = (categoryId) => {
    if (!categoryId) return null;
    const categoria = categorias.find(cat => cat.id_categoria_Habilidad_Servicio === categoryId);
    return categoria ? categoria.nombre_categoria_Habilidad : null;
  };

  // Función para obtener las iniciales del usuario
  const getIniciales = () => {
    const nombre = usuario.nombre_Usuario || '';
    const apellido = usuario.apellido_Usuario || '';
    const inicial1 = nombre.charAt(0).toUpperCase();
    const inicial2 = apellido.charAt(0).toUpperCase();
    return inicial1 + inicial2 || 'U';
  };

  // Función para generar URL de avatar por defecto
  const getDefaultAvatar = () => {
    const iniciales = getIniciales();
    const colors = ['4F46E5', '10B981', '8B5CF6', '14B8A6', 'F59E0B', 'EF4444'];
    const colorIndex = (usuario.nombre_Usuario?.length || 0) % colors.length;
    const bgColor = colors[colorIndex];
    return `https://ui-avatars.com/api/?name=${iniciales}&background=${bgColor}&color=ffffff&size=200&bold=true&rounded=true`;
  };

  // Determinar qué imagen mostrar (solo calcula una vez por cambio de imagenUrl_Usuario)
  const getImagenPerfil = () => {
    const url = usuario.imagenUrl_Usuario;
    // Si no hay URL o está vacía, usar avatar por defecto
    if (!url || url.trim() === '') {
      return getDefaultAvatar();
    }
    // Si la URL parece válida, usarla
    return url;
  };

  const showSkillModal = (type) => {
    setSkillType(type);
    setSkillInput('');
    setSkillDescription('');
    setSkillCategory('');
    setEditSkillIndex(null);
    setEditSkillId(null);
    setShowModal(true);
  };

  const hideSkillModal = () => {
    setShowModal(false);
    setSkillInput('');
    setSkillDescription('');
    setSkillCategory('');
    setEditSkillIndex(null);
    setEditSkillId(null);
  };

  const addSkill = () => {
    if (!skillInput.trim()) {
      alert('El nombre de la habilidad no puede estar vacío');
      return;
    }

    const newSkill = {
      name: skillInput.trim(),
      description: skillDescription.trim(),
      categoryId: skillCategory ? parseInt(skillCategory) : null
    };

    if (editSkillIndex !== null) {
      updateSkill(skillType === 'offered', editSkillIndex, newSkill);
    } else {
      createSkill(skillType === 'offered', newSkill);
    }

    hideSkillModal();
  };

  // Abstracciones CRUD con base de datos
  const createSkill = async (isOffered, skill) => {
    try {
      setGuardando(true);
      const habilidadData = {
        tipoEstado: isOffered ? 'Ofrece' : 'Necesita',
        nombre: skill.name,
        descripcion: skill.description || null,
        idPersona: usuarioId,
        idCategoria: skill.categoryId || null
      };
      
      const resultado = await crearHabilidad(habilidadData);
      
      if (resultado.success) {
        const nuevaHabilidad = {
          id: resultado.data.id,
          name: skill.name,
          description: skill.description || '',
          categoryId: skill.categoryId
        };
        
        if (isOffered) {
          setOfferedSkills(prev => [...prev, nuevaHabilidad]);
        } else {
          setRequiredSkills(prev => [...prev, nuevaHabilidad]);
        }
      }
      
      setGuardando(false);
    } catch (error) {
      console.error('Error al crear habilidad:', error);
      setGuardando(false);
    }
  };

  const updateSkill = async (isOffered, index, skill) => {
    try {
      setGuardando(true);
      const habilidadActual = isOffered ? offeredSkills[index] : requiredSkills[index];
      
      if (!habilidadActual || !habilidadActual.id) {
        console.error('No se encontró el ID de la habilidad');
        setGuardando(false);
        return;
      }
      
      const habilidadData = {
        tipoEstado: isOffered ? 'Ofrece' : 'Necesita',
        nombre: skill.name,
        descripcion: skill.description || null,
        idPersona: usuarioId,
        idCategoria: skill.categoryId || null
      };
      
      const resultado = await actualizarHabilidad(habilidadActual.id, habilidadData);
      
      if (resultado.success) {
        const habilidadActualizada = {
          ...habilidadActual,
          name: skill.name,
          description: skill.description || '',
          categoryId: skill.categoryId
        };
        
        if (isOffered) {
          setOfferedSkills(prev => prev.map((s, i) => (i === index ? habilidadActualizada : s)));
        } else {
          setRequiredSkills(prev => prev.map((s, i) => (i === index ? habilidadActualizada : s)));
        }
      }
      
      setGuardando(false);
    } catch (error) {
      console.error('Error al actualizar habilidad:', error);
      setGuardando(false);
    }
  };

  const removeSkill = async (isOffered, index) => {
    try {
      setGuardando(true);
      const habilidad = isOffered ? offeredSkills[index] : requiredSkills[index];
      
      if (!habilidad || !habilidad.id) {
        console.error('No se encontró el ID de la habilidad');
        setGuardando(false);
        return;
      }
      
      const resultado = await eliminarHabilidad(habilidad.id);
      
      if (resultado.success) {
        if (isOffered) {
          setOfferedSkills(prev => prev.filter((_, i) => i !== index));
        } else {
          setRequiredSkills(prev => prev.filter((_, i) => i !== index));
        }
      }
      
      setGuardando(false);
    } catch (error) {
      console.error('Error al eliminar habilidad:', error);
      setGuardando(false);
    }
  };

  // Abrir menú contextual
  const openContextMenu = (e, type, index) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type, index });
  };

  const closeContextMenu = () => setContextMenu({ visible: false, x: 0, y: 0, type: null, index: null });

  // Funciones para el menú contextual de imágenes de la galería
  const openImageContextMenu = (e, index) => {
    e.preventDefault();
    setImageContextMenu({ visible: true, x: e.clientX, y: e.clientY, index });
  };

  const closeImageContextMenu = () => setImageContextMenu({ visible: false, x: 0, y: 0, index: null });

  // Cambiar imagen desde el menú contextual
  const handleChangeImage = () => {
    if (imageContextMenu.index == null) return;
    
    // Guardar el índice actual antes de cerrar el menú
    const currentIndex = imageContextMenu.index;
    
    // Disparar el input de archivo para seleccionar nueva imagen
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg, image/png, image/gif';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          setGuardando(true);
          
          // Obtener URL de imagen antigua
          const oldImageUrl = galeriaImagenes[currentIndex]?.url;
          
          // Crear FormData para enviar el archivo
          const formData = new FormData();
          formData.append('image', file);
          
          // Si existe una imagen antigua en R2, enviarla para que se elimine
          if (oldImageUrl && oldImageUrl.includes('r2.dev')) {
            formData.append('oldImageUrl', oldImageUrl);
          }
          
          // Subir imagen a Cloudflare R2 (automáticamente eliminará la antigua)
          const response = await fetch('http://localhost:3001/api/upload', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Actualizar la imagen en la galería con la URL de R2
            setGaleriaImagenes(prev => {
              const newImages = [...prev];
              newImages[currentIndex] = {
                id: Date.now(),
                title: result.fileName,
                url: result.url
              };
              
              // Guardar los cambios en la base de datos
              guardarImagenesGaleria(newImages);
              
              return newImages;
            });
            
            console.log('Imagen de galería reemplazada en R2:', result.url);
            if (result.replacedOld) {
              console.log('Imagen anterior eliminada de R2');
            }
          } else {
            console.error('Error al cambiar imagen:', result.error);
            alert('Error al cambiar la imagen. Inténtalo de nuevo.');
          }
          
          setGuardando(false);
        } catch (error) {
          console.error('Error al cambiar imagen de galería:', error);
          alert('Error de conexión al cambiar la imagen.');
          setGuardando(false);
        }
      }
    };
    fileInput.click();
    closeImageContextMenu();
  };

  // Eliminar imagen desde el menú contextual
  const handleDeleteImage = async () => {
    if (imageContextMenu.index == null) return;
    
    try {
      setGuardando(true);
      
      // Obtener la URL de la imagen a eliminar
      const imagenAEliminar = galeriaImagenes[imageContextMenu.index];
      
      // Si la imagen está en R2, eliminarla
      if (imagenAEliminar && imagenAEliminar.url && imagenAEliminar.url.includes('r2.dev')) {
        try {
          const response = await fetch('http://localhost:3001/api/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl: imagenAEliminar.url })
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('Imagen eliminada de R2:', imagenAEliminar.url);
          }
        } catch (error) {
          console.error('Error al eliminar de R2 (continuando):', error);
        }
      }
      
      // Actualizar el estado local
      const nuevasImagenes = galeriaImagenes.filter((_, i) => i !== imageContextMenu.index);
      setGaleriaImagenes(nuevasImagenes);
      
      // Guardar los cambios en la base de datos
      await guardarImagenesGaleria(nuevasImagenes);
      
      setGuardando(false);
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      setGuardando(false);
    }
    
    closeImageContextMenu();
  };

  // Funciones para el menú contextual de la foto de perfil
  const openProfileContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setProfileContextMenu({ visible: true, x: e.clientX, y: e.clientY });
  };

  const closeProfileContextMenu = () => setProfileContextMenu({ visible: false, x: 0, y: 0 });

  // Editar foto de perfil desde el menú contextual
  const handleEditProfileImage = () => {
    fileInputRef.current?.click();
    closeProfileContextMenu();
  };

  // Eliminar foto de perfil
  const handleDeleteProfileImage = async () => {
    try {
      setGuardando(true);
      
      // Obtener la URL de la imagen actual
      const oldImageUrl = usuario.imagenUrl_Usuario;
      
      // Si la imagen está en R2, eliminarla
      if (oldImageUrl && oldImageUrl.includes('r2.dev')) {
        try {
          const response = await fetch('http://localhost:3001/api/upload', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl: oldImageUrl })
          });
          
          const result = await response.json();
          if (result.success) {
            console.log('Imagen de perfil eliminada de R2:', oldImageUrl);
          }
        } catch (error) {
          console.error('Error al eliminar de R2 (continuando):', error);
        }
      }
      
      // Actualizar en la base de datos (establecer como vacío/null)
      await updateUsuario('imagenUrl_Usuario', '');
      
      // Actualizar el estado local
      setUsuario(prev => ({
        ...prev,
        imagenUrl_Usuario: ''
      }));
      
      setGuardando(false);
    } catch (error) {
      console.error('Error al eliminar foto de perfil:', error);
      setGuardando(false);
    }
    closeProfileContextMenu();
  };

  // Función para obtener ubicación del usuario
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setGeolocalizacion(prev => ({ 
        ...prev, 
        mensaje: 'Tu navegador no soporta la geolocalización.' 
      }));
      return;
    }

    setGeolocalizacion(prev => ({ 
      ...prev, 
      obteniendo: true, 
      mensaje: 'Obteniendo ubicación...' 
    }));

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        setGeolocalizacion(prev => ({
          ...prev,
          latitud: latitude,
          longitud: longitude,
          ubicacionReal: true,
          mensaje: 'Buscando dirección...'
        }));

        // Obtener dirección desde coordenadas (geocodificación inversa)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          
          if (!response.ok) throw new Error('No se pudo obtener la dirección.');
          
          const data = await response.json();
          const addr = data.address;
          
          // Actualizar campos de dirección automáticamente
          const pais = addr.country || '';
          const departamento = addr.state || addr.region || '';
          const ciudad = addr.city || addr.town || addr.village || '';
          const codigoPostal = addr.postcode || '';
          
          // Guardar en la base de datos
          if (pais) await updateUsuario('pais', pais);
          if (departamento) await updateUsuario('departamento', departamento);
          if (ciudad) await updateUsuario('ciudad', ciudad);
          if (codigoPostal) await updateUsuario('codigoPostal', codigoPostal);
          
          // Actualizar estado local
          setUsuario(prev => ({
            ...prev,
            pais,
            departamento,
            ciudad,
            codigoPostal
          }));
          
          // Guardar coordenadas en la base de datos
          if (direccionId) {
            try {
              if (geolocalizacionId) {
                // Actualizar geolocalización existente
                await actualizarGeolocalizacion(geolocalizacionId, {
                  latitud: latitude,
                  longitud: longitude,
                  idDireccion: direccionId
                });
              } else {
                // Crear nueva geolocalización
                const resultadoGeo = await crearGeolocalizacion({
                  latitud: latitude,
                  longitud: longitude,
                  idDireccion: direccionId
                });
                if (resultadoGeo.success && resultadoGeo.data) {
                  setGeolocalizacionId(resultadoGeo.data.id_Geolocalizacion_Nueva);
                }
              }
            } catch (errGeo) {
              console.error('Error al guardar geolocalización:', errGeo);
            }
          }
          
          setGeolocalizacion(prev => ({
            ...prev,
            obteniendo: false,
            mensaje: '¡Ubicación y dirección obtenidas exitosamente!'
          }));
          
          // Limpiar mensaje después de 5 segundos
          setTimeout(() => {
            setGeolocalizacion(prev => ({ ...prev, mensaje: '' }));
          }, 5000);
          
        } catch (err) {
          setGeolocalizacion(prev => ({
            ...prev,
            obteniendo: false,
            mensaje: 'Coordenadas obtenidas, pero no se pudo encontrar la dirección.'
          }));
        }
      },
      (err) => {
        let mensaje = '';
        switch(err.code) {
          case err.PERMISSION_DENIED: 
            mensaje = 'Permiso denegado. Permite el acceso a tu ubicación.'; 
            break;
          case err.POSITION_UNAVAILABLE: 
            mensaje = 'Ubicación no disponible.'; 
            break;
          case err.TIMEOUT: 
            mensaje = 'La solicitud ha caducado.'; 
            break;
          default: 
            mensaje = 'Error desconocido al obtener ubicación.'; 
            break;
        }
        setGeolocalizacion(prev => ({
          ...prev,
          obteniendo: false,
          latitud: null,
          longitud: null,
          mensaje
        }));
      },
      options
    );
  };

  // Editar desde el menú
  const handleEditSkill = () => {
    if (contextMenu.type == null || contextMenu.index == null) return;
    const isOffered = contextMenu.type === 'offered';
    const source = isOffered ? offeredSkills : requiredSkills;
    const skill = source[contextMenu.index];
    setSkillType(isOffered ? 'offered' : 'required');
    setSkillInput(skill?.name || '');
    setSkillDescription(skill?.description || '');
    setSkillCategory(skill?.categoryId ? skill.categoryId.toString() : '');
    setEditSkillIndex(contextMenu.index);
    setEditSkillId(skill?.id || null);
    setShowModal(true);
    closeContextMenu();
  };

  // Eliminar desde el menú
  const handleDeleteSkill = () => {
    if (contextMenu.type == null || contextMenu.index == null) return;
    const isOffered = contextMenu.type === 'offered';
    if (isOffered) {
      removeSkill(true, contextMenu.index);
      if (selectedOffered && offeredSkills[contextMenu.index]?.name === selectedOffered.name) setSelectedOffered(null);
    } else {
      removeSkill(false, contextMenu.index);
      if (selectedRequired && requiredSkills[contextMenu.index]?.name === selectedRequired.name) setSelectedRequired(null);
    }
    closeContextMenu();
  };

  // Cerrar menú contextual con Escape o al hacer scroll
  useEffect(() => {
    if (!contextMenu.visible) return;
    const onKey = (e) => { if (e.key === 'Escape') closeContextMenu(); };
    const onScroll = () => closeContextMenu();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [contextMenu.visible]);

  // Cerrar menú contextual de imágenes con Escape o al hacer scroll
  useEffect(() => {
    if (!imageContextMenu.visible) return;
    const onKey = (e) => { if (e.key === 'Escape') closeImageContextMenu(); };
    const onScroll = () => closeImageContextMenu();
    const onClick = () => closeImageContextMenu();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onClick);
    };
  }, [imageContextMenu.visible]);

  // Cerrar menú contextual de foto de perfil con Escape o al hacer scroll
  useEffect(() => {
    if (!profileContextMenu.visible) return;
    const onKey = (e) => { if (e.key === 'Escape') closeProfileContextMenu(); };
    const onScroll = () => closeProfileContextMenu();
    const onClick = () => closeProfileContextMenu();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onClick);
    };
  }, [profileContextMenu.visible]);

  // Mostrar indicador de carga
  if (cargando) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h2>Cargando datos del usuario...</h2>
          <div style={{ marginTop: '20px', fontSize: '40px' }}>⏳</div>
        </div>
      </div>
    );
  }

  // Mostrar error si falla la carga
  if (error) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <h2>Error al cargar datos</h2>
          <p>{error}</p>
          <button 
            onClick={cargarUsuario}
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Botón de navegación de prueba */}
      {/* <button 
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: '#EF4444',
          color: 'white',
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 1001,
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#DC2626'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#EF4444'}
      >
        ← Volver al Registro
      </button> */}
      
      {/* Indicador de guardado */}
      {guardando && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#4F46E5',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '16px',
            height: '16px',
            border: '2px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          Guardando...
        </div>
      )}
      
      <div className="max-w-5xl">
        {/* Header del perfil */}
        <div className="profile-header glass-card">
          <div className="action-buttons action-buttons-desktop">
            <button className="fav-button" title="Agregar a Favoritos">
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </button>
            <button className="request-button">Enviar Solicitud</button>
          </div>

          <div className="profile-content">
            <div 
              className="profile-pic-container" 
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              onContextMenu={openProfileContextMenu}
            >
              <img 
                className="profile-pic" 
                src={getImagenPerfil()}
                alt="Perfil"
                onError={(e) => {
                  // Si la imagen falla, cambiar a avatar por defecto
                  if (e.target.src !== getDefaultAvatar()) {
                    e.target.src = getDefaultAvatar();
                  }
                }}
              />
              <div className="camera-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 4-3v2z" />
                </svg>
              </div>
            </div>
            {/* Input oculto para subir imagen de perfil */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleProfileImageUpload}
              style={{ display: 'none' }}
              id="profile-upload"
            />

            <div className="profile-info">
              <h1 className="profile-name">
                <InlineEditable 
                  value={`${usuario.nombre_Usuario}_${usuario.apellido_Usuario}`} 
                  onSave={(value) => {
                    const parts = value.split('_');
                    updateUsuario('nombre_Usuario', parts[0] || '');
                    updateUsuario('apellido_Usuario', parts[1] || '');
                  }}
                  className="profile-name"
                  placeholder="Nombre_Apellido"
                />
              </h1>
              <p className="profile-username">@{`${usuario.nombre_Usuario}${usuario.apellido_Usuario ? usuario.apellido_Usuario[0] : ''}`}</p>
              <div className="profile-bio">
                <InlineEditable 
                  value={usuario.descripcion_Usuario} 
                  onSave={(value) => updateUsuario('descripcion_Usuario', value)}
                  placeholder="Añade una descripción personal"
                  className="bio-textarea"
                  multiline={true}
                />
              </div>
              <div className="verified-badge">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Usuario Verificado</span>
              </div>
              
              {/* Botones para móvil - aparecen debajo del badge verificado */}
              <div className="action-buttons action-buttons-mobile">
                <button className="fav-button" title="Agregar a Favoritos">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="request-button">Enviar Solicitud</button>
              </div>
            </div>
          </div>
        </div>

        {/* Secciones: fila superior (Ubicación + Estadísticas), luego Ofrezco y Necesito */}
        <div className="main-grid-redesigned">
            {/* Fila 1: Ubicación y Datos + Estadísticas */}
            <div className="top-row">
              {/* Datos Personales (Ubicación + Identificación) */}
              <div className="glass-card location-section">
                <h2 className="section-title-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-md" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Datos Personales
                </h2>
                <ul className="data-list">
                  <li>
                    <span className="label">País:</span>
                    <InlineEditable 
                      value={usuario.pais} 
                      onSave={(value) => updateUsuario('pais', value)}
                      placeholder="Ingrese país"
                    />
                  </li>
                  <li>
                    <span className="label">Departamento:</span>
                    <InlineEditable 
                      value={usuario.departamento} 
                      onSave={(value) => updateUsuario('departamento', value)}
                      placeholder="Ingrese departamento"
                    />
                  </li>
                  <li>
                    <span className="label">Ciudad:</span>
                    <InlineEditable 
                      value={usuario.ciudad} 
                      onSave={(value) => updateUsuario('ciudad', value)}
                      placeholder="Ingrese ciudad"
                    />
                  </li>
                  <li>
                    <span className="label">Código Postal:</span>
                    <InlineEditable 
                      value={usuario.codigoPostal} 
                      onSave={(value) => updateUsuario('codigoPostal', value)}
                      placeholder="Ingrese código postal"
                    />
                  </li>
                  <li>
                    <span className="label">Estado Civil:</span>
                    <SelectEditable 
                      value={usuario.estadoCivil_Usuario}
                      onSave={(value) => updateUsuario('estadoCivil_Usuario', value)}
                      options={[
                        { value: 'Soltero', label: 'Soltero' },
                        { value: 'Casado', label: 'Casado' },
                        { value: 'Divorciado', label: 'Divorciado' },
                        { value: 'Viudo', label: 'Viudo' }
                      ]}
                      placeholder="Seleccione estado civil"
                    />
                  </li>
                  <li>
                    <span className="label">Género:</span>
                    <SelectEditable 
                      value={usuario.genero_Usuario}
                      onSave={(value) => updateUsuario('genero_Usuario', value)}
                      options={[
                        { value: 'Masculino', label: 'Masculino' },
                        { value: 'Femenino', label: 'Femenino' },
                        { value: 'Otro', label: 'Otro' }
                      ]}
                      placeholder="Seleccione género"
                    />
                  </li>
                  <li>
                    <span className="label">Tipo de Identificación:</span>
                    <SelectEditable 
                      value={usuario.tipoIdentificacion_Usuario}
                      onSave={(value) => updateUsuario('tipoIdentificacion_Usuario', value)}
                      options={[
                        { value: 'DNI', label: 'DNI' },
                        { value: 'Pasaporte', label: 'Pasaporte' }
                      ]}
                      placeholder="Seleccione tipo"
                    />
                  </li>
                  <li>
                    <span className="label">Número de Identificación:</span>
                    <InlineEditable 
                      value={usuario.identificacion_usuario} 
                      onSave={(value) => updateUsuario('identificacion_usuario', value)}
                      placeholder="Ingrese número de identificación"
                    />
                  </li>
                  <li>
                    <span className="label">Fecha de Nacimiento:</span>
                    <InlineEditable 
                      value={usuario.fechaNacimiento || ''} 
                      onSave={(value) => updateUsuario('fechaNacimiento', value)}
                      placeholder="Ingrese fecha de nacimiento"
                      type="date"
                    />
                  </li>
                </ul>
              </div>

              {/* Estadísticas rápidas */}
              <div className="glass-card stats-section">
                <h2 className="section-title-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-md" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a6 6 0 015.917 5h-2.09a4.001 4.001 0 00-3.827-3V5zM4.173 10A6.002 6.002 0 0110 4v2a4.002 4.002 0 00-3.827 3H4.173zm5.827 6a6.002 6.002 0 01-5.827-5h2.09A4.001 4.001 0 0010 14v2zm0 0v-2a4.002 4.002 0 003.827-3h2.09A6.002 6.002 0 0110 16z" clipRule="evenodd" />
                  </svg>
                  Estadísticas
                </h2>
                <div className="stats-grid">
                  <div className="stat">
                    <p className="stat-number-primary">12</p>
                    <p className="stat-label">Intercambios (HU 13)</p>
                  </div>
                  <div className="stat">
                    <p className="stat-number-secondary">8</p>
                    <p className="stat-label">Favoritos (HU 10)</p>
                  </div>
                  <div className="stat">
                    <p className="stat-number-primary">{offeredSkills.length}</p>
                    <p className="stat-label">Habilidades Ofrecidas</p>
                  </div>
                </div>
                {/* Gráfica principal estilo pixel-art */}
                <PixelBarChart
                  data={[
                    { label: 'Int', value: 12, fill: '#4F46E5' },
                    { label: 'Fav', value: 8, fill: '#10B981' },
                    { label: 'Hab', value: offeredSkills.length, fill: '#8B5CF6' },
                  ]}
                  title="Resumen"
                />

                {/* Mapa de Geolocalización */}
                <div className="map-container">
                  <h3 style={{
                    color: '#e5e7eb',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Ubicación
                  </h3>
                  
                  <button 
                    onClick={obtenerUbicacion}
                    disabled={geolocalizacion.obteniendo}
                    className="location-button"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: geolocalizacion.obteniendo ? '#64748b' : '#4F46E5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: geolocalizacion.obteniendo ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      marginBottom: '12px'
                    }}
                  >
                    {geolocalizacion.obteniendo ? (
                      <>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Obteniendo ubicación...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Obtener mi ubicación
                      </>
                    )}
                  </button>

                  {geolocalizacion.mensaje && (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      marginBottom: '12px',
                      backgroundColor: geolocalizacion.mensaje.includes('éxito') || geolocalizacion.mensaje.includes('Éxito') 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : geolocalizacion.mensaje.includes('Error') || geolocalizacion.mensaje.includes('denegado')
                        ? 'rgba(239, 68, 68, 0.1)'
                        : 'rgba(79, 70, 229, 0.1)',
                      color: geolocalizacion.mensaje.includes('éxito') || geolocalizacion.mensaje.includes('Éxito')
                        ? '#10b981'
                        : geolocalizacion.mensaje.includes('Error') || geolocalizacion.mensaje.includes('denegado')
                        ? '#ef4444'
                        : '#a5b4fc',
                      border: '1px solid',
                      borderColor: geolocalizacion.mensaje.includes('éxito') || geolocalizacion.mensaje.includes('Éxito')
                        ? 'rgba(16, 185, 129, 0.2)'
                        : geolocalizacion.mensaje.includes('Error') || geolocalizacion.mensaje.includes('denegado')
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(79, 70, 229, 0.2)'
                    }}>
                      {geolocalizacion.mensaje}
                    </div>
                  )}

                  {/* Mapa siempre visible */}
                  <div 
                    ref={mapContainerRef}
                    id="map"
                    style={{
                      width: '100%',
                      height: '250px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Eliminada la tarjeta separada de Identificación: ahora está incluida en Datos Personales */}

            {/* Fila 2: Habilidades Ofrecidas */}
            <div className="glass-card skills-offered-section">
              <h2 className="section-title-secondary">Habilidades que Ofrezco</h2>
              <p className="section-description">Estas son las habilidades que ofrezco para un intercambio.</p>
              <div className="skills-container">
                {offeredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="skill-tag-offered"
                    onContextMenu={(e) => openContextMenu(e, 'offered', index)}
                    onClick={() => setSelectedOffered(
                      selectedOffered && selectedOffered.name === skill.name ? null : skill
                    )}
                    title="Ver descripción"
                  >
                    {skill.name}
                  </span>
                ))}
                <button onClick={() => showSkillModal('offered')} className="add-skill-button-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Añadir
                </button>
              </div>
              {selectedOffered && (
                <div className="skill-detail-card">
                  <p className="skill-detail-title">{selectedOffered.name}</p>
                  {getNombreCategoria(selectedOffered.categoryId) && (
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#94a3b8', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      {getNombreCategoria(selectedOffered.categoryId)}
                    </p>
                  )}
                  <p className="skill-detail-text">{selectedOffered.description || 'Sin descripción.'}</p>
                </div>
              )}
            </div>

            {/* Fila 3: Habilidades Requeridas */}
            <div className="glass-card skills-required-section">
              <h2 className="section-title-primary">Habilidades que Necesito</h2>
              <p className="section-description">Busca a otros usuarios con estas habilidades para iniciar un trueque.</p>
              <div className="skills-container">
                {requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="skill-tag-required"
                    onContextMenu={(e) => openContextMenu(e, 'required', index)}
                    onClick={() => setSelectedRequired(
                      selectedRequired && selectedRequired.name === skill.name ? null : skill
                    )}
                    title="Ver descripción"
                  >
                    {skill.name}
                  </span>
                ))}
                <button onClick={() => showSkillModal('required')} className="add-skill-button-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon-sm" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Añadir
                </button>
              </div>
              {selectedRequired && (
                <div className="skill-detail-card">
                  <p className="skill-detail-title">{selectedRequired.name}</p>
                  {getNombreCategoria(selectedRequired.categoryId) && (
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#94a3b8', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      {getNombreCategoria(selectedRequired.categoryId)}
                    </p>
                  )}
                  <p className="skill-detail-text">{selectedRequired.description || 'Sin descripción.'}</p>
                </div>
              )}
            </div>
            
            {/* Galería uniforme con imágenes en columnas */}
            <GaleriaUniforme 
              images={galeriaImagenes}
              onUpload={handleGalleryImageUpload}
              onImageContextMenu={openImageContextMenu}
            />
        </div>

  {/* Calificaciones y Reseñas */}
  <div className="glass-card reviews-section">
          <h2 className="section-title-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon-md rating-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.91 8.724c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Calificaciones y Reseñas
          </h2>

          {/* Resumen de calificación */}
          <div className="rating-summary">
            <div className="rating-score">4.7</div>
            <div>
              <div className="stars-container">
                {[1,2,3,4,5].map((star) => (
                  <svg key={star} xmlns="http://www.w3.org/2000/svg" className={star <= 4 ? 'star-filled' : 'star-empty'} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.91 8.724c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <p className="rating-text">Basado en 12 intercambios.</p>
            </div>
          </div>

          {/* Reseñas estáticas */}
          <div className="reviews-container">
            <div className="review-card">
              <div className="review-header">
                <img className="review-avatar" src="https://placehold.co/32x32/10B981/FFFFFF?text=J" alt="Usuario" />
                <div>
                  <p className="review-name">JuanPerez</p>
                  <div className="review-rating">
                    <span>5.0</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="star-small" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.91 8.724c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                </div>
              </div>
              <p className="review-text">"Ana me dio una tutoría de inglés excelente. Muy paciente y con material de apoyo de calidad. ¡Definitivamente la recomiendo!"</p>
              <p className="review-date">Hace 2 días - Intercambio por Clases de Guitarra</p>
            </div>

            <div className="review-card">
              <div className="review-header">
                <img className="review-avatar" src="https://placehold.co/32x32/4F46E5/FFFFFF?text=M" alt="Usuario" />
                <div>
                  <p className="review-name">Manuel_C</p>
                  <div className="review-rating">
                    <span>4.0</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="star-small" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.91 8.724c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                </div>
              </div>
              <p className="review-text">"La sesión de diseño gráfico fue útil, aunque tardó un poco en responder al inicio. El resultado final fue bueno."</p>
              <p className="review-date">Hace 1 semana - Intercambio por Reparación de Scooter</p>
            </div>

            <div className="review-card">
              <div className="review-header">
                <img className="review-avatar" src="https://placehold.co/32x32/14B8A6/FFFFFF?text=D" alt="Usuario" />
                <div>
                  <p className="review-name">DianaR</p>
                  <div className="review-rating">
                    <span>5.0</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="star-small" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.91 8.724c-.783-.57-.381-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </div>
                </div>
              </div>
              <p className="review-text">"¡Un trabajo de SEO excelente! Me ayudó a posicionar mi pequeño negocio en tiempo récord. La mejor opción."</p>
              <p className="review-date">Hace 3 semanas - Intercambio por Tutoría de Álgebra</p>
            </div>
          </div>

          <div className="view-all-button">
            <button>Ver todas las 12 reseñas</button>
          </div>
        </div>
        </div>

        {/* Modal para añadir habilidades */}
        {showModal && (
        <div className="modal-overlay" onClick={hideSkillModal}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              {editSkillIndex !== null
                ? (skillType === 'offered' ? 'Editar Habilidad Ofrecida' : 'Editar Habilidad Requerida')
                : (skillType === 'offered' ? 'Añadir Habilidad Ofrecida' : 'Añadir Habilidad Requerida')}
            </h3>
            <select
              value={skillCategory}
              onChange={(e) => setSkillCategory(e.target.value)}
              className="modal-input"
              style={{ 
                padding: '14px 16px',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                border: '2px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                marginBottom: '12px'
              }}
            >
              <option value="" style={{ backgroundColor: '#1e293b', color: 'white' }}>
                Seleccione una categoría (opcional)
              </option>
              {categorias && categorias.length > 0 ? (
                categorias.map(cat => (
                  <option 
                    key={cat.id_categoria_Habilidad_Servicio} 
                    value={cat.id_categoria_Habilidad_Servicio}
                    style={{ backgroundColor: '#1e293b', color: 'white' }}
                  >
                    {cat.nombre_categoria_Habilidad}
                  </option>
                ))
              ) : (
                <option value="" disabled style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
                  Cargando categorías...
                </option>
              )}
            </select>
            <input
              type="text"
              placeholder="Ej: Programación en Python"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="modal-input"
            />
            <input
              type="text"
              placeholder="Descripción corta (opcional)"
              value={skillDescription}
              onChange={(e) => setSkillDescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              className="modal-input"
            />
            <div className="modal-buttons">
              <button onClick={hideSkillModal} className="modal-button-cancel">Cancelar</button>
              <button onClick={addSkill} className="modal-button-submit">{editSkillIndex !== null ? 'Guardar' : 'Agregar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Menú contextual */}
      {contextMenu.visible && (
        <>
          <div className="context-menu-backdrop" onClick={closeContextMenu} />
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button className="context-menu-item" onClick={handleEditSkill}>Editar</button>
            <button className="context-menu-item danger" onClick={handleDeleteSkill}>Eliminar</button>
          </div>
        </>
      )}

      {/* Menú contextual para imágenes de la galería */}
      {imageContextMenu.visible && (
        <>
          <div className="context-menu-backdrop" onClick={closeImageContextMenu} />
          <div
            className="context-menu"
            style={{ left: imageContextMenu.x, top: imageContextMenu.y }}
          >
            <button className="context-menu-item" onClick={handleChangeImage}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-xs" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Cambiar
            </button>
            <button className="context-menu-item danger" onClick={handleDeleteImage}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-xs" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: '8px' }}>
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Eliminar
            </button>
          </div>
        </>
      )}

      {/* Menú contextual para foto de perfil */}
      {profileContextMenu.visible && (
        <>
          <div className="context-menu-backdrop" onClick={closeProfileContextMenu} />
          <div
            className="context-menu"
            style={{ left: profileContextMenu.x, top: profileContextMenu.y }}
          >
            <button className="context-menu-item" onClick={handleEditProfileImage}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-xs" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: '8px' }}>
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Editar
            </button>
            <button className="context-menu-item danger" onClick={handleDeleteProfileImage}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon-xs" viewBox="0 0 20 20" fill="currentColor" style={{ marginRight: '8px' }}>
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

window.Perfil_Usuario = Perfil_Usuario;