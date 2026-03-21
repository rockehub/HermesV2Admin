<template>
  <div>
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <p class="badge">Catálogo</p>
        <h1 class="text-3xl font-bold mt-3 mb-1 text-slate-900">Planos</h1>
        <p class="text-slate-500 text-sm">{{ plans.length }} plano(s) cadastrado(s)</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary" @click="load">Atualizar</button>
        <button class="btn-primary !w-auto !py-2.5 !px-5" @click="openCreate">+ Novo Plano</button>
      </div>
    </div>

    <div v-if="!plans.length" class="card py-12 text-center text-slate-400 text-sm">Nenhum plano cadastrado.</div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5" v-else>
      <article v-for="plan in plans" :key="plan.id" class="card border-slate-100 relative" :class="{ 'opacity-50': !plan.active }">
        <div class="flex items-start justify-between gap-2 mb-1">
          <p class="text-xs text-slate-400 uppercase tracking-widest font-medium">{{ plan.billingCycle }}</p>
          <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="plan.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
            {{ plan.active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
        <h2 class="text-xl font-bold mt-1 mb-0.5 text-slate-900">{{ plan.name }}</h2>
        <p class="text-slate-400 text-xs mb-3">slug: {{ plan.slug }}</p>
        <p class="text-3xl font-bold text-teal-700 mb-3">R$ {{ Number(plan.price).toFixed(2) }}</p>
        <p class="text-slate-500 text-sm mb-4">{{ plan.description }}</p>
        <div class="flex items-center gap-3 text-xs text-slate-400 mb-4">
          <span>{{ plan.trialDays }}d trial</span>
          <span>·</span>
          <span>ordem {{ plan.sortOrder }}</span>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary text-xs !py-1.5 !px-3" @click="openEdit(plan)">Editar</button>
          <button class="btn-secondary text-xs !py-1.5 !px-3" @click="toggle(plan.id)">
            {{ plan.active ? 'Desativar' : 'Ativar' }}
          </button>
        </div>
      </article>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
        <h2 class="text-xl font-bold text-slate-900 mb-6">{{ editingId ? 'Editar Plano' : 'Novo Plano' }}</h2>
        <form @submit.prevent="save" class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Nome *</label>
              <input v-model="form.name" required class="field" placeholder="Starter" />
            </div>
            <div>
              <label class="label">Slug *</label>
              <input v-model="form.slug" :disabled="!!editingId" required class="field" placeholder="starter-monthly" />
            </div>
          </div>
          <div>
            <label class="label">Descrição</label>
            <textarea v-model="form.description" class="field resize-none" rows="2" placeholder="Descreva o plano..." />
          </div>
          <div v-if="!editingId">
            <label class="label">Ciclo de cobrança *</label>
            <select v-model="form.billingCycle" required class="field">
              <option value="">Selecione</option>
              <option value="MONTHLY">Mensal</option>
              <option value="YEARLY">Anual</option>
            </select>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="label">Preço (R$) *</label>
              <input v-model="form.price" type="number" step="0.01" min="0" required class="field" placeholder="99.90" />
            </div>
            <div>
              <label class="label">Trial (dias)</label>
              <input v-model="form.trialDays" type="number" min="0" class="field" placeholder="7" />
            </div>
            <div>
              <label class="label">Ordem</label>
              <input v-model="form.sortOrder" type="number" min="0" class="field" placeholder="0" />
            </div>
          </div>
          <div>
            <label class="label">Resumo de features</label>
            <textarea v-model="form.featureSummary" class="field resize-none" rows="3" placeholder="Uma feature por linha..." />
          </div>
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
          <div class="flex gap-3 pt-2">
            <button type="submit" :disabled="saving" class="btn-primary !w-auto !py-2.5 !px-6">
              {{ saving ? 'Salvando...' : (editingId ? 'Salvar' : 'Criar Plano') }}
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

const plans = ref<any[]>([])
const showModal = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')

const emptyForm = () => ({ name: '', slug: '', description: '', billingCycle: '', price: '', trialDays: 0, sortOrder: 0, featureSummary: '' })
const form = ref(emptyForm())

async function load() {
  const response = await api.get('/api/v1/master/plans')
  plans.value = response.data.data ?? []
}

function openCreate() { editingId.value = null; form.value = emptyForm(); formError.value = ''; showModal.value = true }
function openEdit(plan: any) {
  editingId.value = plan.id
  form.value = { name: plan.name, slug: plan.slug, description: plan.description ?? '', billingCycle: plan.billingCycle, price: plan.price, trialDays: plan.trialDays, sortOrder: plan.sortOrder, featureSummary: plan.featureSummary ?? '' }
  formError.value = ''
  showModal.value = true
}
function closeModal() { showModal.value = false }

async function save() {
  formError.value = ''
  saving.value = true
  try {
    if (editingId.value) {
      await api.put(`/api/v1/master/plans/${editingId.value}`, form.value)
    } else {
      await api.post('/api/v1/master/plans', form.value)
    }
    await load()
    closeModal()
  } catch (e: any) {
    formError.value = e.response?.data?.message ?? 'Erro ao salvar plano'
  } finally {
    saving.value = false
  }
}

async function toggle(id: string) {
  await api.patch(`/api/v1/master/plans/${id}/toggle`)
  await load()
}

onMounted(load)
</script>
