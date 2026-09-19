export type Currency = 'USD' | 'IDR';

export type TradeDirection = 'BUY' | 'SELL';

export type TradeOutcome = 'WIN' | 'LOSS' | 'BE' | 'OPEN';

export type EmotionTag = 
  | 'Disciplined' 
  | 'FOMO' 
  | 'Revenge Trade' 
  | 'Greedy' 
  | 'Hesitant' 
  | 'Followed Strategy' 
  | 'Early Exit' 
  | 'Overtrading';

export interface PlanSettings {
  initialCapital: number;            // Modal Awal (e.g. 1000 USD / 15.000.000 IDR)
  currency: Currency;                // USD or IDR
  exchangeRateUsdIdr: number;        // e.g. 15500
  
  // Recurring Monthly Deposit
  monthlyDeposit: number;            // Deposit nominal per month (e.g. 200 USD)
  monthlyDepositDay: number;         // Tanggal deposit bulanan (1-28)
  depositEnabled: boolean;           // Active or inactive

  // Growth & Profit Target
  monthlyTargetPercent: number;      // Target Profit Bulanan (e.g. 10%)
  tradingDaysPerMonth: number;       // Default 22 trading days
  projectionMonths: number;          // Projection horizon (e.g. 12 or 24 months)

  // Risk Management
  riskPerTradePercent: number;       // Risk % per trade (e.g. 1.0%)
  maxDailyLossPercent: number;       // Max Daily Loss % (e.g. 3.0%)
  targetRRR: number;                 // Target Risk to Reward (e.g. 2.0 = 1:2)
  avgStopLossPips: number;           // Default SL in pips (e.g. 25 pips)
  defaultPair: string;               // e.g. 'XAUUSD'
  
  // Lot Compounding Milestones
  autoLotCompounding: boolean;       // Auto scale lot as equity grows
  stepUpEquityMultiplier: number;    // e.g. 1.2 (every 20% equity increase -> step up)
  stepDownDrawdownThreshold: number; // e.g. 5% drawdown -> step down lot
}

export interface TradeEntry {
  id: string;
  date: string;                      // ISO string or YYYY-MM-DD HH:mm
  pair: string;                      // e.g. XAUUSD, EURUSD, GBPUSD, BTCUSD, US30
  direction: TradeDirection;
  lotSize: number;                   // Volume Lot used
  recommendedLotSize: number;        // Lot calculated by system at entry
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  closePrice?: number;
  pnl: number;                       // Net Profit/Loss in Account Currency
  pipsPnl?: number;                  // Pips gained/lost
  outcome: TradeOutcome;
  emotions: EmotionTag[];
  strategy: string;                  // e.g. 'SMC / Order Block', 'Breakout & Retest', 'Supply & Demand', 'Trend Following'
  notes: string;
  screenshotUrl?: string;            // Chart screenshot / image preview
  createdAt: number;
  isCompliantWithRisk: boolean;      // Did this trade respect max lot & risk limits?
}

export interface CompoundMonthPlan {
  monthIndex: number;                // 0, 1, 2, 3 ...
  monthLabel: string;                // e.g. 'Bulan 1 - Okt 2026'
  startingBalance: number;
  monthlyDeposit: number;
  cumulativeDeposits: number;        // Total deposits to date
  depositDate: string;
  targetProfitAmount: number;        // Interest/profit this month
  accruedInterest: number;           // Total accrued interest to date
  endingBalance: number;
  recommendedLot: number;
  dailyProfitTarget: number;
}

export interface LotMilestoneTier {
  tierLevel: number;
  minEquity: number;
  maxEquity: number;
  recommendedLot: number;
  riskAmount: number;
  stepType: 'CURRENT' | 'STEP_UP' | 'STEP_DOWN' | 'FUTURE';
}

export interface DailyCoachingReport {
  id: string;
  date: string;                      // YYYY-MM-DD
  generatedAt: string;               // 05:00:00 AM ISO
  totalTrades: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netPnl: number;
  disciplineScore: number;           // 0 - 100%
  
  // Core AI / Analysis Feedback
  whatToMaintain: string[];          // Apa yang harus dipertahankan
  whatToImprove: string[];           // Apa yang harus diimprove
  
  // Tactical Lot & Risk Directive
  lotAdvisory: {
    recommendedLotToday: number;
    action: 'MAINTAIN' | 'STEP_UP' | 'STEP_DOWN' | 'HOLD_TRADING';
    message: string;
  };
  
  status: 'PENDING_READ' | 'READ';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'ANALYSIS_5AM' | 'STEP_UP' | 'STEP_DOWN' | 'RISK_WARNING' | 'TARGET_REACHED' | 'UPDATE_AVAILABLE';
  read: boolean;
  data?: any;
}

export interface FirebaseConfigState {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  useCloudFirestore: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  broker?: string;
  accountType?: 'LIVE' | 'DEMO' | 'PROP_FIRM';
  tier?: 'PRO' | 'ELITE' | 'FREE';
  joinedDate?: string;
}

export interface MT5AccountData {
  akun: string;
  balance: number;
  equity: number;
  margin: number;
  floating_pnl: number;
  lastUpdated?: string;
  isConnected?: boolean;
  error?: string;
}

export interface AppVersionInfo {
  version: string;
  versionCode: number;
  releaseDate: string;
  title: string;
  changelog: string[];
  downloadUrl: string;
  mandatory: boolean;
}

export type NewsImpact = 'High' | 'Medium' | 'Low' | 'Holiday' | 'Non-Economic';

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;              // e.g. "USD", "EUR", "GBP", "JPY", "All"
  date: string;                 // ISO 8601 string from Forex Factory, e.g. "2026-09-18T19:30:00-04:00"
  timestamp: number;            // Unix millisecond timestamp in local time
  timeWib: string;              // Formatted local time e.g. "19:30 WIB"
  dateFormatted: string;        // Formatted date e.g. "Jumat, 18 Sep 2026"
  dateKey: string;              // YYYY-MM-DD
  impact: NewsImpact;
  forecast: string;
  previous: string;
  actual?: string;
  isHighImpact: boolean;
  isToday: boolean;
  isPast: boolean;
  detailUrl?: string;
}

export interface EconomicCalendarState {
  events: EconomicEvent[];
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
}
