import React, { useState, useEffect } from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  TradeDirection, 
  TradeOutcome, 
  EmotionTag 
} from '../../types/journal';
import { 
  SUPPORTED_PAIRS, 
  calculateRecommendedLot, 
  getPairConfig 
} from '../../lib/lotCalculator';
import { formatCurrency } from '../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Camera, 
  Plus, 
  Zap 
} from 'lucide-react';

const EMOTIONS_LIST: EmotionTag[] = [
  'Disciplined',
  'Followed Strategy',
  'FOMO',
  'Revenge Trade',
  'Greedy',
  'Hesitant',
  'Early Exit',
  'Overtrading'
];

const STRATEGIES_LIST = [
  'SMC / Order Block',
  'Breakout & Retest',
  'Supply & Demand',
  'Trend Following',
  'Liquidity Sweep',
  'Scalping M1/M5',
  'Fibonacci Retracement'
];

export const NewTradeModal: React.FC = () => {
  const { 
    isNewTradeModalOpen, 
    setIsNewTradeModalOpen, 
    addTrade, 
    settings, 
    currentEquity 
  } = useJournal();

  const [pair, setPair] = useState(settings.defaultPair || 'XAUUSD');
  const [direction, setDirection] = useState<TradeDirection>('BUY');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [lotSize, setLotSize] = useState<string>('');
  const [outcome, setOutcome] = useState<TradeOutcome>('WIN');
  const [pnl, setPnl] = useState<string>('');
  const [strategy, setStrategy] = useState(STRATEGIES_LIST[0]);
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionTag[]>(['Disciplined']);
  const [notes, setNotes] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');

  // Auto calculate recommended lot based on current inputs
  const ep = Number(entryPrice) || 0;
  const sl = Number(stopLoss) || 0;
  const lotAdvice = calculateRecommendedLot(currentEquity, settings, pair, ep, sl);

  // Set default suggested lot if empty
  useEffect(() => {
    if (!lotSize && lotAdvice.recommendedLot > 0) {
      setLotSize(lotAdvice.recommendedLot.toString());
    }
  }, [lotAdvice.recommendedLot, lotSize]);

  if (!isNewTradeModalOpen) return null;

  const currentEnteredLot = Number(lotSize) || 0;
  const isOverLot = currentEnteredLot > lotAdvice.maxSafeLot;

  const toggleEmotion = (tag: EmotionTag) => {
    if (selectedEmotions.includes(tag)) {
      setSelectedEmotions(prev => prev.filter(t => t !== tag));
    } else {
      setSelectedEmotions(prev => [...prev, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const netPnl = outcome === 'OPEN' 
      ? 0 
      : outcome === 'LOSS' 
        ? -Math.abs(Number(pnl) || 0) 
        : outcome === 'BE' 
          ? 0 
          : Math.abs(Number(pnl) || 0);

    addTrade({
      date: new Date().toISOString(),
      pair,
      direction,
      lotSize: Number(lotSize) || lotAdvice.recommendedLot,
      entryPrice: Number(entryPrice) || 0,
      stopLoss: Number(stopLoss) || 0,
      takeProfit: Number(takeProfit) || 0,
      pnl: netPnl,
      outcome,
      emotions: selectedEmotions,
      strategy,
      notes,
      screenshotUrl: screenshotUrl || undefined,
    });

    setIsNewTradeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-3xl p-5 shadow-2xl relative my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Catat Entry Trade</h3>
              <p className="text-[11px] text-slate-400">Jurnal & Verifikasi Manajemen Risiko</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewTradeModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Pair & Direction */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] block">Instrument / Pair</label>
              <CustomSelect
                value={pair}
                onChange={(val) => setPair(String(val))}
                searchable={true}
                searchPlaceholder="Cari pair (XAU, EUR...)"
                options={SUPPORTED_PAIRS.map(p => ({
                  value: p.pair,
                  label: p.pair,
                  subLabel: p.name,
                }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] block">Arah Posisi</label>
              <div className="grid grid-cols-2 gap-1 bg-[#070a12] p-1 rounded-xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`py-1 rounded-lg font-bold text-xs transition-all ${
                    direction === 'BUY'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`py-1 rounded-lg font-bold text-xs transition-all ${
                    direction === 'SELL'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          </div>

          {/* Entry, Stop Loss, Take Profit */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] block">Entry Price</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono-num text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] block">Stop Loss (SL)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono-num text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 text-[10px] block">Take Profit (TP)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono-num text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dynamic Lot Sizing Calculator Feedback */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-slate-300 flex items-center space-x-1">
                <span>Rekomendasi Lot:</span>
                <span className="text-emerald-400 font-bold font-mono-num ml-1">
                  {lotAdvice.recommendedLot} Lot
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Jarak SL: {lotAdvice.slPips} pips
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 text-[11px]">Volume Lot Digunakan</label>
                <button
                  type="button"
                  onClick={() => setLotSize(lotAdvice.recommendedLot.toString())}
                  className="text-[10px] text-emerald-400 hover:underline"
                >
                  Pakai Lot Rekomendasi
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                required
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className={`w-full bg-[#070a12] border rounded-xl px-3 py-2 font-mono-num text-sm font-bold text-white focus:outline-none ${
                  isOverLot ? 'border-rose-500 text-rose-400' : 'border-slate-700 focus:border-emerald-500'
                }`}
              />
            </div>

            {isOverLot && (
              <div className="flex items-center space-x-1.5 text-rose-400 text-[11px] font-semibold bg-rose-950/40 p-2 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Over-lot Terdeteksi! Lot melebihi batas toleransi risiko ({lotAdvice.maxSafeLot} lot).</span>
              </div>
            )}
          </div>

          {/* Outcome & PnL */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] block">Hasil Trade</label>
              <CustomSelect
                value={outcome}
                onChange={(val) => setOutcome(val as TradeOutcome)}
                options={[
                  { value: 'WIN', label: 'WIN (Profit)' },
                  { value: 'LOSS', label: 'LOSS (Rugi)' },
                  { value: 'BE', label: 'BE (Break Even)' },
                  { value: 'OPEN', label: 'OPEN (Berjalan)' },
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 text-[11px] block">
                Net PnL ({settings.currency})
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                disabled={outcome === 'OPEN' || outcome === 'BE'}
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 font-mono-num text-xs font-bold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40"
              />
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Strategi / Setup</label>
            <CustomSelect
              value={strategy}
              onChange={(val) => setStrategy(String(val))}
              searchable={true}
              searchPlaceholder="Cari strategi..."
              options={STRATEGIES_LIST}
            />
          </div>

          {/* Emotion Tags */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] block">Evaluasi Psikologi / Emosi</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS_LIST.map((tag) => {
                const isSelected = selectedEmotions.includes(tag);
                const isNegative = tag === 'FOMO' || tag === 'Revenge Trade' || tag === 'Greedy' || tag === 'Overtrading';
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleEmotion(tag)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      isSelected
                        ? isNegative
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes & Screenshot */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Catatan & Refleksi Entry</label>
            <textarea
              rows={2}
              placeholder="Alasan entry, konfirmasi TF H1, reaksi harga di area POI..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] block">URL Screenshot Chart (Opsional)</label>
            <input
              type="url"
              placeholder="https://tradingview.com/x/..."
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-glow-emerald hover:opacity-95 transition-all mt-2"
          >
            Simpan ke Jurnal Trading
          </button>
        </form>
      </div>
    </div>
  );
};
