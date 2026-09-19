import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  DownloadCloud, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone 
} from 'lucide-react';

export const UpdateModal: React.FC = () => {
  const { 
    isUpdateModalOpen, 
    setIsUpdateModalOpen, 
    latestVersion, 
    currentVersion,
    triggerAppUpdate 
  } = useJournal();

  if (!isUpdateModalOpen || !latestVersion) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#0b0f19] border border-emerald-500/40 rounded-3xl p-5 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DownloadCloud className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pembaruan Aplikasi Tersedia</h3>
              <p className="text-[10px] text-emerald-400 font-mono-num">
                Versi {latestVersion.version} (Saat ini: v{currentVersion.version})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpdateModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info & Changelog */}
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
            <span className="font-bold text-emerald-300 block">{latestVersion.title}</span>
            <span className="text-[10px] text-slate-400">Rilis: {latestVersion.releaseDate}</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-300 block">Daftar Fitur Baru:</span>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {latestVersion.changelog.map((item, i) => (
                <div key={i} className="flex items-start space-x-2 text-[11px] text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>Update langsung berlaku di aplikasi Android & Website Anda.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            onClick={triggerAppUpdate}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Perbarui Aplikasi Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsUpdateModalOpen(false)}
            className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
