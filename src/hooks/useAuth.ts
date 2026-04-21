'use client'

import { useEffect, useState } from 'react'
import { decodeToken, isTokenValid, type TokenPayload } from '@/lib/token'

type User = Omit<TokenPayload, 'iat' | 'exp'>

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('authToken')

    if (token && isTokenValid(token)) {
      const payload = decodeToken(token)
      if (payload) {
        setUser({ id: payload.id, email: payload.email, name: payload.name, role: payload.role })
        setIsAuthenticated(true)
      }
    } else {
      if (token) localStorage.removeItem('authToken')
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
