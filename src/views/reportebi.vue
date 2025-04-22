<template>
  <div>
    <iframe
      title="PowerFinal"
      width="100%"
      height="600px"
      src="https://app.powerbi.com/view?r=eyJrIjoiZjMwMGQ3ZjYtOWFmNy00NDhlLWI1NGYtMDU2NjJlMjlhZDhmIiwidCI6ImJlYzhkZjdkLTVhZjktNGEyNC1iNjIxLWU4ZjU2MTg3MDkyZSJ9"
      frameborder="0"
      allowFullScreen="true">
    </iframe>

    
  </div>
</template>

<script>
export default {
  name: "PowerBI"
};
</script>

<style scoped>
iframe {
  width: 100%;
  height: 100vh; /* Esto hará que ocupe todo el alto de la ventana */
}
</style>
