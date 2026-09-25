import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { 
  TrendingUp, 
  Target, 
  ChevronRight, 
  RotateCcw,
  CalendarDays,
  Eye,
  EyeOff,
  LineChart as LineChartIcon,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  LogIn
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
    trades, 
    latestReport, 
    setActiveTab,
    mt5Data,
    assignedAccountId,
    userProfile,
    setIsAuthModalOpen,
    isMT5Loading,
    refreshMT5Data
  } = useJournal();

  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

  const isMT5 = Boolean(mt5Data && mt5Data.isConnected);

  // Dynamic Start Capital: If MT5 is connected, use initial_deposit from MT5 history or calculate (Balance - Realized PnL)
  const effectiveStartCap = React.useMemo(() => {
    if (isMT5 && mt5Data) {
      if (mt5Data.initial_deposit && mt5Data.initial_deposit > 0) {
        return Number(mt5Data.initial_deposit.toFixed(2));
      }
      // Calculate starting balance before trades were executed
      const calculatedStart = mt5Data.balance - totalRealizedPnl;
      if (calculatedStart > 0) {
        return Number(calculatedStart.toFixed(2));
      }
      return Number(mt5Data.balance.toFixed(2));
    }
    return settings.initialCapital > 0 ? settings.initialCapital : 1000;
  }, [isMT5, mt5Data, totalRealizedPnl, settings.initialCapital]);

  const growthPercent = effectiveStartCap > 0 
    ? (totalRealizedPnl / effectiveStartCap) * 100 
    : 0;

  // Daily target calculation
  const monthlyTargetAmount = currentEquity * (settings.monthlyTargetPercent / 100);
  const dailyTargetAmount = monthlyTargetAmount / (settings.tradingDaysPerMonth || 22);

  // Sparkline data for hero card & chart (Starts with initial deposit, adds trading profits)
  const sparklineData = React.useMemo(() => {
    const startCap = effectiveStartCap;
    let running = startCap;
    // Strictly filter closed trading bets (excluding deposit and withdrawal transactions)
    const sortedTrades = [...trades]
      .filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE')
      .sort((a, b) => a.createdAt - b.createdAt);
    
    const points: { balance: number; equity: number }[] = [{ balance: startCap, equity: startCap }];

    sortedTrades.forEach((trade) => {
      running += trade.pnl;
      points.push({ 
        balance: Number(running.toFixed(2)), 
        equity: Number(running.toFixed(2)) 
      });
    });

    if (isMT5 && mt5Data) {
      points.push({
        balance: Number(mt5Data.balance.toFixed(2)),
        equity: Number(mt5Data.equity.toFixed(2)),
      });
    }

    if (points.length === 1) {
      points.push({ balance: startCap, equity: startCap });
      points.push({ balance: startCap, equity: startCap });
    }

    return points;
  }, [trades, effectiveStartCap, isMT5, mt5Data]);

  // Full chart data (Starts with Start Capital, plots each closed trade to Live MT5 balance)
  const chartData = React.useMemo(() => {
    const startCap = effectiveStartCap;
    let runningBalance = startCap;
    // Strictly filter closed trading bets (excluding deposit and withdrawal transactions)
    const sortedTrades = [...trades]
      .filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE')
      .sort((a, b) => a.createdAt - b.createdAt);
    
    const points = [{
      name: 'Start',
      balance: startCap,
      equity: startCap,
      pnl: 0,
    }];

    sortedTrades.forEach((trade, index) => {
      runningBalance += trade.pnl;
      points.push({
        name: `T${index + 1}`,
        balance: Number(runningBalance.toFixed(2)),
        equity: Number(runningBalance.toFixed(2)),
        pnl: trade.pnl,
      });
    });

    if (isMT5 && mt5Data) {
      points.push({
        name: 'Live MT5',
        balance: Number(mt5Data.balance.toFixed(2)),
        equity: Number(mt5Data.equity.toFixed(2)),
        pnl: Number((mt5Data.floating_pnl ?? 0).toFixed(2)),
      });
    }

    if (points.length === 1) {
      points.push({
        name: 'Sekarang',
        balance: startCap,
        equity: startCap,
        pnl: 0,
      });
    }

    return points;
  }, [trades, effectiveStartCap, isMT5, mt5Data]);

  // Recent trades
  const recentTrades = trades.slice(0, 5);

  const getTradeDateLabel = (timestamp: number) => {
    const tradeDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (tradeDate.toDateString() === today.toDateString()) return 'Today';
    if (tradeDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return tradeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getPairIcon = (pair: string, direction?: string) => {
    const p = (pair || '').toUpperCase();
    const d = (direction || '').toUpperCase();
    if (p === 'DEPOSIT' || d === 'DEPOSIT') return '💰';
    if (p === 'WITHDRAWAL' || d === 'WITHDRAWAL') return '🏦';
    if (p.includes('XAU') || p.includes('GOLD')) return '🥇';
    if (p.includes('BTC') || p.includes('CRYPTO') || p.includes('ETH')) return '₿';
    if (p.includes('EUR')) return '€';
    if (p.includes('GBP')) return '£';
    if (p.includes('JPY')) return '¥';
    if (p.includes('NAS') || p.includes('US100') || p.includes('US30') || p.includes('SPX')) return '📈';
    return '$';
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 1. HERO TOTAL BALANCE CARD (10% ACCENT - DEEP SLEEK BLACK #0F0F0F) */}
      <div className="card-dark-hero relative overflow-hidden p-5">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#A3A3A3] tracking-tight">
                Total Balance,
              </span>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-[#737373] hover:text-white transition-colors"
                title={isBalanceHidden ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
              >
                {isBalanceHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Huge Bold Balance */}
            <div className="text-3xl sm:text-4xl font-black font-mono-num tracking-tight text-white">
              {isBalanceHidden ? '••••••••' : formatCurrency(currentEquity, settings.currency)}
            </div>
          </div>

          {/* Sparkline Curve on Right side of Hero Card */}
          <div className="w-28 h-12 pt-1 opacity-90">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="heroSparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#10b981"
                  strokeWidth={2.2}
                  fill="url(#heroSparkGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Badge & MT5 Status Row (Refresh button removed) */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-neutral-800/80">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>
                {mt5Data 
                  ? `${mt5Data.floating_pnl >= 0 ? '+' : ''}${formatCurrency(mt5Data.floating_pnl, settings.currency)}`
                  : `${growthPercent >= 0 ? '+' : ''}${formatPercent(growthPercent, 1)} this month`
                }
              </span>
            </div>

            {/* MT5 Account Chip */}
            {assignedAccountId && mt5Data?.isConnected ? (
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-emerald-400 font-mono-num font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>MT5 Live #{assignedAccountId}</span>
              </div>
            ) : isMT5Loading ? (
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-neutral-900 text-[10px] text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Syncing...</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sub metrics grid */}
        <div className="grid grid-cols-4 gap-2 pt-3 mt-2 border-t border-neutral-800/60 text-center">
          <div>
            <span className="text-[10px] text-[#737373] block">Balance</span>
            <span className="text-xs font-bold font-mono-num text-white">
              {formatCurrency(mt5Data ? mt5Data.balance : settings.initialCapital, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#737373] block">Floating</span>
            <span className={`text-xs font-bold font-mono-num ${(mt5Data?.floating_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {mt5Data ? `${(mt5Data.floating_pnl ?? 0) >= 0 ? '+' : ''}${formatCurrency(mt5Data.floating_pnl ?? 0, settings.currency)}` : '$0.00'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#737373] block">Margin</span>
            <span className="text-xs font-bold font-mono-num text-neutral-300">
              {formatCurrency(mt5Data?.margin ?? 0, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#737373] block">Realized</span>
            <span className={`text-xs font-bold font-mono-num ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalRealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnl, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. QUICK ACTION GRID (4 PILL BUTTONS) */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Action 1: MT5 Sync / Login */}
        <button
          onClick={() => {
            if (userProfile) refreshMT5Data();
            else setIsAuthModalOpen(true);
          }}
          className="pill-action-btn p-3 flex flex-col items-center justify-center space-y-1.5 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#0F0F0F] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            {userProfile ? (
              <RefreshCw className={`w-5 h-5 stroke-[2.2] ${isMT5Loading ? 'animate-spin text-emerald-400' : ''}`} />
            ) : (
              <LogIn className="w-5 h-5 stroke-[2.2]" />
            )}
          </div>
          <span className="text-[11px] font-bold text-[#0F0F0F]">
            {userProfile ? 'Sync MT5' : 'Masuk Akun'}
          </span>
        </button>

        {/* Action 2: Compound Planner */}
        <button
          onClick={() => setActiveTab('planner')}
          className="pill-action-btn p-3 flex flex-col items-center justify-center space-y-1.5 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F0F0ED] text-[#0F0F0F] flex items-center justify-center border border-[#E5E5E2] group-hover:scale-105 transition-transform">
            <LineChartIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-[#0F0F0F]">Target Plan</span>
        </button>

        {/* Action 3: Lot Size Calc / Risk */}
        <button
          onClick={() => setActiveTab('risk')}
          className="pill-action-btn p-3 flex flex-col items-center justify-center space-y-1.5 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F0F0ED] text-[#0F0F0F] flex items-center justify-center border border-[#E5E5E2] group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-[#0F0F0F]">Risk & Lot</span>
        </button>

        {/* Action 4: News Calendar */}
        <button
          onClick={() => setActiveTab('calendar')}
          className="pill-action-btn p-3 flex flex-col items-center justify-center space-y-1.5 group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F0F0ED] text-[#0F0F0F] flex items-center justify-center border border-[#E5E5E2] group-hover:scale-105 transition-transform">
            <CalendarDays className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-bold text-[#0F0F0F]">Kalender</span>
        </button>
      </div>

      {/* 3. RECENT TRANSACTIONS / TRADES LIST */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-extrabold text-[#0F0F0F] tracking-tight">
            Recent Transactions
          </h2>
          <button
            onClick={() => setActiveTab('journal')}
            className="text-xs font-semibold text-[#737373] hover:text-[#0F0F0F] transition-colors"
          >
            View all
          </button>
        </div>

        {recentTrades.length === 0 ? (
          <div className="card-light p-6 text-center space-y-2">
            <p className="text-xs text-[#737373]">
              {userProfile ? 'Transaksi open & closed otomatis live dari akun MT5.' : 'Masuk ke akun Anda untuk menyinkronkan data trade MT5.'}
            </p>
            {!userProfile && (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded-2xl bg-[#0F0F0F] text-white text-xs font-bold hover:bg-black transition-all inline-flex items-center space-x-1.5 shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Akun Trader</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {recentTrades.map((trade) => {
              const isDeposit = trade.outcome === 'DEPOSIT' || trade.direction === 'DEPOSIT';
              const isWithdrawal = trade.outcome === 'WITHDRAWAL' || trade.direction === 'WITHDRAWAL';
              const isWin = trade.outcome === 'WIN';
              const isLoss = trade.outcome === 'LOSS';
              const isOpen = trade.outcome === 'OPEN';
              const icon = getPairIcon(trade.pair, trade.direction);
              const dateLabel = getTradeDateLabel(trade.createdAt);

              return (
                <div
                  key={trade.id}
                  onClick={() => setActiveTab('journal')}
                  className="card-light p-3.5 flex items-center justify-between cursor-pointer hover:border-[#D4D4D0] transition-all"
                >
                  {/* Left: Asset Icon & Pair / Strategy */}
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#F4F4F1] border border-[#E5E5E2] flex items-center justify-center text-base shadow-sm shrink-0">
                      <span>{icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-extrabold text-[#0F0F0F]">{trade.pair}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                          isDeposit
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : isWithdrawal
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : trade.direction === 'BUY' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isDeposit ? 'DEPOSIT' : isWithdrawal ? 'WITHDRAW' : trade.direction}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#737373] truncate max-w-[140px] sm:max-w-[200px]">
                        {trade.notes || trade.strategy || `${trade.lotSize} Lot • Live MT5`}
                      </div>
                    </div>
                  </div>

                  {/* Right: Profit/Loss Amount & Date */}
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold font-mono-num ${
                      isDeposit || isWin 
                        ? 'text-emerald-600' 
                        : isWithdrawal || isLoss 
                          ? 'text-rose-600' 
                          : isOpen 
                            ? 'text-blue-600' 
                            : 'text-[#0F0F0F]'
                    }`}>
                      {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl, settings.currency)}
                    </div>
                    <div className="text-[10px] text-[#A3A3A3] font-medium">
                      {dateLabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. PERFORMANCE STATS GRID */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="card-light p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">Win Rate</span>
          <span className={`text-base font-extrabold font-mono-num ${winRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {winRate}%
          </span>
          <span className="text-[10px] text-[#A3A3A3] block mt-0.5">
            {trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE').length} Trades
          </span>
        </div>

        <div className="card-light p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">Target Harian</span>
          <span className="text-xs font-bold font-mono-num text-[#0F0F0F]">
            {formatCurrency(dailyTargetAmount, settings.currency)}
          </span>
          <span className="text-[10px] text-[#A3A3A3] block mt-0.5">{settings.monthlyTargetPercent}% / Bln</span>
        </div>

        <div className="card-light p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">Profit Factor</span>
          <span className={`text-base font-extrabold font-mono-num ${profitFactor >= 1.5 ? 'text-emerald-600' : 'text-[#0F0F0F]'}`}>
            {profitFactor}
          </span>
          <span className="text-[10px] text-[#A3A3A3] block mt-0.5">RR {settings.targetRRR}:1</span>
        </div>
      </div>

      {/* 5. 5:00 AM COACHING HIGHLIGHT PREVIEW */}
      {latestReport && (
        <div 
          onClick={() => setActiveTab('coaching' as any)}
          className="card-light p-4 cursor-pointer hover:border-[#D4D4D0] transition-all space-y-2 border-amber-200/80 bg-gradient-to-r from-amber-50/40 to-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Analisa 05:00 AM Hari Ini</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
              Disiplin: {latestReport.disciplineScore}%
            </span>
          </div>
          <p className="text-xs text-[#525252] line-clamp-2">
            {latestReport.whatToMaintain[0] || latestReport.whatToImprove[0]}
          </p>
          <div className="flex items-center justify-end text-[11px] text-amber-700 font-semibold space-x-1">
            <span>Buka Evaluasi Lengkap</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 6. EQUITY GROWTH CHART */}
      <div className="card-light p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-[#0F0F0F]">Kurva Pertumbuhan Akun</h3>
          </div>
          <span className="text-[11px] text-[#737373] font-mono-num font-semibold">
            {trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE').length > 0 
              ? `${trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE').length} Closed Trades` 
              : 'Modal Awal'}
          </span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#A3A3A3" fontSize={10} tickLine={false} />
              <YAxis stroke="#A3A3A3" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E5E2',
                  borderRadius: '14px',
                  fontSize: '12px',
                  color: '#0F0F0F',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
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
    </div>
  );
};
