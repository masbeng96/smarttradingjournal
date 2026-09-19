import { Capacitor } from '@capacitor/core';
import { MT5AccountData } from '../types/journal';

export const CLOUD_BACKEND_ORIGIN = 'https://smarttrading-app-1019478115925.asia-southeast2.run.app';

export const MT5_CONFIG = {
  DIRECT_BASE: 'http://202.155.94.173/api/account/',
  PROXY_BASE: 'https://corsproxy.io/?http://202.155.94.173/api/account/',
  CLOUD_PROXY_BASE: `${CLOUD_BACKEND_ORIGIN}/api/mt5/account/`,
  RELATIVE_PROXY_BASE: '/api/mt5/account/',
  API_KEY: 'TokenRahasia2026',
  POLL_INTERVAL_MS: 5000,
};

export const MT5_EMAIL_ACCOUNT_MAP: Record<string, 1 | 2> = {
  'robbiethirlby@gmail.com': 1,
  'mbagasdwiseptian@gmail.com': 2,
};

/**
 * Returns the mapped MT5 Account ID for a given user email, or null if unmapped / guest.
 */
export function getAssignedMT5AccountId(email?: string | null): (1 | 2) | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  return MT5_EMAIL_ACCOUNT_MAP[normalized] || null;
}

/**
 * Gets dynamic MT5 base URL depending on platform (Capacitor native vs Web HTTPS)
 */
export function getDynamicMT5BaseUrl(): string {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  if (isNative) {
    // Native Android APK: direct HTTP URL
    return 'http://202.155.94.173/api/account/';
  }
  // Web Preview: CORS proxy URL
  return 'https://corsproxy.io/?http://202.155.94.173/api/account/';
}

/**
 * Fetches single MT5 account data for account 1 or 2 using dynamic Capacitor routing
 */
export async function fetchSingleMT5Account(accountId: 1 | 2 = 1, signal?: AbortSignal): Promise<MT5AccountData> {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  
  const primaryUrl = isNative 
    ? `http://202.155.94.173/api/account/${accountId}`
    : `https://corsproxy.io/?http://202.155.94.173/api/account/${accountId}`;

  const fallbackUrls = [
    `${CLOUD_BACKEND_ORIGIN}/api/mt5/account/${accountId}`,
    `/api/mt5/account/${accountId}`,
    `http://202.155.94.173/api/account/${accountId}`
  ];

  const candidateUrls = [primaryUrl, ...fallbackUrls.filter(u => u !== primaryUrl)];

  const headers = {
    'x-api-key': 'TokenRahasia2026',
    'Accept': 'application/json',
  };

  const errorLogs: string[] = [];

  for (const endpoint of candidateUrls) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal,
      });

      if (!response.ok) {
        errorLogs.push(`[${endpoint}] HTTP ${response.status} (${response.statusText || 'Error'})`);
        continue;
      }

      const data = await response.json();
      
      if (data.isConnected === false) {
        return {
          akun: data.akun || `Akun ${accountId}`,
          balance: Number(data.balance ?? data.saldo ?? 0),
          equity: Number(data.equity ?? data.balance ?? data.saldo ?? 0),
          margin: Number(data.margin ?? 0),
          floating_pnl: Number(data.floating_pnl ?? data.floatingPnl ?? data.profit ?? 0),
          isConnected: false,
          error: data.error || `Server MT5 mengembalikan isConnected=false (${endpoint})`,
        };
      }

      return {
        akun: data.akun || `Akun ${accountId}`,
        balance: Number(data.balance ?? data.saldo ?? 0),
        equity: Number(data.equity ?? data.balance ?? data.saldo ?? 0),
        margin: Number(data.margin ?? 0),
        floating_pnl: Number(data.floating_pnl ?? data.floatingPnl ?? data.profit ?? 0),
        lastUpdated: new Date().toLocaleTimeString('id-ID'),
        isConnected: true,
      };
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        throw error;
      }
      console.error("Fetch API Error: ", error);
      const rawDetail = error?.name
        ? `${error.name}: ${error.message || String(error)}`
        : (error?.message || error?.name || String(error));
      errorLogs.push(`[${endpoint}] ${rawDetail}`);
    }
  }

  return {
    akun: `Akun ${accountId}`,
    balance: 0,
    equity: 0,
    margin: 0,
    floating_pnl: 0,
    isConnected: false,
    error: errorLogs.join(' \n') || 'Tidak dapat terhubung ke endpoint MT5',
  };
}

/**
 * Fetches both MT5 Account 1 and Account 2 simultaneously using Promise.all,
 * and calculates accumulated Total Equity & Balance.
 */
export async function fetchBothMT5Accounts(signal?: AbortSignal): Promise<{
  account1: MT5AccountData;
  account2: MT5AccountData;
  accumulated: {
    totalEquity: number;
    totalBalance: number;
    totalMargin: number;
    totalFloatingPnl: number;
    lastUpdated: string;
    isConnected: boolean;
  };
}> {
  const [account1, account2] = await Promise.all([
    fetchSingleMT5Account(1, signal),
    fetchSingleMT5Account(2, signal),
  ]);

  const isAnyConnected = Boolean(account1.isConnected || account2.isConnected);
  const totalEquity = (account1.isConnected ? account1.equity : 0) + (account2.isConnected ? account2.equity : 0);
  const totalBalance = (account1.isConnected ? account1.balance : 0) + (account2.isConnected ? account2.balance : 0);
  const totalMargin = (account1.isConnected ? account1.margin : 0) + (account2.isConnected ? account2.margin : 0);
  const totalFloatingPnl = (account1.isConnected ? account1.floating_pnl : 0) + (account2.isConnected ? account2.floating_pnl : 0);

  return {
    account1,
    account2,
    accumulated: {
      totalEquity: Number(totalEquity.toFixed(2)),
      totalBalance: Number(totalBalance.toFixed(2)),
      totalMargin: Number(totalMargin.toFixed(2)),
      totalFloatingPnl: Number(totalFloatingPnl.toFixed(2)),
      lastUpdated: account1.lastUpdated || account2.lastUpdated || new Date().toLocaleTimeString('id-ID'),
      isConnected: isAnyConnected,
    },
  };
}

/**
 * Legacy single fetch fallback
 */
export async function fetchMT5AccountData(accountId: 1 | 2 = 1, signal?: AbortSignal): Promise<MT5AccountData> {
  return fetchSingleMT5Account(accountId, signal);
}
