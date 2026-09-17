# Panduan Aplikasi Android Driver Ambulans (Native Flutter)

Dokumen ini menjelaskan arsitektur dan cara kerja aplikasi Android khusus pengemudi ambulans Primaya Hospital IGD yang dibangun menggunakan **Flutter (Dart)** secara native (tanpa WebView).

---

## 📁 Struktur Direktori `mobile/`

* [`mobile/pubspec.yaml`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/pubspec.yaml): Dependensi Flutter (Firebase Core & Firestore, Flutter Map, LatLong2, Geolocator, Google Fonts, Intl, SharedPreferences).
* [`mobile/android/`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/android): Konfigurasi Android native (Manifest permissions GPS & Internet, Gradle, SDK 23 - 34).
* [`mobile/lib/main.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/main.dart): Titik masuk aplikasi dan inisialisasi Firebase.
* [`mobile/lib/firebase_options.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/firebase_options.dart): Kredensial koneksi Firebase ke proyek `igd-doctor-schedule-display`.
* [`mobile/lib/theme/app_theme.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/theme/app_theme.dart): Sistem tema Material 3 dan palet warna resmi Primaya Hospital (Blue 800, Emerald 600, Plus Jakarta Sans).
* [`mobile/lib/models/ambulance_models.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/models/ambulance_models.dart): Model data ekspedisi, driver, armada, dan pangkalan RS.
* [`mobile/lib/services/firestore_service.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/services/firestore_service.dart): Layanan sinkronisasi Firestore real-time.
* [`mobile/lib/services/location_service.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/services/location_service.dart): Layanan GPS perangkat, formula Haversine dengan faktor kurva jalan 25%, dan reverse geocoding OSM.
* [`mobile/lib/screens/pin_screen.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/screens/pin_screen.dart): Layar otentikasi 6-digit PIN pad.
* [`mobile/lib/screens/dashboard_screen.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/screens/dashboard_screen.dart): Layar utama driver (ringkasan tugas, metrik harian, histori).
* [`mobile/lib/screens/expedition_form_screen.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/screens/expedition_form_screen.dart): Form pencatatan ekspedisi ambulans.
* [`mobile/lib/screens/map_picker_screen.dart`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/mobile/lib/screens/map_picker_screen.dart): Peta interaktif OpenStreetMap native dengan marker pangkalan 🏥, marker tujuan 📍, dan garis rute.

---

## ⚡ Cara Kompilasi dan Download APK

Aplikasi ini telah dilengkapi dengan pipeline CI/CD GitHub Actions:
[`.github/workflows/build-flutter-apk.yml`](file:///c:/Users/FOMEMA/primaya-igd-doctor-schedule-display/.github/workflows/build-flutter-apk.yml)

### Langkah Download APK:
1. Buka repositori GitHub di browser.
2. Masuk ke tab **Actions**.
3. Pilih alur kerja **Build Flutter Android APK**.
4. Klik **Run workflow** (atau otomatis terpicu setiap push ke `mobile/`).
5. Setelah build selesai (sekitar 3-4 menit), klik run tersebut dan download file APK pada bagian **Artifacts** (`primaya-ambulance-driver-apk`).
6. Pasang (install) file `.apk` pada perangkat smartphone Android driver ambulans.
