import { AmbulanceActivityType, InitialStatus, FinalStatus, AmbulanceFleetType } from '../types/ambulance';

export const ACTIVITY_TYPES: AmbulanceActivityType[] = [
  'Jemput Pasien',
  'Merujuk Pasien',
  'Antar Pasien Pulang',
  'Ambil Darah',
  'Kegiatan Marketing',
  'Jual / Beli Obat',
  'Kirim / Ambil Sampel',
  'Home Visit',
  'Lainnya'
];

/**
 * Aktivitas yang mewajibkan input identitas pasien
 */
export const PATIENT_REQUIRED_ACTIVITIES: AmbulanceActivityType[] = [
  'Jemput Pasien',
  'Merujuk Pasien',
  'Antar Pasien Pulang'
];

/**
 * Aktivitas yang relevan menggunakan status awal & status akhir
 */
export const STATUS_APPLICABLE_ACTIVITIES: AmbulanceActivityType[] = [
  'Jemput Pasien',
  'Merujuk Pasien',
  'Antar Pasien Pulang'
];

export const INITIAL_STATUS_OPTIONS: InitialStatus[] = [
  'Rumah Pasien',
  'RS Lain',
];

export const FINAL_STATUS_OPTIONS: FinalStatus[] = [
  'Rawat Inap',
  'Dirujuk',
  'Rawat Jalan',
  'Meninggal',
];

export const AMBULANCE_FLEET_OPTIONS: AmbulanceFleetType[] = [
  'EVALIA',
  'BSI',
  'PHC'
];

export const AMBULANCE_COLLECTION = 'ambulance_expeditions';
export const DRIVERS_COLLECTION = 'ambulance_drivers';

export const DEFAULT_DRIVERS: string[] = [
  'Acun',
  'Aldy',
  'Azis',
  'Johari',
  'Edy'
];

export const SETTINGS_COLLECTION = 'settings';
export const AMBULANCE_CONFIG_DOC = 'ambulance_config';
export const DEFAULT_AMBULANCE_PIN = '123456';

