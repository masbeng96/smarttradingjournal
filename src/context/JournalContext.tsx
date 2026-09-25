import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  TradeEntry, 
  TradeDirection,
  TradeOutcome,
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
import { 
  fetchBothMT5Accounts, 
  getAssignedMT5AccountId, 
  MT5_CONFIG 
} from '../lib/mt5Service';
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
  
  // MT5 Real-time Multi-Account Data
  mt5Account1: MT5AccountData | null;
  mt5Account2: MT5AccountData | null;
  mt5Data: MT5AccountData | null;
  assignedAccountId: (1 | 2) | null;
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

  // 6. MT5 Real-time Multi-Account States (Separate states for Akun 1 & Akun 2)
  const [mt5Account1, setMt5Account1] = useState<MT5AccountData | null>(null);
  const [mt5Account2, setMt5Account2] = useState<MT5AccountData | null>(null);
  const [mt5Data, setMt5Data] = useState<MT5AccountData | null>(null);
  const [isMT5Loading, setIsMT5Loading] = useState<boolean>(false);
  const [mt5Error, setMt5Error] = useState<string | null>(null);

  // Check assigned MT5 Account (Akun 1: robbiethirlby@gmail.com, Akun 2: mbagasdwiseptian@gmail.com)
  const assignedAccountId = useMemo(() => {
    return getAssignedMT5AccountId(userProfile?.email);
  }, [userProfile?.email]);

  const refreshMT5Data = async (signal?: AbortSignal) => {
    setIsMT5Loading(true);
    try {
      // Pull data from TWO sources simultaneously using Promise.all
      const { account1, account2, accumulated } = await fetchBothMT5Accounts(signal);
      setMt5Account1(account1);
      setMt5Account2(account2);

      let activeAccount: MT5AccountData | null = null;

      // Bind the active account based on logged-in user email, or accumulated multi-account total
      if (assignedAccountId === 1) {
        if (account1.isConnected) {
          activeAccount = account1;
          setMt5Data(account1);
          setMt5Error(null);
        } else {
          setMt5Error(account1.error || 'Gagal memuat Akun 1 MT5');
        }
      } else if (assignedAccountId === 2) {
        if (account2.isConnected) {
          activeAccount = account2;
          setMt5Data(account2);
          setMt5Error(null);
        } else {
          setMt5Error(account2.error || 'Gagal memuat Akun 2 MT5');
        }
      } else if (account1.isConnected || account2.isConnected || accumulated.isConnected) {
        // Multi-Account / Guest mode: use accumulated or whichever account is connected
        const primary = account1.isConnected ? account1 : account2;
        const totalBal = (account1.isConnected ? account1.balance : 0) + (account2.isConnected ? account2.balance : 0);
        const totalEq = (account1.isConnected ? account1.equity : 0) + (account2.isConnected ? account2.equity : 0);
        const totalMargin = (account1.isConnected ? account1.margin : 0) + (account2.isConnected ? account2.margin : 0);
        const totalFloating = (account1.isConnected ? account1.floating_pnl : 0) + (account2.isConnected ? account2.floating_pnl : 0);

        activeAccount = {
          akun: account1.isConnected && account2.isConnected ? 'Total Saldo Akun (1 & 2)' : primary.akun,
          balance: totalBal,
          equity: totalEq,
          margin: totalMargin,
          floating_pnl: totalFloating,
          initial_deposit: accumulated.initial_deposit,
          lastUpdated: primary.lastUpdated || new Date().toLocaleTimeString('id-ID'),
          isConnected: true,
          deals: [...(account1.deals || []), ...(account2.deals || [])],
          positions: [...(account1.positions || []), ...(account2.positions || [])],
        };
        setMt5Data(activeAccount);
        setMt5Error(null);
      } else {
        const err = [account1.error, account2.error].filter(Boolean).join(' \n');
        setMt5Error(err || 'Gagal memuat data MT5');
      }

      // Automatically sync open positions and closed deals from MT5 into trades state
      if (activeAccount && ((activeAccount.deals && activeAccount.deals.length > 0) || (activeAccount.positions && activeAccount.positions.length > 0))) {
        const syncedTrades: TradeEntry[] = [];
        const activePosIds = new Set<string>();

        // 1. Sync live open positions (with live SL & TP)
        if (activeAccount.positions && activeAccount.positions.length > 0) {
          activeAccount.positions.forEach((pos) => {
            const posId = `mt5-pos-${pos.ticket}`;
            activePosIds.add(posId);
            syncedTrades.push({
              id: posId,
              date: new Date(pos.time * 1000).toISOString(),
              pair: pos.symbol || 'XAUUSD',
              direction: pos.type || 'BUY',
              lotSize: pos.volume || 0.01,
              recommendedLotSize: pos.volume || 0.01,
              entryPrice: pos.price_open || 0,
              stopLoss: Number(pos.sl ?? 0),
              takeProfit: Number(pos.tp ?? 0),
              closePrice: undefined,
              pnl: Number(pos.profit.toFixed(2)),
              outcome: 'OPEN',
              emotions: ['Disciplined'],
              strategy: 'MT5 Live Position',
              notes: `Live MT5 Order Ticket #${pos.ticket}`,
              createdAt: pos.time * 1000,
              isCompliantWithRisk: true,
            });
          });
        }

        // 2. Sync closed deals, deposits, and withdrawals (with historical SL & TP)
        if (activeAccount.deals && activeAccount.deals.length > 0) {
          activeAccount.deals.forEach((deal) => {
            const sym = (deal.symbol || '').toUpperCase();
            const isDepositOrWithdrawal = 
              deal.deal_type === 'DEPOSIT' || 
              deal.deal_type === 'WITHDRAWAL' || 
              deal.type === 'DEPOSIT' || 
              deal.type === 'WITHDRAWAL' || 
              sym === 'EXTERNAL' || 
              sym === 'DEPOSIT' || 
              sym === 'WITHDRAWAL' || 
              sym === 'BALANCE' || 
              deal.volume <= 0;

            if (isDepositOrWithdrawal) {
              const isDep = deal.profit >= 0 || deal.type === 'DEPOSIT' || deal.deal_type === 'DEPOSIT';
              const outcomeType: TradeOutcome = isDep ? 'DEPOSIT' : 'WITHDRAWAL';
              const directionType: TradeDirection = isDep ? 'DEPOSIT' : 'WITHDRAWAL';
              const nominal = Math.abs(Number(deal.profit.toFixed(2)));

              syncedTrades.push({
                id: `mt5-fund-${deal.ticket}`,
                date: new Date(deal.time * 1000).toISOString(),
                pair: isDep ? 'DEPOSIT' : 'WITHDRAWAL',
                direction: directionType,
                lotSize: 0,
                recommendedLotSize: 0,
                entryPrice: 0,
                stopLoss: 0,
                takeProfit: 0,
                closePrice: 0,
                pnl: isDep ? nominal : -nominal,
                outcome: outcomeType,
                emotions: ['Disciplined'],
                strategy: isDep ? 'Deposit Modal Compounding' : 'Penarikan Dana (Withdrawal)',
                notes: deal.comment ? `${isDep ? 'Deposit' : 'Withdrawal'}: ${deal.comment}` : `Transaksi MT5 #${deal.ticket}`,
                createdAt: deal.time * 1000,
                isCompliantWithRisk: true,
              });
              return;
            }

            // Regular trading deal
            const isProfit = deal.profit > 0;
            const isLoss = deal.profit < 0;
            syncedTrades.push({
              id: `mt5-${deal.ticket}`,
              date: new Date(deal.time * 1000).toISOString(),
              pair: deal.symbol || 'XAUUSD',
              direction: deal.type || 'BUY',
              lotSize: deal.volume || 0.01,
              recommendedLotSize: deal.volume || 0.01,
              entryPrice: deal.price || 0,
              stopLoss: Number(deal.sl ?? 0),
              takeProfit: Number(deal.tp ?? 0),
              closePrice: deal.price || 0,
              pnl: Number(deal.profit.toFixed(2)),
              outcome: isProfit ? 'WIN' : isLoss ? 'LOSS' : 'BE',
              emotions: ['Disciplined'],
              strategy: 'MT5 Live Execution',
              notes: deal.comment ? `MT5 #${deal.ticket} (${deal.comment})` : `Auto-synced MT5 Ticket #${deal.ticket}`,
              createdAt: deal.time * 1000,
              isCompliantWithRisk: true,
            });
          });
        }

        // Merge without duplicating existing ticket IDs & clean up closed positions
        setTrades((prev) => {
          const map = new Map<string, TradeEntry>();
          // Put synced trades first
          syncedTrades.forEach((t) => map.set(t.id, t));
          // Put previous non-MT5 trades and keep them unless they were closed open positions
          prev.forEach((t) => {
            if (t.id.startsWith('mt5-pos-')) {
              // Only keep if still active in activePosIds
              if (activePosIds.has(t.id)) {
                if (!map.has(t.id)) map.set(t.id, t);
              }
            } else {
              if (!map.has(t.id)) map.set(t.id, t);
            }
          });
          return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        // Abort cancellation ignored silently
        return;
      }
      console.error("Fetch API Error: ", error);
      const rawError = error?.name
        ? `${error.name}: ${error.message || String(error)}`
        : (error?.message || error?.name || String(error) || 'Gagal memuat data MT5');
      setMt5Error(rawError);
    } finally {
      setIsMT5Loading(false);
    }
  };

  // Fetch MT5 data using AbortController with cleanup handling and auto-polling every 10s
  useEffect(() => {
    const controller = new AbortController();
    refreshMT5Data(controller.signal);

    // Auto-poll MT5 live sync every 10 seconds
    const interval = setInterval(() => {
      refreshMT5Data();
    }, 10000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [assignedAccountId]);

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
      .filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE')
      .reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  }, [trades]);

  const currentEquity = useMemo(() => {
    if (assignedAccountId && mt5Data && mt5Data.isConnected) {
      return Number(((mt5Data.equity !== undefined && mt5Data.equity !== null) ? mt5Data.equity : mt5Data.balance ?? 0).toFixed(2));
    }
    // Fallback to default local journal equity if not logged in or not assigned
    return Math.max(0, Number((settings.initialCapital + totalRealizedPnl).toFixed(2)));
  }, [settings.initialCapital, totalRealizedPnl, mt5Data, assignedAccountId]);

  // Win Rate and stats (strictly trading bets, excluding deposits/withdrawals)
  const { winRate, profitFactor } = useMemo(() => {
    const closed = trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE');
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

    // Notification Alerts based on user settings
    if (tradeData.outcome === 'OPEN') {
      if (settings.notifyOnTradeOpened !== false) {
        addNotification({
          title: `⚡ Trade Baru Dibuka: ${tradeData.pair}`,
          message: `Posisi ${tradeData.direction} ${tradeData.lotSize} lot pada harga ${tradeData.entryPrice}. SL: ${tradeData.stopLoss || '-'}, TP: ${tradeData.takeProfit || '-'}`,
          type: 'RULE_ALERT',
          data: newTrade,
        });
      }
    } else {
      if (settings.notifyOnTradeClosed !== false) {
        addNotification({
          title: `🏁 Trade Selesai: ${tradeData.pair} (${tradeData.outcome})`,
          message: `Hasil ${tradeData.outcome}: ${tradeData.pnl >= 0 ? '+' : ''}${tradeData.pnl} ${settings.currency}.`,
          type: tradeData.outcome === 'WIN' ? 'TARGET_REACHED' : 'RULE_ALERT',
          data: newTrade,
        });
      }
    }

    if (tradeData.outcome === 'WIN') {
      playWinSound();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#fbbf24']
      });
      if (settings.notifyOnTakeProfitHit !== false && tradeData.takeProfit) {
        addNotification({
          title: `🎯 Level Take Profit Tercapai: ${tradeData.pair}`,
          message: `Selamat! Target TP ${tradeData.takeProfit} berhasil tersentuh (+${tradeData.pnl} ${settings.currency}).`,
          type: 'TARGET_REACHED',
        });
      }
    } else if (tradeData.outcome === 'LOSS') {
      playWarningSound();
      if (settings.notifyOnStopLossHit !== false && tradeData.stopLoss) {
        addNotification({
          title: `🛑 Level Stop Loss Tersentuh: ${tradeData.pair}`,
          message: `Posisi menyentuh batas risiko SL ${tradeData.stopLoss}. Tetap disiplin dengan risk plan!`,
          type: 'RISK_WARNING',
        });
      }
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

        // Check if trade transitioned from OPEN to CLOSED
        if (t.outcome === 'OPEN' && updateData.outcome && updateData.outcome !== 'OPEN') {
          if (settings.notifyOnTradeClosed !== false) {
            addNotification({
              title: `🏁 Trade Selesai: ${updated.pair} (${updated.outcome})`,
              message: `Hasil: ${updated.pnl >= 0 ? '+' : ''}${updated.pnl} ${settings.currency} (${updated.outcome})`,
              type: updated.outcome === 'WIN' ? 'TARGET_REACHED' : 'RULE_ALERT',
            });
          }
          if (updated.outcome === 'WIN' && settings.notifyOnTakeProfitHit !== false) {
            addNotification({
              title: `🎯 Level Take Profit Tercapai: ${updated.pair}`,
              message: `Posisi ${updated.pair} berhasil menyentuh target profit! (+${updated.pnl} ${settings.currency})`,
              type: 'TARGET_REACHED',
            });
          }
          if (updated.outcome === 'LOSS' && settings.notifyOnStopLossHit !== false) {
            addNotification({
              title: `🛑 Level Stop Loss Tersentuh: ${updated.pair}`,
              message: `Posisi ${updated.pair} ditutup pada batas risiko SL. Disiplin terjaga!`,
              type: 'RISK_WARNING',
            });
          }
        }

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
      mt5Account1,
      mt5Account2,
      mt5Data,
      assignedAccountId,
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
