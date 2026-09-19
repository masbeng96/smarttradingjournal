import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  TradeEntry, 
  PlanSettings, 
  DailyCoachingReport, 
  AppNotification, 
  FirebaseConfigState,
  AppVersionInfo,
  UserProfile,
  MT5AccountData
} from '../types/journal';
import { 
  DEFAULT_PLAN_SETTINGS, 
  STORAGE_KEYS, 
  getStoredFirebaseConfig, 
  saveFirebaseConfig,
  initFirebase,
  syncSaveTrade,
  syncDeleteTrade,
  syncSaveSettings,
  syncSaveCoaching,
  syncSaveUserProfile,
  syncGetUserProfile,
  registerFirebaseUser,
  loginFirebaseUser,
  logoutFirebaseUser,
  subscribeAuthState
} from '../lib/firebase';
import { fetchMT5AccountData, MT5_CONFIG } from '../lib/mt5Service';
import { generateDailyCoachingReport, isFiveAmAnalysisDue } from '../lib/dailyAnalysisEngine';
import { calculateRecommendedLot, generateLotMilestoneLadder } from '../lib/lotCalculator';
import { checkForAppUpdates, CURRENT_APP_VERSION } from '../lib/updaterService';
import { playWinSound, playWarningSound, playAnalysisNotificationSound } from '../lib/soundEffects';
import { generateId } from '../lib/utils';
import confetti from 'canvas-confetti';

interface JournalContextType {
  settings: PlanSettings;
  updateSettings: (newSettings: Partial<PlanSettings>) => void;
  trades: TradeEntry[];
  addTrade: (trade: Omit<TradeEntry, 'id' | 'createdAt' | 'isCompliantWithRisk' | 'recommendedLotSize'>) => void;
  deleteTrade: (id: string) => void;
  updateTrade: (id: string, trade: Partial<TradeEntry>) => void;
  
  // MT5 Real-time Data
  mt5Data: MT5AccountData | null;
  isMT5Loading: boolean;
  mt5Error: string | null;
  refreshMT5Data: () => Promise<void>;

  // Dynamic stats & equity
  currentEquity: number;
  totalRealizedPnl: number;
  winRate: number;
  profitFactor: number;
  activeLotAdvice: {
    recommendedLot: number;
    maxSafeLot: number;
    slPips: number;
    riskAmount: number;
  };
  
  // 5:00 AM Coaching
  coachingReports: DailyCoachingReport[];
  latestReport: DailyCoachingReport | null;
  runDailyAnalysisManual: () => void;
  
  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // Version & Updates
  currentVersion: AppVersionInfo;
  updateAvailable: boolean;
  latestVersion: AppVersionInfo | null;
  triggerAppUpdate: () => void;
  
