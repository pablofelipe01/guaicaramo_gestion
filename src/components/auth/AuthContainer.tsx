'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Lock, Shield } from 'lucide-react';
import { isTokenValid } from '@/lib/token';

export default function AuthContainer() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);

  // Fix #3: redirigir al dashboard si ya hay sesión activa
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Guaicaramo</h1>
            </div>
            <p className="text-gray-600 text-sm">Sistema de Gestión</p>
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {isLogin
              ? 'Accede a tu cuenta para continuar'
              : 'Crea una nueva cuenta para empezar'}
          </p>

          {/* Indicador de Seguridad */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-6">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">
              Conexión segura a Airtable
            </span>
          </div>

          {/* Formularios */}
          {isLogin ? (
            <LoginForm
              onSwitchToRegister={() => setIsLogin(false)}
              onLoginSuccess={() => {
                // El componente maneja la redirección
              }}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={() => setIsLogin(true)}
              onRegisterSuccess={() => {
                // El componente maneja la redirección
              }}
            />
          )}
        </div>

        {/* Pie de Página */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>© 2026 Guaicaramo. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
