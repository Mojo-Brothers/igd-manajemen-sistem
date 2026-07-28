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
      <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-primary to-blue-400"></div>

      {/* Title */}
      <div className="text-center mb-auto pt-6">
        <h2 className="text-2xl xl:text-3xl font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{title}</h2>
        <div className="h-1.5 w-24 bg-primary mx-auto rounded-full opacity-70"></div>
      </div>
      
      {/* Large Name Text */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-4">
        {doctor ? (
          <div className="w-full flex flex-col items-center justify-center">
            <h3 
              className="font-black text-primary leading-[1.1] drop-shadow-sm w-full break-words"
              style={{ fontSize: 'clamp(2.5rem, 4vw, 4.5rem)' }}
            >
              {doctor.name}
            </h3>
            {doctor.role && (
               <p className="text-xl xl:text-2xl text-blue-600/80 font-bold mt-6 tracking-wide uppercase">{doctor.role}</p>
            )}
          </div>
        ) : (
          <div className="w-full opacity-40">
             <h3 className="text-4xl xl:text-5xl font-bold text-gray-500">Tidak Ada<br/>Jadwal</h3>
          </div>
        )}
      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary opacity-5 rounded-full blur-2xl"></div>
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-400 opacity-5 rounded-full blur-2xl"></div>
    </motion.div>
  );
};

export default DoctorCard;
