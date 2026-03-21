<template>
  <div>
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <p class="badge">Sistema</p>
        <h1 class="text-3xl font-bold mt-3 mb-1 text-slate-900">Usuários Mestres</h1>
        <p class="text-slate-500 text-sm">Administradores do heAdmin</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary" @click="load">Atualizar</button>
        <button class="btn-primary !w-auto !py-2.5 !px-5" @click="showModal = true">+ Novo Usuário</button>
      </div>
    </div>

    <div class="card">
      <div v-if="!users.length" class="py-12 text-center text-slate-400 text-sm">Nenhum usuário encontrado.</div>

      <table class="data-table" v-else>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50">
            <td class="font-medium text-slate-900">{{ user.name }}</td>
            <td class="text-slate-500 text-sm">{{ user.email }}</td>
            <td>
              <span class="badge" :class="user.active ? '!bg-emerald-50 !text-emerald-700' : '!bg-red-50 !text-red-700'">
                {{ user.active ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">
        <h2 class="text-xl font-bold text-slate-900 mb-6">Novo Usuário Mestre</h2>
        <form @submit.prevent="create" class="grid gap-4">
          <div>
            <label class="label">Nome *</label>
            <input v-model="form.name" required class="field" placeholder="Ana Lima" />
          </div>
          <div>
            <label class="label">Email *</label>
            <input v-model="form.email" type="email" required class="field" placeholder="ana@headmin.local" />
          </div>
          <div>
            <label class="label">Senha *</label>
            <input v-model="form.password" type="password" required minlength="8" class="field" placeholder="••••••••" />
          </div>
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="saving" class="btn-primary !w-auto !py-2.5 !px-6">
              {{ saving ? 'Criando...' : 'Criar Usuário' }}
            </button>
            <button type="button" class="btn-secondary" @click="closeModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '../api'

const users = ref<any[]>([])
const showModal = ref(false)
const saving = ref(false)
const error = ref('')
const form = ref({ name: '', email: '', password: '' })

async function load() {
  const response = await api.get('/api/v1/master/users')
  users.value = response.data.data ?? []
}

function closeModal() { showModal.value = false; form.value = { name: '', email: '', password: '' }; error.value = '' }

async function create() {
  error.value = ''
  saving.value = true
  try {
    await api.post('/api/v1/master/users', form.value)
    await load()
    closeModal()
  } catch (e: any) {
    error.value = e.response?.data?.message ?? 'Erro ao criar usuário'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
