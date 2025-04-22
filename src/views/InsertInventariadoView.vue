<template>
<div class="container">
    <h2>Formulario de Inventario</h2>

    <!-- Formulario -->
    <form @submit.prevent="submitForm">
        <!-- Subir archivo Excel -->
        <div class="form-group">
            <label for="file">Cargar Archivo Excel:</label>
            <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" class="form-control" />
        </div>

        <!-- Fechas en una sola fila -->
        <div class="form-group d-flex justify-content-between">
            <!-- Fecha de carga (no modificable) -->
            <div class="mr-2" style="flex: 1;">
                <label for="fechaCarga">Fecha de Carga:</label>
                <input type="text" v-model="fechaCarga" class="form-control" readonly />
            </div>
            <!-- Fecha de finalización de toma -->
            <div style="flex: 1;">
                <label for="fechaFinalizacion">Fecha de Finalización de Toma:</label>
                <input type="text" v-model="fechaFinalizacion" class="form-control" readonly />
            </div>
        </div>

        <!-- Tipo de inventario -->
        <div class="form-group">
            <label for="tipoInventario">Tipo de Inventario:</label>
            <select v-model="tipoInventario" class="form-control" @change="generateCodigo">
                <option value="" disabled>Seleccione el tipo</option>
                <option value="CICL">CICLICO</option>
                <option value="TURN">TURNO</option>
                <option value="GEN">INOPINADO</option>
                <option value="CONT">CONTABLE</option>
            </select>
        </div>

        <!-- Semana de inventariado -->
        <div class="form-group">
            <label for="semanaInventariado">Semana de Inventariado:</label>
            <!-- Campo de entrada para la semana de inventariado, que se llena automáticamente -->
            <input type="number" v-model="semanaInventariado" class="form-control" placeholder="Semana de inventariado" @input="validateSemana; generateCodigo" readonly />
            <small v-if="errorSemana" class="text-danger">{{ errorSemana }}</small>
        </div>

        <!-- Número de inventario -->
        <div class="form-group">
            <label for="numeroInventario">Número de Inventario:</label>
            <input type="number" v-model="numeroInventario" class="form-control" placeholder="Número de inventario" @input="generateCodigo" />
        </div>

        <!-- Código de inventariado -->
        <div class="form-group">
            <label for="codigoInventariado">Código de Inventariado:</label>
            <input type="text" v-model="codigoInventariado" class="form-control" placeholder="Código de inventariado" readonly />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="errorSemana">Enviar</button>
    </form>

    <!-- Tabla para mostrar los datos del archivo Excel -->
    <div v-if="excelData.length" class="mt-4">
        <h3>Datos Cargados</h3>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th v-for="(header, index) in excelData[0]" :key="index">{{ header }}</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Limitar a las primeras 10 filas -->
                    <tr v-for="(row, rowIndex) in excelData.slice(1, 11)" :key="rowIndex">
                        <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

</div>
</template>

