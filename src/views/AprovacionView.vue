<template>
<div class="confirmacion-container">
    <div class="page-header animate__animated animate__fadeIn">
        <h2>Confirmación de Términos de Inventario</h2>
        <div class="subtitle">Centro de Aprobacion de Inventario</div>
    </div>

    <div v-if="error" class="error-alert animate__animated animate__shakeX">
        <i class="fas fa-exclamation-circle"></i>
        <span>{{ error }}</span>
    </div>

    <div v-if="loading" class="loading-container animate__animated animate__fadeIn">
        <div class="spinner"></div>
        <p>Cargando términos...</p>
    </div>

    <div v-else class="terms-list">
        <div v-if="filteredTerminos.length === 0" class="empty-state animate__animated animate__fadeIn">
            <i class="fas fa-file-alt"></i>
            <p>No hay términos de inventario pendientes de aprobación</p>
        </div>

        <!-- Filtros -->
        <div class="filter-section animate__animated animate__fadeIn">
            <div class="filter-toggle" @click="showFilters = !showFilters">
                <span>Filtros</span>
                <i :class="showFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
            </div>

            <div class="filter-options" v-show="showFilters" v-if="terminos.length > 0">
                <div class="filter-option">
                    <label>
                        <input type="checkbox" v-model="mostrarAceptados">
                        <span>Mostrar términos aceptados</span>
                    </label>
                </div>
                <div class="filter-option">
                    <label>
                        <input type="checkbox" v-model="mostrarNoAceptados">
                        <span>Mostrar términos no aceptados</span>
                    </label>
                </div>
                <div class="filter-option">
                    <label>
                        <input type="checkbox" v-model="mostrarPendientes">
                        <span>Mostrar términos pendientes</span>
                    </label>
                </div>
            </div>
        </div>

        <transition-group name="list-animation" tag="div" class="terms-cards">
            <div v-for="termino in filteredTerminos" :key="termino.id" class="term-card animate__animated animate__fadeIn" :class="{'expanded': expandedId === termino.id, 'confirmed': termino.confirmado}" :data-id="termino.id">
                <div class="term-status-indicator" :class="getStatusClass(termino)"></div>

                <div class="term-header" @click="toggleExpand(termino.id)">
                    <div class="term-title">
                        <i class="fas fa-file-signature"></i>
                        <span>Código: {{ termino.codigoInventario }}</span>
                    </div>
                    <div class="term-status" v-if="termino.confirmado">
                        <span :class="respuestas[termino.id] === 'Aceptado' ? 'status-accepted' : 'status-rejected'">
                            <i :class="respuestas[termino.id] === 'Aceptado' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                            {{ respuestas[termino.id] }}
                        </span>
                    </div>
                    <div class="expand-icon">
                        <i :class="expandedId === termino.id ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
                    </div>
                </div>

                <div class="term-body" v-show="expandedId === termino.id">
                    <div class="term-details">

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.05s">
                            <div class="detail-label">ID:</div>
                            <div class="detail-value">{{ termino.id }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.1s">
                            <div class="detail-label">Fecha Aceptación:</div>
                            <div class="detail-value">{{ termino.fechaAceptacion }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.15s">
                            <div class="detail-label">Usuario ID:</div>
                            <div class="detail-value">{{ termino.usuarioId || 'Sin usuario' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.2s">
                            <div class="detail-label">Faltante SKU:</div>
                            <div class="detail-value">{{ termino.faltanteSku || 'Sin Faltante SKU' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.25s">
                            <div class="detail-label">Sobrante SKU:</div>
                            <div class="detail-value">{{ termino.sobranteSku || 'Sin Sobrante SKU' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.3s">
                            <div class="detail-label">Conciliado SKU:</div>
                            <div class="detail-value">{{ termino.conciliadoSku || 'Sin Conciliado SKU' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.35s">
                            <div class="detail-label">Faltante Valor:</div>
                            <div class="detail-value">S/. {{ termino.faltanteValor ? formatearPrecio(termino.faltanteValor) : '0.0' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.4s">
                            <div class="detail-label">Sobrante Valor:</div>
                            <div class="detail-value">S/. {{ termino.sobranteValor ? formatearPrecio(termino.sobranteValor) : '0.0' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.45s">
                            <div class="detail-label">Conciliado Valor:</div>
                            <div class="detail-value">S/. {{ termino.conciliadoValor ? formatearPrecio(termino.conciliadoValor) : '0.0' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.5s">
                            <div class="detail-label">Centro:</div>
                            <div class="detail-value">{{ termino.centro || 'Sin centro' }}</div>
                        </div>

                        <div class="detail-row animate__animated animate__fadeIn" style="animation-delay: 0.55s">
                            <div class="detail-label">Observación:</div>
                            <div class="detail-value observation-text">{{ termino.observacion || 'Sin observaciones' }}</div>
                        </div>

                        <div class="response-section animate__animated animate__fadeIn" style="animation-delay: 0.6s">
                            <div class="response-label">
                                <span v-if="!termino.confirmado">Respuesta del Jefe Zonal:</span>
                                <span v-else>Respuesta Registrada:</span>
                            </div>
                            <div v-if="!termino.confirmado" class="response-options">
                                <!-- Botón de aceptar -->
                                <button class="option-button accept" :class="{'selected': respuestas[termino.id] === 'Aceptado'}" @click="seleccionarRespuesta(termino.id, 'Aceptado')">
                                    <i class="fas fa-check-circle"></i>
                                    <span>Aceptado</span>
                                </button>

                                <!-- Modal -->
                                <div v-if="mostrarModal" class="modal-overlay">
                                    <div class="modal-content">
                                        <h3>Confirmación</h3>
                                        <p>
                                            Usted se compromete, junto a su encargado, en dar constancia de que acepta los faltantes o sobrantes que pueda haber.
                                        </p>
                                        <button @click="cerrarModal">Aceptar</button>
                                    </div>
                                </div>

                                <button class="option-button reject" :class="{'selected': respuestas[termino.id] === 'No Aceptado'}" @click="seleccionarRespuesta(termino.id, 'No Aceptado')">
                                    <i class="fas fa-times-circle"></i>
                                    <span>No Aceptado</span>
                                </button>
                            </div>
                            <div v-else class="response-result">
                                <div class="response-badge" :class="respuestas[termino.id] === 'Aceptado' ? 'accepted' : 'rejected'">
                                    <i :class="respuestas[termino.id] === 'Aceptado' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                                    <span>{{ respuestas[termino.id] }}</span>
                                </div>
                                <div class="confirmation-date">
                                    <i class="fas fa-calendar-check"></i>
                                    <span>Confirmado el: {{ termino.fechaConfirmacion || new Date().toLocaleDateString('es-PE') }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="action-section animate__animated animate__fadeIn" style="animation-delay: 0.65s">
                            <button v-if="!termino.confirmado" @click="confirmar(termino.id)" class="confirm-button" :disabled="!respuestas[termino.id]">
                                <i class="fas fa-paper-plane"></i>
                                <span>Enviar Confirmación</span>
                            </button>

                            <button v-else @click="generarPDFIndividual(termino)" class="download-button">
                                <i class="fas fa-file-download"></i>
                                <span>Descargar Confirmación</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </transition-group>

        <!-- Botón para generar PDF global-->
        <div class="pdf-section animate__animated animate__fadeIn" v-if="terminos.length > 0">
            <button @click="generarPDF" class="pdf-button">
                <i class="fas fa-file-pdf"></i>
                <span>{{ isGeneratingPDF ? 'Generando PDF...' : 'Descargar Resumen PDF' }}</span>
            </button>
        </div>
    </div>
</div>
</template>

<script>
import {
    ref,
    onMounted,
    computed
} from 'vue'
import axios from 'axios';
import config from '../config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default {
    name: 'ConfirmacionTerminos',
    setup() {
        const terminos = ref([]);
        const respuestas = ref({});
        const loading = ref(true);
        const error = ref(null);
        const expandedId = ref(null);
        const isGeneratingPDF = ref(false);
        const showFilters = ref(false);
        const mostrarAceptados = ref(true);
        const mostrarNoAceptados = ref(true);
        const mostrarPendientes = ref(true);

        // Configuración global de axios para incluir credenciales
        axios.defaults.withCredentials = true;

        // Filtrar términos según los filtros activos
        const filteredTerminos = computed(() => {
            return terminos.value.filter(termino => {
                if (termino.confirmado) {
                    if (respuestas.value[termino.id] === 'Aceptado') {
                        return mostrarAceptados.value;
                    } else {
                        return mostrarNoAceptados.value;
                    }
                } else {
                    return mostrarPendientes.value;
                }
            });
        });

        const getStatusClass = (termino) => {
            if (!termino.confirmado) return 'status-pending';
            return respuestas.value[termino.id] === 'Aceptado' ? 'status-accepted' : 'status-rejected';
        };

        const toggleExpand = (id) => {
            // Animación para cerrar el elemento anterior expandido
            if (expandedId.value && expandedId.value !== id) {
                const prevCard = document.querySelector(`.term-card[data-id="${expandedId.value}"]`);
                if (prevCard) {
                    prevCard.classList.add('animate__animated', 'animate__fadeOutUp');
                    setTimeout(() => {
                        prevCard.classList.remove('animate__animated', 'animate__fadeOutUp');
                        expandedId.value = id;
                    }, 300);
                } else {
                    expandedId.value = id;
                }
            } else {
                expandedId.value = expandedId.value === id ? null : id;
            }

            // Animación para el nuevo elemento expandido
            if (expandedId.value === id) {
                setTimeout(() => {
                    const card = document.querySelector(`.term-card[data-id="${id}"] .term-body`);
                    if (card) {
                        card.classList.add('animate__animated', 'animate__fadeIn');
                        setTimeout(() => {
                            card.classList.remove('animate__animated', 'animate__fadeIn');
                        }, 500);
                    }
                }, 50);
            }
        };

        const seleccionarRespuesta = (id, respuesta) => {
            respuestas.value[id] = respuesta;

            // Efecto visual de selección con animación
            const button = document.querySelector(`.term-card[data-id="${id}"] .option-button.${respuesta.toLowerCase() === 'aceptado' ? 'accept' : 'reject'}`);
            if (button) {
                button.classList.add('animate__animated', 'animate__heartBeat');
                setTimeout(() => {
                    button.classList.remove('animate__animated', 'animate__heartBeat');
                }, 1000);
            }
        };
        const formatearPrecio = (precio) => {
            if (precio == null || isNaN(precio)) {
                return '0.00';
            }
            return new Intl.NumberFormat('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(precio);
        };
        const obtenerTerminos = async () => {
            loading.value = true;
            error.value = null;

            try {
                console.log('Realizando petición a:', `${config.BASE_URL}/api/terminos/centro`);

                const response = await axios.get(`${config.BASE_URL}/api/terminos/centro`, {
                    withCredentials: true
                });

                console.log('Respuesta recibida:', response.data);

                // Marcar términos como confirmados si ya tienen respuesta
                terminos.value = response.data.map(termino => {
                    const confirmado = termino.respuesta && termino.respuesta !== '';
                    return {
                        ...termino,
                        confirmado
                    };
                });

                // Inicializar respuestas con valores existentes
                response.data.forEach(t => {
                    respuestas.value[t.id] = t.respuesta || '';
                });

                // Si hay términos, expandir el primero automáticamente
                if (response.data.length > 0) {
                    expandedId.value = response.data[0].id;
                }
            } catch (err) {
                console.error('Error al obtener términos:', err);

                if (err.response) {
                    console.error('Datos de error:', err.response.data);
                    console.error('Estado de error:', err.response.status);

                    if (err.response.status === 401 || err.response.status === 403) {
                        error.value = 'No tienes permisos para acceder a estos datos. La sesión podría haber expirado.';
                    } else {
                        error.value = `Error del servidor: ${err.response.status} - ${err.message}`;
                    }
                } else if (err.request) {
                    error.value = 'No se pudo conectar con el servidor. Verifica tu conexión.';
                } else {
                    error.value = `Error de configuración: ${err.message}`;
                }
            } finally {
                loading.value = false;
            }
        };

        const confirmar = async (id) => {
            if (!respuestas.value[id]) {
                mostrarNotificacion('Debe seleccionar una respuesta antes de confirmar.', 'warning');
                return;
            }

            try {
                // Enviar directamente el texto de la respuesta
                const textoRespuesta = respuestas.value[id];

                console.log('Enviando confirmación:', textoRespuesta);

                // Mostrar animación de carga en el botón
                const button = document.querySelector(`.term-card[data-id="${id}"] .confirm-button`);
                if (button) {
                    button.classList.add('loading');
                    button.disabled = true;
                }

                const response = await axios.patch(`${config.BASE_URL}/api/terminos/${id}/confirmacion`, textoRespuesta, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                });

                console.log('Respuesta de confirmación:', response.data);

                // Actualizar estado local sin cerrar el panel ni recargar
                const terminoIndex = terminos.value.findIndex(t => t.id === id);
                if (terminoIndex !== -1) {
                    const updatedTermino = {
                        ...terminos.value[terminoIndex]
                    };
                    updatedTermino.confirmado = true;
                    updatedTermino.fechaConfirmacion = new Date().toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    terminos.value[terminoIndex] = updatedTermino;
                }

                // Mostrar notificación de éxito con animación
                mostrarNotificacion('Confirmación enviada con éxito', 'success');

                // Animación de confirmación exitosa
                const card = document.querySelector(`.term-card[data-id="${id}"]`);
                if (card) {
                    card.classList.add('animate__animated', 'animate__pulse');
                    setTimeout(() => {
                        card.classList.remove('animate__animated', 'animate__pulse');
                    }, 1000);
                }
            } catch (err) {
                console.error('Error al confirmar término:', err);

                if (err.response) {
                    mostrarNotificacion(`Error: ${err.response.status} - ${err.message}`, 'error');
                } else if (err.request) {
                    mostrarNotificacion('No se pudo conectar con el servidor', 'error');
                } else {
                    mostrarNotificacion(`Error: ${err.message}`, 'error');
                }
            } finally {
                // Quitar animación de carga
                const button = document.querySelector(`.term-card[data-id="${id}"] .confirm-button`);
                if (button) {
                    button.classList.remove('loading');
                    button.disabled = false;
                }
            }
        };

        const mostrarNotificacion = (mensaje, tipo) => {
            // Crear elemento de notificación
            const notificacion = document.createElement('div');
            notificacion.className = `notificacion ${tipo} animate__animated animate__slideInRight`;

            const icono = document.createElement('i');
            icono.className = getNotificationIcon(tipo);

            const texto = document.createElement('span');
            texto.textContent = mensaje;

            notificacion.appendChild(icono);
            notificacion.appendChild(texto);

            document.body.appendChild(notificacion);

            // Remover después de 3 segundos
            setTimeout(() => {
                notificacion.classList.remove('animate__slideInRight');
                notificacion.classList.add('animate__slideOutRight');
                setTimeout(() => {
                    document.body.removeChild(notificacion);
                }, 500);
            }, 3000);
        };

        const getNotificationIcon = (tipo) => {
            switch (tipo) {
                case 'success':
                    return 'fas fa-check-circle';
                case 'error':
                    return 'fas fa-exclamation-circle';
                case 'warning':
                    return 'fas fa-exclamation-triangle';
                default:
                    return 'fas fa-info-circle';
            }
        };

        const generarPDFIndividual = async (termino) => {
            isGeneratingPDF.value = true;

            try {
                // Animación de carga
                const button = document.querySelector(`.term-card[data-id="${termino.id}"] .download-button`);
                if (button) {
                    button.classList.add('loading');
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Generando...</span>';
                }

                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Encabezado
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor(12, 83, 76);
                doc.text('Confirmación de Término de Inventario', 105, 20, {
                    align: 'center'
                });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.setTextColor(80, 80, 80);
                doc.text('Centro de Distribución', 105, 30, {
                    align: 'center'
                });

                // Información del término
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(12, 83, 76);
                doc.text(`Código: ${termino.codigoInventario}`, 15, 50);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);

                let yPos = 60;
                const detalles = [{
                        label: 'ID',
                        value: termino.id
                    },
                    {
                        label: 'Fecha Aceptación',
                        value: termino.fechaAceptacion
                    },
                    {
                        label: 'Usuario ID',
                        value: termino.usuarioId || 'Sin usuario'
                    },
                    {
                        label: 'Centro',
                        value: termino.centro || 'Sin centro'
                    },
                    {
                        label: 'Faltante SKU',
                        value: termino.faltanteSku || 'Sin Faltante SKU'
                    },
                    {
                        label: 'Sobrante SKU',
                        value: termino.sobranteSku || 'Sin Sobrante SKU'
                    },
                    {
                        label: 'Conciliado SKU',
                        value: termino.conciliadoSku || 'Sin Conciliado SKU'
                    },
                    {
                        label: 'Faltante Valor',
                        value: termino.faltanteValor || 'Sin valor'
                    },
                    {
                        label: 'Sobrante Valor',
                        value: termino.sobranteValor || 'Sin valor'
                    },
                    {
                        label: 'Conciliado Valor',
                        value: termino.conciliadoValor || 'Sin valor'
                    }
                ];

                detalles.forEach(detalle => {
                    doc.setFont('helvetica', 'bold');
                    doc.text(`${detalle.label}: `, 20, yPos);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`${detalle.value}`, 80, yPos);
                    yPos += 10;
                });

                // Observación
                yPos += 5;
                doc.setFont('helvetica', 'bold');
                doc.text('Observación:', 20, yPos);
                yPos += 8;

                const observacion = termino.observacion || 'Sin observaciones';
                const observacionLines = doc.splitTextToSize(observacion, 170);
                doc.setFont('helvetica', 'normal');
                doc.text(observacionLines, 20, yPos);

                yPos += (observacionLines.length * 6) + 15;

                // Confirmación
                doc.setFillColor(respuestas.value[termino.id] === 'Aceptado' ? 39 : 231,
                    respuestas.value[termino.id] === 'Aceptado' ? 174 : 76,
                    respuestas.value[termino.id] === 'Aceptado' ? 96 : 60);
                doc.roundedRect(20, yPos - 5, 170, 20, 3, 3, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setTextColor(255, 255, 255);
                doc.text(`RESPUESTA: ${respuestas.value[termino.id]}`, 105, yPos + 5, {
                    align: 'center'
                });

                yPos += 30;

                // Fecha de confirmación
                doc.setTextColor(80, 80, 80);
                doc.setFontSize(10);
                doc.text(`Confirmado el: ${termino.fechaConfirmacion || new Date().toLocaleDateString('es-PE')}`, 105, yPos, {
                    align: 'center'
                });

                // Pie de página
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text('Documento oficial de confirmación de inventario', 105, 285, {
                    align: 'center'
                });

                // Guardar PDF
                doc.save(`Confirmacion_Término_${termino.codigoInventario}.pdf`);

                mostrarNotificacion('PDF generado con éxito', 'success');
            } catch (error) {
                console.error('Error al generar PDF individual:', error);
                mostrarNotificacion('Error al generar PDF', 'error');
            } finally {
                isGeneratingPDF.value = false;

                // Restaurar botón
                const button = document.querySelector(`.term-card[data-id="${termino.id}"] .download-button`);
                if (button) {
                    button.classList.remove('loading');
                    button.disabled = false;
                    button.innerHTML = '<i class="fas fa-file-download"></i><span>Descargar Confirmación</span>';
                }
            }
        };

        const generarPDF = async () => {
            isGeneratingPDF.value = true;
            try {
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Configurar estilo del documento
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor(12, 83, 76); // Color #0c534c
                doc.text('Confirmación de Términos de Inventario', 105, 20, {
                    align: 'center'
                });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.setTextColor(80, 80, 80);
                doc.text('Centro de Distribución', 105, 30, {
                    align: 'center'
                });

                // Añadir fecha
                const fechaActual = new Date().toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                doc.setFontSize(10);
                doc.text(`Fecha: ${fechaActual}`, 195, 10, {
                    align: 'right'
                });

                // Añadir línea divisoria
                doc.setDrawColor(12, 83, 76);
                doc.setLineWidth(0.5);
                doc.line(15, 35, 195, 35);

                let yPosition = 50;

                // Sección de resumen
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(12, 83, 76);
                doc.text('Resumen de Confirmaciones', 105, yPosition, {
                    align: 'center'
                });

                yPosition += 10;

                // Información de resumen
                const totalTerminos = terminos.value.length;
                const terminosAceptados = terminos.value.filter(t => t.confirmado && respuestas.value[t.id] === 'Aceptado').length;
                const terminosRechazados = terminos.value.filter(t => t.confirmado && respuestas.value[t.id] === 'No Aceptado').length;
                const terminosPendientes = terminos.value.filter(t => !t.confirmado).length;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.setTextColor(60, 60, 60);
                doc.text(`Total de términos: ${totalTerminos}`, 20, yPosition);
                yPosition += 8;
                doc.text(`Términos aceptados: ${terminosAceptados}`, 20, yPosition);
                yPosition += 8;
                doc.text(`Términos no aceptados: ${terminosRechazados}`, 20, yPosition);
                yPosition += 8;
                doc.text(`Términos pendientes: ${terminosPendientes}`, 20, yPosition);

                yPosition += 20;

                // Iterar sobre los términos y añadirlos al PDF
                for (const termino of filteredTerminos.value) {
                    // Verificar si necesitamos una nueva página
                    if (yPosition > 250) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    // Encabezado del término
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(12);
                    doc.setTextColor(12, 83, 76);
                    doc.text(`Código: ${termino.codigoInventario}`, 15, yPosition);

                    // Estado de confirmación
                    if (termino.confirmado) {
                        doc.setFillColor(respuestas.value[termino.id] === 'Aceptado' ? 39 : 231,
                            respuestas.value[termino.id] === 'Aceptado' ? 174 : 76,
                            respuestas.value[termino.id] === 'Aceptado' ? 96 : 60);
                        doc.roundedRect(160, yPosition - 5, 30, 10, 2, 2, 'F');

                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(8);
                        doc.text(respuestas.value[termino.id], 175, yPosition + 2, {
                            align: 'center'
                        });
                    } else {
                        doc.setFillColor(241, 196, 15);
                        doc.roundedRect(160, yPosition - 5, 30, 10, 2, 2, 'F');

                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(8);
                        doc.text('Pendiente', 175, yPosition + 2, {
                            align: 'center'
                        });
                    }

                    // Detalles
                    yPosition += 10;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.setTextColor(60, 60, 60);
                    doc.text(`ID: ${termino.id}`, 15, yPosition);

                    yPosition += 6;

                    // Observaciones (versión abreviada)
                    const observacion = termino.observacion || 'Sin observaciones';
                    // Tomar sólo los primeros 100 caracteres de la observación
                    const observacionCorta = observacion.length > 100 ? observacion.substring(0, 100) + '...' : observacion;
                    doc.text(`Observación: ${observacionCorta}`, 15, yPosition);

                    // Añadir línea divisoria
                    yPosition += 10;
                    doc.setDrawColor(200, 200, 200);
                    doc.setLineWidth(0.2);
                    doc.line(15, yPosition, 195, yPosition);

                    yPosition += 15;
                }

                // Pie de página
                const totalPages = doc.internal.getNumberOfPages();
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Página ${i} de ${totalPages}`, 105, 285, {
                        align: 'center'
                    });
                }

                // Guardar PDF
                doc.save(`Confirmacion_Terminos_${new Date().toISOString().slice(0, 10)}.pdf`);

                mostrarNotificacion('PDF generado con éxito', 'success');
            } catch (error) {
                console.error('Error al generar PDF:', error);
                mostrarNotificacion('Error al generar PDF', 'error');
            } finally {
                isGeneratingPDF.value = false;
            }
        };

        // Cargar datos al montar el componente
        onMounted(() => {
            // Añadir animaciones de entrada
            document.querySelector('.confirmacion-container').classList.add('animate__animated', 'animate__fadeIn');

            // Cargar datos
            obtenerTerminos();
        });

        return {
            terminos,
            filteredTerminos,
            respuestas,
            loading,
            error,
            expandedId,
            isGeneratingPDF,
            showFilters,
            mostrarAceptados,
            mostrarNoAceptados,
            mostrarPendientes,
            toggleExpand,
            seleccionarRespuesta,
            confirmar,
            generarPDF,
            generarPDFIndividual,
            getStatusClass,
            formatearPrecio,
            mostrarModal: false,
            respuestas: {}
        };
    }
};
</script>

<style scoped>
/* Importar animate.css */
@import 'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css';

/* Estilos generales */
.confirmacion-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f9f9f9;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: all 0.5s ease;
}

.page-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 2px solid #0c534c;
    position: relative;
}

.page-header h2 {
    color: #0c534c;
    font-size: 1.8rem;
    margin: 0 0 5px 0;
    font-weight: 600;
}

.page-header .subtitle {
    color: #666;
    font-size: 1.1rem;
}

.page-header::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 4px;
    background-color: #0c534c;
    border-radius: 2px;
}

/* Filtros */
.filter-section {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
    overflow: hidden;
}

.filter-toggle {
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f5f9f7;
    cursor: pointer;
    font-weight: 600;
    color: #0c534c;
    transition: all 0.3s ease;
}

.filter-toggle:hover {
    background-color: #e8f2ef;
}

.filter-options {
    padding: 15px;
    background-color: white;
    border-top: 1px solid #eee;
    transition: max-height 0.3s ease, padding 0.3s ease;
}

.filter-option {
    margin-bottom: 10px;
}

.filter-option label {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
}

.filter-option label:hover {
    color: #0c534c;
}

.filter-option input[type="checkbox"] {
    margin-right: 10px;
    width: 18px;
    height: 18px;
    accent-color: #0c534c;
}

/* Estado de carga */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: #666;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(12, 83, 76, 0.2);
    border-radius: 50%;
    border-top-color: #0c534c;
    animation: spin 1.2s ease-in-out infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Estado vacío */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 0;
    color: #999;
}

.empty-state i {
    font-size: 3rem;
    margin-bottom: 20px;
    color: #ccc;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-10px);
    }

    100% {
        transform: translateY(0px);
    }
}

.empty-state p {
    font-size: 1.1rem;
}

/* Error */
.error-alert {
    background-color: #ffeaea;
    color: #e74c3c;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-left: 4px solid #e74c3c;
    font-size: 0.95rem;
}

.error-alert i {
    font-size: 1.2rem;
}

/* Tarjetas de términos */
.terms-cards {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.term-card {
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
    border-left: 4px solid #0c534c;
    position: relative;
}

.term-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.term-card.expanded {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.term-card.confirmed {
    border-left-color: #27ae60;
}

.term-card.confirmed.expanded {
    box-shadow: 0 10px 25px rgba(39, 174, 96, 0.15);
}

/* Indicador de estado */
.term-status-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background-color: #f1c40f;
    /* Por defecto, pendiente */
}

.term-status-indicator.status-accepted {
    background-color: #27ae60;
}

.term-status-indicator.status-rejected {
    background-color: #e74c3c;
}

.term-header {
    padding: 18px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    background-color: #f5f9f7;
    transition: all 0.3s ease;
}

.term-header:hover {
    background-color: #e8f2ef;
}

.term-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    color: #0c534c;
    font-size: 1.1rem;
}

.term-title i {
    color: #0c534c;
    transition: transform 0.3s ease;
}

.term-card:hover .term-title i {
    transform: translateX(5px);
}

.term-status {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    font-weight: 600;
}

.term-status .status-accepted {
    color: #27ae60;
}

.term-status .status-rejected {
    color: #e74c3c;
}

.expand-icon {
    color: #0c534c;
    transition: transform 0.3s ease;
}

.expanded .expand-icon i {
    transform: rotate(180deg);
}

.term-body {
    padding: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.expanded .term-body {
    padding: 20px;
    max-height: 1000px;
    border-top: 1px solid #eee;
}

.term-details {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.detail-row {
    display: flex;
    gap: 10px;
    transition: all 0.3s ease;
}

.detail-row:hover {
    background-color: #f8f8f8;
    padding: 5px;
    border-radius: 5px;
    transform: translateX(5px);
}

.detail-label {
    font-weight: 600;
    color: #555;
    min-width: 120px;
}

.observation-text {
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 6px;
    border-left: 3px solid #ddd;
    color: #666;
    line-height: 1.5;
    transition: all 0.3s ease;
}

.observation-text:hover {
    border-left-color: #0c534c;
    background-color: #f0f7f5;
}

/* Sección de respuesta */
.response-section {
    margin-top: 10px;
    padding-top: 15px;
    border-top: 1px dashed #eee;
}

.response-label {
    font-weight: 600;
    color: #0c534c;
    margin-bottom: 12px;
    font-size: 1.05rem;
}

.response-options {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.option-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 8px;
    background-color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
    font-weight: 500;
    position: relative;
    overflow: hidden;
}

.option-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: currentColor;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
}

.option-button:hover::before {
    opacity: 0.05;
}

.option-button i,
.option-button span {
    position: relative;
    z-index: 1;
}

.option-button.accept {
    color: #27ae60;
    border-color: #27ae60;
}

.option-button.reject {
    color: #e74c3c;
    border-color: #e74c3c;
}

.option-button.selected {
    color: white;
    transform: scale(1.05);
}

.option-button.accept.selected {
    background-color: #27ae60;
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.option-button.reject.selected {
    background-color: #e74c3c;
    box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.option-button i {
    font-size: 1.2rem;
}

/* Resultado de respuesta */
.response-result {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.response-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.95rem;
    min-width: 150px;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    animation: pulse 2s infinite;
}

.response-badge.accepted {
    background-color: #d4f3e0;
    color: #27ae60;
}

.response-badge.rejected {
    background-color: #f9d7d5;
    color: #e74c3c;
}

.confirmation-date {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #777;
    font-size: 0.9rem;
    font-style: italic;
    margin-top: 5px;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.05);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
    }
}

/* Sección de acción */
.action-section {
    display: flex;
    justify-content: flex-end;
    margin-top: 15px;
}

.confirm-button,
.download-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    min-width: 200px;
}

.confirm-button {
    background-color: #0c534c;
}

.download-button {
    background-color: #3498db;
}

.confirm-button:hover:not(:disabled),
.download-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.confirm-button:hover:not(:disabled) {
    background-color: #0a4540;
}

.download-button:hover {
    background-color: #2980b9;
}

.confirm-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.confirm-button i,
.download-button i {
    font-size: 1.1rem;
}

.confirm-button.loading,
.download-button.loading {
    pointer-events: none;
}

.confirm-button.loading i,
.download-button.loading i {
    animation: spin 1s linear infinite;
}

/* Botón para limpiar filtros */
.clear-filters {
    background-color: transparent;
    border: none;
    color: #0c534c;
    cursor: pointer;
    font-size: 0.9rem;
    padding: 5px 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 10px;
    transition: all 0.3s ease;
}

.clear-filters:hover {
    color: #0a4540;
    text-decoration: underline;
}

/* Sección de PDF */
.pdf-section {
    display: flex;
    justify-content: center;
    margin-top: 30px;
}

.pdf-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 30px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1.05rem;
    min-width: 250px;
    position: relative;
    overflow: hidden;
}

.pdf-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: all 0.6s ease;
}

.pdf-button:hover::before {
    left: 100%;
}

.pdf-button:hover {
    background-color: #c0392b;
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(231, 76, 60, 0.3);
}

.pdf-button i {
    font-size: 1.2rem;
}

/* Notificaciones */
.notificacion {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    padding: 15px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 1000;
    max-width: 350px;
}

.notificacion.success {
    border-left: 4px solid #27ae60;
}

.notificacion.error {
    border-left: 4px solid #e74c3c;
}

.notificacion.warning {
    border-left: 4px solid #f1c40f;
}

.notificacion.success i {
    color: #27ae60;
}

.notificacion.error i {
    color: #e74c3c;
}

.notificacion.warning i {
    color: #f1c40f;
}

.notificacion i {
    font-size: 1.5rem;
}

/* Animaciones adicionales */
@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        transform: translateX(30px);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-20px);
    }

    60% {
        transform: translateY(-10px);
    }
}

/* Animaciones de lista */
.list-animation-enter-active {
    animation: slideIn 0.5s ease forwards;
}

.list-animation-leave-active {
    animation: slideOut 0.5s ease forwards;
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }

    to {
        transform: translateX(-30px);
        opacity: 0;
    }
}

.pulse-animation {
    animation: pulse 0.5s ease;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.03);
    }

    100% {
        transform: scale(1);
    }
}

/* Efectos de hover en botones */
.option-button:active,
.confirm-button:active,
.download-button:active,
.pdf-button:active {
    transform: scale(0.98);
}

/* Responsive */
@media (max-width: 768px) {
    .confirmacion-container {
        padding: 15px;
    }

    .term-title {
        font-size: 1rem;
    }

    .detail-row {
        flex-direction: column;
        gap: 5px;
    }

    .response-options {
        flex-direction: column;
    }

    .confirm-button,
    .download-button,
    .pdf-button {
        width: 100%;
    }

    .term-status {
        display: none;
    }
}

/* Modal de repueesta de aceptacion*/
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background-color: white;
  padding: 25px;
  border-radius: 10px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.modal-content button {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #2e7d32;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
</style>
