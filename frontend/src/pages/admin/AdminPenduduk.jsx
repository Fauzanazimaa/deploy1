import React, { useEffect, useState, useCallback } from 'react'
import api from '../../api'

// 8 kecamatan resmi Kabupaten Sijunjung
const KECAMATAN_LIST = [
  'Kamang Baru',
  'Tanjung Gadang',
  'Sijunjung',
  'Lubuk Tarok',
  'IV Nagari',
  'Kupitan',
  'Koto Tujuh',
  'Sumpur Kudus',
]

const KELOMPOK_UMUR_LIST = [
  '0-4', '5-9', '10-14', '15-19', '20-24', '25-29',
  '30-34', '35-39', '40-44', '45-49', '50-54', '55-59',
  '60-64', '65-69', '70-74', '75+',
]

const TABS = [
  { key: 'jk',   label: 'Jenis Kelamin', icon: 'bi-gender-ambiguous' },
  { key: 'umur', label: 'Kelompok Umur',  icon: 'bi-person-lines-fill' },
  { key: 'kec',  label: 'Kecamatan',      icon: 'bi-geo-alt-fill' },
]

function Loading() {
  return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" />
    </div>
  )
}

function AlertMsg({ type, msg, onClose }) {
  if (!msg) return null
  return (
    <div className={`alert alert-${type} alert-dismissible d-flex align-items-center gap-2`}>
      <i className={`bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
      <span>{msg}</span>
      <button className="btn-close" onClick={onClose}></button>
    </div>
  )
}

// ─── Tab: Jenis Kelamin ───────────────────────────────────────────────────────
function TabJK() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [alert,   setAlert]   = useState({ type: '', msg: '' })
  const [form,    setForm]    = useState({ tahun: new Date().getFullYear(), laki_laki: '', perempuan: '' })
  const [saving,  setSaving]  = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/penduduk/jk')
      .then(r => setRows(r.data))
      .catch(() => setAlert({ type: 'danger', msg: 'Gagal memuat data' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.tahun) return setAlert({ type: 'danger', msg: 'Tahun wajib diisi' })
    setSaving(true)
    try {
      await api.post('/admin/penduduk/jk', {
        tahun:     parseInt(form.tahun),
        laki_laki: parseInt(form.laki_laki) || 0,
        perempuan: parseInt(form.perempuan) || 0,
      })
      setAlert({ type: 'success', msg: `Data tahun ${form.tahun} tersimpan` })
      setForm({ tahun: new Date().getFullYear(), laki_laki: '', perempuan: '' })
      load()
    } catch (err) {
      setAlert({ type: 'danger', msg: err?.response?.data?.error || 'Gagal menyimpan' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (tahun) => {
    if (!window.confirm(`Hapus data tahun ${tahun}?`)) return
    setDeleting(tahun)
    try {
      await api.delete(`/admin/penduduk/jk/${tahun}`)
      setAlert({ type: 'success', msg: `Data tahun ${tahun} dihapus` })
      load()
    } catch { setAlert({ type: 'danger', msg: 'Gagal menghapus' }) }
    finally { setDeleting(null) }
  }

  const editRow = (row) => setForm({ tahun: row.tahun, laki_laki: row.laki_laki, perempuan: row.perempuan })

  return (
    <div className="row g-4">
      <div className="col-md-4">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 pt-3 pb-0">
            <h6 className="fw-semibold mb-0">Input / Update Data</h6>
            <p className="text-muted small mb-0">Isi tahun dan jumlah penduduk laki-laki serta perempuan</p>
          </div>
          <div className="card-body">
            <AlertMsg {...alert} onClose={() => setAlert({ type: '', msg: '' })} />
            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Tahun <span className="text-danger">*</span></label>
                <input type="number" className="form-control" min="2000" max="2100"
                  value={form.tahun} onChange={e => setForm({ ...form, tahun: e.target.value })} required />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Laki-laki (jiwa)</label>
                <input type="number" className="form-control" min="0"
                  value={form.laki_laki} onChange={e => setForm({ ...form, laki_laki: e.target.value })}
                  placeholder="0" />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Perempuan (jiwa)</label>
                <input type="number" className="form-control" min="0"
                  value={form.perempuan} onChange={e => setForm({ ...form, perempuan: e.target.value })}
                  placeholder="0" />
              </div>
              <button type="submit" className="btn btn-primary w-100" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-save me-2"></i>}
                Simpan
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="col-md-8">
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-0 pt-3">
            <h6 className="fw-semibold mb-0">Data Tersimpan</h6>
          </div>
          {loading ? <Loading /> : (
            <div className="card-body p-0">
              {!rows.length ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-inbox display-5 d-block mb-2"></i>
                  <p className="small">Belum ada data. Silakan input di form kiri.</p>
                </div>
              ) : (
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr><th>Tahun</th><th className="text-end">Laki-laki</th><th className="text-end">Perempuan</th><th className="text-end">Total</th><th></th></tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.tahun}>
                        <td className="fw-semibold">{r.tahun}</td>
                        <td className="text-end">{(r.laki_laki ?? 0).toLocaleString('id-ID')}</td>
                        <td className="text-end">{(r.perempuan ?? 0).toLocaleString('id-ID')}</td>
                        <td className="text-end fw-bold">{((r.laki_laki ?? 0) + (r.perempuan ?? 0)).toLocaleString('id-ID')}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => editRow(r)} title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(r.tahun)}
                            disabled={deleting === r.tahun} title="Hapus">
                            {deleting === r.tahun
                              ? <span className="spinner-border spinner-border-sm" />
                              : <i className="bi bi-trash"></i>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Kelompok Umur ───────────────────────────────────────────────────────
function TabUmur() {
  const [savedRows, setSavedRows] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [alert,     setAlert]     = useState({ type: '', msg: '' })
  const [tahun,     setTahun]     = useState(String(new Date().getFullYear()))
  // inputGrid: { [kelompok_umur]: { laki_laki, perempuan } }
  const initGrid = () => Object.fromEntries(KELOMPOK_UMUR_LIST.map(ku => [ku, { laki_laki: '', perempuan: '' }]))
  const [grid,  setGrid]  = useState(initGrid)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/penduduk/umur')
      .then(r => setSavedRows(r.data))
      .catch(() => setAlert({ type: 'danger', msg: 'Gagal memuat data' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Saat tahun berubah, isi grid dari data tersimpan (jika ada)
  useEffect(() => {
    const t = parseInt(tahun)
    const newGrid = initGrid()
    savedRows.filter(r => r.tahun === t).forEach(r => {
      if (newGrid[r.kelompok_umur]) {
        newGrid[r.kelompok_umur] = { laki_laki: r.laki_laki ?? '', perempuan: r.perempuan ?? '' }
      }
    })
    setGrid(newGrid)
  }, [tahun, savedRows])

  const setCell = (ku, field, val) =>
    setGrid(g => ({ ...g, [ku]: { ...g[ku], [field]: val } }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!tahun) return setAlert({ type: 'danger', msg: 'Tahun wajib diisi' })
    setSaving(true)
    try {
      const payload = KELOMPOK_UMUR_LIST.map(ku => ({
        tahun: parseInt(tahun),
        kelompok_umur: ku,
        laki_laki: parseInt(grid[ku].laki_laki) || 0,
        perempuan: parseInt(grid[ku].perempuan) || 0,
      }))
      await api.post('/admin/penduduk/umur', payload)
      setAlert({ type: 'success', msg: `${KELOMPOK_UMUR_LIST.length} kelompok umur tahun ${tahun} tersimpan` })
      load()
    } catch (err) {
      setAlert({ type: 'danger', msg: err?.response?.data?.error || 'Gagal menyimpan' })
    } finally { setSaving(false) }
  }

  const tahunList = [...new Set(savedRows.map(r => r.tahun))].sort()

  const totalLk = KELOMPOK_UMUR_LIST.reduce((s, ku) => s + (parseInt(grid[ku].laki_laki) || 0), 0)
  const totalPr = KELOMPOK_UMUR_LIST.reduce((s, ku) => s + (parseInt(grid[ku].perempuan) || 0), 0)

  return (
    <div>
      <AlertMsg {...alert} onClose={() => setAlert({ type: '', msg: '' })} />
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 d-flex flex-wrap align-items-center gap-3">
          <h6 className="fw-semibold mb-0 me-auto">Input Data per Kelompok Umur</h6>
          <div className="d-flex align-items-center gap-2">
            <label className="small fw-semibold mb-0">Tahun:</label>
            <input type="number" className="form-control form-control-sm" style={{ width: 90 }}
              min="2000" max="2100" value={tahun} onChange={e => setTahun(e.target.value)} />
          </div>
          {tahunList.length > 0 && (
            <div className="d-flex flex-wrap gap-1">
              {tahunList.map(t => (
                <button key={t} type="button"
                  className={`btn btn-xs btn-sm py-0 ${parseInt(tahun) === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontSize: 11 }} onClick={() => setTahun(String(t))}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        {loading ? <Loading /> : (
          <form onSubmit={handleSave}>
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: 110 }}>Kelompok Umur</th>
                    <th className="text-center" style={{ color: '#3b82f6' }}>Laki-laki (jiwa)</th>
                    <th className="text-center" style={{ color: '#ec4899' }}>Perempuan (jiwa)</th>
                    <th className="text-center text-muted">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {KELOMPOK_UMUR_LIST.map(ku => {
                    const lk = parseInt(grid[ku].laki_laki) || 0
                    const pr = parseInt(grid[ku].perempuan) || 0
                    return (
                      <tr key={ku}>
                        <td className="fw-semibold">{ku}</td>
                        <td>
                          <input type="number" className="form-control form-control-sm text-end" min="0"
                            placeholder="0" value={grid[ku].laki_laki}
                            onChange={e => setCell(ku, 'laki_laki', e.target.value)} />
                        </td>
                        <td>
                          <input type="number" className="form-control form-control-sm text-end" min="0"
                            placeholder="0" value={grid[ku].perempuan}
                            onChange={e => setCell(ku, 'perempuan', e.target.value)} />
                        </td>
                        <td className="text-end fw-semibold text-muted">
                          {(lk + pr).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td>Total</td>
                    <td className="text-end" style={{ color: '#3b82f6' }}>{totalLk.toLocaleString('id-ID')}</td>
                    <td className="text-end" style={{ color: '#ec4899' }}>{totalPr.toLocaleString('id-ID')}</td>
                    <td className="text-end">{(totalLk + totalPr).toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="p-3 border-top d-flex justify-content-end">
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-save me-2"></i>}
                Simpan Semua ({tahun})
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Kecamatan ───────────────────────────────────────────────────────────
function TabKec() {
  const [savedRows, setSavedRows] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [alert,     setAlert]     = useState({ type: '', msg: '' })
  const [tahun,     setTahun]     = useState(String(new Date().getFullYear()))
  const initGrid = () => Object.fromEntries(KECAMATAN_LIST.map(kec => [kec, { laki_laki: '', perempuan: '' }]))
  const [grid,  setGrid]  = useState(initGrid)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/admin/penduduk/kecamatan')
      .then(r => setSavedRows(r.data))
      .catch(() => setAlert({ type: 'danger', msg: 'Gagal memuat data' }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  // Saat tahun berubah, isi grid dari data tersimpan
  useEffect(() => {
    const t = parseInt(tahun)
    const newGrid = initGrid()
    savedRows.filter(r => r.tahun === t).forEach(r => {
      if (newGrid[r.kecamatan]) {
        newGrid[r.kecamatan] = { laki_laki: r.laki_laki ?? '', perempuan: r.perempuan ?? '' }
      }
    })
    setGrid(newGrid)
  }, [tahun, savedRows])

  const setCell = (kec, field, val) =>
    setGrid(g => ({ ...g, [kec]: { ...g[kec], [field]: val } }))

  const handleSave = async (e) => {
    e.preventDefault()
    if (!tahun) return setAlert({ type: 'danger', msg: 'Tahun wajib diisi' })
    setSaving(true)
    try {
      const payload = KECAMATAN_LIST.map(kec => ({
        tahun: parseInt(tahun),
        kecamatan: kec,
        laki_laki: parseInt(grid[kec].laki_laki) || 0,
        perempuan: parseInt(grid[kec].perempuan) || 0,
      }))
      await api.post('/admin/penduduk/kecamatan', payload)
      setAlert({ type: 'success', msg: `${KECAMATAN_LIST.length} kecamatan tahun ${tahun} tersimpan` })
      load()
    } catch (err) {
      setAlert({ type: 'danger', msg: err?.response?.data?.error || 'Gagal menyimpan' })
    } finally { setSaving(false) }
  }

  const tahunList = [...new Set(savedRows.map(r => r.tahun))].sort()

  const totalLk = KECAMATAN_LIST.reduce((s, kec) => s + (parseInt(grid[kec].laki_laki) || 0), 0)
  const totalPr = KECAMATAN_LIST.reduce((s, kec) => s + (parseInt(grid[kec].perempuan) || 0), 0)

  return (
    <div>
      <AlertMsg {...alert} onClose={() => setAlert({ type: '', msg: '' })} />
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 pt-3 d-flex flex-wrap align-items-center gap-3">
          <h6 className="fw-semibold mb-0 me-auto">Input Data per Kecamatan</h6>
          <div className="d-flex align-items-center gap-2">
            <label className="small fw-semibold mb-0">Tahun:</label>
            <input type="number" className="form-control form-control-sm" style={{ width: 90 }}
              min="2000" max="2100" value={tahun} onChange={e => setTahun(e.target.value)} />
          </div>
          {tahunList.length > 0 && (
            <div className="d-flex flex-wrap gap-1">
              {tahunList.map(t => (
                <button key={t} type="button"
                  className={`btn btn-sm py-0 ${parseInt(tahun) === t ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ fontSize: 11 }} onClick={() => setTahun(String(t))}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
        {loading ? <Loading /> : (
          <form onSubmit={handleSave}>
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Kecamatan</th>
                    <th className="text-center" style={{ color: '#3b82f6' }}>Laki-laki (jiwa)</th>
                    <th className="text-center" style={{ color: '#ec4899' }}>Perempuan (jiwa)</th>
                    <th className="text-center text-muted">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {KECAMATAN_LIST.map(kec => {
                    const lk = parseInt(grid[kec].laki_laki) || 0
                    const pr = parseInt(grid[kec].perempuan) || 0
                    return (
                      <tr key={kec}>
                        <td className="fw-semibold">{kec}</td>
                        <td>
                          <input type="number" className="form-control form-control-sm text-end" min="0"
                            placeholder="0" value={grid[kec].laki_laki}
                            onChange={e => setCell(kec, 'laki_laki', e.target.value)} />
                        </td>
                        <td>
                          <input type="number" className="form-control form-control-sm text-end" min="0"
                            placeholder="0" value={grid[kec].perempuan}
                            onChange={e => setCell(kec, 'perempuan', e.target.value)} />
                        </td>
                        <td className="text-end fw-semibold text-muted">
                          {(lk + pr).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td>Total</td>
                    <td className="text-end" style={{ color: '#3b82f6' }}>{totalLk.toLocaleString('id-ID')}</td>
                    <td className="text-end" style={{ color: '#ec4899' }}>{totalPr.toLocaleString('id-ID')}</td>
                    <td className="text-end">{(totalLk + totalPr).toLocaleString('id-ID')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="p-3 border-top d-flex justify-content-end">
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-save me-2"></i>}
                Simpan Semua ({tahun})
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function AdminPenduduk() {
  const [activeTab, setActiveTab] = useState('jk')

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="bi bi-people-fill" style={{ color: '#f5a623' }}></i>
          Data Penduduk Kabupaten Sijunjung
        </h4>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
          Kelola data kependudukan — jenis kelamin, kelompok umur, dan per kecamatan dari tahun ke tahun
        </p>
      </div>

      {/* Info */}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
        <i className="bi bi-info-circle-fill" style={{ color: '#f5a623', fontSize: 18, flexShrink: 0, marginTop: 1 }}></i>
        <div style={{ fontSize: 13, color: '#92400e' }}>
          <strong>8 Kecamatan Kabupaten Sijunjung:</strong>{' '}{KECAMATAN_LIST.join(' · ')}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #f0f0f0', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 18px', fontSize: 13, fontWeight: 600,
            color: activeTab === tab.key ? '#f5a623' : '#6b7280', fontFamily: "'Inter',sans-serif",
            borderBottom: activeTab === tab.key ? '2px solid #f5a623' : '2px solid transparent',
            marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <i className={`bi ${tab.icon}`}></i>{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'jk'   && <TabJK />}
      {activeTab === 'umur' && <TabUmur />}
      {activeTab === 'kec'  && <TabKec />}
    </div>
  )
}
