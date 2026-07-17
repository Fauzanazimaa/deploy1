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
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Jenis Data</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Tentukan jenis data yang harus dikumpulkan beserta strukturnya</p>
        </div>
        <button onClick={openCreate} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Inter',sans-serif" }}>
          <i className="bi bi-plus-lg"></i> Tambah Jenis Data
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #f5a62330', borderTopColor: '#f5a623', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div className="row g-3">
          {dataTypes.length === 0 ? (
            <div className="col-12">
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', textAlign: 'center', padding: '48px 0' }}>
                <i className="bi bi-grid-3x3-gap" style={{ fontSize: 40, color: '#d1d5db', display: 'block', marginBottom: 12 }}></i>
                <p style={{ color: '#9ca3af', fontSize: 13 }}>Belum ada jenis data. Klik tombol di atas untuk menambahkan.</p>
              </div>
            </div>
          ) : (
            dataTypes.map((dt) => (
              <div className="col-md-6 col-lg-4" key={dt.id}>
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', height: '100%', padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="bi bi-grid-3x3-gap-fill" style={{ color: '#f5a623' }}></i>
                      </div>
                      <h6 style={{ fontWeight: 700, fontSize: 14, color: '#1a1f2e', margin: 0 }}>{dt.name}</h6>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => openEdit(dt)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer' }}><i className="bi bi-pencil"></i></button>
                      <button onClick={() => handleDelete(dt)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer' }}><i className="bi bi-trash"></i></button>
                    </div>
                  </div>
                  {dt.description && <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 10px' }}>{dt.description}</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {dt.fields_schema.length === 0 ? (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>Tidak ada field</span>
                    ) : dt.fields_schema.map((f, i) => (
                      <span key={i} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 6, padding: '2px 7px', fontSize: 11 }}>
                        {f.label || f.name}{f.required && <span style={{ color: '#dc2626' }}> *</span>}
                      </span>
                    ))}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 8 }}>
                    <i className="bi bi-collection me-1"></i>{dt.fields_schema.length} field
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter',sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>{editDT ? 'Edit Jenis Data' : 'Tambah Jenis Data Baru'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14 }}>{error}</div>}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>NAMA JENIS DATA <span style={{ color: '#dc2626' }}>*</span></label>
                  <input className="form-control" required placeholder="contoh: Data Kependudukan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>DESKRIPSI</label>
                  <textarea className="form-control" rows={2} placeholder="Deskripsi singkat..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ fontSize: 13, fontFamily: "'Inter',sans-serif" }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h6 style={{ fontWeight: 600, fontSize: 13, color: '#1a1f2e', margin: 0 }}>Struktur Field</h6>
                  <button type="button" onClick={addField} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'Inter',sans-serif" }}>
                    <i className="bi bi-plus-lg"></i>Tambah Field
                  </button>
                </div>
                {form.fields_schema.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px', border: '1.5px dashed #e5e7eb', borderRadius: 8, fontSize: 13 }}>Belum ada field. Klik "Tambah Field" untuk mulai.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {form.fields_schema.map((field, idx) => (
                      <div key={idx} style={{ background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px' }}>
                        <div className="row g-2 align-items-start">
                          <div className="col-md-4">
                            <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>LABEL</label>
                            <input className="form-control form-control-sm" placeholder="Label tampilan" value={field.label} onChange={e => updateField(idx, 'label', e.target.value)} style={{ fontSize: 12 }} />
                          </div>
                          <div className="col-md-3">
                            <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>NAMA FIELD</label>
                            <input className="form-control form-control-sm" placeholder="nama_field" value={field.name} onChange={e => updateField(idx, 'name', e.target.value)} style={{ fontSize: 12 }} />
                          </div>
                          <div className="col-md-3">
                            <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>TIPE</label>
                            <select className="form-select form-select-sm" value={field.type} onChange={e => updateField(idx, 'type', e.target.value)} style={{ fontSize: 12 }}>
                              {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="col-md-2 d-flex align-items-end gap-2">
                            <div className="form-check mt-3">
                              <input className="form-check-input" type="checkbox" id={`req-${idx}`} checked={field.required} onChange={e => updateField(idx, 'required', e.target.checked)} />
                              <label className="form-check-label" htmlFor={`req-${idx}`} style={{ fontSize: 11 }}>Wajib</label>
                            </div>
                            <button type="button" onClick={() => removeField(idx)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 6, padding: '4px 8px', fontSize: 13, cursor: 'pointer', marginBottom: 1 }}><i className="bi bi-x-lg"></i></button>
                          </div>
                          {field.type === 'select' && (
                            <div className="col-12">
                              <label style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 3 }}>PILIHAN (pisahkan koma)</label>
                              <input className="form-control form-control-sm" placeholder="Opsi 1, Opsi 2, Opsi 3" value={field.options} onChange={e => updateField(idx, 'options', e.target.value)} style={{ fontSize: 12 }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: '#f5a623', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving?'not-allowed':'pointer', fontFamily: "'Inter',sans-serif", opacity: saving?0.8:1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width:14, height:14, borderWidth:2 }} />Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

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
