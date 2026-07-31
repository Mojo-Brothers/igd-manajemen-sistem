# Primaya Hospital - IGD Doctor Schedule Display

Sistem Informasi Jadwal Dokter Jaga (On-Call) Instalasi Gawat Darurat (IGD) Primaya Hospital. Aplikasi ini dirancang khusus untuk ditampilkan pada layar TV (42 inci, 1080p) di area publik IGD, dilengkapi dengan Panel Admin komprehensif untuk mengelola jadwal bulanan maupun harian secara real-time.

## 🌟 Fitur Utama

### 1. TV Display Mode (Frontend)
- **Tampilan Khusus Layar TV**: Desain fullscreen 1920x1080 tanpa scrollbar.
- **Auto-Sync Real-time**: Perubahan dari admin langsung tampil di layar tanpa perlu refresh.
- **Informasi Dinamis**: Menampilkan jam digital, tanggal, teks berjalan (running text), dan status ketersediaan dokter on-call untuk berbagai departemen spesialis.

### 2. Admin Dashboard (Backend Management)
- **Master Data Dokter**: Kelola daftar dokter spesialis dengan dukungan **Import/Export ke Excel (.xlsx)**.
- **Jadwal Bulanan (Upload Excel)**: Admin tidak perlu menginput satu per satu. Cukup upload template Excel jadwal sebulan penuh, sistem akan otomatis mengatur jadwal harian.
- **Riwayat Jadwal (History)**: Fitur pelacakan riwayat jadwal yang telah diupload berdasarkan bulan dan tahun, lengkap dengan opsi **Download ke Excel**.
- **Jadwal Hari Ini (Override System)**: Menampilkan jadwal aktif untuk hari ini (otomatis ditarik dari Jadwal Bulanan). Admin dapat melakukan perubahan mendadak (*override*) jika ada dokter yang berhalangan atau cuti tanpa mengubah data induk bulanan.
- **Pengaturan Global**: Kustomisasi warna tema, nama rumah sakit, running text, dan penyesuaian jam pergantian jadwal (misal: jadwal berganti tiap jam 08:00 pagi, bukan tengah malam).

## 🛠️ Teknologi yang Digunakan (Tech Stack)

- **Frontend**: React 18, TypeScript, Vite, React Router DOM v6
- **Styling**: Tailwind CSS v4, Framer Motion (untuk animasi UI)
- **Backend & Database**: Firebase Firestore (NoSQL Real-time), Firebase Authentication
- **Utilitas**: SheetJS (XLSX) untuk integrasi dan pengolahan data file Excel

## ⚙️ Persyaratan Sistem (Prerequisites)

1. Node.js (direkomendasikan versi 18 atau terbaru)
2. Akun Firebase dengan layanan berikut aktif:
   - **Authentication**: Mode Email/Password
   - **Firestore Database**

### Aturan Keamanan Firebase (Security Rules)

Pastikan Anda menerapkan *rules* ini di console Firestore Anda:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tampilan TV IGD (public) dapat membaca semua data
    match /{document=**} {
      allow read: if true;
      // Hanya Admin yang sudah login dapat menulis/mengubah data
      allow write: if request.auth != null;
    }
  }
}
```

## 🚀 Panduan Instalasi & Menjalankan Lokal

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/Mojo-Brothers/primaya-igd-doctor-schedule-display.git
   cd primaya-igd-doctor-schedule-display
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   - Duplikasi file `.env.example` dan ubah namanya menjadi `.env`.
   - Isi konfigurasi Firebase sesuai dengan *Project Settings* di console Firebase Anda:
     ```env
     VITE_FIREBASE_API_KEY="your-api-key"
     VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
     VITE_FIREBASE_PROJECT_ID="your-project-id"
     VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
     VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
     VITE_FIREBASE_APP_ID="your-app-id"
     ```

4. **Jalankan Aplikasi Mode Development:**
   ```bash
   npm run dev
   ```
   - Halaman Display TV: `http://localhost:5173/`
   - Halaman Admin Panel: `http://localhost:5173/#/login` (atau klik area pojok layar display).

## 📦 Panduan Deployment (Production)

Proyek ini menggunakan Vite dan disiapkan untuk menjadi SPA (Single Page Application) statis yang sangat mudah di-deploy ke Vercel, Netlify, Firebase Hosting, atau GitHub Pages.

```bash
# Build untuk production
npm run build

# Menjalankan preview dari hasil build lokal
npm run preview
```
Jika ingin melakukan deploy ke GitHub Pages, pastikan URL `base` di `vite.config.ts` sudah disesuaikan dengan nama repositori Anda.

## 💡 Catatan Tambahan (Troubleshooting)
- **Import Excel Gagal**: Jika Tabel Jadwal Bulanan / Master Dokter kosong atau error setelah di-upload, pastikan nama header (kolom) di file Excel Anda **sama persis** (case-sensitive) dengan format *Template* yang disediakan sistem.
- **Tampilan Terpotong di TV**: Pastikan pengaturan resolusi komputer TV diset ke 1080p (1920x1080), *scaling* OS/browser diatur ke 100%, dan selalu jalankan browser di mode layar penuh (*Full Screen* / F11).
