import { LinenItemType, LinenStock, LinenStockStatus, LinenSettings, ShiftType, ItemThreshold } from '../types/linen';

export const DEFAULT_LINEN_SETTINGS: LinenSettings = {
  thresholds: {
    selimut: { safe: 20, warning: 10 },
    perlak: { safe: 5, warning: 3 },
  },
  shifts: {
    pagi: { start: '07:00', end: '14:00' },
    sore: { start: '14:00', end: '21:00' },
    malam: { start: '21:00', end: '07:00' },
  },
  timezone: 'Asia/Jakarta',
};

/**
 * Mendapatkan tanggal dan jam saat ini dalam timezone Asia/Jakarta
 */
export const getJakartaDateInfo = (date: Date = new Date()) => {
  // Format dengan Intl untuk memastikan timezone Asia/Jakarta
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const yyyy = getPart('year');
  const mm = getPart('month');
  const dd = getPart('day');
  const hour = getPart('hour');
  const minute = getPart('minute');

  const dateString = `${yyyy}-${mm}-${dd}`;
  const timeString = `${hour}:${minute}`;

  return {
    dateString,
    timeString,
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
  };
};

/**
 * Menentukan shift kerja berdasarkan waktu saat ini di Asia/Jakarta
 */
export const getCurrentShift = (shifts: LinenSettings['shifts'] = DEFAULT_LINEN_SETTINGS.shifts): ShiftType => {
  const { hour, minute } = getJakartaDateInfo();
  const currentMinutes = hour * 60 + minute;

  const parseMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const pagiStart = parseMinutes(shifts.pagi.start); // e.g. 7 * 60 = 420
  const pagiEnd = parseMinutes(shifts.pagi.end);     // e.g. 14 * 60 = 840
  const soreStart = parseMinutes(shifts.sore.start); // e.g. 14 * 60 = 840
  const soreEnd = parseMinutes(shifts.sore.end);     // e.g. 21 * 60 = 1260

  if (currentMinutes >= pagiStart && currentMinutes < pagiEnd) {
    return 'Pagi';
  } else if (currentMinutes >= soreStart && currentMinutes < soreEnd) {
    return 'Sore';
  } else {
    return 'Malam';
  }
};

/**
 * Menghitung status stok (AMAN, MENIPIS, KRITIS) berdasarkan stok bersih dan threshold
 */
export const evaluateLinenStatus = (
  cleanCount: number,
  itemType: LinenItemType,
  thresholds: LinenSettings['thresholds'] = DEFAULT_LINEN_SETTINGS.thresholds
): LinenStockStatus => {
  const threshold: ItemThreshold = thresholds[itemType] || DEFAULT_LINEN_SETTINGS.thresholds[itemType];

  if (cleanCount >= threshold.safe) {
    return 'AMAN';
  } else if (cleanCount >= threshold.warning) {
    return 'MENIPIS';
  } else {
    return 'KRITIS';
  }
};

/**
 * Rekonsiliasi stok: memastikan clean + used + dirty + laundry == totalAsset
 */
export const evaluateDiscrepancy = (stock: LinenStock) => {
  const currentSum = (stock.clean || 0) + (stock.used || 0) + (stock.dirty || 0) + (stock.laundry || 0);
  const discrepancy = currentSum - (stock.totalAsset || 0);
  return {
    isBalanced: discrepancy === 0,
    discrepancy,
    currentSum,
    totalAsset: stock.totalAsset,
  };
};

/**
 * Helper warna badge status
 */
export const getStatusColorClasses = (status: LinenStockStatus) => {
  switch (status) {
    case 'AMAN':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badge: 'bg-emerald-500 text-white',
        text: 'text-emerald-600',
        border: 'border-emerald-500',
      };
    case 'MENIPIS':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'bg-amber-500 text-white',
        text: 'text-amber-600',
        border: 'border-amber-500',
      };
    case 'KRITIS':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        badge: 'bg-rose-500 text-white',
        text: 'text-rose-600',
        border: 'border-rose-500',
      };
    default:
      return {
        bg: 'bg-gray-50 text-gray-700 border-gray-200',
        badge: 'bg-gray-500 text-white',
        text: 'text-gray-600',
        border: 'border-gray-500',
      };
  }
};
