import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getContributorStats } from '../../api'

const ACCENT = '#f5a623'

const STATUS_MAP = {
  pending:   { label: 'Belum Upload',  color: ACCENT,    bg: '#fff7ed', border: '#fed7aa', icon: 'bi-clock' },
  submitted: { label: 'Diverifikasi', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: 'bi-hourglass-split' },
  revision:  { label: 'Perlu Revisi', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: 'bi-exclamation-triangle-fill' },
  approved:  { label: 'Disetujui',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: 'bi-check-circle-fill' },
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f0f0f0',
        height: '100%',
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          background: color + '18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <i className={`bi ${icon}`} style={{ color, fontSize: 22 }}></i>
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 26, lineHeight: 1, color: '#1a1f2e' }}>{value ?? 0}</div>
        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>{label}</div>
      </div>
    </div>
  )
}

export default function ContributorDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getContributorStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Dashboard</h4>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Ringkasan tugas pengumpulan data kamu</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clipboard2-fill" label="Total Tugas" value={stats?.total_tasks} color="#8b5cf6" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clock-fill" label="Belum Upload" value={stats?.pending_tasks} color={ACCENT} />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-exclamation-triangle-fill" label="Perlu Revisi" value={stats?.revision_tasks} color="#ef4444" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-check-circle-fill" label="Disetujui" value={stats?.approved_tasks} color="#10b981" />
        </div>
      </div>

      {/* Recent Tasks */}
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid #f0f0f0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h6 style={{ fontWeight: 600, fontSize: 14, color: '#1a1f2e', margin: 0 }}>Tugas Terbaru</h6>
          <Link
            to="/contributor/tasks"
            style={{
              background: ACCENT,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
              padding: '5px 14px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            Lihat Semua <i className="bi bi-arrow-right"></i>
          </Link>
        </div>

        {!stats?.recent_tasks?.length ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 13 }}>
            <i className="bi bi-clipboard2 display-5" style={{ display: 'block', marginBottom: 10, opacity: 0.4 }}></i>
            Belum ada tugas yang diberikan
          </div>
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="d-md-none" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px 12px' }}>
              {stats.recent_tasks.map(t => {
                const s = STATUS_MAP[t.status] || { label: t.status, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: 'bi-circle' }
                const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'approved'
                return (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1f2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: isOverdue ? '#dc2626' : '#9ca3af', marginTop: 2 }}>
                        <i className="bi bi-calendar-event me-1"></i>
                        {t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Tanpa deadline'}
                      </div>
                    </div>
                    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                      <i className={`bi ${s.icon} me-1`}></i>{s.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Desktop: table */}
            <div className="d-none d-md-block" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    {['Tugas', 'Jenis Data', 'Deadline', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_tasks.map(t => {
                    const s = STATUS_MAP[t.status] || { label: t.status, color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: 'bi-circle' }
                    const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'approved'
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="table-row-hover">
                        <td style={{ padding: '11px 20px', fontWeight: 600, color: '#1a1f2e' }}>{t.title}</td>
                        <td style={{ padding: '11px 20px' }}>
                          <span style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{t.data_type_name}</span>
                        </td>
                        <td style={{ padding: '11px 20px', color: isOverdue ? '#dc2626' : '#6b7280', fontWeight: isOverdue ? 600 : 400, fontSize: 12 }}>
                          {t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </td>
                        <td style={{ padding: '11px 20px' }}>
                          <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                            <i className={`bi ${s.icon} me-1`}></i>{s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <style>{`.table-row-hover:hover { background: #fafafa; }`}</style>
    </div>
  )
}
