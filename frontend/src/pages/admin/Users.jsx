import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import '../../styles/myitmo.css'
import './Admin.css'

const AdminUsers = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users')
      setUsers(response.data || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      alert('Ошибка при загрузке пользователей')
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUser = async (userId, isBlocked) => {
    const action = isBlocked ? 'разблокировать' : 'заблокировать'
    if (!confirm(`Вы уверены, что хотите ${action} этого пользователя?`)) return

    try {
      if (isBlocked) {
        await api.put(`/admin/users/${userId}/unblock`)
      } else {
        await api.put(`/admin/users/${userId}/block`)
      }
      loadUsers()
      alert(`Пользователь успешно ${isBlocked ? 'разблокирован' : 'заблокирован'}`)
    } catch (error) {
      alert(error.response?.data?.message || 'Ошибка при изменении статуса пользователя')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = !filterRole || user.role === filterRole
    
    return matchesSearch && matchesRole
  })

  const getRoleLabel = (role) => {
    const roleMap = {
      'ADMIN': 'Администратор',
      'DRIVER': 'Водитель',
      'PASSENGER': 'Пассажир'
    }
    return roleMap[role] || role
  }

  const getRoleBadge = (role) => {
    const roleClassMap = {
      'ADMIN': 'status-cancelled',
      'DRIVER': 'status-in-progress',
      'PASSENGER': 'status-completed'
    }
    return <span className={`status-badge ${roleClassMap[role] || ''}`}>{getRoleLabel(role)}</span>
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>
  }

  return (
    <div className="admin-users">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Управление пользователями</h2>
      </div>

      {/* Фильтры */}
      <div className="itmo-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
            <label className="form-label">Поиск</label>
            <input
              type="text"
              className="form-input"
              placeholder="Поиск по email, имени, фамилии..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
            <label className="form-label">Роль</label>
            <select
              className="form-input form-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">Все роли</option>
              <option value="ADMIN">Администратор</option>
              <option value="DRIVER">Водитель</option>
              <option value="PASSENGER">Пассажир</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '12px', color: 'var(--text-gray)', fontSize: '14px' }}>
          Всего пользователей: {filteredUsers.length}
        </div>
      </div>

      {/* Таблица пользователей */}
      <div className="itmo-card">
        {filteredUsers.length === 0 ? (
          <p style={{ color: 'var(--text-gray)', textAlign: 'center', padding: '20px' }}>
            {searchTerm || filterRole ? 'Пользователи не найдены' : 'Нет пользователей'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Фамилия</th>
                  <th>Роль</th>
                  <th>Рейтинг</th>
                  <th>Поездок</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.firstName}</td>
                    <td>{user.lastName}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600 }}>⭐ {user.rating?.toFixed(1) || '5.0'}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{user.totalTrips || 0}</td>
                    <td>
                      {user.isBlocked ? (
                        <span className="status-badge status-cancelled">Заблокирован</span>
                      ) : (
                        <span className="status-badge status-completed">Активен</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={`btn ${user.isBlocked ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => handleBlockUser(user.id, user.isBlocked)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        {user.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
