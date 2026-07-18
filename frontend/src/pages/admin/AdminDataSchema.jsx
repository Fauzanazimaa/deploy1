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
    <div
      className="table-responsive border rounded"
      style={{
        fontSize: '0.75rem',
        maxHeight: 400,
        overflowY: 'auto',
        overflowX: 'auto',
      }}
    >
      <table
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          minWidth: 400,
          tableLayout: 'auto',
        }}
      >
        <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
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
  // createFile: file Excel untuk Tambah Jenis Data baru
  const [createFile, setCreateFile] = useState(null)
  const createFileRef = useRef()
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
    setForm({ name: '', description: '' })
    setCreateFile(null)
    setFormError('')
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

  // CREATE: buat data type kosong → upload template (schema dari header Excel)
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createFile) return setFormError('Pilih file template Excel terlebih dahulu')
    setSaving(true)
    setFormError('')
    try {
      // 1. Buat jenis data dengan schema kosong
      const dtRes = await createDataType({ name: form.name, description: form.description, fields_schema: [] })
      const newDtId = dtRes.data.id

      // 2. Upload template + sync_schema=true → backend parse header jadi field schema
      const fd = new FormData()
      fd.append('file', createFile)
      fd.append('data_type_id', newDtId)
      fd.append('sync_schema', 'true')
      await uploadTemplate(fd)

      setShowFormModal(false)
      setCreateFile(null)
      fetchAll()
    } catch (err) {
      setFormError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally { setSaving(false) }
  }

  // EDIT: update nama/deskripsi + schema builder (opsional)
  const handleEdit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = { name: form.name, description: form.description, fields_schema: serializeSchema(form.schema) }
      await updateDataType(editDT.id, payload)
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
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Jenis Data & Template</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Kelola struktur data dan template Excel dalam satu tempat</p>
        </div>
        <button onClick={openCreate} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Inter',sans-serif" }}>
          <i className="bi bi-plus-lg"></i>Tambah Jenis Data
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #f5a62330', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : dataTypes.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <i className="bi bi-grid-3x3-gap" style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 12 }}></i>
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>Belum ada jenis data.</p>
          <button onClick={openCreate} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
            <i className="bi bi-plus-lg me-2"></i>Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {/* Daftar Jenis Data */}
          <div className="col-md-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dataTypes.map(dt => {
                const tmpl = templateByDT[dt.id]
                const isSelected = selectedDT?.id === dt.id
                const schema = normalizeSchema(dt.fields_schema)
                const leafs = getLeafLevel(schema)
                return (
                  <div key={dt.id}
                    onClick={() => setSelectedDT(isSelected ? null : dt)}
                    style={{
                      background: '#fff', borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                      border: isSelected ? '2px solid #f5a623' : '1px solid #f0f0f0',
                      boxShadow: isSelected ? '0 2px 12px rgba(245,166,35,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                      transition: 'border 0.15s, box-shadow 0.15s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, color: '#1a1f2e', fontSize: 14, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{dt.name}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                          {leafs.length} kolom &bull;{' '}
                          {tmpl
                            ? <span style={{ color: '#16a34a' }}><i className="bi bi-file-earmark-check me-1"></i>Ada template</span>
                            : <span style={{ color: '#f5a623' }}><i className="bi bi-exclamation-circle me-1"></i>Belum ada template</span>
                          }
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button onClick={e => { e.stopPropagation(); openEdit(dt) }} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer' }}><i className="bi bi-pencil"></i></button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(dt) }} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
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
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <i className="bi bi-arrow-left-circle" style={{ fontSize: 36, color: '#d1d5db', display: 'block', marginBottom: 12 }}></i>
                <p style={{ color: '#9ca3af', fontSize: 13 }}>Pilih jenis data di sebelah kiri untuk melihat detail dan template.</p>
              </div>
            ) : (() => {
              const dt = selectedDT
              const tmpl = templateByDT[dt.id]
              const schema = normalizeSchema(dt.fields_schema)
              return (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ borderBottom: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h6 style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e', margin: 0 }}>{dt.name}</h6>
                      {dt.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{dt.description}</div>}
                    </div>
                    <button onClick={() => openEdit(dt)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}>
                      <i className="bi bi-pencil"></i>Edit Schema
                    </button>
                  </div>
                  <div style={{ padding: '20px' }}>
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
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => handleDownload(tmpl)} title="Unduh" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}>
                              <i className="bi bi-download"></i>
                            </button>
                            <button onClick={() => handleDeleteTemplate(tmpl)} title="Hapus" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 14 }}>
                          <i className="bi bi-exclamation-triangle me-2"></i>Belum ada template untuk jenis data ini.
                        </div>
                      )}

                      {/* Upload / Generate */}
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, letterSpacing: 0.5 }}>UPLOAD TEMPLATE BARU</div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <label style={{
                            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                            background: '#f9fafb', border: '1.5px dashed #d1d5db', borderRadius: 8,
                            padding: '8px 14px', fontSize: 13, color: '#374151', flex: 1, minWidth: 200,
                          }}>
                            <i className="bi bi-file-earmark-arrow-up" style={{ color: '#f5a623', fontSize: 18 }}></i>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {uploadFile ? uploadFile.name : 'Pilih file .xlsx / .xls'}
                            </span>
                            <input type="file" accept=".xlsx,.xls" ref={fileRef} style={{ display: 'none' }}
                              onChange={e => {
                                setUploadFile(e.target.files[0] || null)
                                setUploadError('')
                                setParsePreview(null)
                              }} />
                          </label>
                          <button
                            style={{
                              background: uploadFile && !uploading ? '#f5a623' : '#e5e7eb',
                              border: 'none', color: uploadFile && !uploading ? '#fff' : '#9ca3af',
                              borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600,
                              cursor: uploadFile && !uploading ? 'pointer' : 'not-allowed',
                              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                              fontFamily: "'Inter',sans-serif",
                            }}
                            disabled={!uploadFile || uploading}
                            onClick={() => handleUploadTemplate(dt.id)}>
                            {uploading
                              ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />Mengupload...</>
                              : <><i className="bi bi-upload"></i>Upload</>}
                          </button>
                          <button
                            style={{
                              background: '#fff', border: '1px solid #e5e7eb', color: '#374151',
                              borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 500,
                              cursor: getLeafLevel(schema).length === 0 ? 'not-allowed' : 'pointer',
                              opacity: getLeafLevel(schema).length === 0 ? 0.5 : 1,
                              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                              fontFamily: "'Inter',sans-serif",
                            }}
                            disabled={getLeafLevel(schema).length === 0}
                            title={getLeafLevel(schema).length === 0 ? 'Edit schema dulu untuk menambah kolom' : 'Generate template dari schema yang ada'}
                            onClick={() => handleGenerate(dt.id)}>
                            <i className="bi bi-magic"></i>Generate dari Schema
                          </button>
                        </div>
                        {uploadError && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '7px 12px', fontSize: 12, color: '#dc2626', marginTop: 8 }}>
                            <i className="bi bi-exclamation-triangle me-2"></i>{uploadError}
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                          <i className="bi bi-info-circle me-1"></i>
                          Upload file Excel — header baris pertama otomatis disinkronkan sebagai kolom jenis data ini.
                        </div>
                      </div>

                      {/* Parse preview — hapus di panel kanan, tidak diperlukan lagi */}
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: editDT ? 1000 : 480, margin: '0 auto', fontFamily: "'Inter',sans-serif" }}>
            
            {/* Header */}
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>
                {editDT ? `Edit: ${editDT.name}` : 'Tambah Jenis Data Baru'}
              </span>
              <button onClick={() => setShowFormModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>

            {/* ── MODE CREATE: nama + deskripsi + upload template ── */}
            {!editDT && (
              <form onSubmit={handleCreate}>
                <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {formError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                      <i className="bi bi-exclamation-triangle me-2"></i>{formError}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>
                      NAMA JENIS DATA <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      className="form-control"
                      required
                      placeholder="contoh: Data Kependudukan"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>DESKRIPSI</label>
                    <input
                      className="form-control"
                      placeholder="Deskripsi singkat (opsional)"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>
                      FILE TEMPLATE EXCEL <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      background: createFile ? '#f0fdf4' : '#fafafa',
                      border: `2px dashed ${createFile ? '#86efac' : '#d1d5db'}`,
                      borderRadius: 10, padding: '14px 18px', transition: 'all 0.15s',
                    }}>
                      <i className="bi bi-file-earmark-arrow-up" style={{ color: createFile ? '#16a34a' : '#f5a623', fontSize: 22, flexShrink: 0 }}></i>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: createFile ? '#16a34a' : '#374151' }}>
                          {createFile ? createFile.name : 'Klik untuk pilih file Excel'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                          {createFile
                            ? 'Header baris pertama akan otomatis jadi kolom jenis data ini'
                            : 'Format .xlsx atau .xls — header baris pertama = kolom data'}
                        </div>
                      </div>
                      {createFile && (
                        <i className="bi bi-check-circle-fill" style={{ color: '#16a34a', fontSize: 18, flexShrink: 0 }}></i>
                      )}
                      <input
                        ref={createFileRef}
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        required
                        onChange={e => setCreateFile(e.target.files[0] || null)}
                      />
                    </label>
                    {createFile && (
                      <button
                        type="button"
                        onClick={() => { setCreateFile(null); if (createFileRef.current) createFileRef.current.value = '' }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <i className="bi bi-x"></i> Hapus file
                      </button>
                    )}
                  </div>

                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#3b82f6' }}>
                    <i className="bi bi-info-circle me-2"></i>
                    Sistem akan membaca <strong>baris pertama</strong> file Excel sebagai nama kolom jenis data ini secara otomatis.
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setShowFormModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                  <button type="submit" disabled={saving || !createFile} style={{ background: saving || !createFile ? '#e5e7eb' : '#f5a623', border: 'none', color: saving || !createFile ? '#9ca3af' : '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving || !createFile ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />Menyimpan...</>
                      : <><i className="bi bi-plus-lg"></i>Buat Jenis Data</>}
                  </button>
                </div>
              </form>
            )}

            {/* ── MODE EDIT: schema builder ── */}
            {editDT && (
              <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px' }}>
                  {formError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14 }}>
                      {formError}
                    </div>
                  )}
                  <div className="row g-3 mb-4">
                    <div className="col-md-5">
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>NAMA JENIS DATA <span style={{ color: '#dc2626' }}>*</span></label>
                      <input className="form-control" required placeholder="contoh: Data Pertanahan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
                    </div>
                    <div className="col-md-7">
                      <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>DESKRIPSI</label>
                      <input className="form-control" placeholder="Deskripsi singkat (opsional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
                    </div>
                  </div>

                  <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
                    <i className="bi bi-info-circle me-2"></i>
                    Untuk mengubah kolom, upload ulang template Excel dari panel detail. Schema builder di bawah untuk penyesuaian manual.
                  </div>

                  <div className="row g-4">
                    <div className="col-md-12">
                      <h6 style={{ fontWeight: 600, fontSize: 12, color: '#6b7280', letterSpacing: 1, marginBottom: 12 }}>PREVIEW SCHEMA</h6>
                      <HeaderPreview schema={form.schema} />
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setShowFormModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                  <button type="submit" disabled={saving} style={{ background: saving ? '#e5e7eb' : '#f5a623', border: 'none', color: saving ? '#9ca3af' : '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                    {saving ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} />Menyimpan...</> : 'Simpan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
