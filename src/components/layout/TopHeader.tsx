import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  Bell, 
  Settings, 
  Cloud, 
  HardDrive, 
  Sparkles, 
  TrendingUp, 
  ArrowUpCircle 
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { 
    unreadNotificationCount, 
    setIsNotificationDrawerOpen, 
    setIsSettingsModalOpen,
    runDailyAnalysisManual,
    isCloudConnected,
    settings,
    updateSettings,
    updateAvailable,
    setIsUpdateModalOpen
  } = useJournal();

  const toggleCurrency = () => {
    updateSettings({
      currency: settings.currency === 'USD' ? 'IDR' : 'USD'
    });
  };

  return (
    <header className="sticky top-0 z-30 w-full px-4 pt-4 pb-3 bg-[#070a12]/95 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between">
      {/* Brand & App Title */}
      <div className="flex items-center space-x-2.5">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-glow-emerald flex items-center justify-center">
          <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <h1 className="text-sm font-bold tracking-tight text-white">TRADE JOURNAL</h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              PRO
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            {/* Cloud or Local Persistence Badge */}
            <span className="flex items-center space-x-1">
              {isCloudConnected ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Firestore</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3 h-3 text-cyan-400" />
                  <span className="text-slate-400">Offline/Local</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Currency Switcher */}
        <button
          onClick={toggleCurrency}
          title="Ganti Mata Uang (USD / IDR)"
          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-semibold text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
        >
          {settings.currency}
        </button>

        {/* Update available trigger button */}
        {updateAvailable && (
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-semibold animate-pulse"
            title="Update Aplikasi Baru Tersedia"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Update</span>
          </button>
        )}

        {/* 5:00 AM Quick Analysis Trigger */}
        <button
          onClick={runDailyAnalysisManual}
          title="Jalankan Analisa 05:00 AM Sekarang"
          className="p-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all flex items-center justify-center relative group"
        >
          <Sparkles className="w-4 h-4" />
          <span className="absolute -bottom-7 right-0 hidden group-hover:block bg-slate-900 border border-slate-800 text-[10px] text-amber-300 px-2 py-0.5 rounded whitespace-nowrap z-50">
            Analisa 5 AM
          </span>
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors relative"
          title="Pemberitahuan"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Settings Gear */}
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          title="Pengaturan"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
