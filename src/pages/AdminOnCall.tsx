import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { OnCallSchedule, Specialist, MonthlyScheduleItem } from '../types';
import { addOnCallSchedule, updateOnCallSchedule, deleteOnCallSchedule, addSpecialist, updateSpecialist, deleteSpecialist, saveMonthlySchedules } from '../services/db';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaUserMd, FaHospitalAlt, FaFileExcel, FaDownload } from 'react-icons/fa';
import Select from 'react-select';

const AdminOnCall = () => {
  const [schedules, setSchedules] = useState<OnCallSchedule[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  
  const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<'schedule' | 'specialist' | 'monthly'>('schedule');
  const [monthlyPreview, setMonthlyPreview] = useState<MonthlyScheduleItem[]>([]);
  const [todayMonthlySchedule, setTodayMonthlySchedule] = useState<MonthlyScheduleItem | null>(null);

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);
  
  const [editingSchedule, setEditingSchedule] = useState<OnCallSchedule | null>(null);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  const fileInputSpecialistRef = useRef<HTMLInputElement>(null);
  const fileInputMonthlyRef = useRef<HTMLInputElement>(null);

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

    // Fetch Today's Monthly Schedule
    const yyyy = new Date().getFullYear();
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const dd = String(new Date().getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    
    const unsubMonthly = onSnapshot(doc(db, 'monthlySchedules', todayStr), (docSnap) => {
      if (docSnap.exists()) {
        setTodayMonthlySchedule(docSnap.data() as MonthlyScheduleItem);
      } else {
        setTodayMonthlySchedule(null);
      }
    });

    return () => {
      unsubSchedule();
      unsubSpecialist();
      unsubMonthly();
    };
  }, []);

  useEffect(() => {
    // We no longer read from local storage on load.
    // Preview will only show the most recently uploaded data in this session.
  }, []);

  // --- Schedule Handlers ---
  const handleOpenScheduleModal = (departmentName: string, existingOverride?: OnCallSchedule) => {
    if (existingOverride) {
      setEditingSchedule(existingOverride);
      setScheduleData({
        department: existingOverride.department,
        departmentEn: existingOverride.departmentEn,
        doctorName: existingOverride.doctorName,
        order: existingOverride.order
      });
    } else {
      setEditingSchedule(null);
      setScheduleData({
        department: departmentName,
        departmentEn: '',
        doctorName: '',
        order: DEPARTMENTS.indexOf(departmentName) + 1
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
    if (window.confirm(`Apakah Anda yakin ingin menghapus override untuk departemen ${schedule.department}? Jadwal akan kembali mengikuti jadwal bulanan.`)) {
      try {
        await deleteOnCallSchedule(schedule.id);
        toast.success('Override dihapus');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus override');
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
        setSelectedSpecialists(prev => prev.filter(id => id !== specialist.id));
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data');
      }
    }
  };

  const handleBulkDeleteSpecialists = async () => {
    if (selectedSpecialists.length === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedSpecialists.length} dokter terpilih?`)) {
      setLoading(true);
      try {
        await Promise.all(selectedSpecialists.map(id => deleteSpecialist(id)));
        setSelectedSpecialists([]);
        toast.success(`${selectedSpecialists.length} dokter berhasil dihapus`);
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus data bulk');
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Monthly Schedule Handlers ---
  const DEPARTMENTS = [
    'Obstetri dan Ginekologi',
    'Anak',
    'Penyakit Dalam',
    'Penyakit Dalam (Konsultan Gastroentero-Hepatologi)',
    'Penyakit Dalam (Konsultan Endokrin, Metabolik, dan Diabetes)',
    'Jantung dan Pembuluh Darah',
    'Telinga Hidung Tenggorok - Bedah Kepala Leher',
    'Pulmonologi dan Kedokteran Respirasi',
    'Neurologi',
    'Mata',
    'Urologi',
    'Bedah Umum',
    'Bedah Digestif',
    'Orthopaedi dan Traumatologi',
    'Bedah Saraf',
    'Bedah Vaskular dan Endovaskular',
    'Orthopaedi (Konsultan Tulang Belakang)',
    'Kedokteran Fisik dan Rehabilitasi',
    'Dermatologi dan Venereologi',
    'Bedah Onkologi',
    'Radiologi',
    'Bedah Toraks Kardiak dan Vaskular'
  ];

  const downloadTemplateMonthly = () => {
    const data: Record<string, string>[] = [];
    const dummyObj: Record<string, string> = { Tanggal: '2026-08-01' };
    DEPARTMENTS.forEach(dep => {
      dummyObj[dep] = '';
    });
    data.push(dummyObj);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Bulanan");
    XLSX.writeFile(wb, "Template_Jadwal_Bulanan.xlsx");
  };

  const parseDateFromExcel = (excelDate: any): string => {
    if (!excelDate) return '';
    if (typeof excelDate === 'number') {
      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    }
    return String(excelDate);
  };

  const handleFileUploadMonthly = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { raw: false, dateNF: 'yyyy-mm-dd' }) as any[];

        if (data.length === 0) {
          toast.error('File kosong.');
          setLoading(false);
          return;
        }

        // Validate Headers
        const firstRow = data[0];
        const headers = Object.keys(firstRow);
        if (!headers.includes('Tanggal')) {
          toast.error('Gagal: Kolom "Tanggal" tidak ditemukan.');
          setLoading(false);
          return;
        }
        for (const dep of DEPARTMENTS) {
          if (!headers.includes(dep)) {
            toast.error(`Gagal: Kolom departemen "${dep}" tidak ditemukan di file Excel.`);
            setLoading(false);
            return;
          }
        }

        const newMonthlySchedules: MonthlyScheduleItem[] = [];

        // Parse each row
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rawDate = row['Tanggal'];
          const dateStr = parseDateFromExcel(rawDate);
          
          if (!dateStr) continue;

          const daySchedules = [];
          for (const dep of DEPARTMENTS) {
            const doctorName = row[dep] ? String(row[dep]).trim() : '';
            if (doctorName) {
              const matchedSpecialist = specialists.find(s => s.name.toLowerCase() === doctorName.toLowerCase());
              if (!matchedSpecialist) {
                toast.error(`Baris ${i + 2}, Kolom ${dep}, Nama Dokter: "${doctorName}" tidak ditemukan pada Master Dokter. Import dibatalkan.`);
                setLoading(false);
                if (fileInputMonthlyRef.current) fileInputMonthlyRef.current.value = '';
                return;
              }
              daySchedules.push({
                department: dep,
                departmentEn: matchedSpecialist.departmentEn || '',
                doctorName: matchedSpecialist.name,
                specialistId: matchedSpecialist.id
              });
            }
          }
          newMonthlySchedules.push({
            date: dateStr,
            schedules: daySchedules
          });
        }

        const proceedSave = async () => {
          try {
            await saveMonthlySchedules(newMonthlySchedules);
            setMonthlyPreview(newMonthlySchedules);
            toast.success('Jadwal Bulanan berhasil disimpan ke Firebase Firestore.');
          } catch (e) {
            console.error(e);
            toast.error('Gagal menyimpan jadwal ke server.');
          }
        };

        // We can just proceed save without checking local preview since we save to Firestore.
        // Or if we want to confirm, we could ask every time.
        if (window.confirm(`Apakah Anda yakin ingin mengimport ${newMonthlySchedules.length} hari jadwal ke sistem? Ini akan menimpa jadwal sebelumnya pada tanggal yang sama.`)) {
          proceedSave();
        } else {
          setLoading(false);
          if (fileInputMonthlyRef.current) fileInputMonthlyRef.current.value = '';
        }

      } catch (error) {
        console.error(error);
        toast.error('Terjadi kesalahan saat membaca file Excel.');
      } finally {
        setLoading(false);
        if (fileInputMonthlyRef.current) fileInputMonthlyRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
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
          <FaHospitalAlt /> Jadwal Hari Ini
        </button>
        <button
          onClick={() => setActiveTab('specialist')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'specialist' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FaUserMd /> Master Data Dokter
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors ${
            activeTab === 'monthly' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FaFileExcel /> Jadwal Bulanan
        </button>
      </div>

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Dashboard Jadwal Hari Ini</h2>
              <p className="text-sm text-gray-500 mt-1">Lihat jadwal yang sedang tampil di layar TV. Anda bisa melakukan perubahan mendadak (override) dari sini.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                <FaHospitalAlt /> {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                  <th className="py-3 px-6 font-semibold w-16 text-center">No</th>
                  <th className="py-3 px-6 font-semibold">Departemen</th>
                  <th className="py-3 px-6 font-semibold">Dokter Bertugas</th>
                  <th className="py-3 px-6 font-semibold text-center">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {DEPARTMENTS.map((dep, index) => {
                  const overrideSched = schedules.find(s => s.department === dep);
                  const monthlySched = todayMonthlySchedule?.schedules?.find(s => s.department === dep);
                  
                  const activeDoctor = overrideSched?.doctorName || monthlySched?.doctorName || '';
                  const activeDepEn = overrideSched?.departmentEn || monthlySched?.departmentEn || '';
                  
                  const isOverride = !!overrideSched;

                  return (
                    <tr key={dep} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-6 text-center text-gray-500">{index + 1}</td>
                      <td className="py-3 px-6">
                        <p className="font-bold text-gray-800">{dep}</p>
                        {activeDepEn && <p className="text-sm text-gray-500 italic">{activeDepEn}</p>}
                      </td>
                      <td className="py-3 px-6">
                        {activeDoctor ? (
                          <span className="font-semibold text-primary">{activeDoctor}</span>
                        ) : (
                          <span className="text-gray-400 italic">-- Kosong --</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {isOverride ? (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            Override
                          </span>
                        ) : monthlySched ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            Jadwal Bulanan
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">
                            Tidak Ada
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => handleOpenScheduleModal(dep, overrideSched)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ubah Dokter (Override)"
                        >
                          <FaEdit />
                        </button>
                        {isOverride && (
                          <button 
                            onClick={() => handleDeleteSchedule(overrideSched)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Override (Kembali ke Jadwal Bulanan)"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              
              {selectedSpecialists.length > 0 && (
                <button 
                  onClick={handleBulkDeleteSpecialists}
                  disabled={loading}
                  className="w-full sm:w-auto justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
                >
                  <FaTrash /> Hapus ({selectedSpecialists.length})
                </button>
              )}

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
                  <th className="py-3 px-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                      checked={specialists.length > 0 && selectedSpecialists.length === specialists.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedSpecialists(specialists.map(s => s.id));
                        else setSelectedSpecialists([]);
                      }}
                    />
                  </th>
                  <th className="py-3 px-6 font-semibold">Nama Lengkap & Gelar</th>
                  <th className="py-3 px-6 font-semibold">Departemen</th>
                  <th className="py-3 px-6 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {specialists.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Belum ada master data dokter. Silakan tambah data baru.
                    </td>
                  </tr>
                ) : (
                  specialists.map((specialist) => (
                    <tr key={specialist.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer w-4 h-4"
                          checked={selectedSpecialists.includes(specialist.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedSpecialists([...selectedSpecialists, specialist.id]);
                            else setSelectedSpecialists(selectedSpecialists.filter(id => id !== specialist.id));
                          }}
                        />
                      </td>
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

      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Jadwal Bulanan</h2>
              <p className="text-sm text-gray-500 mt-1">Upload jadwal sebulan sekaligus dari Excel. Akan otomatis tampil sesuai tanggal.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button 
                onClick={downloadTemplateMonthly}
                className="w-full sm:w-auto justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
              >
                <FaDownload /> Export Template XLSX
              </button>
              
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                ref={fileInputMonthlyRef}
                onChange={handleFileUploadMonthly}
              />
              <button 
                onClick={() => fileInputMonthlyRef.current?.click()}
                disabled={loading}
                className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50"
              >
                <FaFileExcel /> Import Jadwal Bulanan
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Preview Upload Terakhir ({monthlyPreview.length} hari)</h3>
            <div className="overflow-x-auto border border-gray-100 rounded-lg max-h-96">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100 sticky top-0 z-10">
                    <th className="py-3 px-6 font-semibold whitespace-nowrap bg-gray-50">Tanggal</th>
                    {DEPARTMENTS.map(dep => (
                      <th key={dep} className="py-3 px-6 font-semibold whitespace-nowrap bg-gray-50">{dep}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyPreview.length === 0 ? (
                    <tr>
                      <td colSpan={DEPARTMENTS.length + 1} className="py-8 text-center text-gray-500">
                        Belum ada preview. Silakan import Excel untuk melihat jadwal yang baru di-upload.
                      </td>
                    </tr>
                  ) : (
                    monthlyPreview.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-sm">
                        <td className="py-2 px-6 font-medium text-gray-800">{item.date}</td>
                        {DEPARTMENTS.map(dep => {
                          const sched = item.schedules.find(s => s.department === dep);
                          return (
                            <td key={dep} className="py-2 px-6 text-gray-600">
                              {sched ? sched.doctorName : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">
                Ubah Dokter (Override)
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes size={24} />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Departemen</label>
                <input 
                  type="text" 
                  readOnly
                  value={scheduleData.department}
                  className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Departemen (English) <span className="text-xs text-gray-400 font-normal">(Opsional)</span></label>
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
                <Select 
                  options={specialists.map(sp => ({ value: sp.name, label: sp.name }))}
                  value={
                    scheduleData.doctorName 
                      ? { value: scheduleData.doctorName, label: scheduleData.doctorName }
                      : null
                  }
                  onChange={(selectedOption) => {
                    const selectedName = selectedOption ? selectedOption.value : '';
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
                  placeholder="-- Ketik nama untuk mencari --"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{ 
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    control: (base, state) => ({
                      ...base,
                      padding: '4px',
                      borderRadius: '0.5rem',
                      borderColor: state.isFocused ? '#17596b' : 'rgba(23, 89, 107, 0.2)',
                      backgroundColor: 'rgba(239, 246, 255, 0.5)',
                      boxShadow: state.isFocused ? '0 0 0 2px #17596b' : 'none',
                      '&:hover': {
                        borderColor: 'rgba(23, 89, 107, 0.4)'
                      }
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected ? '#17596b' : state.isFocused ? 'rgba(23, 89, 107, 0.1)' : 'white',
                      color: state.isSelected ? 'white' : '#1f2937',
                      cursor: 'pointer',
                      '&:active': {
                        backgroundColor: '#17596b',
                        color: 'white'
                      }
                    })
                  }}
                  className="text-gray-800 font-medium"
                />
                <p className="text-xs text-gray-500 mt-1">Pilih dari Master Data Dokter. Jika belum ada, tambahkan di tab sebelah.</p>
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
