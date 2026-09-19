import { MT5AccountData } from '../types/journal';

export const MT5_CONFIG = {
  DIRECT_ENDPOINT: 'http://202.155.94.173/api/account/1',
  PROXY_ENDPOINT: '/api/mt5/account',
  API_KEY: 'TokenRahasia2026',
  POLL_INTERVAL_MS: 5000,
};

/**
 * Fetches real-time MT5 account data from the API endpoint.
 * Supports direct HTTP fetch (Android / local) and proxy fallback (HTTPS Cloud Run web).
 */
export async function fetchMT5AccountData(): Promise<MT5AccountData> {
  const headers = {
    'x-api-key': MT5_CONFIG.API_KEY,
    'Accept': 'application/json',
  };

  // 1. Try Direct Endpoint first
  try {
    const response = await fetch(MT5_CONFIG.DIRECT_ENDPOINT, {
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
  } catch (err) {
    // If running in browser under HTTPS, mixed content might block direct HTTP, so try proxy
  }

  // 2. Fallback to Proxy Endpoint (for Cloud Run HTTPS Web App)
  try {
    const proxyResponse = await fetch(MT5_CONFIG.PROXY_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
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
  } catch (proxyErr) {
    // Both attempts failed
  }

  throw new Error('Gagal menghubungkan ke endpoint MT5 (202.155.94.173). Pastikan server MT5 aktif.');
}
