import { TradeEntry, PlanSettings, DailyCoachingReport } from '../types/journal';
import { calculateRecommendedLot, generateLotMilestoneLadder } from './lotCalculator';
import { generateId } from './utils';

/**
 * Generates an automated 5:00 AM daily analysis & coaching report
 * Evaluates win rate, risk adherence, emotional discipline, and generates
 * actionable insights ("Apa yang harus dipertahankan" & "Apa yang harus diimprove").
 */
export function generateDailyCoachingReport(
  trades: TradeEntry[],
  currentEquity: number,
  settings: PlanSettings,
  targetDateStr?: string
): DailyCoachingReport {
  const dateKey = targetDateStr || new Date().toISOString().split('T')[0];
  
  // Filter closed trades (strictly trading bets)
  const closedTrades = trades.filter(t => t.outcome === 'WIN' || t.outcome === 'LOSS' || t.outcome === 'BE');
  
  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter(t => t.outcome === 'WIN');
  const losses = closedTrades.filter(t => t.outcome === 'LOSS');
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const netPnl = closedTrades.reduce((acc, t) => acc + t.pnl, 0);

  // Discipline Calculation
  let disciplinePoints = 100;
  
  // Check over-lot trades
  const overLotTrades = closedTrades.filter(t => t.lotSize > (t.recommendedLotSize * 1.25));
  if (overLotTrades.length > 0) {
    disciplinePoints -= Math.min(35, overLotTrades.length * 15);
  }

  // Check bad emotions (FOMO, Revenge, Overtrading)
  const badEmotionTrades = closedTrades.filter(t => 
    t.emotions.includes('FOMO') || 
    t.emotions.includes('Revenge Trade') || 
    t.emotions.includes('Overtrading') ||
    t.emotions.includes('Greedy')
  );
  if (badEmotionTrades.length > 0) {
    disciplinePoints -= Math.min(30, badEmotionTrades.length * 10);
  }

  // Check no SL
  const noSlTrades = closedTrades.filter(t => t.stopLoss <= 0);
  if (noSlTrades.length > 0) {
    disciplinePoints -= Math.min(30, noSlTrades.length * 20);
  }

  const disciplineScore = Math.max(10, Math.min(100, Math.round(disciplinePoints)));

  // Determine strengths: Apa yang harus dipertahankan
  const whatToMaintain: string[] = [];

  if (totalTrades === 0) {
    whatToMaintain.push('Kesiapan modal dan rencana compound tersusun rapi.');
    whatToMaintain.push('Disiplin menunggu setup trading yang valid dengan rasio RR minimal 1:2.');
  } else {
    if (noSlTrades.length === 0) {
      whatToMaintain.push('🛡️ Konsisten menerapkan Stop Loss pada 100% posisi trade tanpa kompromi.');
    }
    if (overLotTrades.length === 0) {
      whatToMaintain.push('⚖️ Sangat disiplin mematuhi rekomendasi lot kalkulator sesuai batas risiko.');
    }
    if (winRate >= 55) {
      whatToMaintain.push(`🎯 Akurasi win rate tinggi (${winRate.toFixed(1)}%) mencerminkan pemilihan setup yang berkualitas.`);
    }
    if (badEmotionTrades.length === 0) {
      whatToMaintain.push('🧠 Kontrol psikologi stabil — tidak terdeteksi indikasi FOMO atau Revenge Trading.');
    }
    if (netPnl > 0) {
      whatToMaintain.push(`📈 Kurva pertumbuhan modal positif (+${netPnl.toFixed(2)}) selaras dengan target compound.`);
    }
    if (whatToMaintain.length === 0) {
      whatToMaintain.push('Tetap mencatat jurnal secara teratur untuk evaluasi objektif.');
    }
  }

  // Determine improvements: Apa yang harus diimprove
  const whatToImprove: string[] = [];

  if (totalTrades === 0) {
    whatToImprove.push('Pastikan selalu memasukkan trade ke jurnal segera setelah membuka posisi.');
    whatToImprove.push('Periksa lot rekomendasi sebelum melakukan eksekusi di MetaTrader / TradingView.');
  } else {
    if (overLotTrades.length > 0) {
      whatToImprove.push(`⚠️ Terdapat ${overLotTrades.length} trade dengan ukuran lot melebihi batas aman. Turunkan lot ke ukuran standar untuk mencegah drawdown fatal.`);
    }
    if (badEmotionTrades.length > 0) {
      whatToImprove.push(`🚨 Terdeteksi emosi ${badEmotionTrades.map(t => t.emotions.join(', ')).slice(0, 2).join(' & ')}. Buat jeda istirahat minimal 30 menit setelah terkena Stop Loss.`);
    }
    if (winRate < 45 && totalTrades >= 3) {
      whatToImprove.push('📉 Win rate di bawah 45%. Evaluasi kembali filter konfirmasi sinyal dan jangan terburu-buru entry di area sideways.');
    }
    if (noSlTrades.length > 0) {
      whatToImprove.push(`❌ ${noSlTrades.length} trade dieksekusi tanpa Stop Loss! Pasang SL langsung saat order dibuka.`);
    }
    if (whatToImprove.length === 0) {
      whatToImprove.push('Pertajam rasio Risk-to-Reward (RR) dengan membiarkan posisi profit running menyentuh area Take Profit utama.');
    }
  }

  // Tactical Lot Advisory
  const ladder = generateLotMilestoneLadder(currentEquity, settings, settings.defaultPair || 'XAUUSD');
  const lotCalc = calculateRecommendedLot(currentEquity, settings, settings.defaultPair || 'XAUUSD');
  
  let action: DailyCoachingReport['lotAdvisory']['action'] = 'MAINTAIN';
  let advisoryMsg = `Gunakan lot rekomendasi ${lotCalc.recommendedLot} lot untuk sesi trading hari ini.`;

  if (ladder.currentTier.stepType === 'STEP_UP') {
    action = 'STEP_UP';
    advisoryMsg = `🚀 Modal telah mencapai milestone baru ($${ladder.currentTier.minEquity}). Naikkan lot ke ${ladder.currentTier.recommendedLot} lot secara terukur.`;
  } else if (ladder.currentTier.stepType === 'STEP_DOWN' || currentEquity < settings.initialCapital * 0.9) {
    action = 'STEP_DOWN';
    advisoryMsg = `⚠️ Terjadi drawdown. Amankan modal dengan menurunkan lot ke ${Math.max(0.01, Number((lotCalc.recommendedLot * 0.7).toFixed(2)))} lot hingga performa pulih.`;
  }

  return {
    id: `coaching-${dateKey}-${generateId()}`,
    date: dateKey,
    generatedAt: new Date().toISOString(),
    totalTrades,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: Number(winRate.toFixed(1)),
    netPnl: Number(netPnl.toFixed(2)),
    disciplineScore,
    whatToMaintain,
    whatToImprove,
    lotAdvisory: {
      recommendedLotToday: lotCalc.recommendedLot,
      action,
      message: advisoryMsg,
    },
    status: 'PENDING_READ',
  };
}

/**
 * Checks if a 5:00 AM daily analysis is due
 */
export function isFiveAmAnalysisDue(lastAnalysisDate?: string): boolean {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // If already ran today, not due
  if (lastAnalysisDate === todayStr) {
    return false;
  }

  // Due if current local time is 5:00 AM or later
  return now.getHours() >= 5;
}
