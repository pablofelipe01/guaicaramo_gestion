/**
 * Utilidades de validación para formularios
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valida el formato de email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida la contraseña
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una mayúscula
 * - Al menos una minúscula
 * - Al menos un número
 * - Al menos un carácter especial
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida el nombre de usuario
 */
export function validateName(name: string): boolean {
  return name.trim().length >= 3 && name.trim().length <= 100;
}

/**
 * Valida un formulario de login
 */
export function validateLoginForm(email: string, password: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!email.trim()) {
    errors.push({ field: 'email', message: 'El email es requerido' });
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: 'El email no es válido' });
  }

  if (!password) {
    errors.push({ field: 'password', message: 'La contraseña es requerida' });
  }

  return errors;
}

/**
 * Valida un formulario de registro
 */
export function validateRegistrationForm(
  email: string,
  password: string,
  confirmPassword: string,
  name: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validar email
  if (!email.trim()) {
    errors.push({ field: 'email', message: 'El email es requerido' });
  } else if (!validateEmail(email)) {
    errors.push({ field: 'email', message: 'El email no es válido' });
  }

  // Validar nombre
  if (!name.trim()) {
    errors.push({ field: 'name', message: 'El nombre es requerido' });
  } else if (!validateName(name)) {
    errors.push({ field: 'name', message: 'El nombre debe tener entre 3 y 100 caracteres' });
  }

  // Validar contraseña
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.push({ field: 'password', message: passwordValidation.errors.join('. ') });
  }

  // Validar coincidencia de contraseñas
  if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: 'Las contraseñas no coinciden' });
  }

  return errors;
}

/**
 * Sanitiza una entrada de texto para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
