import React, { useState, useRef, useEffect } from 'react';
import { 
  verifyLinenLaundryPin, 
  setLinenLaundryPin,
  DEFAULT_LAUNDRY_PIN 
} from '../../../services/linenService';
import { 
  FaLock, 
  FaKey, 
  FaHospital, 
  FaEye, 
  FaEyeSlash, 
  FaArrowLeft, 
  FaBoxes,
  FaShieldAlt
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

interface LaundryPinGateProps {
  onUnlock: () => void;
  unitName?: string;
}

export const LaundryPinGate: React.FC<LaundryPinGateProps> = ({
  onUnlock,
  unitName = 'IGD & Gudang'
}) => {
  const [mode, setMode] = useState<'AUTH' | 'SETTINGS'>('AUTH');
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

  useEffect(() => {
    // Focus first input box on load
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [mode]);

  // Handle single digit change
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');

    if (!cleanVal) {
      const newDigits = [...pinDigits];
      newDigits[index] = '';
      setPinDigits(newDigits);
      setIsError(false);
      return;
    }

    if (cleanVal.length > 1) {
      handlePasteDigits(cleanVal);
      return;
    }

    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal;
    setPinDigits(newDigits);
    setIsError(false);

    if (index < 5 && cleanVal) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
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

    const nextEmptyIdx = newDigits.findIndex(d => !d);
    if (nextEmptyIdx !== -1) {
      inputRefs.current[nextEmptyIdx]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  // Verify PIN submission
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = pinDigits.join('');

    if (pinString.length !== 6) {
      toast.error('Silakan masukkan lengkap 6 digit PIN Akses Laundry');
      setIsError(true);
      return;
    }

    setLoading(true);
    setIsError(false);
    try {
      const isValid = await verifyLinenLaundryPin(pinString);
      if (!isValid) {
        setIsError(true);
        toast.error('PIN Akses Laundry Salah! Akses stasiun ditolak.');
        setPinDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // PIN valid, remember in sessionStorage
      try {
        sessionStorage.setItem('linen_laundry_auth', 'true');
      } catch (e) {
        console.warn('Unable to write to sessionStorage:', e);
      }

      toast.success('PIN Terverifikasi! Stasiun Kerja Laundry terbuka.');
      onUnlock();
    } catch (error: any) {
      console.error('Galat verifikasi PIN laundry:', error);
      toast.error(error.message || 'Gagal memverifikasi PIN Laundry');
    } finally {
      setLoading(false);
    }
  };

  // Handle saving new PIN in settings mode
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
      const isCurrentValid = await verifyLinenLaundryPin(currentPinInput.trim());
      if (!isCurrentValid) {
        toast.error('PIN saat ini salah! Tidak dapat memperbarui PIN.');
        return;
      }

      await setLinenLaundryPin(newPinInput.trim(), `Petugas Laundry ${unitName}`);
      toast.success('PIN Akses Stasiun Laundry berhasil diperbarui!');

      // Reset form and switch to AUTH mode
      setMode('AUTH');
      setPinDigits(['', '', '', '', '', '']);
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (error: any) {
      toast.error(error.message || 'Gagal memperbarui PIN Laundry');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <FaLock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Stasiun Terproteksi PIN
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  6-Digit
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight mt-0.5">
                {mode === 'AUTH' ? 'Stasiun Kerja Laundry' : 'Pengaturan PIN Laundry'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Primaya Hospital • Pelayanan Gudang & Runner
              </p>
            </div>
          </div>
        </div>

        {/* MODE: AUTHENTICATION */}
        {mode === 'AUTH' && (
          <form onSubmit={handleVerifyPin} className="p-6 space-y-5">
            
            {/* Context callout */}
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
              <FaShieldAlt size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-amber-900">
                  Otorisasi Petugas Gudang & Runner
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Halaman ini berisi aksi operasional penerimaan kotor, pengiriman linen bersih, dan penyesuaian stok gudang. 
                  Masukkan PIN 6 angka untuk membuka stasiun.
                </p>
              </div>
            </div>

            {/* PIN Input Section */}
            <div className="space-y-2 text-center pt-1">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Masukkan 6 Angka PIN Akses:
              </label>

              {/* 6-box input */}
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

              {/* Mask toggle & default info */}
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
                  PIN Default: <strong className="text-slate-600 font-mono">{DEFAULT_LAUNDRY_PIN}</strong>
                </span>
              </div>
            </div>

            {/* Quick action button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || pinDigits.some(d => !d)}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaBoxes size={14} />
                    <span>Buka Stasiun Kerja Laundry</span>
                  </>
                )}
              </button>
            </div>

            {/* Settings & Back Navigation Footers */}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">Ingin mengubah PIN Laundry?</span>
                <button
                  type="button"
                  onClick={() => setMode('SETTINGS')}
                  className="text-blue-700 hover:text-blue-900 font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <FaKey size={10} />
                  <span>Pengaturan PIN</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <Link
                  to="/linen"
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FaArrowLeft size={11} />
                  <span>Kembali ke Lemari IGD</span>
                </Link>
                <Link
                  to="/admin"
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <FaHospital size={11} />
                  <span>Panel Admin</span>
                </Link>
              </div>
            </div>

          </form>
        )}

        {/* MODE: SETTINGS */}
        {mode === 'SETTINGS' && (
          <form onSubmit={handleSaveNewPin} className="p-6 space-y-4">
            
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-start gap-2.5">
              <FaShieldAlt size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-blue-900">
                  Ubah PIN Akses Stasiun Laundry
                </span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  PIN ini membatasi akses ke stasiun kerja Laundry. Masukkan PIN saat ini untuk otorisasi perubahan PIN baru.
                </p>
              </div>
            </div>

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
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-mono font-bold text-sm tracking-widest outline-none transition-colors"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-mono font-bold text-sm tracking-widest outline-none transition-colors"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 font-mono font-bold text-sm tracking-widest outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMode('AUTH')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FaArrowLeft size={11} />
                <span>Batal</span>
              </button>
              <button
                type="submit"
                disabled={savingSettings || newPinInput.length !== 6 || confirmPinInput.length !== 6}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition-all cursor-pointer"
              >
                {savingSettings ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaKey size={12} />
                    <span>Simpan PIN Laundry</span>
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
