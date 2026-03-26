<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import api from '../api'

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INSTALLING' | 'INSTALLED' | 'FAILED'
type Risk   = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null

interface PypiInfo {
  name?: string
  version?: string
  summary?: string
  author?: string
  license?: string
  homePage?: string
  releaseUrl?: string
  latestVersion?: string
  downloadsLastMonth?: number
  error?: string
}

interface Vulnerability {
  id: string
  summary: string
  severity: string
  url: string
}

interface DependencyRequest {
  id: string
  tenantId: string
  packageName: string
  packageVersion: string | null
  justification: string
  status: Status
  pypiInfo: PypiInfo | null
  vulnerabilities: Vulnerability[] | null
  riskLevel: Risk
  reviewNotes: string | null
  requestedAt: string
  installedAt: string | null
  signature: { moduleName?: string; members?: { name: string; kind: string }[] } | null
}

// ── State ─────────────────────────────────────────────────────────────────────
const requests   = ref<DependencyRequest[]>([])
const loading    = ref(false)
const filterStatus = ref<Status | ''>('')
const selected   = ref<DependencyRequest | null>(null)
const reviewNotes = ref('')
const actionLoading = ref(false)

// ── Load ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const params = filterStatus.value ? { status: filterStatus.value } : {}
    const res = await api.get('/api/v1/master/workflow-dependencies', { params })
    requests.value = res.data.data ?? res.data
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Filtered ──────────────────────────────────────────────────────────────────
const filtered = computed(() => {
  if (!filterStatus.value) return requests.value
  return requests.value.filter(r => r.status === filterStatus.value)
})

const pending  = computed(() => requests.value.filter(r => r.status === 'PENDING').length)

// ── Actions ───────────────────────────────────────────────────────────────────
async function approve() {
  if (!selected.value) return
  actionLoading.value = true
  try {
    await api.post(`/api/v1/master/workflow-dependencies/${selected.value.id}/approve`, { notes: reviewNotes.value || null })
    await load()
    selected.value = requests.value.find(r => r.id === selected.value!.id) ?? null
  } finally { actionLoading.value = false }
}

async function reject() {
  if (!selected.value || !reviewNotes.value) {
    alert('Informe o motivo da rejeição')
    return
  }
  actionLoading.value = true
  try {
    await api.post(`/api/v1/master/workflow-dependencies/${selected.value.id}/reject`, { notes: reviewNotes.value })
    await load()
    selected.value = requests.value.find(r => r.id === selected.value!.id) ?? null
  } finally { actionLoading.value = false }
}

async function install() {
  if (!selected.value) return
  actionLoading.value = true
  try {
    await api.post(`/api/v1/master/workflow-dependencies/${selected.value.id}/install`)
    await load()
    selected.value = requests.value.find(r => r.id === selected.value!.id) ?? null
  } finally { actionLoading.value = false }
}

async function refreshAnalysis() {
  if (!selected.value) return
  actionLoading.value = true
  try {
    const res = await api.post(`/api/v1/master/workflow-dependencies/${selected.value.id}/refresh-analysis`)
    const updated = res.data.data ?? res.data
    const idx = requests.value.findIndex(r => r.id === updated.id)
    if (idx !== -1) requests.value[idx] = updated
    selected.value = updated
  } finally { actionLoading.value = false }
}

const signatureLoading = ref(false)
const signatureMembers = ref<number | null>(null)

async function refreshSignature() {
  if (!selected.value) return
  signatureLoading.value = true
  signatureMembers.value = null
  try {
    const res = await api.post(`/api/v1/master/workflow-dependencies/${selected.value.id}/refresh-signature`)
    const updated = res.data.data ?? res.data
    const idx = requests.value.findIndex(r => r.id === updated.id)
    if (idx !== -1) requests.value[idx] = updated
    selected.value = updated
    signatureMembers.value = (updated.signature?.members ?? []).length
  } finally { signatureLoading.value = false }
}

