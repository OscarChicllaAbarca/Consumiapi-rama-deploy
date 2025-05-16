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
import ComProductoView from '@/views/ComProductoView.vue';
import RecoverAccessView from '@/views/RecoverAccessView.vue';
import AprovacionView from '@/views/AprovacionView.vue';
import { Path } from 'three';
import axios from "axios";
import config from "@/config"; 
import store from '@/store'; 
import AdminAsistencia from '@/views/AdminAsistencia.vue';
import UserAsistencia from '@/views/UserAsistencia.vue';


const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/recover',
    name: 'RecoverAccess',
    component: RecoverAccessView,
    meta: { requiresAuth: false }
  },
  {
    path: '/Aprobar',
    name: 'AprovacionView',
    component: AprovacionView,
    meta: { requiresAuth: true }
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
  },
  {
  path: '/ComProducto',
  name: 'ComProducto',
  component: ComProductoView,meta:{requiresAuth: true }
  },
  {
  path: '/AdminAsistencia',
  name: 'AdminAsistencia',
  component: AdminAsistencia,meta:{requiresAuth: true }
  },
  {
  path: '/UserAsistencia',
  name: 'UserAsistencia',
  component: UserAsistencia,meta:{requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});




// Validación del estado del usuario antes de cada ruta
router.beforeEach(async (to, from, next) => {
  // Si va al login o a la página de recuperación, no verifica nada
  if (to.path === "/" || to.path === "/recover") {
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
        return next('/');
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
    // Si es un error 401, intentar renovar el token
    if (error.response && error.response.status === 401) {
      try {
        console.error('Error al verificar usuario:', error);
        return next('/');
      } catch (refreshError) {
        console.error('Error al intentar renovar el token:', refreshError);
        return next('/');
      }
    } else {
      console.error('Error al verificar usuario:', error);
      return next('/');
    }
  }
});
export default router;