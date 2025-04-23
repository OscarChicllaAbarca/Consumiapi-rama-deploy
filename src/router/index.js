import { createRouter, createWebHashHistory } from 'vue-router';
import ListInventView from '@/views/ListInventView.vue';
import InsertInventariadoView from '@/views/InsertInventariadoView.vue';
import TomaView from '../views/TomaView.vue';
import LoginView from '@/views/LoginView.vue';
import ListarTomaView from '@/views/ListarTomaView.vue';
import TomaInoView from '@/views/TomaInoView.vue';
import DocumentViewer from '@/views/DocumentViewer.vue'
import PrecioxDep from '@/views/PrecioxDep.vue';
import ReportingView from '@/views/ReportingView.vue'
import almacenView from '@/views/almacenView.vue';
import ObservacioneView from '@/views/ObservacioneView.vue';
import GetObservaciones from '@/views/GetObservaciones.vue';
import UserView from '@/views/UserView.vue';
import ComPrecioView from '@/views/ComPrecioView.vue';
import Reportebi from '@/views/reportebi.vue';
import RepotTimeView from '@/views/RepotTimeView.vue';
import AsistenciaView from '@/views/AsistenciaView.vue';
import UserDashboardView from '@/views/UserDashboardView.vue';
import { Path } from 'three';
import axios from "axios";
import config from "@/config"; // Ajusta la ruta de tu configuración
import store from '@/store'; 

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/toma',
    name: 'Toma',
    component: TomaView,
    meta: { requiresAuth: true }
  },
  {
    path: '/listar_toma',
    name: 'listar_toma',
    component: ListarTomaView,
    meta: { requiresAuth: true }
  },
  {
    path: '/InsertInventariado',
    name: 'InsertInventariado',
    component: InsertInventariadoView,meta: { requiresAuth: true }
  },
  {
    path: '/ListarInvent',
    name: 'ListarInvent',
    component: ListInventView,meta: { requiresAuth: true }
  },
  {
    path: '/tomaino',
    name: 'tomaino',
    component:TomaInoView,meta: { requiresAuth: true }
  },
  {
        path: '/document-viewer',
        name: 'DocumentViewer',
        component: DocumentViewer,
        props: (route) => ({ documentUrl: route.query.url }) // Pasar URL como prop
        ,meta: { requiresAuth: true }
  },
  {
    path: '/Precio',
    name: 'Precio',
    component:PrecioxDep,meta: { requiresAuth: true }
  },
  {
    path: '/Reporting',
    name: 'Reporting',
    component:ReportingView,meta: { requiresAuth: true }
  },
  {
    path: '/Almacen',
    name: 'Almacen',
    component:almacenView,meta: { requiresAuth: true }
  },
  {
    path: '/Observacion',
    name: 'Observacion',
    component:ObservacioneView,meta: { requiresAuth: true }
  },
  {
    path: '/getObservaciones',
    name: 'getObservaciones',
    component:GetObservaciones,meta: { requiresAuth: true }
  },
  {
    path: '/User',
    name: 'User',
    component:UserView,meta: { requiresAuth: true }
  },
  {
    path: '/ComPrecio',
    name: 'ComPrecio',
    component:ComPrecioView,meta: { requiresAuth: true }
  },
  {
    path: '/powerBI',
    name: 'powerBI',
    component:Reportebi,meta: { requiresAuth: true }
  },
  {
    path: '/RepotTimeView',
    name: 'RepotTimeView',
    component:RepotTimeView,meta: { requiresAuth: true }
  },
  {
    path: '/Asistencia',
    name: 'AsistenciaView',
    component:AsistenciaView,meta: { requiresAuth: true }
  },
  {
  path: '/UserDashboard',
  name: 'UserDashboard',
  component: UserDashboardView,meta:{requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  // Si va al login, no verifica nada
  if (to.path === "/") {
    return next();
  }
  
  try {
    const response = await axios.get(`${config.BASE_URL}/login/verify-user-info`, {
      withCredentials: true
    });
  
    if (response.status === 200) {
      const userData = response.data;
  
      store.commit('setUsuario', userData.usuario);
      store.commit('setRol', userData.rol);
  
      const userRoles = userData.rol;
  
      // Si no tiene roles definidos
      if (!userRoles || (Array.isArray(userRoles) && userRoles.length === 0)) {
        return next('/login');
      }
  
      const hasClientRole = Array.isArray(userRoles)
        ? userRoles.includes('ROLE_CLIENT')
        : userRoles === 'ROLE_CLIENT';
  
      if (hasClientRole) {
        return to.path === '/UserDashboard' ? next() : next('/UserDashboard');
      }
  
      // Para otros roles, permitir acceso libre
      return next();
    }
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    return next('/login');
  }
  
  
});

export default router;