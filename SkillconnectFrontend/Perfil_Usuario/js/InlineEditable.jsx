/**
 * Componente para edición inline activada con doble clic/tap
 * Props:
 * - value: valor inicial
 * - onSave: función para guardar (recibe nuevo valor)
 * - className: clase CSS opcional
 * - placeholder: texto placeholder
 * - inputProps: props adicionales para el input
 * - multiline: si es true usa textarea, si es false usa input (por defecto false)
 * - type: tipo de input (text, date, email, etc.) - por defecto 'text'
 */
function InlineEditable({ 
  value, 
  onSave, 
  className = '', 
  placeholder = 'Editar...', 
  inputProps = {},
  multiline = false,
  type = 'text'
}) {
  const { useState, useEffect, useRef } = React;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef(null);
  const displayRef = useRef(null);
  
  // Convertir valor a formato apropiado según el tipo
  const getInputValue = () => {
    if (type === 'date' && value) {
      // Si es fecha, convertir a formato YYYY-MM-DD para input date
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return value || '';
  };
  
  // Al iniciar edición, enfocar el input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'date') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);
  
  // Actualizar valor local si cambia value en props
  useEffect(() => {
    if (type === 'date' && value) {
      setEditValue(getInputValue());
    } else {
      setEditValue(value || '');
    }
  }, [value, type]);
  
  // Iniciar edición con doble clic o un tap
  const handleActivate = () => {
    setIsEditing(true);
  };
  
  // Guardar con Enter o blur
  const handleSave = () => {
    if (!isEditing) return;
    
    let valueToSave = editValue;
    
    if (type === 'date') {
      // Para fechas, guardar el valor tal cual (formato YYYY-MM-DD)
      if (valueToSave && valueToSave !== value) {
        onSave(valueToSave);
      }
    } else {
      // Para otros tipos, trim y verificar que no esté vacío
      const trimmedValue = editValue.trim();
      if (trimmedValue !== value) {
        onSave(trimmedValue || placeholder);
      }
    }
    setIsEditing(false);
  };
  
  // Cancelar con Escape
  const handleKeyDown = (e) => {
    // Para textarea: Enter guarda solo si no se presiona Shift
    // Para input: Enter siempre guarda
    if (e.key === 'Enter' && (!multiline || !e.shiftKey)) {
      handleSave();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setEditValue(value || ''); // Restaurar valor original
      setIsEditing(false);
      e.preventDefault();
    }
  };
  
  // Detectar clic fuera para guardar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isEditing && 
          inputRef.current && 
          !inputRef.current.contains(event.target) &&
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

  return isEditing ? (
    multiline ? (
      <textarea
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`inline-edit-input ${className}`}
        placeholder={placeholder}
        rows={4}
        style={{
          width: '100%',
          minHeight: '100px',
          maxHeight: '300px',
          resize: 'vertical',
          padding: '12px 16px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          fontStyle: 'inherit',
          color: 'inherit',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid #8B5CF6',
          borderRadius: '8px',
          outline: 'none',
          lineHeight: '1.5',
          boxSizing: 'border-box'
        }}
        {...inputProps}
      />
    ) : (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`inline-edit-input ${className}`}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 'inherit',
          fontFamily: 'inherit',
          color: 'inherit',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '2px solid #8B5CF6',
          borderRadius: '6px',
          outline: 'none',
          boxSizing: 'border-box',
          colorScheme: 'dark'
        }}
        {...inputProps}
      />
    )
  ) : (
    <span
      ref={displayRef}
      className={`inline-edit ${className} ${!value ? 'inline-edit-empty' : ''}`}
      onDoubleClick={handleActivate}
      onTouchEnd={handleTouchEnd}
      title="Doble clic para editar"
    >
      {type === 'date' && value ? 
        new Date(value).toLocaleDateString('es-HN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) 
        : (value || placeholder)
      }
    </span>
  );
}

window.InlineEditable = InlineEditable;