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
                autoUpdateInterval: null,
                isUpdating: false,
                ubicacion: "",
                producto: "",
            };
        },
        computed: {
            ...mapState(['codigos', 'selectedCodigo', 'detalles', 'currentPage', 'ubicacion', 'producto']),
            ...mapGetters(['paginatedDetalles', 'totalPages']),
    
            completadosCount() {
                    return this.detalles.filter(detalle => detalle.status === 'completado').length;
                },
                
                // Adding the pendientesCount property
                pendientesCount() {
                    return this.detalles.filter(detalle => detalle.status !== 'completado').length;
            }
        },
       
        methods: {
            ...mapActions(['fetchCodigos', 'fetchDetalles']),
            ...mapMutations(['setUbicacion', 'setProducto', 'resetFiltros']),
            async guardarEnLocalStorage() {
                this.setUbicacion(this.ubicacion);
                this.setProducto(this.producto);
                this.obtenerTomas(); // Actualiza los datos con los nuevos filtros
                this.$store.commit('setCurrentPage', 1);
            },
            getBadgeClass(status) {
                return status === 'completado' ? 'badge-success' : 'badge-pending';
            },
            resetFiltros() {
                // Limpiar los valores de ubicación y producto
                this.setUbicacion('', '');
                this.setProducto('', '');
    
                // Limpiar los valores en localStorage
                localStorage.removeItem('ubicacion');
                localStorage.removeItem('producto');
    
                this.$store.commit('setCurrentPage', 1);
    
                // También podemos llamar a la API para obtener los datos con los filtros vacíos
                this.obtenerTomas();
            },

            limpiarUbicacion() {
                // Clear only the location field
                this.ubicacion = '';
                this.resetFiltros();
                // Remove from localStorage
                
            },
            limpiarProducto() {
                // Clear only the product field
                this.producto = '';
                this.resetFiltros();
            },

            actualizarUbicacion() {
                this.setUbicacion(this.ubicacion);
                this.obtenerTomas(); // Filtrar con los valores actuales
            },
            actualizarProducto() {
                this.setProducto(this.producto);
                this.obtenerTomas(); // Filtrar con los valores actuales
            },
            obtenerTomas() {
                this.fetchDetalles();
            },
            toggleDropdown() {
                this.isDropdownOpen = !this.isDropdownOpen;
            },
            selectCodigo(codigo) {
                this.$store.commit('setSelectedCodigo', codigo);
                this.isDropdownOpen = false;
                this.obtenerTomas();
            },
    
            navigateToTomaInventario(detalle) {
                sessionStorage.setItem('codigoArchivo', detalle.codigoArchivo);
                this.$router.push({
                    name: 'Toma'
                });
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
    
            startAutoUpdate() {
                this.fetchDetalles(this.selectedCodigo);
            },
            obtenerTomas() {
                this.fetchDetalles(this.selectedCodigo);
            },
    
        },
        watch: {
            selectedCodigo(newCodigo) {
                if (newCodigo) {
                    this.fetchDetalles(newCodigo);
                }
            },
        },
        created() {
    
            this.fetchCodigos();
            this.ubicacion = localStorage.getItem('ubicacion') || '';
            this.producto = localStorage.getItem('producto') || '';
        },
    
        mounted() {
            this.startAutoUpdate();
        },
    
        beforeDestroy() {
            this.stopAutoUpdate(); // Detener la actualización automática al destruir el componente
        },
    
    };
    </script>
    
    <style scoped>
    /* Variables CSS directamente aplicadas en cada selector */
    .inventario-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 15px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: #333; /* text-color */
      background-color: #f8faf9;
    }
    
    /* ===== Filtros Panel ===== */
    .filtros-panel {
      background-color: white;
      border-radius: 8px; /* border-radius */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* shadow-sm */
      padding: 15px;
      margin-bottom: 20px;
      animation: fadeIn 0.5s ease;
      border: 1px solid #e0e0e0; /* border-color */
    }
    
    .filtro-grupo {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .filtro-item {
      flex: 1 1 200px;
    }
    
    .filtro-label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333; /* text-color */
      font-size: 0.9rem;
    }
    
    .filtro-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #e0e0e0; /* border-color */
      border-radius: 8px; /* border-radius */
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s; /* transition-fast */
      background-color: white;
    }
    
    .filtro-input:focus {
      outline: none;
      border-color: #196d43; /* primary-color */
      box-shadow: 0 0 0 3px #e6f1ec; /* primary-light */
    }
    
    .input-icon-wrapper {
      position: relative;
    }
    
    .input-clear-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #666; /* text-light */
      cursor: pointer;
      font-size: 0.9rem;
      opacity: 0.7;
      transition: opacity 0.2s; /* transition-fast */
    }
    
    .input-clear-icon:hover {
      opacity: 1;
    }
    
    /* Dropdown personalizado */
    .dropdown-container {
      position: relative;
      width: 100%;
    }
    
    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background-color: white;
      border: 1px solid #e0e0e0; /* border-color */
      border-radius: 8px; /* border-radius */
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s; /* transition-fast */
    }
    
    .dropdown-header:hover {
      border-color: #196d43; /* primary-color */
    }
    
    .dropdown-text {
      color: #333; /* text-color */
    }
    
    .dropdown-list {
      position: absolute;
      top: 100%;
      left: 0;
      width: 100%;
      max-height: 200px;
      overflow-y: auto;
      background-color: white;
      border: 1px solid #e0e0e0; /* border-color */
      border-radius: 0 0 8px 8px; /* border-radius */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* shadow-md */
      z-index: 10;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    
    .dropdown-item {
      padding: 10px 12px;
      cursor: pointer;
      transition: background-color 0.2s; /* transition-fast */
    }
    
    .dropdown-item:hover {
      background-color: #e6f1ec; /* primary-light */
    }
    
    .dropdown-item-active {
      background-color: #e6f1ec; /* primary-light */
      color: #196d43; /* primary-color */
      font-weight: 500;
    }
    
    .filtro-acciones {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    
    .btn-reset, .btn-buscar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border: none;
      border-radius: 8px; /* border-radius */
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.2s; /* transition-fast */
    }
    
    .btn-reset {
      background-color: #f0f0f0;
      color: #333; /* text-color */
    }
    
    .btn-buscar {
      background-color: #196d43; /* primary-color */
      color: white;
    }
    
    .btn-reset:hover, .btn-buscar:hover {
      transform: translateY(-2px);
    }
    
    .btn-reset:hover {
      background-color: #e0e0e0;
    }
    
    .btn-buscar:hover {
      background-color: #0e5230; /* primary-hover */
    }
    
    /* ===== Stats Cards ===== */
    .resultados-stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;
      animation: fadeIn 0.5s ease;
    }
    
    .stat-item {
      text-align: center;
      padding: 15px;
      background-color: white;
      border-radius: 8px; /* border-radius */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* shadow-sm */
      min-width: 100px;
      animation: slideUp 0.5s ease;
      transition: transform 0.2s, box-shadow 0.2s; /* transition-fast */
      border: 1px solid #e0e0e0; /* border-color */
      flex: 1;
      margin: 0 8px;
    }
    
    .stat-item:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* shadow-md */
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #196d43; /* primary-color */
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 0.9rem;
      color: #666; /* text-light */
      font-weight: 500;
    }
    
    /* ===== Loading state ===== */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      background-color: white;
      border-radius: 8px; /* border-radius */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* shadow-sm */
      animation: fadeIn 0.5s ease;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e6f1ec; /* primary-light */
      border-top: 3px solid #196d43; /* primary-color */
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    
    /* ===== Empty state ===== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      background-color: white;
      border-radius: 8px; /* border-radius */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* shadow-sm */
      animation: fadeIn 0.5s ease;
    }
    
    .empty-icon {
      font-size: 3rem;
      color: #666; /* text-light */
      margin-bottom: 10px;
    }
    
    .empty-text {
      font-size: 1.2rem;
      font-weight: 500;
      color: #333; /* text-color */
      margin-bottom: 5px;
    }
    
    .empty-hint {
      font-size: 0.9rem;
      color: #666; /* text-light */
    }
    
    /* ===== Tabla Desktop ===== */
    .table-container {
      background-color: white;
      border-radius: 8px; /* border-radius */
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: fadeIn 0.5s ease;
      border: 1px solid #dde8dc; /* table-border */
    }
    
    .inventario-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
      background-color: white;
    }
    
    .inventario-table th,
    .inventario-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #dde8dc; /* table-border */
    }
    
    /* Encabezados con gradiente */
    .inventario-table th {
      background-color: #196d43; /* primary-color */
      background-image: linear-gradient(135deg, #196d43 0%, #0e4f2f 100%); /* primary-color to primary-dark */
      color: white;
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 5;
      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
      font-size: 0.95rem;
      letter-spacing: 0.5px;
      text-shadow: 0px 1px 1px rgba(0, 0, 0, 0.2);
    }
    
    .th-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .th-content i {
      font-size: 0.9rem;
      opacity: 0.9;
    }
    
    /* Filas con colores alternados */
    .inventario-table tbody tr:nth-child(even) {
      background-color: #f9fdf7; /* table-row-even */
    }
    
    .inventario-table tbody tr:nth-child(odd) {
      background-color: #ffffff; /* table-row-odd */
    }
    
    .table-row {
      transition: background-color 0.2s, transform 0.2s;
      cursor: pointer;
    }
    
    .table-row:hover {
      background-color: #e6f1ec; /* table-row-hover */
      transform: translateY(-1px);
    }
    
    .table-row:active {
      transform: translateY(0);
    }
    
    .row-completado {
      background-color: #e8f5e9; /* table-completado */
      border-left: 3px solid #4CAF50; /* secondary-color */
    }
    
    .row-disabled {
      pointer-events: none;
      opacity: 0.8;
    }
    
    /* ===== Mobile Cards ===== */
    .mobile-cards {
      display: none;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .mobile-card {
      background-color: white;
      border-radius: 8px; /* border-radius */
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
      animation: slideUp 0.5s ease;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .mobile-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
    
    .mobile-card:active {
      transform: scale(0.98);
    }
    
    .card-completado {
      border-left: 4px solid #4CAF50; /* secondary-color */
    }
    
    .card-header {
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #dde8dc; /* table-border */
      background: #e6f1ec; /* primary-light */
    }
    
    .card-title {
      font-weight: 600;
      font-size: 1rem;
      color: #196d43; /* primary-color */
    }
    
    .card-badge {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .badge-success {
      background-color: #e8f5e9;
      color: #2e7d32;
      border: 1px solid rgba(46, 125, 50, 0.2);
    }
    
    .badge-pending {
      background-color: #fff8e1;
      color: #ff8f00;
      border: 1px solid rgba(255, 143, 0, 0.2);
    }
    
    .card-body {
      padding: 15px;
    }
    
    .card-detail {
      margin-bottom: 10px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    
    .card-detail i {
      color: #196d43; /* primary-color */
      width: 16px;
      opacity: 0.8;
    }
    
    .card-footer {
      padding: 10px 15px;
      border-top: 1px solid #dde8dc; /* table-border */
      text-align: center;
      background-color: #e6f1ec; /* primary-light */
    }
    
    .tap-hint {
      font-size: 0.85rem;
      color: #196d43; /* primary-color */
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .tap-hint i {
      animation: tapPulse 1.5s infinite;
    }
    
    /* ===== Paginación Mejorada ===== */
    .pagination-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-top: 1px solid #dde8dc; /* table-border */
      background-color: #f5f5f5; /* background-light */
    }
    
    .pagination-info {
      font-size: 0.9rem;
      color: #196d43; /* primary-color */
      font-weight: 500;
    }
    
    .pagination {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .pagination-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background-color: white;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .pagination-btn:hover:not(:disabled) {
      background-color: #e6f1ec; /* primary-light */
      color: #196d43; /* primary-color */
      transform: translateY(-2px);
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
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
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background-color: white;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 500;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    .page-number:hover:not(.active) {
      background-color: #e6f1ec; /* primary-light */
      transform: translateY(-2px);
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
    }
    
    .page-number.active {
      background-color: #196d43; /* primary-color */
      background-image: linear-gradient(135deg, #196d43 0%, #0e4f2f 100%); /* primary-color to primary-dark */
      color: white;
      font-weight: 600;
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
    }
    
    /* ===== Animaciones ===== */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from { 
        transform: translateY(20px);
        opacity: 0;
      }
      to { 
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes tapPulse {
      0% { transform: scale(1); opacity: 0.7; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 0.7; }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .pulse-effect {
      animation: pulse 0.3s ease-in-out;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(0.98); }
      100% { transform: scale(1); }
    }
    
    /* Transiciones */
    .fade-enter-active, .fade-leave-active {
      transition: opacity 0.3s;
    }
    .fade-enter, .fade-leave-to {
      opacity: 0;
    }
    
    /* ===== Media Queries ===== */
    @media screen and (max-width: 991px) {
      .filtro-grupo {
        flex-direction: column;
      }
      
      .filtro-item {
        flex: 1 1 100%;
      }
      
      .inventario-table th, 
      .inventario-table td {
        padding: 10px;
        font-size: 0.9rem;
      }
    }
    
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
      
      .btn-reset, .btn-buscar {
        width: 100%;
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
    }
    
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
      
      .filtros-panel {
        padding: 12px;
      }
      
      .filtro-label {
        font-size: 0.85rem;
      }
      
      .filtro-input, .dropdown-header {
        font-size: 0.9rem;
        padding: 8px 10px;
      }
      
      .btn-text {
        font-size: 0.9rem;
      }
    }
    </style>