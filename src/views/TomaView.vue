<template>
<div class="form-container" :class="{ 'loaded': isLoaded }">
    <h2 class="form-title animate-fade-in">Carga de Productos</h2>

    <form @submit.prevent="submitForm" class="animate-slide-up">

        <div class="form-group">
            <label for="codigoArchivo">Código Archivo:</label>
            <input type="text" id="codigoArchivo" v-model="codigoArchivo" @input="getInfoInventatio" disabled class="input-field animate-field">
        </div>

        <div class="form-group">
            <label for="ubicacion">Ubicación:</label>
            <input type="text" v-model="productData.ubicacion" required placeholder="00-00-000-000" autofocus class="input-field animate-field">
        </div>

        <div class="form-group">
            <label for="producto">Producto:</label>
            <input type="text" v-model="productData.producto" @input="buscarProducto" required :class="{'input-field animate-field': true, 'is-invalid': productData.producto === ''}">
        </div>

        <div class="form-group">
            <label for="descripcionProducto">Descripción de Producto:</label>
            <input type="text" v-model="productData.descripcionProducto" required class="input-field animate-field">
        </div>

        <div class="form-group">
            <label for="cantidad">Cantidad (Q):</label>
            <input type="number" v-model="productData.cantidad" required min="0.0" step="0.01" :class="{'input-field animate-field': true, 'is-invalid': productData.cantidad < 0}">
            <span v-if="productData.cantidad <= 0" class="error animate-fade-in">Esta colocando una cantidad igual o menor a 0.</span>
        </div>

        <div class="form-group">
            <label for="centro">Centro:</label>
            <select v-model="productData.centro" class="form-select animate-field" required disabled>
                <option value="">Seleccione un centro</option>
                <option value="C080">C080</option>
                <option value="C152">C152</option>
                <option value="C154">C154</option>
                <option value="C200">C200</option>
                <option value="C040">C040</option>
            </select>
        </div>

        <div class="form-group">
            <label for="lote">Lote:</label>
            <select v-model="productData.lote" class="form-select animate-field" required>
                <option value="">Seleccione un lote</option>
                <option value="REPARADO">REPARADO</option>
                <option value="NUEVO">NUEVO</option>
                <option value="GARANTIA">GARANTIA</option>
                <option value="OBSERVADO">OBSERVADO</option>
                <option value="REP_CM_VAS">REP_CM_VAS</option>
                <option value="REP_ESTAND">REP_ESTAND</option>
                <option value="REP_SELLOS">REP_SELLOS</option>
            </select>
        </div>

        <div class="form-group">
            <label for="unidadMedidaBase">Unidad de Medida Base:</label>
            <input type="text" v-model="productData.unidadMedidaBase" required disabled class="input-field animate-field">
        </div>

        <div class="form-group">
            <label for="codigoInventario">Código de Inventario:</label>
            <input type="text" v-model="productData.codigoInventario" required :class="{'input-field animate-field': true, 'is-invalid': productData.codigoInventario === ''}" :disabled="disable">
        </div>

        <!-- Botón para mostrar campos adicionales -->
        <div class="toggle-container">
            <button @click="toggleFields" type="button" class="toggle-button animate-pulse">
                <i class="fa" :class="showFields ? 'fa-minus' : 'fa-plus'"></i>
                <span>{{ showFields ? 'Ocultar campos adicionales' : 'Mostrar campos adicionales' }}</span>
            </button>
        </div>

        <!-- Campos adicionales -->
        <transition name="slide">
            <div v-if="showFields" class="additional-fields animate-slide-down">
                <div class="form-group">
                    <label for="observacion">Observación:</label>
                    <input type="text" v-model="productData.observacion" class="input-field animate-field">
                </div>

                <div class="form-group">
                    <label for="medida">Medida:</label>
                    <input type="text" v-model="productData.medida" class="input-field animate-field">
                </div>

                <div class="form-group">
                    <label for="fechaVencimiento">Fecha de Vencimiento:</label>
                    <input type="datetime-local" v-model="productData.fechaVencimiento" :class="{'input-field animate-field': true, 'is-invalid': !validarFechaVencimiento}">
                    <span v-if="!validarFechaVencimiento" class="error animate-fade-in">La fecha de vencimiento no puede ser anterior a la fecha actual.</span>
                </div>
            </div>
        </transition>

        <div class="button-group">
            <button type="submit" :disabled="!formValido || botonPresionado" class="submit-button" :class="{'button-disabled': !formValido || botonPresionado}">
                <span class="button-text">Cargar Producto</span>
                <span v-if="botonPresionado" class="loading-spinner"></span>
            </button>

            <button type="button" @click="retroceder" class="back-button">
                <span class="button-text">Retroceder a la Lista</span>
            </button>
        </div>
    </form>
