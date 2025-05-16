<template>
<div class="lista-asistencias">
    <h2>Mis Asistencias</h2>

    <div class="filtro">
        <label>DNI del Empleado:</label>
        <input type="number" v-model="dniBusqueda" placeholder="Ingrese DNI" />
        <button @click="buscarAsistencias">Buscar</button>
    </div>

    <div v-if="cargando" class="cargando">Cargando asistencias...</div>

    <div v-else-if="asistencias.length === 0" class="sin-resultados">
        No se encontraron asistencias para este empleado.
    </div>

    <table v-else class="tabla-asistencias">
        <thead>
            <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Hora Entrada</th>
                <th>Hora Salida</th>
                <th>Estado</th>
                <th>Horas Extras</th>
                <th>Estado Horas Extras</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="asistencia in asistencias" :key="asistencia.id">
                <td>{{ asistencia.id }}</td>
                <td>{{ formatearFecha(asistencia.fecha) }}</td>
                <td>{{ asistencia.horaEntrada }}</td>
                <td>{{ asistencia.horaSalida }}</td>
                <td>{{ asistencia.estado }}</td>
                <td>{{ asistencia.horasExtras || 'N/A' }}</td>
                <td>{{ asistencia.estadoHorasExtras || 'N/A' }}</td>
                <td>
                    <button @click="editarAsistencia(asistencia)" class="btn-editar">Editar</button>
                    <button v-if="!asistencia.horasExtras" @click="solicitarHorasExtras(asistencia)" class="btn-solicitar">
                        Solicitar Horas Extras
                    </button>
                </td>
            </tr>
        </tbody>
    </table>

    <!-- Modal para editar asistencia -->
    <div v-if="mostrarModal" class="modal">
        <div class="modal-contenido">
            <h3>Editar Asistencia</h3>

            <div class="form-group">
                <label>Estado:</label>
                <select v-model="asistenciaEditando.estado">
                    <option value="PRESENTE">Presente</option>
                    <option value="AUSENTE">Ausente</option>
                    <option value="TARDANZA">Tardanza</option>
                </select>
            </div>

            <div class="form-group">
                <label>Hora Entrada:</label>
                <input type="time" v-model="asistenciaEditando.horaEntrada" />
            </div>

            <div class="form-group">
                <label>Hora Salida:</label>
                <input type="time" v-model="asistenciaEditando.horaSalida" />
            </div>

            <div class="form-group">
                <label>Observaciones:</label>
                <textarea v-model="asistenciaEditando.observaciones"></textarea>
            </div>

            <div class="botones-modal">
                <button @click="guardarEdicion" class="btn-guardar">Guardar</button>
                <button @click="mostrarModal = false" class="btn-cancelar">Cancelar</button>
            </div>
        </div>
    </div>

    <!-- Modal para solicitar horas extras -->
    <div v-if="mostrarModalHorasExtras" class="modal">
        <div class="modal-contenido">
            <h3>Solicitar Horas Extras</h3>

            <div class="form-group">
                <label>Horas Extras:</label>
                <input type="number" step="0.5" v-model="horasExtras.horasExtras" />
            </div>

            <div class="form-group">
                <label>Motivo:</label>
                <textarea v-model="horasExtras.motivo"></textarea>
            </div>

            <div class="botones-modal">
                <button @click="enviarSolicitudHorasExtras" class="btn-guardar">Enviar Solicitud</button>
                <button @click="mostrarModalHorasExtras = false" class="btn-cancelar">Cancelar</button>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import axios from "axios";
import config from "@/config";

export default {
    name: 'ListaAsistencias',
    data() {
        return {
            dniBusqueda: '',
            asistencias: [],
            cargando: false,
            mostrarModal: false,
            mostrarModalHorasExtras: false,
            asistenciaEditando: null,
            horasExtras: {
                horasExtras: 0,
                motivo: ''
            },
            asistenciaSeleccionada: null
        };
    },
    methods: {
        async buscarAsistencias() {
            if (!this.dniBusqueda) {
                alert('Por favor ingrese un DNI');
                return;
            }

            this.cargando = true;
            try {
                const response = await axios.get(
                    `${config.BASE_URL}/api/asistencia/empleado/${this.dniBusqueda}`, {
                        withCredentials: true
                    } // ⬅️ importante
                );
                this.asistencias = response.data;
            } catch (error) {
                console.error('Error al obtener asistencias:', error);
                alert('No se pudieron cargar las asistencias');
            } finally {
                this.cargando = false;
            }
        },

        formatearFecha(fecha) {
            if (!fecha) return 'N/A';
            return new Date(fecha).toLocaleDateString();
        },

        editarAsistencia(asistencia) {
            this.asistenciaEditando = {
                ...asistencia
            };
            this.mostrarModal = true;
        },

        async guardarEdicion() {
            try {
                await axios.put(
                    `${config.BASE_URL}/api/asistencia/${this.asistenciaEditando.id}`,
                    this.asistenciaEditando, {
                        withCredentials: true
                    } // ⬅️ también aquí
                );
                alert('Asistencia actualizada correctamente');
                this.mostrarModal = false;
                this.buscarAsistencias();
            } catch (error) {
                console.error('Error al actualizar asistencia:', error);
                alert('No se pudo actualizar la asistencia');
            }
        },

        solicitarHorasExtras(asistencia) {
            this.asistenciaSeleccionada = asistencia;
            this.horasExtras = {
                horasExtras: 0,
                motivo: ''
            };
            this.mostrarModalHorasExtras = true;
        },

        async guardarEdicion() {
            try {
                await axios.put(
                    `${config.BASE_URL}/api/asistencia/${this.asistenciaEditando.id}`,
                    this.asistenciaEditando, {
                        withCredentials: true
                    } 
                );
                alert('Asistencia actualizada correctamente');
                this.mostrarModal = false;
                this.buscarAsistencias();
            } catch (error) {
                console.error('Error al actualizar asistencia:', error);
                alert('No se pudo actualizar la asistencia');
            }
        },

    }
};
</script>

<style scoped>
.lista-asistencias {
    padding: 20px;
}

.filtro {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.tabla-asistencias {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.tabla-asistencias th,
.tabla-asistencias td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
}

.tabla-asistencias th {
    background-color: #f2f2f2;
}

.btn-editar,
.btn-solicitar {
    margin: 0 5px;
    padding: 5px 10px;
    border: none;
    border-radius: 3px;
    cursor: pointer;
}

.btn-editar {
    background-color: #4285F4;
    color: white;
}

.btn-solicitar {
    background-color: #FBBC05;
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

.botones-modal {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.btn-guardar {
    background-color: #4CAF50;
    color: white;
}

.btn-cancelar {
    background-color: #f44336;
    color: white;
}

.cargando,
.sin-resultados {
    text-align: center;
    margin-top: 20px;
    font-style: italic;
}
</style>
