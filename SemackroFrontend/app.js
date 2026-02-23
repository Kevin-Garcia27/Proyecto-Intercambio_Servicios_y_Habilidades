const API_URL = "http://152.70.120.174:3001/api";

// 🔍 Buscar por habilidad
async function buscarPorHabilidad() {
  const termino = document.getElementById("habilidadInput").value;
  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "Cargando...";

  try {
    const res = await fetch('${API_URL}/busquedas/habilidad?termino=${termino}');
    const data = await res.json();

    if (data.length === 0) {
      resultadosDiv.innerHTML = "<p>No se encontraron resultados </p>";
      return;
    }

    resultadosDiv.innerHTML = data.map(p => `
      <div class="card">
        <img src="${p.foto || 'https://via.placeholder.com/200'}" alt="Foto de ${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>Habilidad: ${p.habilidad}</p>
        <p>Categoría: ${p.categoria || 'N/A'}</p>
        <button onclick="agregarAFavoritos(${p.id})"> Agregar a favoritos</button>
      </div>
    `).join('');
  } catch (error) {
    resultadosDiv.innerHTML = "<p>Error al buscar</p>";
    console.error(error);
  }
}

// 📍 Buscar por ubicación
async function buscarPorUbicacion() {
  const ciudad = document.getElementById("ciudadInput").value;
  const pais = document.getElementById("paisInput").value;
  const resultadosDiv = document.getElementById("resultados");
  resultadosDiv.innerHTML = "Cargando...";

  try {
    const res = await fetch('${API_URL}/busquedas/ubicacion?ciudad=${ciudad}&pais=${pais}');
    const data = await res.json();

    if (data.length === 0) {
      resultadosDiv.innerHTML = "<p>No se encontraron resultados </p>";
      return;
    }

    resultadosDiv.innerHTML = data.map(p => `
      <div class="card">
        <img src="${p.foto || 'https://via.placeholder.com/200'}" alt="Foto de ${p.nombre}">
        <h3>${p.nombre}</h3>
        <p>Ciudad: ${p.ciudad}</p>
        <p>País: ${p.pais}</p>
        <button onclick="agregarAFavoritos(${p.id})"> Agregar a favoritos</button>
      </div>
    `).join('');
  } catch (error) {
    resultadosDiv.innerHTML = "<p>Error al buscar</p>";
    console.error(error);
  }
}

// 💚 Agregar a favoritos
async function agregarAFavoritos(persona_id) {
  const usuario_id = 1; // Puedes cambiarlo por el usuario logueado
  try {
    const res = await fetch('${API_URL}/favoritos', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id, persona_id })
    });
    const data = await res.json();
    alert(data.message);
  } catch (error) {
    alert("Error al agregar a favoritos");
    console.error(error);
  }
}

// 💚 Listar favoritos
async function listarFavoritos() {
  const usuario_id = 1; // Mismo usuario de ejemplo
  const contenedor = document.getElementById("listaFavoritos");
  contenedor.innerHTML = "Cargando...";

  try {
    const res = await fetch('${API_URL}/favoritos/${usuario_id}');
    const data = await res.json();

    if (data.length === 0) {
      contenedor.innerHTML = "<p>No tienes favoritos aún </p>";
      return;
    }

    contenedor.innerHTML = data.map(f => `
      <div class="card">
        <img src="${f.foto || 'https://via.placeholder.com/200'}" alt="Foto de ${f.nombre}">
        <h3>${f.nombre}</h3>
        <p>Agregado el: ${new Date(f.fecha_agregado).toLocaleDateString()}</p>
        <button onclick="eliminarFavorito(${f.id})">🗑️ Eliminar</button>
      </div>
    `).join('');
  } catch (error) {
    contenedor.innerHTML = "<p>Error al cargar favoritos</p>";
    console.error(error);
  }
}

// 🗑️ Eliminar favorito
async function eliminarFavorito(id) {
  if (!confirm("¿Eliminar de favoritos?")) return;

  try {
    const res = await fetch('${API_URL}/favoritos/${id}, { method: "DELETE" }');
    const data = await res.json();
    alert(data.message);
    listarFavoritos(); // refresca lista
  } catch (error) {
    alert("Error al eliminar favorito");
    console.error(error);
  }
}

