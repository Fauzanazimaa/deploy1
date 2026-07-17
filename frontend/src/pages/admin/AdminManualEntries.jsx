import React, { useEffect, useState } from 'react'
import { getManualEntries, createManualEntry, deleteManualEntry, getDataTypes } from '../../api'

export default function AdminManualEntries() {
  const [entries, setEntries] = useState([])
  const [dataTypes, setDataTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDT, setSelectedDT] = useState('')
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterDT, setFilterDT] = useState('all')
  const [detailEntry, setDetailEntry] = useState(null)

  const fetchAll = async () => {
    try {
      const [eRes, dtRes] = await Promise.all([getManualEntries(), getDataTypes()])
      setEntries(eRes.data)
      setDataTypes(dtRes.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const currentDT = dataTypes.find((dt) => dt.id === parseInt(selectedDT))

  const openCreate = () => {
    setSelectedDT('')
    setFormData({})
    setError('')
    setShowModal(true)
  }

  const handleDTChange = (dtId) => {
    setSelectedDT(dtId)
    setFormData({})
  }

  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedDT) return setError('Pilih jenis data')
    setSaving(true)
    setError('')
    try {
      await createManualEntry({
        data_type_id: parseInt(selectedDT),
        data: formData,
      })
      setShowModal(false)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus entri ini?')) return
    try {
      await deleteManualEntry(id)
      fetchAll()
    } catch {
      alert('Gagal menghapus')
    }
  }

  const filtered = entries.filter((e) =>
    filterDT === 'all' || e.data_type_id === parseInt(filterDT)
  )

  const renderFieldInput = (field) => {
    const value = formData[field.name] || ''
    const common = {
      className: 'form-control form-control-sm',
      value,
      onChange: (e) => handleFieldChange(field.name, e.target.value),
      required: field.required,
      id: `field-${field.name}`,
    }
    switch (field.type) {
      case 'textarea':
        return <textarea {...common} rows={3} />
      case 'select':
        return (
          <select {...common} className="form-select form-select-sm">
            <option value="">-- Pilih --</option>
            {(field.options || []).map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      case 'date':
        return <input type="date" {...common} />
      case 'number':
        return <input type="number" {...common} />
      case 'email':
        return <input type="email" {...common} />
      default:
        return <input type="text" {...common} />
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Entri Data Manual</h4>
          <p className="text-muted small mb-0">Tambahkan data secara langsung tanpa melalui pengiriman file</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i> Tambah Entri
        </button>
      </div>

      {/* Filter */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <select
                className="form-select"
                value={filterDT}
                onChange={(e) => setFilterDT(e.target.value)}
              >
                <option value="all">Semua Jenis Data</option>
                {dataTypes.map((dt) => (
                  <option key={dt.id} value={dt.id}>{dt.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-8 text-muted small">
              Menampilkan {filtered.length} entri
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Jenis Data</th>
                    <th>Data</th>
                    <th>Diinput Oleh</th>
                    <th>Tanggal</th>
                    <th className="text-end">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        Belum ada entri data manual
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entry, i) => {
                      const dataKeys = Object.keys(entry.data || {})
                      const preview = dataKeys.slice(0, 2).map((k) => `${k}: ${entry.data[k]}`).join(', ')
                      return (
                        <tr key={entry.id}>
                          <td className="text-muted">{i + 1}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {entry.data_type_name}
                            </span>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: 300 }}>
                              {preview || <span className="text-muted">-</span>}
                              {dataKeys.length > 2 && (
                                <span className="text-muted ms-1">+{dataKeys.length - 2} lainnya</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <i className="bi bi-shield-lock-fill text-danger small"></i>
                              {entry.entered_by_username}
                            </div>
                          </td>
                          <td className="text-muted">
                            {new Date(entry.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric'
                            })}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => setDetailEntry(entry)}
                              title="Lihat Detail"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(entry.id)}
                              title="Hapus"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Tambah Entri Data Manual</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger small py-2">{error}</div>}
                  <div className="mb-4">
                    <label className="form-label fw-semibold small">
                      Jenis Data <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={selectedDT}
                      onChange={(e) => handleDTChange(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih jenis data --</option>
                      {dataTypes.map((dt) => (
                        <option key={dt.id} value={dt.id}>{dt.name}</option>
                      ))}
                    </select>
                  </div>

                  {currentDT && (
                    <div>
                      <div className="d-flex align-items-center mb-3">
                        <span className="fw-semibold small">Isi Data</span>
                        <span className="badge bg-light text-dark border ms-2 small">{currentDT.name}</span>
                      </div>
                      {currentDT.fields_schema.length === 0 ? (
                        <div className="alert alert-warning small">
                          Jenis data ini belum memiliki field. Tambahkan field di menu Jenis Data.
                        </div>
                      ) : (
                        <div className="row g-3">
                          {currentDT.fields_schema.map((field) => (
                            <div className="col-md-6" key={field.name}>
                              <label htmlFor={`field-${field.name}`} className="form-label small fw-semibold">
                                {field.label || field.name}
                                {field.required && <span className="text-danger ms-1">*</span>}
                              </label>
                              {renderFieldInput(field)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving || !currentDT}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-1" />Menyimpan...</>
                      : 'Simpan Entri'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailEntry && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Detail Entri #{detailEntry.id}</h5>
                <button className="btn-close" onClick={() => setDetailEntry(null)} />
              </div>
              <div className="modal-body">
                <div className="mb-3 small text-muted">
                  <strong>Jenis Data:</strong> {detailEntry.data_type_name} •{' '}
                  <strong>Diinput:</strong> {detailEntry.entered_by_username} •{' '}
                  {new Date(detailEntry.created_at).toLocaleString('id-ID')}
                </div>
                <table className="table table-sm table-bordered small mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Field</th>
                      <th>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(detailEntry.data || {}).map(([k, v]) => (
                      <tr key={k}>
                        <td className="fw-semibold text-capitalize">{k.replace(/_/g, ' ')}</td>
                        <td>{v ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setDetailEntry(null)}>Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
