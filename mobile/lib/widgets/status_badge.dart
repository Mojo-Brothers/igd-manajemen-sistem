import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final String? type; // 'activity' | 'status'

  const StatusBadge({
    super.key,
    required this.label,
    this.type = 'status',
  });

  @override
  Widget build(BuildContext context) {
    Color bg = const Color(0xFFF1F5F9);
    Color fg = const Color(0xFF475569);
    Color border = const Color(0xFFCBD5E1);

    final lower = label.toLowerCase();

    if (type == 'activity') {
      if (lower.contains('jemput')) {
        bg = const Color(0xFFECFDF5);
        fg = const Color(0xFF047857);
        border = const Color(0xFFA7F3D0);
      } else if (lower.contains('rujuk')) {
        bg = const Color(0xFFFFFBEB);
        fg = const Color(0xFF92400E);
        border = const Color(0xFFFDE68A);
      } else if (lower.contains('pulang')) {
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1D4ED8);
        border = const Color(0xFFBFDBFE);
      } else if (lower.contains('darah')) {
        bg = const Color(0xFFFFF1F2);
        fg = const Color(0xFFBE123C);
        border = const Color(0xFFFECDD3);
      } else if (lower.contains('marketing')) {
        bg = const Color(0xFFFAF5FF);
        fg = const Color(0xFF7E22CE);
        border = const Color(0xFFE9D5FF);
      } else if (lower.contains('obat')) {
        bg = const Color(0xFFF0FDFA);
        fg = const Color(0xFF0F766E);
        border = const Color(0xFF99F6E4);
      } else if (lower.contains('sampel')) {
        bg = const Color(0xFFEEF2FF);
        fg = const Color(0xFF4338CA);
        border = const Color(0xFFC7D2FE);
      } else if (lower.contains('home visit')) {
        bg = const Color(0xFFECFEFF);
        fg = const Color(0xFF0E7490);
        border = const Color(0xFFA5F3FC);
      } else {
        bg = const Color(0xFFF8FAFC);
        fg = const Color(0xFF475569);
        border = const Color(0xFFE2E8F0);
      }
    } else {
      if (lower.contains('kritis') || lower.contains('darurat') || lower.contains('meninggal')) {
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFDC2626);
        border = const Color(0xFFFECACA);
      } else if (lower.contains('stabil') || lower.contains('membaik') || lower.contains('selesai')) {
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF059669);
        border = const Color(0xFFA7F3D0);
      } else if (lower.contains('rawat inap') || lower.contains('igd')) {
        bg = const Color(0xFFEFF6FF);
        fg = const Color(0xFF1D4ED8);
        border = const Color(0xFFBFDBFE);
      } else if (lower.contains('rumah pasien') || lower.contains('rawat jalan')) {
        bg = const Color(0xFFF0FDF4);
        fg = const Color(0xFF15803D);
        border = const Color(0xFFBBF7D0);
      }
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Text(
        label,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}
