import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to correct dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'contributor') return <Navigate to="/contributor" replace />
    if (user.role === 'viewer') return <Navigate to="/viewer" replace />
  }

  return children
}
