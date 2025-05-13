<template>
<div class="inventario-container">
    <div class="PSuperior">
        <h1>REPORTE DE ERI(SKU/VALOR)</h1>
        <Loading :isLoading="isLoading" />

        <div class="filtros-panel">
            <div class="filtro-grupo">
                <div class="filtro-item">
                    <label for="codigoInventario" class="filtro-label">
                        <i class="fas fa-barcode"></i> Código de Inventario
                    </label>
                    <div class="dropdown-container">
                        <select id="codigoInventario" v-model="codigoInventario" class="filtro-input" @change="fetchComparacion">
                            <option value="" disabled>Seleccione un código</option>
                            <option v-for="codigo in codigosInventario" :key="codigo" :value="codigo">
                                {{ codigo }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="filtro-item">
                    <label for="filtroEstado" class="filtro-label">
                        <i class="fas fa-tag"></i> Filtrar por Estado
                    </label>
                    <select id="filtroEstado" v-model="filtroEstado" @change="filtrarDatos" class="filtro-input">
                        <option value="">Todos</option>
                        <option value="Faltante">Faltante</option>
                        <option value="Sobrante">Sobrante</option>
                        <option value="Conciliado">Conciliado</option>
                    </select>
                </div>

                <div class="filtro-item">
                    <label for="filtroProducto" class="filtro-label">
                        <i class="fas fa-box"></i> Filtrar por Producto
                    </label>
                    <div class="input-icon-wrapper">
                        <input type="text" id="filtroProducto" v-model="filtroProducto" @input="filtrarDatos" placeholder="Buscar producto..." class="filtro-input" />
                        <i v-if="filtroProducto" @click="filtroProducto = ''; filtrarDatos()" class="fas fa-times-circle input-clear-icon"></i>
                    </div>
                </div>
            </div>

            <!-- Botones de acción -->
            <div class="filtro-acciones">
                <button @click="filtroEstado = ''; filtroProducto = ''; filtrarDatos()" class="btn-reset">
                    <i class="fas fa-sync-alt"></i>
                    <span class="btn-text">Restablecer</span>
                </button>
                <button @click="mostrarTerminosCondiciones()" :class="['btn-terminos', yaAceptado ? 'btn-aceptado' : 'btn-reset']">
                    <i :class="yaAceptado ? 'fas fa-check-circle' : 'fas fa-file-signature'"></i>
                    <span class="btn-text">
                        {{ yaAceptado ? 'Términos Aceptados' : 'Aceptar Términos y Condiciones' }}
                    </span>
                </button>

                <button @click="exportarCodigoExcel(codigoInventario)" class="btn-buscar">
                    <i class="fas fa-file-export"></i>
                    <span class="btn-text">{{ isExportingCodigo ? 'Exportando...' : 'Exportar por Código Inv.' }}</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Tabla de Precio Total Detallado -->
    <div class="stat-cards" v-if="totals && datosFiltrados.length > 0">
        <div class="stat-card">
            <div class="stat-card-header">
                <div></div>
                <div></div>
                <div class="stat-header-item red">FALTANTE</div>
                <div class="stat-header-item yellow">SOBRANTE</div>
                <div class="stat-header-item green">CONCILIADO</div>
                <div class="stat-header-item">%</div>
            </div>
            <div class="stat-card-row">
                <div class="stat-title">SKU</div>
                <div class="stat-value">{{ totals['Total Inventarios'] || 0 }}</div>
                <div class="stat-value">{{ totals['Faltante'] || 0 }}</div>
                <div class="stat-value">{{ totals['Sobrante'] || 0 }}</div>
                <div class="stat-value">{{ totals['Conciliado'] || 0 }}</div>
                <div class="stat-value">
                    <div class="progress-bar-container">
                        <div class="progress-bar" :style="{ width: calcularPorcentajeConciliado() + '%', backgroundColor: getProgressBarColor() }"></div>
                    </div>
                    {{ formatearPrecio(calcularPorcentajeConciliado()) }}%
                </div>
            </div>
            <div class="stat-card-row">
                <div class="stat-title">VALOR</div>
                <div class="stat-value">S/. {{ formatearPrecio(sumaTotalInventarioEwm()) }}</div>
                <div class="stat-value">S/. {{ formatearPrecio(sumaFaltante()) }}</div>
                <div class="stat-value">S/. {{ formatearPrecio(sumaSobrante()) }}</div>
                <div class="stat-value">S/. {{ formatearPrecio(sumaConciliadoOriginal()) }}</div>
                <div class="stat-value">
                    <div class="progress-bar-container">
                        <div class="progress-bar" :style="{ width: calcularPorcentajeValor() + '%', backgroundColor: getProgressBarColor() }"></div>
                    </div>
                    {{ formatearPrecio(calcularPorcentajeValor()) }}%
                </div>
            </div>
        </div>
    </div>

    <!-- Loading state -->
    <transition name="fade">
        <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <span>Cargando datos...</span>
        </div>
    </transition>

    <!-- Estado vacío -->
    <transition name="fade">
        <div v-if="!isLoading && datosFiltrados.length === 0" class="empty-state">
            <i class="fas fa-box-open empty-icon"></i>
            <p class="empty-text">No se encontraron productos</p>
            <p class="empty-hint">Intenta con otros filtros</p>
        </div>
    </transition>

    <!-- Tabla principal -->
    <transition name="fade">
        <div v-if="!isLoading && datosFiltrados.length > 0" class="table-container" @contextmenu.prevent="mostrarMenu($event)">
            <table class="inventario-table">
                <thead>
                    <tr>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-hashtag"></i> Q
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-box"></i> Producto
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-tag"></i> Estado
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-clipboard-list"></i> D. de Producto
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-building"></i> Propietario
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-tag"></i> Lote
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-ruler"></i> U. Medida
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-barcode"></i> C. de Inventario
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-clipboard-check"></i> T. Registro
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-cubes"></i> Total Tomas
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-not-equal"></i> Diferencia
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-money-bill"></i> V. Inventario
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-tag"></i> Precio Unitario
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-balance-scale"></i> Valor Dif.
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(dato, index) in getPaginatedData()" :key="index" @click="seleccionarFila(dato)" :class="{'row-selected': filaSeleccionada === dato}" class="table-row">
                        <td>{{ dato.CantidaProduc }}</td>
                        <td>{{ dato.producto }}</td>
                        <td :style="{ backgroundColor: estadoColor(dato.totalTomas, dato.totalEwmRegistro), color: 'white' }">
                            {{ estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) }}
                        </td>
                        <td>{{ dato.descripcionProducto }}</td>
                        <td>{{ dato.propietario }}</td>
                        <td>{{ dato.lote }}</td>
                        <td>{{ dato.unidadMedidaBase }}</td>
                        <td>{{ dato.codigoInventario }}</td>
                        <td>{{ dato.totalEwmRegistro }}</td>
                        <td>{{ dato.totalTomas }}</td>
                        <td>{{ calcularDiferencia(dato.totalTomas, dato.totalEwmRegistro) }}</td>
                        <td>S/. {{ formatearPrecio(dato.valorInventario) }}</td>
                        <td>S/. {{ formatearPrecio(dato.PrecioUnitario) }}</td>
                        <td v-if="calcularDiferencia(dato.totalTomas, dato.totalEwmRegistro) === 0">
                            S/. {{ formatearPrecio(dato.valorInventario) }}
                        </td>
                        <td v-else>
                            S/. {{ formatearPrecio(dato.PrecioDif) }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Paginación optimizada -->
            <div class="pagination-container">
                <div class="pagination-info">
                    <span>Página {{ currentPage }} de {{ totalPages }}</span>
                </div>
                <div class="pagination">
                    <button @click="changePage(1)" :disabled="currentPage === 1" class="pagination-btn" title="Primera página">
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="pagination-btn" title="Página anterior">
                        <i class="fas fa-angle-left"></i>
                    </button>

                    <!-- Números de página -->
                    <div class="page-numbers">
                        <button v-for="page in getVisiblePageNumbers()" :key="page" @click="changePage(page)" :class="['page-number', { 'active': currentPage === page }]">
                            {{ page }}
                        </button>
                    </div>

                    <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages" class="pagination-btn" title="Página siguiente">
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button @click="changePage(totalPages)" :disabled="currentPage === totalPages" class="pagination-btn" title="Última página">
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </transition>

    <!-- Menú contextual -->
    <div v-if="mostrarMenuContextual" ref="menuContextual" class="menu-contextual" :style="{ top: menuPos.y + 'px', left: menuPos.x + 'px' }">
        <ul>
            <li @click="abrirModal"><i class="fas fa-comment-alt"></i> Generar Observación</li>
            <li @click="buscarEnHistorial"><i class="fas fa-history"></i> Buscar en Historial</li>
        </ul>
    </div>

    <!-- Modal -->
    <div v-if="mostrarModal" class="modal-overlay">
        <div class="modal-contenido">
            <!-- Encabezado del Modal -->
            <div class="modal-header">
                <h2>Generar Observación</h2>
                <button @click="cerrarModal" class="modal-cerrar">&times;</button>
            </div>

            <!-- Cuerpo del Modal -->
            <div class="modal-body">
                <form @submit.prevent="guardarObservacion">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="producto">Producto:</label>
                            <input type="text" id="producto" v-model="observacion.producto" class="modal-input" required readonly />
                        </div>

                        <div class="form-group">
                            <label for="estado_pro">Estado:</label>
                            <input type="text" id="estado_pro" v-model="observacion.estado_pro" class="modal-input" readonly />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="descripcion_pro">Descripción:</label>
                            <input type="text" id="descripcion_pro" v-model="observacion.descripcion_pro" class="modal-input" required readonly />
                        </div>

                        <div class="form-group">
                            <label for="centropro">Centro:</label>
                            <input type="text" id="centropro" v-model="observacion.centropro" class="modal-input" readonly />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="lote_pro">Lote:</label>
                            <input type="text" id="lote_pro" v-model="observacion.lote_pro" class="modal-input" readonly />
                        </div>

                        <div class="form-group">
                            <label for="unidad_medida_pro">Unidad de Medida:</label>
                            <input type="text" id="unidad_medida_pro" v-model="observacion.unidad_medida_pro" class="modal-input" readonly />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="codigo_inventario_pro">Código de Inventario:</label>
                            <input type="text" id="codigo_inventario_pro" v-model="observacion.codigo_inventario_pro" class="modal-input" required readonly />
                        </div>

                        <div class="form-group">
                            <label for="diferencia_pro">Diferencia:</label>
                            <input type="number" id="diferencia_pro" v-model="observacion.diferencia_pro" class="modal-input" readonly />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="categoria_obsv">Categoría:</label>
                        <select id="categoria_obsv" v-model="observacion.categoria_obsv" class="modal-input">
                            <option disabled value="">Selecciona una categoría</option>
                            <option v-for="categoria in categorias" :key="categoria" :value="categoria">
                                {{ categoria }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="observacion_obsv">Observación:</label>
                        <textarea id="observacion_obsv" v-model.lazy="observacion.observacion_obsv" class="modal-textarea"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" @click="cerrarModal" class="btn-reset">Cancelar</button>
                        <button type="submit" class="btn-buscar">Guardar Observación</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- TABLA DE HISTORIAL -->
    <div v-if="paginatedData.length > 0" class="history-section">
        <h2 class="history-title">Historial del Producto</h2>
        <div class="table-container">
            <table class="inventario-table history-table">
                <!-- Encabezado de la tabla -->
                <thead>
                    <tr>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-box"></i> Producto
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-clipboard-list"></i> D.Producto
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-tag"></i> Lote
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-ruler"></i> UND
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-barcode"></i> Código Inventario
                            </div>
                        </th>
                        <th>
                            <div class="th-content">
                                <i class="fas fa-calendar-alt"></i> Fecha Inventario
                            </div>
                        </th>
                        <th v-for="(key, invIndex) in Object.keys(((paginatedData[0] || {}).inventarios) || {})" :key="invIndex">
                            <div class="th-content">
                                <i class="fas fa-cubes"></i> Inv-{{ invIndex + 1 }}
                            </div>
                        </th>
                    </tr>
                </thead>

                <!-- Cuerpo de la tabla -->
                <tbody>
                    <tr v-for="(item, index) in paginatedData" :key="index" class="table-row">
                        <!-- Primera fila del grupo -->
                        <template v-if="index === 0">
                            <td class="producto-cell">{{ item.producto }}</td>
                            <td class="descripcion-cell">{{ item.descripcionProducto }}</td>
                            <td class="lote-cell">{{ item.lote || '-' }}</td>
                            <td class="unidad-cell">{{ item.unidadMedidaBase || '-' }}</td>
                        </template>
                        <!-- Resto de filas (vacías) -->
                        <template v-else>
                            <td class="producto-cell empty-cell"></td>
                            <td class="descripcion-cell empty-cell"></td>
                            <td class="lote-cell empty-cell"></td>
                            <td class="unidad-cell empty-cell"></td>
                        </template>

                        <!-- Código de inventario -->
                        <td class="codigo-inventario-cell">{{ item.codigoInventario || '-' }}</td>

                        <!-- Fecha Inventario (calculada según la semana) -->
                        <td class="fecha-inventario-cell">
                            {{ item.codigoInventario ? calcularFechaInventario(item.codigoInventario) : '-' }}
                        </td>

                        <!-- Inventarios -->
                        <td v-for="(key, invIndex) in Object.keys(item.inventarios)" :key="invIndex" class="inventario-cell" :class="{
                                      'bg-green': item.inventarios[key] === 0,
                                      'bg-red': item.inventarios[key] < 0,
                                      'bg-yellow': item.inventarios[key] > 0,
                                      'empty-cell': item.inventarios[key] === undefined || item.inventarios[key] === null
                                    }">
                            {{ item.inventarios[key] !== undefined && item.inventarios[key] !== null ? item.inventarios[key] : '-' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Al final del template, antes de cerrar el div principal -->
    <TerminosCondicionesModal :show="mostrarModalTerminos" 
    :codigoInventarioActual="codigoInventario" :datosResumen="resumenDatosActuales" 
    @aceptado="onTerminosAceptados" @cerrar="onModalTerminosCerrado" />
</div>
</template>

<script>
import axios from 'axios';
import config from '../config';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import Loading from '../components/Loading.vue';
import TerminosCondicionesModal from '../components/TerminosCondicionesModal.vue';

export default {
    components: {
        Loading,
        TerminosCondicionesModal
    },
    data() {
        return {
            //Loading 
            isLoading: false, // Estado de carga
            //Encabezado
            codigoInventario: '',
            datos: [],
            datosFiltrados: [], // Datos filtrados según los filtros
            codigosInventario: ['INVINOP202543', 'INVCICL202532', 'INVCICL202554', 'INVCICL202565', 'INVCICL202576', 'INVCICL202521',
                'INVINOP202587', 'INVCICL202598', 'INVCICL2025109', 'INVCICL20251110', 'INVCICL20251211',
                'INVCICL20251312', 'INVCICL20251413', 'INVCICL20251514', 'INVCONT20251715', 'INVCICL20251817', 'INVCICL20251918'
            ],

            filtroEstado: '', // Estado seleccionado en el filtro
            filtroProducto: '', // Producto seleccionado en el filtro

            //menu -modal
            estiloFilaSeleccionada: {
                backgroundColor: '#c8e6c9', // Color de fondo para la fila seleccionada
                fontWeight: 'bold', // Texto en negrita
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Sombra
                border: '2px solid #4caf50', // Borde verde
            },

            totals: {
                'Total Inventarios': 0,
                'Faltante': 0,
                'Sobrante': 0,
                'Conciliado': 0
            },
            filaSeleccionada: null,
            mostrarMenuContextual: false,
            mostrarModal: false,
            menuPos: {
                x: 0,
                y: 0
            },
            isExportingCodigo: false,
            isExporting: false,
            observacion: {
                producto: '',
                estado_pro: '',
                descripcion_pro: '',
                centropro: '',
                lote_pro: '',
                unidad_medida_pro: '',
                codigo_inventario_pro: '',
                diferencia_pro: '',
                categoria_obsv: '',
                observacion_obsv: ''
            },
            categorias: [
                "Error de Carga",
                "Error de conteos",
                "Duplicado",
                "Error de atención",
                "Error de DI",
                "Por regularizar",
                "Otros",
            ], // Ejemplo de categorías

            //PAGINACION 
            currentPage: 1,
            pageSize: 10,
            totalPages: 1,

            //inventariohistorial
            paginatedData: [],

            //modalterminoCondiciones
            mostrarModalTerminos: false,
            resumenDatosActuales: {
                faltanteSku: 0,
                faltanteValor: 0,
                sobranteSku: 0,
                sobranteValor: 0,
                conciliadoSku: 0,
                conciliadoValor: 0
            }
        };
    },

    methods: {

        convertirFechaADate(fecha) {
            if (!fecha || fecha === 'Fecha no disponible' || fecha === 'Fecha no encontrada' || fecha === 'N/A') {
                return new Date(0); // Fecha mínima para valores inválidos
            }

            // Verificar si es una fecha en formato "MM/DD/YYYY"
            if (fecha.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                const [month, day, year] = fecha.split('/');
                return new Date(year, month - 1, day);
            }

            // Verificar si es un formato como "Enero 2024" 
            const meses = {
                'enero': 0,
                'febrero': 1,
                'marzo': 2,
                'abril': 3,
                'mayo': 4,
                'junio': 5,
                'julio': 6,
                'agosto': 7,
                'septiembre': 8,
                'octubre': 9,
                'noviembre': 10,
                'diciembre': 11
            };

            for (const [nombreMes, indice] of Object.entries(meses)) {
                if (fecha.toLowerCase().includes(nombreMes)) {
                    const year = fecha.match(/\d{4}/)[0];
                    return new Date(parseInt(year), indice, 1);
                }
            }

            // Si no se pudo convertir, retornar fecha mínima
            return new Date(0);
        },
        //mostar modal 
        mostrarTerminosCondiciones() {
            if (!this.codigoInventario) {
                alert('Debe seleccionar un código de inventario');
                return;
            }

            // Solo mostrar el modal si los términos no han sido ya aceptados por el usuario actual
            if (this.yaAceptado) {
                alert('Ya has aceptado los términos y condiciones para este código de inventario.');
                return;
            }

            // Prepara los datos del resumen actual
            this.resumenDatosActuales = {
                faltanteSku: this.totals['Faltante'] || 0,
                faltanteValor: parseFloat(this.sumaFaltante() || 0),
                sobranteSku: this.totals['Sobrante'] || 0,
                sobranteValor: parseFloat(this.sumaSobrante() || 0),
                conciliadoSku: this.totals['Conciliado'] || 0,
                conciliadoValor: parseFloat(this.sumaConciliadoOriginal() || 0)
            };

            this.mostrarModalTerminos = true;
        },

        // Maneja cuando se acepta el modal
        onTerminosAceptados(response) {
            // Actualizar inmediatamente el estado para reflejar que se aceptaron los términos
            this.yaAceptado = true;

            Swal.fire({
                icon: 'success',
                title: '¡Términos aceptados!',
                text: 'Los términos y condiciones han sido aceptados exitosamente.',
                timer: 2000
            });
            // Cerrar el modal después de aceptar
            this.mostrarModalTerminos = false;
        },

        // Maneja cuando se cierra el modal
        onModalTerminosCerrado() {
            this.mostrarModalTerminos = false;
        },
        getVisiblePageNumbers() {
            const maxVisible = window.innerWidth < 768 ? 3 : 5;
            const halfVisible = Math.floor(maxVisible / 2);

            let startPage = Math.max(1, this.currentPage - halfVisible);
            let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

            if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            return Array.from({
                length: endPage - startPage + 1
            }, (_, i) => i + startPage);
        },

        calcularFechaInventario(codigoInventario) {
            switch (codigoInventario) {
                case 'INVCICL202521':
                    return '10/01/2025'; // Antes: 1/1/2025
                case 'INVCICL202532':
                    return '20/01/2025'; // Antes: 6/1/2025
                case 'INVINOP202543':
                    return '25/01/2025'; // Antes: 13/01/2025
                case 'INVCICL202554':
                    return '01/02/2025'; // Antes: 20/01/2025
                case 'INVCICL202565':
                    return '08/02/2025'; // Antes: 27/01/2025
                case 'INVCICL202576':
                    return '15/02/2025'; // Antes: 3/2/2025
                case 'INVINOP202587':
                    return '22/02/2025'; // Antes: 10/2/2025
                case 'INVCICL202598':
                    return '01/03/2025'; // Antes: 17/02/2025
                case 'INVCICL2025109':
                    return '08/03/2025'; // Antes: 24/02/2025
                case 'INVCICL20251110':
                    return '15/03/2025'; // Antes: 3/3/2025
                case 'INVINOP20251211':
                    return '22/03/2025'; // Antes: 10/3/2025
                case 'INVCICL20251312':
                    return '29/03/2025'; // Antes: 17/03/2025
                case 'INVCICL20251413':
                    return '05/04/2025'; // Antes: 24/03/2025
                case 'INVCICL20251514':
                    return '10/04/2025'; // Antes: 31/3/2025
                case 'INVCONT20251716':
                    return '28/04/2025'; // Antes: 14/04/2025
                case 'INVCONT20251715':
                    return '03/05/2025'; // Antes: 21/04/2025
                case 'INVCICL20251918':
                    return '10/05/2025'; // Antes: 28/4/2025
                case 'INVINOP20252019':
                    return '17/05/2025'; // Antes: 5/5/2025
                case 'INVCICL20252120':
                    return '24/05/2025'; // Antes: 12/05/2025
                case 'INVCICL20251211':
                    return '10/03/2025'; // Antes: 19/05/2025
                case 'INVCONT202511':
                    return '03/01/2025'; // Antes: 19/05/2025
                case 'INVCONT20251715':
                    return '25/04/2025'; // Antes: 19/05/2025
                case 'INVGENE2024473':
                    return '27/11/2024'; // Antes: 19/05/2025
                 case 'INVCICL20251817': 
                    return '03/05/2025'; // Antes: 21/04/2025
                default:
                    return 'Fecha no Encontrada'; // Return null for unmatched codes
            }
        },

        /**inventario --------------------------------------------------------------------------------------------*/
        calcularPorcentajeConciliado() {
            return (this.totals['Conciliado'] / this.totals['Total Inventarios']) * 100;
        },
        calcularPorcentajeValor() {
            return (this.sumaConciliadoOriginal() / this.sumaTotalInventarioEwm()) * 100;
        },
        getProgressBarColor() {
            const percentage = (this.totals['Conciliado'] / this.totals['Total Inventarios']) * 100;
            if (percentage < 30) return 'red';
            if (percentage < 70) return 'red';
            return '#4caf50'; // verde
        },
        getProgressBarColor() {
            const percentage = (this.totals['Conciliado'] / this.totals['Total Inventarios']) * 100;
            if (percentage < 30) return 'red';
            if (percentage < 70) return 'yellow';
            return '#4caf50'; // verde
        },
        async buscarEnHistorial() {
            this.mostrarMenuContextual = false;
            if (!this.filaSeleccionada || !this.filaSeleccionada.producto) {
                alert('Por favor, selecciona una fila válida antes de buscar en el historial.');
                return;
            }

            const producto = encodeURIComponent(this.filaSeleccionada.producto);

            try {
                // Realizar la consulta del historial
                const response = await axios.get(`${config.BASE_URL}/api/report?producto=${producto}`, {
                    withCredentials: true,
                    timeout: 5000,
                });

                if (response.status === 200 && Array.isArray(response.data)) {
                    // Process the data to ensure each item has an inventarios property
                    this.paginatedData = response.data.map(item => {
                        return {
                            ...item,
                            // Ensure inventarios exists, default to empty object if not
                            inventarios: item.inventarios || {}
                        };
                    });

                    console.log('Datos recibidos:', this.paginatedData);
                } else {
                    console.warn('La respuesta de la API no tiene el formato esperado:', response.data);
                    alert('Hubo un problema con los datos recibidos.');
                }
            } catch (error) {
                console.error('Error al buscar en el historial:', error);

                if (error.response) {
                    alert(`Error ${error.response.status}: ${error.response.data.message || 'No se pudo obtener el historial'}`);
                } else if (error.request) {
                    alert('No se recibió respuesta del servidor. Verifica tu conexión.');
                } else {
                    alert('Ocurrió un error inesperado al buscar en el historial.');
                }
            }
        },
        /** ---------------------------------------------------------------------------------------------------------*/
        // Modifica el método fetchComparacion en tu componente Vue
        async fetchComparacion() {
            console.log('Código de inventario seleccionado:', this.codigoInventario);
            if (!this.codigoInventario) return; // Evita llamadas innecesarias

            this.isLoading = true; // Mostrar loading antes de la petición

            try {
                // Realizar ambas peticiones en paralelo usando Promise.all
                const [resultadosResponse, estadoResponse] = await Promise.all([
                    // Primera petición: obtener los resultados combinados
                    axios.get(`${config.BASE_URL}/api/hanna/resultadosCombinados`, {
                        withCredentials: true,
                        params: {
                            codigoInventario: this.codigoInventario
                        }
                    }),

                    // Segunda petición: verificar el estado de los términos
                    axios.get(`${config.BASE_URL}/api/terminos/estado/${this.codigoInventario}`, {
                        withCredentials: true
                    })
                ]);

                // Procesar los resultados de inventario
                this.datos = resultadosResponse.data;
                console.log('Datos cargados:', this.datos);

                // Procesar los resultados del estado de términos
                const estadoTerminos = estadoResponse.data;
                console.log('Estado de términos:', estadoTerminos);

                // Actualizar el estado de aceptación en el componente
                this.yaAceptado = estadoTerminos.aceptado || false;

                // Si ya hay términos aceptados, mostrar un mensaje informativo
                if (estadoTerminos.aceptado) {
                    // Opcional: mostrar una notificación o mensaje
                    console.log(`Términos ya aceptados el ${new Date(estadoTerminos.fechaAceptacion).toLocaleString()}`);
                } else if (estadoTerminos.codigoExiste && !estadoTerminos.aceptado) {
                    // Si el código existe pero fue aceptado por otro usuario
                    console.log(`Este código ya fue aceptado por: ${estadoTerminos.usuarioQueAcepto}`);
                }

                // Si hay información de resumen disponible, actualizar los datos del resumen
                if (estadoTerminos.resumen) {
                    // Opcional: actualizar el resumen con los datos guardados
                    console.log('Resumen guardado:', estadoTerminos.resumen);
                }

            } catch (error) {
                console.error('Error al obtener la información:', error);

                // Manejar errores específicos si es necesario
                if (error.response && error.response.status === 401) {
                    alert('Sesión no válida. Por favor, inicie sesión nuevamente.');
                } else {
                    alert('Error al cargar la información. Por favor, intente nuevamente.');
                }
            } finally {
                this.isLoading = false; // Ocultar loading después de la petición
            }
        },

        getCredentials() {
            const username = localStorage.getItem('username');
            const password = localStorage.getItem('password');

            if (!username || !password) {
                console.error('Faltan las credenciales de usuario');
                return '';
            }

            return btoa(`${username}:${password}`);
        },
        sumaFaltante() {
            let total = 0;
            this.datosFiltrados.forEach(dato => {
                if (this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) === 'Faltante') {
                    const precioUnitario = dato.PrecioUnitario || 0;
                    const diferencia = Math.abs(this.calcularDiferencia(dato.totalTomas, dato.totalEwmRegistro)) || 0;
                    total += precioUnitario * diferencia;
                }
            });
            return total.toFixed(2);
        },
        sumaSobrante() {
            let total = 0;
            this.datosFiltrados.forEach(dato => {
                if (this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) === 'Sobrante') {
                    const precioUnitario = dato.PrecioUnitario || 0;
                    const diferencia = this.calcularDiferencia(dato.totalTomas, dato.totalEwmRegistro) || 0;
                    total += precioUnitario * diferencia;
                }
            });
            return total.toFixed(2);
        },
        sumaSobranteInventario() {
            let total = 0;
            this.datosFiltrados.forEach(dato => {
                if (this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) === 'Sobrante') {
                    const precioUnitario = dato.PrecioUnitario || 0;
                    const diferencia = dato.totalTomas - (this.calcularDiferencia(dato.totalTomas, dato.totalEwmRegistro)) || 0;
                    total += precioUnitario * diferencia;
                }
            });
            return total.toFixed(2);
        },
        sumaFaltanteInventario() {
            let total = 0;
            this.datosFiltrados.forEach(dato => {
                if (this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) === 'Faltante') {
                    const precioUnitario = dato.PrecioUnitario || 0;
                    const diferencia = dato.totalTomas || 0;
                    total += precioUnitario * diferencia;
                }
            });
            return total.toFixed(2);
        },
        sumaConciliado() {
            let total = 0;
            this.datosFiltrados.forEach(dato => {
                if (this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) === 'Conciliado') {
                    const precioUnitario = dato.PrecioUnitario || 0;
                    const totalTomas = dato.totalTomas || 0;
                    total += precioUnitario * totalTomas;
                }
            });
            return total.toFixed(2);
        },

        sumaConciliadoOriginal() {
            // Obtener los totales de cada categoría
            const totalFaltante = parseFloat(this.sumaFaltanteInventario());
            const totalSobrante = parseFloat(this.sumaSobranteInventario());

            // Calcular el total por productos conciliados propiamente
            let totalConciliado = 0;
            this.datosFiltrados.forEach(dato => {
                if (this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) === 'Conciliado') {
                    const precioUnitario = dato.PrecioUnitario || 0;
                    const totalTomas = dato.totalTomas || 0;
                    totalConciliado += precioUnitario * totalTomas;
                }
            });

            // Sumar los tres valores
            const sumaTotal = totalFaltante + totalSobrante + totalConciliado;

            // Devolver el resultado con formato de 2 decimales
            return sumaTotal.toFixed(2);
        },
        sumaTotalInventarioEwm() {
            let total = 0;
            this.datosFiltrados.forEach(dato => {
                const valor = dato.valorInventario || 0;
                total += valor;
            });
            return total.toFixed(2);
        },
        sumaTotalInventarioTomas() {
            return this.datosFiltrados.reduce((acc, item) => {
                const precioUnitario = parseFloat(item.PrecioUnitario) || 0;
                const totalTomas = parseFloat(item.totalTomas) || 0;
                const valor = precioUnitario * totalTomas;
                return acc + valor;
            }, 0).toFixed(2);
        },
        estadoColor(totalTomas, totalEwmRegistro) {
            const diferencia = this.calcularDiferencia(totalTomas, totalEwmRegistro);
            if (diferencia < 0) {
                return '#fe5c5c';
            } else if (diferencia > 0) {
                return '#FFD700';
            } else {
                return '#74d573';
            }
        },
        estadoDiferencia(totalTomas, totalEwmRegistro) {
            const diferencia = this.calcularDiferencia(totalTomas, totalEwmRegistro);
            if (diferencia < 0) {
                return 'Faltante';
            } else if (diferencia > 0) {
                return 'Sobrante';
            } else {
                return 'Conciliado';
            }
        },
        calcularDiferencia(totalTomas, totalEwmRegistro) {
            return totalTomas - totalEwmRegistro;
        },
        formatearPrecio(precio) {
            if (precio == null || isNaN(precio)) {
                return '0.00';
            }
            return new Intl.NumberFormat('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(precio);
        },
        seleccionarFila(dato) {
            if (this.filaSeleccionada === dato) {
                this.filaSeleccionada = null;
            } else {
                this.filaSeleccionada = dato;
            }
        },
        filtrarDatos() {
            let datosFiltrados = [...this.datos]; // Copia de los datos originales para evitar mutaciones

            // Filtra por código de inventario
            if (this.codigoInventario) {
                datosFiltrados = datosFiltrados.filter(dato =>
                    dato.codigoInventario === this.codigoInventario
                );
            }

            // Filtrar por estado si se ha seleccionado uno
            if (this.filtroEstado) {
                datosFiltrados = datosFiltrados.filter(dato =>
                    this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro) === this.filtroEstado
                );
            }

            // Filtrar por producto o descripción del producto
            if (this.filtroProducto) {
                const filtroProductoLower = this.filtroProducto.toLowerCase();
                datosFiltrados = datosFiltrados.filter(dato =>
                    dato.producto.toLowerCase().includes(filtroProductoLower) ||
                    dato.descripcionProducto.toLowerCase().includes(filtroProductoLower)
                );
            }

            // Asignar los datos filtrados al estado
            this.datosFiltrados = datosFiltrados;

            // Calcular el número total de páginas
            this.totalPages = Math.ceil(this.datosFiltrados.length / this.pageSize);

            // Asegurarse de que la página actual no exceda el número total de páginas
            if (this.currentPage > this.totalPages) {
                this.currentPage = this.totalPages > 0 ? this.totalPages : 1;
            }

            // Asignar los datos filtrados al estado
            this.datosFiltrados = datosFiltrados;
            this.actualizarTotales(); // Actualizar totales después del filtrado
        },

        getPaginatedData() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            return this.datosFiltrados.slice(start, end);
        },
        async exportarCodigoExcel(codigoInventarioFiltro) {
            // Verificar si se ha seleccionado un código de inventario
            if (!this.codigoInventario) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Seleccione un código',
                    text: 'Debe seleccionar un código de inventario para exportar.',
                });
                return;
            }

            this.isExportingCodigo = true; // Indicar que la exportación está en progreso

            try {

                const token = localStorage.getItem('jwt');
                // Obtener los datos de la API
                const response = await axios.get(`${config.BASE_URL}/api/hanna/resultadosCombinados`, {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    withCredentials: true,
                    params: {
                        codigoInventario: this.codigoInventario || undefined,
                    },
                });

                const data = response.data;

                // Filtrar los datos para eliminar valores vacíos o nulos
                const datosFiltrados = data
                    .filter((dato) => dato !== null && dato !== undefined) // Eliminar valores nulos o indefinidos
                    .filter((dato) => dato.codigoInventario === codigoInventarioFiltro); // Filtrar por código de inventario

                // Verificar si hay datos para exportar
                if (datosFiltrados.length === 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Sin datos',
                        text: `No se encontraron datos válidos para el código de inventario ${codigoInventarioFiltro}.`,
                    });
                    return;
                }

                // Mapear los datos para exportar
                const dataParaExportar = datosFiltrados.map((dato) => ({
                    Cantidad: dato.CantidaProduc,
                    Producto: dato.producto,
                    Estado: this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro),
                    Descripcion_Producto: dato.descripcionProducto,
                    Propietario: dato.propietario,
                    Lote: dato.lote,
                    Unidad_Medida: dato.unidadMedidaBase,
                    Codigo_Inventario: dato.codigoInventario,
                    Total_Registro: dato.totalEwmRegistro,
                    Total_Tomas: dato.totalTomas,
                    Diferencia: this.calcularDiferencia(dato.totalTomas, dato.totalEwmRegistro),
                    Valor_Inventario: dato.valorInventario,
                    Precio_Unitario: dato.PrecioUnitario,
                    Valor_Diferencia: dato.PrecioDif,
                }));

                // Crear la hoja de cálculo
                const ws = XLSX.utils.json_to_sheet(dataParaExportar);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, `Reporte_${codigoInventarioFiltro}`);

                // Exportar el archivo Excel
                XLSX.writeFile(wb, `Reporte_${codigoInventarioFiltro}.xlsx`);

                // Mostrar mensaje de éxito
                Swal.fire({
                    icon: 'success',
                    title: 'Exportación exitosa',
                    text: `Los datos del código ${codigoInventarioFiltro} se han exportado correctamente.`,
                });
            } catch (error) {
                console.error('Error al exportar los datos:', error);

                // Mostrar mensaje de error
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al exportar los datos.',
                });
            } finally {
                this.isExportingCodigo = false; // Indicar que la exportación ha finalizado
            }
        },

        seleccionarFila(dato) {
            // Si la fila ya está seleccionada, deselecciónala
            if (this.filaSeleccionada === dato) {
                this.filaSeleccionada = null;
            } else {
                // Selecciona la nueva fila
                this.filaSeleccionada = dato;
            }
        },
        mostrarMenu(event) {
            event.preventDefault();
            this.mostrarMenuContextual = true;
            this.menuPos.x = event.pageX; // Usa pageX en lugar de clientX
            this.menuPos.y = event.pageY; // Usa pageY en lugar de clientY

            // Agrega un evento de clic global para detectar clics fuera del menú
            document.addEventListener('click', this.ocultarMenuContextual);
        },

        resetForm() {
            this.observacion = {
                producto: '',
                estado_pro: '',
                descripcion_pro: '',
                centropro: '',
                lote_pro: '',
                unidad_medida_pro: '',
                codigo_inventario_pro: '',
                diferencia_pro: 0.0,
                categoria_obsv: '',
                observacion_obsv: '',
            };
        },
        ocultarMenuContextual(event) {
            // Comprueba si el clic se realizó fuera del menú contextual
            const menu = this.$refs.menuContextual; // Usa una referencia al elemento del menú
            if (menu && !menu.contains(event.target)) {
                this.mostrarMenuContextual = false;
                document.removeEventListener('click', this.ocultarMenuContextual);
            }
        },

        async guardarObservacion() {

            if (!this.observacion.categoria_obsv || !this.observacion.observacion_obsv) {
                alert('Por favor, completa todos los campos obligatorios.');
                return;
            }

            try {
                // Obtener credenciales (ajusta esto según tu lógica)
                const token = localStorage.getItem('jwt');

                // Hacer la solicitud POST a la API
                const response = await axios.post(
                    `${config.BASE_URL}/api/observaciones`, // URL de la API
                    this.observacion, // Datos a enviar
                    {
                        headers: {
                            "Content-Type": "application/json"
                        },
                        withCredentials: true, // Incluir cookies y credenciales en la solicitud
                    }
                );

                // Si la solicitud es exitosa
                console.log('Observación creada:', response.data);
                alert('Observación guardada exitosamente');

                // Limpiar el formulario después de guardar
                this.resetForm();
                this.mostrarModal = false;
            } catch (error) {
                // Manejar errores
                console.error('Error al guardar la observación:', error);

                // Mostrar un mensaje de error al usuario
                if (error.response) {
                    // El servidor respondió con un código de estado fuera del rango 2xx
                    alert(`Error: ${error.response.data.message || 'Hubo un error al guardar la observación'}`);
                } else if (error.request) {
                    // La solicitud fue hecha pero no se recibió respuesta
                    alert('No se recibió respuesta del servidor. Verifica tu conexión a internet.');
                } else {
                    // Algo salió mal al configurar la solicitud
                    alert('Error al configurar la solicitud.');
                }
            }
        },
        changePageSize() {
            this.currentPage = 1; // Reiniciar a la primera página
            this.totalPages = Math.ceil(this.datosFiltrados.length / this.pageSize);
        },
        changePage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
            }
        },
        goToPage() {
            const page = parseInt(this.goToPageNumber);
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
            }
        },
        abrirModal() {
            this.mostrarMenuContextual = false;
            if (this.filaSeleccionada) {
                const estado_pro = this.estadoDiferencia(this.filaSeleccionada.totalTomas, this.filaSeleccionada.totalEwmRegistro);
                const diferencia_pro = this.calcularDiferencia(this.filaSeleccionada.totalTomas, this.filaSeleccionada.totalEwmRegistro);

                this.observacion = {
                    producto: this.filaSeleccionada.producto,
                    estado_pro: estado_pro,
                    descripcion_pro: this.filaSeleccionada.descripcionProducto,
                    centropro: this.filaSeleccionada.propietario,
                    lote_pro: this.filaSeleccionada.lote,
                    unidad_medida_pro: this.filaSeleccionada.unidadMedidaBase,
                    codigo_inventario_pro: this.filaSeleccionada.codigoInventario,
                    diferencia_pro: diferencia_pro,
                    categoria_obsv: '', // Aquí puedes asignar una categoría seleccionada si es necesario
                    observacion_obsv: '' // Observación que el usuario puede llenar
                };

                this.mostrarModal = true;
            } else {
                alert('Por favor, selecciona una fila antes de continuar.');
            }
        },
        cerrarModal() {
            this.mostrarModal = false;
            this.observacion = {
                producto: '',
                estado: '',
                descripcion: '',
                observacion: ''
            };
        },
        actualizarTotales() {
            let totalInventarios = 0;
            let totalInventariosEWM = 0;
            let totalFaltante = 0;
            let totalSobrante = 0;
            let totalConciliado = 0;

            this.datosFiltrados.forEach(dato => {
                totalInventarios++;
                totalInventariosEWM = totalInventariosEWM + dato.CantidaProduc;
                const estado = this.estadoDiferencia(dato.totalTomas, dato.totalEwmRegistro);

                if (estado === 'Faltante') {
                    totalFaltante++;
                } else if (estado === 'Sobrante') {
                    totalSobrante++;
                } else if (estado === 'Conciliado') {
                    totalConciliado++;
                }
            });

            this.totals['Total totalInventariosEWM'] = totalInventariosEWM;
            this.totals['Total Inventarios'] = totalInventarios;
            this.totals['Faltante'] = totalFaltante;
            this.totals['Sobrante'] = totalSobrante;
            this.totals['Conciliado'] = totalConciliado;
        },

    },
    watch: {
        // Observar cambios en los datos originales para aplicar el filtro automáticamente
        datos() {
            this.filtrarDatos();
        },
        // Observar cambios en los filtros para aplicar el filtro automáticamente
        filtroEstado() {
            this.filtrarDatos();
        },
        filtroProducto() {
            this.filtrarDatos();
        },
        codigoInventario() {
            this.filtrarDatos();
        }
    }

};
</script>

