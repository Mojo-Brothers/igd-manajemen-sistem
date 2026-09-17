import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../models/ambulance_models.dart';
import '../services/firestore_service.dart';
import '../services/location_tracking_service.dart';
import '../theme/app_theme.dart';
import '../utils/ambulance_utils.dart';
import '../widgets/metric_card.dart';
import '../widgets/status_badge.dart';
import 'expedition_form_screen.dart';
import 'pin_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  HospitalBaseLocation _baseLocation = HospitalBaseLocation.defaultLocation();

  @override
  void initState() {
    super.initState();
    // Memulai pelacakan lokasi GPS di latar belakang (tanpa tampilan di frontend)
    LocationTrackingService.startTracking();
  }

  @override
  Widget build(BuildContext context) {
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.airport_shuttle_rounded, color: Colors.white, size: 24),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ambulans Primaya',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Workstation Driver IGD',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Colors.white.withOpacity(0.85),
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.lock_outline_rounded),
            tooltip: 'Kunci Aplikasi',
            onPressed: () {
              LocationTrackingService.stopTracking();
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(builder: (_) => const PinScreen()),
              );
            },
          ),
        ],
      ),

      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.accent,
        foregroundColor: Colors.white,
        elevation: 3,
        onPressed: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => ExpeditionFormScreen(baseLocation: _baseLocation),
            ),
          );
        },
        icon: const Icon(Icons.add_rounded),
        label: Text(
          'Catat Perjalanan',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800),
        ),
      ),
      body: StreamBuilder<HospitalBaseLocation>(
        stream: FirestoreService.getBaseLocationStream(),
        builder: (context, baseSnapshot) {
          if (baseSnapshot.hasData) {
            _baseLocation = baseSnapshot.data!;
          }

          return StreamBuilder<List<AmbulanceExpedition>>(
            stream: FirestoreService.getExpeditionsStream(),
            builder: (context, expSnapshot) {
              final expeditions = expSnapshot.data ?? [];
              final todayExpeditions = expeditions.where((e) => e.date == todayStr).toList();
              final double todayKm = todayExpeditions.fold(0.0, (sum, item) => sum + item.distanceKm);

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Banner Pangkalan Rumah Sakit
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFEFF6FF), Color(0xFFEEF2FF)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.local_hospital_rounded, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'PANGKALAN INDUK AMBULANS',
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: AppTheme.primaryDark,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDBEAFE),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      'Sync Admin',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                _baseLocation.name,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                              if (_baseLocation.address.isNotEmpty)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2),
                                  child: Text(
                                    _baseLocation.address,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontSize: 11,
                                      color: AppTheme.textSecondary,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Metric Cards Row
                  Row(
                    children: [
                      Expanded(
                        child: MetricCard(
                          title: 'TRIP HARI INI',
                          value: '${todayExpeditions.length}',
                          subtitle: 'Perjalanan Selesai',
                          icon: Icons.alt_route_rounded,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: MetricCard(
                          title: 'TOTAL JARAK',
                          value: '${todayKm.toStringAsFixed(todayKm.truncateToDouble() == todayKm ? 0 : 1)} KM',
                          subtitle: 'Jarak Terakumulasi',
                          icon: Icons.speed_rounded,
                          color: AppTheme.accent,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Section Title
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Riwayat Log Perjalanan (${expeditions.length})',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      if (expSnapshot.connectionState == ConnectionState.waiting)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  if (expeditions.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      alignment: Alignment.center,
                      child: Column(
                        children: [
                          Icon(Icons.departure_board_rounded, size: 48, color: Colors.grey.shade300),
                          const SizedBox(height: 12),
                          Text(
                            'Belum ada log perjalanan tercatat',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppTheme.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: expeditions.length,
                      itemBuilder: (context, index) {
                        final item = expeditions[index];
                        return _buildExpeditionCard(item);
                      },
                    ),

                  const SizedBox(height: 80), // Padding untuk FAB
                ],
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildExpeditionCard(AmbulanceExpedition item) {
    final distStr = item.distanceKm.toStringAsFixed(item.distanceKm.truncateToDouble() == item.distanceKm ? 0 : 1);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  item.expeditionNumber,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              StatusBadge(label: item.activityType, type: 'activity'),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            item.destination,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.person_outline_rounded, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: 4),
              Text(
                item.driver,
                style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppTheme.textSecondary),
              ),
              const SizedBox(width: 14),
              const Icon(Icons.directions_car_filled_outlined, size: 14, color: AppTheme.textSecondary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  item.ambulance,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ),
            ],
          ),
          const Divider(height: 20, color: AppTheme.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${formatDateIndo(item.date)} • ${item.startTime} - ${item.endTime}',
                style: GoogleFonts.plusJakartaSans(fontSize: 11, color: AppTheme.textSecondary),
              ),
              Row(
                children: [
                  if (item.durationFormatted != '-' && item.durationFormatted.isNotEmpty) ...[
                    Text(
                      '⏱️ ${item.durationFormatted}',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Text(
                    '🚗 $distStr KM',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.accent,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
