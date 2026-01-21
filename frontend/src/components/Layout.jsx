import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/myitmo.css'
import './Layout.css'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name[0].toUpperCase()
  }

  const getNavLinks = () => {
    if (user?.role === 'ADMIN') {
      return [
        { path: '/admin', label: 'Статистика', icon: '📊' },
        { path: '/admin/users', label: 'Пользователи', icon: '👥' },
        { path: '/admin/routes', label: 'Маршруты', icon: '🗺️' },
        { path: '/admin/reviews', label: 'Отзывы', icon: '⭐' }
      ]
    } else if (user?.role === 'DRIVER') {
      return [
        { path: '/driver', label: 'Мои поездки', icon: '🚗' },
        { path: '/driver/create', label: 'Создать поездку', icon: '➕' },
        { path: '/driver/my-car', label: 'Мой автомобиль', icon: '🚙' },
        { path: '/driver/profile', label: 'Личный кабинет', icon: '👤' }
      ]
    } else {
      return [
        { path: '/passenger', label: 'Найти поездку', icon: '🔍' },
        { path: '/passenger/my-bookings', label: 'Мои бронирования', icon: '📋' },
        { path: '/passenger/profile', label: 'Личный кабинет', icon: '👤' }
      ]
    }
  }

  const getPageTitle = () => {
    const links = getNavLinks()
    const current = links.find(link => location.pathname.startsWith(link.path))
    return current ? current.label : 'Главная'
  }

  return (
    <div className="app-wrapper">
      {/* Top Bar */}
      <header className="top-bar">
        <Link to="/" className="logo">
          <div className="logo-icon">IT</div>
          <span>Drive</span>
        </Link>
        
        <h1 className="page-title">{getPageTitle()}</h1>
        
        <div className="top-bar-actions">
          <div className="user-profile" onClick={() => {
            const profilePath = user?.role === 'DRIVER' ? '/driver/profile' : '/passenger/profile'
            navigate(profilePath)
          }}>
            <div className="user-avatar">
              {getInitials(user?.email || 'User')}
            </div>
            <div>
              <div className="user-name">{user?.email}</div>
              <div className="user-id">ID: {user?.id}</div>
            </div>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <nav>
          <ul className="nav-menu">
            {getNavLinks().map((link) => (
              <li key={link.path} className="nav-item">
                <Link
                  to={link.path}
                  className={`nav-link ${location.pathname.startsWith(link.path) ? 'active' : ''}`}
                >
                  <span className="nav-icon">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content-wrapper">
        {children}
      </main>
    </div>
  )
}

export default Layout