<style scoped>
/* ===== ESTILOS BASE PARA VISTA WEB EXPANDIDA ===== */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.inventario-container {
    width: 100%;
    max-width: 100%;
    /* Cambiado para ocupar todo el ancho disponible */
    padding: 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    color: #333;
    background-color: #f8faf9;
    font-size: 1rem;
    line-height: 1.5;
}

/* ===== PANEL DE FILTROS EXPANDIDO ===== */
.filtros-panel {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    animation: fadeIn 0.5s ease;
    border: 1px solid #e0e0e0;
    transition: box-shadow 0.3s ease;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.filtros-panel:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.filtro-grupo {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
    width: 100%;
}

.filtro-item {
    flex: 1 1 calc(25% - 1.25rem);
    /* 4 elementos por fila en lugar de 3 */
    min-width: 180px;
    transition: transform 0.3s ease;
}

.filtro-item:hover {
    transform: translateY(-3px);
}

.filtro-label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
    font-size: 0.875rem;
    transition: color 0.3s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.filtro-item:hover .filtro-label {
    color: #0c534c;
}

.filtro-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    background-color: white;
}

.filtro-input:hover {
    border-color: #0c534c;
    box-shadow: 0 2px 8px rgba(74, 108, 247, 0.1);
}

.filtro-input:focus {
    outline: none;
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.15);
}

