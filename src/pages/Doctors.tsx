import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Doctor } from '../types';
import { addDoctor, updateDoctor, deleteDoctor, updateDoctorSlot } from '../services/db';
import { uploadDoctorImage, deleteDoctorImage } from '../services/storage';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaImage } from 'react-icons/fa';

const Doctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Record<string, string | null>>({
    doctor1: null,
    doctor2: null,
    coordinator: null,
    pic: null,
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'Dokter Umum',
    status: 'Sedang Bertugas',
    order: 0,
    isActive: true,
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribeDoctors = onSnapshot(query(collection(db, 'doctors'), orderBy('order', 'asc')), (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
      setDoctors(docsData);
    });

    const unsubscribeSlots = onSnapshot(collection(db, 'slots'), (snapshot) => {
      const slotsData: Record<string, string | null> = {};
      snapshot.forEach((doc) => {
        slotsData[doc.id] = doc.data().doctorId;
      });
      setSlots({
        doctor1: slotsData['doctor1'] || null,
        doctor2: slotsData['doctor2'] || null,
        coordinator: slotsData['coordinator'] || null,
        pic: slotsData['pic'] || null,
      });
    });

    return () => {
      unsubscribeDoctors();
      unsubscribeSlots();
    };
  }, []);

  const handleOpenModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        role: doctor.role,
        status: doctor.status,
        order: doctor.order,
        isActive: doctor.isActive,
        imageUrl: doctor.imageUrl
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        name: '',
        role: 'Dokter Umum',
        status: 'Sedang Bertugas',
        order: doctors.length,
        isActive: true,
        imageUrl: ''
      });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDoctor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalImageUrl = formData.imageUrl;
      
      if (imageFile) {
        toast.loading('Mengunggah foto...', { id: 'upload' });
        finalImageUrl = await uploadDoctorImage(imageFile);
        
        // If updating and new image is uploaded, delete old image
        if (editingDoctor?.imageUrl && editingDoctor.imageUrl !== finalImageUrl) {
          await deleteDoctorImage(editingDoctor.imageUrl);
        }
        toast.dismiss('upload');
      }

      const doctorData = {
        ...formData,
        imageUrl: finalImageUrl
      };

      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, doctorData);
        toast.success('Data dokter berhasil diperbarui');
      } else {
        await addDoctor(doctorData);
        toast.success('Dokter baru berhasil ditambahkan');
      }
      handleCloseModal();
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${doctor.name}?`)) {
      try {
        await deleteDoctor(doctor.id);
        if (doctor.imageUrl) {
          await deleteDoctorImage(doctor.imageUrl);
        }
        
        // Clear from slots if assigned
        Object.entries(slots).forEach(async ([slotId, docId]) => {
          if (docId === doctor.id) {
            await updateDoctorSlot(slotId, null);
          }
        });
        
        toast.success('Dokter berhasil dihapus');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus dokter');
      }
    }
  };

  const handleSlotChange = async (slotId: string, doctorId: string) => {
    try {
      await updateDoctorSlot(slotId, doctorId === '' ? null : doctorId);
      toast.success('Jadwal tampilan berhasil diubah');
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengubah jadwal');
    }
  };

  return (
    <div className="space-y-8">
      {/* Slot Assignment Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-blue-50/50">
          <h2 className="text-xl font-bold text-gray-800">Tampilan Saat Ini (Layar TV)</h2>
          <p className="text-sm text-gray-500 mt-1">Pilih dokter yang akan ditampilkan di masing-masing posisi pada layar IGD.</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'doctor1', label: 'Dokter Jaga 1' },
            { id: 'doctor2', label: 'Dokter Jaga 2' },
            { id: 'coordinator', label: 'Koordinator IGD' },
            { id: 'pic', label: 'Penanggung Jawab' },
          ].map((slot) => (
            <div key={slot.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-2">{slot.label}</label>
              <select 
                value={slots[slot.id] || ''}
                onChange={(e) => handleSlotChange(slot.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white outline-none"
              >
                <option value="">-- Kosong --</option>
                {doctors.filter(d => d.isActive).map(doctor => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Doctor List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Daftar Dokter</h2>
            <p className="text-sm text-gray-500 mt-1">Kelola data seluruh dokter IGD di sini.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <FaPlus /> Tambah Dokter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                <th className="py-3 px-6 font-semibold">Foto</th>
                <th className="py-3 px-6 font-semibold">Nama Dokter</th>
                <th className="py-3 px-6 font-semibold">Jabatan</th>
                <th className="py-3 px-6 font-semibold">Status</th>
                <th className="py-3 px-6 font-semibold text-center">Aktif</th>
                <th className="py-3 px-6 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Belum ada data dokter. Silakan tambah data baru.
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                        {doctor.imageUrl ? (
                          <img src={doctor.imageUrl} alt={doctor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FaImage />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6 font-medium text-gray-800">{doctor.name}</td>
                    <td className="py-3 px-6 text-gray-600">{doctor.role}</td>
                    <td className="py-3 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        doctor.status.toLowerCase().includes('bertugas') 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {doctor.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className={`inline-block w-3 h-3 rounded-full ${doctor.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </td>
                    <td className="py-3 px-6 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(doctor)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        onClick={() => handleDelete(doctor)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingDoctor ? 'Edit Data Dokter' : 'Tambah Dokter Baru'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="dr. Budi Santoso, Sp.EM"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan / Spesialisasi</label>
                    <input 
                      type="text" 
                      required
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Dokter Umum IGD"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Ketersediaan</label>
                    <select 
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                    >
                      <option value="Sedang Bertugas">Sedang Bertugas</option>
                      <option value="Standby On Call">Standby On Call</option>
                      <option value="Tidak Bertugas">Tidak Bertugas</option>
                      <option value="Cuti">Cuti</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 text-primary rounded focus:ring-primary"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Aktif (Bisa dipilih untuk tampil)</label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto Dokter</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {imageFile ? (
                            <div className="text-primary font-medium text-sm flex flex-col items-center">
                              <FaImage size={32} className="mb-2" />
                              {imageFile.name}
                            </div>
                          ) : formData.imageUrl ? (
                            <img src={formData.imageUrl} alt="Preview" className="h-24 w-24 object-cover rounded-full mb-2" />
                          ) : (
                            <>
                              <FaImage size={32} className="text-gray-400 mb-2" />
                              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klik untuk upload foto</span></p>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              setImageFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urutan (Sort Order)</label>
                    <input 
                      type="number" 
                      value={formData.order}
                      onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
