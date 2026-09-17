import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geolocator/geolocator.dart';

/// Layanan Pelacakan GPS Latar Belakang (Background Location Tracking)
/// Bekerja secara hening tanpa menampilkan UI pada sisi frontend driver mobile.
/// Data telemetri dikirim langsung ke Firestore koleksi 'ambulance_live_locations'
/// agar dapat dipantau secara visual di dashboard backend web admin.
class LocationTrackingService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;
  static const String _collectionName = 'ambulance_live_locations';

  static Timer? _timer;
  static bool _isTracking = false;
  static String _activeFleet = 'EVALIA';
  static String _activeDriver = 'Driver Mobile';

  /// Memulai pengiriman koordinat GPS secara berkala (default: setiap 12 detik)
  static Future<void> startTracking({
    String? fleet,
    String? driver,
    int intervalSeconds = 12,
  }) async {
    if (fleet != null && fleet.isNotEmpty) _activeFleet = fleet;
    if (driver != null && driver.isNotEmpty) _activeDriver = driver;

    if (_isTracking) {
      // Jika sudah jalan, cukup perbarui identitas armada/driver
      return;
    }

    try {
      // 1. Periksa izin lokasi perangkat
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied ||
            permission == LocationPermission.deniedForever) {
          // Gagal mendapatkan izin lokasi; jangan crash atau mengganggu pengguna
          return;
        }
      }

      // 2. Periksa apakah GPS aktif
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return;
      }

      _isTracking = true;

      // Kirim koordinat pertama kali segera
      await _sendCurrentLocation();

      // Mulai timer berkala
      _timer?.cancel();
      _timer = Timer.periodic(Duration(seconds: intervalSeconds), (_) async {
        await _sendCurrentLocation();
      });
    } catch (e) {
      // Tangani error secara hening (silent) agar UI driver tidak pernah crash
    }
  }

  /// Memperbarui informasi armada dan driver yang sedang aktif
  static void updateSessionInfo({required String fleet, required String driver}) {
    if (fleet.isNotEmpty) _activeFleet = fleet;
    if (driver.isNotEmpty) _activeDriver = driver;
    // Segera kirim update dengan nama baru
    if (_isTracking) {
      _sendCurrentLocation();
    }
  }

  /// Mengirimkan posisi GPS saat ini ke Firestore
  static Future<void> _sendCurrentLocation() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );

      final speedKmh = (position.speed * 3.6).round();
      final isMoving = speedKmh > 2;

      final docId = _activeFleet.trim().toUpperCase();
      await _db.collection(_collectionName).doc(docId).set({
        'ambulance': docId,
        'driver': _activeDriver,
        'lat': position.latitude,
        'lng': position.longitude,
        'speed': speedKmh,
        'heading': position.heading.round(),
        'accuracy': position.accuracy.round(),
        'isMoving': isMoving,
        'status': isMoving ? 'Bergerak' : 'Online',
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (e) {
      // Silent catch
    }
  }

  /// Menghentikan pengiriman GPS saat logout / aplikasi ditutup
  static Future<void> stopTracking() async {
    _timer?.cancel();
    _timer = null;
    _isTracking = false;

    // Tandai status offline di Firestore jika memungkinkan
    try {
      final docId = _activeFleet.trim().toUpperCase();
      await _db.collection(_collectionName).doc(docId).set({
        'status': 'Offline',
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));
    } catch (e) {
      // Silent catch
    }
  }
}
