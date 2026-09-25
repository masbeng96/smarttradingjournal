import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  Home, 
  LineChart, 
  ShieldCheck, 
  CalendarDays,
  BookOpen,
  Sparkles,
  LucideIcon
} from 'lucide-react';

type NavTabId = 'dashboard' | 'planner' | 'calendar' | 'journal' | 'risk' | 'coaching';

interface TabItem {
  id: NavTabId;
  label: string;
  icon: LucideIcon;
}

const navTabs: TabItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'planner', label: 'Plan', icon: LineChart },
  { id: 'calendar', label: 'News', icon: CalendarDays },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'risk', label: 'Risk', icon: ShieldCheck },
  { id: 'coaching', label: 'Evaluasi', icon: Sparkles },
];

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, settings } = useJournal();

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full lg:max-w-[430px] pointer-events-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
        <div className="bg-white/95 backdrop-blur-2xl border border-[#E5E5E2] rounded-[28px] px-2 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.08)] flex items-center justify-between">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            // Translate the label using the translation file or simple map
            let translatedLabel = tab.label;
            if (settings.language === 'en') {
              if (tab.id === 'coaching') translatedLabel = 'Eval';
              if (tab.id === 'dashboard') translatedLabel = 'Home';
              if (tab.id === 'journal') translatedLabel = 'Journal';
            } else if (settings.language === 'ms') {
              if (tab.id === 'coaching') translatedLabel = 'Penilaian';
              if (tab.id === 'planner') translatedLabel = 'Pelan';
            }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 ${
                  isActive ? 'text-[#0F0F0F] font-bold' : 'text-[#A3A3A3] hover:text-[#525252]'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#F2F2EF]' : 'bg-transparent'}`}>
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105 stroke-[2.5]' : 'stroke-[1.75]'}`} />
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 leading-none">{translatedLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
