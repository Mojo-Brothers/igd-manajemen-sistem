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

/// Model Ekspedisi Perjalanan Ambulans (Identik dengan Webview AmbulanceExpedition)
class AmbulanceExpedition {
  final String id;
  final String expeditionNumber;
  final String date;
  final String startTime;
  final String endTime;
  final int durationMinutes;
  final String durationFormatted;
  final double distanceKm;
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
  final int? odometerStart;
  final int? odometerEnd;
  final int? fuelCost;
  final int? tollCost;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? createdByName;

  AmbulanceExpedition({
    required this.id,
    required this.expeditionNumber,
    required this.date,
    required this.startTime,
    required this.endTime,
    this.durationMinutes = 0,
    this.durationFormatted = '-',
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
    this.odometerStart,
    this.odometerEnd,
    this.fuelCost,
    this.tollCost,
    this.createdAt,
    this.updatedAt,
    this.createdByName,
  });

  factory AmbulanceExpedition.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    DateTime? created;
    if (data['createdAt'] is Timestamp) {
      created = (data['createdAt'] as Timestamp).toDate();
    }
    DateTime? updated;
    if (data['updatedAt'] is Timestamp) {
      updated = (data['updatedAt'] as Timestamp).toDate();
    }

    return AmbulanceExpedition(
      id: doc.id,
      expeditionNumber: data['expeditionNumber'] ?? '',
      date: data['date'] ?? '',
      startTime: data['startTime'] ?? '',
      endTime: data['endTime'] ?? '',
      durationMinutes: (data['durationMinutes'] as num?)?.toInt() ?? 0,
      durationFormatted: data['durationFormatted'] ?? '-',
      distanceKm: (data['distanceKm'] as num?)?.toDouble() ?? 0.0,
      activityType: data['activityType'] ?? 'Jemput Pasien',
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
      odometerStart: (data['odometerStart'] as num?)?.toInt(),
      odometerEnd: (data['odometerEnd'] as num?)?.toInt(),
      fuelCost: (data['fuelCost'] as num?)?.toInt(),
      tollCost: (data['tollCost'] as num?)?.toInt(),
      createdAt: created,
      updatedAt: updated,
      createdByName: data['createdByName'],
    );
  }

  Map<String, dynamic> toFirestore() {
    final map = <String, dynamic>{
      'expeditionNumber': expeditionNumber,
      'date': date,
      'startTime': startTime,
      'endTime': endTime,
      'durationMinutes': durationMinutes,
      'durationFormatted': durationFormatted,
      'distanceKm': distanceKm,
      'activityType': activityType,
      'driver': driver,
      'ambulance': ambulance,
      'destination': destination,
      'updatedAt': FieldValue.serverTimestamp(),
    };

    if (patientName != null && patientName!.isNotEmpty) {
      map['patientName'] = patientName;
    }
    if (medicalRecordNumber != null && medicalRecordNumber!.isNotEmpty) {
      map['medicalRecordNumber'] = medicalRecordNumber;
    }
    if (initialStatus != null && initialStatus!.isNotEmpty) {
      map['initialStatus'] = initialStatus;
    }
    if (finalStatus != null && finalStatus!.isNotEmpty) {
      map['finalStatus'] = finalStatus;
    }
    if (destinationLat != null) {
      map['destinationLat'] = destinationLat;
    }
    if (destinationLng != null) {
      map['destinationLng'] = destinationLng;
    }
    if (notes != null && notes!.isNotEmpty) {
      map['notes'] = notes;
    }
    if (createdByName != null && createdByName!.isNotEmpty) {
      map['createdByName'] = createdByName;
    }

    return map;
  }
}
