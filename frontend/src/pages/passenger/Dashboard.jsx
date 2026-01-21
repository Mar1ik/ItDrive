import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Map from '../../components/Map'
import '../../styles/myitmo.css'
import './Passenger.css'

const PassengerDashboard = () => {
  const [trips, setTrips] = useState([])
  const [buildings, setBuildings] = useState([])
  const [filters, setFilters] = useState({
    fromBuildingId: '',
    toBuildingId: ''
  })
  const [loading, setLoading] = useState(true)
  const [bookingModal, setBookingModal] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadBuildings()
    loadTrips()
  }, [])

  useEffect(() => {
    loadTrips()
  }, [filters])

  const loadBuildings = async () => {
    try {
      const response = await api.get('/buildings')
      setBuildings(response.data || [])
    } catch (error) {
      // Заглушка для корпусов
      setBuildings([
        { id: 1, name: 'Кронверкский пр., д. 49', address: 'Кронверкский пр., д. 49', latitude: 59.9571, longitude: 30.3194 },
        { id: 2, name: 'Биржевая линия, д. 14-16', address: 'Биржевая линия, д. 14-16', latitude: 59.9452, longitude: 30.2869 },
        { id: 3, name: 'Ломоносова ул., д. 9', address: 'Ломоносова ул., д. 9', latitude: 59.9343, longitude: 30.3351 }
      ])
    }
  }

  const loadTrips = async () => {
    try {
      const params = {}
      if (filters.fromBuildingId) params.fromBuildingId = filters.fromBuildingId
      if (filters.toBuildingId) params.toBuildingId = filters.toBuildingId
      
      const response = await api.get('/trips', { params })
      setTrips(response.data || [])
    } catch (error) {
      console.error('Failed to load trips:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBooking = (tripId) => {
    const trip = trips.find(t => t.id === tripId)
    setBookingModal(trip)
    setPaymentMethod('CASH')
  }

  const closeBookingModal = () => {
    setBookingModal(null)
    setPaymentMethod('CASH')
  }

  const confirmBooking = async () => {
    if (!bookingModal) return

    try {
      await api.post('/bookings', {
        tripId: bookingModal.id,
        paymentMethod: paymentMethod,
        seats: 1
      })
      alert('Место успешно забронировано!')
      closeBookingModal()
      navigate('/passenger/my-bookings')
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка при бронировании')
    }
  }

  const getStatusBadge = (status) => {
    if (status === 'SCHEDULED') {
      return <span className="status-badge status-scheduled">Запланирована</span>
    }
    return null
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="passenger-dashboard">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600, marginBottom: '20px' }}>Найти поездку</h2>
        
        <div className="itmo-card">
          <div className="card-header">
            <h3 className="card-title">Фильтры поиска</h3>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Откуда</label>
              <select
                className="form-input form-select"
                value={filters.fromBuildingId}
                onChange={(e) => setFilters({ ...filters, fromBuildingId: e.target.value })}
              >
                <option value="">Все корпуса</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, marginLeft: '16px' }}>
              <label className="form-label">Куда</label>
              <select
                className="form-input form-select"
                value={filters.toBuildingId}
                onChange={(e) => setFilters({ ...filters, toBuildingId: e.target.value })}
              >
                <option value="">Все корпуса</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="empty-state">
          <p>Нет доступных поездок по выбранным критериям</p>
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
                {trip.driver && (
                  <div className="info-item">
                    <span>👤</span>
                    <span>{trip.driver.firstName} {trip.driver.lastName} ⭐ {trip.driver.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div className="trip-price">{trip.price} ₽</div>
                
                {trip.status === 'SCHEDULED' && trip.availableSeats > 0 && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleBooking(trip.id)}
                  >
                    Забронировать
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно для выбора метода оплаты */}
      {bookingModal && (
        <div 
          className="modal-overlay" 
          onClick={closeBookingModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content itmo-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 className="card-title">Выберите метод оплаты</h3>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Метод оплаты *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  border: paymentMethod === 'CASH' ? '2px solid var(--primary-blue)' : '2px solid var(--border-gray)',
                  background: paymentMethod === 'CASH' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>💰 Наличные</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Оплата наличными водителю</div>
                  </div>
                </label>
                
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '8px',
                  border: paymentMethod === 'CARD' ? '2px solid var(--primary-blue)' : '2px solid var(--border-gray)',
                  background: paymentMethod === 'CARD' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="CARD"
                    checked={paymentMethod === 'CARD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>💳 Карта</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-gray)' }}>Перевод на карту водителя</div>
                    {paymentMethod === 'CARD' && bookingModal.driver?.phoneNumber && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: 'var(--hover-gray)', 
                        borderRadius: '8px',
                        border: '1px solid var(--border-gray)'
                      }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginBottom: '6px' }}>
                          Номер телефона водителя для перевода:
                        </div>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: 600, 
                          color: 'var(--primary-blue)',
                          wordBreak: 'break-all'
                        }}>
                          {bookingModal.driver.phoneNumber}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-gray)', marginTop: '8px' }}>
                          Переведите деньги на этот номер перед поездкой
                        </div>
                      </div>
                    )}
                    {paymentMethod === 'CARD' && !bookingModal.driver?.phoneNumber && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        background: '#fff3cd', 
                        borderRadius: '8px',
                        border: '1px solid #ffc107',
                        color: '#856404',
                        fontSize: '14px'
                      }}>
                        ⚠️ У водителя не указан номер телефона. Свяжитесь с водителем другим способом.
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                className="btn"
                onClick={closeBookingModal}
                style={{ flex: 1, background: 'var(--hover-gray)', color: 'var(--text-dark)' }}
              >
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmBooking}
                style={{ flex: 1 }}
              >
                Забронировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PassengerDashboard
