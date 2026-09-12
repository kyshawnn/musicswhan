import React, { useMemo, useEffect, useRef } from 'react';
import { X, Mic2, Music, Loader2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { SyncedLine } from '../types';

export function parseSyncedLyrics(lrcText: string): SyncedLine[] {
  const lines = lrcText.split('\n');
  const result: SyncedLine[] = [];

  for (const rawLine of lines) {
    const text = rawLine.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
    if (!text) continue;

    let match: RegExpExecArray | null;
    const regex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
    while ((match = regex.exec(rawLine)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const totalSeconds = min * 60 + sec + ms / 1000;
      result.push({ time: totalSeconds, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export const LyricsModal: React.FC = () => {
  const {
    currentSong,
    currentTime,
    seekTo,
    isLyricsOpen,
    setIsLyricsOpen,
    lyricsData,
    isLoadingLyrics,
  } = useMusic();

  const activeLineRef = useRef<HTMLParagraphElement | null>(null);

  const syncedLines = useMemo(() => {
    if (!lyricsData?.syncedLyrics) return [];
    return parseSyncedLyrics(lyricsData.syncedLyrics);
  }, [lyricsData?.syncedLyrics]);

  // Find index of current active line matching vocal timestamp
  const activeLineIndex = useMemo(() => {
    if (syncedLines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (currentTime >= syncedLines[i].time - 0.05) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [currentTime, syncedLines]);

  // Auto-scroll to active line smoothly into center view (like Apple Music)
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  if (!isLyricsOpen || !currentSong) return null;

  return (
    <div
      id="spotify-lyrics-view"
      className="fixed inset-0 z-50 bg-[#121212] flex flex-col p-4 sm:p-8 select-none text-white animate-in fade-in duration-200"
    >
      {/* Top Bar - Clean & Minimal */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0 max-w-2xl mx-auto w-full">
        <div className="flex items-center space-x-3 overflow-hidden">
          <img
            src={currentSong.image}
            alt={currentSong.title}
            className="w-12 h-12 rounded-lg object-cover bg-zinc-900 shadow"
          />
          <div className="overflow-hidden">
            <h2 className="text-base sm:text-lg font-bold truncate text-white">{currentSong.title}</h2>
            <p className="text-xs sm:text-sm text-zinc-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
          title="Tutup Lirik"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lyrics Content Area - Apple Music iPhone style */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full scroll-smooth no-scrollbar">
        {isLoadingLyrics ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 text-zinc-400">
            <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
            <p className="text-sm font-medium">Memuat lirik...</p>
          </div>
        ) : lyricsData?.instrumental ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-400">
            <Music className="w-16 h-16 text-zinc-600" />
            <p className="text-xl font-bold text-white">Lagu Instrumental</p>
            <p className="text-sm text-zinc-400">Trek ini tidak memiliki lirik vokal.</p>
          </div>
        ) : syncedLines.length > 0 ? (
          /* Apple Music style lyrics view */
          <div className="space-y-6 sm:space-y-8 text-left px-2 sm:px-4 py-16 pb-60">
            {syncedLines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const isPast = idx < activeLineIndex;

              return (
                <p
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seekTo(line.time)}
                  className={`cursor-pointer select-none leading-relaxed transition-all duration-300 font-bold text-2xl sm:text-3xl md:text-4xl tracking-tight ${
                    isActive
                      ? 'text-white font-black scale-[1.03] origin-left opacity-100'
                      : isPast
                      ? 'text-white/35 hover:text-white/70'
                      : 'text-white/25 hover:text-white/60'
                  }`}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        ) : lyricsData?.plainLyrics ? (
          /* Plain Lyrics fallback */
          <div className="space-y-4 text-left px-2 sm:px-4 py-12">
            <span className="text-xs uppercase font-bold text-white/40 tracking-wider mb-2 block">
              Teks Lirik
            </span>
            <div className="text-xl sm:text-2xl font-bold text-zinc-300 whitespace-pre-line leading-relaxed">
              {lyricsData.plainLyrics}
            </div>
          </div>
        ) : (
          /* No Lyrics Found */
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-400">
            <Mic2 className="w-16 h-16 text-zinc-600" />
            <p className="text-xl font-bold text-white">Lirik Belum Tersedia</p>
            <p className="text-sm text-zinc-400 max-w-sm text-center">
              Lirik untuk lagu "{currentSong.title}" belum tersedia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
