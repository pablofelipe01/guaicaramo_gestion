'use client'

interface Props {
  value: number       // 0–100
  meta?: number       // default 80
  height?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  showMeta?: boolean
  className?: string
}

const HEIGHT_MAP = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' }

function barColor(value: number, meta: number) {
  if (value >= meta) return '#28A745'
  if (value >= meta * 0.75) return '#FF8C42'
  return '#DC3545'
}

export function BarraMensual({ value, meta = 80, height = 'sm', showLabel = false, showMeta = false, className = '' }: Props) {
  const color = barColor(value, meta)
  const h = HEIGHT_MAP[height]

  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      {(showLabel || showMeta) && (
        <div className="flex justify-between text-[10px] text-gray-500">
          {showLabel && <span style={{ color }}>{value}%</span>}
          {showMeta && <span>Meta: {meta}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
