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
        mostrarNotificacion(`Error cargando grupos: ${error.message}. Asegúrate de que el archivo 'grupos.json' exista y sea válido.`, 'error');
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
    document.getElementById('eliminarEvaluadoresBtn').addEventListener('click', eliminarEvaluadoresGlobales);
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
        evaluador2: eval2 || null, // Guarda como null si está vacío
        evaluador3: eval3 || null  // Guarda como null si está vacío
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
    mostrarEvaluadoresGlobales();
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

function eliminarEvaluadoresGlobales() {
    if (confirm("¿Estás seguro de que deseas eliminar los nombres de todos los evaluadores? Esto no afectará las evaluaciones ya guardadas.")) {
        evaluadoresGlobales = {
            evaluador1: "",
            evaluador2: "",
            evaluador3: ""
        };
        localStorage.removeItem('evaluadoresScratch');
        document.getElementById('evaluador1Global').value = '';
        document.getElementById('evaluador2Global').value = '';
        document.getElementById('evaluador3Global').value = '';

        mostrarEvaluadoresGlobales();
        mostrarNotificacion('Evaluadores eliminados correctamente.', 'success');
    }
}

// --- Gestión de Evaluaciones ---
function guardarEvaluacion(e) {
    e.preventDefault();

    if (!evaluadoresGlobales.evaluador1) {
        mostrarNotificacion('Por favor, defina y guarde el **Evaluador 1** en la sección "Datos de los Evaluadores" antes de guardar una evaluación.', 'error');
        return;
    }

    const grupoId = document.getElementById('selectGrupo').value;
    if (!grupoId) {
        mostrarNotificacion('Seleccione un grupo para la evaluación.', 'error');
        return;
    }

    const grupoSeleccionado = grupos.find(g => g.id === grupoId);
    if (!grupoSeleccionado) {
        mostrarNotificacion('Error: Grupo seleccionado no encontrado.', 'error');
        return;
    }

    // Recopilar y validar todos los puntajes
    const puntajeFuncionalidad = Number(document.getElementById('puntajeFuncionalidad').value);
    const puntajeProgramacion = Number(document.getElementById('puntajeProgramacion').value);
    const puntajeDiseno = Number(document.getElementById('puntajeDiseno').value);
    const puntajeCreatividad = Number(document.getElementById('puntajeCreatividad').value);
    const puntajeTrabajoEquipo = Number(document.getElementById('puntajeTrabajoEquipo').value);
    const puntajeProcesoTrabajo = Number(document.getElementById('puntajeProcesoTrabajo').value);

    // Función de ayuda para validar un puntaje
    const validarPuntaje = (puntaje, nombreCampo) => {
        if (isNaN(puntaje) || puntaje < 0 || puntaje > 10) {
            mostrarNotificacion(`El puntaje de **${nombreCampo}** debe estar entre 0 y 10.`, 'error');
            return false;
        }
        return true;
    };

    if (!validarPuntaje(puntajeFuncionalidad, 'Funcionalidad') ||
        !validarPuntaje(puntajeProgramacion, 'Programación') ||
        !validarPuntaje(puntajeDiseno, 'Diseño/UX') ||
        !validarPuntaje(puntajeCreatividad, 'Creatividad y Originalidad') ||
        !validarPuntaje(puntajeTrabajoEquipo, 'Trabajo en Equipo') ||
        !validarPuntaje(puntajeProcesoTrabajo, 'Proceso de Trabajo y Esfuerzo')) {
        return;
    }

    // Calcular el total con todos los criterios
    const total = puntajeFuncionalidad + puntajeProgramacion + puntajeDiseno +
        puntajeCreatividad + puntajeTrabajoEquipo + puntajeProcesoTrabajo;

    const evaluacion = {
        evaluador1: evaluadoresGlobales.evaluador1,
        evaluador2: evaluadoresGlobales.evaluador2,
        evaluador3: evaluadoresGlobales.evaluador3,
        fechaEvaluacion: new Date().toISOString(),
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
        puntajeCreatividad: puntajeCreatividad,
        obsCreatividad: document.getElementById('obsCreatividad').value.trim() || null,
        puntajeTrabajoEquipo: puntajeTrabajoEquipo,
        obsTrabajoEquipo: document.getElementById('obsTrabajoEquipo').value.trim() || null,
        puntajeProcesoTrabajo: puntajeProcesoTrabajo,
        obsProcesoTrabajo: document.getElementById('obsProcesoTrabajo').value.trim() || null,

        mencion: document.getElementById('mencionEspecialManual').value.trim() || null,
        total: total
    };

    const indiceEdicion = document.getElementById('indiceEdicion').value;

    if (indiceEdicion !== '') {
        evaluaciones[Number(indiceEdicion)] = evaluacion;
        document.getElementById('indiceEdicion').value = '';
        mostrarNotificacion('Evaluación actualizada correctamente.', 'success');
    } else {
        evaluaciones.push(evaluacion);
        mostrarNotificacion('Evaluación guardada correctamente.', 'success');
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
    document.getElementById('puntajeCreatividad').value = ev.puntajeCreatividad || '';
    document.getElementById('obsCreatividad').value = ev.obsCreatividad || '';
    document.getElementById('puntajeTrabajoEquipo').value = ev.puntajeTrabajoEquipo || '';
    document.getElementById('obsTrabajoEquipo').value = ev.obsTrabajoEquipo || '';
    document.getElementById('puntajeProcesoTrabajo').value = ev.puntajeProcesoTrabajo || '';
    document.getElementById('obsProcesoTrabajo').value = ev.obsProcesoTrabajo || '';

    document.getElementById('mencionEspecialManual').value = ev.mencion || '';
    document.getElementById('indiceEdicion').value = idx;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminarEvaluacion(idx) {
    if (confirm("¿Estás seguro de que deseas eliminar esta evaluación?")) {
        evaluaciones.splice(idx, 1);
        guardarEvaluaciones();
        actualizarInterfaz();
        mostrarNotificacion('Evaluación eliminada correctamente.', 'success');
    }
}

function limpiarTodasEvaluaciones() {
    if (confirm("¡ATENCIÓN! ¿Estás seguro de que deseas eliminar TODAS las evaluaciones? Esta acción es irreversible.")) {
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
    document.getElementById('selectGrupo').value = '';
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
    mostrarEvaluadoresGlobales();
    mostrarClasificacion();
}

function mostrarEvaluaciones() {
    const lista = document.getElementById('listaEvaluaciones');
    lista.innerHTML = '';

    if (evaluaciones.length === 0) {
        lista.innerHTML = '<p id="noDatosMensaje">No hay evaluaciones guardadas aún.</p>';
        document.getElementById('limpiarDatos').style.display = 'none';
        document.getElementById('exportarJsonBtn').style.display = 'none';
        return;
    }
    document.getElementById('limpiarDatos').style.display = 'inline-block';
    document.getElementById('exportarJsonBtn').style.display = 'inline-block';

    evaluaciones.forEach((ev, idx) => {
        const evaluadoresDisplay = [];
        if (ev.evaluador1) evaluadoresDisplay.push(ev.evaluador1);
        if (ev.evaluador2) evaluadoresDisplay.push(ev.evaluador2);
        if (ev.evaluador3) evaluadoresDisplay.push(ev.evaluador3);
        const evaluadoresHtml = evaluadoresDisplay.length > 0
            ? `<p><strong>Evaluador(es):</strong> ${evaluadoresDisplay.join(', ')}</p>`
            : '';

        const fechaLegible = ev.fechaEvaluacion ? new Date(ev.fechaEvaluacion).toLocaleDateString('es-AR') : 'N/A';

        const div = document.createElement('div');
        div.className = 'evaluacion-card';
        div.setAttribute('data-index', idx);

        div.innerHTML = `
            <div class="action-buttons">
                <button class="edit-btn" onclick="editarEvaluacion(${idx})">Editar</button>
                <button class="delete-btn" onclick="eliminarEvaluacion(${idx})">Eliminar</button>
            </div>
            ${evaluadoresHtml}
            <p><strong>Fecha de Evaluación:</strong> ${fechaLegible}</p>
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
            <p><strong>Creatividad y Originalidad:</strong> ${ev.puntajeCreatividad} / 10</p>
            <p><strong>Observaciones Creatividad:</strong> ${ev.obsCreatividad || 'Sin observaciones'}</p>
            <p><strong>Trabajo en Equipo:</strong> ${ev.puntajeTrabajoEquipo} / 10</p>
            <p><strong>Observaciones Trabajo en Equipo:</strong> ${ev.obsTrabajoEquipo || 'Sin observaciones'}</p>
            <p><strong>Proceso de Trabajo y Esfuerzo:</strong> ${ev.puntajeProcesoTrabajo} / 10</p>
            <p><strong>Observaciones Proceso de Trabajo:</strong> ${ev.obsProcesoTrabajo || 'Sin observaciones'}</p>
            ${ev.mencion ? `<p class="mencion-especial-display"><strong>Mención Especial:</strong> ${ev.mencion}</p>` : ''}
            <p class="total-score"><strong>Total:</strong> ${ev.total} puntos</p>
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

    let puestoActual = 1;
    let puntajeAnterior = null;
    ordenadas.forEach((ev, i) => {
        if (i > 0 && ev.total !== puntajeAnterior) {
            puestoActual = i + 1;
        }
        puntajeAnterior = ev.total;

        const evaluadoresDisplay = [];
        if (ev.evaluador1) evaluadoresDisplay.push(ev.evaluador1);
        if (ev.evaluador2) evaluadoresDisplay.push(ev.evaluador2);
        if (ev.evaluador3) evaluadoresDisplay.push(ev.evaluador3);
        const evaluadoresHtml = evaluadoresDisplay.length > 0
            ? ` (Evaluador(es): ${evaluadoresDisplay.join(', ')})`
            : '';

        let puestoTexto = '';
        let clasePuesto = '';

        if (puestoActual === 1) {
            puestoTexto = '1er Puesto 🥇';
            clasePuesto = 'primer-puesto';
        } else if (puestoActual === 2) {
            puestoTexto = '2do Puesto 🥈';
            clasePuesto = 'segundo-puesto';
        } else if (puestoActual === 3) {
            puestoTexto = '3er Puesto 🥉';
            clasePuesto = 'tercer-puesto';
        } else {
            puestoTexto = `${puestoActual}º Puesto`;
        }

        html += `
            <li class="item-clasificacion ${clasePuesto}">
                <span class="clasificacion-puesto">${puestoTexto}:</span>
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

// --- FUNCIÓN CLAVE: Muestra la notificación en la barra ---
function mostrarNotificacion(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('notification-bar');
    if (!contenedor) {
        console.error("Error: Elemento #notification-bar no encontrado en el DOM.");
        return;
    }

    contenedor.innerHTML = mensaje;
    contenedor.className = `notification ${tipo}`;
    contenedor.style.display = 'block';

    clearTimeout(contenedor.timerId);
    contenedor.timerId = setTimeout(() => {
        contenedor.style.display = 'none';
        contenedor.innerHTML = '';
        contenedor.className = 'notification';
    }, 7000); // 7 segundos
}

function mostrarInfoGrupo() {
    const grupoId = this.value;
    const infoDiv = document.getElementById('grupoInfo');

    if (!grupoId) {
        infoDiv.style.display = 'none';
        infoDiv.innerHTML = '';
        return;
    }

    const grupo = grupos.find(g => g.id === grupoId);
    if (!grupo) {
        infoDiv.style.display = 'none';
        infoDiv.innerHTML = '';
        return;
    }

    infoDiv.style.display = 'block';
    infoDiv.innerHTML = `
        <p><strong>Nombre:</strong> ${grupo.nombre}</p>
        <p><strong>Escuela:</strong> ${grupo.escuela}</p>
        <p><strong>Integrantes:</strong> ${grupo.integrantes ? grupo.integrantes.join(', ') : 'N/A'}</p>
        <p><strong>Grado/Curso:</strong> ${grupo.grado || 'N/A'}</p>
    `;
}

// --- Exportar datos ---
function exportarDatos() {
    if (evaluaciones.length === 0) {
        mostrarNotificacion('No hay evaluaciones para exportar.', 'error');
        return;
    }

    const evaluacionesConPuesto = [...evaluaciones].sort((a, b) => b.total - a.total);

    let puestoActual = 1;
    let puntajeAnterior = null;
    evaluacionesConPuesto.forEach((ev, index) => {
        if (index > 0 && ev.total !== puntajeAnterior) {
            puestoActual = index + 1;
        }
        ev.puesto = puestoActual;
        puntajeAnterior = ev.total;
    });

    const fecha = new Date().toISOString().slice(0, 10);
    const filename = `evaluaciones_scratch_${fecha}.TXT`;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evaluacionesConPuesto, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", filename);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
    URL.revokeObjectURL(dataStr);

 alert(`¡Éxito! El archivo '${filename}' se ha descargado correctamente.\nPor favor, envíalo a ipem146centenario@gmail.com con el asunto: OLIMPIADAS.`);

}