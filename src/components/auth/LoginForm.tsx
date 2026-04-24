'use client';

import React, { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { validateLoginForm } from '@/lib/validation';

interface LoginFormProps {
  onLoginSuccess?: (token: string) => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onLoginSuccess, onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const submitting = useRef(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validateLoginForm(email, password);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    if (submitting.current) return;
    submitting.current = true;
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const response = await res.json();

      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        setSuccessMessage('¡Autenticación exitosa! Redirigiendo...');
        if (onLoginSuccess) onLoginSuccess(response.token);
        router.replace('/dashboard');
      } else {
        setErrorMessage(response.message || 'Credenciales incorrectas. Verifica tu email y contraseña.');
        submitting.current = false;
      }
    } catch {
      setErrorMessage('Error de conexión. Intenta de nuevo más tarde.');
      submitting.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div role="status" className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700 text-sm">{successMessage}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="tu@email.com"
          className={`input-field ${errors.email ? 'input-error' : ''}`}
          autoComplete="email"
          maxLength={254}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-error">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Tu contraseña"
            className={`input-field ${errors.password ? 'input-error' : ''}`}
            autoComplete="current-password"
            maxLength={128}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p id="password-error" role="alert" className="text-error">{errors.password}</p>
        )}
      </div>

      <div className="flex justify-end">
        <span className="text-sm text-gray-400 font-medium cursor-not-allowed select-none">
          ¿Olvidaste tu contraseña?
        </span>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Autenticando...
          </>
        ) : (
          'Iniciar Sesión'
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿No tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Regístrate aquí
        </button>
      </p>
    </form>
  );
}
