'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import { Lock, Shield } from 'lucide-react';
import { isTokenValid } from '@/lib/token';

export default function AuthContainer() {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token && isTokenValid(token)) {
      router.replace('/dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card Principal */}
        <div className="card p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="w-6 h-6 text-green-700" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Guaicaramo</h1>
            </div>
            <p className="text-gray-600 text-sm">Sistema de Gestión</p>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">Iniciar Sesión</h2>
          <p className="text-gray-600 text-sm mb-6">Accede a tu cuenta para continuar</p>

          {/* Indicador de Seguridad */}
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg mb-6">
            <Shield className="w-5 h-5 text-green-700" />
            <span className="text-xs text-green-800 font-medium">
              Conexión segura a Airtable
            </span>
          </div>

          <LoginForm onLoginSuccess={() => { /* El componente maneja la redirección */ }} />
        </div>

        {/* Pie de Página */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>© 2026 Guaicaramo. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
