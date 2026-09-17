# Changelog

Semua perubahan penting pada proyek **IGD Manajemen Sistem - Primaya Hospital** akan didokumentasikan di berkas ini.

Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/id/1.0.0/), dan proyek ini mematuhi [Semantic Versioning](https://semver.org/lang/id/).

---

## [1.2.0] - 2026-09-17

### 🚀 Ditambahkan (Added)
- **Fitur Live GPS Tracking Ambulans (Khusus Backend Web Admin)**:
  - Komponen modal peta interaktif Leaflet ([AmbulanceLiveTrackingModal.tsx](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/src/components/ambulance/AmbulanceLiveTrackingModal.tsx)) pada dashboard admin `/admin/ambulance`.
  - Marker ambulans bergerak dinamis 🚑 dengan animasi *pulsing radar*, rotasi arah hadap (*heading*), kecepatan langsung (km/jam), status operasional (🟢 Bergerak / 🟡 Standby / ⚪ Offline), dan nama supir.
  - Panel rincian armada di samping peta dengan tombol **Fokus** untuk memperbesar kamera langsung ke posisi kendaraan.
  - Tombol **Demo Simulasi GPS** untuk menguji coba animasi pergerakan armada secara visual di peta kapan saja.
  - Listener real-time Firestore `subscribeAmbulanceLiveLocations` ke koleksi baru `ambulance_live_locations`.
  - Tombol aksi **`📡 Live Tracking GPS`** berindikator pulsing radar hijau pada toolbar admin [AmbulanceExpedition.tsx](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/src/pages/AmbulanceExpedition.tsx).
- **Layanan Silent Background GPS Telemetry (Mobile Flutter)**:
  - Layanan latar belakang [LocationTrackingService.dart](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/services/location_tracking_service.dart) yang berjalan otomatis dan hening tanpa menampilkan UI pada layar pengemudi (*zero distraction*).
  - Mengambil koordinat GPS presisi tinggi (`latitude`, `longitude`, `speed`, `heading`, `accuracy`) setiap 12 detik saat aplikasi aktif dan memancarkannya ke Firestore.
  - Otomatis memperbarui status menjadi `Offline` saat supir mengunci atau keluar dari aplikasi.
- **Penyelarasan 100% Formulir Ekspedisi Mobile dengan Versi Webview**:
  - Implementasi 4 seksi terstruktur pada [ExpeditionFormScreen.dart](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/screens/expedition_form_screen.dart):
    1. **Informasi Kegiatan & Armada**: Tanggal kegiatan (Date Picker Indonesia), 9 jenis kegiatan resmi IGD, dropdown armada (`EVALIA`, `BSI`, `PHC`) + dialog **Tambah Armada Baru**, dan dropdown pengemudi + dialog **Tambah Driver Baru**.
    2. **Informasi Pasien & Status**: Validasi kondisional nama pasien (wajib untuk Jemput, Merujuk, Antar Pulang), Nomor Rekam Medis (opsional), Status Awal Pasien resmi alur IGD + fitur ketik manual lainnya, serta Status Akhir Pasien resmi alur IGD + fitur ketik manual lainnya.
    3. **Informasi Perjalanan & Waktu**: Input lokasi tujuan terintegrasi tombol **Pilih dari Map** (Leaflet GPS), input Waktu Mulai & Waktu Selesai (Time Picker WIB), kalkulasi **Durasi Perjalanan Otomatis & Read-Only** (mendukung perjalanan melintasi tengah malam / *overnight*), dan input jarak tempuh KM.
    4. **Keterangan Tambahan**: Textarea catatan perjalanan dengan validasi wajib jika memilih opsi `'Lainnya'`.
  - **Tahap Konfirmasi & Preview Data**: Alur konfirmasi visual 2 tahap sebelum data disimpan final dengan nomor ekspedisi resmi berformat `AMB-YYYYMMDD-XXX`.
- **Integrasi Penuh Backend**:
  - Sinkronisasi dua arah real-time antara mobile dan web melalui Firebase Cloud Firestore (`ambulance_expeditions`, `ambulance_drivers`, `ambulance_fleets`, `ambulance_live_locations`, dan `settings/ambulance_config`).

### 🗑️ Dihapus (Removed)
- **Field Non-Webview pada Formulir Mobile**:
  - Menghapus input Odometer (Odo Awal & Odo Akhir KM) dari form mobile karena tidak ada di versi webview.
  - Menghapus input Biaya Operasional (BBM & Tol/Parkir) dari form mobile agar struktur data 100% selaras dengan webview.
  - Menghapus opsi status pasien lama ('Stabil', 'Kritis', dll) dan menggantikannya dengan status alur rujukan resmi IGD.

---

## [1.1.0] - 2026-09-16

### 🚀 Ditambahkan (Added)
- **Aplikasi Mobile Driver Native Flutter (`mobile/`)**:
  - Penggantian runtime webview menjadi aplikasi native Flutter 3.24+ yang cepat dan responsif.
  - Halaman autentikasi PIN 6-digit dengan verifikasi real-time ke Firestore `settings/ambulance_config`.
  - Dashboard workstation driver IGD dengan metrik harian (total trip hari ini, akumulasi jarak KM) dan riwayat log ekspedisi.
  - Integrasi peta interaktif Leaflet native [MapPickerScreen.dart](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/screens/map_picker_screen.dart) untuk penentuan titik tujuan rujukan GPS tanpa Google Maps API berbayar.
  - Pipa CI/CD otomatis di GitHub Actions (`.github/workflows/build-flutter-apk.yml`) untuk kompilasi otomatis berkas APK rilis (`primaya-ambulans.apk`) yang dipublikasikan langsung ke branch `apk-release`.

---

## [1.0.0] - 2026-09-12

### 🚀 Rilis Perdana (Initial Release)
- **Display Publik Dokter Jaga (TV Display On-Call)**:
  - Tampilan monitor TV 1080p ruang tunggu IGD dengan pembaruan otomatis real-time.
  - Jam digital WIB, tanggal bahasa Indonesia, running text pengumuman, dan kartu ketersediaan dokter spesialis on-call.
- **LinenFlow IGD & Laundry**:
  - Manajemen siklus linen medis steril, kotor, dan alur pencucian laundry IGD.
  - Monitoring stok lemari real-time dengan status indikator AMAN, MENIPIS, dan KRITIS.
- **Ekspedisi Ambulance IGD (Web Version)**:
  - Halaman front workstation pengemudi `/ambulance` (diproteksi PIN).
  - Dashboard admin ekspedisi `/admin/ambulance` dengan filter multi-kriteria, filter akumulasi jarak perbulan, dan ekspor laporan resmi (Excel & PDF A4 Landscape).
- **Panel Admin & Manajemen Jadwal Dokter**:
  - Pengelolaan profil dokter dan upload jadwal bulanan via template Excel (.xlsx).
  - Pengaturan tema, logo, dan running text rumah sakit.
