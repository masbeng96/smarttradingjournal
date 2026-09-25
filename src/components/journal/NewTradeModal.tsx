import React, { useState, useEffect } from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  TradeDirection, 
  TradeOutcome, 
  EmotionTag 
} from '../../types/journal';
import { 
  SUPPORTED_PAIRS, 
  calculateRecommendedLot
} from '../../lib/lotCalculator';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  X, 
  AlertTriangle, 
  PlusCircle
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-[#E5E5E2] rounded-[32px] p-5 shadow-2xl relative my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F0F0F] text-white flex items-center justify-center shadow-sm">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0F0F0F]">Catat Entry Trade</h3>
              <p className="text-[11px] text-[#737373]">Jurnal & Verifikasi Manajemen Risiko</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewTradeModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F2F2EF] border border-[#E5E5E2] text-[#737373] hover:text-[#0F0F0F] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Pair & Direction */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[#737373] text-[11px] block font-medium">Instrument / Pair</label>
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
              <label className="text-[#737373] text-[11px] block font-medium">Arah Posisi</label>
              <div className="grid grid-cols-2 gap-1 bg-[#F7F7F5] p-1 rounded-xl border border-[#E5E5E2]">
                <button
                  type="button"
                  onClick={() => setDirection('BUY')}
                  className={`py-1.5 rounded-lg font-extrabold text-xs transition-all ${
                    direction === 'BUY'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-[#737373] hover:text-[#0F0F0F]'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SELL')}
                  className={`py-1.5 rounded-lg font-extrabold text-xs transition-all ${
                    direction === 'SELL'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-[#737373] hover:text-[#0F0F0F]'
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
              <label className="text-[#737373] text-[10px] block font-medium">Entry Price</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-2.5 py-2 font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#737373] text-[10px] block font-medium">Stop Loss (SL)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-2.5 py-2 font-mono-num text-rose-600 font-bold focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[#737373] text-[10px] block font-medium">Take Profit (TP)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-2.5 py-2 font-mono-num text-emerald-600 font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Dynamic Lot Sizing Calculator Feedback */}
          <div className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-[#0F0F0F] flex items-center space-x-1 font-semibold">
                <span>Rekomendasi Lot:</span>
                <span className="text-emerald-700 font-extrabold font-mono-num ml-1 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                  {lotAdvice.recommendedLot} Lot
                </span>
              </div>
              <span className="text-[10px] text-[#737373] font-mono-num font-medium">
                Jarak SL: {lotAdvice.slPips} pips
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[#737373] text-[11px] font-medium">Volume Lot Digunakan</label>
                <button
                  type="button"
                  onClick={() => setLotSize(lotAdvice.recommendedLot.toString())}
                  className="text-[10px] text-[#0F0F0F] font-bold hover:underline"
                >
                  Gunakan Rekomendasi
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                required
                value={lotSize}
                onChange={(e) => setLotSize(e.target.value)}
                className={`w-full bg-white border rounded-xl px-3 py-2 font-mono-num text-sm font-extrabold text-[#0F0F0F] focus:outline-none ${
                  isOverLot ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-[#E5E5E2] focus:border-[#0F0F0F]'
                }`}
              />
            </div>

            {isOverLot && (
              <div className="flex items-center space-x-1.5 text-rose-800 text-[11px] font-semibold bg-rose-100 p-2 rounded-xl border border-rose-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>Over-lot Terdeteksi! Melebihi batas toleransi risiko ({lotAdvice.maxSafeLot} lot).</span>
              </div>
            )}
          </div>

          {/* Outcome & PnL */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[#737373] text-[11px] block font-medium">Hasil Trade</label>
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
              <label className="text-[#737373] text-[11px] block font-medium">
                Net PnL ({settings.currency})
              </label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                disabled={outcome === 'OPEN' || outcome === 'BE'}
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 font-mono-num text-xs font-extrabold text-[#0F0F0F] focus:outline-none focus:border-[#0F0F0F] disabled:opacity-40"
              />
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-1">
            <label className="text-[#737373] text-[11px] block font-medium">Strategi / Setup</label>
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
            <label className="text-[#737373] text-[11px] block font-medium">Evaluasi Psikologi / Emosi</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS_LIST.map((tag) => {
                const isSelected = selectedEmotions.includes(tag);
                const isNegative = tag === 'FOMO' || tag === 'Revenge Trade' || tag === 'Greedy' || tag === 'Overtrading';
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleEmotion(tag)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all ${
                      isSelected
                        ? isNegative
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-[#F7F7F5] text-[#737373] border border-[#E5E5E2] hover:text-[#0F0F0F]'
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
            <label className="text-[#737373] text-[11px] block font-medium">Catatan & Refleksi Entry</label>
            <textarea
              rows={2}
              placeholder="Alasan entry, konfirmasi TF H1, reaksi harga di area POI..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl p-2.5 text-xs text-[#0F0F0F] font-medium focus:outline-none focus:border-[#0F0F0F]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#737373] text-[10px] block font-medium">URL Screenshot Chart (Opsional)</label>
            <input
              type="url"
              placeholder="https://tradingview.com/x/..."
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-2.5 py-1.5 text-xs text-[#0F0F0F]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-[#0F0F0F] text-white font-extrabold text-xs hover:bg-black transition-all shadow-md mt-2 active:scale-98"
          >
            Simpan ke Jurnal Trading
          </button>
        </form>
      </div>
    </div>
  );
};
