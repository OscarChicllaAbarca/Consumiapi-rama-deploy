<template>
    <div class="registro-asistencia">
      <h2>Registro de Asistencia</h2>
      
      <div class="form-group">
        <label>DNI Empleado:</label>
        <input type="number" v-model="asistencia.dniEmpleado" />
      </div>
      
      <div class="form-group">
        <label>DNI Supervisor:</label>
        <input type="number" v-model="asistencia.dniSupervisor" />
      </div>
      
      <div class="form-group">
        <label>Estado:</label>
        <select v-model="asistencia.estado">
          <option value="PRESENTE">Presente</option>
          <option value="AUSENTE">Ausente</option>
          <option value="TARDANZA">Tardanza</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Hora Entrada:</label>
        <input type="time" v-model="asistencia.horaEntrada" />
      </div>
      
      <div class="form-group">
        <label>Hora Salida:</label>
        <input type="time" v-model="asistencia.horaSalida" />
      </div>
      
      <div class="form-group">
        <label>Observaciones:</label>
        <textarea v-model="asistencia.observaciones"></textarea>
      </div>
      
      <button @click="registrar">Registrar Asistencia</button>
      
      <div v-if="mensaje" class="mensaje" :class="{ error: hayError }">
        {{ mensaje }}
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    name: 'RegistroAsistencia',
    data() {
      return {
        asistencia: {
          dniEmpleado: null,
          dniSupervisor: null,
          estado: 'PRESENTE',
          horaEntrada: '',
          horaSalida: '',
          observaciones: ''
        },
        mensaje: '',
        hayError: false
      };
    },
    methods: {
      async registrar() {
        try {
          const response = await axios.post('http://localhost:8765/api/asistencia/registrar', this.asistencia);
          this.mensaje = 'Asistencia registrada correctamente';
          this.hayError = false;
          this.limpiarFormulario();
          this.$emit('asistencia-registrada', response.data);
        } catch (error) {
          console.error('Error al registrar asistencia:', error);
          this.mensaje = `Error: ${error.response?.data?.message || 'No se pudo registrar la asistencia'}`;
          this.hayError = true;
        }
      },
      limpiarFormulario() {
        this.asistencia = {
          dniEmpleado: null,
          dniSupervisor: null,
          estado: 'PRESENTE',
          horaEntrada: '',
          horaSalida: '',
          observaciones: ''
        };
      }
    }
  };
  </script>
  
  <style scoped>
  .registro-asistencia {
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
  
  input, select, textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
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