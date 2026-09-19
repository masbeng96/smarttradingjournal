import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  Settings, 
  X, 
  Cloud, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Smartphone,
  Globe
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { 
    isSettingsModalOpen, 
    setIsSettingsModalOpen, 
    firebaseConfig, 
    updateFirebaseConfig, 
    isCloudConnected,
    trades,
    settings,
    coachingReports,
    resetOnboarding
  } = useJournal();

  const [apiKey, setApiKey] = useState(firebaseConfig.apiKey || '');
  const [projectId, setProjectId] = useState(firebaseConfig.projectId || '');
  const [authDomain, setAuthDomain] = useState(firebaseConfig.authDomain || '');
  const [useCloud, setUseCloud] = useState(firebaseConfig.useCloudFirestore || false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    updateFirebaseConfig({
      apiKey,
      projectId,
      authDomain,
      useCloudFirestore: useCloud,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportData = () => {
    const fullBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings,
      trades,
      coachingReports,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `trading_journal_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.settings) localStorage.setItem('trading_journal_settings_v1', JSON.stringify(parsed.settings));
        if (parsed.trades) localStorage.setItem('trading_journal_trades_v1', JSON.stringify(parsed.trades));
        if (parsed.coachingReports) localStorage.setItem('trading_journal_coaching_v1', JSON.stringify(parsed.coachingReports));
        alert('Data berhasil diimpor! Aplikasi akan dimuat ulang.');
        window.location.reload();
      } catch (err) {
        alert('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-[#0b0f19] border border-slate-800 rounded-3xl p-5 shadow-2xl relative my-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pengaturan & Database</h3>
              <p className="text-[11px] text-slate-400">Konfigurasi Cloud Firestore & Backup</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsModalOpen(false)}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Firebase Firestore Setup Form */}
        <form onSubmit={handleSaveFirebase} className="space-y-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center space-x-1.5">
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Koneksi Firebase Firestore</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <input
                  type="checkbox"
                  id="useCloudToggle"
                  checked={useCloud}
                  onChange={(e) => setUseCloud(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-800 border-slate-700"
                />
                <label htmlFor="useCloudToggle" className="text-[11px] text-slate-300 font-semibold cursor-pointer">
                  Aktifkan Cloud Sync
                </label>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Sinkronkan jurnal Anda secara real-time ke database Firebase Firestore.
            </p>

            {useCloud && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">Firebase API Key</label>
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-[#070a12] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">Firebase Project ID</label>
                  <input
                    type="text"
                    placeholder="my-trading-journal-app"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-[#070a12] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 text-[10px] block">Auth Domain (Opsional)</label>
                  <input
                    type="text"
                    placeholder="my-project.firebaseapp.com"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    className="w-full bg-[#070a12] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersimpan!</span>
                </>
              ) : (
                <span>Simpan Konfigurasi Database</span>
              )}
            </button>
          </div>
        </form>

        {/* Data Backup & Export / Import */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-300 block">Cadangan & Pemulihan Data</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportData}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center space-x-1.5 font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Backup JSON</span>
            </button>

            <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center space-x-1.5 font-semibold transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>
        </div>

        {/* Android APK & CI/CD Deployment Info */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-950/20 to-slate-900 border border-cyan-500/20 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
              <Smartphone className="w-4 h-4" />
              <span>Android APK & Cloud Run Ready</span>
            </div>
            <button
              onClick={() => {
                resetOnboarding();
                setIsSettingsModalOpen(false);
              }}
              className="text-[10px] text-emerald-400 hover:underline font-semibold"
            >
              Ulangi Onboarding
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Aplikasi siap dikompilasi menjadi file Android APK (`.apk`) atau di-host di Google Cloud Run dengan CI/CD otomatis dari GitHub.
          </p>
        </div>
      </div>
    </div>
  );
};
