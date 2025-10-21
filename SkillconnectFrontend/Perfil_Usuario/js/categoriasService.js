// Servicio API para Categorías de Habilidades
const API_URL = 'http://localhost:3001/api/categorias';

// Obtener todas las categorías
export const obtenerTodasCategorias = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
    }
};

// Obtener categoría por ID
export const obtenerCategoriaPorId = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener categoría:', error);
        throw error;
    }
};
