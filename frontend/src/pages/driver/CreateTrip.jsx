import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import Map from '../../components/Map'
import '../../styles/myitmo.css'
import './Driver.css'

const CreateTrip = () => {
  const [buildings, setBuildings] = useState([])
  const [selectedFromBuilding, setSelectedFromBuilding] = useState(null)
  const [selectedToBuilding, setSelectedToBuilding] = useState(null)
  const [formData, setFormData] = useState({
    fromBuildingId: '',
    toBuildingId: '',
    maxPassengers: 1,
    price: '',
    description: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    // Обновляем выбранные корпуса для карты
    const fromBuilding = buildings.find(b => b.id === parseInt(formData.fromBuildingId))
    const toBuilding = buildings.find(b => b.id === parseInt(formData.toBuildingId))
    setSelectedFromBuilding(fromBuilding)
    setSelectedToBuilding(toBuilding)
  }, [formData.fromBuildingId, formData.toBuildingId, buildings])

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const tripData = {
        fromBuildingId: parseInt(formData.fromBuildingId),
        toBuildingId: parseInt(formData.toBuildingId),
        maxPassengers: parseInt(formData.maxPassengers),
        price: parseFloat(formData.price),
        description: formData.description || null
      }

      await api.post('/trips', tripData)
      navigate('/driver')
    } catch (error) {
      setError(error.response?.data?.message || 'Ошибка при создании поездки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-trip-page">
      <div className="itmo-card">
        <div className="card-header">
          <h2 className="card-title">Создать новую поездку</h2>
        </div>

        {/* Карта с маршрутом */}
        {(selectedFromBuilding && selectedToBuilding) && (
          <Map 
            fromBuilding={selectedFromBuilding} 
            toBuilding={selectedToBuilding}
            height="300px"
          />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Корпус отправления *</label>
            <select
              name="fromBuildingId"
              className="form-input form-select"
              value={formData.fromBuildingId}
              onChange={handleChange}
              required
            >
              <option value="">Выберите корпус</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Корпус назначения *</label>
            <select
              name="toBuildingId"
              className="form-input form-select"
              value={formData.toBuildingId}
              onChange={handleChange}
              required
            >
              <option value="">Выберите корпус</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Количество мест *</label>
              <input
                type="number"
                name="maxPassengers"
                className="form-input"
                value={formData.maxPassengers}
                onChange={handleChange}
                min="1"
                max="10"
                required
                placeholder="Например: 3"
              />
            </div>

            <div className="form-group" style={{ flex: 1, marginLeft: '16px' }}>
              <label className="form-label">Цена за поездку (₽) *</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
                placeholder="Например: 100"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Добавьте дополнительную информацию о поездке (необязательно)"
            />
          </div>

          {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Создание...' : 'Создать поездку'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/driver')}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTrip
