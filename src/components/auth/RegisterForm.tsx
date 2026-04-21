'use client';

import React, { useState, FormEvent } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { validateRegistrationForm, validatePassword } from '@/lib/validation';

interface RegisterFormProps {
  onRegisterSuccess?: (token: string) => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Actualizar requisitos de contraseña en tiempo real
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);

    setPasswordRequirements({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*]/.test(pwd),
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');

    // Validar formulario
    const validationErrors = validateRegistrationForm(email, password, confirmPassword, name);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const response = await res.json();

      if (response.success && response.token) {
        setSuccessMessage('¡Registro exitoso! Redirigiendo...');
        // Guardar token en localStorage
        localStorage.setItem('authToken', response.token);

        if (onRegisterSuccess) {
          onRegisterSuccess(response.token);
        }

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        setErrorMessage(response.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Error de conexión. Intenta de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mensajes de Error/Éxito */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700 text-sm">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700 text-sm">{successMessage}</span>
        </div>
      )}

      {/* Campo Nombre */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre Completo
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          placeholder="Tu nombre"
          className={`input-field ${errors.name ? 'input-error' : ''}`}
        />
        {errors.name && <p className="text-error">{errors.name}</p>}
      </div>

      {/* Campo Email */}
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
        />
        {errors.email && <p className="text-error">{errors.email}</p>}
      </div>

      {/* Campo Contraseña */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
            placeholder="Tu contraseña"
            className={`input-field ${errors.password ? 'input-error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Requisitos de Contraseña */}
        {password && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-1">
            <p className="text-xs font-medium text-gray-700 mb-2">Requisitos:</p>
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-3 h-3 rounded-full ${
                  passwordRequirements.length ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className={passwordRequirements.length ? 'text-green-600' : 'text-gray-600'}>
                8+ caracteres
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-3 h-3 rounded-full ${
                  passwordRequirements.uppercase ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className={passwordRequirements.uppercase ? 'text-green-600' : 'text-gray-600'}>
                Una mayúscula (A-Z)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-3 h-3 rounded-full ${
                  passwordRequirements.lowercase ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className={passwordRequirements.lowercase ? 'text-green-600' : 'text-gray-600'}>
                Una minúscula (a-z)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-3 h-3 rounded-full ${
                  passwordRequirements.number ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className={passwordRequirements.number ? 'text-green-600' : 'text-gray-600'}>
                Un número (0-9)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-3 h-3 rounded-full ${
                  passwordRequirements.special ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className={passwordRequirements.special ? 'text-green-600' : 'text-gray-600'}>
                Un carácter especial (!@#$%^&*)
              </span>
            </div>
          </div>
        )}

        {errors.password && <p className="text-error">{errors.password}</p>}
      </div>

      {/* Campo Confirmar Contraseña */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Confirma tu contraseña"
            className={`input-field ${errors.confirmPassword ? 'input-error' : ''}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-error">{errors.confirmPassword}</p>}
      </div>

      {/* Botón Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Registrando...
          </>
        ) : (
          'Crear Cuenta'
        )}
      </button>

      {/* Enlace a Login */}
      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Inicia sesión aquí
        </button>
      </p>
    </form>
  );
}
