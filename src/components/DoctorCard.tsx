import { Doctor } from '../types';
import { motion } from 'framer-motion';

interface DoctorCardProps {
  title: string;
  doctor: Doctor | null;
}

const DoctorCard = ({ title, doctor }: DoctorCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-[2.5rem] p-8 flex flex-col h-full relative overflow-hidden shadow-2xl border border-white/40"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.85) 100%)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Top Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-primary to-blue-400 z-10"></div>

      {/* Content Grid (2 Rows to fill entire height) */}
      <div className="flex-1 grid grid-rows-2 w-full h-full relative z-20">
        
        {/* Top Half: Title */}
        <div className="flex flex-col items-center justify-center p-4">
          <h2 className="text-4xl xl:text-5xl 2xl:text-6xl font-black text-gray-400 uppercase tracking-[0.1em] text-center leading-tight mb-6">
            {title}
          </h2>
          <div className="h-2 w-1/2 bg-primary rounded-full opacity-50"></div>
        </div>
        
        {/* Bottom Half: Name & Status */}
        <div className="flex flex-col items-center justify-center p-4">
          {doctor ? (
            <div className="w-full flex flex-col items-center justify-center">
              <h3 
                className="font-black text-primary text-center leading-[1.1] drop-shadow-sm w-full break-words"
                style={{ fontSize: 'clamp(3rem, 6vw, 7rem)' }}
              >
                {doctor.name}
              </h3>
              {doctor.role && (
                 <p className="text-2xl xl:text-4xl text-blue-600/80 font-bold mt-4 tracking-wide uppercase text-center">{doctor.role}</p>
              )}
              
              <div className={`mt-6 px-10 py-4 rounded-full text-2xl xl:text-3xl font-bold shadow-sm ${
                doctor.status.toLowerCase().includes('bertugas') || doctor.status.toLowerCase().includes('jaga')
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
              }`}>
                {doctor.status}
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center opacity-40">
               <h3 className="text-5xl xl:text-6xl 2xl:text-7xl font-bold text-gray-500 text-center leading-tight">Tidak Ada<br/>Jadwal</h3>
            </div>
          )}
        </div>
        
      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary opacity-5 rounded-full blur-2xl"></div>
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-400 opacity-5 rounded-full blur-2xl"></div>
    </motion.div>
  );
};

export default DoctorCard;
