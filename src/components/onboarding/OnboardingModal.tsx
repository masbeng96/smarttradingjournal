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
  Zap, 
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
          colors: ['#0F0F0F', '#10b981', '#06b6d4']
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-[420px] bg-white border border-[#E5E5E2] rounded-[36px] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
        {/* Top Header: Progress Dots & Skip */}
        <div className="flex items-center justify-between z-10">
          {/* Progress Indicators */}
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-7 bg-[#0F0F0F]'
                    : i < step
                    ? 'w-2.5 bg-[#737373]'
                    : 'w-2.5 bg-[#E5E5E2]'
                }`}
              />
            ))}
          </div>

          {step < 4 && (
            <button
              onClick={handleFinish}
              className="text-xs text-[#737373] hover:text-[#0F0F0F] transition-colors font-bold px-2 py-1"
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
                <div className="w-16 h-16 rounded-3xl bg-[#0F0F0F] text-white p-0.5 mx-auto shadow-sm flex items-center justify-center">
                  <TrendingUp className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#F2F2EF] text-[#0F0F0F] text-[10px] font-bold tracking-wider uppercase border border-[#E5E5E2]">
                    Selamat Datang
                  </div>
                  <h2 className="text-xl font-extrabold text-[#0F0F0F] tracking-tight">
                    Trading Journal Pro
                  </h2>
                  <p className="text-xs text-[#737373] max-w-xs mx-auto leading-relaxed">
                    Aplikasi jurnal trading pintar untuk menumbuhkan modal secara eksponensial dan disiplin risiko.
                  </p>
                </div>

                <div className="space-y-2 text-left pt-2">
                  <div className="p-3 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E5E2] text-[#0F0F0F] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <LineChart className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0F0F0F] block">Compound Planner</span>
                      <span className="text-[10px] text-[#737373]">Target bulanan & deposit terjadwal.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E5E2] text-[#0F0F0F] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0F0F0F] block">Dynamic Lot Sizer</span>
                      <span className="text-[10px] text-[#737373]">Kalkulasi lot aman & milestone step-up/down.</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E5E2] text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0F0F0F] block">05:00 AM Daily Coaching</span>
                      <span className="text-[10px] text-[#737373]">Evaluasi psikologi & disiplin trading.</span>
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
                  <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Langkah 1 dari 4</span>
                  <h3 className="text-base font-extrabold text-[#0F0F0F]">Berapa Modal Awal Anda?</h3>
                  <p className="text-xs text-[#737373]">Pilih mata uang dan masukkan saldo trading awal Anda.</p>
                </div>

                {/* Currency Switcher Pill */}
                <div className="grid grid-cols-2 gap-2 bg-[#F7F7F5] p-1 rounded-2xl border border-[#E5E5E2]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency('USD');
                      if (currency === 'IDR') setInitialCapital(170);
                    }}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      currency === 'USD'
                        ? 'bg-[#0F0F0F] text-white shadow-sm'
                        : 'text-[#737373] hover:text-[#0F0F0F]'
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
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      currency === 'IDR'
                        ? 'bg-[#0F0F0F] text-white shadow-sm'
                        : 'text-[#737373] hover:text-[#0F0F0F]'
                    }`}
                  >
                    IDR (Rp Rupiah)
                  </button>
                </div>

                {/* Initial Capital Input */}
                <div className="space-y-1.5">
                  <label className="text-xs text-[#0F0F0F] font-bold block">
                    Nominal Modal Awal ({currency})
                  </label>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#0F0F0F] rounded-2xl px-4 py-3 font-mono-num text-lg font-bold text-[#0F0F0F] focus:outline-none"
                    placeholder={currency === 'USD' ? '170' : '2500000'}
                  />
                </div>

                {/* Quick Suggestion Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] text-[#737373] font-medium">Pilihan Cepat:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(currency === 'USD' ? [170, 500, 1000, 5000] : [1000000, 2500000, 5000000, 15000000]).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setInitialCapital(amt)}
                        className={`px-3 py-1 rounded-xl text-xs font-mono-num font-bold transition-all ${
                          initialCapital === amt
                            ? 'bg-[#0F0F0F] text-white'
                            : 'bg-[#F7F7F5] text-[#737373] border border-[#E5E5E2] hover:text-[#0F0F0F]'
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
                  <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Langkah 2 dari 4</span>
                  <h3 className="text-base font-extrabold text-[#0F0F0F]">Target Profit & Deposit Rutin</h3>
                  <p className="text-xs text-[#737373]">Atur target realistis dan deposit bulanan Anda.</p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Monthly Profit Target % */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[#0F0F0F] font-bold text-[11px]">Target Profit Bulanan (%)</label>
                      <span className="text-emerald-700 font-extrabold font-mono-num">{monthlyTarget}% / bulan</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="30"
                      step="1"
                      value={monthlyTarget}
                      onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                      className="w-full accent-[#0F0F0F] bg-[#E5E5E2] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Monthly Recurring Deposit */}
                  <div className="space-y-1">
                    <label className="text-[#0F0F0F] font-bold text-[11px]">
                      Deposit Rutin Tiap Bulan ({currency})
                    </label>
                    <input
                      type="number"
                      value={monthlyDeposit}
                      onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                      className="w-full bg-[#F7F7F5] border border-[#E5E5E2] focus:border-[#0F0F0F] rounded-xl px-3 py-2 font-mono-num text-xs font-bold text-[#0F0F0F] focus:outline-none"
                    />
                  </div>

                  {/* Deposit Day of Month */}
                  <div className="space-y-1">
                    <label className="text-[#0F0F0F] font-bold text-[11px]">
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
                <div className="p-3 rounded-2xl bg-[#0F0F0F] text-white flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-[#A3A3A3] block">Estimasi Saldo 1 Tahun</span>
                    <span className="text-base font-black font-mono-num text-emerald-400">
                      {formatCurrency(livePreview.finalEquity, currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#A3A3A3] block">Pertumbuhan</span>
                    <span className="text-xs font-bold text-white font-mono-num">
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
                  <span className="text-[10px] font-extrabold text-[#737373] uppercase tracking-wider">Langkah 3 dari 4</span>
                  <h3 className="text-base font-extrabold text-[#0F0F0F]">Manajemen Risiko & Lot</h3>
                  <p className="text-xs text-[#737373]">Disiplin menjaga risiko adalah kunci sukses compound.</p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Primary Pair */}
                  <div className="space-y-1">
                    <label className="text-[#0F0F0F] font-bold text-[11px]">Pair / Instrumen Utama</label>
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
                      <label className="text-[#0F0F0F] font-bold text-[11px]">Risiko Per Trade (%)</label>
                      <span className="text-emerald-700 font-extrabold font-mono-num">{riskPercent}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[0.5, 1.0, 2.0].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setRiskPercent(pct)}
                          className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                            riskPercent === pct
                              ? 'bg-[#0F0F0F] text-white'
                              : 'bg-[#F7F7F5] text-[#737373] border border-[#E5E5E2]'
                          }`}
                        >
                          {pct}% (Standar)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] text-[11px] text-[#0F0F0F] space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#0F0F0F] font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Perlindungan Akun Otomatis</span>
                  </div>
                  <p className="text-[#737373] text-[10px]">
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
                <div className="w-14 h-14 rounded-3xl bg-[#0F0F0F] text-white p-3 mx-auto shadow-sm flex items-center justify-center">
                  <Award className="w-8 h-8 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Setup Selesai!</span>
                  <h3 className="text-lg font-black text-[#0F0F0F]">Semua Siap Digunakan</h3>
                  <p className="text-xs text-[#737373] max-w-xs mx-auto">
                    Rencana compound dan aturan risiko Anda telah siap.
                  </p>
                </div>

                {/* Recap Card */}
                <div className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] text-xs text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737373]">Modal Awal:</span>
                    <span className="font-extrabold text-[#0F0F0F] font-mono-num">
                      {formatCurrency(initialCapital, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737373]">Deposit Bulanan:</span>
                    <span className="font-extrabold text-[#0F0F0F] font-mono-num">
                      {formatCurrency(monthlyDeposit, currency)} (tgl {depositDay})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737373]">Target Profit:</span>
                    <span className="font-extrabold text-emerald-700 font-mono-num">
                      {monthlyTarget}% / bulan
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737373]">Batas Risiko:</span>
                    <span className="font-extrabold text-[#0F0F0F] font-mono-num">
                      {riskPercent}% per trade ({defaultPair})
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800 flex items-center justify-center space-x-1 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
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
              className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] text-[#0F0F0F] hover:bg-[#F2F2EF] transition-all flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3.5 rounded-2xl bg-[#0F0F0F] text-white font-extrabold text-xs hover:bg-black active:scale-98 transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <span>{step === 4 ? 'Mulai Jurnal Trading Sekarang 🚀' : 'Lanjutkan'}</span>
            {step < 4 && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
