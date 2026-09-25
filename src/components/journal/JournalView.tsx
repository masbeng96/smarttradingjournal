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
  RotateCcw,
  ChevronDown,
  Info,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '../../lib/translations';

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
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);
  const [expandedTradeIds, setExpandedTradeIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedTradeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtered trades
  const filteredTrades = trades.filter((trade) => {
    if (filterPair !== 'ALL' && trade.pair !== filterPair) return false;
    if (filterOutcome !== 'ALL' && trade.outcome !== filterOutcome) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchPair = trade.pair.toLowerCase().includes(q);
      const matchStrategy = trade.strategy?.toLowerCase().includes(q);
      const matchNotes = trade.notes?.toLowerCase().includes(q);
      if (!matchPair && !matchStrategy && !matchNotes) return false;
    }

    if (dateFilter !== 'ALL') {
      const tradeDate = new Date(trade.date).getTime();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const yesterdayStart = todayStart - 86400000;
      
      if (dateFilter === 'TODAY') {
        if (tradeDate < todayStart) return false;
      } else if (dateFilter === 'YESTERDAY') {
        if (tradeDate < yesterdayStart || tradeDate >= todayStart) return false;
      } else if (dateFilter === '7D') {
        if (tradeDate < todayStart - 6 * 86400000) return false;
      } else if (dateFilter === '30D') {
        if (tradeDate < todayStart - 29 * 86400000) return false;
      } else if (dateFilter === 'CUSTOM') {
        if (customStartDate) {
          const start = new Date(customStartDate).getTime();
          if (tradeDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(customEndDate).getTime() + 86400000; // End of day
          if (tradeDate >= end) return false;
        }
      }
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
            <span>{getTranslation(settings.language, 'nav.journal')} Entry Trading</span>
          </h2>
          <p className="text-xs text-[#737373]">
            {trades.length} {getTranslation(settings.language, 'dash.closedTrades')}
          </p>
        </div>

        {/* Live MT5 Indicator & Refresh */}
        <div className="flex items-center space-x-2">
          {assignedAccountId && mt5Data?.isConnected ? (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono-num font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>MT5 Terhubung</span>
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
            placeholder={settings.language === 'id' ? "Cari pair, keterangan, catatan..." : settings.language === 'en' ? "Search pair, details, notes..." : "Cari pasangan, butiran, nota..."}
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
              {status === 'ALL' ? (settings.language === 'id' ? 'Semua' : settings.language === 'en' ? 'All' : 'Semua') : status}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 pt-1 relative z-10">
          {availablePairs.length > 0 && (
            <div className="w-32 flex-shrink-0">
              <CustomSelect
                value={filterPair}
                onChange={(val) => setFilterPair(String(val))}
                options={[
                  { value: 'ALL', label: settings.language === 'en' ? 'All Pairs' : 'Semua Pair' },
                  ...availablePairs.map(p => ({ value: p, label: p }))
                ]}
              />
            </div>
          )}

          {/* Date Filter Selector */}
          <div className="w-40 flex-shrink-0">
            <CustomSelect
              value={dateFilter}
              onChange={(val) => setDateFilter(String(val))}
              options={[
                { value: 'ALL', label: settings.language === 'en' ? 'All Time' : 'Semua Waktu' },
                { value: 'TODAY', label: settings.language === 'en' ? 'Today' : 'Hari Ini' },
                { value: 'YESTERDAY', label: settings.language === 'en' ? 'Yesterday' : 'Kemarin' },
                { value: '7D', label: settings.language === 'en' ? 'Last 7 Days' : '7 Hari Terakhir' },
                { value: '30D', label: settings.language === 'en' ? 'Last 30 Days' : '30 Hari Terakhir' },
                { value: 'CUSTOM', label: settings.language === 'en' ? 'Custom Range...' : 'Pilih Tanggal...' }
              ]}
            />
          </div>
        </div>

        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center space-x-2 text-xs pt-1">
            <input 
              type="date" 
              value={customStartDate} 
              onChange={e => setCustomStartDate(e.target.value)} 
              className="flex-1 bg-white border border-[#E5E5E2] rounded-xl px-3 py-2 focus:outline-none text-[#0F0F0F] font-bold" 
            />
            <span className="text-[#A3A3A3] font-medium">-</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={e => setCustomEndDate(e.target.value)} 
              className="flex-1 bg-white border border-[#E5E5E2] rounded-xl px-3 py-2 focus:outline-none text-[#0F0F0F] font-bold" 
            />
          </div>
        )}
      </div>

      {/* Trade Cards List */}
      {filteredTrades.length === 0 ? (
        <div className="card-light p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <div className="text-xs font-bold text-[#0F0F0F]">{settings.language === 'en' ? 'No matching trades' : settings.language === 'ms' ? 'Tiada dagangan sepadan' : 'Tidak ada trade yang cocok'}</div>
          <p className="text-[11px] text-[#737373]">
            {userProfile ? (settings.language === 'en' ? 'Transactions will appear automatically when you trade on MT5.' : 'Order transaksi akan otomatis muncul saat Anda trading di MT5.') : (settings.language === 'en' ? 'Sign in to sync live.' : 'Masuk akun untuk sinkronisasi live.')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTrades.map((trade) => {
            const isDeposit = trade.outcome === 'DEPOSIT' || trade.direction === 'DEPOSIT';
            const isWithdrawal = trade.outcome === 'WITHDRAWAL' || trade.direction === 'WITHDRAWAL';
            const isWin = trade.outcome === 'WIN';
            const isLoss = trade.outcome === 'LOSS';
            const isOverLot = !isDeposit && !isWithdrawal && !trade.isCompliantWithRisk;
            const isExpanded = expandedTradeIds.has(trade.id);

            // Formatted Date and Time for close / execution
            const tradeDateObj = new Date(trade.date);
            const formattedDate = tradeDateObj.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            const formattedTime = tradeDateObj.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }) + ' WIB';

            return (
              <div
                key={trade.id}
                className="card-light overflow-hidden transition-all duration-200 border-[#E5E5E2] hover:border-[#D4D4D0] shadow-sm"
              >
                {/* Collapsed Header / Summary - Clickable to Expand */}
                <div
                  onClick={() => toggleExpand(trade.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF9F6]/60 transition-colors"
                >
                  {/* Left: Position Direction, Pair, Lot, Close Date & Time */}
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
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

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-[#0F0F0F] tracking-tight">{trade.pair}</span>
                        {!isDeposit && !isWithdrawal && (
                          <span className="text-xs font-mono-num font-bold text-[#525252] bg-[#F0F0ED] px-2 py-0.5 rounded-md border border-[#E5E5E2]">
                            {trade.lotSize} Lot
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#737373] font-medium flex items-center space-x-1">
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span className="font-mono-num">{formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Profit/Loss Amount, Outcome Badge & Expand Chevron */}
                  <div className="flex items-center space-x-3 text-right shrink-0">
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
                      <div className={`text-[10px] font-extrabold ${
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

                    <div className="w-7 h-7 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#737373] transition-transform duration-200">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#0F0F0F]' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="border-t border-[#E5E5E2] bg-[#FAF9F6]/80 p-4 space-y-3"
                    >
                      {/* Price Levels or Transaction Info */}
                      {isDeposit || isWithdrawal ? (
                        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E2] text-xs flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-[#737373] text-[10px] block font-semibold uppercase">{settings.language === 'en' ? 'Mutation Type' : 'Tipe Mutasi'}</span>
                            <span className="font-bold text-[#0F0F0F]">{isDeposit ? (settings.language === 'en' ? 'Deposit In' : 'Deposit Masuk') : (settings.language === 'en' ? 'Withdrawal' : 'Penarikan Modal')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#737373] text-[10px] block font-semibold uppercase">Keterangan Mutasi</span>
                            <span className="font-mono-num font-semibold text-[#525252] truncate max-w-[200px] block">{trade.notes || '-'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-[#E5E5E2] text-xs shadow-xs">
                          <div>
                            <span className="text-[#737373] text-[10px] block font-semibold uppercase">Entry Price</span>
                            <span className="font-mono-num font-extrabold text-[#0F0F0F]">{trade.entryPrice || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[#737373] text-[10px] block font-semibold uppercase">Stop Loss</span>
                            <span className="font-mono-num font-extrabold text-rose-600">{trade.stopLoss || '-'}</span>
                          </div>
                          <div>
                            <span className="text-[#737373] text-[10px] block font-semibold uppercase">Take Profit</span>
                            <span className="font-mono-num font-extrabold text-emerald-600">{trade.takeProfit || '-'}</span>
                          </div>
                        </div>
                      )}

                      {/* Over-lot warning banner if non-compliant */}
                      {isOverLot && (
                        <div className="flex items-center space-x-2 text-xs text-amber-800 bg-amber-50 p-2.5 rounded-2xl border border-amber-200">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                          <span>Over-lot: Dipasang {trade.lotSize} lot (rekomendasi sistem: {trade.recommendedLotSize} lot).</span>
                        </div>
                      )}

                      {/* Keterangan & Detail Catatan */}
                      <div className="space-y-2">
                        <div className="bg-white p-3 rounded-2xl border border-[#E5E5E2] space-y-1.5 shadow-xs">
                          <div className="flex items-center space-x-1.5 text-xs text-[#737373]">
                            <Info className="w-3.5 h-3.5 text-[#0F0F0F]" />
                            <span className="font-bold text-[#0F0F0F]">{settings.language === 'en' ? 'Details:' : 'Keterangan:'}</span>
                          </div>
                          <div className="text-xs text-[#262626] font-medium leading-relaxed">
                            {trade.notes || trade.strategy || 'Eksekusi transaksi live MT5'}
                          </div>
                        </div>

                        {/* Emotions / Psikologi Tags */}
                        {trade.emotions && trade.emotions.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-[#737373] font-bold uppercase tracking-wider block">Psikologi / Emosi:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {trade.emotions.map((e) => {
                                const isBad = e === 'FOMO' || e === 'Revenge Trade' || e === 'Greedy' || e === 'Overtrading';
                                return (
                                  <span
                                    key={e}
                                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
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
                          </div>
                        )}

                        {/* Chart Screenshot Preview Button */}
                        {trade.screenshotUrl && (
                          <div className="pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImagePreview(trade.screenshotUrl || null);
                              }}
                              className="px-3 py-2 rounded-xl bg-white border border-[#E5E5E2] text-xs text-[#0F0F0F] hover:bg-[#F2F2EF] transition-all flex items-center space-x-1.5 font-bold shadow-xs"
                            >
                              <ImageIcon className="w-4 h-4 text-[#0F0F0F]" />
                              <span>Lihat Screenshot Analisa Chart</span>
                            </button>
                          </div>
                        )}

                        {/* Delete Trade Button */}
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTrade(trade.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Jurnal</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
