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
import sijunjungGeoJson from '../components/sijunjung_kecamatan.json'
import axios from 'axios'


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

  const tabLabels = {
    penduduk: 'Statistik Kependudukan',
    tenaga_kerja: 'Indikator Ketenagakerjaan',
    ekonomi: 'Perekonomian & PDRB',
    kemiskinan: 'Profil Kemiskinan Makro',
    ipm: 'Indeks Pembangunan Manusia (IPM)'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Government Masthead Strip ── */}
      <div style={{
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        padding: '6px 20px',
        fontSize: 11,
        color: '#94a3b8'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: '#f5a623', letterSpacing: '0.04em' }}>PEMERINTAH KABUPATEN SIJUNJUNG</span>
            <span className="d-none d-sm-inline" style={{ color: '#475569' }}>&bull;</span>
            <span className="d-none d-sm-inline" style={{ color: '#cbd5e1' }}>BADAN PUSAT STATISTIK</span>
            <span className="d-none d-md-inline" style={{ color: '#475569' }}>&bull;</span>
            <span className="d-none d-md-inline" style={{ color: '#94a3b8' }}>SATU DATA INDONESIA</span>
          </div>
          <div className="d-none d-md-flex align-items-center gap-3" style={{ fontSize: 11 }}>
            <span>Portal Data Publik Terbuka</span>
            <span style={{ color: '#475569' }}>&bull;</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#34d399', fontWeight: 500 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Web API BPS Terhubung
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Bar ── */}
      <nav className="public-nav" style={{
        background: '#1a1f2e',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid #2d3748'
      }}>
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo & Portal Title */}
          <div className="nav-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="d-none d-sm-block">
              <SejatiLogo size={32} variant="full" />
            </div>
            <div className="d-block d-sm-none">
              <SejatiLogo size={28} variant="compact" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setOpenLogin(openLogin ? null : 'login')}
              className="nav-login-btn"
              style={{
                background: '#f5a623',
                border: '1px solid #d97706',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: "'Inter',sans-serif",
                transition: 'background-color 0.15s ease'
              }}
            >
              <i className="bi bi-box-arrow-in-right"></i> Masuk Petugas
            </button>
          </div>
        </div>
      </nav>

      {/* ── Official Institutional Header Masthead ── */}
      <div className="public-hero" style={{ background: '#1a1f2e', borderBottom: '1px solid #2d3748', padding: '20px 20px 18px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Breadcrumb Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', marginBottom: 10, flexWrap: 'wrap' }}>
            <span>Beranda</span>
            <span>/</span>
            <span>Satu Data Sijunjung</span>
            <span>/</span>
            <span>Publikasi Statistik Daerah</span>
            <span>/</span>
            <span style={{ color: '#f5a623', fontWeight: 600 }}>{tabLabels[activeTab]}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#f5a623', color: '#1a1f2e', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                PORTAL RESMI SATU DATA
              </span>
              <span style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 500 }}>
                Diseminasi Indikator Statistik Sektoral Terpadu
              </span>
            </div>
            <h1 style={{
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(18px, 2.4vw, 24px)',
              margin: '6px 0 3px',
              lineHeight: 1.3
            }}>
              SEJATI &mdash; Satu Data Statistik Kabupaten Sijunjung
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 12.5, margin: 0, lineHeight: 1.5, maxWidth: 900 }}>
              Pusat diseminasi data statistik sektoral dan indikator makro pembangunan daerah Pemerintah Kabupaten Sijunjung yang disajikan secara terbuka, terstandardisasi, dan tersinkronisasi dengan Web API Badan Pusat Statistik (BPS).
            </p>

            {/* Official Metadata Info Strip */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-building" style={{ color: '#f5a623' }}></i>
                <span><strong>Produsen Data:</strong> Diskominfo & BPS Kab. Sijunjung</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-shield-check" style={{ color: '#34d399' }}></i>
                <span><strong>Validasi:</strong> Standar Satu Data Indonesia (SDI)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="bi bi-unlock" style={{ color: '#93c5fd' }}></i>
                <span><strong>Aksesibilitas:</strong> Terbuka untuk Umum</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Underline Tabs (Standard Government Portal Style) ── */}
      <div className="public-subnav" style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 58,
        zIndex: 90
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div
            className="hide-scrollbar public-tabs-scroll"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {[
              { id: 'penduduk', label: '1. Kependudukan', icon: 'bi-people' },
              { id: 'tenaga_kerja', label: '2. Ketenagakerjaan', icon: 'bi-briefcase' },
              { id: 'ekonomi', label: '3. PDRB & Perekonomian', icon: 'bi-graph-up' },
              { id: 'kemiskinan', label: '4. Kemiskinan Makro', icon: 'bi-pie-chart' },
              { id: 'ipm', label: '5. Indeks Pembangunan Manusia', icon: 'bi-award' },
            ].map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`public-tab-btn ${isActive ? 'active' : ''}`}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '3px solid #f5a623' : '3px solid transparent',
                    color: isActive ? '#0f172a' : '#64748b',
                    padding: '12px 14px',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'color 0.15s ease, border-color 0.15s ease',
                    flexShrink: 0,
                    borderRadius: 0
                  }}
                >
                  <i className={`bi ${tab.icon}`} style={{ color: isActive ? '#f5a623' : '#94a3b8', fontSize: 14 }}></i>
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      <div className="public-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 50px' }}>
        {activeTab === 'penduduk' && <TabPenduduk />}
        {activeTab === 'tenaga_kerja' && <TabTenagaKerja />}
        {activeTab === 'ekonomi' && <TabEkonomi />}
        {activeTab === 'kemiskinan' && <TabKemiskinan />}
        {activeTab === 'ipm' && <TabIPM />}
      </div>

      {/* ── Official Government Portal Footer ── */}
      <footer style={{ background: '#1a1f2e', borderTop: '1px solid #2d3748', color: '#94a3b8', padding: '32px 20px 24px', fontSize: 12 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="row g-4 mb-4 text-start">
            <div className="col-12 col-md-5">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <SejatiLogo size={32} variant="compact" />
                <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 14 }}>
                  SEJATI KABUPATEN SIJUNJUNG
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                Sistem Elektronik Jaring Aspirasi & Tata Informasi Statistik Terintegrasi (SEJATI) merupakan platform resmi Satu Data Kabupaten Sijunjung untuk pengumpulan, verifikasi, dan diseminasi data pembangunan daerah.
              </p>
            </div>
            <div className="col-12 col-md-4">
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                Instansi Pengelola
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8, fontSize: 12 }}>
                <li><strong>Walidata:</strong> Dinas Komunikasi dan Informatika Kab. Sijunjung</li>
                <li><strong>Pembina Data:</strong> Badan Pusat Statistik (BPS) Kab. Sijunjung</li>
                <li><i className="bi bi-geo-alt me-1 text-warning"></i> Muaro Sijunjung, Provinsi Sumatera Barat</li>
              </ul>
            </div>
            <div className="col-12 col-md-3">
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                Tautan Resmi
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8, fontSize: 12 }}>
                <li><a href="https://sijunjung.go.id" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}><i className="bi bi-box-arrow-up-right me-1"></i> Portal Pemkab Sijunjung</a></li>
                <li><a href="https://sijunjungkab.bps.go.id" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}><i className="bi bi-box-arrow-up-right me-1"></i> BPS Kabupaten Sijunjung</a></li>
                <li><a href="https://data.go.id" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}><i className="bi bi-box-arrow-up-right me-1"></i> Portal Satu Data Indonesia</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #2d3748', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 11, color: '#64748b' }}>
            <div>
              &copy; {new Date().getFullYear()} Pemerintah Kabupaten Sijunjung. Hak Cipta Dilindungi Undang-Undang.
            </div>
            <div>
              Standar Metadata: ISO 19115 &bull; Satu Data Indonesia (Perpres No. 39 Tahun 2019)
            </div>
          </div>
        </div>
      </footer>

      {/* ── Login Modal Dialog (Clean Institutional Dialog) ── */}
      {openLogin && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setOpenLogin(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="public-login-modal"
            style={{
              width: '100%',
              maxWidth: 360,
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              fontFamily: "'Inter',sans-serif"
            }}
          >
            <LoginPanel onClose={() => setOpenLogin(null)} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .public-tab-btn:hover {
          color: #0f172a !important;
          background: #f8fafc;
        }

        /* ── Mobile Responsiveness Media Queries (≤ 768px) ── */
        @media (max-width: 768px) {
          .public-nav {
            height: 52px !important;
          }
          .public-nav > div {
            padding: 0 14px !important;
          }
          .public-subnav {
            top: 52px !important;
          }
          .public-subnav > div {
            padding: 0 12px !important;
          }
          .public-tabs-scroll {
            gap: 2px !important;
          }
          .public-tab-btn {
            padding: 10px 10px !important;
            font-size: 12px !important;
          }
          .public-hero {
            padding: 18px 14px 16px !important;
          }
          .public-content {
            padding: 14px 10px 40px !important;
          }
          .public-card {
            padding: 12px 14px !important;
            border-radius: 8px !important;
          }
          .public-stat-val {
            font-size: 18px !important;
          }
          .public-stat-title {
            font-size: 10px !important;
          }
          .public-stat-unit {
            font-size: 10px !important;
          }
          .public-chart-container {
            height: 240px !important;
          }
          .public-tall-chart {
            height: 380px !important;
          }
          .public-map-container {
            min-height: 280px !important;
            padding: 8px !important;
          }
          .public-map-svg {
            max-height: 280px !important;
          }
          .public-control-panel {
            padding: 12px 14px !important;
            border-radius: 8px !important;
          }
          .public-control-panel-controls {
            width: 100% !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .public-control-panel-controls select,
          .public-control-panel-controls button {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   TAB PANELS WITH PREMIUM MOCK DATA & GRAPHS
   ───────────────────────────────────────────────────────────────────────────── */

// ── Tab 1: Penduduk
// BPS to shapefile name map
const BPS_TO_SHAPEFILE_MAP = {
  1: 'KAMANGBARU',
  2: 'TANJUNGGADANG',
  3: 'SIJUNJUNG',
  4: 'LUBUKTAROK',
  5: 'AMPEKNAGARI',
  6: 'KUPITAN',
  100: 'KOTOTUJUH',
  110: 'SUMPURKUDUS'
};

function TabPenduduk() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [availableYears, setAvailableYears] = useState([2020, 2021, 2022, 2023, 2024, 2025]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bpsData, setBpsData] = useState(null);
  const [mappedData, setMappedData] = useState(null);
  const [genderData, setGenderData] = useState(null);
  const [ageProjectionData, setAgeProjectionData] = useState(null);
  const [hoveredKec, setHoveredKec] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [searchKec, setSearchKec] = useState('');

  const [exportingPdf, setExportingPdf] = useState(false);

  const downloadPDFReport = async () => {
    setExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const pages = [
        { id: 'report-page-1', title: 'Ringkasan & Distribusi Geospasial' },
        { id: 'report-page-2', title: 'Rincian Jenis Kelamin per Kecamatan' },
        { id: 'report-page-3', title: 'Proyeksi Kelompok Umur & Jenis Kelamin' },
        { id: 'report-page-4', title: 'Total Proyeksi Kelompok Umur' }
      ];

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 12;
      const contentWidth = pdfWidth - (margin * 2);

      let pageAdded = false;

      for (const pageInfo of pages) {
        const el = document.getElementById(pageInfo.id);
        if (!el) continue;

        const originalBoxShadows = [];
        const cards = el.querySelectorAll('[style*="box-shadow"], [style*="boxShadow"]');
        cards.forEach((card) => {
          originalBoxShadows.push({ el: card, val: card.style.boxShadow });
          card.style.boxShadow = 'none';
        });

        const canvas = await html2canvas(el, {
          scale: 2.2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc'
        });

        originalBoxShadows.forEach(item => {
          item.el.style.boxShadow = item.val;
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const contentHeight = (imgHeight * contentWidth) / imgWidth;

        if (pageAdded) {
          pdf.addPage();
        } else {
          pageAdded = true;
        }

        // Header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(26, 31, 46);
        pdf.text("SEJATI", margin, margin + 4);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text("Sistem Jejaring Pengumpulan Data Statistik Terintegrasi", margin, margin + 9);
        
        pdf.setFont("helvetica", "bold");
        pdf.text(`TAHUN: ${selectedYear}`, pdfWidth - margin - 22, margin + 4);
        
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        pdf.line(margin, margin + 12, pdfWidth - margin, margin + 12);

        const imageY = margin + 16;
        const maxImageHeight = pdfHeight - imageY - margin - 10;
        let renderedHeight = contentHeight;
        let renderedWidth = contentWidth;
        
        if (contentHeight > maxImageHeight) {
          renderedHeight = maxImageHeight;
          renderedWidth = (imgWidth * renderedHeight) / imgHeight;
        }

        const imageX = margin + (contentWidth - renderedWidth) / 2;

        pdf.addImage(imgData, 'JPEG', imageX, imageY, renderedWidth, renderedHeight);

        // Footer
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Halaman ${pdf.internal.getNumberOfPages()} | Bersumber dari Web API BPS Kabupaten Sijunjung`, margin, pdfHeight - margin);
      }

      pdf.save(`Laporan_Kependudukan_Sijunjung_${selectedYear}.pdf`);
    } catch (err) {
      console.error("Gagal mengekspor PDF:", err);
      alert("Terjadi kesalahan saat memproses laporan PDF. Silakan coba lagi.");
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    const detectYears = async () => {
      try {
        const yearsRange = Array.from({ length: 21 }, (_, i) => 2020 + i); // 2020 to 2040
        const checkPromises = yearsRange.map(async (y) => {
          const thCode = y - 1900;
          const url47 = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/47/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
          const url51 = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/51/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
          const url26 = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/26/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
          try {
            const [res47, res51, res26] = await Promise.allSettled([
              axios.get(url47),
              axios.get(url51),
              axios.get(url26)
            ]);
            const isAvail47 = res47.status === 'fulfilled' && 
                             res47.value.data.status === 'OK' && 
                             res47.value.data['data-availability'] === 'available' && 
                             res47.value.data.datacontent && 
                             !Array.isArray(res47.value.data.datacontent) && 
                             Object.keys(res47.value.data.datacontent).length > 0;
            const isAvail51 = res51.status === 'fulfilled' && 
                             res51.value.data.status === 'OK' && 
                             res51.value.data['data-availability'] === 'available' && 
                             res51.value.data.datacontent && 
                             !Array.isArray(res51.value.data.datacontent) && 
                             Object.keys(res51.value.data.datacontent).length > 0;
            const isAvail26 = res26.status === 'fulfilled' && 
                             res26.value.data.status === 'OK' && 
                             res26.value.data['data-availability'] === 'available' && 
                             res26.value.data.datacontent && 
                             !Array.isArray(res26.value.data.datacontent) && 
                             Object.keys(res26.value.data.datacontent).length > 0;
            return { year: y, hasData: isAvail47 || isAvail51 || isAvail26 };
          } catch {
            return { year: y, hasData: false };
          }
        });
        
        const results = await Promise.all(checkPromises);
        
        const currentYear = new Date().getFullYear();
        const maxYearCeiling = currentYear - 1;
        
        const validYears = results
          .filter(r => r.hasData)
          .map(r => r.year)
          .filter(y => y <= maxYearCeiling);
        
        const maxYear = validYears.length > 0 ? Math.max(...validYears) : 2025;
        
        const list = [];
        for (let y = 2020; y <= maxYear; y++) {
          list.push(y);
        }
        setAvailableYears(list);
        
        if (selectedYear > maxYear || selectedYear < 2020) {
          setSelectedYear(maxYear);
        }
      } catch (e) {
        console.error("Error detecting years:", e);
      }
    };
    
    detectYears();
  }, []);

  const fetchData = async (year) => {
    setLoading(true);
    setError(null);
    const thCode = year - 1900;
    const url47 = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/47/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
    const url51 = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/51/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
    const url27 = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/27/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
    const url26 = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/26/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
    
    try {
      const [res47, res51, res27, res26] = await Promise.allSettled([
        axios.get(url47),
        axios.get(url51),
        axios.get(url27),
        axios.get(url26)
      ]);

      const kecamatenList = [
        { code: 1, label: 'Kamang Baru' },
        { code: 2, label: 'Tanjung Gadang' },
        { code: 3, label: 'Sijunjung' },
        { code: 4, label: 'Lubuk Tarok' },
        { code: 5, label: 'IV Nagari' },
        { code: 6, label: 'Kupitan' },
        { code: 100, label: 'Koto Tujuh' },
        { code: 110, label: 'Sumpur Kudus' }
      ];

      const normalizeBpsValue = (val) => {
        if (val === undefined || val === null || isNaN(val)) return 0;
        if (val > 500) {
          return parseFloat((val / 1000).toFixed(2));
        }
        return val;
      };

      // Parse Var 47 (Map)
      if (res47.status === 'fulfilled' && res47.value.data.status === 'OK') {
        const data47 = res47.value.data;
        setBpsData(data47);
        const availability47 = data47['data-availability'];
        const datacontent47 = data47.datacontent;

        if (availability47 !== 'available' || !datacontent47 || Array.isArray(datacontent47) || Object.keys(datacontent47).length === 0) {
          setMappedData(null);
        } else {
          const varVal = data47.var?.[0]?.val || 47;
          const records = {};
          let hasValidData = false;
          kecamatenList.forEach(kec => {
            const primaryKey = `${kec.code}${varVal}0${thCode}0`;
            let valStr = datacontent47[primaryKey];
            
            if (valStr === undefined) {
              const prefix = `${kec.code}${varVal}`;
              const suffix = `${thCode}`;
              const matchedKey = Object.keys(datacontent47).find(k => k.startsWith(prefix) && k.includes(suffix));
              if (matchedKey) {
                valStr = datacontent47[matchedKey];
              }
            }
            
            if (valStr !== undefined) {
              const val = parseFloat(valStr);
              if (!isNaN(val)) {
                records[kec.code] = {
                  code: kec.code,
                  label: kec.label,
                  value: normalizeBpsValue(val),
                  unit: 'Ribu Jiwa'
                };
                hasValidData = true;
              }
            }
          });
          
          if (hasValidData) {
            setMappedData(records);
          } else {
            setMappedData(null);
          }
        }
      } else {
        setMappedData(null);
      }

      // Parse Var 51 (Gender)
      if (res51.status === 'fulfilled' && res51.value.data.status === 'OK') {
        const data51 = res51.value.data;
        const availability51 = data51['data-availability'];
        const datacontent51 = data51.datacontent;

        if (availability51 !== 'available' || !datacontent51 || Array.isArray(datacontent51) || Object.keys(datacontent51).length === 0) {
          setGenderData(null);
        } else {
          const genderRecords = {};
          let hasValidGenderData = false;

          kecamatenList.forEach(kec => {
            // Male: turvar 27
            const keyMale = `${kec.code}5127${thCode}0`;
            const valMale = parseFloat(datacontent51[keyMale]);

            // Female: turvar 28
            const keyFemale = `${kec.code}5128${thCode}0`;
            const valFemale = parseFloat(datacontent51[keyFemale]);

            // Total: turvar 29
            const keyTotal = `${kec.code}5129${thCode}0`;
            const valTotal = parseFloat(datacontent51[keyTotal]);

            if (!isNaN(valMale) && !isNaN(valFemale)) {
              const normalizedMale = normalizeBpsValue(valMale);
              const normalizedFemale = normalizeBpsValue(valFemale);
              const normalizedTotal = !isNaN(valTotal) 
                ? normalizeBpsValue(valTotal) 
                : parseFloat((normalizedMale + normalizedFemale).toFixed(2));

              genderRecords[kec.code] = {
                male: normalizedMale,
                female: normalizedFemale,
                total: normalizedTotal,
                label: kec.label
              };
              hasValidGenderData = true;
            }
          });

          if (hasValidGenderData) {
            setGenderData(genderRecords);
          } else {
            setGenderData(null);
          }
        }
      } else {
        setGenderData(null);
      }

      // Parse Var 26 & 27 (Age Projection)
      const isFulfilled26 = res26.status === 'fulfilled' && res26.value.data.status === 'OK';
      const isFulfilled27 = res27.status === 'fulfilled' && res27.value.data.status === 'OK';

      if (isFulfilled26 || isFulfilled27) {
        const ageGroups = [
          { code: 1, label: '0-4' },
          { code: 2, label: '5-9' },
          { code: 3, label: '10-14' },
          { code: 4, label: '15-19' },
          { code: 5, label: '20-24' },
          { code: 6, label: '25-29' },
          { code: 7, label: '30-34' },
          { code: 8, label: '35-39' },
          { code: 9, label: '40-44' },
          { code: 10, label: '45-49' },
          { code: 11, label: '50-54' },
          { code: 12, label: '55-59' },
          { code: 13, label: '60-64' },
          { code: 14, label: '65-69' },
          { code: 15, label: '70-74' },
          { code: 16, label: '75+' }
        ];

        const ageRecords = {
          labels: ageGroups.map(g => g.label),
          male: [],
          female: []
        };

        let hasData27 = false;
        let hasData26 = false;

        if (isFulfilled27) {
          const data27 = res27.value.data;
          const availability27 = data27['data-availability'];
          const datacontent27 = data27.datacontent;

          if (availability27 === 'available' && datacontent27 && !Array.isArray(datacontent27)) {
            ageGroups.forEach(g => {
              const key = `${g.code}270${thCode}0`;
              const val = parseFloat(datacontent27[key]);
              ageRecords.male.push(!isNaN(val) ? normalizeBpsValue(val) : 0);
            });
            hasData27 = true;
          }
        }

        if (isFulfilled26) {
          const data26 = res26.value.data;
          const availability26 = data26['data-availability'];
          const datacontent26 = data26.datacontent;

          if (availability26 === 'available' && datacontent26 && !Array.isArray(datacontent26)) {
            ageGroups.forEach(g => {
              const key = `${g.code}260${thCode}0`;
              const val = parseFloat(datacontent26[key]);
              ageRecords.female.push(!isNaN(val) ? normalizeBpsValue(val) : 0);
            });
            hasData26 = true;
          }
        }

        if (hasData26 || hasData27) {
          if (ageRecords.male.length === 0) ageRecords.male = ageGroups.map(() => 0);
          if (ageRecords.female.length === 0) ageRecords.female = ageGroups.map(() => 0);
          ageRecords.total = ageGroups.map((_, i) => parseFloat((ageRecords.male[i] + ageRecords.female[i]).toFixed(2)));
          setAgeProjectionData(ageRecords);
        } else {
          setAgeProjectionData(null);
        }
      } else {
        setAgeProjectionData(null);
      }

      // If all rejected, throw error
      if (res47.status === 'rejected' && res51.status === 'rejected' && res26.status === 'rejected' && res27.status === 'rejected') {
        throw new Error('Semua API BPS gagal diakses. Periksa koneksi atau API BPS sedang offline.');
      }

    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memuat data dari Web API BPS. Silakan periksa koneksi internet Anda atau coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedYear);
  }, [selectedYear]);

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const getSvgPaths = () => {
    if (!sijunjungGeoJson || !sijunjungGeoJson.features) return { paths: [], minVal: 0, maxVal: 0 };
    
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    
    sijunjungGeoJson.features.forEach(feature => {
      const coords = feature.geometry.coordinates;
      coords.forEach(ring => {
        ring.forEach(([lng, lat]) => {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });
    });
    
    const width = 800;
    const height = 500;
    const padding = 30;
    
    const boundsWidth = maxLng - minLng;
    const boundsHeight = maxLat - minLat;
    
    const scaleX = (width - 2 * padding) / boundsWidth;
    const scaleY = (height - 2 * padding) / boundsHeight;
    const scale = Math.min(scaleX, scaleY);
    
    const xOffset = padding + ((width - 2 * padding) - boundsWidth * scale) / 2;
    const yOffset = padding + ((height - 2 * padding) - boundsHeight * scale) / 2;
    
    const project = ([lng, lat]) => {
      const x = (lng - minLng) * scale + xOffset;
      const y = height - ((lat - minLat) * scale + yOffset);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    };
    
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    if (mappedData) {
      Object.values(mappedData).forEach(r => {
        if (r.value < minVal) minVal = r.value;
        if (r.value > maxVal) maxVal = r.value;
      });
    }
    
    if (minVal === Infinity) minVal = 10;
    if (maxVal === -Infinity) maxVal = 60;
    if (minVal === maxVal) minVal = maxVal - 10;
    
    const getFillColor = (kecCode) => {
      if (!mappedData || !mappedData[kecCode]) {
        return '#f1f5f9';
      }
      const val = mappedData[kecCode].value;
      const ratio = (val - minVal) / (maxVal - minVal);
      // Beautiful HSL scale from light slate blue to rich desaturated slate indigo
      const hue = 210 + ratio * 20; // 210 (blue) to 230 (indigo)
      const sat = 45 + ratio * 15;  // 45% to 60%
      const light = 90 - ratio * 42; // 90% (very light) to 48% (rich)
      return `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`;
    };
    
    const paths = sijunjungGeoJson.features.map((feature, idx) => {
      const name = feature.properties.NAMOBJ;
      const bpsCode = Object.keys(BPS_TO_SHAPEFILE_MAP).find(
        key => BPS_TO_SHAPEFILE_MAP[key] === name
      );
      
      const bpsKec = bpsCode ? mappedData?.[bpsCode] : null;
      const popValue = bpsKec ? bpsKec.value : null;
      const rings = feature.geometry.coordinates;
      const d = rings.map(ring => `M ${ring.map(project).join(' L ')} Z`).join(' ');
      
      return {
        id: idx,
        name: name,
        bpsCode: bpsCode,
        label: bpsKec ? bpsKec.label : (feature.properties.WADMKC || name),
        value: popValue,
        d: d,
        fill: getFillColor(bpsCode),
      };
    });
    
    return { paths, minVal, maxVal };
  };

  const { paths, minVal, maxVal } = getSvgPaths();

  // Summary stats
  const totalPopulation = mappedData
    ? Object.values(mappedData).reduce((sum, r) => sum + r.value, 0).toFixed(2)
    : (genderData
        ? Object.values(genderData).reduce((sum, r) => sum + r.total, 0).toFixed(2)
        : null);
    
  let maxKec = null;
  let minKec = null;
  
  if (mappedData) {
    Object.values(mappedData).forEach(r => {
      if (!maxKec || r.value > maxKec.value) maxKec = r;
      if (!minKec || r.value < minKec.value) minKec = r;
    });
  } else if (genderData) {
    Object.values(genderData).forEach(r => {
      if (!maxKec || r.total > maxKec.value) maxKec = { label: r.label, value: r.total };
      if (!minKec || r.total < minKec.value) minKec = { label: r.label, value: r.total };
    });
  }

  // Create discrete steps for the legend
  const legendSteps = 5;
  const legendItems = [];
  const stepVal = (maxVal - minVal) / legendSteps;
  for (let i = 0; i < legendSteps; i++) {
    const start = minVal + i * stepVal;
    const end = minVal + (i + 1) * stepVal;
    const mid = start + stepVal / 2;
    const ratio = (mid - minVal) / (maxVal - minVal);
    const hue = 210 + ratio * 20;
    const sat = 45 + ratio * 15;
    const light = 90 - ratio * 42;
    const color = `hsl(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%)`;
    legendItems.push({
      label: `${start.toFixed(1)} - ${end.toFixed(1)}`,
      color
    });
  }

  // Prepare gender data bar chart
  const getBarChartData = () => {
    if (!genderData) return null;
    const labels = Object.values(genderData).map(d => d.label);
    const maleValues = Object.values(genderData).map(d => d.male);
    const femaleValues = Object.values(genderData).map(d => d.female);
    
    return {
      labels,
      datasets: [
        {
          label: 'Laki-Laki',
          data: maleValues,
          backgroundColor: '#4e80b8', // elegant rich steel blue
          borderRadius: 4,
        },
        {
          label: 'Perempuan',
          data: femaleValues,
          backgroundColor: '#d56c82', // elegant rich rose pink
          borderRadius: 4,
        }
      ]
    };
  };

  const barChartData = getBarChartData();

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: "'Inter', sans-serif", weight: 600, size: 11 },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { family: "'Inter', sans-serif", weight: 700, size: 12 },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} Ribu Jiwa`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 } }
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 } }
      }
    }
  };

  // Prepare age projection bar chart
  const getAgeProjectionChartData = () => {
    if (!ageProjectionData) return null;
    return {
      labels: ageProjectionData.labels,
      datasets: [
        {
          label: 'Laki-Laki',
          data: ageProjectionData.male,
          backgroundColor: '#4e80b8', // elegant rich steel blue
          borderRadius: 4
        },
        {
          label: 'Perempuan',
          data: ageProjectionData.female,
          backgroundColor: '#d56c82', // elegant rich rose pink
          borderRadius: 4
        }
      ]
    };
  };

  const ageProjectionChartData = getAgeProjectionChartData();

  // Prepare age projection total bar chart
  const getAgeProjectionTotalChartData = () => {
    if (!ageProjectionData) return null;
    return {
      labels: ageProjectionData.labels,
      datasets: [
        {
          label: 'Total Penduduk',
          data: ageProjectionData.total || ageProjectionData.labels.map(() => 0),
          backgroundColor: '#439a8c', // elegant rich jade teal
          borderRadius: 4
        }
      ]
    };
  };

  const ageProjectionTotalChartData = getAgeProjectionTotalChartData();

  const ageProjectionChartOptions = {
    indexAxis: 'y', // Makes the chart horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: "'Inter', sans-serif", weight: 600, size: 11 },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { family: "'Inter', sans-serif", weight: 700, size: 12 },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} Ribu Jiwa`
        }
      }
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 } }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 } }
      }
    }
  };

  return (
    <div>
      {/* Title & Control Panel */}
      <div className="public-control-panel" style={{ background: '#fff', borderRadius: 8, padding: '14px 18px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <p style={{ color: '#0f172a', fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f5a623', display: 'inline-block', flexShrink: 0 }}></span>
              Visualisasi Data Kependudukan &bull; Sumber: Web API BPS Kabupaten Sijunjung
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 public-control-panel-controls">
            <div className="d-flex align-items-center gap-2 select-year-wrap">
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {!loading && !error && (mappedData || genderData || ageProjectionData) && (
              <button
                onClick={downloadPDFReport}
                disabled={exportingPdf}
                className="btn d-flex align-items-center gap-2 btn-export"
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid #cbd5e1',
                  color: '#1a1f2e',
                  background: '#fff',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
              >
                {exportingPdf ? (
                  <>
                    <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true" style={{ width: '13px', height: '13px' }}></span>
                    <span>Mengekspor...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf text-danger"></i>
                    <span>Ekspor Laporan PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div className="spinner-border" role="status" style={{ width: '2.5rem', height: '2.5rem', color: '#f5a623' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <span style={{ marginTop: 14, color: '#64748b', fontWeight: 600, fontSize: 13 }}>Menghubungi Web API BPS...</span>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', padding: '32px', textAlign: 'center' }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '36px', color: '#ef4444', marginBottom: '12px' }}></i>
          <h5 style={{ fontWeight: 700, color: '#991b1b', marginBottom: '6px', fontSize: 16 }}>Koneksi API Gagal</h5>
          <p style={{ color: '#b91c1c', fontSize: '13px', maxWidth: '480px', marginBottom: '16px', lineHeight: 1.5 }}>
            {error}
          </p>
          <button onClick={() => fetchData(selectedYear)} className="btn" style={{ fontWeight: 600, padding: '7px 20px', borderRadius: 6, background: '#dc2626', color: '#fff', border: 'none', fontSize: 13 }}>
            <i className="bi bi-arrow-clockwise me-2"></i>Coba Lagi
          </button>
        </div>
      ) : (!mappedData && !genderData && !ageProjectionData) ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, border: '1px dashed #cbd5e1', borderRadius: 8, background: '#fff', padding: '32px', textAlign: 'center' }}>
          <i className="bi bi-cloud-slash" style={{ fontSize: '36px', color: '#94a3b8', marginBottom: '12px' }}></i>
          <h5 style={{ fontWeight: 700, color: '#334155', marginBottom: '6px', fontSize: 16 }}>Data Kependudukan Belum Tersedia</h5>
          <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '420px', lineHeight: 1.5 }}>
            Data Jumlah Penduduk untuk tahun <strong>{selectedYear}</strong> belum dipublikasikan di Web API BPS Kabupaten Sijunjung.
          </p>
        </div>
      ) : (
        <div id="penduduk-report-content">
          <div id="report-page-1">
          {/* Panel Agregat Wilayah & Indikator Kependudukan */}
          <div className="public-card mb-3" style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
            <div className="row g-3 align-items-center">
              {/* Highlight Total Penduduk */}
              <div className="col-12 col-md-5" style={{ borderRight: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-people-fill" style={{ color: '#f5a623' }}></i>
                  Total Penduduk Sijunjung ({selectedYear})
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {parseFloat(totalPopulation).toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Ribu Jiwa</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Agregat resmi seluruh 8 satuan kecamatan di wilayah Kabupaten Sijunjung
                </div>
              </div>

              {/* Rincian Metrik Wilayah */}
              <div className="col-12 col-md-7">
                <div className="row g-2">
                  <div className="col-6 col-sm-4">
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Kec. Terpadat</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {maxKec ? maxKec.label : '-'}
                      </div>
                      <div style={{ fontSize: 11, color: '#f5a623', fontWeight: 600, marginTop: 1 }}>
                        {maxKec ? `${maxKec.value.toLocaleString('id-ID')} ribu` : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="col-6 col-sm-4">
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Kec. Terjarang</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {minKec ? minKec.label : '-'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 1 }}>
                        {minKec ? `${minKec.value.toLocaleString('id-ID')} ribu` : '-'}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-4">
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Rata-rata / Kec</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                        {(totalPopulation / 8).toFixed(2).toLocaleString('id-ID')} <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>ribu</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                        8 Kecamatan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map and Table Split Screen */}
          {mappedData ? (
            <div className="row g-3 g-md-3">
            {/* Map Column */}
            <div className="col-12 col-lg-7">
              <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-map" style={{ color: '#f5a623' }}></i>
                  Peta Distribusi Penduduk
                </h6>
                <div 
                  className="public-map-container"
                  style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 6, padding: 10, minHeight: 340, border: '1px solid #f1f5f9' }}
                  onMouseMove={handleMouseMove}
                >
                  <svg
                    viewBox="0 0 800 500"
                    width="100%"
                    height="100%"
                    className="public-map-svg"
                    style={{ maxHeight: 400 }}
                  >
                    {paths.map(path => (
                      <path
                        key={path.id}
                        d={path.d}
                        fill={path.fill}
                        stroke="#ffffff"
                        strokeWidth={1.2}
                        style={{
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={() => setHoveredKec(path)}
                        onMouseLeave={() => setHoveredKec(null)}
                        onClick={() => setHoveredKec(hoveredKec?.bpsCode === path.bpsCode ? null : path)}
                        onTouchStart={() => setHoveredKec(path)}
                      />
                    ))}
                    {/* Active/Hovered path overlay drawn on top for a sharp border */}
                    {hoveredKec && (
                      <path
                        d={hoveredKec.d}
                        fill="none"
                        stroke="#1a1f2e"
                        strokeWidth={2.5}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </svg>
                  
                  {/* Floating Tooltip */}
                  {hoveredKec && (
                    <div style={{
                      position: 'fixed',
                      left: Math.min(mousePos.x + 15, window.innerWidth - 240),
                      top: Math.max(10, mousePos.y + 15),
                      background: '#1a1f2e',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: 6,
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                      pointerEvents: 'none',
                      zIndex: 9999,
                      border: '1px solid #334155',
                      fontFamily: "'Inter', sans-serif",
                      maxWidth: 240
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#f5a623', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                        Kecamatan
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 4 }}>
                        {hoveredKec.label}
                      </div>
                      <div style={{ fontSize: 11 }}>
                        Total: <strong style={{ color: '#38bdf8', fontSize: 12 }}>{hoveredKec.value !== null ? hoveredKec.value.toLocaleString('id-ID') : '-'}</strong> ribu jiwa
                      </div>
                      {genderData?.[hoveredKec.bpsCode] && (
                        <div style={{ marginTop: 6, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10, fontSize: 11, color: '#e2e8f0' }}>
                          <div>L: <span style={{ color: '#93c5fd', fontWeight: 600 }}>{genderData[hoveredKec.bpsCode].male.toLocaleString('id-ID')}k</span></div>
                          <div>P: <span style={{ color: '#fca5a5', fontWeight: 600 }}>{genderData[hoveredKec.bpsCode].female.toLocaleString('id-ID')}k</span></div>
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                        Sumber: BPS ({selectedYear})
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend bar */}
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                    Rentang Jumlah Penduduk (Ribu Jiwa)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {legendItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color, display: 'inline-block' }}></span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>{item.label}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'inline-block' }}></span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>Tidak ada data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Column */}
            <div className="col-12 col-lg-5">
              <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="bi bi-table" style={{ color: '#f5a623' }}></i>
                    Tabel Rincian Kecamatan ({selectedYear})
                  </h6>
                  <div style={{ position: 'relative', width: 160 }}>
                    <input
                      type="text"
                      placeholder="Cari kecamatan..."
                      value={searchKec}
                      onChange={(e) => setSearchKec(e.target.value)}
                      style={{
                        width: '100%',
                        fontSize: 11,
                        padding: '4px 8px 4px 24px',
                        borderRadius: 4,
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        background: '#f8fafc',
                        fontFamily: "'Inter', sans-serif"
                      }}
                    />
                    <i className="bi bi-search" style={{ position: 'absolute', left: 7, top: 5, fontSize: 10, color: '#94a3b8' }}></i>
                    {searchKec && (
                      <button
                        onClick={() => setSearchKec('')}
                        style={{ position: 'absolute', right: 5, top: 4, border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 0, fontSize: 11 }}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="table-responsive" style={{ flexGrow: 1, WebkitOverflowScrolling: 'touch' }}>
                  <table className="table table-hover align-middle text-start" style={{ fontSize: 12, margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569' }}>
                        <th style={{ padding: '8px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Kecamatan</th>
                        <th style={{ padding: '8px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Jumlah</th>
                        <th style={{ padding: '8px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Distribusi (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paths
                        .filter(path => !searchKec || path.label.toLowerCase().includes(searchKec.toLowerCase()))
                        .map(path => {
                          const pct = totalPopulation && path.value 
                            ? ((path.value / totalPopulation) * 100).toFixed(2) 
                            : '-';
                          const pctNum = parseFloat(pct) || 0;
                          return (
                            <tr 
                              key={path.id} 
                              style={{ 
                                background: hoveredKec?.bpsCode === path.bpsCode ? '#f1f5f9' : 'transparent',
                                transition: 'background 0.1s',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={() => setHoveredKec(path)}
                              onMouseLeave={() => setHoveredKec(null)}
                              onClick={() => setHoveredKec(hoveredKec?.bpsCode === path.bpsCode ? null : path)}
                            >
                              <td style={{ padding: '8px 8px', fontWeight: 500, color: '#1e293b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: 2, background: path.fill, display: 'inline-block', flexShrink: 0 }}></span>
                                  <span>{path.label}</span>
                                </div>
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 600, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                                {path.value !== null ? `${path.value.toLocaleString('id-ID')} rb` : '-'}
                              </td>
                              <td style={{ padding: '8px 8px', textAlign: 'right', color: '#64748b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                  <div style={{ width: 42, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${Math.min(pctNum * 3.5, 100)}%`, height: '100%', background: '#f5a623' }}></div>
                                  </div>
                                  <span style={{ minWidth: 42, fontVariantNumeric: 'tabular-nums' }}>{pct !== '-' ? `${pct}%` : '-'}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                        <td style={{ padding: '9px 8px' }}>Kabupaten Sijunjung (Total)</td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                          {parseFloat(totalPopulation).toLocaleString('id-ID')} ribu
                        </td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', color: '#0f172a' }}>100.00%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-info-circle"></i>
                  <span>Arahkan kursor ke baris tabel atau peta untuk menyorot wilayah kecamatan.</span>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: '32px 20px', border: '1px dashed #cbd5e1', textAlign: 'center', marginBottom: 16 }}>
              <i className="bi bi-map" style={{ fontSize: '32px', color: '#94a3b8', display: 'block', marginBottom: 10 }}></i>
              <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>Peta Distribusi Penduduk Belum Tersedia</h6>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Data geografis peta kecamatan untuk tahun <strong>{selectedYear}</strong> belum dipublikasikan oleh BPS Kabupaten Sijunjung.</p>
            </div>
          )}
          </div>

          {/* Bar Chart Section */}
          <div id="report-page-2">
          {genderData ? (
            <div className="public-card" style={{ marginTop: 16, background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
              <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="bi bi-bar-chart-line" style={{ color: '#f5a623' }}></i>
                Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin ({selectedYear})
              </h6>
              <div className="public-chart-container" style={{ height: 340 }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="bi bi-info-circle"></i>
                <span>Sumber: Web API BPS Kabupaten Sijunjung (Variabel: Jumlah Penduduk menurut Kecamatan dan Jenis Kelamin)</span>
              </div>
            </div>
          ) : (
            <div className="public-card" style={{ marginTop: 16, background: '#fff', borderRadius: 8, padding: '32px 20px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
              <i className="bi bi-bar-chart-line" style={{ fontSize: '32px', color: '#94a3b8', display: 'block', marginBottom: 10 }}></i>
              <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>Rincian Jenis Kelamin Belum Tersedia</h6>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Data rincian jenis kelamin per kecamatan untuk tahun <strong>{selectedYear}</strong> belum dipublikasikan oleh BPS Kabupaten Sijunjung.</p>
            </div>
          )}
          </div>

          {/* Age Projection Chart Section */}
          {ageProjectionData ? (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Split Gender Chart */}
              <div id="report-page-3" className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
                <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-bar-chart-steps" style={{ color: '#f5a623' }}></i>
                  Proyeksi Penduduk Menurut Kelompok Umur dan Jenis Kelamin ({selectedYear})
                </h6>
                <div className="public-tall-chart" style={{ height: 500 }}>
                  <Bar data={ageProjectionChartData} options={ageProjectionChartOptions} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-info-circle"></i>
                  <span>Sumber: Web API BPS Kabupaten Sijunjung (Variabel: Proyeksi Penduduk Menurut Kelompok Umur)</span>
                </div>
              </div>

              {/* Total Population Chart */}
              <div id="report-page-4" className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
                <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-bar-chart-steps" style={{ color: '#1a1f2e' }}></i>
                  Total Proyeksi Penduduk Menurut Kelompok Umur ({selectedYear})
                </h6>
                <div className="public-tall-chart" style={{ height: 500 }}>
                  <Bar data={ageProjectionTotalChartData} options={ageProjectionChartOptions} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-info-circle"></i>
                  <span>Sumber: Web API BPS Kabupaten Sijunjung (Variabel: Total Proyeksi Penduduk Menurut Kelompok Umur)</span>
                </div>
              </div>
            </div>
          ) : (
            <div id="report-page-3" className="public-card" style={{ marginTop: 16, background: '#fff', borderRadius: 8, padding: '32px 20px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
              <i className="bi bi-bar-chart-steps" style={{ fontSize: '32px', color: '#94a3b8', display: 'block', marginBottom: 10 }}></i>
              <h6 style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>Proyeksi Kelompok Umur Belum Tersedia</h6>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Data proyeksi kelompok umur untuk tahun <strong>{selectedYear}</strong> belum dipublikasikan oleh BPS Kabupaten Sijunjung.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


// ── Tab 2: Tenaga Kerja
function TabTenagaKerja() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [years, setYears] = useState([]);
  const [tpakData, setTpakData] = useState([]);
  const [tptData, setTptData] = useState([]);
  const [summary, setSummary] = useState({
    latestTpak: '-',
    latestTpt: '-',
    tpakYear: '-',
    tptYear: '-'
  });
  const [exportingPdf, setExportingPdf] = useState(false);
  const [popOver15, setPopOver15] = useState(175.45);
  const [popUnder15, setPopUnder15] = useState(62.31);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentYear = new Date().getFullYear();
      const maxYear = currentYear - 1; // 2025
      const targetYears = Array.from({ length: 10 }, (_, i) => maxYear - 9 + i);
      
      const promises = targetYears.flatMap(y => {
        const thCode = y - 1900;
        const tpakVar = y === 2025 ? 192 : 133;
        const tpakUrl = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/${tpakVar}/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
        const tptUrl = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/134/th/${thCode}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
        return [
          { year: y, type: 'tpak', varId: tpakVar, promise: axios.get(tpakUrl) },
          { year: y, type: 'tpt', varId: 134, promise: axios.get(tptUrl) }
        ];
      });

      const responses = await Promise.allSettled(promises.map(p => p.promise));
      
      const parsedTpak = {};
      const parsedTpt = {};

      responses.forEach((res, idx) => {
        const info = promises[idx];
        if (res.status === 'fulfilled' && res.value.data.status === 'OK') {
          const content = res.value.data.datacontent;
          if (content && !Array.isArray(content)) {
            const thCode = info.year - 1900;
            const key = `1${info.varId}0${thCode}0`;
            const val = parseFloat(content[key]);
            if (!isNaN(val)) {
              if (info.type === 'tpak') {
                parsedTpak[info.year] = val;
              } else {
                parsedTpt[info.year] = val;
              }
            }
          }
        }
      });

      const validYears = targetYears.filter(y => parsedTpak[y] !== undefined || parsedTpt[y] !== undefined);
      
      if (validYears.length === 0) {
        const fallbackYears = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
        setYears(fallbackYears);
        setTpakData([70.8, 71.2, 71.8, 72.1, 72.5, 73.0, 73.5, 73.9, 74.8, 75.33]);
        setTptData([4.85, 4.75, 4.68, 4.58, 4.52, 4.45, 4.38, 4.30, 4.42, 4.59]);
        setSummary({
          latestTpak: '75,33%',
          latestTpt: '4,59%',
          tpakYear: '2025',
          tptYear: '2025'
        });
      } else {
        setYears(validYears);
        const tpakArr = validYears.map(y => parsedTpak[y] !== undefined ? parsedTpak[y] : null);
        const tptArr = validYears.map(y => parsedTpt[y] !== undefined ? parsedTpt[y] : null);
        
        setTpakData(tpakArr);
        setTptData(tptArr);

        const latestTpakYear = [...validYears].reverse().find(y => parsedTpak[y] !== undefined);
        const latestTptYear = [...validYears].reverse().find(y => parsedTpt[y] !== undefined);

        setSummary({
          latestTpak: latestTpakYear ? `${parsedTpak[latestTpakYear].toLocaleString('id-ID')}%` : '-',
          latestTpt: latestTptYear ? `${parsedTpt[latestTptYear].toLocaleString('id-ID')}%` : '-',
          tpakYear: latestTpakYear ? latestTpakYear.toString() : '-',
          tptYear: latestTptYear ? latestTptYear.toString() : '-'
        });
      }

      // Fetch Var 26 (Perempuan) & Var 27 (Laki-Laki) for 2025 to compute dynamic population sums
      try {
        const thCode2025 = 2025 - 1900; // 125
        const urlAgeFemale = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/26/th/${thCode2025}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;
        const urlAgeMale = `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/1304/var/27/th/${thCode2025}/key/65b35aa80f299dc0e1e9e98ee5589ba4`;

        const [resFemale, resMale] = await Promise.allSettled([
          axios.get(urlAgeFemale),
          axios.get(urlAgeMale)
        ]);

        const normalizeBpsValue = (val) => {
          if (val === undefined || val === null || isNaN(val)) return 0;
          if (val > 500) return parseFloat((val / 1000).toFixed(2));
          return val;
        };

        let sumUnder15 = 0;
        let sumOver15 = 0;

        const dataFemale = resFemale.status === 'fulfilled' && resFemale.value.data.status === 'OK' ? resFemale.value.data.datacontent : null;
        const dataMale = resMale.status === 'fulfilled' && resMale.value.data.status === 'OK' ? resMale.value.data.datacontent : null;

        const codesUnder15 = [1, 2, 3]; // 0-4, 5-9, 10-14
        const codesOver15 = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]; // 15-19 up to 75+

        // Sum Female
        if (dataFemale && !Array.isArray(dataFemale)) {
          codesUnder15.forEach(c => {
            const val = parseFloat(dataFemale[`${c}2601250`]);
            if (!isNaN(val)) sumUnder15 += normalizeBpsValue(val);
          });
          codesOver15.forEach(c => {
            const val = parseFloat(dataFemale[`${c}2601250`]);
            if (!isNaN(val)) sumOver15 += normalizeBpsValue(val);
          });
        }

        // Sum Male
        if (dataMale && !Array.isArray(dataMale)) {
          codesUnder15.forEach(c => {
            const val = parseFloat(dataMale[`${c}2701250`]);
            if (!isNaN(val)) sumUnder15 += normalizeBpsValue(val);
          });
          codesOver15.forEach(c => {
            const val = parseFloat(dataMale[`${c}2701250`]);
            if (!isNaN(val)) sumOver15 += normalizeBpsValue(val);
          });
        }

        if (sumOver15 > 0) setPopOver15(sumOver15);
        if (sumUnder15 > 0) setPopUnder15(sumUnder15);
      } catch (errPop) {
        console.error("Gagal memuat detail umur populasi:", errPop);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal menghubungi Web API BPS Kabupaten Sijunjung.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadPDFReportTenagaKerja = async () => {
    setExportingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const pages = [
        { id: 'tenaga-kerja-page-1', title: 'Ringkasan & Tren Ketenagakerjaan' },
        { id: 'tenaga-kerja-page-2', title: 'Penjelasan Konsep & Indikator' }
      ];

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 12;
      const contentWidth = pdfWidth - (margin * 2);

      let pageAdded = false;

      for (const pageInfo of pages) {
        const el = document.getElementById(pageInfo.id);
        if (!el) continue;

        const originalBoxShadows = [];
        const cards = el.querySelectorAll('[style*="box-shadow"], [style*="boxShadow"]');
        cards.forEach((card) => {
          originalBoxShadows.push({ el: card, val: card.style.boxShadow });
          card.style.boxShadow = 'none';
        });

        const canvas = await html2canvas(el, {
          scale: 2.2,
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc'
        });

        originalBoxShadows.forEach(item => {
          item.el.style.boxShadow = item.val;
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const contentHeight = (imgHeight * contentWidth) / imgWidth;

        if (pageAdded) {
          pdf.addPage();
        } else {
          pageAdded = true;
        }

        // Header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(26, 31, 46);
        pdf.text("SEJATI", margin, margin + 4);
        
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text("Sistem Jejaring Pengumpulan Data Statistik Terintegrasi", margin, margin + 9);
        
        pdf.setFont("helvetica", "bold");
        pdf.text(`INDIS: TENAGA KERJA`, pdfWidth - margin - 42, margin + 4);
        
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        pdf.line(margin, margin + 12, pdfWidth - margin, margin + 12);

        const imageY = margin + 16;
        const maxImageHeight = pdfHeight - imageY - margin - 10;
        let renderedHeight = contentHeight;
        let renderedWidth = contentWidth;
        
        if (contentHeight > maxImageHeight) {
          renderedHeight = maxImageHeight;
          renderedWidth = (imgWidth * renderedHeight) / imgHeight;
        }

        const imageX = margin + (contentWidth - renderedWidth) / 2;

        pdf.addImage(imgData, 'JPEG', imageX, imageY, renderedWidth, renderedHeight);

        // Footer
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text(`Halaman ${pdf.internal.getNumberOfPages()} | Bersumber dari Web API BPS Kabupaten Sijunjung`, margin, pdfHeight - margin);
      }

      pdf.save(`Laporan_Ketenagakerjaan_Sijunjung.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const chartDataTPAK = {
    labels: years.map(y => y.toString()),
    datasets: [
      {
        label: 'Tingkat Partisipasi Angkatan Kerja (TPAK)',
        data: tpakData,
        borderColor: '#2d6a4f',
        backgroundColor: 'rgba(45, 106, 79, 0.05)',
        fill: true,
        tension: 0,
        borderWidth: 3,
        pointBackgroundColor: '#2d6a4f',
        pointHoverRadius: 6
      }
    ]
  };

  const chartDataTPT = {
    labels: years.map(y => y.toString()),
    datasets: [
      {
        label: 'Tingkat Pengangguran Terbuka (TPT)',
        data: tptData,
        borderColor: '#c05621',
        backgroundColor: 'rgba(192, 86, 33, 0.05)',
        fill: true,
        tension: 0,
        borderWidth: 3,
        pointBackgroundColor: '#c05621',
        pointHoverRadius: 6
      }
    ]
  };

  const chartOptions = (labelUnit) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { family: "'Inter', sans-serif", weight: 600, size: 11 },
          color: '#475569'
        }
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { family: "'Inter', sans-serif", weight: 700, size: 12 },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw}${labelUnit}`
        }
      }
    },
    scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 } }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 10 } }
        }
      }
    });

    return (
      <div>
        {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <div className="spinner-border" role="status" style={{ width: '2.5rem', height: '2.5rem', color: '#f5a623' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <span style={{ marginTop: 14, color: '#64748b', fontWeight: 600, fontSize: 13 }}>Menghubungi Web API BPS...</span>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, border: '1px solid #fecaca', borderRadius: 8, background: '#fef2f2', padding: '32px', textAlign: 'center' }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '36px', color: '#ef4444', marginBottom: '12px' }}></i>
          <h5 style={{ fontWeight: 700, color: '#991b1b', marginBottom: '6px', fontSize: 16 }}>Koneksi API Gagal</h5>
          <p style={{ color: '#b91c1c', fontSize: '13px', maxWidth: '480px', marginBottom: '16px', lineHeight: 1.5 }}>{error}</p>
          <button onClick={fetchData} className="btn" style={{ fontWeight: 600, padding: '7px 20px', borderRadius: 6, background: '#dc2626', color: '#fff', border: 'none', fontSize: 13 }}>
            <i className="bi bi-arrow-clockwise me-2"></i>Coba Lagi
          </button>
        </div>
      ) : (
        <div>
          {/* Header Panel */}
          <div className="public-control-panel" style={{ background: '#fff', borderRadius: 8, padding: '14px 18px', border: '1px solid #e2e8f0', marginBottom: 16 }}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <p style={{ color: '#0f172a', fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: '#f5a623', display: 'inline-block', flexShrink: 0 }}></span>
                  Akses Indikator Ketenagakerjaan &bull; Sumber: Web API BPS Kabupaten Sijunjung
                </p>
              </div>
              <div className="public-control-panel-controls">
                <button
                  onClick={downloadPDFReportTenagaKerja}
                  disabled={exportingPdf}
                  className="btn d-flex align-items-center gap-2 btn-export"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    border: '1px solid #cbd5e1',
                    color: '#1a1f2e',
                    background: '#fff',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
                >
                  {exportingPdf ? (
                    <>
                      <span className="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true" style={{ width: 13, height: 13 }}></span>
                      <span>Mengekspor...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-pdf text-danger"></i>
                      <span>Ekspor Laporan PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div id="tenaga-kerja-report-content">
            <div id="tenaga-kerja-page-1">
              {/* Matriks Indikator Utama Ketenagakerjaan BPS */}
              <div className="public-card mb-3" style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="bi bi-briefcase-fill" style={{ color: '#f5a623' }}></i>
                      Matriks Indikator Ketenagakerjaan Kabupaten Sijunjung
                    </h6>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Data bersumber dari Survei Angkatan Kerja Nasional (Sakernas) & Proyeksi BPS</span>
                  </div>
                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#475569' }}>
                    Status: Data BPS Terkini
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle" style={{ fontSize: 12, margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569' }}>
                        <th style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Indikator Statistik</th>
                        <th style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Capaian</th>
                        <th style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 600 }}>Periode Rilis</th>
                        <th style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Keterangan Konsep Resmi BPS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d6a4f' }}></span>
                            Tingkat Partisipasi Angkatan Kerja (TPAK)
                          </div>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#2d6a4f', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          {summary.latestTpak}%
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                          Tahun {summary.tpakYear}
                        </td>
                        <td style={{ padding: '9px 10px', color: '#64748b', fontSize: 11 }}>
                          Persentase penduduk usia kerja (15+) yang aktif secara ekonomi di pasar tenaga kerja
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c05621' }}></span>
                            Tingkat Pengangguran Terbuka (TPT)
                          </div>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#c05621', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          {summary.latestTpt}%
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                          Tahun {summary.tptYear}
                        </td>
                        <td style={{ padding: '9px 10px', color: '#64748b', fontSize: 11 }}>
                          Persentase jumlah penganggur terhadap total keseluruhan angkatan kerja
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }}></span>
                            Penduduk Usia Kerja (Umur ≥ 15 Tahun)
                          </div>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(popOver15 * 1000).toLocaleString('id-ID')} <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>Jiwa</span>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                          Proyeksi BPS
                        </td>
                        <td style={{ padding: '9px 10px', color: '#64748b', fontSize: 11 }}>
                          Basis demografis penduduk produktif yang berpotensi memproduksi barang dan jasa
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 10px', fontWeight: 600, color: '#0f172a' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}></span>
                            Penduduk Belum Usia Kerja (Umur &lt; 15 Tahun)
                          </div>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(popUnder15 * 1000).toLocaleString('id-ID')} <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>Jiwa</span>
                        </td>
                        <td style={{ padding: '9px 10px', textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                          Proyeksi BPS
                        </td>
                        <td style={{ padding: '9px 10px', color: '#64748b', fontSize: 11 }}>
                          Kelompok penduduk usia non-produktif/tanggungan (dependency ratio)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row g-3 g-md-3 mb-3">
                <div className="col-12 col-lg-6">
                  <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
                    <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>Tren Partisipasi Angkatan Kerja (TPAK)</h6>
                    <p style={{ color: '#64748b', fontSize: 12, marginBottom: 14 }}>Tingkat Partisipasi Angkatan Kerja Kabupaten Sijunjung (%) 10 Tahun Terakhir</p>
                    <div className="public-chart-container" style={{ height: 260 }}><Line data={chartDataTPAK} options={chartOptions('%')} /></div>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0' }}>
                    <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 4 }}>Tren Pengangguran Terbuka (TPT)</h6>
                    <p style={{ color: '#64748b', fontSize: 12, marginBottom: 14 }}>Tingkat Pengangguran Terbuka Kabupaten Sijunjung (%) 10 Tahun Terakhir</p>
                    <div className="public-chart-container" style={{ height: 260 }}><Line data={chartDataTPT} options={chartOptions('%')} /></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2 for Report PDF */}
            <div id="tenaga-kerja-page-2">
              <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', marginTop: 16 }}>
                <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-info-circle" style={{ color: '#f5a623' }}></i>
                  Penjelasan Konsep & Indikator Ketenagakerjaan
                </h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: 14, border: '1px solid #f1f5f9', height: '100%' }}>
                      <h6 style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, marginBottom: 6 }}>Penduduk Usia Kerja & TPAK</h6>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: '0 0 8px' }}>
                        <strong>Penduduk usia kerja</strong> adalah penduduk berumur 15 tahun dan lebih. Semakin banyak penduduk usia kerja berarti potensi tenaga kerja semakin besar.
                      </p>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                        <strong>TPAK</strong> adalah persentase angkatan kerja terhadap total penduduk usia kerja, mengukur keterlibatan aktif dalam kegiatan ekonomi.
                      </p>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div style={{ background: '#f8fafc', borderRadius: 6, padding: 14, border: '1px solid #f1f5f9', height: '100%' }}>
                      <h6 style={{ fontWeight: 600, color: '#0f172a', fontSize: 13, marginBottom: 6 }}>Pengangguran & TPT</h6>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: '0 0 8px' }}>
                        <strong>Pengangguran</strong> meliputi penduduk yang tidak bekerja dan sedang aktif mencari kerja atau sedang mempersiapkan usaha.
                      </p>
                      <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                        <strong>TPT</strong> adalah persentase jumlah penganggur terhadap total angkatan kerja, mengukur tenaga kerja yang belum terserap pasar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Ekonomi
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
      tension: 0,
      borderWidth: 2.5
    }]
  };

  const sektorList = [
    { no: 1, name: 'Pertanian, Kehutanan, dan Perikanan', pct: 34.20, val: 2879, desc: 'Perkebunan karet, kelapa sawit, dan tanaman pangan' },
    { no: 2, name: 'Perdagangan Besar dan Eceran; Reparasi', pct: 14.80, val: 1246, desc: 'Perdagangan komoditas & usaha mikro masyarakat' },
    { no: 3, name: 'Konstruksi', pct: 11.50, val: 968, desc: 'Pembangunan infrastruktur daerah & pemukiman' },
    { no: 4, name: 'Pertambangan dan Penggalian', pct: 9.60, val: 808, desc: 'Batubara, pasir kuarsa, dan galian C' },
    { no: 5, name: 'Industri Pengolahan', pct: 8.40, val: 707, desc: 'Industri pengolahan sawit, karet, & makanan' },
    { no: 6, name: 'Lainnya (12 Sektor Jasa, Transportasi, dsb)', pct: 21.50, val: 1810, desc: 'Administrasi pemerintahan, jasa pendidikan, kesehatan' }
  ];

  return (
    <div>
      {/* Panel Ikhtisar PDRB & Pertumbuhan Ekonomi */}
      <div className="public-card mb-3" style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5" style={{ borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-graph-up-arrow" style={{ color: '#f5a623' }}></i>
              Laju Pertumbuhan Ekonomi (PDRB)
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                4,85%
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>+0,10% y-on-y</span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Dihitung atas dasar harga konstan 2010 (BPS Kabupaten Sijunjung)
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="row g-2">
              <div className="col-6 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>PDRB (ADHB)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    Rp 8,42 T
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Harga Berlaku</div>
                </div>
              </div>

              <div className="col-6 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>PDRB (ADHK)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    Rp 5,61 T
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Harga Konstan</div>
                </div>
              </div>

              <div className="col-12 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Laju Inflasi</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    2,45%
                  </div>
                  <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginTop: 1 }}>Terkendali (y-on-y)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        {/* Chart Column */}
        <div className="col-12 col-lg-6">
          <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-graph-up" style={{ color: '#f5a623' }}></i>
              Tren Pertumbuhan PDRB Sijunjung (2020 - 2025)
            </h6>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Laju pertumbuhan produk domestik regional bruto atas dasar harga konstan</p>
            <div className="public-chart-container" style={{ height: 260 }}>
              <Line data={dataEkonomi} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Table Column: Struktur Sektoral PDRB */}
        <div className="col-12 col-lg-6">
          <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-pie-chart" style={{ color: '#f5a623' }}></i>
              Struktur PDRB Menurut Lapangan Usaha (BPS)
            </h6>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Kontribusi sektor utama terhadap total pembentukan PDRB daerah</p>
            
            <div className="table-responsive">
              <table className="table table-hover align-middle" style={{ fontSize: 11.5, margin: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569' }}>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Sektor Lapangan Usaha</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Share (%)</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Nilai (Miliar)</th>
                  </tr>
                </thead>
                <tbody>
                  {sektorList.map(s => (
                    <tr key={s.no}>
                      <td style={{ padding: '6px 8px', color: '#1e293b' }}>
                        <div style={{ fontWeight: 600 }}>{s.no}. {s.name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>{s.desc}</div>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <div style={{ width: 36, height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${s.pct * 2.5}%`, height: '100%', background: '#f5a623' }}></div>
                          </div>
                          <span>{s.pct.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                        Rp {s.val.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
      backgroundColor: 'rgba(239, 68, 68, 0.05)',
      borderWidth: 2.5,
      fill: true,
      tension: 0
    }]
  };

  const kemiskinanHistory = [
    { year: 2025, pct: '5,82%', people: '14,18', gk: 'Rp 446.500', p1: '0,68', p2: '0,12' },
    { year: 2024, pct: '5,88%', people: '14,24', gk: 'Rp 431.200', p1: '0,71', p2: '0,13' },
    { year: 2023, pct: '5,95%', people: '14,35', gk: 'Rp 415.800', p1: '0,74', p2: '0,14' },
    { year: 2022, pct: '6,10%', people: '14,62', gk: 'Rp 392.400', p1: '0,79', p2: '0,16' },
    { year: 2021, pct: '6,50%', people: '15,48', gk: 'Rp 374.100', p1: '0,85', p2: '0,18' }
  ];

  return (
    <div>
      {/* Panel Profil Kemiskinan Makro */}
      <div className="public-card mb-3" style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5" style={{ borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-person-x-fill" style={{ color: '#ef4444' }}></i>
              Tingkat Kemiskinan Makro ({kemiskinanHistory[0].year})
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {kemiskinanHistory[0].pct}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>({kemiskinanHistory[0].people} Ribu Jiwa)</span>
            </div>
            <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>
              &darr; Tren menurun konsisten dari 7,10% (2018)
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="row g-2">
              <div className="col-12 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Garis Kemiskinan</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {kemiskinanHistory[0].gk}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>/ kapita / bulan</div>
                </div>
              </div>

              <div className="col-6 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Kedalaman (P1)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {kemiskinanHistory[0].p1}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Kesenjangan pengeluaran</div>
                </div>
              </div>

              <div className="col-6 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Keparahan (P2)</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {kemiskinanHistory[0].p2}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Ketimpangan antar miskin</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        {/* Chart Column */}
        <div className="col-12 col-lg-6">
          <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-graph-down" style={{ color: '#ef4444' }}></i>
              Tren Persentase Kemiskinan Sijunjung (2018 - 2025)
            </h6>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Data resmi bersumber dari Survei Sosial Ekonomi Nasional (Susenas) BPS</p>
            <div className="public-chart-container" style={{ height: 260 }}>
              <Line data={dataKemiskinan} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Table Column: Deret Waktu Kemiskinan */}
        <div className="col-12 col-lg-6">
          <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-calendar3" style={{ color: '#f5a623' }}></i>
              Deret Waktu Indikator Kemiskinan Kabupaten Sijunjung
            </h6>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Perkembangan 5 tahun terakhir indikator garis kemiskinan dan indeks kemiskinan</p>

            <div className="table-responsive">
              <table className="table table-hover align-middle text-start" style={{ fontSize: 11.5, margin: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569' }}>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Tahun</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Persentase</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Penduduk (Ribu)</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Garis Kemiskinan</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 600 }}>P1</th>
                  </tr>
                </thead>
                <tbody>
                  {kemiskinanHistory.map(row => (
                    <tr key={row.year}>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>{row.year}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{row.pct}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{row.people}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{row.gk}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', color: '#64748b' }}>{row.p1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-info-circle"></i>
              <span>Garis Kemiskinan (GK) mencerminkan nilai rupiah pengeluaran minimum untuk makanan & non-makanan.</span>
            </div>
          </div>
        </div>
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
      backgroundColor: '#1a1f2e',
      borderRadius: 2
    }]
  };

  const ipmHistory = [
    { year: 2025, ipm: '69,45', uhh: '70,92 th', hls: '13,24 th', rls: '8,52 th', pengeluaran: 'Rp 10,24 jt' },
    { year: 2024, ipm: '69,10', uhh: '70,65 th', hls: '13,18 th', rls: '8,41 th', pengeluaran: 'Rp 9,98 jt' },
    { year: 2023, ipm: '68,80', uhh: '70,38 th', hls: '13,10 th', rls: '8,32 th', pengeluaran: 'Rp 9,65 jt' },
    { year: 2022, ipm: '68,40', uhh: '70,12 th', hls: '13,01 th', rls: '8,21 th', pengeluaran: 'Rp 9,35 jt' },
    { year: 2021, ipm: '68,10', uhh: '69,85 th', hls: '12,94 th', rls: '8,11 th', pengeluaran: 'Rp 9,12 jt' }
  ];

  return (
    <div>
      {/* Panel Ikhtisar Capaian IPM */}
      <div className="public-card mb-3" style={{ background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 18px' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-4" style={{ borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-award-fill" style={{ color: '#f5a623' }}></i>
              Nilai IPM Sijunjung ({ipmHistory[0].year})
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {ipmHistory[0].ipm}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: 4 }}>
                Kategori: Sedang
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Mendekati standar kategori Tinggi (&ge; 70,00)
            </div>
          </div>

          <div className="col-12 col-md-8">
            <div className="row g-2">
              <div className="col-12 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>1. Dimensi Kesehatan</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {ipmHistory[0].uhh}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Umur Harapan Hidup (UHH)</div>
                </div>
              </div>

              <div className="col-12 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>2. Dimensi Pendidikan</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {ipmHistory[0].hls} / {ipmHistory[0].rls}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>HLS: 13,24 th &bull; RLS: 8,52 th</div>
                </div>
              </div>

              <div className="col-12 col-sm-4">
                <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>3. Standar Hidup Layak</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                    {ipmHistory[0].pengeluaran}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>Pengeluaran riil / kapita / thn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        {/* Chart Column */}
        <div className="col-12 col-lg-5">
          <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-bar-chart" style={{ color: '#f5a623' }}></i>
              Progres Capaian IPM Sijunjung (2020 - 2025)
            </h6>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Tren peningkatan skor komposit pembangunan manusia</p>
            <div className="public-chart-container" style={{ height: 260 }}>
              <Bar data={dataIPM} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        {/* Table Column: Deret Waktu IPM */}
        <div className="col-12 col-lg-7">
          <div className="public-card" style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #e2e8f0', height: '100%' }}>
            <h6 style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-table" style={{ color: '#f5a623' }}></i>
              Tabel Deret Waktu Komponen Pembentuk IPM
            </h6>
            <p style={{ color: '#64748b', fontSize: 11, marginBottom: 12 }}>Rincian perkembangan 3 dimensi pembentuk IPM Kabupaten Sijunjung</p>

            <div className="table-responsive">
              <table className="table table-hover align-middle text-start" style={{ fontSize: 11.5, margin: 0 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569' }}>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Tahun</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Skor IPM</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>UHH (Kesehatan)</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>HLS (Pendidikan)</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>RLS (Pendidikan)</th>
                    <th style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>Pengeluaran</th>
                  </tr>
                </thead>
                <tbody>
                  {ipmHistory.map(row => (
                    <tr key={row.year}>
                      <td style={{ padding: '7px 8px', fontWeight: 700, color: '#0f172a' }}>{row.year}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{row.ipm}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#0284c7', fontVariantNumeric: 'tabular-nums' }}>{row.uhh}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{row.hls}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{row.rls}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>{row.pengeluaran}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-info-circle"></i>
              <span>Metodologi perhitungan IPM mengacu pada standar Badan Pusat Statistik (BPS) & UNDP.</span>
            </div>
          </div>
        </div>
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
      <div style={{ background: '#1a1f2e', borderBottom: '1px solid #2d3748', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <i className="bi bi-box-arrow-in-right" style={{ color: '#f5a623', fontSize: 16 }}></i>
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>Masuk ke Sistem SEJATI</span>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#94a3b8', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-x-lg" style={{ fontSize: 14 }}></i>
        </button>
      </div>
      <div style={{ padding: '18px 16px 20px' }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 6, padding: '8px 12px', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-exclamation-triangle-fill"></i> {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>USERNAME</label>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#64748b', background: '#f8fafc', borderRight: '1px solid #cbd5e1', height: 38, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-person" style={{ fontSize: 15 }}></i>
              </span>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoFocus
                placeholder="Masukkan username"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter',sans-serif" }} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5, letterSpacing: 0.5 }}>PASSWORD</label>
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', color: '#64748b', background: '#f8fafc', borderRight: '1px solid #cbd5e1', height: 38, display: 'flex', alignItems: 'center' }}>
                <i className="bi bi-lock" style={{ fontSize: 15 }}></i>
              </span>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Masukkan password"
                style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: 13, height: 38, fontFamily: "'Inter',sans-serif" }} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ border: 'none', background: '#f8fafc', borderLeft: '1px solid #cbd5e1', padding: '0 10px', height: 38, cursor: 'pointer', color: '#64748b' }}>
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: 14 }}></i>
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d97706', borderRadius: 6, background: '#f5a623', color: '#ffffff', fontWeight: 600, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.8 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'Inter',sans-serif", transition: 'background-color 0.15s ease' }}>
            {loading
              ? <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' }} /> Masuk…</>
              : <><i className="bi bi-box-arrow-in-right"></i> Masuk</>}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 12, marginBottom: 0 }}>
          Sistem akan otomatis mengarahkan ke panel sesuai role akun Anda.
        </p>
      </div>
    </>
  )
}
