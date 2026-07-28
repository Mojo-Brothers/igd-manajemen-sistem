import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { OnCallSchedule, Specialist } from '../types';
import { addOnCallSchedule, updateOnCallSchedule, deleteOnCallSchedule, addSpecialist, updateSpecialist, deleteSpecialist } from '../services/db';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaUserMd, FaHospitalAlt, FaFileExcel, FaDownload } from 'react-icons/fa';

const AdminOnCall = () => {
  const [schedules, setSchedules] = useState<OnCallSchedule[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  
  const [activeTab, setActiveTab] = useState<'schedule' | 'specialist'>('schedule');

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);
  
  const [editingSchedule, setEditingSchedule] = useState<OnCallSchedule | null>(null);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  const fileInputScheduleRef = useRef<HTMLInputElement>(null);
  const fileInputSpecialistRef = useRef<HTMLInputElement>(null);

  // Form Data
  const [scheduleData, setScheduleData] = useState({
    department: '',
    departmentEn: '',
    doctorName: '',
    order: 0
  });

  const [specialistData, setSpecialistData] = useState({
    name: '',
    department: '',
    departmentEn: ''
  });

  useEffect(() => {
    // Fetch Schedules
    const qSchedule = query(collection(db, 'onCallSchedules'), orderBy('order', 'asc'));
    const unsubSchedule = onSnapshot(qSchedule, (snapshot) => {
      setSchedules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnCallSchedule)));
    });

    // Fetch Specialists
    const qSpecialist = query(collection(db, 'specialists'), orderBy('name', 'asc'));
    const unsubSpecialist = onSnapshot(qSpecialist, (snapshot) => {
      setSpecialists(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Specialist)));
    });

    return () => {
      unsubSchedule();
      unsubSpecialist();
    };
  }, []);

  const downloadTemplateSchedule = () => {
    const data = [
      { Department: 'Penyakit Dalam', DepartmentEn: 'Internal Medicine', DoctorName: 'dr. Andi, Sp.PD', Order: 1 },
      { Department: 'Anak', DepartmentEn: 'Pediatric', DoctorName: 'dr. Budi, Sp.A', Order: 2 }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal On Call");
    XLSX.writeFile(wb, "Template_Jadwal_OnCall.xlsx");
  };

  const handleFileUploadSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let addedCount = 0;
        for (const row of data) {
          if (row.Department) {
            await addOnCallSchedule({
              department: row.Department || '',
              departmentEn: row.DepartmentEn || '',
              doctorName: row.DoctorName || '',
              order: parseInt(row.Order) || (schedules.length + addedCount + 1)
            });
            addedCount++;
          }
        }
        toast.success(`${addedCount} Jadwal Departemen berhasil diimport!`);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengimport data. Pastikan format Excel sesuai template.');
      } finally {
        setLoading(false);
        if (fileInputScheduleRef.current) fileInputScheduleRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- Schedule Handlers ---
  const handleOpenScheduleModal = (schedule?: OnCallSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setScheduleData({
        department: schedule.department,
        departmentEn: schedule.departmentEn,
        doctorName: schedule.doctorName,
        order: schedule.order
      });
    } else {
      setEditingSchedule(null);
      setScheduleData({
        department: '',
        departmentEn: '',
        doctorName: '',
        order: schedules.length > 0 ? Math.max(...schedules.map(s => s.order)) + 1 : 1
      });
    }
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingSchedule) {
        await updateOnCallSchedule(editingSchedule.id, scheduleData);
        toast.success('Jadwal departemen berhasil diperbarui');
      } else {
        await addOnCallSchedule(scheduleData);
        toast.success('Departemen baru berhasil ditambahkan');
      }
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (schedule: OnCallSchedule) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus departemen ${schedule.department}?`)) {
      try {
        await deleteOnCallSchedule(schedule.id);
        toast.success('Departemen dihapus');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data');
      }
    }
  };

  const downloadTemplateSpecialist = () => {
    const data = [
      { Departemen: 'Penyakit Dalam', 'Departemen (English)': 'Internal Medicine', 'Nama Dokter': 'dr. Budi Santoso, Sp.PD' },
      { Departemen: 'Anak', 'Departemen (English)': 'Pediatrician', 'Nama Dokter': 'dr. Siti Aminah, Sp.A' }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master Dokter");
    XLSX.writeFile(wb, "Template_Dokter_Spesialis.xlsx");
  };

  const handleFileUploadSpecialist = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let addedCount = 0;
        for (const row of data) {
          if (row['Nama Dokter']) {
            await addSpecialist({
              name: row['Nama Dokter'],
              department: row['Departemen'] || '',
              departmentEn: row['Departemen (English)'] || ''
            });
            addedCount++;
          }
        }
        toast.success(`${addedCount} Master Dokter berhasil diimport!`);
      } catch (error) {
        console.error(error);
        toast.error('Gagal mengimport data. Pastikan format Excel sesuai template.');
      } finally {
        setLoading(false);
        if (fileInputSpecialistRef.current) fileInputSpecialistRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- Specialist Handlers ---
  const handleOpenSpecialistModal = (specialist?: Specialist) => {
    if (specialist) {
      setEditingSpecialist(specialist);
      setSpecialistData({ 
        name: specialist.name,
        department: specialist.department || '',
        departmentEn: specialist.departmentEn || ''
      });
    } else {
      setEditingSpecialist(null);
      setSpecialistData({ name: '', department: '', departmentEn: '' });
    }
    setIsSpecialistModalOpen(true);
  };

  const handleSpecialistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingSpecialist) {
        await updateSpecialist(editingSpecialist.id, specialistData);
        toast.success('Data dokter berhasil diperbarui');
        // Optional: Update existing schedules that use this doctor's old name?
        // Let's skip complex cascading updates for now to keep it simple, 
        // since they mostly just assign names.
      } else {
        await addSpecialist(specialistData);
        toast.success('Dokter spesialis berhasil ditambahkan');
      }
      setIsSpecialistModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecialist = async (specialist: Specialist) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${specialist.name} dari master data?`)) {
      try {
        await deleteSpecialist(specialist.id);
        toast.success('Data dokter dihapus');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 w-fit">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'schedule' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FaHospitalAlt /> Jadwal Departemen
        </button>
        <button
          onClick={() => setActiveTab('specialist')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'specialist' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FaUserMd /> Master Data Dokter
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Penugasan Dokter On-Call</h2>
              <p className="text-sm text-gray-500 mt-1">Atur dokter mana yang sedang bertugas di masing-masing departemen.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button 
                onClick={downloadTemplateSchedule}
                className="w-full sm:w-auto justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
              >
                <FaDownload /> Template
              </button>
              
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputScheduleRef}
                onChange={handleFileUploadSchedule}
              />
              <button 
                onClick={() => fileInputScheduleRef.current?.click()}
                disabled={loading}
                className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
              >
                <FaFileExcel /> Import Excel
              </button>
              
              <button 
                onClick={() => handleOpenScheduleModal()}
                className="w-full sm:w-auto justify-center bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <FaPlus /> Tambah Departemen
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="py-3 px-6 font-semibold w-16 text-center">Urutan</th>
                  <th className="py-3 px-6 font-semibold">Departemen</th>
                  <th className="py-3 px-6 font-semibold">Dokter Bertugas</th>
                  <th className="py-3 px-6 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Belum ada data departemen. Anda dapat men-generate data awal dari halaman Pengaturan.
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6 text-center text-gray-500">{schedule.order}</td>
                      <td className="py-3 px-6">
                        <p className="font-bold text-gray-800">{schedule.department}</p>
                        <p className="text-sm text-gray-500 italic">{schedule.departmentEn}</p>
                      </td>
                      <td className="py-3 px-6">
                        {schedule.doctorName ? (
                          <span className="font-semibold text-primary">{schedule.doctorName}</span>
                        ) : (
                          <span className="text-gray-400 italic">-- Belum ada yang bertugas --</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleOpenScheduleModal(schedule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Tugaskan Dokter"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteSchedule(schedule)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Departemen"
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
      )}

      {activeTab === 'specialist' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Master Data Dokter Spesialis</h2>
              <p className="text-sm text-gray-500 mt-1">Daftarkan nama-nama dokter yang bisa dipilih untuk jadwal on-call.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button 
                onClick={downloadTemplateSpecialist}
                className="w-full sm:w-auto justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
              >
                <FaDownload /> Template
              </button>
              
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputSpecialistRef}
                onChange={handleFileUploadSpecialist}
              />
              <button 
                onClick={() => fileInputSpecialistRef.current?.click()}
                disabled={loading}
                className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
              >
                <FaFileExcel /> Import Excel
              </button>
              
              <button 
                onClick={() => handleOpenSpecialistModal()}
                className="w-full sm:w-auto justify-center bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <FaPlus /> Tambah Dokter
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="py-3 px-6 font-semibold">Nama Lengkap & Gelar</th>
                  <th className="py-3 px-6 font-semibold">Departemen</th>
                  <th className="py-3 px-6 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {specialists.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-gray-500">
                      Belum ada master data dokter. Silakan tambah data baru.
                    </td>
                  </tr>
                ) : (
                  specialists.map((specialist) => (
                    <tr key={specialist.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6 font-medium text-gray-800">{specialist.name}</td>
                      <td className="py-3 px-6">
                        <p className="text-gray-800">{specialist.department || '-'}</p>
                        <p className="text-xs text-gray-500 italic">{specialist.departmentEn}</p>
                      </td>
                      <td className="py-3 px-6 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleOpenSpecialistModal(specialist)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteSpecialist(specialist)}
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
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSchedule ? 'Edit Penugasan' : 'Tambah Departemen'}
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={24} />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Departemen (Indonesia)</label>
                <input 
                  type="text" 
                  required
                  value={scheduleData.department}
                  onChange={e => setScheduleData({...scheduleData, department: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Penyakit Dalam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Departemen (English)</label>
                <input 
                  type="text" 
                  value={scheduleData.departmentEn}
                  onChange={e => setScheduleData({...scheduleData, departmentEn: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Internal Medicine"
                />
              </div>

              <div className="pt-2">
                <label className="block text-sm font-bold text-primary mb-1">Dokter Bertugas</label>
                <select 
                  value={scheduleData.doctorName}
                  onChange={e => {
                    const selectedName = e.target.value;
                    const selectedSpecialist = specialists.find(sp => sp.name === selectedName);
                    if (selectedSpecialist && selectedSpecialist.department) {
                      setScheduleData({
                        ...scheduleData, 
                        doctorName: selectedName,
                        department: selectedSpecialist.department || scheduleData.department,
                        departmentEn: selectedSpecialist.departmentEn || scheduleData.departmentEn
                      });
                    } else {
                      setScheduleData({...scheduleData, doctorName: selectedName});
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-primary/20 bg-blue-50/50 rounded-lg focus:ring-2 focus:ring-primary outline-none text-gray-800 font-medium cursor-pointer"
                >
                  <option value="">-- Kosong --</option>
                  {specialists.map(sp => (
                    <option key={sp.id} value={sp.name}>{sp.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Pilih dari Master Data Dokter. Jika belum ada, tambahkan di tab sebelah.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urutan Tampil</label>
                <input 
                  type="number" 
                  value={scheduleData.order}
                  onChange={e => setScheduleData({...scheduleData, order: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors order-2 sm:order-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto justify-center flex items-center gap-2 bg-primary hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 order-1 sm:order-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FaSave />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Specialist Modal */}
      {isSpecialistModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                {editingSpecialist ? 'Edit Dokter' : 'Tambah Dokter'}
              </h3>
              <button onClick={() => setIsSpecialistModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSpecialistSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
                <input 
                  type="text" 
                  required
                  value={specialistData.name}
                  onChange={e => setSpecialistData({ ...specialistData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Contoh: dr. Budi Santoso, Sp.PD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departemen (Indonesia)</label>
                <input 
                  type="text" 
                  value={specialistData.department}
                  onChange={e => setSpecialistData({ ...specialistData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Contoh: Penyakit Dalam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departemen (English)</label>
                <input 
                  type="text" 
                  value={specialistData.departmentEn}
                  onChange={e => setSpecialistData({ ...specialistData, departmentEn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Contoh: Internist"
                />
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSpecialistModalOpen(false)}
                  className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors order-2 sm:order-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto justify-center flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 order-1 sm:order-2"
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

export default AdminOnCall;
