// LoginView.vue
<template>
<div class="container">
    <div class="bg-slideshow">
        <!-- Dynamic background images will be rendered via JS -->
    </div>
    <div class="forms-container">
        <div class="form-control signin-form">
            <form @submit.prevent="login">
                <div>
                    <h1>Login</h1>
                    <div class="input-group">
                        <i class="fas fa-user"></i>
                        <input v-model="username" placeholder="Username" required />
                    </div>
                    <div class="input-group">
                        <i class="fas fa-lock"></i>
                        <input v-model="password" type="password" placeholder="Password" required />
                    </div>
                    <button type="submit" class="login-btn" :disabled="isLoading">
                        <i class="fas fa-sign-in-alt" v-if="!isLoading"></i>
                        <i class="fas fa-spinner fa-spin" v-else></i>
                        {{ isLoading ? "Cargando..." : "Login" }}
                    </button>
                </div>
            </form>
            <p v-if="error" class="error-message">{{ error }}</p>

            <!-- Nuevo: Enlace a la página de recuperación
            <div class="recovery-link-container">
                <p>¿Problemas para iniciar sesión?</p>
                <router-link to="/recover" class="recovery-link">
                    <i class="fas fa-tools"></i> Recuperar acceso
                </router-link>
            </div> -->

        </div>
    </div>
    <div class="intros-container">
        <div class="intro-control signin-intro">
            <div class="intro-control__inner">
                <img class="imagen" src="../assets/Cgm.png" alt="Logocgm" loading="lazy" />
                <div class="tagline">
                    <h3>Gestión de Distribución e Inventario</h3>
                    <p>Sistema optimizado para gestionar sus operaciones logísticas</p>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

    
    
<script>
import {
    useRouter
} from "vue-router";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import {
    mapState
} from 'vuex';

