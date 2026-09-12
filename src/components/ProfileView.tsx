import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  LogOut,
  Sliders,
  Check,
  Headphones,
  ShieldCheck,
  Volume2,
  Zap,
  Trash2,
  Sparkles,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';

interface GoogleUser {
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  isLoggedIn: boolean;
}

export const ProfileView: React.FC = () => {
  const { setCurrentView, audioQuality, setAudioQuality } = useMusic();

  // Saved user profile in localStorage
  const [user, setUser] = useState<GoogleUser>(() => {
    try {
      const saved = localStorage.getItem('music_google_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: '',
      email: '',
      avatar: '',
      joinedDate: '',
      isLoggedIn: false,
    };
  });

  // Settings states stored in localStorage
  const [volumeNormalization, setVolumeNormalization] = useState<boolean>(() => {
    return localStorage.getItem('setting_vol_norm') !== 'false';
  });
  const [autoPlaySimilar, setAutoPlaySimilar] = useState<boolean>(() => {
    return localStorage.getItem('setting_autoplay') !== 'false';
  });
  const [dataSaver, setDataSaver] = useState<boolean>(() => {
    return localStorage.getItem('setting_datasaver') === 'true';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [customNameInput, setCustomNameInput] = useState('Rei Shawnkys Listener');
  const [customEmailInput, setCustomEmailInput] = useState('nopeee429@gmail.com');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleGoogleLogin = (email: string, name: string) => {
    const newUser: GoogleUser = {
      name: name.trim() || 'Pengguna Google',
      email: email.trim() || 'user@gmail.com',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      joinedDate: new Date().toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      }),
      isLoggedIn: true,
    };
    setUser(newUser);
    localStorage.setItem('music_google_user', JSON.stringify(newUser));
    setShowLoginModal(false);
    showToast(`Berhasil masuk sebagai ${newUser.name}!`);
  };

  const handleLogout = () => {
    const emptyUser: GoogleUser = {
      name: '',
      email: '',
      avatar: '',
      joinedDate: '',
      isLoggedIn: false,
    };
    setUser(emptyUser);
    localStorage.removeItem('music_google_user');
    showToast('Berhasil keluar dari akun Google');
  };

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      showToast('Cache musik & data sementara berhasil dibersihkan!');
    } catch {
      showToast('Gagal membersihkan cache');
    }
  };

  return (
    <div
      id="profile-view-container"
      className="pb-36 pt-4 px-4 max-w-xl mx-auto space-y-6 animate-in fade-in duration-200"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black font-semibold px-5 py-2.5 rounded-full text-xs shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button
            id="profile-back-btn"
            onClick={() => setCurrentView('home')}
            className="p-2.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Profil & Pengaturan</h1>
        </div>
      </div>

      {/* Section 1: User Profile / Google Account Card */}
      <div className="p-5 rounded-3xl bg-[#161618] border border-white/5 relative overflow-hidden shadow-xl">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        {user.isLoggedIn ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10">
            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-800 border-2 border-emerald-500/40 shrink-0 shadow-lg">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#161618]" />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold mb-1">
                <ShieldCheck className="w-3 h-3" />
                Google Terhubung
              </div>
              <h2 className="text-lg font-bold text-white truncate">
                {user.name}
              </h2>
              <p className="text-xs text-white/60 truncate font-mono mt-0.5">
                {user.email}
              </p>
              <p className="text-[11px] text-white/40 mt-1">
                Bergabung sejak {user.joinedDate || '2026'} • Akun Bebas Iklan
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="mt-2 sm:mt-0 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 border border-white/10 text-xs font-medium text-white/70 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Keluar dari akun Google"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-3 relative z-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-white/40 shadow-inner">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Masuk untuk Sinkronisasi Musik
              </h2>
              <p className="text-xs text-white/60 max-w-sm mx-auto mt-1">
                Simpan playlist favorit, riwayat lagu, dan preferensi musik kamu
                di semua perangkat dengan akun Google.
              </p>
            </div>

            {/* Google Sign-In Button */}
            <button
              id="google-signin-btn"
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-white hover:bg-neutral-100 text-black font-semibold text-sm shadow-xl transition-transform active:scale-95 cursor-pointer"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Settings (Pengaturan Lengkap) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
            Pengaturan Audio & Aplikasi
          </h3>
        </div>

        <div className="p-4 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
          {/* Audio Quality Setting */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  Kualitas Streaming Audio
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 uppercase">
                {audioQuality === '320'
                  ? '320 kbps (HD)'
                  : audioQuality === '160'
                  ? '160 kbps (SD)'
                  : 'Otomatis'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['auto', '160', '320'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setAudioQuality(q);
                    showToast(
                      `Kualitas audio disetel ke ${
                        q === '320' ? '320 kbps (HD)' : q === '160' ? '160 kbps (SD)' : 'Otomatis'
                      }`
                    );
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    audioQuality === q
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {q === '320' ? '320 kbps (HD)' : q === '160' ? '160 kbps (SD)' : 'Otomatis'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Volume Normalization Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-white/80">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Normalisasi Volume
                </h4>
                <p className="text-[11px] text-white/50">
                  Ratakan tingkat keras suara di semua trek musik
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !volumeNormalization;
                setVolumeNormalization(next);
                localStorage.setItem('setting_vol_norm', String(next));
                showToast(`Normalisasi volume ${next ? 'diaktifkan' : 'dinonaktifkan'}`);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                volumeNormalization ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  volumeNormalization ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Autoplay Similar Songs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-white/80">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Putar Otomatis Lagu Serupa
                </h4>
                <p className="text-[11px] text-white/50">
                  Otomatis melanjutkan lagu rekomendasi saat antrean habis
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !autoPlaySimilar;
                setAutoPlaySimilar(next);
                localStorage.setItem('setting_autoplay', String(next));
                showToast(`Putar otomatis ${next ? 'aktif' : 'nonaktif'}`);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoPlaySimilar ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  autoPlaySimilar ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Data Saver Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-white/80">
                <Smartphone className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Mode Hemat Data
                </h4>
                <p className="text-[11px] text-white/50">
                  Kurangi penggunaan kuota internet saat streaming
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const next = !dataSaver;
                setDataSaver(next);
                localStorage.setItem('setting_datasaver', String(next));
                showToast(`Mode hemat data ${next ? 'aktif' : 'nonaktif'}`);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                dataSaver ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  dataSaver ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Clear Cache Button */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/5 text-white/80">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">
                  Bersihkan Cache Musik
                </h4>
                <p className="text-[11px] text-white/50">
                  Hapus file thumbnail dan riwayat pemutaran lokal
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
            >
              Bersihkan
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: About Developer & Application (Rei Shawnkys) */}
      <div className="p-5 rounded-3xl bg-[#161618] border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/50">
            Tentang Pembuat & Aplikasi
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-emerald-400 border border-emerald-500/30">
            v2.5.0 Pro
          </span>
        </div>

        {/* Developer Info Card */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-neutral-800 border border-emerald-500/30 p-0.5 shrink-0 shadow-lg">
            <div className="w-full h-full bg-[#1A1A1C] rounded-[14px] flex items-center justify-center text-emerald-400 font-bold text-lg">
              RS
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-white">Rei Shawnkys</h4>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">
              Lead Creator & Developer
            </p>
            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
              Platform streaming musik modern tanpa iklan. Dirancang dengan
              kualitas audio murni 320kbps, lirik sinkron, serta jutaan musik
              hits Indonesia dan mancanegara.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs text-white/70">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Tanpa Iklan</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
            <Headphones className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">Audio Jernih</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
            <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">Latar Belakang Aktif</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">Gratis Sepenuhnya</span>
          </div>
        </div>
      </div>

      {/* Google Login Modal Dialog */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1C] border border-white/10 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">
                Masuk dengan Akun Google
              </h3>
              <p className="text-xs text-white/60">
                Pilih atau masukkan email Google kamu untuk melanjutkan ke
                aplikasi musik
              </p>
            </div>

            {/* Quick One-Click User Card */}
            <div
              onClick={() => handleGoogleLogin('nopeee429@gmail.com', 'Rei Shawnkys Listener')}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                G
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  nopeee429@gmail.com
                </h4>
                <p className="text-[11px] text-white/40">Akun Google Utama</p>
              </div>
              <Check className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Custom Google Account Input */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/60">
                  Nama Tampilan
                </label>
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder="Nama Akun Google"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-white/60">
                  Alamat Email Google
                </label>
                <input
                  type="email"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/70 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleGoogleLogin(customEmailInput, customNameInput)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Masuk Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
