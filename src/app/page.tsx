import Link from 'next/link'
import HexBackground from '@/components/ui/HexBackground'
import { Shield, BarChart2, FileCheck, Users } from 'lucide-react'

const FEATURES = [
  { icon: Shield,     label: 'Seguridad',       desc: 'Gestión completa del ciclo PHVA según Res. 0312' },
  { icon: BarChart2,  label: 'Indicadores',      desc: 'KPIs en tiempo real: IF, IS, ILT y más' },
  { icon: FileCheck,  label: 'Documentación',    desc: 'Conservación documental centralizada' },
  { icon: Users,      label: 'Colaboración',     desc: 'Roles diferenciados por área y nivel' },
]

export default function HomePage() {
  return (
    <HexBackground className="min-h-screen" speed={0.5}>
      <div className="flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Guaicaramo" className="h-9 object-contain" />
            <span className="text-white font-semibold text-lg hidden sm:block">Guaicaramo</span>
          </div>
          <Link
            href="/auth"
            className="text-sm font-semibold px-6 py-2 rounded-full text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #28A745, #2C5F8D)' }}
          >
            Iniciar sesión
          </Link>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
          <p className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: '#5DCAA5' }}>
            Sistema de Gestión SG-SST
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight max-w-2xl mb-6">
            Seguridad y Salud en el Trabajo, todo en un solo lugar
          </h1>
          <p className="text-white/60 text-lg max-w-xl mb-10">
            Plataforma integral para gestionar el ciclo PHVA, indicadores, capacitaciones, inspecciones y mucho más — conforme al Decreto 1072 y la Resolución 0312.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #28A745, #2C5F8D)' }}
          >
            Acceder al sistema →
          </Link>
        </main>

        {/* Features */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-8 pb-16 max-w-4xl mx-auto w-full">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-xl p-5 text-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex justify-center mb-3">
                <Icon size={22} style={{ color: '#5DCAA5' }} />
              </div>
              <p className="text-white text-sm font-semibold mb-1">{label}</p>
              <p className="text-white/50 text-xs leading-snug">{desc}</p>
            </div>
          ))}
        </section>

        {/* Footer */}
        <footer className="text-center pb-8 text-xs text-white/25">
          © 2026 Guaicaramo. Todos los derechos reservados.
        </footer>
      </div>
    </HexBackground>
  )
}