.input-icon-wrapper {
    position: relative;
}

.input-clear-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    cursor: pointer;
    font-size: 0.875rem;
    opacity: 0.7;
    transition: opacity 0.2s, transform 0.3s;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    z-index: 2;
}

.input-clear-icon:hover {
    opacity: 1;
    transform: translateY(-50%) scale(1.2);
    background-color: rgba(74, 108, 247, 0.1);
}

.filtro-acciones {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 16px;
    width: 100%;
}

.btn-reset,
.btn-buscar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.3s, box-shadow 0.3s;
    position: relative;
    overflow: hidden;
    font-size: 0.9rem;
    min-width: 120px;
}

.btn-reset {
    background-color: #f0f0f0;
    color: #333;
}

.btn-buscar {
    background-color: #0c534c;
    color: white;
}

.btn-reset:hover,
.btn-buscar:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-reset:active,
.btn-buscar:active {
    transform: translateY(0);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn-reset:hover {
    background-color: #e0e0e0;
}

.btn-buscar:hover {
    background-color: #3858d6;
}

/* Efecto de onda al hacer clic */
.btn-reset:after,
.btn-buscar:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    transform: scale(0);
    opacity: 0;
    transition: transform 0s, opacity 0.3s;
}

.btn-reset:active:after,
.btn-buscar:active:after {
    transform: scale(2);
    opacity: 0;
    transition: transform 0.4s, opacity 0.3s;
}

