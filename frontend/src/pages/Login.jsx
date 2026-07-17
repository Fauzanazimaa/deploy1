import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'

function LoginDropdown({ role, onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const ref = useRef(null)

  // Tutup jika klik di luar dropdown
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
  const accentColor = isAdmin ? '#f97316' : '#3b82f6'
  const label = isAdmin ? 'Login Admin' : 'Login Kontributor'
  const icon = isAdmin ? 'bi-shield-lock-fill' : 'bi-person-badge-fill'

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '110%',
        right: 0,
        width: 300,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: isAdmin
            ? 'linear-gradient(135deg, #f5a623, #f97316)'
            : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <i className={`bi ${icon} text-white`} style={{ fontSize: 20 }}></i>
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
      <div style={{ padding: '16px 18px 18px' }}>
        {error && (
          <div
            style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 12,
              marginBottom: 12,
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
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
              USERNAME
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}>
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
                  padding: '8px 10px',
                  fontSize: 13,
                  background: 'transparent',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
              PASSWORD
            </label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}>
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
                  padding: '8px 10px',
                  fontSize: 13,
                  background: 'transparent',
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
                  height: 38,
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
              padding: '9px',
              border: 'none',
              borderRadius: 8,
              background: isAdmin
                ? 'linear-gradient(135deg, #f5a623, #f97316)'
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
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
  const [openPanel, setOpenPanel] = useState(null) // 'admin' | 'contributor' | null

  const toggle = (role) => setOpenPanel((prev) => (prev === role ? null : role))

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Navbar */}
      <nav
        style={{
          background: '#1a1f36',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, #f5a623, #f97316)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="bi bi-database-fill-gear" style={{ color: '#fff', fontSize: 18 }}></i>
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: 0.3 }}>DataCollect</span>
        </div>

        {/* Login buttons — kanan atas */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, position: 'relative' }}>
          {/* Admin */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => toggle('admin')}
              style={{
                background: openPanel === 'admin'
                  ? 'linear-gradient(135deg, #f5a623, #f97316)'
                  : 'linear-gradient(135deg, #f5a623, #f97316)',
                border: 'none',
                color: '#fff',
                padding: '6px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: openPanel === 'admin' ? '0 4px 12px rgba(245,166,35,0.5)' : 'none',
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
                background: 'transparent',
                border: '1.5px solid rgba(255,255,255,0.25)',
                color: '#fff',
                padding: '6px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: openPanel === 'contributor' ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
                ...(openPanel === 'contributor' && {
                  background: 'rgba(59,130,246,0.15)',
                  borderColor: '#3b82f6',
                }),
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

      {/* Body — konten publik / landing */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div
            style={{
              width: 80, height: 80,
              background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
              borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 32px rgba(30,64,175,0.25)',
            }}
          >
            <i className="bi bi-database-fill-gear" style={{ color: '#fff', fontSize: 36 }}></i>
          </div>
          <h3 style={{ color: '#1a1f36', fontWeight: 700, marginBottom: 8 }}>DataCollect</h3>
          <p style={{ fontSize: 14, maxWidth: 360, margin: '0 auto 24px' }}>
            Sistem Pengumpulan Data. Silakan login melalui tombol di kanan atas.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => toggle('admin')}
              style={{
                background: 'linear-gradient(135deg, #f5a623, #f97316)',
                border: 'none', color: '#fff',
                padding: '10px 24px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <i className="bi bi-shield-lock"></i> Login Admin
            </button>
            <button
              onClick={() => toggle('contributor')}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                border: 'none', color: '#fff',
                padding: '10px 24px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <i className="bi bi-person-badge"></i> Login Kontributor
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
