'use client'

/**
 * @file QRDisplay.tsx
 * Componente que renderiza el QR de una plantilla de evaluación.
 * Permite descargar el QR como PNG para impresión.
 * Usa react-qr-code (ya instalado en el proyecto).
 */

import { useRef, useCallback } from 'react'
import QRCode from 'react-qr-code'
import { Download, QrCode } from 'lucide-react'

interface Props {
  token: string
  nombreCapacitacion: string
  baseUrl?: string
}

export function QRDisplay({ token, nombreCapacitacion, baseUrl }: Props) {
  const svgRef = useRef<HTMLDivElement>(null)

  const url = `${baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')}/evaluacion/${token}`

  const descargarPNG = useCallback(() => {
    const svgEl = svgRef.current?.querySelector('svg')
    if (!svgEl) return

    const canvas   = document.createElement('canvas')
    const size     = 512
    canvas.width   = size
    canvas.height  = size + 60  // espacio para el texto
    const ctx      = canvas.getContext('2d')!

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Serializar SVG y renderizar en canvas
    const serializer = new XMLSerializer()
    const svgStr     = serializer.serializeToString(svgEl)
    const img        = new Image()
    const svgBlob    = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl     = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const padding = 24
      ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2)

      // Texto debajo del QR
      ctx.fillStyle = '#212529'
      ctx.font      = 'bold 14px Arial, sans-serif'
      ctx.textAlign = 'center'
      const maxW    = size - 24
      const words   = nombreCapacitacion.split(' ')
      let line      = ''
      let y         = size + 20
      for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width > maxW && line) {
          ctx.fillText(line, size / 2, y)
          line = word
          y  += 18
        } else {
          line = test
        }
      }
      if (line) ctx.fillText(line, size / 2, y)

      // Descargar
      const link    = document.createElement('a')
      link.download = `QR_evaluacion_${token.slice(0, 8)}.png`
      link.href     = canvas.toDataURL('image/png')
      link.click()
      URL.revokeObjectURL(svgUrl)
    }
    img.src = svgUrl
  }, [token, nombreCapacitacion])

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl" style={{ border: '1px solid #e9ecef', background: '#fff' }}>
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#212529' }}>
        <QrCode className="w-4 h-4" style={{ color: '#28A745' }} />
        {nombreCapacitacion}
      </div>

      {/* QR */}
      <div ref={svgRef} className="p-3 rounded-xl" style={{ background: '#fff', border: '1px solid #dee2e6' }}>
        <QRCode
          value={url}
          size={180}
          level="M"
          bgColor="#ffffff"
          fgColor="#1e3a5f"
        />
      </div>

      {/* URL */}
      <p className="text-[10px] text-center break-all" style={{ color: '#6C757D', maxWidth: 220 }}>
        {url}
      </p>

      {/* Botón descargar */}
      <button
        onClick={descargarPNG}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
        style={{ background: '#28A745', boxShadow: '0 2px 8px rgba(40,167,69,0.3)' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#1e7e34' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#28A745' }}
      >
        <Download className="w-4 h-4" />
        Descargar PNG
      </button>
    </div>
  )
}
