import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getContributorStats } from '../../api'

const STATUS_MAP = {
  pending:   { label: 'Belum Upload',  color: 'warning',  icon: 'bi-clock' },
  submitted: { label: 'Diverifikasi', color: 'primary',  icon: 'bi-hourglass-split' },
  revision:  { label: 'Perlu Revisi', color: 'danger',   icon: 'bi-exclamation-triangle-fill' },
  approved:  { label: 'Disetujui',    color: 'success',  icon: 'bi-check-circle-fill' },
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
          style={{ width: 52, height: 52, background: color + '20' }}>
          <i className={`bi ${icon} fs-4`} style={{ color }}></i>
        </div>
        <div>
          <div className="fw-bold fs-3 lh-1">{value ?? 0}</div>
          <div className="text-muted small">{label}</div>
        </div>
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
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
      <div className="spinner-border text-primary" />
    </div>
  )

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-0">Dashboard</h4>
        <p className="text-muted small mb-0">Ringkasan tugas pengumpulan data kamu</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clipboard2-fill" label="Total Tugas" value={stats?.total_tasks} color="#8b5cf6" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-clock-fill" label="Belum Upload" value={stats?.pending_tasks} color="#f59e0b" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-exclamation-triangle-fill" label="Perlu Revisi" value={stats?.revision_tasks} color="#ef4444" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-check-circle-fill" label="Disetujui" value={stats?.approved_tasks} color="#10b981" />
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3">
          <h6 className="fw-semibold mb-0">Tugas Terbaru</h6>
          <Link to="/contributor/tasks" className="btn btn-sm btn-outline-primary">
            Lihat Semua <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>
        <div className="card-body p-0">
          {!stats?.recent_tasks?.length ? (
            <div className="text-center text-muted py-4">Belum ada tugas yang diberikan</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Tugas</th>
                    <th>Jenis Data</th>
                    <th>Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_tasks.map(t => {
                    const s = STATUS_MAP[t.status] || { label: t.status, color: 'secondary', icon: 'bi-circle' }
                    const isOverdue = t.deadline && new Date(t.deadline) < new Date() && t.status !== 'approved'
                    return (
                      <tr key={t.id}>
                        <td className="fw-semibold">{t.title}</td>
                        <td><span className="badge bg-light text-dark border">{t.data_type_name}</span></td>
                        <td className={isOverdue ? 'text-danger fw-semibold' : 'text-muted'}>
                          {t.deadline ? new Date(t.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '-'}
                        </td>
                        <td>
                          <span className={`badge bg-${s.color}`}>
                            <i className={`bi ${s.icon} me-1`}></i>{s.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
