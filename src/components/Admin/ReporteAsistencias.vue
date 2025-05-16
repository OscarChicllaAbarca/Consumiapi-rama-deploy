<template>
<div class="reporte-asistencias">
    <h2>Reporte de Asistencias y Horas Extras</h2>

    <div class="filtros">
        <div class="filtro-grupo">
            <label>Estado de Horas Extras:</label>
            <select v-model="filtroEstado">
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
            </select>
        </div>

        <div class="filtro-grupo">
            <label>DNI del Empleado:</label>
            <input type="number" v-model="filtroDni" placeholder="Filtrar por DNI" />
        </div>

        <button @click="buscarAsistencias" class="btn-buscar">Buscar</button>
    </div>

    <div v-if="cargando" class="cargando">Cargando reportes...</div>

    <div v-else-if="asistencias.length === 0" class="sin-resultados">
        No se encontraron asistencias con los filtros seleccionados.
    </div>

    <table v-else class="tabla-asistencias">
        <thead>
            <tr>
                <th>ID</th>
                <th>Empleado</th>
                <th>Fecha</th>
                <th>Hora Entrada</th>
                <th>Hora Salida</th>
                <th>Estado</th>
                <th>Horas Extras</th>
                <th>Estado HE</th>
                <th>Aprobador</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="asistencia in asistencias" :key="asistencia.id">
                <td>{{ asistencia.id }}</td>
                <td>{{ asistencia.nombreEmpleado || asistencia.dniEmpleado }}</td>
                <td>{{ formatearFecha(asistencia.fecha) }}</td>
                <td>{{ asistencia.horaEntrada }}</td>
                <td>{{ asistencia.horaSalida }}</td>
                <td>{{ asistencia.estado }}</td>
                <td>{{ asistencia.horasExtras || 'N/A' }}</td>
                <td>{{ asistencia.estadoHorasExtras || 'N/A' }}</td>
                <td>{{ asistencia.nombreAprobador || asistencia.dniAprobador || 'N/A' }}</td>
            </tr>
        </tbody>
    </table>
</div>
</template>

<script>
import axios from 'axios';
import config from "@/config";
export default {
    name: 'ReporteAsistencias',
    data() {
        return {
            asistencias: [],
            cargando: false,
            filtroEstado: '',
            filtroDni: ''
        };
    },
    methods: {
        async buscarAsistencias() {
            this.cargando = true;

            try {
                let url;

                if (this.filtroDni) {
                    url = `${config.BASE_URL}/api/asistencia/empleado/${this.filtroDni}`;
                } else if (this.filtroEstado) {
                    url = `${config.BASE_URL}/api/asistencia/horas-extras/estado/${this.filtroEstado}`;
                } else {
                    url = `${config.BASE_URL}/api/asistencia/horas-extras/pendientes`;
                }

                const response = await axios.get(url, {
                    withCredentials: true // ✅ esto es clave
                });

                this.asistencias = response.data;
            } catch (error) {
                console.error('Error al cargar asistencias:', error);
                alert('Error al cargar las asistencias');
            } finally {
                this.cargando = false;
            }
        },

        formatearFecha(fecha) {
            if (!fecha) return 'N/A';
            return new Date(fecha).toLocaleDateString();
        }
    },
    mounted() {
        // Cargar asistencias pendientes al iniciar
        this.buscarAsistencias();
    }
};
</script>

<style scoped>
.reporte-asistencias {
    padding: 20px;
}

.filtros {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: flex-end;
}

.filtro-grupo {
    display: flex;
    flex-direction: column;
    min-width: 200px;
}

label {
    font-weight: bold;
    margin-bottom: 5px;
}

select,
input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.btn-buscar {
    background-color: #4285F4;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    height: 36px;
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

.cargando,
.sin-resultados {
    text-align: center;
    margin-top: 20px;
    font-style: italic;
}
</style>
