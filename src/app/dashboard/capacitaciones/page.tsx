'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { CapacitacionesTable } from '@/components/sst/capacitaciones/CapacitacionesTable'
import { KpiRing } from '@/components/sst/capacitaciones/KpiRing'
import { ToastContainer, useToast } from '@/components/sst/capacitaciones/Toast'
import {
  BookOpen, Plus, Calendar, ClipboardCheck, BarChart3,
  AlertTriangle, Award, RefreshCw, BookMarked, PlayCircle,
} from 'lucide-react'
import { CATEGORIAS_CAP, PROVEEDORES_CAP, calcularPct, getCategoriaColor } from '@/lib/sst/cap-client'
import type { CapActividadFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
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

function SkeletonKpi() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-1.5 bg-gray-200 rounded w-full" />
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="animate-pulse flex flex-col gap-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  )
}

export default function CapacitacionesPage() {
  useAuth()
  const router = useRouter()
  const { toasts, toast, remove } = useToast()

  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [modalNueva, setModalNueva] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<typeof FORM_INICIAL>(FORM_INICIAL)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/sst/capacitaciones', { headers: authHeaders() })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setActividades(data.records ?? [])
    } catch (e) {
      toast.error('Error al cargar', e instanceof Error ? e.message : 'Error desconocido')
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const total       = actividades.length
  const completadas = actividades.filter(a => a.fields.estado_general === 'Completado').length
  const enEjecucion = actividades.filter(a => a.fields.estado_general === 'En ejecución').length
  const sinProg     = actividades.filter(a => a.fields.estado_general === 'Sin programar').length
  const pctAvance   = calcularPct(completadas + enEjecucion, total)
  const pctCompl    = calcularPct(completadas, total)

  const distCat = useMemo(() => {
    const acc: Record<string, number> = {}
    actividades.forEach(a => {
      const cat = a.fields.categoria ?? 'Sin categoria'
      acc[cat] = (acc[cat] ?? 0) + 1
    })
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [actividades])

  const crearActividad = async () => {
    if (!form.tema || !form.categoria) {
      setFormError('El tema y la categoria son obligatorios.')
      return
    }
    setGuardando(true)
    setFormError(null)
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
        } catch { /* vacio */ }
        throw new Error(errMsg)
      }
      setModalNueva(false)
      setForm(FORM_INICIAL)
      toast.success('Actividad creada', `"${form.tema}" agregada al plan.`)
      await cargar()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al guardar')
    }
    setGuardando(false)
  }

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <PageHeader
        title="Plan de Capacitaciones SST 2026"
        description="Decreto 1072 de 2015 &middot; Resolucion 0312 de 2019"
        icon={BookOpen}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push('/dashboard/capacitaciones/programacion')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Calendar className="w-4 h-4" /> Cronograma
            </button>
            <button
              onClick={() => router.push('/dashboard/capacitaciones/registro')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" /> Registros
            </button>
            <button
              onClick={() => router.push('/dashboard/capacitaciones/indicadores')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4" /> Indicadores
            </button>
            <button
              onClick={() => setModalNueva(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#2C5F8D] text-white rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nueva actividad
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <SkeletonKpi key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Total actividades</span>
              <BookMarked className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-blue-700 tabular-nums">{total}</p>
            <p className="text-xs text-blue-400">Plan anual 2026</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
            <KpiRing value={pctAvance} meta={80} size={72} strokeWidth={6} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight mb-0.5">Avance</p>
              <p className="text-xs text-gray-400">{completadas + enEjecucion} activas</p>
              <p className="text-xs text-gray-300">meta 80%</p>
            </div>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Completadas</span>
              <ClipboardCheck className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-end gap-1.5">
              <p className="text-4xl font-bold text-green-700 tabular-nums">{completadas}</p>
              <p className="text-sm text-green-500 mb-0.5">/{total}</p>
            </div>
            <div className="w-full bg-green-100 rounded-full h-1">
              <div className="h-1 rounded-full bg-green-500 transition-all duration-700" style={{ width: `${pctCompl}%` }} />
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">En ejecución</span>
              <PlayCircle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-4xl font-bold text-orange-700 tabular-nums">{enEjecucion}</p>
            {sinProg > 0 && (
              <div className="flex items-center gap-1 text-xs text-orange-500">
                <AlertTriangle className="w-3 h-3" />
                {sinProg} sin programar
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && distCat.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {distCat.map(([cat, n]) => (
            <div
              key={cat}
              className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 flex items-center gap-2 hover:shadow-sm transition-shadow"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: getCategoriaColor(cat as never) }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-gray-500 truncate leading-tight">{cat}</p>
                <p className="text-sm font-bold text-gray-800">{n}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Catalogo de actividades</h2>
          <button
            onClick={cargar}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-md hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <SkeletonTable />
        ) : actividades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">Sin actividades en el plan</p>
            <p className="text-xs text-gray-400">Crea la primera actividad del plan de capacitaciones.</p>
            <button
              onClick={() => setModalNueva(true)}
              className="mt-1 flex items-center gap-1.5 px-4 py-2 text-sm bg-[#2C5F8D] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Nueva actividad
            </button>
          </div>
        ) : (
          <CapacitacionesTable
            actividades={actividades}
            onSelect={a => router.push(`/dashboard/capacitaciones/${a.id}`)}
          />
        )}
      </Card>

      <Modal
        open={modalNueva}
        onClose={() => { setModalNueva(false); setFormError(null); setForm(FORM_INICIAL) }}
        title="Nueva actividad de capacitacion"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">N degree item</label>
              <input
                type="number" min="1"
                value={form.item_numero}
                onChange={e => set('item_numero', e.target.value)}
                placeholder="Ej: 1"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Categoria <span className="text-red-500">*</span></label>
              <select
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccionar...</option>
                {CATEGORIAS_CAP.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Tema / Actividad <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.tema}
              onChange={e => set('tema', e.target.value)}
              placeholder="Ej: Uso correcto de EPP para trabajo en alturas"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Objetivo formativo</label>
            <textarea
              rows={2}
              value={form.objetivo}
              onChange={e => set('objetivo', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Proveedor</label>
              <select
                value={form.proveedor}
                onChange={e => set('proveedor', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Dirigido a</label>
              <input
                type="text"
                value={form.dirigido_a}
                onChange={e => set('dirigido_a', e.target.value)}
                placeholder="Ej: Todo el personal"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Normativa aplicable</label>
              <input
                type="text"
                value={form.normativa_aplicable}
                onChange={e => set('normativa_aplicable', e.target.value)}
                placeholder="Ej: Res. 0312 Art. 11"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={form.requiere_certificacion}
              onChange={e => set('requiere_certificacion', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600"
            />
            <span className="flex items-center gap-1.5 text-sm text-gray-700">
              <Award className="w-4 h-4 text-amber-500" />
              Requiere certificacion
            </span>
          </label>

          {formError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => { setModalNueva(false); setFormError(null); setForm(FORM_INICIAL) }}
              className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={crearActividad}
              disabled={guardando || !form.tema || !form.categoria}
              className="flex-1 px-4 py-2 text-sm bg-[#2C5F8D] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 font-medium"
            >
              {guardando ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Guardando...
                </span>
              ) : 'Crear actividad'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
