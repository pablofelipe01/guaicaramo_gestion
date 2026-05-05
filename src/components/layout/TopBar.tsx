'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Menu, LogOut, User, ChevronLeft, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const enDashboardInicio = pathname === '/dashboard'

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
      {/* Izquierda: menú móvil + botón volver o inicio */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-50"
          aria-label="Abrir menú"
          title="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {!enDashboardInicio ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-lg transition-colors"
            title="Volver al panel de inicio"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Inicio</span>
          </button>
        ) : (
          <Link
            href="/dashboard"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 rounded-lg"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Inicio</span>
          </Link>
        )}
      </div>

      {/* Derecha: usuario y logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--sst-green-50)' }}
          >
            <User className="w-4 h-4" style={{ color: 'var(--sst-green-700)' }} />
          </div>
          <span className="hidden sm:block font-medium">{user?.name ?? '...'}</span>
          {user?.role && (
            <span className="hidden sm:block text-xs text-gray-400 capitalize">
              ({user.role})
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
