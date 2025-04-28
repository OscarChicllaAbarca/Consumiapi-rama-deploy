<template>
  <div class="spreadsheet-container">
    <h1>VISUALIZADOR TIPO EXCEL</h1>
    <div class="filtros-panel">
      <div class="filtro-grupo">
        <div class="filtro-item">
          <label class="filtro-label">
            <i class="fas fa-file-excel"></i> Seleccionar Archivo Excel
          </label>
          <div class="input-icon-wrapper">
            <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" class="filtro-input" />
          </div>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>
        
        <div v-if="sheetNames.length > 0" class="filtro-item">
          <label class="filtro-label">
            <i class="fas fa-table"></i> Seleccionar Hoja
          </label>
          <select v-model="selectedSheet" @change="changeSheet" class="filtro-input">
            <option v-for="sheet in sheetNames" :key="sheet" :value="sheet">{{ sheet }}</option>
          </select>
        </div>
      </div>

      <div class="filtro-acciones" v-if="sheetNames.length > 0">
        <button @click="toggleFilters" class="btn-reset">
          <i class="fas fa-filter"></i>
          <span class="btn-text">{{ filtersEnabled ? 'Ocultar Filtros' : 'Mostrar Filtros' }}</span>
        </button>
        <button @click="showSelectedData" :disabled="!hasSelection" class="btn-buscar">
          <i class="fas fa-eye"></i>
          <span class="btn-text">Ver selección</span>
        </button>
      </div>
    </div>

    <!-- Estado de carga -->
    <transition name="fade">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>Procesando archivo...</span>
      </div>
    </transition>

    <!-- Estado vacío -->
    <transition name="fade">
      <div v-if="!isLoading && sheetNames.length === 0 && !errorMessage" class="empty-state">
        <i class="fas fa-file-excel empty-icon"></i>
        <p class="empty-text">Ningún archivo seleccionado</p>
        <p class="empty-hint">Selecciona un archivo Excel para comenzar</p>
      </div>
    </transition>

    <!-- Tabla Excel -->
    <transition name="fade">
      <div v-if="sheetData.length > 0" class="table-container">
        <div class="excel-actions" v-if="hotInstance">
          <div class="excel-toolbar">
            <button @click="exportToExcel" class="excel-btn" title="Exportar a Excel">
              <i class="fas fa-file-export"></i>
            </button>
            <button @click="showSearch" class="excel-btn" title="Buscar">
              <i class="fas fa-search"></i>
            </button>
            <button @click="hotInstance.undo()" class="excel-btn" title="Deshacer" :disabled="!canUndo">
              <i class="fas fa-undo"></i>
            </button>
            <button @click="hotInstance.redo()" class="excel-btn" title="Rehacer" :disabled="!canRedo">
              <i class="fas fa-redo"></i>
            </button>
            <button @click="clearFilters" class="excel-btn" title="Limpiar filtros" v-if="filtersEnabled && hasActiveFilters">
              <i class="fas fa-filter-circle-xmark"></i>
            </button>
          </div>
          <div v-if="showSearchBar" class="search-container">
            <div class="search-wrapper">
              <input 
                type="text" 
                v-model="searchQuery" 
                @input="performSearch" 
                placeholder="Buscar en el documento..." 
                class="search-input"
                ref="searchInput"
              />
              <span class="search-count" v-if="searchQuery">{{ currentSearchResult }}/{{ totalSearchResults }}</span>
            </div>
            <div class="search-buttons">
              <button @click="findPrevious" :disabled="!canFindPrevious" class="search-btn">
                <i class="fas fa-chevron-up"></i>
              </button>
              <button @click="findNext" :disabled="!canFindNext" class="search-btn">
                <i class="fas fa-chevron-down"></i>
              </button>
              <button @click="closeSearch" class="search-btn close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
        <div id="hot-table" ref="hotTable"></div>
      </div>
    </transition>

    <!-- Vista de datos seleccionados -->
    <div v-if="selectedDataVisible" class="selected-data-view">
      <h2 class="history-title">Datos Seleccionados</h2>
      
      <div v-if="apiResponse" class="products-section">
        <h3><i class="fas fa-boxes"></i> Productos:</h3>
        <div v-if="productosLoading" class="loading-indicator">
          <div class="loading-spinner small-spinner"></div>
          <span>Cargando productos...</span>
        </div>
        <div v-else class="table-container">

          <!-- En la tabla de productos -->
          <table class="inventario-table">
            <thead>
              <tr>
                <th>
                  <div class="th-content sortable" @click="sortBy('producto')">
                    <i class="fas fa-barcode"></i> Código
                    <i class="fas fa-sort" :class="getSortIcon('producto')"></i>
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-box"></i> Descripción
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
                    <i class="fas fa-ruler"></i> Unidad Medida
                  </div>
                </th>
                <th>
                  <div class="th-content sortable" @click="sortBy('codigoInventario')">
                    <i class="fas fa-hashtag"></i> Código Inventario
                    <i class="fas fa-sort" :class="getSortIcon('codigoInventario')"></i>
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-calendar-alt"></i> Fecha Inventario
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-check-circle"></i> Estado
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-sort-amount-up"></i> Cantidad
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in apiResponse" 
                  :key="index" 
                  class="table-row"
                  :class="{'highlighted-row': selectedInventoryCode === item.codigoInventario}"
                  @click="selectInventoryCode(item.codigoInventario)">
                <td>{{ item.producto }}</td>
                <td>{{ item.descripcionProducto }}</td>
                <td>{{ item.propietario }}</td>
                <td>{{ item.lote }}</td>
                <td>{{ item.unidadMedidaBase }}</td>
                <td>{{ item.codigoInventario }}</td>
                <td>{{ calcularFechaInventario(item.codigoInventario) }}</td>
                <td :style="{ backgroundColor: getEstadoColor(item.estado), color: 'white' }">{{ item.estado }}</td>
                <td>{{ item.cantidad }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Observaciones -->
        <h3><i class="fas fa-comment-alt"></i> Observaciones:</h3>
        <div v-if="observacionesLoading" class="loading-indicator">
          <div class="loading-spinner small-spinner"></div>
          <span>Cargando observaciones...</span>
        </div>
        <div v-else-if="observacionesError" class="error-container">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Error: {{ observacionesError }}</span>
        </div>
        <div v-else-if="todasLasObservaciones && todasLasObservaciones.length" class="table-container">
          <table class="inventario-table">
            <thead>
              <tr>
                <th>
                  <div class="th-content">
                    <i class="fas fa-box"></i> Producto
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-hashtag"></i> Código Inventario
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-tag"></i> Lote
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-folder"></i> Categoría
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-comment"></i> Observación
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-calendar-alt"></i> Fecha Registro
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-balance-scale"></i> Diferencia
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(obs, idx) in todasLasObservaciones" 
                :key="idx" 
                class="table-row"
                :class="{'highlighted-row': selectedInventoryCode === obs.codigo_inventario_pro}">
                <td>{{ obs.producto }}</td>
                <td>{{ obs.codigo_inventario_pro }}</td>
                <td>{{ obs.lote_pro }}</td>
                <td>{{ obs.categoria_obsv }}</td>
                <td>{{ obs.observacion_obsv }}</td>
                <td>{{ formatDate(obs.fecha_registro) }}</td>
                <td>{{ obs.diferencia_pro }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="!observacionesLoading" class="empty-data">
          <i class="fas fa-info-circle"></i> No se encontraron observaciones
        </div>
        
        <!-- Tomas -->
        <h3><i class="fas fa-clipboard-check"></i> Tomas:</h3>
        <div v-if="tomasLoading" class="loading-indicator">
          <div class="loading-spinner small-spinner"></div>
          <span>Cargando tomas...</span>
        </div>
        <div v-else-if="tomasError" class="error-container">
          <i class="fas fa-exclamation-triangle"></i>
          <span>Error: {{ tomasError }}</span>
        </div>
        <div v-else-if="todasLasTomas && todasLasTomas.length" class="table-container">
          <table class="inventario-table">
            <thead>
              <tr>
                <th>
                  <div class="th-content">
                    <i class="fas fa-hashtag"></i> Código Inventario
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-box"></i> Producto
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-file-alt"></i> Descripción
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-tag"></i> Lote
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-calendar-alt"></i> Fecha Toma
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-map-marker-alt"></i> Ubicación
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-sort-amount-up"></i> Cantidad
                  </div>
                </th>
                <th>
                  <div class="th-content">
                    <i class="fas fa-user"></i> Usuario
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(toma, idx) in todasLasTomas" 
                :key="idx" 
                class="table-row"
                :class="{'highlighted-row': selectedInventoryCode === toma.codigoInventario}">
                <td>{{ toma.codigoInventario }}</td>
                <td>{{ toma.producto }}</td>
                <td>{{ toma.descripcionProducto }}</td>
                <td>{{ toma.lote }}</td>
                <td>{{ formatDate(toma.fechaToma) }}</td>
                <td>{{ toma.ubicacion }}</td>
                <td>{{ toma.cantidad }}</td>
                <td>{{ toma.userDni }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="!tomasLoading" class="empty-data">
          <i class="fas fa-info-circle"></i> No se encontraron tomas
        </div>
      </div>
      
      <div v-else>
        <div class="table-container">
          <div id="selected-hot-table" ref="selectedHotTable"></div>
        </div>
      </div>

      <div class="filtro-acciones export-options">
        <button @click="exportSelectedData" class="btn-reset">
          <i class="fas fa-file-export"></i>
          <span class="btn-text">Exportar selección</span>
        </button>
        <button @click="closeSelectedData" class="btn-buscar">
          <i class="fas fa-times"></i>
          <span class="btn-text">Cerrar</span>
        </button>
      </div>
    </div>
  </div>
</template>



<script>
// Importamos XLSX para procesar archivos Excel
import * as XLSX from 'xlsx';
import config from '../config';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';
import axios from 'axios'; // Importamos axios para hacer llamadas HTTP

export default {
  name: 'SpreadsheetViewer',
  data() {
    return {
      workbook: null,
      sheetNames: [],
      selectedSheet: '',
      hotInstance: null,
      selectedHotInstance: null,
      sheetData: [],
      selectedData: [],
      selectedDataHeaders: [],
      selectedDataVisible: false,
      currentSelection: null,
      hasSelection: false,
      errorMessage: '',
      apiResponse: null, // Para almacenar la respuesta de la API
      selectedProductCode: null, // Para almacenar el código de producto seleccionado
      isLoading: false, // Estado de carga
      
      // Propiedades para tablas independientes con estados de carga
      todasLasObservaciones: [],
      todasLasTomas: [],
      observacionesLoading: false,
      tomasLoading: false,
      productosLoading: false,
      observacionesError: null,
      tomasError: null,
      selectedInventoryCode: null,
      sortColumn: null,
      sortDirection: 'asc',

       // Para filtros y búsqueda
       filtersEnabled: false,
      hasActiveFilters: false,
      canUndo: false,
      canRedo: false,
      showSearchBar: false,
      searchQuery: '',
      searchResults: [],
      currentSearchIndex: -1,
      selectedInventoryCode: null,
      sortColumn: null,
      sortDirection: 'asc',
    };
  },
  computed: {
    totalSearchResults() {
      return this.searchResults.length;
    },
    currentSearchResult() {
      return this.searchResults.length > 0 ? this.currentSearchIndex + 1 : 0;
    },
    canFindNext() {
      return this.searchResults.length > 0 && this.currentSearchIndex < this.searchResults.length - 1;
    },
    canFindPrevious() {
      return this.searchResults.length > 0 && this.currentSearchIndex > 0;
    }
  },
  mounted() {
    window.addEventListener('resize', this.resizeTable);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeTable);

    if (this.hotInstance) {
      this.hotInstance.destroy();
    }

    if (this.selectedHotInstance) {
      this.selectedHotInstance.destroy();
    }
  },
  updated() {
    if (this.sheetData.length > 0 && !this.hotInstance && this.$refs.hotTable) {
      this.initializeHandsontable();
    }
  },
  methods: {
          // Método para manejar la selección de celdas
          selectInventoryCode(code) {
          if (this.selectedInventoryCode === code) {
            this.selectedInventoryCode = null; // Alternar selección
          } else {
            this.selectedInventoryCode = code;
          }
        },
        sortBy(column) {
          // Si es la misma columna, invertir dirección
          if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
          }
          
          // Ordenar los datos según la columna seleccionada
          if (this.apiResponse && this.apiResponse.length > 0) {
            this.apiResponse = [...this.apiResponse].sort((a, b) => {
              let valueA = a[column] || '';
              let valueB = b[column] || '';
              
              // Convertir a minúsculas si son cadenas
              if (typeof valueA === 'string') valueA = valueA.toLowerCase();
              if (typeof valueB === 'string') valueB = valueB.toLowerCase();
              
              if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
              if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
              return 0;
            });
          }
        },
        
        getSortIcon(column) {
          if (this.sortColumn !== column) return '';
          return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
        },
        
        calcularFechaInventario(codigoInventario) {
          if (!codigoInventario) return 'N/A';
          
          // Extraer información del código para determinar la fecha
          // Puedes personalizar esta lógica según tu formato específico
          const codeParts = codigoInventario.match(/(\d{4})(\d{2})?/);
          
          if (!codeParts) return 'Fecha no disponible';
          
          const year = codeParts[1];
          const week = codeParts[2];
          
          // Mapeo de códigos a fechas específicas
          switch (codigoInventario) {
            case 'INVCICL2024441':
              return 'Octubre 2024';
            case 'INVCICL20244510':
              return 'Noviembre 2024';
            case 'INVCICL2024451':
              return 'Noviembre 2024';
            case 'INVGENE2024473':
              return 'Diciembre 2024';
            case 'INVCICL2024501':
              return 'Diciembre 2024';
            case 'INVCICL2024511':
              return 'Diciembre 2024';
            case 'INVCONT202511':
              return 'Marzo 2025';
            case 'INVCICL202521':
              return 'Mayo 2025';
            case 'INVCICL202532':
              return 'Agosto 2025';
            case 'INVINOP202543':
              return 'Octubre 2025';
            case 'INVCICL202554':
              return 'Diciembre 2025';
            case 'INVCICL202565':
              return 'Marzo 2026';
            case 'INVCICL202576':
              return 'Mayo 2026';
            case 'INVINOP202587':
              return 'Julio 2026';
            default:
              return `${year}-${week || ''}`;
          }
        },

    // Método para manejar la carga de archivos
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      this.isLoading = true;

      if (this.hotInstance) {
        this.hotInstance.destroy();
        this.hotInstance = null;
      }

      if (this.selectedHotInstance) {
        this.selectedHotInstance.destroy();
        this.selectedHotInstance = null;
      }

      this.workbook = null;
      this.sheetNames = [];
      this.selectedSheet = '';
      this.sheetData = [];
      this.selectedData = [];
      this.selectedDataHeaders = [];
      this.selectedDataVisible = false;
      this.currentSelection = null;
      this.hasSelection = false;
      this.errorMessage = '';
      this.apiResponse = null;
      this.selectedProductCode = null;
      this.todasLasObservaciones = [];
      this.todasLasTomas = [];
      this.observacionesLoading = false;
      this.tomasLoading = false;
      this.productosLoading = false;
      this.observacionesError = null;
      this.tomasError = null;
      this.filtersEnabled = false;
      this.hasActiveFilters = false;
      this.showSearchBar = false;
      this.searchQuery = '';

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          this.workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellStyles: true
          });

          this.sheetNames = this.workbook.SheetNames;

          if (this.sheetNames.length === 0) {
            this.errorMessage = 'No se encontraron hojas en el archivo';
            this.isLoading = false;
            return;
          }

          this.selectedSheet = this.sheetNames[0];
          this.loadSheetData(this.selectedSheet);
          this.isLoading = false;

        } catch (error) {
          this.errorMessage = 'Error al procesar el archivo: ' + error.message;
          console.error('Error procesando el archivo Excel:', error);
          this.isLoading = false;
        }
      };

      reader.onerror = (error) => {
        this.errorMessage = 'Error al leer el archivo';
        console.error('Error leyendo el archivo:', error);
        this.isLoading = false;
      };

      reader.readAsArrayBuffer(file);
    },

    loadSheetData(sheetName) {
      if (!this.workbook || !sheetName) return;

      try {
        const worksheet = this.workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: ''
        });

        if (jsonData.length === 0) {
          this.errorMessage = 'No se encontraron datos en la hoja seleccionada';
          return;
        }

        this.sheetData = jsonData;

      } catch (error) {
        this.errorMessage = 'Error al cargar datos de la hoja: ' + error.message;
        console.error('Error cargando datos de la hoja:', error);
      }
    },

    initializeHandsontable() {
      if (!this.$refs.hotTable) {
        console.error('El elemento de referencia hotTable no existe');
        this.errorMessage = 'Error al inicializar la tabla: elemento no encontrado';
        return;
      }

      const container = this.$refs.hotTable;

      if (!document.body.contains(container)) {
        console.error('El elemento hotTable no está en el DOM');
        this.errorMessage = 'Error al inicializar la tabla: elemento no está en el DOM';
        return;
      }

      if (this.hotInstance) {
        this.hotInstance.destroy();
      }

      if (!Array.isArray(this.sheetData)) {
        console.error('Los datos de la hoja no son un array válido', this.sheetData);
        this.errorMessage = 'Error: Formato de datos no válido';
        return;
      }

      try {
        // Obtener encabezados si existen
        let hasHeaders = this.sheetData.length > 0 && this.sheetData[0].some(cell => cell !== '');
        let colHeaders = hasHeaders ? this.sheetData[0] : true;
        
        // Si hay encabezados, eliminarlos de los datos para evitar duplicados
        let data = hasHeaders ? this.sheetData.slice(1) : this.sheetData;
        
        this.hotInstance = new Handsontable(container, {
          data: data,
          rowHeaders: true,
          colHeaders: colHeaders,
          contextMenu: true,
          manualColumnResize: true,
          manualRowResize: true,
          stretchH: 'all',
          autoColumnSize: true,
          licenseKey: 'non-commercial-and-evaluation',
          readOnly: false,
          outsideClickDeselects: false,
          selectionMode: 'multiple',
          className: 'excel-grid',
          dropdownMenu: this.filtersEnabled, // Activar menú desplegable para filtros
          filters: this.filtersEnabled, // Activar filtros
          columnSorting: true, // Permitir ordenar columnas
          undo: true, // Habilitar deshacer/rehacer
          search: true, // Habilitar búsqueda
          afterChange: () => {
            this.updateUndoRedoState();
          },
          afterFilter: () => {
            this.checkActiveFilters();
          },
          afterSelectionEnd: (row, column, row2, column2) => {
            this.currentSelection = [row, column, row2, column2];
            this.hasSelection = true;

            // Obtener el valor de la celda seleccionada si es una sola celda
            if (row === row2 && column === column2) {
              this.selectedProductCode = this.hotInstance.getDataAtCell(row, column);
              console.log('Código de producto seleccionado:', this.selectedProductCode);
            } else {
              this.selectedProductCode = null;
            }
          }
        });

        setTimeout(() => {
          this.resizeTable();
          this.updateUndoRedoState();
        }, 0);

      } catch (error) {
        console.error('Error al inicializar Handsontable:', error);
        this.errorMessage = 'Error al inicializar la tabla: ' + error.message;
      }
    },

    // Métodos para filtros y búsqueda
    toggleFilters() {
      this.filtersEnabled = !this.filtersEnabled;
      
      if (this.hotInstance) {
        this.hotInstance.updateSettings({
          dropdownMenu: this.filtersEnabled,
          filters: this.filtersEnabled
        });
      }
    },
    
    clearFilters() {
      if (this.hotInstance && this.hotInstance.getPlugin('filters')) {
        this.hotInstance.getPlugin('filters').clearConditions();
        this.hotInstance.getPlugin('filters').filter();
        this.hasActiveFilters = false;
      }
    },
    
    checkActiveFilters() {
  // Simplemente marcar que hay filtros activos cuando el plugin está habilitado
  // y se ha aplicado algún filtro (esto podría ser menos preciso)
  if (this.hotInstance && this.hotInstance.getPlugin('filters')) {
    const filtersPlugin = this.hotInstance.getPlugin('filters');
    this.hasActiveFilters = filtersPlugin.isEnabled();
    
    // Opcionalmente, puedes comprobar si hay diferencia entre filas totales y visibles
    const totalRows = this.hotInstance.countSourceRows();
    const visibleRows = this.hotInstance.countRows();
    if (totalRows !== visibleRows) {
      this.hasActiveFilters = true;
    }
  } else {
    this.hasActiveFilters = false;
  }
},
    updateUndoRedoState() {
      if (this.hotInstance) {
        const undoRedo = this.hotInstance.getPlugin('undoRedo');
        this.canUndo = undoRedo.isUndoAvailable();
        this.canRedo = undoRedo.isRedoAvailable();
      }
    },
    
    showSearch() {
      this.showSearchBar = true;
      this.$nextTick(() => {
        if (this.$refs.searchInput) {
          this.$refs.searchInput.focus();
        }
      });
    },
    
    closeSearch() {
      this.showSearchBar = false;
      this.searchQuery = '';
      this.searchResults = [];
      this.currentSearchIndex = -1;
      
      // Limpiar resaltado de búsqueda
      if (this.hotInstance) {
        this.hotInstance.getPlugin('search').query('');
        this.hotInstance.render();
      }
    },
    
    performSearch() {
      if (!this.hotInstance || !this.searchQuery) {
        this.searchResults = [];
        this.currentSearchIndex = -1;
        return;
      }
      
      const searchPlugin = this.hotInstance.getPlugin('search');
      this.searchResults = searchPlugin.query(this.searchQuery);
      this.currentSearchIndex = this.searchResults.length > 0 ? 0 : -1;
      
      if (this.searchResults.length > 0) {
        this.highlightSearchResult(this.currentSearchIndex);
      }
    },
    
    findNext() {
      if (this.searchResults.length === 0 || this.currentSearchIndex >= this.searchResults.length - 1) return;
      
      this.currentSearchIndex++;
      this.highlightSearchResult(this.currentSearchIndex);
    },
    
    findPrevious() {
      if (this.searchResults.length === 0 || this.currentSearchIndex <= 0) return;
      
      this.currentSearchIndex--;
      this.highlightSearchResult(this.currentSearchIndex);
    },
    
    highlightSearchResult(index) {
      if (!this.hotInstance || !this.searchResults || index < 0 || index >= this.searchResults.length) return;
      
      const result = this.searchResults[index];
      
      // Desplazarse a la celda encontrada
      this.hotInstance.scrollViewportTo(result.row, result.col);
      
      // Seleccionar la celda
      this.hotInstance.selectCell(result.row, result.col);
    },
    
    exportToExcel() {
      if (!this.hotInstance) return;
      
      try {
        // Obtener datos actuales (incluidos filtros aplicados)
        const data = this.hotInstance.getData();
        const headers = this.hotInstance.getColHeader();
        
        // Crear una nueva hoja de trabajo
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        
        // Crear un nuevo libro de trabajo y añadir la hoja
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, this.selectedSheet || "Hoja1");
        
        // Exportar a archivo
        const fileName = "excel_visualizador_" + new Date().toISOString().slice(0, 10) + ".xlsx";
        XLSX.writeFile(wb, fileName);
        
      } catch (error) {
        this.errorMessage = 'Error al exportar: ' + error.message;
        console.error('Error exportando datos:', error);
      }
    },
    
    selectInventoryCode(code) {
      if (this.selectedInventoryCode === code) {
        this.selectedInventoryCode = null; // Alternar selección
      } else {
        this.selectedInventoryCode = code;
      }
    },

    initializeSelectedDataTable() {
      if (!this.$refs.selectedHotTable) {
        console.error('El elemento de referencia selectedHotTable no existe');
        this.errorMessage = 'Error al inicializar la tabla de selección: elemento no encontrado';
        return;
      }

      const container = this.$refs.selectedHotTable;

      if (this.selectedHotInstance) {
        this.selectedHotInstance.destroy();
      }

      if (!Array.isArray(this.selectedData)) {
        console.error('Los datos seleccionados no son un array válido', this.selectedData);
        this.errorMessage = 'Error: Formato de datos seleccionados no válido';
        return;
      }

      try {
        this.selectedHotInstance = new Handsontable(container, {
          data: this.selectedData,
          rowHeaders: true,
          colHeaders: this.selectedDataHeaders.length > 0 ? this.selectedDataHeaders : true,
          contextMenu: true,
          manualColumnResize: true,
          manualRowResize: true,
          stretchH: 'all',
          autoColumnSize: true,
          licenseKey: 'non-commercial-and-evaluation',
          readOnly: false,
          className: 'excel-grid'
        });

        setTimeout(() => {
          if (this.selectedHotInstance) {
            this.selectedHotInstance.updateSettings({
              width: container.parentElement.offsetWidth,
              height: Math.min(400, this.selectedData.length * 25 + 50)
            });
          }
        }, 0);

      } catch (error) {
        console.error('Error al inicializar tabla de selección:', error);
        this.errorMessage = 'Error al inicializar la tabla de selección: ' + error.message;
      }
    },

    changeSheet() {
      this.loadSheetData(this.selectedSheet);
      this.selectedDataVisible = false;
      this.hasSelection = false;
      this.apiResponse = null;
      this.selectedProductCode = null;
      this.todasLasObservaciones = [];
      this.todasLasTomas = [];
      this.observacionesLoading = false;
      this.tomasLoading = false;
      this.productosLoading = false;
      this.observacionesError = null;
      this.tomasError = null;
      this.filtersEnabled = false;
      this.hasActiveFilters = false;
      this.showSearchBar = false;
      this.searchQuery = '';
    },

    resizeTable() {
      if (this.hotInstance && this.$refs.hotTable) {
        const container = this.$refs.hotTable;
        if (container && container.parentElement) {
          this.hotInstance.updateSettings({
            width: container.parentElement.offsetWidth,
            height: 400
          });
        }
      }
    },

    getEstadoColor(estado) {
      switch (estado?.toLowerCase()) {
        case 'faltante':
          return '#fe5c5c';
        case 'sobrante':
          return '#FFD700';
        case 'conciliado':
          return '#74d573';
        default:
          return '#0c534c';
      }
    },

    async showSelectedData() {
      if (!this.hasSelection || !this.currentSelection) {
        this.errorMessage = 'Por favor selecciona algunas celdas primero';
        return;
      }

      try {
        const [startRow, startCol, endRow, endCol] = this.currentSelection;

        // Determinar si es una única celda
        const isSingleCell = startRow === endRow && startCol === endCol;

        if (isSingleCell) {
          // Obtener el valor de la celda seleccionada
          const selectedValue = this.sheetData[startRow][startCol];

          if (!selectedValue) {
            this.errorMessage = 'La celda seleccionada está vacía';
            return;
          }

          // Mostrar la vista de datos seleccionados antes de hacer las llamadas API
          this.selectedDataVisible = true;
          
          // Hacer la llamada a la API con el valor seleccionado
          await this.callProductApi(selectedValue);
          
          // Iniciar las consultas de observaciones y tomas en paralelo
          if (this.apiResponse && Array.isArray(this.apiResponse)) {
            // Llamadas en paralelo para cargar cada tabla independientemente
            this.obtenerTodasLasObservaciones(this.apiResponse);
            this.obtenerTodasLasTomas(this.apiResponse);
          }
        } else {
          // Comportamiento normal para selección múltiple

          // Determinar el rango real (el orden puede ser inverso)
          const fromRow = Math.min(startRow, endRow);
          const toRow = Math.max(startRow, endRow);
          const fromCol = Math.min(startCol, endCol);
          const toCol = Math.max(startCol, endCol);

          this.selectedDataHeaders = [];
          if (fromRow === 0) {
            for (let col = fromCol; col <= toCol; col++) {
              this.selectedDataHeaders.push(this.sheetData[0][col] || `Col ${col+1}`);
            }
          }

          // Extraer datos seleccionados
          this.selectedData = [];
          const startRowIndex = (fromRow === 0 && this.selectedDataHeaders.length > 0) ? 1 : fromRow;

          for (let row = startRowIndex; row <= toRow; row++) {
            if (!this.sheetData[row]) continue;

            const rowData = [];
            for (let col = fromCol; col <= toCol; col++) {
              rowData.push(this.sheetData[row][col] || '');
            }
            this.selectedData.push(rowData);
          }

          // Mostrar los datos seleccionados
          this.selectedDataVisible = true;

          // Inicializar tabla de datos seleccionados
          setTimeout(() => {
            this.initializeSelectedDataTable();
          }, 0);
        }

      } catch (error) {
        this.errorMessage = 'Error al procesar la selección: ' + error.message;
        console.error('Error procesando selección:', error);
      }
    },

    async callProductApi(productCode) {
      try {
        console.log(`Llamando a la API para el producto: ${productCode}`);
        this.apiResponse = null; // Limpiar respuesta anterior
        this.productosLoading = true; // Indicar que los productos están cargando
        
        // Limpiar datos anteriores
        this.todasLasObservaciones = [];
        this.todasLasTomas = [];
        this.observacionesLoading = false;
        this.tomasLoading = false;
        this.observacionesError = null;
        this.tomasError = null;

        // Construir la URL de la API con el código del producto
        const apiUrl = `${config.BASE_URL}/api/report?producto=${encodeURIComponent(productCode)}`;

        // Realizar la llamada a la API con withCredentials para enviar cookies
        const response = await axios.get(apiUrl, {
          withCredentials: true // Esto permite enviar cookies en la solicitud
        });

        // Almacenar la respuesta de la API
        this.apiResponse = response.data;
        console.log('Respuesta de la API:', this.apiResponse);
        
      } catch (error) {
        console.error('Error al llamar a la API:', error);
        this.errorMessage = `Error al consultar la API: ${error.message || 'Error desconocido'}`;
        this.apiResponse = null;
      } finally {
        this.productosLoading = false; // Indicar que los productos terminaron de cargar
      }
    },
    
    async obtenerTodasLasObservaciones(productos) {
      this.observacionesLoading = true;
      this.observacionesError = null;
      this.todasLasObservaciones = [];
      
      try {
        // Para cada producto, obtenemos sus observaciones
        for (const producto of productos) {
          try {
            console.log(`Consultando observaciones para: ${producto.producto}, lote: ${producto.lote}, código inventario: ${producto.codigoInventario}, estado: ${producto.estado}`);
            
            // Construir la URL para la API de observaciones
            const apiUrl = `${config.BASE_URL}/api/observaciones/filtrar?codigo_inventario_pro=${encodeURIComponent(producto.codigoInventario)}&lote_pro=${encodeURIComponent(producto.lote)}&producto=${encodeURIComponent(producto.producto)}&estado_pro=${encodeURIComponent(producto.estado)}`;

            // Realizar la llamada a la API con withCredentials para enviar cookies
            const response = await axios.get(apiUrl, {
              withCredentials: true
            });
            
            // Si hay observaciones, las agregamos al array total
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              this.todasLasObservaciones = [...this.todasLasObservaciones, ...response.data];
            }
          } catch (error) {
            console.error(`Error al consultar observaciones para producto ${producto.producto}:`, error);
            // Continuamos con el siguiente producto aunque falle una consulta
          }
        }
        
        console.log('Total de observaciones recopiladas:', this.todasLasObservaciones.length);
      } catch (error) {
        console.error('Error general al consultar observaciones:', error);
        this.observacionesError = error.message || 'Error desconocido al obtener observaciones';
      } finally {
        this.observacionesLoading = false;
      }
    },
    
    async obtenerTodasLasTomas(productos) {
      this.tomasLoading = true;
      this.tomasError = null;
      this.todasLasTomas = [];
      
      try {
        // Para cada producto, obtenemos sus tomas
        for (const producto of productos) {
          try {
            console.log(`Consultando tomas para: ${producto.producto}, lote: ${producto.lote}, código inventario: ${producto.codigoInventario}`);
            
            // Construir la URL para la API de tomas
            const apiUrl = `${config.BASE_URL}/api/tomas?page=0&size=15&codigoInventario=${encodeURIComponent(producto.codigoInventario)}&producto=${encodeURIComponent(producto.producto)}&lote=${encodeURIComponent(producto.lote)}`;

            // Realizar la llamada a la API con withCredentials para enviar cookies
            const response = await axios.get(apiUrl, {
              withCredentials: true
            });
            
            // Si hay tomas, las agregamos al array total
            const tomas = response.data.content || response.data;
            if (tomas && Array.isArray(tomas) && tomas.length > 0) {
              // Añadimos información del producto si no la tiene
              const tomasConProducto = tomas.map(toma => ({
                ...toma,
                producto: toma.producto || producto.producto,
                codigoInventario: toma.codigoInventario || producto.codigoInventario,
                lote: toma.lote || producto.lote
              }));
              
              this.todasLasTomas = [...this.todasLasTomas, ...tomasConProducto];
            }
          } catch (error) {
            console.error(`Error al consultar tomas para producto ${producto.producto}:`, error);
            // Continuamos con el siguiente producto aunque falle una consulta
          }
        }
        
        console.log('Total de tomas recopiladas:', this.todasLasTomas.length);
      } catch (error) {
        console.error('Error general al consultar tomas:', error);
        this.tomasError = error.message || 'Error desconocido al obtener tomas';
      } finally {
        this.tomasLoading = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      
      // Convertir la fecha (que está en formato ISO)
      const date = new Date(dateString);
      
      // Formatear la fecha como dd/mm/yyyy hh:mm
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    closeSelectedData() {
      this.selectedDataVisible = false;
      this.apiResponse = null;
      this.todasLasObservaciones = [];
      this.todasLasTomas = [];
      this.observacionesLoading = false;
      this.tomasLoading = false;
      this.productosLoading = false;
      this.observacionesError = null;
      this.tomasError = null;
    },

    exportSelectedData() {
      if (!this.selectedData || this.selectedData.length === 0) {
        this.errorMessage = 'No hay datos para exportar';
        return;
      }

      try {
        // Crear una nueva hoja de trabajo
        const ws = XLSX.utils.aoa_to_sheet(
          this.selectedDataHeaders.length > 0 ?
          [this.selectedDataHeaders, ...this.selectedData] :
          this.selectedData
        );

        // Crear un nuevo libro de trabajo y añadir la hoja
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Datos Seleccionados");

        // Exportar a archivo
        const fileName = "datos_seleccionados_" + new Date().toISOString().slice(0, 10) + ".xlsx";
        XLSX.writeFile(wb, fileName);

      } catch (error) {
        this.errorMessage = 'Error al exportar: ' + error.message;
        console.error('Error exportando datos:', error);
      }
    }
  }
};
</script>

