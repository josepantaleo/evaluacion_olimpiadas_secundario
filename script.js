// Variables globales para almacenar datos
let grupos = [];
let evaluaciones = [];
let evaluadoresGlobales = {
    evaluador1: "",
    evaluador2: "",
    evaluador3: ""
};

// --- Inicialización al cargar el DOM ---
document.addEventListener("DOMContentLoaded", () => {
    inicializarAplicacion();
});

async function inicializarAplicacion() {
    await cargarGrupos();
    cargarEvaluaciones();
    cargarEvaluadoresGlobales();
    setupEventListeners();
    actualizarInterfaz();
}

// --- Gestión de Grupos ---
async function cargarGrupos() {
    try {
        const response = await fetch('grupos.json');
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        grupos = await response.json();
        poblarSelectGrupos();
    } catch (error) {
        mostrarNotificacion(`Error cargando grupos: ${error.message}`, 'error');
    }
}

function poblarSelectGrupos() {
    const select = document.getElementById('selectGrupo');
    select.innerHTML = '<option value="">Seleccione un grupo</option>';
    grupos.forEach(grupo => {
        const option = document.createElement('option');
        option.value = grupo.id;
        option.textContent = `${grupo.nombre} - ${grupo.escuela} (${grupo.grado || 'N/A'})`;
        select.appendChild(option);
    });
}

// --- Event Listeners ---
function setupEventListeners() {
    document.getElementById('formularioEvaluacion').addEventListener('submit', guardarEvaluacion);
    document.getElementById('limpiarDatos').addEventListener('click', limpiarTodasEvaluaciones);
    document.getElementById('exportarJsonBtn').addEventListener('click', exportarDatos);
    document.getElementById('guardarEvaluadoresBtn').addEventListener('click', guardarEvaluadoresGlobales);
    document.getElementById('eliminarEvaluadoresBtn').addEventListener('click', eliminarEvaluadoresGlobales); // ¡NUEVO LISTENER!
    document.getElementById('selectGrupo').addEventListener('change', mostrarInfoGrupo);
}

// --- Gestión de Evaluadores Globales ---
function guardarEvaluadoresGlobales() {
    const eval1 = document.getElementById('evaluador1Global').value.trim();
    const eval2 = document.getElementById('evaluador2Global').value.trim();
    const eval3 = document.getElementById('evaluador3Global').value.trim();

    if (!eval1) {
        mostrarNotificacion('El campo "Evaluador 1" es obligatorio para guardar los evaluadores.', 'error');
        return;
    }

    evaluadoresGlobales = {
        evaluador1: eval1,
        evaluador2: eval2 || null,
        evaluador3: eval3 || null
    };

    localStorage.setItem('evaluadoresScratch', JSON.stringify(evaluadoresGlobales));
    mostrarNotificacion('Evaluadores guardados correctamente.', 'success');
    mostrarEvaluadoresGlobales();
}

function cargarEvaluadoresGlobales() {
    const datos = localStorage.getItem('evaluadoresScratch');
    if (datos) {
        evaluadoresGlobales = JSON.parse(datos);
        document.getElementById('evaluador1Global').value = evaluadoresGlobales.evaluador1 || '';
        document.getElementById('evaluador2Global').value = evaluadoresGlobales.evaluador2 || '';
        document.getElementById('evaluador3Global').value = evaluadoresGlobales.evaluador3 || '';
    }
}

function mostrarEvaluadoresGlobales() {
    const displayDiv = document.getElementById('evaluadoresActuales');
    const ev1 = evaluadoresGlobales.evaluador1 || 'No definido';
    const ev2 = evaluadoresGlobales.evaluador2 || 'No definido';
    const ev3 = evaluadoresGlobales.evaluador3 || 'No definido';

    displayDiv.innerHTML = `
        <p><strong>Evaluador 1:</strong> ${ev1}</p>
        <p><strong>Evaluador 2:</strong> ${ev2}</p>
        <p><strong>Evaluador 3:</strong> ${ev3}</p>
    `;
}

// ¡NUEVA FUNCIÓN PARA ELIMINAR EVALUADORES GLOBALES!
function eliminarEvaluadoresGlobales() {
    if (confirm("¿Estás seguro de que deseas eliminar los nombres de todos los evaluadores? Esto no afectará las evaluaciones ya guardadas.")) {
        evaluadoresGlobales = { // Resetear los evaluadores a su estado inicial vacío
            evaluador1: "",
            evaluador2: "",
            evaluador3: ""
        };
        localStorage.removeItem('evaluadoresScratch'); // Eliminar del localStorage
        
        // Limpiar los campos de entrada de evaluadores
        document.getElementById('evaluador1Global').value = '';
        document.getElementById('evaluador2Global').value = '';
        document.getElementById('evaluador3Global').value = '';

        mostrarEvaluadoresGlobales(); // Actualizar la visualización para mostrar "No definido"
        mostrarNotificacion('Evaluadores eliminados correctamente.', 'success');
    }
}


