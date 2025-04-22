<template>
    <div id="app">
      <div id="three-container"></div>
    </div>
  </template>
  
  <script>
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
  
  // Importar el archivo del modelo .glb
  import modelPath from "@/assets/model.glb";
  
  export default {
    data() {
      return {
        model: null, // Aquí se almacenará el modelo cargado
        scene: null, // Almacenar la escena
        raycaster: new THREE.Raycaster(),
        mouse: new THREE.Vector2(),
      };
    },
    name: "App",
    mounted() {
      this.initThreeJS();
    },
    methods: {
      initThreeJS() {
        // Referencia al contenedor
        const container = document.getElementById("three-container");
  
        // Crear escena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000); // Fondo negro
        
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true; // Habilitar sombras
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);
  
        // Controles de órbita
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; // Movimiento suave
        controls.dampingFactor = 0.05;
  
        // Luces
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Luz ambiental
        this.scene.add(ambientLight);
  
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true; // Permitir que la luz proyecte sombras
        this.scene.add(directionalLight);
  
        // Cargar modelo
        const loader = new GLTFLoader();
        loader.load(
          modelPath,
          (gltf) => {
            this.model = gltf.scene; // Guardar el modelo en this.model
            this.scene.add(this.model);
            this.model.position.set(0, -1, 0);
  
            // Configurar sombras y materiales del modelo
            this.model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true; // Permitir que los objetos proyecten sombras
                child.receiveShadow = true; // Permitir que los objetos reciban sombras
                if (!child.material) {
                  child.material = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                  });
                }
                child.material.needsUpdate = true;
              }
            });
  
            console.log("Modelo cargado exitosamente:", this.model);
          },
          undefined,
          (error) => {
            console.error("Error al cargar el modelo:", error);
          }
        );
  
        // Configuración inicial de la cámara
        camera.position.set(0, 2, 5);
  
        // Escuchar clics
        window.addEventListener("click", (event) =>
          this.onMouseClick(event, camera)
        );
  
        // Animación de la escena
        const animate = () => {
          requestAnimationFrame(animate);
          controls.update(); // Actualizar controles
          renderer.render(this.scene, camera);
        };
        animate();
  
        // Ajustar al redimensionar
        window.addEventListener("resize", () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        });
      },
      onMouseClick(event, camera) {
        if (!this.model) {
          console.error("El modelo aún no se ha cargado.");
          return;
        }
  
        // Convertir las coordenadas del mouse a espacio normalizado
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
        // Configurar raycaster
        this.raycaster.setFromCamera(this.mouse, camera);
  
        // Detectar intersecciones con el modelo
        const intersects = this.raycaster.intersectObject(this.model, true);
  
        if (intersects.length > 0) {
          const clickedPart = intersects[0].object;
          console.log("Parte clicada:", clickedPart.name);
          alert(`Hiciste clic en: ${clickedPart.name}`);
        }
      },
    },
  };
  </script>
  
  <style scoped>
  #three-container {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
  
  body {
    margin: 0;
  }
  </style>
  