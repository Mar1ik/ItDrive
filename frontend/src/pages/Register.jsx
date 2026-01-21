import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/myitmo.css'
import './Auth.css'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'PASSENGER',
    phoneNumber: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await register(formData)
    
    if (result.success) {
      const role = result.user?.role || formData.role
      navigate(`/${role.toLowerCase()}`)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card itmo-card">
        <div className="card-header">
          <h1 className="card-title">Регистрация в ItDrive</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="example@mail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Пароль *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Минимум 6 символов"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Пароль должен содержать минимум 6 символов
            </small>
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Имя *</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                placeholder="Ваше имя"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group" style={{ flex: 1, marginLeft: '16px' }}>
              <label className="form-label">Фамилия *</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                placeholder="Ваша фамилия"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Роль *</label>
            <select
              name="role"
              className="form-input form-select"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="PASSENGER">Пассажир</option>
              <option value="DRIVER">Водитель</option>
            </select>
            <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Выберите роль: Пассажир — для поиска поездок, Водитель — для создания поездок
            </small>
          </div>
          
          <div className="form-group">
            <label className="form-label">Телефон</label>
            <input
              type="tel"
              name="phoneNumber"
              className="form-input"
              placeholder="+7 (999) 123-45-67 или 79245984833"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
            <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Необязательное поле. Можно вводить номер в любом формате
            </small>
          </div>
          
          {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
