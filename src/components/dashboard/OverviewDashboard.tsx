import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Target, 
  Calendar, 
  ArrowUpRight, 
  Sparkles,
  Zap,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export const OverviewDashboard: React.FC = () => {
  const { 
    settings, 
    currentEquity, 
    totalRealizedPnl, 
    winRate, 
    profitFactor, 
    activeLotAdvice,
    trades, 
    latestReport, 
    setActiveTab,
    setIsNewTradeModalOpen 
  } = useJournal();

  const growthPercent = settings.initialCapital > 0 
    ? (totalRealizedPnl / settings.initialCapital) * 100 
    : 0;

  // Daily target calculation
  const monthlyTargetAmount = currentEquity * (settings.monthlyTargetPercent / 100);
  const dailyTargetAmount = monthlyTargetAmount / (settings.tradingDaysPerMonth || 22);

  // Chart data: chronological equity curve
  const chartData = React.useMemo(() => {
    let runningBalance = settings.initialCapital;
    const sortedTrades = [...trades].sort((a, b) => a.createdAt - b.createdAt);
    
    const points = [{
      name: 'Start',
      balance: settings.initialCapital,
      pnl: 0,
    }];

    sortedTrades.forEach((trade, index) => {
      if (trade.outcome !== 'OPEN') {
        runningBalance += trade.pnl;
        points.push({
          name: `T${index + 1}`,
          balance: Number(runningBalance.toFixed(2)),
          pnl: trade.pnl,
        });
      }
    });

    return points;
  }, [trades, settings.initialCapital]);

  // Recent 4 trades
  const recentTrades = trades.slice(0, 4);

  return (
    <div className="p-4 space-y-4">
      {/* 1. Hero Balance & Equity Card */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-[#0b1324] to-[#07131e] border border-emerald-500/20 shadow-glow-emerald">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Saldo Akun (Equity)
            </span>
            <div className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              growthPercent >= 0 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {growthPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{formatPercent(growthPercent, 1)}</span>
            </div>
          </div>

          <div className="flex items-baseline space-x-2">
            <div className="text-3xl font-black font-mono-num tracking-tight text-white glow-text-emerald">
              {formatCurrency(currentEquity, settings.currency)}
            </div>
          </div>

          {/* Sub-info: Modal Awal & Total Net PnL */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Modal Awal:</span>
              <span className="font-semibold text-slate-200 font-mono-num">
                {formatCurrency(settings.initialCapital, settings.currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Realized PnL:</span>
              <span className={`font-semibold font-mono-num ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalRealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnl, settings.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dynamic Lot Sizing & Risk Directive Banner */}
      <div className="rounded-2xl p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Rekomendasi Lot Sesi Ini</div>
            <div className="text-base font-extrabold font-mono-num text-emerald-300">
              {activeLotAdvice.recommendedLot} Lot
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                (Risk {settings.riskPerTradePercent}%)
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('risk')}
          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center space-x-1"
        >
          <span>Atur Risk</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. Monthly Recurring Deposit Schedule Card */}
      {settings.depositEnabled && (
        <div className="rounded-2xl p-3.5 bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Deposit Rutin: {formatCurrency(settings.monthlyDeposit, settings.currency)}
              </div>
              <div className="text-[11px] text-slate-400">
                Dijadwalkan setiap tanggal <span className="text-cyan-400 font-bold">{settings.monthlyDepositDay}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('planner')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            Lihat Plan
          </button>
        </div>
      )}

      {/* 4. Performance Metric Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl p-3 bg-slate-900/70 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Win Rate</span>
          <span className={`text-base font-extrabold font-mono-num ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {winRate}%
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{trades.length} Total Trade</span>
        </div>

        <div className="rounded-2xl p-3 bg-slate-900/70 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Target Harian</span>
          <span className="text-sm font-bold font-mono-num text-cyan-400">
            {formatCurrency(dailyTargetAmount, settings.currency)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{settings.monthlyTargetPercent}% / Bulan</span>
        </div>

        <div className="rounded-2xl p-3 bg-slate-900/70 border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Profit Factor</span>
          <span className={`text-base font-extrabold font-mono-num ${profitFactor >= 1.5 ? 'text-emerald-400' : 'text-slate-200'}`}>
            {profitFactor}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">RR {settings.targetRRR}:1</span>
        </div>
      </div>

      {/* 5. Equity Growth Chart */}
      <div className="rounded-3xl p-4 bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200">Kurva Pertumbuhan Akun</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono-num">
            {trades.length > 0 ? `${trades.length} Closed Trades` : 'Modal Awal'}
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(value: any) => [formatCurrency(Number(value), settings.currency), 'Balance']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#equityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. 5:00 AM Coaching Highlight Preview */}
      {latestReport && (
        <div 
          onClick={() => setActiveTab('coaching')}
          className="rounded-2xl p-4 bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 cursor-pointer hover:border-amber-500/50 transition-all space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Analisa 05:00 AM Hari Ini</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
              Disiplin: {latestReport.disciplineScore}%
            </span>
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">
            {latestReport.whatToMaintain[0] || latestReport.whatToImprove[0]}
          </p>
          <div className="flex items-center justify-end text-[11px] text-amber-400 font-semibold space-x-1">
            <span>Buka Evaluasi Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 7. Recent Trade Entries */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200">Riwayat Entry Terakhir</h3>
          </div>
          <button
            onClick={() => setActiveTab('journal')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-0.5"
          >
            <span>Semua Jurnal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTrades.length === 0 ? (
          <div className="rounded-2xl p-6 bg-slate-900/40 border border-slate-800 text-center space-y-2">
            <div className="text-slate-400 text-xs">Belum ada trade yang dicatat.</div>
            <button
              onClick={() => setIsNewTradeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all inline-flex items-center space-x-1.5"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Catat Entry Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTrades.map((trade) => {
              const isWin = trade.outcome === 'WIN';
              const isLoss = trade.outcome === 'LOSS';
              return (
                <div
                  key={trade.id}
                  className="rounded-2xl p-3 bg-slate-900/80 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      trade.direction === 'BUY' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {trade.direction}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white">{trade.pair}</span>
                        <span className="text-[10px] text-slate-400 font-mono-num">{trade.lotSize} Lot</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {trade.strategy || 'Standard Setup'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono-num ${
                      isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl, settings.currency)}
                    </div>
                    <div className={`text-[10px] font-semibold ${
                      isWin ? 'text-emerald-500' : isLoss ? 'text-rose-500' : 'text-slate-400'
                    }`}>
                      {trade.outcome}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
