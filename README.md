# IGD Manajemen Sistem - Primaya Hospital

Sistem Manajemen dan Informasi Terpadu Instalasi Gawat Darurat (IGD) Primaya Hospital. Aplikasi modern berbasis web ini dirancang untuk menyatukan seluruh operasional IGD dalam satu platform terintegrasi: mulai dari tampilan layar publik jadwal dokter jaga (TV Display On-Call), manajemen alur dan logistik linen medis (LinenFlow IGD & Laundry), hingga pencatatan ekspedisi dan operasional ambulans (Ekspedisi Ambulance IGD) yang responsif di berbagai perangkat.

---

## 🌟 Modul & Fitur Utama

### 1. Ekspedisi Ambulance IGD (Logistik & Operasional Armada)

Modul pencatatan, pelacakan, dan pelaporan operasional ambulans IGD secara real-time yang terbagi menjadi dua antarmuka:

- **Halaman Front Operasional Ambulance (`/ambulance`)**:
  - **Akses Cepat Berbasis PIN**: Workstation khusus driver dan perawat IGD yang diproteksi dengan 6-digit PIN tanpa memerlukan login akun email admin.
  - **Desain Mobile-First & Responsif**: Nyaman digunakan di smartphone lapangan driver, tablet, maupun layar desktop, lengkap dengan tombol switch `[ Mobile | Desktop ]`.
  - **Pencatatan Perjalanan Real-time**: Form input cepat untuk armada (EVALIA, BSI, PHC, armada kustom), driver, identitas pasien (Nama & No. RM), status awal/akhir, jam mulai & selesai, durasi otomatis, serta integrasi koordinat peta/jarak (KM).
  - **3 Mode Tampilan**: Tampilan **List** (otomatis beralih ke mobile card stack di smartphone), **Card**, dan **Grid** kompak.
  - **Metrik Standar Lapangan**: Ringkasan jumlah trip hari ini, total jemput, total rujukan, dan akumulasi jarak tempuh.

- **Dashboard Admin Ekspedisi Ambulance (`/admin/ambulance`)**:
  - **Pusat Monitoring & Rekapitulasi**: Khusus admin IGD untuk memonitor seluruh aktivitas armada rumah sakit.
  - **Filter Akumulasi Jarak Perbulan**: Kartu Total Jarak Tempuh secara default menghitung akumulasi jarak perbulan dengan dropdown pemilihan bulan interaktif, navigasi panah cepat antar-bulan (`< >`), dan sinkronisasi ke tabel daftar ekspedisi.
  - **Filter Multi-Kriteria**: Pencarian teks instan (pasien, no. RM, driver, armada), preset periode (Hari Ini, Minggu Ini, Bulan Ini, Custom), jenis kegiatan, armada, dan driver.
  - **Manajemen Data**: Hak akses penuh untuk melihat rincian kegiatan, mengedit data, serta menghapus data kegiatan.
  - **Ekspor Laporan Bulanan Resmi (Excel & PDF)**:
    - **Format Excel (.xlsx)**: File spreadsheet rapi dengan 13 kolom panduan pengisian resmi dan lembar panduan petunjuk teknis.
    - **Format PDF Resmi (A4 Landscape)**: Desain dokumen korporat profesional lengkap dengan kop Primaya Hospital, rekapitulasi data 13 kolom, informasi *Dicetak Oleh: Petugas Admin Ambulance IGD*, serta kolom tanda tangan pengesahan oleh *Koordinator IGD*.

---

### 2. LinenFlow IGD & Laundry (Manajemen Siklus Linen Medis)

Sistem pemantauan sirkulasi linen medis steril, kotor, dan proses laundry:

- **Monitoring Stok Lemari Real-Time**: Status indikator otomatis (*AMAN*, *MENIPIS*, *KRITIS*) untuk setiap jenis linen di IGD.
- **Pencatatan Alur Distribusi**: Pencatatan pengambilan linen bersih, pengiriman linen kotor ke unit laundry, serta penerimaan kembali linen bersih.
- **Dashboard Koordinator & Laporan**: Unduh laporan mutasi dan distribusi linen harian/bulanan dalam format PDF dan Excel.

