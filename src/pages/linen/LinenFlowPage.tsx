import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LinenItem, TransactionType } from '../../types/linen';
import { 
  seedInitialIgdLinen, 
  subscribeLinenItems, 
  getLinenStatusLevel,
  executeLinenTransition 
} from '../../services/linenService';
import { LinenActionModal } from './components/LinenActionModal';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { LinenQrModal } from './components/LinenQrModal';
import toast from 'react-hot-toast';
import { 
  FaHospital, 
  FaQrcode, 
  FaWhatsapp, 
  FaHandsHelping, 
  FaTrashAlt, 
  FaTruckLoading, 
  FaCheckDouble,
  FaBed,
  FaLayerGroup,
  FaArrowLeft,
  FaSlidersH
} from 'react-icons/fa';

const UNITS = [
  { code: 'IGD', name: 'Instalasi Gawat Darurat' },
  { code: 'ICU', name: 'Intensive Care Unit' },
  { code: 'NICU', name: 'Neonatal ICU' },
  { code: 'OK', name: 'Kamar Operasi' },
  { code: 'RAWAT', name: 'Rawat Inap' }
];

export const LinenFlowPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const unitParam = (searchParams.get('unit') || 'IGD').toUpperCase();

  const [activeUnit, setActiveUnit] = useState<string>(unitParam);
  const [items, setItems] = useState<LinenItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'OPERATIONAL' | 'COORDINATOR'>('OPERATIONAL');

  // Modal states
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [actionModalType, setActionModalType] = useState<TransactionType>('TAKE');
  const [actionModalItemId, setActionModalItemId] = useState<string | undefined>();
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  // Laundry batch confirmation loading
  const [laundryConfirming, setLaundryConfirming] = useState<boolean>(false);

  const unitId = activeUnit.toLowerCase();

  useEffect(() => {
    // Seed initial IGD data if not present
    seedInitialIgdLinen(unitId);

    // Subscribe to real-time updates
    const unsub = subscribeLinenItems(unitId, (updatedItems) => {
      setItems(updatedItems);
      setLoading(false);
    });

    return () => unsub();
  }, [unitId]);

  // Determine overall status across all items
  const overallStatus = React.useMemo(() => {
    if (items.length === 0) return 'SAFE';
    const hasCritical = items.some(
      (i) => getLinenStatusLevel(i.clean, i.minStock, i.criticalStock) === 'CRITICAL'
    );
    if (hasCritical) return 'CRITICAL';

    const hasWarning = items.some(
      (i) => getLinenStatusLevel(i.clean, i.minStock, i.criticalStock) === 'WARNING'
    );
    if (hasWarning) return 'WARNING';

    return 'SAFE';
  }, [items]);

  // Open modal with specific action
  const handleOpenAction = (type: TransactionType, itemId?: string) => {
    setActionModalType(type);
    setActionModalItemId(itemId);
    setIsActionModalOpen(true);
  };

  // Laundry direct pickup all dirty linen
  const handleConfirmAllLaundryPickup = async () => {
    const dirtyItems = items.filter((i) => (i.dirty || 0) > 0);
    if (dirtyItems.length === 0) {
      toast.error('Tidak ada linen kotor yang perlu diambil saat ini.');
      return;
    }

    setLaundryConfirming(true);
    try {
      for (const item of dirtyItems) {
        await executeLinenTransition({
          itemId: item.id,
          type: 'LAUNDRY_PICKUP',
          quantity: item.dirty,
          actor: 'Petugas Laundry',
          notes: 'Pengambilan serentak seluruh linen kotor IGD'
        });
      }
      toast.success('Seluruh linen kotor berhasil dikonfirmasi diambil laundry!');
    } catch (err: any) {
      toast.error(err.message || 'Gagal memproses pengambilan');
    } finally {
      setLaundryConfirming(false);
    }
  };

  // Generate and send WhatsApp summary
  const handleSendWhatsApp = () => {
    const now = new Date();
    const timeStr = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let message = `*Laporan Sirkulasi Linen ${activeUnit} — Primaya Hospital*\n`;
    message += `📅 Waktu: ${timeStr} WIB\n\n`;

    items.forEach((item) => {
      const clean = item.clean || 0;
      const used = item.used || 0;
      const dirty = item.dirty || 0;
      const laundry = item.laundry || 0;
      const statusLevel = getLinenStatusLevel(clean, item.minStock, item.criticalStock);
      const statusText = statusLevel === 'SAFE' ? '🟢 AMAN' : statusLevel === 'WARNING' ? '🟡 MENIPIS' : '🔴 KRITIS';

      message += `🛏 *${item.name}* (Total Milik: ${item.totalOwned} ${item.unitLabel})\n`;
      message += `• Bersih di Lemari: ${clean} ${item.unitLabel} (${statusText})\n`;
      message += `• Sedang Digunakan: ${used} ${item.unitLabel}\n`;
      message += `• Linen Kotor: ${dirty} ${item.unitLabel}\n`;
      message += `• Di Laundry: ${laundry} ${item.unitLabel}\n\n`;
    });

    message += `_Laporan otomatis dikirim melalui LinenFlow ${activeUnit}_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const totalDirtyItems = items.reduce((acc, curr) => acc + (curr.dirty || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      
      {/* Top Header Bar */}
      <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <FaHospital size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base sm:text-lg tracking-tight leading-tight">
                  LINENFLOW
                </h1>
                <select
                  value={activeUnit}
                  onChange={(e) => setActiveUnit(e.target.value)}
                  className="bg-blue-500/20 text-blue-300 text-xs font-black px-2 py-0.5 rounded-md border border-blue-400/30 cursor-pointer outline-none hover:bg-blue-500/30 transition-colors"
                >
                  {UNITS.map((u) => (
                    <option key={u.code} value={u.code} className="bg-slate-900 text-white font-semibold">
                      {u.code}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Primaya Hospital • {UNITS.find(u => u.code === activeUnit)?.name || 'Instalasi Gawat Darurat'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
              title="Cetak Barcode/QR Lemari"
            >
              <FaQrcode size={16} />
              <span className="hidden sm:inline">QR Lemari</span>
            </button>
            <Link
              to="/admin"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors border border-white/10"
              title="Kembali ke Admin Panel"
            >
              <FaArrowLeft size={14} />
            </Link>
          </div>
        </div>

        {/* Tab Navigation: Operasional vs Koordinator */}
        <div className="max-w-4xl mx-auto px-4 flex border-t border-slate-800">
          <button
            onClick={() => setActiveTab('OPERATIONAL')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'OPERATIONAL'
                ? 'border-blue-500 text-blue-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FaCheckDouble size={14} />
            <span>Operasional Cepat (3 Klik)</span>
          </button>
          <button
            onClick={() => setActiveTab('COORDINATOR')}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'COORDINATOR'
                ? 'border-blue-500 text-blue-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FaSlidersH size={14} />
            <span>Dashboard Koordinator</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 space-y-6">
        
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-slate-200">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-semibold text-slate-500">Memuat inventaris linen {activeUnit}...</p>
          </div>
        ) : activeTab === 'COORDINATOR' ? (
          /* TAB 2: COORDINATOR DASHBOARD */
          <CoordinatorDashboard 
            items={items} 
            unitId={unitId} 
            unitName={activeUnit} 
          />
        ) : (
          /* TAB 1: OPERATIONAL (3-CLICK UI) */
          <>
            {/* Global Status Banner */}
            <div className={`p-4 rounded-3xl border flex items-center justify-between gap-3 shadow-xs ${
              overallStatus === 'SAFE'
                ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900'
                : overallStatus === 'WARNING'
                ? 'bg-amber-500/10 border-amber-300 text-amber-900'
                : 'bg-rose-500/10 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {overallStatus === 'SAFE' ? '🟢' : overallStatus === 'WARNING' ? '🟡' : '🔴'}
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight">
                    {overallStatus === 'SAFE' && 'STATUS LEMARI: AMAN'}
                    {overallStatus === 'WARNING' && 'STATUS LEMARI: MENIPIS'}
                    {overallStatus === 'CRITICAL' && 'STATUS LEMARI: KRITIS!'}
                  </h2>
                  <p className="text-xs opacity-80">
                    {overallStatus === 'SAFE' && 'Ketersediaan stok bersih di lemari IGD berada di atas batas aman.'}
                    {overallStatus === 'WARNING' && 'Ada stok linen bersih yang mendekati batas minimum.'}
                    {overallStatus === 'CRITICAL' && 'Stok bersih sangat sedikit! Segera minta drop dari laundry.'}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] font-mono font-bold bg-white/80 px-2.5 py-1 rounded-full shadow-2xs">
                  {items.length} Jenis Linen
                </span>
              </div>
            </div>

            {/* Section 1: STOK LINEN BERSIH DI LEMARI IGD */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Stok Bersih di Lemari IGD
                </h3>
                <span className="text-xs text-slate-400">
                  Real-time Sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => {
                  const statusLevel = getLinenStatusLevel(item.clean, item.minStock, item.criticalStock);
                  const percent = Math.min(100, Math.round(((item.clean || 0) / (item.totalOwned || 1)) * 100));

                  return (
                    <div 
                      key={item.id}
                      className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Top status indicator */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            {item.name.toLowerCase().includes('selimut') ? <FaBed size={16} /> : <FaLayerGroup size={16} />}
                          </div>
                          <div>
                            <h4 className="font-black text-base text-slate-900">{item.name}</h4>
                            <span className="text-[11px] text-slate-400">Total Milik: {item.totalOwned} {item.unitLabel}</span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                          statusLevel === 'SAFE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : statusLevel === 'WARNING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {statusLevel === 'SAFE' ? '🟢 AMAN' : statusLevel === 'WARNING' ? '🟡 MENIPIS' : '🔴 KRITIS'}
                        </span>
                      </div>

                      {/* Giant Number */}
                      <div className="my-2 flex items-baseline justify-between">
                        <div>
                          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                            {item.clean}
                          </span>
                          <span className="ml-2 text-sm font-bold text-slate-400 uppercase">
                            {item.unitLabel} Bersih
                          </span>
                        </div>
                        <div className="text-right text-xs text-slate-500 font-medium">
                          Min: <strong className="text-slate-800">{item.minStock}</strong>
                        </div>
                      </div>

                      {/* Mini Distribution Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                          <span>Distribusi Status:</span>
                          <span>{percent}% di Lemari</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                          <div style={{ width: `${(item.clean / item.totalOwned) * 100}%` }} className="bg-emerald-500 h-full" title={`Bersih: ${item.clean}`} />
                          <div style={{ width: `${((item.used || 0) / item.totalOwned) * 100}%` }} className="bg-amber-400 h-full" title={`Digunakan: ${item.used}`} />
                          <div style={{ width: `${((item.dirty || 0) / item.totalOwned) * 100}%` }} className="bg-rose-400 h-full" title={`Kotor: ${item.dirty}`} />
                          <div style={{ width: `${((item.laundry || 0) / item.totalOwned) * 100}%` }} className="bg-blue-400 h-full" title={`Laundry: ${item.laundry}`} />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                          <span className="text-amber-600 font-medium">Dipakai: {item.used || 0}</span>
                          <span className="text-rose-600 font-medium">Kotor: {item.dirty || 0}</span>
                          <span className="text-blue-600 font-medium">Laundry: {item.laundry || 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Section 2: 3 TOMBOL AKSI CEPAT (RAMAH JEMPOL HP) */}
            <section className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Aksi Cepat Operasional (3 Klik Selesai)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Ambil Linen */}
                <button
                  onClick={() => handleOpenAction('TAKE')}
                  className="p-5 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between min-h-[120px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                    <FaHandsHelping size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg leading-tight">AMBIL LINEN</h4>
                    <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                      Dari lemari untuk pasien
                    </p>
                  </div>
                </button>

                {/* 2. Kembalikan / Linen Kotor */}
                <button
                  onClick={() => handleOpenAction('TO_DIRTY')}
                  className="p-5 rounded-3xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between min-h-[120px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                    <FaTrashAlt size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg leading-tight">LINEN KOTOR</h4>
                    <p className="text-xs text-amber-100 mt-0.5 font-medium">
                      Selesai pakai ke keranjang kotor
                    </p>
                  </div>
                </button>

                {/* 3. Terima Bersih */}
                <button
                  onClick={() => handleOpenAction('LAUNDRY_RETURN')}
                  className="p-5 rounded-3xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md hover:shadow-lg transition-all text-left flex flex-col justify-between min-h-[120px]"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-2">
                    <FaTruckLoading size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg leading-tight">TERIMA BERSIH</h4>
                    <p className="text-xs text-indigo-100 mt-0.5 font-medium">
                      Dari laundry kembali ke lemari
                    </p>
                  </div>
                </button>
              </div>
            </section>

            {/* Section 3: KOTAK KHUSUS PETUGAS LAUNDRY (LINEN KOTOR SIAP DIAMBIL) */}
            <section className="bg-white rounded-3xl p-5 shadow-xs border border-blue-200 bg-gradient-to-br from-white to-blue-50/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    <h4 className="font-black text-slate-900 text-base">
                      Linen Kotor Siap Diambil Laundry
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Petugas laundry cukup klik satu tombol saat mengambil linen kotor dari ruang IGD.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {items.map((i) => (
                      <div key={i.id} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                        <span className="text-slate-500">{i.name}:</span>{' '}
                        <strong className="text-rose-600 font-black">{i.dirty || 0}</strong>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirmAllLaundryPickup}
                    disabled={laundryConfirming || totalDirtyItems === 0}
                    className="py-3 px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-2xl shadow-md transition-all text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {laundryConfirming ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FaTruckLoading />
                        <span>Konfirmasi Ambil ({totalDirtyItems})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Section 4: KIRIM LAPORAN KE WHATSAPP */}
            <section className="pt-2">
              <button
                onClick={handleSendWhatsApp}
                className="w-full py-4 px-6 rounded-3xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold shadow-lg transition-all flex items-center justify-center gap-3 text-sm sm:text-base"
              >
                <FaWhatsapp size={22} />
                <span>Kirim Laporan Stok Linen ke WhatsApp Koordinator</span>
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                Mengubah WhatsApp dari tempat pencatatan manual menjadi notifikasi ringkas otomatis.
              </p>
            </section>
          </>
        )}
      </main>

      {/* Transaction Action Modal */}
      <LinenActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        items={items}
        defaultType={actionModalType}
        defaultItemId={actionModalItemId}
      />

      {/* QR Code Printable Modal */}
      <LinenQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        unitCode={activeUnit}
        unitName="Instalasi Gawat Darurat (IGD)"
      />
    </div>
  );
};

export default LinenFlowPage;