/* ===== TARJETAS DE ESTADÍSTICAS REFINADAS ===== */
.stat-cards {
    margin-bottom: 1rem;
    animation: fadeIn 0.5s ease;
    width: 100%;
}

.stat-card {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    border: 1px solid #eaeaea;
    transition: transform 0.2s, box-shadow 0.2s;
    width: 100%;
}

.stat-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
}

.stat-card-header {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    background-color: #ffffff;
    color: #333;
    font-weight: 600;
    padding: 10px 0;
    border-bottom: 1px solid #f0f0f0;
}

.stat-header-item {
    text-align: center;
    padding: 6px;
    font-size: 0.85rem;
}

.stat-header-item.red {
    background-color: #fe5c5c;
    color: white;
    border-radius: 4px;
    margin: 0 2px;
}

.stat-header-item.yellow {
    background-color: #FFD700;
    color: #333;
    border-radius: 4px;
    margin: 0 2px;
}

.stat-header-item.green {
    background-color: #74d573;
    color: white;
    border-radius: 4px;
    margin: 0 2px;
}

.stat-card-row {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.3s;
}

.stat-card-row:hover {
    background-color: #fafafa;
}

.stat-card-row:last-child {
    border-bottom: none;
}

.stat-title {
    font-weight: bold;
    padding: 10px;
    color: #333;
    font-size: 0.9rem;
}

