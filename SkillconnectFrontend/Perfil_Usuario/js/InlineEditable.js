/**
 * InlineEditable - Versión JavaScript Vanilla
 * Clase para crear campos de texto editables inline sin React
 * 
 * Uso:
 * const editable = new InlineEditable(element, {
 *   value: 'Texto inicial',
 *   onSave: (newValue) => console.log('Guardado:', newValue),
 *   placeholder: 'Escribe aquí...',
 *   multiline: false,
 *   inputType: 'text'
 * });
 */

class InlineEditable {
  constructor(element, options = {}) {
    this.element = element;
    this.config = {
      value: options.value || '',
      onSave: options.onSave || (() => {}),
      placeholder: options.placeholder || 'Haz clic para editar...',
      multiline: options.multiline || false,
      inputType: options.inputType || 'text',
      className: options.className || ''
    };
    
    this.isEditing = false;
    this.editValue = this.config.value;
    this.inputElement = null;
    this.displayElement = null;
    
    this.init();
  }
  
  init() {
    // Configurar elemento contenedor
    this.element.classList.add('inline-editable-container');
    
    // Crear elemento de visualización
    this.createDisplayElement();
    
    // Event listeners globales
    this.setupGlobalListeners();
  }
  
  createDisplayElement() {
    this.displayElement = document.createElement('span');
    this.displayElement.className = `inline-edit ${this.config.className}`;
    
    if (!this.config.value) {
      this.displayElement.classList.add('inline-edit-empty');
    }
    
    this.displayElement.title = 'Doble clic para editar';
    this.updateDisplayValue();
    
    // Event listeners
    this.displayElement.addEventListener('dblclick', () => this.startEditing());
    this.displayElement.addEventListener('click', () => this.startEditing());
    this.displayElement.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    this.element.innerHTML = '';
    this.element.appendChild(this.displayElement);
  }
  
  createInputElement() {
    if (this.config.multiline) {
      this.inputElement = document.createElement('textarea');
      this.inputElement.rows = 3;
    } else {
      this.inputElement = document.createElement('input');
      this.inputElement.type = this.config.inputType;
    }
    
    this.inputElement.className = `inline-edit-input ${this.config.className}`;
    this.inputElement.value = this.editValue;
    
    // Event listeners
    this.inputElement.addEventListener('blur', () => this.handleSave());
    this.inputElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    return this.inputElement;
  }
  
  updateDisplayValue() {
    const displayValue = this.config.value || this.config.placeholder;
    this.displayElement.textContent = displayValue;
    
    if (!this.config.value) {
      this.displayElement.classList.add('inline-edit-empty');
    } else {
      this.displayElement.classList.remove('inline-edit-empty');
    }
  }
  
  startEditing() {
    if (this.isEditing) return;
    
    this.isEditing = true;
    this.editValue = this.config.value || '';
    
    // Reemplazar display con input
    const input = this.createInputElement();
    this.element.innerHTML = '';
    this.element.appendChild(input);
    
    // Enfocar y seleccionar
    setTimeout(() => {
      if (this.inputElement) {
        this.inputElement.focus();
        this.inputElement.select();
      }
    }, 0);
  }
  
  handleSave() {
    if (!this.isEditing) return;
    
    const newValue = this.inputElement.value;
    
    if (newValue !== this.config.value) {
      this.config.onSave(newValue);
      this.config.value = newValue;
    }
    
    this.stopEditing();
  }
  
  handleKeyDown(e) {
    if (e.key === 'Enter' && !this.config.multiline) {
      e.preventDefault();
      this.handleSave();
    } else if (e.key === 'Escape') {
      this.editValue = this.config.value; // Restaurar valor original
      this.stopEditing();
      e.preventDefault();
    }
  }
  
  handleTouchEnd(e) {
    if (!this.isEditing) {
      this.startEditing();
      e.preventDefault();
    }
  }
  
  handleClickOutside(event) {
    if (this.isEditing && 
        this.inputElement && 
        !this.inputElement.contains(event.target)) {
      this.handleSave();
    }
  }
  
  stopEditing() {
    this.isEditing = false;
    this.createDisplayElement();
  }
  
  setupGlobalListeners() {
    // Click fuera para guardar
    this.clickOutsideHandler = (event) => this.handleClickOutside(event);
    document.addEventListener('mousedown', this.clickOutsideHandler);
  }
  
  // Método para actualizar el valor externamente
  setValue(newValue) {
    this.config.value = newValue;
    this.editValue = newValue;
    if (!this.isEditing) {
      this.updateDisplayValue();
    }
  }
  
  // Destructor para limpiar listeners
  destroy() {
    document.removeEventListener('mousedown', this.clickOutsideHandler);
    if (this.element) {
      this.element.innerHTML = '';
    }
  }
}

// ==============================================
// FUNCIÓN HELPER PARA TU CÓDIGO EXISTENTE
// ==============================================

function makeEditable(element, field, onSave, multiline = false, inputType = 'text') {
  // Limpiar el elemento existente
  element.innerHTML = '';
  
  // Obtener el valor inicial del texto del elemento
  const initialValue = element.textContent || usuario[field] || '';
  
  // Crear instancia de InlineEditable
  const editable = new InlineEditable(element, {
    value: initialValue,
    onSave: (newValue) => {
      onSave(newValue);
    },
    placeholder: multiline ? 'Añade una descripción...' : 'Haz clic para editar',
    multiline: multiline,
    inputType: inputType
  });
  
  // Guardar referencia para poder actualizar después
  element._inlineEditableInstance = editable;
  
  return editable;
}

// Estilos CSS adicionales para inputs (agregar al CSS existente)
const additionalStyles = `
/* Estilos para InlineEditable inputs */
.inline-editable-container {
  display: inline-block;
  min-width: 60px;
}

.inline-edit-input {
  width: 100%;
  padding: 8px 12px;
  background: white;
  border: 2px solid rgba(37, 99, 235, 0.5);
  border-radius: 8px;
  color: #1f2937;
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.inline-edit-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2);
}

textarea.inline-edit-input {
  min-height: 80px;
  resize: vertical;
  line-height: 1.5;
}

/* Para inputs de fecha */
input[type="date"].inline-edit-input {
  cursor: pointer;
}

/* Animación para transición */
@keyframes fadeInInput {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.inline-edit-input {
  animation: fadeInInput 0.15s ease-out;
}
`;

// Inyectar estilos adicionales si no existen
if (!document.getElementById('inline-editable-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'inline-editable-styles';
  styleSheet.textContent = additionalStyles;
  document.head.appendChild(styleSheet);
}