</div>
</template>

    
<script>
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../config';
export default {
    data() {
        return {
            showFields: false,
            productData: this.getInitialProductData(),
            defaultProductData: this.getInitialProductData(),
            scannedCode: '',
            loading: false,
            codigoInventariado: null,
            codigoArchivo: '',
            botonPresionado: false,
            disable: false,
            isLoaded: false
        };
    },
    computed: {
        validarFechaVencimiento() {
            const hoy = this.getCurrentDateTime();
            const fechaVencimiento = this.productData.fechaVencimiento;
            return fechaVencimiento === '' || fechaVencimiento >= hoy;
        },
        formValido() {
            return (
                this.productData.producto !== '' &&
                this.productData.descripcionProducto !== '' &&
                this.productData.cantidad > 0 &&
                this.productData.centro !== '' &&
                this.productData.codigoInventario !== '' &&
                this.validarFechaVencimiento
            );
        }
    },

    methods: {
        retroceder() {
            this.$router.push('/ListarInvent'); // Navegar a la vista
        },
        getInitialProductData() {
            return {
                fechaToma: this.getCurrentDateTime(),
                ubicacion: '',
                producto: '',
                descripcionProducto: '',
                cantidad: 0,
                centro: '',
                lote: '',
                unidadMedidaBase: '',
                codigoInventario: '',
                observacion: '',
                medida: '',
                fechaVencimiento: '',
            };
        },
        show_alerta(mensaje, icono, foco = '') {
            if (foco !== '') {
                document.getElementById(foco).focus();
            }
            Swal.fire({
                title: mensaje,
                icon: icono,
                customClass: {
                    confirmButton: 'btn btn-primary animate-bounce',
                    popup: 'animated zoomIn'
                },
                buttonsStyling: false
            });
        },

        async getInfoInventatio() {
            if (!this.codigoArchivo.trim()) return;

            try {
                const response = await axios.get(`${config.BASE_URL}/api/inventario/registros/${this.codigoArchivo}`, {
                    withCredentials: true, // Enviar cookies HttpOnly automáticamente
                });

                if (response.status === 200 && response.data) {
                    const data = response.data;
                    this.productData = {
                        ...this.productData,
                        descripcionProducto: data.descripcionProducto || '',
                        unidadMedidaBase: data.unidadMedidaBase || '',
                        ubicacion: data.ubicacion || '',
                        codigoInventario: data.codigoInv || '',
                        cantidad: data.ctd || 0,
                        centro: data.propietario || '',
                        lote: data.lote || '',
                        producto: data.producto || '',
                    };
                } else {
                    this.show_alerta('No se encontraron productos para el código proporcionado.');
                }
            } catch (error) {
                this.show_alerta(`Error: ${error.response ? error.response.status + ' - ' + error.response.statusText : error.message}`);
            }
        },
        async buscarProducto() {
            if (!this.productData.producto.trim()) {
                this.show_alerta('Por favor, ingresa un código de producto', 'warning');
                return;
            }

            try {
                const codigoProductoFinal = encodeURIComponent(this.productData.producto);

                const response = await axios.get(`${config.BASE_URL}/api/products/b_name?name=${codigoProductoFinal}`, {
                    withCredentials: true, // Cookies HttpOnly
                });

                if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                    const productoCoincidente = response.data.find(item =>
                        item.nameProduct.toLowerCase() === this.productData.producto.toLowerCase()
                    );

                    if (productoCoincidente) {
                        this.productData.descripcionProducto = productoCoincidente.descriptionProduct;
                        this.productData.unidadMedidaBase = productoCoincidente.unitMeasurement;
                    } else {
                        console.log('Producto no encontrado');
                    }
                } else {
                    this.show_alerta('No se encontraron productos para el código proporcionado.', 'warning');
                }
            } catch (error) {
                this.show_alerta(`Error: ${error.response ? error.response.status + ' - ' + error.response.statusText : error.message}`, 'error');
            }
        },

        async submitForm() {
            if (!navigator.onLine) {
                this.show_alerta('Error de conexión. Por favor, verifica tu red.', 'error');
                return;
            }

            if (this.botonPresionado) return;

            try {
                const confirmacion = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: 'Estás a punto de enviar la toma. ¿Deseas continuar?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, enviar',
                    cancelButtonText: 'Aun no',
                    customClass: {
                        popup: 'animated fadeInDown'
                    }
                });

                if (!confirmacion.isConfirmed) return;

                this.botonPresionado = true;
                const response = await axios.post(`${config.BASE_URL}/api/tomas`,
                    this.productData, {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (response.status === 200 || response.status === 201) {
                    // Actualización de estado también con axios
                    const updateResponse = await axios.put(
                        `${config.BASE_URL}/api/inventario/actualizar-status?codigoInventario=${this.codigoArchivo}&nuevoEstado=completado`, {}, // cuerpo vacío
                        {
                            withCredentials: true,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    );

                    if (updateResponse.status === 200) {
                        this.show_alerta('Producto cargado exitosamente', 'success');
                        this.resetForm();
                        this.$router.push('/ListarInvent');
                    }
                }
            } catch (error) {
                console.error('Error en submitForm:', error);
                this.show_alerta(`Error: ${error.message}`, 'error');
            } finally {
                this.botonPresionado = false;
            }
        },
        resetForm() {
            this.productData = {
                ...this.defaultProductData
            };
        },
        getCurrentDateTime() {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'America/Lima',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            const parts = formatter.formatToParts(now);
            const year = parts.find(p => p.type === 'year').value;
            const month = parts.find(p => p.type === 'month').value;
            const day = parts.find(p => p.type === 'day').value;
            const hour = parts.find(p => p.type === 'hour').value;
            const minute = parts.find(p => p.type === 'minute').value;

            return `${year}-${month}-${day}T${hour}:${minute}`;
        },
        toggleFields() {
            this.showFields = !this.showFields;
        },
    },
    created() {
        // Recupera el código del sessionStorage
        this.codigoInventariado = sessionStorage.getItem('codigoArchivo');
        if (this.codigoInventariado) {
            this.codigoArchivo = this.codigoInventariado; // Asigna el valor al input
            this.getInfoInventatio(); // Llama a getInfoInventatio automáticamente
        }
        console.log('Código de Inventariado:', this.codigoInventariado); // Muestra el código en la consola

        // Establecer isLoaded como true después de un breve tiempo para activar la animación de entrada
        setTimeout(() => {
            this.isLoaded = true;
        }, 100);
    }
};
</script>

  
<style scope>
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

