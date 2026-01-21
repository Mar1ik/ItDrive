import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Map from '../../components/Map'
import '../../styles/myitmo.css'
import './Driver.css'

const DriverDashboard = () => {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = async () => {
    try {
      const response = await api.get(`/trips/driver/${user.id}`)
      setTrips(response.data)
    } catch (error) {
      console.error('Failed to load trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTrip = async (tripId) => {
    try {
      await api.put(`/trips/${tripId}/start`)
      loadTrips()
    } catch (error) {
      alert('Ошибка при начале поездки')
    }
  }

  const handleCompleteTrip = async (tripId) => {
    try {
      await api.put(`/trips/${tripId}/complete`)
      loadTrips()
    } catch (error) {
      alert('Ошибка при завершении поездки')
    }
  }

  const handleCancelTrip = async (tripId) => {
    if (!confirm('Вы уверены, что хотите отменить поездку?')) return
    
    try {
      await api.delete(`/trips/${tripId}`)
      loadTrips()
    } catch (error) {
      alert('Ошибка при отмене поездки')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      SCHEDULED: { label: 'Запланирована', class: 'status-scheduled' },
      IN_PROGRESS: { label: 'В процессе', class: 'status-in-progress' },
      COMPLETED: { label: 'Завершена', class: 'status-completed' },
      CANCELLED: { label: 'Отменена', class: 'status-cancelled' }
    }
    const statusInfo = statusMap[status] || { label: status, class: '' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="driver-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Мои поездки</h2>
        <button className="btn btn-primary" onClick={() => navigate('/driver/create')}>
          ➕ Создать новую поездку
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <p>У вас пока нет поездок</p>
          <button className="btn btn-primary" onClick={() => navigate('/driver/create')}>
            Создать первую поездку
          </button>
        </div>
      ) : (
        <div className="cards-grid">
          {trips.map((trip) => (
            <div key={trip.id} className="itmo-card trip-card">
              <div className="trip-header">
                <div className="trip-route">
                  <div className="route-point">
                    <span className="route-label">От</span>
                    <span className="route-name">{trip.fromBuilding?.name || 'Не указано'}</span>
                  </div>
                  <span className="route-arrow">→</span>
                  <div className="route-point">
                    <span className="route-label">До</span>
                    <span className="route-name">{trip.toBuilding?.name || 'Не указано'}</span>
                  </div>
                </div>
                {getStatusBadge(trip.status)}
              </div>

              {/* Карта маршрута */}
              {trip.fromBuilding && trip.toBuilding && (
                <Map 
                  fromBuilding={trip.fromBuilding} 
                  toBuilding={trip.toBuilding}
                  height="200px"
                />
              )}

              <div className="trip-info">
                <div className="info-item">
                  <span>🕐</span>
                  <span>{new Date(trip.departureTime).toLocaleString('ru-RU')}</span>
                </div>
                <div className="info-item">
                  <span>👥</span>
                  <span>{trip.availableSeats} / {trip.maxPassengers} мест</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div className="trip-price">{trip.price} ₽</div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {trip.status === 'SCHEDULED' && (
                    <>
                      <button className="btn btn-success" onClick={() => handleStartTrip(trip.id)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                        Начать
                      </button>
                      <button className="btn btn-danger" onClick={() => handleCancelTrip(trip.id)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                        Отменить
                      </button>
                    </>
                  )}
                  {trip.status === 'IN_PROGRESS' && (
                    <button className="btn btn-success" onClick={() => handleCompleteTrip(trip.id)} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      Завершить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DriverDashboard
