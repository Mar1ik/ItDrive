import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import '../../styles/myitmo.css'
import './Passenger.css'

const PassengerProfile = () => {
  const { user } = useAuth()
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const response = await api.get('/users/profile/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="profile-page">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Личный кабинет</h2>
      </div>

      {/* Информация о пользователе */}
      <div className="itmo-card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Информация о пользователе</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Имя</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>
                {user?.firstName} {user?.lastName}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Email</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>{user?.email}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Телефон</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>
                {user?.phoneNumber || 'Не указан'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Рейтинг</div>
              <div style={{ fontSize: '16px', fontWeight: 500 }}>
                {user?.rating ? user.rating.toFixed(2) : '5.00'} ⭐
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      {statistics && (
        <div className="itmo-card">
          <div className="card-header">
            <h3 className="card-title">Статистика</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="stat-card">
                <div className="stat-label">Всего бронирований</div>
                <div className="stat-value">{statistics.totalBookings}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Завершенных</div>
                <div className="stat-value" style={{ color: '#28a745' }}>
                  {statistics.completedBookings}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Отмененных</div>
                <div className="stat-value" style={{ color: '#dc3545' }}>
                  {statistics.cancelledBookings}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Всего потрачено</div>
                <div className="stat-value" style={{ color: '#007bff' }}>
                  {statistics.totalSpent ? statistics.totalSpent.toFixed(2) : '0.00'} ₽
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Средний рейтинг</div>
                <div className="stat-value">
                  {statistics.averageRating ? statistics.averageRating.toFixed(2) : '5.00'} ⭐
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Всего поездок</div>
                <div className="stat-value">{statistics.totalTrips || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PassengerProfile
