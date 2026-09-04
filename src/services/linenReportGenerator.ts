import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LinenItem, LinenTransaction, TransactionType } from '../types/linen';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export interface LinenReportParams {
  periodType: 'DAILY' | 'MONTHLY' | 'CUSTOM';
  periodLabel: string;
  startDate: Date;
  endDate: Date;
  unitName?: string;
  hospitalName?: string;
  printedBy?: string;
  items: LinenItem[];
  transactions: LinenTransaction[];
  includeSignatures?: boolean;
}

export const formatTxTypeIndonesian = (type: TransactionType): string => {
  switch (type) {
    case 'IGD_DISPATCH_DIRTY':
      return 'Serah Kotor ke Laundry (IGD → Laundry)';
    case 'LAUNDRY_RECEIVE_DIRTY':
      return 'Terima Kotor di Laundry';
    case 'LAUNDRY_DISPATCH_CLEAN':
      return 'Kirim Bersih ke IGD (Laundry → IGD)';
    case 'IGD_RECEIVE_CLEAN':
      return 'Terima Bersih di Lemari IGD';
    case 'ADJUST_STOCK':
      return 'Penyesuaian / Koreksi Fisik Stok';
    case 'DIRECT_DIRTY':
      return 'Terkontaminasi Kotor (Langsung Kotor)';
    case 'TAKE':
      return 'Pengambilan untuk Dipakai Pasien';
    case 'TO_DIRTY':
      return 'Pelepasan Linen Bekas Pasien ke Kotor';
    case 'LAUNDRY_PICKUP':
      return 'Penyerahan / Pengambilan Cucian Kotor';
    case 'LAUNDRY_RETURN':
      return 'Pengembalian Cucian Bersih';
    default:
      return type;
  }
};

/**
 * GENERATOR EXCEL (XLSX) MULTI-SHEET
 */
