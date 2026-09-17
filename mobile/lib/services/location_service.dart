import 'dart:convert';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Hitung estimasi jarak garis lurus (Formula Haversine) dengan faktor kelokan rute darat (+25%)
  static double calculateDistanceKm(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double p = 0.017453292519943295; // Math.PI / 180
    final double a = 0.5 -
        cos((lat2 - lat1) * p) / 2 +
        cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2;
    final double straightLine = 12742 * asin(sqrt(a)); // 2 * R; R = 6371 km
    // Estimasi rute jalan darat perkotaan (+25%)
    final double roadEstimate = straightLine * 1.25;
    return double.parse(roadEstimate.toStringAsFixed(1));
  }

  /// Ambil koordinat GPS perangkat smartphone saat ini
  static Future<Position?> getCurrentPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return null;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return null;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return null;
    }

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  /// Reverse geocoding koordinat GPS menjadi nama tempat/alamat jalan
  static Future<String> getAddressFromCoordinates(double lat, double lng) async {
    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&zoom=18&addressdetails=1',
      );
      final response = await http.get(
        url,
        headers: {'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data != null && data['display_name'] != null) {
          final addr = data['address'] as Map<String, dynamic>? ?? {};
          final place = data['name'] ??
              addr['hospital'] ??
              addr['amenity'] ??
              addr['building'] ??
              addr['road'] ??
              '';
          final area = addr['suburb'] ?? addr['city_district'] ?? addr['city'] ?? '';
          if (place.isNotEmpty && area.isNotEmpty) {
            return '$place, $area';
          }
          final parts = (data['display_name'] as String).split(',');
          return parts.take(3).join(', ').trim();
        }
      }
    } catch (e) {
      // ignore
    }
    return 'Lokasi Terpilih (${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)})';
  }

  /// Cari nama tempat / rumah sakit tujuan
  static Future<List<Map<String, dynamic>>> searchPlaces(String query) async {
    if (query.trim().isEmpty) return [];
    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query)}&countrycodes=id&limit=5',
      );
      final response = await http.get(
        url,
        headers: {'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8'},
      );
      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((item) => item as Map<String, dynamic>).toList();
      }
    } catch (e) {
      // ignore
    }
    return [];
  }
}
