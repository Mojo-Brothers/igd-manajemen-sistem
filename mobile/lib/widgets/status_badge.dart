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

    final lower = label.toLowerCase();
    if (lower.contains('kritis') || lower.contains('darurat')) {
      bg = const Color(0xFFFEE2E2);
      fg = const Color(0xFFDC2626);
    } else if (lower.contains('stabil') || lower.contains('membaik') || lower.contains('selesai')) {
      bg = const Color(0xFFD1FAE5);
      fg = const Color(0xFF059669);
    } else if (lower.contains('rujukan') || lower.contains('jemput')) {
      bg = const Color(0xFFDBEAFE);
      fg = const Color(0xFF1D4ED8);
    } else if (lower.contains('medevac') || lower.contains('standby')) {
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFFD97706);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
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
