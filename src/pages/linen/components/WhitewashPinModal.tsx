import React, { useState, useRef, useEffect } from 'react';
import { 
  verifyLinenWhitewashPin, 
  setLinenWhitewashPin,
  DEFAULT_WHITEWASH_PIN 
} from '../../../services/linenService';
import { 
  FaTimes, 
  FaLock, 
  FaKey, 
  FaBroom, 
  FaEye, 
  FaEyeSlash, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaArrowLeft
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface WhitewashPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  initialMode?: 'AUTH' | 'SETTINGS';
  totalPhysical: number;
  unitName: string;
}

export const WhitewashPinModal: React.FC<WhitewashPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'AUTH',
  totalPhysical,
  unitName
}) => {
  const [mode, setMode] = useState<'AUTH' | 'SETTINGS'>(initialMode);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // Settings mode form states
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [savingSettings, setSavingSettings] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setPinDigits(['', '', '', '', '', '']);
      setIsError(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      
      // Auto-focus first PIN box in AUTH mode after render
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0]?.focus();
        }
      }, 100);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle individual digit input
  const handleDigitChange = (index: number, val: string) => {
    // Only accept numeric characters
    const cleanVal = val.replace(/\D/g, '');

    if (!cleanVal) {
      const newDigits = [...pinDigits];
      newDigits[index] = '';
      setPinDigits(newDigits);
      setIsError(false);
      return;
    }

    // If multiple digits pasted or typed
    if (cleanVal.length > 1) {
      handlePasteDigits(cleanVal);
      return;
    }

    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal;
    setPinDigits(newDigits);
    setIsError(false);

    // Auto-advance to next box
    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle pasting full 6 digits
  const handlePasteDigits = (pastedText: string) => {
    const numericChars = pastedText.replace(/\D/g, '').slice(0, 6).split('');
    if (numericChars.length === 0) return;

    const newDigits = ['', '', '', '', '', ''];
    numericChars.forEach((ch, i) => {
      if (i < 6) newDigits[i] = ch;
    });
    setPinDigits(newDigits);
    setIsError(false);

    // Focus on the next empty box or last box
    const nextEmptyIdx = newDigits.findIndex(d => !d);
    if (nextEmptyIdx !== -1) {
      inputRefs.current[nextEmptyIdx]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Submit and verify authorization PIN
  const handleVerifyAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = pinDigits.join('');

    if (pinString.length !== 6) {
      toast.error('Silakan masukkan lengkap 6 digit PIN');
      setIsError(true);
      return;
    }

    setLoading(true);
    setIsError(false);
    try {
      const isValid = await verifyLinenWhitewashPin(pinString);
      if (!isValid) {
        setIsError(true);
        toast.error('PIN Otorisasi Salah! Akses Pemutihan Ditolak.');
        setPinDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // PIN is correct, execute the whitewash action
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Galat verifikasi PIN pemutihan:', error);
      toast.error(error.message || 'Terjadi kesalahan saat memverifikasi PIN');
    } finally {
      setLoading(false);
    }
  };

  // Save new PIN in settings mode
  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(currentPinInput.trim())) {
      toast.error('PIN saat ini harus terdiri dari 6 angka numerik');
      return;
    }

    if (!/^\d{6}$/.test(newPinInput.trim())) {
      toast.error('PIN baru harus terdiri dari 6 angka numerik');
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      toast.error('Konfirmasi PIN baru tidak cocok');
      return;
    }

    setSavingSettings(true);
    try {
      // Check current PIN validity first
      const isCurrentValid = await verifyLinenWhitewashPin(currentPinInput.trim());
      if (!isCurrentValid) {
        toast.error('PIN saat ini salah! Tidak dapat memperbarui PIN.');
        return;
      }

      await setLinenWhitewashPin(newPinInput.trim(), `Administrator ${unitName}`);
      toast.success('PIN Otorisasi Pemutihan berhasil diperbarui!');
      
      // Return to AUTH mode with empty digits
      setMode('AUTH');
      setPinDigits(['', '', '', '', '', '']);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan PIN baru');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col">
        
        {/* Header Modal */}
        <div className={`p-5 text-white flex items-center justify-between transition-colors ${
          mode === 'AUTH' ? 'bg-amber-950' : 'bg-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              mode === 'AUTH' ? 'bg-amber-500 text-amber-950' : 'bg-blue-600 text-white'
            }`}>
              {mode === 'AUTH' ? <FaLock size={16} /> : <FaKey size={16} />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                {mode === 'AUTH' ? 'Security Authorization' : 'Admin Security Settings'}
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight">
                {mode === 'AUTH' ? 'Otorisasi PIN Pemutihan' : 'Pengaturan PIN Pemutihan'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Modal Body: MODE AUTH */}
        {mode === 'AUTH' && (
          <form onSubmit={handleVerifyAuth} className="p-5 sm:p-6 space-y-4">
            
            {/* Warning Callout */}
            <div className="p-3.5 bg-amber-50 border-2 border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
              <FaExclamationTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-black block text-amber-900 text-xs uppercase tracking-wide">
                  Tindakan Penyelarasan Total (100% Lemari)
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Seluruh <strong>{totalPhysical} pcs</strong> sirkulasi linen akan di-reset menjadi <strong>100% Bersih di Lemari {unitName}</strong>. 
                  Semua catatan kotor, laundry, dan pemakaian akan diset ke 0.
                </p>
              </div>
            </div>

            {/* PIN Input Instruction & Box */}
            <div className="space-y-2 text-center pt-1">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Masukkan 6 Angka PIN Otorisasi:
              </label>

              {/* 6-box PIN digit inputs */}
              <div 
                className={`flex justify-center items-center gap-2 sm:gap-2.5 my-3 ${
                  isError ? 'animate-shake' : ''
                }`}
                onPaste={(e) => {
                  e.preventDefault();
                  handlePasteDigits(e.clipboardData.getData('text'));
                }}
              >
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type={isMasked ? 'password' : 'text'}
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-black text-xl sm:text-2xl rounded-2xl border-2 outline-none transition-all ${
                      isError
                        ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-200'
                        : digit
                        ? 'border-amber-500 bg-amber-50/50 text-slate-900 shadow-2xs'
                        : 'border-slate-300 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                    }`}
                  />
                ))}
              </div>

              {/* Toggle Mask & Default PIN Info */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                >
                  {isMasked ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
                  <span>{isMasked ? 'Tampilkan Angka' : 'Sembunyikan Angka'}</span>
                </button>

                <span className="text-[11px] text-slate-400">
                  PIN Default: <strong className="text-slate-600 font-mono">{DEFAULT_WHITEWASH_PIN}</strong>
                </span>
              </div>
            </div>

            {/* Quick Link to Settings Mode */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Ingin mengubah PIN otorisasi?</span>
              <button
                type="button"
                onClick={() => setMode('SETTINGS')}
                className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
              >
                <FaKey size={10} />
                <span>Pengaturan PIN</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading || pinDigits.some(d => !d)}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaBroom size={13} />
                    <span>Verifikasi & Eksekusi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Modal Body: MODE SETTINGS */}
        {mode === 'SETTINGS' && (
          <form onSubmit={handleSaveNewPin} className="p-5 sm:p-6 space-y-4">
            
            {/* Info callout */}
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-start gap-2.5">
              <FaCheckCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-blue-900">
                  Keamanan Akses Pemutihan
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  PIN 6 angka ini melindungi aksi pemutihan dari eksekusi tanpa sengaja. 
                  Jika belum pernah diubah, PIN default adalah <strong className="font-mono">{DEFAULT_WHITEWASH_PIN}</strong>.
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Saat Ini (Lama) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="Masukkan 6 angka PIN saat ini"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-600 font-mono font-bold text-sm tracking-widest outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PIN Baru (6 Angka) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="Masukkan 6 angka PIN baru"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-600 font-mono font-bold text-sm tracking-widest outline-none transition-colors"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Harus tepat 6 angka numerik (0-9).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi PIN Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="Ulangi 6 angka PIN baru"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-blue-600 font-mono font-bold text-sm tracking-widest outline-none transition-colors"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMode('AUTH')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FaArrowLeft size={11} />
                <span>Kembali</span>
              </button>
              <button
                type="submit"
                disabled={savingSettings || newPinInput.length !== 6 || confirmPinInput.length !== 6}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {savingSettings ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaKey size={12} />
                    <span>Simpan PIN Baru</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