.stat-value {
    text-align: center;
    padding: 10px;
    font-size: 0.9rem;
}

.progress-bar-container {
    width: 90%;
    height: 12px;
    background-color: #eaeaea;
    border-radius: 6px;
    overflow: hidden;
    margin: 0 auto 5px auto;
}

.progress-bar {
    height: 100%;
    background-color: #4caf50;
    border-radius: 6px;
    transition: width 1s ease-in-out, background-color 0.5s ease-in-out;
}

/* ===== ESTADO DE CARGA ===== */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.5s ease;
    width: 100%;
    margin: 20px 0;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #e6f1ec;
    border-top: 3px solid #0c534c;
    border-radius: 50%;
    animation: spinAndScale 1.5s linear infinite;
    margin-bottom: 15px;
}

@keyframes spinAndScale {
    0% {
        transform: rotate(0deg) scale(0.9);
    }

    50% {
        transform: rotate(180deg) scale(1.1);
    }

    100% {
        transform: rotate(360deg) scale(0.9);
    }
}

.loading-container span {
    font-size: 1rem;
    color: #666;
}

/* ===== ESTADO VACÍO ===== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    animation: bounceIn 0.6s ease;
    width: 100%;
    margin: 20px 0;
}

.empty-icon {
    font-size: 3.5rem;
    color: #666;
    margin-bottom: 15px;
    animation: float 3s infinite ease-in-out;
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

.empty-text {
    font-size: 1.4rem;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
}

.empty-hint {
    font-size: 1rem;
    color: #666;
    text-align: center;
}

/* ===== CONTENEDOR DE TABLA MEJORADO ===== */
.table-container {
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    overflow: auto;
    animation: slideUp 0.5s ease;
    border: 1px solid #eaeaea;
    transition: box-shadow 0.3s;
    width: 100%;
    margin-bottom: 20px;
    max-height: calc(100vh - 350px);
}

