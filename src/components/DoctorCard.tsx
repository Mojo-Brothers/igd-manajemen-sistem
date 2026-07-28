import { Doctor } from '../types';
import { motion } from 'framer-motion';

interface DoctorCardProps {
  title: string;
  doctor: Doctor | null;
}

const DoctorCard = ({ title, doctor }: DoctorCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl p-6 flex flex-row items-center relative overflow-hidden shadow-xl border border-white/40 w-full h-full"
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.85) 100%)',
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Left Accent Border */}
      <div className="absolute top-0 left-0 w-3 h-full bg-primary"></div>

      {/* Title Section (Left) */}
      <div className="w-1/4 h-full flex flex-col justify-center border-r-2 border-gray-100 pl-6 pr-6">
        <h2 className="text-2xl xl:text-3xl font-black text-primary uppercase tracking-widest leading-tight">{title}</h2>
      </div>
      
      {/* Name and Role (Center) */}
      <div className="flex-1 flex flex-col justify-center px-10">
        {doctor ? (
          <>
            <h3 
              className="font-black text-primary leading-[1.1] drop-shadow-sm truncate"
              style={{ fontSize: 'clamp(2.5rem, 4vw, 4rem)' }}
            >
              {doctor.name}
            </h3>
            {doctor.role && (
               <p className="text-xl text-blue-600/80 font-bold mt-2 tracking-wide uppercase">{doctor.role}</p>
            )}
          </>
        ) : (
          <div className="opacity-40">
             <h3 className="text-4xl font-bold text-gray-500">Tidak Ada Jadwal</h3>
          </div>
        )}
      </div>

      {/* Status Badge (Right) */}
      {doctor && (
        <div className="w-1/4 max-w-xs flex justify-end pr-4">
          <div className={`px-6 py-4 rounded-2xl text-xl font-bold shadow-sm text-center w-full ${
            doctor.status.toLowerCase().includes('bertugas') || doctor.status.toLowerCase().includes('jaga')
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
          }`}>
            {doctor.status}
          </div>
        </div>
      )}

      {/* Decorative Accents */}
      <div className="absolute -bottom-16 right-32 w-48 h-48 bg-primary opacity-5 rounded-full blur-2xl pointer-events-none"></div>
    </motion.div>
  );
};

export default DoctorCard;
