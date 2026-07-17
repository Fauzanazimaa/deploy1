# DataCollect - Sistem Pengumpulan Data

Aplikasi web untuk mengumpulkan dan mengelola data dengan 3 role: Admin, Kontributor, dan Viewer.

---

## 🚀 Cara Menjalankan (SUPER GAMPANG!)

### ⭐ **CARA 1: Double-click file ini** ⭐
```
START-HERE.bat
```
Otomatis cek Python, install dependencies, buka browser!

### ⭐ **CARA 2: Kalau cara 1 gagal** ⭐  
```
JALANKAN-APLIKASI.py
```
Klik kanan → Open with Python

---

## 📌 PENTING!

**✅ JANGAN tutup jendela CMD hitam yang muncul!**  
Server berjalan di situ. Kalau ditutup = aplikasi mati.

**✅ Browser otomatis terbuka ke:**  
`http://localhost:5001/home`

**✅ Kalau terputus:**
- Lihat jendela CMD, ada error merah?
- Screenshot error-nya
- Atau lihat section Troubleshooting di bawah

---

## 🔑 Login Default

| Role | Username | Password |
|---|---|---|
| **Admin** | admin | admin123 |
| **Kontributor** | contributor | contributor123 |
| **Viewer** | viewer | viewer123 |

---

## 🎯 Fitur per Role

### 👑 Admin
✅ Kelola users (CRUD)  
✅ Buat jenis data & field schema  
✅ Assign tugas ke kontributor  
✅ Upload/generate template Excel  
✅ Verifikasi & approve data  
✅ Tambah data manual  
✅ Dashboard lengkap  

### 📝 Kontributor  
✅ Lihat tugas  
✅ Download template  
✅ Upload data  
✅ Lihat status & catatan revisi  

### 👁️ Viewer (Publik)
✅ Lihat data approved  
✅ Filter per jenis data  
✅ Export Excel  
✅ View kartu/tabel  

---

## 📁 Struktur Project

```
data-collection-app/
├── START-HERE.bat           ← KLIK INI! (recommended)
├── JALANKAN-APLIKASI.py     ← Alternatif
├── home.html                ← UI utama
├── README.md                ← File ini
│
├── backend/
│   ├── app.py               ← Flask server
│   ├── models.py            ← Database models
│   ├── routes/              ← API endpoints
│   │   ├── auth.py
│   │   ├── admin.py
│   │   ├── contributor.py
│   │   └── viewer.py
│   ├── utils/               ← Helper functions
│   ├── data_collection.db   ← SQLite database (auto-created)
│   └── requirements.txt     ← Dependencies
│
└── frontend/                ← React app (opsional)
    ├── src/
    └── package.json
```

---

## ❓ Troubleshooting

### 🔴 "Refused to connect" / "Terputus"

**Penyebab:** Jendela CMD backend tertutup

**Solusi:**
1. Jangan tutup jendela CMD yang muncul!
2. Kalau sudah tertutup, jalankan ulang `START-HERE.bat`
3. Biarkan jendela CMD tetap terbuka selama pakai aplikasi

---

### 🔴 "Python not found"

**Solusi:**
1. Install Python: https://python.org/downloads
2. ⚠️ **PENTING:** Centang **"Add Python to PATH"** saat install!
3. Restart komputer
4. Coba lagi

---

### 🔴 "Module not found" / Import Error

**Solusi otomatis:** Jalankan `JALANKAN-APLIKASI.py` (auto-install dependencies)

**Solusi manual:**
```bash
cd backend
pip install -r requirements.txt
```

---

### 🔴 "Port 5001 already in use"

**Penyebab:** Ada aplikasi lain pakai port 5001

**Solusi:**
1. Tutup aplikasi lain yang pakai port 5001
2. Atau ganti port:
   - Edit `backend/app.py`
   - Cari baris: `port=5001`
   - Ganti jadi: `port=5002`
   - Edit `home.html`
   - Cari: `localhost:5001`
   - Ganti jadi: `localhost:5002`

---

### 🔴 Login berhasil tapi redirect gagal

**Ini NORMAL!** Frontend React tidak wajib jalan.

**Solusi:**
- Klik **"Cancel"** saat dialog muncul
- Tetap bisa pakai home.html untuk lihat data
- Untuk fitur admin lengkap (opsional):
  ```bash
  cd frontend
  npm install
  npm run dev
  ```

---

### 🔴 Database corrupt / Error database

**Solusi:**
1. Tutup aplikasi
2. Hapus file `backend/data_collection.db`
3. Jalankan ulang — database baru otomatis dibuat
4. Login dengan: `admin` / `admin123`

---

### 🔴 Lupa password

**Reset via Python console:**
```bash
cd backend
python
```
```python
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='admin').first()
    user.password_hash = generate_password_hash('newpass123')
    db.session.commit()
    print('✅ Password updated!')
```

---

## 🛠️ Development

### Install Dependencies
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend (opsional)
cd frontend
npm install
```

### Run Development Mode
```bash
# Backend only
cd backend
python app.py

# Frontend (terminal terpisah)
cd frontend
npm run dev
```

---

## 📝 Catatan

- Database: SQLite (auto-created di `backend/data_collection.db`)
- Port default: 5001 (backend), 3000 (frontend)
- Browser: Chrome/Edge/Firefox recommended
- Python: 3.7+ required
- Node.js: Optional (hanya untuk frontend React)

---

## 📧 Support

Jika masih error:
1. Screenshot jendela CMD yang ada error merah
2. Copy-paste text error
3. Kirim ke developer
