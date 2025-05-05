<template>
    <div v-if="show" class="modal-overlay">
      <div class="modal-terminos">
        <div class="modal-header">
          <h2>Aceptar Términos y Condiciones</h2>
          <button @click="cerrarModal" class="modal-cerrar">&times;</button>
        </div>
  
        <div class="modal-body">
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
            <textarea 
              id="observacion" 
              v-model="observacion" 
              placeholder="Ingrese una observación (opcional)"
              class="modal-textarea"
              rows="4"
            ></textarea>
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
        </div>
  
        <div class="modal-footer">
          <button 
            @click="cerrarModal" 
            class="btn-reset"
            :disabled="isLoading"
          >
            Cancelar
          </button>
          <button 
            @click="aceptarTerminos" 
            class="btn-aceptar"
            :disabled="isLoading || yaAceptado"
          >
            {{ isLoading ? 'Procesando...' : (yaAceptado ? 'Ya Aceptado' : 'Aceptar') }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import config from '../config';
  
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
        yaAceptado: false
      };
    },
    watch: {
      show(newVal) {
        if (newVal) {
          this.observacion = '';
          this.isLoading = false;
          this.verificarEstado();
        }
      }
    },
    methods: {
      async verificarEstado() {
        try {
          const response = await axios.get(`${config.BASE_URL}/api/terminos/estado/${this.codigoInventarioActual}`, {
            withCredentials: true
          });
          this.yaAceptado = response.data.aceptado || false;
        } catch (error) {
          console.error('Error al verificar estado:', error);
          this.yaAceptado = false;
        }
      },
      async aceptarTerminos() {
        this.isLoading = true;
        try {
          const data = {
            codigoInventario: this.codigoInventarioActual,
            observacion: this.observacion,
            resumen: {
              faltanteSku: this.datosResumen.faltanteSku,
              faltanteValor: this.datosResumen.faltanteValor,
              sobranteSku: this.datosResumen.sobranteSku,
              sobranteValor: this.datosResumen.sobranteValor,
              conciliadoSku: this.datosResumen.conciliadoSku,
              conciliadoValor: this.datosResumen.conciliadoValor
            }
          };
  
          const response = await axios.post(`${config.BASE_URL}/api/terminos/aceptar`, data, {
            withCredentials: true
          });
  
          this.$emit('aceptado', response.data);
          this.cerrarModal();
        } catch (error) {
          console.error('Error al aceptar términos:', error);
          alert('Error al aceptar términos y condiciones. Por favor, intente nuevamente.');
        } finally {
          this.isLoading = false;
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
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-terminos {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f5f5f5;
  }
  
  .modal-header h2 {
    margin: 0;
    color: #333;
    font-size: 1.5rem;
  }
  
  .modal-cerrar {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    padding: 0 5px;
    color: #666;
  }
  
  .modal-cerrar:hover {
    color: #333;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .codigo-info {
    margin-bottom: 20px;
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
  }
  
  .codigo-info h3 {
    margin: 0;
    color: #495057;
  }
  
  .resumen-datos {
    margin-bottom: 25px;
    border: 1px solid #dee2e6;
    border-radius: 5px;
    overflow: hidden;
  }
  
  .resumen-fila {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 10px;
    border-bottom: 1px solid #dee2e6;
  }
  
  .resumen-fila:last-child {
    border-bottom: none;
  }
  
  .resumen-fila:first-child {
    background-color: #343a40;
    color: white;
    font-weight: bold;
  }
  
  .resumen-fila.faltante {
    background-color: #ffe6e6;
  }
  
  .resumen-fila.sobrante {
    background-color: #fff8e1;
  }
  
  .resumen-fila.conciliado {
    background-color: #e8f5e9;
  }
  
  .resumen-label, 
  .resumen-sku, 
  .resumen-valor {
    padding: 5px 10px;
    text-align: left;
  }
  
  .resumen-valor {
    text-align: right;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #343a40;
  }
  
  .modal-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    resize: vertical;
  }
  
  .terminos-contenido {
    margin-bottom: 25px;
  }
  
  .terminos-texto {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 5px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .terminos-texto h3 {
    margin-top: 0;
    color: #495057;
  }
  
  .terminos-texto ul {
    padding-left: 20px;
  }
  
  .terminos-texto li {
    margin-bottom: 8px;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 15px 20px;
    border-top: 1px solid #e0e0e0;
    background-color: #f5f5f5;
  }
  
  .btn-reset {
    padding: 8px 20px;
    border: 2px solid #6c757d;
    background-color: transparent;
    color: #6c757d;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .btn-reset:hover:not(:disabled) {
    background-color: #6c757d;
    color: white;
  }
  
  .btn-aceptar {
    padding: 8px 20px;
    border: none;
    background-color: #28a745;
    color: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .btn-aceptar:hover:not(:disabled) {
    background-color: #218838;
  }
  
  .btn-aceptar:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
  </style>