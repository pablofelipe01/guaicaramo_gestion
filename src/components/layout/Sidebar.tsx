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
  phaseColor: string
  modules: Module[]
}

const NAV: PhaseGroup[] = [
  {
    phase: 'PLANEAR',
    label: 'Planear',
    phaseColor: '#60A5FA',
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
    phaseColor: '#4ADE80',
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
    phaseColor: '#FBBF24',
    modules: [
      { name: 'Indicadores', desc: 'KPIs y semáforo de metas', href: '/dashboard/indicadores', icon: TrendingUp },
      { name: 'Auditorías', desc: 'Internas y externas', href: '/dashboard/auditorias', icon: BarChart2 },
    ],
  },
  {
    phase: 'ACTUAR',
    label: 'Actuar',
    phaseColor: '#F87171',
    modules: [
      { name: 'Acciones Correctivas', desc: 'Mejora continua — verificación de eficacia', href: '/dashboard/acciones-correctivas', icon: CheckSquare },
    ],
  },
  {
    phase: 'ADMIN',
    label: 'Administración',
    phaseColor: '#94A3B8',
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
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 h-full w-64 z-30 flex flex-col transition-transform duration-300',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ background: 'linear-gradient(180deg, #0B2E1A 0%, #081F10 100%)' }}
      >
        {/* ── Logo ────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0"
            style={{ background: '#166534' }}
          >
            <span className="font-bold text-sm" style={{ color: '#4ADE80' }}>G</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-white">Guaicaramo</p>
            <p
              className="font-medium uppercase tracking-widest"
              style={{ fontSize: '9px', color: '#4ADE80' }}
            >
              SG-SST
            </p>
          </div>
        </div>

        {/* ── Nav ─────────────────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium mb-3 transition-all duration-150"
            style={{
              color: pathname === '/dashboard' ? '#ffffff' : 'rgba(255,255,255,0.55)',
              background: pathname === '/dashboard' ? 'rgba(74,222,128,0.1)' : 'transparent',
              borderLeft: pathname === '/dashboard' ? '2px solid #4ADE80' : '2px solid transparent',
            }}
          >
            <LayoutDashboard
              className="w-[18px] h-[18px] shrink-0"
              strokeWidth={1.5}
              style={{ color: pathname === '/dashboard' ? '#4ADE80' : 'inherit' }}
            />
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
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors hover:bg-white/5"
                >
                  <span
                    className="rounded-full shrink-0"
                    style={{ width: '5px', height: '5px', background: group.phaseColor }}
                  />
                  <span
                    className="flex-1 font-medium uppercase text-left"
                    style={{ fontSize: '9px', letterSpacing: '0.1em', color: group.phaseColor, opacity: 0.85 }}
                  >
                    {group.label}
                  </span>
                  {isCollapsed
                    ? <ChevronRight className="w-3 h-3 text-white opacity-30" />
                    : <ChevronDown className="w-3 h-3 text-white opacity-30" />}
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
                              active ? '' : 'hover:bg-white/5',
                            ].join(' ')}
                            style={{
                              color: active ? '#ffffff' : 'rgba(255,255,255,0.55)',
                              fontWeight: active ? 500 : 400,
                              background: active ? 'rgba(74,222,128,0.1)' : undefined,
                              borderLeft: active ? '2px solid #4ADE80' : '2px solid transparent',
                            }}
                          >
                            <Icon
                              className="shrink-0"
                              style={{
                                width: '18px', height: '18px',
                                color: active ? '#4ADE80' : 'inherit',
                              }}
                              strokeWidth={1.5}
                            />
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

        {/* ── Footer usuario ─────────────────────────────────────── */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#081F10' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold"
              style={{ background: '#166534', color: '#86EFAC', fontSize: '10px' }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p
                className="truncate font-medium leading-tight"
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}
              >
                {user?.name ?? '—'}
              </p>
              <p
                className="uppercase tracking-wider"
                style={{ fontSize: '9px', color: '#4ADE80' }}
              >
                {user?.role ?? ''}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
