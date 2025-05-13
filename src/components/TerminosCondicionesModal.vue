<template>
<div v-if="show" class="modal-overlay">
    <div class="modal-terminos">
        <div class="modal-header">
            <h2>Aceptar Términos y Condiciones</h2>
            <button @click="cerrarModal" class="modal-cerrar">&times;</button>
        </div>

        <div class="modal-body" ref="modalContent">
            <div class="codigo-info">
                <h3>Código de Inventario: {{ codigoInventarioActual }}</h3>
            </div>

            <div class="resumen-datos">
                <div class="resumen-fila">
                    <div class="resumen-label">Estado</div>
                    <div class="resumen-sku">SKU</div>
                    <div class="resumen-valor">Valor</div>
                </div>

                <div class="resumen-fila faltante">
                    <div class="resumen-label">Faltante</div>
                    <div class="resumen-sku">{{ datosResumen.faltanteSku }}</div>
                    <div class="resumen-valor">S/. {{ formatearPrecio(datosResumen.faltanteValor) }}</div>
                </div>

                <div class="resumen-fila sobrante">
                    <div class="resumen-label">Sobrante</div>
                    <div class="resumen-sku">{{ datosResumen.sobranteSku }}</div>
                    <div class="resumen-valor">S/. {{ formatearPrecio(datosResumen.sobranteValor) }}</div>
                </div>

                <div class="resumen-fila conciliado">
                    <div class="resumen-label">Conciliado</div>
                    <div class="resumen-sku">{{ datosResumen.conciliadoSku }}</div>
                    <div class="resumen-valor">S/. {{ formatearPrecio(datosResumen.conciliadoValor) }}</div>
                </div>
            </div>

            <div class="form-group">
                <label for="observacion">Observación:</label>
                <textarea id="observacion" v-model="observacion" placeholder="Ingrese una observación (opcional)
                
                " class="modal-textarea" rows="4"></textarea>
            </div>

            <div class="terminos-contenido">
                <h3>Términos y Condiciones</h3>
                <div class="terminos-texto">
                    <p>Al aceptar estos términos y condiciones, usted confirma que:</p>
                    <ul>
                        <li>Ha revisado cuidadosamente todos los datos presentados en el inventario.</li>
                        <li>Comprende que esta aceptación es final y no se pueden realizar cambios posteriores.</li>
                        <li>Se compromete a mantener la confidencialidad de la información.</li>
                        <li>Los datos presentados son exactos y están completos.</li>
                    </ul>
                </div>
            </div>

            <!-- Área de firma -->
            <div class="firma-container">
                <h3>Firma Digital</h3>
                <div class="firma-area">
                    <canvas ref="firmaCanvas" class="firma-canvas" @mousedown="iniciarFirma" @mousemove="dibujarFirma" @mouseup="finalizarFirma" @mouseleave="finalizarFirma" @touchstart="iniciarFirmaTactil" @touchmove="dibujarFirmaTactil" @touchend="finalizarFirma"></canvas>
                    <div class="firma-instrucciones">Firme aquí con el mouse o pantalla táctil</div>
                </div>
                <div class="firma-botones">
                    <button @click="limpiarFirma" class="btn-limpiar-firma">
                        <i class="fas fa-eraser"></i> Limpiar Firma
                    </button>
                </div>
            </div>
        </div>

        <div class="modal-footer">
            <button @click="cerrarModal" class="btn-reset" :disabled="isLoading">
                <i class="fas fa-times-circle"></i>
                <span class="btn-text">Cancelar</span>
            </button>

            <!-- Botón para descargar PDF -->
            <button @click="generarPDF" class="btn-pdf" :disabled="isLoading">
                <i class="fas fa-file-pdf"></i>
                <span class="btn-text">{{ isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF' }}</span>
            </button>

            <button @click="aceptarTerminos" class="btn-buscar" :disabled="isLoading || yaAceptado || !hayFirma">
                <i :class="isLoading ? 'fas fa-spinner fa-spin' : (yaAceptado ? 'fas fa-check-circle' : 'fas fa-file-signature')"></i>
                <span class="btn-text">{{ isLoading ? 'Procesando...' : (yaAceptado ? 'Ya Aceptado' : 'Aceptar') }}</span>
            </button>
        </div>
    </div>
</div>
</template>

<script>
import axios from 'axios';
import config from '../config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default {
    name: 'TerminosCondicionesModal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        codigoInventarioActual: {
            type: String,
            required: true
        },
        datosResumen: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            observacion: '',
            isLoading: false,
            isGeneratingPDF: false,
            yaAceptado: false,
            dibujando: false,
            lastX: 0,
            lastY: 0,
            ctx: null,
            hayFirma: false
        };
    },
    watch: {
        show(newVal) {
            if (newVal) {
                this.observacion = '';
                this.isLoading = false;
                this.hayFirma = false;
                // Inicializar el canvas cuando se muestra el modal
                this.$nextTick(() => {
                    this.initCanvas();
                });
            }
        }
    },
    methods: {
        initCanvas() {
            const canvas = this.$refs.firmaCanvas;
            if (!canvas) return;

            // Configurar el tamaño del canvas para que coincida con el área visible
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            this.ctx = canvas.getContext('2d');
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.strokeStyle = '#0c534c';

            // Limpiar el canvas
            this.limpiarFirma();
        },

        iniciarFirma(event) {
            this.dibujando = true;
            const rect = this.$refs.firmaCanvas.getBoundingClientRect();
            this.lastX = event.clientX - rect.left;
            this.lastY = event.clientY - rect.top;
        },

        dibujarFirma(event) {
            if (!this.dibujando) return;

            const rect = this.$refs.firmaCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();

            this.lastX = x;
            this.lastY = y;

            // Indicar que hay una firma
            this.hayFirma = true;
        },

        // Soporte para pantallas táctiles
        iniciarFirmaTactil(event) {
            event.preventDefault(); // Prevenir desplazamiento
            this.dibujando = true;
            const rect = this.$refs.firmaCanvas.getBoundingClientRect();
            const touch = event.touches[0];
            this.lastX = touch.clientX - rect.left;
            this.lastY = touch.clientY - rect.top;
        },

        dibujarFirmaTactil(event) {
            event.preventDefault(); // Prevenir desplazamiento
            if (!this.dibujando) return;

            const rect = this.$refs.firmaCanvas.getBoundingClientRect();
            const touch = event.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            this.ctx.beginPath();
            this.ctx.moveTo(this.lastX, this.lastY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();

            this.lastX = x;
            this.lastY = y;

            // Indicar que hay una firma
            this.hayFirma = true;
        },

        finalizarFirma() {
            this.dibujando = false;
        },

        limpiarFirma() {
            if (!this.ctx) return;

            this.ctx.clearRect(0, 0, this.$refs.firmaCanvas.width, this.$refs.firmaCanvas.height);

            // Dibujar línea base para la firma
            this.ctx.beginPath();
            this.ctx.moveTo(10, this.$refs.firmaCanvas.height - 10);
            this.ctx.lineTo(this.$refs.firmaCanvas.width - 10, this.$refs.firmaCanvas.height - 10);
            this.ctx.stroke();

            this.hayFirma = false;
        },

        async aceptarTerminos() {
            if (!this.hayFirma) {
                alert('Debe firmar antes de aceptar los términos y condiciones.');
                return;
            }

            this.isLoading = true;
            try {
                // Capturar la firma como una imagen base64
                const firmaDataUrl = this.$refs.firmaCanvas.toDataURL('image/png');

                // Enviar datos en formato plano (sin objeto resumen anidado)
                const data = {
                    codigoInventario: this.codigoInventarioActual,
                    observacion: this.observacion,
                    firma: firmaDataUrl, // Este campo necesitaría ser añadido a tu modelo Terminos

                    
                    faltanteSku: this.datosResumen.faltanteSku,
                    faltanteValor: this.datosResumen.faltanteValor,
                    sobranteSku: this.datosResumen.sobranteSku,
                    sobranteValor: this.datosResumen.sobranteValor,
                    conciliadoSku: this.datosResumen.conciliadoSku,
                    conciliadoValor: this.datosResumen.conciliadoValor
                };

                const response = await axios.post(`${config.BASE_URL}/api/terminos/aceptar`, data, {
                    withCredentials: true
                });

                // Establecer yaAceptado como verdadero para actualizar la UI
                this.yaAceptado = true;

                // Emitir evento de aceptado para que el componente padre actualice su estado
                this.$emit('aceptado', response.data);

                // Cerrar el modal
                this.cerrarModal();
            } catch (error) {
                console.error('Error al aceptar términos:', error);
                alert('Error al aceptar términos y condiciones. Por favor, intente nuevamente.');
            } finally {
                this.isLoading = false;
            }
        },

        async generarPDF() {
            if (!this.hayFirma) {
                alert('Debe firmar antes de generar el PDF.');
                return;
            }

            this.isGeneratingPDF = true;
            try {
                const contentElement = this.$refs.modalContent;
                const canvas = await html2canvas(contentElement, {
                    scale: 2, // Mayor calidad
                    useCORS: true,
                    logging: false
                });

                const imgData = canvas.toDataURL('image/png');

                // Crear un nuevo documento PDF
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Dimensiones del PDF
                const imgWidth = 210; // A4 width en mm
                const pageHeight = 297; // A4 height en mm
                const imgHeight = canvas.height * imgWidth / canvas.width;

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

                // Agregar información adicional al PDF
                pdf.setFontSize(10);
                const fechaActual = new Date().toLocaleString('es-PE');
                pdf.text(`Documento generado el: ${fechaActual}`, 10, pageHeight - 10);

                // Descargar el PDF
                pdf.save(`Terminos_${this.codigoInventarioActual}.pdf`);

            } catch (error) {
                console.error('Error al generar PDF:', error);
                alert('Error al generar el PDF. Por favor, intente nuevamente.');
            } finally {
                this.isGeneratingPDF = false;
            }
        },

        cerrarModal() {
            this.$emit('cerrar');
        },

        formatearPrecio(precio) {
            if (precio == null || isNaN(precio)) {
                return '0.00';
            }
            return new Intl.NumberFormat('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(precio);
        }
    }
};
</script>

<style scoped>
/* Estilos para el área de firma */
.firma-container {
    margin-top: 25px;
    margin-bottom: 25px;
}

.firma-container h3 {
    color: #0c534c;
    font-size: 1.2rem;
    margin-bottom: 15px;
    font-weight: 600;
}

.firma-area {
    position: relative;
    border: 2px dashed #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
    margin-bottom: 15px;
    transition: all 0.3s ease;
}

.firma-area:hover {
    border-color: #0c534c;
    background-color: #f5f9f7;
}

.firma-canvas {
    width: 100%;
    height: 150px;
    cursor: crosshair;
    touch-action: none;
    /* Evita el desplazamiento en pantallas táctiles */
}

.firma-instrucciones {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #999;
    font-size: 0.9rem;
    text-align: center;
    pointer-events: none;
    /* Permitir clics a través del texto */
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.firma-area:hover .firma-instrucciones {
    opacity: 0.4;
}

.firma-botones {
    display: flex;
    justify-content: flex-end;
}

.btn-limpiar-firma {
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 8px 15px;
    font-size: 0.9rem;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
}

.btn-limpiar-firma:hover {
    background-color: #e0e0e0;
    color: #333;
}

.btn-limpiar-firma i {
    font-size: 1rem;
}

/* Estilo para el botón PDF */
.btn-pdf {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    min-width: 140px;
    position: relative;
    overflow: hidden;
    background-color: #e74c3c;
    color: white;
}

.btn-pdf:hover:not(:disabled) {
    background-color: #c0392b;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-pdf:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.btn-pdf i {
    font-size: 1.1rem;
}

/* ===== MODAL OVERLAY ===== */
.modal-overlay {
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
    backdrop-filter: blur(3px);
    animation: fadeIn 0.3s ease;
}

/* ===== MODAL CONTAINER ===== */
.modal-terminos {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.4s ease;
}

/* ===== HEADER SECTION ===== */
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f5f9f7;
}

.modal-header h2 {
    margin: 0;
    color: #0c534c;
    font-size: 1.5rem;
    font-weight: 600;
}

.modal-cerrar {
    background: none;
    border: none;
    color: #666;
    font-size: 1.5rem;
    cursor: pointer;
    transition: color 0.2s, transform 0.2s;
}

.modal-cerrar:hover {
    color: #0c534c;
    transform: scale(1.1);
}

/* ===== BODY SECTION ===== */
.modal-body {
    padding: 25px;
}

.codigo-info {
    margin-bottom: 20px;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s, box-shadow 0.3s;
}

.codigo-info:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.codigo-info h3 {
    margin: 0;
    color: #0c534c;
    font-size: 1.2rem;
    font-weight: 600;
}

/* ===== RESUMEN DATOS SECTION ===== */
.resumen-datos {
    margin-bottom: 25px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border: 1px solid #dee2e6;
    transition: transform 0.3s, box-shadow 0.3s;
}

.resumen-datos:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.resumen-fila {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
    transition: background-color 0.3s;
}

.resumen-fila:last-child {
    border-bottom: none;
}

.resumen-fila:first-child {
    background-color: #0c534c;
    color: white;
    font-weight: bold;
    padding: 15px 12px;
}

.resumen-fila.faltante {
    background-color: #fff2f2;
    border-left: 4px solid #fe5c5c;
}

.resumen-fila.faltante:hover {
    background-color: #ffe6e6;
}

.resumen-fila.sobrante {
    background-color: #fffbee;
    border-left: 4px solid #FFD700;
}

.resumen-fila.sobrante:hover {
    background-color: #fff8e1;
}

.resumen-fila.conciliado {
    background-color: #f2fff5;
    border-left: 4px solid #74d573;
}

.resumen-fila.conciliado:hover {
    background-color: #e8f5e9;
}

.resumen-label,
.resumen-sku,
.resumen-valor {
    padding: 5px 10px;
    display: flex;
    align-items: center;
}

.resumen-label {
    font-weight: 600;
    color: #333;
}

.resumen-valor {
    text-align: right;
    justify-content: flex-end;
    font-weight: 600;
}

/* ===== FORM GROUP ===== */
.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    margin-bottom: 10px;
    font-weight: 600;
    color: #0c534c;
    font-size: 1rem;
}