.table-container:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

/* ===== TABLA MEJORADA ===== */
.inventario-table {
    width: 100%;
    border-collapse: collapse;
    background-color: white;
    font-size: 0.9rem;
}

.inventario-table th,
.inventario-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
}

.inventario-table th {
    background-color: #0c534c;
    /* Color sólido */
    color: white;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 5;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    font-size: 0.85rem;
    letter-spacing: 0.5px;
}

.inventario-table tbody tr {
    border-bottom: 1px solid #f0f0f0;
}

.inventario-table tbody tr:nth-child(even) {
    background-color: #fafafa;
}

.inventario-table tbody tr:nth-child(odd) {
    background-color: #ffffff;
}

.table-row {
    transition: background-color 0.3s, transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
}

.table-row:hover {
    background-color: #e6f1ec !important;
    transform: translateY(-2px);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
    z-index: 1;
    position: relative;
}

.table-row:active {
    transform: translateY(0);
}

.row-selected {
    background-color: #c8e6c9 !important;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-left: 3px solid #4caf50;
}

/* ===== PAGINACIÓN MEJORADA ===== */
.pagination-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-top: 1px solid #dde8dc;
    background-color: #f5f5f5;
    transition: background-color 0.3s;
    width: 100%;
}

.pagination-container:hover {
    background-color: #edf7f1;
}

