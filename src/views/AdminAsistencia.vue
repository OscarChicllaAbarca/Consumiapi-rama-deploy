<template>
    <div class="admin-home">
      <header class="header">
        <h1>Portal de Asistencias - Administrador</h1>
      </header>
      
      <div class="tabs">
        <button 
          @click="activeTab = 'aprobacion'" 
          :class="{ active: activeTab === 'aprobacion' }"
        >
          Aprobación de Horas Extras
        </button>
        <button 
          @click="activeTab = 'reportes'" 
          :class="{ active: activeTab === 'reportes' }"
        >
          Reportes de Asistencias
        </button>
      </div>
      
      <div class="content">
        <AprobacionHorasExtras v-if="activeTab === 'aprobacion'" />
        <ReporteAsistencias v-if="activeTab === 'reportes'" />
      </div>
    </div>
  </template>
  
  <script>
  import AprobacionHorasExtras from '@/components/admin/AprobacionHorasExtras.vue';
  import ReporteAsistencias from '@/components/admin/ReporteAsistencias.vue';
  
  export default {
    name: 'AdminAsistencia',
    components: {
      AprobacionHorasExtras,
      ReporteAsistencias
    },
    data() {
      return {
        activeTab: 'aprobacion'
      };
    }
  };
  </script>
  
  <style scoped>
  .admin-home {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .header {
    background-color: #34A853;
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
    border-bottom-color: #34A853;
    color: #34A853;
    font-weight: bold;
  }
  
  .content {
    background-color: #fff;
    padding: 20px;
    border-radius: 0 0 5px 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  </style>