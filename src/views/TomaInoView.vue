<template>
<div class="form-container">
    <h2>Carga de Productos</h2>
    <form @submit.prevent="submitForm">

        <label for="fecha_toma">Fecha Toma:</label>
        <input type="datetime" v-model="productData.fechaToma" required disabled>

        <label for="ubicacion">Ubicación:</label>
        <input type="text" v-model="productData.ubicacion" required placeholder="01-00-000-000" autofocus>

        <label for="producto">Producto:</label>
        <input type="text" v-model="productData.producto" @input="buscarProducto" required :class="{'is-invalid': productData.producto === ''}">

        <label for="descripcionProducto">Descripción de Producto:</label>
        <input type="text" v-model="productData.descripcionProducto" required :readonly="!showWarning">

        <label for="cantidad">Cantidad (Q):</label>
        <input type="number" v-model="productData.cantidad" required min="0.0" step="0.01" placeholder="Ingrese la cantidad">
        <span class="success" v-if="productData.cantidad <= 0">
            Esta colocando una cantidad igual o menor a 0.
        </span>

        <label for="centro">Centro:</label>
        <input type="text" v-model="productData.centro">

        <label for="lote">Lote:</label>
        <select v-model="productData.lote" class="form-select" required>
            <option value="">Seleccione un lote</option>
            <option value="Reparado">Reparado</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Garantia">Garantía</option>
            <option value="Observado">Observado</option>
            <option value="REP_CM_VAS">REP_CM_VAS</option>
            <option value="REP_ESTAND">REP_ESTAND</option>
            <option value="REP_SELLOS">REP_SELLOS</option>
        </select>

        <label for="unidadMedidaBase">Unidad de Medida Base:</label>
        <input type="text" v-model="productData.unidadMedidaBase" required :readonly="!showWarning">

        <label for="codigoInventario">Código de Inventario:</label>
        <input type="text" v-model="productData.codigoInventario" required :class="{'is-invalid': productData.codigoInventario === ''}">

        <!-- Botón para mostrar campos adicionales -->
        <br>
        <button @click="toggleFields" type="button" class="btn btn-primary">
            <i class="fa" :class="showFields ? 'fa-minus' : 'fa-plus'"></i> Mostrar/Ocultar campos adicionales
        </button>

        <!-- Campos adicionales -->
        <div v-if="showFields" class="form-fields mt-3">
            <label for="observacion">Observación:</label>
            <input type="text" v-model="productData.observacion">

            <label for="medida">Medida:</label>
            <input type="text" v-model="productData.medida">

            <label for="fechaVencimiento">Fecha de Vencimiento:</label>
            <input type="datetime-local" v-model="productData.fechaVencimiento" :class="{'is-invalid': !validarFechaVencimiento}">
            <span v-if="!validarFechaVencimiento" class="error">La fecha de vencimiento no puede ser anterior a la fecha actual.</span>
        </div>

        <br>

        <button type="submit" :disabled="!formValido || botonPresionado">Cargar Producto</button>
    </form>
</div>

<!-- Modal de carga -->
<div v-if="isLoading" class="modal-carga-overlay">
    <div class="modal-carga">
        <div v-if="progress < 98" class="barra-carga">
            <div class="progreso" :style="{ width: progress + '%' }"></div>
        </div>
        <div v-if="progress === 100" class="mensaje-exito">
            <i class="check-icon fas fa-check-circle"></i>
            <p>Información cargada</p>
        </div>
        <div v-if="progress < 100" class="texto-carga">
            <p>Consultando... {{ progress }}%</p>
            <div class="spinner"></div>
        </div>
    </div>
</div>
</template>

    
<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../config';

