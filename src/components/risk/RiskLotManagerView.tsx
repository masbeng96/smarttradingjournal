import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  calculateRecommendedLot, 
  generateLotMilestoneLadder, 
  SUPPORTED_PAIRS 
} from '../../lib/lotCalculator';
import { formatCurrency } from '../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  ShieldCheck, 
  Sliders, 
  Zap, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calculator
} from 'lucide-react';

export const RiskLotManagerView: React.FC = () => {
  const { settings, updateSettings, currentEquity } = useJournal();

  // Settings local edit states
  const [riskPercent, setRiskPercent] = useState(settings.riskPerTradePercent);
  const [maxDailyLoss, setMaxDailyLoss] = useState(settings.maxDailyLossPercent);
  const [targetRRR, setTargetRRR] = useState(settings.targetRRR);
  const [defaultPair, setDefaultPair] = useState(settings.defaultPair || 'XAUUSD');
  const [avgSlPips, setAvgSlPips] = useState(settings.avgStopLossPips || 25);
  const [autoCompounding, setAutoCompounding] = useState(settings.autoLotCompounding);

  // Live Calculator Sandbox states
  const [calcPair, setCalcPair] = useState(settings.defaultPair || 'XAUUSD');
  const [calcSlPips, setCalcSlPips] = useState(25);
  const [calcCustomBalance, setCalcCustomBalance] = useState(currentEquity);

  const handleSaveRiskRules = () => {
    updateSettings({
      riskPerTradePercent: Number(riskPercent) || 1.0,
      maxDailyLossPercent: Number(maxDailyLoss) || 3.0,
      targetRRR: Number(targetRRR) || 2.0,
      defaultPair,
      avgStopLossPips: Number(avgSlPips) || 25,
      autoLotCompounding: autoCompounding,
    });
  };

  // Dynamic Milestone Ladder
  const ladder = generateLotMilestoneLadder(currentEquity, settings, defaultPair);

  // Live Calculator Calculation
  const liveCalculation = calculateRecommendedLot(
    calcCustomBalance,
    settings,
    calcPair,
    undefined,
    undefined,
    calcSlPips
  );

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Title */}
      <div className="px-1">
        <h2 className="text-base font-extrabold text-[#0F0F0F] flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[#0F0F0F]" />
          <span>Risk Management & Lot Compounding</span>
        </h2>
        <p className="text-xs text-[#737373]">
          {settings.language === 'en' ? 'Automated lot size calculation & milestone ladder' : settings.language === 'ms' ? 'Pengiraan lot automatik & tangga peristiwa penting' : 'Kalkulasi otomatis ukuran lot per trade & tangga milestone lot'}
        </p>
      </div>

      {/* Active Lot & Tier Status Card (10% ACCENT - Pitch Black Card) */}
      <div className="card-dark-hero p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#A3A3A3]">
            {settings.language === 'en' ? 'Active Lot Status' : settings.language === 'ms' ? 'Status Lot Aktif' : 'Status Lot Aktif'} (Tier {ladder.currentTier.tierLevel})
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-300 font-semibold border border-neutral-800">
            {settings.language === 'en' ? 'Equity' : 'Modal'}: {formatCurrency(currentEquity, settings.currency)}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="text-3xl font-black font-mono-num text-white">
              {ladder.currentTier.recommendedLot} Lot
            </div>
            <span className="text-xs text-[#A3A3A3]">
              {settings.language === 'en' ? 'Max Risk' : 'Maksimum Risiko'}: {formatCurrency(ladder.currentTier.riskAmount, settings.currency)} ({settings.riskPerTradePercent}%)
            </span>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="flex items-center justify-end space-x-1 text-emerald-400 font-bold">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Next: {formatCurrency(ladder.nextStepUpTarget, settings.currency)}</span>
            </div>
            <div className="flex items-center justify-end space-x-1 text-rose-400 font-medium text-[11px]">
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Guard: {formatCurrency(ladder.stepDownWarningTarget, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Parameters Form */}
      <div className="card-light p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-2.5">
          <span className="text-xs font-extrabold text-[#0F0F0F] flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-[#0F0F0F]" />
            <span>{settings.language === 'en' ? 'Risk Management Rules' : settings.language === 'ms' ? 'Peraturan Pengurusan Risiko' : 'Aturan Manajemen Risiko'}</span>
          </span>
          <button
            onClick={handleSaveRiskRules}
            className="px-3 py-1.5 rounded-xl bg-[#0F0F0F] hover:bg-black text-white font-bold text-xs transition-all shadow-sm"
          >
            {settings.language === 'en' ? 'Save Rules' : 'Simpan Aturan'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Risk per trade % */}
          <div className="space-y-1">
            <label className="text-[#737373] text-[11px] block font-medium">Risiko Per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
            />
          </div>

          {/* Max Daily Loss % */}
          <div className="space-y-1">
            <label className="text-[#737373] text-[11px] block font-medium">{settings.language === 'en' ? 'Max Daily Loss (%)' : 'Maks. Daily Loss (%)'}</label>
            <input
              type="number"
              step="0.5"
              value={maxDailyLoss}
              onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
            />
          </div>

          {/* Target RRR */}
          <div className="space-y-1">
            <label className="text-[#737373] text-[11px] block font-medium">{settings.language === 'en' ? 'Target RR (1:X)' : 'Target RR (1:X)'}</label>
            <input
              type="number"
              step="0.5"
              value={targetRRR}
              onChange={(e) => setTargetRRR(Number(e.target.value))}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
            />
          </div>

          {/* Default Pair */}
          <div className="space-y-1">
            <label className="text-[#737373] text-[11px] block font-medium">Pair Utama</label>
            <CustomSelect
              value={defaultPair}
              onChange={(val) => setDefaultPair(String(val))}
              searchable={true}
              searchPlaceholder="Cari pair..."
              options={SUPPORTED_PAIRS.map((p) => ({
                value: p.pair,
                label: p.pair,
                subLabel: p.name,
              }))}
            />
          </div>

          {/* Average Stop Loss Pips */}
          <div className="space-y-1 col-span-2">
            <label className="text-[#737373] text-[11px] block font-medium">Rata-Rata Stop Loss (Pips/Points)</label>
            <input
              type="number"
              value={avgSlPips}
              onChange={(e) => setAvgSlPips(Number(e.target.value))}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Lot Compounding Ladder Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold text-[#0F0F0F] flex items-center space-x-1.5 px-1">
          <Zap className="w-4 h-4 text-[#0F0F0F]" />
          <span>{settings.language === 'en' ? 'Lot Increase & Decrease Milestone Ladder' : settings.language === 'ms' ? 'Tangga Peningkatan & Penurunan Lot' : 'Tangga Milestone Kenaikan & Penurunan Lot'}</span>
        </h3>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {ladder.tiers.map((tier) => {
            const isCurrent = tier.stepType === 'CURRENT';
            return (
              <div
                key={tier.tierLevel}
                className={`card-light p-3 flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'border-[#0F0F0F] ring-1 ring-[#0F0F0F] bg-[#FAFAF8]'
                    : 'hover:border-[#D4D4D0]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                    isCurrent 
                      ? 'bg-[#0F0F0F] text-white' 
                      : 'bg-[#F2F2EF] text-[#737373]'
                  }`}>
                    T{tier.tierLevel}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0F0F0F] flex items-center space-x-1.5">
                      <span>{formatCurrency(tier.minEquity, settings.currency)} - {formatCurrency(tier.maxEquity, settings.currency)}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0F0F0F] text-white font-extrabold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#737373]">
                      Maks. Risiko: {formatCurrency(tier.riskAmount, settings.currency)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-black font-mono-num ${isCurrent ? 'text-emerald-600' : 'text-[#0F0F0F]'}`}>
                    {tier.recommendedLot} Lot
                  </div>
                  <div className="text-[10px] text-[#A3A3A3]">
                    {isCurrent ? 'Lot Anda Sekarang' : 'Target Lot'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Live Lot Sizer Sandbox */}
      <div className="card-light p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-[#0F0F0F]" />
          <h3 className="text-xs font-bold text-[#0F0F0F]">{settings.language === 'en' ? 'Instant Lot Calculator (Sandbox)' : 'Kalkulator Lot Instan (Sandbox)'}</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="space-y-1">
            <label className="text-[#737373] text-[10px] block font-medium">Pair</label>
            <CustomSelect
              value={calcPair}
              onChange={(val) => setCalcPair(String(val))}
              options={SUPPORTED_PAIRS.map(p => ({
                value: p.pair,
                label: p.pair,
              }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#737373] text-[10px] block font-medium">Saldo Akun ({settings.currency})</label>
            <input
              type="number"
              value={calcCustomBalance}
              onChange={(e) => setCalcCustomBalance(Number(e.target.value))}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-2.5 py-2 text-xs text-[#0F0F0F] font-mono-num font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[#737373] text-[10px] block font-medium">Jarak SL (Pips)</label>
            <input
              type="number"
              value={calcSlPips}
              onChange={(e) => setCalcSlPips(Number(e.target.value))}
              className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-2.5 py-2 text-xs text-[#0F0F0F] font-mono-num font-bold"
            />
          </div>
        </div>

        {/* Live Calculation Output */}
        <div className="rounded-2xl p-3.5 bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#737373] block font-medium">{settings.language === 'en' ? 'Recommended Safe Lot' : 'Lot Aman Rekomendasi'}</span>
            <span className="text-xl font-black font-mono-num text-[#0F0F0F]">
              {liveCalculation.recommendedLot} Lot
            </span>
          </div>

          <div className="text-right text-xs">
            <span className="text-[10px] text-[#737373] block font-medium">{settings.language === 'en' ? 'Max Tolerance Lot:' : 'Maksimal Lot Toleransi:'}</span>
            <span className="font-bold text-rose-600 font-mono-num">
              {liveCalculation.maxSafeLot} Lot
            </span>
            <span className="text-[10px] text-[#A3A3A3] block">
              {settings.language === 'en' ? 'Risk' : 'Risiko'}: {formatCurrency(liveCalculation.riskAmount, settings.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
