import React, { useEffect, useState, useRef } from 'react'
import {
  getDataTypes, createDataType, updateDataType, deleteDataType,
  getTemplates, uploadTemplate, generateTemplate, downloadAdminTemplate,
  deleteTemplate, parseTemplateStructure,
} from '../../api'

// ─── Constants ───────────────────────────────────────────────────────────────
const FIELD_TYPES = ['text', 'number', 'date', 'email', 'textarea', 'select']

const emptyFirstCol = { enabled: false, label: '', default_rows: [] }
const emptyForm = { name: '', description: '', schema: { header_levels: [[]], first_column: emptyFirstCol } }

function emptyLeaf() {
  return { name: `field_${Date.now()}`, label: '', type: 'text', required: false, options: '' }
}
function emptyGroup() {
  return { label: '', span: 1 }
}


// ─── Schema helpers ───────────────────────────────────────────────────────────
function normalizeSchema(raw) {
  if (!raw) return { header_levels: [[]], first_column: emptyFirstCol }
  if (Array.isArray(raw)) {
    // format lama: flat list
    return {
      header_levels: [raw.map(f => ({ ...f, options: Array.isArray(f.options) ? f.options.join(', ') : (f.options || '') }))],
      first_column: emptyFirstCol,
    }
  }
  if (typeof raw === 'object') {
    const levels = (raw.header_levels || [[]]).map((lvl, li, arr) =>
      li === arr.length - 1
        ? lvl.map(f => ({ ...f, options: Array.isArray(f.options) ? f.options.join(', ') : (f.options || '') }))
        : lvl
    )
    return {
      header_levels: levels.length ? levels : [[]],
      first_column: raw.first_column || emptyFirstCol,
    }
  }
  return { header_levels: [[]], first_column: emptyFirstCol }
}

function serializeSchema(schema) {
  const levels = schema.header_levels.map((lvl, li, arr) =>
    li === arr.length - 1
      ? lvl.map(f => ({
          ...f,
          options: f.type === 'select'
            ? String(f.options || '').split(',').map(o => o.trim()).filter(Boolean)
            : undefined,
        }))
      : lvl
  )
  return { header_levels: levels, first_column: schema.first_column }
}

function getLeafLevel(schema) {
  const levels = schema.header_levels || [[]]
  // Jika level terakhir berisi item dengan 'span' (group), artinya schema hanya 1 level
  // dan semua item adalah leaf — kembalikan apa adanya
  const last = levels[levels.length - 1] || []
  return last
}


// ─── Header Preview ───────────────────────────────────────────────────────────

// Warna header per level, sama dengan excel.py
const PREVIEW_COLORS = ['#1E3A5F', '#2563EB', '#3B82F6', '#60A5FA']

/**
 * Normalisasi schema untuk preview:
 * Deteksi jika level 0 berisi campuran leaf+group (hasil parse yg salah),
 * lalu ekstrak kolom pertama (rowspan) ke first_column secara otomatis.
 */
function normalizeSchemaForPreview(schema) {
  const levels = (schema.header_levels || [[]])
  const firstCol = schema.first_column || {}

  // Jika first_column sudah enabled, tidak perlu normalisasi
  if (firstCol.enabled) return { levels, firstCol, needsExtract: false }

  // Cek apakah level 0 punya item pertama yang merupakan leaf (punya 'name')
  // dan item-item berikutnya adalah group (punya 'span')
  // Ini adalah tanda bahwa kolom pertama rowspan belum diekstrak
  if (levels.length >= 2) {
    const lvl0 = levels[0]
    if (lvl0.length > 0 && lvl0[0].name !== undefined && lvl0.slice(1).some(i => i.span !== undefined)) {
      const extractedLabel = lvl0[0].label || lvl0[0].name || 'Kolom 1'
      const newLvl0 = lvl0.slice(1) // hapus item pertama dari level 0
      const newLevels = [newLvl0, ...levels.slice(1)]
      const extractedFC = {
        enabled: true,
        label: extractedLabel,
        default_rows: firstCol.default_rows || [],
      }
      return { levels: newLevels, firstCol: extractedFC, needsExtract: true }
    }
  }

  return { levels, firstCol, needsExtract: false }
}

