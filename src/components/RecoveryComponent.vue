<template>
<div class="recover-container">
    <div class="recover-card">
        <img src="../assets/Cgm.png" alt="Logo" class="recover-logo" />

        <h1>Recuperación de Acceso</h1>

        <div class="status-section">
            <p>Estado del servidor:
                <span :class="serverStatus ? 'status-online' : 'status-offline'">
                    {{ serverStatus ? 'En línea' : 'Verificando...' }}
                </span>
            </p>
            <p v-if="serverVersion">Versión: {{ serverVersion }}</p>
        </div>

        <div class="message-box" v-if="message">
            <p>{{ message }}</p>
        </div>

        <div class="actions">
            <button @click="clearCookies" class="btn-primary" :disabled="isLoading">
                <i class="fas fa-broom" v-if="!isLoading"></i>
                <i class="fas fa-spinner fa-spin" v-else></i>
                {{ isLoading ? 'Limpiando...' : 'Limpiar datos de sesión' }}
            </button>

            <button @click="goToLogin" class="btn-secondary" :disabled="isLoading">
                <i class="fas fa-sign-in-alt"></i> Ir al login
            </button>
        </div>

        <div class="info-box">
            <h3>¿Por qué necesito esto?</h3>
            <p>Si has tenido problemas para iniciar sesión después de una actualización del sistema,
                utiliza esta herramienta para limpiar datos de sesión antiguos y resolver el problema.</p>
        </div>
        <template v-if="isAndroid11to14">
            <template v-if="/Android 11/.test(userAgent)">
                <h3 class="mt-3">Instrucciones para Android 11</h3>
                <p>Hemos detectado que estás usando Android 11. Si tienes problemas para acceder, sigue estos pasos:</p>
                <ol class="android-instructions">
                    <li>Abrir la configuración del navegador Chrome, que se encuentra en la parte superior derecha</li>
                    <li>Selecciona "Historial"</li>
                    <li>Eliminar datos de navegación</li>
                    <li>Seleccionar solo "Cookies y datos de sitios"</li>
                    <li>Aplastar "Eliminar datos" y listo</li>
                </ol>
            </template>

            <template v-else-if="/Android 12/.test(userAgent)">
                <h3 class="mt-3">Instrucciones para Android 12</h3>
                <p>Hemos detectado que estás usando Android 12. Si tienes problemas para acceder, sigue estos pasos:</p>
                <ol class="android-instructions">
                    <li>Abrir la configuración del navegador Chrome, que se encuentra en la parte superior derecha</li>
                    <li>Historial</li>
                    <li>Eliminar datos de navegación</li>
                    <li>Seleccionar solo "Cookies y datos de sitios"</li>
                    <li>Aplastar "Eliminar datos" y listo</li>
                </ol>
            </template>

            <template v-else-if="/Android 13/.test(userAgent)">
                <h3 class="mt-3">Instrucciones para Android 13</h3>
                <p>Hemos detectado que estás usando Android 13. Si tienes problemas para acceder, sigue estos pasos:</p>
                <ol class="android-instructions">
                    <li>Abrir la configuración del navegador Chrome, que se encuentra en la parte superior derecha</li>
                    <li>Historial</li>
                    <li>Eliminar datos de navegación</li>
                    <li>Seleccionar solo "Cookies y datos de sitios"</li>
                    <li>Aplastar "Eliminar datos" y listo</li>
                </ol>
            </template>

            <template v-else-if="/Android 14/.test(userAgent)">
                <h3 class="mt-3">Instrucciones para Android 14</h3>
                <p>Hemos detectado que estás usando Android 14. Si tienes problemas para acceder, sigue estos pasos:</p>
                <ol class="android-instructions">
                    <li>Abrir la configuración del navegador Chrome, que se encuentra en la parte superior derecha</li>
                    <li>Historial</li>
                    <li>Eliminar datos de navegación</li>
                    <li>Seleccionar solo "Cookies y datos de sitios"</li>
                    <li>Aplastar "Eliminar datos" y listo</li>
                </ol>
            </template>

            <template v-else>
                <h3 class="mt-3">Instrucciones para Android</h3>
                <p>Hemos detectado que estás usando un dispositivo Android. Si tienes problemas para acceder, sigue estos pasos:</p>
                <ol class="android-instructions">
                    <li>Abrir la configuración del navegador Chrome, que se encuentra en la parte superior derecha</li>
                    <li>Historial</li>
                    <li>Eliminar datos de navegación</li>
                    <li>Seleccionar solo "Cookies y datos de sitios"</li>
                    <li>Aplastar "Eliminar datos" y listo</li>
                </ol>
            </template>
        </template>
    </div>
</div>
</template>

<script>
import axios from 'axios';
import config from '@/config';

