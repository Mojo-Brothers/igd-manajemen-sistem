import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/ambulance_models.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import 'map_picker_screen.dart';

class ExpeditionFormScreen extends StatefulWidget {
  final HospitalBaseLocation baseLocation;

  const ExpeditionFormScreen({
    super.key,
    required this.baseLocation,
  });

  @override
  State<ExpeditionFormScreen> createState() => _ExpeditionFormScreenState();
}

class _ExpeditionFormScreenState extends State<ExpeditionFormScreen> {
  final _formKey = GlobalKey<FormState>();

  String _date = DateFormat('yyyy-MM-dd').format(DateTime.now());
  String _startTime = DateFormat('HH:mm').format(DateTime.now());
  String _endTime = DateFormat('HH:mm').format(DateTime.now().add(const Duration(hours: 1)));

  String? _selectedFleet;
  String? _selectedDriver;
  String _activityType = 'Rujukan';

  final TextEditingController _odoStartController = TextEditingController();
  final TextEditingController _odoEndController = TextEditingController();
  int _distanceKm = 0;

  final TextEditingController _destinationController = TextEditingController();
  double? _destinationLat;
  double? _destinationLng;

  final TextEditingController _patientNameController = TextEditingController();
  final TextEditingController _rmController = TextEditingController();
  String _initialStatus = 'Stabil';
  String _finalStatus = 'Stabil';

  final TextEditingController _fuelCostController = TextEditingController();
  final TextEditingController _tollCostController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();

  bool _isSubmitting = false;

  final List<String> _activityTypes = [
    'Rujukan',
    'Penjemputan',
    'Evakuasi Medis (Medevac)',
    'Standby Event',
    'Lainnya',
  ];

  final List<String> _statusOptions = [
    'Stabil',
    'Membaik',
    'Kritis',
    'Meninggal',
    'Selesai',
  ];

  @override
  void initState() {
    super.initState();
    _odoStartController.addListener(_calculateOdoDistance);
    _odoEndController.addListener(_calculateOdoDistance);
  }

  @override
  void dispose() {
    _odoStartController.dispose();
    _odoEndController.dispose();
    _destinationController.dispose();
    _patientNameController.dispose();
    _rmController.dispose();
    _fuelCostController.dispose();
    _tollCostController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _calculateOdoDistance() {
    final start = int.tryParse(_odoStartController.text) ?? 0;
    final end = int.tryParse(_odoEndController.text) ?? 0;
    if (end >= start && start > 0) {
      setState(() {
        _distanceKm = end - start;
      });
    }
  }

  Future<void> _openMapPicker() async {
    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => MapPickerScreen(
          baseLocation: widget.baseLocation,
          initialDestination: _destinationController.text,
          initialLat: _destinationLat,
          initialLng: _destinationLng,
        ),
      ),
    );