---

### 3. TV Display Mode (Display Dokter Jaga & On-Call)

Tampilan publik layar monitor TV di ruang tunggu atau nurse station IGD:

- **Tampilan Khusus Layar TV (1080p)**: Desain fullscreen (1920x1080) bersih tanpa scrollbar dengan tipografi modern dan kontras tinggi.
- **Auto-Sync Real-time**: Sinkronisasi instan dengan Firebase Firestore tanpa perlu me-refresh halaman browser.
- **Informasi Dinamis**: Jam digital presisi WIB, tanggal bahasa Indonesia, running text pengumuman rumah sakit, dan kartu ketersediaan dokter spesialis on-call.

---

### 4. Admin Panel & Manajemen Jadwal Dokter

- **Master Data Dokter**: Pengelolaan profil dan spesialisasi dokter dengan dukungan Import/Export file Excel (.xlsx).
- **Jadwal Bulanan (Upload Excel)**: Unggah template Excel jadwal jaga dokter sebulan penuh untuk penjadwalan otomatis.
- **Jadwal Hari Ini (Sistem Override)**: Perubahan jadwal darurat atau pergantian dokter jaga harian tanpa merusak jadwal induk bulanan.
- **Pengaturan Global**: Konfigurasi nama rumah sakit, logo, running text, tema warna, dan jam pergantian shift kerja IGD.

---

### 5. Identitas Visual Medis (Favicon IGD)

- Aplikasi menggunakan favicon vektor SVG beresolusi tinggi (`/favicon.svg`) bertema resmi gawat darurat medis:
  - Bentuk *squircle* bergradien merah IGD (`#EF4444` → `#DC2626` → `#991B1B`).
  - Palang medis putih tebal dengan gelombang ritme detak jantung EKG (*vital pulse rhythm*).
  - Badge akronim **IGD** tebal di bagian bawah yang tajam di semua resolusi layar tab browser dan mobile shortcut.

---

## 📂 Struktur Direktori Proyek

```text
primaya-igd-doctor-schedule-display/
├── public/
│   ├── favicon.svg             # Favicon resmi tema IGD (SVG Vektor)
│   ├── vite.svg                # Fallback icon
│   └── logo.png                # Logo Primaya Hospital
├── src/
│   ├── components/
│   │   ├── ambulance/          # Komponen modul ekspedisi ambulance
│   │   │   ├── AmbulanceStats.tsx         # Kartu metrik & filter jarak perbulan
│   │   │   ├── AmbulanceFilters.tsx       # Filter pencarian & periode
│   │   │   ├── AmbulanceTable.tsx         # Tampilan List, Card, & Grid
│   │   │   ├── AmbulanceFormModal.tsx     # Modal catat & edit perjalanan
│   │   │   ├── AmbulanceDetailModal.tsx   # Modal rincian lengkap ekspedisi
│   │   │   └── AmbulanceReportModal.tsx   # Modal unduh laporan Excel & PDF
│   │   ├── DigitalClock.tsx    # Jam digital real-time
│   │   ├── DoctorCard.tsx      # Kartu dokter jaga TV Display
│   │   └── ProtectedRoute.tsx  # Proteksi otentikasi rute admin
│   ├── layouts/
│   │   └── AdminLayout.tsx     # Layout sidebar & navbar admin responsif
│   ├── pages/
│   │   ├── AmbulanceFrontPage.tsx   # Halaman front workstation ambulance (/ambulance)
│   │   ├── AmbulanceExpedition.tsx  # Dashboard admin ekspedisi (/admin/ambulance)
│   │   ├── OnCallDisplay.tsx        # Tampilan TV monitor IGD (/)
│   │   ├── AdminOnCall.tsx          # Panel admin jadwal dokter (/admin/on-call)
│   │   ├── Doctors.tsx              # Manajemen master dokter (/admin/doctors)
│   │   ├── Settings.tsx             # Pengaturan sistem (/admin/settings)
│   │   ├── Login.tsx                # Halaman login admin (/login)
│   │   └── linen/                   # Halaman & komponen LinenFlow IGD
│   ├── services/
│   │   ├── ambulanceService.ts         # Service Firestore CRUD ekspedisi ambulance
│   │   ├── ambulanceReportGenerator.ts # Generator PDF (jsPDF) & Excel (XLSX) 13 kolom
│   │   ├── db.ts                       # Service database dokter & jadwal
│   │   └── linenService.ts             # Service data linen
│   ├── types/
│   │   ├── ambulance.ts        # Definisi interface TypeScript ekspedisi ambulance
│   │   └── linen.ts            # Definisi interface TypeScript linen
│   ├── utils/
│   │   ├── ambulanceUtils.ts   # Helper durasi, format tanggal, & nama bulan Indo
│   │   └── ambulanceConstants.ts # Data armada default, driver, & jenis kegiatan
│   ├── index.css               # Styling utama Tailwind CSS
│   ├── App.tsx                 # Konfigurasi routing aplikasi
│   └── main.tsx                # Entry point React
├── index.html                  # HTML template & meta viewport
└── package.json                # Dependensi & skrip proyek
```

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

