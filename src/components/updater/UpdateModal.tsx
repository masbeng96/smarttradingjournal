import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  DownloadCloud, 
  X, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm bg-white border border-[#E5E5E2] rounded-[32px] p-5 shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E2] pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F0F0F] text-white flex items-center justify-center shadow-sm">
              <DownloadCloud className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#0F0F0F]">Pembaruan Aplikasi</h3>
              <p className="text-[10px] text-emerald-700 font-mono-num font-bold">
                Versi {latestVersion.version} (Saat ini: v{currentVersion.version})
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpdateModalOpen(false)}
            className="w-7 h-7 rounded-full bg-[#F2F2EF] border border-[#E5E5E2] text-[#737373] hover:text-[#0F0F0F] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info & Changelog */}
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#F7F7F5] border border-[#E5E5E2] space-y-1">
            <span className="font-bold text-[#0F0F0F] block">{latestVersion.title}</span>
            <span className="text-[10px] text-[#737373]">Rilis: {latestVersion.releaseDate}</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#737373] block">Fitur Baru:</span>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {latestVersion.changelog.map((item, i) => (
                <div key={i} className="flex items-start space-x-2 text-[11px] text-[#525252]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#F7F7F5] border border-[#E5E5E2] text-[10px] text-[#737373] flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-[#0F0F0F] flex-shrink-0" />
            <span>Update langsung berlaku di aplikasi Android & Website Anda.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-2">
          <button
            onClick={triggerAppUpdate}
            className="w-full py-3 rounded-2xl bg-[#0F0F0F] hover:bg-black text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            <span>Perbarui Aplikasi Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsUpdateModalOpen(false)}
            className="w-full py-2 text-center text-xs text-[#737373] hover:text-[#0F0F0F] font-semibold"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
