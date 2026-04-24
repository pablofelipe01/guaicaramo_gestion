'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from './LoginForm';
import {
  Shield,
  FileText,
  Users,
  BarChart3,
  CheckCircle,
  HardHat,
} from 'lucide-react';
import { isTokenValid } from '@/lib/token';

const features = [
  { icon: Shield, label: 'Cumplimiento Decreto 1072' },
  { icon: FileText, label: 'Gestión documental' },
  { icon: Users, label: 'Control de personal SST' },
  { icon: BarChart3, label: 'Indicadores PHVA' },
];

export default function AuthContainer() {
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token && isTokenValid(token)) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Panel izquierdo: Branding ── */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col justify-between p-14 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900">
        {/* Círculos decorativos de fondo */}
        <div className="absolute inset-0 pointer-events-none select-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white opacity-5" />
          <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-white opacity-5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full border border-white opacity-5" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
            <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-none">Guaicaramo</p>
            <p className="text-blue-300 text-xs mt-0.5">SG-SST</p>
          </div>
        </div>

        {/* Texto hero */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Seguridad y Salud<br />
            <span className="text-blue-300">en el Trabajo</span>
          </h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm mb-10">
            Plataforma integral de gestión basada en el ciclo PHVA, alineada con el
            Decreto&nbsp;1072 de 2015 y la Resolución&nbsp;0312 de 2019.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white text-sm font-medium leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-300" />
          <p className="text-blue-300 text-xs">
            © 2026 Guaicaramo · Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ── Panel derecho: Formulario ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-[420px]">
          {/* Branding mobile */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow">
              <HardHat className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Guaicaramo SG-SST</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Encabezado de la card */}
            <div className="px-8 pt-7 pb-0 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 pb-4">Iniciar Sesión</h2>
            </div>

            {/* Formulario */}
            <div className="p-8">
              <LoginForm />
            </div>
          </div>

          {/* Nota seguridad */}
          <p className="text-center mt-5 text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3" />
            Conexión cifrada · Tokens JWT · Datos protegidos
          </p>
        </div>
      </div>
    </div>
  );
}

