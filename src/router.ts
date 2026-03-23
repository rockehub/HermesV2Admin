import { createRouter, createWebHistory } from 'vue-router'
import LoginPage from './pages/LoginPage.vue'
import DashboardPage from './pages/DashboardPage.vue'
import TenantsPage from './pages/TenantsPage.vue'
import TenantDetailPage from './pages/TenantDetailPage.vue'
import PlansPage from './pages/PlansPage.vue'
import MasterUsersPage from './pages/MasterUsersPage.vue'
import WorkflowDependenciesPage from './pages/WorkflowDependenciesPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/', name: 'dashboard', component: DashboardPage, meta: { auth: true } },
    { path: '/tenants', name: 'tenants', component: TenantsPage, meta: { auth: true } },
    { path: '/tenants/:id', name: 'tenant-detail', component: TenantDetailPage, meta: { auth: true } },
    { path: '/plans', name: 'plans', component: PlansPage, meta: { auth: true } },
    { path: '/users', name: 'users', component: MasterUsersPage, meta: { auth: true } },
    { path: '/workflow-dependencies', name: 'workflow-dependencies', component: WorkflowDependenciesPage, meta: { auth: true } }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('headmin_token')
  if (to.meta.auth && !token) return { name: 'login' }
  if (to.name === 'login' && token) return { name: 'dashboard' }
})

export default router
