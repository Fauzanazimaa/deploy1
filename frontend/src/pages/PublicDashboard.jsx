import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { getPublicWidgets, downloadPublicWidget, login as loginApi } from '../api'
import { useAuth } from '../context/AuthContext'
import SejatiLogo from '../components/SejatiLogo'

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Title, Filler
)

const ACCENT = '#f5a623'
const SIDEBAR_BG = '#1a1f2e'
const CHART_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7',
  '#84cc16','#64748b'
]

const CHART_ICONS = {
  bar: 'bi-bar-chart-fill', line: 'bi-graph-up', pie: 'bi-pie-chart-fill',
  doughnut: 'bi-circle-half', area: 'bi-bar-chart-steps', number: 'bi-123', table: 'bi-table'
}

// ─── Chart renderer ───────────────────────────────────────────────────────────
function WidgetChart({ widget, filters }) {
  const cd = widget.chart_data
  if (!cd || !cd.labels || cd.labels.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
        <i className="bi bi-inbox" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: 0.4 }}></i>
        <span style={{ fontSize: 13 }}>Belum ada data tersedia</span>
      </div>
    )
  }

  // Filter by tahun if applicable
  let labels = cd.labels
  let values = cd.values
  if (filters.tahun && cd.rawRows) {
    const filtered = cd.rawRows.filter(r => String(r.tahun || '') === String(filters.tahun))
    if (filtered.length > 0) {
      labels = filtered.map(r => r[widget.label_field] || '')
      values = filtered.map(r => parseFloat(r[widget.value_field] || 0))
    }
  }

  const chartData = {
    labels,
    datasets: [{
      label: widget.title,
      data: values,
      backgroundColor: (widget.chart_type === 'pie' || widget.chart_type === 'doughnut')
        ? CHART_COLORS.slice(0, labels.length)
        : CHART_COLORS[0] + 'cc',
      borderColor: widget.chart_type === 'line' || widget.chart_type === 'area' ? CHART_COLORS[0] : CHART_COLORS[0],
      borderWidth: 2,
      fill: widget.chart_type === 'area',
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  }

  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 }, padding: 14, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${(ctx.parsed.y ?? ctx.parsed).toLocaleString('id-ID')}` } }
    },
    scales: widget.chart_type === 'pie' || widget.chart_type === 'doughnut' ? {} : {
      y: { beginAtZero: true, ticks: { font: { family: 'Inter', size: 11 }, callback: v => v.toLocaleString('id-ID') } },
      x: { ticks: { font: { family: 'Inter', size: 11 } } }
    }
  }

  const h = 280
  switch (widget.chart_type) {
    case 'bar':     return <div style={{ height: h }}><Bar data={chartData} options={opts} /></div>
    case 'line':    return <div style={{ height: h }}><Line data={chartData} options={opts} /></div>
    case 'area':    return <div style={{ height: h }}><Line data={chartData} options={opts} /></div>
    case 'pie':     return <div style={{ height: h }}><Pie data={chartData} options={opts} /></div>
    case 'doughnut':return <div style={{ height: h }}><Doughnut data={chartData} options={opts} /></div>
    case 'number': {
      const total = values.reduce((a, b) => a + b, 0)
      return (
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: ACCENT, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString('id-ID')}</div>
          <div style={{ color: '#6b7280', fontSize: 14, marginTop: 10 }}>{widget.description || 'Total'}</div>
        </div>
      )
    }
    case 'table':
      return (
        <div style={{ overflowX: 'auto', maxHeight: 320, border: '1px solid #e5e7eb', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: SIDEBAR_BG, position: 'sticky', top: 0 }}>
                <th style={{ padding: '10px 14px', color: '#fff', fontWeight: 600, textAlign: 'left' }}>Label</th>
                <th style={{ padding: '10px 14px', color: '#fff', fontWeight: 600, textAlign: 'right' }}>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((lbl, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '9px 14px', color: '#374151' }}>{lbl}</td>
                  <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: '#1a1f2e' }}>{(values[i] || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default: return null
  }
}

// ─── Download helper ──────────────────────────────────────────────────────────
function useDownload() {
  const [downloading, setDownloading] = useState({})

  const downloadExcel = async (widget) => {
    setDownloading(p => ({ ...p, [widget.id]: true }))
    try {
      const res = await downloadPublicWidget(widget.id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${widget.title}_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch { alert('Gagal mengunduh data') }
    finally { setDownloading(p => ({ ...p, [widget.id]: false })) }
  }

  const downloadPNG = (widgetId) => {
    const canvas = document.querySelector(`[data-widget-id="${widgetId}"] canvas`)
    if (!canvas) return alert('Chart tidak dapat diunduh')
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `chart_${widgetId}.png`
    document.body.appendChild(a); a.click(); a.remove()
  }

  return { downloading, downloadExcel, downloadPNG }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PublicDashboard() {
  const navigate = useNavigate()
  const [widgets, setWidgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [openLogin, setOpenLogin] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTahun, setFilterTahun] = useState('')
  const { downloading, downloadExcel, downloadPNG } = useDownload()

  useEffect(() => {
    getPublicWidgets()
      .then(res => setWidgets(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const allCategories = [...new Set(widgets.map(w => w.category || 'Umum'))]
  const filtered = widgets.filter(w => filterCategory === 'all' || (w.category || 'Umum') === filterCategory)
  const kpiWidgets = filtered.filter(w => w.chart_type === 'number')
  const chartWidgets = filtered.filter(w => w.chart_type !== 'number')
  const filters = { tahun: filterTahun }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Navigation ── */}
      <nav style={{ background: SIDEBAR_BG, height: 64, display: 'flex', alignItems: 'center', padding: '0 28px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
        <SejatiLogo size={36} variant="full" />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setOpenLogin(openLogin ? null : 'login')}
              style={{ background: ACCENT, border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}>
              <i className="bi bi-box-arrow-in-right"></i> Login
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div style={{ background: `linear-gradient(135deg, ${SIDEBAR_BG} 0%, #2d3748 100%)`, padding: '48px 28px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: ACCENT + '22', border: `1px solid ${ACCENT}44`, borderRadius: 20, padding: '5px 14px', fontSize: 12, color: ACCENT, fontWeight: 600, marginBottom: 16 }}>
            <i className="bi bi-circle-fill" style={{ fontSize: 7, animation: 'blink 1.5s infinite' }}></i>
            DATA TERVERIFIKASI RESMI
          </div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(22px, 4vw, 36px)', margin: '0 0 12px', lineHeight: 1.2 }}>
            Portal Data Statistik SEJATI
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: '0 0 28px', lineHeight: 1.6 }}>
            Sistem Jejaring Pengumpulan Data Statistik Terintegrasi. Data yang ditampilkan telah melalui proses verifikasi oleh tim pengelola. Tersedia dalam berbagai format visualisasi dan dapat diunduh secara gratis.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { icon: 'bi-shield-check-fill', label: 'Data Terverifikasi', color: '#10b981' },
              { icon: 'bi-download', label: 'Bebas Diunduh', color: '#3b82f6' },
              { icon: 'bi-graph-up-arrow', label: 'Visualisasi Interaktif', color: ACCENT },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                <i className={`bi ${f.icon}`} style={{ color: f.color, fontSize: 16 }}></i>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 28px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>KATEGORI:</span>
        {['all', ...allCategories].map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            style={{ background: filterCategory === cat ? ACCENT : '#f3f4f6', border: `1.5px solid ${filterCategory === cat ? ACCENT : '#e5e7eb'}`, color: filterCategory === cat ? '#fff' : '#374151', borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif", transition: 'all .15s' }}>
            {cat === 'all' ? '🔍 Semua' : cat}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>TAHUN:</label>
          <input type="number" min="2000" max="2100" value={filterTahun}
            onChange={e => setFilterTahun(e.target.value)}
            placeholder="Semua tahun"
            style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 10px', fontSize: 12, width: 120, outline: 'none', fontFamily: "'Inter',sans-serif" }} />
          {filterTahun && (
            <button onClick={() => setFilterTahun('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>
              <i className="bi bi-x-circle"></i>
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 20px 60px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 44, height: 44, border: `4px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
            <p style={{ color: '#6b7280', marginTop: 16, fontSize: 14 }}>Memuat data dashboard…</p>
          </div>
        ) : widgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <i className="bi bi-bar-chart-line" style={{ fontSize: 56, color: '#d1d5db', display: 'block', marginBottom: 16 }}></i>
            <h3 style={{ color: '#374151', fontWeight: 700, marginBottom: 8 }}>Dashboard Sedang Dipersiapkan</h3>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Admin belum mempublikasikan data apapun. Silakan kembali nanti.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            {kpiWidgets.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 20, background: ACCENT, borderRadius: 2 }}></div>
                  <h2 style={{ fontWeight: 700, fontSize: 16, color: '#1a1f2e', margin: 0 }}>Indikator Utama</h2>
                </div>
                <div className="row g-3">
                  {kpiWidgets.map(w => {
                    const total = (w.chart_data?.values || []).reduce((a, b) => a + b, 0)
                    return (
                      <div className="col-6 col-md-3" key={w.id}>
                        <div style={{ background: '#fff', borderRadius: 14, padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', height: '100%' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 11, background: ACCENT + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                            <i className="bi bi-123" style={{ color: ACCENT, fontSize: 20 }}></i>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: 32, color: '#1a1f2e', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString('id-ID')}</div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#374151', marginTop: 6 }}>{w.title}</div>
                          {w.description && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{w.description}</div>}
                          {w.allow_download && (
                            <button onClick={() => downloadExcel(w)} disabled={downloading[w.id]}
                              style={{ marginTop: 12, background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 7, padding: '5px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                              <i className="bi bi-download"></i> Unduh Excel
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Chart Widgets */}
            {chartWidgets.length > 0 && (
              <div>
                {kpiWidgets.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 4, height: 20, background: '#3b82f6', borderRadius: 2 }}></div>
                    <h2 style={{ fontWeight: 700, fontSize: 16, color: '#1a1f2e', margin: 0 }}>Visualisasi Data</h2>
                  </div>
                )}
                <div className="row g-4">
                  {chartWidgets.map(w => (
                    <div className={`col-12 ${w.chart_type === 'table' ? 'col-lg-12' : 'col-md-6'}`} key={w.id}>
                      <div data-widget-id={w.id} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', overflow: 'hidden', height: '100%' }}>
                        {/* Widget header */}
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 9, background: ACCENT + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className={`bi ${CHART_ICONS[w.chart_type] || 'bi-bar-chart'}`} style={{ color: ACCENT, fontSize: 17 }}></i>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e' }}>{w.title}</div>
                              {w.description && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{w.description}</div>}
                              <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                                <span style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>{w.category || 'Umum'}</span>
                                {w.data_type_name && <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>{w.data_type_name}</span>}
                                <span style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#92400e', borderRadius: 10, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>
                                  <i className="bi bi-shield-check me-1"></i>Terverifikasi
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Download buttons */}
                          {w.allow_download && (
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                              {w.chart_type !== 'table' && (
                                <button onClick={() => downloadPNG(w.id)} title="Unduh PNG"
                                  style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 7, padding: '5px 9px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                                  <i className="bi bi-image"></i> <span style={{ fontSize: 11 }}>PNG</span>
                                </button>
                              )}
                              <button onClick={() => downloadExcel(w)} disabled={downloading[w.id]} title="Unduh Excel/CSV"
                                style={{ background: downloading[w.id] ? '#f3f4f6' : '#f0fdf4', border: `1px solid ${downloading[w.id] ? '#e5e7eb' : '#bbf7d0'}`, color: downloading[w.id] ? '#9ca3af' : '#16a34a', borderRadius: 7, padding: '5px 9px', fontSize: 12, cursor: downloading[w.id] ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                                {downloading[w.id] ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <i className="bi bi-file-earmark-excel"></i>}
                                <span style={{ fontSize: 11 }}>Excel</span>
                              </button>
                            </div>
                          )}
                        </div>
                        {/* Chart body */}
                        <div style={{ padding: '20px' }}>
                          <WidgetChart widget={w} filters={filters} />
                        </div>
                        {/* Footer: row count & date */}
                        <div style={{ padding: '10px 20px', borderTop: '1px solid #f5f5f5', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            <i className="bi bi-database me-1"></i>{w.total_rows || 0} baris data
                          </span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>
                            <i className="bi bi-check-circle me-1" style={{ color: '#10b981' }}></i>Data terverifikasi
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: SIDEBAR_BG, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '24px 20px', fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <SejatiLogo size={32} variant="compact" />
        </div>
        <div style={{ marginBottom: 4, color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13 }}>
          SEJATI — Sistem Jejaring Pengumpulan Data Statistik Terintegrasi
        </div>
        <div>Data yang ditampilkan telah melalui proses verifikasi resmi. Bebas digunakan untuk kepentingan publik.</div>
      </footer>

      {/* ── Login Panel (dropdown) ── */}
      {openLogin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setOpenLogin(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'fixed', top: 72, right: 20, width: 320, background: '#fff', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.2)', overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <LoginPanel onClose={() => setOpenLogin(null)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:.3 } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  )
}

// ─── Inline Login Panel ───────────────────────────────────────────────────────
function LoginPanel({ onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi({ username, password })
      const { access_token, user } = res.data
      loginUser(access_token, user)
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'contributor') navigate('/contributor', { replace: true })
      else navigate('/viewer', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Username atau password salah')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div style={{ background: ACCENT, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="bi bi-box-arrow-in-right" style={{ color: '#fff', fontSize: 18 }}></i>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Masuk ke SEJATI</span>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: '#fff', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-x" style={{ fontSize: 16 }}></i>
        </button>
      </div>
      <div style={{ padding: '20px 18px 22px' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-exclamation-triangle-fill"></i> {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 13 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>USERNAME</label>
            <div style={{ display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 40, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-person" style={{ fontSize: 15 }}></i>
              </span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
                placeholder="Masukkan username"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 40, fontFamily: "'Inter',sans-serif" }} />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>PASSWORD</label>
            <div style={{ display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 40, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-lock" style={{ fontSize: 15 }}></i>
              </span>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Masukkan password"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 40, fontFamily: "'Inter',sans-serif" }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ border: 'none', background: '#f9fafb', borderLeft: '1px solid #e5e7eb', padding: '0 10px', height: 40, cursor: 'pointer', color: '#9ca3af' }}>
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', border: 'none', borderRadius: 8, background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Inter',sans-serif", boxShadow: '0 4px 14px rgba(245,166,35,0.35)' }}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Masuk…</>
              : <><i className="bi bi-box-arrow-in-right"></i> Masuk</>}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 14, marginBottom: 0 }}>
          Sistem akan otomatis mengarahkan ke panel sesuai role Anda.
        </p>
      </div>
    </>
  )
}
