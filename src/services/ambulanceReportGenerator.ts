import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AmbulanceExpedition } from '../types/ambulance';
import { formatDateIndo } from '../utils/ambulanceUtils';

export const INDONESIAN_MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

export interface MonthlyReportParams {
  expeditions: AmbulanceExpedition[];
  month: number; // 1 - 12
  year: number;
  hospitalName?: string;
  unitName?: string;
  printedBy?: string;
}

/**
 * Filter dan urutkan data kegiatan ambulance berdasarkan bulan dan tahun terpilih
 */
export const filterMonthlyExpeditions = (
  expeditions: AmbulanceExpedition[],
  month: number,
  year: number
): AmbulanceExpedition[] => {
  const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const filtered = expeditions.filter((item) => item.date && item.date.startsWith(targetPrefix));

  return filtered.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
};

/**
 * GENERATOR EXCEL (XLSX) LAPORAN BULANAN AMBULANCE
 * Mengikuti 13 kolom panduan pengisian resmi
 */
export const generateAmbulanceMonthlyExcel = (params: MonthlyReportParams): void => {
  const {
    expeditions,
    month,
    year,
    hospitalName = 'PRIMAYA HOSPITAL',
    unitName = 'INSTALASI GAWAT DARURAT (IGD)',
    printedBy = 'Petugas Admin Ambulance IGD',
  } = params;

  const monthLabel = INDONESIAN_MONTHS.find((m) => m.value === month)?.label || String(month);
  const data = filterMonthlyExpeditions(expeditions, month, year);
  const printDateStr = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id });

  // 1. DATA SHEET: LOG KEGIATAN OPERASIONAL (13 KOLOM)
  const aoa: any[][] = [];

  // Header Title
  aoa.push([hospitalName.toUpperCase()]);
  aoa.push([`LAPORAN BULANAN KEGIATAN OPERASIONAL AMBULANS - ${unitName}`]);
  aoa.push([`Periode: ${monthLabel} ${year}`]);
  aoa.push([`Dicetak pada: ${printDateStr} WIB | Oleh: ${printedBy}`]);
  aoa.push([`Total Kegiatan: ${data.length} | Total Jarak: ${data.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0)} KM`]);
  aoa.push([]); // Baris kosong

  // Header 13 Kolom Sesuai Spesifikasi Panduan
  const headers = [
    'No',
    'Tanggal',
    'Jenis Kegiatan',
    'Identitas Pasien',
    'Status Awal',
    'Status Akhir',
    'Ambulans yang Digunakan',
    'Waktu Mulai',
    'Waktu Selesai',
    'Durasi',
    'Jarak Tempuh (Km)',
    'Driver',
    'Keterangan Tambahan',
  ];
  aoa.push(headers);

  // Rows Data
  data.forEach((item, idx) => {
    // Gabungan keterangan tambahan + tujuan rujukan bila ada
    const notesParts: string[] = [];
    if (item.destination) {
      notesParts.push(`Tujuan: ${item.destination}`);
    }
    if (item.notes) {
      notesParts.push(item.notes);
    }
    const keteranganTambahan = notesParts.length > 0 ? notesParts.join(' | ') : '-';

    // Identitas pasien
    let pasienInfo = '-';
    if (item.patientName) {
      pasienInfo = item.patientName;
      if (item.medicalRecordNumber) {
        pasienInfo += ` (No. RM: ${item.medicalRecordNumber})`;
      }
    }

    aoa.push([
      idx + 1,
      formatDateIndo(item.date),
      item.activityType || '-',
      pasienInfo,
      item.initialStatus || '-',
      item.finalStatus || '-',
      item.ambulance || '-',
      item.startTime || '-',
      item.endTime || '-',
      item.durationFormatted || '-',
      Number(item.distanceKm) || 0,
      item.driver || '-',
      keteranganTambahan,
    ]);
  });

  // Footer Rekapitulasi
  aoa.push([]);
  const totalKm = data.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0);
  aoa.push(['', '', '', '', '', '', '', '', '', 'TOTAL JARAK TEMPUH:', `${totalKm} KM`, '', '']);
  aoa.push(['', '', '', '', '', '', '', '', '', 'TOTAL KEGIATAN:', `${data.length} Kegiatan`, '', '']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Lebar kolom rapi
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 18 }, // Tanggal
    { wch: 22 }, // Jenis Kegiatan
    { wch: 28 }, // Identitas Pasien
    { wch: 16 }, // Status Awal
    { wch: 16 }, // Status Akhir
    { wch: 24 }, // Ambulans yang Digunakan
    { wch: 13 }, // Waktu Mulai
    { wch: 14 }, // Waktu Selesai
    { wch: 16 }, // Durasi
    { wch: 18 }, // Jarak Tempuh (Km)
    { wch: 18 }, // Driver
    { wch: 38 }, // Keterangan Tambahan
  ];

  // 2. SHEET PANDUAN PENGISIAN
  const guideAoa: any[][] = [
    ['PANDUAN & KETERANGAN PENGISIAN LOG AMBULANS IGD'],
    ['PRIMAYA HOSPITAL - SISTEM OPERASIONAL AMBULANS TERPADU'],
    [],
    ['NO', 'KOLOM', 'KETERANGAN / PANDUAN PENGISIAN'],
    [1, 'No', 'Nomor urut kegiatan'],
    [2, 'Tanggal', 'Tanggal pelaksanaan kegiatan ambulans'],
    [3, 'Jenis Kegiatan', 'Hanya pilih salah satu jenis kegiatan. Jika ada kegiatan di luar pilihan yang tersedia, tambahkan penjelasannya pada kolom Keterangan Tambahan'],
    [4, 'Identitas Pasien', 'Nama pasien. Untuk kegiatan ambulans yang tidak berhubungan dengan pasien, kolom ini dapat dikosongkan'],
    [5, 'Status Awal', 'Status awal pasien sebelum kegiatan ambulans dimulai, khusus untuk kegiatan yang berhubungan dengan penjemputan pasien'],
    [6, 'Status Akhir', 'Status akhir pasien setelah kegiatan ambulans selesai, khusus untuk kegiatan penjemputan pasien'],
    [7, 'Ambulans yang Digunakan', 'Jenis ambulans yang digunakan: EVALIA / BSI / PHC / dll'],
    [8, 'Waktu Mulai', 'Jam mulai kegiatan ambulans (format WIB)'],
    [9, 'Waktu Selesai', 'Jam selesai kegiatan ambulans (format WIB)'],
    [10, 'Durasi', 'Hasil perhitungan selisih antara Waktu Selesai dikurangi Waktu Mulai'],
    [11, 'Jarak Tempuh (Km)', 'Total jarak tempuh ambulans dari atau selama kegiatan'],
    [12, 'Driver', 'Nama driver yang bertugas'],
    [13, 'Keterangan Tambahan', 'Keterangan tambahan yang diperlukan untuk melengkapi data kegiatan (lokasi tujuan rujukan, alasan, atau keterangan dinas)'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideAoa);
  wsGuide['!cols'] = [
    { wch: 6 },
    { wch: 25 },
    { wch: 80 },
  ];

  // Buat Workbook & Append Sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Laporan ${monthLabel} ${year}`);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Panduan Pengisian');

  // Trigger Download
  const filename = `Laporan_Bulanan_Ambulans_${monthLabel}_${year}.xlsx`;
  XLSX.writeFile(wb, filename);
};

