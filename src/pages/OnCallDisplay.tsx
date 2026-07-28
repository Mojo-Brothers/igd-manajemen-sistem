import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { OnCallSchedule } from '../types';

const OnCallDisplay = () => {
  const [schedules, setSchedules] = useState<OnCallSchedule[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const q = query(collection(db, 'onCallSchedules'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnCallSchedule));
      setSchedules(data);
    });
    return () => unsubscribe();
  }, []);

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

  // Actually, we'll just split equally based on array length.
  const col1 = schedules.slice(0, Math.ceil(schedules.length / 2));
  const col2 = schedules.slice(Math.ceil(schedules.length / 2));

  const renderColumnHeader = () => (
    <div className="flex gap-2 mb-2">
      <div className="w-1/2 bg-[#17596b] text-white p-2 rounded text-center border-2 border-white/20">
        <div className="font-bold text-xl tracking-wide">DEPARTEMEN</div>
        <div className="text-xs italic text-blue-100 uppercase tracking-widest">Department</div>
      </div>
      <div className="w-1/2 bg-[#17596b] text-white p-2 rounded text-center border-2 border-white/20">
        <div className="font-bold text-xl tracking-wide">NAMA DOKTER</div>
        <div className="text-xs italic text-blue-100 uppercase tracking-widest">Doctor's Name</div>
      </div>
    </div>
  );

  const renderScheduleRow = (schedule: OnCallSchedule) => (
    <div key={schedule.id} className="flex gap-2 mb-2 flex-1">
      <div className="w-1/2 bg-[#17596b] text-white px-4 py-2 flex flex-col justify-center rounded shadow-sm relative overflow-hidden">
        {/* Glossy effect to mimic acrylic */}
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent"></div>
        <div className="font-bold text-[17px] leading-tight z-10">{schedule.department}</div>
        <div className="text-[11px] text-blue-100 italic z-10">{schedule.departmentEn}</div>
      </div>
      <div className="w-1/2 bg-white text-[#333] px-4 py-2 flex items-center rounded shadow-md border border-gray-200 h-full">
        <div className="font-bold text-[18px]">
          {schedule.doctorName}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#e8eced] flex flex-col items-center py-6 px-12 font-sans relative">
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
        <div className="text-center mb-6">
          <h1 className="text-[#17596b] font-black text-6xl tracking-wider mb-1" style={{ fontFamily: 'Arial, sans-serif' }}>
            JADWAL PANGGILAN
          </h1>
          <h2 className="text-[#17596b] font-medium text-3xl italic tracking-widest">
            Schedule On Call
          </h2>
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
  );
};

export default OnCallDisplay;
