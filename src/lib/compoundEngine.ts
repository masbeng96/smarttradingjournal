import { PlanSettings, CompoundMonthPlan } from '../types/journal';

/**
 * Calculates standard compound growth projections incorporating monthly recurring deposits
 * and monthly compounding target returns matching standard financial compound interest models
 * (e.g., The Calculator Site: Interest calculated on monthly starting balance + deposit at end of month).
 */
export function calculateCompoundProjections(settings: PlanSettings): {
  monthlyPlans: CompoundMonthPlan[];
  initialBalance: number;
  additionalDeposits: number;
  totalDeposited: number;
  totalProfitGenerated: number;
  finalEquity: number;
  totalGrowthMultiplier: number;
  yearlyCompoundedRate: number;
  timeWeightedReturn: number;
} {
  const months = settings.projectionMonths || 12;
  const targetPercent = settings.monthlyTargetPercent / 100;
  const depositAmount = settings.depositEnabled ? settings.monthlyDeposit : 0;
  const depositDay = settings.monthlyDepositDay || 25;
  const tradingDays = settings.tradingDaysPerMonth || 22;

  const initialBalance = settings.initialCapital;
  let currentBalance = initialBalance;
  let cumulativeDeposits = initialBalance;
  let totalAccruedInterest = 0;
  const monthlyPlans: CompoundMonthPlan[] = [];

  const now = new Date();

  // Add Month 0 baseline row (Starting state)
  monthlyPlans.push({
    monthIndex: 0,
    monthLabel: 'Bulan 0 (Modal Awal)',
    startingBalance: initialBalance,
    monthlyDeposit: initialBalance,
    cumulativeDeposits: initialBalance,
    depositDate: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    targetProfitAmount: 0,
    accruedInterest: 0,
    endingBalance: initialBalance,
    recommendedLot: calculateMonthLot(initialBalance, settings),
    dailyProfitTarget: 0,
  });

  for (let i = 1; i <= months; i++) {
    const startBal = currentBalance;
    
    // 1. Interest generated this month on beginning balance
    const interestAmount = startBal * targetPercent;
    totalAccruedInterest += interestAmount;

    // 2. Additional monthly contribution
    const thisMonthDeposit = depositAmount;
    cumulativeDeposits += thisMonthDeposit;

    // 3. Ending balance = start + interest + monthly deposit
    const endBal = startBal + interestAmount + thisMonthDeposit;

    // Daily target for ~22 trading days
    const dailyTarget = interestAmount / tradingDays;

    // Recommended lot for this equity
    const projectedLot = calculateMonthLot(startBal, settings);

    // Target date for monthly deposit
    const futureDate = new Date(now.getFullYear(), now.getMonth() + (i - 1), depositDay);
    const dateFormatted = futureDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const monthLabel = `Bulan ${i} (${futureDate.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})`;

    monthlyPlans.push({
      monthIndex: i,
      monthLabel,
      startingBalance: Math.round(startBal * 100) / 100,
      monthlyDeposit: thisMonthDeposit,
      cumulativeDeposits: Math.round(cumulativeDeposits * 100) / 100,
      depositDate: dateFormatted,
      targetProfitAmount: Math.round(interestAmount * 100) / 100,
      accruedInterest: Math.round(totalAccruedInterest * 100) / 100,
      endingBalance: Math.round(endBal * 100) / 100,
      recommendedLot: projectedLot,
      dailyProfitTarget: Math.round(dailyTarget * 100) / 100,
    });

    currentBalance = endBal;
  }

  const finalEquity = Math.round(currentBalance * 100) / 100;
  const additionalDeposits = Math.round((cumulativeDeposits - initialBalance) * 100) / 100;
  const totalDeposited = Math.round(cumulativeDeposits * 100) / 100;
  const totalProfitGenerated = Math.round((finalEquity - totalDeposited) * 100) / 100;
  const totalGrowthMultiplier = totalDeposited > 0 ? Number((finalEquity / totalDeposited).toFixed(2)) : 0;

  // Annualized rate: (1 + r)^12 - 1
  const yearlyCompoundedRate = Number((((1 + targetPercent) ** 12 - 1) * 100).toFixed(2));
  // Time-weighted return over the chosen horizon: (1 + r)^n - 1
  const timeWeightedReturn = Number((((1 + targetPercent) ** months - 1) * 100).toFixed(2));

  return {
    monthlyPlans,
    initialBalance,
    additionalDeposits,
    totalDeposited,
    totalProfitGenerated,
    finalEquity,
    totalGrowthMultiplier,
    yearlyCompoundedRate,
    timeWeightedReturn,
  };
}

function calculateMonthLot(balance: number, settings: PlanSettings): number {
  const riskAmount = balance * (settings.riskPerTradePercent / 100);
  const slPips = settings.avgStopLossPips || 25;
  const pipValuePerStandardLot = 10;
  return Math.max(0.01, Number(((riskAmount) / (slPips * pipValuePerStandardLot)).toFixed(2)));
}
