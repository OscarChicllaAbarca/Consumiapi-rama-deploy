<template>
<div class="inventario-container">
    <!-- Filtros optimizados -->
    <div class="filtros-panel">
        <div class="filtro-grupo">
            <div class="filtro-item">
                <label for="codigoInventario" class="filtro-label">
                    <i class="fas fa-barcode"></i> Código
                </label>
                <div class="dropdown-container" ref="dropdown">
                    <div class="dropdown-header" @click="toggleDropdown">
                        <span class="dropdown-text">{{ selectedCodigo || "Selecciona un código" }}</span>
                        <i class="fas" :class="isDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                    </div>
                    <transition name="fade">
                        <ul v-show="isDropdownOpen" class="dropdown-list">
                            <li v-for="codigo in codigos" :key="codigo" @click="selectCodigo(codigo)" class="dropdown-item" :class="{'dropdown-item-active': codigo === selectedCodigo}">
                                {{ codigo }}
                            </li>
                        </ul>
                    </transition>
                </div>
            </div>

            <div class="filtro-item">
                <label for="ubicacion" class="filtro-label">
                    <i class="fas fa-map-marker-alt"></i> Ubicación
                </label>
                <div class="input-icon-wrapper">
                    <input type="text" id="ubicacion" v-model="ubicacion" @change="guardarEnLocalStorage" class="filtro-input" placeholder="Ingrese ubicación" />
                    <i v-if="ubicacion" @click="limpiarUbicacion" class="fas fa-times-circle input-clear-icon"></i>
                </div>
            </div>

            <div class="filtro-item">
                <label for="producto" class="filtro-label">
                    <i class="fas fa-box"></i> Producto
                </label>
                <div class="input-icon-wrapper">
                    <input type="text" id="producto" v-model="producto" @change="guardarEnLocalStorage" class="filtro-input" placeholder="Ingrese producto" />
                    <i v-if="producto" @click="limpiarProducto" class="fas fa-times-circle input-clear-icon"></i>
                </div>
            </div>
        </div>

        <!-- Botones de acción -->
        <div class="filtro-acciones">
            <button @click="resetFiltros" class="btn-reset">
                <i class="fas fa-sync-alt"></i>
                <span class="btn-text">Restablecer</span>
            </button>
            <button @click="obtenerTomas" class="btn-buscar">
                <i class="fas fa-search"></i>
                <span class="btn-text">Buscar</span>
            </button>
        </div>
    </div>

    <!-- Resumen de resultados y stats -->
    <div v-if="detalles.length > 0" class="resultados-stats">
        <div class="stat-item">
            <div class="stat-value">{{ detalles.length }}</div>
            <div class="stat-label">Total registros</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{ completadosCount }}</div>
            <div class="stat-label">Completados</div>
        </div>
        <div class="stat-item">
            <div class="stat-value">{{ pendientesCount }}</div>
            <div class="stat-label">Pendientes</div>
        </div>
    </div>

    <!-- Loading state -->
    <transition name="fade">
        <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <span>Cargando inventario...</span>
        </div>
    </transition>

    <!-- Estado vacío -->
    <transition name="fade">
        <div v-if="!isLoading && detalles.length === 0" class="empty-state">
            <i class="fas fa-box-open empty-icon"></i>
            <p class="empty-text">No se encontraron productos</p>
            <p class="empty-hint">Intenta con otros filtros</p>
        </div>
    </transition>

    <!-- Tabla de inventario -->
    <transition name="fade">
        <div class="table-container" v-if="!isLoading && detalles.length > 0">
            <!-- Vista mobile: cards -->
            <div class="mobile-cards">
                <div v-for="detalle in paginatedDetalles" :key="detalle.codigoInv" class="mobile-card" :class="{'card-completado': detalle.status === 'completado'}" @click="detalle.status !== 'completado' && navigateToTomaInventario(detalle)">

                    <div class="card-header">
                        <div class="card-title">{{ detalle.producto }}</div>
                        <span class="card-badge" :class="getBadgeClass(detalle.status)">
                            {{ detalle.status }}
                        </span>
                    </div>

                    <div class="card-body">
                        <div class="card-detail">
                            <i class="fas fa-map-marker-alt"></i> {{ detalle.ubicacion }}
                        </div>
                        <div class="card-detail">
                            <i class="fas fa-clipboard-list"></i> {{ detalle.descripcionProducto }}
                        </div>
                        <div class="card-detail">
                            <i class="fas fa-cubes"></i> {{ detalle.ctd }} {{ detalle.unidadMedidaBase }}
                        </div>
                        <div class="card-detail">
                            <i class="fas fa-tag"></i> {{ detalle.lote }}
                        </div>
                        <div class="card-detail">
                            <i class="fas fa-building"></i> {{ detalle.propietario }}
                        </div>
                    </div>

                    <div class="card-footer" v-if="detalle.status !== 'completado'">
                        <span class="tap-hint">Toca para iniciar toma <i class="fas fa-hand-pointer"></i></span>
                    </div>
                </div>
            </div>

            <!-- Vista desktop: tabla -->
            <table class="inventario-table">
                <thead>
                    <tr>
                        <th v-for="field in tableHeaders" :key="field.value">
                            <div class="th-content">
                                <i :class="'fas ' + field.icon"></i>
                                <span>{{ field.label }}</span>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="detalle in paginatedDetalles" :key="detalle.codigoInv" :class="{'row-completado': detalle.status === 'completado', 'row-disabled': detalle.status === 'completado'}" @click="detalle.status !== 'completado' && navigateToTomaInventario(detalle)" class="table-row">
                        <td v-for="field in displayedFields" :key="field">{{ detalle[field] }}</td>
                    </tr>
                </tbody>
            </table>

            <!-- Paginación optimizada -->
            <div class="pagination-container">
                <div class="pagination-info">
                    <span>Página {{ currentPage }} de {{ totalPages }}</span>
                </div>
                <div class="pagination">
                    <button @click="goToFirstPage" :disabled="currentPage === 1" class="pagination-btn" title="Primera página">
                        <i class="fas fa-angle-double-left"></i>
                    </button>
                    <button @click="goToPreviousPage" :disabled="currentPage === 1" class="pagination-btn" title="Página anterior">
                        <i class="fas fa-angle-left"></i>
                    </button>

                    <!-- Números de página - desktop -->
                    <div class="page-numbers">
                        <button v-for="page in visiblePageNumbers" :key="page" @click="goToPage(page)" :class="['page-number', { 'active': currentPage === page }]">
                            {{ page }}
                        </button>
                    </div>

                    <button @click="goToNextPage" :disabled="currentPage === totalPages" class="pagination-btn" title="Página siguiente">
                        <i class="fas fa-angle-right"></i>
                    </button>
                    <button @click="goToLastPage" :disabled="currentPage === totalPages" class="pagination-btn" title="Última página">
                        <i class="fas fa-angle-double-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </transition>
</div>
</template>

    
    
<script>
import {
    mapState,
    mapGetters,
    mapActions,
    mapMutations
} from 'vuex';

export default {
    data() {
        return {
            isDropdownOpen: false,
            displayedFields: ["ubicacion", "producto", "descripcionProducto", "ctd", "lote", "unidadMedidaBase", "propietario", "status"],
            tableHeaders: [{
                    label: "Ubicación",
                    value: "ubicacion",
                    icon: "fa-map-marker-alt"
                },
                {
                    label: "Producto",
                    value: "producto",
                    icon: "fa-box"
                },
                {
                    label: "Descripción",
                    value: "descripcionProducto",
                    icon: "fa-clipboard-list"
                },
                {
                    label: "Cantidad",
                    value: "ctd",
                    icon: "fa-cubes"
                },
                {
                    label: "Lote",
                    value: "lote",
                    icon: "fa-tag"
                },
                {
                    label: "Unidad",
                    value: "unidadMedidaBase",
                    icon: "fa-ruler"
                },
                {
                    label: "Centro",
                    value: "propietario",
                    icon: "fa-building"
                },
                {
                    label: "Estado",
                    value: "status",
                    icon: "fa-check-circle"
                }
            ],
            isLoading: false,
            ubicacion: "",
            producto: "",
            touchStartY: 0,
            touchEndY: 0,
            // Responsive
            windowWidth: window.innerWidth
        };
    },
    computed: {
        ...mapState(['codigos', 'selectedCodigo', 'detalles', 'currentPage']),
        ...mapGetters(['paginatedDetalles', 'totalPages']),

        completadosCount() {
            return this.detalles.filter(d => d.status === 'completado').length;
        },
        pendientesCount() {
            return this.detalles.filter(d => d.status !== 'completado').length;
        },
        visiblePageNumbers() {
            const maxVisible = this.windowWidth < 768 ? 3 : 5;
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
        isMobile() {
            return this.windowWidth < 768;
        }
    },
    methods: {
        ...mapActions(['fetchCodigos', 'fetchDetalles']),
        ...mapMutations(['setUbicacion', 'setProducto', 'resetFiltros']),

        async guardarEnLocalStorage() {
            this.setUbicacion(this.ubicacion);
            this.setProducto(this.producto);
            this.obtenerTomas();
            this.$store.commit('setCurrentPage', 1);
        },

        limpiarUbicacion() {
            this.ubicacion = '';
            this.guardarEnLocalStorage();
        },

        limpiarProducto() {
            this.producto = '';
            this.guardarEnLocalStorage();
        },

        resetFiltros() {
            this.ubicacion = '';
            this.producto = '';
            this.setUbicacion('');
            this.setProducto('');

            localStorage.removeItem('ubicacion');
            localStorage.removeItem('producto');

            this.$store.commit('setCurrentPage', 1);
            this.obtenerTomas();

            // Cierra el dropdown si está abierto
            this.isDropdownOpen = false;
        },

        async obtenerTomas() {
            this.isLoading = true;

            try {
                await this.fetchDetalles(this.selectedCodigo);
            } catch (error) {
                console.error('Error al obtener datos:', error);
                // Mostrar mensaje de error
            } finally {
                this.isLoading = false;
            }
        },

        toggleDropdown() {
            this.isDropdownOpen = !this.isDropdownOpen;

            // Añadir evento para cerrar dropdown al hacer clic fuera
            if (this.isDropdownOpen) {
                setTimeout(() => {
                    document.addEventListener('click', this.closeDropdownOutside);
                }, 0);
            } else {
                document.removeEventListener('click', this.closeDropdownOutside);
            }
        },

        closeDropdownOutside(event) {
            if (this.$refs.dropdown && !this.$refs.dropdown.contains(event.target)) {
                this.isDropdownOpen = false;
                document.removeEventListener('click', this.closeDropdownOutside);
            }
        },

        selectCodigo(codigo) {
            event.stopPropagation(); // Detiene la propagación del evento
            this.$store.commit('setSelectedCodigo', codigo);
            this.isDropdownOpen = false;
            this.obtenerTomas();
        },

        navigateToTomaInventario(detalle) {
            // Añadir feedback visual antes de navegar
            const element = event.currentTarget;
            element.classList.add('pulse-effect');

            // Guardar datos y navegar después de una breve animación
            setTimeout(() => {
                sessionStorage.setItem('codigoArchivo', detalle.codigoArchivo);
                this.$router.push({
                    name: 'Toma'
                });
            }, 300);
        },

        getBadgeClass(status) {
            return status === 'completado' ? 'badge-success' : 'badge-pending';
        },

        goToFirstPage() {
            this.$store.commit('setCurrentPage', 1);
        },

        goToPreviousPage() {
            if (this.currentPage > 1) {
                this.$store.commit('setCurrentPage', this.currentPage - 1);
            }
        },

        goToNextPage() {
            if (this.currentPage < this.totalPages) {
                this.$store.commit('setCurrentPage', this.currentPage + 1);
            }
        },

        goToLastPage() {
            this.$store.commit('setCurrentPage', this.totalPages);
        },

        goToPage(page) {
            this.$store.commit('setCurrentPage', page);
        },

        handleResize() {
            this.windowWidth = window.innerWidth;
        },

        // Soporte para gestos táctiles
        handleTouchStart(event) {
            this.touchStartY = event.touches[0].clientY;
        },

        handleTouchEnd(event) {
            this.touchEndY = event.changedTouches[0].clientY;
            this.handleSwipeGesture();
        },

        handleSwipeGesture() {
            const swipeDistance = this.touchEndY - this.touchStartY;

            // Swipe hacia abajo - página anterior
            if (swipeDistance > 100) {
                this.goToPreviousPage();
            }

            // Swipe hacia arriba - página siguiente
            if (swipeDistance < -100) {
                this.goToNextPage();
            }
        }
    },
    watch: {
        selectedCodigo(newCodigo) {
            if (newCodigo) {
                this.obtenerTomas();
            }
        }
    },
    created() {
        this.isLoading = true;
        this.fetchCodigos();
        this.ubicacion = localStorage.getItem('ubicacion') || '';
        this.producto = localStorage.getItem('producto') || '';
    },

    mounted() {
        this.obtenerTomas();

        // Manejo de eventos para responsividad
        window.addEventListener('resize', this.handleResize);

        // Soporte para gestos táctiles
        if (this.isMobile) {
            document.addEventListener('touchstart', this.handleTouchStart, {
                passive: true
            });
            document.addEventListener('touchend', this.handleTouchEnd, {
                passive: true
            });
        }
    },

    beforeDestroy() {
        window.removeEventListener('resize', this.handleResize);

        if (this.isMobile) {
            document.removeEventListener('touchstart', this.handleTouchStart);
            document.removeEventListener('touchend', this.handleTouchEnd);
        }

        document.removeEventListener('click', this.closeDropdownOutside);
    }
};
</script>

   
<style scoped>
/* ===== ESTILOS BASE RESPONSIVOS ===== */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

.inventario-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: clamp(12px, 3vw, 24px);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    color: #333;
    background-color: #f8faf9;
    font-size: 1rem;
    line-height: 1.5;
}

