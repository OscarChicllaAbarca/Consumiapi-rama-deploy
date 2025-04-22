<template>
    <div class="document-viewer">
        <h2 class="title">Procedimientos </h2>
        <iframe
            :src="documentUrl"
            width="100%"
            height="100%"
            frameborder="0"
            allow="autoplay"
            v-if="documentUrl"
        ></iframe>
        <p v-else class="placeholder">No se ha seleccionado ningún documento.</p>
    </div>
</template>

<script>
export default {
    props: {
        documentUrl: {
            type: String,
            required: false,
            default: null,
        },
    },
};
</script>

<style scoped>
.document-viewer {
    padding: 20px;
    background-color: #fff;
    height: 100vh;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.title {
    font-size: 24px;
    margin-bottom: 20px;
}

.placeholder {
    text-align: center;
    color: #aaa;
    font-size: 18px;
}
</style>
