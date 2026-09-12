import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, MoreVertical, Sparkles, Loader2, Music, ListPlus, PlusCircle } from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';

const GENRE_LIST = [
  'Focus',
  'Chill',
  'Commute',
  'Gaming',
  'Energy',
  'Party',
  'Romance',
  'Sleep',
  'Workout',
  'Indie',
  'Pop',
  'Rock',
  'R&B',
  'Dangdut',
  'Jazz',
  'Klasik',
  'Akustik',
  'Galau',
];

interface GenreData {
  genre: string;
  feelingTitle: string;
  hitsTitle: string;
  feelingTracks: Song[];
  hitTracks: Song[];
  moreTracks: Song[];
}

export const GenreView: React.FC = () => {
  const {
    selectedGenre,
    setSelectedGenre,
    setCurrentView,
    playSong,
    currentSong,
    isPlaying,
    addToQueue,
    setTrackToAddToPlaylist,
  } = useMusic();

  const activeGenre = selectedGenre || 'Focus';
  const [data, setData] = useState<GenreData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/genre?genre=${encodeURIComponent(activeGenre)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (isMounted) {
          if (json) {
            setData(json);
          } else {
            setData({
              genre: activeGenre,
              feelingTitle: `Feeling ${activeGenre.toLowerCase()}`,
              hitsTitle: `${activeGenre} hits`,
              feelingTracks: [],
              hitTracks: [],
              moreTracks: [],
            });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeGenre]);

  const renderHorizontalTrackCard = (song: Song, contextQueue: Song[]) => {
    const isCurrent = currentSong?.videoId === song.videoId || currentSong?.id === song.id;
    const isSongPlaying = isCurrent && isPlaying;

    return (
      <div
        key={song.id || song.videoId}
        onClick={() => playSong(song, contextQueue)}
        className="w-[140px] sm:w-[155px] shrink-0 group flex flex-col cursor-pointer"
      >
        <div className="relative w-[140px] sm:w-[155px] h-[140px] sm:h-[155px] rounded-2xl overflow-hidden mb-2 bg-[#1C1C1E] border border-white/5 group-hover:border-white/20 transition-all shadow-md">
          <img
            src={
              song.image ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'
            }
            alt={song.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src =
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
            }}
          />

          {/* Play status overlay */}
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
              <Play className={`w-4 h-4 fill-current ml-0.5 ${isSongPlaying ? 'animate-pulse' : ''}`} />
            </div>
          </div>
        </div>

        {/* Title and Artist */}
        <div className="px-0.5">
          <h4
            className={`text-xs font-bold truncate leading-snug ${
              isCurrent ? 'text-emerald-400 font-extrabold' : 'text-white'
            }`}
          >
            {song.title}
          </h4>
          <p className="text-[11px] text-white/50 truncate mt-0.5">
            {song.artist}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="pb-36 min-h-screen text-white select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3 bg-[#0A0A0C]/85 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('home')}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 active:scale-95 transition-colors cursor-pointer"
            title="Kembali"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white capitalize">
            {activeGenre}
          </h1>
        </div>
      </div>

      {/* Horizontal Pill Selectors */}
      <div className="px-4 py-3 border-b border-white/5 bg-[#0A0A0C]/50">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {GENRE_LIST.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                activeGenre.toLowerCase() === g.toLowerCase()
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-[#18181A] text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-5 max-w-7xl mx-auto space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin text-white mb-3" />
            <p className="text-sm">Memuat trek suasana {activeGenre}...</p>
          </div>
        ) : (
          <>
            {/* Section 1: Feeling [genre] */}
            {data?.feelingTracks && data.feelingTracks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {data.feelingTitle || `Feeling ${activeGenre.toLowerCase()}`}
                  </h2>
                </div>
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
                  {data.feelingTracks.map((track) =>
                    renderHorizontalTrackCard(track, data.feelingTracks)
                  )}
                </div>
              </div>
            )}

            {/* Section 2: [genre] hits */}
            {data?.hitTracks && data.hitTracks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {data.hitsTitle || `${activeGenre} hits`}
                  </h2>
                </div>
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
                  {data.hitTracks.map((track) =>
                    renderHorizontalTrackCard(track, data.hitTracks)
                  )}
                </div>
              </div>
            )}

            {/* Section 3: More Tracks in this Genre */}
            {data?.moreTracks && data.moreTracks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Populer di {activeGenre}
                  </h2>
                </div>
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1 px-1">
                  {data.moreTracks.map((track) =>
                    renderHorizontalTrackCard(track, data.moreTracks)
                  )}
                </div>
              </div>
            )}

            {/* If no tracks found */}
            {(!data?.feelingTracks || data.feelingTracks.length === 0) &&
              (!data?.hitTracks || data.hitTracks.length === 0) &&
              (!data?.moreTracks || data.moreTracks.length === 0) && (
                <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-6 bg-white/[0.02]">
                  <Music className="w-10 h-10 mx-auto text-white/20 mb-2" />
                  <p className="text-sm font-semibold text-white">
                    Sedang memperbarui koleksi genre {activeGenre}
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    Coba pilih genre lain di atas.
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
};