/* ===== PANEL DE FILTROS RESPONSIVO ===== */
.filtros-panel {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: clamp(12px, 2vw, 24px);
    margin-bottom: clamp(16px, 3vw, 24px);
    animation: fadeIn 0.5s ease;
    border: 1px solid #e0e0e0;
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    width: 100%;
}

.filtros-panel:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.filtro-grupo {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(12px, 2vw, 16px);
    margin-bottom: clamp(12px, 2vw, 16px);
}

.filtro-item {
    flex: 1 1 clamp(200px, 30%, 350px);
    transition: transform 0.3s ease;
    min-width: 0;
    /* Permite que los elementos se reduzcan por debajo de su tamaño mínimo de contenido */
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
    color: #196d43;
}

.filtro-input {
    width: 100%;
    padding: clamp(8px, 2vw, 12px);
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.3s;
    background-color: white;
}

.filtro-input:hover {
    border-color: #196d43;
    box-shadow: 0 2px 8px rgba(25, 109, 67, 0.1);
}

.filtro-input:focus {
    outline: none;
    border-color: #196d43;
    box-shadow: 0 0 0 3px #e6f1ec;
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
    background-color: rgba(25, 109, 67, 0.1);
}

/* Dropdown responsivo */
.dropdown-container {
    position: relative;
    min-width: 200px; /* Ancho mínimo para contener los códigos largos */
}

.dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: clamp(8px, 2vw, 12px);
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.3s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 30px; /* Espacio para el icono */
}

.dropdown-header:hover {
    border-color: #196d43;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(25, 109, 67, 0.1);
}

.dropdown-text {
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    margin-right: 8px;
}

.dropdown-list {
    position: absolute;
    top: calc(100% + 5px);
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 11;
    margin: 0;
    padding: 0;
    list-style: none;
    animation: slideDown 0.3s ease;
    transform-origin: top center;
}

.dropdown-item {
    padding: clamp(8px, 1.5vw, 12px);
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.dropdown-item:hover {
    background-color: #e6f1ec;
    transform: translateX(5px);
    border-left: 3px solid #196d43;
    margin-left: -3px; /* Compensa el borde añadido */
    overflow: visible;
    white-space: normal;
    z-index: 1002;
    position: relative;
}

.dropdown-item:after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
    background-color: #196d43;
    transform: scaleY(0);
    transition: transform 0.2s ease;
}

.dropdown-item:hover:after {
    transform: scaleY(1);
}

.dropdown-item-active {
    background-color: #e6f1ec !important;
    color: #196d43 !important;
    font-weight: 500 !important;
    position: relative !important;
    z-index: 10 !important; /* Asegura que esté por encima */
    border-left: 3px solid #196d43 !important; /* Alternativa más confiable que el pseudo-elemento */
    margin-left: -3px !important; /* Compensa el borde añadido */
    box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
}

/* Elimina el pseudo-elemento :after que puede causar problemas de renderizado */
.dropdown-item-active:after {
    display: none !important;
}

/* Asegura que el dropdown esté por encima de otros elementos */
.dropdown-container {
    position: relative !important;
    z-index: 1000 !important;
}