function HeaderPreview({ schema }) {
  const { levels, firstCol } = normalizeSchemaForPreview(schema)
  const hasFirst = firstCol.enabled
  const numLevels = levels.length
  const leafs = levels[numLevels - 1] || []
  const totalCols = (hasFirst ? 1 : 0) + leafs.length

  if (totalCols === 0) return <p className="text-muted small">Belum ada kolom.</p>

  const thBase = {
    border: '1px solid #dee2e6',
    padding: '6px 8px',
    textAlign: 'center',
    verticalAlign: 'middle',
    color: '#fff',
    fontWeight: 600,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: 1.3,
  }

  const tdBase = {
    border: '1px solid #dee2e6',
    padding: '5px 8px',
    verticalAlign: 'middle',
    minWidth: 70,
  }

  return (
    <div className="table-responsive border rounded" style={{ fontSize: '0.75rem' }}>
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: 400,
          tableLayout: 'auto',
        }}
      >
        <thead>
          {levels.map((level, li) => {
            const isLeaf = li === numLevels - 1
            const bgColor = PREVIEW_COLORS[Math.min(li, PREVIEW_COLORS.length - 1)]
            return (
              <tr key={li}>
                {/* Kolom pertama — hanya render di baris pertama dengan rowSpan */}
                {hasFirst && li === 0 && (
                  <th
                    rowSpan={numLevels}
                    style={{
                      ...thBase,
                      background: PREVIEW_COLORS[0],
                      minWidth: 100,
                      maxWidth: 140,
                    }}
                  >
                    {firstCol.label || 'Kolom 1'}
                  </th>
                )}

                {isLeaf
                  ? /* Leaf columns */
                    level.map((f, fi) => (
                      <th
                        key={fi}
                        style={{
                          ...thBase,
                          background: bgColor,
                          minWidth: 70,
                        }}
                      >
                        {f.label || f.name || `Kol ${fi + 1}`}
                        {f.required && <span style={{ color: '#FCD34D', marginLeft: 3 }}>*</span>}
                      </th>
                    ))
                  : /* Group headers */
                    level.map((grp, gi) => (
                      <th
                        key={gi}
                        colSpan={grp.span || 1}
                        style={{
                          ...thBase,
                          background: bgColor,
                        }}
                      >
                        {grp.label || `Grup ${gi + 1}`}
                      </th>
                    ))
                }
              </tr>
            )
          })}
        </thead>
        <tbody>
          {(firstCol.default_rows || []).slice(0, 3).map((r, ri) => (
            <tr key={ri}>
              {hasFirst && (
                <td style={{ ...tdBase, background: '#FFFDE7', fontWeight: 600 }}>{r}</td>
              )}
              {leafs.map((_, ci) => (
                <td key={ci} style={tdBase}></td>
              ))}
            </tr>
          ))}
          {!(firstCol.default_rows || []).length && (
            <tr>
              {hasFirst && (
                <td style={{ ...tdBase, color: '#aaa', fontStyle: 'italic' }}>baris data...</td>
              )}
              {leafs.map((_, ci) => <td key={ci} style={tdBase}></td>)}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}


// ─── Schema Builder ───────────────────────────────────────────────────────────
function SchemaBuilder({ schema, onChange }) {
  const levels = schema.header_levels || [[]]
  const firstCol = schema.first_column || emptyFirstCol
  const numLevels = levels.length

  const setLevels = (newLevels) => onChange({ ...schema, header_levels: newLevels })
  const setFirstCol = (fc) => onChange({ ...schema, first_column: fc })

  const addLevel = () => {
    const leafs = levels[numLevels - 1]
    const newGroup = [{ label: 'Grup Baru', span: leafs.length || 1 }]
    setLevels([...levels.slice(0, numLevels - 1), newGroup, leafs])
  }

  const removeLevel = (li) => {
    if (numLevels <= 1) return
    const newLevels = levels.filter((_, i) => i !== li)
    setLevels(newLevels)
  }

  const updateGroup = (li, gi, key, val) => {
    const newLevels = levels.map((lvl, i) => {
      if (i !== li) return lvl
      return lvl.map((g, j) => j === gi ? { ...g, [key]: val } : g)
    })
    setLevels(newLevels)
  }

  const addGroup = (li) => {
    const newLevels = levels.map((lvl, i) => i === li ? [...lvl, emptyGroup()] : lvl)
    setLevels(newLevels)
  }

  const removeGroup = (li, gi) => {
    const newLevels = levels.map((lvl, i) => i === li ? lvl.filter((_, j) => j !== gi) : lvl)
    setLevels(newLevels)
  }

  const addLeaf = () => {
    const leaf = emptyLeaf()
    const newLevels = levels.map((lvl, i) => i === numLevels - 1 ? [...lvl, leaf] : lvl)
    setLevels(newLevels)
  }

  const updateLeaf = (fi, key, val) => {
    const newLevels = levels.map((lvl, i) =>
      i === numLevels - 1 ? lvl.map((f, j) => j === fi ? { ...f, [key]: val } : f) : lvl
    )
    setLevels(newLevels)
  }

  const removeLeaf = (fi) => {
    const newLevels = levels.map((lvl, i) =>
      i === numLevels - 1 ? lvl.filter((_, j) => j !== fi) : lvl
    )
    setLevels(newLevels)
  }

  const moveLeaf = (fi, dir) => {
    const leafs = [...levels[numLevels - 1]]
    const to = fi + dir
    if (to < 0 || to >= leafs.length) return
    ;[leafs[fi], leafs[to]] = [leafs[to], leafs[fi]]
    const newLevels = levels.map((lvl, i) => i === numLevels - 1 ? leafs : lvl)
    setLevels(newLevels)
  }

  const leafs = levels[numLevels - 1] || []

  return (
    <div>
      {/* Kolom Pertama */}
      <div className="border rounded p-3 mb-3 bg-light">
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className="form-check form-switch mb-0">
            <input className="form-check-input" type="checkbox" id="fcEnabled"
              checked={firstCol.enabled}
              onChange={e => setFirstCol({ ...firstCol, enabled: e.target.checked })} />
            <label className="form-check-label fw-semibold small" htmlFor="fcEnabled">
              Kolom Pertama Tetap (pedoman isian)
            </label>
          </div>
        </div>
        {firstCol.enabled && (
          <div className="row g-2">
            <div className="col-md-4">
              <label className="form-label small mb-1">Label Header</label>
              <input className="form-control form-control-sm" placeholder="contoh: Kecamatan"
                value={firstCol.label}
                onChange={e => setFirstCol({ ...firstCol, label: e.target.value })} />
            </div>
            <div className="col-md-8">
              <label className="form-label small mb-1">
                Isian Baris Default <span className="text-muted">(satu per baris, bisa kosong)</span>
              </label>
              <textarea className="form-control form-control-sm" rows={3}
                placeholder="Kec. Sukamakmur&#10;Kec. Harapan&#10;Kec. Maju Jaya"
                value={(firstCol.default_rows || []).join('\n')}
                onChange={e => setFirstCol({
                  ...firstCol,
                  default_rows: e.target.value.split('\n').map(s => s.trimEnd()).filter(s => s !== '' || false)
                })} />
              <div className="form-text">{(firstCol.default_rows || []).length} baris terdaftar</div>
            </div>
          </div>
        )}
      </div>

      {/* Group Headers (level di atas leaf) */}
      {numLevels > 1 && levels.slice(0, numLevels - 1).map((level, li) => (
        <div key={li} className="border rounded p-3 mb-3" style={{ borderColor: '#2563eb33' }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold small text-primary">
              <i className="bi bi-layers me-1"></i>Level {li + 1} — Grup Header
            </span>
            <div className="d-flex gap-1">
              <button type="button" className="btn btn-sm btn-outline-primary"
                onClick={() => addGroup(li)}>
                <i className="bi bi-plus-lg me-1"></i>Tambah Grup
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger"
                onClick={() => removeLevel(li)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {level.map((grp, gi) => (
              <div key={gi} className="border rounded p-2 bg-white d-flex gap-2 align-items-center" style={{ minWidth: 200 }}>
                <div>
                  <label className="form-label small mb-1">Label</label>
                  <input className="form-control form-control-sm" style={{ width: 120 }}
                    value={grp.label} placeholder="Nama Grup"
                    onChange={e => updateGroup(li, gi, 'label', e.target.value)} />
                </div>
                <div>
                  <label className="form-label small mb-1">Span</label>
                  <input className="form-control form-control-sm" type="number" min={1} style={{ width: 60 }}
                    value={grp.span}
                    onChange={e => updateGroup(li, gi, 'span', parseInt(e.target.value) || 1)} />
                </div>
                <button type="button" className="btn btn-sm btn-outline-danger mt-3"
                  onClick={() => removeGroup(li, gi)}>
                  <i className="bi bi-x"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Leaf Columns */}
      <div className="border rounded p-3 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-semibold small">
            <i className="bi bi-columns-gap me-1 text-success"></i>
            Kolom Data ({leafs.length} kolom)
          </span>
          <div className="d-flex gap-1">
            <button type="button" className="btn btn-sm btn-outline-secondary"
              onClick={addLevel}>
              <i className="bi bi-layers me-1"></i>Tambah Level Header
            </button>
            <button type="button" className="btn btn-sm btn-outline-success"
              onClick={addLeaf}>
              <i className="bi bi-plus-lg me-1"></i>Tambah Kolom
            </button>
          </div>
        </div>
        {leafs.length === 0
          ? <div className="text-center text-muted py-3 border rounded small">Belum ada kolom. Klik "Tambah Kolom".</div>
          : (
            <div className="d-flex flex-column gap-2">
              {leafs.map((field, fi) => (
                <div key={fi} className="border rounded p-2 bg-light">
                  <div className="row g-2 align-items-center">
                    <div className="col-md-3">
                      <label className="form-label small mb-1">Label</label>
                      <input className="form-control form-control-sm" placeholder="Label tampilan"
                        value={field.label}
                        onChange={e => updateLeaf(fi, 'label', e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small mb-1">Nama Field</label>
                      <input className="form-control form-control-sm" placeholder="nama_field"
                        value={field.name}
                        onChange={e => updateLeaf(fi, 'name', e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small mb-1">Tipe</label>
                      <select className="form-select form-select-sm"
                        value={field.type}
                        onChange={e => updateLeaf(fi, 'type', e.target.value)}>
                        {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-1 d-flex flex-column align-items-center">
                      <label className="form-label small mb-1">Wajib</label>
                      <input type="checkbox" className="form-check-input mt-1"
                        checked={field.required}
                        onChange={e => updateLeaf(fi, 'required', e.target.checked)} />
                    </div>
                    <div className="col-md-2 d-flex gap-1 align-items-end">
                      <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={() => moveLeaf(fi, -1)} disabled={fi === 0} title="Geser kiri">
                        <i className="bi bi-arrow-left"></i>
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-secondary"
                        onClick={() => moveLeaf(fi, 1)} disabled={fi === leafs.length - 1} title="Geser kanan">
                        <i className="bi bi-arrow-right"></i>
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger"
                        onClick={() => removeLeaf(fi)}>
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                    {field.type === 'select' && (
                      <div className="col-12">
                        <label className="form-label small mb-1">Pilihan (pisahkan koma)</label>
                        <input className="form-control form-control-sm" placeholder="Opsi 1, Opsi 2"
                          value={field.options}
                          onChange={e => updateLeaf(fi, 'options', e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDataSchema() {
  const [dataTypes, setDataTypes] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDT, setSelectedDT] = useState(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editDT, setEditDT] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [parsePreview, setParsePreview] = useState(null)
  const [parsedApplied, setParsedApplied] = useState(false)
  const fileRef = useRef()

  const fetchAll = async () => {
    try {
      const [dtRes, tRes] = await Promise.all([getDataTypes(), getTemplates()])
      setDataTypes(dtRes.data)
      setTemplates(tRes.data)
      if (selectedDT) {
        const updated = dtRes.data.find(d => d.id === selectedDT.id)
        if (updated) setSelectedDT(updated)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const templateByDT = {}
  templates.forEach(t => { templateByDT[t.data_type_id] = t })

  // ── Form Modal ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditDT(null)
    setForm(emptyForm)
    setFormError('')
    setParsePreview(null)
    setParsedApplied(false)
    setShowFormModal(true)
  }

  const openEdit = (dt) => {
    setEditDT(dt)
    setForm({ name: dt.name, description: dt.description || '', schema: normalizeSchema(dt.fields_schema) })
    setFormError('')
    setParsePreview(null)
    setParsedApplied(false)
    setShowFormModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = { name: form.name, description: form.description, fields_schema: serializeSchema(form.schema) }
      if (editDT) { await updateDataType(editDT.id, payload) }
      else { await createDataType(payload) }
      setShowFormModal(false)
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  const handleDelete = async (dt) => {
    if (!window.confirm(`Hapus jenis data "${dt.name}"? Semua tugas dan data terkait ikut terhapus.`)) return
    try {
      await deleteDataType(dt.id)
      if (selectedDT?.id === dt.id) setSelectedDT(null)
      fetchAll()
    } catch (err) { alert(err.response?.data?.error || 'Gagal menghapus') }
  }

  // ── Parse Excel preview ───────────────────────────────────────────────────
  const handleParseFile = async (file) => {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await parseTemplateStructure(fd)
      setParsePreview(res.data.schema)
      setParsedApplied(false)
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Gagal membaca struktur Excel')
    }
  }

  const applyParsedSchema = () => {
    if (!parsePreview) return
    setForm(f => ({ ...f, schema: normalizeSchema(parsePreview) }))
    setParsedApplied(true)
  }

  // ── Template actions ──────────────────────────────────────────────────────
  const handleUploadTemplate = async (dtId) => {
    if (!uploadFile) return setUploadError('Pilih file terlebih dahulu')
    setUploading(true)
    setUploadError('')
    try {
      const fd = new FormData()
      fd.append('file', uploadFile)
      fd.append('data_type_id', dtId)
      fd.append('sync_schema', 'true')
      await uploadTemplate(fd)
      setUploadFile(null)
      if (fileRef.current) fileRef.current.value = ''
      fetchAll()
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Gagal upload')
    } finally { setUploading(false) }
  }

  const handleGenerate = async (dtId) => {
    try {
      await generateTemplate({ data_type_id: dtId })
      fetchAll()
    } catch (err) { alert(err.response?.data?.error || 'Gagal generate template') }
  }

  const handleDownload = async (t) => {
    try {
      const res = await downloadAdminTemplate(t.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.setAttribute('download', t.original_filename)
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch { alert('Gagal mengunduh') }
  }

  const handleDeleteTemplate = async (t) => {
    if (!window.confirm(`Hapus template "${t.original_filename}"?`)) return
    try {
      await deleteTemplate(t.id)
      fetchAll()
    } catch (err) { alert(err.response?.data?.error || 'Gagal menghapus template') }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Jenis Data & Template</h4>
          <p className="text-muted small mb-0">Kelola struktur data dan template Excel dalam satu tempat</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i>Tambah Jenis Data
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : dataTypes.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <i className="bi bi-grid-3x3-gap display-4 text-muted mb-3"></i>
          <p className="text-muted">Belum ada jenis data.</p>
          <button className="btn btn-primary mx-auto" style={{ width: 'fit-content' }} onClick={openCreate}>
            <i className="bi bi-plus-lg me-1"></i>Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {/* Daftar Jenis Data */}
          <div className="col-md-4">
            <div className="d-flex flex-column gap-2">
              {dataTypes.map(dt => {
                const tmpl = templateByDT[dt.id]
                const isSelected = selectedDT?.id === dt.id
                const schema = normalizeSchema(dt.fields_schema)
                const leafs = getLeafLevel(schema)
                return (
                  <div key={dt.id}
                    className={`card border-0 shadow-sm cursor-pointer ${isSelected ? 'border border-primary' : ''}`}
                    style={{ cursor: 'pointer', borderWidth: isSelected ? 2 : 0 }}
                    onClick={() => setSelectedDT(isSelected ? null : dt)}>
                    <div className="card-body py-2 px-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="fw-semibold text-truncate">{dt.name}</div>
                          <div className="small text-muted">
                            {leafs.length} kolom •{' '}
                            {tmpl
                              ? <span className="text-success"><i className="bi bi-file-earmark-check me-1"></i>Ada template</span>
                              : <span className="text-warning"><i className="bi bi-exclamation-circle me-1"></i>Belum ada template</span>
                            }
                          </div>
                        </div>
                        <div className="d-flex gap-1 ms-2">
                          <button className="btn btn-sm btn-outline-primary" onClick={e => { e.stopPropagation(); openEdit(dt) }}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={e => { e.stopPropagation(); handleDelete(dt) }}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detail panel kanan */}
          <div className="col-md-8">
            {!selectedDT ? (
              <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center text-center py-5">
                <i className="bi bi-arrow-left-circle display-4 text-muted mb-3"></i>
                <p className="text-muted">Pilih jenis data di sebelah kiri untuk melihat detail dan template.</p>
              </div>
            ) : (() => {
              const dt = selectedDT
              const tmpl = templateByDT[dt.id]
              const schema = normalizeSchema(dt.fields_schema)
              return (
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold mb-0">{dt.name}</h6>
                      {dt.description && <div className="small text-muted">{dt.description}</div>}
                    </div>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(dt)}>
                      <i className="bi bi-pencil me-1"></i>Edit Schema
                    </button>
                  </div>
                  <div className="card-body">
                    {/* Preview Header */}
                    <h6 className="fw-semibold small text-uppercase text-muted mb-2">Preview Struktur</h6>
                    <HeaderPreview schema={schema} />

                    {/* Template section */}
                    <div className="mt-4">
                      <h6 className="fw-semibold small text-uppercase text-muted mb-3">Template Excel</h6>
                      {tmpl ? (
                        <div className="border rounded p-3 d-flex align-items-center gap-3">
                          <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 44, height: 44, background: '#f0fdf4' }}>
                            <i className="bi bi-file-earmark-spreadsheet-fill text-success fs-5"></i>
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <div className="fw-semibold text-truncate small">{tmpl.original_filename}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {new Date(tmpl.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                              {' '}• {tmpl.creator_username}
                            </div>
                          </div>
                          <div className="d-flex gap-1 flex-shrink-0">
                            <button className="btn btn-sm btn-outline-success" onClick={() => handleDownload(tmpl)} title="Unduh">
                              <i className="bi bi-download"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTemplate(tmpl)} title="Hapus">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="alert alert-warning small py-2 mb-3">
                          <i className="bi bi-exclamation-triangle me-1"></i>
                          Belum ada template untuk jenis data ini.
                        </div>
                      )}

                      {/* Upload / Generate */}
                      <div className="row g-2 mt-2">
                        <div className="col-md-8">
                          <div className="input-group input-group-sm">
                            <input type="file" className="form-control" accept=".xlsx,.xls" ref={fileRef}
                              onChange={async e => {
                                const f = e.target.files[0]
                                setUploadFile(f)
                                setUploadError('')
                                setParsePreview(null)
                                if (f) await handleParseFile(f)
                              }} />
                            <button className="btn btn-primary" disabled={!uploadFile || uploading}
                              onClick={() => handleUploadTemplate(dt.id)}>
                              {uploading ? <span className="spinner-border spinner-border-sm" /> : <><i className="bi bi-upload me-1"></i>Upload</>}
                            </button>
                          </div>
                          {uploadError && <div className="text-danger small mt-1">{uploadError}</div>}
                        </div>
                        <div className="col-md-4">
                          <button className="btn btn-sm btn-outline-secondary w-100"
                            onClick={() => handleGenerate(dt.id)}
                            disabled={getLeafLevel(schema).length === 0}
                            title={getLeafLevel(schema).length === 0 ? 'Tambah kolom dulu di schema' : ''}>
                            <i className="bi bi-magic me-1"></i>Generate dari Schema
                          </button>
                        </div>
                      </div>

                      {/* Parse preview */}
                      {parsePreview && (
                        <div className="border rounded p-3 mt-3 bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-semibold small"><i className="bi bi-eye me-1"></i>Struktur terdeteksi dari file Excel</span>
                            {!parsedApplied && (
                              <button className="btn btn-sm btn-success" onClick={applyParsedSchema}>
                                <i className="bi bi-check-lg me-1"></i>Terapkan ke Schema
                              </button>
                            )}
                            {parsedApplied && <span className="text-success small"><i className="bi bi-check-circle-fill me-1"></i>Diterapkan</span>}
                          </div>
                          <HeaderPreview schema={normalizeSchema(parsePreview)} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editDT ? `Edit: ${editDT.name}` : 'Tambah Jenis Data Baru'}
                </h5>
                <button className="btn-close" onClick={() => setShowFormModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {formError && <div className="alert alert-danger small py-2">{formError}</div>}
                  <div className="row g-3 mb-4">
                    <div className="col-md-5">
                      <label className="form-label fw-semibold small">Nama Jenis Data <span className="text-danger">*</span></label>
                      <input className="form-control" required placeholder="contoh: Data Pertanahan"
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div className="col-md-7">
                      <label className="form-label fw-semibold small">Deskripsi</label>
                      <input className="form-control" placeholder="Deskripsi singkat (opsional)"
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                  </div>

                  {/* Upload Excel untuk deteksi otomatis */}
                  <div className="alert alert-info small py-2 mb-3">
                    <i className="bi bi-lightbulb me-1"></i>
                    <strong>Tip:</strong> Upload file Excel untuk otomatis mendeteksi struktur header (1, 2, atau 3 level),
                    atau bangun struktur manual di bawah.
                  </div>
                  <div className="mb-4">
                    <div className="input-group input-group-sm" style={{ maxWidth: 500 }}>
                      <input type="file" className="form-control" accept=".xlsx,.xls"
                        onChange={async e => {
                          const f = e.target.files[0]
                          if (!f) return
                          setUploadError('')
                          setParsePreview(null)
                          setParsedApplied(false)
                          try {
                            const fd = new FormData()
                            fd.append('file', f)
                            const res = await parseTemplateStructure(fd)
                            setParsePreview(res.data.schema)
                          } catch (err) {
                            setUploadError(err.response?.data?.error || 'Gagal membaca struktur')
                          }
                        }} />
                      <span className="input-group-text bg-light text-muted small">Deteksi otomatis</span>
                    </div>
                    {uploadError && <div className="text-danger small mt-1">{uploadError}</div>}
                    {parsePreview && !parsedApplied && (
                      <div className="mt-2 p-2 border rounded bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-semibold"><i className="bi bi-eye me-1"></i>Struktur terdeteksi:</span>
                          <button type="button" className="btn btn-sm btn-success"
                            onClick={() => { setForm(f => ({ ...f, schema: normalizeSchema(parsePreview) })); setParsedApplied(true) }}>
                            <i className="bi bi-check-lg me-1"></i>Terapkan
                          </button>
                        </div>
                        <HeaderPreview schema={normalizeSchema(parsePreview)} />
                      </div>
                    )}
                    {parsedApplied && <div className="text-success small mt-1"><i className="bi bi-check-circle-fill me-1"></i>Schema diterapkan dari Excel</div>}
                  </div>

                  <div className="row g-4">
                    <div className="col-md-6">
                      <h6 className="fw-semibold mb-3 small text-uppercase text-muted">Builder Schema</h6>
                      <SchemaBuilder schema={form.schema} onChange={s => setForm(f => ({ ...f, schema: s }))} />
                    </div>
                    <div className="col-md-6">
                      <h6 className="fw-semibold mb-3 small text-uppercase text-muted">Preview</h6>
                      <HeaderPreview schema={form.schema} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-1" />Menyimpan...</> : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
