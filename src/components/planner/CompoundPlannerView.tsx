import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { calculateCompoundProjections } from '../../lib/compoundEngine';
import { formatCurrency } from '../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  LineChart, 
  TrendingUp, 
  Table as TableIcon,
  ChevronDown,
  Sliders,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export const CompoundPlannerView: React.FC = () => {
  const { settings, updateSettings } = useJournal();

  // Local state for interactive editing before saving
  const [initialCap, setInitialCap] = useState(settings.initialCapital);
  const [monthlyDep, setMonthlyDep] = useState(settings.monthlyDeposit);
  const [depDay, setDepDay] = useState(settings.monthlyDepositDay);
  const [depositActive, setDepositActive] = useState(settings.depositEnabled);
  const [targetPct, setTargetPct] = useState(settings.monthlyTargetPercent);
  
  // Horizon in Years & Months
  const initialTotalMonths = settings.projectionMonths || 12;
  const [yearsInput, setYearsInput] = useState<number>(Math.floor(initialTotalMonths / 12));
  const [monthsInput, setMonthsInput] = useState<number>(initialTotalMonths % 12);

  // Collapsible state for Parameter Card, Monthly Table, and Daily Table
  const [isParamsOpen, setIsParamsOpen] = useState<boolean>(false);
  const [isMonthlyTableOpen, setIsMonthlyTableOpen] = useState<boolean>(true);
  const [isDailyTableOpen, setIsDailyTableOpen] = useState<boolean>(true);
  const [selectedDailyMonth, setSelectedDailyMonth] = useState<number>(1);

  // Computed total horizon in months (minimum 1 month)
  const totalHorizonMonths = Math.max(1, (Number(yearsInput) || 0) * 12 + (Number(monthsInput) || 0));

  // Sync to settings when modified
  const handleApplySettings = () => {
    updateSettings({
      initialCapital: Number(initialCap) || 0,
      monthlyDeposit: Number(monthlyDep) || 0,
      monthlyDepositDay: Number(depDay) || 25,
      depositEnabled: depositActive,
      monthlyTargetPercent: Number(targetPct) || 10,
      projectionMonths: totalHorizonMonths,
    });
  };

  const projections = calculateCompoundProjections({
    ...settings,
    initialCapital: Number(initialCap) || 0,
    monthlyDeposit: Number(monthlyDep) || 0,
    monthlyDepositDay: Number(depDay) || 25,
    depositEnabled: depositActive,
    monthlyTargetPercent: Number(targetPct) || 10,
    projectionMonths: totalHorizonMonths,
  });

  const chartData = projections.monthlyPlans.slice(1).map((m) => ({
    name: `M${m.monthIndex}`,
    deposit: m.monthlyDeposit,
    profit: m.targetProfitAmount,
    balance: m.endingBalance,
  }));

  // Selected Month for Daily Breakdown
  const activeDailyMonthPlan = projections.monthlyPlans.find(p => p.monthIndex === selectedDailyMonth) || projections.monthlyPlans[1] || projections.monthlyPlans[0];

  // Compute Daily Breakdown Rows (e.g. 22 trading days)
  const dailyPlans = React.useMemo(() => {
    if (!activeDailyMonthPlan || activeDailyMonthPlan.monthIndex === 0) return [];
    const tradingDays = settings.tradingDaysPerMonth || 22;
    const startBal = activeDailyMonthPlan.startingBalance;
    const targetProfit = activeDailyMonthPlan.targetProfitAmount;
    const dailyTarget = targetProfit / tradingDays;
    const rows = [];

    let currentDayBal = startBal;
    let accumulatedProfit = 0;

    for (let d = 1; d <= tradingDays; d++) {
      const dayStart = currentDayBal;
      accumulatedProfit += dailyTarget;
      currentDayBal = startBal + accumulatedProfit;

      const riskAmt = dayStart * (settings.riskPerTradePercent / 100);
      const slPips = settings.avgStopLossPips || 25;
      const pipVal = 10;
      const lot = Math.max(0.01, Number((riskAmt / (slPips * pipVal)).toFixed(2)));

      rows.push({
        dayIndex: d,
        dayLabel: `Hari ${d}`,
        startingBalance: Number(dayStart.toFixed(2)),
        dailyTarget: Number(dailyTarget.toFixed(2)),
        cumulativeProfit: Number(accumulatedProfit.toFixed(2)),
        endingBalance: Number(currentDayBal.toFixed(2)),
        recommendedLot: lot,
      });
    }
    return rows;
  }, [activeDailyMonthPlan, settings]);

  // Options for Month dropdown selector
  const monthOptions = projections.monthlyPlans
    .filter(p => p.monthIndex > 0)
    .map(p => ({
      value: String(p.monthIndex),
      label: p.monthLabel || `Bulan ${p.monthIndex}`,
    }));

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Title Banner */}
      <div className="px-1">
        <h2 className="text-base font-extrabold text-[#0F0F0F] flex items-center space-x-2">
          <LineChart className="w-5 h-5 text-[#0F0F0F]" />
          <span>Compound Target Planner</span>
        </h2>
        <p className="text-xs text-[#737373]">
          Simulasi target compound & kontribusi deposit bulanan
        </p>
      </div>

      {/* 1. COLLAPSIBLE PARAMETER COMPOUND & DEPOSIT CARD WITH BOUNCE ANIMATION */}
      <div className="card-light p-4 space-y-2 transition-all">
        <button
          type="button"
          onClick={() => setIsParamsOpen(!isParamsOpen)}
          className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#0F0F0F] group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-[#0F0F0F] block">
                Parameter Compound & Deposit
              </span>
              <span className="text-[10px] text-[#737373] font-medium">
                {formatCurrency(initialCap, settings.currency)} • {targetPct}%/bln • {yearsInput} Thn {monthsInput > 0 ? `${monthsInput} Bln` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7F7F5] text-[#737373] border border-[#E5E5E2]">
              {isParamsOpen ? 'Tutup' : 'Ubah Parameter'}
            </span>
            <motion.div
              animate={{ rotate: isParamsOpen ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ChevronDown className="w-4 h-4 text-[#737373]" />
            </motion.div>
          </div>
        </button>

        {/* Collapsible Form Body with Bounce Spring Animation */}
        <AnimatePresence>
          {isParamsOpen && (
            <motion.div
              key="params-body"
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{
                type: 'spring',
                bounce: 0.35,
                duration: 0.45
              }}
              className="overflow-hidden pt-3 border-t border-[#E5E5E2] space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Modal Awal (Initial Investment) */}
                <div className="space-y-1">
                  <label className="text-[#737373] text-[11px] block font-medium">Initial Capital ({settings.currency})</label>
                  <input
                    type="number"
                    value={initialCap}
                    onChange={(e) => setInitialCap(Number(e.target.value))}
                    onBlur={handleApplySettings}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
                  />
                </div>

                {/* Target Profit Bulanan (Monthly Interest Rate %) */}
                <div className="space-y-1">
                  <label className="text-[#737373] text-[11px] block font-medium">Target Profit (%) / Bulan</label>
                  <input
                    type="number"
                    step="0.5"
                    value={targetPct}
                    onChange={(e) => setTargetPct(Number(e.target.value))}
                    onBlur={handleApplySettings}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
                  />
                </div>

                {/* Monthly Recurring Deposit Nominal */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[#737373] text-[11px] font-medium">Deposit Bulanan</label>
                    <input
                      type="checkbox"
                      checked={depositActive}
                      onChange={(e) => {
                        setDepositActive(e.target.checked);
                        updateSettings({ depositEnabled: e.target.checked });
                      }}
                      className="w-3.5 h-3.5 rounded text-[#0F0F0F] focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <input
                    type="number"
                    disabled={!depositActive}
                    value={monthlyDep}
                    onChange={(e) => setMonthlyDep(Number(e.target.value))}
                    onBlur={handleApplySettings}
                    className={`w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F] ${!depositActive ? 'opacity-40' : ''}`}
                  />
                </div>

                {/* Tanggal Deposit Bulanan */}
                <div className="space-y-1">
                  <label className="text-[#737373] text-[11px] block font-medium">Tgl Deposit Tiap Bln</label>
                  <CustomSelect
                    disabled={!depositActive}
                    value={depDay}
                    searchable={true}
                    searchPlaceholder="Cari tanggal..."
                    onChange={(val) => {
                      const num = Number(val);
                      setDepDay(num);
                      updateSettings({ monthlyDepositDay: num });
                    }}
                    options={Array.from({ length: 28 }, (_, i) => ({
                      value: i + 1,
                      label: `Tgl ${i + 1}`,
                    }))}
                  />
                </div>

                {/* 2 INPUT FIELDS: TAHUN & BULAN */}
                <div className="space-y-1">
                  <label className="text-[#737373] text-[11px] block font-medium">Jangka Waktu (Tahun)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={yearsInput}
                    onChange={(e) => {
                      const y = Math.max(0, Number(e.target.value));
                      setYearsInput(y);
                      updateSettings({ projectionMonths: Math.max(1, y * 12 + monthsInput) });
                    }}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
                    placeholder="Contoh: 1, 2, 5"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#737373] text-[11px] block font-medium">Tambahan (Bulan)</label>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={monthsInput}
                    onChange={(e) => {
                      const m = Math.max(0, Number(e.target.value));
                      setMonthsInput(m);
                      updateSettings({ projectionMonths: Math.max(1, yearsInput * 12 + m) });
                    }}
                    className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-xl px-3 py-2 text-xs font-mono-num text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
                    placeholder="Contoh: 0, 6"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleApplySettings();
                  setIsParamsOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#0F0F0F] text-white font-bold text-xs shadow-sm hover:bg-black transition-all"
              >
                Terapkan & Simpan Parameter
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. MAIN RESULTS SHOWCASE (10% ACCENT - Pitch Black Card) */}
      <div className="card-dark-hero p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-white" />
            <span>
              Target {yearsInput > 0 ? `${yearsInput} Tahun ` : ''}{monthsInput > 0 ? `${monthsInput} Bulan` : (yearsInput === 0 ? `${totalHorizonMonths} Bulan` : '')} ({totalHorizonMonths} Bln)
            </span>
          </span>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            {targetPct}% monthly
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Future Investment Value */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#A3A3A3] block font-medium">Future Investment Value</span>
            <span className="text-2xl font-black font-mono-num text-emerald-400 block">
              {formatCurrency(projections.finalEquity, settings.currency)}
            </span>
          </div>

          {/* Additional Deposits */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#A3A3A3] block font-medium">Additional Deposits</span>
            <span className="text-xl font-bold font-mono-num text-white block">
              {formatCurrency(projections.additionalDeposits, settings.currency)}
            </span>
          </div>

          {/* Total Interest Earned */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#A3A3A3] block font-medium">Total Profit Interest</span>
            <span className="text-xl font-bold font-mono-num text-amber-400 block">
              +{formatCurrency(projections.totalProfitGenerated, settings.currency)}
            </span>
          </div>

          {/* Monthly rate -> Yearly Compounded */}
          <div className="space-y-1">
            <span className="text-[11px] text-[#A3A3A3] block font-medium">Yearly Compounded</span>
            <span className="text-base font-extrabold font-mono-num text-white block">
              {targetPct}% → <span className="text-emerald-400">{projections.yearlyCompoundedRate}%</span>
            </span>
          </div>

          {/* Initial Balance */}
          <div className="space-y-0.5 pt-2 border-t border-neutral-800">
            <span className="text-[10px] text-[#A3A3A3] block">Initial Balance</span>
            <span className="text-xs font-bold font-mono-num text-neutral-300">
              {formatCurrency(projections.initialBalance, settings.currency)}
            </span>
          </div>

          {/* Time-Weighted Return */}
          <div className="space-y-0.5 pt-2 border-t border-neutral-800">
            <span className="text-[10px] text-[#A3A3A3] block">Total Return</span>
            <span className="text-xs font-bold font-mono-num text-emerald-400 flex items-center space-x-0.5">
              <TrendingUp className="w-3 h-3 inline" />
              <span>+{projections.timeWeightedReturn}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="card-light p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#0F0F0F]">Grafik Akumulasi Modal & Profit</h3>
          <span className="text-[10px] text-[#737373] font-semibold">{totalHorizonMonths} Bulan ke Depan</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} tickLine={false} />
              <YAxis stroke="#A3A3A3" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E5E2',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#0F0F0F',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}
                formatter={(value: any) => [formatCurrency(Number(value), settings.currency)]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="profit" name="Target Interest / Profit" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="deposit" name="Monthly Deposit" fill="#0F0F0F" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. COLLAPSIBLE MONTHLY BREAKDOWN TABLE */}
      <div className="card-light p-4 space-y-3 transition-all">
        <button
          type="button"
          onClick={() => setIsMonthlyTableOpen(!isMonthlyTableOpen)}
          className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#0F0F0F] group-hover:scale-105 transition-transform">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-[#0F0F0F]">Monthly Breakdown Table</span>
                <span className="text-[10px] px-2 py-0.2 rounded-md bg-[#F7F7F5] border border-[#E5E5E2] font-mono-num font-semibold text-[#737373]">
                  Month 0 - {totalHorizonMonths}
                </span>
              </div>
              <span className="text-[10px] text-[#737373] block mt-0.5">
                {isMonthlyTableOpen ? 'Tutup tabel proyeksi bulanan' : 'Klik untuk melihat detail modal & profit per bulan'}
              </span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isMonthlyTableOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-7 h-7 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#737373]"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isMonthlyTableOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden pt-2"
            >
              <div className="overflow-x-auto max-h-96 rounded-2xl border border-[#E5E5E2]">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-[#F7F7F5] sticky top-0 z-10 border-b border-[#E5E5E2] text-[10px] uppercase text-[#737373] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Month</th>
                      <th className="py-2.5 px-3">Deposits</th>
                      <th className="py-2.5 px-3">Interest</th>
                      <th className="py-2.5 px-3 text-[#0F0F0F]">Total Dep</th>
                      <th className="py-2.5 px-3 text-amber-600">Accrued</th>
                      <th className="py-2.5 px-3 text-emerald-600 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-right">Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E2] font-mono-num">
                    {projections.monthlyPlans.map((plan) => (
                      <tr key={plan.monthIndex} className={plan.monthIndex === 0 ? 'bg-[#F7F7F5] text-[#737373]' : 'hover:bg-[#FAFAF8]'}>
                        <td className="py-2 px-3 font-sans font-bold text-[#0F0F0F]">
                          {plan.monthIndex === 0 ? '0 (Start)' : plan.monthIndex}
                        </td>
                        <td className="py-2 px-3 text-[#525252]">
                          {formatCurrency(plan.monthlyDeposit, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-emerald-600 font-semibold">
                          {plan.monthIndex === 0 ? '—' : `+${formatCurrency(plan.targetProfitAmount, settings.currency)}`}
                        </td>
                        <td className="py-2 px-3 text-[#0F0F0F] font-semibold">
                          {formatCurrency(plan.cumulativeDeposits, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-amber-600">
                          {plan.monthIndex === 0 ? '—' : formatCurrency(plan.accruedInterest, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-[#0F0F0F]">
                          {formatCurrency(plan.endingBalance, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-sans font-bold text-[#0F0F0F]">
                          {plan.recommendedLot}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. COLLAPSIBLE DAILY BREAKDOWN TABLE (WITH MONTH SELECTOR DROPDOWN) */}
      <div className="card-light p-4 space-y-3 transition-all">
        <button
          type="button"
          onClick={() => setIsDailyTableOpen(!isDailyTableOpen)}
          className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#0F0F0F] group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold text-[#0F0F0F]">Daily Breakdown Table</span>
                <span className="text-[10px] px-2 py-0.2 rounded-md bg-emerald-50 border border-emerald-200 font-mono-num font-bold text-emerald-700">
                  {settings.tradingDaysPerMonth || 22} Hari Trading
                </span>
              </div>
              <span className="text-[10px] text-[#737373] block mt-0.5">
                {isDailyTableOpen ? 'Tutup rincian target harian' : 'Klik untuk melihat rincian target profit & lot per hari'}
              </span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isDailyTableOpen ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-7 h-7 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-[#737373]"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <AnimatePresence>
          {isDailyTableOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden pt-2 space-y-3"
            >
              {/* Dropdown Filter for Month Selection */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E5E2]">
                <div className="text-[11px] font-bold text-[#0F0F0F] whitespace-nowrap">
                  Pilih Bulan:
                </div>
                <div className="w-48 flex-shrink-0">
                  <CustomSelect
                    value={String(selectedDailyMonth)}
                    onChange={(val) => setSelectedDailyMonth(Number(val) || 1)}
                    options={monthOptions}
                  />
                </div>
              </div>

              {/* Month Snapshot Metrics Banner */}
              {activeDailyMonthPlan && activeDailyMonthPlan.monthIndex > 0 && (
                <div className="grid grid-cols-3 gap-2 bg-[#F7F7F5] p-2.5 rounded-2xl border border-[#E5E5E2] text-[11px]">
                  <div>
                    <span className="text-[#737373] text-[10px] block">Modal Awal Bulan</span>
                    <span className="font-mono-num font-bold text-[#0F0F0F]">
                      {formatCurrency(activeDailyMonthPlan.startingBalance, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737373] text-[10px] block">Target / Hari</span>
                    <span className="font-mono-num font-bold text-emerald-600">
                      +{formatCurrency(activeDailyMonthPlan.dailyProfitTarget, settings.currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#737373] text-[10px] block">Target Bulan Ini</span>
                    <span className="font-mono-num font-bold text-[#0F0F0F]">
                      +{formatCurrency(activeDailyMonthPlan.targetProfitAmount, settings.currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Daily Table List */}
              <div className="overflow-x-auto max-h-96 rounded-2xl border border-[#E5E5E2]">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead className="bg-[#F7F7F5] sticky top-0 z-10 border-b border-[#E5E5E2] text-[10px] uppercase text-[#737373] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Hari</th>
                      <th className="py-2.5 px-3 text-[#525252]">Start Bal</th>
                      <th className="py-2.5 px-3 text-emerald-600">Target Harian</th>
                      <th className="py-2.5 px-3 text-amber-600">Akumulasi</th>
                      <th className="py-2.5 px-3 text-emerald-600 text-right">Saldo Target</th>
                      <th className="py-2.5 px-3 text-right">Lot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E2] font-mono-num">
                    {dailyPlans.map((day) => (
                      <tr key={day.dayIndex} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-2 px-3 font-sans font-bold text-[#0F0F0F]">
                          {day.dayLabel}
                        </td>
                        <td className="py-2 px-3 text-[#525252]">
                          {formatCurrency(day.startingBalance, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-emerald-600 font-semibold">
                          +{formatCurrency(day.dailyTarget, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-amber-600">
                          +{formatCurrency(day.cumulativeProfit, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-extrabold text-[#0F0F0F]">
                          {formatCurrency(day.endingBalance, settings.currency)}
                        </td>
                        <td className="py-2 px-3 text-right font-sans font-bold text-[#0F0F0F]">
                          {day.recommendedLot}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
