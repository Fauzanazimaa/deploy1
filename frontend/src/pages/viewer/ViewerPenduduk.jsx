import React, { useEffect, useState, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import { getPendudukJK, getPendudukUmur, getPendudukKec } from '../../api'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend
)

// ─── Warna palette ────────────────────────────────────────────────────────────
const COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7',
  '#84cc16','#64748b'
]

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Loading() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 260 }}>
      <div className="spinner-border text-success" role="status">
        <span className="visually-hidden">Loading…</span>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function Empty({ msg = 'Belum ada data. Admin belum memasukkan data untuk kategori ini.' }) {
  return (
    <div className="text-center text-muted py-5">
      <i className="bi bi-inbox display-4 d-block mb-2"></i>
      <p className="small mb-0">{msg}</p>
    </div>
  )
}

// ─── TAB: Jenis Kelamin ───────────────────────────────────────────────────────
function TabJenisKelamin() {
  const [data, setData]   = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView]   = useState('chart')   // 'chart' | 'table'

  useEffect(() => {
    getPendudukJK()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (!data.length) return <Empty />

  const labels    = data.map(d => d.tahun)
  const lakiData  = data.map(d => d.laki_laki)
  const prData    = data.map(d => d.perempuan)
  const totalData = data.map(d => d.total)

  const barData = {
    labels,
    datasets: [
      { label: 'Laki-laki', data: lakiData, backgroundColor: '#3b82f6', borderRadius: 4 },
      { label: 'Perempuan', data: prData,   backgroundColor: '#ec4899', borderRadius: 4 },
    ]
  }

  const lineData = {
    labels,
    datasets: [
      { label: 'Total Penduduk', data: totalData, borderColor: '#10b981', backgroundColor: '#10b98133',
        fill: true, tension: 0.4, pointRadius: 5 }
    ]
  }

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString('id-ID')} jiwa`
        }
      }
    },
    scales: {
      y: {
        ticks: { callback: v => v.toLocaleString('id-ID') }
      }
    }
  }

  // ringkasan
  const latest = data[data.length - 1]
  const rasio  = latest.perempuan
    ? ((latest.laki_laki / latest.perempuan) * 100).toFixed(1)
    : '-'

  return (
    <div>
      {/* Stat cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Laki-laki',  value: latest.laki_laki, color: '#3b82f6', icon: 'bi-gender-male' },
          { label: 'Perempuan',  value: latest.perempuan,  color: '#ec4899', icon: 'bi-gender-female' },
          { label: 'Total',      value: latest.total,      color: '#10b981', icon: 'bi-people-fill' },
          { label: 'Sex Ratio',  value: rasio,             color: '#f59e0b', icon: 'bi-bar-chart-steps',
            suffix: ' per 100', noFormat: true },
        ].map(s => (
          <div key={s.label} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center gap-3">
                <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 48, height: 48, background: s.color + '22' }}>
                  <i className={`bi ${s.icon} fs-4`} style={{ color: s.color }}></i>
                </div>
                <div>
                  <div className="fw-bold fs-4 lh-1">
                    {s.noFormat ? s.value : (s.value ?? 0).toLocaleString('id-ID')}
                    {s.suffix && <span className="fs-6 fw-normal text-muted">{s.suffix}</span>}
                  </div>
                  <div className="text-muted small">{s.label} ({latest.tahun})</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <div className="d-flex justify-content-end mb-3 gap-2">
        <div className="btn-group btn-group-sm">
          <button className={`btn ${view === 'chart' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('chart')}>
            <i className="bi bi-bar-chart me-1"></i>Grafik
          </button>
          <button className={`btn ${view === 'table' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('table')}>
            <i className="bi bi-table me-1"></i>Tabel
          </button>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="row g-3">
          <div className="col-md-7">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Penduduk Laki-laki & Perempuan per Tahun</h6>
                <div style={{ height: 300 }}>
                  <Bar data={barData} options={chartOpts} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Tren Total Penduduk</h6>
                <div style={{ height: 300 }}>
                  <Line data={lineData} options={chartOpts} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Tahun</th>
                    <th className="text-end">Laki-laki</th>
                    <th className="text-end">Perempuan</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Sex Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => (
                    <tr key={d.tahun}>
                      <td className="fw-semibold">{d.tahun}</td>
                      <td className="text-end">{(d.laki_laki ?? 0).toLocaleString('id-ID')}</td>
                      <td className="text-end">{(d.perempuan ?? 0).toLocaleString('id-ID')}</td>
                      <td className="text-end fw-bold">{(d.total ?? 0).toLocaleString('id-ID')}</td>
                      <td className="text-end">
                        {d.perempuan ? ((d.laki_laki / d.perempuan) * 100).toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TAB: Kelompok Umur ───────────────────────────────────────────────────────
function TabKelompokUmur() {
  const [rawData,    setRawData]    = useState([])
  const [tahunList,  setTahunList]  = useState([])
  const [tahunSel,   setTahunSel]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState('chart')

  useEffect(() => {
    getPendudukUmur()
      .then(r => {
        setRawData(r.data.data)
        const list = r.data.tahun_tersedia
        setTahunList(list)
        if (list.length) setTahunSel(list[list.length - 1])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (!rawData.length) return <Empty />

  // Filter data per tahun terpilih
  const filtered = tahunSel
    ? rawData.filter(d => d.tahun === tahunSel)
    : rawData

  const kelompokList = [...new Set(filtered.map(d => d.kelompok_umur))].sort()
  const lakiList  = kelompokList.map(ku => { const r = filtered.find(d => d.kelompok_umur === ku); return r ? (r.laki_laki ?? 0) : 0 })
  const prList    = kelompokList.map(ku => { const r = filtered.find(d => d.kelompok_umur === ku); return r ? (r.perempuan ?? 0) : 0 })

  const barData = {
    labels: kelompokList,
    datasets: [
      { label: 'Laki-laki', data: lakiList, backgroundColor: '#3b82f6', borderRadius: 4 },
      { label: 'Perempuan', data: prList,   backgroundColor: '#ec4899', borderRadius: 4 },
    ]
  }

  // Line: tren total per kelompok lintas tahun
  const semuaKelompok = [...new Set(rawData.map(d => d.kelompok_umur))].sort()
  const lineData = {
    labels: tahunList,
    datasets: semuaKelompok.map((ku, i) => ({
      label: ku,
      data: tahunList.map(t => {
        const row = rawData.find(d => d.tahun === t && d.kelompok_umur === ku)
        return row ? (row.laki_laki ?? 0) + (row.perempuan ?? 0) : 0
      }),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: 'transparent',
      tension: 0.4,
      pointRadius: 4,
    }))
  }

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x?.toLocaleString('id-ID')} jiwa` } }
    },
    scales: { x: { ticks: { callback: v => v.toLocaleString('id-ID') } } }
  }

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString('id-ID')} jiwa` } }
    },
    scales: { y: { ticks: { callback: v => v.toLocaleString('id-ID') } } }
  }

  return (
    <div>
      {/* Filter tahun + toggle */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div className="d-flex align-items-center gap-2">
          <label className="small fw-semibold text-muted mb-0">Tahun:</label>
          <div className="d-flex flex-wrap gap-1">
            {tahunList.map(t => (
              <button key={t}
                className={`btn btn-sm ${tahunSel === t ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setTahunSel(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="btn-group btn-group-sm">
          <button className={`btn ${view === 'chart' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('chart')}>
            <i className="bi bi-bar-chart me-1"></i>Grafik
          </button>
          <button className={`btn ${view === 'trend' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('trend')}>
            <i className="bi bi-graph-up me-1"></i>Tren
          </button>
          <button className={`btn ${view === 'table' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('table')}>
            <i className="bi bi-table me-1"></i>Tabel
          </button>
        </div>
      </div>

      {view === 'chart' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Penduduk per Kelompok Umur — Tahun {tahunSel}</h6>
            <div style={{ height: Math.max(300, kelompokList.length * 36) }}>
              <Bar data={barData} options={barOpts} />
            </div>
          </div>
        </div>
      )}

      {view === 'trend' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Tren Kelompok Umur dari Tahun ke Tahun</h6>
            <div style={{ height: 380 }}>
              <Line data={lineData} options={lineOpts} />
            </div>
          </div>
        </div>
      )}

      {view === 'table' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Kelompok Umur</th>
                    {tahunList.map(t => (
                      <th key={t} className="text-end" colSpan={3}>{t}</th>
                    ))}
                  </tr>
                  <tr className="table-light">
                    <th></th>
                    {tahunList.map(t => (
                      <React.Fragment key={t}>
                        <th className="text-end text-primary small fw-normal">L</th>
                        <th className="text-end text-danger small fw-normal">P</th>
                        <th className="text-end fw-semibold small">Total</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {semuaKelompok.map(ku => (
                    <tr key={ku}>
                      <td className="fw-semibold">{ku}</td>
                      {tahunList.map(t => {
                        const row = rawData.find(d => d.tahun === t && d.kelompok_umur === ku)
                        const lk = row ? (row.laki_laki ?? 0) : 0
                        const pr = row ? (row.perempuan ?? 0) : 0
                        return (
                          <React.Fragment key={t}>
                            <td className="text-end text-primary">{row ? lk.toLocaleString('id-ID') : '-'}</td>
                            <td className="text-end text-danger">{row ? pr.toLocaleString('id-ID') : '-'}</td>
                            <td className="text-end fw-semibold">{row ? (lk + pr).toLocaleString('id-ID') : '-'}</td>
                          </React.Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── TAB: Kecamatan ───────────────────────────────────────────────────────────
function TabKecamatan() {
  const [rawData,   setRawData]   = useState([])
  const [tahunList, setTahunList] = useState([])
  const [tahunSel,  setTahunSel]  = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [view,      setView]      = useState('chart')

  useEffect(() => {
    getPendudukKec()
      .then(r => {
        setRawData(r.data.data)
        const list = r.data.tahun_tersedia
        setTahunList(list)
        if (list.length) setTahunSel(list[list.length - 1])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />
  if (!rawData.length) return <Empty />

  const semuaKec  = [...new Set(rawData.map(d => d.kecamatan))].sort()
  const filtered  = tahunSel ? rawData.filter(d => d.tahun === tahunSel) : []
  const kecLabels = filtered.map(d => d.kecamatan)
  const kecLaki   = filtered.map(d => d.laki_laki ?? 0)
  const kecPr     = filtered.map(d => d.perempuan ?? 0)

  const barData = {
    labels: kecLabels,
    datasets: [
      { label: 'Laki-laki', data: kecLaki, backgroundColor: '#3b82f6', borderRadius: 4 },
      { label: 'Perempuan', data: kecPr,   backgroundColor: '#ec4899', borderRadius: 4 },
    ]
  }

  const lineData = {
    labels: tahunList,
    datasets: semuaKec.map((kec, i) => ({
      label: kec,
      data: tahunList.map(t => {
        const row = rawData.find(d => d.tahun === t && d.kecamatan === kec)
        return row ? (row.laki_laki ?? 0) + (row.perempuan ?? 0) : 0
      }),
      borderColor: COLORS[i % COLORS.length],
      backgroundColor: 'transparent',
      tension: 0.4,
      pointRadius: 4,
    }))
  }

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString('id-ID')} jiwa` } }
    },
    scales: { y: { ticks: { callback: v => v.toLocaleString('id-ID') } } }
  }

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 12 } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString('id-ID')} jiwa` } }
    },
    scales: { y: { ticks: { callback: v => v.toLocaleString('id-ID') } } }
  }

  const totalTahun = rawData.filter(d => d.tahun === tahunSel).reduce((s, d) => s + (d.laki_laki ?? 0) + (d.perempuan ?? 0), 0)

  return (
    <div>
      {/* Ringkasan tahun */}
      <div className="alert alert-success border-0 shadow-sm d-flex align-items-center gap-3 mb-4">
        <i className="bi bi-geo-alt-fill fs-4 flex-shrink-0"></i>
        <div className="small">
          <strong>Total penduduk seluruh kecamatan ({tahunSel}):</strong>{' '}
          <span className="fw-bold">{totalTahun.toLocaleString('id-ID')} jiwa</span>
          {' '}— {semuaKec.length} kecamatan tercatat di Kabupaten Sijunjung
        </div>
      </div>

      {/* Filter + toggle */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div className="d-flex align-items-center gap-2">
          <label className="small fw-semibold text-muted mb-0">Tahun:</label>
          <div className="d-flex flex-wrap gap-1">
            {tahunList.map(t => (
              <button key={t}
                className={`btn btn-sm ${tahunSel === t ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setTahunSel(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="btn-group btn-group-sm">
          <button className={`btn ${view === 'chart' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('chart')}>
            <i className="bi bi-bar-chart me-1"></i>Grafik
          </button>
          <button className={`btn ${view === 'trend' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('trend')}>
            <i className="bi bi-graph-up me-1"></i>Tren
          </button>
          <button className={`btn ${view === 'table' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setView('table')}>
            <i className="bi bi-table me-1"></i>Tabel
          </button>
        </div>
      </div>

      {view === 'chart' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Penduduk per Kecamatan — Tahun {tahunSel}</h6>
            <div style={{ height: 340 }}>
              <Bar data={barData} options={barOpts} />
            </div>
          </div>
        </div>
      )}

      {view === 'trend' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">Tren Penduduk per Kecamatan dari Tahun ke Tahun</h6>
            <div style={{ height: 380 }}>
              <Line data={lineData} options={lineOpts} />
            </div>
          </div>
        </div>
      )}

      {view === 'table' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Kecamatan</th>
                    {tahunList.map(t => (
                      <th key={t} className="text-end" colSpan={3}>{t}</th>
                    ))}
                  </tr>
                  <tr className="table-light">
                    <th></th>
                    {tahunList.map(t => (
                      <React.Fragment key={t}>
                        <th className="text-end text-primary small fw-normal">L</th>
                        <th className="text-end text-danger small fw-normal">P</th>
                        <th className="text-end fw-semibold small">Total</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {semuaKec.map(kec => (
                    <tr key={kec}>
                      <td className="fw-semibold">{kec}</td>
                      {tahunList.map(t => {
                        const row = rawData.find(d => d.tahun === t && d.kecamatan === kec)
                        const lk = row ? (row.laki_laki ?? 0) : 0
                        const pr = row ? (row.perempuan ?? 0) : 0
                        return (
                          <React.Fragment key={t}>
                            <td className="text-end text-primary">{row ? lk.toLocaleString('id-ID') : '-'}</td>
                            <td className="text-end text-danger">{row ? pr.toLocaleString('id-ID') : '-'}</td>
                            <td className="text-end fw-semibold">{row ? (lk + pr).toLocaleString('id-ID') : '-'}</td>
                          </React.Fragment>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td>Total</td>
                    {tahunList.map(t => {
                      const rows = rawData.filter(d => d.tahun === t)
                      const lk = rows.reduce((s, d) => s + (d.laki_laki ?? 0), 0)
                      const pr = rows.reduce((s, d) => s + (d.perempuan ?? 0), 0)
                      return (
                        <React.Fragment key={t}>
                          <td className="text-end text-primary">{lk.toLocaleString('id-ID')}</td>
                          <td className="text-end text-danger">{pr.toLocaleString('id-ID')}</td>
                          <td className="text-end">{(lk + pr).toLocaleString('id-ID')}</td>
                        </React.Fragment>
                      )
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'jk',    label: 'Jenis Kelamin', icon: 'bi-gender-ambiguous' },
  { key: 'umur',  label: 'Kelompok Umur', icon: 'bi-person-lines-fill' },
  { key: 'kec',   label: 'Kecamatan',     icon: 'bi-geo-alt-fill' },
]

export default function ViewerPenduduk() {
  const [activeTab, setActiveTab] = useState('jk')

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-people-fill text-success"></i>
          Data Penduduk Kabupaten Sijunjung
        </h4>
        <p className="text-muted small mb-0 mt-1">
          Statistik kependudukan dari tahun ke tahun — berdasarkan jenis kelamin, kelompok umur, dan kecamatan
        </p>
      </div>

      {/* Tab navigation */}
      <ul className="nav nav-tabs mb-4">
        {TABS.map(tab => (
          <li key={tab.key} className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 ${activeTab === tab.key ? 'active fw-semibold' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab content */}
      <div>
        {activeTab === 'jk'   && <TabJenisKelamin />}
        {activeTab === 'umur' && <TabKelompokUmur />}
        {activeTab === 'kec'  && <TabKecamatan />}
      </div>
    </div>
  )
}
