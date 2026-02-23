require('dotenv').config();
const db = require('./db');

async function createSP() {
    try {
        console.log('Eliminando procedimiento almacenado anterior si existe...');
        await db.execute('DROP PROCEDURE IF EXISTS sp_ObtenerListadoTecnicos');

        console.log('Creando procedimiento almacenado sp_ObtenerListadoTecnicos...');
        const query = `
        CREATE PROCEDURE sp_ObtenerListadoTecnicos()
        BEGIN
            SELECT 
                p.id_Perfil_Persona,
                p.nombre_Persona,
                p.apellido_Persona,
                p.imagenUrl_Persona,
                p.disponibilidad as estado,
                IFNULL((
                    SELECT d.ciudad_Direccion 
                    FROM Direcciones d 
                    WHERE d.id_Perfil_Persona = p.id_Perfil_Persona 
                    LIMIT 1
                ), 'Sin ubicación') as ubicacion,
                (
                    SELECT GROUP_CONCAT(DISTINCT cat.nombre_Categoria SEPARATOR ', ')
                    FROM Habilidades_Servicios_Persona hs
                    JOIN Habilidades_Servicios h ON hs.id_Habilidad = h.id_Habilidad
                    JOIN Categorias_Generales_Habilidades cat ON h.id_Categoria = cat.id_Categoria
                    WHERE hs.id_Perfil_Persona = p.id_Perfil_Persona
                ) as especialidades,
                (
                    SELECT GROUP_CONCAT(DISTINCT h.nombre_Habilidad SEPARATOR ', ')
                    FROM Habilidades_Servicios_Persona hs
                    JOIN Habilidades_Servicios h ON hs.id_Habilidad = h.id_Habilidad
                    WHERE hs.id_Perfil_Persona = p.id_Perfil_Persona
                ) as habilidades_nombres
            FROM Personas p;
        END
        `;
        
        await db.execute(query);
        console.log('Procedimiento almacenado creado exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('Error creando el procedimiento:', error);
        process.exit(1);
    }
}

createSP();