    if (result != null) {
      setState(() {
        _destinationController.text = result['address'] ?? '';
        _destinationLat = result['lat'];
        _destinationLng = result['lng'];
        if (_distanceKm == 0 && result['distanceKm'] != null) {
          _distanceKm = result['distanceKm'];
        }
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedFleet == null || _selectedFleet!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan pilih armada ambulans')),
      );
      return;
    }

    if (_selectedDriver == null || _selectedDriver!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Silakan pilih pengemudi ambulans')),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final expNum = await FirestoreService.generateNextExpeditionNumber(_date);

      final data = {
        'expeditionNumber': expNum,
        'date': _date,
        'startTime': _startTime,
        'endTime': _endTime,
        'odometerStart': int.tryParse(_odoStartController.text) ?? 0,
        'odometerEnd': int.tryParse(_odoEndController.text) ?? 0,
        'distanceKm': _distanceKm,
        'activityType': _activityType,
        'driver': _selectedDriver,
        'ambulance': _selectedFleet,
        'patientName': _patientNameController.text.trim().isNotEmpty
            ? _patientNameController.text.trim()
            : null,
        'medicalRecordNumber': _rmController.text.trim().isNotEmpty
            ? _rmController.text.trim()
            : null,
        'initialStatus': _initialStatus,
        'finalStatus': _finalStatus,
        'destination': _destinationController.text.trim().isNotEmpty
            ? _destinationController.text.trim()
            : 'Sesuai Rute Operasional',
        'destinationLat': _destinationLat,
        'destinationLng': _destinationLng,
        'fuelCost': int.tryParse(_fuelCostController.text),
        'tollCost': int.tryParse(_tollCostController.text),
        'notes': _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      };

      await FirestoreService.createExpedition(data);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Ekspedisi $expNum berhasil dicatat!'),
          backgroundColor: AppTheme.accent,
        ),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Gagal menyimpan ekspedisi: $e'),
          backgroundColor: AppTheme.danger,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Catat Ekspedisi Ambulans',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            // Banner Pangkalan
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.primary.withOpacity(0.2)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.home_work_rounded, color: AppTheme.primary, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pangkalan Titik Awal (Admin):',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryDark,
                          ),
                        ),
                        Text(
                          widget.baseLocation.name,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Dropdown Armada Ambulans
            Text(
              'Armada Ambulans *',
              style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            StreamBuilder<List<String>>(
              stream: FirestoreService.getFleetsStream(),
              builder: (context, snapshot) {
                final fleets = snapshot.data ?? [];
                if (_selectedFleet == null && fleets.isNotEmpty) {
                  _selectedFleet = fleets.first;
                }
                return DropdownButtonFormField<String>(
                  value: _selectedFleet,
                  decoration: const InputDecoration(hintText: 'Pilih unit ambulans'),
                  items: fleets.map((f) => DropdownMenuItem(value: f, child: Text(f))).toList(),
                  onChanged: (val) => setState(() => _selectedFleet = val),
                );
              },
            ),
            const SizedBox(height: 14),

            // Dropdown Driver Standby
            Text(
              'Pengemudi (Driver) *',
              style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            StreamBuilder<List<String>>(
              stream: FirestoreService.getDriversStream(),
              builder: (context, snapshot) {
                final drivers = snapshot.data ?? [];
                if (_selectedDriver == null && drivers.isNotEmpty) {
                  _selectedDriver = drivers.first;
                }
                return DropdownButtonFormField<String>(
                  value: _selectedDriver,
                  decoration: const InputDecoration(hintText: 'Pilih nama driver'),
                  items: drivers.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                  onChanged: (val) => setState(() => _selectedDriver = val),
                );
              },
            ),
            const SizedBox(height: 14),

            // Jenis Kegiatan
            Text(
              'Jenis Kegiatan *',
              style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              value: _activityType,
              items: _activityTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
              onChanged: (val) => setState(() => _activityType = val!),
            ),
            const SizedBox(height: 14),

            // Lokasi Tujuan & Tombol Peta
            Text(
              'Lokasi Tujuan *',
              style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _destinationController,
                    decoration: const InputDecoration(
                      hintText: 'Nama RS / Alamat rujukan...',
                    ),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Wajib diisi' : null,
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  style: IconButton.filled(backgroundColor: AppTheme.primary),
                  onPressed: _openMapPicker,
                  tooltip: 'Pilih Lokasi dari Peta GPS',
                  icon: const Icon(Icons.map_rounded),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Odometer Awal & Akhir
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Odo Awal (KM) *', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _odoStartController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: 'Contoh: 12500'),
                        validator: (val) => val == null || val.isEmpty ? 'Isi Odo Awal' : null,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Odo Akhir (KM) *', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _odoEndController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(hintText: 'Contoh: 12530'),
                        validator: (val) => val == null || val.isEmpty ? 'Isi Odo Akhir' : null,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            if (_distanceKm > 0)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '🚗 Total Jarak: $_distanceKm KM',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary,
                  ),
                ),
              ),
            const SizedBox(height: 14),

            // Data Pasien (Opsional)
            Text(
              'Informasi Pasien (Jika Ada)',
              style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _patientNameController,
                    decoration: const InputDecoration(hintText: 'Nama Pasien'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _rmController,
                    decoration: const InputDecoration(hintText: 'No. Rekam Medis (RM)'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Status Pasien (Awal & Akhir)
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Kondisi Awal', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: _initialStatus,
                        items: _statusOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                        onChanged: (val) => setState(() => _initialStatus = val!),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Kondisi Akhir', style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: _finalStatus,
                        items: _statusOptions.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                        onChanged: (val) => setState(() => _finalStatus = val!),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Biaya Operasional (BBM & Tol)
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _fuelCostController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      prefixText: 'Rp ',
                      hintText: 'Biaya BBM',
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _tollCostController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      prefixText: 'Rp ',
                      hintText: 'Biaya Tol / Parkir',
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Catatan
            TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Catatan perjalanan / keluhan medis...',
              ),
            ),
            const SizedBox(height: 24),

            // Submit Button
            SizedBox(
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitForm,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.check_circle_rounded),
                label: Text(
                  _isSubmitting ? 'Menyimpan Ekspedisi...' : 'Simpan Log Perjalanan',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
