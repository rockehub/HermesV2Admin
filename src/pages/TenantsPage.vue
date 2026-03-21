<template>
  <div>
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <p class="badge">SaaS</p>
        <h1 class="text-3xl font-bold mt-3 mb-1 text-slate-900">Tenants</h1>
        <p class="text-slate-500 text-sm">{{ tenants.length }} conta(s) cadastrada(s)</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary" @click="load">Atualizar</button>
        <button class="btn-primary !w-auto !py-2.5 !px-5" @click="showCreate = true">+ Novo Tenant</button>
      </div>
    </div>

    <div class="card">
      <div v-if="!tenants.length" class="py-12 text-center text-slate-400 text-sm">Nenhum tenant encontrado.</div>

      <table class="data-table" v-else>
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Plano</th>
            <th>Status</th>
            <th>Acesso</th>
            <th>Flags</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tenants" :key="t.tenantAccountId" class="hover:bg-slate-50 transition-colors cursor-pointer" @click="goDetail(t.tenantAccountId)">
            <td>
              <span class="font-semibold text-slate-900">{{ t.tenantName }}</span>
              <br />
              <span class="text-slate-400 text-xs">{{ t.ownerEmail }}</span>
            </td>
            <td class="text-slate-600 text-sm">{{ t.planName ?? '—' }}</td>
            <td>
              <span class="badge" :class="statusClass(t.subscriptionStatus)">{{ t.subscriptionStatus ?? 'N/A' }}</span>
            </td>
            <td class="text-slate-600 text-sm">{{ t.adminAccessStatus }}</td>
            <td>
              <span v-if="t.lifetimeAccess" class="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">Vitalício</span>
            </td>
            <td class="text-right" @click.stop>
              <button
                v-if="t.adminAccessStatus === 'FULL' && !t.lifetimeAccess"
                class="btn-secondary text-xs !py-1.5 !px-3"
                @click="block(t.tenantAccountId)"
              >Bloquear</button>
              <button
                v-else-if="t.adminAccessStatus !== 'FULL'"
                class="btn-primary !w-auto !py-1.5 !px-3 text-xs"
                @click="unblock(t.tenantAccountId)"
              >Liberar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Tenant Modal -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
        <h2 class="text-xl font-bold text-slate-900 mb-6">Novo Tenant</h2>
        <form @submit.prevent="createTenant" class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Razão social *</label>
              <input v-model="form.legalName" required class="field" placeholder="Empresa LTDA" />
            </div>
            <div>
              <label class="label">Nome fantasia</label>
              <input v-model="form.tradeName" class="field" placeholder="Minha Empresa" />
            </div>
          </div>
          <div>
            <label class="label">CNPJ</label>
            <input :value="form.cnpj" @input="onCnpjInput" class="field" placeholder="00.000.000/0000-00" inputmode="numeric" />
          </div>
          <div>
            <label class="label">Slug do tenant *</label>
            <input v-model="form.tenantSlug" required class="field" placeholder="minha-empresa" />
          </div>
          <hr class="border-slate-100" />
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Nome do responsável *</label>
              <input v-model="form.ownerName" required class="field" placeholder="João Silva" />
            </div>
            <div>
              <label class="label">Email do responsável *</label>
              <input v-model="form.ownerEmail" type="email" required class="field" placeholder="joao@empresa.com" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Usuário *</label>
              <input v-model="form.ownerUsername" required class="field" placeholder="joao" />
            </div>
            <div>
              <label class="label">Senha *</label>
              <input v-model="form.password" type="password" required class="field" placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label class="label">Plano *</label>
            <select v-model="form.planSlug" required class="field">
              <option value="" disabled>Selecione um plano</option>
              <option v-for="plan in plans" :key="plan.id" :value="plan.slug">
                {{ plan.name }} — R$ {{ Number(plan.price).toFixed(2) }}/{{ plan.billingCycle }}
              </option>
            </select>
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="creating" class="btn-primary !w-auto !py-2.5 !px-6">
              {{ creating ? 'Criando...' : 'Criar Tenant' }}
            </button>
            <button type="button" class="btn-secondary" @click="closeCreate">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const tenants = ref<any[]>([])
const plans = ref<any[]>([])
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')

const emptyForm = () => ({
  legalName: '', tradeName: '', cnpj: '', tenantSlug: '',
  ownerName: '', ownerEmail: '', ownerUsername: '', password: '', planSlug: ''
})
const form = ref(emptyForm())

async function load() {
  const [tr, pr] = await Promise.all([
    api.get('/api/v1/master/tenants'),
    api.get('/api/v1/master/plans')
  ])
  tenants.value = tr.data.data ?? []
  plans.value = (pr.data.data ?? []).filter((p: any) => p.active)
}

function goDetail(id: string) {
  router.push({ name: 'tenant-detail', params: { id } })
}

function statusClass(status: string) {
  if (status === 'ACTIVE' || status === 'TRIALING') return '!bg-emerald-50 !text-emerald-800'
  if (status === 'PAST_DUE') return '!bg-amber-50 !text-amber-800'
  if (status === 'CANCELED' || status === 'BLOCKED') return '!bg-red-50 !text-red-800'
  return ''
}

async function block(id: string) {
  await api.post(`/api/v1/master/tenants/${id}/block`, { reason: 'Bloqueio manual pelo heAdmin' })
  await load()
}
async function unblock(id: string) {
  await api.post(`/api/v1/master/tenants/${id}/unblock`)
  await load()
}

function formatCnpj(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14)
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2')
}
function onCnpjInput(e: Event) { form.value.cnpj = formatCnpj((e.target as HTMLInputElement).value) }

function closeCreate() { showCreate.value = false; form.value = emptyForm(); createError.value = '' }

async function createTenant() {
  createError.value = ''
  creating.value = true
  try {
    await api.post('/api/v1/master/tenants', form.value)
    await load()
    closeCreate()
  } catch (e: any) {
    createError.value = e.response?.data?.message ?? 'Erro ao criar tenant'
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>
