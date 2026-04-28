import Link from 'next/link'
import { AlertTriangle, AlertCircle, Info, Zap } from 'lucide-react'
import type { AlertaDashboard } from '@/lib/sst/alertas'

const CONFIG_TIPO = {
  critica: {
    icon: Zap,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    label: 'Crítica',
    labelColor: 'bg-red-100 text-red-700',
  },
  alta: {
    icon: AlertTriangle,
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'text-orange-500',
    label: 'Alta',
    labelColor: 'bg-orange-100 text-orange-700',
  },
  media: {
    icon: Info,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    label: 'Media',
    labelColor: 'bg-yellow-100 text-yellow-700',
  },
}

const CATEGORIA_LABEL: Record<AlertaDashboard['categoria'], string> = {
  epp: 'EPP',
  contratista: 'Contratista',
  accion_correctiva: 'Acción',
  evaluacion_medica: 'Medicina',
}

interface AlertasPanelProps {
  alertas: AlertaDashboard[]
}

export function AlertasPanel({ alertas }: AlertasPanelProps) {
  if (alertas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-green-600" />
          Alertas del sistema
        </h2>
        <p className="text-sm text-gray-400 text-center py-6">
          Sin alertas activas
        </p>
      </div>
    )
  }

  const criticas = alertas.filter(a => a.tipo === 'critica')
  const altas = alertas.filter(a => a.tipo === 'alta')
  const medias = alertas.filter(a => a.tipo === 'media')

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Alertas del sistema
        </h2>
        <div className="flex gap-2 text-xs">
          {criticas.length > 0 && (
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {criticas.length} críticas
            </span>
          )}
          {altas.length > 0 && (
            <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
              {altas.length} altas
            </span>
          )}
          {medias.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
              {medias.length} medias
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {alertas.slice(0, 15).map((alerta, i) => {
          const cfg = CONFIG_TIPO[alerta.tipo]
          const Icon = cfg.icon
          return (
            <Link
              key={i}
              href={alerta.enlace}
              className={[
                'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:brightness-95',
                cfg.bg,
                cfg.border,
              ].join(' ')}
            >
              <Icon className={['w-4 h-4 shrink-0 mt-0.5', cfg.iconColor].join(' ')} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{alerta.mensaje}</p>
                {alerta.fecha && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(alerta.fecha).toLocaleDateString('es-CO')}
                  </p>
                )}
              </div>
              <span className={['text-xs px-1.5 py-0.5 rounded font-medium shrink-0', cfg.labelColor].join(' ')}>
                {CATEGORIA_LABEL[alerta.categoria]}
              </span>
            </Link>
          )
        })}
        {alertas.length > 15 && (
          <p className="text-xs text-gray-400 text-center pt-1">
            +{alertas.length - 15} alertas más
          </p>
        )}
      </div>
    </div>
  )
}
