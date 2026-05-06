'use client'

import { useState, useCallback, useMemo } from 'react'
import { CalendarDays, List, BarChart3, Search, SlidersHorizontal, CircleDashed, CheckCircle2, AlertCircle, Hash } from 'lucide-react'
import { CATEGORIAS_CAP } from '@/lib/sst/cap-client'
import { CronogramaMensual } from './CronogramaMensual'
import { CronogramaLista } from './CronogramaLista'
import { CronogramaTrimestral } from './CronogramaTrimestral'
import { CronogramaLeyenda } from './CronogramaLeyenda'
import type { CapActividadFields, CapProgramacionFields } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>
type Prog = AirtableRecord<CapProgramacionFields>

type Modo = 'mensual' | 'trimestral' | 'lista'

const HOY_STR = new Date().toISOString().split('T')[0]

function leerModo(): Modo {
  if (typeof window === 'undefined') return 'mensual'
  const v = localStorage.getItem('cronograma_modo')
  if (v === 'mensual' || v === 'trimestral' || v === 'lista') return v
  // Default móvil → lista
  if (window.innerWidth < 768) return 'lista'
  return 'mensual'
}

interface Props {
  actividades: Actividad[]
  programaciones: Prog[]
  onUpdate: () => void
}

const TABS: { key: Modo; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'mensual', label: 'Vista mensual', Icon: CalendarDays },
  { key: 'trimestral', label: 'Trimestral', Icon: BarChart3 },
  { key: 'lista', label: 'Lista', Icon: List },
]

