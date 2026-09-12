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
  | 'Lainnya';

export type FinalStatus =
  | 'Rawat Inap'
  | 'Dirujuk'
  | 'Rawat Jalan'
  | 'Meninggal'
  | 'Lainnya';

export type AmbulanceFleetType = 'EVALIA' | 'BSI' | 'PHC' | string;

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
