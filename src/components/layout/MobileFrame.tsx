import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const { isMobileDeviceFrame, setIsMobileDeviceFrame } = useJournal();

  return (
    <div className="min-h-screen bg-[#04070e] flex flex-col items-center justify-start text-slate-100 selection:bg-emerald-500/30">
      {/* Desktop Helper Bar for Mobile Preview Toggle */}
      <aside aria-label="Device view toggle" className="hidden lg:flex items-center justify-between w-full max-w-5xl px-6 py-2.5 text-xs text-slate-400 border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-slate-200">Trading Journal & Compound Pro</span>
          <span className="text-slate-500">| Mobile-First Native UI</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-400">Mode Tampilan:</span>
          <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
            <button
              onClick={() => setIsMobileDeviceFrame(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                isMobileDeviceFrame
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone Frame</span>
            </button>
            <button
              onClick={() => setIsMobileDeviceFrame(false)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                !isMobileDeviceFrame
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className={`w-full flex-1 flex justify-center ${isMobileDeviceFrame ? 'lg:py-8' : 'p-0'}`}>
        <div
          className={`w-full transition-all duration-300 ${
            isMobileDeviceFrame
              ? 'max-w-[440px] bg-[#070a12] lg:rounded-[42px] lg:border-[8px] lg:border-slate-800/90 lg:shadow-[0_25px_70px_rgba(0,0,0,0.8)] lg:ring-1 lg:ring-slate-700/50 min-h-screen lg:min-h-[890px] relative flex flex-col overflow-hidden'
              : 'max-w-4xl bg-[#070a12] min-h-screen flex flex-col relative'
          }`}
        >
          {/* Mobile Speaker / Camera Bezel Notch on Desktop Frame */}
          {isMobileDeviceFrame && (
            <div className="hidden lg:flex justify-center pt-2.5 pb-1 bg-transparent z-40">
              <div className="w-24 h-4 bg-slate-900 rounded-full border border-slate-800/60 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-8 h-1 bg-slate-800 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Render Actual App Content */}
          <div className="flex-1 flex flex-col w-full overflow-y-auto pb-24">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
