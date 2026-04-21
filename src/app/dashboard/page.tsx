'use client'

import { useAuth } from '@/hooks/useAuth'
import { Card, StatCard } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { LayoutDashboard, Shield, AlertTriangle, ClipboardCheck, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${user?.name ?? ''}` }
        description="Sistema de Gestión de Seguridad y Salud en el Trabajo — Ciclo PHVA"
        icon={LayoutDashboard}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Módulos activos" value="20" sub="Ciclo PHVA completo" color="blue" />
        <StatCard label="Estado del sistema" value="Inicial" sub="Sin datos aún" color="yellow" />
        <StatCard label="Acciones pendientes" value="—" sub="Por configurar" color="red" />
        <StatCard label="Cumplimiento" value="—%" sub="Res. 0312/2019" color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Ciclo PHVA
          </h2>
          <div className="space-y-2 text-sm">
            {[
              { phase: 'Planear', count: 9, color: 'bg-blue-500' },
              { phase: 'Hacer', count: 8, color: 'bg-green-500' },
              { phase: 'Verificar', count: 2, color: 'bg-yellow-500' },
              { phase: 'Actuar', count: 1, color: 'bg-red-500' },
            ].map(({ phase, count, color }) => (
              <div key={phase} className="flex items-center gap-3">
                <div className={['w-2 h-2 rounded-full', color].join(' ')} />
                <span className="text-gray-600 flex-1">{phase}</span>
                <span className="font-medium text-gray-800">{count} módulos</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Próximas fechas límite
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Indicadores y Auditorías</p>
                <p className="text-xs text-gray-400">Fecha límite: 6 mayo 2026</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-800">Módulos PLANEAR / HACER</p>
                <p className="text-xs text-gray-400">Fecha límite: 13 mayo 2026</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
