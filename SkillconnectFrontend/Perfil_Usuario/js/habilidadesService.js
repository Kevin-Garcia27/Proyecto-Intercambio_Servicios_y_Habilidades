// Servicio API para Habilidades y Servicios
const API_URL = 'http://localhost:3001/api/habilidades';

// Obtener todas las habilidades
export const obtenerTodasHabilidades = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener habilidades:', error);
        throw error;
    }
};

// Obtener habilidad por ID
export const obtenerHabilidadPorId = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener habilidad:', error);
        throw error;
    }
};

// Obtener habilidades por ID de Persona
export const obtenerHabilidadesPorPersona = async (idPersona) => {
    try {
        const response = await fetch(`${API_URL}/persona/${idPersona}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener habilidades de persona:', error);
        throw error;
    }
};

// Crear nueva habilidad
export const crearHabilidad = async (habilidadData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(habilidadData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al crear habilidad:', error);
        throw error;
    }
};

// Actualizar habilidad
export const actualizarHabilidad = async (id, habilidadData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(habilidadData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al actualizar habilidad:', error);
        throw error;
    }
};

// Eliminar habilidad
export const eliminarHabilidad = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al eliminar habilidad:', error);
        throw error;
    }
};