.pagination-info {
    font-size: 0.95rem;
    color: #0c534c;
    font-weight: 500;
    transition: transform 0.3s;
}

.pagination-container:hover .pagination-info {
    transform: scale(1.05);
}

.pagination {
    display: flex;
    align-items: center;
    gap: 5px;
}

.pagination-btn {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background-color: white;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
    font-size: 0.9rem;
}

.pagination-btn::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: radial-gradient(circle, rgba(74, 108, 247, 0.2) 0%, transparent 70%);
    transform: scale(0);
    opacity: 0;
    transition: transform 0.3s, opacity 0.3s;
    border-radius: 50%;
}

.pagination-btn:hover::after {
    transform: scale(2);
    opacity: 1;
}

.pagination-btn:hover:not(:disabled) {
    background-color: #e6f1ec;
    color: #0c534c;
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
}

.pagination-btn:active:not(:disabled) {
    transform: translateY(0);
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-numbers {
    display: flex;
    align-items: center;
    gap: 5px;
}

.page-number {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background-color: white;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
    font-size: 0.9rem;
}

.page-number::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: radial-gradient(circle, rgba(74, 108, 247, 0.2) 0%, transparent 70%);
    transform: scale(0);
    opacity: 0;
    transition: transform 0.3s, opacity 0.3s;
    border-radius: 50%;
}

