import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import SejatiLogo from '../../components/SejatiLogo'

const navGroups = [
  {
    label: 'ADMIN MENU',
    items: [
      { to: '/admin',       icon: 'bi-speedometer2',              label: 'Dashboard',           end: true },
      { to: '/admin/users', icon: 'bi-people-fill',               label: 'Kelola Pengguna' },
    ],
  },
  {
    label: 'MASTER TABEL',
    items: [
      { to: '/admin/data-schema',  icon: 'bi-grid-3x3-gap-fill',          label: 'Jenis Data & Template' },
      { to: '/admin/tasks',        icon: 'bi-clipboard2-check-fill',      label: 'Tugas' },
      { to: '/admin/submissions',  icon: 'bi-inbox-fill',                 label: 'Verifikasi Data' },
    ],
  },
  {
    label: 'PUBLIKASI',
    items: [
      { to: '/admin/public-dashboard', icon: 'bi-layout-text-window-reverse', label: 'Dashboard Publik' },
    ],
  },
]

const SIDEBAR_BG = '#1a1f2e'
const ACCENT     = '#f5a623'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return isMobile
}

export default function AdminLayout() {
  const [sidebarOpen,   setSidebarOpen]   = useState(true)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const { user, logoutUser } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const isMobile  = useIsMobile()

  // Tutup drawer saat navigasi
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])
  // Desktop: buka sidebar by default; mobile: tutup
  useEffect(() => { if (!isMobile) setSidebarOpen(true) }, [isMobile])

  const handleLogout = () => { logoutUser(); navigate('/login', { replace: true }) }

  const pathLabel = {
    '/admin':               'Dashboard',
    '/admin/users':         'Kelola Pengguna',
    '/admin/data-schema':   'Jenis Data & Template',
    '/admin/tasks':         'Tugas',
    '/admin/submissions':   'Verifikasi Data',
    '/admin/public-dashboard': 'Dashboard Publik',
  }
  const currentLabel = pathLabel[location.pathname] || 'Dashboard'

  // Shared sidebar nav content
  const SidebarContent = ({ compact = false }) => (
    <>
      <div style={{ height: 60, display: 'flex', alignItems: 'center', gap: 10, padding: compact ? '0 16px' : '0 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <SejatiLogo size={32} variant={compact ? 'icon' : 'compact'} />
        {!compact && <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Admin</span>}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {navGroups.map(group => (
          <div key={group.label}>
            {!compact && (
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, padding: '12px 18px 4px' }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                title={compact ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: compact ? '10px 0' : '9px 18px',
                  justifyContent: compact ? 'center' : 'flex-start',
                  margin: '1px 8px', borderRadius: 8, textDecoration: 'none',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: isActive ? ACCENT : 'transparent',
                  fontWeight: isActive ? 600 : 400, fontSize: 13,
                  transition: 'background .15s, color .15s',
                })}
                className="sidebar-nav-link">
                <i className={`bi ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }}></i>
                {!compact && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: compact ? '12px 8px' : '14px 18px' }}>
        {!compact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: '#fff', fontSize: 14 }}>
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Admin</div>
            </div>
          </div>
        )}
        <NavLink to="/" title={compact ? 'Dashboard Publik' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compact ? '7px 0' : '7px 8px', justifyContent: compact ? 'center' : 'flex-start', borderRadius: 8, textDecoration: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}>
          <i className="bi bi-globe" style={{ fontSize: 14, flexShrink: 0 }}></i>
          {!compact && <span style={{ whiteSpace: 'nowrap' }}>Dashboard Publik</span>}
        </NavLink>
        <button onClick={handleLogout} title="Logout"
          style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.6)', padding: '8px 0', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Inter', sans-serif" }}
          className="sidebar-logout-btn">
          <i className="bi bi-box-arrow-right" style={{ fontSize: 15 }}></i>
          {!compact && 'Logout'}
        </button>
      </div>
    </>
  )

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "'Inter', sans-serif", background: '#f5f6fa' }}>
        {/* Mobile Topbar */}
        <div style={{ height: 56, background: SIDEBAR_BG, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 50 }}>
          <button onClick={() => setDrawerOpen(v => !v)}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' }}>
            <i className="bi bi-list"></i>
          </button>
          <SejatiLogo size={28} variant="icon" />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, flex: 1 }}>{currentLabel}</span>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13 }}>
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>

        {/* Drawer overlay */}
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <div onClick={() => setDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 299 }} />
            {/* Drawer */}
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, background: SIDEBAR_BG, zIndex: 300, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.25)', overflowY: 'auto' }}>
              <SidebarContent compact={false} />
            </div>
          </>
        )}

        {/* Page content */}
        <div className="admin-content-area" style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 24px' }}>
          <Outlet />
        </div>
      </div>
    )
  }

  // ── Desktop layout ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: sidebarOpen ? 240 : 64, minWidth: sidebarOpen ? 240 : 64, background: SIDEBAR_BG, display: 'flex', flexDirection: 'column', transition: 'width .25s ease, min-width .25s ease', overflow: 'hidden', zIndex: 200, flexShrink: 0 }}>
        <SidebarContent compact={!sidebarOpen} />
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ height: 60, background: '#fff', borderBottom: '1px solid #e8eaed', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, color: '#6b7280', fontSize: 20, display: 'flex', alignItems: 'center' }}>
            <i className="bi bi-list"></i>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: '#1a1f2e', fontSize: 14 }}>SEJATI</span>
            <i className="bi bi-chevron-right" style={{ fontSize: 11, color: '#9ca3af' }}></i>
            <span style={{ color: ACCENT, fontWeight: 600 }}>{currentLabel}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: ACCENT, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20 }}>Admin</div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 14 }} title={user?.username}>
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="admin-content-area" style={{ flex: 1, overflowY: 'auto', background: '#f5f6fa', padding: 24 }}>
          <Outlet />
        </div>      </div>

      <style>{`
        .sidebar-nav-link:hover { background: rgba(245,166,35,0.15) !important; color: #fff !important; }
        .sidebar-logout-btn:hover { background: rgba(255,255,255,0.12) !important; color: #fff !important; }
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}
