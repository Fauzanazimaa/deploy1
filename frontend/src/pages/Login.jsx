import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api'
import { useAuth } from '../context/AuthContext'
import SejatiLogo from '../components/SejatiLogo'

const ACCENT = '#f5a623'
const SIDEBAR_BG = '#1a1f2e'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser, user } = useAuth()
  const navigate = useNavigate()

  // Jika sudah login, redirect ke dashboard yang sesuai
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'contributor') navigate('/contributor', { replace: true })
      else if (user.role === 'viewer') navigate('/viewer', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ username, password })
      const { access_token, user: userData } = res.data
      loginUser(access_token, userData)
      if (userData.role === 'admin') navigate('/admin', { replace: true })
      else if (userData.role === 'contributor') navigate('/contributor', { replace: true })
      else if (userData.role === 'viewer') navigate('/viewer', { replace: true })
      else navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Username atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav style={{ background: SIDEBAR_BG, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', borderBottom: '1px solid #2d3748' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <SejatiLogo size={32} variant="compact" />
        </Link>
        <Link to="/" style={{ color: '#94a3b8', fontSize: 12, marginLeft: 16, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="bi bi-arrow-left"></i> Dashboard Publik
        </Link>
      </nav>

      {/* Center card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <SejatiLogo size={68} variant="icon" />
            </div>
            <h2 style={{ color: SIDEBAR_BG, fontWeight: 700, fontSize: 20, margin: '0 0 4px', letterSpacing: -0.3 }}>Masuk ke SEJATI</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Sistem Jejaring Pengumpulan Data Statistik Terintegrasi</p>
          </div>

          {/* Card */}
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '24px 24px 20px', border: '1px solid #e2e8f0' }}>
            {error && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Username */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>USERNAME</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                  <span style={{ padding: '0 11px', color: '#64748b', background: '#f8fafc', borderRight: '1px solid #cbd5e1', height: 38, display: 'flex', alignItems: 'center' }}>
                    <i className="bi bi-person" style={{ fontSize: 15 }}></i>
                  </span>
                  <input
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    required
                    style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, background: 'transparent', fontFamily: "'Inter', sans-serif" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>PASSWORD</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                  <span style={{ padding: '0 11px', color: '#64748b', background: '#f8fafc', borderRight: '1px solid #cbd5e1', height: 38, display: 'flex', alignItems: 'center' }}>
                    <i className="bi bi-lock" style={{ fontSize: 15 }}></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, background: 'transparent', fontFamily: "'Inter', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{ border: 'none', background: '#f8fafc', borderLeft: '1px solid #cbd5e1', padding: '0 11px', height: 38, cursor: 'pointer', color: '#64748b' }}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '10px', border: '1px solid #d97706', borderRadius: 6, background: ACCENT, color: '#fff', fontWeight: 600, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Inter', sans-serif", letterSpacing: 0.2, transition: 'background-color 0.15s ease' }}
              >
                {loading ? (
                  <>
                    <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
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

          {/* Info */}
          <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 18 }}>
            Sistem akan otomatis mengarahkan ke panel sesuai role akun Anda.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
