import { type LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-green-700',
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6 sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-200 shrink-0">
            <Icon className={['w-5 h-5', iconColor].join(' ')} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
