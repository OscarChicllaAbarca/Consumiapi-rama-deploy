<template>
<div class="wrapper">
    <!-- Sidebar / Navbar para dispositivos móviles -->
    <nav class="sidebar" :class="{'sidebar-active': sidebarOpen, 'sidebar-mobile': isMobile}">
        <div class="sidebar-header">
            <div class="user-info">
                <div class="avatar">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="user-role">
                    <p>ROL: {{ rolDisplayName }}</p>
                </div>
                <div v-if="hasAdminRole">
                    <div class="user-role">
                        <div class="center-display">
                            <!-- Mostrar sucursal actual con animación de entrada -->
                            <transition name="fade">
                                <div v-if="sucursalActual && !mostrarSelector" class="sucursal-actual">
                                    <span>Sucursal:</span>
                                    <strong>{{ obtenerNombreSucursal(sucursalActual) }}</strong>
                                    <button @click="mostrarSelector = true" class="btn-compact">
                                        <span>Cambiar</span>
                                    </button>
                                </div>
                            </transition>

                            <!-- Selector de sucursal con animación -->
                            <transition name="fade">
                                <div v-if="!sucursalActual || mostrarSelector" class="change-center">
                                    <select v-model="nuevaSucursal" class="select-compact" :class="{ 'select-active': nuevaSucursal }">
                                        <option value="">Seleccionar centro</option>
                                        <option value="C152">Victoria</option>
                                        <option value="C040">Arequipa</option>
                                        <option value="C080">Cuzco</option>
                                        <option value="C200">Piura</option>
                                        <option value="C154">Lurin</option>
                                    </select>
                                    <button @click="cambiarSucursal" class="btn-compact" :class="{ 'cargando': cargando }" :disabled="cargando || !nuevaSucursal">
                                        {{ cargando ? 'Actualizando...' : 'Confirmar' }}
                                    </button>
                                    <button v-if="mostrarSelector" @click="cancelarSeleccion" class="btn-compact btn-cancelar">
                                        Cancelar
                                    </button>
                                </div>
                            </transition>

                            <!-- Mensaje de estado -->
                            <transition name="fade">
                                <div v-if="mensaje" :class="['msg', `msg-${tipoMensaje}`]">
                                    {{ mensaje }}
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>

            </div>
            <button v-if="isMobile" class="close-sidebar" @click="toggleSidebar">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <!-- Navbar en móvil -->
        <div class="navbar-mobile" v-if="isMobile">
            <ul class="navbar-list">
                <li>
                    <router-link to="/listar_toma" class="nav-link">
                        <i class="fas fa-list-alt"></i>
                        <span>Lista</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/tomaino" class="nav-link">
                        <i class="fas fa-check-square"></i>
                        <span>Toma</span>
                    </router-link>
                </li>
                <li>
                    <router-link to="/ListarInvent" class="nav-link">
                        <i class="fas fa-clipboard-list"></i>
                        <span>Invent.</span>
                    </router-link>
                </li>
                <li>
                    <button class="btn-logout" @click="logout">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Salir</span>
                    </button>
                </li>
            </ul>
        </div>

        <!-- Sidebar para pantallas grandes -->
        <div class="sidebar-menu">
            <!--------------------------------------------------------------------- Primer menú desplegable -->

            <template v-if="hasAdminRole || hasSuperRole || hasUserRole">
                <button class="dropdown-header" @click="toggleMenu('tomaSubmenu')" :class="{ 'active': isExpanded['tomaSubmenu'] }">
                    <div class="menu-title">
                        <i class="fas fa-tasks"></i>
                        <span>Detalle de Inventario</span>
                    </div>
                    <i class="fas" :class="isExpanded['tomaSubmenu'] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>

                <!-- Contenido del primer menú -->
                <transition name="slide">
                    <ul v-if="isExpanded['tomaSubmenu']" class="dropdown-content">
                        <li>
                            <router-link to="/listar_toma" class="dropdown-item">
                                <i class="fas fa-list-alt"></i> Lista toma
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/tomaino" class="dropdown-item">
                                <i class="fas fa-check-square"></i> Toma Ino
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/ListarInvent" class="dropdown-item">
                                <i class="fas fa-clipboard-list"></i> Lista de Inventario
                            </router-link>
                        </li>

                        <!-- Estas rutas solo para ADMIN o SUPERVISOR -->
                        <template v-if="hasAdminRole">
                            <li>
                                <router-link to="/Toma" class="dropdown-item">
                                    <i class="fas fa-upload"></i> Carga toma
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/InsertInventariado" class="dropdown-item">
                                    <i class="fas fa-users-cog"></i> Carga Inventario
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/Aprobar" class="dropdown-item">
                                    <i class="fas fa-box"></i> Aprobacion de Inventarios
                                </router-link>
                            </li>
                        </template>

                        <template v-if="hasAdminRole || hasSuperRole">
                            <li>
                                <router-link to="/ComPrecio" class="dropdown-item">
                                    <i class="fas fa-cogs"></i> Comparativo de Precio
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/getObservaciones" class="dropdown-item">
                                    <i class="fas fa-exclamation-circle"></i> Estado de diferencias
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/powerBI" class="dropdown-item">
                                    <i class="fas fa-chart-bar"></i> Reporte Completo
                                </router-link>
                            </li>
                            <li>
                                <router-link to="/ComProducto" class="dropdown-item">
                                    <i class="fas fa-box"></i> Comparativo de Productos
                                </router-link>
                            </li>

                        </template>

                    </ul>
                </transition>
            </template>

            <!--------------------------------------------------------------------- Segundo botón del menú desplegable -->
            <button class="dropdown-header" @click="toggleMenu('otroSubmenu')" :class="{ 'active': isExpanded['otroSubmenu'] }">
                <div class="menu-title">
                    <i class="fa-regular fa-calendar-days"></i>
                    <span>Procesos Logísticos</span>
                </div>
                <i class="fas" :class="isExpanded['otroSubmenu'] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>

            <transition name="slide">
                <ul v-if="isExpanded['otroSubmenu']" class="dropdown-content">
                    <li v-for="(doc, index) in logisticDocuments" :key="index">
                        <router-link :to="doc.url" class="dropdown-item">
                            <i :class="doc.icon"></i> {{ doc.title }}
                        </router-link>
                    </li>
                </ul>
            </transition>

            <template v-if="hasAdminRole || hasSuperRole || hasSuper2Role">
                <!-- ------------------------------------------------------------------Tercer botón del menú desplegable -->
                <button class="dropdown-header" @click="toggleMenu('otroSubmenu3')" :class="{ 'active': isExpanded['otroSubmenu3'] }">
                    <div class="menu-title">
                        <i class="fa-solid fa-layer-group"></i>
                        <span>Personal Almacén</span>
                    </div>
                    <i class="fas" :class="isExpanded['otroSubmenu3'] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>

                <!-- Contenido del Tercer menú -->
                <transition name="slide">
                    <ul v-if="isExpanded['otroSubmenu3']" class="dropdown-content">

                        <li v-if="hasAdminRole">
                            <router-link to="/User" class="dropdown-item">
                                <i class="fas fa-id-card"></i> Datos personales de Almacén
                            </router-link>
                        </li>

                        <router-link to="/Asistencia" class="dropdown-item">
                            <i class="fas fa-toolbox"></i> Asistencia
                        </router-link>

                        <li v-if="hasAdminRole">
                            <router-link to="/Asistencia" class="dropdown-item">
                                <i class="fas fa-toolbox"></i> Asistencia Almacen
                            </router-link>
                        </li>

                    </ul>
                </transition>
            </template>

            <template v-if="hasAdminRole">
                <!-- ------------------------------------------------------------------Cuarto botón del menú desplegable -->
                <button class="dropdown-header" @click="toggleMenu('otroSubmenu4')" :class="{ 'active': isExpanded['otroSubmenu4'] }">
                    <div class="menu-title">
                        <i class="fa-regular fa-user"></i>
                        <span>Relación de Precios</span>
                    </div>
                    <i class="fas" :class="isExpanded['otroSubmenu4'] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>

                <!-- Contenido del Cuarto menú -->
                <transition name="slide">
                    <ul v-if="isExpanded['otroSubmenu4']" class="dropdown-content">
                        <li>
                            <router-link to="/Precio" class="dropdown-item">
                                <i class="fas fa-tag"></i> Precios
                            </router-link>
                        </li>
                    </ul>
                </transition>
            </template>

            <template v-if="hasZonal">
                <!--------------------------------------------------------------------- Quinto Reporte-->
                <button class="dropdown-header" @click="toggleMenu('otroSubmenu5')" :class="{ 'active': isExpanded['otroSubmenu5'] }">
                    <div class="menu-title">
                        <i class="fas fa-chart-line"></i>
                        <span>Aprobacion</span>
                    </div>
                    <i class="fas" :class="isExpanded['otroSubmenu5'] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                </button>

                <transition name="slide">
                    <ul v-if="isExpanded['otroSubmenu5']" class="dropdown-content">
                        <li>
                            <router-link to="/ComPrecio" class="dropdown-item">
                                <i class="fas fa-cogs"></i> Comparativo de Precio
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/Aprobar" class="dropdown-item">
                                <i class="fas fa-box"></i> Aprobacion de Inventarios
                            </router-link>
                        </li>

                    </ul>
                </transition>
            </template>

            <button class="logout-button" @click="logout">
                <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>
        </div>
    </nav>

    <!-- Botón para abrir sidebar en móvil -->
    <button v-if="isMobile" class="toggle-sidebar-btn" @click="toggleSidebar">
        <i class="fas fa-bars"></i>
    </button>

    <!-- Page Content -->
    <div class="content-wrapper" :class="{'content-full': isMobile, 'content-sidebar': !isMobile && !sidebarOpen}">
        <div class="container-fluid mt-3">
            <router-view />
        </div>
    </div>
