// Datos de ejemplo basados en la tabla Usuario
// Nota: Ajusta los nombres de campos si difieren en tu backend
export const usuario = {
  id_Perfil_Usuario: 1,
  nombre_Usuario: 'Ana',
  apellido_Usuario: 'DigitalNomad',
  fechaNac_Usuario: '1995-06-15',
  genero_Usuario: 'Femenino', // ENUM('Masculino','Femenino','Otro')
  estadoCivil_Usuario: 'Soltero', // ENUM('Soltero','Casado','Divorciado','Viudo')
  tipoIdentificacion_Usuario: 'DNI', // ENUM('DNI','Pasaporte')
  identificacion_usuario: '0801199501234',
  descripcion_Usuario: 'Especialista en marketing digital. Buscando proyectos e intercambio de conocimientos.', // VARCHAR(500)
  imagenUrl_Usuario: 'https://placehold.co/112x112/4F46E5/FFFFFF?text=A', // VARCHAR(512)
  // Direccion_Usuario (relación)
  id_Direccion_Usuario: 100,
  pais_Usuario: 'Honduras',
  departamento_Usuario: 'Francisco Morazán',
  ciudad_Usuario: 'Tegucigalpa',
  codigoPostal_Usuario: '11101',
};

export const mapGenero = (value) => {
  const m = { Masculino: 'Masculino', Femenino: 'Femenino', Otro: 'Otro' };
  return m[value] || value || '—';
};

export const mapEstadoCivil = (value) => {
  const m = { Soltero: 'Soltero', Casado: 'Casado', Divorciado: 'Divorciado', Viudo: 'Viudo' };
  return m[value] || value || '—';
};