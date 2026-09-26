import { Capacitor } from '@capacitor/core';
import { MT5AccountData } from '../types/journal';

export const CLOUD_BACKEND_ORIGIN = 'https://smarttrading-app-1019478115925.asia-southeast2.run.app';

export const MT5_CONFIG = {
  DIRECT_BASE: 'http://202.155.94.173/api/account/',
  DIRECT_PORT_8080: 'http://202.155.94.173:8080/api/account/',
  RELATIVE_PROXY_BASE: '/api/account/',
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
    return 'http://202.155.94.173/api/account/';
  }
  return '/api/account/';
}

/**
 * Fetches single MT5 account data for account 1 or 2 using dynamic Capacitor routing
 */
export async function fetchSingleMT5Account(accountId: 1 | 2 = 1, parentSignal?: AbortSignal): Promise<MT5AccountData> {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  
  // Endpoints list tailored for Native Android vs Web / Vite Dev
  const candidateUrls = isNative
    ? [
        `http://202.155.94.173/api/account/${accountId}`,
        `http://202.155.94.173:8080/api/account/${accountId}`,
      ]
    : [
        `/api/account/${accountId}`,
        `http://202.155.94.173/api/account/${accountId}`,
        `http://202.155.94.173:8080/api/account/${accountId}`,
      ];

  const headers = {
    'x-api-key': 'TokenRahasia2026',
    'Accept': 'application/json',
  };

  const errorLogs: string[] = [];

  for (const endpoint of candidateUrls) {
    try {
      // 25-second timeout per candidate endpoint so it doesn't hang forever but waits for MT5 Python locks
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 25000);

      // Link parent signal if provided
      if (parentSignal) {
        parentSignal.addEventListener('abort', () => timeoutController.abort());
      }

      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        cache: 'no-store',
        signal: timeoutController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        errorLogs.push(`[${endpoint}] HTTP ${response.status} (${response.statusText || 'Error'})`);
        continue;
      }

      const data = await response.json();
      
      if (data.error) {
        return {
          akun: data.akun || `Akun ${accountId}`,
          balance: Number(data.balance ?? data.saldo ?? 0),
          equity: Number(data.equity ?? data.balance ?? data.saldo ?? 0),
          margin: Number(data.margin ?? 0),
          floating_pnl: Number(data.floating_pnl ?? data.floatingPnl ?? data.profit ?? 0),
          isConnected: false,
          error: data.error,
        };
      }

      return {
        akun: data.akun || `Akun ${accountId}`,
        balance: Number(data.balance ?? data.saldo ?? 0),
        equity: Number(data.equity ?? data.balance ?? data.saldo ?? 0),
        margin: Number(data.margin ?? 0),
        floating_pnl: Number(data.floating_pnl ?? data.floatingPnl ?? data.profit ?? 0),
        initial_deposit: data.initial_deposit !== undefined && data.initial_deposit !== null ? Number(data.initial_deposit) : undefined,
        broker: data.broker,
        server: data.server,
        clientName: data.client_name,
        tradeMode: data.trade_mode,
        lastUpdated: new Date().toLocaleTimeString('id-ID'),
        isConnected: true,
        deals: Array.isArray(data.deals) ? data.deals : [],
        positions: Array.isArray(data.positions) ? data.positions : [],
      };
    } catch (error: any) {
      if (parentSignal?.aborted) {
        throw error;
      }
      const rawDetail = error?.message || error?.name || String(error);
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
    deals: [],
    positions: [],
    error: errorLogs.join(' | ') || 'Tidak dapat terhubung ke endpoint MT5 VPS',
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
    initial_deposit?: number;
    lastUpdated: string;
    isConnected: boolean;
    deals: any[];
    positions: any[];
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
  const totalInitialDeposit = (account1.isConnected && account1.initial_deposit ? account1.initial_deposit : 0) + 
                              (account2.isConnected && account2.initial_deposit ? account2.initial_deposit : 0);
  const mergedDeals = [...(account1.deals || []), ...(account2.deals || [])];
  const mergedPositions = [...(account1.positions || []), ...(account2.positions || [])];

  return {
    account1,
    account2,
    accumulated: {
      totalEquity: Number(totalEquity.toFixed(2)),
      totalBalance: Number(totalBalance.toFixed(2)),
      totalMargin: Number(totalMargin.toFixed(2)),
      totalFloatingPnl: Number(totalFloatingPnl.toFixed(2)),
      initial_deposit: totalInitialDeposit > 0 ? Number(totalInitialDeposit.toFixed(2)) : undefined,
      lastUpdated: account1.lastUpdated || account2.lastUpdated || new Date().toLocaleTimeString('id-ID'),
      isConnected: isAnyConnected,
      deals: mergedDeals,
      positions: mergedPositions,
    },
  };
}

/**
 * Legacy single fetch fallback
 */
export async function fetchMT5AccountData(accountId: 1 | 2 = 1, signal?: AbortSignal): Promise<MT5AccountData> {
  return fetchSingleMT5Account(accountId, signal);
}
