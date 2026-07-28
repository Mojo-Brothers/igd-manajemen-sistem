import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Doctor } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import Clock from '../components/Clock';
import DoctorCard from '../components/DoctorCard';
import DoctorCardClassic from '../components/DoctorCardClassic';
import { motion } from 'framer-motion';

const Display = () => {
  const { settings, loading: settingsLoading } = useSettings();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Record<string, string | null>>({
    doctor1: null,
    doctor2: null,
    coordinator: null,
    pic: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to doctors
    const unsubscribeDoctors = onSnapshot(query(collection(db, 'doctors')), (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
      setDoctors(docsData);
    });

    // Listen to slots
    const unsubscribeSlots = onSnapshot(collection(db, 'slots'), (snapshot) => {
      const slotsData: Record<string, string | null> = {};
      snapshot.forEach((doc) => {
        slotsData[doc.id] = doc.data().doctorId;
      });
      
      // If slots are empty, provide defaults
      if (Object.keys(slotsData).length === 0) {
        setSlots({
          doctor1: null,
          doctor2: null,
          coordinator: null,
          pic: null,
        });
      } else {
        setSlots({
          doctor1: slotsData['doctor1'] || null,
          doctor2: slotsData['doctor2'] || null,
          coordinator: slotsData['coordinator'] || null,
          pic: slotsData['pic'] || null,
        });
      }
      setLoading(false);
    });

    return () => {
      unsubscribeDoctors();
      unsubscribeSlots();
    };
  }, []);

  if (settingsLoading || loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-primary"></div>
      </div>
    );
  }

  const getDoctorForSlot = (slotId: string) => {
    const docId = slots[slotId];
    if (!docId) return null;
    return doctors.find(d => d.id === docId) || null;
  };

  return (
    <div 
      className="h-screen w-screen overflow-hidden flex flex-col bg-secondary"
      style={{
        '--color-primary': settings?.themeColor || '#015c80',
        '--color-secondary': settings?.secondaryColor || '#F5F8FA',
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="h-32 bg-white shadow-md flex items-center justify-between px-10 shrink-0 relative z-10">
        <div className="flex items-center gap-6">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Hospital Logo" className="h-20 object-contain" />
          ) : (
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Hospital Logo" className="h-20 object-contain" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          )}
          <h1 className="text-4xl font-black text-primary tracking-tight max-w-3xl leading-tight uppercase">
            {settings?.hospitalName || 'PRIMAYA HOSPITAL'}<br/>
            <span className="text-3xl font-bold text-gray-600">IGD DOCTOR SCHEDULE</span>
          </h1>
        </div>
        <Clock />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 pb-4 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 opacity-5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className={`grid h-full ${settings?.theme === 'classic' ? 'grid-cols-4 gap-8' : 'grid-rows-4 gap-6 px-12 py-2'}`}>
          {settings?.theme === 'classic' ? (
            <>
              <DoctorCardClassic title="Dokter Jaga 1" doctor={getDoctorForSlot('doctor1')} />
              <DoctorCardClassic title="Dokter Jaga 2" doctor={getDoctorForSlot('doctor2')} />
              <DoctorCardClassic title="Koordinator IGD" doctor={getDoctorForSlot('coordinator')} />
              <DoctorCardClassic title="Penanggung Jawab" doctor={getDoctorForSlot('pic')} />
            </>
          ) : (
            <>
              <DoctorCard title="Dokter Jaga 1" doctor={getDoctorForSlot('doctor1')} />
              <DoctorCard title="Dokter Jaga 2" doctor={getDoctorForSlot('doctor2')} />
              <DoctorCard title="Koordinator IGD" doctor={getDoctorForSlot('coordinator')} />
              <DoctorCard title="Penanggung Jawab" doctor={getDoctorForSlot('pic')} />
            </>
          )}
        </div>
      </main>

      {/* Footer / Running Text */}
      <footer className="h-16 bg-primary text-white flex items-center overflow-hidden shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] relative z-10">
        <div className="bg-blue-900 h-full px-6 flex items-center font-bold text-xl whitespace-nowrap z-20 shadow-xl">
          INFORMASI
        </div>
        <div className="flex-1 overflow-hidden h-full flex items-center relative">
          <motion.div 
            className="whitespace-nowrap text-2xl font-medium tracking-wide absolute left-full"
            animate={{ left: ["100%", "-200%"] }}
            transition={{
              repeat: Infinity,
              duration: 30,
              ease: "linear",
            }}
          >
            {settings?.runningText || 'Selamat Datang di Instalasi Gawat Darurat Primaya Hospital'}
          </motion.div>
        </div>
      </footer>
    </div>
  );
};

export default Display;
