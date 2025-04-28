<template>
<div class="container-fluid px-0">
    <div class="row g-0">
       
       <!-- Filtros optimizados para móvil con diseño acordeón en dispositivos pequeños -->
        <div class="col-12 mb-3">
            <div class="filter-panel p-3 rounded-4 shadow-sm" :class="{'filter-panel-expanded': showFilters}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h2 class="fs-5 fw-bold m-0">Listado de Productos</h2>
                    <button @click="toggleFilters" class="btn btn-sm btn-light d-md-none">
                        <i class="fas" :class="showFilters ? 'fa-chevron-up' : 'fa-filter'"></i>
                    </button>
                </div>
                
                <!-- Cambiamos esto para que solo dependa de showFilters -->
                <div v-show="showFilters || $mq === 'md' || $mq === 'lg' || $mq === 'xl'">
                    <div class="row g-2">
                        <!-- Filtros se mantienen igual pero añadimos eventos @focus -->
                        <div class="col-12 col-md-6 col-lg-3">
                            <label for="codigoInventario" class="form-label small mb-1">Código:</label>
                            <select id="codigoInventario"
                                v-model="codigoInventario"
                                class="form-select form-select-sm rounded-pill"
                                @focus="keepFiltersOpen">
                                <option value="" disabled>Seleccione un código</option>
                                <option v-for="codigo in codigosInventario" :key="codigo" :value="codigo">
                                    {{ codigo }}
                                </option>
                            </select>
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <label for="ubicacion" class="form-label small mb-1">Ubicación:</label>
                            <input type="text" id="ubicacion"
                                v-model="ubicacion"
                                @focus="keepFiltersOpen"
                                @change="obtenerTomas"
                                class="form-control form-control-sm rounded-pill">
                        </div>
                        <div class="col-12 col-md-6 col-lg-3">
                            <label for="producto" class="form-label small mb-1">Producto:</label>
                            <input type="text" id="producto"
                                v-model="producto"
                                @focus="keepFiltersOpen"
                                @change="debounceObtenerTomas"
                                class="form-control form-control-sm rounded-pill">
                        </div>
                        
                        <div class="col-12 mt-2">
                            <button @click="exportarPorCodigo" class="btn btn-sm btn-primary rounded-pill w-100 w-md-auto" :disabled="isExporting || !codigoInventario">
                                <i class="fas fa-file-export me-1"></i>
                                {{ isExporting ? 'Exportando...' : 'Exportar a Excel' }}
                            </button>
                            <button @click="resetFilters" class="btn btn-sm btn-outline-secondary rounded-pill ms-md-2 mt-2 mt-md-0 w-100 w-md-auto">
                                <i class="fas fa-undo me-1"></i> Limpiar filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats card - Información rápida -->
        <div class="col-12 mb-3">
            <div class="stats-row d-flex flex-wrap">
                <div class="stat-card bg-primary text-white rounded-4 p-3 me-2 mb-2">
                    <div class="stat-title small">Total Productos</div>
                    <div class="stat-value fs-4 fw-bold">{{ totalElements }}</div>
                </div>
                <div class="stat-card bg-success text-white rounded-4 p-3 me-2 mb-2">
                    <div class="stat-title small">Total Cantidad</div>
                    <div class="stat-value fs-4 fw-bold">{{ totalCantidad.toFixed(2) }}</div>
                </div>
                <div class="stat-card bg-info text-white rounded-4 p-3 mb-2" v-if="codigoInventario">
                    <div class="stat-title small">Inventario</div>
                    <div class="stat-value fs-5 fw-bold">{{ codigoInventario }}</div>
                </div>
            </div>
        </div>

        <!-- NUEVO: Selector de tipo de vista para móvil -->
        <div class="col-12 d-block d-lg-none mb-3">
            <div class="view-selector-container d-flex justify-content-center">
                <div class="btn-group" role="group" aria-label="Selector de vista">
                    <button type="button" class="btn" :class="mobileViewType === 'cards' ? 'btn-primary' : 'btn-outline-primary'" @click="mobileViewType = 'cards'">
                        <i class="fas fa-th-large me-1"></i> Tarjetas
                    </button>
                    <button type="button" class="btn" :class="mobileViewType === 'table' ? 'btn-primary' : 'btn-outline-primary'" @click="mobileViewType = 'table'">
                        <i class="fas fa-table me-1"></i> Tabla
                    </button>
                </div>
            </div>
        </div>

        <!-- Vista móvil: Cards (mostrar solo si mobileViewType === 'cards') -->
        <div class="col-12 d-block d-lg-none mb-3" v-if="mobileViewType === 'cards'">
            <div v-if="loading" class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>

            <div v-else-if="tomas.length === 0" class="empty-state text-center py-5">
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <p>No hay productos disponibles con estos filtros</p>
                <button @click="resetFilters" class="btn btn-sm btn-outline-primary rounded-pill">
                    Limpiar filtros
                </button>
            </div>

            <div v-else class="product-cards">
                <div v-for="(item, index) in tomas" :key="index" class="product-card mb-3 p-3 rounded-4 shadow-sm" :class="{ 'active-card': selectedItem === item }" @click="selectRow(item)">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h3 class="product-title fs-6 fw-bold mb-0">{{ item.producto }}</h3>
                        <span class="badge rounded-pill" :class="getBadgeClass(item.cantidad)">
                            {{ item.cantidad }}
                        </span>
                    </div>
                    <div class="product-details small">
                        <div class="detail"><i class="fas fa-tag fa-fw text-muted me-1"></i> {{ item.descripcionProducto }}</div>
                        <div class="detail"><i class="fas fa-map-marker-alt fa-fw text-muted me-1"></i> {{ item.ubicacion }}</div>
                        <div class="detail"><i class="fas fa-calendar fa-fw text-muted me-1"></i> {{ formatDateShort(item.fechaToma) }}</div>
                        <div class="detail"><i class="fas fa-barcode fa-fw text-muted me-1"></i> {{ item.lote }}</div>
                        <div class="detail"><i class="fas fa-user fa-fw text-muted me-1"></i> {{ item.userDni.split('@')[0] }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- NUEVO: Vista móvil: Tabla (mostrar solo si mobileViewType === 'table') -->
        <div class="col-12 d-block d-lg-none mb-3" v-if="mobileViewType === 'table'">
            <div v-if="loading" class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>

            <div v-else-if="tomas.length === 0" class="empty-state text-center py-5">
                <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                <p>No hay productos disponibles con estos filtros</p>
                <button @click="resetFilters" class="btn btn-sm btn-outline-primary rounded-pill">
                    Limpiar filtros
                </button>
            </div>

            <div v-else class="table-responsive">
                <table class="table table-sm table-bordered table-hover m-0">
                    <thead>
                        <tr class="table-light">
                            <th>Producto</th>
                            <th>Ubicación</th>
                            <th class="text-end">Cantidad</th>
                            <th>Lote</th>
                            <th>Cod.Inventario</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in tomas" :key="index" @click="selectRow(item)" :class="{ 'table-active': selectedItem === item }">
                            <td class="fw-medium">{{ item.producto }}</td>
                            <td>{{ item.ubicacion }}</td>
                            <td class="text-end fw-bold">{{ item.cantidad }}</td>
                            <td>{{ item.lote }}</td>
                            <td>{{ item.codigoInventario }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Paginación móvil simplificada (aplica para ambos tipos de vista) -->
        <div class="col-12 d-block d-lg-none mb-3">
            <div class="mobile-pagination d-flex justify-content-between align-items-center mt-3">
                <button @click="prevPage" class="btn btn-sm btn-light rounded-circle" :disabled="currentPage === 0">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="pagination-info">{{ currentPage + 1 }} / {{ totalPages || 1 }}</span>
                <button @click="nextPage" class="btn btn-sm btn-light rounded-circle" :disabled="currentPage >= totalPages - 1">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        </div>

        <!-- Vista desktop: tabla -->
        <div class="col-12 d-none d-lg-block mb-3">
            <div class="table-container rounded-4 shadow-sm overflow-hidden">
                <div v-if="loading" class="text-center p-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>

                <div v-else-if="tomas.length === 0" class="empty-state text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <p>No hay productos disponibles con estos filtros</p>
                    <button @click="resetFilters" class="btn btn-sm btn-outline-primary rounded-pill">
                        Limpiar filtros
                    </button>
                </div>

                <table v-else class="table table-bordered table-hover m-0">
                    <thead>
                        <tr class="table-light">
                            <th class="text-center" style="width: 50px;">#</th>
                            <th>Producto</th>
                            <th>Descripción</th>
                            <th>Ubicación</th>
                            <th>Fecha</th>
                            <th>Centro</th>
                            <th>Lote</th>
                            <th class="text-end">Cantidad</th>
                            <th>Usuario</th>
                            <th>Inventario</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in tomas" :key="index" @click="selectRow(item)" :class="{ 'table-active': selectedItem === item }">
                            <td class="text-center">{{ index + 1 + currentPage * pageSize }}</td>
                            <td class="fw-medium">{{ item.producto }}</td>
                            <td>{{ item.descripcionProducto }}</td>
                            <td>{{ item.ubicacion }}</td>
                            <td>{{ formatDate(item.fechaToma) }}</td>
                            <td>{{ item.centro }}</td>
                            <td>{{ item.lote }}</td>
                            <td class="text-end fw-bold">{{ item.cantidad }}</td>
                            <td>{{ item.userDni.split('@')[0] }}</td>
                            <td>{{ item.codigoInventario}}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Paginación desktop -->
                <div class="pagination-container bg-light p-2 d-flex justify-content-between align-items-center">
                    <div class="pagination-info small">
                        Mostrando {{ tomas.length }} de {{ totalElements }} resultados
                    </div>
                    <nav>
                        <ul class="pagination pagination-sm m-0">
                            <li class="page-item" :class="{ disabled: currentPage === 0 }">
                                <a class="page-link" href="#" @click.prevent="goToPage(0)">
                                    <i class="fas fa-angle-double-left"></i>
                                </a>
                            </li>
                            <li class="page-item" :class="{ disabled: currentPage === 0 }">
                                <a class="page-link" href="#" @click.prevent="prevPage">
                                    <i class="fas fa-angle-left"></i>
                                </a>
                            </li>
                            <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: currentPage === page - 1 }">
                                <a class="page-link" href="#" @click.prevent="goToPage(page - 1)">{{ page }}</a>
                            </li>
                            <li class="page-item" :class="{ disabled: currentPage === totalPages - 1 }">
                                <a class="page-link" href="#" @click.prevent="nextPage">
                                    <i class="fas fa-angle-right"></i>
                                </a>
                            </li>
                            <li class="page-item" :class="{ disabled: currentPage === totalPages - 1 }">
                                <a class="page-link" href="#" @click.prevent="goToPage(totalPages - 1)">
                                    <i class="fas fa-angle-double-right"></i>
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>

        <!-- Panel de detalles como bottom sheet en móvil -->
        <div v-if="selectedItem" class="product-detail-panel" :class="{'panel-visible': selectedItem}">
            <div class="panel-header d-flex justify-content-between align-items-center p-3 border-bottom">
                <h3 class="panel-title fs-5 m-0">Detalles del Producto</h3>
                <button class="btn-close" @click="closePanel"></button>
            </div>

            <div class="panel-body p-3">
                <div class="product-summary mb-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h4 class="product-name fs-6 fw-bold">{{ selectedItem.producto }}</h4>
                        <span class="badge rounded-pill" :class="getBadgeClass(selectedItem.cantidad)">
                            {{ selectedItem.cantidad }}
                        </span>
                    </div>
                    <p class="product-description text-muted mb-2">{{ selectedItem.descripcionProducto }}</p>
                </div>

                <div class="product-details mb-3">
                    <div class="row g-2">
                        <div class="col-6">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Ubicación</div>
                                <div class="detail-value">{{ selectedItem.ubicacion }}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Unidad de Medida</div>
                                <div class="detail-value">{{ selectedItem.unidadMedidaBase || 'N/A' }}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Inventario</div>
                                <div class="detail-value">{{ selectedItem.codigoInventario }}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Lote</div>
                                <div class="detail-value">{{ selectedItem.lote || 'N/A' }}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Centro</div>
                                <div class="detail-value">{{ selectedItem.centro || 'N/A' }}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Registrado por</div>
                                <div class="detail-value">{{ selectedItem.userDni.split('@')[0] }}</div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Observación</div>
                                <div class="detail-value">{{ selectedItem.observacion || 'Sin observaciones' }}</div>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="detail-card p-2 rounded bg-light">
                                <div class="detail-label small text-muted">Fecha de Toma</div>
                                <div class="detail-value">{{ formatDate(selectedItem.fechaToma) }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary rounded-pill w-100 mb-2" @click="editItem">
                        <i class="fas fa-edit me-1"></i> Editar
                    </button>
                    <button class="btn btn-outline-danger rounded-pill w-100" @click="confirmDelete(selectedItem.id)">
                        <i class="fas fa-trash-alt me-1"></i> Eliminar
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal de edición -->
        <div v-if="isEditing">

            <div class="modal-content rounded-4 shadow">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title">Editar Producto</h5>
                    <button class="btn-close" @click="cancelEdit"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="updateItem">
                        <div class="mb-3">
                            <label for="edit-producto" class="form-label small">Producto:</label>
                            <input type="text" id="edit-producto" v-model="itemToEdit.producto" class="form-control rounded-pill" required>
                        </div>
                        <div class="mb-3">
                            <label for="edit-descripcion" class="form-label small">Descripción:</label>
                            <input type="text" id="edit-descripcion" v-model="itemToEdit.descripcionProducto" class="form-control rounded-pill">
                        </div>
                        <div class="row mb-3">
                            <div class="col-6">
                                <label for="edit-cantidad" class="form-label small">Cantidad:</label>
                                <input type="number" id="edit-cantidad" v-model="itemToEdit.cantidad" class="form-control rounded-pill" required min="0.0" step="0.01">
                            </div>
                            <div class="col-6">
                                <label for="edit-unidad" class="form-label small">Unidad de medida:</label>
                                <input type="text" id="edit-unidad" v-model="itemToEdit.unidadMedidaBase" class="form-control rounded-pill">
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-6">
                                <label for="edit-ubicacion" class="form-label small">Ubicación:</label>
                                <input type="text" id="edit-ubicacion" v-model="itemToEdit.ubicacion" class="form-control rounded-pill">
                            </div>
                            <div class="col-6">
                                <label for="edit-lote" class="form-label small">Lote:</label>
                                <input type="text" id="edit-lote" v-model="itemToEdit.lote" class="form-control rounded-pill">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-observacion" class="form-label small">Observación:</label>
                            <textarea id="edit-observacion" v-model="itemToEdit.observacion" class="form-control" rows="2"></textarea>
                        </div>
                        <div class="modal-footer border-0 pt-0 d-flex justify-content-between">
                            <button type="button" class="btn btn-outline-secondary rounded-pill" @click="cancelEdit">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary rounded-pill">
                                <i class="fas fa-save me-1"></i> Guardar cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
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
            mobileViewType: 'cards', // Valores posibles: 'cards' o 'table'
            selectedItem: null,
            tomas: [],
            currentPage: 0,
            totalPages: 0,
            totalElements: 0,
            pageSize: 10,
            codigoInventario: '',
            ubicacion: '',
            producto: '',
            fechaInicio: '',
            codigosInventario: [],
            itemToEdit: {
                id: null,
                producto: '',
                descripcionProducto: '',
                cantidad: 0,
                ubicacion: '',
                lote: '',
                unidadMedidaBase: '',
                observacion: ''
            },
            isEditing: false,
            isExporting: false,
            isExporting2: false,
            loading: false,
            showFilters: false,
            debounceTimer: null
        };
    },
    mounted() {
        this.obtenerCodigosInventario();
        this.handleResize();
        window.addEventListener('resize', this.handleResize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);
    },
    computed: {
        totalCantidad() {
            return this.tomas ? this.tomas.reduce((sum, item) => sum + (parseFloat(item.cantidad) || 0), 0) : 0;
        },
        visiblePages() {
            const maxVisiblePages = window.innerWidth < 768 ? 3 : 5;
            const start = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
            const end = Math.min(this.totalPages, start + maxVisiblePages);
            return Array.from({
                length: end - start
            }, (_, i) => i + start + 1);
        }
    },
    methods: {
        toggleFilters() {
            this.showFilters = !this.showFilters;
        },
        keepFiltersOpen() {
            
        },
        resetFilters() {
            this.codigoInventario = '';
            this.ubicacion = '';
            this.producto = '';
            this.fechaInicio = '';
            this.obtenerTomas();
        },

        handleResize() {
            // Ajustar la interfaz basado en el tamaño de pantalla
             if (window.innerWidth < 768) {
                this.pageSize = 5; // Menos items por página en móvil
            } else {
                this.showFilters=true;
                this.pageSize = 10;
            }
        },

        handleOutsideClick(event) {
            // Cerrar panel de detalles al tocar fuera en móvil
            const panel = document.querySelector('.product-detail-panel');

            if (panel && !panel.contains(event.target) &&
                this.selectedItem && !this.isEditing && window.innerWidth < 768) {
                this.closePanel();
            }

            if (modal && !modal.contains(event.target) && this.isEditing &&
                !event.target.closest('.swal2-container')) {
                // No cerrar si es un click en un dialog de SweetAlert
                this.cancelEdit();
            }
        },

        debounceObtenerTomas() {
            // Prevenir múltiples solicitudes mientras el usuario escribe
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.obtenerTomas();
            }, 300);
        },

        formatDateShort(date) {
            if (!date) return 'N/A';
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        },

        formatDate(date) {
            if (!date) return 'N/A';
            const options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            };
            return new Date(date).toLocaleDateString('es-ES', options);
        },

        getBadgeClass(cantidad) {
            const qty = parseFloat(cantidad);
            if (qty <= 0) return 'bg-danger';
            if (qty < 10) return 'bg-warning text-dark';
            return 'bg-success';
        },

        selectRow(item) {
            this.selectedItem = item;
            this.itemToEdit = {
                ...this.selectedItem
            };
        },

        editItem() {
            this.isEditing = true;
        },

        cancelEdit() {
            this.isEditing = false;
        },

        closePanel() {
            this.selectedItem = null;
        },
        async exportarTodo() {
            this.isExporting2 = true;

            try {
                const response = await axios.get(
                    `${config.BASE_URL}/api/tomas/export/all`, { // <--- tu nueva URL
                        responseType: "arraybuffer",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        withCredentials: true
                    }
                );

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `todas_las_tomas.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                Swal.fire({
                    icon: "success",
                    title: "Exportación exitosa",
                    text: "Todas las tomas han sido exportadas correctamente.",
                    confirmButtonColor: '#28a745',
                    timer: 2000,
                    timerProgressBar: true
                });
            } catch (error) {
                console.error("Error al exportar todas las tomas:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Hubo un problema al exportar todas las tomas.",
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                this.isExporting = false;
            }
        },

        async exportarPorCodigo() {
            if (!this.codigoInventario) {
                Swal.fire({
                    icon: "warning",
                    title: "Seleccione un código",
                    text: "Debe seleccionar un código de inventario para exportar.",
                    confirmButtonColor: '#3085d6'
                });
                return;
            }

            this.isExporting = true;

            try {
                const response = await axios.get(
                    `${config.BASE_URL}/api/tomas/export/${this.codigoInventario}`, {
                        responseType: "arraybuffer",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        withCredentials: true
                    }
                );

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `tomas_${this.codigoInventario}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                Swal.fire({
                    icon: "success",
                    title: "Exportación exitosa",
                    text: `Los datos han sido exportados correctamente.`,
                    confirmButtonColor: '#28a745',
                    timer: 2000,
                    timerProgressBar: true
                });
            } catch (error) {
                console.error("Error al exportar los datos:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Hubo un problema al exportar los datos.",
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                this.isExporting = false;
            }
        },

        async obtenerCodigosInventario() {
            try {
                const response = await axios.get(`${config.BASE_URL}/api/tomas/CodigoToma`, {
                    headers: {
                        "Content-Type": "application/json"
                    },
                    withCredentials: true
                });
                this.codigosInventario = response.data;
            } catch (error) {
                console.error("Error al obtener códigos:", error);
                this.mostrarErrorConConexion();
            }
        },

        async obtenerTomas() {
            this.loading = true;
            try {
                const response = await axios.get(`${config.BASE_URL}/api/tomas`, {
                    params: {
                        codigoInventario: this.codigoInventario,
                        fechaInicio: this.fechaInicio,
                        producto: this.producto,
                        page: this.currentPage,
                        size: this.pageSize,
                        ubicacion: this.ubicacion
                    },
                    withCredentials: true
                });

                this.tomas = response.data.content || [];
                this.totalElements = response.data.totalElements || 0;
                this.totalPages = response.data.totalPages || 0;
                this.currentPage = response.data.number || 0;

            } catch (error) {
                console.error("Error al obtener tomas:", error);
                this.mostrarErrorConConexion();
            } finally {
                this.loading = false;
            }
        },

        mostrarErrorConConexion() {
            Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo conectar con el servidor. Verifique su conexión a internet.",
                confirmButtonColor: '#dc3545'
            });
        },

        goToPage(page) {
            if (this.currentPage !== page) {
                this.currentPage = page;
                this.obtenerTomas();
            }
        },

        nextPage() {
            if (this.currentPage < this.totalPages - 1) {
                this.currentPage++;
                this.obtenerTomas();
            }
        },

        prevPage() {
            if (this.currentPage > 0) {
                this.currentPage--;
                this.obtenerTomas();
            }
        },

        confirmDelete(id) {
            Swal.fire({
                title: "¿Eliminar producto?",
                text: "Esta acción no se puede deshacer",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed) {
                    this.deleteItem(id);
                }
            });
        },

        async deleteItem(id) {
            try {
                await axios.delete(`${config.BASE_URL}/api/tomas/${id}`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true
                });

                // Eliminar el item del array local
                this.tomas = this.tomas.filter((item) => item.id !== id);

                // Cerrar el panel de detalles
                this.closePanel();

                // Refrescar datos para asegurar sincronización
                this.obtenerTomas();

                // Notificar al usuario
                const toast = Swal.mixin({
                    toast: true,
                    position: 'bottom',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

                toast.fire({
                    icon: 'success',
                    title: 'Producto eliminado correctamente'
                });
            } catch (error) {
                console.error("Error al eliminar el producto:", error);

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo eliminar el producto. Intente nuevamente.",
                    confirmButtonColor: '#dc3545'
                });
            }
        },

        async updateItem() {
            if (!this.itemToEdit || !this.itemToEdit.id) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se ha seleccionado ningún elemento para actualizar.",
                    confirmButtonColor: '#dc3545'
                });
                return;
            }

            // Validaciones básicas
            if (!this.itemToEdit.producto || this.itemToEdit.producto.trim() === '') {
                Swal.fire({
                    icon: "warning",
                    title: "Campos incompletos",
                    text: "El nombre del producto es obligatorio.",
                    confirmButtonColor: '#ffc107'
                });
                return;
            }

            if (isNaN(this.itemToEdit.cantidad) || parseFloat(this.itemToEdit.cantidad) < 0) {
                Swal.fire({
                    icon: "warning",
                    title: "Cantidad inválida",
                    text: "La cantidad debe ser un número mayor o igual a cero.",
                    confirmButtonColor: '#ffc107'
                });
                return;
            }

            // Mostrar loading
            Swal.fire({
                title: 'Guardando cambios',
                text: 'Por favor espere...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const url = `${config.BASE_URL}/api/tomas/${this.itemToEdit.id}`;

            try {
                const response = await axios.put(url, this.itemToEdit, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true
                });

                // Actualizar datos locales
                const index = this.tomas.findIndex(item => item.id === this.itemToEdit.id);
                if (index !== -1) {
                    this.tomas[index] = response.data;
                }

                // Actualizar la selección actual
                this.selectedItem = response.data;

                // Salir del modo de edición
                this.isEditing = false;

                // Cerrar el indicador de carga
                Swal.close();

                // Notificar éxito con un toast
                const toast = Swal.mixin({
                    toast: true,
                    position: 'bottom',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

                toast.fire({
                    icon: 'success',
                    title: 'Producto actualizado correctamente'
                });

                // Refrescar datos para asegurar sincronización
                this.obtenerTomas();

            } catch (error) {
                // Cerrar el indicador de carga
                Swal.close();

                console.error("Error al actualizar el producto:", error);

                let errorMessage = "Hubo un problema al actualizar el producto.";

                if (error.response) {
                    if (error.response.status === 401) {
                        errorMessage = "No autorizado. Inicie sesión nuevamente.";
                    } else if (error.response.status === 403) {
                        errorMessage = "No tiene permisos para realizar esta acción.";
                    } else if (error.response.status === 500) {
                        errorMessage = "Error interno del servidor.";
                    } else if (error.response.data && error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error.request) {
                    errorMessage = "No se recibió respuesta del servidor. Verifique su conexión.";
                }

                Swal.fire({
                    icon: "error",
                    title: "Error al actualizar",
                    text: errorMessage,
                    confirmButtonColor: '#dc3545'
                });
            }
        }
    },
    watch: {
        codigoInventario(newVal) {
            if (newVal && newVal.trim() !== "") {
                this.currentPage = 0; // Reset a la primera página al cambiar el código
                this.obtenerTomas();
            }
        },
        fechaInicio() {
            this.debounceObtenerTomas();
        }
    }
};
</script>

<!-- Añadimos algunos estilos para mejorar la apariencia del selector de vista -->

<style scoped>
.view-selector-container {
    margin-bottom: 12px;
}

.view-selector-container .btn-group {
    width: 100%;
    max-width: 300px;
}

.view-selector-container .btn {
    border-radius: 20px;
    font-size: 0.9rem;
    padding: 8px 16px;
    flex: 1;
}

/* Estilos adicionales para la tabla en móvil */
.table-responsive {
    border-radius: 12px;
    overflow-x: auto; /* Añade desplazamiento horizontal */
    box-shadow: 0 2px 5px rgba(0,0,0,0.08);
    max-width: 100%; /* Asegura que no exceda el ancho del contenedor */
    -webkit-overflow-scrolling: touch; /* Para mejor desplazamiento en iOS */
}

.table-responsive table {
    margin-bottom: 0;
    min-width: 500px; /* Establece un ancho mínimo para la tabla */
}
</style>