function select(r: DependencyRequest) {
  selected.value = r
  reviewNotes.value = r.reviewNotes ?? ''
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function fmtDownloads(n?: number) {
  if (n == null || n < 0) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'k'
  return String(n)
}

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
  INSTALLING: 'Instalando', INSTALLED: 'Instalado', FAILED: 'Falhou'
}
const STATUS_CLASS: Record<Status, string> = {
  PENDING:    'bg-amber-100 text-amber-800',
  APPROVED:   'bg-blue-100 text-blue-800',
  REJECTED:   'bg-red-100 text-red-700',
  INSTALLING: 'bg-purple-100 text-purple-800',
  INSTALLED:  'bg-emerald-100 text-emerald-800',
  FAILED:     'bg-red-100 text-red-800',
}
const RISK_CLASS: Record<string, string> = {
  LOW:      'bg-emerald-100 text-emerald-800',
  MEDIUM:   'bg-amber-100 text-amber-800',
  HIGH:     'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Dependências Python</h1>
        <p class="text-sm text-slate-500 mt-0.5">Solicitações de pacotes PyPI dos tenants</p>
      </div>
      <span v-if="pending" class="badge">{{ pending }} pendente{{ pending > 1 ? 's' : '' }}</span>
    </div>

    <div class="flex gap-5 items-start">

      <!-- Left: list -->
      <div class="flex-1 min-w-0">
        <!-- Filter -->
        <div class="flex flex-wrap gap-2 mb-4">
          <button
            v-for="s in (['', 'PENDING', 'APPROVED', 'INSTALLED', 'REJECTED', 'FAILED'] as const)"
            :key="s"
            class="px-3 py-1.5 rounded-xl text-xs font-medium border transition"
            :class="filterStatus === s
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'"
            @click="filterStatus = s; load()"
          >{{ s === '' ? 'Todos' : STATUS_LABEL[s] }}</button>
        </div>

        <div class="card p-0 overflow-hidden">
          <div v-if="loading" class="p-8 text-center text-sm text-slate-400">Carregando...</div>
          <div v-else-if="!filtered.length" class="p-8 text-center text-sm text-slate-400">Nenhuma solicitação encontrada</div>
          <div v-else class="max-h-[calc(100vh-14rem)] overflow-y-auto">
            <table class="data-table">
              <thead class="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th>Pacote</th>
                  <th>Tenant</th>
                  <th>Risco</th>
                  <th>Status</th>
                  <th>Solicitado em</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in filtered"
                  :key="r.id"
                  class="cursor-pointer hover:bg-slate-50 transition"
                  :class="selected?.id === r.id ? 'bg-teal-50' : ''"
                  @click="select(r)"
                >
                  <td>
                    <span class="font-mono text-sm font-medium text-slate-900">{{ r.packageName }}</span>
                    <span v-if="r.packageVersion" class="ml-1.5 text-xs text-slate-400">{{ r.packageVersion }}</span>
                  </td>
                  <td class="text-xs text-slate-500 font-mono">{{ r.tenantId.slice(0, 8) }}…</td>
                  <td>
                    <span v-if="r.riskLevel" class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="RISK_CLASS[r.riskLevel]">
                      {{ r.riskLevel }}
                    </span>
                    <span v-else class="text-xs text-slate-300">—</span>
                  </td>
                  <td>
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="STATUS_CLASS[r.status]">
                      {{ STATUS_LABEL[r.status] }}
                    </span>
                  </td>
                  <td class="text-xs text-slate-500">{{ fmtDate(r.requestedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: detail panel — sticky with its own scroll -->
      <div v-if="selected" class="w-96 shrink-0 sticky top-0 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-4 pb-4 pr-0.5">

        <!-- Package info -->
        <div class="card">
          <div class="flex items-start justify-between mb-3">
            <div>
              <h2 class="font-bold text-slate-900 font-mono">{{ selected.packageName }}</h2>
              <span v-if="selected.packageVersion" class="text-xs text-slate-400">versão solicitada: {{ selected.packageVersion }}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="STATUS_CLASS[selected.status]">
              {{ STATUS_LABEL[selected.status] }}
            </span>
          </div>

          <!-- PyPI data -->
          <div v-if="selected.pypiInfo && !selected.pypiInfo.error" class="space-y-2 text-sm">
            <p v-if="selected.pypiInfo.summary" class="text-slate-600 text-xs leading-relaxed line-clamp-3">{{ selected.pypiInfo.summary }}</p>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <span class="text-slate-400">Autor</span>
                <p class="font-medium truncate" :title="String(selected.pypiInfo.author || '')">{{ selected.pypiInfo.author || '—' }}</p>
              </div>
              <div>
                <span class="text-slate-400">Licença</span>
                <p class="font-medium truncate" :title="String(selected.pypiInfo.license || '')">{{ selected.pypiInfo.license || '—' }}</p>
              </div>
              <div>
                <span class="text-slate-400">Última versão</span>
                <p class="font-medium">{{ selected.pypiInfo.latestVersion || '—' }}</p>
              </div>
              <div>
                <span class="text-slate-400">Downloads/mês</span>
                <p class="font-medium" :class="(selected.pypiInfo.downloadsLastMonth ?? 0) < 1000 ? 'text-amber-600' : 'text-emerald-600'">
                  {{ fmtDownloads(selected.pypiInfo.downloadsLastMonth) }}
                </p>
              </div>
            </div>
            <a v-if="selected.pypiInfo.releaseUrl" :href="selected.pypiInfo.releaseUrl" target="_blank"
               class="text-xs text-teal-600 hover:underline">Ver no PyPI →</a>
          </div>
          <div v-else-if="selected.pypiInfo?.error" class="text-xs text-red-500">{{ selected.pypiInfo.error }}</div>
          <div v-else class="text-xs text-slate-400 italic">Análise PyPI em andamento…</div>

          <button class="mt-3 text-xs text-slate-400 hover:text-teal-600 transition" :disabled="actionLoading" @click="refreshAnalysis">
            ↻ Atualizar análise
          </button>
        </div>

        <!-- Vulnerabilities -->
        <div class="card">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Vulnerabilidades (OSV)</h3>
          <div v-if="selected.riskLevel" class="flex items-center gap-2 mb-3">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold" :class="RISK_CLASS[selected.riskLevel]">
              Risco {{ selected.riskLevel }}
            </span>
            <span class="text-xs text-slate-400">{{ (selected.vulnerabilities ?? []).length }} CVE(s) encontrado(s)</span>
          </div>
          <div v-if="selected.vulnerabilities?.length" class="space-y-2 max-h-40 overflow-y-auto">
            <div v-for="v in selected.vulnerabilities" :key="v.id"
                 class="rounded-xl border border-slate-100 px-3 py-2 text-xs">
              <div class="flex items-center gap-2">
                <a :href="v.url" target="_blank" class="font-mono font-semibold text-slate-800 hover:text-teal-600">{{ v.id }}</a>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold" :class="RISK_CLASS[v.severity] ?? 'bg-slate-100 text-slate-600'">{{ v.severity }}</span>
              </div>
              <p class="text-slate-500 mt-0.5">{{ v.summary }}</p>
            </div>
          </div>
          <p v-else-if="selected.riskLevel === 'LOW'" class="text-xs text-emerald-600">Nenhuma vulnerabilidade conhecida ✓</p>
          <p v-else class="text-xs text-slate-400 italic">Aguardando análise OSV…</p>
        </div>

        <!-- Justification -->
        <div class="card">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Justificativa do tenant</h3>
          <p class="text-xs text-slate-700 leading-relaxed line-clamp-4">{{ selected.justification }}</p>
          <p class="text-xs text-slate-400 mt-2">Solicitado em {{ fmtDate(selected.requestedAt) }}</p>
          <p v-if="selected.installedAt" class="text-xs text-emerald-600 mt-0.5">Instalado em {{ fmtDate(selected.installedAt) }}</p>
        </div>

        <!-- Review -->
        <div v-if="selected.status === 'PENDING'" class="card space-y-3">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Revisão</h3>
          <div>
            <label class="label">Notas (obrigatório para rejeição)</label>
            <textarea v-model="reviewNotes" class="field text-sm" rows="3" placeholder="Motivo da decisão…" />
          </div>
          <div class="flex gap-2">
            <button class="btn-primary py-2 text-sm" :disabled="actionLoading" @click="approve">
              ✓ Aprovar
            </button>
            <button class="btn-secondary text-sm flex-1" :disabled="actionLoading" @click="reject">
              ✗ Rejeitar
            </button>
          </div>
        </div>

        <!-- Notes (reviewed) -->
        <div v-else-if="selected.reviewNotes" class="card">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Notas da revisão</h3>
          <p class="text-sm text-slate-700">{{ selected.reviewNotes }}</p>
        </div>

        <!-- Install button -->
        <div v-if="selected.status === 'APPROVED' || selected.status === 'FAILED'" class="card">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Instalação</h3>
          <p v-if="selected.status === 'FAILED'" class="text-xs text-red-500 mb-2">
            Última tentativa falhou. Verifique o executável Python configurado no servidor.
          </p>
          <button class="btn-primary py-2 text-sm" :disabled="actionLoading" @click="install">
            {{ actionLoading ? 'Instalando…' : '⬇ Instalar pacote' }}
          </button>
        </div>

        <div v-if="selected.status === 'INSTALLING'" class="card text-center text-sm text-purple-700">
          ⏳ Instalação em andamento…
        </div>

        <!-- Autocomplete signature (INSTALLED only) -->
        <div v-if="selected.status === 'INSTALLED'" class="card">
          <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Assinatura (Autocomplete)</h3>
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-700">
              <template v-if="selected.signature?.members?.length">
                <span class="font-medium text-emerald-600">{{ selected.signature.members.length }}</span>
                <span class="text-slate-500"> membros disponíveis</span>
                <span v-if="selected.signature.moduleName" class="ml-1 text-xs text-slate-400">({{ selected.signature.moduleName }})</span>
              </template>
              <span v-else class="text-amber-600 text-xs">
                Nenhum membro indexado — autocomplete indisponível
              </span>
            </div>
            <button
              class="shrink-0 ml-3 flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-100 disabled:opacity-50"
              :disabled="signatureLoading"
              @click="refreshSignature"
            >
              <svg v-if="!signatureLoading" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <svg v-else class="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {{ signatureLoading ? 'Carregando…' : 'Recarregar' }}
            </button>
          </div>
          <p v-if="signatureMembers !== null && !signatureLoading" class="mt-2 text-xs text-emerald-600">
            ✓ Assinatura atualizada — {{ signatureMembers }} membros indexados
          </p>
          <!-- Member preview (first 8) -->
          <div v-if="selected.signature?.members?.length" class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="m in selected.signature.members.slice(0, 8)"
              :key="m.name"
              class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
              :title="m.kind"
            >{{ m.name }}</span>
            <span v-if="selected.signature.members.length > 8" class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
              +{{ selected.signature.members.length - 8 }} mais
            </span>
          </div>
        </div>

      </div>
      <div v-else class="w-96 shrink-0 sticky top-0 card flex items-center justify-center h-48 text-sm text-slate-400">
        Selecione uma solicitação
      </div>
    </div>
  </div>
</template>
