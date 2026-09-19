import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  RotateCcw, 
  Search, 
  Filter, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  fetchEconomicCalendar, 
  COUNTRY_FLAGS, 
  getEventCountdownText 
} from '../../lib/economicCalendarService';
import { EconomicEvent, NewsImpact } from '../../types/journal';
import { motion, AnimatePresence } from 'framer-motion';

const CURRENCIES = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'];

export const EconomicCalendarView: React.FC = () => {
  const [period, setPeriod] = useState<'thisweek' | 'nextweek'>('thisweek');
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>('');

  // Filters
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL'); // 'ALL' | 'HIGH' | 'HIGH_MED' | 'LOW'
  const [selectedDateFilter, setSelectedDateFilter] = useState<'ALL' | 'TODAY' | 'TOMORROW'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadCalendar = async (force = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchEconomicCalendar(period, force);
      setEvents(data);
      setLastFetchedTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB');
    } catch (err: any) {
      setError(err.message || 'Gagal memuat kalender ekonomi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar(false);
  }, [period]);

  // Today's High-Impact events for alert banner
  const todayHighImpactEvents = useMemo(() => {
    return events.filter(e => e.isToday && e.isHighImpact);
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowKey = tomorrow.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

    return events.filter((e) => {
      // Currency filter
      if (selectedCurrency !== 'ALL' && e.country !== selectedCurrency && e.country !== 'ALL') {
        return false;
      }

      // Impact filter
      if (selectedImpact === 'HIGH' && e.impact !== 'High') return false;
      if (selectedImpact === 'HIGH_MED' && e.impact !== 'High' && e.impact !== 'Medium') return false;
      if (selectedImpact === 'LOW' && e.impact !== 'Low' && e.impact !== 'Holiday') return false;

      // Date filter
      if (selectedDateFilter === 'TODAY' && !e.isToday) return false;
      if (selectedDateFilter === 'TOMORROW' && e.dateKey !== tomorrowKey) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchCountry = e.country.toLowerCase().includes(q);
        return matchTitle || matchCountry;
      }

      return true;
    });
  }, [events, selectedCurrency, selectedImpact, selectedDateFilter, searchQuery]);

  // Group events by dateKey
  const groupedEvents = useMemo(() => {
    const map: Record<string, { label: string; dateKey: string; isToday: boolean; items: EconomicEvent[] }> = {};

    filteredEvents.forEach((ev) => {
      if (!map[ev.dateKey]) {
        map[ev.dateKey] = {
          label: ev.dateFormatted,
          dateKey: ev.dateKey,
          isToday: ev.isToday,
          items: [],
        };
      }
      map[ev.dateKey].items.push(ev);
    });

    return Object.values(map);
  }, [filteredEvents]);

  const getImpactBadge = (impact: NewsImpact) => {
    switch (impact) {
      case 'High':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>HIGH</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            MED
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-yellow-500/10 text-yellow-300/80 border border-yellow-500/20">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            HOLIDAY
          </span>
        );
    }
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* 1. Header Card */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-slate-900 via-[#0a1220] to-[#081523] border border-cyan-500/20 shadow-glow-emerald">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center space-x-1.5">
                  <span>Kalender Berita Ekonomi</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Forex Factory Live News Feed & Scraper
                </p>
              </div>
            </div>

            <button
              onClick={() => loadCalendar(true)}
              disabled={isLoading}
              title="Refresh Kalender"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50 flex items-center space-x-1 text-xs font-semibold"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Period Toggle & Sync Info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setPeriod('thisweek')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  period === 'thisweek'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => setPeriod('nextweek')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  period === 'nextweek'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Minggu Depan
              </button>
            </div>

            <span className="text-[10px] text-slate-500 font-mono-num">
              {lastFetchedTime ? `Sinkron: ${lastFetchedTime}` : 'Memuat...'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Today's High Impact Warning Banner */}
      {todayHighImpactEvents.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 bg-gradient-to-r from-rose-950/50 via-slate-900 to-amber-950/30 border border-rose-500/40 space-y-2.5 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-400 font-extrabold text-xs">
              <Flame className="w-4 h-4 animate-bounce text-rose-500" />
              <span>PERINGATAN RISIKO HIGH IMPACT HARI INI ({todayHighImpactEvents.length})</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
              Waspada Volatilitas
            </span>
          </div>

          <div className="space-y-1.5">
            {todayHighImpactEvents.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-rose-500/20 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{COUNTRY_FLAGS[item.country] || '🌐'}</span>
                  <span className="font-mono-num font-bold text-slate-200">{item.country}</span>
                  <span className="text-slate-300 font-medium truncate max-w-[150px] sm:max-w-xs">{item.title}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono-num">
                  <span className="text-rose-400 font-bold">{item.timeWib}</span>
                  <span className="text-[10px] text-slate-400">({getEventCountdownText(item.timestamp)})</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-rose-300/80 leading-relaxed">
            💡 <strong>Rekomendasi Manajemen Resiko:</strong> Hindari membuka posisi baru 15 menit sebelum & sesudah rilis berita di atas atau gunakan ukuran lot lebih kecil.
          </p>
        </motion.div>
      ) : !isLoading && (
        <div className="rounded-2xl p-3 bg-emerald-950/20 border border-emerald-500/30 flex items-center space-x-2.5 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Tidak ada berita High-Impact untuk hari ini. Kondisi pasar relatif stabil untuk eksekusi teknikal.</span>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari rilis berita (e.g. CPI, FOMC, NFP, Rate, Powell)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Date & Impact Filter Rows */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {/* Date Filter */}
          {[
            { id: 'ALL', label: 'Semua Hari' },
            { id: 'TODAY', label: 'Hari Ini' },
            { id: 'TOMORROW', label: 'Besok' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDateFilter(d.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDateFilter === d.id
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-900/70 text-slate-400 border border-slate-800/80 hover:text-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}

          <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

          {/* Impact Filter */}
          {[
            { id: 'ALL', label: 'Semua Impact' },
            { id: 'HIGH', label: '🔴 High Impact' },
            { id: 'HIGH_MED', label: '🔴🟠 High & Med' },
            { id: 'LOW', label: '🟡 Low' },
          ].map((imp) => (
            <button
              key={imp.id}
              onClick={() => setSelectedImpact(imp.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedImpact === imp.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900/70 text-slate-400 border border-slate-800/80 hover:text-slate-200'
              }`}
            >
              {imp.label}
            </button>
          ))}
        </div>

        {/* Currency Filter Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {CURRENCIES.map((curr) => {
            const flag = COUNTRY_FLAGS[curr] || '';
            const isActive = selectedCurrency === curr;
            return (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{flag}</span>
                <span>{curr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Events Grouped by Date */}
      {isLoading ? (
        <div className="space-y-3 py-8">
          <div className="flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RotateCcw className="w-7 h-7 text-cyan-400 animate-spin" />
            <p className="text-xs font-medium">Mengambil kalender ekonomi dari Forex Factory...</p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl p-5 bg-rose-950/20 border border-rose-500/30 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <div className="text-xs font-bold text-rose-300">{error}</div>
          <button
            onClick={() => loadCalendar(true)}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
          >
            Coba Sinkronisasi Lagi
          </button>
        </div>
      ) : groupedEvents.length === 0 ? (
        <div className="rounded-2xl p-8 bg-slate-900/50 border border-slate-800/80 text-center space-y-2">
          <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="text-xs font-semibold text-slate-300">Tidak ada berita yang sesuai filter</div>
          <p className="text-[11px] text-slate-500">Coba ubah filter mata uang, tanggal, atau tingkat impact.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedEvents.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Header Header Pill */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-extrabold ${group.isToday ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {group.label}
                  </span>
                  {group.isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      HARI INI
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  {group.items.length} Rilis Data
                </span>
              </div>

              {/* Event Cards */}
              <div className="space-y-2">
                {group.items.map((event) => {
                  const flag = COUNTRY_FLAGS[event.country] || '🌐';
                  const countdown = getEventCountdownText(event.timestamp);

                  return (
                    <div
                      key={event.id}
                      className={`rounded-2xl p-3.5 bg-slate-900/80 border transition-all ${
                        event.isHighImpact
                          ? 'border-rose-500/30 hover:border-rose-500/50'
                          : event.impact === 'Medium'
                          ? 'border-amber-500/20 hover:border-amber-500/40'
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Row: Currency, Time, Impact Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{flag}</span>
                          <span className="font-mono-num font-bold text-xs text-white">
                            {event.country}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs font-mono-num font-semibold text-cyan-300">
                            {event.timeWib}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {getImpactBadge(event.impact)}
                        </div>
                      </div>

                      {/* Event Title */}
                      <div className="text-xs font-bold text-slate-100 mb-2.5 leading-snug">
                        {event.title}
                      </div>

                      {/* Bottom Metric Row: Actual, Forecast, Previous & Link */}
                      <div className="pt-2 border-t border-slate-800/60 grid grid-cols-4 gap-2 text-[11px] items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Actual:</span>
                          <span className={`font-mono-num font-extrabold ${
                            event.actual ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {event.actual || '-'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block">Forecast:</span>
                          <span className="font-mono-num font-semibold text-slate-300">
                            {event.forecast}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block">Previous:</span>
                          <span className="font-mono-num font-semibold text-slate-400">
                            {event.previous}
                          </span>
                        </div>

                        <div className="text-right flex justify-end">
                          <span className="text-[10px] font-mono-num text-slate-400 px-1.5 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                            {countdown}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
