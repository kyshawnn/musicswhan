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
  Check,
  Bell,
  BellRing,
  Loader2,
  Disc3,
  Video,
  ListMusic,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Share2,
  Radio,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { Song } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const ArtistView: React.FC = () => {
  const {
    selectedArtist,
    setCurrentView,
    playSong,
    currentSong,
    isPlaying,
    togglePlay,
    isLiked,
    toggleLike,
    addToQueue,
    setTrackToAddToPlaylist,
    openArtist,
    isArtistSubscribed,
    toggleSubscribeArtist,
  } = useMusic();

  const [artistData, setArtistData] = useState<any>(null);
  const [topSongs, setTopSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [singles, setSingles] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [similarArtists, setSimilarArtists] = useState<any[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState<boolean>(false);

  // Album Modal
  const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Song[]>([]);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState<boolean>(false);
  const [songSearchQuery, setSongSearchQuery] = useState<string>('');

  const artistName = selectedArtist?.name || 'Artis';
  const isSubscribed = isArtistSubscribed(artistName) || (selectedArtist?.artistId ? isArtistSubscribed(selectedArtist.artistId) : false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const toggleSubscribe = () => {
    const artistImg =
      artistData?.avatar ||
      artistData?.thumbnails?.[0]?.url ||
      selectedArtist?.image ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80';

    toggleSubscribeArtist({
      name: artistName,
      artistId: selectedArtist?.artistId || artistData?.id,
      image: artistImg,
      subscribers: artistData?.subscribers || selectedArtist?.subscribers || 'Artis',
      description: artistData?.description,
    });

    if (isSubscribed) {
      showToast(`Berhenti berlangganan ${artistName}`);
    } else {
      showToast(`Berlangganan ${artistName}`);
    }
  };

  // Fetch artist profile, albums, top music, videos from server
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const query = selectedArtist?.artistId
      ? `id=${encodeURIComponent(selectedArtist.artistId)}`
      : `name=${encodeURIComponent(artistName)}`;

    fetch(`/api/artist?${query}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setArtistData(data);
          if (Array.isArray(data.topSongs)) {
            const songs: Song[] = data.topSongs.map((s: any) => ({
              id: s.videoId ? `yt_${s.videoId}` : s.id,
              videoId: s.videoId,
              title: s.name || s.title || 'Lagu',
              name: s.name || s.title || 'Lagu',
              artist: typeof s.artist === 'string' ? s.artist : s.artist?.name || artistName,
              album: typeof s.album === 'string' ? s.album : s.album?.name || 'Single',
              duration: typeof s.duration === 'number' ? s.duration : 200,
              image:
                s.image ||
                s.thumbnails?.[s.thumbnails.length - 1]?.url ||
                (s.videoId ? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg` : ''),
              source: 'youtube',
            }));
            setTopSongs(songs);
          }
          if (Array.isArray(data.topAlbums)) {
            setAlbums(data.topAlbums);
          }
          if (Array.isArray(data.topSingles)) {
            setSingles(data.topSingles);
          }
          if (Array.isArray(data.topVideos)) {
            setVideos(data.topVideos);
          }
          if (Array.isArray(data.similarArtists)) {
            setSimilarArtists(data.similarArtists);
          }
          if (Array.isArray(data.featuredOn)) {
            setFeaturedPlaylists(data.featuredOn);
          }
        }
      })
      .catch((err) => console.error('Error fetching artist data:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [artistName, selectedArtist?.artistId]);

  const handlePlayAll = () => {
    if (topSongs.length > 0) {
      playSong(topSongs[0], topSongs);
    }
  };

  const handleShuffle = () => {
    if (topSongs.length > 0) {
      const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled);
      showToast('Memutar secara acak');
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '3:20';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Open Album and fetch tracks
  const handleOpenAlbum = async (alb: any) => {
    setSelectedAlbum(alb);
    setIsLoadingAlbum(true);
    setAlbumTracks([]);

    try {
      const albumTitle = alb.name || 'Album';
      const searchRes = await fetch(
        `/api/search?q=${encodeURIComponent(`${albumTitle} ${artistName}`)}&type=song`
      ).then((r) => (r.ok ? r.json() : []));

      if (Array.isArray(searchRes) && searchRes.length > 0) {
        const mapped: Song[] = searchRes.map((s: any) => ({
          id: s.videoId ? `yt_${s.videoId}` : s.id,
          videoId: s.videoId,
          title: s.name || s.title || 'Lagu',
          name: s.name || s.title || 'Lagu',
          artist: typeof s.artist === 'string' ? s.artist : s.artist?.name || artistName,
          album: alb.name || 'Album',
          duration: typeof s.duration === 'number' ? s.duration : 200,
          image:
            s.thumbnail ||
            alb.thumbnails?.[alb.thumbnails.length - 1]?.url ||
            alb.image ||
            `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`,
          source: 'youtube',
        }));
        setAlbumTracks(mapped);
      }
    } catch (err) {
      console.error('Error fetching album tracks:', err);
    } finally {
      setIsLoadingAlbum(false);
    }
  };

  const artistAvatar =
    artistData?.thumbnails?.[artistData?.thumbnails.length - 1]?.url ||
    selectedArtist?.image ||
    topSongs[0]?.image ||
    'https://yt3.googleusercontent.com/No3I8pA9ows2dy6NElEr9mCXLzYxgjVvsQr7h69C03palsH1u8Q8iw-sAAUxav599Wmi64up8lbDGbI=w500-h500-p-l90-rj';

  const isArtistPlaying =
    isPlaying && topSongs.some((s) => s.videoId === currentSong?.videoId || s.id === currentSong?.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: artistName,
        text: `Dengarkan karya terbaik dari ${artistName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Tautan artis disalin ke papan klip');
    }
  };

  return (
    <div id="artist-page" className="pb-36 min-h-screen bg-[#111113] text-white select-none">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Loading Skeleton & Render Animation */}
      {isLoading && !artistData ? (
        <div className="animate-in fade-in duration-300">
          {/* Skeleton Hero Banner */}
          <div className="relative w-full h-[370px] sm:h-[430px] overflow-hidden bg-neutral-900/80 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-neutral-900/60 to-black/40" />

            {/* Floating Top Back */}
            <div className="absolute top-4 left-0 right-0 px-4 sm:px-6 flex items-center justify-between z-20">
              <button
                onClick={() => setCurrentView('home')}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Shimmering Center Spinner & Aura */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/10 animate-ping opacity-30" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-xs text-white/70">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memuat profil {artistName}...</span>
              </div>
            </div>

            {/* Skeleton Bottom Info */}
            <div className="absolute bottom-4 left-0 right-0 px-5 sm:px-8 z-20 space-y-3">
              <div className="h-9 w-48 bg-white/20 rounded-xl animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-28 bg-white/10 rounded-full animate-pulse" />
                <div className="h-9 w-24 bg-white/10 rounded-full animate-pulse" />
                <div className="w-12 h-12 rounded-full bg-red-600/50 animate-pulse ml-auto" />
              </div>
            </div>
          </div>

          {/* Skeleton Content Rows */}
          <div className="px-4 sm:px-6 pt-6 max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-28 bg-white/10 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-4/5 bg-white/5 rounded" />
            </div>

            <div className="space-y-3">
              <div className="h-5 w-32 bg-white/10 rounded" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-2xl bg-white/5 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-white/10 rounded" />
                    <div className="h-3 w-24 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {/* 1. Immersive Hero Banner matching Screenshot 7 */}
          <div className="relative w-full h-[370px] sm:h-[430px] overflow-hidden bg-neutral-900">
            <img
              src={artistAvatar}
              alt={artistName}
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
            {/* Soft Dark Vignette & Bottom Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/55 to-black/40" />

            {/* Floating Top Navigation */}
            <div className="absolute top-4 left-0 right-0 px-4 sm:px-6 flex items-center justify-between z-20">
              <button
                onClick={() => setCurrentView('home')}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95"
                title="Kembali"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg active:scale-95"
                title="Bagikan Artis"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Hero Bottom Info (Artist Name + Action Buttons Row) */}
            <div className="absolute bottom-4 left-0 right-0 px-5 sm:px-8 z-20">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 drop-shadow-md truncate">
                {artistData?.name || artistName}
              </h1>

              <div className="flex items-center gap-3">
                {/* Subscribed / Subscribe Pill Button */}
                <button
                  onClick={toggleSubscribe}
                  className={`px-5 sm:px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-lg active:scale-95 ${
                    isSubscribed
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/20 backdrop-blur-md'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>

                {/* Radio Button */}
                <button
                  onClick={() => {
                    if (topSongs.length > 0) {
                      const shuffled = [...topSongs].sort(() => Math.random() - 0.5);
                      playSong(shuffled[0], shuffled);
                      showToast(`Memutar Radio ${artistName}`);
                    }
                  }}
                  className="px-4 sm:px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md active:scale-95 transition-all cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>Radio</span>
                </button>

                {/* Round Red Play Button */}
                <button
                  onClick={() => {
                    if (isArtistPlaying) {
                      togglePlay();
                    } else {
                      handlePlayAll();
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl ml-auto active:scale-95 transition-all cursor-pointer"
                  title={isArtistPlaying ? 'Jeda' : 'Putar Semua'}
                >
                  {isArtistPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

      <div className="px-4 sm:px-6 pt-4 max-w-2xl mx-auto space-y-7">
        {/* 2. Section: Tentang (matching Screenshot 7) */}
        <div className="border-b border-white/5 pb-5">
          <h3 className="text-xs font-semibold text-white/50 mb-1.5">
            Artist • {artistData?.name || artistName}
          </h3>
          <p
            className={`text-xs sm:text-sm text-white/70 leading-relaxed font-normal ${
              !isBioExpanded ? 'line-clamp-2' : ''
            }`}
          >
            {artistData?.description ||
              `Dengarkan karya-karya terbaik dari ${artistName} di platform ini. Jelajahi berbagai lagu populer, album terbaru, single, dan video musik yang telah dirilis. ${artistName} telah memikat jutaan pendengar di Indonesia dengan karya dan lagu-lagunya yang penuh emosi.`}
          </p>
          <button
            onClick={() => setIsBioExpanded(!isBioExpanded)}
            className="mt-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors cursor-pointer block"
          >
            {isBioExpanded ? 'Tampilkan lebih sedikit' : 'Tampilkan lebih banyak'}
          </button>
        </div>

        {/* 3. Section: Top songs & Discography */}
        <div>
          {(() => {
            const filteredSongs = topSongs.filter((song) => {
              if (!songSearchQuery.trim()) return true;
              const q = songSearchQuery.toLowerCase();
              return (
                (song.title && song.title.toLowerCase().includes(q)) ||
                (song.album && song.album.toLowerCase().includes(q)) ||
                (song.artist && song.artist.toLowerCase().includes(q))
              );
            });

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 px-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Semua Lagu & Top Songs
                    </h2>
                    {topSongs.length > 0 && (
                      <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-medium">
                        {filteredSongs.length} {filteredSongs.length !== topSongs.length ? `/ ${topSongs.length}` : ''} lagu
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {topSongs.length > 5 && (
                      <div className="relative flex-1 sm:w-48">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          type="text"
                          value={songSearchQuery}
                          onChange={(e) => setSongSearchQuery(e.target.value)}
                          placeholder="Cari lagu..."
                          className="w-full bg-white/5 border border-white/10 rounded-full pl-8 pr-7 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
                        />
                        {songSearchQuery && (
                          <button
                            onClick={() => setSongSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {topSongs.length > 0 && (
                      <button
                        onClick={() => playSong(filteredSongs[0] || topSongs[0], filteredSongs.length > 0 ? filteredSongs : topSongs)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white text-black text-xs font-semibold rounded-full hover:bg-white/90 active:scale-95 transition-transform shrink-0 shadow-sm cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Putar Semua
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  {isLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="w-7 h-7 animate-spin text-white/70" />
                    </div>
                  ) : filteredSongs.length === 0 ? (
                    <div className="text-center py-12 text-white/40 text-xs">
                      {songSearchQuery ? `Tidak ada lagu yang cocok dengan "${songSearchQuery}".` : 'Tidak ada lagu untuk artis ini.'}
                    </div>
                  ) : (
                    filteredSongs.map((song, idx) => {
                      const isCurrent =
                        currentSong?.videoId === song.videoId || currentSong?.id === song.id;
                      const isSongPlaying = isCurrent && isPlaying;
                      const liked = isLiked(song.videoId || song.id);

                      return (
                        <div
                          key={song.id || song.videoId || idx}
                          className={`group relative flex items-center gap-3 p-2 rounded-2xl transition-colors cursor-pointer ${
                            isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
                          }`}
                          onClick={() => {
                            if (isCurrent) {
                              togglePlay();
                            } else {
                              playSong(song, filteredSongs);
                            }
                          }}
                        >
                    {/* Album Art */}
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

                    {/* Title & Artist */}
                    <div className="min-w-0 flex-1">
                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCurrent ? 'text-white' : 'text-white/90'
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {song.artist || artistName}
                      </p>
                    </div>

                    {/* Options Menu Button (3 dots) */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          setActiveMenuSongId(
                            activeMenuSongId === (song.id || song.videoId)
                              ? null
                              : song.id || song.videoId || null
                          )
                        }
                        className="p-2 text-white/40 hover:text-white rounded-full transition-colors cursor-pointer"
                        title="Opsi"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuSongId === (song.id || song.videoId) && (
                        <div className="absolute right-0 top-10 w-48 bg-[#1E1E20] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              playSong(song, topSongs);
                              setActiveMenuSongId(null);
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Putar Sekarang
                          </button>
                          <button
                            onClick={() => {
                              toggleLike(song);
                              setActiveMenuSongId(null);
                            }}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left text-white/90 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                          >
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'text-red-500 fill-current' : ''}`} />
                            {liked ? 'Hapus dari Disukai' : 'Sukai Lagu'}
                          </button>
                          <button
                            onClick={() => {
                              addToQueue(song);
                              setActiveMenuSongId(null);
                              showToast('Ditambahkan ke antrean');
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
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      );
    })()}
  </div>

        {/* 4. Album & EP Section */}
        {albums.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Disc3 className="w-5 h-5 text-white/70" />
                Album
              </h2>
              <span className="text-xs text-white/40">{albums.length} Album</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {albums.map((alb, i) => (
                <div
                  key={`${alb.albumId || alb.playlistId || alb.name || 'album'}_${i}`}
                  onClick={() => handleOpenAlbum(alb)}
                  className="bg-[#1C1C1E] border border-white/5 rounded-[28px] p-3 hover:bg-[#26262A] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="aspect-square rounded-[22px] overflow-hidden bg-black/40 mb-2.5 shadow-md relative">
                    <img
                      src={
                        alb.image ||
                        alb.thumbnails?.[alb.thumbnails.length - 1]?.url ||
                        artistAvatar
                      }
                      alt={alb.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate px-1">
                    {alb.name}
                  </h5>
                  <p className="text-[11px] text-white/50 px-1 mt-0.5">
                    {alb.year || 'Album'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Singles & EP Section (if available) */}
        {singles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Single & EP
              </h2>
              <span className="text-xs text-white/40">{singles.length} Rilis</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {singles.slice(0, 6).map((sng, i) => (
                <div
                  key={`${sng.albumId || sng.name || 'single'}_${i}`}
                  onClick={() => handleOpenAlbum(sng)}
                  className="bg-[#1C1C1E] border border-white/5 rounded-[28px] p-3 hover:bg-[#26262A] transition-all cursor-pointer group shadow-lg"
                >
                  <div className="aspect-square rounded-[22px] overflow-hidden bg-black/40 mb-2.5 shadow-md relative">
                    <img
                      src={
                        sng.image ||
                        sng.thumbnails?.[sng.thumbnails.length - 1]?.url ||
                        artistAvatar
                      }
                      alt={sng.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate px-1">
                    {sng.name}
                  </h5>
                  <p className="text-[11px] text-white/50 px-1 mt-0.5">
                    {sng.year || 'Single'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Video Musik Section (if available) */}
        {videos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Video className="w-5 h-5 text-white/70" />
                Video Musik
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 px-1">
              {videos.map((vid, i) => (
                <div
                  key={`${vid.videoId || vid.name || 'video'}_${i}`}
                  onClick={() => {
                    const vSong: Song = {
                      id: `yt_${vid.videoId}`,
                      videoId: vid.videoId,
                      title: vid.name || vid.title || 'Video',
                      name: vid.name || vid.title || 'Video',
                      artist: artistName,
                      album: 'Music Video',
                      duration: vid.duration || 220,
                      image:
                        vid.thumbnails?.[vid.thumbnails.length - 1]?.url ||
                        `https://i.ytimg.com/vi/${vid.videoId}/hqdefault.jpg`,
                      source: 'youtube',
                    };
                    playSong(vSong);
                  }}
                  className="w-56 shrink-0 group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-[24px] overflow-hidden bg-black/40 border border-white/10 shadow-lg">
                    <img
                      src={
                        vid.thumbnails?.[vid.thumbnails.length - 1]?.url ||
                        `https://i.ytimg.com/vi/${vid.videoId}/hqdefault.jpg`
                      }
                      alt={vid.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h5 className="text-xs font-semibold text-white truncate mt-2 px-1">
                    {vid.name || vid.title}
                  </h5>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Artis Serupa (Similar Artists) */}
        {similarArtists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Penggemar Juga Menyukai
              </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
              {similarArtists.map((sim, i) => (
                <div
                  key={`${sim.artistId || sim.name || 'artist'}_${i}`}
                  onClick={() =>
                    openArtist({
                      name: sim.name,
                      artistId: sim.artistId,
                      image:
                        sim.thumbnails?.[sim.thumbnails.length - 1]?.url || sim.image,
                    })
                  }
                  className="flex flex-col items-center gap-2 shrink-0 group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-white/40 transition-all bg-neutral-900 shadow-md">
                    <img
                      src={
                        sim.thumbnails?.[sim.thumbnails.length - 1]?.url ||
                        sim.image ||
                        'https://yt3.googleusercontent.com/No3I8pA9ows2dy6NElEr9mCXLzYxgjVvsQr7h69C03palsH1u8Q8iw-sAAUxav599Wmi64up8lbDGbI=w300-h300-p-l90-rj'
                      }
                      alt={sim.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs font-semibold text-white/90 group-hover:text-white truncate max-w-[85px] text-center">
                    {sim.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </motion.div>
      )}

      {/* Album Tracks Detail Modal */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-[#18181B] border border-white/10 rounded-t-[36px] sm:rounded-[36px] p-6 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header with Close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-neutral-800 shadow-md">
                  <img
                    src={
                      selectedAlbum.image ||
                      selectedAlbum.thumbnails?.[selectedAlbum.thumbnails.length - 1]?.url ||
                      artistAvatar
                    }
                    alt={selectedAlbum.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    {selectedAlbum.year || 'Album'}
                  </span>
                  <h3 className="text-base font-bold text-white truncate">
                    {selectedAlbum.name}
                  </h3>
                  <p className="text-xs text-white/60 truncate">{artistName}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlbum(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Play All Album Button */}
            {albumTracks.length > 0 && (
              <button
                onClick={() => {
                  playSong(albumTracks[0], albumTracks);
                  setSelectedAlbum(null);
                  showToast(`Memutar album ${selectedAlbum.name}`);
                }}
                className="w-full py-3 rounded-full bg-white text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg cursor-pointer mb-4 shrink-0"
              >
                <Play className="w-4 h-4 fill-current" />
                Putar Album
              </button>
            )}

            {/* Album Tracklist */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1">
              {isLoadingAlbum ? (
                <div className="flex justify-center py-12 text-white/50">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
              ) : albumTracks.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-xs">
                  Tidak dapat memuat track album ini.
                </div>
              ) : (
                albumTracks.map((trk, i) => (
                  <div
                    key={`${trk.id || trk.videoId || 'trk'}_${i}`}
                    onClick={() => {
                      playSong(trk, albumTracks);
                      setSelectedAlbum(null);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span className="w-5 text-xs text-white/40 text-center font-bold">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-white truncate">
                        {trk.title}
                      </h4>
                      <p className="text-[11px] text-white/50 truncate">
                        {trk.artist}
                      </p>
                    </div>
                    <span className="text-[11px] text-white/40">
                      {formatDuration(trk.duration)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
