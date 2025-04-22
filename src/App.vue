<template>
  <div>
    <Navbar v-if="!isLoginPage" /> <!-- Muestra el Navbar solo si no estamos en la vista de Login -->
    <OfflineNotice v-if="!isLoginPage" :isOnline="isOnline" /> <!-- Pasa isOnline como prop -->
    <router-view v-if="isLoginPage" /> <!-- Muestra la vista de Login -->
  </div>
</template>

<script>
import Navbar from './components/Navbar.vue';
import OfflineNotice from './components/OfflineNotice.vue';
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';

export default {
  components: {
    Navbar,
    OfflineNotice
  },
  setup() {
    const route = useRoute();
    const isLoginPage = computed(() => route.name === 'Login');

    // Estado de conexión a Internet
    const isOnline = ref(navigator.onLine);

    // Detectar cambios en el estado de la conexión
    const handleOnline = () => {
      isOnline.value = true;
    };
    const handleOffline = () => {
      isOnline.value = false;
    };

    onMounted(() => {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });

    return {
      isLoginPage,
      isOnline
    };
  }
};
</script>
