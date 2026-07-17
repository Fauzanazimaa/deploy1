import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'

const ACCENT = '#f5a623'
const SIDEBAR_BG = '#1a1f2e'

function LoginDropdown({ role, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ username, password })
      const { access_token, user } = res.data
      loginUser(access_token, user)
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'contributor') navigate('/contributor', { replace: true })
      else if (user.role === 'viewer') navigate('/viewer', { replace: true })
      else navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Username atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  const isAdmin = role === 'admin'
  const label = isAdmin ? 'Login Admin' : 'Login Kontributor'
  const icon = isAdmin ? 'bi-shield-lock-fill' : 'bi-person-badge-fill'

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '110%',
        right: 0,
        width: 320,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
        zIndex: 1000,
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: ACCENT,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <i className={`bi ${icon} text-white`} style={{ fontSize: 18 }}></i>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{label}</span>
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            width: 26,
            height: 26,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className="bi bi-x" style={{ fontSize: 16 }}></i>
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: '20px 18px 22px' }}>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="bi bi-exclamation-triangle-fill"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>
              USERNAME
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 40, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-person" style={{ fontSize: 15 }}></i>
              </span>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  fontSize: 13,
                  height: 40,
                  background: 'transparent',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>
              PASSWORD
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 40, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-lock" style={{ fontSize: 15 }}></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  fontSize: 13,
                  height: 40,
                  background: 'transparent',
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  border: 'none',
                  background: '#f9fafb',
                  borderLeft: '1px solid #e5e7eb',
                  padding: '0 10px',
                  height: 40,
                  cursor: 'pointer',
                  color: '#9ca3af',
                }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              border: 'none',
              borderRadius: 8,
              background: ACCENT,
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: 0.3,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                  }}
                />
                Masuk...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right"></i>
                Masuk
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function Login() {
  const [openPanel, setOpenPanel] = useState(null)

  const toggle = (role) => setOpenPanel((prev) => (prev === role ? null : role))

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav
        style={{
          background: SIDEBAR_BG,
          padding: '0 28px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              background: ACCENT,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="bi bi-database-fill-gear" style={{ color: '#fff', fontSize: 17 }}></i>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>
            datacollect
          </span>
        </div>

        {/* Login buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, position: 'relative' }}>
          {/* Admin */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggle('admin')}
              style={{
                background: ACCENT,
                border: 'none',
                color: '#fff',
                padding: '7px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontFamily: "'Inter', sans-serif",
                boxShadow: openPanel === 'admin' ? '0 4px 16px rgba(245,166,35,0.4)' : 'none',
              }}
            >
              <i className="bi bi-shield-lock"></i>
              Login Admin
              <i className={`bi bi-chevron-${openPanel === 'admin' ? 'up' : 'down'}`} style={{ fontSize: 11 }}></i>
            </button>
            {openPanel === 'admin' && (
              <LoginDropdown role="admin" onClose={() => setOpenPanel(null)} />
            )}
          </div>

          {/* Contributor */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggle('contributor')}
              style={{
                background: openPanel === 'contributor' ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: '1.5px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '7px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <i className="bi bi-person"></i>
              Login Kontributor
              <i className={`bi bi-chevron-${openPanel === 'contributor' ? 'up' : 'down'}`} style={{ fontSize: 11 }}></i>
            </button>
            {openPanel === 'contributor' && (
              <LoginDropdown role="contributor" onClose={() => setOpenPanel(null)} />
            )}
          </div>
        </div>
      </nav>

      {/* Hero / Landing */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
          {/* Icon */}
          <div
            style={{
              width: 88,
              height: 88,
              background: SIDEBAR_BG,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 32px rgba(26,31,46,0.2)',
            }}
          >
            <i className="bi bi-database-fill-gear" style={{ color: ACCENT, fontSize: 40 }}></i>
          </div>

          <h2 style={{ color: SIDEBAR_BG, fontWeight: 700, fontSize: 26, marginBottom: 10, letterSpacing: -0.5 }}>
            DataCollect
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32, lineHeight: 1.6 }}>
            Sistem Pengumpulan Data — Silakan login melalui tombol di kanan atas untuk mengakses panel Anda.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => toggle('admin')}
              style={{
                background: ACCENT,
                border: 'none',
                color: '#fff',
                padding: '11px 28px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 4px 16px rgba(245,166,35,0.35)',
              }}
            >
              <i className="bi bi-shield-lock"></i>
              Login Admin
            </button>
            <button
              onClick={() => toggle('contributor')}
              style={{
                background: SIDEBAR_BG,
                border: 'none',
                color: '#fff',
                padding: '11px 28px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 4px 16px rgba(26,31,46,0.2)',
              }}
            >
              <i className="bi bi-person-badge"></i>
              Login Kontributor
            </button>
          </div>

          {/* Feature badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 40, flexWrap: 'wrap' }}>
            {[
              { icon: 'bi-shield-check', label: 'Aman & Terenkripsi' },
              { icon: 'bi-cloud-upload', label: 'Upload Data' },
              { icon: 'bi-bar-chart-line', label: 'Visualisasi Data' },
            ].map((f) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af' }}>
                <i className={`bi ${f.icon}`} style={{ color: ACCENT }}></i>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
