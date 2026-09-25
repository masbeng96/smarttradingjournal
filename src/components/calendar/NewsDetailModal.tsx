import React from 'react';
import { EconomicEvent, NewsImpact } from '../../types/journal';
import { COUNTRY_FLAGS, getEventCountdownText } from '../../lib/economicCalendarService';
import { 
  X, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Bell, 
  BellRing, 
  ExternalLink, 
  Layers, 
  Sparkles,
  Info,
  Activity,
  History,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsDetailModalProps {
  event: EconomicEvent | null;
  onClose: () => void;
  hasAlarm?: boolean;
  onToggleAlarm?: (event: EconomicEvent) => void;
  allEvents?: EconomicEvent[];
}

// Currency to Country Name map
const CURRENCY_COUNTRY_MAP: Record<string, string> = {
  USD: 'United States (Dolar AS)',
  EUR: 'Zona Euro (European Union)',
  GBP: 'Britania Raya (Poundsterling)',
  JPY: 'Jepang (Japanese Yen)',
  AUD: 'Australia (Australian Dollar)',
  CAD: 'Kanada (Canadian Dollar)',
  CHF: 'Swiss (Swiss Franc)',
  NZD: 'Selandia Baru (NZ Dollar)',
  CNY: 'Tiongkok (Chinese Yuan)',
  ALL: 'Global / Multi-Region',
};

// Impacted Pairs Map
const IMPACTED_PAIRS: Record<string, { primary: string[]; secondary: string[]; indices: string[] }> = {
  USD: {
    primary: ['XAUUSD (Gold)', 'EURUSD', 'GBPUSD', 'USDJPY'],
    secondary: ['USDCAD', 'USDCHF', 'AUDUSD', 'NZDUSD'],
    indices: ['US30 (Dow Jones)', 'NAS100 (Nasdaq)', 'BTCUSD'],
  },
  EUR: {
    primary: ['EURUSD', 'EURGBP', 'EURJPY'],
    secondary: ['EURAUD', 'EURCAD', 'EURCHF', 'EURNZD'],
    indices: ['GER40 (DAX)', 'EU50'],
  },
  GBP: {
    primary: ['GBPUSD', 'EURGBP', 'GBPJPY'],
    secondary: ['GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD'],
    indices: ['UK100 (FTSE)'],
  },
  JPY: {
    primary: ['USDJPY', 'EURJPY', 'GBPJPY'],
    secondary: ['AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY'],
    indices: ['JP225 (Nikkei)'],
  },
  AUD: {
    primary: ['AUDUSD', 'AUDJPY', 'EURAUD'],
    secondary: ['GBPAUD', 'AUDCAD', 'AUDNZD', 'AUDCHF'],
    indices: ['AUS200'],
  },
  CAD: {
    primary: ['USDCAD', 'CADJPY', 'EURCAD'],
    secondary: ['GBPCAD', 'AUDCAD', 'NZDCAD', 'CADCHF'],
    indices: ['OIL (WTI Crude)'],
  },
  CHF: {
    primary: ['USDCHF', 'EURCHF', 'GBPCHF'],
    secondary: ['CHFJPY', 'AUDCHF', 'CADCHF', 'NZDCHF'],
    indices: ['SMI20'],
  },
  NZD: {
    primary: ['NZDUSD', 'NZDJPY', 'EURNZD'],
    secondary: ['GBPNZD', 'AUDNZD', 'NZDCAD', 'NZDCHF'],
    indices: ['NZ50'],
  },
  CNY: {
    primary: ['AUDUSD', 'USDCNH', 'XAUUSD'],
    secondary: ['NZDUSD', 'CADJPY'],
    indices: ['A50 (China 50)', 'HK50 (Hang Seng)'],
  },
};

/**
 * Generates an in-depth analysis and description of the economic event
 */
function getEventAnalysis(title: string, country: string, impact: NewsImpact) {
  const lower = title.toLowerCase();

  // NFP / Employment
  if (lower.includes('non-farm') || lower.includes('nfp') || lower.includes('employment change') || lower.includes('payrolls')) {
    return {
      category: 'Ketenagakerjaan & Pasar Tenaga Kerja',
      definition: 'Mengukur perubahan jumlah tenaga kerja berbayar di luar sektor pertanian. Merupakan salah satu indikator fundamental paling berpengaruh dalam kebijakan suku bunga bank sentral.',
      marketImpact: 'Aktual > Forecast: Bullish untuk ' + country + ' (Penguatan mata uang), Bearish untuk Gold/XAUUSD dan pair lawan. Aktual < Forecast: Bearish untuk ' + country + ' (Pelemahan mata uang).',
      volatility: 'Sangat Tinggi (Puncak lonjakan pip & pelebaran spread instan 5-15 menit pertama).',
      tradingTip: 'Disarankan pasang SL ketat atau hindari entry 5 menit menjelang rilis untuk menghindari slippage.'
    };
  }

  // CPI / Inflation
  if (lower.includes('cpi') || lower.includes('inflation') || lower.includes('consumer price')) {
    return {
      category: 'Inflasi & Indeks Harga Konsumen',
      definition: 'Mengukur laju perubahan harga barang dan jasa dari kacamata konsumen. Indikator utama penentu target inflasi bank sentral.',
      marketImpact: 'Aktual > Forecast: Bullish untuk ' + country + ' (Tekanan inflasi memicu ekspektasi kenaikan atau penundaan penurunan suku bunga). Aktual < Forecast: Bearish untuk ' + country + '.',
      volatility: 'Tinggi hingga Sangat Tinggi.',
      tradingTip: 'Perhatikan apakah data Core CPI (inti) searah dengan Headline CPI untuk konfirmasi tren lanjutan.'
    };
  }

  // Interest Rate / Monetary Policy
  if (lower.includes('rate') || lower.includes('fomc') || lower.includes('monetary policy') || lower.includes('statement') || lower.includes('snb') || lower.includes('boe') || lower.includes('ecb') || lower.includes('rba') || lower.includes('boj')) {
    return {
      category: 'Kebijakan Moneter & Suku Bunga Bank Sentral',
      definition: 'Keputusan tingkat suku bunga acuan dan pernyataan kebijakan moneter oleh Dewan Gubernur Bank Sentral.',
      marketImpact: 'Kenaikan suku bunga (Hawkish) = Sangat Bullish untuk ' + country + '. Penurunan suku bunga (Dovish) = Sangat Bearish untuk ' + country + '.',
      volatility: 'Maksimal / Ekstrem (Mempengaruhi arah tren jangka menengah hingga panjang).',
      tradingTip: 'Fokus pada nada konferensi pers (Press Conference) setelah rilis suku bunga untuk petunjuk proyeksi masa depan.'
    };
  }

  // Unemployment Rate / Claims
  if (lower.includes('unemployment') || lower.includes('claims') || lower.includes('jobless')) {
    return {
      category: 'Klaim Pengangguran & Tingkat Pengangguran',
      definition: 'Mengukur rasio atau jumlah angkatan kerja yang tidak memiliki pekerjaan dan secara aktif mencari kerja.',
      marketImpact: 'Aktual < Forecast: Bullish untuk ' + country + ' (Tingkat pengangguran rendah menandakan ekonomi sehat). Aktual > Forecast: Bearish untuk ' + country + '.',
      volatility: 'Sedang hingga Tinggi.',
      tradingTip: 'Jika rilis bersamaan dengan data upah (Hourly Earnings), data upah seringkali lebih dominan menggerakkan pasar.'
    };
  }

  // GDP
  if (lower.includes('gdp') || lower.includes('gross domestic')) {
    return {
      category: 'Pertumbuhan Produk Domestik Bruto (PDB)',
      definition: 'Nilai total barang dan jasa yang diproduksi oleh suatu negara dalam periode tertentu, mencerminkan laju ekspansi ekonomi.',
      marketImpact: 'Aktual > Forecast: Bullish untuk ' + country + ' (Pertumbuhan ekonomi kuat). Aktual < Forecast: Bearish untuk ' + country + '.',
      volatility: 'Tinggi.',
      tradingTip: 'Rilis PDB Kuartalan (Advance GDP) memiliki dampak volatilitas paling besar dibanding data revisi.'
    };
  }

  // PMI
  if (lower.includes('pmi') || lower.includes('manufacturing') || lower.includes('services')) {
    return {
      category: 'Indeks Manajer Pembelian (PMI)',
      definition: 'Survei bulanan kepada para manajer pembelian industri manufaktur atau jasa. Angka di atas 50 menunjukkan ekspansi, di bawah 50 menunjukkan kontraksi.',
      marketImpact: 'Aktual > Forecast (dan > 50): Bullish untuk ' + country + '. Aktual < Forecast (atau < 50): Bearish untuk ' + country + '.',
      volatility: 'Sedang hingga Tinggi.',
      tradingTip: 'Bandingkan dengan level psikologis 50.0 untuk menilai apakah sektor sedang berekspansi.'
    };
  }

  // Retail Sales
  if (lower.includes('retail') || lower.includes('sales')) {
    return {
      category: 'Penjualan Ritel & Konsumsi',
      definition: 'Mengukur nilai agregat penjualan barang konsumen di toko ritel, indikator utama daya beli masyarakat.',
      marketImpact: 'Aktual > Forecast: Bullish untuk ' + country + '. Aktual < Forecast: Bearish untuk ' + country + '.',
      volatility: 'Sedang hingga Tinggi.',
      tradingTip: 'Konsumsi menyumbang lebih dari 60% PDB ekonomi modern sehingga data ini sangat diperhatikan institusi.'
    };
  }

  // Crude Oil
  if (lower.includes('crude') || lower.includes('oil') || lower.includes('inventories') || lower.includes('natural gas')) {
    return {
      category: 'Cadangan Energi & Komoditas',
      definition: 'Mengukur perubahan jumlah cadangan komoditas energi komersial yang tersimpan.',
      marketImpact: 'Inventori Turun (Aktual < Forecast) = Bullish untuk Harga Minyak & CAD. Inventori Naik = Bearish untuk Harga Minyak.',
      volatility: 'Tinggi pada instrumen Minyak (WTI/Brent) dan Pair CAD (USDCAD, CADJPY).',
      tradingTip: 'Korelasi kuat dengan pasangan USDCAD (Minyak naik -> USDCAD cenderung turun).'
    };
  }

  // Default Fallback
  return {
    category: impact === 'High' ? 'Rilis Data Ekonomi Utama' : impact === 'Medium' ? 'Indikator Ekonomi Menengah' : 'Data Makro Ekonomi',
    definition: `Data statistik ekonomi berkala untuk kawasan ${country} (${CURRENCY_COUNTRY_MAP[country] || country}).`,
    marketImpact: `Aktual > Forecast: Cenderung positif/bullish untuk mata uang ${country}. Aktual < Forecast: Cenderung negatif/bearish untuk mata uang ${country}.`,
    volatility: impact === 'High' ? 'Tinggi' : impact === 'Medium' ? 'Sedang' : 'Rendah',
    tradingTip: 'Gunakan konfirmasi teknikal pada timeframe M15 / H1 sebelum mengambil posisi setelah rilis.'
  };
}

export const NewsDetailModal: React.FC<NewsDetailModalProps> = ({
  event,
  onClose,
  hasAlarm = false,
  onToggleAlarm,
  allEvents = [],
}) => {
  if (!event) return null;

  const flag = COUNTRY_FLAGS[event.country] || '🌐';
  const countryFullName = CURRENCY_COUNTRY_MAP[event.country] || event.country;
  const countdown = getEventCountdownText(event.timestamp);
  const analysis = getEventAnalysis(event.title, event.country, event.impact);
  const pairInfo = IMPACTED_PAIRS[event.country] || IMPACTED_PAIRS.USD;

  // Find other events related to the same country / similar title in current feed
  const relatedHistory = allEvents.filter(
    (e) => e.id !== event.id && e.country === event.country && (e.title.toLowerCase().includes(event.title.toLowerCase().slice(0, 8)) || e.isHighImpact)
  ).slice(0, 3);

  // Determine outcome status if actual is present
  const hasActual = Boolean(event.actual && event.actual.trim() !== '' && event.actual !== '-');
  const isActualBetter = hasActual && event.forecast && event.forecast !== '-' && !isNaN(parseFloat(event.actual!)) && !isNaN(parseFloat(event.forecast))
    ? parseFloat(event.actual!) > parseFloat(event.forecast)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-[#E5E5E2] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 p-5 relative"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E2]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] flex items-center justify-center text-2xl shadow-xs shrink-0">
              <span>{flag}</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono-num font-black text-sm text-[#0F0F0F]">{event.country}</span>
                <span className="text-[11px] text-[#737373] font-medium">• {countryFullName}</span>
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                  event.impact === 'High'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : event.impact === 'Medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}>
                  {event.impact === 'High' ? '🔴 HIGH IMPACT' : event.impact === 'Medium' ? '🟠 MEDIUM IMPACT' : '🟡 LOW IMPACT'}
                </span>
                <span className="text-[10px] text-[#737373] font-mono-num bg-[#F7F7F5] px-2 py-0.5 rounded-md border border-[#E5E5E2]">
                  {countdown}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#F7F7F5] hover:bg-[#EAEAE7] text-[#737373] hover:text-[#0F0F0F] transition-all"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* News Event Title & Category */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 inline-block">
            {analysis.category}
          </span>
          <h2 className="text-base font-black text-[#0F0F0F] leading-snug">
            {event.title}
          </h2>
          <div className="flex items-center space-x-2 text-xs text-[#737373] pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-[#0F0F0F]" />
            <span>{event.dateFormatted}</span>
            <span>•</span>
            <Clock className="w-3.5 h-3.5 text-[#0F0F0F]" />
            <span className="font-mono-num font-bold text-[#0F0F0F]">{event.timeWib}</span>
          </div>
        </div>

        {/* 1. KEY METRICS COMPARISON (Actual, Forecast, Previous) */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Actual */}
          <div className={`p-3 rounded-2xl border text-center ${
            hasActual
              ? isActualBetter === true
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                : isActualBetter === false
                  ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                  : 'bg-neutral-50 border-neutral-200 text-[#0F0F0F]'
              : 'bg-[#FAF9F6] border-[#E5E5E2] text-[#737373]'
          }`}>
            <span className="text-[10px] uppercase font-extrabold block text-[#737373] mb-1">
              Actual (Rilis)
            </span>
            <span className={`text-base font-black font-mono-num ${
              hasActual
                ? isActualBetter === true ? 'text-emerald-700' : isActualBetter === false ? 'text-rose-700' : 'text-[#0F0F0F]'
                : 'text-[#A3A3A3]'
            }`}>
              {event.actual || 'Menunggu'}
            </span>
            <span className="text-[9px] block mt-0.5 font-medium text-[#737373]">
              {hasActual ? 'Sudah Dirilis' : 'Belum Rilis'}
            </span>
          </div>

          {/* Forecast */}
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E5E2] text-center">
            <span className="text-[10px] uppercase font-extrabold block text-[#737373] mb-1">
              Forecast (Ekspektasi)
            </span>
            <span className="text-base font-black font-mono-num text-[#0F0F0F]">
              {event.forecast || '-'}
            </span>
            <span className="text-[9px] block mt-0.5 font-medium text-[#737373]">
              Konsensus Analis
            </span>
          </div>

          {/* Previous */}
          <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E5E2] text-center">
            <span className="text-[10px] uppercase font-extrabold block text-[#737373] mb-1">
              Previous (Sebelumnya)
            </span>
            <span className="text-base font-black font-mono-num text-[#525252]">
              {event.previous || '-'}
            </span>
            <span className="text-[9px] block mt-0.5 font-medium text-[#737373]">
              Periode Lalu
            </span>
          </div>
        </div>

        {/* 2. HISTORY & VALUE COMPARISON CONTEXT */}
        <div className="bg-[#F7F7F5] p-3.5 rounded-2xl border border-[#E5E5E2] space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0F0F0F]">
            <History className="w-4 h-4 text-emerald-600" />
            <span>Riwayat & Perbandingan Nilai (Previous vs Forecast)</span>
          </div>
          <div className="text-xs text-[#525252] space-y-1 leading-relaxed">
            <p>
              • <strong>Nilai Periode Sebelumnya:</strong> {event.previous || 'Tidak tersedia'}
            </p>
            <p>
              • <strong>Proyeksi Konsensus Saat Ini:</strong> {event.forecast || 'Belum ada konsensus'}
            </p>
            {event.previous && event.forecast && event.previous !== '-' && event.forecast !== '-' && (
              <p className="text-[11px] text-[#737373] bg-white p-2 rounded-xl border border-[#E5E5E2]">
                💡 Pasar memperkirakan nilai data ini{' '}
                <span className="font-bold text-[#0F0F0F]">
                  {event.forecast > event.previous ? 'meningkat' : event.forecast < event.previous ? 'menurun' : 'relatif stabil'}
                </span>{' '}
                dibandingkan periode sebelumnya.
              </p>
            )}
          </div>
        </div>

        {/* 3. KETERANGAN & DAMPAK PASAR (BULLISH / BEARISH) */}
        <div className="card-light p-4 space-y-2.5 border-amber-200/80 bg-gradient-to-br from-amber-50/30 to-white">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Keterangan & Analisis Dampak Market</span>
          </div>
          
          <div className="space-y-2 text-xs text-[#262626]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#737373] block mb-0.5">Definisi Indikator:</span>
              <p className="text-xs text-[#404040] leading-relaxed">{analysis.definition}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-200/60 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center space-x-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reaksi Pasar (Arah Bullish / Bearish):</span>
              </span>
              <p className="text-xs font-medium text-[#0F0F0F] leading-relaxed">{analysis.marketImpact}</p>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-[#737373]">Tingkat Volatilitas:</span>
              <span className="font-bold text-rose-700 font-mono-num">{analysis.volatility}</span>
            </div>
          </div>
        </div>

        {/* 4. PASANGAN MATA UANG YANG TERDAMPAK (IMPACTED PAIRS) */}
        <div className="card-light p-4 space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0F0F0F]">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Pasangan Mata Uang (Pairs) yang Terdampak</span>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">Pasangan Utama (Major FX & Komoditas):</span>
              <div className="flex flex-wrap gap-1.5">
                {pairInfo.primary.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-xl bg-[#0F0F0F] text-white text-xs font-extrabold tracking-tight shadow-xs"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">Pasangan Silang (Cross Pairs):</span>
              <div className="flex flex-wrap gap-1.5">
                {pairInfo.secondary.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded-lg bg-[#F0F0ED] text-[#262626] text-[11px] font-bold border border-[#E5E5E2]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {pairInfo.indices && pairInfo.indices.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-[#737373] block mb-1">Indeks Saham & Crypto:</span>
                <div className="flex flex-wrap gap-1.5">
                  {pairInfo.indices.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center space-x-2">
          {onToggleAlarm && (
            <button
              onClick={() => onToggleAlarm(event)}
              className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                hasAlarm
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                  : 'bg-[#0F0F0F] text-white hover:bg-black shadow-md'
              }`}
            >
              {hasAlarm ? (
                <>
                  <BellRing className="w-4 h-4 text-emerald-200" />
                  <span>Alarm Aktif (Matikan)</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Set Alarm Notifikasi Android</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-2xl bg-[#F0F0ED] text-[#0F0F0F] hover:bg-[#E5E5E2] text-xs font-bold transition-all"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
