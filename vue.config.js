const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/Consumiapi/' 
    : '/',
  chainWebpack: (config) => {
    // Agregar un rule para manejar los archivos .glb
    config.module
      .rule('glb')
      .test(/\.glb$/)
      .use('file-loader')  // Usamos file-loader para manejar archivos binarios
      .loader('file-loader')
      .options({
        name: 'models/[name].[hash:8].[ext]', // Nombre del archivo con hash para evitar conflictos
      });
  },
});
