'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Loader, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Lista de roles que pueden acceder a esta ruta.
   * Si se omite, cualquier usuario autenticado puede acceder.
   */
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-green-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth');
    return null;
  }

  // Verificar rol si se especificaron roles requeridos
  if (roles && roles.length > 0) {
    const rolUsuario = (user?.role ?? 'operativo').toLowerCase();
    const tieneRol =
      rolUsuario === 'superadmin' || // superadmin siempre pasa
      roles.map((r) => r.toLowerCase()).includes(rolUsuario);

    if (!tieneRol) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-sm mx-auto p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Acceso denegado</h2>
            <p className="text-gray-500 text-sm mb-6">
              No tienes permisos para acceder a esta sección.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-primary"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
