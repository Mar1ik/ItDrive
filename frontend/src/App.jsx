import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import DriverDashboard from './pages/driver/Dashboard'
import CreateTrip from './pages/driver/CreateTrip'
import MyCar from './pages/driver/MyCar'
import PassengerDashboard from './pages/passenger/Dashboard'
import MyBookings from './pages/passenger/MyBookings'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminRoutes from './pages/admin/Routes'
import AdminReviews from './pages/admin/Reviews'
import Layout from './components/Layout'
import './App.css'

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth()
  
  // Показываем загрузку пока проверяем аутентификацию
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    // Редирект на страницу соответствующую роли пользователя
    const defaultRoute = user?.role?.toLowerCase() || 'passenger'
    return <Navigate to={`/${defaultRoute}`} replace />
  }
  
  return children
}

function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth()
  
  // Показываем загрузку на уровне маршрутизации
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Загрузка...</div>
  }
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          !isAuthenticated ? (
            <Login />
          ) : (
            <Navigate to={`/${user?.role?.toLowerCase() || 'passenger'}`} replace />
          )
        } 
      />
      <Route 
        path="/register" 
        element={
          !isAuthenticated ? (
            <Register />
          ) : (
            <Navigate to={`/${user?.role?.toLowerCase() || 'passenger'}`} replace />
          )
        } 
      />
      
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role?.toLowerCase() || 'passenger'}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route path="/driver" element={
        <PrivateRoute requiredRole="DRIVER">
          <Layout>
            <DriverDashboard />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/driver/create" element={
        <PrivateRoute requiredRole="DRIVER">
          <Layout>
            <CreateTrip />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/driver/my-car" element={
        <PrivateRoute requiredRole="DRIVER">
          <Layout>
            <MyCar />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/passenger" element={
        <PrivateRoute requiredRole="PASSENGER">
          <Layout>
            <PassengerDashboard />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/passenger/my-bookings" element={
        <PrivateRoute requiredRole="PASSENGER">
          <Layout>
            <MyBookings />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/admin" element={
        <PrivateRoute requiredRole="ADMIN">
          <Layout>
            <AdminDashboard />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/admin/users" element={
        <PrivateRoute requiredRole="ADMIN">
          <Layout>
            <AdminUsers />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/admin/routes" element={
        <PrivateRoute requiredRole="ADMIN">
          <Layout>
            <AdminRoutes />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="/admin/reviews" element={
        <PrivateRoute requiredRole="ADMIN">
          <Layout>
            <AdminReviews />
          </Layout>
        </PrivateRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
