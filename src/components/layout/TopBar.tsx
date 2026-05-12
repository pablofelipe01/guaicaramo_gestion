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
    <header className="h-14 flex items-center justify-between px-4 shrink-0 bg-white border-b border-gray-200">
      {/* Izquierda: menú móvil + botón volver o inicio */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-colors hover:bg-gray-100"
          aria-label="Abrir menú"
          title="Abrir menú de navegación"
          style={{ color: '#6C757D' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        {!enDashboardInicio ? (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors hover:bg-gray-100"
            title="Volver al panel de inicio"
            style={{ color: '#6C757D' }}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Inicio</span>
          </button>
        ) : (
          <Link
            href="/dashboard"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg"
            style={{ color: '#6C757D' }}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Inicio</span>
          </Link>
        )}
      </div>

      {/* Derecha: usuario y logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-800">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: '#e8f5eb' }}
          >
            <User className="w-4 h-4" style={{ color: '#28A745' }} />
          </div>
          <span className="hidden sm:block font-medium">{user?.name ?? '...'}</span>
          {user?.role && (
            <span className="hidden sm:block text-xs capitalize text-gray-400">
              ({user.role})
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors hover:bg-gray-100"
          title="Cerrar sesión"
          style={{ color: '#6C757D' }}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
