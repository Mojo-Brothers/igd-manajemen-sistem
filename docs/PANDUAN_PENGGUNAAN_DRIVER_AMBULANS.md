# 🚑 Buku Panduan Penggunaan Sistem Ekspedisi Ambulans IGD
**Panduan Acuan Operasional Standar bagi Driver, Perawat Pendamping & Petugas Armada**  
*Primaya Hospital — Instalasi Gawat Darurat (IGD)*

---

## Daftar Isi
1. [Pendahuluan & Tujuan](#1-pendahuluan--tujuan)
2. [Akses Sistem & Pilihan Platform](#2-akses-sistem--pilihan-platform)
   - [A. Menggunakan Aplikasi Android Native (.APK)](#a-menggunakan-aplikasi-android-native-apk-sangat-direkomendasikan)
   - [B. Menggunakan Web Browser (HP & Komputer)](#b-menggunakan-web-browser-hp--komputer)
   - [C. Mode Tampilan: Mobile-Friendly vs Desktop PC](#c-mode-tampilan-mobile-friendly-vs-desktop-pc)
3. [Keamanan & Akses PIN (PIN Gate)](#3-keamanan--akses-pin-pin-gate)
   - [A. Membuka Kunci Sistem dengan PIN](#a-membuka-kunci-sistem-dengan-pin)
   - [B. Mengubah PIN Operasional](#b-mengubah-pin-operasional)
   - [C. Prosedur Penguncian Sesi (Kunci Layar)](#c-prosedur-penguncian-sesi-kunci-layar)
4. [Tampilan Utama & Navigasi Logbook](#4-tampilan-utama--navigasi-logbook)
   - [A. Indikator & Metrik Operasional](#a-indikator--metrik-operasional)
   - [B. Pilihan Gaya Tampilan (List, Card, Grid)](#b-pilihan-gaya-tampilan-list-card-grid)
   - [C. Pencarian Cepat & Filter Data](#c-pencarian-cepat--filter-data)
5. [Panduan Langkah-demi-Langkah: Mencatat Perjalanan Baru](#5-panduan-langkah-demi-langkah-mencatat-perjalanan-baru)
   - [Langkah 1: Informasi Kegiatan & Armada](#langkah-1-informasi-kegiatan--armada)
   - [Langkah 2: Informasi & Status Pasien](#langkah-2-informasi--status-pasien)
   - [Langkah 3: Waktu, Jarak & Pemilihan Lokasi di Peta (GPS)](#langkah-3-waktu-jarak--pemilihan-lokasi-di-peta-gps)
   - [Langkah 4: Keterangan & Catatan Tambahan](#langkah-4-keterangan--catatan-tambahan)
   - [Langkah 5: Pemeriksaan Akhir & Konfirmasi Simpan](#langkah-5-pemeriksaan-akhir--konfirmasi-simpan)
6. [Melihat Rincian, Mengubah (Edit), dan Menghapus Log](#6-melihat-rincian-mengubah-edit-dan-menghapus-log)
7. [Unduh Rekapitulasi Laporan Bulanan (Excel & PDF)](#7-unduh-rekapitulasi-laporan-bulanan-excel--pdf)
8. [Standar Operasional Prosedur (SOP) Pengemudi Ambulans](#8-standar-operasional-prosedur-sop-pengemudi-ambulans)
9. [Tanya Jawab & Pemecahan Masalah (FAQ & Troubleshooting)](#9-tanya-jawab--pemecahan-masalah-faq--troubleshooting)

---

## 1. Pendahuluan & Tujuan

Sistem **Ekspedisi Ambulans IGD** adalah aplikasi operasional terintegrasi yang dirancang untuk mendokumentasikan setiap pergerakan armada ambulans Primaya Hospital secara *real-time*, akurat, dan transparan.

### Tujuan Utama:
1. **Pencatatan Presisi Tanpa Buku Manual Fisik:** Menghilangkan risiko buku logbook hilang, rusak, atau tulisan tangan tidak terbaca.
2. **Standarisasi Rekapitulasi Rumah Sakit:** Data otomatis tersinkronisasi dan siap diekspor menjadi laporan bulanan 13 kolom resmi rumah sakit.
3. **Transparansi Jarak & Waktu:** Menghitung durasi perjalanan secara otomatis dan mengestimasi jarak tempuh menggunakan pemetaan GPS.
4. **Kesiapan Akreditasi JCI:** Mendukung kepatuhan keselamatan transportasi pasien gawat darurat dan tata kelola armada medis.

---

## 2. Akses Sistem & Pilihan Platform

Driver dan kru ambulans dapat mengakses sistem melalui 2 (dua) metode utama sesuai kenyamanan:

### A. Menggunakan Aplikasi Android Native (.APK) *(Sangat Direkomendasikan)*
Aplikasi Android khusus driver telah disediakan agar driver dapat mengakses logbook langsung dari *homescreen* smartphone tanpa perlu membuka peramban web (*browser*).

* **Kelebihan Aplikasi Android:**
  - Tampilan penuh (*fullscreen* tanpa bilah alamat browser).
  - Khusus langsung masuk ke menu kerja driver (`/ambulance`) tanpa opsi login admin yang membingungkan.
  - Ringan, hemat kuota internet, dan responsif untuk pengoperasian satu tangan.

#### Cara Mengunduh & Memasang di HP Android:
1. Pada komputer IGD atau HP yang sedang membuka website, klik tombol hijau **"Aplikasi Android (.APK)"** pada banner atas.
2. Muncul jendela modal berisi **Kode QR (QR Code)** dan tombol unduh.
3. **Scan QR Code** menggunakan kamera HP atau aplikasi pemindai QR di Android Anda.
4. Unduhan file `primaya-ambulans.apk` akan berjalan otomatis.
5. Setelah unduhan selesai:
   - Buka file unduhan (`primaya-ambulans.apk`).
   - Jika muncul peringatan keamanan sistem Android, pilih **"Izinkan Penginstalan dari Sumber Ini"** (*Allow from this source*).
   - Tekan tombol **"Install"** / **"Pasang"**.
6. Ikon aplikasi **Primaya Ambulans** akan muncul di layar utama smartphone Anda.

---

### B. Menggunakan Web Browser (HP & Komputer)
Jika menggunakan laptop, komputer nurse station IGD, atau HP tanpa memasang APK:
1. Buka browser (Google Chrome, Microsoft Edge, atau Safari).
2. Akses alamat web portal sistem IGD rumah sakit.
3. Pilih menu **Ekspedisi Ambulans** atau langsung ketikkan akhiran alamat: `/ambulance`.

---

### C. Mode Tampilan: Mobile-Friendly vs Desktop PC
Pada bagian atas bilah navigasi (*header*), terdapat tombol pengalih mode tampilan:
* **Mode Mobile (📱):** Mengoptimalkan ukuran tombol, formulir, dan susunan elemen agar pas dengan lebar layar HP Android/iPhone. Mode ini aktif secara otomatis jika membuka dari ponsel.
* **Mode Desktop (💻):** Menampilkan logbook dalam format layar lebar (*widescreen*) yang cocok untuk monitor komputer Nurse Station IGD.

> [!TIP]
> Driver dapat beralih antara tampilan HP atau Komputer kapan saja hanya dengan mengetuk tombol **Mobile** atau **Desktop** di header.

---

## 3. Keamanan & Akses PIN (PIN Gate)

Untuk mencegah perubahan data yang tidak disengaja oleh pihak umum, sistem dilindungi oleh **Gerbang Keamanan 6-Digit PIN**.

```
+-----------------------------------------------------------+
|               🔒 Ekspedisi Ambulance IGD                  |
|           Primaya Hospital • Logbook Operasional          |
+-----------------------------------------------------------+
|                                                           |
|             Masukkan 6 Digit PIN Operasional:             |
|                                                           |
|             [ • ] [ • ] [ • ] [ • ] [ • ] [ • ]           |
|                                                           |
|               (PIN Bawaan / Default: 123456)              |
|                                                           |
|             [      Buka Logbook Ambulance     ]           |
+-----------------------------------------------------------+
```

### A. Membuka Kunci Sistem dengan PIN
1. Masukkan **6 digit angka PIN**.
   - *PIN Default Sistem:* **`123456`**
2. Anda dapat mengetuk tombol **"Tampilkan Angka"** (ikon mata) jika ingin memeriksa angka yang diketik.
3. Jika PIN benar, sistem langsung membuka dashboard kerja operasional ambulans.
4. Jika salah, kotak PIN akan bergetar dan menampilkan pesan kesalahan.

---

### B. Mengubah PIN Operasional
Jika diperlukan peremajaan kode keamanan secara berkala:
1. Pada layar PIN, ketuk tautan **"Pengaturan PIN"** di bagian bawah.
2. Masukkan **PIN Saat Ini (Lama)** untuk verifikasi.
3. Masukkan **PIN Baru (6 Angka)** yang diinginkan.
4. Ulangi pada kolom **Konfirmasi PIN Baru**.
5. Tekan **"Simpan PIN Baru"**.
6. Informasikan PIN baru tersebut kepada seluruh rekan driver pada pergantian shift.

---

### C. Prosedur Penguncian Sesi (Kunci Layar)
Demi keamanan data rekam medis pasien dan armada:
* Setiap kali selesai mencatat perjalanan atau saat meninggalkan meja/komputer, ketuk tombol **"Kunci"** (ikon gembok kuning di pojok kanan atas).
* Sistem akan langsung mengunci kembali dan membutuhkan input PIN untuk membukanya.

---

## 4. Tampilan Utama & Navigasi Logbook

Setelah PIN berhasil diverifikasi, Anda akan melihat halaman operasional utama yang terdiri dari:

```
+-----------------------------------------------------------------------------------+
|  [Ambulance] Ekspedisi Ambulance  (Front)            [ 📱 Mobile | 💻 Desktop ] [🔒 Kunci] |
+-----------------------------------------------------------------------------------+
|  BANNER OPERASIONAL                                                               |
|  Waktu: Kamis, 17 September 2026 | Mode Mobile-Friendly                            |
|  [📱 Unduh APK Driver]  [📥 Unduh Laporan Bulanan]  [➕ Catat Perjalanan Baru]    |
+-----------------------------------------------------------------------------------+
|  METRIK OPERASIONAL REAL-TIME                                                     |
|  [Total Ekspedisi]      [Total Jarak KM]        [Pasien Dilayani]                 |
+-----------------------------------------------------------------------------------+
|  FILTER & PENCARIAN (Hari Ini / Minggu Ini / Bulan Ini / Cari Nama Pasien/Driver) |
+-----------------------------------------------------------------------------------+
|  DAFTAR PERJALANAN (Mode Tampilan: [List] [Card] [Grid])                          |
|  - EXP/202609/001 | Jemput Pasien | EVALIA | Bpk. Joko (No.RM: 01-23-45) | Selesai|
|  - EXP/202609/002 | Rujukan Antar RS | BSI | Ibu Siti (RS Bella)        | Selesai |
+-----------------------------------------------------------------------------------+
```

### A. Indikator & Metrik Operasional
Di bagian atas terdapat ringkasan kartu statistik:
* **Total Ekspedisi:** Jumlah kegiatan perjalanan yang tercatat.
* **Total Jarak Tempuh (KM):** Akumulasi kilometer seluruh armada.
* **Pasien Dilayani:** Jumlah pasien yang ditransportasikan.

### B. Pilihan Gaya Tampilan (List, Card, Grid)
Anda dapat menyesuaikan kenyamanan melihat data melalui 3 tombol di atas daftar:
1. **List (Tabel):** Format baris tabel rapat, cocok untuk melihat banyak data sekaligus di komputer.
2. **Card (Kartu):** Format kartu kotak dengan informasi besar dan jelas (sangat direkomendasikan untuk layar sentuh HP).
3. **Grid:** Format kartu ringkas 2 kolom.

### C. Pencarian Cepat & Filter Data
* **Preset Waktu:** 
  - *Hari Ini (Default):* Menampilkan perjalanan hari ini agar aplikasi tetap ringan dan cepat.
  - *Minggu Ini / Bulan Ini / Kustom:* Menampilkan arsip kegiatan sebelumnya.
* **Kolom Pencarian:** Ketik nama pasien, No. RM, nomor ekspedisi, nama supir, atau nama rumah sakit tujuan.
* **Filter Dropdown:** Saring berdasarkan jenis kegiatan tertentu, armada tertentu (EVALIA/BSI/PHC), atau driver tertentu.
* **Tombol Reset:** Mengembalikan filter ke kondisi awal hari ini.

---

## 5. Panduan Langkah-demi-Langkah: Mencatat Perjalanan Baru

Untuk mencatat kegiatan ambulans, klik tombol **"➕ Catat Perjalanan Baru"** di banner atas atau tekan **Tombol Bulat Melayang Hijau (FAB)** di sudut kanan bawah layar HP Anda.

Formulir terdiri dari 4 bagian berurutan yang sangat mudah diisi:

---

### Langkah 1: Informasi Kegiatan & Armada

```
+--------------------------------------------------------------------+
| 1. INFORMASI KEGIATAN                                              |
+--------------------------------------------------------------------+
| Tanggal Kegiatan:        [ 2026-09-17 📅 ]                        |
| Jenis Kegiatan:          [ Jemput Pasien                    ▼ ]    |
| Ambulance yang Digunakan:[ EVALIA                           ▼ ]    |
|                          (+ Tambah Ambulance Baru jika unit baru)  |
| Driver / Pengemudi:      [ Acun                             ▼ ]    |
|                          (+ Tambah Driver Baru jika supir baru)    |
+--------------------------------------------------------------------+
```

1. **Tanggal Kegiatan:** Terisi otomatis dengan tanggal hari ini. Dapat diubah jika mencatat riwayat dinas malam sebelumnya.
2. **Jenis Kegiatan:** Pilih salah satu dari opsi berikut:
   * `Jemput Pasien`: Menjemput pasien dari rumah/tempat tinggal menuju IGD Primaya.
   * `Merujuk Pasien`: Menghantarkan pasien dari Primaya ke RS rujukan lain.
   * `Antar Pasien Pulang`: Mengantar pasien rawat inap/IGD yang telah diizinkan pulang ke rumah.
   * `Ambil Darah`: Mengambil kantong darah ke kantor PMI / Bank Darah rekanan.
   * `Kirim / Ambil Sampel`: Mengantar spesimen laboratorium.
   * `Kegiatan Marketing`: Standby event, pameran kesehatan, atau bakti sosial.
   * `Jual / Beli Obat`: Pengambilan logistik farmasi darurat.
   * `Home Visit`: Kunjungan dokter/perawat ke kediaman pasien.
   * `Lainnya`: Perjalanan dinas lain (wajib mengisi catatan di bagian akhir).
3. **Ambulance yang Digunakan:**
   * Pilih unit kendaraan yang digunakan (`EVALIA`, `BSI`, atau `PHC`).
   * *Jika ada mobil baru/pengganti:* Pilih opsi `+ Tambah Ambulance Baru...`, ketik nama armadanya (misal: `HIACE`), lalu klik tombol centang Simpan.
4. **Driver / Pengemudi:**
   * Pilih nama driver yang bertugas (`Acun`, `Aldy`, `Azis`, `Johari`, `Edy`, dll).
   * *Jika ada supir baru/pengganti:* Klik `+ Tambah Driver`, ketik nama lengkap, lalu klik centang Simpan.

---

### Langkah 2: Informasi & Status Pasien

> [!NOTE]
> Untuk kegiatan **Jemput Pasien**, **Merujuk Pasien**, dan **Antar Pasien Pulang**, pengisian identitas pasien adalah **wajib**. Untuk dinas operasional tanpa pasien (misal: ambil darah PMI atau antar sampel lab), bagian ini bersifat opsional.

```
+--------------------------------------------------------------------+
| 2. INFORMASI PASIEN                                                |
+--------------------------------------------------------------------+
| Nama Pasien:             [ Joko Susanto                          ] |
| Nomor Rekam Medis:       [ 01-98-76                              ] |
| Status Awal Pasien:      [ Rumah Pasien                     ▼ ]    |
| Status Akhir Pasien:     [ Rawat Inap                       ▼ ]    |
+--------------------------------------------------------------------+
```

1. **Nama Pasien:** Ketik nama lengkap pasien (atau nama penanggung jawab jika pasien darurat tanpa identitas, contoh: *Mr. X - TKP Tol Bekasi Barat*).
2. **Nomor Rekam Medis (No. RM):** Masukkan nomor RM pasien sesuai data pendaftaran IGD.
3. **Status Awal Pasien:** Posisi atau kondisi pasien sebelum ambulans diberangkatkan:
   - *Rumah Pasien*, *RS Lain*, *IGD*, *Rawat Inap*, *Laboratorium*, *PMI / Bank Darah*, atau *Lainnya*.
4. **Status Akhir Pasien:** Hasil akhir pengantaran:
   - *Rawat Inap* (masuk ruang perawatan Primaya).
   - *Dirujuk* (diserahterimakan ke IGD rumah sakit rujukan).
   - *Rawat Jalan* (setelah diobservasi diperbolehkan pulang).
   - *Meninggal* (pasien DOA atau berpulang saat evakuasi).
   - *Rumah Pasien* (tiba di kediaman dengan aman).

---

### Langkah 3: Waktu, Jarak & Pemilihan Lokasi di Peta (GPS)

```
+--------------------------------------------------------------------+
| 3. INFORMASI WAKTU & PERJALANAN                                    |
+--------------------------------------------------------------------+
| Waktu Mulai (Berangkat): [ 08:30 ] WIB                             |
| Waktu Selesai (Kembali): [ 09:45 ] WIB                             |
| Durasi Perjalanan:       ⏱️ Otomatis: 1 Jam 15 Menit               |
| Jarak Tempuh (KM):       [ 18 ] KM                                 |
| Lokasi / Alamat Tujuan:  [ RSUD dr. Chasbullah Abdulmadjid       ] |
|                          [ 🗺️ Pilih di Peta (GPS) ]                |
+--------------------------------------------------------------------+
```

1. **Waktu Mulai & Waktu Selesai:**
   - Masukkan jam keberangkatan armada dan jam tiba kembali di pangkalan IGD Primaya (format 24 jam `HH:mm`).
   - **Kalkulasi Durasi Otomatis:** Sistem secara otomatis menghitung selisih waktu dalam menit dan format jam (misal: `1 Jam 15 Menit`). Sistem juga mendukung perhitungan perjalanan yang menyeberang lewat tengah malam.
2. **Jarak Tempuh (KM):**
   - Masukkan jarak tempuh berdasarkan angka speedometer/odometer kendaraan ambulans.
3. **Lokasi / Alamat Tujuan:**
   - Anda dapat mengetik alamat secara manual, ATAU
   - Gunakan fitur **"🗺️ Pilih di Peta"** untuk mempermudah.

#### Menggunakan Fitur Peta Interaktif (GPS Map Picker):
Saat tombol **"Pilih di Peta"** ditekan, jendela peta Leaflet/OpenStreetMap akan terbuka:
* **Shortcut Rumah Sakit Terdekat:** Di bagian atas peta terdapat tombol cepat rumah sakit rujukan populer di Bekasi:
  - *RSUD dr. Chasbullah Abdulmadjid*
  - *RS Mitra Keluarga Bekasi Barat*
  - *RS Siloam Bekasi Timur*
  - *RS Hermina Bekasi*
  - *RS Ananda Bekasi*
  - *RS Bella Bekasi*
  Mengetuk tombol tersebut akan langsung memindahkan pin ke lokasi dan otomatis menghitung estimasi jarak KM dari Primaya Hospital.
* **Pencarian Tempat:** Ketik nama jalan, perumahan, atau gedung di kotak pencarian lalu klik "Cari".
* **Geser Pin Merah Manual:** Anda dapat mengetuk titik mana saja di peta atau menggeser pin merah langsung ke lokasi penjemputan.
* Klik **"Gunakan Lokasi Ini"** untuk menyalin alamat dan jarak ke formulir utama.

---

### Langkah 4: Keterangan & Catatan Tambahan
Gunakan kolom ini untuk mencatat informasi pendukung, seperti:
* Nama perawat/dokter yang mendampingi (misal: *Didampingi Ns. Rian*).
* Biaya operasional di jalan (misal: *Tol Becakayu Rp 16.000*).
* Kendala perjalanan (misal: *Macet padat di Tol Japek KM 14, tabung oksigen terpakai 1 unit*).

---

### Langkah 5: Pemeriksaan Akhir & Konfirmasi Simpan

Setelah semua data terisi, tekan tombol **"Lanjut ke Preview"**.

```
+-------------------------------------------------------------------+
|  🔍 KONFIRMASI & PREVIEW DATA EKSPEDISI                           |
+-------------------------------------------------------------------+
|  Periksa kembali rincian perjalanan sebelum dicatat permanen:     |
|                                                                   |
|  1. Kegiatan: Jemput Pasien | Armada: EVALIA | Supir: Acun        |
|  2. Pasien: Bpk. Joko Susanto (No RM: 01-98-76)                   |
|  3. Waktu: 08:30 - 09:45 WIB (Durasi: 1 Jam 15 Menit)             |
|  4. Jarak: 18 KM | Tujuan: Perumahan Galaxy, Bekasi Selatan       |
|  5. Catatan: Kondisi pasien stabil, terpasang infus RL            |
|                                                                   |
|  [ ⬅️ Kembali & Ubah ]                [  Ya, Konfirmasi & Simpan  ] |
+-------------------------------------------------------------------+
```

1. Periksa kembali setiap rincian pada layar preview.
2. Jika ada data yang salah ketik, tekan **"⬅️ Kembali & Ubah"**.
3. Jika data sudah sesuai, tekan tombol hijau **"Ya, Konfirmasi & Simpan"**.
4. Sistem akan menerbitkan **Nomor Ekspedisi Unik** otomatis (contoh: `EXP/202609/005`) dan notifikasi berhasil akan muncul di layar.

---

## 6. Melihat Rincian, Mengubah (Edit), dan Menghapus Log

### A. Melihat Detail Lengkap
* Ketuk pada baris atau kartu ekspedisi mana saja di daftar logbook.
* Jendela pop-up detail akan menampilkan seluruh riwayat: nomor ekspedisi, nama driver, armada, jam, durasi, status awal/akhir, rute tujuan, serta koordinat peta penjemputan.

### B. Mengubah / Memperbarui Data (Edit)
* Klik tombol **"Edit"** (ikon pensil biru).
* Seluruh data lama akan otomatis dimuat ke dalam formulir.
* Lakukan penyesuaian (misal: mengoreksi jam kembali atau menambahkan No. RM yang baru terbit).
* Lewati tahap preview dan simpan perubahan.

### C. Menghapus Logbook (Delete)
* Jika terjadi salah input ganda atau pembatalan perjalanan dinas, klik tombol **"Hapus"** (ikon tempat sampah merah).
* Kotak dialog konfirmasi akan meminta persetujuan.
* Klik **"Ya, Hapus"** untuk membatalkan entri tersebut.

---

## 7. Unduh Rekapitulasi Laporan Bulanan (Excel & PDF)

Sistem telah dilengkapi modul generator laporan bulanan otomatis yang memenuhi format standar pelaporan manajemen Primaya Hospital:

1. Di banner utama, klik tombol **"📥 Unduh Laporan Bulanan"**.
2. **Pilih Periode:** Tentukan bulan dan tahun yang akan direkap (misal: *September 2026*).
3. Sistem akan menampilkan pratinjau jumlah kegiatan dan total kilometer yang berhasil direkap pada bulan tersebut.
4. **Pilih Format Dokumen:**
   * **Excel (.xlsx):** Dokumen lembar kerja dengan **13 kolom resmi** berurutan:
     1. Nomor Urut
     2. Tanggal Kegiatan
     3. Jenis Kegiatan
     4. Nama Pasien / Identitas
     5. No. Rekam Medis
     6. Status Awal Pasien
     7. Status Akhir Pasien
     8. Ambulans yang Digunakan
     9. Waktu Mulai (Berangkat)
     10. Waktu Selesai (Tiba Kembali)
     11. Durasi Perjalanan
     12. Jarak Tempuh (KM)
     13. Driver & Keterangan Tambahan
   * **PDF (.pdf):** Dokumen resmi berformat *Landscape A4*, dilengkapi Kop Surat Resmi Rumah Sakit, tabel rapi bergaris, dan kolom tanda tangan pengesahan (Driver, Koordinator Layanan, dan Kepala Unit IGD).
5. Klik **"Unduh File"** dan berkas langsung tersimpan di komputer/HP Anda.

---

## 8. Standar Operasional Prosedur (SOP) Pengemudi Ambulans

Sebagai acuan operasional keselamatan transportasi medis:

### Fase 1: Sebelum Keberangkatan (*Pre-Trip Inspection*)
- [ ] Periksa kecukupan bahan bakar minyak (BBM) — minimal setengah tangki.
- [ ] Periksa tekanan angin ban, air radiator, dan oli mesin.
- [ ] Uji fungsi sirine, lampu strobo/rotator, dan klakson.
- [ ] Pastikan tabung oksigen utama dan portabel terisi dengan tekanan minimal > 1000 PSI.
- [ ] Pastikan brankar (*stretcher*) dapat terkunci rapat pada lantai kabin.
- [ ] Pastikan perawat pendamping telah membawa *emergency kit bag* dan obat darurat.

### Fase 2: Selama Perjalanan (*In-Transit*)
- [ ] Gunakan sirine dan lampu strobo secara bijak sesuai tingkat kegawatan (*triase*) pasien.
- [ ] Prioritaskan keselamatan berkendara (*defensive driving*) di atas kecepatan.
- [ ] Jaga kelembutan pengereman dan manuver kemudi agar tidak memperburuk kondisi fisik pasien di dalam kabin.
- [ ] Berkoordinasi dengan perawat pendamping mengenai rute tercepat dan kondisi jalan.

### Fase 3: Pasca Perjalanan (*Post-Trip Handover*)
- [ ] Catat perjalanan ke dalam aplikasi sistem logbook **selambat-lambatnya 15 menit** setelah unit parkir kembali di pangkalan IGD.
- [ ] Bersihkan dan semprotkan desinfektan pada kabin ambulans serta brankar.
- [ ] Ganti linen brankar yang kotor dengan linen bersih (gunakan modul LinenFlow IGD).
- [ ] Jika ada tabung oksigen atau alat medis yang terpakai, segera laporkan ke farmasi/logistik IGD untuk pengisian ulang.
- [ ] Kunci kembali aplikasi logbook setelah selesai pencatatan.

---

## 9. Tanya Jawab & Pemecahan Masalah (FAQ & Troubleshooting)

**Q1: Apa yang harus dilakukan jika saya lupa PIN 6-digit akses logbook?**  
*Jawab:* PIN standar bawaan sistem adalah `123456`. Jika PIN tersebut telah diubah oleh rekan shift sebelumnya dan Anda lupa, hubungi Supervisor IGD, Kepala Ruangan, atau Administrator TI Rumah Sakit untuk mereset PIN melalui menu Pengaturan Admin.

**Q2: Bagaimana jika sinyal internet di HP driver terputus saat berada di lokasi penjemputan?**  
*Jawab:* Catat jam berangkat, jam tiba, dan kilometer sementara di catatan kecil HP. Begitu tiba kembali di rumah sakit dan terhubung dengan jaringan Wi-Fi IGD, buka aplikasi dan segera inputkan datanya.

**Q3: Bagaimana jika ambulans menjemput pasien melintasi tengah malam (misal berangkat 23:30 dan kembali 01:15 keesokan harinya)?**  
*Jawab:* Sistem telah diprogram dengan algoritma waktu cerdas. Cukup masukkan waktu mulai `23:30` dan waktu selesai `01:15`, sistem akan secara otomatis mendeteksi perpindahan hari dan menghasilkan durasi yang akurat (1 Jam 45 Menit).

**Q4: Pasien yang dijemput adalah korban kecelakaan tanpa identitas dan belum memiliki nomor RM, apa yang harus diisi?**  
*Jawab:* Pada kolom Nama Pasien ketikkan keterangan identifikasi sementara, misalnya: `Mr. X (Korban Laka Lantas Tol Bekasi Barat)` dan pada kolom No. RM dapat diisi `-` atau nomor registrasi sementara dari kepolisian. Setelah pasien terdaftar resmi di admisi IGD, Anda dapat menekan tombol **Edit** untuk melengkapi nomor RM resminya.

**Q5: Apakah ada batasan jumlah penginputan perjalanan per hari?**  
*Jawab:* Tidak ada batasan. Seluruh perjalanan ambulans dapat dicatat sebanyak-banyaknya tanpa batas kuota.

---

*Buku panduan ini disusun sebagai pedoman baku operasional pengemudi ambulans dan pelayanan rujukan terpadu Primaya Hospital.*  
*Unit Terkait: Instalasi Gawat Darurat (IGD) • Koordinator Pengemudi • Manajemen Penunjang Medis.*
