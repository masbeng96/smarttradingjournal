import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  calculateRecommendedLot, 
  generateLotMilestoneLadder, 
  SUPPORTED_PAIRS, 
  getPairConfig 
} from '../../lib/lotCalculator';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  ShieldAlert, 
  Sliders, 
  Zap, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle 
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
    <div className="p-4 space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <span>Risk Management & Lot Compounding</span>
        </h2>
        <p className="text-xs text-slate-400">
          Kalkulasi otomatis ukuran lot per trade & tangga milestone kenaikan/penurunan lot
        </p>
      </div>

      {/* Active Lot & Tier Status Card */}
      <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-900 via-[#0c1829] to-[#07131e] border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Status Lot Aktif (Tier {ladder.currentTier.tierLevel})
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            Modal: {formatCurrency(currentEquity, settings.currency)}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <div className="text-3xl font-black font-mono-num text-white glow-text-emerald">
              {ladder.currentTier.recommendedLot} Lot
            </div>
            <span className="text-xs text-slate-400">
              Maksimum Risiko: {formatCurrency(ladder.currentTier.riskAmount, settings.currency)} ({settings.riskPerTradePercent}%)
            </span>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="flex items-center justify-end space-x-1 text-emerald-400 font-semibold">
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Step-Up: {formatCurrency(ladder.nextStepUpTarget, settings.currency)}</span>
            </div>
            <div className="flex items-center justify-end space-x-1 text-rose-400/90 font-medium text-[11px]">
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Guard: {formatCurrency(ladder.stepDownWarningTarget, settings.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Parameters Form */}
      <div className="rounded-3xl p-4 bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Aturan Manajemen Risiko</span>
          </span>
          <button
            onClick={handleSaveRiskRules}
            className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
          >
            Simpan Aturan
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Risk per trade % */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Risiko Per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Max Daily Loss % */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Maks. Daily Loss (%)</label>
            <input
              type="number"
              step="0.5"
              value={maxDailyLoss}
              onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
              className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Target RRR */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Target Risk to Reward (1:X)</label>
            <input
              type="number"
              step="0.5"
              value={targetRRR}
              onChange={(e) => setTargetRRR(Number(e.target.value))}
              className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Default Pair */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Pair Utama</label>
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
            <label className="text-slate-400 text-[11px] block">Rata-Rata Stop Loss (Pips/Points)</label>
            <input
              type="number"
              value={avgSlPips}
              onChange={(e) => setAvgSlPips(Number(e.target.value))}
              className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Lot Compounding Ladder Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Tangga Milestone Kenaikan & Penurunan Lot</span>
        </h3>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {ladder.tiers.map((tier) => {
            const isCurrent = tier.stepType === 'CURRENT';
            return (
              <div
                key={tier.tierLevel}
                className={`rounded-2xl p-3 border transition-all flex items-center justify-between ${
                  isCurrent
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-glow-emerald'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                    isCurrent 
                      ? 'bg-emerald-500 text-slate-950' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    T{tier.tierLevel}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{formatCurrency(tier.minEquity, settings.currency)} - {formatCurrency(tier.maxEquity, settings.currency)}</span>
                      {isCurrent && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Maks. Risiko: {formatCurrency(tier.riskAmount, settings.currency)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-black font-mono-num ${isCurrent ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {tier.recommendedLot} Lot
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {isCurrent ? 'Lot Anda Sekarang' : 'Target Lot'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Live Lot Sizer Sandbox */}
      <div className="rounded-3xl p-4 bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-200">Kalkulator Lot Instan (Sandbox)</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] block">Pair</label>
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
            <label className="text-slate-400 text-[10px] block">Saldo Akun ({settings.currency})</label>
            <input
              type="number"
              value={calcCustomBalance}
              onChange={(e) => setCalcCustomBalance(Number(e.target.value))}
              className="w-full bg-[#070a12] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono-num"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-[10px] block">Jarak SL (Pips)</label>
            <input
              type="number"
              value={calcSlPips}
              onChange={(e) => setCalcSlPips(Number(e.target.value))}
              className="w-full bg-[#070a12] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono-num"
            />
          </div>
        </div>

        {/* Live Calculation Output */}
        <div className="rounded-2xl p-3 bg-[#070a12] border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block">Lot Aman Rekomendasi</span>
            <span className="text-xl font-black font-mono-num text-cyan-400 glow-text-cyan">
              {liveCalculation.recommendedLot} Lot
            </span>
          </div>

          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-400 block">Maksimal Lot Toleransi:</span>
            <span className="font-bold text-amber-400 font-mono-num">
              {liveCalculation.maxSafeLot} Lot
            </span>
            <span className="text-[10px] text-slate-500 block">
              Risiko: {formatCurrency(liveCalculation.riskAmount, settings.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