// --- Gestión de Evaluaciones ---
function guardarEvaluacion(e) {
    e.preventDefault();

    if (!evaluadoresGlobales.evaluador1) {
        mostrarNotificacion('Por favor, defina y guarde el **Evaluador 1** en la sección de "Datos de los Evaluadores" antes de guardar una evaluación.', 'error');
        return;
    }

    const grupoId = document.getElementById('selectGrupo').value;
    if (!grupoId) {
        mostrarNotificacion('Seleccione un grupo.', 'error');
        return;
    }

    const grupoSeleccionado = grupos.find(g => g.id === grupoId);
    if (!grupoSeleccionado) {
        mostrarNotificacion('Error: Grupo seleccionado no encontrado.', 'error');
        return;
    }

    const puntajeFuncionalidad = Number(document.getElementById('puntajeFuncionalidad').value);
    const puntajeProgramacion = Number(document.getElementById('puntajeProgramacion').value);
    const puntajeDiseno = Number(document.getElementById('puntajeDiseno').value);

    // Validar que los puntajes estén dentro del rango
    if (isNaN(puntajeFuncionalidad) || puntajeFuncionalidad < 0 || puntajeFuncionalidad > 10 ||
        isNaN(puntajeProgramacion) || puntajeProgramacion < 0 || puntajeProgramacion > 10 ||
        isNaN(puntajeDiseno) || puntajeDiseno < 0 || puntajeDiseno > 10) {
        mostrarNotificacion('Los puntajes deben estar entre 0 y 10.', 'error');
        return;
    }

    const evaluacion = {
        evaluador1: evaluadoresGlobales.evaluador1,
        evaluador2: evaluadoresGlobales.evaluador2,
        evaluador3: evaluadoresGlobales.evaluador3,
        grupoId: grupoId,
        nombreGrupo: grupoSeleccionado.nombre,
        escuelaGrupo: grupoSeleccionado.escuela,
        integrantesGrupo: grupoSeleccionado.integrantes,
        gradoGrupo: grupoSeleccionado.grado || 'N/A',
        idProyecto: document.getElementById('idProyecto').value.trim() || null,
        puntajeFuncionalidad: puntajeFuncionalidad,
        obsFuncionalidad: document.getElementById('obsFuncionalidad').value.trim() || null,
        puntajeProgramacion: puntajeProgramacion,
        obsProgramacion: document.getElementById('obsProgramacion').value.trim() || null,
        puntajeDiseno: puntajeDiseno,
        obsDiseno: document.getElementById('obsDiseno').value.trim() || null,
        mencion: document.getElementById('mencionEspecialManual').value.trim() || null,
        total: puntajeFuncionalidad + puntajeProgramacion + puntajeDiseno
    };

    const indiceEdicion = document.getElementById('indiceEdicion').value;

    if (indiceEdicion !== '') {
        evaluaciones[Number(indiceEdicion)] = evaluacion;
        document.getElementById('indiceEdicion').value = '';
        mostrarNotificacion('Evaluación actualizada.', 'success');
    } else {
        evaluaciones.push(evaluacion);
        mostrarNotificacion('Evaluación guardada.', 'success');
    }

    guardarEvaluaciones();
    actualizarInterfaz();
    limpiarFormularioEvaluacion();
}

