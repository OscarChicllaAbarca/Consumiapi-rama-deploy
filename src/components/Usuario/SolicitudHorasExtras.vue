<template>
    <div class="overtime-container">
        <!-- Encabezado mejorado con diseño más limpio -->
        <div class="overtime-header">
            <h1 class="pulse-title">REGISTRO DE HORAS EXTRAS</h1>
            <div class="date-control">
                <span class="date-label">Fecha:</span>
                <input type="date" v-model="fechaSeleccionada" @change="cargarEmpleadosPresentes" class="date-input" />
            </div>
        </div>

        <!-- Panel de configuración de horas extras con estilo mejorado -->
        <div class="configuration-panel" v-if="mostrarExtras">
            <div class="panel-header">
                <div class="panel-title">
                    <i class="panel-icon">⏱️</i>
                    <h3>Configuración de horas extras</h3>
                </div>
                <button class="toggle-button" @click="mostrarExtras = !mostrarExtras">
                    {{ mostrarExtras ? '−' : '+' }}
                </button>
            </div>
            
            <div class="config-form">
                <div class="config-row">
                    <div class="hours-control">
                        <i class="control-icon">⏱️</i>
                        <div class="hours-input-wrapper">
                            <button class="hours-adjust-btn" @click="ajustarHoras(-0.5)">−</button>
                            <input type="number" v-model="horasExtras" min="0.5" step="0.5" class="hours-input" />
                            <button class="hours-adjust-btn" @click="ajustarHoras(0.5)">+</button>
                        </div>
                        <span class="control-label">Horas extras</span>
                    </div>
                    
                    <div class="reason-control">
                        <i class="control-icon">📝</i>
                        <textarea 
                            v-model="motivo" 
                            placeholder="Motivo de las horas extras..." 
                            class="reason-textarea"
                        ></textarea>
                    </div>
                </div>
                
                <!-- Presets de motivos más accesibles -->
                <div class="reason-presets" v-if="motivosPresets.length > 0">
                    <span class="presets-label">Motivos comunes:</span>
                    <div class="preset-buttons">
                        <button 
                            v-for="(preset, index) in motivosPresets" 
                            :key="index"
                            class="preset-button"
                            @click="motivo = preset"
                        >
                            {{ preset }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenedor de tabla mejorado -->
        <div class="employee-table-container">
            <div class="table-header-bar">
                <div class="table-title">
                    <i class="title-icon">👥</i>
                    <h3>Empleados con asistencia PRESENTE</h3>
                </div>
                <div class="table-actions">
                    <span class="results-count">{{ empleadosFiltradosYOrdenados.length }} resultados</span>
                    <button 
                        class="select-all-button" 
                        @click="marcarDesmarcarTodos"
                        v-if="empleadosFiltradosYOrdenados.length > 0"
                    >
                        {{ todosMarcados ? 'Desmarcar todos' : 'Seleccionar todos' }}
                    </button>
                </div>
            </div>
            
            <!-- Tabla con mejor estructura visual -->
            <div class="table-scroll">
                <table class="employee-table">
                    <thead>
                        <tr>
                            <th class="checkbox-column">
                                <div class="checkbox-container">
                                    <div class="checkbox-icon master-checkbox" 
                                         :class="{ checked: todosMarcados }" 
                                         @click="marcarDesmarcarTodos">
                                        <span v-if="todosMarcados" class="check-animation">✓</span>
                                    </div>
                                </div>
                            </th>
                            <th @click="ordenarPor('dni')">
                                DNI 
                                <span class="sort-icon" v-if="columnaOrdenada === 'dni'">
                                    {{ ordenAscendente ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th @click="ordenarPor('nombre')">
                                Nombre
                                <span class="sort-icon" v-if="columnaOrdenada === 'nombre'">
                                    {{ ordenAscendente ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th @click="ordenarPor('apellidoPaterno')">
                                Apellido Paterno
                                <span class="sort-icon" v-if="columnaOrdenada === 'apellidoPaterno'">
                                    {{ ordenAscendente ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th @click="ordenarPor('apellidoMaterno')">
                                Apellido Materno
                                <span class="sort-icon" v-if="columnaOrdenada === 'apellidoMaterno'">
                                    {{ ordenAscendente ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th @click="ordenarPor('area')">
                                Área
                                <span class="sort-icon" v-if="columnaOrdenada === 'area'">
                                    {{ ordenAscendente ? '↑' : '↓' }}
                                </span>
                            </th>
                            <th @click="ordenarPor('sucursal')">
                                Sucursal
                                <span class="sort-icon" v-if="columnaOrdenada === 'sucursal'">
                                    {{ ordenAscendente ? '↑' : '↓' }}
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="empleado in empleadosFiltradosYOrdenados" 
                            :key="empleado.idAsistencia" 
                            class="employee-row" 
                            :class="{ selected: empleado.seleccionado }" 
                            @click="toggleSeleccion(empleado)">
                            <td class="checkbox-column" @click.stop="toggleSeleccion(empleado)">
                                <div class="checkbox-container">
                                    <div class="checkbox-icon" :class="{ checked: empleado.seleccionado }">
                                        <span v-if="empleado.seleccionado" class="check-animation">✓</span>
                                    </div>
                                </div>
                            </td>
                            <td>{{ empleado.dni }}</td>
                            <td>{{ empleado.nombre }}</td>
                            <td>{{ empleado.apellidoPaterno }}</td>
                            <td>{{ empleado.apellidoMaterno }}</td>
                            <td>{{ empleado.area }}</td>
                            <td>{{ empleado.sucursal }}</td>
                        </tr>
                        <tr v-if="empleadosFiltradosYOrdenados.length === 0">
                            <td colspan="7" class="no-results">
                                <div class="empty-state">
                                    <div class="empty-icon">📝</div>
                                    <div class="empty-message">
                                        <p>No se encontraron resultados</p>
                                        <span v-if="hayFiltrosActivos">Prueba a cambiar los filtros de búsqueda</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Resumen de selección flotante mejorado -->
        <div class="selection-summary" v-if="empleadosSeleccionados.length > 0">
            <div class="summary-content">
                <div class="summary-count">
                    <span class="count-icon">👥</span>
                    <span class="count-text">{{ empleadosSeleccionados.length }} empleado(s) seleccionado(s)</span>
                </div>
                <div class="summary-total">
                    <span class="total-icon">⏱️</span>
                    <span class="total-hours">Total: {{ horasExtras * empleadosSeleccionados.length }} horas</span>
                </div>
            </div>
            <div class="summary-controls">
                <button class="clear-selection" @click="limpiarSeleccion">
                    <span class="button-icon">🗑️</span>
                    Limpiar selección
                </button>
            </div>
        </div>

        <!-- Botón de acción principal mejorado -->
        <div class="action-container">
            <button @click="registrarHorasExtras" class="action-button" :disabled="!formularioValido || procesando">
                <span class="button-icon">{{ procesando ? '⏳' : '💾' }}</span> 
                {{ procesando ? 'Procesando...' : 'Registrar Horas Extras' }}
            </button>
        </div>

        <!-- Notificación mejorada -->
        <transition name="slide-fade">
            <div v-if="mensaje" class="notification" :class="hayError ? 'error' : 'success'">
                <div class="notification-content">
                    <span class="notification-icon">{{ hayError ? '❌' : '✅' }}</span>
                    <span>{{ mensaje }}</span>
                </div>
                <button class="close-notification" @click="cerrarNotificacion">×</button>
            </div>
        </transition>

        <!-- Modal de confirmación mejorado -->
        <transition name="fade">
            <div class="modal-overlay" v-if="mostrarModal" @click="cancelarRegistro">
                <div class="modal-card" @click.stop>
                    <div class="modal-header">
                        <h3>Confirmar registro de horas extras</h3>
                        <button class="modal-close" @click="cancelarRegistro">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-icon">⏱️</div>
                        <p>Estás a punto de registrar <strong>{{ horasExtras }} horas extras</strong> para <strong>{{ empleadosSeleccionados.length }} empleado(s)</strong>.</p>
                        <p><strong>Motivo:</strong> {{ motivo }}</p>
                        <p>¿Deseas continuar?</p>
                    </div>
                    <div class="modal-footer">
                        <button class="cancel-button" @click="cancelarRegistro">Cancelar</button>
                        <button class="confirm-button" @click="confirmarRegistro">Confirmar</button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>
<script>
import axios from 'axios';
import config from '@/config';

export default {
    name: 'RegistroHorasExtras',
    data() {
        return {
            empleados: [],
            fechaSeleccionada: new Date().toISOString().split('T')[0],
            filtroDNI: '',
            filtroNombre: '',
            filtroArea: '',
            horasExtras: 1,
            motivo: '',
            mensaje: '',
            hayError: false,
            columnaOrdenada: '',
            ordenAscendente: true,
            procesando: false,
            mostrarFiltros: true,
            mostrarExtras: true,
            mostrarModal: false,
            motivosPresets: [
                'Finalización de proyecto urgente',
                'Trabajo de inventario',
                'Mantenimiento programado',
                'Capacitación especial',
                'Reunión extraordinaria',
                'Cierre contable mensual',
                'Implementación de sistema'
            ]
        };
    },
    computed: {
        empleadosSeleccionados() {
            return this.empleados.filter(emp => emp.seleccionado);
        },
        todosMarcados() {
            return this.empleadosFiltradosYOrdenados.length > 0 && 
                   this.empleadosFiltradosYOrdenados.every(emp => emp.seleccionado);
        },
        hayFiltrosActivos() {
            return this.filtroDNI !== '' || this.filtroNombre !== '' || this.filtroArea !== '';
        },
        empleadosFiltradosYOrdenados() {
            // Filtrar empleados según criterios
            let filtrados = this.empleados.filter(emp => {
                const dni = String(emp.dni || '').toLowerCase();
                const nombre = (emp.nombre || '').toLowerCase();
                const apellidoPaterno = (emp.apellidoPaterno || '').toLowerCase();
                const apellidoMaterno = (emp.apellidoMaterno || '').toLowerCase();
                const area = (emp.area || '').toLowerCase();
                
                const filtroDNILow = this.filtroDNI.toLowerCase();
                const filtroNombreLow = this.filtroNombre.toLowerCase();
                const filtroAreaLow = this.filtroArea.toLowerCase();
                
                return dni.includes(filtroDNILow) &&
                    (nombre.includes(filtroNombreLow) || 
                     apellidoPaterno.includes(filtroNombreLow) || 
                     apellidoMaterno.includes(filtroNombreLow)) &&
                    area.includes(filtroAreaLow);
            });

            // Ordenar si hay columna seleccionada
            if (this.columnaOrdenada) {
                const direccion = this.ordenAscendente ? 1 : -1;
                filtrados.sort((a, b) => {
                    const valorA = (a[this.columnaOrdenada] || '').toString().toLowerCase();
                    const valorB = (b[this.columnaOrdenada] || '').toString().toLowerCase();
                    return valorA > valorB ? direccion : -direccion;
                });
            }

            return filtrados;
        },
        formularioValido() {
            return this.empleadosSeleccionados.length > 0 && 
                   this.horasExtras > 0 && 
                   this.motivo.trim() !== '';
        }
    },
    created() {
        this.cargarEmpleadosPresentes();
    },
    methods: {
        // Cargar empleados con asistencia PRESENTE
        async cargarEmpleadosPresentes() {
            if (this.procesando) return;
            
            try {
                this.procesando = true;
                // Configuración para solicitudes seguras con cookies
                const configRequest = {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                };
                
                // Obtener todos los usuarios
                const usersResponse = await axios.get(
                    `${config.BASE_URL}/api/user`, 
                    configRequest
                );
                
                // Procesar usuarios con asistencia
                this.empleados = await Promise.all(usersResponse.data.map(async user => {
                    try {
                        // Obtener asistencias para este usuario y fecha
                        const asistenciasResponse = await axios.get(
                            `${config.BASE_URL}/api/asistencia/empleado/${user.dni}/fecha/${this.fechaSeleccionada}`,
                            configRequest
                        );
                        
                        const asistencia = asistenciasResponse.data[0];
                        
                        // Incluir solo usuarios PRESENTES
                        if (asistencia && asistencia.estado === 'PRESENTE') {
                            return {
                                ...user,
                                idAsistencia: asistencia.id,
                                estado: asistencia.estado,
                                observaciones: asistencia.observaciones || 'Actividad normal',
                                seleccionado: false
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error(`Error al obtener la asistencia del usuario ${user.dni}:`, error);
                        return null;
                    }
                }));
                
                // Filtrar nulos
                this.empleados = this.empleados.filter(emp => emp !== null);
                
                // Mostrar mensaje según resultado
                if (this.empleados.length === 0) {
                    this.mostrarMensaje('No se encontraron empleados con asistencia PRESENTE en esta fecha', true);
                } else {
                    this.mostrarMensaje(`Se cargaron ${this.empleados.length} empleados con asistencia PRESENTE`, false);
                }
            } catch (error) {
                console.error('Error al cargar empleados:', error);
                this.mostrarMensaje('Error al cargar empleados con asistencia PRESENTE', true);
                this.empleados = [];
            } finally {
                this.procesando = false;
            }
        },
        
        // Métodos para gestionar selección
        toggleSeleccion(empleado) {
            empleado.seleccionado = !empleado.seleccionado;
        },
        
        marcarDesmarcarTodos() {
            const nuevoEstado = !this.todosMarcados;
            this.empleadosFiltradosYOrdenados.forEach(emp => {
                emp.seleccionado = nuevoEstado;
            });
        },
        
        limpiarSeleccion() {
            this.empleados.forEach(emp => {
                emp.seleccionado = false;
            });
        },
        
        limpiarFiltros() {
            this.filtroDNI = '';
            this.filtroNombre = '';
            this.filtroArea = '';
        },
        
        // Ordenar tabla
        ordenarPor(columna) {
            if (this.columnaOrdenada === columna) {
                this.ordenAscendente = !this.ordenAscendente;
            } else {
                this.columnaOrdenada = columna;
                this.ordenAscendente = true;
            }
        },
        
        // Ajustar horas extras
        ajustarHoras(incremento) {
            const nuevoValor = parseFloat(this.horasExtras) + incremento;
            if (nuevoValor >= 0.5) {
                this.horasExtras = nuevoValor;
            }
        },
        
        // Registro de horas extras
        registrarHorasExtras() {
            if (!this.formularioValido) {
                this.mostrarMensaje('Debe seleccionar al menos un empleado y completar todos los campos', true);
                return;
            }
            
            // Mostrar modal de confirmación
            this.mostrarModal = true;
        },
        
        cancelarRegistro() {
            this.mostrarModal = false;
        },
        
        // Confirmar y procesar registro
        async confirmarRegistro() {
            this.mostrarModal = false;
            
            if (this.procesando) return;
            this.procesando = true;

            try {
                const seleccionados = this.empleadosSeleccionados;
                let exitosos = 0;
                let fallidos = 0;
                
                // Configuración para solicitudes
                const options = {
                    withCredentials: true,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                };

                // Procesar en lotes con promesas
                const promesas = seleccionados.map(empleado => 
                    axios.post(
                        `${config.BASE_URL}/api/asistencia/${empleado.idAsistencia}/horas-extras`,
                        {
                            horasExtras: this.horasExtras,
                            motivo: this.motivo
                        },
                        options
                    )
                    .then(() => {
                        exitosos++;
                        return true;
                    })
                    .catch(err => {
                        console.error(`Error al registrar horas extras para ID ${empleado.idAsistencia}:`, err);
                        fallidos++;
                        return false;
                    })
                );
                
                // Esperar todas las promesas
                await Promise.all(promesas);

                // Mostrar resultado
                if (exitosos > 0) {
                    const horasTotales = this.horasExtras * exitosos;
                    this.mostrarMensaje(
                        `Se registraron ${horasTotales} horas extras para ${exitosos} empleado(s)${fallidos > 0 ? `. Fallaron ${fallidos} registros.` : ''}`, 
                        fallidos > 0
                    );
                    this.limpiarSeleccion();
                } else {
                    this.mostrarMensaje('No se pudo registrar ninguna hora extra', true);
                }
            } catch (error) {
                console.error('Error general al registrar horas extras:', error);
                this.mostrarMensaje('Error al registrar horas extras', true);
            } finally {
                this.procesando = false;
            }
        },
        
        // Gestión de mensajes
        mostrarMensaje(mensaje, esError = false) {
            this.mensaje = mensaje;
            this.hayError = esError;
            
            // Auto-cerrar después de 5 segundos
            setTimeout(() => {
                this.mensaje = '';
            }, 5000);
        },
        
        cerrarNotificacion() {
            this.mensaje = '';
        },
        
        limpiarFormulario() {
            this.horasExtras = 1;
            this.motivo = '';
            this.limpiarSeleccion();
        }
    }
};
</script>

<style scoped>
/* Estilos base */
body {
  font-family: 'Poppins', 'Segoe UI', sans-serif;
  color: #0f172a;
  background: #f8fafc;
  line-height: 1.5;
}

/* Contenedor principal */
div[class="overtime-container"] {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Cabecera con diseño mejorado */
.overtime-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #1e40af, #0c534c);
  border-radius: 12px;
  color: #ffffff;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.overtime-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.3), transparent 70%);
  z-index: 0;
}

.pulse-title {
  font-size: 30px;
  font-weight: 800;
  margin-bottom: 15px;
  letter-spacing: 1.5px;
  position: relative;
  display: inline-block;
  padding-bottom: 10px;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  animation: pulse 2s infinite;
  z-index: 1;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.pulse-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #60a5fa, #10b981);
  border-radius: 3px;
}

/* Control de fecha */
.date-control {
  display: inline-flex;
  align-items: center;
  margin: 15px 0;
  background: rgba(255, 255, 255, 0.15);
  padding: 12px 20px;
  border-radius: 50px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 1;
  position: relative;
}

.date-label {
  font-size: 16px;
  margin-right: 15px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.date-input {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.1);
}

.date-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Estadísticas del tablero */
.dashboard-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 25px;
  flex-wrap: wrap;
  z-index: 1;
  position: relative;
}

.stat-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 18px;
  min-width: 130px;
  text-align: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
  z-index: -1;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.employee-icon {
  background: rgba(59, 130, 246, 0.3);
  box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
}

.selected-icon {
  background: rgba(16, 185, 129, 0.3);
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
}

.time-icon {
  background: rgba(234, 179, 8, 0.3);
  box-shadow: 0 5px 15px rgba(234, 179, 8, 0.4);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 10px;
  display: inline-block;
  width: 55px;
  height: 55px;
  line-height: 55px;
  border-radius: 50%;
  position: relative;
  z-index: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 5px;
  color: #ffffff;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Panel de configuración */
.configuration-panel {
  margin-bottom: 25px;
  background-color: #ffffff;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(to right, #f1f5f9, #ffffff);
  border-bottom: 1px solid #e2e8f0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title h3 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.panel-icon {
  font-size: 18px;
  color: #0c534c;
  background: rgba(59, 130, 246, 0.1);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toggle-button {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #0c534c;
  font-weight: bold;
  font-size: 18px;
}

.toggle-button:hover {
  background-color: #0c534c;
  color: #ffffff;
  transform: rotate(90deg);
  border-color: #0c534c;
}

.config-form {
  padding: 20px;
}

.config-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

/* Controles de configuración */
.hours-control, .reason-control {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.hours-control {
  flex: 0 0 auto;
}

.reason-control {
  flex: 1;
}

.control-icon {
  font-size: 20px;
  color: #0c534c;
  background: rgba(59, 130, 246, 0.1);
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.hours-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  background-color: #ffffff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.hours-input-wrapper:focus-within {
  border-color: #0c534c;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.hours-adjust-btn {
  width: 38px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8fafc;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  color: #1e293b;
  transition: all 0.2s ease;
}

.hours-adjust-btn:hover {
  background-color: #e2e8f0;
  color: #0c534c;
}

.hours-input {
  border: none;
  text-align: center;
  width: 70px;
  padding: 10px 5px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  background-color: transparent;
}

.hours-input:focus {
  outline: none;
}

.control-label {
  font-size: 14px;
  color: #64748b;
  align-self: center;
  margin-left: 5px;
}

.reason-textarea {
  flex: 1;
  min-height: 80px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  color: #1e293b;
  transition: all 0.3s ease;
  resize: vertical;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.reason-textarea:focus {
  outline: none;
  border-color: #0c534c;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

/* Presets de motivos */
.reason-presets {
  margin-top: 15px;
}

.presets-label {
  display: inline-block;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 10px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-button {
  background-color: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-button:hover {
  background-color: #e2e8f0;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

/* Tabla de empleados */
.employee-table-container {
  margin-bottom: 25px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.table-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  background: linear-gradient(to right, #f1f5f9, #ffffff);
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 15px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-title h3 {
  margin: 0;
  color: #1e293b;
  font-size: 18px;
  font-weight: 600;
}

.title-icon {
  font-size: 18px;
  color: #0c534c;
  background: rgba(59, 130, 246, 0.1);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.results-count {
  font-size: 14px;
  color: #64748b;
}

/* Botones de acción de tabla */
.select-all-button {
  background-color: #f8fafc;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-all-button:hover {
  background-color: #e2e8f0;
  color: #0c534c;
  border-color: #0c534c;
}

/* Tabla de datos */
.table-scroll {
  overflow-x: auto;
  max-height: 50vh;
  position: relative;
}

.employee-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: #ffffff;
}

.employee-table th {
  background-color: #1e40af;
  color: #ffffff;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 15px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 0.5px;
  border-bottom: 3px solid #1e3a8a;
}

.employee-table th:hover {
  background-color: #1d4ed8;
}

.employee-table td {
  padding: 14px 15px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
  font-size: 14px;
}

.sort-icon {
  margin-left: 5px;
  font-size: 12px;
  opacity: 0.7;
}

.employee-row {
  transition: all 0.2s ease;
}

.employee-row:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.employee-row.selected {
  background-color: rgba(16, 185, 129, 0.08);
  position: relative;
}

.employee-row.selected::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: #10b981;
}

/* Checkboxes personalizados */
.checkbox-column {
  width: 50px;
}

.checkbox-container {
  display: flex;
  justify-content: center;
}

.checkbox-icon {
  width: 22px;
  height: 22px;
  border: 2px solid #cbd5e1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #ffffff;
}

.checkbox-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
  border-color: #0c534c;
}

.checkbox-icon.checked {
  background-color: #0c534c;
  border-color: #0c534c;
}

.check-animation {
  animation: zoomIn 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55);
  color: #ffffff;
}

@keyframes zoomIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Estado vacío */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 46px;
  margin-bottom: 15px;
  opacity: 0.7;
}

.empty-message {
  text-align: center;
}

.empty-message p {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
}

/* Resumen de selección */
.selection-summary {
  position: sticky;
  bottom: 20px;
  background: #ffffff;
  border-radius: 12px;
  padding: 15px 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 auto 20px;
  max-width: calc(100% - 40px);
  border: 1px solid rgba(0, 0, 0, 0.03);
  z-index: 100;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.summary-count, .summary-total {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-icon, .total-icon {
  font-size: 18px;
  color: #0c534c;
  background: rgba(59, 130, 246, 0.1);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-text, .total-hours {
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.clear-selection {
  background-color: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-selection:hover {
  background-color: #fee2e2;
  color: #ef4444;
  border-color: #ef4444;
}

/* Botón de acción principal */
.action-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.action-button {
  background: linear-gradient(135deg, #0c534c, #1d4ed8);
  color: #ffffff;
  padding: 14px 28px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%);
}

.action-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, #2563eb, #1e40af);
}

.action-button:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.action-button:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  cursor: not-allowed;
  opacity: 0.7;
}

.button-icon {
  font-size: 18px;
}

/* Notificación */
.notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 0;
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  min-width: 300px;
  max-width: 400px;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  flex: 1;
}

.notification.success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.notification.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.notification-icon {
  font-size: 20px;
}

.close-notification {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: #ffffff;
  width: 50px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-notification:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2100;
  backdrop-filter: blur(5px);
}

.modal-card {
  background-color: #ffffff;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: zoomIn 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.modal-header {
  padding: 20px;
  background-color: #1e40af;
  color: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ffffff;
  transition: all 0.2s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.modal-close:hover {
  transform: rotate(90deg);
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 30px;
  text-align: center;
}

.modal-icon {
  font-size: 46px;
  margin-bottom: 20px;
  color: #0c534c;
  display: inline-block;
  animation: bounce 1s infinite alternate;
  background: rgba(59, 130, 246, 0.1);
  width: 90px;
  height: 90px;
  line-height: 90px;
  border-radius: 50%;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  gap: 15px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.cancel-button, .confirm-button {
  padding: 12px 25px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.cancel-button {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.cancel-button:hover {
  background-color: #e2e8f0;
  color: #334155;
}

.confirm-button {
  background-color: #10b981;
  color: #ffffff;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
}

.confirm-button:hover {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.3);
}

/* Animaciones de transición */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from, .slide-fade-leave-to {
  transform: translateX(50px);
  opacity: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Diseño responsivo */
@media (max-width: 768px) {
  div[class="overtime-container"] {
    padding: 15px;
  }
  
  .overtime-header {
    padding: 20px;
  }
  
  .pulse-title {
    font-size: 24px;
  }
  
  .stat-card {
    min-width: calc(50% - 20px);
    padding: 15px;
  }
  
  .config-row {
    flex-direction: column;
  }
  
  .hours-control, .reason-control {
    width: 100%;
  }
  
  .table-header-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .table-actions {
    width: 100%;
    justify-content: space-between;
    margin-top: 10px;
  }
  
  .selection-summary {
    flex-direction: column;
    gap: 15px;
  }
  
  .summary-controls {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  
  .modal-card {
    width: 95%;
  }
}

@media (max-width: 480px) {
  .stat-card {
    min-width: 100%;
  }
  
  .date-control {
    flex-direction: column;
    align-items: flex-start;
    padding: 12px;
  }
  
  .date-label {
    margin-bottom: 8px;
    margin-right: 0;
  }
  
  .notification {
    min-width: auto;
    width: calc(100% - 30px);
    left: 15px;
    right: 15px;
    bottom: 15px;
  }
  
  .preset-buttons {
    justify-content: center;
  }
}

</style>