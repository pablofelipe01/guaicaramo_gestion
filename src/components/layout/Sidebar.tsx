'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  type LucideIcon,
} from 'lucide-react'

interface Module {
  name: string
  href: string
  icon: LucideIcon
}

interface PhaseGroup {
  phase: string
  label: string
  color: string
  bgColor: string
  textColor: string
  modules: Module[]
}

const NAV: PhaseGroup[] = [
  {
    phase: 'PLANEAR',
    label: 'Planear',
    color: 'border-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    modules: [
      { name: 'Evaluación Inicial', href: '/dashboard/evaluacion-inicial', icon: ClipboardList },
      { name: 'Plan de Trabajo Anual', href: '/dashboard/plan-trabajo', icon: Calendar },
      { name: 'Comité de Convivencia', href: '/dashboard/comite-convivencia', icon: Users },
      { name: 'Capacitaciones', href: '/dashboard/capacitaciones', icon: BookOpen },
      { name: 'Presupuesto', href: '/dashboard/presupuesto', icon: DollarSign },
      { name: 'Matriz Legal', href: '/dashboard/matriz-legal', icon: Scale },
      { name: 'Gestión del Cambio', href: '/dashboard/gestion-cambio', icon: RefreshCw },
      { name: 'Conservación Documental', href: '/dashboard/documentos', icon: Archive },
      { name: 'Contratistas', href: '/dashboard/contratistas', icon: Briefcase },
    ],
  },
  {
    phase: 'HACER',
    label: 'Hacer',
    color: 'border-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    modules: [
      { name: 'Evaluaciones Médicas', href: '/dashboard/evaluaciones-medicas', icon: Stethoscope },
      { name: 'Perfiles de Cargo', href: '/dashboard/perfiles-cargo', icon: UserCog },
      { name: 'Casos Médicos', href: '/dashboard/casos-medicos', icon: Activity },
      { name: 'Investigación Incidentes', href: '/dashboard/incidentes', icon: AlertTriangle },
      { name: 'Matriz IPVR', href: '/dashboard/ipvr', icon: ShieldAlert },
      { name: 'Inspecciones', href: '/dashboard/inspecciones', icon: ClipboardCheck },
      { name: 'EPPs y Dotación', href: '/dashboard/epps', icon: HardHat },
      { name: 'Permisos de Trabajo', href: '/dashboard/permisos-trabajo', icon: Key },
    ],
  },
  {
    phase: 'VERIFICAR',
    label: 'Verificar',
    color: 'border-yellow-500',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    modules: [
      { name: 'Indicadores', href: '/dashboard/indicadores', icon: TrendingUp },
      { name: 'Auditorías', href: '/dashboard/auditorias', icon: BarChart2 },
    ],
  },
  {
    phase: 'ACTUAR',
    label: 'Actuar',
    color: 'border-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    modules: [
      { name: 'Acciones Correctivas', href: '/dashboard/acciones-correctivas', icon: CheckSquare },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

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
          'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 flex flex-col transition-transform duration-300',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Guaicaramo</p>
            <p className="text-xs text-gray-500">SG-SST</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <Link
            href="/dashboard"
            onClick={onClose}
            className={[
              'flex items-center gap-3 mx-3 px-3 py-2 rounded-lg text-sm font-medium mb-1',
              pathname === '/dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100',
            ].join(' ')}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Inicio
          </Link>

          {NAV.map((group) => {
            const isCollapsed = collapsed[group.phase]
            const hasActive = group.modules.some((m) => pathname.startsWith(m.href))

            return (
              <div key={group.phase} className="mb-1">
                <button
                  onClick={() => togglePhase(group.phase)}
                  className={[
                    'w-full flex items-center justify-between px-4 py-1.5 text-xs font-bold uppercase tracking-wider',
                    group.textColor,
                  ].join(' ')}
                >
                  <span className={['flex items-center gap-2 border-l-2 pl-2', group.color, hasActive ? 'opacity-100' : 'opacity-70'].join(' ')}>
                    {group.label}
                  </span>
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3" />
                    : <ChevronDown className="w-3 h-3" />}
                </button>

                {!isCollapsed && (
                  <ul className="mt-0.5">
                    {group.modules.map((mod) => {
                      const Icon = mod.icon
                      const active = pathname.startsWith(mod.href)
                      return (
                        <li key={mod.href}>
                          <Link
                            href={mod.href}
                            onClick={onClose}
                            className={[
                              'flex items-center gap-2.5 mx-3 px-3 py-1.5 rounded-lg text-xs transition-colors',
                              active
                                ? 'bg-blue-600 text-white font-medium'
                                : 'text-gray-600 hover:bg-gray-100',
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

        <div className="px-4 py-3 border-t border-gray-200 shrink-0">
          <p className="text-xs text-gray-400 text-center">
            Ciclo PHVA — Res. 0312/2019
          </p>
        </div>
      </aside>
    </>
  )
}