<script>
import * as XLSX from "xlsx";
import axios from 'axios';
import {
    show_alerta
} from "@/funciones";
import config from '../config';
export default {
    data() {
        return {
            tipoInventario: '',
            semanaInventariado: '',
            numeroInventario: '',
            codigoInventariado: '',
            excelData: [],
            semanaInventariado: null,
            errorSemana: null,
            file: null,
            fechaCarga: this.getCurrentDateTime(), // Fecha de carga
            fechaFinalizacion: ' ', // Fecha de finalización de toma
        };
    },
    mounted() {
        this.establecerFechas();
        this.semanaInventariado = this.getWeekNumber(new Date());
    },
    methods: {
        handleFileUpload(event) {
            const file = event.target.files[0]; // Obtén el primer archivo seleccionado

            // Verifica si se ha seleccionado un archivo
            if (!file) {
                console.error("No se ha seleccionado ningún archivo.");
                alert("Por favor, selecciona un archivo.");
                return; // Termina la función si no hay archivo
            }

            // Verifica que el archivo sea de tipo Blob (lo es si es un archivo)
            if (!(file instanceof Blob)) {
                console.error("El archivo no es un Blob.");
                alert("Por favor, selecciona un archivo válido.");
                return; // Termina la función si el archivo no es válido
            }

            // Verifica el tipo de archivo (opcional)
            const validFileTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!validFileTypes.includes(file.type)) {
                console.error("Tipo de archivo no válido.");
                alert("Por favor, selecciona un archivo de Excel válido.");
                return; // Termina la función si el tipo no es válido
            }

            // Si todas las verificaciones son correctas, continúa
            this.file = file; // Guarda el archivo en data
            const reader = new FileReader();

            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {
                    type: "array"
                });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                this.excelData = XLSX.utils.sheet_to_json(sheet, {
                    header: 1
                });
            };

            // Lee el archivo como ArrayBuffer
            reader.readAsArrayBuffer(file);
        },
        getCurrentDateTime() {
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        },
        establecerFechas() {
            const fechaCargaDate = new Date(this.fechaCarga); // Convierte la cadena de fecha a objeto Date

            // Calcula la fecha de finalización sumando 7 días
            const fechaFinalizacionDate = new Date(fechaCargaDate);
            fechaFinalizacionDate.setDate(fechaCargaDate.getDate() + 7);
            this.fechaFinalizacion = this.formatearFecha(fechaFinalizacionDate); // Formatea la fecha de finalización
        },
        formatearFecha(fecha) {
            if (!(fecha instanceof Date) || isNaN(fecha)) {
                console.error('Fecha inválida:', fecha);
                return '';
            }

            const year = fecha.getFullYear();
            const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
            const day = fecha.getDate().toString().padStart(2, '0');
            const hours = fecha.getHours().toString().padStart(2, '0');
            const minutes = fecha.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        },

        generateCodigo() {
            if (this.tipoInventario && this.semanaInventariado && this.numeroInventario) {
                const year = new Date().getFullYear(); // Obtener el año actual
                // Generar el código de inventariado con el año, semana y número de inventario
                this.codigoInventariado = `INV${this.tipoInventario}${year}${this.semanaInventariado}${this.numeroInventario}`;
            } else {
                this.codigoInventariado = '';
            }
        },
        async submitForm() {
    if (this.botonPresionado) return;
    this.botonPresionado = true;

    try {
        if (!this.errorSemana) {
            // 🔹 Crear FormData para el archivo
            const formData = new FormData();
            formData.append("file", this.file);

            // 🔹 Enviar solicitud con credenciales
            const response = await axios.post(
                `${config.BASE_URL}/api/inventario/cargar`,
                formData,
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                        "Content-Type": "multipart/form-data",
                        "Fecha_Inventario": this.fechaCarga,
                        "Fecha_final": this.fechaFinalizacion,
                        "Usuario": this.username, // Se obtiene del backend con cookies
                        "Codigo_Inv": this.codigoInventariado,
                    },
                    withCredentials: true, // 🔹 Enviar cookies automáticamente
                }
            );

            console.log("Respuesta del servidor:", response.data);
            show_alerta("Archivo cargado correctamente");
            this.limpiarFormulario(); // 🔹 Limpiar formulario después del éxito
        }
    } catch (error) {
        if (error.response) {
            console.error("Error de respuesta del servidor:", error.response.data);
            console.error("Código de estado:", error.response.status);
            console.error("Encabezados:", error.response.headers);
        } else if (error.request) {
            console.error("Sin respuesta del servidor:", error.request);
        } else {
            console.error("Error al configurar la solicitud:", error.message);
        }
        console.error("Configuración del error:", error.config);
        show_alerta("Hubo un error al cargar el archivo");
    } finally {
        this.botonPresionado = false; // 🔹 Resetea el estado del botón
    }
},

        
        limpiarFormulario() {
            this.tipoInventario = '';
            this.semanaInventariado = '';
            this.numeroInventario = '';
            this.codigoInventariado = '';
            this.file = null;
            this.fechaCarga = this.getCurrentDateTime(); // Restablecer la fecha de carga actual
            this.fechaFinalizacion = ' ';
            this.errorSemana = null;
            this.excelData = [];
        },
        getWeekNumber(date) {
            if (!(date instanceof Date)) {
                throw new Error('Invalid date object');
            }
            
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date - firstDayOfYear) / 86400000;

            // Calcular la semana ISO
            return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        },
        validateSemana() {
            // Validación adicional, si es necesario
            if (this.semanaInventariado < 1 || this.semanaInventariado > 52) {
                this.errorSemana = "Número de semana inválido.";
            } else {
                this.errorSemana = null;
            }
        },
    },
};
</script>

<style scoped>
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.form-group {
    margin-bottom: 1.5rem;
}

.text-danger {
    color: red;
}

.table {
    margin-top: 1rem;
}
</style>
