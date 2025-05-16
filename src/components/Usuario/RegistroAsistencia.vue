<template>
<div class="container" :class="{ 'time-expired': tiempoRestante <= 0 }">
    <!-- Título y fecha con animación -->
    <div class="header">
        <h1 class="animate-title">GESTIÓN DE ASISTENCIA</h1>
        <div class="date-selector">
            <span class="date-label">Fecha:</span>
            <input type="date" v-model="fechaSeleccionada" @change="cargarAsistencias" class="date-input" />
        </div>
        <div class="timer" v-if="tiempoRestante > 0">
            <span>Tiempo restante para registrar: </span>
            <span class="countdown">{{ tiempoFormateado }}</span>
        </div>
        <div v-else class="timer tiempo-finalizado">
            <span>Registro de asistencia finalizado</span>
            <span class="lock-icon">🔒</span>
        </div>
    </div>

    <!-- Filtros con diseño mejorado -->
    <div class="search-panel">
        <div class="search-inputs">
            <div class="input-group">
                <i class="icon">🔍</i>
                <input type="text" v-model="filtroDNI" placeholder="Filtrar por DNI" class="search-input" />
            </div>
            <div class="input-group">
                <i class="icon">👤</i>
                <input type="text" v-model="filtroNombre" placeholder="Filtrar por Nombre" class="search-input" />
            </div>
            <div class="input-group">
                <i class="icon">🏢</i>
                <input type="text" v-model="filtroArea" placeholder="Filtrar por Área" class="search-input" />
            </div>
            <div class="input-group">
                <i class="icon">🔄</i>
                <select v-model="ordenamiento" class="search-select">
                    <option value="">Ordenar por...</option>
                    <option value="dni">DNI</option>
                    <option value="nombre">Nombre</option>
                    <option value="departamento">Departamento</option>
                </select>
            </div>
        </div>
    </div>

    <!-- Tabla con efectos hover mejorados -->
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th @click="ordenarPor('dni')">DNI <span class="sort-icon">⇅</span></th>
                    <th @click="ordenarPor('nombre')">Nombre <span class="sort-icon">⇅</span></th>
                    <th @click="ordenarPor('apellidoPaterno')">Apellido Paterno <span class="sort-icon">⇅</span></th>
                    <th @click="ordenarPor('apellidoMaterno')">Apellido Materno <span class="sort-icon">⇅</span></th>
                    <th @click="ordenarPor('departamento')">Departamento <span class="sort-icon">⇅</span></th>
                    <th @click="ordenarPor('area')">Área <span class="sort-icon">⇅</span></th>
                    <th @click="ordenarPor('sucursal')">Sucursal <span class="sort-icon">⇅</span></th>
                    <th>Estado</th>
                    <th>Observaciones</th>
                    <th>Asistió</th>
                    <th>No Asistió</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="user in usuariosFiltradosYOrdenados" :key="user.dni" class="user-row">
                    <td>{{ user.dni }}</td>
                    <td>{{ user.nombre }}</td>
                    <td>{{ user.apellidoPaterno }}</td>
                    <td>{{ user.apellidoMaterno }}</td>
                    <td>{{ user.departamento }}</td>
                    <td>{{ user.area }}</td>
                    <td>{{ user.sucursal }}</td>
                    <td>
                        <span :class="getEstadoClass(user)">{{ user.estado || 'Sin registrar' }}</span>
                    </td>
                    <td>
                        <select v-model="user.observaciones" class="custom-select" :disabled="!user.editable">
                            <option value="Actividad normal">Actividad normal</option>
                            <option value="Permiso">Permiso</option>
                            <option value="Descanso médico">Descanso médico</option>
                            <option value="Suspensión temporal">Suspensión temporal</option>
                            <option value="Remoto">Remoto</option>
                        </select>
                    </td>
                    <td>
                        <div class="checkbox-container" :class="{ disabled: !user.editable }">
                            <div class="checkbox-icon" :class="{ checked: user.asistio }" @click="toggleAsistencia(user, 'PRESENTE')">
                                <span v-if="user.asistio" class="check-animation">✔️</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="checkbox-container" :class="{ disabled: !user.editable }">
                            <div class="checkbox-icon" :class="{ checked: user.noAsistio }" @click="toggleAsistencia(user, 'AUSENTE')">
                                <span v-if="user.noAsistio" class="cross-animation">❌</span>
                            </div>
                        </div>
                    </td>
                </tr>
                <tr v-if="usuariosFiltradosYOrdenados.length === 0">
                    <td colspan="11" class="no-results">No se encontraron resultados</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Botón para guardar con efecto pulsante -->
    <div class="actions">
        <button @click="guardarAsistencia" class="pulse-button">
            <span class="button-icon">💾</span> Guardar Asistencia
        </button>
    </div>

    <!-- Notificación con animación mejorada -->
    <transition name="slide-fade">
        <div v-if="showNotification" class="notification" :class="notificationType">
            <div class="notification-content">
                <span class="notification-icon">{{ notificationType === 'success' ? '✅' : '❌' }}</span>
                <span>{{ notificationMessage }}</span>
            </div>
        </div>
    </transition>
