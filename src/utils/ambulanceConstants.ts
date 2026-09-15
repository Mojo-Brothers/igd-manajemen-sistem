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
 * Aktivitas yang relevan menggunakan status awal & status akhir.
 * Mendukung seluruh jenis kegiatan agar petugas dapat mencatat status awal & akhir kapan saja.
 */
export const STATUS_APPLICABLE_ACTIVITIES: AmbulanceActivityType[] = [
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

export const INITIAL_STATUS_OPTIONS: InitialStatus[] = [
  'Rumah Pasien',
  'RS Lain',
  'IGD',
  'Rawat Inap',
  'Laboratorium',
  'PMI / Bank Darah',
];

export const FINAL_STATUS_OPTIONS: FinalStatus[] = [
  'Rawat Inap',
  'Dirujuk',
  'Rawat Jalan',
  'Meninggal',
  'Rumah Pasien',
  'Laboratorium',
  'PMI / Bank Darah',
];

export const AMBULANCE_FLEET_OPTIONS: AmbulanceFleetType[] = [
  'EVALIA',
  'BSI',
  'PHC'
];

export const DEFAULT_AMBULANCE_FLEETS: string[] = [
  'EVALIA',
  'BSI',
  'PHC'
];

export const AMBULANCE_COLLECTION = 'ambulance_expeditions';
export const DRIVERS_COLLECTION = 'ambulance_drivers';
export const FLEETS_COLLECTION = 'ambulance_fleets';

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

/**
 * Koordinat Pangkalan Asal (Primaya Hospital)
 * Digunakan sebagai titik awal kalkulasi estimasi jarak (KM)
 */
export const HOSPITAL_BASE_COORDS = {
  name: 'Primaya Hospital',
  lat: -6.241584,
  lng: 106.992416,
};

/**
 * Daftar shortcut lokasi tujuan rujukan populer
 */
export const POPULAR_DESTINATIONS = [
  { name: 'RSUD dr. Chasbullah Abdulmadjid', lat: -6.2425, lng: 106.9995 },
  { name: 'RS Mitra Keluarga Bekasi Barat', lat: -6.2378, lng: 106.9856 },
  { name: 'RS Siloam Bekasi Timur', lat: -6.2577, lng: 107.0182 },
  { name: 'RS Hermina Bekasi', lat: -6.2361, lng: 106.9897 },
  { name: 'RS Ananda Bekasi', lat: -6.2238, lng: 106.9782 },
  { name: 'RS Bella Bekasi', lat: -6.2444, lng: 107.0125 },
];

