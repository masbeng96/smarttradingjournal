import { AppVersionInfo } from '../types/journal';

export const CURRENT_APP_VERSION: AppVersionInfo = {
  version: '1.0.9',
  versionCode: 10,
  releaseDate: '2026-09-19',
  title: 'Trading Journal Pro v1.0.9',
  changelog: [
    'Pembaruan Logo Baru (logo-trading.jpg) di seluruh antarmuka web, modal login/register, dan favicon',
    'Pembaruan App Launcher Icon dan Splash Screen Android Native dengan logo trading resmi'
  ],
  downloadUrl: 'https://github.com/masbeng96/smarttradingjournal/releases/download/v1.0.9/TradingJournal-v1.0.9.apk',
  mandatory: false,
};

/**
 * Checks if a newer version is available from version.json
 */
export async function checkForAppUpdates(customUrl?: string): Promise<{
  updateAvailable: boolean;
  latestVersion?: AppVersionInfo;
  isMandatory?: boolean;
}> {
  try {
    const url = customUrl || '/version.json?t=' + Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return { updateAvailable: false };
    }

    const latest: AppVersionInfo = await res.json();
    
    // Compare versions (e.g. 1.0.1 > 1.0.0 or versionCode > current)
    const isNewer = latest.versionCode > CURRENT_APP_VERSION.versionCode || 
                    compareSemVer(latest.version, CURRENT_APP_VERSION.version) > 0;

    return {
      updateAvailable: isNewer,
      latestVersion: latest,
      isMandatory: !!latest.mandatory,
    };
  } catch (error) {
    console.warn('Update check failed (offline or localhost):', error);
    return { updateAvailable: false };
  }
}

function compareSemVer(v1: string, v2: string): number {
  const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
