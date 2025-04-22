<template>
<div>
    <h1>Generar Observación</h1>
    <form @submit.prevent="submitForm">
        <div>
            <label for="producto">Producto:</label>
            <input type="text" id="producto" v-model="observacion.producto" required readonly />
        </div>

        <div>
            <label for="estado_pro">Estado:</label>
            <input type="text" id="estado_pro" v-model="observacion.estado_pro" readonly />
        </div>

        <div>
            <label for="descripcion_pro">Descripción:</label>
            <input type="text" id="descripcion_pro" v-model="observacion.descripcion_pro" required readonly />
        </div>
        <div>
            <label for="centro_pro">Centro:</label>
            <input type="text" id="centro_pro" v-model="observacion.centro_pro" readonly />
        </div>

        <div>
            <label for="lote_pro">Lote:</label>
            <input type="text" id="lote_pro" v-model="observacion.lote_pro" readonly />
        </div>

        <div>
            <label for="unidad_medida_pro">Unidad de Medida:</label>
            <input type="text" id="unidad_medida_pro" v-model="observacion.unidad_medida_pro" readonly />
        </div>

        <div>
            <label for="codigo_inventario_pro">Código de Inventario:</label>
            <input type="text" id="codigo_inventario_pro" v-model="observacion.codigo_inventario_pro" required readonly />
        </div>

        <div>
            <label for="diferencia_pro">Diferencia:</label>
            <input type="number" id="diferencia_pro" v-model="observacion.diferencia_pro" readonly />
        </div>

        <div>
            <label for="categoria_obsv">Categoría:</label>
            <select id="categoria_obsv" v-model="observacion.categoria_obsv" class="combo-box">
                <option disabled value="">Selecciona una categoría</option>
                <option v-for="categoria in categorias" :key="categoria" :value="categoria">
                    {{ categoria }}
                </option>
            </select>
        </div>

        <div>
            <label for="observacion_obsv">Observación:</label>
            <textarea id="observacion_obsv" v-model="observacion.observacion_obsv"></textarea>
        </div>

        <button type="submit">Guardar Observación</button>
    </form>
</div>
</template>

<script>
import axios from 'axios';
import config from '@/config';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';

export default {
    name: 'GenerarObservacion',
    data() {
        return {
            observacion: {
                producto: '',
                estado_pro: '',
                descripcion_pro: '',
                centro_pro: '',
                lote_pro: '',
                unidad_medida_pro: '',
                codigo_inventario_pro: '',
                diferencia_pro: '',
                categoria_obsv: '',
                observacion_obsv: ''
            },
            categorias: [
                "Categoría A",
                "Categoría B",
                "Categoría C",
                "Categoría D",
            ],
        };
    },
    methods: {

        // ver el tema de obserciones mandar la solicutud a la api
        async submitForm() {
            try {
                const response = await axios.post(`${config.BASE_URL}/api/observaciones`, this.observacion, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true, // 🔹 Enviar automáticamente las cookies de autenticación
                });

                console.log('Observación creada:', response.data);
                Swal.fire('Éxito', 'Observación guardada exitosamente', 'success');
                this.resetForm(); // 🔹 Limpiar el formulario después de guardar
            } catch (error) {
                console.error('Error al guardar la observación:', error.response?.data || error.message);
                Swal.fire('Error', 'Hubo un error al guardar la observación', 'error');
            }
        },

        resetForm() {
            this.observacion = {
                producto: '',
                estado_pro: '',
                descripcion_pro: '',
                centro_pro: '',
                lote_pro: '',
                unidad_medida_pro: '',
                codigo_inventario_pro: '',
                diferencia_pro: 0.0,
                categoria_obsv: '',
                observacion_obsv: '',
            };
        },
    },
    mounted() {
        const query = this.$route.query;
        console.log("Datos recibidos en query:", query); // Depuración
        this.observacion = {
            producto: query.producto || '',
            estado_pro: query.estado_pro || '',
            descripcion_pro: query.descripcionProducto || '', // Mapeado desde 'descripcionProducto'
            centro_pro: query.propietario || '', // Mapeado desde 'propietario'
            lote_pro: query.lote || '', // Mapeado desde 'lote'
            unidad_medida_pro: query.unidadMedidaBase || '', // Mapeado desde 'unidadMedidaBase'
            codigo_inventario_pro: query.codigoInventario || '', // Mapeado desde 'codigoInventario'
            diferencia_pro: query.diferencia || '', // Mapeado desde 'diferencia'

        };
    },
};
</script>

<style scoped>
form {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
}

input,
textarea {
    width: 100%;
    padding: 8px;
    margin-bottom: 16px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #218838;
}

.combo-box {
    width: 100%;
    /* Ocupa todo el ancho disponible */
    padding: 10px;
    /* Espaciado interno */
    font-size: 16px;
    /* Tamaño de letra */
    border: 2px solid #ccc;
    /* Borde gris claro */
    border-radius: 5px;
    /* Bordes redondeados */
    background-color: #f9f9f9;
    /* Fondo claro */
    appearance: none;
    /* Elimina el estilo predeterminado del navegador */
    transition: border-color 0.3s ease;
    /* Animación suave */
}

.combo-box:focus {
    border-color: #007bff;
    /* Cambia el color del borde al enfocar */
    outline: none;
    /* Elimina el borde predeterminado del navegador */
    background-color: #fff;
    /* Cambia el fondo al enfocar */
}
</style>