.dropdown-list {
    z-index: 1001 !important;
    position: absolute !important;
    /* Resto de tus estilos para dropdown-list */
}

.filtro-acciones {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 16px;
}

@media screen and (max-width: 600px) {
    .filtro-acciones {
        flex-direction: column;
        width: 100%;
    }
}

.btn-reset,
.btn-buscar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: clamp(8px, 2vw, 16px);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.3s, box-shadow 0.3s;
    position: relative;
    overflow: hidden;
    font-size: clamp(0.875rem, 1vw, 1rem);
}

.btn-reset {
    background-color: #f0f0f0;
    color: #333;
}

.btn-buscar {
    background-color: #196d43;
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
    background-color: #0e5230;
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

@media screen and (max-width: 600px) {

    .btn-reset,
    .btn-buscar {
        width: 100%;
        margin-bottom: 8px;
    }
}

/* ===== TARJETAS DE ESTADÍSTICAS ===== */
.resultados-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: clamp(16px, 4vw, 24px);
    animation: fadeIn 0.5s ease;
    gap: clamp(10px, 2vw, 16px);
    flex-wrap: wrap;
}

.stat-item {
    text-align: center;
    padding: clamp(12px, 3vw, 20px);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-width: clamp(100px, 20%, 150px);
    animation: statsAppear 0.5s ease;
    transition: transform 0.3s, box-shadow 0.3s;
    border: 1px solid #e0e0e0;
    flex: 1;
    overflow: hidden;
}

.stat-item:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(to right, #196d43, #4CAF50);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s ease;
}

.stat-item:hover:before {
    transform: scaleX(1);
}

.stat-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.stat-value {
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: bold;
    color: #196d43;
    margin-bottom: 5px;
    transition: transform 0.3s;
}

.stat-item:hover .stat-value {
    transform: scale(1.1);
}

.stat-label {
    font-size: clamp(0.75rem, 2vw, 0.9rem);
    color: #666;
    font-weight: 500;
}

@media screen and (max-width: 767px) {
    .resultados-stats {
        flex-wrap: wrap;
    }

    .stat-item {
        flex: 1 1 calc(33.333% - 15px);
        min-width: 100px;
    }
}

@media screen and (max-width: 480px) {
    .stat-item {
        flex: 1 1 100%;
        margin-bottom: 10px;
    }

    .resultados-stats {
        flex-direction: column;
    }
}

/* ===== ESTADO DE CARGA ===== */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(20px, 5vw, 40px);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.5s ease;
    width: 100%;
}

.loading-spinner {
    width: clamp(30px, 6vw, 50px);
    height: clamp(30px, 6vw, 50px);
    border: 3px solid #e6f1ec;
    border-top: 3px solid #196d43;
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
    font-size: clamp(0.9rem, 2vw, 1.1rem);
    color: #666;
}

/* ===== ESTADO VACÍO ===== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: clamp(20px, 5vw, 40px);
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    animation: bounceIn 0.6s ease;
    width: 100%;
}

.empty-icon {
    font-size: clamp(2.5rem, 8vw, 4rem);
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
    font-size: clamp(1rem, 3vw, 1.4rem);
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
}

.empty-hint {
    font-size: clamp(0.8rem, 2vw, 1rem);
    color: #666;
    text-align: center;
}

/* ===== CONTENEDOR DE TABLA ===== */
.table-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    animation: slideUp 0.5s ease;
    border: 1px solid #dde8dc;
    transition: box-shadow 0.3s;
    width: 100%;
}

.table-container:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* ===== TABLA DESKTOP ===== */
.inventario-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 600px;
    background-color: white;
}

.inventario-table th,
.inventario-table td {
    padding: clamp(8px, 2vw, 15px);
    text-align: left;
    border-bottom: 1px solid #dde8dc;
}

.inventario-table th {
    background-color: #196d43;
    background-image: linear-gradient(135deg, #196d43 0%, #0e4f2f 100%);
    color: white;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 5;
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
    font-size: clamp(0.8rem, 2vw, 0.95rem);
    letter-spacing: 0.5px;
    text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2);
    transition: background-color 0.3s;
}

