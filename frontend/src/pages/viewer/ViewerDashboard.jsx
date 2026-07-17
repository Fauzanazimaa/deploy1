import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViewerDashboard } from '../../api'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

function StatCard({ icon, label, value, color, description }) {
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
          {description && <div className="text-muted" style={{ fontSize: 11 }}>{description}</div>}
        </div>
      </div>
    </div>
  )
}

export default function ViewerDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getViewerDashboard()
      .then(res => setDashboard(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
      <div className="spinner-border text-success" />
    </div>
  )

  const chartData = {
    labels: dashboard?.data_type_stats?.map(dt => dt.name) || [],
    datasets: [{
      data: dashboard?.data_type_stats?.map(dt => dt.total) || [],
      backgroundColor: [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const hasData = dashboard?.data_type_stats?.some(dt => dt.total > 0)

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-0">Dashboard Data Terkini</h4>
        <p className="text-muted small mb-0">Ringkasan data yang sudah disetujui dan siap digunakan</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard 
            icon="bi-check-circle-fill" 
            label="Data Disetujui" 
            value={dashboard?.approved_tasks} 
            color="#10b981"
            description="Dari kontributor"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard 
            icon="bi-pencil-square" 
            label="Entri Manual" 
            value={dashboard?.total_manual_entries} 
            color="#3b82f6"
            description="Input langsung admin"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard 
            icon="bi-grid-3x3-gap-fill" 
            label="Jenis Data" 
            value={dashboard?.total_data_types} 
            color="#8b5cf6"
            description="Kategori tersedia"
          />
        </div>
        <div className="col-6 col-md-3">
          <StatCard 
            icon="bi-inbox-fill" 
            label="Total Pengiriman" 
            value={dashboard?.approved_submissions} 
            color="#f59e0b"
            description="File disetujui"
          />
        </div>
      </div>

      {/* Data breakdown */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h6 className="fw-semibold mb-3">Distribusi Data per Jenis</h6>
              {!hasData ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-inbox display-4 mb-3"></i>
                  <p className="small">Belum ada data tersedia</p>
                </div>
              ) : (
                <div style={{ maxHeight: 240 }}>
                  <Doughnut 
                    data={chartData} 
                    options={{ 
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { position: 'bottom', labels: { font: { size: 11 } } } 
                      }
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center pt-3">
              <h6 className="fw-semibold mb-0">Rincian per Jenis Data</h6>
              <Link to="/viewer/data" className="btn btn-sm btn-outline-success">
                Lihat Semua Data <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
            <div className="card-body p-0">
              {!dashboard?.data_type_stats?.length ? (
                <div className="text-center text-muted py-4">Belum ada jenis data</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Jenis Data</th>
                        <th className="text-center">Data Disetujui</th>
                        <th className="text-center">Entri Manual</th>
                        <th className="text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.data_type_stats.map(dt => (
                        <tr key={dt.id}>
                          <td className="fw-semibold">{dt.name}</td>
                          <td className="text-center">
                            <span className="badge bg-success bg-opacity-10 text-success border border-success">
                              {dt.approved_tasks}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                              {dt.manual_entries}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-dark">{dt.total}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="alert alert-info d-flex gap-3 align-items-start border-0 shadow-sm">
        <i className="bi bi-info-circle-fill fs-4 flex-shrink-0 mt-1"></i>
        <div className="small">
          <strong>Catatan:</strong> Data yang ditampilkan di sini adalah data yang telah diverifikasi dan disetujui oleh admin. 
          Anda dapat melihat detail dan mengunduh data di halaman <Link to="/viewer/data" className="alert-link fw-semibold">Lihat Data</Link>.
        </div>
      </div>
    </div>
  )
}