export default {
    data() {
        return {
            username: "",
            password: "",
            error: "",
            isLoading: false,
            backgroundImages: [{
                    url: 'warehouse.svg',
                    description: 'Almacén Moderno'
                },
                {
                    url: 'inventory.svg',
                    description: 'Control de Inventario'
                },
                {
                    url: 'shipping.svg',
                    description: 'Logística y Distribución'
                },
                {
                    url: 'supply-chain.svg',
                    description: 'Cadena de Suministro'
                }
            ],
            currentBgIndex: 0,
            bgInterval: null
        };
    },

    computed: {
        ...mapState(['rol']),
    },

    mounted() {
        // Initialize the background slideshow
        this.initBackgroundAnimation();

        // Preload SVG backgrounds for better performance
        this.preloadBackgrounds();
    },

    beforeUnmount() {
        // Clear the interval when component is destroyed
        if (this.bgInterval) {
            clearInterval(this.bgInterval);
        }
    },

    methods: {
        initBackgroundAnimation() {
            // Create SVG elements for backgrounds
            const bgContainer = document.querySelector('.bg-slideshow');

            // Use lightweight SVG animations instead of heavy images
            this.backgroundImages.forEach((bg, index) => {
                const svgElement = this.createBackgroundSVG(index);
                bgContainer.appendChild(svgElement);
            });

            // Start the animation cycle
            this.bgInterval = setInterval(() => {
                this.cycleBackgrounds();
            }, 5000); // Change background every 5 seconds
        },

        createBackgroundSVG(index) {
            // Create a div to hold the SVG background
            const bgDiv = document.createElement('div');
            bgDiv.className = `bg-item ${index === 0 ? 'active' : ''}`;
            bgDiv.setAttribute('data-index', index);

            // We'll use simple SVG patterns that are lightweight
            // These will be embedded in the CSS for better performance

            return bgDiv;
        },

        cycleBackgrounds() {
            const bgItems = document.querySelectorAll('.bg-item');

            // Hide current background
            bgItems[this.currentBgIndex].classList.remove('active');

            // Move to next background
            this.currentBgIndex = (this.currentBgIndex + 1) % this.backgroundImages.length;

            // Show new background
            bgItems[this.currentBgIndex].classList.add('active');
        },

        preloadBackgrounds() {
            // SVGs are lightweight and defined in CSS, so no need for heavy preloading
            // This is just a placeholder for the preloading concept
        },

        async login() {
            if (!this.username || !this.password) {
                Swal.fire({
                    icon: "warning",
                    title: "Campos vacíos",
                    text: "Por favor, ingresa tu nombre de usuario y contraseña.",
                });
                return;
            }

            this.isLoading = true; // Activar estado de carga
            this.error = ""; // Limpiar mensajes de error anteriores

            try {
                const response = await axios.post(
                    `${config.BASE_URL}/login`, {
                        username: this.username,
                        password: this.password,
                    }, {
                        headers: {
                            "Content-Type": "application/json",
                        },
                        withCredentials: true, // Para enviar cookies
                    }
                );

                const data = response.data;

                // Verificar el rol del usuario
                if (data.rol && data.rol.includes('ROLE_USER')) {
                    // Si el rol es ROLE_USER, redirigir a UserDashboard
                    this.$router.push({
                        name: "UserDashboard"
                    });
                } else {
                    // Si el rol no es ROLE_USER, puedes redirigir a otro lugar
                    this.$router.push({
                        name: "tomaino"
                    }); // O la vista que corresponda
                }

            } catch (error) {
                console.error("Error:", error);

                // Manejo de errores específicos con SweetAlert2
                if (error.response) {
                    if (error.response.status === 401) {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Credenciales incorrectas. Inténtalo de nuevo.",
                        });
                    } else {
                        Swal.fire({
                            icon: "error",
                            title: "Error",
                            text: "Ocurrió un error inesperado. Inténtalo de nuevo más tarde.",
                        });
                    }
                } else if (error.request) {
                    Swal.fire({
                        icon: "error",
                        title: "Error de conexión",
                        text: "No se recibió respuesta del servidor. Verifica tu conexión a internet.",
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Ocurrió un error inesperado. Inténtalo de nuevo.",
                    });
                }
            } finally {
                this.isLoading = false; // Desactivar estado de carga
            }
        },
    },
};
</script>
    
    
<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap");
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css");

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: "Poppins", sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f5f5;
    font-size: 14px;
}

/* Responsive Container */
.container {
    position: relative;
    display: flex;
    background-color: #fff;
    width: 90%;
    max-width: 800px;
    min-height: 500px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin: 20px auto;
}

/* Background Animation */
.bg-slideshow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    overflow: hidden;
}

.bg-item {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 1s ease-in-out;
    background-size: cover;
    background-position: center;
}

.bg-item.active {
    opacity: 0.1;
}

/* SVG backgrounds defined in CSS for better performance */
.bg-item[data-index="0"] {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%23059669' fill-opacity='0.2'%3E%3Crect x='0' y='0' width='20' height='20'/%3E%3Crect x='40' y='40' width='20' height='20'/%3E%3Crect x='80' y='0' width='20' height='20'/%3E%3Crect x='0' y='80' width='20' height='20'/%3E%3Crect x='80' y='80' width='20' height='20'/%3E%3C/g%3E%3C/svg%3E");
}

.bg-item[data-index="1"] {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%230c534c' fill-opacity='0.2'%3E%3Cpath d='M20 20h20v20H20zM50 50h20v20H50z'/%3E%3Ccircle cx='20' cy='80' r='10'/%3E%3Ccircle cx='80' cy='20' r='10'/%3E%3C/g%3E%3C/svg%3E");
}

.bg-item[data-index="2"] {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%23059669' fill-opacity='0.2'%3E%3Cpath d='M0 50 L50 0 L100 50 L50 100 Z'/%3E%3C/g%3E%3C/svg%3E");
}

