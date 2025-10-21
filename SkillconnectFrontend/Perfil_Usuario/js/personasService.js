// Servicio API para Personas
const API_URL = 'http://localhost:3001/api/personas';

// Obtener todas las personas
export const obtenerTodasPersonas = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener personas:', error);
        throw error;
    }
};

// Obtener persona por ID
export const obtenerPersonaPorId = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener persona:', error);
        throw error;
    }
};

// Crear nueva persona
export const crearPersona = async (personaData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personaData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al crear persona:', error);
        throw error;
    }
};

// Actualizar persona
export const actualizarPersona = async (id, personaData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personaData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al actualizar persona:', error);
        throw error;
    }
};

// Eliminar persona
export const eliminarPersona = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al eliminar persona:', error);
        throw error;
    }
};
