# Primaya Hospital - IGD Doctor Schedule Display

Web aplikasi statis untuk menampilkan jadwal dokter jaga di Instalasi Gawat Darurat (IGD) Primaya Hospital pada TV ukuran 42 inch (1920x1080), lengkap dengan panel admin untuk pengelolaan data.

## Fitur Utama

- **TV Display Mode**: Tampilan fullscreen beresolusi 1080p tanpa scrollbar, dengan jam digital real-time dan teks berjalan.
- **Real-time Updates**: Data dokter dan pengaturan berubah seketika tanpa perlu refresh browser.
- **Admin Backend**: Dashboard khusus untuk menambah, mengubah, atau menghapus daftar dokter dan mengatur siapa yang bertugas.
- **Customizable**: Warna tema, logo, nama rumah sakit, dan teks berjalan dapat diatur dari Admin Panel.

## Tech Stack

- React 18, Vite, TypeScript
- Tailwind CSS v4, Framer Motion (Animasi)
- Firebase Firestore (Database), Authentication, Storage
- React Router DOM v6

## Persyaratan Awal (Prerequisites)

1. Node.js (versi 18+ disarankan)
2. Akun Firebase & Project Firebase yang sudah dibuat.
   - Aktifkan **Authentication** (Email/Password).
   - Aktifkan **Firestore Database**.
   - Aktifkan **Storage**.

### Aturan Keamanan Firebase (Security Rules)

**Firestore Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Read: Siapapun boleh membaca (untuk display TV)
    // Write: Hanya admin yang sudah login yang boleh mengubah data
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Read: Semua bisa melihat gambar
    // Write: Hanya admin yang bisa mengupload
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Setup & Instalasi

1. **Clone repository ini**
2. **Install Dependensi:**

   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   - Ubah nama `.env.example` menjadi `.env`
   - Isi nilai dari konfigurasi Firebase Project Anda.

4. **Jalankan Aplikasi Lokal:**

   ```bash
   npm run dev
   ```

   Aplikasi Display TV akan berjalan di `http://localhost:5173/` dan Admin Panel di `http://localhost:5173/admin`

## Panduan Deployment (GitHub Pages)

Aplikasi ini sudah dikonfigurasi untuk berjalan sebagai static site yang kompatibel dengan GitHub Pages.

1. Sesuaikan path URL repositori Anda pada file `vite.config.ts`. Ubah nilai `base: './'` menjadi nama repository jika menggunakan struktur standar GitHub, contoh: `base: '/nama-repo/'`.
2. Lakukan build production:

   ```bash
   npm run build
   ```

3. Deploy folder `dist` yang dihasilkan ke branch `gh-pages` di repository Anda, atau gunakan GitHub Actions untuk proses deploy otomatis.

## Troubleshooting

- **Error Login Admin:** Pastikan metode autentikasi Email/Password sudah diaktifkan di konsol Firebase.
- **Gambar Tidak Muncul:** Periksa Firebase Storage Rules, pastikan izin baca (`allow read`) telah disetel ke `true`.
- **Layar TV Muncul Scrollbar:** Gunakan fungsi "Fullscreen Mode" (F11) pada browser TV, dan atur zoom layar ke 100%. Desain ini dikhususkan untuk layar 1920x1080.
