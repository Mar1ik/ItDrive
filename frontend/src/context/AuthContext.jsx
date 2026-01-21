import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    try {
      // Извлекаем userId из токена (или делаем отдельный запрос)
      // Для простоты используем localStorage
      const userId = localStorage.getItem('userId')
      if (userId) {
        const response = await api.get(`/users/${userId}`)
        setUser(response.data)
      } else {
        // Если нет userId, но есть токен, возможно токен невалидный
        // Очищаем состояние
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      // Если ошибка 401, интерцептор сам обработает выход
      // Для других ошибок просто очищаем состояние
      if (error.response?.status !== 401) {
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        delete api.defaults.headers.common['Authorization']
      }
      // В любом случае завершаем загрузку
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Загрузить информацию о пользователе
      loadUser()
    } else {
      setLoading(false)
    }

    // Слушаем событие выхода из системы (от интерцептора)
    const handleLogout = () => {
      setToken(null)
      setUser(null)
    }

    window.addEventListener('auth:logout', handleLogout)

    return () => {
      window.removeEventListener('auth:logout', handleLogout)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, userId, email: userEmail, role } = response.data
      
      setToken(token)
      setUser({ id: userId, email: userEmail, role })
      
      localStorage.setItem('token', token)
      localStorage.setItem('userId', userId)
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true, user: { id: userId, email: userEmail, role } }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка входа'
      const errorType = error.response?.data?.error
      
      return { 
        success: false, 
        error: errorMessage,
        errorType: errorType
      }
    }
  }

  const register = async (registerData) => {
    try {
      const response = await api.post('/auth/register', registerData)
      const { token, userId, email: userEmail, role } = response.data
      
      setToken(token)
      setUser({ id: userId, email: userEmail, role })
      
      localStorage.setItem('token', token)
      localStorage.setItem('userId', userId)
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true, user: { id: userId, email: userEmail, role } }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Ошибка регистрации' 
      }
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    delete api.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
