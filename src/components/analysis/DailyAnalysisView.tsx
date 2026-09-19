import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw,
  Award
} from 'lucide-react';

export const DailyAnalysisView: React.FC = () => {
  const { 
    coachingReports, 
    latestReport, 
    runDailyAnalysisManual, 
    settings,
    trades 
  } = useJournal();

  return (
    <div className="p-4 space-y-4">
      {/* Title & Manual Simulation Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>05:00 AM Daily Coaching Center</span>
          </h2>
          <p className="text-xs text-slate-400">
            Analisa otomatis performa trading harian & rekomendasi perbaikan
          </p>
        </div>

        <button
          onClick={runDailyAnalysisManual}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1 shadow-glow-gold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Analisa Ulang</span>
        </button>
      </div>

      {!latestReport ? (
        <div className="rounded-3xl p-8 bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Clock className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
          <h3 className="text-sm font-bold text-white">Belum Ada Analisa 05:00 AM</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sistem otomatis mengevaluasi jurnal setiap jam 5 pagi, atau Anda dapat menjalankan analisa sekarang secara instan.
          </p>
          <button
            onClick={runDailyAnalysisManual}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all"
          >
            Jalankan Analisa 05:00 AM Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Hero Score & Performance Card */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/30 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Laporan Harian ({latestReport.date})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Dibuat pada jam 05:00 AM otomatis
                  </span>
                </div>
              </div>

              {/* Discipline Score Badge */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Disiplin Score</span>
                <span className={`text-xl font-black font-mono-num ${
                  latestReport.disciplineScore >= 80 
                    ? 'text-emerald-400 glow-text-emerald' 
                    : latestReport.disciplineScore >= 60 
                      ? 'text-amber-400' 
                      : 'text-rose-400'
                }`}>
                  {latestReport.disciplineScore}%
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-800/80 text-center text-xs">
              <div className="bg-[#070a12]/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Trade</span>
                <span className="font-bold text-white font-mono-num">{latestReport.totalTrades}</span>
              </div>
              <div className="bg-[#070a12]/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Win Rate</span>
                <span className="font-bold text-emerald-400 font-mono-num">{latestReport.winRate}%</span>
              </div>
              <div className="bg-[#070a12]/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">W / L</span>
                <span className="font-bold text-slate-200 font-mono-num">{latestReport.winCount}/{latestReport.lossCount}</span>
              </div>
              <div className="bg-[#070a12]/60 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Net PnL</span>
                <span className={`font-bold font-mono-num ${latestReport.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {latestReport.netPnl >= 0 ? '+' : ''}{formatCurrency(latestReport.netPnl, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Tactical Lot Advisory for Today */}
          <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/40 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>Arahan Lot & Tindakan Hari Ini</span>
            </div>
            <p className="text-xs text-slate-200 font-medium">
              {latestReport.lotAdvisory.message}
            </p>
            <div className="text-[11px] text-emerald-300 font-mono-num font-bold">
              Target Lot: {latestReport.lotAdvisory.recommendedLotToday} Lot
            </div>
          </div>

          {/* Section 1: Apa yang Harus Dipertahankan */}
          <div className="rounded-3xl p-4 bg-slate-900/80 border border-emerald-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>APA YANG HARUS DIPERTAHANKAN</span>
            </div>

            <div className="space-y-2">
              {latestReport.whatToMaintain.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-start space-x-2.5 p-2.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Apa yang Harus Diimprove */}
          <div className="rounded-3xl p-4 bg-slate-900/80 border border-rose-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>APA YANG HARUS DIIMPROVE</span>
            </div>

            <div className="space-y-2">
              {latestReport.whatToImprove.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-start space-x-2.5 p-2.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-xs text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Historical Reports Archive */}
          {coachingReports.length > 1 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Arsip Laporan Analisa Sebelumnya</span>
              </h3>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {coachingReports.slice(1).map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl p-3 bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{report.date}</span>
                      <span className="text-[10px] text-slate-400">
                        {report.totalTrades} Trade | Win rate: {report.winRate}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono-num text-emerald-400">
                        Disiplin {report.disciplineScore}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono-num">
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
