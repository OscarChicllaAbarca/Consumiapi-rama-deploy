const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Mantener el publicPath existente
  publicPath: process.env.NODE_ENV === 'production'
    ? '/Consumiapi-rama-deploy/'
    : '/',
  
  // Mantener la configuración chainWebpack existente para archivos .glb
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
  
  // Agregar la configuración configureWebpack para resolver los problemas de polyfills
  configureWebpack: {
    resolve: {
      fallback: {
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "stream": require.resolve("stream-browserify"),
        "url": require.resolve("url/"),
        "crypto": require.resolve("crypto-browserify"),
        "assert": require.resolve("assert/"),
        "util": require.resolve("util/")
      }
    }
  }
});