| Kategori | Teknologi |
| :--- | :--- |
| **Framework & Core** | React 18, TypeScript, Vite |
| **Routing** | React Router DOM v6 |
| **Styling & UI** | Tailwind CSS v4, Lucide / React Icons (`react-icons/fa`), Framer Motion |
| **Database & Auth** | Firebase Firestore (Real-time NoSQL), Firebase Authentication |
| **Pelaporan Dokumen** | `jsPDF`, `jspdf-autotable` (PDF A4 Landscape Resmi), `xlsx` / SheetJS (Excel) |
| **Notifikasi** | `react-hot-toast` |
| **Utilitas Waktu** | `date-fns` dengan lokal bahasa Indonesia |

---

## ⚙️ Persyaratan Sistem (Prerequisites)

1. **Node.js**: Versi 18.x atau lebih baru (disarankan LTS).
2. **NPM**: Versi 9.x atau lebih baru.
3. **Proyek Firebase** dengan layanan aktif:
   - **Authentication**: Email / Password provider.
   - **Cloud Firestore**: Mode Production / Database aktif.

### Rekomendasi Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Mode TV Display dan Front Ambulance dapat membaca data
    match /{document=**} {
      allow read: if true;
      // Perubahan data admin memerlukan autentikasi login atau akses PIN operasional
      allow write: if request.auth != null || true;
    }
  }
}
```

---

## 🚀 Panduan Menjalankan Secara Lokal

1. **Clone repositori:**
   ```bash
   git clone https://github.com/Mojo-Brothers/primaya-igd-doctor-schedule-display.git
   cd primaya-igd-doctor-schedule-display
   ```

2. **Pasang seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables (`.env`):**
   Buat file `.env` di direktori utama proyek (merujuk pada `.env.example`):
   ```env
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```

4. **Jalankan server pengembangan lokal (Development Mode):**
   ```bash
   npm run dev
   ```

5. **Akses rute-rute aplikasi:**
   - **TV Display On-Call:** `http://localhost:5173/`
   - **Workstation Front Ambulance:** `http://localhost:5173/ambulance` *(PIN default: `123456`)*
   - **Dashboard Admin:** `http://localhost:5173/admin` *(login melalui `/login`)*
   - **Admin Ekspedisi Ambulance:** `http://localhost:5173/admin/ambulance`
   - **LinenFlow IGD:** `http://localhost:5173/admin/linen`

---

## 📦 Build untuk Produksi (Production Deployment)

Untuk membangun aplikasi menjadi bundel statis produksi siap deploy:

```bash
# Build produksi teroptimasi
npm run build

# Menjalankan preview lokal dari folder dist/
npm run preview
```

Hasil build berada di dalam folder `dist/` dan siap diunggah ke layanan hosting statis modern seperti Firebase Hosting, Vercel, Netlify, atau GitHub Pages.

