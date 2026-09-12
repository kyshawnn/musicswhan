import React, { useState } from 'react';
import {
  Heart,
  Play,
  Pause,
  Shuffle,
  Search,
  ArrowLeft,
  Share2,
  MoreVertical,
  ListPlus,
  PlusCircle,
  User,
  Check,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '3:20';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const LikedSongsView: React.FC = () => {
  const {
    likedSongs,
    toggleLike,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    setCurrentView,
    openArtist,
    addToQueue,
    setTrackToAddToPlaylist,
  } = useMusic();

  const [filterQuery, setFilterQuery] = useState('');
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const filteredSongs = likedSongs.filter((song) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      (song.title || song.name || '').toLowerCase().includes(q) ||
      (song.artist || song.artists || '').toLowerCase().includes(q) ||
      (song.album || '').toLowerCase().includes(q)
    );
  });

  const handlePlayAll = () => {
    if (filteredSongs.length === 0) return;
    playSong(filteredSongs[0], filteredSongs);
  };

  const handleShuffle = () => {
    if (filteredSongs.length === 0) return;
    const shuffled = [...filteredSongs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
    showToast('Memutar lagu disukai secara acak');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Koleksi Lagu yang Disukai',
        text: `Dengarkan ${likedSongs.length} lagu favorit saya di Aura Musik`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Tautan disalin ke papan klip');
    }
  };

  const isLikedPlaying =
    isPlaying &&
    filteredSongs.some(
      (s) => s.id === currentSong?.id || (s.videoId && s.videoId === currentSong?.videoId)
    );

  const heroBackdrop =
    likedSongs[0]?.image ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80';

  return (
    <div id="liked-songs-page" className="pb-36 min-h-screen text-white select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Immersive Hero Banner matching ArtistView Style */}
      <div className="relative w-full h-[370px] sm:h-[430px] overflow-hidden bg-gradient-to-b from-rose-950/40 via-neutral-900 to-[#0A0A0C]">
        <img
          src={heroBackdrop}
          alt="Lagu yang Disukai"
          className="w-full h-full object-cover object-center filter saturate-125 brightness-90"
          referrerPolicy="no-referrer"
        />

        {/* Soft Dark Rose & Black Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/65 to-black/40" />
        <div className="absolute inset-0 bg-rose-950/20 mix-blend-multiply pointer-events-none" />

        {/* Floating Top Navigation */}
        <div className="absolute top-4 left-0 right-0 px-4 sm:px-6 flex items-center justify-between z-20">
          <button
            onClick={() => setCurrentView('library')}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95"
            title="Bagikan Koleksi"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Bottom Info (Title + Badges + Action Buttons Row) */}
        <div className="absolute bottom-4 left-0 right-0 px-5 sm:px-8 z-20">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-rose-600/90 backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 shadow-lg">
              <Heart className="w-3.5 h-3.5 fill-current" />
              Koleksi Favorit
            </span>
            <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] sm:text-xs font-medium text-white/80">
              {likedSongs.length} Lagu Tersimpan
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-md">
            Lagu yang Disukai
          </h1>
          <p className="text-xs sm:text-sm text-white/70 max-w-xl mb-4 drop-shadow">
            Kumpulan lagu pilihan favoritmu yang siap diputar kapan saja dengan kualitas audio terbaik.
          </p>

          <div className="flex items-center gap-3">
            {/* Play All Button */}
            <button
              onClick={isLikedPlaying ? togglePlay : handlePlayAll}
              disabled={filteredSongs.length === 0}
              className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs sm:text-sm flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {isLikedPlaying ? 'Jeda' : 'Putar Semua'}
            </button>

            {/* Shuffle Button */}
            <button
              onClick={handleShuffle}
              disabled={filteredSongs.length === 0}
              className="px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md border border-white/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Shuffle className="w-4 h-4" />
              Acak
            </button>

            {/* Round Red/Rose Play/Pause Button */}
            <button
              onClick={isLikedPlaying ? togglePlay : handlePlayAll}
              disabled={filteredSongs.length === 0}
              className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl ml-auto active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title={isLikedPlaying ? 'Jeda' : 'Putar Semua'}
            >
              {isLikedPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 max-w-3xl mx-auto space-y-4">
        {/* Search inside liked songs filter */}
        {likedSongs.length > 4 && (
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Cari dalam lagu disukai..."
              className="w-full bg-[#1C1C1E] text-xs text-white placeholder-white/40 pl-10 pr-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-white/30"
            />
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Daftar Lagu
            </span>
          </div>
          <span className="text-xs text-white/40">{filteredSongs.length} Lagu</span>
        </div>

        {/* Track List */}
        {filteredSongs.length === 0 ? (
          <div className="py-20 text-center text-white/40 text-xs space-y-2">
            <Heart className="w-8 h-8 text-white/20 mx-auto" />
            <p>{filterQuery ? 'Tidak ada lagu yang cocok dengan pencarian.' : 'Belum ada lagu yang disukai.'}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredSongs.map((song, idx) => {
              const isCurrent =
                currentSong?.videoId === song.videoId || currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={`${song.id || song.videoId || 'liked'}_${idx}`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playSong(song, filteredSongs);
                    }
                  }}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5 ${
                    isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <span className="w-6 text-center text-xs font-bold text-white/40">
                    {idx + 1}
                  </span>

                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/5 shadow-md">
                    <img
                      src={
                        song.image ||
                        (song.videoId
                          ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`
                          : '')
                      }
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        {isSongPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-white rounded-full animate-pulse" />
                            <span className="w-1 h-4 bg-white rounded-full animate-pulse delay-75" />
                            <span className="w-1 h-2 bg-white rounded-full animate-pulse delay-150" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title & Artist - Plain text, clicking anywhere on item plays */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-rose-400' : 'text-white'
                      }`}
                    >
                      {song.title}
                    </h4>
                    <p className="text-xs text-white/50 truncate block mt-0.5">
                      {song.artist}
                    </p>
                  </div>

                  {/* Duration */}
                  <span className="text-xs text-white/40 hidden sm:inline-block">
                    {formatDuration(song.duration)}
                  </span>

                  {/* Liked Heart Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    className="p-2 text-rose-500 rounded-full transition-transform active:scale-90 cursor-pointer"
                    title="Hapus dari Disukai"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>

                  {/* Options Menu Button */}
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() =>
                        setActiveMenuSongId(
                          activeMenuSongId === song.id ? null : song.id
                        )
                      }
                      className="p-2 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuSongId === song.id && (
                      <div className="absolute right-0 top-10 w-48 bg-[#1E1E20] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            playSong(song, filteredSongs);
                            setActiveMenuSongId(null);
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Putar Sekarang
                        </button>
                        <button
                          onClick={() => {
                            addToQueue(song);
                            setActiveMenuSongId(null);
                            showToast('Ditambahkan ke Antrean');
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <ListPlus className="w-3.5 h-3.5" />
                          Tambah ke Antrean
                        </button>
                        <button
                          onClick={() => {
                            setTrackToAddToPlaylist(song);
                            setActiveMenuSongId(null);
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Tambah ke Playlist
                        </button>
                        {song.artist && (
                          <button
                            onClick={() => {
                              openArtist({ name: song.artist });
                              setActiveMenuSongId(null);
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <User className="w-3.5 h-3.5" />
                            Buka Artis
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
