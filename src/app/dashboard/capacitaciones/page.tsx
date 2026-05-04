'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { CapacitacionesTable } from '@/components/sst/capacitaciones/CapacitacionesTable'
import { KpiCard } from '@/components/sst/capacitaciones/KpiCard'
import {
  BookOpen, Plus, Calendar, ClipboardCheck, BarChart3, AlertTriangle, Award,
} from 'lucide-react'
import { CATEGORIAS_CAP, PROVEEDORES_CAP, calcularPct } from '@/lib/sst/cap-client'
import type { CapActividadFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>

function authHeaders() {
  const token = localStorage.getItem('authToken')
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

const FORM_INICIAL = {
  item_numero: '',
  tema: '',
  objetivo: '',
  categoria: '',
  proveedor: 'SST',
  responsable: '',
  dirigido_a: '',
  normativa_aplicable: '',
  requiere_certificacion: false,
}

export default function CapacitacionesPage() {
  useAuth()
  const router = useRouter()
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalNueva, setModalNueva] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState<typeof FORM_INICIAL>(FORM_INICIAL)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/sst/capacitaciones', { headers: authHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setActividades(data.records ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando datos')
    }
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── KPIs calculados en el cliente ──────────────────────────────────────────
  const total       = actividades.length
  const completadas = actividades.filter(a => a.fields.estado_general === 'Completado').length
  const enEjecucion = actividades.filter(a => a.fields.estado_general === 'En ejecución').length
  const sinFecha    = actividades.filter(a => a.fields.estado_general === 'Sin programar').length
  const pctCumplimiento = calcularPct(completadas + enEjecucion, total)

  const crearActividad = async () => {
    if (!form.tema || !form.categoria) return
    setGuardando(true)
    setError(null)
    try {
      const res = await fetch('/api/sst/capacitaciones', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...form,
          item_numero: form.item_numero ? Number(form.item_numero) : 0,
          anio: 2026,
          requiere_certificacion: form.requiere_certificacion,
        }),
      })
      if (!res.ok) {
        let errMsg = `Error ${res.status}`
        try {
          const err = await res.json()
          errMsg = err.message ?? errMsg
        } catch { /* body vacío o no-JSON */ }
        throw new Error(errMsg)
      }
      setModalNueva(false)
      setForm(FORM_INICIAL)
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
    setGuardando(false)
  }

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <PageHeader
        title="Plan de Capacitaciones SST 2026"
        description="72 actividades formativas — Decreto 1072 de 2015 / Res. 0312 de 2019"
        icon={BookOpen}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/dashboard/capacitaciones/programacion')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Calendar className="w-4 h-4" /> Cronograma
            </button>
            <button
              onClick={() => router.push('/dashboard/capacitaciones/indicadores')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> Indicadores
            </button>
            <button
              onClick={() => setModalNueva(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nueva actividad
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total actividades</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-400 mt-1">Plan anual 2026</p>
        </Card>

        <KpiCard
          label="% Avance plan"
          value={pctCumplimiento}
          meta={80}
          icon={BarChart3}
          description={`${completadas + enEjecucion} activas / ${total} total`}
        />

        <Card className="p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Completadas</span>
            <ClipboardCheck className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">{completadas}</p>
          <p className="text-xs text-gray-400 mt-1">de {total}</p>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Sin programar</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-600">{sinFecha}</p>
          <p className="text-xs text-orange-400 mt-1">requieren programación</p>
        </Card>
      </div>

      {/* Tabla principal */}
      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertTriangle}
            title="Error cargando actividades"
            description={error}
            action={<button onClick={cargar} className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Reintentar</button>}
          />
        ) : actividades.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Sin actividades"
            description="El catálogo de capacitaciones está vacío. Crea la primera actividad."
            action={<button onClick={() => setModalNueva(true)} className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Nueva actividad</button>}
          />
        ) : (
          <CapacitacionesTable
            actividades={actividades}
            onSelect={a => router.push(`/dashboard/capacitaciones/${a.id}`)}
          />
        )}
      </Card>

      {/* Modal nueva actividad */}
      <Modal open={modalNueva} onClose={() => { setModalNueva(false); setError(null) }} title="Nueva actividad">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">N° ítem</label>
              <input
                type="number" min="1"
                value={form.item_numero}
                onChange={e => set('item_numero', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Categoría *</label>
              <select
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar…</option>
                {CATEGORIAS_CAP.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Tema / Actividad *</label>
            <input
              type="text"
              value={form.tema}
              onChange={e => set('tema', e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Objetivo formativo</label>
            <textarea
              rows={3}
              value={form.objetivo}
              onChange={e => set('objetivo', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Proveedor</label>
              <select
                value={form.proveedor}
                onChange={e => set('proveedor', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROVEEDORES_CAP.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Responsable</label>
              <input
                type="text"
                value={form.responsable}
                onChange={e => set('responsable', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Dirigido a</label>
            <input
              type="text"
              value={form.dirigido_a}
              onChange={e => set('dirigido_a', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Normativa aplicable</label>
            <input
              type="text"
              placeholder="Ej: Resolución 0312 Art. 11"
              value={form.normativa_aplicable}
              onChange={e => set('normativa_aplicable', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.requiere_certificacion}
              onChange={e => set('requiere_certificacion', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="flex items-center gap-1 text-sm text-gray-700">
              <Award className="w-4 h-4 text-amber-500" /> Requiere certificación
            </span>
          </label>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => { setModalNueva(false); setError(null); setForm(FORM_INICIAL) }}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={crearActividad}
              disabled={guardando || !form.tema || !form.categoria}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Crear actividad'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

