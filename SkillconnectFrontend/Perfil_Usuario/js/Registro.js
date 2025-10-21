import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Registro.css';

function Registro() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');
  const navigate = useNavigate(); // Hook para navegar

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setMensaje('');
    setTipoMensaje('');

    try {
      const url = 'http://localhost:3001/api/registro';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo, contrasena })
      });

      const data = await response.json();

      if (response.status === 201) {
        setMensaje('Registro Exitoso: ' + data.mensaje);
        setTipoMensaje('success');
        setCorreo('');
        setContrasena('');
      } else if (response.status === 409) {
        setMensaje('Error: Este correo ya está registrado.');
        setTipoMensaje('error');
      } else {
        setMensaje('Error del servidor: ' + (data.mensaje || 'Intente de nuevo.'));
        setTipoMensaje('error');
      }
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
      setMensaje('Error de conexión. Asegúrate que el Backend esté activo.');
      setTipoMensaje('error');
    }
  };

  return (
    <div className="registro-wrapper">
      <div className="registro-container">
        <div className="logo-text">SkillConnect</div>
        <h1>Crear Cuenta</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico:</label>
            <input
              type="email"
              id="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contrasena">Contraseña:</label>
            <input
              type="password"
              id="contrasena"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
            />
          </div>
          <button type="submit">Registrarse</button>
        </form>
        
        {/* Botón de prueba para navegar al perfil */}
        <button 
          onClick={() => navigate('/perfil')}
          style={{
            marginTop: '1rem',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '0.75rem 1.5rem',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            width: '100%',
            transition: 'background-color 0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#10B981'}
        >
           Ir al Perfil (Prueba)
        </button>
        
        {mensaje && (
          <div className={`mensaje ${tipoMensaje}`}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}

export default Registro;
