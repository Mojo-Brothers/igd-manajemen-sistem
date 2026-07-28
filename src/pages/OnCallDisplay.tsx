import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { OnCallSchedule } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { motion } from 'framer-motion';
import DigitalClock from '../components/DigitalClock';
import { DEPARTMENTS } from './AdminOnCall';

const OnCallDisplay = () => {
  const { settings, loading: settingsLoading } = useSettings();
  const [manualSchedules, setManualSchedules] = useState<OnCallSchedule[]>([]);
  const [monthlySchedules, setMonthlySchedules] = useState<OnCallSchedule[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const q = query(collection(db, 'onCallSchedules'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnCallSchedule));
      setManualSchedules(data);
    });
    return () => unsubscribe();
  }, []);

  const todayStr = useMemo(() => {
    const yyyy = currentTime.getFullYear();
    const mm = String(currentTime.getMonth() + 1).padStart(2, '0');
    const dd = String(currentTime.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, [currentTime.getDate(), currentTime.getMonth(), currentTime.getFullYear()]);

  useEffect(() => {

    const unsubscribe = onSnapshot(doc(db, 'monthlySchedules', todayStr), (docSnap) => {
      if (docSnap.exists()) {
        const todaySchedule = docSnap.data();
        if (todaySchedule && todaySchedule.schedules) {
          const mapped = todaySchedule.schedules.map((s: any, idx: number) => ({
            id: `monthly-${idx}`,
            department: s.department,
            departmentEn: s.departmentEn,
            doctorName: s.doctorName,
            status: s.status,
            order: idx
          }));
          setMonthlySchedules(mapped);
        } else {
          setMonthlySchedules([]);
        }
      } else {
        setMonthlySchedules([]);
      }
    });

    return () => unsubscribe();
  }, [todayStr]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // update every minute
    return () => clearInterval(timer);
  }, []);

  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  const currentDay = days[currentTime.getDay()];
  
  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  // Combine logic: Manual override wins
  const finalSchedules = [...monthlySchedules];
  manualSchedules.forEach(manual => {
    const existingIndex = finalSchedules.findIndex(s => s.department === manual.department);
    if (existingIndex >= 0) {
      finalSchedules[existingIndex] = { 
        ...finalSchedules[existingIndex], 
        doctorName: manual.doctorName, 
        status: manual.status,
        overrideReason: manual.overrideReason,
        originalDoctorName: manual.originalDoctorName
      };
    } else {
      if (DEPARTMENTS.includes(manual.department)) {
        finalSchedules.push(manual);
      }
    }
  });

  // Actually, we'll just split equally based on array length.
  const col1 = finalSchedules.slice(0, Math.ceil(finalSchedules.length / 2));
  const col2 = finalSchedules.slice(Math.ceil(finalSchedules.length / 2));

  const renderColumnHeader = () => (
    <div className="flex gap-[clamp(4px,0.8vh,8px)] mb-[clamp(4px,0.8vh,8px)]">
      <div className="w-1/2 bg-[#17596b] text-white p-[clamp(4px,0.8vh,8px)] rounded text-center border-2 border-white/20">
        <div className="font-bold text-[clamp(12px,1.8vh,20px)] tracking-wide leading-tight">DEPARTEMEN</div>
        <div className="text-[clamp(8px,1vh,12px)] italic text-blue-100 uppercase tracking-widest leading-tight">Department</div>
      </div>
      <div className="w-1/2 bg-[#17596b] text-white p-[clamp(4px,0.8vh,8px)] rounded text-center border-2 border-white/20">
        <div className="font-bold text-[clamp(12px,1.8vh,20px)] tracking-wide leading-tight">NAMA DOKTER</div>
        <div className="text-[clamp(8px,1vh,12px)] italic text-blue-100 uppercase tracking-widest leading-tight">Doctor's Name</div>
      </div>
    </div>
  );

  const renderScheduleRow = (schedule: OnCallSchedule) => {
    const status = schedule.status || 'Sedang Bertugas';
    const statusColor = 
      status === 'Sedang Operasi' ? 'bg-red-500' :
      status === 'Visite Ruangan' ? 'bg-blue-500' :
      status === 'Sedang Istirahat' ? 'bg-amber-500' :
      'bg-green-500';

    return (
      <div key={schedule.id} className="flex gap-[clamp(2px,0.6vh,8px)] mb-[clamp(1px,0.4vh,6px)] flex-1 min-h-0">
        <div className="w-1/2 bg-[#17596b] text-white px-[clamp(4px,0.8vh,12px)] py-[clamp(1px,0.3vh,6px)] flex flex-col justify-center rounded shadow-sm relative overflow-hidden">
          {/* Glossy effect to mimic acrylic */}
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent"></div>
          <div className="font-bold text-[clamp(8px,1.4vh,16px)] leading-[1.1] z-10 line-clamp-2" title={schedule.department}>{schedule.department}</div>
          <div className="text-[clamp(6px,1vh,11px)] text-blue-100 italic z-10 truncate opacity-90 leading-none mt-[0.5px]">{schedule.departmentEn}</div>
        </div>
        <div className="w-1/2 bg-white text-[#333] pl-[clamp(6px,0.8vh,12px)] pr-[clamp(4px,0.5vh,8px)] py-[clamp(1px,0.3vh,6px)] flex items-center justify-between rounded shadow-md border border-gray-200 h-full overflow-hidden gap-1">
          <div className="flex flex-col flex-1 min-w-0 justify-center">
            <div className="font-bold text-[clamp(8px,1.4vh,16px)] leading-[1.1] truncate" title={schedule.doctorName}>
              {schedule.doctorName}
            </div>
            {schedule.originalDoctorName && schedule.originalDoctorName !== schedule.doctorName && (
              <div className="text-[clamp(6px,1vh,11px)] text-gray-500 italic truncate mt-[0.5px] leading-none font-normal">
                Menggantikan: {schedule.originalDoctorName} {schedule.overrideReason ? `(${schedule.overrideReason})` : ''}
              </div>
            )}
          </div>
          <div className={`${statusColor} text-white text-[clamp(5px,0.8vh,10px)] font-bold uppercase tracking-wider px-[clamp(3px,0.6vh,8px)] py-[clamp(1px,0.3vh,4px)] rounded-full whitespace-nowrap shadow-sm shrink-0 self-center`}>
            {status}
          </div>
        </div>
      </div>
    );
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-[#e8eced] flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-[#17596b]"></div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col font-sans">
      <div className="flex-1 w-full bg-[#e8eced] flex flex-col items-center py-6 px-12 relative overflow-hidden">
        {/* Screw mockups in corners to mimic acrylic board */}
      <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-gray-300 shadow-inner border-2 border-gray-400 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      </div>
      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-gray-300 shadow-inner border-2 border-gray-400 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      </div>
      <div className="absolute bottom-4 left-4 w-6 h-6 rounded-full bg-gray-300 shadow-inner border-2 border-gray-400 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      </div>
      <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-gray-300 shadow-inner border-2 border-gray-400 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
      </div>

      {/* Main Container - The "Acrylic Board" */}
      <div className="w-full max-w-[1800px] h-full bg-white/80 backdrop-blur-sm rounded-xl shadow-2xl border border-white/50 p-6 flex flex-col">
        
        {/* Header Section */}
        <div className="relative flex justify-center items-center mb-6 min-h-[100px]">
          <div className="absolute left-0">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Hospital Logo" className="h-20 object-contain" />
            ) : (
              <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Hospital Logo" className="h-20 object-contain" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-[#17596b] font-black text-6xl tracking-wider mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>
              JADWAL PANGGILAN
            </h1>
            <h2 className="text-[#17596b] font-medium text-3xl italic tracking-widest">
              Schedule On Call
            </h2>
          </div>
          <div className="absolute right-0">
            <DigitalClock />
          </div>
        </div>

        {/* Date Section */}
        <div className="w-full max-w-5xl mx-auto border-[3px] border-[#17596b] rounded-lg p-2 mb-8 flex justify-between items-center bg-white shadow-sm">
          <div className="flex items-center gap-4 w-1/2 justify-center border-r-2 border-[#17596b]/20 px-2">
            <div className="flex flex-col items-end pr-2">
              <span className="text-[#17596b] font-bold text-xl whitespace-nowrap">Hari :</span>
              <span className="text-[#17596b] text-sm italic pr-4">Day</span>
            </div>
            <div className="bg-white border-2 border-gray-200 px-6 py-1 rounded shadow-inner min-w-[180px] text-center">
              <span className="text-2xl font-bold text-gray-800 uppercase tracking-widest">{currentDay}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 w-1/2 justify-center px-2">
            <div className="flex flex-col items-end pr-2">
              <span className="text-[#17596b] font-bold text-xl whitespace-nowrap">Tanggal :</span>
              <span className="text-[#17596b] text-sm italic pr-4">Date</span>
            </div>
            <div className="bg-white border-2 border-gray-200 px-3 py-1 rounded shadow-inner flex gap-1 items-center justify-center">
              {formatDate(currentTime).split('').map((char, i) => (
                <span key={i} className={`text-2xl font-bold text-gray-800 text-center ${char === '-' ? 'text-gray-400 px-1' : 'bg-gray-100 w-9 py-0.5 rounded border border-gray-200 shadow-sm'}`}>
                  {char}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content 2 Columns */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Column 1 */}
          <div className="w-1/2 flex flex-col h-full">
            {renderColumnHeader()}
            <div className="flex-1 overflow-hidden flex flex-col justify-between">
              {col1.map(renderScheduleRow)}
            </div>
          </div>

          {/* Column 2 */}
          <div className="w-1/2 flex flex-col h-full">
            {renderColumnHeader()}
            <div className="flex-1 overflow-hidden flex flex-col justify-between">
              {col2.map(renderScheduleRow)}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Footer / Running Text */}
      <footer className="h-16 bg-[#17596b] text-white flex items-center overflow-hidden shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] relative z-10">
        <div className="bg-blue-900 h-full px-6 flex items-center font-bold text-xl whitespace-nowrap z-20 shadow-xl">
          INFORMASI
        </div>
        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          <motion.div 
            className="whitespace-nowrap text-2xl font-medium tracking-wide absolute"
            animate={{ x: ["100vw", "-100%"] }}
            transition={{
              repeat: Infinity,
              duration: Math.max(25, (settings?.runningText?.length || 50) * 0.15),
              ease: "linear",
            }}
          >
            {settings?.runningText 
              ? settings.runningText.split('\n').filter(t => t.trim() !== '').map((text, i, arr) => (
                  <span key={i}>
                    {text}
                    {i < arr.length - 1 && <span className="inline-block w-[25vw] text-center text-blue-300">✦</span>}
                  </span>
                ))
              : 'Selamat Datang di Instalasi Gawat Darurat Primaya Hospital'}
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default OnCallDisplay;
