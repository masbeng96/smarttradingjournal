import { Capacitor } from '@capacitor/core';
import { MT5AccountData } from '../types/journal';

export const MT5_CONFIG = {
  DIRECT_ENDPOINT: 'http://202.155.94.173/api/account/1',
  PROXY_ENDPOINT: '/api/mt5/account',
  API_KEY: 'TokenRahasia2026',
  POLL_INTERVAL_MS: 5000,
};

/**
 * Fetches real-time MT5 account data from the API endpoint.
 * - On Native Android: Uses direct HTTP fetch (enabled by android:usesCleartextTraffic).
 * - In Web Browsers (Localhost & Cloud Run): Uses the proxy endpoint to avoid CORS / Mixed-Content restrictions.
 */
export async function fetchMT5AccountData(): Promise<MT5AccountData> {
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();

  const endpointsToTry = isNative
    ? [MT5_CONFIG.DIRECT_ENDPOINT, MT5_CONFIG.PROXY_ENDPOINT]
    : [MT5_CONFIG.PROXY_ENDPOINT, MT5_CONFIG.DIRECT_ENDPOINT];

  const headers: Record<string, string> = {
    'x-api-key': MT5_CONFIG.API_KEY,
    'Accept': 'application/json',
  };

  for (const endpoint of endpointsToTry) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        return {
          akun: data.akun || 'Akun MT5',
          balance: Number(data.balance ?? 0),
          equity: Number(data.equity ?? 0),
          margin: Number(data.margin ?? 0),
          floating_pnl: Number(data.floating_pnl ?? 0),
          lastUpdated: new Date().toLocaleTimeString('id-ID'),
          isConnected: true,
        };
      }
    } catch {
      // Continue to next endpoint attempt
    }
  }

  throw new Error('Gagal menghubungkan ke endpoint MT5 (202.155.94.173). Pastikan server MT5 aktif.');
}
