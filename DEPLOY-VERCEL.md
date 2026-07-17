# Panduan Deploy ke Vercel + Supabase

## 1. Setup Supabase

### a. Buat Project Supabase
1. Buka https://supabase.com → New Project
2. Catat: **Project URL** dan **Service Role Key** (dari Settings → API)
3. Catat **Database URL** (dari Settings → Database → Connection string → URI)

### b. Buat Storage Buckets
Di Supabase Dashboard → Storage → New Bucket:
- Buat bucket bernama `submissions` → set **Public**
- Buat bucket bernama `templates` → set **Public**

### c. Database
Tabel akan dibuat otomatis oleh SQLAlchemy saat pertama kali deploy.
Tidak perlu setup manual.

---

## 2. Setup Vercel

### a. Install Vercel CLI
```
npm i -g vercel
```

### b. Login
```
vercel login
```

### c. Set Environment Variables
Jalankan perintah ini satu per satu:
```
vercel env add DATABASE_URL
vercel env add JWT_SECRET_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add SUPABASE_UPLOADS_BUCKET
vercel env add SUPABASE_TEMPLATES_BUCKET
```

Isi nilainya:
- `DATABASE_URL` → postgresql://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres
- `JWT_SECRET_KEY` → string acak panjang (minimal 32 karakter)
- `SUPABASE_URL` → https://XXXX.supabase.co
- `SUPABASE_SERVICE_KEY` → service_role key dari Supabase
- `SUPABASE_UPLOADS_BUCKET` → submissions
- `SUPABASE_TEMPLATES_BUCKET` → templates

### d. Deploy
```
vercel --prod
```

---

## 3. Setelah Deploy

- URL aplikasi: `https://nama-project.vercel.app`
- Login default: **admin / admin123** (ganti segera setelah login pertama)

---

## Catatan Penting

- Vercel serverless function timeout maksimal 10 detik (plan gratis)
- File upload maksimal 4.5 MB per request di Vercel (plan gratis)
- Untuk file lebih besar, upgrade ke Vercel Pro atau gunakan Railway
