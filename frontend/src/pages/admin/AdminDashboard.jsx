import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../../api'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

function StatCard({ icon, label, value, color, to }) {
  const content = (
    <div className={`card border-0 shadow-sm h-100`}>
      <div className="card-body d-flex align-items-center gap-3">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 52, height: 52, background: color + '20' }}
        >
          <i className={`bi ${icon} fs-4`} style={{ color }}></i>
        </div>
        <div>
          <div className="fw-bold fs-3 lh-1">{value}</div>
          <div className="text-muted small">{label}</div>
        </div>
      </div>
    </div>
  )
  return to ? <Link to={to} className="text-decoration-none">{content}</Link> : content
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
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="spinner-border text-primary" />
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
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 2,
    }]
  }

  const userBarData = {
    labels: ['Admin', 'Contributor', 'Viewer'],
    datasets: [{
      label: 'Jumlah Pengguna',
      data: [
        stats?.total_users - stats?.total_contributors - stats?.total_viewers,
        stats?.total_contributors || 0,
        stats?.total_viewers || 0,
      ],
      backgroundColor: ['#ef4444', '#3b82f6', '#10b981'],
      borderRadius: 6,
    }]
  }

  const statusBadge = {
    pending: 'warning',
    submitted: 'primary',
    approved: 'success',
    revision: 'danger',
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Dashboard</h4>
          <p className="text-muted small mb-0">Ringkasan aktivitas sistem pengumpulan data</p>
        </div>
        <button className="btn btn-outline-primary btn-sm" onClick={fetchStats}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-people-fill" label="Total Pengguna" value={stats?.total_users} color="#3b82f6" to="/admin/users" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clipboard2-check-fill" label="Total Tugas" value={stats?.total_tasks} color="#8b5cf6" to="/admin/tasks" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-inbox-fill" label="Menunggu Verifikasi" value={stats?.pending_verifications} color="#f59e0b" to="/admin/submissions" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-pencil-square" label="Entri Manual" value={stats?.total_manual_entries} color="#10b981" to="/admin/manual-entries" />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-person-badge-fill" label="Kontributor" value={stats?.total_contributors} color="#06b6d4" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-eye-fill" label="Viewer" value={stats?.total_viewers} color="#64748b" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-grid-3x3-gap-fill" label="Jenis Data" value={stats?.total_data_types} color="#f97316" to="/admin/data-types" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-check2-circle" label="Tugas Disetujui" value={stats?.task_status?.approved} color="#10b981" />
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Status Tugas</h6>
              <div style={{ maxHeight: 220 }}>
                <Doughnut data={taskDoughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Distribusi Pengguna</h6>
              <div style={{ maxHeight: 220 }}>
                <Bar
                  data={userBarData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
          <h6 className="fw-semibold mb-0">Pengiriman Terbaru</h6>
          <Link to="/admin/submissions" className="btn btn-sm btn-outline-primary">Lihat Semua</Link>
        </div>
        <div className="card-body p-0">
          {stats?.recent_submissions?.length === 0 ? (
            <div className="text-center text-muted py-4">Belum ada pengiriman</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Kontributor</th>
                    <th>Tugas</th>
                    <th>Status</th>
                    <th>Dikirim</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recent_submissions?.map((s) => (
                    <tr key={s.id}>
                      <td className="fw-semibold">{s.contributor_username}</td>
                      <td>{s.task_title}</td>
                      <td>
                        <span className={`badge bg-${statusBadge[s.status] || 'secondary'}`}>
                          {s.status === 'pending' ? 'Menunggu' : s.status === 'approved' ? 'Disetujui' : s.status === 'revision' ? 'Revisi' : s.status}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(s.submitted_at).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
