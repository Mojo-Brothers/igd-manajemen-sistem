import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { updateSettings, addOnCallSchedule } from '../services/db';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import toast from 'react-hot-toast';
import { FaSave, FaRedo } from 'react-icons/fa';

const DEFAULT_DEPARTMENTS = [
  { dept: 'Penyakit Dalam', en: 'Internal Medicine' },
  { dept: 'Anak', en: 'Pediatric' },
  { dept: 'Paru', en: 'Pulmonology' },
  { dept: 'Mata', en: 'Ophthalmology (Eye)' },
  { dept: 'THT', en: 'ENT (Ear - Nose - Throat)' },
  { dept: 'Kulit dan Kelamin', en: 'Dermatology & Venereology' },
  { dept: 'Urologi', en: 'Urology' },
  { dept: 'Saraf', en: 'Neurology' },
  { dept: 'Anestesi', en: 'Anesthesiology' },
  { dept: 'Kebidanan dan Kandungan', en: 'Obstetrics and Gynecology' },
  { dept: 'Jantung dan Pembuluh Darah', en: 'Heart and Vascular' },
  { dept: 'Konsultan Hematologi Onkologi Medik', en: 'Hematology & Oncology Consultant' },
  { dept: 'Konsultan Endokrin, Metabolik & Diabetes', en: 'Endocrin, Metabolism & Diabetes Consultant' },
  { dept: 'Bedah Vaskuler', en: 'Vascular Surgery' },
  { dept: 'Bedah Digestif', en: 'Digestive Surgery' },
  { dept: 'Bedah Anak', en: 'Pediatric Surgery' },
  { dept: 'Bedah Umum', en: 'General Surgery' },
  { dept: 'Bedah Tulang', en: 'Orthopedic Surgery' },
  { dept: 'Bedah Saraf', en: 'Neuro Surgery' },
  { dept: 'Bedah Plastik Rekonstruksi dan Estetika', en: 'Plastic, Reconstructive & Aesthetic Surgery' },
  { dept: 'Bedah Onkologi', en: 'Oncology Surgery' },
  { dept: 'Bedah Mulut', en: 'Oral & Maxillo Facial Surgery' },
  { dept: 'Bedah Thoraks dan Kardiovaskuler', en: 'Thorax & Cardiovascular Surgery' },
  { dept: 'Konsultan (Ginjal Hipertensi)', en: 'Nephrology Consultant' },
  { dept: 'Konsultan (Gastroenterologi)', en: 'Gastroenterology Consultant' },
  { dept: 'Konsultan (Bedah Tulang Belakang)', en: 'Spine Surgery Consultant' },
  { dept: 'Ortopedi - Konsultan Hip & Knee', en: 'Orthopedics Hip & Knee Consultant' },
  { dept: 'Radiologi', en: 'Radiology' },
  { dept: 'Obstetri Ginekologi - Konsultan Onkologi Ginekologi', en: 'Obstetrics Gynecology - Gynecology Oncology Consultant' },
  { dept: 'Jantung Pembuluh Darah Konsultan Aritmia', en: 'Cardiology Arrhythmia Consultant' }
];

const Settings = () => {
  const { settings, loading: contextLoading } = useSettings();
  
  const [formData, setFormData] = useState({
    hospitalName: '',
    runningText: '',
    themeColor: '',
    secondaryColor: '',
    logoUrl: '',
    theme: 'modern' as 'classic' | 'modern',
    copyright: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        hospitalName: settings.hospitalName || '',
        runningText: settings.runningText || '',
        themeColor: settings.themeColor || '#015c80',
        secondaryColor: settings.secondaryColor || '#F5F8FA',
        logoUrl: settings.logoUrl || '',
        theme: settings.theme || 'modern',
        copyright: settings.copyright || ''
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalLogoUrl = formData.logoUrl;

      await updateSettings({
        ...formData,
        logoUrl: finalLogoUrl
      });
      
      toast.success('Pengaturan berhasil disimpan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetOnCall = async () => {
    if (!window.confirm('PERINGATAN: Ini akan menghapus semua jadwal departemen On-Call saat ini dan mengembalikannya ke daftar bawaan sistem (30 departemen kosong). Anda yakin?')) return;
    
    setResetting(true);
    toast.loading('Menghapus data lama...', { id: 'reset' });
    try {
      // 1. Delete all existing
      const snap = await getDocs(collection(db, 'onCallSchedules'));
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'onCallSchedules', d.id)));
      await Promise.all(deletePromises);
      
      toast.loading('Memasukkan data bawaan...', { id: 'reset' });
      // 2. Add defaults
      for (let i = 0; i < DEFAULT_DEPARTMENTS.length; i++) {
        await addOnCallSchedule({
          department: DEFAULT_DEPARTMENTS[i].dept,
          departmentEn: DEFAULT_DEPARTMENTS[i].en,
          doctorName: '', // empty by default
          order: i + 1
        });
      }
      toast.success('Berhasil di-reset ke daftar bawaan!', { id: 'reset' });
    } catch (error) {
      console.error(error);
      toast.error('Gagal me-reset jadwal on-call.', { id: 'reset' });
    } finally {
      setResetting(false);
    }
  };

  if (contextLoading) return <div className="p-8 text-center">Memuat pengaturan...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Pengaturan Tampilan TV</h2>
        <p className="text-sm text-gray-500 mt-1">Ubah identitas rumah sakit dan pengaturan visual layar display IGD.</p>
      </div>
      
      <div className="p-4 sm:p-6 bg-red-50 border-b border-red-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-red-800">Reset Data On-Call</h3>
          <p className="text-sm text-red-600">Tekan tombol ini untuk men-generate 30 departemen bawaan untuk Layar On-Call.</p>
        </div>
        <button 
          onClick={handleResetOnCall}
          disabled={resetting}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {resetting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaRedo />}
          Reset ke Bawaan
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Rumah Sakit</label>
              <input 
                type="text" 
                value={formData.hospitalName}
                onChange={e => setFormData({...formData, hospitalName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Running Text (Teks Berjalan)</label>
              <textarea 
                value={formData.runningText}
                onChange={e => setFormData({...formData, runningText: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                rows={3}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warna Utama (Primary)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formData.themeColor}
                    onChange={e => setFormData({...formData, themeColor: e.target.value})}
                    className="w-12 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 font-mono">{formData.themeColor}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warna Latar (Secondary)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formData.secondaryColor}
                    onChange={e => setFormData({...formData, secondaryColor: e.target.value})}
                    className="w-12 h-12 p-1 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 font-mono">{formData.secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo Rumah Sakit</label>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="https://... (URL Gambar Logo)"
                  value={formData.logoUrl}
                  onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
                <p className="text-xs text-gray-500">
                  Kosongkan jika Anda ingin menggunakan file <b>logo.png</b> bawaan dari sistem. Jika Anda meng-host gambar di tempat lain (misal: GitHub/Imgur), masukkan URL-nya di atas.
                </p>
                {formData.logoUrl && (
                  <div className="mt-2 p-2 border border-gray-100 rounded-lg inline-block bg-gray-50">
                    <img src={formData.logoUrl} alt="Preview" className="h-16 object-contain" />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teks Copyright</label>
              <input 
                type="text" 
                value={formData.copyright}
                onChange={e => setFormData({...formData, copyright: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tema Tampilan IGD</label>
              <select 
                value={formData.theme}
                onChange={e => setFormData({...formData, theme: e.target.value as 'classic' | 'modern'})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
              >
                <option value="modern">Tema Modern (Teks Besar & Minimalis)</option>
                <option value="classic">Tema Klasik (Lengkap dengan Foto)</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto justify-center flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
