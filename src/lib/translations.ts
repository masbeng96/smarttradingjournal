export const TRANSLATIONS = {
  id: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.journal': 'Jurnal',
    'nav.planner': 'Planner',
    'nav.risk': 'Risk & Lot',
    'nav.coaching': 'Evaluasi',
    
    // Top Header
    'header.greeting.morning': 'Selamat pagi,',
    'header.greeting.afternoon': 'Selamat siang,',
    'header.greeting.evening': 'Selamat malam,',
    'header.update': 'Perbarui',
    
    // Dashboard
    'dash.totalBalance': 'Total Balance',
    'dash.hideBalance': 'Sembunyikan Saldo',
    'dash.showBalance': 'Tampilkan Saldo',
    'dash.thisMonth': 'bulan ini',
    'dash.syncing': 'Sinkron...',
    'dash.balance': 'Balance',
    'dash.floating': 'Floating',
    'dash.margin': 'Margin',
    'dash.realized': 'Realized',
    'dash.winRate': 'Win Rate',
    'dash.trades': 'Trades',
    'dash.growth': 'Pertumbuhan',
    'dash.fromInitial': 'Dari Modal Awal',
    'dash.dailyTarget': 'Target Harian',
    'dash.month': 'Bln',
    'dash.profitFactor': 'Profit Factor',
    'dash.equityCurve': 'Kurva Pertumbuhan Akun',
    'dash.initialCapital': 'Modal Awal',
    'dash.closedTrades': 'Closed Trades',
    'dash.fullEvaluation': 'Buka Evaluasi Lengkap',
  },
  en: {
    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.journal': 'Journal',
    'nav.planner': 'Planner',
    'nav.risk': 'Risk & Lot',
    'nav.coaching': 'Evaluation',
    
    // Top Header
    'header.greeting.morning': 'Good morning,',
    'header.greeting.afternoon': 'Good afternoon,',
    'header.greeting.evening': 'Good evening,',
    'header.update': 'Update',
    
    // Dashboard
    'dash.totalBalance': 'Total Balance',
    'dash.hideBalance': 'Hide Balance',
    'dash.showBalance': 'Show Balance',
    'dash.thisMonth': 'this month',
    'dash.syncing': 'Syncing...',
    'dash.balance': 'Balance',
    'dash.floating': 'Floating',
    'dash.margin': 'Margin',
    'dash.realized': 'Realized',
    'dash.winRate': 'Win Rate',
    'dash.trades': 'Trades',
    'dash.growth': 'Account Growth',
    'dash.fromInitial': 'From Initial Capital',
    'dash.dailyTarget': 'Daily Target',
    'dash.month': 'Mo',
    'dash.profitFactor': 'Profit Factor',
    'dash.equityCurve': 'Equity Growth Curve',
    'dash.initialCapital': 'Initial Capital',
    'dash.closedTrades': 'Closed Trades',
    'dash.fullEvaluation': 'Open Full Evaluation',
  },
  ms: {
    // Nav
    'nav.dashboard': 'Papan Pemuka',
    'nav.journal': 'Jurnal',
    'nav.planner': 'Perancang',
    'nav.risk': 'Risiko & Lot',
    'nav.coaching': 'Penilaian',
    
    // Top Header
    'header.greeting.morning': 'Selamat pagi,',
    'header.greeting.afternoon': 'Selamat petang,',
    'header.greeting.evening': 'Selamat malam,',
    'header.update': 'Kemas kini',
    
    // Dashboard
    'dash.totalBalance': 'Jumlah Baki',
    'dash.hideBalance': 'Sembunyikan Baki',
    'dash.showBalance': 'Tunjukkan Baki',
    'dash.thisMonth': 'bulan ini',
    'dash.syncing': 'Menyelaras...',
    'dash.balance': 'Baki',
    'dash.floating': 'Terapung',
    'dash.margin': 'Margin',
    'dash.realized': 'Direalisasi',
    'dash.winRate': 'Kadar Menang',
    'dash.trades': 'Dagangan',
    'dash.growth': 'Pertumbuhan',
    'dash.fromInitial': 'Dari Modal Asal',
    'dash.dailyTarget': 'Sasaran Harian',
    'dash.month': 'Bln',
    'dash.profitFactor': 'Faktor Keuntungan',
    'dash.equityCurve': 'Keluk Pertumbuhan Ekuiti',
    'dash.initialCapital': 'Modal Asal',
    'dash.closedTrades': 'Dagangan Ditutup',
    'dash.fullEvaluation': 'Buka Penilaian Penuh',
  }
};

export type Language = 'id' | 'en' | 'ms';

export function getTranslation(lang: Language | undefined, key: keyof typeof TRANSLATIONS.id): string {
  const currentLang = lang || 'id';
  return TRANSLATIONS[currentLang][key] || TRANSLATIONS['id'][key] || key;
}
