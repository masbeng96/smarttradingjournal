import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { CustomSelect } from '../ui/CustomSelect';
import { SUPPORTED_PAIRS } from '../../lib/lotCalculator';
import { calculateCompoundProjections } from '../../lib/compoundEngine';
import { formatCurrency } from '../../lib/utils';
import { 
  TrendingUp, 
  LineChart, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Zap, 
  Calendar, 
  DollarSign,
  Smartphone,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const OnboardingModal: React.FC = () => {
  const { hasOnboarded, completeOnboarding, settings } = useJournal();

  const [step, setStep] = useState(0);

  // Initial user setup inputs during onboarding
  const [currency, setCurrency] = useState(settings.currency);
  const [initialCapital, setInitialCapital] = useState(settings.initialCapital);
  const [monthlyTarget, setMonthlyTarget] = useState(settings.monthlyTargetPercent);
  const [monthlyDeposit, setMonthlyDeposit] = useState(settings.monthlyDeposit);
  const [depositDay, setDepositDay] = useState(settings.monthlyDepositDay);
  const [riskPercent, setRiskPercent] = useState(settings.riskPerTradePercent);
  const [defaultPair, setDefaultPair] = useState(settings.defaultPair || 'XAUUSD');

  if (hasOnboarded) return null;

  // Live preview compound calculation
  const livePreview = calculateCompoundProjections({
    ...settings,
    currency,
    initialCapital: Number(initialCapital) || 170,
    monthlyTargetPercent: Number(monthlyTarget) || 10,
    monthlyDeposit: Number(monthlyDeposit) || 170,
    monthlyDepositDay: Number(depositDay) || 25,
    projectionMonths: 12,
  });

  const handleNext = () => {
    if (step < 4) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === 4) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#fbbf24']
        });
      }
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeOnboarding({
      currency,
      initialCapital: Number(initialCapital) || 170,
      monthlyTargetPercent: Number(monthlyTarget) || 10,
      monthlyDeposit: Number(monthlyDeposit) || 170,
      monthlyDepositDay: Number(depositDay) || 25,
      depositEnabled: true,
      riskPerTradePercent: Number(riskPercent) || 1.0,
      defaultPair,
    });
  };

  const totalSteps = 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl">
      <div className="w-full max-w-[420px] bg-[#0b0f19] border border-slate-800/90 rounded-[36px] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col justify-between min-h-[580px]">
        {/* Background Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Progress Dots & Skip */}
        <div className="flex items-center justify-between z-10">
          {/* Progress Indicators */}
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-7 bg-emerald-400 shadow-glow-emerald'
                    : i < step
                    ? 'w-2.5 bg-emerald-500/40'
                    : 'w-2.5 bg-slate-800'
                }`}
              />
            ))}
          </div>

          {step < 4 && (
            <button
              onClick={handleFinish}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium px-2 py-1"
            >
              Lewati
            </button>
          )}
        </div>

        {/* Slide Content Area */}
        <div className="my-auto py-4 z-10">
          <AnimatePresence mode="wait">
            {/* Step 0: Welcome Slide */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 mx-auto shadow-glow-emerald flex items-center justify-center">
                  <div className="w-full h-full bg-[#0b0f19] rounded-[22px] flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-wider uppercase border border-emerald-500/20">
                    Selamat Datang
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Trading Journal Pro
                  </h2>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Aplikasi jurnal trading pintar untuk menumbuhkan modal secara eksponensial dan menjaga disiplin risiko.
                  </p>
                </div>

                <div className="space-y-2 text-left pt-2">
                  <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <LineChart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Compound Planner</span>
                      <span className="text-[10px] text-slate-400">Rencana target bulanan + deposit rutin terjadwal.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Dynamic Lot Sizer</span>
                      <span className="text-[10px] text-slate-400">Kalkulasi lot aman & milestone step-up/down.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">05:00 AM Daily Coaching</span>
                      <span className="text-[10px] text-slate-400">Evaluasi apa yang harus dipertahankan & diimprove.</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Initial Capital & Currency */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Langkah 1 dari 4</span>
                  <h3 className="text-base font-bold text-white">Berapa Modal Awal Anda?</h3>
                  <p className="text-xs text-slate-400">Pilih mata uang dan masukkan saldo trading awal Anda.</p>
                </div>

                {/* Currency Switcher Pill */}
                <div className="grid grid-cols-2 gap-2 bg-[#070a12] p-1 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency('USD');
                      if (currency === 'IDR') setInitialCapital(170);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      currency === 'USD'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    USD ($ Dollar)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency('IDR');
                      if (currency === 'USD') setInitialCapital(2500000);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      currency === 'IDR'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    IDR (Rp Rupiah)
                  </button>
                </div>

                {/* Initial Capital Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-semibold block">
                    Nominal Modal Awal ({currency})
                  </label>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className="w-full bg-[#070a12] border border-slate-700 focus:border-emerald-500 rounded-2xl px-4 py-3 font-mono-num text-lg font-bold text-white focus:outline-none"
                    placeholder={currency === 'USD' ? '170' : '2500000'}
                  />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(currency === 'USD' ? [170, 500, 1000, 5000] : [1000000, 2500000, 5000000, 15000000]).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setInitialCapital(amt)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono-num font-semibold transition-all ${
                          initialCapital === amt
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {formatCurrency(amt, currency)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Compound Plan & Monthly Recurring Deposit */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Langkah 2 dari 4</span>
                  <h3 className="text-base font-bold text-white">Target Profit & Deposit Rutin</h3>
                  <p className="text-xs text-slate-400">Atur target realistis dan komitmen deposit bulanan Anda.</p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Monthly Profit Target % */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold text-[11px]">Target Profit Bulanan (%)</label>
                      <span className="text-emerald-400 font-bold font-mono-num">{monthlyTarget}% / bulan</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="30"
                      step="1"
                      value={monthlyTarget}
                      onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Monthly Recurring Deposit */}
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">
                      Deposit Rutin Tiap Bulan ({currency})
                    </label>
                    <input
                      type="number"
                      value={monthlyDeposit}
                      onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                      className="w-full bg-[#070a12] border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 font-mono-num text-xs font-bold text-white focus:outline-none"
                    />
                  </div>

                  {/* Deposit Day of Month */}
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">
                      Jadwal Tanggal Deposit Bulanan
                    </label>
                    <CustomSelect
                      value={depositDay}
                      searchable={true}
                      searchPlaceholder="Cari tanggal..."
                      onChange={(val) => setDepositDay(Number(val))}
                      options={Array.from({ length: 28 }, (_, i) => ({
                        value: i + 1,
                        label: `Tanggal ${i + 1} setiap bulan`,
                      }))}
                    />
                  </div>
                </div>

                {/* Live Preview Card */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimasi Saldo 1 Tahun</span>
                    <span className="text-base font-black font-mono-num text-emerald-400">
                      {formatCurrency(livePreview.finalEquity, currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Pertumbuhan</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono-num">
                      +{livePreview.yearlyCompoundedRate}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Risk Management & Primary Pair */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Langkah 3 dari 4</span>
                  <h3 className="text-base font-bold text-white">Manajemen Risiko & Lot</h3>
                  <p className="text-xs text-slate-400">Disiplin menjaga risiko adalah kunci sukses compound.</p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Primary Pair */}
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold text-[11px]">Pair / Instrumen Utama</label>
                    <CustomSelect
                      value={defaultPair}
                      onChange={(val) => setDefaultPair(String(val))}
                      searchable={true}
                      searchPlaceholder="Cari pair..."
                      options={SUPPORTED_PAIRS.map(p => ({
                        value: p.pair,
                        label: p.pair,
                        subLabel: p.name,
                      }))}
                    />
                  </div>

                  {/* Risk per trade % */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold text-[11px]">Risiko Per Trade (%)</label>
                      <span className="text-emerald-400 font-bold font-mono-num">{riskPercent}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[0.5, 1.0, 2.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setRiskPercent(pct)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                            riskPercent === pct
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {pct}% (Standar)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Perlindungan Akun Otomatis</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">
                    Sistem akan membatasi dan memberi peringatan jika Anda memasukkan ukuran lot berlebih saat entry trade.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Ready to Trade & Summary */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-center"
              >
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 p-3 mx-auto shadow-glow-emerald flex items-center justify-center">
                  <Award className="w-8 h-8 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Setup Selesai!</span>
                  <h3 className="text-lg font-black text-white">Semua Siap Digunakan</h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Rencana compound dan aturan risiko Anda telah dikonfigurasi dengan sempurna.
                  </p>
                </div>

                {/* Recap Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Modal Awal:</span>
                    <span className="font-bold text-white font-mono-num">
                      {formatCurrency(initialCapital, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Deposit Bulanan:</span>
                    <span className="font-bold text-cyan-400 font-mono-num">
                      {formatCurrency(monthlyDeposit, currency)} (tgl {depositDay})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Target Profit:</span>
                    <span className="font-bold text-emerald-400 font-mono-num">
                      {monthlyTarget}% / bulan
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Batas Risiko:</span>
                    <span className="font-bold text-amber-300 font-mono-num">
                      {riskPercent}% per trade ({defaultPair})
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-300/90 flex items-center justify-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Evaluasi trading harian Anda akan otomatis aktif jam 05:00 AM!</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-2 z-10 flex items-center space-x-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-glow-emerald hover:opacity-95 active:scale-98 transition-all flex items-center justify-center space-x-2"
          >
            <span>{step === 4 ? 'Mulai Jurnal Trading Sekarang 🚀' : 'Lanjutkan'}</span>
            {step < 4 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
