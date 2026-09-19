import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { calculateCompoundProjections } from '../../lib/compoundEngine';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { CustomSelect } from '../ui/CustomSelect';
import { 
  LineChart, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  Zap, 
  Clock, 
  ArrowUpRight,
  ShieldCheck,
  Percent,
  Table as TableIcon
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

export const CompoundPlannerView: React.FC = () => {
  const { settings, updateSettings } = useJournal();

  // Local state for interactive editing before saving
  const [initialCap, setInitialCap] = useState(settings.initialCapital);
  const [monthlyDep, setMonthlyDep] = useState(settings.monthlyDeposit);
  const [depDay, setDepDay] = useState(settings.monthlyDepositDay);
  const [depositActive, setDepositActive] = useState(settings.depositEnabled);
  const [targetPct, setTargetPct] = useState(settings.monthlyTargetPercent);
  const [horizon, setHorizon] = useState(settings.projectionMonths || 12);

  // Sync to settings when modified
  const handleApplySettings = () => {
    updateSettings({
      initialCapital: Number(initialCap) || 0,
      monthlyDeposit: Number(monthlyDep) || 0,
      monthlyDepositDay: Number(depDay) || 25,
      depositEnabled: depositActive,
      monthlyTargetPercent: Number(targetPct) || 10,
      projectionMonths: Number(horizon) || 12,
    });
  };

  const projections = calculateCompoundProjections({
    ...settings,
    initialCapital: Number(initialCap) || 0,
    monthlyDeposit: Number(monthlyDep) || 0,
    monthlyDepositDay: Number(depDay) || 25,
    depositEnabled: depositActive,
    monthlyTargetPercent: Number(targetPct) || 10,
    projectionMonths: Number(horizon) || 12,
  });

  const chartData = projections.monthlyPlans.slice(1).map((m) => ({
    name: `M${m.monthIndex}`,
    deposit: m.monthlyDeposit,
    profit: m.targetProfitAmount,
    balance: m.endingBalance,
  }));

  return (
    <div className="p-4 space-y-4">
      {/* Title Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <LineChart className="w-5 h-5 text-emerald-400" />
            <span>Compound Interest Calculator</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kalkulasi pertumbuhan compound standar dengan kontribusi deposit rutin
          </p>
        </div>
      </div>

      {/* Plan Settings Controls Box */}
      <div className="rounded-3xl p-4 bg-slate-900/90 border border-slate-800/80 space-y-3.5 shadow-lg">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
          Parameter Compound & Deposit
        </span>

        <div className="grid grid-cols-2 gap-3 text-xs">
          {/* Modal Awal (Initial Investment) */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Initial Investment ({settings.currency})</label>
            <div className="relative">
              <input
                type="number"
                value={initialCap}
                onChange={(e) => {
                  setInitialCap(Number(e.target.value));
                }}
                onBlur={handleApplySettings}
                className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Target Profit Bulanan (Monthly Interest Rate %) */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Interest Rate (%) per Bulan</label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                value={targetPct}
                onChange={(e) => {
                  setTargetPct(Number(e.target.value));
                }}
                onBlur={handleApplySettings}
                className="w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Monthly Recurring Deposit Nominal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-400 text-[11px]">Deposit Bulanan ({settings.currency})</label>
              <input
                type="checkbox"
                checked={depositActive}
                onChange={(e) => {
                  setDepositActive(e.target.checked);
                  updateSettings({ depositEnabled: e.target.checked });
                }}
                className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
              />
            </div>
            <input
              type="number"
              disabled={!depositActive}
              value={monthlyDep}
              onChange={(e) => {
                setMonthlyDep(Number(e.target.value));
              }}
              onBlur={handleApplySettings}
              className={`w-full bg-[#070a12] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-num text-white focus:outline-none focus:border-emerald-500 ${!depositActive ? 'opacity-40' : ''}`}
            />
          </div>

          {/* Tanggal Deposit Bulanan */}
          <div className="space-y-1">
            <label className="text-slate-400 text-[11px] block">Tanggal Deposit Tiap Bulan</label>
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
                label: `Tanggal ${i + 1}`,
              }))}
            />
          </div>
        </div>

        {/* Projection Horizon Tabs */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">Periode Waktu:</span>
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl">
            {[6, 12, 24, 36].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setHorizon(m);
                  updateSettings({ projectionMonths: m });
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  horizon === m
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {m} Bln {m === 12 ? '(1 Thn)' : m === 24 ? '(2 Thn)' : m === 36 ? '(3 Thn)' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Results Showcase Grid (Matching The Calculator Site Layout) */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-[#0b1424] to-[#07131e] border border-emerald-500/30 space-y-4 shadow-glow-emerald">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Calculation for {horizon / 12 >= 1 ? `${(horizon / 12).toFixed(0)} year(s)` : `${horizon} months`}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
            {targetPct}% monthly
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Future Investment Value */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Future Investment Value</span>
            <span className="text-2xl font-black font-mono-num text-emerald-400 glow-text-emerald block">
              {formatCurrency(projections.finalEquity, settings.currency)}
            </span>
          </div>

          {/* Additional Deposits */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Additional Deposits</span>
            <span className="text-xl font-bold font-mono-num text-cyan-400 block">
              {formatCurrency(projections.additionalDeposits, settings.currency)}
            </span>
          </div>

          {/* Total Interest Earned */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Total Interest Earned</span>
            <span className="text-xl font-bold font-mono-num text-amber-400 block">
              +{formatCurrency(projections.totalProfitGenerated, settings.currency)}
            </span>
          </div>

          {/* Monthly rate -> Yearly Compounded */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Yearly Compounded</span>
            <span className="text-base font-extrabold font-mono-num text-slate-200 block">
              {targetPct}% → <span className="text-emerald-400">{projections.yearlyCompoundedRate}%</span>
            </span>
          </div>

          {/* Initial Balance */}
          <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Initial Balance</span>
            <span className="text-xs font-bold font-mono-num text-slate-300">
              {formatCurrency(projections.initialBalance, settings.currency)}
            </span>
          </div>

          {/* Time-Weighted Return */}
          <div className="space-y-0.5 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 block">Time-Weighted Return</span>
            <span className="text-xs font-bold font-mono-num text-emerald-400 flex items-center space-x-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-400 inline" />
              <span>+{projections.timeWeightedReturn}%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Projection Chart */}
      <div className="rounded-3xl p-4 bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200">Grafik Akumulasi Modal & Profit</h3>
          <span className="text-[10px] text-slate-400 font-semibold">{horizon} Bulan ke Depan</span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#fff',
                }}
                formatter={(value: any) => [formatCurrency(Number(value), settings.currency)]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="profit" name="Target Interest / Profit" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="deposit" name="Monthly Deposit" fill="#06b6d4" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown Table (Matching screenshot columns) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
            <TableIcon className="w-4 h-4 text-emerald-400" />
            <span>Monthly Breakdown Table</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono-num">Month 0 - {horizon}</span>
        </div>

        <div className="rounded-2xl border border-slate-800/80 overflow-hidden bg-slate-900/60">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead className="bg-slate-900/95 sticky top-0 z-10 border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Deposits</th>
                  <th className="py-2.5 px-3">Interest</th>
                  <th className="py-2.5 px-3 text-cyan-400">Total Deposits</th>
                  <th className="py-2.5 px-3 text-amber-400">Accrued Interest</th>
                  <th className="py-2.5 px-3 text-emerald-400 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-right">Lot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono-num">
                {projections.monthlyPlans.map((plan) => (
                  <tr key={plan.monthIndex} className={plan.monthIndex === 0 ? 'bg-slate-900/40 text-slate-400' : 'hover:bg-slate-800/40'}>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-200">
                      {plan.monthIndex === 0 ? '0 (Start)' : plan.monthIndex}
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {formatCurrency(plan.monthlyDeposit, settings.currency)}
                    </td>
                    <td className="py-2 px-3 text-emerald-400">
                      {plan.monthIndex === 0 ? '—' : `+${formatCurrency(plan.targetProfitAmount, settings.currency)}`}
                    </td>
                    <td className="py-2 px-3 text-cyan-400 font-semibold">
                      {formatCurrency(plan.cumulativeDeposits, settings.currency)}
                    </td>
                    <td className="py-2 px-3 text-amber-400">
                      {plan.monthIndex === 0 ? '—' : formatCurrency(plan.accruedInterest, settings.currency)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white">
                      {formatCurrency(plan.endingBalance, settings.currency)}
                    </td>
                    <td className="py-2 px-3 text-right font-sans font-bold text-amber-300">
                      {plan.recommendedLot}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
