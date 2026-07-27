import { Doctor } from '../types';
import { motion } from 'framer-motion';
import { FaUserMd } from 'react-icons/fa';

interface DoctorCardProps {
  title: string;
  doctor: Doctor | null;
}

const DoctorCard = ({ title, doctor }: DoctorCardProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-3xl p-6 flex flex-col h-full overflow-hidden relative group"
    >
      <div className="bg-primary text-white text-center py-3 px-6 -mx-6 -mt-6 rounded-t-3xl mb-6 shadow-md">
        <h2 className="text-2xl font-bold uppercase tracking-wide">{title}</h2>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {doctor ? (
          <>
            <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-xl mb-6 relative">
              {doctor.imageUrl ? (
                <img 
                  src={doctor.imageUrl} 
                  alt={doctor.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(doctor.name) + '&background=015c80&color=fff&size=256';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-primary">
                  <FaUserMd size={64} />
                </div>
              )}
            </div>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-2 truncate w-full px-4">{doctor.name}</h3>
            <p className="text-xl text-primary font-semibold mb-4">{doctor.role}</p>
            
            <div className={`mt-auto px-6 py-2 rounded-full text-lg font-bold shadow-sm ${
              doctor.status.toLowerCase().includes('bertugas') || doctor.status.toLowerCase().includes('jaga')
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
            }`}>
              {doctor.status}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-50">
             <div className="w-48 h-48 rounded-full border-4 border-dashed border-gray-400 mb-6 flex items-center justify-center">
                <FaUserMd size={64} className="text-gray-400" />
             </div>
             <h3 className="text-2xl font-medium text-gray-500">Tidak Ada Jadwal</h3>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DoctorCard;
