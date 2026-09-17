export type AmbulanceActivityType =
  | 'Jemput Pasien'
  | 'Merujuk Pasien'
  | 'Antar Pasien Pulang'
  | 'Ambil Darah'
  | 'Kegiatan Marketing'
  | 'Jual / Beli Obat'
  | 'Kirim / Ambil Sampel'
  | 'Home Visit'
  | 'Lainnya';

export type InitialStatus =
  | 'Rumah Pasien'
  | 'RS Lain'
  | 'IGD'
  | 'Rawat Inap'
  | 'Laboratorium'
  | 'PMI / Bank Darah'
  | 'Lainnya';

export type FinalStatus =
  | 'Rawat Inap'
  | 'Dirujuk'
  | 'Rawat Jalan'
  | 'Meninggal'
  | 'Rumah Pasien'
  | 'Laboratorium'
  | 'PMI / Bank Darah'
  | 'Lainnya';

export type AmbulanceFleetType = 'EVALIA' | 'BSI' | 'PHC' | string;
export type AmbulanceFleetStatus = 'Aktif' | 'Perbaikan' | 'Nonaktif';

export interface AmbulanceFleet {
  id: string;
  name: string;
  plateNumber?: string;
  status?: AmbulanceFleetStatus;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type AmbulanceDriverStatus = 'Aktif' | 'Cuti' | 'Nonaktif';

export interface AmbulanceDriver {
  id: string;
  name: string;
  phone?: string;
  status?: AmbulanceDriverStatus;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface HospitalBaseLocation {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface AmbulanceExpedition {
  id: string;
  expeditionNumber: string;
  date: string; // YYYY-MM-DD
  activityType: AmbulanceActivityType;
  patientName?: string;
  medicalRecordNumber?: string;
  initialStatus?: InitialStatus | string;
  finalStatus?: FinalStatus | string;
  ambulance: AmbulanceFleetType;
  driver: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  durationMinutes: number;
  durationFormatted: string;
  distanceKm: number;
  destination?: string;
  destinationLat?: number;
  destinationLng?: number;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
}

export type AmbulanceExpeditionFormData = Omit<
  AmbulanceExpedition,
  'id' | 'expeditionNumber' | 'createdAt' | 'updatedAt'
>;

export interface AmbulanceFilterState {
  searchQuery: string;
  datePreset: 'all' | 'today' | 'this_week' | 'this_month' | 'custom';
  startDate: string;
  endDate: string;
  activityType: string;
  ambulance: string;
  driver: string;
}

export interface AmbulanceLiveLocation {
  id: string; // unit nama armada, misal: EVALIA, BSI, PHC
  ambulance: string;
  driver?: string;
  lat: number;
  lng: number;
  speed?: number; // km/h
  heading?: number; // degrees
  accuracy?: number; // meters
  isMoving?: boolean;
  status?: 'Online' | 'Offline' | 'Bergerak' | 'Standby';
  updatedAt?: any;
  batteryLevel?: number;
  deviceInfo?: string;
}

