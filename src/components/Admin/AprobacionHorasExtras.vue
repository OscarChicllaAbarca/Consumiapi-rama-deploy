<template>
<div class="aprobacion-horas-extras">
    <h2>Aprobación de Horas Extras</h2>

    <button @click="cargarSolicitudesPendientes" class="btn-cargar">
        Cargar Solicitudes Pendientes
    </button>

    <div v-if="cargando" class="cargando">Cargando solicitudes...</div>

    <div v-else-if="solicitudes.length === 0" class="sin-resultados">
        No hay solicitudes de horas extras pendientes.
    </div>

    <table v-else class="tabla-solicitudes">
        <thead>
            <tr>
                <th>ID</th>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Horas Extras</th>
                <th>Motivo</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="solicitud in solicitudes" :key="solicitud.id">
                <td>{{ solicitud.id }}</td>
                <td>{{ solicitud.nombreEmpleado || solicitud.dniEmpleado }}</td>
                <td>{{ formatearFecha(solicitud.fecha) }}</td>
                <td>{{ solicitud.horasExtras }}</td>
                <td>{{ solicitud.motivoHorasExtras || 'No especificado' }}</td>
                <td>
                    <button @click="aprobar(solicitud)" class="btn-aprobar">Aprobar</button>
                    <button @click="rechazar(solicitud)" class="btn-rechazar">Rechazar</button>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Modal para aprobación/rechazo -->
    <div v-if="mostrarModal" class="modal">
        <div class="modal-contenido">
            <h3>{{ accion === 'aprobar' ? 'Aprobar' : 'Rechazar' }} Horas Extras</h3>

            <div class="form-group">
                <label>DNI del Aprobador:</label>
                <input type="number" v-model="aprobacion.dniAprobador" />
            </div>

            <div class="form-group">
                <label>Justificación:</label>
                <textarea v-model="aprobacion.justificacion"></textarea>
            </div>

            <div class="botones-modal">
                <button @click="confirmarAccion" class="btn-confirmar">Confirmar</button>
                <button @click="mostrarModal = false" class="btn-cancelar">Cancelar</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import axios from 'axios';
import config from "@/config";
export default {
    name: 'AprobacionHorasExtras',
    data() {
        return {
            solicitudes: [],
            cargando: false,
            mostrarModal: false,
            accion: 'aprobar',
            solicitudSeleccionada: null,
            aprobacion: {
                idAsistencia: null,
                dniAprobador: null,
                estado: 'aprobado',
                justificacion: ''
            }
        };
    },
    methods: {
        async cargarSolicitudesPendientes() {
            this.cargando = true;
            try {
                const response = await axios.get(`${config.BASE_URL}/api/asistencia/horas-extras/pendientes`, {
                    withCredentials: true
                });

                this.solicitudes = response.data;
            } catch (error) {
                console.error('Error al cargar solicitudes pendientes:', error);
                alert('Error al cargar las solicitudes pendientes');
            } finally {
                this.cargando = false;
            }
        },

        formatearFecha(fecha) {
            if (!fecha) return 'N/A';
            return new Date(fecha).toLocaleDateString();
        },

        aprobar(solicitud) {
            this.solicitudSeleccionada = solicitud;
            this.accion = 'aprobar';
            this.aprobacion.idAsistencia = solicitud.id;
            this.aprobacion.estado = 'aprobado';
            this.aprobacion.justificacion = '';
            this.mostrarModal = true;
        },

        rechazar(solicitud) {
            this.solicitudSeleccionada = solicitud;
            this.accion = 'rechazar';
            this.aprobacion.idAsistencia = solicitud.id;
            this.aprobacion.estado = 'rechazado';
            this.aprobacion.justificacion = '';
            this.mostrarModal = true;
        },

        async confirmarAccion() {
            if (!this.aprobacion.dniAprobador) {
                alert('El DNI del aprobador es obligatorio');
                return;
            }

            try {
                await axios.put(`${config.BASE_URL}/api/asistencia/horas-extras/aprobar`, this.aprobacion, {
                    withCredentials: true
                });
                alert(`Solicitud ${this.accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
                this.mostrarModal = false;
                this.cargarSolicitudesPendientes(); // Refrescar la lista
            } catch (error) {
                console.error(`Error al ${this.accion} la solicitud:`, error);
                alert(`No se pudo ${this.accion} la solicitud`);
            }
        }
    },
    mounted() {
        this.cargarSolicitudesPendientes();
    }
};
</script>

<style scoped>
.aprobacion-horas-extras {
    padding: 20px;
}

.btn-cargar {
    margin-bottom: 20px;
    background-color: #4285F4;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.tabla-solicitudes {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.tabla-solicitudes th,
.tabla-solicitudes td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.tabla-solicitudes th {
    background-color: #f2f2f2;
}

.btn-aprobar,
.btn-rechazar {
    margin: 0 5px;
    padding: 5px 10px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

.btn-aprobar {
    background-color: #4CAF50;
    color: white;
}

.btn-rechazar {
    background-color: #f44336;
    color: white;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-contenido {
    background-color: white;
    padding: 20px;
    border-radius: 5px;
    width: 400px;
}

.form-group {
    margin-bottom: 15px;
}

label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

input,
textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

textarea {
    height: 100px;
}

.botones-modal {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.btn-confirmar {
    background-color: #4CAF50;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-cancelar {
    background-color: #f44336;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.cargando,
.sin-resultados {
    text-align: center;
    margin-top: 20px;
    font-style: italic;
}
</style>
