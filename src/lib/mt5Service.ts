import { Capacitor } from '@capacitor/core';
import { MT5AccountData } from '../types/journal';

export const CLOUD_BACKEND_ORIGIN = 'https://smarttrading-app-1019478115925.asia-southeast2.run.app';

export const MT5_CONFIG = {
  DIRECT_BASE: 'http://202.155.94.173/api/account',
  PROXY_BASE: '/api/mt5/account',
  CLOUD_PROXY_BASE: `${CLOUD_BACKEND_ORIGIN}/api/mt5/account`,
  API_KEY: 'TokenRahasia2026',
  POLL_INTERVAL_MS: 5000,
  REQUEST_TIMEOUT_MS: 5000,
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
 * Fetches real-time MT5 account data for a specific account ID (1 or 2).
 */
export async function fetchSingleMT5Account(accountId: 1 | 2 = 1): Promise<MT5AccountData> {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';

  const directUrl = `${MT5_CONFIG.DIRECT_BASE}/${accountId}`;
  const relativeProxyUrl = `${MT5_CONFIG.PROXY_BASE}/${accountId}`;
  const cloudProxyUrl = `${MT5_CONFIG.CLOUD_PROXY_BASE}/${accountId}`;
  const directApiProxy = `/api/account/${accountId}`;
  const cloudDirectProxy = `${CLOUD_BACKEND_ORIGIN}/api/account/${accountId}`;

  let endpointsToTry: string[];
  if (isNative) {
    // On Native Android WebView: direct cleartext HTTP first, then full Cloud Run proxy
    endpointsToTry = [directUrl, cloudProxyUrl, cloudDirectProxy];
  } else if (isHttps) {
    // On Web HTTPS: relative proxies to avoid Mixed Content
    endpointsToTry = [relativeProxyUrl, directApiProxy, cloudProxyUrl];
  } else {
    // On Web HTTP (localhost):
    endpointsToTry = [relativeProxyUrl, directApiProxy, directUrl, cloudProxyUrl];
  }

  const headers: Record<string, string> = {
    'x-api-key': MT5_CONFIG.API_KEY,
    'Accept': 'application/json',
  };

  for (const endpoint of endpointsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MT5_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Handle server-reported disconnection
        if (data.isConnected === false) {
          return {
            akun: data.akun || `Akun ${accountId}`,
            balance: Number(data.balance ?? 0),
            equity: Number(data.equity ?? 0),
            margin: Number(data.margin ?? 0),
            floating_pnl: Number(data.floating_pnl ?? 0),
            isConnected: false,
            error: data.error || 'Server MT5 tidak merespons',
          };
        }

        return {
          akun: data.akun || `Akun ${accountId}`,
          balance: Number(data.balance ?? 0),
          equity: Number(data.equity ?? 0),
          margin: Number(data.margin ?? 0),
          floating_pnl: Number(data.floating_pnl ?? 0),
          lastUpdated: new Date().toLocaleTimeString('id-ID'),
          isConnected: true,
        };
      }
    } catch {
      clearTimeout(timeoutId);
      // Continue to next endpoint attempt
    }
  }

  return {
    akun: `Akun ${accountId}`,
    balance: 0,
    equity: 0,
    margin: 0,
    floating_pnl: 0,
    isConnected: false,
    error: `Server MT5 (202.155.94.173) offline`,
  };
}

/**
 * Fetches both MT5 Account 1 and Account 2 simultaneously using Promise.all
 */
export async function fetchBothMT5Accounts(): Promise<{
  account1: MT5AccountData;
  account2: MT5AccountData;
}> {
  const [account1, account2] = await Promise.all([
    fetchSingleMT5Account(1),
    fetchSingleMT5Account(2),
  ]);

  return { account1, account2 };
}

/**
 * Legacy single fetch fallback
 */
export async function fetchMT5AccountData(accountId: 1 | 2 = 1): Promise<MT5AccountData> {
  return fetchSingleMT5Account(accountId);
}
