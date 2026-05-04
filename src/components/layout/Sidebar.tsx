'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { modulosVisibles } from '@/types/usuarios'
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  BookOpen,
  DollarSign,
  Scale,
  RefreshCw,
  Archive,
  Briefcase,
  Stethoscope,
  UserCog,
  Activity,
  AlertTriangle,
  ShieldAlert,
  ClipboardCheck,
  HardHat,
  Key,
  BarChart2,
  TrendingUp,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Database,
  type LucideIcon,
} from 'lucide-react'

interface Module {
  name: string
  /** Clave usada para verificar permisos (cuando difiere del name). */
  permKey?: string
  desc: string
  href: string
  icon: LucideIcon
}

interface PhaseGroup {
  phase: string
  label: string
  dotColor: string
  modules: Module[]
}

const NAV: PhaseGroup[] = [
  {
    phase: 'PLANEAR',
    label: 'Planear',
    dotColor: 'bg-teal-400',
    modules: [
      { name: 'Evaluación Inicial', desc: 'Diagnóstico Res. 0312', href: '/dashboard/evaluacion-inicial', icon: ClipboardList },
      { name: 'Plan de Trabajo Anual', desc: 'Actividades y seguimiento', href: '/dashboard/plan-trabajo', icon: Calendar },
      { name: 'Comité de Convivencia', desc: 'CCL — Res. 652/2012', href: '/dashboard/comite-convivencia', icon: Users },
      { name: 'Capacitaciones', desc: 'Programa anual SST', href: '/dashboard/capacitaciones', icon: BookOpen },
      { name: 'Presupuesto', desc: 'Ejecución financiera', href: '/dashboard/presupuesto', icon: DollarSign },
      { name: 'Matriz Legal', desc: 'Requisitos normativos', href: '/dashboard/matriz-legal', icon: Scale },
      { name: 'Gestión del Cambio', desc: 'Evaluación de impactos', href: '/dashboard/gestion-cambio', icon: RefreshCw },
      { name: 'Conservación Documental', desc: 'Repositorio central', href: '/dashboard/documentos', icon: Archive },
      { name: 'Contratistas', desc: 'Semáforo de cumplimiento', href: '/dashboard/contratistas', icon: Briefcase },
    ],
  },
  {
    phase: 'HACER',
    label: 'Hacer',
    dotColor: 'bg-emerald-400',
    modules: [
      { name: 'Evaluaciones Médicas', desc: 'Aptitud laboral — Res. 2346', href: '/dashboard/evaluaciones-medicas', icon: Stethoscope },
      { name: 'Perfiles de Cargo', desc: 'Peligros y EPPs por cargo', href: '/dashboard/perfiles-cargo', icon: UserCog },
      { name: 'Casos Médicos', permKey: 'Seguimiento Casos Médicos', desc: 'Restricciones e incapacidades', href: '/dashboard/casos-medicos', icon: Activity },
      { name: 'Investigación Incidentes', desc: 'AT, incidentes y EL', href: '/dashboard/incidentes', icon: AlertTriangle },
      { name: 'Matriz IPVR', desc: 'Peligros GTC-45', href: '/dashboard/ipvr', icon: ShieldAlert },
      { name: 'Inspecciones', desc: 'Listas de chequeo', href: '/dashboard/inspecciones', icon: ClipboardCheck },
      { name: 'EPPs y Dotación', desc: 'Entregas y control de vida útil', href: '/dashboard/epps', icon: HardHat },
      { name: 'Permisos de Trabajo', desc: 'Alto riesgo — LOTO, alturas', href: '/dashboard/permisos-trabajo', icon: Key },
    ],
  },
  {
    phase: 'VERIFICAR',
    label: 'Verificar',
    dotColor: 'bg-amber-400',
    modules: [
      { name: 'Indicadores', desc: 'KPIs y semáforo de metas', href: '/dashboard/indicadores', icon: TrendingUp },
      { name: 'Auditorías', desc: 'Internas y externas', href: '/dashboard/auditorias', icon: BarChart2 },
    ],
  },
  {
    phase: 'ACTUAR',
    label: 'Actuar',
    dotColor: 'bg-red-400',
    modules: [
      { name: 'Acciones Correctivas', desc: 'Mejora continua — verificación de eficacia', href: '/dashboard/acciones-correctivas', icon: CheckSquare },
    ],
  },
  {
    phase: 'ADMIN',
    label: 'Administración',
    dotColor: 'bg-gray-400',
    modules: [
      { name: 'Gestión de Usuarios', desc: 'Roles y permisos del sistema', href: '/dashboard/usuarios', icon: Users },
      { name: 'Backup', desc: 'Respaldo de datos', href: '/dashboard/backup', icon: Database },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const rol = (user?.role ?? 'operativo').toLowerCase()
  const visibles = new Set(modulosVisibles(rol))

  const togglePhase = (phase: string) => {
    setCollapsed((prev) => ({ ...prev, [phase]: !prev[phase] }))
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-30 flex flex-col transition-transform duration-300',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-8 h-8 bg-green-800 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm leading-tight">Guaicaramo</p>
            <p className="text-xs text-green-700 font-medium">SG-SST</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <Link
            href="/dashboard"
            onClick={onClose}
            className={[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-3 transition-all duration-150',
              pathname === '/dashboard'
                ? 'bg-green-50 text-green-800 border-l-[3px] border-green-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
            ].join(' ')}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Inicio
          </Link>

          {NAV.map((group) => {
            const modulosFiltrados = group.modules.filter((mod) =>
              visibles.has(mod.permKey ?? mod.name)
            )
            if (modulosFiltrados.length === 0) return null

            const isCollapsed = collapsed[group.phase]

            return (
              <div key={group.phase} className="mb-1">
                <button
                  onClick={() => togglePhase(group.phase)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${group.dotColor}`} />
                  <span className="flex-1 text-xs font-semibold text-gray-400 uppercase tracking-wider text-left">
                    {group.label}
                  </span>
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3 text-gray-300" />
                    : <ChevronDown className="w-3 h-3 text-gray-300" />}
                </button>

                {!isCollapsed && (
                  <ul className="mt-0.5 ml-1">
                    {modulosFiltrados.map((mod) => {
                      const Icon = mod.icon
                      const active = pathname.startsWith(mod.href)
                      return (
                        <li key={mod.href}>
                          <Link
                            href={mod.href}
                            onClick={onClose}
                            title={mod.desc}
                            className={[
                              'flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150',
                              active
                                ? 'bg-green-50 text-green-800 font-semibold border-l-[3px] border-green-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-normal',
                            ].join(' ')}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{mod.name}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Ciclo PHVA — Res. 0312/2019
          </p>
        </div>
      </aside>
    </>
  )
}
