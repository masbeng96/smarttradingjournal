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
  BookOpen,
  RotateCcw,
  Activity,
  WifiOff,
  CalendarDays
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
    setIsNewTradeModalOpen,
    mt5Data,
    assignedAccountId,
    userProfile,
    setIsAuthModalOpen,
    isMT5Loading,
    mt5Error,
    refreshMT5Data
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
      {/* 1. Hero Balance & MT5 Live Sync Card */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-[#0b1324] to-[#07131e] border border-emerald-500/20 shadow-glow-emerald">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5">
          {/* Header Bar with Live Indicator & Refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Total Saldo Akun (Equity)
              </span>
              
              {/* MT5 Status Badge */}
              {assignedAccountId ? (
                mt5Data?.isConnected ? (
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>MT5 Live: Akun {assignedAccountId}</span>
                  </div>
                ) : isMT5Loading ? (
                  <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Syncing Akun {assignedAccountId}...</span>
                  </div>
                ) : mt5Error ? (
                  <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>Akun {assignedAccountId} Offline</span>
                  </div>
                ) : null
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 hover:text-emerald-300 hover:bg-slate-700 border border-slate-700 transition-all"
                  title="Login untuk mengaktifkan Auto-Sync MT5"
                >
                  <span>Manual Offline</span>
                  <span className="text-[9px] text-emerald-400 font-bold ml-0.5">(Login MT5)</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              {assignedAccountId && (
                <button
                  onClick={() => refreshMT5Data()}
                  disabled={isMT5Loading}
                  title="Refresh Data MT5 Real-Time"
                  className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isMT5Loading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              )}

              <div className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                (mt5Data ? mt5Data.floating_pnl : growthPercent) >= 0 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {(mt5Data ? mt5Data.floating_pnl : growthPercent) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>
                  {mt5Data 
                    ? `${mt5Data.floating_pnl >= 0 ? '+' : ''}${formatCurrency(mt5Data.floating_pnl, settings.currency)}`
                    : formatPercent(growthPercent, 1)
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Equity Main Number */}
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black font-mono-num tracking-tight text-white glow-text-emerald">
              {formatCurrency(currentEquity, settings.currency)}
            </div>
            {assignedAccountId && mt5Data?.isConnected ? (
              <span className="text-[11px] text-emerald-400/90 font-mono-num font-semibold">
                Auto-Sync Akun {assignedAccountId} 🟢
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono-num">
                Data Default Manual
              </span>
            )}
          </div>

          {/* MT5 Metrics Grid */}
          <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Balance (Saldo):</span>
              <span className="font-semibold text-slate-200 font-mono-num text-xs">
                {formatCurrency(mt5Data ? mt5Data.balance : settings.initialCapital, settings.currency)}
              </span>
            </div>
            
            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Floating PnL:</span>
              <span className={`font-semibold font-mono-num text-xs ${
                (mt5Data?.floating_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {mt5Data 
                  ? `${(mt5Data.floating_pnl ?? 0) >= 0 ? '+' : ''}${formatCurrency(mt5Data.floating_pnl ?? 0, settings.currency)}`
                  : '$0.00 (Offline)'
                }
              </span>
            </div>

            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Margin Terpakai:</span>
              <span className="font-semibold text-cyan-300 font-mono-num text-xs">
                {formatCurrency(mt5Data?.margin ?? 0, settings.currency)}
              </span>
            </div>

            <div className="bg-slate-900/50 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Realized Jurnal:</span>
              <span className={`font-semibold font-mono-num text-xs ${
                totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {totalRealizedPnl >= 0 ? '+' : ''}
                {formatCurrency(totalRealizedPnl, settings.currency)}
              </span>
            </div>
          </div>

          {/* Sync Timestamp Info */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-emerald-500/70" />
              <span>
                {assignedAccountId 
                  ? `Interval Polling: 5s • ${userProfile?.email} (Akun ${assignedAccountId})` 
                  : 'Mode Offline (Tanpa Auto-Sync MT5)'}
              </span>
            </span>
            <span>
              {assignedAccountId
                ? (mt5Data?.lastUpdated ? `Terakhir update: ${mt5Data.lastUpdated}` : 'Menghubungkan...')
                : 'Login untuk Live Sync'}
            </span>
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

      {/* 2.5 Quick Forex Factory Economic Calendar Banner */}
      {settings.showEconomicCalendarBanner !== false && (
        <div 
          onClick={() => setActiveTab('calendar')}
          className="rounded-2xl p-3.5 bg-gradient-to-r from-[#0a1526] via-slate-900 to-[#07131e] border border-cyan-500/30 flex items-center justify-between cursor-pointer hover:border-cyan-500/50 transition-all shadow-sm group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <span>Kalender Berita Ekonomi</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Pantau rilis data High-Impact (CPI, FOMC, NFP)
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab('calendar'); }}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center space-x-1"
          >
            <span>Buka</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
          <div className="rounded-2xl p-6 bg-slate-900/40 border border-slate-800 text-center space-y-2.5">
            <div className="text-slate-400 text-xs">
              {userProfile ? 'Belum ada trade yang dicatat.' : 'Mode Tamu: Masuk ke akun Anda untuk menyinkronkan data trade live MT5.'}
            </div>
            {userProfile ? (
              <button
                onClick={() => setIsNewTradeModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all inline-flex items-center space-x-1.5"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Catat Entry Pertama</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs hover:from-emerald-400 hover:to-cyan-400 transition-all inline-flex items-center space-x-1.5 shadow-glow-emerald"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Masuk ke Akun Trader</span>
              </button>
            )}
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
