import React from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Sparkles, 
  ArrowUpCircle, 
  ShieldAlert, 
  DownloadCloud 
} from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { 
    isNotificationDrawerOpen, 
    setIsNotificationDrawerOpen, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    setActiveTab,
    setIsUpdateModalOpen
  } = useJournal();

  if (!isNotificationDrawerOpen) return null;

  const handleNotificationClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    setIsNotificationDrawerOpen(false);

    if (notif.type === 'ANALYSIS_5AM') {
      setActiveTab('coaching');
    } else if (notif.type === 'STEP_UP' || notif.type === 'RISK_WARNING') {
      setActiveTab('risk');
    } else if (notif.type === 'UPDATE_AVAILABLE') {
      setIsUpdateModalOpen(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm h-full bg-white border-l border-[#E5E5E2] p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="space-y-3 pb-3 border-b border-[#E5E5E2]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-[#0F0F0F] text-white flex items-center justify-center shadow-sm">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-[#0F0F0F]">Notifikasi & Peringatan</h3>
            </div>
            <button
              onClick={() => setIsNotificationDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-[#F2F2EF] border border-[#E5E5E2] text-[#737373] hover:text-[#0F0F0F] flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={markAllNotificationsAsRead}
                className="text-[11px] text-[#0F0F0F] hover:underline font-bold flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Bell className="w-8 h-8 text-[#A3A3A3] mx-auto" />
              <p className="text-xs text-[#737373]">Belum ada notifikasi.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all space-y-1 ${
                    isUnread
                      ? 'bg-[#F7F7F5] border-[#0F0F0F] shadow-sm'
                      : 'bg-white border-[#E5E5E2] opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {notif.type === 'ANALYSIS_5AM' && <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                      {notif.type === 'STEP_UP' && <ArrowUpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                      {notif.type === 'RISK_WARNING' && <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />}
                      {notif.type === 'UPDATE_AVAILABLE' && <DownloadCloud className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
                      <span className="text-xs font-extrabold text-[#0F0F0F]">{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-[#A3A3A3]">{notif.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#525252] font-medium line-clamp-2 pl-6">
                    {notif.message}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E5E5E2] text-center text-[10px] text-[#A3A3A3] font-medium">
          Smart Notification System v1.0.0
        </div>
      </div>
    </div>
  );
};
