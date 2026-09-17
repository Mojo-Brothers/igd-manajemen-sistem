import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/ambulance_models.dart';
import '../services/firestore_service.dart';
import '../theme/app_theme.dart';
import '../utils/ambulance_utils.dart';
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

  // State Form
  String _date = DateFormat('yyyy-MM-dd').format(DateTime.now());
  String _activityType = 'Jemput Pasien';
  String? _selectedFleet;
  String? _selectedDriver;

  final TextEditingController _patientNameController = TextEditingController();
  final TextEditingController _rmController = TextEditingController();

  String _initialStatus = 'Rumah Pasien';
  bool _isCustomInitialStatus = false;
  final TextEditingController _customInitialStatusController = TextEditingController();

  String _finalStatus = 'Rawat Inap';
  bool _isCustomFinalStatus = false;
  final TextEditingController _customFinalStatusController = TextEditingController();

  final TextEditingController _destinationController = TextEditingController();
  double? _destinationLat;
  double? _destinationLng;

  String _startTime = '08:00';
  String _endTime = '09:00';
  final TextEditingController _distanceKmController = TextEditingController(text: '0');

  final TextEditingController _notesController = TextEditingController();

  bool _isSubmitting = false;
  bool _showPreview = false;

  @override
  void initState() {
    super.initState();
    // Inisialisasi waktu dengan waktu lokal saat ini
    final now = DateTime.now();
    _startTime = DateFormat('HH:mm').format(now);
    _endTime = DateFormat('HH:mm').format(now.add(const Duration(hours: 1)));
  }

  @override
  void dispose() {
    _patientNameController.dispose();
    _rmController.dispose();
    _customInitialStatusController.dispose();
    _customFinalStatusController.dispose();
    _destinationController.dispose();
    _distanceKmController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  bool get _isPatientRequired =>
      AmbulanceConstants.patientRequiredActivities.contains(_activityType);

  DurationResult get _currentDuration =>
      calculateDuration(_startTime, _endTime, _date);

  Future<void> _pickDate() async {
    final current = DateTime.tryParse(_date) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primary,
              onPrimary: Colors.white,
              onSurface: AppTheme.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _date = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _pickTime({required bool isStart}) async {
    final initialStr = isStart ? _startTime : _endTime;
    final parts = initialStr.split(':');
    final initialTime = TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 8,
      minute: parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0,
    );

    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primary,
              onPrimary: Colors.white,
              onSurface: AppTheme.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      setState(() {
        if (isStart) {
          _startTime = formatted;
        } else {
          _endTime = formatted;
        }
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
        final estDist = (result['distanceKm'] as num?)?.toDouble() ?? 0.0;
        final currentDist = double.tryParse(_distanceKmController.text) ?? 0.0;
        if (currentDist == 0.0 && estDist > 0) {
          _distanceKmController.text = estDist.toString();
        }
      });
    }
  }

  Future<void> _showAddDriverDialog() async {
    final controller = TextEditingController();
    await showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Tambah Driver Baru',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16),
        ),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            hintText: 'Ketik nama driver...',
            labelText: 'Nama Driver',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = controller.text.trim();
              if (name.isNotEmpty) {
                await FirestoreService.addDriver(name);
                setState(() {
                  _selectedDriver = name;
                });
                if (mounted) Navigator.of(dialogCtx).pop();
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  Future<void> _showAddFleetDialog() async {
    final controller = TextEditingController();
    await showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Tambah Armada Ambulance',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 16),
        ),
        content: TextField(
          controller: controller,
          autofocus: true,
          textCapitalization: TextCapitalization.characters,
          decoration: const InputDecoration(
            hintText: 'Misal: HIACE, APV...',
            labelText: 'Nama Unit / Armada',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogCtx).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () async {
              final name = controller.text.trim().toUpperCase();
              if (name.isNotEmpty) {
                await FirestoreService.addFleet(name);
                setState(() {
                  _selectedFleet = name;
                });
                if (mounted) Navigator.of(dialogCtx).pop();
              }
            },
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  void _proceedToPreview() {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedFleet == null || _selectedFleet!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ambulance yang digunakan wajib dipilih')),
      );
      return;
    }

    if (_selectedDriver == null || _selectedDriver!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nama Driver wajib dipilih')),
      );
      return;
    }

    if (_isPatientRequired && _patientNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Nama Pasien wajib diisi untuk kegiatan "$_activityType"'),
        ),
      );
      return;
    }

    if (_isCustomInitialStatus && _customInitialStatusController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status Awal Pasien wajib diketik manual')),
      );
      return;
    }

    if (_isCustomFinalStatus && _customFinalStatusController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status Akhir Pasien wajib diketik manual')),
      );
      return;
    }

    final dist = double.tryParse(_distanceKmController.text) ?? 0.0;
    if (dist < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Jarak tempuh tidak boleh bernilai negatif')),
      );
      return;
    }

    final effectiveInitialStatus = _isCustomInitialStatus
        ? _customInitialStatusController.text.trim()
        : _initialStatus;
    final effectiveFinalStatus = _isCustomFinalStatus
        ? _customFinalStatusController.text.trim()
        : _finalStatus;

    final hasLainnya = _activityType == 'Lainnya' ||
        effectiveInitialStatus == 'Lainnya' ||
        effectiveFinalStatus == 'Lainnya';

    if (hasLainnya && _notesController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Keterangan Tambahan wajib diisi jika memilih opsi "Lainnya"'),
        ),
      );
      return;
    }

    setState(() {
      _showPreview = true;
    });
  }

  Future<void> _finalSubmit() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      final expNum = await FirestoreService.generateNextExpeditionNumber(_date);
      final duration = _currentDuration;
      final dist = double.tryParse(_distanceKmController.text) ?? 0.0;

      final effectiveInitialStatus = _isCustomInitialStatus
          ? _customInitialStatusController.text.trim()
          : _initialStatus;
      final effectiveFinalStatus = _isCustomFinalStatus
          ? _customFinalStatusController.text.trim()
          : _finalStatus;

      final payload = {
        'expeditionNumber': expNum,
        'date': _date,
        'activityType': _activityType,
        'patientName': _patientNameController.text.trim().isNotEmpty
            ? _patientNameController.text.trim()
            : null,
        'medicalRecordNumber': _rmController.text.trim().isNotEmpty
            ? _rmController.text.trim()
            : null,
        'initialStatus': effectiveInitialStatus.isNotEmpty ? effectiveInitialStatus : null,
        'finalStatus': effectiveFinalStatus.isNotEmpty ? effectiveFinalStatus : null,
        'ambulance': _selectedFleet,
        'driver': _selectedDriver,
        'startTime': _startTime,
        'endTime': _endTime,
        'durationMinutes': duration.minutes,
        'durationFormatted': duration.formatted,
        'distanceKm': dist,
        'destination': _destinationController.text.trim().isNotEmpty
            ? _destinationController.text.trim()
            : 'Sesuai Rute Operasional',
        'destinationLat': _destinationLat,
        'destinationLng': _destinationLng,
        'notes': _notesController.text.trim().isNotEmpty
            ? _notesController.text.trim()
            : null,
        'createdByName': 'Driver Mobile',
      };

      await FirestoreService.createExpedition(payload);

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
          _showPreview ? 'Konfirmasi & Preview Ekspedisi' : 'Catat Ekspedisi Ambulans',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (_showPreview) {
              setState(() => _showPreview = false);
            } else {
              Navigator.of(context).pop();
            }
          },
        ),
      ),
      body: _showPreview ? _buildPreviewBody() : _buildFormBody(),
    );
  }

  /// Tampilan Form Input Data (Seksi 1 sampai 4)
  Widget _buildFormBody() {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Banner Pangkalan Rumah Sakit
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
                        'Pangkalan Titik Awal:',
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
          const SizedBox(height: 16),

          // ================= SEKSI 1: INFORMASI KEGIATAN =================
          _buildSectionCard(
            title: '1. Informasi Kegiatan',
            icon: Icons.assignment_rounded,
            children: [
              // Tanggal Kegiatan
              Text(
                'Tanggal Kegiatan *',
                style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              InkWell(
                onTap: _pickDate,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded, size: 16, color: AppTheme.primary),
                      const SizedBox(width: 10),
                      Text(
                        formatDateIndo(_date, true),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const Spacer(),
                      const Icon(Icons.arrow_drop_down, color: Colors.grey),
                    ],
                  ),
                ),
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
                items: AmbulanceConstants.activityTypes
                    .map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 13))))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _activityType = val);
                },
              ),
              const SizedBox(height: 14),

              // Dropdown Armada Ambulans + Tambah Unit
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ambulance yang Digunakan *',
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  InkWell(
                    onTap: _showAddFleetDialog,
                    child: Row(
                      children: [
                        const Icon(Icons.add, size: 14, color: AppTheme.primary),
                        const SizedBox(width: 2),
                        Text(
                          'Tambah Ambulance',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              StreamBuilder<List<String>>(
                stream: FirestoreService.getFleetsStream(),
                builder: (context, snapshot) {
                  final fleets = snapshot.data ?? FirestoreService.defaultFleets;
                  if (_selectedFleet == null && fleets.isNotEmpty) {
                    _selectedFleet = fleets.first;
                  }
                  return DropdownButtonFormField<String>(
                    value: fleets.contains(_selectedFleet) ? _selectedFleet : null,
                    hint: const Text('Pilih unit ambulans', style: TextStyle(fontSize: 13)),
                    items: fleets
                        .map((f) => DropdownMenuItem(value: f, child: Text(f, style: const TextStyle(fontSize: 13))))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedFleet = val),
                  );
                },
              ),
              const SizedBox(height: 14),

              // Dropdown Driver + Tambah Driver
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Driver *',
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  InkWell(
                    onTap: _showAddDriverDialog,
                    child: Row(
                      children: [
                        const Icon(Icons.add, size: 14, color: AppTheme.primary),
                        const SizedBox(width: 2),
                        Text(
                          'Tambah Driver',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              StreamBuilder<List<String>>(
                stream: FirestoreService.getDriversStream(),
                builder: (context, snapshot) {
                  final drivers = snapshot.data ?? FirestoreService.defaultDrivers;
                  if (_selectedDriver == null && drivers.isNotEmpty) {
                    _selectedDriver = drivers.first;
                  }
                  return DropdownButtonFormField<String>(
                    value: drivers.contains(_selectedDriver) ? _selectedDriver : null,
                    hint: const Text('Pilih nama driver', style: TextStyle(fontSize: 13)),
                    items: drivers
                        .map((d) => DropdownMenuItem(value: d, child: Text(d, style: const TextStyle(fontSize: 13))))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedDriver = val),
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ================= SEKSI 2: INFORMASI PASIEN & STATUS =================
          _buildSectionCard(
            title: '2. Informasi Pasien & Status',
            icon: Icons.person_rounded,
            badge: _isPatientRequired ? 'Wajib Diisi (Pasien)' : 'Opsional',
            isWarningBadge: _isPatientRequired,
            children: [
              // Nama Pasien
              Text(
                'Nama Pasien ${_isPatientRequired ? '*' : ''}',
                style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _patientNameController,
                decoration: InputDecoration(
                  hintText: _isPatientRequired
                      ? 'Contoh: Ny. Siti Rahma'
                      : 'Opsional / jika ada pasien',
                ),
              ),
              const SizedBox(height: 14),

              // Nomor Rekam Medis (No. RM)
              Row(
                children: [
                  Text(
                    'Nomor Rekam Medis (No. RM)',
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '(Opsional)',
                    style: GoogleFonts.plusJakartaSans(fontSize: 10, color: Colors.grey),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _rmController,
                decoration: const InputDecoration(hintText: 'Contoh: RM-0012345'),
              ),
              const SizedBox(height: 14),

              // Status Awal Pasien
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Status Awal Pasien',
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  if (_isCustomInitialStatus)
                    Text(
                      'Ketik Manual',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _isCustomInitialStatus ? '__CUSTOM__' : _initialStatus,
                items: [
                  ...AmbulanceConstants.initialStatusOptions.map(
                    (s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13))),
                  ),
                  const DropdownMenuItem(
                    value: '__CUSTOM__',
                    child: Text('+ Tambahkan Lainnya (Ketik Manual)',
                        style: TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
                onChanged: (val) {
                  if (val == '__CUSTOM__') {
                    setState(() {
                      _isCustomInitialStatus = true;
                      _customInitialStatusController.text = '';
                    });
                  } else if (val != null) {
                    setState(() {
                      _isCustomInitialStatus = false;
                      _initialStatus = val;
                    });
                  }
                },
              ),
              if (_isCustomInitialStatus) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _customInitialStatusController,
                        autofocus: true,
                        decoration: const InputDecoration(
                          hintText: 'Ketik status awal lainnya...',
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () {
                        setState(() {
                          _isCustomInitialStatus = false;
                          _initialStatus = AmbulanceConstants.initialStatusOptions.first;
                        });
                      },
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 14),

              // Status Akhir Pasien
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Status Akhir Pasien',
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  if (_isCustomFinalStatus)
                    Text(
                      'Ketik Manual',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: _isCustomFinalStatus ? '__CUSTOM__' : _finalStatus,
                items: [
                  ...AmbulanceConstants.finalStatusOptions.map(
                    (s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 13))),
                  ),
                  const DropdownMenuItem(
                    value: '__CUSTOM__',
                    child: Text('+ Tambahkan Lainnya (Ketik Manual)',
                        style: TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
                onChanged: (val) {
                  if (val == '__CUSTOM__') {
                    setState(() {
                      _isCustomFinalStatus = true;
                      _customFinalStatusController.text = '';
                    });
                  } else if (val != null) {
                    setState(() {
                      _isCustomFinalStatus = false;
                      _finalStatus = val;
                    });
                  }
                },
              ),
              if (_isCustomFinalStatus) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _customFinalStatusController,
                        autofocus: true,
                        decoration: const InputDecoration(
                          hintText: 'Ketik status akhir lainnya...',
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () {
                        setState(() {
                          _isCustomFinalStatus = false;
                          _finalStatus = AmbulanceConstants.finalStatusOptions.first;
                        });
                      },
                    ),
                  ],
                ),
              ],
            ],
          ),
          const SizedBox(height: 16),

          // ================= SEKSI 3: INFORMASI PERJALANAN & WAKTU =================
          _buildSectionCard(
            title: '3. Informasi Perjalanan & Waktu',
            icon: Icons.route_rounded,
            children: [
              // Lokasi Tujuan
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Lokasi / Alamat Tujuan *',
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  if (_destinationLat != null && _destinationLng != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFD1FAE5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '📍 Terpilih di Peta',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF065F46),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _destinationController,
                      decoration: InputDecoration(
                        hintText: 'Nama RS / Alamat tujuan...',
                        suffixIcon: _destinationController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 16),
                                onPressed: () {
                                  setState(() {
                                    _destinationController.clear();
                                    _destinationLat = null;
                                    _destinationLng = null;
                                  });
                                },
                              )
                            : null,
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Wajib diisi' : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: AppTheme.primary),
                    onPressed: _openMapPicker,
                    tooltip: 'Pilih dari Map GPS',
                    icon: const Icon(Icons.map_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Waktu Mulai & Waktu Selesai
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Waktu Mulai *',
                            style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: () => _pickTime(isStart: true),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            height: 48,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.access_time_rounded, size: 16, color: AppTheme.primary),
                                const SizedBox(width: 8),
                                Text(
                                  '$_startTime WIB',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Waktu Selesai *',
                            style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 6),
                        InkWell(
                          onTap: () => _pickTime(isStart: false),
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            height: 48,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.access_time_rounded, size: 16, color: AppTheme.primary),
                                const SizedBox(width: 8),
                                Text(
                                  '$_endTime WIB',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Durasi & Jarak Tempuh
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Durasi',
                                style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                            Text('Otomatis',
                                style: GoogleFonts.plusJakartaSans(
                                    fontSize: 10, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 48,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.timer_outlined, size: 16, color: AppTheme.primary),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  _currentDuration.formatted,
                                  overflow: TextOverflow.ellipsis,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.primaryDark,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Jarak Tempuh (KM)',
                            style: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _distanceKmController,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: const InputDecoration(
                            hintText: '0.0',
                            suffixText: 'KM',
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ================= SEKSI 4: KETERANGAN TAMBAHAN =================
          _buildSectionCard(
            title: '4. Keterangan Tambahan',
            icon: Icons.notes_rounded,
            badge: (_activityType == 'Lainnya' ||
                    _initialStatus == 'Lainnya' ||
                    _finalStatus == 'Lainnya')
                ? 'Wajib diisi untuk opsi Lainnya'
                : null,
            isWarningBadge: true,
            children: [
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText:
                      'Catatan rincian perjalanan, alasan rujukan, lokasi penjemputan, atau keterangan jenis kegiatan lainnya...',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Tombol Lanjut ke Konfirmasi
          SizedBox(
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _proceedToPreview,
              icon: const Icon(Icons.arrow_forward_rounded),
              label: Text(
                'Lanjut & Periksa Data',
                style: GoogleFonts.plusJakartaSans(fontSize: 15, fontWeight: FontWeight.w800),
              ),
            ),
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  /// Tampilan Layar Konfirmasi & Preview (Identik dengan web modal preview)
  Widget _buildPreviewBody() {
    final effectiveInitialStatus = _isCustomInitialStatus
        ? _customInitialStatusController.text.trim()
        : _initialStatus;
    final effectiveFinalStatus = _isCustomFinalStatus
        ? _customFinalStatusController.text.trim()
        : _finalStatus;
    final dist = double.tryParse(_distanceKmController.text) ?? 0.0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Banner Konfirmasi
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline_rounded, color: AppTheme.primary, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pemeriksaan Akhir Data Ekspedisi',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Silakan periksa kembali rincian data di bawah ini sebelum disimpan ke logbook ambulans IGD.',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: AppTheme.primary,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 1. Informasi Kegiatan & Armada
        _buildPreviewCard(
          title: '1. Informasi Kegiatan & Armada',
          icon: Icons.assignment_rounded,
          items: [
            _buildPreviewItem('Tanggal Kegiatan', formatDateIndo(_date, true)),
            _buildPreviewItem('Jenis Kegiatan', _activityType),
            _buildPreviewItem('Ambulance yang Digunakan', '🚑 ${_selectedFleet ?? '-'}'),
            _buildPreviewItem('Driver Standby', '👤 ${_selectedDriver ?? '-'}'),
          ],
        ),
        const SizedBox(height: 14),

        // 2. Informasi Pasien & Status
        _buildPreviewCard(
          title: '2. Informasi Pasien & Status',
          icon: Icons.person_rounded,
          items: [
            _buildPreviewItem('Nama Pasien', _patientNameController.text.trim().isEmpty ? '-' : _patientNameController.text.trim()),
            _buildPreviewItem('No. Rekam Medis (RM)', _rmController.text.trim().isEmpty ? '-' : _rmController.text.trim()),
            _buildPreviewItem('Status Awal Pasien', effectiveInitialStatus.isEmpty ? '-' : effectiveInitialStatus),
            _buildPreviewItem('Status Akhir Pasien', effectiveFinalStatus.isEmpty ? '-' : effectiveFinalStatus),
          ],
        ),
        const SizedBox(height: 14),

        // 3. Informasi Waktu & Perjalanan
        _buildPreviewCard(
          title: '3. Informasi Waktu & Perjalanan',
          icon: Icons.route_rounded,
          items: [
            _buildPreviewItem('Waktu Operasional', '$_startTime - $_endTime WIB'),
            _buildPreviewItem('Durasi Perjalanan', '⏱️ ${_currentDuration.formatted}'),
            _buildPreviewItem('Jarak Tempuh', '🚗 $dist KM'),
            _buildPreviewItem('Lokasi / Alamat Tujuan', '📍 ${_destinationController.text.trim().isEmpty ? '-' : _destinationController.text.trim()}'),
          ],
        ),
        const SizedBox(height: 14),

        // 4. Keterangan / Catatan Tambahan
        _buildPreviewCard(
          title: '4. Keterangan / Catatan Tambahan',
          icon: Icons.notes_rounded,
          items: [
            _buildPreviewItem(
              'Catatan Tambahan',
              _notesController.text.trim().isEmpty ? 'Tidak ada catatan tambahan' : _notesController.text.trim(),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Tombol Aksi Konfirmasi
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: _isSubmitting ? null : () => setState(() => _showPreview = false),
                  icon: const Icon(Icons.edit_note_rounded),
                  label: Text(
                    'Kembali & Ubah',
                    style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                  ),
                  onPressed: _isSubmitting ? null : _finalSubmit,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Icon(Icons.check_circle_rounded),
                  label: Text(
                    _isSubmitting ? 'Menyimpan...' : 'Konfirmasi & Simpan',
                    style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 30),
      ],
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    String? badge,
    bool isWarningBadge = false,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppTheme.primary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: isWarningBadge ? const Color(0xFFFEF3C7) : const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badge,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: isWarningBadge ? const Color(0xFF92400E) : AppTheme.primary,
                    ),
                  ),
                ),
            ],
          ),
          const Divider(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildPreviewCard({
    required String title,
    required IconData icon,
    required List<Widget> items,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppTheme.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const Divider(height: 18),
          ...items,
        ],
      ),
    );
  }

  Widget _buildPreviewItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(
              label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                color: AppTheme.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                color: AppTheme.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
