<template>
  <div class="flex items-center justify-center min-h-[calc(100vh-5rem)]">
    <div class="card w-full max-w-md">
      <p class="badge mb-1">heAdmin</p>
      <h1 class="text-4xl font-bold mt-3 mb-2 text-slate-900">Acesso mestre</h1>
      <p class="text-slate-500 mb-6 text-sm">Controle central de tenants, planos e bloqueios.</p>

      <form class="flex flex-col gap-3" @submit.prevent="submit">
        <input v-model="email" type="email" placeholder="Email" class="field" />
        <input v-model="password" type="password" placeholder="Senha" class="field" />
        <button class="btn-primary mt-1">Entrar</button>
        <p v-if="error" class="text-red-700 text-sm text-center">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

async function submit() {
  try {
    error.value = ''
    const response = await api.post('/api/v1/master/auth/login', { email: email.value, password: password.value })
    localStorage.setItem('headmin_token', response.data.data.accessToken)
    router.push({ name: 'dashboard' })
  } catch {
    error.value = 'Falha ao autenticar.'
  }
}
</script>