.form-title {
    color: #0c534c;
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.5px;
    position: relative;
    padding-bottom: 1rem;
}

.form-title::after {
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

.form-group {
    margin-bottom: 1.5rem;
    position: relative;
    transition: all 0.3s ease;
}

.form-group:hover {
    transform: translateY(-2px);
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

.input-field, .form-select {
    width: 100%;
    padding: 1rem 1.2rem;
    border: 2px solid #e2e8f0;
    border-radius: 0.7rem;
    font-size: 1rem;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background-color: #fff;
    color: #2d3748;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.input-field:focus, .form-select:focus {
    outline: none;
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.25), 0 4px 6px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
}

.input-field:hover, .form-select:hover {
    border-color: #cbd5e0;
}

.input-field:disabled, .form-select:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
    color: #a0aec0;
    border-color: #edf2f7;
}

.is-invalid {
    border-color: #ff5a5f;
    box-shadow: 0 0 0 2px rgba(255, 90, 95, 0.25);
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
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

/* Estilos para botones mejorados */
.toggle-container {
    margin: 1.5rem 0;
    display: flex;
    justify-content: center;
}

.toggle-button {
    background-color: #f8faff;
    color: #0c534c;
    border: 2px solid #e0e7ff;
    padding: 0.7rem 1.3rem;
    border-radius: 0.7rem;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.7rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.toggle-button:hover {
    background-color: #eef2ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(74, 108, 247, 0.15);
}

.toggle-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(74, 108, 247, 0.1);
}

.toggle-button i {
    font-size: 0.9rem;
    transition: transform 0.3s ease;
}

.toggle-button:hover i {
    transform: rotate(180deg);
}

.button-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
}

