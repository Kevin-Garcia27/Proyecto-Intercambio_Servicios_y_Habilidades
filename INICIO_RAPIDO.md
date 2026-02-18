# 🚀 Inicio Rápido - SkillConnect

Guía rápida para iniciar el proyecto SkillConnect en desarrollo local.

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener instalado:

- ✅ **Node.js** (versión 18 o superior) - [Descargar aquí](https://nodejs.org/)
- ✅ **MySQL** (versión 8.0 o superior) - [Descargar aquí](https://dev.mysql.com/downloads/mysql/)
- ✅ **Git** (opcional, para clonar el repositorio)

### Verificar instalaciones

Abre PowerShell y ejecuta:

```powershell
node --version    # Debe mostrar v18.0.0 o superior
npm --version     # Debe mostrar una versión
mysql --version   # Debe mostrar una versión de MySQL
```

## 🗄️ Configurar Base de Datos

1. **Inicia MySQL** (si no está corriendo)

2. **Crea la base de datos** (si no existe):

```sql
CREATE DATABASE IF NOT EXISTS SkillConnect2025;
```

3. **Importa el esquema** (si tienes un archivo .sql):

```powershell
mysql -u usuario1 -p SkillConnect2025 < ruta/al/esquema.sql
```

## ⚙️ Configuración Inicial

### 1. Instalar Dependencias del Backend

```powershell
cd "SkillconnectBackend"
npm install
```

### 2. Verificar Variables de Entorno

El archivo `SkillconnectBackend/.env` ya está configurado con:

- ✅ Base de datos: `SkillConnect2025`
- ✅ Usuario: `usuario1`
- ✅ Contraseña: `equipo2`
- ✅ Puerto Backend: `3001`
- ✅ Puerto Frontend: `5050`

> **⚠️ Importante**: Asegúrate de que estos datos coincidan con tu configuración de MySQL.

## 🎯 Métodos para Iniciar el Proyecto

### Opción 1: Iniciar Todo Automáticamente (Recomendado)

Ejecuta el script principal que inicia backend y frontend juntos:

```powershell
.\start-dev.ps1
```

Esto abrirá dos ventanas:
- 🔧 **Backend** en http://localhost:3001
- 🌐 **Frontend** en http://localhost:5050

### Opción 2: Iniciar Manualmente

#### Backend (Terminal 1):

```powershell
.\start-backend.ps1
```

O manualmente:

```powershell
cd "SkillconnectBackend"
npm start
```

#### Frontend (Terminal 2):

```powershell
.\start-frontend.ps1
```

O manualmente:

```powershell
cd "SkillconnectFrontend"
node serve-frontend.js
```

## ✅ Verificar que Todo Funciona

1. **Backend**: Abre http://localhost:3001 en tu navegador
   - Deberías ver: "Servidor Skill Connect Activo!"

2. **Frontend**: Abre http://localhost:5050 en tu navegador
   - Deberías ver la página principal de SkillConnect

3. **Consola del Navegador**: Presiona F12 y verifica que aparezca:
   ```
   🔧 Configuración de entorno: LOCAL
   📡 Backend URL: http://localhost:3001
   ```

## 🔧 Solución de Problemas Comunes

###   Error: "Cannot find module"

**Solución**: Instala las dependencias del backend
```powershell
cd "SkillconnectBackend"
npm install
```

###   Error: "ECONNREFUSED" o "Cannot connect to MySQL"

**Solución**: 
1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `SkillconnectBackend/.env`
3. Asegúrate de que la base de datos `SkillConnect2025` existe

###   Error: "Port 3001 is already in use"

**Solución**: Otro proceso está usando el puerto 3001
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3001
# Detener el proceso (reemplaza PID con el número mostrado)
taskkill /PID <PID> /F
```

###   Error: "nodemon: command not found"

**Solución**: Nodemon está instalado localmente, usa npm start
```powershell
cd "SkillconnectBackend"
npm start
```

###   Error: Scripts deshabilitados en PowerShell

**Solución**: Habilita la ejecución de scripts
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📝 Estructura del Proyecto

```
Proyecto-Intercambio_Servicios_y_Habilidades/
├── SkillconnectBackend/          # Servidor Node.js + Express
│   ├── server.js                 # Punto de entrada del backend
│   ├── routes/                   # Rutas de la API
│   ├── config/                   # Configuraciones
│   └── .env                      # Variables de entorno
├── SkillconnectFrontend/         # Aplicación web estática
│   ├── serve-frontend.js         # Servidor estático
│   ├── config.js                 # Configuración de URLs
│   ├── index.html                # Página principal
│   └── js/                       # Scripts de JavaScript
├── start-dev.ps1                 # Iniciar todo
├── start-backend.ps1             # Solo backend
└── start-frontend.ps1            # Solo frontend
```

## 🌐 URLs Importantes

| Servicio | URL Local | Producción |
|----------|-----------|------------|
| Frontend | http://localhost:5050 | https://skillconnect.duckdns.org |
| Backend | http://localhost:3001 | https://skillconnect.duckdns.org/api |
| API | http://localhost:3001/api | https://skillconnect.duckdns.org/api |

## 🎨 Flujo de Desarrollo

1. Inicia ambos servidores (backend + frontend)
2. Abre http://localhost:5050 en tu navegador
3. Realiza cambios en el código
4. **Frontend**: Recarga la página (F5) para ver cambios
5. **Backend**: Nodemon reinicia automáticamente al detectar cambios

## 🛑 Detener los Servidores

- Presiona `Ctrl + C` en cada terminal/ventana
- O cierra las ventanas de PowerShell

## 📚 Comandos Útiles

```powershell
# Ver logs del backend
cd "SkillconnectBackend"
npm start

# Reinstalar dependencias
cd "SkillconnectBackend"
Remove-Item -Recurse -Force node_modules
npm install

# Verificar conexión a MySQL
mysql -u usuario1 -p
# Luego escribe: USE SkillConnect2025; SHOW TABLES;
```

## 🎯 Próximos Pasos

Una vez que todo esté funcionando:

1. Explora la aplicación en http://localhost:5050
2. Revisa los endpoints API en `SkillconnectBackend/routes/`
3. Prueba el registro y login de usuarios
4. Revisa la consola del navegador y del backend para debugging

---

## 🆘 ¿Necesitas Ayuda?

Si encuentras algún problema no listado aquí:

1. Revisa los logs del backend en la terminal
2. Revisa la consola del navegador (F12)
3. Verifica que MySQL esté corriendo y accesible
4. Asegúrate de que los puertos 3001 y 5050 estén libres

**¡Buena suerte con el desarrollo! 🚀**
