import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', icon: 'bi-speedometer2', label: 'Dashboard', end: true },
  { to: '/admin/users', icon: 'bi-people-fill', label: 'Kelola Pengguna' },
  { to: '/admin/data-schema', icon: 'bi-grid-3x3-gap-fill', label: 'Jenis Data & Template' },
  { to: '/admin/tasks', icon: 'bi-clipboard2-check-fill', label: 'Tugas' },
  { to: '/admin/submissions', icon: 'bi-inbox-fill', label: 'Verifikasi Data' },
  { to: '/admin/manual-entries', icon: 'bi-pencil-square', label: 'Entri Manual' },
  { to: '/admin/penduduk', icon: 'bi-bar-chart-line-fill', label: 'Data Penduduk' },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/login', { replace: true })
  }

  return (
    <div className="d-flex vh-100 overflow-hidden">
      {/* Sidebar */}
      <div
        className="d-flex flex-column flex-shrink-0 text-white"
        style={{
          width: sidebarOpen ? 240 : 60,
          background: 'linear-gradient(180deg, #1e3a5f 0%, #1e40af 100%)',
          transition: 'width 0.25s ease',
          overflow: 'hidden',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div className="d-flex align-items-center gap-2 px-3 py-3 border-bottom border-white border-opacity-25">
          <i className="bi bi-database-fill-gear fs-4 text-info flex-shrink-0"></i>
          {sidebarOpen && <span className="fw-bold fs-6 text-truncate">DataCollect</span>}
        </div>

        {/* Nav */}
        <nav className="flex-grow-1 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `d-flex align-items-center gap-3 px-3 py-2 text-decoration-none text-white-50 rounded mx-2 my-1 sidebar-link ${
                  isActive ? 'bg-white bg-opacity-25 text-white fw-semibold' : ''
                }`
              }
              title={!sidebarOpen ? item.label : ''}
            >
              <i className={`bi ${item.icon} fs-5 flex-shrink-0`}></i>
              {sidebarOpen && <span className="small text-truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="border-top border-white border-opacity-25 p-3">
          {sidebarOpen ? (
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-circle bg-danger d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 32, height: 32 }}
              >
                <i className="bi bi-person-fill text-white small"></i>
              </div>
              <div className="overflow-hidden">
                <div className="small fw-semibold text-truncate">{user?.username}</div>
                <div className="text-white-50" style={{ fontSize: 11 }}>Admin</div>
              </div>
            </div>
          ) : null}
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-outline-light w-100"
            title="Logout"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        {/* Top bar */}
        <div
          className="d-flex align-items-center px-3 py-2 bg-white border-bottom shadow-sm"
          style={{ minHeight: 52 }}
        >
          <button
            className="btn btn-sm btn-outline-secondary me-3"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <i className="bi bi-list fs-5"></i>
          </button>
          <span className="fw-semibold text-secondary">
            <i className="bi bi-shield-lock-fill text-danger me-2"></i>Panel Admin
          </span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="badge bg-danger">Admin</span>
            <span className="small text-muted">{user?.username}</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-grow-1 overflow-y-auto bg-light p-4">
          <Outlet />
        </div>
      </div>

      <style>{`
        .sidebar-link:hover { background: rgba(255,255,255,0.15) !important; color: #fff !important; }
        .overflow-y-auto { overflow-y: auto; }
      `}</style>
    </div>
  )
}
