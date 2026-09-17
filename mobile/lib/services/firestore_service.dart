import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ambulance_models.dart';

class FirestoreService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  static const String expeditionsCollection = 'ambulance_expeditions';
  static const String driversCollection = 'ambulance_drivers';
  static const String fleetsCollection = 'ambulance_fleets';
  static const String settingsCollection = 'settings';
  static const String ambulanceConfigDoc = 'ambulance_config';

  /// Stream daftar ekspedisi ambulans real-time
  static Stream<List<AmbulanceExpedition>> getExpeditionsStream() {
    return _db
        .collection(expeditionsCollection)
        .orderBy('date', descending: true)
        .limit(50)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => AmbulanceExpedition.fromFirestore(doc))
            .toList());
  }

  /// Stream lokasi pangkalan aktif (yang diatur admin di web)
  static Stream<HospitalBaseLocation> getBaseLocationStream() {
    return _db
        .collection(settingsCollection)
        .doc(ambulanceConfigDoc)
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists && snapshot.data()?['baseLocation'] != null) {
        return HospitalBaseLocation.fromMap(
          Map<String, dynamic>.from(snapshot.data()!['baseLocation']),
        );
      }
      return HospitalBaseLocation.defaultLocation();
    });
  }

  /// Stream daftar driver ambulans aktif
  static Stream<List<String>> getDriversStream() {
    return _db.collection(driversCollection).snapshots().map((snapshot) {
      if (snapshot.docs.isEmpty) {
        return ['Acun', 'Aldy', 'Azis', 'Johari', 'Edy'];
      }
      final list = snapshot.docs
          .map((doc) => doc.data()['name']?.toString() ?? '')
          .where((name) => name.isNotEmpty)
          .toList();
      list.sort();
      return list;
    });
  }

  /// Stream daftar armada ambulans aktif
  static Stream<List<String>> getFleetsStream() {
    return _db.collection(fleetsCollection).snapshots().map((snapshot) {
      if (snapshot.docs.isEmpty) {
        return [
          'Ambulance 1 (B 1234 PYA)',
          'Ambulance 2 (B 5678 PYA)',
          'Ambulance Jenazah'
        ];
      }
      final list = snapshot.docs
          .map((doc) => doc.data()['name']?.toString() ?? '')
          .where((name) => name.isNotEmpty)
          .toList();
      list.sort();
      return list;
    });
  }

  /// Validasi PIN 6-digit dengan yang tersimpan di Firestore
  static Future<bool> verifyPin(String inputPin) async {
    try {
      final docSnap = await _db
          .collection(settingsCollection)
          .doc(ambulanceConfigDoc)
          .get();
      if (docSnap.exists && docSnap.data()?['pin'] != null) {
        final serverPin = docSnap.data()!['pin'].toString().trim();
        return inputPin.trim() == serverPin;
      }
    } catch (e) {
      // ignore
    }
    // Fallback default PIN
    return inputPin.trim() == '123456';
  }

  /// Generate nomor ekspedisi berikutnya (Format: EXP-YYYYMMDD-001)
  static Future<String> generateNextExpeditionNumber(String dateStr) async {
    try {
      final query = await _db
          .collection(expeditionsCollection)
          .where('date', isEqualTo: dateStr)
          .get();
      final count = query.docs.length + 1;
      final cleanDate = dateStr.replaceAll('-', '');
      final sequence = count.toString().padLeft(3, '0');
      return 'EXP-$cleanDate-$sequence';
    } catch (e) {
      final cleanDate = dateStr.replaceAll('-', '');
      return 'EXP-$cleanDate-${DateTime.now().millisecondsSinceEpoch % 1000}';
    }
  }

  /// Simpan ekspedisi baru
  static Future<void> createExpedition(Map<String, dynamic> data) async {
    await _db.collection(expeditionsCollection).add({
      ...data,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
