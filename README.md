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

## 📂 Struktur Proyek & Deskripsi File

Berikut adalah peta struktur *source code* (kode sumber) dari aplikasi ini yang terdapat di dalam direktori `src/`:

### Core & Konfigurasi
- `App.tsx` : Routing utama aplikasi menggunakan `react-router-dom`. Mengatur jalur untuk mode Display TV dan Halaman Admin.
- `main.tsx` : Titik masuk (*entry point*) utama aplikasi React.
- `index.css` : File CSS utama, memuat konfigurasi Tailwind CSS.
- `vite-env.d.ts` : Deklarasi tipe (*Type definitions*) untuk *environment variables* Vite.

### Halaman (Pages)
- `pages/OnCallDisplay.tsx` : Halaman antarmuka utama yang tampil di layar TV IGD. Menampilkan daftar dokter, animasi *grid*, *running text*, dan jam.
- `pages/AdminOnCall.tsx` : Halaman Panel Admin utama untuk mengelola **Jadwal Bulanan** (upload Excel & riwayat), **Jadwal Hari Ini** (sistem *override*), dan **Master Dokter**.
- `pages/Settings.tsx` : Halaman pengaturan global aplikasi (nama RS, logo, tema warna, jam pergantian jadwal harian).
- `pages/Login.tsx` : Halaman otentikasi (login) khusus Admin menggunakan Firebase Auth.
- `pages/Dashboard.tsx` : Halaman *landing* utama bagi Admin setelah berhasil *login*.
- `pages/Doctors.tsx` : Halaman untuk manajemen *Slot* dokter statis (Dokter Jaga 1, Dokter Jaga 2, PIC, Koordinator) (opsional / mode manual).
- `pages/Display.tsx` & `pages/DisplayClassic.tsx` : Variasi lama dari tampilan layar (versi *legacy*).

### Komponen Reusable (Components)
- `components/DigitalClock.tsx` : Komponen jam digital *real-time* dengan penunjuk tanggal lengkap berbahasa Indonesia.
- `components/Clock.tsx` : Versi lain dari komponen jam digital.
- `components/DoctorCard.tsx` : Komponen *Card* (kartu) UI modern untuk menampilkan nama, departemen, dan status dokter pada mode Display.
- `components/DoctorCardClassic.tsx` : Komponen *Card* dengan desain klasik/sederhana.
- `components/ProtectedRoute.tsx` : Komponen pembungkus (*wrapper*) untuk memblokir akses *routing* pada halaman Admin jika pengguna belum *login*.

### State Management & Contexts
- `contexts/AuthContext.tsx` : Mengelola status *login/logout* Admin menggunakan React Context dan sinkronisasi dengan Firebase Auth.
- `contexts/SettingsContext.tsx` : Mengelola pengambilan data pengaturan global dari Firebase Firestore (seperti warna tema dan logo) agar bisa diakses oleh seluruh komponen.

### Services & Utilitas
- `firebase/config.ts` : Konfigurasi inisialisasi koneksi aplikasi ke layanan Firebase (Firestore, Auth, Storage).
- `services/db.ts` : Kumpulan fungsi (*service layer*) untuk berkomunikasi dengan Firestore Database (operasi CRUD dokter, jadwal, pengaturan, history jadwal bulanan).
- `services/storage.ts` : Kumpulan fungsi untuk mengelola (*upload/delete*) aset statis (seperti logo) ke Firebase Storage.
- `types/index.ts` : Berisi antarmuka (*Interface*) TypeScript untuk mendefinisikan tipe dan struktur objek data di seluruh aplikasi (misal: `Specialist`, `OnCallSchedule`, `MonthlyScheduleItem`).
- `utils/dateUtils.ts` : Kumpulan fungsi penolong (helper) untuk pengolahan tanggal dan waktu, terutama logika pergantian hari (*shift*) khusus rumah sakit yang tidak selalu tepat di jam 00:00 (misalnya pergantian jam 08:00 pagi).

### Layouts
- `layouts/AdminLayout.tsx` : Kerangka antarmuka dasar (*sidebar navigation*, *header*, *logout button*) yang membungkus semua rute halaman di area Admin.

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
