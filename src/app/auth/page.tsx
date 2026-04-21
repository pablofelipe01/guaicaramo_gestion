import AuthContainer from '@/components/auth/AuthContainer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Guaicaramo',
  description: 'Sistema de gestión seguro con autenticación por Airtable',
};

export default function AuthPage() {
  return <AuthContainer />;
}
