<template>
  <div v-if="tenant">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <router-link to="/tenants" class="text-sm text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-3">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          Voltar
        </router-link>
        <p class="badge">Tenant</p>
        <h1 class="text-3xl font-bold mt-3 mb-1 text-slate-900">{{ tenant.tenantName }}</h1>
        <p class="text-slate-500 text-sm">{{ tenant.ownerEmail }} · slug: {{ tenant.tenantSlug }}</p>
      </div>
      <div class="flex flex-wrap gap-2 mt-6">
        <button
          v-if="tenant.adminAccessStatus === 'FULL' && !tenant.lifetimeAccess"
          class="btn-secondary text-sm !py-2 !px-4"
          @click="block"
        >Bloquear</button>
        <button
          v-if="tenant.adminAccessStatus !== 'FULL'"
          class="btn-primary !w-auto !py-2 !px-4 text-sm"
          @click="unblock"
        >Liberar</button>
        <button
          v-if="!tenant.lifetimeAccess"
          class="btn-secondary text-sm !py-2 !px-4 bg-amber-50 !border-amber-200 !text-amber-800 hover:!bg-amber-100"
          @click="grantLifetime"
        >⭐ Acesso Vitalício</button>
        <button
          v-if="tenant.lifetimeAccess"
          class="btn-secondary text-sm !py-2 !px-4 !text-slate-500"
          @click="revokeLifetime"
        >Revogar Vitalício</button>
      </div>
    </div>

    <!-- Info cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="card !p-5">
        <p class="text-xs uppercase tracking-wide text-slate-400 mb-1">Plano</p>
        <p class="font-semibold text-slate-900">{{ tenant.planName ?? '—' }}</p>
        <p class="text-sm text-slate-500 mt-0.5">{{ tenant.subscriptionStatus ?? 'N/A' }}</p>
      </div>
      <div class="card !p-5">
        <p class="text-xs uppercase tracking-wide text-slate-400 mb-1">Acesso</p>
        <p class="font-semibold text-slate-900">{{ tenant.adminAccessStatus }}</p>
        <span v-if="tenant.lifetimeAccess" class="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">Vitalício</span>
      </div>
      <div class="card !p-5">
        <p class="text-xs uppercase tracking-wide text-slate-400 mb-1">Onboarding</p>
        <p class="font-semibold text-slate-900">{{ tenant.onboardingStatus ?? '—' }}</p>
        <p class="text-sm text-slate-500 mt-0.5">CNPJ: {{ tenant.cnpj ?? 'não informado' }}</p>
      </div>
    </div>

    <div v-if="tenant.blockedReason" class="mb-6 rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
      Motivo do bloqueio: {{ tenant.blockedReason }}
    </div>

    <!-- Employees -->
    <div class="card">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-lg font-bold text-slate-900">Employees</h2>
        <button class="btn-primary !w-auto !py-2 !px-4 text-sm" @click="showCreateEmp = true">+ Novo Employee</button>
      </div>

      <div v-if="!employees.length" class="py-8 text-center text-slate-400 text-sm">Nenhum employee encontrado.</div>

      <table class="data-table" v-else>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Username</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="emp in employees" :key="emp.id" class="hover:bg-slate-50">
            <td class="font-medium text-slate-900">{{ emp.name }} {{ emp.surname }}</td>
            <td class="text-slate-500 text-sm">{{ emp.username }}</td>
            <td class="text-slate-500 text-sm">{{ emp.email }}</td>
            <td class="text-slate-500 text-sm">{{ emp.roles?.join(', ') || '—' }}</td>
            <td>
              <span class="badge" :class="emp.active ? '!bg-emerald-50 !text-emerald-700' : '!bg-red-50 !text-red-700'">
                {{ emp.active ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
            <td class="text-right">
              <button class="btn-secondary text-xs !py-1.5 !px-3" @click="openEditEmp(emp)">Editar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Employee Modal -->
    <div v-if="showCreateEmp" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <h2 class="text-xl font-bold text-slate-900 mb-6">Novo Employee</h2>
        <form @submit.prevent="createEmployee" class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Nome *</label>
              <input v-model="empForm.name" required class="field" placeholder="João" />
            </div>
            <div>
              <label class="label">Sobrenome</label>
              <input v-model="empForm.surname" class="field" placeholder="Silva" />
            </div>
          </div>
          <div>
            <label class="label">Username *</label>
            <input v-model="empForm.username" required class="field" placeholder="joao.silva" />
          </div>
          <div>
            <label class="label">Email *</label>
            <input v-model="empForm.email" type="email" required class="field" placeholder="joao@empresa.com" />
          </div>
          <div>
            <label class="label">Senha *</label>
            <input v-model="empForm.password" type="password" required class="field" placeholder="••••••••" />
          </div>
          <div>
            <label class="label">Roles (separadas por vírgula)</label>
            <input v-model="empRolesRaw" class="field" placeholder="ADMIN" />
          </div>
          <p v-if="empError" class="text-sm text-red-600">{{ empError }}</p>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="savingEmp" class="btn-primary !w-auto !py-2.5 !px-6">
              {{ savingEmp ? 'Criando...' : 'Criar Employee' }}
            </button>
            <button type="button" class="btn-secondary" @click="closeEmpModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Employee Modal -->
    <div v-if="showEditEmp" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <h2 class="text-xl font-bold text-slate-900 mb-6">Editar Employee</h2>
        <form @submit.prevent="updateEmployee" class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Nome</label>
              <input v-model="empEditForm.name" class="field" />
            </div>
            <div>
              <label class="label">Sobrenome</label>
              <input v-model="empEditForm.surname" class="field" />
            </div>
          </div>
          <div>
            <label class="label">Email</label>
            <input v-model="empEditForm.email" type="email" class="field" />
          </div>
          <div>
            <label class="label">Roles (separadas por vírgula)</label>
            <input v-model="empEditRolesRaw" class="field" placeholder="ADMIN" />
          </div>
          <div class="flex items-center gap-3">
            <input type="checkbox" id="activeCheck" v-model="empEditForm.active" class="rounded" />
            <label for="activeCheck" class="text-sm text-slate-700 cursor-pointer">Employee ativo</label>
          </div>
          <p v-if="empError" class="text-sm text-red-600">{{ empError }}</p>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="savingEmp" class="btn-primary !w-auto !py-2.5 !px-6">
              {{ savingEmp ? 'Salvando...' : 'Salvar' }}
            </button>
            <button type="button" class="btn-secondary" @click="closeEmpModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <div v-else class="flex items-center justify-center h-64 text-slate-400">Carregando...</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const id = route.params.id as string

const tenant = ref<any | null>(null)
const employees = ref<any[]>([])

const showCreateEmp = ref(false)
const showEditEmp = ref(false)
const savingEmp = ref(false)
const empError = ref('')
const editingEmpId = ref<string | null>(null)

const emptyEmpForm = () => ({ name: '', surname: '', username: '', email: '', password: '' })
const empForm = ref(emptyEmpForm())
const empRolesRaw = ref('ADMIN')

const empEditForm = ref<any>({ name: '', surname: '', email: '', active: true })
const empEditRolesRaw = ref('')

async function load() {
  const [tr, er] = await Promise.all([
    api.get(`/api/v1/master/tenants/${id}`),
    api.get(`/api/v1/master/tenants/${id}/employees`)
  ])
  tenant.value = tr.data.data
  employees.value = er.data.data ?? []
}

async function block() {
  await api.post(`/api/v1/master/tenants/${id}/block`, { reason: 'Bloqueio manual pelo heAdmin' })
  await load()
}
async function unblock() {
  await api.post(`/api/v1/master/tenants/${id}/unblock`)
  await load()
}
async function grantLifetime() {
  await api.post(`/api/v1/master/tenants/${id}/lifetime-access`)
  await load()
}
async function revokeLifetime() {
  await api.delete(`/api/v1/master/tenants/${id}/lifetime-access`)
  await load()
}

function parseRoles(raw: string): string[] {
  return raw.split(',').map(r => r.trim()).filter(Boolean)
}

function closeEmpModal() {
  showCreateEmp.value = false
  showEditEmp.value = false
  empForm.value = emptyEmpForm()
  empRolesRaw.value = 'ADMIN'
  empError.value = ''
  editingEmpId.value = null
}

function openEditEmp(emp: any) {
  editingEmpId.value = emp.id
  empEditForm.value = { name: emp.name, surname: emp.surname ?? '', email: emp.email, active: emp.active }
  empEditRolesRaw.value = emp.roles?.join(', ') ?? 'ADMIN'
  empError.value = ''
  showEditEmp.value = true
}

async function createEmployee() {
  empError.value = ''
  savingEmp.value = true
  try {
    await api.post(`/api/v1/master/tenants/${id}/employees`, {
      ...empForm.value,
      roles: parseRoles(empRolesRaw.value)
    })
    await load()
    closeEmpModal()
  } catch (e: any) {
    empError.value = e.response?.data?.message ?? 'Erro ao criar employee'
  } finally {
    savingEmp.value = false
  }
}

async function updateEmployee() {
  empError.value = ''
  savingEmp.value = true
  try {
    await api.patch(`/api/v1/master/tenants/${id}/employees/${editingEmpId.value}`, {
      ...empEditForm.value,
      roles: parseRoles(empEditRolesRaw.value)
    })
    await load()
    closeEmpModal()
  } catch (e: any) {
    empError.value = e.response?.data?.message ?? 'Erro ao atualizar employee'
  } finally {
    savingEmp.value = false
  }
}

onMounted(load)
</script>
