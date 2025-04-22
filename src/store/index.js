import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import axios from 'axios';
import config from '../config';

export default createStore({
  state: {
    codigos: [],
    selectedCodigo: '',
    detalles: [],
    currentPage: 1,
    itemsPerPage: 10,
    error: null,
    statusUpdated: false,
    formValido: false,
    codigoInventario: '',
    datos: [],
    datosFiltrados: [],
    filtroEstado: '',
    filtroProducto: '',
    totals: {
      'Total Inventarios': 0,
      'Faltante': 0,
      'Sobrante': 0,
      'Conciliado': 0
    },
    filaSeleccionada: null,
    mostrarMenuContextual: false,
    mostrarModal: false,
    menuPos: {
      x: 0,
      y: 0
    },
    isExportingCodigo: false,
    isExporting: false,
    observacion: {
      producto: '',
      estado_pro: '',
      descripcion_pro: '',
      centropro: '',
      lote_pro: '',
      unidad_medida_pro: '',
      codigo_inventario_pro: '',
      diferencia_pro: '',
      categoria_obsv: '',
      observacion_obsv: ''
    },
    categorias: [
      "Error de Carga",
      "Error de conteos",
      "Duplicado",
      "Error de atención",
      "Error de DI",
      "Por regularizar",
      "Otros",
    ],
    pageSize: 10,
    totalPages: 1,



    
    usuario: null,
    rol: null
  },
  
  mutations: {

    resetError(state) {
      state.error = null;
    },
    resetFiltros(state) {
      state.ubicacion = '';
      state.producto = '';
      localStorage.removeItem('ubicacion');
      localStorage.removeItem('producto');
    },
    cargarDesdeLocalStorage() {
      this.ubicacion = localStorage.getItem("ubicacion") || "";
      this.producto = localStorage.getItem("producto") || "";
    },
    actualizarFiltros() {
      this.setUbicacion(this.ubicacion);
      this.setProducto(this.producto);
      this.fetchDetalles(); // Actualiza la vista con los nuevos filtros
    },
    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
    },
    selectCodigo(codigo) {
        this.$store.commit('setSelectedCodigo', codigo);
        this.isDropdownOpen = false; // Cierra el dropdown tras seleccionar
        this.fetchDetalles();
    },
    closeError() {
        this.resetError(); // Limpia el error del estado
    },
    setCodigos(state, codigos) {
      state.codigos = codigos;
    },
    setSelectedCodigo(state, codigo) {
      state.selectedCodigo = codigo;
    },
    setDetalles(state, detalles) {
      state.detalles = [...detalles];
    },
    setCurrentPage(state, page) {
      state.currentPage = page;
    },
    setError(state, error) {
      state.error = error;
    },
    setFormValido(state, valor) {
      state.formValido = valor;
    },

    setUbicacion(state, value) {
      state.ubicacion = value;
      localStorage.setItem('ubicacion', value);
    },
    setProducto(state, value) {
      state.producto = value;
      localStorage.setItem('producto', value);
    },


    setUsuario(state, usuario) {
      state.usuario = usuario;
    },
    setRol(state, rol) {
      state.rol = rol;
    }
    

    
  },
  actions: {
    
    async fetchCodigos({ commit }) {
      try {
        const response = await axios.get(`${config.BASE_URL}/api/inventario/codigos`, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        });
        commit('setCodigos', response.data);
      } catch (error) {
        console.error("Error al obtener códigos de inventario:", error);
        commit('setError', 'Error al obtener los códigos de inventario');
      }
    },
  
  async fetchDetalles({ state, commit }) {
      try {
          const response = await axios.get(`${config.BASE_URL}/api/inventario/obtenerPorCodigo/${state.selectedCodigo}`, {
              headers: {
                  "Content-Type": "application/json",
              },
              withCredentials: true, // 🔹 Enviar automáticamente las cookies de autenticación
              params: {
                  producto: state.producto || '', 
                  ubicacion: state.ubicacion || '',
              },
          });
  
          console.log("Detalles obtenidos:", response.data);
          commit('setDetalles', response.data);
      } catch (error) {
          console.error("Error al obtener detalles:", error.response?.data || error.message);
          commit('setError', 'Error al obtener detalles');
      }
  }
,  
  async setPage({ commit, dispatch }, page) {
      commit('setCurrentPage', page);
      dispatch('fetchDetalles'); // Ya tienes el código seleccionado en el estado
  },
    
  },
  getters: {
    detalles: (state) => state.detalles,
    paginatedDetalles(state) {
      const start = (state.currentPage - 1) * state.itemsPerPage;
      return state.detalles.slice(start, start + state.itemsPerPage);
    },
    totalPages(state) {
      return Math.ceil(state.detalles.length / state.itemsPerPage);
    },
  },
  plugins: [createPersistedState({
    paths: ['codigos', 'detalles', 'selectedCodigo'], // Persistir solo los datos necesarios
  })],
  
});
