/**
 * SelectEditable - Versión JavaScript Vanilla
 * Clase para crear elementos select editables inline sin React
 * 
 * Uso:
 * const selector = new SelectEditable(element, {
 *   value: 'Soltero',
 *   options: ['Soltero', 'Casado', 'Divorciado', 'Viudo'],
 *   onSave: (newValue) => console.log('Guardado:', newValue),
 *   placeholder: 'Seleccionar...'
 * });
 */

class SelectEditable {
  constructor(element, options = {}) {
    this.element = element;
    this.config = {
      value: options.value || '',
      options: options.options || [],
      onSave: options.onSave || (() => {}),
      placeholder: options.placeholder || 'Seleccionar...',
      className: options.className || ''
    };
    
    this.isEditing = false;
    this.editValue = this.config.value;
    this.selectElement = null;
    this.displayElement = null;
    
    // Normalizar opciones a formato {value, label}
    this.normalizedOptions = this.config.options.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
    
    this.init();
  }
  
  init() {
    // Configurar elemento contenedor
    this.element.classList.add('select-editable-container');
    
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
    this.displayElement.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    this.element.innerHTML = '';
    this.element.appendChild(this.displayElement);
  }
  
  createSelectElement() {
    this.selectElement = document.createElement('select');
    this.selectElement.className = `inline-edit-select ${this.config.className}`;
    this.selectElement.value = this.editValue;
    
    // Opción placeholder
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.disabled = true;
    placeholderOption.textContent = this.config.placeholder;
    this.selectElement.appendChild(placeholderOption);
    
    // Opciones
    this.normalizedOptions.forEach(option => {
      const optElement = document.createElement('option');
      optElement.value = option.value;
      optElement.textContent = option.label;
      if (option.value === this.editValue) {
        optElement.selected = true;
      }
      this.selectElement.appendChild(optElement);
    });
    
    // Event listeners
    this.selectElement.addEventListener('change', (e) => this.handleChange(e));
    this.selectElement.addEventListener('blur', () => this.handleSave());
    this.selectElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    return this.selectElement;
  }
  
  updateDisplayValue() {
    const currentOption = this.normalizedOptions.find(opt => opt.value === this.config.value);
    const displayValue = currentOption ? currentOption.label : this.config.value;
    this.displayElement.textContent = displayValue || this.config.placeholder;
    
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
    
    // Reemplazar display con select
    const select = this.createSelectElement();
    this.element.innerHTML = '';
    this.element.appendChild(select);
    
    // Enfocar
    setTimeout(() => {
      if (this.selectElement) {
        this.selectElement.focus();
      }
    }, 0);
  }
  
  handleChange(e) {
    const newValue = e.target.value;
    this.editValue = newValue;
    
    // Auto guardar en select
    setTimeout(() => {
      this.config.onSave(newValue);
      this.config.value = newValue;
      this.stopEditing();
    }, 100);
  }
  
  handleSave() {
    if (!this.isEditing) return;
    
    if (this.editValue !== this.config.value) {
      this.config.onSave(this.editValue);
      this.config.value = this.editValue;
    }
    
    this.stopEditing();
  }
  
  handleKeyDown(e) {
    if (e.key === 'Escape') {
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
        this.selectElement && 
        !this.selectElement.contains(event.target)) {
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
  
  // Método para actualizar las opciones
  setOptions(newOptions) {
    this.config.options = newOptions;
    this.normalizedOptions = newOptions.map(opt => 
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
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
// EJEMPLO DE USO EN TU CÓDIGO EXISTENTE
// ==============================================

// Función helper para crear SelectEditables en tu renderDatosPersonales()
function makeSelectEditable(element, field, options, onSave) {
  // Limpiar el span existente
  element.innerHTML = '';
  
  // Crear instancia de SelectEditable
  const selectEditable = new SelectEditable(element, {
    value: usuario[field] || '',
    options: options,
    onSave: (newValue) => {
      onSave(newValue);
    },
    placeholder: 'Seleccionar...'
  });
  
  // Guardar referencia para poder actualizar después
  element._selectEditableInstance = selectEditable;
  
  return selectEditable;
}

// ==============================================
// INTEGRACIÓN CON TU CÓDIGO EXISTENTE
// ==============================================

/*
// En tu función renderDatosPersonales(), reemplaza la llamada original por:

function renderDatosPersonales() {
  const datosPersonales = document.getElementById('datosPersonales');
  datosPersonales.innerHTML = '';

  const campos = [
    { label: 'País', field: 'pais', value: usuario.pais },
    { label: 'Departamento', field: 'departamento', value: usuario.departamento },
    { label: 'Ciudad', field: 'ciudad', value: usuario.ciudad },
    { label: 'Código Postal', field: 'codigoPostal', value: usuario.codigoPostal },
    { 
      label: 'Estado Civil', 
      field: 'estadoCivil_Usuario', 
      value: usuario.estadoCivil_Usuario, 
      type: 'select', 
      options: ['Soltero', 'Casado', 'Divorciado', 'Viudo']
    },
    { 
      label: 'Género', 
      field: 'genero_Usuario', 
      value: usuario.genero_Usuario, 
      type: 'select', 
      options: ['Masculino', 'Femenino', 'Otro']
    },
    { 
      label: 'Tipo de Identificación', 
      field: 'tipoIdentificacion_Usuario', 
      value: usuario.tipoIdentificacion_Usuario, 
      type: 'select', 
      options: ['DNI', 'Pasaporte']
    },
    { label: 'Número de Identificación', field: 'identificacion_usuario', value: usuario.identificacion_usuario },
    { label: 'Fecha de Nacimiento', field: 'fechaNacimiento', value: usuario.fechaNacimiento, type: 'date' }
  ];

  campos.forEach(campo => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="label">${campo.label}:</span>
      <span class="editable" data-field="${campo.field}">${campo.value || 'No especificado'}</span>
    `;
    datosPersonales.appendChild(li);

    const editableSpan = li.querySelector('.editable');
    
    if (campo.type === 'select') {
      // NUEVA IMPLEMENTACIÓN con SelectEditable
      makeSelectEditable(
        editableSpan, 
        campo.field, 
        campo.options, 
        (value) => updateUsuario(campo.field, value)
      );
    } else if (campo.type === 'date') {
      makeEditable(editableSpan, campo.field, (value) => updateUsuario(campo.field, value), false, 'date');
    } else {
      makeEditable(editableSpan, campo.field, (value) => updateUsuario(campo.field, value));
    }
  });
}
*/