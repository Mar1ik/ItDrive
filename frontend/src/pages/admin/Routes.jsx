import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import '../../styles/myitmo.css'
import './Admin.css'

const AdminRoutes = () => {
  const [popularRoutes, setPopularRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    loadPopularRoutes()
  }, [limit])

  const loadPopularRoutes = async () => {
    try {
      const response = await api.get(`/admin/routes/popular?limit=${limit}`)
      setPopularRoutes(response.data || [])
    } catch (error) {
      console.error('Failed to load popular routes:', error)
      alert('Ошибка при загрузке маршрутов')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="admin-routes">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Статистика маршрутов</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label className="form-label" style={{ margin: 0 }}>Показать:</label>
          <select
            className="form-input form-select"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            style={{ width: '100px' }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="itmo-card">
        {popularRoutes.length === 0 ? (
          <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '20px' }}>
            Нет данных о маршрутах
          </p>
        ) : (
          <>
            <div style={{ marginBottom: '16px', color: 'var(--text-gray)', fontSize: '14px' }}>
              Показано {popularRoutes.length} {popularRoutes.length === 1 ? 'маршрут' : 'маршрутов'} (сортировка по популярности)
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="routes-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Откуда</th>
                    <th>Куда</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>Количество поездок</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Популярность</th>
                  </tr>
                </thead>
                <tbody>
                  {popularRoutes.map((route, index) => {
                    const maxTrips = popularRoutes[0]?.tripCount || 1
                    const popularityPercent = Math.round((route.tripCount / maxTrips) * 100)
                    
                    return (
                      <tr key={index}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-gray)' }}>
                          {index + 1}
                        </td>
                        <td>
                          <strong>{route.fromBuildingName}</strong>
                        </td>
                        <td>
                          <strong>{route.toBuildingName}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: '16px' }}>{route.tripCount}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              flex: 1, 
                              height: '8px', 
                              background: '#e0e0e0', 
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${popularityPercent}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, var(--primary-blue), var(--primary-red))',
                                transition: 'width 0.3s'
                              }} />
                            </div>
                            <span style={{ 
                              fontSize: '12px', 
                              color: 'var(--text-gray)', 
                              minWidth: '35px',
                              textAlign: 'right'
                            }}>
                              {popularityPercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AdminRoutes
