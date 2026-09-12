import React from 'react';
import { X, History, Play, Pause, Trash2, Music2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const HistoryModal: React.FC = () => {
  const {
    isHistoryOpen,
    setIsHistoryOpen,
    recentlyPlayed,
    clearHistory,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
  } = useMusic();

  if (!isHistoryOpen) return null;

  function formatTime(secs: number) {
    if (!secs || isNaN(secs)) return '3:20';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  return (
    <div
      id="history-modal-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={() => setIsHistoryOpen(false)}
    >
      <div
        id="history-modal-content"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[85vh] bg-[#18181A] border-t sm:border border-white/10 rounded-t-[36px] sm:rounded-[36px] p-5 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Riwayat Pemutaran
              </h3>
              <p className="text-xs text-white/50">{recentlyPlayed.length} lagu terakhir</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {recentlyPlayed.length > 0 && (
              <button
                id="clear-history-btn"
                onClick={clearHistory}
                className="p-2 text-white/40 hover:text-red-400 rounded-full transition-colors cursor-pointer"
                title="Hapus Riwayat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-2 text-white/50 hover:text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of Tracks */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-1 min-h-[240px]">
          {recentlyPlayed.length > 0 ? (
            recentlyPlayed.map((song) => {
              const isCurrent =
                currentSong?.videoId === song.videoId || currentSong?.id === song.id;

              return (
                <div
                  key={song.id || song.videoId}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playSong(song, recentlyPlayed);
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                    isCurrent ? 'bg-white/10 border border-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10">
                      <img
                        src={song.image}
                        alt={song.title || song.name}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Pause className="w-4 h-4 text-white fill-current" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {song.title || song.name}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {song.artist || song.artists}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-white/40 shrink-0">
                    {formatTime(song.duration)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/40">
              <Music2 className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-medium">Belum ada riwayat pemutaran</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
