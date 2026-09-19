import React from 'react';
import { JournalProvider, useJournal } from './context/JournalContext';
import { MobileFrame } from './components/layout/MobileFrame';
import { TopHeader } from './components/layout/TopHeader';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { CompoundPlannerView } from './components/planner/CompoundPlannerView';
import { JournalView } from './components/journal/JournalView';
import { RiskLotManagerView } from './components/risk/RiskLotManagerView';
import { DailyAnalysisView } from './components/analysis/DailyAnalysisView';
import { EconomicCalendarView } from './components/calendar/EconomicCalendarView';
import { NewTradeModal } from './components/journal/NewTradeModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';
import { UpdateModal } from './components/updater/UpdateModal';
import { SettingsModal } from './components/settings/SettingsModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { AuthModal } from './components/auth/AuthModal';
import { motion, AnimatePresence } from 'framer-motion';

const MainContent: React.FC = () => {
  const { activeTab } = useJournal();

  return (
    <div className="flex-1 flex flex-col">
      <TopHeader />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="w-full"
          >
            {activeTab === 'dashboard' && <OverviewDashboard />}
            {activeTab === 'planner' && <CompoundPlannerView />}
            {activeTab === 'calendar' && <EconomicCalendarView />}
            {activeTab === 'journal' && <JournalView />}
            {activeTab === 'risk' && <RiskLotManagerView />}
            {activeTab === 'coaching' && <DailyAnalysisView />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNavigation />
      <NewTradeModal />
      <NotificationDrawer />
      <UpdateModal />
      <SettingsModal />
      <OnboardingModal />
      <AuthModal />
    </div>
  );
};

export function App() {
  return (
    <JournalProvider>
      <MobileFrame>
        <MainContent />
      </MobileFrame>
    </JournalProvider>
  );
}

export default App;
