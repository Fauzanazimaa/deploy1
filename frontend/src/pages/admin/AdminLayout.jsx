import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navGroups = [
  {
    label: 'ADMIN MENU',
    items: [
      { to: '/admin', icon: 'bi-speedometer2', label: 'Dashboard', end: true },
      { to: '/admin/users', icon: 'bi-people-fill', label: 'Kelola Pengguna' },
    ],
  },
  {
    label: 'MASTER TABEL',
    items: [
      { to: '/admin/data-schema', icon: 'bi-grid-3x3-gap-fill', label: 'Jenis Data & Template' },
      { to: '/admin/tasks', icon: 'bi-clipboard2-check-fill', label: 'Tugas' },
      { to: '/admin/submissions', icon: 'bi-inbox-fill', label: 'Verifikasi Data' },
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
const ACCENT = '#f5a623'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  // derive breadcrumb label from path
  const pathLabel = {
    '/admin': 'Dashboard',
    '/admin/users': 'Kelola Pengguna',
    '/admin/data-schema': 'Jenis Data & Template',
    '/admin/tasks': 'Tugas',
    '/admin/submissions': 'Verifikasi Data',
    '/admin/public-dashboard': 'Dashboard Publik',
  }
  const currentLabel = pathLabel[location.pathname] || 'Dashboard'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ── */}
      <div
        style={{
          width: sidebarOpen ? 240 : 64,
          minWidth: sidebarOpen ? 240 : 64,
          background: SIDEBAR_BG,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          overflow: 'hidden',
          zIndex: 200,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: sidebarOpen ? '0 18px' : '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: ACCENT,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className="bi bi-database-fill-gear" style={{ color: '#fff', fontSize: 16 }}></i>
          </div>
          {sidebarOpen && (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
              datacollect
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              {sidebarOpen && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: 1,
                    padding: '12px 18px 4px',
                  }}
                >
                  {group.label}
                </div>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={!sidebarOpen ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: sidebarOpen ? '9px 18px' : '9px 0',
                    justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    margin: '1px 8px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    background: isActive ? ACCENT : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13,
                    transition: 'background 0.15s, color 0.15s',
                  })}
                  className="sidebar-nav-link"
                >
                  <i className={`bi ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }}></i>
                  {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: sidebarOpen ? '14px 18px' : '14px 8px',
          }}
        >
          {sidebarOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: '50%', background: ACCENT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontWeight: 700, color: '#fff', fontSize: 14,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.username}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Admin</div>
              </div>
            </div>
          ) : null}
          {/* Link ke dashboard publik */}
          <NavLink to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: sidebarOpen ? '7px 8px' : '7px 0', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: 8, textDecoration: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}
            title={!sidebarOpen ? 'Dashboard Publik' : undefined}
          >
            <i className="bi bi-globe" style={{ fontSize: 14, flexShrink: 0 }}></i>
            {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>Dashboard Publik</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.07)',
              border: 'none',
              borderRadius: 8,
              color: 'rgba(255,255,255,0.6)',
              padding: '8px 0',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'background 0.15s, color 0.15s',
            }}
            className="sidebar-logout-btn"
          >
            <i className="bi bi-box-arrow-right" style={{ fontSize: 15 }}></i>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div
          style={{
            height: 60,
            background: '#fff',
            borderBottom: '1px solid #e8eaed',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: 6,
              color: '#6b7280',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <i className="bi bi-list"></i>
          </button>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
            <span style={{ fontWeight: 600, color: '#1a1f2e' }}>{currentLabel}</span>
            <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
            <span style={{ color: '#9ca3af' }}>
              <i className="bi bi-house me-1"></i>Dashboard
            </span>
            <i className="bi bi-chevron-right" style={{ fontSize: 11 }}></i>
            <span style={{ color: ACCENT, fontWeight: 500 }}>{currentLabel}</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                color: ACCENT,
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 20,
              }}
            >
              Admin
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: ACCENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
                fontSize: 14,
                cursor: 'default',
              }}
              title={user?.username}
            >
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#f5f6fa', padding: 24 }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        .sidebar-nav-link:hover {
          background: rgba(245,166,35,0.15) !important;
          color: #fff !important;
        }
        .sidebar-logout-btn:hover {
          background: rgba(255,255,255,0.12) !important;
          color: #fff !important;
        }
        nav::-webkit-scrollbar { width: 4px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}