.inventario-table th:hover {
    background-image: linear-gradient(135deg, #0e5230 0%, #0a3a23 100%);
}

.th-content {
    display: flex;
    align-items: center;
    gap: 8px;
}

.th-content i {
    font-size: clamp(0.8rem, 1.5vw, 0.9rem);
    opacity: 0.9;
    transition: transform 0.3s;
}

.inventario-table th:hover .th-content i {
    transform: scale(1.2);
}

.inventario-table tbody tr:nth-child(even) {
    background-color: #f9fdf7;
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

.row-completado {
    background-color: rgba(40, 97, 18, 0.363) !important;
    border-left: 3px solid #b71c1c;
}

.row-disabled {
    pointer-events: none;
    opacity: 0.8;
}

/* ===== TARJETAS MÓVILES ===== */
.mobile-cards {
    display: none;
    flex-direction: column;
    gap: clamp(10px, 2vw, 15px);
    margin-bottom: clamp(15px, 3vw, 25px);
    width: 100%;
   
}

.mobile-card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.4s, box-shadow 0.4s;
    animation: cardAppear 0.5s ease;
    border: 1px solid rgba(0, 0, 0, 0.05);
    position: relative;
    width: 100%;
}

.mobile-card::before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(45deg, #196d43, #4CAF50, #196d43);
    z-index: -1;
    border-radius: 14px;
    opacity: 0;
    transition: opacity 0.4s;
}

.mobile-card:hover::before {
    opacity: 0.8;
}

.mobile-card:hover {
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    transform: translateY(-5px) scale(1.02);
}

.mobile-card:active {
    transform: scale(0.98);
}

.card-completado {
    border-left: 4px solid #b71c1c;
    background-color: rgba(183, 28, 28, 0.05);
}

.card-header {
    padding: clamp(10px, 3vw, 15px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #dde8dc;
    background: #e6f1ec;
    position: relative;
    overflow: hidden;
}

.card-header::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.6), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s;
}

.mobile-card:hover .card-header::after {
    transform: translateX(100%);
}

.card-title {
    font-weight: 600;
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
    color: #196d43;
    transition: transform 0.3s;
    max-width: 60%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mobile-card:hover .card-title {
    transform: scale(1.05);
}

.card-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: clamp(0.7rem, 1.8vw, 0.8rem);
    font-weight: 500;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
    white-space: nowrap;
}