.submit-button, .back-button {
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 0.7rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    letter-spacing: 0.5px;
    overflow: hidden;
}

.submit-button {
    background: linear-gradient(45deg, #0c534c, #6384ff);
    color: white;
    box-shadow: 0 4px 12px rgba(74, 108, 247, 0.25);
}

.submit-button:hover:not(.button-disabled) {
    background: linear-gradient(45deg, #3152d9, #0c534c);
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(74, 108, 247, 0.35);
}

.submit-button:active:not(.button-disabled) {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(74, 108, 247, 0.3);
}

.submit-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
}

.submit-button:hover::before {
    left: 100%;
}

.back-button {
    background: linear-gradient(45deg, #f1f5f9, #e2e8f0);
    color: #4a5568;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.back-button:hover {
    background: linear-gradient(45deg, #e2e8f0, #cbd5e0);
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    color: #2d3748;
}

.back-button:active {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}

.button-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none !important;
    transform: none !important;
}

/* Campos adicionales con diseño mejorado */
.additional-fields {
    padding: 1rem;
    margin-top: 1rem;
    border-radius: 0.8rem;
    background-color: #f8faff;
    border: 1px dashed #cbd5e0;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.additional-fields:hover {
    border-color: #a0aec0;
    box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Spinner de carga mejorado */
.loading-spinner {
    width: 1.2rem;
    height: 1.2rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.8s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
    margin-left: 0.7rem;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Animaciones mejoradas */
.animate-fade-in {
    animation: fadeIn 0.5s cubic-bezier(0.39, 0.575, 0.565, 1) forwards;
}

.animate-slide-up {
    animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.animate-slide-down {
    animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.animate-field {
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.animate-field:focus {
    transform: translateY(-3px);
}

.animate-pulse {
    animation: pulse 3s infinite;
}

.animate-bounce {
    animation: bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Nuevas animaciones y efectos visuales */
.form-group:focus-within label {
    color: #0c534c;
    transform: translateX(5px);
}

.input-field::placeholder, .form-select::placeholder {
    color: #a0aec0;
    transition: all 0.3s ease;
}

.input-field:focus::placeholder {
    opacity: 0.7;
    transform: translateX(5px);
}

/* Efecto de pulsación para botones importantes */
.submit-button.pulse-effect {
    animation: buttonPulse 2s infinite;
}

/* Definiciones de animaciones mejoradas */
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
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

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-15px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(74, 108, 247, 0.5);
    }
    70% {
        box-shadow: 0 0 0 15px rgba(74, 108, 247, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(74, 108, 247, 0);
    }
}

@keyframes bounce {
    0%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-8px);
    }
    60% {
        transform: translateY(-5px);
    }
}

@keyframes shake {
    10%, 90% {
        transform: translateX(-1px);
    }
    20%, 80% {
        transform: translateX(2px);
    }
    30%, 50%, 70% {
        transform: translateX(-3px);
    }
    40%, 60% {
        transform: translateX(3px);
    }
}

@keyframes buttonPulse {
    0% {
        box-shadow: 0 0 0 0 rgba(74, 108, 247, 0.7);
    }
    70% {
        box-shadow: 0 0 0 15px rgba(74, 108, 247, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(74, 108, 247, 0);
    }
}

/* Mejora de las transiciones */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    max-height: 400px;
    opacity: 1;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
    transform: translateY(-15px);
}

/* Nuevos efectos de enfoque y hover para elementos del formulario */
.form-group::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #0c534c, #6a8cff);
    transition: width 0.3s ease;
}

.form-group:focus-within::after {
    width: 100%;
}

/* Media queries mejorados para responsividad */
@media (min-width: 576px) {
    .form-container {
        max-width: 540px;
        padding: 2.5rem;
        margin-top: 3rem;
    }
    
    .button-group {
        flex-direction: row;
        justify-content: space-between;
    }
    
    .submit-button, .back-button {
        width: 48%;
    }
    
    .form-title {
        margin-bottom: 2.5rem;
    }
}

@media (min-width: 768px) {
    .form-container {
        max-width: 720px;
        padding: 3rem;
    }
    
    .form-title {
        font-size: 2.2rem;
    }
    
    .form-group {
        margin-bottom: 2rem;
    }
    
    .input-field, .form-select {
        padding: 1.1rem 1.3rem;
        font-size: 1.05rem;
    }
}

@media (min-width: 992px) {
    .form-container {
        max-width: 650px;
    }
    
    .form-title::after {
        width: 100px;
    }
}

/* Responsive optimizations para pantallas pequeñas */
@media (max-width: 576px) {
    .form-title {
        font-size: 1.6rem;
    }
    
    .input-field, .form-select {
        padding: 0.8rem 1rem;
    }
    
    .toggle-button span {
        display: none;
    }
    
    .toggle-button::after {
        content: "Campos adicionales";
        margin-left: 0.5rem;
    }
    
    .form-container {
        margin: 1rem;
        padding: 1.5rem;
        border-radius: 0.8rem;
    }
}

/* Efectos visuales adicionales para los estados de los elementos */
.input-field:focus ~ .field-icon,
.form-select:focus ~ .field-icon {
    color: #0c534c;
    transform: scale(1.2);
}

.field-icon {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #a0aec0;
    transition: all 0.3s ease;
}

/* Estilo para mensajes de información en el formulario */
.form-info {
    background-color: #ebf8ff;
    border-left: 4px solid #4299e1;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    color: #2b6cb0;
    box-shadow: 0 2px 5px rgba(66, 153, 225, 0.1);
    animation: slideIn 0.5s ease forwards;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Checkbox personalizado con estilo mejorado */
.checkbox-container {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    cursor: pointer;
}

.checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    height: 22px;
    width: 22px;
    background-color: #fff;
    border: 2px solid #e2e8f0;
    border-radius: 5px;
    margin-right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.checkbox-container:hover input ~ .checkmark {
    border-color: #cbd5e0;
    background-color: #f8faff;
}

.checkbox-container input:checked ~ .checkmark {
    background-color: #0c534c;
    border-color: #0c534c;
}

.checkmark:after {
    content: "";
    display: none;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.checkbox-container input:checked ~ .checkmark:after {
    display: block;
}

.checkbox-label {
    font-size: 0.95rem;
    color: #4a5568;
    user-select: none;
}

/* Efectos para tarjetas o secciones internas */
.form-card {
    background-color: #fff;
    border-radius: 0.8rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    border: 1px solid #f0f4f8;
}

.form-card:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-3px);
}

.form-card-title {
    font-size: 1.2rem;
    color: #0c534c;
    margin-bottom: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-card-title::before {
    content: '';
    width: 12px;
    height: 12px;
    background: linear-gradient(45deg, #0c534c, #6a8cff);
    border-radius: 50%;
    display: inline-block;
}

/* Mejoras adicionales a los elementos select */
.select-wrapper {
    position: relative;
}

.select-wrapper::after {
    content: '▼';
    font-size: 0.7rem;
    color: #0c534c;
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    transition: all 0.3s ease;
}

.select-wrapper:hover::after {
    transform: translateY(-50%) rotate(180deg);
}

.form-select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    cursor: pointer;
}
</style>