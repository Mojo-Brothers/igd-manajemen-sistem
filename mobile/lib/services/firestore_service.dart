import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/ambulance_models.dart';

class FirestoreService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;

  static const String expeditionsCollection = 'ambulance_expeditions';
  static const String driversCollection = 'ambulance_drivers';
  static const String fleetsCollection = 'ambulance_fleets';
  static const String settingsCollection = 'settings';
  static const String ambulanceConfigDoc = 'ambulance_config';

  static const List<String> defaultDrivers = [
    'Acun',
    'Aldy',
    'Azis',
    'Johari',
    'Edy',
  ];

  static const List<String> defaultFleets = [
    'EVALIA',
    'BSI',
    'PHC',
  ];

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

  /// Stream daftar driver ambulans aktif (Sinkron dengan web)
  static Stream<List<String>> getDriversStream() {
    return _db.collection(driversCollection).snapshots().map((snapshot) {
      final set = <String>{...defaultDrivers};
      for (final doc in snapshot.docs) {
        final name = doc.data()['name']?.toString().trim();
        if (name != null && name.isNotEmpty) {
          set.add(name);
        }
      }
      final list = set.toList();
      list.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
      return list;
    });
  }

  /// Stream daftar armada ambulans aktif (Sinkron dengan web)
  static Stream<List<String>> getFleetsStream() {
    return _db.collection(fleetsCollection).snapshots().map((snapshot) {
      final set = <String>{...defaultFleets};
      for (final doc in snapshot.docs) {
        final name = doc.data()['name']?.toString().trim().toUpperCase();
        if (name != null && name.isNotEmpty) {
          set.add(name);
        }
      }
      final list = set.toList();
      list.sort();
      return list;
    });
  }

  /// Menambahkan driver baru ke koleksi ambulance_drivers
  static Future<void> addDriver(String name) async {
    final cleanName = name.trim();
    if (cleanName.isEmpty) return;

    final query = await _db
        .collection(driversCollection)
        .where('name', isEqualTo: cleanName)
        .get();

    if (query.docs.isEmpty) {
      await _db.collection(driversCollection).add({
        'name': cleanName,
        'phone': '',
        'status': 'Aktif',
        'notes': 'Driver Standby IGD (Mobile App)',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
  }

  /// Menambahkan armada ambulans baru ke koleksi ambulance_fleets
  static Future<void> addFleet(String name) async {
    final cleanName = name.trim().toUpperCase();
    if (cleanName.isEmpty) return;

    final query = await _db
        .collection(fleetsCollection)
        .where('name', isEqualTo: cleanName)
        .get();

    if (query.docs.isEmpty) {
      await _db.collection(fleetsCollection).add({
        'name': cleanName,
        'plateNumber': '',
        'status': 'Aktif',
        'notes': 'Ditambahkan via Mobile App',
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }
  }

  /// Validasi PIN 6-digit dengan yang tersimpan di Firestore
  static Future<bool> verifyPin(String inputPin) async {
    try {
      final docSnap = await _db
          .collection(settingsCollection)
          .doc(ambulanceConfigDoc)
          .get();
      if (docSnap.exists) {
        final data = docSnap.data();
        final serverPin = data?['ambulancePin'] ?? data?['pin'];
        if (serverPin != null) {
          return inputPin.trim() == serverPin.toString().trim();
        }
      }
    } catch (e) {
      // ignore
    }
    // Fallback default PIN
    return inputPin.trim() == '123456';
  }

  /// Generate nomor ekspedisi unik berikutnya (Format identik dengan webview: AMB-YYYYMMDD-XXX)
  static Future<String> generateNextExpeditionNumber(String dateStr) async {
    final cleanDate = dateStr.replaceAll('-', '');
    final prefix = 'AMB-$cleanDate-';

    try {
      final query = await _db
          .collection(expeditionsCollection)
          .where('date', isEqualTo: dateStr)
          .get();

      int maxSeq = 0;
      for (final doc in query.docs) {
        final expNum = doc.data()['expeditionNumber']?.toString() ?? '';
        if (expNum.startsWith(prefix)) {
          final seqStr = expNum.replaceFirst(prefix, '');
          final seq = int.tryParse(seqStr);
          if (seq != null && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }

      final nextSeq = (maxSeq + 1).toString().padLeft(3, '0');
      return '$prefix$nextSeq';
    } catch (e) {
      final seq = (DateTime.now().millisecondsSinceEpoch % 900 + 100).toString();
      return '$prefix$seq';
    }
  }

  /// Simpan ekspedisi baru ke Firestore
  static Future<void> createExpedition(Map<String, dynamic> data) async {
    // Bersihkan nilai null
    final cleanData = <String, dynamic>{};
    data.forEach((key, value) {
      if (value != null) {
        cleanData[key] = value;
      }
    });

    await _db.collection(expeditionsCollection).add({
      ...cleanData,
      'createdByName': cleanData['createdByName'] ?? 'Driver Mobile',
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
