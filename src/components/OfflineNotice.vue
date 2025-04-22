<template>
  <div v-if="!isOnline" class="offline-overlay">
    <div class="offline-message">
      <p>No hay conexión a Internet</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    isOnline: {
      type: Boolean,
      required: true
    }
  }
};
</script>

<style scoped>
.offline-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  text-align: center;
  font-size: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.offline-message {
  background-color: #ff4d4d;
  padding: 20px;
  border-radius: 5px;
}
</style>
