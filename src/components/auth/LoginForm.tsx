'use client';

import React, { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader, X, Mail, KeyRound, Lock } from 'lucide-react';
import { validateLoginForm } from '@/lib/validation';

interface LoginFormProps {
  onLoginSuccess?: (token: string) => void;
}

type ForgotStep = 'email' | 'code' | 'password' | 'done';

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const submitting = useRef(false);

  // Modal recuperación
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validateLoginForm(email, password);
    if (validationErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      validationErrors.forEach((err) => { errorMap[err.field] = err.message; });
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

  const handleSendCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotEmail.trim()) { setForgotError('Ingresa tu email.'); return; }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success && data.resetToken) {
        setResetToken(data.resetToken);
        setForgotStep('code');
      } else {
        setForgotError(data.message || 'Error al enviar el código.');
      }
    } catch {
      setForgotError('Error de conexión. Intenta de nuevo.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyCode = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotError('');
    if (!/^\d{6}$/.test(forgotCode.trim())) { setForgotError('Ingresa el código de 6 dígitos.'); return; }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, code: forgotCode.trim() }),
      });
      const data = await res.json();
      if (data.success && data.verifiedToken) {
        setVerifiedToken(data.verifiedToken);
        setForgotStep('password');
      } else {
        setForgotError(data.message || 'Código incorrecto o expirado.');
      }
    } catch {
      setForgotError('Error de conexión. Intenta de nuevo.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotError('');
    if (forgotPassword.length < 8) { setForgotError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (!/[A-Z]/.test(forgotPassword)) { setForgotError('La contraseña debe incluir al menos una letra mayúscula.'); return; }
    if (!/[0-9]/.test(forgotPassword)) { setForgotError('La contraseña debe incluir al menos un número.'); return; }
    if (forgotPassword !== forgotConfirm) { setForgotError('Las contraseñas no coinciden.'); return; }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedToken, newPassword: forgotPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStep('done');
      } else {
        setForgotError(data.message || 'Error al actualizar la contraseña.');
      }
    } catch {
      setForgotError('Error de conexión. Intenta de nuevo.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotStep('email');
    setForgotError('');
    setForgotEmail('');
    setForgotCode('');
    setForgotPassword('');
    setForgotConfirm('');
    setResetToken('');
    setVerifiedToken('');
  };

  const stepNum = { email: 1, code: 2, password: 3, done: 3 }[forgotStep];

  return (
    <>
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading} placeholder="tu@email.com"
            className={`input-field ${errors.email ? 'input-error' : ''}`}
            autoComplete="email" maxLength={254}
            aria-describedby={errors.email ? 'email-error' : undefined} />
          {errors.email && <p id="email-error" role="alert" className="text-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
              placeholder="Tu contraseña"
              className={`input-field ${errors.password ? 'input-error' : ''}`}
              autoComplete="current-password" maxLength={128}
              aria-describedby={errors.password ? 'password-error' : undefined} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p id="password-error" role="alert" className="text-error">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => setShowForgot(true)}
            className="text-sm text-green-700 hover:text-green-800 font-medium">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" disabled={isLoading}
          className="w-full btn btn-primary flex items-center justify-center gap-2">
          {isLoading ? <><Loader className="w-5 h-5 animate-spin" />Autenticando...</> : 'Iniciar Sesión'}
        </button>
      </form>

      {/* Modal recuperar contraseña — 3 pasos */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog" aria-modal="true" aria-labelledby="forgot-title">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">

            <div className="flex items-center justify-between mb-5">
              <h3 id="forgot-title" className="text-lg font-bold text-gray-900">Recuperar contraseña</h3>
              <button type="button" onClick={closeForgot} aria-label="Cerrar" className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indicador de pasos */}
            {forgotStep !== 'done' && (
              <div className="flex items-center gap-1 mb-5">
                {[1, 2, 3].map((n, i) => (
                  <React.Fragment key={n}>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-colors ${
                      n < stepNum ? 'bg-green-500 text-white' : n === stepNum ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {n < stepNum ? '✓' : n}
                    </div>
                    {i < 2 && <div className={`flex-1 h-0.5 ${n < stepNum ? 'bg-green-400' : 'bg-gray-200'}`} />}
                  </React.Fragment>
                ))}
              </div>
            )}

            {forgotError && (
              <div role="alert" className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-xs">{forgotError}</span>
              </div>
            )}

            {/* Paso 1 */}
            {forgotStep === 'email' && (
              <form onSubmit={handleSendCode} className="space-y-4">
                <p className="text-sm text-gray-500">Ingresa tu email registrado. Te enviaremos un código de 6 dígitos válido por 10 minutos.</p>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input id="forgot-email" type="email" value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)} disabled={forgotLoading}
                    placeholder="tu@email.com" className="input-field" autoComplete="email" maxLength={254} autoFocus />
                </div>
                <button type="submit" disabled={forgotLoading} className="w-full btn-primary flex items-center justify-center gap-2">
                  {forgotLoading ? <><Loader className="w-4 h-4 animate-spin" />Enviando...</> : <><Mail className="w-4 h-4" />Enviar código</>}
                </button>
              </form>
            )}

            {/* Paso 2 */}
            {forgotStep === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-sm text-gray-500">Revisá tu bandeja de entrada en <strong>{forgotEmail}</strong> e ingresa el código de 6 dígitos.</p>
                <div>
                  <label htmlFor="forgot-code" className="block text-sm font-medium text-gray-700 mb-1">Código de verificación</label>
                  <input id="forgot-code" type="text" inputMode="numeric" pattern="\d{6}"
                    value={forgotCode} onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    disabled={forgotLoading} placeholder="000000"
                    className="input-field text-center text-2xl font-bold tracking-widest"
                    maxLength={6} autoFocus />
                </div>
                <button type="submit" disabled={forgotLoading || forgotCode.length < 6}
                  className="w-full btn-primary flex items-center justify-center gap-2">
                  {forgotLoading ? <><Loader className="w-4 h-4 animate-spin" />Verificando...</> : <><KeyRound className="w-4 h-4" />Verificar código</>}
                </button>
                <button type="button" onClick={() => { setForgotStep('email'); setForgotCode(''); setForgotError(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 text-center">
                  ← Cambiar email
                </button>
              </form>
            )}

            {/* Paso 3 */}
            {forgotStep === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-sm text-gray-500">Código verificado. Define tu nueva contraseña.</p>
                <div>
                  <label htmlFor="forgot-new-password" className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input id="forgot-new-password" type={showForgotPassword ? 'text' : 'password'}
                      value={forgotPassword} onChange={(e) => setForgotPassword(e.target.value)}
                      disabled={forgotLoading} placeholder="Mínimo 8 caracteres"
                      className="input-field" autoComplete="new-password" maxLength={128} autoFocus />
                    <button type="button" onClick={() => setShowForgotPassword(!showForgotPassword)} disabled={forgotLoading}
                      aria-label={showForgotPassword ? 'Ocultar' : 'Mostrar'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="forgot-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                  <input id="forgot-confirm" type="password" value={forgotConfirm}
                    onChange={(e) => setForgotConfirm(e.target.value)} disabled={forgotLoading}
                    placeholder="Repite la contraseña" className="input-field"
                    autoComplete="new-password" maxLength={128} />
                </div>
                <button type="submit" disabled={forgotLoading} className="w-full btn-primary flex items-center justify-center gap-2 mt-1">
                  {forgotLoading ? <><Loader className="w-4 h-4 animate-spin" />Guardando...</> : <><Lock className="w-4 h-4" />Guardar contraseña</>}
                </button>
              </form>
            )}

            {/* Paso 4: éxito */}
            {forgotStep === 'done' && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1">¡Contraseña actualizada!</h4>
                <p className="text-sm text-gray-500 mb-5">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                <button type="button" onClick={closeForgot} className="w-full btn-primary">
                  Ir al inicio de sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
