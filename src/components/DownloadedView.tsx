import React from 'react';
import { ChevronLeft, Download, Play, Music, Trash2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';

export const DownloadedView: React.FC = () => {
  const {
    downloadedSongs,
    toggleDownloadSong,
    setCurrentView,
    playSong,
    currentSong,
    isPlaying,
  } = useMusic();

  return (
    <div className="pb-36 min-h-screen text-white select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3 bg-[#0A0A0C]/85 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('library')}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors cursor-pointer"
            title="Kembali"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Diunduh
            </h1>
            <p className="text-xs text-white/50">{downloadedSongs.length} lagu tersimpan</p>
          </div>
        </div>

        {downloadedSongs.length > 0 && (
          <button
            onClick={() => playSong(downloadedSongs[0], downloadedSongs)}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Putar Semua"
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
        )}
      </div>

      {/* Main List */}
      <div className="px-4 py-4 max-w-2xl mx-auto space-y-2">
        {downloadedSongs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl p-6 bg-white/[0.02]">
            <Download className="w-12 h-12 mx-auto text-white/20 mb-3" />
            <h3 className="text-base font-bold text-white">Belum ada lagu yang diunduh</h3>
            <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
              Lagu yang kamu dengarkan dan simpan untuk diputar saat offline akan muncul di sini.
            </p>
          </div>
        ) : (
          downloadedSongs.map((song, idx) => {
            const isCur = currentSong?.videoId === song.videoId || currentSong?.id === song.id;
            const isSongPlaying = isCur && isPlaying;

            return (
              <div
                key={song.id || song.videoId || idx}
                onClick={() => playSong(song, downloadedSongs)}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer group ${
                  isCur ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-900 shrink-0 shadow-md">
                    <img
                      src={song.image}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isCur ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-bold truncate ${
                        isCur ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDownloadSong(song);
                  }}
                  className="p-2.5 text-white/40 hover:text-red-400 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                  title="Hapus dari unduhan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
