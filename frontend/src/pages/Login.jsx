import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/myitmo.css'
import './Auth.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsBlocked(false)
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      const role = result.user?.role || 'PASSENGER'
      navigate(`/${role.toLowerCase()}`)
    } else {
      if (result.errorType === 'USER_BLOCKED') {
        setIsBlocked(true)
        setError(result.error || 'Ваш аккаунт заблокирован. Обратитесь к администратору по адресу admin@itdrive.ru')
      } else {
        setError(result.error)
        setIsBlocked(false)
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card itmo-card">
        <div className="card-header">
          <h1 className="card-title">Вход в ItDrive</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              className="form-input"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Введите ваш email для входа
            </small>
          </div>
          
          <div className="form-group">
            <label className="form-label">Пароль *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Введите пароль от вашего аккаунта
            </small>
          </div>
          
          {error && (
            <div 
              className={isBlocked ? "error-blocked" : "error"} 
              style={{ 
                marginBottom: '16px',
                padding: isBlocked ? '16px' : '12px',
                borderRadius: '8px',
                background: isBlocked ? '#fff3cd' : '#f8d7da',
                border: isBlocked ? '1px solid #ffc107' : '1px solid #f5c6cb',
                color: isBlocked ? '#856404' : '#721c24',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {isBlocked && <span style={{ fontSize: '24px' }}>🚫</span>}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: isBlocked ? '4px' : '0' }}>
                  {isBlocked ? 'Аккаунт заблокирован' : 'Ошибка входа'}
                </div>
                <div style={{ fontSize: '14px' }}>{error}</div>
                {isBlocked && (
                  <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.9 }}>
                    📧 admin@itdrive.ru
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="auth-link">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
