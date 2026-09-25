import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  Bell, 
  Settings, 
  ArrowUpCircle
} from 'lucide-react';

export const TopHeader: React.FC = () => {
  const { 
    unreadNotificationCount, 
    setIsNotificationDrawerOpen, 
    setIsSettingsModalOpen,
    updateAvailable,
    setIsUpdateModalOpen,
    userProfile
  } = useJournal();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'TR';
  };

  return (
    <header className="sticky top-0 z-40 shrink-0 w-full px-5 pt-[max(0.85rem,env(safe-area-inset-top))] pb-3 bg-[#F7F7F5]/95 backdrop-blur-xl border-b border-[#E5E5E2] flex items-center justify-between shadow-sm">
      {/* Left: Greeting & User Name */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#0F0F0F] text-white p-0.5 shadow-sm flex items-center justify-center cursor-pointer active:scale-95 transition-transform overflow-hidden"
          title="Pengaturan Profil Trader"
        >
          {userProfile?.photoURL ? (
            <img 
              src={userProfile.photoURL} 
              alt={userProfile.displayName || 'Profile'} 
              className="w-full h-full object-cover rounded-[14px]" 
            />
          ) : userProfile ? (
            <span className="text-xs font-bold font-mono-num">
              {getInitials(userProfile.displayName || userProfile.email)}
            </span>
          ) : (
            <div className="w-full h-full rounded-[14px] overflow-hidden flex items-center justify-center bg-[#1A1A1A]">
              <img src="/logo-trading.jpg" alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div>
          <span className="text-[11px] text-[#737373] font-medium block leading-tight">
            {getGreeting()}
          </span>
          <h1 className="text-base font-extrabold tracking-tight text-[#0F0F0F] leading-tight flex items-center space-x-1.5">
            <span>{userProfile?.displayName || 'Darpan Trader'}</span>
            <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#0F0F0F] text-white">
              PRO
            </span>
          </h1>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Update available trigger button */}
        {updateAvailable && (
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-semibold animate-pulse"
            title="Update Tersedia"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Update</span>
          </button>
        )}

        {/* Notifications Bell */}
        <button
          onClick={() => setIsNotificationDrawerOpen(true)}
          className="w-8 h-8 rounded-xl bg-white border border-[#E5E5E2] text-[#525252] hover:text-[#0F0F0F] hover:bg-[#F2F2EF] transition-colors relative flex items-center justify-center shadow-sm"
          title="Pemberitahuan"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Dedicated Settings Button */}
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="w-8 h-8 rounded-xl bg-white border border-[#E5E5E2] text-[#525252] hover:text-[#0F0F0F] hover:bg-[#F2F2EF] transition-colors flex items-center justify-center shadow-sm"
          title="Pengaturan Akun & Profil"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
