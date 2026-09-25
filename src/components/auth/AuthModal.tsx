import React, { useState } from 'react';
import { useJournal } from '../../context/JournalContext';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    login, 
    register
  } = useJournal();

  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Harap isi semua kolom.');
      return;
    }

    if (tab === 'REGISTER') {
      if (!displayName.trim()) {
        setErrorMsg('Nama lengkap trader harus diisi.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal harus 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok.');
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === 'REGISTER') {
        await register(email, password, displayName);
        setSuccessMsg('Akun berhasil dibuat! Data Anda otomatis tersinkron.');
      } else {
        await login(email, password);
        setSuccessMsg('Berhasil masuk! Selamat datang kembali.');
      }
      setTimeout(() => {
        setIsAuthModalOpen(false);
        setLoading(false);
      }, 1200);
    } catch (err: any) {
      setLoading(false);
      let message = err.message || 'Terjadi kesalahan autentikasi.';
      if (message.includes('auth/email-already-in-use')) {
        message = 'Email ini sudah terdaftar. Silakan login.';
      } else if (message.includes('auth/invalid-email')) {
        message = 'Format email tidak valid.';
      } else if (message.includes('auth/wrong-password') || message.includes('auth/invalid-credential')) {
        message = 'Email atau password salah.';
      } else if (message.includes('auth/user-not-found')) {
        message = 'Akun dengan email ini belum terdaftar.';
      } else if (message.includes('auth/weak-password')) {
        message = 'Password terlalu lemah, gunakan minimal 6 karakter.';
      }
      setErrorMsg(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white border border-[#E5E5E2] rounded-[32px] p-6 shadow-2xl relative my-auto space-y-5">
        
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2F2EF] border border-[#E5E5E2] text-[#737373] hover:text-[#0F0F0F] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-[#0F0F0F] text-white p-0.5 mx-auto shadow-sm flex items-center justify-center">
            <div className="w-full h-full bg-[#0F0F0F] rounded-[14px] flex items-center justify-center overflow-hidden">
              <img src="/logo-trading.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0F0F0F] tracking-tight">
              {tab === 'LOGIN' ? 'Masuk ke Akun Trader' : 'Daftar Akun Baru'}
            </h3>
            <p className="text-[11px] text-[#737373]">
              Sinkronkan jurnal trading & live sync MT5 Anda
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#F7F7F5] border border-[#E5E5E2] rounded-2xl">
          <button
            type="button"
            onClick={() => { setTab('LOGIN'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'LOGIN'
                ? 'bg-[#0F0F0F] text-white shadow-sm'
                : 'text-[#737373] hover:text-[#0F0F0F]'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => { setTab('REGISTER'); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'REGISTER'
                ? 'bg-[#0F0F0F] text-white shadow-sm'
                : 'text-[#737373] hover:text-[#0F0F0F]'
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'REGISTER' && (
            <div className="space-y-1">
              <label className="text-[#0F0F0F] text-xs font-bold block">Nama Lengkap Trader</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Misal: Alex Wijaya"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-[#0F0F0F] font-semibold placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[#0F0F0F] text-xs font-bold block">Alamat Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-[#0F0F0F] font-semibold placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[#0F0F0F] text-xs font-bold block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-[#0F0F0F] font-semibold placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                required
              />
            </div>
          </div>

          {tab === 'REGISTER' && (
            <div className="space-y-1">
              <label className="text-[#0F0F0F] text-xs font-bold block">Ulangi Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A3A3A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#F7F7F5] border border-[#E5E5E2] rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-[#0F0F0F] font-semibold placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F0F0F] transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-2xl bg-[#0F0F0F] hover:bg-black text-white font-extrabold text-xs transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <span>{tab === 'LOGIN' ? 'Masuk Sekarang' : 'Buat Akun Trader'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest / Offline Mode Note */}
        <div className="pt-2 text-center border-t border-[#E5E5E2]">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="text-[11px] text-[#737373] hover:text-[#0F0F0F] font-semibold"
          >
            Lanjut sebagai Tamu (Mode Offline)
          </button>
        </div>
      </div>
    </div>
  );
};
