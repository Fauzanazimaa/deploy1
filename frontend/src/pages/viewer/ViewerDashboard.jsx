import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getViewerDashboard } from '../../api'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const ACCENT = '#f5a623'

function StatCard({ icon, label, value, color, description }) {
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
        {description && <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 1 }}>{description}</div>}
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const chartData = {
    labels: dashboard?.data_type_stats?.map(dt => dt.name) || [],
    datasets: [{
      data: dashboard?.data_type_stats?.map(dt => dt.total) || [],
      backgroundColor: [
        ACCENT, '#3b82f6', '#10b981', '#ef4444', '#8b5cf6',
        '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  }

  const hasData = dashboard?.data_type_stats?.some(dt => dt.total > 0)

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Dashboard Data Terkini</h4>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Ringkasan data yang sudah disetujui dan siap digunakan</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <StatCard icon="bi-check-circle-fill" label="Data Disetujui" value={dashboard?.approved_tasks} color="#10b981" description="Dari kontributor" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-pencil-square" label="Entri Manual" value={dashboard?.total_manual_entries} color="#3b82f6" description="Input langsung admin" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-grid-3x3-gap-fill" label="Jenis Data" value={dashboard?.total_data_types} color="#8b5cf6" description="Kategori tersedia" />
        </div>
        <div className="col-6 col-md-3">
          <StatCard icon="bi-inbox-fill" label="Total Pengiriman" value={dashboard?.approved_submissions} color={ACCENT} description="File disetujui" />
        </div>
      </div>

      {/* Charts + Table */}
      <div className="row g-3 mb-4">
        <div className="col-md-5">
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', height: '100%' }}>
            <h6 style={{ fontWeight: 600, fontSize: 14, color: '#1a1f2e', marginBottom: 16 }}>Distribusi Data per Jenis</h6>
            {!hasData ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 13 }}>
                <i className="bi bi-inbox" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: 0.4 }}></i>
                Belum ada data tersedia
              </div>
            ) : (
              <div style={{ maxHeight: 240 }}>
                <Doughnut
                  data={chartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, padding: 12, boxWidth: 12 } } }
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-md-7">
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', height: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
              <h6 style={{ fontWeight: 600, fontSize: 14, color: '#1a1f2e', margin: 0 }}>Rincian per Jenis Data</h6>
              <Link to="/viewer/data" style={{ background: ACCENT, color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                Lihat Semua <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
            {!dashboard?.data_type_stats?.length ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>Belum ada jenis data</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      {['Jenis Data', 'Disetujui', 'Entri Manual', 'Total'].map((h) => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: h === 'Jenis Data' ? 'left' : 'center', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.data_type_stats.map(dt => (
                      <tr key={dt.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="table-row-hover">
                        <td style={{ padding: '11px 20px', fontWeight: 600, color: '#1a1f2e' }}>{dt.name}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'center' }}>
                          <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{dt.approved_tasks}</span>
                        </td>
                        <td style={{ padding: '11px 20px', textAlign: 'center' }}>
                          <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{dt.manual_entries}</span>
                        </td>
                        <td style={{ padding: '11px 20px', textAlign: 'center' }}>
                          <span style={{ background: '#1a1f2e', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{dt.total}</span>
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

      {/* Info banner */}
      <div
        style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          borderRadius: 12,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          fontSize: 13,
          color: '#92400e',
        }}
      >
        <i className="bi bi-info-circle-fill" style={{ color: ACCENT, fontSize: 18, flexShrink: 0, marginTop: 1 }}></i>
        <div>
          <strong>Catatan:</strong> Data yang ditampilkan adalah data yang telah diverifikasi dan disetujui oleh admin.
          Anda dapat melihat detail dan mengunduh data di halaman{' '}
          <Link to="/viewer/data" style={{ color: ACCENT, fontWeight: 600 }}>Lihat Data</Link>.
        </div>
      </div>

      <style>{`.table-row-hover:hover { background: #fafafa; }`}</style>
    </div>
  )
}
