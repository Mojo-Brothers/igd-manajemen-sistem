import React from 'react';
import { LinenStock } from '../../../types/linen';
import { getStatusColorClasses, evaluateDiscrepancy } from '../../../utils/linenUtils';
import { FaBoxes, FaExclamationTriangle, FaCheckCircle, FaHandHoldingHeart } from 'react-icons/fa';

interface StockCardProps {
  stock: LinenStock;
  onPickupClick: (stock: LinenStock) => void;
  canPickup: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onPickupClick, canPickup }) => {
  const statusColors = getStatusColorClasses(stock.status);
  const discrepancy = evaluateDiscrepancy(stock);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:shadow-md relative overflow-hidden">
      {/* Top Accent Stripe based on status */}
      <div className={`absolute top-0 left-0 right-0 h-2 ${stock.status === 'AMAN' ? 'bg-emerald-500' : stock.status === 'MENIPIS' ? 'bg-amber-500' : 'bg-rose-500'}`} />

      <div>
        {/* Header: Name & Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
              <FaBoxes />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-800 tracking-tight">{stock.name}</h3>
              <p className="text-xs text-gray-400 font-medium">Total Aset IGD: <span className="font-bold text-gray-700">{stock.totalAsset} pcs</span></p>
            </div>
          </div>
          
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-xs border ${statusColors.bg}`}>
            {stock.status === 'AMAN' ? <FaCheckCircle size={13} /> : <FaExclamationTriangle size={13} />}
            <span>{stock.status}</span>
          </div>
        </div>

        {/* Big Number Highlight: STOK BERSIH */}
        <div className="my-5 p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-100/80 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-blue-600/80 block mb-1">
              Stok Bersih (Di Lemari)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight leading-none">
                {stock.clean}
              </span>
              <span className="text-sm font-semibold text-gray-400">pcs</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2.5 py-1 rounded-lg font-bold ${stock.clean === 0 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
              {stock.clean > 0 ? 'Siap Digunakan' : 'Kosong'}
            </span>
          </div>
        </div>

        {/* Stock Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-4">
          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-center">
            <span className="text-[11px] font-medium text-gray-500 block mb-1">Digunakan</span>
            <span className="text-lg sm:text-xl font-extrabold text-indigo-600 block leading-tight">{stock.used}</span>
            <span className="text-[10px] text-gray-400">pasien</span>
          </div>

          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-center">
            <span className="text-[11px] font-medium text-gray-500 block mb-1">Kotor</span>
            <span className="text-lg sm:text-xl font-extrabold text-amber-600 block leading-tight">{stock.dirty}</span>
            <span className="text-[10px] text-gray-400">di IGD</span>
          </div>

          <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-center">
            <span className="text-[11px] font-medium text-gray-500 block mb-1">Laundry</span>
            <span className="text-lg sm:text-xl font-extrabold text-blue-500 block leading-tight">{stock.laundry}</span>
            <span className="text-[10px] text-gray-400">proses</span>
          </div>
        </div>

        {/* Discrepancy warning alert if any */}
        {!discrepancy.isBalanced && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
            <FaExclamationTriangle size={16} className="shrink-0 text-rose-500" />
            <div>
              <span>STOCK DISCREPANCY: Selisih {Math.abs(discrepancy.discrepancy)} {stock.name}</span>
              <p className="text-[10px] font-normal text-rose-600">Total terhitung: {discrepancy.currentSum} dari aset {discrepancy.totalAsset}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Button: Big & Touch Friendly for Nurses */}
      <div className="mt-5 pt-4 border-t border-gray-100">
        <button
          type="button"
          disabled={!canPickup || stock.clean <= 0}
          onClick={() => onPickupClick(stock)}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
            stock.clean > 0 && canPickup
              ? 'bg-primary hover:bg-blue-800 text-white shadow-primary/25 cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          <FaHandHoldingHeart size={18} />
          <span>Ambil {stock.name}</span>
        </button>
      </div>
    </div>
  );
};