export default {
    data() {
        return {
            centro: '',
            showWarning: false,
            showFields: false,
            productData: this.getInitialProductData(),
            defaultProductData: this.getInitialProductData(),
            scannedCode: '',
            loading: false,
            codigoInventario: '',
            botonPresionado: false,
            isLoading: false, // Añadido para controlar el modal de carga
            progress: 0, // Añadido para el progreso
        };
    },
    computed: {
        validarFechaVencimiento() {
            const hoy = this.getCurrentDateTime();
            const fechaVencimiento = this.productData.fechaVencimiento;
            return fechaVencimiento === '' || fechaVencimiento >= hoy;
        },
        formValido() {
            return this.productData.producto !== '' && this.productData.descripcionProducto !== '' && this.productData.cantidad >= 0;
        },
    },

    methods: {
        getInitialProductData() {
            return {
                fechaToma: this.getCurrentDateTime(),
                ubicacion: '',
                producto: '',
                descripcionProducto: '',
                cantidad: 0,
                lote: '',
                unidadMedidaBase: '',
                codigoInventario: 'INVCICL20251918',
                observacion: '',
                medida: '',
                fechaVencimiento: ''
            };
        },
        show_alerta(mensaje, icono = "info", foco = '') {
            if (!["success", "error", "warning", "info", "question"].includes(icono)) {
                icono = "info"; // Establecer "info" como icono predeterminado si el valor es desconocido
            }
            if (foco !== '') {
                document.getElementById(foco).focus();
            }
            Swal.fire({
                title: mensaje,
                icon: icono,
                customClass: {
                    confirmButton: 'btn btn-primary',
                    popup: 'animated zosubmitFormomIn'
                },
                buttonsStyling: false
            });
        },

        async buscarProducto() {
            if (!this.productData.producto.trim()) {
                this.show_alerta('Por favor, ingresa un código de producto', 'warning');
                return;
            }

            try {
                const codigoProductoFinal = encodeURIComponent(this.productData.producto);

                const response = await axios.get(`${config.BASE_URL}/api/products/b_name?name=${codigoProductoFinal}`, {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    withCredentials: true,
                });

                if (response.status === 200) {
                    const data = response.data;
                    if (Array.isArray(data) && data.length > 0) {
                        const productoCoincidente = data.find(item =>
                            item.nameProduct.toLowerCase() === this.productData.producto.toLowerCase()
                        );
                        if (productoCoincidente) {
                            this.productData.descripcionProducto = productoCoincidente.descriptionProduct;
                            this.productData.unidadMedidaBase = productoCoincidente.unitMeasurement;
                            this.showWarning = false;
                        } else {
                            this.showWarning = true;
                        }
                    } else {
                        this.showWarning = true;
                        this.productData.descripcionProducto = '';
                        this.productData.unidadMedidaBase = '';
                    }
                }
            } catch (error) {
                console.error('Error al obtener los datos del producto:', error.response ? error.response.data : error.message);
            }
        },
        getCredentials() {
            const username = localStorage.getItem('username');
            const password = localStorage.getItem('password');
            return btoa(`${username}:${password}`);
        },
        updateProgress(progressValue) {
            if (this.progress < 100) {
                this.progress = progressValue;
                console.log("Progreso actualizado:", this.progress);
                if (this.progress < 100) {
                    setTimeout(() => this.updateProgress(this.progress + 10), 500); // Aumenta el progreso cada medio segundo
                }
            }
        },
        async submitForm() {
            if (this.botonPresionado) return;

            // Definimos ongoingRequests aquí si no está definido globalmente
            if (typeof ongoingRequests === 'undefined') {
                window.ongoingRequests = new Set();
            }

            const requestKey = JSON.stringify(this.productData);
            if (window.ongoingRequests.has(requestKey)) {
                this.show_alerta('Ya hay una solicitud en curso con los mismos datos.', 'warning');
                return;
            }

            window.ongoingRequests.add(requestKey);
            this.isLoading = true;
            this.progress = 0;
            this.updateProgress(10);

            try {
                const response = await fetch(`${config.BASE_URL}/api/tomas`, {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: 'include',
                    body: JSON.stringify(this.productData)
                });

                if (response.ok) {
                    this.updateProgress(100);
                    console.log('Producto cargado exitosamente');
                    this.show_alerta('Producto cargado exitosamente', 'success');
                    this.resetForm();
                } else {
                    this.show_alerta('Error al cargar el producto', 'error');
                }
            } catch (error) {
                console.error('Error en la solicitud:', error);
                this.show_alerta(`Error: ${error.message}`, 'error');
            } finally {
                this.botonPresionado = false;
                window.ongoingRequests.delete(requestKey);
                this.isLoading = false;
            }
        },

        resetForm() {
            this.productData = {
                ...this.defaultProductData
            };
            this.productData.fechaToma = this.getCurrentDateTime();
            this.productData.centro = this.fetchCentro();
            this.showFields = false;
        },
        toggleFields() {
            this.showFields = !this.showFields;
        },
        getCurrentDateTime() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        },
        async obtenerCodigoInventario() {
            try {
                const response = await axios.get(`${config.BASE_URL}/api/inventario/latest-codigo-inventario`, {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    withCredentials: true,
                });

                if (response.status === 200) {
                    this.productData.codigoInventario = response.data;
                    return response.data;
                } else {
                    console.error("Error: No se obtuvo una respuesta exitosa.");
                }
            } catch (error) {
                console.error("Error al hacer la solicitud GET:", error);
            }
        },
        async fetchCentro() {
            try {
                const response = await axios.get(`${config.BASE_URL}/api/user/sucursal`, {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    withCredentials: true,
                });

                this.productData.centro = response.data;
            } catch (error) {
                console.error('Error al obtener el centro:', error);
            }
        }
    },
    created() {
        console.log("Código de inventario actualizado: TOMA INO", this.productData.codigoInventario);
    },
    mounted() {
        // Al cargar el componente, hacer la solicitud a la API
        this.fetchCentro();

        // Añadir clase para activar la animación de entrada
        setTimeout(() => {
            const formContainer = document.querySelector('.form-container');
            if (formContainer) {
                formContainer.classList.add('loaded');
            }
        }, 100);
    },
};
</script>

    
<style scoped>
/* Estilos base mejorados */
body {
    background-color: #f8f9ff;
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    color: #2d3748;
    line-height: 1.6;
}

