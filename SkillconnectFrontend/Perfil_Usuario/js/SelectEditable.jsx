/**
 * Componente para edición inline con opciones predefinidas
 * Props:
 * - value: valor inicial
 * - onSave: función para guardar (recibe nuevo valor)
 * - options: array de opciones [{value, label}] o simple array de strings
 * - className: clase CSS opcional
 * - placeholder: texto placeholder
 */
function SelectEditable({ 
  value, 
  onSave, 
  options = [],
  className = '', 
  placeholder = 'Seleccionar...' 
}) {
  const { useState, useEffect, useRef } = React;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const selectRef = useRef(null);
  const displayRef = useRef(null);
  
  // Normalizar opciones a formato {value, label}
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  
  // Al iniciar edición, enfocar el select
  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);
  
  // Actualizar valor local si cambia value en props
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);
  
  // Iniciar edición con doble clic o un tap
  const handleActivate = () => {
    setIsEditing(true);
  };
  
  // Guardar con blur
  const handleSave = () => {
    if (!isEditing) return;
    
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };
  
  // Guardar al cambiar selección y cerrar
  const handleChange = (e) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    // Auto guardar en select
    setTimeout(() => {
      onSave(newValue);
      setIsEditing(false);
    }, 100);
  };
  
  // Cancelar con Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setEditValue(value || ''); // Restaurar valor original
      setIsEditing(false);
      e.preventDefault();
    }
  };
  
  // Detectar clic fuera para guardar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && 
          selectRef.current && 
          !selectRef.current.contains(event.target) &&
          displayRef.current &&
          !displayRef.current.contains(event.target)) {
        handleSave();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, editValue, value]);
  
  // Soporte para detección de tap en mobile
  const handleTouchEnd = (e) => {
    // En móvil, activar edición con un toque
    if (!isEditing) {
      handleActivate();
      e.preventDefault(); // Evitar doble acción
    }
  };

  // Encontrar la etiqueta actual basada en el valor
  const currentOption = normalizedOptions.find(opt => opt.value === value);
  const displayValue = currentOption ? currentOption.label : value;

  return isEditing ? (
    <select
      ref={selectRef}
      value={editValue}
      onChange={handleChange}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      className={`inline-edit-select ${className}`}
    >
      <option value="" disabled>{placeholder}</option>
      {normalizedOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ) : (
    <span
      ref={displayRef}
      className={`inline-edit ${className} ${!value ? 'inline-edit-empty' : ''}`}
      onDoubleClick={handleActivate}
      onTouchEnd={handleTouchEnd}
      title="Doble clic para editar"
    >
      {displayValue || placeholder}
    </span>
  );
}

window.SelectEditable = SelectEditable;