export const generateLinenExcelReport = (params: LinenReportParams) => {
  const {
    periodType,
    periodLabel,
    unitName = 'Instalasi Gawat Darurat (IGD)',
    hospitalName = 'PRIMAYA HOSPITAL',
    printedBy = 'Koordinator Linen IGD',
    items,
    transactions,
    includeSignatures = true
  } = params;

  const now = new Date();
  const printDateStr = format(now, 'dd MMMM yyyy, HH:mm', { locale: id });

  // SHEET 1: REKAPITULASI INVENTARIS
  const summaryAoa: any[][] = [
    [hospitalName],
    [`LAPORAN REKAPITULASI INVENTARIS & DISTRIBUSI LINEN - ${unitName.toUpperCase()}`],
    [`Periode: ${periodType === 'DAILY' ? 'Harian' : periodType === 'MONTHLY' ? 'Bulanan' : 'Rentang Tanggal'} (${periodLabel})`],
    [`Tanggal Cetak: ${printDateStr} WIB | Dicetak Oleh: ${printedBy}`],
    [],
    [
      'No',
      'Jenis Linen',
      'Total Milik (pcs)',
      'Bersih di Lemari',
      'Dipakai di Bed',
      'Kotor Standby IGD',
      'Kirim ke Laundry (Transit)',
      'Diproses di Laundry',
      'Kirim ke IGD (Transit)',
      'Total Terhitung',
      'Selisih (Discrepancy)',
      'Proporsi Lemari (%)',
      'Status Ketersediaan'
    ]
  ];

  let totalOwnedSum = 0;
  let cleanSum = 0;
  let usedSum = 0;
  let dirtySum = 0;
  let inTransitDirtySum = 0;
  let laundrySum = 0;
  let inTransitCleanSum = 0;
  let totalTrackedSum = 0;

  items.forEach((item, index) => {
    const clean = item.clean || 0;
    const used = item.used || 0;
    const dirty = item.dirty || 0;
    const inTransitDirty = item.inTransitDirty || 0;
    const laundry = item.laundry || 0;
    const inTransitClean = item.inTransitClean || 0;
    const totalOwned = item.totalOwned || 0;
    const totalTracked = clean + used + dirty + inTransitDirty + laundry + inTransitClean;
    const diff = totalTracked - totalOwned;
    const percent = Math.min(100, Math.round((clean / (totalOwned || 1)) * 100));

    let statusText = 'AMAN';
    if (clean <= (item.criticalStock || 2)) statusText = 'KRITIS';
    else if (clean < (item.minStock || 5)) statusText = 'MENIPIS';

    totalOwnedSum += totalOwned;
    cleanSum += clean;
    usedSum += used;
    dirtySum += dirty;
    inTransitDirtySum += inTransitDirty;
    laundrySum += laundry;
    inTransitCleanSum += inTransitClean;
    totalTrackedSum += totalTracked;

    summaryAoa.push([
      index + 1,
      item.name,
      totalOwned,
      clean,
      used,
      dirty,
      inTransitDirty,
      laundry,
      inTransitClean,
      totalTracked,
      diff === 0 ? '0 (Sesuai)' : `${diff > 0 ? '+' : ''}${diff}`,
      `${percent}%`,
      statusText
    ]);
  });

  // Total Baris
  summaryAoa.push([
    '',
    'TOTAL KESELURUHAN',
    totalOwnedSum,
    cleanSum,
    usedSum,
    dirtySum,
    inTransitDirtySum,
    laundrySum,
    inTransitCleanSum,
    totalTrackedSum,
    totalTrackedSum - totalOwnedSum === 0 ? '0 (Sesuai)' : `${totalTrackedSum - totalOwnedSum}`,
    `${Math.round((cleanSum / (totalOwnedSum || 1)) * 100)}%`,
    cleanSum < totalOwnedSum * 0.4 ? 'PERLU MONITORING' : 'STABIL'
  ]);

  // Lembar Tanda Tangan
  if (includeSignatures) {
    summaryAoa.push([]);
    summaryAoa.push([]);
    summaryAoa.push([
      '',
      'Disiapkan Oleh:',
      '',
      '',
      'Mengetahui / Menyetujui:',
      '',
      '',
      'Diterima Oleh:'
    ]);
    summaryAoa.push([]);
    summaryAoa.push([]);
    summaryAoa.push([]);
    summaryAoa.push([
      '',
      '( Penanggung Jawab Linen IGD )',
      '',
      '',
      '( Kepala Ruangan IGD )',
      '',
      '',
      '( Penanggung Jawab Laundry )'
    ]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoa);

  // Set column widths
  wsSummary['!cols'] = [
    { wch: 5 },  // No
    { wch: 20 }, // Jenis Linen
    { wch: 16 }, // Total Milik
    { wch: 16 }, // Lemari Bersih
    { wch: 14 }, // Dipakai
    { wch: 16 }, // Kotor IGD
    { wch: 22 }, // Kirim Laundry
    { wch: 18 }, // Laundry
    { wch: 20 }, // Kirim IGD
    { wch: 16 }, // Total Tracked
    { wch: 18 }, // Selisih
    { wch: 16 }, // Proporsi
    { wch: 16 }  // Status
  ];

  // SHEET 2: LOG TRANSAKSI MUTASI
  const txAoa: any[][] = [
    [hospitalName],
    [`LOG RIWAYAT MUTASI SIRKULASI LINEN - ${unitName.toUpperCase()}`],
    [`Periode: ${periodLabel} | Total Transaksi: ${transactions.length}`],
    [`Waktu Unduh: ${printDateStr} WIB`],
    [],
    [
      'No',
      'Tanggal & Waktu',
      'Jenis Linen',
      'Tipe Transaksi',
      'Jumlah (pcs)',
      'Status Asal',
      'Status Tujuan',
      'Petugas / Aktor',
      'Catatan / Referensi'
    ]
  ];

  transactions.forEach((tx, idx) => {
    let dateFormatted = '-';
    if (tx.timestamp) {
      const d = tx.timestamp.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp);
      dateFormatted = format(d, 'dd/MM/yyyy HH:mm:ss', { locale: id });
    }

    txAoa.push([
      idx + 1,
      dateFormatted,
      tx.itemName || '-',
      formatTxTypeIndonesian(tx.type),
      tx.quantity || 0,
      tx.sourceStatus || '-',
      tx.targetStatus || '-',
      tx.actor || '-',
      tx.notes || '-'
    ]);
  });

  if (transactions.length === 0) {
    txAoa.push(['', '-', 'Tidak ada aktivitas transaksi pada rentang waktu ini', '-', '-', '-', '-', '-', '-']);
  }

  const wsTransactions = XLSX.utils.aoa_to_sheet(txAoa);
  wsTransactions['!cols'] = [
    { wch: 5 },  // No
    { wch: 20 }, // Tanggal & Waktu
    { wch: 16 }, // Jenis Linen
    { wch: 32 }, // Tipe Transaksi
    { wch: 12 }, // Jumlah
    { wch: 15 }, // Asal
    { wch: 15 }, // Tujuan
    { wch: 24 }, // Petugas
    { wch: 40 }  // Catatan
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekapitulasi Stok');
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Log Mutasi Transaksi');

  const safePeriod = periodLabel.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
  const filename = `Laporan_Linen_${periodType === 'DAILY' ? 'Harian' : periodType === 'MONTHLY' ? 'Bulanan' : 'Periode'}_${safePeriod}.xlsx`;

  XLSX.writeFile(wb, filename);
};

/**
 * GENERATOR PDF RESMI (KOP SURAT RUMAH SAKIT & STANDAR PELAPORAN)
 */
export const generateLinenPdfReport = (params: LinenReportParams) => {
  const {
    periodType,
    periodLabel,
    unitName = 'Instalasi Gawat Darurat (IGD)',
    hospitalName = 'PRIMAYA HOSPITAL',
    printedBy = 'Koordinator Linen IGD',
    items,
    transactions,
    includeSignatures = true
  } = params;

  // Create orientation: landscape for comprehensive data view
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const printDateStr = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id });

  // 1. KOP SURAT RUMAH SAKIT
  // Header background banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Primaya Logo & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(hospitalName.toUpperCase(), 14, 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`SISTEM MANAJEMEN LINEN TERPADU • ${unitName.toUpperCase()}`, 14, 16);
  doc.text(`Standar Pelayanan Operasional Linen & Sterilisasi Higienis`, 14, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`DOKUMEN RESMI PELAPORAN`, pageWidth - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak: ${printDateStr} WIB`, pageWidth - 14, 18, { align: 'right' });

  // Accent Line
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 24, pageWidth, 2, 'F');

  // 2. JUDUL LAPORAN & METADATA PERIODE
  let currentY = 32;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const typeText = periodType === 'DAILY' ? 'HARIAN' : periodType === 'MONTHLY' ? 'BULANAN' : 'RENTANG PERIODE';
  doc.text(`LAPORAN ${typeText} MUTASI & DISTRIBUSI LINEN`, 14, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode Pemeriksaan: ${periodLabel}   |   Ruangan: ${unitName}   |   Petugas: ${printedBy}`, 14, currentY);

  // 3. TABEL 1: REKAPITULASI INVENTARIS FISIK & DISTRIBUSI
  currentY += 4;
  const inventoryHeaders = [
    ['No', 'Jenis Linen', 'Milik', 'Bersih Lemari', 'Dipakai', 'Kotor IGD', 'Kirim Laundry', 'Di Laundry', 'Kirim IGD', 'Fisik Total', 'Status']
  ];

  let totalOwnedSum = 0;
  let cleanSum = 0;
  let usedSum = 0;
  let dirtySum = 0;
  let inTransitDirtySum = 0;
  let laundrySum = 0;
  let inTransitCleanSum = 0;

  const inventoryRows = items.map((item, idx) => {
    const clean = item.clean || 0;
    const used = item.used || 0;
    const dirty = item.dirty || 0;
    const inTransitDirty = item.inTransitDirty || 0;
    const laundry = item.laundry || 0;
    const inTransitClean = item.inTransitClean || 0;
    const totalOwned = item.totalOwned || 0;
    const totalTracked = clean + used + dirty + inTransitDirty + laundry + inTransitClean;

    totalOwnedSum += totalOwned;
    cleanSum += clean;
    usedSum += used;
    dirtySum += dirty;
    inTransitDirtySum += inTransitDirty;
    laundrySum += laundry;
    inTransitCleanSum += inTransitClean;

    let statusLabel = 'AMAN';
    if (clean <= (item.criticalStock || 2)) statusLabel = 'KRITIS';
    else if (clean < (item.minStock || 5)) statusLabel = 'MENIPIS';

    return [
      idx + 1,
      item.name,
      `${totalOwned} ${item.unitLabel}`,
      `${clean} ${item.unitLabel}`,
      `${used}`,
      `${dirty}`,
      `${inTransitDirty}`,
      `${laundry}`,
      `${inTransitClean}`,
      `${totalTracked} ${item.unitLabel}`,
      statusLabel
    ];
  });

  // Total Row
  inventoryRows.push([
    '',
    'TOTAL',
    `${totalOwnedSum} pcs`,
    `${cleanSum} pcs`,
    `${usedSum}`,
    `${dirtySum}`,
    `${inTransitDirtySum}`,
    `${laundrySum}`,
    `${inTransitCleanSum}`,
    `${cleanSum + usedSum + dirtySum + inTransitDirtySum + laundrySum + inTransitCleanSum} pcs`,
    cleanSum < totalOwnedSum * 0.4 ? 'PERLU DROP' : 'STABIL'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: inventoryHeaders,
    body: inventoryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', fontStyle: 'bold', cellWidth: 35 },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold', textColor: [16, 185, 129] }, // Emerald
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center', fontStyle: 'bold' },
      10: { halign: 'center', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Highlight Total Row
      if (data.row.index === inventoryRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
      }
    }
  });

  // 4. TABEL 2: LOG TRANSAKSI MUTASI PADA PERIODE
  let finalY = (doc as any).lastAutoTable.finalY + 8;

  // Cek apakah muat di halaman 1 atau perlu buat halaman baru
  if (finalY > pageHeight - 60) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`RINCIAN MUTASI & LOG TRANSAKSI SIRKULASI (${transactions.length} Aktivitas)`, 14, finalY);

  const txHeaders = [
    ['No', 'Waktu Transaksi', 'Jenis Linen', 'Aktivitas Transaksi', 'Qty', 'Aktor / Petugas', 'Keterangan']
  ];

  const txRows = transactions.map((tx, idx) => {
    let dateStr = '-';
    if (tx.timestamp) {
      const d = tx.timestamp.toDate ? tx.timestamp.toDate() : new Date(tx.timestamp);
      dateStr = format(d, 'dd/MM/yyyy HH:mm', { locale: id });
    }

    return [
      idx + 1,
      dateStr,
      tx.itemName || '-',
      formatTxTypeIndonesian(tx.type),
      `${tx.quantity} pcs`,
      tx.actor || '-',
      tx.notes || '-'
    ];
  });

  if (txRows.length === 0) {
    txRows.push(['-', '-', '-', 'Tidak ada catatan transaksi pada periode yang dipilih', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: finalY + 3,
    head: txHeaders,
    body: txRows,
    theme: 'striped',
    headStyles: {
      fillColor: [51, 65, 85], // Slate-700
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [241, 245, 249],
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'left', cellWidth: 26, fontStyle: 'bold' },
      3: { halign: 'left', cellWidth: 56 },
      4: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
      5: { halign: 'left', cellWidth: 42 },
      6: { halign: 'left' }
    }
  });

  // 5. KOLOM TANDA TANGAN / PENGESAHAN
  let signY = (doc as any).lastAutoTable.finalY + 12;

  // Jika tidak cukup ruang untuk tanda tangan (butuh ~35mm), tambah halaman baru
  if (signY > pageHeight - 38) {
    doc.addPage();
    signY = 20;
  }

  if (includeSignatures) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const col1X = 35;
    const col2X = pageWidth / 2;
    const col3X = pageWidth - 35;

    doc.text('Disiapkan Oleh:', col1X, signY, { align: 'center' });
    doc.text('Mengetahui / Pengawas:', col2X, signY, { align: 'center' });
    doc.text('Diterima Oleh:', col3X, signY, { align: 'center' });

    doc.setFont('helvetica', 'italic');
    doc.text('(Staf Perawat IGD)', col1X, signY + 4, { align: 'center' });
    doc.text('(Kepala Ruangan IGD)', col2X, signY + 4, { align: 'center' });
    doc.text('(Petugas Runner Laundry)', col3X, signY + 4, { align: 'center' });

    // Garis Tanda Tangan
    const lineY = signY + 22;
    doc.setDrawColor(148, 163, 184); // Slate-400
    doc.line(col1X - 25, lineY, col1X + 25, lineY);
    doc.line(col2X - 25, lineY, col2X + 25, lineY);
    doc.line(col3X - 25, lineY, col3X + 25, lineY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('( ........................................ )', col1X, lineY + 4, { align: 'center' });
    doc.text('( ........................................ )', col2X, lineY + 4, { align: 'center' });
    doc.text('( ........................................ )', col3X, lineY + 4, { align: 'center' });
  }

  // 6. FOOTER HALAMAN
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen Manajemen Linen Rumah Sakit Primaya • Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const safePeriod = periodLabel.replace(/[/\\?%*:|"<>]/g, '-').replace(/\s+/g, '_');
  const filename = `Laporan_Linen_${periodType === 'DAILY' ? 'Harian' : periodType === 'MONTHLY' ? 'Bulanan' : 'Periode'}_${safePeriod}.pdf`;

  doc.save(filename);
};
