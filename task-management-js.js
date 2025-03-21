// Variables globales
let tasks = [];
let currentTaskId = 1;
let currentAction = null;
let taskToDeleteId = null;

// Elementos DOM
const taskModal = document.getElementById('taskModal');
const confirmModal = document.getElementById('confirmModal');
const taskForm = document.getElementById('taskForm');
const tasksList = document.getElementById('tasksList');
const modalTitle = document.getElementById('modalTitle');
const searchInput = document.getElementById('searchInput');
const viewFilter = document.getElementById('viewFilter');
const sortFilter = document.getElementById('sortFilter');
const totalTasksElement = document.getElementById('totalTasks');
const notStartedTasksElement = document.getElementById('notStartedTasks');
const inProgressTasksElement = document.getElementById('inProgressTasks');
const completedTasksElement = document.getElementById('completedTasks');
const archivedTasksElement = document.getElementById('archivedTasks');

// Eventos
document.getElementById('addTaskBtn').addEventListener('click', openAddTaskModal);
document.getElementById('exportBtn').addEventListener('click', exportTasks);
document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
});
document.getElementById('importFile').addEventListener('change', importTasks);
document.getElementById('searchBtn').addEventListener('click', filterTasks);
searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') filterTasks();
});
viewFilter.addEventListener('change', filterTasks);
sortFilter.addEventListener('change', filterTasks);
taskForm.addEventListener('submit', saveTask);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('confirmYes').addEventListener('click', confirmAction);
document.getElementById('confirmNo').addEventListener('click', () => {
    confirmModal.style.display = 'none';
});
document.querySelector('.close-note').addEventListener('click', () => {
    document.getElementById('noteModal').style.display = 'none';
});
document.getElementById('closeNoteBtn').addEventListener('click', () => {
    document.getElementById('noteModal').style.display = 'none';
});

// Cargar datos al iniciar
window.addEventListener('DOMContentLoaded', () => {
    loadTasksFromLocalStorage();
    renderTasks();
    updateStatistics();
});

// Función para cargar tareas desde localStorage
function loadTasksFromLocalStorage() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        // Encontrar el ID más alto para continuar desde ahí
        let maxId = 0;
        tasks.forEach(task => {
            if (task.id > maxId) maxId = task.id;
        });
        currentTaskId = maxId + 1;
    } else {
        // Si no hay tareas guardadas, simplemente inicializar con un array vacío
        tasks = [];
        currentTaskId = 1;
    }
}

// Guardar tareas en localStorage
function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Abrir modal para añadir tarea
function openAddTaskModal() {
    modalTitle.textContent = 'Nueva Tarea';
    taskForm.reset();
    document.getElementById('taskId').value = '';
    
    // Establecer fecha y hora actuales en el campo de fecha límite
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('taskDueDate').value = defaultDate;
    
    taskModal.style.display = 'block';
}

// Abrir modal para editar tarea
function openEditTaskModal(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    modalTitle.textContent = 'Editar Tarea';
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskDueDate').value = task.dueDate;
    document.getElementById('taskNotes').value = task.notes;
    
    taskModal.style.display = 'block';
}

// Cerrar modal
function closeModal() {
    taskModal.style.display = 'none';
}

