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
          <i class="fas fa-times-circle"></i>
          <span class="btn-text">Cancelar</span>
        </button>
        <button 
          @click="aceptarTerminos" 
          class="btn-buscar"
          :disabled="isLoading || yaAceptado"
        >
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
      }
    }
  },
  methods: {
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