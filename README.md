<div align="center">

# 📊 SEJATI
### **Sistem Jejaring Pengumpulan Data Statistik Terintegrasi**
**Badan Pusat Statistik (BPS) Kabupaten Sijunjung**

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Backend-Python%20%7C%20Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-336791?logo=postgresql&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel%20Serverless-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*Platform terpadu tata kelola Satu Data Indonesia di tingkat daerah untuk mempercepat rekonsiliasi, verifikasi, visualisasi, dan diseminasi data statistik sektoral.*

---

</div>

## 📑 Daftar Isi
1. [Tentang SEJATI](#-tentang-sejati)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur & Teknologi](#-arsitektur--teknologi)
4. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
5. [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
6. [Panduan Deployment Production (Vercel + Supabase)](#-panduan-deployment-production-vercel--supabase)
7. [Akun Bawaan (Default Credentials)](#-akun-bawaan-default-credentials)
8. [Standar Desain & Keamanan](#-standar-desain--keamanan)
9. [Kontribusi & Lisensi](#-kontribusi--lisensi)

---

## 💡 Tentang SEJATI

**SEJATI** (*Sistem Jejaring Pengumpulan Data Statistik Terintegrasi*) dikembangkan sebagai solusi digital modern dalam mendukung peran **BPS Kabupaten Sijunjung** sebagai Pembina Data Statistik Sektoral dan **Dinas Kominfo** sebagai Walidata Daerah dalam kerangka regulasi **Satu Data Indonesia (SDI)**.

Aplikasi ini mengatasi kendala klasik pengumpulan data sektoral manual berbasis spreadsheet berulang dengan menyediakan:
- **Alur Kerja Terstandar**: Mulai dari penerbitan surat tugas digital, pengunduhan template Excel tervalidasi, entri form digital langsung, hingga penandatanganan elektronik surat pengantar.
- **Validasi Berjenjang**: Review berulang dengan catatan revisi interaktif dan approval sebelum data dipublikasikan.
- **Diseminasi Publik Real-time**: Terintegrasi langsung dengan Web API resmi BPS Kabupaten Sijunjung (Domain 1304) untuk visualisasi indikator strategis daerah.

---

## 🚀 Fitur Utama

### 🌐 1. Dashboard Publik Terbuka (Public Dashboard)
- **Koneksi Langsung ke Web API BPS Sijunjung (Domain 1304)**:
  - Menyajikan data deret waktu (*time-series*) indikator kependudukan, jenis kelamin, dan proyeksi kelompok umur.
- **Peta Tematik Kloroplet Interaktif 8 Kecamatan**:
  - Peta SVG interaktif Kabupaten Sijunjung (Kamang Baru, Tanjung Gadang, Sijunjung, Lubuk Tarok, IV Nagari, Kupitan, Koto Tujuh, Sumpur Kudus).
  - Sinkronisasi sorot (*hover & click sync*) antara wilayah peta dan baris tabel rincian kecamatan.
- **Ekspor Laporan PDF Resmi**:
  - Konversi visualisasi dan analisis data menjadi dokumen laporan multi-halaman berstandar resmi (menggunakan `html2canvas` & `jsPDF`) dilengkapi kop surat SEJATI.
- **Indikator Strategis Makro**:
  - Kependudukan, Ketenagakerjaan (TPAK & TPT), Pertumbuhan Ekonomi/PDRB, Kemiskinan, dan Indeks Pembangunan Manusia (IPM).
- **Dual Theme Support**:
  - Mode Terang (Default) dan Mode Gelap (*Dark Mode*) dengan rasio kontras tinggi dan persistensi preferensi via `localStorage`.

### 👑 2. Portal Admin (Pembina Data & Walidata)
- **Ringkasan Eksekutif & Statistik Pengumpulan Data**:
  - Metrik submission, rasio penyelesaian tugas OPD, dan status verifikasi terkini.
- **Manajemen Pengguna (User Management CRUD)**:
  - Kelola akun Admin, Kontributor OPD, dan Viewer lengkap dengan kontak WhatsApp untuk notifikasi.
- **Dynamic Data Type & Schema Builder**:
  - Pembuatan tipe data statistik dinamis dengan definisi skema field kustom (teks, angka, tanggal, dropdown, validasi wajib/opsional).
- **Penugasan Pengumpulan Data (Task Management)**:
  - Distribusi tugas ke OPD terkait dengan penetapan tenggat waktu (*deadline*) dan pelampiran Surat Tugas dinamis.
- **Generator & Pengelola Template Excel**:
  - Unggah template Excel master atau buat template otomatis dari definisi skema field.
- **Verifikasi & Approval Berjenjang**:
  - Pemeriksaan berkas Excel yang diunggah atau data form digital, pemberian catatan revisi, atau persetujuan (*approve*).
- **Arsip Surat Pengantar & Tanda Tangan Digital**:
  - Pelacakan dan validasi berkas surat pengantar yang telah ditandatangani oleh pejabat produsen data.

### 📝 3. Portal Kontributor (Produsen Data / OPD)
- **Dashboard Tugas Terstruktur**:
  - Pemantauan tugas baru, tugas yang mendekati tenggat waktu, dan tugas yang memerlukan revisi.
- **Pengunduhan Dokumen Tugas**:
  - Unduh Surat Tugas resmi dan Template Excel yang telah distandardisasi.
- **Pengiriman Data Fleksibel**:
  - Unggah file Excel (.xlsx) atau pengisian data langsung melalui antarmuka *Spreadsheet Form*.
- **Tanda Tangan Elektronik Surat Pengantar**:
  - Fitur canvas tanda tangan digital untuk melengkapi legalitas pengiriman data sebelum diserahkan ke Walidata/Pembina Data.
- **Transparansi Riwayat Pengiriman**:
  - Catatan riwayat revisi dan feedback transparan dari tim verifikator.

### 👁️ 4. Portal Viewer (Internal Terverifikasi)
- **Katalog Data Sektoral Terverifikasi**:
  - Akses terpadu ke seluruh kumpulan data yang telah berstatus *Approved*.
- **Pencarian & Filter Canggih**:
  - Filter berdasarkan OPD, jenis data, tahun, atau kata kunci.
- **Ekspor Data Bersih**:
  - Unduh dataset bersih terverifikasi dalam format Microsoft Excel (.xlsx).

---

## 🛠️ Arsitektur & Teknologi

| Lapisan | Komponen | Deskripsi |
|---|---|---|
| **Frontend** | React 18, Vite | Single Page Application (SPA) cepat dengan arsitektur komponen modular |
| **Routing** | React Router DOM v6 | Manajemen navigasi berbasis role (*RBAC Protection*) |
| **Visualisasi** | Chart.js, react-chartjs-2 | Visualisasi grafik batang, garis, donat, dan tren waktu |
| **Peta Spasial** | Custom SVG & GeoJSON | Peta kloroplet 8 kecamatan Kabupaten Sijunjung |
| **Dokumentasi PDF** | jsPDF, html2canvas | Pembuat dokumen laporan multi-halaman profesional dari DOM |
| **UI & Styling** | Bootstrap 5, Bootstrap Icons, Custom CSS | Desain konsisten Navy (`#1a1f2e`) + Orange (`#f5a623`), anti-AI-slop |
| **Backend API** | Python 3.10+, Flask | RESTful API terstruktur menggunakan modular Flask Blueprints |
| **Autentikasi** | Flask-JWT-Extended | Stateless JSON Web Token dengan kontrol hak akses |
| **Database & ORM** | Flask-SQLAlchemy, PostgreSQL / SQLite | Abstraksi model relasional dengan migrasi otomatis |
| **Excel Engine** | openpyxl | Parsing, validasi, dan generate spreadsheet Excel dinamis |
| **File Storage** | Supabase Storage / Local Storage | Penyimpanan berkas submission, template, dan tanda tangan digital |
| **Deploy Serverless** | Vercel | Hosting serverless edge (Python WSGI runtime + Static Vite build) |

---

## 📁 Struktur Direktori Proyek

```plaintext
data-collection-app/
├── api/
│   └── index.py               # Entrypoint serverless WSGI untuk Vercel
├── asset/
│   └── shapefile/             # Master koordinat dan shapefile batas kecamatan
├── backend/
│   ├── app.py                 # Inisialisasi Flask, blueprint, migrasi & config
│   ├── models.py              # Definisi model database (User, Task, Submission, dll.)
│   ├── storage.py             # Abstraksi storage (Supabase Bucket & lokal)
│   ├── requirements.txt       # Daftar pustaka Python
│   ├── routes/                # Endpoint modular REST API
│   │   ├── admin.py           # Endpoint administrasi & verifikasi
│   │   ├── auth.py            # Autentikasi JWT (Login & Me)
│   │   ├── contributor.py     # Endpoint aksi kontributor
│   │   ├── dashboard.py       # Endpoint agregasi metrik dashboard
│   │   ├── penduduk.py        # Endpoint proxy data BPS & kependudukan
│   │   └── viewer.py          # Endpoint data publik/internal viewer
│   └── utils/                 # Utility helper (Excel parser, validator)
├── frontend/
│   ├── index.html             # Entry point HTML Vite
│   ├── package.json           # Dependensi JavaScript
│   ├── vite.config.js         # Konfigurasi build Vite & proxy API lokal
│   └── src/
│       ├── api/               # Klien Axios & interseptor request
│       ├── base.css           # Sistem desain global & aturan tema gelap
│       ├── components/        # Komponen UI (Peta, Logo, Toggle Tema, dll.)
│       ├── context/           # React Context (AuthContext, ThemeContext)
│       └── pages/             # Halaman aplikasi berdasarkan role
│           ├── PublicDashboard.jsx  # Dashboard statistik publik & kependudukan
│           ├── Login.jsx            # Autentikasi masuk pengguna
│           ├── admin/               # Modul halaman admin
│           ├── contributor/         # Modul halaman kontributor
│           └── viewer/              # Modul halaman viewer
├── vercel.json                # Konfigurasi build & routing Vercel Serverless
├── DEPLOY-VERCEL.md           # Petunjuk teknis deploy Vercel + Supabase
└── README.md                  # Dokumentasi utama proyek
```

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### Prasyarat:
- **Node.js** v18.0 atau yang lebih baru
- **Python** v3.10 atau yang lebih baru
- **Git**

### Langkah 1: Clone Repository
```bash
git clone https://github.com/Fauzanazimaa/deploy1.git
cd deploy1
```

### Langkah 2: Setup Backend (Python Flask)
1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```
2. Buat dan aktifkan virtual environment:
   ```bash
   # Di Windows:
   python -m venv venv
   venv\Scripts\activate

   # Di macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Pasang dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```
4. Jalankan backend server:
   ```bash
   python app.py
   ```
   > Backend akan otomatis membuat database lokal SQLite (`data_collection.db`) dan berjalan di `http://localhost:5001`.

### Langkah 3: Setup Frontend (React + Vite)
1. Buka terminal baru dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```
2. Pasang dependensi paket Node:
   ```bash
   npm install
   ```
3. Jalankan server pengembang (*development server*):
   ```bash
   npm run dev
   ```
4. Buka browser pada alamat:
   ```
   http://localhost:3000
   ```

---

## ☁️ Panduan Deployment Production (Vercel + Supabase)

Arsitektur aplikasi didesain *cloud-native* tanpa memerlukan server VPS mandiri:

### 1. Persiapan Supabase
1. Buat proyek baru di [Supabase](https://supabase.com/).
2. Buat 2 Storage Bucket publik pada menu **Storage**:
   - `submissions` (Set sebagai **Public**)
   - `templates` (Set sebagai **Public**)
3. Dapatkan string koneksi database PostgreSQL pada menu **Project Settings → Database** (Connection pooling URI).
4. Dapatkan **Project URL** dan **Service Role Key** pada menu **Project Settings → API**.

### 2. Konfigurasi Environment Variables di Vercel
Pada proyek Vercel Anda, tambahkan environment variables berikut:

| Nama Variabel | Contoh Nilai | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@aws-1-...pooler.supabase.com:6543/postgres` | URI PostgreSQL Supabase |
| `JWT_SECRET_KEY` | `string-rahasia-acak-minimal-32-karakter` | Kunci enkripsi token JWT |
| `SUPABASE_URL` | `https://[ref].supabase.co` | URL endpoint Supabase |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` | Service role key Supabase |
| `SUPABASE_UPLOADS_BUCKET` | `submissions` | Nama bucket berkas submission |
| `SUPABASE_TEMPLATES_BUCKET`| `templates` | Nama bucket berkas template |

### 3. Deploy ke Vercel
Cukup dorong perubahan ke branch `main` pada GitHub:
```bash
git add -A
git commit -m "feat: deploy to production"
git push origin main
```
*Vercel akan secara otomatis membangun frontend Vite dan membungkus API Python Flask ke dalam Vercel Serverless Function.*

---

## 🔑 Akun Bawaan (Default Credentials)

Saat pertama kali dijalankan, sistem secara otomatis menginisialisasi akun administrator utama:

| Role | Username | Password Default | Catatan |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Akses penuh seluruh portal |
| **Kontributor** | *(Dibuat oleh Admin)* | *(Diatur oleh Admin)* | Tambah via menu Kelola Pengguna |
| **Viewer** | *(Dibuat oleh Admin)* | *(Diatur oleh Admin)* | Tambah via menu Kelola Pengguna |

> ⚠️ **PENTING**: Segera ubah kata sandi akun administrator setelah proses instalasi berhasil dilakukan di lingkungan produksi!

---

## 🎨 Standar Desain & Keamanan

### Filosofi Desain (SEJATI Design System):
- **Identitas Visual**: Mengusung warna Navy (`#1a1f2e`) yang tegas melambangkan integritas institusi, dipadukan dengan aksen Orange Gold (`#f5a623`) yang modern dan dinamis.
- **Anti-AI-Slop Principle**: Menghindari elemen visual berlebihan seperti dekorasi gradasi warna-warni yang mengganggu, glassmorphism buram berlebih, dan kartu bertumpuk tanpa hierarki informasi yang jelas.
- **Tipografi Bersih**: Menggunakan font *Inter* dengan pembobotan hierarki visual yang ketat dan mudah dibaca pada berbagai resolusi layar (responsif dari ponsel hingga desktop).
- **Sinkronisasi Tema Adaptif**: Mode gelap dirancang khusus dengan latar slate gelap (`#0b0f19` & `#151c2c`) dengan kontras tinggi sehingga data tabel dan angka tetap terlihat tajam dan nyaman di mata.

### Standar Keamanan:
- **Stateless JWT**: Sesi login terenkripsi berbasis JWT dengan masa kedaluwarsa aman.
- **Role-Based Access Control (RBAC)**: Setiap endpoint API diproteksi dengan verifikasi peran pengguna sebelum data diproses.
- **SQL Injection Prevention**: Penggunaan SQLAlchemy ORM parameter binding menyeluruh.
- **CORS Restricted**: Pengaturan CORS terstandar untuk membatasi pemanggilan API ilegal.

---

## 📄 Kontribusi & Lisensi

Proyek ini dikembangkan dalam rangka aktualisasi dan digitalisasi pelayanan statistik terintegrasi di lingkungan **Badan Pusat Statistik (BPS) Kabupaten Sijunjung**.

Didistribusikan di bawah lisensi **MIT License**. Lihat file `LICENSE` untuk rincian lebih lanjut.

---

<div align="center">

**BPS Kabupaten Sijunjung**  
*Melayani dengan Hati, Memberi Makna Melalui Data*  
[https://sijunjungkab.bps.go.id](https://sijunjungkab.bps.go.id)

</div>
