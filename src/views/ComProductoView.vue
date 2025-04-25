<template>
  <div class="spreadsheet-container">
    <h2>Visualizador Tipo Excel</h2>
    
 
    <div class="upload-section">
      <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" />
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
    

    <div v-if="sheetNames.length > 0" class="sheet-selector">
      <label>Hoja: </label>
      <select v-model="selectedSheet" @change="changeSheet">
        <option v-for="sheet in sheetNames" :key="sheet" :value="sheet">{{ sheet }}</option>
      </select>
      
      <div class="sheet-actions">
        <button @click="showSelectedData" :disabled="!hasSelection">
          Ver selección
        </button>
      </div>
    </div>
    

    <div v-if="sheetData.length > 0" class="excel-grid-container">
      <div id="hot-table" ref="hotTable"></div>
    </div>
    
  
    <div v-if="selectedDataVisible" class="selected-data-view">
      <h3>Datos Seleccionados:</h3>
      <div class="selected-grid-container">
        <div id="selected-hot-table" ref="selectedHotTable"></div>
      </div>
      
      <div class="export-options">
        <button @click="exportSelectedData" class="export-button">Exportar selección</button>
        <button @click="closeSelectedData" class="close-button">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script>
// Importamos XLSX para procesar archivos Excel
import * as XLSX from 'xlsx';


import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.css';

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
      errorMessage: ''          
    };
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
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
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
            return;
          }
          
         
          this.selectedSheet = this.sheetNames[0];
          this.loadSheetData(this.selectedSheet);
          
        } catch (error) {
          this.errorMessage = 'Error al procesar el archivo: ' + error.message;
          console.error('Error procesando el archivo Excel:', error);
        }
      };
      
      reader.onerror = (error) => {
        this.errorMessage = 'Error al leer el archivo';
        console.error('Error leyendo el archivo:', error);
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
        
        this.hotInstance = new Handsontable(container, {
          data: this.sheetData,
          rowHeaders: true,
          colHeaders: true,
          contextMenu: true,
          manualColumnResize: true,
          manualRowResize: true,
          stretchH: 'all',
          autoColumnSize: true,
          licenseKey: 'non-commercial-and-evaluation', 
          readOnly: false, 
          outsideClickDeselects: false,
          selectionMode: 'multiple',
          afterSelectionEnd: (row, column, row2, column2) => {
            this.currentSelection = [row, column, row2, column2];
            this.hasSelection = true;
          }
        });
        
     
        setTimeout(() => {
          this.resizeTable();
        }, 0);
        
      } catch (error) {
        console.error('Error al inicializar Handsontable:', error);
        this.errorMessage = 'Error al inicializar la tabla: ' + error.message;
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
          readOnly: false 
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
    
    showSelectedData() {
      if (!this.hasSelection || !this.currentSelection) {
        this.errorMessage = 'Por favor selecciona algunas celdas primero';
        return;
      }
      
      try {

        const [startRow, startCol, endRow, endCol] = this.currentSelection;
        
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
        // Usamos setTimeout para asegurar que el DOM se actualice antes de inicializar
        setTimeout(() => {
          this.initializeSelectedDataTable();
        }, 0);
        
      } catch (error) {
        this.errorMessage = 'Error al procesar la selección: ' + error.message;
        console.error('Error procesando selección:', error);
      }
    },
    
    closeSelectedData() {
      this.selectedDataVisible = false;
    },
    
    exportSelectedData() {
      if (!this.selectedData || this.selectedData.length === 0) {
        this.errorMessage = 'No hay datos para exportar';
        return;
      }
      
      try {
        // Crear una nueva hoja de trabajo
        const ws = XLSX.utils.aoa_to_sheet(
          this.selectedDataHeaders.length > 0 
            ? [this.selectedDataHeaders, ...this.selectedData] 
            : this.selectedData
        );
        
        // Crear un nuevo libro de trabajo y añadir la hoja
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Datos Seleccionados");
        
        // Exportar a archivo
        const fileName = "datos_seleccionados_" + new Date().toISOString().slice(0,10) + ".xlsx";
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
.spreadsheet-container {
  font-family: Arial, sans-serif;
  margin: 20px;
  max-width: 100%;
}

.upload-section {
  margin-bottom: 20px;
}

.error-message {
  color: red;
  font-weight: bold;
  margin-top: 10px;
}

.sheet-selector {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 15px;
}

.sheet-selector select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.sheet-actions button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 8px 12px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
}

.sheet-actions button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.excel-grid-container, .selected-grid-container {
  width: 100%;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  min-height: 400px; /* Asegurar que el contenedor tenga altura incluso vacío */
}

.selected-data-view {
  margin-top: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f8f8f8;
}

.export-options {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}

.export-button {
  background-color: #337ab7;
  border: none;
  color: white;
  padding: 8px 12px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
}

.close-button {
  background-color: #d9534f;
  border: none;
  color: white;
  padding: 8px 12px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
}

/* Estilos para mejorar la apariencia de Handsontable */
:deep(.handsontable) {
  font-size: 14px;
}

:deep(.handsontable .htDimmed) {
  font-weight: bold;
  background-color: #f3f3f3;
}

/* Responsive design */
@media (max-width: 768px) {
  .sheet-selector {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>