</div>
</template>

<script>
import {
    useRouter
} from "vue-router";
import axios from "axios";
import {
    mapState
} from 'vuex';
import config from "@/config";
import {
    show_alerta
} from '@/funciones.js'; // Nota: @/ apunta a la carpeta src/

export default {
    data() {
        return {
            nuevaSucursal: '',
            cargando: false,
            sucursalActual: '',
            mostrarSelector: false,
            mensaje: '',
            tipoMensaje: 'success',
            mensajeExito: false,
            isExpanded: {
                tomaSubmenu: true,
                otroSubmenu: false,
                otroSubmenu3: false,
                otroSubmenu4: false,
                otroSubmenu5: false
            },
            sidebarOpen: false,
            isMobile: false,
            logisticDocuments: [{
                    title: "Procedimiento de orden",
                    url: "/document-viewer?url=https://drive.google.com/file/d/1YvIgMAF5n-Ju2jQoAEUnbdshdvb9m1rb/preview",
                    icon: "fas fa-list-alt"
                },
                {
                    title: "Picking y Embalaje",
                    url: "/document-viewer?url=https://drive.google.com/file/d/14QYG2nnjf28O06u8OVDtwij4zK9wJNbd/preview",
                    icon: "fas fa-box"
                },
                {
                    title: "Devolución de mercadería",
                    url: "/document-viewer?url=https://drive.google.com/file/d/1KGM0Nxizz0S-mlHx7nntSkn2Mp1WzAxX/preview",
                    icon: "fas fa-undo"
                },
                {
                    title: "Toma de Inventario",
                    url: "/document-viewer?url=https://drive.google.com/file/d/1tqzAxKQQ4udqejZ3fqiaFL1Ubgsa_l9I/preview",
                    icon: "fas fa-clipboard-check"
                },
                {
                    title: "Trasp. materiales Almacén",
                    url: "/document-viewer?url=https://drive.google.com/file/d/1AdcwTlIUdocm5Sh2Pv5e-UeUQZycGXI_/preview",
                    icon: "fas fa-exchange-alt"
                },
                {
                    title: "Contenedores de proyecto",
                    url: "/document-viewer?url=https://docs.google.com/document/d/1VsIXBNF59HGtRwKsiOiDNzNkqu0lP86E/preview",
                    icon: "fas fa-cubes"
                },
                {
                    title: "Ingreso de mercadería",
                    url: "/document-viewer?url=https://docs.google.com/document/d/1OEP70zlrhZvOhjcoxEJ_s00w5UmL-5ip/preview",
                    icon: "fas fa-dolly"
                },
                {
                    title: "Atender necesidades",
                    url: "/document-viewer?url=https://docs.google.com/document/d/1jBIzaF5o6FhQxDkJfJ2XKWRIhQxoWiRb/preview",
                    icon: "fas fa-tasks"
                },
                {
                    title: "Manual de guía electrónica",
                    url: "/document-viewer?url=https://docs.google.com/document/d/1La_Lrn-x2XSG7Papj7U6gE_trdy_vFx3/preview",
                    icon: "fas fa-file-alt"
                },
                {
                    title: "Manual de movimiento de ubicaciones",
                    url: "/document-viewer?url=https://docs.google.com/document/d/1Y50QEIGOt646khg7iiN2V5E5DMGFJj-c/preview",
                    icon: "fas fa-map-marker-alt"
                },
                {
                    title: "Política de Seg. y control de Almacén",
                    url: "/document-viewer?url=https://drive.google.com/file/d/1FoeaTfoHqATlpQf6Fj22gQLzR0wsTSXC/preview",
                    icon: "fas fa-shield-alt"
                },
                {
                    title: "Proc. de Ajuste de Inventario",
                    url: "/document-viewer?url=https://drive.google.com/file/d/1QKLNQuVzOdQpPTEA93IH0uJoghFpooTs/preview",
                    icon: "fas fa-balance-scale"
                },
                {
                    title: "Proc. de Regularización de mercadería",
                    url: "/document-viewer?url=https://docs.google.com/file/d/14I488PVEO031lT-vh2r9f7boF9lTGgQV/preview",
                    icon: "fas fa-folder-open"
                }
            ]
        };
    },
    props: {
        hasAdminRole: {
            type: Boolean,
            default: false
        },
        rolDisplayName: {
            type: String,
            default: ''
        }
    },
    computed: {
        ...mapState(['rol']),

        rolDisplayName() {
            if (Array.isArray(this.rol)) {
                return this.rol.join(', ').replace('ROLE_', '');
            }

        },
        hasAdminRole() {
            if (Array.isArray(this.rol)) {
                return this.rol.includes('ROLE_ADMIN');
            }
            return this.rol === 'ROLE_ADMIN';
        },

        hasSuperRole() {
            if (Array.isArray(this.rol)) {
                return this.rol.includes('ROLE_SUPER');
            }
            return this.rol === 'ROLE_SUPER';
        },
        hasZonal() {
            if (Array.isArray(this.rol)) {
                return this.rol.includes('ROLE_ZONAL');
            }
            return this.rol === 'ROLE_ZONAL';
        },
        hasUserRole() {
            if (Array.isArray(this.rol)) {
                return this.rol.includes('ROLE_USER');
            }
            return this.rol === 'ROLE_USER';
        },

        hasClientRole() {
            if (Array.isArray(this.rol)) {
                return this.rol.includes('ROLE_CLIENT');
            }
            return this.rol === 'ROLE_CLIENT';
        }

    },
    created() {
        this.checkMobile();
        window.addEventListener('resize', this.checkMobile);
    },
    unmounted() {
        window.removeEventListener('resize', this.checkMobile);
    },
    mounted() {
       
    },
    methods: {
        obtenerNombreSucursal(codigo) {
            const sucursales = {
                'C152': 'Victoria',
                'C040': 'Arequipa',
                'C080': 'Cuzco',
                'C200': 'Piura',
                'C154': 'Lurin'
            };

            return sucursales[codigo] || codigo;
        },
        
        async cambiarSucursal() {
            if (!this.nuevaSucursal) {
                return;
            }

            this.cargando = true;
            this.mensaje = '';

            try {
                const response = await fetch(`${config.BASE_URL}/api/user/sucursal`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        sucursal: this.nuevaSucursal
                    })
                });

                const resultado = await response.text();
                console.log('Respuesta del servidor:', response.status, resultado);

                if (response.ok) {

                    this.sucursalActual = this.nuevaSucursal;
                    this.mostrarSelector = false;

                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {

                }
            } catch (error) {
                console.error('Error completo:', error);

            } finally {
                this.cargando = false;
            }
        },
        cancelarSeleccion() {
            this.mostrarSelector = false;
            this.nuevaSucursal = '';
            this.mensaje = '';
        },
        toggleSidebar() {
            this.sidebarOpen = !this.sidebarOpen;
        },
        toggleMenu(menuKey) {

            this.isExpanded[menuKey] = !this.isExpanded[menuKey];

            if (this.isExpanded[menuKey]) {
                for (const key in this.isExpanded) {
                    if (key !== menuKey) {
                        this.isExpanded[key] = false;
                    }
                }
            }
        },
        async logout() {
            try {
                await axios.post(`${config.BASE_URL}/login/logout`, {}, {
                    withCredentials: true
                });

                // Limpieza de sesión
                localStorage.clear();
                sessionStorage.clear();
                document.cookie.split(";").forEach(cookie => {
                    document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });

                // Redirige al usuario al login después del logout
                this.$router.push("/");
            } catch (error) {
                console.error("Error en el logout:", error);
            }
        },
        checkMobile() {
            this.isMobile = window.innerWidth <= 800;
            if (!this.isMobile) {
                this.sidebarOpen = false;
            }
        }
    }
}
</script>

