import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import '../../styles/myitmo.css'
import './Admin.css'

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState(null)
  const [popularRoutes, setPopularRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
    loadPopularRoutes()
  }, [])

  const loadStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPopularRoutes = async () => {
    try {
      const response = await api.get('/admin/routes/popular?limit=10')
      setPopularRoutes(response.data)
    } catch (error) {
      console.error('Failed to load popular routes:', error)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="admin-dashboard">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Административная панель</h2>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Статистика системы</h3>
        {statistics && (
          <div className="statistics-grid">
            <div className="itmo-card stat-card">
              <div className="stat-icon">🚗</div>
              <div className="stat-content">
                <div className="stat-label">Всего поездок</div>
                <div className="stat-value">{statistics.totalTrips || 0}</div>
              </div>
            </div>
            <div className="itmo-card stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Завершено поездок</div>
                <div className="stat-value">{statistics.completedTrips || 0}</div>
              </div>
            </div>
            <div className="itmo-card stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Всего пассажиров</div>
                <div className="stat-value">{statistics.totalPassengers || 0}</div>
              </div>
            </div>
            <div className="itmo-card stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">Общий доход</div>
                <div className="stat-value">{statistics.totalRevenue?.toFixed(2) || '0.00'} ₽</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Популярные маршруты</h3>
        <div className="itmo-card">
          {popularRoutes.length === 0 ? (
            <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '20px' }}>Нет данных о маршрутах</p>
          ) : (
            <table className="routes-table">
              <thead>
                <tr>
                  <th>От</th>
                  <th>До</th>
                  <th>Количество поездок</th>
                </tr>
              </thead>
              <tbody>
                {popularRoutes.map((route, index) => (
                  <tr key={index}>
                    <td>{route.fromBuildingName}</td>
                    <td>{route.toBuildingName}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{route.tripCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
