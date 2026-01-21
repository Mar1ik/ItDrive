import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import '../../styles/myitmo.css'
import './Driver.css'

const MyCar = () => {
  const [carData, setCarData] = useState({
    carModel: '',
    carNumber: '',
    carSeats: 4,
    carColor: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    loadCarData()
  }, [])

  const loadCarData = async () => {
    try {
      const response = await api.get('/driver/car')
      setCarData({
        carModel: response.data.carModel || '',
        carNumber: response.data.carNumber || '',
        carSeats: response.data.carSeats || 4,
        carColor: response.data.carColor || ''
      })
    } catch (error) {
      console.error('Failed to load car data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setCarData({
      ...carData,
      [e.target.name]: e.target.value
    })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      await api.put('/driver/car', carData)
      setSuccess('Информация об автомобиле успешно обновлена!')
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при сохранении информации об автомобиле')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="my-car-page">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Мой автомобиль</h2>
      </div>

      <div className="itmo-card">
        <div className="card-header">
          <h3 className="card-title">Информация об автомобиле</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Марка и модель автомобиля *</label>
            <input
              type="text"
              name="carModel"
              className="form-input"
              value={carData.carModel}
              onChange={handleChange}
              required
              placeholder="Например: Toyota Camry"
            />
            <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Укажите марку и модель вашего автомобиля
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Государственный номер *</label>
            <input
              type="text"
              name="carNumber"
              className="form-input"
              value={carData.carNumber}
              onChange={handleChange}
              required
              placeholder="Например: А123БВ777"
            />
            <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
              Укажите государственный регистрационный номер
            </small>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Количество мест *</label>
              <input
                type="number"
                name="carSeats"
                className="form-input"
                value={carData.carSeats}
                onChange={handleChange}
                min="2"
                max="20"
                required
                placeholder="Например: 4"
              />
              <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                Количество пассажирских мест в автомобиле
              </small>
            </div>

            <div className="form-group" style={{ flex: 1, marginLeft: '16px' }}>
              <label className="form-label">Цвет автомобиля</label>
              <input
                type="text"
                name="carColor"
                className="form-input"
                value={carData.carColor}
                onChange={handleChange}
                placeholder="Например: Белый"
              />
              <small style={{color: '#999', fontSize: '12px', marginTop: '4px', display: 'block'}}>
                Цвет кузова (необязательно)
              </small>
            </div>
          </div>

          {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}
          {success && <div className="success" style={{ marginBottom: '16px', color: '#28a745' }}>{success}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/driver')}>
              Назад
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MyCar
