// Servicio API para Direcciones
const API_URL = 'http://localhost:3001/api/direcciones';

// Obtener todas las direcciones
export const obtenerTodasDirecciones = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        throw error;
    }
};

// Obtener dirección por ID
export const obtenerDireccionPorId = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener dirección:', error);
        throw error;
    }
};

// Obtener dirección por ID de Persona
export const obtenerDireccionPorPersona = async (idPersona) => {
    try {
        const response = await fetch(`${API_URL}/persona/${idPersona}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener dirección de persona:', error);
        throw error;
    }
};

// Crear nueva dirección
export const crearDireccion = async (direccionData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(direccionData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al crear dirección:', error);
        throw error;
    }
};

// Actualizar dirección
export const actualizarDireccion = async (id, direccionData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(direccionData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al actualizar dirección:', error);
        throw error;
    }
};

// Eliminar dirección
export const eliminarDireccion = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al eliminar dirección:', error);
        throw error;
    }
};
