import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/ambulance_models.dart';
import '../services/location_service.dart';
import '../theme/app_theme.dart';

class MapPickerScreen extends StatefulWidget {
  final HospitalBaseLocation baseLocation;
  final String? initialDestination;
  final double? initialLat;
  final double? initialLng;

  const MapPickerScreen({
    super.key,
    required this.baseLocation,
    this.initialDestination,
    this.initialLat,
    this.initialLng,
  });

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  final MapController _mapController = MapController();
  late LatLng _baseCoords;
  late LatLng _selectedCoords;
  String _address = '';
  double _distanceKm = 0.0;
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];

  @override
  void initState() {
    super.initState();
    _baseCoords = LatLng(widget.baseLocation.lat, widget.baseLocation.lng);

    final double lat = widget.initialLat ?? (_baseCoords.latitude + 0.015);
    final double lng = widget.initialLng ?? (_baseCoords.longitude + 0.012);
    _selectedCoords = LatLng(lat, lng);
    _address = widget.initialDestination ?? 'Lokasi Tujuan';
    _calculateDistance();
  }

  void _calculateDistance() {
    setState(() {
      _distanceKm = LocationService.calculateDistanceKm(
        _baseCoords.latitude,
        _baseCoords.longitude,
        _selectedCoords.latitude,
        _selectedCoords.longitude,
      );
    });
  }

  Future<void> _updateLocation(LatLng newCoords, {bool fetchAddress = true}) async {
    setState(() {
      _selectedCoords = newCoords;
      _calculateDistance();
    });

    if (fetchAddress) {
      final addr = await LocationService.getAddressFromCoordinates(
        newCoords.latitude,
        newCoords.longitude,
      );
      if (mounted) {
        setState(() {
          _address = addr;
        });
      }
    }
  }

  Future<void> _handleSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isSearching = true;
    });

    final results = await LocationService.searchPlaces(query);
    if (mounted) {
      setState(() {
        _isSearching = false;
        _searchResults = results;
      });
    }
  }

  void _selectSearchResult(Map<String, dynamic> item) {
    final lat = double.tryParse(item['lat']?.toString() ?? '') ?? _selectedCoords.latitude;
    final lng = double.tryParse(item['lon']?.toString() ?? '') ?? _selectedCoords.longitude;
    final name = item['display_name'] ?? 'Tujuan Terpilih';

    final target = LatLng(lat, lng);
    setState(() {
      _address = name.split(',').take(3).join(', ').trim();
      _searchResults = [];
      _searchController.clear();
    });

    _mapController.move(target, 15);
    _updateLocation(target, fetchAddress: false);
  }

  Future<void> _centerToMyGps() async {
    final pos = await LocationService.getCurrentPosition();
    if (pos != null) {
      final target = LatLng(pos.latitude, pos.longitude);
      _mapController.move(target, 16);
      _updateLocation(target, fetchAddress: true);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tidak dapat mengakses GPS perangkat')),
        );
      }
    }
  }

  void _centerToBase() {
    _mapController.move(_baseCoords, 15);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pilih Lokasi Tujuan',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
            Text(
              'Pangkalan: 🏥 ${widget.baseLocation.name}',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: Colors.white.withOpacity(0.9),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.home_work_rounded),
            tooltip: 'Arahkan ke Pangkalan',
            onPressed: _centerToBase,
          ),
          IconButton(
            icon: const Icon(Icons.my_location_rounded),
            tooltip: 'Lokasi GPS Saya',
            onPressed: _centerToMyGps,
          ),
        ],
      ),
      body: Stack(
        children: [
          // Flutter Map Native
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedCoords,
              initialZoom: 14.0,
              onTap: (tapPosition, point) {
                _updateLocation(point, fetchAddress: true);
              },
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.primayahospital.ambulance',
              ),

              // Garis rute pangkalan ke tujuan
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: [_baseCoords, _selectedCoords],
                    strokeWidth: 3.5,
                    color: AppTheme.danger,
                    pattern: const StrokePattern.dotted(),
                  ),
                ],
              ),

              // Markers (Pangkalan & Tujuan)
              MarkerLayer(
                markers: [
                  // Marker Pangkalan Rumah Sakit
                  Marker(
                    point: _baseCoords,
                    width: 140,
                    height: 44,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.4),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: Text(
                            '🏥 ${widget.baseLocation.name}',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Marker Tujuan Terpilih
                  Marker(
                    point: _selectedCoords,
                    width: 130,
                    height: 48,
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.danger,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.danger.withOpacity(0.4),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: Text(
                            '📍 Lokasi Tujuan',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.arrow_drop_down,
                          color: AppTheme.danger,
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Search Bar Atas
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Column(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _handleSearch(),
                    decoration: InputDecoration(
                      hintText: 'Cari rumah sakit, jalan, atau gedung...',
                      prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary),
                      suffixIcon: _isSearching
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : IconButton(
                              icon: const Icon(Icons.arrow_forward_rounded),
                              onPressed: _handleSearch,
                            ),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                  ),
                ),

                // Hasil Pencarian Dropdown
                if (_searchResults.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    constraints: const BoxConstraints(maxHeight: 180),
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: _searchResults.length,
                      itemBuilder: (context, idx) {
                        final item = _searchResults[idx];
                        return ListTile(
                          dense: true,
                          leading: const Icon(Icons.location_on, color: AppTheme.danger, size: 18),
                          title: Text(
                            item['display_name'] ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(fontSize: 12),
                          ),
                          onTap: () => _selectSearchResult(item),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),

          // Bottom Detail Card & Konfirmasi
          Positioned(
            bottom: 20,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.12),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'LOKASI TUJUAN TERPILIH',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textSecondary,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              _address,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.route_rounded, color: AppTheme.primary, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '$_distanceKm KM',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(context).pop({
                          'address': _address,
                          'lat': _selectedCoords.latitude,
                          'lng': _selectedCoords.longitude,
                          'distanceKm': _distanceKm.round(),
                        });
                      },
                      icon: const Icon(Icons.check_circle_rounded, size: 18),
                      label: const Text('Gunakan Lokasi Ini'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accent,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
