<template>
  <div>
    <div class="mb-8">
      <p class="badge">Operação</p>
      <h1 class="text-4xl font-bold mt-4 mb-2 text-slate-900">Painel mestre</h1>
      <p class="text-slate-500 text-sm">Entrada única para governança SaaS do Hermes.</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="card !p-5 text-center">
        <p class="text-3xl font-bold text-slate-900">{{ stats.tenants }}</p>
        <p class="text-xs text-slate-400 mt-1 uppercase tracking-wide">Tenants</p>
      </div>
      <div class="card !p-5 text-center">
        <p class="text-3xl font-bold text-teal-700">{{ stats.active }}</p>
        <p class="text-xs text-slate-400 mt-1 uppercase tracking-wide">Ativos</p>
      </div>
      <div class="card !p-5 text-center">
        <p class="text-3xl font-bold text-amber-600">{{ stats.lifetime }}</p>
        <p class="text-xs text-slate-400 mt-1 uppercase tracking-wide">Vitalício</p>
      </div>
      <div class="card !p-5 text-center">
        <p class="text-3xl font-bold text-slate-900">{{ stats.plans }}</p>
        <p class="text-xs text-slate-400 mt-1 uppercase tracking-wide">Planos</p>
      </div>
    </div>

    <!-- Quick links -->
    <div class="card">
      <p class="text-sm font-semibold text-slate-700 mb-4">Acesso rápido</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <router-link to="/tenants" class="quick-link">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          Tenants
        </router-link>
        <router-link to="/plans" class="quick-link">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          Planos
        </router-link>
        <router-link to="/users" class="quick-link">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
          Usuários Mestres
        </router-link>
        <router-link to="/tenants" class="quick-link !border-amber-200 !bg-amber-50 !text-amber-800 hover:!bg-amber-100">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          Vitalícios: {{ stats.lifetime }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '../api'

const stats = ref({ tenants: 0, active: 0, lifetime: 0, plans: 0 })

onMounted(async () => {
  const [tr, pr] = await Promise.all([
    api.get('/api/v1/master/tenants'),
    api.get('/api/v1/master/plans')
  ])
  const tenants = tr.data.data ?? []
  stats.value = {
    tenants: tenants.length,
    active: tenants.filter((t: any) => t.adminAccessStatus === 'FULL').length,
    lifetime: tenants.filter((t: any) => t.lifetimeAccess).length,
    plans: (pr.data.data ?? []).length
  }
})
</script>

<style>
.quick-link {
  @apply flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-medium;
}
</style>
