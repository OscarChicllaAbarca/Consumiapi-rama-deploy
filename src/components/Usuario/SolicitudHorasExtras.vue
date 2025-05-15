<template>
    <div class="solicitud-horas-extras">
      <h2>Solicitud de Horas Extras</h2>
      
      <div class="form-group">
        <label>ID de Asistencia:</label>
        <input type="number" v-model="solicitud.idAsistencia" placeholder="Ingrese ID de asistencia" />
      </div>
      
      <div class="form-group">
        <label>Horas Extras:</label>
        <input type="number" step="0.5" v-model="solicitud.horasExtras" placeholder="Cantidad de horas extras" />
      </div>
      
      <div class="form-group">
        <label>Motivo:</label>
        <textarea v-model="solicitud.motivo" placeholder="Describa el motivo de las horas extras"></textarea>
      </div>
      
      <button @click="enviarSolicitud">Enviar Solicitud</button>
      
      <div v-if="mensaje" class="mensaje" :class="{ error: hayError }">
        {{ mensaje }}
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'SolicitudHorasExtras',
    data() {
      return {
        solicitud: {
          idAsistencia: null,
          horasExtras: 0,
          motivo: ''
        },
        mensaje: '',
        hayError: false
      };
    },
    methods: {
      async enviarSolicitud() {
        if (!this.validarSolicitud()) {
          return;
        }
        
        try {
          const response = await axios.post(
            `http://localhost:8765/api/asistencia/${this.solicitud.idAsistencia}/horas-extras`, 
            {
              horasExtras: this.solicitud.horasExtras,
              motivo: this.solicitud.motivo
            }
          );
          
          this.mensaje = 'Solicitud de horas extras enviada correctamente';
          this.hayError = false;
          this.limpiarFormulario();
          this.$emit('solicitud-enviada', response.data);
        } catch (error) {
          console.error('Error al solicitar horas extras:', error);
          this.mensaje = `Error: ${error.response?.data?.message || 'No se pudo enviar la solicitud'}`;
          this.hayError = true;
        }
      },
      
      validarSolicitud() {
        if (!this.solicitud.idAsistencia) {
          this.mensaje = 'Error: El ID de asistencia es obligatorio';
          this.hayError = true;
          return false;
        }
        
        if (!this.solicitud.horasExtras || this.solicitud.horasExtras <= 0) {
          this.mensaje = 'Error: Las horas extras deben ser un número positivo';
          this.hayError = true;
          return false;
        }
        
        if (!this.solicitud.motivo.trim()) {
          this.mensaje = 'Error: El motivo es obligatorio';
          this.hayError = true;
          return false;
        }
        
        return true;
      },
      
      limpiarFormulario() {
        this.solicitud = {
          idAsistencia: null,
          horasExtras: 0,
          motivo: ''
        };
      }
    }
  };
  </script>
  
  <style scoped>
  .solicitud-horas-extras {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  input, textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  textarea {
    height: 100px;
  }
  
  button {
    background-color: #4CAF50;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .mensaje {
    margin-top: 15px;
    padding: 10px;
    background-color: #d4edda;
    border-radius: 4px;
  }
  
  .error {
    background-color: #f8d7da;
  }
  </style>