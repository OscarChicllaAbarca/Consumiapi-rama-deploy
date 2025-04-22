<template>
  <transition name="fade">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <img :src="loadingImage" alt="Cargando..." class="loading-static" />
        <p class="loading-text">{{ loadingMessages[currentMessage] }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { defineProps, ref, onMounted, onBeforeUnmount } from 'vue';
import loadingImage from '@/assets/loading.svg';

const props = defineProps({
  isLoading: Boolean
});

// Mensajes dinámicos
const loadingMessages = [
  "Cargando datos...",
  "Preparando información...",
  "Estamos en ello...",
  "Esto puede tardar un momento...",
  "Optimización en proceso...",
  "Estamos en ello..."
];

const currentMessage = ref(0);
let interval = null;

// Cambia el mensaje cada 3 segundos
onMounted(() => {
  interval = setInterval(() => {
    currentMessage.value = (currentMessage.value + 1) % loadingMessages.length;
  }, 3000);
});

onBeforeUnmount(() => {
  clearInterval(interval);
});
</script>

<style scoped>
/* Animación de entrada/salida */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Fondo oscuro semitransparente */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* Contenedor del loading */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

/* Imagen estática (sin animación) */
.loading-static {
  width: 100px;
  height: 100px;
}

/* Texto dinámico */
.loading-text {
  margin-top: 15px;
  font-size: 1.5rem;
  font-weight: bold;
  color: #ffffff;
  animation: pulse 2s infinite;
}

/* Efecto pulsante */
@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}
</style>
