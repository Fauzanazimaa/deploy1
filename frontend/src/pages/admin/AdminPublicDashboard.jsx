import React, { useEffect, useState, useCallback } from 'react'
import {
  getAdminWidgets, createWidget, updateWidget, deleteWidget,
  toggleWidgetVisibility, previewWidget, getDataTypes
} from '../../api'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Title, Filler
)

const ACCENT = '#f5a623'
const CHART_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7',
]

const CHART_TYPE_LABELS = {
  bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart',
  doughnut: 'Donut Chart', area: 'Area Chart', number: 'KPI Card', table: 'Tabel'
}

const CHART_TYPE_ICONS = {
  bar: 'bi-bar-chart-fill', line: 'bi-graph-up', pie: 'bi-pie-chart-fill',
  doughnut: 'bi-circle-half', area: 'bi-bar-chart-steps', number: 'bi-123', table: 'bi-table'
}

const CATEGORY_OPTIONS = ['Umum','Penduduk','Ekonomi','Kemiskinan','IPM','Tenaga Kerja','Infrastruktur','Lingkungan']

function PreviewChart({ widget, chartData }) {
  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px 0', fontSize: 13 }}>Tidak ada data untuk ditampilkan</div>
  }

  const data = {
    labels: chartData.labels,
    datasets: [{
      label: widget.title,
      data: chartData.values,
      backgroundColor: widget.chart_type === 'pie' || widget.chart_type === 'doughnut'
        ? CHART_COLORS : CHART_COLORS[0]+'dd',
      borderColor: CHART_COLORS[0],
      borderWidth: 2,
      fill: widget.chart_type === 'area',
      tension: 0.4,
    }]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 11 } } } }
  }

  const chartHeight = 260

  switch (widget.chart_type) {
    case 'bar': return <div style={{ height: chartHeight }}><Bar data={data} options={options} /></div>
    case 'line':
    case 'area': return <div style={{ height: chartHeight }}><Line data={data} options={options} /></div>
    case 'pie': return <div style={{ height: chartHeight }}><Pie data={data} options={options} /></div>
    case 'doughnut': return <div style={{ height: chartHeight }}><Doughnut data={data} options={options} /></div>
    case 'number':
      const total = chartData.values.reduce((a, b) => a + b, 0)
      return (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: ACCENT, lineHeight: 1 }}>{total.toLocaleString('id-ID')}</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>{widget.description || 'Total'}</div>
        </div>
      )
    case 'table':
      return (
        <div style={{ overflowX: 'auto', maxHeight: 200, border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#1a1f2e' }}>
                <th style={{ padding: '8px 12px', color: '#fff', fontWeight: 600 }}>Label</th>
                <th style={{ padding: '8px 12px', color: '#fff', fontWeight: 600, textAlign: 'right' }}>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {chartData.labels.map((lbl, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '7px 12px', color: '#374151' }}>{lbl}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontWeight: 600, color: '#1a1f2e' }}>{(chartData.values[i] || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default: return null
  }
}

const emptyForm = {
  title: '', description: '', category: 'Umum',
  data_type_id: '', data_source: 'both', chart_type: 'bar',
  label_field: '', value_field: '', is_visible: true,
  allow_download: true, sort_order: 0
}

export default function AdminPublicDashboard() {
  const [widgets, setWidgets] = useState([])
  const [dataTypes, setDataTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editWidget, setEditWidget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [previewData, setPreviewData] = useState({})
  const [previewLoading, setPreviewLoading] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')

  const fetchAll = useCallback(async () => {
    try {
      const [wRes, dtRes] = await Promise.all([getAdminWidgets(), getDataTypes()])
      setWidgets(wRes.data)
      setDataTypes(dtRes.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const loadPreview = useCallback(async (widgetId) => {
    setPreviewLoading(prev => ({ ...prev, [widgetId]: true }))
    try {
      const res = await previewWidget(widgetId)
      setPreviewData(prev => ({ ...prev, [widgetId]: res.data }))
    } catch (e) { console.error(e) }
    finally { setPreviewLoading(prev => ({ ...prev, [widgetId]: false })) }
  }, [])

  useEffect(() => {
    widgets.forEach(w => {
      if (w.data_type_id && !previewData[w.id]) loadPreview(w.id)
    })
  }, [widgets, loadPreview])

  const currentDT = dataTypes.find(dt => dt.id === parseInt(form.data_type_id))
  const fieldOptions = currentDT?.fields_schema?.map(f => f.name || f.label || '') || []

  const openCreate = () => {
    setEditWidget(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (w) => {
    setEditWidget(w)
    setForm({
      title: w.title, description: w.description || '',
      category: w.category || 'Umum', data_type_id: w.data_type_id || '',
      data_source: w.data_source || 'both', chart_type: w.chart_type || 'bar',
      label_field: w.label_field || '', value_field: w.value_field || '',
      is_visible: w.is_visible !== false, allow_download: w.allow_download !== false,
      sort_order: w.sort_order || 0
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, data_type_id: form.data_type_id ? parseInt(form.data_type_id) : null, sort_order: parseInt(form.sort_order) || 0 }
      if (editWidget) await updateWidget(editWidget.id, payload)
      else await createWidget(payload)
      setShowModal(false)
      setPreviewData({})
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const handleToggle = async (w) => {
    try {
      await toggleWidgetVisibility(w.id)
      fetchAll()
      setPreviewData(prev => { const n = {...prev}; delete n[w.id]; return n })
    } catch { alert('Gagal mengubah visibilitas') }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteWidget(deleteConfirm.id)
      setDeleteConfirm(null)
      fetchAll()
    } catch { alert('Gagal menghapus widget') }
    finally { setDeleting(false) }
  }

  const handleMoveOrder = async (w, dir) => {
    const newOrder = (w.sort_order || 0) + dir
    try {
      await updateWidget(w.id, { ...w, sort_order: newOrder })
      setPreviewData({})
      fetchAll()
    } catch { console.error('Gagal ubah urutan') }
  }

  const allCategories = [...new Set(widgets.map(w => w.category || 'Umum'))]
  const filtered = widgets.filter(w => filterCategory === 'all' || (w.category || 'Umum') === filterCategory)
  const visibleCount = widgets.filter(w => w.is_visible).length

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Dashboard Publik</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Kelola widget yang tampil di halaman publik — hanya data yang diverifikasi</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/" target="_blank" rel="noreferrer"
            style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            <i className="bi bi-box-arrow-up-right"></i> Lihat Publik
          </a>
          <button onClick={openCreate}
            style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Inter',sans-serif" }}>
            <i className="bi bi-plus-lg"></i> Tambah Widget
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Widget', value: widgets.length, color: '#3b82f6', icon: 'bi-grid-3x3-gap-fill' },
          { label: 'Ditampilkan', value: visibleCount, color: '#10b981', icon: 'bi-eye-fill' },
          { label: 'Disembunyikan', value: widgets.length - visibleCount, color: '#9ca3af', icon: 'bi-eye-slash-fill' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px 18px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`bi ${s.icon}`} style={{ color: s.color, fontSize: 16 }}></i>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#92400e', maxWidth: 420 }}>
          <i className="bi bi-info-circle-fill" style={{ color: ACCENT, fontSize: 15, flexShrink: 0 }}></i>
          Widget yang diaktifkan akan tampil di landing page publik. Hanya data <strong>verified/approved</strong> yang digunakan.
        </div>
      </div>

      {/* Category filter */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '14px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginRight: 4 }}>Filter:</span>
        {['all', ...allCategories].map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            style={{ background: filterCategory === cat ? ACCENT : '#f3f4f6', border: `1px solid ${filterCategory === cat ? ACCENT : '#e5e7eb'}`, color: filterCategory === cat ? '#fff' : '#374151', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
            {cat === 'all' ? 'Semua' : cat}
          </button>
        ))}
      </div>

      {/* Widget grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '60px 0' }}>
          <i className="bi bi-layout-text-window-reverse" style={{ fontSize: 48, color: '#d1d5db', display: 'block', marginBottom: 16 }}></i>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 20px', fontWeight: 500 }}>Belum ada widget dashboard publik</p>
          <button onClick={openCreate} style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
            <i className="bi bi-plus-lg me-2"></i>Buat Widget Pertama
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map((w) => {
            const pd = previewData[w.id]
            const isLoading = previewLoading[w.id]
            return (
              <div className="col-md-6 col-xl-4" key={w.id}>
                <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${w.is_visible ? '#e5e7eb' : '#f0f0f0'}`, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden', opacity: w.is_visible ? 1 : 0.65, transition: 'all .2s' }}>
                  {/* Card header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: ACCENT + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`bi ${CHART_TYPE_ICONS[w.chart_type] || 'bi-bar-chart-fill'}`} style={{ color: ACCENT, fontSize: 15 }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1f2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.title}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{w.category || 'Umum'}</span>
                        <span style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{CHART_TYPE_LABELS[w.chart_type] || w.chart_type}</span>
                        {w.data_type_name && <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{w.data_type_name}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => handleMoveOrder(w, -1)} title="Naikkan urutan" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', color: '#6b7280', fontSize: 12 }}><i className="bi bi-chevron-up"></i></button>
                      <button onClick={() => handleMoveOrder(w, 1)} title="Turunkan urutan" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 6px', cursor: 'pointer', color: '#6b7280', fontSize: 12 }}><i className="bi bi-chevron-down"></i></button>
                    </div>
                  </div>

                  {/* Chart preview */}
                  <div style={{ padding: '16px', minHeight: 140 }}>
                    {isLoading ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ width: 24, height: 24, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} />
                      </div>
                    ) : pd ? (
                      <PreviewChart widget={w} chartData={pd.chart_data} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0', fontSize: 12 }}>
                        <i className="bi bi-database" style={{ fontSize: 28, display: 'block', marginBottom: 8, opacity: 0.4 }}></i>
                        {w.data_type_id ? 'Tidak ada data verified' : 'Belum ada sumber data'}
                      </div>
                    )}
                  </div>

                  {/* Card footer */}
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => handleToggle(w)} title={w.is_visible ? 'Sembunyikan dari publik' : 'Tampilkan ke publik'}
                        style={{ background: w.is_visible ? '#f0fdf4' : '#f3f4f6', border: `1px solid ${w.is_visible ? '#bbf7d0' : '#e5e7eb'}`, color: w.is_visible ? '#16a34a' : '#6b7280', borderRadius: 20, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                        <i className={`bi ${w.is_visible ? 'bi-eye-fill' : 'bi-eye-slash'}`}></i>
                        {w.is_visible ? 'Aktif' : 'Nonaktif'}
                      </button>
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>#{w.sort_order}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => loadPreview(w.id)} title="Refresh preview" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}><i className="bi bi-arrow-clockwise"></i></button>
                      <button onClick={() => openEdit(w)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}><i className="bi bi-pencil"></i></button>
                      <button onClick={() => setDeleteConfirm(w)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── Create/Edit Modal ─── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>{editWidget ? 'Edit Widget' : 'Tambah Widget Baru'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleSave} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>{error}</div>}

                {/* Judul & Kategori */}
                <div className="row g-3">
                  <div className="col-8">
                    <label style={lbl}>JUDUL WIDGET <span style={{ color: '#dc2626' }}>*</span></label>
                    <input style={inp} value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="contoh: Jumlah Penduduk 2024" />
                  </div>
                  <div className="col-4">
                    <label style={lbl}>URUTAN</label>
                    <input type="number" style={inp} value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} min="0" />
                  </div>
                </div>

                <div>
                  <label style={lbl}>DESKRIPSI</label>
                  <textarea style={{...inp, resize: 'vertical'}} rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Keterangan singkat widget ini..." />
                </div>

                {/* Kategori & Chart type */}
                <div className="row g-3">
                  <div className="col-6">
                    <label style={lbl}>KATEGORI</label>
                    <select className="form-select" style={{ fontSize: 13 }} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label style={lbl}>JENIS VISUALISASI</label>
                    <select className="form-select" style={{ fontSize: 13 }} value={form.chart_type} onChange={e => setForm({...form, chart_type: e.target.value})}>
                      {Object.entries(CHART_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sumber data */}
                <div className="row g-3">
                  <div className="col-6">
                    <label style={lbl}>JENIS DATA (sumber)</label>
                    <select className="form-select" style={{ fontSize: 13 }} value={form.data_type_id} onChange={e => setForm({...form, data_type_id: e.target.value, label_field: '', value_field: ''})}>
                      <option value="">— Pilih jenis data —</option>
                      {dataTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label style={lbl}>SUMBER DATA</label>
                    <select className="form-select" style={{ fontSize: 13 }} value={form.data_source} onChange={e => setForm({...form, data_source: e.target.value})}>
                      <option value="both">Entri Manual + Approved</option>
                      <option value="manual">Hanya Entri Manual</option>
                      <option value="approved_submissions">Hanya Approved Submission</option>
                    </select>
                  </div>
                </div>

                {/* Label & Value field */}
                {form.data_type_id && (
                  <div className="row g-3">
                    <div className="col-6">
                      <label style={lbl}>FIELD LABEL (sumbu X / kategori)</label>
                      <select className="form-select" style={{ fontSize: 13 }} value={form.label_field} onChange={e => setForm({...form, label_field: e.target.value})}>
                        <option value="">— Pilih field —</option>
                        {fieldOptions.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Field yang jadi label/kategori</div>
                    </div>
                    <div className="col-6">
                      <label style={lbl}>FIELD NILAI (sumbu Y / angka)</label>
                      <select className="form-select" style={{ fontSize: 13 }} value={form.value_field} onChange={e => setForm({...form, value_field: e.target.value})}>
                        <option value="">— Hitung frekuensi —</option>
                        {fieldOptions.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Kosongkan untuk menghitung jumlah data</div>
                    </div>
                  </div>
                )}

                {/* Opsi lanjutan */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_visible} onChange={e => setForm({...form, is_visible: e.target.checked})} style={{ width: 15, height: 15 }} />
                    <span>Tampilkan di halaman publik</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.allow_download} onChange={e => setForm({...form, allow_download: e.target.checked})} style={{ width: 15, height: 15 }} />
                    <span>Izinkan download</span>
                  </label>
                </div>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", opacity: saving ? 0.8 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> Menyimpan...</> : <><i className="bi bi-check2"></i> Simpan Widget</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete confirm modal ─── */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', width: '100%', maxWidth: 420, overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="bi bi-trash" style={{ color: '#dc2626', fontSize: 18 }}></i>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>Hapus Widget</span>
              <button onClick={() => setDeleteConfirm(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>Widget <strong>"{deleteConfirm.title}"</strong> akan dihapus dari dashboard publik. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
              <button onClick={handleDelete} disabled={deleting} style={{ background: '#dc2626', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6, opacity: deleting ? 0.8 : 1 }}>
                {deleting ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> Menghapus...</> : <><i className="bi bi-trash"></i> Ya, Hapus</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const lbl = { fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }
const inp = { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#fff' }