export function CronogramaContainer({ actividades, programaciones, onUpdate }: Props) {
  const [modo, setModo] = useState<Modo>(leerModo)
  const [filtroEstados, setFiltroEstados] = useState<string[]>([])
  const [catFiltro, setCatFiltro] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)

  const cambiarModo = useCallback((m: Modo) => {
    setModo(m)
    if (typeof window !== 'undefined') localStorage.setItem('cronograma_modo', m)
  }, [])

  const toggleEstado = useCallback((estado: string) => {
    setFiltroEstados(prev =>
      prev.includes(estado) ? prev.filter(e => e !== estado) : [...prev, estado]
    )
  }, [])

  // Set de IDs de actividades válidas — para filtrar programaciones huérfanas
  const actIdsValidos = useMemo(() => new Set(actividades.map(a => a.id)), [actividades])

  // Programaciones sin actividades fantasmas (cascade delete puede no haberse ejecutado antes)
  const programacionesValidas = useMemo(
    () => programaciones.filter(p => actIdsValidos.has(p.fields.actividad_id)),
    [programaciones, actIdsValidos],
  )

  // Filtrar actividades por búsqueda
  const actsFiltradas = busqueda.trim()
    ? actividades.filter(a =>
        a.fields.tema.toLowerCase().includes(busqueda.toLowerCase()) ||
        (a.fields.responsable ?? '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : actividades

  // KPIs rápidos del cronograma
  const kpis = useMemo(() => {
    const total = programacionesValidas.length
    const ejecutadas = programacionesValidas.filter(p => p.fields.estado === 'Ejecutado').length
    const vencidas = programacionesValidas.filter(p =>
      p.fields.estado === 'Programado' && !!p.fields.fecha_programada && p.fields.fecha_programada < HOY_STR
    ).length
    const reprog = programacionesValidas.filter(p => p.fields.estado === 'Reprogramado').length
    return { total, ejecutadas, vencidas, reprog, actividades: actividades.length }
  }, [programacionesValidas, actividades])

  return (
    <div className="flex flex-col gap-5">
      {/* Tira de KPIs rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile icon={Hash} label="Actividades" value={kpis.actividades} color="var(--sst-dark-700)" bg="var(--sst-dark-100)" />
        <KpiTile icon={CircleDashed} label="Programaciones" value={kpis.total} color="#2563EB" bg="rgba(37,99,235,0.08)" />
        <KpiTile icon={CheckCircle2} label="Ejecutadas" value={kpis.ejecutadas} color="#166534" bg="rgba(22,101,52,0.08)" />
        <KpiTile icon={AlertCircle} label="Vencidas" value={kpis.vencidas} color="#DC3545" bg="rgba(220,53,69,0.08)" />
      </div>
      {/* Tabs + controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center rounded-xl p-1 gap-0.5" style={{ background: 'var(--sst-dark-100)' }}>
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => cambiarModo(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                modo === key ? 'bg-white shadow-sm' : ''
              }`}
              style={{ color: modo === key ? 'var(--sst-green-700)' : 'var(--sst-dark-500)' }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="flex-1 flex items-center max-w-xs rounded-xl border px-2.5 gap-2" style={{ borderColor: 'var(--border)', background: '#fff', height: 36 }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--sst-dark-500)' }} />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 bg-transparent text-xs outline-none border-none"
            style={{ color: 'var(--sst-dark-900)' }}
          />
        </div>

        {/* Botón filtros */}
        <button
          onClick={() => setShowFiltros(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
            showFiltros || catFiltro || filtroEstados.length > 0
              ? 'border-[var(--sst-green-700)] text-[var(--sst-green-700)]'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
          style={showFiltros || catFiltro || filtroEstados.length > 0 ? { background: 'var(--sst-cumple-bg)' } : undefined}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {(catFiltro || filtroEstados.length > 0) && (
            <span style={{ background: 'var(--sst-green-700)' }} className="text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {(catFiltro ? 1 : 0) + filtroEstados.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ border: '1px solid var(--border)', background: 'var(--sst-dark-100)' }}>
          {/* Categoría */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--sst-dark-500)' }}>Categoría</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCatFiltro('')}
                className="text-xs px-3 py-1 rounded-full border transition-colors"
                style={catFiltro === ''
                  ? { background: 'var(--sst-green-700)', color: '#fff', borderColor: 'transparent' }
                  : { background: 'var(--surface)', color: 'var(--sst-dark-700)', borderColor: 'var(--border)' }}
              >
                Todas
              </button>
              {CATEGORIAS_CAP.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFiltro(cat === catFiltro ? '' : cat)}
                  className="text-xs px-3 py-1 rounded-full border transition-colors"
                  style={catFiltro === cat
                    ? { background: 'var(--sst-green-700)', color: '#fff', borderColor: 'transparent' }
                    : { background: 'var(--surface)', color: 'var(--sst-dark-700)', borderColor: 'var(--border)' }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Estados */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--sst-dark-500)' }}>Estado</p>
            <CronogramaLeyenda
              programaciones={programacionesValidas}
              filtroEstados={filtroEstados}
              onToggle={toggleEstado}
            />
          </div>
        </div>
      )}

      {/* Vista activa */}
      {modo === 'mensual' && (
        <CronogramaMensual
          actividades={actsFiltradas}
          programaciones={programacionesValidas}
          filtroEstados={filtroEstados}
          catFiltro={catFiltro}
          onUpdate={onUpdate}
        />
      )}
      {modo === 'trimestral' && (
        <CronogramaTrimestral
          actividades={actsFiltradas}
          programaciones={programacionesValidas}
          catFiltro={catFiltro}
        />
      )}
      {modo === 'lista' && (
        <CronogramaLista
          actividades={actsFiltradas}
          programaciones={programacionesValidas}
          filtroEstados={filtroEstados}
          catFiltro={catFiltro}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}

// ─── Tile de KPI compacto ───
interface KpiTileProps {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: number
  color: string
  bg: string
}
function KpiTile({ icon: Icon, label, value, color, bg }: KpiTileProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{ background: bg, border: `1px solid ${color}1A` }}
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: `${color}1F` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-semibold leading-tight" style={{ color: 'var(--sst-dark-500)' }}>
          {label}
        </p>
        <p className="text-xl font-bold leading-tight" style={{ color, fontFamily: 'var(--font-poppins)' }}>
          {value}
        </p>
      </div>
    </div>
  )
}
