import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../../api'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const ACCENT = '#f5a623'

function StatCard({ icon, label, value, color, to }) {
  const content = (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        height: '100%',
        border: '1px solid #f0f0f0',
        transition: 'box-shadow 0.15s',
      }}
      className="stat-card"
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
  return to ? (
    <Link to={to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      {content}
    </Link>
  ) : content
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await getAdminStats()
      setStats(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: `3px solid ${ACCENT}30`,
            borderTopColor: ACCENT,
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const taskDoughnutData = {
    labels: ['Menunggu', 'Dikirim', 'Disetujui', 'Revisi'],
    datasets: [{
      data: [
        stats?.task_status?.pending || 0,
        stats?.task_status?.submitted || 0,
        stats?.task_status?.approved || 0,
        stats?.task_status?.revision || 0,
      ],
      backgroundColor: [ACCENT, '#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 2,
      borderColor: '#fff',
    }]
  }

  const userBarData = {
    labels: ['Admin', 'Kontributor', 'Viewer'],
    datasets: [{
      label: 'Jumlah Pengguna',
      data: [
        (stats?.total_users || 0) - (stats?.total_contributors || 0) - (stats?.total_viewers || 0),
        stats?.total_contributors || 0,
        stats?.total_viewers || 0,
      ],
      backgroundColor: [ACCENT, '#3b82f6', '#10b981'],
      borderRadius: 6,
      borderSkipped: false,
    }]
  }

  const statusBadgeStyle = {
    pending:   { background: '#fff7ed', color: ACCENT,    border: '1px solid #fed7aa' },
    submitted: { background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' },
    approved:  { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    revision:  { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' },
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Dashboard</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Ringkasan aktivitas sistem pengumpulan data</p>
        </div>
        <button
          onClick={fetchStats}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: 12,
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      {/* Stat Cards Row 1 */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-people-fill" label="Total Pengguna" value={stats?.total_users} color="#3b82f6" to="/admin/users" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clipboard2-check-fill" label="Total Tugas" value={stats?.total_tasks} color="#8b5cf6" to="/admin/tasks" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-inbox-fill" label="Menunggu Verifikasi" value={stats?.pending_verifications} color={ACCENT} to="/admin/submissions" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-pencil-square" label="Entri Manual" value={stats?.total_manual_entries} color="#10b981" to="/admin/manual-entries" />
        </div>
      </div>

      {/* Stat Cards Row 2 */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-person-badge-fill" label="Kontributor" value={stats?.total_contributors} color="#06b6d4" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-eye-fill" label="Viewer" value={stats?.total_viewers} color="#64748b" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-grid-3x3-gap-fill" label="Jenis Data" value={stats?.total_data_types} color={ACCENT} to="/admin/data-schema" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-check2-circle" label="Tugas Disetujui" value={stats?.task_status?.approved} color="#10b981" />
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              height: '100%',
            }}
          >
            <h6 style={{ fontWeight: 600, fontSize: 14, color: '#1a1f2e', marginBottom: 16 }}>Status Tugas</h6>
            <div style={{ maxHeight: 220 }}>
              <Doughnut
                data={taskDoughnutData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { font: { family: 'Inter', size: 12 }, padding: 14, boxWidth: 12 }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              border: '1px solid #f0f0f0',
              height: '100%',
            }}
          >
            <h6 style={{ fontWeight: 600, fontSize: 14, color: '#1a1f2e', marginBottom: 16 }}>Distribusi Pengguna</h6>
            <div style={{ maxHeight: 220 }}>
              <Bar
                data={userBarData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Inter' } } },
                    x: { ticks: { font: { family: 'Inter' } } }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
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
          <h6 style={{ fontWeight: 600, fontSize: 14, color: '#1a1f2e', margin: 0 }}>Pengiriman Terbaru</h6>
          <Link
            to="/admin/submissions"
            style={{
              background: ACCENT,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
              padding: '5px 14px',
              borderRadius: 6,
            }}
          >
            Lihat Semua
          </Link>
        </div>

        {!stats?.recent_submissions?.length ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>
            Belum ada pengiriman
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['Kontributor', 'Tugas', 'Status', 'Dikirim'].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_submissions.map((s) => {
                  const badge = statusBadgeStyle[s.status] || { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="table-row-hover">
                      <td style={{ padding: '11px 20px', fontWeight: 600, color: '#1a1f2e' }}>{s.contributor_username}</td>
                      <td style={{ padding: '11px 20px', color: '#374151' }}>{s.task_title}</td>
                      <td style={{ padding: '11px 20px' }}>
                        <span
                          style={{
                            ...badge,
                            borderRadius: 20,
                            padding: '3px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {s.status === 'pending' ? 'Menunggu' : s.status === 'approved' ? 'Disetujui' : s.status === 'revision' ? 'Revisi' : s.status}
                        </span>
                      </td>
                      <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>
                        {new Date(s.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; }
        .table-row-hover:hover { background: #fafafa; }
      `}</style>
    </div>
  )
}
