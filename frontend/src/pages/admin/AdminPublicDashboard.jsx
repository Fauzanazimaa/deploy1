import React, { useEffect, useState, useCallback, useRef, Component } from 'react'
import {
  getAdminWidgets, createWidget, updateWidget, deleteWidget,
  toggleWidgetVisibility, previewWidget, getDataTypeSchema,
  getVerifiedDataTypes
} from '../../api'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Title, Filler)

const ACCENT = '#f5a623'
const CHART_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#ec4899','#14b8a6','#a855f7',
]
const CHART_TYPES = [
  { value: 'table',    label: 'Tabel',       icon: 'bi-table',            desc: 'Semua dimensi & nilai dalam baris-kolom' },
  { value: 'bar',      label: 'Bar Chart',   icon: 'bi-bar-chart-fill',   desc: 'Perbandingan nilai antar kategori' },
  { value: 'line',     label: 'Line Chart',  icon: 'bi-graph-up',         desc: 'Tren data dari waktu ke waktu' },
  { value: 'area',     label: 'Area Chart',  icon: 'bi-bar-chart-steps',  desc: 'Seperti Line, dengan area terisi' },
  { value: 'pie',      label: 'Pie Chart',   icon: 'bi-pie-chart-fill',   desc: 'Proporsi bagian dari keseluruhan' },
  { value: 'doughnut', label: 'Donut Chart', icon: 'bi-circle-half',      desc: 'Variasi Pie dengan ruang tengah' },
  { value: 'number',   label: 'KPI Card',    icon: 'bi-123',              desc: 'Satu angka ringkasan penting' },
]
const CHART_TYPE_LABELS = Object.fromEntries(CHART_TYPES.map(c => [c.value, c.label]))
const CHART_TYPE_ICONS  = Object.fromEntries(CHART_TYPES.map(c => [c.value, c.icon]))
const CATEGORY_OPTIONS  = ['Umum','Penduduk','Ekonomi','Kemiskinan','IPM','Tenaga Kerja','Infrastruktur','Lingkungan','Pertanian','Kesehatan']
const STEPS = ['Info Dasar', 'Pilih Tabel', 'Susun Data', 'Visualisasi']

const lbl = { fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }
const inp = { width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter',sans-serif", background: '#fff' }

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(e) { return { err: e } }
  render() {
    if (this.state.err) return (
      <div style={{ padding: 24, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', fontFamily: "'Inter',sans-serif" }}>
        <b style={{ color: '#dc2626' }}><i className="bi bi-exclamation-triangle-fill me-2"></i>Error pada komponen</b>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{String(this.state.err?.message || '')}</div>
        <button onClick={() => this.setState({ err: null })} style={{ marginTop: 10, background: ACCENT, border: 'none', color: '#fff', borderRadius: 7, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Coba Lagi</button>
      </div>
    )
    return this.props.children
  }
}

// ── PreviewChart ──────────────────────────────────────────────────────────────
function PreviewChart({ widget, chartData }) {
  if (!chartData) return null
  const { labels = [], values = [], series = [] } = chartData
  const hasData = labels.length > 0 && (values.length > 0 || series.length > 0)
  if (!hasData) return (
    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: 12 }}>
      <i className="bi bi-bar-chart" style={{ fontSize: 28, display: 'block', marginBottom: 6, opacity: 0.3 }}></i>
      Belum ada data tersedia
    </div>
  )
  const isGrouped = series.length > 0
  const datasets = isGrouped
    ? series.map((s, i) => ({ label: s.name, data: s.data, backgroundColor: CHART_COLORS[i % CHART_COLORS.length]+'bb', borderColor: CHART_COLORS[i % CHART_COLORS.length], borderWidth: 2, fill: false, tension: 0.4 }))
    : [{ label: widget.title, data: values, backgroundColor: (widget.chart_type==='pie'||widget.chart_type==='doughnut') ? CHART_COLORS.slice(0,labels.length) : CHART_COLORS[0]+'cc', borderColor: CHART_COLORS[0], borderWidth: 2, fill: widget.chart_type==='area', tension: 0.4 }]
  const data = { labels, datasets }
  const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 10 }, padding: 10, boxWidth: 10 } } }, scales: (widget.chart_type==='pie'||widget.chart_type==='doughnut') ? {} : { y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: v => Number(v).toLocaleString('id-ID') } }, x: { ticks: { font: { size: 10 } } } } }
  const h = 220
  switch (widget.chart_type) {
    case 'bar':      return <div style={{height:h}}><Bar data={data} options={opts}/></div>
    case 'line': case 'area': return <div style={{height:h}}><Line data={data} options={opts}/></div>
    case 'pie':      return <div style={{height:h}}><Pie data={data} options={opts}/></div>
    case 'doughnut': return <div style={{height:h}}><Doughnut data={data} options={opts}/></div>
    case 'number': {
      const total = values.reduce((a,b)=>a+b,0)
      return <div style={{textAlign:'center',padding:'16px 0'}}><div style={{fontSize:48,fontWeight:800,color:ACCENT,lineHeight:1}}>{total.toLocaleString('id-ID')}</div><div style={{color:'#6b7280',fontSize:12,marginTop:6}}>{widget.description||'Total'}</div></div>
    }
    case 'table': return (
      <div style={{overflowX:'auto',maxHeight:200,border:'1px solid #e5e7eb',borderRadius:8}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr style={{background:'#1a1f2e',position:'sticky',top:0}}><th style={{padding:'7px 10px',color:'#fff',textAlign:'left'}}>Label</th><th style={{padding:'7px 10px',color:'#fff',textAlign:'right'}}>Nilai</th></tr></thead>
          <tbody>{labels.map((l,i)=><tr key={i} style={{borderBottom:'1px solid #f0f0f0',background:i%2===0?'#fff':'#fafafa'}}><td style={{padding:'6px 10px',color:'#374151'}}>{l}</td><td style={{padding:'6px 10px',textAlign:'right',fontWeight:600}}>{(values[i]||0).toLocaleString('id-ID')}</td></tr>)}</tbody>
        </table>
      </div>
    )
    default: return null
  }
}

