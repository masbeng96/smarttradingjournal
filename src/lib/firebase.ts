import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  onSnapshot,
  Firestore 
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged, 
  User,
  Auth 
} from 'firebase/auth';
import { TradeEntry, PlanSettings, DailyCoachingReport, FirebaseConfigState, UserProfile } from '../types/journal';

const FIREBASE_CONFIG_KEY = 'trading_journal_firebase_config';

export function getStoredFirebaseConfig(): FirebaseConfigState {
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return {
    apiKey: 'AIzaSyDOurewkXEshBxa5l43c2IRSNPWfqSnVoo',
    projectId: 'smarttrading-51b72',
    authDomain: 'smarttrading-51b72.firebaseapp.com',
    storageBucket: 'smarttrading-51b72.firebasestorage.app',
    useCloudFirestore: true,
  };
}

export function saveFirebaseConfig(config: FirebaseConfigState) {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function initFirebase(config: FirebaseConfigState): { db: Firestore | null; auth: Auth | null } {
  if (!config.useCloudFirestore || !config.apiKey || !config.projectId) {
    dbInstance = null;
    authInstance = null;
    return { db: null, auth: null };
  }

  try {
    appInstance = getApps().length > 0 ? getApp() : initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
    });

    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
    return { db: dbInstance, auth: authInstance };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    dbInstance = null;
    authInstance = null;
    return { db: null, auth: null };
  }
}

// Storage helpers
export const STORAGE_KEYS = {
  SETTINGS: 'trading_journal_settings_v1',
  TRADES: 'trading_journal_trades_v1',
  COACHING: 'trading_journal_coaching_v1',
  NOTIFICATIONS: 'trading_journal_notifications_v1',
  USER_PROFILE: 'trading_journal_user_profile_v1',
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

// ==========================================
// Authentication Functions
// ==========================================

export async function registerFirebaseUser(email: string, password: string, displayName: string): Promise<UserProfile> {
  if (!authInstance) {
    initFirebase(getStoredFirebaseConfig());
  }
  if (!authInstance) {
    throw new Error('Koneksi Firebase Auth tidak tersedia.');
  }

  const credential = await createUserWithEmailAndPassword(authInstance, email, password);
  const user = credential.user;

  if (displayName) {
    await updateProfile(user, { displayName });
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName: displayName || user.displayName || email.split('@')[0],
    tier: 'PRO',
    broker: 'Exness / MetaTrader 5',
    accountType: 'LIVE',
    joinedDate: new Date().toISOString(),
  };

  // Save profile to Firestore
  await syncSaveUserProfile(profile);
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

  return profile;
}

export async function loginFirebaseUser(email: string, password: string): Promise<UserProfile> {
  if (!authInstance) {
    initFirebase(getStoredFirebaseConfig());
  }
  if (!authInstance) {
    throw new Error('Koneksi Firebase Auth tidak tersedia.');
  }

  const credential = await signInWithEmailAndPassword(authInstance, email, password);
  const user = credential.user;

  // Try to load user profile from Firestore
  let profile = await syncGetUserProfile(user.uid);
  if (!profile) {
    profile = {
      uid: user.uid,
      email: user.email || email,
      displayName: user.displayName || email.split('@')[0],
      tier: 'PRO',
      broker: 'MetaTrader 5',
      accountType: 'LIVE',
      joinedDate: new Date().toISOString(),
    };
    await syncSaveUserProfile(profile);
  }

  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  return profile;
}

export async function logoutFirebaseUser(): Promise<void> {
  if (authInstance) {
    await signOut(authInstance);
  }
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  if (!authInstance) {
    initFirebase(getStoredFirebaseConfig());
  }
  if (authInstance) {
    return onAuthStateChanged(authInstance, callback);
  }
  callback(null);
  return () => {};
}

// ==========================================
// Firestore Sync operations
// ==========================================

export async function syncSaveUserProfile(profile: UserProfile) {
  if (dbInstance) {
    try {
      const docRef = doc(dbInstance, 'users', profile.uid);
      await setDoc(docRef, profile, { merge: true });
    } catch (e) {
      console.warn('Firestore user profile save error:', e);
    }
  }
}

export async function syncGetUserProfile(uid: string): Promise<UserProfile | null> {
  if (dbInstance) {
    try {
      const docRef = doc(dbInstance, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
    } catch (e) {
      console.warn('Firestore get profile error:', e);
    }
  }
  return null;
}

export async function syncSaveTrade(trade: TradeEntry, config: FirebaseConfigState, uid?: string) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const path = uid ? `users/${uid}/trades` : 'trades';
      const docRef = doc(dbInstance, path, trade.id);
      await setDoc(docRef, trade);
    } catch (e) {
      console.warn('Firestore save error, trade saved to local state:', e);
    }
  }
}

export async function syncDeleteTrade(tradeId: string, config: FirebaseConfigState, uid?: string) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const path = uid ? `users/${uid}/trades` : 'trades';
      const docRef = doc(dbInstance, path, tradeId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Firestore delete error:', e);
    }
  }
}

export async function syncSaveSettings(settings: PlanSettings, config: FirebaseConfigState, uid?: string) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const path = uid ? `users/${uid}/settings` : 'settings';
      const docRef = doc(dbInstance, path, 'user_plan');
      await setDoc(docRef, settings);
    } catch (e) {
      console.warn('Firestore settings save error:', e);
    }
  }
}

export async function syncSaveCoaching(report: DailyCoachingReport, config: FirebaseConfigState, uid?: string) {
  if (config.useCloudFirestore && dbInstance) {
    try {
      const path = uid ? `users/${uid}/coaching_reports` : 'coaching_reports';
      const docRef = doc(dbInstance, path, report.id);
      await setDoc(docRef, report);
    } catch (e) {
      console.warn('Firestore coaching save error:', e);
    }
  }
}
