import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  ExternalLink, 
  Image as ImageIcon 
} from 'lucide-react';

export const JournalView: React.FC = () => {
  const { 
    trades, 
    deleteTrade, 
    settings, 
    setIsNewTradeModalOpen, 
    currentEquity, 
    userProfile, 
    setIsAuthModalOpen 
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
    <div className="p-4 space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Jurnal Entry Trading</span>
          </h2>
          <p className="text-xs text-slate-400">
            {trades.length} Total trade tercatat {userProfile ? '(Live MT5 Sync)' : '(Mode Tamu)'}
          </p>
        </div>

        {userProfile ? (
          <button
            onClick={() => setIsNewTradeModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1 shadow-glow-emerald"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Trade</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all flex items-center space-x-1"
          >
            <span>Masuk Akun</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari pair, strategi, catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1">
          {/* Filter Outcome Tabs */}
          {['ALL', 'WIN', 'LOSS', 'BE', 'OPEN'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterOutcome(status)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterOutcome === status
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Semua Status' : status}
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
        <div className="rounded-3xl p-8 bg-slate-900/40 border border-slate-800 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">Tidak ada trade yang cocok dengan filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrades.map((trade) => {
            const isWin = trade.outcome === 'WIN';
            const isLoss = trade.outcome === 'LOSS';
            const isOverLot = !trade.isCompliantWithRisk;

            return (
              <div
                key={trade.id}
                className="rounded-3xl p-4 bg-slate-900/80 border border-slate-800/90 space-y-3 shadow-md hover:border-slate-700 transition-all"
              >
                {/* Top Row: Direction, Pair, Lot, PnL */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className={`px-2 py-1 rounded-xl text-xs font-extrabold ${
                      trade.direction === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {trade.direction}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-bold text-white">{trade.pair}</span>
                        <span className="text-xs font-mono-num font-bold text-slate-300">
                          {trade.lotSize} Lot
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
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
                        isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl, settings.currency)}
                      </div>
                      <div className={`text-[10px] font-bold ${
                        isWin ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-slate-400'
                      }`}>
                        {trade.outcome}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTrade(trade.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Jurnal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Price Levels (Entry, SL, TP) */}
                <div className="grid grid-cols-3 gap-2 bg-[#070a12] p-2.5 rounded-2xl border border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Entry</span>
                    <span className="font-mono-num text-slate-200">{trade.entryPrice || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Stop Loss</span>
                    <span className="font-mono-num text-rose-400">{trade.stopLoss || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Take Profit</span>
                    <span className="font-mono-num text-emerald-400">{trade.takeProfit || '-'}</span>
                  </div>
                </div>

                {/* Over-lot warning banner if non-compliant */}
                {isOverLot && (
                  <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 bg-amber-950/30 px-2.5 py-1.5 rounded-xl border border-amber-500/30">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Over-lot: Dipasang {trade.lotSize} lot (rekomendasi: {trade.recommendedLotSize} lot).</span>
                  </div>
                )}

                {/* Strategy & Emotions */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Strategi: <span className="text-slate-200">{trade.strategy || '-'}</span></span>
                  </div>

                  {trade.emotions && trade.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {trade.emotions.map((e) => {
                        const isBad = e === 'FOMO' || e === 'Revenge Trade' || e === 'Greedy' || e === 'Overtrading';
                        return (
                          <span
                            key={e}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              isBad
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {e}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {trade.notes && (
                    <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                      {trade.notes}
                    </p>
                  )}

                  {trade.screenshotUrl && (
                    <div className="pt-1">
                      <button
                        onClick={() => setActiveImagePreview(trade.screenshotUrl || null)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-lg w-full space-y-2">
            <img 
              src={activeImagePreview} 
              alt="Chart Screenshot" 
              className="w-full h-auto rounded-2xl border border-slate-700 shadow-2xl" 
            />
            <p className="text-center text-xs text-slate-400">Klik di mana saja untuk menutup</p>
          </div>
        </div>
      )}
    </div>
  );
};
