<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const logout = async () => {
  try {
    await axios.post(`${config.BASE_URL}/login/logout`, {}, { withCredentials: true });
    
    // Eliminar cookies al hacer logout
    Cookies.remove('tk');
    router.push("/");
  } catch (error) {
    console.error("Error en el logout:", error);
  }
};

// Ejecutar logout al montar el componente
onMounted(() => {
  logout();
});
</script>

<template>
  <div class="logout-container">
    <p>Cerrando sesión...</p>
  </div>
</template>

<style scoped>
.logout-container {
  text-align: center;
  font-size: 18px;
  margin-top: 50px;
}
</style>
