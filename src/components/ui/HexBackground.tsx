'use client'
import { useEffect, useRef } from 'react'

interface Props {
  speed?: number
  className?: string
  children?: React.ReactNode
}

const C = {
  verdeDark:  '#166534',
  verde:      '#28A745',
  verdeClaro: '#5DCAA5',
  bg:         '#0a1628',
}

export default function HexBackground({ speed = 1, className = '', children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const wrap   = wrapRef.current!
    const ctx    = canvas.getContext('2d')!
    const mouse  = { x: -999, y: -999 }
    const palette = [C.verdeDark, C.verde, C.verdeClaro]
    let W = 0, H = 0, hexes: any[] = [], raf: number

    function resize() {
      const r = wrap.getBoundingClientRect()
      W = canvas.width  = r.width
      H = canvas.height = r.height
      buildGrid()
    }

    function buildGrid() {
      hexes = []
      const size = 36
      const cols = Math.ceil(W / (size * 1.73)) + 2
      const rows = Math.ceil(H / (size * 1.5))  + 2
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          hexes.push({
            x:     c * size * 1.73 + (r % 2 === 0 ? 0 : size * 0.865),
            y:     r * size * 1.5,
            size,
            phase: Math.random() * Math.PI * 2,
            freq:  0.005 + Math.random() * 0.008,
          })
    }

    function hexPath(x: number, y: number, s: number) {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a  = Math.PI / 180 * (60 * i - 30)
        const px = x + s * Math.cos(a)
        const py = y + s * Math.sin(a)
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
    }

    let lastT = 0
    function loop(ts: number) {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(ts - lastT, 50)
      lastT = ts
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = C.bg
      ctx.fillRect(0, 0, W, H)

      for (const h of hexes) {
        const t     = ts * 0.001 * speed
        const pulse = Math.sin(t * h.freq * 60 + h.phase)
        const dx    = mouse.x - h.x
        const dy    = mouse.y - h.y
        const dist  = Math.sqrt(dx * dx + dy * dy)
        const mi    = Math.max(0, 1 - dist / 180)
        const bright = (pulse + 1) / 2 * 0.6 + mi * 0.6
        const ci    = Math.floor(((pulse + 1) / 2 + mi) * 3) % 3

        hexPath(h.x, h.y, h.size - 1.5)
        ctx.strokeStyle = palette[ci]
        ctx.globalAlpha = Math.min(bright * 0.8 + mi * 0.4, 0.95)
        ctx.lineWidth   = mi > 0.25 ? 1.8 : 0.7
        ctx.stroke()

        if (bright > 0.6 || mi > 0.2) {
          ctx.fillStyle   = palette[ci]
          ctx.globalAlpha = (bright - 0.4) * 0.14 + mi * 0.22
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
    }

    const onMove  = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
    }
    const onLeave = () => { mouse.x = -999; mouse.y = -999 }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', onLeave)
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [speed])

  return (
    <div ref={wrapRef} className={`relative ${className}`}
         style={{ background: C.bg }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full overflow-hidden" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}