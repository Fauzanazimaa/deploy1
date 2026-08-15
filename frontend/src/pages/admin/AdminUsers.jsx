import React, { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../../api'

const emptyForm = { username: '', email: '', password: '', role: 'contributor', is_active: true, whatsapp: '' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showPassword, setShowPassword] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({})

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSendCredentialsWa = (u) => {
    let phone = u.whatsapp || ''
    if (!phone) {
      alert(`Pengguna ${u.username} belum memiliki nomor WhatsApp terdaftar.`)
      return
    }

    phone = phone.replace(/[^0-9]/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.slice(1)
    } else if (phone.startsWith('8')) {
      phone = '62' + phone
    }

    let message = `*INFORMASI AKUN APLIKASI SEJATI BPS KABUPATEN SIJUNJUNG*\n\n`
    message += `Yth. Kontributor *${u.username}*,\n`
    message += `Berikut detail akun Anda untuk masuk ke aplikasi SEJATI BPS Kabupaten Sijunjung:\n\n`
    message += `Link Aplikasi: https://sejati-sijunjung.vercel.app/\n`
    message += `Username: *${u.username}*\n`
    message += `Password: *${u.password_plain || '(silakan hubungi admin untuk set ulang)'}*\n\n`
    message += `Mohon simpan informasi ini baik-baik. Terima kasih.`

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  const fetchUsers = async () => {
    try {
      const res = await getUsers()
      setUsers(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const openCreate = () => {
    setEditUser(null)
    setForm(emptyForm)
    setShowPassword(false)
    setError('')
    setShowModal(true)
  }

  const openEdit = (u) => {
    setEditUser(u)
    setForm({ username: u.username, email: u.email, password: u.password_plain || '', role: u.role, is_active: u.is_active, whatsapp: u.whatsapp || '' })
    setShowPassword(false)
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editUser) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await updateUser(editUser.id, payload)
      } else {
        await createUser(form)
      }
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.error || 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Hapus pengguna "${u.username}"?`)) return
    try {
      await deleteUser(u.id)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus')
    }
  }

  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status')
    }
  }

  const filtered = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.whatsapp || '').includes(search)
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const roleBadgeStyle = {
    admin:       { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    contributor: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
    viewer:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  }
  const ACCENT = '#f5a623'

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h4 style={{ fontWeight: 700, fontSize: 20, color: '#1a1f2e', margin: 0 }}>Kelola Pengguna</h4>
          <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Tambah, edit, dan kelola akun pengguna beserta nomor WhatsApp</p>
        </div>
        <button
          onClick={openCreate}
          style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Inter', sans-serif" }}
        >
          <i className="bi bi-plus-lg"></i> Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="row g-2">
          <div className="col-md-6">
            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <span style={{ padding: '0 12px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 38, display: 'flex', alignItems: 'center' }}><i className="bi bi-search"></i></span>
              <input style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter', sans-serif" }} placeholder="Cari username, email, atau no WA..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ fontSize: 13, height: 38, fontFamily: "'Inter', sans-serif" }}>
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="contributor">Contributor</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-center">
            <span style={{ color: '#6b7280', fontSize: 13 }}>{filtered.length} pengguna ditemukan</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${ACCENT}30`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  {['#', 'Username', 'Password', 'Email', 'No WhatsApp', 'Role', 'Status', 'Bergabung', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: h === '' ? 'right' : 'left', fontWeight: 600, color: '#6b7280', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                   <tr><td colSpan={9} style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 13 }}>Tidak ada pengguna</td></tr>
                ) : (
                  filtered.map((u, i) => {
                    const rb = roleBadgeStyle[u.role] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f9f9f9' }} className="table-row-hover">
                        <td style={{ padding: '11px 20px', color: '#9ca3af', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ padding: '11px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: rb.bg, border: `1px solid ${rb.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: rb.color, fontSize: 13 }}>
                              {u.username[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, color: '#1a1f2e' }}>{u.username}</span>
                          </div>
                        </td>
                        <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>
                          {u.role === 'admin' ? (
                            <span style={{ color: '#d1d5db' }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{visiblePasswords[u.id] ? (u.password_plain || '—') : '••••••'}</span>
                              {u.password_plain && (
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(u.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}
                                >
                                  <i className={`bi ${visiblePasswords[u.id] ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{u.email}</td>
                        <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>
                          {u.whatsapp ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <i className="bi bi-whatsapp text-success"></i>
                              {u.whatsapp}
                            </span>
                          ) : (
                            <span style={{ color: '#d1d5db' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '11px 20px' }}>
                          <span style={{ background: rb.bg, border: `1px solid ${rb.border}`, color: rb.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{u.role}</span>
                        </td>
                        <td style={{ padding: '11px 20px' }}>
                          <span style={{ background: u.is_active ? '#f0fdf4' : '#f9fafb', border: `1px solid ${u.is_active ? '#bbf7d0' : '#e5e7eb'}`, color: u.is_active ? '#16a34a' : '#6b7280', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                            {u.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 20px', color: '#6b7280', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                        <td style={{ padding: '11px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {u.role === 'contributor' && u.whatsapp && (
                              <button onClick={() => handleSendCredentialsWa(u)} title="Kirim Akun ke WA" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}>
                                <i className="bi bi-whatsapp"></i>
                              </button>
                            )}
                            <button onClick={() => handleToggleActive(u)} title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: u.is_active ? '#16a34a' : '#6b7280', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}>
                              <i className={`bi ${u.is_active ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                            </button>
                            <button onClick={() => openEdit(u)} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => handleDelete(u)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '5px 10px', fontSize: 14, cursor: 'pointer' }}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
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

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '100%', maxWidth: 480, overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1f2e' }}>{editUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}><i className="bi bi-x"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>{error}</div>}
                
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>USERNAME <span style={{ color: '#dc2626' }}> *</span></label>
                  <input type="text" style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>EMAIL <span style={{ color: '#dc2626' }}> *</span></label>
                  <input type="email" style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>NOMOR WHATSAPP</label>
                  <input type="text" placeholder="contoh: 08123456789 atau 628123456789" style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
                  <span style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Masukkan nomor WhatsApp aktif kontributor.</span>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>{editUser ? 'PASSWORD (KOSONGKAN JIKA TIDAK DIUBAH)' : 'PASSWORD'}{!editUser && <span style={{ color: '#dc2626' }}> *</span>}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 40px 8px 12px', fontSize: 13, outline: 'none', fontFamily: "'Inter', sans-serif" }} 
                      value={form.password} 
                      onChange={e => setForm({ ...form, password: e.target.value })} 
                      required={!editUser} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 16 }}></i>
                    </button>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>ROLE <span style={{ color: '#dc2626' }}>*</span></label>
                    <select className="form-select" style={{ fontSize: 13 }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="admin">Admin</option>
                      <option value="contributor">Contributor</option>
                    </select>
                  </div>
                  <div className="col-6">
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>STATUS</label>
                    <select className="form-select" style={{ fontSize: 13 }} value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #f0f0f0', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Batal</button>
                <button type="submit" disabled={saving} style={{ background: ACCENT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Inter', sans-serif", opacity: saving ? 0.8 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {saving ? <><span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.table-row-hover:hover { background: #fafafa; }`}</style>
    </div>
  )
}
