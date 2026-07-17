import React, { useEffect, useState } from 'react'
import { getDataTypes, createDataType, updateDataType, deleteDataType } from '../../api'

const FIELD_TYPES = ['text', 'number', 'date', 'email', 'textarea', 'select']
const emptyField = { name: '', label: '', type: 'text', required: false, options: '' }
const emptyForm = { name: '', description: '', fields_schema: [] }

export default function AdminDataTypes() {
  const [dataTypes, setDataTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDT, setEditDT] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchDataTypes = async () => {
    try {
      const res = await getDataTypes()
      setDataTypes(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDataTypes() }, [])

  const openCreate = () => {
    setEditDT(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  const openEdit = (dt) => {
    setEditDT(dt)
    setForm({
      name: dt.name,
      description: dt.description || '',
      fields_schema: dt.fields_schema.map((f) => ({ ...f, options: f.options?.join(', ') || '' }))
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        fields_schema: form.fields_schema.map((f) => ({
          ...f,
          options: f.type === 'select' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined
        }))
      }
      if (editDT) {
        await updateDataType(editDT.id, payload)
      } else {
        await createDataType(payload)
      }
      setShowModal(false)
      fetchDataTypes()
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (dt) => {
    if (!window.confirm(`Hapus jenis data "${dt.name}"? Semua tugas dan data terkait akan ikut terhapus.`)) return
    try {
      await deleteDataType(dt.id)
      fetchDataTypes()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus')
    }
  }

  const addField = () => {
    setForm((prev) => ({
      ...prev,
      fields_schema: [...prev.fields_schema, { ...emptyField, name: `field_${Date.now()}` }]
    }))
  }

  const updateField = (idx, key, value) => {
    setForm((prev) => {
      const fields = [...prev.fields_schema]
      fields[idx] = { ...fields[idx], [key]: value }
      return { ...prev, fields_schema: fields }
    })
  }

  const removeField = (idx) => {
    setForm((prev) => ({
      ...prev,
      fields_schema: prev.fields_schema.filter((_, i) => i !== idx)
    }))
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Jenis Data</h4>
          <p className="text-muted small mb-0">Tentukan jenis data yang harus dikumpulkan beserta strukturnya</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i> Tambah Jenis Data
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="row g-3">
          {dataTypes.length === 0 ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm text-center py-5">
                <i className="bi bi-grid-3x3-gap display-4 text-muted mb-3"></i>
                <p className="text-muted">Belum ada jenis data. Klik tombol di atas untuk menambahkan.</p>
              </div>
            </div>
          ) : (
            dataTypes.map((dt) => (
              <div className="col-md-6 col-lg-4" key={dt.id}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-2 d-flex align-items-center justify-content-center"
                          style={{ width: 36, height: 36, background: '#eff6ff' }}
                        >
                          <i className="bi bi-grid-3x3-gap-fill text-primary"></i>
                        </div>
                        <h6 className="fw-bold mb-0">{dt.name}</h6>
                      </div>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(dt)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(dt)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                    {dt.description && (
                      <p className="text-muted small mb-2">{dt.description}</p>
                    )}
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {dt.fields_schema.length === 0 ? (
                        <span className="text-muted small">Tidak ada field</span>
                      ) : (
                        dt.fields_schema.map((f, i) => (
                          <span key={i} className="badge bg-light text-dark border small">
                            {f.label || f.name}
                            {f.required && <span className="text-danger ms-1">*</span>}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="mt-2 text-muted small">
                      <i className="bi bi-collection me-1"></i>
                      {dt.fields_schema.length} field
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {editDT ? 'Edit Jenis Data' : 'Tambah Jenis Data Baru'}
                </h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small py-2">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Nama Jenis Data <span className="text-danger">*</span></label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="contoh: Data Kependudukan"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold small">Deskripsi</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Deskripsi singkat..."
                    />
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-semibold mb-0">Struktur Field</h6>
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addField}>
                      <i className="bi bi-plus-lg me-1"></i> Tambah Field
                    </button>
                  </div>

                  {form.fields_schema.length === 0 ? (
                    <div className="text-center text-muted py-3 border rounded">
                      Belum ada field. Klik "Tambah Field" untuk mulai.
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {form.fields_schema.map((field, idx) => (
                        <div key={idx} className="border rounded p-3 bg-light">
                          <div className="row g-2 align-items-start">
                            <div className="col-md-4">
                              <label className="form-label small mb-1">Label</label>
                              <input
                                className="form-control form-control-sm"
                                placeholder="Label tampilan"
                                value={field.label}
                                onChange={(e) => updateField(idx, 'label', e.target.value)}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label small mb-1">Nama Field</label>
                              <input
                                className="form-control form-control-sm"
                                placeholder="nama_field"
                                value={field.name}
                                onChange={(e) => updateField(idx, 'name', e.target.value)}
                              />
                            </div>
                            <div className="col-md-3">
                              <label className="form-label small mb-1">Tipe</label>
                              <select
                                className="form-select form-select-sm"
                                value={field.type}
                                onChange={(e) => updateField(idx, 'type', e.target.value)}
                              >
                                {FIELD_TYPES.map((t) => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-2 d-flex align-items-end gap-2">
                              <div className="form-check mt-4">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`req-${idx}`}
                                  checked={field.required}
                                  onChange={(e) => updateField(idx, 'required', e.target.checked)}
                                />
                                <label className="form-check-label small" htmlFor={`req-${idx}`}>Wajib</label>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger mt-3"
                                onClick={() => removeField(idx)}
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </div>
                            {field.type === 'select' && (
                              <div className="col-12">
                                <label className="form-label small mb-1">Pilihan (pisahkan dengan koma)</label>
                                <input
                                  className="form-control form-control-sm"
                                  placeholder="Opsi 1, Opsi 2, Opsi 3"
                                  value={field.options}
                                  onChange={(e) => updateField(idx, 'options', e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-1" /> Menyimpan...</> : 'Simpan'}
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
