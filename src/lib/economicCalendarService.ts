import { Capacitor } from '@capacitor/core';
import { EconomicEvent, NewsImpact } from '../types/journal';

const STORAGE_KEY_CALENDAR = 'trading_journal_economic_calendar_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
export const CLOUD_BACKEND_ORIGIN = 'https://smarttrading-app-1019478115925.asia-southeast2.run.app';

export const CALENDAR_ENDPOINTS = {
  PROXY_THIS_WEEK: '/api/calendar/thisweek',
  PROXY_NEXT_WEEK: '/api/calendar/nextweek',
  CLOUD_THIS_WEEK: `${CLOUD_BACKEND_ORIGIN}/api/calendar/thisweek`,
  CLOUD_NEXT_WEEK: `${CLOUD_BACKEND_ORIGIN}/api/calendar/nextweek`,
  DIRECT_THIS_WEEK: 'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  DIRECT_NEXT_WEEK: 'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
};

export const COUNTRY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  NZD: '🇳🇿',
  CNY: '🇨🇳',
  ALL: '🌐',
};

/**
 * Normalizes a raw Forex Factory news event from FairEconomy / FF JSON feed
 */
export function normalizeForexFactoryEvent(item: any, index: number): EconomicEvent {
  const eventDate = new Date(item.date);
  const now = new Date();
  
  // Format WIB (UTC+7) or user local time
  const timeWib = eventDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }) + ' WIB';

  const dateFormatted = eventDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  const dateKey = eventDate.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  }); // YYYY-MM-DD in WIB

  const todayKey = now.toLocaleDateString('en-CA', {
    timeZone: 'Asia/Jakarta',
  });

  const isToday = dateKey === todayKey;
  const isPast = eventDate.getTime() < now.getTime();

  let impact: NewsImpact = 'Low';
  const rawImpact = (item.impact || '').toLowerCase();
  if (rawImpact.includes('high') || rawImpact.includes('red')) {
    impact = 'High';
  } else if (rawImpact.includes('med') || rawImpact.includes('orange')) {
    impact = 'Medium';
  } else if (rawImpact.includes('low') || rawImpact.includes('yellow')) {
    impact = 'Low';
  } else if (rawImpact.includes('holiday') || rawImpact.includes('gray')) {
    impact = 'Holiday';
  }

  const country = (item.country || 'ALL').toUpperCase();

  // Create a clean detail query URL to Forex Factory
  const detailUrl = `https://www.forexfactory.com/calendar#details=${encodeURIComponent(item.title || '')}`;

  return {
    id: `ff-${item.date}-${country}-${index}`,
    title: item.title || 'Economic News Release',
    country,
    date: item.date,
    timestamp: eventDate.getTime(),
    timeWib,
    dateFormatted,
    dateKey,
    impact,
    forecast: item.forecast || '-',
    previous: item.previous || '-',
    actual: item.actual || undefined,
    isHighImpact: impact === 'High',
    isToday,
    isPast,
    detailUrl,
  };
}

/**
 * Fetches economic calendar from Forex Factory JSON feed with fallback and local caching
 */
export async function fetchEconomicCalendar(period: 'thisweek' | 'nextweek' = 'thisweek', forceRefresh = false): Promise<EconomicEvent[]> {
  const cacheKey = `${STORAGE_KEY_CALENDAR}_${period}`;

  // 1. Check local cache if not force refreshing
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS && Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Ignore cache parse error
    }
  }

  // 2. Determine endpoints to try (Cloud proxy, relative proxy, direct CDN)
  const isNative = typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  const cloudUrl = period === 'thisweek' ? CALENDAR_ENDPOINTS.CLOUD_THIS_WEEK : CALENDAR_ENDPOINTS.CLOUD_NEXT_WEEK;
  const proxyUrl = period === 'thisweek' ? CALENDAR_ENDPOINTS.PROXY_THIS_WEEK : CALENDAR_ENDPOINTS.PROXY_NEXT_WEEK;
  const directUrl = period === 'thisweek' ? CALENDAR_ENDPOINTS.DIRECT_THIS_WEEK : CALENDAR_ENDPOINTS.DIRECT_NEXT_WEEK;

  const urlsToTry = isNative
    ? [cloudUrl, directUrl, proxyUrl]
    : [proxyUrl, cloudUrl, directUrl];

  let rawData: any[] | null = null;

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        rawData = await res.json();
        if (Array.isArray(rawData) && rawData.length > 0) {
          break;
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  if (!rawData || !Array.isArray(rawData)) {
    throw new Error('Gagal mengambil data kalender Forex Factory. Periksa koneksi internet Anda.');
  }

  // 3. Normalize & Sort by Timestamp
  const normalizedEvents = rawData
    .map((item, idx) => normalizeForexFactoryEvent(item, idx))
    .sort((a, b) => a.timestamp - b.timestamp);

  // 4. Save to cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      timestamp: Date.now(),
      data: normalizedEvents,
    }));
  } catch {
    // Ignore storage quota error
  }

  return normalizedEvents;
}

/**
 * Returns human-readable time countdown for an event
 */
export function getEventCountdownText(eventTimestamp: number): string {
  const diffMs = eventTimestamp - Date.now();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < -120) {
    return 'Telah Selesai';
  }
  if (diffMinutes < 0) {
    return 'Baru Saja Rilis';
  }
  if (diffMinutes <= 15) {
    return `⚡ Segera Rilis (${diffMinutes}m)`;
  }
  if (diffMinutes < 60) {
    return `Dalam ${diffMinutes} menit`;
  }
  const hours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;
  if (hours < 24) {
    return `Dalam ${hours}j ${remMinutes}m`;
  }
  const days = Math.floor(hours / 24);
  return `${days} hari lagi`;
}
