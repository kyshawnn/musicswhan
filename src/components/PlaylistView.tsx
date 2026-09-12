import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Shuffle,
  Heart,
  MoreVertical,
  PlusCircle,
  ListPlus,
  User,
  Trash2,
  Share2,
  Check,
  Music2,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song, Playlist } from '../types';

function formatDuration(sec: number): string {
  if (!sec || isNaN(sec)) return '3:20';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const PlaylistView: React.FC = () => {
  const {
    activePlaylistId,
    setActivePlaylistId,
    selectedPlaylistData,
    setCurrentView,
    playlists,
    currentSong,
    isPlaying,
    playSong,
    togglePlay,
    toggleLike,
    isLiked,
    addToQueue,
    removeFromPlaylist,
    deletePlaylist,
    setTrackToAddToPlaylist,
    openArtist,
  } = useMusic();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const isUserPlaylist = playlists.some((p) => p.id === activePlaylistId);

  useEffect(() => {
    if (!activePlaylistId) return;

    if (selectedPlaylistData && selectedPlaylistData.id === activePlaylistId) {
      setPlaylist(selectedPlaylistData);
      setSongs(selectedPlaylistData.songs || []);

      // If it's a community playlist or only has a preview (fewer than 20 songs), fetch the full 50-100 songs from scraper
      if (!isUserPlaylist && (!selectedPlaylistData.songs || selectedPlaylistData.songs.length < 20)) {
        fetch(`/api/community-playlist-songs?id=${encodeURIComponent(selectedPlaylistData.id)}&title=${encodeURIComponent(selectedPlaylistData.name || '')}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((fullTracks) => {
            if (Array.isArray(fullTracks) && fullTracks.length > 0) {
              setSongs(fullTracks);
              setPlaylist((prev) => (prev ? { ...prev, songs: fullTracks } : prev));
            }
          })
          .catch((err) => console.error('Error fetching full playlist tracks:', err));
      }
      return;
    }

    if (isUserPlaylist) {
      const found = playlists.find((p) => p.id === activePlaylistId);
      if (found) {
        setPlaylist(found);
        setSongs(found.songs || []);
      }
    } else {
      // Fetch full songs for this playlist ID
      fetch(`/api/community-playlist-songs?id=${encodeURIComponent(activePlaylistId)}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((fullTracks) => {
          if (Array.isArray(fullTracks) && fullTracks.length > 0) {
            setSongs(fullTracks);
          }
        })
        .catch((err) => console.error('Error fetching full tracks:', err));
    }
  }, [activePlaylistId, playlists, selectedPlaylistData, isUserPlaylist]);

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    playSong(songs[0], songs);
  };

  const handleShuffle = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0], shuffled);
    showToast('Memutar secara acak');
  };

  const handleShare = () => {
    const title = playlist?.name || 'Playlist';
    if (navigator.share) {
      navigator
        .share({
          title: `${title} - Shawnmusic`,
          text: `Dengarkan playlist "${title}" di Shawnmusic`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Tautan bagikan disalin ke papan klip');
    }
  };

  const isPlaylistPlaying =
    isPlaying &&
    songs.some(
      (s) => s.id === currentSong?.id || (s.videoId && s.videoId === currentSong?.videoId)
    );

  // Backdrop directly from the top/first music track in playlist
  const topSong = songs[0];
  const topSongCover =
    topSong?.image ||
    (topSong?.videoId ? `https://i.ytimg.com/vi/${topSong.videoId}/maxresdefault.jpg` : '') ||
    (topSong?.videoId ? `https://i.ytimg.com/vi/${topSong.videoId}/hqdefault.jpg` : '') ||
    playlist?.image ||
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

  return (
    <div id="playlist-page" className="pb-36 min-h-screen text-white select-none relative">
      {/* Ambient Top Glow from top music cover */}
      <div className="absolute top-0 left-0 right-0 h-[480px] overflow-hidden pointer-events-none -z-0 opacity-40">
        <img
          src={topSongCover}
          alt=""
          className="w-full h-full object-cover filter blur-3xl scale-125 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0C]/80 to-[#0A0A0C]" />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Immersive Hero Banner with Backdrop from top music cover */}
      <div className="relative w-full min-h-[380px] sm:min-h-[440px] overflow-hidden bg-neutral-950 flex flex-col justify-between">
        {/* Blurred + Cinematic Artwork Backdrop Layer */}
        <div className="absolute inset-0">
          <img
            src={topSongCover}
            alt={playlist?.name || 'Playlist'}
            className="w-full h-full object-cover object-center scale-105 filter blur-[2px] brightness-75 transition-all duration-700"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (topSong?.videoId && !target.src.includes('hqdefault.jpg')) {
                target.src = `https://i.ytimg.com/vi/${topSong.videoId}/hqdefault.jpg`;
              } else {
                target.src =
                  playlist?.image ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
              }
            }}
          />
          {/* Vignette gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/80 to-black/45" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C]/90 via-transparent to-[#0A0A0C]/50" />
        </div>

        {/* Floating Top Navigation Header */}
        <div className="relative z-10 flex items-center justify-between p-4 sm:p-6">
          <button
            onClick={() => {
              setActivePlaylistId(null);
              setCurrentView('home');
            }}
            className="p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xl text-white border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xl text-white border border-white/10 transition-all cursor-pointer shadow-lg active:scale-95"
              title="Bagikan"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hero Bottom Meta info & Top Music Artwork Card */}
        <div className="relative z-10 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end gap-5">
          {/* Top Music Cover Thumbnail Card */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0 bg-black/50 group">
            <img
              src={topSongCover}
              alt={topSong?.title || playlist?.name || 'Cover'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (topSong?.videoId && !target.src.includes('hqdefault.jpg')) {
                  target.src = `https://i.ytimg.com/vi/${topSong.videoId}/hqdefault.jpg`;
                } else {
                  target.src =
                    playlist?.image ||
                    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';
                }
              }}
            />
          </div>

          {/* Titles & Action Buttons */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/10 text-neutral-300 border border-white/20 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
                {isUserPlaylist ? 'Koleksi Pribadi' : 'Daftar Putar'}
              </span>
              <span className="text-xs text-white/70 font-medium">
                {songs.length} Lagu
              </span>
              {topSong?.title && (
                <span className="text-[11px] text-emerald-400 font-medium truncate max-w-[240px] bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Lagu Teratas: {topSong.title}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md line-clamp-2">
              {playlist?.name || 'Playlist'}
            </h1>

            {playlist?.description && (
              <p className="text-xs sm:text-sm text-white/70 mt-1 line-clamp-2 max-w-xl font-normal drop-shadow">
                {playlist.description}
              </p>
            )}

            {/* Action Row */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={isPlaylistPlaying ? togglePlay : handlePlayAll}
                disabled={songs.length === 0}
                className="px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-extrabold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition-all shadow-xl cursor-pointer disabled:opacity-50"
              >
                {isPlaylistPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Jeda</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Putar Semua</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShuffle}
                disabled={songs.length === 0}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md border border-white/15 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Shuffle className="w-4 h-4" />
                <span>Acak</span>
              </button>

              {isUserPlaylist && playlist && (
                <button
                  onClick={() => {
                    deletePlaylist(playlist.id);
                    setActivePlaylistId(null);
                    setCurrentView('library');
                  }}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                  title="Hapus Playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Songs Listing Section */}
      <div className="px-4 pt-6 max-w-2xl mx-auto space-y-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            Daftar Lagu ({songs.length})
          </span>
        </div>

        {songs.length === 0 ? (
          <div className="py-20 text-center text-white/40 text-xs space-y-2">
            <Music2 className="w-8 h-8 text-white/20 mx-auto" />
            <p>Belum ada lagu di playlist ini.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {songs.map((song, idx) => {
              const isCurrent =
                currentSong?.videoId === song.videoId || currentSong?.id === song.id;
              const isSongPlaying = isCurrent && isPlaying;
              const liked = isLiked(song.videoId || song.id);

              return (
                <div
                  key={song.id || song.videoId || idx}
                  onClick={() => playSong(song, songs)}
                  className={`group relative flex items-center gap-3 p-2.5 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-white/5 ${
                    isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Index Number */}
                  <span className="w-6 text-center text-xs font-bold text-white/40 shrink-0">
                    {idx + 1}
                  </span>

                  {/* Artwork */}
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
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (song.videoId && !target.src.includes('ytimg.com/vi/')) {
                          target.src = `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`;
                        } else {
                          target.src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';
                        }
                      }}
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

                  {/* Title & Artist */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-emerald-400' : 'text-white'
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

                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song);
                    }}
                    className={`p-2 rounded-full transition-transform active:scale-90 cursor-pointer ${
                      liked ? 'text-red-500' : 'text-white/40 hover:text-white'
                    }`}
                    title={liked ? 'Hapus Suka' : 'Sukai'}
                  >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                  </button>

                  {/* Options Menu */}
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
                            playSong(song, songs);
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
                        {isUserPlaylist && playlist && (
                          <button
                            onClick={() => {
                              removeFromPlaylist(playlist.id, song.id);
                              setActiveMenuSongId(null);
                              showToast('Dihapus dari playlist');
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus dari Playlist
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