// Guardar tarea
function saveTask(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('taskId').value;
    const name = document.getElementById('taskName').value;
    const status = document.getElementById('taskStatus').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const notes = document.getElementById('taskNotes').value;
    
    if (taskId) {
        // Editar tarea existente
        const index = tasks.findIndex(task => task.id === parseInt(taskId));
        if (index !== -1) {
            tasks[index].name = name;
            tasks[index].status = status;
            tasks[index].priority = parseInt(priority);
            tasks[index].dueDate = dueDate;
            tasks[index].notes = notes;
        }
    } else {
        // Crear nueva tarea
        const newTask = {
            id: currentTaskId++,
            name,
            status,
            priority: parseInt(priority),
            dueDate,
            notes,
            archived: false,
            createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
    }
    
    saveTasksToLocalStorage();
    renderTasks();
    updateStatistics();
    closeModal();
}

// Renderizar tareas en la tabla
function renderTasks() {
    // Aplicar filtros y ordenación antes de renderizar
    const filteredTasks = getFilteredTasks();
    
    // Limpiar tabla
    tasksList.innerHTML = '';
    
    if (filteredTasks.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="7" style="text-align: center;">No hay tareas para mostrar</td>
        `;
        tasksList.appendChild(emptyRow);
        return;
    }
    
    // Renderizar cada tarea
    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        
        // Calcular tiempo restante
        let timeRemaining = '';
        if (task.dueDate) {
            timeRemaining = calculateTimeRemaining(task.dueDate);
        }
        
        // Determinar color de prioridad basado en el valor
        const priorityColor = getPriorityColor(task.priority);
        const priorityIcon = getPriorityIcon(task.priority);
        
        row.innerHTML = `
            <td>${task.name}</td>
            <td><span class="status-badge ${task.status}">${formatStatus(task.status)}</span></td>
            <td>
                <div class="priority">
                    <span class="priority-icon" style="color: ${priorityColor}">
                        ${priorityIcon}
                    </span>
                    <span class="priority-value">${task.priority}</span>
                </div>
            </td>
            <td>${task.dueDate ? formatDate(task.dueDate) : '-'}</td>
            <td>${timeRemaining}</td>
            <td>
				${task.notes ? 
				`<button class="action-btn view-note-btn" onclick="viewTaskNote(${task.id}, '${task.name.replace(/'/g, "\\'")}')">
					<i class="fas fa-sticky-note"></i>
				</button>` : 
				'-'}
			</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" onclick="openEditTaskModal(${task.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${task.status === 'terminada' && !task.archived ? 
                        `<button class="action-btn archive-btn" onclick="confirmArchiveTask(${task.id})">
                            <i class="fas fa-archive"></i>
                        </button>` : ''}
                    <button class="action-btn delete-btn" onclick="confirmDeleteTask(${task.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tasksList.appendChild(row);
    });
}

// Función para obtener el color según la prioridad (1-10)
function getPriorityColor(priority) {
    const colors = [
        '#28a745', // Verde (prioridad baja 1-2)
        '#5cb85c', 
        '#8bc34a', // Verde claro (prioridad 3-4)
        '#cddc39',
        '#ffc107', // Amarillo (prioridad media 5-6)
        '#ffb300',
        '#ff9800', // Naranja (prioridad 7-8)
        '#f57c00',
        '#ff5722', // Rojo anaranjado (prioridad 9)
        '#dc3545'  // Rojo (prioridad alta 10)
    ];
    
    return colors[priority - 1] || colors[4]; // Por defecto color para prioridad 5
}

// Función para obtener el icono según la prioridad (1-10)
function getPriorityIcon(priority) {
    if (priority <= 2) {
        return '<i class="fas fa-arrow-down"></i>'; // Prioridad muy baja
    } else if (priority <= 4) {
        return '<i class="fas fa-angle-down"></i>'; // Prioridad baja
    } else if (priority <= 6) {
        return '<i class="fas fa-minus"></i>'; // Prioridad media
    } else if (priority <= 8) {
        return '<i class="fas fa-angle-up"></i>'; // Prioridad alta
    } else {
        return '<i class="fas fa-arrow-up"></i>'; // Prioridad muy alta
    }
}

// Aplicar filtros y obtener tareas filtradas
function getFilteredTasks() {
    const view = viewFilter.value;
    const sort = sortFilter.value;
    const searchTerm = searchInput.value.toLowerCase();
    
    // Filtrar por vista seleccionada y término de búsqueda
    let filtered = tasks.filter(task => {
    const matchesView = view === 'archivada' ? task.archived : 
                        (view === 'all' ? !task.archived : (!task.archived && task.status === view));
    
    const matchesSearch = task.name.toLowerCase().includes(searchTerm) || 
                         (task.notes && task.notes.toLowerCase().includes(searchTerm));
    
    return matchesView && matchesSearch;
	});
    
    // Ordenar según criterio seleccionado
    filtered.sort((a, b) => {
        switch (sort) {
            case 'fecha':
                // Si no hay fecha, tratar como fecha futura lejana
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'prioridad':
                return b.priority - a.priority;
            case 'estado':
                return getStatusWeight(a.status) - getStatusWeight(b.status);
            case 'nombre':
                return a.name.localeCompare(b.name);
            default:
                return 0;
        }
    });
    
    return filtered;
}

// Peso de estados para ordenación
function getStatusWeight(status) {
    switch (status) {
        case 'no-iniciada': return 0;
        case 'en-curso': return 1;
        case 'terminada': return 2;
        default: return 3;
    }
}

// Formatear estado para mostrar
function formatStatus(status) {
    switch (status) {
        case 'no-iniciada': return 'No iniciada';
        case 'en-curso': return 'En curso';
        case 'terminada': return 'Terminada';
        default: return status;
    }
}

// Formatear fecha para mostrar
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Calcular tiempo restante
function calculateTimeRemaining(dueDate) {
    if (!dueDate) return '-';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due - now;
    
    // Si ya pasó la fecha
    if (diffMs < 0) {
        return '<span style="color: #dc3545; font-weight: bold;">Vencida</span>';
    }
    
    const diffDays = Math.floor(diffMs / 86400000); // días
    const diffHrs = Math.floor((diffMs % 86400000) / 3600000); // horas
    
    if (diffDays > 0) {
        return `${diffDays} día${diffDays !== 1 ? 's' : ''} ${diffHrs} hr${diffHrs !== 1 ? 's' : ''}`;
    } else if (diffHrs > 0) {
        const diffMins = Math.floor((diffMs % 3600000) / 60000); // minutos
        return `${diffHrs} hr${diffHrs !== 1 ? 's' : ''} ${diffMins} min`;
    } else {
        const diffMins = Math.floor(diffMs / 60000); // minutos
        return `${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    }
}

// Función para archivar tarea
function archiveTask(taskId) {
    const index = tasks.findIndex(task => task.id === taskId);
    if (index !== -1) {
        tasks[index].archived = true;
        saveTasksToLocalStorage();
        renderTasks();
        updateStatistics();
    }
}

// Confirmar archivado de tarea
function confirmArchiveTask(taskId) {
    document.getElementById('confirmMessage').textContent = '¿Estás seguro de que deseas archivar esta tarea?';
    confirmModal.style.display = 'block';
    currentAction = 'archive';
    taskToDeleteId = taskId;
}

// Confirmar eliminación de tarea
function confirmDeleteTask(taskId) {
    document.getElementById('confirmMessage').textContent = '¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.';
    confirmModal.style.display = 'block';
    currentAction = 'delete';
    taskToDeleteId = taskId;
}

// Confirmar acción (eliminar o archivar)
function confirmAction() {
    if (currentAction === 'delete') {
        deleteTask(taskToDeleteId);
    } else if (currentAction === 'archive') {
		archiveTask(taskToDeleteId);
    }
    confirmModal.style.display = 'none';
    currentAction = null;
    taskToDeleteId = null;
}

// Eliminar tarea
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasksToLocalStorage();
    renderTasks();
    updateStatistics();
}

// Actualizar estadísticas
function updateStatistics() {
    const totalTasks = tasks.filter(task => !task.archived).length;
    const notStartedTasks = tasks.filter(task => !task.archived && task.status === 'no-iniciada').length;
    const inProgressTasks = tasks.filter(task => !task.archived && task.status === 'en-curso').length;
    const completedTasks = tasks.filter(task => !task.archived && task.status === 'terminada').length;
    const archivedTasks = tasks.filter(task => task.archived).length;
    
    totalTasksElement.textContent = totalTasks;
    notStartedTasksElement.textContent = notStartedTasks;
    inProgressTasksElement.textContent = inProgressTasks;
    completedTasksElement.textContent = completedTasks;
    archivedTasksElement.textContent = archivedTasks;
}

// Filtrar tareas según criterios
function filterTasks() {
    renderTasks();
}

// Exportar tareas a JSON
function exportTasks() {
    const tasksData = JSON.stringify(tasks, null, 2);
    const blob = new Blob([tasksData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `tareas_${formatDateForFile(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Formato de fecha para nombre de archivo
function formatDateForFile(date) {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
}

// Importar tareas desde archivo JSON
function importTasks(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTasks = JSON.parse(e.target.result);
            
            // Verificar que el formato sea correcto
            if (!Array.isArray(importedTasks)) {
                throw new Error('Formato de archivo inválido');
            }
            
            // Confirmar importación
            document.getElementById('confirmMessage').textContent = `¿Estás seguro de que deseas importar ${importedTasks.length} tareas? Esto reemplazará tus tareas actuales.`;
            currentAction = 'import';
            confirmModal.style.display = 'block';
            
            // Guardar tareas importadas temporalmente
            sessionStorage.setItem('importedTasks', e.target.result);
            
            // Actualizar acción de confirmación
            document.getElementById('confirmYes').onclick = function() {
                const importedData = sessionStorage.getItem('importedTasks');
                if (importedData) {
                    tasks = JSON.parse(importedData);
                    let maxId = 0;
                    tasks.forEach(task => {
                        if (task.id > maxId) maxId = task.id;
                    });
                    currentTaskId = maxId + 1;
                    saveTasksToLocalStorage();
                    renderTasks();
                    updateStatistics();
                    sessionStorage.removeItem('importedTasks');
                }
                confirmModal.style.display = 'none';
            };
            
        } catch (error) {
            alert('Error al importar el archivo: ' + error.message);
        }
        
        // Resetear el input file
        e.target.value = '';
    };
    
    reader.readAsText(file);
}

// Actualizar automáticamente las tareas cada minuto (para tiempos restantes)
setInterval(() => {
    renderTasks();
}, 60000);

// Función para deshacer archivado (recuperar tarea)
function unarchiveTask(taskId) {
    const index = tasks.findIndex(task => task.id === taskId);
    if (index !== -1) {
        tasks[index].archived = false;
        saveTasksToLocalStorage();
        renderTasks();
        updateStatistics();
    }
}

// Función para buscar tareas con fechas próximas a vencer
function checkDueTasks() {
    const now = new Date();
    const dueSoon = tasks.filter(task => {
        if (!task.dueDate || task.archived || task.status === 'terminada') return false;
        
        const dueDate = new Date(task.dueDate);
        const diffHours = (dueDate - now) / 3600000;
        
        // Tareas que vencen en menos de 24 horas
        return diffHours > 0 && diffHours < 24;
    });
    
    if (dueSoon.length > 0) {
        let message = `Tienes ${dueSoon.length} tarea${dueSoon.length > 1 ? 's' : ''} próxima${dueSoon.length > 1 ? 's' : ''} a vencer:\n`;
        dueSoon.forEach(task => {
            const timeRemaining = calculateTimeRemaining(task.dueDate).replace(/<[^>]*>/g, '');
            message += `- ${task.name} (${timeRemaining})\n`;
        });
        
        if (Notification.permission === 'granted') {
            new Notification('Tareas por vencer', { body: message });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Tareas por vencer', { body: message });
                }
            });
        }
    }
}

// Función para ver la nota de una tarea
function viewTaskNote(taskId, taskName) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;

    // Establecer el título y contenido
    document.getElementById('noteModalTitle').textContent = `Nota: ${taskName}`;
    document.getElementById('noteContent').textContent = task.notes || 'No hay notas disponibles';
    
    // Mostrar el modal
    document.getElementById('noteModal').style.display = 'block';
}

// Añadir estos eventos al inicio del archivo donde están los demás
document.querySelector('.close-note').addEventListener('click', () => {
    document.getElementById('noteModal').style.display = 'none';
});
document.getElementById('closeNoteBtn').addEventListener('click', () => {
    document.getElementById('noteModal').style.display = 'none';
});

// Verificar tareas próximas a vencer cada hora
setInterval(checkDueTasks, 3600000);

// Verificar tareas cuando se carga la página
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkDueTasks, 5000);
});