function editarEvaluacion(idx) {
    const ev = evaluaciones[idx];
    if (!ev) {
        mostrarNotificacion('Error: Evaluación no encontrada para editar.', 'error');
        return;
    }

    document.getElementById('selectGrupo').value = ev.grupoId;
    document.getElementById('selectGrupo').dispatchEvent(new Event('change'));
    document.getElementById('idProyecto').value = ev.idProyecto || '';
    document.getElementById('puntajeFuncionalidad').value = ev.puntajeFuncionalidad;
    document.getElementById('obsFuncionalidad').value = ev.obsFuncionalidad || '';
    document.getElementById('puntajeProgramacion').value = ev.puntajeProgramacion;
    document.getElementById('obsProgramacion').value = ev.obsProgramacion || '';
    document.getElementById('puntajeDiseno').value = ev.puntajeDiseno;
    document.getElementById('obsDiseno').value = ev.obsDiseno || '';
    document.getElementById('mencionEspecialManual').value = ev.mencion || '';
    document.getElementById('indiceEdicion').value = idx;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminarEvaluacion(idx) {
    if (confirm("¿Seguro que deseas eliminar esta evaluación?")) {
        evaluaciones.splice(idx, 1);
        guardarEvaluaciones();
        actualizarInterfaz();
        mostrarNotificacion('Evaluación eliminada.', 'success');
    }
}

function limpiarTodasEvaluaciones() {
    if (confirm("¡ATENCIÓN! ¿Seguro que deseas eliminar TODAS las evaluaciones? Esta acción es irreversible.")) {
        evaluaciones = [];
        guardarEvaluaciones();
        actualizarInterfaz();
        mostrarNotificacion('Todas las evaluaciones han sido eliminadas.', 'success');
    }
}

function limpiarFormularioEvaluacion() {
    document.getElementById('formularioEvaluacion').reset();
    document.getElementById('indiceEdicion').value = '';
    document.getElementById('grupoInfo').style.display = 'none';
    document.getElementById('grupoInfo').innerHTML = '';
}

function cargarEvaluaciones() {
    const datos = localStorage.getItem('evaluacionesScratch');
    if (datos) {
        evaluaciones = JSON.parse(datos);
    }
}

function guardarEvaluaciones() {
    localStorage.setItem('evaluacionesScratch', JSON.stringify(evaluaciones));
}

// --- Funciones de visualización y utilidad ---
function actualizarInterfaz() {
    mostrarEvaluaciones();
    mostrarClasificacion();
}

function mostrarEvaluaciones() {
    const lista = document.getElementById('listaEvaluaciones');
    lista.innerHTML = '';

    if (evaluaciones.length === 0) {
        lista.innerHTML = '<p id="noDatosMensaje">No hay evaluaciones guardadas aún.</p>';
        document.getElementById('limpiarDatos').style.display = 'none';
        return;
    }
    document.getElementById('limpiarDatos').style.display = 'inline-block';

    evaluaciones.forEach((ev, idx) => {
        const evaluadoresDisplay = [];
        if (ev.evaluador1) evaluadoresDisplay.push(ev.evaluador1);
        if (ev.evaluador2) evaluadoresDisplay.push(ev.evaluador2);
        if (ev.evaluador3) evaluadoresDisplay.push(ev.evaluador3);
        const evaluadoresHtml = evaluadoresDisplay.length > 0
            ? `<p><strong>Evaluador(es):</strong> ${evaluadoresDisplay.join(', ')}</p>`
            : '';

        const div = document.createElement('div');
        div.className = 'evaluacion-card';
        div.setAttribute('data-index', idx);

        div.innerHTML = `
            <div class="action-buttons">
                <button class="edit-btn" onclick="editarEvaluacion(${idx})">Editar</button>
                <button class="delete-btn" onclick="eliminarEvaluacion(${idx})">Eliminar</button>
            </div>
            ${evaluadoresHtml}
            <p><strong>Grupo:</strong> ${ev.nombreGrupo}</p>
            <p><strong>Escuela:</strong> ${ev.escuelaGrupo}</p>
            <p><strong>Grado/Curso:</strong> ${ev.gradoGrupo}</p>
            <p><strong>Integrantes:</strong> ${ev.integrantesGrupo ? ev.integrantesGrupo.join(', ') : 'N/A'}</p>
            <p><strong>ID Proyecto Scratch:</strong> ${ev.idProyecto || 'N/A'}</p>
            <p><strong>Funcionalidad:</strong> ${ev.puntajeFuncionalidad} / 10</p>
            <p><strong>Observaciones Funcionalidad:</strong> ${ev.obsFuncionalidad || 'Sin observaciones'}</p>
            <p><strong>Programación:</strong> ${ev.puntajeProgramacion} / 10</p>
            <p><strong>Observaciones Programación:</strong> ${ev.obsProgramacion || 'Sin observaciones'}</p>
            <p><strong>Diseño/UX:</strong> ${ev.puntajeDiseno} / 10</p>
            <p><strong>Observaciones Diseño/UX:</strong> ${ev.obsDiseno || 'Sin observaciones'}</p>
            ${ev.mencion ? `<p class="mencion-especial-display"><strong>Mención Especial:</strong> ${ev.mencion}</p>` : ''}
            <p><strong>Total:</strong> ${ev.total} puntos</p>
        `;
        lista.appendChild(div);
    });
}


function mostrarClasificacion() {
    const contenedor = document.getElementById('clasificacionResultados');
    contenedor.innerHTML = '';

    if (evaluaciones.length === 0) {
        contenedor.innerHTML = '<p>No hay evaluaciones para mostrar la clasificación.</p>';
        return;
    }

    const ordenadas = [...evaluaciones].sort((a, b) => b.total - a.total);

    let html = `<h2>Clasificación de Proyectos</h2><ol class="clasificacion-list">`;

    ordenadas.forEach((ev, i) => {
        const evaluadoresDisplay = [];
        if (ev.evaluador1) evaluadoresDisplay.push(ev.evaluador1);
        if (ev.evaluador2) evaluadoresDisplay.push(ev.evaluador2);
        if (ev.evaluador3) evaluadoresDisplay.push(ev.evaluador3);
        const evaluadoresHtml = evaluadoresDisplay.length > 0
            ? ` (Evaluador(es): ${evaluadoresDisplay.join(', ')})`
            : '';

        let puesto = '';
        let clasePuesto = '';

        if (i === 0) {
            puesto = '1er Puesto 🥇';
            clasePuesto = 'primer-puesto';
        } else if (i === 1) {
            puesto = '2do Puesto 🥈';
            clasePuesto = 'segundo-puesto';
        } else if (i === 2) {
            puesto = '3er Puesto 🥉';
            clasePuesto = 'tercer-puesto';
        } else {
            puesto = `${i + 1}º Puesto`;
        }

        html += `
            <li class="item-clasificacion ${clasePuesto}">
                <span class="clasificacion-puesto">${puesto}:</span>
                <span class="clasificacion-grupo">
                    <strong>${ev.nombreGrupo}</strong><br>
                    <strong>Escuela: ${ev.escuelaGrupo}</strong><br>
                    <strong>Grado: ${ev.gradoGrupo}</strong><br>
                    <small>Integrantes: ${ev.integrantesGrupo ? ev.integrantesGrupo.join(', ') : 'N/A'}</small>
                    ${evaluadoresHtml}
                </span>
                <span class="clasificacion-total">Total: ${ev.total} puntos</span>
                ${ev.mencion ? `<p class="clasificacion-mencion">Mención Especial: ${ev.mencion}</p>` : ''}
            </li>`;
    });

    html += '</ol>';
    contenedor.innerHTML = html;
}

function mostrarNotificacion(mensaje, tipo) {
    const barra = document.getElementById('notification-bar');
    barra.textContent = mensaje;
    barra.className = tipo === 'success' ? 'notification success' : 'notification error';
    barra.style.display = 'block';
    setTimeout(() => {
        barra.style.display = 'none';
    }, 3000);
}

function exportarDatos() {
    if (evaluaciones.length === 0) {
        mostrarNotificacion("No hay evaluaciones para exportar.", 'error');
        return;
    }

    const evaluacionesConPuesto = [...evaluaciones].sort((a, b) => b.total - a.total);

    let puestoActual = 1;
    let puntajeAnterior = -1;
    evaluacionesConPuesto.forEach((ev, index) => {
        if (ev.total !== puntajeAnterior) {
            puestoActual = index + 1;
        }
        ev.puesto = puestoActual;
        puntajeAnterior = ev.total;
    });

    const jsonString = JSON.stringify(evaluacionesConPuesto, null, 2);

    const blob = new Blob([jsonString], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluaciones_scratch.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    mostrarNotificacion("Resultados exportados a TXT.", 'success');
    alert("¡Éxito! El archivo 'evaluaciones_scratch.txt' se ha descargado.\nPor favor, envíalo a ipem146centenario@gmail.com con el asunto: OLIMPIADAS");
}

function mostrarInfoGrupo() {
    const grupoId = this.value;
    const grupoInfoDiv = document.getElementById('grupoInfo');
    if (!grupoId) {
        grupoInfoDiv.style.display = 'none';
        grupoInfoDiv.innerHTML = '';
        return;
    }
    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) {
        grupoInfoDiv.style.display = 'none';
        grupoInfoDiv.innerHTML = '';
        return;
    }
    grupoInfoDiv.style.display = 'block';
    grupoInfoDiv.innerHTML = `
        <p><strong>Escuela:</strong> ${grupo.escuela}</p>
        <p><strong>Grado/Curso:</strong> ${grupo.grado || 'N/A'}</p>
        <p><strong>Integrantes:</strong> ${grupo.integrantes.join(', ')}</p>
    `;
}