</div>
</template>

<script>
import axios from 'axios';
import config from "@/config";

export default {
    data() {
        return {
            users: [],
            fechaActual: new Date().toISOString().split('T')[0],
            fechaSeleccionada: new Date().toISOString().split('T')[0],
            showNotification: false,
            notificationMessage: '',
            notificationType: 'success',
            filtroDNI: '',
            filtroArea: '',
            filtroNombre: '',
            ordenamiento: '',
            tiempoRestante: 0,
            intervalo: null,
            columnaOrdenada: '',
            ordenAscendente: true,
            dniSupervisor: null // DNI del supervisor actual (debería obtenerse del sistema de autenticación)
        };
    },
    computed: {
        usuariosFiltradosYOrdenados() {
            let usuarios = this.users.filter(user => {
                const dni = String(user.dni);
                const nombre = (user.nombre || '').toLowerCase();
                const area = (user.area || '').toLowerCase();
                return (
                    dni.includes(this.filtroDNI) &&
                    nombre.includes(this.filtroNombre.toLowerCase()) &&
                    area.includes(this.filtroArea.toLowerCase())
                );
            });

            if (this.ordenamiento) {
                const direction = this.ordenAscendente ? 1 : -1;
                usuarios.sort((a, b) => {
                    const valueA = (a[this.ordenamiento] || '').toString().toLowerCase();
                    const valueB = (b[this.ordenamiento] || '').toString().toLowerCase();
                    return valueA > valueB ? direction : -direction;
                });
            }

            return usuarios;
        },
        tiempoFormateado() {
            const minutos = Math.floor(this.tiempoRestante / 60);
            const segundos = this.tiempoRestante % 60;
            return `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
        }
    },
    created() {
        this.obtenerUsuarios();
        this.iniciarCronometro();
        // Obtener el DNI del supervisor del sistema de autenticación o configuración
        this.obtenerDniSupervisor();
    },
    beforeUnmount() {
        if (this.intervalo) {
            clearInterval(this.intervalo);
        }
    },
    methods: {
        getEstadoClass(user) {
            if (!user.estado) return 'estado-pendiente';
            return user.estado === 'PRESENTE' ? 'estado-presente' : 'estado-ausente';
        },
        cargarAsistencias() {
            this.obtenerUsuarios();
        },
        async obtenerDniSupervisor() {
            // Esta función debería obtener el DNI del supervisor autenticado
            // Por ahora, asignamos un valor por defecto (deberías reemplazarlo con tu lógica de autenticación)
            try {
                // Ejemplo: Obtener del localStorage o de la sesión actual
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const parsedInfo = JSON.parse(userInfo);
                    this.dniSupervisor = parsedInfo.dni;
                } else {
                    // Valor por defecto para pruebas
                    this.dniSupervisor = 12345678;
                }
            } catch (error) {
                console.error('Error al obtener DNI del supervisor:', error);
                // Valor por defecto para pruebas
                this.dniSupervisor = 12345678;
            }
        },
        async obtenerUsuarios() {
            try {
                const usersResponse = await axios.get(`${config.BASE_URL}/api/user`, {
                    withCredentials: true
                });

                this.users = await Promise.all(usersResponse.data.map(async user => {
                    try {
                        // Usar el nuevo endpoint del controlador para obtener asistencias por empleado y fecha
                        const asistenciasResponse = await axios.get(
                            `${config.BASE_URL}/api/asistencia/empleado/${user.dni}/fecha/${this.fechaSeleccionada}`, {
                                withCredentials: true
                            }
                        );

                        const asistencia = asistenciasResponse.data[0]; // Tomamos la primera asistencia encontrada

                        return {
                            ...user,
                            asistio: asistencia && asistencia.estado === 'PRESENTE',
                            noAsistio: asistencia && asistencia.estado === 'AUSENTE',
                            estado: asistencia ? asistencia.estado : null,
                            observaciones: asistencia ? asistencia.observaciones : 'Actividad normal',
                            editable: this.fechaSeleccionada === this.fechaActual,
                            idAsistencia: asistencia ? asistencia.id : null // Guardamos el ID para ediciones
                        };
                    } catch (error) {
                        console.error(`Error al obtener la asistencia del usuario ${user.dni}:`, error);
                        return {
                            ...user,
                            asistio: false,
                            noAsistio: false,
                            estado: null,
                            observaciones: 'Actividad normal',
                            editable: this.fechaSeleccionada === this.fechaActual,
                            idAsistencia: null
                        };
                    }
                }));

                this.mostrarNotificacion('Usuarios cargados correctamente', 'success');
            } catch (error) {
                console.error('Error al obtener los usuarios:', error);
                this.mostrarNotificacion('Error al cargar los usuarios', 'error');
            }
        },
        iniciarCronometro() {
            const ahora = new Date();

            // Convertir hora del sistema a UTC-5 (Perú)
            const offsetPeru = -5 * 60;
            const horaPeru = new Date(ahora.getTime() + offsetPeru * 60 * 1000);

            // Definir hora de inicio y fin en Perú
            const horaInicio = new Date(horaPeru);
            horaInicio.setHours(8, 30, 0, 0);

            const horaFin = new Date(horaPeru);
            horaFin.setHours(9, 30, 0, 0);

            if (horaPeru < horaInicio || horaPeru >= horaFin) {
                this.tiempoRestante = 0;
                return;
            }

            this.tiempoRestante = Math.floor((horaFin - horaPeru) / 1000);

            this.intervalo = setInterval(() => {
                const ahora = new Date();
                const horaPeru = new Date(ahora.getTime() + offsetPeru * 60 * 1000);

                this.tiempoRestante = Math.floor((horaFin - horaPeru) / 1000);

                if (this.tiempoRestante <= 0) {
                    clearInterval(this.intervalo);
                    this.tiempoRestante = 0;
                }
            }, 1000);
        },
        async toggleAsistencia(user, estado) {
            // Verificar si el tiempo ha expirado
            if (this.tiempoRestante <= 0) {
                this.mostrarNotificacion('El tiempo para registrar asistencia ha finalizado', 'error');
                return;
            }

            if (!user.editable) {
                this.mostrarNotificacion('No se puede editar la asistencia de días pasados', 'error');
                return;
            }

            if (!user.observaciones) {
                this.mostrarNotificacion('Debe seleccionar una observación antes de marcar asistencia', 'error');
                return;
            }

            // Resto del método permanece igual...
            if (estado === 'PRESENTE') {
                user.asistio = !user.asistio;
                user.noAsistio = false;
                user.estado = user.asistio ? 'PRESENTE' : null;
            } else if (estado === 'AUSENTE') {
                user.noAsistio = !user.noAsistio;
                user.asistio = false;
                user.estado = user.noAsistio ? 'AUSENTE' : null;
            }

            try {
                await this.registrarAsistencia(user);
            } catch (error) {
                // Revertir cambios en caso de error
                if (estado === 'PRESENTE') {
                    user.asistio = !user.asistio;
                    user.estado = user.asistio ? 'PRESENTE' : null;
                } else if (estado === 'AUSENTE') {
                    user.noAsistio = !user.noAsistio;
                    user.estado = user.noAsistio ? 'AUSENTE' : null;
                }
            }
        },
        async registrarAsistencia(user) {
            try {
                // Preparamos los datos para el endpoint según la estructura del controlador
                const horaActual = new Date().toISOString().split('T')[1].split('.')[0]; // Formato HH:MM:SS
                const data = {
                    dniEmpleado: user.dni,
                    dniSupervisor: this.dniSupervisor,
                    estado: user.estado,
                    horaEntrada: user.estado === 'PRESENTE' ? horaActual : null,
                    horaSalida: null, // La hora de salida podría completarse en otro momento
                    observaciones: user.observaciones
                };

                let response;

                if (user.idAsistencia) {
                    // Si ya existe un registro, lo editamos
                    response = await axios.put(
                        `${config.BASE_URL}/api/asistencia/${user.idAsistencia}`,
                        data, {
                            withCredentials: true
                        }
                    );
                } else {
                    // Si no existe, creamos uno nuevo
                    response = await axios.post(
                        `${config.BASE_URL}/api/asistencia/registrar`,
                        data, {
                            withCredentials: true
                        }
                    );
                    // Guardamos el ID para futuras ediciones
                    if (response.data && response.data.id) {
                        user.idAsistencia = response.data.id;
                    }
                }

                this.mostrarNotificacion('Asistencia registrada correctamente', 'success');
                return response.data;
            } catch (error) {
                console.error('Error al registrar la asistencia:', error);
                this.mostrarNotificacion('Error al registrar la asistencia', 'error');
                throw error;
            }
        },
        async guardarAsistencia() {
            // Verificar si el tiempo ha expirado
            if (this.tiempoRestante <= 0) {
                this.mostrarNotificacion('El tiempo para registrar asistencia ha finalizado', 'error');
                return;
            }

            try {
                const usuariosSinMarcar = this.users.filter(user =>
                    user.editable && !user.asistio && !user.noAsistio
                );

                if (usuariosSinMarcar.length > 0) {
                    if (confirm(`Hay ${usuariosSinMarcar.length} usuarios sin marcar asistencia. ¿Desea continuar?`)) {
                        this.mostrarNotificacion('Asistencia guardada correctamente', 'success');
                    }
                } else {
                    this.mostrarNotificacion('Asistencia guardada correctamente', 'success');
                }
            } catch (error) {
                console.error('Error al guardar la asistencia:', error);
                this.mostrarNotificacion('Error al guardar la asistencia', 'error');
            }
        },
        ordenarPor(columna) {
            if (this.ordenamiento === columna) {
                this.ordenAscendente = !this.ordenAscendente;
            } else {
                this.ordenamiento = columna;
                this.ordenAscendente = true;
            }
        },
        mostrarNotificacion(mensaje, tipo) {
            this.notificationMessage = mensaje;
            this.notificationType = tipo;
            this.showNotification = true;

            setTimeout(() => {
                this.showNotification = false;
            }, 3000);
        },
        // Métodos para manejar horas extras (nuevos según el controlador)
        async registrarHorasExtras(idAsistencia, horasExtras, motivo) {
            try {
                const response = await axios.post(
                    `${config.BASE_URL}/api/asistencia/${idAsistencia}/horas-extras`, {
                        horasExtras,
                        motivo
                    }, {
                        withCredentials: true
                    }
                );

                this.mostrarNotificacion('Horas extras registradas correctamente', 'success');
                return response.data;
            } catch (error) {
                console.error('Error al registrar horas extras:', error);
                this.mostrarNotificacion('Error al registrar horas extras', 'error');
                throw error;
            }
        },

    }
};
</script>

<style scoped>
/* Estilos base modernizados */
.container {
    padding: 20px;
    font-family: 'Nunito', 'Helvetica', Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    background-color: #f8f9fa;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    animation: fadeIn 0.5s ease-in-out;
}

/* Animación de entrada del contenedor */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Header con animación */
.header {
    text-align: center;
    margin-bottom: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #0c534c, #0c534c);
    border-radius: 10px;
    color: white;
    box-shadow: 0 4px 12px rgba(33, 147, 176, 0.3);
}

.animate-title {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 15px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    animation: pulseTitle 2s infinite alternate;
    letter-spacing: 1px;
}

@keyframes pulseTitle {
    from {
        transform: scale(1);
    }

    to {
        transform: scale(1.05);
    }
}

/* Selector de fecha estilizado */
.date-selector {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 15px 0;
}

.date-label {
    font-size: 18px;
    margin-right: 10px;
    font-weight: 600;
}

.date-input {
    padding: 10px 15px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    background-color: rgba(255, 255, 255, 0.9);
    color: #333;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.date-input:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
}

/* Cronómetro animado */
.timer {
    margin-top: 15px;
    font-size: 18px;
    font-weight: 500;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 8px 15px;
    border-radius: 30px;
    display: inline-block;
}

.countdown {
    font-weight: 700;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 5px 10px;
    border-radius: 5px;
    margin-left: 5px;
    animation: pulse 1s infinite alternate;
}

@keyframes pulse {
    from {
        opacity: 0.7;
    }

    to {
        opacity: 1;
    }
}

.tiempo-finalizado {
    background-color: rgba(220, 53, 69, 0.2);
    color: #fff;
}

/* Panel de búsqueda mejorado */
.search-panel {
    margin-bottom: 25px;
    background-color: white;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.search-panel:hover {
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.search-inputs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.input-group {
    position: relative;
    flex: 1;
    min-width: 200px;
}

.icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 16px;
    color: #6c757d;
}

.search-input,
.search-select {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 15px;
    transition: all 0.3s ease;
    background-color: #f8f9fa;
}

.search-input:focus,
.search-select:focus {
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(33, 147, 176, 0.2);
    outline: none;
    background-color: white;
}

/* Tabla mejorada con efectos */
.table-container {
    overflow-x: auto;
    margin-bottom: 25px;
    border-radius: 10px;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
}

table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background-color: white;
    overflow: hidden;
}

th,
td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

th {
    background-color: #0c534c;
    color: white;
    font-weight: 600;
    font-size: 15px;
    position: sticky;
    top: 0;
    cursor: pointer;
    transition: background-color 0.3s;
}

th:hover {
    background-color: #1a7b92;
}

.sort-icon {
    margin-left: 5px;
    font-size: 12px;
    opacity: 0.7;
}

tr:last-child td {
    border-bottom: none;
}

.user-row {
    transition: all 0.3s ease;
}

.user-row:hover {
    background-color: #f0f7fa;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    z-index: 1;
    position: relative;
}

.no-results {
    text-align: center;
    padding: 20px;
    font-style: italic;
    color: #6c757d;
}

/* Estado de asistencia */
.estado-presente {
    color: #198754;
    font-weight: 600;
    background-color: rgba(25, 135, 84, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
}

.estado-ausente {
    color: #dc3545;
    font-weight: 600;
    background-color: rgba(220, 53, 69, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
}

.estado-pendiente {
    color: #6c757d;
    font-style: italic;
}

/* Select personalizado */
.custom-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background-color: white;
    font-size: 14px;
    color: #333;
    transition: all 0.3s ease;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230c534c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 16px;
}

.custom-select:focus {
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(33, 147, 176, 0.2);
    outline: none;
}

.custom-select:disabled {
    background-color: #f0f0f0;
    color: #999;
    cursor: not-allowed;
}

/* Checkboxes animados */
.checkbox-container {
    display: flex;
    justify-content: center;
}

.checkbox-container.disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.checkbox-icon {
    width: 30px;
    height: 30px;
    border: 2px solid #0c534c;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    background-color: white;
}

.checkbox-icon:hover {
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(33, 147, 176, 0.3);
}

.checkbox-icon.checked {
    background-color: #0c534c;
    border-color: #0c534c;
}

.check-animation {
    animation: zoomIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

/* Agrega al final de tus estilos */
.time-expired .checkbox-icon,
.time-expired .custom-select,
.time-expired .pulse-button {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.time-expired .checkbox-icon {
    border-color: #ccc;
    background-color: #f5f5f5;
}

.time-expired .custom-select {
    background-color: #f5f5f5;
    border-color: #ddd;
}

.time-expired .pulse-button {
    background-color: #6c757d !important;
    animation: none !important;
    transform: none !important;
}

.tiempo-finalizado {
  background-color: rgba(220, 53, 69, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.lock-icon {
  font-size: 18px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-3px); }
  40%, 80% { transform: translateX(3px); }
}
</style>