<style scoped>
/* Variables para personalización sencilla */
:root {
    --primary-color: #0c534c;
    --primary-hover: #18584c;
    --secondary-color: #2c3e50;
    --text-color: #ecf0f1;
    --danger-color: #e74c3c;
    --shadow-color: rgba(0, 0, 0, 0.2);
    --transition-speed: 0.3s;
}

/* Estilos generales */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.wrapper {
    display: flex;
    min-height: 100vh;
    position: relative;
}

/* Cabecera del Sidebar */
.sidebar-header {
    padding: 20px 15px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

.avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
}

.avatar i {
    font-size: 30px;
    color: white;
}

.user-role {
    font-size: 14px;
    font-weight: bold;
    color: white;
}

.close-sidebar {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
}

/* Estilo del sidebar */
.sidebar {
    width: 280px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    background: linear-gradient(to bottom, #0c534c, #0e4740);
    color: white;
    overflow-y: auto;
    transition: transform var(--transition-speed) ease, width var(--transition-speed) ease;
    z-index: 1000;
    box-shadow: 3px 0 10px var(--shadow-color);
}

.sidebar::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Estilo para cuando el sidebar está cerrado */
.sidebar-active {
    transform: translateX(-280px);
}

/* Estilo del sidebar en dispositivos móviles */
.sidebar-mobile {
    transform: translateX(-100%);
    width: 100%;
    max-width: 320px;
}

.sidebar-mobile.sidebar-active {
    transform: translateX(0);
}

/* Botón para desplegar el sidebar en móvil */
.toggle-sidebar-btn {
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 999;
    background-color: var(--primary-color);
    color: rgb(4, 126, 79);
    border: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
    font-size: 20px;
    transition: background-color 0.2s ease;
}

.toggle-sidebar-btn:hover {
    background-color: var(--primary-hover);
}

/* Menú sidebar */
.sidebar-menu {
    padding: 15px 10px;
}

/* Botones de menú */
.dropdown-header {
    width: 100%;
    padding: 12px 15px;
    background-color: var(--primary-color);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background-color 0.2s ease, transform 0.2s ease;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.dropdown-header:hover {
    background-color: var(--primary-hover);
    transform: translateY(-2px);
}

.dropdown-header.active {
    background-color: var(--primary-hover);
}

.menu-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.menu-title i {
    width: 20px;
    text-align: center;
}

/* Contenido de menús desplegables */
.dropdown-content {
    padding: 5px 0;
    margin-bottom: 15px;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    overflow: hidden;
}

.dropdown-item {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    color: var(--text-color);
    text-decoration: none;
    transition: background-color 0.2s ease, padding-left 0.2s ease;
    font-size: 14px;
    border-radius: 5px;
    margin: 2px 5px;
}

.dropdown-item i {
    width: 20px;
    margin-right: 10px;
    text-align: center;
}

.dropdown-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
    padding-left: 20px;
}

/* Animaciones de transición para los menús */
.slide-enter-active,
.slide-leave-active {
    transition: max-height 0.3s ease, opacity 0.3s ease;
    max-height: 1000px;
    opacity: 1;
    overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
    max-height: 0;
    opacity: 0;
}

/* Botón de cierre de sesión */
.logout-button {
    width: 100%;
    padding: 12px 15px;
    background-color: rgba(231, 76, 60, 0.8);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.logout-button:hover {
    background-color: #c0392b;
}

/* Navbar para móviles */
.navbar-mobile {
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: var(--primary-color);
    padding: 10px 0;

    z-index: 990;
}

.navbar-list {
    display: flex;
    justify-content: space-around;
    list-style: none;
    padding: 0;
    margin: 0;
}

.nav-link,
.btn-logout {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    text-decoration: none;
    font-size: 12px;
    padding: 8px;
    border-radius: 5px;
    transition: background-color 0.2s ease;
    background: none;
    border: none;
    cursor: pointer;
}

.nav-link i,
.btn-logout i {
    font-size: 24px;
    margin-bottom: 5px;
}

.nav-link:hover,
.btn-logout:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

/* Contenido principal */
.content-wrapper {
    flex: 1;
    margin-left: 280px;
    padding: 20px;
    transition: margin-left var(--transition-speed) ease;
}

.content-full {
    margin-left: 0;
    width: 100%;
}

.content-sidebar {
    margin-left: 280px;
}

/* Estilos responsivos */
@media (max-width: 800px) {
    .content-wrapper {
        margin-left: 0;
        padding-bottom: 70px;
    }

    .sidebar {
        width: 100%;
        max-width: 320px;
        left: -100%;
        z-index: 1001;
    }

    .sidebar-active {
        left: 0;
        transform: translateX(0);
    }
}

@media (min-width: 801px) {
    .toggle-sidebar-btn {
        display: none;
    }
}

/* estulo de cambio de sucursal */
.center-display {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 14px;
}

.change-center {
    display: flex;
    align-items: center;
    gap: 8px;
}

.select-compact {
    padding: 4px 8px;
    border: 2px solid #0c534c;
    border-radius: 4px;
    font-size: 13px;
    height: 30px;
    background-color: #0c534c;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.select-compact:hover {
    border-color: #18584c;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.select-compact:focus {
    border-color: #18584c;
    box-shadow: 0 0 0 3px rgba(12, 83, 76, 0.2);
}

.btn-compact {
    padding: 4px 12px;
    background-color: #296d60;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    height: 30px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-compact:hover {
    background-color: #296d60;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
}

.btn-compact:active {
    transform: translateY(0);
}

.sucursal-actual {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    padding: 6px 12px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    font-size: 13px;
}

.btn-compact.btn-cancelar {
    background-color: #dc3545;
}

.btn-compact.btn-cancelar:hover {
    background-color: #c82333;
}

.btn-compact:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
    opacity: 0.7;
}
</style>