/**
 * GENERATOR PDF RESMI (A4 LANDSCAPE) LAPORAN BULANAN AMBULANCE
 * Mengikuti 13 kolom panduan pengisian resmi lengkap dengan Kop & Tanda Tangan
 */
export const generateAmbulanceMonthlyPdf = (params: MonthlyReportParams): void => {
  const {
    expeditions,
    month,
    year,
    hospitalName = 'PRIMAYA HOSPITAL',
    unitName = 'INSTALASI GAWAT DARURAT (IGD)',
    printedBy = 'Petugas Admin Ambulance IGD',
  } = params;

  const monthLabel = INDONESIAN_MONTHS.find((m) => m.value === month)?.label || String(month);
  const data = filterMonthlyExpeditions(expeditions, month, year);
  const printDateStr = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id });

  // Inisialisasi Landscape A4
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. KOP SURAT RUMAH SAKIT
  // Header background bar (Navy Dark Slate)
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Hospital Name & Subtitles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(hospitalName.toUpperCase(), 14, 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`SISTEM LOGISTIK OPERASIONAL AMBULANS • ${unitName.toUpperCase()}`, 14, 14);
  doc.text(`Standar Layanan Transportasi Medis & Rujukan Pasien IGD Terpadu`, 14, 18.5);

  // Metadata Cetak
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`DOKUMEN RESMI LAPORAN BULANAN`, pageWidth - 14, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak: ${printDateStr} WIB`, pageWidth - 14, 16, { align: 'right' });

  // Accent Line (Primaya Blue)
  doc.setFillColor(37, 99, 235); // #2563eb
  doc.rect(0, 22, pageWidth, 2, 'F');

  // 2. JUDUL LAPORAN & RINGKASAN METRIK
  let currentY = 30;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN BULANAN KEGIATAN OPERASIONAL AMBULANS`, 14, currentY);

  currentY += 5;
  const totalKm = data.reduce((acc, c) => acc + (Number(c.distanceKm) || 0), 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Periode: ${monthLabel} ${year}   |   Unit: ${unitName}   |   Total Kegiatan: ${data.length} Perjalanan   |   Total Jarak: ${totalKm} KM   |   Dicetak Oleh: ${printedBy}`,
    14,
    currentY
  );

  // 3. TABEL 13 KOLOM
  currentY += 4;

  const tableHeaders = [
    [
      'No',
      'Tanggal',
      'Jenis Kegiatan',
      'Identitas Pasien',
      'Status Awal',
      'Status Akhir',
      'Ambulans',
      'Mulai',
      'Selesai',
      'Durasi',
      'Jarak',
      'Driver',
      'Keterangan Tambahan',
    ],
  ];

  const tableRows = data.map((item, idx) => {
    const notesParts: string[] = [];
    if (item.destination) {
      notesParts.push(`Tujuan: ${item.destination}`);
    }
    if (item.notes) {
      notesParts.push(item.notes);
    }
    const ket = notesParts.length > 0 ? notesParts.join(' | ') : '-';

    let patientText = '-';
    if (item.patientName) {
      patientText = item.patientName;
      if (item.medicalRecordNumber) {
        patientText += `\n(RM: ${item.medicalRecordNumber})`;
      }
    }

    return [
      idx + 1,
      formatDateIndo(item.date),
      item.activityType || '-',
      patientText,
      item.initialStatus || '-',
      item.finalStatus || '-',
      item.ambulance || '-',
      item.startTime || '-',
      item.endTime || '-',
      item.durationFormatted || '-',
      `${Number(item.distanceKm) || 0} KM`,
      item.driver || '-',
      ket,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175], // Blue-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },   // No
      1: { halign: 'center', cellWidth: 20 },  // Tanggal
      2: { cellWidth: 24 },                   // Jenis Kegiatan
      3: { cellWidth: 27 },                   // Identitas Pasien
      4: { halign: 'center', cellWidth: 18 },  // Status Awal
      5: { halign: 'center', cellWidth: 18 },  // Status Akhir
      6: { halign: 'center', cellWidth: 18 },  // Ambulans
      7: { halign: 'center', cellWidth: 13 },  // Mulai
      8: { halign: 'center', cellWidth: 13 },  // Selesai
      9: { halign: 'center', cellWidth: 17 },  // Durasi
      10: { halign: 'center', cellWidth: 16 }, // Jarak
      11: { cellWidth: 18 },                  // Driver
      12: { cellWidth: 'auto' },               // Keterangan Tambahan
    },
    margin: { left: 10, right: 10 },
    didDrawPage: (dataHook) => {
      // Nomor Halaman
      const str = `Halaman ${dataHook.pageNumber}`;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 14, pageHeight - 8, { align: 'right' });
      doc.text(`Dokumen Resmi ${hospitalName} - Operasional Ambulans IGD`, 14, pageHeight - 8);
    },
  });

  // Ambil posisi akhir tabel
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 40;

  // 4. BAGIAN TANDA TANGAN PENGESAHAN
  let sigY = finalY + 10;
  if (sigY + 30 > pageHeight) {
    doc.addPage();
    sigY = 20;
  }

  const colWidth = (pageWidth - 28) / 3;

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  // Kolom Kiri: Petugas Pelaksana Logistik
  doc.text('Petugas Pelaksana / Driver Ambulans,', 14, sigY);
  doc.text('( ..................................................... )', 14, sigY + 20);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Tim Operasional Ambulance IGD', 14, sigY + 24);

  // Kolom Kanan: Mengetahui Koordinator IGD
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const rightColX = pageWidth - 14 - colWidth;
  doc.text('Mengetahui,', rightColX, sigY);
  doc.text('Koordinator IGD', rightColX, sigY + 4);
  doc.text('( ..................................................... )', rightColX, sigY + 20);

  // Trigger Download
  const filename = `Laporan_Bulanan_Ambulans_${monthLabel}_${year}.pdf`;
  doc.save(filename);
};