export default {
    data() {
        return {
            serverStatus: false,
            serverVersion: null,
            isLoading: false,
            message: null,
            hasCleared: false
        };
    },

    mounted() {
        this.checkServerStatus();

        // Detectar si es Android 13
        const userAgent = navigator.userAgent;
        this.isAndroid11to14 = /Android 1[1-4]/.test(userAgent) ||
            (/Android/.test(userAgent) && /Chrome\/1[0-9][0-9]/.test(userAgent));

        if (this.isAndroid11to14) {
            console.log("Detectado dispositivo Android 11-14");
        }
    },

    methods: {
        async checkServerStatus() {
            try {
                const response = await axios.get(`${config.BASE_URL}/recover-access/status`);
                this.serverStatus = response.data.status === 'online';
                this.serverVersion = response.data.serverVersion;
            } catch (error) {
                this.serverStatus = false;
                console.error('Error al verificar estado del servidor:', error);
            }
        },

        async clearCookies() {
            this.isLoading = true;
            this.message = null;

            try {
                // 1. Llamada al servidor para limpiar cookies del lado del servidor
                await axios.post(`${config.BASE_URL}/recover-access/clear-cookies`, {}, {
                    withCredentials: true
                });

                // 2. Limpiar cookies de forma mejorada
                this.clearAllCookiesImproved();

                // 3. Limpiar localStorage y sessionStorage
                localStorage.clear();
                sessionStorage.clear();

                this.hasCleared = true;
                this.message = "¡Datos de sesión limpiados correctamente! Ahora puedes iniciar sesión nuevamente.";
            } catch (error) {
                console.error('Error al limpiar cookies:', error);

                // Si falla la limpieza del servidor, intentar limpieza local de todos modos
                this.clearAllCookiesImproved();
                localStorage.clear();
                sessionStorage.clear();

                this.hasCleared = true;
                this.message = "Limpieza local completada. Si sigues teniendo problemas para acceder, intenta borrar las cookies desde la configuración de tu navegador.";
            } finally {
                this.isLoading = false;
            }
        },

        // Método mejorado para limpiar cookies
        clearAllCookiesImproved() {
            const cookies = document.cookie.split(";");
            const domain = window.location.hostname;

            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i];
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();

                // Intentar varios métodos para asegurar la eliminación

                // 1. Método básico
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;

                // 2. Con dominio explícito
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`;

                // 3. Para dominios con www
                if (domain.startsWith('www.')) {
                    const baseDomain = domain.substring(4);
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${baseDomain}`;
                }

                // 4. Para cualquier subdominio
                const dotIndex = domain.indexOf('.');
                if (dotIndex !== -1) {
                    const rootDomain = domain.substring(dotIndex);
                    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${rootDomain}`;
                }

                // 5. Con atributos de seguridad
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;secure;samesite=none`;
            }

            // Verificar si quedan cookies
            console.log("Cookies después de limpieza:", document.cookie);
        },

        goToLogin() {
            // Verificar si aún hay cookies
            if (document.cookie) {
                console.warn("Aún hay cookies después de la limpieza:", document.cookie);

                // Mostrar mensaje de advertencia
                this.message = "Advertencia: No se pudieron eliminar todas las cookies. " +
                    "Recomendamos borrar manualmente las cookies desde la configuración del navegador.";

                // Opción para forzar redirección después de 3 segundos
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                console.log("Todas las cookies fueron eliminadas exitosamente");

                // Si ya se limpiaron las cookies, forzar recarga completa
                if (this.hasCleared) {
                    window.location.href = '/';
                } else {
                    this.$router.push('/');
                }
            }
        }
    }
};
</script>

<style scoped>
.recover-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.recover-card {
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    padding: 30px;
    width: 100%;
    max-width: 500px;
    text-align: center;
}

.recover-logo {
    width: 120px;
    margin-bottom: 20px;
}

h1 {
    color: #0c534c;
    margin-bottom: 20px;
    font-size: 24px;
}

.status-section {
    margin-bottom: 20px;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 5px;
}

.status-online {
    color: #10b981;
    font-weight: bold;
}

.status-offline {
    color: #ef4444;
    font-weight: bold;
}

.message-box {
    padding: 10px;
    margin: 15px 0;
    border-radius: 5px;
    background-color: #ecfdf5;
    border-left: 4px solid #10b981;
    text-align: left;
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 20px 0;
}

.btn-primary,
.btn-secondary {
    padding: 12px 20px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
}

.btn-primary {
    background: linear-gradient(135deg, #0c534c, #059669);
    color: white;
    border: none;
}

.btn-primary:hover {
    background: linear-gradient(135deg, #059669, #0c534c);
    transform: translateY(-2px);
}

.btn-secondary {
    background-color: white;
    color: #0c534c;
    border: 1px solid #0c534c;
}

.btn-secondary:hover {
    background-color: #f0f9f6;
}

.btn-primary:disabled,
.btn-secondary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
}

.info-box {
    margin-top: 30px;
    text-align: left;
    padding: 15px;
    background-color: #f0f9f6;
    border-radius: 5px;
}

.info-box h3 {
    color: #0c534c;
    font-size: 16px;
    margin-bottom: 10px;
}

.info-box p {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.5;
}

@media (max-width: 480px) {
    .recover-card {
        padding: 20px;
    }

    h1 {
        font-size: 20px;
    }

    .recover-logo {
        width: 100px;
    }
}
</style>
