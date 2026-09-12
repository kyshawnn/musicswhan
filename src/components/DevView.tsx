import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const DevView: React.FC = () => {
  const { setCurrentView } = useMusic();

  return (
    <div id="dev-view-page" className="pb-36 min-h-screen text-white select-none">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={() => setCurrentView('home')}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Kembali ke Beranda"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-white tracking-wide">Developer</span>
        <div className="w-10" />
      </div>

      <div className="px-4 pt-6 max-w-lg mx-auto">
        {/* Main Card Container */}
        <div className="bg-[#1A1918]/90 backdrop-blur-xl border border-white/10 rounded-[36px] p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Top Section: Avatar, Name & Bio */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Circular Profile Avatar */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-zinc-700 bg-[#0B0B1E] shadow-2xl p-0.5">
              <img
                src="/dev_avatar.jpg"
                alt="Rei Shawnkys"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  // Fallback pixel art style alien avatar
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Name with Blue Verified Badge */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Rei Shawnkys
              </h1>
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2F80ED] flex items-center justify-center shadow-md shrink-0">
                <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />
              </div>
            </div>

            {/* Bio Description */}
            <p className="text-xs sm:text-sm text-neutral-300/90 leading-relaxed max-w-md font-normal px-2">
              Platform streaming musik yang menghadirkan jutaan lagu dalam satu tempat. Nikmati pengalaman mendengarkan musik tanpa iklan, buat dan kelola playlist pribadi, temukan musik baru setiap hari, serta nikmati kualitas audio premium untuk pengalaman mendengarkan yang lebih nyaman.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-2" />

          {/* Inner About Card */}
          <div className="bg-[#151413] border border-white/5 rounded-[26px] p-5 sm:p-6 text-center space-y-4 shadow-inner">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-200">
              About
            </h2>

            <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed font-normal">
              Data musik dan metadata diperoleh dari layanan pihak ketiga. Seluruh hak atas konten tetap menjadi milik masing-masing pemilik atau pemegang hak.
            </p>

            <p className="text-xs sm:text-[13px] text-neutral-400 leading-relaxed font-normal">
              Platform ini dibangun dengan fokus pada kemudahan penggunaan, kualitas audio, dan pengalaman yang modern. Kami percaya bahwa menikmati musik seharusnya terasa sederhana—cukup pilih lagu, tekan play, dan biarkan musik menemani aktivitas Anda.
            </p>
          </div>

          {/* Footer Copyright */}
          <div className="text-center pt-2 pb-1">
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium tracking-wide">
              &copy; 2026 Shawnkys. All rights reserved.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
