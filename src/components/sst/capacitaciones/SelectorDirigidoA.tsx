'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, Users, X } from 'lucide-react'

export interface Persona {
  id:        string
  nombre:    string
  documento: string
}

export interface UnidadConPersonas {
  nombre:   string
  personas: Persona[]
}

interface Props {
  unidades:  UnidadConPersonas[]
  loading?:  boolean
  onChange:  (label: string) => void
}

type AreaState = 'none' | 'partial' | 'all'

function buildLabel(selectedIds: Set<string>, unidades: UnidadConPersonas[]): string {
  if (selectedIds.size === 0) return ''

  const total = unidades.reduce((s, u) => s + u.personas.length, 0)
  if (selectedIds.size === total && total > 0) return `Todo el personal (${total} personas)`

  const areasCompletas: string[] = []
  const individuales:   string[] = []

  for (const u of unidades) {
    if (u.personas.length === 0) continue
    const enArea = u.personas.filter(p => selectedIds.has(p.id))
    if (enArea.length === u.personas.length) {
      areasCompletas.push(u.nombre)
    } else {
      enArea.forEach(p => individuales.push(p.nombre))
    }
  }

  const partes: string[] = []
  if (areasCompletas.length > 0) partes.push(areasCompletas.join(', '))
  if (individuales.length > 0) {
    partes.push(
      individuales.length <= 3
        ? individuales.join(', ')
        : `${individuales.length} personas`
    )
  }
  return partes.join(' · ')
}

export function SelectorDirigidoA({ unidades, loading, onChange }: Props) {
  const [open,        setOpen]        = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const total      = unidades.reduce((s, u) => s + u.personas.length, 0)
  const allSelected = total > 0 && selectedIds.size === total
  const label      = buildLabel(selectedIds, unidades)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getAreaState = useCallback((u: UnidadConPersonas): AreaState => {
    const count = u.personas.filter(p => selectedIds.has(p.id)).length
    if (count === 0) return 'none'
    if (count === u.personas.length) return 'all'
    return 'partial'
  }, [selectedIds])

  const togglePerson = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleArea = (u: UnidadConPersonas) => {
    const state = getAreaState(u)
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (state === 'all') u.personas.forEach(p => next.delete(p.id))
      else u.personas.forEach(p => next.add(p.id))
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(unidades.flatMap(u => u.personas.map(p => p.id))))
    }
  }

  const toggleExpand = (nombre: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(nombre)) next.delete(nombre); else next.add(nombre)
      return next
    })
  }

  const handleApply = () => {
    onChange(buildLabel(selectedIds, unidades))
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(new Set())
    onChange('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { if (!loading) setOpen(o => !o) }}
        disabled={loading}
        className="input-field flex items-center justify-between gap-2 w-full text-left"
        style={{ minHeight: 38 }}
      >
        <span className={`text-sm truncate flex-1 ${label ? 'text-gray-800' : 'text-gray-400'}`}>
          {loading ? 'Cargando personal...' : label || 'Seleccionar personas o áreas...'}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {label && !loading && (
            <span
              role="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-full min-w-[300px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">

          {/* Todo el personal */}
          <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#28A745' }}
              />
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Todo el personal</span>
              <span className="ml-auto text-xs text-gray-400">{total} personas</span>
            </label>
          </div>

          {/* Lista de áreas */}
          <div className="max-h-60 overflow-y-auto">
            {unidades.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin personal registrado</p>
            ) : (
              unidades.map(u => {
                const state      = getAreaState(u)
                const isExpanded = expanded.has(u.nombre)
                const selCount   = u.personas.filter(p => selectedIds.has(p.id)).length

                return (
                  <div key={u.nombre} className="border-b border-gray-50 last:border-0">
                    {/* Fila de área */}
                    <div className="flex items-center px-3 py-2 hover:bg-gray-50 transition-colors">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={state === 'all'}
                          ref={(el) => { if (el) el.indeterminate = state === 'partial' }}
                          onChange={() => toggleArea(u)}
                          className="w-4 h-4 rounded shrink-0"
                          style={{ accentColor: '#28A745' }}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">{u.nombre}</span>
                        <span className="ml-auto text-xs text-gray-400 shrink-0 pl-2">
                          {state !== 'none' ? `${selCount}/` : ''}{u.personas.length}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => toggleExpand(u.nombre)}
                        className="ml-1.5 p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors shrink-0"
                        title={isExpanded ? 'Colapsar' : 'Ver personas'}
                      >
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Personas del área (expandido) */}
                    {isExpanded && (
                      <div className="border-l-2 border-green-200 ml-8 bg-gray-50">
                        {u.personas.map(p => (
                          <label
                            key={p.id}
                            className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(p.id)}
                              onChange={() => togglePerson(p.id)}
                              className="w-3.5 h-3.5 rounded shrink-0"
                              style={{ accentColor: '#28A745' }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-700 truncate">{p.nombre}</p>
                              <p className="text-[10px] text-gray-400">{p.documento}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between bg-white">
            <span className="text-xs text-gray-500">
              {selectedIds.size > 0
                ? `${selectedIds.size} seleccionada${selectedIds.size !== 1 ? 's' : ''}`
                : 'Ninguna seleccionada'}
            </span>
            <button
              type="button"
              onClick={handleApply}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ background: '#28A745' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