.page-number:hover::after {
    transform: scale(2);
    opacity: 1;
}

.page-number:hover:not(.active) {
    background-color: #e6f1ec;
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.15);
}

.page-number.active {
    background-color: #0c534c;
    color: white;
    font-weight: 600;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
}

/* ===== MENÚ CONTEXTUAL ===== */
.menu-contextual {
    position: absolute;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;
    min-width: 220px;
    animation: fadeIn 0.2s ease;
}

.menu-contextual ul {
    list-style: none;
    margin: 0;
    padding: 0;
}

.menu-contextual li {
    padding: 12px 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #333;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f0f0f0;
}

.menu-contextual li:last-child {
    border-bottom: none;
}

.menu-contextual li:hover {
    background-color: #e6f1ec;
    color: #0c534c;
    padding-left: 20px;
}

.menu-contextual li i {
    color: #0c534c;
    font-size: 1rem;
    transition: transform 0.2s;
}

.menu-contextual li:hover i {
    transform: scale(1.2);
}

/* ===== MODAL MEJORADO ===== */
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

.modal-contenido {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 800px;
    /* Aumentado para vista web */
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.4s ease;
}

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

.modal-body {
    padding: 25px;
}

.form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
}

.form-group {
    flex: 1 1 calc(33.333% - 20px);
    /* 3 elementos por fila en lugar de 2 */
    min-width: 200px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #333;
    font-weight: 500;
    font-size: 0.95rem;
}

.modal-input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.modal-input:focus {
    outline: none;
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.modal-textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    min-height: 150px;
    resize: vertical;
    transition: border-color 0.3s, box-shadow 0.3s;
}

.modal-textarea:focus {
    outline: none;
    border-color: #0c534c;
    box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;
    background-color: #f5f9f7;
}

/* ===== TABLA DE HISTORIAL MEJORADA ===== */
.history-section {
    margin-top: 40px;
    width: 100%;
}

.history-title {
    margin-bottom: 20px;
    color: #0c534c;
    font-size: 1.5rem;
    font-weight: 600;
    padding-bottom: 10px;
    border-bottom: 2px solid #e6f1ec;
}

.history-table {
    margin-top: 15px;
}

.history-table td {
    padding: 12px;
    font-size: 0.9rem;
}

.empty-cell {
    border: none !important;
    background: transparent !important;
}

.bg-green,
.bg-red,
.bg-yellow {
    font-weight: bold;
    text-align: center;
}

.bg-green {
    background-color: #74d573 !important;
    color: white !important;
}

.bg-red {
    background-color: #fe5c5c !important;
    color: white !important;
}

.bg-yellow {
    background-color: #FFD700 !important;
    color: #333 !important;
}

/* ===== ANIMACIONES ===== */
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

@keyframes bounceIn {
    0% {
        transform: scale(0.8);
        opacity: 0;
    }

    60% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

/* ===== REGLAS PARA IMPRESIÓN ===== */
@media print {

    .filtros-panel,
    .pagination-container,
    .menu-contextual,
    .modal-overlay {
        display: none !important;
    }

    .inventario-container,
    .table-container {
        box-shadow: none !important;
        border: 1px solid #ddd !important;
        margin: 0 !important;
        padding: 0 !important;
        max-height: none !important;
    }

    .inventario-table th {
        background: #eee !important;
        color: #333 !important;
        text-shadow: none !important;
    }

    .bg-green,
    .bg-red,
    .bg-yellow {
        border: 1px solid #333 !important;
    }

    .history-title {
        page-break-before: always;
    }
}

/* Estilos específicos para el botón de términos */
.filtro-acciones .btn-reset {
    transition: all 0.3s ease;
}

.filtro-acciones .btn-reset:hover {
    background-color: #4caf50;
    color: white;
    border-color: #4caf50;
}

.filtro-acciones .btn-reset i {
    margin-right: 5px;
}

/* Estilos base para el botón de términos */
.btn-terminos {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s, box-shadow 0.3s;
    position: relative;
    overflow: hidden;
    font-size: 0.9rem;
    min-width: 120px;
}

/* Estilo cuando los términos NO han sido aceptados (gris) */
.btn-reset {
    background-color: #f0f0f0;
    color: #333;
}

.btn-reset:hover {
    background-color: #e0e0e0;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Estilo cuando los términos YA han sido aceptados (verde) */
.btn-aceptado {
    background-color: #4caf50;
    color: white;
    pointer-events: none;
    /* Opcional: desactiva clics si ya está aceptado */
}

.btn-aceptado:hover {
    background-color: #45a049;
    transform: none;
    /* No se eleva al pasar el cursor */
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn-aceptado i {
    color: white;
    font-size: 1.1rem;
}
</style>