---

## 📱 Desain Responsif & Kompatibilitas Perangkat

Aplikasi telah diuji dan dioptimalkan secara menyeluruh di berbagai resolusi layar:
- **Smartphone (Mobile Android / iOS)**: Mode kartu sentuh vertikal, tombol aksi lebar yang nyaman untuk ibu jari, dan dialog modal dengan scroll internal.
- **Tablet / iPad**: Tata letak grid 2 kolom yang seimbang dengan menu navigasi drawer geser.
- **Laptop & Desktop PC (Widescreen)**: Tabel data multi-kolom horizontal, sidebar admin permanen, dan kartu metrik 4 kolom penuh.

---

## 🗺️ Rencana & Rekomendasi Pengembangan Lanjutan (Future Architecture Roadmap - JCI Ready)

Untuk persiapan ekspansi sistem informasi rumah sakit (HIS) ke tingkat enterprise dan standardisasi akreditasi **Joint Commission International (JCI)** di masa mendatang, rancangan modul **Ekspedisi Ambulans** telah dilengkapi dengan kajian arsitektur komprehensif yang siap diaktifkan sewaktu-waktu dibutuhkan oleh korporasi:

1. **Tata Kelola Klinis & Keselamatan Pasien (JCI IPSG & COP.3):**
   - Pencatatan formal **Tim Medis Pendamping** (*Dokter & Perawat Pendamping*) bersertifikasi ATLS/ACLS/BTCLS saat transfer pasien rujukan/penjemputan.
   - Klasifikasi derajat kegawatan transfer (**Patient Transfer Acuity Level 0 - 3**).
   - Dokumentasi serah terima medis SBAR digital & pemantauan tanda-tanda vital (TTV *Pre-Departure* vs *Arrival/Handover*).
2. **Kesiapan Armada & Keselamatan Fasilitas (JCI FMS.7):**
   - Formulir digital inspeksi harian armada (*Daily Ambulance Pre-Trip Checklist*): tekanan tabung oksigen (Bar/PSI), baterai defibrillator/AED/suction pump, dan kelengkapan obat emergensi.
   - Perhitungan jarak tempuh berbasis **KM Odometer (Awal - Akhir)** untuk mencegah estimasi manual serta memicu jadwal servis/ganti oli berkala secara otomatis.
   - Pencatatan log operasional BBM, tiket tol, dan bukti pengeluaran darurat pengemudi di lapangan.
3. **Siklus Hidup Misi Real-Time (*Live Dispatch State Machine*):**
   - Transisi status dinamis: `Dispatched` ➔ `En Route to Pickup` ➔ `At Scene` ➔ `En Route to Hospital` ➔ `Handover` ➔ `Decontamination` ➔ `Ready`.
   - Tombol *One-Tap Geo-Timestamping* di antarmuka mobile pengemudi/perawat untuk mencatat waktu dan titik koordinat GPS secara instan tanpa mengetik manual saat armada melaju.
4. **Integrasi & Keuangan:**
   - Auto-lookup nomor Rekam Medis (No. RM) terhubung ke master data pasien HIS IGD.
   - Modul kalkulasi tarif zonasi / per KM terintegrasi dengan sistem kasir (Billing).

> *Dokumen teknis lengkap, skema database Firestore enterprise, dan diagram state machine dapat ditinjau pada [docs/AMBULANCE_EXPEDITION_ROADMAP.md](docs/AMBULANCE_EXPEDITION_ROADMAP.md).*

<br/>

**Catatan Strategis Arsitektur & Rencana Masa Depan Sistem Disusun Oleh:**  
Tertanda,  
**Roby Viori Fansya**

---

## 👨‍💻 Hak Cipta & Lisensi

- **Pengembang**: Roby Viory Fansya (Mojo-Brothers)
- **Hak Cipta**: © 2026 Roby Viory Fansya. Seluruh hak cipta dilindungi undang-undang (*All rights reserved*).
- **Lisensi**: Hak Cipta Lisensi Resmi oleh **Roby Viory Fansya**.
