import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  const { isMobileDeviceFrame, setIsMobileDeviceFrame } = useJournal();

  return (
    <div className="h-screen h-[100dvh] w-full bg-[#EBEBE8] text-[#0F0F0F] flex flex-col items-center justify-start selection:bg-neutral-900 selection:text-white overflow-hidden">
      {/* Desktop Helper Bar for Mobile Preview Toggle (Only on wide desktop screens) */}
      <aside aria-label="Device view toggle" className="hidden lg:flex shrink-0 items-center justify-between w-full max-w-5xl px-6 py-2 text-xs text-[#737373] border-b border-[#E5E5E2] bg-[#F7F7F5]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-[#0F0F0F]">Trading Journal Pro</span>
          <span className="text-[#A3A3A3]">| 60-30-10 Mobile UI</span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[#737373] font-medium">Mode Tampilan:</span>
          <div className="bg-white p-1 rounded-xl border border-[#E5E5E2] shadow-sm flex items-center space-x-1">
            <button
              onClick={() => setIsMobileDeviceFrame(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isMobileDeviceFrame
                  ? 'bg-[#0F0F0F] text-white shadow-sm'
                  : 'text-[#737373] hover:text-[#0F0F0F]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone Frame</span>
            </button>
            <button
              onClick={() => setIsMobileDeviceFrame(false)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isMobileDeviceFrame
                  ? 'bg-[#0F0F0F] text-white shadow-sm'
                  : 'text-[#737373] hover:text-[#0F0F0F]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container - Fullscreen 100% on Mobile / Phone Devices */}
      <main className="w-full flex-1 flex justify-center p-0 m-0 overflow-hidden h-full max-h-full">
        <div
          className={`w-full transition-all duration-300 ${
            isMobileDeviceFrame
              ? 'w-full lg:max-w-[430px] bg-[#F7F7F5] lg:my-auto lg:h-[94vh] lg:max-h-[890px] lg:rounded-[44px] lg:border-[8px] lg:border-[#1F1F1F] lg:shadow-[0_25px_70px_rgba(0,0,0,0.14)] lg:ring-1 lg:ring-black/10 h-full max-h-full relative flex flex-col overflow-hidden'
              : 'w-full max-w-4xl bg-[#F7F7F5] h-full max-h-full flex flex-col relative overflow-hidden'
          }`}
        >
          {/* Mobile Speaker / Camera Notch ONLY on Desktop preview frame */}
          {isMobileDeviceFrame && (
            <div className="hidden lg:flex shrink-0 justify-center pt-2.5 pb-1 bg-transparent z-40">
              <div className="w-24 h-4 bg-[#262626] rounded-full flex items-center justify-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#171717]"></div>
                <div className="w-8 h-1 bg-[#171717] rounded-full"></div>
              </div>
            </div>
          )}

          {/* Render Actual App Content */}
          <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-[#F7F7F5]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