<style scoped>
/* ===== ESTILOS BASE ===== */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.spreadsheet-container {
  width: 100%;
  max-width: 100%;
  padding: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: #333;
  background-color: #f8faf9;
  font-size: 1rem;
  line-height: 1.5;
}

h1 {
  margin-bottom: 1.5rem;
  color: #0c534c;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e6f1ec;
}

h2 {
  margin-bottom: 1.5rem;
  color: #0c534c;
  font-size: 1.4rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e6f1ec;
}

h3 {
  color: #0c534c;
  font-size: 1.2rem;
  margin: 1.5rem 0 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

h3 i {
  color: #0c534c;
}

/* ===== PANEL DE FILTROS ===== */
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
  flex: 1 1 300px;
  min-width: 250px;
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
  box-shadow: 0 2px 8px rgba(12, 83, 76, 0.1);
}

.filtro-input:focus {
  outline: none;
  border-color: #0c534c;
  box-shadow: 0 0 0 3px rgba(12, 83, 76, 0.15);
}

.input-icon-wrapper {
  position: relative;
}

/* ===== BOTONES ===== */
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
  background-color: #0a423d;
}

.btn-reset:disabled,
.btn-buscar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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

.small-spinner {
  width: 24px;
  height: 24px;
  border-width: 2px;
  margin-bottom: 0;
  margin-right: 10px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f5f9f7;
  border-radius: 8px;
  margin-bottom: 1rem;
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
  color: #0c534c;
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

.empty-data {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f5f9f7;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #666;
}

.empty-data i {
  margin-right: 10px;
  color: #0c534c;
}

.error-container {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #fff0f0;
  border-radius: 8px;
  margin-bottom: 1rem;
  color: #d32f2f;
}

.error-container i {
  margin-right: 10px;
}

/* ===== TABLA HANDSONTABLE PERSONALIZADA ===== */
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

/* ===== ESTILOS PARA LA TABLA EXCEL ===== */
.excel-grid .htCore td {
  border: 1px solid #ddd;
  font-size: 0.9rem;
  padding: 6px 8px;
  vertical-align: middle;
}

.excel-grid .htCore th {
  background-color: #0c534c;
  color: white;
  font-weight: 600;
  border: 1px solid #0a423d;
  font-size: 0.9rem;
}

.excel-grid .htCore tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.excel-grid .htCore tbody tr:hover {
  background-color: #e6f1ec;
}

.excel-grid .htCore .current {
  background-color: rgba(12, 83, 76, 0.2) !important;
}

.excel-grid .htCore .area {
  background-color: rgba(12, 83, 76, 0.1) !important;
}

/* Estilos para filas resaltadas */
.highlighted-row {
  background-color: #b9ce70 !important;
  border-left: 3px solid #0c534c;
  font-weight: 500;
}

.highlighted-row:hover {
  background-color: #b9ce70 !important;
}

/* Estilos para las columnas ordenables */
.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.sortable i.fa-sort,
.sortable i.fa-sort-up,
.sortable i.fa-sort-down {
  margin-left: 5px;
  font-size: 0.8rem;
}

/* Estilos específicos para la cabecera de tabla */
.th-content {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

/* Ajuste para mostrar código y fecha juntos */
.inventario-table td {
  vertical-align: middle;
  white-space: nowrap;
}

.inventario-table td.codigo-fecha {
  display: flex;
  flex-direction: column;
}

.inventario-table td.codigo-fecha .fecha {
  font-size: 0.8rem;
  color: #666;
  margin-top: 3px;
}


/* ===== TABLA DE DATOS ===== */
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

.th-content {
  display: flex;
  align-items: center;
  gap: 5px;
}

.th-content i {
  font-size: 0.9rem;
}

/* ===== VISTA DE DATOS SELECCIONADOS ===== */
.selected-data-view {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-top: 2rem;
  animation: fadeIn 0.5s ease;
  border: 1px solid #e0e0e0;
}

.history-title {
  margin-bottom: 20px;
  color: #0c534c;
  font-size: 1.5rem;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #e6f1ec;
}

.export-options {
  margin-top: 1.5rem;
  border-top: 1px solid #e6f1ec;
  padding-top: 1.5rem;
}

.products-section {
  animation: fadeIn 0.5s ease;
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

/* Transiciones */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* Mensaje de error */
.error-message {
  color: #d32f2f;
  background-color: #ffebee;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.error-message::before {
  content: "⚠️";
  margin-right: 8px;
}

/* Reglas para impresión */
@media print {
  .filtros-panel,
  .btn-reset,
  .btn-buscar,
  .loading-container,
  .empty-state {
    display: none !important;
  }

  .spreadsheet-container,
  .table-container,
  .selected-data-view {
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

  h1, h2, h3 {
    color: #000 !important;
  }
}

.excel-actions {
  background-color: #f8f8f8;
  border-bottom: 1px solid #ddd;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.excel-toolbar {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.excel-btn {
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
}

.excel-btn:hover:not(:disabled) {
  background-color: #e6f1ec;
  border-color: #0c534c;
  color: #0c534c;
}

.excel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.excel-btn i {
  font-size: 1rem;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 8px;
}

.search-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.search-input {
  border: none;
  outline: none;
  flex: 1;
  padding: 6px;
  font-size: 0.95rem;
}

.search-count {
  color: #666;
  font-size: 0.85rem;
  margin-left: 10px;
  white-space: nowrap;
}

.search-buttons {
  display: flex;
  gap: 5px;
}

.search-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 5px 8px;
  border-radius: 3px;
  transition: background-color 0.2s;
}

.search-btn:hover:not(:disabled) {
  background-color: #e6f1ec;
}

.search-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.close-btn:hover {
  background-color: #ffebee;
  color: #d32f2f;
}

/* Estilo para el menú desplegable de filtros de Handsontable */
.handsontable .htDropdownMenu {
  border-radius: 4px;
  padding: 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.handsontable .htDropdownMenu .htCore {
  border: none;
}

.handsontable .htDropdownMenu .htUIButton {
  background-color: #f5f5f5;
  border-radius: 4px;
  margin: 4px 8px;
}

.handsontable .htDropdownMenu .htUIButton:hover {
  background-color: #e6f1ec;
}

.handsontable .htUIButton.htUIButtonOK {
  background-color: #0c534c;
  color: white;
}

.handsontable .htUIInput input {
  border-radius: 4px;
  border: 1px solid #ddd;
  padding: 5px 8px;
}

/* Estilo para celdas resaltadas por búsqueda */
.handsontable .htSearchResult {
  background-color: rgba(255, 235, 59, 0.4) !important;
}

.handsontable .htSearchResult.current {
  background-color: rgba(255, 152, 0, 0.6) !important;
}

/* Estilo para Handsontable con apariencia más Excel */
.excel-grid {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  font-size: 14px;
}

.excel-grid .htCore thead th {
  background-color: #f8f8f8;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  text-align: center;
  position: relative;
}

.excel-grid .htCore thead th.columnSorting::after {
  content: '\25be';
  position: absolute;
  right: 5px;
  color: #0c534c;
}

.excel-grid .htCore thead th.columnSorting.ascending::after {
  content: '\25b4';
}

.excel-grid .htCore tbody th {
  background-color: #f8f8f8;
  color: #333;
  text-align: center;
}

.excel-grid .htCore td {
  border: 1px solid #ddd;
  padding: 4px 6px;
}

.excel-grid .htCore tbody tr:nth-child(even) td {
  background-color: #f9f9f9;
}

.excel-grid .htCore .htAutocompleteArrow {
  color: #0c534c;
}

.excel-grid .htCore td.htDimmed {
  background-color: #f0f0f0;
}

.excel-grid .htCore td.htFiltered {
  background-color: rgba(12, 83, 76, 0.05);
}

/* Estilo para filas resaltadas */
.highlighted-row {
  background-color: #e6f1ec !important;
  border-left: 3px solid #0c534c;
  font-weight: 500;
}

.highlighted-row:hover {
  background-color: #d0e8e3 !important;
}

</style>