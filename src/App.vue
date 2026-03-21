<template>
  <div class="flex min-h-screen">
    <aside v-if="loggedIn" class="w-56 shrink-0 flex flex-col gap-1 px-4 py-8 bg-slate-900">
      <span class="text-xs font-semibold text-slate-500 uppercase tracking-widest px-3 mb-3">heAdmin</span>

      <router-link to="/" class="nav-link" active-class="nav-link-active" exact>
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        Dashboard
      </router-link>

      <p class="px-3 pt-4 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Negócio</p>

      <router-link to="/tenants" class="nav-link" active-class="nav-link-active">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        Tenants
      </router-link>

      <router-link to="/plans" class="nav-link" active-class="nav-link-active">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
        Planos
      </router-link>

      <p class="px-3 pt-4 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Sistema</p>

      <router-link to="/users" class="nav-link" active-class="nav-link-active">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        Usuários Mestres
      </router-link>

      <div class="mt-auto">
        <button @click="logout" class="nav-link w-full text-slate-400 cursor-pointer bg-transparent border-none">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sair
        </button>
      </div>
    </aside>
    <main class="flex-1 p-8 min-w-0 overflow-auto">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loggedIn = computed(() => !!localStorage.getItem('headmin_token'))

function logout() {
  localStorage.removeItem('headmin_token')
  router.push({ name: 'login' })
}
</script>

<style>
.nav-link {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm;
}
.nav-link-active {
  @apply bg-slate-800 text-white;
}
</style>
