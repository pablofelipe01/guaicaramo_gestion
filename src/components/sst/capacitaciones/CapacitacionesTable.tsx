'use client'

import { useState, useMemo } from 'react'
import { Search, Award, Users, ChevronRight } from 'lucide-react'
import { EstadoBadge } from './EstadoBadge'
import { getCategoriaColor, CATEGORIAS_CAP, PROVEEDORES_CAP } from '@/lib/sst/cap-client'
import type { CapActividadFields, CapEstadoGeneral } from '@/types/sst/cap'
import type { AirtableRecord } from '@/lib/airtable-client'

type Actividad = AirtableRecord<CapActividadFields>

const ESTADOS: CapEstadoGeneral[] = ['Sin programar', 'Programado', 'En ejecución', 'Completado', 'Cancelado']

interface Props {
  actividades: Actividad[]
  onSelect: (a: Actividad) => void
}

export function CapacitacionesTable({ actividades, onSelect }: Props) {
  const [busqueda, setBusqueda]     = useState('')
  const [catFiltro, setCatFiltro]   = useState('')
  const [estadoFiltro, setEstado]   = useState('')
  const [provFiltro, setProv]       = useState('')

  const filtradas = useMemo(() => {
    return actividades.filter(a => {
      const f = a.fields
      if (busqueda && !f.tema.toLowerCase().includes(busqueda.toLowerCase()) &&
          !f.responsable?.toLowerCase().includes(busqueda.toLowerCase())) return false
      if (catFiltro   && f.categoria      !== catFiltro)   return false
      if (estadoFiltro && f.estado_general !== estadoFiltro) return false
      if (provFiltro  && f.proveedor      !== provFiltro)  return false
      return true
    })
  }, [actividades, busqueda, catFiltro, estadoFiltro, provFiltro])

  return (
    <div className="flex flex-col gap-3">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar tema o responsable…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={catFiltro}
          onChange={e => setCatFiltro(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_CAP.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={estadoFiltro}
          onChange={e => setEstado(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select
          value={provFiltro}
          onChange={e => setProv(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los proveedores</option>
          {PROVEEDORES_CAP.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <span className="text-xs text-gray-500 self-center">{filtradas.length} / {actividades.length} actividades</span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tema</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Proveedor</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Responsable</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Certif.</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtradas.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Sin resultados</td></tr>
            ) : filtradas.map((a, i) => {
              const f = a.fields
              const color = getCategoriaColor(f.categoria)
              return (
                <tr
                  key={a.id}
                  onClick={() => onSelect(a)}
                  className={`cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{f.item_numero}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[220px]">
                    <span className="line-clamp-2">{f.tema}</span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: color }}
                    >
                      {f.categoria}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 hidden lg:table-cell">{f.proveedor}</td>
                  <td className="px-3 py-2.5 text-gray-600 hidden lg:table-cell">{f.responsable}</td>
                  <td className="px-3 py-2.5"><EstadoBadge estado={f.estado_general} /></td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    {f.requiere_certificacion ? (
                      <Award className="w-4 h-4 text-amber-500" />
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400">
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
