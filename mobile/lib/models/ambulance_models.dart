import 'package:cloud_firestore/cloud_firestore.dart';

/// Model Lokasi Pangkalan Rumah Sakit
class HospitalBaseLocation {
  final String name;
  final String address;
  final double lat;
  final double lng;

  HospitalBaseLocation({
    required this.name,
    required this.address,
    required this.lat,
    required this.lng,
  });

  factory HospitalBaseLocation.fromMap(Map<String, dynamic> map) {
    return HospitalBaseLocation(
      name: map['name'] ?? 'Primaya Hospital',
      address: map['address'] ?? '',
      lat: (map['lat'] as num?)?.toDouble() ?? -6.241584,
      lng: (map['lng'] as num?)?.toDouble() ?? 106.992416,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'address': address,
      'lat': lat,
      'lng': lng,
    };
  }

  static HospitalBaseLocation defaultLocation() {
    return HospitalBaseLocation(
      name: 'Primaya Hospital',
      address: 'Jl. H. Noer Ali No.Kav. 17-18, RT.001/RW.023, Kayuringin Jaya, Bekasi',
      lat: -6.241584,
      lng: 106.992416,
    );
  }
}

/// Model Ekspedisi Perjalanan Ambulans
class AmbulanceExpedition {
  final String id;
  final String expeditionNumber;
  final String date;
  final String startTime;
  final String endTime;
  final int odometerStart;
  final int odometerEnd;
  final int distanceKm;
  final String activityType;
  final String driver;
  final String ambulance;
  final String? patientName;
  final String? medicalRecordNumber;
  final String? initialStatus;
  final String? finalStatus;
  final String destination;
  final double? destinationLat;
  final double? destinationLng;
  final String? notes;
  final int? fuelCost;
  final int? tollCost;
  final DateTime? createdAt;

  AmbulanceExpedition({
    required this.id,
    required this.expeditionNumber,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.odometerStart,
    required this.odometerEnd,
    required this.distanceKm,
    required this.activityType,
    required this.driver,
    required this.ambulance,
    this.patientName,
    this.medicalRecordNumber,
    this.initialStatus,
    this.finalStatus,
    required this.destination,
    this.destinationLat,
    this.destinationLng,
    this.notes,
    this.fuelCost,
    this.tollCost,
    this.createdAt,
  });

  factory AmbulanceExpedition.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    DateTime? created;
    if (data['createdAt'] is Timestamp) {
      created = (data['createdAt'] as Timestamp).toDate();
    }

    return AmbulanceExpedition(
      id: doc.id,
      expeditionNumber: data['expeditionNumber'] ?? '',
      date: data['date'] ?? '',
      startTime: data['startTime'] ?? '',
      endTime: data['endTime'] ?? '',
      odometerStart: (data['odometerStart'] as num?)?.toInt() ?? 0,
      odometerEnd: (data['odometerEnd'] as num?)?.toInt() ?? 0,
      distanceKm: (data['distanceKm'] as num?)?.toInt() ?? 0,
      activityType: data['activityType'] ?? 'Rujukan',
      driver: data['driver'] ?? '',
      ambulance: data['ambulance'] ?? '',
      patientName: data['patientName'],
      medicalRecordNumber: data['medicalRecordNumber'],
      initialStatus: data['initialStatus'],
      finalStatus: data['finalStatus'],
      destination: data['destination'] ?? '',
      destinationLat: (data['destinationLat'] as num?)?.toDouble(),
      destinationLng: (data['destinationLng'] as num?)?.toDouble(),
      notes: data['notes'],
      fuelCost: (data['fuelCost'] as num?)?.toInt(),
      tollCost: (data['tollCost'] as num?)?.toInt(),
      createdAt: created,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'expeditionNumber': expeditionNumber,
      'date': date,
      'startTime': startTime,
      'endTime': endTime,
      'odometerStart': odometerStart,
      'odometerEnd': odometerEnd,
      'distanceKm': distanceKm,
      'activityType': activityType,
      'driver': driver,
      'ambulance': ambulance,
      'patientName': patientName,
      'medicalRecordNumber': medicalRecordNumber,
      'initialStatus': initialStatus,
      'finalStatus': finalStatus,
      'destination': destination,
      'destinationLat': destinationLat,
      'destinationLng': destinationLng,
      'notes': notes,
      'fuelCost': fuelCost,
      'tollCost': tollCost,
      'updatedAt': FieldValue.serverTimestamp(),
    };
  }
}
