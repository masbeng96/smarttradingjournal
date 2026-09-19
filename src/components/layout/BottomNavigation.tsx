import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  LayoutDashboard, 
  LineChart, 
  PlusCircle, 
  ShieldAlert, 
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

type NavTabId = 'dashboard' | 'planner' | 'risk' | 'coaching';

interface TabItem {
  id: NavTabId;
  label: string;
  icon: LucideIcon;
}

const leftTabs: TabItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'planner', label: 'Compound', icon: LineChart },
];

const rightTabs: TabItem[] = [
  { id: 'risk', label: 'Lot & Risk', icon: ShieldAlert },
  { id: 'coaching', label: '5 AM AI', icon: Sparkles },
];

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, setIsNewTradeModalOpen } = useJournal();

  const renderNavTab = (tab: TabItem) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all ${
          isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}
        <Icon className={`w-5 h-5 mb-1 relative z-10 transition-transform ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
        <span className="text-[10px] tracking-tight relative z-10">{tab.label}</span>
      </button>
    );
  };

  return (
    <nav aria-label="Bottom Navigation" className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-[440px] pointer-events-auto px-4 pb-4 pt-2">
        <div className="bg-[#0b0f19]/95 backdrop-blur-2xl border border-slate-800/80 rounded-2xl p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.7)] flex items-center justify-between relative">
          {/* Left Tabs */}
          {leftTabs.map(renderNavTab)}

          {/* Center Action Button */}
          <div className="relative -top-5 flex justify-center px-1">
            <button
              onClick={() => setIsNewTradeModalOpen(true)}
              className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-white p-3.5 shadow-glow-emerald hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
              title="Catat Entry Trade Baru"
            >
              <PlusCircle className="w-6 h-6 text-[#070a12] stroke-[2.5]" />
            </button>
          </div>

          {/* Right Tabs */}
          {rightTabs.map(renderNavTab)}
        </div>
      </div>
    </nav>
  );
};
