'use client'

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CumplimientoGaugeProps {
  valor: number
  meta: number
  nombre: string
}

function getColor(valor: number, meta: number): { main: string; bg: string; text: string } {
  if (valor >= meta) return { main: '#22c55e', bg: '#f0fdf4', text: 'text-green-700' }
  if (valor >= meta * 0.75) return { main: '#f59e0b', bg: '#fffbeb', text: 'text-yellow-700' }
  return { main: '#ef4444', bg: '#fef2f2', text: 'text-red-700' }
}

export function CumplimientoGauge({ valor, meta, nombre }: CumplimientoGaugeProps) {
  const color = getColor(valor, meta)
  const resto = Math.max(0, 100 - valor)

  const data = {
    datasets: [
      {
        data: [valor, resto],
        backgroundColor: [color.main, '#f3f4f6'],
        borderWidth: 0,
        hoverOffset: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center">
      <h2 className="font-semibold text-gray-800 mb-4 text-center text-sm">
        🎯 {nombre}
      </h2>
      <div className="relative" style={{ width: 160, height: 160 }}>
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={['text-3xl font-bold', color.text].join(' ')}>
            {valor}%
          </span>
          <span className="text-xs text-gray-400">Meta: {meta}%</span>
        </div>
      </div>
      <div className="mt-4 w-full">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Avance</span>
          <span>{valor} / {meta}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, (valor / meta) * 100)}%`, backgroundColor: color.main }}
          />
        </div>
      </div>
    </div>
  )
}