/* Estilos de la forma principal - con efectos mejorados */
.form-container {
    max-width: 100%;
    width: 100%;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #ffffff;
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.12), 0 0.5rem 1.5rem rgba(0, 0, 0, 0.08);
    border-radius: 1rem;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    opacity: 0;
    transform: translateY(20px);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
}

.form-container.loaded {
    opacity: 1;
    transform: translateY(0);
}

.form-container:hover {
    box-shadow: 0 1.2rem 3.2rem rgba(0, 0, 0, 0.14), 0 0.7rem 1.7rem rgba(0, 0, 0, 0.1);
    transform: translateY(-5px);
}

h2 {
    color: #0c534c;
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    position: relative;
    padding-bottom: 1rem;
}

h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: linear-gradient(90deg, #0c534c, #6a8cff);
    border-radius: 2px;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

label {
    display: block;
    margin-bottom: 0.6rem;
    font-weight: 600;
    color: #4a5568;
    font-size: 0.95rem;
    letter-spacing: 0.3px;
    transition: all 0.2s ease;
}

label::before {
    content: '•';
    color: #0c534c;
    margin-right: 5px;
    font-size: 1.2rem;
    line-height: 0;
    position: relative;
    top: 2px;
}

input,
select {
    width: 100%;
    padding: 1rem 1.2rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.7rem;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background-color: #fff;
    color: #2d3748;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    margin-bottom: 1rem;
}

input:focus,
select:focus {
    outline: none;
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.25), 0 4px 6px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
}

input:hover,
select:hover {
    border-color: #cbd5e0;
}

input:disabled,
select:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
    color: #a0aec0;
    border-color: #edf2f7;
}

.is-invalid {
    border-color: #ff5a5f !important;
    box-shadow: 0 0 0 2px rgba(255, 90, 95, 0.25) !important;
    animation: shake 0.5s cubic-bezier(.36, .07, .19, .97) both;
}

.error {
    color: #ff5a5f;
    font-size: 0.85rem;
    margin-top: 0.5rem;
    display: block;
    font-weight: 500;
    padding-left: 0.5rem;
    border-left: 2px solid #ff5a5f;
    animation: fadeInUp 0.3s ease forwards;
}

.success {
    color: #38a169;
    font-size: 0.85rem;
    margin-top: -0.5rem;
    margin-bottom: 0.5rem;
    display: block;
    font-weight: 500;
}

button {
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 0.7rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(45deg, #0c534c, #6384ff);
    color: white;
    box-shadow: 0 4px 12px rgba(74, 108, 247, 0.25);
}

button:hover:not(:disabled) {
    background: linear-gradient(45deg, #3152d9, #0c534c);
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(74, 108, 247, 0.35);
}

button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary {
    background: #0c534c;
    margin-bottom: 1rem;
}

/* Modal de carga */
.modal-carga-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.modal-carga {
    background-color: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 400px;
    text-align: center;
}

.barra-carga {
    height: 8px;
    background-color: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1rem;
}

.progreso {
    height: 100%;
    background: linear-gradient(90deg, #0c534c, #6a8cff);
    transition: width 0.3s ease;
}

.mensaje-exito {
    margin-top: 1rem;
    color: #38a169;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.check-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.texto-carga {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.spinner {
    margin-top: 1rem;
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #0c534c;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes shake {

    10%,
    90% {
        transform: translateX(-1px);
    }

    20%,
    80% {
        transform: translateX(2px);
    }

    30%,
    50%,
    70% {
        transform: translateX(-3px);
    }

    40%,
    60% {
        transform: translateX(3px);
    }
}

/* Modo responsivo */
@media (min-width: 768px) {
    .form-container {
        max-width: 720px;
    }
}

@media (max-width: 576px) {
    .form-container {
        margin: 1rem;
        padding: 1.5rem;
    }

    h2 {
        font-size: 1.6rem;
    }
}
</style>
