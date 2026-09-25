import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { formatCurrency } from '../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  BookOpen, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';

export const JournalView: React.FC = () => {
  const { 
    trades, 
    deleteTrade, 
    settings, 
    userProfile, 
    mt5Data,
    assignedAccountId,
    isMT5Loading,
    refreshMT5Data
  } = useJournal();

  const [filterPair, setFilterPair] = useState<string>('ALL');
  const [filterOutcome, setFilterOutcome] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);

  // Filtered trades
  const filteredTrades = trades.filter((trade) => {
    if (filterPair !== 'ALL' && trade.pair !== filterPair) return false;
    if (filterOutcome !== 'ALL' && trade.outcome !== filterOutcome) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPair = trade.pair.toLowerCase().includes(q);
      const matchStrategy = trade.strategy?.toLowerCase().includes(q);
      const matchNotes = trade.notes?.toLowerCase().includes(q);
      return matchPair || matchStrategy || matchNotes;
    }
    return true;
  });

  const availablePairs = Array.from(new Set(trades.map(t => t.pair)));

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header with Live MT5 Status */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-[#0F0F0F] flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#0F0F0F]" />
            <span>Jurnal Entry Trading</span>
          </h2>
          <p className="text-xs text-[#737373]">
            {trades.length} Total trade tercatat {userProfile ? '(Live MT5 Sync)' : '(Mode Tamu)'}
          </p>
        </div>

        {/* Live MT5 Indicator & Refresh */}
        <div className="flex items-center space-x-2">
          {assignedAccountId && mt5Data?.isConnected ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono-num font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MT5 #{assignedAccountId}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#F7F7F5] text-[#737373] border border-[#E5E5E2] text-[11px] font-semibold">
              <span>Auto-Sync MT5 🟢</span>
            </div>
          )}

          {userProfile && (
            <button
              onClick={() => refreshMT5Data()}
              disabled={isMT5Loading}
              title="Refresh Jurnal MT5"
              className="p-1.5 rounded-xl bg-white border border-[#E5E5E2] text-[#737373] hover:text-[#0F0F0F] hover:bg-[#F2F2EF] transition-all shadow-sm disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isMT5Loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari pair, strategi, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E5E5E2] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#0F0F0F] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0F0F0F] shadow-sm font-medium"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs overflow-x-auto pb-1">
          {/* Filter Outcome Tabs */}
          {['ALL', 'WIN', 'LOSS', 'BE', 'OPEN', 'DEPOSIT', 'WITHDRAWAL'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterOutcome(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterOutcome === status
                  ? 'bg-[#0F0F0F] text-white shadow-sm'
                  : 'bg-white text-[#737373] border border-[#E5E5E2] hover:text-[#0F0F0F]'
              }`}
            >
              {status === 'ALL' ? 'Semua' : status}
            </button>
          ))}

          {/* Filter Pair Selector */}
          {availablePairs.length > 0 && (
            <div className="w-36 flex-shrink-0">
              <CustomSelect
                value={filterPair}
                onChange={(val) => setFilterPair(String(val))}
                options={[
                  { value: 'ALL', label: 'Semua Pair' },
                  ...availablePairs.map(p => ({ value: p, label: p }))
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Trade Cards List */}
      {filteredTrades.length === 0 ? (
        <div className="card-light p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <div className="text-xs font-bold text-[#0F0F0F]">Tidak ada trade yang cocok</div>
          <p className="text-[11px] text-[#737373]">
            {userProfile ? 'Order transaksi akan otomatis muncul saat Anda trading di MT5.' : 'Masuk akun untuk sinkronisasi live.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade) => {
            const isDeposit = trade.outcome === 'DEPOSIT' || trade.direction === 'DEPOSIT';
            const isWithdrawal = trade.outcome === 'WITHDRAWAL' || trade.direction === 'WITHDRAWAL';
            const isWin = trade.outcome === 'WIN';
            const isLoss = trade.outcome === 'LOSS';
            const isOverLot = !isDeposit && !isWithdrawal && !trade.isCompliantWithRisk;

            return (
              <div
                key={trade.id}
                className="card-light p-4 space-y-3 hover:border-[#D4D4D0] transition-all"
              >
                {/* Top Row: Direction, Pair, Lot, PnL */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2 py-1 rounded-xl text-xs font-extrabold ${
                      isDeposit
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : isWithdrawal
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : trade.direction === 'BUY'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isDeposit ? 'DEPOSIT' : isWithdrawal ? 'WITHDRAW' : trade.direction}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-extrabold text-[#0F0F0F]">{trade.pair}</span>
                        {!isDeposit && !isWithdrawal && (
                          <span className="text-xs font-mono-num font-bold text-[#737373]">
                            {trade.lotSize} Lot
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#A3A3A3] font-medium">
                        {new Date(trade.date).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-2.5">
                    <div>
                      <div className={`text-sm font-black font-mono-num ${
                        isDeposit || isWin 
                          ? 'text-emerald-600' 
                          : isWithdrawal || isLoss 
                            ? 'text-rose-600' 
                            : 'text-[#0F0F0F]'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl, settings.currency)}
                      </div>
                      <div className={`text-[10px] font-bold ${
                        isDeposit
                          ? 'text-teal-700'
                          : isWithdrawal
                            ? 'text-purple-700'
                            : isWin 
                              ? 'text-emerald-600' 
                              : isLoss 
                                ? 'text-rose-600' 
                                : trade.outcome === 'OPEN' 
                                  ? 'text-blue-600' 
                                  : 'text-[#737373]'
                      }`}>
                        {trade.outcome === 'OPEN' ? 'LIVE (OPEN)' : trade.outcome}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTrade(trade.id)}
                      className="p-1.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] text-[#A3A3A3] hover:text-rose-600 hover:border-rose-200 transition-colors"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Price Levels or Transaction Info */}
                {isDeposit || isWithdrawal ? (
                  <div className="bg-[#F7F7F5] p-2.5 rounded-2xl border border-[#E5E5E2] text-[11px] flex items-center justify-between">
                    <div>
                      <span className="text-[#737373] text-[10px] block">Tipe Mutasi</span>
                      <span className="font-bold text-[#0F0F0F]">{isDeposit ? 'Deposit Masuk' : 'Penarikan Modal'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#737373] text-[10px] block">Keterangan</span>
                      <span className="font-mono-num font-semibold text-[#525252] truncate max-w-[200px] block">{trade.notes}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 bg-[#F7F7F5] p-2.5 rounded-2xl border border-[#E5E5E2] text-[11px]">
                    <div>
                      <span className="text-[#737373] text-[10px] block">Entry</span>
                      <span className="font-mono-num font-bold text-[#0F0F0F]">{trade.entryPrice || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[#737373] text-[10px] block">Stop Loss</span>
                      <span className="font-mono-num font-bold text-rose-600">{trade.stopLoss || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[#737373] text-[10px] block">Take Profit</span>
                      <span className="font-mono-num font-bold text-emerald-600">{trade.takeProfit || '-'}</span>
                    </div>
                  </div>
                )}

                {/* Over-lot warning banner if non-compliant */}
                {isOverLot && (
                  <div className="flex items-center space-x-1.5 text-[10px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                    <span>Over-lot: Dipasang {trade.lotSize} lot (rekomendasi: {trade.recommendedLotSize} lot).</span>
                  </div>
                )}

                {/* Strategy & Emotions */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#737373] font-medium">Strategi: <span className="text-[#0F0F0F] font-bold">{trade.strategy || 'Live MT5 Execution'}</span></span>
                  </div>

                  {trade.emotions && trade.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trade.emotions.map((e) => {
                        const isBad = e === 'FOMO' || e === 'Revenge Trade' || e === 'Greedy' || e === 'Overtrading';
                        return (
                          <span
                            key={e}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                              isBad
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {e}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {trade.notes && (
                    <p className="text-[11px] text-[#525252] bg-[#F7F7F5] p-2.5 rounded-xl border border-[#E5E5E2]">
                      {trade.notes}
                    </p>
                  )}

                  {trade.screenshotUrl && (
                    <div className="pt-1">
                      <button
                        onClick={() => setActiveImagePreview(trade.screenshotUrl || null)}
                        className="text-[11px] text-[#0F0F0F] hover:underline flex items-center space-x-1 font-bold"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Lihat Screenshot Chart</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {activeImagePreview && (
        <div 
          onClick={() => setActiveImagePreview(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-lg w-full space-y-2">
            <img 
              src={activeImagePreview} 
              alt="Chart Screenshot" 
              className="w-full h-auto rounded-3xl border border-neutral-700 shadow-2xl" 
            />
            <p className="text-center text-xs text-white/80 font-medium">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  );
};
