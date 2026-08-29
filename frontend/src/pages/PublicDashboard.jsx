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
          <h1 style={{
            color: '#fff',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(44px, 7vw, 68px)',
            margin: '0 0 10px',
            lineHeight: 1.1,
            letterSpacing: '0.08em',
            background: 'linear-gradient(to right, #ffffff 40%, #f5a623 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))'
          }}>
            SEJATI
          </h1>
          <p style={{ color: ACCENT, fontWeight: 700, fontSize: 'clamp(14px, 2.2vw, 18px)', margin: '0 0 16px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Sistem Jejaring Pengumpulan Data Statistik Terintegrasi
          </p>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Pusat pengumpulan data statistik terpadu dan akses indikator makro sektoral Kabupaten Sijunjung secara real-time yang bersumber langsung dari API Badan Pusat Statistik (BPS) & dinas terkait.
          </p>
        </div>
      </div>

      {/* ── Sub Navigation Tabs (BPS API Categories) ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 64, zIndex: 90, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 8, overflowX: 'auto', padding: '0 20px' }}>
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
      // Beautiful HSL scale from light teal/blue to rich indigo blue
      const hue = 210 + ratio * 20; // 210 (blue) to 230 (indigo)
      const sat = 70 + ratio * 15;  // 70% to 85%
      const light = 90 - ratio * 45; // 90% (very light) to 45% (vibrant)
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
    const sat = 70 + ratio * 15;
    const light = 90 - ratio * 45;
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
          backgroundColor: '#5c8cbc', // soft premium muted blue
          borderRadius: 4,
        },
        {
          label: 'Perempuan',
          data: femaleValues,
          backgroundColor: '#e88d9e', // soft premium muted rose pink
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
          backgroundColor: '#5c8cbc', // soft premium muted blue
          borderRadius: 4
        },
        {
          label: 'Perempuan',
          data: ageProjectionData.female,
          backgroundColor: '#e88d9e', // soft premium muted rose pink
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
          backgroundColor: '#5cbca9', // soft premium muted teal
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
      <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: 20 }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <p style={{ color: '#1a1f2e', fontSize: 14, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f5a623', display: 'inline-block' }}></span>
              Visualisasi penduduk secara interaktif bersumber langsung dari Web API BPS Kabupaten Sijunjung
            </p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>Pilih Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: '1px solid #d1d5db',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#1f2937',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'border-color 0.15s ease'
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
                className="btn btn-outline-primary d-flex align-items-center gap-2"
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  background: '#fff',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                }}
              >
                {exportingPdf ? (
                  <>
                    <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
                    <span>Mengekspor...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-file-earmark-pdf-fill" style={{ color: '#ef4444' }}></i>
                    <span>Ekspor Laporan PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb' }}>
          <div className="spinner-border" role="status" style={{ width: '3rem', height: '3rem', color: '#f5a623' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <span style={{ marginTop: 16, color: '#6b7280', fontWeight: 600, fontSize: 14 }}>Menghubungi Web API BPS...</span>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, border: '1px solid #fee2e2', borderRadius: 14, background: '#fef2f2', padding: '40px', textAlign: 'center' }}>
          <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }}></i>
          <h5 style={{ fontWeight: 800, color: '#991b1b', marginBottom: '8px' }}>Koneksi API Gagal</h5>
          <p style={{ color: '#b91c1c', fontSize: '13px', maxWidth: '480px', marginBottom: '20px', lineHeight: 1.5 }}>
            {error}
          </p>
          <button onClick={() => fetchData(selectedYear)} className="btn btn-danger" style={{ fontWeight: 600, padding: '8px 24px', borderRadius: '10px', background: '#dc2626', border: 'none' }}>
            <i className="bi bi-arrow-clockwise me-2"></i>Coba Lagi
          </button>
        </div>
      ) : (!mappedData && !genderData && !ageProjectionData) ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, border: '1px dashed #cbd5e1', borderRadius: 14, background: '#fff', padding: '40px', textAlign: 'center' }}>
          <i className="bi bi-cloud-slash" style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '16px' }}></i>
          <h5 style={{ fontWeight: 800, color: '#334155', marginBottom: '8px' }}>Data Kependudukan Belum Tersedia</h5>
          <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '420px', lineHeight: 1.5 }}>
            Data Jumlah Penduduk, Rincian Jenis Kelamin, maupun Proyeksi Kelompok Umur untuk tahun <strong>{selectedYear}</strong> belum dipublikasikan atau tidak ditemukan di Web API BPS Kabupaten Sijunjung.
          </p>
        </div>
      ) : (
        <div id="penduduk-report-content" style={{ padding: 16, background: '#f8fafc', borderRadius: 14 }}>
          <div id="report-page-1" style={{ background: '#f8fafc', borderRadius: 14 }}>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {[
              { title: 'Total Penduduk Kecamatan', value: parseFloat(totalPopulation).toLocaleString('id-ID'), unit: 'Ribu Jiwa', icon: 'bi-people-fill', color: '#3b82f6', bg: '#eff6ff' },
              { title: 'Kecamatan Terpadat', value: maxKec ? maxKec.value.toLocaleString('id-ID') : '-', unit: maxKec ? `${maxKec.label} (Ribu Jiwa)` : '', icon: 'bi-graph-up-arrow', color: '#10b981', bg: '#ecfdf5' },
              { title: 'Kecamatan Terjarang', value: minKec ? minKec.value.toLocaleString('id-ID') : '-', unit: minKec ? `${minKec.label} (Ribu Jiwa)` : '', icon: 'bi-graph-down-arrow', color: '#ef4444', bg: '#fef2f2' },
              { title: 'Rata-rata Penduduk', value: (totalPopulation / 8).toFixed(2).toLocaleString('id-ID'), unit: 'Ribu Jiwa per Kecamatan', icon: 'bi-calculator', color: '#8b5cf6', bg: '#f5f3ff' }
            ].map(c => (
              <div className="col-12 col-sm-6 col-md-3" key={c.title}>
                <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bi ${c.icon}`} style={{ color: c.color, fontSize: 18 }}></i>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 2 }}>{c.title}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#1a1f2e', lineHeight: 1.1, display: 'inline-block', marginRight: 4 }}>{c.value}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 2 }}>{c.unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Map and Table Split Screen */}
          {mappedData ? (
            <div className="row g-4">
            {/* Map Column */}
            <div className="col-lg-7">
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h6 style={{ fontWeight: 800, color: '#1a1f2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-map" style={{ color: '#f5a623' }}></i>
                  Peta Distribusi Penduduk
                </h6>
                <div 
                  style={{ position: 'relative', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: 10, padding: 12, minHeight: 380 }}
                  onMouseMove={handleMouseMove}
                >
                  <svg
                    viewBox="0 0 800 500"
                    width="100%"
                    height="100%"
                    style={{ maxHeight: 420 }}
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
                      />
                    ))}
                    {/* Active/Hovered path overlay drawn on top for a sharp thick border */}
                    {hoveredKec && (
                      <path
                        d={hoveredKec.d}
                        fill="none"
                        stroke="#1a1f2e"
                        strokeWidth={3}
                        style={{
                          pointerEvents: 'none',
                          filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.25))'
                        }}
                      />
                    )}
                  </svg>
                  
                  {/* Floating Tooltip */}
                  {hoveredKec && (
                    <div style={{
                      position: 'fixed',
                      left: mousePos.x + 15,
                      top: mousePos.y + 15,
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: 10,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                      pointerEvents: 'none',
                      zIndex: 9999,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#f5a623', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                        Kecamatan
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 4 }}>
                        {hoveredKec.label}
                      </div>
                      <div style={{ fontSize: 12 }}>
                        Total Penduduk: <strong style={{ color: '#38bdf8', fontSize: 13 }}>{hoveredKec.value !== null ? hoveredKec.value.toLocaleString('id-ID') : '-'}</strong> ribu jiwa
                      </div>
                      {genderData?.[hoveredKec.bpsCode] && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, fontSize: 11, color: '#e2e8f0' }}>
                          <div>L: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{genderData[hoveredKec.bpsCode].male.toLocaleString('id-ID')}k</span></div>
                          <div>P: <span style={{ color: '#f472b6', fontWeight: 700 }}>{genderData[hoveredKec.bpsCode].female.toLocaleString('id-ID')}k</span></div>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                        Sumber Data: BPS ({selectedYear})
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend bar */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Rentang Jumlah Penduduk (Ribu Jiwa)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {legendItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 3, background: item.color, display: 'inline-block' }}></span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#4b5563' }}>{item.label}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 14, height: 14, borderRadius: 3, background: '#f1f5f9', border: '1px solid #cbd5e1', display: 'inline-block' }}></span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#4b5563' }}>Tidak ada data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Column */}
            <div className="col-lg-5">
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h6 style={{ fontWeight: 800, color: '#1a1f2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-table" style={{ color: '#3b82f6' }}></i>
                  Tabel Rincian Kecamatan ({selectedYear})
                </h6>
                <div className="table-responsive" style={{ flexGrow: 1 }}>
                  <table className="table table-hover align-middle text-start" style={{ fontSize: 12, margin: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', color: '#475569' }}>
                        <th style={{ padding: '12px 8px', borderBottom: '2px solid #e2e8f0' }}>Kecamatan</th>
                        <th style={{ padding: '12px 8px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Jumlah</th>
                        <th style={{ padding: '12px 8px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paths.map(path => {
                        const pct = totalPopulation && path.value 
                          ? ((path.value / totalPopulation) * 100).toFixed(2) 
                          : '-';
                        return (
                          <tr 
                            key={path.id} 
                            style={{ 
                              background: hoveredKec?.bpsCode === path.bpsCode ? '#f8fafc' : 'transparent',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={() => setHoveredKec(path)}
                            onMouseLeave={() => setHoveredKec(null)}
                          >
                            <td style={{ padding: '10px 8px', fontWeight: 600, color: '#1e293b' }}>{path.label}</td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#3b82f6' }}>
                              {path.value !== null ? `${path.value.toLocaleString('id-ID')} ribu` : '-'}
                            </td>
                            <td style={{ padding: '10px 8px', textAlign: 'right', color: '#64748b' }}>
                              {pct !== '-' ? `${pct}%` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                        <td style={{ padding: '12px 8px' }}>Kabupaten Sijunjung (Total)</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>
                          {parseFloat(totalPopulation).toLocaleString('id-ID')} ribu
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', color: '#1e293b' }}>100.00%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 16, display: 'flex', justifyBetween: 'center', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-info-circle"></i>
                  <span>Arahkan kursor pada peta atau tabel untuk berinteraksi.</span>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, padding: '40px', border: '1px dashed #cbd5e1', textAlign: 'center', marginBottom: 20 }}>
              <i className="bi bi-map" style={{ fontSize: '36px', color: '#94a3b8', display: 'block', marginBottom: 12 }}></i>
              <h6 style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>Peta Distribusi Penduduk Belum Tersedia</h6>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Data geografis peta kecamatan untuk tahun <strong>{selectedYear}</strong> belum dipublikasikan oleh BPS Kabupaten Sijunjung.</p>
            </div>
          )}
          </div>

          {/* Bar Chart Section */}
          <div id="report-page-2">
          {genderData ? (
            <div style={{ marginTop: 24, background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <h6 style={{ fontWeight: 800, color: '#1a1f2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="bi bi-bar-chart-line" style={{ color: '#ec4899' }}></i>
                Jumlah Penduduk Menurut Kecamatan dan Jenis Kelamin ({selectedYear})
              </h6>
              <div style={{ height: 350 }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <i className="bi bi-info-circle"></i>
                <span>Sumber: Web API BPS Kabupaten Sijunjung (Variabel: Jumlah Penduduk menurut Kecamatan dan Jenis Kelamin)</span>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 24, background: '#fff', borderRadius: 14, padding: '40px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
              <i className="bi bi-bar-chart-line" style={{ fontSize: '36px', color: '#94a3b8', display: 'block', marginBottom: 12 }}></i>
              <h6 style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>Rincian Jenis Kelamin Belum Tersedia</h6>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Data rincian jenis kelamin per kecamatan untuk tahun <strong>{selectedYear}</strong> belum dipublikasikan oleh BPS Kabupaten Sijunjung.</p>
            </div>
          )}
          </div>

          {/* Age Projection Chart Section */}
          {ageProjectionData ? (
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Split Gender Chart */}
              <div id="report-page-3" style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h6 style={{ fontWeight: 800, color: '#1a1f2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-bar-chart-steps" style={{ color: '#3b82f6' }}></i>
                  Proyeksi Penduduk Sijunjung Menurut Kelompok Umur dan Jenis Kelamin ({selectedYear})
                </h6>
                <div style={{ height: 550 }}>
                  <Bar data={ageProjectionChartData} options={ageProjectionChartOptions} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-info-circle"></i>
                  <span>Sumber: Web API BPS Kabupaten Sijunjung (Variabel: Proyeksi Penduduk Menurut Kelompok Umur - Laki-Laki & Perempuan)</span>
                </div>
              </div>

              {/* Total Population Chart */}
              <div id="report-page-4" style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h6 style={{ fontWeight: 800, color: '#1a1f2e', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="bi bi-bar-chart-steps" style={{ color: '#5cbca9' }}></i>
                  Total Proyeksi Penduduk Sijunjung Menurut Kelompok Umur ({selectedYear})
                </h6>
                <div style={{ height: 550 }}>
                  <Bar data={ageProjectionTotalChartData} options={ageProjectionChartOptions} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-info-circle"></i>
                  <span>Sumber: Web API BPS Kabupaten Sijunjung (Variabel: Total Proyeksi Penduduk Menurut Kelompok Umur)</span>
                </div>
              </div>
            </div>
          ) : (
            <div id="report-page-3" style={{ marginTop: 24, background: '#fff', borderRadius: 14, padding: '40px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
              <i className="bi bi-bar-chart-steps" style={{ fontSize: '36px', color: '#94a3b8', display: 'block', marginBottom: 12 }}></i>
              <h6 style={{ fontWeight: 700, color: '#475569', marginBottom: 4 }}>Proyeksi Kelompok Umur Belum Tersedia</h6>
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