.modal-textarea {
    width: 100%;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    resize: vertical;
    transition: border-color 0.3s, box-shadow 0.3s;
    min-height: 120px;
    font-family: inherit;
}

.modal-textarea:focus {
    outline: none;
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(12, 83, 76, 0.1);
}

.modal-textarea::placeholder {
    color: #aaa;
}

/* ===== TERMINOS CONTENIDO ===== */
.terminos-contenido {
    margin-bottom: 25px;
}

.terminos-contenido h3 {
    color: #0c534c;
    font-size: 1.2rem;
    margin-bottom: 15px;
    font-weight: 600;
}

.terminos-texto {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e9ecef;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.terminos-texto p {
    margin-top: 0;
    margin-bottom: 15px;
    line-height: 1.5;
    color: #333;
}

.terminos-texto ul {
    padding-left: 20px;
    margin-bottom: 0;
}

.terminos-texto li {
    margin-bottom: 10px;
    line-height: 1.5;
    color: #495057;
}

.terminos-texto li:last-child {
    margin-bottom: 0;
}

/* ===== FOOTER SECTION ===== */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;
    background-color: #f5f9f7;
}

.btn-reset,
.btn-buscar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    min-width: 140px;
    position: relative;
    overflow: hidden;
}

.btn-reset {
    background-color: #f0f0f0;
    color: #666;
    border: 1px solid #ddd;
}

.btn-reset:hover:not(:disabled) {
    background-color: #e0e0e0;
    color: #333;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn-buscar {
    background-color: #0c534c;
    color: white;
}

.btn-buscar:hover:not(:disabled) {
    background-color: #0a4540;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-reset:disabled,
.btn-buscar:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.btn-reset i,
.btn-buscar i {
    font-size: 1.1rem;
}

.btn-text {
    font-weight: 500;
}

/* ===== ANIMATIONS ===== */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideUp {
    from {
        transform: translateY(30px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* ===== RESPONSIVE DESIGN ===== */
@media (max-width: 768px) {
    .modal-terminos {
        width: 95%;
        max-width: none;
        max-height: 95vh;
    }

    .modal-header {
        padding: 15px;
    }

    .modal-body {
        padding: 15px;
    }

    .btn-reset,
    .btn-buscar {
        padding: 10px 15px;
        font-size: 0.9rem;
        min-width: auto;
    }

    .resumen-fila {
        padding: 10px 8px;
    }

    .resumen-label,
    .resumen-sku,
    .resumen-valor {
        padding: 4px 6px;
        font-size: 0.9rem;
    }
}
</style>
