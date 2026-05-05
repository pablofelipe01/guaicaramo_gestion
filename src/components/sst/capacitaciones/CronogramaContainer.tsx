'use client'

import { useState, useCallback } from 'react'
import { CalendarDays, List, BarChart3, Search, SlidersHorizontal } from 'lucide-react'
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

  // Filtrar actividades por búsqueda
  const actsFiltradas = busqueda.trim()
    ? actividades.filter(a =>
        a.fields.tema.toLowerCase().includes(busqueda.toLowerCase()) ||
        (a.fields.responsable ?? '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : actividades

  return (
    <div className="flex flex-col gap-5">
      {/* Tabs + controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => cambiarModo(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                modo === key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="flex-1 relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Botón filtros */}
        <button
          onClick={() => setShowFiltros(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
            showFiltros || catFiltro || filtroEstados.length > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
          {(catFiltro || filtroEstados.length > 0) && (
            <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {(catFiltro ? 1 : 0) + filtroEstados.length}
            </span>
          )}
        </button>
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
          {/* Categoría */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Categoría</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCatFiltro('')}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  catFiltro === '' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                Todas
              </button>
              {CATEGORIAS_CAP.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFiltro(cat === catFiltro ? '' : cat)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    catFiltro === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Estados */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Estado</p>
            <CronogramaLeyenda
              programaciones={programaciones}
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
          programaciones={programaciones}
          filtroEstados={filtroEstados}
          catFiltro={catFiltro}
          onUpdate={onUpdate}
        />
      )}
      {modo === 'trimestral' && (
        <CronogramaTrimestral
          actividades={actsFiltradas}
          programaciones={programaciones}
          catFiltro={catFiltro}
        />
      )}
      {modo === 'lista' && (
        <CronogramaLista
          actividades={actsFiltradas}
          programaciones={programaciones}
          filtroEstados={filtroEstados}
          catFiltro={catFiltro}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}
