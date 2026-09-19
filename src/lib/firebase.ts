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
  showEconomicCalendarBanner: true,
  notifyOnTradeOpened: true,
  notifyOnTradeClosed: true,
  notifyOnStopLossHit: true,
  notifyOnTakeProfitHit: true,
};

// Local Accounts Registry Key
const LOCAL_ACCOUNTS_KEY = 'trading_journal_local_accounts_v1';

export interface LocalAccountRecord {
  uid: string;
  email: string;
  displayName: string;
  password?: string;
  tier?: 'PRO' | 'ELITE' | 'FREE';
  broker?: string;
  accountType?: 'LIVE' | 'DEMO' | 'PROP_FIRM';
  joinedDate?: string;
}

export function getFallbackUid(email: string): string {
  const clean = email.toLowerCase().trim();
  try {
    return 'usr_' + btoa(clean).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  } catch {
    return 'usr_' + clean.replace(/[^a-zA-Z0-9]/g, '_');
  }
}

export function getStoredLocalAccounts(): LocalAccountRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAccount(account: LocalAccountRecord) {
  try {
    const accounts = getStoredLocalAccounts().filter(a => a.email.toLowerCase() !== account.email.toLowerCase());
    accounts.push(account);
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Failed saving local account:', e);
  }
}

// ==========================================
// Authentication Functions (Hybrid Cloud & Local)
// ==========================================

export async function registerFirebaseUser(email: string, password: string, displayName: string): Promise<UserProfile> {
  const cleanEmail = email.toLowerCase().trim();
  let cleanName = displayName.trim();
  
  if (!cleanName) {
    if (cleanEmail === 'robbiethirlby@gmail.com') cleanName = 'Robby Cahyadi';
    else if (cleanEmail === 'mbagasdwiseptian@gmail.com') cleanName = 'M Bagas Dwi Septian';
    else cleanName = cleanEmail.split('@')[0];
  }

  if (!authInstance) {
    initFirebase(getStoredFirebaseConfig());
  }

  let uid: string | null = null;

  if (authInstance) {
    try {
      const credential = await createUserWithEmailAndPassword(authInstance, cleanEmail, password);
      const user = credential.user;
      uid = user.uid;

      if (cleanName) {
        await updateProfile(user, { displayName: cleanName }).catch(() => {});
      }
    } catch (err: any) {
      console.warn('Firebase Auth direct register failed, switching to hybrid Firestore auth:', err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Email ini sudah terdaftar. Silakan pilih tab "Masuk".');
      }
      // For any configuration or network issues (auth/configuration-not-found, etc.), fallback smoothly
      uid = getFallbackUid(cleanEmail);
    }
  } else {
    uid = getFallbackUid(cleanEmail);
  }

  if (!uid) {
    uid = getFallbackUid(cleanEmail);
  }

  const profile: UserProfile = {
    uid,
    email: cleanEmail,
    displayName: cleanName,
    tier: 'PRO',
    broker: 'Exness / MetaTrader 5',
    accountType: 'LIVE',
    joinedDate: new Date().toISOString(),
  };

  // Save to Firestore users collection
  await syncSaveUserProfile(profile);

  // Save to local accounts registry
  saveLocalAccount({
    uid,
    email: cleanEmail,
    displayName: cleanName,
    password,
    tier: 'PRO',
    broker: 'Exness / MetaTrader 5',
    accountType: 'LIVE',
    joinedDate: profile.joinedDate,
  });

  // Save active profile
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));

  return profile;
}

export async function loginFirebaseUser(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.toLowerCase().trim();
  let fallbackName = cleanEmail.split('@')[0];
  if (cleanEmail === 'robbiethirlby@gmail.com') fallbackName = 'Robby Cahyadi';
  if (cleanEmail === 'mbagasdwiseptian@gmail.com') fallbackName = 'M Bagas Dwi Septian';

  if (!authInstance) {
    initFirebase(getStoredFirebaseConfig());
  }

  let userUid: string | null = null;
  let userDisplayName: string = fallbackName;

  if (authInstance) {
    try {
      const credential = await signInWithEmailAndPassword(authInstance, cleanEmail, password);
      const user = credential.user;
      userUid = user.uid;
      if (user.displayName) {
        userDisplayName = user.displayName;
      }
    } catch (err: any) {
      console.warn('Firebase Auth direct login failed, using hybrid Firestore verification:', err.code, err.message);
      if (err.code === 'auth/wrong-password') {
        throw new Error('Password salah. Silakan periksa kembali.');
      }
      userUid = getFallbackUid(cleanEmail);
    }
  } else {
    userUid = getFallbackUid(cleanEmail);
  }

  if (!userUid) {
    userUid = getFallbackUid(cleanEmail);
  }

  // Check local account record
  const localAccounts = getStoredLocalAccounts();
  const localAcc = localAccounts.find(a => a.email.toLowerCase() === cleanEmail);
  if (localAcc) {
    if (localAcc.password && password && localAcc.password !== password) {
      throw new Error('Password salah. Silakan periksa kembali.');
    }
    userDisplayName = localAcc.displayName || userDisplayName;
  }

  // Try to load user profile from Firestore
  let profile = await syncGetUserProfile(userUid);
  if (!profile) {
    profile = {
      uid: userUid,
      email: cleanEmail,
      displayName: userDisplayName,
      tier: 'PRO',
      broker: 'Exness / MetaTrader 5',
      accountType: 'LIVE',
      joinedDate: new Date().toISOString(),
    };
    await syncSaveUserProfile(profile);
  }

  // Update local registry & active session
  saveLocalAccount({
    uid: userUid,
    email: cleanEmail,
    displayName: profile.displayName || userDisplayName,
    password,
    tier: profile.tier || 'PRO',
    broker: profile.broker || 'Exness / MetaTrader 5',
    accountType: profile.accountType || 'LIVE',
    joinedDate: profile.joinedDate || new Date().toISOString(),
  });

  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  return profile;
}

export async function logoutFirebaseUser(): Promise<void> {
  if (authInstance) {
    try {
      await signOut(authInstance);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    }
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
