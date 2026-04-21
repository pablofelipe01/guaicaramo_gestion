interface StatusBadgeProps {
  label: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary'
  size?: 'sm' | 'md'
}

const VARIANTS: Record<NonNullable<StatusBadgeProps['variant']>, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  primary: 'bg-blue-100 text-blue-800 border-blue-200',
}

export function StatusBadge({ label, variant = 'neutral', size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center border rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        VARIANTS[variant],
      ].join(' ')}
    >
      {label}
    </span>
  )
}
