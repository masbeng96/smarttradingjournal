import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { formatCurrency } from '../../lib/utils';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Clock, 
  Calendar, 
  RotateCcw,
  Award
} from 'lucide-react';

export const DailyAnalysisView: React.FC = () => {
  const { 
    coachingReports, 
    latestReport, 
    runDailyAnalysisManual, 
    settings
  } = useJournal();

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Title & Manual Simulation Button */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-extrabold text-[#0F0F0F] flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>05:00 AM {settings.language === 'en' ? 'Daily Coaching Center' : 'Daily Coaching Center'}</span>
          </h2>
          <p className="text-xs text-[#737373]">
            {settings.language === 'en' ? 'Automated daily trading evaluation & recommendations' : settings.language === 'ms' ? 'Penilaian dagangan automatik & cadangan harian' : 'Analisa otomatis evaluasi trading harian & rekomendasi perbaikan'}
          </p>
        </div>

        <button
          onClick={runDailyAnalysisManual}
          className="px-3 py-1.5 rounded-xl bg-[#0F0F0F] hover:bg-black text-white font-bold text-xs transition-all flex items-center space-x-1 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{settings.language === 'en' ? 'Analyze' : 'Analisa'}</span>
        </button>
      </div>

      {!latestReport ? (
        <div className="card-light p-8 text-center space-y-3">
          <Clock className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
          <h3 className="text-sm font-extrabold text-[#0F0F0F]">{settings.language === 'en' ? 'No 05:00 AM Analysis Yet' : 'Belum Ada Analisa 05:00 AM'}</h3>
          <p className="text-xs text-[#737373] max-w-xs mx-auto">
            {settings.language === 'en' ? 'The system automatically evaluates journals at 5 AM, or you can run analysis now.' : 'Sistem otomatis mengevaluasi jurnal setiap jam 5 pagi, atau Anda dapat menjalankan analisa sekarang.'}
          </p>
          <button
            onClick={runDailyAnalysisManual}
            className="px-4 py-2.5 rounded-2xl bg-[#0F0F0F] text-white font-bold text-xs hover:bg-black transition-all shadow-sm"
          >
            {settings.language === 'en' ? 'Run 05:00 AM Analysis Now' : 'Jalankan Analisa 05:00 AM Sekarang'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Hero Score & Performance Card (10% ACCENT - Pitch Black Card) */}
          <div className="card-dark-hero p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-neutral-900 border border-neutral-800 text-amber-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {settings.language === 'en' ? 'Daily Report' : 'Laporan Harian'} ({latestReport.date})
                  </span>
                  <span className="text-[10px] text-[#A3A3A3]">
                    {settings.language === 'en' ? '05:00 AM Auto Evaluation' : 'Evaluasi otomatis 05:00 AM'}
                  </span>
                </div>
              </div>

              {/* Discipline Score Badge */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[#A3A3A3] block">{settings.language === 'en' ? 'Discipline Score' : 'Disiplin Score'}</span>
                <span className={`text-xl font-black font-mono-num ${
                  latestReport.disciplineScore >= 80 
                    ? 'text-emerald-400' 
                    : latestReport.disciplineScore >= 60 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                }`}>
                  {latestReport.disciplineScore}%
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-neutral-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">{settings.language === 'en' ? 'Total Trades' : 'Total Trade'}</span>
                <span className="font-extrabold text-white font-mono-num">{latestReport.totalTrades}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">Win Rate</span>
                <span className="font-extrabold text-emerald-400 font-mono-num">{latestReport.winRate}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">W / L</span>
                <span className="font-extrabold text-white font-mono-num">{latestReport.winCount}/{latestReport.lossCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#A3A3A3] block">Net PnL</span>
                <span className={`font-extrabold font-mono-num ${latestReport.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {latestReport.netPnl >= 0 ? '+' : ''}{formatCurrency(latestReport.netPnl, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Tactical Lot Advisory for Today */}
          <div className="card-light p-4 border-emerald-300 bg-emerald-50/40 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-extrabold">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>{settings.language === 'en' ? "Today's Action & Lot Advisory" : "Arahan Lot & Tindakan Hari Ini"}</span>
            </div>
            <p className="text-xs text-[#0F0F0F] font-medium">
              {latestReport.lotAdvisory.message}
            </p>
            <div className="text-[11px] text-emerald-700 font-mono-num font-extrabold">
              {settings.language === 'en' ? 'Target Lot' : 'Target Lot'}: {latestReport.lotAdvisory.recommendedLotToday} Lot
            </div>
          </div>

          {/* Section 1: Apa yang Harus Dipertahankan */}
          <div className="card-light p-4 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 text-xs font-extrabold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{settings.language === 'en' ? 'WHAT TO MAINTAIN' : settings.language === 'ms' ? 'APA YANG PERLU DIKEKALKAN' : 'APA YANG HARUS DIPERTAHANKAN'}</span>
            </div>

            <div className="space-y-2">
              {latestReport.whatToMaintain.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-start space-x-2.5 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Apa yang Harus Diimprove */}
          <div className="card-light p-4 space-y-3">
            <div className="flex items-center space-x-2 text-rose-700 text-xs font-extrabold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{settings.language === 'en' ? 'WHAT TO IMPROVE' : settings.language === 'ms' ? 'APA YANG PERLU DITINGKATKAN' : 'APA YANG HARUS DIIMPROVE'}</span>
            </div>

            <div className="space-y-2">
              {latestReport.whatToImprove.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-start space-x-2.5 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Reports Archive */}
          {coachingReports.length > 1 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-[#0F0F0F] flex items-center space-x-1.5 px-1">
                <Calendar className="w-4 h-4 text-[#737373]" />
                <span>{settings.language === 'en' ? 'Historical Analysis Archive' : 'Arsip Laporan Analisa Sebelumnya'}</span>
              </h3>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {coachingReports.slice(1).map((report) => (
                  <div
                    key={report.id}
                    className="card-light p-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-[#0F0F0F] block">{report.date}</span>
                      <span className="text-[10px] text-[#737373]">
                        {report.totalTrades} Trade | Win rate: {report.winRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono-num text-emerald-600">
                        Disiplin {report.disciplineScore}%
                      </span>
                      <span className="text-[10px] text-[#737373] block font-mono-num">
                        {report.netPnl >= 0 ? '+' : ''}{formatCurrency(report.netPnl, settings.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
