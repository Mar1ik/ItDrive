import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import '../../styles/myitmo.css'
import './Driver.css'

const DriverProfile = () => {
  const { user } = useAuth()
  const [statistics, setStatistics] = useState(null)
  const [driver, setDriver] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsResponse, carResponse] = await Promise.all([
        api.get('/driver/statistics'),
        api.get('/driver/car').catch(() => null)
      ])
      setStatistics(statsResponse.data)
      if (carResponse) {
        setDriver(carResponse.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
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
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Личный кабинет водителя</h2>
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

      {/* Информация об автомобиле */}
      {driver && (
        <div className="itmo-card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Информация об автомобиле</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Модель</div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{driver.carModel}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Номер</div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{driver.carNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Мест</div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>{driver.carSeats}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Цвет</div>
                <div style={{ fontSize: '16px', fontWeight: 500 }}>
                  {driver.carColor || 'Не указан'}
                </div>
              </div>
              {driver.experience !== undefined && (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Опыт</div>
                  <div style={{ fontSize: '16px', fontWeight: 500 }}>
                    {driver.experience} {driver.experience === 1 ? 'год' : driver.experience < 5 ? 'года' : 'лет'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Статистика */}
      {statistics && (
        <div className="itmo-card">
          <div className="card-header">
            <h3 className="card-title">Статистика</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="stat-card">
                <div className="stat-label">Всего поездок</div>
                <div className="stat-value">{statistics.totalTrips}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Завершенных</div>
                <div className="stat-value" style={{ color: '#28a745' }}>
                  {statistics.completedTrips}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Отмененных</div>
                <div className="stat-value" style={{ color: '#dc3545' }}>
                  {statistics.cancelledTrips}
                </div>
              </div>
              <div className="stat-card" style={{ gridColumn: 'span 1' }}>
                <div className="stat-label">Всего пассажиров</div>
                <div className="stat-value">{statistics.totalPassengers}</div>
              </div>
              <div className="stat-card" style={{ gridColumn: 'span 2', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="stat-label" style={{ color: '#fff' }}>Общий заработок</div>
                <div className="stat-value" style={{ color: '#fff', fontSize: '28px', fontWeight: 700 }}>
                  {statistics.totalEarnings ? statistics.totalEarnings.toFixed(2) : '0.00'} ₽
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Средний рейтинг</div>
                <div className="stat-value">
                  {statistics.averageRating ? statistics.averageRating.toFixed(2) : '5.00'} ⭐
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Всего поездок (счетчик)</div>
                <div className="stat-value">{statistics.totalTripsCount || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverProfile
