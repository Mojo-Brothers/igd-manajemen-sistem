import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { updateSettings } from '../services/db';
import { uploadDoctorImage } from '../services/storage'; // Reusing for logo
import toast from 'react-hot-toast';
import { FaSave, FaImage } from 'react-icons/fa';

const Settings = () => {
  const { settings, loading: contextLoading } = useSettings();
  
  const [formData, setFormData] = useState({
    hospitalName: '',
    runningText: '',
    themeColor: '',
    secondaryColor: '',
    logoUrl: '',
    copyright: ''
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        hospitalName: settings.hospitalName || '',
        runningText: settings.runningText || '',
        themeColor: settings.themeColor || '#015c80',
        secondaryColor: settings.secondaryColor || '#F5F8FA',
        logoUrl: settings.logoUrl || '',
        copyright: settings.copyright || ''
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalLogoUrl = formData.logoUrl;
      
      if (logoFile) {
        toast.loading('Mengunggah logo...', { id: 'upload' });
        finalLogoUrl = await uploadDoctorImage(logoFile);
        toast.dismiss('upload');
      }

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

  if (contextLoading) return <div className="p-8 text-center">Memuat pengaturan...</div>;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Pengaturan Tampilan TV</h2>
        <p className="text-sm text-gray-500 mt-1">Ubah identitas rumah sakit dan pengaturan visual layar display IGD.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {logoFile ? (
                      <div className="text-primary font-medium text-sm flex flex-col items-center">
                        <FaImage size={32} className="mb-2" />
                        File dipilih: {logoFile.name}
                      </div>
                    ) : formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Current Logo" className="h-24 object-contain mb-2" />
                    ) : (
                      <>
                        <FaImage size={32} className="text-gray-400 mb-2" />
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk upload (Opsional)</span></p>
                        <p className="text-xs text-gray-500 text-center px-4">Jika dikosongkan, aplikasi akan menggunakan file <b>logo.png</b> dari folder public/github.</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
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
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
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
