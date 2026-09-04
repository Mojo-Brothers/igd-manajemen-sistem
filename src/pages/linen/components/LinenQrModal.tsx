import React, { useState } from 'react';
import { FaTimes, FaPrint, FaQrcode, FaExternalLinkAlt, FaHospital, FaTruckLoading, FaCopy, FaCheck, FaGlobe, FaLaptopCode } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface LinenQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitCode: string;
  unitName: string;
}

export const LinenQrModal: React.FC<LinenQrModalProps> = ({
  isOpen,
  onClose,
  unitCode,
  unitName
}) => {
  const [activeTab, setActiveTab] = useState<'IGD' | 'LAUNDRY'>('IGD');
  const [copied, setCopied] = useState<boolean>(false);

  // GitHub Pages Canonical Base URL
  const GITHUB_PAGES_BASE = 'https://mojo-brothers.github.io/igd-manajemen-sistem/';
  const isOnlineGhPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  
  // Default to GitHub Pages so QR code scanned with mobile phone always opens the live app!
  const [useGhPages, setUseGhPages] = useState<boolean>(true);

  if (!isOpen) return null;

  // Base URL calculation
  const getBaseUrl = () => {
    if (useGhPages) {
      if (isOnlineGhPages) {
        const path = window.location.pathname.replace(/\/index\.html$/, '');
        const cleanPath = path.endsWith('/') ? path : `${path}/`;
        return `${window.location.origin}${cleanPath}`;
      }
      return GITHUB_PAGES_BASE;
    }
    // Localhost / current browser base
    const path = window.location.pathname.replace(/\/index\.html$/, '');
    const cleanPath = path.endsWith('/') ? path : `${path}/`;
    return `${window.location.origin}${cleanPath}`;
  };

  const baseUrl = getBaseUrl();
  
  // Two distinct URLs for IGD and Laundry
  const igdUrl = `${baseUrl}#/linen`;
  const laundryUrl = `${baseUrl}#/laundry`;

  const currentUrl = activeTab === 'IGD' ? igdUrl : laundryUrl;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}&margin=10`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success(`Link QR ${activeTab === 'IGD' ? 'Petugas IGD' : 'Petugas Laundry'} berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 print:m-0 print:shadow-none print:w-full max-h-[95vh] flex flex-col">
        
        {/* Header (hidden during print) */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/50 flex items-center justify-center text-blue-300">
              <FaQrcode size={16} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Pemisahan Akses QR Code</h3>
              <p className="text-[11px] text-slate-400">Pilih QR sesuai stasiun kerja operasional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Domain Target Selector (hidden during print) */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs print:hidden shrink-0">
          <span className="text-slate-500 font-medium">Domain Target QR:</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setUseGhPages(true)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                useGhPages 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Gunakan URL GitHub Pages Online (Bisa di-scan dari HP/Tablet langsung)"
            >
              <FaGlobe size={11} />
              <span>GitHub Pages (Online)</span>
            </button>
            <button
              type="button"
              onClick={() => setUseGhPages(false)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                !useGhPages 
                  ? 'bg-slate-800 text-white shadow-2xs' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
              title="Gunakan URL Localhost (Khusus perangkat lokal ini)"
            >
              <FaLaptopCode size={11} />
              <span>Localhost</span>
            </button>
          </div>
        </div>

        {/* Tab Selector: QR IGD vs QR Laundry (hidden during print) */}
        <div className="grid grid-cols-2 bg-slate-100 p-2 border-b border-slate-200 text-xs font-bold print:hidden shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('IGD')}
            className={`py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'IGD'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaHospital size={14} />
            <span>1. QR Stasiun Kerja IGD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LAUNDRY')}
            className={`py-2.5 px-3 rounded-2xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'LAUNDRY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaTruckLoading size={14} />
            <span>2. QR Stasiun Kerja Laundry</span>
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center space-y-4 print:p-8 overflow-y-auto">
          <div className={`border-4 border-dashed rounded-3xl p-5 transition-all ${
            activeTab === 'IGD' 
              ? 'border-rose-300 bg-rose-50/40' 
              : 'border-amber-300 bg-amber-50/40'
          }`}>
            
            <div className="inline-block bg-slate-900 text-white px-3.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase mb-2">
              PRIMAYA HOSPITAL • {unitCode}
            </div>

            {/* Role Header Badge */}
            {activeTab === 'IGD' ? (
              <div className="my-1">
                <span className="inline-block bg-rose-600 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
                  🏥 STASIUN KERJA IGD
                </span>
                <h4 className="text-xl font-black text-slate-900 leading-tight mt-1.5">
                  SERAH KOTOR & TERIMA BERSIH
                </h4>
                <p className="text-[11px] text-rose-800 font-medium mt-0.5">
                  Ditempel di Lemari Linen / Meja Perawat {unitName}
                </p>
              </div>
            ) : (
              <div className="my-1">
                <span className="inline-block bg-amber-600 text-white px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide">
                  🧺 STASIUN KERJA LAUNDRY
                </span>
                <h4 className="text-xl font-black text-slate-900 leading-tight mt-1.5">
                  TERIMA KOTOR & SERAH BERSIH
                </h4>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  Ditempel di Gudang Laundry / Dibawa Petugas di Troli
                </p>
              </div>
            )}

            {/* QR Image Box */}
            <div className="bg-white p-3 rounded-2xl shadow-md inline-block my-3 border border-slate-100">
              <img 
                src={qrImageUrl} 
                alt={`QR Akses Linen ${activeTab}`} 
                className="w-48 h-48 mx-auto rounded-xl"
              />
            </div>

            <p className="text-[11px] font-bold text-slate-700 leading-snug">
              📱 SCAN DENGAN KAMERA HP / TABLET
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              {activeTab === 'IGD' 
                ? 'Otomatis membuka mode IGD (Serah Kotor & Terima Bersih)'
                : 'Otomatis membuka mode Laundry (Terima Kotor & Serah Bersih)'}
            </p>
            
            <p className="text-[9px] text-slate-500 mt-2 font-mono break-all bg-white/80 py-1.5 px-2.5 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5">
              {useGhPages ? <FaGlobe className="text-blue-500 shrink-0" size={10} /> : <FaLaptopCode className="text-slate-500 shrink-0" size={10} />}
              <span>{currentUrl}</span>
            </p>
          </div>

          {/* Action buttons (hidden during print) */}
          <div className="flex gap-2 pt-1 print:hidden">
            <button
              onClick={handlePrint}
              className={`flex-1 py-3 px-4 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm ${
                activeTab === 'IGD' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <FaPrint />
              <span>Cetak Label QR {activeTab}</span>
            </button>

            <button
              onClick={handleCopy}
              className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs"
              title="Salin Link URL"
            >
              {copied ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center text-xs"
              title="Buka Link di Tab Baru"
            >
              <FaExternalLinkAlt />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
