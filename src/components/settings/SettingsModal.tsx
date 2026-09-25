import React, { useState, useRef, useEffect } from 'react';
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
  Sparkles, 
  Globe, 
  Edit2, 
  Camera, 
  Trash2, 
  RefreshCw, 
  Bell, 
  BellRing, 
  Volume2, 
  Zap, 
  Check, 
  Image as ImageIcon,
  Flame,
  Radio,
  Sliders
} from 'lucide-react';
import { CustomSelect } from '../ui/CustomSelect';
import { playWinSound, playAnalysisNotificationSound } from '../../lib/soundEffects';

const BROKER_OPTIONS = [
  { value: 'Exness', label: 'Exness' },
  { value: 'HFM (HotForex)', label: 'HFM (HotForex)' },
  { value: 'IC Markets', label: 'IC Markets' },
  { value: 'XM Global', label: 'XM Global' },
  { value: 'OctaFX', label: 'OctaFX' },
  { value: 'FTMO / Prop Firm', label: 'FTMO / Prop Firm' },
  { value: 'FundedNext / Funded', label: 'FundedNext' },
  { value: 'MyForexFunds / Funded', label: 'Funded Account' },
  { value: 'Binance / Crypto', label: 'Binance / Crypto' },
  { value: 'Bybit / Crypto', label: 'Bybit / Crypto' },
  { value: 'MetaQuotes MT5', label: 'MetaQuotes MT5' },
  { value: 'TradingView Paper', label: 'TradingView Paper' },
];

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'LIVE', label: 'Live Real Account' },
  { value: 'PROP_FIRM', label: 'Prop Firm Funded' },
  { value: 'DEMO', label: 'Demo / Practice' },
];

