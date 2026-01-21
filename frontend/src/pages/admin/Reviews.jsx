import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import '../../styles/myitmo.css'
import './Admin.css'

const AdminReviews = () => {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState('')

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = async () => {
    try {
      const response = await api.get('/admin/reviews')
      setReviews(response.data || [])
    } catch (error) {
      console.error('Failed to load reviews:', error)
      alert('Ошибка при загрузке отзывов')
    } finally {
      setLoading(false)
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (!filterRating) return true
    return review.rating === parseInt(filterRating)
  })

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="admin-reviews">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Отзывы пользователей</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="form-label" style={{ margin: 0 }}>Фильтр по оценке:</label>
          <select
            className="form-input form-select"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="">Все оценки</option>
            <option value="5">5 звезд</option>
            <option value="4">4 звезды</option>
            <option value="3">3 звезды</option>
            <option value="2">2 звезды</option>
            <option value="1">1 звезда</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '16px', color: 'var(--text-gray)', fontSize: '14px' }}>
        Всего отзывов: {filteredReviews.length}
      </div>

      <div className="itmo-card">
        {filteredReviews.length === 0 ? (
          <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '20px' }}>
            {filterRating ? 'Отзывы с выбранной оценкой не найдены' : 'Нет отзывов'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredReviews.map((review) => (
              <div 
                key={review.id} 
                style={{
                  padding: '16px',
                  borderBottom: '1px solid var(--border-gray)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>
                        {review.reviewer?.firstName} {review.reviewer?.lastName}
                      </div>
                      <span style={{ color: 'var(--text-gray)', fontSize: '14px' }}>о</span>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>
                        {review.reviewed?.firstName} {review.reviewed?.lastName}
                      </div>
                      {review.reviewed?.role === 'DRIVER' && (
                        <span className="status-badge status-in-progress" style={{ fontSize: '12px' }}>Водитель</span>
                      )}
                    </div>
                    <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                      {getRatingStars(review.rating)} ({review.rating}/5)
                    </div>
                    {review.comment && (
                      <div style={{ 
                        padding: '12px', 
                        background: 'var(--hover-gray)', 
                        borderRadius: '8px',
                        marginTop: '8px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        color: 'var(--text-dark)'
                      }}>
                        "{review.comment}"
                      </div>
                    )}
                    {review.booking?.trip && (
                      <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-gray)' }}>
                        <span>📍 Маршрут: {review.booking.trip.fromBuilding?.name || 'Не указано'} → {review.booking.trip.toBuilding?.name || 'Не указано'}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-gray)', textAlign: 'right' }}>
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Дата не указана'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminReviews
