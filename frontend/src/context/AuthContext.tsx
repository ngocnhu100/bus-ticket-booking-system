import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getRefreshToken,
  clearTokens,
  storeTokens,
  refreshAccessToken,
} from '@/api/auth'
import { useNavigate } from 'react-router-dom'

// Types
interface User {
  userId: number
  email: string
  phone: string | null
  fullName: string
  role: 'passenger' | 'admin'
  emailVerified: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (authData: {
    accessToken: string
    refreshToken: string
    user: User
  }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export { AuthContext }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate()

  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user')
      const refreshToken = getRefreshToken()

      console.log('🔐 Auth Initialization:', {
        hasStoredUser: !!storedUser,
        hasRefreshToken: !!refreshToken,
      })

      if (storedUser && refreshToken) {
        try {
          // Try to refresh the access token
          const newAccessToken = await refreshAccessToken()
          setUser(JSON.parse(storedUser))
          setToken(newAccessToken)
          console.log('✅ Token refreshed successfully')
        } catch (error) {
          // If refresh fails, clear tokens and user
          console.error('❌ Failed to refresh token:', error)
          clearTokens()
          localStorage.removeItem('user')
          setUser(null)
          setToken(null)
        }
      } else {
        console.log('⚠️ No stored user or refresh token found')
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = (authData: {
    accessToken: string
    refreshToken: string
    user: User
  }) => {
    storeTokens({
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
    })

    localStorage.setItem('user', JSON.stringify(authData.user))
    setUser(authData.user)
    setToken(authData.accessToken)

    if (authData.user.role === 'admin') {
      navigate('/admin', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  const logout = () => {
    clearTokens()
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