// ── Auto-suggest chart type berdasarkan susunan dimensi ──────────────────────
function suggestChartTypes(dims, measures) {
  const hasMeasure  = measures.length > 0
  const dimCount    = dims.length
  const hasTimeDim  = dims.some(d => d.type === 'time')
  const hasCatDim   = dims.some(d => d.type === 'category')

  const suggestions = []
  if (!hasMeasure && dimCount === 0) return []

  if (!hasMeasure) {
    // Hanya dimensi → hitung frekuensi
    suggestions.push({ value: 'bar',   score: 3, reason: 'Bar chart cocok untuk menghitung frekuensi per kategori' })
    suggestions.push({ value: 'table', score: 2, reason: 'Tampilkan semua nilai dalam bentuk tabel' })
  } else if (dimCount === 0) {
    // Hanya measures → KPI
    suggestions.push({ value: 'number', score: 5, reason: 'Tampilkan total sebagai angka tunggal (KPI)' })
    suggestions.push({ value: 'table',  score: 2, reason: 'Tampilkan dalam tabel' })
  } else if (dimCount === 1 && hasTimeDim) {
    suggestions.push({ value: 'line',  score: 5, reason: 'Line chart ideal untuk tren satu dimensi waktu' })
    suggestions.push({ value: 'area',  score: 4, reason: 'Area chart untuk mempertegas besaran tren' })
    suggestions.push({ value: 'bar',   score: 3, reason: 'Bar chart untuk perbandingan per periode' })
    suggestions.push({ value: 'table', score: 2, reason: 'Tampilkan dalam tabel' })
  } else if (dimCount === 1 && hasCatDim) {
    suggestions.push({ value: 'bar',      score: 5, reason: 'Bar chart untuk perbandingan antar kategori' })
    suggestions.push({ value: 'pie',      score: 3, reason: 'Pie chart untuk melihat proporsi (≤10 kategori)' })
    suggestions.push({ value: 'doughnut', score: 3, reason: 'Donut chart sebagai variasi Pie' })
    suggestions.push({ value: 'table',    score: 2, reason: 'Tampilkan dalam tabel' })
  } else if (dimCount === 2) {
    // 2 dimensi → multi-series
    suggestions.push({ value: 'line',  score: hasTimeDim ? 5 : 3, reason: hasTimeDim ? 'Multi-series line chart untuk tren per kategori' : 'Grouped line chart' })
    suggestions.push({ value: 'bar',   score: 4, reason: 'Grouped bar chart untuk perbandingan 2 dimensi' })
    suggestions.push({ value: 'area',  score: hasTimeDim ? 4 : 2, reason: 'Stacked area untuk melihat komposisi per waktu' })
    suggestions.push({ value: 'table', score: 3, reason: 'Tabel crosstab untuk melihat semua kombinasi' })
  } else {
    // 3+ dimensi → tabel lebih cocok
    suggestions.push({ value: 'table', score: 5, reason: 'Tabel pivot cocok untuk 3+ dimensi' })
    suggestions.push({ value: 'bar',   score: 3, reason: 'Bar chart (gunakan filter untuk membatasi data)' })
    suggestions.push({ value: 'line',  score: hasTimeDim ? 3 : 2, reason: 'Line chart multi-series' })
  }

  return suggestions.sort((a, b) => b.score - a.score)
}

// ── Derive widget config dari susunan dims/measures ──────────────────────────
function deriveWidgetConfig(dims, measures, chartType) {
  // Dari susunan dimensi, tentukan label_field, value_field, series_field
  // Aturan:
  //   - dims[0] → label_field (X-Axis atau kategori utama)
  //   - dims[1] → series_field (grouping/series)
  //   - measures[0] → value_field
  const label_field  = dims[0]?.name  || ''
  const series_field = dims[1]?.name  || ''
  const value_field  = measures[0]?.name || '_value'
  return { label_field, value_field, series_field }
}

