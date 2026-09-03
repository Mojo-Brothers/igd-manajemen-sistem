import React from 'react';
import { FaTimes, FaPrint, FaQrcode, FaExternalLinkAlt } from 'react-icons/fa';

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
  if (!isOpen) return null;

  // Generate target URL for the unit
  const baseUrl = window.location.origin + window.location.pathname;
  const accessUrl = `${baseUrl}#/linen?unit=${unitCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(accessUrl)}&margin=10`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-150 print:m-0 print:shadow-none print:w-full">
        
        {/* Header (hidden during print) */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FaQrcode className="text-blue-400" />
            <h3 className="font-bold text-base">QR Akses Cepat Lemari</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 text-center space-y-4 print:p-8">
          <div className="border-4 border-dashed border-blue-200 rounded-3xl p-5 bg-blue-50/30">
            <div className="inline-block bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-3">
              PRIMAYA HOSPITAL
            </div>
            <h4 className="text-xl font-black text-slate-900 leading-tight">
              LINENFLOW {unitCode}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">
              {unitName}
            </p>

            <div className="bg-white p-3 rounded-2xl shadow-md inline-block">
              <img 
                src={qrImageUrl} 
                alt={`QR Akses Linen ${unitCode}`} 
                className="w-52 h-52 mx-auto rounded-xl"
              />
            </div>

            <p className="text-[11px] font-bold text-slate-600 mt-4 leading-relaxed">
              📱 SCAN KAMERA HP UNTUK:<br/>
              <span className="text-blue-700">Ambil Linen • Catat Kotor • Cek Stok</span>
            </p>
            <p className="text-[9px] text-slate-400 mt-2 font-mono break-all">
              {accessUrl}
            </p>
          </div>

          {/* Action buttons (hidden during print) */}
          <div className="flex gap-2 pt-2 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
            >
              <FaPrint />
              <span>Cetak Label QR</span>
            </button>
            <a
              href={accessUrl}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors flex items-center justify-center text-sm"
              title="Buka Link"
            >
              <FaExternalLinkAlt />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
