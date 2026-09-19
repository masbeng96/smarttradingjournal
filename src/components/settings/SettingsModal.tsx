import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  User, 
  X, 
  Download, 
  Upload, 
  LogOut, 
  LogIn, 
  Smartphone, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  Sparkles,
  Award,
  Globe,
  Edit2
} from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';

const BROKER_OPTIONS = [
  { value: 'Exness', label: 'Exness' },
  { value: 'HFM (HotForex)', label: 'HFM (HotForex)' },
  { value: 'IC Markets', label: 'IC Markets' },
  { value: 'XM Global', label: 'XM Global' },
  { value: 'OctaFX', label: 'OctaFX' },
  { value: 'FTMO / Prop Firm', label: 'FTMO / Prop Firm' },
  { value: 'MyForexFunds / Funded', label: 'Funded Account' },
  { value: 'Binance / Crypto', label: 'Binance / Crypto' },
  { value: 'Bybit / Crypto', label: 'Bybit / Crypto' },
  { value: 'TradingView Paper', label: 'TradingView Paper' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'LIVE', label: 'Live Real Account' },
  { value: 'PROP_FIRM', label: 'Prop Firm Funded' },
  { value: 'DEMO', label: 'Demo / Practice' },
];

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsModalOpen, 
    setIsSettingsModalOpen, 
    userProfile,
    updateUserProfile,
    setIsAuthModalOpen,
    logout,
    trades,
    settings,
    updateSettings,
    coachingReports,
    resetOnboarding
  } = useJournal();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || 'Trader Pro');
  const [broker, setBroker] = useState(userProfile?.broker || 'Exness');
  const [accountType, setAccountType] = useState<'LIVE' | 'DEMO' | 'PROP_FIRM'>(userProfile?.accountType || 'LIVE');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      displayName,
      broker,
      accountType,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportData = () => {
    const fullBackup = {
      version: '1.0.1',
      exportedAt: new Date().toISOString(),
      userProfile,
      settings,
      trades,
      coachingReports,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trading_journal_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) localStorage.setItem('trading_journal_settings_v1', JSON.stringify(parsed.settings));
        if (parsed.trades) localStorage.setItem('trading_journal_trades_v1', JSON.stringify(parsed.trades));
        if (parsed.coachingReports) localStorage.setItem('trading_journal_coaching_v1', JSON.stringify(parsed.coachingReports));
        if (parsed.userProfile) localStorage.setItem('trading_journal_user_profile_v1', JSON.stringify(parsed.userProfile));
        alert('Data berhasil diimpor! Aplikasi akan dimuat ulang.');
        window.location.reload();
      } catch (err) {
        alert('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'TR';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-3xl p-5 shadow-2xl relative my-auto space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-glow-emerald flex items-center justify-center">
              <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pengaturan Profil</h3>
              <p className="text-[11px] text-slate-400">Akun Trader, Preferensi, & Cadangan</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900/90 to-[#0c1220] border border-slate-800 relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar with Initials */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-glow-emerald flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-[#0b0f19] rounded-[14px] flex items-center justify-center">
                  <span className="text-sm font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    {getInitials(userProfile?.displayName || 'Trader')}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {userProfile?.displayName || 'Trader Tamu'}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {userProfile?.email || 'Mode Tamu (Offline)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Edit Profil"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Nama Trader</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#070a12] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Broker / Platform Utama</label>
                <CustomSelect
                  options={BROKER_OPTIONS}
                  value={broker}
                  onChange={setBroker}
                  searchable
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Tipe Akun</label>
                <CustomSelect
                  options={ACCOUNT_TYPE_OPTIONS}
                  value={accountType}
                  onChange={(val) => setAccountType(val as any)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#070a12] font-bold text-xs shadow-glow-emerald"
              >
                Simpan Perubahan
              </button>
            </form>
          )}

          {saveSuccess && (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center space-x-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Profil berhasil diperbarui!</span>
            </div>
          )}
        </div>

        {/* Authentication Card (Login/Daftar or Logout) */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sesi & Sinkronisasi Cloud</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {userProfile ? 'Terhubung' : 'Offline'}
            </span>
          </div>

          {userProfile ? (
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400">
                Masuk sebagai <span className="text-emerald-400 font-semibold">{userProfile.email}</span>
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-slate-400">
                Masuk atau buat akun untuk menyinkronkan jurnal trading dan data MT5 Anda secara real-time.
              </p>
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-[#070a12] font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-glow-emerald cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Daftar Akun Trader</span>
              </button>
            </div>
          )}
        </div>

        {/* Tampilan Overview & Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Tampilan Overview</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-semibold text-slate-200">Banner Kalender Berita</div>
              <div className="text-[10px] text-slate-400">Tampilkan quick-banner Forex Factory di dashboard utama</div>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ showEconomicCalendarBanner: settings.showEconomicCalendarBanner === false ? true : false })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.showEconomicCalendarBanner !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>
        </div>

        {/* Pengaturan Notifikasi Trading Alert */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <span className="font-bold text-white flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pengaturan Notifikasi Alert Trading</span>
          </span>

          <div className="space-y-2.5 pt-1">
            {/* 1. Trade Dibuka */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Trade Baru Dibuka</div>
                <div className="text-[10px] text-slate-400">Notifikasi saat posisi open entry tercatat</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ notifyOnTradeOpened: settings.notifyOnTradeOpened === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.notifyOnTradeOpened !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* 2. Trade Ditutup */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Trade Ditutup / Selesai</div>
                <div className="text-[10px] text-slate-400">Notifikasi saat posisi closed (Win / Loss / BE)</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ notifyOnTradeClosed: settings.notifyOnTradeClosed === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.notifyOnTradeClosed !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* 3. Stop Loss Hit */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Level Stop Loss Tersentuh</div>
                <div className="text-[10px] text-slate-400">Peringatan alert saat harga menyentuh batas SL</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ notifyOnStopLossHit: settings.notifyOnStopLossHit === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.notifyOnStopLossHit !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* 4. Take Profit Hit */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">Level Take Profit Tersentuh</div>
                <div className="text-[10px] text-slate-400">Notifikasi selebrasi saat target TP tercapai</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ notifyOnTakeProfitHit: settings.notifyOnTakeProfitHit === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.notifyOnTakeProfitHit !== false ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Data Backup & Export / Import */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-300 block">Cadangan & Pemulihan Data</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center space-x-1.5 font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>

            <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center space-x-1.5 font-semibold transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Android Onboarding Restart */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/20 to-slate-900 border border-cyan-500/20 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
            <Smartphone className="w-4 h-4" />
            <span>Panduan Aplikasi</span>
          </div>
          <button
            onClick={() => {
              resetOnboarding();
              setIsSettingsModalOpen(false);
            }}
            className="text-[11px] text-emerald-400 hover:underline font-semibold"
          >
            Ulangi Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};
