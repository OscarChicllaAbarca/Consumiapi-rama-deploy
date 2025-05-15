<template>
    <div class="user-home">
      <header class="header">
        <h1>Portal de Asistencias - Usuario</h1>
      </header>
      
      <div class="tabs">
        <button 
          @click="activeTab = 'registrar'" 
          :class="{ active: activeTab === 'registrar' }"
        >
          Registrar Asistencia
        </button>
        <button 
          @click="activeTab = 'listar'" 
          :class="{ active: activeTab === 'listar' }"
        >
          Mis Asistencias
        </button>
        <button 
          @click="activeTab = 'solicitar'" 
          :class="{ active: activeTab === 'solicitar' }"
        >
          Solicitar Horas Extras
        </button>
      </div>
      
      <div class="content">
        <RegistroAsistencia v-if="activeTab === 'registrar'" />
        <ListaAsistencias v-if="activeTab === 'listar'" />
        <SolicitudHorasExtras v-if="activeTab === 'solicitar'" />
      </div>
    </div>
  </template>
  
  <script>
  import RegistroAsistencia from '@/components/usuario/RegistroAsistencia.vue';
  import ListaAsistencias from '@/components/usuario/ListaAsistencias.vue';
  import SolicitudHorasExtras from '@/components/usuario/SolicitudHorasExtras.vue';
  
  export default {
    name: 'UserAsistencia',
    components: {
      RegistroAsistencia,
      ListaAsistencias,
      SolicitudHorasExtras
    },
    data() {
      return {
        activeTab: 'registrar'
      };
    }
  };
  </script>
  
  <style scoped>
  .user-home {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .header {
    background-color: #4285F4;
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 5px 5px 0 0;
  }
  
  .tabs {
    display: flex;
    border-bottom: 1px solid #ccc;
    margin-bottom: 20px;
  }
  
  .tabs button {
    background-color: transparent;
    border: none;
    padding: 15px 20px;
    cursor: pointer;
    font-size: 16px;
    border-bottom: 3px solid transparent;
    transition: all 0.3s ease;
  }
  
  .tabs button.active {
    border-bottom-color: #4285F4;
    color: #4285F4;
    font-weight: bold;
  }
  
  .content {
    background-color: #fff;
    padding: 20px;
    border-radius: 0 0 5px 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  </style>