'use client';

import React, { useState, useRef, FormEvent } from 'react';
import {
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess?: (token: string) => void;
}

/** Elimina caracteres que pueden romper fórmulas de Airtable o producir XSS */
function sanitizeField(value: string): string {
  return value.replace(/["'<>`\\]/g, '').trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]{2,}\.[^\s@]{2,}$/.test(email);
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  // Previene doble envío incluso durante cambios rápidos de estado
  const submitting = useRef(false);

  // Validaciones inline
  const emailError =
    touched.email && !email.trim()
      ? 'El correo electrónico es requerido'
      : touched.email && !isValidEmail(email.trim())
      ? 'Ingresa un correo electrónico válido'
      : '';

  const passwordError =
    touched.password && !password ? 'La contraseña es requerida' : '';

  const formValid =
    !!email.trim() && isValidEmail(email.trim()) && !!password;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Marcar todos los campos como tocados para mostrar errores
    setTouched({ email: true, password: true });

    if (!formValid || submitting.current) return;

    submitting.current = true;
    setIsLoading(true);
    setServerError('');

    try {
      const cleanEmail = sanitizeField(email).toLowerCase();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data: { success: boolean; token?: string; message?: string } =
        await res.json();

      if (data.success && data.token) {
        setSuccess(true);
        localStorage.setItem('authToken', data.token);

        if (onLoginSuccess) onLoginSuccess(data.token);

        // Breve feedback visual antes de redirigir
        setTimeout(() => {
          window.location.replace('/dashboard');
        }, 700);
      } else {
        setServerError(
          data.message ?? 'Credenciales incorrectas. Vuelve a intentarlo.',
        );
        // Liberar el lock para permitir reintentos
        submitting.current = false;
      }
    } catch {
      setServerError(
        'Error de conexión. Verifica tu red e intenta nuevamente.',
      );
      submitting.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const blur = (field: 'email' | 'password') =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* ── Error del servidor ── */}
        {serverError && !success && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm leading-relaxed">{serverError}</p>
          </div>
        )}

        {/* ── Éxito ── */}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm font-medium">
              ¡Acceso verificado! Redirigiendo al dashboard…
            </p>
          </div>
        )}

        {/* ── Campo: Correo ── */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-semibold text-gray-700 mb-1.5"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (serverError) setServerError('');
              }}
              onBlur={() => blur('email')}
              disabled={isLoading || success}
              placeholder="correo@empresa.com"
              autoComplete="email"
              autoFocus
              maxLength={254}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'email-err' : undefined}
              className={[
                'w-full pl-10 pr-4 py-3 border rounded-2xl text-sm transition-all duration-150 outline-none',
                'bg-white text-gray-900 placeholder-gray-400',
                emailError
                  ? 'border-red-400 ring-2 ring-red-100 focus:ring-red-200 focus:border-red-500'
                  : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500',
                'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              ].join(' ')}
            />
          </div>
          {emailError && (
            <p
              id="email-err"
              role="alert"
              className="flex items-center gap-1.5 text-red-600 text-xs mt-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {emailError}
            </p>
          )}
        </div>

        {/* ── Campo: Contraseña ── */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-semibold text-gray-700 mb-1.5"
          >
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (serverError) setServerError('');
              }}
              onBlur={() => blur('password')}
              disabled={isLoading || success}
              placeholder="••••••••"
              autoComplete="current-password"
              maxLength={128}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'pwd-err' : undefined}
              className={[
                'w-full pl-10 pr-12 py-3 border rounded-2xl text-sm transition-all duration-150 outline-none',
                'bg-white text-gray-900 placeholder-gray-400',
                passwordError
                  ? 'border-red-400 ring-2 ring-red-100 focus:ring-red-200 focus:border-red-500'
                  : 'border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500',
                'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              ].join(' ')}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              disabled={isLoading || success}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {passwordError && (
            <p
              id="pwd-err"
              role="alert"
              className="flex items-center gap-1.5 text-red-600 text-xs mt-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {passwordError}
            </p>
          )}
        </div>

        {/* ── Botón submit ── */}
        <button
          type="submit"
          disabled={isLoading || success}
          className={[
            'w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200',
            'flex items-center justify-center gap-2',
            isLoading || success
              ? 'bg-blue-500 text-white cursor-not-allowed opacity-80'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow-md',
          ].join(' ')}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando…</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Acceso concedido</span>
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>

      </form>
    </div>
  );
}

