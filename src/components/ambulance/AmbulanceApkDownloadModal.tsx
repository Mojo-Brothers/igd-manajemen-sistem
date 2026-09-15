import React, { useState } from 'react';
import {
  FaTimes,
  FaAndroid,
  FaDownload,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMobileAlt,
  FaShieldAlt,
  FaQrcode,
  FaCopy,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface AmbulanceApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmbulanceApkDownloadModal: React.FC<AmbulanceApkDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Link absolut file APK di public folder
  const apkDownloadPath = '/downloads/primaya-ambulans.apk';
  const fullDownloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${apkDownloadPath}`
    : apkDownloadPath;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    fullDownloadUrl
  )}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullDownloadUrl);
      setCopied(true);
      toast.success('Tautan unduhan APK berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin tautan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-xs flex items-center justify-center shadow-inner">
              <FaAndroid size={26} className="text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 bg-white/20 rounded-full text-white tracking-wide">
                  v1.0.0 Stable
                </span>
                <span className="text-xs text-emerald-100 flex items-center gap-1">
                  <FaShieldAlt size={10} /> Universal Standalone APK
                </span>
              </div>
              <h3 className="text-lg font-extrabold mt-0.5 tracking-tight">
                Aplikasi Android Ekspedisi Ambulans
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Tutup dialog"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Card: Tombol Download & Info File */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-md">
                    OFFICIAL RELEASE
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    Ukuran: ~5.09 MB
                  </span>
                </div>
                <h4 className="text-base font-bold text-gray-900">
                  Primaya Ambulans IGD (.apk)
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed max-w-md">
                  Aplikasi mandiri khusus kru ambulans & perawat IGD. Berjalan dalam mode layar penuh (layar tidak tertutup bar peramban) dan hemat kuota data.
                </p>
              </div>

              {/* Tombol Unduh Utama */}
              <a
                href={apkDownloadPath}
                download="primaya-ambulans.apk"
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all hover:scale-102 active:scale-98 cursor-pointer shrink-0"
              >
                <FaDownload size={16} />
                <span>Unduh File APK</span>
              </a>
            </div>
          </div>

          {/* Fitur QR Code untuk Pengemudi / HP Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center p-4 bg-gray-50 border border-gray-200/80 rounded-2xl">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2">
              <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-200 inline-block">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Unduh APK Android"
                  className="w-36 h-36 rounded-xl object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-[11px] font-bold text-gray-500 mt-2 flex items-center gap-1">
                <FaQrcode size={12} /> Scan dengan Kamera HP
              </p>
            </div>

            <div className="md:col-span-8 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <FaMobileAlt size={16} />
                <span>Pasang Cepat Langsung di Ponsel Sopir / Perawat</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Jika Anda sedang membuka workstation ini di komputer desktop atau laptop IGD, Anda cukup mengarahkan kamera smartphone ke QR code di samping untuk mengunduh APK langsung ke ponsel tanpa kabel data.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-300 flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <FaCopy size={12} className={copied ? 'text-emerald-600' : 'text-gray-500'} />
                  <span>{copied ? 'Tersalin!' : 'Salin Tautan Unduh'}</span>
                </button>
                <a
                  href={apkDownloadPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-white hover:bg-gray-100 text-primary text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <FaExternalLinkAlt size={10} />
                  <span>Buka Tautan Langsung</span>
                </a>
              </div>
            </div>
          </div>

          {/* Panduan Langkah demi Langkah Instalasi */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FaCheckCircle className="text-emerald-600" size={14} />
              Panduan 4 Langkah Instalasi APK di Android
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <p className="font-bold text-gray-800">Unduh Berkas APK</p>
                <p className="text-gray-500 text-[11px]">
                  Tekan tombol unduh atau scan QR code sampai unduhan berkas <code className="bg-gray-200 px-1 rounded">primaya-ambulans.apk</code> selesai.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center font-bold text-[10px]">
                  2
                </span>
                <p className="font-bold text-gray-800">Pilih "Tetap Download"</p>
                <p className="text-gray-500 text-[11px]">
                  Jika Chrome menampilkan peringatan <em>"File might be harmful"</em>, klik <strong>"Tetap Download / Download anyway"</strong> (aman untuk sistem internal RS).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center font-bold text-[10px]">
                  3
                </span>
                <p className="font-bold text-gray-800">Izinkan Sumber Tak Dikenal</p>
                <p className="text-gray-500 text-[11px]">
                  Saat membuka file pertama kali, jika sistem meminta perizinan, aktifkan opsi <strong>"Izinkan dari sumber ini"</strong> (*Allow from this source*).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="w-5 h-5 bg-emerald-600 text-white rounded-full inline-flex items-center justify-center font-bold text-[10px]">
                  4
                </span>
                <p className="font-bold text-gray-800">Tekan "Install / Pasang"</p>
                <p className="text-gray-500 text-[11px]">
                  Ketuk <strong>Install</strong>. Ikon <strong>Primaya Ambulans</strong> akan langsung muncul di layar utama smartphone dan siap dipakai.
                </p>
              </div>
            </div>
          </div>

          {/* Keunggulan Penggunaan Aplikasi Native */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-2.5">
              <FaExclamationTriangle className="text-amber-600 shrink-0 mt-0.5" size={15} />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">Keunggulan Operasional di Lapangan:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
                  <li>Layar penuh (*Immersive*) tanpa bilah peramban yang tertekan secara tidak sengaja.</li>
                  <li>Koneksi real-time langsung ke Firebase Firestore IGD Primaya.</li>
                  <li>Akses cepat dilindungi PIN operasional terpadu.</li>
                  <li>Kompatibel dengan Android versi 8.0 Oreo hingga Android 15.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-gray-500">
            Sistem Informasi Ekspedisi Ambulans IGD Primaya © 2026
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