  // User Authentication & Profile
  userProfile: UserProfile | null;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (email: string, pass: string, name: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;

  // Firebase state
  firebaseConfig: FirebaseConfigState;
  updateFirebaseConfig: (config: FirebaseConfigState) => void;
  isCloudConnected: boolean;

  // View mode
  activeTab: 'dashboard' | 'planner' | 'journal' | 'risk' | 'coaching' | 'calendar';
  setActiveTab: (tab: 'dashboard' | 'planner' | 'journal' | 'risk' | 'coaching' | 'calendar') => void;
  isMobileDeviceFrame: boolean;
  setIsMobileDeviceFrame: (val: boolean) => void;
  isNewTradeModalOpen: boolean;
  setIsNewTradeModalOpen: (val: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (val: boolean) => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (val: boolean) => void;
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (val: boolean) => void;
  
  // Onboarding Flow
  hasOnboarded: boolean;
  completeOnboarding: (initialSetup?: Partial<PlanSettings>) => void;
  resetOnboarding: () => void;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings State
  const [settings, setSettings] = useState<PlanSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_PLAN_SETTINGS, ...JSON.parse(saved) } : DEFAULT_PLAN_SETTINGS;
    } catch {
      return DEFAULT_PLAN_SETTINGS;
    }
  });

  // 2. Trades State
  const [trades, setTrades] = useState<TradeEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRADES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Coaching Reports
  const [coachingReports, setCoachingReports] = useState<DailyCoachingReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COACHING);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. User Profile State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // 6. MT5 Real-time Account State
  const [mt5Data, setMt5Data] = useState<MT5AccountData | null>(null);
  const [isMT5Loading, setIsMT5Loading] = useState<boolean>(false);
  const [mt5Error, setMt5Error] = useState<string | null>(null);

  const refreshMT5Data = async () => {
    setIsMT5Loading(true);
    try {
      const data = await fetchMT5AccountData();
      setMt5Data(data);
      setMt5Error(null);
    } catch (err: any) {
      setMt5Error(err.message || 'Gagal memuat data MT5');
    } finally {
      setIsMT5Loading(false);
    }
  };

  // Poll MT5 Real-time data on mount and interval
  useEffect(() => {
    refreshMT5Data();
    const interval = setInterval(refreshMT5Data, MT5_CONFIG.POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // 7. Firebase Config
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfigState>(getStoredFirebaseConfig);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // 8. UI Navigation & Frame states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planner' | 'journal' | 'risk' | 'coaching' | 'calendar'>('dashboard');
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState<boolean>(true);
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  // 9. Update Engine State
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [latestVersion, setLatestVersion] = useState<AppVersionInfo | null>(null);

  // 10. Onboarding State (First install on Android/Web)
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('trading_journal_has_onboarded_v1') === 'true';
    } catch {
      return false;
    }
  });

  const completeOnboarding = (initialSetup?: Partial<PlanSettings>) => {
    if (initialSetup) {
      setSettings(prev => ({ ...prev, ...initialSetup }));
    }
    localStorage.setItem('trading_journal_has_onboarded_v1', 'true');
    setHasOnboarded(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('trading_journal_has_onboarded_v1');
    setHasOnboarded(false);
  };

  // Initialize Firebase and listen to Auth state changes
  useEffect(() => {
    const { db } = initFirebase(firebaseConfig);
    setIsCloudConnected(!!db);

    const unsubscribe = subscribeAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        let profile = await syncGetUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Trader Pro'),
            tier: 'PRO',
            broker: 'Exness',
            accountType: 'LIVE',
            joinedDate: new Date().toISOString(),
          };
          await syncSaveUserProfile(profile);
        }
        setUserProfile(profile);
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
      }
    });

    return () => unsubscribe();
  }, [firebaseConfig]);

  // Auth Operations
  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const profile = await loginFirebaseUser(email, pass);
    setUserProfile(profile);
    addNotification({
      title: '👋 Selamat Datang!',
      message: `Berhasil masuk sebagai ${profile.displayName} (${profile.email}). Data Anda tersinkron ke cloud.`,
      type: 'TARGET_REACHED',
    });
    return profile;
  };

  const register = async (email: string, pass: string, name: string): Promise<UserProfile> => {
    const profile = await registerFirebaseUser(email, pass, name);
    setUserProfile(profile);
    addNotification({
      title: '🎉 Akun Berhasil Dibuat!',
      message: `Selamat datang di Smart Trading Journal, ${name}!`,
      type: 'TARGET_REACHED',
    });
    return profile;
  };

  const logout = async () => {
    await logoutFirebaseUser();
    setUserProfile(null);
    addNotification({
      title: '👋 Sesi Berakhir',
      message: 'Anda telah keluar dari akun. Aplikasi kini berjalan dalam mode tamu lokal.',
      type: 'TARGET_REACHED',
    });
  };

  const updateUserProfile = (newProfile: Partial<UserProfile>) => {
    setUserProfile(prev => {
      if (!prev) {
        const created: UserProfile = {
          uid: 'local-user',
          email: 'offline@trader.local',
          displayName: newProfile.displayName || 'Trader Pro',
          broker: newProfile.broker || 'Exness',
          accountType: newProfile.accountType || 'LIVE',
          tier: 'PRO',
          ...newProfile,
        };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(created));
        return created;
      }
      const updated = { ...prev, ...newProfile };
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      syncSaveUserProfile(updated);
      return updated;
    });
  };

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    syncSaveSettings(settings, firebaseConfig, userProfile?.uid);
  }, [settings, firebaseConfig, userProfile]);

  // Persist trades
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRADES, JSON.stringify(trades));
  }, [trades]);

  // Persist coaching
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COACHING, JSON.stringify(coachingReports));
  }, [coachingReports]);

  // Persist notifications
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Check for app updates on mount
  useEffect(() => {
    checkForAppUpdates().then((res) => {
      if (res.updateAvailable && res.latestVersion) {
        setUpdateAvailable(true);
        setLatestVersion(res.latestVersion);
        
        // Push in-app notification
        addNotification({
          title: `Update Tersedia (${res.latestVersion.version})`,
          message: `Fitur baru telah dirilis: ${res.latestVersion.title}. Klik untuk memperbarui aplikasi.`,
          type: 'UPDATE_AVAILABLE',
          data: res.latestVersion,
        });
      }
    });
  }, []);

  // Calculate current dynamic equity (bonds live MT5 equity if available and non-zero)
  const totalRealizedPnl = useMemo(() => {
    return trades
      .filter(t => t.outcome !== 'OPEN')
      .reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  }, [trades]);

  const currentEquity = useMemo(() => {
    if (mt5Data && mt5Data.isConnected) {
      return Number(((mt5Data.equity !== undefined && mt5Data.equity !== null) ? mt5Data.equity : mt5Data.balance ?? 0).toFixed(2));
    }
    return Math.max(0, Number((settings.initialCapital + totalRealizedPnl).toFixed(2)));
  }, [settings.initialCapital, totalRealizedPnl, mt5Data]);

  // Win Rate and stats
  const { winRate, profitFactor } = useMemo(() => {
    const closed = trades.filter(t => t.outcome !== 'OPEN');
    if (closed.length === 0) return { winRate: 0, profitFactor: 0 };
    
    const wins = closed.filter(t => t.outcome === 'WIN');
    const wr = (wins.length / closed.length) * 100;
    
    const grossProfit = closed.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(closed.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
    const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? grossProfit : 1;

    return {
      winRate: Number(wr.toFixed(1)),
      profitFactor: Number(pf.toFixed(2)),
    };
  }, [trades]);

  // Active Recommended Lot
  const activeLotAdvice = useMemo(() => {
    return calculateRecommendedLot(currentEquity, settings, settings.defaultPair || 'XAUUSD');
  }, [currentEquity, settings]);

  // Notification Helper
  const addNotification = (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: generateId(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // 5:00 AM Automated Analysis background scheduler
  useEffect(() => {
    const checkSchedule = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const hasRanToday = coachingReports.some(r => r.date === todayStr);

      if (isFiveAmAnalysisDue(hasRanToday ? todayStr : undefined)) {
        const newReport = generateDailyCoachingReport(trades, currentEquity, settings, todayStr);
        setCoachingReports(prev => [newReport, ...prev.filter(r => r.date !== todayStr)]);
        syncSaveCoaching(newReport, firebaseConfig, userProfile?.uid);

        // Notify user
        addNotification({
          title: '🌅 Analisa Trading 05:00 AM Siap!',
          message: `Disiplin Score: ${newReport.disciplineScore}%. Cek evaluasi apa yang harus dipertahankan & apa yang harus diimprove.`,
          type: 'ANALYSIS_5AM',
          data: newReport,
        });

        playAnalysisNotificationSound();
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000);
    return () => clearInterval(interval);
  }, [trades, currentEquity, settings, coachingReports, firebaseConfig, userProfile]);

  // Manual Trigger for 5:00 AM Analysis
  const runDailyAnalysisManual = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newReport = generateDailyCoachingReport(trades, currentEquity, settings, todayStr);
    
    setCoachingReports(prev => [newReport, ...prev.filter(r => r.date !== todayStr)]);
    syncSaveCoaching(newReport, firebaseConfig, userProfile?.uid);

    addNotification({
      title: '📊 Analisa Trading 05:00 AM Telah Dibuat',
      message: `Score Disiplin: ${newReport.disciplineScore}%. Evaluasi strategi Anda sekarang.`,
      type: 'ANALYSIS_5AM',
      data: newReport,
    });

    playAnalysisNotificationSound();
    setActiveTab('coaching');
  };

  // Trade Operations
  const addTrade = (tradeData: Omit<TradeEntry, 'id' | 'createdAt' | 'isCompliantWithRisk' | 'recommendedLotSize'>) => {
    const recommended = calculateRecommendedLot(currentEquity, settings, tradeData.pair, tradeData.entryPrice, tradeData.stopLoss);
    const isCompliant = tradeData.lotSize <= recommended.maxSafeLot;

    const newTrade: TradeEntry = {
      ...tradeData,
      id: `trade-${generateId()}`,
      recommendedLotSize: recommended.recommendedLot,
      createdAt: Date.now(),
      isCompliantWithRisk: isCompliant,
    };

    setTrades(prev => [newTrade, ...prev]);
    syncSaveTrade(newTrade, firebaseConfig, userProfile?.uid);

    if (tradeData.outcome === 'WIN') {
      playWinSound();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#fbbf24']
      });
    } else if (tradeData.outcome === 'LOSS') {
      playWarningSound();
    }

    // Check if Milestone Step-Up or Step-Down occurred
    const ladder = generateLotMilestoneLadder(currentEquity + tradeData.pnl, settings, tradeData.pair);
    if (ladder.currentTier.stepType === 'STEP_UP') {
      addNotification({
        title: '🚀 Milestone Step-Up Terbuka!',
        message: `Saldo bertumbuh mencapai Tier ${ladder.currentTier.tierLevel}! Lot rekomendasi naik ke ${ladder.currentTier.recommendedLot} lot.`,
        type: 'STEP_UP',
      });
    }
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
    syncDeleteTrade(id, firebaseConfig, userProfile?.uid);
  };

  const updateTrade = (id: string, updateData: Partial<TradeEntry>) => {
    setTrades(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...updateData };
        syncSaveTrade(updated, firebaseConfig, userProfile?.uid);
        return updated;
      }
      return t;
    }));
  };

  const updateSettings = (newSettings: Partial<PlanSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateFirebaseConfig = (cfg: FirebaseConfigState) => {
    setFirebaseConfig(cfg);
    saveFirebaseConfig(cfg);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const triggerAppUpdate = () => {
    if (latestVersion?.downloadUrl) {
      window.open(latestVersion.downloadUrl, '_blank');
    } else {
      window.location.reload();
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const latestReport = coachingReports.length > 0 ? coachingReports[0] : null;

  return (
    <JournalContext.Provider value={{
      settings,
      updateSettings,
      trades,
      addTrade,
      deleteTrade,
      updateTrade,
      mt5Data,
      isMT5Loading,
      mt5Error,
      refreshMT5Data,
      currentEquity,
      totalRealizedPnl,
      winRate,
      profitFactor,
      activeLotAdvice,
      coachingReports,
      latestReport,
      runDailyAnalysisManual,
      notifications,
      unreadNotificationCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      currentVersion: CURRENT_APP_VERSION,
      updateAvailable,
      latestVersion,
      triggerAppUpdate,
      userProfile,
      updateUserProfile,
      login,
      register,
      logout,
      isAuthModalOpen,
      setIsAuthModalOpen,
      firebaseConfig,
      updateFirebaseConfig,
      isCloudConnected,
      activeTab,
      setActiveTab,
      isMobileDeviceFrame,
      setIsMobileDeviceFrame,
      isNewTradeModalOpen,
      setIsNewTradeModalOpen,
      isSettingsModalOpen,
      setIsSettingsModalOpen,
      isNotificationDrawerOpen,
      setIsNotificationDrawerOpen,
      isUpdateModalOpen,
      setIsUpdateModalOpen,
      hasOnboarded,
      completeOnboarding,
      resetOnboarding,
    }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};
