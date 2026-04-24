'use client'

const DEFAULT_USER = {
  id: 'local',
  email: 'admin@guaicaramo.com',
  name: 'Administrador',
  role: 'coordinador_sst',
}

export function useAuth() {
  const login = (_token: string) => {}
  const logout = () => {}

  return {
    user: DEFAULT_USER,
    isLoading: false,
    isAuthenticated: true,
    login,
    logout,
  }
}
