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

      {/* Title Section - Takes Top 1/3 */}
      <div className="h-1/3 flex flex-col items-center justify-center text-center px-4 pt-4 border-b-2 border-primary/10">
        <h2 
          className="font-black text-gray-400 uppercase tracking-[0.1em] mb-4"
          style={{ fontSize: 'clamp(1.5rem, 2.5vw, 3.5rem)', lineHeight: '1.2' }}
        >
          {title}
        </h2>
        <div className="h-2 w-32 bg-primary mx-auto rounded-full opacity-70"></div>
      </div>
      
      {/* Name Section - Takes Bottom 2/3 */}
      <div className="h-2/3 flex flex-col items-center justify-center text-center px-4 relative z-10">
        {doctor ? (
          <div className="w-full flex flex-col items-center justify-center">
            <h3 
              className="font-black text-primary drop-shadow-sm w-full break-words leading-tight"
              style={{ fontSize: 'clamp(3rem, 5vw, 6.5rem)' }}
            >
              {doctor.name}
            </h3>
            {doctor.role && (
               <p 
                 className="text-blue-600/80 font-bold mt-4 tracking-wide uppercase"
                 style={{ fontSize: 'clamp(1.5rem, 2vw, 2.5rem)' }}
               >
                 {doctor.role}
               </p>
            )}
            
            <div className={`mt-8 px-10 py-4 rounded-full font-bold shadow-sm ${
              doctor.status.toLowerCase().includes('bertugas') || doctor.status.toLowerCase().includes('jaga')
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
            }`}
              style={{ fontSize: 'clamp(1.2rem, 1.8vw, 2rem)' }}
            >
              {doctor.status}
            </div>
          </div>
        ) : (
          <div className="w-full opacity-40">
             <h3 
               className="font-bold text-gray-500 leading-tight"
               style={{ fontSize: 'clamp(3rem, 5vw, 6rem)' }}
             >
               Tidak Ada<br/>Jadwal
             </h3>
          </div>
        )}
      </div>

      {/* Decorative Corner Accents */}
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary opacity-5 rounded-full blur-2xl z-0"></div>
      <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-400 opacity-5 rounded-full blur-2xl z-0"></div>
    </motion.div>
  );
};

export default DoctorCard;