// Preset Avatar SVG/Image Options
const PRESET_AVATARS = [
  { id: 'pro', label: '👑 Pro Trader', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'wolf', label: '🐺 Wolf Trader', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'eagle', label: '🦅 Smart Money', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'lady', label: '💎 Diamond VIP', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
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
    resetOnboarding,
    mt5Data,
    refreshMT5Data,
    isMT5Loading
  } = useJournal();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || 'Darpan Trader');
  const [broker, setBroker] = useState(userProfile?.broker || 'Exness');
  const [accountType, setAccountType] = useState<'LIVE' | 'DEMO' | 'PROP_FIRM'>(userProfile?.accountType || 'LIVE');
  const [currentPhoto, setCurrentPhoto] = useState<string | undefined>(userProfile?.photoURL);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testNotificationToast, setTestNotificationToast] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with userProfile when modal opens
  useEffect(() => {
    if (isSettingsModalOpen) {
      setDisplayName(userProfile?.displayName || 'Darpan Trader');
      setBroker(userProfile?.broker || 'Exness');
      setAccountType(userProfile?.accountType || 'LIVE');
      setCurrentPhoto(userProfile?.photoURL);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    }
  }, [isSettingsModalOpen, userProfile]);

  if (!isSettingsModalOpen) return null;

  // Compress & handle custom image upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 240;
        const MAX_HEIGHT = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCurrentPhoto(compressedDataUrl);
          updateUserProfile({ photoURL: compressedDataUrl });
          setShowPhotoPicker(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setCurrentPhoto(url);
    updateUserProfile({ photoURL: url });
    setShowPhotoPicker(false);
  };

  const handleRemovePhoto = () => {
    setCurrentPhoto(undefined);
    updateUserProfile({ photoURL: '' });
    setShowPhotoPicker(false);
  };

  // Auto-sync Broker and Account Type from live MT5 data
  const handleAutoSyncFromMT5 = async () => {
    try {
      await refreshMT5Data();
      
      let detectedBroker = 'Exness';
      let detectedType: 'LIVE' | 'DEMO' | 'PROP_FIRM' = 'LIVE';

      if (mt5Data?.akun) {
        const lower = mt5Data.akun.toLowerCase();
        if (lower.includes('demo')) {
          detectedType = 'DEMO';
        } else if (lower.includes('prop') || lower.includes('funded') || lower.includes('ftmo')) {
          detectedType = 'PROP_FIRM';
        } else {
          detectedType = 'LIVE';
        }

        if (lower.includes('exness')) detectedBroker = 'Exness';
        else if (lower.includes('hfm') || lower.includes('hotforex')) detectedBroker = 'HFM (HotForex)';
        else if (lower.includes('ic') || lower.includes('icmarkets')) detectedBroker = 'IC Markets';
        else if (lower.includes('xm')) detectedBroker = 'XM Global';
        else if (lower.includes('octa')) detectedBroker = 'OctaFX';
        else if (lower.includes('ftmo')) detectedBroker = 'FTMO / Prop Firm';
        else if (lower.includes('funded')) detectedBroker = 'FundedNext / Funded';
        else if (lower.includes('metaquotes')) detectedBroker = 'MetaQuotes MT5';
      }

      setBroker(detectedBroker);
      setAccountType(detectedType);
      updateUserProfile({
        broker: detectedBroker,
        accountType: detectedType,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to auto-sync MT5 account:', err);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      displayName,
      broker,
      accountType,
      photoURL: currentPhoto,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission === 'granted') {
          playWinSound();
          setTestNotificationToast('✅ Izin Notifikasi Android / Browser Aktif!');
          setTimeout(() => setTestNotificationToast(null), 3500);
        }
      } catch (err) {
        console.error('Notification permission error:', err);
      }
    }
  };

  const triggerTestNotification = () => {
    playAnalysisNotificationSound();
    setTestNotificationToast('🔔 [Android Test] Notifikasi Trading Berhasil Dikirim!');
    
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Trading Journal Pro - Android Test', {
          body: 'Notifikasi live MT5, alarm berita Forex Factory & evaluasi 05:00 AM aktif di perangkat Android Anda.',
          icon: '/logo-trading.jpg',
        });
      } catch (err) {
        console.log('Push notification display simulated');
      }
    }

    setTimeout(() => {
      setTestNotificationToast(null), 4000;
    });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-[#E5E5E2] rounded-[32px] p-5 shadow-2xl relative my-auto space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
        
        {/* Toast feedback */}
        {testNotificationToast && (
          <div className="p-3 rounded-2xl bg-[#0F0F0F] text-white text-xs font-semibold shadow-xl border border-neutral-700 flex items-center space-x-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testNotificationToast}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#0F0F0F] text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0F0F0F]">Pengaturan Akun & Profil</h3>
              <p className="text-[11px] text-[#737373]">Profil Trader, MT5 Live Sync & Notifikasi</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#F2F2EF] border border-[#E5E5E2] text-[#737373] hover:text-[#0F0F0F] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Profile Card with Photo Customizer */}
        <div className="p-4 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar with Click to Change Photo */}
              <div className="relative group">
                <div className="w-14 h-14 rounded-2xl bg-[#0F0F0F] text-white flex items-center justify-center font-bold shrink-0 shadow-sm overflow-hidden border-2 border-white ring-1 ring-[#E5E5E2]">
                  {currentPhoto ? (
                    <img 
                      src={currentPhoto} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-base font-mono-num">
                      {getInitials(userProfile?.displayName || 'Darpan')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-[#0F0F0F] text-white hover:bg-neutral-800 shadow-md transition-transform active:scale-95 border border-white"
                  title="Ganti Foto Profil"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-extrabold text-[#0F0F0F]">
                    {userProfile?.displayName || 'Darpan Trader'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#0F0F0F] text-white text-[9px] font-extrabold tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[11px] text-[#737373]">
                  {userProfile?.email || 'Mode Tamu (Offline)'}
                </p>
                <div className="flex items-center space-x-2 text-[10px] text-[#525252] font-semibold mt-0.5">
                  <span>{userProfile?.broker || 'Exness'}</span>
                  <span>•</span>
                  <span>{userProfile?.accountType === 'LIVE' ? 'Real Live' : userProfile?.accountType === 'PROP_FIRM' ? 'Prop Firm' : 'Demo'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl bg-white border border-[#E5E5E2] text-[#737373] hover:text-[#0F0F0F] transition-colors shadow-sm"
              title="Edit Profil"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Photo Selector Drawer */}
          {showPhotoPicker && (
            <div className="p-3 rounded-2xl bg-white border border-[#E5E5E2] space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold text-[#0F0F0F]">
                <span>Pilih Foto Profil Trader</span>
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(false)}
                  className="text-[#737373] hover:text-[#0F0F0F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upload Custom Photo from Device */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] hover:border-[#0F0F0F] text-xs font-bold text-[#0F0F0F] flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#0F0F0F]" />
                  <span>Upload Foto</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {currentPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="p-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>

              {/* Preset Avatars */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#737373] font-bold block">Preset Avatar Pro</span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className="group p-1 rounded-xl border border-[#E5E5E2] hover:border-[#0F0F0F] hover:shadow-sm bg-[#F7F7F5] flex flex-col items-center space-y-1 transition-all"
                    >
                      <img 
                        src={preset.url} 
                        alt={preset.label} 
                        className="w-10 h-10 rounded-lg object-cover group-hover:scale-105 transition-transform" 
                      />
                      <span className="text-[8px] font-bold text-[#525252] truncate w-full text-center">
                        {preset.label.split(' ')[1]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="pt-2 border-t border-[#E5E5E2] space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10px] text-[#737373] font-semibold block">Nama Trader</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white border border-[#E5E5E2] rounded-xl px-2.5 py-1.5 text-xs text-[#0F0F0F] font-bold focus:outline-none focus:border-[#0F0F0F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#737373] font-semibold block">Broker / Platform</label>
                <CustomSelect
                  options={BROKER_OPTIONS}
                  value={broker}
                  onChange={setBroker}
                  searchable
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#737373] font-semibold block">Tipe Akun</label>
                <CustomSelect
                  options={ACCOUNT_TYPE_OPTIONS}
                  value={accountType}
                  onChange={(val) => setAccountType(val as any)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#0F0F0F] text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </form>
          )}

          {saveSuccess && (
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center space-x-1.5 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Profil & sinkronisasi berhasil disimpan!</span>
            </div>
          )}
        </div>

        {/* 2. Broker & Tipe Akun Live MT5 Status */}
        <div className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#0F0F0F] flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Koneksi Akun MT5</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-white border border-[#E5E5E2] space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#737373]">
              <span>Akun MT5:</span>
              <span className="font-mono-num font-bold text-[#0F0F0F]">{mt5Data?.akun || 'Akun MT5 Live'}</span>
            </div>
            <div className="flex items-center justify-between text-[#737373]">
              <span>Broker:</span>
              <span className="font-bold text-[#0F0F0F]">{userProfile?.broker || 'Exness'}</span>
            </div>
            <div className="flex items-center justify-between text-[#737373]">
              <span>Tipe Akun:</span>
              <span className="font-bold text-[#0F0F0F]">
                {userProfile?.accountType === 'LIVE' ? 'Real Live Account' : userProfile?.accountType === 'PROP_FIRM' ? 'Prop Firm Funded' : 'Demo Account'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Pengaturan Notifikasi & Alarm Android */}
        <div className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[#0F0F0F] flex items-center space-x-1.5">
              <BellRing className="w-4 h-4 text-[#0F0F0F]" />
              <span>Notifikasi & Alarm Android</span>
            </span>
          </div>

          {/* Android / Browser Permission Status */}
          <div className="p-2.5 rounded-xl bg-white border border-[#E5E5E2] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#0F0F0F]">Status Izin Notifikasi</div>
              <div className="text-[10px] text-[#737373]">
                {permissionStatus === 'granted' ? '✅ Notifikasi Diizinkan' : '⚠️ Izin belum diaktifkan'}
              </div>
            </div>
            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="px-2.5 py-1 rounded-xl bg-[#0F0F0F] text-white text-[10px] font-bold shadow-sm"
              >
                Aktifkan Izin
              </button>
            )}
          </div>

          {/* Notification Toggles */}
          <div className="space-y-2 pt-1">
            {/* Alarm Berita Forex High-Impact */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#0F0F0F] flex items-center space-x-1">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Alarm Berita Forex High-Impact</span>
                </div>
                <div className="text-[10px] text-[#737373]">Alarm notifikasi 15 menit sebelum rilis berita merah</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ showEconomicCalendarBanner: settings.showEconomicCalendarBanner === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.showEconomicCalendarBanner !== false ? 'bg-[#0F0F0F] justify-end' : 'bg-[#D4D4D0] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Alert Trade Baru Dibuka */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#0F0F0F]">Trade Baru Dibuka (MT5)</div>
                <div className="text-[10px] text-[#737373]">Notifikasi saat open position tereksekusi</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ notifyOnTradeOpened: settings.notifyOnTradeOpened === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.notifyOnTradeOpened !== false ? 'bg-[#0F0F0F] justify-end' : 'bg-[#D4D4D0] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Alert Trade Ditutup / Win Loss */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#0F0F0F]">Trade Ditutup / Selesai</div>
                <div className="text-[10px] text-[#737373]">Hasil PnL profit, loss & target TP/SL</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ notifyOnTradeClosed: settings.notifyOnTradeClosed === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.notifyOnTradeClosed !== false ? 'bg-[#0F0F0F] justify-end' : 'bg-[#D4D4D0] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Coaching Harian 05:00 Pagi */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#0F0F0F]">Evaluasi Harian 05:00 Pagi</div>
                <div className="text-[10px] text-[#737373]">Analisa strategi dan arahan lot harian</div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ notifyOnTakeProfitHit: settings.notifyOnTakeProfitHit === false ? true : false })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  settings.notifyOnTakeProfitHit !== false ? 'bg-[#0F0F0F] justify-end' : 'bg-[#D4D4D0] justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>

          {/* Test Notification Action */}
          <button
            type="button"
            onClick={triggerTestNotification}
            className="w-full py-2.5 rounded-xl bg-white border border-[#E5E5E2] hover:border-[#0F0F0F] text-xs font-bold text-[#0F0F0F] flex items-center justify-center transition-all shadow-sm cursor-pointer"
          >
            <span>Uji Coba Notifikasi Android</span>
          </button>
        </div>

        {/* 4. Authentication Card */}
        <div className="p-3.5 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0F0F0F] flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0F0F0F]" />
              <span>Sesi Akun & Sinkronisasi Cloud</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#E5E5E2] text-[#737373] font-semibold">
              {userProfile ? 'Terhubung' : 'Offline'}
            </span>
          </div>

          {userProfile ? (
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-[#737373]">
                Masuk sebagai <span className="text-[#0F0F0F] font-bold">{userProfile.email}</span>
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-[#737373]">
                Masuk untuk menyinkronkan jurnal trading dan data live MT5 secara real-time.
              </p>
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#0F0F0F] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk / Daftar Akun Trader</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Data Backup & Export / Import */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-[#737373] block px-1">Cadangan & Pemulihan Data</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportData}
              className="p-2.5 rounded-xl bg-white border border-[#E5E5E2] text-[#0F0F0F] hover:bg-[#F2F2EF] flex items-center justify-center space-x-1.5 font-bold transition-all shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0F0F0F]" />
              <span>Export JSON</span>
            </button>

            <label className="p-2.5 rounded-xl bg-white border border-[#E5E5E2] text-[#0F0F0F] hover:bg-[#F2F2EF] flex items-center justify-center space-x-1.5 font-bold transition-all shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-[#0F0F0F]" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>

        {/* 6. Onboarding Restart */}
        <div className="p-3 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] text-xs flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[#0F0F0F] font-bold">
            <Smartphone className="w-4 h-4 text-[#737373]" />
            <span>Panduan Aplikasi</span>
          </div>
          <button
            onClick={() => {
              resetOnboarding();
              setIsSettingsModalOpen(false);
            }}
            className="text-[11px] text-[#0F0F0F] font-extrabold hover:underline cursor-pointer"
          >
            Ulangi Onboarding
          </button>
        </div>
      </div>
    </div>
  );
};
