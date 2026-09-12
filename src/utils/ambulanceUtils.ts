/**
 * Utility functions for Ambulance Expedition Module
 */

export interface DurationResult {
  minutes: number;
  formatted: string;
}

/**
 * Menghitung durasi perjalanan ambulance antara waktu mulai dan selesai.
 * Mendukung perjalanan reguler maupun perjalanan yang melewati tengah malam (overnight).
 * 
 * Contoh:
 * - 08:00 -> 10:00 => 120 menit ("2 Jam")
 * - 08:30 -> 10:15 => 105 menit ("1 Jam 45 Menit")
 * - 23:00 -> 01:00 => 120 menit ("2 Jam")
 * - 23:45 -> 00:15 => 30 menit ("30 Menit")
 */
export const calculateDuration = (startTime: string, endTime: string, baseDate?: string): DurationResult => {
  if (!startTime || !endTime) {
    return { minutes: 0, formatted: '-' };
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  if (isNaN(startHour) || isNaN(startMin) || isNaN(endHour) || isNaN(endMin)) {
    return { minutes: 0, formatted: '-' };
  }

  // Gunakan basis tanggal (default hari ini atau baseDate)
  const base = baseDate ? new Date(baseDate) : new Date();
  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();

  const startDate = new Date(year, month, day, startHour, startMin, 0, 0);
  let endDate = new Date(year, month, day, endHour, endMin, 0, 0);

  // Jika waktu selesai lebih awal atau sama dengan waktu mulai, berarti melewati tengah malam (keesokan harinya)
  if (endDate < startDate) {
    endDate = new Date(year, month, day + 1, endHour, endMin, 0, 0);
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  const totalMinutes = Math.round(diffMs / (1000 * 60));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let formatted = '';
  if (hours > 0 && minutes > 0) {
    formatted = `${hours} Jam ${minutes} Menit`;
  } else if (hours > 0) {
    formatted = `${hours} Jam`;
  } else if (minutes > 0) {
    formatted = `${minutes} Menit`;
  } else {
    formatted = '0 Menit';
  }

  return {
    minutes: totalMinutes,
    formatted
  };
};

/**
 * Format tanggal YYYY-MM-DD ke format Indonesia (e.g. "12 Sep 2026" atau "12 September 2026")
 */
export const formatDateIndo = (dateStr: string, formatStyle: 'short' | 'long' = 'short'): string => {
  if (!dateStr) return '-';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: formatStyle === 'long' ? 'long' : 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD (WIB / Waktu Lokal)
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format waktu saat ini dalam format HH:mm
 */
export const getCurrentTimeString = (): string => {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${hour}:${min}`;
};

/**
 * Menghasilkan nomor ekspedisi unik dengan format AMB-YYYYMMDD-XXX
 * Contoh: AMB-20260912-001
 */
export const generateExpeditionNumber = (dateStr: string, sequenceNumber: number): string => {
  const cleanDate = dateStr.replace(/-/g, '');
  const seqPadded = String(sequenceNumber).padStart(3, '0');
  return `AMB-${cleanDate}-${seqPadded}`;
};
