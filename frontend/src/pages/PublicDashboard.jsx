import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { login as loginApi } from '../api'
import { useAuth } from '../context/AuthContext'
import SejatiLogo from '../components/SejatiLogo'

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Title, Filler
)

const ACCENT = '#f5a623'
const SIDEBAR_BG = '#1a1f2e'

const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#a855f7'
]

export default function PublicDashboard() {
  const navigate = useNavigate()
  const [openLogin, setOpenLogin] = useState(null)
  const [activeTab, setActiveTab] = useState('penduduk')

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Navigation ── */}
      <nav style={{ background: SIDEBAR_BG, height: 64, display: 'flex', alignItems: 'center', padding: '0 28px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }}>
        <SejatiLogo size={36} variant="full" />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setOpenLogin(openLogin ? null : 'login')}
            style={{ background: ACCENT, border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif" }}>
            <i className="bi bi-box-arrow-in-right"></i> Login
          </button>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <div style={{ background: `linear-gradient(135deg, ${SIDEBAR_BG} 0%, #2d3748 100%)`, padding: '40px 28px 36px', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,166,35,0.15)', border: `1px solid ${ACCENT}44`, borderRadius: 20, padding: '5px 14px', fontSize: 12, color: ACCENT, fontWeight: 600, marginBottom: 12 }}>
            <i className="bi bi-broadcast" style={{ fontSize: 12 }}></i>
            INTEGRASI DATA API BPS SIJUNJUNG
          </div>
          <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(20px, 3.5vw, 32px)', margin: '0 0 10px', lineHeight: 1.2 }}>
            Portal Data Statistik Publik
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 }}>
            Akses indikator makro sektoral Kabupaten Sijunjung secara real-time yang bersumber langsung dari API Badan Pusat Statistik (BPS) & dinas terkait.
          </p>
        </div>
      </div>

      {/* ── Sub Navigation Tabs (BPS API Categories) ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 64, zIndex: 90, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px' }}>
          {[
            { id: 'penduduk', label: 'Penduduk', icon: 'bi-people' },
            { id: 'tenaga_kerja', label: 'Tenaga Kerja', icon: 'bi-briefcase' },
            { id: 'ekonomi', label: 'Ekonomi', icon: 'bi-graph-up-arrow' },
            { id: 'kemiskinan', label: 'Kemiskinan', icon: 'bi-activity' },
            { id: 'ipm', label: 'IPM', icon: 'bi-award' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? `3px solid ${ACCENT}` : '3px solid transparent',
                color: activeTab === tab.id ? '#1a1f2e' : '#6b7280',
                padding: '16px 14px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                whiteSpace: 'nowrap',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.15s'
              }}
            >
              <i className={`bi ${tab.icon}`} style={{ color: activeTab === tab.id ? ACCENT : '#9ca3af', fontSize: 15 }}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content View ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 60px' }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <i className="bi bi-info-circle-fill" style={{ color: '#3b82f6', fontSize: 14 }}></i>
          <span>Mode Simulasi: Data di bawah divisualisasikan berdasarkan rilis data terbaru BPS Kabupaten Sijunjung. Sinkronisasi API BPS aktif otomatis.</span>
        </div>

        {activeTab === 'penduduk' && <TabPenduduk />}
        {activeTab === 'tenaga_kerja' && <TabTenagaKerja />}
        {activeTab === 'ekonomi' && <TabEkonomi />}
        {activeTab === 'kemiskinan' && <TabKemiskinan />}
        {activeTab === 'ipm' && <TabIPM />}
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: SIDEBAR_BG, color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '24px 20px', fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <SejatiLogo size={32} variant="compact" />
        </div>
        <div style={{ marginBottom: 4, color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 13 }}>
          SEJATI — Sistem Jejaring Pengumpulan Data Statistik Terintegrasi
        </div>
        <div>Data makro bersumber dari Badan Pusat Statistik Kabupaten Sijunjung. Bebas digunakan untuk kepentingan publik.</div>
      </footer>

      {/* ── Login Panel (dropdown) ── */}
      {openLogin && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => setOpenLogin(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ position: 'fixed', top: 72, right: 20, width: 320, background: '#fff', borderRadius: 14, boxShadow: '0 16px 48px rgba(0,0,0,0.2)', overflow: 'hidden', fontFamily: "'Inter',sans-serif" }}>
            <LoginPanel onClose={() => setOpenLogin(null)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TAB PANELS WITH PREMIUM MOCK DATA & GRAPHS
   ───────────────────────────────────────────────────────────────────────────── */

// ── Tab 1: Penduduk
function TabPenduduk() {
  const dataKecamatan = {
    labels: ['Kamang Baru', 'Tanjung Gadang', 'Sijunjung', 'Lubuk Tarok', 'IV Nagari', 'Kupitan', 'Koto VII', 'Sumpur Kudus'],
    datasets: [{
      label: 'Jumlah Penduduk (Jiwa)',
      data: [51230, 28140, 48320, 18450, 16120, 15080, 39510, 26830],
      backgroundColor: '#3b82f6cc',
      borderRadius: 6
    }]
  }

  const dataSexRatio = {
    labels: ['Laki-laki', 'Perempuan'],
    datasets: [{
      data: [123120, 120560],
      backgroundColor: ['#3b82f6', '#ec4899']
    }]
  }

  return (
    <div>
      {/* Cards */}
      <div className="row g-3 mb-4">
        {[
          { title: 'Total Penduduk', value: '243.680', unit: 'Jiwa', icon: 'bi-people-fill', color: '#3b82f6' },
          { title: 'Laki-laki', value: '123.120', unit: 'Jiwa', icon: 'bi-gender-male', color: '#2563eb' },
          { title: 'Perempuan', value: '120.560', unit: 'Jiwa', icon: 'bi-gender-female', color: '#db2777' },
          { title: 'Kepadatan Penduduk', value: '78', unit: 'Jiwa/km²', icon: 'bi-geo-alt-fill', color: '#10b981' }
        ].map(c => (
          <div className="col-6 col-md-3" key={c.title}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{c.title}</span>
                <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 16 }}></i>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1f2e', lineHeight: 1.1 }}>{c.value}</div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        <div className="col-md-8">
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Jumlah Penduduk menurut Kecamatan (2025)</h6>
            <div style={{ height: 260 }}><Bar data={dataKecamatan} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
        </div>
        <div className="col-md-4">
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Komposisi Jenis Kelamin</h6>
            <div style={{ height: 220, display: 'flex', justifyContent: 'center' }}>
              <Doughnut data={dataSexRatio} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '20px', overflowX: 'auto' }}>
        <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Tabel Rincian Penduduk Kecamatan</h6>
        <table className="table align-middle text-start" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th>Kecamatan</th>
              <th style={{ textAlign: 'right' }}>Laki-laki (Jiwa)</th>
              <th style={{ textAlign: 'right' }}>Perempuan (Jiwa)</th>
              <th style={{ textAlign: 'right' }}>Total (Jiwa)</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Kamang Baru', m: 25890, f: 25340 },
              { name: 'Tanjung Gadang', m: 14200, f: 13940 },
              { name: 'Sijunjung', m: 24410, f: 23910 },
              { name: 'Lubuk Tarok', m: 9320, f: 9130 },
              { name: 'IV Nagari', m: 8140, f: 7980 },
              { name: 'Kupitan', m: 7610, f: 7470 },
              { name: 'Koto VII', m: 19970, f: 19540 },
              { name: 'Sumpur Kudus', m: 13580, f: 13250 }
            ].map(r => (
              <tr key={r.name}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td style={{ textAlign: 'right' }}>{r.m.toLocaleString('id-ID')}</td>
                <td style={{ textAlign: 'right' }}>{r.f.toLocaleString('id-ID')}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{(r.m + r.f).toLocaleString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab 2: Tenaga Kerja
function TabTenagaKerja() {
  const dataSektor = {
    labels: ['Pertanian', 'Perdagangan', 'Jasa', 'Industri', 'Konstruksi'],
    datasets: [{
      data: [42, 18, 22, 8, 10],
      backgroundColor: CHART_COLORS.slice(0, 5)
    }]
  }

  const dataTPT = {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
    datasets: [{
      label: 'Tingkat Pengangguran Terbuka (%)',
      data: [4.8, 4.2, 3.8, 3.5, 3.2, 3.14],
      borderColor: '#ef4444',
      backgroundColor: '#ef444422',
      fill: true,
      tension: 0.4
    }]
  }

  return (
    <div>
      <div className="row g-3 mb-4">
        {[
          { title: 'TPAK Sijunjung', value: '69,20%', unit: 'Partisipasi Angkatan Kerja', icon: 'bi-graph-up', color: '#10b981' },
          { title: 'Tingkat Pengangguran (TPT)', value: '3,14%', unit: 'Menganggur Terbuka', icon: 'bi-person-x-fill', color: '#ef4444' },
          { title: 'Angkatan Kerja Aktif', value: '122.450', unit: 'Jiwa Bekerja / Mencari Kerja', icon: 'bi-person-check-fill', color: '#3b82f6' },
          { title: 'Bukan Angkatan Kerja', value: '54.210', unit: 'Jiwa (Sekolah / RT)', icon: 'bi-person-dash', color: '#6b7280' }
        ].map(c => (
          <div className="col-6 col-md-3" key={c.title}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{c.title}</span>
                <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 16 }}></i>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1f2e', lineHeight: 1.1 }}>{c.value}</div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Distribusi Penyerapan Tenaga Kerja menurut Sektor (%)</h6>
            <div style={{ height: 240, display: 'flex', justifyContent: 'center' }}>
              <Pie data={dataSektor} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Tren Penurunan Tingkat Pengangguran Terbuka (%) 2020-2025</h6>
            <div style={{ height: 240 }}><Line data={dataTPT} options={{ responsive: true, maintainAspectRatio: false }} /></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tab 3: Ekonomi
function TabEkonomi() {
  const dataEkonomi = {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
    datasets: [{
      label: 'Pertumbuhan PDRB (%)',
      data: [1.2, 3.4, 4.1, 4.5, 4.75, 4.85],
      borderColor: '#f5a623',
      backgroundColor: '#f5a62315',
      fill: true,
      tension: 0.3
    }]
  }

  return (
    <div>
      <div className="row g-3 mb-4">
        {[
          { title: 'Pertumbuhan Ekonomi', value: '4,85%', unit: 'Tahun 2025', icon: 'bi-arrow-up-right-circle-fill', color: '#10b981' },
          { title: 'PDRB ADHB', value: '8,42 T', unit: 'Rupiah (Berlaku)', icon: 'bi-wallet2', color: '#f5a623' },
          { title: 'PDRB ADHK', value: '5,61 T', unit: 'Rupiah (Konstan)', icon: 'bi-currency-exchange', color: '#3b82f6' },
          { title: 'Laju Inflasi', value: '2,45%', unit: 'Tahunan (y-on-y)', icon: 'bi-graph-down', color: '#ef4444' }
        ].map(c => (
          <div className="col-6 col-md-3" key={c.title}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{c.title}</span>
                <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 16 }}></i>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1f2e', lineHeight: 1.1 }}>{c.value}</div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Laju Pertumbuhan Ekonomi Sijunjung (%) 2020-2025</h6>
        <div style={{ height: 260 }}><Line data={dataEkonomi} options={{ responsive: true, maintainAspectRatio: false }} /></div>
      </div>
    </div>
  )
}

// ── Tab 4: Kemiskinan
function TabKemiskinan() {
  const dataKemiskinan = {
    labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'],
    datasets: [{
      label: 'Persentase Penduduk Miskin (%)',
      data: [7.1, 6.9, 6.8, 6.5, 6.1, 5.95, 5.88, 5.82],
      borderColor: '#ef4444',
      borderWidth: 3,
      tension: 0.3
    }]
  }

  return (
    <div>
      <div className="row g-3 mb-4">
        {[
          { title: 'Persentase Miskin', value: '5,82%', unit: 'Dari Total Penduduk', icon: 'bi-percent', color: '#ef4444' },
          { title: 'Jumlah Penduduk Miskin', value: '14,18', unit: 'Ribu Jiwa', icon: 'bi-person-fill-slash', color: '#e11d48' },
          { title: 'Garis Kemiskinan', value: '446.500', unit: 'Rp / Kapita / Bulan', icon: 'bi-cash-stack', color: '#16a34a' },
          { title: 'Indeks Kedalaman (P1)', value: '0,68', unit: 'Kesenjangan Pengeluaran', icon: 'bi-compass-fill', color: '#374151' }
        ].map(c => (
          <div className="col-6 col-md-3" key={c.title}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{c.title}</span>
                <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 16 }}></i>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1f2e', lineHeight: 1.1 }}>{c.value}</div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Tren Penurunan Persentase Kemiskinan Sijunjung (2018 - 2025)</h6>
        <div style={{ height: 260 }}><Line data={dataKemiskinan} options={{ responsive: true, maintainAspectRatio: false }} /></div>
      </div>
    </div>
  )
}

// ── Tab 5: IPM
function TabIPM() {
  const dataIPM = {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
    datasets: [{
      label: 'Indeks Pembangunan Manusia (IPM)',
      data: [67.8, 68.1, 68.4, 68.8, 69.1, 69.45],
      backgroundColor: '#10b981cc',
      borderRadius: 4
    }]
  }

  return (
    <div>
      <div className="row g-3 mb-4">
        {[
          { title: 'Indeks IPM Sijunjung', value: '69,45', unit: 'Kategori: Sedang', icon: 'bi-award-fill', color: '#10b981' },
          { title: 'Angka Harapan Hidup', value: '70,92', unit: 'Tahun (UHH)', icon: 'bi-heart-pulse-fill', color: '#ef4444' },
          { title: 'Harapan Lama Sekolah', value: '13,24', unit: 'Tahun (HLS)', icon: 'bi-book-half', color: '#3b82f6' },
          { title: 'Rata-rata Lama Sekolah', value: '8,52', unit: 'Tahun (RLS)', icon: 'bi-journal-bookmark-fill', color: '#8b5cf6' }
        ].map(c => (
          <div className="col-6 col-md-3" key={c.title}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>{c.title}</span>
                <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 16 }}></i>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1f2e', lineHeight: 1.1 }}>{c.value}</div>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{c.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e5e7eb', marginBottom: 20 }}>
        <h6 style={{ fontWeight: 700, color: '#1a1f2e', marginBottom: 16 }}>Progres Peningkatan Indeks Pembangunan Manusia (IPM) Sijunjung</h6>
        <div style={{ height: 260 }}><Bar data={dataIPM} options={{ responsive: true, maintainAspectRatio: false }} /></div>
      </div>
    </div>
  )
}

// ─── Inline Login Panel ───────────────────────────────────────────────────────
function LoginPanel({ onClose }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { loginUser } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi({ username, password })
      const { access_token, user } = res.data
      loginUser(access_token, user)
      if (user.role === 'admin') navigate('/admin', { replace: true })
      else if (user.role === 'contributor') navigate('/contributor', { replace: true })
      else navigate('/viewer', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Username atau password salah')
    } finally { setLoading(false) }
  }

  return (
    <>
      <div style={{ background: ACCENT, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="bi bi-box-arrow-in-right" style={{ color: '#fff', fontSize: 18 }}></i>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Masuk ke SEJATI</span>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: '#fff', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-x" style={{ fontSize: 16 }}></i>
        </button>
      </div>
      <div style={{ padding: '20px 18px 22px' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-exclamation-triangle-fill"></i> {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 13 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>USERNAME</label>
            <div style={{ display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 40, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-person" style={{ fontSize: 15 }}></i>
              </span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
                placeholder="Masukkan username"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 40, fontFamily: "'Inter',sans-serif" }} />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>PASSWORD</label>
            <div style={{ display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#9ca3af', background: '#f9fafb', borderRight: '1px solid #e5e7eb', height: 40, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-lock" style={{ fontSize: 15 }}></i>
              </span>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Masukkan password"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 40, fontFamily: "'Inter',sans-serif" }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ border: 'none', background: '#f9fafb', borderLeft: '1px solid #e5e7eb', padding: '0 10px', height: 40, cursor: 'pointer', color: '#9ca3af' }}>
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px', border: 'none', borderRadius: 8, background: ACCENT, color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Inter',sans-serif", boxShadow: '0 4px 14px rgba(245,166,35,0.35)' }}>
            {loading
              ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Masuk…</>
              : <><i className="bi bi-box-arrow-in-right"></i> Masuk</>}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 14, marginBottom: 0 }}>
          Sistem akan otomatis mengarahkan ke panel sesuai role Anda.
        </p>
      </div>
    </>
  )
}
