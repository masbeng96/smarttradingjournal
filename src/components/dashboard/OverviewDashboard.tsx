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
  LogIn,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { fetchEconomicCalendar, getEventCountdownText, COUNTRY_FLAGS } from '../../lib/economicCalendarService';
import { EconomicEvent } from '../../types/journal';
import { getTranslation } from '../../lib/translations';

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
  const [nearestNews, setNearestNews] = useState<EconomicEvent | null>(null);

  React.useEffect(() => {
    const fetchNews = async () => {
      try {
        const events = await fetchEconomicCalendar('thisweek', false);
        const now = Date.now();
        // Find the first event that is in the future
        const upcoming = events.filter(e => e.timestamp && e.timestamp > now).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        if (upcoming.length > 0) {
          setNearestNews(upcoming[0]);
        }
      } catch (err) {
        console.error('Failed to fetch calendar for dashboard', err);
      }
    };
    fetchNews();
  }, []);

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

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 1. HERO TOTAL BALANCE CARD (10% ACCENT - DEEP SLEEK BLACK #0F0F0F) */}
      <div className="card-dark-hero relative overflow-hidden p-5">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-[#A3A3A3] tracking-tight">
                {getTranslation(settings.language, 'dash.totalBalance')}
              </span>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-[#737373] hover:text-white transition-colors"
                title={isBalanceHidden ? getTranslation(settings.language, 'dash.showBalance') : getTranslation(settings.language, 'dash.hideBalance')}
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
                  : `${growthPercent >= 0 ? '+' : ''}${formatPercent(growthPercent, 1)} ${getTranslation(settings.language, 'dash.thisMonth')}`
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
                <span>{getTranslation(settings.language, 'dash.syncing')}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sub metrics grid */}
        <div className="grid grid-cols-4 gap-2 pt-3 mt-2 border-t border-neutral-800/60 text-center">
          <div>
            <span className="text-[10px] text-[#737373] block">{getTranslation(settings.language, 'dash.balance')}</span>
            <span className="text-xs font-bold font-mono-num text-white">
              {formatCurrency(mt5Data ? mt5Data.balance : settings.initialCapital, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#737373] block">{getTranslation(settings.language, 'dash.floating')}</span>
            <span className={`text-xs font-bold font-mono-num ${(mt5Data?.floating_pnl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {mt5Data ? `${(mt5Data.floating_pnl ?? 0) >= 0 ? '+' : ''}${formatCurrency(mt5Data.floating_pnl ?? 0, settings.currency)}` : '$0.00'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#737373] block">{getTranslation(settings.language, 'dash.margin')}</span>
            <span className="text-xs font-bold font-mono-num text-neutral-300">
              {formatCurrency(mt5Data?.margin ?? 0, settings.currency)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#737373] block">{getTranslation(settings.language, 'dash.realized')}</span>
            <span className={`text-xs font-bold font-mono-num ${totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalRealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalRealizedPnl, settings.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Grid Removed per user request */}

      {/* 3. PERFORMANCE STATS GRID */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="card-light p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">{getTranslation(settings.language, 'dash.winRate')}</span>
          <span className={`text-base font-extrabold font-mono-num ${winRate >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {winRate}%
          </span>
          <span className="text-[10px] text-[#A3A3A3] block mt-0.5">
            {trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE').length} {getTranslation(settings.language, 'dash.trades')}
          </span>
        </div>

        <div className="card-light p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">{getTranslation(settings.language, 'dash.growth')}</span>
          <span className={`text-base font-extrabold font-mono-num ${((currentEquity - effectiveStartCap) / effectiveStartCap) * 100 >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {(((currentEquity - effectiveStartCap) / effectiveStartCap) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#A3A3A3] block mt-0.5">{getTranslation(settings.language, 'dash.fromInitial')}</span>
        </div>

        <div className="card-light p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">{getTranslation(settings.language, 'dash.dailyTarget')}</span>
          <span className="text-sm font-bold font-mono-num text-[#0F0F0F]">
            {formatCurrency(dailyTargetAmount, settings.currency)}
          </span>
          <span className="text-[10px] text-[#A3A3A3] block mt-0.5">{settings.monthlyTargetPercent}% / {getTranslation(settings.language, 'dash.month')}</span>
        </div>

        <div className="card-light p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">{getTranslation(settings.language, 'dash.profitFactor')}</span>
          <span className={`text-base font-extrabold font-mono-num ${profitFactor >= 1.5 ? 'text-emerald-600' : 'text-[#0F0F0F]'}`}>
            {profitFactor}
          </span>
          <span className="text-[10px] text-[#A3A3A3] block mt-0.5">RR {settings.targetRRR}:1</span>
        </div>
      </div>

      {/* 4. UPCOMING NEWS EVENT CARD */}
      {nearestNews && (
        <div 
          onClick={() => setActiveTab('calendar')}
          className={`card-light p-3.5 cursor-pointer hover:shadow-md transition-all space-y-2 select-none group ${
            nearestNews.isHighImpact 
              ? 'border-rose-200 hover:border-rose-400 bg-gradient-to-br from-rose-50/30 to-white' 
              : nearestNews.impact === 'Medium'
              ? 'border-amber-200 hover:border-amber-400 bg-gradient-to-br from-amber-50/30 to-white'
              : 'hover:border-[#0F0F0F]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm">{COUNTRY_FLAGS[nearestNews.country] || '🌐'}</span>
              <span className="text-[11px] font-extrabold text-[#0F0F0F] font-mono-num">{nearestNews.country}</span>
              <span className="text-[#A3A3A3] text-[10px]">•</span>
              <span className="text-[10px] font-bold text-[#525252]">{nearestNews.timeWib}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {nearestNews.isHighImpact ? (
                <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                  <span className="w-1 h-1 rounded-full bg-rose-600 animate-pulse" />
                  <span>HIGH</span>
                </span>
              ) : nearestNews.impact === 'Medium' ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  MED
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                  LOW
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <h4 className="text-xs font-extrabold text-[#0F0F0F] leading-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {nearestNews.title}
            </h4>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#F7F7F5] border border-[#E5E5E2] font-semibold text-[#737373] ml-2 shrink-0">
              {getEventCountdownText(nearestNews.timestamp)}
            </span>
          </div>
        </div>
      )}

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
            <span>{getTranslation(settings.language, 'dash.fullEvaluation')}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* 6. EQUITY GROWTH CHART */}
      <div className="card-light p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-[#0F0F0F]">{getTranslation(settings.language, 'dash.equityCurve')}</h3>
          </div>
          <span className="text-[11px] text-[#737373] font-mono-num font-semibold">
            {trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE').length > 0 
              ? `${trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE').length} ${getTranslation(settings.language, 'dash.closedTrades')}` 
              : getTranslation(settings.language, 'dash.initialCapital')}
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
