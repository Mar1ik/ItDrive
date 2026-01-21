import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Map from '../../components/Map'
import '../../styles/myitmo.css'
import './Passenger.css'

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      const response = await api.get(`/bookings/passenger/${user.id}`)
      const bookingsWithReviews = await Promise.all(
        response.data.map(async (booking) => {
          if (booking.status === 'COMPLETED') {
            try {
              // Проверяем, есть ли уже отзыв от этого пользователя для этого бронирования
              const hasReviewResponse = await api.get(`/reviews/booking/${booking.id}/exists`)
              return { ...booking, hasReview: hasReviewResponse.data }
            } catch (error) {
              return { ...booking, hasReview: false }
            }
          }
          return booking
        })
      )
      setBookings(bookingsWithReviews)
    } catch (error) {
      console.error('Failed to load bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Вы уверены, что хотите отменить бронирование?')) return
    
    try {
      await api.delete(`/bookings/${bookingId}`)
      loadBookings()
    } catch (error) {
      alert('Ошибка при отмене бронирования')
    }
  }

  const handleOpenReviewModal = (booking) => {
    setSelectedBooking(booking)
    setReviewData({ rating: 5, comment: '' })
    setShowReviewModal(true)
  }

  const handleCloseReviewModal = () => {
    setShowReviewModal(false)
    setSelectedBooking(null)
    setReviewData({ rating: 5, comment: '' })
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewSubmitting(true)

    try {
      await api.post('/reviews', {
        bookingId: selectedBooking.id,
        rating: reviewData.rating,
        comment: reviewData.comment || null
      })
      alert('Отзыв успешно отправлен!')
      handleCloseReviewModal()
      loadBookings()
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка при отправке отзыва')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const getStatusBadge = (booking) => {
    // Если поездка идет (IN_PROGRESS), показываем "Поездка идет"
    if (booking.trip?.status === 'IN_PROGRESS') {
      return <span className="status-badge status-in-progress">Поездка идет</span>
    }
    
    // Иначе показываем статус бронирования
    const statusMap = {
      PENDING: { label: 'Ожидает подтверждения', class: 'status-scheduled' },
      CONFIRMED: { label: 'Подтверждено', class: 'status-in-progress' },
      CANCELLED: { label: 'Отменено', class: 'status-cancelled' },
      COMPLETED: { label: 'Завершено', class: 'status-completed' }
    }
    const statusInfo = statusMap[booking.status] || { label: booking.status, class: '' }
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="my-bookings">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Мои бронирования</h2>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <p>У вас пока нет бронирований</p>
        </div>
      ) : (
        <div className="cards-grid">
          {bookings.map((booking) => (
            <div key={booking.id} className="itmo-card trip-card">
              <div className="trip-header">
                <div className="trip-route">
                  <div className="route-point">
                    <span className="route-label">От</span>
                    <span className="route-name">{booking.trip?.fromBuilding?.name || 'Не указано'}</span>
                  </div>
                  <span className="route-arrow">→</span>
                  <div className="route-point">
                    <span className="route-label">До</span>
                    <span className="route-name">{booking.trip?.toBuilding?.name || 'Не указано'}</span>
                  </div>
                </div>
                {getStatusBadge(booking)}
              </div>

              {/* Карта маршрута */}
              {booking.trip?.fromBuilding && booking.trip?.toBuilding && (
                <Map 
                  fromBuilding={booking.trip.fromBuilding} 
                  toBuilding={booking.trip.toBuilding}
                  height="200px"
                />
              )}

              <div className="trip-info">
                <div className="info-item">
                  <span>🕐</span>
                  <span>{booking.trip?.departureTime ? new Date(booking.trip.departureTime).toLocaleString('ru-RU') : 'Не указано'}</span>
                </div>
                <div className="info-item">
                  <span>👥</span>
                  <span>{booking.seats} мест</span>
                </div>
                <div className="info-item">
                  <span>💳</span>
                  <span>{booking.paymentMethod === 'CARD' ? 'Карта' : 'Наличные'}</span>
                </div>
                {booking.trip?.driver && (
                  <div className="info-item">
                    <span>👤</span>
                    <span>{booking.trip.driver.firstName} {booking.trip.driver.lastName} ⭐ {booking.trip.driver.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                <div className="trip-price">{booking.price} ₽</div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && 
                   booking.trip?.status !== 'COMPLETED' && 
                   booking.trip?.status !== 'CANCELLED' && 
                   booking.trip?.status !== 'IN_PROGRESS' && (
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleCancelBooking(booking.id)}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      Отменить
                    </button>
                  )}
                  {booking.status === 'COMPLETED' && !booking.hasReview && (
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleOpenReviewModal(booking)}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      ⭐ Оставить отзыв
                    </button>
                  )}
                  {booking.status === 'COMPLETED' && booking.hasReview && (
                    <span style={{ fontSize: '13px', color: '#28a745', fontWeight: 500 }}>
                      ✓ Отзыв оставлен
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно для отзыва */}
      {showReviewModal && selectedBooking && (
        <div className="modal-overlay" onClick={handleCloseReviewModal}>
          <div className="modal-content itmo-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-header">
              <h3 className="card-title">Оставить отзыв о водителе</h3>
              <button 
                onClick={handleCloseReviewModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Водитель: <strong>{selectedBooking.trip?.driver?.firstName} {selectedBooking.trip?.driver?.lastName}</strong>
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
                  placeholder="Оставьте комментарий о поездке (необязательно)"
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" disabled={reviewSubmitting}>
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

export default MyBookings