// ── WidgetModal ───────────────────────────────────────────────────────────────
function WidgetModal({ editWidget, dataTypes, onClose, onSaved }) {
  const [step,          setStep]          = useState(0)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [schema,        setSchema]        = useState(null)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [showAdvanced,  setShowAdvanced]  = useState(false)

  // Slot susunan data
  const [selectedDims,     setSelectedDims]     = useState([])  // [{name, label, type}]
  const [selectedMeasures, setSelectedMeasures] = useState([])  // [{name, label}]
  const [filters,          setFilters]          = useState([])  // [{dim, op, value}]

  // Visualisasi
  const [chartType, setChartType] = useState(editWidget?.chart_type || '')

  // Advanced override
  const [advLabel,  setAdvLabel]  = useState(editWidget?.label_field  || '')
  const [advValue,  setAdvValue]  = useState(editWidget?.value_field  || '')
  const [advSeries, setAdvSeries] = useState(editWidget?.series_field || '')

  // Form info dasar
  const [form, setForm] = useState({
    title:          editWidget?.title       || '',
    description:    editWidget?.description || '',
    category:       editWidget?.category    || 'Umum',
    sort_order:     editWidget?.sort_order  ?? 0,
    data_type_id:   editWidget?.data_type_id || '',
    is_visible:     editWidget?.is_visible  !== false,
    allow_download: editWidget?.allow_download !== false,
  })
  const patchForm = p => setForm(f => ({ ...f, ...p }))

  // Load schema saat data_type berubah
  useEffect(() => {
    if (!form.data_type_id) { setSchema(null); return }
    setSchemaLoading(true)
    setSchema(null)
    getDataTypeSchema(Number(form.data_type_id))
      .then(r => {
        setSchema(r.data)
        // Jika edit widget, re-populate dims/measures dari konfigurasi lama
        if (editWidget && editWidget.data_type_id === Number(form.data_type_id)) {
          const dims = r.data?.dimensions || []
          const lf = editWidget.label_field
          const vf = editWidget.value_field
          const sf = editWidget.series_field
          if (lf) {
            const d = dims.find(d => d.name === lf)
            if (d) setSelectedDims([d, ...(sf ? [dims.find(d => d.name === sf)].filter(Boolean) : [])])
          }
          if (vf) {
            const m = dims.find(d => d.name === vf)
            if (m) setSelectedMeasures([m])
          }
        }
      })
      .catch(() => setSchema({ schema_type: 'empty', dimensions: [], total_rows: 0, tidy_count: 0 }))
      .finally(() => setSchemaLoading(false))
  }, [form.data_type_id]) // eslint-disable-line

  const allDims     = (schema?.dimensions || []).filter(d => d.type !== 'numeric')
  const allMeasures = (schema?.dimensions || []).filter(d => d.type === 'numeric')

  const suggestions   = suggestChartTypes(selectedDims, selectedMeasures)
  const bestChart     = chartType || suggestions[0]?.value || 'table'
  const derivedConfig = deriveWidgetConfig(selectedDims, selectedMeasures, bestChart)

  // Saat chartType belum dipilih, auto-set ke saran terbaik
  useEffect(() => {
    if (!chartType && suggestions.length > 0) {
      setChartType(suggestions[0].value)
    }
  }, [selectedDims.length, selectedMeasures.length]) // eslint-disable-line

  const toggleDim = (dim) => {
    setSelectedDims(prev => {
      const exists = prev.find(d => d.name === dim.name)
      if (exists) return prev.filter(d => d.name !== dim.name)
      return [...prev, dim]
    })
    setChartType('')  // reset chart suggestion
  }

  const toggleMeasure = (m) => {
    setSelectedMeasures(prev => {
      const exists = prev.find(d => d.name === m.name)
      if (exists) return prev.filter(d => d.name !== m.name)
      // Untuk KPI hanya 1 measure; untuk lainnya boleh lebih (gunakan pertama)
      return [m]  // untuk sekarang hanya 1 measure aktif
    })
  }

  const addFilter = () => setFilters(f => [...f, { dim: '', op: '=', value: '' }])
  const removeFilter = (i) => setFilters(f => f.filter((_, idx) => idx !== i))
  const patchFilter = (i, patch) => setFilters(f => f.map((fi, idx) => idx === i ? { ...fi, ...patch } : fi))

  const canNext = () => {
    if (step === 0) return form.title.trim() !== ''
    if (step === 1) return !!form.data_type_id
    if (step === 2) return selectedDims.length > 0 || selectedMeasures.length > 0
    return true
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Judul wajib diisi'); setStep(0); return }
    setSaving(true); setError('')

    const finalLabel  = showAdvanced ? advLabel  : derivedConfig.label_field
    const finalValue  = showAdvanced ? advValue  : derivedConfig.value_field
    const finalSeries = showAdvanced ? advSeries : derivedConfig.series_field

    // Simpan filter sebagai viz_config
    const viz_config = filters.length > 0 ? { filters } : {}

    try {
      const payload = {
        title:          form.title,
        description:    form.description,
        category:       form.category,
        sort_order:     Number(form.sort_order) || 0,
        data_type_id:   form.data_type_id ? Number(form.data_type_id) : null,
        data_source:    'both',
        chart_type:     bestChart,
        label_field:    finalLabel,
        value_field:    finalValue,
        series_field:   finalSeries,
        viz_config,
        is_visible:     form.is_visible,
        allow_download: form.allow_download,
      }
      if (editWidget) await updateWidget(editWidget.id, payload)
      else await createWidget(payload)
      onSaved()
    } catch (e) {
      setError(e?.response?.data?.error || 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const stepBg   = (i) => i < step ? '#10b981' : i === step ? ACCENT : '#e5e7eb'
  const stepColor= (i) => i <= step ? '#fff' : '#9ca3af'

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1050, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,0.22)', width:'100%', maxWidth:700, maxHeight:'95vh', display:'flex', flexDirection:'column', fontFamily:"'Inter',sans-serif" }}>

        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:ACCENT+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="bi bi-bar-chart-line-fill" style={{ color:ACCENT, fontSize:14 }}></i>
            </div>
            <span style={{ fontWeight:700, fontSize:15, color:'#1a1f2e' }}>{editWidget ? 'Edit Widget' : 'Buat Widget Baru'}</span>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:20 }}><i className="bi bi-x"></i></button>
        </div>

        {/* Step indicator */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid #f5f5f5', display:'flex', alignItems:'center', gap:0, flexShrink:0 }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display:'flex', alignItems:'center', gap:6, cursor: i<step?'pointer':'default' }} onClick={() => i<step && setStep(i)}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:stepBg(i), color:stepColor(i), display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, transition:'background .2s' }}>
                  {i < step ? <i className="bi bi-check" style={{fontSize:12}}></i> : i+1}
                </div>
                <span style={{ fontSize:11, fontWeight: i===step?700:500, color: i===step?'#1a1f2e': i<step?'#10b981':'#9ca3af', whiteSpace:'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length-1 && <div style={{ flex:1, height:2, background: i<step?'#10b981':'#f3f4f6', margin:'0 8px', minWidth:12 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:8, padding:'8px 12px', fontSize:12, marginBottom:14 }}><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

          {/* Step 0: Info Dasar */}
          {step === 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="row g-3">
                <div className="col-8">
                  <label style={lbl}>JUDUL WIDGET <span style={{color:'#dc2626'}}>*</span></label>
                  <input style={inp} value={form.title} onChange={e=>patchForm({title:e.target.value})} placeholder="contoh: Luas Sawah per Kecamatan" autoFocus />
                </div>
                <div className="col-4">
                  <label style={lbl}>URUTAN</label>
                  <input type="number" style={inp} value={form.sort_order} onChange={e=>patchForm({sort_order:e.target.value})} min="0"/>
                </div>
              </div>
              <div>
                <label style={lbl}>DESKRIPSI</label>
                <textarea style={{...inp,resize:'vertical'}} rows={2} value={form.description} onChange={e=>patchForm({description:e.target.value})} placeholder="Keterangan singkat..." />
              </div>
              <div>
                <label style={lbl}>KATEGORI</label>
                <select className="form-select" style={{fontSize:13}} value={form.category} onChange={e=>patchForm({category:e.target.value})}>
                  {CATEGORY_OPTIONS.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:20 }}>
                <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.is_visible} onChange={e=>patchForm({is_visible:e.target.checked})} style={{width:15,height:15}} /> Tampilkan di publik
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.allow_download} onChange={e=>patchForm({allow_download:e.target.checked})} style={{width:15,height:15}} /> Izinkan download
                </label>
              </div>
            </div>
          )}

          {/* Step 1: Pilih Tabel */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={lbl}>PILIH TABEL DATA TERVERIFIKASI <span style={{color:'#dc2626'}}>*</span></label>
                {dataTypes.length === 0 ? (
                  <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#92400e' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>Belum ada tabel dengan data terverifikasi.
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {dataTypes.map(dt => (
                      <label key={dt.id} style={{
                        display:'flex', alignItems:'flex-start', gap:12, cursor:'pointer',
                        background: Number(form.data_type_id)===dt.id ? '#eff6ff' : '#f8fafc',
                        border: `2px solid ${Number(form.data_type_id)===dt.id ? '#3b82f6' : '#e2e8f0'}`,
                        borderRadius:10, padding:'12px 14px', transition:'all .15s'
                      }}>
                        <input type="radio" name="data_type" value={dt.id} checked={Number(form.data_type_id)===dt.id}
                          onChange={() => {
                            patchForm({ data_type_id: dt.id })
                            setSelectedDims([]); setSelectedMeasures([]); setFilters([]); setChartType('')
                          }}
                          style={{width:15,height:15,marginTop:2,flexShrink:0}} />
                        <div>
                          <div style={{ fontWeight:700, fontSize:13, color:'#1a1f2e' }}>{dt.name}</div>
                          <div style={{ fontSize:11, color:'#64748b', marginTop:2, display:'flex', gap:10 }}>
                            {dt.approved_count > 0 && <span><i className="bi bi-check-circle-fill me-1" style={{color:'#10b981'}}></i>{dt.approved_count} submission diverifikasi</span>}
                            {dt.manual_count > 0  && <span><i className="bi bi-pencil-fill me-1" style={{color:ACCENT}}></i>{dt.manual_count} entri manual</span>}
                          </div>
                        </div>
                        {Number(form.data_type_id)===dt.id && (
                          <div style={{ marginLeft:'auto', flexShrink:0 }}>
                            <i className="bi bi-check-circle-fill" style={{color:'#3b82f6', fontSize:18}}></i>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview struktur tabel */}
              {form.data_type_id && (
                <>
                  {schemaLoading && (
                    <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:8, color:'#0369a1', fontSize:13 }}>
                      <div style={{ width:16, height:16, border:'2.5px solid #bae6fd', borderTopColor:'#0ea5e9', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}></div>
                      Membaca struktur tabel dan melakukan transformasi data...
                    </div>
                  )}
                  {schema && !schemaLoading && (
                    <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#334155', marginBottom:8 }}>
                        <i className="bi bi-magic me-2" style={{color:'#8b5cf6'}}></i>
                        Dimensi Tersedia Setelah Transformasi
                        <span style={{ fontWeight:400, color:'#94a3b8', marginLeft:8 }}>{schema.tidy_count || 0} baris terstruktur dari {schema.total_rows || 0} baris mentah</span>
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {(schema.dimensions || []).map((d, i) => {
                          const isTime = d.type === 'time'
                          const isNum  = d.type === 'numeric'
                          return (
                            <span key={i} style={{
                              background: isNum ? '#f0fdf4' : isTime ? '#eff6ff' : '#fef9c3',
                              border: `1px solid ${isNum ? '#bbf7d0' : isTime ? '#bfdbfe' : '#fde047'}`,
                              color: isNum ? '#15803d' : isTime ? '#1d4ed8' : '#a16207',
                              borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:600,
                              display:'flex', alignItems:'center', gap:4
                            }}>
                              <i className={`bi ${isNum ? 'bi-hash' : isTime ? 'bi-clock' : 'bi-tag'}`} style={{fontSize:9}}></i>
                              {d.label}
                              <span style={{fontWeight:400, opacity:0.7}}>({isNum?'Nilai':isTime?'Waktu':'Kategori'})</span>
                            </span>
                          )
                        })}
                      </div>
                      {schema.sample_tidy?.length > 0 && (
                        <div style={{ marginTop:8, fontSize:10, color:'#64748b', background:'#f1f5f9', borderRadius:6, padding:'6px 10px' }}>
                          <span style={{fontWeight:600}}>Contoh data: </span>
                          {Object.entries(schema.sample_tidy[0]).filter(([k])=>!k.startsWith('_')).slice(0,4).map(([k,v])=>`${k}: "${v}"`).join(' · ')}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 2: Susun Data */}
          {step === 2 && schema && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 12px', fontSize:12, color:'#92400e' }}>
                <i className="bi bi-lightbulb me-1"></i>
                Pilih dimensi dan nilai yang ingin ditampilkan. Sistem akan otomatis menyarankan jenis visualisasi terbaik.
              </div>

              <div className="row g-3">
                {/* Dimensi */}
                <div className="col-6">
                  <div style={{ border:'2px dashed #e2e8f0', borderRadius:10, padding:'12px', minHeight:120 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:20, height:20, borderRadius:5, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className="bi bi-layers" style={{color:'#3b82f6',fontSize:10}}></i>
                      </div>
                      DIMENSIONS
                      <span style={{fontWeight:400,color:'#9ca3af'}}>({selectedDims.length} dipilih)</span>
                    </div>
                    <div style={{ fontSize:10, color:'#9ca3af', marginBottom:8 }}>
                      Dimensi menentukan cara data dikelompokkan (X-Axis, Series, dll)
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {allDims.map((d, i) => {
                        const isSelected = selectedDims.some(s => s.name === d.name)
                        const isTime = d.type === 'time'
                        return (
                          <button key={i} type="button" onClick={() => toggleDim(d)}
                            style={{
                              display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                              background: isSelected ? (isTime?'#eff6ff':'#fef9c3') : '#f8fafc',
                              border: `1.5px solid ${isSelected ? (isTime?'#3b82f6':'#f59e0b') : '#e2e8f0'}`,
                              borderRadius:8, cursor:'pointer', textAlign:'left',
                              fontFamily:"'Inter',sans-serif", transition:'all .12s'
                            }}>
                            <i className={`bi ${isTime ? 'bi-clock' : 'bi-tag'}`} style={{ color: isSelected?(isTime?'#3b82f6':'#d97706'):'#9ca3af', fontSize:11, flexShrink:0 }}></i>
                            <span style={{ fontSize:12, color: isSelected?'#1a1f2e':'#374151', fontWeight: isSelected?700:400, flex:1 }}>{d.label}</span>
                            {isSelected ? (
                              <span style={{ background:'#10b981', color:'#fff', borderRadius:10, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <i className="bi bi-check" style={{fontSize:10}}></i>
                              </span>
                            ) : (
                              <span style={{ border:'1.5px solid #d1d5db', borderRadius:10, width:16, height:16, flexShrink:0 }}></span>
                            )}
                          </button>
                        )
                      })}
                      {allDims.length === 0 && <div style={{fontSize:11,color:'#9ca3af',textAlign:'center',padding:'8px 0'}}>Tidak ada dimensi</div>}
                    </div>
                    {/* Urutan dimensi terpilih */}
                    {selectedDims.length > 0 && (
                      <div style={{ marginTop:10, padding:'8px', background:'#f0f9ff', borderRadius:7, border:'1px solid #bae6fd' }}>
                        <div style={{ fontSize:10, color:'#0369a1', fontWeight:700, marginBottom:4 }}>URUTAN DIMENSI:</div>
                        {selectedDims.map((d, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#1e40af', marginBottom:2 }}>
                            <span style={{ background:'#3b82f6', color:'#fff', borderRadius:4, padding:'0 5px', fontSize:10, fontWeight:700 }}>{i+1}</span>
                            {d.label}
                            {i === 0 && <span style={{color:'#94a3b8'}}>(X-Axis)</span>}
                            {i === 1 && <span style={{color:'#94a3b8'}}>(Series)</span>}
                            {i > 1  && <span style={{color:'#94a3b8'}}>(Filter lanjutan)</span>}
                            <button type="button" onClick={() => toggleDim(d)} style={{marginLeft:'auto',background:'none',border:'none',color:'#9ca3af',cursor:'pointer',fontSize:11,padding:0}}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Measures */}
                <div className="col-6">
                  <div style={{ border:'2px dashed #e2e8f0', borderRadius:10, padding:'12px', minHeight:120 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:20, height:20, borderRadius:5, background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <i className="bi bi-hash" style={{color:'#10b981',fontSize:10}}></i>
                      </div>
                      MEASURE (NILAI)
                      <span style={{fontWeight:400,color:'#9ca3af'}}>({selectedMeasures.length} dipilih)</span>
                    </div>
                    <div style={{ fontSize:10, color:'#9ca3af', marginBottom:8 }}>
                      Nilai numerik yang akan ditampilkan atau dihitung
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {allMeasures.map((m, i) => {
                        const isSelected = selectedMeasures.some(s => s.name === m.name)
                        return (
                          <button key={i} type="button" onClick={() => toggleMeasure(m)}
                            style={{
                              display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                              background: isSelected ? '#f0fdf4' : '#f8fafc',
                              border: `1.5px solid ${isSelected ? '#10b981' : '#e2e8f0'}`,
                              borderRadius:8, cursor:'pointer', textAlign:'left',
                              fontFamily:"'Inter',sans-serif", transition:'all .12s'
                            }}>
                            <i className="bi bi-hash" style={{ color: isSelected?'#10b981':'#9ca3af', fontSize:11, flexShrink:0 }}></i>
                            <span style={{ fontSize:12, color: isSelected?'#1a1f2e':'#374151', fontWeight: isSelected?700:400, flex:1 }}>{m.label}</span>
                            {isSelected ? (
                              <span style={{ background:'#10b981', color:'#fff', borderRadius:10, width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <i className="bi bi-check" style={{fontSize:10}}></i>
                              </span>
                            ) : (
                              <span style={{ border:'1.5px solid #d1d5db', borderRadius:10, width:16, height:16, flexShrink:0 }}></span>
                            )}
                          </button>
                        )
                      })}
                      {allMeasures.length === 0 && <div style={{fontSize:11,color:'#9ca3af',textAlign:'center',padding:'8px 0'}}>Tidak ada nilai numerik</div>}
                    </div>
                  </div>

                  {/* Filters */}
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span><i className="bi bi-funnel me-1"></i>FILTER <span style={{fontWeight:400}}>(opsional)</span></span>
                      <button type="button" onClick={addFilter}
                        style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:6, padding:'2px 8px', fontSize:10, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                        + Tambah
                      </button>
                    </div>
                    {filters.map((f, i) => (
                      <div key={i} style={{ display:'flex', gap:4, marginBottom:5, alignItems:'center' }}>
                        <select className="form-select" style={{ fontSize:11, flex:2 }} value={f.dim} onChange={e=>patchFilter(i,{dim:e.target.value})}>
                          <option value="">Pilih dimensi</option>
                          {allDims.map(d=><option key={d.name} value={d.name}>{d.label}</option>)}
                        </select>
                        <select className="form-select" style={{ fontSize:11, flex:1 }} value={f.op} onChange={e=>patchFilter(i,{op:e.target.value})}>
                          <option value="=">=</option>
                          <option value="!=">≠</option>
                          <option value="contains">mengandung</option>
                        </select>
                        <input style={{...inp, flex:2, padding:'5px 8px', fontSize:11}} value={f.value} onChange={e=>patchFilter(i,{value:e.target.value})} placeholder="Nilai..." />
                        <button type="button" onClick={()=>removeFilter(i)} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:6, padding:'4px 6px', cursor:'pointer' }}>
                          <i className="bi bi-trash" style={{fontSize:11}}></i>
                        </button>
                      </div>
                    ))}
                    {filters.length === 0 && <div style={{fontSize:10,color:'#9ca3af'}}>Tidak ada filter — semua data akan ditampilkan</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Visualisasi */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Ringkasan konfigurasi */}
              <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#334155', marginBottom:6 }}>
                  <i className="bi bi-check2-circle me-2" style={{color:'#10b981'}}></i>Konfigurasi Data
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12 }}>
                  <div>
                    <span style={{color:'#9ca3af'}}>Tabel: </span>
                    <span style={{fontWeight:600,color:'#1e293b'}}>{dataTypes.find(d=>d.id===Number(form.data_type_id))?.name || '-'}</span>
                  </div>
                  <div>
                    <span style={{color:'#9ca3af'}}>Dimensi: </span>
                    <span style={{fontWeight:600,color:'#1e293b'}}>{selectedDims.map(d=>d.label).join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span style={{color:'#9ca3af'}}>Nilai: </span>
                    <span style={{fontWeight:600,color:'#1e293b'}}>{selectedMeasures.map(m=>m.label).join(', ') || '—'}</span>
                  </div>
                  {filters.length > 0 && (
                    <div>
                      <span style={{color:'#9ca3af'}}>Filter: </span>
                      <span style={{fontWeight:600,color:'#1e293b'}}>{filters.filter(f=>f.dim&&f.value).map(f=>`${f.dim} ${f.op} "${f.value}"`).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Saran chart */}
              {suggestions.length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:8 }}>
                    <i className="bi bi-stars me-1" style={{color:'#8b5cf6'}}></i>
                    SARAN VISUALISASI BERDASARKAN SUSUNAN DATA
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                    {suggestions.slice(0, 6).map((sg, i) => {
                      const ct  = CHART_TYPES.find(c => c.value === sg.value)
                      const isSel = bestChart === sg.value
                      return (
                        <button key={i} type="button" onClick={() => setChartType(sg.value)}
                          style={{
                            background: isSel ? ACCENT : '#f8fafc',
                            border: `2px solid ${isSel ? ACCENT : '#e2e8f0'}`,
                            borderRadius:10, padding:'10px 8px', cursor:'pointer',
                            display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                            fontFamily:"'Inter',sans-serif", transition:'all .15s', position:'relative'
                          }}>
                          {i === 0 && <span style={{ position:'absolute', top:4, right:4, background:'#8b5cf6', color:'#fff', borderRadius:8, padding:'1px 5px', fontSize:9, fontWeight:700 }}>✦ Terbaik</span>}
                          <i className={`bi ${ct?.icon || 'bi-bar-chart'}`} style={{ fontSize:22, color: isSel?'#fff':'#64748b' }}></i>
                          <span style={{ fontSize:11, fontWeight:700, color: isSel?'#fff':'#374151' }}>{ct?.label || sg.value}</span>
                          <span style={{ fontSize:9, color: isSel?'rgba(255,255,255,0.8)':'#9ca3af', textAlign:'center', lineHeight:1.3 }}>{sg.reason}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Semua chart types */}
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:8 }}>
                  SEMUA JENIS VISUALISASI
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                  {CHART_TYPES.map(ct => {
                    const isSel = bestChart === ct.value
                    return (
                      <button key={ct.value} type="button" onClick={() => setChartType(ct.value)}
                        style={{
                          background: isSel ? '#1a1f2e' : '#f8fafc',
                          border: `2px solid ${isSel ? '#1a1f2e' : '#e2e8f0'}`,
                          borderRadius:9, padding:'8px 6px', cursor:'pointer',
                          display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                          fontFamily:"'Inter',sans-serif", transition:'all .12s'
                        }}>
                        <i className={`bi ${ct.icon}`} style={{ fontSize:18, color: isSel?'#fff':'#64748b' }}></i>
                        <span style={{ fontSize:10, fontWeight:600, color: isSel?'#fff':'#374151' }}>{ct.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Pengaturan Lanjutan (collapsed by default) */}
              <div style={{ border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
                <button type="button" onClick={() => setShowAdvanced(v => !v)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f8fafc', border:'none', cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
                  <span style={{ fontSize:12, fontWeight:600, color:'#374151' }}>
                    <i className="bi bi-sliders me-2" style={{color:'#64748b'}}></i>Pengaturan Lanjutan (X-Axis / Y-Axis manual)
                  </span>
                  <i className={`bi ${showAdvanced ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{color:'#9ca3af'}}></i>
                </button>
                {showAdvanced && (
                  <div style={{ padding:'14px', background:'#fff' }}>
                    <div style={{ fontSize:11, color:'#9ca3af', marginBottom:10 }}>
                      Override otomatis. Hanya gunakan jika saran di atas tidak sesuai kebutuhan.
                    </div>
                    <div className="row g-3">
                      <div className="col-4">
                        <label style={lbl}>X-AXIS / LABEL</label>
                        <select className="form-select" style={{fontSize:12}} value={advLabel} onChange={e=>setAdvLabel(e.target.value)}>
                          <option value="">— Otomatis —</option>
                          {(schema?.dimensions||[]).map(d=><option key={d.name} value={d.name}>{d.label}</option>)}
                        </select>
                      </div>
                      <div className="col-4">
                        <label style={lbl}>Y-AXIS / NILAI</label>
                        <select className="form-select" style={{fontSize:12}} value={advValue} onChange={e=>setAdvValue(e.target.value)}>
                          <option value="">— Otomatis —</option>
                          {(schema?.dimensions||[]).map(d=><option key={d.name} value={d.name}>{d.label}</option>)}
                        </select>
                      </div>
                      <div className="col-4">
                        <label style={lbl}>SERIES</label>
                        <select className="form-select" style={{fontSize:12}} value={advSeries} onChange={e=>setAdvSeries(e.target.value)}>
                          <option value="">— Tidak ada —</option>
                          {(schema?.dimensions||[]).map(d=><option key={d.name} value={d.name}>{d.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', flexShrink:0, background:'#fafafa', borderRadius:'0 0 16px 16px' }}>
          <button onClick={() => step > 0 ? setStep(s=>s-1) : onClose()}
            style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', color:'#374151', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:5 }}>
            {step === 0 ? 'Batal' : <><i className="bi bi-chevron-left"></i>Kembali</>}
          </button>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {/* Indikator kemajuan */}
            <span style={{ fontSize:11, color:'#9ca3af' }}>Langkah {step+1} dari {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <button onClick={() => canNext() && setStep(s=>s+1)} disabled={!canNext()}
                style={{ background: canNext()?ACCENT:'#d1d5db', border:'none', color:'#fff', borderRadius:8, padding:'8px 20px', fontSize:13, fontWeight:600, cursor:canNext()?'pointer':'not-allowed', fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:5 }}>
                Lanjut <i className="bi bi-chevron-right"></i>
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                style={{ background:ACCENT, border:'none', color:'#fff', borderRadius:8, padding:'8px 22px', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', opacity:saving?0.8:1, fontFamily:"'Inter',sans-serif", display:'flex', alignItems:'center', gap:6 }}>
                {saving ? <><span className="spinner-border spinner-border-sm" style={{width:14,height:14,borderWidth:2}} /> Menyimpan...</> : <><i className="bi bi-check2"></i> Simpan Widget</>}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Main AdminPublicDashboard ─────────────────────────────────────────────────
function AdminPublicDashboard() {
  const [widgets,        setWidgets]        = useState([])
  const [dataTypes,      setDataTypes]      = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showModal,      setShowModal]      = useState(false)
  const [editWidget,     setEditWidget]     = useState(null)
  const [deleteConfirm,  setDeleteConfirm]  = useState(null)
  const [deleting,       setDeleting]       = useState(false)
  const [previewData,    setPreviewData]    = useState({})
  const [previewLoading, setPreviewLoading] = useState({})
  const [filterCategory, setFilterCategory] = useState('all')

  const fetchAll = useCallback(async () => {
    try {
      const [wRes, dtRes] = await Promise.all([getAdminWidgets(), getVerifiedDataTypes()])
      setWidgets(Array.isArray(wRes.data) ? wRes.data : [])
      setDataTypes(Array.isArray(dtRes.data) ? dtRes.data : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const loadPreview = useCallback(async (widgetId) => {
    setPreviewLoading(p => ({ ...p, [widgetId]: true }))
    try {
      const res = await previewWidget(widgetId)
      setPreviewData(p => ({ ...p, [widgetId]: res.data }))
    } catch { }
    finally { setPreviewLoading(p => ({ ...p, [widgetId]: false })) }
  }, [])

  useEffect(() => {
    widgets.forEach(w => { if (w.data_type_id && !previewData[w.id]) loadPreview(w.id) })
  }, [widgets]) // eslint-disable-line

  const handleToggle = async (w) => {
    try { await toggleWidgetVisibility(w.id); fetchAll(); setPreviewData(p => { const n={...p}; delete n[w.id]; return n }) }
    catch { alert('Gagal mengubah visibilitas') }
  }
  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try { await deleteWidget(deleteConfirm.id); setDeleteConfirm(null); fetchAll() }
    catch { alert('Gagal menghapus') }
    finally { setDeleting(false) }
  }
  const handleMoveOrder = async (w, dir) => {
    try { await updateWidget(w.id, { sort_order: (w.sort_order||0)+dir }); setPreviewData({}); fetchAll() }
    catch { console.error('Gagal ubah urutan') }
  }

  const allCategories = [...new Set(widgets.map(w => w.category || 'Umum'))]
  const filtered   = widgets.filter(w => filterCategory === 'all' || (w.category||'Umum') === filterCategory)
  const visibleCnt = widgets.filter(w => w.is_visible).length

  return (
    <div style={{ fontFamily:"'Inter',sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h4 style={{ fontWeight:700, fontSize:20, color:'#1a1f2e', margin:0 }}>Dashboard Publik</h4>
          <p style={{ color:'#6b7280', fontSize:13, margin:'4px 0 0' }}>Kelola widget visualisasi data yang ditampilkan ke publik</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <a href="/" target="_blank" rel="noreferrer"
            style={{ background:'#fff', border:'1px solid #e5e7eb', color:'#374151', borderRadius:8, padding:'7px 14px', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6, textDecoration:'none' }}>
            <i className="bi bi-box-arrow-up-right"></i> Lihat Publik
          </a>
          <button onClick={() => { setEditWidget(null); setShowModal(true) }}
            style={{ background:ACCENT, border:'none', color:'#fff', borderRadius:8, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7, fontFamily:"'Inter',sans-serif" }}>
            <i className="bi bi-plus-lg"></i> Buat Widget
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { label:'Total Widget',  value:widgets.length,             color:'#3b82f6', icon:'bi-grid-3x3-gap-fill' },
          { label:'Ditampilkan',   value:visibleCnt,                 color:'#10b981', icon:'bi-eye-fill' },
          { label:'Disembunyikan', value:widgets.length-visibleCnt,  color:'#9ca3af', icon:'bi-eye-slash-fill' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', borderRadius:10, padding:'12px 18px', border:'1px solid #f0f0f0', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:s.color+'18', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className={`bi ${s.icon}`} style={{ color:s.color, fontSize:16 }}></i>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:20, color:'#1a1f2e', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#6b7280', marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        ))}
        <div style={{ background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:10, padding:'12px 18px', display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#7c3aed' }}>
          <i className="bi bi-magic" style={{ fontSize:15 }}></i>
          <span>Pilih dimensi → sistem sarankan visualisasi terbaik secara otomatis</span>
        </div>
      </div>

      {/* Filter */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #f0f0f0', padding:'12px 18px', marginBottom:20, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ fontSize:12, color:'#6b7280', fontWeight:600 }}>Filter:</span>
        {['all', ...allCategories].map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            style={{ background:filterCategory===cat?ACCENT:'#f3f4f6', border:`1px solid ${filterCategory===cat?ACCENT:'#e5e7eb'}`, color:filterCategory===cat?'#fff':'#374151', borderRadius:20, padding:'4px 12px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
            {cat === 'all' ? 'Semua' : cat}
          </button>
        ))}
      </div>

      {/* Widget grid */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'48px 0' }}>
          <div style={{ width:36, height:36, border:`3px solid ${ACCENT}30`, borderTopColor:ACCENT, borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #f0f0f0', textAlign:'center', padding:'60px 0' }}>
          <i className="bi bi-layout-text-window-reverse" style={{ fontSize:48, color:'#d1d5db', display:'block', marginBottom:16 }}></i>
          <p style={{ color:'#6b7280', fontSize:14, margin:'0 0 20px', fontWeight:500 }}>Belum ada widget</p>
          <button onClick={() => { setEditWidget(null); setShowModal(true) }} style={{ background:ACCENT, border:'none', color:'#fff', borderRadius:8, padding:'10px 24px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>
            <i className="bi bi-plus-lg me-2"></i>Buat Widget Pertama
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(w => {
            const pd = previewData[w.id]
            const isLoading = previewLoading[w.id]
            const cd = pd?.chart_data
            const hasWarning = cd?.warning
            return (
              <div className="col-md-6 col-xl-4" key={w.id}>
                <div style={{ background:'#fff', borderRadius:12, border:`2px solid ${w.is_visible?'#e5e7eb':'#f0f0f0'}`, boxShadow:'0 1px 6px rgba(0,0,0,0.06)', overflow:'hidden', opacity:w.is_visible?1:0.65 }}>
                  <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'flex-start', gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:ACCENT+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <i className={`bi ${CHART_TYPE_ICONS[w.chart_type]||'bi-bar-chart-fill'}`} style={{ color:ACCENT, fontSize:15 }}></i>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:'#1a1f2e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.title}</div>
                      <div style={{ display:'flex', gap:5, marginTop:4, flexWrap:'wrap' }}>
                        <span style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', color:'#374151', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:600 }}>{w.category||'Umum'}</span>
                        <span style={{ background:'#eff6ff', border:'1px solid #bfdbfe', color:'#3b82f6', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:600 }}>{CHART_TYPE_LABELS[w.chart_type]||w.chart_type}</span>
                        {w.data_type_name && <span style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#16a34a', borderRadius:10, padding:'1px 7px', fontSize:10, fontWeight:600 }}>{w.data_type_name}</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                      <button onClick={() => handleMoveOrder(w,-1)} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:5, padding:'3px 5px', cursor:'pointer', color:'#6b7280', fontSize:11 }}><i className="bi bi-chevron-up"></i></button>
                      <button onClick={() => handleMoveOrder(w, 1)} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:5, padding:'3px 5px', cursor:'pointer', color:'#6b7280', fontSize:11 }}><i className="bi bi-chevron-down"></i></button>
                    </div>
                  </div>
                  <div style={{ padding:'14px', minHeight:120 }}>
                    {isLoading ? (
                      <div style={{ textAlign:'center', padding:'16px 0' }}>
                        <div style={{ width:22, height:22, border:`3px solid ${ACCENT}30`, borderTopColor:ACCENT, borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }} />
                      </div>
                    ) : hasWarning ? (
                      <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:8, padding:'8px 12px', fontSize:11, color:'#92400e' }}>
                        <i className="bi bi-exclamation-triangle me-1"></i>{cd.warning}
                        <div style={{ marginTop:6 }}>
                          <button onClick={() => { setEditWidget(w); setShowModal(true) }} style={{ background:'none', border:'none', color:'#d97706', textDecoration:'underline', cursor:'pointer', fontSize:11, fontFamily:"'Inter',sans-serif" }}>
                            Edit widget &rarr;
                          </button>
                        </div>
                      </div>
                    ) : cd ? (
                      <PreviewChart widget={w} chartData={cd} />
                    ) : (
                      <div style={{ textAlign:'center', color:'#9ca3af', padding:'16px 0', fontSize:12 }}>
                        <i className="bi bi-bar-chart" style={{ fontSize:26, display:'block', marginBottom:6, opacity:0.3 }}></i>
                        {w.data_type_id ? 'Belum ada data atau konfigurasi perlu diperbarui' : 'Belum ada sumber data'}
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'10px 16px', borderTop:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fafafa' }}>
                    <button onClick={() => handleToggle(w)}
                      style={{ background:w.is_visible?'#f0fdf4':'#f3f4f6', border:`1px solid ${w.is_visible?'#bbf7d0':'#e5e7eb'}`, color:w.is_visible?'#16a34a':'#6b7280', borderRadius:20, padding:'4px 10px', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontFamily:"'Inter',sans-serif" }}>
                      <i className={`bi ${w.is_visible?'bi-eye-fill':'bi-eye-slash'}`}></i>
                      {w.is_visible ? 'Aktif' : 'Nonaktif'}
                    </button>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={() => loadPreview(w.id)} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', color:'#6b7280', borderRadius:6, padding:'4px 8px', fontSize:12, cursor:'pointer' }}><i className="bi bi-arrow-clockwise"></i></button>
                      <button onClick={() => { setEditWidget(w); setShowModal(true) }} style={{ background:'#eff6ff', border:'1px solid #bfdbfe', color:'#3b82f6', borderRadius:6, padding:'4px 8px', fontSize:12, cursor:'pointer' }}><i className="bi bi-pencil"></i></button>
                      <button onClick={() => setDeleteConfirm(w)} style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', borderRadius:6, padding:'4px 8px', fontSize:12, cursor:'pointer' }}><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <WidgetModal editWidget={editWidget} dataTypes={dataTypes}
          onClose={() => { setShowModal(false); setEditWidget(null) }}
          onSaved={() => { setShowModal(false); setEditWidget(null); setPreviewData({}); fetchAll() }} />
      )}

      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1060, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 24px 64px rgba(0,0,0,0.22)', width:'100%', maxWidth:420, overflow:'hidden', fontFamily:"'Inter',sans-serif" }}>
            <div style={{ background:'#fef2f2', borderBottom:'1px solid #fecaca', padding:'16px 20px', display:'flex', alignItems:'center', gap:10 }}>
              <i className="bi bi-trash" style={{ color:'#dc2626', fontSize:18 }}></i>
              <span style={{ fontWeight:700, fontSize:15, color:'#dc2626' }}>Hapus Widget</span>
              <button onClick={() => setDeleteConfirm(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:18 }}><i className="bi bi-x"></i></button>
            </div>
            <div style={{ padding:'20px' }}>
              <p style={{ fontSize:13, color:'#374151', margin:0 }}>Widget <strong>"{deleteConfirm.title}"</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div style={{ borderTop:'1px solid #f0f0f0', padding:'14px 20px', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background:'#f3f4f6', border:'1px solid #e5e7eb', color:'#374151', borderRadius:8, padding:'8px 20px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"'Inter',sans-serif" }}>Batal</button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ background:'#dc2626', border:'none', color:'#fff', borderRadius:8, padding:'8px 20px', fontSize:13, fontWeight:600, cursor:deleting?'not-allowed':'pointer', fontFamily:"'Inter',sans-serif", opacity:deleting?0.8:1, display:'flex', alignItems:'center', gap:6 }}>
                {deleting ? <><span className="spinner-border spinner-border-sm" style={{width:14,height:14,borderWidth:2}} /> Menghapus...</> : <><i className="bi bi-trash"></i> Ya, Hapus</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function AdminPublicDashboardPage() {
  return <ErrorBoundary><AdminPublicDashboard /></ErrorBoundary>
}
