'use client'

import { useEffect, useState } from 'react'
import { decodeToken, type TokenPayload } from '@/lib/token'

type User = Omit<TokenPayload, 'iat' | 'exp'>

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')

    if (token) {
      const payload = decodeToken(token)
      if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
        setUser({ id: payload.id, email: payload.email, name: payload.name, role: payload.role })
        setIsAuthenticated(true)
      } else {
        // Solo eliminar si el token está genuinamente expirado (payload decodificado pero exp vencido)
        // Si payload es null (error de parseo), conservar el token para no desautenticar erróneamente
        if (payload !== null) localStorage.removeItem('authToken')
        setUser(null)
        setIsAuthenticated(false)
      }
    } else {
      setUser(null)
      setIsAuthenticated(false)
    }

    setIsLoading(false)
  }, [])

  const login = (token: string) => {
    localStorage.setItem('authToken', token)
    const payload = decodeToken(token)
    if (payload) {
      setUser({ id: payload.id, email: payload.email, name: payload.name, role: payload.role })
      setIsAuthenticated(true)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    setIsAuthenticated(false)
  }

  return { user, isLoading, isAuthenticated, login, logout }
}
