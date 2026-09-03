import React from 'react';
import { LinenTransaction } from '../../../types/linen';
import { FaHistory, FaHandHoldingHeart, FaHandsWash, FaTruckLoading, FaEdit, FaUserCheck } from 'react-icons/fa';

interface DailyActivityListProps {
  transactions: LinenTransaction[];
  loading?: boolean;
}

export const DailyActivityList: React.FC<DailyActivityListProps> = ({ transactions, loading }) => {
  const getIcon = (type: LinenTransaction['transactionType']) => {
    switch (type) {
      case 'NURSE_PICKUP':
        return <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><FaHandHoldingHeart size={13} /></div>;
      case 'DIRTY_COLLECTION':
        return <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><FaHandsWash size={13} /></div>;
      case 'LAUNDRY_RETURN':
        return <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0"><FaTruckLoading size={13} /></div>;
      case 'STOCK_CORRECTION':
        return <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0"><FaEdit size={13} /></div>;
      default:
        return <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0"><FaUserCheck size={13} /></div>;
    }
  };

  const formatTime = (trx: LinenTransaction) => {
    if (!trx.timestamp) return '--:--';
    try {
      const date = (trx.timestamp as any).toDate ? (trx.timestamp as any).toDate() : new Date((trx.timestamp as any).seconds * 1000);
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center font-bold">
            <FaHistory size={16} />
          </div>
          <div>
            <h3 className="font-bold text-base text-gray-800">Aktivitas Hari Ini</h3>
            <p className="text-xs text-gray-400">Pencatatan real-time seluruh mutasi linen IGD</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold">
          {transactions.length} transaksi
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 animate-pulse">Memuat riwayat transaksi...</div>
      ) : transactions.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          Belum ada aktivitas transaksi hari ini.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto pr-1">
          {transactions.map((trx) => (
            <div key={trx.id} className="py-3 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                {getIcon(trx.transactionType)}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800">{trx.userName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
                      {trx.userRole} • Shift {trx.shift}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-0.5">{trx.notes}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-gray-700 block">{formatTime(trx)}</span>
                <span className="text-[10px] text-gray-400">WIB</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