.mobile-card:hover .card-badge {
    transform: scale(1.1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.badge-success {
    background-color: rgba(183, 28, 28, 0.1);
    color: #b71c1c;
    border: 1px solid rgba(183, 28, 28, 0.2);
}

.badge-pending {
    background-color: #fff8e1;
    color: #ff8f00;
    border: 1px solid rgba(255, 143, 0, 0.2);
}

.card-body {
    padding: clamp(10px, 3vw, 15px);
}

.card-detail {
    margin-bottom: clamp(8px, 2vw, 12px);
    display: flex;
    align-items: flex-start;
    gap: 10px;
    transition: transform 0.3s;
    padding: 4px 0;
    font-size: clamp(0.8rem, 2vw, 0.95rem);
}

.card-detail:hover {
    transform: translateX(5px);
}

.card-detail i {
    color: #196d43;
    width: 20px;
    opacity: 0.8;
    transition: transform 0.3s;
    font-size: clamp(0.8rem, 2vw, 0.9rem);
}

.card-detail:hover i {
    transform: scale(1.2);
}

.card-footer {
    padding: clamp(8px, 3vw, 12px);
    border-top: 1px solid #dde8dc;
    text-align: center;
    background-color: #e6f1ec;
    transition: background-color 0.3s;
}

.mobile-card:hover .card-footer {
    background-color: #d0e8dc;
}

.tap-hint {
    font-size: clamp(0.8rem, 2vw, 0.9rem);
    color: #196d43;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-weight: 500;
}

.tap-hint i {
    animation: tapPulseEnhanced 1.5s infinite;
}

@keyframes tapPulseEnhanced {
    0% {
        transform: scale(1) translateY(0);
        opacity: 0.7;
    }

    40% {
        transform: scale(1.3) translateY(-2px);
        opacity: 1;
    }

    80% {
        transform: scale(1) translateY(0);
        opacity: 0.7;
    }
}

/* ===== PAGINACIÓN RESPONSIVA ===== */
.pagination-container {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    padding: clamp(10px, 3vw, 15px);
    border-top: 1px solid #dde8dc;
    background-color: #f5f5f5;
    transition: background-color 0.3s;
    width: 100%;
}

.pagination-container:hover {
    background-color: #edf7f1;
}

.pagination-info {
    font-size: clamp(0.8rem, 2vw, 0.95rem);
    color: #196d43;
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
    width: clamp(32px, 6vw, 38px);
    height: clamp(32px, 6vw, 38px);
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
    font-size: clamp(0.7rem, 1.5vw, 0.9rem);
}

.pagination-btn::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: radial-gradient(circle, rgba(25, 109, 67, 0.2) 0%, transparent 70%);
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
    color: #196d43;
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
    width: clamp(32px, 6vw, 38px);
    height: clamp(32px, 6vw, 38px);
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
    font-size: clamp(0.7rem, 1.5vw, 0.9rem);
}

.page-number::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: radial-gradient(circle, rgba(25, 109, 67, 0.2) 0%, transparent 70%);
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
    background-color: #196d43;
    background-image: linear-gradient(135deg, #196d43 0%, #0e4f2f 100%);
    color: white;
    font-weight: 600;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
    transform: scale(1.1);
}

@media screen and (max-width: 767px) {
    .pagination-container {
        flex-direction: column;
        gap: 10px;
    }

    .pagination-info {
        width: 100%;
        text-align: center;
        margin-bottom: 10px;
    }

    .pagination {
        width: 100%;
        justify-content: center;
    }
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

@keyframes slideDown {
    from {
        transform: translateY(-30px) scaleY(0.8);
        opacity: 0;
    }

    to {
        transform: translateY(0) scaleY(1);
        opacity: 1;
    }
}

@keyframes cardAppear {
    0% {
        transform: translateY(30px) scale(0.9);
        opacity: 0;
    }

    60% {
        transform: translateY(-5px) scale(1.02);
    }

    100% {
        transform: translateY(0) scale(1);
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

@keyframes statsAppear {
    0% {
        transform: scale(0.8);
        opacity: 0;
    }

    40% {
        transform: scale(1.1);
    }

    60% {
        transform: scale(0.95);
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}

.pulse-effect {
    animation: enhancedPulse 0.5s ease-in-out;
}

@keyframes enhancedPulse {
    0% {
        transform: scale(1);
    }

    30% {
        transform: scale(0.95);
        box-shadow: 0 0 0 10px rgba(25, 109, 67, 0.1);
    }

    70% {
        transform: scale(1.02);
    }

    100% {
        transform: scale(1);
    }
}

/* Transiciones */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s, transform 0.5s;
}

.fade-enter {
    opacity: 0;
    transform: translateY(20px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}

/* ===== MEJORAS RESPONSIVE ===== */
@media screen and (max-width: 991px) {
    .filtro-grupo {
        flex-direction: column;
    }

    .filtro-item {
        flex: 1 1 100%;
        margin-bottom: 8px;
    }

    .inventario-table th,
    .inventario-table td {
        padding: 10px;
        font-size: 0.9rem;
    }

    .inventario-container {
        padding: 10px;
    }

    .filtros-panel {
        padding: 12px;
    }
}

/* Ajustes específicos para tablets */
@media screen and (max-width: 767px) {
    .inventario-container {
        padding: 10px;
    }

    .resultados-stats {
        flex-wrap: wrap;
    }

    .stat-item {
        flex: 1 1 calc(33.333% - 10px);
        min-width: unset;
    }

    .inventario-table {
        display: none;
    }

    .mobile-cards {
        display: flex;
    }

    .filtro-acciones {
        flex-direction: column;
        width: 100%;
    }

    .btn-reset,
    .btn-buscar {
        width: 100%;
        margin-bottom: 5px;
    }

    .pagination-container {
        flex-direction: column;
        gap: 10px;
    }

    .pagination-info {
        width: 100%;
        text-align: center;
        margin-bottom: 10px;
    }

    .pagination {
        width: 100%;
        justify-content: center;
    }

    .page-numbers {
        flex-wrap: wrap;
        justify-content: center;
    }
}

/* Ajustes específicos para smartphones */
@media screen and (max-width: 480px) {
    .stat-item {
        flex: 1 1 100%;
        margin-bottom: 10px;
    }

    .resultados-stats {
        flex-direction: column;
    }

    .mobile-card {
        font-size: 0.9rem;
    }

    .card-title {
        max-width: 55%;
        font-size: 0.95rem;
    }

    .card-badge {
        font-size: 0.75rem;
        padding: 4px 8px;
    }

    .card-detail {
        font-size: 0.85rem;
        margin-bottom: 8px;
    }

    .filtros-panel {
        padding: 12px;
    }

    .filtro-label {
        font-size: 0.85rem;
    }

    .filtro-input,
    .dropdown-header {
        font-size: 0.9rem;
        padding: 8px 10px;
    }

    .btn-text {
        font-size: 0.9rem;
    }

    .pagination-btn,
    .page-number {
        width: 30px;
        height: 30px;
    }

    .pagination {
        gap: 3px;
    }

    .empty-text {
        font-size: 1.1rem;
    }

    .empty-hint {
        font-size: 0.85rem;
    }
}

/* Ajustes específicos para pantallas muy pequeñas */
@media screen and (max-width: 360px) {
    .inventario-container {
        padding: 8px;
    }

    .filtros-panel {
        padding: 10px;
    }

    .card-title {
        max-width: 50%;
        font-size: 0.9rem;
    }

    .card-badge {
        font-size: 0.7rem;
        padding: 3px 6px;
    }

    .card-detail {
        font-size: 0.8rem;
    }

    .pagination-btn,
    .page-number {
        width: 28px;
        height: 28px;
        font-size: 0.75rem;
    }

    .page-numbers {
        max-width: 100%;
        overflow-x: auto;
        padding-bottom: 5px;
    }

    .btn-reset,
    .btn-buscar {
        padding: 6px 12px;
    }

    .btn-text {
        font-size: 0.85rem;
    }
}

/* Ajustes para pantallas de alta resolución */
@media screen and (min-width: 1440px) {
    .inventario-container {
        padding: 30px;
        max-width: 1400px;
    }

    .filtros-panel {
        padding: 25px;
    }

    .filtro-input,
    .dropdown-header {
        padding: 12px 15px;
    }

    .btn-reset,
    .btn-buscar {
        padding: 12px 20px;
    }

    .card-detail {
        font-size: 1rem;
        margin-bottom: 15px;
    }

    .card-title {
        font-size: 1.2rem;
    }

    .inventario-table th,
    .inventario-table td {
        padding: 15px 20px;
    }

    .card-header,
    .card-body,
    .card-footer {
        padding: 20px;
    }
}

/* Soporte para modo oscuro si el usuario lo tiene activado */
@media (prefers-color-scheme: dark) {
    /* Estos estilos solo se aplicarán si el usuario tiene configurado el modo oscuro en su sistema */
    /* Puedes desactivar esta sección si no deseas soporte para modo oscuro */
    /* 
  .inventario-container {
    background-color: #1e1e1e;
    color: #e0e0e0;
  }
  
  .filtros-panel,
  .stat-item,
  .loading-container,
  .empty-state,
  .table-container,
  .mobile-card {
    background-color: #2d2d2d;
    border-color: #444;
  }
  
  .filtro-input,
  .dropdown-header {
    background-color: #333;
    border-color: #555;
    color: #e0e0e0;
  }
  
  .dropdown-list,
  .inventario-table {
    background-color: #2d2d2d;
  }
  
  .btn-reset {
    background-color: #444;
    color: #e0e0e0;
  }
  
  .inventario-table tbody tr:nth-child(even) {
    background-color: #333;
  }
  
  .inventario-table tbody tr:nth-child(odd) {
    background-color: #2d2d2d;
  }
  */
}

/* Optimizaciones para impresión */
@media print {

    .filtros-panel,
    .filtro-acciones,
    .pagination-container,
    .mobile-cards {
        display: none !important;
    }

    .inventario-table {
        display: table !important;
        width: 100% !important;
    }

    .inventario-container {
        padding: 0 !important;
        max-width: 100% !important;
    }

    .resultados-stats {
        justify-content: flex-start;
        margin-bottom: 20px;
    }

    .stat-item {
        box-shadow: none;
        border: 1px solid #ddd;
        margin-right: 20px;
    }

    .inventario-table th {
        background: #eee !important;
        color: #333 !important;
        border: 1px solid #ddd;
    }

    .inventario-table td {
        border: 1px solid #ddd;
    }

    .row-completado {
        background-color: #f0f0f0 !important;
        border-left: 3px solid #999;
    }
}
</style>
