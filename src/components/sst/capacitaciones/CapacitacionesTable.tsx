'use client'

import { useState, useMemo } from 'react'
import { Search, Award, ChevronRight, X } from 'lucide-react'
import { EstadoBadge } from './EstadoBadge'
import { getCategoriaColor, CATEGORIAS_CAP, PROVEEDORES_CAP } from '@/lib/sst/cap-client'
import type { CapActividadFields, CapEstadoGeneral } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>

const ESTADOS: CapEstadoGeneral[] = ['Sin programar', 'Programado', 'En ejecución', 'Completado', 'Cancelado']

const ESTADO_DOT: Record<string, string> = {
  'Sin programar': '#9CA3AF',
  'Programado':    '#3B82F6',
  'En ejecución':  '#F97316',
  'Completado':    '#22C55E',
  'Cancelado':     '#EF4444',
}

interface Props {
  actividades: Actividad[]
  onSelect: (a: Actividad) => void
}

export function CapacitacionesTable({ actividades, onSelect }: Props) {
  const [busqueda, setBusqueda]   = useState('')
  const [catFiltro, setCatFiltro] = useState('')
  const [estadoFiltro, setEstado] = useState('')
  const [provFiltro, setProv]     = useState('')

  const filtradas = useMemo(() => {
    return actividades.filter(a => {
      const f = a.fields
      if (busqueda && !f.tema.toLowerCase().includes(busqueda.toLowerCase()) &&
          !f.responsable?.toLowerCase().includes(busqueda.toLowerCase())) return false
      if (catFiltro    && f.categoria      !== catFiltro)    return false
      if (estadoFiltro && f.estado_general !== estadoFiltro) return false
      if (provFiltro   && f.proveedor      !== provFiltro)   return false
      return true
    })
  }, [actividades, busqueda, catFiltro, estadoFiltro, provFiltro])

  const hasFilters = busqueda || catFiltro || estadoFiltro || provFiltro
  const clearAll = () => { setBusqueda(''); setCatFiltro(''); setEstado(''); setProv('') }

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de búsqueda + filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tema o responsable…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </div>

        <select
          value={catFiltro}
          onChange={e => setCatFiltro(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_CAP.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={estadoFiltro}
          onChange={e => setEstado(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        <select
          value={provFiltro}
          onChange={e => setProv(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">Todos los proveedores</option>
          {PROVEEDORES_CAP.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
          <span className="text-xs text-gray-400 whitespace-nowrap">
            <span className="font-semibold text-gray-600">{filtradas.length}</span> de {actividades.length}
          </span>
        </div>
      </div>

      {/* Pills de categoría activa */}
      {catFiltro && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Categoría:</span>
          <button
            onClick={() => setCatFiltro('')}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full text-white font-medium"
            style={{ backgroundColor: getCategoriaColor(catFiltro as never) }}
          >
            {catFiltro} <X className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="pl-4 pr-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tema</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Proveedor</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Responsable</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Cert.</th>
              <th className="px-2 py-3 w-6" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">
                  {hasFilters ? 'No hay actividades que coincidan con los filtros.' : 'Sin actividades en este plan.'}
                </td>
              </tr>
            ) : filtradas.map((a) => {
              const f = a.fields
              const catColor = getCategoriaColor(f.categoria)
              const dotColor = ESTADO_DOT[f.estado_general] ?? '#9CA3AF'

              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className="cursor-pointer hover:bg-blue-50/60 transition-colors group"
                  style={{ borderLeft: `3px solid ${catColor}` }}
                >
                  <td className="pl-3 pr-2 py-3 font-mono text-xs text-gray-400 w-8">{f.item_numero}</td>

                  <td className="px-3 py-3 font-medium text-gray-900 max-w-[220px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: dotColor }}
                        title={f.estado_general}
                      />
                      <span className="line-clamp-2 text-sm">{f.tema}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3 hidden md:table-cell">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium whitespace-nowrap"
                      style={{ backgroundColor: catColor }}
                    >
                      {f.categoria}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-xs text-gray-500 hidden lg:table-cell">{f.proveedor ?? '—'}</td>
                  <td className="px-3 py-3 text-xs text-gray-600 hidden lg:table-cell">{f.responsable ?? '—'}</td>

                  <td className="px-3 py-3">
                    <EstadoBadge estado={f.estado_general} />
                  </td>

                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    {f.requiere_certificacion ? (
                      <Award className="w-4 h-4 text-amber-500 mx-auto" aria-label="Requiere certificación" />
                    ) : <span className="text-gray-200 text-xs">—</span>}
                  </td>

                  <td className="px-2 py-3 text-gray-300 group-hover:text-blue-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
