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
  iconColor = 'text-blue-600',
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-200">
            <Icon className={['w-5 h-5', iconColor].join(' ')} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
