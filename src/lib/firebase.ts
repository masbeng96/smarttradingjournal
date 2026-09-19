import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  Firestore 
} from 'firebase/firestore';
import { TradeEntry, PlanSettings, DailyCoachingReport, FirebaseConfigState } from '../types/journal';

const FIREBASE_CONFIG_KEY = 'trading_journal_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfigState {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return {
    useCloudFirestore: false,
  };
}

export function saveFirebaseConfig(config: FirebaseConfigState) {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
}

let dbInstance: Firestore | null = null;

export function initFirebase(config: FirebaseConfigState): Firestore | null {
  if (!config.useCloudFirestore || !config.apiKey || !config.projectId) {
    dbInstance = null;
    return null;
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.error('Firebase initialization error:', err);
    dbInstance = null;
    return null;
  }
}

// Storage helpers
export const STORAGE_KEYS = {
  SETTINGS: 'trading_journal_settings_v1',
  TRADES: 'trading_journal_trades_v1',
  COACHING: 'trading_journal_coaching_v1',
  NOTIFICATIONS: 'trading_journal_notifications_v1',
};

export const DEFAULT_PLAN_SETTINGS: PlanSettings = {
  initialCapital: 1000,
  currency: 'USD',
  exchangeRateUsdIdr: 15500,
  monthlyDeposit: 200,
  monthlyDepositDay: 25,
  depositEnabled: true,
  monthlyTargetPercent: 10,
  tradingDaysPerMonth: 22,
  projectionMonths: 12,
  riskPerTradePercent: 1.0,
  maxDailyLossPercent: 3.0,
  targetRRR: 2.0,
  avgStopLossPips: 25,
  defaultPair: 'XAUUSD',
  autoLotCompounding: true,
  stepUpEquityMultiplier: 1.25,
  stepDownDrawdownThreshold: 5,
};

// Firestore Sync operations with Local fallback
export async function syncSaveTrade(trade: TradeEntry, config: FirebaseConfigState) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const docRef = doc(dbInstance, 'trades', trade.id);
      await setDoc(docRef, trade);
    } catch (e) {
      console.warn('Firestore save error, trade saved to local state:', e);
    }
  }
}

export async function syncDeleteTrade(tradeId: string, config: FirebaseConfigState) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const docRef = doc(dbInstance, 'trades', tradeId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore delete error:', e);
    }
  }
}

export async function syncSaveSettings(settings: PlanSettings, config: FirebaseConfigState) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const docRef = doc(dbInstance, 'settings', 'user_plan');
      await setDoc(docRef, settings);
    } catch (e) {
      console.warn('Firestore settings save error:', e);
    }
  }
}

export async function syncSaveCoaching(report: DailyCoachingReport, config: FirebaseConfigState) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const docRef = doc(dbInstance, 'coaching_reports', report.id);
      await setDoc(docRef, report);
    } catch (e) {
      console.warn('Firestore coaching save error:', e);
    }
  }
}
