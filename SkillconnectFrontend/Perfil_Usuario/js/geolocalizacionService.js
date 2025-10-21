// Servicio API para Geolocalización
const API_URL = 'http://localhost:3001/api/geolocalizacion';

// Obtener todas las geolocalizaciones
export const obtenerTodasGeolocalizaciones = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener geolocalizaciones:', error);
        throw error;
    }
};

// Obtener geolocalización por ID
export const obtenerGeolocalizacionPorId = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener geolocalización:', error);
        throw error;
    }
};

// Obtener geolocalización por ID de Dirección
export const obtenerGeolocalizacionPorDireccion = async (idDireccion) => {
    try {
        const response = await fetch(`${API_URL}/direccion/${idDireccion}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener geolocalización de dirección:', error);
        throw error;
    }
};

// Crear nueva geolocalización
export const crearGeolocalizacion = async (geolocalizacionData) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geolocalizacionData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al crear geolocalización:', error);
        throw error;
    }
};

// Actualizar geolocalización
export const actualizarGeolocalizacion = async (id, geolocalizacionData) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geolocalizacionData)
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al actualizar geolocalización:', error);
        throw error;
    }
};

// Eliminar geolocalización
export const eliminarGeolocalizacion = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al eliminar geolocalización:', error);
        throw error;
    }
};
