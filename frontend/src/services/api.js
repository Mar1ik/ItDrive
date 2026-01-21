import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Добавляем токен из localStorage при инициализации
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Удаляем токен и userId, но не делаем полную перезагрузку
      // React Router сам обработает редирект через PrivateRoute
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      delete api.defaults.headers.common['Authorization']
      
      // Только если мы не на странице логина/регистрации
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        // Используем событие для уведомления о необходимости редиректа
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
    }
    return Promise.reject(error)
  }
)

export default api
