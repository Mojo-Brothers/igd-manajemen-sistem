/// Utilitas & Konstanta Ekspedisi Ambulans (100% Selaras dengan Versi Web)

class AmbulanceConstants {
  static const List<String> activityTypes = [
    'Jemput Pasien',
    'Merujuk Pasien',
    'Antar Pasien Pulang',
    'Ambil Darah',
    'Kegiatan Marketing',
    'Jual / Beli Obat',
    'Kirim / Ambil Sampel',
    'Home Visit',
    'Lainnya',
  ];

  static const List<String> patientRequiredActivities = [
    'Jemput Pasien',
    'Merujuk Pasien',
    'Antar Pasien Pulang',
  ];

  static const List<String> initialStatusOptions = [
    'Rumah Pasien',
    'RS Lain',
    'IGD',
    'Rawat Inap',
    'Laboratorium',
    'PMI / Bank Darah',
  ];

  static const List<String> finalStatusOptions = [
    'Rawat Inap',
    'Dirujuk',
    'Rawat Jalan',
    'Meninggal',
    'Rumah Pasien',
    'Laboratorium',
    'PMI / Bank Darah',
  ];
}

class DurationResult {
  final int minutes;
  final String formatted;

  const DurationResult({required this.minutes, required this.formatted});
}

/// Menghitung durasi perjalanan ambulans antara waktu mulai dan selesai.
/// Mendukung perjalanan melewati tengah malam (overnight).
DurationResult calculateDuration(String startTime, String endTime, [String? baseDate]) {
  if (startTime.isEmpty || endTime.isEmpty) {
    return const DurationResult(minutes: 0, formatted: '-');
  }

  final startParts = startTime.split(':').map(int.tryParse).toList();
  final endParts = endTime.split(':').map(int.tryParse).toList();

  if (startParts.length < 2 || endParts.length < 2 ||
      startParts[0] == null || startParts[1] == null ||
      endParts[0] == null || endParts[1] == null) {
    return const DurationResult(minutes: 0, formatted: '-');
  }

  DateTime base = DateTime.now();
  if (baseDate != null && baseDate.isNotEmpty) {
    base = DateTime.tryParse(baseDate) ?? DateTime.now();
  }

  final startHour = startParts[0]!;
  final startMin = startParts[1]!;
  final endHour = endParts[0]!;
  final endMin = endParts[1]!;

  DateTime startDate = DateTime(base.year, base.month, base.day, startHour, startMin);
  DateTime endDate = DateTime(base.year, base.month, base.day, endHour, endMin);

  if (endDate.isBefore(startDate)) {
    endDate = endDate.add(const Duration(days: 1));
  }

  final totalMinutes = endDate.difference(startDate).inMinutes;
  final hours = totalMinutes ~/ 60;
  final minutes = totalMinutes % 60;

  String formatted;
  if (hours > 0 && minutes > 0) {
    formatted = '$hours Jam $minutes Menit';
  } else if (hours > 0) {
    formatted = '$hours Jam';
  } else if (minutes > 0) {
    formatted = '$minutes Menit';
  } else {
    formatted = '0 Menit';
  }

  return DurationResult(minutes: totalMinutes, formatted: formatted);
}

/// Format tanggal YYYY-MM-DD ke format Indonesia (e.g. "17 Sep 2026" atau "17 September 2026")
String formatDateIndo(String dateStr, [bool longFormat = false]) {
  if (dateStr.isEmpty) return '-';
  try {
    final dt = DateTime.parse(dateStr);
    const monthsShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthsLong = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    final monthName = longFormat ? monthsLong[dt.month - 1] : monthsShort[dt.month - 1];
    return '${dt.day} $monthName ${dt.year}';
  } catch (e) {
    return dateStr;
  }
}
