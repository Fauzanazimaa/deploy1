import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  // Tampilkan loading saat AuthContext sedang inisialisasi (validasi token ke backend)
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #f5a62330',
          borderTopColor: '#f5a623',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Belum login — kembali ke landing page publik
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Salah role — redirect ke dashboard yang benar
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'contributor') return <Navigate to="/contributor" replace />
    if (user.role === 'viewer') return <Navigate to="/viewer" replace />
    return <Navigate to="/" replace />
  }

  return children
}
