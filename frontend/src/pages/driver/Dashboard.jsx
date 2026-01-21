import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Map from '../../components/Map'
import '../../styles/myitmo.css'
import './Driver.css'

const DriverDashboard = () => {
  const [trips, setTrips] = useState([])
  const [bookings, setBookings] = useState({}) // { tripId: [bookings] }
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewExistsMap, setReviewExistsMap] = useState({}) // { bookingId: exists }
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadTrips()
  }, [])

  useEffect(() => {
    // Загружаем бронирования для всех поездок
    if (trips.length > 0) {
      loadBookingsForTrips()
    }
  }, [trips])

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

  const loadBookingsForTrips = async () => {
    const bookingsMap = {}
    const existsMap = {}
    
    for (const trip of trips) {
      try {
        const response = await api.get(`/bookings/trip/${trip.id}`)
        bookingsMap[trip.id] = response.data || []
        
        // Проверяем, какие отзывы уже оставлены
        for (const booking of response.data || []) {
          if (booking.status === 'COMPLETED') {
            try {
              const existsResponse = await api.get(`/reviews/booking/${booking.id}/exists`)
              existsMap[booking.id] = existsResponse.data
            } catch (error) {
              console.error(`Failed to check review for booking ${booking.id}:`, error)
              existsMap[booking.id] = false
            }
          }
        }
      } catch (error) {
        console.error(`Failed to load bookings for trip ${trip.id}:`, error)
        bookingsMap[trip.id] = []
      }
    }
    
    setBookings(bookingsMap)
    setReviewExistsMap(existsMap)
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
      await loadTrips()
      // Перезагружаем бронирования после завершения поездки
      setTimeout(() => {
        loadBookingsForTrips()
      }, 500)
    } catch (error) {
      alert('Ошибка при завершении поездки')
    }
  }

  const handleOpenReviewModal = (booking) => {
    setSelectedBooking(booking)
    setReviewData({ rating: 0, comment: '' })
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedBooking(null)
    setReviewData({ rating: 0, comment: '' })
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      alert('Пожалуйста, выберите оценку от 1 до 5')
      return
    }

    if (!selectedBooking) {
      return
    }

    setReviewSubmitting(true)
    try {
      await api.post('/reviews', {
        bookingId: selectedBooking.id,
        rating: reviewData.rating,
        comment: reviewData.comment || null
      })
      
      // Обновляем информацию о существовании отзыва
      setReviewExistsMap(prev => ({
        ...prev,
        [selectedBooking.id]: true
      }))
      
      handleCloseReviewModal()
      alert('Отзыв успешно отправлен!')
    } catch (error) {
      console.error('Failed to submit review:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Ошибка при отправке отзыва'
      alert(`Ошибка: ${errorMessage}`)
    } finally {
      setReviewSubmitting(false)
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

              {/* Список бронирований */}
              {bookings[trip.id] && bookings[trip.id].length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Пассажиры:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {bookings[trip.id].map((booking) => (
                      <div 
                        key={booking.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '12px',
                          background: '#f8f9fa',
                          borderRadius: '8px'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500 }}>
                            {booking.passenger?.firstName} {booking.passenger?.lastName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            Мест: {booking.seats} • {booking.price} ₽ • {
                              booking.status === 'PENDING' ? 'Ожидает' :
                              booking.status === 'CONFIRMED' ? 'Подтверждено' :
                              booking.status === 'COMPLETED' ? 'Завершено' :
                              booking.status === 'CANCELLED' ? 'Отменено' : booking.status
                            }
                          </div>
                        </div>
                        {trip.status === 'COMPLETED' && booking.status === 'COMPLETED' && (
                          <div>
                            {reviewExistsMap[booking.id] ? (
                              <span style={{ color: '#28a745', fontSize: '14px' }}>✓ Отзыв оставлен</span>
                            ) : (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleOpenReviewModal(booking)}
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Оставить отзыв
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно для отзыва */}
      {showReviewModal && selectedBooking && (
        <div className="modal-overlay" onClick={handleCloseReviewModal}>
          <div className="modal-content itmo-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Оставить отзыв о пассажире</h3>
              <button 
                onClick={handleCloseReviewModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Пассажир: <strong>{selectedBooking.passenger?.firstName} {selectedBooking.passenger?.lastName}</strong>
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                Маршрут: {selectedBooking.trip?.fromBuilding?.name} → {selectedBooking.trip?.toBuilding?.name}
              </p>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">Оценка *</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, rating })}
                      style={{
                        background: reviewData.rating >= rating ? '#ffc107' : '#f0f0f0',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                  <span style={{ marginLeft: '8px', fontWeight: 500 }}>{reviewData.rating} / 5</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Комментарий</label>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Оставьте комментарий о пассажире (необязательно)"
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" disabled={reviewSubmitting || reviewData.rating === 0}>
                  {reviewSubmitting ? 'Отправка...' : 'Отправить отзыв'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseReviewModal}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DriverDashboard
