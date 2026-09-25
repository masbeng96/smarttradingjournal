import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, 
  RotateCcw, 
  Search, 
  Flame, 
  CheckCircle2, 
  Calendar as CalendarIcon, 
  AlertTriangle,
  Bell,
  BellRing,
  ChevronDown,
  Clock,
  Check
} from 'lucide-react';
import { 
  fetchEconomicCalendar, 
  COUNTRY_FLAGS, 
  getEventCountdownText 
} from '../../lib/economicCalendarService';
import { EconomicEvent, NewsImpact } from '../../types/journal';
import { CustomSelect } from '../ui/CustomSelect';
import { motion, AnimatePresence } from 'framer-motion';

const CURRENCIES = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'];

const IMPACT_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Semua Impact' },
  { value: 'HIGH', label: '🔴 High Impact' },
  { value: 'HIGH_MED', label: '🔴🟠 High & Medium' },
  { value: 'LOW', label: '🟡 Low Impact' },
];

export const EconomicCalendarView: React.FC = () => {
  const [period, setPeriod] = useState<'thisweek' | 'nextweek'>('thisweek');
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedTime, setLastFetchedTime] = useState<string>('');

  // Filters
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ALL');
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamic Date Filter Options derived from current events
  const dateFilterOptions = useMemo(() => {
    const baseOptions = [
      { value: 'ALL', label: 'Semua Hari' },
      { value: 'TODAY', label: 'Hari Ini' },
      { value: 'TOMORROW', label: 'Besok' },
    ];

    const uniqueDays = new Map<string, string>();
    events.forEach((e) => {
      if (e.dateKey && e.dateFormatted) {
        uniqueDays.set(e.dateKey, e.dateFormatted);
      }
    });

    const specificDayOptions = Array.from(uniqueDays.entries()).map(([dateKey, dateFormatted]) => ({
      value: dateKey,
      label: dateFormatted,
    }));

    return [...baseOptions, ...specificDayOptions];
  }, [events]);

  // Alarm Schedule state for Android notifications
  const [scheduledAlarms, setScheduledAlarms] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('trading_news_alarms_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [alarmToast, setAlarmToast] = useState<string | null>(null);

  // Collapsible state for completed news
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState<boolean>(false);

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

  const toggleAlarm = (event: EconomicEvent) => {
    const nextState = !scheduledAlarms[event.id];
    const updated = { ...scheduledAlarms, [event.id]: nextState };
    setScheduledAlarms(updated);
    localStorage.setItem('trading_news_alarms_v1', JSON.stringify(updated));

    if (nextState) {
      setAlarmToast(`🔔 Alarm disetel untuk ${event.title} (${event.timeWib} WIB). Notifikasi Android akan aktif 15 menit sebelum rilis.`);
    } else {
      setAlarmToast(`🔕 Alarm dibatalkan untuk ${event.title}.`);
    }

    setTimeout(() => {
      setAlarmToast(null);
    }, 4000);
  };

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
      if (
        selectedDateFilter !== 'ALL' &&
        selectedDateFilter !== 'TODAY' &&
        selectedDateFilter !== 'TOMORROW' &&
        e.dateKey !== selectedDateFilter
      ) {
        return false;
      }

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

  // Separate upcoming vs completed events
  const { upcomingEvents, completedEvents } = useMemo(() => {
    const now = Date.now();
    const upcoming: EconomicEvent[] = [];
    const completed: EconomicEvent[] = [];

    filteredEvents.forEach((ev) => {
      const isFinished = Boolean(ev.actual && ev.actual.trim() !== '') || (ev.timestamp && ev.timestamp < now - 30 * 60 * 1000);
      if (isFinished) {
        completed.push(ev);
      } else {
        upcoming.push(ev);
      }
    });

    return { upcomingEvents: upcoming, completedEvents: completed };
  }, [filteredEvents]);

  // Group upcoming events by dateKey
  const groupedUpcomingEvents = useMemo(() => {
    const map: Record<string, { label: string; dateKey: string; isToday: boolean; items: EconomicEvent[] }> = {};

    upcomingEvents.forEach((ev) => {
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
  }, [upcomingEvents]);

  const getImpactBadge = (impact: NewsImpact) => {
    switch (impact) {
      case 'High':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            <span>HIGH</span>
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            MED
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
            LOW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
            HOLIDAY
          </span>
        );
    }
  };

  const renderEventCard = (event: EconomicEvent, isFinished = false) => {
    const flag = COUNTRY_FLAGS[event.country] || '🌐';
    const countdown = getEventCountdownText(event.timestamp);
    const hasAlarm = Boolean(scheduledAlarms[event.id]);

    return (
      <div
        key={event.id}
        className={`card-light p-3.5 transition-all ${
          isFinished 
            ? 'opacity-80 bg-[#FAFAF8] border-[#E5E5E2]' 
            : event.isHighImpact
            ? 'border-rose-200 hover:border-rose-300'
            : event.impact === 'Medium'
            ? 'border-amber-200 hover:border-amber-300'
            : 'hover:border-[#D4D4D0]'
        }`}
      >
        {/* Top Row: Currency, Time, Impact Badge & Alarm Button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-base">{flag}</span>
            <span className="font-mono-num font-extrabold text-xs text-[#0F0F0F]">
              {event.country}
            </span>
            <span className="text-[#A3A3A3]">•</span>
            <span className="text-xs font-mono-num font-bold text-[#0F0F0F]">
              {event.timeWib}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {getImpactBadge(event.impact)}

            {/* Set Alarm / Reminder Button for Android */}
            {!isFinished && (
              <button
                type="button"
                onClick={() => toggleAlarm(event)}
                className={`p-1.5 rounded-xl border text-xs flex items-center space-x-1 font-bold transition-all ${
                  hasAlarm
                    ? 'bg-[#0F0F0F] text-white border-[#0F0F0F] shadow-sm'
                    : 'bg-white text-[#737373] border-[#E5E5E2] hover:text-[#0F0F0F] hover:border-[#D4D4D0]'
                }`}
                title={hasAlarm ? 'Alarm Aktif (Klik untuk matikan)' : 'Set Alarm Notifikasi Android'}
              >
                {hasAlarm ? (
                  <>
                    <BellRing className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] hidden sm:inline">Alarm On</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">Alarm</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Event Title */}
        <div className="text-xs font-bold text-[#0F0F0F] mb-2 leading-snug">
          {event.title}
        </div>

        {/* Bottom Metric Row: Actual, Forecast, Previous & Status */}
        <div className="pt-2 border-t border-[#E5E5E2] grid grid-cols-4 gap-2 text-[11px] items-center">
          <div>
            <span className="text-[10px] text-[#737373] block">Actual:</span>
            <span className={`font-mono-num font-extrabold ${
              event.actual ? 'text-emerald-600' : 'text-[#A3A3A3]'
            }`}>
              {event.actual || '-'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#737373] block">Forecast:</span>
            <span className="font-mono-num font-semibold text-[#525252]">
              {event.forecast || '-'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-[#737373] block">Previous:</span>
            <span className="font-mono-num font-semibold text-[#737373]">
              {event.previous || '-'}
            </span>
          </div>

          <div className="text-right flex justify-end">
            <span className="text-[10px] font-mono-num text-[#737373] px-2 py-0.5 rounded-lg bg-[#F7F7F5] border border-[#E5E5E2] font-medium">
              {isFinished ? 'Selesai' : countdown}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4 pb-24 max-w-lg mx-auto">
      {/* Alarm Feedback Toast Notification */}
      <AnimatePresence>
        {alarmToast && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed top-16 left-4 right-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-[#0F0F0F] text-white text-xs font-semibold shadow-2xl border border-neutral-700 flex items-center space-x-2"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{alarmToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Card (10% ACCENT - Pitch Black Card) */}
      <div className="card-dark-hero p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center space-x-1.5">
                <span>Kalender Berita Ekonomi</span>
              </h2>
              <p className="text-[11px] text-[#A3A3A3]">
                Forex Factory Live News & High Impact Feed
              </p>
            </div>
          </div>

          {/* Primary Refresh Button */}
          <button
            onClick={() => loadCalendar(true)}
            disabled={isLoading}
            title="Refresh Kalender Live"
            className="px-3 py-1.5 rounded-xl bg-white text-[#0F0F0F] hover:bg-[#F2F2EF] font-bold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Period Toggle & Sync Info */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setPeriod('thisweek')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                period === 'thisweek'
                  ? 'bg-white text-[#0F0F0F] shadow-sm'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setPeriod('nextweek')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                period === 'nextweek'
                  ? 'bg-white text-[#0F0F0F] shadow-sm'
                  : 'text-[#A3A3A3] hover:text-white'
              }`}
            >
              Minggu Depan
            </button>
          </div>

          <span className="text-[10px] text-[#A3A3A3] font-mono-num">
            {lastFetchedTime ? `Sinkron: ${lastFetchedTime}` : 'Memuat...'}
          </span>
        </div>
      </div>

      {/* 2. Today's High Impact Warning Banner */}
      {todayHighImpactEvents.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-light p-4 border-rose-300 bg-rose-50/50 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-800 font-extrabold text-xs">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>PERINGATAN HIGH IMPACT HARI INI ({todayHighImpactEvents.length})</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 font-bold border border-rose-300">
              Waspada
            </span>
          </div>

          <div className="space-y-1.5">
            {todayHighImpactEvents.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-rose-200 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">{COUNTRY_FLAGS[item.country] || '🌐'}</span>
                  <span className="font-mono-num font-extrabold text-[#0F0F0F]">{item.country}</span>
                  <span className="text-[#525252] font-semibold truncate max-w-[150px] sm:max-w-xs">{item.title}</span>
                </div>
                <div className="flex items-center space-x-2 font-mono-num">
                  <span className="text-rose-600 font-extrabold">{item.timeWib}</span>
                  <span className="text-[10px] text-[#737373]">({getEventCountdownText(item.timestamp)})</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-rose-900 leading-relaxed font-medium">
            💡 <strong>Rekomendasi Manajemen Resiko:</strong> Hindari membuka posisi baru 15 menit sebelum & sesudah rilis berita di atas.
          </p>
        </motion.div>
      ) : !isLoading && (
        <div className="card-light p-3 bg-emerald-50/60 border-emerald-200 flex items-center space-x-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Tidak ada berita High-Impact untuk hari ini. Kondisi pasar relatif stabil.</span>
        </div>
      )}

      {/* 3. Search & Dropdown Filter Bar */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari rilis berita (e.g. CPI, FOMC, NFP, Rate)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E5E5E2] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#0F0F0F] placeholder:text-[#A3A3A3] focus:outline-none focus:border-[#0F0F0F] transition-colors font-medium shadow-sm"
          />
        </div>

        {/* 2 DROPDOWNS: SEMUA HARI & SEMUA IMPACT */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] text-[#737373] font-bold block flex items-center space-x-1">
              <CalendarIcon className="w-3 h-3 text-[#737373]" />
              <span>Pilih Hari</span>
            </label>
            <CustomSelect
              value={selectedDateFilter}
              onChange={(val) => setSelectedDateFilter(val)}
              options={dateFilterOptions}
              className="bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#737373] font-bold block flex items-center space-x-1">
              <Flame className="w-3 h-3 text-rose-500" />
              <span>Tingkat Dampak</span>
            </label>
            <CustomSelect
              value={selectedImpact}
              onChange={(val) => setSelectedImpact(val)}
              options={IMPACT_FILTER_OPTIONS}
              className="bg-white"
            />
          </div>
        </div>

        {/* Currency Filter Bar */}
        <div className="space-y-1">
          <label className="text-[10px] text-[#737373] font-bold block">Filter Mata Uang</label>
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {CURRENCIES.map((curr) => {
              const flag = COUNTRY_FLAGS[curr] || '';
              const isActive = selectedCurrency === curr;
              return (
                <button
                  key={curr}
                  onClick={() => setSelectedCurrency(curr)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono-num font-bold whitespace-nowrap transition-all flex items-center space-x-1 ${
                    isActive
                      ? 'bg-[#0F0F0F] text-white shadow-sm'
                      : 'bg-white text-[#737373] border border-[#E5E5E2] hover:text-[#0F0F0F]'
                  }`}
                >
                  <span>{flag}</span>
                  <span>{curr}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. UPCOMING EVENTS LIST */}
      {isLoading ? (
        <div className="space-y-3 py-8">
          <div className="flex flex-col items-center justify-center space-y-3 text-[#737373]">
            <RotateCcw className="w-7 h-7 text-[#0F0F0F] animate-spin" />
            <p className="text-xs font-medium">Mengambil kalender ekonomi Forex Factory...</p>
          </div>
        </div>
      ) : error ? (
        <div className="card-light p-5 border-rose-300 bg-rose-50 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
          <div className="text-xs font-bold text-rose-800">{error}</div>
          <button
            onClick={() => loadCalendar(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
          >
            Coba Sinkronisasi Lagi
          </button>
        </div>
      ) : groupedUpcomingEvents.length === 0 && completedEvents.length === 0 ? (
        <div className="card-light p-8 text-center space-y-2">
          <CalendarIcon className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <div className="text-xs font-bold text-[#0F0F0F]">Tidak ada berita yang sesuai filter</div>
          <p className="text-[11px] text-[#737373]">Coba ubah filter mata uang, tanggal, atau tingkat impact.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Upcoming Events by Date */}
          {groupedUpcomingEvents.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-extrabold ${group.isToday ? 'text-[#0F0F0F]' : 'text-[#737373]'}`}>
                    {group.label}
                  </span>
                  {group.isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#0F0F0F] text-white">
                      HARI INI
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#A3A3A3] font-medium">
                  {group.items.length} Rilis Mendatang
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((event) => renderEventCard(event, false))}
              </div>
            </div>
          ))}

          {/* 5. COLLAPSIBLE COMPLETED NEWS SECTION */}
          {completedEvents.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCompletedSectionOpen(!isCompletedSectionOpen)}
                className="w-full card-light p-3.5 flex items-center justify-between text-left focus:outline-none hover:border-[#D4D4D0] transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#737373]" />
                  <span className="text-xs font-extrabold text-[#0F0F0F]">
                    Rilis Data yang Sudah Selesai ({completedEvents.length})
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#737373] font-semibold">
                    {isCompletedSectionOpen ? 'Sembunyikan' : 'Lihat'}
                  </span>
                  <motion.div
                    animate={{ rotate: isCompletedSectionOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <ChevronDown className="w-4 h-4 text-[#737373]" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isCompletedSectionOpen && (
                  <motion.div
                    key="completed-list"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    className="overflow-hidden space-y-2 pt-2"
                  >
                    {completedEvents.map((event) => renderEventCard(event, true))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
