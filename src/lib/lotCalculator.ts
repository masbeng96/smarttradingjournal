import { PlanSettings, LotMilestoneTier } from '../types/journal';

export interface PairConfig {
  pair: string;
  name: string;
  pipSize: number;           // Pip value decimal point
  pipValuePerLotUsd: number; // Value in USD per 1 standard lot per 1 pip
  defaultSlPips: number;
}

export const SUPPORTED_PAIRS: PairConfig[] = [
  { pair: 'XAUUSD', name: 'Gold / US Dollar', pipSize: 0.1, pipValuePerLotUsd: 10, defaultSlPips: 30 },
  { pair: 'EURUSD', name: 'Euro / US Dollar', pipSize: 0.0001, pipValuePerLotUsd: 10, defaultSlPips: 20 },
  { pair: 'GBPUSD', name: 'British Pound / USD', pipSize: 0.0001, pipValuePerLotUsd: 10, defaultSlPips: 25 },
  { pair: 'USDJPY', name: 'US Dollar / Yen', pipSize: 0.01, pipValuePerLotUsd: 6.7, defaultSlPips: 25 },
  { pair: 'BTCUSD', name: 'Bitcoin / USD', pipSize: 1.0, pipValuePerLotUsd: 1, defaultSlPips: 500 },
  { pair: 'US30', name: 'Dow Jones Index', pipSize: 1.0, pipValuePerLotUsd: 1, defaultSlPips: 60 },
  { pair: 'NAS100', name: 'Nasdaq 100 Index', pipSize: 1.0, pipValuePerLotUsd: 1, defaultSlPips: 50 },
];

export function getPairConfig(pairName: string): PairConfig {
  const found = SUPPORTED_PAIRS.find(p => p.pair.toUpperCase() === pairName.toUpperCase());
  if (found) return found;
  // Default generic forex/metal pair
  return { pair: pairName.toUpperCase(), name: pairName, pipSize: 0.0001, pipValuePerLotUsd: 10, defaultSlPips: 25 };
}

/**
 * Calculates the exact recommended lot size for a trade based on current equity,
 * configured risk percentage, and stop loss distance.
 */
export function calculateRecommendedLot(
  currentEquity: number,
  settings: PlanSettings,
  pair: string,
  entryPrice?: number,
  stopLossPrice?: number,
  customSlPips?: number
): {
  recommendedLot: number;
  maxSafeLot: number;
  riskAmount: number;
  slPips: number;
  riskPercentUsed: number;
} {
  const pairConf = getPairConfig(pair);
  const riskAmount = currentEquity * (settings.riskPerTradePercent / 100);

  let slPips = customSlPips || pairConf.defaultSlPips;

  if (entryPrice && stopLossPrice && entryPrice > 0 && stopLossPrice > 0) {
    const priceDiff = Math.abs(entryPrice - stopLossPrice);
    slPips = priceDiff / pairConf.pipSize;
    if (slPips <= 0) slPips = pairConf.defaultSlPips;
  }

  // Formula: Lot = Risk Amount / (SL Pips * Pip Value per Lot)
  const exactLot = riskAmount / (slPips * pairConf.pipValuePerLotUsd);
  
  // Format to standard 2 decimal places (min 0.01 lot)
  const recommendedLot = Math.max(0.01, Number(exactLot.toFixed(2)));
  const maxSafeLot = Number((recommendedLot * 1.3).toFixed(2)); // +30% safety margin threshold

  return {
    recommendedLot,
    maxSafeLot,
    riskAmount: Number(riskAmount.toFixed(2)),
    slPips: Number(slPips.toFixed(1)),
    riskPercentUsed: settings.riskPerTradePercent,
  };
}

/**
 * Generates dynamic Lot Compounding & Stepping Milestones Ladder
 * Shows exact equity targets where lot increases (Step-Up) or decreases (Step-Down)
 */
export function generateLotMilestoneLadder(
  currentEquity: number,
  settings: PlanSettings,
  pair: string = 'XAUUSD'
): {
  currentTier: LotMilestoneTier;
  tiers: LotMilestoneTier[];
  nextStepUpTarget: number;
  stepDownWarningTarget: number;
} {
  const pairConf = getPairConfig(pair);
  const baseEquity = settings.initialCapital;
  const multiplier = settings.stepUpEquityMultiplier || 1.25; // 25% equity step
  const tiers: LotMilestoneTier[] = [];

  // Generate 8 compound tiers
  let tierMin = baseEquity * 0.75; // Sub-tier for drawdown
  
  for (let i = 1; i <= 8; i++) {
    const tierMax = tierMin * multiplier;
    const tierMidEquity = (tierMin + tierMax) / 2;
    const riskAmt = tierMidEquity * (settings.riskPerTradePercent / 100);
    const calculatedLot = Math.max(0.01, Number((riskAmt / (pairConf.defaultSlPips * pairConf.pipValuePerLotUsd)).toFixed(2)));

    let stepType: LotMilestoneTier['stepType'] = 'FUTURE';

    if (currentEquity >= tierMin && currentEquity < tierMax) {
      stepType = 'CURRENT';
    } else if (currentEquity < tierMin && i === 1) {
      stepType = 'STEP_DOWN';
    }

    tiers.push({
      tierLevel: i,
      minEquity: Math.round(tierMin),
      maxEquity: Math.round(tierMax),
      recommendedLot: calculatedLot,
      riskAmount: Math.round(riskAmt),
      stepType,
    });

    tierMin = tierMax;
  }

  // Find current active tier
  let currentTier = tiers.find(t => currentEquity >= t.minEquity && currentEquity < t.maxEquity);
  if (!currentTier) {
    if (currentEquity < tiers[0].minEquity) {
      currentTier = tiers[0];
      currentTier.stepType = 'STEP_DOWN';
    } else {
      currentTier = tiers[tiers.length - 1];
      currentTier.stepType = 'CURRENT';
    }
  } else {
    currentTier.stepType = 'CURRENT';
  }

  const nextStepUpTarget = currentTier.maxEquity;
  const stepDownWarningTarget = currentTier.minEquity;

  return {
    currentTier,
    tiers,
    nextStepUpTarget,
    stepDownWarningTarget,
  };
}
