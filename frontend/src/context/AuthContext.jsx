import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Inisialisasi dari localStorage + validasi token ke backend
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken')
    if (token) {
      localStorage.setItem('token', token)
      // Coba ambil data user dari localStorage dulu untuk UI cepat
      try {
        const stored = localStorage.getItem('user')
        if (stored) setUser(JSON.parse(stored))
      } catch { /* ignore */ }

      // Validasi token ke backend
      getMe()
        .then((res) => {
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          localStorage.removeItem('userRole')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginUser = useCallback((token, userData) => {
    // Simpan ke localStorage
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    // Update state — React akan commit ini sebelum caller melakukan navigate
    // karena setUser adalah synchronous state update dalam event handler
    setUser(userData)
  }, [])

  const logoutUser = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