.bg-item[data-index="3"] {
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%230c534c' fill-opacity='0.2'%3E%3Cpath d='M10 10L90 10M10 30L90 30M10 50L90 50M10 70L90 70M10 90L90 90'/%3E%3C/g%3E%3C/svg%3E");
}

/* Enhanced Form Layout */
.forms-container {
    position: relative;
    width: 50%;
    text-align: center;
    z-index: 1;
}

.form-control {
    display: flex;
    justify-content: center;
    flex-direction: column;
    height: 100%;
    padding: 20px;
}

.form-control h1 {
    font-size: 2rem;
    color: #0c534c;
    margin-bottom: 20px;
}

.input-group {
    position: relative;
    margin-bottom: 15px;
}

.input-group i {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #0c534c;
}

.form-control form input {
    width: 100%;
    border: none;
    padding: 15px 15px 15px 45px;
    background-color: #f5f5f5;
    border-radius: 5px;
    font-size: 14px;
    transition: all 0.3s ease;
}

.form-control form input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(12, 83, 76, 0.2);
}

/* Enhanced Login Button */
.login-btn {
    width: 100%;
    background: linear-gradient(135deg, #0c534c, #059669);
    color: white;
    padding: 12px 20px;
    font-size: 16px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
}

.login-btn:hover {
    background: linear-gradient(135deg, #059669, #0c534c);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(5, 150, 105, 0.3);
}

.login-btn:active {
    transform: scale(0.98);
}

.login-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
}

.login-btn i {
    font-size: 16px;
}

/* Error Message */
.error-message {
    color: #e53e3e;
    margin-top: 15px;
    font-size: 14px;
}

/* Right Side - Intro */
.intros-container {
    position: relative;
    width: 50%;
    text-align: center;
}

.intro-control {
    display: flex;
    justify-content: center;
    flex-direction: column;
    height: 100%;
    color: #fff;
    background: linear-gradient(135deg, #0c534c, #059669);
    padding: 20px;
}

.intro-control__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.imagen {
    width: 180px;
    height: auto;
    margin-bottom: 20px;
    border-radius: 5px;
}

.tagline {
    margin-top: 20px;
}

.tagline h3 {
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.tagline p {
    opacity: 0.9;
    font-size: 1rem;
}

/* Animation */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.form-control form {
    animation: fadeIn 0.5s ease-out;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
    .container {
        flex-direction: column-reverse;
        width: 95%;
        max-width: 450px;
    }

    .forms-container,
    .intros-container {
        width: 100%;
    }

    .intros-container {
        min-height: 200px;
    }

    .intro-control {
        padding: 10px;
    }

    .imagen {
        width: 150px;
        margin-bottom: 10px;
    }

    .tagline h3 {
        font-size: 1.2rem;
    }

    .tagline p {
        font-size: 0.9rem;
    }
}

@media screen and (max-width: 480px) {
    .container {
        min-height: auto;
        margin: 10px auto;
        width: 100%;
    }

    .form-control h1 {
        font-size: 1.5rem;
    }

    .form-control form input {
        padding: 12px 12px 12px 40px;
    }

    .login-btn {
        padding: 10px;
    }

    .intros-container {
        min-height: 180px;
    }

    .imagen {
        width: 120px;
    }
}

/* Mobile Optimization */
@media screen and (max-width: 375px) {
    .container {
        box-shadow: none;
        border-radius: 0;
    }

    .form-control {
        padding: 15px;
    }

    .form-control h1 {
        font-size: 1.3rem;
    }

    .intros-container {
        min-height: 150px;
    }
}

/* Preload Animation */
.swal2-timer-progress-bar {
    background-color: #059669;
}

/* Nuevos estilos para el enlace de recuperación */
.recovery-link-container {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.recovery-link-container p {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.recovery-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0c534c;
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.recovery-link:hover {
  background-color: rgba(12, 83, 76, 0.1);
  text-decoration: underline;
}

.recovery-link i {
  font-size: 14px;
}
</style>
